// Every weight typed into an EMOM or an AMRAP box was thrown away the moment
// the workout was saved (tester T-69).
//
// Those boxes are the only writers of the by-exercise map. `liftsToRows()`
// returned as soon as it had written the PER-SET rows, so in any workout that
// had both kinds of block — three of the six on the programme the testers are
// on — the by-exercise map was never read. `completions` has no column for
// it, and the next pull rebuilt the local copy from the rows that were never
// written, so it went from the phone too. Nothing was said.
//
// The suite could not catch this: per-set-weights.test.js puts the same
// exercise names in both maps, which is precisely the case where the early
// return costs nothing.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

AUTH_MEMBER = { id: "jordan" };
function rowsFor(c) { return liftsToRows([c]); }
function has(rows, name) { return rows.filter(function (r) { return r.exercise_name === name; }); }
function key(r) { return [r.member_id, r.completion_client_id, r.exercise_id, r.set_number].join("|"); }

// SHOULDERS/ABS as the finding describes it: three superset blocks logged per
// set, then an EMOM whose weights only ever reach the by-exercise map.
function shouldersAbs() {
  var setWeights = {};
  ["Single Arm Arnold Press", "Around the World Raise", "Front Raise"].forEach(function (n) {
    for (var i = 1; i <= 4; i++) setWeights["0|" + n + "|Set " + i] = 20 + i;
  });
  return {
    id: "local-sa", date: "2026-11-23",
    setWeights: setWeights,
    weights: {
      "Single Arm Arnold Press": 24, "Around the World Raise": 24, "Front Raise": 24,
      "Devils Press": 44, "2-Way Lateral Raise": 15, "Straight Leg DB Crunch": 20,
    },
  };
}

var rows = rowsFor(shouldersAbs());
print("  rows: " + rows.length + " — " + [...new Set(rows.map(function (r) { return r.exercise_name; }))].join(", "));

// ---------------- the three that used to vanish ----------------

check(has(rows, "Devils Press").length === 1, "the EMOM's Devils Press weight is written");
check(has(rows, "2-Way Lateral Raise").length === 1, "and the 2-Way Lateral Raise");
check(has(rows, "Straight Leg DB Crunch").length === 1, "and the Straight Leg DB Crunch");
// Guarded: with the row missing, reading [0].weight throws and takes every
// check after it with it, which is how a mutation report hides its own tail.
check(has(rows, "Devils Press").length === 1 && has(rows, "Devils Press")[0].weight === 44,
  "with the weight the member typed");
check(rows.length === 15, "twelve per-set rows and three from the EMOM, not twelve and nothing");

// ---------------- the per-set rows are untouched ----------------

check(has(rows, "Single Arm Arnold Press").length === 4, "a superset exercise still gets a row per set");
check(has(rows, "Single Arm Arnold Press").every(function (r) { return r.set_label !== null; }),
  "each of them keeps the label the member saw");
check(has(rows, "Devils Press").length === 1 && has(rows, "Devils Press")[0].set_label === null,
  "and an exercise with no per-set screen has no set label to invent");

// ---------------- an exercise in BOTH maps ----------------
// The by-exercise map holds one number for the whole session, so there is no
// honest set to put it on; writing it would land on set 1 and overwrite real
// data. Per set wins, and nothing collides.

check(has(rows, "Front Raise").length === 4,
  "an exercise with per-set rows is not given an extra by-exercise row");
var keys = rows.map(key);
check(new Set(keys).size === keys.length,
  "no two rows share (member, completion, exercise, set_number) — the upsert key");

// ---------------- the shapes either side ----------------

var amrapOnly = rowsFor({ id: "local-a", date: "2026-11-23",
  weights: { "Devils Press": 44, "Wall Ball": 20 } });
check(amrapOnly.length === 2, "an AMRAP-only workout still writes a row per exercise");
check(amrapOnly.every(function (r) { return r.set_number === 1; }), "each at set 1, as before");

var perSetOnly = rowsFor({ id: "local-p", date: "2026-11-23",
  setWeights: { "0|Squat|Set 1": 60, "0|Squat|Set 2": 65 }, weights: { "Squat": 65 } });
check(perSetOnly.length === 2, "a per-set-only workout is unchanged");

check(rowsFor({ id: "local-n", date: "2026-11-23" }).length === 0, "a bodyweight session writes nothing");
check(rowsFor({ id: "local-z", date: "2026-11-23", setWeights: {}, weights: {} }).length === 0,
  "and so do two empty maps");

// The T-65 guard still applies on this branch.
var junk = rowsFor({ id: "local-j", date: "2026-11-23",
  setWeights: { "0|Squat|Set 1": 60 },
  weights: { "Squat": 60, "Devils Press": 0, "Wall Ball": -50, "Burpee": 44 } });
check(has(junk, "Devils Press").length === 0 && has(junk, "Wall Ball").length === 0,
  "a zero or a negative in the by-exercise map is still refused");
check(has(junk, "Burpee").length === 1, "while a real one beside it is kept");

// ---------------- it settles ----------------
// push, pull, push. The pull rebuilds BOTH maps from the rows, so the second
// push must not grow the set — that is the T-23 growth bug's shape.

function roundTrip(c) {
  var once = rowsFor(c);
  var back = [{ id: c.id, date: c.date }];
  liftsOntoCompletions(back, once.map(function (r) {
    return { completion_client_id: c.id, exercise_name: r.exercise_name, exercise_id: r.exercise_id,
             weight: r.weight, set_number: r.set_number, set_label: r.set_label };
  }));
  return { once: once, twice: liftsToRows(back) };
}
var rt = roundTrip(shouldersAbs());
check(rt.twice.length === rt.once.length, "a second push writes the same number of rows");
var f = function (list) { return list.map(function (r) { return r.exercise_name + "#" + r.set_number + "=" + r.weight; }).sort().join(","); };
check(f(rt.once) === f(rt.twice), "and exactly the same rows");
var rt2 = roundTrip({ id: "local-a2", date: "2026-11-23", weights: { "Devils Press": 44 } });
check(f(rt2.once) === f(rt2.twice), "an EMOM-only workout is a fixed point too");

print("\n  " + pass + " passed, " + fail + " failed");
