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

function showView(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("visible"));
  document.getElementById(viewId).classList.add("visible");
  document.querySelectorAll(".side-link").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.side-link[data-view="${viewId}"]`).classList.add("active");
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

function renderPrograms() {
  document.getElementById("program-grid").innerHTML = PROGRAMS.map((p) => {
    const isStructured = p.scheduleType === "structured";
    // Structured programs don't use the live-folder model, so a circuit
    // "belongs" to them just by living in one of their folders — not by
    // being published to a live folder, which doesn't exist for these.
    const circuitCount = isStructured
      ? CIRCUITS.filter((c) => { const f = folderById(c.folderId); return f && f.program === p.id; }).length
      : CIRCUITS.filter((c) => circuitProgramId(c) === p.id).length;
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
          <div><p>${p.circuitsPerWeek}</p><p>Per Week</p></div>
        </div>
        ${
          isStructured
            ? `<button class="btn-ghost-lg small" data-manage-schedule="${p.id}">Manage Schedule</button>`
            : `<button class="btn-ghost-lg small" data-manage-program="${p.id}">Manage Workouts</button>`
        }
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-manage-program]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openProgramDetail(btn.dataset.manageProgram);
    });
  });
  document.querySelectorAll("[data-manage-schedule]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openScheduleView(btn.dataset.manageSchedule);
    });
  });
}

const PROGRAM_CARD_COLORS = ["blue", "deepblue", "yellow", "green"];

function openProgramModal() {
  document.getElementById("program-modal-name").value = "";
  document.getElementById("program-modal-desc").value = "";
  document.getElementById("program-modal-per-week").value = 3;
  document.getElementById("program-modal-status").innerHTML = ["Draft", "Active"].map((opt) => `
    <label class="tag-checkbox">
      <input type="radio" name="program-modal-status-radio" value="${opt.toLowerCase()}" ${opt === "Draft" ? "checked" : ""} />
      ${opt}
    </label>
  `).join("");
  document.getElementById("program-modal-overlay").classList.add("visible");
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
  const circuitsPerWeek = Number(document.getElementById("program-modal-per-week").value) || 1;
  const statusInput = document.querySelector("#program-modal-status input:checked");
  const status = statusInput ? statusInput.value : "draft";
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  const color = PROGRAM_CARD_COLORS[PROGRAMS.length % PROGRAM_CARD_COLORS.length];

  // New programs created here are always "rolling" — there's no UI yet to
  // author a "structured" program's day-by-day schedule from scratch (Fit &
  // Functional's was hand-seeded in data.js); that's a future addition.
  PROGRAMS.push({ id, name, color, status, scheduleType: "rolling", memberCount: 0, circuitsPerWeek, description });

  // Every program needs its three permanent live folders to actually receive
  // published workouts — same structure as the seeded programs.
  FOLDERS.push({ id: id + "-this-week", name: "This Week's Workouts", program: id, live: true });
  FOLDERS.push({ id: id + "-stretch-core", name: "Stretch & Core Library", program: id, live: true });
  FOLDERS.push({ id: id + "-previous-week", name: "Previous Week", program: id, live: true });

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
function folderCardHtml(f) {
  const count = CIRCUITS.filter((c) => c.folderId === f.id).length;
  return `
    <div class="folder-card ${f.program ? "tagged" : ""} ${f.live ? "live" : ""}" data-action="open-folder" data-folder-id="${f.id}">
      ${f.live ? "" : `<button class="folder-delete-btn" data-action="delete-folder" data-folder-id="${f.id}" title="Delete folder">✕</button>`}
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

function renderProgramSideList() {
  const entries = [...PROGRAMS.map((p) => ({ id: p.id, name: p.name })), { id: "general", name: "General (Unassigned)" }];
  document.getElementById("program-side-list").innerHTML = entries.map((entry) => {
    const count = orderedFoldersForScope(entry.id).length;
    return `
      <button class="program-side-item ${entry.id === selectedProgramScope ? "active" : ""}" data-action="select-program-scope" data-scope-id="${entry.id}">
        <span>${entry.name}</span>
        <span class="program-side-count">${count}</span>
      </button>
    `;
  }).join("");
}

function renderFolderGrid() {
  renderProgramSideList();

  const scope = selectedProgramScope;
  const entryName = scope === "general" ? "General (Unassigned)" : (programById(scope) ? programById(scope).name : "");
  document.getElementById("folder-pane-title").textContent = entryName;

  const folders = orderedFoldersForScope(scope);
  document.getElementById("folder-grid").innerHTML = folders.map(folderCardHtml).join("")
    || `<p style="color:var(--deepblue);font-weight:700;">No folders here yet. Click "+ New Folder" to add one.</p>`;
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
  showView("view-circuits");
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
function currentScopeCircuits() {
  return CIRCUITS.filter((c) => {
    if (!currentScope) return false;
    if (currentScope.type === "folder" && c.folderId !== currentScope.id) return false;
    if (currentScope.type === "program" && circuitProgramId(c) !== currentScope.id) return false;
    return true;
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
    document.getElementById("folder-back-btn").textContent = "← All Folders";
    document.getElementById("new-circuit-btn").style.display = "";
    document.getElementById("folder-detail-edit-btn").style.display = folder.live ? "none" : "";
  }

  const rows = currentScopeCircuits();

  document.getElementById("circuit-table-body").innerHTML = rows.map((c) => {
    const folder = folderById(c.folderId);
    return `
    <tr>
      <td><input type="checkbox" class="select-item-checkbox" data-role="select-circuit" data-circuit-id="${c.id}" ${selectedCircuitIds.has(c.id) ? "checked" : ""} /></td>
      <td><strong>${c.title}</strong>${c.category !== "circuit" ? ` <span class="status-pill">${categoryLabel(c.category)}</span>` : ""}${c.isBenchmark ? ` <span class="status-pill benchmark-pill">🏆 ${benchmarkById(c.benchmarkId)?.name || "Benchmark"}</span>` : ""}<br /><span style="color:var(--deepblue);font-weight:700;font-size:11px;">${c.focus} · ${c.difficulty}</span></td>
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

function openBuilder(folderId) {
  editingCircuitId = null;
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
          notes: block.notes || "",
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
          notes: block.notes || "",
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
          notes: block.notes || "",
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
          notes: block.notes || "",
        },
      };
    case "amrap":
      return {
        type: "amrap",
        values: {
          label: block.label,
          durationMin: Math.round(block.duration / 60),
          exercises: block.exercises.map((e) => ({ name: e.name, exerciseId: exerciseIdByName(e.name), reps: e.reps })),
          notes: block.notes || "",
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
          notes: block.notes || "",
        },
      };
    default:
      return null;
  }
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

function convertBlockType(block, newType) {
  const fresh = defaultBlockValues(newType);
  fresh.notes = block.values.notes || "";
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
      <label class="builder-desc-label">Block Notes <span class="modal-field-hint">(optional — shown to members when this block starts)</span>
        <textarea data-block-index="${i}" data-field="notes" rows="2" placeholder="e.g. explain an unfamiliar format like AMRAP or EMOM">${block.values.notes || ""}</textarea>
      </label>
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
          ? { type: "interval", label: v.label, timed: true, rounds: Number(v.rounds) || 1, work: Number(v.work) || 0, rest: Number(v.rest) || 0, exercises, notes: (v.notes || "").trim() }
          : { type: "interval", label: v.label, timed: false, rounds: Number(v.rounds) || 1, rest: Number(v.rest) || 0, exercises, notes: (v.notes || "").trim() };
      }
      case "superset":
        return { type: "superset", label: v.label, rounds: Number(v.rounds) || 1, rest: Number(v.rest) || 0, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })), notes: (v.notes || "").trim() };
      case "straight":
        return { type: "straight", label: v.label, exercise: { name: v.exerciseName || "" }, sets: Number(v.sets) || 1, reps: Number(v.reps) || 0, rest: Number(v.rest) || 0, notes: (v.notes || "").trim() };
      case "ladder":
        return { type: "ladder", label: v.label, exercise: { name: v.exerciseName || "" }, scheme: String(v.scheme).split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)), rest: Number(v.rest) || 0, notes: (v.notes || "").trim() };
      case "amrap":
        return { type: "amrap", label: v.label, duration: (Number(v.durationMin) || 1) * 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })), notes: (v.notes || "").trim() };
      case "emom":
        return { type: "emom", label: v.label, duration: (Number(v.durationMin) || 1) * 60, interval: Number(v.intervalSec) || 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })), notes: (v.notes || "").trim() };
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
  syncCircuitToMemberApp(circuit);
  closeBuilder();
  renderScopeDetail();
  renderFolderGrid();
  renderPrograms();
  showView("view-circuits");
}

// ---------------- Exercise Library ----------------
// List-style master exercise page (2026-08-04, replaced the old card grid) —
// filterable by Body Part (specific muscle groups, not broad zones), Equipment,
// and Type (Strength/Cardio/Stretch). No usage-count field — Chris didn't want it.

let libraryBodyPart = "All";
let libraryEquipment = "All";
let libraryModality = "All";
let editingExerciseId = null;

function renderLibraryFilterRow(containerId, options, selected, action) {
  document.getElementById(containerId).innerHTML = ["All", ...options]
    .map((c) => `<button class="pill-filter ${c === selected ? "active" : ""}" data-action="${action}" data-cat="${c}">${c}</button>`)
    .join("");
}

function renderLibraryCategoryFilters() {
  renderLibraryFilterRow("exercise-bodypart-filters", BODY_PART_TAGS, libraryBodyPart, "library-bodypart");
  renderLibraryFilterRow("exercise-equipment-filters", EQUIPMENT_TAGS, libraryEquipment, "library-equipment");
  renderLibraryFilterRow("exercise-modality-filters", MODALITY_TAGS, libraryModality, "library-modality");
}

function renderExerciseLibrary() {
  const query = document.getElementById("exercise-search").value.trim().toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((ex) => {
    if (libraryBodyPart !== "All" && !ex.bodyParts.includes(libraryBodyPart)) return false;
    if (libraryEquipment !== "All" && !ex.equipment.includes(libraryEquipment)) return false;
    if (libraryModality !== "All" && ex.modality !== libraryModality) return false;
    if (query && !ex.name.toLowerCase().includes(query)) return false;
    return true;
  });

  document.getElementById("exercise-list").innerHTML = filtered.map((ex) => `
    <div class="exercise-list-row" data-action="edit-exercise" data-ex-id="${ex.id}">
      <p class="ex-name">${ex.name}</p>
      <div class="ex-tags">
        ${ex.bodyParts.map((bp) => `<span class="status-pill">${bp}</span>`).join("")}
        <span class="status-pill modality-${ex.modality.toLowerCase()}">${ex.modality}</span>
      </div>
      <p class="ex-equipment">${ex.equipment.length ? ex.equipment.join(", ") : "No equipment"}${ex.trackWeight ? " · Tracks weight" : ""}</p>
    </div>
  `).join("") || `<p style="color:var(--deepblue);font-weight:700;">No exercises match.</p>`;
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
  closeExerciseModal();
  renderExerciseLibrary();
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
    if (t.dataset.field !== "label" && t.dataset.field !== "notes") document.getElementById("builder-est").textContent =
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
  if (action === "select-program-scope") {
    selectedProgramScope = el.dataset.scopeId;
    renderFolderGrid();
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
  if (action === "library-bodypart") {
    libraryBodyPart = el.dataset.cat;
    renderLibraryCategoryFilters();
    renderExerciseLibrary();
  }
  if (action === "library-equipment") {
    libraryEquipment = el.dataset.cat;
    renderLibraryCategoryFilters();
    renderExerciseLibrary();
  }
  if (action === "library-modality") {
    libraryModality = el.dataset.cat;
    renderLibraryCategoryFilters();
    renderExerciseLibrary();
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
  populateProgramFilters();
  renderDashboard();
  renderPrograms();
  renderFolderGrid();
  renderPosts();
  renderAdminConversationList();

  renderLibraryCategoryFilters();
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
      if (btn.dataset.view === "view-circuits") backToFolders();
      if (btn.dataset.view === "view-messages") renderAdminConversationList();
      if (btn.dataset.view === "view-challenges") closeChallengeDetail();
    });
  });

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
