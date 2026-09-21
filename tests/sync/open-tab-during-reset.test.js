// The case that undid a real reset: a tab already open and signed in when the
// account is wiped on the server. It never passes through sign-in again, so a
// check that only runs at sign-in never sees the reset.
function checkins() { return JSON.parse(localStorage.getItem(memberKey(CHECKIN_STORAGE_KEY)) || "[]"); }
async function settle() { for (var i = 0; i < 60; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }
function serverCheckins() { return tbl("checkins").length; }
var THREE = [
  { date: "2026-09-19", mental: 8, physical: 6, sleepHours: 8, sleepQuality: "ok", note: "Right Trap Soreness", sharedAt: null },
  { date: "2026-09-20", mental: 7, physical: 7, sleepHours: 7, sleepQuality: "good", note: "", sharedAt: null },
  { date: "2026-09-21", mental: 6, physical: 5, sleepHours: 6, sleepQuality: "ok", note: "", sharedAt: null }];

(async function () {
  SERVER.members = [{ id: "chris", data_epoch: 0 }];
  AUTH_MEMBER.data_epoch = 0;

  // The PC tab: signed in, synced, holding three check-ins. Left open.
  onDevice("pc");
  await hydrateMemberData(); await settle();
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(THREE));
  queueSync("checkins"); await settle();
  print("tab open, synced            server check-ins=" + serverCheckins() + "  tab epoch=" + localEpoch());

  // The reset runs on the server while that tab stays open.
  SERVER.checkins = [];
  SERVER.members[0].data_epoch = 1;
  print("reset runs on the server    server check-ins=" + serverCheckins() + "  server epoch=1");

  // The tab saves something — a new check-in, a ticked habit, anything.
  epochCheckedAt = 0;
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(THREE.concat([
    { date: "2026-09-22", mental: 9, physical: 8, sleepHours: 8, sleepQuality: "great", note: "", sharedAt: null }])));
  queueSync("checkins"); await settle();
  print("open tab saves afterwards   server check-ins=" + serverCheckins() + "  tab local=" + checkins().length + "  tab epoch=" + localEpoch());

  check(serverCheckins() === 0, "the open tab did NOT push its old check-ins back after the reset");
  check(checkins().length === 0, "the open tab discarded its stale copy");
  check(localEpoch() === 1, "and caught up to the new counter");
})();
