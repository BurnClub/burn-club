// Burn Club Staff — navigation, messaging, circuit quick-edit, and the fake
// live broadcast. No real backend: everything here is in-memory only, same
// convention as the desktop admin dashboard (no localStorage).

// ---------------- Navigation ----------------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("visible"));
  document.getElementById(id).classList.add("visible");
}

function showTab(tabId) {
  document.getElementById("main-app").classList.add("visible");
  document.getElementById("screen-login").classList.remove("visible");
  document.querySelectorAll(".tab-screen").forEach((s) => s.classList.remove("visible"));
  document.querySelectorAll(".screen:not(.tab-screen)").forEach((s) => s.classList.remove("visible"));
  document.getElementById(tabId).classList.add("visible");
  if (tabId === "tab-messages") renderConversationList();
  if (tabId === "tab-circuits") renderStaffCircuitList();

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-btn[data-tab-target="${tabId}"]`);
  if (navBtn) navBtn.classList.add("active");

  document.getElementById("bottom-nav").style.display = "flex";
}

// ---------------- Messaging ----------------
// Mirrors the member app's list-then-thread pattern (mobile-shaped), with
// the reply logic from the desktop admin (isStaff-based).

function conversationDisplayName(conv) {
  if (conv.type === "group") return conv.name;
  const member = MEMBERS.find((m) => m.id === conv.memberId);
  return member ? member.name : "Unknown Member";
}

function conversationMessages(conversationId) {
  return MESSAGES.filter((m) => m.conversationId === conversationId);
}

function conversationPreview(conv) {
  const msgs = conversationMessages(conv.id);
  const last = msgs[msgs.length - 1];
  const prefix = last && !last.isStaff && conv.type === "group" ? `${last.senderName.split(" ")[0]}: ` : last && last.isStaff ? "You: " : "";
  return {
    lastText: last ? `${prefix}${last.text}` : "No messages yet.",
    lastTime: last ? last.time : "",
    unread: msgs.some((m) => !m.isStaff && !m.read),
  };
}

function renderConversationRow(conv) {
  const preview = conversationPreview(conv);
  return `
    <div class="conversation-row" data-open-thread="${conv.id}">
      <div class="conversation-icon">${conv.type === "group" ? "👥" : "💬"}</div>
      <div class="conversation-text">
        <p class="conversation-name">${conversationDisplayName(conv)}</p>
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
  updateUnreadBadge();
}

function updateUnreadBadge() {
  const unreadCount = MESSAGES.filter((m) => !m.isStaff && !m.read).length;
  document.querySelectorAll("[data-role='msg-unread-badge']").forEach((badge) => {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";
  });
}

function renderMessageBubble(m, isGroup) {
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

let openThreadId = null;

function openThread(conversationId) {
  openThreadId = conversationId;
  const conv = CONVERSATIONS.find((c) => c.id === conversationId);
  if (!conv) return;
  document.getElementById("thread-title").textContent = conversationDisplayName(conv);

  conversationMessages(conversationId).forEach((m) => {
    if (!m.isStaff) m.read = true;
  });

  renderThreadMessages();
  updateUnreadBadge();
  showScreen("screen-thread");
  document.getElementById("bottom-nav").style.display = "none";
}

function renderThreadMessages() {
  const conv = CONVERSATIONS.find((c) => c.id === openThreadId);
  if (!conv) return;
  const list = document.getElementById("thread-messages");
  list.innerHTML = conversationMessages(openThreadId).map((m) => renderMessageBubble(m, conv.type === "group")).join("");
  list.scrollTop = list.scrollHeight;
}

// Pushes locally AND into the shared localStorage bridge so the member/admin
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

function sendThreadMessage(text) {
  if (!openThreadId || !text.trim()) return;
  broadcastMessage({
    id: "msg-" + Date.now(),
    conversationId: openThreadId,
    senderId: "staff",
    senderName: "Staff",
    isStaff: true,
    text: text.trim(),
    time: "Just now",
    read: true,
  });
  renderThreadMessages();
}

// If the member or admin app sends/replies in the same browser, pick it up
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
  updateUnreadBadge();
  if (document.getElementById("tab-messages").classList.contains("visible")) renderConversationList();
  if (document.getElementById("screen-thread").classList.contains("visible")) renderThreadMessages();
});

function backToMessages() {
  showTab("tab-messages");
}

// ---------------- Circuits (quick-edit) ----------------
// Simplified on purpose: swap an exercise name, adjust reps/sets/rest. Not
// the full block-type/exercise-picker builder from the desktop admin.

function renderStaffCircuitRow(c) {
  return `
    <button class="circuit-row-compact" data-open-circuit-edit="${c.id}">
      <span>${c.title}</span>
      <span class="archive-count">${c.tag}</span>
    </button>
  `;
}

function renderStaffCircuitList() {
  document.getElementById("staff-circuit-list").innerHTML = CIRCUITS.map(renderStaffCircuitRow).join("");
  document.querySelectorAll("[data-open-circuit-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openCircuitEdit(btn.dataset.openCircuitEdit));
  });
}

// Normalizes single-exercise blocks (straight/ladder) and multi-exercise
// blocks (interval/superset/amrap/emom) into one editable list.
function blockExercises(block) {
  return block.exercise ? [block.exercise] : block.exercises || [];
}

function renderBlockEditCard(block, blockIndex) {
  const exerciseRows = blockExercises(block)
    .map(
      (ex, exIndex) => `
        <div class="edit-field-row">
          <label class="modal-field">Exercise
            <input type="text" data-block="${blockIndex}" data-ex="${exIndex}" data-field="name" value="${ex.name}" />
          </label>
          ${
            ex.reps !== undefined
              ? `<label class="modal-field narrow">Reps
                  <input type="number" data-block="${blockIndex}" data-ex="${exIndex}" data-field="reps" value="${ex.reps}" />
                </label>`
              : ""
          }
        </div>
      `
    )
    .join("");

  const blockLevelFields = [
    block.sets !== undefined ? { field: "sets", label: "Sets", value: block.sets } : null,
    block.reps !== undefined ? { field: "reps", label: "Reps", value: block.reps } : null,
    block.rounds !== undefined ? { field: "rounds", label: "Rounds", value: block.rounds } : null,
    block.work !== undefined ? { field: "work", label: "Work (sec)", value: block.work } : null,
    block.rest !== undefined ? { field: "rest", label: "Rest (sec)", value: block.rest } : null,
  ].filter(Boolean);

  return `
    <div class="circuit-edit-card">
      <h3>${block.label}</h3>
      ${exerciseRows}
      ${
        blockLevelFields.length
          ? `<div class="edit-field-row">
              ${blockLevelFields
                .map(
                  (f) => `
                    <label class="modal-field narrow">${f.label}
                      <input type="number" data-block="${blockIndex}" data-field="${f.field}" value="${f.value}" />
                    </label>
                  `
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

let openCircuitEditId = null;

function openCircuitEdit(id) {
  const c = CIRCUITS.find((x) => x.id === id);
  if (!c) return;
  openCircuitEditId = id;
  document.getElementById("circuit-edit-title").textContent = c.title;
  document.getElementById("circuit-edit-blocks").innerHTML = c.blocks.map(renderBlockEditCard).join("");
  showScreen("screen-circuit-edit");
  document.getElementById("bottom-nav").style.display = "none";
}

function saveCircuitEdit() {
  const c = CIRCUITS.find((x) => x.id === openCircuitEditId);
  if (!c) return;
  document.querySelectorAll("#circuit-edit-blocks input").forEach((input) => {
    const blockIndex = Number(input.dataset.block);
    const block = c.blocks[blockIndex];
    const field = input.dataset.field;
    const value = input.type === "number" ? Number(input.value) : input.value;
    if (input.dataset.ex !== undefined) {
      blockExercises(block)[Number(input.dataset.ex)][field] = value;
    } else {
      block[field] = value;
    }
  });
  showTab("tab-circuits");
}

// ---------------- Live (faked — see member app's data.js for the matching note) ----------------

let liveViewerInterval = null;
let liveChatInterval = null;
let liveChatScriptIndex = 0;

function goLive() {
  liveChatScriptIndex = 0;
  const title = document.getElementById("live-title-input").value.trim() || "Live Q&A with Coach Chris";
  document.getElementById("staff-live-title").textContent = title;
  document.getElementById("staff-live-chat").innerHTML = "";
  document.getElementById("live-viewer-num").textContent = "3";
  document.getElementById("live-offline-view").style.display = "none";
  document.getElementById("live-online-view").style.display = "block";

  liveViewerInterval = setInterval(() => {
    const el = document.getElementById("live-viewer-num");
    el.textContent = Number(el.textContent) + Math.floor(Math.random() * 3);
  }, 4000);

  liveChatInterval = setInterval(() => {
    if (liveChatScriptIndex >= LIVE_CHAT_SCRIPT.length) return;
    const msg = LIVE_CHAT_SCRIPT[liveChatScriptIndex];
    liveChatScriptIndex++;
    const list = document.getElementById("staff-live-chat");
    list.innerHTML += `
      <div class="msg-bubble-row">
        <div class="msg-bubble">
          <p class="msg-sender">${msg.name}</p>
          <p>${msg.text}</p>
        </div>
      </div>
    `;
    list.scrollTop = list.scrollHeight;
  }, 3000);
}

function endLive() {
  clearInterval(liveViewerInterval);
  clearInterval(liveChatInterval);
  document.getElementById("live-offline-view").style.display = "block";
  document.getElementById("live-online-view").style.display = "none";
}

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    showTab("tab-messages");
  });

  document.querySelectorAll("[data-tab-target]").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tabTarget));
  });

  document.getElementById("thread-back-btn").addEventListener("click", backToMessages);
  document.getElementById("thread-composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("thread-input");
    sendThreadMessage(input.value);
    input.value = "";
  });

  document.getElementById("circuit-edit-back-btn").addEventListener("click", () => showTab("tab-circuits"));
  document.getElementById("circuit-edit-save-btn").addEventListener("click", saveCircuitEdit);

  document.getElementById("go-live-btn").addEventListener("click", goLive);
  document.getElementById("end-live-btn").addEventListener("click", endLive);

  updateUnreadBadge();
});
