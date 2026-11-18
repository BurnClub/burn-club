// An app open must not change what is on the server (tester T-23, 2026-11-17).
//
// The T-5 fix made the pull rebuild per-set weights from the server's rows.
// The push then renumbered them 1, 2, 3... from the ORDER of those keys and
// threw the server's own numbers away. That is only a no-op when the numbers
// are already exactly 1..n with no repeats. Anything else - an old workout
// stored one-number-per-exercise, or a phantom row left by the old bug - got
// renumbered onto its neighbours' slots on every single open. Nothing was
// ever deleted, so the next pull read the bigger set back and did it again:
// Jordan's two workouts went 26 -> 31 -> 46 -> 59 -> 76 -> 113 rows over a
// handful of reloads, accelerating, with nothing visible in the app.
//
// The property that was missing is simply this: opening the app twice must
// leave the server exactly as it was. So that is what gets asserted, over
// five cycles, for both shapes that reach real members.
function lifts() {
  return tbl("lifts").map(function (r) {
    return r.exercise_name + "#" + r.set_number + ":" + r.weight + ":" + (r.set_label || "NULL");
  }).sort();
}
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

// Open the app `times` times and report the row count after each one.
async function opens(device, times) {
  var counts = [];
  for (var i = 0; i < times; i++) {
    onDevice(device); await hydrateMemberData(); await settle();
    counts.push(tbl("lifts").length);
  }
  return counts;
}

(async function () {
  // ---- Case 1: an older workout, stored the old way -------------------
  // One number per exercise, which pushes as "set 1, no label" for each.
  // Needs no phantom and no stale device: two weighted exercises is enough.
  // The tester measured 3, 5, 7, 9, 11 rows here - growing forever.
  onDevice("phone");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([{
    id: "c-old", workoutId: "w1", title: "Gym", category: "circuit",
    date: "2026-11-10", minutes: 40,
    weights: { "Goblet Squats": 36, "Kettlebell Swings": 24, "Barbell Deadlift": 95 },
  }]));
  queueSync("completions"); await settle();
  var oldAtPush = lifts();
  print("old-style, at push   " + oldAtPush.length + " rows");
  check(oldAtPush.length === 3, "three exercises make three rows");

  var counts = await opens("phone", 5);
  print("old-style, 5 opens   " + counts.join(", ") + " rows");
  check(counts.every(function (n) { return n === 3; }),
        "five opens leave it at three rows, not 3, 5, 7, 9, 11");
  check(lifts().join("|") === oldAtPush.join("|"),
        "and the rows themselves are untouched");

  // ---- Case 2: a healthy workout and a device still holding the old copy --
  // Confirmed live: the cleanup migration removed Jordan's phantoms and they
  // were back the same day, because a device holding the flattened copy
  // pushes it before it pulls, even on the fixed build.
  SERVER.lifts = []; SERVER.completions = [];
  var swings = [21, 22, 23, 26, 25, 24];
  var dead   = [101, 102, 103, 106, 105, 104];
  var setWeights = {};
  swings.forEach(function (w, i) { setWeights["0|Kettlebell Swings|Set " + (i + 1)] = w; });
  dead.forEach(function (w, i) { setWeights["1|Barbell Deadlift|Set " + (i + 1)] = w; });

  onDevice("phone");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([{
    id: "c-t23", workoutId: "w1", title: "Gym", category: "circuit",
    date: "2026-11-17", minutes: 45,
    weights: { "Kettlebell Swings": 26, "Barbell Deadlift": 106 },
    setWeights: setWeights,
  }]));
  queueSync("completions"); await settle();
  check(tbl("lifts").length === 12, "the healthy workout is twelve rows");

  // The PC never got the fix's pull: it still holds one number per exercise.
  onDevice("pc");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([{
    id: "c-t23", workoutId: "w1", title: "Gym", category: "circuit",
    date: "2026-11-17", minutes: 45,
    weights: { "Kettlebell Swings": 24, "Barbell Deadlift": 104 },
  }]));
  queueSync("completions"); await settle();
  var afterStale = tbl("lifts").length;
  print("after the stale push  " + afterStale + " rows");
  check(afterStale === 12,
        "the stale copy lands on set 1 of each exercise rather than adding rows");

  // Now the fixed phone opens the app over and over. This is the loop that
  // was running away: 12 -> 13 -> 16 -> 22 -> 32 in the tester's harness.
  counts = await opens("phone", 5);
  print("stale case, 5 opens   " + counts.join(", ") + " rows");
  check(counts.every(function (n) { return n === afterStale; }),
        "five opens add nothing, so a damaged workout stops getting worse");

  // And the numbers must still be a clean 1..n per exercise afterwards, or
  // the next open would start the same drift again.
  var byExercise = {};
  tbl("lifts").forEach(function (r) {
    (byExercise[r.exercise_name] = byExercise[r.exercise_name] || []).push(r.set_number);
  });
  var tidy = Object.keys(byExercise).every(function (name) {
    var ns = byExercise[name].slice().sort(function (a, b) { return a - b; });
    return ns.every(function (n, i) { return n === i + 1; });
  });
  check(tidy, "every exercise is numbered 1..n with no gaps and no repeats");
})();
