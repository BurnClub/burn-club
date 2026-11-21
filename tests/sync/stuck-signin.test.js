// A sign-in that throws, and a session that cannot say who it is
// (tester T-51, T-52).
//
// T-51: supabase-js THROWS rather than returning {error} when it cannot
// persist the session it has just been handed — a full phone, Safari with
// "Block All Cookies", site data blocked, an email app's in-app browser. The
// password was right and the server said yes. Before this, the throw escaped
// signIn() completely, so the submit handler never came back: the button sat
// on "Signing in…", disabled, for good, with no message and no auth_events
// row. The member shows up in admin as having never tried. That is the
// October failure word for word.
//
// T-52: getSession() hands back whatever is in storage if it carries an
// access token and an unexpired expires_at — it does not require a user on
// it. A bare `!session` check let that through, and `session.user.id` then
// threw into DOMContentLoaded's catch: blank login form, nothing on it, no
// log. The exact failure T-14 was written to end, by the one route T-14's
// branch could not see.
//
// signInThrewError is lifted out of the real supabase-client.js, so these
// checks cannot keep passing after the shipped version changes.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

var SRC = readFile("../../supabase-client.js");
var APP = readFile("../../app.js");
function liftFrom(src, name) {
  var start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error(name + "() is gone");
  var depth = 0;
  for (var i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}
eval(liftFrom(SRC, "signInThrewError"));

// ---------------- T-51: what the member is told ----------------

var quota = signInThrewError({ name: "QuotaExceededError", message: "The quota has been exceeded." });
check(/no room left/.test(quota), "a full phone is told it is out of room");
check(/password was accepted/.test(quota), "a full phone is told the password was accepted");

var sec = signInThrewError({ name: "SecurityError", message: "The operation is insecure." });
check(/blocking/.test(sec), "blocked storage is told the browser is blocking it");
check(/cookies and site data/i.test(sec), "blocked storage is told which setting to change");
check(/password was accepted/.test(sec), "blocked storage is told the password was accepted");

var net = signInThrewError({ message: "Failed to fetch" });
check(/connection/.test(net), "a network throw is reported as a connection problem");

var unknown = signInThrewError({ message: "something nobody predicted" });
check(unknown.length > 0, "an unrecognised throw still produces wording");
check(/password was accepted/.test(unknown), "an unrecognised throw still says the password was accepted");

// Nothing here may blame the member: the password was right in every case.
var all = [quota, sec, net, unknown];
var blames = all.filter(function (t) {
  return /don't match|incorrect password|wrong password|check your password/i.test(t);
});
check(blames.length === 0, "no wording implies the password was wrong");

check(signInThrewError(null).length > 0, "a null throw does not itself throw");
check(signInThrewError({}).length > 0, "an empty error object does not throw");

// ---------------- T-51: signIn() cannot leak a throw ----------------

var signInSrc = liftFrom(SRC, "signIn");
// Comments stripped before any positional check: a comment SAYING there is a
// try satisfies a naive indexOf("try") and makes the check worthless. That is
// how the first draft of this file passed a mutation that removed the try.
function stripComments(t) { return t.replace(/\/\/[^\n]*/g, ""); }
var signInCode = stripComments(signInSrc);
check(/try\s*\{/.test(signInCode), "signIn() has a try");
check(/signInWithPassword/.test(signInCode), "signIn() still calls signInWithPassword");
var callIdx = signInCode.indexOf("signInWithPassword");
var tryIdx = signInCode.indexOf("try");
check(tryIdx >= 0 && tryIdx < callIdx, "the try opens BEFORE signInWithPassword, not after it");
check(/signin_threw/.test(signInSrc), "a throw out of sign-in is logged as signin_threw");
check(/signInThrewError/.test(signInSrc), "a throw out of sign-in is turned into member wording");
check(/loadAuthMember/.test(signInCode), "signIn() still loads the profile");
var loadIdx = signInCode.indexOf("loadAuthMember");
var secondTry = signInCode.indexOf("try", callIdx);
check(secondTry >= 0 && secondTry < loadIdx, "the profile load is inside a try too");
check(/signin_profile_threw/.test(signInSrc), "a throw out of the profile load is logged");
check(/!data \|\| !data\.user/.test(signInSrc), "accepted-but-no-user is handled rather than dereferenced");
// throwDetail() lives in app.js, which loads AFTER this file.
check(!/throwDetail\s*\(/.test(signInCode),
  "signIn() does not CALL a function from a later file");

// ---------------- T-51: the handler always gives the button back ----------------

var handlerStart = APP.indexOf('on("login-form", "submit"');
check(handlerStart > 0, "the login submit handler is still where it was");
var handler = APP.slice(handlerStart, APP.indexOf('const trouble = document.getElementById("trouble-btn")', handlerStart));
check(handler.length > 200, "the handler slice found its end marker");
var handlerCode = stripComments(handler);
var signInCall = handlerCode.indexOf("await signIn(");
check(signInCall > 0, "the handler still awaits signIn()");
var handlerTry = handlerCode.indexOf("try");
check(handlerTry >= 0 && handlerTry < signInCall, "the handler wraps the signIn() await in a try");
check(/signin_handler_threw/.test(handler), "a throw in the handler is logged");
check(/!res \|\| res\.error/.test(handler), "a missing result is treated as an error, not dereferenced");

// ---------------- T-52: a session with no user is not a session ----------------

var routeStart = APP.indexOf("async function routeOnLoad(");
check(routeStart > 0, "routeOnLoad is still there");
function bodyAt(src, start) {
  var depth = 0;
  for (var i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error("unterminated function");
}
var route = bodyAt(APP, routeStart);
check(/if \(!session \|\| !session\.user \|\| !session\.user\.id\)/.test(route),
  "the entry guard rejects a session that cannot identify anyone");

// The guard must come BEFORE the dereference it protects.
var routeCode = stripComments(route);
var guardIdx = routeCode.indexOf("!session.user.id");
var derefIdx = routeCode.indexOf("loadCachedAuthMember(session.user.id)");
check(guardIdx > 0 && derefIdx > 0 && guardIdx < derefIdx,
  "the guard sits before the session.user.id dereference");

// And the damaged branch has to be inside the block the guard opens, or this
// shape gets the guard and still says nothing.
var branchIdx = routeCode.indexOf("return_session_damaged");
check(branchIdx > guardIdx && branchIdx < derefIdx,
  "the damaged-session branch is now reachable for a user-less session");

// ---------------- the decision table, end to end ----------------
// Reproduces the guard over the real classifier for every session shape.

eval(liftFrom(SRC, "storedSessionState"));
var SUPABASE_URL = "https://nuszxjopsxwpywojbrdw.supabase.co";
function URL(u) { this.hostname = u.replace(/^https?:\/\//, "").split("/")[0]; }
var TOKEN_KEY = "sb-nuszxjopsxwpywojbrdw-auth-token";

function entered(session, token) {
  var store = {};
  if (token !== undefined) store[TOKEN_KEY] = token;
  localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function () {}, removeItem: function () {}
  };
  var passesGuard = !(!session || !session.user || !session.user.id);
  return { passesGuard: passesGuard, state: storedSessionState().state };
}

var future = Math.floor(Date.now() / 1000) + 3600;
var userless = { access_token: "abc", token_type: "bearer", expires_at: future, refresh_token: "rt" };

var r = entered(userless, JSON.stringify(userless));
check(r.passesGuard === false, "T-52's shape no longer passes the entry guard");
check(r.state === "damaged", "T-52's shape is classified damaged, so the branch has something to say");

r = entered({ user: { id: "u1" } }, JSON.stringify({ user: { id: "u1" } }));
check(r.passesGuard === true, "a healthy session still passes the guard");

r = entered({ user: {} }, "{}");
check(r.passesGuard === false, "a session with a user but no id does not pass either");

r = entered(null, undefined);
check(r.passesGuard === false, "no session at all still does not pass");
