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
check(helper !== -1 && CODE.slice(helper, helper + 240).indexOf(".select()") !== -1,
  "which selects what is in it, something that only works on a text input");

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
var okBranch = CODE.indexOf("if (parsed.state === \"ok\") {");
var carry = CODE.indexOf("other.value = val;");
var elseBranch = CODE.indexOf("} else {", okBranch);
check(okBranch !== -1 && carry > okBranch && carry < elseBranch,
  "the carry-down only runs for a number the app accepted");

print("\n  " + pass + " passed, " + fail + " failed");
