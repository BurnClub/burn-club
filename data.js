// Sample data for the Burn Club prototype — placeholder content only.

// Block types supported by the workout player:
//   interval  — timed stations cycled for N rounds (work/rest, auto-advancing)
//   superset  — 2+ exercises back-to-back per round, rest after each round (self-paced reps)
//   straight  — single exercise, N sets x reps, self-paced with timed rest between sets
//   ladder    — single exercise, rep scheme across rounds (e.g. 10-8-6-4-2), self-paced
//   amrap     — as many rounds as possible of an exercise list within a time cap
//   emom      — every-minute-on-the-minute, rotating through an exercise list

// ---------------- Exercise Library ----------------
// Mirrors admin's EXERCISE_LIBRARY (same ids/names/tags) so members browsing
// here see the same exercises admin builds workouts from. Kept as its own
// duplicated seed, same as CIRCUITS — no shared backend between the apps.
// Same granular muscle-group taxonomy as admin's BODY_PART_TAGS (2026-08-04
// change) — kept in sync so an exercise's tags don't disagree between apps.
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
  { id: "90-dregree-supinated-to-pronated-rise-to-press", name: "90 Dregree Supinated to Pronated Rise to Press", bodyParts: ["Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
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
  { id: "arms-only-assult-bike", name: "Arms Only Assult Bike", bodyParts: ["Upper Body"], modality: "Cardio", equipment: ["Assault Bike"], technique: "", trackWeight: false, videoUrl: "" },
  { id: "arnold-press", name: "Arnold Press", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "around-the-world-raise", name: "Around the World Raise", bodyParts: ["Side Delts", "Front Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "around-the-world-raise-into-upright-row", name: "Around the World Raise into Upright Row", bodyParts: ["Front Delts", "Side Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "assult-echo-bike", name: "Assult/Echo Bike", bodyParts: ["Upper Body", "Lower Body"], modality: "Cardio", equipment: ["Assault Bike"], technique: "", trackWeight: false, videoUrl: "" },
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
  { id: "banded-squat-w--allternating-side-steps", name: "Banded Squat w/ Allternating Side Steps", bodyParts: ["Glutes", "Quads"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
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
  { id: "db-hip-extention", name: "DB Hip Extention", bodyParts: ["Glutes"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
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
  { id: "latreal-band-squat-walk", name: "Latreal Band Squat Walk", bodyParts: ["Abductors", "Quads", "Glutes"], modality: "Strength", equipment: ["Bands"], technique: "", trackWeight: false, videoUrl: "" },
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
  { id: "revserse-db-fly-w--slow-eccentric", name: "Revserse DB Fly w/ Slow Eccentric", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "reverse-incline-rear-delt-fly", name: "Reverse Incline Rear Delt Fly", bodyParts: ["Rear Delts"], modality: "Strength", equipment: ["Bench", "DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "revserse-lunge-to-knee-hug", name: "Revserse Lunge to Knee Hug", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "", trackWeight: false, videoUrl: "" },
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
  { id: "seated-machine-hamtring-curl-static-hold", name: "Seated Machine Hamtring Curl Static Hold", bodyParts: ["Hamstrings"], modality: "Strength", equipment: ["Machine"], technique: "", trackWeight: true, videoUrl: "" },
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
  { id: "sigle-arm-db-push-jerk", name: "Sigle Arm DB Push Jerk", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
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
  { id: "single-arm-kb-db-overead-walk", name: "Single Arm KB/DB Overead Walk", bodyParts: ["Shoulders", "Full Body"], modality: "Strength", equipment: ["DB", "KB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-farmer-carry-cossack-squat", name: "Single Arm Farmer Carry Cossack Squat", bodyParts: ["Quads", "Glutes", "Abductors"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-farmers-march", name: "Single Arm Farmers March", bodyParts: ["Full Body"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "single-arm-hammer-curl-w--static-hold", name: "Single Arm Hammer Curl w/ Static Hold", bodyParts: ["Biceps"], modality: "Strength", equipment: ["DB"], technique: "", trackWeight: true, videoUrl: "" },
  { id: "sigle-arm-kb-swing", name: "Sigle Arm KB Swing", bodyParts: ["Full Body"], modality: "Strength", equipment: ["KB"], technique: "", trackWeight: true, videoUrl: "" },
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

// ---------------- Fit & Functional content generator ----------------
// Mirrors admin's generator exactly (same ids/titles), adapted to this
// app's circuit schema (meta/color instead of focus/difficulty). Declared
// before CIRCUITS since the array below calls this immediately — a `const`
// declared after would still be in its temporal dead zone at that point.
// Each focus area carries a home and a gym exercise pool (2026-08-14). The
// two variants of a session share everything structural — same week, same
// day, same sets and reps — and differ only in which exercises fill the
// slots. That's what makes "combo" access coherent: one programme, one
// schedule, two ways to execute the same day.
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
const PROGRAM_VARIANTS = [
  { key: "home", label: "Home" },
  { key: "gym", label: "Gym" },
];
const FF_CARD_COLORS = ["blue", "periwinkle", "deepblue", "yellow"];

function ffPickRotating(pool, week, count) {
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(pool[(week - 1 + i) % pool.length]);
  return picks;
}

// Emits two workouts per slot — one per variant. Both carry `slotId`, which
// is what the schedule points at, so a single schedule serves home, gym and
// combo members alike.
// Which lifts get a static hold programmed with them, and for how long
// (2026-08-21). A hold is a modifier on the exercise, not an exercise of its
// own — same movement, held at the end position — so it lives here as seconds
// against a name rather than as a second library entry.
// Isometric exercises are deliberately absent: a Plank Hold IS the hold, so
// "10 reps + 30s hold" reads as nonsense. These are lifts where reps-then-hold
// is what you'd actually program, which is the case the modifier is for.
const FF_STATIC_HOLDS = {
  "Goblet Squats": 20,
  "Walking Lunges": 15,
  "Kettlebell Swings": 20,
  "Push Press": 15,
};

function buildFitFunctionalCircuits() {
  const circuits = [];
  let colorIndex = 0;
  for (let week = 1; week <= 8; week++) {
    const difficulty = week <= 6 ? "Intermediate" : "Advanced";
    const sets = 3 + Math.floor((week - 1) / 2);

    FF_FOCUS_AREAS.forEach((area) => {
      const slotId = `ff-w${week}-${area.key}`;
      const color = FF_CARD_COLORS[colorIndex++ % FF_CARD_COLORS.length];
      PROGRAM_VARIANTS.forEach((variant) => {
        const names = ffPickRotating(area.pools[variant.key], week, 3);
        circuits.push({
          id: `${slotId}-${variant.key}`,
          slotId,
          variant: variant.key,
          category: "structured",
          tag: `Week ${week}`,
          title: `Week ${week} ${area.label}`,
          meta: `${20 + sets * 2} min · ${area.label} · ${difficulty}`,
          color,
          desc: `Week ${week} strength session focused on ${area.label.toLowerCase()}.`,
          blocks: names.map((name) => ({
            type: "straight", label: name, exercise: { name }, sets, reps: 10, rest: 45,
            ...(FF_STATIC_HOLDS[name] ? { hold: FF_STATIC_HOLDS[name] } : {}),
          })),
        });
      });
    });

    const circuitSlotId = `ff-w${week}-circuit`;
    const circuitColor = FF_CARD_COLORS[colorIndex++ % FF_CARD_COLORS.length];
    PROGRAM_VARIANTS.forEach((variant) => {
      const circuitNames = ffPickRotating(FF_CIRCUIT_POOLS[variant.key], week, 4);
      circuits.push({
        id: `${circuitSlotId}-${variant.key}`,
        slotId: circuitSlotId,
        variant: variant.key,
        category: "structured",
        tag: `Week ${week}`,
        title: `Week ${week} Circuit`,
        meta: `${20 + sets * 2} min · Full Body · ${difficulty}`,
        color: circuitColor,
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

// ---------------- Block format explainers ----------------
// The "Before You Start" popup text, keyed by block type rather than stored
// per block (2026-08-12, Chris). These were a free-text "Block Notes" field
// in admin, but every workout had the same wording for a given format —
// they explain the format, not the specific workout — so staff were
// retyping boilerplate and could forget it. Two formats (straight, ladder)
// had in fact been shipping with no notes at all. Deriving from type means
// every block always has one and they stay consistent app-wide.
// Keys must match the block `type` values used in CIRCUITS below.
const BLOCK_FORMAT_NOTES = {
  interval: "This is a timed circuit — work through each station for the set time, then take a short rest before moving to the next one. Once you've been through every station, that's one round; after a brief rest, start the next round from the top. Focus on clean, controlled reps within the work window instead of racing to beat the clock.",
  // Worded for any number of exercises, not two — these are now used for
  // rep-based station circuits as well, which run three or more (2026-08-18).
  superset: "Every exercise is on this one screen — work down the list in order, finishing all the reps for one before moving straight into the next with no rest in between. Once you've been through the whole list, that's one round; rest, then start the next round from the top.",
  amrap: "AMRAP stands for As Many Rounds As Possible. Complete every exercise below once, in order — that's one round. As soon as you finish the last exercise, go right back to the first one and start the next round. Keep going until the clock hits zero, moving at a strong, steady pace and keeping your form solid. When time's up, log how many full rounds you completed. One thing to know: the AMRAP clock runs on real time, so if you leave the app mid-block it keeps counting down while you're away.",
  emom: "EMOM stands for Every Minute On the Minute. At the top of each minute, complete the listed reps for that minute's exercise, then rest with whatever time is left before the next minute starts. Move to the next exercise each time a new minute begins, cycling back to the first once you've gone through them all. The faster you finish your reps, the more rest you bank before the next round.",
  straight: "Straight sets — complete all the reps for one set, then rest before starting the next. Take the full rest between sets; it's there so each set can be as strong as the one before it. Log the weight you used as you go so you have it to build on next time.",
  "cardio-choice": "Cardio, your choice — pick whatever you'll actually do: walk, run, bike, or the stair stepper. The clock runs for the prescribed time; hold a steady effort you could keep up for the whole block rather than going out hard and fading. When it's done, log what you picked so it lands in your cardio log.",
  ladder: "A ladder works through a changing rep count each set instead of the same number every time. Complete the reps shown for the set you're on, rest, then move to the next number in the sequence. Let the weight stay honest to the rep count rather than forcing the same load the whole way through.",
};

// Staff can reword these in Admin → Settings → Workout Settings; overrides
// ride the same localStorage bridge as circuits and messages. A blank
// override is ignored on purpose rather than saved as empty — an empty
// explainer would mean no popup at all, which is the exact gap deriving
// these from block type was meant to close.
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

// ---------------- Dated availability (2026-08-15) ----------------
// Rolling-program workouts carry their own availability instead of being
// tagged into a "this week" or "previous week" bucket by admin. The app works
// out which bucket a workout is in every time it renders, so content moves
// itself when the week turns — nobody has to publish or retire anything.
// Mirrors admin/data.js; weeks start Sunday, matching Chris's rotation day.
function startOfWeek(d) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function weekStartKeyOf(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return dateKey(startOfWeek(new Date(y, m - 1, d)));
}

function currentWeekStartKey() {
  return dateKey(startOfWeek(new Date()));
}

function shiftWeeks(weekStartKeyStr, n) {
  const [y, m, d] = String(weekStartKeyStr).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n * 7);
  return dateKey(dt);
}

// live | last-week | scheduled | past | always | undated.
function circuitAvailability(circuit) {
  if (circuit.always) return { state: "always" };
  if (!circuit.availableFrom) return { state: "undated" };
  const wk = weekStartKeyOf(circuit.availableFrom);
  const cur = currentWeekStartKey();
  if (wk === cur) return { state: "live", weekStart: wk };
  if (wk === shiftWeeks(cur, -1)) return { state: "last-week", weekStart: wk };
  return { state: wk > cur ? "scheduled" : "past", weekStart: wk };
}

// Seed dates relative to today so the demo never goes stale.
const SEED_THIS_WEEK = currentWeekStartKey();
const SEED_LAST_WEEK = shiftWeeks(SEED_THIS_WEEK, -1);
const SEED_NEXT_WEEK = shiftWeeks(SEED_THIS_WEEK, 1);

const CIRCUITS = [
  {
    id: "full-body-burn",
    programId: "burn-club",
    availableFrom: SEED_THIS_WEEK,
    category: "circuit",
    tag: "New",
    title: "Full Body Burn",
    meta: "30 min · Full Body · Intermediate",
    color: "blue",
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
          { name: "Walking Lunges", reps: 12, hold: 20 },
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
    meta: "20 min · Core & Abs · All Levels",
    color: "periwinkle",
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
    meta: "35 min · Cardio + Strength · Advanced",
    color: "deepblue",
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
    id: "the-gauntlet",
    programId: "burn-club",
    availableFrom: SEED_THIS_WEEK,
    category: "circuit",
    tag: "Benchmark",
    title: "The Gauntlet",
    meta: "12 min · Full Body · Benchmark A",
    color: "yellow",
    isBenchmark: true,
    benchmarkId: "benchmark-a",
    desc: "Benchmark A — see how many rounds you can complete in 12 minutes. This one gets retested every few months so you can watch your score climb.",
    blocks: [
      {
        type: "amrap",
        label: "12-Minute AMRAP",
        duration: 720,
        exercises: [
          { name: "Kettlebell Swings", reps: 15 },
          { name: "Box Jumps", reps: 10 },
          { name: "Push-Ups", reps: 12 },
        ],
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
    meta: "15 min · Full Body · All Levels",
    color: "periwinkle",
    desc: "A slow, guided stretch flow to help you recover between circuit days.",
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
    meta: "10 min · Core & Abs · All Levels",
    color: "blue",
    desc: "A quick, focused core finisher you can slot in anytime.",
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
  // Last week's workouts, left "live" for an extra week — mirrors the
  // admin-side "Previous Week" live folder, but this member app has no real
  // connection to that (same fake-data limitation as the rest of this
  // prototype), so these are seeded directly here for the Workouts tab.
  {
    id: "power-hour",
    programId: "burn-club",
    availableFrom: SEED_NEXT_WEEK,
    category: "circuit",
    tag: "Last Week",
    title: "Power Hour",
    meta: "30 min · Full Body · Intermediate",
    color: "deepblue",
    desc: "Last week's full-body strength session — station circuit into a finisher superset.",
    blocks: [
      {
        type: "interval",
        label: "Station Circuit",
        rounds: 2,
        work: 40,
        rest: 20,
        exercises: [
          { name: "Goblet Squats" },
          { name: "Push-Ups" },
          { name: "Walking Lunges" },
          { name: "Plank Hold" },
        ],
      },
    ],
  },
  {
    id: "lower-body-blast",
    programId: "burn-club",
    availableFrom: SEED_LAST_WEEK,
    category: "circuit",
    tag: "Last Week",
    title: "Lower Body Blast",
    meta: "25 min · Lower Body · Intermediate",
    color: "periwinkle",
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
    tag: "Last Week",
    title: "Cardio Kickstart",
    meta: "20 min · Cardio · All Levels",
    color: "blue",
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
  // Fit & Functional's content — mirrors admin's 48 unique ff-* circuits
  // (same ids so the schedule template below can reference them). category
  // "structured" keeps these out of the weekly-rotation filters in app.js —
  // only ever reached via the Calendar tab, never "This Week's Workouts."
  ...buildFitFunctionalCircuits(),
];

// Workouts the admin app publishes get bridged in here via localStorage —
// same-origin browser storage is the only thing these otherwise-independent
// static apps actually share (see admin/app.js's syncCircuitToMemberApp).
//
// Replace-by-id, not a plain unshift. The bridge used to only carry copies
// living in a live folder, which had their own ids (`full-body-burn-live`),
// so a collision with the seed was unlikely. Dated publishing sends every
// rolling workout under its real id, so an unshift would render each synced
// workout twice — once bridged, once seeded. This matches what app.js's
// "storage" listener already did for live updates.
const LIVE_CIRCUITS_KEY = "burnClubLiveCircuits";
try {
  JSON.parse(localStorage.getItem(LIVE_CIRCUITS_KEY) || "[]").forEach((lc) => {
    const idx = CIRCUITS.findIndex((c) => c.id === lc.id);
    if (idx === -1) CIRCUITS.unshift(lc);
    else CIRCUITS[idx] = lc;
  });
} catch (e) {}

// ---------------- Structured Program Schedules ----------------
// Mirrors admin's SCHEDULE_TEMPLATES exactly (same no-shared-backend
// limitation as everything else — a schedule edit in admin doesn't reach
// here). Day 1 is relative to each member's own startDate (see
// MEMBER_PROFILES above), not a fixed calendar date.
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
};

// Buzz is scoped to the member's own program (2026-08-13) — it used to be one
// flat list of Burn Club members doing Burn Club workouts, shown to everyone,
// so a Fit & Functional member watched activity from a program they aren't on.
// Same seeded-and-fake caveat as the rest of the social data: these aren't
// real other members, and nothing here syncs across the three apps.
const FEED = [
  { programId: "burn-club", name: "Jamie R.", action: "completed Core Crusher", time: "12m ago", emoji: "🔥" },
  { programId: "burn-club", name: "Priya K.", action: "hit a 10-day streak", time: "1h ago", emoji: "🏆" },
  { programId: "burn-club", name: "Marcus T.", action: "completed Full Body Burn", time: "3h ago", emoji: "💪" },
  { programId: "fit-functional", name: "Dana W.", action: "completed Week 2 Chest and Tris", time: "24m ago", emoji: "🔥" },
  { programId: "fit-functional", name: "Luis M.", action: "finished Week 2 — halfway through the program", time: "2h ago", emoji: "🏆" },
  { programId: "fit-functional", name: "Priya K.", action: "completed Week 2 Quads and Glutes", time: "5h ago", emoji: "💪" },
];


// ---------------- Messaging ----------------
// Prototype-only: messages live in this tab's memory, same as the rest of
// the app's data — sending one does not deliver anywhere else.

// Matches the "Chris V." record in the admin Members section — only the fields
// admin marks "Visible to Member" are included here; status/notes are staff-only
// and intentionally don't exist on this side of the app at all.
//
// Two demo profiles so both program shapes can be previewed in this one
// prototype build: a "rolling" member (Burn Club — today's model, unchanged)
// and a "structured" member (Fit & Functional — a fixed day-by-day schedule
// projected from their own startDate). Switchable from the login screen.
// scheduleType/programId/startDate only matter for structured members;
// rolling members ignore them.
function daysAgoDateKey(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

const MEMBER_PROFILES = [
  {
    id: "chris-v",
    name: "Chris",
    email: "chris.v@example.com",
    program: "Burn Club",
    programId: "burn-club",
    scheduleType: "rolling",
    memberSince: "Jan 2025",
    badge: "Founding Member",
    pointAdjustment: 0, // manual nudge from staff, on top of auto-calculated challenge points
  },
  {
    id: "jordan-p",
    name: "Jordan",
    email: "jordan.p@example.com",
    program: "Fit & Functional",
    programId: "fit-functional",
    scheduleType: "structured",
    startDate: daysAgoDateKey(10), // 10 days in — demo has both past and upcoming days to show
    // What they bought: "home", "gym", or "both" (the combo package). Combo
    // members see each scheduled day twice — once per variant — and pick
    // whichever suits where they are (2026-08-14, matching how members are
    // used to choosing today).
    access: "both",
    memberSince: "Jun 2025",
    badge: "",
    pointAdjustment: 0,
  },
];

let CURRENT_MEMBER = MEMBER_PROFILES[0];

// ---------------- Challenges ----------------
// Point-based, threshold challenge — matches the admin's CHALLENGES entry for
// Burn Club. Your own points are calculated for real from COMPLETIONS (see
// challengePointsForMember() in app.js); the rest of the leaderboard is
// seeded, same limitation as the rest of this prototype's community data.
const CHALLENGES = [
  {
    id: "summer-sweat-2026",
    name: "Summer Sweat Challenge",
    // Bumped to bracket today (2026-08-11) so it shows as active for this
    // demo pass — was 07-01/07-31, which had already lapsed. Same
    // pinned-date limitation as the rest of this seed data (see project
    // memory: DAILY_STATS/CHALLENGES aren't relative-to-today generators
    // like COMPLETIONS is) — will need bumping again later.
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
  },
];

// Teams for the current challenge, bridged over from the admin the same way
// workouts are (2026-08-24). Seeded so the demo has something to show; the
// live copy replaces it when the coach draws. Same same-browser limitation as
// every other bridge here.
// Benchmarks belong to a program and reach the member app the same way
// circuits do (2026-09-05).
const LIVE_BENCHMARKS_KEY = "burnClubProgramBenchmarks";

const LIVE_TEAMS_KEY = "burnClubLiveChallengeTeams";
// Named separately from the individual challenge, and bridged from admin
// alongside the teams themselves.
let TEAM_CHALLENGE_NAME = "August Showdown";

let CHALLENGE_TEAMS = [
  { id: "t-red", name: "Red", color: "#E0685E", memberIds: ["priya-k", "marcus-t"], memberNames: ["Priya K.", "Marcus T."] },
  { id: "t-blue", name: "Blue", color: "#788CE3", memberIds: ["jamie-r", "alicia-b"], memberNames: ["Jamie R.", "Alicia B."] },
  { id: "t-green", name: "Green", color: "#13673F", memberIds: ["chris-v"], memberNames: ["Chris V."] },
  { id: "t-gold", name: "Gold", color: "#E6B400", memberIds: ["jordan-p"], memberNames: ["Jordan P."] },
];

// Seeded team totals, same honesty caveat as CHALLENGE_LEADERBOARD: only the
// current member's own points are real. A team's score is its members' points
// added up, so a real backend would compute all of them.
const SEEDED_TEAM_POINTS = { "priya-k": 205, "marcus-t": 150, "jamie-r": 110, "alicia-b": 40, "chris-v": 0, "jordan-p": 0 };

const CHALLENGE_LEADERBOARD = [
  { name: "Priya K.", points: 205 },
  { name: "Marcus T.", points: 150 },
  { name: "Jamie R.", points: 110 },
  { name: "Alicia B.", points: 40 },
];

// Conversation ids are derived (dm-<memberId>, group-<programId>) to match the
// admin/staff apps' convention exactly — see memberConversations() in app.js,
// which recomputes this per CURRENT_MEMBER (it used to be a fixed "dm-staff",
// which meant a member's replies could never land in the same thread admin/
// staff saw them in). Seed messages below use "dm-chris-v" for the same reason.
const MESSAGES = [
  { id: "msg-1", conversationId: "dm-chris-v", senderId: "staff", senderName: "Staff", isStaff: true, text: "Hey Chris! Welcome to Burn Club — let us know if you need anything.", time: "Mon 9:02 AM", read: true },
  { id: "msg-2", conversationId: "dm-chris-v", senderId: "chris-v", senderName: "Chris", isStaff: false, text: "Thanks! Quick question — is Sweat & Sculpt okay to do two days in a row?", time: "Mon 6:47 PM", read: true },
  { id: "msg-3", conversationId: "dm-chris-v", senderId: "staff", senderName: "Staff", isStaff: true, text: "Totally fine, just listen to your body on the cardio finisher. Swap in extra rest if you need it.", time: "Mon 7:15 PM", read: false },
  { id: "msg-4", conversationId: "group-burn-club", senderId: "staff", senderName: "Staff", isStaff: true, text: "New circuits are up for the week — 3 fresh ones plus a new stretch session! 🔥", time: "Sun 8:00 AM", read: true },
  { id: "msg-5", conversationId: "group-burn-club", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Sweat & Sculpt kicked my butt today 😅", time: "Sun 5:30 PM", read: true },
  { id: "msg-6", conversationId: "group-burn-club", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same! Worth it though", time: "Sun 5:41 PM", read: false },
  // Team chats. Hand-duplicated from admin/data.js like every other shared
  // shape, ids included — the live-message bridge dedupes on id, so the two
  // copies have to agree or a bridged message would arrive as a second row.
  { id: "msg-team-red-1", conversationId: "group-team-t-red", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Red is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-red-2", conversationId: "group-team-t-red", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Let's go! I'm in for a double this week.", time: "Sat 10:12 AM", read: true },
  { id: "msg-team-red-3", conversationId: "group-team-t-red", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same here. What's everyone doing Monday?", time: "Sat 11:40 AM", read: false },
  { id: "msg-team-blue-1", conversationId: "group-team-t-blue", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Blue is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-blue-2", conversationId: "group-team-t-blue", senderId: "jamie-r", senderName: "Jamie R.", isStaff: false, text: "First team challenge for me — what counts for points again?", time: "Sat 2:05 PM", read: false },
  { id: "msg-team-green-1", conversationId: "group-team-t-green", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Green is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
  { id: "msg-team-gold-1", conversationId: "group-team-t-gold", senderId: "staff", senderName: "Staff", isStaff: true, text: "Team Gold is set — say hi and get after it. 🔥", time: "Sat 9:00 AM", read: true },
];

// Messages sent live (from here, admin, or staff) get bridged the same way
// workouts are above — see broadcastMessage() in app.js.
const LIVE_MESSAGES_KEY = "burnClubLiveMessages";
try {
  JSON.parse(localStorage.getItem(LIVE_MESSAGES_KEY) || "[]").forEach((m) => {
    const idx = MESSAGES.findIndex((x) => x.id === m.id);
    if (idx === -1) MESSAGES.push(m);
    else MESSAGES[idx] = m;
  });
} catch (e) {}

// Member-submitted Health Profile (height/weight/activity level/etc, see
// the Profile tab's "My Health Profile" screen) — bridged to admin the same
// way, keyed by member id so admin's member modal can read it read-only
// (2026-08-12, Chris: "make these all tie back to the back end system").
const LIVE_HEALTH_PROFILES_KEY = "burnClubHealthProfiles";

// ---------------- Completion history ----------------
// Prototype-only: this seed is generated relative to *today* (not fixed
// dates) so the Progress tab's Week/Month/Year views always have history to
// show, no matter when this file is opened. Real completions get appended
// at runtime by Player.finish() in app.js and persisted to localStorage —
// see loadCompletions() there. This function only fills the gap on first
// run in a fresh browser.

// Local calendar-day key (YYYY-MM-DD) — deliberately not toISOString(),
// which converts to UTC and rolls "today" over to tomorrow's date in the
// evening for any timezone behind UTC.
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Rough calorie estimate for a completed workout — not a real formula (no
// weight/HR-zone data), just enough to make wearable-sourced fields feel
// plausible: ~7-11 cal/minute, in line with moderate-to-vigorous circuit training.
function estimateCalories(minutes) {
  return Math.round(minutes * (7 + Math.random() * 4));
}

function estimateHeartRate() {
  return 120 + Math.floor(Math.random() * 40); // 120-160 bpm average
}

// Fake historical RPE (Rate of Perceived Exertion, 1-10) for seeded past
// completions — real completions get their RPE from the member's own slider.
function estimateRpe() {
  return 4 + Math.floor(Math.random() * 5); // 4-8, a plausible "moderate to hard" spread
}

// ---------------- Seeded lifting history (2026-08-19) ----------------
// Completions have carried a `weights` map since weight tracking landed, but
// the seeded history predates it, so a fresh browser had no lifting history to
// derive personal bests from. This fabricates one: a handful of tracked lifts
// with slow progressive overload, a plateau, and the occasional backoff week —
// so the PR list shows a real shape rather than one number per lift. Real
// entries come from what the member types during a workout.
const SEED_LIFTS = [
  { name: "Barbell Bench Press", base: 135, gainPerWeek: 2.5 },
  { name: "Barbell Back Squat", base: 185, gainPerWeek: 3.5 },
  { name: "Barbell Deadlift", base: 205, gainPerWeek: 4 },
  { name: "Overhead Press", base: 75, gainPerWeek: 1.5 },
  { name: "Dumbbell Rows", base: 45, gainPerWeek: 1 },
];

// Weights land on roughly half of sessions — nobody barbells every day — and
// are rounded to 5lb plates, which is what a real log looks like.
function seedWeightsForDay(daysAgo) {
  const weeksAgo = daysAgo / 7;
  const out = {};
  SEED_LIFTS.forEach((lift, i) => {
    // Each lift on its own cadence. None of these periods is 7 or a multiple
    // of it on purpose: a 7-day cadence lands on the same weekday every time,
    // and the loop below skips Sundays as rest days — so a lift on a 7-day
    // period whose offset happens to fall on Sunday never gets logged at all.
    // That is exactly what happened to the squat.
    const period = [5, 6, 8, 9, 11][i];
    if ((daysAgo + i * 2) % period !== 0) return;
    // A long plateau around three months back, so the history isn't a
    // straight line and "best" doesn't simply mean "most recent".
    const plateau = weeksAgo > 10 && weeksAgo < 16 ? -lift.gainPerWeek * 2 : 0;
    const drift = lift.base + Math.max(0, (52 - weeksAgo)) * lift.gainPerWeek / 4 + plateau;
    const jitter = ((daysAgo * 7 + i * 13) % 3) * 5;
    out[lift.name] = Math.max(lift.base, Math.round((drift - jitter) / 5) * 5);
  });
  return Object.keys(out).length ? out : null;
}

function buildSeedCompletions() {
  const pool = CIRCUITS.map((c) => ({
    workoutId: c.id,
    title: c.title,
    category: c.category,
    minutes: parseInt(c.meta, 10) || 20,
  }));
  const weekly = pool.filter((p) => p.category === "circuit");
  const stretch = pool.find((p) => p.category === "stretch");
  const coreBurn = pool.find((p) => p.category === "core-burn");

  const completions = [];
  const today = new Date();
  for (let daysAgo = 400; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    if (date.getDay() === 0) continue; // Sunday is a rest day
    const chance = date.getDay() === 3 ? 0.5 : 0.72;
    if (Math.random() >= chance) continue;
    const pick = Math.random() < 0.3
      ? (Math.random() < 0.5 ? stretch : coreBurn)
      : weekly[Math.floor(Math.random() * weekly.length)];
    completions.push({
      id: `seed-${daysAgo}`,
      workoutId: pick.workoutId,
      title: pick.title,
      category: pick.category,
      date: dateKey(date),
      minutes: pick.minutes,
      caloriesBurned: estimateCalories(pick.minutes),
      avgHeartRate: estimateHeartRate(),
      rpe: estimateRpe(),
      weights: seedWeightsForDay(daysAgo),
    });
  }

  // Guarantee a live current streak so the demo always has one to show.
  for (let i = 0; i <= 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const iso = dateKey(date);
    if (!completions.some((c) => c.date === iso)) {
      const pick = weekly[i % weekly.length];
      completions.push({ id: `streak-${i}`, workoutId: pick.workoutId, title: pick.title, category: pick.category, date: iso, minutes: pick.minutes, caloriesBurned: estimateCalories(pick.minutes), avgHeartRate: estimateHeartRate(), rpe: estimateRpe() });
    }
  }

  return completions.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// A structured member's history has to come from their own schedule, not the
// Burn Club circuit/stretch/core-burn pool above — those are a different
// program's workouts entirely (2026-08-13). Walks their schedule from day 1
// up to today, completing most workout days so there's real history to show
// without making them look perfect.
function buildSeedCompletionsForStructured(member) {
  const template = SCHEDULE_TEMPLATES[member.programId] || [];
  const today = new Date();
  const todayProgramDay = daysBetween(member.startDate, dateKey(today)) + 1;
  const completions = [];

  template.forEach((item) => {
    if (item.type !== "workout" || item.day >= todayProgramDay) return;
    // Sessions exist once per variant; seed history picks whichever one the
    // member "did" that day, favouring the variant they bought.
    const variants = CIRCUITS.filter((c) => c.slotId === item.workoutId);
    const access = member.access || "both";
    const pickable = access === "both" ? variants : variants.filter((c) => c.variant === access);
    const circuit = pickable.length
      ? pickable[Math.floor(Math.random() * pickable.length)]
      : CIRCUITS.find((c) => c.id === item.workoutId);
    if (!circuit) return;
    if (Math.random() >= 0.8) return; // a few genuinely missed days

    const date = new Date(today);
    date.setDate(date.getDate() - (todayProgramDay - item.day));
    const minutes = parseInt(circuit.meta, 10) || 25;
    completions.push({
      id: `seed-ff-${item.day}`,
      workoutId: circuit.id,
      slotId: circuit.slotId || null,
      title: circuit.title,
      category: circuit.category || "circuit",
      date: dateKey(date),
      minutes,
      caloriesBurned: estimateCalories(minutes),
      avgHeartRate: estimateHeartRate(),
      rpe: estimateRpe(),
      weights: seedWeightsForDay(todayProgramDay - item.day),
    });
  });

  return completions.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Which seed a member gets depends on their program shape. Library-only
// members ("Build Your Own") start empty on purpose — their history should
// only ever contain workouts they built themselves.
function buildSeedCompletionsForMember(member) {
  if (member.scheduleType === "structured") return buildSeedCompletionsForStructured(member);
  if (member.scheduleType === "library") return [];
  return buildSeedCompletions();
}

// ---------------- Benchmarks ----------------
// Benchmark A/B/C are retest circuits programmed into "This Week's
// Workouts" every few months, same as any other workout — the only
// difference is scores get tracked as a long-running history (per
// benchmark, not per week) so a member can see improvement over time.
// scoreType: "rounds" (AMRAP-style — how many rounds in a fixed time,
// higher is better) or "time" (for-time — finish a fixed amount of work as
// fast as possible, lower is better, stored in seconds).
// The member's own program's benchmarks, set in Admin on the program itself.
// Seeded so the demo has something before anything is bridged; a real member's
// list arrives with their program.
const BENCHMARKS_SEED = [
  { id: "benchmark-a", name: "Benchmark A", subtitle: "The Gauntlet — 12-Minute AMRAP", scoreType: "rounds" },
  { id: "benchmark-b", name: "Benchmark B", subtitle: "Sprint 500 — For Time", scoreType: "time" },
  { id: "benchmark-c", name: "Benchmark C", subtitle: "Endurance Test — 15-Minute AMRAP", scoreType: "rounds" },
];

let BENCHMARKS = [...BENCHMARKS_SEED];

function loadProgramBenchmarks() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIVE_BENCHMARKS_KEY) || "null");
    if (!Array.isArray(stored)) return;
    const mine = stored.find((entry) => entry.programId === CURRENT_MEMBER.programId);
    // Only replaced on a real match. A member whose program genuinely has no
    // benchmarks should see none, but a bridge that was never written
    // shouldn't wipe the seeded demo list.
    if (mine && Array.isArray(mine.benchmarks)) BENCHMARKS = mine.benchmarks;
  } catch (e) {
    // Keep the seed rather than blanking the section.
  }
}

// Filler result history so the Progress tab's Benchmarks section has
// something to show before the real post-workout score prompt exists (not
// built yet — this is UI/UX first, per Chris). Generated relative to today
// so it never looks stale. Real results will append to this same shape.
function buildSeedBenchmarkResults() {
  const today = new Date();
  const monthsAgo = (n) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - n);
    return dateKey(d);
  };
  return [
    { id: "br-a1", benchmarkId: "benchmark-a", date: monthsAgo(5), score: 6 },
    { id: "br-a2", benchmarkId: "benchmark-a", date: monthsAgo(1), score: 8 },
    { id: "br-b1", benchmarkId: "benchmark-b", date: monthsAgo(5), score: 250 },
    { id: "br-b2", benchmarkId: "benchmark-b", date: monthsAgo(1), score: 237.5 },
    { id: "br-c1", benchmarkId: "benchmark-c", date: monthsAgo(4), score: 5 },
    { id: "br-c2", benchmarkId: "benchmark-c", date: monthsAgo(1), score: 7 },
  ];
}

// Seed only — the live array is loaded per member from localStorage in
// app.js (loadBenchmarkResults), the same way COMPLETIONS is. It was a plain
// const built fresh on every load until 2026-08-17, which meant a member
// could set a personal best, watch Progress update, and lose it the moment
// they closed the app.
let BENCHMARK_RESULTS = buildSeedBenchmarkResults();

// ---------------- Wearable (faked — no real Apple/Garmin integration yet) ----------------
// See project memory: HealthKit has no web API (native-only), Garmin needs a
// real backend — both out of scope for this prototype. This fakes what the
// data would look like once either is actually wired up, so the UI/placement
// can be validated first. Only one provider can be "connected" at a time.
const WEARABLE_DEFAULT = { provider: "apple" }; // "apple" | "garmin" | null

// Whole-day steps/calories/resting HR, independent of workout completions (a
// rest day still has steps). Generated relative to today, like
// buildSeedCompletions. Resting HR added 2026-08-09 as a third Home stat.
function buildSeedDailyStats() {
  const stats = [];
  const today = new Date();
  for (let daysAgo = 400; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    stats.push({
      date: dateKey(date),
      steps: 4000 + Math.floor(Math.random() * 7000),
      calories: 1800 + Math.floor(Math.random() * 700),
      restingHR: 54 + Math.floor(Math.random() * 16),
    });
  }
  return stats;
}

// ---------------- Daily Check-Ins (2026-08-19) ----------------
// The journal's spine: two 1-10 scores plus an optional note, at most one per
// day. Scores are the point — they're comparable, so they can be trended and
// joined against training days; the note rides along for the things a number
// can't hold.
//
// Seeded relative to today so the history view has something to read on a
// fresh browser. Deliberately not random noise: the scores drift, dip midweek
// and recover, so the correlations on the Progress tab show something a real
// member's data plausibly would. Real entries come from the member.
const CHECKIN_NOTES = [
  "Slept badly, still got it done.",
  "Legs felt heavy from the start.",
  "Best I've felt in weeks.",
  "Work stress is showing up in the gym.",
  "Shoulder twinge on presses — went lighter.",
  "Rest day. Needed it.",
  "Energy back up after two easy days.",
];

function buildSeedCheckins() {
  const out = [];
  const today = new Date();
  for (let daysAgo = 23; daysAgo >= 1; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    // A slow upward drift with a weekly dip, so the read-back shows a shape
    // rather than static.
    const wave = Math.sin((daysAgo / 7) * Math.PI * 2);
    const mental = Math.max(1, Math.min(10, Math.round(6.6 - wave * 1.5 + (daysAgo < 10 ? 0.6 : 0))));
    const physical = Math.max(1, Math.min(10, Math.round(6.2 - wave * 1.8 + (daysAgo < 10 ? 0.5 : 0))));
    // Most days carry no note — that's realistic, and it keeps the list from
    // reading like a wall of text.
    const note = daysAgo % 5 === 0 ? CHECKIN_NOTES[daysAgo % CHECKIN_NOTES.length] : "";
    // Sleep tracks the same wave, loosely — enough that the chart shows a
    // relationship without it looking manufactured. The oldest week predates
    // sleep tracking and carries none, which is the case the read-back has to
    // handle for real members too.
    const tracked = daysAgo <= 16;
    const sleepHours = tracked ? Math.round((6.9 - wave * 1.1) * 2) / 2 : null;
    const sleepQuality = tracked
      ? (sleepHours >= 8 ? "great" : sleepHours >= 7 ? "good" : sleepHours >= 6 ? "ok" : "bad")
      : null;
    out.push({ date: dateKey(date), mental, physical, sleepHours, sleepQuality, note, sharedAt: null });
  }
  return out;
}

// ---------------- Daily Habits ----------------
// A curated menu (Chris's call, over fully-freeform) so habits stay
// consistent across clients, plus "Other" as a custom escape hatch.
// "10,000 Steps" is the only auto-tracked one — it checks itself off once
// today's wearable step count (DAILY_STATS) clears its target; everything
// else is a manual daily checkbox.
// Set in Admin -> Settings -> Habit Library. "Other (custom)" is appended
// here rather than stored, so the escape hatch can't be edited away.
const HABIT_PRESETS = [
  ...APP_SETTINGS.habitPresets,
  { id: "custom", label: "Other (custom)", custom: true },
];

// Up to 3, member-chosen. What a member starts with before they choose is set
// in Admin -> Settings -> Default Habits — it used to be this literal, which
// meant the starting habits for every imported member were a code edit.
const MY_HABITS_DEFAULT = APP_SETTINGS.habits;
