// "Over 2000 - not saved" left sitting beside an empty box, two minutes and
// two rotations after the number it was about (tester T-90).
//
// On an EMOM there is ONE weight box. The clock hands it to the next exercise
// every minute and the app refills it. A member types 2500 on minute 2, the box
// correctly turns red and says so - and on minute 4, when Goblet Squats comes
// round again, the box is empty and still red, with the warning still beside
// it, on a rotation they never typed into. They are being told an empty box was
// not saved.
//
// REPRODUCED ON THE LIVE SITE FIRST, signed in as a real member, walking the
// real clock a minute at a time:
//   minute 2  typed 2500   value "2500"  class "...is-bad"  warning shown
//   minute 3  Burpees      box hidden, still carrying both
//   minute 4  Goblet Squats  value ""    class "...is-bad"  warning VISIBLE
//
// The cause: fillWeightBox() set the value and re-armed the box but left the
// is-bad class and the warning span that markWeightInput() had created. The
// value and the mark beside it were two separate things, written in two
// different places, and only one of them was kept up to date.
//
// The fix makes them one thing. setWeightBoxValue() is the only place a weight
// box's value is written - by the member's keystroke through readWeightBox, by
// the EMOM refill through fillWeightBox, by the correction in undoWeightSplice,
// by the carry-down - and it marks the row from what it just wrote, every time.
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

var TIMERS = [];
setTimeout = function (fn) { TIMERS.push(fn); return TIMERS.length; };

// ---------------- the one box, and the row it sits in ----------------

function Box() {
  this.value = "";
  this.dataset = {};
  this.selectionStart = this.selectionEnd = 0;
  this.assignments = 0;      // how many times the app wrote to it at all
  this._classes = {};
  this._l = {};
  var box = this;
  this._row = { kids: [] };
  this._row.querySelector = function (sel) {
    return box._row.kids.filter(function (k) { return "." + k.className === sel; })[0] || null;
  };
  this._row.appendChild = function (el) {
    el._row = box._row;
    // remove() detaches, like the real one: a warning that has been removed
    // must not still be found by the next querySelector, or markWeightInput
    // writes its text onto an element nobody can see.
    el.remove = function () { box._row.kids = box._row.kids.filter(function (k) { return k !== el; }); };
    box._row.kids.push(el);
  };
  this.classList = {
    add: function (c) { box._classes[c] = true; },
    remove: function (c) { delete box._classes[c]; },
    contains: function (c) { return !!box._classes[c]; },
  };
}
Box.prototype.closest = function () { return this._row; };
Box.prototype.select = function () { this.selectionStart = 0; this.selectionEnd = this.value.length; };
Box.prototype.setSelectionRange = function (a, b) { this.selectionStart = a; this.selectionEnd = b; };
Box.prototype.addEventListener = function (t, fn) { (this._l[t] = this._l[t] || []).push(fn); };
Box.prototype.isBad = function () { return !!this._classes["is-bad"]; };
Box.prototype.warning = function () {
  var w = this._row.kids.filter(function (k) { return k.className === "weight-log-warn"; })[0];
  return w ? w.textContent : null;
};
// A box that counts writes, so "it only touches the value when it changes" is
// checkable rather than taken on trust - assigning an input's value moves the
// caret to the end in some engines, and this runs on every keystroke.
function watchValue(box) {
  var held = box.value;
  Object.defineProperty(box, "value", {
    get: function () { return held; },
    set: function (v) { held = v; box.assignments++; },
    configurable: true,
  });
}

var BOX = new Box();
var WRAP = { style: { display: "none" } };
var document = {
  activeElement: null,
  getElementById: function (id) {
    if (id === "player-emom-weight-input") return BOX;
    if (id === "player-emom-weight") return WRAP;
    return { textContent: "", style: {} };
  },
  createElement: function () {
    return { className: "", textContent: "", removed: false,
             remove: function () { this.removed = true; } };
  },
  addEventListener: function () {},
};

eval(APP.match(/const MAX_LOGGED_WEIGHT = [0-9.]+;/)[0].replace("const", "var"));
eval(liftFn("normaliseDecimalComma"));
eval(liftFn("parseLoggedWeight"));
eval(liftFn("markWeightInput"));
eval(liftFn("setWeightBoxValue"));
eval(liftFn("readWeightBox"));
eval(liftFn("trySelectWeightBox"));
eval(liftFn("armWeightBox"));
eval(liftFn("fillWeightBox"));
eval(liftFn("wireWeightBoxTyping"));
eval(liftFn("armWeightBoxOnTap"));
eval(liftFn("selectWeightBoxOnFocus"));
eval(liftFn("undoWeightSplice"));
eval(liftFn("insertedIntoBox"));
eval(liftFn("splicedAddition"));
eval(APP.match(/^let weightSpliceWatcherWired = false;$/m)[0].replace("let", "var"));

// Burpees is a bodyweight movement; the other two take a weight. That
// alternation is what hands the box from one exercise to the next.
function exerciseTracksWeight(name) { return name !== "Burpees"; }
var LAST = {};
function lastWeightFor(name) { return LAST[name] == null ? null : LAST[name]; }

var EMOM_DURATION = 600, EMOM_INTERVAL = 60;
var EXERCISES = ["Burpees", "Goblet Squats"];
function makePlayer() {
  var P = {
    sessionWeights: {}, roundWeights: {}, setWeights: {},
    index: 1, emomBindSeq: 0, emomSeqByMinute: {}, emomWeightFor: null,
    remaining: EMOM_DURATION,
    persist: function () {},
    currentPhase: function () {
      return { kind: "emom", duration: EMOM_DURATION, interval: EMOM_INTERVAL, blockIndex: 0 };
    },
  };
  eval("P.currentEmomMinute = " + liftMethod("currentEmomMinute()"));
  eval("P.emomSlotForNow = " + liftMethod("emomSlotForNow()"));
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  eval("P.syncEmomWeightField = " + liftMethod("syncEmomWeightField(exerciseName)"));
  return P;
}
// What the clock does every second: move to the minute, then hand the box to
// whichever exercise that minute belongs to. The same two lines updateClock()
// runs, in the same order.
function atMinute(P, minute) {
  P.remaining = EMOM_DURATION - minute * EMOM_INTERVAL;
  P.syncEmomWeightField(EXERCISES[minute % EXERCISES.length]);
  TIMERS = [];
}
// The member typing into the box the clock has just handed them.
function typeInto(P, name, text) {
  BOX.dataset.weightBoxFresh = "1";
  BOX.dataset.weightBoxWas = BOX.value;
  BOX.value = text;
  BOX.selectionStart = BOX.selectionEnd = text.length;
  var parsed = readWeightBox(BOX);
  P.noteWeight(name, parsed.state === "ok" ? parsed.value : "");
  return parsed;
}

// ---------------- the finding ----------------

var P = makePlayer();
atMinute(P, 1);                       // minute 2 on screen: Goblet Squats
check(WRAP.style.display === "flex", "the box is on screen for an exercise that takes a weight");
typeInto(P, "Goblet Squats", "2500");
check(BOX.isBad(), "2500 is refused and the box turns red");
check(BOX.warning() === "Over " + MAX_LOGGED_WEIGHT + " — not saved",
  "and says so (got " + BOX.warning() + ")");
check(P.sessionWeights["Goblet Squats"] === undefined, "and nothing is stored, which was never the bug");

atMinute(P, 2);                       // Burpees - no weight box at all
check(WRAP.style.display === "none", "the box goes away for a bodyweight movement");

atMinute(P, 3);                       // Goblet Squats again: the finding
check(WRAP.style.display === "flex", "and comes back when the exercise does");
check(BOX.value === "", "the box is empty on the new rotation");
check(!BOX.isBad(),
  "and it is NOT red - which is what the member was looking at two minutes later");
check(BOX.warning() === null,
  "and there is no warning beside it (got " + JSON.stringify(BOX.warning()) + ")");

// ---------------- the mark follows the value both ways ----------------

P = makePlayer();
LAST["Goblet Squats"] = 40;
atMinute(P, 1);
typeInto(P, "Goblet Squats", "2500");
check(BOX.isBad(), "red again on this rotation");
// A good number typed on the same rotation clears it - this always worked, and
// is the behaviour the stale mark was hiding behind.
typeInto(P, "Goblet Squats", "45");
check(!BOX.isBad() && BOX.warning() === null, "typing a number the app accepts clears it");
check(P.sessionWeights["Goblet Squats"] === 45, "and the number is kept");

// The refill carries a number across rotations once one is stored, and that
// number is marked too.
typeInto(P, "Goblet Squats", "2500");
check(BOX.isBad(), "red once more");
atMinute(P, 2);
atMinute(P, 3);
check(BOX.value === "",
  "the next rotation refills from what was stored, and the refusal cleared it (got "
  + JSON.stringify(BOX.value) + ")");
check(!BOX.isBad() && BOX.warning() === null, "and it is not wearing the old warning");
// The same walk with a number that WAS stored, so the refill has something to
// carry and the mark still has to be right on arrival.
P = makePlayer();
atMinute(P, 1);
typeInto(P, "Goblet Squats", "45");
atMinute(P, 2);
atMinute(P, 3);
check(BOX.value === "45", "a stored number does come across to the next rotation");
check(!BOX.isBad() && BOX.warning() === null, "arriving unmarked, because 45 is fine");

// And a value the app puts in that it would NOT store is marked, rather than
// being shown as if it were fine. Nothing stores one today; the point is that
// the mark is decided by the value, not by who wrote it.
fillWeightBox(BOX, "5000");
check(BOX.isBad() && BOX.warning() !== null,
  "a number over the cap put in by the app is marked like one typed");
fillWeightBox(BOX, "");
check(!BOX.isBad() && BOX.warning() === null, "and emptying it clears that too");

// ---------------- the box is not written to needlessly ----------------

var b = new Box();
watchValue(b);
setWeightBoxValue(b, "40");
var afterFirst = b.assignments;
setWeightBoxValue(b, "40");
setWeightBoxValue(b, "40");
check(afterFirst === 1, "setting a box writes to it once");
check(b.assignments === afterFirst,
  "and setting it to what it already holds does not write at all, so the caret stays put (got "
  + b.assignments + ")");
setWeightBoxValue(b, "45");
check(b.assignments === afterFirst + 1, "a different value does write");

// ---------------- the correction clears its own mark ----------------
// undoWeightSplice runs on the document in the capture phase, BEFORE the
// screen's own handler. It used to set the value raw and rely on that handler
// running afterwards to fix the mark. Driven here with no screen handler at
// all, which is the honest test of what the capture listener leaves behind.

b = new Box();
markWeightInput(b, parseLoggedWeight("2500"));
check(b.isBad(), "a box left red by an earlier refusal");
b.dataset.weightBoxFresh = "1";
b.dataset.weightBoxWas = "2500";
b.value = "250";
b.selectionStart = b.selectionEnd = 3;
undoWeightSplice(b, { inputType: "deleteContentBackward" });
check(b.value === "", "a backspace as the first thing empties it");
check(!b.isBad() && b.warning() === null,
  "and the capture listener clears the mark itself, without waiting for the screen");

b = new Box();
b.dataset.weightBoxFresh = "1";
b.dataset.weightBoxWas = "2500";
markWeightInput(b, parseLoggedWeight("2500"));
b.value = "250040";
b.selectionStart = b.selectionEnd = 6;
undoWeightSplice(b, { inputType: "insertText", data: "40" });
check(b.value === "40", "a spliced correction is undone");
check(!b.isBad() && b.warning() === null, "and that clears the mark too");

// ---------------- one way in ----------------
// Every one of these used to write a box's value for itself. A check that the
// mark is right in four places is four checks that can rot apart; a check that
// there is one place is one that cannot.

function bodyOf(name) {
  var at = CODE.indexOf("function " + name + "(");
  return at < 0 ? "" : braceMatch(CODE, at);
}
function playerMethod(sig) {
  var at = CODE.indexOf("\n  " + sig + " {");
  return at < 0 ? "" : braceMatch(CODE, at + 1);
}
var writer = bodyOf("setWeightBoxValue");
check(writer.indexOf("markWeightInput(input, parsed)") !== -1,
  "the one writer marks the row from what it just wrote");
var users = [
  ["readWeightBox", bodyOf("readWeightBox")],
  ["fillWeightBox", bodyOf("fillWeightBox")],
  ["undoWeightSplice", bodyOf("undoWeightSplice")],
  ["carryWeightDown", playerMethod("carryWeightDown(input, inputs, parsed)")],
];
users.forEach(function (u) {
  check(u[1].length > 0, u[0] + " is still there");
  check(u[1].indexOf("setWeightBoxValue(") !== -1, "and " + u[0] + " writes through the one writer");
  check(!/\.value\s*=[^=]/.test(u[1]),
    "and " + u[0] + " no longer sets a box's value itself");
  check(u[1].indexOf("markWeightInput(") === -1,
    "and does not mark separately, which is how the two drifted apart");
});

print("\n  " + pass + " passed, " + fail + " failed");
