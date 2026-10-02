// Phase 4: the app must be quiet about ordinary bad signal and loud about a
// real backup failure. A member with one phone never finds out by comparing
// devices, so this warning is the only thing standing between them and
// discovering the problem when the phone is gone — which is exactly why it
// cannot fire every time they walk into a gym basement.
async function settle() { for (var i = 0; i < 60; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

// Every push fails, the way it does with no connection.
var realInsert = Q.prototype.insert;
function breakPushes() { Q.prototype.insert = function () { return Promise.resolve({ error: { message: "Failed to fetch" } }); }; }
function fixPushes() { Q.prototype.insert = realInsert; }

async function failPushes(n) {
  for (var i = 0; i < n; i++) { SYNC_STATE.queue.add("notebookNotes"); await drainSyncQueue(); await settle(); }
}

(async function () {
  onDevice("phone");
  NOTEBOOK_NOTES = { coach: ["note"], other: [] };
  localStorage.setItem(memberKey(NOTEBOOK_NOTES_KEY), JSON.stringify(NOTEBOOK_NOTES));

  // ---- offline: five failed attempts, not a word ----
  navigator.onLine = false;
  TOASTS = [];
  clearUnsynced();
  breakPushes();
  await failPushes(6);
  print("offline  toasts=" + TOASTS.length + "  failures=" + (SYNC_STATE.failures || 0));
  check(TOASTS.length === 0, "six failed pushes while offline say NOTHING");
  check((SYNC_STATE.failures || 0) === 0, "and don't count toward the warning");

  // ---- online and still failing: that is worth saying ----
  navigator.onLine = true;
  TOASTS = [];
  SYNC_STATE.failures = 0;
  await failPushes(5);
  print("online   toasts=" + TOASTS.length + "  failures=" + SYNC_STATE.failures);
  check(TOASTS.length === 1, "five failures WITH a connection warns once");
  check(/aren't backing up/.test(TOASTS[0] || ""), "and says the work is safe on the phone");

  // ---- a day of stranded work gets its own warning, whatever the reason ----
  navigator.onLine = false;
  TOASTS = [];
  staleWarnedThisSession = false;
  localStorage.setItem(staleKey(), String(Date.now() - 50 * 60 * 60 * 1000));
  await failPushes(1);
  print("stale    toasts=" + JSON.stringify(TOASTS));
  check(TOASTS.length === 1, "work unsynced for two days warns even though we're offline");
  check(/2 days/.test(TOASTS[0] || ""), "and names how long it has been");

  TOASTS = [];
  await failPushes(2);
  check(TOASTS.length === 0, "but only once a session, not on every retry");

  // ---- reconnecting pushes straight away, without waiting for a timer ----
  fixPushes();
  navigator.onLine = true;
  markDirty("notebookNotes");
  SYNC_STATE.queue.clear();
  var before = tbl("notebook_notes").length;
  fireEvent("online");
  await settle();
  print("reconnect  server rows " + before + " -> " + tbl("notebook_notes").length);
  check(tbl("notebook_notes").length > before, "coming back online uploads what was stranded");
  check(!loadDirty().has("notebookNotes"), "and clears the unsynced mark");
  check(!localStorage.getItem(staleKey()), "and stops the staleness clock");
})();
