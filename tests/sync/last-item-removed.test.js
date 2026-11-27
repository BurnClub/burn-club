function pins() { return JSON.parse(localStorage.getItem(memberKey(SHOWCASED_PRS_KEY)) || "[]"); }
function serverPins() { return tbl("showcased_prs").map(function (r) { return r.exercise_name; }).sort(); }
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); }

(async function () {
// This phone has used the app before, so it has completed a pull: the
// hydrated flag says so. It matters since 2026-11-26 (tester T-50) - a
// REPLACING store does not push from a device that has never pulled, because
// such a device would be replacing a list it has never seen. Setting it here
// is the honest model of the phone this test is about, not a workaround.
  function established(name) {
    onDevice(name);
    localStorage.setItem(memberKey("burnclub-hydrated"), "1");
  }

  // Case 1: two pins, phone removes ONE.
  established("phone");
  established("pc");
  onDevice("phone");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["A", "B"]));
  queueSync("showcasedPRs"); await settle();
  onDevice("pc");  await hydrateMemberData(); await settle();
  onDevice("phone");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["A"]));
  queueSync("showcasedPRs"); await settle();
  onDevice("pc");  await hydrateMemberData(); await settle();
  print("remove one of two   server=" + JSON.stringify(serverPins()) + "  pc=" + JSON.stringify(pins()));
  check(JSON.stringify(pins()) === '["A"]', "removing one of several reaches the PC");

  // Case 2: phone removes the LAST one.
  onDevice("phone");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify([]));
  queueSync("showcasedPRs"); await settle();
  onDevice("pc");  await hydrateMemberData(); await settle();
  print("remove the last one server=" + JSON.stringify(serverPins()) + "  pc=" + JSON.stringify(pins()));
  check(pins().length === 0, "removing the LAST pin reaches the PC");
})();
