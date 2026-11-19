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
