// Burn Club admin prototype — in-memory state, no real backend.

// ---------------- Shared helpers (mirrors member app's block schema) ----------------

// Local calendar-day key (YYYY-MM-DD) — not toISOString(), which converts to
// UTC and can roll "today" over to tomorrow's date in the evening for any
// timezone behind UTC. Used to compare against challenge start/end dates.
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

function categoryLabel(category) {
  return {
    circuit: "Circuit",
    stretch: "Stretching",
    "core-burn": "Ab & Core Burn",
  }[category] || category;
}

function programById(id) {
  return PROGRAMS.find((p) => p.id === id);
}

function folderById(id) {
  return FOLDERS.find((f) => f.id === id);
}

function benchmarkById(id) {
  return BENCHMARKS.find((b) => b.id === id);
}

// A circuit only counts as live/published to a program once it's copied into
// one of that program's three permanent "live" folders — sitting in a
// program-tagged library folder (e.g. "Week of Jul 20") doesn't count on its own.
function circuitProgramId(circuit) {
  const folder = folderById(circuit.folderId);
  return folder && folder.live ? folder.program : null;
}

// Rough estimated duration for a block, in seconds — used for the auto-calculated
// circuit length shown to admins while building (not a precise simulation).
function estimateBlockSeconds(block) {
  switch (block.type) {
    case "interval":
      return block.timed === false
        ? block.rounds * block.exercises.length * (25 + block.rest)
        : block.rounds * block.exercises.length * (block.work + block.rest);
    case "superset":
      return block.rounds * (block.exercises.length * 30 + block.rest);
    case "straight":
      return block.sets * 30 + (block.sets - 1) * block.rest;
    case "ladder":
      return block.scheme.length * 20 + (block.scheme.length - 1) * block.rest;
    case "amrap":
    case "emom":
      return block.duration;
    default:
      return 0;
  }
}

function estimateCircuitMinutes(blocks) {
  const total = blocks.reduce((sum, b) => sum + estimateBlockSeconds(b), 0);
  return Math.max(5, Math.round(total / 60 / 5) * 5);
}

// ---------------- Nav / view switching ----------------

// Not every view has a sidebar link — Schedule never did, and a program's
// folders now live under Programs rather than their own nav item. Highlight
// `activeNavId` instead when given, and tolerate no match at all rather than
// throwing (2026-08-15; openScheduleView used to hand-roll its own view swap
// purely to dodge this).
function showView(viewId, activeNavId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("visible"));
  document.getElementById(viewId).classList.add("visible");
  document.querySelectorAll(".side-link").forEach((b) => b.classList.remove("active"));
  const nav = document.querySelector(`.side-link[data-view="${activeNavId || viewId}"]`);
  if (nav) nav.classList.add("active");
}

// ---------------- Dashboard ----------------

function renderDashboard() {
  document.getElementById("stat-total-members").textContent = ANALYTICS.totalMembers;
  document.getElementById("stat-active-pct").textContent = ANALYTICS.activeThisWeekPct + "%";
  document.getElementById("stat-completion-pct").textContent = ANALYTICS.avgCompletionPct + "%";
  document.getElementById("stat-avg-streak").textContent = ANALYTICS.avgStreak;

  const max = Math.max(...ANALYTICS.weeklyCompletions);
  document.getElementById("bar-chart").innerHTML = ANALYTICS.weeklyCompletions
    .map((v, i) => `
      <div class="bar-col">
        <div class="bar" style="height:${(v / max) * 100}%"></div>
        <span class="bar-label">W${i + 1}</span>
      </div>
    `)
    .join("");

  document.getElementById("top-circuits-list").innerHTML = ANALYTICS.topCircuits
    .map((c) => `<div class="top-circuit-row"><span>${c.title}</span><span>${c.completions} completions</span></div>`)
    .join("");

  document.getElementById("activity-feed-list").innerHTML = ACTIVITY_FEED
    .map(
      (a) => `
        <div class="activity-feed-row" data-action="edit-member" data-member-id="${a.memberId}">
          <div class="activity-feed-text"><strong>${a.memberName}</strong> completed ${a.workoutTitle}</div>
          <div class="activity-feed-meta">
            <span class="activity-feed-rpe">RPE ${a.rpe}/10</span>
            <span class="activity-feed-time">${a.time}</span>
          </div>
        </div>
      `
    )
    .join("");
}

// ---------------- Programs ----------------

let programStatusFilter = "active";

// Programs is the working surface — live programs, and where new content is
// made. Archived programs are excluded unconditionally, including from "All",
// because the Library is now the archive and showing them in both places is
// the clutter archiving exists to prevent (2026-08-15).
function renderPrograms() {
  const visible = PROGRAMS.filter((p) => (p.status || "active") !== "archived")
    .filter((p) => programStatusFilter === "all" || (p.status || "active") === programStatusFilter);

  document.querySelectorAll("#program-status-filter .filter-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.programStatus === programStatusFilter);
  });

  document.getElementById("program-grid").innerHTML = visible.map((p) => {
    const isStructured = p.scheduleType === "structured";
    // Structured programs don't use the live-folder model, so a circuit
    // "belongs" to them just by living in one of their folders — not by
    // being published to a live folder, which doesn't exist for these.
    const circuitCount = isStructured
      ? CIRCUITS.filter((c) => { const f = folderById(c.folderId); return f && f.program === p.id; }).length
      : CIRCUITS.filter((c) => circuitProgramId(c) === p.id).length;
    // Structured programs don't collect a "workouts per week" number up front
    // (there's no fixed cadence — it's whatever the day-by-day schedule ends
    // up holding), so compute it live from the actual schedule instead of a
    // static field that a newly-created structured program would never set.
    const perWeek = isStructured
      ? Math.round(((SCHEDULE_TEMPLATES[p.id] || []).filter((d) => d.type === "workout").length / (p.durationWeeks || 1)) * 10) / 10
      : p.circuitsPerWeek;
    return `
      <div class="program-card color-${p.color}">
        <div class="program-card-top">
          <h3>${p.name}</h3>
          <span class="status-pill ${p.status}">${p.status}</span>
        </div>
        <p class="desc">${p.description}</p>
        <div class="program-card-stats">
          <div><p>${p.memberCount}</p><p>Members</p></div>
          <div><p>${circuitCount}</p><p>Workouts</p></div>
          <div><p>${perWeek}</p><p>Per Week</p></div>
        </div>
        <div class="program-card-actions">
          <button class="btn-ghost-lg small" data-open-program="${p.id}">Open</button>
          <button class="btn-ghost-lg small" data-edit-program="${p.id}">Edit</button>
          ${isStructured ? `<button class="btn-ghost-lg small" data-manage-schedule="${p.id}">Schedule</button>` : ""}
          <button class="btn-ghost-lg small" data-archive-program="${p.id}" title="Moves this program and its folders to the Library">Archive</button>
        </div>
      </div>
    `;
  }).join("") || `<p style="color:var(--deepblue);font-weight:700;">No ${programStatusFilter} programs.</p>`;

  document.querySelectorAll("[data-open-program]").forEach((btn) => {
    btn.addEventListener("click", () => openProgramFolders(btn.dataset.openProgram));
  });
  document.querySelectorAll("[data-manage-schedule]").forEach((btn) => {
    btn.addEventListener("click", () => openScheduleView(btn.dataset.manageSchedule));
  });
  document.querySelectorAll("[data-edit-program]").forEach((btn) => {
    btn.addEventListener("click", () => openEditProgramModal(btn.dataset.editProgram));
  });
  document.querySelectorAll("[data-archive-program]").forEach((btn) => {
    btn.addEventListener("click", () => toggleProgramArchived(btn.dataset.archiveProgram));
  });
}

// Archiving is reversible and destroys nothing — the program keeps its
// folders, workouts and schedule. It moves between the two surfaces:
// archive from Programs, restore from the Library.
function toggleProgramArchived(programId) {
  const p = programById(programId);
  if (!p) return;
  p.status = p.status === "archived" ? "active" : "archived";
  renderPrograms();
  renderLibrary();
}

const PROGRAM_CARD_COLORS = ["blue", "deepblue", "yellow", "green"];

let editingProgramId = null;

// Opens the same modal pre-filled. Program *type* is deliberately locked when
// editing: switching rolling to structured would orphan the live folders, and
// the reverse would orphan the schedule (2026-08-15).
function openEditProgramModal(programId) {
  const p = programById(programId);
  if (!p) return;
  openProgramModal();
  editingProgramId = programId;

  document.getElementById("program-modal-heading").textContent = "Edit Program";
  document.getElementById("program-modal-save-btn").textContent = "Save Changes";
  document.getElementById("program-modal-name").value = p.name;
  document.getElementById("program-modal-desc").value = p.description || "";
  document.getElementById("program-modal-per-week").value = p.circuitsPerWeek || 3;
  document.getElementById("program-modal-duration").value = p.durationWeeks || 8;

  const typeInput = document.querySelector(`#program-modal-type input[value="${p.scheduleType}"]`);
  if (typeInput) typeInput.checked = true;
  document.querySelectorAll("#program-modal-type input").forEach((i) => { i.disabled = true; });
  updateProgramTypeFieldVisibility();
  // Set after updateProgramTypeFieldVisibility — that function owns this
  // element and would otherwise overwrite it with the create-flow copy.
  document.getElementById("program-modal-type-note").textContent =
    "Program type can't be changed after creation — it decides how content is published.";

  const statusInput = document.querySelector(`#program-modal-status input[value="${p.status}"]`);
  if (statusInput) statusInput.checked = true;
}

function openProgramModal() {
  editingProgramId = null;
  document.getElementById("program-modal-heading").textContent = "New Program";
  document.getElementById("program-modal-save-btn").textContent = "Create Program";
  document.getElementById("program-modal-type-note").textContent =
    "This will also set up its three live workout folders automatically.";
  document.getElementById("program-modal-name").value = "";
  document.getElementById("program-modal-desc").value = "";
  document.getElementById("program-modal-per-week").value = 3;
  document.getElementById("program-modal-duration").value = 8;
  document.getElementById("program-modal-type").innerHTML = [
    { value: "rolling", label: "On Demand" },
    { value: "structured", label: "Structured" },
  ].map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="program-modal-type-radio" value="${opt.value}" ${opt.value === "rolling" ? "checked" : ""} />
      ${opt.label}
    </label>
  `).join("");
  document.querySelectorAll('#program-modal-type input').forEach((input) => {
    input.disabled = false;
    input.addEventListener("change", updateProgramTypeFieldVisibility);
  });
  updateProgramTypeFieldVisibility();
  document.getElementById("program-modal-status").innerHTML = ["Draft", "Active"].map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="program-modal-status-radio" value="${opt.toLowerCase()}" ${opt === "Draft" ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
  document.getElementById("program-modal-overlay").classList.add("visible");
}

// On Demand ("rolling") programs use workouts-per-week + the 3-live-folder
// publish model; Structured programs use a day-by-day schedule instead, so
// "Workouts per week" doesn't apply to them — swap it for a Program Length
// field and update the footnote to match (2026-08-10, closing the gap Chris
// found: there was previously no way to create a Structured program at all).
function updateProgramTypeFieldVisibility() {
  const typeInput = document.querySelector("#program-modal-type input:checked");
  const isStructured = typeInput && typeInput.value === "structured";
  document.getElementById("program-modal-per-week-field").style.display = isStructured ? "none" : "";
  document.getElementById("program-modal-duration-field").style.display = isStructured ? "" : "none";
  document.getElementById("program-modal-type-note").textContent = isStructured
    ? "You'll land on its Schedule after creating it — every day starts as a Rest Day until you assign workouts."
    : "This will also set up its three live workout folders automatically.";
}

function closeProgramModal() {
  document.getElementById("program-modal-overlay").classList.remove("visible");
}

function saveProgram() {
  const name = document.getElementById("program-modal-name").value.trim();
  if (!name) {
    alert("Enter a name for the program.");
    return;
  }
  const description = document.getElementById("program-modal-desc").value.trim();
  const typeInput = document.querySelector("#program-modal-type input:checked");
  const scheduleType = typeInput ? typeInput.value : "rolling";
  const statusInput = document.querySelector("#program-modal-status input:checked");
  const status = statusInput ? statusInput.value : "draft";
  // Editing only touches the fields on this form — id, colour, folders and
  // schedule all stay exactly as they were.
  if (editingProgramId) {
    const p = programById(editingProgramId);
    if (p) {
      p.name = name;
      p.description = description;
      p.status = status;
      if (p.scheduleType === "structured") p.durationWeeks = Number(document.getElementById("program-modal-duration").value) || p.durationWeeks;
      else p.circuitsPerWeek = Number(document.getElementById("program-modal-per-week").value) || p.circuitsPerWeek;
    }
    // Program name appears in several dropdowns that are built once at load.
    document.querySelectorAll(
      `#folder-modal-program option[value="${editingProgramId}"], #member-modal-program option[value="${editingProgramId}"], #member-program-filter option[value="${editingProgramId}"], #challenge-modal-program option[value="${editingProgramId}"]`
    ).forEach((opt) => { opt.textContent = name; });
    closeProgramModal();
    renderPrograms();
    renderFolderGrid();
    renderLibrary();
    return;
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  const color = PROGRAM_CARD_COLORS[PROGRAMS.length % PROGRAM_CARD_COLORS.length];

  if (scheduleType === "structured") {
    const durationWeeks = Number(document.getElementById("program-modal-duration").value) || 8;
    PROGRAMS.push({ id, name, color, status, scheduleType, memberCount: 0, durationWeeks, description });
    // Every day defaults to Rest — staff fills it in via Manage Schedule (this
    // is the same shape buildFitFunctionalSchedule() produces, just blank).
    const days = [];
    for (let day = 1; day <= durationWeeks * 7; day++) days.push({ day, type: "rest" });
    SCHEDULE_TEMPLATES[id] = days;
  } else {
    const circuitsPerWeek = Number(document.getElementById("program-modal-per-week").value) || 1;
    PROGRAMS.push({ id, name, color, status, scheduleType, memberCount: 0, circuitsPerWeek, description });
    // Every rolling program needs its three permanent live folders to actually
    // receive published workouts — same structure as the seeded programs.
    FOLDERS.push({ id: id + "-this-week", name: "This Week's Workouts", program: id, live: true });
    FOLDERS.push({ id: id + "-stretch-core", name: "Stretch & Core Library", program: id, live: true });
    FOLDERS.push({ id: id + "-previous-week", name: "Previous Week", program: id, live: true });
  }

  // The program dropdowns elsewhere (New Folder modal, Member editor, Member
  // filter) are only populated once at load, so append the new option to each.
  const newOption = `<option value="${id}">${name}</option>`;
  document.getElementById("folder-modal-program").insertAdjacentHTML("beforeend", newOption);
  document.getElementById("member-modal-program").insertAdjacentHTML("beforeend", newOption);
  document.getElementById("member-program-filter").insertAdjacentHTML("beforeend", newOption);
  document.getElementById("challenge-modal-program").insertAdjacentHTML("beforeend", newOption);

  closeProgramModal();
  renderPrograms();
  renderFolderGrid();

  // Structured programs have nothing useful to show on the folder grid (no
  // live folders) — drop staff straight into filling in the schedule instead
  // of a program card that looks empty/broken.
  if (scheduleType === "structured") openScheduleView(id);
}

// ---------------- Circuit Folders ----------------

// currentScope tracks what the shared detail table (checkboxes + bulk bar) is
// currently showing: either one folder's circuits, or every circuit belonging
// to a program (across all of that program's folders).
let currentScope = null;
let selectedCircuitIds = new Set();

// Which entry is selected in the Circuits page's program side list — a
// program id, or the literal string "general" for unassigned folders.
let selectedProgramScope = PROGRAMS.length ? PROGRAMS[0].id : "general";

function populateProgramFilters() {
  const folderModalSelect = document.getElementById("folder-modal-program");
  const memberModalSelect = document.getElementById("member-modal-program");
  const memberFilterSelect = document.getElementById("member-program-filter");
  const challengeModalSelect = document.getElementById("challenge-modal-program");
  PROGRAMS.forEach((p) => {
    folderModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    memberModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    memberFilterSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    challengeModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
  });
}

// Program name is deliberately left off the card — the left-side program
// list already scopes what's showing, so repeating it on every card here
// was redundant clutter (Chris's call, once workout counts started growing).
// `opts.readonly` drops the delete button and routes the click back to the
// Library instead of the program's folder grid. The Library is for finding
// old content, not editing the shelf it sits on — deleting a folder is an
// authoring action and belongs on the authoring surface.
function folderCardHtml(f, opts = {}) {
  const count = CIRCUITS.filter((c) => c.folderId === f.id).length;
  const action = opts.readonly ? "open-library-folder" : "open-folder";
  return `
    <div class="folder-card ${f.program ? "tagged" : ""} ${f.live ? "live" : ""}" data-action="${action}" data-folder-id="${f.id}">
      ${f.live || opts.readonly ? "" : `<button class="folder-delete-btn" data-action="delete-folder" data-folder-id="${f.id}" title="Delete folder">✕</button>`}
      <div class="folder-card-top">
        <h3>${f.name}</h3>
        ${f.live ? `<span class="folder-live-badge">● LIVE</span>` : ""}
      </div>
      <p class="folder-count">${count} workout${count === 1 ? "" : "s"}</p>
    </div>
  `;
}

// Folders for a program (or "general" for unassigned), live folders first,
// then library folders newest-first (newest = most recently pushed onto
// FOLDERS, so just reverse the rest).
function orderedFoldersForScope(scope) {
  const forScope = scope === "general" ? FOLDERS.filter((f) => !f.program) : FOLDERS.filter((f) => f.program === scope);
  const live = forScope.filter((f) => f.live);
  const library = forScope.filter((f) => !f.live).reverse();
  return [...live, ...library];
}

function renderFolderGrid() {
  const scope = selectedProgramScope;
  const program = programById(scope);
  const entryName = scope === "general" ? "General (Unassigned)" : (program ? program.name : "");
  document.getElementById("folder-pane-title").textContent = entryName;
  document.getElementById("folder-grid-eyebrow").textContent =
    program ? (program.scheduleType === "structured" ? `Structured · ${program.durationWeeks || 8} weeks` : "On demand") : "Content";

  const folders = orderedFoldersForScope(scope);
  document.getElementById("folder-grid").innerHTML = folders.map(folderCardHtml).join("")
    || `<p style="color:var(--deepblue);font-weight:700;">No folders here yet. Click "+ New Folder" to add one.</p>`;
}

// A folder's workouts can be reached from two places — the program that owns
// it, or the Library archive — and "back" has to return to whichever one you
// came from, so remember it (2026-08-15).
let folderEntryPoint = "programs";

// Entry point from the Programs page — content now lives inside the program
// it belongs to rather than in a separate top-level section (2026-08-15).
function openProgramFolders(programId) {
  selectedProgramScope = programId;
  currentScope = null;
  folderEntryPoint = "programs";
  selectedCircuitIds.clear();
  showView("view-circuits", "view-programs");
  document.getElementById("folder-detail-view").style.display = "none";
  document.getElementById("folder-grid-view").style.display = "block";
  renderFolderGrid();
}

// Entry point from the Library — jumps straight to a folder's workouts,
// skipping the program's folder grid, and keeps the Library nav highlighted
// so it's clear which surface you're on.
function openLibraryFolder(folderId) {
  const folder = folderById(folderId);
  if (!folder) return;
  selectedProgramScope = folder.program || "general";
  folderEntryPoint = "library";
  showView("view-circuits", "view-library");
  openFolder(folderId);
}

function openFolder(folderId) {
  currentScope = { type: "folder", id: folderId };
  selectedCircuitIds.clear();
  document.getElementById("folder-grid-view").style.display = "none";
  document.getElementById("folder-detail-view").style.display = "block";
  renderScopeDetail();
}

function backToFolders() {
  currentScope = null;
  selectedCircuitIds.clear();
  document.getElementById("folder-detail-view").style.display = "none";
  document.getElementById("folder-grid-view").style.display = "block";
  if (folderEntryPoint === "library") {
    folderEntryPoint = "programs";
    showView("view-library");
    renderLibrary();
    return;
  }
  renderFolderGrid();
}

// ---------------- Schedule (structured programs) ----------------

let currentScheduleProgramId = null;

function scheduleWorkoutOptions(programId) {
  return CIRCUITS.filter((c) => {
    const f = folderById(c.folderId);
    return f && f.program === programId;
  });
}

function openScheduleView(programId) {
  currentScheduleProgramId = programId;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("visible"));
  document.getElementById("view-schedule").classList.add("visible");
  document.querySelectorAll(".side-link").forEach((b) => b.classList.remove("active"));
  const programsLink = document.querySelector('.side-link[data-view="view-programs"]');
  if (programsLink) programsLink.classList.add("active");
  renderScheduleView();
}

function renderScheduleView() {
  const program = programById(currentScheduleProgramId);
  if (!program) return;
  const template = SCHEDULE_TEMPLATES[program.id] || [];
  const options = scheduleWorkoutOptions(program.id);

  document.getElementById("schedule-title").textContent = `${program.name} — Schedule`;
  document.getElementById("schedule-subtitle").textContent =
    `${program.durationWeeks}-week program · Day 1 starts on each member's own enrollment date, not a shared calendar date`;

  const weeks = [];
  for (let w = 0; w < program.durationWeeks; w++) {
    weeks.push(template.slice(w * 7, w * 7 + 7));
  }

  document.getElementById("schedule-weeks").innerHTML = weeks
    .map(
      (week, wi) => `
        <div class="schedule-week">
          <h3>Week ${wi + 1}</h3>
          <div class="schedule-day-list">
            ${week
              .map(
                (item) => `
                  <div class="schedule-day-row">
                    <span class="schedule-day-label">Day ${item.day}</span>
                    <select data-role="schedule-day-select" data-day="${item.day}">
                      <option value="rest" ${item.type === "rest" ? "selected" : ""}>Rest Day</option>
                      ${options
                        .map((c) => `<option value="${c.id}" ${item.type === "workout" && item.workoutId === c.id ? "selected" : ""}>${c.title}</option>`)
                        .join("")}
                    </select>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  document.querySelectorAll('[data-role="schedule-day-select"]').forEach((select) => {
    select.addEventListener("change", () => {
      const day = Number(select.dataset.day);
      const item = template.find((d) => d.day === day);
      if (!item) return;
      if (select.value === "rest") {
        item.type = "rest";
        delete item.workoutId;
      } else {
        item.type = "workout";
        item.workoutId = select.value;
      }
    });
  });
}

// Entered from a Program card's "Manage Workouts" — shows every circuit that
// belongs to the program (across all of its folders), not just one folder's.
function openProgramDetail(programId) {
  currentScope = { type: "program", id: programId };
  selectedCircuitIds.clear();
  showView("view-circuits", "view-programs");
  document.getElementById("folder-grid-view").style.display = "none";
  document.getElementById("folder-detail-view").style.display = "block";
  renderScopeDetail();
}

// The detail view's back button returns to wherever makes sense for how it
// was entered: a program's circuits go back to Programs, a folder's circuits
// go back to the folder grid.
function goBackFromDetail() {
  if (currentScope && currentScope.type === "program") {
    currentScope = null;
    selectedCircuitIds.clear();
    document.getElementById("folder-detail-view").style.display = "none";
    document.getElementById("folder-grid-view").style.display = "block";
    showView("view-programs");
  } else {
    backToFolders();
  }
}

// Circuits currently visible in the open folder or program — shared by the
// table render, "select all", and the bulk action buttons.
// Which Home/Gym variant the workout table is showing. Defaults to the first
// variant rather than "all" — a week folder holds both, and listing every
// session twice with identical text is worse than useless (2026-08-15).
let circuitVariantFilter = PROGRAM_VARIANTS[0].key;

function scopeCircuitsUnfiltered() {
  return CIRCUITS.filter((c) => {
    if (!currentScope) return false;
    if (currentScope.type === "folder" && c.folderId !== currentScope.id) return false;
    if (currentScope.type === "program" && circuitProgramId(c) !== currentScope.id) return false;
    return true;
  });
}

function scopeHasVariants() {
  return scopeCircuitsUnfiltered().some((c) => c.variant);
}

function currentScopeCircuits() {
  const all = scopeCircuitsUnfiltered();
  if (!scopeHasVariants() || circuitVariantFilter === "all") return all;
  // Workouts with no variant (a rolling program's, or one authored before
  // variants existed) always show — they aren't part of a pair to filter.
  return all.filter((c) => !c.variant || c.variant === circuitVariantFilter);
}

function renderCircuitVariantFilter() {
  const bar = document.getElementById("circuit-variant-filter");
  if (!scopeHasVariants()) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "";
  const counts = {};
  scopeCircuitsUnfiltered().forEach((c) => { if (c.variant) counts[c.variant] = (counts[c.variant] || 0) + 1; });
  const options = [...PROGRAM_VARIANTS.map((v) => ({ key: v.key, label: `${v.label} (${counts[v.key] || 0})` })), { key: "all", label: "Show both" }];
  bar.innerHTML = options.map((o) => `
    <button class="filter-pill ${o.key === circuitVariantFilter ? "active" : ""}" data-circuit-variant="${o.key}">${o.label}</button>
  `).join("");
  bar.querySelectorAll("[data-circuit-variant]").forEach((btn) => {
    btn.addEventListener("click", () => {
      circuitVariantFilter = btn.dataset.circuitVariant;
      selectedCircuitIds.clear();
      renderScopeDetail();
    });
  });
}

function renderScopeDetail() {
  if (!currentScope) return;
  const isProgram = currentScope.type === "program";

  if (isProgram) {
    const program = programById(currentScope.id);
    if (!program) return;
    document.getElementById("folder-detail-title").textContent = program.name;
    document.getElementById("folder-detail-badge").textContent = "All Workouts";
    document.getElementById("folder-back-btn").textContent = "← All Programs";
    document.getElementById("new-circuit-btn").style.display = "none";
    document.getElementById("folder-detail-edit-btn").style.display = "none";
  } else {
    const folder = folderById(currentScope.id);
    if (!folder) return;
    const program = programById(folder.program);
    document.getElementById("folder-detail-title").textContent = folder.name;
    document.getElementById("folder-detail-badge").textContent = program ? program.name : "General folder";
    document.getElementById("folder-back-btn").textContent =
      folderEntryPoint === "library" ? "← Library" : "← All Folders";
    document.getElementById("new-circuit-btn").style.display = "";
    document.getElementById("folder-detail-edit-btn").style.display = folder.live ? "none" : "";
  }

  renderCircuitVariantFilter();
  const rows = currentScopeCircuits();

  document.getElementById("circuit-table-body").innerHTML = rows.map((c) => {
    const folder = folderById(c.folderId);
    return `
    <tr>
      <td><input type="checkbox" class="select-item-checkbox" data-role="select-circuit" data-circuit-id="${c.id}" ${selectedCircuitIds.has(c.id) ? "checked" : ""} /></td>
      <td><strong>${c.title}</strong>${c.variant ? ` <span class="variant-pill variant-${c.variant}">${(PROGRAM_VARIANTS.find((v) => v.key === c.variant) || {}).label || c.variant}</span>` : ""}${c.category !== "circuit" && c.category !== "structured" ? ` <span class="status-pill">${categoryLabel(c.category)}</span>` : ""}${c.isBenchmark ? ` <span class="status-pill benchmark-pill">🏆 ${benchmarkById(c.benchmarkId)?.name || "Benchmark"}</span>` : ""}<br /><span style="color:var(--deepblue);font-weight:700;font-size:11px;">${c.focus} · ${c.difficulty}</span></td>
      <td>${folder ? folder.name : "—"}</td>
      <td>${c.blocks.length} blocks</td>
      <td><button class="table-action-btn" data-edit-circuit="${c.id}">Edit</button></td>
    </tr>
  `;
  }).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--deepblue);padding:24px;">No workouts ${isProgram ? "in this program" : "in this folder"}.${isProgram ? "" : ' Click "+ New Workout" to add one.'}</td></tr>`;

  document.querySelectorAll("[data-edit-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditBuilder(btn.dataset.editCircuit));
  });

  document.getElementById("circuit-select-all").checked = rows.length > 0 && rows.every((c) => selectedCircuitIds.has(c.id));
  renderBulkBar();
}

let pendingBulkAction = null;

function openTargetFolderModal(action) {
  if (selectedCircuitIds.size === 0) return;
  pendingBulkAction = action;
  const isCopy = action === "copy";
  document.getElementById("target-folder-modal-title").textContent = isCopy ? "Copy to Folder" : "Move to Folder";
  document.getElementById("target-folder-modal-confirm-btn").textContent = isCopy ? "Copy" : "Move";
  const count = selectedCircuitIds.size;
  document.getElementById("target-folder-modal-desc").textContent =
    `${count} workout${count === 1 ? "" : "s"} selected. Choose where to ${isCopy ? "copy" : "move"} ${count === 1 ? "it" : "them"}.`;

  const excludeId = currentScope && currentScope.type === "folder" ? currentScope.id : null;
  const select = document.getElementById("target-folder-modal-select");
  select.innerHTML = FOLDERS.filter((f) => f.id !== excludeId).map((f) => {
    const program = programById(f.program);
    return `<option value="${f.id}">${f.name} (${program ? program.name : "General"})</option>`;
  }).join("");

  document.getElementById("target-folder-modal-overlay").classList.add("visible");
}

function closeTargetFolderModal() {
  document.getElementById("target-folder-modal-overlay").classList.remove("visible");
  pendingBulkAction = null;
}

function confirmTargetFolderModal() {
  const targetId = document.getElementById("target-folder-modal-select").value;
  if (!targetId || !pendingBulkAction) return;

  if (pendingBulkAction === "copy") {
    // Snapshot the selected circuits before mutating CIRCUITS, since unshifting
    // into it mid-iteration would shift indices out from under a live forEach.
    const toCopy = CIRCUITS.filter((c) => selectedCircuitIds.has(c.id));
    toCopy.forEach((c, i) => {
      const copy = JSON.parse(JSON.stringify(c));
      copy.id = c.id + "-copy-" + Date.now() + "-" + i;
      copy.folderId = targetId;
      CIRCUITS.unshift(copy);
    });
  } else {
    CIRCUITS.forEach((c) => {
      if (selectedCircuitIds.has(c.id)) c.folderId = targetId;
    });
  }

  selectedCircuitIds.clear();
  closeTargetFolderModal();
  renderScopeDetail();
  renderFolderGrid();
  renderPrograms();
}

function renderBulkBar() {
  const bar = document.getElementById("circuit-bulk-bar");
  bar.classList.toggle("visible", selectedCircuitIds.size > 0);
  document.getElementById("circuit-bulk-count").textContent = `${selectedCircuitIds.size} selected`;
}

let editingFolderId = null;

function openFolderModal() {
  editingFolderId = null;
  document.getElementById("folder-modal-title").textContent = "New Folder";
  document.getElementById("folder-modal-save-btn").textContent = "Create Folder";
  document.getElementById("folder-modal-name").value = "";
  document.getElementById("folder-modal-program").value = "";
  document.getElementById("folder-modal-overlay").classList.add("visible");
}

function openEditFolderModal(folderId) {
  const folder = folderById(folderId);
  if (!folder) return;
  editingFolderId = folderId;
  document.getElementById("folder-modal-title").textContent = "Rename Folder";
  document.getElementById("folder-modal-save-btn").textContent = "Save Changes";
  document.getElementById("folder-modal-name").value = folder.name;
  document.getElementById("folder-modal-program").value = folder.program || "";
  document.getElementById("folder-modal-overlay").classList.add("visible");
}

function closeFolderModal() {
  document.getElementById("folder-modal-overlay").classList.remove("visible");
  editingFolderId = null;
}

function saveNewFolder() {
  const name = document.getElementById("folder-modal-name").value.trim();
  if (!name) {
    alert("Enter a name for the folder.");
    return;
  }
  const program = document.getElementById("folder-modal-program").value || null;

  if (editingFolderId) {
    const folder = folderById(editingFolderId);
    folder.name = name;
    folder.program = program;
  } else {
    FOLDERS.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), name, program });
  }
  closeFolderModal();
  renderFolderGrid();
  if (currentScope && currentScope.type === "folder") renderScopeDetail();
}

// ---------------- Circuit Builder ----------------

function defaultBlockValues(type) {
  switch (type) {
    case "interval":
      return { label: "New Circuit", timed: true, rounds: 2, work: 40, rest: 20, exercises: [{ name: "", reps: 12 }] };
    case "superset":
      return { label: "New Superset", rounds: 3, rest: 30, exercises: [{ name: "", reps: 12 }, { name: "", reps: 12 }] };
    case "straight":
      return { label: "New Straight Sets", exerciseName: "", sets: 3, reps: 12, rest: 30 };
    case "ladder":
      return { label: "New Rep Ladder", exerciseName: "", scheme: "10,8,6,4,2,4,6,8,10", rest: 15 };
    case "amrap":
      return { label: "New AMRAP", durationMin: 10, exercises: [{ name: "", reps: 10 }] };
    case "emom":
      return { label: "New EMOM", durationMin: 10, intervalSec: 60, exercises: [{ name: "", reps: 10 }] };
    default:
      return {};
  }
}

let builderBlocks = [];
let builderFolderId = null;
let editingCircuitId = null;
// Set when the workout being edited is one of a Home/Gym pair — see
// PROGRAM_VARIANTS. builderSlotId identifies the shared session; the pills
// switch which variant's exercises are on screen (2026-08-15).
let builderSlotId = null;
let builderVariantKey = null;

function openBuilder(folderId) {
  editingCircuitId = null;
  // A brand-new workout isn't part of a variant pair yet — creating both
  // sides from scratch isn't built (see note in openEditBuilder).
  builderSlotId = null;
  builderVariantKey = null;
  builderFolderId = folderId;
  const folder = folderById(folderId);
  const program = programById(folder ? folder.program : null);
  document.getElementById("builder-heading").textContent = "New Workout";
  document.getElementById("builder-folder-label").textContent =
    `Adding to: ${folder ? folder.name : "—"}${program ? " · " + program.name : ""}`;
  document.getElementById("builder-title").value = "";
  document.getElementById("builder-tag").value = "";
  document.getElementById("builder-category").value = "circuit";
  document.getElementById("builder-focus").value = "";
  document.getElementById("builder-difficulty").value = "Intermediate";
  document.getElementById("builder-desc").value = "";
  document.getElementById("builder-is-benchmark").checked = false;
  document.getElementById("builder-benchmark-select").innerHTML = BENCHMARKS.map((b) => `<option value="${b.id}">${b.name} — ${b.subtitle}</option>`).join("");
  document.getElementById("builder-benchmark-select-wrap").style.display = "none";
  builderBlocks = [];
  builderActiveSlot = null;
  builderLibraryCategory = "All";
  document.getElementById("builder-library-search").value = "";
  renderBuilderBlocks();
  renderBuilderLibraryFilters();
  renderBuilderLibraryList();
  document.getElementById("builder-overlay").classList.add("visible");
}

// Reverses builderBlocksToSchema() for editing an existing workout — reconstructs
// builder-shape blocks from the saved schema. exerciseId isn't stored on the schema
// (see builderBlocksToSchema), so it's best-effort re-matched by name here; a
// missing match just means that slot's exerciseId is null until re-picked.
function exerciseIdByName(name) {
  const ex = EXERCISE_LIBRARY.find((x) => x.name === name);
  return ex ? ex.id : null;
}

function schemaBlockToBuilderBlock(block) {
  switch (block.type) {
    case "interval":
      return {
        type: "interval",
        values: {
          label: block.label,
          timed: block.timed !== false,
          rounds: block.rounds,
          work: block.work || 40,
          rest: block.rest,
          exercises: block.exercises.map((e) => ({ name: e.name, exerciseId: exerciseIdByName(e.name), reps: e.reps || 12 })),
        },
      };
    case "superset":
      return {
        type: "superset",
        values: {
          label: block.label,
          rounds: block.rounds,
          rest: block.rest,
          exercises: block.exercises.map((e) => ({ name: e.name, exerciseId: exerciseIdByName(e.name), reps: e.reps })),
        },
      };
    case "straight":
      return {
        type: "straight",
        values: {
          label: block.label,
          exerciseName: block.exercise.name,
          exerciseId: exerciseIdByName(block.exercise.name),
          sets: block.sets,
          reps: block.reps,
          rest: block.rest,
        },
        selected: false,
      };
    case "ladder":
      return {
        type: "ladder",
        values: {
          label: block.label,
          exerciseName: block.exercise.name,
          exerciseId: exerciseIdByName(block.exercise.name),
          scheme: block.scheme.join(","),
          rest: block.rest,
        },
      };
    case "amrap":
      return {
        type: "amrap",
        values: {
          label: block.label,
          durationMin: Math.round(block.duration / 60),
          exercises: block.exercises.map((e) => ({ name: e.name, exerciseId: exerciseIdByName(e.name), reps: e.reps })),
        },
      };
    case "emom":
      return {
        type: "emom",
        values: {
          label: block.label,
          durationMin: Math.round(block.duration / 60),
          intervalSec: block.interval,
          exercises: block.exercises.map((e) => ({ name: e.name, exerciseId: exerciseIdByName(e.name), reps: e.reps })),
        },
      };
    default:
      return null;
  }
}

// Switching variants saves whatever's on screen into the variant you're
// leaving, so exercise picks aren't lost mid-edit.
function switchBuilderVariant(variantKey) {
  if (!builderSlotId || variantKey === builderVariantKey) return;
  stashBuilderVariantBlocks();
  builderVariantKey = variantKey;
  const sibling = CIRCUITS.find((c) => c.slotId === builderSlotId && c.variant === variantKey);
  builderBlocks = sibling ? sibling.blocks.map(schemaBlockToBuilderBlock).filter(Boolean) : [];
  builderActiveSlot = null;
  editingCircuitId = sibling ? sibling.id : null;
  renderBuilderVariantPills();
  renderBuilderBlocks();
  renderBuilderLibraryList();
}

// Writes the on-screen blocks back to the variant currently being edited,
// without going through the full save path.
function stashBuilderVariantBlocks() {
  if (!editingCircuitId) return;
  const idx = CIRCUITS.findIndex((c) => c.id === editingCircuitId);
  if (idx === -1) return;
  CIRCUITS[idx] = { ...CIRCUITS[idx], blocks: builderBlocksToSchema() };
}

function renderBuilderVariantPills() {
  const bar = document.getElementById("builder-variant-bar");
  if (!builderSlotId) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "";
  document.getElementById("builder-variant-pills").innerHTML = PROGRAM_VARIANTS.map((v) => `
    <button class="filter-pill ${v.key === builderVariantKey ? "active" : ""}" data-builder-variant="${v.key}">${v.label}</button>
  `).join("");
  document.querySelectorAll("[data-builder-variant]").forEach((btn) => {
    btn.addEventListener("click", () => switchBuilderVariant(btn.dataset.builderVariant));
  });
}

// Structure is authored once and applies to every variant — only the
// exercises in each block differ. Copies the shared fields across, keeping
// each variant's own exercise picks intact.
function syncStructureToSiblingVariants(source) {
  if (!source.slotId) return;
  CIRCUITS.forEach((c, i) => {
    if (c.slotId !== source.slotId || c.id === source.id) return;
    const blocks = source.blocks.map((sb, bi) => {
      const own = c.blocks[bi];
      // Same block type: keep this variant's exercises, take everything else.
      if (own && own.type === sb.type) {
        return own.exercise
          ? { ...sb, exercise: own.exercise }
          : { ...sb, exercises: own.exercises };
      }
      // Block added or its type changed — the variant has no matching
      // exercises to preserve, so it inherits the source's as a starting point.
      return JSON.parse(JSON.stringify(sb));
    });
    CIRCUITS[i] = {
      ...c,
      tag: source.tag,
      title: source.title,
      focus: source.focus,
      difficulty: source.difficulty,
      desc: source.desc,
      isBenchmark: source.isBenchmark,
      benchmarkId: source.benchmarkId,
      blocks,
    };
  });
}

function openEditBuilder(circuitId) {
  const circuit = CIRCUITS.find((c) => c.id === circuitId);
  if (!circuit) return;
  editingCircuitId = circuitId;
  builderFolderId = circuit.folderId;
  const folder = folderById(circuit.folderId);
  const program = programById(folder ? folder.program : null);
  document.getElementById("builder-heading").textContent = "Edit Workout";
  document.getElementById("builder-folder-label").textContent =
    `Editing in: ${folder ? folder.name : "—"}${program ? " · " + program.name : ""}`;
  document.getElementById("builder-title").value = circuit.title;
  document.getElementById("builder-tag").value = circuit.tag;
  document.getElementById("builder-category").value = circuit.category;
  document.getElementById("builder-focus").value = circuit.focus;
  document.getElementById("builder-difficulty").value = circuit.difficulty;
  document.getElementById("builder-desc").value = circuit.desc;
  document.getElementById("builder-is-benchmark").checked = !!circuit.isBenchmark;
  document.getElementById("builder-benchmark-select").innerHTML = BENCHMARKS.map((b) => `<option value="${b.id}">${b.name} — ${b.subtitle}</option>`).join("");
  document.getElementById("builder-benchmark-select-wrap").style.display = circuit.isBenchmark ? "" : "none";
  if (circuit.isBenchmark) document.getElementById("builder-benchmark-select").value = circuit.benchmarkId;
  builderSlotId = circuit.slotId || null;
  builderVariantKey = circuit.variant || null;
  renderBuilderVariantPills();
  builderBlocks = circuit.blocks.map(schemaBlockToBuilderBlock).filter(Boolean);
  builderActiveSlot = null;
  builderLibraryCategory = "All";
  document.getElementById("builder-library-search").value = "";
  renderBuilderBlocks();
  renderBuilderLibraryFilters();
  renderBuilderLibraryList();
  document.getElementById("builder-overlay").classList.add("visible");
}

// A block's type dropdown only offers types compatible with how many exercises
// it currently holds — single-exercise (straight/ladder) vs. multi-exercise
// (superset/interval/amrap/emom). Combining/splitting is what moves a block
// between those two families.
function compatibleTypesFor(block) {
  if (block.type === "straight" || block.type === "ladder") return ["straight", "ladder"];
  return ["superset", "interval", "amrap", "emom"];
}

// Note: nothing to carry over for the explainer text — it's derived from the
// new type via BLOCK_FORMAT_NOTES, so switching a block's type now swaps its
// "Before You Start" copy automatically (2026-08-12).
function convertBlockType(block, newType) {
  const fresh = defaultBlockValues(newType);
  const singleFamily = newType === "straight" || newType === "ladder";
  if (singleFamily && block.values.exerciseName) {
    fresh.exerciseName = block.values.exerciseName;
    fresh.exerciseId = block.values.exerciseId;
    fresh.label = block.values.exerciseName;
  }
  if (!singleFamily && block.values.exercises) {
    fresh.exercises = block.values.exercises.map((e) => ({ name: e.name, exerciseId: e.exerciseId, reps: e.reps || 10 }));
    fresh.label = blockTypeLabel(newType);
  }
  return { type: newType, values: fresh };
}

function combineSelected(targetType) {
  const selectedIndices = builderBlocks
    .map((b, i) => (b.type === "straight" && b.selected ? i : -1))
    .filter((i) => i !== -1);
  if (selectedIndices.length < 2) return;

  const exercises = selectedIndices.map((i) => {
    const v = builderBlocks[i].values;
    return { name: v.exerciseName, exerciseId: v.exerciseId, reps: v.reps || 10 };
  });

  const fresh = defaultBlockValues(targetType);
  fresh.exercises = targetType === "interval" ? exercises.map((e) => ({ name: e.name, exerciseId: e.exerciseId })) : exercises;
  fresh.label = blockTypeLabel(targetType);
  const newBlock = { type: targetType, values: fresh };

  const insertAt = selectedIndices[0];
  for (let k = selectedIndices.length - 1; k >= 0; k--) {
    builderBlocks.splice(selectedIndices[k], 1);
  }
  builderBlocks.splice(insertAt, 0, newBlock);
  renderBuilderBlocks();
}

function splitBlock(bi) {
  const block = builderBlocks[bi];
  if (!block.values.exercises) return;
  const newItems = block.values.exercises
    .filter((e) => e.name)
    .map((e) => ({
      type: "straight",
      values: { label: e.name, exerciseName: e.name, exerciseId: e.exerciseId, sets: 3, reps: e.reps || 12, rest: 30 },
      selected: false,
    }));
  builderBlocks.splice(bi, 1, ...newItems);
  renderBuilderBlocks();
}

function closeBuilder() {
  document.getElementById("builder-overlay").classList.remove("visible");
}

function chosenExercisePill(name, i, ei) {
  const active = isActiveSlot(i, ei) ? " active-slot" : "";
  return `<div class="chosen-exercise ${name ? "" : "empty"}${active}" data-action="choose-exercise" data-block-index="${i}" data-ex-index="${ei}">${name || "+ Choose Exercise"}</div>`;
}

function blockFieldRow(block, i) {
  const v = block.values;
  switch (block.type) {
    case "interval":
      return `
        <label class="timed-toggle-label">
          <input type="checkbox" data-block-index="${i}" data-field="timed" ${v.timed !== false ? "checked" : ""} />
          Timed (uncheck for rep-based — self-paced reps instead of a work timer)
        </label>
        <div class="builder-field-row">
          <label>Rounds<input type="number" min="1" value="${v.rounds}" data-block-index="${i}" data-field="rounds" /></label>
          ${v.timed !== false ? `<label>Work (sec)<input type="number" min="1" value="${v.work}" data-block-index="${i}" data-field="work" /></label>` : ""}
          <label>Rest (sec)<input type="number" min="0" value="${v.rest}" data-block-index="${i}" data-field="rest" /></label>
        </div>
        <div class="builder-ex-list">
          ${v.exercises.map((e, ei) => `
            <div class="builder-ex-row">
              ${chosenExercisePill(e.name, i, ei)}
              ${v.timed === false ? `<input type="number" placeholder="Reps" value="${e.reps || ""}" data-block-index="${i}" data-ex-index="${ei}" data-exfield="reps" />` : ""}
              <button class="remove-ex-btn" data-action="remove-exercise" data-block-index="${i}" data-ex-index="${ei}">✕</button>
            </div>
          `).join("")}
        </div>
        <button class="btn-ghost-lg small" data-action="add-exercise" data-block-index="${i}">+ Add Station</button>
      `;
    case "superset":
      return `
        <div class="builder-field-row">
          <label>Rounds<input type="number" min="1" value="${v.rounds}" data-block-index="${i}" data-field="rounds" /></label>
          <label>Rest between rounds (sec)<input type="number" min="0" value="${v.rest}" data-block-index="${i}" data-field="rest" /></label>
        </div>
        <div class="builder-ex-list">
          ${v.exercises.map((e, ei) => `
            <div class="builder-ex-row">
              ${chosenExercisePill(e.name, i, ei)}
              <input type="number" placeholder="Reps" value="${e.reps}" data-block-index="${i}" data-ex-index="${ei}" data-exfield="reps" />
              <button class="remove-ex-btn" data-action="remove-exercise" data-block-index="${i}" data-ex-index="${ei}">✕</button>
            </div>
          `).join("")}
        </div>
        <button class="btn-ghost-lg small" data-action="add-exercise" data-block-index="${i}">+ Add Exercise</button>
      `;
    case "straight":
      return `
        <label class="modal-field">Exercise
          <div class="chosen-exercise-lg ${v.exerciseName ? "" : "empty"}${isActiveSlot(i, null) ? " active-slot" : ""}" data-action="choose-exercise" data-block-index="${i}">${v.exerciseName || "+ Choose Exercise"}</div>
        </label>
        <div class="builder-field-row">
          <label>Sets<input type="number" min="1" value="${v.sets}" data-block-index="${i}" data-field="sets" /></label>
          <label>Reps<input type="number" min="1" value="${v.reps}" data-block-index="${i}" data-field="reps" /></label>
          <label>Rest (sec)<input type="number" min="0" value="${v.rest}" data-block-index="${i}" data-field="rest" /></label>
        </div>
      `;
    case "ladder":
      return `
        <label class="modal-field">Exercise
          <div class="chosen-exercise-lg ${v.exerciseName ? "" : "empty"}${isActiveSlot(i, null) ? " active-slot" : ""}" data-action="choose-exercise" data-block-index="${i}">${v.exerciseName || "+ Choose Exercise"}</div>
        </label>
        <div class="builder-field-row">
          <label>Rep scheme (comma-sep)<input type="text" value="${v.scheme}" data-block-index="${i}" data-field="scheme" /></label>
          <label>Rest (sec)<input type="number" min="0" value="${v.rest}" data-block-index="${i}" data-field="rest" /></label>
        </div>
      `;
    case "amrap":
      return `
        <div class="builder-field-row">
          <label>Duration (min)<input type="number" min="1" value="${v.durationMin}" data-block-index="${i}" data-field="durationMin" /></label>
        </div>
        <div class="builder-ex-list">
          ${v.exercises.map((e, ei) => `
            <div class="builder-ex-row">
              ${chosenExercisePill(e.name, i, ei)}
              <input type="number" placeholder="Reps" value="${e.reps}" data-block-index="${i}" data-ex-index="${ei}" data-exfield="reps" />
              <button class="remove-ex-btn" data-action="remove-exercise" data-block-index="${i}" data-ex-index="${ei}">✕</button>
            </div>
          `).join("")}
        </div>
        <button class="btn-ghost-lg small" data-action="add-exercise" data-block-index="${i}">+ Add Exercise</button>
      `;
    case "emom":
      return `
        <div class="builder-field-row">
          <label>Duration (min)<input type="number" min="1" value="${v.durationMin}" data-block-index="${i}" data-field="durationMin" /></label>
          <label>Interval (sec)<input type="number" min="10" value="${v.intervalSec}" data-block-index="${i}" data-field="intervalSec" /></label>
        </div>
        <div class="builder-ex-list">
          ${v.exercises.map((e, ei) => `
            <div class="builder-ex-row">
              ${chosenExercisePill(e.name, i, ei)}
              <input type="number" placeholder="Reps" value="${e.reps}" data-block-index="${i}" data-ex-index="${ei}" data-exfield="reps" />
              <button class="remove-ex-btn" data-action="remove-exercise" data-block-index="${i}" data-ex-index="${ei}">✕</button>
            </div>
          `).join("")}
        </div>
        <button class="btn-ghost-lg small" data-action="add-exercise" data-block-index="${i}">+ Add Exercise</button>
      `;
    default:
      return "";
  }
}

function renderBuilderBlocks() {
  document.getElementById("builder-blocks").innerHTML = builderBlocks.map((block, i) => {
    const compatTypes = compatibleTypesFor(block);
    const isCombined = compatTypes.includes("superset");
    return `
    <div class="builder-block-card">
      <div class="builder-block-top">
        ${block.type === "straight" ? `<input type="checkbox" class="select-item-checkbox" data-role="select-item" data-block-index="${i}" ${block.selected ? "checked" : ""} title="Select to combine with other exercises" />` : ""}
        <select data-block-index="${i}" data-role="block-type">
          ${compatTypes.map((t) => `<option value="${t}" ${t === block.type ? "selected" : ""}>${blockTypeLabel(t)}</option>`).join("")}
        </select>
        <input type="text" data-block-index="${i}" data-field="label" value="${block.values.label}" placeholder="Block label" />
        ${isCombined ? `<button class="btn-ghost-lg small" data-action="split-block" data-block-index="${i}">Split</button>` : ""}
        <button class="remove-block-btn" data-action="remove-block" data-block-index="${i}">✕</button>
      </div>
      ${blockFieldRow(block, i)}
      <div class="builder-desc-label">Before You Start <span class="modal-field-hint">(set automatically by block type — shown to members when this block starts)</span>
        <p class="block-format-note-preview">${BLOCK_FORMAT_NOTES[block.type] || "No explainer defined for this block type yet."}</p>
      </div>
    </div>
  `;
  }).join("") || `<p style="color:var(--deepblue);font-weight:700;font-size:13px;">No exercises yet — click "+ Add Exercise" to start building this workout.</p>`;

  renderCombineBar();
  document.getElementById("builder-est").textContent = builderBlocks.length === 0
    ? "Estimated duration: —"
    : `Estimated duration: ~${estimateCircuitMinutes(builderBlocksToSchema())} min`;
}

function renderCombineBar() {
  const bar = document.getElementById("combine-bar");
  const count = builderBlocks.filter((b) => b.type === "straight" && b.selected).length;
  if (count >= 2) {
    bar.style.display = "flex";
    document.getElementById("combine-bar-count").textContent = `${count} selected`;
  } else {
    bar.style.display = "none";
  }
}

function builderBlocksToSchema() {
  return builderBlocks.map((b) => {
    const v = b.values;
    switch (b.type) {
      case "interval": {
        const isTimed = v.timed !== false;
        const exercises = v.exercises.filter((e) => e.name.trim()).map((e) => (isTimed ? { name: e.name } : { name: e.name, reps: Number(e.reps) || 0 }));
        return isTimed
          ? { type: "interval", label: v.label, timed: true, rounds: Number(v.rounds) || 1, work: Number(v.work) || 0, rest: Number(v.rest) || 0, exercises }
          : { type: "interval", label: v.label, timed: false, rounds: Number(v.rounds) || 1, rest: Number(v.rest) || 0, exercises };
      }
      case "superset":
        return { type: "superset", label: v.label, rounds: Number(v.rounds) || 1, rest: Number(v.rest) || 0, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
      case "straight":
        return { type: "straight", label: v.label, exercise: { name: v.exerciseName || "" }, sets: Number(v.sets) || 1, reps: Number(v.reps) || 0, rest: Number(v.rest) || 0 };
      case "ladder":
        return { type: "ladder", label: v.label, exercise: { name: v.exerciseName || "" }, scheme: String(v.scheme).split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)), rest: Number(v.rest) || 0 };
      case "amrap":
        return { type: "amrap", label: v.label, duration: (Number(v.durationMin) || 1) * 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
      case "emom":
        return { type: "emom", label: v.label, duration: (Number(v.durationMin) || 1) * 60, interval: Number(v.intervalSec) || 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
      default:
        return null;
    }
  }).filter(Boolean);
}

// ---------------- Live sync bridge to the member app ----------------
// The three apps are independent static sites with no backend, but they're served
// from the same origin, so localStorage is genuinely shared browser storage between
// them. Publishing a circuit into one of a program's live folders writes it here in
// the member app's own schema; the member app picks it up on load, and — if already
// open in another tab — instantly via the "storage" event (see app.js).
const LIVE_CIRCUITS_KEY = "burnClubLiveCircuits";
const LIVE_CARD_COLORS = ["blue", "periwinkle", "deepblue", "yellow"];

// Member-submitted Health Profiles (Profile tab → My Health Profile), same
// bridge pattern, admin-side is read-only (2026-08-12, Chris: "make these
// all tie back to the back end system after they are saved, so we can see
// this info they have inputted").
const LIVE_HEALTH_PROFILES_KEY = "burnClubHealthProfiles";

function loadHealthProfiles() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_HEALTH_PROFILES_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

const HEALTH_PROFILE_SEX_LABELS = { female: "Female", male: "Male", "prefer-not-to-say": "Prefer not to say" };
const HEALTH_PROFILE_ACTIVITY_LABELS = { sedentary: "Sedentary", "lightly-active": "Lightly Active", active: "Active", "very-active": "Very Active" };
const HEALTH_PROFILE_GOAL_LABELS = { "lose-weight": "Lose Weight", "build-muscle": "Build Muscle", "improve-endurance": "Improve Endurance", "general-fitness": "General Fitness", other: "Other" };

function renderHealthProfileReadout(memberId) {
  const profile = loadHealthProfiles()[memberId];
  if (!profile) return "No health profile submitted yet.";
  const lines = [];
  if (profile.height) lines.push(`Height: ${profile.height}`);
  if (profile.weight) lines.push(`Weight: ${profile.weight} lbs`);
  if (profile.dob) lines.push(`DOB: ${profile.dob}`);
  if (profile.sex) lines.push(`Sex: ${HEALTH_PROFILE_SEX_LABELS[profile.sex] || profile.sex}`);
  if (profile.activityLevel) lines.push(`Activity Level: ${HEALTH_PROFILE_ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}`);
  if (profile.goal) lines.push(`Primary Goal: ${HEALTH_PROFILE_GOAL_LABELS[profile.goal] || profile.goal}`);
  if (profile.targetWeight) lines.push(`Target Weight: ${profile.targetWeight} lbs`);
  if (profile.injuries) lines.push(`Injuries/Limitations: ${profile.injuries}`);
  if (lines.length === 0) return "No health profile submitted yet.";
  if (profile.updatedAt) {
    const d = new Date(profile.updatedAt);
    lines.push(`Updated ${d.toLocaleDateString()}`);
  }
  return lines.join("<br>");
}

function syncCircuitToMemberApp(circuit) {
  const folder = folderById(circuit.folderId);
  if (!folder || !folder.live) return; // only workouts published to a live folder go out to members

  const category = folder.id.endsWith("-previous-week") ? "previous-week" : circuit.category;
  const memberCircuit = {
    id: circuit.id,
    category,
    tag: circuit.tag,
    title: circuit.title,
    meta: `${estimateCircuitMinutes(circuit.blocks)} min · ${circuit.focus} · ${circuit.difficulty}`,
    color: LIVE_CARD_COLORS[CIRCUITS.length % LIVE_CARD_COLORS.length],
    desc: circuit.desc,
    isBenchmark: circuit.isBenchmark,
    benchmarkId: circuit.benchmarkId,
    blocks: circuit.blocks,
  };

  const stored = JSON.parse(localStorage.getItem(LIVE_CIRCUITS_KEY) || "[]");
  const next = [memberCircuit, ...stored.filter((c) => c.id !== memberCircuit.id)];
  localStorage.setItem(LIVE_CIRCUITS_KEY, JSON.stringify(next));
}

function saveCircuit() {
  const title = document.getElementById("builder-title").value.trim() || "Untitled Workout";
  const blocks = builderBlocksToSchema();

  if (blocks.length === 0) {
    alert("Add at least one block before saving.");
    return;
  }

  const emptyBlock = blocks.find((b) => {
    if (b.exercise) return !b.exercise.name.trim();
    if (b.exercises) return b.exercises.length === 0;
    return false;
  });
  if (emptyBlock) {
    alert(`"${emptyBlock.label}" needs at least one named exercise before you can save.`);
    return;
  }

  const isBenchmark = document.getElementById("builder-is-benchmark").checked;
  const benchmarkId = isBenchmark ? document.getElementById("builder-benchmark-select").value : null;

  const circuit = {
    id: editingCircuitId || (title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now()),
    slotId: builderSlotId,
    variant: builderVariantKey,
    folderId: builderFolderId,
    category: document.getElementById("builder-category").value,
    tag: document.getElementById("builder-tag").value.trim() || "New",
    title,
    focus: document.getElementById("builder-focus").value.trim() || "Full Body",
    difficulty: document.getElementById("builder-difficulty").value,
    desc: document.getElementById("builder-desc").value.trim() || "No description yet.",
    isBenchmark,
    benchmarkId,
    blocks,
  };

  if (editingCircuitId) {
    const idx = CIRCUITS.findIndex((c) => c.id === editingCircuitId);
    if (idx !== -1) CIRCUITS[idx] = circuit;
  } else {
    CIRCUITS.unshift(circuit);
  }
  syncStructureToSiblingVariants(circuit);
  syncCircuitToMemberApp(circuit);
  closeBuilder();
  renderScopeDetail();
  renderFolderGrid();
  renderPrograms();
  renderLibrary();
  showView("view-circuits", "view-programs");
}

// ---------------- Exercise Library ----------------
// List-style master exercise page (2026-08-04, replaced the old card grid) —
// filterable by Body Part (specific muscle groups, not broad zones), Equipment,
// and Type (Strength/Cardio/Stretch). No usage-count field — Chris didn't want it.

let editingExerciseId = null;

// ---------------- Exercise filters — popup + multi-select (2026-08-10) ----------------
// Replaced the old always-visible ~20-pill filter rows with one "Filters" button
// that opens a popup; checkboxes are multi-select per group now (was single-select
// "All"-or-one), and nothing applies until Save is clicked. Body Part/Equipment/Type
// stay in EXERCISE_LIBRARY and drive filtering the same as before — they just moved
// off the card face per Chris's "the rest lives behind the scenes" ask.
let libraryFilterBodyParts = new Set();
let libraryFilterEquipment = new Set();
let libraryFilterModality = new Set();

function openExerciseFilterPopup() {
  renderTagCheckboxes("exercise-filter-bodyparts", BODY_PART_TAGS, [...libraryFilterBodyParts]);
  renderTagCheckboxes("exercise-filter-equipment", EQUIPMENT_TAGS, [...libraryFilterEquipment]);
  renderTagCheckboxes("exercise-filter-modality", MODALITY_TAGS, [...libraryFilterModality]);
  document.getElementById("exercise-filter-overlay").classList.add("visible");
}

function closeExerciseFilterPopup() {
  document.getElementById("exercise-filter-overlay").classList.remove("visible");
}

function clearExerciseFilterCheckboxes() {
  document.querySelectorAll("#exercise-filter-overlay input[type=checkbox]").forEach((cb) => { cb.checked = false; });
}

function saveExerciseFilters() {
  libraryFilterBodyParts = new Set(Array.from(document.querySelectorAll("#exercise-filter-bodyparts input:checked")).map((i) => i.value));
  libraryFilterEquipment = new Set(Array.from(document.querySelectorAll("#exercise-filter-equipment input:checked")).map((i) => i.value));
  libraryFilterModality = new Set(Array.from(document.querySelectorAll("#exercise-filter-modality input:checked")).map((i) => i.value));
  closeExerciseFilterPopup();
  updateExerciseFilterBadge();
  renderExerciseLibrary();
}

function updateExerciseFilterBadge() {
  const count = libraryFilterBodyParts.size + libraryFilterEquipment.size + libraryFilterModality.size;
  const badge = document.getElementById("exercise-filter-count");
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}

function renderExerciseLibrary() {
  const query = document.getElementById("exercise-search").value.trim().toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (libraryFilterBodyParts.size && !ex.bodyParts.some((bp) => libraryFilterBodyParts.has(bp))) return false;
    if (libraryFilterEquipment.size && !ex.equipment.some((eq) => libraryFilterEquipment.has(eq))) return false;
    if (libraryFilterModality.size && !libraryFilterModality.has(ex.modality)) return false;
    if (query && !ex.name.toLowerCase().includes(query)) return false;
    return true;
  });

  // Card shows only name + a video play button — body part/equipment/type/technique
  // still live on the exercise record, just surfaced via the edit form (click the
  // card) or the Filters popup, not printed on the card face.
  document.getElementById("exercise-list").innerHTML = filtered.map((ex) => `
    <div class="exercise-card" data-action="edit-exercise" data-ex-id="${ex.id}">
      <div class="exercise-card-video">
        <button class="exercise-card-play" data-action="view-exercise-video" data-ex-id="${ex.id}" title="View video">▶</button>
      </div>
      <p class="exercise-card-name">${ex.name}</p>
    </div>
  `).join("") || `<p style="color:var(--deepblue);font-weight:700;">No exercises match.</p>`;
}

// Mirrors the member app's exercise-video-popup pattern: a placeholder box since
// there's still no real video file anywhere in the app (same disclosed gap as
// everywhere else) — shows the exercise name, and the raw Video URL field as a
// clickable link if one was entered.
function openAdminExerciseVideo(exId) {
  const ex = EXERCISE_LIBRARY.find((x) => x.id === exId);
  if (!ex) return;
  document.getElementById("exercise-video-admin-label").textContent = `Demo Video — ${ex.name}`;
  const urlEl = document.getElementById("exercise-video-admin-url");
  urlEl.innerHTML = ex.videoUrl ? `<a href="${ex.videoUrl}" target="_blank" rel="noopener">${ex.videoUrl}</a>` : "No video URL set for this exercise yet.";
  document.getElementById("exercise-video-overlay-admin").classList.add("visible");
}

function closeAdminExerciseVideo() {
  document.getElementById("exercise-video-overlay-admin").classList.remove("visible");
}

function renderTagCheckboxes(containerId, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((opt) => `
    <label class="tag-checkbox">
      <input type="checkbox" value="${opt}" ${selected.includes(opt) ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
}

function renderModalityRadios(selected) {
  document.getElementById("exercise-modal-modality").innerHTML = MODALITY_TAGS.map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="exercise-modal-modality-radio" value="${opt}" ${selected === opt ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
}

function openExerciseModal() {
  editingExerciseId = null;
  document.getElementById("exercise-modal-title").textContent = "Add Exercise";
  document.getElementById("exercise-modal-save-btn").textContent = "Save Exercise";
  document.getElementById("exercise-modal-name").value = "";
  document.getElementById("exercise-modal-video").value = "";
  document.getElementById("exercise-modal-technique").value = "";
  renderTagCheckboxes("exercise-modal-bodyparts", BODY_PART_TAGS, []);
  renderModalityRadios("Strength");
  renderTagCheckboxes("exercise-modal-equipment", EQUIPMENT_TAGS, []);
  document.getElementById("exercise-modal-track-weight").checked = false;
  document.getElementById("exercise-modal-overlay").classList.add("visible");
}

function openEditExerciseModal(exerciseId) {
  const ex = EXERCISE_LIBRARY.find((x) => x.id === exerciseId);
  if (!ex) return;
  editingExerciseId = exerciseId;
  document.getElementById("exercise-modal-title").textContent = "Edit Exercise";
  document.getElementById("exercise-modal-save-btn").textContent = "Save Changes";
  document.getElementById("exercise-modal-name").value = ex.name;
  document.getElementById("exercise-modal-video").value = ex.videoUrl || "";
  document.getElementById("exercise-modal-technique").value = ex.technique || "";
  renderTagCheckboxes("exercise-modal-bodyparts", BODY_PART_TAGS, ex.bodyParts);
  renderModalityRadios(ex.modality);
  renderTagCheckboxes("exercise-modal-equipment", EQUIPMENT_TAGS, ex.equipment);
  document.getElementById("exercise-modal-track-weight").checked = !!ex.trackWeight;
  document.getElementById("exercise-modal-overlay").classList.add("visible");
}

function closeExerciseModal() {
  document.getElementById("exercise-modal-overlay").classList.remove("visible");
  editingExerciseId = null;
}

function saveExercise() {
  const name = document.getElementById("exercise-modal-name").value.trim();
  if (!name) {
    alert("Enter a name for the exercise.");
    return;
  }
  const videoUrl = document.getElementById("exercise-modal-video").value.trim();
  const technique = document.getElementById("exercise-modal-technique").value.trim();
  const bodyParts = Array.from(document.querySelectorAll("#exercise-modal-bodyparts input:checked")).map((i) => i.value);
  const modalityInput = document.querySelector("#exercise-modal-modality input:checked");
  const modality = modalityInput ? modalityInput.value : "Strength";
  const equipment = Array.from(document.querySelectorAll("#exercise-modal-equipment input:checked")).map((i) => i.value);
  const trackWeight = document.getElementById("exercise-modal-track-weight").checked;

  if (editingExerciseId) {
    const ex = EXERCISE_LIBRARY.find((x) => x.id === editingExerciseId);
    Object.assign(ex, { name, videoUrl, technique, bodyParts, modality, equipment, trackWeight });
  } else {
    EXERCISE_LIBRARY.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), name, videoUrl, technique, bodyParts, modality, equipment, trackWeight });
  }
  saveExerciseLibrary();
  closeExerciseModal();
  renderExerciseLibrary();
}

// ---------------- Exercise library persistence (2026-08-10) ----------------
// Admin doesn't persist most edits (see project memory), but a bulk spreadsheet
// upload is real content work — losing it on refresh would be a bad experience.
// So EXERCISE_LIBRARY specifically is saved/restored via localStorage; every
// add/edit/upload path below calls saveExerciseLibrary() after mutating it.
const EXERCISE_LIBRARY_STORAGE_KEY = "burnclub-admin-exercises";

function saveExerciseLibrary() {
  localStorage.setItem(EXERCISE_LIBRARY_STORAGE_KEY, JSON.stringify(EXERCISE_LIBRARY));
}

function loadExerciseLibrary() {
  const raw = localStorage.getItem(EXERCISE_LIBRARY_STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length) {
      EXERCISE_LIBRARY.length = 0;
      EXERCISE_LIBRARY.push(...saved);
    }
  } catch (e) {
    // Corrupt localStorage value — fall back to the seeded data.js library silently.
  }
}

// ---------------- Exercise spreadsheet upload (2026-08-10) ----------------
// CSV only (no build tooling to pull in an .xlsx parsing library) — Chris can
// export any spreadsheet tool's sheet as CSV. Columns: Name, Body Parts,
// Equipment, Type, Technique, Track Weight, Video URL. Body Parts/Equipment
// are semicolon-separated within their cell since commas are the delimiter.
const EXERCISE_UPLOAD_HEADERS = ["Name", "Body Parts", "Equipment", "Type", "Technique", "Track Weight", "Video URL"];
let exerciseUploadRows = []; // parsed + validated rows, held until Confirm Upload

function downloadExerciseTemplate() {
  const sampleRow = ["Bulgarian Split Squats", "Quads;Glutes", "Dumbbells", "Strength", "Rear foot elevated behind you, lower straight down until the front thigh is parallel to the floor.", "Yes", ""];
  const csv = [EXERCISE_UPLOAD_HEADERS, sampleRow].map(csvEscapeRow).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "burn-club-exercise-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscapeRow(cells) {
  return cells.map((c) => {
    const s = String(c ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",");
}

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped "" quotes,
// and commas/newlines inside quotes. Good enough for spreadsheet-exported CSV
// without pulling in an external library.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c === "\r") {
      // skip — the following \n (if any) closes the row
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function matchTag(value, knownTags) {
  const found = knownTags.find((t) => t.toLowerCase() === value.trim().toLowerCase());
  return found || null;
}

function parseBoolish(value) {
  return ["yes", "true", "1", "y"].includes(String(value).trim().toLowerCase());
}

function handleExerciseUploadFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCSV(String(reader.result));
    if (!rows.length) {
      alert("That file has no rows to read.");
      return;
    }
    // Header row is matched loosely by name/position — first row is always treated as headers.
    const dataRows = rows.slice(1);
    exerciseUploadRows = dataRows.map((cells, i) => {
      const [rawName, rawBodyParts, rawEquipment, rawType, rawTechnique, rawTrackWeight, rawVideo] = cells;
      const name = (rawName || "").trim();
      const warnings = [];

      const bodyPartsIn = (rawBodyParts || "").split(";").map((s) => s.trim()).filter(Boolean);
      const bodyParts = bodyPartsIn.map((v) => matchTag(v, BODY_PART_TAGS)).filter(Boolean);
      if (bodyPartsIn.length && bodyParts.length < bodyPartsIn.length) warnings.push("Unrecognized body part(s) dropped");

      const equipmentIn = (rawEquipment || "").split(";").map((s) => s.trim()).filter(Boolean);
      const equipment = equipmentIn.map((v) => matchTag(v, EQUIPMENT_TAGS)).filter(Boolean);
      if (equipmentIn.length && equipment.length < equipmentIn.length) warnings.push("Unrecognized equipment dropped");

      const typeRaw = (rawType || "").trim();
      const modality = matchTag(typeRaw, MODALITY_TAGS) || "Strength";
      if (typeRaw && !matchTag(typeRaw, MODALITY_TAGS)) warnings.push(`Unrecognized type "${typeRaw}" — defaulted to Strength`);

      const technique = (rawTechnique || "").trim();
      const trackWeight = parseBoolish(rawTrackWeight);
      const videoUrl = (rawVideo || "").trim();

      const existing = name ? EXERCISE_LIBRARY.find((x) => x.name.toLowerCase() === name.toLowerCase()) : null;

      return {
        rowNum: i + 2, // +2: 1-indexed, plus the header row
        name, bodyParts, equipment, modality, technique, trackWeight, videoUrl,
        warnings,
        status: !name ? "error" : existing ? "update" : "new",
        existingId: existing ? existing.id : null,
      };
    });
    openExerciseUploadPreview();
  };
  reader.readAsText(file);
}

function openExerciseUploadPreview() {
  const newCount = exerciseUploadRows.filter((r) => r.status === "new").length;
  const updateCount = exerciseUploadRows.filter((r) => r.status === "update").length;
  const errorCount = exerciseUploadRows.filter((r) => r.status === "error").length;
  document.getElementById("exercise-upload-summary").textContent =
    `${exerciseUploadRows.length} row(s): ${newCount} new, ${updateCount} will update an existing exercise` +
    (errorCount ? `, ${errorCount} skipped (missing name)` : "") + ". Review below, then confirm.";

  document.getElementById("exercise-upload-rows").innerHTML = exerciseUploadRows.map((r) => `
    <tr class="${r.status === "error" ? "upload-row-error" : ""}">
      <td>${r.rowNum}</td>
      <td>${r.name || "<em>(missing)</em>"}</td>
      <td>${r.bodyParts.join(", ") || "—"}</td>
      <td>${r.equipment.join(", ") || "—"}</td>
      <td>${r.modality}</td>
      <td>${r.trackWeight ? "Yes" : "No"}</td>
      <td>
        <span class="status-pill upload-${r.status}">${r.status === "new" ? "New" : r.status === "update" ? "Update" : "Skipped"}</span>
        ${r.warnings.map((w) => `<span class="exercise-upload-row-warning">${w}</span>`).join("")}
      </td>
    </tr>
  `).join("");

  document.getElementById("exercise-upload-overlay").classList.add("visible");
}

function closeExerciseUploadPreview() {
  document.getElementById("exercise-upload-overlay").classList.remove("visible");
  exerciseUploadRows = [];
  document.getElementById("exercise-upload-input").value = "";
}

function confirmExerciseUpload() {
  let added = 0, updated = 0;
  exerciseUploadRows.forEach((r) => {
    if (r.status === "error") return;
    if (r.status === "update") {
      const ex = EXERCISE_LIBRARY.find((x) => x.id === r.existingId);
      Object.assign(ex, { name: r.name, bodyParts: r.bodyParts, equipment: r.equipment, modality: r.modality, technique: r.technique, trackWeight: r.trackWeight, videoUrl: r.videoUrl });
      updated++;
    } else {
      EXERCISE_LIBRARY.push({
        id: r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now() + "-" + added,
        name: r.name, bodyParts: r.bodyParts, equipment: r.equipment, modality: r.modality, technique: r.technique, trackWeight: r.trackWeight, videoUrl: r.videoUrl,
      });
      added++;
    }
  });
  saveExerciseLibrary();
  closeExerciseUploadPreview();
  renderExerciseLibrary();
  alert(`Upload complete: ${added} exercise(s) added, ${updated} updated.`);
}

// ---------------- Exercise Library sidebar (embedded in the circuit builder) ----------------
// Always visible next to the workout form. With no slot active, clicking a card appends a new
// straight-set station; clicking an existing "+ Choose Exercise" chip on a block first arms that
// slot (setActiveSlot) so the next library click fills it instead of appending.

let builderLibraryCategory = "All";
let builderActiveSlot = null;

function isActiveSlot(blockIndex, exIndex) {
  const target = exIndex === undefined ? null : exIndex;
  return !!builderActiveSlot && builderActiveSlot.blockIndex === blockIndex && builderActiveSlot.exIndex === target;
}

function setActiveSlot(blockIndex, exIndex) {
  builderActiveSlot = { blockIndex, exIndex: exIndex === undefined ? null : exIndex };
  renderBuilderBlocks();
  renderBuilderLibraryList();
  document.getElementById("builder-library-search").focus();
}

function clearActiveSlot() {
  builderActiveSlot = null;
  renderBuilderBlocks();
  renderBuilderLibraryList();
}

function renderBuilderLibraryFilters() {
  const cats = ["All", ...BODY_PART_TAGS];
  document.getElementById("builder-library-filters").innerHTML = cats
    .map((c) => `<button class="pill-filter ${c === builderLibraryCategory ? "active" : ""}" data-action="builder-library-category" data-cat="${c}">${c}</button>`)
    .join("");
}

function renderBuilderLibraryList() {
  const query = document.getElementById("builder-library-search").value.trim();
  const queryLower = query.toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (builderLibraryCategory !== "All" && !ex.bodyParts.includes(builderLibraryCategory)) return false;
    if (queryLower && !ex.name.toLowerCase().includes(queryLower)) return false;
    return true;
  });

  document.getElementById("builder-library-hint").innerHTML = builderActiveSlot
    ? `Filling an exercise slot — click one below. <button class="link-btn" data-action="cancel-slot-fill">Cancel</button>`
    : "Click an exercise to add it as a new station.";

  let html = filtered.map((ex) => `
    <div class="builder-library-card" data-action="library-pick-exercise" data-ex-id="${ex.id}">
      <span>${ex.name}</span>
      <span class="status-pill">${ex.bodyParts.join(", ")}</span>
    </div>
  `).join("");

  if (filtered.length === 0) {
    html += `<div class="picker-empty-state">No exercises match${query ? ` "${query}"` : ""}.</div>`;
  }

  const exactMatch = EXERCISE_LIBRARY.some((ex) => ex.name.toLowerCase() === queryLower);
  if (query && !exactMatch) {
    html += `<button class="btn-primary picker-add-new" data-action="add-new-exercise-to-workout">+ Add "${query}" to library</button>`;
  }

  document.getElementById("builder-library-list").innerHTML = html;
}

function applyExerciseToWorkout(ex) {
  if (builderActiveSlot) {
    const { blockIndex, exIndex } = builderActiveSlot;
    const block = builderBlocks[blockIndex];
    if (exIndex === null) {
      block.values.exerciseName = ex.name;
      block.values.exerciseId = ex.id;
    } else {
      block.values.exercises[exIndex].name = ex.name;
      block.values.exercises[exIndex].exerciseId = ex.id;
    }
    builderActiveSlot = null;
  } else {
    builderBlocks.push({
      type: "straight",
      values: { label: ex.name, exerciseName: ex.name, exerciseId: ex.id, sets: 3, reps: 12, rest: 30 },
      selected: false,
    });
  }
  renderBuilderBlocks();
  renderBuilderLibraryList();
}

// Delegated events inside the builder for dynamic block/exercise fields
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.type === "checkbox") return; // checkboxes are handled entirely by the "change" listener
  if (!t.closest("#builder-blocks")) return;
  const bi = Number(t.dataset.blockIndex);
  if (Number.isNaN(bi)) return;
  const block = builderBlocks[bi];
  if (!block) return;

  if (t.dataset.exfield !== undefined && t.dataset.exIndex !== undefined) {
    const ei = Number(t.dataset.exIndex);
    block.values.exercises[ei][t.dataset.exfield] = t.value;
  } else if (t.dataset.field) {
    block.values[t.dataset.field] = t.value;
    if (t.dataset.field !== "label") document.getElementById("builder-est").textContent =
      `Estimated duration: ~${estimateCircuitMinutes(builderBlocksToSchema())} min`;
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.role === "block-type") {
    const bi = Number(t.dataset.blockIndex);
    builderBlocks[bi] = convertBlockType(builderBlocks[bi], t.value);
    renderBuilderBlocks();
  }
  if (t.dataset.role === "select-item") {
    const bi = Number(t.dataset.blockIndex);
    builderBlocks[bi].selected = t.checked;
    renderCombineBar();
  }
  if (t.dataset.field === "timed") {
    const bi = Number(t.dataset.blockIndex);
    builderBlocks[bi].values.timed = t.checked;
    renderBuilderBlocks();
  }
  if (t.dataset.role === "select-circuit") {
    if (t.checked) selectedCircuitIds.add(t.dataset.circuitId);
    else selectedCircuitIds.delete(t.dataset.circuitId);
    renderBulkBar();
  }
});

// Single delegated click handler for all dynamically-rendered controls.
// Uses closest() so clicks on child elements (e.g. text inside a picker row) resolve
// to the actionable ancestor rather than being silently dropped.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const bi = Number(el.dataset.blockIndex);

  if (action === "add-new-item") {
    builderActiveSlot = null;
    renderBuilderLibraryList();
    document.getElementById("builder-library-search").focus();
  }
  if (action === "open-folder") {
    openFolder(el.dataset.folderId);
  }
  if (action === "open-library-folder") {
    openLibraryFolder(el.dataset.folderId);
  }
  if (action === "restore-program") {
    toggleProgramArchived(el.dataset.programId);
  }
  if (action === "open-setting" && el.dataset.setting === "before-you-start") {
    openBlockNotesSettings();
  }
  if (action === "reset-block-note") {
    resetBlockNote(el.dataset.noteType);
  }
  if (action === "open-admin-thread") {
    openAdminThread(el.dataset.conversationId);
  }
  if (action === "edit-folder") {
    openEditFolderModal(el.dataset.folderId);
  }
  if (action === "edit-exercise") {
    openEditExerciseModal(el.dataset.exId);
  }
  if (action === "edit-member") {
    openEditMemberModal(el.dataset.memberId);
  }
  if (action === "select-member") {
    const id = el.dataset.memberId;
    if (el.checked) selectedMemberIds.add(id);
    else selectedMemberIds.delete(id);
    document.getElementById("member-select-all").checked = MEMBERS.length > 0 && Array.from(document.querySelectorAll('[data-action="select-member"]')).every((cb) => cb.checked);
    renderMemberBulkBar();
  }
  if (action === "member-status-filter") {
    memberStatusFilter = el.dataset.status;
    document.querySelectorAll('[data-action="member-status-filter"]').forEach((btn) => btn.classList.toggle("active", btn === el));
    renderMemberTable();
  }
  if (action === "view-challenge") {
    openChallengeDetail(el.dataset.challengeId);
  }
  if (action === "adjust-points") {
    const m = MEMBERS.find((x) => x.id === el.dataset.memberId);
    if (m) {
      m.pointAdjustment = (m.pointAdjustment || 0) + Number(el.dataset.delta);
      renderChallengeStandings();
    }
  }
  if (action === "delete-folder") {
    const folderId = el.dataset.folderId;
    const targetFolder = folderById(folderId);
    if (targetFolder && targetFolder.live) {
      alert("This is one of the program's permanent live folders and can't be deleted.");
      return;
    }
    if (CIRCUITS.some((c) => c.folderId === folderId)) {
      alert("Move or delete this folder's workouts before deleting it.");
      return;
    }
    FOLDERS.splice(FOLDERS.findIndex((f) => f.id === folderId), 1);
    renderFolderGrid();
  }
  if (action === "remove-block") {
    builderBlocks.splice(bi, 1);
    renderBuilderBlocks();
  }
  if (action === "split-block") {
    splitBlock(bi);
  }
  if (action === "combine") {
    combineSelected(el.dataset.targetType);
  }
  if (action === "add-exercise") {
    const block = builderBlocks[bi];
    block.values.exercises.push({ name: "", reps: 12 });
    renderBuilderBlocks();
  }
  if (action === "remove-exercise") {
    const ei = Number(el.dataset.exIndex);
    builderBlocks[bi].values.exercises.splice(ei, 1);
    renderBuilderBlocks();
  }
  if (action === "choose-exercise") {
    const exIndexRaw = el.dataset.exIndex;
    setActiveSlot(bi, exIndexRaw === undefined ? null : Number(exIndexRaw));
  }
  if (action === "cancel-slot-fill") {
    clearActiveSlot();
  }
  if (action === "library-pick-exercise") {
    const ex = EXERCISE_LIBRARY.find((x) => x.id === el.dataset.exId);
    if (ex) applyExerciseToWorkout(ex);
  }
  if (action === "add-new-exercise-to-workout") {
    const query = document.getElementById("builder-library-search").value.trim();
    if (!query) return;
    const newEx = {
      id: query.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      name: query,
      bodyParts: [builderLibraryCategory !== "All" ? builderLibraryCategory : "Full Body"],
      modality: "Strength",
      equipment: [],
      technique: "",
      videoUrl: "",
    };
    EXERCISE_LIBRARY.push(newEx);
    applyExerciseToWorkout(newEx);
  }
  if (action === "builder-library-category") {
    builderLibraryCategory = el.dataset.cat;
    renderBuilderLibraryFilters();
    renderBuilderLibraryList();
  }
  if (action === "view-exercise-video") {
    openAdminExerciseVideo(el.dataset.exId);
  }
});

// ---------------- Messaging ----------------

function memberById(id) {
  return MEMBERS.find((m) => m.id === id);
}

function conversationDisplayName(conv) {
  if (conv.type === "group") return conv.name;
  const member = memberById(conv.memberId);
  return member ? member.name : "Unknown Member";
}

function conversationMessages(conversationId) {
  return MESSAGES.filter((m) => m.conversationId === conversationId);
}

function conversationPreview(conv) {
  const msgs = conversationMessages(conv.id);
  const last = msgs[msgs.length - 1];
  return {
    lastText: last ? (last.isStaff ? `Staff: ${last.text}` : `${last.senderName.split(" ")[0]}: ${last.text}`) : "No messages yet.",
    lastTime: last ? last.time : "",
    unread: msgs.some((m) => !m.isStaff && !m.read),
  };
}

let selectedConversationId = null;

function renderAdminConversationList() {
  const preview = (conv) => conversationPreview(conv);
  document.getElementById("admin-conversation-list").innerHTML = CONVERSATIONS.map((conv) => {
    const p = preview(conv);
    return `
      <div class="admin-conversation-row ${conv.id === selectedConversationId ? "active" : ""}" data-action="open-admin-thread" data-conversation-id="${conv.id}">
        <div class="conversation-icon">${conv.type === "group" ? "👥" : "💬"}</div>
        <div class="conversation-text">
          <p class="conversation-name">${conversationDisplayName(conv)}</p>
          <p class="conversation-preview">${p.lastText}</p>
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">${p.lastTime}</span>
          ${p.unread ? `<span class="conversation-unread-dot"></span>` : ""}
        </div>
      </div>
    `;
  }).join("");
  updateAdminUnreadBadge();
}

function updateAdminUnreadBadge() {
  const unreadCount = MESSAGES.filter((m) => !m.isStaff && !m.read).length;
  const badge = document.getElementById("side-unread-badge");
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
}

function renderAdminMessageBubble(m, isGroup) {
  return `
    <div class="msg-bubble-row ${m.isStaff ? "from-me" : ""}">
      <div class="msg-bubble">
        ${isGroup && !m.isStaff ? `<p class="msg-sender">${m.senderName}</p>` : ""}
        <p>${m.text}</p>
        <span class="msg-time">${m.time}</span>
      </div>
    </div>
  `;
}

function renderAdminThreadMessages() {
  const conv = CONVERSATIONS.find((c) => c.id === selectedConversationId);
  if (!conv) return;
  const list = document.getElementById("admin-thread-messages");
  list.innerHTML = conversationMessages(selectedConversationId).map((m) => renderAdminMessageBubble(m, conv.type === "group")).join("");
  list.scrollTop = list.scrollHeight;
}

function openAdminThread(conversationId) {
  selectedConversationId = conversationId;
  const conv = CONVERSATIONS.find((c) => c.id === conversationId);
  if (!conv) return;

  conversationMessages(conversationId).forEach((m) => {
    if (!m.isStaff) m.read = true;
  });

  document.getElementById("admin-thread-title").textContent = conversationDisplayName(conv);
  document.getElementById("admin-thread-empty").style.display = "none";
  document.getElementById("admin-thread-active").style.display = "flex";
  renderAdminThreadMessages();
  renderAdminConversationList();
}

// Pushes locally AND into the shared localStorage bridge so the member/staff
// apps pick it up live (same-browser only — see LIVE_CIRCUITS_KEY's note).
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

function sendAdminReply(text) {
  if (!selectedConversationId || !text.trim()) return;
  broadcastMessage({
    id: "msg-" + Date.now(),
    conversationId: selectedConversationId,
    senderId: "staff",
    senderName: "Staff",
    isStaff: true,
    text: text.trim(),
    time: "Just now",
    read: true,
  });
  renderAdminThreadMessages();
  renderAdminConversationList();
}

// If the member or staff app sends/replies in the same browser, pick it up
// live instead of requiring a manual reload.
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
  renderAdminConversationList();
  if (selectedConversationId) renderAdminThreadMessages();
});


// ---------------- Library (2026-08-15) ----------------
// The archive. Every folder from every program, including programs that have
// been archived out of the Programs page, lives here — so Programs stays the
// working surface (what's live, where new content is made) and this stays the
// back catalogue. Content is created inside a program's folders; this is for
// finding a past session to reuse.
//
// Empty search browses folders; typing searches individual workouts. Folders
// are what make the archive browsable — a cycle adds ~200 workouts but only
// ~32 folders, so a flat workout list stops being scrollable long before the
// folder list does. Search covers the case folders can't.

let libraryQuery = "";

function renderLibrary() {
  const q = libraryQuery.trim().toLowerCase();
  const searching = q.length > 0;

  document.getElementById("library-archive").style.display = searching ? "none" : "";
  document.getElementById("library-results").style.display = searching ? "" : "none";

  if (!searching) {
    renderLibraryArchive();
    return;
  }

  const rows = CIRCUITS.filter((c) => {
    const folder = folderById(c.folderId);
    const program = folder ? programById(folder.program) : null;
    return [c.title, c.focus, c.difficulty, folder && folder.name, program && program.name]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  document.getElementById("library-count").textContent =
    `${rows.length} of ${CIRCUITS.length} workouts`;

  document.getElementById("library-table-body").innerHTML = rows.map((c) => {
    const folder = folderById(c.folderId);
    const program = folder ? programById(folder.program) : null;
    return `
      <tr>
        <td>
          <strong>${c.title}</strong>
          ${c.variant ? `<span class="variant-pill variant-${c.variant}">${(PROGRAM_VARIANTS.find((v) => v.key === c.variant) || {}).label || c.variant}</span>` : ""}
          <br /><span class="library-sub">${[c.focus, c.difficulty].filter(Boolean).join(" · ")}</span>
        </td>
        <td>${program ? program.name : "—"}</td>
        <td>${folder ? folder.name : "—"}</td>
        <td>${(c.blocks || []).length}</td>
        <td><button class="table-action-btn" data-edit-circuit="${c.id}">Edit</button></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--deepblue);padding:24px;">No workouts match that search.</td></tr>`;

  document.querySelectorAll("#library-table-body [data-edit-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditBuilder(btn.dataset.editCircuit));
  });
}

// Every folder, grouped by the program that owns it. Active programs first in
// their Programs-page order, then archived ones, then unassigned folders —
// so the archive reads newest-and-live at the top, finished cycles below.
function libraryArchiveGroups() {
  const active = PROGRAMS.filter((p) => (p.status || "active") !== "archived");
  const archived = PROGRAMS.filter((p) => (p.status || "active") === "archived");
  const groups = [...active, ...archived].map((p) => ({
    key: p.id,
    name: p.name,
    meta: p.scheduleType === "structured" ? `Structured · ${p.durationWeeks || 8} weeks` : "On demand",
    archived: (p.status || "active") === "archived",
    program: p,
    folders: orderedFoldersForScope(p.id),
  }));

  const unassigned = FOLDERS.filter((f) => !f.program);
  if (unassigned.length) {
    groups.push({
      key: "general",
      name: "General (Unassigned)",
      meta: "Not tied to a program",
      archived: false,
      program: null,
      folders: orderedFoldersForScope("general"),
    });
  }

  return groups.filter((g) => g.folders.length);
}

function renderLibraryArchive() {
  const groups = libraryArchiveGroups();
  const folderCount = groups.reduce((n, g) => n + g.folders.length, 0);

  document.getElementById("library-count").textContent =
    `${folderCount} folder${folderCount === 1 ? "" : "s"} · ${CIRCUITS.length} workouts`;

  document.getElementById("library-archive").innerHTML = groups.map((g) => {
    const workouts = g.folders.reduce(
      (n, f) => n + CIRCUITS.filter((c) => c.folderId === f.id).length, 0
    );
    return `
      <section class="library-group ${g.archived ? "archived" : ""}">
        <div class="library-group-head">
          <div>
            <p class="eyebrow">${g.meta}</p>
            <h2>${g.name}${g.archived ? ` <span class="status-pill archived">archived</span>` : ""}</h2>
          </div>
          <div class="library-group-actions">
            <span class="library-group-count">${g.folders.length} folder${g.folders.length === 1 ? "" : "s"} · ${workouts} workout${workouts === 1 ? "" : "s"}</span>
            ${g.archived ? `<button class="btn-ghost-lg small" data-action="restore-program" data-program-id="${g.key}">Restore</button>` : ""}
          </div>
        </div>
        <div class="folder-grid">
          ${g.folders.map((f) => folderCardHtml(f, { readonly: true })).join("")}
        </div>
      </section>
    `;
  }).join("") || `<p style="color:var(--deepblue);font-weight:700;">Nothing archived yet — folders appear here as soon as a program has them.</p>`;
}

// ---------------- Settings ----------------
// Config that isn't tied to one piece of content. Only Workout Settings so
// far (2026-08-12): the per-format "Before You Start" copy, which used to be
// hardcoded in data.js with no way for staff to reword it.

const SETTINGS_BLOCK_TYPE_ORDER = ["interval", "superset", "straight", "ladder", "amrap", "emom"];

function showSettingsIndex() {
  document.getElementById("settings-index-view").style.display = "";
  document.getElementById("settings-before-you-start-view").style.display = "none";
}

function openBlockNotesSettings() {
  document.getElementById("settings-index-view").style.display = "none";
  document.getElementById("settings-before-you-start-view").style.display = "";
  document.getElementById("settings-notes-saved").style.display = "none";
  renderBlockNotesSettings();
}

function renderBlockNotesSettings() {
  document.getElementById("settings-notes-list").innerHTML = SETTINGS_BLOCK_TYPE_ORDER.map((type) => {
    const isDefault = BLOCK_FORMAT_NOTES[type] === BLOCK_FORMAT_NOTES_DEFAULTS[type];
    return `
      <div class="settings-note-card">
        <div class="settings-note-head">
          <span class="settings-note-type">${blockTypeLabel(type)}</span>
          ${isDefault
            ? `<span class="settings-note-flag">Default wording</span>`
            : `<button class="btn-ghost-lg small" data-action="reset-block-note" data-note-type="${type}">Restore default</button>`}
        </div>
        <textarea data-note-type="${type}" rows="5">${BLOCK_FORMAT_NOTES[type] || ""}</textarea>
      </div>
    `;
  }).join("");
}

function saveBlockNotesSettings() {
  const overrides = {};
  let blanks = 0;
  document.querySelectorAll("#settings-notes-list textarea[data-note-type]").forEach((ta) => {
    const type = ta.dataset.noteType;
    const text = ta.value.trim();
    // A blank note would mean members get no explainer for that format at
    // all — the very thing these are meant to guarantee. Fall back to the
    // built-in wording instead of saving nothing, and say so.
    if (!text) {
      blanks++;
      BLOCK_FORMAT_NOTES[type] = BLOCK_FORMAT_NOTES_DEFAULTS[type];
      return;
    }
    BLOCK_FORMAT_NOTES[type] = text;
    if (text !== BLOCK_FORMAT_NOTES_DEFAULTS[type]) overrides[type] = text;
  });

  localStorage.setItem(LIVE_BLOCK_NOTES_KEY, JSON.stringify(overrides));
  renderBlockNotesSettings();

  const note = document.getElementById("settings-notes-saved");
  note.textContent = blanks
    ? `✓ Saved — ${blanks} left blank, so ${blanks === 1 ? "it was" : "they were"} restored to the default wording rather than showing members nothing.`
    : "✓ Saved — members will see the updated wording.";
  note.style.display = "block";
}

function resetBlockNote(type) {
  BLOCK_FORMAT_NOTES[type] = BLOCK_FORMAT_NOTES_DEFAULTS[type];
  const stored = JSON.parse(localStorage.getItem(LIVE_BLOCK_NOTES_KEY) || "{}");
  delete stored[type];
  localStorage.setItem(LIVE_BLOCK_NOTES_KEY, JSON.stringify(stored));
  renderBlockNotesSettings();
}

// ---------------- Members ----------------

let memberStatusFilter = "all";
let editingMemberId = null;
let selectedMemberIds = new Set();

function renderMemberTable() {
  const programFilter = document.getElementById("member-program-filter").value;
  const filtered = MEMBERS.filter((m) => {
    if (memberStatusFilter !== "all" && m.status !== memberStatusFilter) return false;
    if (programFilter !== "all" && m.program !== programFilter) return false;
    return true;
  });

  document.getElementById("member-table-body").innerHTML = filtered.map((m) => {
    const program = programById(m.program);
    return `
      <tr data-action="edit-member" data-member-id="${m.id}" style="cursor:pointer;">
        <td><input type="checkbox" class="select-item-checkbox" data-action="select-member" data-member-id="${m.id}" ${selectedMemberIds.has(m.id) ? "checked" : ""} /></td>
        <td><strong>${m.name}</strong></td>
        <td>${program ? program.name : "—"}</td>
        <td><span class="status-pill ${m.status === "active" ? "active" : "draft"}">${m.status}</span></td>
        <td>${m.memberSince}</td>
        <td>${m.streak} days</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--deepblue);padding:24px;">No members match this filter.</td></tr>`;

  document.getElementById("member-select-all").checked = filtered.length > 0 && filtered.every((m) => selectedMemberIds.has(m.id));
  renderMemberBulkBar();
}

function renderMemberBulkBar() {
  const bar = document.getElementById("member-bulk-bar");
  bar.classList.toggle("visible", selectedMemberIds.size > 0);
  document.getElementById("member-bulk-count").textContent = `${selectedMemberIds.size} selected`;
}

// Staff-only field, only required when the currently-selected program is
// structured — a start date is what anchors that member's personal Day 1
// against the program's schedule template (see SCHEDULE_TEMPLATES).
function updateMemberStartDateField() {
  const program = programById(document.getElementById("member-modal-program").value);
  const isStructured = program && program.scheduleType === "structured";
  document.getElementById("member-modal-startdate-wrap").style.display = isStructured ? "" : "none";
  document.getElementById("member-modal-start-date").required = isStructured;
}

function openMemberModal() {
  editingMemberId = null;
  document.getElementById("member-modal-title").textContent = "Add Member";
  document.getElementById("member-modal-save-btn").textContent = "Save Member";
  document.getElementById("member-modal-name").value = "";
  document.getElementById("member-modal-email").value = "";
  document.getElementById("member-modal-program").value = PROGRAMS[0] ? PROGRAMS[0].id : "";
  document.getElementById("member-modal-member-since").value = "";
  document.getElementById("member-modal-badge").value = "";
  document.getElementById("member-modal-notes").value = "";
  document.getElementById("member-modal-habits").textContent = "None set";
  document.getElementById("member-modal-health-profile").innerHTML = "No health profile submitted yet.";
  document.getElementById("member-modal-start-date").value = "";
  updateMemberStartDateField();
  document.getElementById("member-modal-status").innerHTML = ["Active", "Inactive"].map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="member-modal-status-radio" value="${opt.toLowerCase()}" ${opt === "Active" ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
  document.getElementById("member-modal-overlay").classList.add("visible");
}

function openEditMemberModal(memberId) {
  const m = MEMBERS.find((x) => x.id === memberId);
  if (!m) return;
  editingMemberId = memberId;
  document.getElementById("member-modal-title").textContent = m.name;
  document.getElementById("member-modal-save-btn").textContent = "Save Changes";
  document.getElementById("member-modal-name").value = m.name;
  document.getElementById("member-modal-email").value = m.email;
  document.getElementById("member-modal-program").value = m.program;
  document.getElementById("member-modal-member-since").value = m.memberSince;
  document.getElementById("member-modal-badge").value = m.badge;
  document.getElementById("member-modal-notes").value = m.notes;
  document.getElementById("member-modal-habits").textContent = m.habits && m.habits.length ? m.habits.join(", ") : "None set";
  document.getElementById("member-modal-health-profile").innerHTML = renderHealthProfileReadout(m.id);
  document.getElementById("member-modal-start-date").value = m.startDate || "";
  updateMemberStartDateField();
  document.getElementById("member-modal-status").innerHTML = ["Active", "Inactive"].map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="member-modal-status-radio" value="${opt.toLowerCase()}" ${m.status === opt.toLowerCase() ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
  document.getElementById("member-modal-overlay").classList.add("visible");
}

function closeMemberModal() {
  document.getElementById("member-modal-overlay").classList.remove("visible");
  editingMemberId = null;
}

function saveMember() {
  const name = document.getElementById("member-modal-name").value.trim();
  if (!name) {
    alert("Enter a name for the member.");
    return;
  }
  const email = document.getElementById("member-modal-email").value.trim();
  const program = document.getElementById("member-modal-program").value;
  const memberSince = document.getElementById("member-modal-member-since").value.trim();
  const badge = document.getElementById("member-modal-badge").value.trim();
  const notes = document.getElementById("member-modal-notes").value.trim();
  const statusInput = document.querySelector("#member-modal-status input:checked");
  const status = statusInput ? statusInput.value : "active";

  const isStructured = programById(program) && programById(program).scheduleType === "structured";
  const startDateInput = document.getElementById("member-modal-start-date").value;
  if (isStructured && !startDateInput) {
    alert("This is a structured program — set a start date before saving.");
    return;
  }
  const startDate = isStructured ? startDateInput : null;

  if (editingMemberId) {
    const m = MEMBERS.find((x) => x.id === editingMemberId);
    Object.assign(m, { name, email, program, memberSince, badge, status, notes, startDate });
  } else {
    MEMBERS.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), name, email, program, streak: 0, memberSince, badge, status, notes, habits: [], startDate });
  }
  closeMemberModal();
  renderMemberTable();
}

// ---------------- Challenges ----------------

let editingChallengeId = null;
let selectedChallengeId = null;

function challengeStatus(challenge) {
  const today = dateKey(new Date());
  if (today < challenge.startDate) return "upcoming";
  if (today > challenge.endDate) return "ended";
  return "active";
}

function challengeById(id) {
  return CHALLENGES.find((c) => c.id === id);
}

// Sorted high-to-low by total points (auto challengePoints + manual adjustment).
function challengeStandings(challenge) {
  const members = MEMBERS.filter((m) => challenge.programId === "all" || m.program === challenge.programId);
  return members
    .map((m) => ({ member: m, total: (m.challengePoints || 0) + (m.pointAdjustment || 0) }))
    .sort((a, b) => b.total - a.total);
}

function renderChallenges() {
  document.getElementById("challenge-grid").innerHTML = CHALLENGES.map((c) => {
    const program = c.programId === "all" ? null : programById(c.programId);
    const status = challengeStatus(c);
    const qualifiedCount = challengeStandings(c).filter((s) => s.total >= c.thresholdPoints).length;
    return `
      <div class="program-card color-yellow">
        <div class="program-card-top">
          <h3>${c.name}</h3>
          <span class="status-pill ${status}">${status}</span>
        </div>
        <p class="desc">${program ? program.name : "All Programs"} · ${c.startDate} to ${c.endDate}</p>
        <div class="program-card-stats">
          <div><p>${c.pointsPerWorkout}</p><p>Pts / Workout</p></div>
          <div><p>${c.thresholdPoints}</p><p>Threshold</p></div>
          <div><p>${qualifiedCount}</p><p>Qualified</p></div>
        </div>
        <button class="btn-ghost-lg small" data-action="view-challenge" data-challenge-id="${c.id}">View Standings</button>
      </div>
    `;
  }).join("") || `<p style="color:var(--deepblue);">No challenges yet — create one to get started.</p>`;
}

function renderChallengeStandings() {
  const challenge = challengeById(selectedChallengeId);
  if (!challenge) return;
  const program = challenge.programId === "all" ? null : programById(challenge.programId);
  document.getElementById("challenge-detail-program").textContent = program ? program.name : "All Programs";
  document.getElementById("challenge-detail-title").textContent = challenge.name;
  document.getElementById("challenge-detail-meta").textContent =
    `${challenge.startDate} to ${challenge.endDate} · ${challenge.pointsPerWorkout} pts/workout · ${challenge.thresholdPoints} pts to qualify · ${challenge.reward}`;

  const standings = challengeStandings(challenge);
  document.getElementById("challenge-standings-body").innerHTML = standings.map((s, i) => `
    <tr>
      <td>#${i + 1}</td>
      <td><strong>${s.member.name}</strong></td>
      <td>${s.total} pts</td>
      <td><span class="status-pill ${s.total >= challenge.thresholdPoints ? "qualified" : "in-progress"}">${s.total >= challenge.thresholdPoints ? "Qualified" : "In Progress"}</span></td>
      <td>
        <button class="point-adjust-btn" data-action="adjust-points" data-member-id="${s.member.id}" data-delta="-5">−</button>
        <button class="point-adjust-btn" data-action="adjust-points" data-member-id="${s.member.id}" data-delta="5">+</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--deepblue);padding:24px;">No members in this program yet.</td></tr>`;
}

function openChallengeDetail(challengeId) {
  selectedChallengeId = challengeId;
  document.getElementById("challenge-grid-view").style.display = "none";
  document.getElementById("challenge-detail-view").style.display = "block";
  renderChallengeStandings();
}

function closeChallengeDetail() {
  selectedChallengeId = null;
  document.getElementById("challenge-detail-view").style.display = "none";
  document.getElementById("challenge-grid-view").style.display = "block";
}

function openChallengeModal() {
  editingChallengeId = null;
  document.getElementById("challenge-modal-title").textContent = "New Challenge";
  document.getElementById("challenge-modal-save-btn").textContent = "Save Challenge";
  document.getElementById("challenge-modal-name").value = "";
  document.getElementById("challenge-modal-program").value = "all";
  document.getElementById("challenge-modal-start").value = "";
  document.getElementById("challenge-modal-end").value = "";
  document.getElementById("challenge-modal-points").value = 5;
  document.getElementById("challenge-modal-threshold").value = 200;
  document.getElementById("challenge-modal-reward").value = "";
  document.getElementById("challenge-modal-overlay").classList.add("visible");
}

function openEditChallengeModal(challengeId) {
  const c = challengeById(challengeId);
  if (!c) return;
  editingChallengeId = challengeId;
  document.getElementById("challenge-modal-title").textContent = c.name;
  document.getElementById("challenge-modal-save-btn").textContent = "Save Changes";
  document.getElementById("challenge-modal-name").value = c.name;
  document.getElementById("challenge-modal-program").value = c.programId;
  document.getElementById("challenge-modal-start").value = c.startDate;
  document.getElementById("challenge-modal-end").value = c.endDate;
  document.getElementById("challenge-modal-points").value = c.pointsPerWorkout;
  document.getElementById("challenge-modal-threshold").value = c.thresholdPoints;
  document.getElementById("challenge-modal-reward").value = c.reward;
  document.getElementById("challenge-modal-overlay").classList.add("visible");
}

function closeChallengeModal() {
  document.getElementById("challenge-modal-overlay").classList.remove("visible");
  editingChallengeId = null;
}

function saveChallenge() {
  const name = document.getElementById("challenge-modal-name").value.trim();
  if (!name) {
    alert("Enter a name for the challenge.");
    return;
  }
  const programId = document.getElementById("challenge-modal-program").value;
  const startDate = document.getElementById("challenge-modal-start").value;
  const endDate = document.getElementById("challenge-modal-end").value;
  if (!startDate || !endDate) {
    alert("Set a start and end date for the challenge.");
    return;
  }
  const pointsPerWorkout = Number(document.getElementById("challenge-modal-points").value) || 5;
  const thresholdPoints = Number(document.getElementById("challenge-modal-threshold").value) || 200;
  const reward = document.getElementById("challenge-modal-reward").value.trim();

  if (editingChallengeId) {
    const c = challengeById(editingChallengeId);
    Object.assign(c, { name, programId, startDate, endDate, pointsPerWorkout, thresholdPoints, reward });
  } else {
    CHALLENGES.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), name, programId, startDate, endDate, pointsPerWorkout, thresholdPoints, reward });
  }
  closeChallengeModal();
  renderChallenges();
}

// ---------------- Community moderation ----------------

let postFilter = "all";

function renderPosts() {
  const filtered = COMMUNITY_POSTS.filter((p) => {
    if (postFilter === "flagged") return p.flagged;
    if (postFilter === "featured") return p.featured;
    return true;
  });

  document.getElementById("post-table").innerHTML = filtered.map((p) => `
    <div class="post-row ${p.flagged ? "flagged" : ""} ${p.featured ? "featured" : ""}">
      <div class="post-main">
        <p><span class="post-member">${p.member}</span> — ${p.content}</p>
        <p class="post-meta">${p.time} · ${p.likes} likes ${p.flagged ? "· 🚩 Flagged" : ""} ${p.featured ? "· ⭐ Featured" : ""}</p>
      </div>
      <div class="post-actions">
        <button class="btn-feature" data-post-action="feature" data-post-id="${p.id}">${p.featured ? "Unfeature" : "Feature"}</button>
        <button class="btn-remove" data-post-action="remove" data-post-id="${p.id}">Remove</button>
      </div>
    </div>
  `).join("") || `<p style="color:var(--deepblue);font-weight:700;">No posts match this filter.</p>`;

  document.querySelectorAll("[data-post-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.postId;
      const post = COMMUNITY_POSTS.find((p) => p.id === id);
      if (!post) return;
      if (btn.dataset.postAction === "feature") post.featured = !post.featured;
      if (btn.dataset.postAction === "remove") {
        const idx = COMMUNITY_POSTS.indexOf(post);
        COMMUNITY_POSTS.splice(idx, 1);
      }
      renderPosts();
    });
  });
}

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", () => {
  loadExerciseLibrary();

  populateProgramFilters();
  renderDashboard();
  renderPrograms();
  renderFolderGrid();
  renderPosts();
  renderAdminConversationList();

  renderExerciseLibrary();
  renderMemberTable();
  renderChallenges();

  document.getElementById("admin-login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("shell").classList.add("visible");
    showView("view-dashboard");
  });

  document.getElementById("admin-logout-btn").addEventListener("click", () => {
    document.getElementById("shell").classList.remove("visible");
    document.getElementById("admin-login").style.display = "flex";
  });

  document.querySelectorAll(".side-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
      if (btn.dataset.view === "view-library") renderLibrary();
      if (btn.dataset.view === "view-programs") renderPrograms();
      if (btn.dataset.view === "view-messages") renderAdminConversationList();
      if (btn.dataset.view === "view-challenges") closeChallengeDetail();
      if (btn.dataset.view === "view-settings") showSettingsIndex();
    });
  });

  document.querySelectorAll("#program-status-filter .filter-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      programStatusFilter = btn.dataset.programStatus;
      renderPrograms();
    });
  });

  document.getElementById("programs-back-btn").addEventListener("click", () => {
    showView("view-programs");
    renderPrograms();
  });

  document.getElementById("library-search").addEventListener("input", (e) => {
    libraryQuery = e.target.value;
    renderLibrary();
  });

  document.getElementById("settings-back-btn").addEventListener("click", showSettingsIndex);
  document.getElementById("settings-notes-save-btn").addEventListener("click", saveBlockNotesSettings);

  document.getElementById("admin-thread-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("admin-thread-input");
    sendAdminReply(input.value);
    input.value = "";
  });

  document.getElementById("new-circuit-btn").addEventListener("click", () => {
    if (!currentScope || currentScope.type !== "folder") return;
    openBuilder(currentScope.id);
  });
  document.getElementById("new-folder-btn").addEventListener("click", openFolderModal);
  document.getElementById("folder-modal-close-btn").addEventListener("click", closeFolderModal);
  document.getElementById("folder-modal-cancel-btn").addEventListener("click", closeFolderModal);
  document.getElementById("folder-modal-save-btn").addEventListener("click", saveNewFolder);
  document.getElementById("folder-back-btn").addEventListener("click", goBackFromDetail);
  document.getElementById("schedule-back-btn").addEventListener("click", () => showView("view-programs"));
  document.getElementById("folder-detail-edit-btn").addEventListener("click", () => {
    if (currentScope && currentScope.type === "folder") openEditFolderModal(currentScope.id);
  });

  document.getElementById("circuit-select-all").addEventListener("change", (e) => {
    renderCircuitVariantFilter();
  const rows = currentScopeCircuits();
    if (e.target.checked) rows.forEach((c) => selectedCircuitIds.add(c.id));
    else rows.forEach((c) => selectedCircuitIds.delete(c.id));
    renderScopeDetail();
  });

  document.getElementById("bulk-copy-btn").addEventListener("click", () => openTargetFolderModal("copy"));
  document.getElementById("bulk-move-btn").addEventListener("click", () => openTargetFolderModal("move"));
  document.getElementById("target-folder-modal-close-btn").addEventListener("click", closeTargetFolderModal);
  document.getElementById("target-folder-modal-cancel-btn").addEventListener("click", closeTargetFolderModal);
  document.getElementById("target-folder-modal-confirm-btn").addEventListener("click", confirmTargetFolderModal);

  document.getElementById("bulk-delete-btn").addEventListener("click", () => {
    if (selectedCircuitIds.size === 0) return;
    if (!confirm(`Delete ${selectedCircuitIds.size} workout(s)? This can't be undone.`)) return;
    for (let i = CIRCUITS.length - 1; i >= 0; i--) {
      if (selectedCircuitIds.has(CIRCUITS[i].id)) CIRCUITS.splice(i, 1);
    }
    selectedCircuitIds.clear();
    renderScopeDetail();
    renderFolderGrid();
    renderPrograms();
  });

  document.getElementById("new-program-btn").addEventListener("click", openProgramModal);
  document.getElementById("program-modal-close-btn").addEventListener("click", closeProgramModal);
  document.getElementById("program-modal-cancel-btn").addEventListener("click", closeProgramModal);
  document.getElementById("program-modal-save-btn").addEventListener("click", saveProgram);
  document.getElementById("builder-close-btn").addEventListener("click", closeBuilder);
  document.getElementById("builder-cancel-btn").addEventListener("click", closeBuilder);
  document.getElementById("builder-save-btn").addEventListener("click", saveCircuit);
  document.getElementById("builder-is-benchmark").addEventListener("change", (e) => {
    document.getElementById("builder-benchmark-select-wrap").style.display = e.target.checked ? "" : "none";
  });

  document.getElementById("exercise-search").addEventListener("input", renderExerciseLibrary);
  document.getElementById("new-exercise-btn").addEventListener("click", openExerciseModal);
  document.getElementById("exercise-modal-close-btn").addEventListener("click", closeExerciseModal);
  document.getElementById("exercise-modal-cancel-btn").addEventListener("click", closeExerciseModal);
  document.getElementById("exercise-modal-save-btn").addEventListener("click", saveExercise);
  document.getElementById("exercise-template-btn").addEventListener("click", downloadExerciseTemplate);
  document.getElementById("exercise-upload-btn").addEventListener("click", () => document.getElementById("exercise-upload-input").click());
  document.getElementById("exercise-upload-input").addEventListener("change", (e) => {
    if (e.target.files[0]) handleExerciseUploadFile(e.target.files[0]);
  });
  document.getElementById("exercise-upload-close-btn").addEventListener("click", closeExerciseUploadPreview);
  document.getElementById("exercise-upload-cancel-btn").addEventListener("click", closeExerciseUploadPreview);
  document.getElementById("exercise-upload-confirm-btn").addEventListener("click", confirmExerciseUpload);

  document.getElementById("exercise-filter-btn").addEventListener("click", openExerciseFilterPopup);
  document.getElementById("exercise-filter-close-btn").addEventListener("click", closeExerciseFilterPopup);
  document.getElementById("exercise-filter-clear-btn").addEventListener("click", clearExerciseFilterCheckboxes);
  document.getElementById("exercise-filter-save-btn").addEventListener("click", saveExerciseFilters);
  document.getElementById("exercise-video-admin-close-btn").addEventListener("click", closeAdminExerciseVideo);

  document.getElementById("new-member-btn").addEventListener("click", openMemberModal);
  document.getElementById("member-modal-close-btn").addEventListener("click", closeMemberModal);
  document.getElementById("member-modal-cancel-btn").addEventListener("click", closeMemberModal);
  document.getElementById("member-modal-save-btn").addEventListener("click", saveMember);
  document.getElementById("member-modal-program").addEventListener("change", updateMemberStartDateField);

  document.getElementById("new-challenge-btn").addEventListener("click", openChallengeModal);
  document.getElementById("challenge-modal-close-btn").addEventListener("click", closeChallengeModal);
  document.getElementById("challenge-modal-cancel-btn").addEventListener("click", closeChallengeModal);
  document.getElementById("challenge-modal-save-btn").addEventListener("click", saveChallenge);
  document.getElementById("challenge-back-btn").addEventListener("click", closeChallengeDetail);
  document.getElementById("challenge-edit-btn").addEventListener("click", () => {
    if (selectedChallengeId) openEditChallengeModal(selectedChallengeId);
  });
  document.getElementById("member-program-filter").addEventListener("change", renderMemberTable);
  document.getElementById("member-select-all").addEventListener("change", (e) => {
    document.querySelectorAll('[data-action="select-member"]').forEach((cb) => {
      if (e.target.checked) selectedMemberIds.add(cb.dataset.memberId);
      else selectedMemberIds.delete(cb.dataset.memberId);
    });
    renderMemberTable();
  });
  document.getElementById("member-bulk-clear-btn").addEventListener("click", () => {
    selectedMemberIds.clear();
    renderMemberTable();
  });

  document.getElementById("builder-library-search").addEventListener("input", renderBuilderLibraryList);

  document.querySelectorAll("[data-post-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      postFilter = btn.dataset.postFilter;
      document.querySelectorAll("[data-post-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderPosts();
    });
  });
});
