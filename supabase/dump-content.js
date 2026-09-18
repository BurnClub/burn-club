// Dumps the content tables out of admin/data.js as JSON, for generate-seed.py.
// Reads the real seed rather than a retyped copy, so the database cannot
// disagree with the app about what an exercise is.
var out = {
  programs: PROGRAMS.map(function (p) {
    return { id: p.id, name: p.name, schedule_type: p.scheduleType, status: p.status,
             duration_weeks: p.durationWeeks || null, workouts_per_week: p.workoutsPerWeek || null,
             circuits_per_week: p.circuitsPerWeek || null, description: p.description || null,
             color: p.color || null };
  }),
  folders: FOLDERS.map(function (f) {
    return { id: f.id, name: f.name, program_id: f.program || null, is_live: !!f.live };
  }),
  exercises: EXERCISE_LIBRARY.map(function (e) {
    return { id: e.id, name: e.name, body_parts: e.bodyParts || [], equipment: e.equipment || [],
             modality: e.modality || "Strength", technique: e.technique || "",
             track_weight: !!e.trackWeight };
  }),
  workouts: [], blocks: [], block_exercises: [], schedule: [], benchmarks: [],
  app_settings: [], block_format_notes: []
};

function programOf(c) {
  if (c.programId) return c.programId;
  var f = FOLDERS.filter(function (x) { return x.id === c.folderId; })[0];
  return f ? f.program : null;
}
var byName = {}; EXERCISE_LIBRARY.forEach(function (e) { byName[e.name] = e.id; });
var unresolved = {};

CIRCUITS.forEach(function (c) {
  var pid = programOf(c);

  out.workouts.push({
    id: c.id, program_id: pid || null, folder_id: c.folderId || null,
    slot_id: c.slotId || null, variant: c.variant || null,
    available_from: c.availableFrom || null, is_always: !!c.always,
    category: c.category, tag: c.tag || null, title: c.title,
    focus: c.focus || null, difficulty: c.difficulty || null,
    description: c.desc || null, is_benchmark: !!c.isBenchmark,
    benchmark_id: c.benchmarkId || null
  });
  (c.blocks || []).forEach(function (b, bi) {
    var key = c.id + "#" + (bi + 1);
    out.blocks.push({ key: key, workout_id: c.id, position: bi + 1, type: b.type,
      label: b.label || null, rounds: b.rounds || null, work_sec: b.work || null,
      rest_sec: b.rest || null, duration_sec: b.duration || null,
      interval_sec: b.interval || null, scheme: b.scheme || null });
    var list = b.exercises || (b.exercise ? [b.exercise] : []);
    list.forEach(function (e, ei) {
      var id = byName[e.name];
      if (!id) { unresolved[e.name] = (unresolved[e.name] || 0) + 1; return; }
      out.block_exercises.push({ block_key: key, position: ei + 1, exercise_id: id,
        sets: b.sets || null, reps: (e.reps != null ? e.reps : (b.reps != null ? b.reps : null)) });
    });
  });
});

Object.keys(SCHEDULE_TEMPLATES).forEach(function (pid) {
  SCHEDULE_TEMPLATES[pid].forEach(function (s) {
    out.schedule.push({ program_id: pid, day: s.day, type: s.type,
                        workout_slot_id: s.workoutId || null });
  });
});

PROGRAMS.forEach(function (p) {
  (p.benchmarks || []).forEach(function (b) {
    out.benchmarks.push({ id: b.id, program_id: p.id, name: b.name,
                          subtitle: b.subtitle || null, score_type: b.scoreType });
  });
});

Object.keys(APP_SETTINGS_DEFAULTS).forEach(function (k) {
  out.app_settings.push({ key: k, value: APP_SETTINGS_DEFAULTS[k] });
});
Object.keys(BLOCK_FORMAT_NOTES).forEach(function (k) {
  out.block_format_notes.push({ block_type: k, body: BLOCK_FORMAT_NOTES[k] });
});

out.__unresolved = unresolved;
print(JSON.stringify(out));
