// Move a workout to another day and Home carried on as if you hadn't
// (tester T-75).
//
// The Calendar's ⇄ handle moves a workout, and the Calendar honours it: the
// session leaves its old day and appears on the new one. Home knew about
// neither half. So on the day the member moved it OFF, Home still offered that
// workout as today's session; and on the day they moved it ONTO, Home said
// nothing was scheduled. The two screens disagreed in both directions, and
// Home is the screen members actually open — a member who trusts it does the
// wrong session, and the day they meant to clear stays open.
//
// The fix is one shared `scheduledItemsOnDay()`, called by both screens, so
// they cannot drift apart again. These checks drive the real
// `todayScheduledItems()` with a real programme, against a move store it reads
// through the real helpers.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
eval(DATA.replace(/^const /gm, "var "));

function liftFn(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  var depth = 0;
  for (var i = APP.indexOf("{", at); i < APP.length; i++) {
    if (APP[i] === "{") depth++;
    else if (APP[i] === "}") { depth--; if (depth === 0) return APP.slice(at, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
// dateKey() comes from data.js, which is already evaluated above. One eval per
// line at the top level: an eval inside a callback defines the function in the
// callback's scope, where the code under test cannot see it.
eval(liftFn("dateKeyFrom"));
function reportBadDate() {}
eval(liftFn("parseDateKey"));
eval(liftFn("daysBetween"));
eval(liftFn("scheduleItemsForProgramDay"));
eval(liftFn("workoutMoves"));
eval(liftFn("moveForProgramDay"));
eval(liftFn("workoutsMovedOnto"));
eval(liftFn("scheduledItemsOnDay"));
eval(liftFn("workoutsForSlot"));
eval(liftFn("todayScheduledItems"));

// ---- the bits of the app those functions lean on -------------------------
var PROGRAM = "fit-functional-test-week-1792947605130";
var MOVES = [];
function loadScheduledItems() { return MOVES; }
function memberAccess() { return "home"; }
function cardioLoggedOnDate() { return { done: false }; }
function completionForSlotOnDate() { return null; }
// No completions in play here: this is about which session is NAMED today,
// not whether it is ticked. T-70 covers the done-ness.
function memberProgramPosition() { return { doneByDay: new Map() }; }

// Anchored to the real today so the test does not rot: start the member far
// enough back that today is programme day 8, the Monday of week 2.
function shiftDays(n) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
var CURRENT_MEMBER = {
  id: "tester", scheduleType: "structured",
  programId: PROGRAM, startDate: shiftDays(-7),
};
var TODAY = shiftDays(0), TOMORROW = shiftDays(1);

function homeSays() {
  return todayScheduledItems().map(function (i) {
    if (i.kind === "workout") return i.circuit.title;
    if (i.kind === "moved") return "MOVED->" + i.movedTo;
    return i.kind.toUpperCase();
  });
}
// The move store the ⇄ handle writes: the programme DAY that moved, and the
// date it now happens on.
function moveDayToDate(day, date) { MOVES.push({ type: "moved-workout", day: day, date: date }); }

// Today is programme day 8 (SHOULDERS/ABS); day 9 is HAMSTRINGS/GLUTES.
check(todayScheduledItems().length > 0, "the member is on a day with something on it");

// ---------------- 1. no move: unchanged ----------------
MOVES = [];
check(homeSays().join(",") === "SHOULDERS/ABS",
  "with no moves, Home names today's session (got " + homeSays().join(",") + ")");

// ---------------- 2. moved away ----------------
MOVES = [];
moveDayToDate(8, TOMORROW);
var away = homeSays();
check(away.indexOf("SHOULDERS/ABS") === -1,
  "a workout moved off today is no longer offered as today's session (got " + away.join(",") + ")");
check(away.some(function (x) { return x.indexOf("MOVED->") === 0; }),
  "and Home says where it went rather than going blank (got " + away.join(",") + ")");
check(away.join(",").indexOf(TOMORROW) !== -1, "naming the day the member chose");

// ---------------- 3. moved in ----------------
MOVES = [];
moveDayToDate(9, TODAY);              // tomorrow's session pulled onto today
var movedIn = homeSays();
check(movedIn.indexOf("HAMSTRINGS/GLUTES") !== -1,
  "a workout moved onto today shows up on Home (got " + movedIn.join(",") + ")");
check(movedIn.indexOf("SHOULDERS/ABS") !== -1,
  "and today's own session is still there, because only one of the two moved");

// ---------------- 4. the swap, which is the ordinary case ----------------
MOVES = [];
moveDayToDate(8, TOMORROW);           // today's goes to tomorrow
moveDayToDate(9, TODAY);              // tomorrow's comes to today
var swapped = homeSays();
check(swapped.indexOf("HAMSTRINGS/GLUTES") !== -1,
  "after a swap Home names the session that was moved in (got " + swapped.join(",") + ")");
check(swapped.indexOf("SHOULDERS/ABS") === -1,
  "and not the one that was moved away, which is what T-75 was");

// ---------------- both screens, one rule ----------------

// The Calendar asks the same function for the same day, so the two cannot
// answer differently.
MOVES = [];
moveDayToDate(8, TOMORROW);
moveDayToDate(9, TODAY);
var template = SCHEDULE_TEMPLATES[PROGRAM];
var calendarToday = scheduledItemsOnDay(template, 8, TODAY);
var calendarTitles = calendarToday.items.map(function (it) {
  var c = workoutsForSlot(it.workoutId)[0];
  return c ? c.title : it.type;
});
check(calendarTitles.join(",") === "HAMSTRINGS/GLUTES",
  "the Calendar names the same session for today (got " + calendarTitles.join(",") + ")");
check(calendarTitles.join(",") === swapped.filter(function (x) { return x.indexOf("MOVED->") !== 0; }).join(","),
  "Home and the Calendar agree, which is the whole point");
check(!!calendarToday.movedAway, "and the day knows its own workout left");

// A moved workout keeps the programme day it belongs to, which is what the
// completion map is keyed by — rewriting it to the day it landed on would
// break the done-ness rule T-70 put in.
MOVES = [];
moveDayToDate(9, TODAY);
var landed = scheduledItemsOnDay(template, 8, TODAY).items
  .filter(function (it) { return it.movedFromDay != null; });
check(landed.length === 1 && landed[0].day === 9 && landed[0].movedFromDay === 9,
  "a moved workout still carries its own programme day");

// Moves apply to workouts only: a coach's cardio or reminder is an instruction
// about that day and does not travel with the session.
MOVES = [];
moveDayToDate(8, TOMORROW);
var leftBehind = scheduledItemsOnDay(template, 8, TODAY).items
  .filter(function (it) { return it.type !== "workout"; }).length;
var nonWorkoutsOnDay8 = scheduleItemsForProgramDay(template, 8)
  .filter(function (it) { return it.type !== "workout"; }).length;
check(leftBehind === nonWorkoutsOnDay8,
  "moving a workout leaves the coach's other items on the day");

// ...and they do not travel TO the destination either. The real programme has
// no day carrying both a workout and a coach's item, so this one is built:
// without it, "only workouts move" is only half checked, and a mutation that
// drags the coach's cardio along with the session goes unnoticed.
var mixed = [
  { day: 8, type: "workout", workoutId: "shoulders-abs-1792948000381-copy-1795448578035-5" },
  { day: 9, type: "workout", workoutId: "hamstrings-glutes-1792972456231-copy-1795448578035-4" },
  { day: 9, type: "cardio", minutes: 20 },
  { day: 9, type: "note", text: "Hydrate." },
];
MOVES = [];
moveDayToDate(9, TODAY);
var arrived = scheduledItemsOnDay(mixed, 8, TODAY).items;
check(arrived.filter(function (it) { return it.type === "workout"; }).length === 2,
  "the moved workout arrives on today (got "
  + arrived.filter(function (it) { return it.type === "workout"; }).length + ")");
check(arrived.filter(function (it) { return it.type !== "workout"; }).length === 0,
  "but the coach's cardio and reminder stay on the day he put them, rather than "
  + "travelling with the session (got "
  + JSON.stringify(arrived.filter(function (it) { return it.type !== "workout"; }).map(function (i) { return i.type; })) + ")");

// ---------------- it is genuinely shared ----------------

check((CODE.match(/scheduledItemsOnDay\(/g) || []).length === 3,
  "one definition and two callers, not a rule copied twice (got "
  + (CODE.match(/scheduledItemsOnDay\(/g) || []).length + ")");
var calendarRow = (function () {
  var at = CODE.indexOf("function renderCalendarDayRow(");
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
})();
check(calendarRow.indexOf("scheduledItemsOnDay(template, programDay, dayKey)") !== -1,
  "the Calendar row gets its items from the shared rule");
check(calendarRow.indexOf("workoutsMovedOnto(dayKey).flatMap") === -1,
  "and no longer keeps its own copy of it");
var homeFn = (function () {
  var at = CODE.indexOf("function todayScheduledItems(");
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
})();
check(homeFn.indexOf("scheduledItemsOnDay(template, todayProgramDay, todayKey)") !== -1,
  "and so does Home");
check(homeFn.indexOf("item.day !== todayProgramDay") === -1,
  "Home no longer picks today's items straight off the template, which is what ignored moves");
check(/moved \? `<p class="home-upcoming-empty">Moved to \$\{formatWeekdayDate/.test(CODE),
  "and Home's empty state says where the workout went");

// The notice is a thing to SAY, not a workout to offer. If it reaches the card
// renderer the member gets a broken card where their rest day used to be.
var homeRender = (function () {
  var at = CODE.indexOf("function renderHomeUpcomingWorkouts(");
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
})();
check(/const real = items\.filter\(\(i\) => i\.kind !== "rest" && i\.kind !== "moved"\)/.test(homeRender),
  "and the notice is kept out of the cards, like the rest-day marker");

print(pass + " passed, " + fail + " failed");
