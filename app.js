// Burn Club prototype — navigation & workout player logic, no real backend.

// ---------------- Minimalist icons ----------------
// Replacing full-color emoji app-wide, one page at a time, starting with Home
// (Chris's 2026-08-06 request). Single-color line/fill icons that inherit
// `color` from their surrounding CSS — same currentColor approach as the
// bottom nav icons built earlier this session.
const ICON_MSG = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>`;
const ICON_STEPS = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="8" cy="15" rx="3" ry="5" transform="rotate(-15 8 15)"/><circle cx="10.8" cy="8.2" r="1.4"/><ellipse cx="16" cy="9" rx="3" ry="5" transform="rotate(15 16 9)"/><circle cx="13.2" cy="15.8" r="1.4"/></svg>`;
const ICON_FLAME = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.2 3-2.6 4.3-2.6 7.8a2.6 2.6 0 0 0 5.2 0c0-.9-.5-1.6-.9-2.4 2 1.3 3.8 4 3.8 6.9a5.5 5.5 0 0 1-11 0C6.5 9 9.5 6.5 12 2z"/></svg>`;
const ICON_HEART = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z"/></svg>`;
const ICON_LINK = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l6-6"/><path d="M13 6l1-1a3 3 0 1 1 4 4l-1 1"/><path d="M11 18l-1 1a3 3 0 1 1-4-4l1-1"/></svg>`;

// ---------------- Home / Circuits / Community / Progress rendering ----------------

// Background pictogram per workout, keyed off category/meta text (Chris's
// 2026-08-06 request — original flat single-color figures, not the stock
// clipart/photo he referenced for inspiration, which is copyrighted).
// Each is a simple rounded-stroke stick figure, viewBox 0 0 100 100, colored
// via CSS `color` (see .circuit-bg-icon) so it inherits the card's accent.
const CIRCUIT_ICONS = {
  core: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="28" cy="26" r="9"/><path d="M30 34L46 55"/><path d="M46 55L70 48"/><path d="M70 48L77 72"/><path d="M38 42L58 50"/></svg>`,
  cardio: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="62" cy="18" r="9"/><path d="M58 26L42 50"/><path d="M42 50L58 64L48 90"/><path d="M42 50L22 56L27 82"/><path d="M50 32L67 22"/><path d="M50 32L32 44"/></svg>`,
  legs: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 48"/><path d="M50 48L30 58L35 85"/><path d="M50 48L70 58L65 85"/><path d="M50 30L27 36"/><path d="M50 30L73 36"/></svg>`,
  upper: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 62"/><path d="M50 62L35 90"/><path d="M50 62L65 90"/><path d="M50 30L30 12"/><path d="M50 30L70 12"/><path d="M18 12L42 12"/><path d="M58 12L82 12"/></svg>`,
  fullbody: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="16" r="9"/><path d="M50 25L50 55"/><path d="M50 30L25 10"/><path d="M50 30L75 10"/><path d="M50 55L25 90"/><path d="M50 55L75 90"/></svg>`,
  stretch: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="35" cy="20" r="9"/><path d="M37 28L56 55"/><path d="M56 55L50 90"/><path d="M56 55L68 88"/><path d="M42 34L68 14"/><path d="M42 34L30 55"/></svg>`,
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

// Stretch & Core workouts are meant to be repeated within the month (Chris,
// 2026-09-16), so they deliberately never get the crossed-off treatment a
// one-off weekly workout gets — striking one through says "finished with
// this", which is the opposite of what the library is for. They carry a
// tally instead: how many times this month, and when it was last done.
//
// Three states rather than two, because the month rolls over. Done this
// month shows the count; done in an earlier month still has to answer "when
// did I last do this", so it drops the count and keeps the date; never done
// keeps the tag chip exactly as before.
function repeatMarkFor(c) {
  const completion = mostRecentCompletion(c.id);
  // Nothing on a workout nobody has done yet (Chris, 2026-10-01: category
  // chips off the cards). The card's own line underneath already says what
  // kind of workout it is.
  if (!completion) return "";
  const times = completionsThisMonth(c.id);
  const date = formatShortDate(completion.date);
  // Nothing this month: the count is the uninteresting half, so it goes and
  // the date carries its own label rather than sitting under a big "0".
  if (!times) return `<div class="circuit-repeat-mark"><span class="circuit-completed-date">Last ${date}</span></div>`;
  // "3× / SEP 12" on its own could be read as three times on Sep 12 — which
  // is a real thing a member could have done — so anything above one says so.
  return `<div class="circuit-repeat-mark"><span class="circuit-repeat-count">${times}×</span><span class="circuit-completed-date">${times > 1 ? "Last " : ""}${date}</span></div>`;
}

function renderCircuitCard(c) {
  const completion = mostRecentCompletion(c.id);
  const repeatable = STRETCH_CORE_CATEGORIES.includes(c.category);
  const done = completion && !repeatable;
  return `
    <button class="circuit-card color-${c.color}${done ? " completed" : ""}" data-open-circuit="${c.id}">
      <span class="circuit-bg-icon">${CIRCUIT_ICONS[circuitIconKey(c)]}</span>
      <div class="circuit-card-top">
        <h3>${esc(c.title)}</h3>
        ${repeatable
          ? repeatMarkFor(c)
          : completion
            ? `<div class="circuit-completed-mark"><span class="circuit-check">✓</span><span class="circuit-completed-date">${formatShortDate(completion.date)}</span></div>`
            : ""}
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
        <p><strong>${esc(f.name)}</strong> ${esc(f.action)}</p>
        <p class="buzz-time">${f.time}</p>
      </div>
    </div>
  `;
}

function renderLeaderRow(l) {
  return `
    <div class="leader-row ${l.me ? "me" : ""}">
      <span class="leader-rank">#${l.rank}</span>
      <span class="leader-name">${esc(l.name)}</span>
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
      <span>${esc(c.title)}</span>
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

// ---------------- Demo seeding, and who must never get it ----------------
// The loaders below invent history when localStorage is empty: 229
// completions going back to 2025, 23 check-ins, 401 days of step counts, six
// benchmark scores, two pinned PRs and a wearable marked as connected. That
// is what makes the demo worth looking at, and it must never reach a real
// member.
//
// A signed-in member with no history HAS no history. Seeding it would tell
// them they had trained 229 times when they had not, and every number
// downstream — streak, personal bests, challenge points, the progress chart —
// would be computed from it and look entirely ordinary.
function isDemoSession() {
  return typeof AUTH_MEMBER === "undefined" || !AUTH_MEMBER;
}

function loadCompletions() {
  const stored = localStorage.getItem(memberKey(COMPLETIONS_STORAGE_KEY));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fall through and reseed
    }
  }
  if (!isDemoSession()) return [];
  const seeded = buildSeedCompletionsForMember(CURRENT_MEMBER);
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveCompletions() {
  localStorage.setItem(memberKey(COMPLETIONS_STORAGE_KEY), JSON.stringify(COMPLETIONS));  queueSync("completions");
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
  if (!isDemoSession()) return [];
  const seeded = buildSeedBenchmarkResults();
  localStorage.setItem(memberKey(BENCHMARK_RESULTS_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveBenchmarkResults() {
  localStorage.setItem(memberKey(BENCHMARK_RESULTS_STORAGE_KEY), JSON.stringify(BENCHMARK_RESULTS));
  queueSync("benchmarkResults");
}

// Most recent completion of this specific workout, for the "✓ Completed"
// grey-out treatment on the Home/Workouts cards.
function mostRecentCompletion(workoutId) {
  return COMPLETIONS.filter((c) => c.workoutId === workoutId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

// Times this workout was completed in the current calendar month, for the
// Stretch & Core tally (2026-09-16). Scoped to the month because that's the
// unit Chris thinks in for the library — an all-time count on an `always:
// true` workout only ever grows, which stops meaning anything. Compares on
// the "YYYY-MM" prefix of the stored date key rather than parsing, matching
// how the rest of the file treats these strings.
function completionsThisMonth(workoutId) {
  const prefix = dateKey(new Date()).slice(0, 7);
  return COMPLETIONS.filter((c) => c.workoutId === workoutId && String(c.date).startsWith(prefix)).length;
}

// "YYYY-MM-DD" -> "Jul 22". Built from local date parts (not `new Date(string)`,
// which parses as UTC and can roll the date back a day in the evening).
// ---------------- Toast ----------------
// One at a time: a second message replaces the first rather than queueing, so
// a rapid sequence can't leave the member reading something already stale.
let toastTimer = null;
function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}

// Everything a coach types — exercise names, workout titles, custom habit
// labels — reaches the screen through innerHTML template strings, unescaped
// (2026-08-23). Two real consequences, both found by probing rather than by
// anything visibly going wrong:
//   * a double quote ends the attribute it sits in. `Farmer's Carry 20" Box`
//     silently broke the weight field's data-ex-name, so weight logged
//     against that exercise went nowhere and the member's history just never
//     filled in.
//   * angle brackets render as markup. `Squat <b>Heavy</b>` came out bold.
// Escaping at the interpolation site rather than on the data keeps what's
// stored true to what was typed.
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

// ---- Showcasing (2026-09-04) -----------------------------------------------
// Progress used to list a personal best for every exercise the member had ever
// logged a weight against. Chris: "this program isn't necessarily about
// breaking PRs... that shouldn't be the goal of each workout" — a wall of
// numbers argues the opposite. So the member picks which lifts appear there,
// prompted at the moment one actually happens.
//
// What's stored is the exercise *name*, not the number. A showcased lift shows
// its current best, so it can't go stale and sit there claiming 220 while the
// member has since done 235. The choice is which lifts they care about, not
// which single result to frame.
const SHOWCASED_PRS_KEY = "burnclub-showcased-prs";

// A real member starts with an empty Progress section and fills it as they go.
// The demo seeds two so the card isn't blank on first look — same
// seeded-on-first-load pattern as COMPLETIONS above.
const SHOWCASED_PRS_SEED = ["Barbell Back Squat", "Barbell Deadlift"];

function loadShowcasedPRs() {
  const stored = localStorage.getItem(memberKey(SHOWCASED_PRS_KEY));
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // fall through and reseed
    }
  }
  if (!isDemoSession()) return [];
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(SHOWCASED_PRS_SEED));
  return [...SHOWCASED_PRS_SEED];
}

let SHOWCASED_PRS = [];

function saveShowcasedPRs() {
  localStorage.setItem(memberKey(SHOWCASED_PRS_KEY), JSON.stringify(SHOWCASED_PRS));
  queueSync("showcasedPRs");
}

function isShowcased(name) {
  return SHOWCASED_PRS.includes(name);
}

function toggleShowcased(name) {
  if (isShowcased(name)) SHOWCASED_PRS = SHOWCASED_PRS.filter((n) => n !== name);
  else SHOWCASED_PRS.push(name);
  saveShowcasedPRs();
}

// What Progress actually lists.
function showcasedPersonalBests() {
  return personalBests().filter((pr) => isShowcased(pr.name));
}

// Ordered by how recently the best was set, so a lift moving this month sits
// above one that peaked in March. This is every exercise with a logged weight —
// the picker's list. Progress uses showcasedPersonalBests() above.
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
  const eligible = personalBests();
  const all = showcasedPersonalBests();
  // Two different empty states, because they mean different things: nothing
  // logged yet, versus logged plenty and chosen not to pin any of it.
  if (!all.length) {
    host.innerHTML = eligible.length
      ? `<p class="checkin-empty">Nothing pinned here yet. When you beat a lift you'll be asked if you want it on this page — or pick some now.</p>`
      : `<p class="checkin-empty">Log a weight during a workout and your bests can show up here.</p>`;
    if (eligible.length) appendPRChooseButton(host, eligible);
    return;
  }
  const shown = prListExpanded ? all : all.slice(0, 3);
  const hidden = all.length - shown.length;

  host.innerHTML = shown.map((pr) => `
    <div class="pr-row">
      <div class="pr-row-left">
        <span class="pr-exercise">${esc(pr.name)}</span>
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
  appendPRChooseButton(host, eligible);
}

// Without this the completion screen would be the only way in, and a member who
// tapped past it would have lost that lift for good — and would have no way to
// take one down again either.
function appendPRChooseButton(host, eligible) {
  if (!eligible.length) return;
  host.insertAdjacentHTML("beforeend", `
    <button class="checkin-more-btn" id="pr-choose-btn">Choose what shows here</button>
  `);
  host.querySelector("#pr-choose-btn").addEventListener("click", openPRPicker);
}

function renderPRPicker() {
  const eligible = personalBests();
  document.getElementById("pr-picker-body").innerHTML = `
    <p class="pr-picker-note">Pick the lifts worth keeping an eye on. The rest still count — they just aren't on the page.</p>
    ${eligible.map((pr) => `
      <button class="notif-row pr-picker-row ${isShowcased(pr.name) ? "checked" : ""}" data-showcase-name="${esc(pr.name)}" type="button">
        <span class="notif-checkbox">${isShowcased(pr.name) ? "✓" : ""}</span>
        <span class="notif-label">${esc(pr.name)}<span class="pr-picker-best">${pr.best} lbs</span></span>
      </button>
    `).join("")}
  `;
  document.querySelectorAll("[data-showcase-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleShowcased(btn.dataset.showcaseName);
      renderPRPicker();
      renderPersonalBests();
    });
  });
}

function openPRPicker() {
  renderPRPicker();
  document.getElementById("pr-picker-overlay").classList.add("visible");
}

function closePRPicker() {
  document.getElementById("pr-picker-overlay").classList.remove("visible");
}

// The moment worth catching: shown on the completion screen when a weight just
// beat the previous best, rather than leaving it to be discovered in Progress.
// Saved against the completion entry's id, so the note follows the session
// rather than the day — two workouts in a day get their own notes.
function saveSessionNoteFromForm() {
  const input = document.getElementById("session-note-input");
  if (!input || !currentCompletionEntry) return;
  const text = input.value.trim();
  if (text) SESSION_NOTES[currentCompletionEntry.id] = text;
  else delete SESSION_NOTES[currentCompletionEntry.id];
  saveSessionNotes();
}

function resetSessionNoteField() {
  const input = document.getElementById("session-note-input");
  if (input) input.value = "";
}

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
    ${prs.map((p) => `
      <div class="pr-banner-row">
        <p class="pr-banner-line"><strong>${esc(p.name)}</strong> ${p.weight} lbs <span>&middot; beat ${p.previous}</span></p>
        <button class="pr-showcase-btn ${isShowcased(p.name) ? "on" : ""}" data-showcase-name="${esc(p.name)}" type="button">
          ${isShowcased(p.name) ? "✓ On your Progress page" : "Add to Progress"}
        </button>
      </div>
    `).join("")}
    <p class="pr-banner-foot">Only what you add here shows up in Progress. Everything you lift still counts either way.</p>
  `;
  // Rebound on every render because the buttons are replaced above.
  el.querySelectorAll("[data-showcase-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleShowcased(btn.dataset.showcaseName);
      renderPRBanner(prs);
      renderPersonalBests();
    });
  });
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
  if (!isDemoSession()) return [];
  const seeded = buildSeedCheckins();
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(seeded));
  return seeded;
}

function saveCheckins() {
  localStorage.setItem(memberKey(CHECKIN_STORAGE_KEY), JSON.stringify(CHECKINS));
  queueSync("checkins");
}

function checkinFor(dateStr) {
  return CHECKINS.find((c) => c.date === dateStr) || null;
}

function todaysCheckin() {
  return checkinFor(dateKey(new Date()));
}

// One entry per day — checking in twice edits the day rather than stacking a
// second row, so the trend has exactly one point per date.
function saveCheckin({ mental, physical, sleepHours, sleepQuality, note }) {
  const date = dateKey(new Date());
  const existing = checkinFor(date);
  const fields = { mental, physical, sleepHours, sleepQuality, note };
  if (existing) {
    Object.assign(existing, fields);
  } else {
    CHECKINS.push({ date, ...fields, sharedAt: null });
  }
  CHECKINS.sort((a, b) => (a.date < b.date ? -1 : 1));
  saveCheckins();
}

// Members can switch the daily prompt off entirely (2026-08-30, Chris).
// Distinct from dismissing: dismissing is for today, this is until they say
// otherwise. Per-member, defaulting to on.
//
// "Off" means the two things that come at the member unprompted — the daily
// modal and the post-workout nudge. The Home shortcut icon and their existing
// history both stay: turning the prompt off should stop the asking, not
// delete the feature or lock them out of logging a day they do want to.
// ---------------- Notebook (2026-09-06) ----------------
// One place for everything the member wrote: the daily check-in, the note they
// left after a session, their pinned bests, and free-form notes. What the app
// worked out for itself — charts, streaks, wearable figures — stays on
// Progress. That split is the whole organising rule; if a thing is computed it
// doesn't belong in here.
//
// Opens from the topbar icon that used to open the check-in directly. The
// check-in now lives on the Today page, so that's still the way in.
const NOTEBOOK_NOTES_KEY = "burnclub-notebook-notes";
const SESSION_NOTES_KEY = "burnclub-session-notes";

const NOTEBOOK_TABS = [
  { id: "today", label: "Today" },
  { id: "log", label: "Log" },
  { id: "prs", label: "PRs" },
  { id: "notes", label: "Notes" },
];
let notebookTab = "today";
// Which past months are open in the Log. Not persisted on purpose — the recent
// week is what you come back to.
let notebookOpenMonths = new Set();

// Free-form notes, split by whether they're meant for the coach — that's a
// different kind of note, because it has a destination.
function loadNotebookNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(memberKey(NOTEBOOK_NOTES_KEY)) || "null");
    if (stored && Array.isArray(stored.coach) && Array.isArray(stored.other)) return stored;
  } catch (e) {}
  return { coach: [], other: [] };
}
let NOTEBOOK_NOTES = { coach: [], other: [] };
function saveNotebookNotes() {
  localStorage.setItem(memberKey(NOTEBOOK_NOTES_KEY), JSON.stringify(NOTEBOOK_NOTES));
  queueSync("notebookNotes");
}

// A note attached to one workout, keyed by the completion entry's id.
function loadSessionNotes() {
  try {
    return JSON.parse(localStorage.getItem(memberKey(SESSION_NOTES_KEY)) || "{}") || {};
  } catch (e) { return {}; }
}
let SESSION_NOTES = {};
function saveSessionNotes() {
  localStorage.setItem(memberKey(SESSION_NOTES_KEY), JSON.stringify(SESSION_NOTES));
  queueSync("sessionNotes");
}
function sessionNoteFor(entryId) {
  return (SESSION_NOTES[entryId] || "").trim();
}

function qualityLabel(value) {
  const opt = APP_SETTINGS.checkin.sleepQuality.options.find((o) => o.value === value);
  return opt ? opt.label : null;
}

function openNotebook(tab) {
  notebookTab = tab || "today";
  renderNotebook();
  // Opening starts at the top; toggling a month inside it does not.
  document.getElementById("notebook-page").scrollTop = 0;
  document.getElementById("notebook-overlay").classList.add("visible");
}

function closeNotebook() {
  document.getElementById("notebook-overlay").classList.remove("visible");
}

function renderNotebook() {
  document.getElementById("notebook-tabs").innerHTML = NOTEBOOK_TABS.map((t) => `
    <button class="notebook-tab ${t.id === notebookTab ? "active" : ""}" role="tab"
            aria-selected="${t.id === notebookTab}" data-notebook-tab="${t.id}">${t.label}</button>
  `).join("");
  const body = document.getElementById("notebook-content");
  body.innerHTML = {
    today: notebookToday, log: notebookLog, prs: notebookPRs, notes: notebookNotes,
  }[notebookTab]();
  wireNotebookBody();
}

// ---- Today -----------------------------------------------------------------

function notebookToday() {
  const today = dateKey(new Date());
  const checkin = checkinFor(today);
  const done = COMPLETIONS.filter((c) => c.date === today);
  const session = done[done.length - 1] || null;

  const scale = (q, value) => {
    if (value == null || value === "") return `<div class="nb-row"><b>${esc(q.label)}</b><span class="nb-val">Not recorded</span></div>`;
    const pct = Math.max(0, Math.min(100, (value / 10) * 100));
    const colour = (CHECKIN_SERIES.find((cs) => cs.key === q.key) || {}).color || "#788CE3";
    return `<div class="nb-row"><b>${esc(q.label)}</b>
      <div class="nb-bar"><i style="width:${pct}%;background:${colour}"></i></div>
      <em>${value}</em></div>`;
  };

  const quality = checkin ? qualityLabel(checkin.sleepQuality) : null;
  const note = session ? sessionNoteFor(session.id) : "";

  return `
    <p class="nb-title">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
    <p class="nb-sub">${session ? esc(session.title) + " · " + session.minutes + " min" : "Nothing logged yet"}</p>

    <p class="nb-sect">How you felt</p>
    ${checkin
      ? APP_SETTINGS.checkin.questions.map((q) => scale(q, checkin[q.key])).join("") +
        `<div class="nb-row"><b>Sleep quality</b><span class="nb-val">${quality ? esc(quality) : "Not recorded"}</span></div>`
      : `<p class="nb-empty">You haven't checked in today.</p>
         <button class="nb-action" data-notebook-action="checkin">+ Check in now</button>`}

    <p class="nb-sect">Session note</p>
    ${session
      ? (note
          ? `<p class="nb-note">${esc(note)}</p><button class="nb-action" data-notebook-action="edit-session-note" data-entry="${esc(session.id)}">Edit</button>`
          : `<button class="nb-action" data-notebook-action="edit-session-note" data-entry="${esc(session.id)}">+ Add a note about today's session</button>`)
      : `<p class="nb-empty">Finish a workout and you can write about it here.</p>`}

    <p class="nb-sect">What you lifted</p>
    ${todaysLiftsHtml(done)}
  `;
}

function todaysLiftsHtml(done) {
  const lifts = [];
  done.forEach((c) => {
    Object.entries(c.weights || {}).forEach(([name, weight]) => lifts.push({ name, weight }));
  });
  if (!lifts.length) return `<p class="nb-empty">No weights logged today.</p>`;
  return lifts.map((l) => {
    const best = personalBestFor(l.name);
    const isPR = best && Number(l.weight) >= best.best;
    return `<div class="nb-lift"><b>${esc(l.name)}</b><span>${l.weight} <small>lbs</small>${isPR ? `<span class="nb-pill">PR</span>` : ""}</span></div>`;
  }).join("");
}

// ---- Log -------------------------------------------------------------------

function notebookLog() {
  // Every day the member put something down — a check-in, a session, or a note.
  const days = new Map();
  CHECKINS.forEach((c) => days.set(c.date, { date: c.date, checkin: c }));
  COMPLETIONS.forEach((c) => {
    const d = days.get(c.date) || { date: c.date };
    d.session = c;
    days.set(c.date, d);
  });
  const rows = [...days.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!rows.length) return `<p class="nb-title">Your log</p><p class="nb-empty">Nothing written down yet.</p>`;

  // The last week is what gets referenced; everything older is history, and a
  // year of it unrolled would bury the part you came for (2026-09-06, Chris).
  // Month headings sit directly under the recent days rather than behind a
  // second "show earlier" tap — one tap to a month, and the list of months
  // says at a glance how far back it goes.
  const cutoff = dateKey(new Date(Date.now() - 6 * 864e5));
  const recent = rows.filter((r) => r.date >= cutoff);
  const older = rows.filter((r) => r.date < cutoff);

  const byMonth = [];
  older.forEach((r) => {
    const key = r.date.slice(0, 7);
    let group = byMonth.find((g) => g.key === key);
    if (!group) {
      const [y, m] = key.split("-").map(Number);
      group = { key, label: new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }), rows: [] };
      byMonth.push(group);
    }
    group.rows.push(r);
  });

  return `
    <p class="nb-title">Your log</p>
    <p class="nb-sub">${CHECKIN_SERIES.map((c) => esc(c.label)).join(" \u00b7 ")}</p>
    ${recent.length ? recent.map(notebookLogRow).join("") : `<p class="nb-empty">Nothing this week.</p>`}
    ${byMonth.map((g) => {
      const open = notebookOpenMonths.has(g.key);
      return `
        <button class="nb-month" data-notebook-month="${esc(g.key)}" aria-expanded="${open}">
          <span class="nb-month-caret">${open ? "\u25B4" : "\u25BE"}</span>
          <span class="nb-month-name">${esc(g.label)}</span>
          <span class="nb-month-count">${g.rows.length} day${g.rows.length === 1 ? "" : "s"}</span>
        </button>
        ${open ? g.rows.map(notebookLogRow).join("") : ""}`;
    }).join("")}
  `;
}

function notebookLogRow(r) {
  const note = r.session ? sessionNoteFor(r.session.id) : "";
  const scores = CHECKIN_SERIES.map((cs) => {
    const value = r.checkin ? r.checkin[cs.key] : null;
    if (value == null || value === "") return "";
    return `<span><i class="nb-dot" style="background:${cs.color}"></i>${value}</span>`;
  }).join("");
  return `
    <div class="nb-logrow">
      <span class="nb-d">${formatShortDate(r.date)}</span>
      <span class="nb-t">${r.session ? esc(r.session.title) : "Rest day"}</span>
      <span class="nb-scores">${scores}</span>
    </div>
    ${note ? `<p class="nb-note">${esc(note)}</p>` : ""}
    ${r.checkin && r.checkin.note ? `<p class="nb-note">${esc(r.checkin.note)}</p>` : ""}
  `;
}

// ---- PRs -------------------------------------------------------------------

function notebookPRs() {
  const shown = showcasedPersonalBests();
  const eligible = personalBests();
  if (!shown.length) {
    return `
      <p class="nb-title">Personal bests</p>
      <p class="nb-sub">The lifts you're keeping an eye on</p>
      <p class="nb-empty">${eligible.length
        ? "Nothing pinned yet. When you beat a lift you'll be asked if you want it here."
        : "Log a weight during a workout and your bests can show up here."}</p>
      ${eligible.length ? `<button class="nb-action" data-notebook-action="choose-prs">+ Choose what shows here</button>` : ""}`;
  }
  return `
    <p class="nb-title">Personal bests</p>
    <p class="nb-sub">The lifts you're keeping an eye on</p>
    ${shown.map((pr) => `
      <div class="nb-lift"><b>${esc(pr.name)}</b><span>${pr.best} <small>lbs</small></span></div>
      <p class="nb-meta">${formatShortDate(pr.date)}${pr.previous ? ` · up ${pr.best - pr.previous} on previous` : " · first at this weight"}</p>
    `).join("")}
    <button class="nb-action" data-notebook-action="choose-prs">+ Choose what shows here</button>`;
}

// ---- Notes -----------------------------------------------------------------

function notebookNotes() {
  const list = (items, kind) => items.length
    ? items.map((t, i) => `<p class="nb-note" data-note-kind="${kind}" data-note-index="${i}">${esc(t)}</p>`).join("")
    : `<p class="nb-empty">Nothing here yet.</p>`;
  return `
    <p class="nb-title">Notes</p>
    <p class="nb-sub">Not tied to a day</p>
    <p class="nb-sect first">For my coach</p>
    ${list(NOTEBOOK_NOTES.coach, "coach")}
    <button class="nb-action" data-notebook-action="add-note" data-kind="coach">+ Add</button>
    <p class="nb-sect">Anything else</p>
    ${list(NOTEBOOK_NOTES.other, "other")}
    <button class="nb-action" data-notebook-action="add-note" data-kind="other">+ Add</button>`;
}

// ---- wiring ----------------------------------------------------------------

function wireNotebookBody() {
  document.querySelectorAll("#notebook-content [data-notebook-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.notebookAction;
      if (action === "checkin") { closeNotebook(); openCheckinModal(); return; }
      if (action === "choose-prs") { closeNotebook(); openPRPicker(); return; }
      // askText, not prompt — see its note. These three were the same silent
      // failure as the profile pencils: in a context where prompt() is not
      // supported the tap did nothing at all, and the Notebook is something
      // testers are being asked to use.
      if (action === "edit-session-note") {
        const id = btn.dataset.entry;
        // allowEmpty, because clearing the box is how a note is deleted.
        askText({ title: "Session note", label: "How did today go?",
                  value: sessionNoteFor(id), multiline: true, allowEmpty: true }).then((next) => {
          if (next === null) return;
          if (next.trim()) SESSION_NOTES[id] = next.trim(); else delete SESSION_NOTES[id];
          saveSessionNotes();
          renderNotebook();
        });
        return;
      }
      if (action === "add-note") {
        const kind = btn.dataset.kind;
        askText({ title: kind === "coach" ? "Ask your coach" : "New note",
                  label: kind === "coach" ? "Something to ask your coach" : "Note",
                  multiline: true }).then((text) => {
          if (!text || !text.trim()) return;
          NOTEBOOK_NOTES[kind].push(text.trim());
          saveNotebookNotes();
          renderNotebook();
        });
      }
    });
  });
  document.querySelectorAll("#notebook-content [data-notebook-month]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.notebookMonth;
      if (notebookOpenMonths.has(key)) notebookOpenMonths.delete(key);
      else notebookOpenMonths.add(key);
      // Hold the scroll position, or opening a month near the bottom throws
      // you back to the top of the page.
      const page = document.getElementById("notebook-page");
      const y = page.scrollTop;
      renderNotebook();
      page.scrollTop = y;
    });
  });
  // Tapping an existing note edits or clears it.
  document.querySelectorAll("#notebook-content [data-note-kind]").forEach((el) => {
    el.addEventListener("click", () => {
      const kind = el.dataset.noteKind, i = Number(el.dataset.noteIndex);
      askText({ title: "Edit note", label: "Clear it to delete",
                value: NOTEBOOK_NOTES[kind][i], multiline: true, allowEmpty: true }).then((next) => {
        if (next === null) return;
        if (next.trim()) NOTEBOOK_NOTES[kind][i] = next.trim();
        else NOTEBOOK_NOTES[kind].splice(i, 1);
        saveNotebookNotes();
        renderNotebook();
      });
    });
  });
}

// ---------------- Appearance (2026-09-04) ----------------
// Three states, not two: "system" follows the phone, and light/dark pin it.
// Stored per browser rather than per member — a phone is a phone whoever is
// signed in on it, and it has to be readable before we know who that is (the
// login screen is themed too). See applyTheme() in index.html's head for why
// the first paint can't wait for this file.
const THEME_KEY = "burnclub-theme";
const THEME_OPTIONS = [
  { id: "system", label: "Match my phone" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function currentTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return THEME_OPTIONS.some((o) => o.id === stored) ? stored : "system";
}

function applyTheme(theme) {
  // "system" removes the attribute entirely so the prefers-color-scheme media
  // query in style.css is the only thing deciding.
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  queueSync("preferences");
}

const CHECKIN_ENABLED_KEY = "burnclub-checkin-enabled";

function checkinEnabled() {
  return localStorage.getItem(memberKey(CHECKIN_ENABLED_KEY)) !== "0";
}

function setCheckinEnabled(on) {
  localStorage.setItem(memberKey(CHECKIN_ENABLED_KEY), on ? "1" : "0");
  renderCheckinAffordances();
  renderCheckinSection();
  queueSync("preferences");
}

// Asked once a day at most. Dismissing is remembered for that day only, so
// skipping today never turns the prompt off for good.
function checkinPromptDismissedToday() {
  return localStorage.getItem(memberKey(CHECKIN_DISMISS_KEY)) === dateKey(new Date());
}

function dismissCheckinPrompt() {
  localStorage.setItem(memberKey(CHECKIN_DISMISS_KEY), dateKey(new Date()));
  queueSync("preferences");
}

// ---- capture ---------------------------------------------------------------

// The quality answer is its own control because four choices aren't a scale —
// a slider would imply a precision that "Bad / OK / Good / Great" doesn't have.
let checkinQuality = null;

function renderCheckinQuality() {
  const cfg = APP_SETTINGS.checkin.sleepQuality;
  document.getElementById("checkin-quality-label").textContent = cfg.label;
  document.getElementById("checkin-quality-row").innerHTML = cfg.options.map((o) => `
    <button type="button" class="checkin-quality-btn ${o.value === checkinQuality ? "selected" : ""}"
            data-quality="${esc(o.value)}" aria-pressed="${o.value === checkinQuality}">${esc(o.label)}</button>
  `).join("");
}

function openCheckinModal() {
  const existing = todaysCheckin();
  const mental = document.getElementById("checkin-mental");
  const physical = document.getElementById("checkin-physical");
  const sleep = document.getElementById("checkin-sleepHours");
  mental.value = existing ? existing.mental : 7;
  physical.value = existing ? existing.physical : 7;
  sleep.value = existing && existing.sleepHours != null ? existing.sleepHours : 7;
  document.getElementById("checkin-mental-value").textContent = mental.value;
  document.getElementById("checkin-physical-value").textContent = physical.value;
  document.getElementById("checkin-sleepHours-value").textContent = sleep.value;
  checkinQuality = existing ? existing.sleepQuality || null : null;
  renderCheckinQuality();
  document.getElementById("checkin-note").value = existing ? existing.note || "" : "";
  // Wording from Admin -> Settings -> Daily Check-In. The two question keys
  // stay fixed — they're the field names inside every stored check-in.
  const ci = APP_SETTINGS.checkin;
  document.getElementById("checkin-title").textContent = existing ? "Update today's check-in" : ci.title;
  document.getElementById("checkin-sub").textContent = ci.sub;
  document.getElementById("checkin-note-prompt").innerHTML = `${esc(ci.notePrompt)} <em>Optional</em>`;
  document.getElementById("checkin-note").placeholder = ci.notePlaceholder;
  ci.questions.forEach((q) => {
    const input = document.getElementById("checkin-" + q.key);
    if (!input) return;
    const label = document.querySelector(`label[for="checkin-${q.key}"]`);
    // Hours read "7.5 hrs"; the 1-10 ratings read "7/10".
    const suffix = q.unit ? ` ${esc(q.unit)}` : "/10";
    if (label) label.innerHTML = `${esc(q.label)} <span id="checkin-${q.key}-value">${input.value}</span>${suffix}`;
    const scale = document.getElementById(`checkin-${q.key}-scale`);
    if (scale) scale.innerHTML = `<span>${esc(q.low)}</span><span>${esc(q.high)}</span>`;
  });
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
    sleepHours: Number(document.getElementById("checkin-sleepHours").value),
    // null rather than a default: not answering is different from answering
    // "OK", and the read-back should be able to tell.
    sleepQuality: checkinQuality,
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
  if (!checkinEnabled()) return;
  if (todaysCheckin() || checkinPromptDismissedToday()) return;
  openCheckinModal();
}

// The dot on the Home icon, and the post-workout nudge, both just answer
// "has today been logged yet".
function renderCheckinAffordances() {
  const done = !!todaysCheckin();
  // The dot answers "is today logged" and rides the Home shortcut, which stays
  // whether or not the prompt is on.
  document.querySelectorAll("[data-role='checkin-done-dot']").forEach((dot) => {
    dot.style.display = done ? "block" : "none";
  });
  // The nudge does come at the member, so it goes with the prompt.
  const nudge = document.getElementById("complete-checkin-nudge");
  if (nudge) nudge.style.display = done || !checkinEnabled() ? "none" : "block";
}

// ---- read-back -------------------------------------------------------------

// Labels come from Settings; the colours and the two keys stay here. The keys
// are the field names inside every stored check-in, and the colours are picked
// for contrast against each other and the chart background, not by taste.
// The second colour is not the palette's --danger: that sits at 2.94:1 on
// white, just under the 3:1 floor. This is the same coral nudged until it
// passes (3.33:1), with CVD separation from the blue of 19.7 (target 8) —
// computed, not eyeballed. Don't swap either for a nicer-looking hue.
const CHECKIN_SERIES = APP_SETTINGS.checkin.questions.map((q, i) => ({
  ...q,
  // Third is a teal: measured 4.6:1 on the light card and 5.4:1 on the dark
  // one, and separable from both the blue and the coral for the common forms
  // of colour blindness. Identity never rests on colour alone here anyway —
  // every series is labelled in the legend and at its last point.
  color: ["#788CE3", "#E0685E", "#2F7D74"][i] || "#5C7A99",
}));
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
  // 0-10, not 1-10: hours slept can legitimately be under 1, and a rating of 1
  // still lands inside the range.
  const y = (v) => padT + (1 - v / 10) * (h - padT - padB);

  const gridHtml = [0, 5, 10].map((v) =>
    `<line class="checkin-grid" x1="${padL}" x2="${w - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" />`
  ).join("");

  // Sleep only started being recorded partway through, so a series can begin
  // mid-chart. Points with no value break the line rather than being drawn as
  // zero — a member who wasn't asked didn't sleep zero hours.
  const drawn = CHECKIN_SERIES.map((s) => {
    const pts = entries.map((e, i) => ({ i, v: e[s.key] })).filter((p) => p.v != null && p.v !== "");
    return pts.length ? { s, pts, last: pts[pts.length - 1] } : null;
  }).filter(Boolean);

  // Three series close together put their end labels on top of each other, so
  // nudge any that land within a label's height of one another. Only the label
  // moves — the dot stays on its real value.
  const labels = drawn
    .map((d) => ({ text: d.last.v, colour: d.s.color, y: y(d.last.v) }))
    .sort((a, b) => a.y - b.y);
  const MIN = 10;
  labels.forEach((l, i) => { if (i && l.y - labels[i - 1].y < MIN) l.y = labels[i - 1].y + MIN; });

  const seriesHtml = drawn.map(({ s, pts, last }) => {
    let d = "", prev = null;
    pts.forEach((p) => {
      d += `${prev !== null && p.i === prev + 1 ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)} `;
      prev = p.i;
    });
    const label = labels.find((l) => l.colour === s.color && l.text === last.v);
    return `
      <path d="${d.trim()}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${x(last.i).toFixed(1)}" cy="${y(last.v).toFixed(1)}" r="4" fill="${s.color}" stroke="var(--card-white)" stroke-width="2" />
      <text class="checkin-point-label" x="${(w - padR + 6).toFixed(1)}" y="${((label ? label.y : y(last.v)) + 3.5).toFixed(1)}">${last.v}</text>
    `;
  }).join("");

  const first = formatShortDate(entries[0].date);
  const lastDate = formatShortDate(entries[entries.length - 1].date);

  host.innerHTML = `
    <div class="checkin-legend">
      ${CHECKIN_SERIES.map((s) => `<span class="checkin-legend-item"><span class="checkin-swatch" style="background:${s.color}"></span>${s.label}</span>`).join("")}
    </div>
    <svg aria-hidden="true" class="checkin-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Check-in scores over time">
      ${gridHtml}
      <text class="checkin-axis-label" x="${padL}" y="${h - 4}">${first}</text>
      <text class="checkin-axis-label checkin-axis-end" x="${w - padR}" y="${h - 4}">${lastDate}</text>
      ${seriesHtml}
    </svg>
  `;
}

let checkinListExpanded = false;

function renderCheckinSection() {
  const insightsEl = document.getElementById("checkin-insights");
  if (!insightsEl) return;
  const entries = recentCheckins(28);
  renderCheckinChart(entries);

  const insights = checkinInsights();
  const offNote = checkinEnabled()
    ? ""
    : `<p class="checkin-off-note">Daily prompt is off — turn it back on in Profile → Daily Check-In. You can still log a day from the notebook in the top bar.</p>`;
  insightsEl.innerHTML = offNote + (insights.length
    ? insights.map((t) => `<p class="checkin-insight">${t}</p>`).join("")
    : "");

  // The written entries moved to the Notebook's Log (2026-09-06). This section
  // is now the trend only — the chart and what it implies. The guard above is
  // on the insights element rather than the list, which no longer exists here;
  // guarding on the list would have skipped the chart too.
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

function logCompletion(circuit, weights, setWeights) {
  // No circuit means there's nothing to write, and writing a completion with
  // a null workoutId would put a junk row in the member's history that every
  // stat then has to count around. Returning null rather than throwing:
  // both callers treat the entry as optional, and a failed log should not
  // take the screen down with it (2026-09-16).
  if (!circuit || !circuit.id) return null;
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
    // And per set, from the end-of-block screens (2026-10-02). `weights` keeps
    // the top number per exercise because personal bests, the notebook and
    // every completion written before today read it; this is the detail
    // underneath, and is absent on anything older.
    setWeights: setWeights && Object.keys(setWeights).length ? { ...setWeights } : null,
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
// Set in Admin -> Settings -> Cardio Activities. The buttons used to be
// hardcoded in the markup too, which meant a member who rowed, swam or hiked
// had nowhere to log it — and so earned no challenge points for it.
const CARDIO_ACTIVITY_TYPES = APP_SETTINGS.cardioTypes;
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

// Built from the configured list rather than fixed markup, so adding Row or
// Swim in Settings actually gives members a button to press.
function renderCardioActivityPicker() {
  document.getElementById("cardio-activity-picker").innerHTML = CARDIO_ACTIVITY_TYPES
    .map((t) => `<button class="pill-filter" type="button" data-activity="${esc(t.id)}">${esc(t.id)}</button>`)
    .join("");
}

function updateCardioActivityPicker() {
  document.querySelectorAll("#cardio-activity-picker .pill-filter").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.activity === cardioSelectedActivity);
  });
  // Falls back to the first type if the selected one was removed in Settings.
  const meta = CARDIO_ACTIVITY_TYPES.find((t) => t.id === cardioSelectedActivity) || CARDIO_ACTIVITY_TYPES[0];
  if (!meta) return;
  document.getElementById("cardio-distance-label").textContent = meta.unitLabel;
  document.getElementById("cardio-distance-input").step = meta.step;
}

// The date this log will be filed under. Today unless a coach-scheduled cardio
// item opened the modal for an earlier day (2026-10-10) — logging Tuesday's
// assigned session on Wednesday should land on Tuesday, which is the day the
// calendar then ticks.
let cardioLogDate = null;

function openCardioLogModal(dateStr) {
  cardioLogDate = dateStr || null;
  cardioSelectedActivity = (CARDIO_ACTIVITY_TYPES[0] || {}).id;
  renderCardioActivityPicker();
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
  logCardioActivity({ activityType: cardioSelectedActivity, distanceValue, minutes, source: "manual", date: cardioLogDate || undefined });
  renderCardioLog();
  // The Calendar ticks a coach's cardio item off a completion on that date, so
  // it has to re-read after one is written. Guarded because the modal is also
  // opened from the Cardio tab, where the Calendar may never have rendered.
  if (CURRENT_MEMBER.scheduleType === "structured") renderCalendarTab();
  renderHomeWeekSnapshot();
  renderCircuitLists();
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

// Weeks start MONDAY (2026-10-18, Chris: "we default the start of the week to
// Monday in everything we do"). Was Sunday, which is what `- d.getDay()`
// gives, because getDay() calls Sunday 0.
//
//   (getDay() + 6) % 7  ->  Mon 0, Tue 1 ... Sun 6
//
// so Sunday walks back six days to the Monday that began its week instead of
// starting a new one. There are THREE copies of this function — here, in
// data.js and in admin/data.js — and they must agree: admin tags a workout
// into a week and the member app decides whether that week is the live one,
// so a one-day disagreement silently publishes the wrong circuits.
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
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
  // The LAST DAY, not the number of items. template.length was right only
  // while every day held exactly one entry — which stopped being true on
  // 2026-10-10 when cardio and reminders could share a day with a workout.
  // An 8-week programme with 10 extra items read as 10 weeks: "Week 2 of 10",
  // a completion card that never came, and two weeks of empty days after the
  // programme had actually finished. Caught 2026-10-16 by the week-preview
  // button offering a Week 9 that does not exist.
  const totalDays = template.reduce((max, it) => Math.max(max, it.day || 0), 0);
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
    totalWorkouts: allWorkouts.length,
    doneAll,
    percentComplete: allWorkouts.length ? Math.round((doneAll / allWorkouts.length) * 100) : 0,
    notStarted: day < 1,
    finished: day > totalDays,
    endDate: dateForProgramDay(totalDays),
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
  // Leading blanks before the 1st. Monday-first, so the columns line up with
  // every other week view in the app rather than being the one grid still
  // reading Sunday-first.
  const lead = (first.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) html += `<div class="cal-day empty"></div>`;
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

  return `<svg aria-hidden="true" class="year-chart" viewBox="0 0 ${width} ${valueH + chartH + labelH}" role="img" aria-label="Workouts completed per month this year">${bars}</svg>`;
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

// A finished programme replaces the week snapshot instead of sitting beside
// it (2026-08-23). The snapshot clamps to the last week, so without this a
// member who finished in May still sees "Week 8 · Day 7" and "0/6 Done This
// Week" — an active week they look like they're failing, forever.
// Longest run of consecutive days with any completion, inside the programme's
// own window. Not currentStreak(), which is anchored to today and would read
// 0 for anyone who finished a while ago.
function longestStreakBetween(startKey, endKey) {
  const days = [...new Set(COMPLETIONS.map((c) => c.date))]
    .filter((d) => d >= startKey && d <= endKey)
    .sort();
  let best = 0, run = 0, prev = null;
  days.forEach((d) => {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  });
  return best;
}

function formatTrainingTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// {placeholder} -> value. An unknown placeholder is left as written rather
// than blanked, so a typo in Settings shows up as "{weks}" on the card
// instead of silently swallowing the word.
function fillCopyTemplate(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? vars[key] : whole));
}

function renderProgramComplete(pos) {
  const card = document.getElementById("program-complete");
  const snapshot = document.getElementById("home-week-snapshot");
  if (!card || !snapshot) return false;
  const done = !!(pos && pos.finished);
  card.style.display = done ? "block" : "none";
  snapshot.style.display = done ? "none" : "";
  if (!done) return false;

  // Every word on this card is Chris's to reword (Admin -> Settings ->
  // Member-Facing Copy); only the member's own numbers are computed. The
  // headline and subline take placeholders because they name the member's
  // program and dates — see fillCopyTemplate().
  //
  // The default headline is "Your 8 weeks are up", not "You finished" (Chris,
  // 2026-08-23): the card fires on the calendar, not on effort, so a member
  // who trained twice would have been congratulated for finishing. If that
  // wording is ever changed here, that's the reasoning it's changing away
  // from.
  const pc = APP_SETTINGS.copy.programComplete;
  // Year included deliberately: this can be read months or years after the
  // fact, and "Aug 23" alone is ambiguous once a year has turned over.
  const ended = pos.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const vars = { weeks: pos.totalWeeks, program: CURRENT_MEMBER.program, date: ended };

  document.getElementById("program-complete-title").textContent = fillCopyTemplate(pc.title, vars);
  document.getElementById("program-complete-sub").textContent = fillCopyTemplate(pc.sub, vars);
  document.getElementById("program-complete-eyebrow").textContent = pc.eyebrow;
  document.getElementById("program-complete-cta").textContent = pc.cta;
  document.getElementById("program-complete-note").textContent = pc.note;

  // Three stats that each say something different. The old set repeated
  // itself: "8 Weeks" was already in the sentence above, and "63% of the
  // plan" is "30/48" a second time.
  const startKey = CURRENT_MEMBER.startDate;
  const endKey = dateKey(pos.endDate);
  const inProgram = COMPLETIONS.filter((c) => c.date >= startKey && c.date <= endKey);
  const minutes = inProgram.reduce((sum, c) => sum + (c.minutes || 0), 0);
  document.getElementById("pc-workouts").textContent = `${pos.doneAll}/${pos.totalWorkouts}`;
  document.getElementById("pc-time").textContent = formatTrainingTime(minutes);
  document.getElementById("pc-streak").textContent = longestStreakBetween(startKey, endKey);
  return true;
}

function renderHomeWeekSnapshot() {
  const grid = document.getElementById("home-week-grid");
  if (!grid) return;
  const finishedPos = memberProgramPosition();
  if (renderProgramComplete(finishedPos)) return;
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
      <svg aria-hidden="true" class="workout-mix-donut" viewBox="0 0 100 100" role="img" aria-label="Breakdown of workout types this period">
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

// ---------------- Nutrition targets (2026-10-19) ----------------
// Chris: "I do not want to be a food tracker whatsoever. I want the member to
// see targets, and if we can influence people to track ... when they are
// tracking, they are at the same time learning more about food, serving
// sizes, where calories come from."
//
// So: four numbers, a line from the coach, and a daily yes/no about whether
// they tracked — somewhere else. No meals, no foods, no entries.

// Ten, not fourteen (2026-10-19, Chris: "14 days is too much, lets see 10
// and go from there"). Wider dots, and a row you can count at a glance
// instead of one you have to measure.
const NUTRITION_DAYS = 10;

let NUTRITION_TARGETS = null;   // what the coach set, or null if nothing set
let NUTRITION_LOG = {};         // { "YYYY-MM-DD": { tracked, hit_targets } }

const NUTRITION_DEMO_TARGETS = {
  calories: 2100, protein_g: 165, carbs_g: 190, fat_g: 65,
  note: "Protein first — hit that number every day. Carbs around training, fat fills the rest.",
};

async function loadNutrition() {
  // The demo shows the card with plausible numbers; a real session reads the
  // coach's. A member with no targets set sees nothing at all, which is the
  // point of the nulls in member_nutrition.
  if (isDemoSession()) {
    NUTRITION_TARGETS = NUTRITION_DEMO_TARGETS;
    NUTRITION_LOG = buildDemoNutritionLog();
    renderNutritionCards();
    return;
  }
  if (typeof fetchNutritionTargets !== "function") return;
  const since = new Date();
  since.setDate(since.getDate() - (NUTRITION_DAYS - 1));
  const [targets, log] = await Promise.all([
    fetchNutritionTargets(),
    fetchNutritionLog(dateKey(since)),
  ]);
  NUTRITION_TARGETS = targets;
  NUTRITION_LOG = {};
  log.forEach((row) => { NUTRITION_LOG[row.log_date] = row; });
  renderNutritionCards();
}

// A fortnight of plausible marks so the demo's dot row is not empty. Seeded
// off the day offset rather than random, so a screenshot taken today still
// matches one taken next week.
function buildDemoNutritionLog() {
  const out = {};
  for (let i = 1; i < NUTRITION_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tracked = (i * 7) % 10 > 2;
    out[dateKey(d)] = { tracked, hit_targets: tracked ? (i * 3) % 10 > 3 : null };
  }
  return out;
}

function nutritionMarkFor(key) {
  return NUTRITION_LOG[key] || { tracked: false, hit_targets: null };
}

// Oldest first, today last — same direction as reading.
function nutritionRecentDays() {
  const out = [];
  for (let i = NUTRITION_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push({ key, date: d, isToday: i === 0, ...nutritionMarkFor(key) });
  }
  return out;
}

function nutritionCardHtml() {
  const t = NUTRITION_TARGETS;
  const todayKey = dateKey(new Date());
  const today = nutritionMarkFor(todayKey);
  const macro = (label, value, unit) =>
    value || value === 0
      ? `<div class="nutrition-macro">
           <p class="nutrition-macro-num">${esc(String(value))}<span class="nutrition-macro-unit">${unit}</span></p>
           <p class="nutrition-macro-label">${label}</p>
         </div>`
      : "";
  const days = nutritionRecentDays().map((d) => {
    // Three states, and they are genuinely different: didn't track, tracked
    // but missed, tracked and hit. A missed day is not a blank — blank is a
    // day that has not happened yet or was never answered.
    const state = !d.tracked ? "none" : d.hit_targets ? "hit" : "tracked";
    return `<span class="nutrition-dot is-${state} ${d.isToday ? "is-today" : ""}"
                  title="${esc(d.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }))}"></span>`;
  }).join("");

  return `
    <div class="section-head">
      <span class="section-icon nutrition-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-3.9 0-6.5-3.4-6.5-7.4 0-3.2 2-5.6 4.3-5.6 1.2 0 1.8.5 2.2.5s1-.5 2.4-.5c2.2 0 4.1 2.2 4.1 5.4C18.5 17.5 15.9 21 12 21z"/><path d="M12 7.6c0-2 1.5-3.6 3.4-3.8"/></svg></span>
      <h2 class="home-section-title has-icon">Your Targets</h2>
    </div>
    <div class="nutrition-macros">
      ${macro("Calories", t.calories, "")}
      ${macro("Protein", t.protein_g, "g")}
      ${macro("Carbs", t.carbs_g, "g")}
      ${macro("Fat", t.fat_g, "g")}
    </div>
    ${t.note ? `<p class="nutrition-note">${esc(t.note)}</p>` : ""}
    <div class="nutrition-track">
      <div class="nutrition-ask">
        <p class="nutrition-ask-q">Tracked your food today?</p>
        <div class="nutrition-choices">
          <button type="button" class="nutrition-choice ${today.tracked ? "is-on" : ""}" data-track="yes">Yes</button>
          <button type="button" class="nutrition-choice ${!today.tracked && NUTRITION_LOG[todayKey] ? "is-on" : ""}" data-track="no">Not today</button>
        </div>
      </div>
      ${today.tracked ? `
        <div class="nutrition-ask">
          <p class="nutrition-ask-q">Hit your targets?</p>
          <div class="nutrition-choices">
            <button type="button" class="nutrition-choice ${today.hit_targets === true ? "is-on" : ""}" data-hit="yes">Yes</button>
            <button type="button" class="nutrition-choice ${today.hit_targets === false ? "is-on" : ""}" data-hit="no">Not quite</button>
          </div>
        </div>` : ""}
      <div class="nutrition-dots" aria-label="Your last ${NUTRITION_DAYS} days">${days}</div>
    </div>`;
}

// Both training tabs get the same card. They are mutually exclusive per
// member, so this fills whichever one that member actually has.
function renderNutritionCards() {
  ["nutrition-card-program", "nutrition-card-calendar"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // No targets set means no card. A coach who has not set someone up yet
    // should not leave them looking at four dashes.
    if (!NUTRITION_TARGETS) { el.hidden = true; el.innerHTML = ""; return; }
    el.innerHTML = nutritionCardHtml();
    el.hidden = false;
    el.querySelectorAll("[data-track]").forEach((b) => {
      b.addEventListener("click", () => setNutritionMark(b.dataset.track === "yes", null));
    });
    el.querySelectorAll("[data-hit]").forEach((b) => {
      b.addEventListener("click", () => setNutritionMark(true, b.dataset.hit === "yes"));
    });
  });
}

function setNutritionMark(tracked, hitTargets) {
  const key = dateKey(new Date());
  const prev = nutritionMarkFor(key);
  // Answering "yes" again must not wipe an answer already given to the second
  // question — only a switch to "not today" clears it, because the question
  // stops applying.
  const hit = tracked ? (hitTargets === null ? prev.hit_targets ?? null : hitTargets) : null;
  NUTRITION_LOG[key] = { tracked, hit_targets: hit };
  renderNutritionCards();
  if (!isDemoSession() && AUTH_MEMBER && typeof saveNutritionMark === "function") {
    // Not awaited: the tap has already been answered on screen, and a slow
    // network must not make a yes/no feel broken.
    saveNutritionMark(AUTH_MEMBER.id, key, tracked, hit);
  }
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

  // Rendered from settings rather than left in the markup (2026-10-17): it is
  // the closing line of the page and the one bit of member-facing copy that
  // used to need a deploy to change. textContent, not innerHTML — this string
  // comes from an editable field, and the day it holds an apostrophe or an
  // ampersand it should read as one, not break the card.
  const motivation = document.getElementById("progress-motivation-text");
  if (motivation) motivation.textContent = APP_SETTINGS.copy.motivation || "";
  const motivationCard = document.getElementById("progress-motivation");
  // An empty quote hides the card instead of leaving a coloured blank — a
  // coach who clears the field means "no quote", not "a quote with nothing
  // in it".
  if (motivationCard) motivationCard.hidden = !(APP_SETTINGS.copy.motivation || "").trim();

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
    <p class="benchmark-name">${esc(benchmark.name)}</p>
    <p class="benchmark-subtitle">${esc(benchmark.subtitle)}</p>
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
  // Each source has its own value now (Admin -> Settings -> Challenge
  // Scoring). They all used to borrow the challenge's per-workout number,
  // which made a habit day worth as much as a full circuit.
  const workouts = workoutCount * challenge.pointsPerWorkout;
  const cardio = cardioCount * APP_SETTINGS.scoring.cardioPoints;
  const habits = habitDays * APP_SETTINGS.scoring.habitDayPoints;
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
  const size = Math.max(1, APP_SETTINGS.scoring.levelSize);
  const maxPoints = Math.max(size, ...standings.map((s) => s.points));
  const levelCount = Math.ceil(maxPoints / size);
  const levels = [];
  for (let i = 1; i <= levelCount; i++) {
    const min = (i - 1) * size + 1;
    const max = i * size;
    const count = standings.filter((s) => Math.max(1, Math.ceil(s.points / size)) === i).length;
    const mine = standings.some((s) => s.me && Math.max(1, Math.ceil(s.points / size)) === i);
    levels.push({ level: i, min, max, count, mine });
  }
  return levels.reverse(); // highest level first, reads top-down like a ladder
}

let challengeLeaderboardExpanded = false;

// A team's score is its members' points added up. Only the current member's
// points are real here — everyone else's come from the seeded table, same
// limitation as the individual leaderboard. A backend computes all of them.
function teamStandings(challenge) {
  const myPoints = challengePointsForMember(challenge);
  return CHALLENGE_TEAMS.map((t) => ({
    team: t,
    mine: (t.memberIds || []).includes(CURRENT_MEMBER.id),
    total: (t.memberIds || []).reduce((sum, id) =>
      sum + (id === CURRENT_MEMBER.id ? myPoints : (SEEDED_TEAM_POINTS[id] || 0)), 0),
  })).sort((a, b) => b.total - a.total);
}

// Built to mirror renderChallengeCard() above (2026-08-27, Chris: "I want the
// team challenge card to look more like the individual"): same eyebrow ->
// name -> ranked rows -> your own line. The individual card ranks point
// brackets; this one ranks the teams themselves, biggest first.
//
// The member's own team keeps the coloured left border and a marked row, so
// "which one is mine" doesn't depend on reading the names.
function renderTeamChallengeCard() {
  const container = document.getElementById("team-challenge-card");
  if (!container) return;
  const challenge = currentChallenge();
  const team = myChallengeTeam();
  if (!challenge || !team || !CHALLENGE_TEAMS.length) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }
  container.style.display = "block";

  const standings = teamStandings(challenge);
  const myIndex = standings.findIndex((s) => s.mine);
  const mine = standings[myIndex];
  const myPoints = challengePointsForMember(challenge);
  // Bars are relative to the leader, not to a target: a team challenge has no
  // threshold to hit, so the only meaningful scale is each other.
  const leader = Math.max(1, standings[0].total);

  const rows = standings.map((row, i) => {
    const colour = esc(row.team.color || "#788CE3");
    return `
    <div class="team-standing-row ${row.mine ? "mine" : ""}" ${row.mine ? `style="--team-colour:${colour}"` : ""}>
      <span class="team-standing-rank">${i + 1}</span>
      <span class="team-standing-dot" style="background:${colour}"></span>
      <span class="team-standing-name">${esc(row.team.name)}</span>
      <span class="team-standing-you-slot">${row.mine ? `<span class="team-standing-you">You</span>` : ""}</span>
      <div class="team-standing-track"><div class="team-standing-fill" style="width:${Math.round((row.total / leader) * 100)}%;background:${colour}"></div></div>
      <span class="team-standing-total">${row.total}</span>
    </div>
  `;
  }).join("");

  container.innerHTML = `
    <div class="team-challenge" style="--team-colour:${esc(team.color || "#788CE3")}">
      <p class="challenge-eyebrow">Team Challenge</p>
      <h2 class="challenge-name">${esc(TEAM_CHALLENGE_NAME)}</h2>

      <div class="team-standings-list">${rows}</div>

      <div class="team-challenge-mine-block">
        <p class="team-challenge-mine">
          ${myPoints === mine.total
            ? `Every one of ${esc(team.name)}'s <strong>${mine.total}</strong> points is yours`
            : `You've put <strong>${myPoints}</strong> of ${esc(team.name)}'s <strong>${mine.total}</strong>`}
          ${myIndex === 0 ? "— and they're in front." : `— they're #${myIndex + 1} of ${standings.length}.`}
        </p>
        <div class="team-challenge-mates">
          ${(team.memberNames || []).map((n) => `<span class="team-mate">${esc(n)}</span>`).join("")}
        </div>
      </div>
    </div>
  `;
}

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
      <h2 class="challenge-name">${esc(challenge.name)}</h2>
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

      <p class="challenge-levels-title">Levels (every ${APP_SETTINGS.scoring.levelSize} pts)</p>
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
  renderTeamChallengeCard();
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
  if (!isDemoSession()) return { provider: null };
  localStorage.setItem(memberKey(WEARABLE_STORAGE_KEY), JSON.stringify(WEARABLE_DEFAULT));
  return { ...WEARABLE_DEFAULT };
}

function saveWearableState() {
  localStorage.setItem(memberKey(WEARABLE_STORAGE_KEY), JSON.stringify(WEARABLE));
  queueSync("preferences");
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
  if (!isDemoSession()) return [];
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

// Wearables are off until the integration is real (2026-10-16, Chris: "can we
// make the buttons to connect to a wearable in the profile greyed out for now
// since this feature will not be available for some time").
//
// Off rather than hidden: the Today card already shows steps and resting heart
// rate for a connected member, so removing the section would leave a member
// wondering where that data comes from and no way to ask. Greyed says "not
// yet"; absent says nothing at all.
//
// DISCONNECT is disabled too, and that is the part worth getting right.
// Jordan Tester is connected on purpose — his watch figures are what the
// demo visuals are built on — and leaving Disconnect live next to a dead
// Connect is a one-way door: one tap and the data is gone with no way back.
const WEARABLES_AVAILABLE = false;

function renderWearableSection() {
  const container = document.getElementById("wearable-section");
  if (!container) return;
  const notice = document.getElementById("wearable-coming-soon");
  if (notice) notice.hidden = WEARABLES_AVAILABLE;

  container.innerHTML = ["apple", "garmin"].map((provider) => {
    const connected = WEARABLE.provider === provider;
    const off = !WEARABLES_AVAILABLE;
    return `
      <div class="wearable-row${off ? " is-unavailable" : ""}">
        <div>
          <p class="wearable-name">${WEARABLE_LABELS[provider]}</p>
          <p class="wearable-status ${connected ? "connected" : ""}">${connected ? "● Connected" : "Not connected"}</p>
        </div>
        ${connected
          ? `<button class="btn-ghost-lg small" ${off ? `disabled title="Not available yet"` : `data-disconnect-provider="${provider}"`}>Disconnect</button>`
          : `<button class="btn-ghost-lg small" ${off ? `disabled title="Not available yet"` : `data-connect-provider="${provider}"`}>Connect</button>`}
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

// The cap, in one place. It was the literal 3 in the guard, the literal 3 in
// the "can add more" test, and the literal 3 twice over in a hardcoded
// sentence that claimed "3 of 3 habits set" no matter how many there actually
// were — which is what hid ten of them from view (2026-10-19).
const MAX_HABITS = 3;

const MY_HABITS_STORAGE_KEY = "burnclub-my-habits";
const HABIT_CHECKS_STORAGE_KEY = "burnclub-habit-checks";
let MY_HABITS = [];
let HABIT_CHECKS = {};
let habitPickerOpen = false;

// One entry per habit, first wins, capped at the three the UI allows.
//
// Deduped by LABEL as well as id (2026-10-19). Same-id duplicates should be
// impossible — the table's primary key is (member_id, habit_id) — but Chris's
// account showed "10,000 Steps" three times, which means rows whose ids had
// drifted apart while the label stayed. An admin edit to the Habit Library
// reslugs a label into a new id, and the old row was never deleted because
// habit removals did not reach the server until today. Deduping on the label
// is what a member actually sees: two rows reading the same thing are the
// same habit however they are filed.
//
// Exported-ish: sync.js calls this on pulled rows too, so a dirty server
// cannot put the duplicates straight back.
function dedupeHabits(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  list.forEach((h) => {
    if (!h || !h.id) return;
    const key = String(h.label || h.id).trim().toLowerCase();
    if (seen.has(h.id) || seen.has(key)) return;
    seen.add(h.id);
    seen.add(key);
    out.push(h);
  });
  return out.slice(0, MAX_HABITS);
}

function loadMyHabits() {
  const stored = localStorage.getItem(memberKey(MY_HABITS_STORAGE_KEY));
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const clean = dedupeHabits(parsed);
      // Self-healing: an account that already accumulated duplicates is fixed
      // on the next load rather than needing anyone to notice and prune them
      // by hand. Written back so the repair survives, and only when something
      // actually changed, so a healthy account does no write at all.
      if (!Array.isArray(parsed) || clean.length !== parsed.length) {
        localStorage.setItem(memberKey(MY_HABITS_STORAGE_KEY), JSON.stringify(clean));
        if (typeof queueSync === "function") queueSync("myHabits");
      }
      return clean;
    } catch (e) {
      // fall through and reseed
    }
  }
  // No isDemoSession() guard here, unlike every other loader: three default
  // habits are a sensible starting set rather than invented history. They
  // start unchecked, so a real member is told nothing untrue.
  localStorage.setItem(memberKey(MY_HABITS_STORAGE_KEY), JSON.stringify(MY_HABITS_DEFAULT));
  return [...MY_HABITS_DEFAULT];
}

function saveMyHabits() {
  localStorage.setItem(memberKey(MY_HABITS_STORAGE_KEY), JSON.stringify(MY_HABITS));
  queueSync("myHabits");
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
  queueSync("habitChecks");
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
          <span class="habit-label">${esc(h.label)}</span>
          ${h.auto && WEARABLE.provider ? `<span class="habit-auto-tag"><span class="habit-auto-icon">${ICON_LINK}</span>Auto</span>` : ""}
        </button>
      `;
    }).join("");
    // Scoped to the container just rebuilt, not the whole document
    // (2026-10-19). A document-wide query binds a fresh listener to every
    // habit button on the page, including ones in a container this render did
    // not replace — so those accumulate a listener per render and a single
    // tap fires toggleHabit several times. The nodes here are new every time,
    // so scoping also means nothing stacks.
    container.querySelectorAll("[data-toggle-habit]").forEach((btn) => {
      btn.addEventListener("click", () => toggleHabit(btn.dataset.toggleHabit));
    });
  }
  const streakNumEl = document.getElementById("habit-streak-num");
  if (streakNumEl) streakNumEl.textContent = currentHabitStreak();
}

function addHabit(habit) {
  if (!habit || MY_HABITS.length >= MAX_HABITS) return;
  // Never twice. The picker already filters out anything held, so this should
  // be unreachable — but it is the only line that can grow the list, and the
  // list growing past its cap is the bug this whole pass is about.
  const key = String(habit.label || habit.id).trim().toLowerCase();
  if (MY_HABITS.some((h) => h.id === habit.id || String(h.label || "").trim().toLowerCase() === key)) return;
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
          <p class="wearable-name">${esc(h.label)}</p>
          <button class="habit-remove-btn" data-remove-habit="${h.id}" aria-label="Remove ${esc(h.label)}">✕</button>
        </div>
      `).join("")
    : `<div class="wearable-row"><p class="wearable-status">No habits set yet.</p></div>`;

  const canAddMore = MY_HABITS.length < MAX_HABITS;
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
    // The REAL count, not a hardcoded "3 of 3". The old string said three
    // whatever the list held, so an account carrying ten of them read as
    // perfectly normal and nobody could tell from this screen that anything
    // was wrong (2026-10-19).
    addUi = `<p class="habit-limit-note">${MY_HABITS.length} of ${MAX_HABITS} habits set — remove one to add another.</p>`;
  }

  container.innerHTML = `<div class="wearable-section">${rowsHtml}</div>${addUi}`;

  // Same reasoning as renderHabitsSection: bind inside what was just drawn.
  container.querySelectorAll("[data-remove-habit]").forEach((btn) => {
    btn.addEventListener("click", () => removeHabit(btn.dataset.removeHabit));
  });
  const addBtn = document.getElementById("add-habit-btn");
  if (addBtn) addBtn.addEventListener("click", () => { habitPickerOpen = true; renderHabitManager(); });
  container.querySelectorAll("[data-pick-habit]").forEach((btn) => {
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
  queueSync("healthProfile");
}

// ---------------- Health profile completeness (2026-10-12) ----------------
// Nothing in onboarding asks a member for any of this: setting a password
// drops them straight into the app, and the form is five taps deep at
// Profile → My Health Profile with nothing pointing at it. Chris's call is to
// leave the filling-in to them but to say plainly that it is unfinished
// ("a red icon of sorts in their profile letting them know something is
// missing"), so this is the only thing that will ever prompt them.
//
// Target Weight and Injuries are excluded — both are labelled optional on the
// form itself, and a badge that can never be cleared is worse than no badge.
const HEALTH_PROFILE_REQUIRED = [
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "dob", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "activityLevel", label: "Activity level" },
  { key: "goal", label: "Primary goal" },
];

function healthProfileStatus() {
  const saved = loadHealthProfiles()[CURRENT_MEMBER.id] || {};
  const missing = HEALTH_PROFILE_REQUIRED.filter((f) => !String(saved[f.key] || "").trim());
  return { missing, complete: missing.length === 0, total: HEALTH_PROFILE_REQUIRED.length };
}

// Two places, because they answer different questions: the badge on the row
// says WHAT is unfinished, and the dot on the nav says there is something to
// go and look at — without it a member who never opens Profile never finds
// out.
// A flag beside each required field that is still empty, rather than a list of
// field names at the top of the form (2026-10-12, Chris: "just add a small
// icon next to the required filed that needs filled in that disappears once
// saved"). It points at the thing to fix instead of describing it, and the
// optional two never carry one.
function renderHealthProfileFieldFlags() {
  const saved = loadHealthProfiles()[CURRENT_MEMBER.id] || {};
  document.querySelectorAll("[data-hp-flag]").forEach((el) => {
    el.hidden = !!String(saved[el.dataset.hpFlag] || "").trim();
  });
}

function renderHealthProfileFlag() {
  const { missing, complete, total } = healthProfileStatus();
  const badge = document.getElementById("health-profile-badge");
  if (badge) {
    badge.hidden = complete;
    badge.textContent = complete ? "" : `${missing.length} of ${total} missing`;
  }
  const dot = document.getElementById("profile-nav-dot");
  if (dot) dot.hidden = complete;
}

// The three dropdowns are filled from APP_SETTINGS rather than written into
// the markup (2026-10-12), so Chris can change them at Admin → Settings →
// Health Profile Options. Rebuilt on every open so an edit made in admin shows
// up without a reload, the same way the rest of the settings bridge works.
//
// A value the member saved under an option that has since been removed is kept
// rather than silently cleared: it is appended as its own option, so opening
// the form doesn't quietly rewrite their answer to blank.
// The label that went with a removed option is gone with it, so the id is all
// there is to go on — "sedentary" reads like a bug next to "Lightly Active",
// and this at least reads like a word. The `opt-` prefix is the one auto
// ids carry (see slugify in admin), and it means nothing to a member.
function labelFromOptionId(id) {
  return String(id).replace(/^opt-/, "").split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fillHealthProfileSelect(elId, options, savedValue) {
  const el = document.getElementById(elId);
  const known = options.some((o) => o.id === savedValue);
  el.innerHTML = [`<option value="">Select…</option>`]
    .concat(options.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`))
    .concat(savedValue && !known
      ? [`<option value="${esc(savedValue)}">${esc(labelFromOptionId(savedValue))}</option>`]
      : [])
    .join("");
  el.value = savedValue || "";
}

// ---------------- Change password (2026-10-15) ----------------
// Testers are handed a password set for them in the Supabase dashboard,
// because the invite email lands in spam. Without this the only way to change
// it is that same emailed link — so a member keeps whatever they were given,
// forever, in the one part of the app that should be theirs.
function openPasswordScreen() {
  ["pw-current", "pw-new", "pw-confirm"].forEach((id) => { document.getElementById(id).value = ""; });
  document.getElementById("pw-error").hidden = true;
  document.getElementById("pw-saved").style.display = "none";
  document.getElementById("password-overlay").classList.add("visible");
}

function closePasswordScreen() {
  document.getElementById("password-overlay").classList.remove("visible");
}

async function savePasswordForm() {
  const err = document.getElementById("pw-error");
  const btn = document.getElementById("pw-save-btn");
  const current = document.getElementById("pw-current").value;
  const next = document.getElementById("pw-new").value;
  const confirmed = document.getElementById("pw-confirm").value;
  const fail = (msg) => { err.textContent = msg; err.hidden = false; };
  err.hidden = true;

  if (!current) return fail("Enter your current password.");
  // Matches the invite form's rule, and Supabase's own minimum.
  if (next.length < 8) return fail("Use at least 8 characters.");
  // Checked here rather than after the round trip: a typo in the confirm box
  // should not cost a network call, and should certainly not change anything.
  if (next !== confirmed) return fail("Those two don't match.");
  if (next === current) return fail("That's the password you already have.");

  btn.disabled = true;
  btn.textContent = "Saving…";
  const res = await changePassword(current, next);
  btn.disabled = false;
  btn.textContent = "Save Password";
  if (res.error) return fail(res.error);

  ["pw-current", "pw-new", "pw-confirm"].forEach((id) => { document.getElementById(id).value = ""; });
  document.getElementById("pw-saved").style.display = "block";
  setTimeout(closePasswordScreen, 1200);
}

// Only a real account has a password. A demo session has nothing to change,
// and offering it there would be a row that can only fail.
function applyPasswordRowVisibility() {
  const row = document.getElementById("open-password-btn");
  if (row) row.hidden = typeof AUTH_MEMBER === "undefined" || !AUTH_MEMBER;
}

function openHealthProfileScreen() {
  const saved = loadHealthProfiles()[CURRENT_MEMBER.id] || {};
  const opts = APP_SETTINGS.healthProfileOptions;
  fillHealthProfileSelect("hp-sex", opts.sex, saved.sex);
  fillHealthProfileSelect("hp-activity", opts.activityLevel, saved.activityLevel);
  fillHealthProfileSelect("hp-goal", opts.goal, saved.goal);
  document.getElementById("hp-height").value = saved.height || "";
  document.getElementById("hp-weight").value = saved.weight || "";
  document.getElementById("hp-dob").value = saved.dob || "";
  document.getElementById("hp-target-weight").value = saved.targetWeight || "";
  document.getElementById("hp-injuries").value = saved.injuries || "";
  document.getElementById("hp-saved-note").style.display = "none";
  renderHealthProfileFieldFlags();
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
  // Both have to answer to what was just saved, or a member who fills the form
  // in still sees the flags and "Incomplete" behind it.
  renderHealthProfileFlag();
  renderHealthProfileFieldFlags();
}

// Notifications — device-local prefs only (no member-facing product would
// bridge these to staff/admin), so plain localStorage, not the shared key.
const NOTIF_PREFS_KEY = "burnclub-notif-prefs";
// Set in Admin -> Settings -> Notifications, defaults included.
const NOTIF_TYPES = APP_SETTINGS.notifications;
let NOTIF_PREFS = {};

function loadNotifPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || "null");
    if (stored) return stored;
  } catch (e) {}
  const defaults = {};
  NOTIF_TYPES.forEach((t) => { defaults[t.id] = t.defaultOn !== false; });
  return defaults;
}

function saveNotifPrefs() {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(NOTIF_PREFS));
  queueSync("preferences");
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

// Reuses the notification toggle row so "off" looks the same everywhere in
// Profile, plus a line saying what off actually does — a member shouldn't have
// to switch it off to find out whether it deletes their history.
function renderAppearanceSettings() {
  const active = currentTheme();
  document.getElementById("appearance-body").innerHTML = `
    ${THEME_OPTIONS.map((o) => `
      <button class="notif-row ${o.id === active ? "checked" : ""}" data-theme-choice="${o.id}" type="button">
        <span class="notif-checkbox">${o.id === active ? "✓" : ""}</span>
        <span class="notif-label">${o.label}</span>
      </button>
    `).join("")}
    <p class="checkin-settings-note">${active === "system"
      ? "Burn Club follows whatever your phone is set to, and switches with it."
      : `Burn Club stays ${active} whatever your phone is set to.`}</p>
  `;
  document.querySelectorAll("[data-theme-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTheme(btn.dataset.themeChoice);
      renderAppearanceSettings();
    });
  });
}

function openAppearanceSettings() {
  renderAppearanceSettings();
  document.getElementById("appearance-overlay").classList.add("visible");
}

function closeAppearanceSettings() {
  document.getElementById("appearance-overlay").classList.remove("visible");
}

// Toggling it on plays the finish cue straight away. Two reasons: a member
// can tell whether they will actually hear it in the room they train in, and
// the tap doubles as the gesture iOS needs before any audio will play at all.
function renderSoundSettings() {
  const on = timerSoundsEnabled();
  document.getElementById("sound-settings-body").innerHTML = `
    <button class="notif-row ${on ? "checked" : ""}" id="toggle-sound-pref" type="button">
      <span class="notif-checkbox">${on ? "✓" : ""}</span>
      <span class="notif-label">Timer cues during a workout</span>
    </button>
    <p class="checkin-settings-note">${on
      ? "Two notes ten seconds before a timer ends, three when it does. They play over your music instead of stopping it, so they can be hard to hear — your phone's ringer has to be on, and loud music will drown them. The clock also pulses for the last ten seconds either way."
      : "Timers run silently. The clock still pulses for the last ten seconds of every work period and rest."}</p>
  `;
  document.getElementById("toggle-sound-pref").addEventListener("click", () => {
    const next = !timerSoundsEnabled();
    setTimerSoundsEnabled(next);
    renderSoundSettings();
    if (next) cueSegmentEnd();
  });
}

function openSoundSettings() {
  ensureAudio();
  renderSoundSettings();
  document.getElementById("sound-settings-overlay").classList.add("visible");
}

function closeSoundSettings() {
  document.getElementById("sound-settings-overlay").classList.remove("visible");
}

function renderCheckinSettings() {
  const on = checkinEnabled();
  document.getElementById("checkin-settings-body").innerHTML = `
    <button class="notif-row ${on ? "checked" : ""}" id="toggle-checkin-pref" type="button">
      <span class="notif-checkbox">${on ? "✓" : ""}</span>
      <span class="notif-label">Ask me once a day</span>
    </button>
    <p class="checkin-settings-note">${on
      ? "You'll get the check-in once a day, and a nudge after a workout if you haven't done it yet."
      : "The daily prompt is off. Your past check-ins are still in your notebook, and you can log one any time from Today in there."}</p>
  `;
  document.getElementById("toggle-checkin-pref").addEventListener("click", () => {
    setCheckinEnabled(!checkinEnabled());
    renderCheckinSettings();
  });
}

function openCheckinSettings() {
  renderCheckinSettings();
  document.getElementById("checkin-settings-overlay").classList.add("visible");
}

function closeCheckinSettings() {
  document.getElementById("checkin-settings-overlay").classList.remove("visible");
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
// Questions and the contact address are Chris's to edit (Admin -> Settings ->
// Support & Contact) rather than markup, so a wrong support address or a
// missing answer isn't a deploy.
function renderSupportScreen() {
  const { email, faqs } = APP_SETTINGS.support;
  document.getElementById("support-faq-list").innerHTML = faqs.map((f) => `
    <div class="support-faq-item">
      <p class="support-faq-q">${esc(f.q)}</p>
      <p class="support-faq-a">${esc(f.a)}</p>
    </div>
  `).join("") || `<p class="support-faq-a">No questions here yet — message your coach and they'll help.</p>`;
  const link = document.getElementById("support-email-link");
  link.href = `mailto:${email}`;
  link.style.display = email ? "" : "none";
}

function openSupportScreen() {
  renderSupportScreen();
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
// ---------------- Speaking the technique cue (2026-09-05) ----------------
// The demo videos are silent, so EXERCISE_LIBRARY.technique is already their
// text alternative and nothing here is required for that. This is for the
// member mid-set, whose eyes are on the movement rather than the phone.
//
// Uses the browser's own speech synthesis — no audio files, nothing to record,
// and it reads whatever the technique text says, so re-wording a cue in the
// library changes what's spoken with no other work.
//
// Deliberately on demand rather than automatic: a voice starting by itself
// every time the exercise changes would be worse than useless in a gym.
function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let speakingNow = false;

function stopSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  speakingNow = false;
  document.querySelectorAll(".player-technique-speak.speaking")
    .forEach((b) => b.classList.remove("speaking"));
}

function speakText(text, button) {
  if (!canSpeak() || !text) return;
  // Second tap stops it — the same button both starts and interrupts, because
  // mid-workout the thing you most want is to shut it up.
  if (speakingNow) { stopSpeaking(); return; }
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  // A shade under default: these are instructions being followed in real time.
  utterance.rate = 0.95;
  utterance.onend = stopSpeaking;
  utterance.onerror = stopSpeaking;
  speakingNow = true;
  if (button) button.classList.add("speaking");
  window.speechSynthesis.speak(utterance);
}

// The technique text, plus the FEEL CUE under it when there is one.
//
// Chris, 2026-10-19: "on exercises that are perhaps a little more complex, I
// like to add an additional indicator ... on a db row, I would say it should
// feel like you are trying to lift the weight to put it in your pocket. I
// know this won't apply for all of them, or even most of them, but I have
// gotten great feedback on it."
//
// A separate field rather than more words on the end of `technique`, because
// the two answer different questions — technique is what to DO, the cue is
// how you know it is working — and because most exercises will never have
// one. Bolting it onto the sentence would make every technique note longer
// to serve the handful that need it.
//
// Rendered inside the same element the read-aloud button reads from, so the
// cue is spoken along with the mechanics rather than being the one part a
// member listening instead of reading never hears.
function techniqueBodyHtml(ex) {
  const parts = [];
  if (ex.technique) parts.push(esc(ex.technique));
  // No invented lead-in. Chris's example is already a whole sentence in his
  // own voice — "it should feel like..." — and prefixing it with a label of
  // mine would put words in a coach's mouth.
  if (ex.feelCue) parts.push(`<span class="technique-feel">${esc(ex.feelCue)}</span>`);
  return parts.join("");
}

function setPlayerExerciseTechnique(exerciseName) {
  const row = document.getElementById("player-technique-row");
  const toggle = document.getElementById("player-technique-toggle");
  const body = document.getElementById("player-technique-body");
  const speak = document.getElementById("player-technique-speak");
  toggle.classList.remove("expanded");
  body.classList.remove("expanded");
  // A cue for the previous exercise must not carry on over this one.
  stopSpeaking();
  const ex = exerciseName ? EXERCISE_LIBRARY.find((x) => x.name === exerciseName) : null;
  // Either one is enough to show the row. A complex lift might carry only a
  // feel cue, and a simple one only the mechanics.
  if (ex && (ex.technique || ex.feelCue)) {
    row.style.display = "flex";
    body.innerHTML = techniqueBodyHtml(ex);
    speak.style.display = canSpeak() ? "flex" : "none";
  } else {
    row.style.display = "none";
    body.textContent = "";
  }
}

// Reps under the exercise name. Kept in one place because the name's bottom
// margin changes depending on whether reps are showing — set one without the
// other and the spacing goes wrong.
function setPlayerExerciseReps(reps) {
  const el = document.getElementById("player-exercise-reps");
  const nameEl = document.getElementById("player-exercise-name");
  if (!reps) {
    el.style.display = "none";
    nameEl.classList.remove("has-reps");
    return;
  }
  el.textContent = `${reps} reps`;
  el.style.display = "block";
  nameEl.classList.add("has-reps");
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

// 2026-10-03: the hold is an *instruction*, not a timer. It used to be a pill
// on the row that the member tapped to start a countdown, and Chris killed
// it: "pressing start on a timer for the hold is not ideal as we dont want
// them trying to find their phone and locating a small button to press to
// start a timer for the hold, that they may have already done for 10 seconds.
// Or they put the weight down to find the button, press it then waste time
// getting into position thus doing the hold for less time that programmed."
//
// His case is the one that matters: a superset of normal glute bridges where
// the last rep is held at the top. At the moment the old button wanted a tap
// the member is under load, hands occupied, phone on the floor. A timer there
// is not a feature, it is an interruption that makes the hold wrong.
//
// So the row says what to do and the member does it. Nothing to tap, nothing
// to start, and — the point — the reps and the hold are now ONE row rather
// than the same exercise listed twice. Completion is the tap that was always
// going to happen anyway: Done on a straight set, Finish set on a superset.
// One place that knows what a finished row looks like, because two call it:
// the tap itself, and the resume path that re-applies ticks after a render.
function markSetRowDone(setIndex) {
  const row = document.querySelector(`.set-row[data-set-index="${setIndex}"]`);
  if (!row) return;
  row.classList.add("done");
  row.setAttribute("aria-pressed", "true");
  row.disabled = true;
  const done = row.querySelector(".set-row-done");
  if (done) done.textContent = "✓ Done";
}

// The hold under the reps rather than beside them (2026-10-06, Chris: "can we
// make it so the hold button/test is subtext of the rep. I want to
// differenciate it a little bit at least"). On a set row the hold is not a
// second thing of the same kind as the reps — it is a note about how the last
// one of them ends — so it reads as a line under, not a pill alongside.
function holdSubText(seconds) {
  return `last rep: hold ${seconds}s`;
}

function holdTagHtml(seconds, hasReps) {
  if (!seconds) return "";
  // "last rep: hold 20s" where there are reps to hold at the end of; plain
  // "hold 20s" where the hold is the whole set and the row has said so.
  const text = hasReps ? `last rep: hold ${seconds}s` : `hold ${seconds}s`;
  return `<span class="hold-tag">${text}</span>`;
}

// A per-slot instruction appended to the exercise name, so the member reads
// one heading instead of a name plus a footnote (2026-10-09, Chris: "i could
// just go in and add '- Left Leg' at the end of the exercise name, so it is
// simple and easy for the member to understand, and hard to miss"). His case
// is an EMOM of Bulgarian Split Squats, left leg on the first minute and right
// leg on the second — the player already rotates the exercise list by minute,
// so listing the lift twice gives him the two minutes; all that was missing
// was the words.
//
// Only the suffix is stored, never the whole name. The slot keeps the library
// name it has always had, which is what every lookup here runs off — the demo
// video, the technique row, whether the slot asks for a weight — and what the
// history joins on (exerciseIdForName in sync.js slugifies a name the library
// doesn't know, so a free-text name would log "Left Leg" as its own exercise
// with its own PRs). Storing the suffix also means a library rename still
// flows through to every cue that uses it.
function exerciseDisplayName(e) {
  if (!e) return "";
  return e.cue ? `${e.name} — ${e.cue}` : e.name;
}

// On a superset of one movement — Chris's Left Leg / Right Leg pair — the
// heading above the list is already the exercise name, so repeating it on
// every row leaves three lines all saying "Bulgarian Split Squats". Where the
// whole list shares one name, the rows carry just their cue.
function rowLabelFor(e, sharedName) {
  if (sharedName && e.cue) return e.cue;
  return exerciseDisplayName(e);
}

// The player's big heading, and the one rule that governs it: **never more
// than two lines** (2026-10-09, Chris: "lets shrink the type enough to make
// sure it is only 2 lines. Lets make this a rule across the board").
//
// It arrived as a cue problem — "Bulgarian Split Squats — Right Leg" wrapped
// to three at 39px and pushed the clock off a phone screen — but it was never
// only about cues: "Single Arm Farmer Carry Cossack Squat" already ran to
// three lines on its own, and the library has plenty more like it. So the fit
// applies to every heading the player shows, cued or not.
//
// Shrink-to-fit rather than truncation or a smaller fixed size: the short
// names keep the full 39px they have always had, and only a name that needs
// the room gives any up.
const PLAYER_NAME_MAX_PX = 39;
// Below this it is no longer a heading you can read at arm's length mid-set,
// so a name long enough to hit the floor takes a third line rather than
// shrinking into illegibility.
//
// 20 is measured, not picked: on the narrowest phone worth supporting (320px,
// an SE) exactly two of the 636 library names need to go under 22px, and both
// fit at 21 — "Sumo DB Squat Static Hold w/ Alternating Calf Raise" is the
// worst of them. So every real exercise name clears two lines on every phone.
// A name that long with a cue after it would need 17px, which is past
// readable; that one takes its third line, and the answer there is a shorter
// cue.
const PLAYER_NAME_MIN_PX = 20;
// Must match the line-height in .player-exercise-name — computing two lines
// is the whole measurement.
const PLAYER_NAME_LINE_RATIO = 1.12;

let playerHeadingText = "";

function setPlayerExerciseHeading(text) {
  const el = document.getElementById("player-exercise-name");
  playerHeadingText = text || "";
  el.textContent = playerHeadingText;
  fitPlayerHeading();
}

function fitPlayerHeading() {
  const el = document.getElementById("player-exercise-name");
  if (!el) return;
  let size = PLAYER_NAME_MAX_PX;
  el.style.fontSize = size + "px";
  // offsetParent is null while the player screen is hidden, and every
  // measurement then reads 0 — the loop would exit immediately and leave a
  // long name at full size. Bail instead, and re-fit when the screen opens.
  if (!el.offsetParent) return;
  const twoLines = () => Math.ceil(size * PLAYER_NAME_LINE_RATIO * 2) + 1;
  while (size > PLAYER_NAME_MIN_PX && el.scrollHeight > twoLines()) {
    size -= 1;
    el.style.fontSize = size + "px";
  }
}

// Rotating the phone changes the width the heading has to fit into, so a size
// chosen in portrait is wrong in landscape.
window.addEventListener("resize", () => {
  if (playerHeadingText) fitPlayerHeading();
});

// A fit measured before the heading font has loaded is measured against the
// fallback's metrics, which are not the same width — on a cold load that is
// the first workout of the session, so it is worth re-running once the real
// font is in. Guarded: document.fonts is absent on older WebViews, and a
// rejected promise here must not take the player down with it.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    if (playerHeadingText) fitPlayerHeading();
  }).catch(() => {});
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
    rest: "Rest",
  }[type] || type;
}

function blockSummaryLine(block) {
  switch (block.type) {
    case "interval":
      return `${block.rounds} rounds · ${block.work}s work / ${block.rest}s rest`;
    case "superset":
      return `${block.rounds} sets · rest ${block.rest}s between sets`;
    case "straight":
      return `${block.sets} sets × ${block.reps} reps · rest ${block.rest}s`;
    case "ladder":
      return `${block.scheme.join("-")} reps · rest ${block.rest}s`;
    case "amrap":
      return `${formatClock(block.duration)} as many rounds as possible`;
    case "emom":
      return `${formatClock(block.duration)} · new exercise every ${block.interval}s`;
    // A rest block is its own thing: a programmed break between blocks, not
    // the seconds between a block's own rounds (2026-10-19, Chris).
    case "rest":
      return `${formatClock(block.duration)} — take a breather`;
    default:
      return "";
  }
}

function blockExerciseNames(block) {
  // The hold belongs on this line rather than as its own bullet — a separate
  // bullet is exactly the "two exercises" reading the modifier exists to
  // avoid (2026-08-21).
  const suffix = (hold) => (hold ? ` + ${holdLabel(hold)}` : "");
  // Drops are marked (2026-10-15). A drop row was always invisible here — it
  // read as a second identical exercise — and that got worse the moment a
  // stack could hold three of them: "Lat Pulldown (10 reps)" four times over
  // tells a member nothing about what they are being asked to do.
  const dropTag = (e) => (e.drop ? " — drop set" : "");
  if (block.exercise) return [exerciseDisplayName(block.exercise) + suffix(block.hold)];
  if (block.exercises) return block.exercises.map((e) => exerciseDisplayName(e) + (e.reps ? ` (${e.reps} reps)` : "") + suffix(e.hold) + dropTag(e));
  return [];
}

// What a block is called, and whether its label is worth printing at all
// (2026-10-08, Chris: "they seem to be redundant ... if that second on is
// redundant, just delete it").
//
// It almost never is. Admin derives a block's label rather than asking for one
// — derivedBlockLabel gives a multi-exercise block the name of its TYPE and a
// single-exercise block the name of its ONE EXERCISE — so the label line was
// printing something already on the card either way: the type tag under it, or
// the exercise bullet below it. On the Core Crusher card that read "Straight
// Sets" directly above "STRAIGHT SETS".
//
// So the type leads, and the label only appears when it says something neither
// the type nor the exercise list already does. That happens with a workout
// imported from the spreadsheet, which has a Block Label column — "Main
// Strength", "8-Minute Finisher" — and those are worth keeping.
function blockHeading(block) {
  const type = blockTypeLabel(block.type);
  const label = String(block.label || "").trim();
  const names = [
    block.exercise && block.exercise.name,
    block.exercise && exerciseDisplayName(block.exercise),
    ...(block.exercises || []).flatMap((e) => [e.name, exerciseDisplayName(e)]),
  ].filter(Boolean).map((n) => n.toLowerCase());
  const adds = label
    && label.toLowerCase() !== type.toLowerCase()
    && !names.includes(label.toLowerCase());
  return { type, label: adds ? label : null };
}

function renderBlockSummaryCard(block, index) {
  const exercises = blockExerciseNames(block)
    .map((name) => `<li>${esc(name)}</li>`)
    .join("");
  const { type, label } = blockHeading(block);
  return `
    <div class="block-card">
      <div class="block-card-top">
        <span class="block-num">${index + 1}</span>
        <div>
          <p class="block-name">${esc(type)}</p>
          ${label ? `<p class="block-type-tag">${esc(label)}</p>` : ""}
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
  renderTeamChallengeCard();
  if (tabId === "tab-home" || tabId === "tab-circuits") { renderCircuitLists(); renderResumeBanner(); }
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
  // Every path that bins a session goes through here — finishing it, starting
  // over, discarding, a workout that no longer exists. Redrawing from this one
  // place is what keeps the banner from outliving the thing it describes.
  renderResumeBanner();
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
  return logCompletion(partial, rec.sessionWeights || {}, rec.setWeights || {});
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

// ---------------- Unfinished workout banner (2026-09-30, Chris) ----------------
// Leaving a workout already saved it, and the resume prompt already existed —
// but it only appeared on the way back INTO the app, so between those two
// moments there was nothing on screen saying a workout was waiting. The toast
// on the way out said it once and vanished.
//
// The countdown is the time left on the resume window, not a countdown to
// anything being logged. Nothing is logged without the member choosing it:
// past the window the same banner turns into the log-or-discard question that
// the overlay has always asked.

function resumeBannerEls() {
  return [document.getElementById("resume-banner-home"),
          document.getElementById("resume-banner-workouts")].filter(Boolean);
}

// "1h 42m" / "8m" — minutes only under an hour, because a seconds counter on a
// two-hour window would be a ticking clock on a screen nobody is watching.
function formatResumeLeft(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    return `${h}h ${mins - h * 60}m`;
  }
  return `${Math.max(1, mins)}m`;
}

function renderResumeBanner() {
  const els = resumeBannerEls();
  if (!els.length || typeof CIRCUITS === "undefined" || !CIRCUITS) return;
  const rec = loadInProgress();
  const circuit = rec && CIRCUITS.find((c) => c.id === rec.circuitId);
  if (!rec || !circuit) {
    els.forEach((el) => { el.style.display = "none"; el.innerHTML = ""; });
    return;
  }

  const phases = buildPhaseQueue(circuit);
  const blocksDone = blocksCompletedAt(phases, rec.index);
  const left = RESUME_WINDOW_MS - (Date.now() - (rec.lastSeenAt || 0));
  const onBlock = Math.min(blocksDone + 1, circuit.blocks.length);

  // Past the window with nothing finished there is no decision to put to the
  // member — the resume path drops these silently, and so does this.
  if (left <= 0 && blocksDone < 1) {
    els.forEach((el) => { el.style.display = "none"; el.innerHTML = ""; });
    return;
  }

  const html = left > 0
    ? `<div class="resume-banner-top">
         <p class="resume-banner-eyebrow">Workout in progress</p>
         <p class="resume-banner-countdown">Resume for ${formatResumeLeft(left)}</p>
       </div>
       <p class="resume-banner-title">${circuit.title}</p>
       <p class="resume-banner-sub">Block ${onBlock} of ${circuit.blocks.length}</p>
       <div class="resume-banner-actions">
         <button class="resume-banner-btn" data-resume-action="resume">Pick up where you left off</button>
       </div>`
    : `<div class="resume-banner-top">
         <p class="resume-banner-eyebrow">Unfinished workout</p>
       </div>
       <p class="resume-banner-title">${circuit.title}</p>
       <p class="resume-banner-sub">You finished ${blocksDone} of ${circuit.blocks.length} blocks, then left.</p>
       <div class="resume-banner-actions">
         <button class="resume-banner-btn" data-resume-action="log">Log as partial</button>
         <button class="resume-banner-btn is-secondary" data-resume-action="discard">Discard</button>
       </div>`;

  els.forEach((el) => { el.innerHTML = html; el.style.display = "flex"; });
}

function handleResumeBannerAction(action) {
  const rec = loadInProgress();
  const circuit = rec && CIRCUITS.find((c) => c.id === rec.circuitId);
  if (!rec || !circuit) { renderResumeBanner(); return; }

  if (action === "resume") { Player.resume(circuit, rec); return; }
  if (action === "log") {
    logPartialCompletion(circuit, rec, blocksCompletedAt(buildPhaseQueue(circuit), rec.index));
    clearInProgress();
    init();
    showTab("tab-home");
    showToast("Logged as a partial workout.");
    return;
  }
  clearInProgress();
  renderResumeBanner();
  showToast("Unfinished workout discarded.");
}

// A minute is the finest the countdown shows, so refreshing on the minute is
// enough — and it only matters while the app is open and on a tab that has one.
let resumeBannerTimer = null;
function startResumeBannerTicker() {
  if (resumeBannerTimer) return;
  resumeBannerTimer = setInterval(() => {
    if (!document.hidden) renderResumeBanner();
  }, 60000);
}

// An unfinished workout outranks the daily check-in nudge — it's the more
// urgent of the two, and stacking both modals would bury one behind the other.
function onEnterApp() {
  // Before the early returns below: a member who lands on the resume prompt
  // or the tour still has a Program tab behind it, and it should not be
  // missing its targets card when they dismiss them.
  loadNutrition();
  if (maybeOfferResume()) return;
  // The tour wins on a first entry and the check-in waits for it — otherwise
  // a brand new member's first sight of the app is two stacked overlays.
  // endTour() calls maybePromptCheckin() once it's done.
  if (maybeStartTour()) return;
  maybePromptCheckin();
}

// ---------------- First-run app tour ----------------
// A short walkthrough on a member's first entry, replayable from Help &
// Support. Three things worth knowing about it:
//
// 1. The deck is built from the member's own program shape, not hard-coded.
//    applyMemberProgramMode() hides Workouts for structured members and
//    Calendar for rolling ones, so a fixed five-slide deck would always show
//    one tab the member doesn't have. tourSlides() reads the same flag.
//
// 2. The spotlight only ever anchors to a bottom-nav button. Tours like this
//    usually rot because they point at in-page content that moves when
//    anything reflows or scrolls; the nav is five fixed buttons in a fixed
//    bar, so there is nothing to keep in sync.
//
// 3. Demo-level: "already seen it" is a localStorage flag, so it's per
//    browser. Once the system is set up properly that flag belongs on the
//    member's record server-side — as written, a reinstall or a second device
//    replays the tour for someone who has already taken it.
//
// All copy below is placeholder, for Chris to rewrite.
const TOUR_SEEN_KEY = "burnclub-tour-seen";

let tourDeck = [];
let tourIndex = 0;
let tourIsReplay = false;

function tourSeen() {
  // Any value counts, not just "1". The sync used to write a timestamp here,
  // which meant a strict check failed and the tour replayed forever; this also
  // repairs the phones already holding one (2026-10-02).
  return !!localStorage.getItem(memberKey(TOUR_SEEN_KEY));
}

function tourSlides() {
  const isStructured = CURRENT_MEMBER.scheduleType === "structured";
  // Wording lives in Admin -> Settings -> Member-Facing Copy. The structure —
  // which slides exist and what each one points at — stays here, because it
  // follows the nav rather than the copy.
  const t = APP_SETTINGS.copy.tour;
  const slide = (key, anchor, extra) => ({ anchor, title: t[key].title, body: t[key].body, ...extra });
  return [
    slide("home", "nav-home-btn"),
    isStructured ? slide("calendar", "nav-calendar-btn") : slide("workouts", "nav-workouts-btn"),
    slide("community", "nav-community-btn"),
    slide("progress", "nav-progress-btn"),
    // No anchor: the closing slide has nothing to point at, so the card
    // centers and the dim covers the whole frame.
    slide("contact", null, {
      actionLabel: t.contact.action,
      action: () => openThread(`dm-${CURRENT_MEMBER.id}`),
    }),
  ];
}

function maybeStartTour() {
  if (tourSeen()) return false;
  startTour(false);
  return true;
}

function startTour(isReplay) {
  tourDeck = tourSlides();
  tourIndex = 0;
  tourIsReplay = !!isReplay;
  document.getElementById("tour-overlay").classList.add("visible");
  window.addEventListener("resize", positionTourSpotlight);
  renderTourSlide();
}

function renderTourSlide() {
  const slide = tourDeck[tourIndex];
  if (!slide) return;

  // Switch the app behind the dim to the tab being described, so the member is
  // looking at the real screen rather than a description of it.
  const anchorEl = slide.anchor ? document.getElementById(slide.anchor) : null;
  if (anchorEl && anchorEl.dataset.tabTarget) showTab(anchorEl.dataset.tabTarget);

  document.getElementById("tour-title").textContent = slide.title;
  document.getElementById("tour-body").textContent = slide.body;
  document.getElementById("tour-card").classList.toggle("center", !slide.anchor);

  const actionBtn = document.getElementById("tour-action-btn");
  actionBtn.style.display = slide.actionLabel ? "block" : "none";
  if (slide.actionLabel) actionBtn.textContent = slide.actionLabel;

  const last = tourIndex === tourDeck.length - 1;
  document.getElementById("tour-next-btn").textContent = last ? "Done" : "Next";
  document.getElementById("tour-skip-btn").style.display = last ? "none" : "block";

  document.getElementById("tour-dots").innerHTML = tourDeck
    .map((_, i) => `<span class="tour-dot${i === tourIndex ? " active" : ""}"></span>`)
    .join("");

  positionTourSpotlight();
}

// Positions are measured against .app, which is the overlay's offset parent —
// the whole UI lives inside the phone frame, so viewport coordinates would be
// off by the frame's own offset.
function positionTourSpotlight() {
  const slide = tourDeck[tourIndex];
  const spot = document.getElementById("tour-spotlight");
  const anchorEl = slide && slide.anchor ? document.getElementById(slide.anchor) : null;
  if (!anchorEl) {
    // Collapsed to nothing in the middle: the box-shadow then dims everything.
    spot.style.width = "0px";
    spot.style.height = "0px";
    spot.style.left = "50%";
    spot.style.top = "50%";
    return;
  }
  const frame = document.getElementById("app").getBoundingClientRect();
  const rect = anchorEl.getBoundingClientRect();
  const pad = 6;
  spot.style.left = `${rect.left - frame.left - pad}px`;
  spot.style.top = `${rect.top - frame.top - pad}px`;
  spot.style.width = `${rect.width + pad * 2}px`;
  spot.style.height = `${rect.height + pad * 2}px`;
}

function advanceTour() {
  if (tourIndex < tourDeck.length - 1) {
    tourIndex += 1;
    renderTourSlide();
    return;
  }
  endTour();
}

// Skipping counts as seen — a member who skips is telling us they don't want
// it, and showing it again on next launch would be arguing with them.
function endTour(afterAction) {
  localStorage.setItem(memberKey(TOUR_SEEN_KEY), "1");
  document.getElementById("tour-overlay").classList.remove("visible");
  window.removeEventListener("resize", positionTourSpotlight);
  if (!afterAction) showTab("tab-home");
  // Only on a real first run: a replay from Help & Support shouldn't drag the
  // daily check-in up with it.
  if (!tourIsReplay && !afterAction) maybePromptCheckin();
  queueSync("preferences");
}

function bindTour() {
  document.getElementById("tour-next-btn").addEventListener("click", advanceTour);
  document.getElementById("tour-skip-btn").addEventListener("click", () => endTour());
  document.getElementById("tour-action-btn").addEventListener("click", () => {
    const slide = tourDeck[tourIndex];
    endTour(true);
    if (slide && slide.action) slide.action();
  });
  document.getElementById("support-tour-btn").addEventListener("click", () => {
    closeSupportScreen();
    startTour(true);
  });
}

// ---------------- Workout player engine ----------------

// A set that asks for more than one thing — reps then a hold, and drop sets
// next — runs as a superset (2026-08-23, Chris: "make the static holds and
// drop sets look and act exactly like a superset"). There is no separate
// screen or phase kind for it: a superset round already means "several
// actions, one unit of work, then rest", which is exactly what this is, and a
// second way of saying it was complexity for nothing.
//
// Since 2026-10-03 a hold is a line on the row rather than a second row, so
// reps-then-hold no longer reaches this at all — it stays a plain set.

// ---------------- Weight logging, once per block (2026-10-02, Chris) ----------------
// Weight used to be typed mid-set — inline on a superset row, in the rest
// popup on straight sets. Chris's call: get it off the working screen
// entirely. One screen at the end of each block, every set listed, every
// field already carrying a number.
//
// Pre-filling is the part that makes this honest rather than lossy. A member
// asked to remember four rounds of a descending scheme will round it off or
// skip it; a member shown "135, 135, 135, 135" and asked to correct the one
// that was 115 will get it right. The numbers come from last session, and
// from the earlier rounds of this one as they are filled in.
function weightEntriesForBlock(block, blockIndex) {
  const entries = [];
  // `name` stays the library name and the cue rides beside it, because the
  // name is what the setWeights key carries into sync.js as the exercise (see
  // exerciseDisplayName). The cue goes into the label instead, which sync
  // stores as set_label — "what the member saw" — so two cued slots of one
  // lift get distinct keys without inventing a second exercise.
  const add = (name, cue, label, reps) => {
    if (!exerciseTracksWeight(name)) return;
    entries.push({ name, cue, label: cue ? `${label} · ${cue}` : label, reps, blockIndex });
  };
  if (block.type === "straight" && block.exercise) {
    for (let i = 1; i <= block.sets; i++) add(block.exercise.name, block.exercise.cue, `Set ${i}`, block.reps);
  } else if (block.type === "ladder" && block.exercise) {
    block.scheme.forEach((reps, i) => add(block.exercise.name, block.exercise.cue, `Set ${i + 1}`, reps));
  } else if (block.type === "superset" && block.exercises) {
    for (let round = 1; round <= block.rounds; round++) {
      block.exercises.forEach((e) => {
        // A hold is held at whatever the lift was done at, and a drop is
        // lighter than the set before by definition — neither takes a number
        // of its own (Chris, 2026-08-23).
        if (e.hold || e.drop) return;
        // "Set", like the player now says (2026-10-16). This label is
        // persisted as set_label — "what the member saw" — so changing it
        // means a record written before today reads "Round 1" and one written
        // after reads "Set 1" for the same thing. Worth doing NOW, while the
        // only weight history on the database is Jordan's demo account, and
        // much worse to do once six testers have a month of it.
        add(e.name, e.cue, `Set ${round}`, Array.isArray(e.scheme) ? e.scheme[round - 1] : e.reps);
      });
    }
  }
  // AMRAP and EMOM deliberately keep their inline fields: the number of rounds
  // isn't known until the clock stops, so there is no set list to pre-fill.
  return entries;
}

function pushSetPhases(phases, blockMeta, block, sets) {
  // Reps-then-hold used to be rewritten as a superset here: two rows, the
  // lift and then the hold, because "several actions, one unit of work" is
  // what a superset screen says. Chris's 2026-10-03 call retires that. The
  // hold is one line of instruction on the lift's own row, so a set of ten
  // glute bridges with a hold on the last one is a set of ten glute bridges —
  // one row, one Done, rest as usual. `holdExercise` went with it: there is
  // no second row for a separate library entry to carry a video on.
  phases.push({
    ...blockMeta,
    kind: "sets",
    exerciseName: block.exercise.name,
    exerciseCue: block.exercise.cue,
    sets,
    restDuration: block.rest,
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
            exerciseCue: ex.cue,
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
              upNext: exerciseDisplayName(nextEx),
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
          round,
          rounds: block.rounds,
          // Reps can change round to round — Chris's real programming is
          // "Barbell Bench Press 10, 8, 8, 6" against "Tricep Bench Dips
          // 10, 10, 10, 10" (2026-10-02). An exercise with a `scheme` takes
          // its round's number; one with plain `reps` repeats it, which is
          // every superset written before this existed.
          exercises: block.exercises.map((e) => ({
            ...e,
            reps: Array.isArray(e.scheme) ? e.scheme[round - 1] : e.reps,
          })),
          // A superset counts SETS, not rounds (Chris, 2026-10-16: "round is
          // for circuits"). A round is a lap of several stations; going down
          // two exercises back to back and resting is one set of the pair.
          // The loop variable keeps its name because the data does — a block
          // stores `rounds` — but nothing a member reads says round.
          progressLabel: `Set ${round} of ${block.rounds}`,
          // What happens when they press the button, carried on the phase so
          // the button can say it. 0 on the last set, where no rest phase is
          // pushed below and the block simply ends.
          restAfter: round !== block.rounds ? block.rest : 0,
        });
        if (round !== block.rounds) {
          phases.push({
            ...blockMeta,
            kind: "rest",
            duration: block.rest,
            upNext: exerciseDisplayName(block.exercises[0]),
            progressLabel: `Set ${round} of ${block.rounds}`,
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

    // A programmed rest between blocks. The player already has a `rest` phase
    // with a clock and an "Up next" line, so this reuses it rather than
    // inventing a screen — the only new thing is that the rest is a block of
    // its own rather than a gap inside one.
    //
    // upNext is resolved at build time from the NEXT block, because by the
    // time this renders the member wants to know what they are resting FOR.
    // Falls back to "the end" on the last block, which a coach can legitimately
    // program — a cooldown rest to finish on.
    if (block.type === "rest") {
      const nextBlock = circuit.blocks[blockIndex + 1];
      phases.push({
        ...blockMeta,
        kind: "rest",
        duration: block.duration,
        upNext: nextBlock ? (nextBlock.label || blockTypeLabel(nextBlock.type)) : "the end of the workout",
        progressLabel: blockTypeLabel("rest"),
      });
    }

    // One logging screen per block, and only where there is something to log:
    // a bodyweight block never asks.
    const weightEntries = weightEntriesForBlock(block, blockIndex);
    if (weightEntries.length) {
      phases.push({
        ...blockMeta,
        kind: "log-weights",
        entries: weightEntries,
        progressLabel: "Log your weights",
      });
    }
  });

  return phases;
}

// ---------------- "Up next", at the bottom of the player ----------------
// Chris, 2026-10-16: built for the superset first, then "add it everywhere".
//
// Why it earns the space. On a descending scheme — his real programming is
// "Barbell Bench Press 10, 8, 8, 6" against "Tricep Bench Dips 10, 10, 10,
// 10" — the numbers change under you between sets, and nothing told you until
// you were already in the next one and had the wrong weight in your hands.
//
// Read off the next PHASE rather than recomputed from the block, so it cannot
// disagree with the screen it is predicting.

// Rests are skipped: "up next: rest" is not news. The button says the rest is
// starting, and the rest screen carries its own Up next line. log-weights is
// skipped for the same reason — it is bookkeeping, not the next thing you do.
function nextWorkingPhase(phases, index) {
  for (let i = index + 1; i < phases.length; i++) {
    const p = phases[i];
    if (p.kind !== "rest" && p.kind !== "log-weights") return p;
  }
  return null;
}

function previewLinesFor(phase) {
  const amount = (e) => (e.reps ? `${e.reps} reps` : e.hold ? holdLabel(e.hold) : "");
  const join = (name, a) => (a ? `${name} · ${a}` : name);
  const named = (e) => exerciseDisplayName(e);

  if (phase.kind === "superset") {
    const shared = new Set(phase.exercises.map((e) => e.name)).size === 1;
    return phase.exercises.map((e) => join(rowLabelFor(e, shared), amount(e)));
  }
  if (phase.kind === "sets") {
    // One phase holds every set, so the preview describes the SHAPE rather
    // than listing four identical lines. A ladder says its scheme, which is
    // the whole point of a ladder.
    const name = named({ name: phase.exerciseName, cue: phase.exerciseCue });
    const reps = phase.sets.map((x) => x.reps).filter(Boolean);
    const same = reps.length && reps.every((r) => r === reps[0]);
    const detail = !reps.length
      ? `${phase.sets.length} sets`
      : same
      ? `${phase.sets.length} × ${reps[0]} reps`
      : `${reps.join("-")} reps`;
    return [join(name, detail)];
  }
  if (phase.kind === "work") {
    return [join(named({ name: phase.exerciseName, cue: phase.exerciseCue }),
                 phase.duration ? `${phase.duration}s` : "")];
  }
  if (phase.kind === "emom" || phase.kind === "amrap") {
    return phase.exercises.map((e) => join(named(e), amount(e)));
  }
  if (phase.kind === "cardio-choice") {
    return [`${Math.round(phase.duration / 60)} minutes, your pick`];
  }
  return [];
}

// Shown on every working screen; hidden on rests, on the logging screen, and
// on the last piece of work in the session, where there is nothing to say.
function renderNextUp(phases, index) {
  const el = document.getElementById("player-next-set");
  if (!el) return;
  const current = phases[index];
  const next = current && current.kind !== "rest" && current.kind !== "log-weights"
    ? nextWorkingPhase(phases, index)
    : null;
  const lines = next ? previewLinesFor(next) : [];
  if (!next || !lines.length) {
    el.hidden = true;
    return;
  }
  // Crossing into a new block, the block is the news; inside one, the
  // position is ("Set 3 of 4"). progressLabel is per-phase and a sets phase
  // has none, hence the fallbacks.
  const crossesBlock = next.blockIndex !== current.blockIndex;
  const where = crossesBlock
    ? next.blockLabel || blockTypeLabel(next.blockType)
    : next.progressLabel || next.blockLabel || "";
  el.innerHTML = `
    <p class="next-set-label">Up next${where ? ` · ${esc(where)}` : ""}</p>
    ${lines.map((t) => `<p class="next-set-line">${esc(t)}</p>`).join("")}`;
  el.hidden = false;
}

// Per-exercise demo video, poppable over the AMRAP list without pausing the clock —
// the workout keeps running underneath, same as glancing at a demo mid-round would.
function openExerciseVideo(name) {
  document.getElementById("exercise-video-name").textContent = name;
  const ex = EXERCISE_LIBRARY.find((x) => x.name === name);
  document.getElementById("exercise-video-technique").innerHTML = ex ? techniqueBodyHtml(ex) : "";
  // Show the overlay first: a video inside a hidden element won't start
  // playing, and it would sit there on frame one until the member tapped it.
  document.getElementById("exercise-video-overlay").classList.add("visible");
  showDemoVideo("exercise-video-frame", "exercise-video-el", ex);
}

function closeExerciseVideo() {
  document.getElementById("exercise-video-overlay").classList.remove("visible");
  showDemoVideo("exercise-video-frame", "exercise-video-el", null);
}

// ---------------- The demo videos themselves (2026-09-30) ----------------
// Silent, looping, and started the moment the frame is shown: a member glancing
// at a demo mid-set wants to see the movement, not to press play with one hand
// full of dumbbell. Muted and playsinline are what let a phone autoplay at all.
//
// An exercise with no video keeps the placeholder frame it always had. So does
// one whose video fails to load, which is why the error handler undoes the
// class rather than leaving a black rectangle where the demo should be.
// How many times a demo plays before it stops and waits to be asked again
// (Chris, 2026-10-02). A clip cycling in a member's eyeline for a four-set
// block is a distraction long after they have seen the movement. Looping costs
// no extra data — the file is cached after the first play — so this is about
// attention and battery, not bandwidth.
const DEMO_PLAYS_BEFORE_STOP = 2;

// Every demo surface gets the same two behaviours: it stops itself after a
// couple of plays, and it has a visible control. Called once per frame; safe to
// call again, since it only wires what it hasn't already.
function attachDemoControls(frame, video) {
  if (!frame || !video || frame.dataset.demoWired === "1") return;
  frame.dataset.demoWired = "1";

  // loop is off: a looping video never fires "ended", which is the event the
  // play count needs.
  video.loop = false;
  video.addEventListener("ended", () => {
    const played = Number(video.dataset.played || 0) + 1;
    video.dataset.played = String(played);
    if (played < DEMO_PLAYS_BEFORE_STOP && frame.dataset.stopped !== "1") {
      video.currentTime = 0;
      tryPlayDemo(video);
    } else {
      setDemoStopped(frame, video, true);
      // Back to the first frame (2026-10-16). A demo that has played itself
      // out sits on its LAST frame, and these clips end dark — a black
      // rectangle where the exercise should be, which reads as broken rather
      // than as "tap to watch it again". Only on this path: a member who hit
      // pause did it to look at something, and yanking them back to the start
      // would be the opposite of what they asked for.
      video.currentTime = 0;
    }
  });

  let btn = frame.querySelector(".demo-pause-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "demo-pause-btn";
    btn.type = "button";
    frame.appendChild(btn);
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setDemoStopped(frame, video, frame.dataset.stopped !== "1");
  });
  setDemoStopped(frame, video, false);
}

function setDemoStopped(frame, video, stopped) {
  frame.dataset.stopped = stopped ? "1" : "0";
  const btn = frame.querySelector(".demo-pause-btn");
  if (btn) {
    btn.textContent = stopped ? "▶" : "❚❚";
    btn.setAttribute("aria-label", stopped ? "Play demo" : "Pause demo");
  }
  if (stopped) {
    video.pause();
  } else {
    // Asking for it again starts the count over — the member wants to watch it
    // a couple more times, not get one play and another stop.
    video.dataset.played = "0";
    if (video.ended || video.currentTime >= (video.duration || 0) - 0.05) video.currentTime = 0;
    tryPlayDemo(video);
  }
}

function showDemoVideo(frameId, videoId, ex) {
  const frame = document.getElementById(frameId);
  const video = document.getElementById(videoId);
  if (!frame || !video) return;

  const url = ex && ex.videoUrl ? ex.videoUrl : "";
  if (!url) {
    frame.classList.remove("has-video");
    video.pause();
    video.removeAttribute("src");
    video.load();                       // drops the buffered data
    return;
  }
  if (video.dataset.url !== url) {
    video.dataset.url = url;
    video.src = url;
    video.load();                       // after a reset, setting src alone can leave it idle
    video.onerror = () => {
      frame.classList.remove("has-video");
      delete video.dataset.url;
    };
  }
  frame.classList.add("has-video");
  attachDemoControls(frame, video);
  video.dataset.played = "0";
  frame.dataset.stopped = "0";
  const btn = frame.querySelector(".demo-pause-btn");
  if (btn) { btn.textContent = "❚❚"; btn.setAttribute("aria-label", "Pause demo"); }
  // Start it when the file is ready rather than immediately: on a cold load
  // there is nothing to play yet, and that first attempt is simply ignored.
  // oncanplay also covers the panel being shown a tick after this runs.
  video.oncanplay = () => { if (frame.dataset.stopped !== "1") tryPlayDemo(video); };
  tryPlayDemo(video);
}

function tryPlayDemo(video) {
  const played = video.play();
  if (played && played.catch) played.catch(() => {});   // autoplay refused: the frame still shows
}

// Phones pause video the moment the app goes to the background, and do not
// resume it on the way back. Mid-workout that is normal behaviour — a member
// answers a message, locks the screen, puts the phone down between sets — and
// without this they would return to a demo frozen on whatever frame it stopped
// at, looking broken.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  document.querySelectorAll(".player-video.has-video .player-video-el")
    .forEach((v) => { if (v.paused && v.getAttribute("src")) tryPlayDemo(v); });
});

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
    showDemoVideo("player-video", "player-video-el", null);
    return;
  }
  panel.dataset.exName = exerciseName;
  panel.classList.add("is-playable");
  label.textContent = `Demo Video — ${exerciseName}`;
  showDemoVideo("player-video", "player-video-el",
    EXERCISE_LIBRARY.find((x) => x.name === exerciseName));
}

// Whether the Straight Sets / Rep Ladder checklist shows a weight field for
// this exercise — set per-exercise via the "Track Weight Used" checkbox in
// the Exercise Library (admin), matched here by name since blocks reference
// exercises by name, not id (2026-08-07).
function exerciseTracksWeight(name) {
  const ex = EXERCISE_LIBRARY.find((e) => e.name === name);
  return ex ? !!ex.trackWeight : false;
}


// The strip of demos on a superset screen. Only the one in view plays: the
// others keep their src so a sideways flick starts them instantly, but a
// paused video downloads nothing more (2026-10-02).
// No numbering circles on the captions either (2026-10-06): they are the same
// circle the set card uses for a set number, sitting directly above a list
// that just lost its own for exactly that reason.
function renderDemoStrip(exercises) {
  const strip = document.getElementById("player-demo-strip");
  if (!strip) return;
  const sharedName = new Set(exercises.map((x) => x.name)).size === 1;
  strip.innerHTML = exercises.map((e, i) => {
    const ex = EXERCISE_LIBRARY.find((x) => x.name === e.name);
    const url = ex && ex.videoUrl;
    return `
      <div class="demo-card">
        <div class="demo-card-frame">
          ${url
            ? `<video muted playsinline preload="none" src="${url}"></video>`
            : `<span class="demo-card-empty">No demo yet</span>`}
        </div>
        <p class="demo-card-name">
          <span>${esc(rowLabelFor(e, sharedName))}</span>
        </p>
      </div>`;
  }).join("");
  strip.style.display = "flex";
  strip.scrollLeft = 0;
  // Same controls as every other demo: stops itself after a couple of plays,
  // and the button starts it again. Stopping one card stops the strip — a
  // member who doesn't want video won't want the next one starting when they
  // scroll either (2026-10-02, Chris).
  strip.querySelectorAll(".demo-card-frame").forEach((frame) => {
    const v = frame.querySelector("video");
    if (!v) return;
    attachDemoControls(frame, v);
    frame.querySelector(".demo-pause-btn").addEventListener("click", () => {
      strip.dataset.paused = frame.dataset.stopped === "1" ? "1" : "0";
    });
  });
  playVisibleDemo(strip);
  strip.onscroll = () => {
    clearTimeout(strip._settle);
    // After the flick settles, not during it: switching video on every scroll
    // event would thrash play/pause a dozen times across one swipe.
    strip._settle = setTimeout(() => playVisibleDemo(strip), 120);
  };
}

function playVisibleDemo(strip) {
  if (strip.dataset.paused === "1") {
    strip.querySelectorAll("video").forEach((v) => v.pause());
    return;
  }
  const mid = strip.scrollLeft + strip.clientWidth / 2;
  let best = null, bestDist = Infinity;
  strip.querySelectorAll(".demo-card").forEach((card) => {
    const centre = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(centre - mid);
    if (dist < bestDist) { bestDist = dist; best = card; }
  });
  strip.querySelectorAll("video").forEach((v) => {
    const isBest = best && best.contains(v);
    const frame = v.closest(".demo-card-frame");
    if (isBest) {
      if (frame && frame.dataset.stopped === "1") return;   // the member stopped it
      // preload="none" means there is nothing to play on the first attempt and
      // the call is simply ignored — the same cold-start that caught the demo
      // popup. Start on the video's own ready event as well.
      // ONE SHOT, and only while the demo is still running. Left standing it
      // becomes a perpetual motion machine now that a finished demo rewinds:
      // the rewind is a seek, a seek fires canplay, and canplay started the
      // clip again — it played forever while the pause button said otherwise
      // (found 2026-10-16 by reading the live elements, which said
      // stopped: "1" with paused: false and a play count past its limit).
      v.oncanplay = () => {
        v.oncanplay = null;
        if (frame && frame.dataset.stopped !== "1") tryPlayDemo(v);
      };
      if (v.paused) { v.dataset.played = "0"; tryPlayDemo(v); }
    } else if (!v.paused) {
      v.pause();
    }
  });
}


// ---------------- Workout overview (2026-10-02, Chris) ----------------
// Every block of the session in one list, opened from the block pill at the
// top of the player. Blocks behind you are faded and ticked, the one you are
// on is marked, the rest read as what is coming. It is the preview page with
// the sales copy taken out: a member mid-workout wants the shape of what is
// left, not the description they already read.
function openWorkoutOverview() {
  const circuit = Player.circuit;
  if (!circuit) return;
  const phase = Player.currentPhase();
  const currentBlock = phase ? phase.blockIndex : 0;

  document.getElementById("overview-title").textContent = circuit.title;
  document.getElementById("overview-list").innerHTML = circuit.blocks.map((block, i) => {
    const state = i < currentBlock ? "is-done" : i === currentBlock ? "is-current" : "";
    const names = blockExerciseNames(block).map((n) => `<li>${esc(n)}</li>`).join("");
    return `
      <div class="overview-block ${state}">
        <div class="overview-block-top">
          <span class="overview-block-num">${i < currentBlock ? "✓" : i + 1}</span>
          <div>
            <p class="overview-block-name">${esc(blockHeading(block).type)}</p>
            <p class="overview-block-line">${blockSummaryLine(block)}</p>
          </div>
        </div>
        <ul class="overview-block-names">${names}</ul>
      </div>`;
  }).join("");

  document.getElementById("overview-overlay").classList.add("visible");
}

function closeWorkoutOverview() {
  document.getElementById("overview-overlay").classList.remove("visible");
}


// ---------------- Timer sounds (2026-10-03, Chris) ----------------
// There was no audio in the player at all: a member running a timed circuit
// had to watch the screen to know when work ended. These are the two cues
// Chris asked for — ten seconds out, and time up.
//
// Synthesised rather than loaded from files: nothing to download, nothing to
// cache, and it works with no connection. iOS keeps an AudioContext suspended
// until a user gesture, so it is created and resumed on the tap that starts a
// workout; before that there is nothing to hear anyway.
//
// Second pass, same day. The first version was inaudible under Pandora (Chris:
// "i either couldnt hear the timer with the music, or it didnt play at all").
// Both of those readings are real, and both come from the same fact: a web
// page does not own the phone's audio session.
//   - Web Audio gets iOS's "ambient" category. It mixes with music, which is
//     what Chris asked for, but it is also silenced by the hardware mute
//     switch and it cannot duck what is already playing.
//   - An <audio> element would survive the mute switch and be far louder, but
//     iOS gives it the "playback" category, which pauses the music.
// Only a native build can have both (playback + mixWithOthers). So two
// changes here: make the tone as hard to mask as a web page can, and stop the
// cue being audio-only — the clock carries the ten-second warning visually as
// well, which is the part that still works on a muted phone.
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;                 // no Web Audio: the app runs silent
    try { audioCtx = new Ctx(); } catch (e) { return null; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

// Sounds can be switched off. Device-local, like the notification prefs and
// unlike the theme: whether a cue is any use depends on this phone, its mute
// switch and whether the member trains in headphones, so it is not something
// to carry across to another device.
const TIMER_SOUND_KEY = "burnclub-timer-sounds";

function timerSoundsEnabled() {
  return localStorage.getItem(memberKey(TIMER_SOUND_KEY)) !== "0";
}

function setTimerSoundsEnabled(on) {
  localStorage.setItem(memberKey(TIMER_SOUND_KEY), on ? "1" : "0");
}

// One short tone. Shaped with a quick attack and decay: a square-edged beep
// clicks, and a click in a quiet gym is worse than no sound.
//
// Two oscillators rather than one, and up in the 1-2kHz band. A pure sine is
// the easiest sound there is for music to mask — all of its energy sits at a
// single frequency, so anything playing at that frequency buries it. A
// triangle plus its octave spreads the energy across a band the ear is most
// sensitive to and music has least going on in, which is what makes a beep
// "cut through". Peak stays under 1.0 (volume x 1.4) so nothing clips.
function playTone(freq, ms, volume) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  gain.connect(ctx.destination);
  [["triangle", freq, 1], ["sine", freq * 2, 0.4]].forEach((layer) => {
    const osc = ctx.createOscillator();
    const mix = ctx.createGain();
    osc.type = layer[0];
    osc.frequency.value = layer[1];
    mix.gain.value = layer[2];
    osc.connect(mix).connect(gain);
    osc.start(now);
    osc.stop(now + ms / 1000 + 0.02);
  });
}

// Ten seconds left: two notes. Still the quieter of the two cues — it is a
// nudge to start finishing, not an instruction to stop — but no longer the
// gentle thing it was, because gentle lost to the radio.
function cueTenSeconds() {
  if (!timerSoundsEnabled()) return;
  playTone(1480, 140, 0.45);
  setTimeout(() => playTone(1480, 140, 0.45), 190);
}

// Time up: three rising notes, as loud as this can go without distorting.
function cueSegmentEnd() {
  if (!timerSoundsEnabled()) return;
  playTone(1175, 150, 0.6);
  setTimeout(() => playTone(1568, 150, 0.6), 160);
  setTimeout(() => playTone(2093, 320, 0.6), 320);
}

// The cue that survives a muted phone, headphones full of music, or a member
// who has turned the sounds off: the big clock colours and pulses for the last
// ten seconds. `left` is seconds remaining, or null when nothing is counting,
// so it clears itself between screens.
function paintClockUrgency(left) {
  const clock = document.getElementById("player-clock");
  if (!clock) return;
  clock.classList.toggle("urgent", left !== null && left <= 10);
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
    // Per set, keyed block|exercise|label — sessionWeights keeps the top
    // number for personal bests, this keeps what was actually lifted each set.
    this.setWeights = {};
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
      setWeights: this.setWeights,
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
    this.setWeights = rec.setWeights || {};
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
      // No clock on this phase (sets or superset), so there's nothing
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
      markSetRowDone(i);
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
    markSetRowDone(setIndex);
    const phase = this.currentPhase();
    const isLastSet = this.setsChecked.every(Boolean);
    this.persist();
    this.showSetPopup(setIndex, phase, isLastSet);
  },

  showSetPopup(setIndex, phase, isLastSet) {
    this.restSetIndex = setIndex;
    this.restIsLastSet = isLastSet;

    // No weight field here any more (2026-10-02): weight is logged once per
    // block, so asking between sets asked the same member for the same number
    // twice.

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


  // Hides the popup. Doesn't advance the phase itself — the last-set
  // "Continue" click handles that separately, so exiting mid-popup
  // (Player.stop()) can't accidentally skip ahead a phase.
  dismissRestOverlay() {
    if (this.restIntervalId) clearInterval(this.restIntervalId);
    this.restIntervalId = null;
    this.restDeadlineAt = null;
    document.getElementById("rest-timer-overlay").classList.remove("visible");
    this.restSetIndex = null;
    this.restIsLastSet = false;
  },

  finish() {
    // Nothing to finish without an open workout. this.circuit starts null and
    // is only ever set by opening one, so this is the "finish fired with no
    // session" case — reachable by firing the skip-confirm button before any
    // workout has been opened. Guarding logCompletion alone wouldn't be
    // enough: the completion screen below reads this.circuit's blocks and
    // title, so the crash would just move a few lines down (2026-09-16).
    if (!this.circuit) return;
    this.stopHeartbeat();
    clearInProgress();
    // Before logCompletion, deliberately: once this session is written its own
    // weights are part of the history and nothing can look like a PR.
    const prs = newPersonalBests(this.sessionWeights);
    const entry = logCompletion(this.circuit, this.sessionWeights, this.setWeights);
    renderPRBanner(prs);
    // A previous session's note must not be sitting in the box.
    resetSessionNoteField();
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
    stopSpeaking();
    // Leaving no longer destroys the session (2026-08-23, Chris). The X sits
    // in the top-left corner, exactly where a thumb rests holding a phone, and
    // it used to wipe the workout on a single tap with no confirmation. Rather
    // than guard that with a dialog, leaving now feeds the resume path that
    // already exists — so there's one behaviour for "I stopped partway",
    // however it happened, and nothing to be inconsistent with. Deliberately
    // binning a session is "Start over" on the resume prompt.
    //
    // Nothing to resume to on the very first phase, so that case still clears
    // rather than nagging them about a workout they didn't start.
    const worthKeeping = this.index > 0;
    // Persisted before stop(): stop() settles the clock and drops the
    // deadline, and an AMRAP's clock is supposed to keep running while you're
    // away — same as backgrounding.
    if (worthKeeping) this.persist(); else clearInProgress();
    this.stop();
    this.closeSkipConfirm();
    closeBlockNotes();
    showTab("tab-home");
    renderResumeBanner();
    if (worthKeeping) showToast("Saved — pick up where you left off.");
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
      this.cueTimerSounds();
      this.updateClock();
    }, 250);
  },

  // For EMOM, the big clock shows time left in the *current minute* (resetting to
  // a fresh :60 each time the exercise changes) rather than the whole block's total —
  // members were losing track of where they were with only one continuously-draining
  // number. The overall block time still counts down in the small clock alongside it.
  // The two audible cues, decided once per whole second (2026-10-03). An EMOM
  // is the awkward one: the phase clock runs the whole block, but what the
  // member is counting is the minute, so its cues come off the seconds left in
  // the current interval rather than the phase.
  cueTimerSounds() {
    const phase = this.currentPhase();
    const timed = !!phase && ["work", "rest", "amrap", "emom", "cardio-choice"].includes(phase.kind);
    if (!timed) {
      paintClockUrgency(null);
      return;
    }

    let left = this.remaining;
    if (phase.kind === "emom" && phase.interval) {
      const elapsed = phase.duration - this.remaining;
      left = phase.interval - (elapsed % phase.interval);
      // The last minute's end is the block's end; don't sound both.
      if (this.remaining <= phase.interval) left = this.remaining;
    }

    const longEnough = phase.kind === "emom" ? (phase.interval || 0) > 20 : (phase.duration || 0) > 20;
    // Painted whether or not a sound follows: on a muted phone this is the
    // only warning there is, and it stays correct while paused.
    paintClockUrgency(longEnough ? left : null);
    if (this.paused) return;

    // A ten-second warning on anything long enough for it to mean something.
    if (left === 10 && longEnough && this.lastCueAt !== "warn-" + left + "-" + this.remaining) {
      this.lastCueAt = "warn-" + left + "-" + this.remaining;
      cueTenSeconds();
      return;
    }
    // "Time up" lands on 1 rather than 0: the clock advances the phase the
    // moment it reaches zero, so a cue there would fire as the screen changed.
    if (left === 1) cueSegmentEnd();
  },

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
      setPlayerExerciseHeading(exerciseDisplayName(ex));
      setPlayerVideo(ex.name);
      document.getElementById("player-sub-pill").textContent =
        `Minute ${Math.min(minute + 1, totalMinutes)} of ${totalMinutes}`;
      setPlayerExerciseReps(ex.reps);
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

    // The workout's name, not the block's (2026-10-02, Chris). The block is
    // already named right below this on most screens, and since tapping here
    // opens the whole session, naming the session is what makes the button
    // read as what it does.
    document.getElementById("player-block-label").textContent =
      (this.circuit && this.circuit.title) || phase.blockLabel;
    // Closed on every phase change: an overview left open over a rest timer
    // hides the clock the member is waiting on.
    closeWorkoutOverview();
    // "Block 1 of 1" is noise in a prime corner — a count is only worth the
    // space when there is something to count (2026-10-16).
    const progressText = document.getElementById("player-progress-text");
    progressText.textContent = `Block ${phase.blockIndex + 1} of ${phase.totalBlocks}`;
    progressText.style.visibility = phase.totalBlocks > 1 ? "visible" : "hidden";
    const pct = Math.round(((this.index) / this.phases.length) * 100);
    document.getElementById("player-progress-fill").style.width = `${pct}%`;

    // Reset all conditional sections
    document.getElementById("player-center").style.display = "none";
    document.getElementById("player-amrap-list").style.display = "none";
    document.getElementById("player-round-counter").style.display = "none";
    document.getElementById("player-controls").style.display = "none";
    document.getElementById("player-complete-set-btn").style.display = "none";
    const nextSetEl = document.getElementById("player-next-set");
    if (nextSetEl) nextSetEl.hidden = true;
    document.getElementById("player-start-btn").style.display = "none";
    closeBlockNotes();
    document.getElementById("player-total-clock").style.display = "none";
    document.getElementById("player-sets-list").style.display = "none";
    document.getElementById("player-superset-list").style.display = "none";
    document.getElementById("player-weight-log").style.display = "none";
    document.getElementById("player-round-line").style.display = "none";
    const stripEl = document.getElementById("player-demo-strip");
    if (stripEl) {
      // Stop anything playing before the screen changes, or a demo keeps
      // streaming behind a rest timer nobody can see it from.
      stripEl.querySelectorAll("video").forEach((v) => v.pause());
      stripEl.style.display = "none";
      stripEl.innerHTML = "";
    }
    document.getElementById("player-emom-weight").style.display = "none";
    document.getElementById("player-cardio-picker").style.display = "none";
    setPlayerExerciseReps(null);
    document.getElementById("player-back-btn").style.display = "none";
    this.closeSkipConfirm();
    setPlayerVideo(null);
    // Hide these in the reset rather than relying on each kind to turn them
    // off (2026-10-02, Chris spotted a video frame and a TECHNIQUE row sitting
    // on the weight-logging screen). Display was only ever set by the kinds
    // that wanted them, so any kind that didn't mention them inherited
    // whatever the previous screen had left on.
    document.getElementById("player-video").style.display = "none";
    setPlayerExerciseTechnique(null);
    document.getElementById("player-pause-btn").textContent = "Pause";
    paintClockUrgency(null);

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
      setPlayerExerciseHeading(phase.kind === "work"
        ? exerciseDisplayName({ name: phase.exerciseName, cue: phase.exerciseCue })
        : "Rest");
      document.getElementById("player-sub-pill").textContent =
        phase.kind === "work" ? phase.progressLabel : `Up next: ${phase.upNext}`;
      document.getElementById("player-center").style.display = "flex";
      document.getElementById("player-clock-label").textContent = phase.kind === "work" ? "Work" : "Rest";
      document.getElementById("player-video").style.display = phase.kind === "work" ? "flex" : "none";
      setPlayerVideo(phase.kind === "work" ? phase.exerciseName : null);
      setPlayerExerciseTechnique(phase.kind === "work" ? phase.exerciseName : null);
      this.remaining = phase.duration;
      this.updateClock();
      // A REST never waits for Start (2026-10-19). isNewBlockStart() is true
      // for a standalone rest block, which would have put a Start button in
      // front of a break — asking someone to press a button to begin resting,
      // while the rest they are already taking goes uncounted. Stepping back
      // still pauses, because that is a deliberate rewind.
      const waitForStart = (this.isNewBlockStart() && phase.kind !== "rest") || this.steppingBack;
      if (waitForStart) this.awaitStart(); else this.beginPhaseTimer();
    }

    // The "set" phase kind that lived here is gone (2026-08-18) — it was the
    // one-exercise-per-screen rep-based circuit, which nothing produces now
    // that rep work is programmed as a superset.

    // Superset: every exercise on one screen (2026-08-07) — no persistent
    // video panel, each exercise row gets its own popup play button instead
    // (same pattern as the AMRAP list). Mark Set Complete advances to the
    // rest phase between rounds, same as every other kind.
    if (phase.kind === "superset") {
      const names = new Set(phase.exercises.map((e) => e.name));
      // A reps-then-hold set is ONE movement and says so — that name is the
      // thing you read from three feet away, which is what the big slot is for.
      //
      // A real superset has no single name, so this slot used to take a
      // derived one: "2-Exercise Superset". That is a description of the
      // block's SHAPE, which cannot change while you are inside the block,
      // printed in the largest type on the screen — while the round, the one
      // thing that does change, sat small underneath it. On a descending
      // scheme (the demo block drops 10 reps to 8 in round 2) the round is
      // the only way to know which numbers apply to you. The hierarchy was
      // upside down, which is what Chris could feel on 2026-10-16 without it
      // having a name: "it has never felt right to me."
      //
      // So the round takes the big slot and the separate round line goes.
      // Nothing is lost — the pill above still names the block.
      const oneMovement = names.size === 1;
      setPlayerExerciseHeading(oneMovement ? [...names][0] : phase.progressLabel);
      document.getElementById("player-sub-pill").textContent = phase.blockLabel || "";
      const roundLine = document.getElementById("player-round-line");
      if (oneMovement) {
        // Still wanted here: the heading is the movement's name, so the round
        // needs somewhere of its own, right above the list it governs
        // (2026-10-02, Chris).
        roundLine.textContent = phase.progressLabel;
        roundLine.style.display = "block";
      }
      renderDemoStrip(phase.exercises);
      document.getElementById("player-video").style.display = "none";
      setPlayerExerciseTechnique(null);
      const supersetListEl = document.getElementById("player-superset-list");
      supersetListEl.style.display = "flex";
      // The set number goes on the OUTSIDE of the card, centred against the
      // whole of it (2026-10-16, Chris: "something that tells you these
      // exercises are meant to be done together ... anything that connects
      // the two"). One marker spanning both rows is what says they are one
      // unit — the rows cannot say it themselves, because a list of two
      // things looks the same whether or not they belong together.
      //
      // Carried as a data attribute and drawn by CSS, so the card needs no
      // extra element and the rows keep the markup they already have.
      supersetListEl.dataset.set = phase.round || "";
      // Weight goes inline here rather than in the rest popup the way Straight
      // Sets does (2026-08-18). The reason weight moved off those rows was that
      // Done started the rest clock, so typing a number competed with finishing
      // the set. A superset has one Mark Set Complete at the end of the whole
      // list, so filling these in as you pick each weight up isn't racing
      // anything. Only shown for exercises flagged Track Weight Used.
      supersetListEl.innerHTML = phase.exercises
        .map((e, i) => {
          // Neither a hold nor a drop takes a weight field: a hold is held at
          // whatever the lift was just done at, and a drop is always lighter
          // than the set before it (Chris, 2026-08-23). Both behave like
          // no weight field of its own (2026-08-23, Chris) -- same as a
          // bodyweight movement. Drop-set segments will work the same way.
          const tracks = !e.hold && !e.drop && exerciseTracksWeight(e.name);
          const last = tracks ? lastWeightFor(e.name) : null;
          // No per-exercise tick (2026-10-02, Chris): the client goes straight
          // from the press into the dips with no break, so a Done button
          // between them asks for a tap at the one moment they have no hand
          // free. One tap at the end of the round, and that starts the rest.
          //
          // And no numbering circle either (2026-10-06, Chris: "since the
          // numbers listed on the side are meant for sets, lets take those
          // out"). The set card next door uses that exact circle for the set
          // number, so here it was quietly claiming these two exercises were
          // sets one and two. The order is already carried by the order.
          return `
          <div class="amrap-row superset-row">
            <div class="amrap-row-line1">
              <div class="amrap-row-left">
                <span class="amrap-ex-name">${esc(rowLabelFor(e, oneMovement))}</span>
                ${e.drop ? `<span class="row-seg-tag">drop</span>` : ""}
              </div>
            </div>
            <div class="amrap-row-line2">
              ${e.reps ? `<span class="amrap-reps">${e.reps} reps</span>` : ""}
              ${holdTagHtml(e.hold, !!e.reps)}
            </div>
          </div>
        `;
        })
        .join("");
      supersetListEl.querySelectorAll(".amrap-play-btn").forEach((btn) => {
        btn.addEventListener("click", () => openExerciseVideo(btn.dataset.exName));
      });
      // Held on the player, not the DOM, so it survives the re-render between
      // rounds and carries into the completion record.
      // The button says what it DOES (2026-10-16, Chris: "it marks the set
      // complete, and triggers the rest period. so lets say that"). "Finish
      // set ✓" named the first half and left the second — the rest clock
      // starting is the part that surprises people, because it starts whether
      // or not they were ready for it.
      //
      // The second line also carries the rest LENGTH, which is the one number
      // a member wants before they commit to pressing it, and on the last set
      // it says there is no rest coming at all rather than lying by omission.
      const roundBtn = document.getElementById("player-complete-set-btn");
      roundBtn.innerHTML = phase.restAfter
        ? `<span class="cta-main">Mark Set Complete</span>
           <span class="cta-sub">Starts your ${phase.restAfter}s rest</span>`
        : `<span class="cta-main">Mark Set Complete</span>
           <span class="cta-sub">Last set — finishes this block</span>`;
      // flex, not block: the inline style wins over the stylesheet, so the
      // two lines would not stack if this said block.
      roundBtn.style.display = "flex";

    }

    if (phase.kind === "log-weights") {
      setPlayerExerciseHeading("Log your weights");
      document.getElementById("player-sub-pill").textContent = phase.blockLabel || "This block";
      const logEl = document.getElementById("player-weight-log");
      logEl.style.display = "flex";

      // Group by exercise so the member reads down one movement's sets rather
      // than hopping between two in a superset.
      // Grouped by name *and* cue: an EMOM-style "Left Leg" / "Right Leg" pair
      // is one library exercise but two things to log, and merging them would
      // put eight rows under one heading with no way to tell which leg was
      // which.
      const byExercise = [];
      phase.entries.forEach((e) => {
        let g = byExercise.find((x) => x.name === e.name && x.cue === e.cue);
        if (!g) { g = { name: e.name, cue: e.cue, rows: [] }; byExercise.push(g); }
        g.rows.push(e);
      });

      // Laid out as the working screen is (2026-10-05, Chris): the exercise
      // name outside, one card under it, and inside the card the same
      // numbered rows with the same dotted leader. The input simply stands
      // where the tick stood, so the member reads the two screens the same
      // way round rather than relearning the block at the end of it.
      logEl.innerHTML = byExercise.map((g) => {
        const last = lastWeightFor(g.name);
        // "Round 1" on a superset, "Set 1" on straight sets — the column
        // header follows whichever the block actually produced.
        const unit = /^round/i.test(g.rows[0].label || "") ? "Rounds" : "Sets";
        return `
          <div class="weight-log-group">
            <p class="weight-log-ex">${esc(exerciseDisplayName(g))}</p>
            <div class="set-card">
              <p class="set-card-title">${unit}</p>
              ${g.rows.map((row, i) => {
                const key = `${row.blockIndex}|${g.name}|${row.label}`;
                const prefill = this.setWeights[key] != null ? this.setWeights[key]
                              : (i > 0 ? this.setWeights[`${row.blockIndex}|${g.name}|${g.rows[i - 1].label}`] : null)
                              ?? last ?? "";
                return `
                <label class="set-row weight-row">
                  <span class="set-row-num">${i + 1}</span>
                  <span class="set-row-main">
                    ${row.reps ? `<span class="set-row-reps">${row.reps} reps</span>` : ""}
                  </span>
                  <span class="set-row-leader"></span>
                  <input type="number" inputmode="numeric" class="weight-log-input"
                         data-key="${esc(key)}" data-ex-name="${esc(g.name)}"
                         value="${prefill}" placeholder="lb" />
                </label>`;
              }).join("")}
            </div>
          </div>`;
      }).join("");

      // Written as they type: a member who walks away mid-screen still has
      // what they entered, and the next row's pre-fill follows the last one.
      const inputs = [...logEl.querySelectorAll(".weight-log-input")];
      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          const val = Number(input.value);
          input.dataset.touched = "1";
          if (Number.isFinite(val) && val > 0) {
            this.setWeights[input.dataset.key] = val;
            this.noteWeight(input.dataset.exName, val);
            // Carry it down this exercise's later sets, stopping at the first
            // one the member has set themselves. Without this, a member with
            // no history types the same number four times — the pre-fill only
            // helped people who had lifted before, which is the wrong half.
            let seen = false;
            inputs.forEach((other) => {
              if (other === input) { seen = true; return; }
              if (!seen || other.dataset.exName !== input.dataset.exName) return;
              if (other.dataset.touched === "1") return;
              other.value = val;
              this.setWeights[other.dataset.key] = val;
            });
          } else {
            delete this.setWeights[input.dataset.key];
          }
        });
      });

      const logBtn = document.getElementById("player-complete-set-btn");
      logBtn.textContent = "Save and continue →";
      logBtn.style.display = "block";
    }

    if (phase.kind === "sets") {
      setPlayerExerciseHeading(exerciseDisplayName({ name: phase.exerciseName, cue: phase.exerciseCue }));
      // The count moved into the card, so the pill carries the block label —
      // which is what the superset screen already shows in this spot.
      document.getElementById("player-sub-pill").textContent = phase.blockLabel || "";
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
      // One card holding every set, rather than one card per set (2026-10-05,
      // from Chris's sketch: "It looks to seperate right now"). Four tiles for
      // four lines of the same prescription was four times the furniture for
      // no extra meaning. Same rows, same Done behaviour, same rest — the
      // card is the only thing that changed.
      //
      // The whole row is the button, not just the Done box. Mid-set, with a
      // barbell just racked, the box is a small thing to hit and the row is a
      // big one; the box stays as the thing that *says* where to tap. It is a
      // span rather than a nested <button>, which would not be valid inside
      // one — it looks and reads like the control it has always been.
      // The set numbers sit OUTSIDE the card, which starts just before the
      // reps (2026-10-16, from Chris's sketch). The rows therefore need a
      // wrapper to be the card, so the numbers can hang off its left edge
      // while the title still lines up above them.
      listEl.innerHTML = `
        <p class="set-card-title">Sets</p>
        <div class="set-rows">
        ${phase.sets.map((s, i) => `
          <button class="set-row" type="button" data-set-index="${i}" aria-pressed="false">
            <span class="set-row-num">${s.num}</span>
            <span class="set-row-main">
              <span class="set-row-reps">${s.reps ? `${s.reps} reps` : holdLabel(s.hold)}</span>
              ${s.reps && s.hold ? `<span class="set-row-sub">${holdSubText(s.hold)}</span>` : ""}
            </span>
            <span class="set-row-leader"></span>
            <span class="set-row-done">Done</span>
          </button>
        `).join("")}
        </div>`;
      listEl.querySelectorAll(".set-row").forEach((row) => {
        row.addEventListener("click", () => this.toggleSetChecked(Number(row.dataset.setIndex)));
      });
    }

    if (phase.kind === "amrap") {
      setPlayerExerciseHeading(phase.blockLabel);
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
          // Neither a hold nor a drop takes a weight field: a hold is held at
          // whatever the lift was just done at, and a drop is always lighter
          // than the set before it (Chris, 2026-08-23). Both behave like
          // no weight field of its own (2026-08-23, Chris) -- same as a
          // bodyweight movement. Drop-set segments will work the same way.
          const tracks = !e.hold && !e.drop && exerciseTracksWeight(e.name);
          const last = tracks ? lastWeightFor(e.name) : null;
          // Unnumbered, like the superset list (2026-10-06): that circle means
          // "set number" on the set card, and an AMRAP row is a station, not a
          // set. The indent it used to hold stays.
          return `
          <div class="amrap-row">
            <div class="amrap-row-line1">
              <div class="amrap-row-left">
                <span class="amrap-ex-name">${esc(exerciseDisplayName(e))}</span>
                ${e.drop ? `<span class="row-seg-tag">drop</span>` : ""}
              </div>
              <button class="amrap-play-btn" data-ex-name="${esc(e.name)}" title="Watch demo">▶</button>
            </div>
            <div class="amrap-row-line2">
              ${e.reps ? `<span class="amrap-reps">${e.reps} reps</span>` : ""}
              ${tracks ? `<input type="number" class="superset-weight-input" inputmode="numeric"
                    data-ex-name="${esc(e.name)}"
                    value="${this.sessionWeights[e.name] || ""}"
                    placeholder="${last ? last + " lb" : "add weight"}"
                    title="${last ? `Last time: ${last} lbs` : "Weight used"}" />` : ""}
              ${holdTagHtml(e.hold, !!e.reps)}
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
      // Visibility of player-round-counter is handled by awaitStart()/beginPhaseTimer()
      // below — it should only appear once the clock is actually running.
      document.getElementById("round-count").textContent = this.amrapRounds;
      this.remaining = phase.duration;
      this.updateClock();
      if (this.isNewBlockStart() || this.steppingBack) this.awaitStart(); else this.beginPhaseTimer();
    }

    if (phase.kind === "cardio-choice") {
      setPlayerExerciseHeading("Cardio — Your Choice");
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

    // One call for every phase kind rather than a copy in each branch — the
    // branches above already disagree about enough.
    renderNextUp(this.phases, this.index);

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
// The team a member is on for the active challenge, or null. Teams belong to
// the challenge rather than the member, so this is a lookup, not a field.
function myChallengeTeam() {
  if (!currentChallenge()) return null;
  return CHALLENGE_TEAMS.find((t) => (t.memberIds || []).includes(CURRENT_MEMBER.id)) || null;
}

function memberConversations() {
  const list = [{ id: `dm-${CURRENT_MEMBER.id}`, type: "dm", name: "Burn Club Staff" }];
  if (CURRENT_MEMBER.programId) {
    list.push({ id: `group-${CURRENT_MEMBER.programId}`, type: "group", name: `${CURRENT_MEMBER.program} Group Chat` });
  }
  // Only while the challenge is running. Four new chats a month would be
  // forty-eight dead ones a year sitting in the inbox, so a team chat appears
  // with its challenge and goes when it ends (2026-08-24).
  // Team chats are demo-only for now (2026-10-12): 16-messages.sql covers the
  // member↔staff DM and the program group, not per-team rooms. Offering one
  // while signed in would be a thread that silently accepts nothing.
  const team = myChallengeTeam();
  if (team && !messagingIsLive()) {
    list.push({ id: `group-team-${team.id}`, type: "group", name: `${team.name} Team Chat` });
  }
  // Custom groups a coach put them in (2026-10-15) — the peer room. Named for
  // the group rather than "Group Chat", because a member who is in two should
  // be able to tell them apart.
  MY_GROUPS.forEach((g) => {
    list.push({ id: `group-${g.id}`, type: "group", name: g.name });
  });
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
  dm: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>`,
  group: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="7" r="2.3"/><path d="M14 20c.3-2.7 2-4.6 4.3-5"/></svg>`,
};

function renderConversationRow(conv) {
  const preview = conversationPreview(conv);
  return `
    <div class="conversation-row conversation-row-${conv.type}" data-open-thread="${conv.id}">
      <div class="conversation-icon">${CONVERSATION_ICON_SVG[conv.type] || CONVERSATION_ICON_SVG.dm}</div>
      <div class="conversation-text">
        <p class="conversation-name">${esc(conv.name)}</p>
        <p class="conversation-preview">${esc(preview.lastText)}</p>
      </div>
      <div class="conversation-meta">
        ${conv.type === "dm" ? `<span class="conversation-trainer">Trainer</span>` : ""}
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
        ${isGroup && !fromMe ? `<p class="msg-sender">${esc(m.senderName)}</p>` : ""}
        <p>${esc(m.text)}</p>
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
  // Remembered across reloads, so what was read stays read (see
  // markThreadRead in sync.js).
  if (messagingIsLive() && typeof markThreadRead === "function") markThreadRead(conversationId);

  renderThreadMessages();
  updateUnreadBadges();
  showScreen("screen-thread");
  document.getElementById("bottom-nav").style.display = "none";
  loadMessagesFromServer();
  startThreadPoll();
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

// Which shape of thread an id is, and what the row needs to carry for RLS to
// place it. Derived from the id rather than stored anywhere, because the id IS
// the convention all three apps already share.
function conversationTarget(conversationId) {
  if (conversationId.startsWith("dm-")) {
    return { kind: "dm", memberId: AUTH_MEMBER ? AUTH_MEMBER.id : null, programId: null };
  }
  if (conversationId.startsWith("group-team-")) return null;   // no table yet
  if (conversationId.startsWith("group-custom-")) {
    return { kind: "custom", memberId: null, programId: null,
             groupId: conversationId.slice("group-".length) };
  }
  if (conversationId.startsWith("group-")) {
    return { kind: "group", memberId: null, programId: conversationId.slice("group-".length) };
  }
  return null;
}

// Signed in, messaging goes to the server. Signed out — a demo walkthrough —
// it keeps the old localStorage bridge, which is the only thing that makes the
// three apps talk to each other without one.
function messagingIsLive() {
  return typeof SB !== "undefined" && !!SB && !!AUTH_MEMBER;
}

// Custom groups this member is in, filled from the server. Empty for a demo
// session and for anyone in no groups, which is most people.
let MY_GROUPS = [];

// Settings a coach edited in admin, which until 2026-10-17 never left their
// browser. Applied over whatever is already loaded, then cached, so the NEXT
// start has them even with no signal — the member app has to work in a gym
// basement, and copy that arrives one session late beats copy that never
// arrives at all.
//
// Demo sessions are skipped on purpose: the demo is meant to show the app as
// built, not as one particular coach has configured it.
async function loadAppSettingsFromServer() {
  if (typeof fetchAppSettings !== "function" || isDemoSession()) return;
  const fetched = await fetchAppSettings();
  if (!fetched) return;
  APP_SETTINGS = mergeAppSettings(APP_SETTINGS_DEFAULTS, fetched);
  try {
    localStorage.setItem(LIVE_APP_SETTINGS_KEY, JSON.stringify(fetched));
  } catch (e) {
    // A full or blocked store costs the offline copy, not this session.
  }
  // Re-render what is on screen: wording may have changed under it. Progress
  // is the only tab that reads this copy at render time — the tour, the
  // check-in and Help & Support all read APP_SETTINGS when they open, so they
  // pick up new wording without being told.
  if (document.getElementById("tab-progress").classList.contains("visible")) renderProgressTab();
}

async function loadMessagesFromServer() {
  if (!messagingIsLive() || typeof fetchMessages !== "function") return;
  if (typeof fetchMyGroups === "function") MY_GROUPS = await fetchMyGroups();
  const res = await fetchMessages();
  if (!res.ok) return;
  // Replace rather than merge: the server is the whole truth for a shared
  // thread, and merging would resurrect a seeded demo message beside it.
  MESSAGES.length = 0;
  res.messages.forEach((m) => MESSAGES.push(m));
  updateUnreadBadges();
  if (openThreadId) renderThreadMessages();
  renderConversationList();
}

async function sendThreadMessage(text) {
  const body = text.trim();
  if (!openThreadId || !body) return;

  if (!messagingIsLive()) {
    broadcastMessage({
      id: "msg-" + Date.now(),
      conversationId: openThreadId,
      senderId: CURRENT_MEMBER.id,
      senderName: CURRENT_MEMBER.name,
      isStaff: false,
      text: body,
      time: "Just now",
      read: true,
    });
    renderThreadMessages();
    return;
  }

  const target = conversationTarget(openThreadId);
  if (!target) return;

  // Shown immediately and replaced by the server's row when it lands. A
  // message that sits invisible until a round trip finishes reads as a failure
  // on gym wifi, which is where most of these get written.
  const pendingId = "pending-" + Date.now();
  MESSAGES.push({
    id: pendingId, conversationId: openThreadId, senderId: CURRENT_MEMBER.id,
    senderName: CURRENT_MEMBER.name, isStaff: false, text: body,
    time: "Sending…", read: true, pending: true,
  });
  renderThreadMessages();

  const res = await pushMessage({
    conversationId: openThreadId, kind: target.kind,
    memberId: target.memberId, programId: target.programId,
    groupId: target.groupId, body,
  });

  const i = MESSAGES.findIndex((m) => m.id === pendingId);
  if (res.ok) {
    if (i !== -1) MESSAGES[i] = res.message;
  } else if (i !== -1) {
    // Kept on screen and marked, rather than deleted: the member wrote it, and
    // silently removing their words is the one thing worse than not sending.
    // Not "tap to retry": nothing is listening for that tap. A label that
    // promises an action the app does not have is worse than a plain failure.
    MESSAGES[i].time = "Not sent — check your connection";
    MESSAGES[i].failed = true;
  }
  renderThreadMessages();
}

// A shared thread changes because of someone else, so it has to be re-read
// rather than waited on. Polled rather than pushed: Supabase Realtime would be
// the right answer at scale, and for six testers a fetch on open plus one
// while the thread is in front of you is the same result with none of the
// connection handling.
let threadPollId = null;

function startThreadPoll() {
  stopThreadPoll();
  if (!messagingIsLive()) return;
  threadPollId = setInterval(() => {
    if (document.visibilityState === "visible") loadMessagesFromServer();
  }, 15000);
}

function stopThreadPoll() {
  if (threadPollId) clearInterval(threadPollId);
  threadPollId = null;
}

// Moving the Calendar's week. Bounded at both ends: never before the member's
// own week — the Calendar is for what is ahead, and what is behind is in
// Progress — and never past the last week of the programme.
// "This week" is a reset, not a shift. Written as a shift first, which the
// bounds check below would have refused outright — the button would have
// looked fine and done nothing, which is the same class of bug as the
// pencils.
function resetCalendarWeek() {
  calendarWeekStart = null;
  renderCalendarTab();
  document.getElementById("tab-calendar").scrollTop = 0;
}

// The furthest week the Calendar will show: one past the member's own, and
// never past the end of the programme (Chris, 2026-10-16: "I don't need them
// moving forward a bunch of weeks, just one"). A look ahead is for deciding
// whether to swap a session or book a gym slot; reading week 7 in week 2 is
// not planning, it is browsing, and it invites "why has this changed?" when
// the programme is still being written.
//
// ONE function, used by both the bounds check and the button's own hidden
// state. Two copies of the same arithmetic is how you end up with a Next
// button that shows and then refuses — the exact bug the comment above
// records, and the same class as the dead pencils.
function calendarMaxWeek(pos) {
  return Math.min(pos.week + 1, pos.totalWeeks);
}

function shiftCalendarWeek(deltaWeeks) {
  const pos = memberProgramPosition();
  if (!pos) return;
  const base = calendarWeekStart || pos.weekStartDate;
  const next = new Date(base);
  next.setDate(next.getDate() + deltaWeeks * 7);

  const offset = daysBetween(CURRENT_MEMBER.startDate, dateKey(next));
  const weekNumber = Math.floor(offset / 7) + 1;
  if (weekNumber < pos.week || weekNumber > calendarMaxWeek(pos)) return;

  // null rather than the member's own week start, so "which week am I on"
  // stays a question answered by the date and not by a stored copy of it that
  // goes stale at midnight.
  calendarWeekStart = weekNumber === pos.week ? null : next;
  renderCalendarTab();
  document.getElementById("tab-calendar").scrollTop = 0;
}

function openMessagesInbox() {
  openThreadId = null;
  stopThreadPoll();
  loadMessagesFromServer();
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

// Everything on TODAY, and nothing else (2026-10-16, Chris: "for the coming
// up section i want to just show what is on the calendar for today, thats
// it"). Home had been showing the next three items from today forward, which
// on a Tuesday meant Wednesday and Thursday's sessions sitting under today's
// — three cards to read before knowing what to do now. Looking ahead is what
// the Calendar is for, and it has a week preview of its own since today.
//
// A finished item is KEPT and marked rather than dropped: an empty section on
// a day the member has already trained reads as "nothing scheduled", which is
// the opposite of what happened. Their day should close, not disappear.
function todayScheduledItems() {
  const member = CURRENT_MEMBER;
  const template = SCHEDULE_TEMPLATES[member.programId] || [];
  if (!member.startDate) return [];
  const today = new Date();
  const todayKey = dateKey(today);
  const todayProgramDay = daysBetween(member.startDate, todayKey) + 1;

  const out = [];
  template.forEach((item) => {
    if (item.day !== todayProgramDay) return;
    if (item.type === "rest") { out.push({ kind: "rest" }); return; }
    if (item.type === "cardio") {
      out.push({ kind: "cardio", item, date: today, done: cardioLoggedOnDate(todayKey).done });
    } else if (item.type === "note") {
      out.push({ kind: "note", item, date: today });
    } else {
      // BOTH variants for a combo member, which is what the Calendar does and
      // what this failed to do when first written: it took only the first,
      // carrying over a rule from the old three-item list where showing two
      // would have crowded it. That reason left with the list.
      // workoutsForSlot already filters by what the member bought, so a
      // home-only member still sees one.
      const options = workoutsForSlot(item.workoutId);
      if (!options.length) return;
      const completion = completionForSlotOnDate(item.workoutId, todayKey);
      // The day is done once EITHER variant is, so the one they did keeps its
      // tick and the other stops being offered — no half-finished day for a
      // combo member. Same rule as the Calendar.
      options
        .filter((c) => !completion || completion.workoutId === c.id)
        .forEach((circuit) => {
          out.push({ kind: "workout", circuit, date: today,
                     done: !!completion,
                     variant: options.length > 1 ? circuit.variant : null });
        });
    }
  });
  return out;
}

function renderUpcomingWorkoutCard(entry) {
  const { kind, circuit, item, date, done, variant } = entry;
  // The day tag said "Today" under a heading that says Today (2026-10-16).
  // The corner carries what is actually useful instead: which variant this is
  // while there is a choice to make, and whether it is finished once there is
  // not.
  const tag = done
    ? `<span class="circuit-tag is-done">✓ Done</span>`
    : variant
    ? `<span class="circuit-tag">${esc(variantLabel(variant))}</span>`
    : "";

  // Cardio and reminders ride in the same list as the workouts (2026-10-10),
  // because "what is next" is the question Home answers and the coach put them
  // on the schedule to be seen. They keep the card shape and the day tag so
  // the list still scans as one column, and differ where they differ: cardio
  // taps through to the cardio log rather than a player, and a reminder is not
  // a button at all.
  if (kind === "cardio") {
    const label = item.text && item.text.trim() ? item.text.trim() : "Cardio";
    const isFuture = daysBetween(dateKey(new Date()), dateKey(date)) > 0;
    return `
      <button class="circuit-card circuit-card-upcoming color-blue ${done ? "is-done" : ""}"
              ${isFuture || done ? "disabled" : `data-coach-cardio="${esc(dateKey(date))}"`}>
        <div class="circuit-card-top">
          <h3>${esc(label)}</h3>
          ${tag}
        </div>
        <p>Cardio${done ? " · logged" : isFuture ? "" : " · tap to log it"}</p>
      </button>
    `;
  }

  if (kind === "note") {
    const label = item.text && item.text.trim() ? item.text.trim() : "Reminder";
    return `
      <div class="circuit-card circuit-card-upcoming circuit-card-reminder">
        <div class="circuit-card-top">
          <h3>${esc(label)}</h3>
        </div>
        <p>Reminder from your coach</p>
      </div>
    `;
  }

  return `
    <button class="circuit-card circuit-card-upcoming color-${circuit.color} ${done ? "is-done" : ""}" data-open-circuit="${circuit.id}">
      <span class="circuit-bg-icon">${CIRCUIT_ICONS[circuitIconKey(circuit)]}</span>
      <div class="circuit-card-top">
        <h3>${circuit.title}</h3>
        ${tag}
      </div>
      <p>${circuit.meta}</p>
    </button>
  `;
}

function renderHomeUpcomingWorkouts() {
  const items = todayScheduledItems();
  const card = document.getElementById("home-circuit-list").closest(".home-section-card");
  const pos = memberProgramPosition();
  // Once the programme is over this card has nothing to say, and "you're all
  // caught up" sitting under a completion card reads as a shrug. The
  // completion card is what answers "what now" (2026-08-23).
  if (card) card.style.display = pos && pos.finished ? "none" : "";
  if (pos && pos.finished) return;

  document.getElementById("home-workouts-title").textContent = "Today";

  // A rest day is a thing the coach said, not an absence — so it gets said
  // back, rather than falling through to the empty state as if the schedule
  // had a hole in it.
  const onlyRest = items.length && items.every((i) => i.kind === "rest");
  const real = items.filter((i) => i.kind !== "rest");

  document.getElementById("home-circuit-list").innerHTML =
    real.length ? real.map(renderUpcomingWorkoutCard).join("")
    : onlyRest ? `<p class="home-upcoming-empty">Rest day — nothing scheduled. Take it.</p>`
    : `<p class="home-upcoming-empty">Nothing scheduled today.</p>`;
}

function renderCircuitLists() {
  // Reset before either branch runs. renderHomeUpcomingWorkouts() hides this
  // card for a finished programme, and only the structured branch calls it —
  // so without this, the hidden state survived into a rolling member's Home
  // and their workout list vanished.
  const listCard = document.getElementById("home-circuit-list").closest(".home-section-card");
  if (listCard) listCard.style.display = "";

  // Structured members get their own schedule-driven section instead of the
  // rolling program's weekly list.
  if (CURRENT_MEMBER.scheduleType === "structured") {
    renderHomeUpcomingWorkouts();
    document.querySelectorAll("#home-circuit-list [data-open-circuit]").forEach((btn) => {
      btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
    });
    document.querySelectorAll("#home-circuit-list [data-coach-cardio]").forEach((btn) => {
      btn.addEventListener("click", () => openCardioLogModal(btn.dataset.coachCardio));
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
  const isEvergreen = (c) => STRETCH_CORE_CATEGORIES.includes(c.category);
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

// Picks up whatever the admin last drew. Falls back to the seeded teams if
// nothing has been bridged, so the demo isn't empty.
function loadChallengeTeams() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIVE_TEAMS_KEY) || "null");
    if (!Array.isArray(stored) || !stored.length) return;
    const challenge = currentChallenge();
    const forChallenge = challenge && stored.find((s) => s.challengeId === challenge.id);
    const entry = forChallenge || stored[0];
    if (entry && Array.isArray(entry.teams) && entry.teams.length) {
      CHALLENGE_TEAMS = entry.teams;
      if (entry.teamChallengeName) TEAM_CHALLENGE_NAME = entry.teamChallengeName;
    }
  } catch (e) {
    // Keep the seeded teams rather than blanking the section.
  }
}

function init() {
  loadChallengeTeams();
  loadProgramBenchmarks();
  COMPLETIONS = loadCompletions();
  CHECKINS = loadCheckins();
  BENCHMARK_RESULTS = loadBenchmarkResults();
  LAST_WEIGHTS = loadLastWeights();
  renderCircuitLists();
  renderHomeWeekSnapshot();
  renderResumeBanner();
  startResumeBannerTicker();

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

  SHOWCASED_PRS = loadShowcasedPRs();
  NOTEBOOK_NOTES = loadNotebookNotes();
  SESSION_NOTES = loadSessionNotes();
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
  // In init() rather than wired once: switchMemberProfile() re-runs init(),
  // and the badge belongs to the member, not the page.
  renderHealthProfileFlag();
  applyPasswordRowVisibility();
  applyAvatar();
}

// One-time wiring for static elements that exist from page load and are
// never re-created. Kept out of init() on purpose: switchMemberProfile()
// calls init() again, so binding here would stack a duplicate handler per
// profile switch — harmless for a popup open, but it made "Add to
// Calendar" save the same session twice (2026-08-12).
function wireStaticControls() {
  bindTour();
  // Delegated: the banner's buttons are re-rendered every minute, so handlers
  // bound to them directly would be thrown away with the markup.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-resume-action]");
    if (btn) handleResumeBannerAction(btn.dataset.resumeAction);
  });
  // Straight into the staff thread rather than the inbox — the whole point of
  // the card is to start that conversation, and the inbox is one more step
  // between the member and it.
  document.getElementById("program-complete-cta").addEventListener("click", () => {
    openThread(`dm-${CURRENT_MEMBER.id}`);
  });
  document.getElementById("edit-name-btn").addEventListener("click", openNameScreen);
  document.getElementById("text-prompt-close").addEventListener("click", () => closeTextPrompt(null));
  document.getElementById("text-prompt-save").addEventListener("click", submitTextPrompt);
  document.getElementById("text-prompt-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTextPrompt();
  });
  document.getElementById("avatar-btn").addEventListener("click", () => {
    document.getElementById("avatar-input").click();
  });
  document.getElementById("avatar-input").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) uploadAvatar(e.target.files[0]);
  });

  // Delegated: the day rows are rebuilt on every week change, so handlers
  // bound to the buttons themselves would be thrown away with the markup.
  //
  // BOTH containers since 2026-10-19 — today's row moved out of the list into
  // its own pinned block, and a listener on the list alone left the + on the
  // one day anybody actually adds to doing nothing at all.
  ["calendar-day-list", "calendar-today"].forEach((id) => {
    const host = document.getElementById(id);
    if (!host) return;
    host.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add-on]");
      if (btn) openCalendarAddPopup(btn.dataset.addOn);
    });
  });
  document.getElementById("calendar-week-next").addEventListener("click", () => shiftCalendarWeek(1));
  document.getElementById("calendar-week-back").addEventListener("click", resetCalendarWeek);
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
  document.getElementById("open-password-btn").addEventListener("click", openPasswordScreen);
  document.getElementById("password-close-btn").addEventListener("click", closePasswordScreen);
  document.getElementById("pw-save-btn").addEventListener("click", savePasswordForm);
  document.getElementById("open-health-profile-btn").addEventListener("click", openHealthProfileScreen);
  document.getElementById("health-profile-close-btn").addEventListener("click", closeHealthProfileScreen);
  document.getElementById("health-profile-save-btn").addEventListener("click", saveHealthProfileForm);
  document.getElementById("open-invite-btn").addEventListener("click", openInviteScreen);
  document.getElementById("invite-close-btn").addEventListener("click", closeInviteScreen);
  document.getElementById("invite-copy-btn").addEventListener("click", copyInviteLink);
  document.getElementById("open-appearance-btn").addEventListener("click", openAppearanceSettings);
  document.getElementById("appearance-close-btn").addEventListener("click", closeAppearanceSettings);
  document.getElementById("notebook-close-btn").addEventListener("click", closeNotebook);
  document.getElementById("notebook-scrim").addEventListener("click", closeNotebook);
  document.getElementById("notebook-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-notebook-tab]");
    if (!tab) return;
    notebookTab = tab.dataset.notebookTab;
    renderNotebook();
    document.getElementById("notebook-page").scrollTop = 0;
  });
  document.getElementById("pr-picker-close-btn").addEventListener("click", closePRPicker);
  document.getElementById("open-sound-settings-btn").addEventListener("click", openSoundSettings);
  document.getElementById("sound-settings-close-btn").addEventListener("click", closeSoundSettings);
  document.getElementById("open-checkin-settings-btn").addEventListener("click", openCheckinSettings);
  document.getElementById("checkin-settings-close-btn").addEventListener("click", closeCheckinSettings);
  document.getElementById("open-support-btn").addEventListener("click", openSupportScreen);
  document.getElementById("support-close-btn").addEventListener("click", closeSupportScreen);
}

// Prototype-level edit: prompt + in-memory update, no backend to save to yet
// (2026-08-12, Chris: "an edit button ... if they want to change their
// email"). Real path would be a proper edit form + account API call.
// Downscaled in the browser before upload (2026-10-16). A phone photo is
// 3-5MB and 4000px wide; the avatar is displayed at 96px. Sending the
// original would cost a member on gym wifi half a minute to upload a file the
// app immediately throws 95% of away — and would trip the bucket's 2MB cap.
// 512px square is generous for a circle that renders at 96.
const AVATAR_MAX_PX = 512;

function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Square, cropped from the centre: the frame it goes into is a circle,
      // so letterboxing a portrait photo would just add bars nobody asked for.
      const side = Math.min(img.width, img.height);
      const size = Math.min(side, AVATAR_MAX_PX);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Couldn't read that image.")),
                    "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file isn't an image we can read.")); };
    img.src = url;
  });
}

async function uploadAvatar(file) {
  const note = document.getElementById("avatar-note");
  const say = (msg) => { note.hidden = false; note.textContent = msg; };

  if (!AUTH_MEMBER || typeof SB === "undefined" || !SB) {
    say("Sign in to change your picture.");
    return;
  }
  say("Uploading…");
  let blob;
  try {
    blob = await downscaleImage(file);
  } catch (e) {
    say(e.message);
    return;
  }

  // One file per member, overwritten. Without upsert every change would leave
  // the old one behind, and a member who changed their picture ten times would
  // be paying for ten files nothing points at.
  const path = `${AUTH_MEMBER.id}/avatar.jpg`;
  const up = await SB.storage.from("avatars")
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (up.error) { say("Couldn't upload: " + up.error.message); return; }

  // The cache-buster is the point of storing a URL rather than deriving one:
  // the path never changes, so without it every browser and CDN would keep
  // serving the picture it already had.
  const base = SB.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const url = `${base}?v=${Date.now()}`;

  const { error } = await SB.from("members").update({ avatar_url: url }).eq("id", AUTH_MEMBER.id);
  if (error) { say("Uploaded, but couldn't save it: " + error.message); return; }

  AUTH_MEMBER.avatar_url = url;
  CURRENT_MEMBER.avatarUrl = url;
  applyAvatar();
  say("Picture updated");
  setTimeout(() => { note.hidden = true; }, 2000);
}

function applyAvatar() {
  const img = document.getElementById("profile-avatar");
  if (!img) return;
  img.src = CURRENT_MEMBER.avatarUrl || "assets/burn-club-logo.png";
  // No picture yet: the logo is a placeholder, not a portrait, so the hint
  // says what to do rather than sitting silently over it.
  const hint = document.getElementById("avatar-hint");
  if (hint) hint.textContent = CURRENT_MEMBER.avatarUrl ? "Change" : "Add photo";
}

// ---------------- Your own name and picture (2026-10-16) ----------------
// A member could change neither. The name came from whatever the account was
// created with — for a tester invited by email that is the bit before the @,
// so "jordan.tester" rather than Jordan.
//
// first_name and last_name are the two columns a member IS allowed to write:
// protect_member_columns blocks role, program_id, start_date, access, email,
// member_since, badge and data_epoch, and deliberately leaves these alone.
// A real dialog, not window.prompt (2026-10-16). prompt() THROWS here —
// "prompt() is not supported" — so the pencil looked clickable and did
// nothing at all. The email pencil beside it had the same fault and had
// therefore never worked in its life; it has been removed, since a member
// cannot change their own email anyway.
//
// The lesson is not about prompt: it is that a control whose only failure
// mode is silence will sit broken for weeks. This one reports.
// Resolves to the text, or to null when dismissed — the same contract
// window.prompt had, so call sites read the way they always did. The
// difference is that this one exists in every context.
let textPromptResolve = null;

function askText({ title, label, value = "", placeholder = "", multiline = false, allowEmpty = false }) {
  const overlay = document.getElementById("text-prompt-overlay");
  const input = document.getElementById(multiline ? "text-prompt-textarea" : "text-prompt-input");
  const other = document.getElementById(multiline ? "text-prompt-input" : "text-prompt-textarea");
  document.getElementById("text-prompt-title").textContent = title;
  document.getElementById("text-prompt-label").textContent = label || "";
  document.getElementById("text-prompt-error").hidden = true;
  other.hidden = true;
  input.hidden = false;
  input.value = value || "";
  input.placeholder = placeholder || "";
  overlay.dataset.allowEmpty = allowEmpty ? "1" : "";
  overlay.dataset.multiline = multiline ? "1" : "";
  overlay.classList.add("visible");
  input.focus();
  if (!multiline) input.select();

  // A previous dialog left unresolved would leak its caller; settle it as a
  // dismissal before taking over.
  if (textPromptResolve) textPromptResolve(null);
  return new Promise((resolve) => { textPromptResolve = resolve; });
}

function closeTextPrompt(value) {
  document.getElementById("text-prompt-overlay").classList.remove("visible");
  const done = textPromptResolve;
  textPromptResolve = null;
  if (done) done(value);
}

function submitTextPrompt() {
  const overlay = document.getElementById("text-prompt-overlay");
  const multiline = overlay.dataset.multiline === "1";
  const input = document.getElementById(multiline ? "text-prompt-textarea" : "text-prompt-input");
  const value = input.value;
  if (!value.trim() && !overlay.dataset.allowEmpty) {
    const err = document.getElementById("text-prompt-error");
    err.textContent = "Type something, or close this to cancel.";
    err.hidden = false;
    return;
  }
  closeTextPrompt(value);
}

async function openNameScreen() {
  const next = await askText({
    title: "Your name",
    label: "What should we call you?",
    value: CURRENT_MEMBER.name || "",
    placeholder: "e.g. Jordan Tester",
  });
  if (next === null) return;
  const res = await applyMemberName(next.trim());
  if (res && res.error) alert(res.error);
}

async function applyMemberName(trimmed) {

  // Split the way the rest of the app does: everything after the first space
  // is the surname, so a two-word surname survives.
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  const last = parts.slice(1).join(" ") || null;

  CURRENT_MEMBER.name = trimmed;
  document.getElementById("profile-name").textContent = trimmed;
  document.getElementById("home-greeting-name").textContent = first;

  if (!AUTH_MEMBER || typeof SB === "undefined" || !SB) return {};   // demo session
  const { error } = await SB.from("members")
    .update({ first_name: first, last_name: last }).eq("id", AUTH_MEMBER.id);
  // Returned rather than alerted: the dialog shows it in place, where the
  // person is already looking.
  if (error) return { error: "Couldn't save: " + error.message };
  AUTH_MEMBER.first_name = first;
  AUTH_MEMBER.last_name = last;
  return {};
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
  queueSync("scheduledItems");
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

function openCalendarAddPopup(presetDate) {
  schedSelectedActivity = SCHEDULE_ACTIVITY_TYPES[0];
  renderCalendarAddActivityPicker();
  const dateInput = document.getElementById("calendar-add-date");
  dateInput.value = presetDate || dateKey(new Date());
  dateInput.min = dateKey(new Date());
  // Opened from a specific day, the date is already answered — showing the
  // field would invite changing it and make the + on that row a lie. The
  // heading says which day instead, so nothing is hidden, only settled.
  const dateField = dateInput.closest(".field");
  if (dateField) dateField.hidden = !!presetDate;
  document.querySelector("#calendar-add-overlay .cardio-log-title").textContent =
    presetDate ? `Add to ${formatWeekdayDate(parseDateKey(presetDate))}` : "Add to Calendar";
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

// ---------------- Coach-scheduled cardio and reminders (2026-10-10) ----------------
// Admin has been able to put `cardio` and `note` items on a programme day
// since the calendar grid landed (2026-10-08), and the member app dropped
// every one of them: each read filtered `type === "workout"`, and the Calendar
// took `template.find(...)` — the FIRST item for a day — so a reminder sharing
// a day with a workout vanished, and a day holding only a cardio item rendered
// the words "Workout unavailable" at the member. Authored, invisible, and on
// its own day actively broken.
//
// A day can hold several items, so everything below works from a list.
function scheduleItemsForProgramDay(template, programDay) {
  return template.filter((it) => it.day === programDay);
}

// Done-ness for a coach's cardio item is "is there cardio logged on that day".
// There is no per-item record to tick: the item belongs to the programme
// template, which is the coach's, not the member's — unlike a session the
// member scheduled themselves, which lives in their own store and carries its
// own completedId.
//
// So nothing is matched and nothing is tagged. A member who goes out for a run
// and logs it the ordinary way, from the Cardio tab, clears that day's
// assigned cardio without ever touching the card — which is the generous
// reading, and Chris's call (2026-10-10: "i like it"). Note what it does NOT
// check: not the activity, not the duration. Six minutes of stairs clears
// "20 min easy run".
//
// Minutes are SUMMED across the day rather than read off one entry. Taking the
// first logged showed "6 min logged" on a day the member later ran for 25,
// which reads as a worse day than they had.
function cardioLoggedOnDate(dateStr) {
  const entries = COMPLETIONS.filter((c) => c.category === "cardio-activity" && c.date === dateStr);
  return {
    done: entries.length > 0,
    minutes: entries.reduce((sum, c) => sum + (Number(c.minutes) || 0), 0),
    count: entries.length,
  };
}

function calendarCoachCardioHtml(item, date) {
  const dateStr = dateKey(date);
  const logged = cardioLoggedOnDate(dateStr);
  // A future day cannot be logged yet — the same rule the member's own
  // planned sessions follow, so a tap doesn't create a future-dated
  // completion that would skew this week's numbers.
  const isFuture = daysBetween(dateKey(new Date()), dateStr) > 0;
  const label = item.text && item.text.trim() ? item.text.trim() : "Cardio";
  return `
    <button class="calendar-item-btn calendar-item-cardio ${logged.done ? "done" : ""}"
            ${isFuture ? "disabled" : `data-coach-cardio="${esc(dateStr)}"`}>
      <span class="calendar-item-label">${esc(label)}</span>
      <span class="calendar-item-meta">${logged.done
        ? `Cardio · ${logged.minutes} min logged${logged.count > 1 ? ` across ${logged.count} sessions` : ""}`
        : isFuture ? "Cardio · from your coach" : "Cardio · tap to log it"}</span>
      ${logged.done ? `<span class="calendar-item-check">✓</span>`
                    : `<span class="calendar-variant-tag">Cardio</span>`}
    </button>
  `;
}

// A reminder is the one item with nothing to open and nothing to log — it is
// a line of instruction for that day, so it is drawn as one rather than as a
// button that does nothing when tapped.
function calendarReminderHtml(item) {
  const label = item.text && item.text.trim() ? item.text.trim() : "Reminder";
  return `<span class="calendar-item-reminder">${esc(label)}</span>`;
}

// The heading, and the coach's note for whichever week is on screen.
//
// The week NUMBER is derived from the start date rather than taken from
// `pos.week`, because the preview button moves `weekStart` without moving the
// member — pos.week is always the week they are actually in.
function renderCalendarWeekHeader(pos, weekStart) {
  const m = CURRENT_MEMBER;
  const dayOffset = daysBetween(m.startDate, dateKey(weekStart));
  const weekNumber = Math.floor(dayOffset / 7) + 1;
  const isCurrent = weekNumber === pos.week;

  const title = document.getElementById("calendar-week-title");
  if (title) title.textContent = isCurrent ? `Week ${weekNumber}` : `Week ${weekNumber} — a look ahead`;

  // Back only exists when there is somewhere to go back to, and Next stops at
  // calendarMaxWeek() — one week ahead, or the end of the programme, whichever
  // comes first — rather than running off into empty days.
  const back = document.getElementById("calendar-week-back");
  const next = document.getElementById("calendar-week-next");
  if (back) back.hidden = isCurrent;
  if (next) {
    next.hidden = weekNumber >= calendarMaxWeek(pos);
    next.textContent = `Week ${weekNumber + 1} ›`;
  }

  const note = document.getElementById("calendar-week-note");
  const noteText = document.getElementById("calendar-week-note-text");
  if (!note || !noteText) return;
  const text = (typeof WEEK_NOTES !== "undefined" && WEEK_NOTES[`${m.programId}-week-${weekNumber}`]) || "";
  note.hidden = !text;
  // On the inner <p>, not the wrapper: the wrapper now holds the coach badge
  // too, and textContent on it would delete the badge the first time a note
  // was written.
  noteText.textContent = text;
}

// Which week the Calendar is showing. null means "the one the member is in",
// which is what it resets to every time the tab is opened — a preview is a
// look ahead, not a new place to be.
let calendarWeekStart = null;

function renderCalendarDayRow(date, member, template, isPast, lastDay) {
  const today = new Date();
  const isToday = dateKey(date) === dateKey(today);
  // A structured member with no start date is a data error, not a state to
  // render: it used to reach daysBetween() as undefined and throw inside
  // init(), so their Home never drew at all (2026-08-23). Degrade to showing
  // nothing instead. (This note used to point at upcomingScheduledItems,
  // which was removed 2026-10-16 when Home stopped looking ahead.)
  if (!member.startDate) {
    return `<div class="calendar-day-row${isToday ? " today" : ""}">
      <span class="calendar-day-label">${formatShortDate(dateKey(date))}</span>
      <span class="calendar-item-label calendar-item-muted">No program start date set</span>
    </div>`;
  }
  const programDay = daysBetween(member.startDate, dateKey(date)) + 1;
  const items = scheduleItemsForProgramDay(template, programDay);

  let bodyHtml;
  if (!items.length) {
    // Three different nothings, and they were two (2026-10-16). A day INSIDE
    // the programme with no entry at all used to read "Program complete" —
    // mid-week, often with a Rest Day the day after it. A member seeing that
    // would reasonably think their programme had ended.
    //
    // A gap says so plainly rather than borrowing the rest-day wording,
    // because an explicit rest is a coach's instruction and a gap is an
    // omission — and saying which lets Chris spot his own while building.
    const label = programDay < 1 ? "Not started yet"
                : programDay > lastDay ? "Program complete"
                : "Nothing scheduled";
    bodyHtml = `<span class="calendar-item-label calendar-item-muted">${label}</span>`;
  } else {
    // Every item on the day, in the order the coach left them — a workout and
    // a reminder on one day are two things to show, not a choice between them.
    // Rest only speaks for a day nothing else is on: admin strips the rest
    // item when anything is added, so a leftover alongside real content is a
    // contradiction, and "Rest Day" is the half that would be wrong.
    const real = items.filter((it) => it.type !== "rest");
    bodyHtml = (real.length ? real : items).map((item) => {
      if (item.type === "rest") {
        return `<span class="calendar-item-label calendar-item-muted">Rest Day</span>`;
      }
      if (item.type === "cardio") return calendarCoachCardioHtml(item, date);
      if (item.type === "note") return calendarReminderHtml(item);

      const options = workoutsForSlot(item.workoutId);
      if (!options.length) {
        return `<span class="calendar-item-label calendar-item-muted">Workout unavailable</span>`;
      }
      // The day is done once either variant is completed, so the tick lands
      // on the one they actually did and the other simply stops being
      // offered — no half-finished day for a combo member.
      const completion = completionForSlotOnDate(item.workoutId, dateKey(date));
      const showVariantLabels = options.length > 1;
      return options
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
    }).join("");
  }

  return `
    <div class="calendar-day-row ${isToday ? "today" : ""}${isPast ? " is-past" : ""}">
      <div class="calendar-day-date">
        <span>${formatWeekdayDate(date)}</span>
        ${isToday ? `<span class="calendar-today-tag">Today</span>` : ""}
        <!-- One + per day instead of one for the whole week (2026-10-16,
             Chris). The day you tapped IS the date, so the popup stops asking
             for one — which was the only question in it a member could get
             wrong. Not offered on a day already behind them: scheduling a
             session for last Tuesday is not a thing anyone means to do. -->
        ${isPast ? "" : `<button class="calendar-day-add" data-add-on="${esc(dateKey(date))}" aria-label="Add to ${esc(formatWeekdayDate(date))}" title="Add to this day">+</button>`}
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

  // Pinned to the PROGRAMME week, not the next seven days (2026-10-14, Chris).
  // It used to run today → today+6, which meant that from Tuesday onward it
  // straddled two programme weeks: the heading said one thing and half the
  // rows belonged to the next. Home's week strip has always followed the
  // programme week for exactly that reason, so the two screens disagreed about
  // what "this week" meant.
  //
  // Days already past stay in the list rather than being dropped — a member
  // who missed Tuesday can still open it on Thursday (Chris: "keep past days
  // tappable"). They are only receded, which says "behind you", not "locked".
  const pos = memberProgramPosition();
  if (!pos) return;
  const weekStart = calendarWeekStart || pos.weekStartDate;
  const todayKey = dateKey(new Date());

  // Today comes out of the list and goes above everything (2026-10-19). The
  // rest of the week keeps its order below, past days included and still
  // tappable — a member who missed Tuesday can open it on Thursday.
  //
  // A previewed week has no today in it, and neither does a programme that
  // has not started or has finished. In those cases the pinned block is
  // simply absent and the list is the whole week, which is what it always
  // was — no special-casing beyond `todayHtml` staying empty.
  const rows = [];
  let todayHtml = "";
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const key = dateKey(date);
    const html = renderCalendarDayRow(date, member, template, key < todayKey, pos.totalDays);
    if (key === todayKey) todayHtml = html;
    else rows.push(html);
  }

  renderCalendarWeekHeader(pos, weekStart);
  const todayEl = document.getElementById("calendar-today");
  todayEl.innerHTML = todayHtml;
  todayEl.hidden = !todayHtml;
  // The label only earns its line when there is a pinned day above to be the
  // rest OF. On a previewed week the list is simply the week.
  const restLabel = document.getElementById("calendar-rest-label");
  if (restLabel) restLabel.hidden = !todayHtml;
  document.getElementById("calendar-day-list").innerHTML = rows.join("");
  // Both containers, not just the list. Today's row moved out of
  // #calendar-day-list, so a selector scoped to that id alone would leave the
  // one day a member actually taps with no handlers on it — the whole point
  // of the change, silently dead.
  const calendarScopes = "#calendar-day-list, #calendar-today";
  document.querySelectorAll(`${calendarScopes} [data-open-circuit]`).forEach((btn) => {
    btn.addEventListener("click", () => openCircuit(btn.dataset.openCircuit));
  });
  document.querySelectorAll(`${calendarScopes} [data-remove-scheduled]`).forEach((btn) => {
    btn.addEventListener("click", () => removeScheduledItem(btn.dataset.removeScheduled));
  });
  document.querySelectorAll(`${calendarScopes} [data-complete-scheduled]`).forEach((btn) => {
    btn.addEventListener("click", () => openCompleteScheduledPopup(btn.dataset.completeScheduled));
  });
  document.querySelectorAll(`${calendarScopes} [data-coach-cardio]`).forEach((btn) => {
    btn.addEventListener("click", () => openCardioLogModal(btn.dataset.coachCardio));
  });
}

// ---------------- Entering the app ----------------
// One way in for a real member, so the profile is loaded and the tour and
// check-in prompts fire in the same order however they arrived — a fresh
// sign-in, an invite link, or a session restored from last time.
async function enterAsAuthedMember() {
  // A member can exist without a program: invites go out before anyone is
  // assigned, so this is an ordinary state, not an error. Saying so beats
  // rendering a program-shaped app built from whichever demo profile happened
  // to be first in data.js — which is what happened on the first three real
  // accounts, and looked correct purely because that profile is rolling.
  if (AUTH_MEMBER && !AUTH_MEMBER.program_id) {
    showUnassignedScreen("no-program");
    return;
  }
  applyAuthMemberToProfile();
  // Before init(), deliberately: every loadX() reads localStorage
  // synchronously, so the server's copy has to be in place first. A fresh
  // browser's empty localStorage is not an opinion about the member's history.
  if (typeof hydrateMemberData === "function") {
    const h = await hydrateMemberData();
    if (!h.ok && h.reason !== "not signed in") {
      console.warn("[sync] hydrate incomplete:", h.report);
    }
  }
  // A structured program is a day-by-day sequence projected from each member's
  // own start date. Without one there is no way to say which day they are on,
  // so the account is half set up rather than ready — and showing a calendar
  // built from a default would be wrong in a way nobody would notice.
  if (CURRENT_MEMBER.scheduleType === "structured" && !CURRENT_MEMBER.startDate) {
    showUnassignedScreen("no-start-date");
    return;
  }
  init();
  showTab("tab-home");
  // Not awaited: the inbox badge is worth having as soon as it arrives, and
  // nothing on Home should wait on a message fetch to render.
  loadMessagesFromServer();
  // Likewise. Settings a coach changed are worth picking up, but the app has
  // a perfectly good copy on disk and must not sit on a blank screen waiting
  // for the network to confirm the wording.
  loadAppSettingsFromServer();
  onEnterApp();
}

// Deliberately a dead end rather than a degraded app. There is nothing a
// member can usefully do here, and letting them wander a half-populated app
// invites "why is my program empty" questions that have nothing to do with
// the program.
function showUnassignedScreen(reason) {
  const name = AUTH_MEMBER.first_name || "there";
  const host = document.getElementById("screen-login");
  document.getElementById("login-form").hidden = true;
  document.getElementById("forgot-btn").hidden = true;
  document.getElementById("set-password-form").hidden = true;
  const demo = document.getElementById("login-demo");
  if (demo) demo.hidden = true;

  let box = document.getElementById("unassigned-note");
  if (!box) {
    box = document.createElement("div");
    box.id = "unassigned-note";
    box.className = "login-unassigned";
    host.querySelector(".login-wrap").appendChild(box);
  }
  const body = reason === "no-start-date"
    ? `Your program is set, but it doesn't have a start date yet — that's what
       decides which week you begin on. Your coach can set it; nothing else for
       you to do.`
    : `Your coach hasn't put you on a program yet. As soon as they do, your
       workouts show up here — nothing else for you to do.`;
  box.innerHTML = `
    <h2>You're signed in, ${esc(name)}</h2>
    <p>${body}</p>
    <button class="btn-ghost" id="unassigned-signout">Sign out</button>`;
  box.hidden = false;
  document.getElementById("unassigned-signout").addEventListener("click", async () => {
    await signOut();
    window.location.reload();
  });
  showScreen("screen-login");
}

// Maps the members row onto the profile shape the app already reads, rather
// than changing 5,000 lines to a new one. The app keeps working from
// CURRENT_MEMBER exactly as before; only where it comes from has changed.
function applyAuthMemberToProfile() {
  if (!AUTH_MEMBER) return;
  const program = AUTH_PROGRAM;
  CURRENT_MEMBER = {
    ...CURRENT_MEMBER,
    id: AUTH_MEMBER.id,
    name: [AUTH_MEMBER.first_name, AUTH_MEMBER.last_name].filter(Boolean).join(" ") || AUTH_MEMBER.email,
    email: AUTH_MEMBER.email,
    programId: AUTH_MEMBER.program_id || CURRENT_MEMBER.programId,
    scheduleType: program ? program.schedule_type : CURRENT_MEMBER.scheduleType,
    memberSince: AUTH_MEMBER.member_since || CURRENT_MEMBER.memberSince,
    badge: AUTH_MEMBER.badge || "",
    // null, not undefined: the spread above would otherwise leave a real
    // member wearing the demo profile's picture, which renders perfectly and
    // is somebody else's face.
    avatarUrl: AUTH_MEMBER.avatar_url || null,
    // Both of these were missing and both fall through the spread above to the
    // demo profile if they are not set explicitly. start_date is the worse of
    // the two: memberProgramDay() counts from it, so an unmapped one put a
    // real member on the demo member's week — which renders perfectly and is
    // wrong. null rather than undefined so the guard below can see it.
    startDate: AUTH_MEMBER.start_date || null,
    access: AUTH_MEMBER.access || "both",
    // Lives in member_private, which members cannot read by design, so there
    // is nothing to map it from — zero rather than the demo member's value,
    // which would otherwise credit a real member with someone else's manual
    // points adjustment.
    pointAdjustment: 0,
    // The program's display name, shown on Profile, the calendar label and the
    // group chat title. null would render the word "null" in three places.
    program: program ? program.name : CURRENT_MEMBER.program,
  };
}

// Decides what the member sees before anything renders: the set-password form
// if they came from an emailed link, the app if they already have a session,
// otherwise sign-in. Runs before init() so a signed-in member never sees the
// login screen flash past.
// The two demo entries run the app on data.js's seed and never touch Supabase,
// which is what makes them useful for a walkthrough and unacceptable once real
// members exist: a tester who taps one is looking at someone else's fake
// workouts and logging into nothing (2026-10-12, before the tester trial).
//
// Hidden rather than deleted, because they are still how this app gets driven
// for a demo or a quick check without burning a real account — and deleting
// them would mean rebuilding them the first time Chris wants to show someone.
// `?demo=1` brings them back; nothing else does, so a member who is simply
// handed the app never sees them.
function demoEntriesRequested() {
  try {
    return new URLSearchParams(location.search).get("demo") === "1";
  } catch (e) {
    return false;
  }
}

function applyDemoEntryVisibility() {
  const demo = document.getElementById("login-demo");
  if (!demo) return;
  // Still shown when there is no Supabase to sign in to at all — otherwise a
  // local copy with no config is a login form that cannot do anything.
  demo.hidden = supabaseReady() && !demoEntriesRequested();
}

async function routeOnLoad() {
  applyDemoEntryVisibility();
  if (!supabaseReady()) return false;          // demo mode; login screen stands
  if (arrivedFromEmailLink()) {
    document.getElementById("login-form").hidden = true;
    document.getElementById("forgot-btn").hidden = true;
    document.getElementById("login-demo").hidden = true;
    document.getElementById("set-password-form").hidden = false;
    return true;
  }
  let session = null;
  try {
    session = await currentSession();
  } catch (e) {
    session = null;                 // reading the session can itself need the network
  }

  if (!session) {
    // No session usually means "not signed in", and the login screen is right.
    // Offline it can also mean the token refresh couldn't reach the server — in
    // which case this member IS signed in, on a phone that holds their whole
    // program, and showing them a login form they cannot complete is the one
    // answer that helps nobody.
    const cached = navigator.onLine === false ? loadCachedAuthMember() : null;
    if (!cached) return false;
    AUTH_MEMBER = cached.member;
    AUTH_PROGRAM = cached.program || null;
    OFFLINE_ENTRY = true;
    await enterAsAuthedMember();
    return true;
  }

  const res = await loadAuthMember(session.user);
  if (res.error) {
    const err = document.getElementById("login-error");
    err.textContent = res.error;
    err.hidden = false;
    // Only an account problem signs anyone out. A dead connection is not one,
    // and signing out offline strands the member: they cannot sign back in
    // until they have signal.
    if (!isOfflineError(null)) await signOut();
    return false;
  }
  await enterAsAuthedMember();
  return true;
}

// The boot screen comes down once there is something real to show, whichever
// way routing went — signed in, signed out, or failed. A cover that can outlive
// the thing it covers is worse than no cover at all, so this runs in a finally.
function endBoot() {
  const el = document.getElementById("boot-screen");
  if (el) el.classList.add("is-done");
}

document.addEventListener("DOMContentLoaded", async () => {
  let routed = false;
  try {
    routed = await routeOnLoad();
    if (!routed) init();
  } catch (e) {
    // Never leave a member staring at a logo because something threw on the
    // way in. Fall back to the login screen, which at least they can act on.
    console.warn("[boot] routing failed:", e);
    init();
  } finally {
    endBoot();
  }
  wireStaticControls();

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("login-submit");
    const err = document.getElementById("login-error");
    err.hidden = true;
    // Disabled while the request is in flight: a member on gym wifi will
    // otherwise tap Log In three times and fire three sign-ins.
    btn.disabled = true;
    btn.textContent = "Signing in…";
    const res = await signIn(
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
    btn.disabled = false;
    btn.textContent = "Log In";
    if (res.error) {
      err.textContent = res.error;
      err.hidden = false;
      return;
    }
    await enterAsAuthedMember();
  });

  document.getElementById("forgot-btn").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const err = document.getElementById("login-error");
    if (!email) {
      err.textContent = "Type your email above first, then tap this.";
      err.hidden = false;
      return;
    }
    const res = await sendPasswordReset(email);
    err.textContent = res.error
      || "If that address is a Burn Club account, a reset link is on its way.";
    err.hidden = false;
  });

  document.getElementById("set-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("set-password-submit");
    const err = document.getElementById("set-password-error");
    const value = document.getElementById("new-password").value;
    err.hidden = true;
    if (value.length < 8) {
      err.textContent = "Use at least 8 characters.";
      err.hidden = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = "Saving…";
    const res = await setPassword(value);
    btn.disabled = false;
    btn.textContent = "Save and continue";
    if (res.error) {
      err.textContent = res.error;
      err.hidden = false;
      return;
    }
    await enterAsAuthedMember();
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
  document.querySelectorAll("[data-action='open-notebook']").forEach((btn) => {
    btn.addEventListener("click", () => openNotebook("today"));
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
  document.getElementById("player-start-btn").addEventListener("click", () => {
    // iOS keeps an AudioContext suspended until a user gesture. Starting a
    // workout is that gesture, and it is the last moment before any cue is
    // due — unlock it here or the first beep of the session never sounds.
    ensureAudio();
    Player.beginPhaseTimer();
  });
  document.getElementById("player-back-btn").addEventListener("click", () => Player.back());
  document.getElementById("exercise-video-close-btn").addEventListener("click", closeExerciseVideo);
  document.getElementById("player-block-label").addEventListener("click", openWorkoutOverview);
  document.getElementById("overview-close-btn").addEventListener("click", closeWorkoutOverview);
  // Tapping the dimmed area closes it too: it is a glance, not a screen to be
  // navigated out of.
  document.getElementById("overview-overlay").addEventListener("click", (e) => {
    if (e.target.id === "overview-overlay") closeWorkoutOverview();
  });
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
  ["mental", "physical", "sleepHours"].forEach((k) => {
    const slider = document.getElementById(`checkin-${k}`);
    if (!slider) return;
    slider.addEventListener("input", () => {
      // The readout span is rebuilt by openCheckinModal, so look it up each
      // time rather than caching a node that gets replaced.
      const out = document.getElementById(`checkin-${k}-value`);
      if (out) out.textContent = slider.value;
    });
  });
  // Delegated: the quality buttons are re-rendered whenever the modal opens.
  document.getElementById("checkin-quality-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quality]");
    if (!btn) return;
    // Tapping the selected one clears it — not answering stays possible.
    checkinQuality = checkinQuality === btn.dataset.quality ? null : btn.dataset.quality;
    renderCheckinQuality();
  });
  document.getElementById("cardio-log-btn").addEventListener("click", openCardioLogModal);
  document.getElementById("cardio-log-close-btn").addEventListener("click", closeCardioLogModal);
  document.getElementById("cardio-log-save-btn").addEventListener("click", saveCardioLogForm);
  document.getElementById("cardio-sync-btn").addEventListener("click", syncCardioFromWearable);
  // Delegated: the buttons are rebuilt from settings each time the modal
  // opens, so listeners bound to them directly would be lost.
  document.getElementById("cardio-activity-picker").addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-filter");
    if (!btn) return;
    cardioSelectedActivity = btn.dataset.activity;
    updateCardioActivityPicker();
  });
  document.getElementById("player-pause-btn").addEventListener("click", () => Player.togglePause());
  document.getElementById("player-technique-speak").addEventListener("click", (e) => {
    speakText(document.getElementById("player-technique-body").textContent, e.currentTarget);
  });
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
    saveSessionNoteFromForm();
    saveCompletions();
  });
  document.getElementById("benchmark-score-save-btn").addEventListener("click", saveBenchmarkScore);
  document.getElementById("player-complete-set-btn").addEventListener("click", () => Player.advance());
  document.getElementById("rest-overlay-skip-btn").addEventListener("click", () => {
    const wasLastSet = Player.restIsLastSet;
    Player.dismissRestOverlay();
    if (wasLastSet) Player.advance();
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

  document.getElementById("logout-btn").addEventListener("click", async () => {
    Player.stop();
    // Ends the Supabase session, not just the screen. Without this, Log Out
    // hides the app while the session stays in storage and the next visit
    // walks straight back in — which on a shared phone is the whole problem.
    await signOut();
    document.getElementById("main-app").classList.remove("visible");
    document.getElementById("bottom-nav").style.display = "none";
    document.getElementById("login-password").value = "";
    showScreen("screen-login");
  });
});
