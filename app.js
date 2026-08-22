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

// A member's community is the people on their own program (2026-08-13) —
// see FEED's own note in data.js. Falls back to showing everything if a
// profile somehow has no programId, so the card is never mysteriously empty.
function feedForCurrentMember() {
  if (!CURRENT_MEMBER.programId) return FEED;
  return FEED.filter((f) => f.programId === CURRENT_MEMBER.programId);
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
// Weeks" list, but for real workouts (Last Week's Workouts). Title only, no
// meta/completed-date line (2026-08-10, Chris: "necessary info only" — the
// completed dim/strikethrough treatment still applies via the .completed
// class, that's just a style, not extra text).
function renderCompactCircuitRow(c) {
  const completion = mostRecentCompletion(c.id);
  return `
    <button class="circuit-row-compact${completion ? " completed" : ""}" data-open-circuit="${c.id}">
      <span>${c.title}</span>
    </button>
  `;
}

// Per-member storage (2026-08-13). Completions, habits, habit check-offs,
// the wearable connection and daily stats were all single global keys, so
// switching demo profiles showed Jordan *Chris's* history, streak and stats
// — the programs were separate but the data underneath never was. Everything
// member-owned is now suffixed with the member id, matching the pattern
// the scheduled-items store already used.
function memberKey(base) {
  return `${base}-${CURRENT_MEMBER.id}`;
}

// ---------------- Progress / completion history ----------------

const COMPLETIONS_STORAGE_KEY = "burnclub-completions";
const BENCHMARK_RESULTS_STORAGE_KEY = "burnclub-benchmark-results";
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

// "previous-week" and "structured" are ordinary workouts as far as any stat
// is concerned — same content, just published through a different mechanism.
// Centralised because this normalisation has now been missed twice: once for
// previous-week (2026-07-24) and again for structured, which made a
// structured member's completions count as nothing in the Home week stats
// and the Progress donut (2026-08-13). Anything that buckets a completion's
// category for counting should go through here.
function statsBucket(category) {
  return category === "previous-week" || category === "structured" ? "circuit" : category;
}
let COMPLETIONS = [];
let progressRange = "week"; // "week" | "month" | "year"
let currentCompletionEntry = null; // the just-logged completion, for the RPE slider to update
let currentBenchmarkId = null; // set on finish() when the just-completed circuit is a benchmark

function loadCompletions() {
  const stored = localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedCompletionsForMember(CURRENT_MEMBER);
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveCompletions() {
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(COMPLETIONS));
}

// Benchmark scores persist per member exactly like completions (2026-08-17).
// They didn't until now — a retest score updated the Progress tab and then
// vanished on reload, which defeats the point of a benchmark: the comparison
// against your own first attempt only means anything if it accumulates.
function loadBenchmarkResults() {
  const stored = localStorage.getItem(memberKey(BENCHMARK_RESULTS_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedBenchmarkResults();
  localStorage.setItem(memberKey(BENCHMARK_RESULTS_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveBenchmarkResults() {
  localStorage.setItem(memberKey(BENCHMARK_RESULTS_STORAGE_KEY), JSON.stringify(BENCHMARK_RESULTS));
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

// ---------------- Weight used (2026-08-18) ----------------
// Weight entry existed only on Straight Sets / Rep Ladders, and even there it
// was written onto the row and thrown away at the end of the workout. Now it's
// recorded on the completion and kept per exercise, so the next session can
// show what you last lifted.

const WEIGHTS_STORAGE_KEY = "burnclub-last-weights";

function loadLastWeights() {
  try {
    return JSON.parse(localStorage.getItem(memberKey(WEIGHTS_STORAGE_KEY)) || "{}");
  } catch (e) {
    return {};
  }
}

// ---------------- Personal bests (2026-08-19) ----------------
// Derived, never stored. Every completion has carried its own `weights` map
// since weight tracking landed, so the lifting history already exists on the
// completion record — LAST_WEIGHTS only ever cached the most recent value for
// prefilling the input, it was never the history. Nothing here needs a new
// store or a migration; it reads what's already kept.
//
// Weight only, not weight x reps: the app records what was lifted, not how
// many times, so "best" here means heaviest ever used. A true 1RM would need
// reps captured per set.

function weightHistoryFor(name) {
  return COMPLETIONS
    .filter((c) => c.weights && c.weights[name])
    .map((c) => ({ weight: Number(c.weights[name]), date: c.date }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

// The heaviest lift for one exercise, plus what it beat — a best with nothing
// to compare against is just a number.
function personalBestFor(name) {
  const history = weightHistoryFor(name);
  if (!history.length) return null;
  let best = history[0];
  let previous = null;
  history.forEach((entry) => {
    if (entry.weight > best.weight) {
      previous = best;
      best = entry;
    }
  });
  return { name, best: best.weight, date: best.date, previous: previous ? previous.weight : null, sessions: history.length };
}

// Ordered by how recently the best was set, so a lift moving this month sits
// above one that peaked in March.
function personalBests() {
  const names = new Set();
  COMPLETIONS.forEach((c) => {
    if (c.weights) Object.keys(c.weights).forEach((n) => names.add(n));
  });
  return [...names]
    .map(personalBestFor)
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Called before the completion is written, so "previous best" doesn't include
// the session being logged. Returns only genuine improvements.
function newPersonalBests(weights) {
  if (!weights) return [];
  return Object.entries(weights).reduce((out, [name, weight]) => {
    const current = personalBestFor(name);
    const w = Number(weight);
    if (!current) {
      // A first-ever entry isn't a PR to celebrate — there's nothing beaten.
      return out;
    }
    if (w > current.best) out.push({ name, weight: w, previous: current.best });
    return out;
  }, []);
}

let prListExpanded = false;

// Renders into whatever element carries id="pr-list" — deliberately not tied
// to the Progress tab, since its placement there is provisional (2026-08-19,
// Chris: wants it elsewhere, hasn't decided where). Moving the section is a
// markup change only.
function renderPersonalBests() {
  const host = document.getElementById("pr-list");
  if (!host) return;
  const all = personalBests();
  if (!all.length) {
    host.innerHTML = `<p class="checkin-empty">Log a weight during a workout and your bests show up here.</p>`;
    return;
  }
  const shown = prListExpanded ? all : all.slice(0, 3);
  const hidden = all.length - shown.length;

  host.innerHTML = shown.map((pr) => `
    <div class="pr-row">
      <div class="pr-row-left">
        <span class="pr-exercise">${pr.name}</span>
        <span class="pr-meta">${formatShortDate(pr.date)} · ${pr.sessions} session${pr.sessions === 1 ? "" : "s"} logged</span>
      </div>
      <div class="pr-row-right">
        <span class="pr-weight">${pr.best}<span class="pr-unit">lbs</span></span>
        ${pr.previous ? `<span class="pr-delta">+${pr.best - pr.previous} on previous</span>` : ""}
      </div>
    </div>
  `).join("");

  if (hidden > 0 || prListExpanded) {
    host.insertAdjacentHTML("beforeend", `
      <button class="checkin-more-btn" id="pr-more-btn">
        ${prListExpanded ? "Show less" : `Show ${hidden} more`}
        <span class="checkin-caret">${prListExpanded ? "\u25B4" : "\u25BE"}</span>
      </button>
    `);
    host.querySelector("#pr-more-btn").addEventListener("click", () => {
      prListExpanded = !prListExpanded;
      renderPersonalBests();
    });
  }
}

// The moment worth catching: shown on the completion screen when a weight just
// beat the previous best, rather than leaving it to be discovered in Progress.
function renderPRBanner(prs) {
  const el = document.getElementById("pr-banner");
  if (!el) return;
  if (!prs || !prs.length) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.innerHTML = `
    <p class="pr-banner-title">${prs.length === 1 ? "New personal best" : `${prs.length} new personal bests`}</p>
    ${prs.map((p) => `<p class="pr-banner-line"><strong>${p.name}</strong> ${p.weight} lbs <span>&middot; beat ${p.previous}</span></p>`).join("")}
  `;
}

// ---------------- Daily Check-Ins (2026-08-19) ----------------
// Private by default: this never syncs anywhere on its own. The member can
// share a single entry into their coach thread by hand — see shareCheckin().
// Per-member key like everything else member-owned.

const CHECKIN_STORAGE_KEY = "burnclub-checkins";
const CHECKIN_DISMISS_KEY = "burnclub-checkin-dismissed";
let CHECKINS = [];

function loadCheckins() {
  const stored = localStorage.getItem(memberKey(CHECKIN_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedCheckins();
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveCheckins() {
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(CHECKINS));
}

function checkinFor(dateStr) {
  return CHECKINS.find((c) => c.date === dateStr) || null;
}

function todaysCheckin() {
  return checkinFor(dateKey(new Date()));
}

// One entry per day — checking in twice edits the day rather than stacking a
// second row, so the trend has exactly one point per date.
function saveCheckin({ mental, physical, note }) {
  const date = dateKey(new Date());
  const existing = checkinFor(date);
  if (existing) {
    Object.assign(existing, { mental, physical, note });
  } else {
    CHECKINS.push({ date, mental, physical, note, sharedAt: null });
  }
  CHECKINS.sort((a, b) => (a.date < b.date ? -1 : 1));
  saveCheckins();
}

// Asked once a day at most. Dismissing is remembered for that day only, so
// skipping today never turns the prompt off for good.
function checkinPromptDismissedToday() {
  return localStorage.getItem(memberKey(CHECKIN_DISMISS_KEY)) === dateKey(new Date());
}

function dismissCheckinPrompt() {
  localStorage.setItem(memberKey(CHECKIN_DISMISS_KEY), dateKey(new Date()));
}

// ---- capture ---------------------------------------------------------------

function openCheckinModal() {
  const existing = todaysCheckin();
  const mental = document.getElementById("checkin-mental");
  const physical = document.getElementById("checkin-physical");
  mental.value = existing ? existing.mental : 7;
  physical.value = existing ? existing.physical : 7;
  document.getElementById("checkin-mental-value").textContent = mental.value;
  document.getElementById("checkin-physical-value").textContent = physical.value;
  document.getElementById("checkin-note").value = existing ? existing.note || "" : "";
  document.getElementById("checkin-title").textContent = existing ? "Update today's check-in" : "How are you today?";
  document.getElementById("checkin-saved").style.display = "none";
  // "Not now" is only meaningful on a fresh day — once there's an entry the
  // button below is Done, not a dismissal.
  document.getElementById("checkin-skip-btn").textContent = existing ? "Close" : "Not now";
  document.getElementById("checkin-overlay").classList.add("visible");
}

function closeCheckinModal() {
  document.getElementById("checkin-overlay").classList.remove("visible");
}

function saveCheckinForm() {
  saveCheckin({
    mental: Number(document.getElementById("checkin-mental").value),
    physical: Number(document.getElementById("checkin-physical").value),
    note: document.getElementById("checkin-note").value.trim(),
  });
  document.getElementById("checkin-saved").style.display = "block";
  renderCheckinSection();
  renderCheckinAffordances();
  setTimeout(closeCheckinModal, 900);
}

// Asked on the first open of a day, and never again that day whether they
// answered or dismissed it. Deliberately not blocking: it's an overlay with a
// close button, not a gate in front of the app.
function maybePromptCheckin() {
  if (todaysCheckin() || checkinPromptDismissedToday()) return;
  openCheckinModal();
}

// The dot on the Home icon, and the post-workout nudge, both just answer
// "has today been logged yet".
function renderCheckinAffordances() {
  const done = !!todaysCheckin();
  const dot = document.getElementById("checkin-done-dot");
  if (dot) dot.style.display = done ? "block" : "none";
  const nudge = document.getElementById("complete-checkin-nudge");
  if (nudge) nudge.style.display = done ? "none" : "block";
}

// ---- read-back -------------------------------------------------------------

const CHECKIN_SERIES = [
  { key: "mental", label: "Mentally", color: "#788CE3" },
  // Not the palette's --danger: that sits at 2.94:1 on white, just under the
  // 3:1 floor. This is the same coral nudged until it passes (3.33:1), with
  // CVD separation from the blue of 19.7 (target 8) — computed, not eyeballed.
  { key: "physical", label: "Physically", color: "#E0685E" },
];

function recentCheckins(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = dateKey(cutoff);
  return CHECKINS.filter((c) => c.date >= cutoffKey).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Consecutive days with an entry, counting back from today. Yesterday still
// counts as alive — a streak shouldn't die because it's 9am.
function checkinStreak() {
  let streak = 0;
  const cursor = new Date();
  if (!todaysCheckin()) cursor.setDate(cursor.getDate() - 1);
  while (checkinFor(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// The point of the whole feature: a score alone is a diary, a score joined to
// training days says something the member couldn't otherwise see. Only shown
// once there's enough of both kinds of day to mean anything.
function checkinInsights() {
  const out = [];
  const window = recentCheckins(28);
  const trainingDates = new Set(COMPLETIONS.map((c) => c.date));
  const trained = window.filter((c) => trainingDates.has(c.date));
  const rested = window.filter((c) => !trainingDates.has(c.date));
  const avg = (list, key) => list.reduce((sum, c) => sum + c[key], 0) / list.length;

  if (trained.length >= 3 && rested.length >= 3) {
    const t = avg(trained, "physical"), r = avg(rested, "physical");
    // 0.8 of a point, not 0.4: a 4% gap on a 1-10 scale is noise, and an
    // insight that reports noise as a finding teaches people to ignore the
    // ones that aren't.
    const diff = Math.abs(t - r);
    if (diff >= 0.8) {
      out.push(`Physically you average <strong>${t.toFixed(1)}</strong> on days you train and <strong>${r.toFixed(1)}</strong> on days you don't.`);
    }
  }

  const streak = checkinStreak();
  if (streak >= 3) out.push(`<strong>${streak} days</strong> checked in a row.`);

  const last7 = recentCheckins(7), prior = CHECKINS.filter((c) => {
    const start = new Date(); start.setDate(start.getDate() - 13);
    const end = new Date(); end.setDate(end.getDate() - 7);
    return c.date >= dateKey(start) && c.date <= dateKey(end);
  });
  if (last7.length >= 3 && prior.length >= 3) {
    const now = avg(last7, "mental"), before = avg(prior, "mental");
    const delta = now - before;
    if (Math.abs(delta) >= 0.8) {
      out.push(`Mentally you're <strong>${delta > 0 ? "up" : "down"} ${Math.abs(delta).toFixed(1)}</strong> on last week.`);
    }
  }
  return out;
}

// Two series on one 1-10 axis — the case where a shared axis is right, since
// both measure the same thing on the same scale. Legend always (2 series), and
// both are direct-labelled at their last point, so identity never rests on
// colour alone. Markers only on that final point: 24 of them would be noise.
function renderCheckinChart(entries) {
  const host = document.getElementById("checkin-chart");
  if (!host) return;
  if (entries.length < 2) {
    host.innerHTML = `<p class="checkin-empty">Check in a few days running and your trend shows up here.</p>`;
    return;
  }

  const w = 300, h = 120, padL = 6, padR = 34, padT = 10, padB = 18;
  const x = (i) => padL + (i / (entries.length - 1)) * (w - padL - padR);
  const y = (v) => padT + (1 - (v - 1) / 9) * (h - padT - padB);

  const gridHtml = [1, 5.5, 10].map((v) =>
    `<line class="checkin-grid" x1="${padL}" x2="${w - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" />`
  ).join("");

  const seriesHtml = CHECKIN_SERIES.map((s) => {
    const d = entries.map((e, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(e[s.key]).toFixed(1)}`).join(" ");
    const last = entries[entries.length - 1];
    return `
      <path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${x(entries.length - 1).toFixed(1)}" cy="${y(last[s.key]).toFixed(1)}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2" />
      <text class="checkin-point-label" x="${(w - padR + 6).toFixed(1)}" y="${(y(last[s.key]) + 3.5).toFixed(1)}">${last[s.key]}</text>
    `;
  }).join("");

  const first = formatShortDate(entries[0].date);
  const lastDate = formatShortDate(entries[entries.length - 1].date);

  host.innerHTML = `
    <div class="checkin-legend">
      ${CHECKIN_SERIES.map((s) => `<span class="checkin-legend-item"><span class="checkin-swatch" style="background:${s.color}"></span>${s.label}</span>`).join("")}
    </div>
    <svg class="checkin-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Check-in scores over time">
      ${gridHtml}
      <text class="checkin-axis-label" x="${padL}" y="${h - 4}">${first}</text>
      <text class="checkin-axis-label checkin-axis-end" x="${w - padR}" y="${h - 4}">${lastDate}</text>
      ${seriesHtml}
    </svg>
  `;
}

let checkinListExpanded = false;

function renderCheckinSection() {
  const listEl = document.getElementById("checkin-entry-list");
  if (!listEl) return;
  const entries = recentCheckins(28);
  renderCheckinChart(entries);

  const insightsEl = document.getElementById("checkin-insights");
  const insights = checkinInsights();
  insightsEl.innerHTML = insights.length
    ? insights.map((t) => `<p class="checkin-insight">${t}</p>`).join("")
    : "";

  // Collapsed to the latest day by default (2026-08-19, Chris) — ten entries
  // was most of the section's height. The chart and the insights stay put:
  // they're the reason to open the section, and hiding them behind a tap would
  // turn it back into a diary.
  const all = [...entries].reverse().slice(0, 10);
  const recent = checkinListExpanded ? all : all.slice(0, 1);
  const hidden = all.length - recent.length;
  listEl.innerHTML = recent.length
    ? recent.map((e) => `
        <div class="checkin-entry">
          <div class="checkin-entry-head">
            <span class="checkin-entry-date">${formatShortDate(e.date)}</span>
            <span class="checkin-entry-scores">
              <span class="checkin-score"><span class="checkin-swatch" style="background:${CHECKIN_SERIES[0].color}"></span>${e.mental}</span>
              <span class="checkin-score"><span class="checkin-swatch" style="background:${CHECKIN_SERIES[1].color}"></span>${e.physical}</span>
            </span>
          </div>
          ${e.note ? `<p class="checkin-entry-note">${e.note}</p>` : ""}
          <button class="checkin-share-btn${e.sharedAt ? " shared" : ""}" data-share-checkin="${e.date}">
            ${e.sharedAt ? "✓ Sent to your coach" : "Send to coach"}
          </button>
        </div>
      `).join("")
    : `<p class="checkin-empty">No check-ins yet.</p>`;

  // Only worth a toggle when there's something behind it.
  if (hidden > 0 || checkinListExpanded) {
    listEl.insertAdjacentHTML("beforeend", `
      <button class="checkin-more-btn" id="checkin-more-btn">
        ${checkinListExpanded ? "Show less" : `Show ${hidden} more`}
        <span class="checkin-caret">${checkinListExpanded ? "\u25B4" : "\u25BE"}</span>
      </button>
    `);
    listEl.querySelector("#checkin-more-btn").addEventListener("click", () => {
      checkinListExpanded = !checkinListExpanded;
      renderCheckinSection();
    });
  }

  listEl.querySelectorAll("[data-share-checkin]").forEach((btn) => {
    btn.addEventListener("click", () => shareCheckin(btn.dataset.shareCheckin));
  });
}

// The only way anything here leaves the member's phone, and it's one entry at
// a time by hand. Goes into the existing coach DM thread, so staff see it as a
// message rather than as a feed they can browse.
function shareCheckin(dateStr) {
  const entry = checkinFor(dateStr);
  if (!entry || entry.sharedAt) return;
  const lines = [
    `Check-in — ${formatShortDate(entry.date)}`,
    `Mentally ${entry.mental}/10 · Physically ${entry.physical}/10`,
  ];
  if (entry.note) lines.push(`"${entry.note}"`);
  broadcastMessage({
    id: "msg-" + Date.now(),
    conversationId: `dm-${CURRENT_MEMBER.id}`,
    senderId: CURRENT_MEMBER.id,
    senderName: CURRENT_MEMBER.name,
    isStaff: false,
    text: lines.join("\n"),
    time: "Just now",
    read: true,
  });
  entry.sharedAt = dateKey(new Date());
  saveCheckins();
  renderCheckinSection();
}

function lastWeightFor(exerciseName) {
  const w = LAST_WEIGHTS[exerciseName];
  return w ? w.weight : null;
}

// Keyed by exercise name rather than id — the block schema stores names, and
// an exercise renamed in the library shouldn't silently inherit another's
// history.
function recordWeights(weights) {
  if (!weights) return;
  const today = dateKey(new Date());
  Object.entries(weights).forEach(([name, weight]) => {
    if (!weight) return;
    LAST_WEIGHTS[name] = { weight, date: today };
  });
  localStorage.setItem(memberKey(WEIGHTS_STORAGE_KEY), JSON.stringify(LAST_WEIGHTS));
}

let LAST_WEIGHTS = {};

function logCompletion(circuit, weights) {
  const minutes = parseInt(circuit.meta, 10) || 20;
  const entry = {
    id: `local-${Date.now()}`,
    workoutId: circuit.id,
    // Which scheduled day this satisfies, for programs whose sessions have
    // home/gym variants — doing either finishes the day (2026-08-14).
    slotId: circuit.slotId || null,
    title: circuit.title,
    category: circuit.category,
    date: dateKey(new Date()),
    minutes,
    caloriesBurned: estimateCalories(minutes),
    avgHeartRate: estimateHeartRate(),
    rpe: 5,
    // What they lifted, per exercise. Empty for bodyweight-only sessions.
    weights: weights && Object.keys(weights).length ? { ...weights } : null,
  };
  COMPLETIONS.push(entry);
  saveCompletions();
  recordWeights(weights);
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

// `date` defaults to today (the manual-log and wearable-sync callers), but
// completing a planned calendar session passes the day it was scheduled for
// so it lands on the right calendar day (2026-08-12).
function logCardioActivity({ activityType, distanceValue, minutes, source, date }) {
  const meta = CARDIO_ACTIVITY_TYPES.find((t) => t.id === activityType) || CARDIO_ACTIVITY_TYPES[0];
  const entry = {
    id: `cardio-${Date.now()}`,
    workoutId: null,
    title: `${activityType}${distanceValue ? ` — ${distanceValue} ${meta.unit}` : ""}`,
    category: "cardio-activity",
    date: date || dateKey(new Date()),
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

// The full prior period (2026-08-11) — previous calendar week/month/year, used
// for the stat bubbles' %-change badges. Deliberately the *whole* prior
// period (e.g. all 7 days of last week), not "the same number of days
// elapsed so far" — simpler to reason about and matches how "vs last week"
// reads colloquially, at the cost of being a slightly unfair comparison
// mid-week (comparing 3 days-in so far vs a full 7-day prior week).
function completionsInPreviousRange(range) {
  const today = new Date();
  let start, end;
  if (range === "week") {
    end = startOfWeek(today);
    end.setDate(end.getDate() - 1);
    start = new Date(end);
    start.setDate(start.getDate() - 6);
  } else if (range === "month") {
    end = new Date(today.getFullYear(), today.getMonth(), 0);
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else {
    start = new Date(today.getFullYear() - 1, 0, 1);
    end = new Date(today.getFullYear() - 1, 11, 31);
  }
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  return COMPLETIONS.filter((c) => c.date >= startKey && c.date <= endKey);
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

// Where a structured member is in their own program, all derived from their
// personal startDate — nobody shares a calendar in a structured program
// (2026-08-19). Returns null for rolling members and for anyone whose
// program hasn't started or has finished, so callers can fall back.
function memberProgramPosition() {
  const m = CURRENT_MEMBER;
  if (m.scheduleType !== "structured" || !m.startDate) return null;
  const template = SCHEDULE_TEMPLATES[m.programId] || [];
  if (!template.length) return null;

  const day = daysBetween(m.startDate, dateKey(new Date())) + 1;
  const totalDays = template.length;
  const totalWeeks = Math.ceil(totalDays / 7);
  // Clamped so a member who hasn't started, or who finished last month, still
  // gets a sensible week to look at rather than "Week 0" or "Week 12 of 8".
  const clampedDay = Math.min(Math.max(day, 1), totalDays);
  const week = Math.ceil(clampedDay / 7);
  const weekFirstDay = (week - 1) * 7 + 1;

  const weekItems = template.filter((it) => it.type === "workout" && it.day >= weekFirstDay && it.day <= weekFirstDay + 6);
  const dateForProgramDay = (pd) => {
    const d = parseDateKey(m.startDate);
    d.setDate(d.getDate() + (pd - 1));
    return d;
  };
  const doneThisWeek = weekItems.filter((it) => completionForSlotOnDate(it.workoutId, dateKey(dateForProgramDay(it.day)))).length;

  const allWorkouts = template.filter((it) => it.type === "workout");
  const doneAll = allWorkouts.filter((it) => completionForSlotOnDate(it.workoutId, dateKey(dateForProgramDay(it.day)))).length;

  return {
    day, clampedDay, totalDays, week, totalWeeks, weekFirstDay,
    weekStartDate: dateForProgramDay(weekFirstDay),
    scheduledThisWeek: weekItems.length,
    doneThisWeek,
    percentComplete: allWorkouts.length ? Math.round((doneAll / allWorkouts.length) * 100) : 0,
    notStarted: day < 1,
    finished: day > totalDays,
  };
}

function renderWeekGrid() {
  const today = new Date();
  // A structured member's strip follows their program week (days 8–14 of an
  // 8-week plan), not Sun–Sat — otherwise it straddles two program weeks and
  // disagrees with the "Week 2" language on every workout title.
  const pos = memberProgramPosition();
  const start = pos ? pos.weekStartDate : startOfWeek(today);
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
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Bar chart (2026-08-11) — was a plain text list ("January — 3 workouts").
// Same monthly counts, just plotted instead of printed. Single series (one
// hue, no legend needed per the dataviz skill's rules), current month
// picked out in --ink so "where am I now" is legible at a glance, direct
// value labels above each bar instead of a hover tooltip (this is a
// touch-only mobile surface — hover doesn't apply here).
function renderYearChart() {
  const today = new Date();
  const counts = new Array(12).fill(0);
  COMPLETIONS.forEach((c) => {
    // parseDateKey, not new Date(c.date) — the latter parses "YYYY-MM-DD" as
    // UTC midnight and can roll the date (and so the month) back a day in
    // timezones behind UTC. Same bug class fixed elsewhere via dateKey().
    const d = parseDateKey(c.date);
    if (d.getFullYear() === today.getFullYear()) counts[d.getMonth()]++;
  });

  const max = Math.max(1, ...counts);
  const barW = 18, gap = 8, chartH = 90, labelH = 16, valueH = 14;
  const width = 12 * (barW + gap) - gap;

  const bars = counts.map((count, i) => {
    const barH = count === 0 ? 0 : Math.max(6, Math.round((count / max) * chartH));
    const x = i * (barW + gap);
    const y = valueH + (chartH - barH);
    const isCurrentMonth = i === today.getMonth();
    return `
      <rect class="year-chart-bar${isCurrentMonth ? " current" : ""}" x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" />
      ${count > 0 ? `<text class="year-chart-value" x="${x + barW / 2}" y="${valueH + (chartH - barH) - 4}" text-anchor="middle">${count}</text>` : ""}
      <text class="year-chart-label${isCurrentMonth ? " current" : ""}" x="${x + barW / 2}" y="${valueH + chartH + 12}" text-anchor="middle">${MONTH_ABBR[i]}</text>
    `;
  }).join("");

  return `<svg class="year-chart" viewBox="0 0 ${width} ${valueH + chartH + labelH}" role="img" aria-label="Workouts completed per month this year">${bars}</svg>`;
}

// Home's "This Week" snapshot (2026-08-10) — a copy of the Progress tab's
// Week calendar, week-only (no Month/Year toggle), plus a 3-stat row Chris
// asked to add underneath: workouts done, stretch & core sessions, and
// cardio sessions. Same category buckets renderProgressTab() uses, just
// always scoped to this week regardless of the Progress tab's own range
// toggle.
//
// All three are plain counts. This one used to read "4/3" against a weekly
// target, which was Burn Club's cadence hardcoded for everyone and read as
// nonsense for a member on a different program — dropped entirely rather
// than made per-program, since Chris wanted the number to be unambiguous
// (2026-08-13).

function renderHomeWeekSnapshot() {
  const grid = document.getElementById("home-week-grid");
  if (!grid) return;
  grid.innerHTML = renderWeekGrid();

  // Structured members get program-shaped numbers instead. "Stretch & Core"
  // and "Cardio Sessions" are Burn Club's content split — a Fit & Functional
  // member has neither, so both sat at a permanent 0 (2026-08-19).
  const pos = memberProgramPosition();
  const titleEl = document.getElementById("home-week-title");
  if (pos) {
    // Week and day together (2026-08-19, Chris) — the week says where they are
    // in the plan, the day says where they are inside the week.
    const dayOfWeek = pos.clampedDay - pos.weekFirstDay + 1;
    if (titleEl) titleEl.textContent = pos.notStarted ? "Your Program" : `Week ${pos.week} · Day ${dayOfWeek}`;
    setWeekStat("home-week-circuits", pos.week, `of ${pos.totalWeeks} Weeks`);
    setWeekStat("home-week-stretch-core", `${pos.doneThisWeek}/${pos.scheduledThisWeek}`, "Done This Week");
    setWeekStat("home-week-cardio", `${pos.percentComplete}%`, "Program Complete");
    return;
  }
  if (titleEl) titleEl.textContent = "This Week";
  setWeekStat("home-week-circuits", null, "Workouts Done");
  setWeekStat("home-week-stretch-core", null, "Stretch & Core");
  setWeekStat("home-week-cardio", null, "Cardio Sessions");

  const items = completionsInRange("week");
  let circuits = 0, stretchCore = 0, cardio = 0;
  items.forEach((c) => {
    const bucket = statsBucket(c.category);
    if (bucket === "circuit") circuits++;
    else if (bucket === "stretch" || bucket === "core-burn") stretchCore++;
    else if (bucket === "cardio-activity") cardio++;
  });
  document.getElementById("home-week-circuits").textContent = circuits;
  document.getElementById("home-week-stretch-core").textContent = stretchCore;
  document.getElementById("home-week-cardio").textContent = cardio;
}

// The three tiles are shared between both program shapes, so the label moves
// with the number rather than being fixed in the markup.
function setWeekStat(numId, value, label) {
  const numEl = document.getElementById(numId);
  if (!numEl) return;
  if (value !== null) numEl.textContent = value;
  const labelEl = numEl.parentElement.querySelector(".stat-label");
  if (labelEl) labelEl.textContent = label;
}

// Donut, 4 categorical series in a fixed hue order (2026-08-11) — Workouts/
// Stretch/Core-Burn/Cardio, same counts the stat tiles above already show,
// just as a shape instead of 4 separate numbers. Always has a legend (the
// dataviz skill's rule for 2+ series) with direct counts since 4 series is
// within the "≤4 also direct-labeled" allowance. Empty state (no data yet
// this range) shows a flat grey ring rather than a broken/invisible chart.
const WORKOUT_MIX_SEGMENTS = [
  { key: "workouts", label: "Workouts", countKey: "circuit" },
  { key: "stretch", label: "Stretch", countKey: "stretch" },
  { key: "core-burn", label: "Core-Burn", countKey: "core-burn" },
  { key: "cardio", label: "Cardio", countKey: "cardio-activity" },
];

function renderWorkoutMixDonut(counts) {
  const segments = WORKOUT_MIX_SEGMENTS.map((s) => ({ ...s, value: counts[s.countKey] || 0 }));
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = 40, cx = 50, cy = 50, strokeWidth = 16;
  const circumference = 2 * Math.PI * r;
  const gap = 3;

  let ringHtml;
  if (total === 0) {
    ringHtml = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="donut-empty-ring" stroke-width="${strokeWidth}" />`;
  } else {
    let offset = 0;
    ringHtml = segments.filter((s) => s.value > 0).map((s) => {
      const frac = s.value / total;
      const segLen = Math.max(frac * circumference - gap, 0);
      const dash = `${segLen} ${circumference - segLen}`;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="donut-seg donut-seg-${s.key}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
      offset += frac * circumference;
      return el;
    }).join("");
  }

  const legend = segments.map((s) => `
    <div class="donut-legend-row">
      <span class="donut-legend-dot donut-seg-${s.key}"></span>
      <span class="donut-legend-label">${s.label}</span>
      <span class="donut-legend-count">${s.value}</span>
    </div>
  `).join("");

  return `
    <div class="workout-mix-donut-wrap">
      <svg class="workout-mix-donut" viewBox="0 0 100 100" role="img" aria-label="Breakdown of workout types this period">
        ${ringHtml}
        <text x="50" y="46" text-anchor="middle" class="donut-center-num">${total}</text>
        <text x="50" y="60" text-anchor="middle" class="donut-center-label">Total</text>
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>
  `;
}

// Circle "bubble" stat treatment (2026-08-11) — replaces the 6-tile stats
// card. The donut above now covers the 4 session-count stats (Workouts/
// Stretch/Core-Burn/Cardio); these two bubbles cover the remaining two
// (Burn Minutes, Calories Burned), each now also showing %-change vs the
// full prior period. Calories bubble keeps the existing wearable-gated
// visibility the old stat-calories-card tile had.
function statPercentChange(current, previous) {
  if (previous === 0) return current === 0 ? null : Infinity; // Infinity = "new" (no prior baseline to compare)
  return Math.round(((current - previous) / previous) * 100);
}

function renderStatDelta(pct) {
  if (pct === null) return `<span class="stat-bubble-delta neutral">No prior data</span>`;
  if (pct === Infinity) return `<span class="stat-bubble-delta up">▲ New</span>`;
  if (pct === 0) return `<span class="stat-bubble-delta neutral">No change</span>`;
  const up = pct > 0;
  return `<span class="stat-bubble-delta ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(pct)}%</span>`;
}

function renderStatBubbles(minutes, calories) {
  const prevItems = completionsInPreviousRange(progressRange);
  let prevMinutes = 0, prevCalories = 0;
  prevItems.forEach((c) => {
    prevMinutes += c.minutes || 0;
    prevCalories += c.caloriesBurned || 0;
  });
  const showCalories = !!WEARABLE.provider;
  const periodLabel = progressRange === "week" ? "last week" : progressRange === "month" ? "last month" : "last year";

  return `
    <div class="stat-bubbles-row">
      <div class="stat-bubble stat-bubble-minutes">
        <p class="stat-bubble-num">${minutes}</p>
        <p class="stat-bubble-unit">min</p>
        ${renderStatDelta(statPercentChange(minutes, prevMinutes))}
      </div>
      ${showCalories ? `
        <div class="stat-bubble stat-bubble-calories">
          <p class="stat-bubble-num">${calories.toLocaleString()}</p>
          <p class="stat-bubble-unit">kcal</p>
          ${renderStatDelta(statPercentChange(calories, prevCalories))}
        </div>
      ` : ""}
    </div>
    <p class="stat-bubbles-caption">vs ${periodLabel}</p>
  `;
}

function renderProgressTab() {
  const items = completionsInRange(progressRange);
  const counts = { circuit: 0, stretch: 0, "core-burn": 0, "cardio-activity": 0 };
  let minutes = 0;
  let calories = 0;
  items.forEach((c) => {
    // Cardio-log entries get their own "Cardio Sessions" bucket (2026-08-09)
    // instead of folding into "Workouts Done".
    const bucket = statsBucket(c.category);
    counts[bucket] = (counts[bucket] || 0) + 1;
    minutes += c.minutes || 0;
    calories += c.caloriesBurned || 0;
  });
  document.getElementById("workout-mix-donut").innerHTML = renderWorkoutMixDonut(counts);
  document.getElementById("stat-bubbles").innerHTML = renderStatBubbles(minutes, calories);

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
    section.innerHTML = `<h2 class="home-section-title">This Year</h2>${renderYearChart()}`;
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
  saveBenchmarkResults();

  document.getElementById("benchmark-score-saved").style.display = "";
  document.getElementById("benchmark-score-save-btn").style.display = "none";
}

// ---------------- Challenges ----------------

function currentChallenge() {
  const today = dateKey(new Date());
  return CHALLENGES.find((c) => today >= c.startDate && today <= c.endDate) || null;
}

// "YYYY-MM-DD" parsed as local-time components, not new Date(str) — that
// parses as UTC midnight and can roll the day back a date in timezones
// behind UTC (same class of bug fixed elsewhere via dateKey()).
function parseDateKey(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Habits count toward the challenge as a "perfect day" — all of the member's
// habits checked that date — worth the same points as one workout, rather
// than a smaller per-checkbox amount (2026-08-11, Chris's call via
// AskUserQuestion). Mirrors currentHabitStreak()'s all-habits-done check,
// just counted across a date range instead of a consecutive streak.
function perfectHabitDaysInRange(startDate, endDate) {
  if (MY_HABITS.length === 0) return 0;
  const cursor = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const today = new Date();
  let count = 0;
  while (cursor <= end && cursor <= today) {
    const key = dateKey(cursor);
    if (MY_HABITS.every((h) => isHabitCheckedOnDate(h, key))) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// Real breakdown by source (2026-08-11) — was one flat count × pointsPerWorkout
// with no category split. Cardio-log entries and habit "perfect days" both
// score at the same per-workout rate; everything else in COMPLETIONS
// (circuit/previous-week/structured/stretch/core-burn) buckets as "workouts".
function challengePointsBreakdown(challenge) {
  const inRange = COMPLETIONS.filter((c) => c.date >= challenge.startDate && c.date <= challenge.endDate);
  const cardioCount = inRange.filter((c) => c.category === "cardio-activity").length;
  const workoutCount = inRange.length - cardioCount;
  const habitDays = perfectHabitDaysInRange(challenge.startDate, challenge.endDate);
  const workouts = workoutCount * challenge.pointsPerWorkout;
  const cardio = cardioCount * challenge.pointsPerWorkout;
  const habits = habitDays * challenge.pointsPerWorkout;
  const adjustment = CURRENT_MEMBER.pointAdjustment || 0;
  return { workouts, cardio, habits, adjustment, total: workouts + cardio + habits + adjustment };
}

function challengePointsForMember(challenge) {
  return challengePointsBreakdown(challenge).total;
}

// Every 50 points is a "level" — shows how many members (seeded leaderboard
// + You) currently sit in each bracket (2026-08-11, replaces the
// always-visible leaderboard as the main at-a-glance view — Chris's members
// said a ranked leaderboard wasn't motivating for many of them). Level count
// scales with the highest score on the board, so it's never fewer levels
// than there are people to place.
function challengeLevels(standings) {
  const maxPoints = Math.max(50, ...standings.map((s) => s.points));
  const levelCount = Math.ceil(maxPoints / 50);
  const levels = [];
  for (let i = 1; i <= levelCount; i++) {
    const min = (i - 1) * 50 + 1;
    const max = i * 50;
    const count = standings.filter((s) => Math.max(1, Math.ceil(s.points / 50)) === i).length;
    const mine = standings.some((s) => s.me && Math.max(1, Math.ceil(s.points / 50)) === i);
    levels.push({ level: i, min, max, count, mine });
  }
  return levels.reverse(); // highest level first, reads top-down like a ladder
}

let challengeLeaderboardExpanded = false;

function renderChallengeCard() {
  const container = document.getElementById("challenge-card");
  const challenge = currentChallenge();
  if (!challenge) {
    container.innerHTML = `<div class="challenge-card"><p class="challenge-empty">No active challenge right now — check back soon!</p></div>`;
    return;
  }

  const breakdown = challengePointsBreakdown(challenge);
  const myPoints = breakdown.total;
  const reached = myPoints >= challenge.thresholdPoints;
  const pct = Math.min(100, Math.round((myPoints / challenge.thresholdPoints) * 100));

  const standings = [...CHALLENGE_LEADERBOARD, { name: "You", points: myPoints, me: true }].sort((a, b) => b.points - a.points);
  // Top 10 only for now (2026-08-11) — full ranked list felt like too much.
  // Chris's stated next step (not built yet): once there are enough members
  // that "You" might fall outside the top 10, show your own position "and
  // up" instead of always starting from #1 — deliberately deferred since it
  // doesn't matter with today's ~5-person seeded leaderboard.
  const topStandings = standings.slice(0, 10);
  const rowsHtml = topStandings.map((s, i) => renderLeaderRow({ rank: i + 1, name: s.name, stat: `${s.points} pts`, me: s.me })).join("");
  const levels = challengeLevels(standings);

  container.innerHTML = `
    <div class="challenge-card">
      <p class="challenge-eyebrow">Current Challenge</p>
      <h2 class="challenge-name">${challenge.name}</h2>
      <div class="challenge-points-row">
        <span class="challenge-points-num">${myPoints}</span>
        <span class="challenge-points-label">/ ${challenge.thresholdPoints} pts</span>
      </div>
      <div class="player-progress-track"><div class="player-progress-fill" style="width:${pct}%"></div></div>

      <div class="challenge-breakdown">
        <span><strong>${breakdown.workouts}</strong> from Workouts</span>
        <span><strong>${breakdown.habits}</strong> from Habits</span>
        <span><strong>${breakdown.cardio}</strong> from Cardio</span>
      </div>

      <p class="challenge-reward ${reached ? "reached" : ""}">${reached ? "🎉 You've hit the threshold — " + challenge.reward : `Reach ${challenge.thresholdPoints} points — ${challenge.reward}`}</p>

      <p class="challenge-levels-title">Levels (every 50 pts)</p>
      <div class="challenge-levels">
        ${levels.map((l) => `
          <div class="challenge-level-row ${l.mine ? "mine" : ""}">
            <span class="challenge-level-range">${l.min}–${l.max}</span>
            <div class="challenge-level-bar-track"><div class="challenge-level-bar-fill" style="width:${standings.length ? Math.round((l.count / standings.length) * 100) : 0}%"></div></div>
            <span class="challenge-level-count">${l.count}</span>
          </div>
        `).join("")}
      </div>

      <button class="challenge-leaderboard-toggle" id="challenge-leaderboard-toggle" type="button">
        <span>${challengeLeaderboardExpanded ? "Hide" : "See"} Top 10</span>
        <span class="challenge-leaderboard-caret ${challengeLeaderboardExpanded ? "expanded" : ""}">⌄</span>
      </button>
      <div class="leaderboard" id="challenge-leaderboard" style="display:${challengeLeaderboardExpanded ? "flex" : "none"};">${rowsHtml}</div>
    </div>
  `;

  document.getElementById("challenge-leaderboard-toggle").addEventListener("click", () => {
    challengeLeaderboardExpanded = !challengeLeaderboardExpanded;
    renderChallengeCard();
  });
}

// ---------------- Wearable (faked) ----------------

const WEARABLE_STORAGE_KEY = "burnclub-wearable";
const DAILY_STATS_STORAGE_KEY = "burnclub-daily-stats";
const WEARABLE_LABELS = { apple: "Apple Health", garmin: "Garmin" };
let WEARABLE = { ...WEARABLE_DEFAULT };
let DAILY_STATS = [];

function loadWearableState() {
  const stored = localStorage.getItem(memberKey(WEARABLE_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  localStorage.setItem(memberKey(WEARABLE_STORAGE_KEY), JSON.stringify(WEARABLE_DEFAULT));
  return { ...WEARABLE_DEFAULT };
}

function saveWearableState() {
  localStorage.setItem(memberKey(WEARABLE_STORAGE_KEY), JSON.stringify(WEARABLE));
}

function loadDailyStats() {
  const stored = localStorage.getItem(memberKey(DAILY_STATS_STORAGE_KEY));
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Backfill restingHR for stats saved before it existed (2026-08-09) —
      // otherwise anyone with an existing local session just sees blank/0.
      if (parsed.length && parsed[0].restingHR === undefined) {
        parsed.forEach((d) => { d.restingHR = 54 + Math.floor(Math.random() * 16); });
        localStorage.setItem(memberKey(DAILY_STATS_STORAGE_KEY), JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      // fall through and reseed
    }
  }
  const seeded = buildSeedDailyStats();
  localStorage.setItem(memberKey(DAILY_STATS_STORAGE_KEY), JSON.stringify(seeded));
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

// Same day last week, which is the comparison that holds a weekly training
// rhythm still: a Monday against a Monday rather than against yesterday
// (2026-08-19, Chris — "a +/- % relationship to the same day of the previous
// week perhaps?"). Returns null when there's nothing to compare against, so a
// brand-new member sees a clean number instead of a fake 0%.
function dailyStatDelta(field, lowerIsBetter) {
  const today = DAILY_STATS.find((d) => d.date === dateKey(new Date()));
  const prior = new Date();
  prior.setDate(prior.getDate() - 7);
  const lastWeek = DAILY_STATS.find((d) => d.date === dateKey(prior));
  if (!today || !lastWeek || !lastWeek[field]) return null;

  const pct = Math.round(((today[field] - lastWeek[field]) / lastWeek[field]) * 100);
  if (pct === 0) return { pct, text: "even", tone: "flat" };
  // "Good" isn't the same as "up" for every metric — a resting heart rate
  // falling is the improvement.
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return { pct, text: `${pct > 0 ? "+" : ""}${pct}%`, tone: good ? "up" : "down" };
}

function todayStatDeltaHtml(field, lowerIsBetter) {
  const d = dailyStatDelta(field, lowerIsBetter);
  if (!d) return "";
  return `<span class="today-stat-delta tone-${d.tone}" title="vs. the same day last week">${d.text}</span>`;
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
    <div class="today-stat"><span class="today-stat-icon">${ICON_STEPS}</span><div><p class="today-stat-num">${today.steps.toLocaleString()}${todayStatDeltaHtml("steps", false)}</p><p class="today-stat-label">Steps Today</p></div></div>
    <div class="today-stat"><span class="today-stat-icon">${ICON_FLAME}</span><div><p class="today-stat-num">${today.calories.toLocaleString()}${todayStatDeltaHtml("calories", false)}</p><p class="today-stat-label">Calories Today</p></div></div>
    <div class="today-stat"><span class="today-stat-icon">${ICON_HEART}</span><div><p class="today-stat-num">${today.restingHR}${todayStatDeltaHtml("restingHR", true)}</p><p class="today-stat-label">Resting HR</p></div></div>
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
  const stored = localStorage.getItem(memberKey(MY_HABITS_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  localStorage.setItem(memberKey(MY_HABITS_STORAGE_KEY), JSON.stringify(MY_HABITS_DEFAULT));
  return [...MY_HABITS_DEFAULT];
}

function saveMyHabits() {
  localStorage.setItem(memberKey(MY_HABITS_STORAGE_KEY), JSON.stringify(MY_HABITS));
}

function loadHabitChecks() {
  const stored = localStorage.getItem(memberKey(HABIT_CHECKS_STORAGE_KEY));
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (e) {
    return {};
  }
}

function saveHabitChecks() {
  localStorage.setItem(memberKey(HABIT_CHECKS_STORAGE_KEY), JSON.stringify(HABIT_CHECKS));
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

// ---------------- Profile settings popups (2026-08-12) ----------------
// Notifications / My Health Profile / Invite a Friend / Help & Support —
// making the Profile tab's settings rows actually do something. Health
// Profile is the one with real data to save; the other three are lighter
// (device-local prefs, or purely static content) so they don't need a
// backend bridge the way Health Profile does.

// My Health Profile — bridged to Admin via LIVE_HEALTH_PROFILES_KEY, the
// same same-browser-only localStorage bridge pattern already used for
// circuits and messages (see data.js). A real product would POST this to
// an account API; this is the closest a static prototype can get to
// "ties back to the back end" without one.
function loadHealthProfiles() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_HEALTH_PROFILES_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveHealthProfile(memberId, data) {
  const all = loadHealthProfiles();
  all[memberId] = { ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(LIVE_HEALTH_PROFILES_KEY, JSON.stringify(all));
}

function openHealthProfileScreen() {
  const saved = loadHealthProfiles()[CURRENT_MEMBER.id] || {};
  document.getElementById("hp-height").value = saved.height || "";
  document.getElementById("hp-weight").value = saved.weight || "";
  document.getElementById("hp-dob").value = saved.dob || "";
  document.getElementById("hp-sex").value = saved.sex || "";
  document.getElementById("hp-activity").value = saved.activityLevel || "";
  document.getElementById("hp-goal").value = saved.goal || "";
  document.getElementById("hp-target-weight").value = saved.targetWeight || "";
  document.getElementById("hp-injuries").value = saved.injuries || "";
  document.getElementById("hp-saved-note").style.display = "none";
  document.getElementById("health-profile-overlay").classList.add("visible");
}

function closeHealthProfileScreen() {
  document.getElementById("health-profile-overlay").classList.remove("visible");
}

function saveHealthProfileForm() {
  const data = {
    height: document.getElementById("hp-height").value.trim(),
    weight: document.getElementById("hp-weight").value.trim(),
    dob: document.getElementById("hp-dob").value,
    sex: document.getElementById("hp-sex").value,
    activityLevel: document.getElementById("hp-activity").value,
    goal: document.getElementById("hp-goal").value,
    targetWeight: document.getElementById("hp-target-weight").value.trim(),
    injuries: document.getElementById("hp-injuries").value.trim(),
  };
  saveHealthProfile(CURRENT_MEMBER.id, data);
  document.getElementById("hp-saved-note").style.display = "block";
}

// Notifications — device-local prefs only (no member-facing product would
// bridge these to staff/admin), so plain localStorage, not the shared key.
const NOTIF_PREFS_KEY = "burnclub-notif-prefs";
const NOTIF_TYPES = [
  { id: "workouts", label: "Workout Reminders" },
  { id: "messages", label: "New Messages" },
  { id: "community", label: "Community Activity" },
  { id: "challenges", label: "Challenge Updates" },
  { id: "weekly-summary", label: "Weekly Progress Summary" },
];
let NOTIF_PREFS = {};

function loadNotifPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || "null");
    if (stored) return stored;
  } catch (e) {}
  const defaults = {};
  NOTIF_TYPES.forEach((t) => { defaults[t.id] = true; });
  return defaults;
}

function saveNotifPrefs() {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(NOTIF_PREFS));
}

function renderNotifPrefs() {
  document.getElementById("notif-prefs-list").innerHTML = NOTIF_TYPES.map((t) => `
    <button class="notif-row ${NOTIF_PREFS[t.id] ? "checked" : ""}" data-toggle-notif="${t.id}" type="button">
      <span class="notif-checkbox">${NOTIF_PREFS[t.id] ? "✓" : ""}</span>
      <span class="notif-label">${t.label}</span>
    </button>
  `).join("");
  document.querySelectorAll("[data-toggle-notif]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleNotif;
      NOTIF_PREFS[id] = !NOTIF_PREFS[id];
      saveNotifPrefs();
      renderNotifPrefs();
    });
  });
}

function openNotificationsScreen() {
  NOTIF_PREFS = loadNotifPrefs();
  renderNotifPrefs();
  document.getElementById("notifications-overlay").classList.add("visible");
}

function closeNotificationsScreen() {
  document.getElementById("notifications-overlay").classList.remove("visible");
}

// Invite a Friend — code generated client-side from the member's name, no
// real referral backend behind it yet.
function referralCodeFor(member) {
  const base = (member.name || "MEMBER").toUpperCase().replace(/[^A-Z]/g, "");
  return `${base}-BURN`;
}

function openInviteScreen() {
  document.getElementById("invite-code").textContent = referralCodeFor(CURRENT_MEMBER);
  document.getElementById("invite-copied-note").style.display = "none";
  document.getElementById("invite-overlay").classList.add("visible");
}

function closeInviteScreen() {
  document.getElementById("invite-overlay").classList.remove("visible");
}

function copyInviteLink() {
  const code = document.getElementById("invite-code").textContent;
  const link = `https://burnclub.app/join?ref=${code}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).catch(() => {});
  }
  document.getElementById("invite-copied-note").style.display = "block";
}

// Help & Support — static FAQ + mailto, no ticketing system behind it.
function openSupportScreen() {
  document.getElementById("support-overlay").classList.add("visible");
}

function closeSupportScreen() {
  document.getElementById("support-overlay").classList.remove("visible");
}

// Block notes modal (2026-08-12) — opens by itself when a block loads and
// must be dismissed before the member can reach Start, which the overlay
// physically covers. Replaces the inline "Before You Start" panel that used
// to sit on the ready screen.
function openBlockNotes(blockLabel, notes) {
  document.getElementById("block-notes-eyebrow").textContent = blockLabel || "";
  document.getElementById("block-notes-body").textContent = notes;
  document.getElementById("block-notes-overlay").classList.add("visible");
}

function closeBlockNotes() {
  document.getElementById("block-notes-overlay").classList.remove("visible");
}

// ---------------- Block summary rendering (circuit detail screen) ----------------

// Collapsible per-exercise technique cue (2026-08-11) — pulls from the same
// EXERCISE_LIBRARY.technique field the Exercise Library tab's detail popup
// uses. Pass null/omit to hide it (AMRAP/superset phases show a list of
// exercises, not a single one under the title, so there's no one technique
// to show there yet). Always collapses back down on a new exercise so it
// never shows stale text left open from the previous one.
function setPlayerExerciseTechnique(exerciseName) {
  const toggle = document.getElementById("player-technique-toggle");
  const body = document.getElementById("player-technique-body");
  toggle.classList.remove("expanded");
  body.classList.remove("expanded");
  const ex = exerciseName ? EXERCISE_LIBRARY.find((x) => x.name === exerciseName) : null;
  if (ex && ex.technique) {
    toggle.style.display = "flex";
    body.textContent = ex.technique;
  } else {
    toggle.style.display = "none";
    body.textContent = "";
  }
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------- Static holds ----------------
// A hold is a modifier on an exercise, not an exercise of its own: one extra
// optional field (`hold`, in seconds) on a superset/AMRAP exercise entry, or
// on a straight-sets block where it applies to every set. Purely additive —
// anything saved before this has no `hold` and renders exactly as it did.
// Drop sets will land as a sibling field on the same entry rather than an
// overloaded "add-on" object, so the two never have to know about each other.

function holdLabel(seconds) {
  return `${seconds}s hold`;
}

// Tap to start, nothing to dismiss — during a hold their hands are on the
// weight, so the one interaction has to happen before they're set, not after.
// Deadline-driven like every other clock in the player (see runTimer): a hold
// that quietly stops counting when the screen sleeps is worse than no timer.
function startHoldTimer(btn) {
  if (btn.dataset.running === "1" || btn.dataset.done === "1") return;
  const seconds = Number(btn.dataset.holdSeconds);
  const endsAt = Date.now() + seconds * 1000;
  btn.dataset.running = "1";
  btn.classList.add("running");
  const tick = () => {
    const left = Math.round((endsAt - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(id);
      btn.dataset.running = "0";
      btn.dataset.done = "1";
      btn.classList.remove("running");
      btn.classList.add("done");
      btn.textContent = `✓ ${seconds}s`;
      // A hold-only set has no Done button, so the clock finishing is what
      // completes the set — same path as tapping Done, so the tick, the rest
      // popup and the weight prompt all behave identically.
      if (btn.dataset.autoSetIndex !== undefined) {
        Player.toggleSetChecked(Number(btn.dataset.autoSetIndex));
      }
      return;
    }
    btn.textContent = `${left}s`;
  };
  tick();
  const id = setInterval(tick, 250);
  holdTimerIds.push(id);
}

// Cleared whenever the player leaves a phase — a hold left running on a row
// that no longer exists would tick against a detached element forever.
let holdTimerIds = [];
function clearHoldTimers() {
  holdTimerIds.forEach(clearInterval);
  holdTimerIds = [];
}

// `mode` of "start" is for a hold-only prescription, where the row's own text
// already says how long it is and repeating it on the button is noise.
// `autoSetIndex` marks a hold that IS the set rather than an addition to it:
// finishing the clock finishes the set, so there's no Done button beside it
// and the timer running out has to do Done's job (2026-08-22, Chris).
function holdBtnHtml(seconds, mode, autoSetIndex) {
  if (!seconds) return "";
  const label = mode === "start" ? "Start" : `${seconds}s hold`;
  const auto = autoSetIndex === undefined ? "" : ` data-auto-set-index="${autoSetIndex}"`;
  return `<button class="hold-btn" data-hold-seconds="${seconds}" data-idle-label="${label}"${auto} title="Static hold — tap to start">${label}</button>`;
}

function wireHoldButtons(root) {
  root.querySelectorAll(".hold-btn").forEach((btn) => {
    btn.addEventListener("click", () => startHoldTimer(btn));
  });
}

function blockTypeLabel(type) {
  return {
    interval: "Circuit",
    superset: "Superset",
    straight: "Straight Sets",
    ladder: "Rep Ladder",
    amrap: "AMRAP",
    emom: "EMOM",
    "cardio-choice": "Cardio — Your Choice",
  }[type] || type;
}

function blockSummaryLine(block) {
  switch (block.type) {
    case "interval":
      return `${block.rounds} rounds · ${block.work}s work / ${block.rest}s rest`;
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
  // The hold belongs on this line rather than as its own bullet — a separate
  // bullet is exactly the "two exercises" reading the modifier exists to
  // avoid (2026-08-21).
  const suffix = (hold) => (hold ? ` + ${holdLabel(hold)}` : "");
  if (block.exercise) return [block.exercise.name + suffix(block.hold)];
  if (block.exercises) return block.exercises.map((e) => e.name + (e.reps ? ` (${e.reps} reps)` : "") + suffix(e.hold));
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
  if (tabId === "tab-home") renderHomeWeekSnapshot();
  if (tabId === "tab-circuits" || tabId === "tab-home") renderCardioLog();
  if (tabId === "tab-progress") { renderCheckinSection(); renderPersonalBests(); }
  if (tabId === "tab-home") renderCheckinAffordances();
  if (tabId === "tab-calendar") renderCalendarTab();

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

// ---------------- In-progress session (resume) ----------------
// Written continuously while the player runs and read on the way back in.
// Deliberately NOT a "pause on exit" handler: iOS can kill the app without
// running one, which is exactly the abandonment case this has to cover. So
// nothing is decided on the way out — we record what was true, and the
// decision happens on return, where it always gets to run.

const IN_PROGRESS_STORAGE_KEY = "burnclub-in-progress";
// Two hours (Chris, 2026-08-21): long enough that a phone call or a school
// run doesn't kill the session, short enough that you're never offered
// yesterday's workout over breakfast.
const RESUME_WINDOW_MS = 2 * 60 * 60 * 1000;
// How often the heartbeat refreshes lastSeenAt. Non-timed blocks have no tick
// of their own to piggyback on, so without this a straight-sets session would
// look "left" at whenever the last set was ticked.
const IN_PROGRESS_HEARTBEAT_MS = 15000;

function loadInProgress() {
  try {
    return JSON.parse(localStorage.getItem(memberKey(IN_PROGRESS_STORAGE_KEY))) || null;
  } catch (e) {
    return null;
  }
}

function clearInProgress() {
  localStorage.removeItem(memberKey(IN_PROGRESS_STORAGE_KEY));
}

// How many whole blocks were finished before the phase they stopped on.
// Phases carry their own blockIndex, so the block they're partway through is
// simply the count of the ones behind it.
function blocksCompletedAt(phases, index) {
  if (index >= phases.length) return phases.length ? phases[phases.length - 1].blockIndex + 1 : 0;
  return phases[index].blockIndex;
}

// Logs an abandoned session for the blocks that were actually finished, so a
// member who got two-thirds through and never came back still has it on their
// record and their coach still sees it. Reuses logCompletion so the entry is
// shaped like any other and reaches the same stats.
function logPartialCompletion(circuit, rec, blocksDone) {
  const partial = {
    ...circuit,
    title: `${circuit.title} (partial)`,
    // Pro-rated from the blocks completed rather than wall time — they were
    // away for hours, so the elapsed clock is meaningless here.
    meta: `${Math.max(1, Math.round((parseInt(circuit.meta, 10) || 20) * blocksDone / circuit.blocks.length))} min`,
  };
  return logCompletion(partial, rec.sessionWeights || {});
}

function showResumeOverlay({ title, body, primary, secondary, onPrimary, onSecondary }) {
  document.getElementById("resume-title").textContent = title;
  document.getElementById("resume-body").textContent = body;
  const primaryBtn = document.getElementById("resume-primary-btn");
  const secondaryBtn = document.getElementById("resume-secondary-btn");
  primaryBtn.textContent = primary;
  secondaryBtn.textContent = secondary;
  // onclick, not addEventListener: this overlay is reused for both outcomes
  // and can be raised more than once per page load, so handlers have to
  // replace rather than stack.
  primaryBtn.onclick = () => { document.getElementById("resume-overlay").classList.remove("visible"); onPrimary(); };
  secondaryBtn.onclick = () => { document.getElementById("resume-overlay").classList.remove("visible"); onSecondary(); };
  document.getElementById("resume-overlay").classList.add("visible");
}

function maybeOfferResume() {
  const rec = loadInProgress();
  if (!rec) return false;
  const circuit = CIRCUITS.find((c) => c.id === rec.circuitId);
  // The workout could have been unpublished or the member moved programs
  // while they were away — nothing to resume into, so drop it quietly.
  if (!circuit) { clearInProgress(); return false; }

  const phases = buildPhaseQueue(circuit);
  const blocksDone = blocksCompletedAt(phases, rec.index);
  const away = Date.now() - (rec.lastSeenAt || 0);

  if (away <= RESUME_WINDOW_MS) {
    showResumeOverlay({
      title: "Resume workout?",
      body: `You were partway through ${circuit.title} — block ${Math.min(blocksDone + 1, circuit.blocks.length)} of ${circuit.blocks.length}.`,
      primary: "Resume",
      secondary: "Start over",
      onPrimary: () => Player.resume(circuit, rec),
      onSecondary: () => { clearInProgress(); openCircuit(circuit.id); },
    });
    return true;
  }

  // Past the window it isn't the same session any more. Anything with real
  // work behind it is worth keeping; anything else just goes.
  if (blocksDone < 1) { clearInProgress(); return false; }
  showResumeOverlay({
    title: "Unfinished workout",
    body: `You finished ${blocksDone} of ${circuit.blocks.length} blocks of ${circuit.title} earlier, then left. Want it logged as a partial workout?`,
    primary: "Log as partial",
    secondary: "Discard",
    onPrimary: () => {
      logPartialCompletion(circuit, rec, blocksDone);
      clearInProgress();
      init();
      showTab("tab-home");
    },
    onSecondary: () => { clearInProgress(); },
  });
  return true;
}

// An unfinished workout outranks the daily check-in nudge — it's the more
// urgent of the two, and stacking both modals would bury one behind the other.
function onEnterApp() {
  if (maybeOfferResume()) return;
  maybePromptCheckin();
}

// ---------------- Workout player engine ----------------

// A set that asks for more than one thing — reps *then* a hold, and later a
// weight drop — gets a screen to itself, laid out like a superset round
// (2026-08-23, Chris). The reason isn't only that one set at a time is
// calmer: a single row can't express *order*. "12 reps | 20s hold | Done"
// puts three controls side by side and never says the reps come first, so
// nothing stopped a member starting the hold before they'd lifted anything.
// A list of numbered segments does say it.
//
// One action is still one row in the old checklist — a plain 3x12, or a
// hold-only set, has no sequence to communicate and would only cost three
// screens instead of one.
function setIsCompound(set) {
  return !!(set.reps && set.hold);
}

function compoundSegments(block, set) {
  const segments = [];
  if (set.reps) segments.push({ kind: "reps", name: block.exercise.name, reps: set.reps });
  if (set.hold) {
    segments.push({
      kind: "hold",
      // Falls back to the parent lift. `holdExercise` lets the hold point at
      // its own library entry for video and cues — a hold coaches differently
      // from the rep — while the set still logs as one exercise, so weight
      // history and PRs don't split in two.
      name: block.holdExercise || block.exercise.name,
      seconds: set.hold,
    });
  }
  return segments;
}

function pushSetPhases(phases, blockMeta, block, sets) {
  if (!sets.some(setIsCompound)) {
    phases.push({
      ...blockMeta,
      kind: "sets",
      exerciseName: block.exercise.name,
      sets,
      restDuration: block.rest,
    });
    return;
  }
  sets.forEach((set, i) => {
    phases.push({
      ...blockMeta,
      kind: "compound",
      exerciseName: block.exercise.name,
      segments: compoundSegments(block, set),
      progressLabel: `Set ${set.num} of ${sets.length}`,
    });
    // A real rest phase between sets rather than the popup the checklist
    // uses, matching how a superset rests between rounds.
    if (i !== sets.length - 1) {
      phases.push({
        ...blockMeta,
        kind: "rest",
        duration: block.rest,
        upNext: block.exercise.name,
        progressLabel: `Set ${set.num} of ${sets.length}`,
      });
    }
  });
}

function buildPhaseQueue(circuit) {
  const phases = [];
  const totalBlocks = circuit.blocks.length;

  circuit.blocks.forEach((block, blockIndex) => {
    // Circuits are timed. A rep-based one used to put a single exercise on
    // screen with a rest after every station, but that isn't how Chris
    // programs rep work — he rests once the whole set is done, which is what
    // a superset is. The builder no longer offers the rep-based option
    // (2026-08-18); anything already saved that way runs as a superset rather
    // than through a screen with no clock and the wrong instructions.
    const isRepBased = block.type === "interval" && block.timed === false;

    // Notes come from the block's format, not the block itself (see
    // BLOCK_FORMAT_NOTES in data.js) — staff no longer author these per
    // workout, so every block of a given type always has the same explainer.
    // A rep-based leftover takes the superset note, since that's the screen it
    // actually gets; keyed on type alone it would promise a clock it hasn't got.
    const noteKey = isRepBased ? "superset" : block.type;
    const blockMeta = { blockLabel: block.label, blockIndex, totalBlocks, blockType: block.type, noteKey, blockNotes: BLOCK_FORMAT_NOTES[noteKey] || "" };

    // Holds no exercises — the member picks the activity when they get there
    // (2026-08-19). One timed phase, so it reads as part of the session rather
    // than homework, and the total session clock stays honest.
    if (block.type === "cardio-choice") {
      phases.push({
        ...blockMeta,
        kind: "cardio-choice",
        duration: block.duration,
        progressLabel: `${Math.round(block.duration / 60)} minutes, your pick`,
      });
    }

    if (block.type === "interval" && !isRepBased) {
      for (let round = 1; round <= block.rounds; round++) {
        block.exercises.forEach((ex, exIndex) => {
          phases.push({
            ...blockMeta,
            kind: "work",
            exerciseName: ex.name,
            duration: block.work,
            progressLabel: `Round ${round} of ${block.rounds} · Station ${exIndex + 1} of ${block.exercises.length}`,
          });
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
    if (block.type === "superset" || isRepBased) {
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
      for (let i = 1; i <= block.sets; i++) sets.push({ num: i, reps: block.reps, hold: block.hold });
      pushSetPhases(phases, blockMeta, block, sets);
    }

    if (block.type === "ladder") {
      const sets = block.scheme.map((reps, i) => ({ num: i + 1, reps, hold: block.hold }));
      pushSetPhases(phases, blockMeta, block, sets);
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
  const ex = EXERCISE_LIBRARY.find((x) => x.name === name);
  document.getElementById("exercise-video-technique").textContent = ex ? ex.technique : "";
  document.getElementById("exercise-video-overlay").classList.add("visible");
}

function closeExerciseVideo() {
  document.getElementById("exercise-video-overlay").classList.remove("visible");
}

// The kinds that show one exercise at a time — timed circuits, straight sets,
// rep ladders and EMOM — have the persistent video panel rather than the
// per-row play buttons a superset or AMRAP list gets. Until now that panel was
// decoration: it couldn't be opened, and on a timed circuit it didn't even say
// which exercise it was for (2026-08-19). Naming the exercise on the panel is
// what makes it tappable — the overlay needs to know what to show.
function setPlayerVideo(exerciseName) {
  const panel = document.getElementById("player-video");
  const label = document.getElementById("player-video-label");
  if (!exerciseName) {
    delete panel.dataset.exName;
    panel.classList.remove("is-playable");
    label.textContent = "Demo Video Placeholder";
    return;
  }
  panel.dataset.exName = exerciseName;
  panel.classList.add("is-playable");
  label.textContent = `Demo Video — ${exerciseName}`;
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
  // The clock's source of truth is a wall-clock deadline, not `remaining`
  // (2026-08-21). `remaining` is still what everything else reads, but it is
  // now *computed* from this each tick rather than decremented by one.
  // A decrementing counter silently loses however long the OS stops firing
  // timers for, which on a backgrounded tab is the whole time you were away:
  // a 5s stall cost 4s of clock and never came back. Deriving it from
  // Date.now() means throttling can delay the repaint but can't change the
  // number it repaints to.
  deadlineAt: null,
  lastShownRemaining: null,
  heartbeatId: null,
  intervalId: null,
  paused: false,
  amrapRounds: 0,
  startedAt: null,
  setsChecked: [],
  notesShownFor: new Set(),
  restIntervalId: null,
  restRemaining: 0,
  restDeadlineAt: null,
  restSetIndex: null,
  restIsLastSet: false,

  start(circuit) {
    this.circuit = circuit;
    this.phases = buildPhaseQueue(circuit);
    this.index = 0;
    this.amrapRounds = 0;
    this.startedAt = Date.now();
    this.deadlineAt = null;
    this.lastShownRemaining = null;
    this.sessionWeights = {};
    this.cardioChoice = null;
    this.cardioMinutes = 0;
    // Reset per workout, so the explainers come back for the next session.
    this.notesShownFor = new Set();
    this.steppingBack = false;
    closeExerciseVideo();
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-player");
    this.renderPhase();
    this.startHeartbeat();
  },

  stop() {
    // Settle `remaining` off the deadline before the interval dies, so a pause
    // (or an advance that reads `remaining` on the way out, like the cardio
    // banking below) sees the true figure and not the last tick's. Guarded on
    // intervalId because stop() also runs when no clock is going, and
    // deadlineAt would still be holding a previous phase's value.
    if (this.intervalId) {
      this.syncRemaining();
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
    this.dismissRestOverlay();
  },

  syncRemaining() {
    if (this.deadlineAt === null) return;
    this.remaining = Math.round((this.deadlineAt - Date.now()) / 1000);
  },

  // Snapshot for the resume path. Cheap enough to call on every state change;
  // the heartbeat below covers the stretches where nothing changes (a member
  // resting between straight sets, say) so lastSeenAt stays honest.
  persist() {
    if (!this.circuit || this.index >= this.phases.length) return;
    const awaitingStart = document.getElementById("player-start-btn").style.display === "block";
    localStorage.setItem(memberKey(IN_PROGRESS_STORAGE_KEY), JSON.stringify({
      circuitId: this.circuit.id,
      index: this.index,
      kind: this.currentPhase().kind,
      // Only meaningful while a clock is actually running — awaiting Start or
      // paused, `remaining` is the truth and the deadline is stale.
      deadlineAt: this.intervalId ? this.deadlineAt : null,
      remaining: this.remaining,
      paused: this.paused,
      awaitingStart,
      startedAt: this.startedAt,
      lastSeenAt: Date.now(),
      amrapRounds: this.amrapRounds,
      sessionWeights: this.sessionWeights,
      setsChecked: this.setsChecked,
      cardioChoice: this.cardioChoice,
      cardioMinutes: this.cardioMinutes,
      notesShownFor: [...this.notesShownFor],
    }));
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatId = setInterval(() => this.persist(), IN_PROGRESS_HEARTBEAT_MS);
  },

  stopHeartbeat() {
    if (this.heartbeatId) clearInterval(this.heartbeatId);
    this.heartbeatId = null;
  },

  // Rebuilds the player from a stored record. How the clock comes back is the
  // only part that varies by format, and it's the whole policy in one place:
  //   AMRAP     — never stopped. Its clock is the workout, so it's read
  //               straight off the stored deadline and may already be spent.
  //   EMOM      — back to the top of the minute they were in, exactly where
  //               the Back button would land them.
  //   everything else — the phase they were on, from the top, full clock.
  // Anything that was already waiting on Start (or paused) stays that way.
  resume(circuit, rec) {
    this.circuit = circuit;
    this.phases = buildPhaseQueue(circuit);
    this.index = Math.min(rec.index, this.phases.length - 1);
    this.amrapRounds = rec.amrapRounds || 0;
    this.startedAt = rec.startedAt || Date.now();
    this.sessionWeights = rec.sessionWeights || {};
    this.cardioChoice = rec.cardioChoice || null;
    this.cardioMinutes = rec.cardioMinutes || 0;
    this.notesShownFor = new Set(rec.notesShownFor || []);
    this.steppingBack = false;
    this.paused = false;
    closeExerciseVideo();
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-player");

    const phase = this.currentPhase();
    const liveClock = !rec.awaitingStart && !rec.paused && rec.deadlineAt;

    if (liveClock && phase.kind === "amrap") {
      this.remaining = Math.round((rec.deadlineAt - Date.now()) / 1000);
      if (this.remaining <= 0) {
        // The cap ran out while they were away. The rounds they logged still
        // count; the block is simply over.
        this.renderPhase();
        this.advance();
        this.startHeartbeat();
        return;
      }
      this.resumeInto(phase, this.remaining, true);
    } else if (liveClock && phase.kind === "emom") {
      // Measured at lastSeenAt, not now. The whole point of the EMOM rule is
      // that the clock did NOT run while they were away, so counting to the
      // present would charge them for the absence and drop them minutes
      // further into the block than they ever got.
      const elapsed = phase.duration - Math.round((rec.deadlineAt - rec.lastSeenAt) / 1000);
      const minute = Math.max(0, Math.floor(elapsed / phase.interval));
      this.resumeInto(phase, phase.duration - minute * phase.interval, false);
    } else if (liveClock) {
      this.resumeInto(phase, phase.duration, false);
    } else {
      this.resumeInto(phase, rec.remaining || phase.duration, false);
    }
    this.restoreSetTicks(rec.setsChecked);
    this.startHeartbeat();
  },

  // renderPhase() decides the clock and the Start button for itself, so
  // resuming re-runs it and then overrides both.
  resumeInto(phase, remaining, running) {
    this.renderPhase();
    this.stop();
    this.remaining = remaining;
    this.updateClock();
    if (running) {
      this.beginPhaseTimer();
    } else if (phase.duration) {
      document.getElementById("player-controls").style.display = "none";
      this.awaitStart();
      this.renderBackBtn();
    } else {
      // No clock on this phase (sets, superset, compound), so there's nothing
      // for Start to start. renderPhase() has already put up the right
      // control — the checklist or Mark Set Complete — and offering Start
      // beside it would run a timer against an undefined duration.
      this.renderBackBtn();
    }
    this.persist();
  },

  // Set ticks are DOM state that renderPhase() rebuilds empty, so they have to
  // be re-applied after it. Only the visual half — showSetPopup isn't called,
  // since a resumed member shouldn't land in a rest popup they didn't trigger.
  restoreSetTicks(saved) {
    if (!Array.isArray(saved) || this.currentPhase().kind !== "sets") return;
    this.setsChecked = saved.slice();
    saved.forEach((checked, i) => {
      if (!checked) return;
      const row = document.querySelector(`.player-set-row[data-set-index="${i}"]`);
      if (!row) return;
      row.classList.add("done");
      const btn = row.querySelector(".set-row-done-btn");
      if (btn) { btn.textContent = "✓ Done"; btn.disabled = true; }
    });
  },

  currentPhase() {
    return this.phases[this.index];
  },

  advance() {
    // Bank the cardio time as its phase ends — counting it at finish() would
    // credit the full block to someone who skipped straight past it.
    const leaving = this.currentPhase();
    if (leaving && leaving.kind === "cardio-choice" && this.cardioChoice) {
      this.cardioMinutes += leaving.duration - Math.max(0, this.remaining);
    }
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
    this.persist();
    this.showSetPopup(setIndex, phase, isLastSet);
  },

  showSetPopup(setIndex, phase, isLastSet) {
    this.restSetIndex = setIndex;
    this.restIsLastSet = isLastSet;

    const weightField = document.getElementById("rest-overlay-weight-field");
    const weightInput = document.getElementById("rest-overlay-weight-input");
    const weightSaveBtn = document.getElementById("rest-overlay-weight-save-btn");
    weightInput.value = "";
    // Shows what they lifted last time as the placeholder, so the number they
    // need is usually a glance rather than a memory (2026-08-18).
    const last = lastWeightFor(phase.exerciseName);
    weightInput.placeholder = last ? `${last} lbs last time` : "lbs";
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
      this.restDeadlineAt = Date.now() + phase.restDuration * 1000;
      clockEl.textContent = formatClock(this.restRemaining);
      // Deadline-derived for the same reason as the phase clock above —
      // rest that quietly stops counting while the member reads a text is
      // rest they never actually took.
      this.restIntervalId = setInterval(() => {
        const left = Math.round((this.restDeadlineAt - Date.now()) / 1000);
        if (left <= 0) {
          this.dismissRestOverlay();
          return;
        }
        if (left === this.restRemaining) return;
        this.restRemaining = left;
        clockEl.textContent = formatClock(this.restRemaining);
      }, 250);
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
    // Was written onto the row and nowhere else until 2026-08-18. The heaviest
    // set of the block is the one worth keeping — later sets are often drop
    // sets, and taking the last one would record the lightest.
    const phase = this.currentPhase();
    const name = phase && phase.exerciseName;
    if (name) {
      const val = Number(weightVal);
      this.sessionWeights[name] = Math.max(val, this.sessionWeights[name] || 0);
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
    this.restDeadlineAt = null;
    document.getElementById("rest-timer-overlay").classList.remove("visible");
    this.applyWeightToRow();
    this.restSetIndex = null;
    this.restIsLastSet = false;
  },

  finish() {
    this.stopHeartbeat();
    clearInProgress();
    // Before logCompletion, deliberately: once this session is written its own
    // weights are part of the history and nothing can look like a PR.
    const prs = newPersonalBests(this.sessionWeights);
    const entry = logCompletion(this.circuit, this.sessionWeights);
    renderPRBanner(prs);
    // The cardio block is part of the workout, but the minutes belong in the
    // cardio log too — otherwise they'd be buried inside a structured-workout
    // completion and never reach the mix donut or the cardio count
    // (2026-08-19). Logged only if they actually did it.
    this.logCardioBlock();
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
      statsEl.innerHTML = `<div class="today-stat"><div><p class="today-stat-num">${formatClock(elapsedSec)}</p><p class="today-stat-label">Total Time</p></div></div>`;
    }
    setupBenchmarkScoreSection(this.circuit);
    const rpeSlider = document.getElementById("rpe-slider");
    rpeSlider.value = entry.rpe;
    document.getElementById("rpe-value").textContent = entry.rpe;
    showScreen("screen-workout");
  },

  exit() {
    this.stopHeartbeat();
    // Tapping the X is a deliberate quit, and that has always discarded.
    // The partial-log offer is for the abandonment case only -- see
    // maybeOfferResume().
    clearInProgress();
    this.stop();
    this.closeSkipConfirm();
    closeBlockNotes();
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
    this.persist();
  },

  // True only for the first phase of a block (including the very first phase of the
  // whole workout) — rounds/rest within a block still auto-chain hands-free once
  // that block has been started.
  isNewBlockStart() {
    if (this.index === 0) return true;
    return this.phases[this.index - 1].blockIndex !== this.currentPhase().blockIndex;
  },

  // ---- Going back (2026-08-18) ----
  // Until now nothing decremented index, so an accidental Skip left you either
  // finishing from the wrong place or exiting and starting the whole workout
  // over — losing weights entered, rounds counted and sets ticked off.
  //
  // EMOM is the odd one out. Its minutes aren't separate phases; the exercise
  // is computed from how much time is left, so going back a minute means
  // putting time back on the clock rather than moving between phases. That
  // does make the block run longer than programmed, which is right — you're
  // redoing a minute, so it should cost you one.

  // Where a back press would land inside an EMOM: the top of the minute you're
  // on, or — if you're already parked there — the top of the one before.
  // Returns null when there's nothing left to rewind to.
  emomBackTarget() {
    const phase = this.currentPhase();
    if (!phase || phase.kind !== "emom") return null;
    const elapsed = phase.duration - this.remaining;
    const minute = Math.floor(elapsed / phase.interval);
    const atMinuteStart = elapsed % phase.interval === 0;
    const target = atMinuteStart ? minute - 1 : minute;
    return target >= 0 ? target : null;
  },

  canGoBack() {
    if (this.emomBackTarget() !== null) return true;
    return this.index > 0;
  },

  back() {
    if (!this.canGoBack()) return;
    this.stop();

    const emomTarget = this.emomBackTarget();
    if (emomTarget !== null) {
      const phase = this.currentPhase();
      this.remaining = phase.duration - emomTarget * phase.interval;
      // Force the weight field to re-read whichever exercise that minute is,
      // since syncEmomWeightField skips work when the name hasn't changed.
      this.emomWeightFor = null;
      this.updateClock();
      this.pauseAfterBack();
      return;
    }

    this.index--;
    // Rewind rather than resume — you went back to redo the thing, so it
    // should hand you the whole interval again.
    this.steppingBack = true;
    this.renderPhase();
    this.steppingBack = false;
  },

  // Back always leaves the clock stopped, whatever the phase, so there's a
  // beat to get set up before it runs again.
  pauseAfterBack() {
    document.getElementById("player-controls").style.display = "none";
    document.getElementById("player-round-counter").style.display = "none";
    this.awaitStart();
    this.renderBackBtn();
  },

  renderBackBtn() {
    document.getElementById("player-back-btn").style.display = this.canGoBack() ? "block" : "none";
  },

  // ---- Skip confirmation (2026-08-18) ----
  // Skip sits next to Pause and is one tap. On a work phase it costs the
  // exercise; on an AMRAP or EMOM it discards the whole block, since those are
  // a single phase each. Names what's actually being skipped rather than
  // asking "are you sure?" about nothing in particular.
  skipConfirmText() {
    const phase = this.currentPhase();
    if (!phase) return "";
    switch (phase.kind) {
      case "rest":
        return `Skip the rest of this break and start ${phase.upNext} now?`;
      case "amrap":
      case "emom":
        return `This skips the whole ${phase.blockLabel} block, not just part of it.`;
      case "superset":
        return `Skip this round of ${phase.exercises.length} exercises?`;
      case "sets":
        return `Skip the remaining sets of ${phase.exerciseName}?`;
      default:
        return `Skip ${phase.exerciseName} and move on?`;
    }
  },

  requestSkip() {
    if (!this.currentPhase()) return;
    document.getElementById("skip-confirm-body").textContent = this.skipConfirmText();
    document.getElementById("skip-confirm-overlay").classList.add("visible");
  },

  closeSkipConfirm() {
    document.getElementById("skip-confirm-overlay").classList.remove("visible");
  },

  confirmSkip() {
    this.closeSkipConfirm();
    this.advance();
  },

  // Arms a timed phase without starting its countdown yet — lets the member see
  // what's coming (e.g. the AMRAP's exercise list) before committing to start it.
  // One place every weight field reports to, so the value survives the
  // re-renders each block type does between rounds/minutes.
  noteWeight(name, raw) {
    const val = String(raw).trim();
    if (val) this.sessionWeights[name] = Number(val);
    else delete this.sessionWeights[name];
    this.persist();
  },

  // EMOM rotates exercises minute by minute, so it gets one field that follows
  // the active exercise rather than a list of them. Only rebuilt when the
  // exercise actually changes — updateClock() runs every second, and swapping
  // the input each tick would wipe whatever was half-typed.
  syncEmomWeightField(exerciseName) {
    const wrap = document.getElementById("player-emom-weight");
    const input = document.getElementById("player-emom-weight-input");
    if (!exerciseTracksWeight(exerciseName)) {
      wrap.style.display = "none";
      this.emomWeightFor = null;
      return;
    }
    wrap.style.display = "flex";
    if (this.emomWeightFor === exerciseName) return;
    this.emomWeightFor = exerciseName;
    const last = lastWeightFor(exerciseName);
    input.value = this.sessionWeights[exerciseName] || "";
    input.placeholder = last ? `${last} last time` : "lbs";
    // Assigning oninput (rather than addEventListener) replaces the previous
    // exercise's handler instead of stacking another one on each rotation.
    input.oninput = () => this.noteWeight(exerciseName, input.value);
  },

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
    // Belt-and-braces: the notes modal has to be dismissed to reach Start, so
    // it should already be closed by the time we get here. Kept so no code
    // path can leave it stranded over a running timer — that was the old
    // inline panel's EMOM bug (2026-08-11), and it's cheap to prevent again.
    closeBlockNotes();
    if (this.currentPhase().kind === "amrap") {
      document.getElementById("player-round-counter").style.display = "flex";
    }
    this.runTimer();
  },

  runTimer() {
    this.stop();
    // Anchored to whatever `remaining` currently holds, which is what makes
    // pause/resume and the EMOM rewind work unchanged: they set `remaining`
    // and the next runTimer() turns it back into a deadline.
    this.deadlineAt = Date.now() + this.remaining * 1000;
    this.lastShownRemaining = null;
    // Persisted after the deadline is set, not before -- the stored record has
    // to carry the deadline the clock is actually running to.
    setTimeout(() => this.persist(), 0);
    // 250ms, not 1000ms. The tick is only a repaint trigger now, so a short
    // one costs nothing and means a tab returning from the background shows
    // the corrected time immediately rather than up to a second later.
    // updateClock still only runs when the whole second changes.
    this.intervalId = setInterval(() => {
      this.syncRemaining();
      if (this.remaining <= 0) {
        // Exactly one phase, even if the member was away long enough to
        // outlast several. Advancing lands on the next phase with a full
        // fresh clock; cascading through everything they missed would be
        // worse. Revisit alongside the resume-after-kill decision.
        this.advance();
        return;
      }
      if (this.remaining === this.lastShownRemaining) return;
      this.lastShownRemaining = this.remaining;
      this.updateClock();
    }, 250);
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
      setPlayerVideo(ex.name);
      document.getElementById("player-sub-pill").textContent =
        `Minute ${Math.min(minute + 1, totalMinutes)} of ${totalMinutes} · ${ex.reps ? ex.reps + " reps" : ""}`;
      setPlayerExerciseTechnique(ex.name);
      this.syncEmomWeightField(ex.name);
      // Unlike every other phase, whether an EMOM can go back changes as the
      // clock runs — there's nothing to rewind to in the first few seconds of
      // minute one, and something to rewind to ever after. Every other kind
      // depends only on the phase index, so renderPhase covers them.
      this.renderBackBtn();
    } else {
      document.getElementById("player-clock").textContent = formatClock(this.remaining);
    }
  },

  // Which activity they picked, per cardio block. Held on the player like
  // sessionWeights so it survives re-renders and rides into the completion.
  // Called on finish. A member who skipped the block, or never picked an
  // activity, records nothing rather than a guess.
  logCardioBlock() {
    if (!this.cardioMinutes || !this.cardioChoice) return;
    logCardioActivity({
      activityType: this.cardioChoice,
      distanceValue: 0,
      minutes: Math.round(this.cardioMinutes / 60),
      source: "workout",
    });
    renderCardioLog();
  },

  renderCardioPicker() {
    const host = document.getElementById("player-cardio-picker");
    const chosen = this.cardioChoice;
    host.innerHTML = CARDIO_ACTIVITY_TYPES.map((t) => `
      <button class="cardio-pick-btn${chosen === t.id ? " active" : ""}" data-cardio-pick="${t.id}">${t.id}</button>
    `).join("");
    host.querySelectorAll("[data-cardio-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.cardioChoice = btn.dataset.cardioPick;
        this.renderCardioPicker();
        this.persist();
      });
    });
  },

  renderPhase() {
    const phase = this.currentPhase();
    this.paused = false;
    clearHoldTimers();

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
    closeBlockNotes();
    document.getElementById("player-total-clock").style.display = "none";
    document.getElementById("player-sets-list").style.display = "none";
    document.getElementById("player-superset-list").style.display = "none";
    document.getElementById("player-emom-weight").style.display = "none";
    document.getElementById("player-cardio-picker").style.display = "none";
    document.getElementById("player-back-btn").style.display = "none";
    this.closeSkipConfirm();
    setPlayerVideo(null);
    document.getElementById("player-pause-btn").textContent = "Pause";

    // The explainer describes a *format*, so it shows once per format per
    // workout — not once per block (2026-08-19, Chris). Three straight-set
    // blocks used to mean the same paragraph three times, and identical
    // popups teach members to dismiss popups unread, which costs the reading
    // of the first one and of a genuinely different format later in the same
    // session. Per workout rather than ever: the knowledge decays, and a new
    // session is the right place to re-teach it.
    if (this.isNewBlockStart() && phase.blockNotes && !this.steppingBack && !this.notesShownFor.has(phase.noteKey)) {
      // Keyed on the note shown rather than the block type: a legacy rep-based
      // interval borrows the superset explainer, and keying on type would show
      // the same paragraph twice.
      this.notesShownFor.add(phase.noteKey);
      openBlockNotes(phase.blockLabel, phase.blockNotes);
    }

    if (phase.kind === "work" || phase.kind === "rest") {
      document.getElementById("player-exercise-name").textContent =
        phase.kind === "work" ? phase.exerciseName : "Rest";
      document.getElementById("player-sub-pill").textContent =
        phase.kind === "work" ? phase.progressLabel : `Up next: ${phase.upNext}`;
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = phase.kind === "work" ? "Work" : "Rest";
      document.getElementById("player-video").style.display = phase.kind === "work" ? "flex" : "none";
      setPlayerVideo(phase.kind === "work" ? phase.exerciseName : null);
      setPlayerExerciseTechnique(phase.kind === "work" ? phase.exerciseName : null);
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart() || this.steppingBack) this.awaitStart(); else this.beginPhaseTimer();
    }

    // The "set" phase kind that lived here is gone (2026-08-18) — it was the
    // one-exercise-per-screen rep-based circuit, which nothing produces now
    // that rep work is programmed as a superset.

    // Superset: every exercise on one screen (2026-08-07) — no persistent
    // video panel, each exercise row gets its own popup play button instead
    // (same pattern as the AMRAP list). Mark Set Complete advances to the
    // rest phase between rounds, same as every other kind.
    if (phase.kind === "superset") {
      document.getElementById("player-exercise-name").textContent = `${phase.exercises.length}-Exercise Superset`;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      setPlayerExerciseTechnique(null);
      const supersetListEl = document.getElementById("player-superset-list");
      supersetListEl.style.display = "flex";
      // Weight goes inline here rather than in the rest popup the way Straight
      // Sets does (2026-08-18). The reason weight moved off those rows was that
      // Done started the rest clock, so typing a number competed with finishing
      // the set. A superset has one Mark Set Complete at the end of the whole
      // list, so filling these in as you pick each weight up isn't racing
      // anything. Only shown for exercises flagged Track Weight Used.
      supersetListEl.innerHTML = phase.exercises
        .map((e, i) => {
          const tracks = exerciseTracksWeight(e.name);
          const last = lastWeightFor(e.name);
          return `
          <div class="amrap-row">
            <div class="amrap-row-left">
              <span class="amrap-order-num">${i + 1}</span>
              <span>${e.name}</span>
            </div>
            <div class="amrap-row-right">
              ${e.reps ? `<span>${e.reps} reps</span>` : ""}
              ${holdBtnHtml(e.hold)}
              ${tracks ? `<input type="number" class="superset-weight-input" inputmode="numeric"
                    data-ex-name="${e.name}"
                    value="${this.sessionWeights[e.name] || ""}"
                    placeholder="${last ? last : "lbs"}"
                    title="${last ? `Last time: ${last} lbs` : "Weight used"}" />` : ""}
              <button class="amrap-play-btn" data-ex-name="${e.name}" title="Watch demo">▶</button>
            </div>
          </div>
        `;
        })
        .join("");
      supersetListEl.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      wireHoldButtons(supersetListEl);
      // Held on the player, not the DOM, so it survives the re-render between
      // rounds and carries into the completion record.
      supersetListEl.querySelectorAll(".superset-weight-input").forEach((input) => {
        input.addEventListener("input", () => this.noteWeight(input.dataset.exName, input.value));
      });
      document.getElementById("player-complete-set-btn").style.display = "block";
    }

    if (phase.kind === "sets") {
      document.getElementById("player-exercise-name").textContent = phase.exerciseName;
      document.getElementById("player-sub-pill").textContent =
        `${phase.sets.length} set${phase.sets.length === 1 ? "" : "s"}`;
      document.getElementById("player-video").style.display = "flex";
      setPlayerVideo(phase.exerciseName);
      setPlayerExerciseTechnique(phase.exerciseName);
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
          <span class="set-row-reps">${s.reps ? `${s.reps} reps` : holdLabel(s.hold)}</span>
          ${s.reps ? holdBtnHtml(s.hold) : holdBtnHtml(s.hold, "start", i)}
          ${s.reps || !s.hold ? `<button class="set-row-done-btn" data-set-index="${i}">Done</button>` : ""}
        </div>
      `).join("");
      listEl.querySelectorAll(".set-row-done-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.toggleSetChecked(Number(btn.dataset.setIndex)));
      });
      wireHoldButtons(listEl);
    }

    // One set of a compound block: numbered segments in the order they're
    // done, one Mark Set Complete for the whole set. Same shape as a superset
    // round, deliberately — it's the same idea (several actions, one unit of
    // work) and a second visual language for it would earn nothing.
    if (phase.kind === "compound") {
      document.getElementById("player-exercise-name").textContent = phase.exerciseName;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      // Unlike a superset, every segment here is the same lift, so the big
      // video panel still has one clear subject and is worth keeping.
      document.getElementById("player-video").style.display = "flex";
      setPlayerVideo(phase.exerciseName);
      setPlayerExerciseTechnique(phase.exerciseName);
      const listEl = document.getElementById("player-superset-list");
      listEl.style.display = "flex";
      listEl.innerHTML = phase.segments.map((seg, i) => {
        const tracks = seg.kind === "reps" && exerciseTracksWeight(seg.name);
        const last = tracks ? lastWeightFor(seg.name) : null;
        // Only when the hold has its own library entry — a play button that
        // opens the video already filling the panel above is just noise.
        const ownVideo = seg.kind === "hold" && seg.name !== phase.exerciseName;
        return `
          <div class="amrap-row">
            <div class="amrap-row-left">
              <span class="amrap-order-num">${i + 1}</span>
              <span>${seg.name}</span>
            </div>
            <div class="amrap-row-right">
              ${seg.kind === "reps" ? `<span>${seg.reps} reps</span>` : ""}
              ${seg.kind === "hold" ? holdBtnHtml(seg.seconds) : ""}
              ${tracks ? `<input type="number" class="superset-weight-input" inputmode="numeric"
                    data-ex-name="${seg.name}"
                    value="${this.sessionWeights[seg.name] || ""}"
                    placeholder="${last ? last : "lbs"}"
                    title="${last ? `Last time: ${last} lbs` : "Weight used"}" />` : ""}
              ${ownVideo ? `<button class="amrap-play-btn" data-ex-name="${seg.name}" title="Watch demo">▶</button>` : ""}
            </div>
          </div>
        `;
      }).join("");
      listEl.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      listEl.querySelectorAll(".superset-weight-input").forEach((input) => {
        input.addEventListener("input", () => this.noteWeight(input.dataset.exName, input.value));
      });
      wireHoldButtons(listEl);
      document.getElementById("player-complete-set-btn").style.display = "block";
    }

    if (phase.kind === "amrap") {
      document.getElementById("player-exercise-name").textContent = phase.blockLabel;
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      setPlayerExerciseTechnique(null);
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "Time Remaining";
      document.getElementById("player-amrap-list").style.display = "block";
      // Same inline weight fields as a superset (2026-08-18). The list is on
      // screen before Start as well as during, so these can be filled in while
      // setting up rather than against the clock.
      document.getElementById("player-amrap-list").innerHTML = phase.exercises
        .map((e, i) => {
          const tracks = exerciseTracksWeight(e.name);
          const last = lastWeightFor(e.name);
          return `
          <div class="amrap-row">
            <div class="amrap-row-left">
              <span class="amrap-order-num">${i + 1}</span>
              <span>${e.name}</span>
            </div>
            <div class="amrap-row-right">
              ${e.reps ? `<span>${e.reps} reps</span>` : ""}
              ${holdBtnHtml(e.hold)}
              ${tracks ? `<input type="number" class="superset-weight-input" inputmode="numeric"
                    data-ex-name="${e.name}"
                    value="${this.sessionWeights[e.name] || ""}"
                    placeholder="${last ? last : "lbs"}"
                    title="${last ? `Last time: ${last} lbs` : "Weight used"}" />` : ""}
              <button class="amrap-play-btn" data-ex-name="${e.name}" title="Watch demo">▶</button>
            </div>
          </div>
        `;
        })
        .join("");
      document.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      document.querySelectorAll("#player-amrap-list .superset-weight-input").forEach((input) => {
        input.addEventListener("input", () => this.noteWeight(input.dataset.exName, input.value));
      });
      wireHoldButtons(document.getElementById("player-amrap-list"));
      // Visibility of player-round-counter is handled by awaitStart()/beginPhaseTimer()
      // below — it should only appear once the clock is actually running.
      document.getElementById("round-count").textContent = this.amrapRounds;
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart() || this.steppingBack) this.awaitStart(); else this.beginPhaseTimer();
    }

    if (phase.kind === "cardio-choice") {
      document.getElementById("player-exercise-name").textContent = "Cardio — Your Choice";
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      document.getElementById("player-video").style.display = "none";
      setPlayerVideo(null);
      setPlayerExerciseTechnique(null);
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "Cardio";
      document.getElementById("player-cardio-picker").style.display = "flex";
      this.renderCardioPicker();
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart() || this.steppingBack) this.awaitStart(); else this.beginPhaseTimer();
    }

    if (phase.kind === "emom") {
      document.getElementById("player-sub-pill").textContent = phase.progressLabel;
      this.emomWeightFor = null;
      this.syncEmomWeightField(phase.exercises[0].name);
      document.getElementById("player-video").style.display = "flex";
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = "This Minute";
      document.getElementById("player-total-clock").style.display = "block";
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart() || this.steppingBack) this.awaitStart(); else this.beginPhaseTimer();
    }

    this.renderBackBtn();
    this.persist();
  },
};

// Best-effort exact leave time. When it fires we learn precisely when they
// went away; when it doesn't (the OS killing the app outright) the 15s
// heartbeat has already left a recent enough lastSeenAt to decide on.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") Player.persist();
});

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

// Real SVG icons instead of emoji (2026-08-11) — needed once the icon
// bubbles got their own colors (blue for staff, pink for group): an emoji
// glyph can't be recolored via CSS, a stroke="currentColor" SVG can. Same
// paths already used elsewhere in the app (msg-icon-btn's bubble, the
// bottom nav's Community icon), just reused here for visual consistency.
const CONVERSATION_ICON_SVG = {
  dm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>`,
  group: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.3"/><path d="M14 20c.3-2.7 2-4.6 4.3-5"/></svg>`,
};

function renderConversationRow(conv) {
  const preview = conversationPreview(conv);
  return `
    <div class="conversation-row conversation-row-${conv.type}" data-open-thread="${conv.id}">
      <div class="conversation-icon">${CONVERSATION_ICON_SVG[conv.type] || CONVERSATION_ICON_SVG.dm}</div>
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

// ---------------- Init ----------------

// Re-run whenever completion state may have changed (init, and on switching
// into Home/Workouts) so the "✓ Completed" grey-out is always current.
// ---------------- Program variants (2026-08-14) ----------------
// A structured session exists once per variant (home / gym) but occupies one
// slot in the schedule. What a member sees depends on what they bought:
// home-only and gym-only get one workout for the day, combo members get both
// and choose. Completion is tracked against the slot, not the variant — see
// completionForSlotOnDate below — so doing either finishes that day.

function memberAccess() {
  return CURRENT_MEMBER.access || "both";
}

function variantLabel(variantKey) {
  const v = PROGRAM_VARIANTS.find((x) => x.key === variantKey);
  return v ? v.label : "";
}

// Every workout the member can see for a given schedule slot, in variant
// order. Falls back to a direct id match for programs with no variants at
// all (Burn Club's rolling workouts never set slotId).
function workoutsForSlot(slotId) {
  const variants = CIRCUITS.filter((c) => c.slotId === slotId);
  if (!variants.length) {
    const direct = CIRCUITS.find((c) => c.id === slotId);
    return direct ? [direct] : [];
  }
  const access = memberAccess();
  const allowed = access === "both" ? PROGRAM_VARIANTS.map((v) => v.key) : [access];
  return PROGRAM_VARIANTS
    .filter((v) => allowed.includes(v.key))
    .map((v) => variants.find((c) => c.variant === v.key))
    .filter(Boolean);
}

// A scheduled day counts as done when *any* variant of it was completed on
// that date — a combo member who did the home session hasn't left the gym
// session outstanding, they've finished the day.
function completionForSlotOnDate(slotId, dateStr) {
  const ids = new Set(workoutsForSlot(slotId).map((c) => c.id));
  ids.add(slotId);
  return COMPLETIONS.find((c) => c.date === dateStr && (ids.has(c.workoutId) || c.slotId === slotId)) || null;
}

// ---------------- Home: Upcoming Workouts (structured programs) ----------------
// A structured member's Home used to show the same rolling Burn Club workout
// list as everyone else, which isn't their program at all (2026-08-13, Chris).
// Their schedule decides what's next, so Home answers "what's coming up"
// instead of "what's available."

function upcomingDayLabel(date) {
  const key = dateKey(date);
  if (key === dateKey(new Date())) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === dateKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Next N scheduled workouts from today forward. Rest days are skipped (they'd
// waste one of only three slots), and anything already completed on its own
// scheduled date drops off so all three are genuinely still ahead of you —
// completions are matched by date, not just workout id, the same way the
// Calendar tab does it.
function upcomingScheduledWorkouts(limit) {
  const member = CURRENT_MEMBER;
  const template = SCHEDULE_TEMPLATES[member.programId] || [];
  const today = new Date();
  const todayProgramDay = daysBetween(member.startDate, dateKey(today)) + 1;
  const out = [];

  for (const item of template) {
    if (item.day < todayProgramDay || item.type !== "workout") continue;

    const date = new Date(today);
    date.setDate(date.getDate() + (item.day - todayProgramDay));
    if (completionForSlotOnDate(item.workoutId, dateKey(date))) continue;

    // Home counts a day once even for combo members — showing the same
    // session twice in a three-slot "what's next" list would crowd out the
    // days behind it. The Calendar is where both variants are offered.
    const [circuit] = workoutsForSlot(item.workoutId);
    if (!circuit) continue;

    out.push({ circuit, date });
    if (out.length === limit) break;
  }
  return out;
}

function renderUpcomingWorkoutCard({ circuit, date }) {
  return `
    <button class="circuit-card circuit-card-upcoming color-${circuit.color}" data-open-circuit="${circuit.id}">
      <span class="circuit-bg-icon">${CIRCUIT_ICONS[circuitIconKey(circuit)]}</span>
      <div class="circuit-card-top">
        <h3>${circuit.title}</h3>
        <span class="circuit-tag">${upcomingDayLabel(date)}</span>
      </div>
      <p>${circuit.meta}</p>
    </button>
  `;
}

function renderHomeUpcomingWorkouts() {
  const upcoming = upcomingScheduledWorkouts(3);
  document.getElementById("home-workouts-title").textContent = "Upcoming Workouts";
  document.getElementById("home-circuit-list").innerHTML = upcoming.length
    ? upcoming.map(renderUpcomingWorkoutCard).join("")
    : `<p class="home-upcoming-empty">You're all caught up — nothing left on your schedule.</p>`;
}

function renderCircuitLists() {
  // Structured members get their own schedule-driven section instead of the
  // rolling program's weekly list.
  if (CURRENT_MEMBER.scheduleType === "structured") {
    renderHomeUpcomingWorkouts();
    document.querySelectorAll("#home-circuit-list [data-open-circuit]").forEach((btn) => {
      btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
    });
    return;
  }
  document.getElementById("home-workouts-title").textContent = "Workouts";

  // Rolling content is scoped to the member's own program (2026-08-15). This
  // was a real leak: a workout published to any rolling program's live folder
  // showed to every rolling member regardless of what they'd bought. It never
  // bit because Burn Club is the only rolling program, and it only became
  // fixable now that workouts carry a programId of their own.
  const mine = (c) => c.programId === CURRENT_MEMBER.programId;

  // Which bucket a workout lands in is worked out here, on every render, from
  // its own availability date — admin no longer tags content as "this week"
  // or "previous week" by moving it between folders (2026-08-15). Scheduled
  // and past workouts simply match nothing, so they're invisible to members
  // without anyone having to publish or retire them.
  const isEvergreen = (c) => c.category === "stretch" || c.category === "core-burn";
  const inWeek = (c, state) => !isEvergreen(c) && c.category !== "structured"
    && circuitAvailability(c).state === state;

  const weeklyCircuits = CIRCUITS.filter((c) => mine(c) && inWeek(c, "live"));
  const extraCircuits = CIRCUITS.filter((c) => mine(c) && isEvergreen(c));
  const lastWeekCircuits = CIRCUITS.filter((c) => mine(c) && inWeek(c, "last-week"));

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
  CHECKINS = loadCheckins();
  BENCHMARK_RESULTS = loadBenchmarkResults();
  LAST_WEIGHTS = loadLastWeights();
  renderCircuitLists();
  renderHomeWeekSnapshot();

  // Community tab's Activity Feed and Home's Community Buzz share the same
  // .buzz-row markup (2026-08-11). Both read the same program-scoped list
  // (2026-08-13) so Home and
  // Community can't disagree about who a member's community is.
  const buzz = feedForCurrentMember().map(renderHomeBuzzRow).join("");
  document.getElementById("community-feed").innerHTML = buzz;
  document.getElementById("home-community-feed").innerHTML = buzz;
  updateUnreadBadges();

  WEARABLE = loadWearableState();
  DAILY_STATS = loadDailyStats();
  renderTodayStats();
  renderWearableSection();

  MY_HABITS = loadMyHabits();
  HABIT_CHECKS = loadHabitChecks();
  renderHabitsSection();
  renderHabitManager();

  // Home's greeting was hardcoded to "Chris" in the markup, so every other
  // demo member was welcomed by someone else's name (2026-08-13).
  document.getElementById("home-greeting-name").textContent = CURRENT_MEMBER.name;

  document.getElementById("profile-name").textContent = CURRENT_MEMBER.name;
  document.getElementById("profile-badge").style.display = CURRENT_MEMBER.badge ? "" : "none";
  document.getElementById("profile-badge").textContent = CURRENT_MEMBER.badge;
  document.getElementById("profile-email").textContent = CURRENT_MEMBER.email;
  document.getElementById("profile-program").textContent = CURRENT_MEMBER.program;
  document.getElementById("profile-member-since").textContent = CURRENT_MEMBER.memberSince;
  applyMemberProgramMode();
  renderCheckinSection();
  renderPersonalBests();
  renderCheckinAffordances();
}

// One-time wiring for static elements that exist from page load and are
// never re-created. Kept out of init() on purpose: switchMemberProfile()
// calls init() again, so binding here would stack a duplicate handler per
// profile switch — harmless for a popup open, but it made "Add to
// Calendar" save the same session twice (2026-08-12).
function wireStaticControls() {
  document.getElementById("edit-email-btn").addEventListener("click", editEmail);

  document.getElementById("calendar-add-btn").addEventListener("click", openCalendarAddPopup);
  document.getElementById("calendar-add-close-btn").addEventListener("click", closeCalendarAddPopup);
  document.getElementById("calendar-add-save-btn").addEventListener("click", saveScheduledCardio);
  document.querySelectorAll("#calendar-add-activity-picker .pill-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      schedSelectedActivity = btn.dataset.schedActivity;
      renderCalendarAddActivityPicker();
    });
  });

  document.getElementById("complete-sched-close-btn").addEventListener("click", closeCompleteScheduledPopup);
  document.getElementById("complete-sched-save-btn").addEventListener("click", confirmCompleteScheduled);

  document.getElementById("open-notifications-btn").addEventListener("click", openNotificationsScreen);
  document.getElementById("notifications-close-btn").addEventListener("click", closeNotificationsScreen);
  document.getElementById("open-health-profile-btn").addEventListener("click", openHealthProfileScreen);
  document.getElementById("health-profile-close-btn").addEventListener("click", closeHealthProfileScreen);
  document.getElementById("health-profile-save-btn").addEventListener("click", saveHealthProfileForm);
  document.getElementById("open-invite-btn").addEventListener("click", openInviteScreen);
  document.getElementById("invite-close-btn").addEventListener("click", closeInviteScreen);
  document.getElementById("invite-copy-btn").addEventListener("click", copyInviteLink);
  document.getElementById("open-support-btn").addEventListener("click", openSupportScreen);
  document.getElementById("support-close-btn").addEventListener("click", closeSupportScreen);
}

// Prototype-level edit: prompt + in-memory update, no backend to save to yet
// (2026-08-12, Chris: "an edit button ... if they want to change their
// email"). Real path would be a proper edit form + account API call.
function editEmail() {
  const next = window.prompt("Update your email", CURRENT_MEMBER.email);
  if (next === null) return;
  const trimmed = next.trim();
  if (!trimmed) return;
  CURRENT_MEMBER.email = trimmed;
  document.getElementById("profile-email").textContent = trimmed;
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

  // Cardio logging was unreachable for structured members (2026-08-19): the
  // block sits in the Workouts tab, which they don't have — while "Cardio
  // Sessions" was being counted on their Home. The block moves to Home for
  // them rather than being copied there, so there's still one of everything.
  // Moving a node keeps its listeners, so nothing needs rebinding.
  const cardio = document.getElementById("cardio-log-section");
  const slot = document.getElementById(isStructured ? "home-cardio-slot" : "workouts-cardio-slot");
  if (cardio && slot && cardio.parentElement !== slot.parentElement) slot.after(cardio);
  renderCardioLog();

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

// ---------------- Member-scheduled calendar items (2026-08-12) ----------------
// Cardio sessions the member plans onto their own calendar via "+ Add".
// Deliberately NOT written into COMPLETIONS: these are planned, not done,
// so they must not inflate stats, streaks, or challenge points. When the
// member actually finishes one, they log it through the existing Cardio
// Log on the Workouts tab, which is what feeds COMPLETIONS.
const SCHEDULED_ITEMS_STORAGE_PREFIX = "burnclub-scheduled-";
const SCHEDULE_ACTIVITY_TYPES = ["Run", "Walk", "Stairs"];
// The calendar picker's short labels map onto the canonical
// CARDIO_ACTIVITY_TYPES ids the Cardio Log uses, so a completed session
// gets the right units instead of silently falling back to Walk's "mi".
const SCHEDULED_TO_CARDIO_TYPE = { Run: "Run", Walk: "Walk", Stairs: "Stair Stepper" };
let schedSelectedActivity = SCHEDULE_ACTIVITY_TYPES[0];

function loadScheduledItems(memberId) {
  const stored = localStorage.getItem(SCHEDULED_ITEMS_STORAGE_PREFIX + memberId);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

function saveScheduledItems(memberId, list) {
  localStorage.setItem(SCHEDULED_ITEMS_STORAGE_PREFIX + memberId, JSON.stringify(list));
}

function scheduledItemsOnDate(dateStr) {
  return loadScheduledItems(CURRENT_MEMBER.id).filter((i) => i.date === dateStr);
}

function addScheduledCardio(activity, dateStr) {
  const list = loadScheduledItems(CURRENT_MEMBER.id);
  list.push({ id: `sched-${Date.now()}`, type: "cardio", activity, date: dateStr });
  saveScheduledItems(CURRENT_MEMBER.id, list);
}

function removeScheduledItem(id) {
  const list = loadScheduledItems(CURRENT_MEMBER.id);
  const item = list.find((i) => i.id === id);
  // If it had already been marked complete, drop the completion it created
  // too — otherwise it would keep counting toward points and stats with no
  // card left on the calendar to explain where those points came from.
  if (item && item.completedId) {
    const idx = COMPLETIONS.findIndex((c) => c.id === item.completedId);
    if (idx !== -1) {
      COMPLETIONS.splice(idx, 1);
      saveCompletions();
    }
  }
  saveScheduledItems(CURRENT_MEMBER.id, list.filter((i) => i.id !== id));
  renderCalendarTab();
  renderCardioLog();
  renderHomeWeekSnapshot();
}

function renderScheduledItems(dateStr) {
  return scheduledItemsOnDate(dateStr).map((item) => {
    const done = !!item.completedId;
    return `
      <div class="calendar-item-scheduled ${done ? "completed" : ""}">
        <button class="calendar-scheduled-main" data-complete-scheduled="${item.id}">
          <span class="calendar-scheduled-label">${item.activity}</span>
          <span class="calendar-scheduled-meta">${done ? `Cardio · ${item.completedMinutes} min logged` : "Cardio · Tap to complete"}</span>
        </button>
        ${done ? `<span class="calendar-scheduled-check">✓</span>` : ""}
        <button class="calendar-scheduled-remove" data-remove-scheduled="${item.id}" aria-label="Remove ${item.activity}">✕</button>
      </div>
    `;
  }).join("");
}

// ---------------- Completing a planned session (2026-08-12) ----------------
// Tapping a green calendar card logs it as a real cardio completion, which
// is what makes it count toward challenge points — challengePointsBreakdown
// simply counts COMPLETIONS with category "cardio-activity" inside the
// challenge's date range, so no challenge-specific wiring is needed here.
let completingScheduledId = null;

function openCompleteScheduledPopup(itemId) {
  const item = loadScheduledItems(CURRENT_MEMBER.id).find((i) => i.id === itemId);
  if (!item) return;
  completingScheduledId = itemId;

  const isFuture = daysBetween(dateKey(new Date()), item.date) > 0;
  document.getElementById("complete-sched-title").textContent = `Complete ${item.activity}`;
  document.getElementById("complete-sched-date").textContent = formatWeekdayDate(parseDateKey(item.date));
  document.getElementById("complete-sched-minutes").value = 30;
  document.getElementById("complete-sched-saved").style.display = "none";

  // A session planned for a future day can't be finished yet — say so
  // rather than letting the button quietly create a future-dated
  // completion that would skew this week's stats.
  const saveBtn = document.getElementById("complete-sched-save-btn");
  const note = document.getElementById("complete-sched-future-note");
  saveBtn.style.display = isFuture ? "none" : "";
  document.getElementById("complete-sched-minutes-field").style.display = isFuture ? "none" : "";
  note.style.display = isFuture ? "block" : "none";
  note.textContent = `You can log this on ${formatWeekdayDate(parseDateKey(item.date))}.`;

  document.getElementById("complete-sched-overlay").classList.add("visible");
}

function closeCompleteScheduledPopup() {
  document.getElementById("complete-sched-overlay").classList.remove("visible");
  completingScheduledId = null;
}

function confirmCompleteScheduled() {
  const list = loadScheduledItems(CURRENT_MEMBER.id);
  const item = list.find((i) => i.id === completingScheduledId);
  if (!item || item.completedId) return;

  const minutes = parseInt(document.getElementById("complete-sched-minutes").value, 10) || 0;
  const entry = logCardioActivity({
    activityType: SCHEDULED_TO_CARDIO_TYPE[item.activity] || item.activity,
    distanceValue: 0,
    minutes,
    source: "manual",
    date: item.date,
  });

  item.completedId = entry.id;
  item.completedMinutes = minutes;
  saveScheduledItems(CURRENT_MEMBER.id, list);

  renderCalendarTab();
  renderCardioLog();
  renderHomeWeekSnapshot();

  const challenge = currentChallenge();
  const note = document.getElementById("complete-sched-saved");
  note.textContent = challenge
    ? `✓ Logged — you're at ${challengePointsForMember(challenge)} points`
    : "✓ Logged";
  note.style.display = "block";
}

function openCalendarAddPopup() {
  schedSelectedActivity = SCHEDULE_ACTIVITY_TYPES[0];
  renderCalendarAddActivityPicker();
  const dateInput = document.getElementById("calendar-add-date");
  dateInput.value = dateKey(new Date());
  dateInput.min = dateKey(new Date());
  document.getElementById("calendar-add-saved").style.display = "none";
  document.getElementById("calendar-add-overlay").classList.add("visible");
}

function closeCalendarAddPopup() {
  document.getElementById("calendar-add-overlay").classList.remove("visible");
}

function renderCalendarAddActivityPicker() {
  document.querySelectorAll("#calendar-add-activity-picker .pill-filter").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.schedActivity === schedSelectedActivity);
  });
}

function saveScheduledCardio() {
  const dateStr = document.getElementById("calendar-add-date").value;
  if (!dateStr) return;
  addScheduledCardio(schedSelectedActivity, dateStr);
  renderCalendarTab();

  // The calendar only renders the next 7 days, so something scheduled
  // further out saves correctly but won't be visible yet — say so rather
  // than letting it look like the save failed.
  const note = document.getElementById("calendar-add-saved");
  const withinView = daysBetween(dateKey(new Date()), dateStr) < 7;
  note.textContent = withinView
    ? `✓ ${schedSelectedActivity} added for ${formatWeekdayDate(parseDateKey(dateStr))}`
    : `✓ ${schedSelectedActivity} added for ${formatWeekdayDate(parseDateKey(dateStr))} — shows up here closer to the date`;
  note.style.display = "block";
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
    const options = workoutsForSlot(item.workoutId);
    if (!options.length) {
      bodyHtml = `<span class="calendar-item-label calendar-item-muted">Workout unavailable</span>`;
    } else {
      // The day is done once either variant is completed, so the tick lands
      // on the one they actually did and the other simply stops being
      // offered — no half-finished day for a combo member.
      const completion = completionForSlotOnDate(item.workoutId, dateKey(date));
      const showVariantLabels = options.length > 1;
      bodyHtml = options
        .filter((c) => !completion || completion.workoutId === c.id)
        .map((circuit) => {
          const isDone = !!completion;
          return `
        <button class="calendar-item-btn ${isDone ? "done" : ""}" data-open-circuit="${circuit.id}">
          <span class="calendar-item-label">${circuit.title}</span>
          <span class="calendar-item-meta">${circuit.meta}</span>
          ${showVariantLabels && !isDone ? `<span class="calendar-variant-tag">${variantLabel(circuit.variant)}</span>` : ""}
          ${isDone ? `<span class="calendar-item-check">✓ Done</span>` : ""}
        </button>
      `;
        })
        .join("");
    }
  }

  return `
    <div class="calendar-day-row ${isToday ? "today" : ""}">
      <div class="calendar-day-date">
        <span>${formatWeekdayDate(date)}</span>
        ${isToday ? `<span class="calendar-today-tag">Today</span>` : ""}
      </div>
      ${bodyHtml}
      ${renderScheduledItems(dateKey(date))}
    </div>
  `;
}

function renderCalendarTab() {
  const member = CURRENT_MEMBER;
  // Only structured members have a startDate to project a schedule from.
  // The tab is hidden for everyone else so this never fires in normal use,
  // but without the guard a rolling member reaching it would crash on an
  // undefined date rather than just showing nothing (2026-08-13).
  if (member.scheduleType !== "structured" || !member.startDate) return;
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
  document.querySelectorAll("#calendar-day-list [data-remove-scheduled]").forEach((btn) => {
    btn.addEventListener("click", () => removeScheduledItem(btn.dataset.removeScheduled));
  });
  document.querySelectorAll("#calendar-day-list [data-complete-scheduled]").forEach((btn) => {
    btn.addEventListener("click", () => openCompleteScheduledPopup(btn.dataset.completeScheduled));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  wireStaticControls();

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    showTab("tab-home");
    onEnterApp();
  });

  document.getElementById("guest-btn").addEventListener("click", () => {
    showTab("tab-home");
    onEnterApp();
  });

  document.getElementById("guest-ff-btn").addEventListener("click", () => {
    switchMemberProfile("jordan-p");
    onEnterApp();
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
  document.querySelectorAll("[data-action='open-checkin']").forEach((btn) => {
    btn.addEventListener("click", openCheckinModal);
  });
  document.getElementById("thread-back-btn").addEventListener("click", openMessagesInbox);
  document.getElementById("thread-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("thread-input");
    sendThreadMessage(input.value);
    input.value = "";
  });

  document.getElementById("start-circuit-btn").addEventListener("click", () => {
    const c = CIRCUITS.find((x) => x.id === openCircuitId);
    if (c) Player.start(c);
  });

  document.getElementById("player-exit-btn").addEventListener("click", () => Player.exit());
  document.getElementById("player-start-btn").addEventListener("click", () => Player.beginPhaseTimer());
  document.getElementById("player-back-btn").addEventListener("click", () => Player.back());
  document.getElementById("exercise-video-close-btn").addEventListener("click", closeExerciseVideo);
  // Same contract as the per-row play buttons: opens over the running clock,
  // closes independently, never pauses anything.
  document.getElementById("player-video").addEventListener("click", () => {
    const name = document.getElementById("player-video").dataset.exName;
    if (name) openExerciseVideo(name);
  });
  document.getElementById("block-notes-got-it-btn").addEventListener("click", closeBlockNotes);

  document.getElementById("checkin-close-btn").addEventListener("click", closeCheckinModal);
  document.getElementById("checkin-save-btn").addEventListener("click", saveCheckinForm);
  document.getElementById("checkin-skip-btn").addEventListener("click", () => {
    if (!todaysCheckin()) dismissCheckinPrompt();
    closeCheckinModal();
  });
  document.getElementById("complete-checkin-nudge").addEventListener("click", openCheckinModal);
  ["mental", "physical"].forEach((k) => {
    const slider = document.getElementById(`checkin-${k}`);
    slider.addEventListener("input", () => {
      document.getElementById(`checkin-${k}-value`).textContent = slider.value;
    });
  });
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
  document.getElementById("player-technique-toggle").addEventListener("click", () => {
    document.getElementById("player-technique-toggle").classList.toggle("expanded");
    document.getElementById("player-technique-body").classList.toggle("expanded");
  });
  document.getElementById("player-skip-btn").addEventListener("click", () => Player.requestSkip());
  document.getElementById("skip-confirm-cancel-btn").addEventListener("click", () => Player.closeSkipConfirm());
  document.getElementById("skip-confirm-yes-btn").addEventListener("click", () => Player.confirmSkip());

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
    Player.persist();
  });
  document.getElementById("round-minus-btn").addEventListener("click", () => {
    Player.amrapRounds = Math.max(0, Player.amrapRounds - 1);
    document.getElementById("round-count").textContent = Player.amrapRounds;
    Player.persist();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    Player.stop();
    document.getElementById("main-app").classList.remove("visible");
    document.getElementById("bottom-nav").style.display = "none";
    showScreen("screen-login");
  });
});
