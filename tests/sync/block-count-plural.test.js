// "You completed all 1 blocks of Week 7 Circuit. 🔥" (tester T-56).
//
// Not an edge case: every Fit & Functional week schedules one Circuit day,
// and that Circuit is built from a single block (data.js,
// buildFitFunctionalCircuits() -> blocks: [ { type: "interval", … } ],
// buildFitFunctionalSchedule() -> focusOrder = five focus areas + "circuit").
// So it is one workout in six, for every member on the programme, for all
// eight weeks.
//
// The same hardcoded plural sat in two more strings on the resume path, both
// reading the same block count, so they are checked here too.
//
// Lifted out of the real app.js, so these checks cannot keep passing after
// the shipped version changes.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

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
eval(lift("completionSentence"));

// Comments are stripped before any positional check below: a check that only
// needs the word "blocks" to appear somewhere is satisfied by a comment
// explaining the bug, which is how a defective check passes forever.
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ---------------- the one-block workout, which is the weekly one ----------------

// The shape data.js actually emits for the weekly Circuit.
var weeklyCircuit = {
  id: "ff-w7-circuit-home",
  title: "Week 7 Circuit",
  blocks: [{ type: "interval", label: "Conditioning Circuit", rounds: 5, work: 40, rest: 20 }],
};
var one = completionSentence(weeklyCircuit);
print("  one block  -> " + one);
check(one.indexOf("1 blocks") === -1, "a one-block workout never says \"1 blocks\"");
check(one.indexOf("all 1") === -1, "and does not say \"all 1\" either");
check(one.indexOf("Week 7 Circuit") !== -1, "it still names the workout");
check(one === "You completed Week 7 Circuit. \u{1F525}", "the whole sentence reads: You completed Week 7 Circuit. \u{1F525}");

// ---------------- more than one block is unchanged ----------------

var three = completionSentence({ title: "Superset", blocks: [{}, {}, {}] });
print("  three blocks -> " + three);
check(three === "You completed all 3 blocks of Superset. \u{1F525}",
  "three blocks still reads: You completed all 3 blocks of Superset. \u{1F525}");
check(completionSentence({ title: "Push Day", blocks: [{}, {}] })
  === "You completed all 2 blocks of Push Day. \u{1F525}", "two blocks is the smallest plural");
check(completionSentence({ title: "Long One", blocks: [{},{},{},{},{},{}] }).indexOf("all 6 blocks") !== -1,
  "six blocks counts to six");

// The emoji is part of the screen; losing it silently would be a regression
// no plural check would notice.
check(one.indexOf("\u{1F525}") !== -1 && three.indexOf("\u{1F525}") !== -1,
  "both wordings keep the fire");

// ---------------- nothing readable to say it with ----------------
// Not reachable from the player today (finish() returns early without a
// circuit), but this function is now the only thing that writes that line.

check(completionSentence(null) === "You completed your workout. \u{1F525}",
  "no circuit at all still reads as a sentence, not \"undefined\" or \"null\"");
check(completionSentence({}) === "You completed your workout. \u{1F525}",
  "a circuit with no title does the same");
check(completionSentence({ title: "Empty", blocks: [] }).indexOf("0 blocks") === -1,
  "a workout with no blocks does not say \"0 blocks\"");

// ---------------- the finish screen uses it ----------------
// A correct helper nothing calls is the other way this stays broken.

check(CODE.indexOf("completionSentence(this.circuit)") !== -1,
  "finish() writes the completion text with completionSentence(this.circuit)");
check(CODE.indexOf("blocks of ${this.circuit.title}") === -1,
  "the old inline sentence is gone from finish()");
check(CODE.indexOf("workout-complete-text") !== -1, "and still writes it into #workout-complete-text");

// The defect signature anywhere in the member app: a raw block count with the
// plural welded to it.
check(CODE.indexOf("length} blocks") === -1,
  "no string anywhere in app.js follows a raw block count with a hardcoded \"blocks\"");

// ---------------- the two resume strings that read the same count ----------------

var PLURAL = 'block${circuit.blocks.length === 1 ? "" : "s"}';
var prompt = CODE.indexOf("earlier, then left. Want it logged as a partial workout?");
check(prompt !== -1, "the resume prompt is still there to check");
check(prompt !== -1 && CODE.slice(CODE.lastIndexOf("You finished", prompt), prompt).indexOf(PLURAL) !== -1,
  "the resume prompt pluralises the block count instead of hardcoding it");

var banner = CODE.indexOf(", then left.`");
check(banner !== -1, "the resume banner line is still there to check");
check(banner !== -1 && CODE.slice(CODE.lastIndexOf("You finished", banner), banner).indexOf(PLURAL) !== -1,
  "the resume banner pluralises the block count instead of hardcoding it");
