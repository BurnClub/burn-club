// A round you take back still counted, and quietly became a personal best
// (tester T-93).
//
// On an AMRAP the member taps "+ Add Round", types the weight for that round,
// then realises they tapped it by mistake - or did not finish the round - and
// taps "-1". The counter goes back down. The weight does not. It is filed
// under a key carrying the round's number (`amrap-1` while the counter said
// 1), and taking the round back left the entry sitting there. topWeightsFrom()
// files the HEAVIEST round, which is the right rule (T-82) and is what makes
// this bite: the number from the cancelled round usually wins.
//
// Type 40, add a round, type 300, press -1, correct the box to 30, and the
// screen reads "0 rounds, 30 lb" while the session records 300 and offers it
// as a 300 lb personal best. Nothing on the screen says it is there.
//
// REPRODUCED ON THE LIVE SITE as a real member, twice, the second time after a
// full page reload and a resume from storage - the orphan came back with the
// session, and the pending personal best came back with it.
//
// The rule now: the counter going down drops every round at or above where it
// lands, and each box is put back to what the round it has RETURNED to holds.
// Going UP is untouched - the last number carries into the new round as a
// pre-fill, the same way the end-of-block screen carries one down a column.
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
var weightSpliceWatcherWired = false;
eval(liftFn("wireWeightBoxTyping"));
eval(liftFn("armWeightBox"));
eval(liftFn("fillWeightBox"));

// ---------------- the AMRAP screen, with real boxes on it ----------------

function Box(exName) {
  this.dataset = { exName: exName };
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
Box.prototype.addEventListener = function () {};

var SCREEN = { boxes: [], els: {} };
var document = {
  addEventListener: function () {},
  createElement: function () {
    return { className: "", textContent: "",
             remove: function () { this._row.kids = this._row.kids.filter(function (k) { return k !== this; }, this); } };
  },
  getElementById: function (id) {
    return (SCREEN.els[id] = SCREEN.els[id] || { textContent: "" });
  },
  querySelectorAll: function (sel) {
    if (sel !== "#player-amrap-list .superset-weight-input") {
      throw new Error("unexpected selector " + sel);
    }
    return SCREEN.boxes;
  },
};

function makePlayer(kind, names) {
  var P = {
    sessionWeights: {}, setWeights: {}, roundWeights: {},
    index: 3, emomBindSeq: 0, emomSeqByMinute: {},
    remaining: 0, amrapRoundsByBlock: {},
    persisted: 0,
    _kind: kind || "amrap",
    persist: function () { this.persisted++; },
    currentPhase: function () {
      return { kind: this._kind, blockIndex: 0, duration: 600, interval: 60 };
    },
  };
  eval("P.currentEmomMinute = " + liftMethod("currentEmomMinute()"));
  eval("P.emomSlotForNow = " + liftMethod("emomSlotForNow()"));
  eval("P.roundsForBlock = " + liftMethod("roundsForBlock(blockIndex)"));
  eval("P.bumpRounds = " + liftMethod("bumpRounds(delta)"));
  eval("P.dropRoundsAbove = " + liftMethod("dropRoundsAbove(count)"));
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  SCREEN.boxes = (names || ["DB Walking Lunge"]).map(function (n) { return new Box(n); });
  SCREEN.els = {};
  return P;
}
function boxFor(name) {
  return SCREEN.boxes.filter(function (b) { return b.dataset.exName === name; })[0];
}
// The two lines the shipped AMRAP input listener runs.
function typeInBox(P, name, text) {
  var box = boxFor(name);
  box.value = text;
  var parsed = readWeightBox(box);
  P.noteWeight(name, parsed.state === "ok" ? parsed.value : "");
}
function addRound(P) { P.bumpRounds(1); }
function minusRound(P) { P.bumpRounds(-1); }
function counter() { return SCREEN.els["round-count"].textContent; }
function recorded(P) { return topWeightsFrom(P.sessionWeights, P.setWeights, P.roundWeights); }
function slots(P) { return JSON.stringify(P.roundWeights); }

// ---------------- the finding, step by step ----------------

var P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
check(P.roundWeights["3|DB Walking Lunge|amrap-0"] === 40, "round 0 holds the 40 that was typed");

addRound(P);
check(counter() === 1, "+ Add Round takes the counter to 1");
typeInBox(P, "DB Walking Lunge", "300");
check(P.roundWeights["3|DB Walking Lunge|amrap-1"] === 300, "round 1 holds the 300");
check(recorded(P)["DB Walking Lunge"] === 300, "and 300 is what would be recorded while the round stands");

minusRound(P);
check(counter() === 0, "-1 takes the counter back to 0");
check(P.roundWeights["3|DB Walking Lunge|amrap-1"] === undefined,
  "and the round it removed takes its 300 with it (got " + slots(P) + ")");
check(P.roundWeights["3|DB Walking Lunge|amrap-0"] === 40,
  "while round 0, which the member did do, keeps its 40");
check(boxFor("DB Walking Lunge").value === "40",
  "the box shows the weight of the round it has returned to (got "
  + JSON.stringify(boxFor("DB Walking Lunge").value) + ")");
check(P.sessionWeights["DB Walking Lunge"] === 40,
  "and sessionWeights goes with it - it is read by topWeightsFrom too (got "
  + P.sessionWeights["DB Walking Lunge"] + ")");
check(recorded(P)["DB Walking Lunge"] === 40,
  "so 40 is recorded, not 300 (got " + recorded(P)["DB Walking Lunge"] + ")");

// The tester's step 5: correct the box to the real weight. The screen is now
// clean - and used to still be hiding the 300.
typeInBox(P, "DB Walking Lunge", "30");
check(counter() === 0 && boxFor("DB Walking Lunge").value === "30",
  "the screen reads 0 rounds and 30 lb, which is what the member did");
check(recorded(P)["DB Walking Lunge"] === 30,
  "and 30 is what is recorded (got " + recorded(P)["DB Walking Lunge"] + ")");
check(JSON.stringify(P.roundWeights).indexOf("300") === -1,
  "with the cancelled 300 nowhere in the session (got " + slots(P) + ")");

// ---------------- -1 without correcting anything ----------------
// The half that sessionWeights alone would have let through: take the round
// back and walk away.

P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
addRound(P);
typeInBox(P, "DB Walking Lunge", "300");
minusRound(P);
check(recorded(P)["DB Walking Lunge"] === 40,
  "a round taken back and left alone records the round below it (got "
  + recorded(P)["DB Walking Lunge"] + ")");

// ---------------- T-82 still works: the heaviest round wins ----------------

P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
addRound(P);
typeInBox(P, "DB Walking Lunge", "50");
addRound(P);
typeInBox(P, "DB Walking Lunge", "30");
check(recorded(P)["DB Walking Lunge"] === 50,
  "40 then 50 then 30 across three rounds still records 50 (got "
  + recorded(P)["DB Walking Lunge"] + ")");
check(boxFor("DB Walking Lunge").value === "30", "while the box shows what was typed last");

// ---------------- + Add Round leaves the boxes alone ----------------
// The sweep must not run upwards: the new round holds nothing, so re-pointing
// the box to it would clear a number the member is about to work up from.

P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
addRound(P);
check(boxFor("DB Walking Lunge").value === "40",
  "adding a round carries the last number into it as a pre-fill (got "
  + JSON.stringify(boxFor("DB Walking Lunge").value) + ")");
check(P.roundWeights["3|DB Walking Lunge|amrap-0"] === 40,
  "and nothing already recorded is dropped (got " + slots(P) + ")");
check(recorded(P)["DB Walking Lunge"] === 40, "so the 40 is still what would be recorded");

// ---------------- pressing -1 at zero does nothing ----------------

P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
minusRound(P);
check(counter() === 0, "the counter cannot go below zero");
check(P.roundWeights["3|DB Walking Lunge|amrap-0"] === 40,
  "and a -1 that moves nothing takes nothing with it (got " + slots(P) + ")");
check(boxFor("DB Walking Lunge").value === "40", "the box is left as the member typed it");

// ---------------- two rounds taken back at once ----------------

P = makePlayer("amrap");
typeInBox(P, "DB Walking Lunge", "40");
addRound(P); typeInBox(P, "DB Walking Lunge", "60");
addRound(P); typeInBox(P, "DB Walking Lunge", "300");
minusRound(P); minusRound(P);
check(counter() === 0, "two taps take the counter back to 0");
check(Object.keys(P.roundWeights).length === 1 && P.roundWeights["3|DB Walking Lunge|amrap-0"] === 40,
  "and both rounds above it are gone, 60 included (got " + slots(P) + ")");
check(recorded(P)["DB Walking Lunge"] === 40, "40 is recorded, not 60 and not 300");

// ---------------- every exercise on the screen, not just the one ----------------

P = makePlayer("amrap", ["DB Walking Lunge", "Push Press"]);
typeInBox(P, "DB Walking Lunge", "40");
typeInBox(P, "Push Press", "65");
addRound(P);
typeInBox(P, "DB Walking Lunge", "300");
typeInBox(P, "Push Press", "500");
minusRound(P);
check(boxFor("DB Walking Lunge").value === "40" && boxFor("Push Press").value === "65",
  "an AMRAP lists several exercises and -1 puts every box back");
check(recorded(P)["DB Walking Lunge"] === 40 && recorded(P)["Push Press"] === 65,
  "and neither cancelled number is recorded (got " + JSON.stringify(recorded(P)) + ")");
check(JSON.stringify(P.roundWeights).indexOf("500") === -1, "the 500 is gone too");

// ---------------- a round with nothing typed in it ----------------

P = makePlayer("amrap");
addRound(P);
typeInBox(P, "DB Walking Lunge", "80");
minusRound(P);
check(boxFor("DB Walking Lunge").value === "",
  "returning to a round that was never filled in empties the box (got "
  + JSON.stringify(boxFor("DB Walking Lunge").value) + ")");
check(recorded(P)["DB Walking Lunge"] === undefined,
  "and nothing is recorded for it, because nothing was lifted that it knows of (got "
  + recorded(P)["DB Walking Lunge"] + ")");

// ---------------- it does not reach past this block ----------------

P = makePlayer("amrap");
P.roundWeights["7|DB Walking Lunge|amrap-1"] = 999;      // another AMRAP, another phase
P.roundWeights["3|DB Walking Lunge|emom-1"] = 111;       // and an EMOM rotation
P.setWeights["3|DB Walking Lunge|Set 2"] = 55;
typeInBox(P, "DB Walking Lunge", "40");
addRound(P);
typeInBox(P, "DB Walking Lunge", "300");
minusRound(P);
check(P.roundWeights["7|DB Walking Lunge|amrap-1"] === 999,
  "another block's rounds are left alone (got " + slots(P) + ")");
check(P.roundWeights["3|DB Walking Lunge|emom-1"] === 111,
  "and so is an EMOM rotation, which is not a round at all");
check(P.setWeights["3|DB Walking Lunge|Set 2"] === 55, "and the end-of-block screen's sets are untouched");

// ---------------- a phase that is not counting rounds ----------------

P = makePlayer("emom");
P.roundWeights["3|Devils Press|emom-1"] = 70;
P.bumpRounds(-1);
check(P.roundWeights["3|Devils Press|emom-1"] === 70,
  "-1 on a phase that counts no rounds does nothing at all");
check(P.amrapRoundsByBlock[0] === undefined, "and records no round count for it");

// ---------------- the screen really does run this ----------------

check(CODE.indexOf('on("round-minus-btn", "click", () => {') !== -1,
  "the - button beside the counter is still wired");
var bump = braceMatch(CODE, CODE.indexOf("\n  bumpRounds(delta) {") + 1);
check(bump.indexOf("this.dropRoundsAbove(next)") !== -1,
  "and bumping the counter is what drops the rounds above it");
check(/if \(next < was\) this\.dropRoundsAbove\(next\);/.test(bump),
  "only when the count goes DOWN - sweeping on the way up would wipe every box");
var drop = braceMatch(CODE, CODE.indexOf("\n  dropRoundsAbove(count) {") + 1);
check(drop.indexOf("this.noteWeight(name, shown)") !== -1,
  "and each box is put back through noteWeight, the one door, so sessionWeights follows");
check(drop.indexOf("fillWeightBox(input, shown)") !== -1,
  "written through fillWeightBox, which marks and arms it like any other refill (T-80, T-90)");

print("\n  " + pass + " passed, " + fail + " failed");
