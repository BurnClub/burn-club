// A weight box holding a number it is not saving, and saying nothing about it
// (tester T-95).
//
// The cap works and says so: 2500 goes red and "Over 2000 - not saved" appears
// beside it. Two other things a box can end up holding are refused just as
// firmly and used to say nothing at all.
//
//   A number too long to BE one. Around 310 digits overflow to Infinity;
//   parseLoggedWeight failed Number.isFinite and returned `blank`, and
//   markWeightInput clears the warning for anything blank. So a box given
//   5,000 nines kept all 5,000 characters, in ordinary black, with no mark and
//   nothing stored. A key held down or a bad paste is enough.
//
//   A comma decimal half-normalised on screen. `37,5` typed into set 1 left
//   set 1 reading "37,5" while sets 2, 3 and 4 - which the app filled from the
//   parsed number - read "37.5". All four stored 37.5, so nothing was wrong
//   underneath; the column just did not look like it agreed with itself.
//
// The third, a minus sign being dropped, is pinned here as deliberate rather
// than fixed: see the last section.
//
// REPRODUCED ON THE LIVE SITE as a real member, read out of the DOM and out of
// Player.setWeights immediately after each keystroke.
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

eval(APP.match(/const MAX_LOGGED_WEIGHT = [0-9.]+;/)[0].replace("const", "var"));
eval(liftFn("normaliseDecimalComma"));
eval(liftFn("parseLoggedWeight"));
eval(liftFn("topWeightsFrom"));
eval(liftFn("markWeightInput"));
eval(liftFn("setWeightBoxValue"));
eval(liftFn("readWeightBox"));

// ---------------- a column of real weight boxes ----------------

var SCREEN = { boxes: [] };
var document = {
  createElement: function () {
    return { className: "", textContent: "", removed: false,
             remove: function () { this.removed = true; this._row.kids = this._row.kids.filter(function (k) { return k !== this; }, this); } };
  },
  getElementById: function (id) {
    if (id !== "player-weight-log") return null;
    return {
      querySelectorAll: function () {
        return SCREEN.boxes.filter(function (b) { return b.isBad(); });
      },
    };
  },
};

function Box(key, exName) {
  this.dataset = { key: key, exName: exName };
  this.value = "";
  this._classes = {};
  this._row = { kids: [] };
  var row = this._row;
  this.classList = {
    add: function (c) { row.owner._classes[c] = true; },
    remove: function (c) { delete row.owner._classes[c]; },
  };
  row.owner = this;
  row.querySelector = function (sel) {
    return row.kids.filter(function (k) { return "." + k.className === sel; })[0] || null;
  };
  row.appendChild = function (el) { el._row = row; row.kids.push(el); };
}
Box.prototype.closest = function () { return this._row; };
Box.prototype.isBad = function () { return !!this._classes["is-bad"]; };
Box.prototype.warning = function () {
  var w = this._row.kids.filter(function (k) { return k.className === "weight-log-warn" && !k.removed; })[0];
  return w ? w.textContent : null;
};

function makePlayer() {
  var P = {
    sessionWeights: {}, setWeights: {}, roundWeights: {}, index: 1,
    persist: function () {},
    currentPhase: function () { return { kind: "log-weights", blockIndex: 1 }; },
  };
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  eval("P.recordSetWeight = " + liftMethod("recordSetWeight(input, inputs, parsed)"));
  eval("P.carryWeightDown = " + liftMethod("carryWeightDown(input, inputs)"));
  eval("P.syncExerciseWeight = " + liftMethod("syncExerciseWeight(exName, inputs)"));
  eval("P.warnRefusedWeights = " + liftMethod("warnRefusedWeights()"));
  return P;
}
function column(name) {
  var boxes = [];
  for (var i = 1; i <= 4; i++) boxes.push(new Box("1|" + name + "|Set " + i, name));
  SCREEN.boxes = boxes;
  return boxes;
}
// The three lines the shipped input listener runs.
function keystroke(P, box, boxes) {
  var parsed = readWeightBox(box);
  box.dataset.touched = "1";
  P.recordSetWeight(box, boxes, parsed);
}
function typeChar(P, box, boxes, ch) { box.value = box.value + ch; keystroke(P, box, boxes); }
function typeInto(P, box, boxes, text) {
  for (var i = 0; i < text.length; i++) typeChar(P, box, boxes, text[i]);
}
// One insertion, which is how a paste or a held key arrives.
function pasteInto(P, box, boxes, text) { box.value = text; keystroke(P, box, boxes); }
function values(boxes) { return boxes.map(function (b) { return b.value; }); }
function nines(n) { var s = ""; while (s.length < n) s += "9"; return s; }

// ---------------- a number too long to be a number ----------------

check(parseLoggedWeight(nines(310)).state === "rejected",
  "310 nines are refused, not treated as an empty box (got "
  + parseLoggedWeight(nines(310)).state + ")");
check(parseLoggedWeight(nines(310)).why === "Over " + MAX_LOGGED_WEIGHT,
  "and the reason given is the cap, which is true of them by any reading (got "
  + parseLoggedWeight(nines(310)).why + ")");
check(Number(nines(310)) === Infinity,
  "set up: that many digits really do overflow to Infinity, which is what used to read as blank");
check(parseLoggedWeight(nines(5000)).state === "rejected", "and so are the tester's 5,000 of them");

var P = makePlayer();
var boxes = column("Goblet Squats");
pasteInto(P, boxes[0], boxes, nines(5000));
check(boxes[0].isBad(), "the box the member is looking at goes red");
check(String(boxes[0].warning()).indexOf("not saved") !== -1,
  "and says so beside the row (got " + JSON.stringify(boxes[0].warning()) + ")");
check(boxes[0].value.length === 5000,
  "the characters are left in the box, which is what the member typed");
check(Object.keys(P.setWeights).length === 0,
  "and nothing at all is stored (got " + JSON.stringify(P.setWeights) + ")");
check(values(boxes).slice(1).join(",") === ",,",
  "with nothing carried down the sets below, there being nothing good above them (T-94)");

var toasts = [];
function showToast(m) { toasts.push(m); }
P.warnRefusedWeights();
check(toasts.length === 1 && String(toasts[0]).indexOf("Set 1") !== -1,
  "and leaving the screen names it, the same as any other refusal (got " + JSON.stringify(toasts) + ")");

// ---------------- what must STAY blank, and why ----------------
// A lone 0, 0. or . is not a weight either, but another keystroke turns each
// of them into one. Marking them red would flash a warning at a member
// halfway through typing 0.5. Nothing but deleting rescues an overflow, which
// is what makes that one a refusal and these three not.

["", "0", "0.", "."].forEach(function (t) {
  check(parseLoggedWeight(t).state === "blank",
    JSON.stringify(t) + " is blank, not a refusal (got " + parseLoggedWeight(t).state + ")");
});
check(parseLoggedWeight("05").state === "ok" && parseLoggedWeight("05").value === 5,
  "one more key after 0 is a weight");
check(parseLoggedWeight("0.5").value === 0.5, "and after 0. it is 0.5");
check(parseLoggedWeight(".5").value === 0.5, "and after . it is 0.5");
check(parseLoggedWeight(nines(310) + "9").state === "rejected",
  "while one more key after an overflow is still an overflow");

P = makePlayer();
boxes = column("Goblet Squats");
typeInto(P, boxes[0], boxes, "0.5");
check(!boxes[0].isBad() && boxes[0].warning() === null,
  "so typing 0.5 one key at a time never flashes a warning on the way");
check(P.setWeights["1|Goblet Squats|Set 1"] === 0.5, "and lands at 0.5");

// ---------------- the comma the column disagreed about ----------------

P = makePlayer();
boxes = column("DB Chest Fly");
typeInto(P, boxes[0], boxes, "37,5");
check(boxes[0].value === "37.5",
  "a comma decimal is shown as the decimal it is read as (got "
  + JSON.stringify(boxes[0].value) + ")");
check(values(boxes).join(",") === "37.5,37.5,37.5,37.5",
  "so the column agrees with itself (got " + JSON.stringify(values(boxes)) + ")");
check(P.setWeights["1|DB Chest Fly|Set 1"] === 37.5 && P.setWeights["1|DB Chest Fly|Set 4"] === 37.5,
  "and 37.5 is what every set stores, as it always did");

// The comma has to survive long enough to be typed.
P = makePlayer();
boxes = column("DB Chest Fly");
typeInto(P, boxes[0], boxes, "37,");
check(boxes[0].value === "37,",
  "the comma is still there with no digits after it, or it could never be typed at all (got "
  + JSON.stringify(boxes[0].value) + ")");
typeChar(P, boxes[0], boxes, "5");
check(boxes[0].value === "37.5", "and becomes a decimal point on the key that completes it");

P = makePlayer();
boxes = column("DB Chest Fly");
typeInto(P, boxes[0], boxes, "0,5");
check(boxes[0].value === "0.5" && P.setWeights["1|DB Chest Fly|Set 1"] === 0.5,
  "0,5 is 0.5 on the screen and underneath it (got " + JSON.stringify(boxes[0].value) + ")");

// The swap cannot move the caret, because it cannot change the length. That
// is the whole of T-74, T-80, T-83, T-85, T-90 and T-91 on this box.
var lengths = ["37,5", "0,5", "9,99", "123,4", "37,", "1,500", ","];
var grew = lengths.filter(function (t) {
  var b = new Box("1|X|Set 1", "X");
  b.value = t;
  readWeightBox(b);
  return b.value.length !== t.length;
});
check(grew.length === 0,
  "cleaning a comma never changes the length of what is in the box (changed: "
  + JSON.stringify(grew) + ")");

// What it does NOT cover, said out loud: a comma the app reads as a thousands
// separator is left on screen. "1,500" and 1500 are the same number to anyone
// reading them, so the box is not lying - it is just not spelled the app's way.
P = makePlayer();
boxes = column("DB Chest Fly");
pasteInto(P, boxes[0], boxes, "1,500");
check(boxes[0].value === "1,500" && P.setWeights["1|DB Chest Fly|Set 1"] === 1500,
  "a thousands comma stays on screen and stores the number it reads as (got "
  + JSON.stringify(boxes[0].value) + ")");

// ---------------- the minus sign, pinned rather than fixed ----------------
// The tester's third case. A minus is stripped like any other character this
// box does not take, and what is left is what the box SHOWS - so the member is
// looking at the number that gets stored, which is the rule this screen is
// held to. A negative weight is not a thing to save. Pinned here so that if it
// ever starts storing something other than what is on the screen, this fails.

P = makePlayer();
boxes = column("Goblet Squats");
pasteInto(P, boxes[0], boxes, "-20");
check(boxes[0].value === "20", "a minus is stripped, and the box shows the 20 that is left");
check(P.setWeights["1|Goblet Squats|Set 1"] === 20,
  "which is exactly what is stored - the box is not holding one number and saving another");
check(!boxes[0].isBad(), "so there is nothing to warn about");

// ---------------- the one door is still the one door ----------------

var reader = braceMatch(CODE, CODE.indexOf("function readWeightBox("));
check(reader.indexOf('.replace(/^(\\d+),(\\d{1,2})$/, "$1.$2")') !== -1,
  "the comma swap lives in the cleaner every keystroke goes through");
check(reader.indexOf("setWeightBoxValue(input, cleaned)") !== -1,
  "which still hands the result to the one writer");
var parser = braceMatch(CODE, CODE.indexOf("function parseLoggedWeight("));
check(parser.indexOf("if (val === Infinity) {") !== -1,
  "and the overflow is refused in the one parser, before the blank catch-all");
check(parser.indexOf("if (val === Infinity)") < parser.indexOf("if (!Number.isFinite(val) || val <= 0)"),
  "in that order, or the catch-all would swallow it again");

print("\n  " + pass + " passed, " + fail + " failed");
