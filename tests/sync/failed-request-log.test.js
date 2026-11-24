// One request came back 400 on every signed-in page load and nothing anywhere
// said a word about it (tester T-84).
//
// I could not reproduce the 400 itself on the current build — see NOTES.md for
// what was eliminated — but the second half of that finding is the part that
// matters and is fixable: a refused request belonged to no code path that
// looks. Individual call sites check their own errors, and only the ones
// somebody remembered to check; the two that WOULD have reported this never
// fired. A failure nobody can name is the shape of thing that hid the first
// trial's failure for six days.
//
// Every request to Supabase — REST, auth and storage — goes through
// timedFetch, because the client is built with `global: { fetch: timedFetch }`.
// That is the one place that can see a refusal, so that is where it is seen.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var SRC = readFile("../../supabase-client.js");
var CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
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

// jsc has no document and no URL. describeRequestUrl falls back to a plain
// split without it, so a shim is supplied to exercise the path a browser
// actually takes, and the fallback is checked separately below.
var location = { href: "https://example.test/app/" };
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
eval(liftFn("describeRequestUrl"));
eval(liftFn("noteFailedRequest"));

// ---------------- what gets kept, and what does not ----------------

var withEmail = describeRequestUrl("https://x.supabase.co/rest/v1/members?select=*&email=eq.jordan@example.com");
check(withEmail.indexOf("/rest/v1/members") === 0, "the path is kept, so the request can be identified (got " + withEmail + ")");
check(withEmail.indexOf("email") !== -1, "and the names of the filters are kept");
check(withEmail.indexOf("jordan@example.com") === -1,
  "but not the address in them — this string goes to a panel members can read (got " + withEmail + ")");

var withId = describeRequestUrl("https://x.supabase.co/rest/v1/completions?select=*&member_id=eq.209ce209-67ef-4c2a-9424-238a1802e465&order=performed_on.asc");
check(withId.indexOf("209ce209") === -1, "nor the member's id (got " + withId + ")");
check(withId.indexOf("order") !== -1, "while still saying it was an ordered read");

check(describeRequestUrl("https://x.supabase.co/auth/v1/token?grant_type=refresh_token")
  .indexOf("/auth/v1/token") === 0, "an auth call is named by its path too");
check(describeRequestUrl("https://x.supabase.co/rest/v1/lifts") === "/rest/v1/lifts",
  "a request with no query is just its path");

// Without URL to parse it — an older engine, or a string URL cannot parse —
// the fallback must never say MORE than the main path does.
var realURL = URL;
URL = function () { throw new TypeError("no URL here"); };
var fallback = describeRequestUrl("https://x.supabase.co/rest/v1/members?select=*&email=eq.jordan@example.com");
URL = realURL;
check(fallback.indexOf("jordan@example.com") === -1,
  "with no URL to parse, the query goes entirely rather than being kept (got " + fallback + ")");
check(fallback.indexOf("x.supabase.co") === -1,
  "and the host goes with it (got " + fallback + ")");
check(fallback === "/rest/v1/members", "leaving the path (got " + fallback + ")");

// ---------------- the record ----------------

FAILED_REQUESTS.length = 0; WARNINGS.length = 0;
noteFailedRequest("GET", "https://x.supabase.co/rest/v1/completions?select=*&order=nope",
  400, '{"code":"42703","message":"column completions.nope does not exist"}');
check(FAILED_REQUESTS.length === 1, "a refused request is remembered");
var e = FAILED_REQUESTS[0];
check(e.status === 400 && e.method === "GET", "with its status and method");
check(e.where === "/rest/v1/completions?select&order", "and where it went (got " + e.where + ")");
check(e.detail.indexOf("does not exist") !== -1, "and what the server said back, which is the part that names the bug");
check(typeof e.at === "string" && e.at.indexOf("T") !== -1, "and when");
check(WARNINGS.length === 1 && WARNINGS[0].indexOf("HTTP 400") !== -1,
  "and it says so on the console (got " + JSON.stringify(WARNINGS) + ")");
check(WARNINGS[0].indexOf("/rest/v1/completions") !== -1, "naming the request, not just the number");

// A body the app could not read must not stop it being recorded.
FAILED_REQUESTS.length = 0;
noteFailedRequest("POST", "https://x.supabase.co/rest/v1/auth_events", 400, null);
check(FAILED_REQUESTS.length === 1 && FAILED_REQUESTS[0].detail === "",
  "a refusal with no readable body is still recorded");

// It must not grow without limit on a page left open all day.
FAILED_REQUESTS.length = 0;
for (var i = 0; i < 40; i++) noteFailedRequest("GET", "https://x.supabase.co/rest/v1/lifts", 500, "boom " + i);
check(FAILED_REQUESTS.length === MAX_REMEMBERED_FAILURES,
  "the list is capped (got " + FAILED_REQUESTS.length + ")");
check(FAILED_REQUESTS[FAILED_REQUESTS.length - 1].detail.indexOf("boom 39") !== -1,
  "and keeps the most recent, which is the one being asked about");

// A long error body is trimmed rather than carried whole.
FAILED_REQUESTS.length = 0;
noteFailedRequest("GET", "https://x.supabase.co/rest/v1/lifts", 400, new Array(900).join("x"));
check(FAILED_REQUESTS[0].detail.length <= 200, "a long error body is trimmed (got "
  + FAILED_REQUESTS[0].detail.length + ")");

// ---------------- wired where every request passes ----------------

function bodyOf(name) {
  var at = CODE.indexOf("function " + name + "(");
  if (at < 0) return "";
  var depth = 0;
  for (var i = CODE.indexOf("{", at); i < CODE.length; i++) {
    if (CODE[i] === "{") depth++;
    else if (CODE[i] === "}") { depth--; if (depth === 0) return CODE.slice(at, i + 1); }
  }
  return "";
}
var tf = bodyOf("timedFetch");
check(tf.indexOf("noteFailedRequest(method, url, res.status") !== -1,
  "timedFetch names a response the server refused");
check(tf.indexOf("res.clone()") !== -1,
  "reading the body off a CLONE, so a caller that wants it still gets it");
check(tf.indexOf("return res;") !== -1, "and the response itself is handed back untouched");
check(/global:\s*\{\s*fetch:\s*timedFetch\s*\}/.test(CODE),
  "and every Supabase request goes through it, which is why this is the place");

// The member-facing panel says so too, so a tester with no DevTools can read
// it out — which is how this one was found in the first place.
eval(liftFn("refusedRequestsSummary"));
FAILED_REQUESTS.length = 0;
check(refusedRequestsSummary() === "none since this page opened",
  "with nothing refused it says so plainly, which is itself the useful answer (got "
  + refusedRequestsSummary() + ")");
noteFailedRequest("GET", "https://x.supabase.co/rest/v1/lifts?select=*&member_id=eq.abc", 400, "bad filter");
var summary = refusedRequestsSummary();
check(summary.indexOf("400") !== -1 && summary.indexOf("/rest/v1/lifts") !== -1,
  "and with one refused it names the status and the request (got " + summary + ")");
check(summary.indexOf("abc") === -1, "without the filter values, same as everywhere else");
check(bodyOf("authDiagnostics").indexOf('add("Refused requests", refusedRequestsSummary())') !== -1,
  "and the diagnostics panel reports it");

print(pass + " passed, " + fail + " failed");
