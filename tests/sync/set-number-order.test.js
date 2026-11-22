// Weights were filed against the set they were TYPED in, not the set they
// belong to (tester T-61).
//
// liftsToRows() numbered each exercise's sets from Object.keys() order.
// Clearing a box deletes that key and retyping re-inserts it at the end, so
// going back to fix one number moved it to the bottom; a descending scheme
// entered from the lightest set up came out exactly inverted. The set labels
// were in the keys the whole time. This drives the real liftsToRows, and the
// real pull, so a round trip is checked rather than assumed.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

function rowsFor(setWeights) {
  return liftsToRows([{ id: "local-x", date: "2026-11-21", setWeights: setWeights }]);
}
// "Set 1=90" per row, in set_number order, so a wrong filing is readable.
function filing(rows) {
  return rows.slice().sort(function (a, b) { return a.set_number - b.set_number; })
    .map(function (r) { return r.set_label + "=" + r.weight + "@" + r.set_number; }).join("  ");
}
function numberFor(rows, label) {
  var r = rows.filter(function (x) { return x.set_label === label; })[0];
  return r ? r.set_number : null;
}

// ---------------- the way the member actually breaks it ----------------

// A descending scheme typed from the bottom up.
var bottomUp = {};
bottomUp["0|Deadlift|Set 4"] = 60;
bottomUp["0|Deadlift|Set 3"] = 70;
bottomUp["0|Deadlift|Set 2"] = 80;
bottomUp["0|Deadlift|Set 1"] = 90;
var rows = rowsFor(bottomUp);
print("  bottom-up: " + filing(rows));
check(numberFor(rows, "Set 1") === 1 && numberFor(rows, "Set 4") === 4,
  "a descending scheme entered bottom-up is not inverted");
check(rows.filter(function (r) { return r.set_number === 1; })[0].weight === 90,
  "set 1 keeps the weight that was done on set 1");

// Fill top to bottom, then go back and fix set 1: the key is deleted and
// re-inserted at the end. This is the sighting from the live server.
var fixed = {};
["Set 1","Set 2","Set 3","Set 4","Set 5","Set 6"].forEach(function (l, i) { fixed["0|Cable Row|" + l] = 50 + i; });
delete fixed["0|Cable Row|Set 1"];
fixed["0|Cable Row|Set 1"] = 47;
rows = rowsFor(fixed);
print("  corrected set 1: " + filing(rows));
check(numberFor(rows, "Set 1") === 1, "correcting set 1 does not send it to the bottom");
check(numberFor(rows, "Set 6") === 6, "and set 6 stays where it was");

// The ordinary case is untouched.
var inOrder = {};
["Set 1","Set 2","Set 3"].forEach(function (l, i) { inOrder["0|Squat|" + l] = 100 + i; });
rows = rowsFor(inOrder);
check(numberFor(rows, "Set 1") === 1 && numberFor(rows, "Set 2") === 2 && numberFor(rows, "Set 3") === 3,
  "typing top to bottom still numbers 1, 2, 3");

// ---------------- what the server already holds ----------------

// A clean round trip: the pull writes "<set_number>|Name|<label>" keys, and
// pushing them back must not move anything (tester T-23's growth bug).
var pulled = {};
pulled["1|Squat|Set 1"] = 100;
pulled["2|Squat|Set 2"] = 101;
pulled["3|Squat|Set 3"] = 102;
rows = rowsFor(pulled);
check(numberFor(rows, "Set 1") === 1 && numberFor(rows, "Set 3") === 3,
  "a workout pulled back from the server pushes up unchanged");

// Rows already crossed by this bug — Lat Pulldown on the live server has
// "Set 6" sitting on set_number 5. The labels are a rearrangement of the
// same numbers, so they are put back where they belong.
var crossed = {};
crossed["5|Lat Pulldown|Set 6"] = 60;
crossed["6|Lat Pulldown|Set 5"] = 65;
crossed["1|Lat Pulldown|Set 1"] = 40;
rows = rowsFor(crossed);
print("  crossed rows: " + filing(rows));
check(numberFor(rows, "Set 6") === 6 && numberFor(rows, "Set 5") === 5,
  "rows already filed wrong are put right the next time that workout syncs");
check(rows.map(function (r) { return r.set_number; }).sort().join() === "1,5,6",
  "and only the slots already in use are written, so nothing is orphaned");

// If the labels are NOT a rearrangement of the server's numbers, the server's
// numbers stand: re-filing would write to slots nothing is using and leave
// the old rows behind, which is exactly what T-23 cost.
var mismatched = {};
mismatched["1|Press|Set 2"] = 40;
mismatched["2|Press|Set 3"] = 45;
mismatched["3|Press|Set 4"] = 50;
rows = rowsFor(mismatched);
print("  labels off by one: " + filing(rows));
check(rows.map(function (r) { return r.set_number; }).sort().join() === "1,2,3",
  "labels that are not a rearrangement of the server's numbers do not move anything");

// ---------------- labels that cannot decide ----------------

// A cued superset shows the same set twice, left and right.
// Typed set 2 first, so insertion order alone would put set 2 in front.
var cued = {};
cued["0|Lunge|Set 2 · left"] = 23;
cued["0|Lunge|Set 2 · right"] = 22;
cued["0|Lunge|Set 1 · left"] = 20;
cued["0|Lunge|Set 1 · right"] = 21;
rows = rowsFor(cued);
print("  cued superset: " + filing(rows));
check(new Set(rows.map(function (r) { return r.set_number; })).size === 4,
  "four stations get four distinct numbers");
check(numberFor(rows, "Set 1 · left") < numberFor(rows, "Set 2 · left")
  && numberFor(rows, "Set 1 · right") < numberFor(rows, "Set 2 · left")
  && numberFor(rows, "Set 1 · right") < numberFor(rows, "Set 2 · right"),
  "and both halves of set 1 come before set 2, whatever order they were typed in");

// No labels at all (legacy rows): the old behaviour, and no crash.
var unlabelled = {};
unlabelled["0|Row||"] = 30;
unlabelled["0|Row|"] = 31;
rows = rowsFor(unlabelled);
check(rows.length === 2 && new Set(rows.map(function (r) { return r.set_number; })).size === 2,
  "weights with no usable label still get distinct numbers");

// Records written before 2026-10-16 say "Round 3" for the same thing.
var legacy = {};
legacy["0|Thruster|Round 3"] = 30;
legacy["0|Thruster|Round 1"] = 40;
legacy["0|Thruster|Round 2"] = 35;
rows = rowsFor(legacy);
check(numberFor(rows, "Round 1") === 1 && numberFor(rows, "Round 3") === 3,
  "the older \"Round N\" wording is read the same way");

// Two exercises in one block are numbered independently.
var two = {};
two["0|Bench|Set 2"] = 60; two["0|Bench|Set 1"] = 65;
two["0|Fly|Set 1"] = 15; two["0|Fly|Set 2"] = 14;
rows = rowsFor(two);
var bench = rows.filter(function (r) { return r.exercise_name === "Bench"; });
var fly = rows.filter(function (r) { return r.exercise_name === "Fly"; });
check(bench.length === 2 && fly.length === 2, "both exercises are written");
check(numberFor(bench, "Set 1") === 1 && numberFor(fly, "Set 1") === 1,
  "each exercise counts its own sets from 1");

// ---------------- it settles, rather than drifting ----------------
// push, pull, push: the second push must agree with the first, for every
// shape above. This is the property the growth bug broke.
[bottomUp, fixed, pulled, crossed, mismatched, cued, legacy, two].forEach(function (shape, i) {
  var once = rowsFor(shape);
  var back = [{ id: "local-x", date: "2026-11-21" }];
  liftsOntoCompletions(back, once.map(function (r) {
    return { completion_client_id: "local-x", exercise_name: r.exercise_name,
             exercise_id: r.exercise_id, weight: r.weight,
             set_number: r.set_number, set_label: r.set_label };
  }));
  var twice = liftsToRows(back);
  check(filing(once) === filing(twice), "shape " + (i + 1) + " is unchanged by a second push");
});

// ---------------- the label reader ----------------
check(setNumberFromLabel("Set 3") === 3, "\"Set 3\" is set 3");
check(setNumberFromLabel("Set 3 · left side") === 3, "a cue after the number does not hide it");
check(setNumberFromLabel("Round 2") === 2, "\"Round 2\" is set 2");
check(setNumberFromLabel("set 10") === 10, "case does not matter, and nor does a second digit");
check(setNumberFromLabel("Set 0") === null, "set zero is not a set");
check(setNumberFromLabel("") === null && setNumberFromLabel(null) === null, "nothing is not a set");
check(setNumberFromLabel("Warm-up") === null, "a label that is not a set number is refused");

print("\n  " + pass + " passed, " + fail + " failed");
