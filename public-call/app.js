const roomInput = document.querySelector("#roomInput");
const inviteInput = document.querySelector("#inviteInput");
const createButton = document.querySelector("#createButton");
const joinButton = document.querySelector("#joinButton");
const copyButton = document.querySelector("#copyButton");
const installButton = document.querySelector("#installButton");
const shareAppButton = document.querySelector("#shareAppButton");
const copyAppButton = document.querySelector("#copyAppButton");
const appLinkInput = document.querySelector("#appLinkInput");
const qrCodeImage = document.querySelector("#qrCodeImage");
const installHelp = document.querySelector("#installHelp");
const nativeShareButton = document.querySelector("#nativeShareButton");
const newRoomButton = document.querySelector("#newRoomButton");
const roomNameInput = document.querySelector("#roomNameInput");
const copyCodeButton = document.querySelector("#copyCodeButton");
const approvalToggle = document.querySelector("#approvalToggle");
const knockCard = document.querySelector("#knockCard");
const knockTitle = document.querySelector("#knockTitle");
const knockCopy = document.querySelector("#knockCopy");
const approveGuestButton = document.querySelector("#approveGuestButton");
const declineGuestButton = document.querySelector("#declineGuestButton");
const recentRoomsCard = document.querySelector("#recentRoomsCard");
const recentRoomsList = document.querySelector("#recentRoomsList");
const clearRecentRoomsButton = document.querySelector("#clearRecentRoomsButton");
const settingsButton = document.querySelector("#settingsButton");
const muteButton = document.querySelector("#muteButton");
const cameraButton = document.querySelector("#cameraButton");
const flipButton = document.querySelector("#flipButton");
const screenButton = document.querySelector("#screenButton");
const snapshotButton = document.querySelector("#snapshotButton");
const effectsButton = document.querySelector("#effectsButton");
const playButton = document.querySelector("#playButton");
const chatButton = document.querySelector("#chatButton");
const ringButton = document.querySelector("#ringButton");
const hangupButton = document.querySelector("#hangupButton");
const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");
const connectionBadge = document.querySelector("#connectionBadge");
const micBadge = document.querySelector("#micBadge");
const cameraBadge = document.querySelector("#cameraBadge");
const localVideo = document.querySelector("#localVideo");
const remoteVideo = document.querySelector("#remoteVideo");
const localTile = document.querySelector("#localTile");
const remoteTile = document.querySelector(".video-tile--remote");
const localEmpty = document.querySelector("#localEmpty");
const remoteEmpty = document.querySelector("#remoteEmpty");
const profileNameInput = document.querySelector("#profileNameInput");
const avatarInput = document.querySelector("#avatarInput");
const profilePreview = document.querySelector("#profilePreview");
const localAvatar = document.querySelector("#localAvatar");
const remoteAvatar = document.querySelector("#remoteAvatar");
const localName = document.querySelector("#localName");
const remoteName = document.querySelector("#remoteName");
const panelCollapseButton = document.querySelector("#panelCollapseButton");
const waitingCard = document.querySelector("#waitingCard");
const chatDrawer = document.querySelector("#chatDrawer");
const chatCloseButton = document.querySelector("#chatCloseButton");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const effectsDrawer = document.querySelector("#effectsDrawer");
const effectsCloseButton = document.querySelector("#effectsCloseButton");
const playDrawer = document.querySelector("#playDrawer");
const playCloseButton = document.querySelector("#playCloseButton");
const filterControls = document.querySelector("#filterControls");
const backdropControls = document.querySelector("#backdropControls");
const qualitySelect = document.querySelector("#qualitySelect");
const reactionControls = document.querySelector("#reactionControls");
const ticTacToeBoard = document.querySelector("#ticTacToeBoard");
const ticTacToeStatus = document.querySelector("#ticTacToeStatus");
const resetTicTacToeButton = document.querySelector("#resetTicTacToeButton");
const ticTacToeScore = document.querySelector("#ticTacToeScore");
const rpsControls = document.querySelector("#rpsControls");
const rpsStatus = document.querySelector("#rpsStatus");
const rpsScore = document.querySelector("#rpsScore");
const resetRpsButton = document.querySelector("#resetRpsButton");
const whiteboardCanvas = document.querySelector("#whiteboardCanvas");
const clearWhiteboardButton = document.querySelector("#clearWhiteboardButton");
const playTabButtons = document.querySelectorAll("[data-play-tab]");
const playPanels = document.querySelectorAll("[data-play-panel]");

const profileStorageKey = "facecall-profile-v1";
const previewStorageKey = "facecall-preview-position-v1";
const ringStorageKey = "facecall-ring-v1";
const recentRoomsStorageKey = "facecall-recent-rooms-v1";
const effectsStorageKey = "facecall-effects-v1";
const qualityStorageKey = "facecall-quality-v1";
const approvalStorageKey = "facecall-approval-v1";

const qualityPresets = {
  low: { width: 640, height: 360, frameRate: 18 },
  balanced: { width: 960, height: 540, frameRate: 24 },
  high: { width: 1280, height: 720, frameRate: 30 }
};

const peerConfig = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" }
    ]
  }
};

let peer = null;
let localStream = null;
let activeCall = null;
let activeConnection = null;
let cameraTrack = null;
let isMuted = false;
let isCameraOff = false;
let localProfile = loadProfile();
let remoteProfile = { name: "Guest", avatar: "" };
let previewDrag = null;
let currentFacingMode = "user";
let ringEnabled = loadRingSetting();
let audioContext = null;
let deferredInstallPrompt = null;
let localEffects = loadEffects();
let remoteEffects = { filter: "normal", backdrop: "none" };
let qualityMode = loadQualityMode();
let ticTacToeState = makeTicTacToeState();
let rpsState = { local: "", remote: "", settled: false, score: { you: 0, guest: 0, ties: 0 } };
let whiteboardDrawing = null;
let whiteboardContext = whiteboardCanvas.getContext("2d");
let whiteboardStrokes = [];
let pendingKnockConnection = null;
let currentRoomId = "";

function cleanRoomId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

function cleanRoomName(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 24);
}

function makeRoomId() {
  const words = ["call", "room", "hello", "family", "video", "chat"];
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function appBaseUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function roomLink(roomId) {
  const url = new URL(appBaseUrl());
  url.hash = `/r/${roomId}`;
  return url.toString();
}

function roomFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const queryRoom = cleanRoomId(params.get("room") || "");
  if (queryRoom) {
    return queryRoom;
  }

  const hashMatch = window.location.hash.match(/^#\/r\/([^/?#]+)/i);
  return cleanRoomId(hashMatch?.[1] || "");
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function setupQuickAccess() {
  const url = appBaseUrl();
  appLinkInput.value = url;
  qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(url)}`;

  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    installButton.disabled = true;
    installHelp.textContent = "FaceCall is already installed on this device.";
  } else if (isIosDevice()) {
    installHelp.textContent = "On iPhone or iPad: tap Share, then Add to Home Screen.";
  } else {
    installHelp.textContent = "Tap Install App when your browser offers it, or use your browser menu to add FaceCall to your home screen.";
  }
}

async function copyText(value, successMessage) {
  await navigator.clipboard.writeText(value);
  setStatus(successMessage, "live");
}

async function shareFaceCall() {
  const url = appBaseUrl();
  if (navigator.share) {
    try {
      await navigator.share({
        title: "FaceCall",
        text: "Open FaceCall for quick video calls.",
        url
      });
      setStatus("FaceCall shared.", "live");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  await copyText(url, "FaceCall link copied.");
}

async function installFaceCall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice.outcome === "accepted") {
      installHelp.textContent = "FaceCall was installed.";
      installButton.disabled = true;
      setStatus("FaceCall installed.", "live");
    } else {
      setStatus("Install dismissed.");
    }
    return;
  }

  installHelp.textContent = isIosDevice()
    ? "On iPhone or iPad: tap Share, then Add to Home Screen."
    : "Use your browser menu and choose Install App or Add to Home Screen.";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      installHelp.textContent = "Install support is limited in this browser.";
    });
  }
}

function cleanProfileName(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 28) || "You";
}

function profileInitial(name) {
  return cleanProfileName(name).charAt(0).toUpperCase();
}

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileStorageKey) || "{}");
    return {
      name: cleanProfileName(saved.name || "You"),
      avatar: typeof saved.avatar === "string" ? saved.avatar : ""
    };
  } catch {
    return { name: "You", avatar: "" };
  }
}

function saveProfile() {
  localStorage.setItem(profileStorageKey, JSON.stringify(localProfile));
}

function loadRingSetting() {
  try {
    const saved = JSON.parse(localStorage.getItem(ringStorageKey) || "{}");
    return saved.enabled !== false;
  } catch {
    return true;
  }
}

function saveRingSetting() {
  localStorage.setItem(ringStorageKey, JSON.stringify({ enabled: ringEnabled }));
}

function loadRecentRooms() {
  try {
    const saved = JSON.parse(localStorage.getItem(recentRoomsStorageKey) || "[]");
    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.map((item) => {
      if (typeof item === "string") {
        return { id: cleanRoomId(item), name: "" };
      }
      return {
        id: cleanRoomId(item?.id || ""),
        name: cleanRoomName(item?.name || "")
      };
    }).filter((item) => item.id).slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecentRooms(rooms) {
  localStorage.setItem(recentRoomsStorageKey, JSON.stringify(rooms.slice(0, 5)));
}

function rememberRoom(roomId, roomName = roomNameInput.value) {
  const cleanId = cleanRoomId(roomId);
  if (!cleanId) {
    return;
  }

  const cleanName = cleanRoomName(roomName);
  const rooms = [
    { id: cleanId, name: cleanName },
    ...loadRecentRooms().filter((item) => item.id !== cleanId)
  ];
  saveRecentRooms(rooms);
  renderRecentRooms();
}

function renderRecentRooms() {
  const rooms = loadRecentRooms();
  recentRoomsCard.hidden = rooms.length === 0;
  recentRoomsList.replaceChildren();

  rooms.forEach((roomId) => {
    const button = document.createElement("button");
    button.className = "recent-room-button";
    button.type = "button";
    button.textContent = roomId.name ? `${roomId.name} · ${roomId.id}` : roomId.id;
    button.addEventListener("click", () => {
      roomInput.value = roomId.id;
      roomNameInput.value = roomId.name;
      setInvite(roomId.id, false);
      setStatus("Recent room loaded. Click Join Room to enter.");
    });
    recentRoomsList.append(button);
  });
}

function loadApprovalSetting() {
  try {
    const saved = JSON.parse(localStorage.getItem(approvalStorageKey) || "{}");
    return saved.enabled !== false;
  } catch {
    return true;
  }
}

function saveApprovalSetting() {
  localStorage.setItem(approvalStorageKey, JSON.stringify({ enabled: approvalToggle.checked }));
}

function loadEffects() {
  try {
    const saved = JSON.parse(localStorage.getItem(effectsStorageKey) || "{}");
    return {
      filter: ["normal", "soft", "noir", "warm", "cool", "party", "comic"].includes(saved.filter) ? saved.filter : "normal",
      backdrop: ["none", "aurora", "sunset", "ocean"].includes(saved.backdrop) ? saved.backdrop : "none"
    };
  } catch {
    return { filter: "normal", backdrop: "none" };
  }
}

function saveEffects() {
  localStorage.setItem(effectsStorageKey, JSON.stringify(localEffects));
}

function loadQualityMode() {
  try {
    const saved = JSON.parse(localStorage.getItem(qualityStorageKey) || "{}");
    return qualityPresets[saved.mode] ? saved.mode : "balanced";
  } catch {
    return "balanced";
  }
}

function saveQualityMode() {
  localStorage.setItem(qualityStorageKey, JSON.stringify({ mode: qualityMode }));
}

function renderSegmentedState(container, activeValue, attribute) {
  container.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset[attribute] === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyLocalEffects() {
  localVideo.dataset.filter = localEffects.filter;
  localTile.dataset.backdrop = localEffects.backdrop;
  renderSegmentedState(filterControls, localEffects.filter, "filter");
  renderSegmentedState(backdropControls, localEffects.backdrop, "backdrop");
}

function normalizeEffects(effects) {
  return {
    filter: ["normal", "soft", "noir", "warm", "cool", "party", "comic"].includes(effects?.filter) ? effects.filter : "normal",
    backdrop: ["none", "aurora", "sunset", "ocean"].includes(effects?.backdrop) ? effects.backdrop : "none"
  };
}

function applyRemoteEffects() {
  remoteVideo.dataset.filter = remoteEffects.filter;
  remoteTile.dataset.backdrop = remoteEffects.backdrop;
}

function sendLocalEffects() {
  sendDataMessage({ type: "effects", effects: localEffects });
}

async function applyQualityMode() {
  qualitySelect.value = qualityMode;
  if (!cameraTrack?.applyConstraints) {
    return;
  }

  const preset = qualityPresets[qualityMode] || qualityPresets.balanced;
  try {
    await cameraTrack.applyConstraints({
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: preset.frameRate, max: preset.frameRate }
    });
    updateMediaBadges();
    setStatus(`Video quality set to ${qualitySelect.selectedOptions[0].textContent}.`, "live");
  } catch (error) {
    setStatus(error.message || "Could not change video quality on this device.", "error");
  }
}

function getVideoConstraints() {
  const preset = qualityPresets[qualityMode] || qualityPresets.balanced;
  return {
    width: { ideal: preset.width },
    height: { ideal: preset.height },
    frameRate: { ideal: preset.frameRate, max: preset.frameRate },
    facingMode: currentFacingMode
  };
}

function sendDataMessage(message) {
  if (activeConnection?.open) {
    activeConnection.send(message);
    return true;
  }
  return false;
}

function makeTicTacToeState() {
  return {
    board: Array(9).fill(""),
    turn: "X",
    winner: "",
    score: { x: 0, o: 0, draws: 0 }
  };
}

function checkTicTacToeWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return board.every(Boolean) ? "Draw" : "";
}

function renderTicTacToe() {
  ticTacToeBoard.replaceChildren();
  ticTacToeState.board.forEach((value, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.setAttribute("aria-label", value ? `Square ${index + 1}, ${value}` : `Square ${index + 1}`);
    button.addEventListener("click", () => playTicTacToe(index));
    ticTacToeBoard.append(button);
  });

  ticTacToeStatus.textContent = ticTacToeState.winner
    ? ticTacToeState.winner === "Draw" ? "Draw game. Reset to play again." : `${ticTacToeState.winner} wins.`
    : `${ticTacToeState.turn} goes next.`;
  ticTacToeScore.textContent = `X ${ticTacToeState.score.x} · O ${ticTacToeState.score.o} · Draws ${ticTacToeState.score.draws}`;
}

function syncTicTacToe() {
  sendDataMessage({ type: "tictactoe", state: ticTacToeState });
}

function playTicTacToe(index) {
  if (ticTacToeState.winner || ticTacToeState.board[index]) {
    return;
  }

  ticTacToeState.board[index] = ticTacToeState.turn;
  ticTacToeState.winner = checkTicTacToeWinner(ticTacToeState.board);
  if (ticTacToeState.winner === "X") {
    ticTacToeState.score.x += 1;
  } else if (ticTacToeState.winner === "O") {
    ticTacToeState.score.o += 1;
  } else if (ticTacToeState.winner === "Draw") {
    ticTacToeState.score.draws += 1;
  }
  ticTacToeState.turn = ticTacToeState.turn === "X" ? "O" : "X";
  renderTicTacToe();
  syncTicTacToe();
}

function resetTicTacToe(shouldSync = true) {
  const score = ticTacToeState.score;
  ticTacToeState = makeTicTacToeState();
  ticTacToeState.score = score;
  renderTicTacToe();
  if (shouldSync) {
    syncTicTacToe();
  }
}

function chooseRps(choice) {
  if (rpsState.settled) {
    setStatus("Start a new rock paper scissors round first.");
    return;
  }

  rpsState.local = choice;
  rpsState.settled = false;
  renderRps();
  sendDataMessage({ type: "rps", choice });
}

function rpsResult(local, remote) {
  if (!local || !remote) {
    return "";
  }
  if (local === remote) {
    return "Tie.";
  }
  const wins = (
    (local === "rock" && remote === "scissors") ||
    (local === "paper" && remote === "rock") ||
    (local === "scissors" && remote === "paper")
  );
  return wins ? "You win." : "Guest wins.";
}

function renderRps() {
  rpsControls.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset.rps === rpsState.local;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (rpsState.local && rpsState.remote && !rpsState.settled) {
    const result = rpsResult(rpsState.local, rpsState.remote);
    if (result === "You win.") {
      rpsState.score.you += 1;
    } else if (result === "Guest wins.") {
      rpsState.score.guest += 1;
    } else {
      rpsState.score.ties += 1;
    }
    rpsState.settled = true;
  }

  rpsStatus.textContent = rpsState.local && rpsState.remote
    ? `You picked ${rpsState.local}. Guest picked ${rpsState.remote}. ${rpsResult(rpsState.local, rpsState.remote)}`
    : rpsState.local ? "Waiting for guest pick." : "Pick one when you are ready.";
  rpsScore.textContent = `You ${rpsState.score.you} · Guest ${rpsState.score.guest} · Ties ${rpsState.score.ties}`;
}

function resetRps(shouldSync = true) {
  rpsState.local = "";
  rpsState.remote = "";
  rpsState.settled = false;
  renderRps();
  if (shouldSync) {
    sendDataMessage({ type: "rps-reset" });
  }
}

function resizeWhiteboard() {
  const rect = whiteboardCanvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (whiteboardCanvas.width === width && whiteboardCanvas.height === height) {
    return;
  }

  whiteboardCanvas.width = width;
  whiteboardCanvas.height = height;
  whiteboardContext = whiteboardCanvas.getContext("2d");
  whiteboardContext.lineCap = "round";
  whiteboardContext.lineJoin = "round";
  whiteboardContext.lineWidth = 4 * ratio;
  whiteboardContext.strokeStyle = "#30d37d";
  whiteboardStrokes.forEach((stroke) => drawWhiteboardSegment(stroke.from, stroke.to, stroke.color, false));
}

function whiteboardPoint(event) {
  const rect = whiteboardCanvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
    y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
  };
}

function drawWhiteboardSegment(from, to, color = "#30d37d", shouldStore = true) {
  if (!Number.isFinite(from?.x) || !Number.isFinite(from?.y) || !Number.isFinite(to?.x) || !Number.isFinite(to?.y)) {
    return;
  }

  resizeWhiteboard();
  if (shouldStore) {
    whiteboardStrokes.push({ from, to, color });
    whiteboardStrokes = whiteboardStrokes.slice(-600);
  }
  whiteboardContext.strokeStyle = color;
  whiteboardContext.beginPath();
  whiteboardContext.moveTo(from.x * whiteboardCanvas.width, from.y * whiteboardCanvas.height);
  whiteboardContext.lineTo(to.x * whiteboardCanvas.width, to.y * whiteboardCanvas.height);
  whiteboardContext.stroke();
}

function startWhiteboardDraw(event) {
  whiteboardDrawing = whiteboardPoint(event);
  whiteboardCanvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveWhiteboardDraw(event) {
  if (!whiteboardDrawing) {
    return;
  }

  const next = whiteboardPoint(event);
  drawWhiteboardSegment(whiteboardDrawing, next);
  sendDataMessage({ type: "whiteboard", action: "draw", from: whiteboardDrawing, to: next });
  whiteboardDrawing = next;
}

function endWhiteboardDraw(event) {
  if (!whiteboardDrawing) {
    return;
  }

  whiteboardDrawing = null;
  whiteboardCanvas.releasePointerCapture?.(event.pointerId);
}

function clearWhiteboard(shouldSync = true) {
  resizeWhiteboard();
  whiteboardStrokes = [];
  whiteboardContext.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
  if (shouldSync) {
    sendDataMessage({ type: "whiteboard", action: "clear" });
  }
}

function showReaction(text, side = "local") {
  const bubble = document.createElement("div");
  bubble.className = `reaction-burst ${side === "remote" ? "is-remote" : ""}`;
  bubble.textContent = text;
  document.querySelector(".video-grid").append(bubble);
  window.setTimeout(() => bubble.remove(), 1500);
}

function sendReaction(text) {
  showReaction(text, "local");
  sendDataMessage({ type: "reaction", reaction: text });
}

function unlockAudio() {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  audioContext?.resume?.();
}

function playRing() {
  if (!ringEnabled) {
    return;
  }

  navigator.vibrate?.([120, 70, 120]);
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  [0, 0.22].forEach((offset) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.18);
  });
}

function renderRingButton() {
  ringButton.classList.toggle("is-off", !ringEnabled);
  ringButton.querySelector("span").textContent = ringEnabled ? "Ring" : "Silent";
  ringButton.setAttribute("aria-label", ringEnabled ? "Turn ringtone off" : "Turn ringtone on");
}

function toggleRing() {
  ringEnabled = !ringEnabled;
  saveRingSetting();
  renderRingButton();
  if (ringEnabled) {
    unlockAudio();
    playRing();
    setStatus("Ringtone and vibration turned on.", "live");
  } else {
    setStatus("Ringtone and vibration turned off.");
  }
}

function updateBadge(element, text, mode = "idle") {
  element.textContent = text;
  element.classList.toggle("is-live", mode === "live");
  element.classList.toggle("is-warn", mode === "warn");
}

function updateMediaBadges() {
  updateBadge(micBadge, isMuted ? "Mic muted" : "Mic on", isMuted ? "warn" : "live");
  updateBadge(cameraBadge, isCameraOff ? "Camera off" : `Camera ${currentFacingMode === "user" ? "front" : "back"}`, isCameraOff ? "warn" : "live");
}

function setSettingsCollapsed(isCollapsed) {
  document.body.classList.toggle("settings-collapsed", isCollapsed);
  settingsButton.classList.toggle("is-off", !isCollapsed);
  settingsButton.querySelector("span").textContent = isCollapsed ? "Settings" : "Hide";
  panelCollapseButton.textContent = "Hide";
}

function toggleSettings() {
  setSettingsCollapsed(!document.body.classList.contains("settings-collapsed"));
}

function applyProfile(target, profile) {
  const avatar = target === "local" ? localAvatar : remoteAvatar;
  const name = target === "local" ? localName : remoteName;
  const safeName = cleanProfileName(profile.name || (target === "local" ? "You" : "Guest"));

  name.textContent = safeName;
  avatar.textContent = profileInitial(safeName);
  avatar.classList.toggle("has-photo", Boolean(profile.avatar));
  avatar.style.backgroundImage = profile.avatar ? `url("${profile.avatar}")` : "";
}

function applyProfilePreview(syncInput = true) {
  if (syncInput) {
    profileNameInput.value = localProfile.name;
  }
  profilePreview.textContent = profileInitial(localProfile.name);
  profilePreview.classList.toggle("has-photo", Boolean(localProfile.avatar));
  profilePreview.style.backgroundImage = localProfile.avatar ? `url("${localProfile.avatar}")` : "";
  applyProfile("local", localProfile);
}

function sendLocalProfile() {
  if (activeConnection?.open) {
    activeConnection.send({ type: "profile", profile: localProfile });
  }
}

function approveGuest() {
  const connection = pendingKnockConnection || activeConnection;
  if (!connection?.open) {
    setStatus("No waiting guest to approve.", "error");
    return;
  }

  connection.send({ type: "approved" });
  knockCard.hidden = true;
  pendingKnockConnection = null;
  updateBadge(connectionBadge, "Approved", "live");
  setStatus("Guest approved. Waiting for their video...", "live");
}

function declineGuest() {
  const connection = pendingKnockConnection || activeConnection;
  connection?.send?.({ type: "declined" });
  connection?.close?.();
  knockCard.hidden = true;
  pendingKnockConnection = null;
  waitingCard.hidden = false;
  updateBadge(connectionBadge, "Waiting", "warn");
  setStatus("Guest declined. The room is still open.");
}

function handleKnock(data) {
  const profile = data.profile || {};
  remoteProfile = {
    name: cleanProfileName(profile.name || "Guest"),
    avatar: typeof profile.avatar === "string" ? profile.avatar : ""
  };
  applyProfile("remote", remoteProfile);

  pendingKnockConnection = activeConnection;
  waitingCard.hidden = true;
  knockTitle.textContent = `${remoteProfile.name} is asking to join`;
  knockCopy.textContent = approvalToggle.checked
    ? "Approve them to start the video call."
    : "Guest auto-approved because room approval is off.";
  knockCard.hidden = !approvalToggle.checked;
  updateBadge(connectionBadge, "Knocking", "warn");

  if (approvalToggle.checked) {
    playRing();
    setStatus(`${remoteProfile.name} is waiting for approval.`, "live");
  } else {
    approveGuest();
  }
}

async function startApprovedGuestCall(roomId) {
  try {
    setStatus("Approved. Asking for camera and microphone permission...");
    await ensureLocalStream();
    const outgoing = peer.call(roomId, localStream, { metadata: { profile: localProfile } });
    bindCall(outgoing);
    sendLocalProfile();
    sendLocalEffects();
    syncTicTacToe();
    updateBadge(connectionBadge, "Calling", "warn");
    setStatus("Calling the room now...");
    setBusy(false);
  } catch (error) {
    setStatus(error.message || "Camera or microphone permission was blocked.", "error");
    setBusy(false);
  }
}

function handleDataMessage(data) {
  if (data?.type === "knock") {
    handleKnock(data);
    return;
  }

  if (data?.type === "approved") {
    startApprovedGuestCall(currentRoomId || cleanRoomId(roomInput.value));
    return;
  }

  if (data?.type === "declined") {
    updateBadge(connectionBadge, "Declined", "warn");
    setStatus("The host declined the request to join.");
    setBusy(false);
    return;
  }

  if (data?.type === "profile" && data.profile) {
    remoteProfile = {
      name: cleanProfileName(data.profile.name || "Guest"),
      avatar: typeof data.profile.avatar === "string" ? data.profile.avatar : ""
    };
    applyProfile("remote", remoteProfile);
    return;
  }

  if (data?.type === "chat" && data.message) {
    addChatMessage(cleanProfileName(data.name || remoteProfile.name || "Guest"), String(data.message).slice(0, 240), "remote");
    chatButton.classList.add("is-off");
    return;
  }

  if (data?.type === "reaction" && data.reaction) {
    showReaction(String(data.reaction).slice(0, 8), "remote");
    return;
  }

  if (data?.type === "effects") {
    remoteEffects = normalizeEffects(data.effects);
    applyRemoteEffects();
    return;
  }

  if (data?.type === "tictactoe" && data.state && Array.isArray(data.state.board)) {
    ticTacToeState = {
      board: data.state.board.slice(0, 9).map((value) => value === "X" || value === "O" ? value : ""),
      turn: data.state.turn === "O" ? "O" : "X",
      winner: ["X", "O", "Draw"].includes(data.state.winner) ? data.state.winner : "",
      score: {
        x: Math.max(0, Number(data.state.score?.x) || 0),
        o: Math.max(0, Number(data.state.score?.o) || 0),
        draws: Math.max(0, Number(data.state.score?.draws) || 0)
      }
    };
    renderTicTacToe();
    return;
  }

  if (data?.type === "rps" && ["rock", "paper", "scissors"].includes(data.choice)) {
    rpsState.remote = data.choice;
    rpsState.settled = false;
    renderRps();
    return;
  }

  if (data?.type === "rps-reset") {
    resetRps(false);
    return;
  }

  if (data?.type === "whiteboard") {
    if (data.action === "clear") {
      clearWhiteboard(false);
      return;
    }
    if (data.action === "draw" && data.from && data.to) {
      drawWhiteboardSegment(data.from, data.to, "#66b8ff");
    }
  }
}

function bindConnection(connection, mode = "host", roomId = "") {
  activeConnection = connection;
  connection.on("open", () => {
    if (mode === "joiner") {
      connection.send({ type: "knock", profile: localProfile });
      waitingCard.hidden = true;
      updateBadge(connectionBadge, "Knocking", "warn");
      setStatus("Knocking. Waiting for the host to approve you...", "live");
      return;
    }

    sendLocalProfile();
    sendLocalEffects();
    syncTicTacToe();
    updateBadge(connectionBadge, roomId ? "Guest joined" : "Connected", "live");
    waitingCard.hidden = true;
    playRing();
    setStatus("Handshake complete. Waiting for video...", "live");
  });
  connection.on("data", handleDataMessage);
  connection.on("close", () => {
    updateBadge(connectionBadge, "Guest left", "warn");
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function previewBoundsRect() {
  return document.querySelector(".video-grid").getBoundingClientRect();
}

function setPreviewPosition(left, top, shouldSave = true) {
  const bounds = previewBoundsRect();
  const tile = localTile.getBoundingClientRect();
  const maxLeft = Math.max(0, bounds.width - tile.width - 12);
  const maxTop = Math.max(0, bounds.height - tile.height - 12);
  const nextLeft = clamp(left, 12, maxLeft);
  const nextTop = clamp(top, 12, maxTop);

  localTile.style.left = `${nextLeft}px`;
  localTile.style.top = `${nextTop}px`;
  localTile.style.right = "auto";
  localTile.style.bottom = "auto";

  if (shouldSave) {
    localStorage.setItem(previewStorageKey, JSON.stringify({
      x: nextLeft / Math.max(1, bounds.width),
      y: nextTop / Math.max(1, bounds.height)
    }));
  }
}

function restorePreviewPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(previewStorageKey) || "{}");
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      const bounds = previewBoundsRect();
      setPreviewPosition(saved.x * bounds.width, saved.y * bounds.height, false);
    }
  } catch {
    localStorage.removeItem(previewStorageKey);
  }
}

function beginPreviewDrag(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  const bounds = previewBoundsRect();
  const tile = localTile.getBoundingClientRect();
  previewDrag = {
    offsetX: event.clientX - tile.left,
    offsetY: event.clientY - tile.top,
    boundsLeft: bounds.left,
    boundsTop: bounds.top
  };
  localTile.classList.add("is-dragging");
  localTile.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function movePreviewDrag(event) {
  if (!previewDrag) {
    return;
  }

  setPreviewPosition(
    event.clientX - previewDrag.boundsLeft - previewDrag.offsetX,
    event.clientY - previewDrag.boundsTop - previewDrag.offsetY,
    false
  );
}

function endPreviewDrag(event) {
  if (!previewDrag) {
    return;
  }

  const bounds = previewBoundsRect();
  const tile = localTile.getBoundingClientRect();
  localStorage.setItem(previewStorageKey, JSON.stringify({
    x: (tile.left - bounds.left) / Math.max(1, bounds.width),
    y: (tile.top - bounds.top) / Math.max(1, bounds.height)
  }));
  previewDrag = null;
  localTile.classList.remove("is-dragging");
  localTile.releasePointerCapture?.(event.pointerId);
}

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.onerror = () => reject(new Error("Could not load that profile picture."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read that profile picture."));
    reader.readAsDataURL(file);
  });
}

function setStatus(message, mode = "idle") {
  statusText.textContent = message;
  statusDot.classList.toggle("is-live", mode === "live");
  statusDot.classList.toggle("is-error", mode === "error");
}

function setBusy(isBusy) {
  createButton.disabled = isBusy;
  joinButton.disabled = isBusy;
}

function setInvite(roomId, shouldRemember = true) {
  const url = roomLink(roomId);
  currentRoomId = roomId;
  inviteInput.value = url;
  copyButton.disabled = false;
  nativeShareButton.disabled = false;
  copyCodeButton.disabled = false;
  window.history.replaceState({}, "", url);
  if (shouldRemember) {
    rememberRoom(roomId);
  }
}

async function ensureLocalStream() {
  if (localStream) {
    return localStream;
  }

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    },
    video: getVideoConstraints()
  });

  cameraTrack = localStream.getVideoTracks()[0] || null;
  localVideo.srcObject = localStream;
  applyLocalEffects();
  document.body.classList.add("has-media");
  localEmpty.classList.add("is-hidden");
  muteButton.disabled = false;
  cameraButton.disabled = false;
  flipButton.disabled = false;
  screenButton.disabled = false;
  snapshotButton.disabled = false;
  hangupButton.disabled = false;
  updateMediaBadges();
  if (window.matchMedia("(max-width: 620px)").matches) {
    setSettingsCollapsed(true);
  }
  return localStream;
}

function attachRemoteStream(stream) {
  remoteVideo.srcObject = stream;
  remoteEmpty.classList.add("is-hidden");
  waitingCard.hidden = true;
  updateBadge(connectionBadge, "Connected", "live");
  setStatus("Connected. You are live.", "live");
}

function bindCall(call) {
  if (activeCall) {
    activeCall.close();
  }

  activeCall = call;
  call.on("stream", attachRemoteStream);
  call.on("close", () => {
    remoteVideo.srcObject = null;
    remoteEmpty.classList.remove("is-hidden");
    updateBadge(connectionBadge, "Disconnected", "warn");
    setStatus("The other person left the call.");
  });
  call.on("error", (error) => setStatus(error.message || "The call disconnected.", "error"));
}

function bindPeerEvents(roomId, isHost) {
  peer.on("open", (id) => {
    if (isHost) {
      currentRoomId = id;
      setInvite(id);
      waitingCard.hidden = false;
      updateBadge(connectionBadge, "Waiting", "warn");
      setStatus("Room is open. Share the invite link and keep this tab open.", "live");
      setBusy(false);
      return;
    }

    currentRoomId = roomId;
    setStatus("Connecting to the room...");
    waitingCard.hidden = true;
    updateBadge(connectionBadge, "Knocking", "warn");
    bindConnection(peer.connect(roomId), "joiner", roomId);
  });

  peer.on("call", async (call) => {
    if (call.metadata?.profile) {
      handleDataMessage({ type: "profile", profile: call.metadata.profile });
    }
    playRing();
    updateBadge(connectionBadge, "Incoming", "warn");
    await ensureLocalStream();
    call.answer(localStream);
    bindCall(call);
    setStatus("Incoming guest connected. Waiting for video...", "live");
  });

  peer.on("connection", (connection) => {
    bindConnection(connection, isHost ? "host" : "peer", roomId);
  });

  peer.on("disconnected", () => {
    updateBadge(connectionBadge, "Reconnecting", "warn");
    setStatus("Signaling disconnected. Trying to reconnect...");
  });
  peer.on("close", () => setStatus("Room closed."));
  peer.on("error", (error) => {
    const message = error.type === "unavailable-id"
      ? "That room code is already being hosted. Try joining it or pick a new code."
      : error.message || "Could not connect to the call service.";
    setStatus(message, "error");
    setBusy(false);
  });
}

async function createRoom() {
  try {
    unlockAudio();
    setBusy(true);
    waitingCard.hidden = true;
    updateBadge(connectionBadge, "Starting", "warn");
    setStatus("Asking for camera and microphone permission...");
    await ensureLocalStream();

    const requested = cleanRoomId(roomInput.value) || makeRoomId();
    roomInput.value = requested;
    if (peer) {
      peer.destroy();
    }

    peer = new Peer(requested, peerConfig);
    bindPeerEvents(requested, true);
  } catch (error) {
    setStatus(error.message || "Camera or microphone permission was blocked.", "error");
    setBusy(false);
  }
}

async function joinRoom() {
  const roomId = cleanRoomId(roomInput.value);
  if (!roomId) {
    setStatus("Paste or type a room code first.", "error");
    return;
  }

  try {
    unlockAudio();
    setBusy(true);
    waitingCard.hidden = true;
    updateBadge(connectionBadge, "Starting", "warn");
    setStatus("Connecting to the room...");

    if (peer) {
      peer.destroy();
    }

    setInvite(roomId);
    peer = new Peer(undefined, peerConfig);
    bindPeerEvents(roomId, false);
  } catch (error) {
    setStatus(error.message || "Camera or microphone permission was blocked.", "error");
    setBusy(false);
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !isMuted;
  });
  muteButton.classList.toggle("is-off", isMuted);
  muteButton.querySelector("span").textContent = isMuted ? "Muted" : "Mic";
  muteButton.setAttribute("aria-label", isMuted ? "Unmute microphone" : "Mute microphone");
  updateMediaBadges();
}

function toggleCamera() {
  isCameraOff = !isCameraOff;
  localStream?.getVideoTracks().forEach((track) => {
    track.enabled = !isCameraOff;
  });
  cameraButton.classList.toggle("is-off", isCameraOff);
  cameraButton.querySelector("span").textContent = isCameraOff ? "Off" : "Cam";
  cameraButton.setAttribute("aria-label", isCameraOff ? "Turn camera on" : "Turn camera off");
  updateMediaBadges();
}

async function replaceOutgoingVideo(track) {
  if (!activeCall?.peerConnection) {
    return;
  }

  const sender = activeCall.peerConnection.getSenders().find((item) => item.track?.kind === "video");
  if (sender) {
    await sender.replaceTrack(track);
  }
}

async function flipCamera() {
  if (!localStream) {
    return;
  }

  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  try {
    const replacementStream = await navigator.mediaDevices.getUserMedia({
      video: getVideoConstraints()
    });
    const nextTrack = replacementStream.getVideoTracks()[0];
    if (!nextTrack) {
      throw new Error("No camera track was found.");
    }
    nextTrack.enabled = !isCameraOff;

    const oldTrack = localStream.getVideoTracks()[0];
    if (oldTrack) {
      localStream.removeTrack(oldTrack);
      oldTrack.stop();
    }
    localStream.addTrack(nextTrack);
    cameraTrack = nextTrack;
    await replaceOutgoingVideo(nextTrack);
    localVideo.srcObject = localStream;
    updateMediaBadges();
    setStatus(`Using ${currentFacingMode === "user" ? "front" : "back"} camera.`, "live");
  } catch (error) {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    updateMediaBadges();
    setStatus(error.message || "Could not flip the camera.", "error");
  }
}

async function shareScreen() {
  if (!navigator.mediaDevices.getDisplayMedia) {
    setStatus("Screen sharing is not supported in this browser.", "error");
    return;
  }

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    await replaceOutgoingVideo(screenTrack);
    localVideo.srcObject = screenStream;
    setStatus("Screen sharing is on.", "live");

    screenTrack.onended = async () => {
      if (cameraTrack) {
        await replaceOutgoingVideo(cameraTrack);
        localVideo.srcObject = localStream;
        setStatus("Screen sharing stopped.", "live");
      }
    };
  } catch (error) {
    setStatus(error.message || "Screen sharing was cancelled.", "error");
  }
}

function hangUp() {
  activeCall?.close();
  activeConnection?.close();
  peer?.destroy();
  localStream?.getTracks().forEach((track) => track.stop());
  peer = null;
  activeCall = null;
  activeConnection = null;
  localStream = null;
  cameraTrack = null;
  remoteEffects = { filter: "normal", backdrop: "none" };
  applyRemoteEffects();
  document.body.classList.remove("has-media");
  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
  remoteEmpty.classList.remove("is-hidden");
  localEmpty.classList.remove("is-hidden");
  muteButton.disabled = true;
  cameraButton.disabled = true;
  screenButton.disabled = true;
  snapshotButton.disabled = true;
  flipButton.disabled = true;
  hangupButton.disabled = true;
  waitingCard.hidden = true;
  knockCard.hidden = true;
  pendingKnockConnection = null;
  updateBadge(connectionBadge, "Ready");
  updateBadge(micBadge, "Mic ready");
  updateBadge(cameraBadge, "Camera ready");
  setBusy(false);
  setStatus("Call ended. Create or join another room when ready.");
}

async function copyInvite() {
  if (!inviteInput.value) {
    return;
  }

  await copyText(inviteInput.value, "Invite link copied.");
}

async function shareInvite() {
  if (!inviteInput.value) {
    return;
  }

  const roomName = cleanRoomName(roomNameInput.value);
  const shareText = roomName
    ? `Join my ${roomName} FaceCall room. Code: ${currentRoomId || cleanRoomId(roomInput.value)}.`
    : `Join my FaceCall room. Code: ${currentRoomId || cleanRoomId(roomInput.value)}.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join my FaceCall",
        text: shareText,
        url: inviteInput.value
      });
      setStatus("Invite shared.", "live");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  await copyInvite();
}

async function copyRoomCode() {
  const roomId = currentRoomId || cleanRoomId(roomInput.value);
  if (!roomId) {
    return;
  }

  await copyText(roomId, "Room code copied.");
}

function toggleChat() {
  const isOpen = !chatDrawer.classList.contains("is-open");
  chatDrawer.classList.toggle("is-open", isOpen);
  chatDrawer.setAttribute("aria-hidden", String(!isOpen));
  chatButton.classList.remove("is-off");
  if (isOpen) {
    chatInput.focus();
  }
}

function toggleDrawer(drawer, trigger, forceOpen) {
  const isOpen = forceOpen ?? !drawer.classList.contains("is-open");
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  trigger.classList.toggle("is-off", isOpen);
  if (isOpen) {
    resizeWhiteboard();
  }
}

function closeToolDrawers(exceptDrawer = null) {
  if (exceptDrawer !== effectsDrawer) {
    toggleDrawer(effectsDrawer, effectsButton, false);
  }
  if (exceptDrawer !== playDrawer) {
    toggleDrawer(playDrawer, playButton, false);
  }
}

function setPlayTab(tabName) {
  playTabButtons.forEach((button) => {
    const isActive = button.dataset.playTab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  playPanels.forEach((panel) => {
    panel.hidden = panel.dataset.playPanel !== tabName;
  });

  if (tabName === "board") {
    resizeWhiteboard();
  }
}

function canvasFilterForCurrentEffect() {
  const filters = {
    normal: "none",
    soft: "brightness(1.08) contrast(0.92) saturate(1.16)",
    noir: "grayscale(1) contrast(1.18)",
    warm: "sepia(0.22) saturate(1.22) brightness(1.04)",
    cool: "hue-rotate(178deg) saturate(1.18) brightness(1.03)",
    party: "hue-rotate(42deg) saturate(1.75) contrast(1.08)",
    comic: "saturate(1.9) contrast(1.38) brightness(1.04)"
  };
  return filters[localEffects.filter] || "none";
}

function saveSnapshot() {
  if (!localStream || localVideo.readyState < 2) {
    setStatus("Start your camera before taking a snapshot.", "error");
    return;
  }

  const canvas = document.createElement("canvas");
  const width = localVideo.videoWidth || 1280;
  const height = localVideo.videoHeight || 720;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.save();
  context.filter = canvasFilterForCurrentEffect();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(localVideo, 0, 0, width, height);
  context.restore();

  const link = document.createElement("a");
  link.download = `facecall-snapshot-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  setStatus("Snapshot saved.", "live");
}

function addChatMessage(name, message, side) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${side === "local" ? "is-local" : ""}`;
  const sender = document.createElement("strong");
  sender.textContent = name;
  const text = document.createElement("span");
  text.textContent = message;
  bubble.append(sender, text);
  chatLog.append(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function sendChatMessage(event) {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  addChatMessage(localProfile.name, message, "local");
  if (activeConnection?.open) {
    activeConnection.send({ type: "chat", name: localProfile.name, message });
  } else {
    setStatus("No one is connected to receive chat yet.", "error");
  }
  chatInput.value = "";
}

createButton.addEventListener("click", createRoom);
joinButton.addEventListener("click", joinRoom);
copyButton.addEventListener("click", copyInvite);
copyCodeButton.addEventListener("click", copyRoomCode);
newRoomButton.addEventListener("click", () => {
  const roomId = makeRoomId();
  roomInput.value = roomId;
  setInvite(roomId, false);
  setStatus("New room code ready. Create or share it when you are ready.", "live");
});
clearRecentRoomsButton.addEventListener("click", () => {
  saveRecentRooms([]);
  renderRecentRooms();
  setStatus("Recent rooms cleared.");
});
installButton.addEventListener("click", installFaceCall);
shareAppButton.addEventListener("click", shareFaceCall);
copyAppButton.addEventListener("click", () => copyText(appLinkInput.value, "Website link copied."));
nativeShareButton.addEventListener("click", shareInvite);
approvalToggle.addEventListener("change", () => {
  saveApprovalSetting();
  setStatus(approvalToggle.checked ? "Guest approval is on." : "Guest approval is off.", "live");
});
approveGuestButton.addEventListener("click", approveGuest);
declineGuestButton.addEventListener("click", declineGuest);
settingsButton.addEventListener("click", toggleSettings);
panelCollapseButton.addEventListener("click", () => setSettingsCollapsed(true));
muteButton.addEventListener("click", toggleMute);
cameraButton.addEventListener("click", toggleCamera);
flipButton.addEventListener("click", flipCamera);
screenButton.addEventListener("click", shareScreen);
snapshotButton.addEventListener("click", saveSnapshot);
effectsButton.addEventListener("click", () => {
  const willOpen = !effectsDrawer.classList.contains("is-open");
  closeToolDrawers(effectsDrawer);
  toggleDrawer(effectsDrawer, effectsButton, willOpen);
});
effectsCloseButton.addEventListener("click", () => toggleDrawer(effectsDrawer, effectsButton, false));
playButton.addEventListener("click", () => {
  const willOpen = !playDrawer.classList.contains("is-open");
  closeToolDrawers(playDrawer);
  toggleDrawer(playDrawer, playButton, willOpen);
});
playCloseButton.addEventListener("click", () => toggleDrawer(playDrawer, playButton, false));
chatButton.addEventListener("click", toggleChat);
chatCloseButton.addEventListener("click", toggleChat);
chatForm.addEventListener("submit", sendChatMessage);
ringButton.addEventListener("click", toggleRing);
hangupButton.addEventListener("click", hangUp);
localTile.addEventListener("pointerdown", beginPreviewDrag);
localTile.addEventListener("pointermove", movePreviewDrag);
localTile.addEventListener("pointerup", endPreviewDrag);
localTile.addEventListener("pointercancel", endPreviewDrag);
window.addEventListener("resize", () => {
  restorePreviewPosition();
  resizeWhiteboard();
});

filterControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) {
    return;
  }
  localEffects.filter = button.dataset.filter;
  saveEffects();
  applyLocalEffects();
  sendLocalEffects();
  setStatus(`Filter set to ${button.textContent}.`, "live");
});

backdropControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-backdrop]");
  if (!button) {
    return;
  }
  localEffects.backdrop = button.dataset.backdrop;
  saveEffects();
  applyLocalEffects();
  sendLocalEffects();
  setStatus(`Backdrop set to ${button.textContent}.`, "live");
});

qualitySelect.addEventListener("change", () => {
  qualityMode = qualitySelect.value;
  saveQualityMode();
  applyQualityMode();
});

reactionControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reaction]");
  if (button) {
    sendReaction(button.dataset.reaction);
  }
});

resetTicTacToeButton.addEventListener("click", () => resetTicTacToe(true));
resetRpsButton.addEventListener("click", () => resetRps(true));

rpsControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rps]");
  if (button) {
    chooseRps(button.dataset.rps);
  }
});

whiteboardCanvas.addEventListener("pointerdown", startWhiteboardDraw);
whiteboardCanvas.addEventListener("pointermove", moveWhiteboardDraw);
whiteboardCanvas.addEventListener("pointerup", endWhiteboardDraw);
whiteboardCanvas.addEventListener("pointercancel", endWhiteboardDraw);
clearWhiteboardButton.addEventListener("click", () => clearWhiteboard(true));

playTabButtons.forEach((button) => {
  button.addEventListener("click", () => setPlayTab(button.dataset.playTab));
});

profileNameInput.addEventListener("input", () => {
  localProfile.name = cleanProfileName(profileNameInput.value);
  saveProfile();
  applyProfilePreview(false);
  sendLocalProfile();
});

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setStatus("Choose an image file for your profile picture.", "error");
    return;
  }

  try {
    localProfile.avatar = await resizeProfileImage(file);
    saveProfile();
    applyProfilePreview();
    sendLocalProfile();
    setStatus("Profile picture updated.", "live");
  } catch (error) {
    setStatus(error.message || "Could not update that profile picture.", "error");
  } finally {
    avatarInput.value = "";
  }
});

roomInput.addEventListener("input", () => {
  const cleaned = cleanRoomId(roomInput.value);
  if (roomInput.value !== cleaned) {
    roomInput.value = cleaned;
  }
});

roomNameInput.addEventListener("input", () => {
  if (currentRoomId) {
    rememberRoom(currentRoomId, roomNameInput.value);
  }
});

roomInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    joinRoom();
  }
});

window.addEventListener("hashchange", () => {
  const roomId = roomFromLocation();
  if (roomId) {
    roomInput.value = roomId;
    setInvite(roomId, false);
    setStatus("Room link loaded. Click Join Room to enter.");
  }
});

const roomFromUrl = roomFromLocation();
if (roomFromUrl) {
  roomInput.value = roomFromUrl;
  setInvite(roomFromUrl, false);
  setStatus("Room link loaded. Click Join Room to enter.");
}

applyProfilePreview();
applyProfile("remote", remoteProfile);
setupQuickAccess();
renderRecentRooms();
applyLocalEffects();
applyRemoteEffects();
qualitySelect.value = qualityMode;
renderTicTacToe();
renderRps();
approvalToggle.checked = loadApprovalSetting();
setPlayTab("reactions");
resizeWhiteboard();
registerServiceWorker();
renderRingButton();
updateMediaBadges();
restorePreviewPosition();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.disabled = false;
  installHelp.textContent = "FaceCall is ready to install on this device.";
});
