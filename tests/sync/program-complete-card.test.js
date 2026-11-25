// The end-of-programme card said "Your 1 weeks are up" and put three numbers
// counted three different ways in one row (tester T-71).
//
// Two things, and Chris decided both on 2026-11-25:
//
// 1. A one-week programme gets its own headline. "Your {weeks} weeks are up"
//    is the eight-week wording he chose in August and he wanted it left alone,
//    so one week gets a second editable line rather than a plural syntax in a
//    text box he edits by hand. One-week programmes are real: Kelly's superset
//    week and the tester's week are both one.
//
// 2. The three stats keep counting what they counted, and the LABELS say what
//    that is. "35/48 Workouts - 54h 15m - 56 Longest Streak" for a member who
//    walked daily means 28 of those 54 hours are walking and the 56-day streak
//    is walks; each number was defensible alone and the row read as three views
//    of one thing. Counting the time and streak from the programme workouts
//    only was the other option, and it was rejected because the Progress tab's
//    Day Streak also counts cardio - that would have had one screen saying 56
//    and another saying 3 about the same word.
//
// So this file pins the decision as much as the code: if someone later
// narrows the counts to "make them consistent", the checks below say what was
// decided and why.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
var HTML = readFile("../../index.html");
var ADMIN = readFile("../../admin/app.js");
var ADMIN_DATA = readFile("../../admin/data.js");

function braceMatch(src, from) {
  var depth = 0;
  for (var i = src.indexOf("{", from); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFrom(src, name) {
  var at = src.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone");
  return braceMatch(src, at);
}

// ---------------- just enough page to draw the card ----------------

var ELS = {};
// textContent coerces to a string, the way a real element does: the streak is
// handed over as a number, and a fake that stored it as one would let a check
// pass for the wrong reason.
function El() {
  this.style = {};
  var held = "";
  Object.defineProperty(this, "textContent", {
    get: function () { return held; },
    set: function (v) { held = String(v); },
  });
}
var document = { getElementById: function (id) { return (ELS[id] = ELS[id] || new El()); } };

eval(liftFrom(DATA, "dateKey"));
eval(liftFrom(APP, "dateKeyFrom"));
eval(liftFrom(APP, "parseDateKey"));
eval(liftFrom(APP, "daysBetween"));
eval(liftFrom(APP, "fillCopyTemplate"));
eval(liftFrom(APP, "formatTrainingTime"));
eval(liftFrom(APP, "longestStreakBetween"));
eval(liftFrom(APP, "renderProgramComplete"));

// The shipped default copy, read out of data.js rather than restated here.
var COPY_DEFAULT = (function () {
  var at = DATA.indexOf("    programComplete: {");
  var src = braceMatch(DATA, at)
    .replace(/^\s*\/\/.*$/gm, "");
  return eval("(" + src.slice(src.indexOf("{")) + ")");
})();

var APP_SETTINGS = { copy: { programComplete: JSON.parse(JSON.stringify(COPY_DEFAULT)) } };
var CURRENT_MEMBER = { program: "Fit & Functional", startDate: "2026-11-16" };
var COMPLETIONS = [];

function position(weeks, opts) {
  opts = opts || {};
  var totalDays = weeks * 7;
  var end = parseDateKey(CURRENT_MEMBER.startDate);
  end.setDate(end.getDate() + (totalDays - 1));
  return {
    finished: true, totalWeeks: weeks, totalDays: totalDays, endDate: end,
    doneAll: opts.doneAll == null ? 0 : opts.doneAll,
    totalWorkouts: opts.totalWorkouts == null ? 0 : opts.totalWorkouts,
  };
}
function draw(pos) { COPY_RESET(); return renderProgramComplete(pos); }
function COPY_RESET() {}
function title() { return ELS["program-complete-title"].textContent; }

// ---------------- the headline ----------------

draw(position(8));
check(title() === "Your 8 weeks are up",
  "an eight-week programme still reads the wording Chris chose (got " + title() + ")");

draw(position(1));
check(title() === "Your week is up",
  "a one-week programme reads its own line (got " + title() + ")");
check(title().indexOf("1 weeks") === -1, "and never \"1 weeks\", which is the finding");
check(title().indexOf("{") === -1, "with no placeholder left unfilled");

// Two weeks is the first plural, and must not take the one-week line.
draw(position(2));
check(title() === "Your 2 weeks are up", "two weeks takes the ordinary headline (got " + title() + ")");

// A coach who empties the one-week line wants the ordinary headline, not a
// blank card.
APP_SETTINGS.copy.programComplete.titleOne = "";
draw(position(1));
check(title() === "Your 1 weeks are up",
  "emptying the one-week line falls back to the ordinary headline rather than printing nothing");
check(title() !== "", "and the card is never left headline-less");
APP_SETTINGS.copy.programComplete.titleOne = "   ";
draw(position(1));
check(title() === "Your 1 weeks are up", "and spaces count as empty");

// A settings record saved before this existed has no titleOne at all. It must
// not throw, and it must not print "undefined".
delete APP_SETTINGS.copy.programComplete.titleOne;
draw(position(1));
check(title() === "Your 1 weeks are up",
  "an older saved copy with no one-week line still draws (got " + title() + ")");
check(title().indexOf("undefined") === -1, "and prints no undefined");
APP_SETTINGS.copy.programComplete.titleOne = COPY_DEFAULT.titleOne;

// A coach's own wording is used as written, for both lines.
APP_SETTINGS.copy.programComplete.title = "That is {weeks} weeks of {program}";
APP_SETTINGS.copy.programComplete.titleOne = "One week of {program}, done";
draw(position(8));
check(title() === "That is 8 weeks of Fit & Functional", "a coach's own headline is used as written");
draw(position(1));
check(title() === "One week of Fit & Functional, done", "and their own one-week line too");
APP_SETTINGS.copy.programComplete = JSON.parse(JSON.stringify(COPY_DEFAULT));

// ---------------- what the three numbers count ----------------

CURRENT_MEMBER.startDate = "2026-01-05";
COMPLETIONS = [];
// Eight weeks. 35 programme workouts, and a 30-minute walk every single day.
var day = parseDateKey("2026-01-05");
for (var i = 0; i < 56; i++) {
  var k = dateKey(day);
  COMPLETIONS.push({ id: "walk-" + i, date: k, minutes: 30, workoutId: "walk" });
  if (i < 35) COMPLETIONS.push({ id: "w-" + i, date: k, minutes: 45, workoutId: "prog" });
  day.setDate(day.getDate() + 1);
}
var pos = position(8, { doneAll: 35, totalWorkouts: 48 });
draw(pos);
check(ELS["pc-workouts"].textContent === "35/48",
  "the fraction counts programme workouts, matched to their day (got " + ELS["pc-workouts"].textContent + ")");
var minutes = 35 * 45 + 56 * 30;
check(ELS["pc-time"].textContent === formatTrainingTime(minutes),
  "the time counts everything they did in the window, walks included (got "
  + ELS["pc-time"].textContent + ", expected " + formatTrainingTime(minutes) + ")");
check(ELS["pc-time"].textContent !== formatTrainingTime(35 * 45),
  "and is NOT narrowed to the programme workouts - Chris chose to keep the walking visible");
check(ELS["pc-streak"].textContent === "56",
  "the streak counts every training day, which is how the Progress tab counts one too (got "
  + ELS["pc-streak"].textContent + ")");
check(ELS["pc-streak"].textContent !== "35",
  "and not just the programme days, which would have had two screens disagreeing about \"streak\"");

// Nothing logged at all is three honest zeroes, not a crash.
COMPLETIONS = [];
draw(position(8, { doneAll: 0, totalWorkouts: 48 }));
check(ELS["pc-workouts"].textContent === "0/48" && ELS["pc-streak"].textContent === "0",
  "a member who did nothing gets zeroes rather than an error");

// ---------------- the labels say which is which ----------------

var labels = [];
HTML.replace(/id="pc-(workouts|time|streak)"[^]*?<p class="stat-label">([^<]+)<\/p>/g,
  function (whole, id, text) { labels.push(id + ": " + text); return whole; });
check(labels.length === 3, "all three stats still have a label (" + labels.join(" | ") + ")");
check(labels[0] === "workouts: Program workouts",
  "the fraction is labelled as programme workouts (" + labels[0] + ")");
check(labels[1] === "time: All training time",
  "the time says it is all training (" + labels[1] + ")");
check(labels[2] === "streak: Longest training streak",
  "and so does the streak (" + labels[2] + ")");
check(labels.join("|").indexOf("Total Time") === -1,
  "the old \"Total Time\" is gone - it was the word that made the row read as one thing");

// ---------------- the coach can edit it ----------------

check(ADMIN.indexOf('data-pc-field="titleOne"') !== -1,
  "admin offers the one-week headline as a field");
check(ADMIN.indexOf("[data-pc-field]") !== -1,
  "and saves it with the rest, because the save reads every pc field");
check(/one-week program/i.test(ADMIN), "with help text saying when it is used");
check(ADMIN.indexOf('get("titleOne")') !== -1,
  "and the live preview shows the one-week reading as well as the eight-week one");
check(ADMIN_DATA.indexOf("titleOne:") !== -1, "admin ships the same default as the member app");
var memberDefault = COPY_DEFAULT.titleOne;
var adminDefault = (function () {
  var m = ADMIN_DATA.match(/titleOne: "([^"]*)"/);
  return m ? m[1] : null;
})();
check(memberDefault === adminDefault,
  "and the two defaults are the same string (" + memberDefault + " / " + adminDefault + ")");

print("\n  " + pass + " passed, " + fail + " failed");
