// A weight the app says it did not save was saved anyway, on every other set
// of that exercise (tester T-92).
//
// Type 2500 into set 1 one key at a time. The app sees 2, then 25, then 250,
// then 2500. The third of those is a perfectly good weight, so it was carried
// down sets 2, 3 and 4 the way the pre-fill is meant to be. The fourth is over
// the cap, so the box went red and said "Over 2000 - not saved" - and cleaned
// up after itself and nothing else. Three sets were left holding 250, in
// ordinary black, and they were saved: to the phone, to the server as real
// lift rows, and into the exercise's weight, where 250 lb became a personal
// best against a previous 80.
//
// The member is looking at a screen that says "not saved". Three rows of it
// were.
//
// REPRODUCED ON THE LIVE SITE FIRST, signed in as a real member, on app.js
// proved byte-identical to the deployed build, typing one character per
// keystroke with a real pointer and a real keyboard:
//   boxes      2500 (red)  250  250  250
//   setWeights sets 2, 3 and 4 at 250, nothing for set 1
//   recorded   250, and newPersonalBests() offered it as a PR over 80
// And a second way in, found while reproducing it: with set 1 holding a good
// 100, typing 2500 into set 2 left 250 as the exercise's weight even though
// the carry-down had been cleaned up, because a good number on another set
// held the door open. Same PR, same lie on the screen.
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
// A method on the Player object literal, turned into a plain function so it
// can be driven here.
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
eval(liftFn("readWeightBox"));

// ---------------- a column of real weight boxes ----------------
// Enough DOM for the shipped markWeightInput to run: it looks for the row the
// box sits in and hangs the warning off it.

var document = {
  createElement: function () {
    return { className: "", textContent: "", removed: false,
             remove: function () { this.removed = true; this._row.kids = this._row.kids.filter(function (k) { return k !== this; }, this); } };
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

// ---------------- the player, with only what these methods touch ----------------

function makePlayer() {
  var P = {
    sessionWeights: {}, setWeights: {}, roundWeights: {}, index: 2,
    persisted: 0,
    persist: function () { this.persisted++; },
    currentPhase: function () { return { kind: "log-weights", blockIndex: 1 }; },
  };
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  eval("P.recordSetWeight = " + liftMethod("recordSetWeight(input, inputs, parsed)"));
  eval("P.carryWeightDown = " + liftMethod("carryWeightDown(input, inputs, parsed)"));
  eval("P.syncExerciseWeight = " + liftMethod("syncExerciseWeight(exName, inputs)"));
  return P;
}

// A four-set column for one exercise, plus a second exercise underneath when
// asked for, laid out the way the screen lays them out.
function column(names) {
  var boxes = [];
  names.forEach(function (n) {
    for (var i = 1; i <= 4; i++) boxes.push(new Box("1|" + n + "|Set " + i, n, ""));
  });
  return boxes;
}

// The three lines the shipped input listener runs, and nothing else - see the
// source check at the bottom, which is what holds this to the real handler.
function keystroke(P, box, boxes) {
  var parsed = readWeightBox(box);
  box.dataset.touched = "1";
  P.recordSetWeight(box, boxes, parsed);
}
function typeChar(P, box, boxes, ch) {
  box.value = box.value + ch;
  keystroke(P, box, boxes);
}
function typeInto(P, box, boxes, text) {
  for (var i = 0; i < text.length; i++) typeChar(P, box, boxes, text[i]);
}
// A thumb landing on a box and typing. Tapping a box selects what is in it, so
// the first key REPLACES whatever the carry-down had put there rather than
// being spliced onto it - that is T-60, T-74, T-80, T-85 and the reason this
// screen's boxes are text inputs. Typing straight on without a tap, the way
// the 2500 above is typed, is typeChar.
function tapType(P, box, boxes, text) {
  box.value = "";
  typeInto(P, box, boxes, text);
}
function backspace(P, box, boxes) {
  box.value = box.value.slice(0, -1);
  keystroke(P, box, boxes);
}
function values(boxes) { return boxes.map(function (b) { return b.value; }); }
function recorded(P) { return topWeightsFrom(P.sessionWeights, P.setWeights, P.roundWeights); }

// ---------------- the finding ----------------

var P = makePlayer();
var boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "2500");

check(boxes[0].isBad() && String(boxes[0].warning()).indexOf("not saved") !== -1,
  "set 1 is refused and says so");
check(values(boxes).slice(1).join(",") === ",,",
  "and sets 2, 3 and 4 are empty, not holding 250 (got " + JSON.stringify(values(boxes)) + ")");
check(Object.keys(P.setWeights).length === 0,
  "nothing is stored for any set of that exercise (got " + JSON.stringify(P.setWeights) + ")");
check(P.sessionWeights["Goblet Squats"] === undefined,
  "and the exercise carries no weight at all (got " + P.sessionWeights["Goblet Squats"] + ")");
check(recorded(P)["Goblet Squats"] === undefined,
  "so there is nothing to record, and no 250 lb personal best");
check(boxes[1].warning() === null && boxes[2].warning() === null && boxes[3].warning() === null,
  "the rows below carry no warning of their own - there is nothing on them to warn about");
check(!boxes[1].isBad() && !boxes[2].isBad() && !boxes[3].isBad(),
  "and they are not left marked red by the refusal above them");

// ---------------- the keystroke before it was still good ----------------
// The carry-down is not being thrown away: what it does for a number the app
// accepts has to keep working, or the fix is just a deletion.

P = makePlayer();
boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "250");
check(values(boxes).join(",") === "250,250,250,250",
  "typing 250 fills the column, which is what the carry-down is for");
check(P.setWeights["1|Goblet Squats|Set 4"] === 250, "and set 4 is stored");
check(P.sessionWeights["Goblet Squats"] === 250, "and the exercise is at 250");
// Now the one more key that made the tester's number. The column has to go
// back, not stay where the good keystroke left it.
typeChar(P, boxes[0], boxes, "0");
check(values(boxes).join(",") === "2500,,,",
  "one more key takes the column back out again (got " + JSON.stringify(values(boxes)) + ")");
check(P.sessionWeights["Goblet Squats"] === undefined,
  "and takes the exercise's weight with it");

// ---------------- the second way in, found while reproducing ----------------
// A good number on set 1 used to hold the door open: the old code only cleared
// the exercise when EVERY set had gone empty.

P = makePlayer();
boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "100");
typeInto(P, boxes[1], boxes, "2500");
check(P.setWeights["1|Goblet Squats|Set 1"] === 100, "set 1 keeps the 100 the member did type");
check(P.setWeights["1|Goblet Squats|Set 2"] === undefined, "set 2 stores nothing");
check(P.setWeights["1|Goblet Squats|Set 3"] === undefined
   && P.setWeights["1|Goblet Squats|Set 4"] === undefined,
  "and nor do the sets below it (got " + JSON.stringify(P.setWeights) + ")");
check(P.sessionWeights["Goblet Squats"] === 100,
  "the exercise is at 100, the number on the screen (got " + P.sessionWeights["Goblet Squats"] + ")");
check(recorded(P)["Goblet Squats"] === 100,
  "so 100 is what gets recorded, not 250 (got " + recorded(P)["Goblet Squats"] + ")");
check(recorded(P)["Goblet Squats"] !== 250,
  "the half-typed number is nowhere in the record");

// ---------------- a set the member set themselves is theirs ----------------

P = makePlayer();
boxes = column(["Goblet Squats"]);
tapType(P, boxes[0], boxes, "100");
tapType(P, boxes[2], boxes, "200");
check(boxes[2].value === "200" && boxes[3].value === "200",
  "set 3 typed by hand carries down to set 4");
tapType(P, boxes[0], boxes, "1000");   // back to set 1, a heavier but legal number
check(boxes[2].value === "200" && boxes[1].value === "1000",
  "going back to set 1 refills the untouched sets and leaves set 3 alone");
typeChar(P, boxes[0], boxes, "0");     // 1000 -> 10000, refused
check(boxes[2].value === "200" && P.setWeights["1|Goblet Squats|Set 3"] === 200,
  "and a refused one does not reach set 3 either - clearing the carry-down stops where the member did");
check(boxes[1].value === "" && P.setWeights["1|Goblet Squats|Set 2"] === undefined,
  "while set 2, which only ever mirrored set 1, is emptied with it");
check(P.sessionWeights["Goblet Squats"] === 200,
  "the exercise falls back to the number still standing (got " + P.sessionWeights["Goblet Squats"] + ")");

// ---------------- the exercise next to it is not collateral ----------------

P = makePlayer();
boxes = column(["Goblet Squats", "KB Swing"]);
typeInto(P, boxes[4], boxes, "60");          // KB Swing set 1
typeInto(P, boxes[0], boxes, "2500");        // Goblet Squats set 1, refused
check(values(boxes).slice(4).join(",") === "60,60,60,60",
  "a refusal in one exercise leaves the next exercise's column alone");
check(P.sessionWeights["KB Swing"] === 60, "and its weight stands");
check(recorded(P)["KB Swing"] === 60, "and is still recorded");
// And the good direction does not reach across either.
P = makePlayer();
boxes = column(["Goblet Squats", "KB Swing"]);
typeInto(P, boxes[0], boxes, "95");
check(values(boxes).slice(4).join(",") === ",,,",
  "a good number does not carry into the exercise below it either");

// ---------------- blanking a box still means "I did not lift this" ----------------

P = makePlayer();
boxes = column(["Goblet Squats"]);
typeInto(P, boxes[0], boxes, "80");
backspace(P, boxes[0], boxes);
backspace(P, boxes[0], boxes);
check(values(boxes).join(",") === ",,,", "emptying set 1 empties the column it filled");
check(Object.keys(P.setWeights).length === 0 && P.sessionWeights["Goblet Squats"] === undefined,
  "and nothing is left stored (got " + JSON.stringify(P.setWeights) + ")");

// ---------------- the property, after every single keystroke ----------------
// The whole finding in one rule: the number the app is holding for an exercise
// is always a number the member can see in one of its boxes. Checked after
// each key of a long, clumsy session rather than at the end of it, because
// what T-92 left behind was a number from a keystroke in the middle.

P = makePlayer();
boxes = column(["Goblet Squats", "KB Swing"]);
var script = [
  [0, "2500"], [0, "\b\b\b\b"], [0, "95"], [2, "1800"], [2, "\b"],
  [4, "4000"], [4, "\b\b\b\b40"], [5, "2000"], [5, "0"], [1, "12,5"],
  [0, "\b\b"], [3, "7.5"], [4, "\b\b"],
];
var broken = null, steps = 0;
script.forEach(function (step) {
  var box = boxes[step[0]];
  for (var i = 0; i < step[1].length; i++) {
    if (step[1][i] === "\b") backspace(P, box, boxes); else typeChar(P, box, boxes, step[1][i]);
    steps++;
    ["Goblet Squats", "KB Swing"].forEach(function (name) {
      var held = P.sessionWeights[name];
      if (held === undefined) return;
      var onScreen = boxes.some(function (b) {
        return b.dataset.exName === name && b.value !== "" && Number(b.value) === held;
      });
      if (!onScreen && !broken) {
        broken = name + " held " + held + " with the column at " + JSON.stringify(values(boxes));
      }
    });
  }
});
check(steps > 30, "the clumsy session is long enough to be worth checking (" + steps + " keystrokes)");
check(broken === null,
  "after every one of them, the weight an exercise carries is a number on its screen"
  + (broken ? " - " + broken : ""));
// And the same rule for the stored sets, which are what reach the server.
var stray = Object.keys(P.setWeights).filter(function (k) {
  return !boxes.some(function (b) { return b.dataset.key === k && Number(b.value) === P.setWeights[k]; });
});
check(stray.length === 0,
  "and every stored set matches the box it belongs to (stray: " + JSON.stringify(stray) + ")");

// ---------------- the screen really does hand every keystroke over ----------------
// Everything above drives recordSetWeight. These two checks are what tie that
// to the listener the member's typing actually reaches - without them the fix
// could be perfect and unreachable.

var listenerAt = CODE.indexOf("input.addEventListener(\"input\", () => {");
check(listenerAt !== -1, "the end-of-block screen still listens for typing");
var listener = braceMatch(CODE, listenerAt);
check(listener.indexOf("this.recordSetWeight(input, inputs, parsed)") !== -1,
  "and hands the keystroke to recordSetWeight");
check(listener.indexOf("this.setWeights[") === -1 && listener.indexOf("this.noteWeight(") === -1,
  "and does nothing else to the column itself, so there is one way in and not two");

// One door for the exercise weight: noteWeight is reached from syncExerciseWeight
// and from nowhere else on this screen. The seeding pass used to set it per
// box, which is the same two-places-to-get-it-wrong shape the finding was.
function methodBody(sig) {
  var at = CODE.indexOf("\n  " + sig + " {");
  return at < 0 ? "" : braceMatch(CODE, at + 1);
}
check(methodBody("syncExerciseWeight(exName, inputs)").indexOf("this.noteWeight(") !== -1,
  "syncExerciseWeight is what sets the exercise's weight");
var screenStart = CODE.indexOf("const inputs = [...logEl.querySelectorAll(\".weight-log-input\")]");
var screenEnd = CODE.indexOf("player-complete-set-btn", screenStart);
check(screenStart !== -1 && screenEnd > screenStart, "found the end-of-block screen's own code");
var screen = CODE.slice(screenStart, screenEnd);
check(screen.indexOf("this.noteWeight(") === -1,
  "and the screen itself never sets it directly, seeding included");
check(screen.indexOf("this.syncExerciseWeight(") !== -1,
  "it reads the column instead, once the pre-fills are in");

print("\n  " + pass + " passed, " + fail + " failed");
