// "Your workouts are saved on this phone but aren't backing up" — on a perfect
// connection, to a member whose workouts were backing up fine (tester T-97).
//
// My own regression, shipped the same evening as the fix that caused it. T-50
// made pushStore() refuse a replacing store on a device that has never pulled.
// It refused by returning `false`, and drainSyncQueue() could only tell two
// things apart: it worked, or the request failed. So a deliberate hold counted
// as a failed request - SYNC_STATE.online flipped to false, markUnsynced()
// started the "not backing up" clock, and the fifth one showed the member that
// message. `preferences` is a replacing store and the "tour seen" flag queues
// it, so a brand new member met this in their first few minutes.
//
// REPRODUCED BY THE TESTER on the live site, signed in, navigator.onLine true,
// with pushStore('completions') returning true the whole time: five drains,
// SYNC_STATE.failures = 5, and the toast captured word for word.
//
// Two halves:
//
//   * pushStore returns PUSH_HELD, which is neither. The store stays dirty and
//     queued and NOTHING else happens - no offline flag, no clock, no warning.
//   * the hold is now per STORE. deviceHasHydrated() is only true when a whole
//     pull finished with no errors in any of about fourteen queries, so one
//     slow table left a phone holding its lists indefinitely. What matters is
//     whether this device has read THAT list.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }
async function settle() {
  for (var i = 0; i < 80; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; }
}

var SYNC = readFile("../../sync.js");
var SYNCCODE = SYNC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function staleClock() { return localStorage.getItem("burnclub-sync-stale-since-chris"); }

(async function () {
  onDevice("phone");

  // ---------------- a device that has never pulled ----------------

  check(deviceHasHydrated() === false, "set up: this device has never completed a pull");
  check(devicePulled("showcasedPRs") === false, "and has never read the pinned-PR list");
  check(devicePulled("completions") === false, "set up: nor the completions list");

  check(await pushStore("showcasedPRs") === PUSH_HELD,
    "a replacing store is HELD, not failed (got " + JSON.stringify(await pushStore("showcasedPRs")) + ")");
  check(await pushStore("completions") === true,
    "while a merging store goes up as normal - workouts really are backing up");

  // ---------------- and the member is not told their backup is broken ------

  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Back Squat"]));
  markDirty("showcasedPRs");                 // the member pinned it HERE
  TOASTS = [];
  SYNC_STATE.failures = 0;
  clearUnsynced();
  navigator.onLine = true;
  for (var i = 0; i < 6; i++) { SYNC_STATE.queue.add("showcasedPRs"); await drainSyncQueue(); }

  check(TOASTS.length === 0,
    "six drains of a held store say NOTHING to the member (got " + JSON.stringify(TOASTS) + ")");
  check((SYNC_STATE.failures || 0) === 0,
    "nothing is counted as a failure (got " + SYNC_STATE.failures + ")");
  check(SYNC_STATE.online !== false,
    "and the app does not decide it is offline on a working connection");
  check(loadDirty().has("showcasedPRs"),
    "the pin is still marked unsynced, because it genuinely has not gone up");
  check(SYNC_STATE.queue.has("showcasedPRs"), "and is still queued for another go");
  // The clock is deliberately NOT started by a hold, and this is the line I
  // got wrong first. Its message is "Your workouts haven't backed up for N
  // days" - and the member's workouts are backing up fine; it is their pins
  // that are waiting. Starting it here would be the same category error as
  // T-97 itself: a frightening sentence about the wrong thing. A hold lifts
  // on the next successful pull of that list, and a device that has not
  // pulled in a day has a real failure that the other path is already
  // flagging.
  check(staleClock() === null,
    "the 'not backed up for N days' clock is NOT started by a hold (got "
    + JSON.stringify(staleClock()) + ")");

  // But a clock already running is left alone: something of theirs really is
  // not on the server, whichever path put it there.
  localStorage.setItem("burnclub-sync-stale-since-chris", String(Date.now()));
  SYNC_STATE.queue.add("showcasedPRs"); await drainSyncQueue();
  check(staleClock() !== null, "and a clock already running is not stopped by one either");
  clearUnsynced();

  // A real failure still behaves like one. The warning has to survive this.
  // Completions go up by UPSERT. Breaking `insert` broke nothing and the
  // check passed for the wrong reason until this was corrected.
  var realUpsert = Q.prototype.upsert;
  Q.prototype.upsert = function () { return Promise.resolve({ error: { message: "Failed to fetch" } }); };
  TOASTS = [];
  SYNC_STATE.failures = 0;
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([
    { id: "local-x", title: "A workout", date: "2026-11-26", minutes: 20 },
  ]));
  for (var j = 0; j < 5; j++) { SYNC_STATE.queue.add("completions"); await drainSyncQueue(); }
  Q.prototype.upsert = realUpsert;
  check(SYNC_STATE.failures === 5, "a genuinely failing push still counts (got " + SYNC_STATE.failures + ")");
  check(TOASTS.some(function (t) { return /aren't backing up/.test(t); }),
    "and the member is still warned when something is actually wrong (got "
    + JSON.stringify(TOASTS) + ")");

  // ---------------- the hold lifts per store, not per perfect pull ---------
  // deviceHasHydrated() needs a whole pull with no errors anywhere. One slow
  // table used to leave every list held indefinitely.

  onDevice("pc");
  check(deviceHasHydrated() === false && devicePulled("showcasedPRs") === false,
    "set up: a second device, nothing pulled");
  markPulled("showcasedPRs");
  check(devicePulled("showcasedPRs") === true, "reading one list marks that one");
  check(devicePulled("notebookNotes") === false, "and only that one");
  check(await pushStore("showcasedPRs") !== PUSH_HELD,
    "so pins may now be replaced from here");
  check(await pushStore("notebookNotes") === PUSH_HELD,
    "while notes, which this device has still never read, are held");
  check(deviceHasHydrated() === false,
    "and none of that needed a flawless whole-account pull");

  // A device that DID hydrate cleanly before this set existed is covered.
  DEVICES.old = new Store();
  localStorage = DEVICES.old;
  localStorage.setItem(memberKey("burnclub-hydrated"), "1");
  check(devicePulled("notebookNotes") === true,
    "a phone that completed a clean pull before the per-store set existed counts as having read everything");
  check(await pushStore("notebookNotes") !== PUSH_HELD, "so nothing of theirs is held");

  // ---------------- a real pull marks the stores it read ----------------

  // With real rows on the server for both kinds of store, or the marking is
  // only ever exercised on the empty-server path - which is how two mutants
  // that deleted the marking outright survived the first time round.
  onDevice("phone");
  localStorage.setItem(memberKey("burnclub-hydrated"), "1");
  localStorage.setItem(memberKey(SAVED_WORKOUTS_KEY),
    JSON.stringify([{ id: "w1", title: "One" }, { id: "w2", title: "Two" }]));
  NOTEBOOK_NOTES = { coach: ["Elbows tucked"], other: ["Felt strong"] };
  localStorage.setItem(memberKey(NOTEBOOK_NOTES_KEY), JSON.stringify(NOTEBOOK_NOTES));
  queueSync("savedWorkouts"); queueSync("notebookNotes"); await settle();
  check(tbl("saved_workouts").length === 2 && tbl("notebook_notes").length === 2,
    "set up: a registry list and a nested list, both with rows on the server");

  onDevice("pc");
  localStorage.removeItem(memberKey("burnclub-pulled"));
  localStorage.removeItem(memberKey("burnclub-hydrated"));
  check(devicePulled("savedWorkouts") === false, "set up: back to nothing read");
  await hydrateMemberData(); await settle();
  // With the hydrated flag taken away again, so this can only pass on the
  // per-store set. It passed on the fallback until a mutant pointed that out.
  localStorage.removeItem(memberKey("burnclub-hydrated"));
  check(deviceHasHydrated() === false, "set up: and the whole-pull flag put back to false");
  var marked = JSON.parse(localStorage.getItem(memberKey("burnclub-pulled")) || "[]");
  check(marked.indexOf("savedWorkouts") !== -1,
    "after a pull, a registry list it read is written down (got " + JSON.stringify(marked) + ")");
  check(marked.indexOf("notebookNotes") !== -1,
    "and so is a nested one - two copies of the same decision, both checked");
  check(devicePulled("savedWorkouts") === true,
    "so that store counts as read on its own");
  check(await pushStore("savedWorkouts") !== PUSH_HELD,
    "and is no longer held");

  // ---------------- an empty server IS an answer, and lifts the hold ------
  // The whole loop, on the case a new account actually hits: the member pins
  // something before this phone has read the list, the push is held, the pull
  // finds the server has no pins, and that counts as having read it - so the
  // next push lands. Without the marking on that path the hold never lifts
  // and the pin stays on the phone for ever, which is the half of T-97 about
  // things genuinely not backing up.

  DEVICES.brandnew = new Store();
  localStorage = DEVICES.brandnew;
  check(deviceHasHydrated() === false && devicePulled("showcasedPRs") === false,
    "set up: a phone that has read nothing");
  // Cleared directly: an earlier section left a pin up there once the phone
  // had hydrated, and this case is specifically about an EMPTY server.
  SERVER["showcased_prs"] = [];
  check(tbl("showcased_prs").length === 0, "set up: and a server with no pins on it");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Deadlift"]));
  markDirty("showcasedPRs");
  SYNC_STATE.queue.clear();

  check(await pushStore("showcasedPRs") === PUSH_HELD, "the pin is held, as it should be");
  await hydrateMemberData(); await settle();
  // The whole-pull flag taken away again, or `devicePulled` answers from the
  // fallback and this section proves nothing about the empty-server path.
  // Two mutants survived on exactly that before this line existed.
  localStorage.removeItem(memberKey("burnclub-hydrated"));
  check(devicePulled("showcasedPRs") === true,
    "the pull read the list - it was empty - so the hold lifts, on its own");
  var pinsNow = JSON.parse(localStorage.getItem(memberKey(SHOWCASED_PRS_KEY)) || "[]");
  check(pinsNow.join(",") === "Deadlift",
    "the member's pin is still on the phone (got " + JSON.stringify(pinsNow) + ")");
  SYNC_STATE.queue.add("showcasedPRs"); await drainSyncQueue(); await settle();
  check(tbl("showcased_prs").map(function (r) { return r.exercise_name; }).join(",") === "Deadlift",
    "and the next push lands it on the server (got "
    + JSON.stringify(tbl("showcased_prs").map(function (r) { return r.exercise_name; })) + ")");
  check(!loadDirty().has("showcasedPRs"), "with nothing left unsynced");
  onDevice("phone");

  // ---------------- said in the source ----------------

  check(SYNCCODE.indexOf('const PUSH_HELD = "held";') !== -1,
    "there is a third answer, named");
  check(/if \(ok === PUSH_HELD\) held\.push\(name\);/.test(SYNCCODE),
    "the drain tells it from a failure");
  check(/if \(results\[n\] === PUSH_HELD\) \{ SYNC_STATE\.queue\.add\(n\); continue; \}/.test(SYNCCODE),
    "and so does reconcile, which must not clear the dirty flag for one");
  var drain = SYNCCODE.slice(SYNCCODE.indexOf("let failed = [];"), SYNCCODE.indexOf("async function pushStore"));
  check(drain.indexOf("if (!held.length) clearUnsynced();") !== -1,
    "a held store does not stop the clock it is the reason for");
  check(SYNCCODE.indexOf("function devicePulled(name) { return deviceHasHydrated() || pulledStores().has(name); }") !== -1,
    "and an older device that hydrated cleanly still counts as having read everything");
  // One mark per pull loop, the moment the fetch came back - not one per
  // branch. It was five places (three in the registry loop, two in the
  // nested one) and two of them went uncovered until a mutant walked
  // through them; the branches are not the thing that decides this.
  check((SYNCCODE.match(/markPulled\(name\);/g) || []).length === 2,
    "a store is marked read in exactly two places, one per pull (found "
    + (SYNCCODE.match(/markPulled\(name\);/g) || []).length + ")");
  check(SYNCCODE.indexOf('if (error) { report[name] = "error: " + error.message; return; }\n    markPulled(name);') !== -1
     || /if \(error\) \{ report\[name\] = "error: " \+ error\.message; return; \}\s*\n\s*markPulled\(name\);/.test(SYNCCODE),
    "and only after the fetch came back without an error");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
