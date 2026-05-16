const SUPABASE_URL = "https://jbljqusdpifdyewlenun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYq_rDXqj_Ate8B66PcJEQ_a6yv1YUl";
const SUPABASE_TABLE = "threadmail_messages";
const IDENTITY_KEY = "codex-threadmail-identity-v1";
const PREFS_KEY = "codex-threadmail-prefs-v1";
const DRAFTS_KEY = "codex-threadmail-drafts-v1";
const BASE_TITLE = "Threadmail";

let identity = loadIdentity();
let messageRows = [];
let drafts = loadDrafts();
let prefs = loadPrefs();
let threads = [];
let activeFilter = "inbox";
let activeQuery = "";
let activeId = null;
let replyToId = null;
let tableReady = false;
let activeTextField = null;
let touchShift = false;
let lastUnreadCount = 0;
let notificationReady = false;

const els = {
  inboxCount: document.getElementById("inboxCount"),
  unreadCount: document.getElementById("unreadCount"),
  archivedCount: document.getElementById("archivedCount"),
  sentCount: document.getElementById("sentCount"),
  visibleCount: document.getElementById("visibleCount"),
  listTitle: document.getElementById("listTitle"),
  threadList: document.getElementById("threadList"),
  emptyState: document.getElementById("emptyState"),
  messageDetail: document.getElementById("messageDetail"),
  detailFrom: document.getElementById("detailFrom"),
  detailSubject: document.getElementById("detailSubject"),
  detailMeta: document.getElementById("detailMeta"),
  detailTags: document.getElementById("detailTags"),
  detailBody: document.getElementById("detailBody"),
  starButton: document.getElementById("starButton"),
  archiveButton: document.getElementById("archiveButton"),
  unreadButton: document.getElementById("unreadButton"),
  deleteButton: document.getElementById("deleteButton"),
  replyButton: document.getElementById("replyButton"),
  keyboardButton: document.getElementById("keyboardButton"),
  composeButton: document.getElementById("composeButton"),
  refreshButton: document.getElementById("refreshButton"),
  composePanel: document.getElementById("composePanel"),
  composeForm: document.getElementById("composeForm"),
  composeTitle: document.getElementById("composeTitle"),
  composeTo: document.getElementById("composeTo"),
  composeSubject: document.getElementById("composeSubject"),
  composeBody: document.getElementById("composeBody"),
  closeCompose: document.getElementById("closeCompose"),
  saveDraft: document.getElementById("saveDraft"),
  mailSearch: document.getElementById("mailSearch"),
  identityHandle: document.getElementById("identityHandle"),
  saveIdentity: document.getElementById("saveIdentity"),
  syncStatus: document.getElementById("syncStatus"),
  notificationStrip: document.getElementById("notificationStrip"),
  notificationCount: document.getElementById("notificationCount"),
  notificationText: document.getElementById("notificationText"),
  touchKeyboard: document.getElementById("touchKeyboard"),
  touchKeyboardTarget: document.getElementById("touchKeyboardTarget"),
  hideTouchKeyboard: document.getElementById("hideTouchKeyboard"),
  touchKeys: document.querySelectorAll("#touchKeyboard button")
};

els.identityHandle.value = identity.handle;

function normalizeHandle(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function isValidHandle(value) {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

function loadIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    return { handle: normalizeHandle(saved?.handle || "") };
  } catch {
    return { handle: "" };
  }
}

function saveIdentity() {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function savePrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function loadDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFTS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveDrafts() {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function getSupabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY,
    ...extra
  };
}

function setStatus(message, tone = "neutral") {
  els.syncStatus.textContent = message;
  els.syncStatus.dataset.tone = tone;
}

function threadPrefs(id) {
  prefs[id] ||= { starred: false, archived: false };
  return prefs[id];
}

function rebuildThreads() {
  const remoteThreads = messageRows.map((row) => {
    const pref = threadPrefs(row.id);
    const isSent = row.sender_handle === identity.handle;
    const isReceived = row.recipient_handle === identity.handle;
    return {
      id: row.id,
      from: isSent ? `You to ${row.recipient_handle}` : row.sender_handle,
      subject: row.subject,
      body: row.body,
      time: formatTime(row.created_at),
      unread: isReceived && !row.read_at,
      starred: Boolean(pref.starred),
      archived: Boolean(pref.archived),
      sent: isSent,
      received: isReceived,
      draft: false,
      tags: [isSent ? "sent" : "inbox", row.recipient_handle]
    };
  });

  const localDrafts = drafts.map((draft) => ({
    ...draft,
    unread: false,
    starred: Boolean(threadPrefs(draft.id).starred),
    archived: Boolean(threadPrefs(draft.id).archived),
    sent: false,
    received: false,
    draft: true,
    tags: ["draft"]
  }));

  threads = [...remoteThreads, ...localDrafts].sort((a, b) => String(b.id).localeCompare(String(a.id)));
  if (!threads.some((thread) => thread.id === activeId)) {
    activeId = visibleThreads()[0]?.id || null;
  }
}

function currentThread() {
  return threads.find((thread) => thread.id === activeId);
}

function matchesFilter(thread) {
  if (activeFilter === "inbox") return thread.received && !thread.archived;
  if (activeFilter === "unread") return thread.unread && !thread.archived;
  if (activeFilter === "starred") return thread.starred && !thread.archived;
  if (activeFilter === "archived") return thread.archived;
  if (activeFilter === "sent") return thread.sent || thread.draft;
  return true;
}

function matchesQuery(thread) {
  if (!activeQuery) return true;
  const haystack = [thread.from, thread.subject, thread.body, ...thread.tags].join(" ").toLowerCase();
  return haystack.includes(activeQuery);
}

function visibleThreads() {
  return threads.filter((thread) => matchesFilter(thread) && matchesQuery(thread));
}

function filterLabel() {
  return activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
}

function renderStats() {
  const unreadCount = getUnreadCount();
  els.inboxCount.textContent = String(threads.filter((thread) => thread.received && !thread.archived).length);
  els.unreadCount.textContent = String(unreadCount);
  els.archivedCount.textContent = String(threads.filter((thread) => thread.archived).length);
  els.sentCount.textContent = String(threads.filter((thread) => thread.sent || thread.draft).length);
  updateNotifications(unreadCount);
}

function getUnreadCount() {
  return threads.filter((thread) => thread.unread && !thread.archived).length;
}

function updateNotifications(unreadCount) {
  document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
  els.notificationStrip.hidden = unreadCount === 0;
  els.notificationCount.textContent = String(unreadCount);
  els.notificationText.textContent = unreadCount === 1
    ? "You have 1 unread message."
    : `You have ${unreadCount} unread messages.`;
}

function maybeNotifyUnreadChange() {
  const unreadCount = getUnreadCount();
  if (notificationReady && unreadCount > lastUnreadCount) {
    playNotificationChime();
    setStatus(unreadCount === 1 ? "New message received." : `${unreadCount - lastUnreadCount} new messages received.`, "success");
  }
  lastUnreadCount = unreadCount;
  notificationReady = true;
  updateNotifications(unreadCount);
}

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audio = new AudioContext();
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gain.connect(audio.destination);

    [660, 880].forEach((frequency, index) => {
      const osc = audio.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + index * 0.09);
      osc.connect(gain);
      osc.start(now + index * 0.09);
      osc.stop(now + 0.24 + index * 0.09);
    });
  } catch {
    // The title and in-app badge still handle the notification if audio is blocked.
  }
}

function renderList() {
  const list = visibleThreads();
  els.listTitle.textContent = filterLabel();
  els.visibleCount.textContent = `${list.length} ${list.length === 1 ? "thread" : "threads"}`;
  els.threadList.innerHTML = "";

  if (!list.some((thread) => thread.id === activeId)) {
    activeId = list[0]?.id || null;
  }

  for (const thread of list) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thread-item${thread.unread ? " is-unread" : ""}${thread.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `
      <div class="thread-item__meta">
        <span>${thread.time}</span>
        ${thread.starred ? "<span>Starred</span>" : ""}
        ${thread.unread ? "<span>Unread</span>" : ""}
        ${thread.draft ? "<span>Draft</span>" : ""}
      </div>
      <h3>${escapeHtml(thread.subject)}</h3>
      <p>${escapeHtml(thread.from)} - ${escapeHtml(thread.body.slice(0, 92))}${thread.body.length > 92 ? "..." : ""}</p>
    `;
    button.addEventListener("click", () => selectThread(thread.id));
    els.threadList.append(button);
  }
}

async function selectThread(id) {
  activeId = id;
  const thread = currentThread();
  if (thread?.unread && !thread.draft) {
    await markRemoteRead(thread.id);
  }
  render();
}

function renderDetail() {
  const thread = currentThread();
  els.emptyState.hidden = Boolean(thread);
  els.messageDetail.hidden = !thread;
  if (!thread) return;

  els.detailFrom.textContent = thread.from;
  els.detailSubject.textContent = thread.subject;
  els.detailMeta.textContent = `${thread.time} | ${thread.draft ? "Draft" : thread.archived ? "Archived" : thread.sent ? "Sent" : "Inbox"}`;
  els.detailBody.textContent = thread.body;
  els.detailTags.innerHTML = "";
  for (const tag of thread.tags) {
    const item = document.createElement("span");
    item.textContent = tag;
    els.detailTags.append(item);
  }
  els.starButton.textContent = thread.starred ? "Starred" : "*";
  els.archiveButton.textContent = thread.archived ? "Move To Inbox" : "Archive";
  els.unreadButton.textContent = thread.unread ? "Mark Read" : "Mark Unread";
  els.unreadButton.disabled = thread.sent || thread.draft;
  els.replyButton.disabled = thread.sent || thread.draft;
}

function renderFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
}

function render() {
  rebuildThreads();
  renderStats();
  renderFilters();
  renderList();
  renderDetail();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function openCompose(mode = "new") {
  const thread = currentThread();
  replyToId = mode === "reply" ? activeId : null;
  els.composeTitle.textContent = mode === "reply" ? "Reply" : "New Message";
  els.composeTo.value = mode === "reply" && thread ? thread.from.replace(/^You to\s+/i, "") : "";
  els.composeSubject.value = mode === "reply" && thread ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : "";
  els.composeBody.value = "";
  els.composePanel.hidden = false;
  els.composeTo.focus();
}

function closeComposePanel() {
  els.composePanel.hidden = true;
  replyToId = null;
}

function showTouchKeyboard(field) {
  activeTextField = field;
  els.touchKeyboard.hidden = false;
  document.body.classList.add("keyboard-open");
  els.touchKeyboardTarget.textContent = getFieldLabel(field);
}

function hideTouchKeyboard() {
  els.touchKeyboard.hidden = true;
  document.body.classList.remove("keyboard-open");
  activeTextField = null;
}

function getFieldLabel(field) {
  const label = field.closest("label")?.querySelector("span")?.textContent;
  return label ? `Typing: ${label}` : "Typing";
}

function syncTouchKeyboardCase() {
  els.touchKeys.forEach((button) => {
    const key = button.dataset.key;
    if (!key || key.length !== 1 || !/[a-z]/.test(key)) return;
    button.textContent = touchShift ? key.toUpperCase() : key;
    button.classList.toggle("is-active", touchShift);
  });
}

function insertTouchText(text) {
  if (!activeTextField) return;
  const start = activeTextField.selectionStart ?? activeTextField.value.length;
  const end = activeTextField.selectionEnd ?? activeTextField.value.length;
  const nextValue = activeTextField.value.slice(0, start) + text + activeTextField.value.slice(end);
  activeTextField.value = nextValue;
  const nextCursor = start + text.length;
  activeTextField.focus({ preventScroll: true });
  activeTextField.setSelectionRange(nextCursor, nextCursor);
  activeTextField.dispatchEvent(new Event("input", { bubbles: true }));
}

function backspaceTouchText() {
  if (!activeTextField) return;
  const start = activeTextField.selectionStart ?? activeTextField.value.length;
  const end = activeTextField.selectionEnd ?? activeTextField.value.length;
  if (start === 0 && end === 0) return;
  const deleteFrom = start === end ? Math.max(0, start - 1) : start;
  activeTextField.value = activeTextField.value.slice(0, deleteFrom) + activeTextField.value.slice(end);
  activeTextField.focus({ preventScroll: true });
  activeTextField.setSelectionRange(deleteFrom, deleteFrom);
  activeTextField.dispatchEvent(new Event("input", { bubbles: true }));
}

function pressTouchKey(button) {
  const action = button.dataset.action;
  if (action === "shift") {
    touchShift = !touchShift;
    syncTouchKeyboardCase();
    return;
  }
  if (action === "backspace") {
    backspaceTouchText();
    return;
  }
  if (action === "space") {
    insertTouchText(" ");
    return;
  }
  if (action === "enter") {
    if (activeTextField?.tagName === "TEXTAREA") {
      insertTouchText("\n");
    } else {
      activeTextField?.blur();
    }
    return;
  }

  const key = button.dataset.key || "";
  insertTouchText(touchShift && /[a-z]/.test(key) ? key.toUpperCase() : key);
  if (touchShift && /[a-z]/.test(key)) {
    touchShift = false;
    syncTouchKeyboardCase();
  }
}

async function sendMessage() {
  const sender = identity.handle;
  const recipient = normalizeHandle(els.composeTo.value);
  const subject = els.composeSubject.value.trim();
  const body = els.composeBody.value.trim();

  if (!isValidHandle(sender)) {
    setStatus("Save your handle before sending.", "error");
    els.identityHandle.focus();
    return;
  }
  if (!isValidHandle(recipient)) {
    setStatus("Use a recipient handle with 3-24 letters, numbers, or underscores.", "error");
    els.composeTo.focus();
    return;
  }
  if (!subject || !body) return;

  setStatus("Sending message...", "neutral");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify([{
        sender_handle: sender,
        recipient_handle: recipient,
        subject,
        body: replyToId ? `${body}\n\n--- Reply sent from Threadmail. ---` : body
      }])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Message could not be sent.");
      return;
    }
    tableReady = true;
    closeComposePanel();
    setStatus(`Message sent to ${recipient}.`, "success");
    await fetchMessages();
    activeId = Array.isArray(payload) ? payload[0]?.id || activeId : activeId;
    activeFilter = "sent";
    render();
  } catch {
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

function saveDraft() {
  const recipient = normalizeHandle(els.composeTo.value);
  const subject = els.composeSubject.value.trim();
  const body = els.composeBody.value.trim();
  if (!recipient || !subject || !body) return;
  const draft = {
    id: `draft-${Date.now()}`,
    from: `Draft to ${recipient}`,
    subject,
    body,
    time: "Draft",
    tags: ["draft", recipient]
  };
  drafts.unshift(draft);
  saveDrafts();
  closeComposePanel();
  activeId = draft.id;
  activeFilter = "sent";
  setStatus("Draft saved on this device.", "success");
  render();
}

async function fetchMessages() {
  const handle = identity.handle;
  if (!isValidHandle(handle)) {
    messageRows = [];
    setStatus("Choose a handle to send and receive messages.");
    render();
    return;
  }

  setStatus(`Checking messages for ${handle}...`);
  try {
    const query = `or=(sender_handle.eq.${encodeURIComponent(handle)},recipient_handle.eq.${encodeURIComponent(handle)})&select=id,sender_handle,recipient_handle,subject,body,created_at,read_at&order=created_at.desc&limit=100`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?${query}`, {
      headers: getSupabaseHeaders()
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Could not load messages.");
      return;
    }
    tableReady = true;
    messageRows = Array.isArray(payload) ? payload : [];
    setStatus(messageRows.length ? `Synced ${messageRows.length} message${messageRows.length === 1 ? "" : "s"} for ${handle}.` : `Inbox ready for ${handle}.`, "success");
    render();
    maybeNotifyUnreadChange();
  } catch {
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

async function markRemoteRead(id) {
  const row = messageRows.find((entry) => entry.id === id);
  if (!row || row.read_at) return;
  row.read_at = new Date().toISOString();
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }),
      body: JSON.stringify({ read_at: row.read_at })
    });
  } catch {
    setStatus("Message opened locally. Read status could not sync.", "error");
  }
}

async function deleteThread() {
  const thread = currentThread();
  if (!thread) return;
  if (thread.draft) {
    drafts = drafts.filter((draft) => draft.id !== thread.id);
    saveDrafts();
  } else {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(thread.id)}`, {
        method: "DELETE",
        headers: getSupabaseHeaders({ Prefer: "return=minimal" })
      });
      messageRows = messageRows.filter((row) => row.id !== thread.id);
      setStatus("Message deleted.", "success");
    } catch {
      setStatus("Could not delete that message from Supabase.", "error");
    }
  }
  activeId = null;
  render();
}

function handleSupabaseError(payload, fallback) {
  const code = payload && typeof payload === "object" ? payload.code : "";
  if (code === "PGRST205" || code === "42P01") {
    tableReady = false;
    setStatus("Threadmail needs the Supabase threadmail_messages table. Run supabase/threadmail-messages.sql once.", "error");
  } else {
    setStatus(fallback || "Supabase returned an error.", "error");
  }
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

els.mailSearch.addEventListener("input", () => {
  activeQuery = els.mailSearch.value.trim().toLowerCase();
  render();
});

els.saveIdentity.addEventListener("click", async () => {
  const nextHandle = normalizeHandle(els.identityHandle.value);
  if (!isValidHandle(nextHandle)) {
    setStatus("Handle must be 3-24 letters, numbers, or underscores.", "error");
    return;
  }
  identity.handle = nextHandle;
  els.identityHandle.value = nextHandle;
  activeId = null;
  saveIdentity();
  await fetchMessages();
});

els.refreshButton.addEventListener("click", fetchMessages);
els.keyboardButton.addEventListener("click", () => {
  const field = activeTextField || els.identityHandle;
  field.focus({ preventScroll: true });
  showTouchKeyboard(field);
});

document.querySelectorAll("[data-touch-input]").forEach((field) => {
  field.addEventListener("focus", () => showTouchKeyboard(field));
  field.addEventListener("pointerdown", () => showTouchKeyboard(field));
});

els.touchKeyboard.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  event.preventDefault();
});

els.touchKeys.forEach((button) => {
  if (button === els.hideTouchKeyboard) return;
  button.addEventListener("click", () => pressTouchKey(button));
});

els.hideTouchKeyboard.addEventListener("click", hideTouchKeyboard);

els.starButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  threadPrefs(thread.id).starred = !thread.starred;
  savePrefs();
  render();
});

els.archiveButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  threadPrefs(thread.id).archived = !thread.archived;
  savePrefs();
  render();
});

els.unreadButton.addEventListener("click", async () => {
  const thread = currentThread();
  if (!thread || thread.sent || thread.draft) return;
  const row = messageRows.find((entry) => entry.id === thread.id);
  if (!row) return;
  row.read_at = thread.unread ? new Date().toISOString() : null;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(thread.id)}`, {
      method: "PATCH",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }),
      body: JSON.stringify({ read_at: row.read_at })
    });
  } catch {
    setStatus("Could not update read status.", "error");
  }
  render();
});

els.deleteButton.addEventListener("click", deleteThread);
els.replyButton.addEventListener("click", () => openCompose("reply"));
els.composeButton.addEventListener("click", () => openCompose("new"));
els.closeCompose.addEventListener("click", closeComposePanel);
els.saveDraft.addEventListener("click", saveDraft);
els.composeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  if (event.key.toLowerCase() === "n") openCompose("new");
  if (event.key.toLowerCase() === "r") openCompose("reply");
  if (event.key.toLowerCase() === "a") els.archiveButton.click();
  if (event.key.toLowerCase() === "f") fetchMessages();
  if (event.key === "Escape") {
    if (!els.composePanel.hidden) {
      closeComposePanel();
      return;
    }
    window.parent.postMessage({ type: "codex-menu-exit" }, window.location.origin);
  }
});

render();
fetchMessages();
