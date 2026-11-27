// A session note the member deletes comes back the next time the app opens
// (tester T-20).
//
// In the Notebook the member opens a session note, clears the box and saves,
// which the app tells them is how a note is deleted. It disappears. On the
// next app open it is back. The note never left the server, so a coach can
// still read something the member chose to remove. Editing a note to
// different words works; only removal fails.
//
// REPRODUCED BY THE TESTER on a real member, twice, each from a fresh load,
// watching `session_notes` after every step: the row was still there after the
// delete, and the phone's copy held it again after the reload.
//
// Why: `sessionNotes` is an UPSERT store. Clearing the box took the note off
// the phone and the push uploaded the notes that remained. Nothing ever told
// the server to remove the row, and the next pull replaced the phone's copy
// with the server's.
//
// The fix is a list of what was removed, pushed as a scoped delete before the
// upsert. NOT pushReplace, which is what the notebook uses: that clears every
// row the member has in the table before inserting, so a device that has never
// completed a pull would wipe notes it has never seen. There is a check for
// that distinction below, and the mock had to learn to tell them apart.
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }
async function settle() {
  for (var i = 0; i < 80; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; }
}

var APP = readFile("../../app.js");
var CODE_SYNC = readFile("../../sync.js")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
var CODE = APP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
function braceMatch(src, from) {
  var depth = 0;
  for (var i = src.indexOf("{", from); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  throw new Error("unbalanced braces from " + from);
}
function liftFn(name) {
  var at = APP.indexOf("function " + name + "(");
  if (at < 0) throw new Error(name + "() is gone from app.js");
  return braceMatch(APP, at);
}

// The real write path from app.js, over the mock's stubs: the finding spans
// both files - app.js records the removal, sync.js sends it - so faking
// either half would be testing the fake.
eval(liftFn("loadSessionNotes"));
eval(liftFn("saveSessionNotes"));
eval(liftFn("sessionNoteFor"));
eval(liftFn("loadSessionNoteDeletes"));
eval(liftFn("saveSessionNoteDeletes"));
eval(liftFn("setSessionNote"));

function serverNotes() { return tbl("session_notes"); }
function serverNoteFor(id) {
  var r = serverNotes().filter(function (x) { return x.completion_client_id === id; })[0];
  return r ? r.body : null;
}

(async function () {
  onDevice("phone");

  // ---------------- the member writes two notes ----------------

  setSessionNote("local-1", "Felt strong, bumped squat 5lb");
  setSessionNote("local-2", "Left knee cranky");
  await settle();

  check(serverNotes().length === 2, "both notes reach the server (got " + serverNotes().length + ")");
  check(serverNoteFor("local-1") === "Felt strong, bumped squat 5lb", "with the words the member typed");

  // ---------------- editing one still works, as it always did ----------------

  setSessionNote("local-2", "Left knee fine today");
  await settle();
  check(serverNoteFor("local-2") === "Left knee fine today",
    "editing a note to different words reaches the server (got " + serverNoteFor("local-2") + ")");
  check(serverNotes().length === 2, "and does not leave a second copy behind");

  // ---------------- the finding: clearing the box ----------------

  setSessionNote("local-1", "");
  check(SESSION_NOTES["local-1"] === undefined, "clearing the box removes the note from the phone");
  check(sessionNoteFor("local-1") === "", "and it reads as empty everywhere the app asks");
  await settle();

  check(serverNoteFor("local-1") === null,
    "and the row is GONE from the server, which is the finding (got "
    + JSON.stringify(serverNoteFor("local-1")) + ")");
  check(serverNotes().length === 1,
    "one note left on the server, not two (got " + serverNotes().length + ")");
  check(serverNoteFor("local-2") === "Left knee fine today",
    "and the note the member kept is untouched - this is the part pushReplace would get wrong");
  check(SESSION_NOTE_DELETES.length === 0,
    "the removal is not still pending once the server has taken it (got "
    + JSON.stringify(SESSION_NOTE_DELETES) + ")");

  // ---------------- and it does not come back ----------------
  // The tester's second half: reload, and the note is back. A pull is what
  // did that, so a pull is what has to be checked.

  await hydrateMemberData();
  // A pull writes localStorage; the app re-reads its globals from there when
  // it enters. Without this the checks below pass on a stale in-memory map,
  // which is exactly the thing the finding is about.
  SESSION_NOTES = loadSessionNotes();
  check(SESSION_NOTES["local-1"] === undefined,
    "after a full pull the deleted note is still gone (got "
    + JSON.stringify(SESSION_NOTES["local-1"]) + ")");
  check(SESSION_NOTES["local-2"] === "Left knee fine today", "and the other one is still there");

  // ---------------- a second device never hears of the deleted note ----------------

  onDevice("pc");
  SESSION_NOTES = {};
  SESSION_NOTE_DELETES = [];
  await hydrateMemberData();
  SESSION_NOTES = loadSessionNotes();
  check(SESSION_NOTES["local-1"] === undefined,
    "a second device pulling fresh does not see the removed note either");
  check(SESSION_NOTES["local-2"] === "Left knee fine today", "but does get the one that remains");
  onDevice("phone");

  // ---------------- written again after being removed ----------------
  // The removal must stop being a removal, or the delete would run after the
  // upsert and take the new note with it.

  SESSION_NOTES = { "local-2": "Left knee fine today" };
  SESSION_NOTE_DELETES = [];
  setSessionNote("local-3", "Short one today");
  setSessionNote("local-3", "");
  check(SESSION_NOTE_DELETES.indexOf("local-3") !== -1, "set up: local-3 is pending removal");
  setSessionNote("local-3", "Changed my mind, here it is");
  check(SESSION_NOTE_DELETES.indexOf("local-3") === -1,
    "writing it again takes it off the removal list (got "
    + JSON.stringify(SESSION_NOTE_DELETES) + ")");
  await settle();
  check(serverNoteFor("local-3") === "Changed my mind, here it is",
    "so the note the member ended up with is the one on the server (got "
    + JSON.stringify(serverNoteFor("local-3")) + ")");

  // ---------------- a removal that cannot be sent is kept, not forgotten ----------------

  var realDelete = Q.prototype.delete;
  Q.prototype.delete = function () {
    var q = realDelete.call(this);
    q.then = function (res) { return Promise.resolve({ error: { message: "Failed to fetch" } }).then(res); };
    return q;
  };
  setSessionNote("local-3", "");
  await settle();
  check(SESSION_NOTE_DELETES.indexOf("local-3") !== -1,
    "a removal the server refused stays on the list (got "
    + JSON.stringify(SESSION_NOTE_DELETES) + ")");
  check(SESSION_NOTES["local-3"] === undefined, "and is gone from the phone whatever the server says");
  check(serverNoteFor("local-3") === "Changed my mind, here it is",
    "set up: the server still holds it, because the delete failed");

  // It must also survive a pull in the meantime, or the note reappears while
  // the removal is still waiting to be sent.
  await hydrateMemberData();
  SESSION_NOTES = loadSessionNotes();
  check(SESSION_NOTES["local-3"] === undefined,
    "a pull while the removal is still pending does not bring it back (got "
    + JSON.stringify(SESSION_NOTES["local-3"]) + ")");

  Q.prototype.delete = realDelete;
  queueSync("sessionNotes");
  await settle();
  check(serverNoteFor("local-3") === null,
    "and the next successful sync finishes the job (got "
    + JSON.stringify(serverNoteFor("local-3")) + ")");
  check(SESSION_NOTE_DELETES.length === 0, "with nothing left pending");

  // ---------------- a device that has not pulled must not wipe the rest ----------------
  // This is the whole reason the removal is a scoped delete rather than the
  // delete-everything-then-insert the notebook uses. On a device whose local
  // map is empty, a blanket delete removes every note the member has and the
  // re-insert puts back only what this device happens to hold, which is
  // nothing. Unscoped, it is recoverable in the ordinary case and ruinous in
  // this one, which is why the happy path alone does not prove it.

  // Two more on the server, so there is something to lose.
  setSessionNote("local-keep-a", "Keep me");
  setSessionNote("local-keep-b", "Me too");
  await settle();
  check(serverNotes().length >= 3, "set up: three notes on the server (got " + serverNotes().length + ")");

  onDevice("pc");
  SESSION_NOTES = {};                       // never pulled: this device knows of no notes
  SESSION_NOTE_DELETES = ["local-2"];       // but the member removed one here
  saveSessionNoteDeletes();
  var before = serverNotes().length;
  queueSync("sessionNotes"); await settle();
  check(serverNoteFor("local-2") === null, "the note the member removed is gone from the server");
  check(serverNotes().length === before - 1,
    "and ONLY that one - the other notes survive a device that has never pulled (had "
    + before + ", now " + serverNotes().length + ")");
  check(serverNoteFor("local-keep-a") === "Keep me" && serverNoteFor("local-keep-b") === "Me too",
    "both notes this device had never heard of are still there, word for word (left: "
    + JSON.stringify(serverNotes().map(function (r) { return r.completion_client_id; })) + ")");
  onDevice("phone");

  // ---------------- what keeps a pending removal safe from a pull ----------------
  // Two things, and neither of them is a filter on the way in. A filter sat in
  // sessionNotesFromRows for a while and nothing could reach it, so it was
  // removed rather than left looking like a safety net. What actually does the
  // work:
  //
  //   1. hydrate PUSHES before it pulls, so a pending removal is sent first
  //      and the server no longer has the row by the time it is asked.
  //   2. if that push fails, the store is still dirty, and hydrate skips a
  //      dirty store without even asking the server for it.
  //
  // Both are checked, because either one alone would let the note come back.

  SESSION_NOTES = loadSessionNotes();
  setSessionNote("local-9", "Typed just before a pull");
  await settle();
  check(serverNoteFor("local-9") === "Typed just before a pull", "set up: the note is on the server");

  // Removed with the server unreachable, so the removal is still pending.
  var realDelete2 = Q.prototype.delete;
  function breakDeletes() {
    Q.prototype.delete = function () {
      var q = realDelete2.call(this);
      q.then = function (res) { return Promise.resolve({ error: { message: "Failed to fetch" } }).then(res); };
      return q;
    };
  }
  breakDeletes();
  setSessionNote("local-9", "");
  await settle();
  check(SESSION_NOTE_DELETES.indexOf("local-9") !== -1, "set up: the removal is still pending");
  check(serverNoteFor("local-9") === "Typed just before a pull",
    "set up: and the server still holds the note");

  // (2) A pull while it is still pending does not go near the store.
  var askedForNotes = 0;
  var realThen = Q.prototype.then;
  Q.prototype.then = function (res) {
    if (this.t === "session_notes" && this.op !== "delete" && this.op !== "insert") askedForNotes++;
    return realThen.call(this, res);
  };
  await hydrateMemberData();
  check(askedForNotes === 0,
    "with the removal still unsent, a pull does not ask the server for session notes at all (asked "
    + askedForNotes + ")");
  SESSION_NOTES = loadSessionNotes();
  check(SESSION_NOTES["local-9"] === undefined,
    "so the note the member deleted stays deleted (got "
    + JSON.stringify(SESSION_NOTES["local-9"]) + ")");

  // (1) And once the server is reachable, the hydrate's own push is what
  // clears it - before the pull in the same hydrate asks for anything.
  Q.prototype.delete = realDelete2;
  askedForNotes = 0;
  await hydrateMemberData();
  Q.prototype.then = realThen;
  check(serverNoteFor("local-9") === null,
    "a hydrate pushes before it pulls, so the removal lands first (got "
    + JSON.stringify(serverNoteFor("local-9")) + ")");
  check(askedForNotes > 0, "set up: and this time it really did ask (" + askedForNotes + ")");
  SESSION_NOTES = loadSessionNotes();
  check(SESSION_NOTES["local-9"] === undefined,
    "so the pull in that same hydrate brings back nothing (got "
    + JSON.stringify(SESSION_NOTES["local-9"]) + ")");
  check(SESSION_NOTE_DELETES.length === 0, "and nothing is left pending");

  // ---------------- the list survives the app being closed ----------------
  // It lives in localStorage and is read back at entry. Without that, a member
  // who deletes a note with no signal and closes the app has the removal
  // forgotten, and the next pull brings the note back - which is the finding
  // again, one restart later.

  SESSION_NOTES["local-77"] = "Written with no signal";
  setSessionNote("local-77", "");           // removed, through the real writer
  SESSION_NOTE_DELETES = [];                // as a fresh page load starts
  SESSION_NOTE_DELETES = loadSessionNoteDeletes();
  check(SESSION_NOTE_DELETES.indexOf("local-77") !== -1,
    "a pending removal is still pending after a restart (got "
    + JSON.stringify(SESSION_NOTE_DELETES) + ")");
  check(CODE.indexOf("SESSION_NOTE_DELETES = loadSessionNoteDeletes();") !== -1,
    "and entry reads it back, or it would be forgotten with the tab");
  SESSION_NOTE_DELETES = [];
  saveSessionNoteDeletes();

  // ---------------- it is a scoped delete, not a clear-the-table ----------------

  var push = braceMatch(CODE_SYNC, CODE_SYNC.indexOf("async function pushSessionNotes("));
  check(push.indexOf('.eq("member_id", AUTH_MEMBER.id)') !== -1,
    "the removal is scoped to the member");
  check(push.indexOf('.in("completion_client_id", gone)') !== -1,
    "and to the ids this device was told to remove");
  check(push.indexOf("pushReplace") === -1,
    "it is not pushReplace, which clears every row the member has before inserting");
  check(push.indexOf("pushRows(\"session_notes\"") !== -1,
    "and what remains still goes up as an upsert, as before");

  // One door for writing a note, or the removal path goes missing again.
  check(CODE.indexOf("function setSessionNote(") !== -1, "app.js has one way to write a session note");
  var strays = (CODE.match(/delete SESSION_NOTES\[/g) || []).length;
  check(strays === 1,
    "and exactly one place deletes from the map, inside it (found " + strays + ")");
  var setter = braceMatch(CODE, CODE.indexOf("function setSessionNote("));
  check(setter.indexOf("SESSION_NOTE_DELETES.push(entryId)") !== -1,
    "which is the place that records the removal");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
