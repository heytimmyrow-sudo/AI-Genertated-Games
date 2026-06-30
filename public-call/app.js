const roomInput = document.querySelector("#roomInput");
const inviteInput = document.querySelector("#inviteInput");
const createButton = document.querySelector("#createButton");
const joinButton = document.querySelector("#joinButton");
const copyButton = document.querySelector("#copyButton");
const nativeShareButton = document.querySelector("#nativeShareButton");
const settingsButton = document.querySelector("#settingsButton");
const muteButton = document.querySelector("#muteButton");
const cameraButton = document.querySelector("#cameraButton");
const flipButton = document.querySelector("#flipButton");
const screenButton = document.querySelector("#screenButton");
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

const profileStorageKey = "facecall-profile-v1";
const previewStorageKey = "facecall-preview-position-v1";
const ringStorageKey = "facecall-ring-v1";

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

function cleanRoomId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

function makeRoomId() {
  const words = ["call", "room", "hello", "family", "video", "chat"];
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
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

function handleDataMessage(data) {
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
  }
}

function bindConnection(connection) {
  activeConnection = connection;
  connection.on("open", () => {
    sendLocalProfile();
    updateBadge(connectionBadge, "Guest joined", "live");
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

function setInvite(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  inviteInput.value = url.toString();
  copyButton.disabled = false;
  nativeShareButton.disabled = false;
  window.history.replaceState({}, "", url);
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
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: currentFacingMode
    }
  });

  cameraTrack = localStream.getVideoTracks()[0] || null;
  localVideo.srcObject = localStream;
  document.body.classList.add("has-media");
  localEmpty.classList.add("is-hidden");
  muteButton.disabled = false;
  cameraButton.disabled = false;
  flipButton.disabled = false;
  screenButton.disabled = false;
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
      setInvite(id);
      waitingCard.hidden = false;
      updateBadge(connectionBadge, "Waiting", "warn");
      setStatus("Room is open. Share the invite link and keep this tab open.", "live");
      setBusy(false);
      return;
    }

    setStatus("Calling the room now...");
    waitingCard.hidden = true;
    updateBadge(connectionBadge, "Calling", "warn");
    const outgoing = peer.call(roomId, localStream, { metadata: { profile: localProfile } });
    bindCall(outgoing);
    bindConnection(peer.connect(roomId));
    setBusy(false);
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
    bindConnection(connection);
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
    setStatus("Asking for camera and microphone permission...");
    await ensureLocalStream();

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
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: currentFacingMode
      }
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
  document.body.classList.remove("has-media");
  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
  remoteEmpty.classList.remove("is-hidden");
  localEmpty.classList.remove("is-hidden");
  muteButton.disabled = true;
  cameraButton.disabled = true;
  screenButton.disabled = true;
  flipButton.disabled = true;
  hangupButton.disabled = true;
  waitingCard.hidden = true;
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

  await navigator.clipboard.writeText(inviteInput.value);
  setStatus("Invite link copied.", "live");
}

async function shareInvite() {
  if (!inviteInput.value) {
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join my FaceCall",
        text: "Join my FaceCall room.",
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

function toggleChat() {
  const isOpen = !chatDrawer.classList.contains("is-open");
  chatDrawer.classList.toggle("is-open", isOpen);
  chatDrawer.setAttribute("aria-hidden", String(!isOpen));
  chatButton.classList.remove("is-off");
  if (isOpen) {
    chatInput.focus();
  }
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
nativeShareButton.addEventListener("click", shareInvite);
settingsButton.addEventListener("click", toggleSettings);
panelCollapseButton.addEventListener("click", () => setSettingsCollapsed(true));
muteButton.addEventListener("click", toggleMute);
cameraButton.addEventListener("click", toggleCamera);
flipButton.addEventListener("click", flipCamera);
screenButton.addEventListener("click", shareScreen);
chatButton.addEventListener("click", toggleChat);
chatCloseButton.addEventListener("click", toggleChat);
chatForm.addEventListener("submit", sendChatMessage);
ringButton.addEventListener("click", toggleRing);
hangupButton.addEventListener("click", hangUp);
localTile.addEventListener("pointerdown", beginPreviewDrag);
localTile.addEventListener("pointermove", movePreviewDrag);
localTile.addEventListener("pointerup", endPreviewDrag);
localTile.addEventListener("pointercancel", endPreviewDrag);
window.addEventListener("resize", restorePreviewPosition);

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

const params = new URLSearchParams(window.location.search);
const roomFromUrl = cleanRoomId(params.get("room") || "");
if (roomFromUrl) {
  roomInput.value = roomFromUrl;
  setInvite(roomFromUrl);
  setStatus("Room link loaded. Click Join Room to enter.");
}

applyProfilePreview();
applyProfile("remote", remoteProfile);
renderRingButton();
updateMediaBadges();
restorePreviewPosition();
