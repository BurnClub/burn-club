// Tap a pre-filled weight box and type without pausing, and the number that
// gets stored is not the number that was typed (tester T-74).
//
// T-60 fixed the splice by selecting the box's contents on focus. That select
// has to be deferred a tick, because the browser places the caret after the
// focus handler runs and undoes a synchronous select(). The tick is a race:
//
//   15, type "20" with no pause   ->  1205   (spliced; under the cap, so it is
//                                             stored, carried down the column,
//                                             synced, filed as a personal best)
//   15, type "2", tick, type "0"  ->  0      (the select ate the first digit)
//   15, pause, type "20"          ->  20     (the only case T-60 was tested on)
//
// On a phone the race is lost by default: from the second box onward the
// keyboard is already up, so there is nothing to wait for. Both an earlier
// tester run and I dismissed sightings of this as automation artefacts.
//
// The fix remembers what the box held when it was tapped and undoes the splice.
// These checks drive the real focus and typing path in the smallest browser
// that can show the bug, with the tick under the test's control — so the fix is
// checked at every point in the race, not just where it used to work.
//
// A FIRST VERSION OF THIS FILE PASSED AGAINST A BROKEN FIX. That fix cancelled
// `beforeinput`; these tests implemented beforeinput, and the real browser did
// not deliver it at all, so 21 checks were green while the app still stored
// 1205. Hence the two rules this file now keeps: the fake browser models only
// events the real one was observed to fire, and every check counts the events
// it caused, so a check can no longer pass on a box nothing reached.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var HTML = readFile("../../index.html");
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
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ---------------- the smallest browser that can show it ----------------

// mock-supabase.js stubs setTimeout to a no-op; this test needs a queue it can
// fire on command, which is the whole point of it.
var TIMERS = [];
setTimeout = function (fn) { TIMERS.push(fn); return TIMERS.length; };
function tick() { var q = TIMERS; TIMERS = []; q.forEach(function (f) { f(); }); }

// The document, with capture-phase listeners — the fix depends on running
// before the screen's own input handler, and that ordering is the only reason
// the correction lands before a wrong weight is carried down a column.
var CAPTURE = {};
var document = {
  createElement: function () {
    return { className: "", textContent: "", removed: false,
             remove: function () { this.removed = true; } };
  },
  activeElement: null,
  addEventListener: function (type, fn, capture) {
    if (!capture) throw new Error("the correction must be in the capture phase");
    (CAPTURE[type] = CAPTURE[type] || []).push(fn);
  },
};

function Event(type, opts) { this.type = type; this.bubbles = !!(opts && opts.bubbles); }

function Box(value) {
  this.value = value;
  this.dataset = {};
  this.selectionStart = this.selectionEnd = value.length;
  this._l = {};
  this.seen = [];          // what each screen-level input handler was shown
}
Box.prototype.select = function () { this.selectionStart = 0; this.selectionEnd = this.value.length; };
Box.prototype.setSelectionRange = function (a, b) { this.selectionStart = a; this.selectionEnd = b; };
Box.prototype.addEventListener = function (t, fn) { (this._l[t] = this._l[t] || []).push(fn); };
Box.prototype.listenerCount = function (t) { return (this._l[t] || []).length; };
Box.prototype.dispatchEvent = function (ev) {
  ev.target = this;
  // Capture on the document first, then the element's own listeners, then its
  // on* property — the order a real element uses.
  (CAPTURE[ev.type] || []).forEach(function (fn) { fn(ev); });
  (this._l[ev.type] || []).forEach(function (fn) { fn(ev); });
  if (typeof this["on" + ev.type] === "function") this["on" + ev.type](ev);
  return true;
};
Box.prototype.whollySelected = function () {
  return this.selectionStart === 0 && this.selectionEnd === this.value.length;
};

// Every box is wired the way the three screens wire theirs: an input handler
// that reads the box. This is what has to see the corrected number.
function screenWiring(box) {
  box.addEventListener("input", function () { box.seen.push(box.value); });
}

// A thumb landing on the box: focus, with the caret dropped where it hit.
function tap(box, caret) {
  document.activeElement = box;
  box.selectionStart = box.selectionEnd = caret;
  selectWeightBoxOnFocus(box);
  // The browser places the caret AFTER the focus handler runs, undoing any
  // synchronous select(). This line is the bug's whole cause, so the test keeps
  // it: without it a synchronous select would look sufficient.
  box.selectionStart = box.selectionEnd = caret;
}

// The real `input` event is an InputEvent carrying inputType — confirmed in a
// browser, not assumed, because `beforeinput` turned out never to be delivered
// at all. The fake says so too, or the deletion rule would go untested.
function fireInput(box, inputType, data) {
  var ev = new Event("input", { bubbles: true });
  ev.inputType = inputType;
  ev.data = data === undefined ? null : data;
  box.dispatchEvent(ev);
}
// A real keystroke: the browser edits the box, then fires input.
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
function pasteOver(box, text) {   // a paste replacing the whole box
  box.value = text;
  box.selectionStart = box.selectionEnd = text.length;
  fireInput(box, "insertFromPaste", text);
}

eval(lift("selectWeightBoxOnFocus"));
// One per line, at the top level: an eval inside a callback defines the
// function in the callback's scope, where the code under test cannot see it.
eval(lift("trySelectWeightBox"));
eval(lift("armWeightBox"));
eval(lift("fillWeightBox"));
eval(lift("wireWeightBoxTyping"));

// markWeightInput hangs the warning off the row the box sits in and toggles a
// class on the box, so the fake box grows both - lazily, so the Box
// constructors above stay as they were. These harnesses can now watch the red
// mark as well as the number, which is the pair T-90 tied together.
function rowFor(box) {
  if (box._row) return box._row;
  var row = { kids: [] };
  row.querySelector = function (sel) {
    return row.kids.filter(function (k) { return "." + k.className === sel; })[0] || null;
  };
  row.appendChild = function (el) { el._row = row; row.kids.push(el); };
  box._row = row;
  return row;
}
Box.prototype.closest = function () { return rowFor(this); };
Object.defineProperty(Box.prototype, "classList", {
  get: function () {
    var box = this;
    if (!box._classes) box._classes = {};
    return {
      add: function (c) { box._classes[c] = true; },
      remove: function (c) { delete box._classes[c]; },
      contains: function (c) { return !!box._classes[c]; },
    };
  },
});
Box.prototype.isBad = function () { return !!(this._classes && this._classes["is-bad"]); };
Box.prototype.warning = function () {
  var w = rowFor(this).kids.filter(function (k) {
    return k.className === "weight-log-warn" && !k.removed;
  })[0];
  return w ? w.textContent : null;
};

// setWeightBoxValue marks the row, so the parser and the marker come with
// it, and the fake box below grows the two things markWeightInput touches
// (T-90). That makes these harnesses watch the red mark as well as the
// number, which is what the one writer now ties together.
eval(APP.match(/const MAX_LOGGED_WEIGHT = [0-9.]+;/)[0].replace("const", "var"));
eval(lift("normaliseDecimalComma"));
eval(lift("parseLoggedWeight"));
eval(lift("markWeightInput"));
// The one place a weight box's value is written and marked (T-90).
eval(lift("setWeightBoxValue"));
eval(lift("undoWeightSplice"));
// What undoWeightSplice now works the insertion out with: the caret, which
// is exact where matching a prefix was a guess for more than one character
// (tester T-91). splicedAddition stays as the no-caret fallback.
eval(lift("insertedIntoBox"));
eval(lift("splicedAddition"));
eval(APP.match(/^let weightSpliceWatcherWired = false;$/m)[0].replace("let", "var"));

// Nothing below is worth reading if the box is never reached, which is exactly
// how the first version of this file passed against a fix that did nothing.
function ran(box, keys) {
  if (box.seen.length !== keys) {
    throw new Error("expected " + keys + " input events, got " + box.seen.length);
  }
  return box.value;
}

// ---------------- the race, at every point in it ----------------

var b = new Box("15"); screenWiring(b);
tap(b, 1);                       // thumb lands between the 1 and the 5
typeInto(b, "20");
tick();
check(ran(b, 2) === "20", "tapped and typed with no pause, 15 becomes 20 (got " + b.value + ")");
check(b.value !== "1205", "the spliced number T-74 was filed for is gone");
check(b.seen[b.seen.length - 1] === "20",
  "and the screen's own handler is shown 20, not the spliced number (saw " + JSON.stringify(b.seen) + ")");

var c = new Box("15"); screenWiring(c);
tap(c, 1);
typeChar(c, "2");
tick();                          // the deferred select arrives mid-word
typeChar(c, "0");
check(ran(c, 2) === "20", "one keystroke, then the tick, then the next: still 20 (got " + c.value + ")");
check(c.value !== "0", "the deferred select can no longer eat the digits already typed");

var d = new Box("15"); screenWiring(d);
tap(d, 1);
tick();                          // the member pauses: the case that always worked
typeInto(d, "20");
check(ran(d, 2) === "20", "pausing long enough still works");

var e = new Box("15"); screenWiring(e);
tap(e, 2);                       // thumb lands past the end of the number
typeInto(e, "20");
tick();
check(ran(e, 2) === "20", "a tap at the end of the number replaces it too (got " + e.value + ")");

var f = new Box("80"); screenWiring(f);
tap(f, 1);
typeInto(f, "7.5");
tick();
check(ran(f, 3) === "7.5", "a decimal typed straight after the tap survives (got " + f.value + ")");

var f2 = new Box("15"); screenWiring(f2);
tap(f2, 1);
typeInto(f2, "7,5");
tick();
check(ran(f2, 3) === "7,5", "and so does a comma, which the parser reads as a decimal (got " + f2.value + ")");

var g = new Box("15"); screenWiring(g);
tap(g, 1);
typeInto(g, "205");
tick();
check(ran(g, 3) === "205", "three digits with no pause give three digits (got " + g.value + ")");

// The repeated-digit cases, where working out what was typed is ambiguous.
var g2 = new Box("100"); screenWiring(g2);
tap(g2, 1);
typeInto(g2, "10");
tick();
check(ran(g2, 2) === "10", "100 retyped as 10 is 10, not 1100 or 1000 (got " + g2.value + ")");

var g3 = new Box("11"); screenWiring(g3);
tap(g3, 1);
typeInto(g3, "1");
tick();
check(ran(g3, 1) === "1", "11 retyped as 1 is 1 (got " + g3.value + ")");

// ---------------- what must NOT change ----------------

var h = new Box(""); screenWiring(h);
tap(h, 0);
typeInto(h, "45");
tick();
check(ran(h, 2) === "45", "an empty box just takes what is typed (got " + h.value + ")");

// Only the FIRST keystroke is corrected. After that the member is editing their
// own number and the box must behave like a box.
var i2 = new Box("15"); screenWiring(i2);
tap(i2, 1);
typeChar(i2, "2");               // corrected -> "2"
i2.selectionStart = i2.selectionEnd = 0;
typeChar(i2, "9");               // spliced   -> "92"
check(ran(i2, 2) === "92", "the rule is one keystroke only, not every keystroke (got " + i2.value + ")");

// A backspace as the first thing after tapping in: had the select landed, the
// whole box would have gone with it, so it does.
var j = new Box("150"); screenWiring(j);
tap(j, 3);
backspace(j);
check(ran(j, 1) === "", "a first-keystroke backspace clears the box, as the select would have (got '" + j.value + "')");

// T-83: and the digits typed after it are not spliced into what was left.
var j2 = new Box("35"); screenWiring(j2);
tap(j2, 1);
backspace(j2);
typeInto(j2, "40");
check(ran(j2, 3) === "40", "35, backspace, 40 gives 40 — not 405 carried down the column (got " + j2.value + ")");

// A backspace that is NOT the first thing is an ordinary backspace.
var j3 = new Box("35"); screenWiring(j3);
tap(j3, 1);
typeInto(j3, "456");
backspace(j3);
check(ran(j3, 4) === "45", "a backspace later on just deletes a character (got " + j3.value + ")");

// An engine that reports no inputType gets the safe half of the rule: deleting
// a character from "25" and replacing "25" with "2" both leave "2", so a
// shorter value is left alone rather than guessed at and emptied.
var j4 = new Box("25"); screenWiring(j4);
tap(j4, 2);
j4.value = "2"; j4.selectionStart = j4.selectionEnd = 1;
j4.dispatchEvent(new Event("input", { bubbles: true }));
check(ran(j4, 1) === "2", "with no inputType to go on, a shorter value is left alone (got '" + j4.value + "')");

var k = new Box("150"); screenWiring(k);
tap(k, 1);
pasteOver(k, "1000");
check(ran(k, 1) === "1000", "a paste over the box is left exactly as pasted (got " + k.value + ")");

// The select landing is still the normal case, and must not be undone.
var q = new Box("15"); screenWiring(q);
tap(q, 1);
tick();
q.selectionStart = 0; q.selectionEnd = 2;   // the select took the box
typeChar(q, "2");                           // the browser replaces the selection
check(ran(q, 1) === "2", "when the select does land, the replacement is left alone (got " + q.value + ")");

// The EMOM box is wired with input.oninput = ..., not addEventListener.
var m = new Box("15");
var mSaw = [];
m.oninput = function () { mSaw.push(m.value); };
tap(m, 1);
typeInto(m, "20");
check(mSaw.length === 2 && mSaw[1] === "20",
  "the EMOM box's oninput handler sees the correction too (saw " + JSON.stringify(mSaw) + ")");

// The EMOM box outlives every exercise rotation, so focusing it again must not
// stack another handler on it.
var n = new Box("15");
for (var r = 0; r < 5; r++) { tap(n, 1); tick(); }
check(n.listenerCount("blur") === 1,
  "five focuses wire the box once (got " + n.listenerCount("blur") + ")");
check((CAPTURE.input || []).length === 1,
  "and there is one correction on the document, however many boxes are tapped (got "
  + (CAPTURE.input || []).length + ")");

// Focus moved on before the tick: the deferred select must not reach back and
// select a box the member has left.
var o = new Box("15");
tap(o, 1);
document.activeElement = new Box("");
tick();
check(!o.whollySelected(), "the deferred select does nothing once focus has moved away");

// Leaving the box and coming back arms it again — the box now holds the
// member's own number, and tapping it to retype is the same gesture.
var p2 = new Box("15"); screenWiring(p2);
tap(p2, 1);
typeInto(p2, "20");
p2.dispatchEvent(new Event("blur"));
document.activeElement = null;
tap(p2, 1);
typeInto(p2, "35");
tick();
check(ran(p2, 4) === "35", "tapping back in replaces again (got " + p2.value + ")");

// An input event that did not change the box — an IME, or a keystroke the
// browser refused — must leave it alone. Without the length guard this empties
// the box: everything matches, so "what was typed" works out to nothing.
var same = new Box("15"); screenWiring(same);
tap(same, 1);
same.dispatchEvent(new Event("input", { bubbles: true }));
check(ran(same, 1) === "15", "an input event that changed nothing leaves the box alone (got '" + same.value + "')");

// An input event from somewhere else in the app must not be touched.
var other = new Box("hello"); screenWiring(other);
typeChar(other, "!");
check(ran(other, 1) === "hello!", "a box that was never tapped as a weight box is left alone");

// ---------------- the splice arithmetic on its own ----------------

check(splicedAddition("15", "125") === "2", "125 is 15 with a 2 pushed into it");
check(splicedAddition("15", "152") === "2", "and so is 152");
check(splicedAddition("15", "215") === "2", "and 215");
check(splicedAddition("80", "870") === "7", "870 is 80 with a 7 in the middle");
check(splicedAddition("15", "1000") === null, "1000 is not 15 with anything added, so it is left alone");
check(splicedAddition("", "45") === "45", "nothing plus 45 is 45");

// ---------------- T-80: the box the member never taps ----------------

// On an EMOM the box is never re-focused between rotations: the keyboard is
// already up and the app just refills the field as the clock hands it to the
// next exercise. Arming only on focus meant the correction never ran there.
var emom = new Box(""); screenWiring(emom);
tap(emom, 0);                       // tapped once, at the start of the block
typeInto(emom, "15");               // first rotation logged
// The clock turns. The app refills the box — no focus, no tap, keyboard up.
fillWeightBox(emom, "15");
emom.selectionStart = emom.selectionEnd = 1;   // the caret sits where it was
typeInto(emom, "20");
check(ran(emom, 4) === "20",
  "a rotation refilled by the app still replaces on the next keystroke (got " + emom.value + ")");
check(emom.value !== "1205", "and does not give the spliced number T-80 was filed for");

// Refilling with nothing leaves an empty box that simply takes what is typed.
var emom2 = new Box("40"); screenWiring(emom2);
fillWeightBox(emom2, "");
typeInto(emom2, "35");
check(ran(emom2, 2) === "35", "a box the app empties takes what is typed (got " + emom2.value + ")");

// Arming happens once per refill, not once per keystroke after it.
var emom3 = new Box(""); screenWiring(emom3);
fillWeightBox(emom3, "40");
typeInto(emom3, "35");
check(ran(emom3, 2) === "35", "the refilled number is replaced, then typing continues normally (got " + emom3.value + ")");

// A refill wires the box even if it has never been focused in its life.
var never = new Box("");
fillWeightBox(never, "40");
check(never.dataset.weightBoxWired === "1", "a box the member never tapped is still wired");
check(never.dataset.weightBoxWas === "40", "and remembers what the app put in it");

// ---------------- still one door, still a text input ----------------

function bodyOfFn(name) {
  var start = CODE.indexOf("function " + name + "(");
  if (start < 0) return "";
  var depth = 0;
  for (var i = CODE.indexOf("{", start); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(start, i + 1); }
  }
  return "";
}
// Followed one hop into armWeightBox, which is where both now live — a box is
// armed by the app refilling it as well as by a tap (T-80).
check(bodyOfFn("selectWeightBoxOnFocus").indexOf("armWeightBox(input)") !== -1,
  "every screen that selects on focus gets the correction with it");
check(bodyOfFn("armWeightBox").indexOf("wireWeightBoxTyping(input)") !== -1,
  "arming wires the correction");
check(bodyOfFn("armWeightBox").indexOf("weightBoxWas") !== -1,
  "and remembers what the box held on the way in");
check(bodyOfFn("fillWeightBox").indexOf("armWeightBox(input)") !== -1,
  "and the app putting a number into a box arms it too");
// The EMOM refill must go through that door, which is the whole of T-80.
// syncEmomWeightField is a METHOD on the player, not a function declaration,
// so bodyOfFn cannot find it — it returned "" and the check passed on nothing.
function methodBody(sig) {
  var at = CODE.indexOf("\n  " + sig + " {");
  if (at < 0) return "";
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
}
var emomField = methodBody("syncEmomWeightField(exerciseName)");
check(emomField !== "", "the EMOM weight field is still wired by the player");
check(emomField.indexOf("fillWeightBox(input,") !== -1,
  "the EMOM field is refilled through it, not by a bare assignment");
check(/input\.value = this\.sessionWeights\[exerciseName\]/.test(CODE) === false,
  "the bare assignment that left the EMOM box unarmed is gone");
check(bodyOfFn("wireWeightBoxTyping").indexOf('"input"') !== -1
  && bodyOfFn("wireWeightBoxTyping").indexOf("true)") !== -1,
  "the correction listens for input, in the capture phase");
check(bodyOfFn("wireWeightBoxTyping").indexOf("beforeinput") === -1,
  "and not for beforeinput, which the real browser did not deliver");
check((CODE.match(/=> selectWeightBoxOnFocus\(input\)/g) || []).length === 3,
  "all three weight screens still go through the one focus helper (got "
  + (CODE.match(/=> selectWeightBoxOnFocus\(input\)/g) || []).length + ")");
// select() is a no-op on a number input and setSelectionRange() throws there,
// so the input type is part of this fix, not a detail of the markup.
var emomTag = (HTML.match(/<input[^>]*id="player-emom-weight-input"[^>]*>/) || [""])[0];
check(emomTag.indexOf('type="text"') !== -1 && emomTag.indexOf('inputmode="decimal"') !== -1,
  "the EMOM box is still a text input with inputmode=decimal");

print(pass + " passed, " + fail + " failed");
