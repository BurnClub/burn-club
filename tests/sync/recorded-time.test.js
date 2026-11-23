// The finish screen said 11 minutes and the app recorded 45 (tester T-73).
//
// `elapsedSec` was computed only to be printed. What got STORED was
// `parseInt(circuit.meta, 10)` — the length written on the workout by the
// coach — so a session the member skipped to the end of in eleven and a half
// minutes went into their history, their notebook and their totals as the
// full forty-five. And the finish screen told them they had completed all
// four blocks, one of which they had just explicitly skipped with the app's
// own warning on screen.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
function sliceFn(src, name) {
  var start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone");
  var depth = 0;
  for (var i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// Everything logCompletion leans on, stubbed so the arithmetic under test is
// the only thing that moves.
var COMPLETIONS = [];
function saveCompletions() {}
function estimateCalories(min) { return min * 10; }
function estimateHeartRate() { return 120; }
function topWeightsFrom() { return {}; }
function recordWeights() {}
eval(sliceFn(DATA, "dateKey"));
eval(sliceFn(APP, "logCompletion"));
eval(sliceFn(APP, "blocksWorked"));
eval(sliceFn(APP, "normaliseDecimalComma"));
eval(sliceFn(APP, "parseLoggedWeight"));
eval(sliceFn(APP, "completionSentence"));

var circuit = { id: "sa", title: "SHOULDERS/ABS", category: "structured", meta: "45 min · Shoulders",
                blocks: [1, 2, 3, 4] };
function log(opts) { COMPLETIONS = []; return logCompletion(circuit, {}, {}, opts); }

// ---------------- the finding ----------------

var e = log({ minutes: 696 / 60 });          // 11:36 on the screen
print("  11:36 on screen -> " + e.minutes + " min recorded");
check(e.minutes !== 45, "the workout's own label is no longer what gets stored");
check(e.minutes === 12, "what they actually spent is, to the nearest minute");
check(e.caloriesBurned === 120, "and the calories follow the real time, not the label");

// ---------------- the fallback, for callers that do not know ----------------

check(log().minutes === 45, "with no time given it still falls back to the workout's own length");
check(log({}).minutes === 45, "and so does an options object with no minutes in it");
// Zero is an answer: both callers always know the time, so a session that
// took no measurable time is a one-minute session, not a forty-five-minute
// one. The browser found this — a scripted run finished in 0ms and was
// recorded as the label again.
check(log({ minutes: 0 }).minutes === 1, "a session of no measurable length records one minute, not the label");
check(log({ minutes: -5 }).minutes === 45, "and neither is a negative one");
check(log({ minutes: NaN }).minutes === 45, "nor nonsense");
check(log({ minutes: 0.4 }).minutes === 1, "under a minute still records a minute, not zero");
check(log({ minutes: 26.6 }).minutes === 27, "part minutes round to the nearest");

// ---------------- which blocks were actually done ----------------
// Four blocks: a straight-sets block (one phase), a superset of four rounds
// with rests between, and an EMOM (one phase) — the shape from the finding.

var phases = [
  { blockIndex: 0, kind: "sets" },                                   // 0
  { blockIndex: 0, kind: "log-weights" },                            // 1
  { blockIndex: 1, kind: "superset" }, { blockIndex: 1, kind: "rest" },   // 2, 3
  { blockIndex: 1, kind: "superset" }, { blockIndex: 1, kind: "rest" },   // 4, 5
  { blockIndex: 2, kind: "work" }, { blockIndex: 2, kind: "rest" },       // 6, 7
  { blockIndex: 3, kind: "emom" },                                   // 8
];
check(blocksWorked(phases, new Set()) === 4, "a workout played through counts every block");
check(blocksWorked(phases, new Set([8])) === 3, "the EMOM skipped whole is three of four");
check(blocksWorked(phases, new Set([2])) === 4,
  "one round of a superset skipped is still a block they did");
check(blocksWorked(phases, new Set([4])) === 4,
  "and so is the LAST round skipped after the first was done — one done phase is enough,\n          whichever order they came in");
check(blocksWorked(phases, new Set([2, 4])) === 3, "every round skipped is not");
check(blocksWorked(phases, new Set([3, 5, 7])) === 4, "skipping rests is not skipping anything");
check(blocksWorked(phases, new Set([1])) === 4, "and nor is skipping the weights screen");
check(blocksWorked(phases, new Set([0, 2, 4, 6, 8])) === 0, "skipping everything is nothing done");
check(blocksWorked([], new Set()) === 0, "no phases, no blocks");
check(blocksWorked(null, null) === 0, "and nothing at all does not throw");

// ---------------- what the screen then says ----------------

check(completionSentence(circuit, 3) === "You finished 3 of 4 blocks of SHOULDERS/ABS. \u{1F525}",
  "a skipped block is named rather than counted as done");
check(completionSentence(circuit, 4) === "You completed all 4 blocks of SHOULDERS/ABS. \u{1F525}",
  "a full session reads exactly as it did before");
check(completionSentence(circuit) === "You completed all 4 blocks of SHOULDERS/ABS. \u{1F525}",
  "and so does one that does not say how many blocks were worked");
check(completionSentence({ title: "Week 7 Circuit", blocks: [1] }, 1) === "You completed Week 7 Circuit. \u{1F525}",
  "the one-block wording from T-56 is untouched");
check(completionSentence({ title: "Week 7 Circuit", blocks: [1] }, 0) === "You finished 0 of 1 blocks of Week 7 Circuit. \u{1F525}",
  "a one-block workout skipped entirely says so");

// ---------------- the player's half of it ----------------

var finish = CODE.indexOf("  finish() {");
var finishBody = CODE.slice(finish, CODE.indexOf("\n  exit() {", finish));
check(finishBody.indexOf("logCompletion(this.circuit, this.sessionWeights, this.setWeights,") !== -1
  && finishBody.indexOf("{ minutes: elapsedSec / 60 }") !== -1,
  "finish() hands the real elapsed time to logCompletion");
check(finishBody.indexOf("const elapsedSec") < finishBody.indexOf("logCompletion("),
  "and works it out BEFORE writing the completion, not after");
check(finishBody.indexOf("this.awayMs") !== -1,
  "with the time they were away taken off, now that this number is recorded");
check(finishBody.indexOf("completionSentence(this.circuit, blocksWorked(this.phases, this.skippedPhases))") !== -1,
  "and tells the sentence how many blocks were actually worked");
check(CODE.indexOf("parseInt(circuit.meta, 10) || 20") !== -1,
  "the label is still the fallback for a caller that cannot know the time");

var skip = CODE.indexOf("confirmSkip() {");
check(skip !== -1 && CODE.slice(skip, skip + 200).indexOf("this.skippedPhases.add(this.index)") !== -1,
  "confirmSkip records which phase was skipped, before advancing off it");
var resume = CODE.indexOf("resume(circuit, rec) {");
check(resume !== -1 && CODE.slice(resume, resume + 900).indexOf("this.awayMs = (rec.awayMs || 0)") !== -1,
  "resume accumulates the gap rather than forgetting the last one");
check(CODE.indexOf("skippedPhases: [...this.skippedPhases]") !== -1,
  "and both survive in the in-progress record, so a resumed session still knows");

print("\n  " + pass + " passed, " + fail + " failed");
