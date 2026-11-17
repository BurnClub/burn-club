// Per-set weights must survive a round trip (tester T-5, 2026-11-17).
//
// A member logged six sets of two exercises. Two app opens later the server
// had been rewritten: the first exercise's set 1 replaced by a later set's
// weight with its label blanked, and the second exercise given a phantom
// extra "set 1". No error anywhere, on any device. Every multi-set lift on
// the live database had already been damaged this way.
//
// The sequence is the whole bug, so the test is the sequence: finish, open,
// open again, and compare the server with what was logged.
function comps() { return JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)) || "[]"); }
function lifts() {
  return tbl("lifts").map(function (r) {
    return r.exercise_name + "#" + r.set_number + ":" + r.weight + ":" + (r.set_label || "NULL");
  }).sort();
}
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

(async function () {
  var swings = [21, 22, 23, 26, 25, 24];        // heaviest is set 4, not the last
  var dead   = [101, 102, 103, 106, 105, 104];
  var setWeights = {};
  swings.forEach(function (w, i) { setWeights["0|Kettlebell Swings|Set " + (i + 1)] = w; });
  dead.forEach(function (w, i) { setWeights["1|Barbell Deadlift|Set " + (i + 1)] = w; });

  onDevice("phone");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([{
    id: "c-t5", workoutId: "w1", title: "Gym", category: "circuit",
    date: "2026-11-17", minutes: 45,
    // What logCompletion() now stores: the HEAVIEST per exercise, not the last
    // number typed. A member who works up to 26 and backs off to 24 on the
    // last set has lifted 26.
    weights: { "Kettlebell Swings": 26, "Barbell Deadlift": 106 },
    setWeights: setWeights,
  }]));
  queueSync("completions"); await settle();
  var atFinish = lifts();
  print("at finish      " + atFinish.length + " rows");
  check(atFinish.length === 12, "all twelve sets reach the server");

  // Open the app again: this is the pull that used to flatten the phone's copy
  // to one number per exercise.
  onDevice("phone"); await hydrateMemberData(); await settle();
  var c = comps()[0] || {};
  print("after open 1   weights=" + JSON.stringify(c.weights));
  check(Object.keys(c.setWeights || {}).length === 12, "the per-set detail survives the pull");
  check(c.weights["Kettlebell Swings"] === 26 && c.weights["Barbell Deadlift"] === 106,
        "and the top weight is the heaviest, not whichever row came back last");

  // Open it once more: this is the push that used to send the flattened copy
  // back as "set 1, no label".
  onDevice("phone"); await hydrateMemberData(); await settle();
  var after = lifts();
  print("after open 2   " + after.length + " rows");
  check(after.length === 12, "no phantom set is added");
  check(after.join("|") === atFinish.join("|"), "the server still holds exactly what was logged");
  check(after.filter(function (r) { return r.indexOf(":NULL") !== -1; }).length === 0,
        "no row has had its set label blanked");

  // A second device must see the same thing.
  onDevice("pc"); await hydrateMemberData(); await settle();
  var pc = comps()[0] || {};
  check(Object.keys(pc.setWeights || {}).length === 12, "a second device gets the per-set detail too");
  check(pc.weights["Barbell Deadlift"] === 106, "and the same top weight");
})();
