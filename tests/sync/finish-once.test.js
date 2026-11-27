// Nothing stopped the end of a workout being logged twice (tester T-77).
//
// Player.finish() returned early only on `if (!this.circuit)`, and it never
// cleared this.circuit. advance() calls finish() whenever the index runs past
// the last phase; confirmSkip() calls advance(). Neither had an "already
// finished" flag. Run twice, the workout is logged twice - and because
// logCompletion builds the id from the clock in milliseconds, both copies
// carry the SAME id, so afterwards they are not even distinguishable. The
// member's history shows the session twice and there is no way for them to
// remove either one.
//
// The tester called advance() three times on a player parked on the last
// phase and got three completions all reading `local-1795460776740`;
// confirmSkip() twice gave two more. They then tried to reach it with a finger
// and could not - the skip-confirm overlay is gone the instant the first tap
// lands, and the screen has already changed under the second tap. What is left
// is two taps in one event-loop turn, a timer tick arriving after a manual
// skip, or a second tab on the same workout.
//
// Reported anyway, and fixed anyway, because it is the one action in the app
// that writes a row the member can see and cannot delete.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function braceMatch(src, from) {
  var depth = 0;
  for (var i = src.indexOf("{", from); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFn(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  return braceMatch(APP, at);
}
function liftMethod(sig) {
  var at = APP.indexOf("\n  " + sig + " {");
  if (at < 0) throw new Error(sig + " is gone from the player");
  var src = braceMatch(APP, at + 1);
  return "function " + src.slice(src.indexOf("("));
}

// ---------------- the real logCompletion, with its edges stubbed ----------------
// The id is the point of this finding, so the function that builds it is the
// real one. What it writes to is not.

var COMPLETIONS = [];
var saved = 0, recordedWeights = [];
function saveCompletions() { saved++; }
function recordWeights(w) { recordedWeights.push(w); }
function dateKey() { return "2026-11-26"; }
function estimateCalories() { return 100; }
function estimateHeartRate() { return 130; }
eval(liftFn("topWeightsFrom"));
eval(liftFn("logCompletion"));

// ---------------- just enough screen for finish() to run ----------------

var SCREEN = {};
var shownScreens = [];
var document = {
  getElementById: function (id) {
    return (SCREEN[id] = SCREEN[id] || { textContent: "", innerHTML: "", value: 0 });
  },
};
var prBanners = 0, noteResets = 0, cleared = 0, benchmarks = 0;
function renderPRBanner() { prBanners++; }
function resetSessionNoteField() { noteResets++; }
function clearInProgress() { cleared++; }
function setupBenchmarkScoreSection() { benchmarks++; }
function showScreen(id) { shownScreens.push(id); }
function formatClock() { return "0:30"; }
function blocksWorked() { return 1; }
function completionSentence() { return "You completed it."; }
function newPersonalBests() { return []; }
var currentCompletionEntry = null;

function makePlayer() {
  var P = {
    circuit: { id: "w1", title: "Straight Sets", category: "Strength", meta: "20 min" },
    phases: [{ kind: "sets", blockIndex: 0 }],
    index: 0,
    sessionWeights: {}, setWeights: {}, roundWeights: {},
    amrapRoundsByBlock: {}, skippedPhases: [],
    startedAt: Date.now() - 30000, awayMs: 0,
    finished: false,
    heartbeats: 0, stops: 0, renders: 0, cardioLogged: 0,
    stopHeartbeat: function () { this.heartbeats++; },
    stop: function () { this.stops++; },
    renderPhase: function () { this.renders++; },
    logCardioBlock: function () { this.cardioLogged++; },
    currentPhase: function () { return this.phases[this.index]; },
  };
  eval("P.finish = " + liftMethod("finish()"));
  eval("P.advance = " + liftMethod("advance()"));
  eval("P.warnRefusedWeights = " + liftMethod("warnRefusedWeights()"));
  return P;
}
function reset() { COMPLETIONS = []; saved = 0; shownScreens = []; }
function ids() { return COMPLETIONS.map(function (c) { return c.id; }); }

// ---------------- the finding ----------------

reset();
var P = makePlayer();
P.finish();
check(COMPLETIONS.length === 1, "finishing a workout writes it down once");
check(shownScreens.length === 1 && shownScreens[0] === "screen-workout",
  "and shows the finish screen");

P.finish();
P.finish();
check(COMPLETIONS.length === 1,
  "finishing again writes nothing more, however many times it is called (got "
  + COMPLETIONS.length + " completions: " + JSON.stringify(ids()) + ")");
check(saved === 1, "and the member's history is saved once, not three times (got " + saved + ")");
check(P.cardioLogged === 1, "the cardio minutes are banked once (got " + P.cardioLogged + ")");

// The tester's exact route: advance() past the last phase, three times.
reset();
P = makePlayer();
P.index = 0;
P.advance();
check(COMPLETIONS.length === 1, "running off the end of the phases finishes the workout");
P.advance();
P.advance();
check(COMPLETIONS.length === 1,
  "and running off the end twice more still leaves one completion (got "
  + JSON.stringify(ids()) + ")");

// Why a second copy would be so bad: the id is built from the clock, so the
// duplicates are not even distinguishable afterwards.
reset();
var a = logCompletion({ id: "w1", title: "T", category: "Strength", meta: "20 min" }, {}, {}, { minutes: 5 });
var b = logCompletion({ id: "w1", title: "T", category: "Strength", meta: "20 min" }, {}, {}, { minutes: 5 });
check(a.id === b.id,
  "set up: two completions written in the same millisecond carry the SAME id ("
  + a.id + "), which is what makes a duplicate unremovable");
check(/^local-\d+$/.test(a.id), "and the id is the clock, as the finding says (" + a.id + ")");

// ---------------- a workout with nothing open is still refused ----------------

reset();
P = makePlayer();
P.circuit = null;
var threw = null;
try { P.finish(); } catch (e) { threw = String(e); }
check(threw === null,
  "finish with no workout open comes back quietly rather than throwing (got " + threw + ")");
check(COMPLETIONS.length === 0, "and writes nothing, as it always did");
check(P.finished === false, "and does not mark a session finished that never started");

// ---------------- the flag belongs to the session, not the player ----------------
// Or the next workout could never be finished at all, which would be a far
// worse bug than the one being fixed.

var begin = braceMatch(CODE, CODE.indexOf("\n  beginFresh(circuit) {") + 1);
check(begin.indexOf("this.finished = false;") !== -1,
  "starting a workout clears the flag");
var resume = braceMatch(CODE, CODE.indexOf("\n  resume(circuit, rec) {") + 1);
check(resume.indexOf("this.finished = false;") !== -1,
  "and so does picking an unfinished one back up");
check(CODE.indexOf("\n  finished: false,") !== -1,
  "and it starts false on the player itself, before any workout is opened");

var fin = braceMatch(CODE, CODE.indexOf("\n  finish() {") + 1);
check(fin.indexOf("if (this.finished) return;") !== -1, "the guard is in finish()");
check(fin.indexOf("this.finished = true;") !== -1, "and sets the flag before doing anything else");
check(fin.indexOf("if (this.finished) return;") < fin.indexOf("clearInProgress()"),
  "ahead of everything that writes, or it would be a guard on the second half only");
check(fin.indexOf("this.finished = true;") < fin.indexOf("clearInProgress()"),
  "and the flag is raised before them too, so nothing inside finish() can re-enter it");
check(fin.indexOf("this.circuit = null") === -1,
  "and it does not clear the workout instead - everything below finish() reads it");

print("\n  " + pass + " passed, " + fail + " failed");
