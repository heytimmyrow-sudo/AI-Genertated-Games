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
const localEmpty = document.querySelector("#localEmpty");
const remoteEmpty = document.querySelector("#remoteEmpty");

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
    const outgoing = peer.call(roomId, localStream);
    bindCall(outgoing);
    activeConnection = peer.connect(roomId);
    activeConnection.on("open", () => setStatus("Handshake complete. Waiting for video...", "live"));
    setBusy(false);
  });

  peer.on("call", async (call) => {
    await ensureLocalStream();
    call.answer(localStream);
    bindCall(call);
    setStatus("Incoming guest connected. Waiting for video...", "live");
  });

  peer.on("connection", (connection) => {
    activeConnection = connection;
    connection.on("open", () => connection.send({ type: "host-ready" }));
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
