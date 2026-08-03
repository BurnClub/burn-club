// Burn Club prototype — navigation & workout player logic, no real backend.

// ---------------- Home / Circuits / Community / Progress rendering ----------------

function renderCircuitCard(c) {
  const completion = mostRecentCompletion(c.id);
  return `
    <button class="circuit-card color-${c.color}${completion ? " completed" : ""}" data-open-circuit="${c.id}">
      <div class="circuit-card-top">
        <span class="circuit-tag">${c.tag}</span>
        ${completion ? `<div class="circuit-completed-badge">✓ Completed<span class="circuit-completed-date">${formatShortDate(completion.date)}</span></div>` : ""}
      </div>
      <h3>${c.title}</h3>
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
const CATEGORY_COLOR_CLASS = { circuit: "cat-circuit", stretch: "cat-stretch", "core-burn": "cat-core-burn", "previous-week": "cat-circuit", structured: "cat-circuit" };
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
    if (!map[c.date]) map[c.date] = c;
  });
  return map;
}

function renderDayCell(date, byDate, today) {
  const key = dateKey(date);
  const entry = byDate[key];
  const classes = ["cal-day"];
  if (entry) classes.push("done", CATEGORY_COLOR_CLASS[entry.category] || "");
  if (date > today) classes.push("future");
  if (key === dateKey(today)) classes.push("today");
  return `<div class="${classes.join(" ")}" title="${entry ? entry.title : ""}">${date.getDate()}</div>`;
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
  const counts = { circuit: 0, stretch: 0, "core-burn": 0 };
  let minutes = 0;
  let calories = 0;
  items.forEach((c) => {
    const bucket = c.category === "previous-week" ? "circuit" : c.category;
    counts[bucket] = (counts[bucket] || 0) + 1;
    minutes += c.minutes || 0;
    calories += c.caloriesBurned || 0;
  });
  document.getElementById("stat-workouts").textContent = counts.circuit;
  document.getElementById("stat-stretch").textContent = counts.stretch;
  document.getElementById("stat-core-burn").textContent = counts["core-burn"];
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
    section.innerHTML = `<h2 class="section-title">This Week</h2><div class="calendar-grid">${renderWeekGrid()}</div>`;
  } else if (progressRange === "month") {
    section.innerHTML = `<h2 class="section-title">This Month</h2><div class="calendar-grid">${renderMonthGrid()}</div>`;
  } else {
    section.innerHTML = `<h2 class="section-title">This Year</h2><div class="archive-list">${renderYearBreakdown()}</div>`;
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
    <div>
      <p class="benchmark-name">${benchmark.name}</p>
      <p class="benchmark-subtitle">${benchmark.subtitle}</p>
    </div>
  `;

  if (results.length === 0) {
    return `
      <div class="benchmark-card">
        <div class="benchmark-card-top">${nameBlock}</div>
        <span class="benchmark-baseline-tag">Not yet tested</span>
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
      <div class="benchmark-card-top">
        ${nameBlock}
        <span class="benchmark-best">${formatBenchmarkScore(benchmark, best)}</span>
      </div>
      ${footer}
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
      return JSON.parse(stored);
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
  const today = DAILY_STATS.find((d) => d.date === dateKey(new Date())) || { steps: 0, calories: 0 };
  container.innerHTML = `
    <div class="today-stat"><span class="today-stat-icon">👣</span><div><p class="today-stat-num">${today.steps.toLocaleString()}</p><p class="today-stat-label">Steps Today</p></div></div>
    <div class="today-stat"><span class="today-stat-icon">🔥</span><div><p class="today-stat-num">${today.calories.toLocaleString()}</p><p class="today-stat-label">Calories Today</p></div></div>
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
function isHabitChecked(habit) {
  const todayLog = HABIT_CHECKS[dateKey(new Date())] || {};
  if (habit.id in todayLog) return todayLog[habit.id];
  if (habit.auto === "steps") {
    const today = DAILY_STATS.find((d) => d.date === dateKey(new Date()));
    return !!(WEARABLE.provider && today && today.steps >= habit.target);
  }
  return false;
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
    return;
  }
  container.innerHTML = MY_HABITS.map((h) => {
    const checked = isHabitChecked(h);
    return `
      <button class="habit-row ${checked ? "checked" : ""}" data-toggle-habit="${h.id}">
        <span class="habit-checkbox">${checked ? "✓" : ""}</span>
        <span class="habit-label">${h.label}</span>
        ${h.auto ? `<span class="habit-auto-tag">🔗 Auto</span>` : ""}
      </button>
    `;
  }).join("");
  document.querySelectorAll("[data-toggle-habit]").forEach((btn) => {
    btn.addEventListener("click", () => toggleHabit(btn.dataset.toggleHabit));
  });
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
  if (tabId === "tab-calendar") renderCalendarTab();
  if (tabId === "tab-library") renderExerciseLibraryTab();

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

    if (block.type === "superset") {
      for (let round = 1; round <= block.rounds; round++) {
        block.exercises.forEach((ex) => {
          phases.push({
            ...blockMeta,
            kind: "set",
            exerciseName: ex.name,
            reps: ex.reps,
            progressLabel: `Round ${round} of ${block.rounds}`,
          });
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

    if (block.type === "straight") {
      for (let set = 1; set <= block.sets; set++) {
        phases.push({
          ...blockMeta,
          kind: "set",
          exerciseName: block.exercise.name,
          reps: block.reps,
          progressLabel: `Set ${set} of ${block.sets}`,
        });
        if (set !== block.sets) {
          phases.push({
            ...blockMeta,
            kind: "rest",
            duration: block.rest,
            upNext: block.exercise.name,
            progressLabel: `Set ${set} of ${block.sets}`,
          });
        }
      }
    }

    if (block.type === "ladder") {
      block.scheme.forEach((reps, i) => {
        phases.push({
          ...blockMeta,
          kind: "set",
          exerciseName: block.exercise.name,
          reps,
          progressLabel: `Rung ${i + 1} of ${block.scheme.length}`,
        });
        if (i !== block.scheme.length - 1) {
          phases.push({
            ...blockMeta,
            kind: "rest",
            duration: block.rest,
            upNext: `${block.exercise.name} (${block.scheme[i + 1]} reps)`,
            progressLabel: `Rung ${i + 1} of ${block.scheme.length}`,
          });
        }
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

const Player = {
  circuit: null,
  phases: [],
  index: 0,
  remaining: 0,
  intervalId: null,
  paused: false,
  amrapRounds: 0,
  startedAt: null,

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
      const timeTile = `<div class="today-stat"><span class="today-stat-icon">⏱️</span><div><p class="today-stat-num">${formatClock(elapsedSec)}</p><p class="today-stat-label">Total Time</p></div></div>`;
      const wearableTiles = WEARABLE.provider
        ? `
          <div class="today-stat"><span class="today-stat-icon">🔥</span><div><p class="today-stat-num">${entry.caloriesBurned}</p><p class="today-stat-label">Calories Burned</p></div></div>
          <div class="today-stat"><span class="today-stat-icon">❤️</span><div><p class="today-stat-num">${entry.avgHeartRate}</p><p class="today-stat-label">Avg Heart Rate</p></div></div>
        `
        : "";
      statsEl.innerHTML = timeTile + wearableTiles;
    }
    setupBenchmarkScoreSection(this.circuit);
    const rpeSlider = document.getElementById("rpe-slider");
    rpeSlider.value = entry.rpe;
    document.getElementById("rpe-value").textContent = entry.rpe;
    showScreen("screen-workout");
  },

  exit() {
    this.stop();
    showTab("tab-home");
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
  },

  beginPhaseTimer() {
    document.getElementById("player-start-btn").style.display = "none";
    document.getElementById("player-controls").style.display = "flex";
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

    if (phase.kind === "amrap") {
      document.getElementById("player-exercise-name").textContent = phase.blockLabel;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "Time Remaining";
      document.getElementById("player-amrap-list").style.display = "block";
      document.getElementById("player-amrap-list").innerHTML = phase.exercises
        .map((e) => `
          <div class="amrap-row">
            <span>${e.name}</span>
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
      document.getElementById("player-round-counter").style.display = "flex";
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

function sendThreadMessage(text) {
  if (!openThreadId || !text.trim()) return;
  MESSAGES.push({
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
  const weeklyCircuits = CIRCUITS.filter((c) => c.category !== "stretch" && c.category !== "core-burn" && c.category !== "previous-week" && c.category !== "structured");
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

function applyMemberProgramMode() {
  const isStructured = CURRENT_MEMBER.scheduleType === "structured";
  document.getElementById("nav-workouts-btn").style.display = isStructured ? "none" : "";
  document.getElementById("nav-calendar-btn").style.display = isStructured ? "" : "none";
  document.getElementById("calendar-program-label").textContent = CURRENT_MEMBER.program;
  if (isStructured) renderCalendarTab();
}

function switchMemberProfile(id) {
  const profile = MEMBER_PROFILES.find((p) => p.id === id);
  if (!profile) return;
  CURRENT_MEMBER = profile;
  init();
  showTab("tab-home");
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
    btn.addEventListener("click", () => showTab(btn.dataset.back));
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

  document.getElementById("logout-btn").addEventListener("click", () => {
    Player.stop();
    document.getElementById("main-app").classList.remove("visible");
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-login");
  });
});
