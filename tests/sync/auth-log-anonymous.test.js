// The log has to survive the states it exists to record (tester T-53).
//
// logAuthEvent() used to write through SB, the signed-in client, which
// attaches the stored access token to every request. When that token is
// present but unusable — damaged, expired, revoked — PostgREST rejects the
// request on the JWT before any policy is considered ("Expected 3 parts in
// JWT; got 1") and the row never lands. So the log was refused in exactly the
// states it was built for: entry_threw, return_entry_threw, entry_failed,
// return_session_damaged. 27-login-visibility.sql had deliberately opened the
// table to anon for this reason, and the client then handed PostgREST a broken
// credential it was obliged to reject first.
//
// Observed live before the fix: through the signed-in client, "REFUSED:
// Expected 3 parts in JWT; got 1"; the same row as a bare anonymous POST,
// "accepted, HTTP 201".
//
// logAuthEvent is lifted out of the real supabase-client.js, so these checks
// cannot keep passing after the shipped version changes.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

var SRC = readFile("../../supabase-client.js");
function lift(name) {
  var start = SRC.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone from supabase-client.js");
  var depth = 0;
  for (var i = SRC.indexOf("{", start); i < SRC.length; i++) {
    if (SRC[i] === "{") depth++;
    else if (SRC[i] === "}") { depth--; if (depth === 0) return SRC.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}

var SUPABASE_URL = "https://nuszxjopsxwpywojbrdw.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TESTVALUE";
var AUTH_LOG_ENDPOINT = SUPABASE_URL + "/rest/v1/auth_events";
var AUTH_MEMBER = null;
var navigator = { userAgent: "jsc-test-agent", onLine: true };
function appVersion() { return "v-test"; }

// Captures what would go over the wire.
var SENT = [];
var FAIL_MODE = null;
function timedFetch(url, opts) {
  SENT.push({ url: url, opts: opts });
  if (FAIL_MODE === "throw") return Promise.reject(new Error("network gone"));
  if (FAIL_MODE === "refuse") return Promise.resolve({ ok: false, status: 401 });
  return Promise.resolve({ ok: true, status: 201 });
}
var WARNED = [];
var console = { warn: function () { WARNED.push(Array.prototype.join.call(arguments, " ")); } };

var logSrc = lift("logAuthEvent");
eval(logSrc);

// ---------------- it must not go through the signed-in client ----------------

function stripComments(t) { return t.replace(/\/\/[^\n]*/g, ""); }
var logCode = stripComments(logSrc);

check(!/\bSB\b/.test(logCode),
  "logAuthEvent does not touch SB, so a bad session cannot suppress its own record");
check(/timedFetch/.test(logCode), "it goes out through timedFetch, so it has a time limit like everything else");
check(!/\.from\(/.test(logCode), "it no longer uses the client's .from() builder");

// ---------------- what actually goes over the wire ----------------

SENT = []; WARNED = []; FAIL_MODE = null;
logAuthEvent("entry_threw", "something broke", "member@example.com");

check(SENT.length === 1, "one request is sent");
var req = SENT[0];
check(req.url === AUTH_LOG_ENDPOINT, "it posts to the auth_events endpoint");
check(req.opts.method === "POST", "it is a POST");

var h = req.opts.headers;
check(h.apikey === SUPABASE_PUBLISHABLE_KEY, "the apikey header is the publishable key");
check(h.Authorization === "Bearer " + SUPABASE_PUBLISHABLE_KEY,
  "the bearer token is the PUBLISHABLE KEY, not a member session");
check(!/eyJ/.test(h.Authorization), "no JWT is attached");

var body = JSON.parse(req.opts.body);
check(body.event === "entry_threw", "the event name is carried");
check(body.detail === "something broke", "the detail is carried");
check(body.email === "member@example.com", "an explicitly passed email is carried");
check(body.member_id === null, "member_id is null when nobody is loaded");
check(body.app_version === "v-test", "the app version is carried");
check(body.user_agent === "jsc-test-agent", "the user agent is carried");

// Attribution must survive the switch to anonymous: the policy is
// `with check (true)` with no comparison to auth.uid(), so the row's own
// member_id is the only attribution there ever was.
AUTH_MEMBER = { id: "m-1", email: "jordan@example.com" };
SENT = [];
logAuthEvent("signin_ok");
body = JSON.parse(SENT[0].opts.body);
check(body.member_id === "m-1", "member_id still comes from the loaded member");
check(body.email === "jordan@example.com", "the member's email is still filled in");
AUTH_MEMBER = null;

// ---------------- the caps that bound a nuisance write ----------------

SENT = [];
logAuthEvent(new Array(100).join("e"), new Array(900).join("d"), "x@y.z");
body = JSON.parse(SENT[0].opts.body);
check(body.event.length === 40, "the event name is still capped at 40");
check(body.detail.length === 500, "the detail is still capped at 500");

SENT = [];
logAuthEvent("no_detail");
body = JSON.parse(SENT[0].opts.body);
check(body.detail === null, "a missing detail is null, not the string 'undefined'");

// ---------------- it must never break the app ----------------

SENT = []; WARNED = []; FAIL_MODE = "refuse";
logAuthEvent("refused_case", "x");
check(SENT.length === 1, "a refusal still sent the request");

SENT = []; WARNED = []; FAIL_MODE = "throw";
var threw = false;
try { logAuthEvent("thrown_case", "x"); } catch (e) { threw = true; }
check(threw === false, "a network failure does not throw into the caller");
FAIL_MODE = null;

// A log that breaks the app is worse than no log: even a nonsense call must
// not escape.
threw = false;
try { logAuthEvent(undefined, undefined, undefined); } catch (e) { threw = true; }
check(threw === false, "a nonsense call does not throw either");
