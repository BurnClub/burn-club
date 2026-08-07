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
];

// ---------------- Fit & Functional content generator ----------------
// Mirrors admin's generator exactly (same ids/titles), adapted to this
// app's circuit schema (meta/color instead of focus/difficulty). Declared
// before CIRCUITS since the array below calls this immediately — a `const`
// declared after would still be in its temporal dead zone at that point.
const FF_FOCUS_AREAS = [
  { key: "shoulders-abs", label: "Shoulders and Abs", pool: ["Push Press", "Plank Hold", "Bicycle Crunches", "Dead Bug", "Side Plank"] },
  { key: "hamstrings-glutes", label: "Hamstring and Glutes", pool: ["Kettlebell Swings", "Walking Lunges", "Box Jumps", "Goblet Squats"] },
  { key: "back-biceps", label: "Back and Biceps", pool: ["Dumbbell Rows", "Renegade Rows", "Battle Ropes"] },
  { key: "chest-tris", label: "Chest and Tris", pool: ["Push-Ups", "Push Press", "Renegade Rows"] },
  { key: "quads-glutes", label: "Quads and Glutes", pool: ["Goblet Squats", "Squat Jumps", "Walking Lunges", "Jump Squats", "Box Jumps"] },
];
const FF_CIRCUIT_POOL = ["Burpees", "Mountain Climbers", "High Knees", "Battle Ropes", "Sprint Intervals", "Squat Jumps"];
const FF_CARD_COLORS = ["blue", "periwinkle", "deepblue", "yellow"];

function ffPickRotating(pool, week, count) {
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(pool[(week - 1 + i) % pool.length]);
  return picks;
}

function buildFitFunctionalCircuits() {
  const circuits = [];
  let colorIndex = 0;
  for (let week = 1; week <= 8; week++) {
    const difficulty = week <= 6 ? "Intermediate" : "Advanced";
    const sets = 3 + Math.floor((week - 1) / 2);

    FF_FOCUS_AREAS.forEach((area) => {
      const names = ffPickRotating(area.pool, week, 3);
      circuits.push({
        id: `ff-w${week}-${area.key}`,
        category: "structured",
        tag: `Week ${week}`,
        title: `Week ${week} ${area.label}`,
        meta: `${20 + sets * 2} min · ${area.label} · ${difficulty}`,
        color: FF_CARD_COLORS[colorIndex++ % FF_CARD_COLORS.length],
        desc: `Week ${week} strength session focused on ${area.label.toLowerCase()}.`,
        blocks: names.map((name) => ({ type: "straight", label: name, exercise: { name }, sets, reps: 10, rest: 45 })),
      });
    });

    const circuitNames = ffPickRotating(FF_CIRCUIT_POOL, week, 4);
    circuits.push({
      id: `ff-w${week}-circuit`,
      category: "structured",
      tag: `Week ${week}`,
      title: `Week ${week} Circuit`,
      meta: `${20 + sets * 2} min · Full Body · ${difficulty}`,
      color: FF_CARD_COLORS[colorIndex++ % FF_CARD_COLORS.length],
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

const CIRCUITS = [
  {
    id: "full-body-burn",
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
        notes: "This is a timed circuit — work through each station for the set time, then take a short rest before moving to the next one. Once you've been through every station, that's one round; after a brief rest, start the next round from the top. Focus on clean, controlled reps within the work window instead of racing to beat the clock.",
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
        notes: "AMRAP stands for As Many Rounds As Possible. Complete every exercise below once, in order — that's one round. As soon as you finish the last exercise, go right back to the first one and start the next round. Keep going until the clock hits zero, moving at a strong, steady pace and keeping your form solid. When time's up, log how many full rounds you completed.",
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
        notes: "EMOM stands for Every Minute On the Minute. At the top of each minute, complete the listed reps for that minute's exercise, then rest with whatever time is left before the next minute starts. Move to the next exercise each time a new minute begins, cycling back to the first once you've gone through them all. The faster you finish your reps, the more rest you bank before the next round.",
        exercises: [
          { name: "Burpees", reps: 8 },
          { name: "Goblet Squats", reps: 12 },
        ],
      },
    ],
  },
  {
    id: "the-gauntlet",
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
        notes: "AMRAP stands for As Many Rounds As Possible. Complete every exercise below once, in order — that's one round. As soon as you finish the last exercise, go right back to the first one and start the next round. Keep going until the clock hits zero, moving at a strong, steady pace and keeping your form solid. When time's up, log how many full rounds you completed.",
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
    category: "previous-week",
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
        notes: "This is a timed circuit — work through each station for the set time, then take a short rest before moving to the next one. Once you've been through every station, that's one round; after a brief rest, start the next round from the top. Focus on clean, controlled reps within the work window instead of racing to beat the clock.",
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
    category: "previous-week",
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
    category: "previous-week",
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

// Workouts the admin app publishes into a program's live folders get bridged in here
// via localStorage — same-origin browser storage is the only thing these otherwise-
// independent static apps actually share (see admin/app.js's syncCircuitToMemberApp).
const LIVE_CIRCUITS_KEY = "burnClubLiveCircuits";
try {
  CIRCUITS.unshift(...JSON.parse(localStorage.getItem(LIVE_CIRCUITS_KEY) || "[]"));
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

const FEED = [
  { name: "Jamie R.", action: "completed Core Crusher", time: "12m ago", emoji: "🔥" },
  { name: "Priya K.", action: "hit a 10-day streak", time: "1h ago", emoji: "🏆" },
  { name: "Marcus T.", action: "completed Full Body Burn", time: "3h ago", emoji: "💪" },
];

const LEADERBOARD = [
  { rank: 1, name: "Priya K.", stat: "10 day streak" },
  { rank: 2, name: "Marcus T.", stat: "8 day streak" },
  { rank: 3, name: "Jamie R.", stat: "6 day streak" },
  { rank: 4, name: "Chris (You)", stat: "5 day streak", me: true },
  { rank: 5, name: "Alicia B.", stat: "4 day streak" },
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
    memberSince: "Jun 2025",
    badge: "",
    pointAdjustment: 0,
  },
  {
    id: "sam-r",
    name: "Sam",
    email: "sam.r@example.com",
    program: "Build Your Own",
    programId: null,
    scheduleType: "library",
    memberSince: "Aug 2025",
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
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    pointsPerWorkout: 5,
    thresholdPoints: 200,
    reward: "Entered to win free Burn Club merch",
  },
];

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

// ---------------- Live Session (faked — no real video streaming yet) ----------------
// See project notes: real one-way live video needs a third-party streaming
// provider (Mux/IVS/Agora/etc.) plus a real backend; this fakes what the
// member-facing experience would look like — a placeholder video area and
// a real, typeable chat — so the UX can be validated before any of that is
// built. Defaulted to "live" so the banner is visible without needing to
// coordinate with the separate staff app (no real cross-app sync, same
// limitation as everything else in this prototype).
const LIVE_SESSION = {
  isLive: true,
  title: "Live Q&A with Coach Chris",
  hostName: "Chris V.",
};

const LIVE_CHAT_SEED = [
  { id: "lc1", name: "Priya K.", text: "Excited for this!! 🔥", me: false },
  { id: "lc2", name: "Marcus T.", text: "Can you go over form for the kettlebell swing again?", me: false },
  { id: "lc3", name: "Jamie R.", text: "loving the energy today", me: false },
];

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

// ---------------- Benchmarks ----------------
// Benchmark A/B/C are retest circuits programmed into "This Week's
// Workouts" every few months, same as any other workout — the only
// difference is scores get tracked as a long-running history (per
// benchmark, not per week) so a member can see improvement over time.
// scoreType: "rounds" (AMRAP-style — how many rounds in a fixed time,
// higher is better) or "time" (for-time — finish a fixed amount of work as
// fast as possible, lower is better, stored in seconds).
const BENCHMARKS = [
  { id: "benchmark-a", name: "Benchmark A", subtitle: "The Gauntlet — 12-Minute AMRAP", scoreType: "rounds" },
  { id: "benchmark-b", name: "Benchmark B", subtitle: "Sprint 500 — For Time", scoreType: "time" },
  { id: "benchmark-c", name: "Benchmark C", subtitle: "Endurance Test — 15-Minute AMRAP", scoreType: "rounds" },
];

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

const BENCHMARK_RESULTS = buildSeedBenchmarkResults();

// ---------------- Wearable (faked — no real Apple/Garmin integration yet) ----------------
// See project memory: HealthKit has no web API (native-only), Garmin needs a
// real backend — both out of scope for this prototype. This fakes what the
// data would look like once either is actually wired up, so the UI/placement
// can be validated first. Only one provider can be "connected" at a time.
const WEARABLE_DEFAULT = { provider: "apple" }; // "apple" | "garmin" | null

// Whole-day steps/calories, independent of workout completions (a rest day
// still has steps). Generated relative to today, like buildSeedCompletions.
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
    });
  }
  return stats;
}

// ---------------- Daily Habits ----------------
// A curated menu (Chris's call, over fully-freeform) so habits stay
// consistent across clients, plus "Other" as a custom escape hatch.
// "10,000 Steps" is the only auto-tracked one — it checks itself off once
// today's wearable step count (DAILY_STATS) clears its target; everything
// else is a manual daily checkbox.
const HABIT_PRESETS = [
  { id: "steps-10k", label: "10,000 Steps", auto: "steps", target: 10000 },
  { id: "water-100oz", label: "100oz Water" },
  { id: "outdoor-activity", label: "Outdoor Activity" },
  { id: "pushups-25", label: "25 Push-ups" },
  { id: "custom", label: "Other (custom)", custom: true },
];

// Up to 3, member-chosen — seeded here so the demo starts with something set.
const MY_HABITS_DEFAULT = [
  { id: "steps-10k", label: "10,000 Steps", auto: "steps", target: 10000 },
  { id: "water-100oz", label: "100oz Water" },
  { id: "outdoor-activity", label: "Outdoor Activity" },
];
