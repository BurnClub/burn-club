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
    savedWorkouts: {
      key: SAVED_WORKOUTS_KEY, table: "saved_workouts",
      // The title travels with the id, so a saved workout stays readable if
      // the content it points at is renamed or retired - same reason
      // showcasedPRs carries an exercise_name.
      toRows: (list) => list.map((w) => ({
        member_id: me(), workout_id: w.id, title: w.title || null,
      })),
      onConflict: "member_id,workout_id",
      fromRows: (rows) => rows.map((r) => ({ id: r.workout_id, title: r.title || "" })),
      order: "saved_at",
      replace: true,   // unsaving is a delete, not an update
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
// What keeps a REMOVED note from coming back on a pull is the dirty flag, not
// anything here (tester T-20). A removal marks `sessionNotes` dirty and the
// flag is only cleared by a push that succeeded, so hydrate skips the store
// entirely and never asks the server for it. There is a check that watches
// for the query and sees it not happen.
//
// A filter on pending removals sat here for a while. No test could reach it:
// every route I could build had the store dirty by the time the pull looked,
// and dead code that looks like a safety net is worse than none, because the
// next person trusts it. If the dirty flag ever stops covering this, the
// check in session-note-removal.test.js is where it will show.
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

// ---------------- Leaving the device (2026-11-24, tester T-88) ----------------
// Signing out ended the session and cleared the small profile cache, and left
// everything else exactly where it was. A tester found 17 keys, about 32 KB,
// belonging to an account that had signed out of this browser months ago:
// their completions, daily stats, check-ins, habits, notebook notes,
// benchmarks, equipment and saved workouts. Nothing was ever SHOWN to the next
// member — every read goes through memberKey(), scoped to whoever is signed in
// — so this was never a data mix-up. It is that a shared phone, a borrowed
// tablet or a gym iPad kept the last person's training history after they had
// signed out and believed they were gone.
//
// discardLocalMemberData() already walks exactly the right keys. It was
// written for a server-side reset; this is the same sweep for a different
// reason, with one condition on it.
//
// NEVER anything that has not reached the server. A store still dirty is work
// that exists only on this device, and choosing to sign out is not choosing to
// throw that away. In that case the data stays and the member is told — a
// sweep that quietly skipped would be worse than no sweep, because they would
// believe the device was clean.
function forgetThisDeviceOnSignOut() {
  if (!AUTH_MEMBER) return { cleared: 0, kept: [] };
  const kept = [...loadDirty()];
  SYNC_STATE.queue.forEach((n) => { if (kept.indexOf(n) === -1) kept.push(n); });
  if (kept.length) return { cleared: 0, kept };
  return { cleared: discardLocalMemberData(), kept: [] };
}

// How much of this browser's storage belongs to somebody who is not signed in
// — counted, never read. The sweep above only runs from now on, so anything
// left by a sign-out before today is still here, and removing it is not a
// decision this code can take: another account's unsynced work could be in
// there and only that member can say whether it matters. So it is reported
// rather than deleted, which at least makes it something a person can see.
function otherAccountDataOnDevice() {
  const mine = AUTH_MEMBER ? AUTH_MEMBER.id : null;
  let keys = 0, bytes = 0;
  Object.keys(localStorage).forEach((k) => {
    // Never the sign-in itself, same as the sweep.
    if (k.startsWith("sb-")) return;
    // Matched the way the sweep matches — by the member id on the END — and
    // NOT by a "burnclub-" prefix. Not every member key has one: the
    // equipment list is "burnClubMyEquipment-<id>", and a counter that quietly
    // skipped it would report a device as cleaner than a sweep would leave it.
    // What this counts has to be exactly what discardLocalMemberData() takes.
    const m = k.match(/-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (!m) return;
    if (mine && m[1].toLowerCase() === String(mine).toLowerCase()) return;
    keys++;
    bytes += (localStorage.getItem(k) || "").length;
  });
  if (!keys) return "none";
  return keys + " item" + (keys === 1 ? "" : "s") + ", about " + Math.round(bytes / 1024) + " KB";
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
//
// ABANDONING (2026-11-17, tester T-1/T-2). Nothing in here had a time limit, so
// a connection that stalled held a member on the logo or the login form for as
// long as it liked. The caller now stops waiting after a few seconds on a
// device that already holds the member's data, and lets them in on that copy.
// The requests it walked away from still come back later, and a pull landing
// then would replace a store the member may have edited in the meantime —
// after `stillDirty` was read, so nothing would protect the edit. So every
// write below checks live() first: an abandoned hydrate may finish its
// uploads, but it never writes to this device again.
let HYDRATE_GEN = 0;
const HYDRATED_KEY = "burnclub-hydrated";

function abandonHydrate() { HYDRATE_GEN++; }

// Has this device ever finished a full pull for this member? If not, there is
// nothing to let them in on, and waiting is the only honest option.
function deviceHasHydrated() {
  try { return localStorage.getItem(memberKey(HYDRATED_KEY)) === "1"; }
  catch (e) { return false; }
}

// For an entry that skipped hydrate altogether: anything a previous page load
// left unsynced still needs its retry, and hydrate was the only thing giving
// it one across a reload.
function resumeDirtySync() {
  const dirty = loadDirty();
  if (!dirty.size) return;
  dirty.forEach((n) => SYNC_STATE.queue.add(n));
  drainSyncQueue();
}

async function hydrateMemberData() {
  if (!SB || !AUTH_MEMBER) return { ok: false, reason: "not signed in" };
  const stores = syncStores();
  const report = {};
  const gen = ++HYDRATE_GEN;
  const live = () => gen === HYDRATE_GEN;

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
  if (!live()) return { ok: false, reason: "abandoned", report };

  // A store still dirty after reconcile is one whose push failed. Its local
  // copy is newer than anything the server has, so pulling over it would lose
  // the member's edit — leave it and let the queue retry.
  const stillDirty = loadDirty();

  // ...with ONE exception, and it is a data-loss bug the first trial could
  // have hit (tester T-50, suspected there, reproduced here).
  //
  // A REPLACING store pushes by deleting everything the member has in that
  // table and inserting this device's list. The dirty flag is what makes that
  // safe: a device may only replace a list it actually edited. But a device
  // that has never completed a pull has not edited the member's list - it has
  // built one in ignorance of it. Harness, against this file: a member with
  // three saved workouts, a new phone that has never hydrated, the member
  // taps Save on one, and the server goes from three rows to one.
  //
  // So on a device's FIRST pull, a dirty replacing store takes the server's
  // copy rather than being protected. The member loses the one thing they
  // saved before that phone had ever synced; nothing already on the server is
  // lost. Chris's call, 2026-11-26, over merging the two - merging needs
  // per-store identity rules and is the two-device conflict work he has
  // parked.
  //
  // MERGING stores are not touched by this: they upsert, so a dirty one goes
  // up and nothing of the member's is lost by waiting. Overwriting those
  // would throw away a workout done offline, which is the opposite mistake.
  const everPulled = deviceHasHydrated();
  const keepsLocalEdit = (name) =>
    stillDirty.has(name) && (everPulled || !REPLACE_STORES.has(name));

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
    if (keepsLocalEdit(name)) { report[name] = "unsynced local edit — kept"; return; }
    // A dirty store that got past that line is a REPLACING one on a device's
    // first pull: a list built in ignorance of the member's. The server's
    // copy wins — but only if there IS one. The empty-server branch below
    // treats empty as a real answer ("the member has no pins") precisely
    // because a dirty store could never reach it, so an empty table must not
    // be allowed to clear a list this device has not managed to send yet.
    const firstPull = stillDirty.has(name);
    const s = stores[name];
    const { data, error } = await SB.from(s.table).select("*")
      .eq("member_id", AUTH_MEMBER.id)
      .order(s.order, { ascending: true });
    if (!live()) { report[name] = "abandoned"; return; }
    if (error) { report[name] = "error: " + error.message; return; }
    if (!data || !data.length) {
      if (firstPull) {
        report[name] = "empty on server — unsynced local list kept";
        return;
      }
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
      if (!live()) { report[name] = "abandoned"; return; }
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
      const localSetWeights = {};
      local.forEach((c) => {
        if (c.weights && Object.keys(c.weights).length) localWeights[c.id] = c.weights;
        // The per-set detail needs the same protection as the totals above
        // (2026-11-17). It was not kept, so a completion whose lifts push had
        // failed lost its sets on the next pull - the one copy that still had
        // them being the device we were about to overwrite.
        if (c.setWeights && Object.keys(c.setWeights).length) localSetWeights[c.id] = c.setWeights;
      });
      let kept = 0;
      mapped.forEach((c) => {
        if ((!c.weights || !Object.keys(c.weights).length) && localWeights[c.id]) {
          c.weights = localWeights[c.id];
          kept++;
        }
        if ((!c.setWeights || !Object.keys(c.setWeights).length) && localSetWeights[c.id]) {
          c.setWeights = localSetWeights[c.id];
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
    if (firstPull) clearDirty(name);
    localStorage.setItem(memberKey(s.key), JSON.stringify(mapped));
    report[name] = firstPull ? `first pull — server's ${data.length} rows` : `${data.length} rows`;
  });

  const nested = [
    ["habitChecks", "habit_checks", HABIT_CHECKS_STORAGE_KEY, habitChecksFromRows],
    ["notebookNotes", "notebook_notes", NOTEBOOK_NOTES_KEY, notebookNotesFromRows],
    ["sessionNotes", "session_notes", SESSION_NOTES_KEY, sessionNotesFromRows],
  ].map(async ([name, table, key, from]) => {
    if (keepsLocalEdit(name)) { report[name] = "unsynced local edit — kept"; return; }
    // Same rule as the registry pull above, and the same caveat: an empty
    // server must not clear a list this device has not managed to send.
    const firstPull = stillDirty.has(name);
    const { data, error } = await SB.from(table).select("*").eq("member_id", AUTH_MEMBER.id);
    if (!live()) { report[name] = "abandoned"; return; }
    if (error) { report[name] = "error: " + error.message; return; }
    if (!data || !data.length) {
      if (firstPull) {
        report[name] = "empty on server — unsynced local list kept";
      } else if (REPLACE_STORES.has(name)) {
        localStorage.setItem(memberKey(key), JSON.stringify(from([])));
        report[name] = "empty on server — cleared";
      } else {
        report[name] = "empty — kept local";
      }
      return;
    }
    if (firstPull) clearDirty(name);
    localStorage.setItem(memberKey(key), JSON.stringify(from(data)));
    report[name] = `${data.length} rows`;
  });

  // Preferences are one row of scalars rather than a list, and they are the
  // reason several of these exist at all: a reinstall used to replay the tour
  // and re-ask about check-ins because the flags were per-browser.
  const prefs = (async () => {
    const { data, error } = await SB.from("member_preferences").select("*")
      .eq("member_id", AUTH_MEMBER.id).maybeSingle();
    if (!live()) { report.preferences = "abandoned"; return; }
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
    // Written even when empty, unlike the two above: an empty list is a real
    // answer here. A member who clears every box on one phone must see it
    // cleared on the other, and skipping the write would restore the old list
    // from local storage on the next load.
    if (Array.isArray(data.equipment)) {
      localStorage.setItem(memberKey(MY_EQUIPMENT_KEY), JSON.stringify(data.equipment));
    }
    report.preferences = "loaded";
  })();

  const extras = (async () => {
    const { data: sched, error: schedErr } = await SB.from("scheduled_items").select("*")
      .eq("member_id", AUTH_MEMBER.id);
    if (!live()) return;
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
    if (!live()) return;
    if (hp && hp.profile && Object.keys(hp.profile).length) {
      // Merge into the shared bridge object rather than replacing it, so a
      // profile belonging to another member in this browser survives.
      const all = (typeof loadHealthProfiles === "function") ? loadHealthProfiles() : {};
      all[AUTH_MEMBER.id] = hp.profile;
      localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify(all));
      report.healthProfile = "loaded";
    }
  })();

  // allSettled, not all: this function's contract is to RETURN {ok, report},
  // and enterAsAuthedMember() is written to carry on when ok is false — a
  // hydrate that could not finish is not a reason to refuse a member entry to
  // their own app. Promise.all broke that promise two ways. One rejection
  // abandoned every other pull mid-flight, and the rejection then escaped the
  // function entirely, past a caller that only ever checks the return value.
  //
  // There is real throwing code in here: JSON.parse of localStorage above
  // (corrupt or truncated storage throws, and a half-written quota-exceeded
  // value is exactly the shape that does), and any fromRows() meeting a column
  // it did not expect. Each is per-device, which is the kind of fault that
  // reaches one member and nobody else (2026-10-28).
  const settled = await Promise.allSettled([...pulls, ...nested, prefs, extras]);
  settled.forEach((r, i) => {
    if (r.status !== "rejected") return;
    const why = (r.reason && (r.reason.message || r.reason.name)) || "threw";
    console.warn("[sync] hydrate part " + i + " failed:", r.reason);
    report["__threw" + i] = "error: " + why;
  });
  if (!live()) return { ok: false, reason: "abandoned", report };
  SYNC_STATE.lastError = Object.values(report).find((v) => String(v).startsWith("error")) || null;
  // Stop a "not backing up" clock that nothing is keeping true any more
  // (2026-11-05). The guard inside warnIfStale() cannot do this on its own:
  // warnIfStale() is reached ONLY from the failure branch of drainSyncQueue,
  // so a device whose problem was fixed long ago never runs the check that
  // would clear it. Here it runs on every sign-in, failure or not.
  if (!loadDirty().size && !SYNC_STATE.queue.size) clearUnsynced();
  // Only a pull with no errors counts: this flag is what later lets the app
  // open on the local copy without waiting, so it must mean the copy is whole.
  if (!SYNC_STATE.lastError) {
    try { localStorage.setItem(memberKey(HYDRATED_KEY), "1"); } catch (e) {}
  }
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
  // Stop the "not backing up" clock when this path is what rescued the work
  // (2026-11-05). clearUnsynced() used to be called from ONE place: the
  // success branch of drainSyncQueue(). But reconcileLocalUp() is the other
  // half of the retry story - it is what pushes a stranded store on the next
  // sign-in, and it cleared the dirty flags without ever stopping the clock.
  //
  // So a push that failed once, succeeded on the next launch, and has been
  // fine ever since still warned the member every session, with the number
  // climbing forever. Chris saw "33 days" on a phone whose data was already
  // on the server.
  else clearUnsynced();
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
const REPLACE_STORES = new Set(["showcasedPRs", "notebookNotes", "scheduledItems", "preferences", "myHabits", "savedWorkouts"]);
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

// What this DEVICE knows about its own backup, in words a member can read off
// a phone and send on (2026-11-05).
//
// Chris's phone warned that his workouts had not backed up for 33 days while
// his Mac reported a completely clean syncStatus(). Both were true: the dirty
// set and the stale clock live in localStorage, so a store stuck on one device
// is invisible from every other one - and the only place it could be read was
// a console, which is the one tool a phone does not have.
function syncDiagnosticsText() {
  const lines = [];
  const add = (k, v) => lines.push(k + ": " + v);
  try {
    add("Signed in as", AUTH_MEMBER ? AUTH_MEMBER.email : "not signed in");
    add("Online", (typeof navigator !== "undefined" && navigator.onLine === false) ? "no" : "yes");

    const dirty = [...loadDirty()];
    add("Waiting to upload", dirty.length ? dirty.join(", ") : "nothing");
    add("Queued right now", [...SYNC_STATE.queue].join(", ") || "nothing");
    add("Failed attempts", SYNC_STATE.failures || 0);

    const since = Number(localStorage.getItem(staleKey()) || 0);
    add("Backup stuck since", since ? new Date(since).toLocaleString() : "not stuck");

    // How much is actually at risk. "completions is stuck" says nothing about
    // whether that is one session or three months of them.
    const stores = (typeof syncStores === "function" && AUTH_MEMBER) ? syncStores() : {};
    dirty.forEach((name) => {
      const def = stores[name];
      if (!def) return;
      try {
        const raw = localStorage.getItem(memberKey(def.key));
        const list = raw ? JSON.parse(raw) : [];
        add("  " + name + " holds", Array.isArray(list) ? list.length + " record(s)" : "1 record");
      } catch (e) {
        add("  " + name + " holds", "unreadable (" + (e.name || "error") + ")");
      }
    });

    const errs = Object.keys(SYNC_STATE.errors || {});
    if (errs.length) errs.forEach((t) => add("Error on " + t, SYNC_STATE.errors[t].message));
    else add("Errors this session", "none recorded yet");

    add("App version", typeof appVersion === "function" ? appVersion() : "unknown");
    add("Checked at", new Date().toLocaleString());
  } catch (e) {
    lines.push("Could not read sync state: " + (e.message || e));
  }
  return lines.join("\n");
}

function warnIfStale() {
  if (staleWarnedThisSession) return;
  const since = Number(localStorage.getItem(staleKey()) || 0);
  if (!since || Date.now() - since < STALE_WARN_AFTER_MS) return;
  // Self-correcting, so this can never again shout about work that is not
  // actually stranded. The clock is a record of when a failure STARTED; what
  // makes it still true is whether anything is dirty or queued right now. A
  // marker left behind by a fixed problem is a warning that trains the member
  // to ignore the one that matters.
  if (!loadDirty().size && !SYNC_STATE.queue.size) {
    clearUnsynced();
    return;
  }
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
  // Not from a device that has never pulled (tester T-50). Pushing a
  // replacing store DELETES everything the member has in that table first,
  // and a device that has never seen their list is in no position to say what
  // it should be. Held rather than dropped: it stays dirty and queued, and
  // the first pull decides what this device's copy should be.
  if (REPLACE_STORES.has(name) && !deviceHasHydrated()) return false;
  try {
    if (name === "habitChecks") return await pushRows("habit_checks", habitChecksToRows(HABIT_CHECKS), "member_id,habit_id,checked_on");
    if (name === "notebookNotes") return await pushReplace("notebook_notes", notebookNotesToRows(NOTEBOOK_NOTES), "member_id,kind,position");
    if (name === "sessionNotes") return await pushSessionNotes();
    if (name === "preferences") return await pushPreferences();
    if (name === "healthProfile") return await pushHealthProfile();
    if (name === "scheduledItems") return await pushScheduledItems();

    const s = syncStores()[name];
    if (!s) return true;
    const local = JSON.parse(localStorage.getItem(memberKey(s.key)) || "null");
    if (!local) return true;
    const rows = s.toRows(local);
    const ok = s.replace
      ? await pushReplace(s.table, rows, s.onConflict)
      : await pushRows(s.table, rows, s.onConflict);
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

// Which set a weight belongs to, read off the label the member saw.
// Labels are written as "Set 3", and with a cue as "Set 3 · left side";
// records written before 2026-10-16 say "Round 3" for the same thing.
function setNumberFromLabel(label) {
  const m = /^\s*(?:set|round)\s+(\d+)/i.exec(String(label == null ? "" : label));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function liftsToRows(completions) {
  const rows = [];
  completions.forEach((c) => {
    // Which exercises the per-set branch below has already written, so the
    // by-exercise branch can fill in the ones it did not (tester T-69).
    const perSet = new Set();
    // Per set where we have it (2026-10-02), one row per exercise where we
    // don't. BOTH, where a workout has both kinds of block. setWeights keys are "blockIndex|Exercise Name|Set 2"; the label
    // is what the member saw, so it is what gets stored rather than an index
    // they would have to decode.
    if (c.setWeights && Object.keys(c.setWeights).length) {
      // PRESERVE the set numbers, do not impose them (2026-11-17, tester T-23
      // and the legacy shape found straight after it).
      //
      // The pull rebuilds these keys as "<set_number>|Name|Label", so segment 0
      // is the server's own number. Writing a fresh 1, 2, 3... over it meant
      // this function answered differently depending on the ORDER it was
      // handed, and any workout not already numbered the new way had its rows
      // copied onto new slots on every open, with the old ones left behind:
      // 6 rows to 12 to 16 to 19 to 20 over five opens, without limit.
      //
      // A key written by the PLAYER has the block index in that slot instead,
      // which is the same for every set of an exercise, so it cannot be used.
      // That is exactly what tells the two apart: server numbers are distinct
      // within an exercise, block indexes repeat. Keep them when they are
      // distinct, number 1..k when they are not. Both cases are then a fixed
      // point - push(pull(x)) lands on x - which is the property that matters.
      const entries = [];
      Object.keys(c.setWeights).forEach((key) => {
        const weight = Number(c.setWeights[key]);
        if (!Number.isFinite(weight) || weight <= 0) return;
        const parts = key.split("|");
        const name = parts[1];
        if (!name) return;
        const given = Number(parts[0]);
        entries.push({
          name, weight, label: parts[2] || null,
          given: Number.isInteger(given) && given > 0 ? given : null,
        });
      });
      if (entries.length) {
        const byName = {};
        entries.forEach((e) => { (byName[e.name] = byName[e.name] || []).push(e); });
        Object.keys(byName).forEach((name) => {
          const list = byName[name];
          const nums = list.map((e) => e.given);
          const keep = nums.every((n) => n !== null)
            && new Set(nums).size === nums.length;

          // THE LABEL IS THE SET (2026-11-21, tester T-61).
          //
          // Numbering by the order the keys happen to sit in filed a member's
          // weights against whatever set they typed first: clearing a box
          // deletes its key and retyping re-inserts it at the end, so going
          // back to fix one number moved it to the bottom. A descending
          // scheme entered from the lightest set up came out exactly
          // inverted. The set labels were right there in the keys the whole
          // time, saying which set each weight belongs to.
          const labelled = list.map((e) => setNumberFromLabel(e.label));
          const allLabelled = labelled.every((n) => n !== null)
            && new Set(labelled).size === labelled.length;
          // When the server has already numbered these, only re-file them if
          // the labels are a rearrangement of the SAME numbers. That repairs
          // rows already crossed without ever writing to a slot that was not
          // in use, which is what left orphans behind in tester T-23.
          const samePositions = keep
            && labelled.slice().sort().join() === nums.slice().sort().join();

          if (allLabelled && (!keep || samePositions)) {
            list.forEach((e, i) => { e.setNumber = labelled[i]; });
          } else if (keep) {
            list.forEach((e) => { e.setNumber = e.given; });
          } else {
            // Nothing authoritative to go on — a cued superset can show two
            // "Set 1"s (left and right). Order by the label where there is
            // one, which at least keeps the member's own reading order, and
            // number from there.
            const order = list.map((e, i) => i).sort((a, b) => {
              const la = labelled[a] === null ? Infinity : labelled[a];
              const lb = labelled[b] === null ? Infinity : labelled[b];
              return la === lb ? a - b : la - lb;
            });
            order.forEach((idx, pos) => { list[idx].setNumber = pos + 1; });
          }
        });
        entries.forEach((e) => {
          perSet.add(e.name);
          rows.push({
            member_id: AUTH_MEMBER.id, completion_client_id: c.id,
            exercise_id: exerciseIdForName(e.name),
            exercise_name: e.name, weight: e.weight, performed_on: c.date,
            set_number: e.setNumber, set_label: e.label,
          });
        });
        // NO early return (2026-11-23, tester T-69). This used to stop here,
        // which threw away every weight typed into an EMOM or AMRAP box the
        // moment a workout ALSO had a per-set screen in it — three of the six
        // workouts on the programme the testers are on. Those boxes write to
        // the by-exercise map below and nothing else, `completions` has no
        // column for it, and the next pull overwrote the local copy from the
        // rows that were never written, so it went from the phone too. The
        // member was told nothing and their notebook listed six exercises
        // where they had lifted nine.
      }
    }
    if (!c.weights) return;
    Object.keys(c.weights).forEach((name) => {
      // An exercise with per-set rows is already fully described by them, and
      // the by-exercise map holds only one number for the whole session, so
      // there is no honest set to put it on — writing it would land on set 1
      // and overwrite real data. Per set wins; this is only for the exercises
      // that have no per-set rows at all, which is exactly what an EMOM or an
      // AMRAP produces.
      if (perSet.has(name)) return;
      const weight = Number(c.weights[name]);
      // `> 0` as well as finite, which this branch never had and its
      // neighbour always did (tester T-65): a 0 or a -50 typed into the
      // AMRAP box was written to the member's history as a lift.
      if (!Number.isFinite(weight) || weight <= 0) return;
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

// Rebuilds BOTH halves of a completion's weights from the server's rows
// (2026-11-17, tester T-5). This used to keep one number per exercise, last
// row wins, and throw the per-set detail away. Two app opens after any
// workout, that flattened copy went back up as "set 1, no label" - which for
// the first exercise overwrote the real set 1 and for every other exercise
// added a phantom extra set. Every multi-set lift on the live database had
// already been damaged this way, silently, with no error anywhere.
//
// Three things this has to get right:
//
// ORDER. liftsToRows() numbers each exercise's sets from the ORDER of the keys
// it is given, so the keys are rebuilt in ascending set_number. Push the result
// straight back and it reproduces the same rows rather than a different
// numbering. Getting this wrong is not cosmetic: it was T-23, where every open
// renumbered an old workout's rows onto their neighbours' slots, kept the
// originals, and read the bigger set back on the next pull - 26 rows to 113 in
// a handful of reloads, accelerating, with nothing visible in the app.
//
// THE KEY. Its shape is "blockIndex|Exercise Name|Set 2" and the block index
// is not on the server. set_number takes that slot instead: liftsToRows()
// reads only the name and the label, and set_number is unique within a
// completion, so the same exercise appearing in two blocks under the same
// label cannot collide the way a shared placeholder would.
//
// THE TOP NUMBER. `weights` has always been documented as the heaviest per
// exercise - personal bests read it - and taking whichever row arrived last
// is what told a member they had just beaten 24 when they had lifted 26.
function liftsOntoCompletions(completions, liftRows) {
  const byCompletion = {};
  const ordered = liftRows.slice()
    .sort((a, b) => (Number(a.set_number) || 0) - (Number(b.set_number) || 0));
  ordered.forEach((r) => {
    if (!r.completion_client_id) return;
    const name = currentNameForLift(r);
    const weight = Number(r.weight);
    if (!name || !Number.isFinite(weight)) return;
    const c = byCompletion[r.completion_client_id]
      || (byCompletion[r.completion_client_id] = { weights: {}, setWeights: {} });
    const seen = Number(c.weights[name]);
    if (!Number.isFinite(seen) || weight > seen) c.weights[name] = weight;
    const n = r.set_number == null ? 0 : r.set_number;
    c.setWeights[`${n}|${name}|${r.set_label || ""}`] = weight;
  });
  completions.forEach((c) => {
    const got = byCompletion[c.id];
    if (!got) return;
    c.weights = got.weights;
    if (Object.keys(got.setWeights).length) c.setWeights = got.setWeights;
  });
  return completions;
}

// Two rows in ONE statement that collide with each other are rejected by
// Postgres outright — "ON CONFLICT DO UPDATE command cannot affect row a
// second time" on an upsert, "duplicate key value violates unique constraint"
// on an insert. Not the row being rejected: the WHOLE STATEMENT. So one
// duplicated record locally means nothing in that store ever reaches the
// server again (2026-11-05).
//
// And it cannot recover on its own, which is the part that cost 33 days.
// hydrateMemberData() deliberately skips pulling a store with an unsynced
// local edit, so that a pull cannot destroy work that never went up. A store
// stuck like this is permanently dirty — so the pull that would have replaced
// the duplicates with the server's clean copy is exactly the thing that is
// switched off. Push fails, store stays dirty, pull stays disabled, forever.
// Chris's phone sat there for 33 days holding 26 check-ins, warning him daily,
// with no way to say why.
//
// The last occurrence wins: these arrays are written in order, so the later
// one is the member's more recent answer for that key.
function dedupeRows(rows, onConflict) {
  if (!onConflict || rows.length < 2) return rows;
  const cols = onConflict.split(",").map((c) => c.trim()).filter(Boolean);
  if (!cols.length) return rows;
  const byKey = new Map();
  rows.forEach((r) => byKey.set(cols.map((c) => String(r[c])).join("\u0000"), r));
  if (byKey.size !== rows.length) {
    // Worth saying out loud. The push now succeeds either way, but a store
    // that keeps needing this has a writer somewhere making duplicates.
    console.warn(`[sync] ${rows.length - byKey.size} duplicate row(s) collapsed on ${onConflict}`);
  }
  return [...byKey.values()];
}

// Rows this server has already refused outright, per table, so they are not
// sent again and again. In memory only, deliberately: a reload tries them
// once more, which is what you want if the cause was fixed at the other end.
const REFUSED_ROWS = {};

function rowKeyFor(row, onConflict) {
  const cols = String(onConflict || "").split(",").map((c) => c.trim()).filter(Boolean);
  if (!cols.length) return JSON.stringify(row);
  return cols.map((c) => String(row[c])).join("\u0000");
}

// A row the server will never accept, as opposed to a request that did not
// get there. Postgres class 22 is a data exception (numeric overflow, bad
// syntax for a type), class 23 an integrity violation (not-null, check,
// foreign key, unique). Retrying either in half an hour changes nothing.
// Anything else — no connection, a timeout, an expired token, a policy that
// has to be fixed server-side — keeps the old behaviour and is retried,
// because those DO come back.
function isRowRefusal(error) {
  if (!error) return false;
  // Not a refusal however it is worded: a policy the member cannot satisfy
  // today may be fixed server-side tomorrow, and every row would fail it, so
  // treating this as "one bad row" would set the whole history aside one row
  // at a time. It keeps the old behaviour and is retried.
  if (String(error.code || "") === "42501") return false;
  const m = String(error.message || "").toLowerCase();
  if (m.includes("row-level security") || m.includes("row level security")) return false;
  if (/^2[23]/.test(String(error.code || ""))) return true;
  return m.includes("overflow") || m.includes("out of range")
      || m.includes("invalid input syntax")
      || m.includes("violates check constraint")
      || m.includes("violates not-null constraint")
      || m.includes("violates foreign key constraint")
      || m.includes("violates unique constraint");
}

// Said in the member's words rather than Postgres's. `lifts` is the one that
// has actually happened, so it names the exercise and the number.
function describeRefusedRow(table, row, error) {
  const why = String((error && error.message) || "refused").split("\n")[0];
  if (table === "lifts") {
    return `${row.exercise_name || "A weight"} ${row.weight} couldn't be backed up (${why}). Everything else did.`;
  }
  return `One ${table} row couldn't be backed up (${why}). Everything else did.`;
}

// One bad row must not take the batch with it.
//
// PostgREST fails the WHOLE STATEMENT on one unacceptable row, and these
// pushes carry the member's entire history for a store — so a single weight
// of 12345 in `lifts` (the column is numeric(6,2)) meant not one weight from
// any workout, past or future, ever reached the server again, retrying every
// 30 seconds for ever, in silence (tester T-59). That is the same shape as
// the duplicate-rows incident above, which cost 33 days.
//
// So: when the server refuses the DATA, split the batch and find the row it
// objects to, land everything either side of it, and set that one aside with
// a message that names it. The store then goes clean, which means the next
// workout backs up normally and the "nothing has backed up for N days"
// warning stops firing about work that did.

// How many rows one push will set aside before it stops and calls the whole
// thing a failure instead. One bad number is a bad number; a batch where row
// after row is refused is not — that is the statement being wrong, and it is
// the kind of thing that gets fixed at the other end, so it is retried.
//
// Was 5, which put a cliff in the middle of ordinary data (tester T-67): six
// impossible weights and the member was back in the T-59 state — nothing set
// aside, store dirty for ever, retrying every 30 seconds — and this time with
// no toast at all, because the message was only ever sent on the path that
// did not abort. Both halves are fixed: 20 is past anything a member types by
// hand, and the abort now SAYS so.
const MAX_SET_ASIDE_PER_PUSH = 20;

async function pushRows(table, rows, onConflict) {
  const run = { setAside: [], said: [], aborted: false };
  const ok = await pushRowsSplitting(table, rows, onConflict, run);
  if (run.aborted) {
    // Put back everything this attempt set aside: it was not one bad row.
    const set = REFUSED_ROWS[table];
    if (set) run.setAside.forEach((k) => set.delete(k));
    // And say so. Silence here is what made T-67 worse than the bug it came
    // from: the member's weights stopped backing up and the only thing they
    // ever saw was a warning days later saying their workouts had not backed
    // up, which was false — the workouts had.
    if (typeof showToast === "function") {
      showToast("Some of your " + table + " can't be backed up. Everything else has been. "
        + "Tell your coach — nothing on this phone is lost.");
    }
    return false;
  }
  if (run.said.length && typeof showToast === "function") showToast(run.said[0]);
  return ok;
}

async function pushRowsSplitting(table, rows, onConflict, run) {
  rows = dedupeRows(rows, onConflict);
  const refused = REFUSED_ROWS[table];
  if (refused && refused.size) rows = rows.filter((r) => !refused.has(rowKeyFor(r, onConflict)));
  if (!rows.length) return true;
  const { error } = await SB.from(table).upsert(rows, { onConflict });
  if (!error) {
    // A table still holding a set-aside row keeps its message: it is the only
    // place the member or Chris can see that something did not make it.
    if (!(REFUSED_ROWS[table] && REFUSED_ROWS[table].size)) delete SYNC_STATE.errors[table];
    return true;
  }
  if (!isRowRefusal(error)) { recordSyncError(table, error.message); return false; }
  if (rows.length === 1) {
    if (run.setAside.length >= MAX_SET_ASIDE_PER_PUSH) {
      run.aborted = true;
      recordSyncError(table, "The server refused too many rows to be one bad one: "
        + String(error.message || "").split("\n")[0]);
      return false;
    }
    const key = rowKeyFor(rows[0], onConflict);
    (REFUSED_ROWS[table] = REFUSED_ROWS[table] || new Set()).add(key);
    run.setAside.push(key);
    const said = describeRefusedRow(table, rows[0], error);
    run.said.push(said);
    recordSyncError(table, said);
    // True on purpose. This row is never going to be accepted, and holding
    // the whole store dirty for it is what the finding was.
    return true;
  }
  const half = Math.ceil(rows.length / 2);
  const first = await pushRowsSplitting(table, rows.slice(0, half), onConflict, run);
  if (run.aborted) return false;
  const second = await pushRowsSplitting(table, rows.slice(half), onConflict, run);
  return first && second;
}

// For stores where removal is meaningful — unpinning a PR, deleting a note.
// An upsert alone would leave the removed rows behind, so the member's list
// and the server's would quietly diverge.
async function pushReplace(table, rows, key) {
  // Same trap as the upsert path: the delete clears what the SERVER holds, so
  // a collision here is always between two rows in the batch being inserted.
  rows = dedupeRows(rows, key);
  const { error: delError } = await SB.from(table).delete().eq("member_id", AUTH_MEMBER.id);
  if (delError) { recordSyncError(table, "clear: " + delError.message); return false; }
  if (!rows.length) return true;
  const { error } = await SB.from(table).insert(rows);
  if (error) { recordSyncError(table, error.message); return false; }
  delete SYNC_STATE.errors[table];
  return true;
}

// Corrupt or truncated localStorage throws, and these used to be bare
// JSON.parse calls - the same fault that took hydrateMemberData() down on
// 2026-11-03. A preferences push is not worth losing a sync over; a stored
// value that cannot be read is treated as one that was never set.
function storedJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("[sync] unreadable localStorage:", key, e);
    return fallback;
  }
}

// Removals first, then what remains (tester T-20).
//
// This store is an upsert, which never removes anything: clearing the box
// took the note off the phone, the push uploaded the notes that were left,
// and the row stayed on the server for a coach to read and for the next pull
// to put back. The member deleted it and it came back.
//
// Only the ids this device was told to remove are touched, and scoped to the
// member. pushReplace() would be shorter and is the wrong tool: it clears
// every row the member has in the table before inserting, so a device that
// has never completed a pull would wipe notes it has never seen.
//
// The list is only cleared once the server has actually let them go. A failed
// delete leaves the store dirty, so it is tried again rather than quietly
// becoming a note that is gone here and present there.
async function pushSessionNotes() {
  const gone = (typeof SESSION_NOTE_DELETES !== "undefined" ? SESSION_NOTE_DELETES : []).slice();
  if (gone.length) {
    const { error } = await SB.from("session_notes").delete()
      .eq("member_id", AUTH_MEMBER.id)
      .in("completion_client_id", gone);
    if (error) { recordSyncError("session_notes", "remove: " + error.message); return false; }
    SESSION_NOTE_DELETES = SESSION_NOTE_DELETES.filter((id) => gone.indexOf(id) === -1);
    if (typeof saveSessionNoteDeletes === "function") saveSessionNoteDeletes();
  }
  return await pushRows("session_notes", sessionNotesToRows(SESSION_NOTES),
    "member_id,completion_client_id");
}

async function pushPreferences() {
  const row = {
    member_id: AUTH_MEMBER.id,
    theme: localStorage.getItem(THEME_KEY) || "system",
    tour_seen: !!localStorage.getItem(memberKey(TOUR_SEEN_KEY)),
    checkin_enabled: localStorage.getItem(memberKey(CHECKIN_ENABLED_KEY)) !== "0",
    checkin_dismissed_on: localStorage.getItem(memberKey(CHECKIN_DISMISS_KEY)) || null,
    notification_prefs: storedJSON(NOTIF_PREFS_KEY, {}),
    wearable: storedJSON(memberKey(WEARABLE_STORAGE_KEY), {}),
    equipment: storedJSON(memberKey(MY_EQUIPMENT_KEY), []),
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
  return await pushReplace("scheduled_items", scheduledItemsToRows(list), "member_id,client_id");
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
// Append a coach note. Returns true when it is safely on the server, so the
// caller knows whether to keep retrying. A duplicate client_id is treated as
// success: it means a previous attempt got there and only the reply was lost.
async function pushCoachNote(clientId, body) {
  if (!SB || !AUTH_MEMBER) return false;
  const { error } = await SB.from("coach_notes")
    .insert({ member_id: AUTH_MEMBER.id, client_id: clientId, body });
  if (!error) return true;
  if (String(error.code) === "23505") return true; // unique violation — already there
  recordSyncError("coach_notes", error.message);
  return false;
}

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
