// One weight of 12345 stopped every weight that member ever logged from
// reaching the server, in silence, for good (tester T-59).
//
// `lifts.weight` is numeric(6,2), PostgREST fails the WHOLE STATEMENT on one
// unacceptable row, and the push carries the member's entire history — so one
// bad number meant no weight from any workout, past or future, ever landed
// again, retried every 30 seconds for ever, while the finish screen said
// "Nice work!". This drives the real pushRows against a server that enforces
// the column the way Postgres does.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }
async function settle() { for (var i = 0; i < 80; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }

// ---------------- a server that behaves like the real column ----------------
// Statement-level, which is the whole point: one row over the limit and
// NOTHING in that statement is written.
var UPSERTS = 0;          // how many requests the push cost
var TOASTS = [];
var FAIL_MODE = "column"; // or "transport"
function showToast(msg) { TOASTS.push(msg); }

var realUpsert = Q.prototype.upsert;
Q.prototype.upsert = function (rows, opt) {
  UPSERTS++;
  var list = Array.isArray(rows) ? rows : [rows];
  if (FAIL_MODE === "transport") {
    return Promise.resolve({ error: { message: "Failed to fetch" } });
  }
  var bad = list.filter(function (r) { return r.weight != null && Number(r.weight) > 9999.99; });
  if (bad.length) {
    return Promise.resolve({ error: { code: "22003", message: "numeric field overflow" } });
  }
  return realUpsert.call(this, rows, opt);
};

function serverLifts() { return tbl("lifts"); }
function liftFor(name) { return serverLifts().filter(function (r) { return r.exercise_name === name; }); }

// A finished workout as the player writes it: six sets of one exercise, one
// of them mistyped the way T-60 produces.
function workout(id, date, weights) {
  var setWeights = {};
  weights.forEach(function (w, i) { setWeights["0|Cable Row|Set " + (i + 1)] = w; });
  return { id: id, title: "Pull Day", category: "structured", date: date,
           minutes: 30, rpe: 7, setWeights: setWeights };
}
function saveCompletions(list) {
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(list));
}

(async function () {
  onDevice("phone");

  // ---------------- the finding, start to finish ----------------
  var first = workout("local-1", "2026-11-21", [80, 80, 12345, 80, 80, 80]);
  saveCompletions([first]);
  UPSERTS = 0;
  queueSync("completions"); await settle();

  check(tbl("completions").length === 1, "the workout itself still reaches the server");
  check(serverLifts().length === 5,
    "the five good weights land even though one is impossible (was 0 of 6)");
  check(liftFor("Cable Row").every(function (r) { return Number(r.weight) < 9999.99; }),
    "the impossible one is not among them");

  // The state that used to jam for ever.
  check(!loadDirty().has("completions"), "the store goes clean instead of staying dirty for ever");
  check(SYNC_STATE.queue.size === 0, "nothing is left queued to retry every 30 seconds");
  check(SYNC_STATE.online === true, "the phone is not declared offline over a row the server read fine");

  // And the member is told, in words, once.
  var said = (SYNC_STATE.errors.lifts || {}).message || "";
  print("  told: " + said);
  check(said.indexOf("Cable Row") !== -1 && said.indexOf("12345") !== -1,
    "the message names the exercise and the number");
  check(said.toLowerCase().indexOf("everything else") !== -1,
    "and says the rest did back up, which is the part that was a lie before");
  check(TOASTS.length === 1, "the member is told once, not once per retry");

  // ---------------- the half that made it permanent ----------------
  var second = workout("local-2", "2026-11-22", [100, 95, 95, 90, 90, 85]);
  saveCompletions([first, second]);
  var before = serverLifts().length;
  queueSync("completions"); await settle();
  check(serverLifts().length === before + 6,
    "a later, entirely clean workout backs up normally (it never did before)");
  check(TOASTS.length === 1, "and the member is not told a second time about the same row");

  // The refused row is not sent again on every push.
  var sentAgain = false;
  var probe = Q.prototype.upsert;
  Q.prototype.upsert = function (rows, opt) {
    var list = Array.isArray(rows) ? rows : [rows];
    if (list.some(function (r) { return Number(r.weight) === 12345; })) sentAgain = true;
    return probe.call(this, rows, opt);
  };
  saveCompletions([first, second]);
  queueSync("completions"); await settle();
  check(sentAgain === false, "the row the server refused is not offered again");
  Q.prototype.upsert = probe;

  // ---------------- splitting is bounded, not row by row ----------------
  SERVER.lifts = []; REFUSED_ROWS.lifts = null;
  saveCompletions([workout("local-3", "2026-11-23", [60, 61, 12345, 63, 64, 65])]);
  UPSERTS = 0;
  queueSync("completions"); await settle();
  check(serverLifts().length === 5, "five of the six land when the bad one is in the middle");
  check(UPSERTS >= 3, "the batch really was split rather than quietly skipped (" + UPSERTS + ")");
  check(UPSERTS <= 8, "finding the bad row in six costs a handful of requests, not one each (" + UPSERTS + ")");

  // ---------------- more than one bad row ----------------
  // The cliff: MAX_SET_ASIDE_PER_PUSH was 5, so six impossible weights put
  // the member straight back in the T-59 state, and silently, because the
  // toast was only ever sent on the path that did not abort (tester T-67).
  // This file stopped at one bad row, which is why nothing caught it.

  async function withBadRows(n, id) {
    SERVER.lifts = []; REFUSED_ROWS.lifts = null; TOASTS = [];
    var weights = [];
    for (var i = 0; i < 24; i++) weights.push(i < n ? 12345 + i : 60 + i);
    saveCompletions([workout(id, "2026-11-22", weights)]);
    SYNC_STATE.queue.clear();
    clearDirty("completions");
    var ok = await pushStore("completions");
    return { ok: ok, landed: serverLifts().length, setAside: (REFUSED_ROWS.lifts || { size: 0 }).size, toasts: TOASTS.length };
  }

  var six = await withBadRows(6, "local-6");
  print("  six bad of 24: " + JSON.stringify(six));
  check(six.landed === 18, "six impossible weights: the other eighteen still land");
  check(six.setAside === 6, "all six are set aside, not abandoned at the fifth");
  check(six.ok === true, "and the store goes clean instead of retrying for ever");
  check(six.toasts === 1, "the member is told once");

  var twenty = await withBadRows(20, "local-20");
  print("  twenty bad of 24: " + JSON.stringify(twenty));
  check(twenty.landed === 4, "twenty bad rows: the four good ones still land");
  check(twenty.setAside === 20, "and twenty is still inside the limit");
  check(twenty.ok === true, "store clean");

  // ---------------- a batch that is wrong all the way through ----------------
  // Past the limit it is not one bad row any more, it is the statement being
  // wrong — which a later attempt may well clear. So it stops, keeps nothing
  // aside, stays dirty, AND says so. The silence was the T-67 half.

  var all = await withBadRows(24, "local-24");
  print("  everything bad: " + JSON.stringify(all));
  check(all.ok === false, "a batch refused row after row fails rather than being set aside piece by piece");
  check(all.setAside === 0, "and nothing is left on the do-not-send list from that attempt");
  check(all.toasts === 1, "the member is told once — not eight times, and not never");
  check(TOASTS.length === 1 && /can't be backed up/i.test(TOASTS[0]),
    "and what they are told says some of it could not be backed up");
  check(/everything else/i.test(TOASTS[0]), "while making clear the rest did land");
  SERVER.lifts = []; REFUSED_ROWS.lifts = null; TOASTS = [];

  // ---------------- a failure that WILL come back is still retried ----------------
  SERVER.lifts = []; REFUSED_ROWS.lifts = null;
  FAIL_MODE = "transport";
  saveCompletions([workout("local-4", "2026-11-24", [70, 70, 70])]);
  UPSERTS = 0;
  SYNC_STATE.queue.clear();
  var ok = await pushStore("completions");
  check(ok === false, "a connection failure still fails, so it is tried again later");
  check(UPSERTS <= 2, "and is not split up chasing a bad row that does not exist (" + UPSERTS + ")");
  FAIL_MODE = "column";

  // ---------------- the classifier itself ----------------
  check(isRowRefusal({ code: "22003", message: "numeric field overflow" }) === true, "overflow is a refusal");
  check(isRowRefusal({ code: "23502", message: "null value in column" }) === true, "a not-null violation is a refusal");
  check(isRowRefusal({ code: "22P02", message: "invalid input syntax for type numeric" }) === true,
    "bad syntax for a type is a refusal");
  check(isRowRefusal({ message: "value out of range" }) === true, "wording alone is enough when there is no code");
  check(isRowRefusal({ message: "Failed to fetch" }) === false, "a dead connection is not a refusal");
  check(isRowRefusal({ code: "42501", message: "new row violates row-level security policy" }) === false,
    "an RLS rejection is NOT a refusal: a policy can be fixed, and every row would fail it");
  check(isRowRefusal({ message: "new row violates row-level security policy for table \"lifts\"" }) === false,
    "and is recognised by its wording too, with no code");
  check(isRowRefusal({ message: "new row for relation \"lifts\" violates check constraint \"weight_positive\"" }) === true,
    "a check constraint is a refusal");
  check(isRowRefusal({ code: "PGRST301", message: "JWT expired" }) === false, "an expired token is not a refusal");
  check(isRowRefusal(null) === false, "no error is not a refusal");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
