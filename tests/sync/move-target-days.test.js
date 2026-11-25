// "Move this workout" offered days the app cannot show (tester T-72).
//
// The Calendar draws the member's own programme week, plus a one-week look
// ahead that stops at the end of the programme (calendarMaxWeek). The move
// picker had its own, separate arithmetic: today through the Sunday of next
// week, Monday-based. Two answers to "how far ahead can you go", free to
// disagree — and they did, in three ways:
//
//   * On the last week of a programme the picker offered seven days past the
//     end of it. The Calendar will not show a week past the last, so the
//     workout landed on a day no screen renders — and nothing could bring it
//     back, because the only move handle is on the day it is sitting on.
//   * Monday-based weeks only line up with the Calendar for a member who
//     started on a Monday.
//   * A member whose programme has not begun was offered the days before it.
//
// These checks drive the real moveTargetDates(), hasMoveTarget() and
// renderCalendarDayRow() against real programmes, and ask the question the
// member actually cares about: if I move it there, can I still find it?
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
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
// One eval per line at the top level: an eval inside a callback defines the
// function in the callback's scope, where the code under test cannot see it.
eval(liftFn("dateKeyFrom"));
function reportBadDate() {}
eval(liftFn("parseDateKey"));
eval(liftFn("daysBetween"));
eval(liftFn("esc"));
eval(liftFn("formatShortDate"));
eval(liftFn("formatWeekdayDate"));
eval(liftFn("variantLabel"));
eval(liftFn("dateForProgramDay"));
eval(liftFn("workoutMoves"));
eval(liftFn("moveForProgramDay"));
eval(liftFn("workoutsMovedOnto"));
eval(liftFn("scheduleItemsForProgramDay"));
eval(liftFn("scheduledItemsOnDay"));
eval(liftFn("workoutsForSlot"));
eval(liftFn("calendarMaxWeek"));
eval(liftFn("moveTargetDates"));
eval(liftFn("hasMoveTarget"));
eval(liftFn("renderCalendarDayRow"));

// ---- the bits those functions lean on ------------------------------------
var MOVES = [];
function loadScheduledItems() { return MOVES; }
function renderScheduledItems() { return ""; }
function calendarCoachCardioHtml() { return "<span>cardio</span>"; }
function calendarReminderHtml() { return "<span>note</span>"; }
function completionForSlotOnDate() { return null; }
function memberAccess() { return "home"; }

var LONG = "fit-functional-test-week-1792947605130"; // 56 days, 8 weeks
var SHORT = "30-minute-burn-test-1792976073830";     // 7 days, 1 week
var CURRENT_MEMBER = { id: "tester", scheduleType: "structured", programId: LONG, startDate: "" };

// pos is stubbed rather than computed so each check can place the member
// exactly where it means to — the arithmetic under test is the picker's, not
// memberProgramPosition()'s, which late-workout-counts.test.js already drives.
var POS = null;
function memberProgramPosition() { return POS; }

function shiftDays(n) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
var TODAY = dateKey(shiftDays(0));

// Put the member on `programDay` today. totalDays and the week come off the
// real template the same way memberProgramPosition() derives them — the
// highest `day` in it, not the number of entries (that mistake read an
// 8-week programme as 10 weeks once already).
function place(programId, programDay) {
  CURRENT_MEMBER.programId = programId;
  CURRENT_MEMBER.startDate = dateKey(shiftDays(1 - programDay));
  var template = SCHEDULE_TEMPLATES[programId] || [];
  var totalDays = template.reduce(function (max, it) { return Math.max(max, it.day || 0); }, 0);
  var weeks = Math.ceil(totalDays / 7);
  var clamped = Math.min(Math.max(programDay, 1), totalDays);
  var week = Math.ceil(clamped / 7);
  var weekFirstDay = (week - 1) * 7 + 1;
  POS = {
    day: programDay, clampedDay: clamped, totalDays: totalDays, week: week,
    totalWeeks: weeks, weekFirstDay: weekFirstDay,
    weekStartDate: dateForProgramDay(weekFirstDay),
    doneByDay: new Map(),
    notStarted: programDay < 1, finished: programDay > totalDays,
  };
  MOVES = [];
  return POS;
}

// The dates the Calendar can draw, derived the way renderCalendarTab() does:
// seven days from the week start, for the member's week through
// calendarMaxWeek(). Nothing outside this set exists as far as a member is
// concerned.
function renderableDates() {
  var out = [];
  for (var w = POS.week; w <= calendarMaxWeek(POS); w++) {
    var start = dateForProgramDay((w - 1) * 7 + 1);
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      out.push(dateKey(d));
    }
  }
  return out;
}

function dayOf(dateStr) {
  return daysBetween(CURRENT_MEMBER.startDate, dateStr) + 1;
}

// ======================================================================
print("\n-- every day on offer is a day the Calendar can draw --");
// The whole finding in one sentence, asked of four different members.
[
  { what: "8-week programme, week 1, day 1", prog: LONG, day: 1 },
  { what: "8-week programme, mid-programme (day 25)", prog: LONG, day: 25 },
  { what: "8-week programme, LAST week (day 52)", prog: LONG, day: 52 },
  { what: "1-week programme, day 3", prog: SHORT, day: 3 },
].forEach(function (c) {
  place(c.prog, c.day);
  var window = renderableDates();
  var offered = moveTargetDates(c.day);
  var strays = offered.filter(function (d) { return window.indexOf(d) === -1; });
  check(offered.length > 0, c.what + ": the picker offers something at all");
  check(strays.length === 0,
    c.what + ": nothing offered outside the Calendar's weeks" +
    (strays.length ? " — got " + strays.join(", ") : ""));
});

print("\n-- the end of a programme --");
// A programme that ends this week. The old arithmetic offered today through
// the Sunday of NEXT week regardless, which is where T-72 was found.
place(SHORT, 3);
var shortOffer = moveTargetDates(3);
var past7 = shortOffer.filter(function (d) { return dayOf(d) > 7; });
check(past7.length === 0,
  "a 1-week programme offers nothing past its last day — got " + shortOffer.join(", "));
check(shortOffer.indexOf(dateKey(dateForProgramDay(7))) !== -1,
  "it does still offer the last day of the programme");
check(shortOffer.length === 5,
  "day 3 of 7: five days left including today, " + shortOffer.length + " offered");

place(LONG, 52);
var lastWeek = moveTargetDates(52);
check(lastWeek.filter(function (d) { return dayOf(d) > 56; }).length === 0,
  "week 8 of 8 offers nothing past day 56 — got " + lastWeek.join(", "));
check(lastWeek.indexOf(dateKey(dateForProgramDay(56))) !== -1,
  "week 8 of 8 does offer the rest of its own week");

place(LONG, 45);
var weekSeven = moveTargetDates(45);
check(weekSeven.indexOf(dateKey(dateForProgramDay(56))) !== -1,
  "week 7 of 8 can still reach into week 8 — the look-ahead is not lost");
check(weekSeven.filter(function (d) { return dayOf(d) > 56; }).length === 0,
  "week 7 of 8 stops at day 56");

print("\n-- the picker's reach IS calendarMaxWeek's, not its own copy --");
// The whole point of the fix: one function answers "how far ahead can you
// go", shared with the Next button, so the two cannot drift apart again. A
// picker that happened to agree today by doing its own (week + 1) would pass
// every check above and silently part company the moment calendarMaxWeek
// changed. So: move calendarMaxWeek and see whether the picker moves with it.
var realMaxWeek = calendarMaxWeek;
place(LONG, 25);
var twoWeeks = moveTargetDates(25);
calendarMaxWeek = function (p) { return p.week; };          // no look-ahead at all
var oneWeek = moveTargetDates(25);
calendarMaxWeek = function (p) { return Math.min(p.week + 2, p.totalWeeks); };
var threeWeeks = moveTargetDates(25);
calendarMaxWeek = realMaxWeek;
check(oneWeek.length < twoWeeks.length && twoWeeks.length < threeWeeks.length,
  "shrink or widen calendarMaxWeek and the picker follows — " +
  oneWeek.length + " / " + twoWeeks.length + " / " + threeWeeks.length + " days");
check(oneWeek.filter(function (d) { return Math.ceil(dayOf(d) / 7) !== POS.week; }).length === 0,
  "with no look-ahead it offers nothing outside the member's own week");
check(moveTargetDates(25).length === twoWeeks.length,
  "and it is back to normal once calendarMaxWeek is");

print("\n-- a programme that does not end on a week boundary --");
// No programme in Burn Club has a part-week at the end today, so this one is
// built here: 52 days, which is seven weeks and three days. The Calendar
// draws week 8 in full, but Home hides its Today card the moment the
// programme is over — so a day past day 52 is only half a place to put a
// session, and is not offered.
SCHEDULE_TEMPLATES["part-week-test"] = [];
for (var pd = 1; pd <= 52; pd++) {
  SCHEDULE_TEMPLATES["part-week-test"].push({ day: pd, type: "workout", workoutId: "none" });
}
place("part-week-test", 50);
check(POS.totalDays === 52 && calendarMaxWeek(POS) === 8,
  "set up: a 52-day programme whose last week is three days long");
var partWeek = moveTargetDates(50);
check(partWeek.length === 3,
  "day 50 of 52: three days left including today, " + partWeek.length + " offered");
check(partWeek.indexOf(dateKey(dateForProgramDay(52))) !== -1,
  "the programme's actual last day is on offer");
check(partWeek.filter(function (d) { return dayOf(d) > 52; }).length === 0,
  "nothing after it is — got " + partWeek.join(", "));
delete SCHEDULE_TEMPLATES["part-week-test"];

print("\n-- a programme that has not started --");
place(LONG, -2); // today is three days before day 1
var early = moveTargetDates(1);
check(early.length > 0, "a member waiting to start is still offered days");
check(early.filter(function (d) { return d < CURRENT_MEMBER.startDate; }).length === 0,
  "none of them is before the programme begins — got " + early.join(", "));
check(early[0] === CURRENT_MEMBER.startDate,
  "the first day on offer is day 1 itself");

print("\n-- a member who did not start on a Monday --");
// Find a start date that is a Wednesday, so programme weeks and Mon-Sun weeks
// cannot coincide. The old code offered Monday-based weeks to everyone.
var back = 0;
while (shiftDays(-back).getDay() !== 3) back++;   // 3 = Wednesday
place(LONG, back + 1);                          // today is day back+1
check(parseDateKey(CURRENT_MEMBER.startDate).getDay() === 3,
  "set up: the member started on a Wednesday");
var wed = moveTargetDates(dayOf(TODAY));
var wedWindow = renderableDates();
check(wed.filter(function (d) { return wedWindow.indexOf(d) === -1; }).length === 0,
  "a Wednesday starter is only offered days out of their own programme weeks");
check(dayOf(wed[wed.length - 1]) === calendarMaxWeek(POS) * 7,
  "the last day on offer is the end of the look-ahead week, not Sunday");

print("\n-- a move can always be undone --");
place(LONG, 25);
// Monday's session (day 22) was moved to Friday (day 26); today is Thursday.
MOVES = [{ id: "m1", type: "moved-workout", day: 22, date: dateKey(dateForProgramDay(26)) }];
var undo = moveTargetDates(22);
check(undo.indexOf(dateKey(dateForProgramDay(22))) !== -1,
  "its own day is on offer even though it is behind us");
check(hasMoveTarget(22) === true, "so the moved workout still has somewhere to go");
check(undo.indexOf(dateKey(dateForProgramDay(26))) !== -1,
  "the day it is currently on is in the list too (the popup disables it)");

print("\n-- nowhere to go means no handle --");
place(SHORT, 10); // the programme finished three days ago
check(POS.finished === true, "set up: the programme is over");
check(hasMoveTarget(3) === false,
  "a missed workout on a finished programme has nowhere to move to");
place(SHORT, 7); // the last day of a 1-week programme
check(moveTargetDates(7).length === 1 && moveTargetDates(7)[0] === TODAY,
  "on the last day, today is the only day left");
check(hasMoveTarget(7) === false,
  "and today is where the workout already is, so the handle has no job");
check(hasMoveTarget(5) === true,
  "a workout missed on day 5 can still be pulled onto today");

print("\n-- what the Calendar actually renders --");
function rowFor(programDay) {
  var template = SCHEDULE_TEMPLATES[CURRENT_MEMBER.programId] || [];
  var date = dateForProgramDay(programDay);
  var key = dateKey(date);
  return renderCalendarDayRow(date, CURRENT_MEMBER, template, key < TODAY, POS.totalDays, POS);
}
function workoutDayIn(weeks) {
  var template = SCHEDULE_TEMPLATES[CURRENT_MEMBER.programId] || [];
  var hit = template.filter(function (it) {
    return it.type === "workout" && weeks.indexOf(Math.ceil(it.day / 7)) !== -1;
  });
  return hit.length ? hit[0].day : null;
}

place(LONG, 25);
var liveDay = workoutDayIn([4]);
check(liveDay !== null, "set up: week 4 has a workout to render");
check(rowFor(liveDay).indexOf("calendar-item-move") !== -1,
  "mid-programme, an outstanding workout keeps its move handle");

place(SHORT, 10);
var deadDay = workoutDayIn([1]);
check(deadDay !== null, "set up: the short programme has a workout to render");
check(rowFor(deadDay).indexOf("calendar-item-move") === -1,
  "on a finished programme the handle is gone rather than opening a dead list");
check(rowFor(deadDay).indexOf("calendar-item-btn") !== -1,
  "the workout itself is still there and still tappable");

place(LONG, 25);
var moveMe = workoutDayIn([4]);
MOVES = [{ id: "m2", type: "moved-workout", day: moveMe, date: dateKey(dateForProgramDay(moveMe + 2)) }];
var origin = rowFor(moveMe);
check(origin.indexOf("Moved to") !== -1, "the day it left says where it went");
check(origin.indexOf('data-move-workout="' + moveMe + '"') !== -1,
  "and keeps a handle, so the workout is findable from its own day");
check(origin.indexOf("calendar-item-wrap is-label") !== -1,
  "that handle gets a row of its own height, not a button hung off one line");
check(rowFor(moveMe + 2).indexOf("Moved from") !== -1,
  "the day it landed on says where it came from");

print("\n-- every day you can pick really does show the workout --");
// The member's question, asked end to end: pick each offered day in turn,
// store the move, and ask the shared scheduledItemsOnDay() what is on that
// date. Anything that comes back empty is a workout gone missing.
place(LONG, 25);
var subject = workoutDayIn([4]);
var template = SCHEDULE_TEMPLATES[LONG];
var tried = 0, lost = [];
moveTargetDates(subject).forEach(function (target) {
  MOVES = [{ id: "m3", type: "moved-workout", day: subject, date: target }];
  if (target === dateKey(dateForProgramDay(subject))) MOVES = [];
  tried++;
  var found = scheduledItemsOnDay(template, dayOf(target), target)
    .items.filter(function (it) { return it.type === "workout"; });
  if (!found.length) lost.push(target);
  if (renderableDates().indexOf(target) === -1) lost.push(target + " (unrenderable)");
});
check(tried >= 8, "the sweep actually moved the workout somewhere " + tried + " times");
check(lost.length === 0,
  "every day on offer shows the workout once it is moved there" +
  (lost.length ? " — lost on " + lost.join(", ") : ""));
MOVES = [];

print("\n" + pass + " passed   " + fail + " failed");
