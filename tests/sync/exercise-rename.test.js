// A member's training history must survive an exercise being renamed
// (Chris, 2026-10-08: "we dont change names often, but if we do i dont eant
// everythign brokem").
//
// Before 14-exercise-id.sql, `lifts` was keyed by exercise_name and the app
// looked history up by name. Rename "Barbell Bench Press" and every set the
// member had logged against it became unreachable — still in the table, but
// invisible to a UI now asking about a name nothing had been filed under.
// Nothing reported it. That is the failure this file exists to catch.
//
// EXERCISE_LIBRARY is defined here because the runner loads sync.js alone;
// the id resolution falls back to slugifying when there is no library, which
// is exactly what happens for an exercise that has been deleted.
var EXERCISE_LIBRARY = [
  { id: "barbell-bench-press", name: "Barbell Bench Press" },
  { id: "weighted-situps", name: "Weighted Sit-Ups" },
];
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }

(async function () {
  onDevice("phone");

  // A workout, with a weight logged against the press.
  var completion = {
    id: "c-rename-1", title: "Push Day", category: "circuit", date: "2026-10-08",
    minutes: 40, weights: { "Barbell Bench Press": 135 },
  };
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([completion]));
  markDirty("completions");
  await hydrateMemberData(); await settle();

  var row = tbl("lifts")[0];
  print("logged      " + JSON.stringify({ id: row && row.exercise_id, name: row && row.exercise_name, weight: row && row.weight }));
  check(!!row && row.exercise_id === "barbell-bench-press",
        "a lift is filed under the exercise id, not just its name");

  // Chris renames it in the library. The member's row is untouched — it still
  // says "Barbell Bench Press", which is what it was called at the time.
  EXERCISE_LIBRARY[0].name = "Barbell Bench Press (Flat)";

  // A second device signs in and pulls. The weight must come back attached to
  // the exercise as it is called NOW, or the member's history has vanished.
  onDevice("pc");
  await hydrateMemberData(); await settle();
  var pulled = JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)) || "[]");
  var weights = (pulled[0] || {}).weights || {};
  print("after rename  " + JSON.stringify(weights));
  check(weights["Barbell Bench Press (Flat)"] === 135,
        "and the history follows the rename instead of disappearing");
  check(!weights["Barbell Bench Press"],
        "it is not left under the old name as well, which would double-count it");

  // Logging again under the new name must land on the SAME row. Keyed by name
  // this produced a second row, and the member's history silently forked.
  onDevice("phone");
  var again = JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)));
  again[0].weights = { "Barbell Bench Press (Flat)": 145 };
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(again));
  markDirty("completions");
  await hydrateMemberData(); await settle();
  print("lift rows    " + tbl("lifts").length + "  weights=" + tbl("lifts").map(function (r) { return r.weight; }).join(","));
  check(tbl("lifts").length === 1, "re-logging after a rename updates the row rather than forking it");
  check(tbl("lifts")[0].weight === 145, "and the new weight is the one kept");

  // An exercise the library has never heard of still gets a stable id, so a
  // deleted exercise does not land with a null key.
  check(exerciseIdForName("Something Deleted") === "something-deleted",
        "an unknown exercise still resolves to a stable id");
  check(exerciseIdForName("Weighted Sit-Ups") === "weighted-situps",
        "and a hand-authored id wins over slugifying the name");
})();
