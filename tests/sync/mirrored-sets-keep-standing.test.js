// Fixing one set emptied every set below it (tester T-94).
//
// The member types 50 into set 1. The app fills sets 2, 3 and 4 with 50 - that
// is the whole point of the carry-down, and four boxes reading 50 is what the
// member is now looking at. They tap set 2 to adjust it and press backspace
// once. Sets 2, 3 AND 4 go blank, with nothing said. If they do not notice,
// "Save and continue" takes them on and the workout is logged with ONE set for
// that exercise instead of four.
//
// This was the cost of how T-92 was fixed: the carry-down became one walk used
// in both directions, so a box holding nothing storable carried emptiness down
// the untouched sets below it. That is exactly right when there is nothing
// above - typing 2500 into set 1 must not leave the 250 of the keystroke
// before standing on three sets - and wrong when there is: sets 3 and 4 were
// mirroring set 1's 50, and set 1 still said 50.
//
// REPRODUCED ON THE LIVE SITE as a real member before any of this was written,
// twice, on two different workouts and exercises, one of them after a full page
// reload; and followed to the server, where the finished workout has one
// `lifts` row for an exercise whose four boxes had read 100 a moment earlier.
//
// The rule now: an untouched set shows the NEAREST WEIGHT THE APP WOULD STORE
// at or above it. Nothing a box says about itself can empty a row that has a
// good number above it; with nothing above it the row still empties, which is
// T-92.
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
// Enough DOM for the shipped markWeightInput, which hangs the warning off the
// row the box sits in, and for the shipped warnRefusedWeights, which reads the
// screen back.

var toasts = [];
function showToast(msg) { toasts.push(msg); }

var SCREEN = { boxes: [] };
var document = {
  createElement: function () {
    return { className: "", textContent: "", removed: false,
             remove: function () { this.removed = true; this._row.kids = this._row.kids.filter(function (k) { return k !== this; }, this); } };
  },
  getElementById: function (id) {
    if (id !== "player-weight-log") return null;
    return {
      querySelectorAll: function (sel) {
        if (sel !== ".weight-log-input.is-bad") throw new Error("unexpected selector " + sel);
        return SCREEN.boxes.filter(function (b) { return b.isBad(); });
      },
    };
  },
};

function Box(key, exName, value) {
  this.dataset = { key: key, exName: exName };
  this.value = value == null ? "" : String(value);
  this._classes = {};
  this._row = { kids: [] };
  var row = this._row;
  this.classList = {
    add: function (c) { row.owner._classes[c] = true; },
    remove: function (c) { delete row.owner._classes[c]; },
    contains: function (c) { return !!row.owner._classes[c]; },
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
    sessionWeights: {}, setWeights: {}, roundWeights: {}, index: 2,
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

function column(names, prefill) {
  var boxes = [];
  names.forEach(function (n) {
    for (var i = 1; i <= 4; i++) boxes.push(new Box("1|" + n + "|Set " + i, n, prefill == null ? "" : prefill));
  });
  SCREEN.boxes = boxes;
  return boxes;
}

// The three lines the shipped input listener runs, and nothing else.
function keystroke(P, box, boxes) {
  var parsed = readWeightBox(box);
  box.dataset.touched = "1";
  P.recordSetWeight(box, boxes, parsed);
}
function typeChar(P, box, boxes, ch) { box.value = box.value + ch; keystroke(P, box, boxes); }
function typeInto(P, box, boxes, text) {
  for (var i = 0; i < text.length; i++) typeChar(P, box, boxes, text[i]);
}
// Tapping a box selects what is in it (T-60), so the first key REPLACES it.
function tapType(P, box, boxes, text) { box.value = ""; typeInto(P, box, boxes, text); }
// Backspace with the tap's selection still live: one key clears the box. This
// is the tester's gesture, and why sets 3 and 4 went blank on the first press.
function tapBackspace(P, box, boxes) { box.value = ""; keystroke(P, box, boxes); }
// Backspace with the caret parked at the end instead - one character at a time.
function backspace(P, box, boxes) { box.value = box.value.slice(0, -1); keystroke(P, box, boxes); }
function values(boxes) { return boxes.map(function (b) { return b.value; }); }
function recorded(P) { return topWeightsFrom(P.sessionWeights, P.setWeights, P.roundWeights); }

// ---------------- the finding, the tester's own gesture ----------------

var P = makePlayer();
var boxes = column(["DB Chest Fly"]);
typeInto(P, boxes[0], boxes, "50");
check(values(boxes).join(",") === "50,50,50,50", "typing 50 into set 1 fills all four boxes");

tapBackspace(P, boxes[1], boxes);
check(boxes[1].value === "", "tapping set 2 and pressing backspace once empties set 2");
check(boxes[2].value === "50" && boxes[3].value === "50",
  "and sets 3 and 4 keep the 50 they were mirroring from set 1 (got "
  + JSON.stringify(values(boxes)) + ")");
check(P.setWeights["1|DB Chest Fly|Set 3"] === 50 && P.setWeights["1|DB Chest Fly|Set 4"] === 50,
  "which is also what is stored for them (got " + JSON.stringify(P.setWeights) + ")");
check(P.setWeights["1|DB Chest Fly|Set 2"] === undefined,
  "while set 2, the one the member emptied, stores nothing");
check(Object.keys(P.setWeights).length === 3,
  "three sets logged, not one - the finding was one (got " + Object.keys(P.setWeights).length + ")");
check(recorded(P)["DB Chest Fly"] === 50, "and the exercise still carries the 50 on the screen");

// The same with the caret at the end rather than a live selection, which is
// the other way a thumb gets there.
P = makePlayer();
boxes = column(["DB Chest Fly"]);
typeInto(P, boxes[0], boxes, "50");
backspace(P, boxes[1], boxes);
// Mid-edit, 5 is still a weight, so the sets below mirror it - that is the
// carry-down doing its job, and the member typing 55 next gets 55 on all
// three. They only fall back when set 2 stops holding a weight at all.
check(values(boxes).join(",") === "50,5,5,5",
  "one character off set 2 carries the 5 down while it is still a number (got "
  + JSON.stringify(values(boxes)) + ")");
backspace(P, boxes[1], boxes);
check(values(boxes).join(",") === "50,,50,50",
  "and the second press empties set 2 alone (got " + JSON.stringify(values(boxes)) + ")");

// ---------------- the refused half of the same finding ----------------
// Set 1 at a good 100, 2500 typed into set 2. The member is told about set 2.
// Sets 3 and 4 used to empty themselves with nothing said about them.

P = makePlayer();
boxes = column(["Alternating Neutral DB Chest Press"]);
typeInto(P, boxes[0], boxes, "100");
tapType(P, boxes[1], boxes, "2500");
check(boxes[1].isBad() && String(boxes[1].warning()).indexOf("not saved") !== -1,
  "set 2 is refused and says so on its own row");
check(boxes[2].value === "100" && boxes[3].value === "100",
  "and sets 3 and 4 fall back to set 1's 100 (got " + JSON.stringify(values(boxes)) + ")");
check(values(boxes).indexOf("250") === -1,
  "the 250 of the keystroke before is on no box, which is T-92");
check(P.setWeights["1|Alternating Neutral DB Chest Press|Set 2"] === undefined,
  "set 2 stores nothing");
check(recorded(P)["Alternating Neutral DB Chest Press"] === 100,
  "and 100 is what gets recorded (got " + recorded(P)["Alternating Neutral DB Chest Press"] + ")");

// ---------------- T-92 still fixed: nothing above means nothing below ----------------

P = makePlayer();
boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "2500");
check(values(boxes).join(",") === "2500,,,",
  "2500 typed into set 1 leaves the sets below EMPTY - there is no good number above them (got "
  + JSON.stringify(values(boxes)) + ")");
check(Object.keys(P.setWeights).length === 0, "and nothing is stored for the exercise at all");
check(recorded(P)["Goblet Squats"] === undefined, "so there is no 250 lb personal best");

// Emptying set 1 by hand does the same, and should: the mirrors came from it.
P = makePlayer();
boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "80");
tapBackspace(P, boxes[0], boxes);
check(values(boxes).join(",") === ",,,", "clearing set 1 clears the column it filled");
check(Object.keys(P.setWeights).length === 0, "and nothing is left stored");

// ---------------- a row above the one being typed in is read, never written ----------------

P = makePlayer();
boxes = column(["DB RDL"], "60");          // the pre-fill, on every row, untouched
boxes.forEach(function (b) { P.setWeights[b.dataset.key] = 60; });   // as the seeding pass leaves it
tapType(P, boxes[1], boxes, "50");
check(boxes[0].value === "60", "set 1's pre-filled 60 survives typing into set 2");
check(P.setWeights["1|DB RDL|Set 1"] === 60, "and is still stored");
check(boxes[2].value === "50" && boxes[3].value === "50",
  "while sets 3 and 4 follow set 2's 50 (got " + JSON.stringify(values(boxes)) + ")");
// And a refusal in set 2 falls back to the row above it, not to empty.
tapType(P, boxes[1], boxes, "9000");
check(boxes[0].value === "60" && boxes[2].value === "60" && boxes[3].value === "60",
  "a refused set 2 leaves the column at the 60 standing above it (got "
  + JSON.stringify(values(boxes)) + ")");

// ---------------- a set already stored is the member's, not a mirror ----------------
// A resumed workout comes back with the boxes reading what was stored for each
// set. One edit to set 1 used to flatten the rest into it.

P = makePlayer();
boxes = column(["Back Squat"]);
[40, 50, 60, 60].forEach(function (w, i) {
  boxes[i].value = String(w);
  boxes[i].dataset.touched = "1";          // what the seeding pass now marks
  P.setWeights[boxes[i].dataset.key] = w;
});
tapType(P, boxes[0], boxes, "42");
check(values(boxes).join(",") === "42,50,60,60",
  "editing set 1 of a resumed workout leaves the other three alone (got "
  + JSON.stringify(values(boxes)) + ")");
check(P.setWeights["1|Back Squat|Set 2"] === 50 && P.setWeights["1|Back Squat|Set 3"] === 60,
  "and what is stored for them is untouched (got " + JSON.stringify(P.setWeights) + ")");

// ---------------- the exercise next to it is not collateral ----------------

P = makePlayer();
boxes = column(["Goblet Squats", "KB Swing"]);
typeInto(P, boxes[4], boxes, "60");
typeInto(P, boxes[0], boxes, "95");
check(values(boxes).slice(4).join(",") === "60,60,60,60",
  "typing in one exercise leaves the next exercise's column alone");
tapBackspace(P, boxes[5], boxes);
check(values(boxes).slice(0, 4).join(",") === "95,95,95,95",
  "and clearing a set of the second exercise does not reach back up into the first");
check(boxes[6].value === "60" && boxes[7].value === "60",
  "while its own sets 3 and 4 keep the 60 above them");

// ---------------- "Save and continue" says so on the way out ----------------

P = makePlayer();
boxes = column(["Goblet Squats"]);
toasts = [];
typeInto(P, boxes[0], boxes, "50");
P.warnRefusedWeights();
check(toasts.length === 0, "a clean screen says nothing on the way out");

tapType(P, boxes[1], boxes, "2500");
toasts = [];
P.warnRefusedWeights();
check(toasts.length === 1, "a refused box is named when the member leaves the screen");
check(String(toasts[0]).indexOf("Set 2") !== -1,
  "and it is named by the row the member was in (got " + JSON.stringify(toasts[0]) + ")");

tapType(P, boxes[2], boxes, "3000");
toasts = [];
P.warnRefusedWeights();
check(toasts.length === 1 && String(toasts[0]).indexOf("Set 2") !== -1
  && String(toasts[0]).indexOf("Set 3") !== -1,
  "two refused boxes are both named (got " + JSON.stringify(toasts[0]) + ")");

// Driven through the button's own path rather than by calling the warning
// directly, because "Save and continue" being silent is half the finding.
P = makePlayer();
boxes = column(["Goblet Squats"]);
eval("P.advance = " + liftMethod("advance()"));
P.phases = [{ kind: "log-weights" }, { kind: "rest" }];
P.index = 0;
P.remaining = 0;
P.cardioChoice = null;
P.cardioMinutes = 0;
P.stop = function () {};
P.renderPhase = function () { P.rendered = (P.rendered || 0) + 1; };
P.finish = function () { P.finished = (P.finished || 0) + 1; };
P.currentPhase = function () { return this.phases[this.index]; };

typeInto(P, boxes[0], boxes, "50");
toasts = [];
P.advance();
check(P.index === 1 && P.rendered === 1, "Save and continue moves the member on");
check(toasts.length === 0, "and says nothing when every box on the screen was saved");

P.index = 0;
tapType(P, boxes[1], boxes, "2500");
toasts = [];
P.advance();
check(P.index === 1, "a refused box does not block the tap - mid-workout, they must get on");
check(toasts.length === 1 && String(toasts[0]).indexOf("Set 2") !== -1,
  "but they are told on the way out which set was not saved (got "
  + JSON.stringify(toasts) + ")");

// Leaving any other kind of phase says nothing, whatever is in the DOM.
P.index = 1;
toasts = [];
P.advance();
check(toasts.length === 0, "leaving a rest screen says nothing about weight boxes");

check(CODE.indexOf('on("player-complete-set-btn", "click", () => Player.advance())') !== -1,
  "and the button the member taps is wired to advance(), which is what runs it");

// ---------------- the property, after every single keystroke ----------------
// The rule in one line, computed here from the column rather than from the
// code: an untouched box shows the nearest weight the app would store at or
// above it. Checked after every key of a clumsy session, because what T-94
// left behind appeared on one keystroke in the middle of one.

function nearestStandingAbove(boxes, i) {
  var standing = "";
  for (var j = 0; j < i; j++) {
    if (boxes[j].dataset.exName !== boxes[i].dataset.exName) continue;
    var p = parseLoggedWeight(boxes[j].value);
    if (p.state === "ok") standing = String(p.value);
  }
  return standing;
}

P = makePlayer();
boxes = column(["Goblet Squats", "KB Swing"]);
var script = [
  [0, "50"], [1, "\b"], [1, "\b"], [0, "2500"], [0, "\b\b"], [2, "120"],
  [1, "37,5"], [4, "60"], [5, "2500"], [6, "\b"], [0, "\b\b\b"], [3, "7.5"],
  [5, "\b\b\b\b40"], [2, "9000"], [4, "\b\b"],
];
var broken = null, steps = 0, touchedEx = {};
script.forEach(function (step) {
  var box = boxes[step[0]];
  for (var i = 0; i < step[1].length; i++) {
    if (step[1][i] === "\b") backspace(P, box, boxes); else typeChar(P, box, boxes, step[1][i]);
    steps++;
    touchedEx[box.dataset.exName] = true;
    boxes.forEach(function (b, idx) {
      if (b.dataset.touched === "1" || !touchedEx[b.dataset.exName]) return;
      var want = nearestStandingAbove(boxes, idx);
      if (b.value !== want && !broken) {
        broken = b.dataset.key + " shows " + JSON.stringify(b.value) + " with "
          + JSON.stringify(want) + " standing above it, column "
          + JSON.stringify(values(boxes));
      }
    });
  }
});
check(steps > 30, "the clumsy session is long enough to be worth checking (" + steps + " keystrokes)");
check(broken === null,
  "after every one of them, an untouched set shows the nearest weight standing above it"
  + (broken ? " - " + broken : ""));
// And nothing the member can see is left unstored, or stored unseen.
// Compared through parseLoggedWeight rather than Number(), because a box can
// still legitimately show a comma the app reads as a thousands separator
// ("1,500" storing 1500). The decimal case that used to leave "37,5" on
// screen is fixed - see silent-weight-box.test.js - but this comparison is
// about what the box MEANS, not how it is spelled.
var stray = Object.keys(P.setWeights).filter(function (k) {
  return !boxes.some(function (b) {
    return b.dataset.key === k && parseLoggedWeight(b.value).value === P.setWeights[k];
  });
});
check(stray.length === 0,
  "and every stored set matches the box it belongs to (stray: " + JSON.stringify(stray) + ")");
var unstored = boxes.filter(function (b) {
  return parseLoggedWeight(b.value).state === "ok" && P.setWeights[b.dataset.key] === undefined;
});
check(unstored.length === 0,
  "and every box holding a good number is stored (missing: "
  + JSON.stringify(unstored.map(function (b) { return b.dataset.key; })) + ")");

// ---------------- the screen really does run all of this ----------------

var screenStart = CODE.indexOf("const inputs = [...logEl.querySelectorAll(\".weight-log-input\")]");
var screenEnd = CODE.indexOf("player-complete-set-btn", screenStart);
check(screenStart !== -1 && screenEnd > screenStart, "found the end-of-block screen's own code");
var screen = CODE.slice(screenStart, screenEnd);
check(/setWeights\[input\.dataset\.key\] != null\) \{\s*input\.dataset\.touched = "1";/.test(screen),
  "the seeding pass marks an already-stored set as touched, so the carry-down leaves it alone");

var advanceBody = braceMatch(CODE, CODE.indexOf("\n  advance() {") + 1);
check(advanceBody.indexOf("this.warnRefusedWeights()") !== -1,
  "and leaving a phase runs the refused-weight warning");
check(/kind === "log-weights"\) this\.warnRefusedWeights\(\)/.test(advanceBody),
  "for the weights screen specifically, which is the screen that has boxes");

var carry = braceMatch(CODE, CODE.indexOf("\n  carryWeightDown(input, inputs) {") + 1);
check(carry.indexOf("parseLoggedWeight(other.value)") !== -1,
  "the carry-down reads what the boxes SHOW, not what the keystroke said");
print("\n  " + pass + " passed, " + fail + " failed");
