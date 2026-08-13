// Sample data for the Burn Club admin prototype — placeholder content only, in-memory.

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
];

// scheduleType distinguishes two genuinely different program shapes:
// "rolling" (Burn Club, Strength Foundations) — an ongoing weekly rotation,
// browsed freely, no fixed start/end date. "structured" (Fit & Functional) —
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
    id: "strength-foundations",
    name: "Strength Foundations",
    color: "deepblue",
    status: "draft",
    scheduleType: "rolling",
    memberCount: 0,
    circuitsPerWeek: 2,
    description: "A slower-paced strength-building program, in planning for a future launch.",
  },
  {
    id: "fit-functional",
    name: "Fit & Functional Home",
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

// Folders organize circuits into a browsable library. A folder can be tied to a
// specific program (for filtering in the library), or left general (program: null)
// as a staging area for circuits that aren't assigned yet.
//
// A folder marked `live: true` is one of a program's three permanent, un-deletable
// folders ("This Week's Workouts" / "Stretch & Core Library" / "Previous Week") —
// a circuit only counts as actually published to that program once it's copied
// into one of these, not just because it sits in a program-tagged library folder.
// "Previous Week" holds last week's workouts for one extra week in case a member
// wants to catch up — staff move content into it manually (Move to Folder) right
// before copying in the new week's, same workflow as the other two.
// Everything else (the "Week of..." folders) is just the library workspace for
// building content.
const FOLDERS = [
  { id: "week-jul-20", name: "Week of Jul 20", program: "burn-club" },
  { id: "week-jul-27", name: "Week of Jul 27", program: "burn-club" },
  { id: "foundations-drafts", name: "Foundations Drafts", program: "strength-foundations" },
  { id: "stretch-core-library", name: "Stretch & Core Library", program: "burn-club" },
  { id: "working-folder", name: "Working Folder", program: null },
  { id: "burn-club-this-week", name: "This Week's Workouts", program: "burn-club", live: true },
  { id: "burn-club-stretch-core", name: "Stretch & Core Library", program: "burn-club", live: true },
  { id: "burn-club-previous-week", name: "Previous Week", program: "burn-club", live: true },
  { id: "strength-foundations-this-week", name: "This Week's Workouts", program: "strength-foundations", live: true },
  { id: "strength-foundations-stretch-core", name: "Stretch & Core Library", program: "strength-foundations", live: true },
  { id: "strength-foundations-previous-week", name: "Previous Week", program: "strength-foundations", live: true },
  // Structured programs don't use the live-folder publish model — these are
  // just library folders (one per program week) holding Fit & Functional's
  // actual workout content, which gets "published" by being slotted into
  // SCHEDULE_TEMPLATES instead. One folder per week rather than one folder
  // for the whole program, since every week's 6 workouts are fully unique.
  ...Array.from({ length: 8 }, (_, i) => ({ id: `ff-home-week-${i + 1}`, name: `F&F Home Week ${i + 1}`, program: "fit-functional" })),
];

// ---------------- Fit & Functional content generator ----------------
// 8 weeks × 6 focus areas = 48 unique workouts, one folder per week. Same 6
// focus-area names every week (per Chris's naming convention — the "Week N"
// prefix is what changes, not the split itself); exercise selection rotates
// and volume progresses week to week so the actual workouts differ, not
// just the label.
const FF_FOCUS_AREAS = [
  { key: "shoulders-abs", label: "Shoulders and Abs", pool: ["Push Press", "Plank Hold", "Bicycle Crunches", "Dead Bug", "Side Plank"] },
  { key: "hamstrings-glutes", label: "Hamstring and Glutes", pool: ["Kettlebell Swings", "Walking Lunges", "Box Jumps", "Goblet Squats"] },
  { key: "back-biceps", label: "Back and Biceps", pool: ["Dumbbell Rows", "Renegade Rows", "Battle Ropes"] },
  { key: "chest-tris", label: "Chest and Tris", pool: ["Push-Ups", "Push Press", "Renegade Rows"] },
  { key: "quads-glutes", label: "Quads and Glutes", pool: ["Goblet Squats", "Squat Jumps", "Walking Lunges", "Jump Squats", "Box Jumps"] },
];
const FF_CIRCUIT_POOL = ["Burpees", "Mountain Climbers", "High Knees", "Battle Ropes", "Sprint Intervals", "Squat Jumps"];

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
      const names = ffPickRotating(area.pool, week, 3);
      circuits.push({
        id: `ff-w${week}-${area.key}`,
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

    const circuitNames = ffPickRotating(FF_CIRCUIT_POOL, week, 4);
    circuits.push({
      id: `ff-w${week}-circuit`,
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
  }
  return circuits;
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
  superset: "Both exercises are on this one screen — finish all the reps for the first exercise, then move straight into the second with no rest in between. Once you've done both, that's one round; rest, then start the next round from the top.",
  amrap: "AMRAP stands for As Many Rounds As Possible. Complete every exercise below once, in order — that's one round. As soon as you finish the last exercise, go right back to the first one and start the next round. Keep going until the clock hits zero, moving at a strong, steady pace and keeping your form solid. When time's up, log how many full rounds you completed.",
  emom: "EMOM stands for Every Minute On the Minute. At the top of each minute, complete the listed reps for that minute's exercise, then rest with whatever time is left before the next minute starts. Move to the next exercise each time a new minute begins, cycling back to the first once you've gone through them all. The faster you finish your reps, the more rest you bank before the next round.",
  straight: "Straight sets — complete all the reps for one set, then rest before starting the next. Take the full rest between sets; it's there so each set can be as strong as the one before it. Log the weight you used as you go so you have it to build on next time.",
  ladder: "A ladder works through a changing rep count each set instead of the same number every time. Complete the reps shown for the set you're on, rest, then move to the next number in the sequence. Let the weight stay honest to the rep count rather than forcing the same load the whole way through.",
};

// Circuits use the same block schema as the member app:
//   interval, superset, straight, ladder, amrap, emom
const CIRCUITS = [
  {
    id: "full-body-burn",
    folderId: "week-jul-20",
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
    folderId: "week-jul-20",
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
    folderId: "week-jul-20",
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
    folderId: "week-jul-27",
    category: "circuit",
    tag: "New",
    title: "Power Hour",
    focus: "Full Body",
    difficulty: "Advanced",
    desc: "Next week's headline circuit — draft, not yet published to members.",
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
    folderId: "foundations-drafts",
    category: "circuit",
    tag: "Draft",
    title: "Foundations: Week 1",
    focus: "Full Body",
    difficulty: "Beginner",
    desc: "Early draft for the Strength Foundations launch — straight sets to build baseline strength.",
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
    folderId: "stretch-core-library",
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
    folderId: "stretch-core-library",
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
  // The circuits below are copies already living in Burn Club's two permanent
  // "live" folders — demonstrating the promoted state after copying over from
  // the library folders above. Power Hour (still only in "Week of Jul 27") and
  // Foundations: Week 1 are left un-copied, showing content still awaiting promotion.
  {
    id: "full-body-burn-live",
    folderId: "burn-club-this-week",
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
    id: "core-crusher-live",
    folderId: "burn-club-this-week",
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
    id: "sweat-sculpt-live",
    folderId: "burn-club-this-week",
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
    id: "stretch-mobility-live",
    folderId: "burn-club-stretch-core",
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
    id: "ab-burn-10-live",
    folderId: "burn-club-stretch-core",
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
  // Fit & Functional's content — 48 fully unique workouts (6 per week × 8
  // weeks, no repeats), one folder per week. Named on Chris's convention:
  // "Week N [Focus]" — same 6 focus areas every week (the naming doesn't
  // change), but the exercise selection and volume vary week to week so the
  // actual workouts are genuinely different, not just relabeled duplicates.
  ...buildFitFunctionalCircuits(),
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
  { id: "alicia-b", name: "Alicia B.", email: "alicia.b@example.com", program: "burn-club", streak: 4, memberSince: "Apr 2025", badge: "", status: "inactive", notes: "Paused membership — traveling for work through end of month.", challengePoints: 40, pointAdjustment: 0, habits: [] },
];

// ---------------- Challenges ----------------
// Point-based, threshold challenges (not first-past-the-post): any member who
// reaches thresholdPoints qualifies for the reward. programId is either a
// specific program's id or "all" for every program at once.
const CHALLENGES = [
  {
    id: "summer-sweat-2026",
    name: "Summer Sweat Challenge",
    programId: "burn-club",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
  },
];

// ---------------- Messaging ----------------
// Messages sent here (or in the member/staff apps) are bridged live via
// localStorage, same-origin/same-browser only — see broadcastMessage() in
// app.js and the matching LIVE_CIRCUITS_KEY bridge for workouts.

// A DM per member, plus one group chat per program — membership for a
// program's group chat is just every MEMBERS entry with that program.
const CONVERSATIONS = [
  ...MEMBERS.map((m) => ({ id: "dm-" + m.id, type: "dm", memberId: m.id })),
  ...PROGRAMS.map((p) => ({ id: "group-" + p.id, type: "group", programId: p.id, name: p.name + " Group Chat" })),
];

const MESSAGES = [
  { id: "msg-1", conversationId: "dm-chris-v", senderId: "staff", senderName: "Staff", isStaff: true, text: "Hey Chris! Welcome to Burn Club — let us know if you need anything.", time: "Mon 9:02 AM", read: true },
  { id: "msg-2", conversationId: "dm-chris-v", senderId: "chris-v", senderName: "Chris V.", isStaff: false, text: "Thanks! Quick question — is Sweat & Sculpt okay to do two days in a row?", time: "Mon 6:47 PM", read: false },
  { id: "msg-3", conversationId: "dm-priya-k", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Just hit a 10-day streak! 🎉", time: "Today 8:02 AM", read: false },
  { id: "msg-4", conversationId: "group-burn-club", senderId: "staff", senderName: "Staff", isStaff: true, text: "New circuits are up for the week — 3 fresh ones plus a new stretch session! 🔥", time: "Sun 8:00 AM", read: true },
  { id: "msg-5", conversationId: "group-burn-club", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Sweat & Sculpt kicked my butt today 😅", time: "Sun 5:30 PM", read: true },
  { id: "msg-6", conversationId: "group-burn-club", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same! Worth it though", time: "Sun 5:41 PM", read: false },
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
const ACTIVITY_FEED = [
  { id: "a1", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "Core Crusher", time: "4m ago", rpe: 7 },
  { id: "a2", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Sweat & Sculpt", time: "18m ago", rpe: 9 },
  { id: "a3", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "Full Body Burn", time: "31m ago", rpe: 6 },
  { id: "a4", memberId: "chris-v", memberName: "Chris V.", workoutTitle: "Core Crusher", time: "52m ago", rpe: 5 },
  { id: "a5", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Full Body Stretch & Mobility", time: "1h ago", rpe: 3 },
  { id: "a6", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "10-Minute Ab Burn", time: "2h ago", rpe: 6 },
  { id: "a7", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "Sweat & Sculpt", time: "3h ago", rpe: 8 },
  { id: "a8", memberId: "alicia-b", memberName: "Alicia B.", workoutTitle: "Full Body Burn", time: "5h ago", rpe: 7 },
  { id: "a9", memberId: "chris-v", memberName: "Chris V.", workoutTitle: "Full Body Burn", time: "7h ago", rpe: 8 },
  { id: "a10", memberId: "priya-k", memberName: "Priya K.", workoutTitle: "Core Crusher", time: "9h ago", rpe: 4 },
  { id: "a11", memberId: "marcus-t", memberName: "Marcus T.", workoutTitle: "10-Minute Ab Burn", time: "Yesterday", rpe: 5 },
  { id: "a12", memberId: "jamie-r", memberName: "Jamie R.", workoutTitle: "Full Body Burn", time: "Yesterday", rpe: 9 },
];

const ANALYTICS = {
  totalMembers: 214,
  activeThisWeekPct: 68,
  avgCompletionPct: 74,
  avgStreak: 5.2,
  weeklyCompletions: [120, 135, 128, 142, 150, 138, 160, 171],
  topCircuits: [
    { title: "Full Body Burn", completions: 189 },
    { title: "Core Crusher", completions: 162 },
    { title: "Sweat & Sculpt", completions: 141 },
  ],
};
