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
const BODY_PART_TAGS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Abs", "Glutes", "Quads", "Hamstrings", "Calves", "Full Body"];
const MODALITY_TAGS = ["Strength", "Cardio", "Stretch"];
const EQUIPMENT_TAGS = ["Bodyweight", "Dumbbells", "Kettlebell", "Barbell", "Resistance Band", "Bench", "Box/Step", "Battle Ropes", "Pull-up Bar"];

// Master exercise list — circuits are built by picking from this list rather than
// free-typing names, so naming stays consistent across circuits/programs.
// videoUrl is intentionally blank across the board — the field exists but actual
// video isn't being built out yet.
const EXERCISE_LIBRARY = [
  { id: "jump-squats", name: "Jump Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "Squat down, then explode upward into a jump, landing softly with bent knees to absorb impact.", trackWeight: false, videoUrl: "" },
  { id: "push-ups", name: "Push-Ups", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Bodyweight"], technique: "Hands under shoulders, body in a straight line from head to heels. Lower chest to the floor, then press back up.", trackWeight: false, videoUrl: "" },
  { id: "mountain-climbers", name: "Mountain Climbers", bodyParts: ["Abs"], modality: "Cardio", equipment: ["Bodyweight"], technique: "From a high plank, drive knees toward the chest one at a time at a quick, controlled pace. Keep hips level.", trackWeight: false, videoUrl: "" },
  { id: "plank-hold", name: "Plank Hold", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Forearms and toes on the floor, body in a straight line. Brace the core and avoid letting the hips sag or pike.", trackWeight: false, videoUrl: "" },
  { id: "burpees", name: "Burpees", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Drop into a squat, kick back to a plank, do a push-up, jump the feet back in, then explode up into a jump.", trackWeight: false, videoUrl: "" },
  { id: "kettlebell-swings", name: "Kettlebell Swings", bodyParts: ["Glutes", "Hamstrings"], modality: "Strength", equipment: ["Kettlebell"], technique: "Hinge at the hips (not a squat) and swing the kettlebell to chest height using hip drive, not the arms.", trackWeight: true, videoUrl: "" },
  { id: "walking-lunges", name: "Walking Lunges", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Bodyweight"], technique: "Step forward into a lunge, back knee toward the floor, then drive up and step through into the next lunge.", trackWeight: false, videoUrl: "" },
  { id: "weighted-situps", name: "Weighted Sit-Ups", bodyParts: ["Abs"], modality: "Strength", equipment: ["Dumbbells"], technique: "Hold a light dumbbell at the chest, feet anchored, and curl the torso all the way up to a seated position.", trackWeight: true, videoUrl: "" },
  { id: "russian-twists", name: "Russian Twists", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Sit with knees bent and torso leaned back slightly. Rotate side to side, tapping the floor by each hip.", trackWeight: false, videoUrl: "" },
  { id: "box-jumps", name: "Box Jumps", bodyParts: ["Quads", "Glutes"], modality: "Cardio", equipment: ["Box/Step"], technique: "Swing the arms and jump onto the box, landing softly with both feet. Step back down — don't jump down.", trackWeight: false, videoUrl: "" },
  { id: "push-press", name: "Push Press", bodyParts: ["Shoulders", "Triceps"], modality: "Strength", equipment: ["Dumbbells"], technique: "Dip slightly at the knees, then drive the dumbbells overhead using leg drive plus a shoulder press.", trackWeight: true, videoUrl: "" },
  { id: "goblet-squats", name: "Goblet Squats", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Kettlebell"], technique: "Hold a kettlebell at chest height and squat down between the knees, keeping the chest tall.", trackWeight: true, videoUrl: "" },
  { id: "squat-jumps", name: "Squat Jumps", bodyParts: ["Quads", "Glutes"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Squat down then jump straight up as high as comfortable, landing softly back into the squat.", trackWeight: false, videoUrl: "" },
  { id: "renegade-rows", name: "Renegade Rows", bodyParts: ["Back", "Abs"], modality: "Strength", equipment: ["Dumbbells"], technique: "From a plank on two dumbbells, row one dumbbell to the hip while bracing the core to resist rotation.", trackWeight: true, videoUrl: "" },
  { id: "battle-ropes", name: "Battle Ropes", bodyParts: ["Shoulders"], modality: "Cardio", equipment: ["Battle Ropes"], technique: "Alternate slamming the ropes up and down as fast as possible while staying in a low athletic stance.", trackWeight: false, videoUrl: "" },
  { id: "high-knees", name: "High Knees", bodyParts: ["Quads"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Run in place, driving the knees up toward hip height as quickly as possible.", trackWeight: false, videoUrl: "" },
  { id: "dumbbell-rows", name: "Dumbbell Rows", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Dumbbells", "Bench"], technique: "Hinge forward with a flat back and row the dumbbell to the hip, squeezing the shoulder blade at the top.", trackWeight: true, videoUrl: "" },
  { id: "sprint-intervals", name: "Sprint Intervals", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Bodyweight"], technique: "Sprint at maximum effort for the interval, then walk or rest to recover before the next round.", trackWeight: false, videoUrl: "" },
  { id: "bicycle-crunches", name: "Bicycle Crunches", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Lying on the back, bring opposite elbow to opposite knee in a pedaling motion, keeping the lower back down.", trackWeight: false, videoUrl: "" },
  { id: "leg-raises", name: "Leg Raises", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Lying flat, keep legs straight and lower back pressed down while raising the legs to vertical and back down.", trackWeight: false, videoUrl: "" },
  { id: "side-plank", name: "Side Plank", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Stack the feet and prop up on one forearm, lifting the hips so the body forms a straight line.", trackWeight: false, videoUrl: "" },
  { id: "dead-bug", name: "Dead Bug", bodyParts: ["Abs"], modality: "Strength", equipment: ["Bodyweight"], technique: "Lying on the back with arms and knees up, slowly extend opposite arm and leg while keeping the low back flat.", trackWeight: false, videoUrl: "" },
  // Gym-only movements (2026-08-14) — mirrors the member app's library.
  { id: "barbell-bench-press", name: "Barbell Bench Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Barbell", "Bench"], technique: "Lower the bar to mid-chest with elbows tucked around 45 degrees, then press back up without bouncing.", trackWeight: true, videoUrl: "" },
  { id: "barbell-back-squat", name: "Barbell Back Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "Bar racked across the upper back. Sit down between the hips, knees tracking over the toes, then drive up through mid-foot.", trackWeight: true, videoUrl: "" },
  { id: "barbell-deadlift", name: "Barbell Deadlift", bodyParts: ["Hamstrings", "Back"], modality: "Strength", equipment: ["Barbell"], technique: "Hinge with a flat back and the bar against the shins. Push the floor away rather than pulling with the arms.", trackWeight: true, videoUrl: "" },
  { id: "lat-pulldown", name: "Lat Pulldown", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Pull-up Bar"], technique: "Pull the bar to the collarbone leading with the elbows, then control it all the way back up.", trackWeight: true, videoUrl: "" },
  { id: "leg-press", name: "Leg Press", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box/Step"], technique: "Feet shoulder-width on the platform. Lower until the knees reach about 90 degrees, then press without locking out hard.", trackWeight: true, videoUrl: "" },
  { id: "cable-row", name: "Cable Row", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Resistance Band"], technique: "Sit tall and row the handle to the stomach, squeezing the shoulder blades together at the end.", trackWeight: true, videoUrl: "" },
  { id: "overhead-press", name: "Overhead Press", bodyParts: ["Shoulders", "Triceps"], modality: "Strength", equipment: ["Barbell"], technique: "Press the bar straight overhead from the collarbone, moving the head back slightly to let it pass.", trackWeight: true, videoUrl: "" },
  { id: "rowing-machine", name: "Rowing Machine", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Battle Ropes"], technique: "Drive with the legs first, then lean back and pull the handle to the ribs. Reverse that order on the recovery.", trackWeight: false, videoUrl: "" },
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
// Fixed retest slots (A/B/C) a workout can be tagged as when it's created —
// matches the member app's BENCHMARKS exactly (name, format, scoreType),
// since a benchmark's identity/scoring format doesn't change between
// programmings, only the specific exercises inside it might.
const BENCHMARKS = [
  { id: "benchmark-a", name: "Benchmark A", subtitle: "The Gauntlet — 12-Minute AMRAP", scoreType: "rounds" },
  { id: "benchmark-b", name: "Benchmark B", subtitle: "Sprint 500 — For Time", scoreType: "time" },
  { id: "benchmark-c", name: "Benchmark C", subtitle: "Endurance Test — 15-Minute AMRAP", scoreType: "rounds" },
];

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
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
    // "individual" or "teams" (2026-08-26). Teams used to be something you
    // could bolt onto any challenge from the detail page; now it's what kind
    // of challenge this is, chosen when it's created.
    format: "teams",
    teamCount: 4,
    teams: [
      { id: "t-red", name: "Red", color: "#E0685E", memberIds: ["priya-k", "marcus-t"] },
      { id: "t-blue", name: "Blue", color: "#788CE3", memberIds: ["jamie-r", "alicia-b"] },
      { id: "t-green", name: "Green", color: "#13673F", memberIds: ["chris-v"] },
      { id: "t-gold", name: "Gold", color: "#E6B400", memberIds: ["jordan-p"] },
    ],
  },
];

// Colour comes from the palette by position and is stored on the team, not
// derived from its name (2026-08-24) — names are Chris's to edit, so keying
// colour off them would have a rename silently change a team's colour.
const TEAM_PALETTE = ["#E0685E", "#788CE3", "#13673F", "#E6B400", "#A78BFA", "#F0A6CA", "#37FF8B", "#5C7A99"];
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
