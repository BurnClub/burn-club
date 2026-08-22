// Burn Club admin prototype — in-memory state, no real backend.

// ---------------- Shared helpers (mirrors member app's block schema) ----------------

// dateKey / parseDateKey / weekStartKey / circuitAvailability now live in
// data.js — the seed data needs them to compute availability dates relative
// to today, and data.js loads first.

// ---------------- Icons (2026-08-19) ----------------
// Line icons, one colour, matching the member app's set: 24-grid, no fill,
// currentColor stroke. Replaces the emoji the admin was using, which rendered
// in whatever multicolour the OS felt like and never matched anything else on
// the page. Sized by CSS, coloured by whatever they sit inside.

const ICON_PATHS = {
  dashboard: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  programs: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  exercises: '<path d="M2 12h2M20 12h2M6 8v8M18 8v8M9 6v12M15 6v12M9 12h6"/>',
  library: '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
  members: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  groups: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="7" r="2.4"/><path d="M17 14c2.8.3 4.5 2.4 4.5 6"/>',
  challenges: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9"/><path d="M12 14v4M8 20h8"/>',
  community: '<circle cx="8" cy="9" r="3"/><circle cx="17" cy="9" r="2.6"/><path d="M2 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 14c3 0 5 1.9 5 5"/>',
  messages: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9"/><path d="M12 14v4M8 20h8"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="M15.5 10.5L21.5 7v10l-6-3.5z"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
  lock: '<rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 5h11l-1.6 3.5L16 12H5z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8-5.3-2.9-5.3 2.9 1.1-5.8L3.5 9.7l5.9-.8z"/>',
  download: '<path d="M12 4v10"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/>',
  upload: '<path d="M12 18V8"/><path d="M8 11l4-4 4 4"/><path d="M4 19h16"/>',
  pencil: '<path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4 16z"/>',
};

function icon(name, cls) {
  const paths = ICON_PATHS[name];
  if (!paths) return "";
  return `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
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
    "cardio-choice": "Cardio — Your Choice",
  }[type] || type;
}

// Holds no exercises at all — the member picks the activity at run time
// (2026-08-19). Distinct from the single-exercise types, which hold one, and
// the list types, which hold several: this one holds none, so it gets neither
// a combine checkbox nor an exercise list.
function blockIsCardioChoice(block) {
  return block.type === "cardio-choice";
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

// Which program owns a workout. Rolling programs put it on the workout
// directly; structured programs still reach it through the week folder the
// workout lives in. Note this is ownership, not visibility — for a rolling
// workout, whether members can see it is circuitAvailability()'s question.
function circuitProgramId(circuit) {
  if (circuit.programId) return circuit.programId;
  const folder = folderById(circuit.folderId);
  return folder ? folder.program : null;
}

// Rolling programs group their content by the week a workout goes live,
// derived from its date — replacing the hand-made "Week of ..." folders.
// Returns groups newest-first, with any evergreen content in its own group.
const AVAILABILITY_LABELS = {
  live: "Live now",
  "last-week": "Last week",
  scheduled: "Scheduled",
  past: "Past",
  always: "Stretch & Core",
  undated: "No date set",
};

function circuitsForProgram(programId) {
  return CIRCUITS.filter((c) => circuitProgramId(c) === programId);
}

function weekGroupsForProgram(programId) {
  const circuits = circuitsForProgram(programId);
  const byWeek = new Map();
  const always = [];
  const undated = [];

  circuits.forEach((c) => {
    const { state, weekStart } = circuitAvailability(c);
    if (state === "always") return always.push(c);
    if (state === "undated") return undated.push(c);
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, { weekStart, state, circuits: [] });
    byWeek.get(weekStart).circuits.push(c);
  });

  // Newest week first, so next week's content sits above this week's and the
  // back catalogue falls away below — the order staff actually work in.
  const weeks = [...byWeek.values()].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  const groups = weeks.map((w) => ({
    key: w.weekStart,
    kind: "week",
    name: weekLabel(w.weekStart),
    state: w.state,
    circuits: w.circuits,
  }));

  if (always.length) {
    groups.push({ key: "always", kind: "always", name: "Stretch & Core", state: "always", circuits: always });
  }
  if (undated.length) {
    groups.push({ key: "undated", kind: "undated", name: "No date set", state: "undated", circuits: undated });
  }
  return groups;
}

// Rough estimated duration for a block, in seconds — used for the auto-calculated
// circuit length shown to admins while building (not a precise simulation).
function estimateBlockSeconds(block) {
  switch (block.type) {
    case "interval":
      return block.rounds * block.exercises.length * (block.work + block.rest);
    case "superset":
      return block.rounds * (block.exercises.length * 30 + block.rest);
    case "straight":
      return block.sets * 30 + (block.sets - 1) * block.rest;
    case "ladder":
      return block.scheme.length * 20 + (block.scheme.length - 1) * block.rest;
    case "cardio-choice":
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

// ---------------- Groups (2026-08-17) ----------------
// Program groups are computed from PROGRAMS every time rather than stored, so
// they can't drift out of step with the programs or the roster. Custom groups
// carry their own member ids. Everything downstream reads groupMembers(), so
// neither kind is a special case past this point.

function programGroups() {
  return PROGRAMS.map((p) => ({
    id: "group-" + p.id,
    type: "program",
    programId: p.id,
    name: p.name,
    description: p.description,
  }));
}

function customGroups() {
  return CUSTOM_GROUPS.map((g) => ({ ...g, type: "custom" }));
}

function allGroups() {
  return [...programGroups(), ...customGroups()];
}

function groupById(id) {
  return allGroups().find((g) => g.id === id);
}

function groupMembers(group) {
  if (!group) return [];
  if (group.type === "program") return MEMBERS.filter((m) => m.program === group.programId);
  return (group.memberIds || []).map((id) => memberById(id)).filter(Boolean);
}

// The group's chat thread. Program groups already had one; custom groups get
// one created alongside them, so "Message Group" never dead-ends.
function groupConversationId(group) {
  return "group-" + (group.type === "program" ? group.programId : group.id);
}

let selectedGroupId = null;

// ---------------- Group tree (2026-08-19) ----------------
// Third section to get the workspace treatment, and the first where the tree's
// children aren't content — they're the three parts of a group page (chat,
// activity, roster), which used to stack and scroll. Splitting them into panes
// is what the tree buys here; being able to cross from one group to another
// without going back is what it buys everywhere.

const expandedGroups = new Set();

// Which pane is up beside the tree, and which part of a group it's showing.
let groupsPane = "list";
let selectedGroupSection = "chat";

const GROUP_SECTIONS = [
  { key: "chat", label: "Chat" },
  { key: "activity", label: "Activity" },
  { key: "members", label: "Members" },
];

function showGroupsPane(name) {
  groupsPane = name;
  document.getElementById("group-list-view").style.display = name === "list" ? "block" : "none";
  document.getElementById("group-detail-view").style.display = name === "detail" ? "block" : "none";
}

function showGroupSection(key) {
  selectedGroupSection = key;
  GROUP_SECTIONS.forEach((sec) => {
    const el = document.getElementById("group-section-" + sec.key);
    if (el) el.style.display = sec.key === key ? "block" : "none";
  });
}

// The count beside each section, so the tree says what's in a pane before you
// open it — an unread chat especially, which is the reason to come here at all.
function groupSectionMeta(group, key) {
  const members = groupMembers(group);
  if (key === "members") return { count: members.length };
  if (key === "chat") {
    const msgs = conversationMessages(groupConversationId(group));
    const unread = msgs.filter((m) => !m.isStaff && !m.read).length;
    return { count: msgs.length, unread };
  }
  const memberIds = new Set(members.map((m) => m.id));
  return { count: ACTIVITY_FEED.filter((a) => memberIds.has(a.memberId)).length };
}

function groupTreeNodeHtml(g) {
  const open = expandedGroups.has(g.id);
  const selected = groupsPane === "detail" && selectedGroupId === g.id;
  const unread = groupSectionMeta(g, "chat").unread;
  const children = GROUP_SECTIONS.map((sec) => {
    const meta = groupSectionMeta(g, sec.key);
    const active = selected && selectedGroupSection === sec.key;
    return `
      <div class="tree-row tree-child ${active ? "active" : ""}"
           data-action="open-group-section" data-group-id="${g.id}" data-section="${sec.key}">
        <span class="tree-name">${sec.label}</span>
        <span class="tree-count">${meta.unread ? `<span class="tree-unread-dot">${meta.unread}</span>` : meta.count}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="tree-node">
      <div class="tree-row tree-program ${selected ? "current" : ""}" data-action="open-group" data-group-id="${g.id}">
        <span class="tree-caret" data-action="group-tree-toggle" data-group-id="${g.id}">${open ? "▾" : "▸"}</span>
        <span class="tree-name">${g.name}</span>
        <span class="tree-count">${unread ? `<span class="tree-unread-dot">${unread}</span>` : groupMembers(g).length}</span>
      </div>
      ${open ? `<div class="tree-children">${children}</div>` : ""}
    </div>
  `;
}

// Program groups and custom groups are labelled apart because they behave
// differently — a program group's membership can't be edited here, it follows
// the program — and finding that out by clicking Edit and not seeing it is worse.
function renderGroupTree() {
  const host = document.getElementById("group-tree");
  if (!host) return;
  const section = (label, list) => list.length
    ? `<p class="tree-section-label">${label}</p>${list.map(groupTreeNodeHtml).join("")}` : "";
  host.innerHTML = section("Program groups", programGroups()) + section("Custom groups", customGroups())
    || `<p class="tree-empty">No groups yet</p>`;
  const all = document.querySelector("#view-groups .tree-all");
  if (all) all.classList.toggle("active", groupsPane === "list");
}

// Name and member count only (2026-08-17, Chris) — the descriptions made every
// card a paragraph and the list stopped being scannable. Plus the group's chat
// state, since the chat is now part of what a group is.
function renderGroupList() {
  renderGroupTree();
  const groups = allGroups();
  document.getElementById("group-count").textContent =
    `${groups.length} group${groups.length === 1 ? "" : "s"}`;

  document.getElementById("group-list").innerHTML = groups.map((g) => {
    const members = groupMembers(g);
    const msgs = conversationMessages(groupConversationId(g));
    const unread = msgs.filter((m) => !m.isStaff && !m.read).length;
    return `
      <div class="library-program-card" data-action="open-group" data-group-id="${g.id}">
        <div class="library-program-card-main">
          <p class="eyebrow">${g.type === "program" ? "Program group" : "Custom group"}</p>
          <h3>${g.name}</h3>
          <p class="library-program-card-count">${members.length} member${members.length === 1 ? "" : "s"}</p>
        </div>
        <span class="group-card-chat ${unread ? "has-unread" : ""}">
          <span class="group-card-chat-count">${icon("chat")} ${msgs.length}</span>
          ${unread ? `<span class="unread-row-count">${unread} new</span>` : ""}
        </span>
      </div>
    `;
  }).join("");
}

// Landing on Chat: it's the part of a group that changes without you, so it's
// the one worth seeing first.
function openGroup(groupId, section) {
  selectedGroupId = groupId;
  expandedGroups.add(groupId);
  resetGroupRosterControls();
  showGroupsPane("detail");
  showGroupSection(section || "chat");
  renderGroupDetail();
}

function backToGroups() {
  selectedGroupId = null;
  showGroupsPane("list");
  renderGroupList();
}

// Most recent thing a member did, from the activity feed. Returns null when
// they haven't shown up in it at all — which is the signal worth seeing.
function latestActivityFor(memberId) {
  return ACTIVITY_FEED.find((a) => a.memberId === memberId) || null;
}

// "Today" / "Yesterday" / "Aug 5" (2026-08-17, Chris wants the date rather
// than which workout it was). Named days for the recent end because "Today"
// answers the question faster than a date you have to compare against today's.
function activityDateLabel(dateStr) {
  if (!dateStr) return "";
  const today = dateKey(new Date());
  if (dateStr === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === dateKey(yesterday)) return "Yesterday";
  const d = parseDateKey(dateStr);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
}

// Whole days between a date and today — the "12 days ago" under the date.
function daysSince(dateStr) {
  const then = parseDateKey(dateStr);
  const now = new Date();
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86400000);
}

// Roster search/filter state. Reset whenever a different group is opened, so
// filters can't silently hide members of a group you've just arrived at.
let groupRosterQuery = "";
let groupRosterStatus = "all";
let groupRosterActivity = "all";
let groupRosterSortDesc = true;

function resetGroupRosterControls() {
  groupRosterQuery = "";
  groupRosterStatus = "all";
  groupRosterActivity = "all";
  groupRosterSortDesc = true;
  const search = document.getElementById("group-roster-search");
  if (search) search.value = "";
}

function renderGroupDetail() {
  renderGroupTree();
  const group = groupById(selectedGroupId);
  if (!group) return backToGroups();
  const members = groupMembers(group);

  document.getElementById("group-detail-title").textContent = group.name;
  document.getElementById("group-detail-badge").textContent =
    group.type === "program" ? "Program group · membership follows the program" : "Custom group · hand-picked";
  document.getElementById("group-detail-desc").textContent = group.description || "";

  // Only custom groups can be edited or deleted — a program group is a view of
  // the program, so the way to change it is to change who's on the program.
  document.getElementById("group-edit-btn").style.display = group.type === "custom" ? "" : "none";
  document.getElementById("group-delete-btn").style.display = group.type === "custom" ? "" : "none";

  const active = members.filter((m) => latestActivityFor(m.id));
  document.getElementById("group-activity-summary").textContent = members.length
    ? `${active.length} of ${members.length} member${members.length === 1 ? "" : "s"} show recent activity`
    : "No members in this group yet.";

  const memberIds = new Set(members.map((m) => m.id));
  const feed = ACTIVITY_FEED.filter((a) => memberIds.has(a.memberId));
  document.getElementById("group-activity-feed").innerHTML = feed.map((a) => `
    <div class="activity-feed-row" data-action="edit-member" data-member-id="${a.memberId}">
      <div class="activity-feed-text"><strong>${a.memberName}</strong> completed ${a.workoutTitle}</div>
      <div class="activity-feed-meta">
        <span class="activity-feed-rpe">RPE ${a.rpe}/10</span>
        <span class="activity-feed-time">${a.time}</span>
      </div>
    </div>
  `).join("") || `<p style="color:var(--deepblue);font-weight:700;">Nothing logged by this group yet.</p>`;

  renderGroupChat();
  renderGroupRoster();
}

function renderGroupRoster() {
  const group = groupById(selectedGroupId);
  if (!group) return;
  const members = groupMembers(group);

  const statusOptions = [
    { key: "all", label: `All (${members.length})` },
    { key: "active", label: `Active (${members.filter((m) => m.status === "active").length})` },
    { key: "inactive", label: `Inactive (${members.filter((m) => m.status !== "active").length})` },
  ];
  const activityOptions = [
    { key: "all", label: "Any activity" },
    { key: "recent", label: `Trained recently (${members.filter((m) => latestActivityFor(m.id)).length})` },
    { key: "quiet", label: `No recent activity (${members.filter((m) => !latestActivityFor(m.id)).length})` },
  ];
  const pills = (opts, current, action) => opts.map((o) => `
    <button class="filter-pill ${o.key === current ? "active" : ""}" data-action="${action}" data-key="${o.key}">${o.label}</button>
  `).join("");
  document.getElementById("group-roster-status").innerHTML = pills(statusOptions, groupRosterStatus, "group-roster-status");
  document.getElementById("group-roster-activity").innerHTML = pills(activityOptions, groupRosterActivity, "group-roster-activity");

  const q = groupRosterQuery.trim().toLowerCase();
  const rows = members
    .filter((m) => {
      if (groupRosterStatus === "active" && m.status !== "active") return false;
      if (groupRosterStatus === "inactive" && m.status === "active") return false;
      if (groupRosterActivity === "recent" && !latestActivityFor(m.id)) return false;
      if (groupRosterActivity === "quiet" && latestActivityFor(m.id)) return false;
      if (!q) return true;
      return `${m.name} ${m.email}`.toLowerCase().includes(q);
    })
    .sort((a, b) => (groupRosterSortDesc ? b.streak - a.streak : a.streak - b.streak));

  document.getElementById("group-roster-count").textContent = members.length
    ? `Showing ${rows.length} of ${members.length} member${members.length === 1 ? "" : "s"}`
    : "";

  document.getElementById("group-roster-body").innerHTML = rows.map((m) => {
    const last = latestActivityFor(m.id);
    return `
      <tr data-action="edit-member" data-member-id="${m.id}" style="cursor:pointer;">
        <td><strong>${m.name}</strong><br /><span class="library-sub">${m.email}</span></td>
        <td><span class="status-pill ${m.status === "active" ? "active" : "draft"}">${m.status}</span></td>
        <td>${m.streak} day${m.streak === 1 ? "" : "s"}</td>
        <td>${last
          ? `${activityDateLabel(last.date)}${daysSince(last.date) > 1 ? `<br /><span class="library-sub">${daysSince(last.date)} days ago</span>` : ""}`
          : `<span class="library-sub">No recent activity</span>`}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="4" style="text-align:center;color:var(--deepblue);padding:24px;">${members.length ? "No members match those filters." : "No members in this group yet."}</td></tr>`;
}

// ---------------- Group chat (inline) ----------------

function renderGroupChat() {
  const group = groupById(selectedGroupId);
  if (!group) return;
  const convId = groupConversationId(group);
  const msgs = conversationMessages(convId);

  // Opening the group counts as reading its chat, same as opening the thread
  // in Messages does — otherwise the unread badge never clears from here.
  msgs.forEach((m) => { if (!m.isStaff) m.read = true; });
  updateAdminUnreadBadge();

  const list = document.getElementById("group-chat-messages");
  list.innerHTML = msgs.map((m) => renderAdminMessageBubble(m, true)).join("")
    || `<p style="color:var(--deepblue);font-weight:700;">No messages yet — say something to the group.</p>`;
  list.scrollTop = list.scrollHeight;
}

function sendGroupChat(text) {
  const group = groupById(selectedGroupId);
  if (!group || !text.trim()) return;
  broadcastMessage({
    id: "msg-" + Date.now(),
    conversationId: groupConversationId(group),
    senderId: "staff",
    senderName: "Staff",
    isStaff: true,
    text: text.trim(),
    time: "Just now",
    read: true,
  });
  renderGroupChat();
  renderAdminConversationList();
}

// ---------------- Group create / edit ----------------

let editingGroupId = null;
let groupModalPicked = new Set();

function renderGroupMemberPicker() {
  document.getElementById("group-modal-picked").textContent =
    groupModalPicked.size ? `(${groupModalPicked.size} selected)` : "(none selected)";
  document.getElementById("group-modal-members").innerHTML = MEMBERS.map((m) => {
    const program = programById(m.program);
    return `
      <label class="group-member-option">
        <input type="checkbox" data-action="group-pick-member" data-member-id="${m.id}" ${groupModalPicked.has(m.id) ? "checked" : ""} />
        <span class="group-member-name">${m.name}</span>
        <span class="group-member-program">${program ? program.name : "—"}</span>
      </label>
    `;
  }).join("");
}

function openGroupModal(groupId) {
  const group = groupId ? groupById(groupId) : null;
  editingGroupId = group && group.type === "custom" ? group.id : null;
  groupModalPicked = new Set(group && group.memberIds ? group.memberIds : []);

  document.getElementById("group-modal-title").textContent = editingGroupId ? "Edit Group" : "New Group";
  document.getElementById("group-modal-save-btn").textContent = editingGroupId ? "Save Changes" : "Create Group";
  document.getElementById("group-modal-name").value = group ? group.name : "";
  document.getElementById("group-modal-desc").value = group ? group.description || "" : "";
  renderGroupMemberPicker();
  document.getElementById("group-modal-overlay").classList.add("visible");
  document.getElementById("group-modal-name").focus();
}

function closeGroupModal() {
  editingGroupId = null;
  document.getElementById("group-modal-overlay").classList.remove("visible");
}

function saveGroup() {
  const name = document.getElementById("group-modal-name").value.trim();
  if (!name) {
    alert("Give the group a name.");
    return;
  }
  const description = document.getElementById("group-modal-desc").value.trim();
  const memberIds = [...groupModalPicked];

  if (editingGroupId) {
    const g = CUSTOM_GROUPS.find((x) => x.id === editingGroupId);
    Object.assign(g, { name, description, memberIds });
    // Keep the group's chat thread named after the group.
    const conv = CONVERSATIONS.find((c) => c.id === "group-" + g.id);
    if (conv) conv.name = name + " Group Chat";
    selectedGroupId = g.id;
  } else {
    const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    CUSTOM_GROUPS.push({ id, name, description, memberIds });
    // A group with no thread would dead-end on "Message Group", so create it
    // alongside rather than lazily on first message.
    CONVERSATIONS.push({ id: "group-" + id, type: "group", groupId: id, name: name + " Group Chat" });
    selectedGroupId = id;
  }

  closeGroupModal();
  renderGroupList();
  if (document.getElementById("group-detail-view").style.display !== "none") renderGroupDetail();
}

function deleteGroup() {
  const group = groupById(selectedGroupId);
  if (!group || group.type !== "custom") return;
  const members = groupMembers(group);
  if (!confirm(`Delete "${group.name}"? Its ${members.length} member${members.length === 1 ? "" : "s"} stay on their programs — only the group goes.`)) return;

  CUSTOM_GROUPS.splice(CUSTOM_GROUPS.findIndex((g) => g.id === group.id), 1);
  const convIdx = CONVERSATIONS.findIndex((c) => c.id === "group-" + group.id);
  if (convIdx !== -1) CONVERSATIONS.splice(convIdx, 1);
  backToGroups();
}

// ---------------- Group actions ----------------

function openGroupChallengeModal() {
  const group = groupById(selectedGroupId);
  if (!group) return;
  if (!CHALLENGES.length) {
    alert("There are no challenges yet — create one in Challenges first.");
    return;
  }
  const members = groupMembers(group);
  document.getElementById("group-challenge-desc").textContent =
    `Adding ${members.length} member${members.length === 1 ? "" : "s"} from "${group.name}".`;
  document.getElementById("group-challenge-select").innerHTML = CHALLENGES
    .map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  updateGroupChallengeNote();
  document.getElementById("group-challenge-overlay").classList.add("visible");
}

// Says how many are genuinely being added — a challenge scoped to a program
// already includes that program's members, so adding its own program group
// changes nothing and should say so rather than looking like it worked.
function updateGroupChallengeNote() {
  const group = groupById(selectedGroupId);
  const challenge = challengeById(document.getElementById("group-challenge-select").value);
  const note = document.getElementById("group-challenge-note");
  if (!group || !challenge) return (note.textContent = "");
  const already = new Set(challengeStandings(challenge).map((s) => s.member.id));
  const adding = groupMembers(group).filter((m) => !already.has(m.id));
  note.textContent = adding.length
    ? `${adding.length} new member${adding.length === 1 ? "" : "s"} will join this challenge.`
    : "Everyone in this group is already in this challenge.";
}

function confirmGroupChallenge() {
  const group = groupById(selectedGroupId);
  const challenge = challengeById(document.getElementById("group-challenge-select").value);
  if (!group || !challenge) return;
  challenge.groupIds = [...new Set([...(challenge.groupIds || []), group.id])];
  document.getElementById("group-challenge-overlay").classList.remove("visible");
  renderChallenges();
}

// ---------------- Dashboard ----------------

// Conversations with something waiting on a reply, longest-waiting first —
// the one at risk of being forgotten is the one that came in first, not the
// one that just arrived.
//
// Ordering follows MESSAGES order, which is chronological. In the real system
// these carry proper timestamps and this sorts on them; the demo's `time` is a
// display string ("Mon 6:47 PM") that can't be compared, so array order stands
// in for it here.
function unreadConversations() {
  return CONVERSATIONS.map((conv) => {
    const unread = conversationMessages(conv.id).filter((m) => !m.isStaff && !m.read);
    if (!unread.length) return null;
    const first = unread[0];
    const latest = unread[unread.length - 1];
    return {
      conv,
      count: unread.length,
      // Show the newest message — it's the one you're replying to — but keep
      // the oldest for ordering, so a long thread doesn't jump the queue every
      // time someone adds to it.
      text: latest.text,
      senderName: latest.senderName,
      time: latest.time,
      order: MESSAGES.indexOf(first),
    };
  }).filter(Boolean).sort((a, b) => a.order - b.order);
}

function renderDashboardUnread() {
  const rows = unreadConversations();
  const total = rows.reduce((n, r) => n + r.count, 0);

  document.getElementById("dashboard-unread-count").textContent = total
    ? `${total} message${total === 1 ? "" : "s"} across ${rows.length} conversation${rows.length === 1 ? "" : "s"}`
    : "";

  document.getElementById("dashboard-unread-list").innerHTML = rows.map((r) => `
    <div class="unread-row" data-action="open-unread" data-conversation-id="${r.conv.id}">
      <div class="conversation-icon">${r.conv.type === "group" ? icon("community") : icon("chat")}</div>
      <div class="unread-row-text">
        <p class="unread-row-name">
          ${conversationDisplayName(r.conv)}
          ${r.conv.type === "group" ? `<span class="unread-row-sender">${r.senderName}</span>` : ""}
          ${r.count > 1 ? `<span class="unread-row-count">${r.count}</span>` : ""}
        </p>
        <p class="unread-row-preview">${r.text}</p>
      </div>
      <div class="unread-row-meta">
        <span class="conversation-time">${r.time}</span>
        <span class="unread-row-reply">Reply →</span>
      </div>
    </div>
  `).join("") || `<p class="unread-empty">✓ All caught up — nothing waiting on a reply.</p>`;
}

// Jump straight from the dashboard into the thread, already open and ready to
// type. Opening it marks it read, so the panel has to re-render after.
function openUnreadConversation(conversationId) {
  showView("view-messages");
  renderAdminConversationList();
  openAdminThread(conversationId);
  renderDashboardUnread();
  document.getElementById("admin-thread-input").focus();
}

// ---------------- Member activity chart (2026-08-17) ----------------
// Distinct members active per day for one week, filterable by program.
// Distinct members rather than total completions: someone doing two sessions
// in a day is still one member showing up, and "how many of my people trained
// on Tuesday" is the question a weekly glance is actually asking.

let activityWeekStart = null; // null until first render, then a YYYY-MM-DD Sunday
let activityProgramFilter = "all";

const ACTIVITY_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function activityPopulation(programId) {
  if (programId === "all") return PROGRAMS.reduce((n, p) => n + (p.memberCount || 0), 0);
  const p = programById(programId);
  return p ? p.memberCount || 0 : 0;
}

// Seven counts, Sunday first. Counting into a Set per day is what makes this
// "members" and not "completions".
function activityCountsForWeek(weekStart, programId) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = parseDateKey(weekStart);
    d.setDate(d.getDate() + i);
    return dateKey(d);
  });
  const byDay = days.map(() => new Set());

  MEMBER_ACTIVITY.forEach((a) => {
    if (programId !== "all" && a.programId !== programId) return;
    const idx = days.indexOf(a.date);
    if (idx !== -1) byDay[idx].add(a.memberId);
  });

  return days.map((date, i) => ({ date, count: byDay[i].size }));
}

function renderActivityChart() {
  if (!activityWeekStart) activityWeekStart = currentWeekStartKey();

  const isCurrent = activityWeekStart === currentWeekStartKey();
  document.getElementById("activity-week-label").textContent =
    `${weekLabel(activityWeekStart)}${isCurrent ? " · this week" : ""}`;
  // Can't look at a week that hasn't happened.
  document.getElementById("activity-next-week").disabled = isCurrent;
  document.getElementById("activity-this-week").disabled = isCurrent;

  const population = activityPopulation(activityProgramFilter);
  const chart = document.getElementById("activity-chart");
  const summary = document.getElementById("activity-summary");

  if (!population) {
    chart.innerHTML = "";
    summary.textContent = "No members enrolled in this program yet — nothing to chart.";
    return;
  }

  const rows = activityCountsForWeek(activityWeekStart, activityProgramFilter);
  const today = dateKey(new Date());
  // Scale against the program's membership, not the week's own peak, so bars
  // mean the same thing week to week and a quiet week actually looks quiet.
  const peak = Math.max(...rows.map((r) => r.count), 1);
  const scaleTo = Math.max(peak, Math.round(population * 0.5)) || 1;

  chart.innerHTML = rows.map((r) => {
    const future = r.date > today;
    const pct = future ? 0 : Math.round((r.count / scaleTo) * 100);
    return `
      <div class="activity-col ${r.date === today ? "is-today" : ""} ${future ? "is-future" : ""}">
        <span class="activity-col-value">${future ? "" : r.count}</span>
        <div class="activity-col-track">
          <div class="activity-col-bar" style="height:${Math.min(pct, 100)}%"></div>
        </div>
        <span class="activity-col-label">${ACTIVITY_DAY_NAMES[parseDateKey(r.date).getDay()]}</span>
      </div>
    `;
  }).join("");

  // Distinct members across the whole week — not the sum of the daily counts,
  // since most people train more than once.
  const weekly = new Set();
  const days = rows.map((r) => r.date);
  MEMBER_ACTIVITY.forEach((a) => {
    if (activityProgramFilter !== "all" && a.programId !== activityProgramFilter) return;
    if (days.includes(a.date)) weekly.add(a.memberId);
  });
  const pct = Math.round((weekly.size / population) * 100);
  const isCurrentWeek = activityWeekStart === currentWeekStartKey();
  summary.textContent =
    `${weekly.size} of ${population} member${population === 1 ? "" : "s"} active ${isCurrentWeek ? "this week" : "that week"} (${pct}%)`;
}

function renderDashboard() {
  renderDashboardUnread();
  renderActivityChart();
  document.getElementById("stat-total-members").textContent = ANALYTICS.totalMembers;
  document.getElementById("stat-active-pct").textContent = ANALYTICS.activeThisWeekPct + "%";
  document.getElementById("stat-completion-pct").textContent = ANALYTICS.avgCompletionPct + "%";
  document.getElementById("stat-avg-streak").textContent = ANALYTICS.avgStreak;

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
    const circuitCount = programWorkoutCount(p);
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

  // The tree lists the same programs, so it goes stale on exactly the same
  // events — archiving, creating, renaming, saving a workout.
  renderProgramTree();
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

// Which entry is selected in the program tree — a program id, or the literal
// string "general" for unassigned folders.
let selectedProgramScope = PROGRAMS.length ? PROGRAMS[0].id : "general";

// Which pane of the Programs workspace is showing beside the tree: every
// program as cards, one program's folders/weeks, or one folder's workouts.
// Kept separate from selectedProgramScope so that scope stays a real program
// even while the landing pane is up — renderFolderGrid() and the rolling
// builder both read it, and they can be called from a save handler at any time.
let programsPane = "landing";

const PROGRAM_PANE_IDS = { landing: "programs-landing", grid: "folder-grid-view", detail: "folder-detail-view" };

function showProgramsPane(name) {
  programsPane = name;
  Object.entries(PROGRAM_PANE_IDS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = key === name ? "block" : "none";
  });
}

function populateProgramFilters() {
  const folderModalSelect = document.getElementById("folder-modal-program");
  const memberModalSelect = document.getElementById("member-modal-program");
  const memberFilterSelect = document.getElementById("member-program-filter");
  const challengeModalSelect = document.getElementById("challenge-modal-program");
  const activityFilterSelect = document.getElementById("activity-program-filter");
  activityFilterSelect.innerHTML = `<option value="all">All Programs</option>`;
  PROGRAMS.forEach((p) => {
    folderModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    memberModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    memberFilterSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    challengeModalSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
    activityFilterSelect.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
  });
}

// Program name is deliberately left off the card — the left-side program
// list already scopes what's showing, so repeating it on every card here
// was redundant clutter (Chris's call, once workout counts started growing).
// Authoring-surface only. The Library used to render these too, in a
// read-only mode, but it now has its own week menu and workout pane
// (2026-08-15) — so there's one caller and no readonly variant.
// ---------------- Program tree (2026-08-19) ----------------
// The left column of the Programs workspace. Every program stays on screen at
// all times, so moving from one to another is one click instead of a walk back
// up through two pages. The tree holds no data of its own — its children are
// the same folders and week groups the right-hand grid draws, from the same
// two functions — so the two surfaces can't disagree about what a program
// contains or what order its weeks come in.

// Several programs can be open at once: selecting one expands it, and the
// caret collapses it again without changing what the right pane is showing.
const expandedTreePrograms = new Set();

// The count on a program's row. Structured programs don't use the live-folder
// model, so a workout belongs to one just by living in one of its folders.
function programWorkoutCount(p) {
  return p.scheduleType === "structured"
    ? CIRCUITS.filter((c) => { const f = folderById(c.folderId); return f && f.program === p.id; }).length
    : CIRCUITS.filter((c) => circuitProgramId(c) === p.id).length;
}

function treeChildHtml(label, count, attrs, active, state) {
  return `
    <div class="tree-row tree-child ${active ? "active" : ""} ${state ? `state-${state}` : ""}" ${attrs}>
      <span class="tree-name">${label}</span>
      <span class="tree-count">${count}</span>
    </div>
  `;
}

function folderTreeChildrenHtml(programId) {
  const folders = orderedFoldersForScope(programId);
  if (!folders.length) return `<p class="tree-empty">No folders yet</p>`;
  return folders.map((f) => {
    const count = CIRCUITS.filter((c) => c.folderId === f.id).length;
    const active = programsPane === "detail" && currentScope && currentScope.type === "folder" && currentScope.id === f.id;
    return treeChildHtml(f.name, count, `data-action="open-folder" data-folder-id="${f.id}"`, active, f.live ? "live" : "");
  }).join("");
}

// Same bands as the week grid, and the same collapse — a rolling program is
// one week richer every week, so a year in this is a 50-row list if the back
// catalogue isn't folded away. rollingPastCollapsed is deliberately shared
// with the grid: they're two views of one decision about what's worth showing.
function rollingTreeChildrenHtml(programId) {
  const { groups, live, upcoming, evergreen, undated, previous } = orderedWeekSections(programId);
  if (!groups.length) return `<p class="tree-empty">No workouts yet</p>`;

  const rows = (list) => list.map((g) => {
    const active = programsPane === "detail" && currentScope && currentScope.type === "week"
      && currentScope.programId === programId && currentScope.weekKey === g.key;
    return treeChildHtml(g.name, g.circuits.length,
      `data-action="open-week" data-program-id="${programId}" data-week-key="${g.key}"`, active, g.state);
  }).join("");
  const section = (label, list) => list.length ? `<p class="tree-section-label">${label}</p>${rows(list)}` : "";

  return `
    ${section("Live now", live)}
    ${section("Upcoming", upcoming)}
    ${section("Stretch & Core", evergreen)}
    ${section("Needs a date", undated)}
    ${previous.length ? `
      <div class="tree-row tree-more" data-action="toggle-past-weeks">
        <span class="tree-caret">${rollingPastCollapsed ? "▸" : "▾"}</span>
        <span class="tree-name">Previous weeks</span>
        <span class="tree-count">${previous.length}</span>
      </div>
      ${rollingPastCollapsed ? "" : rows(previous)}
    ` : ""}
  `;
}

function programTreeNodeHtml(p) {
  const open = expandedTreePrograms.has(p.id);
  const selected = programsPane !== "landing" && selectedProgramScope === p.id;
  return `
    <div class="tree-node">
      <div class="tree-row tree-program ${selected ? "current" : ""} ${selected && programsPane === "grid" ? "active" : ""}"
           data-action="tree-program" data-program-id="${p.id}">
        <span class="tree-caret" data-action="tree-toggle" data-program-id="${p.id}">${open ? "▾" : "▸"}</span>
        <span class="tree-name">${p.name}</span>
        <span class="tree-count">${programWorkoutCount(p)}</span>
      </div>
      ${open ? `<div class="tree-children">${isRollingProgram(p.id) ? rollingTreeChildrenHtml(p.id) : folderTreeChildrenHtml(p.id)}</div>` : ""}
    </div>
  `;
}

// Archived programs are deliberately absent: the Library is where those live,
// and this is the working surface (2026-08-15).
function renderProgramTree() {
  const host = document.getElementById("program-tree");
  if (!host) return;
  const programs = PROGRAMS.filter((p) => (p.status || "active") !== "archived");
  host.innerHTML = programs.map(programTreeNodeHtml).join("")
    || `<p class="tree-empty">No active programs</p>`;
  const all = document.querySelector(".tree-row.tree-all");
  if (all) all.classList.toggle("active", programsPane === "landing");
}

// The tree's top row. Selecting a program no longer replaces this page, so
// this is what gets you back to the card grid of everything.
function openAllPrograms() {
  currentScope = null;
  selectedCircuitIds.clear();
  showView("view-programs");
  showProgramsPane("landing");
  renderPrograms();
}

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

function isRollingProgram(programId) {
  const p = programById(programId);
  return !!p && p.scheduleType !== "structured";
}

const AVAILABILITY_BADGES = {
  live: "● LIVE",
  "last-week": "LAST WEEK",
  scheduled: "SCHEDULED",
  always: "ALWAYS",
  undated: "NO DATE",
};

// The rolling-program equivalent of a folder card. Deliberately the same
// `.folder-card` shape so the page reads identically to the folder grid it
// replaces — the difference is that these groups are computed from dates and
// can't be created, renamed, deleted or filed into by hand.
function weekGroupCardHtml(g, programId) {
  const count = g.circuits.length;
  const badge = AVAILABILITY_BADGES[g.state];
  return `
    <div class="folder-card tagged week-card state-${g.state}" data-action="open-week" data-program-id="${programId}" data-week-key="${g.key}">
      <div class="folder-card-top">
        <h3>${g.name}</h3>
        ${badge ? `<span class="folder-live-badge state-${g.state}">${badge}</span>` : ""}
      </div>
      <p class="folder-count">${count} workout${count === 1 ? "" : "s"}</p>
    </div>
  `;
}

function renderFolderGrid() {
  // The tree lists the same folders and weeks this grid does, so it redraws
  // here rather than at each of the ~15 call sites that mutate one.
  renderProgramTree();
  const scope = selectedProgramScope;
  const program = programById(scope);
  const entryName = scope === "general" ? "General (Unassigned)" : (program ? program.name : "");
  document.getElementById("folder-pane-title").textContent = entryName;
  document.getElementById("folder-grid-eyebrow").textContent =
    program ? (program.scheduleType === "structured" ? `Structured · ${program.durationWeeks || 8} weeks` : "On demand") : "Content";

  // Rolling programs have no folders to make, so the header offers the thing
  // you actually came here to do instead.
  const rolling = isRollingProgram(scope);
  document.getElementById("new-folder-btn").style.display = rolling ? "none" : "";
  document.getElementById("new-rolling-workout-btn").style.display = rolling ? "" : "none";

  // Rolling programs stack labelled bands, each holding its own card grid, so
  // the container itself must not be a grid — otherwise the bands become grid
  // items and sit side by side in columns.
  const grid = document.getElementById("folder-grid");
  grid.classList.toggle("week-sections", rolling);

  if (rolling) {
    grid.innerHTML = rollingWeekGridHtml(scope);
    return;
  }

  const folders = orderedFoldersForScope(scope);
  grid.innerHTML = folders.map(folderCardHtml).join("")
    || `<p style="color:var(--deepblue);font-weight:700;">No folders here yet. Click "+ New Folder" to add one.</p>`;
}

// Previous weeks start collapsed (2026-08-17, Chris's layout). This is the
// authoring surface, where the useful weeks are the live one and what's coming;
// the back catalogue has the Library, so here it only needs to be reachable.
let rollingPastCollapsed = true;

// The week grid, ordered the way the work runs: what's live, what's next, the
// evergreen shelf, anything still needing a date, then history folded away.
// Deliberately different from the Library's flat oldest-first menu — that reads
// a history, this one runs a program.
// Split a rolling program's weeks into the bands the page shows them in.
// Shared by the grid and the tree so the two can't order the same weeks
// differently or disagree about which ones are folded away.
function orderedWeekSections(programId) {
  const groups = weekGroupsForProgram(programId);
  return {
    groups,
    live: groups.filter((g) => g.state === "live"),
    // Soonest first: the next week you have to fill is the one that matters.
    upcoming: groups.filter((g) => g.state === "scheduled").sort((a, b) => (a.key < b.key ? -1 : 1)),
    evergreen: groups.filter((g) => g.state === "always"),
    undated: groups.filter((g) => g.state === "undated"),
    // "Last week" belongs here by Chris's grouping, but it's still published to
    // members, so the header says so rather than letting the collapse imply it's
    // retired. Newest first — recent history is what gets reused.
    previous: groups.filter((g) => g.state === "last-week" || g.state === "past")
      .sort((a, b) => (a.key < b.key ? 1 : -1)),
  };
}

function rollingWeekGridHtml(programId) {
  const { groups, live, upcoming, evergreen, undated, previous } = orderedWeekSections(programId);
  if (!groups.length) {
    return `<p style="color:var(--deepblue);font-weight:700;">No workouts yet. Click "+ New Workout" to add one — the date you give it decides the week it lands in.</p>`;
  }

  const cards = (list) => list.map((g) => weekGroupCardHtml(g, programId)).join("");
  const section = (label, list, hint) => list.length ? `
    <div class="week-section">
      <p class="week-section-label">${label}${hint ? ` <span class="week-section-hint">${hint}</span>` : ""}</p>
      <div class="folder-grid">${cards(list)}</div>
    </div>
  ` : "";

  const stillLive = previous.some((g) => g.state === "last-week");
  const previousWorkouts = previous.reduce((n, g) => n + g.circuits.length, 0);

  return `
    ${section("Live now", live, live.length ? "" : undefined)}
    ${section("Upcoming", upcoming)}
    ${section("Stretch & Core", evergreen)}
    ${section("Needs a date", undated, "not visible to members until dated")}
    ${previous.length ? `
      <div class="week-section">
        <button class="week-collapse-toggle ${rollingPastCollapsed ? "" : "open"}" data-action="toggle-past-weeks">
          <span class="week-collapse-caret">${rollingPastCollapsed ? "▸" : "▾"}</span>
          Previous weeks
          <span class="week-section-hint">${previous.length} week${previous.length === 1 ? "" : "s"} · ${previousWorkouts} workout${previousWorkouts === 1 ? "" : "s"}${stillLive ? " · last week still shows to members" : ""}</span>
        </button>
        ${rollingPastCollapsed ? "" : `<div class="folder-grid">${cards(previous)}</div>`}
      </div>
    ` : ""}
  `;
}

// Entry point from the Programs page — content now lives inside the program
// it belongs to rather than in a separate top-level section (2026-08-15).
// The Library used to jump in here too, which is why "back" once had to
// remember where you came from; it browses its own weeks now, so this is
// the only way in and back always means the program's own grid.
function openProgramFolders(programId) {
  selectedProgramScope = programId;
  currentScope = null;
  selectedCircuitIds.clear();
  expandedTreePrograms.add(programId);
  showView("view-programs");
  showProgramsPane("grid");
  renderFolderGrid();
}

function openFolder(folderId) {
  // Reachable straight from the tree now, including from a program other than
  // the one already open, so the scope follows the folder rather than assuming
  // you drilled in from that program's own grid.
  const folder = folderById(folderId);
  if (folder) {
    selectedProgramScope = folder.program || "general";
    expandedTreePrograms.add(selectedProgramScope);
  }
  currentScope = { type: "folder", id: folderId };
  selectedCircuitIds.clear();
  showView("view-programs");
  showProgramsPane("detail");
  renderScopeDetail();
}

// A rolling program's derived week group — the folder-detail view, scoped by
// date instead of by folder id.
function openWeek(programId, weekKey) {
  selectedProgramScope = programId;
  expandedTreePrograms.add(programId);
  currentScope = { type: "week", programId, weekKey };
  selectedCircuitIds.clear();
  showView("view-programs");
  showProgramsPane("detail");
  renderScopeDetail();
}

function backToFolders() {
  currentScope = null;
  selectedCircuitIds.clear();
  showProgramsPane("grid");
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
  selectedProgramScope = programId;
  currentScope = { type: "program", id: programId };
  selectedCircuitIds.clear();
  showView("view-programs");
  showProgramsPane("detail");
  renderScopeDetail();
}

// The detail view's back button returns to wherever makes sense for how it
// was entered: a program's circuits go back to Programs, a folder's or week's
// circuits go back to the grid they came from (or the Library).
function goBackFromDetail() {
  if (currentScope && currentScope.type === "program") {
    openAllPrograms();
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

// A week scope's membership is computed, not stored — which is the point.
// "always" and "undated" are group keys rather than dates, so they match on
// the availability state instead of on a week.
function circuitInWeekScope(circuit, scope) {
  if (circuitProgramId(circuit) !== scope.programId) return false;
  const { state, weekStart } = circuitAvailability(circuit);
  if (scope.weekKey === "always") return state === "always";
  if (scope.weekKey === "undated") return state === "undated";
  return weekStart === scope.weekKey;
}

function scopeCircuitsUnfiltered() {
  return CIRCUITS.filter((c) => {
    if (!currentScope) return false;
    if (currentScope.type === "folder" && c.folderId !== currentScope.id) return false;
    if (currentScope.type === "program" && circuitProgramId(c) !== currentScope.id) return false;
    if (currentScope.type === "week" && !circuitInWeekScope(c, currentScope)) return false;
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

// The one place a rolling workout's availability is shown as raw fact — the
// exact date it goes live, plus what that currently means.
function availabilityCellHtml(circuit) {
  const { state } = circuitAvailability(circuit);
  if (state === "always") return `<span class="avail-state state-always">Always</span>`;
  if (state === "undated") return `<span class="avail-state state-undated">No date set</span>`;
  const d = parseDateKey(circuit.availableFrom);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
    <br /><span class="avail-state state-${state}">${AVAILABILITY_LABELS[state]}</span>`;
}

function renderScopeDetail() {
  // Before the guard: the tree's counts move when workouts are added, deleted
  // or copied out of the open folder, and some of those paths return early.
  renderProgramTree();
  if (!currentScope) return;
  const isProgram = currentScope.type === "program";
  const isWeek = currentScope.type === "week";

  if (isWeek) {
    const program = programById(currentScope.programId);
    const group = weekGroupsForProgram(currentScope.programId).find((g) => g.key === currentScope.weekKey);
    const state = group ? group.state : "past";
    const title = group ? group.name : weekLabel(currentScope.weekKey);
    const stateLabel = AVAILABILITY_LABELS[state] || state;
    document.getElementById("folder-detail-title").textContent = title;
    // Same as the Library menu: Stretch & Core is named by its state, so
    // don't print the state again underneath its own name.
    document.getElementById("folder-detail-badge").textContent =
      [program ? program.name : "", stateLabel === title ? "" : stateLabel].filter(Boolean).join(" · ");
    document.getElementById("new-circuit-btn").style.display = "";
    // A week isn't a thing you can rename — its name is its date.
    document.getElementById("folder-detail-edit-btn").style.display = "none";
  } else if (isProgram) {
    const program = programById(currentScope.id);
    if (!program) return;
    document.getElementById("folder-detail-title").textContent = program.name;
    document.getElementById("folder-detail-badge").textContent = "All Workouts";
    document.getElementById("new-circuit-btn").style.display = "none";
    document.getElementById("folder-detail-edit-btn").style.display = "none";
  } else {
    const folder = folderById(currentScope.id);
    if (!folder) return;
    const program = programById(folder.program);
    document.getElementById("folder-detail-title").textContent = folder.name;
    document.getElementById("folder-detail-badge").textContent = program ? program.name : "General folder";
    document.getElementById("new-circuit-btn").style.display = "";
    document.getElementById("folder-detail-edit-btn").style.display = folder.live ? "none" : "";
  }

  renderCircuitVariantFilter();
  const rows = currentScopeCircuits();

  // Inside one folder every row would print that folder's name, which is the
   // same words the page title already says (2026-08-19). The column only earns
  // its width where the value actually varies: a week shows availability, a
  // whole program spans folders.
  const showWhere = isWeek || isProgram;
  const whereCol = document.getElementById("circuit-table-where-col");
  whereCol.style.display = showWhere ? "" : "none";
  whereCol.textContent = isWeek ? "Available" : "Folder";

  document.getElementById("circuit-table-body").innerHTML = rows.map((c) => {
    const folder = folderById(c.folderId);
    return `
    <tr>
      <td><input type="checkbox" class="select-item-checkbox" data-role="select-circuit" data-circuit-id="${c.id}" ${selectedCircuitIds.has(c.id) ? "checked" : ""} /></td>
      <td><strong>${c.title}</strong>${c.variant ? ` <span class="variant-pill variant-${c.variant}">${(PROGRAM_VARIANTS.find((v) => v.key === c.variant) || {}).label || c.variant}</span>` : ""}${c.category !== "circuit" && c.category !== "structured" ? ` <span class="status-pill">${categoryLabel(c.category)}</span>` : ""}${c.isBenchmark ? ` <span class="status-pill benchmark-pill">${icon("trophy")} ${benchmarkById(c.benchmarkId)?.name || "Benchmark"}</span>` : ""}<br /><span style="color:var(--deepblue);font-weight:700;font-size:11px;">${c.focus} · ${c.difficulty}</span></td>
      ${showWhere ? `<td>${isWeek ? availabilityCellHtml(c) : (folder ? folder.name : "—")}</td>` : ""}
      <td class="col-tight">${c.blocks.length} blocks</td>
      <td>
        <button class="table-action-btn" data-edit-circuit="${c.id}">Edit</button>
        ${isStructuredCircuit(c) ? `<button class="table-action-btn" data-duplicate-circuit="${c.id}">Duplicate</button>` : ""}
      </td>
    </tr>
  `;
  }).join("") || `<tr><td colspan="${showWhere ? 5 : 4}" style="text-align:center;color:var(--deepblue);padding:24px;">No workouts ${isProgram ? "in this program" : isWeek ? "in this week" : "in this folder"}.${isProgram ? "" : ' Click "+ New Workout" to add one.'}</td></tr>`;

  document.querySelectorAll("[data-edit-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditBuilder(btn.dataset.editCircuit));
  });
  document.querySelectorAll("[data-duplicate-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openDuplicateModal(btn.dataset.duplicateCircuit));
  });

  document.getElementById("circuit-select-all").checked = rows.length > 0 && rows.every((c) => selectedCircuitIds.has(c.id));
  renderBulkBar();
}

// ---------------- Duplicate a structured workout (2026-08-15) ----------------
// Rolling programs already duplicate through Copy to Date. Structured ones had
// no equivalent, which mattered because creating a workout there makes a single
// variant — so there was no way at all to produce a session's Home/Gym pair.

let duplicatingCircuitId = null;

function isStructuredCircuit(circuit) {
  const folder = folderById(circuit.folderId);
  const program = folder ? programById(folder.program) : null;
  return !!program && program.scheduleType === "structured";
}

// The whole point of the variant choice. Two workouts are the same scheduled
// session — one day on the calendar, shown to a combo member as a Home/Gym
// choice — precisely when they share a slotId, because SCHEDULE_TEMPLATES
// points at slots, not workout ids. So a duplicate either joins the source's
// slot (when that variant is still free) or becomes its own session.
// The source counts against its own slot here: duplicating a Home workout as
// Home would otherwise "pair" it with itself and put two Home versions on one
// scheduled day, which is the one outcome the slot model can't represent.
function duplicateJoinsSlot(source, variantKey) {
  if (!source.slotId) return false;
  return !CIRCUITS.some((c) => c.slotId === source.slotId && c.variant === variantKey);
}

function openDuplicateModal(circuitId) {
  const source = CIRCUITS.find((c) => c.id === circuitId);
  if (!source) return;
  duplicatingCircuitId = circuitId;

  // Default to the variant the source isn't — making the counterpart is the
  // reason this exists, so it should be one click away.
  const other = PROGRAM_VARIANTS.find((v) => v.key !== source.variant);
  const preselect = (other || PROGRAM_VARIANTS[0]).key;

  document.getElementById("duplicate-modal-desc").textContent = `Duplicating "${source.title}".`;
  document.getElementById("duplicate-modal-name").value = source.title;
  document.getElementById("duplicate-modal-variants").innerHTML = PROGRAM_VARIANTS.map((v) => `
    <label class="builder-availability-row">
      <input type="radio" name="duplicate-variant" value="${v.key}" ${v.key === preselect ? "checked" : ""} />
      <span>${v.label}</span>
    </label>
  `).join("");

  document.getElementById("duplicate-modal-variants")
    .querySelectorAll('input[name="duplicate-variant"]')
    .forEach((r) => r.addEventListener("change", renderDuplicateNote));

  renderDuplicateNote();
  document.getElementById("duplicate-modal-overlay").classList.add("visible");
  document.getElementById("duplicate-modal-name").focus();
}

// Says out loud which of the two things is about to happen, so pairing a
// session and making a separate one aren't distinguished by silence.
function renderDuplicateNote() {
  const source = CIRCUITS.find((c) => c.id === duplicatingCircuitId);
  if (!source) return;
  const variantKey = selectedDuplicateVariant();
  const label = (PROGRAM_VARIANTS.find((v) => v.key === variantKey) || {}).label || variantKey;
  document.getElementById("duplicate-modal-note").textContent = duplicateJoinsSlot(source, variantKey)
    ? `Saved as the ${label} version of this session — it lands on the same scheduled day, and members see it as the ${label} option.`
    : `This session already has a ${label} version, so the copy is saved as a separate workout. Add it to the schedule yourself.`;
}

function selectedDuplicateVariant() {
  const checked = document.querySelector('input[name="duplicate-variant"]:checked');
  return checked ? checked.value : PROGRAM_VARIANTS[0].key;
}

function closeDuplicateModal() {
  duplicatingCircuitId = null;
  document.getElementById("duplicate-modal-overlay").classList.remove("visible");
}

function confirmDuplicateModal() {
  const source = CIRCUITS.find((c) => c.id === duplicatingCircuitId);
  if (!source) return;
  const title = document.getElementById("duplicate-modal-name").value.trim();
  if (!title) {
    alert("Give the duplicate a name.");
    return;
  }

  const variantKey = selectedDuplicateVariant();
  const joinsSlot = duplicateJoinsSlot(source, variantKey);
  const slotId = joinsSlot ? source.slotId : `${source.slotId || source.id}-copy-${Date.now()}`;

  const copy = JSON.parse(JSON.stringify(source));
  copy.slotId = slotId;
  copy.variant = variantKey;
  copy.title = title;
  // Match the seeded id convention when the slot is free, so a paired variant
  // is named the same way the generator would have named it.
  const preferredId = `${slotId}-${variantKey}`;
  copy.id = CIRCUITS.some((c) => c.id === preferredId) ? `${preferredId}-${Date.now()}` : preferredId;

  // Sit the copy directly after its source rather than at the top of the
  // list — a pair reads as a pair.
  CIRCUITS.splice(CIRCUITS.indexOf(source) + 1, 0, copy);

  closeDuplicateModal();
  renderScopeDetail();
  renderFolderGrid();
  renderPrograms();
  renderLibrary();
}

let pendingBulkAction = null;

// In a week scope the destination is a date, not a folder — "move to next
// week" is now literally what re-dating does, and the three-step Sunday
// folder shuffle it replaces is gone.
function targetIsDate() {
  return !!currentScope && currentScope.type === "week";
}

function openTargetFolderModal(action) {
  if (selectedCircuitIds.size === 0) return;
  pendingBulkAction = action;
  const isCopy = action === "copy";
  const byDate = targetIsDate();
  const noun = byDate ? "Date" : "Folder";
  document.getElementById("target-folder-modal-title").textContent = `${isCopy ? "Copy" : "Move"} to ${noun}`;
  document.getElementById("target-folder-modal-confirm-btn").textContent = isCopy ? "Copy" : "Move";
  const count = selectedCircuitIds.size;
  document.getElementById("target-folder-modal-desc").textContent =
    `${count} workout${count === 1 ? "" : "s"} selected. Choose ${byDate ? "the date" : "where"} to ${isCopy ? "copy" : "move"} ${count === 1 ? "it" : "them"} to.`;

  document.getElementById("target-folder-modal-field").style.display = byDate ? "none" : "";
  document.getElementById("target-date-modal-field").style.display = byDate ? "" : "none";
  document.getElementById("target-date-modal-note").textContent = "";

  if (byDate) {
    // Default to the week after the one you're standing in — the overwhelmingly
    // common case is pushing content forward.
    const from = currentScope.weekKey === "always" || currentScope.weekKey === "undated"
      ? currentWeekStartKey()
      : currentScope.weekKey;
    document.getElementById("target-date-modal-input").value = shiftWeeks(from, 1);
    updateTargetDateNote();
  } else {
    const excludeId = currentScope && currentScope.type === "folder" ? currentScope.id : null;
    const select = document.getElementById("target-folder-modal-select");
    select.innerHTML = FOLDERS.filter((f) => f.id !== excludeId).map((f) => {
      const program = programById(f.program);
      return `<option value="${f.id}">${f.name} (${program ? program.name : "General"})</option>`;
    }).join("");
  }

  document.getElementById("target-folder-modal-overlay").classList.add("visible");
}

function updateTargetDateNote() {
  const value = document.getElementById("target-date-modal-input").value;
  const note = document.getElementById("target-date-modal-note");
  if (!value) {
    note.textContent = "";
    return;
  }
  const { state } = circuitAvailability({ availableFrom: value });
  note.textContent = `${weekLabel(weekStartKey(value))} · ${AVAILABILITY_LABELS[state]}`;
}

function closeTargetFolderModal() {
  document.getElementById("target-folder-modal-overlay").classList.remove("visible");
  pendingBulkAction = null;
}

function confirmTargetFolderModal() {
  if (!pendingBulkAction) return;
  const byDate = targetIsDate();
  const targetDate = document.getElementById("target-date-modal-input").value;
  const targetId = document.getElementById("target-folder-modal-select").value;
  if (byDate ? !targetDate : !targetId) return;

  // Re-dating a workout is how content moves between weeks now. Copying is
  // how you re-run an old session without erasing the record that it ran
  // back then — which is why reuse duplicates rather than re-dates.
  const applyTarget = (c) => {
    if (!byDate) {
      c.folderId = targetId;
      return;
    }
    c.availableFrom = targetDate;
    delete c.always;
  };

  if (pendingBulkAction === "copy") {
    // Snapshot the selected circuits before mutating CIRCUITS, since unshifting
    // into it mid-iteration would shift indices out from under a live forEach.
    const toCopy = CIRCUITS.filter((c) => selectedCircuitIds.has(c.id));
    toCopy.forEach((c, i) => {
      const copy = JSON.parse(JSON.stringify(c));
      copy.id = c.id + "-copy-" + Date.now() + "-" + i;
      applyTarget(copy);
      CIRCUITS.unshift(copy);
      syncCircuitToMemberApp(copy);
    });
  } else {
    CIRCUITS.forEach((c) => {
      if (!selectedCircuitIds.has(c.id)) return;
      applyTarget(c);
      syncCircuitToMemberApp(c);
    });
  }

  selectedCircuitIds.clear();
  closeTargetFolderModal();
  renderScopeDetail();
  renderFolderGrid();
  renderPrograms();
  renderLibrary();
}

function renderBulkBar() {
  const bar = document.getElementById("circuit-bulk-bar");
  bar.classList.toggle("visible", selectedCircuitIds.size > 0);
  document.getElementById("circuit-bulk-count").textContent = `${selectedCircuitIds.size} selected`;
  // The modal already renamed itself for week scopes; the buttons that open it
  // didn't, so a rolling program offered "Copy to Folder" and then asked for a
  // date. Label them for the destination that actually applies.
  const noun = targetIsDate() ? "Date" : "Folder";
  document.getElementById("bulk-copy-btn").textContent = `Copy to ${noun}`;
  document.getElementById("bulk-move-btn").textContent = `Move to ${noun}`;
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
    case "cardio-choice":
      return { label: "Cardio — Your Choice", durationMin: 15 };
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

// Set when authoring into a rolling program, which has no folder to file
// into — the workout's own date decides where it lands.
let builderProgramId = null;

// Shows the availability block and preselects nothing for a new workout;
// `preset` is the existing availability when editing, or a suggested date
// when creating inside a week group.
function setBuilderAvailability(show, preset = {}) {
  document.getElementById("builder-availability").style.display = show ? "" : "none";
  const datedRadio = document.getElementById("builder-availability-dated");
  const alwaysRadio = document.getElementById("builder-availability-always");
  const dateInput = document.getElementById("builder-available-from");
  datedRadio.checked = false;
  alwaysRadio.checked = false;
  dateInput.value = "";
  document.getElementById("builder-availability-note").textContent = "";
  if (!show) return;

  if (preset.always) {
    alwaysRadio.checked = true;
  } else if (preset.availableFrom) {
    datedRadio.checked = true;
    dateInput.value = preset.availableFrom;
  } else if (preset.suggestedDate) {
    // Entering from a week group suggests that week's date but still makes
    // you tick the radio, so the choice is always deliberate.
    dateInput.value = preset.suggestedDate;
  }
  updateBuilderAvailabilityNote();
}

// Tells you, in plain words, what the date you just picked will actually do.
function updateBuilderAvailabilityNote() {
  const note = document.getElementById("builder-availability-note");
  if (document.getElementById("builder-availability-always").checked) {
    note.textContent = "Members will always see this workout.";
    return;
  }
  const value = document.getElementById("builder-available-from").value;
  if (!value) {
    note.textContent = "";
    return;
  }
  const { state } = circuitAvailability({ availableFrom: value });
  note.textContent = {
    live: "Goes live immediately — this date is in the current week.",
    "last-week": "Shows under Last Week's Workouts, and drops off members' app next week.",
    scheduled: `Hidden from members until ${weekLabel(weekStartKey(value))} begins.`,
    past: "Already past — this won't appear in the member app, only in the Library.",
  }[state] || "";
}

// Type is no longer a field at all (2026-08-19). Chris: "Is the type field
// necessary? Are we not answering that question by selecting available from or
// stretch and core?" He's right, and keeping both was worse than redundant —
// they could disagree. An "always available" workout still typed Circuit
// matches neither isEvergreen() nor a live week in the member app, so it would
// have shown up nowhere at all.
//
// Structured programs keep their own "structured" category; everything else is
// read off the availability choice at save time.
let builderCategoryLocked = null;
let builderPreviousCategory = null;

function setBuilderCategoryField(structured, value) {
  builderCategoryLocked = structured ? (value || "structured") : null;
  builderPreviousCategory = value || null;
}

function derivedCircuitCategory(availability) {
  if (builderCategoryLocked) return builderCategoryLocked;
  if (!availability.always) return "circuit";
  // stretch vs core-burn is a split the member app never acts on — both sit in
  // STRETCH_CORE_CATEGORIES — and Chris carries the distinction in the name.
  // Preserved where it already exists so nothing silently reclassifies.
  return builderPreviousCategory === "core-burn" ? "core-burn" : "stretch";
}

function openBuilder(folderId) {
  editingCircuitId = null;
  // A brand-new workout isn't part of a variant pair yet — creating both
  // sides from scratch isn't built (see note in openEditBuilder).
  builderSlotId = null;
  builderVariantKey = null;
  builderFolderId = folderId;
  builderProgramId = null;
  const folder = folderById(folderId);
  const program = programById(folder ? folder.program : null);
  setBuilderAvailability(false);
  document.getElementById("builder-folder-label").textContent =
    `Adding to: ${folder ? folder.name : "—"}${program ? " · " + program.name : ""}`;
  document.getElementById("builder-title").value = "";
  document.getElementById("builder-tag").value = "";
  setBuilderCategoryField(!!program && program.scheduleType === "structured", null);
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

// New workout in a rolling program. There's no folder to add to — the date
// picked in the availability block is what files it.
function openRollingBuilder(programId, suggestedDate) {
  openBuilder(null);
  builderProgramId = programId;
  const program = programById(programId);
  document.getElementById("builder-folder-label").textContent =
    `Adding to: ${program ? program.name : "—"} · filed by its availability date`;
  setBuilderAvailability(true, { suggestedDate });
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
          // Anything saved as rep-based before the toggle was removed opens as
          // a timed circuit, picking up the default work window (2026-08-18).
          // Nothing in the content was ever saved that way, so this is only a
          // guard against an old bridged workout.
          timed: true,
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
  builderFolderId = circuit.folderId || null;
  builderProgramId = circuit.programId || null;
  const folder = folderById(circuit.folderId);
  const program = programById(circuitProgramId(circuit));
  document.getElementById("builder-folder-label").textContent = builderProgramId
    ? `Editing in: ${program ? program.name : "—"} · filed by its availability date`
    : `Editing in: ${folder ? folder.name : "—"}${program ? " · " + program.name : ""}`;
  // Rolling workouts carry availability; structured ones are published by
  // the schedule template, so the field would be meaningless there.
  setBuilderAvailability(!!builderProgramId, {
    always: circuit.always,
    availableFrom: circuit.availableFrom,
  });
  document.getElementById("builder-title").value = circuit.title;
  document.getElementById("builder-tag").value = circuit.tag;
  setBuilderCategoryField(isStructuredCircuit(circuit), circuit.category);
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
  if (block.type === "cardio-choice") return ["cardio-choice"];
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
    .map((b, i) => (blockHasOneExercise(b) && b.selected ? i : -1))
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

// One place decides what an exercise's video slot looks like — the library
// card, the block panel and the exercise rows all call this, so they can't
// drift apart and the hover-to-preview only has to be added once (2026-08-19).
function exerciseVideoSlotHtml(name, variantClass) {
  const ex = name ? EXERCISE_LIBRARY.find((e) => e.name === name) : null;
  const has = !!(ex && ex.videoUrl);
  const title = !name
    ? "No exercise chosen yet"
    : has ? `Video: ${name}` : `No video yet for ${name} — add one from the Exercises page`;
  return `<span class="ex-video-slot ${variantClass} ${has ? "has-video" : ""}" title="${title}">${icon(has ? "play" : "video")}</span>`;
}

// straight and ladder hold exactly one exercise, so the block gets one video
// panel down its left side. The others hold a list, so the video goes on each
// row instead — there's no single exercise for the block to show.
function blockHasOneExercise(block) {
  return block.type === "straight" || block.type === "ladder";
}

// The block label used to be a text field in the builder — Chris didn't want
// to name every block (2026-08-19). Members still see a label on every block,
// in the list and at the top of the player, so it's derived rather than
// dropped: a single-exercise block is named by its exercise, everything else
// by its format.
function derivedBlockLabel(b) {
  if (blockHasOneExercise(b)) return b.values.exerciseName || blockTypeLabel(b.type);
  return blockTypeLabel(b.type);
}

function chosenExercisePill(name, i, ei) {
  const active = isActiveSlot(i, ei) ? " active-slot" : "";
  return `<div class="chosen-exercise ${name ? "" : "empty"}${active}" data-action="choose-exercise" data-block-index="${i}" data-ex-index="${ei}">${name || "+ Choose Exercise"}</div>`;
}

// Split in two (2026-08-19). The block's own fields — rounds, rest, duration,
// and for a single-exercise block its exercise and numbers — now sit in the
// header row where the name field used to be. What's left below is the
// exercise list, which only the multi-exercise formats have. A straight set
// therefore comes to exactly one line.
function blockTopFields(block, i) {
  const v = block.values;
  const num = (label, field, value, min, cls) =>
    `<label class="inline-field ${cls || ""}">${label}<input type="number" min="${min}" value="${value}" data-block-index="${i}" data-field="${field}" /></label>`;
  const chooser = () => `
    ${exerciseVideoSlotHtml(v.exerciseName, "ex-video-row")}
    <label class="modal-field inline-grow">Exercise
      <div class="chosen-exercise-lg ${v.exerciseName ? "" : "empty"}${isActiveSlot(i, null) ? " active-slot" : ""}"
           title="${v.exerciseName || ""}" data-action="choose-exercise" data-block-index="${i}">${v.exerciseName || "+ Choose Exercise"}</div>
    </label>
  `;

  switch (block.type) {
    // Circuits are always timed (2026-08-18). The rep-based variant this
    // toggle used to offer put one exercise per screen with a rest after
    // every station — but Chris programs rep work as "all the exercises,
    // then rest", which is exactly what a Superset already does.
    case "interval":
      return num("Rounds", "rounds", v.rounds, 1) + num("Work (s)", "work", v.work, 1) + num("Rest (s)", "rest", v.rest, 0);
    case "superset":
      return num("Rounds", "rounds", v.rounds, 1) + num("Rest (s)", "rest", v.rest, 0);
    case "straight":
      return chooser() + num("Sets", "sets", v.sets, 1) + num("Reps", "reps", v.reps, 1) + num("Rest (s)", "rest", v.rest, 0);
    case "ladder":
      return chooser()
        + `<label class="inline-field wide">Rep scheme<input type="text" value="${v.scheme}" data-block-index="${i}" data-field="scheme" /></label>`
        + num("Rest (s)", "rest", v.rest, 0);
    case "cardio-choice":
      return num("Duration (min)", "durationMin", v.durationMin, 1, "wide");
    case "amrap":
      return num("Duration (min)", "durationMin", v.durationMin, 1, "wide");
    case "emom":
      return num("Duration (min)", "durationMin", v.durationMin, 1, "wide") + num("Interval (s)", "intervalSec", v.intervalSec, 10);
    default:
      return "";
  }
}

// Sits in the header beside Split, rather than on a line of its own under
// the list — that line was costing every combined block ~40px (2026-08-19).
function blockAddExerciseBtn(block, i) {
  if (blockHasOneExercise(block) || blockIsCardioChoice(block)) return "";
  const label = block.type === "interval" ? "+ Station" : "+ Exercise";
  return `<button class="btn-ghost-lg small" data-action="add-exercise" data-block-index="${i}">${label}</button>`;
}

// The exercise list, for the formats that hold more than one.
function blockExerciseList(block, i) {
  const v = block.values;
  if (blockHasOneExercise(block) || blockIsCardioChoice(block)) return "";
  const withReps = block.type !== "interval";
  return `
    <div class="builder-ex-list">
      ${v.exercises.map((e, ei) => `
        <div class="builder-ex-row">
          ${exerciseVideoSlotHtml(e.name, "ex-video-row")}
          ${chosenExercisePill(e.name, i, ei)}
          ${withReps ? `<input type="number" placeholder="Reps" value="${e.reps}" data-block-index="${i}" data-ex-index="${ei}" data-exfield="reps" />` : ""}
          <button class="remove-ex-btn" data-action="remove-exercise" data-block-index="${i}" data-ex-index="${ei}">✕</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderBuilderBlocks() {
  document.getElementById("builder-blocks").innerHTML = builderBlocks.map((block, i) => {
    const compatTypes = compatibleTypesFor(block);
    const isCombined = compatTypes.includes("superset");
    return `
    <div class="builder-block-card">
      <div class="builder-block-top">
        ${blockHasOneExercise(block) ? `<input type="checkbox" class="select-item-checkbox" data-role="select-item" data-block-index="${i}" ${block.selected ? "checked" : ""} title="Select to change its format, or check two or more to combine them" />` : ""}
        ${blockHasOneExercise(block) || blockIsCardioChoice(block) ? "" : `
          <select data-block-index="${i}" data-role="block-type">
            ${compatTypes.map((t) => `<option value="${t}" ${t === block.type ? "selected" : ""}>${blockTypeLabel(t)}</option>`).join("")}
          </select>
        `}
        ${blockIsCardioChoice(block) ? `<span class="block-static-type">${blockTypeLabel(block.type)}</span>` : ""}
        ${blockTopFields(block, i)}
        ${blockAddExerciseBtn(block, i)}
        ${isCombined ? `<button class="btn-ghost-lg small" data-action="split-block" data-block-index="${i}">Split</button>` : ""}
        <button class="remove-block-btn" data-action="remove-block" data-block-index="${i}">✕</button>
      </div>
      ${blockExerciseList(block, i)}
    </div>
  `;
  }).join("") || `<p style="color:var(--deepblue);font-weight:700;font-size:13px;">No exercises yet — click "+ Add Exercise" to start building this workout.</p>`;

  renderCombineBar();
  document.getElementById("builder-est").textContent = builderBlocks.length === 0
    ? "Estimated duration: —"
    : `Estimated duration: ~${estimateCircuitMinutes(builderBlocksToSchema())} min`;
}

// The bar is the only way to change a single-exercise block's format now
// (2026-08-19, Chris): the per-row dropdown existed almost entirely to switch
// straight sets to a rep ladder, and it cost a whole column of every row to do
// it. Selecting one block offers that swap; selecting two or more combines
// them, as before.
function renderCombineBar() {
  const bar = document.getElementById("combine-bar");
  const selected = builderBlocks.filter((b) => blockHasOneExercise(b) && b.selected);
  const single = document.getElementById("combine-bar-single");
  const multi = document.getElementById("combine-bar-actions");

  if (!selected.length) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "flex";
  const one = selected.length === 1;
  single.style.display = one ? "flex" : "none";
  multi.style.display = one ? "none" : "flex";

  if (one) {
    const isLadder = selected[0].type === "ladder";
    document.getElementById("combine-bar-count").textContent = isLadder ? "Rep ladder" : "Straight sets";
    const btn = document.getElementById("convert-single-btn");
    btn.textContent = isLadder ? "→ Straight Sets" : "→ Rep Ladder";
    btn.dataset.targetType = isLadder ? "straight" : "ladder";
  } else {
    document.getElementById("combine-bar-count").textContent = `${selected.length} selected`;
  }
}

// One selected block, swapped in place between the two single-exercise
// formats. Keeps the exercise; the scheme and rest come from the new type's
// defaults, which is the same thing the dropdown did.
function convertSelectedSingle(targetType) {
  const i = builderBlocks.findIndex((b) => blockHasOneExercise(b) && b.selected);
  if (i === -1) return;
  const converted = convertBlockType(builderBlocks[i], targetType);
  converted.selected = true;
  builderBlocks[i] = converted;
  renderBuilderBlocks();
}

function builderBlocksToSchema() {
  return builderBlocks.map((b) => {
    const v = b.values;
    switch (b.type) {
      case "interval": {
        const exercises = v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name }));
        return { type: "interval", label: derivedBlockLabel(b), timed: true, rounds: Number(v.rounds) || 1, work: Number(v.work) || 0, rest: Number(v.rest) || 0, exercises };
      }
      case "superset":
        return { type: "superset", label: derivedBlockLabel(b), rounds: Number(v.rounds) || 1, rest: Number(v.rest) || 0, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
      case "straight":
        return { type: "straight", label: derivedBlockLabel(b), exercise: { name: v.exerciseName || "" }, sets: Number(v.sets) || 1, reps: Number(v.reps) || 0, rest: Number(v.rest) || 0 };
      case "ladder":
        return { type: "ladder", label: derivedBlockLabel(b), exercise: { name: v.exerciseName || "" }, scheme: String(v.scheme).split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)), rest: Number(v.rest) || 0 };
      case "cardio-choice":
        return { type: "cardio-choice", label: derivedBlockLabel(b), duration: (Number(v.durationMin) || 1) * 60 };
      case "amrap":
        return { type: "amrap", label: derivedBlockLabel(b), duration: (Number(v.durationMin) || 1) * 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
      case "emom":
        return { type: "emom", label: derivedBlockLabel(b), duration: (Number(v.durationMin) || 1) * 60, interval: Number(v.intervalSec) || 60, exercises: v.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name, reps: Number(e.reps) || 0 })) };
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

// Push a workout across the localStorage bridge to the member app.
//
// This used to only send workouts sitting in a `live: true` folder — and,
// because it was called from saveCircuit() alone and never from the bulk
// Copy/Move that staff actually publish with, the real publish action never
// reached members at all. Dated availability removes the question: a rolling
// workout is sent with its date attached and the member app decides for
// itself, each time it loads, whether that date makes it this week's, last
// week's, or neither. Nothing needs to be re-pushed when the week turns.
function syncCircuitToMemberApp(circuit) {
  const programId = circuitProgramId(circuit);
  const program = programById(programId);
  // Structured programs publish through SCHEDULE_TEMPLATES, not this bridge.
  if (!program || program.scheduleType === "structured") return;
  if (!circuit.always && !circuit.availableFrom) return;

  const memberCircuit = {
    id: circuit.id,
    programId,
    category: circuit.category,
    always: circuit.always || undefined,
    availableFrom: circuit.availableFrom || undefined,
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

// Drop a workout from the bridge — used when its date changes such that the
// stored copy would be stale, and when it's deleted outright.
function unsyncCircuitFromMemberApp(circuitId) {
  const stored = JSON.parse(localStorage.getItem(LIVE_CIRCUITS_KEY) || "[]");
  localStorage.setItem(LIVE_CIRCUITS_KEY, JSON.stringify(stored.filter((c) => c.id !== circuitId)));
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

  // Rolling workouts must say when they're available before they can be
  // saved. Blocking here rather than defaulting is the whole point: an
  // unanswered availability question used to mean "sitting in a library
  // folder, invisible", which was at least explicit. A silent default would
  // either publish something nobody meant to publish, or hide something
  // nobody meant to hide.
  let availability = {};
  if (builderProgramId) {
    const alwaysChecked = document.getElementById("builder-availability-always").checked;
    const datedChecked = document.getElementById("builder-availability-dated").checked;
    const fromDate = document.getElementById("builder-available-from").value;
    if (!alwaysChecked && !datedChecked) {
      alert("Choose when this workout is available — pick a date, or file it under Stretch & Core.");
      return;
    }
    if (datedChecked && !fromDate) {
      alert("Pick the date this workout becomes available.");
      return;
    }
    availability = alwaysChecked ? { always: true } : { availableFrom: fromDate };
  }

  const circuit = {
    id: editingCircuitId || (title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now()),
    slotId: builderSlotId,
    variant: builderVariantKey,
    folderId: builderFolderId,
    programId: builderProgramId,
    ...availability,
    category: derivedCircuitCategory(availability),
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
  // Saving used to jump to the Programs workspace no matter where the builder
  // was opened from, which meant editing an archived workout dropped you out
  // of the Library and lost your place in it. Only go there if that's where
  // you were (2026-08-19).
  if (document.getElementById("view-programs").classList.contains("visible")) {
    showView("view-programs");
  }
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

// Collapsed by default (2026-08-19). The pills are still the same pills —
// they just don't hold a quarter of the sidebar open when nothing is filtered.
let builderFiltersOpen = false;

function renderBuilderLibraryFilters() {
  const cats = ["All", ...BODY_PART_TAGS];
  document.getElementById("builder-library-filters").innerHTML = cats
    .map((c) => `<button class="pill-filter ${c === builderLibraryCategory ? "active" : ""}" data-action="builder-library-category" data-cat="${c}">${c}</button>`)
    .join("");
  document.getElementById("builder-library-filters").style.display = builderFiltersOpen ? "" : "none";

  // The badge is what makes hiding them safe — an active filter has to stay
  // visible, or an empty-looking list reads as a missing exercise.
  const badge = document.getElementById("builder-filter-count");
  const filtered = builderLibraryCategory !== "All";
  badge.style.display = filtered ? "" : "none";
  badge.textContent = filtered ? builderLibraryCategory : "";
  document.getElementById("builder-filter-btn").classList.toggle("active", builderFiltersOpen || filtered);
}

function toggleBuilderFilters() {
  builderFiltersOpen = !builderFiltersOpen;
  renderBuilderLibraryFilters();
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

  // Three to a row, each a near-full-width thumbnail with the name underneath
  // (2026-08-19). Body-part tags are deliberately not on the card — they're
  // what the Filters button is for, and on a card this size they competed with
  // the one thing you're scanning for. The frame's videoUrl decides which state
  // it shows, and it's sized and placed for the hover-to-preview Chris wants
  // next, so adding that is a behaviour change rather than a layout one.
  let html = filtered.map((ex) => `
    <div class="builder-library-card" data-action="library-pick-exercise" data-ex-id="${ex.id}">
      ${exerciseVideoSlotHtml(ex.name, "ex-video-card")}
      <span class="ex-card-name">${ex.name}</span>
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

  if (action === "add-cardio-block") {
    builderBlocks.push({ type: "cardio-choice", values: defaultBlockValues("cardio-choice") });
    renderBuilderBlocks();
  }
  if (action === "add-new-item") {
    builderActiveSlot = null;
    renderBuilderLibraryList();
    document.getElementById("builder-library-search").focus();
  }
  if (action === "open-folder") {
    openFolder(el.dataset.folderId);
  }
  if (action === "open-week") {
    openWeek(el.dataset.programId, el.dataset.weekKey);
  }
  if (action === "toggle-past-weeks") {
    rollingPastCollapsed = !rollingPastCollapsed;
    renderFolderGrid();
    renderProgramTree();
  }
  if (action === "tree-all") {
    openAllPrograms();
  }
  if (action === "tree-program") {
    openProgramFolders(el.dataset.programId);
  }
  // Collapsing a program is only about the tree — it deliberately doesn't
  // change what the right pane is showing, so you can fold away a program
  // you're still working inside.
  if (action === "tree-toggle") {
    const id = el.dataset.programId;
    if (expandedTreePrograms.has(id)) expandedTreePrograms.delete(id);
    else expandedTreePrograms.add(id);
    renderProgramTree();
  }
  if (action === "open-library-program") {
    openLibraryProgram(el.dataset.programId);
  }
  // Reachable from any program's node in the tree, not just the open one.
  if (action === "open-library-shelf") {
    clearLibrarySearch();
    const programId = el.dataset.programId;
    if (programId && programId !== libraryProgramId) {
      libraryProgramId = programId;
      expandedLibraryPrograms.add(programId);
    }
    librarySelectedShelf = el.dataset.shelfKey;
    libraryVariantFilter = "all";
    renderLibrary();
  }
  if (action === "library-tree-all") {
    backToLibraryPrograms();
  }
  if (action === "library-tree-toggle") {
    const id = el.dataset.programId;
    if (expandedLibraryPrograms.has(id)) expandedLibraryPrograms.delete(id);
    else expandedLibraryPrograms.add(id);
    renderLibraryTree();
  }
  if (action === "library-variant") {
    libraryVariantFilter = el.dataset.variant;
    renderLibraryShelfPane();
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
  if (action === "open-unread") {
    openUnreadConversation(el.dataset.conversationId);
  }
  if (action === "group-tree-all") {
    backToGroups();
  }
  if (action === "group-tree-toggle") {
    const id = el.dataset.groupId;
    if (expandedGroups.has(id)) expandedGroups.delete(id);
    else expandedGroups.add(id);
    renderGroupTree();
  }
  if (action === "open-group-section") {
    openGroup(el.dataset.groupId, el.dataset.section);
  }
  if (action === "open-group") {
    openGroup(el.dataset.groupId);
  }
  if (action === "group-roster-status") {
    groupRosterStatus = el.dataset.key;
    renderGroupRoster();
  }
  if (action === "group-roster-activity") {
    groupRosterActivity = el.dataset.key;
    renderGroupRoster();
  }
  if (action === "group-sort") {
    groupRosterSortDesc = !groupRosterSortDesc;
    renderGroupRoster();
  }
  if (action === "group-pick-member") {
    if (el.checked) groupModalPicked.add(el.dataset.memberId);
    else groupModalPicked.delete(el.dataset.memberId);
    document.getElementById("group-modal-picked").textContent =
      groupModalPicked.size ? `(${groupModalPicked.size} selected)` : "(none selected)";
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
  if (action === "convert-single") {
    convertSelectedSingle(el.dataset.targetType);
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
    builderFiltersOpen = false;
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
        <div class="conversation-icon">${conv.type === "group" ? icon("community") : icon("chat")}</div>
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
  renderDashboardUnread();
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
// null = the default screen (programs only). Set = drilled into one program.
let libraryProgramId = null;
let librarySelectedShelf = null;
// Deliberately its own state, separate from the authoring surface's
// circuitVariantFilter: browsing an archive starts by showing everything,
// whereas authoring starts scoped to one variant (Chris's call, 2026-08-15).
let libraryVariantFilter = "all";


// ---------------- Library tree (2026-08-19) ----------------
// Same idea as the Programs tree, one level shallower in effort because
// libraryProgramEntries() already flattens both program shapes into "a list of
// shelves" — a structured program's folders and a rolling program's weeks
// arrive here as the same thing, so the tree doesn't have to know which is
// which. Archived programs are included: the archive is where they live.

const expandedLibraryPrograms = new Set();

function libraryTreeNodeHtml(entry) {
  const open = expandedLibraryPrograms.has(entry.key);
  const selected = libraryProgramId === entry.key && !libraryQuery.trim();
  const workouts = entry.shelves.reduce((n, sh) => n + sh.circuits.length, 0);
  const children = entry.shelves.map((sh) => {
    const active = selected && librarySelectedShelf === sh.key;
    return `
      <div class="tree-row tree-child ${active ? "active" : ""} ${sh.state ? `state-${sh.state}` : ""}"
           data-action="open-library-shelf" data-program-id="${entry.key}" data-shelf-key="${sh.key}">
        <span class="tree-name">${sh.name}</span>
        <span class="tree-count">${sh.circuits.length}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="tree-node">
      <div class="tree-row tree-program ${selected ? "current" : ""} ${entry.archived ? "archived" : ""}"
           data-action="open-library-program" data-program-id="${entry.key}">
        <span class="tree-caret" data-action="library-tree-toggle" data-program-id="${entry.key}">${open ? "▾" : "▸"}</span>
        <span class="tree-name">${entry.name}</span>
        <span class="tree-count">${workouts}</span>
      </div>
      ${open ? `<div class="tree-children">${children || `<p class="tree-empty">Empty</p>`}</div>` : ""}
    </div>
  `;
}

function renderLibraryTree() {
  const host = document.getElementById("library-tree");
  if (!host) return;
  const entries = libraryProgramEntries();
  host.innerHTML = entries.map(libraryTreeNodeHtml).join("")
    || `<p class="tree-empty">Nothing archived yet</p>`;
  const all = document.querySelector("#view-library .tree-all");
  if (all) all.classList.toggle("active", libraryProgramId === null && !libraryQuery.trim());
}

// Selecting anything in the tree while a search is running would otherwise
// land you on results rather than the shelf you clicked — the search box wins
// over the drill-down by design, so clear it.
function clearLibrarySearch() {
  if (!libraryQuery) return;
  libraryQuery = "";
  const input = document.getElementById("library-search");
  if (input) input.value = "";
}

function renderLibrary() {
  renderLibraryTree();
  const q = libraryQuery.trim().toLowerCase();
  const searching = q.length > 0;
  const browsing = !searching && libraryProgramId !== null;

  document.getElementById("library-programs").style.display = searching || browsing ? "none" : "";
  document.getElementById("library-browser").style.display = browsing ? "" : "none";
  document.getElementById("library-results").style.display = searching ? "" : "none";

  if (browsing) return renderLibraryBrowser();
  if (!searching) return renderLibraryPrograms();

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

// A program's shelves, normalized so the browser doesn't care which shape it
// is looking at. Structured programs are shelved in folders, rolling programs
// in weeks derived from their workouts' dates — from the archive's point of
// view both are the same thing: a labelled bundle of workouts.
//
// Ordered low → high (oldest week first, Week 1 before Week 8) per Chris's
// spec. That's the opposite of the authoring surface, where newest-first is
// right because you work on what's next; here you're reading a history.
function libraryShelvesFor(programId) {
  const program = programById(programId);

  if (program && program.scheduleType !== "structured") {
    const groups = weekGroupsForProgram(programId);
    const weeks = groups.filter((g) => g.kind === "week").sort((a, b) => (a.key < b.key ? -1 : 1));
    const evergreen = groups.filter((g) => g.kind !== "week");
    return [...weeks, ...evergreen].map((g) => {
      // A week is named by its date and described by its state ("Week of Aug
      // 16" / "Live now"). Stretch & Core is named by its state, so the two
      // would read as the same words twice.
      const label = AVAILABILITY_LABELS[g.state] || "";
      return {
        key: g.key,
        name: g.name,
        meta: label === g.name ? "" : label,
        state: g.state,
        circuits: g.circuits,
      };
    });
  }

  const folders = programId === "general"
    ? FOLDERS.filter((f) => !f.program)
    : FOLDERS.filter((f) => f.program === programId);
  return folders.map((f) => ({
    key: f.id,
    name: f.name,
    meta: f.live ? "Live" : "",
    state: f.live ? "live" : "",
    circuits: CIRCUITS.filter((c) => c.folderId === f.id),
  }));
}

function libraryProgramEntries() {
  const active = PROGRAMS.filter((p) => (p.status || "active") !== "archived");
  const archived = PROGRAMS.filter((p) => (p.status || "active") === "archived");
  const entries = [...active, ...archived].map((p) => ({
    key: p.id,
    name: p.name,
    meta: p.scheduleType === "structured" ? `Structured · ${p.durationWeeks || 8} weeks` : "On demand",
    archived: (p.status || "active") === "archived",
    shelves: libraryShelvesFor(p.id),
  }));

  if (FOLDERS.some((f) => !f.program)) {
    entries.push({
      key: "general",
      name: "General (Unassigned)",
      meta: "Not tied to a program",
      archived: false,
      shelves: libraryShelvesFor("general"),
    });
  }

  return entries.filter((e) => e.shelves.length);
}

// Level 1 — the default screen. Programs only, nothing else, because this is
// the one list that stays short: it grows by one every couple of months,
// where weeks grow by one a week and workouts by two hundred a cycle.
function renderLibraryPrograms() {
  const entries = libraryProgramEntries();

  document.getElementById("library-count").textContent =
    `${entries.length} program${entries.length === 1 ? "" : "s"} · ${CIRCUITS.length} workouts`;

  document.getElementById("library-programs").innerHTML = entries.map((e) => {
    const workouts = e.shelves.reduce((n, s) => n + s.circuits.length, 0);
    const unit = programById(e.key) && programById(e.key).scheduleType !== "structured" ? "week" : "folder";
    return `
      <div class="library-program-card ${e.archived ? "archived" : ""}" data-action="open-library-program" data-program-id="${e.key}">
        <div class="library-program-card-main">
          <p class="eyebrow">${e.meta}</p>
          <h3>${e.name}${e.archived ? ` <span class="status-pill archived">archived</span>` : ""}</h3>
          <p class="library-program-card-count">${e.shelves.length} ${unit}${e.shelves.length === 1 ? "" : "s"} · ${workouts} workout${workouts === 1 ? "" : "s"}</p>
        </div>
        ${e.archived ? `<button class="btn-ghost-lg small" data-action="restore-program" data-program-id="${e.key}">Restore</button>` : ""}
      </div>
    `;
  }).join("") || `<p style="color:var(--deepblue);font-weight:700;">Nothing here yet — programs appear as soon as they have content.</p>`;
}

function openLibraryProgram(programId) {
  clearLibrarySearch();
  libraryProgramId = programId;
  libraryVariantFilter = "all";
  librarySelectedShelf = defaultLibraryShelf(programId);
  expandedLibraryPrograms.add(programId);
  renderLibrary();
}

// The menu reads oldest-first, but landing on the oldest week would mean
// opening Burn Club to a week from last August once the archive has a year
// in it. Start on what's live instead, and fall back to the first shelf for
// structured programs, which have no live week.
function defaultLibraryShelf(programId) {
  const shelves = libraryShelvesFor(programId);
  if (!shelves.length) return null;
  const live = shelves.find((s) => s.state === "live");
  return (live || shelves[0]).key;
}

function backToLibraryPrograms() {
  clearLibrarySearch();
  libraryProgramId = null;
  librarySelectedShelf = null;
  renderLibrary();
}

// Levels 2 and 3 — the week menu on the left, the selected week's workouts on
// the right. Only one week's worth of rows is ever in the DOM.
function renderLibraryBrowser() {
  const entry = libraryProgramEntries().find((e) => e.key === libraryProgramId);
  if (!entry) return backToLibraryPrograms();

  const shelves = entry.shelves;
  if (!shelves.some((s) => s.key === librarySelectedShelf)) {
    librarySelectedShelf = defaultLibraryShelf(libraryProgramId);
  }
  const workouts = shelves.reduce((n, s) => n + s.circuits.length, 0);

  document.getElementById("library-browser-eyebrow").textContent = entry.meta;
  document.getElementById("library-browser-title").textContent = entry.name;
  const program = programById(libraryProgramId);
  const unit = program && program.scheduleType !== "structured" ? "week" : "folder";
  document.getElementById("library-browser-count").textContent =
    `${shelves.length} ${unit}${shelves.length === 1 ? "" : "s"} · ${workouts} workout${workouts === 1 ? "" : "s"}`;
  document.getElementById("library-count").textContent =
    `${entry.name} · ${workouts} workout${workouts === 1 ? "" : "s"}`;

  renderLibraryShelfPane();
}

function renderLibraryShelfPane() {
  const pane = document.getElementById("library-shelf-pane");
  const shelf = libraryShelvesFor(libraryProgramId).find((s) => s.key === librarySelectedShelf);
  if (!shelf) {
    pane.innerHTML = `<p class="library-shelf-empty">Nothing here yet.</p>`;
    return;
  }

  // The toggle only earns its space when the shelf actually holds variants —
  // Burn Club has none, so showing Home/Gym there would be three dead pills.
  const hasVariants = shelf.circuits.some((c) => c.variant);
  if (!hasVariants) libraryVariantFilter = "all";

  const counts = {};
  shelf.circuits.forEach((c) => { if (c.variant) counts[c.variant] = (counts[c.variant] || 0) + 1; });
  const options = [
    { key: "all", label: `Show All (${shelf.circuits.length})` },
    ...PROGRAM_VARIANTS.map((v) => ({ key: v.key, label: `${v.label} (${counts[v.key] || 0})` })),
  ];

  const rows = libraryVariantFilter === "all"
    ? shelf.circuits
    : shelf.circuits.filter((c) => c.variant === libraryVariantFilter);

  pane.innerHTML = `
    <div class="library-shelf-head">
      <div>
        <p class="eyebrow">${shelf.meta || "Workouts"}</p>
        <h2>${shelf.name}</h2>
      </div>
      ${hasVariants ? `<div class="filter-pill-row">${options.map((o) => `
        <button class="filter-pill ${o.key === libraryVariantFilter ? "active" : ""}"
                data-action="library-variant" data-variant="${o.key}">${o.label}</button>
      `).join("")}</div>` : ""}
    </div>
    <div class="table-card">
      <table class="admin-table">
        <thead><tr><th>Workout</th><th>Blocks</th><th></th></tr></thead>
        <tbody>
          ${rows.map((c) => `
            <tr>
              <td>
                <strong>${c.title}</strong>
                ${c.variant ? `<span class="variant-pill variant-${c.variant}">${(PROGRAM_VARIANTS.find((v) => v.key === c.variant) || {}).label || c.variant}</span>` : ""}
                <br /><span class="library-sub">${[c.focus, c.difficulty].filter(Boolean).join(" · ")}</span>
              </td>
              <td>${(c.blocks || []).length}</td>
              <td><button class="table-action-btn" data-edit-circuit="${c.id}">Edit</button></td>
            </tr>
          `).join("") || `<tr><td colspan="3" style="text-align:center;color:var(--deepblue);padding:24px;">No ${libraryVariantFilter} workouts in ${shelf.name}.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  pane.querySelectorAll("[data-edit-circuit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditBuilder(btn.dataset.editCircuit));
  });
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

const MEMBER_ACCESS_LABELS = { home: "Home", gym: "Gym", both: "Combo" };

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
        <td>
          ${program ? program.name : "—"}
          ${m.access && programHasVariants(m.program) ? ` <span class="variant-pill variant-${m.access === "both" ? "combo" : m.access}">${MEMBER_ACCESS_LABELS[m.access] || m.access}</span>` : ""}
        </td>
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

// Whether a program is authored in variants is a property of its content, not
// a flag on the program — so ask the content. Burn Club has no variants, so
// the access question never appears for it.
function programHasVariants(programId) {
  return CIRCUITS.some((c) => c.variant && circuitProgramId(c) === programId);
}

function updateMemberAccessField() {
  const programId = document.getElementById("member-modal-program").value;
  document.getElementById("member-modal-access-wrap").style.display =
    programHasVariants(programId) ? "" : "none";
}

function updateMemberProgramFields() {
  updateMemberStartDateField();
  updateMemberAccessField();
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
  // Combo is the safe default on a new record: it shows the member everything
  // the program has, so a mis-set access level can't hide content they paid
  // for. Narrowing it later is a deliberate act.
  document.getElementById("member-modal-access").value = "both";
  updateMemberProgramFields();
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
  document.getElementById("member-modal-access").value = m.access || "both";
  updateMemberProgramFields();
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
  // Stored only where it means something. Carrying an access level on a
  // Burn Club member would be a value nothing reads, waiting to be believed.
  const access = programHasVariants(program)
    ? document.getElementById("member-modal-access").value
    : null;

  if (editingMemberId) {
    const m = MEMBERS.find((x) => x.id === editingMemberId);
    Object.assign(m, { name, email, program, memberSince, badge, status, notes, startDate, access });
  } else {
    MEMBERS.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(), name, email, program, streak: 0, memberSince, badge, status, notes, habits: [], startDate, access });
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
// Membership is the program scope plus any groups added to the challenge
// (2026-08-17). Groups were bolted on rather than replacing the program scope
// so existing challenges keep working untouched — a challenge with no groupIds
// behaves exactly as before.
function challengeStandings(challenge) {
  const byProgram = MEMBERS.filter((m) => challenge.programId === "all" || m.program === challenge.programId);
  const byGroup = (challenge.groupIds || []).flatMap((gid) => groupMembers(groupById(gid)));

  const seen = new Set();
  const members = [...byProgram, ...byGroup].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

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
        <p class="post-meta">${p.time} · ${p.likes} likes ${p.flagged ? `· ${icon("flag")} Flagged` : ""} ${p.featured ? `· ${icon("star")} Featured` : ""}</p>
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
      if (btn.dataset.view === "view-dashboard") renderDashboardUnread();
      // Preserves which group/section you were on, the way Programs and
      // Library do — the tree makes where you are obvious, so being thrown
      // back to the list on every nav click is just lost work.
      if (btn.dataset.view === "view-groups") {
        if (groupsPane === "detail" && groupById(selectedGroupId)) renderGroupDetail();
        else backToGroups();
      }
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

  document.getElementById("library-search").addEventListener("input", (e) => {
    libraryQuery = e.target.value;
    renderLibrary();
  });

  document.getElementById("new-group-btn").addEventListener("click", () => openGroupModal(null));
  document.getElementById("group-edit-btn").addEventListener("click", () => openGroupModal(selectedGroupId));
  document.getElementById("group-delete-btn").addEventListener("click", deleteGroup);
  document.getElementById("group-challenge-btn").addEventListener("click", openGroupChallengeModal);
  document.getElementById("group-chat-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("group-chat-input");
    sendGroupChat(input.value);
    input.value = "";
  });
  document.getElementById("group-roster-search").addEventListener("input", (e) => {
    groupRosterQuery = e.target.value;
    renderGroupRoster();
  });
  document.getElementById("group-modal-close-btn").addEventListener("click", closeGroupModal);
  document.getElementById("group-modal-cancel-btn").addEventListener("click", closeGroupModal);
  document.getElementById("group-modal-save-btn").addEventListener("click", saveGroup);
  document.getElementById("group-challenge-close-btn").addEventListener("click", () => document.getElementById("group-challenge-overlay").classList.remove("visible"));
  document.getElementById("group-challenge-cancel-btn").addEventListener("click", () => document.getElementById("group-challenge-overlay").classList.remove("visible"));
  document.getElementById("group-challenge-select").addEventListener("change", updateGroupChallengeNote);
  document.getElementById("group-challenge-confirm-btn").addEventListener("click", confirmGroupChallenge);

  document.getElementById("activity-program-filter").addEventListener("change", (e) => {
    activityProgramFilter = e.target.value;
    renderActivityChart();
  });
  document.getElementById("activity-prev-week").addEventListener("click", () => {
    activityWeekStart = shiftWeeks(activityWeekStart || currentWeekStartKey(), -1);
    renderActivityChart();
  });
  document.getElementById("activity-next-week").addEventListener("click", () => {
    const next = shiftWeeks(activityWeekStart || currentWeekStartKey(), 1);
    if (next > currentWeekStartKey()) return;
    activityWeekStart = next;
    renderActivityChart();
  });
  document.getElementById("activity-this-week").addEventListener("click", () => {
    activityWeekStart = currentWeekStartKey();
    renderActivityChart();
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
    if (!currentScope) return;
    if (currentScope.type === "folder") return openBuilder(currentScope.id);
    if (currentScope.type === "week") {
      // Suggest the week you're standing in, so adding to next week from
      // inside next week doesn't make you retype the date.
      const suggested = currentScope.weekKey === "always" || currentScope.weekKey === "undated"
        ? currentWeekStartKey()
        : currentScope.weekKey;
      openRollingBuilder(currentScope.programId, suggested);
    }
  });
  document.getElementById("new-rolling-workout-btn").addEventListener("click", () => {
    openRollingBuilder(selectedProgramScope, currentWeekStartKey());
  });
  document.getElementById("builder-available-from").addEventListener("input", () => {
    document.getElementById("builder-availability-dated").checked = true;
    updateBuilderAvailabilityNote();
  });
  document.getElementById("builder-availability-always").addEventListener("change", updateBuilderAvailabilityNote);
  document.getElementById("builder-availability-dated").addEventListener("change", updateBuilderAvailabilityNote);
  // Both events: typing a date fires `input`, but some native date-picker
  // interactions only fire `change`, and a stale week preview beside a changed
  // date is worse than none.
  document.getElementById("target-date-modal-input").addEventListener("input", updateTargetDateNote);
  document.getElementById("target-date-modal-input").addEventListener("change", updateTargetDateNote);
  document.getElementById("new-folder-btn").addEventListener("click", openFolderModal);
  document.getElementById("folder-modal-close-btn").addEventListener("click", closeFolderModal);
  document.getElementById("folder-modal-cancel-btn").addEventListener("click", closeFolderModal);
  document.getElementById("folder-modal-save-btn").addEventListener("click", saveNewFolder);
  document.getElementById("schedule-back-btn").addEventListener("click", () => {
    if (currentScheduleProgramId) openProgramFolders(currentScheduleProgramId);
    else openAllPrograms();
  });
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

  document.getElementById("duplicate-modal-close-btn").addEventListener("click", closeDuplicateModal);
  document.getElementById("duplicate-modal-cancel-btn").addEventListener("click", closeDuplicateModal);
  document.getElementById("duplicate-modal-confirm-btn").addEventListener("click", confirmDuplicateModal);
  document.getElementById("duplicate-modal-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmDuplicateModal();
  });

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
  document.getElementById("builder-filter-btn").addEventListener("click", toggleBuilderFilters);
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
  document.getElementById("member-modal-program").addEventListener("change", updateMemberProgramFields);

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
