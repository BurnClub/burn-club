// A device that had never pulled could delete the member's lists off the
// server (tester T-50, reported as Suspected - "I could not make it fire").
// It fires.
//
// A REPLACING store pushes by deleting every row the member has in that table
// and inserting this device's list. The dirty flag is what makes that safe: a
// device may only replace a list it actually edited. But a device that has
// never completed a pull has not edited the member's list - it has built one
// in ignorance of it.
//
// REPRODUCED against the real sync.js before the fix:
//
//   server after the old phone pushed:   3 rows   (w1, w2, w3)
//   new device hydrated?                 false
//   member taps Save on one workout
//   server after the new phone pushed:   1 row    -> ["w9"]
//
// Two of the member's saved workouts, deleted by a phone that had never seen
// the list. The same shape covers pinned PRs, habits and notebook notes.
//
// The fix is two halves, and either alone is worse than useless:
//
//   * a replacing store does not push while the device has never pulled;
//   * and on the FIRST pull, a dirty replacing store takes the server's copy
//     instead of being protected.
//
// Without the second half the two guards deadlock: the dirty flag makes the
// pull skip the store, and never-pulled makes the push refuse it, so the list
// is stuck on the phone for ever.
//
// The member loses the one thing they saved before that phone had ever
// synced. Nothing already on the server is lost. Chris's call, 2026-11-26,
// over merging the two lists - merging needs per-store identity rules and is
// the two-device conflict work he has parked.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }
async function settle() {
  for (var i = 0; i < 80; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; }
}

var SYNC = readFile("../../sync.js");
var SYNCCODE = SYNC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function savedIds() {
  return tbl("saved_workouts").map(function (r) { return r.workout_id; }).sort();
}
function localSaved() {
  return JSON.parse(localStorage.getItem(memberKey(SAVED_WORKOUTS_KEY)) || "[]")
    .map(function (w) { return w.id; }).sort();
}
function setLocalSaved(ids) {
  localStorage.setItem(memberKey(SAVED_WORKOUTS_KEY),
    JSON.stringify(ids.map(function (id) { return { id: id, title: id.toUpperCase() }; })));
}

(async function () {
  // ---------------- the member's phone, which has synced ----------------
  onDevice("phone");
  localStorage.setItem(memberKey("burnclub-hydrated"), "1");
  setLocalSaved(["w1", "w2", "w3"]);
  queueSync("savedWorkouts"); await settle();
  check(savedIds().join(",") === "w1,w2,w3",
    "set up: three saved workouts on the server (" + JSON.stringify(savedIds()) + ")");

  // ---------------- a new phone that has never pulled ----------------
  onDevice("pc");
  check(deviceHasHydrated() === false, "set up: the new device has never completed a pull");
  setLocalSaved(["w9"]);                       // the member taps Save on one
  queueSync("savedWorkouts"); await settle();

  check(savedIds().join(",") === "w1,w2,w3",
    "the member's three saved workouts are still on the server (" + JSON.stringify(savedIds()) + ")");
  check(savedIds().indexOf("w9") === -1,
    "and the new phone's list has NOT been made the truth");
  check(loadDirty().has("savedWorkouts"),
    "the edit is held, not thrown away - it is still dirty and will be retried");

  // ---------------- and the hold does not become a deadlock ----------------
  // The dirty flag makes a pull skip a store; never-pulled makes a push
  // refuse it. Without the first pull taking the server's copy, this list
  // would be stuck on this phone for ever.

  var rep = await hydrateMemberData();
  check(rep && rep.report && /first pull|rows/.test(String(rep.report.savedWorkouts)),
    "the first pull reads the store rather than skipping it (got "
    + JSON.stringify(rep && rep.report && rep.report.savedWorkouts) + ")");
  check(localSaved().join(",") === "w1,w2,w3",
    "this device now holds the member's real list (" + JSON.stringify(localSaved()) + ")");
  check(!loadDirty().has("savedWorkouts"),
    "and is no longer claiming an edit, so nothing is stuck");
  check(deviceHasHydrated() === true, "the device has pulled now");
  await settle();
  check(savedIds().join(",") === "w1,w2,w3",
    "with the server untouched throughout (" + JSON.stringify(savedIds()) + ")");

  // ---------------- once it HAS pulled, it behaves normally ----------------

  setLocalSaved(["w1", "w2", "w3", "w9"]);
  queueSync("savedWorkouts"); await settle();
  check(savedIds().join(",") === "w1,w2,w3,w9",
    "a save made after the first pull reaches the server and keeps the rest ("
    + JSON.stringify(savedIds()) + ")");

  setLocalSaved(["w1", "w3", "w9"]);           // and unsaving still deletes
  queueSync("savedWorkouts"); await settle();
  check(savedIds().join(",") === "w1,w3,w9",
    "and unsaving one still removes it, which is what a replacing store is for ("
    + JSON.stringify(savedIds()) + ")");

  // ---------------- the opposite mistake, which must not be made ----------
  // A MERGING store upserts: a dirty one goes up and nothing is lost by
  // waiting. Overwriting those on a first pull would throw away a workout the
  // member did offline on a new phone, which is worse than the bug.

  onDevice("phone");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([
    { id: "local-old", title: "From the old phone", date: "2026-11-20", minutes: 30 },
  ]));
  queueSync("completions"); await settle();

  DEVICES.tablet = new Store();
  localStorage = DEVICES.tablet;               // a third device, never pulled
  check(deviceHasHydrated() === false, "set up: a third device, never pulled");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([
    { id: "local-offline", title: "Done offline before it ever synced", date: "2026-11-26", minutes: 24 },
  ]));
  queueSync("completions"); await settle();
  var served = tbl("completions").map(function (c) { return c.client_id || c.id; });
  check(served.indexOf("local-offline") !== -1,
    "a workout done on a never-pulled device still reaches the server ("
    + JSON.stringify(served) + ")");
  check(served.indexOf("local-old") !== -1, "and the old phone's is still there too");

  // ---------------- a device that HAS pulled keeps its edits ----------------
  // The protection this narrows must still work where it was meant to.

  onDevice("phone");
  setLocalSaved(["w1"]);                       // an edit that has not synced
  markDirty("savedWorkouts");
  // The push has to keep failing, or reconcile sends it before the pull runs
  // and there is no dirty store left for the pull to protect.
  var realInsert2 = Q.prototype.insert;
  Q.prototype.insert = function (rows) {
    if (this.t === "saved_workouts") return Promise.resolve({ error: { message: "Failed to fetch" } });
    return realInsert2.call(this, rows);
  };
  var rep2 = await hydrateMemberData();
  Q.prototype.insert = realInsert2;
  check(String(rep2.report.savedWorkouts).indexOf("unsynced local edit") !== -1,
    "a dirty list on a device that has pulled before is still protected from the pull (got "
    + JSON.stringify(rep2.report.savedWorkouts) + ")");
  check(localSaved().join(",") === "w1", "and keeps what the member did here");

  // ---------------- and an EMPTY server must not wipe anything ------------
  // The near-miss that nearly shipped. The pull treats an empty table as a
  // real answer for a replacing store - "the member has no pins" - and the
  // comment there says why that is safe: a dirty store could never reach it.
  // Taking the protection away on a first pull walked a dirty store straight
  // into that branch, and the first version of this fix deleted notes written
  // offline on a new phone. There is nothing to win from an empty server.

  DEVICES.fresh = new Store();
  localStorage = DEVICES.fresh;
  check(deviceHasHydrated() === false, "set up: another device that has never pulled");
  var written = { coach: ["Keep elbows tucked"], other: ["Felt strong"] };
  localStorage.setItem(memberKey(NOTEBOOK_NOTES_KEY), JSON.stringify(written));
  NOTEBOOK_NOTES = written;
  markDirty("notebookNotes");
  SYNC_STATE.queue.clear();
  check(tbl("notebook_notes").length === 0, "set up: and the server has no notes at all");

  var realInsert = Q.prototype.insert;
  Q.prototype.insert = function (rows) {
    if (this.t === "notebook_notes") return Promise.resolve({ error: { message: "offline" } });
    return realInsert.call(this, rows);
  };
  var rep3 = await hydrateMemberData(); await settle();
  Q.prototype.insert = realInsert;

  var kept = JSON.parse(localStorage.getItem(memberKey(NOTEBOOK_NOTES_KEY)) || '{"coach":[],"other":[]}');
  check(kept.coach.length === 1 && kept.other.length === 1,
    "notes written on a never-pulled phone survive a pull from an empty server (got "
    + JSON.stringify(kept) + ")");
  check(loadDirty().has("notebookNotes"),
    "and are still marked unsynced, so they go up when there is a connection");
  check(String(rep3.report.notebookNotes).indexOf("kept") !== -1,
    "and the report says so (got " + JSON.stringify(rep3.report.notebookNotes) + ")");

  // The notes above go through the NESTED pull. The registry pull is a second
  // copy of the same decision, and a mutant walked through it while this
  // section only covered the first - so both are checked. Pinned PRs are a
  // registry replacing store and nothing here has ever pushed one.
  //
  // On ANOTHER fresh device, deliberately: the hydrate just above succeeded,
  // which means the one before this is no longer a first pull. The mutant
  // survived on exactly that - the check was running against a device that
  // had by then pulled, where the ordinary dirty rule protects it anyway.
  DEVICES.fresh2 = new Store();
  localStorage = DEVICES.fresh2;
  check(deviceHasHydrated() === false, "set up: a fourth device, also never pulled");
  check(tbl("showcased_prs").length === 0, "set up: the server has no pinned PRs");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Back Squat"]));
  markDirty("showcasedPRs");
  SYNC_STATE.queue.clear();
  var realInsert4 = Q.prototype.insert;
  Q.prototype.insert = function (rows) {
    if (this.t === "showcased_prs") return Promise.resolve({ error: { message: "offline" } });
    return realInsert4.call(this, rows);
  };
  var rep4 = await hydrateMemberData(); await settle();
  Q.prototype.insert = realInsert4;
  var keptPins = JSON.parse(localStorage.getItem(memberKey(SHOWCASED_PRS_KEY)) || "[]");
  check(keptPins.join(",") === "Back Squat",
    "a pin made on a never-pulled phone survives an empty server too (got "
    + JSON.stringify(keptPins) + ")");
  check(String(rep4.report.showcasedPRs).indexOf("kept") !== -1,
    "and that pull says so as well (got " + JSON.stringify(rep4.report.showcasedPRs) + ")");
  onDevice("phone");

  // ---------------- said in the source ----------------

  check(/if \(REPLACE_STORES\.has\(name\) && !deviceHasHydrated\(\)\) return false;/.test(SYNCCODE),
    "pushStore refuses a replacing store on a device that has never pulled");
  check(SYNCCODE.indexOf("const everPulled = deviceHasHydrated();") !== -1,
    "and the pull asks the same question, once, before the flag is set");
  check(/stillDirty\.has\(name\) && \(everPulled \|\| !REPLACE_STORES\.has\(name\)\)/.test(SYNCCODE),
    "so only a REPLACING store loses its protection, and only on a first pull");
  check((SYNCCODE.match(/if \(keepsLocalEdit\(name\)\)/g) || []).length === 2,
    "both pulls go through it, the registry stores and the nested ones (found "
    + (SYNCCODE.match(/if \(keepsLocalEdit\(name\)\)/g) || []).length + ")");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
