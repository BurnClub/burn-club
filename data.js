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
const BODY_PART_TAGS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Abs", "Glutes", "Quads", "Hamstrings", "Calves", "Full Body"];
const EQUIPMENT_TAGS = ["Bodyweight", "Dumbbells", "Kettlebell", "Barbell", "Resistance Band", "Bench", "Box/Step", "Battle Ropes", "Pull-up Bar"];

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
  // Gym-only movements (2026-08-14) — the library was entirely bodyweight and
  // dumbbell work, so a "gym" program variant had nothing to differ with.
  { id: "barbell-bench-press", name: "Barbell Bench Press", bodyParts: ["Chest", "Triceps"], modality: "Strength", equipment: ["Barbell", "Bench"], technique: "Lower the bar to mid-chest with elbows tucked around 45 degrees, then press back up without bouncing.", trackWeight: true, videoUrl: "" },
  { id: "barbell-back-squat", name: "Barbell Back Squat", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Barbell"], technique: "Bar racked across the upper back. Sit down between the hips, knees tracking over the toes, then drive up through mid-foot.", trackWeight: true, videoUrl: "" },
  { id: "barbell-deadlift", name: "Barbell Deadlift", bodyParts: ["Hamstrings", "Back"], modality: "Strength", equipment: ["Barbell"], technique: "Hinge with a flat back and the bar against the shins. Push the floor away rather than pulling with the arms.", trackWeight: true, videoUrl: "" },
  { id: "lat-pulldown", name: "Lat Pulldown", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Pull-up Bar"], technique: "Pull the bar to the collarbone leading with the elbows, then control it all the way back up.", trackWeight: true, videoUrl: "" },
  { id: "leg-press", name: "Leg Press", bodyParts: ["Quads", "Glutes"], modality: "Strength", equipment: ["Box/Step"], technique: "Feet shoulder-width on the platform. Lower until the knees reach about 90 degrees, then press without locking out hard.", trackWeight: true, videoUrl: "" },
  { id: "cable-row", name: "Cable Row", bodyParts: ["Back", "Biceps"], modality: "Strength", equipment: ["Resistance Band"], technique: "Sit tall and row the handle to the stomach, squeezing the shoulder blades together at the end.", trackWeight: true, videoUrl: "" },
  { id: "overhead-press", name: "Overhead Press", bodyParts: ["Shoulders", "Triceps"], modality: "Strength", equipment: ["Barbell"], technique: "Press the bar straight overhead from the collarbone, moving the head back slightly to let it pass.", trackWeight: true, videoUrl: "" },
  { id: "rowing-machine", name: "Rowing Machine", bodyParts: ["Full Body"], modality: "Cardio", equipment: ["Battle Ropes"], technique: "Drive with the legs first, then lean back and pull the handle to the ribs. Reverse that order on the recovery.", trackWeight: false, videoUrl: "" },
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
  benchmarks: [
    { id: "benchmark-a", name: "Benchmark A", subtitle: "The Gauntlet — 12-Minute AMRAP", scoreType: "rounds" },
    { id: "benchmark-b", name: "Benchmark B", subtitle: "Sprint 500 — For Time", scoreType: "time" },
    { id: "benchmark-c", name: "Benchmark C", subtitle: "Endurance Test — 15-Minute AMRAP", scoreType: "rounds" },
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
    ],
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
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
  },
];

// Teams for the current challenge, bridged over from the admin the same way
// workouts are (2026-08-24). Seeded so the demo has something to show; the
// live copy replaces it when the coach draws. Same same-browser limitation as
// every other bridge here.
const LIVE_TEAMS_KEY = "burnClubLiveChallengeTeams";
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
// Set in Admin -> Settings -> Benchmarks.
const BENCHMARKS = APP_SETTINGS.benchmarks;

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
    out.push({ date: dateKey(date), mental, physical, note, sharedAt: null });
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
