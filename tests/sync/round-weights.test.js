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

// A player with nothing in it but the state these methods touch. A twelve
// minute EMOM on a one-minute interval, so the clock can be moved about.
var EMOM_DURATION = 720, EMOM_INTERVAL = 60;
function makePlayer(phaseKind) {
  var P = {
    sessionWeights: {}, setWeights: {}, roundWeights: {},
    index: 3, emomBindSeq: 0, emomSeqByMinute: {}, persisted: 0,
    remaining: EMOM_DURATION,
    _kind: phaseKind,
    persist: function () { this.persisted++; },
    currentPhase: function () {
      return { kind: this._kind, duration: EMOM_DURATION, interval: EMOM_INTERVAL };
    },
  };
  eval("P.currentEmomMinute = " + liftMethod("currentEmomMinute()"));
  eval("P.emomSlotForNow = " + liftMethod("emomSlotForNow()"));
  eval("P.weightSlotFor = " + liftMethod("weightSlotFor(name)"));
  eval("P.noteWeight = " + liftMethod("noteWeight(name, raw)"));
  return P;
}
// The clock reaching a minute, and the box being handed to the exercise on it.
// Typing again without the box changing hands is the same rotation.
function atMinute(P, minute) {
  P.remaining = EMOM_DURATION - minute * EMOM_INTERVAL;
  P.emomBindSeq = P.emomSlotForNow();
}
// Each rotation of a multi-exercise EMOM is the next minute.
var _m = -1;
function rotate(P) { _m++; atMinute(P, _m); }
function resetClock() { _m = -1; }
function recorded(P) {
  return topWeightsFrom(P.sessionWeights, P.setWeights, P.roundWeights);
}

// ---------------- the finding itself ----------------

resetClock();
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

resetClock();
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
resetClock();
var late = makePlayer("emom");
rotate(late); late.noteWeight("Devils Press", "400");
rotate(late); late.noteWeight("Devils Press", "40");
check(recorded(late)["Devils Press"] === 400,
  "a number corrected only after the next rotation began is treated as that rotation's lift");

// Clearing the box clears THIS rotation and leaves the others standing.
resetClock();
var cleared = makePlayer("emom");
rotate(cleared); cleared.noteWeight("Devils Press", "40");
rotate(cleared); cleared.noteWeight("Devils Press", "30");
cleared.noteWeight("Devils Press", "");
check(recorded(cleared)["Devils Press"] === 40,
  "emptying the box drops that rotation, not the whole exercise (got "
  + recorded(cleared)["Devils Press"] + ")");

resetClock();
var allCleared = makePlayer("emom");
rotate(allCleared); allCleared.noteWeight("Devils Press", "40");
allCleared.noteWeight("Devils Press", "");
check(recorded(allCleared)["Devils Press"] === undefined,
  "and clearing the only rotation leaves no weight at all");

// A number the app refuses is not a lift.
resetClock();
var capped = makePlayer("emom");
rotate(capped); capped.noteWeight("Devils Press", "40");
rotate(capped); capped.noteWeight("Devils Press", "9999");
check(recorded(capped)["Devils Press"] === 40,
  "a weight over the cap is refused rather than recorded as the heaviest (got "
  + recorded(capped)["Devils Press"] + ")");

// ---------------- going back to a minute returns to it (T-81) ------------

// back() nulls emomWeightFor to force the weight field to re-read, so redoing
// a minute comes back through syncEmomWeightField. That used to allocate a NEW
// rotation — and under the heaviest rule the number the member went back to
// correct was the one that survived.
resetClock();
var redo = makePlayer("emom");
atMinute(redo, 0); redo.noteWeight("Devils Press", "40");
atMinute(redo, 1); redo.noteWeight("Devils Press", "400");   // the slip
atMinute(redo, 1); redo.noteWeight("Devils Press", "45");    // Back, same minute
check(recorded(redo)["Devils Press"] === 45,
  "going back to the minute you mistyped lets you correct it (got "
  + recorded(redo)["Devils Press"] + ")");
check(recorded(redo)["Devils Press"] !== 400,
  "rather than keeping the slip for ever, which is what T-81 was");
check(Object.keys(redo.roundWeights).length === 2,
  "redoing a minute is the same rotation, not another one (got "
  + Object.keys(redo.roundWeights).length + ")");

// Back to an EARLIER minute returns to that minute's rotation too.
resetClock();
var backFurther = makePlayer("emom");
atMinute(backFurther, 0); backFurther.noteWeight("Devils Press", "999");
atMinute(backFurther, 1); backFurther.noteWeight("Devils Press", "40");
atMinute(backFurther, 2); backFurther.noteWeight("Devils Press", "45");
atMinute(backFurther, 0); backFurther.noteWeight("Devils Press", "50");  // back to the first
check(recorded(backFurther)["Devils Press"] === 50,
  "and a minute further back is reachable as well (got "
  + recorded(backFurther)["Devils Press"] + ")");
check(Object.keys(backFurther.roundWeights).length === 3,
  "three minutes, three rotations, however often they are revisited (got "
  + Object.keys(backFurther.roundWeights).length + ")");

// Going forward again after a Back does not reuse the minute behind it.
resetClock();
var forward = makePlayer("emom");
atMinute(forward, 0); forward.noteWeight("Devils Press", "40");
atMinute(forward, 1); forward.noteWeight("Devils Press", "30");
atMinute(forward, 0); forward.noteWeight("Devils Press", "35");   // Back, corrected
atMinute(forward, 1); forward.noteWeight("Devils Press", "32");   // on again
check(Object.keys(forward.roundWeights).length === 2,
  "two minutes stay two rotations across a Back and forward again");
check(recorded(forward)["Devils Press"] === 35,
  "and the corrected minute is the one that counts (got "
  + recorded(forward)["Devils Press"] + ")");

// A single-exercise EMOM never changes hands, so it stays one rotation — the
// box is not rebound and the member sees one field for the whole block. This
// is the case keying purely by minute would have broken.
resetClock();
var solo = makePlayer("emom");
atMinute(solo, 0);
solo.noteWeight("Devils Press", "400");
solo.remaining = EMOM_DURATION - 3 * EMOM_INTERVAL;   // clock runs on, no rebind
solo.noteWeight("Devils Press", "40");
check(recorded(solo)["Devils Press"] === 40,
  "a single-exercise EMOM stays correctable the whole way through (got "
  + recorded(solo)["Devils Press"] + ")");
check(Object.keys(solo.roundWeights).length === 1,
  "because the box is never handed on, so there is one rotation");

// The minute is worked out the same way the clock and the Back button do it.
resetClock();
var clock = makePlayer("emom");
clock.remaining = EMOM_DURATION;
check(clock.currentEmomMinute() === 0, "minute 0 at the start");
clock.remaining = EMOM_DURATION - 90;
check(clock.currentEmomMinute() === 1, "minute 1 halfway through the second minute");
clock.remaining = 0;
check(clock.currentEmomMinute() === 12, "and the last tick is past the last minute");
clock._kind = "amrap";
check(clock.currentEmomMinute() === null, "there is no EMOM minute on a block without a clock");

// An EMOM with no interval is malformed content, not a crash and not minute
// NaN: it answers "no minute" and the whole block is one rotation, which is
// how every weight box behaved before any of this.
resetClock();
var noInterval = makePlayer("emom");
noInterval.currentPhase = function () { return { kind: "emom", duration: 600 }; };
check(noInterval.currentEmomMinute() === null,
  "an EMOM with no interval has no minute to be on (got " + noInterval.currentEmomMinute() + ")");
noInterval.emomBindSeq = noInterval.emomSlotForNow();
noInterval.noteWeight("Devils Press", "400");
noInterval.emomBindSeq = noInterval.emomSlotForNow();
noInterval.noteWeight("Devils Press", "40");
check(Object.keys(noInterval.roundWeights).length === 1,
  "so it stays one rotation and remains correctable (got "
  + Object.keys(noInterval.roundWeights).length + ")");
check(recorded(noInterval)["Devils Press"] === 40, "with the corrected number kept");

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
resetClock();
var block = makePlayer("amrap");
rotate(block); block.noteWeight("Goblet Squat", "50");
rotate(block); block.noteWeight("Goblet Squat", "35");
check(Object.keys(block.roundWeights).length === 1,
  "a box that is not on an EMOM clock is one entry however the clock turns (got "
  + Object.keys(block.roundWeights).length + ")");
check(recorded(block)["Goblet Squat"] === 35, "and simply holds what is in it");

// The key has to be readable by topWeightsFrom, which splits on "|".
resetClock();
var slot = makePlayer("emom").weightSlotFor("Devils Press");
check(slot.split("|")[1] === "Devils Press",
  "the exercise is the middle part of the key, as topWeightsFrom expects (got " + slot + ")");

// Two different exercises in the same rotation are two entries.
resetClock();
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
check(sync.indexOf("this.emomBindSeq = this.emomSlotForNow()") !== -1,
  "the rotation is decided where the box is handed to the next exercise");
check((CODE.match(/emomBindSeq\+\+/g) || []).length === 0,
  "and is no longer a bare increment, which is what made Back a new rotation");
check(/emomSeqByMinute: this\.emomSeqByMinute/.test(CODE),
  "the minute-to-rotation map rides the saved session");
check(/this\.emomSeqByMinute = rec\.emomSeqByMinute \|\| \{\}/.test(CODE),
  "and comes back on a resume, so a resumed minute is still its own rotation");

print(pass + " passed, " + fail + " failed");
