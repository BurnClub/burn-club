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
check(CODE.indexOf("markWeightInput(other, parsed)") !== -1,
  "and the mark clears on rows a good number is carried down into");

// The carry-down must sit inside the accepted branch — carrying a refused
// number down six sets is how one bad tap became six bad rows.
//
// Scoped to the end-of-block handler rather than taken from the first match in
// the file. This used to anchor on the first `if (parsed.state === "ok") {`
// anywhere in app.js; when noteWeight() grew a braced branch of its own for
// T-76 that match moved, and the check quietly stopped looking at the
// carry-down it was written for (2026-11-23).
// There are two `inputs.forEach((input) => {` blocks on this screen — one
// re-marks the boxes on render, one wires the listeners — so take the one that
// actually contains the carry-down rather than whichever comes first.
var handler = (function () {
  var from = 0;
  while (true) {
    var at = CODE.indexOf("inputs.forEach((input) => {", from);
    if (at < 0) return "";
    var depth = 0, block = "";
    for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
      if (CODE[i] === "{") depth++;
      else if (CODE[i] === "}") { depth--; if (depth === 0) { block = CODE.slice(at, i + 1); break; } }
    }
    if (block.indexOf("other.value = val;") !== -1) return block;
    from = at + 1;
  }
})();
check(handler.indexOf("other.value = val;") !== -1,
  "the end-of-block handler is where the carry-down lives");
// Brace-matched, not "somewhere between these two strings": the ordering
// version passes with the carry-down lifted OUT of the branch, because the
// `} else {` still comes after it. It has to be INSIDE.
var okBranch = handler.indexOf("if (parsed.state === \"ok\") {");
var accepted = (function () {
  if (okBranch < 0) return "";
  var depth = 0;
  for (var i = handler.indexOf("{", okBranch); i < handler.length; i++) {
    if (handler[i] === "{") depth++;
    else if (handler[i] === "}") { depth--; if (depth === 0) return handler.slice(okBranch, i + 1); }
  }
  return "";
})();
check(okBranch !== -1 && accepted.indexOf("other.value = val;") !== -1,
  "the carry-down only runs for a number the app accepted");

print("\n  " + pass + " passed, " + fail + " failed");
