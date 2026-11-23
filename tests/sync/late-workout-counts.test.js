// A workout done on the wrong day counted for nothing (tester T-70).
//
// The programme asked whether each scheduled workout had been completed ON
// its own date. A member who did Monday's session on Tuesday got no tick, no
// "Done This Week" and no progress — the app did not notice they had trained.
// The same was true of a workout the member MOVED with the app's own handle:
// the move changed where the card sat and nothing else.
//
// Lifted out of the real app.js, with the schedule's two neighbours stubbed.
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
eval(lift("dateKeyFrom"));   // parseDateKey leans on it
eval(lift("parseDateKey"));
eval(lift("scheduleCompletionMap"));
// dateKey lives in data.js, not app.js — lifted from there rather than
// reimplemented, so a change to how this app writes a date key fails here.
var DATA = readFile("../../data.js");
function sliceFn(src, name) {
  var start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone");
  var depth = 0;
  for (var i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
// Eval at the top level, not inside a helper: a function declaration eval'd
// inside another function stays in that function's scope.
eval(sliceFn(DATA, "dateKey"));

// Stubs for the two things the map asks the rest of the app.
var MOVES = {};
function moveForProgramDay(day) { return MOVES[day] || null; }
function workoutsForSlot(slotId) { return [{ id: slotId + "-home" }, { id: slotId + "-gym" }]; }

var COMPLETIONS = [];
var START = "2026-11-16";               // a Monday, which is how weeks start here
// Day 1 Mon, day 2 Tue, ... day 7 Sun; day 8 is the next Monday.
var DATES = { 1: "2026-11-16", 2: "2026-11-17", 3: "2026-11-18", 4: "2026-11-19",
              5: "2026-11-20", 6: "2026-11-21", 7: "2026-11-22", 8: "2026-11-23", 9: "2026-11-24" };
var template = [
  { type: "workout", day: 1, workoutId: "shoulders-abs" },
  { type: "workout", day: 3, workoutId: "chest-tris" },
  { type: "rest", day: 2 },
  { type: "workout", day: 8, workoutId: "shoulders-abs" },   // same slot, next week
];
function done(list) { COMPLETIONS = list; return scheduleCompletionMap(template, START); }
function comp(id, workoutId, date) { return { id: id, workoutId: workoutId, date: date }; }

// ---------------- the finding ----------------

var m = done([comp("c1", "shoulders-abs-home", DATES[7])]);   // Monday's session, done Sunday
check(m.has(1), "Monday's workout done on Sunday counts for Monday");
check(m.has(1) && m.get(1).id === "c1", "and it is that session that counts");

m = done([comp("c1", "shoulders-abs-home", DATES[1])]);
check(m.has(1), "done on the day still counts, which is the case that used to work");

m = done([comp("c1", "shoulders-abs-gym", DATES[2])]);
check(m.has(1), "either variant counts — a combo member who did the gym version is done");

// ---------------- the week is the window ----------------

m = done([comp("c1", "shoulders-abs-home", DATES[9])]);   // the following Tuesday
check(!m.has(1), "a session done the NEXT week does not count for last week's day");
// It is not lost, though — the same workout comes round again on day 8, and
// Tuesday the 24th is inside THAT week. So a missed Monday done eight days
// later ticks the new week's Monday, not the one that was missed. Which is
// the right way round: the week the member is being shown stays truthful.
check(m.has(8), "it counts for the next week's slot of the same workout, whose week it falls in");
check(m.has(8) && m.get(8).id === "c1", "and that is the session that ticks it");

m = done([comp("c1", "shoulders-abs-home", DATES[8])]);
check(m.has(8), "a session done on the next Monday counts for the next Monday's slot");
check(!m.has(1), "and leaves the week before it alone");

// ---------------- a workout the member moved ----------------

MOVES = { 1: { day: 1, date: DATES[9] } };                // moved to the following Tuesday
m = done([comp("c1", "shoulders-abs-home", DATES[9])]);
check(m.has(1), "a workout moved with the app's own handle counts on the day it was moved to");
m = done([comp("c1", "shoulders-abs-home", DATES[1])]);
check(m.has(1), "and doing it on its original date still counts");
MOVES = {};

// ---------------- one session, one day ----------------

m = done([comp("c1", "shoulders-abs-home", DATES[1])]);
check(m.has(1) && !m.has(8), "one session cannot tick the same slot in two different weeks");

m = done([comp("c1", "shoulders-abs-home", DATES[1]), comp("c2", "shoulders-abs-home", DATES[8])]);
check(m.has(1) && m.has(8), "two sessions of the same workout tick both of its scheduled days");
check(m.has(1) && m.has(8) && m.get(1).id === "c1" && m.get(8).id === "c2",
  "each on the day it was actually done");

// Both on day 1's date: the exact match takes day 1, the leftover fills day 3
// only if it matches that slot — it does not, so day 3 stays open.
m = done([comp("c1", "shoulders-abs-home", DATES[1]), comp("c2", "shoulders-abs-home", DATES[1])]);
check(m.has(1) && !m.has(3), "a second session of the same workout does not tick a different workout's day");

// ---------------- the day it was done wins over the day beside it ----------------
var twoInAWeek = [
  { type: "workout", day: 1, workoutId: "shoulders-abs" },
  { type: "workout", day: 2, workoutId: "shoulders-abs" },
];
COMPLETIONS = [comp("c1", "shoulders-abs-home", DATES[2])];
var m2 = scheduleCompletionMap(twoInAWeek, START);
check(m2.has(2) && !m2.has(1),
  "a session done on Tuesday ticks Tuesday's slot, not Monday's, when both are the same workout");

COMPLETIONS = [comp("c1", "shoulders-abs-home", DATES[2]), comp("c2", "shoulders-abs-home", DATES[2])];
m2 = scheduleCompletionMap(twoInAWeek, START);
check(m2.has(1) && m2.has(2), "two sessions on one day fill both slots for that workout");

// ---------------- nothing to count ----------------

check(done([]).size === 0, "no sessions, no ticks");
check(done([comp("c1", "something-else", DATES[1])]).size === 0, "a different workout does not tick anything");
check(scheduleCompletionMap(template, null).size === 0, "a member with no start date gets an empty answer");
check(scheduleCompletionMap([], START).size === 0, "and so does an empty schedule");
check(scheduleCompletionMap([{ type: "rest", day: 1 }], START).size === 0, "a week of rest days has nothing to tick");

print("\n  " + pass + " passed, " + fail + " failed");
