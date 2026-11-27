// Signing out left the member's whole training history on the device
// (tester T-88).
//
// The session ended and the small profile cache went, and everything else
// stayed exactly where it was. On one browser the tester counted 17 keys,
// about 32 KB, belonging to an account that had signed out months earlier:
// completions, daily stats, check-ins, habits, notebook notes, benchmarks,
// equipment, saved workouts. None of it was ever SHOWN to the next member —
// every read goes through memberKey() — so this was never a data mix-up. It is
// that a shared phone, a borrowed tablet or a gym iPad kept the last person's
// history after they had signed out and believed they were gone.
//
// The one thing a privacy sweep must never do is take work that exists only on
// this device. These checks drive the real signOut(), the real sweep and the
// real discardLocalMemberData() against a fake storage, and the dirty case is
// checked in both directions.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

var SYNC = readFile("../../sync.js");
var CLIENT = readFile("../../supabase-client.js");
var APP = readFile("../../app.js");
function liftFrom(src, name, what) {
  var at = src.indexOf("function " + name + "(");
  if (at < 0) at = src.indexOf("async function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from " + what);
  if (src.slice(at - 6, at) === "async ") at -= 6;
  var depth = 0;
  for (var i = src.indexOf("{", src.indexOf("(", at)); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  throw new Error("could not find the end of " + name + "()");
}

// ---------------- the device ----------------
// run.sh loads mock-supabase.js and the REAL sync.js before this file, so the
// storage, the dirty queue and the sweep itself are the real ones. Nothing
// here redeclares them; it only puts things on the device and takes the member
// in and out.
var MINE = "209ce209-67ef-4c2a-9424-238a1802e465";
var THEIRS = "7c1d4b02-aa31-4f55-9b60-1e2f3a4b5c6d";
var AUTH_CACHE_KEY = "burnclub-auth-cache";
var AUTH_PROGRAM = { id: "fit-functional" };
var SIGNING_OUT = false;

// ---------------- just enough auth to run the real signOut ----------------
var ABANDONED = 0, EVENTS = [], AUTH_CACHE_CLEARED = 0, SESSION_ENDED = 0;
function abandonAuthLoad() { ABANDONED++; }
function logAuthEvent(kind, why) { EVENTS.push(kind + ": " + why); }
function clearAuthCache() { AUTH_CACHE_CLEARED++; localStorage.removeItem(AUTH_CACHE_KEY); }
SB.auth = { signOut: function () { SESSION_ENDED++; return Promise.resolve(); } };
eval(liftFrom(CLIENT, "signOut", "supabase-client.js"));

// ---------------- a device with two members' data on it ----------------
var MY_KEYS = [
  "burnclub-completions-" + MINE,
  "burnclub-daily-stats-" + MINE,
  "burnclub-checkins-" + MINE,
  "burnclub-habits-" + MINE,
  "burnclub-notes-" + MINE,
  "burnclub-benchmark-results-" + MINE,
  "burnclub-equipment-" + MINE,
  "burnclub-saved-workouts-" + MINE,
  "burnclub-in-progress-" + MINE,
  "burnclub-epoch-" + MINE,
];
var THEIR_KEYS = [
  "burnclub-completions-" + THEIRS,
  "burnclub-daily-stats-" + THEIRS,
  "burnclub-checkins-" + THEIRS,
];
function setUpDevice(dirtyStores) {
  DEVICES.phone = new Store();
  onDevice("phone");
  SYNC_STATE.queue.clear();
  AUTH_MEMBER = { id: MINE };
  ABANDONED = 0; EVENTS = []; AUTH_CACHE_CLEARED = 0; SESSION_ENDED = 0;
  MY_KEYS.forEach(function (k) { localStorage.setItem(k, "mine:" + k); });
  THEIR_KEYS.forEach(function (k) { localStorage.setItem(k, new Array(400).join("x")); });
  localStorage.setItem(SCHEDULED_ITEMS_STORAGE_PREFIX + MINE, "[]");
  localStorage.setItem(SCHEDULED_ITEMS_STORAGE_PREFIX + THEIRS, "[]");
  var health = {}; health[MINE] = { weight: 1 }; health[THEIRS] = { weight: 2 };
  localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify(health));
  localStorage.setItem(AUTH_CACHE_KEY, "cached profile");
  localStorage.setItem("sb-nuszxjopsxwpywojbrdw-auth-token", "the session itself");
  localStorage.setItem("burnclub-theme", "dark");          // device-wide, nobody's
  if (dirtyStores) localStorage.setItem(dirtyKey(), JSON.stringify(dirtyStores));
}
function has(k) { return localStorage.getItem(k) !== null; }
function mineLeft() { return MY_KEYS.filter(has); }
function theirsLeft() { return THEIR_KEYS.filter(has); }

(async function () {
  try {
    print("\n-- a clean sign-out takes the data with it --");
    setUpDevice(null);
    check(mineLeft().length === MY_KEYS.length, "set up: ten of this member's stores are on the device");
    var forgot = await signOut();
    check(mineLeft().length === 0, "every one of them is gone (left: " + mineLeft().join(", ") + ")");
    check(forgot.cleared > 0, "and the sign-out says how much it took (got " + forgot.cleared + ")");
    check(forgot.kept.length === 0, "with nothing held back");
    check(!has(SCHEDULED_ITEMS_STORAGE_PREFIX + MINE),
      "the scheduled items, which are not keyed like the rest, go too");
    check(!has("burnclub-in-progress-" + MINE),
      "and so does a workout left part-way through");

    print("\n-- and takes nothing that is not theirs --");
    check(theirsLeft().length === THEIR_KEYS.length,
      "the other account's data is untouched (left: " + theirsLeft().length + " of " + THEIR_KEYS.length + ")");
    check(localStorage.getItem(SCHEDULED_ITEMS_STORAGE_PREFIX + THEIRS) === "[]", "including their scheduled items");
    check(localStorage.getItem("burnclub-theme") === "dark", "a device-wide setting belongs to the device, not to anyone");
    var health = JSON.parse(localStorage.getItem(LIVE_HEALTH_PROFILES_KEY));
    check(health[MINE] === undefined, "the member's entry in the shared health object is removed");
    check(health[THEIRS] !== undefined, "and the other member's is left exactly where it was");

    print("\n-- the session still ends, which was always the point --");
    check(SESSION_ENDED === 1, "the Supabase session is ended");
    check(AUTH_CACHE_CLEARED === 1, "the cached profile is cleared");
    check(ABANDONED === 1, "and a profile lookup still in flight is abandoned first (T-38)");
    check(localStorage.getItem("sb-nuszxjopsxwpywojbrdw-auth-token") === "the session itself",
      "the sign-in key is left to Supabase to remove, never swept by hand");

    print("\n-- never anything that has not reached the server --");
    setUpDevice(["completions"]);
    var held = await signOut();
    check(mineLeft().length === MY_KEYS.length,
      "with one store still waiting to upload, nothing is cleared (left: " + mineLeft().length + ")");
    check(held.cleared === 0, "and the sweep says it took nothing");
    check(held.kept.indexOf("completions") !== -1,
      "naming what is still on the device (got " + JSON.stringify(held.kept) + ")");
    check(SESSION_ENDED === 1, "the member is still signed out — the data is kept, not the session");

    setUpDevice(null);
    SYNC_STATE.queue.add("daily-stats");
    var queued = await signOut();
    check(queued.cleared === 0 && mineLeft().length === MY_KEYS.length,
      "a push still in the in-memory queue counts as unsynced too");
    check(queued.kept.indexOf("daily-stats") !== -1, "and is named as well");

    print("\n-- the forced sign-out leaves the device alone --");
    // The server rejecting a session is not the member choosing to leave this
    // phone. T-13: signing someone out on a bad day already strands them.
    setUpDevice(null);
    var forced = await signOut({ keepLocalData: true });
    check(mineLeft().length === MY_KEYS.length, "nothing is cleared when the sign-out was not asked for");
    check(forced.cleared === 0, "and it says so");
    check(SESSION_ENDED === 1, "while still ending the session");

    print("\n-- the sweep runs while the member is still known --");
    // It is keyed by their id, so running it after AUTH_MEMBER is cleared
    // would silently do nothing. Proved by it having worked at all above, and
    // again here with the order made visible.
    setUpDevice(null);
    var sawMember = null;
    var realSweep = forgetThisDeviceOnSignOut;
    forgetThisDeviceOnSignOut = function () { sawMember = AUTH_MEMBER && AUTH_MEMBER.id; return realSweep(); };
    await signOut();
    forgetThisDeviceOnSignOut = realSweep;
    check(sawMember === MINE, "the sweep sees the member it is about to forget (got " + sawMember + ")");
    check(AUTH_MEMBER === null, "and the member is cleared afterwards");

    print("\n-- explaining a sweep must never break a sign-out --");
    setUpDevice(null);
    forgetThisDeviceOnSignOut = function () { throw new Error("the sweep is broken"); };
    var broke = await signOut();
    forgetThisDeviceOnSignOut = realSweep;
    check(SESSION_ENDED === 1, "with the sweep throwing, the session still ends");
    check(AUTH_MEMBER === null, "and the member is still signed out");
    check(broke.kept.length > 0, "and it does not claim to have cleared anything");

    print("\n-- what is already on the device can at least be seen --");
    setUpDevice(null);
    var other = otherAccountDataOnDevice();
    check(other !== "none", "a device carrying another account's data says so (got " + other + ")");
    check(other.indexOf("4 items") === 0,
      "counting their keys, including their scheduled items (got " + other + ")");
    check(/KB/.test(other), "with a size, so it is a fact and not a feeling (got " + other + ")");
    check(other.indexOf(THEIRS) === -1, "and without naming the account (got " + other + ")");
    AUTH_MEMBER = { id: THEIRS };
    check(otherAccountDataOnDevice().indexOf("11 items") === 0,
      "signed in as the other one, it is this member's data that is the leftover (got "
      + otherAccountDataOnDevice() + ")");

    // The invariant that makes the number worth printing: what it reports is
    // exactly what a sweep would take. Counted as THEIRS, then swept as MINE.
    AUTH_MEMBER = { id: MINE };
    var saidItems = Number(/^(\d+)/.exec(otherAccountDataOnDevice.call(null, AUTH_MEMBER = { id: THEIRS }) || "0")[1]);
    AUTH_MEMBER = { id: MINE };
    var tookItems = discardLocalMemberData();
    check(saidItems === tookItems,
      "the count and the sweep agree exactly: said " + saidItems + ", took " + tookItems);
    // Not even one key with an unusual prefix may fall between them.
    setUpDevice(null);
    localStorage.setItem("burnClubMyEquipment-" + MINE, "[]");
    AUTH_MEMBER = { id: THEIRS };
    var withOddKey = Number(/^(\d+)/.exec(otherAccountDataOnDevice())[1]);
    AUTH_MEMBER = { id: MINE };
    check(withOddKey === discardLocalMemberData(),
      "including the equipment list, whose key does not begin with burnclub-");
    AUTH_MEMBER = { id: MINE };
    DEVICES.phone = new Store(); onDevice("phone");
    localStorage.setItem("burnclub-theme", "dark");
    localStorage.setItem("sb-x-auth-token", "s");
    check(otherAccountDataOnDevice() === "none",
      "a device with only settings on it has nothing to report (got " + otherAccountDataOnDevice() + ")");

    print("\n-- wired where it has to be --");
    var forcedCall = APP.slice(APP.indexOf("await signOut({"), APP.indexOf("await signOut({") + 240);
    check(/keepLocalData: true/.test(forcedCall),
      "the forced sign-out asks to keep the data");
    check(/reason:/.test(forcedCall),
      "and says why, so it is not logged as the member's choice (tester T-46)");
    check((APP.match(/await signOut\(\)/g) || []).length >= 1,
      "and the deliberate ones do not, so the sweep is what happens by default");
    check(/Some work hasn't backed up yet/.test(APP),
      "Log Out says when the data was kept rather than cleared");
    check(/was removed from this device/.test(APP),
      "and says when it was taken");
    check(/add\("Other accounts on this device"/.test(CLIENT),
      "the diagnostics panel reports what an older sign-out left behind");

    print("\n-- who decided --");
    // Every sign-out was logged as "member chose to sign out", including the
    // one that is not a choice: a 401 on entry, where the server has refused
    // the session and the app signs them out on its behalf. That hid exactly
    // the members the Sign-In Trouble panel exists to show (tester T-46, and
    // again in T-50) - and unexplained failures nobody could see are what the
    // first trial died of.
    EVENTS.length = 0;
    await signOut();
    check(EVENTS.some(function (e) { return e.indexOf("signed_out: member chose to sign out") === 0; }),
      "a member who taps Sign out is logged as having chosen it");
    check(!EVENTS.some(function (e) { return e.indexOf("session_lost") === 0; }),
      "and is NOT reported as trouble, which would bury the real ones");

    EVENTS.length = 0;
    await signOut({ keepLocalData: true, reason: "the server refused this session \u2014 401" });
    check(EVENTS.some(function (e) { return e.indexOf("session_lost") === 0; }),
      "a sign-out the server forced is logged as a session lost (got " + JSON.stringify(EVENTS) + ")");
    check(!EVENTS.some(function (e) { return e.indexOf("member chose") !== -1; }),
      "and never as the member's choice");
    check(EVENTS.join(" ").indexOf("401") !== -1,
      "with the server's own reason attached, which is the whole point of the panel");
    check(EVENTS.filter(function (e) { return e.indexOf("session_lost") === 0; }).length === 1,
      "logged once, not twice - the listener is suppressed while SIGNING_OUT is set");

    // admin has to be willing to show it. session_lost was chosen over a new
    // event name precisely because it already is.
    var ADMIN = readFile("../../admin/app.js");
    check(/AUTH_TROUBLE[\s\S]{0,200}"session_lost"/.test(ADMIN),
      "admin counts session_lost as trouble");
    check(/session_lost: "Signed out unexpectedly"/.test(ADMIN),
      "and has a label a human can read for it");
  } catch (err) {
    check(false, "the test itself threw: " + err);
  }
  print("\n" + pass + " passed   " + fail + " failed");
})();
