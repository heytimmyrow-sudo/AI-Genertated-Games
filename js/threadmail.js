const SUPABASE_URL = "https://jbljqusdpifdyewlenun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYq_rDXqj_Ate8B66PcJEQ_a6yv1YUl";
const SUPABASE_TABLE = "threadmail_messages";
const GAMES_TABLE = "threadmail_games";
const TYPING_TABLE = "threadmail_typing";
const IDENTITY_KEY = "codex-threadmail-identity-v1";
const PREFS_KEY = "codex-threadmail-prefs-v1";
const DRAFTS_KEY = "codex-threadmail-drafts-v1";
const AUTOSAVE_KEY = "codex-threadmail-autosave-v1";
const SETTINGS_KEY = "codex-threadmail-settings-v1";
const LOCK_KEY = "codex-threadmail-lock-v1";
const BASE_TITLE = "Threadmail";
const AI_HANDLE = "threadai";
const REACTIONS = ["Nice", "OK", "?", "Haha"];
const QUICK_REPLIES = ["OK", "On it", "Your turn", "Haha"];
const CALL_INVITE_PREFIX = "THREADMAIL_CALL_INVITE::";
const VOICE_NOTE_PREFIX = "THREADMAIL_VOICE_NOTE::";
const PHOTO_PREFIX = "THREADMAIL_PHOTO::";
const AI_QUICK_ACTIONS = [
  { label: "Suggest Reply", prompt: "Suggest 3 short replies I could send. Make them sound natural and different from each other." },
  { label: "Rewrite This", prompt: "Rewrite my next message so it sounds clearer and friendlier. Put the rewritten message first." },
  { label: "Summarize", prompt: "Summarize this conversation in a few simple bullets, then list any next steps." },
  { label: "Ideas", prompt: "Give me three specific ideas for improving Threadmail, and tell me which one to build first." }
];

let identity = loadIdentity();
let messageRows = [];
let gameRows = [];
let typingRows = [];
let drafts = loadDrafts();
let prefs = loadPrefs();
let settings = loadSettings();
let lockSettings = loadLockSettings();
let appUnlocked = !lockSettings.enabled;
let threads = [];
let activeFilter = "inbox";
let activeQuery = "";
let activeChatQuery = "";
let activeId = null;
let replyToId = null;
let tableReady = false;
let lastUnreadCount = 0;
let notificationReady = false;
let pendingGameType = "";
let touchStartX = 0;
let touchStartY = 0;
let pendingResetCode = "";
let speechRecognizer = null;
let speechTarget = null;
let speechButton = null;
let aiTyping = false;
let typingIdleTimer = null;
let lastTypingSentAt = 0;
let voiceRecorder = null;
let voiceChunks = [];

const els = {
  greetingSplash: document.getElementById("greetingSplash"),
  timeGreeting: document.getElementById("timeGreeting"),
  inboxCount: document.getElementById("inboxCount"),
  unreadCount: document.getElementById("unreadCount"),
  archivedCount: document.getElementById("archivedCount"),
  sentCount: document.getElementById("sentCount"),
  visibleCount: document.getElementById("visibleCount"),
  gameLobbyCount: document.getElementById("gameLobbyCount"),
  gameLobbyList: document.getElementById("gameLobbyList"),
  contactsCount: document.getElementById("contactsCount"),
  contactList: document.getElementById("contactList"),
  gameHistorySummary: document.getElementById("gameHistorySummary"),
  gameHistoryList: document.getElementById("gameHistoryList"),
  soundToggle: document.getElementById("soundToggle"),
  keyboardSoundToggle: document.getElementById("keyboardSoundToggle"),
  phoneNotificationButton: document.getElementById("phoneNotificationButton"),
  testNotificationButton: document.getElementById("testNotificationButton"),
  phoneNotificationStatus: document.getElementById("phoneNotificationStatus"),
  themeSelect: document.getElementById("themeSelect"),
  aiStyleSelect: document.getElementById("aiStyleSelect"),
  lockCodeInput: document.getElementById("lockCodeInput"),
  lockEmailInput: document.getElementById("lockEmailInput"),
  saveLockButton: document.getElementById("saveLockButton"),
  disableLockButton: document.getElementById("disableLockButton"),
  lockSettingStatus: document.getElementById("lockSettingStatus"),
  clearLocalData: document.getElementById("clearLocalData"),
  mobileGameBadge: document.getElementById("mobileGameBadge"),
  offlineBanner: document.getElementById("offlineBanner"),
  listTitle: document.getElementById("listTitle"),
  threadList: document.getElementById("threadList"),
  emptyState: document.getElementById("emptyState"),
  messageDetail: document.getElementById("messageDetail"),
  detailFrom: document.getElementById("detailFrom"),
  detailSubject: document.getElementById("detailSubject"),
  detailMeta: document.getElementById("detailMeta"),
  detailTags: document.getElementById("detailTags"),
  reactionRow: document.getElementById("reactionRow"),
  chatSearch: document.getElementById("chatSearch"),
  chatSearchWrap: document.getElementById("chatSearchWrap"),
  quickReplies: document.getElementById("quickReplies"),
  detailBody: document.getElementById("detailBody"),
  inlineReplyForm: document.getElementById("inlineReplyForm"),
  inlineReplyBody: document.getElementById("inlineReplyBody"),
  inlineReplySend: document.getElementById("inlineReplySend"),
  inlineDictateButton: document.getElementById("inlineDictateButton"),
  voiceNoteButton: document.getElementById("voiceNoteButton"),
  inlineCallPicker: document.getElementById("inlineCallPicker"),
  inlineGamePicker: document.getElementById("inlineGamePicker"),
  addCallButton: document.getElementById("addCallButton"),
  addGameButton: document.getElementById("addGameButton"),
  photoButton: document.getElementById("photoButton"),
  editMessageButton: document.getElementById("editMessageButton"),
  pinChatButton: document.getElementById("pinChatButton"),
  starButton: document.getElementById("starButton"),
  archiveButton: document.getElementById("archiveButton"),
  unreadButton: document.getElementById("unreadButton"),
  muteButton: document.getElementById("muteButton"),
  blockButton: document.getElementById("blockButton"),
  deleteButton: document.getElementById("deleteButton"),
  replyButton: document.getElementById("replyButton"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarScrim: document.getElementById("sidebarScrim"),
  composeButton: document.getElementById("composeButton"),
  threadAiButton: document.getElementById("threadAiButton"),
  sidebarComposeButton: document.getElementById("sidebarComposeButton"),
  refreshButton: document.getElementById("refreshButton"),
  composePanel: document.getElementById("composePanel"),
  composeForm: document.getElementById("composeForm"),
  composeTitle: document.getElementById("composeTitle"),
  composeTo: document.getElementById("composeTo"),
  inviteLink: document.getElementById("inviteLink"),
  handleSuggestions: document.getElementById("handleSuggestions"),
  composeSubject: document.getElementById("composeSubject"),
  composeBody: document.getElementById("composeBody"),
  attachTicTacToe: document.getElementById("attachTicTacToe"),
  attachConnectFour: document.getElementById("attachConnectFour"),
  attachBattleship: document.getElementById("attachBattleship"),
  attachWordChain: document.getElementById("attachWordChain"),
  clearGameAttach: document.getElementById("clearGameAttach"),
  gameAttachLabel: document.getElementById("gameAttachLabel"),
  addPoll: document.getElementById("addPoll"),
  addChecklist: document.getElementById("addChecklist"),
  addChoice: document.getElementById("addChoice"),
  photoInput: document.getElementById("photoInput"),
  composeDictateButton: document.getElementById("composeDictateButton"),
  composeSendButton: document.getElementById("composeSendButton"),
  closeCompose: document.getElementById("closeCompose"),
  saveDraft: document.getElementById("saveDraft"),
  mailSearch: document.getElementById("mailSearch"),
  identityHandle: document.getElementById("identityHandle"),
  saveIdentity: document.getElementById("saveIdentity"),
  syncStatus: document.getElementById("syncStatus"),
  notificationStrip: document.getElementById("notificationStrip"),
  notificationCount: document.getElementById("notificationCount"),
  notificationText: document.getElementById("notificationText"),
  appLock: document.getElementById("appLock"),
  unlockForm: document.getElementById("unlockForm"),
  unlockCode: document.getElementById("unlockCode"),
  forgotLockButton: document.getElementById("forgotLockButton"),
  lockRecovery: document.getElementById("lockRecovery"),
  recoveryEmailHint: document.getElementById("recoveryEmailHint"),
  sendCodeEmailButton: document.getElementById("sendCodeEmailButton"),
  resetLockButton: document.getElementById("resetLockButton"),
  lockStatus: document.getElementById("lockStatus"),
  mobileTabs: document.querySelectorAll("[data-mobile-tab]")
};

els.identityHandle.value = identity.handle;

function normalizeHandle(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function isValidHandle(value) {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

function isAiHandle(value) {
  return normalizeHandle(value) === AI_HANDLE;
}

function loadIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    return {
      handle: normalizeHandle(saved?.handle || ""),
      ownerToken: saved?.ownerToken || createOwnerToken()
    };
  } catch {
    return { handle: "", ownerToken: createOwnerToken() };
  }
}

function saveIdentity() {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

function createOwnerToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID() + "-" + Date.now();
  return "owner-" + Date.now() + "-" + Math.random().toString(16).slice(2);
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

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    const themes = ["dark", "light", "neon", "classic", "midnight", "mint"];
    const aiStyles = ["friendly", "short", "formal", "fun"];
    return {
      notificationSounds: saved?.notificationSounds !== false,
      keyboardSounds: Boolean(saved?.keyboardSounds),
      phoneNotifications: Boolean(saved?.phoneNotifications),
      theme: themes.includes(saved?.theme) ? saved.theme : "dark",
      aiStyle: aiStyles.includes(saved?.aiStyle) ? saved.aiStyle : "friendly"
    };
  } catch {
    return { notificationSounds: true, keyboardSounds: false, phoneNotifications: false, theme: "dark", aiStyle: "friendly" };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadLockSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCK_KEY));
    return saved && typeof saved === "object"
      ? { enabled: Boolean(saved.enabled), codeHash: saved.codeHash || "", recoveryEmail: String(saved.recoveryEmail || "").toLowerCase() }
      : { enabled: false, codeHash: "", recoveryEmail: "" };
  } catch {
    return { enabled: false, codeHash: "", recoveryEmail: "" };
  }
}

function saveLockSettings() {
  localStorage.setItem(LOCK_KEY, JSON.stringify(lockSettings));
}

function encodeCode(value) {
  return btoa(unescape(encodeURIComponent(String(value || ""))));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
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

function updateTimeGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  els.timeGreeting.textContent = greeting;
}

function dismissTimeGreeting() {
  const delay = window.matchMedia("(max-width: 620px)").matches ? 1700 : 2600;
  window.setTimeout(() => {
    document.body.classList.add("greeting-dismissed");
    els.greetingSplash.hidden = true;
  }, delay);
}

function setSidebarOpen(open) {
  document.body.classList.toggle("sidebar-open", open);
  els.sidebarToggle.setAttribute("aria-expanded", String(open));
}

function setLockedView(locked) {
  els.appLock.hidden = !locked;
  document.body.classList.toggle("is-locked", locked);
  if (locked) {
    els.lockRecovery.hidden = true;
    els.resetLockButton.hidden = true;
    els.lockStatus.textContent = "This device is locked.";
    window.setTimeout(() => els.unlockCode.focus(), 80);
  }
}

function unlockApp() {
  appUnlocked = true;
  setLockedView(false);
  setStatus(identity.handle ? `Unlocked ${identity.handle}.` : "Unlocked Threadmail.", "success");
  fetchMessages();
}

function renderLockSetting() {
  if (document.activeElement !== els.lockEmailInput) {
    els.lockEmailInput.value = lockSettings.recoveryEmail || "";
  }
  els.lockSettingStatus.textContent = lockSettings.enabled ? "App lock is on for this device." : "App lock is off.";
  els.disableLockButton.disabled = !lockSettings.enabled;
  els.recoveryEmailHint.textContent = lockSettings.recoveryEmail
    ? `Code will be sent to ${lockSettings.recoveryEmail}.`
    : "No recovery email is saved.";
}

function applyTheme() {
  document.body.dataset.theme = settings.theme || "dark";
}

function threadPrefs(id) {
  prefs[id] ||= { starred: false, archived: false, pinned: false, reactions: [] };
  return prefs[id];
}

function handlePrefs(handle) {
  prefs.handles ||= {};
  prefs.handles[handle] ||= { muted: false, blocked: false };
  return prefs.handles[handle];
}

function threadHasReceivedMessages(thread) {
  const ids = thread?.messageIds || (thread?.id ? [thread.id] : []);
  return messageRows.some((entry) => ids.includes(entry.id) && entry.recipient_handle === identity.handle);
}

function getTypingSubjectKey(subject) {
  return normalizeConversationSubject(subject).slice(0, 140);
}

function isTypingFresh(row) {
  return Date.now() - new Date(row.updated_at).getTime() < 9000;
}

function activeTypingHandle(thread) {
  if (!thread?.otherHandle || thread.draft) return "";
  const subjectKey = getTypingSubjectKey(thread.subject);
  const row = typingRows.find((entry) => (
    entry.sender_handle === thread.otherHandle &&
    entry.recipient_handle === identity.handle &&
    entry.subject_key === subjectKey &&
    entry.is_typing &&
    isTypingFresh(entry)
  ));
  return row?.sender_handle || "";
}

function rebuildThreads() {
  const grouped = new Map();
  for (const row of messageRows) {
    const isSent = row.sender_handle === identity.handle;
    const isReceived = row.recipient_handle === identity.handle;
    const otherHandle = isSent ? row.recipient_handle : row.sender_handle;
    const key = `${otherHandle}|${normalizeConversationSubject(row.subject)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...row, isSent, isReceived, otherHandle });
  }

  const remoteThreads = [...grouped.values()].map((rows) => {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const row = rows[0];
    const pref = threadPrefs(row.id);
    const game = row.game_id ? gameRows.find((entry) => entry.id === row.game_id) : null;
    const unread = rows.some((entry) => entry.isReceived && !entry.read_at);
    const readByAnyRecipient = rows.some((entry) => entry.sender_handle === identity.handle && entry.read_at);
    return {
      id: row.id,
      messageIds: rows.map((entry) => entry.id),
      gameId: row.game_id || "",
      from: row.isSent ? `You to ${row.recipient_handle}` : row.sender_handle,
      otherHandle: row.otherHandle,
      subject: row.subject,
      body: rows.map((entry) => `${entry.isSent ? "You" : entry.sender_handle}:\n${entry.body}`).reverse().join("\n\n---\n\n"),
      rows: rows.map((entry) => ({ ...entry })).reverse(),
      time: formatTime(row.created_at),
      unread,
      starred: Boolean(pref.starred),
      archived: Boolean(pref.archived),
      pinned: Boolean(pref.pinned),
      reactions: Array.isArray(pref.reactions) ? pref.reactions : [],
      sent: row.isSent,
      received: rows.some((entry) => entry.isReceived),
      statusLabel: row.isSent ? (readByAnyRecipient ? "Read" : "Delivered") : (unread ? "Unread" : "Read"),
      draft: false,
      tags: [row.isSent ? "sent" : "inbox", row.otherHandle, game ? getGameTitle(game.type) : "", rows.length > 1 ? `${rows.length} messages` : ""].filter(Boolean)
    };
  });

  const localDrafts = drafts.map((draft) => ({
    ...draft,
    unread: false,
    starred: Boolean(threadPrefs(draft.id).starred),
    archived: Boolean(threadPrefs(draft.id).archived),
    pinned: Boolean(threadPrefs(draft.id).pinned),
    sent: false,
    received: false,
    draft: true,
    tags: ["draft"]
  }));

  threads = [...remoteThreads, ...localDrafts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.id).localeCompare(String(a.id)));
  if (!threads.some((thread) => thread.id === activeId)) {
    activeId = visibleThreads()[0]?.id || null;
  }
}

function normalizeConversationSubject(subject) {
  return String(subject || "").replace(/^re:\s*/i, "").trim().toLowerCase();
}

function currentThread() {
  return threads.find((thread) => thread.id === activeId);
}

function findConversationThreadId(otherHandle, subject) {
  const normalizedOther = normalizeHandle(otherHandle);
  const normalizedSubject = normalizeConversationSubject(subject);
  return threads.find((thread) => (
    normalizeHandle(thread.otherHandle) === normalizedOther &&
    normalizeConversationSubject(thread.subject) === normalizedSubject
  ))?.id || null;
}

function matchesFilter(thread) {
  if (!thread.draft && handlePrefs(thread.otherHandle || "").blocked) return false;
  if (activeFilter === "inbox") return thread.received && !thread.archived;
  if (activeFilter === "unread") return thread.unread && !thread.archived;
  if (activeFilter === "starred") return thread.starred && !thread.archived;
  if (activeFilter === "archived") return thread.archived;
  if (activeFilter === "sent") return thread.sent || thread.draft;
  return true;
}

function matchesQuery(thread) {
  if (!activeQuery) return true;
  const game = gameForThread(thread);
  const haystack = [thread.from, thread.subject, thread.body, game ? getGameTitle(game.type) : "", ...thread.tags].join(" ").toLowerCase();
  return haystack.includes(activeQuery);
}

function matchesChatQuery(row) {
  if (!activeChatQuery) return true;
  return [row.sender_handle, row.body, row.subject].join(" ").toLowerCase().includes(activeChatQuery);
}

function visibleThreads() {
  return threads.filter((thread) => matchesFilter(thread) && matchesQuery(thread));
}

function filterLabel() {
  return activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
}

function renderStats() {
  const unreadCount = getUnreadCount();
  const yourMoveCount = getYourMoveCount();
  els.inboxCount.textContent = String(threads.filter((thread) => thread.received && !thread.archived).length);
  els.unreadCount.textContent = String(unreadCount);
  els.archivedCount.textContent = String(threads.filter((thread) => thread.archived).length);
  els.sentCount.textContent = String(threads.filter((thread) => thread.sent || thread.draft).length);
  els.mobileGameBadge.textContent = String(yourMoveCount);
  updateNotifications(unreadCount);
}

function getUnreadCount() {
  return threads.filter((thread) => thread.unread && !thread.archived && !handlePrefs(thread.otherHandle || "").muted).length;
}

function getYourMoveCount() {
  return gameRows.filter((game) => game.status === "active" && game.turn_handle === identity.handle).length;
}

function updateNotifications(unreadCount) {
  document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
  updateAppBadge(unreadCount);
  els.notificationStrip.hidden = unreadCount === 0;
  els.notificationStrip.setAttribute("aria-label", unreadCount ? "Show unread messages" : "No unread messages");
  els.notificationCount.textContent = String(unreadCount);
  els.notificationText.textContent = unreadCount === 1
    ? "You have 1 unread message."
    : `You have ${unreadCount} unread messages.`;
}

async function updateAppBadge(unreadCount) {
  try {
    if (unreadCount > 0 && "setAppBadge" in navigator) {
      await navigator.setAppBadge(unreadCount);
    } else if (unreadCount === 0 && "clearAppBadge" in navigator) {
      await navigator.clearAppBadge();
    }
  } catch {
    // Some mobile browsers expose app badges but only allow them when installed.
  }
}

function showUnreadMessages() {
  const unread = threads.filter((thread) => thread.unread && !thread.archived && !handlePrefs(thread.otherHandle || "").muted);
  if (!unread.length) return;
  activeFilter = "unread";
  activeId = unread[0].id;
  setSidebarOpen(false);
  render();
  document.querySelector(".threadmail-list")?.scrollIntoView({ block: "start" });
}

function maybeNotifyUnreadChange() {
  const unreadCount = getUnreadCount();
  if (notificationReady && unreadCount > lastUnreadCount) {
    playNotificationChime();
    showPhoneNotification(unreadCount, unreadCount - lastUnreadCount);
    setStatus(unreadCount === 1 ? "New message received." : `${unreadCount - lastUnreadCount} new messages received.`, "success");
  }
  lastUnreadCount = unreadCount;
  notificationReady = true;
  updateNotifications(unreadCount);
}

async function showPhoneNotification(unreadCount, newCount) {
  if (!settings.phoneNotifications || !("Notification" in window) || Notification.permission !== "granted") return;
  const newestUnread = threads.find((thread) => thread.unread && !thread.archived && !handlePrefs(thread.otherHandle || "").muted);
  const body = newestUnread
    ? `${newestUnread.from}: ${newestUnread.subject}`
    : newCount === 1
      ? "You have 1 new Threadmail message."
      : `You have ${newCount} new Threadmail messages.`;
  const options = {
    body,
    tag: "threadmail-unread",
    icon: "./threadmail-icon-192.png",
    badge: "./threadmail-icon-192.png",
    renotify: true,
    data: { url: "./threadmail.html", unreadCount }
  };

  try {
    const registration = await getNotificationRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(unreadCount === 1 ? "New Threadmail" : `${unreadCount} unread Threadmail messages`, options);
      return;
    }
    new Notification(unreadCount === 1 ? "New Threadmail" : `${unreadCount} unread Threadmail messages`, options);
  } catch {
    setStatus("Phone notification could not be shown, but the in-app badge still updated.", "error");
  }
}

async function getNotificationRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const ready = await navigator.serviceWorker.ready;
    return ready || await navigator.serviceWorker.getRegistration("./");
  } catch {
    return navigator.serviceWorker.getRegistration("./").catch(() => null);
  }
}

async function showTestNotification() {
  if (!("Notification" in window)) {
    setStatus("This browser does not support phone notifications.", "error");
    return;
  }
  if (Notification.permission !== "granted") {
    setStatus("Turn on phone notifications first.", "error");
    return;
  }
  try {
    const options = {
      body: "Threadmail notifications are working on this device.",
      tag: "threadmail-test",
      icon: "./threadmail-icon-192.png",
      badge: "./threadmail-icon-192.png",
      data: { url: "./threadmail.html" }
    };
    const registration = await getNotificationRegistration();
    if (registration?.showNotification) {
      await registration.showNotification("Threadmail Test", options);
    } else {
      new Notification("Threadmail Test", options);
    }
    setStatus("Test notification sent.", "success");
  } catch {
    setStatus("The test notification could not be shown on this device.", "error");
  }
}

function playNotificationChime() {
  if (!settings.notificationSounds) return;
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
    const avatar = getHandleAvatar(thread.otherHandle || thread.from);
    const game = gameForThread(thread);
    const yourMove = game?.status === "active" && game.turn_handle === identity.handle;
    button.className = `thread-item${thread.unread ? " is-unread" : ""}${thread.id === activeId ? " is-active" : ""}${game ? " has-game" : ""}${yourMove ? " is-your-move" : ""}`;
    button.innerHTML = `
      <span class="avatar-dot" style="--avatar-color: ${avatar.color}">${escapeHtml(avatar.initials)}</span>
      <div class="thread-item__meta">
        <span>${thread.time}</span>
        <span>${escapeHtml(thread.statusLabel || "")}</span>
        ${game ? `<span class="game-chip${yourMove ? " game-chip--move" : ""}">${escapeHtml(getGameTitle(game.type))} - ${escapeHtml(getGameBadgeText(game))}</span>` : ""}
        ${thread.starred ? "<span>Starred</span>" : ""}
        ${thread.pinned ? "<span>Pinned</span>" : ""}
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
  if (id !== activeId) {
    els.inlineReplyBody.value = "";
    activeChatQuery = "";
    els.chatSearch.value = "";
    els.inlineCallPicker.hidden = true;
    els.inlineGamePicker.hidden = true;
  }
  activeId = id;
  const thread = currentThread();
  if (thread?.unread && !thread.draft) {
    await markRemoteRead(thread.messageIds || [thread.id]);
  }
  render();
}

function renderDetail() {
  document.querySelector(".game-cardlet")?.remove();
  const thread = currentThread();
  els.emptyState.hidden = Boolean(thread);
  els.messageDetail.hidden = !thread;
  if (!thread) return;

  els.detailFrom.textContent = thread.from;
  els.detailSubject.textContent = thread.subject;
  els.detailMeta.textContent = `${thread.time} | ${thread.statusLabel || (thread.draft ? "Draft" : thread.archived ? "Archived" : thread.sent ? "Sent" : "Inbox")}`;
  els.chatSearchWrap.hidden = thread.draft;
  renderMessageBody(thread);
  renderGameAttachment(thread);
  renderReactions(thread);
  renderQuickReplies(thread);
  els.detailTags.innerHTML = "";
  for (const tag of thread.tags) {
    const item = document.createElement("span");
    item.textContent = tag;
    els.detailTags.append(item);
  }
  els.starButton.textContent = thread.starred ? "Starred" : "*";
  els.pinChatButton.textContent = thread.pinned ? "Unpin" : "Pin";
  els.archiveButton.textContent = thread.archived ? "Move To Inbox" : "Archive";
  els.unreadButton.textContent = thread.unread ? "Mark Read" : "Mark Unread";
  const handleState = handlePrefs(thread.otherHandle || "");
  els.muteButton.textContent = handleState.muted ? "Unmute" : "Mute";
  els.blockButton.textContent = handleState.blocked ? "Unblock" : "Block";
  els.unreadButton.disabled = thread.draft || !threadHasReceivedMessages(thread);
  els.replyButton.disabled = thread.draft || !thread.otherHandle;
  els.inlineReplyForm.hidden = thread.draft || !thread.otherHandle;
  els.addCallButton.disabled = thread.draft || !thread.otherHandle;
  els.addGameButton.disabled = thread.draft || !thread.otherHandle;
  els.photoButton.disabled = thread.draft || !thread.otherHandle;
  els.editMessageButton.disabled = thread.draft || !getEditableSentRow(thread);
  if (els.addGameButton.disabled) els.inlineGamePicker.hidden = true;
  if (els.addCallButton.disabled) els.inlineCallPicker.hidden = true;
}

function renderMessageBody(thread) {
  els.detailBody.innerHTML = "";
  if (Array.isArray(thread.rows) && thread.rows.length) {
    const rows = thread.rows.filter(matchesChatQuery);
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "chat-search-empty";
      empty.textContent = "No messages match that search.";
      els.detailBody.append(empty);
    }
    for (const row of rows) {
      appendChatBubble({
        label: row.isSent ? "You" : row.sender_handle,
        text: row.body,
        time: formatTime(row.created_at),
        isMine: row.isSent
      });
    }
  } else {
    const parts = String(thread.body || "").split("\n\n---\n\n");
    for (const part of parts) {
      const lines = part.split("\n");
      const header = lines[0] || thread.from;
      const text = lines.slice(1).join("\n").trim() || part;
      const isMine = header.toLowerCase() === "you" || header.toLowerCase().startsWith("you:");
      appendChatBubble({ label: header.replace(/:$/, ""), text, time: thread.time, isMine });
    }
  }
  if (isAiHandle(thread.otherHandle) && aiTyping) {
    appendTypingBubble("ThreadAI");
  } else {
    const typingHandle = activeTypingHandle(thread);
    if (typingHandle) appendTypingBubble(typingHandle);
  }
}

function appendChatBubble({ label, text, time, isMine }) {
  const callInvite = parseCallInvite(text);
  if (callInvite) {
    appendCallBubble({ label, invite: callInvite, time, isMine });
    return;
  }
  const voiceNote = parseVoiceNote(text);
  if (voiceNote) {
    appendVoiceBubble({ label, note: voiceNote, time, isMine });
    return;
  }
  const photo = parsePhoto(text);
  if (photo) {
    appendPhotoBubble({ label, photo, time, isMine });
    return;
  }
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${isMine ? "chat-bubble--me" : "chat-bubble--them"}`;
  const name = document.createElement("strong");
  name.textContent = label;
  const body = document.createElement("span");
  body.textContent = text;
  const stamp = document.createElement("time");
  stamp.textContent = time;
  bubble.append(name, body, stamp);
  els.detailBody.append(bubble);
}

function appendCallBubble({ label, invite, time, isMine }) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble call-bubble ${isMine ? "chat-bubble--me" : "chat-bubble--them"}`;
  const name = document.createElement("strong");
  name.textContent = label;
  const title = document.createElement("span");
  title.className = "call-bubble__title";
  title.textContent = `${getCallTitle(invite.type)} invite`;
  const detail = document.createElement("span");
  detail.textContent = invite.note || `Ready for a ${getCallTitle(invite.type).toLowerCase()}?`;
  bubble.append(name, title, detail);
  if (invite.url) {
    const link = document.createElement("a");
    link.href = invite.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Join Call";
    bubble.append(link);
  } else if (!isMine) {
    const actions = document.createElement("div");
    actions.className = "call-bubble__actions";
    for (const action of ["Accept", "Decline"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action;
      button.addEventListener("click", () => sendCallResponse(action.toLowerCase(), invite.type));
      actions.append(button);
    }
    bubble.append(actions);
  }
  const stamp = document.createElement("time");
  stamp.textContent = time;
  bubble.append(stamp);
  els.detailBody.append(bubble);
}

function appendVoiceBubble({ label, note, time, isMine }) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble media-bubble ${isMine ? "chat-bubble--me" : "chat-bubble--them"}`;
  const name = document.createElement("strong");
  name.textContent = label;
  const title = document.createElement("span");
  title.textContent = "Voice note";
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = note.url;
  const stamp = document.createElement("time");
  stamp.textContent = time;
  bubble.append(name, title, audio, stamp);
  els.detailBody.append(bubble);
}

function appendPhotoBubble({ label, photo, time, isMine }) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble media-bubble photo-bubble ${isMine ? "chat-bubble--me" : "chat-bubble--them"}`;
  const name = document.createElement("strong");
  name.textContent = label;
  const img = document.createElement("img");
  img.src = photo.url;
  img.alt = photo.name || "Threadmail photo";
  const stamp = document.createElement("time");
  stamp.textContent = time;
  bubble.append(name, img, stamp);
  els.detailBody.append(bubble);
}

function appendTypingBubble(handle) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--them chat-bubble--typing";
  const label = document.createElement("strong");
  label.textContent = handle;
  const body = document.createElement("span");
  body.className = "typing-dots";
  body.setAttribute("aria-label", "is typing");
  body.innerHTML = "<i></i><i></i><i></i>";
  bubble.append(label, body);
  els.detailBody.append(bubble);
}

function getHandleAvatar(handle) {
  const value = normalizeHandle(handle || "tm") || "tm";
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return {
    initials: value.slice(0, 2).toUpperCase(),
    color: `hsl(${hash} 74% 52%)`
  };
}

function renderReactions(thread) {
  els.reactionRow.innerHTML = "";
  if (thread.draft) return;
  const pref = threadPrefs(thread.id);
  for (const reaction of REACTIONS) {
    const active = pref.reactions?.includes(reaction);
    const button = document.createElement("button");
    button.type = "button";
    button.className = active ? "is-active" : "";
    button.textContent = `${reaction}${active ? " 1" : ""}`;
    button.addEventListener("click", () => toggleReaction(thread.id, reaction));
    els.reactionRow.append(button);
  }
}

function renderQuickReplies(thread) {
  els.quickReplies.innerHTML = "";
  if (thread.draft) return;
  if (isAiHandle(thread.otherHandle)) {
    for (const action of AI_QUICK_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", () => focusInlineReply(action.prompt));
      els.quickReplies.append(button);
    }
    return;
  }
  if (thread.sent) return;
  for (const reply of QUICK_REPLIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = reply;
    button.addEventListener("click", () => {
      focusInlineReply(reply);
    });
    els.quickReplies.append(button);
  }
}

function toggleReaction(threadId, reaction) {
  const pref = threadPrefs(threadId);
  pref.reactions = Array.isArray(pref.reactions) ? pref.reactions : [];
  if (pref.reactions.includes(reaction)) {
    pref.reactions = pref.reactions.filter((item) => item !== reaction);
  } else {
    pref.reactions.push(reaction);
  }
  savePrefs();
  render();
}

function renderFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
}

function render() {
  rebuildThreads();
  renderStats();
  renderUpgradePanels();
  renderSettings();
  renderFilters();
  renderList();
  renderDetail();
  renderHandleSuggestions();
  updateInviteLink();
}

function renderUpgradePanels() {
  renderGameLobby();
  renderContacts();
  renderGameHistory();
}

function renderGameLobby() {
  const activeGames = gameRows.filter((game) => game.status === "active");
  const yourMove = getYourMoveCount();
  els.gameLobbyCount.textContent = `${yourMove} your move`;
  els.gameLobbyList.innerHTML = activeGames.length ? "" : `<div class="compact-item"><strong>No active games</strong><p>Send one from compose.</p></div>`;
  for (const game of activeGames.slice(0, 8)) {
    const other = getGameOtherHandle(game);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "compact-item";
    button.innerHTML = `<strong>${escapeHtml(getGameTitle(game.type))} vs ${escapeHtml(other)}</strong><p>${escapeHtml(getGameBadgeText(game))} - ${escapeHtml(getGameRulesShort(game.type))}</p>`;
    button.addEventListener("click", () => openGameThread(game.id));
    els.gameLobbyList.append(button);
  }
}

function renderContacts() {
  const contacts = getKnownHandles();
  els.contactsCount.textContent = `${contacts.length} ${contacts.length === 1 ? "person" : "people"}`;
  els.contactList.innerHTML = contacts.length ? "" : `<div class="compact-item"><strong>No contacts yet</strong><p>Message someone to add them here.</p></div>`;
  contacts.sort((a, b) => Number(handlePrefs(b).pinned) - Number(handlePrefs(a).pinned) || a.localeCompare(b));
  for (const handle of contacts.slice(0, 8)) {
    const state = handlePrefs(handle);
    const avatar = getHandleAvatar(handle);
    const item = document.createElement("div");
    item.className = "compact-item contact-item";
    item.innerHTML = `
      <span class="avatar-dot" style="--avatar-color: ${avatar.color}">${escapeHtml(avatar.initials)}</span>
      <strong>${escapeHtml(handle)}${state.pinned ? " *" : ""}</strong>
      <p>${escapeHtml(isAiHandle(handle) ? "AI assistant" : getContactGameSummary(handle))}</p>
      <div class="contact-actions">
        <button type="button" data-action="pin">${state.pinned ? "Unpin" : "Pin"}</button>
      </div>`;
    item.addEventListener("click", (event) => {
      if (event.target.closest("[data-action='pin']")) {
        state.pinned = !state.pinned;
        savePrefs();
        renderContacts();
        return;
      }
      composeToHandle(handle);
    });
    els.contactList.append(item);
  }
}

function renderGameHistory() {
  const finished = gameRows.filter((game) => game.status !== "active");
  const wins = finished.filter((game) => (
    (game.status === "x_won" && game.x_handle === identity.handle) ||
    (game.status === "o_won" && game.o_handle === identity.handle)
  )).length;
  const draws = finished.filter((game) => game.status === "draw").length;
  const losses = Math.max(0, finished.length - wins - draws);
  els.gameHistorySummary.textContent = `${wins}W ${losses}L ${draws}D`;
  els.gameHistoryList.innerHTML = finished.length ? "" : `<div class="compact-item"><strong>No finished games</strong><p>Results will appear here.</p></div>`;
  if (finished.length) {
    const summary = document.createElement("div");
    summary.className = "compact-item";
    summary.innerHTML = `<strong>Record</strong><p>${wins} wins, ${losses} losses, ${draws} draws</p>`;
    els.gameHistoryList.append(summary);
  }
  for (const game of finished.slice(0, 8)) {
    const other = getGameOtherHandle(game);
    const item = document.createElement("div");
    item.className = "compact-item";
    item.innerHTML = `<strong>${escapeHtml(getGameTitle(game.type))} vs ${escapeHtml(other)}</strong><p>${escapeHtml(getGameOutcomeText(game))}</p>`;
    els.gameHistoryList.append(item);
  }
}

function renderSettings() {
  els.soundToggle.checked = settings.notificationSounds;
  els.keyboardSoundToggle.checked = settings.keyboardSounds;
  renderPhoneNotificationSetting();
  renderLockSetting();
  els.themeSelect.value = settings.theme || "dark";
  els.aiStyleSelect.value = settings.aiStyle || "friendly";
  applyTheme();
}

function renderPhoneNotificationSetting() {
  if (!("Notification" in window)) {
    els.phoneNotificationButton.disabled = true;
    els.testNotificationButton.disabled = true;
    els.phoneNotificationButton.textContent = "Notifications Unavailable";
    els.phoneNotificationStatus.textContent = "This browser does not support phone notifications for Threadmail.";
    return;
  }

  const permission = Notification.permission;
  if (permission === "granted" && settings.phoneNotifications) {
    els.phoneNotificationButton.disabled = false;
    els.testNotificationButton.disabled = false;
    els.phoneNotificationButton.textContent = "Phone Notifications On";
    els.phoneNotificationStatus.textContent = "Threadmail can pop up new-message notifications while it is installed or open.";
    return;
  }

  if (permission === "denied") {
    els.phoneNotificationButton.disabled = true;
    els.testNotificationButton.disabled = true;
    els.phoneNotificationButton.textContent = "Notifications Blocked";
    els.phoneNotificationStatus.textContent = "Turn notifications back on in your browser or phone settings.";
    return;
  }

  els.phoneNotificationButton.disabled = false;
  els.testNotificationButton.disabled = true;
  els.phoneNotificationButton.textContent = "Enable Phone Notifications";
  els.phoneNotificationStatus.textContent = "Tap once to allow Threadmail pop-up notifications, then use Test Notification.";
}

function openGameThread(gameId) {
  const thread = threads.find((entry) => entry.gameId === gameId);
  if (!thread) {
    setStatus("That game has no visible message yet.", "error");
    return;
  }
  activeId = thread.id;
  activeFilter = thread.sent ? "sent" : "inbox";
  setSidebarOpen(false);
  render();
}

function gameForThread(thread) {
  if (!thread?.gameId) return null;
  return gameRows.find((game) => game.id === thread.gameId) || null;
}

function getGameOtherHandle(game) {
  return game.x_handle === identity.handle ? game.o_handle : game.x_handle;
}

function getGameMyMark(game) {
  return identity.handle === game.x_handle ? "x" : "o";
}

function renderGameAttachment(thread) {
  const game = gameForThread(thread);
  if (!game) return;

  const card = document.createElement("section");
  card.className = "game-cardlet";
  const statusText = getGameStatusText(game);
  const other = getGameOtherHandle(game);
  const myMark = getGameMyMark(game).toUpperCase();
  card.innerHTML = `
    <div class="game-cardlet__top">
      <div>
        <span class="game-cardlet__label">Attached Game</span>
        <h3>${escapeHtml(getGameTitle(game.type))}</h3>
      </div>
      <span class="game-cardlet__status">${escapeHtml(statusText)}</span>
    </div>
    <div class="game-cardlet__players">
      <span>You are ${escapeHtml(myMark)}</span>
      <span>Opponent: ${escapeHtml(other)}</span>
      <span>${escapeHtml(getGameOutcomeText(game))}</span>
    </div>
    <details class="game-rules">
      <summary>Rules</summary>
      <p>${escapeHtml(getGameRules(game.type))}</p>
    </details>
    <div class="game-play-area"></div>
    <div class="game-cardlet__actions">
      <button type="button" data-game-action="rematch">Rematch</button>
      <button type="button" data-game-action="message">Message ${escapeHtml(other)}</button>
    </div>
  `;

  const playArea = card.querySelector(".game-play-area");
  if (game.type === "connect_four") renderConnectFour(game, playArea);
  else if (game.type === "battleship") renderBattleship(game, playArea);
  else if (game.type === "word_chain") renderWordChain(game, playArea);
  else renderTicTacToe(game, playArea);
  card.querySelector("[data-game-action='rematch']").addEventListener("click", () => openRematch(game));
  card.querySelector("[data-game-action='message']").addEventListener("click", () => composeToHandle(other));
  els.messageDetail.insertBefore(card, document.querySelector(".message-tools"));
}

function renderTicTacToe(game, container) {
  const boardEl = document.createElement("div");
  boardEl.className = "tic-board";
  boardEl.setAttribute("aria-label", "Tic-Tac-Toe board");
  const board = Array.isArray(game.board) ? game.board : ["", "", "", "", "", "", "", "", ""];
  const canMove = game.status === "active" && game.turn_handle === identity.handle;
  container.append(createGameHint(canMove ? "Your move: choose an empty square." : getWaitingHint(game)));
  board.forEach((value, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "tic-cell";
    cell.textContent = value.toUpperCase();
    cell.disabled = Boolean(value) || !canMove;
    cell.setAttribute("aria-label", `Square ${index + 1}`);
    cell.addEventListener("click", () => playTicTacToeMove(game, index));
    boardEl.append(cell);
  });
  container.append(boardEl);
}

function renderConnectFour(game, container) {
  const boardEl = document.createElement("div");
  boardEl.className = "connect-board";
  boardEl.setAttribute("aria-label", "Connect Four board");
  const board = normalizeConnectBoard(game.board);
  const canMove = game.status === "active" && game.turn_handle === identity.handle;
  container.append(createGameHint(canMove ? "Your move: tap a column to drop your disc." : getWaitingHint(game)));
  board.forEach((value, index) => {
    const column = index % 7;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `connect-cell${value ? ` is-${value}` : ""}`;
    cell.disabled = !canMove || Boolean(value) || !canDropInColumn(board, column);
    cell.setAttribute("aria-label", `Column ${column + 1}`);
    cell.addEventListener("click", () => playConnectFourMove(game, column));
    boardEl.append(cell);
  });
  container.append(boardEl);
}

function renderWordChain(game, container) {
  const words = Array.isArray(game.board) ? game.board : [];
  const canMove = game.status === "active" && game.turn_handle === identity.handle;
  const wrapper = document.createElement("section");
  wrapper.className = "word-chain";
  const lastWord = words[words.length - 1] || "";
  wrapper.innerHTML = `
    <p class="game-hint">${escapeHtml(canMove ? "Your move: send a word that follows the chain." : getWaitingHint(game))}</p>
    <div class="word-chain__words">${words.length ? words.map((word) => `<span>${escapeHtml(word)}</span>`).join("") : "<span>No words yet</span>"}</div>
    <p>${lastWord ? `Next word must start with "${escapeHtml(lastWord.slice(-1).toUpperCase())}".` : "Start with any word."}</p>
  `;
  if (canMove) {
    const entry = document.createElement("div");
    entry.className = "word-chain__entry";
    entry.innerHTML = `
      <input type="text" placeholder="Type a word" data-touch-input>
      <button class="play-button play-button--ghost" type="button">Send Word</button>
    `;
    const input = entry.querySelector("input");
    entry.querySelector("button").addEventListener("click", () => playWordChainMove(game, input.value));
    wrapper.append(entry);
  }
  container.append(wrapper);
}

function renderBattleship(game, container) {
  const board = normalizeBattleshipBoard(game.board);
  const mark = identity.handle === game.x_handle ? "x" : "o";
  const enemyMark = mark === "x" ? "o" : "x";
  const canMove = game.status === "active" && game.turn_handle === identity.handle;
  const wrapper = document.createElement("section");
  wrapper.className = "battleship";
  wrapper.innerHTML = `
    <p class="game-hint">${escapeHtml(canMove ? "Your move: fire at Enemy Waters." : getWaitingHint(game))}</p>
    <p>Fleet left: ${countBattleshipFleetLeft(board, mark)} yours, ${countBattleshipFleetLeft(board, enemyMark)} enemy.</p>
    <div class="battleship__grids"></div>
  `;

  const grids = wrapper.querySelector(".battleship__grids");
  grids.append(createBattleshipGrid("Your Fleet", board, mark, false, canMove));
  grids.append(createBattleshipGrid("Enemy Waters", board, mark, true, canMove));
  if (!(board.shots[enemyMark] || []).length && game.status === "active") {
    const shuffle = document.createElement("button");
    shuffle.type = "button";
    shuffle.className = "play-button play-button--ghost";
    shuffle.textContent = "Shuffle Fleet";
    shuffle.addEventListener("click", () => shuffleBattleshipFleet(game, mark));
    wrapper.append(shuffle);
  }
  container.append(wrapper);
}

function createBattleshipGrid(title, board, mark, isEnemyGrid, canMove) {
  const enemyMark = mark === "x" ? "o" : "x";
  const targetMark = isEnemyGrid ? enemyMark : mark;
  const shotMark = isEnemyGrid ? mark : enemyMark;
  const wrap = document.createElement("section");
  wrap.className = "battleship__grid-wrap";
  wrap.innerHTML = `<h4>${escapeHtml(title)}</h4>`;

  const grid = document.createElement("div");
  grid.className = "battleship-board";
  grid.setAttribute("aria-label", title);
  const shots = board.shots[shotMark] || [];
  const ships = board.ships[targetMark] || [];

  for (let index = 0; index < board.size * board.size; index += 1) {
    const wasShot = shots.includes(index);
    const hasShip = ships.includes(index);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "battle-cell";
    if (!isEnemyGrid && hasShip) cell.classList.add("is-ship");
    if (wasShot) cell.classList.add(hasShip ? "is-hit" : "is-miss");
    cell.textContent = wasShot ? (hasShip ? "Hit" : "Miss") : (!isEnemyGrid && hasShip ? "Ship" : "");
    cell.disabled = !isEnemyGrid || !canMove || wasShot;
    cell.setAttribute("aria-label", `${title} square ${index + 1}`);
    cell.addEventListener("click", () => playBattleshipMove(board, game, index));
    grid.append(cell);
  }

  wrap.append(grid);
  return wrap;
}

function getGameTitle(type) {
  if (type === "connect_four") return "Connect Four";
  if (type === "battleship") return "Battleship";
  if (type === "word_chain") return "Word Chain";
  return "Tic-Tac-Toe";
}

function getGameRulesShort(type) {
  if (type === "connect_four") return "drop four in a row";
  if (type === "battleship") return "sink the fleet";
  if (type === "word_chain") return "chain valid words";
  return "three in a row";
}

function getCallTitle(type) {
  if (type === "voice") return "Voice Call";
  if (type === "video") return "Video Call";
  return "FaceTime/Meet";
}

function buildCallInviteBody(type, url = "") {
  const note = url ? "Join when you are ready." : "Reply when you are ready and we can start.";
  return `${CALL_INVITE_PREFIX}${JSON.stringify({ type, url, note })}\n${getCallTitle(type)} invite. ${note}`;
}

function parseCallInvite(value) {
  const text = String(value || "");
  if (!text.startsWith(CALL_INVITE_PREFIX)) return null;
  const firstLine = text.split("\n")[0].slice(CALL_INVITE_PREFIX.length);
  try {
    const invite = JSON.parse(firstLine);
    return {
      type: ["voice", "video", "link"].includes(invite.type) ? invite.type : "video",
      url: /^https?:\/\//i.test(invite.url || "") ? invite.url : "",
      note: String(invite.note || "").slice(0, 160)
    };
  } catch {
    return { type: "video", url: "", note: "Ready for a call?" };
  }
}

function parsePrefixedJson(value, prefix) {
  const text = String(value || "");
  if (!text.startsWith(prefix)) return null;
  const firstLine = text.split("\n")[0].slice(prefix.length);
  try {
    return JSON.parse(firstLine);
  } catch {
    return null;
  }
}

function buildVoiceNoteBody(url) {
  return `${VOICE_NOTE_PREFIX}${JSON.stringify({ url })}\nVoice note`;
}

function parseVoiceNote(value) {
  const note = parsePrefixedJson(value, VOICE_NOTE_PREFIX);
  return note?.url ? { url: String(note.url) } : null;
}

function buildPhotoBody(url, name) {
  return `${PHOTO_PREFIX}${JSON.stringify({ url, name })}\nPhoto: ${name || "image"}`;
}

function parsePhoto(value) {
  const photo = parsePrefixedJson(value, PHOTO_PREFIX);
  return photo?.url ? { url: String(photo.url), name: String(photo.name || "Threadmail photo") } : null;
}

function getEditableSentRow(thread) {
  if (!thread?.rows?.length) return null;
  return [...thread.rows].reverse().find((row) => row.sender_handle === identity.handle && !row.game_id);
}

function getGameRules(type) {
  if (type === "connect_four") return "Players take turns dropping discs into columns. First to connect four horizontally, vertically, or diagonally wins.";
  if (type === "battleship") return "Each player has a hidden fleet. Fire at enemy waters on your turn. Hits reveal ships, misses mark water. Sink every enemy ship to win.";
  if (type === "word_chain") return "Players take turns sending words. Each new word must start with the last letter of the previous word and cannot repeat an earlier word.";
  return "Players take turns placing marks. First to get three in a row wins. If all squares fill with no winner, it is a draw.";
}

function getGameStatusText(game) {
  if (game.status === "draw") return "Draw";
  if (game.status === "x_won") return `${game.x_handle} won`;
  if (game.status === "o_won") return `${game.o_handle} won`;
  return game.turn_handle === identity.handle ? "Your move" : `${game.turn_handle}'s move`;
}

function getGameBadgeText(game) {
  if (game.status === "active") return game.turn_handle === identity.handle ? "Your move" : "Waiting";
  if (game.status === "draw") return "Draw";
  const myMark = getGameMyMark(game);
  return game.status === `${myMark}_won` ? "You won" : "You lost";
}

function getGameOutcomeText(game) {
  if (game.status === "active") return game.turn_handle === identity.handle ? "Your move" : `Waiting for ${game.turn_handle}`;
  if (game.status === "draw") return "Finished as a draw";
  const winner = game.status === "x_won" ? game.x_handle : game.o_handle;
  return winner === identity.handle ? "You won" : `${winner} won`;
}

function getWaitingHint(game) {
  if (game.status !== "active") return getGameOutcomeText(game);
  return game.turn_handle === identity.handle ? "Your move." : `Waiting for ${game.turn_handle}.`;
}

function createGameHint(text) {
  const hint = document.createElement("p");
  hint.className = "game-hint";
  hint.textContent = text;
  return hint;
}

function getContactGameSummary(handle) {
  const games = gameRows.filter((game) => game.x_handle === handle || game.o_handle === handle);
  if (!games.length) return "No games together yet";
  const finished = games.filter((game) => game.status !== "active");
  const wins = finished.filter((game) => (
    (game.status === "x_won" && game.x_handle === identity.handle) ||
    (game.status === "o_won" && game.o_handle === identity.handle)
  )).length;
  const draws = finished.filter((game) => game.status === "draw").length;
  const losses = Math.max(0, finished.length - wins - draws);
  const active = games.length - finished.length;
  return `${games.length} games: ${wins}W ${losses}L ${draws}D${active ? `, ${active} active` : ""}`;
}

function openRematch(game) {
  const other = getGameOtherHandle(game);
  composeToHandle(other);
  pendingGameType = game.type;
  els.composeSubject.value = `${getGameTitle(game.type)} rematch`;
  els.composeBody.value = `Rematch? I started another ${getGameTitle(game.type)} game.`;
  updateGameAttachLabel();
  saveComposeAutosave();
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
  const saved = mode === "new" ? loadComposeAutosave() : null;
  replyToId = mode === "reply" ? activeId : null;
  const isReply = mode === "reply";
  els.composePanel.classList.toggle("is-chat-reply", isReply);
  els.composeTitle.textContent = isReply && thread?.otherHandle ? `Reply to ${thread.otherHandle}` : "New Message";
  els.composeTo.value = mode === "reply" && thread ? (thread.otherHandle || thread.from.replace(/^You to\s+/i, "")) : (saved?.to || getInviteHandle());
  els.composeSubject.value = mode === "reply" && thread ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : (saved?.subject || "");
  els.composeBody.value = mode === "reply" ? "" : (saved?.body || "");
  els.composePanel.hidden = false;
  if (isReply) els.composeBody.focus();
  else els.composeTo.focus();
  updateInviteLink();
  renderHandleSuggestions();
}

function focusInlineReply(text = "") {
  const thread = currentThread();
  if (!thread || thread.draft || !thread.otherHandle) return;
  if (text) els.inlineReplyBody.value = text;
  els.inlineCallPicker.hidden = true;
  els.inlineGamePicker.hidden = true;
  els.inlineReplyBody.focus();
}

function toggleInlineCallPicker() {
  const thread = currentThread();
  if (!thread || thread.draft || !thread.otherHandle) return;
  els.inlineGamePicker.hidden = true;
  els.inlineCallPicker.hidden = !els.inlineCallPicker.hidden;
}

function toggleInlineGamePicker() {
  const thread = currentThread();
  if (!thread || thread.draft || !thread.otherHandle) return;
  els.inlineCallPicker.hidden = true;
  els.inlineGamePicker.hidden = !els.inlineGamePicker.hidden;
}

function composeToHandle(handle) {
  openCompose("new");
  els.composeTo.value = handle;
  updateInviteLink();
  saveComposeAutosave();
  els.composeSubject.focus();
  setSidebarOpen(false);
}

function composeToAi() {
  const thread = currentThread();
  composeToHandle(AI_HANDLE);
  if (thread && !isAiHandle(thread.otherHandle) && !thread.draft) {
    els.composeSubject.value = `ThreadAI help: ${thread.subject.replace(/^Re:\s*/i, "")}`;
    els.composeBody.value = buildAiContextPrompt(thread);
  } else if (!els.composeSubject.value.trim()) {
    els.composeSubject.value = "Chat with ThreadAI";
  }
  els.composeBody.focus();
  setStatus("ThreadAI chat ready. Type a message to begin.", "success");
  saveComposeAutosave();
}

function buildAiContextPrompt(thread) {
  const rows = Array.isArray(thread.rows) && thread.rows.length
    ? thread.rows.slice(-10).map((row) => `${row.isSent ? "Me" : row.sender_handle}: ${row.body}`).join("\n")
    : `${thread.from}: ${thread.body}`;
  return `Help me with this conversation.

Conversation:
${rows}

What I need:
`;
}

function closeComposePanel() {
  els.composePanel.hidden = true;
  els.composePanel.classList.remove("is-chat-reply");
  replyToId = null;
  els.handleSuggestions.hidden = true;
  pendingGameType = "";
  updateGameAttachLabel();
  saveComposeAutosave();
}

function loadComposeAutosave() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

function saveComposeAutosave() {
  if (els.composePanel.hidden) return;
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
    to: els.composeTo.value,
    subject: els.composeSubject.value,
    body: els.composeBody.value
  }));
}

function clearComposeAutosave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

function getInviteHandle() {
  return normalizeHandle(new URLSearchParams(window.location.search).get("to") || "");
}

function updateInviteLink() {
  const handle = normalizeHandle(els.composeTo.value);
  if (!handle) {
    els.inviteLink.textContent = "Invite link appears after you enter a handle.";
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("to", handle);
  els.inviteLink.textContent = url.toString();
}

function getKnownHandles() {
  const handles = new Set();
  for (const row of messageRows) {
    if (row.sender_handle && row.sender_handle !== identity.handle) handles.add(row.sender_handle);
    if (row.recipient_handle && row.recipient_handle !== identity.handle) handles.add(row.recipient_handle);
  }
  handles.delete(AI_HANDLE);
  return [...handles].sort();
}

function renderHandleSuggestions() {
  const query = normalizeHandle(els.composeTo.value);
  const matches = query
    ? getKnownHandles().filter((handle) => handle.startsWith(query)).slice(0, 5)
    : [];
  els.handleSuggestions.innerHTML = "";
  els.handleSuggestions.hidden = matches.length === 0 || els.composePanel.hidden;

  for (const handle of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "handle-suggestion";
    button.textContent = handle;
    button.addEventListener("click", () => {
      els.composeTo.value = handle;
      els.handleSuggestions.hidden = true;
      updateInviteLink();
      saveComposeAutosave();
      els.composeSubject.focus();
    });
    els.handleSuggestions.append(button);
  }
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stopDictation() {
  if (speechRecognizer) speechRecognizer.stop();
}

function clearDictationState() {
  speechButton?.classList.remove("is-listening");
  speechButton = null;
  speechTarget = null;
  speechRecognizer = null;
}

function appendDictatedText(field, text) {
  const clean = String(text || "").trim();
  if (!field || !clean) return;
  const spacer = field.value && !/\s$/.test(field.value) ? " " : "";
  field.value = `${field.value}${spacer}${clean}`;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.focus();
}

function startDictation(field, button) {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    setStatus("Dictation is not available in this browser.", "error");
    field.focus();
    return;
  }
  if (speechRecognizer) {
    const sameTarget = speechTarget === field;
    stopDictation();
    clearDictationState();
    if (sameTarget) return;
  }

  speechTarget = field;
  speechButton = button;
  speechRecognizer = new SpeechRecognition();
  speechRecognizer.lang = navigator.language || "en-US";
  speechRecognizer.interimResults = false;
  speechRecognizer.maxAlternatives = 1;
  speechButton.classList.add("is-listening");
  setStatus("Listening...", "neutral");

  speechRecognizer.addEventListener("result", (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    appendDictatedText(field, transcript);
    setStatus("Dictation added.", "success");
  });
  speechRecognizer.addEventListener("error", () => {
    setStatus("Could not hear dictation. Try again.", "error");
  });
  speechRecognizer.addEventListener("end", clearDictationState);
  speechRecognizer.start();
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
  if (handlePrefs(recipient).blocked) {
    setStatus("Unblock that handle before sending.", "error");
    return;
  }
  if (!subject) {
    setStatus("Add a subject before sending.", "error");
    els.composeSubject.focus();
    return;
  }
  if (!body) {
    setStatus("Type a message before sending.", "error");
    els.composeBody.focus();
    return;
  }

  setStatus("Sending message...", "neutral");
  try {
    let gameId = null;
    if (pendingGameType) {
      gameId = await createGame(sender, recipient, pendingGameType);
      if (!gameId) return;
    }

    const message = {
      sender_handle: sender,
      recipient_handle: recipient,
      subject,
      body: replyToId ? `${body}\n\n--- Reply sent from Threadmail. ---` : body
    };
    if (gameId) message.game_id = gameId;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify([message])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Message could not be sent.");
      return;
    }
    sendTypingState({ recipient, subject, isTyping: false });
    els.offlineBanner.hidden = true;
    tableReady = true;
    clearComposeAutosave();
    closeComposePanel();
    setStatus(`Message sent to ${recipient}.`, "success");
    mergeReturnedMessages(payload);
    if (isAiHandle(recipient)) {
      activeId = findConversationThreadId(recipient, subject) || (Array.isArray(payload) ? payload[0]?.id || activeId : activeId);
      activeFilter = "sent";
      render();
      await handleAiAssistantMessage({ sender, subject, body });
      return;
    }
    await fetchMessages();
    activeId = Array.isArray(payload) ? payload[0]?.id || activeId : activeId;
    activeFilter = "sent";
    render();
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

async function sendInlineReply() {
  const thread = currentThread();
  const sender = identity.handle;
  const recipient = normalizeHandle(thread?.otherHandle || "");
  const subject = thread?.subject ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : "";
  const body = els.inlineReplyBody.value.trim();

  if (!thread || thread.draft || !recipient) return;
  if (!isValidHandle(sender)) {
    setStatus("Save your handle before replying.", "error");
    els.identityHandle.focus();
    return;
  }
  if (handlePrefs(recipient).blocked) {
    setStatus("Unblock that handle before replying.", "error");
    return;
  }
  if (!body) {
    els.inlineReplyBody.focus();
    return;
  }

  setStatus("Sending reply...", "neutral");
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
        body
      }])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Reply could not be sent.");
      return;
    }
    sendTypingState({ recipient, subject, isTyping: false });
    els.inlineReplyBody.value = "";
    els.offlineBanner.hidden = true;
    tableReady = true;
    setStatus(`Reply sent to ${recipient}.`, "success");
    mergeReturnedMessages(payload);
    rebuildThreads();
    activeId = findConversationThreadId(recipient, subject) || (Array.isArray(payload) ? payload[0]?.id || activeId : activeId);
    if (isAiHandle(recipient)) activeFilter = "sent";
    else if (activeFilter === "unread") activeFilter = "inbox";
    render();
    focusInlineReply();
    if (isAiHandle(recipient)) {
      await handleAiAssistantMessage({ sender, subject, body });
      focusInlineReply();
      return;
    }
    await fetchMessages();
    activeId = findConversationThreadId(recipient, subject) || activeId;
    render();
    focusInlineReply();
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

async function sendThreadUtilityMessage(body, statusLabel = "Message") {
  const thread = currentThread();
  const sender = identity.handle;
  const recipient = normalizeHandle(thread?.otherHandle || "");
  const subject = thread?.subject ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : statusLabel;

  if (!thread || thread.draft || !recipient) return false;
  if (!isValidHandle(sender)) {
    setStatus("Save your handle before sending.", "error");
    els.identityHandle.focus();
    return false;
  }
  if (handlePrefs(recipient).blocked) {
    setStatus("Unblock that handle before sending.", "error");
    return false;
  }

  setStatus(`Sending ${statusLabel.toLowerCase()}...`, "neutral");
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
        body
      }])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, `${statusLabel} could not be sent.`);
      return false;
    }
    els.offlineBanner.hidden = true;
    tableReady = true;
    setStatus(`${statusLabel} sent to ${recipient}.`, "success");
    mergeReturnedMessages(payload);
    rebuildThreads();
    activeId = findConversationThreadId(recipient, subject) || (Array.isArray(payload) ? payload[0]?.id || activeId : activeId);
    if (activeFilter === "unread") activeFilter = "inbox";
    render();
    await fetchMessages();
    activeId = findConversationThreadId(recipient, subject) || activeId;
    render();
    return true;
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
    return false;
  }
}

async function sendCallResponse(action, type) {
  const title = getCallTitle(type).toLowerCase();
  const body = action === "accept"
    ? `I can join the ${title}.`
    : `I cannot join the ${title} right now.`;
  await sendThreadUtilityMessage(body, action === "accept" ? "Call accepted" : "Call declined");
}

async function sendInlineGame(type) {
  const thread = currentThread();
  const sender = identity.handle;
  const recipient = normalizeHandle(thread?.otherHandle || "");
  const title = getGameTitle(type);
  const subject = thread?.subject || `${title} challenge`;

  if (!thread || thread.draft || !recipient) return;
  if (!isValidHandle(sender)) {
    setStatus("Save your handle before sending a game.", "error");
    els.identityHandle.focus();
    return;
  }
  if (handlePrefs(recipient).blocked) {
    setStatus("Unblock that handle before sending a game.", "error");
    return;
  }

  setStatus(`Starting ${title}...`, "neutral");
  try {
    const gameId = await createGame(sender, recipient, type);
    if (!gameId) return;

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
        body: `I started a ${title} game. ${getGameRules(type)}`,
        game_id: gameId
      }])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Game message could not be sent.");
      return;
    }
    els.inlineGamePicker.hidden = true;
    els.offlineBanner.hidden = true;
    tableReady = true;
    setStatus(`${title} sent to ${recipient}.`, "success");
    mergeReturnedMessages(payload);
    rebuildThreads();
    activeId = findConversationThreadId(recipient, subject) || (Array.isArray(payload) ? payload[0]?.id || activeId : activeId);
    if (activeFilter === "unread") activeFilter = "inbox";
    render();
    await fetchMessages();
    activeId = findConversationThreadId(recipient, subject) || activeId;
    render();
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

async function sendInlineCall(type) {
  const thread = currentThread();
  const sender = identity.handle;
  const recipient = normalizeHandle(thread?.otherHandle || "");
  const subject = thread?.subject ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : "Call invite";
  let url = "";

  if (!thread || thread.draft || !recipient) return;
  if (!isValidHandle(sender)) {
    setStatus("Save your handle before sending a call invite.", "error");
    els.identityHandle.focus();
    return;
  }
  if (handlePrefs(recipient).blocked) {
    setStatus("Unblock that handle before sending a call invite.", "error");
    return;
  }
  if (type === "link") {
    url = window.prompt("Paste your FaceTime, Google Meet, or Zoom link:");
    if (url === null) return;
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      setStatus("Paste a call link that starts with http or https.", "error");
      return;
    }
  }

  setStatus("Sending call invite...", "neutral");
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
        body: buildCallInviteBody(type, url)
      }])
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Call invite could not be sent.");
      return;
    }
    els.inlineCallPicker.hidden = true;
    els.offlineBanner.hidden = true;
    tableReady = true;
    setStatus(`${getCallTitle(type)} invite sent to ${recipient}.`, "success");
    mergeReturnedMessages(payload);
    rebuildThreads();
    activeId = findConversationThreadId(recipient, subject) || (Array.isArray(payload) ? payload[0]?.id || activeId : activeId);
    if (activeFilter === "unread") activeFilter = "inbox";
    render();
    await fetchMessages();
    activeId = findConversationThreadId(recipient, subject) || activeId;
    render();
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

async function toggleVoiceNote() {
  if (voiceRecorder?.state === "recording") {
    voiceRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setStatus("Voice notes are not available in this browser.", "error");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks = [];
    voiceRecorder = new MediaRecorder(stream);
    voiceRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) voiceChunks.push(event.data);
    });
    voiceRecorder.addEventListener("stop", async () => {
      els.voiceNoteButton.textContent = "Voice Note";
      els.voiceNoteButton.classList.remove("is-listening");
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(voiceChunks, { type: voiceRecorder.mimeType || "audio/webm" });
      if (!blob.size) {
        setStatus("No voice note was recorded.", "error");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", async () => {
        await sendThreadUtilityMessage(buildVoiceNoteBody(String(reader.result)), "Voice note");
      });
      reader.readAsDataURL(blob);
    });
    voiceRecorder.start();
    els.voiceNoteButton.textContent = "Stop";
    els.voiceNoteButton.classList.add("is-listening");
    setStatus("Recording voice note...", "neutral");
  } catch {
    setStatus("Microphone permission was not allowed.", "error");
  }
}

function choosePhoto() {
  const thread = currentThread();
  if (!thread || thread.draft || !thread.otherHandle) return;
  els.photoInput.value = "";
  els.photoInput.click();
}

function sendSelectedPhoto() {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Choose an image file.", "error");
    return;
  }
  if (file.size > 900000) {
    setStatus("Choose a smaller photo for now.", "error");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    await sendThreadUtilityMessage(buildPhotoBody(String(reader.result), file.name), "Photo");
  });
  reader.readAsDataURL(file);
}

async function editLastSentMessage() {
  const thread = currentThread();
  const row = getEditableSentRow(thread);
  if (!row) {
    setStatus("No sent message in this chat can be edited.", "error");
    return;
  }
  const nextBody = window.prompt("Edit your last sent message:", row.body);
  if (nextBody === null) return;
  const body = nextBody.trim();
  if (!body) {
    setStatus("Edited message cannot be empty.", "error");
    return;
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify({ body: `${body}\n\n(edited)` })
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      handleSupabaseError(payload, "Message could not be edited.");
      return;
    }
    mergeReturnedMessages(payload);
    setStatus("Message edited.", "success");
    await fetchMessages();
  } catch {
    setStatus("Could not edit that message right now.", "error");
  }
}

async function createGame(sender, recipient, type) {
  const board = type === "connect_four"
    ? Array(42).fill("")
    : type === "battleship"
      ? createBattleshipBoard()
    : type === "word_chain"
      ? []
      : ["", "", "", "", "", "", "", "", ""];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${GAMES_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation"
    }),
    body: JSON.stringify([{
      type,
      x_handle: sender,
      o_handle: recipient,
      turn_handle: sender,
      board,
      status: "active"
    }])
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) {
    handleSupabaseError(payload, `Could not create ${getGameTitle(type)} game.`);
    return null;
  }
  return Array.isArray(payload) ? payload[0]?.id || null : null;
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
  clearComposeAutosave();
  closeComposePanel();
  activeId = draft.id;
  activeFilter = "sent";
  setStatus("Draft saved on this device.", "success");
  render();
}

async function fetchMessages() {
  if (!appUnlocked) return;
  const handle = identity.handle;
  if (!isValidHandle(handle)) {
    messageRows = [];
    setStatus("Choose a handle to send and receive messages.");
    render();
    return;
  }

  setStatus(`Checking messages for ${handle}...`);
  try {
    const query = buildMessagesQuery(handle, true);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?${query}`, {
      headers: getSupabaseHeaders()
    });
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      if (isMissingColumnError(payload)) {
        await fetchMessagesWithoutGames(handle);
        return;
      }
      handleSupabaseError(payload, "Could not load messages.");
      return;
    }
    tableReady = true;
    messageRows = Array.isArray(payload) ? payload : [];
    await fetchGames(handle);
    await fetchTypingIndicators(handle);
    setStatus(messageRows.length ? `Synced ${messageRows.length} message${messageRows.length === 1 ? "" : "s"} for ${handle}.` : `Inbox ready for ${handle}.`, "success");
    render();
    maybeNotifyUnreadChange();
  } catch {
    els.offlineBanner.hidden = false;
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
}

function buildMessagesQuery(handle, includeGameId) {
  const columns = ["id", "sender_handle", "recipient_handle", "subject", "body", "created_at", "read_at"];
  if (includeGameId) columns.push("game_id");
  return `or=(sender_handle.eq.${encodeURIComponent(handle)},recipient_handle.eq.${encodeURIComponent(handle)})&select=${columns.join(",")}&order=created_at.desc&limit=100`;
}

function mergeReturnedMessages(payload) {
  if (!Array.isArray(payload) || !payload.length) return;
  const returnedIds = new Set(payload.map((row) => row.id));
  messageRows = [...payload, ...messageRows.filter((row) => !returnedIds.has(row.id))];
}

async function fetchMessagesWithoutGames(handle) {
  const query = buildMessagesQuery(handle, false);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?${query}`, {
    headers: getSupabaseHeaders()
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) {
    handleSupabaseError(payload, "Could not load messages.");
    return;
  }
  els.offlineBanner.hidden = true;
  tableReady = true;
  gameRows = [];
  messageRows = Array.isArray(payload) ? payload.map((row) => ({ ...row, game_id: null })) : [];
  await fetchTypingIndicators(handle);
  setStatus("Messages loaded. Run supabase/threadmail-messages.sql once to turn game attachments back on.", "error");
  render();
  maybeNotifyUnreadChange();
}

async function fetchGames(handle) {
  const query = `or=(x_handle.eq.${encodeURIComponent(handle)},o_handle.eq.${encodeURIComponent(handle)})&select=id,type,x_handle,o_handle,board,turn_handle,status,last_message_id,created_at,updated_at&order=updated_at.desc&limit=100`;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${GAMES_TABLE}?${query}`, {
    headers: getSupabaseHeaders()
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) {
    handleSupabaseError(payload, "Could not load games.");
    gameRows = [];
    return;
  }
  els.offlineBanner.hidden = true;
  gameRows = Array.isArray(payload) ? payload : [];
}

async function fetchTypingIndicators(handle = identity.handle) {
  if (!isValidHandle(handle)) return;
  const since = new Date(Date.now() - 9000).toISOString();
  const query = `recipient_handle=eq.${encodeURIComponent(handle)}&is_typing=eq.true&updated_at=gt.${encodeURIComponent(since)}&select=sender_handle,recipient_handle,subject_key,is_typing,updated_at`;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TYPING_TABLE}?${query}`, {
      headers: getSupabaseHeaders()
    });
    const payload = await response.json().catch(() => ([]));
    typingRows = response.ok && Array.isArray(payload) ? payload : [];
  } catch {
    typingRows = [];
  }
}

async function sendTypingState({ recipient, subject, isTyping }) {
  if (!isValidHandle(identity.handle) || !isValidHandle(recipient) || recipient === identity.handle) return;
  const subjectKey = getTypingSubjectKey(subject || "Chat");
  if (!subjectKey) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TYPING_TABLE}?on_conflict=sender_handle,recipient_handle,subject_key`, {
      method: "POST",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify([{
        sender_handle: identity.handle,
        recipient_handle: recipient,
        subject_key: subjectKey,
        is_typing: Boolean(isTyping),
        updated_at: new Date().toISOString()
      }])
    });
  } catch {
    // Typing indicators are optional; messaging should keep working without them.
  }
}

function queueTypingSignal({ recipient, subject }) {
  const now = Date.now();
  if (now - lastTypingSentAt > 1800) {
    lastTypingSentAt = now;
    sendTypingState({ recipient, subject, isTyping: true });
  }
  window.clearTimeout(typingIdleTimer);
  typingIdleTimer = window.setTimeout(() => {
    sendTypingState({ recipient, subject, isTyping: false });
  }, 3500);
}

function sendActiveTypingSignal() {
  const thread = currentThread();
  if (!thread || thread.draft || !thread.otherHandle) return;
  queueTypingSignal({ recipient: thread.otherHandle, subject: thread.subject });
}

function sendComposeTypingSignal() {
  const recipient = normalizeHandle(els.composeTo.value);
  if (!recipient) return;
  queueTypingSignal({ recipient, subject: els.composeSubject.value.trim() || "New Message" });
}

async function playTicTacToeMove(game, index) {
  const board = Array.isArray(game.board) ? [...game.board] : ["", "", "", "", "", "", "", "", ""];
  if (game.status !== "active" || game.turn_handle !== identity.handle || board[index]) return;
  const mark = identity.handle === game.x_handle ? "x" : "o";
  board[index] = mark;
  const nextStatus = getTicTacToeStatus(board);
  await saveGameMove(game, board, nextStatus, mark);
}

async function playConnectFourMove(game, column) {
  const board = normalizeConnectBoard(game.board);
  if (game.status !== "active" || game.turn_handle !== identity.handle || !canDropInColumn(board, column)) return;
  const mark = identity.handle === game.x_handle ? "x" : "o";
  for (let row = 5; row >= 0; row -= 1) {
    const index = row * 7 + column;
    if (!board[index]) {
      board[index] = mark;
      break;
    }
  }
  const nextStatus = getConnectFourStatus(board);
  await saveGameMove(game, board, nextStatus, mark);
}

async function playWordChainMove(game, rawWord) {
  const word = rawWord.trim().toLowerCase().replace(/[^a-z]/g, "");
  const words = Array.isArray(game.board) ? [...game.board] : [];
  const lastWord = words[words.length - 1] || "";
  if (game.status !== "active" || game.turn_handle !== identity.handle) return;
  if (word.length < 2) {
    setStatus("Word must be at least 2 letters.", "error");
    return;
  }
  if (words.includes(word)) {
    setStatus("That word was already used.", "error");
    return;
  }
  if (lastWord && word[0] !== lastWord.slice(-1)) {
    setStatus(`Word must start with "${lastWord.slice(-1).toUpperCase()}".`, "error");
    return;
  }
  words.push(word);
  const mark = identity.handle === game.x_handle ? "x" : "o";
  await saveGameMove(game, words, "active", mark);
}

async function playBattleshipMove(board, game, index) {
  if (game.status !== "active" || game.turn_handle !== identity.handle) return;
  const mark = identity.handle === game.x_handle ? "x" : "o";
  const enemyMark = mark === "x" ? "o" : "x";
  const nextBoard = normalizeBattleshipBoard(board);
  if (nextBoard.shots[mark].includes(index)) return;

  nextBoard.shots[mark].push(index);
  const enemyFleet = nextBoard.ships[enemyMark] || [];
  const nextStatus = enemyFleet.every((shipIndex) => nextBoard.shots[mark].includes(shipIndex))
    ? (mark === "x" ? "x_won" : "o_won")
    : "active";
  await saveGameMove(game, nextBoard, nextStatus, mark);
}

async function shuffleBattleshipFleet(game, mark) {
  const board = normalizeBattleshipBoard(game.board);
  const enemyMark = mark === "x" ? "o" : "x";
  if ((board.shots[enemyMark] || []).length) {
    setStatus("Fleet is locked after your opponent fires.", "error");
    return;
  }
  board.ships[mark] = createBattleshipFleet();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${GAMES_TABLE}?id=eq.${encodeURIComponent(game.id)}`, {
    method: "PATCH",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify({
      board,
      updated_at: new Date().toISOString()
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleSupabaseError(payload, "Could not shuffle your fleet.");
    return;
  }
  setStatus("Fleet shuffled.", "success");
  await fetchMessages();
}

async function saveGameMove(game, board, nextStatus, mark) {
  const nextTurn = mark === "x" ? game.o_handle : game.x_handle;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${GAMES_TABLE}?id=eq.${encodeURIComponent(game.id)}`, {
    method: "PATCH",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify({
      board,
      turn_handle: nextStatus === "active" ? nextTurn : game.turn_handle,
      status: nextStatus,
      updated_at: new Date().toISOString()
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleSupabaseError(payload, "Could not save that move.");
    return;
  }
  await sendGameMoveMessage(game, nextStatus, nextTurn);
  setStatus("Move sent.", "success");
  await fetchMessages();
}

async function sendGameMoveMessage(game, nextStatus, nextTurn) {
  const recipient = nextStatus === "active"
    ? nextTurn
    : (identity.handle === game.x_handle ? game.o_handle : game.x_handle);
  const body = nextStatus === "active"
    ? `${identity.handle} made a ${getGameTitle(game.type)} move. Your turn.\n\n${getGameRulesShort(game.type)}.`
    : `${identity.handle} made the final ${getGameTitle(game.type)} move. ${getGameOutcomeText({ ...game, status: nextStatus })}.`;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify([{
      sender_handle: identity.handle,
      recipient_handle: recipient,
      subject: nextStatus === "active" ? `${getGameTitle(game.type)} move` : `${getGameTitle(game.type)} finished`,
      body,
      game_id: game.id
    }])
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleSupabaseError(payload, "Move saved, but the turn message could not be sent.");
  }
}

function getTicTacToeStatus(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === "x" ? "x_won" : "o_won";
    }
  }
  return board.every(Boolean) ? "draw" : "active";
}

function normalizeConnectBoard(board) {
  const next = Array.isArray(board) ? [...board] : [];
  while (next.length < 42) next.push("");
  return next.slice(0, 42);
}

function canDropInColumn(board, column) {
  return !board[column];
}

function getConnectFourStatus(board) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const mark = board[row * 7 + col];
      if (!mark) continue;
      for (const [dc, dr] of directions) {
        let count = 1;
        for (let step = 1; step < 4; step += 1) {
          const nextRow = row + dr * step;
          const nextCol = col + dc * step;
          if (nextRow < 0 || nextRow >= 6 || nextCol < 0 || nextCol >= 7) break;
          if (board[nextRow * 7 + nextCol] !== mark) break;
          count += 1;
        }
        if (count === 4) return mark === "x" ? "x_won" : "o_won";
      }
    }
  }
  return board.every(Boolean) ? "draw" : "active";
}

function createBattleshipBoard() {
  return {
    size: 5,
    ships: {
      x: createBattleshipFleet(),
      o: createBattleshipFleet()
    },
    shots: {
      x: [],
      o: []
    }
  };
}

function createBattleshipFleet() {
  const fleet = [];
  const lengths = [3, 2];
  for (const length of lengths) {
    const ship = placeBattleshipShip(fleet, length);
    fleet.push(...ship);
  }
  return fleet;
}

function placeBattleshipShip(existing, length) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const horizontal = Math.random() > 0.5;
    const row = Math.floor(Math.random() * 5);
    const col = Math.floor(Math.random() * 5);
    if (horizontal && col + length > 5) continue;
    if (!horizontal && row + length > 5) continue;
    const cells = Array.from({ length }, (_, offset) => (
      horizontal ? row * 5 + col + offset : (row + offset) * 5 + col
    ));
    if (cells.every((cell) => !existing.includes(cell))) return cells;
  }
  return Array.from({ length }, (_, index) => index).filter((cell) => !existing.includes(cell));
}

function normalizeBattleshipBoard(board) {
  const next = board && typeof board === "object" && !Array.isArray(board) ? board : createBattleshipBoard();
  return {
    size: 5,
    ships: {
      x: normalizeBattleshipCells(next.ships?.x),
      o: normalizeBattleshipCells(next.ships?.o)
    },
    shots: {
      x: normalizeBattleshipCells(next.shots?.x),
      o: normalizeBattleshipCells(next.shots?.o)
    }
  };
}

function normalizeBattleshipCells(cells) {
  return Array.isArray(cells)
    ? cells.filter((cell) => Number.isInteger(cell) && cell >= 0 && cell < 25)
    : [];
}

function countBattleshipFleetLeft(board, mark) {
  const enemyMark = mark === "x" ? "o" : "x";
  const hits = board.shots[enemyMark] || [];
  return (board.ships[mark] || []).filter((cell) => !hits.includes(cell)).length;
}

async function markRemoteRead(ids) {
  const idList = Array.isArray(ids) ? ids : [ids];
  const now = new Date().toISOString();
  const unreadRows = messageRows.filter((entry) => idList.includes(entry.id) && entry.recipient_handle === identity.handle && !entry.read_at);
  if (!unreadRows.length) return;
  unreadRows.forEach((row) => { row.read_at = now; });
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=in.(${unreadRows.map((row) => encodeURIComponent(row.id)).join(",")})`, {
      method: "PATCH",
      headers: getSupabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }),
      body: JSON.stringify({ read_at: now })
    });
  } catch {
    setStatus("Message opened locally. Read status could not sync.", "error");
  }
}

async function setThreadReadState(thread, read) {
  const ids = thread.messageIds || [thread.id];
  const rows = messageRows.filter((entry) => ids.includes(entry.id) && entry.recipient_handle === identity.handle);
  if (!rows.length) return false;
  const nextReadAt = read ? new Date().toISOString() : null;
  rows.forEach((row) => { row.read_at = nextReadAt; });
  const queryIds = rows.map((row) => encodeURIComponent(row.id)).join(",");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=in.(${queryIds})`, {
    method: "PATCH",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify({ read_at: nextReadAt })
  });
  if (!response.ok) throw new Error("Read state sync failed.");
  return true;
}

async function deleteThread() {
  const thread = currentThread();
  if (!thread) return;
  if (thread.draft) {
    drafts = drafts.filter((draft) => draft.id !== thread.id);
    saveDrafts();
  } else {
    const ids = thread.messageIds || [thread.id];
    const queryIds = ids.map((id) => encodeURIComponent(id)).join(",");
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=in.(${queryIds})`, {
        method: "DELETE",
        headers: getSupabaseHeaders({ Prefer: "return=minimal" })
      });
      messageRows = messageRows.filter((row) => !ids.includes(row.id));
      setStatus("Conversation deleted.", "success");
    } catch {
      setStatus("Could not delete that message from Supabase.", "error");
    }
  }
  activeId = null;
  render();
}

function handleSupabaseError(payload, fallback) {
  const code = payload && typeof payload === "object" ? payload.code : "";
  if (code === "PGRST205" || code === "42P01" || isMissingColumnError(payload)) {
    tableReady = false;
    setStatus("Threadmail needs the updated Supabase setup tables. Run supabase/threadmail-messages.sql once.", "error");
  } else {
    setStatus(fallback || "Supabase returned an error.", "error");
  }
}

function isMissingColumnError(payload) {
  return payload?.code === "42703";
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    setSidebarOpen(false);
    render();
  });
});

els.mailSearch.addEventListener("input", () => {
  activeQuery = els.mailSearch.value.trim().toLowerCase();
  render();
});
els.chatSearch.addEventListener("input", () => {
  activeChatQuery = els.chatSearch.value.trim().toLowerCase();
  renderDetail();
});
els.notificationStrip.addEventListener("click", showUnreadMessages);
els.notificationStrip.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showUnreadMessages();
  }
});

els.composeTo.addEventListener("input", () => {
  renderHandleSuggestions();
  updateInviteLink();
  saveComposeAutosave();
});
els.composeSubject.addEventListener("input", saveComposeAutosave);
els.composeBody.addEventListener("input", () => {
  saveComposeAutosave();
  sendComposeTypingSignal();
});
els.composeDictateButton.addEventListener("click", () => startDictation(els.composeBody, els.composeDictateButton));
els.soundToggle.addEventListener("change", () => {
  settings.notificationSounds = els.soundToggle.checked;
  saveSettings();
});
els.keyboardSoundToggle.addEventListener("change", () => {
  settings.keyboardSounds = els.keyboardSoundToggle.checked;
  saveSettings();
});
els.phoneNotificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    setStatus("This browser does not support phone notifications.", "error");
    return;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  settings.phoneNotifications = permission === "granted";
  saveSettings();
  if (settings.phoneNotifications) await getNotificationRegistration();
  renderSettings();
  setStatus(
    settings.phoneNotifications
      ? "Phone notifications are on. Tap Test Notification to check this device."
      : "Phone notifications were not enabled.",
    settings.phoneNotifications ? "success" : "error"
  );
});
els.testNotificationButton.addEventListener("click", showTestNotification);
els.saveLockButton.addEventListener("click", () => {
  const code = els.lockCodeInput.value.trim();
  const recoveryEmail = normalizeEmail(els.lockEmailInput.value);
  if (code.length < 4) {
    setStatus("Use at least 4 numbers or letters for the app code.", "error");
    els.lockCodeInput.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
    setStatus("Add a recovery email before turning on app lock.", "error");
    els.lockEmailInput.focus();
    return;
  }
  lockSettings = { enabled: true, codeHash: encodeCode(code), recoveryEmail };
  appUnlocked = true;
  saveLockSettings();
  els.lockCodeInput.value = "";
  setStatus("App lock saved for this device.", "success");
  renderSettings();
});
els.disableLockButton.addEventListener("click", () => {
  lockSettings = { enabled: false, codeHash: "", recoveryEmail: "" };
  appUnlocked = true;
  saveLockSettings();
  setLockedView(false);
  setStatus("App lock disabled.", "success");
  renderSettings();
});
els.unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (encodeCode(els.unlockCode.value.trim()) === lockSettings.codeHash) {
    els.unlockCode.value = "";
    unlockApp();
    return;
  }
  els.lockStatus.textContent = "Wrong code.";
  els.unlockCode.select();
});
els.forgotLockButton.addEventListener("click", () => {
  els.lockRecovery.hidden = !els.lockRecovery.hidden;
  renderLockSetting();
});
els.sendCodeEmailButton.addEventListener("click", () => {
  if (!lockSettings.recoveryEmail) {
    els.lockStatus.textContent = "No recovery email was saved.";
    return;
  }
  pendingResetCode = createResetCode();
  els.resetLockButton.hidden = false;
  els.lockStatus.textContent = `Reset code sent to ${lockSettings.recoveryEmail}.`;
  window.location.href = `mailto:${encodeURIComponent(lockSettings.recoveryEmail)}?subject=Threadmail%20reset%20code&body=Your%20Threadmail%20reset%20code%20is%20${encodeURIComponent(pendingResetCode)}.%0A%0AEnter%20it%20on%20the%20locked%20screen%20to%20reset%20your%20app%20code.`;
});
els.resetLockButton.addEventListener("click", () => {
  if (!pendingResetCode) {
    els.lockStatus.textContent = "Send a reset code first.";
    return;
  }
  if (els.unlockCode.value.trim() !== pendingResetCode) {
    els.lockStatus.textContent = "Enter the emailed reset code in the code box.";
    els.unlockCode.focus();
    return;
  }
  lockSettings = { enabled: false, codeHash: "", recoveryEmail: lockSettings.recoveryEmail };
  appUnlocked = true;
  pendingResetCode = "";
  saveLockSettings();
  setLockedView(false);
  setStatus("App lock reset. Add a new code in Settings.", "success");
  renderSettings();
});
els.themeSelect.addEventListener("change", () => {
  settings.theme = els.themeSelect.value;
  saveSettings();
  applyTheme();
});
els.aiStyleSelect.addEventListener("change", () => {
  settings.aiStyle = els.aiStyleSelect.value;
  saveSettings();
  setStatus(`ThreadAI style set to ${settings.aiStyle}.`, "success");
});
els.clearLocalData.addEventListener("click", () => {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(DRAFTS_KEY);
  localStorage.removeItem(AUTOSAVE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  prefs = {};
  drafts = [];
  settings = loadSettings();
  setStatus("Local drafts, reactions, settings, and pins cleared.", "success");
  render();
});
els.attachTicTacToe.addEventListener("click", () => {
  selectGameAttachment("tic_tac_toe");
});
els.attachConnectFour.addEventListener("click", () => {
  selectGameAttachment("connect_four");
});
els.attachBattleship.addEventListener("click", () => {
  selectGameAttachment("battleship");
});
els.attachWordChain.addEventListener("click", () => {
  selectGameAttachment("word_chain");
});
els.clearGameAttach.addEventListener("click", () => {
  pendingGameType = "";
  updateGameAttachLabel();
});
els.mobileTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.mobileTab;
    if (tab === "inbox") {
      activeFilter = "inbox";
      setSidebarOpen(false);
      render();
      return;
    }
    setSidebarOpen(true);
    document.querySelector(`.${tab === "games" ? "game-lobby" : tab === "contacts" ? "contacts-panel" : "settings-panel"}`)?.scrollIntoView({ block: "start" });
  });
});
els.addPoll.addEventListener("click", () => appendMessageExtra("Poll", ["Option A", "Option B"]));
els.addChecklist.addEventListener("click", () => appendMessageExtra("Checklist", ["[ ] First item", "[ ] Second item"]));
els.addChoice.addEventListener("click", () => appendMessageExtra("Choose one", ["A:", "B:"]));

function selectGameAttachment(type) {
  pendingGameType = type;
  const title = getGameTitle(type);
  if (!els.composeSubject.value.trim()) els.composeSubject.value = `${title} challenge`;
  if (!els.composeBody.value.trim()) els.composeBody.value = `I started a ${title} game. ${getGameRules(type)}`;
  updateGameAttachLabel();
  saveComposeAutosave();
}

function updateGameAttachLabel() {
  els.gameAttachLabel.textContent = pendingGameType ? getGameTitle(pendingGameType) : "None";
}

async function requestAiAssistantReply({ sender, subject, body }) {
  const style = settings.aiStyle || "friendly";
  const response = await fetch(`${SUPABASE_URL}/functions/v1/threadmail-ai`, {
    method: "POST",
    headers: getSupabaseHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      handle: sender,
      subject,
      message: `[Preferred style: ${style}]\n${body}`,
      recent: messageRows
        .filter((row) => (
          (row.sender_handle === sender && row.recipient_handle === AI_HANDLE) ||
          (row.sender_handle === AI_HANDLE && row.recipient_handle === sender)
        ))
        .slice(0, 8)
        .reverse()
        .map((row) => ({
          from: row.sender_handle,
          body: row.body
        }))
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "AI assistant is not connected yet.");
  return String(payload.reply || "").trim();
}

async function insertAiAssistantReply({ recipient, subject, reply }) {
  if (!reply) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation"
    }),
    body: JSON.stringify([{
      sender_handle: AI_HANDLE,
      recipient_handle: recipient,
      subject,
      body: reply
    }])
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error("AI reply could not be saved.");
  mergeReturnedMessages(payload);
  return payload;
}

function buildBasicAiReply(body) {
  const raw = String(body || "").trim();
  const text = raw.toLowerCase();
  const opener = [
    "Here is a useful direction:",
    "I would handle it this way:",
    "Try this:",
    "A good next move is:"
  ][Math.floor(Date.now() / 1000) % 4];
  if (text.includes("conversation:") && text.includes("what i need:")) {
    return "I can help with this chat. Tell me the goal after 'What I need' like: make a friendly reply, apologize, say no politely, or make it shorter.";
  }
  if (/\b(hi|hello|hey)\b/.test(text)) {
    return "Hello. Ask me for a reply, a rewrite, a summary, or Threadmail ideas. If you paste the message you are working on, I can be much more specific.";
  }
  if (/\b(what should i say|reply|respond|answer)\b/.test(text)) {
    const quote = raw.match(/["']([^"']{12,300})["']/)?.[1];
    if (quote) return `You could say: "That sounds good. I am interested. What time works best for you?"\n\nIf you want, I can make it warmer, shorter, or more serious.`;
    return "Send me the message you are replying to, or open that chat and press ThreadAI. Then I can write the exact reply instead of guessing.";
  }
  if (text.includes("game")) {
    return `${opener} make game invites look like chat cards, show whose turn it is, and keep the board inside the conversation so playing feels part of messaging.`;
  }
  if (text.includes("upgrade") || text.includes("add") || text.includes("feature")) {
    return `${opener} add cleaner game invite cards, message search inside a chat, or custom themes. My pick is game invite cards because they make the app feel polished quickly.`;
  }
  if (text.includes("rewrite")) {
    return "Paste the message you want rewritten, and tell me the tone: nicer, shorter, more serious, or more excited.";
  }
  if (text.includes("summarize")) {
    return "I can summarize a thread best when the real AI backend is connected. In basic mode, paste the key messages and I will help condense them.";
  }
  if (text.includes("help")) {
    return "I can help with wording a message, planning a feature, improving a game, or deciding what to build next. Paste the message or describe the goal.";
  }
  if (text.includes("thank")) {
    return "You are welcome. Threadmail is getting sharper with each pass.";
  }
  return `${opener} give me the message or goal, and I will help shape it. For example: "make this sound nicer" or "what should I say to apologize?"`;
}

async function finishAiAssistantReply({ sender, subject, reply, statusMessage }) {
  await insertAiAssistantReply({ recipient: sender, subject, reply });
  aiTyping = false;
  rebuildThreads();
  activeId = findConversationThreadId(AI_HANDLE, subject) || activeId;
  activeFilter = "inbox";
  setStatus(statusMessage, "success");
  render();
  await fetchMessages();
  activeId = findConversationThreadId(AI_HANDLE, subject) || activeId;
  render();
}

async function handleAiAssistantMessage({ sender, subject, body }) {
  aiTyping = true;
  setStatus("ThreadAI is thinking...", "neutral");
  render();
  try {
    const reply = await requestAiAssistantReply({ sender, subject, body });
    await finishAiAssistantReply({ sender, subject, reply, statusMessage: "ThreadAI replied." });
  } catch {
    try {
      await finishAiAssistantReply({
        sender,
        subject,
        reply: buildBasicAiReply(body),
        statusMessage: "ThreadAI replied in basic mode."
      });
    } catch {
      aiTyping = false;
      setStatus("ThreadAI could not save a reply right now.", "error");
      render();
    }
  }
}

function appendMessageExtra(title, lines) {
  const block = `\n\n${title}\n${lines.join("\n")}`;
  els.composeBody.value = `${els.composeBody.value}${block}`.trimStart();
  els.composeBody.focus();
  saveComposeAutosave();
}

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
  setStatus(`Using shared handle ${nextHandle}. Messages to this handle go to everyone using it.`, "success");
  await fetchMessages();
});

els.refreshButton.addEventListener("click", fetchMessages);
els.starButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  threadPrefs(thread.id).starred = !thread.starred;
  savePrefs();
  render();
});

els.pinChatButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  threadPrefs(thread.id).pinned = !thread.pinned;
  savePrefs();
  setStatus(thread.pinned ? "Chat unpinned." : "Chat pinned.", "success");
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
  if (!thread || thread.draft) return;
  const markRead = thread.unread;
  try {
    const changed = await setThreadReadState(thread, markRead);
    if (!changed) return;
    setStatus(markRead ? "Conversation marked read." : "Conversation marked unread.", "success");
    render();
    await fetchMessages();
    activeId = thread.id;
    render();
  } catch {
    setStatus("Could not update read status.", "error");
    await fetchMessages();
  }
});

els.muteButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread?.otherHandle) return;
  const state = handlePrefs(thread.otherHandle);
  state.muted = !state.muted;
  savePrefs();
  render();
});

els.blockButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread?.otherHandle) return;
  const state = handlePrefs(thread.otherHandle);
  state.blocked = !state.blocked;
  savePrefs();
  activeId = null;
  render();
});

els.deleteButton.addEventListener("click", deleteThread);
els.replyButton.addEventListener("click", () => focusInlineReply());
els.addCallButton.addEventListener("click", toggleInlineCallPicker);
els.addGameButton.addEventListener("click", toggleInlineGamePicker);
els.photoButton.addEventListener("click", choosePhoto);
els.photoInput.addEventListener("change", sendSelectedPhoto);
els.editMessageButton.addEventListener("click", editLastSentMessage);
els.inlineCallPicker.querySelectorAll("[data-inline-call]").forEach((button) => {
  button.addEventListener("click", () => sendInlineCall(button.dataset.inlineCall));
});
els.inlineGamePicker.querySelectorAll("[data-inline-game]").forEach((button) => {
  button.addEventListener("click", () => sendInlineGame(button.dataset.inlineGame));
});
els.composeButton.addEventListener("click", () => openCompose("new"));
els.threadAiButton.addEventListener("click", composeToAi);
els.sidebarComposeButton.addEventListener("click", () => {
  openCompose("new");
  setSidebarOpen(false);
});
els.sidebarToggle.addEventListener("click", () => {
  setSidebarOpen(!document.body.classList.contains("sidebar-open"));
});
els.sidebarScrim.addEventListener("click", () => setSidebarOpen(false));
els.closeCompose.addEventListener("click", closeComposePanel);
els.saveDraft.addEventListener("click", saveDraft);
els.composeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});
els.composeSendButton.addEventListener("click", sendMessage);
els.inlineReplyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendInlineReply();
});
els.inlineReplySend.addEventListener("click", sendInlineReply);
els.inlineDictateButton.addEventListener("click", () => startDictation(els.inlineReplyBody, els.inlineDictateButton));
els.voiceNoteButton.addEventListener("click", toggleVoiceNote);
els.inlineReplyBody.addEventListener("input", sendActiveTypingSignal);
els.inlineReplyBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !event.shiftKey || event.isComposing) return;
  event.preventDefault();
  sendInlineReply();
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  if (event.key.toLowerCase() === "n") openCompose("new");
  if (event.key.toLowerCase() === "r") focusInlineReply();
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

document.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = Math.abs(touch.clientY - touchStartY);
  if (deltaY > 70 || Math.abs(deltaX) < 80) return;
  if (touchStartX < 36 && deltaX > 0) setSidebarOpen(true);
  if (deltaX < 0 && document.body.classList.contains("sidebar-open")) setSidebarOpen(false);
}, { passive: true });

updateTimeGreeting();
dismissTimeGreeting();
render();
setLockedView(!appUnlocked);
if (appUnlocked) {
  if (getInviteHandle()) openCompose("new");
  fetchMessages();
}
setInterval(updateTimeGreeting, 60000);
setInterval(fetchMessages, 15000);
setInterval(async () => {
  await fetchTypingIndicators();
  renderDetail();
}, 4000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./threadmail-sw.js").catch(() => {
      setStatus("Install mode is unavailable in this browser right now.", "error");
    });
  });
}
