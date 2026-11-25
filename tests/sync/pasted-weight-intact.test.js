// Put a whole number into a weight box at once and the digits come out
// scrambled (tester T-91).
//
// The box holds 35. The member taps it, the caret lands inside the number, and
// they paste 50. The box ends up holding 05 - five pounds - and it is carried
// down every set of that exercise, under the cap, with no warning.
//
// It is not only a paste. Anything that puts in more than one character at a
// time does it: an autofill, a dictated number, a keyboard that inserts a whole
// word, a clipboard suggestion above the keys. Typing one character at a time
// is clean, which is why this survived five rounds of weight-box findings.
//
// The cause is the correction's arithmetic, not the arming. splicedAddition()
// works out what was inserted by matching a common prefix and suffix, which is
// exactly right for ONE character and a guess for several: for was="35",
// now="3505" the prefix match eats the original 35 and returns "05". The same
// arithmetic answers "7.53" for a 3 with 37.5 put in front of it.
//
// REPRODUCED ON THE LIVE SITE FIRST, signed in as a real member, on an app.js
// proved byte-identical to the deployed build. A box typed to 35, tapped again,
// caret moved inside with the arrow keys, then 50 inserted in one go:
//   box          05
//   sets 2,3,4   5, 5, 5
//   setWeights   all four sets at 5
// The same run read what the browser actually delivers, which is what the fix
// is built on and what the old code ignored:
//   inputType "insertText"   data "50"   selectionEnd 3   value "3505"
// So the caret sits immediately after what was put in, and insertText names it.
// Checked in the browser rather than assumed, because T-74's first fix rested
// on beforeinput, which that engine never delivers.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

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

// mock-supabase.js stubs setTimeout to a no-op; this needs a queue it can fire.
var TIMERS = [];
setTimeout = function (fn) { TIMERS.push(fn); return TIMERS.length; };
function tick() { var q = TIMERS; TIMERS = []; q.forEach(function (f) { f(); }); }

var CAPTURE = {};
var document = {
  activeElement: null,
  addEventListener: function (type, fn, capture) {
    if (!capture) throw new Error("document listeners must be in the capture phase");
    (CAPTURE[type] = CAPTURE[type] || []).push(fn);
  },
};

function Event(type) { this.type = type; }

function Box(value) {
  this.value = value;
  this.dataset = {};
  this.selectionStart = this.selectionEnd = value.length;
  this._l = {};
  this.seen = [];   // what the screen's own input handler was shown
}
Box.prototype.select = function () { this.selectionStart = 0; this.selectionEnd = this.value.length; };
Box.prototype.setSelectionRange = function (a, b) { this.selectionStart = a; this.selectionEnd = b; };
Box.prototype.addEventListener = function (t, fn) { (this._l[t] = this._l[t] || []).push(fn); };
Box.prototype.dispatchEvent = function (ev) {
  ev.target = this;
  (CAPTURE[ev.type] || []).forEach(function (fn) { fn(ev); });
  (this._l[ev.type] || []).forEach(function (fn) { fn(ev); });
};

eval(lift("selectWeightBoxOnFocus"));
// One per line at the top level: an eval inside a callback defines the function
// in the callback's scope, where the code under test cannot see it.
eval(lift("trySelectWeightBox"));
eval(lift("armWeightBox"));
eval(lift("armWeightBoxOnTap"));
eval(lift("fillWeightBox"));
eval(lift("wireWeightBoxTyping"));
eval(lift("undoWeightSplice"));
eval(lift("insertedIntoBox"));
eval(lift("splicedAddition"));
eval(APP.match(/^let weightSpliceWatcherWired = false;$/m)[0].replace("let", "var"));

// The select is best-effort and the correction is not (T-74). Everything here
// runs with the select taken away, because a select that lands replaces the
// number and there is nothing left to get wrong - the bug lives in the gap.
var REAL_SELECT = trySelectWeightBox;
function withoutSelect(fn) {
  trySelectWeightBox = function () {};
  try { return fn(); } finally { trySelectWeightBox = REAL_SELECT; }
}

function wireLikeScreen(box) {
  box.addEventListener("focus", function () { selectWeightBoxOnFocus(box); });
  box.addEventListener("input", function () { box.seen.push(box.value); });
}
// A thumb landing on the box. The caret is placed before the click handler
// runs - observed in a real browser for T-85.
function tapAt(box, caret) {
  var hadFocus = document.activeElement === box;
  document.activeElement = box;
  if (!hadFocus) box.dispatchEvent(new Event("focus"));
  box.selectionStart = box.selectionEnd = caret;
  box.dispatchEvent(new Event("click"));
  box.selectionStart = box.selectionEnd = caret;   // the thumb, not the select
}
// Moving the caret fires no input event, so the box stays armed. A tap on a
// phone, an arrow key on a laptop - the live reproduction used the arrows.
function moveCaret(box, caret) { box.selectionStart = box.selectionEnd = caret; }

function fireInput(box, how, data) {
  var ev = new Event("input");
  ev.inputType = how;
  ev.data = data === undefined ? null : data;
  box.dispatchEvent(ev);
}
// Everything that puts characters in: one typed key, a paste, an autofill.
function insertChunk(box, text, how, data) {
  var v = box.value, from = box.selectionStart, to = box.selectionEnd;
  box.value = v.slice(0, from) + text + v.slice(to);
  box.selectionStart = box.selectionEnd = from + text.length;
  fireInput(box, how || "insertText", data === undefined ? text : data);
}
function pasteAt(box, text) { insertChunk(box, text, "insertFromPaste", null); }
// A fresh box holding `value`, tapped at `caret`, with the select losing.
function tapped(value, caret) {
  var box = new Box(value);
  wireLikeScreen(box);
  withoutSelect(function () { tapAt(box, caret); });
  TIMERS = [];
  moveCaret(box, caret);
  return box;
}

// ---------------- the finding ----------------

var box = tapped("35", 1);
pasteAt(box, "50");
check(box.value === "50", "35 in the box, 50 pasted into the middle of it, the box holds 50 (got " + box.value + ")");
check(box.value !== "05", "and not the 05 the tester was shown");
check(Number(box.value) === 50, "which is fifty pounds, not five");
check(box.seen.length === 1 && box.seen[0] === "50",
  "and the screen - which carries it down the column - is shown 50 and never 05 (got "
  + JSON.stringify(box.seen) + ")");

// The other scrambles from the same run, each with the caret where it was.
box = tapped("3", 0); insertChunk(box, "37.5");
check(box.value === "37.5", "3 in the box, 37.5 put in front of it, the box holds 37.5 (got " + box.value + ")");
box = tapped("5", 1); insertChunk(box, "35");
check(box.value === "35", "5 in the box, 35 put after it, the box holds 35 (got " + box.value + ")");
box = tapped("3", 1); insertChunk(box, "35");
check(box.value === "35", "3 in the box, 35 put after it, the box holds 35 (got " + box.value + ")");

// ---------------- every caret, every number ----------------
// The rule is one line: whatever you put in is what the box ends up holding.
// Checked at every position in the number rather than the one the tester
// happened to land on - what made this survive is that most positions look fine.

var WAS = ["35", "5", "3", "12.5", "100", "7.5", "250"];
var PUT = ["50", "35", "37.5", "20", "1000", "0.5", "125"];
var cases = 0, wrong = [];
WAS.forEach(function (was) {
  PUT.forEach(function (put) {
    for (var caret = 0; caret <= was.length; caret++) {
      ["insertText", "insertFromPaste"].forEach(function (how) {
        var b = tapped(was, caret);
        insertChunk(b, put, how, how === "insertFromPaste" ? null : put);
        cases++;
        if (b.value !== put) wrong.push(was + " caret " + caret + " + " + put + " -> " + b.value);
      });
    }
  });
});
check(cases >= 200, "the matrix is worth checking (" + cases + " insertions)");
check(wrong.length === 0,
  "every one of them leaves the box holding exactly what was put in"
  + (wrong.length ? " - " + wrong.slice(0, 4).join("; ") + (wrong.length > 4 ? " (+" + (wrong.length - 4) + ")" : "") : ""));

// ---------------- one typed key still behaves ----------------
// Five findings' worth of behaviour runs through the same function. A fix for
// the many-character case that broke the one-character case would be a trade,
// not a fix.

box = tapped("60", 1); insertChunk(box, "5");
check(box.value === "5", "tap into 60 and type 5 meaning 65: the box holds 5, which is T-85");
box = tapped("35", 2); insertChunk(box, "4");
check(box.value === "4", "and typing at the end of it replaces it too");
box = tapped("15", 0); insertChunk(box, "2");
check(box.value === "2", "and in front of it");
box = tapped("", 0); insertChunk(box, "4");
check(box.value === "4", "an empty box keeps what is typed into it");
// The second keystroke is the member's own number growing, not a splice.
box = tapped("35", 1); insertChunk(box, "4"); insertChunk(box, "5");
check(box.value === "45", "the key after that one extends it: 45, not 4 again");

// ---------------- backspace first, unchanged ----------------

box = tapped("35", 1);
box.value = "5"; box.selectionStart = box.selectionEnd = 0;
fireInput(box, "deleteContentBackward");
check(box.value === "", "a backspace as the first thing takes the whole box, which is T-83");
insertChunk(box, "40");
check(box.value === "40", "and the number put in afterwards stands on its own");

// ---------------- what must be left alone ----------------

// An autocorrect or autofill that rewrites the value is not a splice. The
// engine names what it inserted and it does not match, so the box is left as
// the member's own business.
box = tapped("35", 2);
box.value = "150"; box.selectionStart = box.selectionEnd = 3;
fireInput(box, "insertReplacementText", "150");
check(box.value === "150", "a replacement that rewrites the box is left alone (got " + box.value + ")");

// The same, with no inputType to go on: the old string-shape test says "not a
// splice" and the caret test agrees, from opposite directions.
box = tapped("35", 2);
box.value = "150"; box.selectionStart = box.selectionEnd = 3;
fireInput(box, "");
check(box.value === "150", "and so is one the engine does not name");

// A rewrite that happens to keep the first digits is still a rewrite. What is
// in the box has to be the old number with ONE run put into it, start and end,
// or the member's own value stands.
box = tapped("123", 3);
box.value = "12945"; box.selectionStart = box.selectionEnd = 4;
fireInput(box, "");
check(box.value === "12945",
  "a rewrite that keeps the opening digits is left alone too (got " + box.value + ")");
check(insertedIntoBox("123", "12945", 4, null) === null,
  "because what follows the caret is not what followed the old number");

// A box nobody tapped is nobody's business: the EMOM field mid-rotation with
// the member typing into it has no arming to spend.
box = new Box("35");
wireLikeScreen(box);
insertChunk(box, "50");
check(box.value === "3550", "an un-armed box is not corrected at all");

// ---------------- the caret is the rule, data is the cross-check ----------------

check(insertedIntoBox("35", "3505", 3, "50") === "50",
  "the caret says 50 went in after the 3, and data agrees");
check(insertedIntoBox("35", "3505", 3, null) === "50",
  "a paste reports no data, and the caret alone still says 50");
check(insertedIntoBox("35", "3505", 3, "05") === null,
  "an engine that says it put in something else is not second-guessed");
check(splicedAddition("35", "3505") === "05",
  "the old prefix match really does answer 05 for the same box - this is the finding");
check(insertedIntoBox("35", "3505", 3) !== splicedAddition("35", "3505"),
  "and the caret answers something different, which is the fix");
check(insertedIntoBox("3", "37.53", 4, "37.5") === "37.5",
  "and 37.5 in front of a 3 is 37.5, where the prefix match said 7.5");
check(splicedAddition("3", "37.53") === "7.53",
  "where the old one answers 7.53, a number nobody anywhere typed");
check(splicedAddition("12.5", "12205.5") === "205",
  "and 205 for the 12.5 the tester checked against the running page");
// Positions that cannot be true are refused rather than guessed.
check(insertedIntoBox("35", "3505", 99, null) === null, "a caret past the end of the box is refused");
check(insertedIntoBox("35", "3505", 1, null) === null, "and one that cannot hold what was added");
check(insertedIntoBox("35", "35", 2, null) === null, "nothing added means nothing to undo");
check(insertedIntoBox("35", "3", 1, null) === null, "and a shorter box is a replaced selection, already right");

// ---------------- an engine with no caret at all ----------------
// Then one character can still be worked out and several cannot, so several
// are left alone rather than guessed at.

box = tapped("60", 1);
box.value = "650"; box.selectionStart = box.selectionEnd = null;
fireInput(box, "insertText", "5");
check(box.value === "5", "with no caret, one character is still put right (T-74, T-80, T-83, T-85)");

box = tapped("35", 1);
box.value = "3505"; box.selectionStart = box.selectionEnd = null;
fireInput(box, "insertText", "50");
check(box.value === "3505",
  "with no caret, several characters are left alone rather than scrambled (got " + box.value + ")");
check(box.value !== "05", "which is at least not the wrong number this finding is about");

print("\n  " + pass + " passed, " + fail + " failed");
