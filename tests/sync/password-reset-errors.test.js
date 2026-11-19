// What a member is told when "Forgot your password?" doesn't work (T-12).
//
// The old version answered "a reset link is on its way" for everything except
// a rate limit, so someone with no signal waited for an email that was never
// sent. Two things were being hidden and only one of them on purpose: hiding
// WHICH ADDRESSES ARE MEMBERS is deliberate, because answering that turns the
// login form into a membership check for anyone who finds it. Hiding "you are
// offline" was an accident.
//
// So the line this file holds is: every message below describes the REQUEST,
// and none of them describes the ACCOUNT. If a future message starts saying
// something about whether the address is a member, the last check fails.
//
// resetError() is lifted out of the real supabase-client.js rather than copied
// here, because a copy would keep passing after the shipped version changed.
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

var SRC = readFile("../../supabase-client.js");
var start = SRC.indexOf("function resetError(");
if (start < 0) throw new Error("resetError() is gone from supabase-client.js");
var depth = 0, end = -1;
for (var i = SRC.indexOf("{", start); i < SRC.length; i++) {
  if (SRC[i] === "{") depth++;
  else if (SRC[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
}
eval(SRC.slice(start, end));

function say(error) { return resetError(error); }

// Supabase sends this for a second tap within a minute. A member who taps four
// times because nothing appeared to happen hits it, and then cannot try again
// for a minute on the one screen where they are already stuck.
check(/wait a minute/i.test(say({ message: "For security purposes, you can only request this after 54 seconds.", status: 429 })),
  "a second tap inside the limit says to wait, not that a link is coming");
check(/wait a minute/i.test(say({ message: "email rate limit exceeded", status: 429 })),
  "so does the hourly send limit");

// The commonest real cause, and the one the old code hid completely.
check(/connection/i.test(say({ message: "Failed to fetch", name: "AuthRetryableFetchError", status: 0 })),
  "a dropped request blames the connection");
check(/connection/i.test(say({ message: "NetworkError when attempting to fetch resource." })),
  "and so does the Firefox wording for the same thing");

check(/typos/i.test(say({ message: "Unable to validate email address: invalid format", status: 422 })),
  "an address the server refuses is sent back to be checked");

// Theirs to wait out, not theirs to fix — so don't tell them to try again now.
var smtp = say({ message: "Error sending recovery email", status: 500 });
check(/our end/i.test(smtp), "a mail failure says it is our end");
check(/coach/i.test(smtp), "and offers the way round it");

// The important one: something nobody has seen before must still not be
// reported as success.
var unknown = say({ message: "something nobody has seen before", status: 418 });
check(/couldn't send/i.test(unknown), "an unrecognised failure still says it failed");
check(!/on its way/i.test(unknown), "and never claims a link is coming");

// Nothing here may describe the account. This is the deliberate secret.
var all = [
  say({ message: "For security purposes, you can only request this after 54 seconds.", status: 429 }),
  say({ message: "Failed to fetch", name: "AuthRetryableFetchError" }),
  say({ message: "Unable to validate email address: invalid format", status: 422 }),
  say({ message: "Error sending recovery email", status: 500 }),
  say({ message: "something nobody has seen before", status: 418 }),
  say(null), say(undefined), say({}),
].join(" | ");
check(!/not a member|no account|doesn't exist|does not exist|unknown user|not found|isn't registered/i.test(all),
  "no message says whether the address belongs to a member");

// A malformed error object is the shape a classifier usually dies on, and this
// one runs on the screen a member is already stuck on.
check(typeof say(null) === "string" && say(null).length > 0, "a null error still produces something to show");
check(typeof say({}) === "string" && say({}).length > 0, "so does an error with no message or status");
