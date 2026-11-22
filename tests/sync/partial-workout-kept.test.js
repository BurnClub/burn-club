// An interrupted workout must not be deleted without a word (tester T-54).
//
// A member does five of the six sets of the first block — or three of four
// rounds of a superset — and is interrupted. Two hours later they open the
// app: no banner, no prompt, no toast, no mention of a workout at all.
// Everything they logged, including weights typed on a "Log your weights"
// screen, is gone.
//
// The decision to drop sessions with nothing behind them is right and is not
// what changed. The MEASUREMENT was wrong: "real work" was counted in whole
// blocks, and a Fit & Functional block is six sets, so five-sixths of a
// 32-minute workout counted as nothing.
//
// Lifted out of the real app.js, so these checks cannot keep passing after
// the shipped versions change.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

var APP = readFile("../../app.js");
function lift(name) {
  var start = APP.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone from app.js");
  var depth = 0;
  for (var i = APP.indexOf("{", start); i < APP.length; i++) {
    if (APP[i] === "{") depth++;
    else if (APP[i] === "}") { depth--; if (depth === 0) return APP.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
eval(lift("hasLoggedWork"));
eval(lift("blocksCompletedAt"));

// ---------------- what counts as having done something ----------------

check(hasLoggedWork(null) === false, "no record at all is not work");
check(hasLoggedWork({}) === false, "an empty record is not work");
check(hasLoggedWork({ index: 0 }) === false, "sitting on the first phase having done nothing is not work");
check(hasLoggedWork({ index: 0, setsChecked: [false, false, false] }) === false,
  "a phase with no set ticked is not work");

check(hasLoggedWork({ index: 1 }) === true, "advancing past the first phase is work");
check(hasLoggedWork({ index: 5 }) === true, "five phases in is work");
check(hasLoggedWork({ index: 0, setsChecked: [true, false, false] }) === true,
  "one ticked set on the first phase is work");
check(hasLoggedWork({ index: 0, setWeights: { "0-1": 47 } }) === true,
  "a typed per-set weight is work, even having ticked nothing");
check(hasLoggedWork({ index: 0, sessionWeights: { squat: 60 } }) === true,
  "a typed session weight is work");
check(hasLoggedWork({ index: 0, amrapRoundsByBlock: { 0: 3 } }) === true,
  "AMRAP rounds recorded are work");
check(hasLoggedWork({ index: 0, amrapRoundsByBlock: { 0: 0 } }) === false,
  "zero AMRAP rounds is not work");
check(hasLoggedWork({ index: 0, setWeights: {} , sessionWeights: {} }) === false,
  "empty weight objects are not work");

// setsChecked is rebuilt per phase, so it can never be the whole story.
check(hasLoggedWork({ index: 7, setsChecked: [false, false] }) === true,
  "deep in a session with the current phase untouched is still work");

// ---------------- the drop rule, as the resume path applies it ----------------
// Reproduces the condition from maybeOfferResume over the real helpers.

function droppedSilently(rec, phases) {
  var blocksDone = blocksCompletedAt(phases, rec.index);
  return !hasLoggedWork(rec) && blocksDone < 1;
}

// A Fit & Functional block: six sets. The shape from the finding.
var phases = [];
for (var b = 0; b < 4; b++) {
  for (var s = 0; s < 6; s++) phases.push({ blockIndex: b });
}

check(droppedSilently({ index: 0 }, phases) === true,
  "a workout opened and abandoned with nothing done is still dropped silently");
check(droppedSilently({ index: 5 }, phases) === false,
  "FIVE of six sets of the first block is no longer thrown away");
check(droppedSilently({ index: 1 }, phases) === false,
  "one set of the first block is no longer thrown away");
check(droppedSilently({ index: 0, setWeights: { "0-1": 47 } }, phases) === false,
  "weights typed before the first set completes are no longer thrown away");
check(droppedSilently({ index: 6 }, phases) === false,
  "a whole block done is kept, as it always was");
check(droppedSilently({ index: 23 }, phases) === false,
  "almost the whole workout is kept, as it always was");

// ---------------- the duration written into their history ----------------
// The REAL logPartialCompletion, called with a stubbed logCompletion, so a
// change to the shipped formula fails here. Reproducing the arithmetic in the
// test instead would check nothing: the first draft of this file did that,
// and reverting the fix in app.js failed none of these.

var LOGGED = null;
function logCompletion(circuit, sessionWeights, setWeights) {
  LOGGED = { meta: circuit.meta, title: circuit.title, sessionWeights: sessionWeights, setWeights: setWeights };
  return LOGGED;
}
// logPartialCompletion calls this; without it the file dies at the first
// duration check, which the runner could not see until run.sh learned to
// look for exceptions (2026-11-21).
eval(lift("partialMinutesOnTheClock"));
eval(lift("logPartialCompletion"));

// A 32-minute, 4-block workout; each block is six sets, so 24 phases.
var circuit = { id: "ff-1", title: "Fit & Functional", meta: "32 min", blocks: [1, 2, 3, 4] };

function minutesOf(rec, blocksDone, phaseList) {
  LOGGED = null;
  logPartialCompletion(circuit, rec, blocksDone, phaseList);
  return parseInt(LOGGED.meta, 10);
}

// The finding's own example: five of the six sets of block one.
var mins = minutesOf({ index: 5 }, 0, phases);
check(mins > 1, "five of six sets is no longer written into history as '1 min'");
check(mins === 7, "five of 24 phases of a 32-minute workout logs as 7 min");

check(minutesOf({ index: 6 }, 1, phases) === 8,
  "one whole block of four still logs as a quarter of the time, unchanged");
check(minutesOf({ index: 12 }, 2, phases) === 16,
  "two whole blocks of four still logs as half the time, unchanged");
check(minutesOf({ index: 1 }, 0, phases) === 1,
  "a single set still rounds to the one-minute floor");
check(minutesOf({ index: 5 }, 0, null) === 1,
  "a missing phase queue falls back to the floor rather than writing 0 min");

// The weights are the thing the silent delete was destroying, so the partial
// has to carry them through.
LOGGED = null;
logPartialCompletion(circuit, { index: 5, setWeights: { "0-1": 47 }, sessionWeights: { squat: 60 } }, 0, phases);
check(LOGGED.setWeights["0-1"] === 47, "the per-set weights the member typed are logged, not dropped");
check(LOGGED.sessionWeights.squat === 60, "the session weights are logged too");
check(/\(partial\)/.test(LOGGED.title), "it is recorded as a partial, not as a finished workout");

LOGGED = null;
logPartialCompletion(circuit, { index: 5 }, 0, phases);
check(LOGGED.setWeights && typeof LOGGED.setWeights === "object",
  "a record with no weights logs an empty object rather than undefined");

// ---------------- the banner and the prompt must agree ----------------
// If they disagree, the banner offers a session the resume path has already
// deleted, or hides one it is about to ask about.

var resumeSrc = lift("maybeOfferResume");
var bannerSrc = lift("renderResumeBanner");
function stripComments(t) { return t.replace(/\/\/[^\n]*/g, ""); }
check(/hasLoggedWork\(rec\)/.test(stripComments(resumeSrc)),
  "the resume path asks hasLoggedWork before dropping");
check(/hasLoggedWork\(rec\)/.test(stripComments(bannerSrc)),
  "the banner asks hasLoggedWork on the same condition");
