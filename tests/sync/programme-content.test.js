// The content members actually read, checked against the content the app can
// actually find.
//
// T-79: Kelly's only coach note never appeared. It was keyed
// "fit-functional-week-2"; every tester was on the test-week copy of the same
// programme, whose id is "fit-functional-test-week-1792947605130". The lookup
// in renderCalendarWeekNote() is an exact match on `${programId}-week-N`, so a
// key that names a programme nobody is on shows nothing and reports nothing.
// The testers were in week 2 — the week the note is about — when it was filed.
//
// T-78: "BACK/BICPES" was in week 1, and the fold-in that built weeks 2 to 8
// copied it faithfully into all eight.
//
// Both are one-line content faults that no amount of testing the CODE would
// catch, which is why they are checked here against the data instead.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var DATA = readFile("../../data.js");
var APP = readFile("../../app.js");
// data.js is a script of top-level consts; `var` lets it be evaluated twice in
// one runtime without redeclaration errors.
eval(DATA.replace(/^const /gm, "var "));

var PROGRAM_IDS = Object.keys(SCHEDULE_TEMPLATES);
check(PROGRAM_IDS.length > 0, "the programmes are readable (" + PROGRAM_IDS.length + " of them)");

// ---------------- T-79: every note has somewhere to appear ----------------

// A programme id can itself contain "-week-", so the key cannot just be split
// on it — "fit-functional-test-week-1792947605130-week-2" would come apart in
// two places. Match the key against each real programme id instead.
function noteTarget(key) {
  for (var i = 0; i < PROGRAM_IDS.length; i++) {
    var id = PROGRAM_IDS[i];
    var want = id + "-week-";
    if (key.indexOf(want) !== 0) continue;
    var rest = key.slice(want.length);
    if (!/^[0-9]+$/.test(rest)) continue;
    return { programId: id, week: parseInt(rest, 10) };
  }
  return null;
}
// The LAST DAY, not the number of entries — memberProgramPosition() works it
// out this way because a day can hold a workout and a cardio item, and
// counting entries reads an 8-week programme as 10 weeks. Counting them here
// instead would let a note be filed against a week that does not exist.
function weeksIn(programId) {
  var lastDay = SCHEDULE_TEMPLATES[programId].reduce(function (max, it) {
    return Math.max(max, it.day || 0);
  }, 0);
  return Math.ceil(lastDay / 7);
}

var noteKeys = Object.keys(WEEK_NOTES);
check(noteKeys.length > 0, "there is at least one coach note to check");
noteKeys.forEach(function (key) {
  var t = noteTarget(key);
  check(t !== null, "the note \"" + key + "\" names a programme that exists");
  if (!t) return;
  check(t.week >= 1 && t.week <= weeksIn(t.programId),
    "and week " + t.week + " is inside " + t.programId + ", which runs "
    + weeksIn(t.programId) + " weeks");
  check(typeof WEEK_NOTES[key] === "string" && WEEK_NOTES[key].trim() !== "",
    "and it actually says something");
});

// The regression itself: the programme the testers are on has the week 2 note.
var TESTER_PROGRAM = "fit-functional-test-week-1792947605130";
check(PROGRAM_IDS.indexOf(TESTER_PROGRAM) !== -1, "the test-week programme is still there");
check(!!WEEK_NOTES[TESTER_PROGRAM + "-week-2"],
  "and a member on it sees a note in week 2, which is what T-79 was");

// Keyed, not duplicated — the same note written out twice drifts apart.
check(WEEK_NOTES[TESTER_PROGRAM + "-week-2"] === WEEK_NOTES["fit-functional-week-2"],
  "both programmes show the same words, from one string");

// And the lookup this all depends on is still an exact match on that key, so
// the check above is checking the right thing.
var lookup = APP.match(/WEEK_NOTES\[`([^`]+)`\]/);
check(lookup !== null && lookup[1] === "${m.programId}-week-${weekNumber}",
  "the app still looks notes up by programme id and week number (found "
  + (lookup ? lookup[1] : "nothing") + ")");

// ---------------- T-78: what the member reads on the card ----------------

var titles = CIRCUITS.map(function (c) { return c.title || ""; });
check(titles.filter(function (t) { return /BICPES/i.test(t); }).length === 0,
  "no workout is called BACK/BICPES any more");
// Exactly this title, not anything containing the word: the seed data has
// "Week 1 Back and Biceps" and friends, which are different workouts.
var biceps = titles.filter(function (t) { return t === "BACK/BICEPS"; });
check(biceps.length === 8, "all eight weeks say BACK/BICEPS (got " + biceps.length + ")");

// The ids keep the misspelling on purpose: the schedule points at them and
// completions are already stored against them, so renaming an id would orphan
// a member's history. This check is here so that stays a decision rather than
// something half-done later.
var spelledIds = CIRCUITS.filter(function (c) { return /back-bicpes-/.test(c.id || ""); });
check(spelledIds.length === 8,
  "and their ids are left exactly as they were, because history points at them (got "
  + spelledIds.length + ")");

// Every workout the schedule asks for must exist, which is the thing a
// half-finished rename would break.
// Resolved the way workoutsForSlot() resolves it, not by id alone: a
// scheduled id is usually a SLOT, with a home and a gym variant hanging off
// it, and only falls back to a direct id match when no variant claims it.
// Checking ids alone reports every Fit & Functional day as missing.
var missing = [];
PROGRAM_IDS.forEach(function (id) {
  SCHEDULE_TEMPLATES[id].forEach(function (slot) {
    if (slot.type !== "workout" || !slot.workoutId) return;
    var resolves = CIRCUITS.some(function (c) { return c.slotId === slot.workoutId; })
      || CIRCUITS.some(function (c) { return c.id === slot.workoutId; });
    if (!resolves) missing.push(id + " day " + slot.day + " -> " + slot.workoutId);
  });
});
check(missing.length === 0,
  "every scheduled day still points at a workout that exists"
  + (missing.length ? " (missing: " + missing.slice(0, 3).join(", ") + ")" : ""));

// A title the member reads should not be empty either.
var untitled = CIRCUITS.filter(function (c) { return !c.title || !String(c.title).trim(); });
check(untitled.length === 0, "every workout has a title (" + untitled.length + " without)");

print(pass + " passed, " + fail + " failed");
