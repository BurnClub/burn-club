// Burn Club Staff — prototype data. A third static, unsynced app (like the
// member app and admin dashboard), aimed at phone-width use by a staff
// member on the go. Seeded independently — nothing here is live-connected
// to the member app or the desktop admin dashboard.

// ---------------- Members ----------------
// Same 5 demo members as the desktop admin, trimmed to what this app needs
// (display name + id, for conversation lookups).
const MEMBERS = [
  { id: "priya-k", name: "Priya K." },
  { id: "marcus-t", name: "Marcus T." },
  { id: "jamie-r", name: "Jamie R." },
  { id: "chris-v", name: "Chris V." },
  { id: "alicia-b", name: "Alicia B." },
];

// ---------------- Circuits (quick-edit) ----------------
// Only the workouts currently live for members this week — not the full
// library/folder system from the desktop admin. A staff member reaching
// for this app on their phone wants to tweak something that's live right
// now (swap an exercise, adjust reps/rest), not manage the whole content
// pipeline — that stays a desktop admin job.
const CIRCUITS = [
  {
    id: "full-body-burn",
    tag: "New",
    title: "Full Body Burn",
    focus: "Full Body",
    difficulty: "Intermediate",
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
    tag: "Core",
    title: "Core Crusher",
    focus: "Core & Abs",
    difficulty: "All Levels",
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
    tag: "Cardio",
    title: "Sweat & Sculpt",
    focus: "Cardio + Strength",
    difficulty: "Advanced",
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
    id: "stretch-mobility",
    tag: "Recovery",
    title: "Full Body Stretch & Mobility",
    focus: "Full Body",
    difficulty: "All Levels",
    blocks: [
      {
        type: "interval",
        label: "Stretch Flow",
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
    tag: "Core",
    title: "10-Minute Ab Burn",
    focus: "Core & Abs",
    difficulty: "All Levels",
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
];

// ---------------- Messaging ----------------
// Same seeded conversations as the desktop admin's Messages section — a DM
// per member, plus one group chat. Prototype-only: replying here doesn't
// reach the desktop admin or the member app, same limitation as everywhere
// else in this project.
const CONVERSATIONS = [
  ...MEMBERS.map((m) => ({ id: "dm-" + m.id, type: "dm", memberId: m.id })),
  { id: "group-burn-club", type: "group", name: "Burn Club Group Chat" },
];

const MESSAGES = [
  { id: "msg-1", conversationId: "dm-chris-v", senderId: "staff", senderName: "Staff", isStaff: true, text: "Hey Chris! Welcome to Burn Club — let us know if you need anything.", time: "Mon 9:02 AM", read: true },
  { id: "msg-2", conversationId: "dm-chris-v", senderId: "chris-v", senderName: "Chris V.", isStaff: false, text: "Thanks! Quick question — is Sweat & Sculpt okay to do two days in a row?", time: "Mon 6:47 PM", read: false },
  { id: "msg-3", conversationId: "dm-priya-k", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Just hit a 10-day streak! 🎉", time: "Today 8:02 AM", read: false },
  { id: "msg-4", conversationId: "group-burn-club", senderId: "staff", senderName: "Staff", isStaff: true, text: "New circuits are up for the week — 3 fresh ones plus a new stretch session! 🔥", time: "Sun 8:00 AM", read: true },
  { id: "msg-5", conversationId: "group-burn-club", senderId: "priya-k", senderName: "Priya K.", isStaff: false, text: "Sweat & Sculpt kicked my butt today 😅", time: "Sun 5:30 PM", read: true },
  { id: "msg-6", conversationId: "group-burn-club", senderId: "marcus-t", senderName: "Marcus T.", isStaff: false, text: "Same! Worth it though", time: "Sun 5:41 PM", read: false },
];

// ---------------- Live (faked — see member app's data.js for the matching note) ----------------
// A scripted list of chat lines that "arrive" one at a time once staff goes
// live, so the Live tab doesn't sit empty during a demo.
const LIVE_CHAT_SCRIPT = [
  { name: "Priya K.", text: "here!! 👋" },
  { name: "Marcus T.", text: "excited for this one" },
  { name: "Jamie R.", text: "can you show proper kettlebell swing form?" },
  { name: "Alicia B.", text: "joining a bit late, what'd I miss" },
  { name: "Priya K.", text: "this is great, thank you!" },
  { name: "Marcus T.", text: "🔥🔥🔥" },
];
