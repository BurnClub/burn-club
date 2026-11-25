// Tap the weight box you are ALREADY typing in, and your correction is spliced
// into the old number (tester T-85).
//
// The app's rule is "tapping a box replaces what is in it". It held the first
// time and only the first time. A click on an input that already has focus
// fires NO focus event — but the browser still moves the caret to wherever the
// thumb landed. So nothing re-armed, and the most ordinary correction there is
// produced the worst number in the app:
//
//   type 60, tap the box, type 5 meaning 65   ->  650
//
// Under the 2,000 cap, so no warning; carried down every set of that exercise;
// synced as four real lift rows; offered as "last time" next week; filed as a
// personal best.
//
// This is the FOURTH entry point into one bug, and the first three were each
// fixed on their own: focus (T-74), the app refilling the field between EMOM
// rotations (T-80), a backspace spending the arming (T-83). Every one of them
// hung the arming off a state CHANGE. What actually endangers the number is the
// member putting the caret somewhere, and a click says that every time. So the
// fix listens for the gesture, on the document, beside the correction itself.
//
// VERIFIED IN A REAL BROWSER FIRST, with a real pointer and real keystrokes,
// because the first attempt at T-74 passed 21 unit checks against a fix that
// did nothing — it rested on `beforeinput`, which the engine never delivers.
// Three runs on the same box:
//   fix on, select landing     -> 5    (and the number visibly highlighted)
//   fix on, select disabled    -> 5    (the browser really did make 650 first)
//   fix off                    -> 650  (the tester's number, exactly)
// This fake models only what that session was observed to do: a second tap
// fires click and no focus, and the caret has already moved by the time the
// handler runs.
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

// Capture phase only, for both listeners: the correction has to run before the
// screen's own input handler, which is what carries a weight down a column.
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
  this.seen = [];      // what the screen's own input handler was shown
  this.focuses = 0;    // how many focus events this box actually received
}
Box.prototype.select = function () { this.selectionStart = 0; this.selectionEnd = this.value.length; };
Box.prototype.setSelectionRange = function (a, b) { this.selectionStart = a; this.selectionEnd = b; };
Box.prototype.addEventListener = function (t, fn) { (this._l[t] = this._l[t] || []).push(fn); };
Box.prototype.dispatchEvent = function (ev) {
  ev.target = this;
  (CAPTURE[ev.type] || []).forEach(function (fn) { fn(ev); });
  (this._l[ev.type] || []).forEach(function (fn) { fn(ev); });
  if (typeof this["on" + ev.type] === "function") this["on" + ev.type](ev);
};
Box.prototype.whollySelected = function () {
  return this.selectionStart === 0 && this.selectionEnd === this.value.length;
};

// The two screens that bind with addEventListener, and the EMOM field, which
// assigns onfocus. Both are modelled, because "every weight box in the app"
// is the claim being checked.
function wireLikeSetScreen(box) {
  box.addEventListener("focus", function () { box.focuses++; selectWeightBoxOnFocus(box); });
  box.addEventListener("input", function () { box.seen.push(box.value); });
}
function wireLikeEmomField(box) {
  box.onfocus = function () { box.focuses++; selectWeightBoxOnFocus(box); };
  box.oninput = function () { box.seen.push(box.value); };
}

// A thumb landing on a box that is NOT focused: focus, then the caret, then
// the click. The caret is placed before the click handler runs — observed.
function firstTap(box, caret) {
  var hadFocus = document.activeElement === box;
  document.activeElement = box;
  if (!hadFocus) box.dispatchEvent(new Event("focus"));
  box.selectionStart = box.selectionEnd = caret;
  box.dispatchEvent(new Event("click"));
}
// A thumb landing on the box the member is ALREADY in. No focus event. This
// one line is the whole finding.
function secondTap(box, caret) {
  if (document.activeElement !== box) throw new Error("secondTap used on a box that is not focused");
  box.selectionStart = box.selectionEnd = caret;
  box.dispatchEvent(new Event("click"));
}
function blur(box) {
  document.activeElement = null;
  box.dispatchEvent(new Event("blur"));
}

function fireInput(box, inputType, data) {
  var ev = new Event("input");
  ev.inputType = inputType;
  ev.data = data === undefined ? null : data;
  box.dispatchEvent(ev);
}
function typeChar(box, ch) {
  var v = box.value, from = box.selectionStart, to = box.selectionEnd;
  box.value = v.slice(0, from) + ch + v.slice(to);
  box.selectionStart = box.selectionEnd = from + ch.length;
  fireInput(box, "insertText", ch);
}
function typeInto(box, text) { for (var i = 0; i < text.length; i++) typeChar(box, text[i]); }
function backspace(box) {
  var from = box.selectionStart, to = box.selectionEnd;
  if (from === to && from > 0) from -= 1;
  box.value = box.value.slice(0, from) + box.value.slice(to);
  box.selectionStart = box.selectionEnd = from;
  fireInput(box, "deleteContentBackward");
}
function pasteOver(box, text) {
  box.value = text;
  box.selectionStart = box.selectionEnd = text.length;
  fireInput(box, "insertFromPaste", text);
}

eval(lift("selectWeightBoxOnFocus"));
// One per line at the top level: an eval inside a callback defines the function
// in the callback's scope, where the code under test cannot see it.
eval(lift("trySelectWeightBox"));
eval(lift("armWeightBox"));
eval(lift("armWeightBoxOnTap"));
eval(lift("fillWeightBox"));
eval(lift("wireWeightBoxTyping"));
eval(lift("undoWeightSplice"));
eval(lift("splicedAddition"));
eval(APP.match(/^let weightSpliceWatcherWired = false;$/m)[0].replace("let", "var"));

// The select is best-effort and the correction is not. Everything below can be
// re-run with the select taken away, which is what the race losing looks like.
var REAL_SELECT = trySelectWeightBox;
function withoutSelect(fn) {
  trySelectWeightBox = function () {};
  try { return fn(); } finally { trySelectWeightBox = REAL_SELECT; }
}

// Nothing here is worth reading if the box was never reached — which is exactly
// how the first version of the T-74 file passed against a fix that did nothing.
function ran(box, keys, focuses) {
  if (box.seen.length !== keys) {
    throw new Error("expected " + keys + " input events, got " + box.seen.length);
  }
  if (focuses !== undefined && box.focuses !== focuses) {
    throw new Error("expected " + focuses + " focus events, got " + box.focuses);
  }
  return box.value;
}

// ======================================================================
print("\n-- the finding, exactly as reported --");
var a = new Box(""); wireLikeSetScreen(a);
firstTap(a, 0);
typeInto(a, "60");
tick();
check(ran(a, 2, 1) === "60", "the member types 60 (got " + a.value + ")");
secondTap(a, 1);                       // thumb lands between the 6 and the 0
check(a.focuses === 1, "the second tap fires no focus event — the cause of the bug");
// The visible half of the fix. The finding's last line is that a member has no
// way to know the rule only holds the first time; the number highlighting on
// every tap is how they can see that it does.
check(a.whollySelected() === true,
  "the whole number is highlighted on the second tap, exactly as on the first");
typeChar(a, "5");                      // meaning 65
check(ran(a, 3, 1) === "5", "typing after the second tap replaces, it does not splice (got " + a.value + ")");
check(a.value !== "650", "the number T-85 was filed for is gone");
check(a.seen[a.seen.length - 1] === "5",
  "and the screen's own handler is shown the corrected value, not 650 (saw " + JSON.stringify(a.seen) + ")");

print("\n-- with the select taken away, which is what losing the race looks like --");
withoutSelect(function () {
  var b = new Box(""); wireLikeSetScreen(b);
  firstTap(b, 0);
  typeInto(b, "60");
  tick();
  secondTap(b, 1);
  check(b.whollySelected() === false, "set up: nothing is selected, so the caret really is mid-number");
  typeChar(b, "5");
  check(ran(b, 3, 1) === "5",
    "the correction alone is enough: still 5, never 650 (got " + b.value + ")");
});

print("\n-- the state the tester read off the live box --");
var c = new Box(""); wireLikeSetScreen(c);
firstTap(c, 0);
typeInto(c, "60");
tick();
check(c.dataset.weightBoxFresh === undefined,
  "after the first keystroke the arming is spent, as it should be");
check(c.dataset.weightBoxWas === "",
  "and what it remembers is the empty box from the one focus event — the tester's reading");
secondTap(c, 1);
check(c.dataset.weightBoxFresh === "1", "the second tap arms it again");
check(c.dataset.weightBoxWas === "60",
  "and remembers what is actually in the box now, not what was there on focus");

print("\n-- all four numbers the tester watched go wrong --");
[
  { had: "25", typed: "55", wrong: "2555", want: "55", where: "EMOM box" },
  { had: "30", typed: "5",  wrong: "350",  want: "5",  where: "EMOM box" },
  { had: "40", typed: "5",  wrong: "450",  want: "5",  where: "per-set box" },
  { had: "60", typed: "5",  wrong: "650",  want: "5",  where: "per-set box, after a reload" },
].forEach(function (t) {
  var box = new Box(""); wireLikeSetScreen(box);
  firstTap(box, 0);
  typeInto(box, t.had);
  tick();
  secondTap(box, 1);
  typeInto(box, t.typed);
  check(box.value === t.want,
    t.where + ": " + t.had + ", tap, " + t.typed + " gives " + box.value + " and not " + t.wrong);
  check(box.value !== t.wrong, "  and " + t.wrong + " specifically cannot be stored");
});

print("\n-- the EMOM field, which is never re-focused between rotations --");
// The app refills it as the clock hands it to the next exercise (T-80). That
// is a box holding a number the member never tapped into — and tapping it is
// a SECOND tap, because the keyboard never went away.
var e = new Box(""); wireLikeEmomField(e);
document.activeElement = e;
fillWeightBox(e, "30");                 // the clock refills it; no focus event
check(e.focuses === 0, "set up: the EMOM field was never focused");
check(e.dataset.weightBoxWired === "1", "filling it is enough to make it a weight box");
secondTap(e, 1);
typeChar(e, "5");
check(ran(e, 1, 0) === "5", "tapping the refilled field and typing gives 5, not 350 (got " + e.value + ")");

print("\n-- tap after tap after tap --");
var f = new Box(""); wireLikeSetScreen(f);
firstTap(f, 0); typeInto(f, "60"); tick();
secondTap(f, 1); typeChar(f, "5");
check(f.value === "5", "second tap: 5");
secondTap(f, 0); typeChar(f, "7");
check(f.value === "7", "third tap: 7, so the rule does not run out (got " + f.value + ")");
secondTap(f, 1); typeInto(f, "80");
check(ran(f, 6, 1) === "80", "fourth tap, two digits: 80 (got " + f.value + ")");

print("\n-- the rules that were already there still hold on a re-tap --");
var g = new Box(""); wireLikeSetScreen(g);
firstTap(g, 0); typeInto(g, "35"); tick();
secondTap(g, 1);
backspace(g);
check(g.value === "", "backspace first after a re-tap empties the whole box (T-83's rule)");
typeInto(g, "40");
check(ran(g, 5, 1) === "40", "and what follows it is 40, not 405 (got " + g.value + ")");

var h = new Box(""); wireLikeSetScreen(h);
firstTap(h, 0); typeInto(h, "35"); tick();
secondTap(h, 1);
pasteOver(h, "50");
check(ran(h, 3, 1) === "50", "a paste that rewrote the box is left alone (got " + h.value + ")");

var i2 = new Box(""); wireLikeSetScreen(i2);
firstTap(i2, 0); typeInto(i2, "60"); tick();
secondTap(i2, 1);
typeInto(i2, "65");
check(ran(i2, 4, 1) === "65", "digits after the corrected one append normally (got " + i2.value + ")");

var j = new Box(""); wireLikeSetScreen(j);
firstTap(j, 0); typeInto(j, "60"); tick();
blur(j);
check(j.dataset.weightBoxFresh === undefined, "blurring clears the arming, as before");
firstTap(j, 1);
typeChar(j, "5");
check(ran(j, 3, 2) === "5", "and coming back to the box still replaces (got " + j.value + ")");

print("\n-- a click is not a licence to touch anything else --");
var other = new Box("hello");            // an ordinary input: never a weight box
other.addEventListener("input", function () { other.seen.push(other.value); });
document.activeElement = other;
other.dispatchEvent(new Event("click"));
check(other.dataset.weightBoxFresh === undefined && other.dataset.weightBoxWas === undefined,
  "clicking an input that is not a weight box arms nothing");
typeChar(other, "x");
check(other.value === "hellox", "and typing in it is not corrected (got " + other.value + ")");
var notAnElement = { type: "click" };
CAPTURE.click.forEach(function (fn) { fn({ type: "click", target: null }); });
CAPTURE.click.forEach(function (fn) { fn({ type: "click", target: notAnElement }); });
check(true, "a click whose target has no dataset does not throw");

print("\n-- one door, not four --");
var src = lift("wireWeightBoxTyping");
check(/document\.addEventListener\("click"/.test(src),
  "the tap arming is registered on the document, not on each box");
check((APP.match(/armWeightBoxOnTap/g) || []).length === 2,
  "and it is referenced exactly twice — the listener and the function itself — so no screen has to remember it");
var onTap = lift("armWeightBoxOnTap");
check(/weightBoxWired/.test(onTap),
  "it recognises a weight box by the mark every box gets the first time it is armed");

print("\n" + pass + " passed   " + fail + " failed");
