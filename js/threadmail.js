const SUPABASE_URL = "https://jbljqusdpifdyewlenun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYq_rDXqj_Ate8B66PcJEQ_a6yv1YUl";
const SUPABASE_TABLE = "threadmail_messages";
const HANDLES_TABLE = "threadmail_handles";
const GAMES_TABLE = "threadmail_games";
const IDENTITY_KEY = "codex-threadmail-identity-v1";
const PREFS_KEY = "codex-threadmail-prefs-v1";
const DRAFTS_KEY = "codex-threadmail-drafts-v1";
const BASE_TITLE = "Threadmail";

let identity = loadIdentity();
let messageRows = [];
let gameRows = [];
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
let pendingGameType = "";

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
  handleSuggestions: document.getElementById("handleSuggestions"),
  composeSubject: document.getElementById("composeSubject"),
  composeBody: document.getElementById("composeBody"),
  attachTicTacToe: document.getElementById("attachTicTacToe"),
  attachConnectFour: document.getElementById("attachConnectFour"),
  attachBattleship: document.getElementById("attachBattleship"),
  attachWordChain: document.getElementById("attachWordChain"),
  clearGameAttach: document.getElementById("clearGameAttach"),
  gameAttachLabel: document.getElementById("gameAttachLabel"),
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
      gameId: row.game_id || "",
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
  renderGameAttachment(thread);
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
  renderHandleSuggestions();
}

function gameForThread(thread) {
  if (!thread?.gameId) return null;
  return gameRows.find((game) => game.id === thread.gameId) || null;
}

function renderGameAttachment(thread) {
  document.querySelector(".game-cardlet")?.remove();
  const game = gameForThread(thread);
  if (!game) return;

  const card = document.createElement("section");
  card.className = "game-cardlet";
  const statusText = getGameStatusText(game);
  card.innerHTML = `
    <div class="game-cardlet__top">
      <div>
        <span class="game-cardlet__label">Attached Game</span>
        <h3>${escapeHtml(getGameTitle(game.type))}</h3>
      </div>
      <span>${escapeHtml(statusText)}</span>
    </div>
    <div class="game-play-area"></div>
  `;

  const playArea = card.querySelector(".game-play-area");
  if (game.type === "connect_four") renderConnectFour(game, playArea);
  else if (game.type === "battleship") renderBattleship(game, playArea);
  else if (game.type === "word_chain") renderWordChain(game, playArea);
  else renderTicTacToe(game, playArea);
  els.messageDetail.insertBefore(card, document.querySelector(".message-tools"));
}

function renderTicTacToe(game, container) {
  const boardEl = document.createElement("div");
  boardEl.className = "tic-board";
  boardEl.setAttribute("aria-label", "Tic-Tac-Toe board");
  const board = Array.isArray(game.board) ? game.board : ["", "", "", "", "", "", "", "", ""];
  const canMove = game.status === "active" && game.turn_handle === identity.handle;
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
    bindTouchInput(input);
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
    <p>Fleet left: ${countBattleshipFleetLeft(board, mark)} yours, ${countBattleshipFleetLeft(board, enemyMark)} enemy.</p>
    <div class="battleship__grids"></div>
  `;

  const grids = wrapper.querySelector(".battleship__grids");
  grids.append(createBattleshipGrid("Your Fleet", board, mark, false, canMove));
  grids.append(createBattleshipGrid("Enemy Waters", board, mark, true, canMove));
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

function getGameStatusText(game) {
  if (game.status === "draw") return "Draw";
  if (game.status === "x_won") return `${game.x_handle} won`;
  if (game.status === "o_won") return `${game.o_handle} won`;
  return game.turn_handle === identity.handle ? "Your move" : `${game.turn_handle}'s move`;
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
  renderHandleSuggestions();
}

function closeComposePanel() {
  els.composePanel.hidden = true;
  replyToId = null;
  els.handleSuggestions.hidden = true;
  pendingGameType = "";
  updateGameAttachLabel();
}

function getKnownHandles() {
  const handles = new Set();
  for (const row of messageRows) {
    if (row.sender_handle && row.sender_handle !== identity.handle) handles.add(row.sender_handle);
    if (row.recipient_handle && row.recipient_handle !== identity.handle) handles.add(row.recipient_handle);
  }
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
      els.composeSubject.focus();
    });
    els.handleSuggestions.append(button);
  }
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
    let gameId = null;
    if (pendingGameType) {
      gameId = await createGame(sender, recipient, pendingGameType);
      if (!gameId) return;
    }

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
        body: replyToId ? `${body}\n\n--- Reply sent from Threadmail. ---` : body,
        game_id: gameId
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
    const query = `or=(sender_handle.eq.${encodeURIComponent(handle)},recipient_handle.eq.${encodeURIComponent(handle)})&select=id,sender_handle,recipient_handle,subject,body,created_at,read_at,game_id&order=created_at.desc&limit=100`;
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
    await fetchGames(handle);
    setStatus(messageRows.length ? `Synced ${messageRows.length} message${messageRows.length === 1 ? "" : "s"} for ${handle}.` : `Inbox ready for ${handle}.`, "success");
    render();
    maybeNotifyUnreadChange();
  } catch {
    setStatus("Supabase project URL is not reachable. Check that the project is active and the URL/key in js/threadmail.js are correct.", "error");
  }
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
  gameRows = Array.isArray(payload) ? payload : [];
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
    ? `${identity.handle} made a ${getGameTitle(game.type)} move. Your turn.`
    : `${identity.handle} made the final ${getGameTitle(game.type)} move. ${getGameStatusText({ ...game, status: nextStatus })}.`;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify([{
      sender_handle: identity.handle,
      recipient_handle: recipient,
      subject: `${getGameTitle(game.type)} move`,
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
    setStatus("Threadmail needs the updated Supabase setup tables. Run supabase/threadmail-messages.sql once.", "error");
  } else {
    setStatus(fallback || "Supabase returned an error.", "error");
  }
}

async function reserveHandle(handle) {
  const existing = await fetch(`${SUPABASE_URL}/rest/v1/${HANDLES_TABLE}?handle=eq.${encodeURIComponent(handle)}&select=handle,owner_token&limit=1`, {
    headers: getSupabaseHeaders()
  });
  const existingPayload = await existing.json().catch(() => ([]));
  if (!existing.ok) {
    handleSupabaseError(existingPayload, "Could not check whether that handle is available.");
    return false;
  }
  const reserved = Array.isArray(existingPayload) ? existingPayload[0] : null;
  if (reserved && reserved.owner_token !== identity.ownerToken) {
    setStatus("Handle Taken", "error");
    return false;
  }
  if (reserved && reserved.owner_token === identity.ownerToken) return true;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${HANDLES_TABLE}`, {
    method: "POST",
    headers: getSupabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }),
    body: JSON.stringify([{
      handle,
      owner_token: identity.ownerToken,
      updated_at: new Date().toISOString()
    }])
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload?.code === "23505") setStatus("Handle Taken", "error");
    else handleSupabaseError(payload, "Could not reserve that handle.");
    return false;
  }
  return true;
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

els.composeTo.addEventListener("input", renderHandleSuggestions);
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

function selectGameAttachment(type) {
  pendingGameType = type;
  const title = getGameTitle(type);
  if (!els.composeSubject.value.trim()) els.composeSubject.value = `${title} challenge`;
  if (!els.composeBody.value.trim()) els.composeBody.value = `I started a ${title} game. Your move after mine.`;
  updateGameAttachLabel();
}

function updateGameAttachLabel() {
  els.gameAttachLabel.textContent = pendingGameType ? getGameTitle(pendingGameType) : "None";
}

els.saveIdentity.addEventListener("click", async () => {
  const nextHandle = normalizeHandle(els.identityHandle.value);
  if (!isValidHandle(nextHandle)) {
    setStatus("Handle must be 3-24 letters, numbers, or underscores.", "error");
    return;
  }
  setStatus("Checking handle...");
  if (!(await reserveHandle(nextHandle))) return;
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

function bindTouchInput(field) {
  field.addEventListener("focus", () => showTouchKeyboard(field));
  field.addEventListener("pointerdown", () => showTouchKeyboard(field));
}

document.querySelectorAll("[data-touch-input]").forEach(bindTouchInput);

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
