// A session dated with a number disappeared from the notebook log completely
// (tester T-50).
//
// notebookLog() split history with two string comparisons on the raw stored
// value: `r.date >= cutoff` picked "this week" and `r.date < cutoff` picked
// everything older. A date stored as a NUMBER satisfies neither, so the day
// fell into neither list and was never drawn. The session did not move or
// look odd - it was simply not on the screen, with nothing anywhere saying
// so.
//
// The same comparison put "2026-9-3" among the last seven days, because
// lexically "2026-9-3" > "2026-11-14".
//
// REPRODUCED against the shipped function before the fix, with five
// completions: the numeric one was absent from the rendered page entirely,
// and the unpadded September one was in the recent section.
//
// dateKeyFrom() answers both and was already being used three lines below for
// the month heading - it just was not used for the comparisons. The two
// filters are now complements of one another, so whatever a row's date turns
// out to be, it lands in exactly one of them. That is the property worth
// holding: not "numbers work now", but "nothing can fall between".
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function braceMatch(src, from) {
  var depth = 0;
  for (var i = src.indexOf("{", from); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFrom(src, name, what) {
  var at = src.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from " + what);
  return braceMatch(src, at);
}

eval(liftFrom(DATA, "dateKey", "data.js"));
eval(liftFrom(APP, "dateKeyFrom", "app.js"));
eval(liftFrom(APP, "formatShortDate", "app.js"));
eval(liftFrom(APP, "esc", "app.js"));
eval(liftFrom(APP, "notebookLogRow", "app.js"));
eval(liftFrom(APP, "notebookLog", "app.js"));

// ---------------- the little the log reads around it ----------------
var BAD_DATES = [];
function reportBadDate(where, value) { BAD_DATES.push(where + ":" + String(value)); }
var CHECKIN_SERIES = [];
var CHECKINS = [];
var COMPLETIONS = [];
var notebookOpenMonths = new Set();
function sessionNoteFor() { return ""; }

var TODAY = dateKey(new Date());
var TWO_DAYS_AGO = dateKey(new Date(Date.now() - 2 * 864e5));

function withLog(completions, openMonths) {
  COMPLETIONS = completions;
  notebookOpenMonths = new Set(openMonths || []);
  BAD_DATES = [];
  return notebookLog();
}
function monthHeadings(html) {
  return (html.match(/nb-month-name">([^<]*)</g) || [])
    .map(function (x) { return x.replace(/.*">/, "").replace("<", ""); });
}
function recentPart(html) {
  var cut = html.indexOf("nb-month");
  return cut === -1 ? html : html.slice(0, cut);
}

var ROWS = [
  { id: "a", title: "TodaySession", date: TODAY },
  { id: "b", title: "TwoDaysAgo", date: TWO_DAYS_AGO },
  { id: "c", title: "SeptemberUnpadded", date: "2026-9-3" },
  { id: "d", title: "NumericDate", date: 20260903 },
  { id: "e", title: "ProperSeptember", date: "2026-09-04" },
];
var NAMES = ROWS.map(function (r) { return r.title; });

// ---------------- nothing falls off ----------------
// Months opened, so a row inside one is actually drawn. Collapsed months are
// the design; a row in NO group is the bug.

var open = withLog(ROWS, ["2026-09", ""]);
var missing = NAMES.filter(function (t) { return open.indexOf(t) === -1; });
check(missing.length === 0,
  "every session the member logged is on the page somewhere (missing: "
  + JSON.stringify(missing) + ")");
check(open.indexOf("NumericDate") !== -1,
  "including one dated with a number, which used to vanish outright");

// ---------------- and the week is the week ----------------

var collapsed = withLog(ROWS);
var inRecent = NAMES.filter(function (t) { return recentPart(collapsed).indexOf(t) !== -1; });
check(inRecent.join(",") === "TodaySession,TwoDaysAgo",
  "only the last seven days are in the recent section (got " + inRecent.join(",") + ")");
check(inRecent.indexOf("SeptemberUnpadded") === -1,
  'and "2026-9-3" is not one of them, however it sorts as a string');

var heads = monthHeadings(collapsed);
check(heads.indexOf("September 2026") !== -1,
  "September has its own heading (got " + JSON.stringify(heads) + ")");
var counts = (collapsed.match(/nb-month-count">([^<]*)</g) || [])
  .map(function (x) { return x.replace(/.*">/, "").replace("<", ""); });
check(counts[0] === "2 days",
  "with both September days under it, padded or not (got " + JSON.stringify(counts[0]) + ")");

// ---------------- a date it cannot read says so, rather than hiding a day ----

check(heads.indexOf("Undated") !== -1,
  'an unreadable date gets an "Undated" heading, not "Invalid Date" (got '
  + JSON.stringify(heads) + ")");
check(BAD_DATES.some(function (b) { return b.indexOf("notebookLog:") === 0; }),
  "and is reported, which is what the hunt for where they come from needs (got "
  + JSON.stringify(BAD_DATES) + ")");

// ---------------- the ordinary case is untouched ----------------

var plain = withLog([
  { id: "a", title: "TodaySession", date: TODAY },
  { id: "b", title: "TwoDaysAgo", date: TWO_DAYS_AGO },
]);
check(monthHeadings(plain).length === 0, "a week of ordinary dates has no month headings at all");
check(plain.indexOf("TodaySession") !== -1 && plain.indexOf("TwoDaysAgo") !== -1,
  "and both days are shown");
check(BAD_DATES.length === 0, "with nothing reported");
check(withLog([]).indexOf("Nothing written down yet") !== -1, "an empty log still says so");

// A check-in and a session on the same day are ONE row, even when the two
// were stored in different shapes.
CHECKINS = [{ date: "2026-9-3", note: "" }];
var merged = withLog([{ id: "c", title: "SeptemberUnpadded", date: "2026-09-03" }], ["2026-09"]);
var septCount = (merged.match(/nb-month-count">([^<]*)</g) || [])
  .map(function (x) { return x.replace(/.*">/, "").replace("<", ""); })[0];
check(septCount === "1 day",
  "the same day written two ways is one day, not two (got " + JSON.stringify(septCount) + ")");
CHECKINS = [];

// ---------------- the property, said in the source ----------------

var fn = braceMatch(CODE, CODE.indexOf("function notebookLog("));
check(fn.indexOf("rows.filter((r) => r.key && r.key >= cutoff)") !== -1,
  "the recent list is picked on the normalised key");
check(fn.indexOf("rows.filter((r) => !(r.key && r.key >= cutoff))") !== -1,
  "and the older list is its exact complement, so nothing can fall between");
check(fn.indexOf("r.date >= cutoff") === -1 && fn.indexOf("r.date < cutoff") === -1,
  "neither compares the raw stored value any more");
check(fn.indexOf("reportBadDate(\"notebookLog\"") !== -1,
  "and a date it cannot read is reported rather than swallowed");

print("\n  " + pass + " passed, " + fail + " failed");
