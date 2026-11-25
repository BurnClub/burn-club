// Correcting a pre-filled weight gave the member a number they never typed,
// and the box hid it (tester T-60).
//
// The weight boxes are pre-filled so a member can correct one. Tapping a
// pre-filled box put the caret wherever the thumb landed, so 80 corrected to
// 85 became 8850 — carried down into every set of that exercise, and on a
// box 86px wide the display scrolled, so it read 8850 while the field held
// 888550. 8850 is under the column limit, so it saved cleanly and was
// announced as a personal best; 118535 is over it, which is T-59.
//
// Lifted out of the real app.js, so these checks cannot keep passing after
// the shipped version changes.
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
// The cap it reads, taken from the source rather than restated here.
var capLine = APP.match(/const MAX_LOGGED_WEIGHT = ([0-9.]+);/);
if (!capLine) throw new Error("MAX_LOGGED_WEIGHT is gone from app.js");
// `const` inside eval would not escape it; the value is the shipped one either way.
eval(capLine[0].replace("const", "var"));
// parseLoggedWeight calls this; without it the file throws at the first
// check and the runner reports THREW (2026-11-22, T-68).
eval(lift("normaliseDecimalComma"));
eval(lift("parseLoggedWeight"));

// Comments are stripped before the positional checks: a check that only needs
// a word to appear is satisfied by a comment explaining the bug.
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ---------------- the number the member meant ----------------

check(parseLoggedWeight("80").state === "ok" && parseLoggedWeight("80").value === 80, "80 is 80");
check(parseLoggedWeight("85").value === 85, "85 is 85");
check(parseLoggedWeight("72.5").value === 72.5, "a half-kilo plate survives");
check(parseLoggedWeight("72.555").value === 72.56,
  "more decimals than the column keeps are rounded here, so phone and server hold the same number");
check(parseLoggedWeight(" 80 ").value === 80, "spaces either side are ignored");
check(parseLoggedWeight(String(MAX_LOGGED_WEIGHT)).state === "ok", "the cap itself is allowed");

// ---------------- the number the splice produces ----------------

check(parseLoggedWeight("8850").state === "rejected", "8850 — a corrected 80 — is refused");
check(parseLoggedWeight("8850").value === null, "and nothing is handed back to store");
check(parseLoggedWeight("888550").state === "rejected", "the hidden 888550 is refused");
check(parseLoggedWeight("118535").state === "rejected", "135 corrected to 185 is refused");
check(parseLoggedWeight("12345").state === "rejected", "the value from T-59 is refused before it can be saved");
check(String(parseLoggedWeight("8850").why).indexOf(String(MAX_LOGGED_WEIGHT)) !== -1,
  "and the member is told the number that is too big, not a code");

// ---------------- nothing it accepts can overflow the column ----------------
// lifts.weight is numeric(6,2): 9999.99 is the most it can hold.

check(MAX_LOGGED_WEIGHT < 9999.99, "the app's cap sits below the column's ceiling");
check(parseLoggedWeight("9999.99").state === "rejected", "the column's own maximum is still refused by the app");
check(parseLoggedWeight("10000").state === "rejected", "and so is the first value Postgres would reject");

// ---------------- blank is not the same as wrong ----------------

check(parseLoggedWeight("").state === "blank", "an empty box means they did not lift it");
check(parseLoggedWeight(null).state === "blank", "and so does nothing at all");
check(parseLoggedWeight("0").state === "blank", "zero is not a lift");
check(parseLoggedWeight(".").state === "blank", "a lone decimal point is not a number yet");
check(parseLoggedWeight("abc").state === "rejected", "letters are refused, not silently read as nothing");
check(parseLoggedWeight("1e3").state === "rejected",
  "and so is exponent notation, which Number() would have read as 1000");

// ---------------- the screen the member actually types into ----------------

var box = CODE.slice(CODE.indexOf("class=\"weight-log-input\"") - 400,
                     CODE.indexOf("class=\"weight-log-input\"") + 200);
check(box.indexOf("type=\"text\"") !== -1, "the weight box is a text input");
check(box.indexOf("inputmode=\"decimal\"") !== -1, "with a numeric keypad on a phone");
check(box.indexOf("maxlength=") !== -1, "and a maximum length, which type=number silently ignores");
check(box.indexOf("type=\"number\"") === -1,
  "not type=number: select() does nothing on one and setSelectionRange() throws");

var onFocus = CODE.indexOf("input.addEventListener(\"focus\"");
check(onFocus !== -1, "tapping a box does something");
// Scoped on purpose, twice over: app.js calls input.select() elsewhere, so a
// check for the bare call passes with the handler gutted — and the handler
// now delegates, so the call itself has to be followed into the helper.
check(onFocus !== -1 && CODE.slice(onFocus, onFocus + 160).indexOf("selectWeightBoxOnFocus(input)") !== -1,
  "and what it does is hand the box to selectWeightBoxOnFocus");
var helper = CODE.indexOf("function selectWeightBoxOnFocus(");
// One more hop, for the same reason as the hop above: the select itself now
// lives in trySelectWeightBox, which the focus helper calls twice (T-74). A
// check for ".select()" anywhere in app.js would pass with both calls deleted.
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
var focusFn = bodyOfFn("selectWeightBoxOnFocus");
check(helper !== -1 && focusFn.indexOf("trySelectWeightBox(input)") !== -1
  && bodyOfFn("trySelectWeightBox").indexOf(".select()") !== -1,
  "which selects what is in it, something that only works on a text input");
// And the select can no longer be the only thing standing between a thumb and
// a spliced weight — see weight-box-race.test.js for the race it used to lose.
check(focusFn.indexOf("armWeightBox(input)") !== -1,
  "with the first-keystroke rule behind it, which does not depend on timing");
check(bodyOfFn("armWeightBox").indexOf("wireWeightBoxTyping(input)") !== -1,
  "and arming is what wires it, however the box came to hold a number (T-80)");

// Every place a number is taken from a box goes through the one function.
check(CODE.indexOf("parseLoggedWeight(input.value)") !== -1, "typing goes through parseLoggedWeight");
var seeding = CODE.indexOf("if (this.setWeights[input.dataset.key] != null) return;");
check(seeding !== -1 && CODE.lastIndexOf("parseLoggedWeight", seeding) > seeding - 300,
  "and so does the pre-fill, which can hold a bad number typed before this fix");
check(CODE.indexOf("markWeightInput(input, parsed)") !== -1, "a refused number is marked on the row");
check(CODE.indexOf("setWeightBoxValue(other, val)") !== -1,
  "and every row the carry-down writes to goes through the one writer, which marks it (T-90)");

// Where the carry-down lives, and what it is allowed to write.
//
// It used to sit inline in the render function, inside an `if the app accepted
// it` branch, with the refusing branch beside it cleaning up only the box in
// front of the member. That is how a refused 2500 left the 250 of the keystroke
// before standing on three sets nobody had touched (tester T-92). It now lives
// on the player, runs for every keystroke, and carries emptiness down when the
// box holds nothing the app will store.
//
// These are shape checks. What the carry-down actually does, keystroke by
// keystroke, is in refused-weight-leaves-nothing.test.js.
function playerMethod(sig) {
  var at = CODE.indexOf("\n  " + sig + " {");
  if (at < 0) return "";
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
}
var carry = playerMethod("carryWeightDown(input, inputs, parsed)");
check(carry.indexOf("setWeightBoxValue(other, val)") !== -1,
  "the carry-down lives in the player's carryWeightDown, where both directions share one walk");
check(carry.indexOf("const val = parsed.state === \"ok\" ? parsed.value : \"\";") !== -1,
  "and what it carries is the number only when the app accepted it, and nothing when it did not");
// The one thing that must never happen: a refused number written into another
// member's row. parsed.value is null for a refusal, so the danger is not the
// value itself but a branch that writes before checking.
check(carry.split("parsed.value").length - 1 === 1,
  "the parsed number is read once, on that line, and nowhere else in the walk");
var record = playerMethod("recordSetWeight(input, inputs, parsed)");
check(record.indexOf("this.carryWeightDown(input, inputs, parsed)") !== -1
   && record.indexOf("this.syncExerciseWeight(input.dataset.exName, inputs)") !== -1,
  "and every keystroke runs the walk and then re-reads the column, accepted or refused");

print("\n  " + pass + " passed, " + fail + " failed");
