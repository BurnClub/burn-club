// An interrupted workout was STILL written into the member's history as
// "1 min" (tester T-62) — the exact symptom T-54's fix claimed to have
// cured, surviving in the shape the finding was actually about.
//
// T-54 measured the leftover work in PHASES. That works for an interval
// circuit, where a phase is a station. It does nothing for straight sets or
// a ladder: `pushSetPhases()` emits ONE phase holding the whole six-set
// checklist, so a member who did five of six sets still has index 0, a
// fraction of 0, and the one-minute floor. The record has always carried the
// two timestamps that answer this directly.
//
// The REAL logPartialCompletion, with a stubbed logCompletion, so a change to
// the shipped formula fails here.
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
var LOGGED = null;
// The minutes arrive as an argument now rather than smuggled through a
// fabricated `meta` string (2026-11-23, with T-73). Same contract as the real
// logCompletion: opts.minutes when the caller knows the time, otherwise the
// workout's own label.
function logCompletion(circuit, sessionWeights, setWeights, opts) {
  var given = opts ? Number(opts.minutes) : NaN;
  var minutes = isFinite(given) && given >= 0 ? Math.max(1, Math.round(given))
    : (parseInt(circuit.meta, 10) || 20);
  LOGGED = { minutes: minutes, meta: minutes + " min", title: circuit.title,
             sessionWeights: sessionWeights, setWeights: setWeights };
  return LOGGED;
}
eval(lift("partialMinutesOnTheClock"));
eval(lift("logPartialCompletion"));

var MIN = 60000;
// A 30-minute workout of three straight-sets blocks: three phases in all,
// one per block, each holding its own six-set checklist.
var circuit = { id: "x", title: "Pull Day", meta: "30 min", blocks: [1, 2, 3] };
var phases = [{ blockIndex: 0, kind: "sets" }, { blockIndex: 1, kind: "sets" }, { blockIndex: 2, kind: "sets" }];

function minutesOf(rec, blocksDone, phaseList) {
  LOGGED = null;
  logPartialCompletion(circuit, rec, blocksDone, phaseList === undefined ? phases : phaseList);
  return LOGGED.minutes;
}
function worked(mins, extra) {
  var rec = { index: 0, setsChecked: [true, true, true, true, true, false],
              startedAt: 1700000000000, lastSeenAt: 1700000000000 + mins * MIN };
  Object.keys(extra || {}).forEach(function (k) { rec[k] = extra[k]; });
  return rec;
}

// ---------------- the finding ----------------

var mins = minutesOf(worked(26), 0);
print("  five of six sets, 26 minutes in the player -> " + mins + " min");
check(mins !== 1, "five of six sets of the first block is no longer logged as '1 min'");
check(mins === 26, "it is logged as the 26 minutes they were actually in the workout");

check(minutesOf(worked(4), 0) === 4, "four minutes in logs as four minutes");
check(minutesOf(worked(12), 0) === 12, "twelve as twelve");
check(minutesOf(worked(7.6), 0) === 8, "part minutes round to the nearest, not down");

// ---------------- what the clock must not be allowed to claim ----------------

check(minutesOf(worked(90), 0) === 30,
  "a phone left on the weights screen all afternoon cannot log more than the workout's own length");
check(minutesOf(worked(0.4), 0) === 1, "under a minute still floors at one, not zero");

// ---------------- when there is no clock to ask ----------------
// Records written before the timestamps existed, and clocks that ran
// backwards. The phase fraction stays the fallback, unchanged.

check(minutesOf({ index: 0 }, 0) === 1,
  "no timestamps and no phases behind them falls back to the floor");
check(minutesOf({ index: 1, startedAt: 0, lastSeenAt: 0 }, 0) === 10,
  "a record with no usable clock still counts phases: one of three of 30 minutes");
check(minutesOf({ index: 1, startedAt: 1700000000000 }, 0) === 10, "lastSeenAt missing falls back too");
check(minutesOf({ index: 1, startedAt: 0, lastSeenAt: 1700000000000 }, 0) === 10,
  "a stored start of 0 is not read as 1970, which would claim the whole workout");
check(minutesOf({ index: 1, lastSeenAt: 1700000000000 }, 0) === 10, "and so does startedAt missing");
check(minutesOf({ index: 1, startedAt: 1700000000000, lastSeenAt: 1699999000000 }, 0) === 10,
  "a clock that ran backwards is refused rather than producing a negative");
check(minutesOf({ index: 1, startedAt: "x", lastSeenAt: "y" }, 0) === 10, "and so is nonsense");
check(minutesOf(worked(26), 0, null) === 26,
  "with a clock, a missing phase queue no longer matters at all");

// ---------------- a whole block done is unchanged ----------------
// Blocks stay the unit once one is finished. That decision is not this fix.

check(minutesOf(worked(26, { index: 1 }), 1) === 10,
  "one block of three still logs as a third of the workout, clock or no clock");
check(minutesOf(worked(26, { index: 2 }), 2) === 20, "two of three still logs as two thirds");

// ---------------- the reader on its own ----------------

check(partialMinutesOnTheClock({ startedAt: 1000, lastSeenAt: 1000 + 7 * MIN }, 30) === 7, "seven minutes reads as seven");
check(partialMinutesOnTheClock({ startedAt: 1000, lastSeenAt: 1000 + 70 * MIN }, 30) === 30, "and is capped at the workout");
check(partialMinutesOnTheClock({ startedAt: 1000, lastSeenAt: 1000 }, 30) === null, "no time at all is no answer");
check(partialMinutesOnTheClock({}, 30) === null, "an empty record is no answer");
check(partialMinutesOnTheClock(null, 30) === null, "and nor is no record");
check(partialMinutesOnTheClock({ startedAt: -5, lastSeenAt: 100 }, 30) === null, "a start before the epoch is refused");
check(partialMinutesOnTheClock({ startedAt: 1000, lastSeenAt: 1000 + 20000 }, 30) === null,
  "twenty seconds rounds to nothing, so the caller decides the floor");

// ---------------- what T-54 put there stays there ----------------

LOGGED = null;
logPartialCompletion(circuit, worked(26, { setWeights: { "0|Row|Set 1": 47 }, sessionWeights: { row: 47 } }), 0, phases);
check(LOGGED.setWeights["0|Row|Set 1"] === 47, "the per-set weights are still carried into the partial");
check(LOGGED.sessionWeights.row === 47, "and the session weights");
check(/\(partial\)/.test(LOGGED.title), "it is still recorded as a partial, not as a finished workout");
LOGGED = null;
logPartialCompletion(circuit, worked(26), 0, phases);
check(LOGGED.setWeights && typeof LOGGED.setWeights === "object",
  "a record with no weights still logs an empty object rather than undefined");

// ---------------- a workout with no stated length ----------------
var noMeta = { id: "y", title: "Odd One", meta: "", blocks: [1, 2] };
LOGGED = null;
logPartialCompletion(noMeta, worked(45), 0, phases);
check(LOGGED.minutes === 20, "a workout with no stated length falls back to the same 20 the old code used");

print("\n  " + pass + " passed, " + fail + " failed");
