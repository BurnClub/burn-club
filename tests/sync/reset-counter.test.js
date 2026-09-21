function comps() { return JSON.parse(localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY)) || "[]"); }
async function settle() { for (var i = 0; i < 60; i++) { await null; if (!SYNC_STATE.running && !SYNC_STATE.queue.size) return; } }
var pass = 0, fail = 0;
function check(ok, msg) { print((ok ? "  PASS  " : "  FAIL  ") + msg); ok ? pass++ : fail++; }
var OLD = [{ id: "local-1", workoutId: "w", title: "Old Workout", category: "circuit", date: "2026-09-19",
             minutes: 30, caloriesBurned: 200, avgHeartRate: 130, rpe: 7, weights: { "KB Swing": 35 } }];

(async function () {
  // ---- 1. A member who has NEVER been reset must never be wiped.
  onDevice("phone");
  AUTH_MEMBER.data_epoch = 0;
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(OLD));
  // no epoch stored on the device at all — the state every existing device is in
  await hydrateMemberData(); await settle();
  check(comps().length === 1, "never-reset member: local workouts kept (0 is not greater than 0)");
  check(tbl("completions").length === 1, "never-reset member: workouts reached the server as normal");

  // ---- 2. The reset: server cleared, epoch bumped. Phone still holds the old copy.
  SERVER = {};
  AUTH_MEMBER.data_epoch = 1;
  onDevice("phone");
  localStorage.setItem("sb-nusz-auth-token", "SESSION");          // the sign-in itself
  localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify({ chris: { h: 1 }, someoneElse: { h: 2 } }));
  print("phone before sign-in   local workouts=" + comps().length + "  server=" + tbl("completions").length + "  device epoch=" + localEpoch());
  await hydrateMemberData(); await settle();
  print("phone after sign-in    local workouts=" + comps().length + "  server=" + tbl("completions").length + "  device epoch=" + localEpoch());
  check(tbl("completions").length === 0, "reset sticks: the phone did NOT upload its old workouts");
  check(tbl("lifts").length === 0, "reset sticks: the old 35lb did not come back either");
  check(comps().length === 0, "the phone's stale copy was discarded");
  check(localStorage.getItem("sb-nusz-auth-token") === "SESSION", "the sign-in survived — no surprise sign-out");
  var hp = JSON.parse(localStorage.getItem(LIVE_HEALTH_PROFILES_KEY));
  check(!hp.chris && !!hp.someoneElse, "only this member's health profile removed; another member's left alone");

  // ---- 3. The PC, never touched by hand, also still holds the old copy.
  onDevice("pc");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(OLD));
  await hydrateMemberData(); await settle();
  check(tbl("completions").length === 0 && comps().length === 0,
        "a second device, never cleared by hand, is reset too");

  // ---- 4. After the reset, normal service: new work syncs and is NOT wiped again.
  onDevice("phone");
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify([
    { id: "local-2", workoutId: "w", title: "Fresh Workout", category: "circuit", date: "2026-09-21",
      minutes: 30, caloriesBurned: 200, avgHeartRate: 130, rpe: 6, weights: { "Weighted Sit-Ups": 50 } }]));
  queueSync("completions"); await settle();
  await hydrateMemberData(); await settle();
  check(comps().length === 1 && tbl("completions").length === 1,
        "after the reset, new workouts sync and a later sign-in does not wipe them");
  check(tbl("lifts").length === 1, "and the new weight reaches the server");

  print("\n  " + pass + " passed, " + fail + " failed");
})();
