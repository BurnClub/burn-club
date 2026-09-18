#!/usr/bin/env python3
"""Generate 03-seed-content.sql from the apps' own admin/data.js.

Reads the real seed through jsc rather than a retyped copy, so the database
cannot disagree with the app about what an exercise is. Re-run it whenever
data.js changes; the output is idempotent, so running the SQL twice is safe.
"""
import json, subprocess, sys, os

JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
HERE = os.path.dirname(os.path.abspath(__file__))

def dump():
    out = subprocess.run([JSC, os.path.join(HERE, "..", "admin", "data.js"),
                          os.path.join(HERE, "dump-content.js")],
                         capture_output=True, text=True)
    if out.returncode or not out.stdout.strip():
        sys.exit("jsc failed:\n" + out.stderr)
    return json.loads(out.stdout)

def lit(v):
    """A SQL literal. Dollar-quoted text so apostrophes in technique cues and
    exercise names need no escaping and cannot break out of the string."""
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, list):
        if not v: return "'{}'"
        if all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
            return "'{" + ",".join(str(x) for x in v) + "}'"
        return "array[" + ", ".join(lit(str(x)) for x in v) + "]::text[]"
    if isinstance(v, dict): return lit(json.dumps(v)) + "::jsonb"
    s = str(v)
    tag = "$s$"
    n = 1
    while tag in s:
        tag = "$s%d$" % n; n += 1
    return tag + s + tag

def jlit(v):
    """A jsonb literal. Everything goes through json.dumps, including lists and
    scalars — lit() would render a list as a Postgres array, which is correct
    for text[] columns and wrong for this one."""
    return lit(json.dumps(v)) + "::jsonb"

# Columns whose type lit() cannot infer from the Python value alone.
JSONB_COLUMNS = {("app_settings", "value")}

def insert(table, rows, cols, conflict):
    if not rows: return []
    out = ["", "-- %s (%d)" % (table, len(rows))]
    CHUNK = 200
    for i in range(0, len(rows), CHUNK):
        part = rows[i:i+CHUNK]
        out.append("insert into %s (%s) values" % (table, ", ".join(cols)))
        out.append(",\n".join("  (" + ", ".join(
            (jlit(r.get(c)) if (table, c) in JSONB_COLUMNS else lit(r.get(c)))
            for c in cols) + ")" for r in part))
        out.append(conflict + ";")
    return out

def column_types(path):
    """Column name -> declared type, read out of 01-schema.sql. Parsing the DDL
    rather than restating it here means the check cannot drift from the schema
    it is checking."""
    import re
    sql = open(path, encoding="utf-8").read()
    sql = "\n".join(re.sub(r"--.*$", "", l) for l in sql.split("\n"))
    types = {}
    for m in re.finditer(r"create table (\w+)\s*\((.*?)\n\);", sql, re.S):
        table, body = m.group(1), m.group(2)
        for line in body.split("\n"):
            c = re.match(r"\s*(\w+)\s+(text\[\]|int\[\]|jsonb|text|int|boolean|date|numeric|uuid|bigint|timestamptz)(?=[\s,)])", line)
            if c and c.group(1) not in ("primary", "unique", "check", "foreign"):
                types[(table, c.group(1))] = c.group(2)
    return types

def check_types(d, types):
    """Every value against its column's declared type. The bug this exists for:
    app_settings.value is jsonb and exercises.body_parts is text[], both fed a
    Python list, and only the column knows which is which."""
    sets = [("programs", d["programs"]), ("folders", d["folders"]),
            ("exercises", d["exercises"]), ("workouts", d["workouts"]),
            ("benchmarks", d["benchmarks"]), ("schedule_slots", d["schedule"]),
            ("app_settings", d["app_settings"]), ("block_format_notes", d["block_format_notes"]),
            ("workout_blocks", d["blocks"])]
    ok = {
        "text": (str,), "jsonb": (dict, list, str, int, float, bool),
        "int": (int,), "bigint": (int,), "boolean": (bool,), "date": (str,),
        "numeric": (int, float), "uuid": (str,), "timestamptz": (str,),
        "text[]": (list,), "int[]": (list,),
    }
    bad = []
    for table, rows in sets:
        for r in rows:
            for col, v in r.items():
                if v is None or col == "key" and table != "app_settings":
                    continue
                t = types.get((table, col))
                if not t:
                    continue
                if isinstance(v, bool) and t not in ("boolean", "jsonb"):
                    bad.append((table, col, t, "bool")); continue
                if not isinstance(v, ok[t]):
                    bad.append((table, col, t, type(v).__name__))
                if t == "text[]" and isinstance(v, list) and not all(isinstance(x, str) for x in v):
                    bad.append((table, col, t, "list with non-text"))
    return sorted(set(bad))

def main():
    d = dump()
    if d.get("__unresolved"):
        sys.exit("unresolved exercise names, refusing to generate:\n  "
                 + "\n  ".join(sorted(d["__unresolved"])))

    types = column_types(os.path.join(HERE, "01-schema.sql"))
    mismatches = check_types(d, types)
    if mismatches:
        sys.exit("value/column type mismatches, refusing to generate:\n  "
                 + "\n  ".join("%s.%s is %s, got %s" % m for m in mismatches))
    print("type check: %d columns known, no mismatches" % len(types))

    L = ["-- Burn Club — content seed. GENERATED by generate-seed.py; do not hand-edit.",
         "-- Source: admin/data.js. Re-run the generator after changing it.",
         "-- Idempotent: every insert upserts, so running this twice is safe.",
         "", "begin;"]

    L += insert("programs", d["programs"],
        ["id","name","schedule_type","status","duration_weeks","workouts_per_week",
         "circuits_per_week","description","color"],
        "on conflict (id) do update set name = excluded.name, schedule_type = excluded.schedule_type,"
        " status = excluded.status, duration_weeks = excluded.duration_weeks,"
        " workouts_per_week = excluded.workouts_per_week, circuits_per_week = excluded.circuits_per_week,"
        " description = excluded.description, color = excluded.color")

    L += insert("folders", d["folders"], ["id","name","program_id","is_live"],
        "on conflict (id) do update set name = excluded.name, program_id = excluded.program_id,"
        " is_live = excluded.is_live")

    L += insert("exercises", d["exercises"],
        ["id","name","body_parts","equipment","modality","technique","track_weight"],
        "on conflict (id) do update set name = excluded.name, body_parts = excluded.body_parts,"
        " equipment = excluded.equipment, modality = excluded.modality,"
        " technique = excluded.technique, track_weight = excluded.track_weight")

    L += insert("workouts", d["workouts"],
        ["id","program_id","folder_id","slot_id","variant","available_from","is_always",
         "category","tag","title","focus","difficulty","description","is_benchmark","benchmark_id"],
        "on conflict (id) do update set program_id = excluded.program_id, folder_id = excluded.folder_id,"
        " slot_id = excluded.slot_id, variant = excluded.variant, available_from = excluded.available_from,"
        " is_always = excluded.is_always, category = excluded.category, tag = excluded.tag,"
        " title = excluded.title, focus = excluded.focus, difficulty = excluded.difficulty,"
        " description = excluded.description, is_benchmark = excluded.is_benchmark,"
        " benchmark_id = excluded.benchmark_id")

    L += insert("benchmarks", d["benchmarks"], ["id","program_id","name","subtitle","score_type"],
        "on conflict (id) do update set name = excluded.name, subtitle = excluded.subtitle,"
        " score_type = excluded.score_type")

    L += insert("schedule_slots", d["schedule"], ["program_id","day","type","workout_slot_id"],
        "on conflict (program_id, day) do update set type = excluded.type,"
        " workout_slot_id = excluded.workout_slot_id")

    L += insert("app_settings", d["app_settings"], ["key","value"],
        "on conflict (key) do update set value = excluded.value")
    L += insert("block_format_notes", d["block_format_notes"], ["block_type","body"],
        "on conflict (block_type) do update set body = excluded.body")

    # Blocks are replaced wholesale rather than upserted: a workout edited to
    # have fewer blocks must not keep the ones it no longer has.
    L += ["", "-- blocks and their exercises are replaced, not upserted: a workout edited",
          "-- to have fewer blocks must not keep the ones it no longer has.",
          "delete from workout_blocks;"]

    L += insert("workout_blocks", d["blocks"],
        ["workout_id","position","type","label","rounds","work_sec","rest_sec",
         "duration_sec","interval_sec","scheme"],
        "on conflict (workout_id, position) do nothing")

    # block_exercises needs each block's generated id, so the rows arrive as a
    # VALUES list joined back to workout_blocks on (workout_id, position) —
    # one statement per chunk instead of one per row, which is the difference
    # between a file the SQL editor accepts and one it times out on.
    bykey = {b["key"]: (b["workout_id"], b["position"]) for b in d["block_exercises"] and d["blocks"]}
    rows = []
    for e in d["block_exercises"]:
        wid, bpos = bykey[e["block_key"]]
        rows.append((wid, bpos, e["position"], e["exercise_id"], e.get("sets"), e.get("reps")))
    if rows:
        L += ["", "-- block_exercises (%d)" % len(rows)]
        CHUNK = 250
        for i in range(0, len(rows), CHUNK):
            part = rows[i:i+CHUNK]
            L.append("insert into block_exercises (block_id, position, exercise_id, sets, reps)")
            L.append("select b.id, v.position, v.exercise_id, v.sets, v.reps from (values")
            L.append(",\n".join("  (%s, %s, %s, %s, %s, %s)"
                                % (lit(r[0]), lit(r[1]), lit(r[2]), lit(r[3]), lit(r[4]), lit(r[5]))
                                for r in part))
            L.append(") as v(workout_id, block_position, position, exercise_id, sets, reps)")
            L.append("join workout_blocks b on b.workout_id = v.workout_id and b.position = v.block_position;")

    L += ["", "commit;", ""]

    path = os.path.join(HERE, "03-seed-content.sql")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print("wrote %s" % path)
    for k in ("programs","folders","exercises","workouts","blocks","block_exercises","schedule","benchmarks"):
        print("  %-16s %d" % (k, len(d[k])))

if __name__ == "__main__":
    main()
