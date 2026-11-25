// The diagnostics panel said nothing had failed while nothing was getting
// through (tester T-87).
//
// T-84 made a refused request name itself. But the failure this app actually
// suffers from is the one where the server never answers at all — gym wifi
// behind a sign-in page, one bar of signal. `noteFailedRequest()` was only
// reached from the branch that has a RESPONSE, so a member stuck on the login
// screen read:
//
//     Failed requests: none since this page opened
//     Server reachable: NO — no answer after 5s
//
// The panel's most useful line was blank in exactly the situation it was
// written for, and so was the console.
//
// These checks drive the real `timedFetch()` against a fetch that hangs,
// rejects, or is cancelled, with the 12-second timer under the test's control.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var SRC = readFile("../../supabase-client.js");
function liftFn(name) {
  var at = SRC.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from supabase-client.js");
  var depth = 0;
  for (var i = SRC.indexOf("{", at); i < SRC.length; i++) {
    if (SRC[i] === "{") depth++;
    else if (SRC[i] === "}") { depth--; if (depth === 0) return SRC.slice(at, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}

var location = { href: "https://x.supabase.co/" };
// jsc has no URL, and describeRequestUrl falls back to a plain split without
// one — which drops the query entirely. The shim is here so these checks see
// the path a browser actually takes; failed-request-log.test.js covers the
// fallback on its own.
if (typeof URL === "undefined") {
  URL = function (href) {
    var m = String(href).match(/^[a-z]+:\/\/[^/]+(\/[^?#]*)?(?:\?([^#]*))?/i);
    if (!m) throw new TypeError("not a URL");
    this.pathname = m[1] || "/";
    var pairs = (m[2] || "").split("&").filter(Boolean)
      .map(function (kv) { return kv.split("=")[0]; });
    this.searchParams = { forEach: function (fn) { pairs.forEach(function (k) { fn("", k); }); } };
  };
}
var WARNINGS = [];
var console = { warn: function () { WARNINGS.push(Array.prototype.join.call(arguments, " ")); } };
var FAILED_REQUESTS = [];
eval(SRC.match(/const MAX_REMEMBERED_FAILURES = \d+;/)[0].replace("const", "var"));
eval(SRC.match(/const REQUEST_TIMEOUT_MS = \d+;/)[0].replace("const", "var"));
eval(SRC.match(/const UPLOAD_TIMEOUT_MS = \d+;/)[0].replace("const", "var"));

// mock-supabase.js stubs setTimeout to a no-op. The whole point here is a
// timer the test can fire on command, so it gets a real queue.
var TIMERS = {};
var nextTimer = 1;
setTimeout = function (fn) { TIMERS[nextTimer] = fn; return nextTimer++; };
clearTimeout = function (id) { delete TIMERS[id]; };
function fireTimers() {
  var q = TIMERS; TIMERS = {};
  Object.keys(q).forEach(function (k) { q[k](); });
}
function timersPending() { return Object.keys(TIMERS).length; }

// The smallest AbortController that can show the behaviour: abort() flips
// `aborted` and tells whoever is listening, which is how the fake fetch below
// learns to reject.
function FakeSignal() { this.aborted = false; this._l = []; }
FakeSignal.prototype.addEventListener = function (t, fn) { if (t === "abort") this._l.push(fn); };
function FakeController() { this.signal = new FakeSignal(); }
FakeController.prototype.abort = function () {
  if (this.signal.aborted) return;
  this.signal.aborted = true;
  this.signal._l.forEach(function (fn) { fn(); });
};
AbortController = FakeController;

// A fetch that never answers: the promise settles only if the request is
// aborted, which is what a connection behind a sign-in page looks like.
function hangingFetch(input, init) {
  return new Promise(function (_, reject) {
    init.signal.addEventListener("abort", function () {
      var e = new Error("Fetch is aborted");
      e.name = "AbortError";
      reject(e);
    });
  });
}
function rejectingFetch(message) {
  return function () { return Promise.reject(new TypeError(message)); };
}
function respondingFetch(status, body) {
  return function () {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status: status,
      clone: function () { return { text: function () { return Promise.resolve(body); } }; },
    });
  };
}

eval(liftFn("describeRequestUrl"));
eval(liftFn("describeRequestStatus"));
eval(liftFn("noteFailedRequest"));
eval(liftFn("refusedRequestsSummary"));
var IN_FLIGHT = new Set();
eval(liftFn("pendingRequestsSummary"));
eval(liftFn("timedFetch"));

var URL_REST = "https://x.supabase.co/rest/v1/completions?select=*&member_id=eq.abc";
var URL_UPLOAD = "https://x.supabase.co/storage/v1/object/photos/abc.jpg";

function reset() { FAILED_REQUESTS.length = 0; WARNINGS.length = 0; TIMERS = {}; IN_FLIGHT.clear(); }

// Every case ends the same way: the caller must still see the error it would
// have seen, so each one records what came back out.
function run(fn) {
  var out = { settled: false, error: null, value: null };
  fn().then(
    function (v) { out.settled = true; out.value = v; },
    function (e) { out.settled = true; out.error = e; }
  );
  return out;
}

// Promises settle in microtasks, and jsc only runs those when the current job
// yields — so every case awaits rather than hoping.
async function flush() { for (var n = 0; n < 30; n++) await Promise.resolve(); }

(async function () {
  try {
    print("\n-- the server never answers --");
    reset();
    fetch = hangingFetch;
    var hung = run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    check(FAILED_REQUESTS.length === 0, "nothing is recorded while the request is still in flight");
    check(timersPending() === 1, "set up: the 12-second timer is armed");
    fireTimers();                                  // the 12 seconds elapse
    await flush();
    check(FAILED_REQUESTS.length === 1, "once it times out, it is recorded (got " + FAILED_REQUESTS.length + ")");
    var e1 = FAILED_REQUESTS[0];
    check(e1.status === 0, "with no status, because there was no answer (got " + e1.status + ")");
    check(e1.where === "/rest/v1/completions?select&member_id",
      "naming the request that hung (got " + e1.where + ")");
    check(e1.where.indexOf("abc") === -1, "without the filter values, same as everywhere else");
    check(e1.detail === "no answer after 12s", "and saying how long it waited (got " + e1.detail + ")");
    check(WARNINGS.length === 1 && WARNINGS[0].indexOf("no answer") !== -1,
      "the console says no answer, not HTTP 0 (got " + JSON.stringify(WARNINGS) + ")");
    check(hung.settled && hung.error instanceof TypeError,
      "and the caller still gets the TypeError the rest of the app recognises as offline");
    check(String(hung.error.message).indexOf("no answer after 12s") !== -1,
      "worded the same way (got " + (hung.error && hung.error.message) + ")");

    print("\n-- the line the member reads --");
    // Said directly, because every other check here would also pass on the
    // detail text: "HTTP 0" is not a thing that happened to anybody, and the
    // one sentence a stuck member needs is "no answer".
    check(describeRequestStatus(0) === "no answer",
      "no status reads as 'no answer' (got " + describeRequestStatus(0) + ")");
    check(describeRequestStatus(400) === "HTTP 400",
      "a real status still reads as itself (got " + describeRequestStatus(400) + ")");
    var summary = refusedRequestsSummary();
    check(summary.indexOf("HTTP 0") === -1, "and HTTP 0 appears nowhere (got " + summary + ")");
    check(summary.indexOf("no answer GET") === 0,
      "so the line opens with what happened (got " + summary + ")");
    check(summary.indexOf("none since this page opened") === -1,
      "the panel no longer says nothing failed (got " + summary + ")");
    check(summary.indexOf("no answer") !== -1 && summary.indexOf("/rest/v1/completions") !== -1,
      "it names what never answered (got " + summary + ")");
    check(summary.indexOf("12s") !== -1, "and how long it waited");

    print("\n-- stuck is not the same as failed, and must not read as fine --");
    // The tester's screenshot is four seconds into being stuck, not twelve:
    // nothing has timed out yet, so nothing has failed yet. Without this line
    // the panel would still say "Failed requests: none" above "Server
    // reachable: NO" — the whole complaint, with the timeout fix in place.
    reset();
    fetch = hangingFetch;
    run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    run(function () { return timedFetch("https://x.supabase.co/rest/v1/lifts", { method: "POST" }); });
    await flush();
    check(refusedRequestsSummary() === "none since this page opened",
      "set up: nothing has failed yet, because nothing has timed out yet");
    var waiting = pendingRequestsSummary();
    check(waiting !== "none", "but the panel does not say everything is fine (got " + waiting + ")");
    check(waiting.indexOf("2,") === 0, "it counts them (got " + waiting + ")");
    check(waiting.indexOf("/rest/v1/completions") !== -1,
      "and names the one that has been waiting longest (got " + waiting + ")");
    check(waiting.indexOf("abc") === -1, "without the filter values, same as everywhere else");
    fireTimers();
    await flush();
    check(pendingRequestsSummary() === "none",
      "once they time out nothing is left waiting (got " + pendingRequestsSummary() + ")");
    check(FAILED_REQUESTS.length === 2, "and both have moved to the failed line");

    reset();
    fetch = respondingFetch(200, "{}");
    run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    await flush();
    check(pendingRequestsSummary() === "none",
      "a request that answered is not left counted as waiting (got " + pendingRequestsSummary() + ")");
    reset();
    fetch = rejectingFetch("Load failed");
    run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    await flush();
    check(pendingRequestsSummary() === "none",
      "and neither is one that failed (got " + pendingRequestsSummary() + ")");

    print("\n-- the connection refuses outright --");
    reset();
    fetch = rejectingFetch("Load failed");
    var dead = run(function () { return timedFetch(URL_REST, { method: "POST" }); });
    await flush();
    check(FAILED_REQUESTS.length === 1, "a network-level failure is recorded too");
    check(FAILED_REQUESTS[0].status === 0 && FAILED_REQUESTS[0].method === "POST",
      "with no status, and the method it was sent with");
    check(FAILED_REQUESTS[0].detail === "Load failed",
      "and what the browser said (got " + FAILED_REQUESTS[0].detail + ")");
    check(dead.settled && dead.error && dead.error.message === "Load failed",
      "the caller gets its own error back, not a rewritten one");
    check(timersPending() === 0, "and the timer is cleared rather than left running");

    print("\n-- a cancelled request is not a broken connection --");
    reset();
    fetch = hangingFetch;
    var outer = new FakeController();
    var cancelled = run(function () { return timedFetch(URL_REST, { method: "GET", signal: outer.signal }); });
    outer.abort();
    await flush();
    check(FAILED_REQUESTS.length === 1, "it is still recorded — nothing goes unsaid");
    check(FAILED_REQUESTS[0].detail === "cancelled",
      "but called what it was, rather than reported as a failure (got " + FAILED_REQUESTS[0].detail + ")");
    check(cancelled.settled && cancelled.error && cancelled.error.name === "AbortError",
      "and the abort reaches the caller unchanged");

    print("\n-- an upload gets the longer budget, and says so --");
    reset();
    fetch = hangingFetch;
    run(function () { return timedFetch(URL_UPLOAD, { method: "POST" }); });
    fireTimers();
    await flush();
    check(FAILED_REQUESTS.length === 1 && FAILED_REQUESTS[0].detail === "no answer after 60s",
      "a photo upload waits 60s and the line says 60s (got "
      + (FAILED_REQUESTS[0] && FAILED_REQUESTS[0].detail) + ")");

    print("\n-- the half that already worked still works --");
    reset();
    fetch = respondingFetch(400, '{"message":"column does not exist"}');
    var refused = run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    await flush();
    check(FAILED_REQUESTS.length === 1 && FAILED_REQUESTS[0].status === 400,
      "a refused response is still recorded with its status");
    check(FAILED_REQUESTS[0].detail.indexOf("column does not exist") !== -1,
      "and what the server said back");
    check(refused.settled && refused.value && refused.value.status === 400,
      "and the response is handed back untouched");

    reset();
    fetch = respondingFetch(200, "{}");
    var okRun = run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    await flush();
    check(FAILED_REQUESTS.length === 0, "a request that worked is not recorded");
    check(WARNINGS.length === 0, "and says nothing on the console");
    check(okRun.settled && okRun.value.status === 200, "and comes back as it is");

    print("\n-- a dead connection reads as one line, not ten --");
    reset();
    fetch = rejectingFetch("Load failed");
    for (var i = 0; i < 9; i++) { run(function () { return timedFetch(URL_REST, { method: "GET" }); }); }
    await flush();
    check(FAILED_REQUESTS.length === 1, "nine failed retries are one entry (got " + FAILED_REQUESTS.length + ")");
    var repeated = refusedRequestsSummary();
    check(repeated.indexOf("×9") !== -1, "that says x9 (got " + repeated + ")");
    check(repeated.length < 120, "so the line stays short enough to read out (" + repeated.length + " chars)");

    print("\n-- explaining a failure must never cause one --");
    reset();
    fetch = rejectingFetch("Load failed");
    var realDescribe = describeRequestUrl;
    describeRequestUrl = function () { throw new Error("the logging is broken"); };
    var brokenLog = run(function () { return timedFetch(URL_REST, { method: "GET" }); });
    await flush();
    describeRequestUrl = realDescribe;
    check(brokenLog.settled && brokenLog.error && brokenLog.error.message === "Load failed",
      "with the recording itself throwing, the caller still gets its own error (got "
      + (brokenLog.error && brokenLog.error.message) + ")");
    check(FAILED_REQUESTS.length === 0, "set up: the recording really did fail");

    print("\n-- the panel reads this line before its own probes start --");
    // Both probes go through timedFetch. Read after they start and the panel
    // would report its own health check back to itself on every dead
    // connection, whatever the member's session had been doing.
    var diag = SRC.slice(SRC.indexOf("async function authDiagnostics("));
    var at = diag.indexOf('add("Failed requests"');
    var waitingAt = diag.indexOf('add("Requests still waiting"');
    var probe = diag.indexOf("const serverProbe");
    check(at !== -1, "the panel still reports the line");
    check(waitingAt !== -1, "and the one that says what is still in flight");
    check(probe !== -1 && at < probe,
      "and reads it before its own server probe starts, so it describes the member's session");
    check(probe !== -1 && waitingAt < probe,
      "the waiting line too, or it would always be counting the panel's own probe");
  } catch (err) {
    check(false, "the test itself threw: " + err);
  }
  print("\n" + pass + " passed   " + fail + " failed");
})();

