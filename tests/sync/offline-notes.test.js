function notes() { return JSON.parse(localStorage.getItem(memberKey(NOTEBOOK_NOTES_KEY)) || '{"coach":[],"other":[]}'); }
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

(async function () {
  // Notes written on the phone while offline: saved locally, marked unsynced,
  // the push never landed, the app was closed. Server has nothing.
  onDevice("phone");
  var written = { coach: ["Keep elbows tucked on press"], other: ["Felt strong today"] };
  localStorage.setItem(memberKey(NOTEBOOK_NOTES_KEY), JSON.stringify(written));
  NOTEBOOK_NOTES = written;
  markDirty("notebookNotes");
  SYNC_STATE.queue.clear();
  print("before sign-in   local=" + JSON.stringify(notes()) + "  server rows=" + tbl("notebook_notes").length);

  // Make the push fail, so the notes are still unsynced when the pull runs.
  var realUpsert = Q.prototype.insert;
  Q.prototype.insert = function (rows) { if (this.t === "notebook_notes") return Promise.resolve({ error: { message: "offline" } }); return realUpsert.call(this, rows); };
  await hydrateMemberData(); await settle();
  Q.prototype.insert = realUpsert;

  print("after sign-in    local=" + JSON.stringify(notes()) + "  server rows=" + tbl("notebook_notes").length);
  check(notes().coach.length === 1 && notes().other.length === 1,
        "unsynced notes SURVIVE a pull from an empty server");
  check(loadDirty().has("notebookNotes"), "still marked unsynced, so they get another attempt");

  // Connection back: they reach the server.
  queueSync("notebookNotes"); await settle();
  print("after reconnect  server rows=" + tbl("notebook_notes").length + "  dirty=" + loadDirty().has("notebookNotes"));
  check(tbl("notebook_notes").length === 2, "and reach the server once the connection returns");
})();
