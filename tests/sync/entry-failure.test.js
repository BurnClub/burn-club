// What happens when opening a returning member's account fails (T-13).
//
// This is the decision with the worst failure mode in the app. Signing someone
// out on a bad connection strands them: they cannot sign back in until the
// server is reachable again, and everything they have logged since is sitting
// on a phone that now shows a login form. The code used to make that call with
// `isOfflineError(null)` — which discards the error and asks navigator.onLine,
// meaning airplane mode and almost nothing else — so a server hiccup, a
// timeout or a captive wifi portal all signed the member out.
//
// The three functions are lifted out of the real supabase-client.js rather
// than copied, so these checks cannot keep passing after the shipped versions
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
eval(lift("isOfflineError"));
eval(lift("isAccountProblem"));
eval(lift("entryDecision"));
eval(lift("passwordCheckError"));
eval(lift("usableCachedProfile"));
eval(lift("offlineEntryMessage"));

// ---------------- what counts as something to open on ----------------
// The amplifier that made the T-13 fix worse than the bug on a new phone
// (tester T-37): a first open whose program lookup failed wrote a profile
// with no program, that entry was truthy, so the NEXT open thought the device
// had something saved — took the short wait instead of waiting properly, timed
// out, and dead-ended on the copy it had just written. The retry was strictly
// worse than the first attempt and stayed worse, on the one path every new
// invitee walks.
var MEMBER_ON_PROGRAM = { id: "u1", program_id: "p1" };
var MEMBER_UNASSIGNED = { id: "u2", program_id: null };
var PROGRAM = { id: "p1", schedule_type: "structured" };

check(!usableCachedProfile({ member: MEMBER_ON_PROGRAM, program: null }),
  "a copy with no program is NOT something to open on");
check(!!usableCachedProfile({ member: MEMBER_ON_PROGRAM, program: PROGRAM }),
  "a copy with the program IS");
// A member genuinely not on a program yet is an ordinary state, not a broken
// copy — showUnassignedScreen("no-program") handles them, and refusing their
// cache would send them back to the network for nothing.
check(!!usableCachedProfile({ member: MEMBER_UNASSIGNED, program: null }),
  "a member with no program ASSIGNED still counts");
check(!usableCachedProfile(null) && !usableCachedProfile({}) && !usableCachedProfile({ member: null }),
  "nothing, and a copy with no member, count as nothing");

// Stated once, because this is the whole point: an unusable copy must be
// treated as NO copy, never as a usable one. "No copy" still waits for the
// real answer; an unusable copy short-circuits that wait and then fails.
check(usableCachedProfile({ member: MEMBER_ON_PROGRAM, program: null }) === null,
  "an unusable copy returns null, so callers take the no-copy path");

// ---------------- who gets signed out ----------------
var HICCUP = { kind: "server", error: "Couldn't load your account just now." };
var GONE   = { kind: "account", error: "Your session has expired — sign in again." };
var OFF    = { kind: "offline", error: "Can't reach the server, and this device has nothing saved to open yet." };

check(entryDecision(HICCUP, true) === "enter-from-cache",
  "a server hiccup on a phone that holds the member OPENS THE APP");
check(entryDecision(OFF, true) === "enter-from-cache",
  "so does no connection at all");
check(entryDecision(HICCUP, false) === "stay",
  "a hiccup with nothing saved says so and KEEPS the session");
check(entryDecision(OFF, false) === "stay",
  "and so does no connection with nothing saved");
check(entryDecision(GONE, false) === "sign-out",
  "a session the server refuses signs them out");
check(entryDecision(GONE, true) === "sign-out",
  "and still does with a saved copy — work logged against a dead session could never sync");
check(entryDecision({ member: { id: "u1" } }, true) === "enter",
  "an ordinary load just enters");
check(entryDecision(null, true) === "enter" && entryDecision(undefined, false) === "enter",
  "a missing result is not treated as a failure");

// The point of the whole thing, stated once: only the server saying the
// account is no good may sign anyone out.
var signedOutBy = [HICCUP, OFF, { kind: "server", error: "x" }, { kind: null, error: "x" }]
  .filter(function (r) { return entryDecision(r, false) === "sign-out" || entryDecision(r, true) === "sign-out"; });
check(signedOutBy.length === 0, "NOTHING except an account problem signs a member out");

// ---------------- which failures are account problems ----------------
check(isAccountProblem({ code: "PGRST301" }), "an expired JWT is an account problem");
check(isAccountProblem({ status: 401 }), "so is a 401");
check(isAccountProblem({ status: 403 }), "and a 403");
check(!isAccountProblem({ status: 500, message: "Internal Server Error" }), "a 500 is NOT");
check(!isAccountProblem({ code: "57014", message: "canceling statement due to statement timeout" }),
  "nor is a database timeout");
check(!isAccountProblem({ message: "Failed to fetch" }), "nor is a dropped request");
check(!isAccountProblem(null), "nor is no error at all");

// ---------------- the current-password check ----------------
check(passwordCheckError({ message: "Invalid login credentials", status: 400 }) === "That current password doesn't match.",
  "a genuinely wrong password says so");
check(/wait a minute/i.test(passwordCheckError({ message: "For security purposes, you can only request this after 23 seconds.", status: 429 })),
  "a rate limit does NOT say the password is wrong");
check(/connection/i.test(passwordCheckError({ message: "Failed to fetch", name: "AuthRetryableFetchError" })),
  "nor does a dropped request");
check(/try again in a moment/i.test(passwordCheckError({ message: "Internal Server Error", status: 500 })),
  "nor does a server error");
var notWrong = [
  passwordCheckError({ message: "For security purposes, you can only request this after 23 seconds.", status: 429 }),
  passwordCheckError({ message: "Failed to fetch", name: "AuthRetryableFetchError" }),
  passwordCheckError({ message: "Internal Server Error", status: 500 }),
  passwordCheckError({}), passwordCheckError(null),
].join(" | ");
check(!/doesn't match/i.test(notWrong),
  "nothing that is merely a failed CHECK accuses the member of typing it wrong");


// ---------------- what the member is TOLD when it dead-ends ----------------
// The same two states usableCachedProfile() tells apart, said out loud
// (tester T-49). A phone that has never held this member really does have
// nothing saved. A phone holding their whole profile, missing only the
// programme, does not - and that is the common way to land here, because it
// is exactly what usableCachedProfile() refuses.
//
// The member is on a login form with no signal. Being told their phone is
// empty reads as "you have been signed out and your account is gone". They
// have not been: `kind: "offline"` keeps the session, which is the one thing
// this path must never get wrong.

var ON_PROGRAM_NO_PROGRAM = { member: MEMBER_ON_PROGRAM, program: null };

check(!usableCachedProfile(ON_PROGRAM_NO_PROGRAM),
  "set up: a profile with no programme is still refused, which is what T-37 is for");

var toldWithProfile = offlineEntryMessage(ON_PROGRAM_NO_PROGRAM);
var toldWithNothing = offlineEntryMessage(null);

check(toldWithProfile !== toldWithNothing, "the two states are not told the same thing");
check(toldWithProfile.indexOf("nothing saved") === -1,
  "a phone holding the member's profile is NOT told it has nothing saved: "
  + JSON.stringify(toldWithProfile));
check(/still\s+signed in/.test(toldWithProfile),
  "it is told they are still signed in, which is the reassurance that was lost");
check(toldWithProfile.indexOf("nothing on this phone is lost") !== -1,
  "and that nothing on the phone is lost");
check(/program/i.test(toldWithProfile), "and what is actually missing is named");

check(toldWithNothing.indexOf("nothing saved") !== -1,
  "while a phone that really has nothing is still told so: " + JSON.stringify(toldWithNothing));
check(offlineEntryMessage({ member: null, program: null }).indexOf("nothing saved") !== -1,
  "a cache entry with no member in it counts as nothing");
check(offlineEntryMessage(undefined).indexOf("nothing saved") !== -1,
  "and so does no cache entry at all");

// Neither message may suggest the member has been signed out or should sign
// in again: they are still signed in, and on a dead connection they cannot.
[toldWithProfile, toldWithNothing].forEach(function (m) {
  check(!/sign(ed)? (in|out) again|signed out|log in/i.test(m),
    "nothing here tells them to sign in again, which they cannot do with no signal: "
    + JSON.stringify(m));
});

// And the path that produces it still keeps the session, whichever message
// it chose - that is the half of this the wording cannot be allowed to undo.
check(entryDecision({ kind: "offline", error: toldWithProfile }, false) === "stay",
  "a phone with a profile it cannot use KEEPS the session");
check(entryDecision({ kind: "offline", error: toldWithNothing }, false) === "stay",
  "and so does one with nothing at all");

// And the dead-end really does use it, or this is a nicely tested function
// that nobody calls.
check(SRC.indexOf("error: offlineEntryMessage(saved)") !== -1,
  "the offline dead-end sends whichever message belongs to that phone");
check((SRC.match(/this device has nothing saved to open yet/g) || []).length === 1,
  "and the wording lives in one place, not copied back to the call site");

// The other screen the same member can land on, in app.js: a login form,
// still signed in, no signal. It carries the same reassurance for the same
// reason - what frightens them is not knowing whether the account is gone.
var APPSRC = readFile("../../app.js");
var unreachable = APPSRC.indexOf("Couldn't reach the server to open your account.");
check(unreachable !== -1, "the returning-member dead-end still says the server could not be reached");
var around = APPSRC.slice(unreachable, unreachable + 320);
check(/still\s+signed in/.test(around),
  "and tells them they are still signed in");
check(around.indexOf("nothing on this phone is lost") !== -1,
  "and that nothing on the phone is lost");
