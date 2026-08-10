// Burn Club prototype — navigation & workout player logic, no real backend.

// ---------------- Minimalist icons ----------------
// Replacing full-color emoji app-wide, one page at a time, starting with Home
// (Chris's 2026-08-06 request). Single-color line/fill icons that inherit
// `color` from their surrounding CSS — same currentColor approach as the
// bottom nav icons built earlier this session.
const ICON_MSG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>`;
const ICON_STEPS = `<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="8" cy="15" rx="3" ry="5" transform="rotate(-15 8 15)"/><circle cx="10.8" cy="8.2" r="1.4"/><ellipse cx="16" cy="9" rx="3" ry="5" transform="rotate(15 16 9)"/><circle cx="13.2" cy="15.8" r="1.4"/></svg>`;
const ICON_FLAME = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.2 3-2.6 4.3-2.6 7.8a2.6 2.6 0 0 0 5.2 0c0-.9-.5-1.6-.9-2.4 2 1.3 3.8 4 3.8 6.9a5.5 5.5 0 0 1-11 0C6.5 9 9.5 6.5 12 2z"/></svg>`;
const ICON_HEART = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z"/></svg>`;
const ICON_LINK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l6-6"/><path d="M13 6l1-1a3 3 0 1 1 4 4l-1 1"/><path d="M11 18l-1 1a3 3 0 1 1-4-4l1-1"/></svg>`;

// ---------------- Home / Circuits / Community / Progress rendering ----------------

// Background pictogram per workout, keyed off category/meta text (Chris's
// 2026-08-06 request — original flat single-color figures, not the stock
// clipart/photo he referenced for inspiration, which is copyrighted).
// Each is a simple rounded-stroke stick figure, viewBox 0 0 100 100, colored
// via CSS `color` (see .circuit-bg-icon) so it inherits the card's accent.
const CIRCUIT_ICONS = {
  core: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="28" cy="26" r="9"/><path d="M30 34L46 55"/><path d="M46 55L70 48"/><path d="M70 48L77 72"/><path d="M38 42L58 50"/></svg>`,
  cardio: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="62" cy="18" r="9"/><path d="M58 26L42 50"/><path d="M42 50L58 64L48 90"/><path d="M42 50L22 56L27 82"/><path d="M50 32L67 22"/><path d="M50 32L32 44"/></svg>`,
  legs: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 48"/><path d="M50 48L30 58L35 85"/><path d="M50 48L70 58L65 85"/><path d="M50 30L27 36"/><path d="M50 30L73 36"/></svg>`,
  upper: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 62"/><path d="M50 62L35 90"/><path d="M50 62L65 90"/><path d="M50 30L30 12"/><path d="M50 30L70 12"/><path d="M18 12L42 12"/><path d="M58 12L82 12"/></svg>`,
  fullbody: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 55"/><path d="M50 30L25 10"/><path d="M50 30L75 10"/><path d="M50 55L25 90"/><path d="M50 55L75 90"/></svg>`,
  stretch: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="35" cy="20" r="9"/><path d="M37 28L56 55"/><path d="M56 55L50 90"/><path d="M56 55L68 88"/><path d="M42 34L68 14"/><path d="M42 34L30 55"/></svg>`,
};

function circuitIconKey(c) {
  if (c.category === "stretch") return "stretch";
  const mid = ((c.meta || "").split("·")[1] || "").trim();
  if (/core|abs/i.test(mid)) return "core";
  if (/cardio/i.test(mid)) return "cardio";
  if (/lower body|quads|glutes|hamstring/i.test(mid)) return "legs";
  if (/back|biceps|chest|tris|shoulders/i.test(mid)) return "upper";
  if (/full body/i.test(mid)) return "fullbody";
  return "upper";
}

function renderCircuitCard(c) {
  const completion = mostRecentCompletion(c.id);
  return `
    <button class="circuit-card color-${c.color}${completion ? " completed" : ""}" data-open-circuit="${c.id}">
      <span class="circuit-bg-icon">${CIRCUIT_ICONS[circuitIconKey(c)]}</span>
      <div class="circuit-card-top">
        <h3>${c.title}</h3>
        ${completion
          ? `<div class="circuit-completed-mark"><span class="circuit-check">✓</span><span class="circuit-completed-date">${formatShortDate(completion.date)}</span></div>`
          : `<span class="circuit-tag">${c.tag}</span>`}
      </div>
      <p>${c.meta}</p>
    </button>
  `;
}

function renderFeedItem(f) {
  return `
    <div class="feed-item">
      <span class="feed-emoji">${f.emoji}</span>
      <div class="feed-text">
        <p><strong>${f.name}</strong> ${f.action}</p>
        <p class="feed-time">${f.time}</p>
      </div>
    </div>
  `;
}

// Home's "Community Buzz" — same FEED data as the Community tab, but as plain
// rows inside one card instead of a card per item (2026-08-04 Home redesign).
function renderHomeBuzzRow(f) {
  return `
    <div class="buzz-row">
      <span class="buzz-dot"></span>
      <div class="buzz-text">
        <p><strong>${f.name}</strong> ${f.action}</p>
        <p class="buzz-time">${f.time}</p>
      </div>
    </div>
  `;
}

function renderLeaderRow(l) {
  return `
    <div class="leader-row ${l.me ? "me" : ""}">
      <span class="leader-rank">#${l.rank}</span>
      <span class="leader-name">${l.name}</span>
      <span class="leader-stat">${l.stat}</span>
    </div>
  `;
}

// Compact, tappable row — same small footprint as the old static "Past
// Weeks" list, but for real workouts (Last Week's Workouts).
function renderCompactCircuitRow(c) {
  const completion = mostRecentCompletion(c.id);
  return `
    <button class="circuit-row-compact${completion ? " completed" : ""}" data-open-circuit="${c.id}">
      <span>${c.title}</span>
      ${completion
        ? `<span class="archive-count completed-note">✓ Completed &nbsp; ${formatShortDate(completion.date)}</span>`
        : `<span class="archive-count">${c.meta}</span>`}
    </button>
  `;
}

// ---------------- Progress / completion history ----------------

const COMPLETIONS_STORAGE_KEY = "burnclub-completions";
// "previous-week" counts as a regular workout everywhere stats-wise — it's
// the same kind of content, just left live an extra week.
// Two buckets for the "This Week" calendar boxes (2026-08-07 redesign): a
// workout (any circuit-type completion) highlights blue, a stretch/core
// session highlights green, and a day with both gets a diagonal split —
// see .cal-day.cal-both in style.css.
// "cardio-activity" (2026-08-09, walk/run/bike/stairs logged from the
// Workouts tab) counts as a workout here too — same blue calendar highlight.
const WORKOUT_CATEGORIES = ["circuit", "previous-week", "structured", "cardio-activity"];
const STRETCH_CORE_CATEGORIES = ["stretch", "core-burn"];
let COMPLETIONS = [];
let progressRange = "week"; // "week" | "month" | "year"
let currentCompletionEntry = null; // the just-logged completion, for the RPE slider to update
let currentBenchmarkId = null; // set on finish() when the just-completed circuit is a benchmark

function loadCompletions() {
  const stored = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedCompletions();
  localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveCompletions() {
  localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(COMPLETIONS));
}

// Most recent completion of this specific workout, for the "✓ Completed"
// grey-out treatment on the Home/Workouts cards.
function mostRecentCompletion(workoutId) {
  return COMPLETIONS.filter((c) => c.workoutId === workoutId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

// "YYYY-MM-DD" -> "Jul 22". Built from local date parts (not `new Date(string)`,
// which parses as UTC and can roll the date back a day in the evening).
function formatShortDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function logCompletion(circuit) {
  const minutes = parseInt(circuit.meta, 10) || 20;
  const entry = {
    id: `local-${Date.now()}`,
    workoutId: circuit.id,
    title: circuit.title,
    category: circuit.category,
    date: dateKey(new Date()),
    minutes,
    caloriesBurned: estimateCalories(minutes),
    avgHeartRate: estimateHeartRate(),
    rpe: 5,
  };
  COMPLETIONS.push(entry);
  saveCompletions();
  return entry;
}

// ---------------- Cardio Log (2026-08-09) ----------------
// Manual entry (Workouts tab, "+ Log Activity") or a fake "Sync from
// Wearable" button — either way it becomes a COMPLETIONS entry with
// category "cardio-activity", so it automatically counts toward challenge
// points (challengePointsForMember just counts COMPLETIONS in range),
// the workout streak (currentStreak checks COMPLETIONS dates generically),
// and the This-Week calendar highlight (see WORKOUT_CATEGORIES above).
const CARDIO_ACTIVITY_TYPES = [
  { id: "Walk", unit: "mi", unitLabel: "Distance (mi)", step: "0.1" },
  { id: "Run", unit: "mi", unitLabel: "Distance (mi)", step: "0.1" },
  { id: "Bike", unit: "mi", unitLabel: "Distance (mi)", step: "0.1" },
  { id: "Stair Stepper", unit: "flights", unitLabel: "Flights Climbed", step: "1" },
];
let cardioSelectedActivity = "Walk";

function logCardioActivity({ activityType, distanceValue, minutes, source }) {
  const meta = CARDIO_ACTIVITY_TYPES.find((t) => t.id === activityType) || CARDIO_ACTIVITY_TYPES[0];
  const entry = {
    id: `cardio-${Date.now()}`,
    workoutId: null,
    title: `${activityType}${distanceValue ? ` — ${distanceValue} ${meta.unit}` : ""}`,
    category: "cardio-activity",
    date: dateKey(new Date()),
    minutes,
    caloriesBurned: estimateCalories(minutes),
    avgHeartRate: estimateHeartRate(),
    rpe: 5,
    activityType,
    distanceValue,
    distanceUnit: meta.unit,
    source, // "manual" | "wearable"
  };
  COMPLETIONS.push(entry);
  saveCompletions();
  return entry;
}

function renderCardioLog() {
  const container = document.getElementById("cardio-log-list");
  if (!container) return;
  const entries = COMPLETIONS
    .filter((c) => c.category === "cardio-activity")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);
  container.innerHTML = entries.length === 0
    ? `<p class="cardio-log-empty">No cardio activities logged yet.</p>`
    : entries.map((e) => `
        <div class="cardio-log-row">
          <div class="cardio-log-row-left">
            <span class="cardio-log-activity">${e.activityType}${e.distanceValue ? ` · ${e.distanceValue} ${e.distanceUnit}` : ""}</span>
            <span class="cardio-log-meta">${e.minutes} min · ${formatShortDate(e.date)}</span>
          </div>
          ${e.source === "wearable" ? `<span class="cardio-log-source">Synced</span>` : ""}
        </div>
      `).join("");
  const syncBtn = document.getElementById("cardio-sync-btn");
  if (syncBtn) syncBtn.style.display = WEARABLE.provider ? "inline-block" : "none";
}

function updateCardioActivityPicker() {
  document.querySelectorAll("#cardio-activity-picker .pill-filter").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.activity === cardioSelectedActivity);
  });
  const meta = CARDIO_ACTIVITY_TYPES.find((t) => t.id === cardioSelectedActivity);
  document.getElementById("cardio-distance-label").textContent = meta.unitLabel;
  document.getElementById("cardio-distance-input").step = meta.step;
}

function openCardioLogModal() {
  cardioSelectedActivity = "Walk";
  updateCardioActivityPicker();
  document.getElementById("cardio-distance-input").value = "";
  document.getElementById("cardio-minutes-input").value = "";
  document.getElementById("cardio-log-saved").style.display = "none";
  document.getElementById("cardio-log-overlay").classList.add("visible");
}

function closeCardioLogModal() {
  document.getElementById("cardio-log-overlay").classList.remove("visible");
}

function saveCardioLogForm() {
  const minutes = parseInt(document.getElementById("cardio-minutes-input").value, 10) || 0;
  const distanceValue = parseFloat(document.getElementById("cardio-distance-input").value) || 0;
  if (minutes <= 0) return;
  logCardioActivity({ activityType: cardioSelectedActivity, distanceValue, minutes, source: "manual" });
  renderCardioLog();
  document.getElementById("cardio-log-saved").style.display = "block";
  setTimeout(closeCardioLogModal, 900);
}

// Fake sync — no real wearable data feed exists, so this just fabricates one
// plausible walk/run for today, same as the rest of the wearable stats.
function syncCardioFromWearable() {
  if (!WEARABLE.provider) return;
  const options = [
    { activityType: "Walk", distanceValue: +(1.5 + Math.random() * 2).toFixed(1), minutes: 20 + Math.floor(Math.random() * 25) },
    { activityType: "Run", distanceValue: +(1.5 + Math.random() * 3).toFixed(1), minutes: 15 + Math.floor(Math.random() * 20) },
  ];
  const pick = options[Math.floor(Math.random() * options.length)];
  logCardioActivity({ ...pick, source: "wearable" });
  renderCardioLog();
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function completionsInRange(range) {
  const today = new Date();
  let start;
  if (range === "week") start = startOfWeek(today);
  else if (range === "month") start = new Date(today.getFullYear(), today.getMonth(), 1);
  else start = new Date(today.getFullYear(), 0, 1);
  const startKey = dateKey(start);
  const todayKey = dateKey(today);
  return COMPLETIONS.filter((c) => c.date >= startKey && c.date <= todayKey);
}

function currentStreak() {
  const done = new Set(COMPLETIONS.map((c) => c.date));
  const cursor = new Date();
  if (!done.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function completionsByDate() {
  const map = {};
  COMPLETIONS.forEach((c) => {
    if (!map[c.date]) map[c.date] = [];
    map[c.date].push(c);
  });
  return map;
}

function renderDayCell(date, byDate, today) {
  const key = dateKey(date);
  const entries = byDate[key] || [];
  const hasWorkout = entries.some((c) => WORKOUT_CATEGORIES.includes(c.category));
  const hasStretchCore = entries.some((c) => STRETCH_CORE_CATEGORIES.includes(c.category));
  const classes = ["cal-day"];
  if (hasWorkout && hasStretchCore) classes.push("done", "cal-both");
  else if (hasWorkout) classes.push("done", "cal-workout");
  else if (hasStretchCore) classes.push("done", "cal-stretch");
  if (date > today) classes.push("future");
  if (key === dateKey(today)) classes.push("today");
  const title = entries.map((e) => e.title).join(", ");
  return `<div class="${classes.join(" ")}" title="${title}">${date.getDate()}</div>`;
}

function renderWeekGrid() {
  const today = new Date();
  const start = startOfWeek(today);
  const byDate = completionsByDate();
  let html = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    html += renderDayCell(d, byDate, today);
  }
  return html;
}

function renderMonthGrid() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDate = completionsByDate();
  let html = "";
  for (let i = 0; i < first.getDay(); i++) html += `<div class="cal-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) html += renderDayCell(new Date(year, month, day), byDate, today);
  return html;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function renderYearBreakdown() {
  const today = new Date();
  const counts = new Array(12).fill(0);
  COMPLETIONS.forEach((c) => {
    const d = new Date(c.date);
    if (d.getFullYear() === today.getFullYear()) counts[d.getMonth()]++;
  });
  return counts
    .map((count, i) => `
      <div class="archive-row">
        <span>${MONTH_NAMES[i]}</span>
        <span class="archive-count">${count} workout${count === 1 ? "" : "s"}</span>
      </div>
    `)
    .join("");
}

function renderProgressTab() {
  const items = completionsInRange(progressRange);
  const counts = { circuit: 0, stretch: 0, "core-burn": 0, "cardio-activity": 0 };
  let minutes = 0;
  let calories = 0;
  items.forEach((c) => {
    // Cardio-log entries get their own "Cardio Sessions" bucket (2026-08-09)
    // instead of folding into "Workouts Done".
    const bucket = c.category === "previous-week" ? "circuit" : c.category;
    counts[bucket] = (counts[bucket] || 0) + 1;
    minutes += c.minutes || 0;
    calories += c.caloriesBurned || 0;
  });
  document.getElementById("stat-workouts").textContent = counts.circuit;
  document.getElementById("stat-stretch").textContent = counts.stretch;
  document.getElementById("stat-core-burn").textContent = counts["core-burn"];
  document.getElementById("stat-cardio").textContent = counts["cardio-activity"];
  document.getElementById("stat-minutes").textContent = minutes;
  const caloriesCard = document.getElementById("stat-calories-card");
  if (caloriesCard) {
    caloriesCard.style.display = WEARABLE.provider ? "" : "none";
    document.getElementById("stat-calories").textContent = calories;
  }

  const streak = currentStreak();
  document.getElementById("progress-streak-num").textContent = `${streak} Day Streak`;
  document.getElementById("progress-streak-sub").textContent =
    streak > 0 ? "Keep it going — don't break the chain" : "Complete a workout today to start a streak";

  document.querySelectorAll(".range-btn").forEach((b) => b.classList.toggle("active", b.dataset.range === progressRange));

  const section = document.getElementById("progress-calendar-section");
  if (progressRange === "week") {
    section.innerHTML = `<h2 class="home-section-title">This Week</h2><div class="calendar-grid">${renderWeekGrid()}</div>`;
  } else if (progressRange === "month") {
    section.innerHTML = `<h2 class="home-section-title">This Month</h2><div class="calendar-grid">${renderMonthGrid()}</div>`;
  } else {
    section.innerHTML = `<h2 class="home-section-title">This Year</h2><div class="archive-list">${renderYearBreakdown()}</div>`;
  }

  renderBenchmarkList();
}

// ---------------- Benchmarks ----------------

function benchmarkResults(benchmarkId) {
  return BENCHMARK_RESULTS.filter((r) => r.benchmarkId === benchmarkId).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// "rounds" -> "8 rounds"; "time" (seconds) -> "3:57.5"
function formatBenchmarkScore(benchmark, score) {
  if (benchmark.scoreType === "rounds") return `${score} round${score === 1 ? "" : "s"}`;
  const mins = Math.floor(score / 60);
  const secs = score - mins * 60;
  const secsStr = Number.isInteger(secs) ? String(secs).padStart(2, "0") : secs.toFixed(1).padStart(4, "0");
  return `${mins}:${secsStr}`;
}

// Improvement since the first attempt: more rounds is better, less time is
// better — "best" is always at least as good as "beginning" by construction
// (it's computed across the same result set), so this never needs to show
// a regression, only "+2 rounds" / "−12.5 sec" / no change yet.
function formatBenchmarkDelta(benchmark, beginning, best) {
  const delta = best - beginning;
  if (delta === 0) return null;
  if (benchmark.scoreType === "rounds") {
    return `+${delta} round${delta === 1 ? "" : "s"}`;
  }
  return `−${Math.abs(delta)} sec`;
}

function renderBenchmarkCard(benchmark) {
  const results = benchmarkResults(benchmark.id);
  const nameBlock = `
    <p class="benchmark-name">${benchmark.name}</p>
    <p class="benchmark-subtitle">${benchmark.subtitle}</p>
  `;

  if (results.length === 0) {
    return `
      <div class="benchmark-card">
        ${nameBlock}
        <div class="benchmark-bottom">
          <span class="benchmark-baseline-tag">Not yet tested</span>
        </div>
      </div>
    `;
  }

  const beginning = results[0].score;
  const best = benchmark.scoreType === "rounds" ? Math.max(...results.map((r) => r.score)) : Math.min(...results.map((r) => r.score));
  const delta = formatBenchmarkDelta(benchmark, beginning, best);

  const footer =
    results.length === 1
      ? `<span class="benchmark-baseline-tag">Baseline set — retest to track improvement</span>`
      : delta
      ? `<span class="benchmark-delta">${delta} since your first test</span>`
      : `<span class="benchmark-baseline-tag">No change yet — keep retesting</span>`;

  return `
    <div class="benchmark-card">
      ${nameBlock}
      <div class="benchmark-bottom">
        <span class="benchmark-best">${formatBenchmarkScore(benchmark, best)}</span>
        ${footer}
      </div>
    </div>
  `;
}

function renderBenchmarkList() {
  document.getElementById("benchmark-list").innerHTML = BENCHMARKS.map(renderBenchmarkCard).join("");
}

// Shows/configures the post-workout score prompt when the just-finished
// circuit is flagged as a benchmark (isBenchmark/benchmarkId, set by admin's
// workout builder) — hidden entirely for regular workouts.
function setupBenchmarkScoreSection(circuit) {
  const section = document.getElementById("benchmark-score-section");
  currentBenchmarkId = circuit.isBenchmark ? circuit.benchmarkId : null;
  const benchmark = currentBenchmarkId ? BENCHMARKS.find((b) => b.id === currentBenchmarkId) : null;

  if (!benchmark) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  document.getElementById("benchmark-score-saved").style.display = "none";
  document.getElementById("benchmark-score-save-btn").style.display = "";
  document.getElementById("benchmark-score-rounds").value = "";
  document.getElementById("benchmark-score-min").value = "";
  document.getElementById("benchmark-score-sec").value = "";

  const isRounds = benchmark.scoreType === "rounds";
  document.getElementById("benchmark-score-label").textContent = isRounds
    ? `${benchmark.name} — how many rounds did you complete?`
    : `${benchmark.name} — what was your finish time?`;
  document.getElementById("benchmark-score-rounds-row").style.display = isRounds ? "" : "none";
  document.getElementById("benchmark-score-time-row").style.display = isRounds ? "none" : "";
}

function saveBenchmarkScore() {
  if (!currentBenchmarkId) return;
  const benchmark = BENCHMARKS.find((b) => b.id === currentBenchmarkId);
  if (!benchmark) return;

  let score;
  if (benchmark.scoreType === "rounds") {
    const input = document.getElementById("benchmark-score-rounds");
    if (input.value.trim() === "") return;
    score = Number(input.value);
    if (isNaN(score) || score < 0) return;
  } else {
    const minInput = document.getElementById("benchmark-score-min");
    const secInput = document.getElementById("benchmark-score-sec");
    if (minInput.value.trim() === "" && secInput.value.trim() === "") return;
    score = (Number(minInput.value) || 0) * 60 + (Number(secInput.value) || 0);
    if (score <= 0) return;
  }

  BENCHMARK_RESULTS.push({
    id: `br-${Date.now()}`,
    benchmarkId: currentBenchmarkId,
    date: dateKey(new Date()),
    score,
  });

  document.getElementById("benchmark-score-saved").style.display = "";
  document.getElementById("benchmark-score-save-btn").style.display = "none";
}

// ---------------- Challenges ----------------

function currentChallenge() {
  const today = dateKey(new Date());
  return CHALLENGES.find((c) => today >= c.startDate && today <= c.endDate) || null;
}

function challengePointsForMember(challenge) {
  const earned = COMPLETIONS.filter((c) => c.date >= challenge.startDate && c.date <= challenge.endDate).length * challenge.pointsPerWorkout;
  return earned + (CURRENT_MEMBER.pointAdjustment || 0);
}

function renderChallengeCard() {
  const container = document.getElementById("challenge-card");
  const challenge = currentChallenge();
  if (!challenge) {
    container.innerHTML = `<div class="challenge-card"><p class="challenge-empty">No active challenge right now — check back soon!</p></div>`;
    return;
  }

  const myPoints = challengePointsForMember(challenge);
  const reached = myPoints >= challenge.thresholdPoints;
  const pct = Math.min(100, Math.round((myPoints / challenge.thresholdPoints) * 100));

  const standings = [...CHALLENGE_LEADERBOARD, { name: "You", points: myPoints, me: true }].sort((a, b) => b.points - a.points);
  const rowsHtml = standings.map((s, i) => renderLeaderRow({ rank: i + 1, name: s.name, stat: `${s.points} pts`, me: s.me })).join("");

  container.innerHTML = `
    <div class="challenge-card">
      <p class="challenge-eyebrow">Current Challenge</p>
      <h2 class="challenge-name">${challenge.name}</h2>
      <div class="challenge-points-row">
        <span class="challenge-points-num">${myPoints}</span>
        <span class="challenge-points-label">/ ${challenge.thresholdPoints} pts</span>
      </div>
      <div class="player-progress-track"><div class="player-progress-fill" style="width:${pct}%"></div></div>
      <p class="challenge-reward ${reached ? "reached" : ""}">${reached ? "🎉 You've hit the threshold — " + challenge.reward : `Reach ${challenge.thresholdPoints} points — ${challenge.reward}`}</p>
      <div class="leaderboard">${rowsHtml}</div>
    </div>
  `;
}

// ---------------- Wearable (faked) ----------------

const WEARABLE_STORAGE_KEY = "burnclub-wearable";
const DAILY_STATS_STORAGE_KEY = "burnclub-daily-stats";
const WEARABLE_LABELS = { apple: "Apple Health", garmin: "Garmin" };
let WEARABLE = { ...WEARABLE_DEFAULT };
let DAILY_STATS = [];

function loadWearableState() {
  const stored = localStorage.getItem(WEARABLE_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  localStorage.setItem(WEARABLE_STORAGE_KEY, JSON.stringify(WEARABLE_DEFAULT));
  return { ...WEARABLE_DEFAULT };
}

function saveWearableState() {
  localStorage.setItem(WEARABLE_STORAGE_KEY, JSON.stringify(WEARABLE));
}

function loadDailyStats() {
  const stored = localStorage.getItem(DAILY_STATS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Backfill restingHR for stats saved before it existed (2026-08-09) —
      // otherwise anyone with an existing local session just sees blank/0.
      if (parsed.length && parsed[0].restingHR === undefined) {
        parsed.forEach((d) => { d.restingHR = 54 + Math.floor(Math.random() * 16); });
        localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedDailyStats();
  localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function connectProvider(provider) {
  WEARABLE.provider = provider;
  saveWearableState();
  renderWearableSection();
  renderTodayStats();
  renderHabitsSection();
}

function disconnectProvider() {
  WEARABLE.provider = null;
  saveWearableState();
  renderWearableSection();
  renderTodayStats();
  renderHabitsSection();
}

function renderTodayStats() {
  const container = document.getElementById("today-stats-row");
  if (!container) return;
  if (!WEARABLE.provider) {
    container.innerHTML = `<div class="wearable-prompt-card">Connect a wearable in Profile to see today's steps &amp; calories.</div>`;
    return;
  }
  const today = DAILY_STATS.find((d) => d.date === dateKey(new Date())) || { steps: 0, calories: 0, restingHR: 0 };
  container.innerHTML = `
    <div class="today-stat"><span class="today-stat-icon">${ICON_STEPS}</span><div><p class="today-stat-num">${today.steps.toLocaleString()}</p><p class="today-stat-label">Steps Today</p></div></div>
    <div class="today-stat"><span class="today-stat-icon">${ICON_FLAME}</span><div><p class="today-stat-num">${today.calories.toLocaleString()}</p><p class="today-stat-label">Calories Today</p></div></div>
    <div class="today-stat"><span class="today-stat-icon">${ICON_HEART}</span><div><p class="today-stat-num">${today.restingHR}</p><p class="today-stat-label">Resting HR</p></div></div>
  `;
}

function renderWearableSection() {
  const container = document.getElementById("wearable-section");
  if (!container) return;
  container.innerHTML = ["apple", "garmin"].map((provider) => {
    const connected = WEARABLE.provider === provider;
    return `
      <div class="wearable-row">
        <div>
          <p class="wearable-name">${WEARABLE_LABELS[provider]}</p>
          <p class="wearable-status ${connected ? "connected" : ""}">${connected ? "● Connected" : "Not connected"}</p>
        </div>
        ${connected
          ? `<button class="btn-ghost-lg small" data-disconnect-provider="${provider}">Disconnect</button>`
          : `<button class="btn-ghost-lg small" data-connect-provider="${provider}">Connect</button>`}
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-connect-provider]").forEach((btn) => {
    btn.addEventListener("click", () => connectProvider(btn.dataset.connectProvider));
  });
  document.querySelectorAll("[data-disconnect-provider]").forEach((btn) => {
    btn.addEventListener("click", () => disconnectProvider());
  });
}

// ---------------- Daily Habits ----------------

const MY_HABITS_STORAGE_KEY = "burnclub-my-habits";
const HABIT_CHECKS_STORAGE_KEY = "burnclub-habit-checks";
let MY_HABITS = [];
let HABIT_CHECKS = {};
let habitPickerOpen = false;

function loadMyHabits() {
  const stored = localStorage.getItem(MY_HABITS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  localStorage.setItem(MY_HABITS_STORAGE_KEY, JSON.stringify(MY_HABITS_DEFAULT));
  return [...MY_HABITS_DEFAULT];
}

function saveMyHabits() {
  localStorage.setItem(MY_HABITS_STORAGE_KEY, JSON.stringify(MY_HABITS));
}

function loadHabitChecks() {
  const stored = localStorage.getItem(HABIT_CHECKS_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (e) {
    return {};
  }
}

function saveHabitChecks() {
  localStorage.setItem(HABIT_CHECKS_STORAGE_KEY, JSON.stringify(HABIT_CHECKS));
}

// Auto habits (steps) derive from real wearable data unless the member has
// explicitly tapped the checkbox today, in which case that override wins.
// Date-parameterized so currentHabitStreak() (below) can reuse the same
// check logic for past days, not just today.
function isHabitCheckedOnDate(habit, dateStr) {
  const log = HABIT_CHECKS[dateStr] || {};
  if (habit.id in log) return log[habit.id];
  if (habit.auto === "steps") {
    const day = DAILY_STATS.find((d) => d.date === dateStr);
    return !!(WEARABLE.provider && day && day.steps >= habit.target);
  }
  return false;
}

function isHabitChecked(habit) {
  return isHabitCheckedOnDate(habit, dateKey(new Date()));
}

// Consecutive days every current habit was checked off (2026-08-09, fills
// the empty space at the bottom of the Habits card) — same walk-backward
// pattern as currentStreak() above, but habit-based instead of workout-
// based. Today doesn't break the streak if it isn't done yet (still in
// progress), same reasoning as the workout streak.
function currentHabitStreak() {
  if (MY_HABITS.length === 0) return 0;
  const allDoneOn = (dateStr) => MY_HABITS.every((h) => isHabitCheckedOnDate(h, dateStr));
  const cursor = new Date();
  if (!allDoneOn(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (allDoneOn(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toggleHabit(habitId) {
  const habit = MY_HABITS.find((h) => h.id === habitId);
  if (!habit) return;
  const key = dateKey(new Date());
  if (!HABIT_CHECKS[key]) HABIT_CHECKS[key] = {};
  HABIT_CHECKS[key][habitId] = !isHabitChecked(habit);
  saveHabitChecks();
  renderHabitsSection();
}

function renderHabitsSection() {
  const container = document.getElementById("habits-list");
  if (!container) return;
  if (MY_HABITS.length === 0) {
    container.innerHTML = `<div class="habit-empty-card">Set up to 3 daily habits in Profile.</div>`;
  } else {
    container.innerHTML = MY_HABITS.map((h) => {
      const checked = isHabitChecked(h);
      return `
        <button class="habit-row ${checked ? "checked" : ""}" data-toggle-habit="${h.id}">
          <span class="habit-checkbox">${checked ? "✓" : ""}</span>
          <span class="habit-label">${h.label}</span>
          ${h.auto ? `<span class="habit-auto-tag"><span class="habit-auto-icon">${ICON_LINK}</span>Auto</span>` : ""}
        </button>
      `;
    }).join("");
    document.querySelectorAll("[data-toggle-habit]").forEach((btn) => {
      btn.addEventListener("click", () => toggleHabit(btn.dataset.toggleHabit));
    });
  }
  const streakNumEl = document.getElementById("habit-streak-num");
  if (streakNumEl) streakNumEl.textContent = currentHabitStreak();
}

function addHabit(habit) {
  if (MY_HABITS.length >= 3) return;
  MY_HABITS.push(habit);
  habitPickerOpen = false;
  saveMyHabits();
  renderHabitManager();
  renderHabitsSection();
}

function removeHabit(habitId) {
  MY_HABITS = MY_HABITS.filter((h) => h.id !== habitId);
  saveMyHabits();
  renderHabitManager();
  renderHabitsSection();
}

function renderHabitManager() {
  const container = document.getElementById("habit-manager");
  if (!container) return;

  const rowsHtml = MY_HABITS.length
    ? MY_HABITS.map((h) => `
        <div class="wearable-row">
          <p class="wearable-name">${h.label}</p>
          <button class="habit-remove-btn" data-remove-habit="${h.id}">✕</button>
        </div>
      `).join("")
    : `<div class="wearable-row"><p class="wearable-status">No habits set yet.</p></div>`;

  const canAddMore = MY_HABITS.length < 3;
  const availablePresets = HABIT_PRESETS.filter((p) => p.custom || !MY_HABITS.some((h) => h.id === p.id));

  let addUi = "";
  if (canAddMore && habitPickerOpen) {
    addUi = `
      <div class="habit-picker">
        ${availablePresets.map((p) => `<button class="habit-picker-option" data-pick-habit="${p.id}">${p.label}</button>`).join("")}
        <div class="habit-custom-row" id="habit-custom-row" style="display:none;">
          <input type="text" id="habit-custom-input" placeholder="e.g. Meditate 10 minutes" />
          <button class="btn-primary small" id="habit-custom-save-btn">Add</button>
        </div>
      </div>
    `;
  } else if (canAddMore) {
    addUi = `<button class="btn-ghost-lg small" id="add-habit-btn">+ Add Habit</button>`;
  } else {
    addUi = `<p class="habit-limit-note">3 of 3 habits set — remove one to add another.</p>`;
  }

  container.innerHTML = `<div class="wearable-section">${rowsHtml}</div>${addUi}`;

  document.querySelectorAll("[data-remove-habit]").forEach((btn) => {
    btn.addEventListener("click", () => removeHabit(btn.dataset.removeHabit));
  });
  const addBtn = document.getElementById("add-habit-btn");
  if (addBtn) addBtn.addEventListener("click", () => { habitPickerOpen = true; renderHabitManager(); });
  document.querySelectorAll("[data-pick-habit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.pickHabit === "custom") {
        document.getElementById("habit-custom-row").style.display = "flex";
      } else {
        addHabit(HABIT_PRESETS.find((p) => p.id === btn.dataset.pickHabit));
      }
    });
  });
  const customSaveBtn = document.getElementById("habit-custom-save-btn");
  if (customSaveBtn) {
    customSaveBtn.addEventListener("click", () => {
      const text = document.getElementById("habit-custom-input").value.trim();
      if (!text) return;
      addHabit({ id: `custom-${Date.now()}`, label: text });
    });
  }
}

// ---------------- Block summary rendering (circuit detail screen) ----------------

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function blockTypeLabel(type) {
  return {
    interval: "Circuit",
    superset: "Superset",
    straight: "Straight Sets",
    ladder: "Rep Ladder",
    amrap: "AMRAP",
    emom: "EMOM",
  }[type] || type;
}

function blockSummaryLine(block) {
  switch (block.type) {
    case "interval":
      return block.timed === false
        ? `${block.rounds} rounds · self-paced reps · rest ${block.rest}s`
        : `${block.rounds} rounds · ${block.work}s work / ${block.rest}s rest`;
    case "superset":
      return `${block.rounds} rounds · rest ${block.rest}s between rounds`;
    case "straight":
      return `${block.sets} sets × ${block.reps} reps · rest ${block.rest}s`;
    case "ladder":
      return `${block.scheme.join("-")} reps · rest ${block.rest}s`;
    case "amrap":
      return `${formatClock(block.duration)} as many rounds as possible`;
    case "emom":
      return `${formatClock(block.duration)} · new exercise every ${block.interval}s`;
    default:
      return "";
  }
}

function blockExerciseNames(block) {
  if (block.exercise) return [block.exercise.name];
  if (block.exercises) return block.exercises.map((e) => e.name + (e.reps ? ` (${e.reps} reps)` : ""));
  return [];
}

function renderBlockSummaryCard(block, index) {
  const exercises = blockExerciseNames(block)
    .map((name) => `<li>${name}</li>`)
    .join("");
  return `
    <div class="block-card">
      <div class="block-card-top">
        <span class="block-num">${index + 1}</span>
        <div>
          <p class="block-name">${block.label}</p>
          <p class="block-type-tag">${blockTypeLabel(block.type)}</p>
        </div>
      </div>
      <p class="block-summary-line">${blockSummaryLine(block)}</p>
      <ul class="block-exercise-names">${exercises}</ul>
    </div>
  `;
}

// ---------------- Screen / tab navigation ----------------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("visible"));
  document.getElementById(id).classList.add("visible");
}

function showTab(tabId) {
  Player.stop();
  document.getElementById("main-app").classList.add("visible");
  document.getElementById("screen-login").classList.remove("visible");
  document.querySelectorAll(".tab-screen").forEach((s) => s.classList.remove("visible"));
  document.querySelectorAll(".screen:not(.tab-screen)").forEach((s) => s.classList.remove("visible"));
  document.getElementById(tabId).classList.add("visible");
  if (tabId === "tab-progress") renderProgressTab();
  if (tabId === "tab-community") renderChallengeCard();
  if (tabId === "tab-home" || tabId === "tab-circuits") renderCircuitLists();
  if (tabId === "tab-circuits") renderCardioLog();
  if (tabId === "tab-calendar") renderCalendarTab();
  if (tabId === "tab-library-home") renderLibraryHomeTab();
  if (tabId === "tab-library") renderExerciseLibraryTab();
  if (tabId === "tab-my-workouts") renderMyWorkoutsTab();

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-btn[data-tab-target="${tabId}"]`);
  if (navBtn) navBtn.classList.add("active");

  document.getElementById("bottom-nav").style.display = "flex";
}

let openCircuitId = null;

function openCircuit(id) {
  const c = CIRCUITS.find((x) => x.id === id);
  if (!c) return;
  openCircuitId = id;
  document.getElementById("detail-tag").textContent = c.tag;
  document.getElementById("detail-title").textContent = c.title;
  document.getElementById("detail-meta").textContent = c.meta;
  document.getElementById("detail-desc").textContent = c.desc;
  document.getElementById("block-summary-list").innerHTML = c.blocks.map(renderBlockSummaryCard).join("");
  showScreen("screen-detail");
}

// ---------------- Workout player engine ----------------

function buildPhaseQueue(circuit) {
  const phases = [];
  const totalBlocks = circuit.blocks.length;

  circuit.blocks.forEach((block, blockIndex) => {
    const blockMeta = { blockLabel: block.label, blockIndex, totalBlocks, blockType: block.type, blockNotes: block.notes || "" };

    if (block.type === "interval") {
      const isTimed = block.timed !== false;
      for (let round = 1; round <= block.rounds; round++) {
        block.exercises.forEach((ex, exIndex) => {
          if (isTimed) {
            phases.push({
              ...blockMeta,
              kind: "work",
              exerciseName: ex.name,
              duration: block.work,
              progressLabel: `Round ${round} of ${block.rounds} · Station ${exIndex + 1} of ${block.exercises.length}`,
            });
          } else {
            phases.push({
              ...blockMeta,
              kind: "set",
              exerciseName: ex.name,
              reps: ex.reps,
              progressLabel: `Round ${round} of ${block.rounds} · Station ${exIndex + 1} of ${block.exercises.length}`,
            });
          }
          const isLastOfBlock = round === block.rounds && exIndex === block.exercises.length - 1;
          if (!isLastOfBlock) {
            const nextEx = block.exercises[exIndex + 1] || block.exercises[0];
            phases.push({
              ...blockMeta,
              kind: "rest",
              duration: block.rest,
              upNext: nextEx.name,
              progressLabel: `Round ${round} of ${block.rounds}`,
            });
          }
        });
      }
    }

    // Supersets: both (or all) exercises on one screen instead of a separate
    // screen per exercise (2026-08-07) — Chris wants everything right in
    // front of them, video swapped for a per-exercise popup button like the
    // AMRAP list already does. One "superset" phase per round.
    if (block.type === "superset") {
      for (let round = 1; round <= block.rounds; round++) {
        phases.push({
          ...blockMeta,
          kind: "superset",
          exercises: block.exercises,
          progressLabel: `Round ${round} of ${block.rounds}`,
        });
        if (round !== block.rounds) {
          phases.push({
            ...blockMeta,
            kind: "rest",
            duration: block.rest,
            upNext: block.exercises[0].name,
            progressLabel: `Round ${round} of ${block.rounds}`,
          });
        }
      }
    }

    // Straight Sets and Rep Ladders both boil down to "one exercise, several
    // sets" — Chris found stepping through them one set/rest screen at a time
    // (2026-08-06) mostly empty space for very little info. Both now collapse
    // into a single "sets" phase: one screen listing every set with a weight
    // field and a check-off, popping a rest-timer overlay between sets
    // instead of a full screen change, with no rest after the last set.
    if (block.type === "straight") {
      const sets = [];
      for (let i = 1; i <= block.sets; i++) sets.push({ num: i, reps: block.reps });
      phases.push({
        ...blockMeta,
        kind: "sets",
        exerciseName: block.exercise.name,
        sets,
        restDuration: block.rest,
      });
    }

    if (block.type === "ladder") {
      const sets = block.scheme.map((reps, i) => ({ num: i + 1, reps }));
      phases.push({
        ...blockMeta,
        kind: "sets",
        exerciseName: block.exercise.name,
        sets,
        restDuration: block.rest,
      });
    }

    if (block.type === "amrap") {
      phases.push({
        ...blockMeta,
        kind: "amrap",
        duration: block.duration,
        exercises: block.exercises,
        progressLabel: "As Many Rounds As Possible",
      });
    }

    if (block.type === "emom") {
      phases.push({
        ...blockMeta,
        kind: "emom",
        duration: block.duration,
        interval: block.interval,
        exercises: block.exercises,
        progressLabel: "Every Minute On the Minute",
      });
    }
  });

  return phases;
}

// Per-exercise demo video, poppable over the AMRAP list without pausing the clock —
// the workout keeps running underneath, same as glancing at a demo mid-round would.
function openExerciseVideo(name) {
  document.getElementById("exercise-video-name").textContent = name;
  document.getElementById("exercise-video-overlay").classList.add("visible");
}

function closeExerciseVideo() {
  document.getElementById("exercise-video-overlay").classList.remove("visible");
}

// Whether the Straight Sets / Rep Ladder checklist shows a weight field for
// this exercise — set per-exercise via the "Track Weight Used" checkbox in
// the Exercise Library (admin), matched here by name since blocks reference
// exercises by name, not id (2026-08-07).
function exerciseTracksWeight(name) {
  const ex = EXERCISE_LIBRARY.find((e) => e.name === name);
  return ex ? !!ex.trackWeight : false;
}

const Player = {
  circuit: null,
  phases: [],
  index: 0,
  remaining: 0,
  intervalId: null,
  paused: false,
  amrapRounds: 0,
  startedAt: null,
  setsChecked: [],
  restIntervalId: null,
  restRemaining: 0,
  restSetIndex: null,
  restIsLastSet: false,

  start(circuit) {
    this.circuit = circuit;
    this.phases = buildPhaseQueue(circuit);
    this.index = 0;
    this.amrapRounds = 0;
    this.startedAt = Date.now();
    closeExerciseVideo();
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-player");
    this.renderPhase();
  },

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.dismissRestOverlay();
  },

  currentPhase() {
    return this.phases[this.index];
  },

  advance() {
    this.stop();
    this.index++;
    if (this.index >= this.phases.length) {
      this.finish();
      return;
    }
    this.renderPhase();
  },

  // ---- Straight Sets / Rep Ladder single-screen checklist (2026-08-06) ----
  // All sets for the block's one exercise sit on one screen; tapping Done on
  // a set pops a rest overlay on top rather than moving to a new screen.
  // Weight moved from the row into that popup (2026-08-07) — Chris didn't
  // want members rushing to type a number and hit Done at the same moment,
  // and didn't want a slow entry inflating real rest time, so Done starts
  // rest immediately and the weight field lives in the popup where they have
  // the whole rest period to fill it in. The last set has no rest to attach
  // it to, so it gets the same popup minus the countdown — a "nice work"
  // message and a Continue button instead of Skip Rest. Weight is still
  // UI-only for now (not saved anywhere) — the plan is per-exercise/rep-range
  // weight history and suggestions, saved for a future session per Chris.
  toggleSetChecked(setIndex) {
    if (this.setsChecked[setIndex]) return;
    this.setsChecked[setIndex] = true;
    const row = document.querySelector(`.player-set-row[data-set-index="${setIndex}"]`);
    if (row) {
      row.classList.add("done");
      const doneBtn = row.querySelector(".set-row-done-btn");
      if (doneBtn) {
        doneBtn.textContent = "✓ Done";
        doneBtn.disabled = true;
      }
    }
    const phase = this.currentPhase();
    const isLastSet = this.setsChecked.every(Boolean);
    this.showSetPopup(setIndex, phase, isLastSet);
  },

  showSetPopup(setIndex, phase, isLastSet) {
    this.restSetIndex = setIndex;
    this.restIsLastSet = isLastSet;

    const weightField = document.getElementById("rest-overlay-weight-field");
    const weightInput = document.getElementById("rest-overlay-weight-input");
    const weightSaveBtn = document.getElementById("rest-overlay-weight-save-btn");
    weightInput.value = "";
    weightSaveBtn.textContent = "Save";
    weightSaveBtn.disabled = false;
    weightField.style.display = exerciseTracksWeight(phase.exerciseName) ? "block" : "none";

    const clockWrap = document.getElementById("rest-overlay-clock-wrap");
    const clockEl = document.getElementById("rest-overlay-clock");
    const upNextEl = document.getElementById("rest-overlay-upnext");
    const skipBtn = document.getElementById("rest-overlay-skip-btn");

    if (this.restIntervalId) clearInterval(this.restIntervalId);
    this.restIntervalId = null;

    if (isLastSet) {
      clockWrap.style.display = "none";
      upNextEl.textContent = "Nice work — that's the last set of this exercise.";
      skipBtn.textContent = "Continue →";
    } else {
      clockWrap.style.display = "";
      upNextEl.textContent = `Up next: ${phase.exerciseName}`;
      skipBtn.textContent = "Skip Rest →";
      this.restRemaining = phase.restDuration;
      clockEl.textContent = formatClock(this.restRemaining);
      this.restIntervalId = setInterval(() => {
        this.restRemaining--;
        if (this.restRemaining <= 0) {
          this.dismissRestOverlay();
          return;
        }
        clockEl.textContent = formatClock(this.restRemaining);
      }, 1000);
    }

    document.getElementById("rest-timer-overlay").classList.add("visible");
  },

  // Reflects the popup's weight input onto the set row that's resting (still
  // just a DOM update, not persisted anywhere). Called both by the Save
  // button (2026-08-07, for an explicit "locked in" confirmation while
  // resting) and as a fallback when the popup closes on its own, so leaving
  // without tapping Save doesn't lose whatever was typed.
  applyWeightToRow() {
    if (this.restSetIndex === null) return;
    const weightInput = document.getElementById("rest-overlay-weight-input");
    const weightVal = weightInput.value.trim();
    if (!weightVal) return;
    const row = document.querySelector(`.player-set-row[data-set-index="${this.restSetIndex}"]`);
    const repsEl = row && row.querySelector(".set-row-reps");
    if (repsEl) {
      if (!repsEl.dataset.baseText) repsEl.dataset.baseText = repsEl.textContent;
      repsEl.textContent = `${repsEl.dataset.baseText} · ${weightVal} lbs`;
    }
  },

  saveRestWeight() {
    this.applyWeightToRow();
    const saveBtn = document.getElementById("rest-overlay-weight-save-btn");
    saveBtn.textContent = "✓ Saved";
    saveBtn.disabled = true;
  },

  // Hides the popup. Doesn't advance the phase itself — the last-set
  // "Continue" click handles that separately, so exiting mid-popup
  // (Player.stop()) can't accidentally skip ahead a phase.
  dismissRestOverlay() {
    if (this.restIntervalId) clearInterval(this.restIntervalId);
    this.restIntervalId = null;
    document.getElementById("rest-timer-overlay").classList.remove("visible");
    this.applyWeightToRow();
    this.restSetIndex = null;
    this.restIsLastSet = false;
  },

  finish() {
    const entry = logCompletion(this.circuit);
    currentCompletionEntry = entry;
    document.getElementById("workout-complete-text").textContent =
      `You completed all ${this.circuit.blocks.length} blocks of ${this.circuit.title}. 🔥`;
    // Real wall-clock time from tapping "Start Workout" to finishing the last phase —
    // runs the whole session regardless of which block/format is active, independent
    // of any single block's own clock (and not reduced by time spent paused).
    const elapsedSec = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;
    const statsEl = document.getElementById("workout-complete-stats");
    if (statsEl) {
      // Deliberately just Total Time here — Chris pulled Calories Burned/Avg Heart
      // Rate off this specific screen because clients were fixating on those numbers
      // post-workout and feeling like the session "didn't count" if a number came up
      // short. Calories/HR still exist and are tracked (Progress tab, Home, entry.*
      // fields) — this is a completion-screen-only change, not a data change.
      statsEl.innerHTML = `<div class="today-stat"><span class="today-stat-icon">⏱️</span><div><p class="today-stat-num">${formatClock(elapsedSec)}</p><p class="today-stat-label">Total Time</p></div></div>`;
    }
    setupBenchmarkScoreSection(this.circuit);
    const rpeSlider = document.getElementById("rpe-slider");
    rpeSlider.value = entry.rpe;
    document.getElementById("rpe-value").textContent = entry.rpe;
    showScreen("screen-workout");
  },

  exit() {
    this.stop();
    showTab(resolveBackTarget("tab-home"));
  },

  togglePause() {
    const phase = this.currentPhase();
    if (!["work", "rest", "amrap", "emom"].includes(phase.kind)) return;
    if (this.paused) {
      this.paused = false;
      document.getElementById("player-pause-btn").textContent = "Pause";
      this.runTimer();
    } else {
      this.paused = true;
      document.getElementById("player-pause-btn").textContent = "Resume";
      this.stop();
    }
  },

  // True only for the first phase of a block (including the very first phase of the
  // whole workout) — rounds/rest within a block still auto-chain hands-free once
  // that block has been started.
  isNewBlockStart() {
    if (this.index === 0) return true;
    return this.phases[this.index - 1].blockIndex !== this.currentPhase().blockIndex;
  },

  // Arms a timed phase without starting its countdown yet — lets the member see
  // what's coming (e.g. the AMRAP's exercise list) before committing to start it.
  awaitStart() {
    document.getElementById("player-start-btn").style.display = "block";
    // Rounds shouldn't be addable before the clock is actually running — otherwise
    // the full-width "+ Add Round" button sits directly under (and visually
    // collides with) the sticky Start button on the ready screen.
    document.getElementById("player-round-counter").style.display = "none";
  },

  beginPhaseTimer() {
    document.getElementById("player-start-btn").style.display = "none";
    document.getElementById("player-controls").style.display = "flex";
    if (this.currentPhase().kind === "amrap") {
      document.getElementById("player-round-counter").style.display = "flex";
    }
    this.runTimer();
  },

  runTimer() {
    this.stop();
    this.intervalId = setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.advance();
        return;
      }
      this.updateClock();
    }, 1000);
  },

  // For EMOM, the big clock shows time left in the *current minute* (resetting to
  // a fresh :60 each time the exercise changes) rather than the whole block's total —
  // members were losing track of where they were with only one continuously-draining
  // number. The overall block time still counts down in the small clock alongside it.
  updateClock() {
    const phase = this.currentPhase();
    if (phase.kind === "emom") {
      const elapsed = phase.duration - this.remaining;
      const minute = Math.floor(elapsed / phase.interval);
      const totalMinutes = Math.ceil(phase.duration / phase.interval);
      const secondsLeftInMinute = phase.interval - (elapsed % phase.interval);
      document.getElementById("player-clock").textContent = formatClock(secondsLeftInMinute);
      document.getElementById("player-total-clock").textContent = `${formatClock(this.remaining)} total remaining`;
      const ex = phase.exercises[minute % phase.exercises.length];
      document.getElementById("player-exercise-name").textContent = ex.name;
      document.getElementById("player-video-label").textContent = `Demo Video — ${ex.name}`;
      document.getElementById("player-sub-pill").textContent =
        `Minute ${Math.min(minute + 1, totalMinutes)} of ${totalMinutes} · ${ex.reps ? ex.reps + " reps" : ""}`;
    } else {
      document.getElementById("player-clock").textContent = formatClock(this.remaining);
    }
  },

  renderPhase() {
    const phase = this.currentPhase();
    this.paused = false;

    document.getElementById("player-block-label").textContent = phase.blockLabel;
    document.getElementById("player-progress-text").textContent =
      `Block ${phase.blockIndex + 1} of ${phase.totalBlocks}`;
    const pct = Math.round(((this.index) / this.phases.length) * 100);
    document.getElementById("player-progress-fill").style.width = `${pct}%`;

    // Reset all conditional sections
    document.getElementById("player-center").style.display = "none";
    document.getElementById("player-amrap-list").style.display = "none";
    document.getElementById("player-round-counter").style.display = "none";
    document.getElementById("player-controls").style.display = "none";
    document.getElementById("player-complete-set-btn").style.display = "none";
    document.getElementById("player-start-btn").style.display = "none";
    document.getElementById("player-format-explainer").style.display = "none";
    document.getElementById("player-total-clock").style.display = "none";
    document.getElementById("player-sets-list").style.display = "none";
    document.getElementById("player-superset-list").style.display = "none";
    document.getElementById("player-video-label").textContent = "Demo Video Placeholder";
    document.getElementById("player-pause-btn").textContent = "Pause";

    // Staff-authored block notes (set per-block in admin) show once, when that block
    // starts — reuses the same "new block" check as the Start-button gating below, so
    // a multi-round block doesn't repeat them every round, but a mixed workout (e.g.
    // AMRAP then EMOM) can show a different note when each new block begins.
    if (this.isNewBlockStart() && phase.blockNotes) {
      document.getElementById("player-format-explainer").style.display = "block";
      document.getElementById("player-format-explainer-title").textContent = "Before You Start";
      document.getElementById("player-format-explainer-body").textContent = phase.blockNotes;
    }

    if (phase.kind === "work" || phase.kind === "rest") {
      document.getElementById("player-exercise-name").textContent =
        phase.kind === "work" ? phase.exerciseName : "Rest";
      document.getElementById("player-sub-pill").textContent =
        phase.kind === "work" ? phase.progressLabel : `Up next: ${phase.upNext}`;
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = phase.kind === "work" ? "Work" : "Rest";
      document.getElementById("player-video").style.display = phase.kind === "work" ? "flex" : "none";
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart()) this.awaitStart(); else this.beginPhaseTimer();
    }

    if (phase.kind === "set") {
      document.getElementById("player-exercise-name").textContent = phase.exerciseName;
      document.getElementById("player-sub-pill").textContent =
        phase.progressLabel + (phase.reps ? ` · ${phase.reps} reps` : "");
      document.getElementById("player-video").style.display = "flex";
      document.getElementById("player-complete-set-btn").style.display = "block";
    }

    // Superset: both exercises on one screen (2026-08-07) — no persistent
    // video panel, each exercise row gets its own popup play button instead
    // (same pattern as the AMRAP list). Mark Set Complete advances to the
    // rest phase between rounds, same as every other kind.
    if (phase.kind === "superset") {
      document.getElementById("player-exercise-name").textContent = `${phase.exercises.length}-Exercise Superset`;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      const supersetListEl = document.getElementById("player-superset-list");
      supersetListEl.style.display = "flex";
      supersetListEl.innerHTML = phase.exercises
        .map((e, i) => `
          <div class="amrap-row">
            <div class="amrap-row-left">
              <span class="amrap-order-num">${i + 1}</span>
              <span>${e.name}</span>
            </div>
            <div class="amrap-row-right">
              ${e.reps ? `<span>${e.reps} reps</span>` : ""}
              <button class="amrap-play-btn" data-ex-name="${e.name}" title="Watch demo">▶</button>
            </div>
          </div>
        `)
        .join("");
      supersetListEl.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      document.getElementById("player-complete-set-btn").style.display = "block";
    }

    if (phase.kind === "sets") {
      document.getElementById("player-exercise-name").textContent = phase.exerciseName;
      document.getElementById("player-sub-pill").textContent =
        `${phase.sets.length} set${phase.sets.length === 1 ? "" : "s"}`;
      document.getElementById("player-video").style.display = "flex";
      document.getElementById("player-video-label").textContent = `Demo Video — ${phase.exerciseName}`;
      this.setsChecked = phase.sets.map(() => false);
      const listEl = document.getElementById("player-sets-list");
      listEl.style.display = "flex";
      // Weight now lives in the rest popup, not on the row (2026-08-07) —
      // Chris didn't want members rushing to type a number and hit the
      // checkbox at the same moment, and didn't want a slow entry inflating
      // real rest time. Tapping Done starts rest immediately; the weight
      // field shows up inside that popup where they have the whole rest
      // period to fill it in. See toggleSetChecked/showSetPopup.
      listEl.innerHTML = phase.sets.map((s, i) => `
        <div class="player-set-row" data-set-index="${i}">
          <span class="set-row-num">${s.num}</span>
          <span class="set-row-reps">${s.reps} reps</span>
          <button class="set-row-done-btn" data-set-index="${i}">Done</button>
        </div>
      `).join("");
      listEl.querySelectorAll(".set-row-done-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.toggleSetChecked(Number(btn.dataset.setIndex)));
      });
    }

    if (phase.kind === "amrap") {
      document.getElementById("player-exercise-name").textContent = phase.blockLabel;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "Time Remaining";
      document.getElementById("player-amrap-list").style.display = "block";
      document.getElementById("player-amrap-list").innerHTML = phase.exercises
        .map((e, i) => `
          <div class="amrap-row">
            <div class="amrap-row-left">
              <span class="amrap-order-num">${i + 1}</span>
              <span>${e.name}</span>
            </div>
            <div class="amrap-row-right">
              ${e.reps ? `<span>${e.reps} reps</span>` : ""}
              <button class="amrap-play-btn" data-ex-name="${e.name}" title="Watch demo">▶</button>
            </div>
          </div>
        `)
        .join("");
      document.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      // Visibility of player-round-counter is handled by awaitStart()/beginPhaseTimer()
      // below — it should only appear once the clock is actually running.
      document.getElementById("round-count").textContent = this.amrapRounds;
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart()) this.awaitStart(); else this.beginPhaseTimer();
    }

    if (phase.kind === "emom") {
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "flex";
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "This Minute";
      document.getElementById("player-total-clock").style.display = "block";
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart()) this.awaitStart(); else this.beginPhaseTimer();
    }
  },
};

// ---------------- Messaging ----------------

// Recomputed per CURRENT_MEMBER rather than a fixed seed — ids match the
// admin/staff apps' dm-<memberId>/group-<programId> convention exactly, which
// is what makes the live message bridge below actually land in the same
// thread on all three sides instead of three disconnected copies.
let CONVERSATIONS = [];
function memberConversations() {
  const list = [{ id: `dm-${CURRENT_MEMBER.id}`, type: "dm", name: "Burn Club Staff" }];
  if (CURRENT_MEMBER.programId) {
    list.push({ id: `group-${CURRENT_MEMBER.programId}`, type: "group", name: `${CURRENT_MEMBER.program} Group Chat` });
  }
  return list;
}

function conversationMessages(conversationId) {
  return MESSAGES.filter((m) => m.conversationId === conversationId);
}

function conversationPreview(conv) {
  const msgs = conversationMessages(conv.id);
  const last = msgs[msgs.length - 1];
  const prefix = last && last.senderId !== CURRENT_MEMBER.id && conv.type === "group" ? `${last.senderName.split(" ")[0]}: ` : last && last.senderId === CURRENT_MEMBER.id ? "You: " : "";
  return {
    lastText: last ? `${prefix}${last.text}` : "No messages yet.",
    lastTime: last ? last.time : "",
    unread: msgs.some((m) => m.senderId !== CURRENT_MEMBER.id && !m.read),
  };
}

function renderConversationRow(conv) {
  const preview = conversationPreview(conv);
  return `
    <div class="conversation-row" data-open-thread="${conv.id}">
      <div class="conversation-icon">${conv.type === "group" ? "👥" : "💬"}</div>
      <div class="conversation-text">
        <p class="conversation-name">${conv.name}</p>
        <p class="conversation-preview">${preview.lastText}</p>
      </div>
      <div class="conversation-meta">
        <span class="conversation-time">${preview.lastTime}</span>
        ${preview.unread ? `<span class="conversation-unread-dot"></span>` : ""}
      </div>
    </div>
  `;
}

function renderConversationList() {
  CONVERSATIONS = memberConversations();
  document.getElementById("conversation-list").innerHTML = CONVERSATIONS.map(renderConversationRow).join("");
  document.querySelectorAll("[data-open-thread]").forEach((row) => {
    row.addEventListener("click", () => openThread(row.dataset.openThread));
  });
}

function updateUnreadBadges() {
  const unreadCount = MESSAGES.filter((m) => m.senderId !== CURRENT_MEMBER.id && !m.read).length;
  document.querySelectorAll("[data-role='msg-unread-badge']").forEach((badge) => {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";
  });
}

function renderMessageBubble(m, isGroup) {
  const fromMe = m.senderId === CURRENT_MEMBER.id;
  return `
    <div class="msg-bubble-row ${fromMe ? "from-me" : ""}">
      <div class="msg-bubble">
        ${isGroup && !fromMe ? `<p class="msg-sender">${m.senderName}</p>` : ""}
        <p>${m.text}</p>
        <span class="msg-time">${m.time}</span>
      </div>
    </div>
  `;
}

let openThreadId = null;

function openThread(conversationId) {
  openThreadId = conversationId;
  CONVERSATIONS = memberConversations();
  const conv = CONVERSATIONS.find((c) => c.id === conversationId);
  if (!conv) return;
  document.getElementById("thread-title").textContent = conv.name;

  conversationMessages(conversationId).forEach((m) => {
    if (m.senderId !== CURRENT_MEMBER.id) m.read = true;
  });

  renderThreadMessages();
  updateUnreadBadges();
  showScreen("screen-thread");
  document.getElementById("bottom-nav").style.display = "none";
}

function renderThreadMessages() {
  const conv = CONVERSATIONS.find((c) => c.id === openThreadId);
  if (!conv) return;
  const isGroup = conv.type === "group";
  const list = document.getElementById("thread-messages");
  list.innerHTML = conversationMessages(openThreadId).map((m) => renderMessageBubble(m, isGroup)).join("");
  list.scrollTop = list.scrollHeight;
}

// Pushes locally AND into the shared localStorage bridge so admin/staff pick
// it up live (same-browser only — see LIVE_CIRCUITS_KEY's note in data.js).
function broadcastMessage(msg) {
  MESSAGES.push(msg);
  let live;
  try {
    live = JSON.parse(localStorage.getItem(LIVE_MESSAGES_KEY) || "[]");
  } catch (e) {
    live = [];
  }
  live.push(msg);
  localStorage.setItem(LIVE_MESSAGES_KEY, JSON.stringify(live));
}

function sendThreadMessage(text) {
  if (!openThreadId || !text.trim()) return;
  broadcastMessage({
    id: "msg-" + Date.now(),
    conversationId: openThreadId,
    senderId: CURRENT_MEMBER.id,
    senderName: CURRENT_MEMBER.name,
    isStaff: false,
    text: text.trim(),
    time: "Just now",
    read: true,
  });
  renderThreadMessages();
}

function openMessagesInbox() {
  renderConversationList();
  showScreen("screen-messages");
  document.getElementById("bottom-nav").style.display = "flex";
}

// ---------------- Live Session (faked — see data.js note on LIVE_SESSION) ----------------

let liveChatMessages = [];

function renderLiveBanner() {
  const banner = document.getElementById("live-now-banner");
  if (!LIVE_SESSION.isLive) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "flex";
  document.getElementById("live-now-title").textContent = LIVE_SESSION.title;
}

function renderLiveChatBubble(m) {
  return `
    <div class="msg-bubble-row ${m.me ? "from-me" : ""}">
      <div class="msg-bubble">
        ${!m.me ? `<p class="msg-sender">${m.name}</p>` : ""}
        <p>${m.text}</p>
      </div>
    </div>
  `;
}

function renderLiveChat() {
  const list = document.getElementById("live-chat-messages");
  list.innerHTML = liveChatMessages.map(renderLiveChatBubble).join("");
  list.scrollTop = list.scrollHeight;
}

function openLiveScreen() {
  if (!LIVE_SESSION.isLive) return;
  document.getElementById("live-video-title").textContent = LIVE_SESSION.title;
  document.getElementById("live-video-host").textContent = `with ${LIVE_SESSION.hostName}`;
  if (liveChatMessages.length === 0) liveChatMessages = LIVE_CHAT_SEED.slice();
  renderLiveChat();
  showScreen("screen-live");
  document.getElementById("bottom-nav").style.display = "none";
}

function sendLiveChatMessage(text) {
  if (!text.trim()) return;
  liveChatMessages.push({ id: `lc-${Date.now()}`, name: CURRENT_MEMBER.name, text: text.trim(), me: true });
  renderLiveChat();
}

// ---------------- Init ----------------

// Re-run whenever completion state may have changed (init, and on switching
// into Home/Workouts) so the "✓ Completed" grey-out is always current.
function renderCircuitLists() {
  const weeklyCircuits = CIRCUITS.filter((c) => c.category !== "stretch" && c.category !== "core-burn" && c.category !== "previous-week" && c.category !== "structured" && c.category !== "custom");
  const extraCircuits = CIRCUITS.filter((c) => c.category === "stretch" || c.category === "core-burn");
  const lastWeekCircuits = CIRCUITS.filter((c) => c.category === "previous-week");

  document.getElementById("home-circuit-list").innerHTML = weeklyCircuits.map(renderCircuitCard).join("");
  document.getElementById("circuits-list-full").innerHTML = weeklyCircuits.map(renderCircuitCard).join("");
  document.getElementById("circuits-list-extras").innerHTML = extraCircuits.map(renderCircuitCard).join("");
  document.getElementById("last-week-list").innerHTML = lastWeekCircuits.map(renderCompactCircuitRow).join("");

  document.querySelectorAll("[data-open-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
  });
}

function init() {
  COMPLETIONS = loadCompletions();
  renderCircuitLists();

  document.getElementById("community-feed").innerHTML = FEED.map(renderFeedItem).join("");
  document.getElementById("home-community-feed").innerHTML = FEED.map(renderHomeBuzzRow).join("");
  updateUnreadBadges();

  WEARABLE = loadWearableState();
  DAILY_STATS = loadDailyStats();
  renderTodayStats();
  renderWearableSection();

  MY_HABITS = loadMyHabits();
  HABIT_CHECKS = loadHabitChecks();
  renderHabitsSection();
  renderHabitManager();

  document.getElementById("profile-name").textContent = CURRENT_MEMBER.name;
  document.getElementById("profile-badge").style.display = CURRENT_MEMBER.badge ? "" : "none";
  document.getElementById("profile-badge").textContent = CURRENT_MEMBER.badge;
  document.getElementById("profile-email").textContent = CURRENT_MEMBER.email;
  document.getElementById("profile-program").textContent = CURRENT_MEMBER.program;
  document.getElementById("profile-member-since").textContent = CURRENT_MEMBER.memberSince;

  renderLiveBanner();
  applyMemberProgramMode();
}

// ---------------- Program mode (rolling vs. structured) ----------------
// Two demo member profiles (see MEMBER_PROFILES in data.js) so both program
// shapes can be previewed here: a "rolling" member sees today's Workouts tab
// unchanged; a "structured" member sees a Calendar tab instead, built from
// their own startDate projected onto SCHEDULE_TEMPLATES.

// A handful of back/exit buttons are hardcoded to "tab-home" (screen-detail,
// screen-workout, Player.exit()) — Home is hidden entirely for "library"
// profiles, so redirect just that one target to their actual landing tab.
function resolveBackTarget(tabId) {
  if (tabId === "tab-home" && CURRENT_MEMBER.scheduleType === "library") return "tab-library-home";
  return tabId;
}

function renderLibraryHomeTab() {
  document.getElementById("library-home-greeting").textContent = `Hi ${CURRENT_MEMBER.name} 👋`;
  document.getElementById("library-home-exercise-count").textContent = `${EXERCISE_LIBRARY.length} exercises to browse`;
  const mine = CIRCUITS.filter((c) => c.category === "custom" && c.ownerId === CURRENT_MEMBER.id);
  document.getElementById("library-home-workout-count").textContent = mine.length
    ? `${mine.length} saved workout${mine.length === 1 ? "" : "s"}`
    : "Nothing saved yet";
}

function applyMemberProgramMode() {
  const isStructured = CURRENT_MEMBER.scheduleType === "structured";
  const isLibraryOnly = CURRENT_MEMBER.scheduleType === "library";

  document.getElementById("nav-home-btn").style.display = isLibraryOnly ? "none" : "";
  document.getElementById("nav-library-home-btn").style.display = isLibraryOnly ? "" : "none";
  document.getElementById("nav-workouts-btn").style.display = (isStructured || isLibraryOnly) ? "none" : "";
  document.getElementById("nav-calendar-btn").style.display = isStructured ? "" : "none";
  document.getElementById("nav-community-btn").style.display = isLibraryOnly ? "none" : "";
  document.getElementById("nav-progress-btn").style.display = isLibraryOnly ? "none" : "";
  document.getElementById("nav-my-workouts-btn").style.display = isLibraryOnly ? "" : "none";
  document.getElementById("profile-wearables-section").style.display = isLibraryOnly ? "none" : "";
  document.getElementById("profile-habits-section").style.display = isLibraryOnly ? "none" : "";

  document.getElementById("calendar-program-label").textContent = CURRENT_MEMBER.program;
  if (isStructured) renderCalendarTab();
  if (isLibraryOnly) {
    mergeMyWorkoutsIntoCircuits();
    renderLibraryHomeTab();
    renderMyWorkoutsTab();
  }
}

function switchMemberProfile(id) {
  const profile = MEMBER_PROFILES.find((p) => p.id === id);
  if (!profile) return;
  CURRENT_MEMBER = profile;
  init();
  showTab(profile.scheduleType === "library" ? "tab-library-home" : "tab-home");
}

// If the admin app is open in another tab and publishes a new workout, pick it up
// live instead of requiring a manual reload — the "storage" event only fires in
// other tabs/windows on the same origin, which matches this bridge's same-browser scope.
window.addEventListener("storage", (e) => {
  if (e.key !== LIVE_CIRCUITS_KEY) return;
  let liveCircuits;
  try {
    liveCircuits = JSON.parse(e.newValue || "[]");
  } catch (err) {
    return;
  }
  liveCircuits.forEach((lc) => {
    const idx = CIRCUITS.findIndex((c) => c.id === lc.id);
    if (idx === -1) CIRCUITS.unshift(lc);
    else CIRCUITS[idx] = lc;
  });
  renderCircuitLists();
});

// Same bridge, for messages — a reply sent from admin or staff (same browser,
// different tab) shows up here without needing a reload.
window.addEventListener("storage", (e) => {
  if (e.key !== LIVE_MESSAGES_KEY) return;
  let liveMessages;
  try {
    liveMessages = JSON.parse(e.newValue || "[]");
  } catch (err) {
    return;
  }
  liveMessages.forEach((m) => {
    const idx = MESSAGES.findIndex((x) => x.id === m.id);
    if (idx === -1) MESSAGES.push(m);
    else MESSAGES[idx] = m;
  });
  updateUnreadBadges();
  if (document.getElementById("screen-messages").classList.contains("visible")) renderConversationList();
  if (document.getElementById("screen-thread").classList.contains("visible")) renderThreadMessages();
});

// Whole-day difference between two "YYYY-MM-DD" keys, built from local date
// parts (not `new Date(string)`, which parses as UTC — see dateKey's own note).
function daysBetween(startKey, endKey) {
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end - start) / 86400000);
}

function formatWeekdayDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function renderCalendarDayRow(date, member, template) {
  const today = new Date();
  const isToday = dateKey(date) === dateKey(today);
  const programDay = daysBetween(member.startDate, dateKey(date)) + 1;
  const item = template.find((d) => d.day === programDay);

  let bodyHtml;
  if (!item) {
    bodyHtml = `<span class="calendar-item-label calendar-item-muted">${programDay < 1 ? "Not started yet" : "Program complete"}</span>`;
  } else if (item.type === "rest") {
    bodyHtml = `<span class="calendar-item-label calendar-item-muted">Rest Day</span>`;
  } else {
    const circuit = CIRCUITS.find((c) => c.id === item.workoutId);
    if (!circuit) {
      bodyHtml = `<span class="calendar-item-label calendar-item-muted">Workout unavailable</span>`;
    } else {
      const completion = mostRecentCompletion(circuit.id);
      const isDoneToday = completion && completion.date === dateKey(date);
      bodyHtml = `
        <button class="calendar-item-btn ${isDoneToday ? "done" : ""}" data-open-circuit="${circuit.id}">
          <span class="calendar-item-label">${circuit.title}</span>
          <span class="calendar-item-meta">${circuit.meta}</span>
          ${isDoneToday ? `<span class="calendar-item-check">✓ Done</span>` : ""}
        </button>
      `;
    }
  }

  return `
    <div class="calendar-day-row ${isToday ? "today" : ""}">
      <div class="calendar-day-date">
        <span>${formatWeekdayDate(date)}</span>
        ${isToday ? `<span class="calendar-today-tag">Today</span>` : ""}
      </div>
      ${bodyHtml}
    </div>
  `;
}

function renderCalendarTab() {
  const member = CURRENT_MEMBER;
  const template = SCHEDULE_TEMPLATES[member.programId] || [];
  const today = new Date();

  const rows = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    rows.push(renderCalendarDayRow(date, member, template));
  }

  document.getElementById("calendar-day-list").innerHTML = rows.join("");
  document.querySelectorAll("#calendar-day-list [data-open-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
  });
}

// ---------------- Exercise Library ----------------
// A standalone browse/search/filter view over EXERCISE_LIBRARY — deliberately
// not wired into stats, streaks, challenges, or completions. It doesn't
// represent a "workout" being done, just reference material.

let libraryQuery = "";
let libraryBodyPart = "All";
let libraryEquipment = "All";

function renderLibraryFilters() {
  const bodyPartCats = ["All", ...BODY_PART_TAGS];
  document.getElementById("library-bodypart-filters").innerHTML = bodyPartCats
    .map((c) => `<button class="pill-filter ${c === libraryBodyPart ? "active" : ""}" data-filter-group="bodypart" data-filter-value="${c}">${c}</button>`)
    .join("");

  const equipmentCats = ["All", ...EQUIPMENT_TAGS];
  document.getElementById("library-equipment-filters").innerHTML = equipmentCats
    .map((c) => `<button class="pill-filter ${c === libraryEquipment ? "active" : ""}" data-filter-group="equipment" data-filter-value="${c}">${c}</button>`)
    .join("");
}

function renderExerciseLibraryTab() {
  renderLibraryFilters();

  const query = libraryQuery.trim().toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (libraryBodyPart !== "All" && !ex.bodyParts.includes(libraryBodyPart)) return false;
    if (libraryEquipment !== "All" && !ex.equipment.includes(libraryEquipment)) return false;
    if (query && !ex.name.toLowerCase().includes(query)) return false;
    return true;
  });

  document.getElementById("library-exercise-list").innerHTML = filtered.map((ex) => `
    <button class="exercise-lib-card" data-toggle-exercise="${ex.id}">
      <div class="exercise-lib-card-top">
        <p class="exercise-lib-name">${ex.name}</p>
        <span class="exercise-lib-caret">⌄</span>
      </div>
      <div class="exercise-lib-tags">
        ${ex.bodyParts.map((bp) => `<span class="status-pill">${bp}</span>`).join("")}
        <span class="status-pill">${ex.modality}</span>
      </div>
      <p class="exercise-lib-equipment">${ex.equipment.join(", ") || "No equipment"}</p>
      <p class="exercise-lib-technique">${ex.technique}</p>
    </button>
  `).join("") || `<p class="section-subtitle">No exercises match your filters.</p>`;

  document.querySelectorAll("#library-exercise-list [data-toggle-exercise]").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("expanded"));
  });
}

// ---------------- My Workouts (member-built, "library" profiles only) ----------------
// Custom workouts are stored per-member (keyed by CURRENT_MEMBER.id) so switching
// demo profiles doesn't mix one member's saved workouts into another's. On load
// they're merged into the shared CIRCUITS array (same pattern as the admin live-sync
// bridge) tagged category:"custom" + ownerId, so the existing detail/player screens
// work on them with zero changes — but weeklyCircuits explicitly excludes "custom"
// so they never leak into another profile's Home/Workouts lists.

const MY_WORKOUTS_STORAGE_PREFIX = "burnclub-my-workouts-";

function loadMyWorkouts(memberId) {
  const stored = localStorage.getItem(MY_WORKOUTS_STORAGE_PREFIX + memberId);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function saveMyWorkouts(memberId, list) {
  localStorage.setItem(MY_WORKOUTS_STORAGE_PREFIX + memberId, JSON.stringify(list));
}

function mergeMyWorkoutsIntoCircuits() {
  loadMyWorkouts(CURRENT_MEMBER.id).forEach((w) => {
    const idx = CIRCUITS.findIndex((c) => c.id === w.id);
    if (idx === -1) CIRCUITS.unshift(w);
    else CIRCUITS[idx] = w;
  });
}

function renderMyWorkoutsTab() {
  const mine = CIRCUITS.filter((c) => c.category === "custom" && c.ownerId === CURRENT_MEMBER.id);
  document.getElementById("my-workouts-list").innerHTML = mine.length
    ? mine.map(renderCircuitCard).join("")
    : `<p class="section-subtitle">You haven't built a workout yet. Tap "+ Build a Workout" to create your first one.</p>`;
  document.querySelectorAll("#my-workouts-list [data-open-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
  });
}

// ---------------- Workout Builder (guided, step-by-step) ----------------
// Deliberately only two formats (Timed Circuit / Superset), chosen via chip
// presets rather than free-typed numbers, per Chris's "dummy proof" bar —
// the goal is a member can't really get this wrong, not maximum flexibility.

let builderStep = 1;
let builderFormat = null; // "interval" | "superset"
let builderSelectedExercises = [];
let builderQuery = "";
let builderBodyPart = "All";
let builderWork = null;
let builderRest = null;
let builderRounds = null;
let builderReps = null;

function resetBuilder() {
  builderStep = 1;
  builderFormat = null;
  builderSelectedExercises = [];
  builderQuery = "";
  builderBodyPart = "All";
  builderWork = null;
  builderRest = null;
  builderRounds = null;
  builderReps = null;
  document.getElementById("builder-search").value = "";
  document.getElementById("builder-name-input").value = "";
  renderBuilderStep();
}

function renderBuilderStep() {
  document.querySelectorAll(".builder-step").forEach((el) => el.classList.remove("active"));
  document.getElementById(`builder-step-${builderStep}`).classList.add("active");
  document.getElementById("builder-back-btn").style.display = builderStep > 1 ? "" : "none";

  if (builderStep === 2) {
    document.getElementById("builder-step2-hint").textContent = builderFormat === "superset"
      ? "Pick at least 2 exercises to pair together."
      : "Pick 1 or more exercises for your stations.";
    renderBuilderExerciseList();
  }
  if (builderStep === 3) {
    document.getElementById("builder-step3-title").textContent = builderFormat === "interval" ? "Set the Timing" : "Set Reps & Rounds";
    renderBuilderTimingFields();
  }
  if (builderStep === 4) renderBuilderSummary();

  updateBuilderContinueState();
}

function renderBuilderFilters() {
  const cats = ["All", ...BODY_PART_TAGS];
  document.getElementById("builder-bodypart-filters").innerHTML = cats
    .map((c) => `<button class="pill-filter ${c === builderBodyPart ? "active" : ""}" data-filter-value="${c}">${c}</button>`)
    .join("");
}

function renderBuilderExerciseList() {
  renderBuilderFilters();
  const query = builderQuery.trim().toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (builderBodyPart !== "All" && !ex.bodyParts.includes(builderBodyPart)) return false;
    if (query && !ex.name.toLowerCase().includes(query)) return false;
    return true;
  });

  document.getElementById("builder-exercise-list").innerHTML = filtered.map((ex) => {
    const picked = builderSelectedExercises.includes(ex.name);
    return `
      <button class="exercise-lib-card builder-pick-card ${picked ? "picked" : ""}" data-pick-exercise="${ex.name}">
        <div class="exercise-lib-card-top">
          <p class="exercise-lib-name">${ex.name}</p>
          <span class="builder-pick-check">${picked ? "✓" : "+"}</span>
        </div>
        <div class="exercise-lib-tags">
          ${ex.bodyParts.map((bp) => `<span class="status-pill">${bp}</span>`).join("")}
        </div>
        <p class="exercise-lib-equipment">${ex.equipment.join(", ") || "No equipment"}</p>
      </button>
    `;
  }).join("") || `<p class="section-subtitle">No exercises match.</p>`;

  document.querySelectorAll("#builder-exercise-list [data-pick-exercise]").forEach((card) => {
    card.addEventListener("click", () => toggleBuilderExercise(card.dataset.pickExercise));
  });

  renderBuilderSelectedChips();
}

function toggleBuilderExercise(name) {
  const idx = builderSelectedExercises.indexOf(name);
  if (idx === -1) builderSelectedExercises.push(name);
  else builderSelectedExercises.splice(idx, 1);
  renderBuilderExerciseList();
  updateBuilderContinueState();
}

function renderBuilderSelectedChips() {
  document.getElementById("builder-selected-chips").innerHTML = builderSelectedExercises.map((name) => `
    <span class="builder-chip">${name} <button data-remove-exercise="${name}">×</button></span>
  `).join("");
  document.querySelectorAll("#builder-selected-chips [data-remove-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => toggleBuilderExercise(btn.dataset.removeExercise));
  });
}

function renderBuilderTimingFields() {
  const container = document.getElementById("builder-timing-fields");
  if (builderFormat === "interval") {
    container.innerHTML = `
      <p class="builder-field-label">Work time per station</p>
      <div class="pill-filter-row" data-chip-group="work">
        ${[20, 30, 40, 45, 60].map((s) => `<button class="pill-filter ${builderWork === s ? "active" : ""}" data-chip-value="${s}">${s}s</button>`).join("")}
      </div>
      <p class="builder-field-label">Rest between stations</p>
      <div class="pill-filter-row" data-chip-group="rest">
        ${[10, 15, 20, 30].map((s) => `<button class="pill-filter ${builderRest === s ? "active" : ""}" data-chip-value="${s}">${s}s</button>`).join("")}
      </div>
      <p class="builder-field-label">Rounds</p>
      <div class="pill-filter-row" data-chip-group="rounds">
        ${[2, 3, 4, 5].map((n) => `<button class="pill-filter ${builderRounds === n ? "active" : ""}" data-chip-value="${n}">${n}</button>`).join("")}
      </div>
    `;
  } else {
    container.innerHTML = `
      <p class="builder-field-label">Reps per exercise</p>
      <div class="pill-filter-row" data-chip-group="reps">
        ${[8, 10, 12, 15].map((n) => `<button class="pill-filter ${builderReps === n ? "active" : ""}" data-chip-value="${n}">${n}</button>`).join("")}
      </div>
      <p class="builder-field-label">Rounds</p>
      <div class="pill-filter-row" data-chip-group="rounds">
        ${[2, 3, 4, 5].map((n) => `<button class="pill-filter ${builderRounds === n ? "active" : ""}" data-chip-value="${n}">${n}</button>`).join("")}
      </div>
      <p class="builder-field-label">Rest between rounds</p>
      <div class="pill-filter-row" data-chip-group="rest">
        ${[30, 45, 60, 90].map((s) => `<button class="pill-filter ${builderRest === s ? "active" : ""}" data-chip-value="${s}">${s}s</button>`).join("")}
      </div>
    `;
  }
  container.querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest("[data-chip-group]").dataset.chipGroup;
      const val = Number(btn.dataset.chipValue);
      if (group === "work") builderWork = val;
      if (group === "rest") builderRest = val;
      if (group === "rounds") builderRounds = val;
      if (group === "reps") builderReps = val;
      renderBuilderTimingFields();
      updateBuilderContinueState();
    });
  });
}

function estimateCustomMinutes() {
  let seconds;
  if (builderFormat === "interval") {
    seconds = builderRounds * builderSelectedExercises.length * (builderWork + builderRest);
  } else {
    seconds = builderRounds * (builderSelectedExercises.length * 30 + builderRest);
  }
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

function renderBuilderSummary() {
  const formatLabel = builderFormat === "interval" ? "Timed Circuit" : "Superset";
  document.getElementById("builder-summary-card").innerHTML = `
    <p><strong>${formatLabel}</strong> · ~${estimateCustomMinutes()} min</p>
    <p>${builderSelectedExercises.join(", ")}</p>
    <p>${builderFormat === "interval"
      ? `${builderWork}s work / ${builderRest}s rest · ${builderRounds} rounds`
      : `${builderReps} reps each · ${builderRounds} rounds · ${builderRest}s rest between rounds`}</p>
  `;
}

function updateBuilderContinueState() {
  const btn = document.getElementById("builder-continue-btn");
  if (builderStep === 1) {
    btn.style.display = "none";
    return;
  }
  btn.style.display = "";
  if (builderStep === 2) {
    const min = builderFormat === "superset" ? 2 : 1;
    btn.disabled = builderSelectedExercises.length < min;
    btn.textContent = "Continue";
  } else if (builderStep === 3) {
    const valid = builderFormat === "interval"
      ? (builderWork && builderRest && builderRounds)
      : (builderReps && builderRounds && builderRest);
    btn.disabled = !valid;
    btn.textContent = "Continue";
  } else if (builderStep === 4) {
    btn.disabled = !document.getElementById("builder-name-input").value.trim();
    btn.textContent = "Save Workout";
  }
}

function saveBuiltWorkout() {
  const name = document.getElementById("builder-name-input").value.trim();
  if (!name) return;

  const block = builderFormat === "interval"
    ? { type: "interval", label: "Timed Circuit", rounds: builderRounds, work: builderWork, rest: builderRest, exercises: builderSelectedExercises.map((n) => ({ name: n })) }
    : { type: "superset", label: "Superset", rounds: builderRounds, rest: builderRest, exercises: builderSelectedExercises.map((n) => ({ name: n, reps: builderReps })) };

  const circuit = {
    id: `custom-${Date.now()}`,
    category: "custom",
    ownerId: CURRENT_MEMBER.id,
    tag: "Custom",
    title: name,
    meta: `${estimateCustomMinutes()} min · Custom`,
    color: "blue",
    desc: "Built by you.",
    blocks: [block],
  };

  const mine = loadMyWorkouts(CURRENT_MEMBER.id);
  mine.unshift(circuit);
  saveMyWorkouts(CURRENT_MEMBER.id, mine);
  CIRCUITS.unshift(circuit);

  resetBuilder();
  showTab("tab-my-workouts");
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    showTab("tab-home");
  });

  document.getElementById("guest-btn").addEventListener("click", () => {
    showTab("tab-home");
  });

  document.getElementById("guest-ff-btn").addEventListener("click", () => {
    switchMemberProfile("jordan-p");
  });

  document.getElementById("guest-library-btn").addEventListener("click", () => {
    switchMemberProfile("sam-r");
  });

  document.querySelectorAll("[data-tab-target]").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tabTarget));
  });

  document.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      progressRange = btn.dataset.range;
      renderProgressTab();
    });
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showTab(resolveBackTarget(btn.dataset.back)));
  });

  document.querySelectorAll("[data-action='open-messages']").forEach((btn) => {
    btn.addEventListener("click", openMessagesInbox);
  });
  document.getElementById("thread-back-btn").addEventListener("click", openMessagesInbox);
  document.getElementById("thread-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("thread-input");
    sendThreadMessage(input.value);
    input.value = "";
  });

  document.querySelectorAll("[data-action='open-live']").forEach((btn) => {
    btn.addEventListener("click", openLiveScreen);
  });
  document.getElementById("live-chat-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("live-chat-input");
    sendLiveChatMessage(input.value);
    input.value = "";
  });

  document.getElementById("start-circuit-btn").addEventListener("click", () => {
    const c = CIRCUITS.find((x) => x.id === openCircuitId);
    if (c) Player.start(c);
  });

  document.getElementById("player-exit-btn").addEventListener("click", () => Player.exit());
  document.getElementById("player-start-btn").addEventListener("click", () => Player.beginPhaseTimer());
  document.getElementById("exercise-video-close-btn").addEventListener("click", closeExerciseVideo);

  document.getElementById("cardio-log-btn").addEventListener("click", openCardioLogModal);
  document.getElementById("cardio-log-close-btn").addEventListener("click", closeCardioLogModal);
  document.getElementById("cardio-log-save-btn").addEventListener("click", saveCardioLogForm);
  document.getElementById("cardio-sync-btn").addEventListener("click", syncCardioFromWearable);
  document.querySelectorAll("#cardio-activity-picker .pill-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      cardioSelectedActivity = btn.dataset.activity;
      updateCardioActivityPicker();
    });
  });
  document.getElementById("player-pause-btn").addEventListener("click", () => Player.togglePause());
  document.getElementById("player-skip-btn").addEventListener("click", () => Player.advance());

  const rpeSlider = document.getElementById("rpe-slider");
  rpeSlider.addEventListener("input", () => {
    document.getElementById("rpe-value").textContent = rpeSlider.value;
  });
  rpeSlider.addEventListener("change", () => {
    if (!currentCompletionEntry) return;
    currentCompletionEntry.rpe = Number(rpeSlider.value);
    saveCompletions();
  });
  document.getElementById("benchmark-score-save-btn").addEventListener("click", saveBenchmarkScore);
  document.getElementById("player-complete-set-btn").addEventListener("click", () => Player.advance());
  document.getElementById("rest-overlay-skip-btn").addEventListener("click", () => {
    const wasLastSet = Player.restIsLastSet;
    Player.dismissRestOverlay();
    if (wasLastSet) Player.advance();
  });
  document.getElementById("rest-overlay-weight-save-btn").addEventListener("click", () => Player.saveRestWeight());
  // Editing after a Save resets the button so it's clear the locked-in value
  // is stale until they save again.
  document.getElementById("rest-overlay-weight-input").addEventListener("input", () => {
    const saveBtn = document.getElementById("rest-overlay-weight-save-btn");
    saveBtn.textContent = "Save";
    saveBtn.disabled = false;
  });
  document.getElementById("round-plus-btn").addEventListener("click", () => {
    Player.amrapRounds++;
    document.getElementById("round-count").textContent = Player.amrapRounds;
  });
  document.getElementById("round-minus-btn").addEventListener("click", () => {
    Player.amrapRounds = Math.max(0, Player.amrapRounds - 1);
    document.getElementById("round-count").textContent = Player.amrapRounds;
  });

  document.getElementById("library-search").addEventListener("input", (e) => {
    libraryQuery = e.target.value;
    renderExerciseLibraryTab();
  });
  document.getElementById("library-bodypart-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter-value]");
    if (!btn) return;
    libraryBodyPart = btn.dataset.filterValue;
    renderExerciseLibraryTab();
  });
  document.getElementById("library-equipment-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter-value]");
    if (!btn) return;
    libraryEquipment = btn.dataset.filterValue;
    renderExerciseLibraryTab();
  });

  document.getElementById("build-workout-btn").addEventListener("click", () => {
    resetBuilder();
    showScreen("screen-builder");
  });
  document.getElementById("library-home-build-btn").addEventListener("click", () => {
    resetBuilder();
    showScreen("screen-builder");
  });

  document.querySelectorAll("[data-format]").forEach((btn) => {
    btn.addEventListener("click", () => {
      builderFormat = btn.dataset.format;
      builderStep = 2;
      renderBuilderStep();
    });
  });

  document.getElementById("builder-back-btn").addEventListener("click", () => {
    if (builderStep > 1) {
      builderStep--;
      renderBuilderStep();
    }
  });

  document.getElementById("builder-continue-btn").addEventListener("click", () => {
    if (builderStep === 2) { builderStep = 3; renderBuilderStep(); }
    else if (builderStep === 3) { builderStep = 4; renderBuilderStep(); }
    else if (builderStep === 4) { saveBuiltWorkout(); }
  });

  document.getElementById("builder-search").addEventListener("input", (e) => {
    builderQuery = e.target.value;
    renderBuilderExerciseList();
  });
  document.getElementById("builder-bodypart-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter-value]");
    if (!btn) return;
    builderBodyPart = btn.dataset.filterValue;
    renderBuilderExerciseList();
  });
  document.getElementById("builder-name-input").addEventListener("input", updateBuilderContinueState);

  document.getElementById("logout-btn").addEventListener("click", () => {
    Player.stop();
    document.getElementById("main-app").classList.remove("visible");
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-login");
  });
});
