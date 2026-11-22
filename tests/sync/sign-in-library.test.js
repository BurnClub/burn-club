// If the sign-in library did not load, a member got a silent login form with
// the demo buttons under it, and nothing anywhere recorded it (tester T-55).
//
// `supabase-js` came from a CDN, and the service worker deliberately ignores
// cross-origin requests (`if (url.origin !== self.location.origin) return;`),
// so it was the one file the app could not open without and could not cache.
// It is served from this repo now, and the two things that happen when it is
// still missing — the message and the log — are checked here.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var APP = readFile("../../app.js");
var CLIENT = readFile("../../supabase-client.js");
var HTML = readFile("../../index.html");
var SW = readFile("../../sw.js");
var VENDOR = readFile("../../vendor/supabase-js-2.116.0.umd.js");

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
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
var CODE = strip(APP), CLIENT_CODE = strip(CLIENT), HTML_CODE = HTML.replace(/<!--[\s\S]*?-->/g, "");

// ---------------- the file is served from here, and cached ----------------

check(HTML_CODE.indexOf("cdn.jsdelivr.net") === -1, "index.html no longer loads anything from a CDN");
check(HTML_CODE.indexOf('src="vendor/supabase-js-2.116.0.umd.js"') !== -1,
  "it loads the copy in this repo instead");
check(SW.indexOf('"./vendor/supabase-js-2.116.0.umd.js"') !== -1,
  "and the service worker keeps that file in SHELL, like every other file the app needs");
check(SW.indexOf("url.origin !== self.location.origin") !== -1,
  "the fetch handler still ignores cross-origin requests, which is why a CDN copy could never be cached");

// The vendored bundle itself: 2.116.0's UMD build, whole.
// 218,318 BYTES on disk, 218,312 characters as the runtime reads it: the
// bundle has a handful of multi-byte characters in it. The byte count and the
// sha256 are recorded in vendor/README.md; this is the half a test can see.
check(VENDOR.length === 218312, "the vendored bundle is the expected length, so it is whole");
check(VENDOR.indexOf("var supabase=") === 0, "it starts by defining the global the app reads");
check(VENDOR.indexOf("createClient") !== -1, "and carries createClient");
check(/\}\)\(\{\}\);\s*$/.test(VENDOR), "it ends where the bundle ends, so it is not truncated");

// ---------------- what the member is told ----------------

var SAID = [], SHOWN = null, HIDDEN = null;
function logAuthEvent(event, detail, email) { SAID.push({ event: event, detail: detail, email: email }); }
var ERR = { textContent: "", hidden: true };
var DEMO = { hidden: null };
var document = { getElementById: function (id) {
  if (id === "login-error") return ERR;
  if (id === "login-demo") return DEMO;
  return null;
} };
var navigator = { onLine: true };
eval(lift(APP, "showSignInUnavailable"));

showSignInUnavailable();
print("  shown: " + ERR.textContent);
check(ERR.hidden === false, "the login screen is no longer silent");
check(/loading/i.test(ERR.textContent), "the message says the app did not finish loading");
check(/again/i.test(ERR.textContent), "and tells them what to do about it");
check(!/password/i.test(ERR.textContent) || /hasn't|has not/i.test(ERR.textContent),
  "it does not imply anything about their password being wrong");
check(/nothing on this phone is lost|not locked out/i.test(ERR.textContent),
  "and it says their work is safe, because a blank login form reads like a wiped account");

check(SAID.length === 1 && SAID[0].event === "library_missing",
  "and it is recorded as library_missing, the one entry that used to leave no trace");
// Guarded: with nothing logged, reading SAID[0] would throw and take every
// check after it with it — which is how a mutation report hides its own tail.
check(SAID.length > 0 && /connection/i.test(SAID[0].detail),
  "the row says whether the device thought it was online");
navigator.onLine = false; SAID = [];
showSignInUnavailable();
check(SAID.length > 0 && /no connection/i.test(SAID[0].detail), "and says so when it is offline");

// ---------------- the demo buttons ----------------

var REQUESTED = false;
function demoEntriesRequested() { return REQUESTED; }
function supabaseReady() { return false; }   // the T-55 state
eval(lift(APP, "applyDemoEntryVisibility"));

DEMO.hidden = null; REQUESTED = false;
applyDemoEntryVisibility();
check(DEMO.hidden === true,
  "a member whose sign-in just broke is NOT offered \"Continue as Guest\" and a fake account");
DEMO.hidden = null; REQUESTED = true;
applyDemoEntryVisibility();
check(DEMO.hidden === false, "?demo=1 still opens the demo, which is how every demo here is opened");
DEMO.hidden = null; REQUESTED = false;
// supabaseReady() is false throughout: the old rule keyed on it, so if the
// shipped line still reads it, the check above would have passed by accident.
check(CODE.indexOf("demo.hidden = !demoEntriesRequested();") !== -1,
  "the visibility rule asks only whether the demo was asked for");

// ---------------- the entry path, and the form under it ----------------

var route = CODE.indexOf("async function routeOnLoad");
var guard = CODE.indexOf("if (!supabaseReady())", route);
check(guard !== -1 && CODE.slice(guard, guard + 160).indexOf("showSignInUnavailable()") !== -1,
  "routeOnLoad() says so instead of returning in silence");

var signIn = CLIENT_CODE.indexOf("async function signIn(");
var noLib = CLIENT_CODE.indexOf("if (!SB)", signIn);
var branch = CLIENT_CODE.slice(noLib, noLib + 600);
check(branch.indexOf("logAuthEvent(\"signin_no_library\"") !== -1,
  "and a password typed into that form is recorded rather than swallowed");
check(branch.indexOf("Check your connection.\" };") === -1,
  "the old \"Can't reach the server\" wording is gone from that branch — the server was never asked");
check(/hasn't been checked|has not been checked/i.test(branch),
  "it says the password has not been checked, which is the true part a member cares about");

print("\n  " + pass + " passed, " + fail + " failed");
