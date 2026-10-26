// ---------------- Member data sync (2026-09-19) ----------------
// Local-first. localStorage stays the working store during a session, exactly
// as before, and Supabase becomes the durable copy behind it. That shape was
// chosen over reading the database directly for two reasons:
//
//   1. Members are in gyms with bad wifi. Writes have to land instantly and
//      survive the connection dropping mid-workout.
//   2. It leaves the app's 5,000 lines untouched. Every loadX() still reads
//      localStorage synchronously; what changed is that localStorage is filled
//      from the server on sign-in, and every saveX() also pushes.
//
// So the two ends are: hydrate on sign-in (server wins — it is the copy that
// survived the last reinstall), and push on save (queued, retried).

const SYNC_STATE = { queue: new Set(), running: false, lastError: null, online: true, errors: {} };

// The last failure reason per table, so a sync that fails can be asked why
// rather than guessed at. console.warn alone is invisible on a phone, and a
// guess about why a push failed has already been wrong once here.
function recordSyncError(table, message) {
  SYNC_STATE.errors[table] = { message, at: new Date().toISOString() };
  console.warn(`[sync] ${table}:`, message);
}
function syncStatus() {
  return { queued: [...SYNC_STATE.queue], failures: SYNC_STATE.failures || 0,
           online: SYNC_STATE.online, errors: SYNC_STATE.errors };
}

// Each store: the localStorage key base, the table, and the two mappers.
// Written against what the app actually stores, verified by dumping every
// localStorage key the running app writes — reading the code a function at a
// time had already produced ten wrong guesses.
function syncStores() {
  const me = () => AUTH_MEMBER.id;
  return {
    completions: {
      key: COMPLETIONS_STORAGE_KEY, table: "completions",
      toRows: (list) => list.map((c) => ({
        member_id: me(), client_id: c.id, workout_id: c.workoutId || null,
        slot_id: c.slotId || null, title: c.title, category: c.category,
        performed_on: c.date, minutes: c.minutes, calories: c.caloriesBurned,
        avg_heart_rate: c.avgHeartRate, rpe: c.rpe,
      })),
      onConflict: "member_id,client_id",
      fromRows: (rows) => rows.map((r) => ({
        id: r.client_id || `srv-${r.id}`, workoutId: r.workout_id, slotId: r.slot_id,
        title: r.title, category: r.category, date: r.performed_on,
        minutes: r.minutes, caloriesBurned: r.calories, avgHeartRate: r.avg_heart_rate,
        rpe: r.rpe, weights: null,
      })),
      order: "performed_on",
    },
    checkins: {
      key: CHECKIN_STORAGE_KEY, table: "checkins",
      toRows: (list) => list.map((c) => ({
        member_id: me(), performed_on: c.date, mental: c.mental, physical: c.physical,
        sleep_hours: c.sleepHours, sleep_quality: c.sleepQuality,
        note: c.note || null, shared_at: c.sharedAt || null,
      })),
      onConflict: "member_id,performed_on",
      fromRows: (rows) => rows.map((r) => ({
        date: r.performed_on, mental: r.mental, physical: r.physical,
        sleepHours: r.sleep_hours, sleepQuality: r.sleep_quality,
        note: r.note || "", sharedAt: r.shared_at,
      })),
      order: "performed_on",
    },
    dailyStats: {
      key: DAILY_STATS_STORAGE_KEY, table: "daily_stats",
      toRows: (list) => list.map((d) => ({
        member_id: me(), stat_date: d.date, steps: d.steps,
        calories: d.calories, resting_hr: d.restingHR,
      })),
      onConflict: "member_id,stat_date",
      fromRows: (rows) => rows.map((r) => ({
        date: r.stat_date, steps: r.steps, calories: r.calories, restingHR: r.resting_hr,
      })),
      order: "stat_date",
    },
    myHabits: {
      key: MY_HABITS_STORAGE_KEY, table: "member_habits",
      toRows: (list) => list.map((h, i) => ({
        member_id: me(), habit_id: h.id, label: h.label,
        auto: h.auto || null, target: h.target || null, position: i,
      })),
      onConflict: "member_id,habit_id",
      // Deduped on the way in as well as replaced on the way out. Belt and
      // braces: the table's primary key is (member_id, habit_id) so same-id
      // duplicates cannot exist, but a row whose id changed under it — an
      // admin habit-library edit reslugging a label — would arrive as a
      // second row with the same label, and the member would see it twice.
      fromRows: (rows) => dedupeHabits(rows.map((r) => {
        const h = { id: r.habit_id, label: r.label };
        // Only set when present: the app checks `habit.auto === "steps"`, and
        // an explicit null would be a different shape from the seed's absent
        // key for no reason.
        if (r.auto) h.auto = r.auto;
        if (r.target != null) h.target = r.target;
        return h;
      })),
      order: "position",
      // REPLACE, not upsert (2026-10-19). This pushed with onConflict alone,
      // which means it could only ever ADD: a habit removed on the phone was
      // never deleted from the server, and the next pull handed it straight
      // back. Chris's account had ten rows in a list capped at three —
      // every habit he had ever set, restored over and over.
      replace: true,
    },
    showcasedPRs: {
      key: SHOWCASED_PRS_KEY, table: "showcased_prs",
      toRows: (list) => list.map((name) => ({
        member_id: me(), exercise_id: exerciseIdForName(name), exercise_name: name,
      })),
      onConflict: "member_id,exercise_id",
      // Shown under whatever the exercise is called now, not what it was
      // called when it was pinned.
      fromRows: (rows) => rows.map(currentNameForLift),
      order: "exercise_name",
      replace: true,   // unpinning a PR is a delete, not an update
    },
    benchmarkResults: {
      key: BENCHMARK_RESULTS_STORAGE_KEY, table: "benchmark_results",
      toRows: (list) => list.map((b) => ({
        member_id: me(), client_id: b.id, benchmark_id: b.benchmarkId,
        // Carried so a result outlives its benchmark (2026-10-21). Older
        // results stored before the field existed send null, which is honest:
        // the name genuinely wasn't recorded at the time.
        benchmark_name: b.benchmarkName || null,
        performed_on: b.date, score: b.score,
      })),
      onConflict: "member_id,client_id",
      fromRows: (rows) => rows.map((r) => ({
        id: r.client_id || `srv-${r.id}`, benchmarkId: r.benchmark_id,
        benchmarkName: r.benchmark_name || "",
        date: r.performed_on, score: Number(r.score),
      })),
      order: "performed_on",
    },
  };
}

// HABIT_CHECKS, NOTEBOOK_NOTES and SESSION_NOTES are nested objects rather
// than arrays, so they get their own mapping rather than being forced into
// the shape above.
function habitChecksToRows(log) {
  const rows = [];
  Object.keys(log).forEach((date) => {
    Object.keys(log[date]).forEach((habitId) => {
      // false is stored, not skipped — it is an override of the wearable.
      rows.push({ member_id: AUTH_MEMBER.id, habit_id: habitId, checked_on: date, checked: !!log[date][habitId] });
    });
  });
  return rows;
}
function habitChecksFromRows(rows) {
  const log = {};
  rows.forEach((r) => {
    if (!log[r.checked_on]) log[r.checked_on] = {};
    log[r.checked_on][r.habit_id] = r.checked;
  });
  return log;
}
function notebookNotesToRows(notes) {
  const rows = [];
  ["coach", "other"].forEach((kind) => {
    (notes[kind] || []).forEach((body, i) => {
      rows.push({ member_id: AUTH_MEMBER.id, kind, position: i, body });
    });
  });
  return rows;
}
function notebookNotesFromRows(rows) {
  const out = { coach: [], other: [] };
  rows.slice().sort((a, b) => a.position - b.position)
      .forEach((r) => { if (out[r.kind]) out[r.kind].push(r.body); });
  return out;
}
function sessionNotesToRows(map) {
  return Object.keys(map).map((id) => ({
    member_id: AUTH_MEMBER.id, completion_client_id: id, body: map[id],
  }));
}
function sessionNotesFromRows(rows) {
  const out = {};
  rows.forEach((r) => { out[r.completion_client_id] = r.body; });
  return out;
}

// ---------------- Reset counter ----------------
// A reset on the server bumps members.data_epoch. Each device remembers the
// last value it saw. If the server's is HIGHER, this device's copy predates
// the reset and has to be thrown away — uploading it would quietly undo the
// reset, which is what happened twice when a phone was cleared by hand and the
// clear missed.
//
// An unset local value counts as 0, which is also the server's default, so a
// member who has never been reset is never touched: 0 is not greater than 0.
// Only an explicit reset ever makes the comparison true.
function epochKey() { return `burnclub-epoch-${AUTH_MEMBER.id}`; }
function localEpoch() { return Number(localStorage.getItem(epochKey()) || 0); }

function discardLocalMemberData() {
  const id = AUTH_MEMBER.id;
  const removed = [];
  Object.keys(localStorage).forEach((k) => {
    // Never the sign-in itself: discarding that would sign the member out in
    // the middle of signing them in.
    if (k.startsWith("sb-")) return;
    if (k.endsWith("-" + id) || k === dirtyKey() || k === SCHEDULED_ITEMS_STORAGE_PREFIX + id) {
      localStorage.removeItem(k);
      removed.push(k);
    }
  });
  // The health profile sits in a shared object keyed by member id, not under a
  // member key — remove this member's entry and leave anyone else's.
  try {
    const all = JSON.parse(localStorage.getItem(LIVE_HEALTH_PROFILES_KEY) || "{}");
    if (all[id]) { delete all[id]; localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify(all)); }
  } catch (e) {}
  SYNC_STATE.queue.clear();
  return removed.length;
}

// A reset can happen while a tab is already open and signed in. That tab
// never passes through sign-in again, so the check in hydrateMemberData never
// sees it — and it goes on pushing its stale copy, undoing the reset. That is
// exactly what happened: an open PC tab put three check-ins back on the server
// minutes after they were wiped.
//
// So the counter is checked before every push as well. The answer is cached
// briefly, so a burst of saves costs one query rather than one each.
let epochCheckedAt = 0;
async function epochStillCurrent() {
  if (!SB || !AUTH_MEMBER) return true;
  if (Date.now() - epochCheckedAt < 15000) return true;
  const { data, error } = await SB.from("members").select("data_epoch").eq("id", AUTH_MEMBER.id).maybeSingle();
  // If the check itself fails, carry on: this is about a deliberate reset, not
  // a flaky connection, and blocking every push offline would lose real work.
  if (error || !data) return true;
  epochCheckedAt = Date.now();
  const server = Number(data.data_epoch || 0);
  if (server <= localEpoch()) return true;

  // Reset while this tab was open. Discarding storage is not enough on its
  // own — the stale data is also in memory (CHECKINS, COMPLETIONS and the
  // rest), and the next save would write it straight back. Reloading rebuilds
  // memory from the now-clean storage, and sign-in then pulls fresh.
  discardLocalMemberData();
  localStorage.setItem(epochKey(), String(server));
  if (typeof location !== "undefined" && location.reload) location.reload();
  return false;
}

// ---------------- Hydrate ----------------
// Runs once on sign-in, before init(), so every loadX() below it reads a
// localStorage already filled from the server. The server wins here on
// purpose: it is the copy that survived the reinstall, and a fresh browser's
// empty localStorage is not an opinion about the member's history.
//
// Nothing is written locally unless the server actually returned rows. A
// member who has never synced keeps their seeded local data rather than
// having it blanked by an empty table.
async function hydrateMemberData() {
  if (!SB || !AUTH_MEMBER) return { ok: false, reason: "not signed in" };
  const stores = syncStores();
  const report = {};

  // Push before pulling, always. Hydrate replaces a local store wholesale when
  // the server returns rows, so anything local that never synced would be
  // destroyed by the pull that was meant to restore it — a member with one
  // synced workout and one stranded would lose the stranded one on their next
  // sign-in, on the device that still had it.
  //
  // This is also the only thing that retries a failed push across a reload:
  // the queue is in memory and dies with the page, so without this a
  // completion that failed once would sit on the phone until the member
  // happened to save something else.
  const serverEpoch = Number(AUTH_MEMBER.data_epoch || 0);
  if (serverEpoch > localEpoch()) {
    // This device's copy predates a reset. Discard it and skip the upload
    // entirely — pushing first is exactly what would bring the old data back.
    const n = discardLocalMemberData();
    localStorage.setItem(epochKey(), String(serverEpoch));
    report.__reset = `discarded ${n} local store(s): reset to epoch ${serverEpoch}`;
  } else {
    if (!localStorage.getItem(epochKey())) localStorage.setItem(epochKey(), String(serverEpoch));
    const reconciled = await reconcileLocalUp();
    report.__pushedFirst = reconciled;
  }

  // A store still dirty after reconcile is one whose push failed. Its local
  // copy is newer than anything the server has, so pulling over it would lose
  // the member's edit — leave it and let the queue retry.
  const stillDirty = loadDirty();

  // EVERY member pull filters on member_id, and does not lean on RLS to do it
  // (2026-10-26). RLS is correct — "own rows" restricts an ordinary member —
  // but these tables ALSO carry a "staff read all" policy, so an account with
  // the staff role reading through the member app got back every member's
  // rows and rendered them as its own. A tester's notebook turned up in
  // Chris's notebook on his phone, which is how this was found.
  //
  // The filter is not a second lock on the same door. RLS answers "may this
  // account see this row", and the answer for staff is legitimately yes. This
  // answers a different question — "is this row THIS MEMBER'S" — which is the
  // one the member app always meant to ask.
  const pulls = Object.keys(stores).map(async (name) => {
    if (stillDirty.has(name)) { report[name] = "unsynced local edit — kept"; return; }
    const s = stores[name];
    const { data, error } = await SB.from(s.table).select("*")
      .eq("member_id", AUTH_MEMBER.id)
      .order(s.order, { ascending: true });
    if (error) { report[name] = "error: " + error.message; return; }
    if (!data || !data.length) {
      // For a merging store, an empty table means nothing has synced yet, so
      // the local copy is kept. For a replacing store it is a real answer —
      // the member has no pins — and keeping the local list would mean the
      // last pin removed on one device never disappears from another. Safe
      // because a replacing store with an unsynced local edit is dirty, and
      // dirty stores were already skipped above.
      if (name === "myHabits") {
        // The one replacing store where empty does NOT mean "the member has
        // none". A brand new account has no habit rows yet and loadMyHabits()
        // has just seeded three sensible defaults locally — clearing those
        // would hand a new member an empty habits card on day one. Keep them
        // and mark dirty so they go up and become real.
        markDirty(name);
        SYNC_STATE.queue.add(name);
        report[name] = "empty on server — keeping local defaults, will push";
      } else if (REPLACE_STORES.has(name)) {
        localStorage.setItem(memberKey(s.key), JSON.stringify(s.fromRows([])));
        report[name] = "empty on server — cleared";
      } else {
        report[name] = "empty — kept local";
      }
      return;
    }
    let mapped = s.fromRows(data);
    if (name === "completions") {
      const { data: lifts } = await SB.from("lifts").select("*").eq("member_id", AUTH_MEMBER.id);
      if (lifts && lifts.length) {
        mapped = liftsOntoCompletions(mapped, lifts);
        report.lifts = `${lifts.length} rows`;
      }
      // Never let a pull destroy weights the server does not have. If the
      // completion's push landed but its lifts push did not, the server row is
      // weightless — and replacing the local copy with it would erase the
      // member's numbers from the one device that still held them. Push-first
      // exists to stop exactly that, and a partial failure would defeat it.
      const local = JSON.parse(localStorage.getItem(memberKey(s.key)) || "[]");
      const localWeights = {};
      local.forEach((c) => { if (c.weights && Object.keys(c.weights).length) localWeights[c.id] = c.weights; });
      let kept = 0;
      mapped.forEach((c) => {
        if ((!c.weights || !Object.keys(c.weights).length) && localWeights[c.id]) {
          c.weights = localWeights[c.id];
          kept++;
        }
      });
      // Completions that exist only locally — never pushed — survive too,
      // rather than being dropped because the server has not heard of them.
      const serverIds = new Set(mapped.map((c) => c.id));
      const localOnly = local.filter((c) => !serverIds.has(c.id));
      if (localOnly.length) mapped = mapped.concat(localOnly);
      if (kept || localOnly.length) {
        report.keptLocal = `${kept} weight set(s), ${localOnly.length} unsynced completion(s)`;
        // They are still unsynced, so make sure they get another attempt.
        SYNC_STATE.queue.add("completions");
      }
    }
    localStorage.setItem(memberKey(s.key), JSON.stringify(mapped));
    report[name] = `${data.length} rows`;
  });

  const nested = [
    ["habitChecks", "habit_checks", HABIT_CHECKS_STORAGE_KEY, habitChecksFromRows],
    ["notebookNotes", "notebook_notes", NOTEBOOK_NOTES_KEY, notebookNotesFromRows],
    ["sessionNotes", "session_notes", SESSION_NOTES_KEY, sessionNotesFromRows],
  ].map(async ([name, table, key, from]) => {
    if (stillDirty.has(name)) { report[name] = "unsynced local edit — kept"; return; }
    const { data, error } = await SB.from(table).select("*").eq("member_id", AUTH_MEMBER.id);
    if (error) { report[name] = "error: " + error.message; return; }
    if (!data || !data.length) {
      if (REPLACE_STORES.has(name)) {
        localStorage.setItem(memberKey(key), JSON.stringify(from([])));
        report[name] = "empty on server — cleared";
      } else {
        report[name] = "empty — kept local";
      }
      return;
    }
    localStorage.setItem(memberKey(key), JSON.stringify(from(data)));
    report[name] = `${data.length} rows`;
  });

  // Preferences are one row of scalars rather than a list, and they are the
  // reason several of these exist at all: a reinstall used to replay the tour
  // and re-ask about check-ins because the flags were per-browser.
  const prefs = (async () => {
    const { data, error } = await SB.from("member_preferences").select("*")
      .eq("member_id", AUTH_MEMBER.id).maybeSingle();
    if (error || !data) { report.preferences = error ? "error: " + error.message : "none"; return; }
    if (data.theme) localStorage.setItem(THEME_KEY, data.theme);
    // "1", not a timestamp: tourSeen() tests for exactly that string, so
    // writing Date.now() here made the flag stop matching and the tour replayed
    // on every sign-in — the bug Chris hit (2026-10-02).
    if (data.tour_seen) localStorage.setItem(memberKey(TOUR_SEEN_KEY), "1");
    localStorage.setItem(memberKey(CHECKIN_ENABLED_KEY), data.checkin_enabled ? "1" : "0");
    if (data.checkin_dismissed_on) localStorage.setItem(memberKey(CHECKIN_DISMISS_KEY), data.checkin_dismissed_on);
    if (data.notification_prefs && Object.keys(data.notification_prefs).length) {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(data.notification_prefs));
    }
    if (data.wearable && Object.keys(data.wearable).length) {
      localStorage.setItem(memberKey(WEARABLE_STORAGE_KEY), JSON.stringify(data.wearable));
    }
    report.preferences = "loaded";
  })();

  const extras = (async () => {
    const { data: sched, error: schedErr } = await SB.from("scheduled_items").select("*")
      .eq("member_id", AUTH_MEMBER.id);
    // Same rule as the other replacing stores: when this device has no
    // unsynced edit, the server's list is the truth — including when it is
    // empty, which is how a removed last session reaches every device.
    if (!schedErr && !stillDirty.has("scheduledItems")) {
      localStorage.setItem(SCHEDULED_ITEMS_STORAGE_PREFIX + AUTH_MEMBER.id,
                           JSON.stringify(scheduledItemsFromRows(sched || [])));
      report.scheduledItems = `${(sched || []).length} rows`;
    }
    const { data: hp } = await SB.from("health_profile").select("*")
      .eq("member_id", AUTH_MEMBER.id).maybeSingle();
    if (hp && hp.profile && Object.keys(hp.profile).length) {
      // Merge into the shared bridge object rather than replacing it, so a
      // profile belonging to another member in this browser survives.
      const all = (typeof loadHealthProfiles === "function") ? loadHealthProfiles() : {};
      all[AUTH_MEMBER.id] = hp.profile;
      localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify(all));
      report.healthProfile = "loaded";
    }
  })();

  await Promise.all([...pulls, ...nested, prefs, extras]);
  SYNC_STATE.lastError = Object.values(report).find((v) => String(v).startsWith("error")) || null;
  return { ok: !SYNC_STATE.lastError, report };
}

// Everything the device holds, pushed once. Upserts are keyed on client_id or
// on a date, so re-sending what the server already has costs a round trip and
// changes nothing.
async function reconcileLocalUp() {
  const names = Object.keys(syncStores())
    .concat(["habitChecks", "notebookNotes", "sessionNotes", "preferences", "healthProfile", "scheduledItems"]);
  const results = {};
  const dirty = loadDirty();
  for (const n of names) {
    // Merging stores (completions, check-ins and the rest) upsert, so pushing
    // them costs a round trip and changes nothing the server already has.
    // Replacing stores are different: pushing one DELETES what the server
    // holds, so a device may only do that for a list it actually edited.
    //
    // Preferences belong in that set, found 2026-10-02 while chasing the tour
    // replaying. They are one row of scalars, so a push is a whole-row
    // overwrite: a device with empty localStorage — a new phone, a reinstall —
    // sent its defaults up and flipped tour_seen to false for every device,
    // then pulled that false straight back. A device may only write
    // preferences it has actually been told about.
    if (REPLACE_STORES.has(n) && !dirty.has(n)) { results[n] = true; continue; }
    results[n] = await pushStore(n);
    if (results[n]) clearDirty(n);
  }
  const failed = Object.keys(results).filter((n) => !results[n]);
  failed.forEach((n) => SYNC_STATE.queue.add(n));
  if (failed.length) drainSyncQueue();
  return failed.length ? `failed: ${failed.join(", ")}` : "ok";
}

// ---------------- Dirty stores ----------------
// Which stores THIS device has edited and not yet synced, kept in
// localStorage so it survives the page closing. The in-memory queue alone
// could not do that, and "unsynced" has to outlive a closed tab.
//
// It matters most for the three stores that push by replacing: pinned PRs,
// notebook notes and scheduled cardio. Replacing is right when the member
// actually changed the list here, and badly wrong when they did not — a stale
// device signing in would delete everything newer on the server and pull its
// own old list back. Chris hit exactly that: a PR pinned on his phone was
// erased by his PC signing in afterwards.
// myHabits joined on 2026-10-19 — see the note on its store above. Being in
// here is what stops a replacing push firing from a device that did not edit
// the list, which would wipe newer habits with this device's stale copy.
const REPLACE_STORES = new Set(["showcasedPRs", "notebookNotes", "scheduledItems", "preferences", "myHabits"]);
function dirtyKey() { return `burnclub-sync-dirty-${AUTH_MEMBER ? AUTH_MEMBER.id : "demo"}`; }
function loadDirty() {
  try { return new Set(JSON.parse(localStorage.getItem(dirtyKey()) || "[]")); }
  catch (e) { return new Set(); }
}
function saveDirty(set) { localStorage.setItem(dirtyKey(), JSON.stringify([...set])); }
function markDirty(name) { const d = loadDirty(); d.add(name); saveDirty(d); }
function clearDirty(name) { const d = loadDirty(); d.delete(name); saveDirty(d); }


// ---------------- "Not backing up" (phase 4, 2026-10-01) ----------------
// Chris expects members to use one phone, so nobody will notice a sync problem
// by comparing devices. This is the only thing that tells them, which is
// exactly why it must not fire for ordinary bad signal: a warning that cries
// wolf every gym session is one nobody reads on the day it matters.
const STALE_WARN_AFTER_MS = 24 * 60 * 60 * 1000;
let staleWarnedThisSession = false;

function staleKey() { return `burnclub-sync-stale-since-${AUTH_MEMBER ? AUTH_MEMBER.id : "demo"}`; }

function markUnsynced() {
  // First failure of a run starts the clock; later ones leave it alone, so the
  // age measured is how long the work has actually been stranded.
  if (!localStorage.getItem(staleKey())) localStorage.setItem(staleKey(), String(Date.now()));
}

function clearUnsynced() {
  localStorage.removeItem(staleKey());
  staleWarnedThisSession = false;
}

function warnIfStale() {
  if (staleWarnedThisSession) return;
  const since = Number(localStorage.getItem(staleKey()) || 0);
  if (!since || Date.now() - since < STALE_WARN_AFTER_MS) return;
  staleWarnedThisSession = true;
  if (typeof showToast === "function") {
    const days = Math.max(1, Math.round((Date.now() - since) / (24 * 60 * 60 * 1000)));
    showToast(`Your workouts haven't backed up for ${days} day${days > 1 ? "s" : ""}. They're safe on this phone — tell your coach.`);
  }
}

// Reconnecting is the moment to try again, not thirty seconds later. The phone
// knows before any timer does.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    SYNC_STATE.online = true;
    SYNC_STATE.failures = 0;        // whatever failed before, the reason is gone
    if (SYNC_STATE.queue.size) {
      drainSyncQueue();
    } else {
      // Nothing queued in memory, but a previous page load may have left work
      // marked dirty and never got it up. Re-queue those stores.
      const dirty = loadDirty();
      if (dirty.size) { dirty.forEach((n) => SYNC_STATE.queue.add(n)); drainSyncQueue(); }
    }
  });
  window.addEventListener("offline", () => { SYNC_STATE.online = false; });
}

// ---------------- Push ----------------
// Called by saveX() after it has written locally, so a failure here never
// costs the member their work — it is already on the device.
function queueSync(storeName) {
  if (!SB || !AUTH_MEMBER) return;          // demo mode writes nowhere
  markDirty(storeName);
  SYNC_STATE.queue.add(storeName);
  drainSyncQueue();
}

let drainTimer = null;
async function drainSyncQueue() {
  if (SYNC_STATE.running || !SYNC_STATE.queue.size) return;
  SYNC_STATE.running = true;
  // Before anything goes up: has this account been reset since the tab opened?
  if (!(await epochStillCurrent())) {
    SYNC_STATE.queue.clear();
    SYNC_STATE.running = false;
    return;
  }
  const names = [...SYNC_STATE.queue];
  SYNC_STATE.queue.clear();

  let failed = [];
  for (const name of names) {
    const ok = await pushStore(name);
    if (ok) clearDirty(name);
    else failed.push(name);
  }
  SYNC_STATE.running = false;

  if (failed.length) {
    // Put them back and try again later. The member's work is on the device
    // either way; this is about the copy that survives losing the device.
    failed.forEach((n) => SYNC_STATE.queue.add(n));
    SYNC_STATE.online = false;
    markUnsynced();

    // Being offline is ordinary — a gym basement, a lift, a dead patch on the
    // drive — and must stay silent. Five retries at 30s used to mean a member
    // got warned after two and a half minutes without signal, every session,
    // until they stopped reading it. Only count failures that happen while the
    // phone believes it has a connection; those are the ones that mean
    // something is actually wrong.
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (!offline) SYNC_STATE.failures = (SYNC_STATE.failures || 0) + 1;

    if (!offline && SYNC_STATE.failures === 5 && typeof showToast === "function") {
      showToast("Your workouts are saved on this phone but aren't backing up. Tell your coach if this keeps showing.");
    }
    // The other half of the problem: a member with one device never finds out
    // by comparing phones. If work has sat unsynced for a day, say so once —
    // whatever the reason, that is now worth knowing about.
    warnIfStale();
    clearTimeout(drainTimer);
    drainTimer = setTimeout(drainSyncQueue, 30000);
  } else {
    SYNC_STATE.online = true;
    SYNC_STATE.failures = 0;
    clearUnsynced();
    if (SYNC_STATE.queue.size) drainSyncQueue();
  }
}

async function pushStore(name) {
  if (!SB || !AUTH_MEMBER) return true;
  try {
    if (name === "habitChecks") return await pushRows("habit_checks", habitChecksToRows(HABIT_CHECKS), "member_id,habit_id,checked_on");
    if (name === "notebookNotes") return await pushReplace("notebook_notes", notebookNotesToRows(NOTEBOOK_NOTES));
    if (name === "sessionNotes") return await pushRows("session_notes", sessionNotesToRows(SESSION_NOTES), "member_id,completion_client_id");
    if (name === "preferences") return await pushPreferences();
    if (name === "healthProfile") return await pushHealthProfile();
    if (name === "scheduledItems") return await pushScheduledItems();

    const s = syncStores()[name];
    if (!s) return true;
    const local = JSON.parse(localStorage.getItem(memberKey(s.key)) || "null");
    if (!local) return true;
    const rows = s.toRows(local);
    const ok = s.replace ? await pushReplace(s.table, rows) : await pushRows(s.table, rows, s.onConflict);
    // Weights go with the completions they belong to, and only if the
    // completions themselves landed — a lift whose completion never arrived
    // would be an orphan nothing could show.
    if (ok && name === "completions") {
      // Conflicts resolve on the id now, so a rename does not create a second
      // set of rows alongside the member's existing ones (14-exercise-id.sql).
      return await pushRows("lifts", liftsToRows(local), "member_id,completion_client_id,exercise_id,set_number");
    }
    return ok;
  } catch (e) {
    recordSyncError(name, "exception: " + e.message);
    return false;
  }
}

// Weights ride with their completion. They are the numbers a member actually
// came for — a personal best is computed from them — and until now they were
// the one thing that never left the phone.
// The id a lift is filed under. Derived from the name by the library's own
// rule rather than looked up, so it cannot fail to resolve for an exercise the
// library has never heard of — a deleted one, a typo, a demo seed. The five
// hand-authored ids that do not follow the rule are resolved from the library
// first; everything else slugifies. 14-exercise-id.sql does exactly this in
// SQL, and the two have to agree.
function exerciseIdForName(name) {
  const known = typeof EXERCISE_LIBRARY !== "undefined"
    && EXERCISE_LIBRARY.find((e) => e.name === name);
  if (known) return known.id;
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function liftsToRows(completions) {
  const rows = [];
  completions.forEach((c) => {
    // Per set where we have it (2026-10-02), one row per exercise where we
    // don't. setWeights keys are "blockIndex|Exercise Name|Set 2"; the label
    // is what the member saw, so it is what gets stored rather than an index
    // they would have to decode.
    if (c.setWeights && Object.keys(c.setWeights).length) {
      let n = 0;
      const before = rows.length;
      Object.keys(c.setWeights).forEach((key) => {
        const weight = Number(c.setWeights[key]);
        if (!Number.isFinite(weight) || weight <= 0) return;
        const parts = key.split("|");
        const name = parts[1];
        if (!name) return;
        rows.push({
          member_id: AUTH_MEMBER.id, completion_client_id: c.id,
          exercise_id: exerciseIdForName(name),
          exercise_name: name, weight, performed_on: c.date,
          set_number: ++n, set_label: parts[2] || null,
        });
      });
      // Only this completion's rows count — `rows` is the accumulator for all
      // of them, so testing it directly would skip every later completion once
      // any one had per-set weights.
      if (rows.length > before) return;
    }
    if (!c.weights) return;
    Object.keys(c.weights).forEach((name) => {
      const weight = Number(c.weights[name]);
      if (!Number.isFinite(weight)) return;
      rows.push({
        member_id: AUTH_MEMBER.id, completion_client_id: c.id,
        exercise_id: exerciseIdForName(name),
        exercise_name: name, weight, performed_on: c.date,
        set_number: 1, set_label: null,
      });
    });
  });
  return rows;
}
// A lift comes back under the name it was logged with. If the exercise has
// been renamed since, the library knows it by its id, and the member's history
// should follow the rename rather than sit under a name nothing uses any more.
function currentNameForLift(row) {
  if (row.exercise_id && typeof EXERCISE_LIBRARY !== "undefined") {
    const ex = EXERCISE_LIBRARY.find((e) => e.id === row.exercise_id);
    if (ex) return ex.name;
  }
  return row.exercise_name;
}

function liftsOntoCompletions(completions, liftRows) {
  const byCompletion = {};
  liftRows.forEach((r) => {
    if (!r.completion_client_id) return;
    (byCompletion[r.completion_client_id] = byCompletion[r.completion_client_id] || {})[currentNameForLift(r)] = Number(r.weight);
  });
  completions.forEach((c) => {
    if (byCompletion[c.id]) c.weights = byCompletion[c.id];
  });
  return completions;
}

async function pushRows(table, rows, onConflict) {
  if (!rows.length) return true;
  const { error } = await SB.from(table).upsert(rows, { onConflict });
  if (error) { recordSyncError(table, error.message); return false; }
  delete SYNC_STATE.errors[table];
  return true;
}

// For stores where removal is meaningful — unpinning a PR, deleting a note.
// An upsert alone would leave the removed rows behind, so the member's list
// and the server's would quietly diverge.
async function pushReplace(table, rows) {
  const { error: delError } = await SB.from(table).delete().eq("member_id", AUTH_MEMBER.id);
  if (delError) { recordSyncError(table, "clear: " + delError.message); return false; }
  if (!rows.length) return true;
  const { error } = await SB.from(table).insert(rows);
  if (error) { recordSyncError(table, error.message); return false; }
  delete SYNC_STATE.errors[table];
  return true;
}

async function pushPreferences() {
  const row = {
    member_id: AUTH_MEMBER.id,
    theme: localStorage.getItem(THEME_KEY) || "system",
    tour_seen: !!localStorage.getItem(memberKey(TOUR_SEEN_KEY)),
    checkin_enabled: localStorage.getItem(memberKey(CHECKIN_ENABLED_KEY)) !== "0",
    checkin_dismissed_on: localStorage.getItem(memberKey(CHECKIN_DISMISS_KEY)) || null,
    notification_prefs: JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || "{}"),
    wearable: JSON.parse(localStorage.getItem(memberKey(WEARABLE_STORAGE_KEY)) || "{}"),
  };
  const { error } = await SB.from("member_preferences").upsert(row, { onConflict: "member_id" });
  if (error) { recordSyncError("member_preferences", error.message); return false; }
  return true;
}

// A member who finishes a workout on a dying connection should not lose it
// when the tab wakes up on wifi.
// Two stores that are not arrays under memberKey, so they sit outside the
// registry: the health profile (one jsonb blob) and scheduled cardio (its own
// key prefix, since it predates memberKey).
function scheduledItemsToRows(list) {
  return list.map((i) => ({
    member_id: AUTH_MEMBER.id, client_id: i.id, item_date: i.date,
    kind: i.type || "cardio",
    // `day` carries a moved workout's programme day (2026-10-26). The payload
    // is free-form jsonb, which is why a move needed no new table.
    payload: { activity: i.activity || null, completed: i.completed || false,
               ...(i.day != null ? { day: i.day } : {}) },
  }));
}
function scheduledItemsFromRows(rows) {
  return rows.map((r) => ({
    id: r.client_id, type: r.kind, date: r.item_date,
    activity: (r.payload || {}).activity,
    ...((r.payload || {}).day != null ? { day: (r.payload || {}).day } : {}),
    ...((r.payload || {}).completed ? { completed: true } : {}),
  }));
}

async function pushHealthProfile() {
  // Not a memberKey store: the health profile lives inside the shared
  // LIVE_HEALTH_PROFILES_KEY object, keyed by member id, because it doubles as
  // the same-browser bridge to admin. Only this member's entry is pushed —
  // that object can hold other members' profiles when demo profiles have been
  // switched in the same browser, and those are not ours to send.
  const all = (typeof loadHealthProfiles === "function") ? loadHealthProfiles() : {};
  const profile = all[AUTH_MEMBER.id];
  if (!profile) return true;
  const { error } = await SB.from("health_profile")
    .upsert({ member_id: AUTH_MEMBER.id, profile, updated_at: new Date().toISOString() },
            { onConflict: "member_id" });
  if (error) { recordSyncError("health_profile", error.message); return false; }
  return true;
}

async function pushScheduledItems() {
  const raw = localStorage.getItem(SCHEDULED_ITEMS_STORAGE_PREFIX + AUTH_MEMBER.id);
  const list = raw ? JSON.parse(raw) : [];
  // Replace rather than upsert: removing a scheduled session is the common
  // edit, and an upsert would leave it on the calendar of every other device.
  return await pushReplace("scheduled_items", scheduledItemsToRows(list));
}

// ---------------- Messaging (2026-10-12) ----------------
// Unlike every other store here, messages are neither member-owned nor
// replaced: they are append-only and SHARED — a group thread holds rows
// written by five other people, and nothing this device knows lets it decide
// what that list should be. So there is no "push my copy" for messages. A send
// inserts one row; a read pulls whatever the policies allow back.
//
// Which rows those are is decided entirely by RLS (see 16-messages.sql), not
// by a filter here. A select with no `where` returns this member's DM and
// their program's group chat and nothing else — if that ever returns somebody
// else's thread, the bug is in the policy and a client-side filter would only
// have hidden it.

// Relative, because an absolute timestamp on every bubble is noise in a thread
// you are reading top to bottom. Falls back to the date once "ago" stops
// meaning anything.
function messageTimeLabel(iso) {
  const then = new Date(iso);
  if (isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + "d ago";
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function messageFromRow(row, lastReadAt) {
  return {
    // Prefixed so a server id can never collide with a seeded "msg-1" or with
    // an optimistic local id while a send is still in flight.
    id: "srv-" + row.id,
    serverId: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    isStaff: !!row.is_staff,
    text: row.body,
    time: messageTimeLabel(row.created_at),
    createdAt: row.created_at,
    // Read state for the MEMBER is local: a DM has one reader but a group has
    // six, and per-member read state on the row would be a join table for
    // something this side can answer from "when did I last open this thread".
    // The shared staff_read_at on the row is the staff inbox's half.
    read: row.sender_id === (AUTH_MEMBER && AUTH_MEMBER.id)
          || (!!lastReadAt && row.created_at <= lastReadAt),
  };
}

// When this member last opened each thread. Per browser on purpose — "unread"
// is a property of a person sitting in front of a screen, and syncing it would
// mean opening the app on a laptop marked a thread read on their phone.
const THREAD_READ_KEY = "burnclub-thread-read";

function loadThreadReads() {
  try {
    return JSON.parse(localStorage.getItem(memberKey(THREAD_READ_KEY)) || "{}");
  } catch (e) {
    return {};
  }
}

function markThreadRead(conversationId) {
  const reads = loadThreadReads();
  reads[conversationId] = new Date().toISOString();
  localStorage.setItem(memberKey(THREAD_READ_KEY), JSON.stringify(reads));
}

// The custom groups this member belongs to (2026-10-15). Two reads rather
// than a join, because PostgREST's embedding would need a foreign-key hint
// and this is two small queries against indexed columns.
//
// What comes back is decided by RLS: group_members returns only this member's
// own rows, and member_groups only the groups they are in. If either ever
// returns somebody else's, the bug is in the policy — there is deliberately no
// filter here that would paper over it.
async function fetchMyGroups() {
  if (!SB || !AUTH_MEMBER) return [];
  // Scoped like every other member pull (2026-10-26): unfiltered, a staff
  // account reads every member's group rows and the member app then shows it
  // sitting in every group chat in the club.
  const mine = await SB.from("group_members").select("group_id")
    .eq("member_id", AUTH_MEMBER.id);
  if (mine.error || !mine.data || !mine.data.length) return [];
  const ids = mine.data.map((r) => r.group_id);
  const groups = await SB.from("member_groups").select("id,name").in("id", ids);
  if (groups.error) return [];
  return groups.data || [];
}

// `conversationIds` is the member's OWN threads, passed in by the caller which
// is the side that knows them (2026-10-26). Same reason as the member_id
// filters above: the messages policy lets staff read every thread, so a staff
// account reading through the member app would otherwise pull other members'
// DMs into its own inbox and unread count.
async function fetchMessages(conversationIds) {
  if (!SB || !AUTH_MEMBER) return { ok: false, reason: "not signed in" };
  if (Array.isArray(conversationIds) && !conversationIds.length) {
    return { ok: true, messages: [] };
  }
  // Oldest first so a thread reads top to bottom with no sort on the client.
  // Capped: a year of a six-person group chat is not something to pull on
  // every app open, and nobody scrolls back past a few hundred.
  let q = SB.from("messages").select("*");
  if (Array.isArray(conversationIds)) q = q.in("conversation_id", conversationIds);
  const { data, error } = await q.order("created_at", { ascending: true }).limit(500);
  if (error) { recordSyncError("messages", error.message); return { ok: false, reason: error.message }; }
  const reads = loadThreadReads();
  return { ok: true, messages: (data || []).map((r) => messageFromRow(r, reads[r.conversation_id])) };
}

// One row, inserted and returned, so the caller renders the server's copy
// rather than a local guess that might differ. Returns null on failure and
// says why — a send that silently vanishes is worse than one that errors.
async function pushMessage({ conversationId, kind, memberId, programId, groupId, body }) {
  if (!SB || !AUTH_MEMBER) return { ok: false, reason: "not signed in" };
  const row = {
    conversation_id: conversationId,
    kind,
    member_id: kind === "dm" ? memberId : null,
    program_id: kind === "group" ? programId : null,
    group_id: kind === "custom" ? groupId : null,
    sender_id: AUTH_MEMBER.id,
    sender_name: [AUTH_MEMBER.first_name, AUTH_MEMBER.last_name].filter(Boolean).join(" ")
                 || AUTH_MEMBER.first_name || "Member",
    is_staff: false,
    body,
  };
  const { data, error } = await SB.from("messages").insert(row).select().maybeSingle();
  if (error) { recordSyncError("messages", error.message); return { ok: false, reason: error.message }; }
  return { ok: true, message: messageFromRow(data, null) };
}

window.addEventListener("online", () => { SYNC_STATE.online = true; drainSyncQueue(); });
