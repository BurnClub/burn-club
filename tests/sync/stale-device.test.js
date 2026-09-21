function pins() { return JSON.parse(localStorage.getItem(memberKey(SHOWCASED_PRS_KEY)) || "[]"); }
function serverPins() { return tbl("showcased_prs").map(function (r) { return r.exercise_name; }).sort(); }
// Wait until the queue has genuinely finished, rather than trusting one await.
async function settle() { for (var i = 0; i < 50; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }

(async function () {
  onDevice("pc");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Kettlebell Swings"]));
  queueSync("showcasedPRs"); await settle();
  print("PC pins, synced         server=" + JSON.stringify(serverPins()));

  onDevice("phone");
  await hydrateMemberData(); await settle();
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Kettlebell Swings", "Weighted Sit-Ups"]));
  queueSync("showcasedPRs"); await settle();
  print("phone adds a pin        server=" + JSON.stringify(serverPins()));
  check(JSON.stringify(serverPins()) === JSON.stringify(["Kettlebell Swings","Weighted Sit-Ups"]),
        "the phone's pin reached the server before the PC signs in");

  onDevice("pc");
  print("stale PC, before        local=" + JSON.stringify(pins()) + "  dirty=" + JSON.stringify([...loadDirty()]));
  await hydrateMemberData(); await settle();
  print("stale PC, after sign-in local=" + JSON.stringify(pins()) + "  server=" + JSON.stringify(serverPins()));
  check(serverPins().indexOf("Weighted Sit-Ups") >= 0, "stale PC did not delete the phone's pin from the server");
  check(pins().indexOf("Weighted Sit-Ups") >= 0, "stale PC picked the phone's pin up");

  onDevice("pc");
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(["Weighted Sit-Ups"]));
  markDirty("showcasedPRs");
  SYNC_STATE.queue.clear();
  await hydrateMemberData(); await settle();
  print("offline unpin + reload  local=" + JSON.stringify(pins()) + "  server=" + JSON.stringify(serverPins()));
  check(JSON.stringify(serverPins()) === JSON.stringify(["Weighted Sit-Ups"]), "an offline edit survived the reload and reached the server");
  check(!loadDirty().has("showcasedPRs"), "dirty flag cleared once it synced");

  onDevice("phone");
  await hydrateMemberData(); await settle();
  print("phone, next sign-in     local=" + JSON.stringify(pins()));
  check(JSON.stringify(pins()) === JSON.stringify(["Weighted Sit-Ups"]), "the unpin made on the PC reached the phone");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
