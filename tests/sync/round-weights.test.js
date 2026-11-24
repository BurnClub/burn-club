// The EMOM and AMRAP boxes recorded the number typed LAST, not the heaviest
// (tester T-76).
//
// An EMOM gives one weight box per exercise, following the clock round by
// round. Work up — 30, 35, 40 — then back off to 25 for the last rotation, and
// 25 is what went into the member's history, their notebook, their "last time"
// pre-fill and their personal bests. The identical numbers typed on a per-set
// screen record 40, because that was deliberately fixed for T-5 and T-24; the
// EMOM and AMRAP boxes were never brought in line.
//
// It mattered less until 2026-11-23, because those weights were being thrown
// away before they reached the server at all. T-69 fixed that the same
// morning, which made the wrong-number-chosen problem live.
//
// The fix is NOT "take the maximum of everything ever typed into the box".
// That box is reused, so a member who types 400, sees it, and corrects it to
// 40 would have the typo preserved for ever with no way to reach it — the same
// shape of bug as T-74. What is recorded per rotation is the number standing
// when that rotation ended, and the heaviest of those is what counts.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function braceMatch(from) {
  var depth = 0;
  for (var i = APP.indexOf("{", from); i < APP.length; i++) {
    if (APP[i] === "{") depth++;
    else if (APP[i] === "}") { depth--; if (depth === 0) return APP.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFn(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  return braceMatch(at);
}
// A method on the Player object literal, turned into a plain function so it
// can be driven here. Anchored on the newline and two spaces so a mention in
// a comment or a call elsewhere cannot be picked up instead.
function liftMethod(sig) {
  var at = APP.indexOf("\n  " + sig + " {");
  if (at < 0) throw new Error(sig + " is gone from the player");
  var src = braceMatch(at + 1);
  return "function " + src.slice(src.indexOf("("));
}

eval(liftFn("normaliseDecimalComma"));
eval(liftFn("parseLoggedWeight"));
eval(APP.match(/const MAX_LOGGED_WEIGHT = [0-9.]+;/)[0].replace("const", "var"));
eval(liftFn("topWeightsFrom"));

// A player with nothing in it but the state these two methods touch.
function makePlayer(phaseKind) {
  var P = {
    sessionWeights: {}, setWeights: {}, roundWeights: {},
    index: 3, emomBindSeq: 0, persisted: 0,
    _kind: phaseKind,
    persist: function () { this.persisted++; },
    currentPhase: function () { return { kind: this._kind }; },
  };
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  return P;
}
// What the member sees happen: the box is handed to an exercise (a rotation),
// then typed into. Typing again without a rebind is the same rotation.
function rotate(P) { P.emomBindSeq++; }
function recorded(P) {
  return topWeightsFrom(P.sessionWeights, P.setWeights, P.roundWeights);
}

// ---------------- the finding itself ----------------

var emom = makePlayer("emom");
["30", "35", "40", "25"].forEach(function (w) { rotate(emom); emom.noteWeight("Devils Press", w); });
check(recorded(emom)["Devils Press"] === 40,
  "worked up 30/35/40 and backed off to 25, the EMOM records 40 (got "
  + recorded(emom)["Devils Press"] + ")");
check(recorded(emom)["Devils Press"] !== 25, "and not the number typed last, which is what T-76 was");
check(emom.sessionWeights["Devils Press"] === 25,
  "the box itself still shows what was typed last, which is what the member sees");

// The claim the finding rests on: the per-set screen, same numbers, same answer.
var perSet = topWeightsFrom({ "Bench Press": 25 },
  { "1|Bench Press|Set 1": 30, "2|Bench Press|Set 2": 40, "3|Bench Press|Set 3": 25 }, {});
check(perSet["Bench Press"] === 40, "the per-set screen already answered 40 for the same numbers");
check(perSet["Bench Press"] === recorded(emom)["Devils Press"],
  "and the two screens now agree, which is the whole point of the fix");

// ---------------- what a careless maximum would have broken ----------------

var typo = makePlayer("emom");
rotate(typo);
typo.noteWeight("Devils Press", "400");   // a slip, under the 2000 cap
typo.noteWeight("Devils Press", "40");    // seen and corrected, same rotation
check(recorded(typo)["Devils Press"] === 40,
  "a typo corrected inside the rotation does not stick (got " + recorded(typo)["Devils Press"] + ")");
check(recorded(typo)["Devils Press"] !== 400,
  "taking the maximum of every number ever typed would have kept 400 for ever");

// Once the box has moved on, the earlier number stands — that rotation
// happened, and the member is now logging the next one. Written down because
// it is a decision, not an accident.
var late = makePlayer("emom");
rotate(late); late.noteWeight("Devils Press", "400");
rotate(late); late.noteWeight("Devils Press", "40");
check(recorded(late)["Devils Press"] === 400,
  "a number corrected only after the next rotation began is treated as that rotation's lift");

// Clearing the box clears THIS rotation and leaves the others standing.
var cleared = makePlayer("emom");
rotate(cleared); cleared.noteWeight("Devils Press", "40");
rotate(cleared); cleared.noteWeight("Devils Press", "30");
cleared.noteWeight("Devils Press", "");
check(recorded(cleared)["Devils Press"] === 40,
  "emptying the box drops that rotation, not the whole exercise (got "
  + recorded(cleared)["Devils Press"] + ")");

var allCleared = makePlayer("emom");
rotate(allCleared); allCleared.noteWeight("Devils Press", "40");
allCleared.noteWeight("Devils Press", "");
check(recorded(allCleared)["Devils Press"] === undefined,
  "and clearing the only rotation leaves no weight at all");

// A number the app refuses is not a lift.
var capped = makePlayer("emom");
rotate(capped); capped.noteWeight("Devils Press", "40");
rotate(capped); capped.noteWeight("Devils Press", "9999");
check(recorded(capped)["Devils Press"] === 40,
  "a weight over the cap is refused rather than recorded as the heaviest (got "
  + recorded(capped)["Devils Press"] + ")");

// ---------------- the other screens keep their own shape ----------------

// An AMRAP has ONE box per exercise per block, not one per round — so two
// blocks holding the same exercise take the heavier, and the second does not
// quietly replace the first.
var amrap = makePlayer("amrap");
amrap.index = 2; amrap.noteWeight("Goblet Squat", "50");
amrap.index = 6; amrap.noteWeight("Goblet Squat", "35");
check(recorded(amrap)["Goblet Squat"] === 50,
  "the same exercise in two AMRAP blocks records the heavier (got "
  + recorded(amrap)["Goblet Squat"] + ")");
check(Object.keys(amrap.roundWeights).length === 2, "as two entries, one per block");

// Outside an EMOM the rotation counter must not split one box into many.
var block = makePlayer("amrap");
rotate(block); block.noteWeight("Goblet Squat", "50");
rotate(block); block.noteWeight("Goblet Squat", "35");
check(Object.keys(block.roundWeights).length === 1,
  "a box that is not on an EMOM clock is one entry however the clock turns (got "
  + Object.keys(block.roundWeights).length + ")");
check(recorded(block)["Goblet Squat"] === 35, "and simply holds what is in it");

// The key has to be readable by topWeightsFrom, which splits on "|".
var slot = makePlayer("emom").weightSlotFor("Devils Press");
check(slot.split("|")[1] === "Devils Press",
  "the exercise is the middle part of the key, as topWeightsFrom expects (got " + slot + ")");

// Two different exercises in the same rotation are two entries.
var two = makePlayer("emom");
rotate(two);
two.noteWeight("Devils Press", "40");
two.noteWeight("Goblet Squat", "50");
check(Object.keys(two.roundWeights).length === 2, "two exercises in one rotation are two entries");

// ---------------- it has to survive a resume, and reach the record ----------

// Scoped to persist(): `roundWeights: this.roundWeights` also appears in the
// opts finish() hands logCompletion, so an unscoped match passed with the
// saved session no longer carrying them at all (caught by mutation).
var persistBody = (function () {
  var at = CODE.indexOf("  persist() {");
  if (at < 0) return "";
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
})();
check(persistBody !== "", "the player still saves the session as it goes");
check(/roundWeights: this\.roundWeights/.test(persistBody),
  "the rounds are written into the saved session");
check(/emomBindSeq: this\.emomBindSeq/.test(persistBody), "and so is the rotation counter");
check(/this\.roundWeights = rec\.roundWeights \|\| \{\}/.test(CODE),
  "a resumed session reads them back, or a phone call would lose the heaviest");
check(/this\.emomBindSeq = rec\.emomBindSeq \|\| 0/.test(CODE),
  "and reads the counter back, so the next rotation is not the previous one again");

check(/newPersonalBests\(topWeightsFrom\(this\.sessionWeights, this\.setWeights, this\.roundWeights\)\)/.test(CODE),
  "the personal-best check reads the heaviest");
check(/roundWeights: this\.roundWeights \}\)/.test(CODE), "and so does the completion that gets written");
check(/roundWeights: rec\.roundWeights \|\| \{\}/.test(CODE),
  "including the partial written for a workout that was abandoned");
check(/topWeightsFrom\(weights, setWeights, opts && opts\.roundWeights\)/.test(CODE),
  "logCompletion derives the stored weight from them too");

// The rotation counter has exactly one place it moves, and it is the rebind.
var sync = (function () {
  var at = CODE.indexOf("syncEmomWeightField(exerciseName)");
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
})();
check(sync.indexOf("this.emomBindSeq++") !== -1,
  "a new rotation is counted where the box is handed to the next exercise");
check((CODE.match(/emomBindSeq\+\+/g) || []).length === 1,
  "and nowhere else (got " + (CODE.match(/emomBindSeq\+\+/g) || []).length + ")");

print(pass + " passed, " + fail + " failed");
