// What a new member is told on the set-a-password form (T-17).
//
// This is every invitee's FIRST screen, and the only one they see before they
// have an account they can use. It was using friendlyAuthError(), whose
// fallback is "Couldn't sign you in" — which is not what this form does, and
// is the one sentence guaranteed to make a new tester give up and email Chris.
//
// Lifted out of the real supabase-client.js rather than copied, so these
// checks cannot keep passing after the shipped version changes.
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
eval(lift("setPasswordError"));

var say = setPasswordError;

check(/at least 8/i.test(say({ message: "Password should be at least 6 characters.", status: 422 })),
  "a short password is told the app's own minimum, not the server's");
check(/data breach/i.test(say({ message: "Password is known to be weak and easy to guess, please choose a different one.", status: 422 })),
  "a breached password is explained rather than just refused");
check(/wait a minute/i.test(say({ message: "For security purposes, you can only request this after 18 seconds.", status: 429 })),
  "a rate limit says to wait");
check(/connection/i.test(say({ message: "Failed to fetch", name: "AuthRetryableFetchError" })),
  "a dropped request blames the connection");
check(/link has expired/i.test(say({ message: "invalid JWT: token is expired", status: 401 })),
  "a spent link says so and names the way out");

// The one that sent people in circles: "invalid" appears in password
// complaints too, and "this link has expired" is a terrible answer to one.
check(!/link has expired/i.test(say({ message: "Invalid password format", status: 422 })),
  "a bare 'invalid' is NOT reported as an expired link");

// Nothing here may talk about signing in. They are already signed in; that is
// the whole reason this form is on screen.
var all = [
  say({ message: "Password should be at least 6 characters.", status: 422 }),
  say({ message: "Password is known to be weak", status: 422 }),
  say({ message: "For security purposes, you can only request this after 18 seconds.", status: 429 }),
  say({ message: "Failed to fetch", name: "AuthRetryableFetchError" }),
  say({ message: "invalid JWT: token is expired", status: 401 }),
  say({ message: "something nobody has seen", status: 500 }),
  say({}), say(null),
].join(" | ");
check(!/sign you in|signing in|sign in again/i.test(all),
  "no message on this form talks about signing in");
check(!/undefined|null|\[object/i.test(all), "and none of them leaks a raw value");

check(/couldn't save that password/i.test(say({ message: "something nobody has seen", status: 500 })),
  "an unrecognised failure still says the password was not saved");
check(typeof say(null) === "string" && say(null).length > 0, "a null error still produces something to show");
check(typeof say({}) === "string" && say({}).length > 0, "so does an error with no message or status");
