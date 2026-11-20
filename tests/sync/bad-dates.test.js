// One unreadable date must not stop the app opening (T-15).
//
// Six testers got their password right and the app still would not open. The
// two auth_events rows that carried a detail both read `key.split is not a
// function` — which is what formatShortDate() throws when it is handed a
// number, a Date, an object or a boolean instead of "YYYY-MM-DD". It threw
// during render, render is inside enterAsAuthedMember(), and a throw there
// leaves a signed-in member on the login form. One bad date, no way in, every
// time.
//
// null and undefined produce a DIFFERENT message ("Cannot read properties of
// null"), so the value in those members' data was none of those — it was a
// number, a Date, an object or a boolean. Nobody has found what wrote it; the
// server cannot (every date column is `date`-typed), and no write path still
// in the code does. So the rule is now: a date this app cannot read is a date
// it SHOWS badly, never a date that stops it opening.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

var APP = readFile("../../app.js");
var DATA = readFile("../../data.js");
function lift(src, name) {
  var start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone");
  var depth = 0;
  for (var i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
eval(lift(DATA, "dateKey"));
eval(lift(APP, "dateKeyFrom"));
// formatShortDate reports through logAuthEvent; capture instead of sending.
var REPORTED = [];
function logAuthEvent(e, d) { REPORTED.push(d); }
var console = { warn: function () {} };
var BAD_DATE_REPORTED = false;
eval(lift(APP, "reportBadDate"));
eval(lift(APP, "formatShortDate"));

// ---- the shapes that threw ----
var killers = [12345, 1762300800000, new Date(2026, 10, 4), {}, [], true, false, "not-a-date", "", NaN, null, undefined];
var threw = [];
killers.forEach(function (v) {
  try { formatShortDate(v); } catch (e) { threw.push(String(v) + ": " + e.message); }
});
check(threw.length === 0, "NOTHING makes formatShortDate throw (" + threw.join("; ") + ")");

// ---- real dates still read correctly ----
check(formatShortDate("2026-11-04") === "Nov 4", "a plain date key is unchanged");
check(formatShortDate("2026-11-04T09:30:00.000Z") === "Nov 4", "an ISO timestamp reads as its date");
check(formatShortDate("2026-01-01") === "Jan 1", "and so does a new year's day");

// ---- junk reads blank, not wrong ----
check(formatShortDate({}) === "", "an object shows nothing");
check(formatShortDate("not-a-date") === "", "so does a string that isn't a date");
check(formatShortDate(null) === "" && formatShortDate(undefined) === "", "so do null and undefined");

// A quiet wrong answer is worse than a blank one. 12345 is a number, not a
// date, and showing it as 31 Dec 1969 would hide the very thing we are hunting.
check(formatShortDate(12345) === "", "a number too small to be a date shows nothing, NOT 1969");
check(formatShortDate(1762300800) === "", "epoch SECONDS are rejected too (they land in 1970)");
check(formatShortDate(1762300800000) === "Nov 4", "epoch milliseconds in a plausible year are read");

// ---- and it must tell us ----
BAD_DATE_REPORTED = false; REPORTED = [];
formatShortDate(12345);
check(REPORTED.length === 1 && /number: 12345/.test(REPORTED[0]),
  "an unreadable date names its type and value, so the next one is findable");
BAD_DATE_REPORTED = false; REPORTED = [];
formatShortDate(new Date(2026, 10, 4));
check(REPORTED.length === 1, "a Date is reported even though it renders fine — no call site should pass one");
BAD_DATE_REPORTED = false; REPORTED = [];
formatShortDate("2026-11-04"); formatShortDate("2026-11-05");
check(REPORTED.length === 0, "ordinary dates say nothing");

// ---- the normaliser itself ----
check(dateKeyFrom("2026-11-04") === "2026-11-04", "a date key passes through");
check(dateKeyFrom("2026-11-04T09:30:00Z") === "2026-11-04", "a timestamp is trimmed to its date");
check(dateKeyFrom(12345) === null && dateKeyFrom({}) === null && dateKeyFrom(null) === null,
  "junk normalises to null rather than to a plausible-looking lie");
