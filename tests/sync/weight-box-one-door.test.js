// A weight typed on an AMRAP or EMOM screen was never checked (tester T-65),
// and a weight typed with a comma was stored ten times too heavy (T-68).
//
// T-60 gave the end-of-block "Log your weights" screen a cap, a cleaner and
// select-on-focus. The app asks for a weight in two OTHER places — the box
// beside each exercise on an AMRAP list, and the one box on an EMOM screen —
// and they had none of it: `noteWeight()` stored `Number(whatever)`, so
// 5,000 lb became a real lift and a personal best, outranking a properly
// capped weight typed on the good screen for the same exercise.
//
// Three screens, one door. These checks are about that door being the only
// one.
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
var HTML_CODE = HTML.replace(/<!--[\s\S]*?-->/g, "");

eval(lift("normaliseDecimalComma"));
eval(lift("parseLoggedWeight"));
var capLine = APP.match(/const MAX_LOGGED_WEIGHT = ([0-9.]+);/);
eval(capLine[0].replace("const", "var"));

// ---------------- the commas (T-68) ----------------

check(parseLoggedWeight("12,5").value === 12.5, "12,5 is twelve and a half, not a hundred and twenty five");
check(parseLoggedWeight("12,50").value === 12.5, "and so is 12,50");
check(parseLoggedWeight("7,25").value === 7.25, "two digits behind the comma are hundredths");
check(parseLoggedWeight("1,000").value === 1000, "1,000 is a thousand, not one");
check(parseLoggedWeight("1,234.5").value === 1234.5, "a comma AND a point means the comma is a separator");
check(parseLoggedWeight("1,0000").state === "rejected",
  "four digits behind a comma is a separator, so 10000 is over the cap and refused");
check(parseLoggedWeight("12,5,5").value === 1255, "two commas are separators, and the result is still checked");
check(normaliseDecimalComma("80") === "80", "a plain number is left alone");

// The whole point: the ten-times-heavier number can no longer be stored.
check(parseLoggedWeight("12,5").value !== 125, "the old answer is gone");

// ---------------- one door, three screens (T-65) ----------------

// noteWeight is what the AMRAP and EMOM boxes call. It must check.
var note = CODE.indexOf("noteWeight(name, raw) {");
check(note !== -1, "noteWeight is still there");
var body = CODE.slice(note, note + 400);
check(body.indexOf("parseLoggedWeight(raw)") !== -1,
  "noteWeight checks what it is handed instead of storing Number(whatever)");
check(body.indexOf("Number(val)") === -1, "the unchecked line is gone");
check(body.indexOf("delete this.sessionWeights[name]") !== -1,
  "and a number it will not store clears the entry rather than keeping a stale one");

// Every box goes through readWeightBox: clean, parse, mark.
check(CODE.indexOf("function readWeightBox(") !== -1, "there is one reader for every weight box");
// Brace-matched, not a fixed slice: a 500-character window ran past the end
// of this function into markWeightInput's own definition, so a check for the
// call passed with the call deleted (caught by mutation, 2026-11-22).
function bodyOf(name) {
  var start = CODE.indexOf("function " + name + "(");
  var depth = 0;
  for (var i = CODE.indexOf("{", start); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(start, i + 1); }
  }
  return "";
}
var readerBody = bodyOf("readWeightBox");
check(readerBody.indexOf("[^0-9.,]") !== -1, "it keeps commas, which the parser needs to read them");
// One hop further since T-90: the reader cleans, and the writing and the
// marking happen together in setWeightBoxValue, so that a value the APP puts
// in a box is marked too. A check for the parse or the mark anywhere in
// app.js would pass with the reader gutted, so follow the call.
check(readerBody.indexOf("setWeightBoxValue(input, cleaned)") !== -1,
  "and hands the cleaned value to the one writer");
var writerBody = bodyOf("setWeightBoxValue");
check(writerBody.indexOf("parseLoggedWeight(next)") !== -1, "which parses it");
check(writerBody.indexOf("markWeightInput(input, parsed)") !== -1,
  "and marks the row when the answer is no");
check(writerBody.indexOf("if (input.value !== next) input.value = next;") !== -1,
  "and only touches the box when the value actually changes, so typing mid-number keeps the caret");

// The three screens.
// The WIRING, not merely a mention: since T-93 the player also reaches those
// boxes to put them back when a round is taken away, and that is not where
// the listeners are hung.
var amrap = -1;
for (var _f = 0; ; ) {
  var _hit = CODE.indexOf("#player-amrap-list .superset-weight-input", _f);
  if (_hit < 0) break;
  if (CODE.slice(_hit, _hit + 400).indexOf("addEventListener") !== -1) { amrap = _hit; break; }
  _f = _hit + 1;
}
check(amrap !== -1, "the AMRAP list still wires its boxes");
var amrapBlock = CODE.slice(amrap, amrap + 400);
check(amrapBlock.indexOf("readWeightBox(input)") !== -1, "the AMRAP box goes through the reader");
check(amrapBlock.indexOf("selectWeightBoxOnFocus(input)") !== -1, "and selects on focus like the others");
check(amrapBlock.indexOf("noteWeight(input.dataset.exName, input.value)") === -1,
  "the raw unchecked wiring is gone from the AMRAP list");

var emom = CODE.indexOf("input.oninput = () => {");
check(emom !== -1, "the EMOM field still wires its box");
var emomBlock = CODE.slice(emom, emom + 400);
check(emomBlock.indexOf("readWeightBox(input)") !== -1, "the EMOM box goes through the reader");
check(emomBlock.indexOf("selectWeightBoxOnFocus(input)") !== -1, "and selects on focus");

// Both markups, like the weights screen: text, decimal keypad, a length limit
// that type=number silently ignores.
var amrapInput = CODE.slice(CODE.indexOf("class=\"superset-weight-input\"") - 200,
                            CODE.indexOf("class=\"superset-weight-input\"") + 60);
check(amrapInput.indexOf("type=\"text\"") !== -1 && amrapInput.indexOf("inputmode=\"decimal\"") !== -1,
  "the AMRAP box is a text input with a decimal keypad");
check(amrapInput.indexOf("maxlength=") !== -1, "with a length limit");
// The <label for="..."> carries the same id and comes first, so anchor on
// the input's own attribute rather than on the first mention of the id.
var emomAt = HTML_CODE.indexOf('id="player-emom-weight-input"');
var emomInput = HTML_CODE.slice(emomAt - 160, emomAt + 80);
check(emomInput.indexOf("type=\"text\"") !== -1 && emomInput.indexOf("inputmode=\"decimal\"") !== -1,
  "and so is the EMOM box");
check(emomInput.indexOf("maxlength=") !== -1, "with a length limit too");
check(HTML_CODE.indexOf('type="number" id="player-emom-weight-input"') === -1,
  "the old uncapped number input is gone from index.html");

// ---------------- the numbers the finding names ----------------

check(parseLoggedWeight("5000").state === "rejected", "5,000 lb is refused wherever it is typed");
check(parseLoggedWeight("99999").state === "rejected", "and so is 99,999");
check(parseLoggedWeight("0").state === "blank", "zero is not a lift");
check(parseLoggedWeight("-50").state === "rejected", "and neither is minus fifty");
check(MAX_LOGGED_WEIGHT === 2000, "the cap the AMRAP and EMOM boxes now share is the same one");

// ---------------- and the row the server is sent ----------------
// The branch that handles an AMRAP/EMOM-only workout never had the "more
// than zero" guard its neighbour always did, so a 0 or a -50 became a lift.
AUTH_MEMBER = { id: "jordan" };
var rows = liftsToRows([{ id: "local-x", date: "2026-11-22",
  weights: { "Goblet Squats": 0, "Push Press": -50, "Row": 60 } }]);
print("  rows out: " + rows.map(function (r) { return r.exercise_name + "=" + r.weight; }).join(", "));
check(rows.length === 1 && rows[0].exercise_name === "Row",
  "only the real weight is sent; the zero and the negative are dropped");
check(!rows.some(function (r) { return Number(r.weight) <= 0; }),
  "nothing at or below zero reaches lifts");

print("\n  " + pass + " passed, " + fail + " failed");
