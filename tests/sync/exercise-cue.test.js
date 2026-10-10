// A per-slot cue ("Left Leg") must never reach the reporting tables as part
// of the exercise (Chris, 2026-10-09: "if we make it so we can edit the
// exercise name, will that end up breaking everything when it comes to
// reporting?").
//
// It would have. exerciseIdForName slugifies any name the library doesn't
// know, so a slot named "Bulgarian Split Squats - Left Leg" logs under the id
// "bulgarian-split-squats-left-leg" — a second exercise, with its own history
// and its own PRs, that no library entry will ever match again. The fix is to
// store only the suffix and join it for display, so what the player writes
// into setWeights is still the library name.
//
// This file guards that boundary: both legs of a cued pair land on ONE
// exercise id, and the cue survives only as the set label.
var EXERCISE_LIBRARY = [
  { id: "bulgarian-split-squats", name: "Bulgarian Split Squats" },
];
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }

(async function () {
  onDevice("phone");

  // What the player writes for a superset of Bulgarians cued Left/Right. The
  // key's middle segment is the exercise, and the cue rides in the label —
  // see weightEntriesForBlock in app.js.
  var completion = {
    id: "c-cue-1", title: "Leg Day", category: "circuit", date: "2026-10-09",
    minutes: 45,
    setWeights: {
      "0|Bulgarian Split Squats|Round 1 · Left Leg": 35,
      "0|Bulgarian Split Squats|Round 1 · Right Leg": 30,
    },
  };
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([completion]));
  markDirty("completions");
  await hydrateMemberData(); await settle();

  var rows = tbl("lifts");
  print("logged      " + JSON.stringify(rows.map(function (r) {
    return { id: r.exercise_id, name: r.exercise_name, label: r.set_label, weight: r.weight };
  })));

  check(rows.length === 2, "both cued sets are logged");
  check(rows.every(function (r) { return r.exercise_id === "bulgarian-split-squats"; }),
        "both legs file under the one library exercise id");
  check(rows.every(function (r) { return r.exercise_name === "Bulgarian Split Squats"; }),
        "the cue is not baked into the exercise name");
  check(!rows.some(function (r) { return /left|right/i.test(r.exercise_id); }),
        "no phantom per-side exercise is invented");
  check(rows.some(function (r) { return r.set_label === "Round 1 · Left Leg"; })
        && rows.some(function (r) { return r.set_label === "Round 1 · Right Leg"; }),
        "the cue survives as the set label, so the member can tell them apart");

  // The whole point of keeping the id clean: history for the movement has to
  // include both legs rather than splitting in two.
  onDevice("pc");
  await hydrateMemberData(); await settle();
  var pulled = JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)) || "[]");
  var weights = (pulled[0] || {}).weights || {};
  print("pulled back   " + JSON.stringify(weights));
  check(Object.keys(weights).length === 1 && weights["Bulgarian Split Squats"] != null,
        "a second device reads both legs back as one movement's history");

  // And a cue is not required: an uncued slot writes the same shape it always
  // has, which is what every workout built before today looks like.
  onDevice("phone");
  var plain = JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)));
  plain[0].setWeights = { "0|Bulgarian Split Squats|Set 1": 40 };
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(plain));
  markDirty("completions");
  await hydrateMemberData(); await settle();
  var plainRow = tbl("lifts").filter(function (r) { return r.set_label === "Set 1"; })[0];
  check(!!plainRow && plainRow.exercise_id === "bulgarian-split-squats" && plainRow.weight === 40,
        "an uncued slot is unaffected");
})();
