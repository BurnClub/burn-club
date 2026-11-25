// Starting a workout silently threw away the one you were part-way through
// (tester T-86).
//
// Four blocks done, seven weights typed, left with the X. Home shows
// "WORKOUT IN PROGRESS · Resume for 2h 0m". Then Calendar, any workout — the
// same one will do — Start Workout, and everything is gone. No question, no
// warning, no way back. There is one in-progress record per member, so the
// new session's first persist() wrote over it and there was nowhere for the
// old one to go.
//
// The app already knew how to ask. maybeOfferResume() has asked since August,
// but only on the way INTO the app — one of the two moments a session can be
// destroyed. This is the other one, and the guard is in Player.start() rather
// than on the button that calls it, so a second way to start a workout cannot
// become a second way to lose one.
//
// These checks drive the real offerBeforeStart(), unfinishedWorthKeeping() and
// renderDetailStartButton() against the real storage helpers, and press every
// button the overlay offers.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var HTML = readFile("../../index.html");
// The body brace is found AFTER the parameter list closes, not by taking the
// first { — showResumeOverlay destructures its argument, and a matcher that
// starts on that brace returns the parameter object and nothing else.
function bodyStart(from) {
  var depth = 0;
  for (var i = APP.indexOf("(", from); i < APP.length; i++) {
    if (APP[i] === "(") depth++;
    else if (APP[i] === ")") { depth--; if (depth === 0) return APP.indexOf("{", i); }
  }
  throw new Error("could not find the end of the parameter list");
}
function braceEnd(open) {
  var depth = 0;
  for (var i = open; i < APP.length; i++) {
    if (APP[i] === "{") depth++;
    else if (APP[i] === "}") { depth--; if (depth === 0) return i; }
  }
  throw new Error("could not find the closing brace");
}
function lift(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  return APP.slice(at, braceEnd(bodyStart(at)) + 1);
}
// A method on the Player object literal, lifted by its name and brace depth.
function liftMethod(name) {
  var at = APP.indexOf("\n  " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from the Player");
  return APP.slice(at + 3, braceEnd(bodyStart(at)) + 1);
}

// ---------------- the smallest browser this needs ----------------
var STORE = {};
var localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(STORE, k) ? STORE[k] : null; },
  setItem: function (k, v) { STORE[k] = String(v); },
  removeItem: function (k) { delete STORE[k]; },
};
function El() { this.textContent = ""; this.hidden = false; this.onclick = null; this._c = {}; var self = this;
  // Overlays are opened through showOverlay now, which puts their scrolling
  // areas back to the top once they are shown (tester T-89). Nothing in this
  // file scrolls, so an empty list of children and a scrollTop of 0 is all it
  // needs - but it has to answer both, or the resume dialog cannot open.
  this.scrollTop = 0;
  this.querySelectorAll = function () { return []; };
  this.classList = {
    add: function (c) { self._c[c] = true; },
    remove: function (c) { delete self._c[c]; },
    contains: function (c) { return !!self._c[c]; },
  };
}
var ELS = {};
var document = { getElementById: function (id) { return (ELS[id] = ELS[id] || new El()); } };
function overlayVisible() { return document.getElementById("resume-overlay").classList.contains("visible"); }
function btn(id) { return document.getElementById(id); }

var TOASTS = [];
function showToast(t) { TOASTS.push(t); }
var PARTIALS = [];
function logPartialCompletion(circuit, rec, blocksDone) {
  PARTIALS.push({ circuit: circuit.id, index: rec.index, blocksDone: blocksDone });
}
function renderResumeBanner() {}

// Two workouts, five blocks each. buildPhaseQueue is stubbed to the shape the
// real one produces — phases carrying their blockIndex — because what is under
// test is the decision, not the queue. blocksCompletedAt below IS the real one.
var CIRCUITS = [
  { id: "chest", title: "CHEST/TRICEPS", blocks: [1, 2, 3, 4, 5] },
  { id: "quads", title: "QUADS/GLUTES", blocks: [1, 2, 3, 4, 5] },
];
function buildPhaseQueue(circuit) {
  var out = [];
  circuit.blocks.forEach(function (_, b) {
    for (var i = 0; i < 3; i++) out.push({ blockIndex: b });
  });
  return out;
}
var CURRENT_MEMBER = { id: "jordan" };
function memberKey(base) { return base + "-" + CURRENT_MEMBER.id; }
var openCircuitId = null;

eval(APP.match(/^const IN_PROGRESS_STORAGE_KEY = .*$/m)[0].replace("const", "var"));
eval(APP.match(/^const RESUME_WINDOW_MS = .*$/m)[0].replace("const", "var"));
eval(lift("loadInProgress"));
eval(lift("clearInProgress"));
eval(lift("hasLoggedWork"));
eval(lift("blocksCompletedAt"));
eval(lift("resetOverlayScroll"));
eval(lift("showOverlay"));
eval(lift("showResumeOverlay"));
eval(lift("unfinishedWorthKeeping"));
eval(lift("offerBeforeStart"));
eval(lift("renderDetailStartButton"));

// What the Player would have done, without doing it.
var STARTED = [], RESUMED = [];
var Player = {
  beginFresh: function (c) { STARTED.push(c.id); },
  resume: function (c, rec) { RESUMED.push({ id: c.id, index: rec.index }); },
};
// The real start(), so the guard is checked where it actually sits.
eval("Player.start = function " + liftMethod("start").replace(/^start/, "") .replace(/,$/, "") + ";");

function putRecord(circuitId, opts) {
  opts = opts || {};
  STORE[memberKey(IN_PROGRESS_STORAGE_KEY)] = JSON.stringify({
    circuitId: circuitId,
    index: opts.index === undefined ? 7 : opts.index,     // block 3 of 5
    setWeights: opts.setWeights === undefined ? { "0|Row|Set 1": 60 } : opts.setWeights,
    sessionWeights: {},
    lastSeenAt: Date.now() - (opts.agoMs || 60000),
  });
}
function recordStillThere() { return !!loadInProgress(); }
// The DOM is kept unless a check says otherwise: wiping the elements between
// two dialogs would hand the second one fresh buttons, and whether a handler
// SURVIVES from the first is the thing being checked.
function resetSession() {
  STORE = {}; TOASTS = []; PARTIALS = []; STARTED = []; RESUMED = [];
  openCircuitId = null;
}
function reset() { resetSession(); ELS = {}; }

// ======================================================================
print("\n-- the finding --");
reset();
putRecord("chest");
Player.start(CIRCUITS[1]);                      // the member taps Start on QUADS/GLUTES
check(STARTED.length === 0, "the new workout does not start behind a question");
check(overlayVisible(), "the member is asked");
check(recordStillThere(), "and the unfinished session is still there while they decide");
check(btn("resume-body").textContent.indexOf("CHEST/TRICEPS") !== -1,
  "the question names what is at stake (got " + btn("resume-body").textContent + ")");
check(btn("resume-body").textContent.indexOf("block 3 of 5") !== -1,
  "and how far in they were (got " + btn("resume-body").textContent + ")");
check(btn("resume-body").textContent.indexOf("QUADS/GLUTES") !== -1,
  "and what they are about to start");

print("\n-- all three answers, and what each one does --");
reset(); putRecord("chest");
Player.start(CIRCUITS[1]);
check(btn("resume-third-btn").hidden === false, "a different workout gets the third choice");
btn("resume-primary-btn").onclick();
check(RESUMED.length === 1 && RESUMED[0].id === "chest", "going back resumes the unfinished one");
check(RESUMED[0].index === 7, "from where they left it");
check(STARTED.length === 0, "and does not start the new one");
check(recordStillThere(), "with the record still in place for the Player to read");

reset(); putRecord("chest");
Player.start(CIRCUITS[1]);
btn("resume-third-btn").onclick();
check(PARTIALS.length === 1 && PARTIALS[0].circuit === "chest",
  "logging it keeps the old session as a partial workout");
check(PARTIALS[0].blocksDone === 2, "for the blocks actually finished (got " + PARTIALS[0].blocksDone + ")");
check(STARTED.length === 1 && STARTED[0] === "quads", "and then starts the new one");
check(!recordStillThere(), "with the record cleared, so nothing is offered twice");
check(TOASTS.some(function (t) { return t.indexOf("CHEST/TRICEPS") !== -1; }),
  "and says so (got " + JSON.stringify(TOASTS) + ")");

reset(); putRecord("chest");
Player.start(CIRCUITS[1]);
btn("resume-secondary-btn").onclick();
check(PARTIALS.length === 0, "discarding logs nothing");
check(STARTED.length === 1 && STARTED[0] === "quads", "and starts the new one");
check(!recordStillThere(), "the old record is gone, because the member said so");

print("\n-- the same workout, which is the worse half --");
reset(); putRecord("chest");
Player.start(CIRCUITS[0]);                      // Start Workout on the one they are in
check(overlayVisible(), "tapping Start on the workout you are in asks first");
check(btn("resume-title").textContent === "Resume workout?",
  "and asks the obvious question (got " + btn("resume-title").textContent + ")");
check(btn("resume-primary-btn").textContent === "Resume", "Resume is the first answer");
check(btn("resume-secondary-btn").textContent === "Start over", "starting over is still offered");
check(btn("resume-third-btn").hidden === true, "with no third choice, because there is no other workout");
check(btn("resume-third-btn").onclick === null,
  "and no handler left on it from the last time it was used");
btn("resume-primary-btn").onclick();
check(RESUMED.length === 1 && RESUMED[0].id === "chest", "Resume carries on where they were");

reset(); putRecord("chest");
Player.start(CIRCUITS[0]);
btn("resume-secondary-btn").onclick();
check(STARTED.length === 1 && STARTED[0] === "chest" && !recordStillThere(),
  "Start over does what it always did — but now only when asked for");

print("\n-- a stale handler cannot make one dialog do another's job --");
// Deliberately on the SAME buttons: reset() would give the second dialog
// fresh elements and the check could not fail.
reset(); putRecord("chest");
Player.start(CIRCUITS[1]);                      // a different workout: three buttons
check(typeof btn("resume-third-btn").onclick === "function", "set up: the third choice is wired");
var thirdEl = btn("resume-third-btn");
btn("resume-secondary-btn").onclick();          // discard and start
resetSession(); putRecord("quads");
Player.start(CIRCUITS[1]);                      // the same workout: two answers
check(btn("resume-third-btn") === thirdEl, "set up: it really is the same button element");
check(thirdEl.hidden === true, "the third button is hidden on a two-answer question");
check(thirdEl.onclick === null,
  "and unbound, so pressing where it was cannot log a partial from the last question");
// And the question that follows still behaves: the stale handler, if it were
// left, would be reachable by the member's next press.
btn("resume-secondary-btn").onclick();
check(PARTIALS.length === 0, "nothing was logged by a button that should not be there");

print("\n-- past the two-hour window --");
reset(); putRecord("chest", { agoMs: RESUME_WINDOW_MS + 60000 });
Player.start(CIRCUITS[1]);
check(overlayVisible(), "an old unfinished session is still not thrown away silently");
check(btn("resume-primary-btn").textContent.indexOf("Log") === 0,
  "but resuming is not offered (got " + btn("resume-primary-btn").textContent + ")");
check(btn("resume-third-btn").hidden === true, "so there are two answers, not three");
btn("resume-primary-btn").onclick();
check(PARTIALS.length === 1 && STARTED.length === 1, "logging it still works, then starts the new one");

print("\n-- nothing to lose is not a question --");
reset(); putRecord("chest", { index: 0, setWeights: {} });
Player.start(CIRCUITS[1]);
check(!overlayVisible(), "a session with nothing behind it raises no question");
check(STARTED.length === 1 && STARTED[0] === "quads", "the new workout starts straight away");
check(!recordStillThere(),
  "and the empty record is cleared, so it cannot raise a resume prompt later");

reset();
Player.start(CIRCUITS[1]);
check(!overlayVisible() && STARTED.length === 1, "with no record at all it just starts");

reset(); putRecord("gone-from-the-programme");
Player.start(CIRCUITS[1]);
check(!overlayVisible(), "a record for a workout that no longer exists asks nothing");
check(STARTED.length === 1 && !recordStillThere(), "it is dropped and the new one starts");

print("\n-- the button on the detail screen says what it will do --");
reset(); putRecord("chest");
renderDetailStartButton("chest");
check(btn("start-circuit-btn").textContent.indexOf("Resume workout") === 0,
  "opening the workout you are in offers to resume it (got " + btn("start-circuit-btn").textContent + ")");
check(btn("start-circuit-btn").textContent.indexOf("Block 3 of 5") !== -1,
  "and says how far in (got " + btn("start-circuit-btn").textContent + ")");
renderDetailStartButton("quads");
check(btn("start-circuit-btn").textContent === "Start Workout",
  "a different workout still says Start Workout (got " + btn("start-circuit-btn").textContent + ")");
reset(); putRecord("chest", { agoMs: RESUME_WINDOW_MS + 60000 });
renderDetailStartButton("chest");
check(btn("start-circuit-btn").textContent === "Start Workout",
  "and so does one too old to resume, because Resume would be a lie");
reset();
renderDetailStartButton("chest");
check(btn("start-circuit-btn").textContent === "Start Workout", "with nothing waiting it reads as it always did");

print("\n-- the guard is in the Player, not on the button --");
var startSrc = liftMethod("start");
check(/offerBeforeStart\(circuit\)/.test(startSrc),
  "Player.start asks before it does anything");
check(/beginFresh\(circuit\)/.test(startSrc),
  "and the work itself moved into beginFresh");
check((APP.match(/offerBeforeStart\(/g) || []).length === 2,
  "offerBeforeStart is referenced twice — the guard and the function — so there is one door");
check(/id="resume-third-btn"/.test(HTML), "the overlay has a third button to offer");
check(/id="resume-third-btn"[^>]*hidden/.test(HTML), "hidden until something asks for it");

print("\n" + pass + " passed   " + fail + " failed");
