// A double tap on "Save and continue" ticked off a set of the NEXT exercise
// that the member never did (tester T-66).
//
// At the end of a block the member taps "Save and continue". People tap it
// twice - on a phone that has just stuttered, with wet hands, or because
// nothing seemed to happen. The first tap saves and renders the next screen
// synchronously. The second tap is a complete, genuine tap on whatever is now
// in that spot - and what is in that spot is the next exercise's set rows,
// which are themselves buttons.
//
// The member has not done that set. The app then rests them for it, and when
// that exercise's weights screen comes round it asks for a weight for a set
// they never performed, which is sent to the server as work done.
//
// REPRODUCED ON THE REAL SCREEN, at phone width, on the demo's Core Crusher
// (a weights screen followed by nine sets of Russian Twists). Of fifteen
// points sampled inside the rectangle "Save and continue" occupied, TWELVE
// landed on a set-row button of the next exercise once the tap had gone
// through. Two taps in the same spot left `setsChecked[0] === true`, the row
// struck through, and a 15-second rest running.
//
// A synthetic double-click did NOT reproduce it - both of its clicks go to the
// element that was captured first. Two separate taps a moment apart, which is
// what a finger does, did. That is worth remembering before trusting a
// double-click to stand in for a double tap.
//
// The fix: a control ignores taps for NEW_CONTROL_DEAD_MS after the app put it
// under the thumb. This is not a stray click to be caught by looking at where
// the finger went down - it is a real second tap aimed at a button that is no
// longer there. The only thing that distinguishes it is that the thing it
// landed on had been on screen for a few milliseconds.
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
function liftMethod(sig) {
  var at = APP.indexOf("\n  " + sig + " {");
  if (at < 0) throw new Error(sig + " is gone from the player");
  var src = braceMatch(APP, at + 1);
  return "function " + src.slice(src.indexOf("("));
}

eval(APP.match(/const NEW_CONTROL_DEAD_MS = [0-9]+;/)[0].replace("const", "var"));

// ---------------- a clock this test owns ----------------
// The guard is a stopwatch, so the stopwatch is the thing to drive. Only
// Date.now() is reached from the methods under test.

var NOW = 1000000;
var Date = { now: function () { return NOW; } };

var SCREEN = {};
var document = {
  getElementById: function (id) {
    return (SCREEN[id] = SCREEN[id] || {
      textContent: "", style: {},
      classList: { add: function () {}, remove: function () {} },
    });
  },
};
function clearInterval() {}

function makePlayer() {
  var P = {
    setsChecked: [false, false, false],
    screenChangedAt: 0,
    persisted: 0, popups: 0, markedRows: [],
    restIntervalId: null, restDeadlineAt: 123, restSetIndex: 2, restIsLastSet: true,
    persist: function () { this.persisted++; },
    showSetPopup: function () { this.popups++; },
    currentPhase: function () { return { kind: "sets", exerciseName: "Russian Twists" }; },
  };
  eval("P.noteScreenChanged = " + liftMethod("noteScreenChanged()"));
  eval("P.tapCameFromTheLastScreen = " + liftMethod("tapCameFromTheLastScreen()"));
  eval("P.toggleSetChecked = " + liftMethod("toggleSetChecked(setIndex)"));
  eval("P.dismissRestOverlay = " + liftMethod("dismissRestOverlay()"));
  return P;
}
function markSetRowDone(i) { CURRENT.markedRows.push(i); }
var CURRENT = null;

// ---------------- the finding ----------------

var P = CURRENT = makePlayer();
P.noteScreenChanged();                       // "Save and continue" tapped; the sets screen renders
P.toggleSetChecked(0);
check(P.setsChecked[0] === false,
  "a tap landing the instant the screen changed does not tick a set");
check(P.popups === 0, "and does not start a rest for a set nobody did");
check(P.markedRows.length === 0, "and strikes nothing through on screen");

NOW += NEW_CONTROL_DEAD_MS - 1;
P.toggleSetChecked(0);
check(P.setsChecked[0] === false,
  "nor one " + (NEW_CONTROL_DEAD_MS - 1) + "ms later, which is still inside a double tap");

NOW += 2;                                    // now past the window
P.toggleSetChecked(0);
check(P.setsChecked[0] === true,
  "a tap after the window is the member's own, and ticks the set");
check(P.popups === 1, "and rests them for it");
check(P.markedRows.join(",") === "0", "and strikes the row through");

// The window is a double tap's length, not a shrug.
check(NEW_CONTROL_DEAD_MS >= 250 && NEW_CONTROL_DEAD_MS <= 600,
  "the dead time is in the range a double tap lives in (" + NEW_CONTROL_DEAD_MS + "ms)");

// ---------------- it does not eat the member's real taps ----------------
// Everything after the first moment on a screen has to work exactly as before,
// or this fix is worse than the bug.

P = CURRENT = makePlayer();
P.noteScreenChanged();
NOW += NEW_CONTROL_DEAD_MS + 1;
P.toggleSetChecked(0);
P.toggleSetChecked(1);
P.toggleSetChecked(2);
check(P.setsChecked.join(",") === "true,true,true",
  "three sets ticked one after another all register (got " + P.setsChecked.join(",") + ")");
check(P.popups === 3, "each with its rest");

// Ticking a set that is already ticked still does nothing, as before.
P.toggleSetChecked(1);
check(P.popups === 3, "and a row that is already done is still ignored");

// ---------------- the rest popup closing is the same trap, reversed ----------------
// When the popup goes, the set rows are tappable again exactly where
// "Skip Rest" just was.

P = CURRENT = makePlayer();
P.screenChangedAt = 0;
NOW += 10000;
P.dismissRestOverlay();
check(P.screenChangedAt === NOW,
  "closing the rest popup counts as the screen changing (got " + P.screenChangedAt + ")");
P.toggleSetChecked(0);
check(P.setsChecked[0] === false,
  "so a tap arriving with it does not tick the row underneath");

// And the popup closing itself is never blocked - a rest that runs out has to
// be able to close whatever the stopwatch says.
check(braceMatch(CODE, CODE.indexOf("\n  dismissRestOverlay() {") + 1)
        .indexOf("tapCameFromTheLastScreen") === -1,
  "dismissRestOverlay has no guard of its own, so a rest running out still ends it");
check(braceMatch(CODE, CODE.indexOf("\n  advance() {") + 1)
        .indexOf("tapCameFromTheLastScreen") === -1,
  "and advance() has none either, so the code can still move the workout on");

// ---------------- armed everywhere the app changes what is under the thumb ----------------

var render = braceMatch(CODE, CODE.indexOf("\n  renderPhase() {") + 1);
check(render.indexOf("this.noteScreenChanged()") !== -1,
  "a phase rendering arms it - this is the one the finding is about");
var popup = braceMatch(CODE, CODE.indexOf("\n  showSetPopup(setIndex, phase, isLastSet) {") + 1);
check(popup.indexOf("this.noteScreenChanged()") !== -1,
  "the rest popup opening arms it");
check(popup.indexOf('showOverlay("rest-timer-overlay")') < popup.indexOf("this.noteScreenChanged()"),
  "after the popup is actually shown, not before");

// ---------------- the two buttons the member taps ----------------

// Each handler read to the start of the NEXT on(...) wiring and no further:
// they sit next to each other, and a fixed-length slice spills from one into
// the other, which would let an unguarded button pass on its neighbour's
// guard. (It did, until a mutant walked through it.)
function handlerFor(id) {
  var at = CODE.indexOf('on("' + id + '", "click",');
  if (at < 0) return "";
  var next = CODE.indexOf("\n  on(", at + 10);
  return CODE.slice(at, next < 0 ? at + 400 : next);
}
var saveBtn = CODE.indexOf('on("player-complete-set-btn", "click",');
check(saveBtn !== -1, "the Save and continue button is wired");
var saveHandler = handlerFor("player-complete-set-btn");
check(saveHandler.indexOf("if (Player.tapCameFromTheLastScreen()) return;") !== -1,
  "and ignores a tap that arrived with the screen - the same button appears on more than one phase");
check(saveHandler.indexOf("Player.advance()") !== -1, "while still advancing on a real tap");

var skipBtn = CODE.indexOf('on("rest-overlay-skip-btn", "click",');
check(skipBtn !== -1, "the Skip Rest button is wired");
var skipHandler = handlerFor("rest-overlay-skip-btn");
check(skipHandler.indexOf("if (Player.tapCameFromTheLastScreen()) return;") !== -1,
  "and ignores one too - it is the same element as Continue, with a different job");

var toggle = braceMatch(CODE, CODE.indexOf("\n  toggleSetChecked(setIndex) {") + 1);
check(toggle.indexOf("if (this.tapCameFromTheLastScreen()) return;") !== -1,
  "and ticking a set is guarded in the method, which is the one way in");
check(toggle.indexOf("tapCameFromTheLastScreen") < toggle.indexOf("this.setsChecked[setIndex] = true"),
  "before the row is ticked, not after");

print("\n  " + pass + " passed, " + fail + " failed");
