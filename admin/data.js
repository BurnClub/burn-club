// Sample data for the Burn Club admin prototype — placeholder content only, in-memory.

// ---------------- Dated publishing (2026-08-15) ----------------
// Rolling programs (Burn Club) used to publish by folder placement: staff
// copied a week's workouts into a "This Week's Workouts" live folder, moved
// last week's into "Previous Week", and deleted the week before that. Three
// ordered steps every Sunday, no warning if you got the order wrong, and the
// record of what ran when was destroyed each cycle.
//
// Now a workout carries its own availability and "this week" / "last week"
// are questions asked about that date, not places content is moved between.
// Nothing has to happen on a Sunday, and nothing ages out by being deleted.
//
// Two availability shapes, always explicit — there is deliberately no default,
// so a workout can't publish itself because someone forgot to pick:
//   { always: true }              evergreen (Stretch & Core), never rotates
//   { availableFrom: "2026-08-16" } goes live the week containing that date

// Local calendar-day key (YYYY-MM-DD). Not toISOString(), which converts to
// UTC and rolls "today" over to tomorrow in the evening for any timezone
// behind UTC — that bug already bit the member app's streak logic once.
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateKey(str) {
  const [y, m, d] = String(str).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Weeks start Sunday, matching the day Chris already rotates content on.
function startOfWeek(d) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function shiftWeeks(weekStartKeyStr, n) {
  const d = parseDateKey(weekStartKeyStr);
  d.setDate(d.getDate() + n * 7);
  return dateKey(d);
}

// The Sunday of the week containing a given YYYY-MM-DD.
function weekStartKey(dateStr) {
  return dateKey(startOfWeek(parseDateKey(dateStr)));
}

function currentWeekStartKey() {
  return dateKey(startOfWeek(new Date()));
}

// "Week of Aug 17" — the heading a derived week group gets, replacing the
// folder names staff used to type by hand.
function weekLabel(weekStartKeyStr) {
  const d = parseDateKey(weekStartKeyStr);
  return `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

// live | last-week | scheduled | past | always | undated. Keys are plain
// YYYY-MM-DD strings, so lexicographic comparison is chronological.
function circuitAvailability(circuit) {
  if (circuit.always) return { state: "always", weekStart: null };
  if (!circuit.availableFrom) return { state: "undated", weekStart: null };
  const wk = weekStartKey(circuit.availableFrom);
  const cur = currentWeekStartKey();
  if (wk === cur) return { state: "live", weekStart: wk };
  if (wk === shiftWeeks(cur, -1)) return { state: "last-week", weekStart: wk };
  return { state: wk > cur ? "scheduled" : "past", weekStart: wk };
}

// Seed dates are computed relative to today so the demo never goes stale —
// same reason the seeded completion history is generated rather than fixed.
const SEED_THIS_WEEK = currentWeekStartKey();
const SEED_LAST_WEEK = shiftWeeks(SEED_THIS_WEEK, -1);
const SEED_NEXT_WEEK = shiftWeeks(SEED_THIS_WEEK, 1);

// Body part is its own multi-select tag dimension, separate from modality —
// switched from broad zones (Full Body/Upper Body/Lower Body/Core) to specific
// muscle groups per Chris's request (2026-08-04), so filtering is actually
// useful for programming ("what hits Biceps") rather than a vague zone.
// "Full Body" stays as the one non-muscle-specific tag for true compound
// movers (Burpees, Sprint Intervals) where naming one muscle would be misleading.
// ---- Search tags (widened 2026-09-17) ----
// These are Chris's search vocabulary, not a schema: nothing computes from
// them. They drive the Exercise Library's filter checkboxes, the exercise
// edit modal and the builder's category chips, and that's all. So the list
// follows the spreadsheet rather than the other way round.
//
// Widened when the real 636-exercise library arrived and the old lists would
// have silently dropped tags across most of it: "DB" alone appeared on 261
// rows, roughly two fifths of the library, plus "Core" as a type on 94 rows
// and "Obliques" on 42. Short forms are canonical because that's what Chris
// writes in the sheet. TAG_ALIASES maps the long forms the seeded demo data
// used, his singular/plural drift, and the one spelling slip in the sheet, so
// both spellings land on one tag instead of becoming two filter chips for
// the same thing.
const BODY_PART_TAGS = ["Chest", "Back", "Low Back", "Shoulders", "Front Delts", "Side Delts", "Rear Delts", "Biceps", "Triceps", "Abs", "Obliques", "Core", "Glutes", "Quads", "Hamstrings", "Calves", "Hip Flexors", "Abductors", "Adductors", "Upper Body", "Lower Body", "Full Body"];
const MODALITY_TAGS = ["Strength", "Core", "Cardio", "Stretch", "Static Hold"];
const EQUIPMENT_TAGS = ["Bodyweight", "DB", "KB", "Barbell", "Bands", "Cable", "Machine", "Smith Machine", "Bench", "Box", "Plate", "Medicine Ball", "Sliders", "TRX", "Landmine", "Pull Up Bar", "Battle Ropes", "Jump Rope", "Treadmill", "Assault Bike", "Stairs", "Stadium", "PVC"];
const TAG_ALIASES = { "dumbbells": "DB", "dumbbell": "DB", "kettlebell": "KB", "kettlebells": "KB", "resistance band": "Bands", "resistance bands": "Bands", "band": "Bands", "box/step": "Box", "pull-up bar": "Pull Up Bar", "pullup bar": "Pull Up Bar", "assult bike": "Assault Bike", "endurance": "Cardio", "hip flexor": "Hip Flexors", "oblique": "Obliques" };

// Master exercise list — circuits are built by picking from this list rather than
// free-typing names, so naming stays consistent across circuits/programs.
// videoUrl is intentionally blank across the board — the field exists but actual
// video isn't being built out yet.
// ---- Exercise Library ----
// Chris's real library, imported from burn-club-exercise-template.xlsx on
// 2026-09-17. Ids are authored in the sheet, not derived here, because a
// video file is named for its exercise id (<id>.mp4, see import/video-spec.md)
// — changing an id orphans a video. videoUrl is deliberately left empty:
// the filename IS the id by convention, so storing it would be a second copy
// to keep in sync. Fill these in when the videos are actually hosted.
// Technique is blank on all but two; it arrives as its own upload later,
// which is why the importer only writes the columns a sheet carries.
const EXERCISE_LIBRARY = [
  { id: "bulgarian-split-squats", name: "Bulgarian Split Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB", "KB"], technique: "Rear foot elevated behind you, lower straight down until the front thigh is parallel to the floor.", trackWeight: true, videoUrl: "" },
  { id: "1-4-front-raise-to-1-4-lateral-raise", name: "1/4 Front Raise to 1/4 Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "21s", name: "21s", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Barbell", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "2-way-lateral-raise", name: "2-Way Lateral Raise", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "3-point-row", name: "3-Point Row", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "3-way-hamstring-slide", name: "3-Way Hamstring Slide", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "3-way-tricep-kickback", name: "3-Way Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "90-degree-lateral-raise", name: "90 Degree Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "90-degree-supinated-to-pronated-rise-to-press", name: "90 Degree Supinated to Pronated Rise to Press", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "90-90-hip-switch", name: "90/90 Hip Switch", bodyParts: ["Hip Flexors"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "abduction", name: "Abduction", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "adduction", name: "Adduction", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "adduction-static-hold", name: "Adduction Static Hold", bodyParts: ["Adductors", "Glutes"], modality: "Static Hold", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "adductor-rocks", name: "Adductor Rocks", bodyParts: ["Adductors", "Glutes"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "adductor-side-plank", name: "Adductor Side Plank", bodyParts: ["Adductors", "Glutes"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "air-squat", name: "Air Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-barbell-reverse-lunge", name: "Alternating Barbell Reverse Lunge", bodyParts: ["Quads", "Glutes", "Hamstrings"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-bent-over-db-fly-w--static-hold", name: "Alternating Bent Over DB Fly w/ Static Hold", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-crab-toe-taps", name: "Alternating Crab Toe Taps", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-db-dead-bug", name: "Alternating DB Dead Bug", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-deadlift", name: "Alternating DB Deadlift", bodyParts: ["Hamstrings", "Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-forward-lunge", name: "Alternating DB Forward Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-cross-body-hammer-curl", name: "Alternating Cross Body Hammer Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-curl", name: "Alternating DB Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-curtsey-lunge", name: "Alternating DB Curtsey Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-skull-crusher", name: "Alternating DB Skull Crusher", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-db-snatch", name: "Alternating DB Snatch", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-dead-bug", name: "Alternating Dead Bug", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-goblet-reverse-lunge-to-squat", name: "Alternating Goblet Reverse lunge to Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-grip-single-db-squat", name: "Alternating Grip Single DB Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-kb-deadlift", name: "Alternating KB Deadlift", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-lateral-raise", name: "Alternating Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-lateral-squat-w--upright-row", name: "Alternating Lateral Squat w/ Upright Row", bodyParts: ["Quads", "Front Delts", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kneeling-supinated-cable-row", name: "Kneeling Supinated Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable", "Bands"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-neutral-db-chest-fly", name: "Alternating Neutral DB Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-neutral-db-chest-press", name: "Alternating Neutral DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-neutral-db-front-raise", name: "Alternating Neutral DB Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-neutral-db-shoulder-press", name: "Alternating Neutral DB Shoulder Press", bodyParts: ["Front Delts", "Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-plank-hip-dips", name: "Alternating Plank Hip Dips", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-pronated-db-chest-press", name: "Alternating Pronated DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-1-4-lateral-raise-w--static-hold", name: "Alternating 1/4 Lateral Raise w/ Static Hold", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-reverse-lunge-to-jump-squat", name: "Alternating Reverse Lunge to Jump Squat", bodyParts: ["Glutes", "Quads", "Hamstrings"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-barbell-reverse-lunge-to-squat", name: "Alternating Barbell Reverse Lunge to Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-runners-lunge", name: "Alternating Runners Lunge", bodyParts: ["Lower Body"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-side-plank", name: "Alternating Side Plank", bodyParts: ["Obliques", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-single-arm-db-thruster", name: "Alternating Single Arm DB Thruster", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-single-arm-lat-pulldown", name: "Alternating Single Arm Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable", "Bands"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-single-leg-raise-heel-taps", name: "Alternating Single Leg Raise/Heel Taps", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-single-leg-up-and-overs", name: "Alternating Single Leg Up and Overs", bodyParts: ["Abs", "Quads"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-single-leg-v-up", name: "Alternating Single Leg V-Up", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-split-stance-db-row", name: "Alternating Split Stance DB Row", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-standing-toe-taps", name: "Alternating Standing Toe Taps", bodyParts: ["Lower Body", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "alternating-supinated-db-chest-press", name: "Alternating Supinated DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-supinated-db-curl", name: "Alternating Supinated DB Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "alternating-wall-leaning-posts-march", name: "Alternating Wall Leaning Posts March", bodyParts: ["Lower Body"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "american-kb-swing", name: "American KB Swing", bodyParts: ["Full Body", "Lower Body"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "arm-circles", name: "Arm Circles", bodyParts: ["Upper Body"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "arms-only-assault-bike", name: "Arms Only Assault Bike", bodyParts: ["Upper Body"], modality: "Cardio", equipment: ["Assault Bike"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "arnold-press", name: "Arnold Press", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "around-the-world-raise", name: "Around the World Raise", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "around-the-world-raise-into-upright-row", name: "Around the World Raise into Upright Row", bodyParts: ["Front Delts", "Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "assault-echo-bike", name: "Assault/Echo Bike", bodyParts: ["Upper Body", "Lower Body"], modality: "Cardio", equipment: ["Assault Bike"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-assisted-pistol-squats", name: "Band Assisted Pistol Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "assisted-chin-up", name: "Assisted Chin Up", bodyParts: ["Back", "Upper Body"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "assisted-chin-up-static-hold", name: "Assisted Chin Up Static Hold", bodyParts: ["Back", "Upper Body"], modality: "Static Hold", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "assisted-cossack-squat", name: "Assisted Cossack Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "assisted-pull-up", name: "Assisted Pull Up", bodyParts: ["Back", "Upper Body"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "assisted-pull-up-static-hold", name: "Assisted Pull Up Static Hold", bodyParts: ["Back", "Upper Body"], modality: "Static Hold", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "band-assisted-pull-up", name: "Band Assisted Pull Up", bodyParts: ["Back", "Upper Body"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-around-the-world", name: "Seated Around the World", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "ball-slams", name: "Ball Slams", bodyParts: ["Abs", "Obliques", "Back"], modality: "Core", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-external-rotations-field-goals", name: "Band External Rotations/Field Goals", bodyParts: ["Front Delts", "Side Delts"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-face-pulls", name: "Band Face Pulls", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-high-row", name: "Band High Row", bodyParts: ["Rear Delts", "Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-pull-apart-w--slow-eccentric", name: "Band Pull Apart w/ Slow Eccentric", bodyParts: ["Rear Delts"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "band-pull-aparts", name: "Band Pull Aparts", bodyParts: ["Rear Delts", "Side Delts"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-clamshell", name: "Banded Clamshell", bodyParts: ["Lower Body"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-duck-walk", name: "Banded Duck Walk", bodyParts: ["Lower Body"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-fire-hydrant", name: "Banded Fire Hydrant", bodyParts: ["Lower Body"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-glute-bridge-static-hold-abductions", name: "Banded Glute Bridge Static Hold Abductions", bodyParts: ["Glutes", "Abductors"], modality: "Strength", equipment: ["Bands", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "banded-glute-bridge-w--abductions", name: "Banded Glute Bridge w/ Abductions", bodyParts: ["Glutes", "Abductors"], modality: "Strength", equipment: ["Bands", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "banded-hip-extension", name: "Banded Hip Extension", bodyParts: ["Glutes", "Lower Body"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-hip-thrust", name: "Banded Hip Thrust", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-hip-thrust-static-hold-abductions", name: "Banded Hip Thrust Static Hold Abductions", bodyParts: ["Glutes", "Abductors"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-hip-thrust-w--abductions", name: "Banded Hip Thrust w/ Abductions", bodyParts: ["Glutes", "Abductors"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-narrow-to-wide-jump-squat", name: "Banded Narrow to Wide Jump Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-plank-w--alternating-leg-raise", name: "Banded Plank w/ Alternating Leg Raise", bodyParts: ["Abs", "Glutes"], modality: "Core", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-row-to-rdl", name: "Banded Row to RDL", bodyParts: ["Back", "Hamstrings", "Glutes"], modality: "Strength", equipment: ["Bands", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "banded-row-w--slow-eccentric", name: "Banded Row w/ Slow Eccentric", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Bands", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "banded-squat-w--alternating-kickbacks", name: "Banded Squat w/ Alternating Kickbacks", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-squat-w--alternating-side-steps", name: "Banded Squat w/ Alternating Side Steps", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-sumo-squat-w--half-rep", name: "Banded Sumo Squat w/ Half Rep", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-thruster", name: "Banded Thruster", bodyParts: ["Full Body"], modality: "Strength", equipment: ["Bands", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-bench-press", name: "Barbell Bench Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-box-squat", name: "Barbell Box Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-drag-curl", name: "Barbell Drag Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-hip-thrusts", name: "Barbell Hip Thrusts", bodyParts: ["Glutes", "Hamstrings"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-pusk-jerk", name: "Barbell Pusk Jerk", bodyParts: ["Front Delts", "Side Delts", "Upper Body"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-push-press", name: "Barbell Push Press", bodyParts: ["Front Delts", "Upper Body"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-rdl", name: "Barbell RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-split-squat", name: "Barbell Split Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-squat", name: "Barbell Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-z-press", name: "Barbell Z Press", bodyParts: ["Front Delts", "Side Delts"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bear-crawl", name: "Bear Crawl", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bear-crawl-to-plank", name: "Bear Crawl to Plank", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bear-crawl-to-shoulder-taps", name: "Bear Crawl to Shoulder Taps", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bear-crawl-to-narrow-push-up", name: "Bear Crawl to Narrow Push Up", bodyParts: ["Abs", "Chest", "Triceps"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bear-plank", name: "Bear Plank", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bear-plank-w--kb-db-pass", name: "Bear Plank w/ KB/DB Pass", bodyParts: ["Abs", "Obliques", "Shoulders"], modality: "Core", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bear-shoulder-taps-to-plank", name: "Bear Shoulder Taps to Plank", bodyParts: ["Abs", "Obliques", "Shoulders"], modality: "Core", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "behind-the-back-external-rotations", name: "Behind the Back External Rotations", bodyParts: ["Shoulders", "Upper Body"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bench-box-pistol-squats", name: "Bench/Box Pistol Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bench", "Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bent-over-high-row", name: "Bent Over High Row", bodyParts: ["Rear Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bent-over-neutral-db-fly", name: "Bent Over Neutral DB Fly", bodyParts: ["Rear Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bicycles", name: "Bicycles", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-good-morning", name: "Banded Good Morning", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bootstraps", name: "Bootstraps", bodyParts: ["Lower Body"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bottoms-up-kb-single-arm-press", name: "Bottoms Up KB Single Arm Press", bodyParts: ["Shoulders", "Side Delts", "Front Delts"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "box-dips-w--bent-knees", name: "Box Dips w/ Bent Knees", bodyParts: ["Triceps", "Chest"], modality: "Strength", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "box-jumps", name: "Box Jumps", bodyParts: ["Quads", "Glutes"], modality: "Cardio", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "box-bench-step-ups", name: "Box/Bench Step Ups", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bulgarian-db-rdl", name: "Bulgarian DB RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bulgarian-jump-split-squat", name: "Bulgarian Jump Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "burpee", name: "Burpee", bodyParts: ["Full Body", "Lower Body"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "cable-chest-fly", name: "Cable Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-curl-w--rope", name: "Cable Curl w/ Rope", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-curl-w--straight-bar", name: "Cable Curl w/ Straight Bar", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-external-rotation", name: "Cable External Rotation", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-glute-kickback", name: "Cable Glute Kickback", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-internal-rotation", name: "Cable Internal Rotation", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-leg-raise-abduction", name: "Cable Leg Raise/Abduction", bodyParts: ["Abductors", "Lower Body"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-pull-through", name: "Cable Pull Through", bodyParts: ["Glutes", "Lower Body"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-pulse-squat", name: "Cable Pulse Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-rdl", name: "Cable RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-rdlto-squat", name: "Cable RDLto Squat", bodyParts: ["Hamstrings", "Quads", "Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-squat-walk", name: "Cable Squat Walk", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-band-press-w--rotation", name: "Cable/Band Press w/ Rotation", bodyParts: ["Shoulders", "Front Delts", "Side Delts"], modality: "Strength", equipment: ["Cable", "Bands"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "calf-raise", name: "Calf Raise", bodyParts: ["Calves"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "calf-raise-on-leg-press", name: "Calf Raise on Leg Press", bodyParts: ["Calves"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "captain-morgan-hold", name: "Captain Morgan Hold", bodyParts: ["Lower Body", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "cardio-of-your-choice", name: "Cardio of Your Choice", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "chest-supported-incline-db-row", name: "Chest Supported Incline DB Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "chest-shoulder-doorway-stretch", name: "Chest/Shoulder Doorway Stretch", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "chin-up", name: "Chin Up", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Pull Up Bar"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "chin-up-w--slow-eccentric", name: "Chin Up w/ Slow Eccentric", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Pull Up Bar"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "clamshell-glute-bridge", name: "Clamshell Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "continuous-curls", name: "Continuous Curls", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "contralateral-db-kb-staggered-stance-rdl", name: "Contralateral DB/KB Staggered Stance RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "copenhagen-tuck-plank", name: "Copenhagen Tuck Plank", bodyParts: ["Adductors"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "copenhagen-tuck-plank-hip-dips", name: "Copenhagen Tuck Plank Hip Dips", bodyParts: ["Adductors"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "corkscrew-plank", name: "Corkscrew Plank", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "cossack-squat", name: "Cossack Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "cossack-squat-to-box", name: "Cossack Squat to Box", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "cross-mountain-climbers", name: "Cross Mountain Climbers", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "crossbody-kb-db-rdl-w--slow-eccentric", name: "Crossbody KB/DB RDL w/ Slow Eccentric", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "crossbody-step-ups", name: "Crossbody Step Ups", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "db-box-step-overs", name: "DB Box Step Overs", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-calf-raises", name: "DB Calf Raises", bodyParts: ["Calves"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-chest-fly", name: "DB Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-chest-fly-to-narrow-press", name: "DB Chest Fly to Narrow Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-chest-fly-w--supination", name: "DB Chest Fly w/ Supination", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-chest-press", name: "DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-curl-to-press", name: "DB Curl to Press", bodyParts: ["Biceps", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-curtis-p", name: "DB Curtis P", bodyParts: ["Lower Body", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-curtsey-lunge", name: "DB Curtsey Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-curtsey-lunge-to-knee-up", name: "DB Curtsey Lunge to Knee Up", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-dead-bug-to-reverse-crunch", name: "DB Dead Bug to Reverse Crunch", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-deficit-split-squat", name: "DB Deficit Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-fire-hydrant", name: "DB Fire Hydrant", bodyParts: ["Lower Body", "Adductors"], modality: "Stretch", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-front-raise-to-press", name: "DB Front Raise to Press", bodyParts: ["Front Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-glute-bridge", name: "DB Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-high-row-complex", name: "DB High Row Complex", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-high-row-to-fly", name: "DB High Row to Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-hip-extension", name: "DB Hip Extension", bodyParts: ["Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-hip-thrust", name: "DB Hip Thrust", bodyParts: ["Glutes"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dp-hip-thrust-static-hold", name: "DP Hip Thrust Static Hold", bodyParts: ["Glutes"], modality: "Static Hold", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-power-jacks", name: "DB Power Jacks", bodyParts: ["Shoulders", "Lower Body"], modality: "Cardio", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-pullover", name: "DB Pullover", bodyParts: ["Back"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-pullover-into-press", name: "DB Pullover into Press", bodyParts: ["Back", "Chest"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-push-jerk", name: "DB Push Jerk", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-rdl", name: "DB RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-rdl-to-curl-and-press", name: "DB RDL to Curl and Press", bodyParts: ["Hamstrings", "Biceps", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-rdl-to-top-loaded-reverse-lunge", name: "DB RDL to Top Loaded Reverse Lunge", bodyParts: ["Quads", "Hamstrings", "Lower Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-rdl-ro-top-loaded-squat", name: "DB RDL ro Top Loaded Squat", bodyParts: ["Quads", "Hamstrings", "Lower Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-rdl-w--half-rep", name: "DB RDL w/ Half Rep", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dd-reverse-crunch", name: "DD Reverse Crunch", bodyParts: ["Abs"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-reverse-fly", name: "DB Reverse Fly", bodyParts: ["Rear Delts", "Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-skull-crushers-in-glute-bridge-static-hold", name: "DB Skull Crushers in Glute Bridge Static Hold", bodyParts: ["Triceps", "Glutes", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-skull-crushers-w--reverse-crunch", name: "DB Skull Crushers w/ Reverse Crunch", bodyParts: ["Triceps", "Abs", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-skull-crushers-w--slow-eccentric", name: "DB Skull Crushers w/ Slow Eccentric", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-split-squat", name: "DB Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-split-squat-w--rotation", name: "DB Split Squat w/ Rotation", bodyParts: ["Quads", "Glutes", "Abs"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-split-stance-row", name: "DB Split Stance Row", bodyParts: ["Back", "Lower Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-squat-to-calf-raise", name: "DB Squat to Calf Raise", bodyParts: ["Quads", "Calves", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-swing", name: "DB Swing", bodyParts: ["Lower Body", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-thruster-to-top-loaded-forward-lunge", name: "DB Thruster to Top Loaded Forward Lunge", bodyParts: ["Lower Body", "Shoulders", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-thruster", name: "DB Thruster", bodyParts: ["Lower Body", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-upright-row", name: "DB Upright Row", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-upright-row-to-power-clean-and-jerk", name: "DB Upright Row to Power Clean and Jerk", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-upright-row-to-pushout", name: "DB Upright Row to Pushout", bodyParts: ["Front Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-walking-lunge", name: "DB Walking Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-walk-lunge-to-squat", name: "DB Walk Lunge to Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-db-goblet-good-morning", name: "KB/DB Goblet Good Morning", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dead-bug-db-chest-press", name: "Dead Bug DB Chest Press", bodyParts: ["Chest", "Abs"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dead-bug-db-skull-crusher", name: "Dead Bug DB Skull Crusher", bodyParts: ["Triceps", "Abs"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dead-bug-static-hold", name: "Dead Bug Static Hold", bodyParts: ["Abs"], modality: "Static Hold", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dead-stop-kb-swing", name: "Dead Stop KB Swing", bodyParts: ["Full Body", "Back"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "deadball-over-shoulder", name: "Deadball Over Shoulder", bodyParts: ["Back", "Full Body"], modality: "Cardio", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "death-march", name: "Death March", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "decline-cable-chest-fly", name: "Decline Cable Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "decline-push-up", name: "Decline Push Up", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "devils-press", name: "Devils Press", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "diamond-plank", name: "Diamond Plank", bodyParts: ["Abs", "Upper Body"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "diamond-plank-jacks", name: "Diamond Plank Jacks", bodyParts: ["Abs", "Upper Body"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "downward-dog", name: "Downward Dog", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "downward-dog-to-bear-plank", name: "Downward Dog to Bear Plank", bodyParts: ["Abs", "Upper Body"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "downward-dog-to-plank", name: "Downward Dog to Plank", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "downward-dog-to-single-leg-crunch", name: "Downward Dog to Single Leg Crunch", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "downward-dog-push-ups", name: "Downward Dog Push Ups", bodyParts: ["Abs", "Chest"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "dual-db-push-press", name: "Dual DB Push Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dual-db-top-loaded-squat", name: "Dual DB Top Loaded Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "dual-kb-db-sumo-deadlift", name: "Dual KB/DB Sumo Deadlift", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "eccentric-push-up", name: "Eccentric Push Up", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "eccentric-step-up", name: "Eccentric Step Up", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "every-other-stair-jump-squat", name: "Every Other Stair Jump Squat", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stadium"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "every-other-stair-lateral-squat", name: "Every Other Stair Lateral Squat", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stadium"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "every-other-stair-lunge", name: "Every Other Stair Lunge", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stadium"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "every-other-stair-sprint", name: "Every Other Stair Sprint", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stadium"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "explosive-bench-push-up", name: "Explosive Bench Push Up", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "ez-bar-cable-tricep-pushdown", name: "EZ Bar Cable Tricep Pushdown", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-face-pull-w--pause", name: "Cable Face Pull w/ Pause", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "cable-face-pull", name: "Cable Face Pull", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "farmers-carry", name: "Farmers Carry", bodyParts: ["Upper Body", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "feet-elevated-banded-hip-march", name: "Feet Elevated Banded Hip March", bodyParts: ["Hip Flexors", "Glutes", "Hamstrings"], modality: "Strength", equipment: ["Bench", "Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "fire-hydrant", name: "Fire Hydrant", bodyParts: ["Glutes", "Adductors", "Abductors"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "flutter-kicks", name: "Flutter Kicks", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "forward-to-reverse-lunge", name: "Forward to Reverse Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "forward-to-reverse-lunge-into-jump-squat", name: "Forward to Reverse Lunge into Jump Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "front-raise-w--rotation", name: "Front Raise w/ Rotation", bodyParts: ["Front Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "front-to-lateral-raise", name: "Front to Lateral Raise", bodyParts: ["Front Delts", "Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "functional-progression", name: "Functional Progression", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "glute-biased-step-up", name: "Glute Biased Step Up", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "glute-bridge-static-hold", name: "Glute Bridge Static Hold", bodyParts: ["Glutes"], modality: "Static Hold", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "glute-bridge-w--pause", name: "Glute Bridge w/ Pause", bodyParts: ["Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "glute-focused-kb-db-bulgarian-split-squat", name: "Glute Focused KB/DB Bulgarian Split Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "glute-focused-kb-db-reverse-lunge", name: "Glute Focused KB/DB Reverse Lunge", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "glute-focused-split-squat", name: "Glute Focused Split Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "goblet-squat", name: "Goblet Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "heels-elevated-goblet-squat", name: "Heels Elevated Goblet Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "goblet-weighted-good-morning", name: "Goblet Weighted Good Morning", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-good-morning", name: "Barbell Good Morning", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "good-morning-to-squat", name: "Good Morning to Squat", bodyParts: ["Hamstrings", "Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight", "Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "gorilla-row", name: "Gorilla Row", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "hack-squat", name: "Hack Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "half-burpee-to-db-tricep-kickback", name: "Half Burpee to DB Tricep Kickback", bodyParts: ["Full Body", "Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "half-burpee-to-db-upright-row", name: "Half Burpee to DB Upright Row", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "half-kneeling-ipsilateral-shoulder-press", name: "Half Kneeling Ipsilateral Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "half-kneeling-windmill", name: "Half Kneeling Windmill", bodyParts: ["Abs", "Shoulders", "Obliques"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-hammer-curl", name: "DB Hammer Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "db-hammer-curl-static-hold", name: "DB Hammer Curl Static Hold", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "hammer-curl-w--supination", name: "Hammer Curl w/ Supination", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "hamstring-curl-w--sliders", name: "Hamstring Curl w/ Sliders", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hamstring-runners", name: "Hamstring Runners", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hamstring-scoops", name: "Hamstring Scoops", bodyParts: ["Hamstrings"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hamstring-walkout", name: "Hamstring Walkout", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hanging-knee-tucks", name: "Hanging Knee Tucks", bodyParts: ["Abs"], modality: "Core", equipment: ["Pull Up Bar"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "heel-slides", name: "Heel Slides", bodyParts: ["Lower Body", "Abs"], modality: "Stretch", equipment: ["Bodyweight"], technique: "Slide your heels along the floor while keeping the toes pointed", trackWeight: false, videoUrl: "" },
  { id: "heels-elevated-hip-thrust", name: "Heels Elevated Hip Thrust", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "high-plank", name: "High Plank", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "high-to-low-plank", name: "High to Low Plank", bodyParts: ["Abs", "Upper Body"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hip-flexion-lift-off-hold", name: "Hip Flexion Lift Off Hold", bodyParts: ["Hip Flexors"], modality: "Static Hold", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "hip-hinge-w--pvc-dowel", name: "Hip Hinge w/ PVC/Dowel", bodyParts: ["Hamstrings"], modality: "Stretch", equipment: ["PVC"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "horizontal-trx-row", name: "Horizontal TRX Row", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "incline-barbell-chest-press", name: "Incline Barbell Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-incline-cable-chest-fly", name: "Seated Incline Cable Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-bench-push-up", name: "Incline Bench Push Up", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "incline-cable-chest-fly", name: "Incline Cable Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-db-chest-fly", name: "Incline DB Chest Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-db-chest-fly-to-narrow-press", name: "Incline DB Chest Fly to Narrow Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-db-chest-press", name: "Incline DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-db-skull-crushers", name: "Incline DB Skull Crushers", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-neutral-to-supinated-db-fly", name: "Incline Neutral to Supinated DB Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "incline-push-up", name: "Incline Push Up", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "incline-push-up-to-downward-dog", name: "Incline Push Up to Downward Dog", bodyParts: ["Chest", "Shoulders", "Triceps"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "incline-push-up-w--rotation", name: "Incline Push up w/ Rotation", bodyParts: ["Chest", "Triceps", "Shoulders"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "incline-walk", name: "Incline Walk", bodyParts: ["Full Body", "Lower Body"], modality: "Cardio", equipment: ["Treadmill"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "jefferson-curls", name: "Jefferson Curls", bodyParts: ["Lower Body", "Hamstrings", "Back"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "jump-rope", name: "Jump Rope", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Jump Rope"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "jump-split-squat", name: "Jump Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "jump-split-squat-to-pulse-squats", name: "Jump Split Squat to Pulse Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "jump-split-squat-to-air-squat", name: "Jump Split Squat to Air Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "jump-squat", name: "Jump Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "jumping-jacks", name: "Jumping Jacks", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "kang-squat", name: "Kang Squat", bodyParts: ["Quads", "Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-deadlift", name: "KB Deadlift", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-hip-shifts", name: "KB Hip Shifts", bodyParts: ["Hip Flexors"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-rdl-to-squat", name: "KB RDL to Squat", bodyParts: ["Hamstrings", "Glutes", "Quads"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-swing", name: "KB Swing", bodyParts: ["Hamstrings", "Low Back", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-swing-to-squat", name: "KB Swing to Squat", bodyParts: ["Hamstrings", "Quads", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kb-transfers", name: "KB Transfers", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kneeling-front-squat", name: "Kneeling Front Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kneeling-t-spine-rotation", name: "Kneeling T-Spine Rotation", bodyParts: ["Shoulders", "Back"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "knees-to-squat", name: "Knees to Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "landmine-rdl", name: "Landmine RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Landmine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "landmine-row", name: "Landmine Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Landmine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "landmine-squat", name: "Landmine Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Landmine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lat-pulldown", name: "Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lat-pulldown-w--slow-eccentric", name: "Lat Pulldown w/ Slow Eccentric", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lateral-raise-w--extension-rotation", name: "Lateral Raise w/ Extension Rotation", bodyParts: ["Side Delts", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lateral-band-squat-walk", name: "Lateral Band Squat Walk", bodyParts: ["Abductors", "Quads", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-bear-crawl", name: "Lateral Bear Crawl", bodyParts: ["Shoulders", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-db-squat", name: "Lateral DB Squat", bodyParts: ["Quads", "Abductors"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lateral-monster-walk", name: "Lateral Monster Walk", bodyParts: ["Abductors", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-plank-walk", name: "Lateral Plank Walk", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-plank-walk-to-mountain-climbers", name: "Lateral Plank Walk to Mountain Climbers", bodyParts: ["Adductors", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-raise", name: "Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lateral-raise-complex", name: "Lateral Raise Complex", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "lateral-shuffle", name: "Lateral Shuffle", bodyParts: ["Quads"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-squat-to-crunch", name: "Lateral Squat to Crunch", bodyParts: ["Quads", "Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-squat-w--plate-pass", name: "Lateral Squat w/ Plate Pass", bodyParts: ["Adductors", "Quads", "Glutes"], modality: "Strength", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-step-up-w--slow-eccentric", name: "Lateral Step Up w/ Slow Eccentric", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bench", "Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-step-ups", name: "Lateral Step Ups", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bench", "Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lateral-walking-squats", name: "Lateral Walking Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "leg-extension", name: "Leg Extension", bodyParts: ["Quads"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "leg-extension-w--toes-pointed-in", name: "Leg Extension w/ Toes Pointed In", bodyParts: ["Quads"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "eg-extension-w--toes-pointed-out", name: "eg Extension w/ Toes Pointed Out", bodyParts: ["Quads"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "leg-press", name: "Leg Press", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "leg-press-w--5-secon-static-hold", name: "Leg Press w/ 5 Secon Static Hold", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "legs-only-dead-bug", name: "Legs Only Dead Bug", bodyParts: ["Abs", "Hip Flexors"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lemon-squeezers", name: "Lemon Squeezers", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "low-kneeling-lat-pulldown", name: "Low Kneeling Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "low-plank-w--alternating-leg-raise", name: "Low Plank w/ Alternating Leg Raise", bodyParts: ["Abs", "Glutes"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lunge-to-hamstring-rockbacks", name: "Lunge to Hamstring Rockbacks", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lying-bodyweight-rear-delt-fly", name: "Lying Bodyweight Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lying-lat-pull", name: "Lying Lat Pull", bodyParts: ["Back", "Rear Delts"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "lying-psoas-march", name: "Lying Psoas March", bodyParts: ["Hip Flexors", "Abs"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "machine-chest-press", name: "Machine Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "machine-preacher-curl", name: "Machine Preacher Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "machine-shoulder-press", name: "Machine Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "med-ball-chop", name: "Med Ball Chop", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "med-ball-thruster-toss", name: "Med Ball Thruster Toss", bodyParts: ["Full Body", "Shoulders"], modality: "Strength", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "military-press-complex", name: "Military Press Complex", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "modified-box-burpee", name: "Modified Box Burpee", bodyParts: ["Full Body"], modality: "Strength", equipment: ["Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "banded-monster-walk", name: "Banded Monster Walk", bodyParts: ["Hip Flexors"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "mountain-climber-w--sliders", name: "Mountain Climber w/ Sliders", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "mountain-climbers", name: "Mountain Climbers", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "mountain-climbers-on-ball", name: "Mountain Climbers on Ball", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "narrow-air-squat", name: "Narrow Air Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "narrow-glute-bridge", name: "Narrow Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "narrow-incline-chest-press", name: "Narrow Incline Chest Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "narrow-leg-press", name: "Narrow Leg Press", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "narrow-push-up-to-superman-crunch", name: "Narrow Push Up to Superman Crunch", bodyParts: ["Chest", "Abs", "Triceps"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "narrow-push-up", name: "Narrow Push Up", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "narrow-smith-machine-squat", name: "Narrow Smith Machine Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "narrow-to-wide-jump-squat", name: "Narrow to Wide Jump Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "narrow-to-wide-supinated-db-curl", name: "Narrow to Wide Supinated DB Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "neutral-banded-row-static-hold", name: "Neutral Banded Row Static Hold", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "neutral-db-chest-press", name: "Neutral DB Chest Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-chest-press-complex", name: "Neutral DB Chest Press Complex", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-chest-press-w--5-sec-eccentric", name: "Neutral DB Chest Press w/ 5 Sec Eccentric", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-chest-press-w--supination", name: "Neutral DB Chest Press w/ Supination", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-floor-press", name: "Neutral DB Floor Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-front-raise-w--pronation", name: "Neutral DB Front Raise w/ Pronation", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-row", name: "Neutral DB Row", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-row-complex", name: "Neutral DB Row Complex", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-row-to-hammer-curl", name: "Neutral DB Row to Hammer Curl", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-shoulder-press", name: "Neutral DB Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-shoulder-press-complex", name: "Neutral DB Shoulder Press Complex", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-shoulder-press-w--slow-eccentric", name: "Neutral DB Shoulder Press w/ Slow Eccentric", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-db-skull-crusher", name: "Neutral DB Skull Crusher", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-glute-bridge", name: "Neutral Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-to-pronated-tricep-kickback", name: "Neutral to Pronated Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-tricep-kickback", name: "Neutral Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "neutral-close-grip-lat-pulldown", name: "Neutral/Close Grip Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "hammer-curl-w--band", name: "Hammer Curl w/ Band", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "kb-db-offset-march", name: "KB/DB Offset March", bodyParts: ["Biceps", "Lower Body"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "overhead-cable-tricep-extension-w--rope", name: "Overhead Cable Tricep Extension w/ Rope", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "overhead-db-tricep-extension", name: "Overhead DB Tricep Extension", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "overhead-db-walking-lunge", name: "Overhead DB Walking Lunge", bodyParts: ["Shoulders", "Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "overhead-plate-walk", name: "Overhead Plate Walk", bodyParts: ["Shoulders", "Lower Body"], modality: "Cardio", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "palloff-press", name: "Palloff Press", bodyParts: ["Front Delts", "Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "peck-deck-fly", name: "Peck Deck Fly", bodyParts: ["Chest"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "peck-deck-fly-static-hold", name: "Peck Deck Fly Static Hold", bodyParts: ["Chest"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pendlay-row", name: "Pendlay Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "plank-jack-to-cross-and-spiderman-crunch", name: "Plank Jack to Cross and Spiderman Crunch", bodyParts: ["Abs", "Obliques", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-jacks", name: "Plank Jacks", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-w--3-way-crunch-to-push-up", name: "Plank w/ 3-way Crunch to Push Up", bodyParts: ["Abs", "Shoulders", "Chest"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-w--alternating-db-tap", name: "Plank w/ Alternating DB Tap", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "plank-w--alternating-toe-taps", name: "Plank w/ Alternating Toe Taps", bodyParts: ["Abs", "Shoulders", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-w--alternating-tricep-kickbacks", name: "Plank w/ Alternating Tricep Kickbacks", bodyParts: ["Abs", "Triceps"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "plank-w--db-pass", name: "Plank w/ DB Pass", bodyParts: ["Abs", "Obliques", "Shoulders"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "plank-w--shoulder-taps", name: "Plank w/ Shoulder Taps", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-w--side-to-side-toe-taps", name: "Plank w/ Side to Side Toe Taps", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plank-w--spiderman-crunch", name: "Plank w/ Spiderman Crunch", bodyParts: ["Abs", "Obliques", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plate-around-the-world", name: "Plate Around the World", bodyParts: ["Upper Body"], modality: "Strength", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plate-curl", name: "Plate Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "plate-snatch", name: "Plate Snatch", bodyParts: ["Full Body"], modality: "Strength", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "pressing-wall-slide", name: "Pressing Wall Slide", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "pronated-band-curl", name: "Pronated Band Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "pronated-db-floor-press", name: "Pronated DB Floor Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pronated-db-front-raise", name: "Pronated DB Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pronated-db-front-raise-complex", name: "Pronated DB Front Raise Complex", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pronated-db-read-delt-fly", name: "Pronated DB Read Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pronated-ez-bar-curl", name: "Pronated EZ Bar Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "pronated-incline-db-chest-press", name: "Pronated Incline DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "prone-hamstring-curl", name: "Prone Hamstring Curl", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "prone-hamstring-curl-w--toes-pointed-out", name: "Prone Hamstring Curl w/ toes Pointed Out", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Sliders"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "psoas-march", name: "Psoas March", bodyParts: ["Hip Flexors"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "pull-ups", name: "Pull Ups", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Pull Up Bar"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "quad-focused-split-squat", name: "Quad Focused Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "quadruped-knee-to-elbow-crunch", name: "Quadruped Knee to Elbow Crunch", bodyParts: ["Abs", "Obliques", "Glutes"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "quadruped-opposite-arm---leg-raise", name: "Quadruped Opposite Arm + Leg Raise", bodyParts: ["Core", "Glutes"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "quadruped-shoulder-cars", name: "Quadruped Shoulder CARs", bodyParts: ["Shoulders", "Core"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "quadruped-up-and-overs", name: "Quadruped Up and Overs", bodyParts: ["Glutes"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "quarter-front-raise", name: "Quarter Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "quarter-lateral-raise", name: "Quarter Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "renegade-row", name: "Renegade Row", bodyParts: ["Back", "Abs", "Obliques"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-barbell-lunge-w--pulse", name: "Reverse Barbell Lunge w/ Pulse", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-cable-crossover-fly", name: "Reverse Cable Crossover Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-clamshell", name: "Reverse Clamshell", bodyParts: ["Glutes", "Abductors"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "reverse-crunch-w--plate-pass", name: "Reverse Crunch w/ Plate Pass", bodyParts: ["Abs", "Core"], modality: "Core", equipment: ["Plate"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "reverse-db-deficit-lunge", name: "Reverse DB Deficit Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-db-fly-w--slow-eccentric", name: "Reverse DB Fly w/ Slow Eccentric", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-incline-rear-delt-fly", name: "Reverse Incline Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-lunge-to-knee-hug", name: "Reverse Lunge to Knee Hug", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "reverse-lunge-to-knee-up", name: "Reverse Lunge to Knee Up", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "reverse-lunge-to-military-press", name: "Reverse Lunge to Military Press", bodyParts: ["Quads", "Glutes", "Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-peck-deck-fly", name: "Reverse Peck Deck Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-snow-angels", name: "Reverse Snow Angels", bodyParts: ["Back", "Rear Delts"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "rowing", name: "Rowing", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "russian-twist-variation", name: "Russian Twist Variation", bodyParts: ["Obliques", "Abs"], modality: "Core", equipment: ["DB", "Medicine Ball"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "russian-twist", name: "Russian Twist", bodyParts: ["Obliques", "Abs"], modality: "Core", equipment: ["DB", "Medicine Ball"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "scap-pull-ups", name: "Scap Pull-Ups", bodyParts: ["Shoulders", "Back"], modality: "Stretch", equipment: ["Pull Up Bar"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "scap-push-up", name: "Scap Push Up", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "scaptions", name: "Scaptions", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "scapular-cars", name: "Scapular CARs", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-band-abduction", name: "Seated Band Abduction", bodyParts: ["Abductors"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-cable-field-goals", name: "Seated Cable Field Goals", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-cable-pull-down-w--rope", name: "Seated Cable Pull Down w/ Rope", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-cable-row-complex", name: "Seated Cable Row Complex", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-close-grip-cable-row", name: "Seated Close Grip Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-db-shoulder-press", name: "Seated DB Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-front-raise", name: "Seated Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-incline-hammer-curl-w--slow-eccentric", name: "Seated Incline Hammer Curl w/ Slow Eccentric", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-machine-hamstring-curl", name: "Seated Machine Hamstring Curl", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-machine-hamstring-curl-static-hold", name: "Seated Machine Hamstring Curl Static Hold", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-neutral-band-row", name: "Seated Neutral Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-pronated-band-row", name: "Seated Pronated Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "seated-single-arm-lat-pulldown", name: "Seated Single Arm Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "floor-single-arm-lat-pulldown", name: "Floor Single Arm Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-single-arm-row", name: "Seated Single Arm Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "seated-supinated-band-row", name: "Seated Supinated Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "shinbox-flow", name: "Shinbox Flow", bodyParts: ["Lower Body", "Hip Flexors"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "shinbox-hip-thrust", name: "Shinbox Hip Thrust", bodyParts: ["Hip Flexors", "Quads"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "shoulder-wall-slide", name: "Shoulder Wall Slide", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "shoulders-elevated-single-leg-hip-thrust", name: "Shoulders Elevated Single Leg Hip Thrust", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Box", "Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-knee-drives", name: "Side Knee Drives", bodyParts: ["Obliques", "Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-adductor-raise", name: "Side Lying Adductor Raise", bodyParts: ["Adductors"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-bicycles", name: "Side Lying Bicycles", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-leg-raise", name: "Side Lying Leg Raise", bodyParts: ["Abductors", "Glutes"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-oblique-v-up", name: "Side Lying Oblique V-Up", bodyParts: ["Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-open-book", name: "Side Lying Open Book", bodyParts: ["Obliques", "Core"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-reverse-bicycles", name: "Side Lying Reverse Bicycles", bodyParts: ["Obliques", "Hip Flexors"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-lying-shoulder-abduction", name: "Side Lying Shoulder Abduction", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "side-plank-w--knee-to-elbow-crunch", name: "Side Plank w/ Knee to Elbow Crunch", bodyParts: ["Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-plank-w--reach-throughs", name: "Side Plank w/ Reach Throughs", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "side-plank-w--tricep-extension", name: "Side Plank w/ Tricep Extension", bodyParts: ["Obliques", "Shoulders"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "side-to-side-ball-slams", name: "Side to Side Ball Slams", bodyParts: ["Abs", "Obliques", "Back"], modality: "Core", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "side-to-side-lemon-squeezers", name: "Side to Side Lemon Squeezers", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-arm-arnold-press", name: "Single Arm Arnold Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-bent-over-db-fly", name: "Single Arm Bent Over DB Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-bent-over-cable-tricep-kickback", name: "Single Arm Bent Over Cable Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-cable-field-goals", name: "Single Arm Cable Field Goals", bodyParts: ["Shoulders"], modality: "Stretch", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-cable-high-row", name: "Single Arm Cable High Row", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-cable-lateral-raise", name: "Single Arm Cable Lateral Raise", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-cable-low-row", name: "Single Arm Cable Low Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-cable-rear-delt-fly", name: "Single Arm Cable Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-push-jerk", name: "Single Arm DB Push Jerk", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-push-press", name: "Single Arm DB Push Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-rear-delt-fly", name: "Single Arm DB Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-row", name: "Single Arm DB Row", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-row-on-bench", name: "Single Arm DB Row on Bench", bodyParts: ["Back"], modality: "Strength", equipment: ["DB", "Bench"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-skull-crusher", name: "Single Arm DB Skull Crusher", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-sternum-crusher", name: "Single Arm DB Sternum Crusher", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-kb-db-upright-row", name: "Single Arm KB/DB Upright Row", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-upright-row-w--static-hold", name: "Single Arm DB Upright Row w/ Static Hold", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-kb-db-deadlift", name: "Single Arm KB/DB Deadlift", bodyParts: ["Full Body", "Core"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-kb-db-power-clean", name: "Single Arm KB/DB Power Clean", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-kb-db-overhead-walk", name: "Single Arm KB/DB Overhead Walk", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-farmer-carry-cossack-squat", name: "Single Arm Farmer Carry Cossack Squat", bodyParts: ["Quads", "Glutes", "Abductors"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-farmers-march", name: "Single Arm Farmers March", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-hammer-curl-w--static-hold", name: "Single Arm Hammer Curl w/ Static Hold", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-kb-swing", name: "Single Arm KB Swing", bodyParts: ["Full Body"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-machine-preacher-curl", name: "Single Arm Machine Preacher Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-military-press", name: "Single Arm Military Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-neutral-cable-tricep-extension", name: "Single Arm Neutral Cable Tricep Extension", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-neutral-db-chest-press", name: "Single Arm Neutral DB Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-neutral-db-shoulder-press", name: "Single Arm Neutral DB Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-preacher-curl", name: "Single Arm Preacher Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-pronated-cable-front-raise", name: "Single Arm Pronated Cable Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-pronated-cable-tricep-extension", name: "Single Arm Pronated Cable Tricep Extension", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-pronated-rear-delt-fly", name: "Single Arm Pronated Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-straight-lat-pulldown", name: "Single Arm Straight Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-supinated-db-curl-w--static-hold", name: "Single Arm Supinated DB Curl w/ Static Hold", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-supinated-db-tricep-extension", name: "Single Arm Supinated DB Tricep Extension", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-db-tricep-kickback", name: "Single Arm DB Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-db-overhead-march", name: "Single DB Overhead March", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-db-push-press", name: "Single DB Push Press", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-kb-front-squat", name: "Single KB Front Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "knee-to-elbow-and-hand-to-foot-crunch", name: "Knee to Elbow and Hand to Foot Crunch", bodyParts: ["Obliques", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-cable-rdl", name: "Single Leg Cable RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-leg-db-rdl", name: "Single Leg DB RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-leg-db-reverse-lunge", name: "Single Leg DB Reverse Lunge", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-leg-glute-bridge", name: "Single Leg Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-straight-leg-glute-bridge", name: "Single Straight Leg Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-leg-hip-thrust", name: "Single Leg Hip Thrust", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-hip-thrust-static-hold", name: "Single Leg Hip Thrust Static Hold", bodyParts: ["Glutes"], modality: "Static Hold", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-leg-press", name: "Single Leg Leg Press", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-leg-standing-abduction", name: "Single Leg Standing Abduction", bodyParts: ["Abductors", "Glutes"], modality: "Stretch", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-up-and-overs", name: "Single Leg Up and Overs", bodyParts: ["Hip Flexors", "Quads", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-up-and-overs-slow", name: "Single Leg Up and Overs Slow", bodyParts: ["Hip Flexors", "Quads", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-leg-v-up-to-bicycle", name: "Single Leg V-Up to Bicycle", bodyParts: ["Abs", "Obliques"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "single-sided-kb-db-deadlift", name: "Single Sided KB/DB Deadlift", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["KB", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-stair-sprint", name: "Single Stair Sprint", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stairs"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "smith-machine-alternating-reverse-lunge", name: "Smith Machine Alternating Reverse Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Smith Machine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "smith-machine-incline-chest-press", name: "Smith Machine Incline Chest Press", bodyParts: ["Chest"], modality: "Strength", equipment: ["Smith Machine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "smith-machine-reverse-lunge-to-knee-drive", name: "Smith Machine Reverse Lunge to Knee Drive", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Smith Machine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "smith-machine-split-squat", name: "Smith Machine Split Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Smith Machine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "spider-curl", name: "Spider Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "spiderman-to-cross-crunch", name: "Spiderman to Cross Crunch", bodyParts: ["Obliques", "Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-squat", name: "Split Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-squat-complex", name: "Split Squat Complex", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-squat-to-pulse-kickback", name: "Split Squat to Pulse Kickback", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-squat-static-hold", name: "Split Squat Static Hold", bodyParts: ["Glutes", "Quads"], modality: "Static Hold", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-squat-static-hold-w--adduction-band", name: "Split Squat Static Hold w/ Adduction Band", bodyParts: ["Glutes", "Quads", "Adductors"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "split-stance-single-arm-band-row", name: "Split Stance Single Arm Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "squat-jacks", name: "Squat Jacks", bodyParts: ["Quads", "Glutes"], modality: "Cardio", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "squat-to-calf-raise", name: "Squat to Calf Raise", bodyParts: ["Quads", "Calves", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "squat-w--alternating-knee-to-elbow-crunch", name: "Squat w/ Alternating Knee to Elbow Crunch", bodyParts: ["Quads"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "squatting-cable-row", name: "Squatting Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "squatting-neutral-band-row", name: "Squatting Neutral Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "stability-ball-hamstring-curl", name: "Stability Ball Hamstring Curl", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Medicine Ball"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "staggered-squat", name: "Staggered Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "staggered-stance-db-rdl", name: "Staggered Stance DB RDL", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "staggered-stance-good-morning", name: "Staggered Stance Good Morning", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "stair-stepper", name: "Stair Stepper", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Stairs"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "standing-db-military-press", name: "Standing DB Military Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "standing-neutral-band-row", name: "Standing Neutral Band Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "standing-pronated-to-neutral-cable-row", name: "Standing Pronated to Neutral Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "static-hammer-curl-walk", name: "Static Hammer Curl Walk", bodyParts: ["Biceps", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "static-v-hold", name: "Static V Hold", bodyParts: ["Abs"], modality: "Static Hold", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "static-v-hold-w--figure-8s", name: "Static V Hold w/ Figure 8s", bodyParts: ["Abs", "Obliques"], modality: "Static Hold", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sternum-crushers", name: "Sternum Crushers", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "straight-arm-lat-pulldown-w--rope", name: "Straight Arm Lat Pulldown w/ Rope", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "straight-leg-db-crunch", name: "Straight Leg DB Crunch", bodyParts: ["Abs"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "strict-barbell-press", name: "Strict Barbell Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-cable-deadlift", name: "Sumo Cable Deadlift", bodyParts: ["Glutes", "Hamstrings"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-cable-pulse-squat", name: "Sumo Cable Pulse Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-burpee-to-jump-squat", name: "Sumo DB Burpee to Jump Squat", bodyParts: ["Full Body", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-half-burpee", name: "Sumo DB Half Burpee", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-pulse-squat", name: "Sumo DB Pulse Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-rdl-to-deadlift", name: "Sumo DB RDL to Deadlift", bodyParts: ["Hamstrings", "Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-to-supinated-curl", name: "Sumo DB Squat to Supinated Curl", bodyParts: ["Glutes", "Biceps", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-static-hold", name: "Sumo DB Squat Static Hold", bodyParts: ["Glutes", "Quads"], modality: "Static Hold", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-static-hold-w--alternating-calf-raise", name: "Sumo DB Squat Static Hold w/ Alternating Calf Raise", bodyParts: ["Glutes", "Calves", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-static-hold-w--calf-raise", name: "Sumo DB Squat Static Hold w/ Calf Raise", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-db-squat-to-calf-raise", name: "Sumo DB DB Squat to Calf Raise", bodyParts: ["Glutes", "Calves"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-w--half-rep", name: "Sumo DB Squat w/ Half Rep", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat-w--slow-eccentric", name: "Sumo DB Squat w/ Slow Eccentric", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-db-squat", name: "Sumo DB Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-barbell-deadlift", name: "Sumo Barbell Deadlift", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-deadlift-w--slow-eccentric", name: "Sumo Deadlift w/ Slow Eccentric", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sumo-landmine-deadlift", name: "Sumo Landmine Deadlift", bodyParts: ["Glutes", "Hamstrings"], modality: "Strength", equipment: ["Landmine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "sumo-landmine-squat", name: "Sumo Landmine Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Landmine"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "sumo-stance-good-morning", name: "Sumo Stance Good Morning", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "superman", name: "Superman", bodyParts: ["Low Back", "Core"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "supinated-band-curl", name: "Supinated Band Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "supinated-barbell-row", name: "Supinated Barbell Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-cross-front-raise", name: "Supinated Cross Front Raise", bodyParts: ["Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-db-chest-press-complex", name: "Supinated DB Chest Press Complex", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-chest-press-w--slow-eccentric", name: "Supinated Chest Press w/ Slow Eccentric", bodyParts: ["Chest"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-db-row-complex", name: "Supinated DB Row Complex", bodyParts: ["Back"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-db-row-to-curl", name: "Supinated DB Row to Curl", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-db-shoulder-press", name: "Supinated DB Shoulder Press", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-inverted-row", name: "Supinated Inverted Row", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-lat-pulldown", name: "Supinated Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-seated-cable-row", name: "Supinated Seated Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-shoulder-press-complex", name: "Supinated Shoulder Press Complex", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supinated-tricep-kickback", name: "Supinated Tricep Kickback", bodyParts: ["Triceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "supine-diaphragmatic-breathing", name: "Supine Diaphragmatic Breathing", bodyParts: ["Core"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "supine-mountain-climbers", name: "Supine Mountain Climbers", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "supine-mountain-climbers-on-bench", name: "Supine Mountain Climbers on Bench", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "supine-plank", name: "Supine Plank", bodyParts: ["Abs", "Triceps"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "t-raise", name: "T-Raise", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "t-cross-static-hold", name: "T/Cross Static Hold", bodyParts: ["Shoulders"], modality: "Static Hold", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "kneeling-band-cable-pulldown", name: "Kneeling Band/Cable Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable", "Bands"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "barbell-traditional-deadlift", name: "Barbell Traditional Deadlift", bodyParts: ["Hamstrings", "Glutes", "Back"], modality: "Strength", equipment: ["Barbell"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "tricep-bench-dips", name: "Tricep Bench Dips", bodyParts: ["Triceps", "Chest"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "tricep-dips", name: "Tricep Dips", bodyParts: ["Triceps", "Chest"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bench-tricep-dips-to-supine-mountain-climbers", name: "Bench Tricep Dips to Supine Mountain Climbers", bodyParts: ["Triceps", "Abs"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "bench-tricep-dips-w--bent-knees", name: "Bench Tricep Dips w/ Bent Knees", bodyParts: ["Triceps"], modality: "Strength", equipment: ["Bench"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-high-row", name: "TRX High Row", bodyParts: ["Rear Delts", "Back"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-jump-squat", name: "TRX Jump Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-neutral-row", name: "TRX Neutral Row", bodyParts: ["Back"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-single-leg-curtsey-lunge", name: "TRX Single Leg Curtsey Lunge", bodyParts: ["Quads"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-single-leg-reverse-lunge", name: "TRX Single Leg Reverse Lunge", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-squat", name: "TRX Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "trx-field-goals", name: "TRX Field Goals", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["TRX"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "t-spine-rotation", name: "T-Spine Rotation", bodyParts: ["Core"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "turkish-get-up", name: "Turkish Get Up", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "bodyweight-box-squat", name: "Bodyweight Box Squat", bodyParts: ["Quads"], modality: "Strength", equipment: ["Box"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "up-and-overs", name: "Up and Overs", bodyParts: ["Abs"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "up-downs", name: "Up Downs", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "walk", name: "Walk", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "walk-out-plank-to-mountain-climbers", name: "Walk Out Plank to Mountain Climbers", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "walk-out-plank-to-push-up", name: "Walk Out Plank to Push Up", bodyParts: ["Abs", "Shoulders", "Chest"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "walk-out-plank-to-spiderman-crunch", name: "Walk Out Plank to Spiderman Crunch", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "walk-out-plank-inchworm", name: "Walk Out Plank/Inchworm", bodyParts: ["Abs", "Shoulders"], modality: "Core", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "wall-leaning-psoas-march", name: "Wall Leaning Psoas March", bodyParts: ["Hip Flexors"], modality: "Stretch", equipment: ["Bodyweight", "Bands"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "wall-press-functional-progression", name: "Wall Press Functional Progression", bodyParts: ["Core"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "wall-sit-w--weighted-front-raise-rotation", name: "Wall Sit w/ Weighted Front Raise Rotation", bodyParts: ["Glutes", "Shoulders", "Quads"], modality: "Strength", equipment: ["DB", "Plate"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wall-sits", name: "Wall Sits", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "weighted-dead-bug", name: "Weighted Dead Bug", bodyParts: ["Abs"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "weighted-dead-bug-static-hold", name: "Weighted Dead Bug Static Hold", bodyParts: ["Abs"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "weighted-functional-progression", name: "Weighted Functional Progression", bodyParts: ["Core"], modality: "Core", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wide-grip-lat-pulldown", name: "Wide Grip Lat Pulldown", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wide-glute-bridge", name: "Wide Glute Bridge", bodyParts: ["Glutes"], modality: "Strength", equipment: ["Bodyweight", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wide-grip-seated-cable-row", name: "Wide Grip Seated Cable Row", bodyParts: ["Back"], modality: "Strength", equipment: ["Cable"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wide-leg-press", name: "Wide Leg Press", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "wide-stance-box-back-squat", name: "Wide Stance Box/Back Squat", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Barbell", "Box"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "worlds-greatest-stretch", name: "Worlds Greatest Stretch", bodyParts: ["Core", "Full Body"], modality: "Stretch", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "yta-raise", name: "YTA Raise", bodyParts: ["Shoulders"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "zottman-curl", name: "Zottman Curl", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  // ---- Demo-only (2026-09-17) ----
  // Not Chris's; these are the seeded exercises the placeholder workouts in
  // CIRCUITS still name, and which his library has no entry for. Kept so the
  // demo keeps its technique text and weight tracking instead of quietly
  // losing them. Delete this block when the real workouts replace CIRCUITS.
  { id: "bicycle-crunches", name: "Bicycle Crunches", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Lying on the back, bring opposite elbow to opposite knee in a pedaling motion, keeping the lower back down.", trackWeight: false, videoUrl: "" },
  { id: "burpees", name: "Burpees", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Drop into a squat, kick back to a plank, do a push-up, jump the feet back in, then explode up into a jump.", trackWeight: false, videoUrl: "" },
  { id: "goblet-squats", name: "Goblet Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["KB"], technique: "Hold a kettlebell at chest height and squat down between the knees, keeping the chest tall.", trackWeight: true, videoUrl: "" },
  { id: "jump-squats", name: "Jump Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "Squat down, then explode upward into a jump, landing softly with bent knees to absorb impact.", trackWeight: false, videoUrl: "" },
  { id: "kettlebell-swings", name: "Kettlebell Swings", bodyParts: ["Glutes", "Hamstrings"], modality: "Strength", equipment: ["KB"], technique: "Hinge at the hips (not a squat) and swing the kettlebell to chest height using hip drive, not the arms.", trackWeight: true, videoUrl: "" },
  { id: "leg-raises", name: "Leg Raises", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Lying flat, keep legs straight and lower back pressed down while raising the legs to vertical and back down.", trackWeight: false, videoUrl: "" },
  { id: "plank-hold", name: "Plank Hold", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Forearms and toes on the floor, body in a straight line. Brace the core and avoid letting the hips sag or pike.", trackWeight: false, videoUrl: "" },
  { id: "push-press", name: "Push Press", bodyParts: ["Shoulders", "Triceps"], modality: "Strength", equipment: ["DB"], technique: "Dip slightly at the knees, then drive the dumbbells overhead using leg drive plus a shoulder press.", trackWeight: true, videoUrl: "" },
  { id: "push-ups", name: "Push-Ups", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bodyweight"], technique: "Hands under shoulders, body in a straight line from head to heels. Lower chest to the floor, then press back up.", trackWeight: false, videoUrl: "" },
  { id: "russian-twists", name: "Russian Twists", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Sit with knees bent and torso leaned back slightly. Rotate side to side, tapping the floor by each hip.", trackWeight: false, videoUrl: "" },
  { id: "walking-lunges", name: "Walking Lunges", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "Step forward into a lunge, back knee toward the floor, then drive up and step through into the next lunge.", trackWeight: false, videoUrl: "" },
  { id: "weighted-situps", name: "Weighted Sit-Ups", bodyParts: ["Abs"], modality: "Strength", equipment: ["DB"], technique: "Hold a light dumbbell at the chest, feet anchored, and curl the torso all the way up to a seated position.", trackWeight: true, videoUrl: "" },
  { id: "high-knees", name: "High Knees", bodyParts: ["Quads"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Run in place, driving the knees up toward hip height as quickly as possible.", trackWeight: false, videoUrl: "" },
  { id: "sprint-intervals", name: "Sprint Intervals", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Sprint at maximum effort for the interval, then walk or rest to recover before the next round.", trackWeight: false, videoUrl: "" },
  { id: "rowing-machine", name: "Rowing Machine", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Battle Ropes"], technique: "Drive with the legs first, then lean back and pull the handle to the ribs. Reverse that order on the recovery.", trackWeight: false, videoUrl: "" },
  { id: "battle-ropes", name: "Battle Ropes", bodyParts: ["Shoulders"], modality: "Cardio", equipment: ["Battle Ropes"], technique: "Alternate slamming the ropes up and down as fast as possible while staying in a low athletic stance.", trackWeight: false, videoUrl: "" },
  { id: "squat-jumps", name: "Squat Jumps", bodyParts: ["Quads", "Glutes"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Squat down then jump straight up as high as comfortable, landing softly back into the squat.", trackWeight: false, videoUrl: "" },
];

// scheduleType distinguishes two genuinely different program shapes:
// "rolling" (Burn Club) — an ongoing weekly rotation,
// browsed freely, no fixed start/end date. "structured" (Fit & Functional,
// 30 Minute Burn) —
// a fixed-length program with a specific day-by-day sequence, the same for
// every member, projected onto real dates from each member's own start date
// (see SCHEDULE_TEMPLATES below). Rolling programs still use the folder/live-
// folder model; structured programs are authored once as a template instead.
const PROGRAMS = [
  {
    id: "burn-club",
    name: "Burn Club",
    color: "blue",
    status: "active",
    scheduleType: "rolling",
    memberCount: 214,
    circuitsPerWeek: 3,
    description: "The flagship full-body circuit program — 3 new circuits every week.",
    // Owned by the program (2026-09-05, Chris: "a place within the program,
    // burn club specifically, where we keep the benchmarks"). Another program
    // can carry its own set, or none — a retest only means anything against
    // the programming it belongs to.
    benchmarks: [
      { id: "benchmark-a", name: "Benchmark A", subtitle: "The Gauntlet — 12-Minute AMRAP", scoreType: "rounds" },
      { id: "benchmark-b", name: "Benchmark B", subtitle: "Sprint 500 — For Time", scoreType: "time" },
      { id: "benchmark-c", name: "Benchmark C", subtitle: "Endurance Test — 15-Minute AMRAP", scoreType: "rounds" },
    ],
  },
  {
    id: "thirty-minute-burn",
    name: "30 Minute Burn",
    color: "deepblue",
    status: "active",
    scheduleType: "structured",
    durationWeeks: 8,
    workoutsPerWeek: 5,
    memberCount: 0,
    circuitsPerWeek: 5,
    description: "A structured 8-week program built around short sessions — five 30-minute workouts a week, in Home and Gym variants.",
  },
  {
    id: "fit-functional",
    name: "Fit & Functional",
    color: "yellow",
    status: "active",
    scheduleType: "structured",
    durationWeeks: 8,
    workoutsPerWeek: 6,
    memberCount: 1,
    circuitsPerWeek: 6,
    description: "A structured 8-week program — 6 pre-scheduled workouts a week, same sequence for everyone, retested and re-run per member from their own start date.",
  },
];

// Folders organize circuits for **structured** programs only, plus a general
// (program: null) staging area for content that isn't assigned yet.
//
// Rolling programs no longer have folders at all (2026-08-15). They used to
// have three permanent `live: true` folders whose entire job was to answer
// "is this published" — a job the workout's own availability date now does.
// Keeping both would mean two facts claiming to say which week a workout
// belongs to, free to disagree; that's the same defect as the old per-workout
// `status` field, which is why folder placement replaced it in the first
// place. So Burn Club's six folders are gone, and its content is grouped by
// week computed from `availableFrom` instead. See the dated-publishing note
// at the top of this file.
const FOLDERS = [
  { id: "working-folder", name: "Working Folder", program: null },
  // Structured programs don't use the live-folder publish model — these are
  // just library folders (one per program week) holding Fit & Functional's
  // actual workout content, which gets "published" by being slotted into
  // SCHEDULE_TEMPLATES instead. One folder per week rather than one folder
  // for the whole program, since every week's 6 workouts are fully unique.
  ...Array.from({ length: 8 }, (_, i) => ({ id: `ff-home-week-${i + 1}`, name: `F&F Week ${i + 1}`, program: "fit-functional" })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `tmb-week-${i + 1}`, name: `30 Min Burn Week ${i + 1}`, program: "thirty-minute-burn" })),
];

// ---------------- Fit & Functional content generator ----------------
// 8 weeks × 6 focus areas = 48 unique workouts, one folder per week. Same 6
// focus-area names every week (per Chris's naming convention — the "Week N"
// prefix is what changes, not the split itself); exercise selection rotates
// and volume progresses week to week so the actual workouts differ, not
// just the label.
const FF_FOCUS_AREAS = [
  {
    key: "shoulders-abs",
    label: "Shoulders and Abs",
    pools: {
      home: ["Push Press", "Plank Hold", "Bicycle Crunches", "Dead Bug", "Side Plank"],
      gym: ["Overhead Press", "Cable Row", "Weighted Sit-Ups", "Plank Hold", "Side Plank"],
    },
  },
  {
    key: "hamstrings-glutes",
    label: "Hamstring and Glutes",
    pools: {
      home: ["Kettlebell Swings", "Walking Lunges", "Box Jumps", "Goblet Squats"],
      gym: ["Barbell Deadlift", "Leg Press", "Kettlebell Swings", "Walking Lunges"],
    },
  },
  {
    key: "back-biceps",
    label: "Back and Biceps",
    pools: {
      home: ["Dumbbell Rows", "Renegade Rows", "Battle Ropes"],
      gym: ["Lat Pulldown", "Cable Row", "Barbell Deadlift"],
    },
  },
  {
    key: "chest-tris",
    label: "Chest and Tris",
    pools: {
      home: ["Push-Ups", "Push Press", "Renegade Rows"],
      gym: ["Barbell Bench Press", "Overhead Press", "Cable Row"],
    },
  },
  {
    key: "quads-glutes",
    label: "Quads and Glutes",
    pools: {
      home: ["Goblet Squats", "Squat Jumps", "Walking Lunges", "Jump Squats", "Box Jumps"],
      gym: ["Barbell Back Squat", "Leg Press", "Walking Lunges", "Box Jumps"],
    },
  },
];
const FF_CIRCUIT_POOLS = {
  home: ["Burpees", "Mountain Climbers", "High Knees", "Sprint Intervals", "Squat Jumps"],
  gym: ["Rowing Machine", "Battle Ropes", "Burpees", "Box Jumps", "Mountain Climbers"],
};
// Mirrors PROGRAM_VARIANTS in the member app's data.js.
const PROGRAM_VARIANTS = [
  { key: "home", label: "Home" },
  { key: "gym", label: "Gym" },
];

function ffPickRotating(pool, week, count) {
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(pool[(week - 1 + i) % pool.length]);
  return picks;
}

function buildFitFunctionalCircuits() {
  const circuits = [];
  for (let week = 1; week <= 8; week++) {
    const folderId = `ff-home-week-${week}`;
    const difficulty = week <= 6 ? "Intermediate" : "Advanced";
    const sets = 3 + Math.floor((week - 1) / 2); // 3 sets weeks 1-2, up to 6 sets weeks 7-8

    FF_FOCUS_AREAS.forEach((area) => {
      const slotId = `ff-w${week}-${area.key}`;
      PROGRAM_VARIANTS.forEach((variant) => {
        const names = ffPickRotating(area.pools[variant.key], week, 3);
        circuits.push({
          id: `${slotId}-${variant.key}`,
          slotId,
          variant: variant.key,
          folderId,
          category: "structured",
          tag: `Week ${week}`,
          title: `Week ${week} ${area.label}`,
          focus: area.label,
          difficulty,
          desc: `Week ${week} strength session focused on ${area.label.toLowerCase()}.`,
          blocks: names.map((name) => ({ type: "straight", label: name, exercise: { name }, sets, reps: 10, rest: 45 })),
        });
      });
    });

    const circuitSlotId = `ff-w${week}-circuit`;
    PROGRAM_VARIANTS.forEach((variant) => {
      const circuitNames = ffPickRotating(FF_CIRCUIT_POOLS[variant.key], week, 4);
      circuits.push({
        id: `${circuitSlotId}-${variant.key}`,
        slotId: circuitSlotId,
        variant: variant.key,
        folderId,
        category: "structured",
        tag: `Week ${week}`,
        title: `Week ${week} Circuit`,
        focus: "Full Body",
        difficulty,
        desc: `Week ${week}'s conditioning finisher.`,
        blocks: [
          {
            type: "interval",
            label: "Conditioning Circuit",
            rounds: 3 + Math.floor((week - 1) / 3),
            work: 40,
            rest: 20,
            exercises: circuitNames.map((name) => ({ name })),
          },
        ],
      });
    });
  }
  return circuits;
}

// ---------------- 30 Minute Burn content generator ----------------
// Same shape as Fit & Functional — 8 weeks, home and gym variants sharing a
// slot — but built around shorter sessions: five 30-minute workouts a week,
// each a single conditioning block rather than straight-set strength work.
const TMB_FOCUS_AREAS = [
  {
    key: "full-body",
    label: "Full Body Burn",
    pools: {
      home: ["Burpees", "Squat Jumps", "Push-Ups", "Mountain Climbers"],
      gym: ["Rowing Machine", "Barbell Back Squat", "Battle Ropes", "Box Jumps"],
    },
  },
  {
    key: "lower",
    label: "Lower Body Burn",
    pools: {
      home: ["Walking Lunges", "Jump Squats", "Kettlebell Swings", "Box Jumps"],
      gym: ["Leg Press", "Barbell Back Squat", "Kettlebell Swings", "Walking Lunges"],
    },
  },
  {
    key: "upper",
    label: "Upper Body Burn",
    pools: {
      home: ["Push-Ups", "Renegade Rows", "Push Press", "Battle Ropes"],
      gym: ["Barbell Bench Press", "Lat Pulldown", "Overhead Press", "Cable Row"],
    },
  },
  {
    key: "core",
    label: "Core Burn",
    pools: {
      home: ["Bicycle Crunches", "Plank Hold", "Side Plank", "Dead Bug"],
      gym: ["Weighted Sit-Ups", "Plank Hold", "Leg Raises", "Russian Twists"],
    },
  },
  {
    key: "conditioning",
    label: "Conditioning",
    pools: {
      home: ["High Knees", "Sprint Intervals", "Burpees", "Mountain Climbers"],
      gym: ["Rowing Machine", "Battle Ropes", "Sprint Intervals", "Box Jumps"],
    },
  },
];

function buildThirtyMinuteBurnCircuits() {
  const circuits = [];
  for (let week = 1; week <= 8; week++) {
    const folderId = `tmb-week-${week}`;
    const difficulty = week <= 5 ? "Intermediate" : "Advanced";
    const rounds = 3 + Math.floor((week - 1) / 3);

    TMB_FOCUS_AREAS.forEach((area) => {
      const slotId = `tmb-w${week}-${area.key}`;
      PROGRAM_VARIANTS.forEach((variant) => {
        const names = ffPickRotating(area.pools[variant.key], week, 4);
        circuits.push({
          id: `${slotId}-${variant.key}`,
          slotId,
          variant: variant.key,
          folderId,
          category: "structured",
          tag: `Week ${week}`,
          title: `Week ${week} ${area.label}`,
          focus: area.label,
          difficulty,
          desc: `Week ${week} 30-minute ${area.label.toLowerCase()} session.`,
          blocks: [
            {
              type: "interval",
              label: area.label,
              rounds,
              work: 45,
              rest: 15,
              exercises: names.map((name) => ({ name })),
            },
          ],
        });
      });
    });
  }
  return circuits;
}

function buildThirtyMinuteBurnSchedule() {
  const focusOrder = TMB_FOCUS_AREAS.map((a) => a.key);
  const days = [];
  let day = 1;
  for (let week = 1; week <= 8; week++) {
    focusOrder.forEach((key) => {
      days.push({ day, type: "workout", workoutId: `tmb-w${week}-${key}` });
      day++;
    });
    days.push({ day, type: "rest" }); day++;
    days.push({ day, type: "rest" }); day++;
  }
  return days;
}


// ---------------- Block format explainers ----------------
// Must stay in sync with BLOCK_FORMAT_NOTES in the member app's data.js —
// same duplication as every other shared shape across these three apps.
// Admin shows this read-only in the workout builder; the member app is what
// actually renders it in the "Before You Start" popup. Replaced the old
// free-text per-block "Block Notes" field (2026-08-12, Chris) so the
// explainer can't be forgotten or worded differently workout to workout.
const BLOCK_FORMAT_NOTES = {
  interval: "This is a timed circuit — work through each station for the set time, then take a short rest before moving to the next one. Once you've been through every station, that's one round; after a brief rest, start the next round from the top. Focus on clean, controlled reps within the work window instead of racing to beat the clock.",
  // Worded for any number of exercises, not two — these are now used for
  // rep-based station circuits as well, which run three or more (2026-08-18).
  superset: "Every exercise is on this one screen — work down the list in order, finishing all the reps for one before moving straight into the next with no rest in between. Once you've been through the whole list, that's one round; rest, then start the next round from the top.",
  amrap: "AMRAP stands for As Many Rounds As Possible. Complete every exercise below once, in order — that's one round. As soon as you finish the last exercise, go right back to the first one and start the next round. Keep going until the clock hits zero, moving at a strong, steady pace and keeping your form solid. When time's up, log how many full rounds you completed. One thing to know: the AMRAP clock runs on real time, so if you leave the app mid-block it keeps counting down while you're away.",
  emom: "EMOM stands for Every Minute On the Minute. At the top of each minute, complete the listed reps for that minute's exercise, then rest with whatever time is left before the next minute starts. Move to the next exercise each time a new minute begins, cycling back to the first once you've gone through them all. The faster you finish your reps, the more rest you bank before the next round.",
  straight: "Straight sets — complete all the reps for one set, then rest before starting the next. Take the full rest between sets; it's there so each set can be as strong as the one before it. Log the weight you used as you go so you have it to build on next time.",
  ladder: "A ladder works through a changing rep count each set instead of the same number every time. Complete the reps shown for the set you're on, rest, then move to the next number in the sequence. Let the weight stay honest to the rep count rather than forcing the same load the whole way through.",
  "cardio-choice": "Cardio, your choice — pick whatever you'll actually do: walk, run, bike, or the stair stepper. The clock runs for the prescribed time; hold a steady effort you could keep up for the whole block rather than going out hard and fading. When it's done, log what you picked so it lands in your cardio log.",
};

// The built-in wording, kept aside before any saved overrides are applied —
// Settings needs it to offer "Restore default" per note.
const BLOCK_FORMAT_NOTES_DEFAULTS = { ...BLOCK_FORMAT_NOTES };

// Staff edits from Settings → Workout Settings ride the same localStorage
// bridge as circuits and messages. A blank override is ignored rather than
// saved as empty — an empty explainer would mean no popup at all, which is
// the exact gap deriving these from block type was meant to close.
const LIVE_BLOCK_NOTES_KEY = "burnClubBlockFormatNotes";
try {
  const overrides = JSON.parse(localStorage.getItem(LIVE_BLOCK_NOTES_KEY) || "{}");
  Object.keys(overrides).forEach((type) => {
    if (type in BLOCK_FORMAT_NOTES && String(overrides[type]).trim()) {
      BLOCK_FORMAT_NOTES[type] = overrides[type];
    }
  });
} catch (e) {}

// ---------------- App settings (2026-08-27) ----------------
// Things Chris should be able to change without a deploy, edited in
// Admin -> Settings and carried on the same localStorage bridge as circuits,
// messages and the block notes above.
//
// Stored as a sparse override rather than the whole object: only what's been
// changed is written, so a default that gets reworded later reaches members
// who never touched that field. mergeAppSettings() is why a stored copy from
// before a new field existed still works.
const APP_SETTINGS_DEFAULTS = {
  // The names a fresh team gets before Chris renames it. Editable from the
  // Teams panel on a challenge rather than Settings, because that's where
  // you're standing when you notice you want different ones.
  teamNames: ["Red", "Blue", "Green", "Gold", "Purple", "Pink", "Mint", "Slate"],
  // Workout points stay on the challenge (each one sets its own); these are
  // the sources that had no number of their own and silently borrowed it.
  scoring: {
    cardioPoints: 5,
    habitDayPoints: 5,
    levelSize: 50,
    defaultWorkoutPoints: 5,
    defaultThreshold: 200,
  },
  support: {
    email: "support@burnclub.com",
    faqs: [
      { q: "How do I change my workout schedule?", a: "Head to Workouts — you can start any circuit any day, or build your own from the Exercise Library." },
      { q: "Can I pause my membership?", a: "Yes — message your coach and they'll take care of it for you." },
      { q: "How do I connect a wearable?", a: "Go to Profile → Connected Devices and tap Connect next to your device." },
    ],
  },
  copy: {
    // Keyed, not indexed: the tour shows Workouts or Calendar depending on the
    // member's program shape, so slides aren't a fixed list.
    tour: {
      home: { title: "Start Here", body: "Home is your day at a glance — today's workout, your streak, and your daily habits. Most days this is the only screen you need." },
      workouts: { title: "Every Workout", body: "Browse the full circuit list and start any of them, any day. You can also build your own from the Exercise Library." },
      calendar: { title: "Your Program", body: "Your weeks are already laid out for you. Tap any day to see what's assigned and start it from there." },
      community: { title: "The Club", body: "See where you stand in this month's challenge, follow your team, and keep up with everyone else in the group." },
      progress: { title: "Watch It Add Up", body: "Your personal records, benchmark results, and every workout you've logged, all in one place." },
      contact: { title: "Questions? Just Ask.", body: "Message your coach any time and you'll get a real answer from a real person. You can replay this tour whenever you like from Profile → Help & Support.", action: "Message Your Coach" },
    },
    // {weeks}, {program} and {date} are filled in from the member's own
    // record. A heading with no placeholder is fine — it just reads the same
    // for everyone.
    programComplete: {
      eyebrow: "Program summary",
      title: "Your {weeks} weeks are up",
      sub: "{program}, finished {date}.",
      cta: "Message your coach",
      note: "Ask about repeating this program, or what to move on to next.",
    },
  },
  // The menu members choose from. "Other (custom)" is appended in code rather
  // than listed here — it's the escape hatch, not a preset.
  habitPresets: [
    { id: "steps-10k", label: "10,000 Steps", auto: "steps", target: 10000 },
    { id: "water-100oz", label: "100oz Water" },
    { id: "outdoor-activity", label: "Outdoor Activity" },
    { id: "pushups-25", label: "25 Push-ups" },
  ],
  // What a member can log under "+ Log Activity". Each carries its own unit,
  // because "Distance (mi)" is wrong for a stair stepper and meaningless for a
  // swim. `step` is the input's increment.
  cardioTypes: [
    { id: "Walk", unitLabel: "Distance (mi)", step: "0.1" },
    { id: "Run", unitLabel: "Distance (mi)", step: "0.1" },
    { id: "Bike", unitLabel: "Distance (mi)", step: "0.1" },
    { id: "Stair Stepper", unitLabel: "Flights Climbed", step: "1" },
  ],
  // The two question keys are fixed: they're the field names inside every
  // stored check-in and the two series on the Progress chart. Wording and the
  // scale ends are free to change; adding a third question is not a settings
  // change (see NOTES.md).
  checkin: {
    title: "How are you today?",
    sub: "Only you can see this.",
    notePrompt: "Anything worth noting?",
    notePlaceholder: "Sleep, soreness, stress, a win…",
    questions: [
      { key: "mental", label: "Mentally", low: "Drained", high: "Sharp" },
      { key: "physical", label: "Physically", low: "Beat up", high: "Strong" },
      // Hours, not a 1-10 feeling — same 0-10 range, so it plots on the same
      // chart, but it's a measurement rather than a rating (2026-09-06).
      { key: "sleepHours", label: "Hours slept", low: "0", high: "10", unit: "hrs", min: 0 },
    ],
    // Four choices, so it's an answer rather than a scale. Labels are Chris's
    // to reword; the stored values are the fixed keys underneath them.
    sleepQuality: {
      label: "How did you sleep?",
      options: [
        { value: "bad", label: "Bad" },
        { value: "ok", label: "OK" },
        { value: "good", label: "Good" },
        { value: "great", label: "Great" },
      ],
    },
  },
  // Cosmetic until the native build gives them somewhere to go, but the
  // defaults decide whether an imported member's first week is useful or
  // noisy — worth choosing before the import, not after.
  notifications: [
    { id: "workouts", label: "Workout Reminders", defaultOn: true },
    { id: "messages", label: "New Messages", defaultOn: true },
    { id: "community", label: "Community Activity", defaultOn: true },
    { id: "challenges", label: "Challenge Updates", defaultOn: true },
    { id: "weekly-summary", label: "Weekly Progress Summary", defaultOn: true },
  ],
  // What a new member starts with. `auto` ties a habit to a wearable metric;
  // leave it off for one the member ticks themselves.
  habits: [
    { id: "steps-10k", label: "10,000 Steps", auto: "steps", target: 10000 },
    { id: "water-100oz", label: "100oz Water" },
    { id: "outdoor-activity", label: "Outdoor Activity" },
  ],
};

const LIVE_APP_SETTINGS_KEY = "burnClubAppSettings";

// Recursive merge, so an override can be as narrow as one tour slide's heading
// and everything around it still tracks the built-in wording. Arrays (faqs,
// habits) are replaced wholesale rather than merged element-wise — a saved
// list of two FAQs means two, not two laid over the three defaults.
function mergeAppSettings(defaults, stored) {
  if (Array.isArray(stored)) return JSON.parse(JSON.stringify(stored));
  if (!stored || typeof stored !== "object") return JSON.parse(JSON.stringify(defaults));
  const out = JSON.parse(JSON.stringify(defaults));
  Object.keys(stored).forEach((k) => {
    const v = stored[k];
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = mergeAppSettings(out[k], v);
    } else {
      out[k] = Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v;
    }
  });
  return out;
}

function loadAppSettings() {
  try {
    return mergeAppSettings(APP_SETTINGS_DEFAULTS, JSON.parse(localStorage.getItem(LIVE_APP_SETTINGS_KEY) || "null"));
  } catch (e) {
    return mergeAppSettings(APP_SETTINGS_DEFAULTS, null);
  }
}

let APP_SETTINGS = loadAppSettings();

// Circuits use the same block schema as the member app:
//   interval, superset, straight, ladder, amrap, emom
const CIRCUITS = [
  {
    id: "full-body-burn",
    programId: "burn-club",
    availableFrom: SEED_THIS_WEEK,
    category: "circuit",
    tag: "New",
    title: "Full Body Burn",
    focus: "Full Body",
    difficulty: "Intermediate",
    desc: "A high-energy circuit hitting every major muscle group — timed stations into a superset finisher.",
    blocks: [
      {
        type: "interval",
        label: "Station Circuit",
        rounds: 2,
        work: 40,
        rest: 20,
        exercises: [
          { name: "Jump Squats" },
          { name: "Push-Ups" },
          { name: "Mountain Climbers" },
          { name: "Plank Hold" },
          { name: "Burpees" },
        ],
      },
      {
        type: "superset",
        label: "Finisher Superset",
        rounds: 3,
        rest: 30,
        exercises: [
          { name: "Kettlebell Swings", reps: 15 },
          { name: "Walking Lunges", reps: 12 },
        ],
      },
    ],
  },
  {
    id: "core-crusher",
    programId: "burn-club",
    availableFrom: SEED_THIS_WEEK,
    category: "circuit",
    tag: "Core",
    title: "Core Crusher",
    focus: "Core & Abs",
    difficulty: "All Levels",
    desc: "Short, sharp, and focused entirely on your core — straight sets into a rep ladder.",
    blocks: [
      {
        type: "straight",
        label: "Straight Sets",
        exercise: { name: "Weighted Sit-Ups" },
        sets: 3,
        reps: 15,
        rest: 30,
      },
      {
        type: "ladder",
        label: "Rep Ladder",
        exercise: { name: "Russian Twists" },
        scheme: [10, 8, 6, 4, 2, 4, 6, 8, 10],
        rest: 15,
      },
    ],
  },
  {
    id: "sweat-sculpt",
    programId: "burn-club",
    availableFrom: SEED_THIS_WEEK,
    category: "circuit",
    tag: "Cardio",
    title: "Sweat & Sculpt",
    focus: "Cardio + Strength",
    difficulty: "Advanced",
    desc: "The week's toughest session — a 12-minute AMRAP into a 10-minute EMOM to finish you off.",
    blocks: [
      {
        type: "amrap",
        label: "12-Minute AMRAP",
        duration: 720,
        exercises: [
          { name: "Kettlebell Swings", reps: 15 },
          { name: "Box Jumps", reps: 10 },
          { name: "Push Press", reps: 12 },
        ],
      },
      {
        type: "emom",
        label: "10-Minute EMOM",
        duration: 600,
        interval: 60,
        exercises: [
          { name: "Burpees", reps: 8 },
          { name: "Goblet Squats", reps: 12 },
        ],
      },
    ],
  },
  {
    id: "power-hour",
    programId: "burn-club",
    availableFrom: SEED_NEXT_WEEK,
    category: "circuit",
    isBenchmark: true,
    benchmarkId: "benchmark-a",
    tag: "New",
    title: "Power Hour",
    focus: "Full Body",
    difficulty: "Advanced",
    desc: "Next week's headline circuit — already dated, goes live on its own when the week turns.",
    blocks: [
      {
        type: "interval",
        label: "Power Stations",
        rounds: 3,
        work: 30,
        rest: 15,
        exercises: [
          { name: "Squat Jumps" },
          { name: "Renegade Rows" },
          { name: "Battle Ropes" },
        ],
      },
    ],
  },
  {
    id: "foundations-intro",
    // Was "foundations-drafts", a folder deleted along with the old Strength
    // Foundations program — which left this workout pointing at nothing and
    // invisible everywhere except Library search (caught 2026-08-15 once the
    // Library started counting folders against workouts). Parked in the
    // general Working Folder, which is what that staging area is for.
    folderId: "working-folder",
    category: "circuit",
    tag: "Draft",
    title: "Foundations: Week 1",
    focus: "Full Body",
    difficulty: "Beginner",
    desc: "Early draft — straight sets to build baseline strength.",
    blocks: [
      {
        type: "straight",
        label: "Straight Sets",
        exercise: { name: "Goblet Squats" },
        sets: 3,
        reps: 10,
        rest: 45,
      },
    ],
  },
  {
    id: "stretch-mobility",
    programId: "burn-club",
    always: true,
    category: "stretch",
    tag: "Recovery",
    title: "Full Body Stretch & Mobility",
    focus: "Full Body",
    difficulty: "All Levels",
    desc: "A slow, guided stretch flow to help members recover between circuit days — one of two stretching sessions offered each month.",
    blocks: [
      {
        type: "interval",
        label: "Stretch Flow",
        timed: true,
        rounds: 1,
        work: 60,
        rest: 15,
        exercises: [
          { name: "Standing Hamstring Stretch" },
          { name: "Hip Flexor Stretch" },
          { name: "Child's Pose" },
          { name: "Cat-Cow Stretch" },
          { name: "Shoulder & Chest Opener" },
        ],
      },
    ],
  },
  {
    id: "ab-burn-10",
    programId: "burn-club",
    always: true,
    category: "core-burn",
    tag: "Core",
    title: "10-Minute Ab Burn",
    focus: "Core & Abs",
    difficulty: "All Levels",
    desc: "A quick, focused core finisher — one of two ab/core burns offered each month.",
    blocks: [
      {
        type: "amrap",
        label: "10-Minute Ab Burn",
        duration: 600,
        exercises: [
          { name: "Bicycle Crunches", reps: 20 },
          { name: "Leg Raises", reps: 15 },
          { name: "Plank Hold", reps: 30 },
          { name: "Russian Twists", reps: 20 },
        ],
      },
    ],
  },
  // Last week's content, kept only by its date. Under the old folder model
  // these would have been manually moved into "Previous Week" and then
  // deleted a week later to make room; now they age out of the member app on
  // their own and stay in the Library permanently. Mirrors the member app's
  // two previous-week circuits so both sides tell the same story.
  {
    id: "lower-body-blast",
    programId: "burn-club",
    availableFrom: SEED_LAST_WEEK,
    category: "circuit",
    tag: "Legs",
    title: "Lower Body Blast",
    focus: "Lower Body",
    difficulty: "Intermediate",
    desc: "Last week's leg day — straight sets into a rep ladder.",
    blocks: [
      {
        type: "straight",
        label: "Straight Sets",
        exercise: { name: "Jump Squats" },
        sets: 3,
        reps: 15,
        rest: 30,
      },
    ],
  },
  {
    id: "cardio-kickstart",
    programId: "burn-club",
    availableFrom: SEED_LAST_WEEK,
    category: "circuit",
    tag: "Cardio",
    title: "Cardio Kickstart",
    focus: "Cardio",
    difficulty: "All Levels",
    desc: "Last week's cardio finisher — a 20-minute AMRAP to get the heart rate up.",
    blocks: [
      {
        type: "amrap",
        label: "20-Minute AMRAP",
        duration: 1200,
        exercises: [
          { name: "Burpees", reps: 10 },
          { name: "Mountain Climbers", reps: 20 },
          { name: "Jump Squats", reps: 15 },
        ],
      },
    ],
  },
  // Fit & Functional's content — 48 fully unique workouts (6 per week × 8
  // weeks, no repeats), one folder per week. Named on Chris's convention:
  // "Week N [Focus]" — same 6 focus areas every week (the naming doesn't
  // change), but the exercise selection and volume vary week to week so the
  // actual workouts are genuinely different, not just relabeled duplicates.
  ...buildFitFunctionalCircuits(),
  ...buildThirtyMinuteBurnCircuits(),
];

// ---------------- Structured Program Schedules ----------------
// Day-by-day template for structured programs (scheduleType: "structured").
// Day 1 is relative to each individual member's own start date, not a fixed
// calendar date — see SCHEDULE_TEMPLATES usage in the member app for how a
// day-offset becomes a real date. `type` is deliberately generalized now
// ("workout" | "rest") so check-ins and progress-photo reminders can be
// added as new types later without restructuring — v1 only builds workouts.
function buildFitFunctionalSchedule() {
  const focusOrder = FF_FOCUS_AREAS.map((a) => a.key).concat("circuit");
  const days = [];
  let day = 1;
  for (let week = 1; week <= 8; week++) {
    focusOrder.forEach((key) => {
      days.push({ day, type: "workout", workoutId: `ff-w${week}-${key}` });
      day++;
    });
    days.push({ day, type: "rest" });
    day++;
  }
  return days;
}

const SCHEDULE_TEMPLATES = {
  "fit-functional": buildFitFunctionalSchedule(),
  "thirty-minute-burn": buildThirtyMinuteBurnSchedule(),
};

// Fields split into two groups, kept explicit here for clarity even though it's
// enforced in the admin UI (see the Members editor's two labeled sections):
//   Visible to member: name, email, program, memberSince, badge
//   Staff only: status (active/inactive), notes
// challengePoints: auto-calculated baseline for the currently running challenge
// (in the real member app this comes from logged completions — the admin side
// has no completion log of its own, so it's seeded here like `streak`).
// pointAdjustment: staff-entered manual nudge on top of that, e.g. for
// in-person activity the app never sees. See CHALLENGES below.
// habits: the member's own 3 Daily Habits picks — view-only in admin (staff
// don't set these, members do, on their own Profile); seeded here since admin
// has no live connection to the member app's real localStorage-backed picks.
// ---------------- Benchmarks ----------------
// Live on the program now — see PROGRAMS above, and benchmarksForProgram() in
// app.js. There used to be a standalone list here as well as a copy in
// APP_SETTINGS, which meant renaming a benchmark in Settings changed it for
// members but not in the workout builder's dropdown. One owner now.

const MEMBERS = [
  { id: "priya-k", name: "Priya K.", email: "priya.k@example.com", program: "burn-club", streak: 10, memberSince: "Jan 2025", badge: "Founding Member", status: "active", notes: "", challengePoints: 195, pointAdjustment: 10, habits: ["10,000 Steps", "100oz Water", "Outdoor Activity"] },
  { id: "marcus-t", name: "Marcus T.", email: "marcus.t@example.com", program: "burn-club", streak: 8, memberSince: "Feb 2025", badge: "", status: "active", notes: "Prefers morning workouts.", challengePoints: 150, pointAdjustment: 0, habits: ["10,000 Steps", "25 Push-ups"] },
  { id: "jamie-r", name: "Jamie R.", email: "jamie.r@example.com", program: "burn-club", streak: 6, memberSince: "Mar 2025", badge: "", status: "active", notes: "", challengePoints: 110, pointAdjustment: 0, habits: ["100oz Water"] },
  { id: "chris-v", name: "Chris V.", email: "chris.v@example.com", program: "burn-club", streak: 5, memberSince: "Jan 2025", badge: "Founding Member", status: "active", notes: "Asked about modifying Sweat & Sculpt frequency — flagged in DMs.", challengePoints: 90, pointAdjustment: 0, habits: ["10,000 Steps", "100oz Water", "Outdoor Activity"] },
  { id: "alicia-b", name: "Alicia B.", email: "alicia.b@example.com", program: "burn-club", streak: 0, memberSince: "Apr 2025", badge: "", status: "inactive", notes: "Paused membership — traveling for work through end of month.", challengePoints: 40, pointAdjustment: 0, habits: [] },
  // Mirrors the member app's Jordan profile (2026-08-17). Every member here
  // was on Burn Club, so Fit & Functional claimed a member it didn't have and
  // the new Program Access field had nothing to appear on. `access` is only
  // meaningful for programs authored in Home/Gym variants — see
  // programHasVariants() — and `startDate` anchors this member's Day 1 against
  // SCHEDULE_TEMPLATES. Kept a fixed date rather than one computed from today,
  // matching how the member app seeds its own structured history.
  { id: "jordan-p", name: "Jordan P.", email: "jordan.p@example.com", program: "fit-functional", streak: 3, memberSince: "Jun 2025", badge: "", status: "active", notes: "Bought the combo package — sees both Home and Gym each day.", challengePoints: 60, pointAdjustment: 0, habits: ["10,000 Steps"], startDate: "2026-08-07", access: "both" },
];

// ---------------- Challenges ----------------
// Point-based, threshold challenges (not first-past-the-post): any member who
// reaches thresholdPoints qualifies for the reward. programId is either a
// specific program's id or "all" for every program at once.
// Teams are a property of the challenge, not of the member (2026-08-24,
// Chris). The point isn't team identity — it's that a fresh draw each month
// keeps introducing members to people they haven't trained alongside. So
// there's no team field on a profile: a team exists while its challenge does,
// and next month everyone is redrawn.
//
// `teams` is absent until the coach draws them, so a challenge can exist
// without being a team challenge at all.
const CHALLENGES = [
  {
    id: "summer-sweat-2026",
    name: "Summer Sweat Challenge",
    programId: "burn-club",
    // Bracketing today, same bump the member app's copy already had (see
    // CHALLENGES in ../data.js). Admin's copy still said 2026-07, so admin
    // read the challenge as "ended" while the member app read it as running —
    // the two apps disagreed about whether teams were live at all.
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
    // "individual" or "teams" (2026-08-26). Teams used to be something you
    // could bolt onto any challenge from the detail page; now it's what kind
    // of challenge this is, chosen when it's created.
    format: "teams",
    // The team competition is named separately from the individual challenge
    // (2026-08-27, Chris). Both run off the same points; the member app shows
    // them as two cards, so two names is what stops the second card reading
    // as a repeat of the first.
    teamChallengeName: "August Showdown",
    teamCount: 4,
    teams: [
      { id: "t-red", name: "Red", defaultName: "Red", color: "#E0685E", memberIds: ["priya-k", "marcus-t"] },
      { id: "t-blue", name: "Blue", defaultName: "Blue", color: "#788CE3", memberIds: ["jamie-r", "alicia-b"] },
      { id: "t-green", name: "Green", defaultName: "Green", color: "#13673F", memberIds: ["chris-v"] },
      { id: "t-gold", name: "Gold", defaultName: "Gold", color: "#E6B400", memberIds: ["jordan-p"] },
    ],
  },
];

// Colour comes from the palette by position and is stored on the team, not
// derived from its name (2026-08-24) — names are Chris's to edit, so keying
// colour off them would have a rename silently change a team's colour.
const TEAM_PALETTE = ["#E0685E", "#788CE3", "#13673F", "#E6B400", "#A78BFA", "#F0A6CA", "#37FF8B", "#5C7A99"];
// Kept as the fallback if the setting is ever emptied — a team with no name
// at all would render a blank input nobody could tell apart from its
// neighbours.
const DEFAULT_TEAM_NAMES = ["Red", "Blue", "Green", "Gold", "Purple", "Pink", "Mint", "Slate"];
const MAX_TEAMS = TEAM_PALETTE.length;

// ---------------- Messaging ----------------
// Messages sent here (or in the member/staff apps) are bridged live via
// localStorage, same-origin/same-browser only — see broadcastMessage() in
// app.js and the matching LIVE_CIRCUITS_KEY bridge for workouts.

// ---------------- Groups (2026-08-17) ----------------
// Two kinds, one shape once read through groupMembers():
//
//   Program groups are derived, never stored — one per program, membership is
//   every member on it. Deliberately variant-agnostic: Home, Gym and Combo
//   members of the same program are one group, per Chris. A member's access
//   level is an attribute of them, not a separate audience.
//
//   Custom groups are hand-picked. They store their member ids outright, so
//   membership only changes when someone changes it.
//
// The per-program group chats that already existed are these same program
// groups — the Groups section is where they surface, rather than a second,
// competing idea of "the Burn Club group".
const CUSTOM_GROUPS = [
  {
    id: "custom-founding-members",
    name: "Founding Members",
    description: "The original crew — first to sign up, first to hear about anything new.",
    memberIds: ["priya-k", "chris-v"],
  },
  {
    id: "custom-form-check",
    name: "Form Check Volunteers",
    description: "Members who agreed to send video for technique feedback.",
    memberIds: ["marcus-t", "jamie-r", "jordan-p"],
  },
];

// A DM per member, one chat per program group, and one per custom group so a
// custom group is messageable the moment it exists.
const CONVERSATIONS = [
  ...MEMBERS.map((m) => ({ id: "dm-" + m.id, type: "dm", memberId: m.id })),
  ...PROGRAMS.map((p) => ({ id: "group-" + p.id, type: "group", programId: p.id, name: p.name + " Group Chat" })),
  ...CUSTOM_GROUPS.map((g) => ({ id: "group-" + g.id, type: "group", groupId: g.id, name: g.name + " Group Chat" })),
];

const MESSAGES = [
  { id: "msg-1", conversationId: "dm-chris-v", senderId: "staff", senderName: "Staff", isStaff: true, text: "Hey Chris! Welcome to Burn Club — let us know if you need anything.", time: "Mon 9:02 AM", read: true },
  { id: "msg-2", conversationId: "dm-chris-v", senderId: "chris-v", senderName: "Chris V.", isStaff: false, text: "Thanks! Quick question — is Sweat & Sculpt okay to do two days in a row?", time: "Mon 6:47 PM", read: false },
  { id: "msg-3", conversationId: "dm-priya-k", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Just hit a 10-day streak! 🎉", time: "Today 8:02 AM", read: false },
  { id: "msg-4", conversationId: "group-burn-club", senderId: "staff", senderName: "Staff", isStaff: true, text: "New circuits are up for the week — 3 fresh ones plus a new stretch session! 🔥", time: "Sun 8:00 AM", read: true },
  { id: "msg-5", conversationId: "group-burn-club", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Sweat & Sculpt kicked my butt today 😅", time: "Sun 5:30 PM", read: true },
  { id: "msg-6", conversationId: "group-burn-club", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same! Worth it though", time: "Sun 5:41 PM", read: false },
  // Every group chat but Burn Club's was empty, which made the Groups
  // section's chat panel look broken rather than quiet (2026-08-17).
  { id: "msg-7", conversationId: "group-fit-functional", senderId: "staff", senderName: "Staff", isStaff: true, text: "Week 3 is live — the Gym variant swaps the DB press for barbell work.", time: "Mon 7:30 AM", read: true },
  { id: "msg-8", conversationId: "group-fit-functional", senderId: "jordan-p", senderName: "Jordan P.", isStaff: false, text: "Perfect, I'll be at the gym Thursday. Can I do Week 3 Day 2 at home instead?", time: "Mon 12:15 PM", read: false },
  { id: "msg-9", conversationId: "group-custom-founding-members", senderId: "staff", senderName: "Staff", isStaff: true, text: "Early access to the new benchmark this Friday — you three first, as always.", time: "Sun 4:00 PM", read: true },
  { id: "msg-10", conversationId: "group-custom-founding-members", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Love it. Ready to beat my last Gauntlet score 🔥", time: "Sun 6:22 PM", read: false },
  { id: "msg-11", conversationId: "group-custom-form-check", senderId: "staff", senderName: "Staff", isStaff: true, text: "Send your deadlift setup when you get a chance — happy to review before next week.", time: "Today 9:10 AM", read: true },
  // One kickoff per team chat, so every team thread has a coach in it from the
  // moment the teams are drawn.
  { id: "msg-team-red-1", conversationId: "group-team-t-red", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Red is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-red-2", conversationId: "group-team-t-red", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Let's go! I'm in for a double this week.", time: "Sat 10:12 AM", read: true },
  { id: "msg-team-red-3", conversationId: "group-team-t-red", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same here. What's everyone doing Monday?", time: "Sat 11:40 AM", read: false },
  { id: "msg-team-blue-1", conversationId: "group-team-t-blue", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Blue is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-blue-2", conversationId: "group-team-t-blue", senderId: "jamie-r", senderName: "Jamie R.", isStaff: false, text: "First team challenge for me — what counts for points again?", time: "Sat 2:05 PM", read: false },
  { id: "msg-team-green-1", conversationId: "group-team-t-green", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Green is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-gold-1", conversationId: "group-team-t-gold", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Gold is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
];

const LIVE_MESSAGES_KEY = "burnClubLiveMessages";
try {
  JSON.parse(localStorage.getItem(LIVE_MESSAGES_KEY) || "[]").forEach((m) => {
    const idx = MESSAGES.findIndex((x) => x.id === m.id);
    if (idx === -1) MESSAGES.push(m);
    else MESSAGES[idx] = m;
  });
} catch (e) {}

const COMMUNITY_POSTS = [
  { id: "p1", member: "Jamie R.", program: "burn-club", content: "Completed Core Crusher 🔥", time: "12m ago", likes: 8, flagged: false, featured: false },
  { id: "p2", member: "Priya K.", program: "burn-club", content: "Hit a 10-day streak! Feeling unstoppable.", time: "1h ago", likes: 22, flagged: false, featured: true },
  { id: "p3", member: "Marcus T.", program: "burn-club", content: "Completed Full Body Burn — that superset finisher destroyed me.", time: "3h ago", likes: 14, flagged: false, featured: false },
  { id: "p4", member: "Anonymous User", program: "burn-club", content: "Check out this link for free supplements [spam link]", time: "5h ago", likes: 0, flagged: true, featured: false },
  { id: "p5", member: "Alicia B.", program: "burn-club", content: "Anyone else find the EMOM way harder than the AMRAP?", time: "6h ago", likes: 5, flagged: false, featured: false },
];

// ---------------- Activity Feed ----------------
// Recent workout completions across all members, for the Dashboard's
// "Recent Activity" panel. Static seeded list — same convention as
// COMMUNITY_POSTS above (hardcoded relative time, not computed) — not a
// live feed of real member-app events, same no-cross-app-sync limitation
// as everything else. Real member names are pulled from MEMBERS so
// clicking a row into that member's profile is provable end-to-end.
// Ordered newest-first — latestActivityFor() takes the first match per member,
// so the order is load-bearing, not cosmetic.
//
// `daysAgo` is the source of truth and `date` is derived from it at load, so
// the feed stays anchored to today rather than drifting into the past as the
// demo ages. In the real system these are timestamps on a completion record.
const ACTIVITY_FEED_SEED = [
  { id: "a1", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "Core Crusher", time: "4m ago", daysAgo: 0, rpe: 7 },
  { id: "a2", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Sweat & Sculpt", time: "18m ago", daysAgo: 0, rpe: 9 },
  { id: "a3", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "10-Minute Ab Burn", time: "2h ago", daysAgo: 0, rpe: 6 },
  { id: "a4", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Full Body Stretch & Mobility", time: "5h ago", daysAgo: 0, rpe: 3 },
  { id: "a5", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "Full Body Burn", time: "Yesterday", daysAgo: 1, rpe: 6 },
  { id: "a6", memberId: "chris-v", memberName: "Chris V.", workoutTitle: "Core Crusher", time: "Yesterday", daysAgo: 1, rpe: 5 },
  { id: "a7", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "Sweat & Sculpt", time: "Yesterday", daysAgo: 1, rpe: 8 },
  { id: "a8", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Core Crusher", time: "2 days ago", daysAgo: 2, rpe: 4 },
  { id: "a9", memberId: "chris-v", memberName: "Chris V.", workoutTitle: "Full Body Burn", time: "3 days ago", daysAgo: 3, rpe: 8 },
  { id: "a10", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "10-Minute Ab Burn", time: "4 days ago", daysAgo: 4, rpe: 5 },
  { id: "a11", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "Full Body Burn", time: "5 days ago", daysAgo: 5, rpe: 9 },
  // Alicia's membership is paused while she travels, so a session hours ago
  // contradicted her own record. Pushed back to match — and it's what makes
  // the roster's date column worth reading, by showing who has gone quiet.
  { id: "a12", memberId: "alicia-b", memberName: "Alicia B.", workoutTitle: "Full Body Burn", time: "12 days ago", daysAgo: 12, rpe: 7 },
];

const ACTIVITY_FEED = ACTIVITY_FEED_SEED.map((a) => {
  const d = new Date();
  d.setDate(d.getDate() - a.daysAgo);
  return { ...a, date: dateKey(d) };
});


const ANALYTICS = {
  totalMembers: 214,
  activeThisWeekPct: 68,
  avgCompletionPct: 74,
  avgStreak: 5.2,
  topCircuits: [
    { title: "Full Body Burn", completions: 189 },
    { title: "Core Crusher", completions: 162 },
    { title: "Sweat & Sculpt", completions: 141 },
  ],
};

// ---------------- Member activity (2026-08-17) ----------------
// Powers the dashboard's per-day activity chart: how many distinct members
// completed a workout or a cardio session on each day of a given week.
//
// Real records rather than pre-computed totals, so the chart's actual logic —
// count distinct members per day, filtered by program — is the same code that
// will run against a real completions table. What's synthetic is only the
// source: the prototype has no cross-app completion log (members' history
// lives in their own browser), so a plausible population is generated here
// from each program's memberCount.
//
// Deterministic: seeded off memberId + date, so reloading doesn't reshuffle
// the chart. Generated relative to today, so the demo never goes stale.

const ACTIVITY_WEEKS_BACK = 10;

// Cheap string hash → a stable number in [0, 1). Not random, just evenly
// spread and repeatable, which is all the seed data needs.
function activityHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Rough real-world shape: strong start to the week, tailing off into the
// weekend. Index is getDay() — 0 = Sunday.
const ACTIVITY_DAY_WEIGHTS = [0.22, 0.55, 0.48, 0.50, 0.44, 0.30, 0.24];

// Not everyone on the roster trains in a given week — a third of any real
// membership is dormant at any time. Without this the chart reported ~100%
// weekly participation, which is both implausible and useless as a signal.
const ACTIVITY_DORMANT_SHARE = 0.32;

function buildMemberActivity() {
  const records = [];
  const start = parseDateKey(shiftWeeks(currentWeekStartKey(), -ACTIVITY_WEEKS_BACK));
  const days = (ACTIVITY_WEEKS_BACK + 1) * 7;

  PROGRAMS.forEach((program) => {
    const population = program.memberCount || 0;
    for (let i = 0; i < population; i++) {
      const memberId = `${program.id}-m${i + 1}`;
      // Per-member consistency: the same people are regulars week to week,
      // rather than turnout being reshuffled at random every day.
      const engagement = activityHash(memberId);
      if (engagement < ACTIVITY_DORMANT_SHARE) continue;
      const commitment = 0.35 + engagement * 0.75;
      for (let d = 0; d < days; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + d);
        const key = dateKey(day);
        const chance = ACTIVITY_DAY_WEIGHTS[day.getDay()] * commitment;
        if (activityHash(memberId + key) >= chance) continue;
        records.push({
          memberId,
          programId: program.id,
          date: key,
          type: activityHash(key + memberId) < 0.25 ? "cardio" : "workout",
        });
      }
    }
  });

  return records;
}

const MEMBER_ACTIVITY = buildMemberActivity();
