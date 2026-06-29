const roomInput = document.querySelector("#roomInput");
const inviteInput = document.querySelector("#inviteInput");
const createButton = document.querySelector("#createButton");
const joinButton = document.querySelector("#joinButton");
const copyButton = document.querySelector("#copyButton");
const muteButton = document.querySelector("#muteButton");
const cameraButton = document.querySelector("#cameraButton");
const screenButton = document.querySelector("#screenButton");
const hangupButton = document.querySelector("#hangupButton");
const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");
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

const profileStorageKey = "facecall-profile-v1";
const previewStorageKey = "facecall-preview-position-v1";

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

function handleProfileMessage(data) {
  if (data?.type !== "profile" || !data.profile) {
    return;
  }

  remoteProfile = {
    name: cleanProfileName(data.profile.name || "Guest"),
    avatar: typeof data.profile.avatar === "string" ? data.profile.avatar : ""
  };
  applyProfile("remote", remoteProfile);
}

function bindConnection(connection) {
  activeConnection = connection;
  connection.on("open", () => {
    sendLocalProfile();
    setStatus("Handshake complete. Waiting for video...", "live");
  });
  connection.on("data", handleProfileMessage);
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
      facingMode: "user"
    }
  });

  cameraTrack = localStream.getVideoTracks()[0] || null;
  localVideo.srcObject = localStream;
  document.body.classList.add("has-media");
  localEmpty.classList.add("is-hidden");
  muteButton.disabled = false;
  cameraButton.disabled = false;
  screenButton.disabled = false;
  hangupButton.disabled = false;
  return localStream;
}

function attachRemoteStream(stream) {
  remoteVideo.srcObject = stream;
  remoteEmpty.classList.add("is-hidden");
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
    setStatus("The other person left the call.");
  });
  call.on("error", (error) => setStatus(error.message || "The call disconnected.", "error"));
}

function bindPeerEvents(roomId, isHost) {
  peer.on("open", (id) => {
    if (isHost) {
      setInvite(id);
      setStatus("Room is open. Share the invite link and keep this tab open.", "live");
      setBusy(false);
      return;
    }

    setStatus("Calling the room now...");
    const outgoing = peer.call(roomId, localStream, { metadata: { profile: localProfile } });
    bindCall(outgoing);
    bindConnection(peer.connect(roomId));
    setBusy(false);
  });

  peer.on("call", async (call) => {
    if (call.metadata?.profile) {
      handleProfileMessage({ type: "profile", profile: call.metadata.profile });
    }
    await ensureLocalStream();
    call.answer(localStream);
    bindCall(call);
    setStatus("Incoming guest connected. Waiting for video...", "live");
  });

  peer.on("connection", (connection) => {
    bindConnection(connection);
  });

  peer.on("disconnected", () => setStatus("Signaling disconnected. Trying to reconnect..."));
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
    setBusy(true);
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
    setBusy(true);
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
}

function toggleCamera() {
  isCameraOff = !isCameraOff;
  localStream?.getVideoTracks().forEach((track) => {
    track.enabled = !isCameraOff;
  });
  cameraButton.classList.toggle("is-off", isCameraOff);
  cameraButton.querySelector("span").textContent = isCameraOff ? "Off" : "Cam";
  cameraButton.setAttribute("aria-label", isCameraOff ? "Turn camera on" : "Turn camera off");
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
  hangupButton.disabled = true;
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

createButton.addEventListener("click", createRoom);
joinButton.addEventListener("click", joinRoom);
copyButton.addEventListener("click", copyInvite);
muteButton.addEventListener("click", toggleMute);
cameraButton.addEventListener("click", toggleCamera);
screenButton.addEventListener("click", shareScreen);
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
restorePreviewPosition();
