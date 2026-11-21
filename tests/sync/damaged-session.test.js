// A saved sign-in that cannot be read (tester T-14).
//
// This was the trial's signature failure: the member opens the app and gets a
// login form with NOTHING written on it and no auth_events row — while their
// profile and program are sitting in localStorage right next to the damaged
// token. Five fixes landed on this path without touching it, because every one
// of them keyed off the user id, and a damaged token has no user id.
//
// The cause is that storedSessionUserId() answers null for three situations
// that are nothing alike:
//
//   never signed in   -> null   quiet login form is correct
//   signed out        -> null   quiet login form is correct
//   token unreadable  -> null   signed in, on a phone holding their whole app
//
// storedSessionState() separates them. These checks pin the separation and the
// two behaviours that hang off it: a damaged token must say so and must be
// logged; the other two must stay silent, because a first-time visitor being
// told their sign-in is damaged is its own bug.
//
// The functions are lifted out of the real supabase-client.js rather than
// copied, so these checks cannot keep passing after the shipped versions
// change.
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
var AUTH_CACHE_KEY = "burnclub-auth-cache";
var TOKEN_KEY = "sb-nuszxjopsxwpywojbrdw-auth-token";

// jsc has no URL. The real function uses it only to get the project ref out of
// the hostname, so this stands in for exactly that.
function URL(u) { this.hostname = u.replace(/^https?:\/\//, "").split("/")[0]; }

eval(lift("storedSessionState"));
eval(lift("storedSessionUserId"));
eval(lift("loadCachedAuthMember"));
eval(lift("usableCachedProfile"));

var UID = "11111111-2222-3333-4444-555555555555";
var GOOD_TOKEN = JSON.stringify({ user: { id: UID } });
var CACHE = JSON.stringify({
  member: { id: UID, name: "Jordan Tester", program_id: "p1" },
  program: { id: "p1", name: "Spring Strength" }
});

// ---------------- what the state reader can tell apart ----------------

function withStore(token, cache, blocked) {
  var store = {};
  if (token !== undefined) store[TOKEN_KEY] = token;
  if (cache !== undefined) store[AUTH_CACHE_KEY] = cache;
  localStorage = {
    getItem: function (k) {
      if (blocked) throw new Error("storage blocked");
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  };
}

withStore(GOOD_TOKEN, CACHE);
var s = storedSessionState();
check(s.state === "signed-in", "a healthy token reads as signed-in");
check(s.uid === UID, "a healthy token still yields the user id");
check(storedSessionUserId() === UID, "storedSessionUserId() is unchanged for a healthy token");

withStore(undefined, undefined);
check(storedSessionState().state === "none", "no token key at all reads as none, not damaged");
check(storedSessionUserId() === null, "storedSessionUserId() is still null when there is no token");

// The shape that caused this: a write cut off part way through.
withStore(GOOD_TOKEN.slice(0, 28), CACHE);
s = storedSessionState();
check(s.state === "damaged", "a token truncated mid-write reads as damaged");
check(s.uid === null, "a damaged token yields no user id");
check(/not valid JSON/.test(s.why), "the reason says the token did not parse");
check(/28 bytes/.test(s.why), "the reason carries the length, which is the thread to pull");

// Parses, but not into a session.
withStore(JSON.stringify({ access_token: "x" }), CACHE);
s = storedSessionState();
check(s.state === "damaged", "a token with no user on it reads as damaged");
check(/no user id/.test(s.why), "the reason distinguishes 'no user id' from 'did not parse'");

withStore("", CACHE);
check(storedSessionState().state === "damaged", "an empty-string token reads as damaged");

withStore("null", CACHE);
s = storedSessionState();
check(s.state === "damaged", "a literal null token reads as damaged");
check(/empty/.test(s.why), "the reason says the token was empty");

withStore(undefined, undefined, true);
s = storedSessionState();
check(s.state === "unreadable", "storage that throws reads as unreadable, not damaged");
check(s.uid === null, "unreadable storage yields no user id");
check(storedSessionUserId() === null, "storedSessionUserId() still swallows a throwing store");

// ---------------- what the entry path then does ----------------
// The decision in app.js, reproduced over the lifted readers: who enters, who
// is told something, and who gets a row in auth_events.

function entry(token, cache, online, blocked) {
  withStore(token, cache, blocked);
  var stored = storedSessionState();
  var uid = stored.uid;
  var cached = usableCachedProfile(uid ? loadCachedAuthMember(uid)
    : (online === false ? loadCachedAuthMember() : null));
  if (cached) return { enters: true, message: null, event: null };
  if (uid) return { enters: false, message: "unreachable", event: "return_unreachable_no_cache" };
  if (stored.state === "damaged") {
    return {
      enters: false,
      message: "damaged",
      event: "return_session_damaged",
      detail: stored.why + "; cache " + (loadCachedAuthMember() ? "present" : "absent")
    };
  }
  return { enters: false, message: null, event: null };
}

var r = entry(GOOD_TOKEN.slice(0, 28), CACHE, true);
check(r.enters === false, "online with a damaged token: still does not enter the app");
check(r.message === "damaged", "online with a damaged token: the login form is no longer blank");
check(r.event === "return_session_damaged", "online with a damaged token: an auth_events row is written");
check(/cache present/.test(r.detail), "the log says the profile was sitting there, which is the whole story");

r = entry(GOOD_TOKEN.slice(0, 28), undefined, true);
check(r.message === "damaged", "damaged token with no cache is still reported");
check(/cache absent/.test(r.detail), "the log distinguishes a device that had nothing saved");

// The gym case, and the reason the fix does not enter on the cache: offline
// already does, and that path is untouched.
r = entry(GOOD_TOKEN.slice(0, 28), CACHE, false);
check(r.enters === true, "offline with a damaged token: still opens from the saved copy");

r = entry(GOOD_TOKEN, CACHE, true);
check(r.enters === true, "a healthy token with a cache still enters");
check(r.event === null, "a healthy entry writes no failure row");

// The check that matters most in the other direction: someone who has never
// signed in must not be told their sign-in is damaged.
r = entry(undefined, undefined, true);
check(r.enters === false, "a first-time visitor gets the login form");
check(r.message === null, "a first-time visitor is told nothing");
check(r.event === null, "a first-time visitor writes no row");

r = entry(undefined, undefined, false);
check(r.message === null, "a first-time visitor offline is told nothing either");

r = entry(undefined, undefined, true, true);
check(r.message === null, "blocked storage is not reported as a damaged sign-in");
