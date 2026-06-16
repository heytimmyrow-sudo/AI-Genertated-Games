(() => {
  const canvas = document.getElementById("gameCanvas");
  const scoreValue = document.getElementById("scoreValue");
  const streakValue = document.getElementById("streakValue");
  const timeValue = document.getElementById("timeValue");
  const waveValue = document.getElementById("waveValue");
  const weaponSlotValue = document.getElementById("weaponSlotValue");
  const weaponValue = document.getElementById("weaponValue");
  const healthValue = document.getElementById("healthValue");
  const ammoValue = document.getElementById("ammoValue");
  const redScoreValue = document.getElementById("redScoreValue");
  const blueScoreValue = document.getElementById("blueScoreValue");
  const objectiveValue = document.getElementById("objectiveValue");
  const roundValue = document.getElementById("roundValue");
  const blueTeamValue = document.getElementById("blueTeamValue");
  const redTeamValue = document.getElementById("redTeamValue");
  const killFeed = document.getElementById("killFeed");
  const hitMarker = document.getElementById("hitMarker");
  const miniMap = document.getElementById("miniMap");
  const miniMapContext = miniMap.getContext("2d");
  const modeSelect = document.getElementById("modeSelect");
  const botCountSelect = document.getElementById("botCountSelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const matchLengthSelect = document.getElementById("matchLengthSelect");
  const playerNameInput = document.getElementById("playerNameInput");
  const roomCodeInput = document.getElementById("roomCodeInput");
  const hostOnlineButton = document.getElementById("hostOnlineButton");
  const joinOnlineButton = document.getElementById("joinOnlineButton");
  const onlineStatusValue = document.getElementById("onlineStatusValue");
  const bestValue = document.getElementById("bestValue");
  const startPanel = document.getElementById("startPanel");
  const endPanel = document.getElementById("endPanel");
  const endTitle = document.getElementById("endTitle");
  const endStats = document.getElementById("endStats");
  const hitPanel = document.getElementById("hitPanel");
  const hitStats = document.getElementById("hitStats");
  const startButton = document.getElementById("startButton");
  const againButton = document.getElementById("againButton");
  const retryButton = document.getElementById("retryButton");
  const menuButton = document.getElementById("menuButton");
  const resetButton = document.getElementById("resetButton");
  const touchFire = document.getElementById("touchFire");
  const touchJump = document.getElementById("touchJump");
  const touchScope = document.getElementById("touchScope");
  const gameShell = document.querySelector(".game-shell");

  const bestKey = "targetRangeFpsBest";
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 160);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();

  const player = {
    yaw: 0,
    pitch: 0,
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(0, 2.1, 22),
    verticalVelocity: 0,
    grounded: true,
    maxHealth: 100,
    health: 100
  };

  const state = {
    running: false,
    score: 0,
    streak: 0,
    wave: 1,
    timeLeft: 90,
    spawnTimer: 0,
    flashTimer: 0,
    recoilTimer: 0,
    scoped: false,
    weaponIndex: 0,
    nextFireAt: 0,
    hitCount: 0,
    enemyShots: 0,
    botHits: 0,
    lastEnemyShotAt: 0,
    botCounter: 0,
    round: 1,
    matchTarget: 25,
    botCount: 12,
    mode: "tdm",
    difficulty: "normal",
    redScore: 0,
    blueScore: 0,
    controlOwner: null,
    controlTickAt: 0,
    reloadUntil: 0,
    best: Number(localStorage.getItem(bestKey) || 0)
  };

  const teams = {
    blue: { name: "Blue", color: 0x43d5ff, dark: 0x18384c, glow: 0x0c6f8f },
    red: { name: "Red", color: 0xff4c65, dark: 0x4a1824, glow: 0x8f182b }
  };

  const weapons = [
    { slot: "1", name: "Pistol", cooldown: 260, pellets: 1, spread: 0.002, speed: 86, life: 1.15, radius: 0.075, color: 0xffd166, recoil: 1, points: 1, damage: 30, mag: 12, reload: 850 },
    { slot: "2", name: "Burst", cooldown: 170, pellets: 1, spread: 0.006, speed: 94, life: 1.08, radius: 0.055, color: 0x43d5ff, recoil: 0.72, points: 0.82, damage: 20, mag: 24, reload: 1050 },
    { slot: "3", name: "Scatter", cooldown: 560, pellets: 7, spread: 0.052, speed: 76, life: 0.72, radius: 0.065, color: 0xff8a4c, recoil: 1.35, points: 0.46, damage: 13, mag: 6, reload: 1350 },
    { slot: "4", name: "Rail", cooldown: 820, pellets: 1, spread: 0, speed: 150, life: 0.82, radius: 0.05, color: 0xf7fafc, recoil: 1.85, points: 2.25, damage: 96, mag: 4, reload: 1600 },
    { slot: "5", name: "Plasma", cooldown: 440, pellets: 1, spread: 0.01, speed: 58, life: 1.6, radius: 0.16, color: 0x9b5cff, recoil: 0.95, points: 1.35, damage: 52, mag: 8, reload: 1400 },
    { slot: "6", name: "Arc", cooldown: 380, pellets: 3, spread: 0.024, speed: 82, life: 1.05, radius: 0.08, color: 0x4ff0b1, recoil: 0.85, points: 0.74, damage: 18, mag: 15, reload: 1150 },
    { slot: "7", name: "SMG", cooldown: 90, pellets: 1, spread: 0.018, speed: 98, life: 0.86, radius: 0.045, color: 0xff4c65, recoil: 0.44, points: 0.52, damage: 13, mag: 36, reload: 1100 },
    { slot: "8", name: "Cannon", cooldown: 980, pellets: 1, spread: 0.004, speed: 66, life: 1.45, radius: 0.22, color: 0xffc857, recoil: 2.25, points: 2.8, damage: 120, mag: 3, reload: 1900 },
    { slot: "9", name: "Needler", cooldown: 130, pellets: 2, spread: 0.015, speed: 112, life: 0.94, radius: 0.038, color: 0xc7ff4f, recoil: 0.36, points: 0.45, damage: 10, mag: 40, reload: 950 },
    { slot: "0", name: "Nova", cooldown: 1250, pellets: 10, spread: 0.06, speed: 72, life: 1.2, radius: 0.1, color: 0xff6bd6, recoil: 2.7, points: 0.72, damage: 16, mag: 2, reload: 2200 }
  ];

  const botClasses = [
    { name: "Rifle", health: 100, speed: 1, shot: 1, colorBoost: 0 },
    { name: "Heavy", health: 170, speed: 0.72, shot: 0.8, colorBoost: -0.08 },
    { name: "Sniper", health: 80, speed: 0.86, shot: 1.35, colorBoost: 0.08 },
    { name: "Medic", health: 90, speed: 1.05, shot: 0.72, colorBoost: 0.16 },
    { name: "Shotgun", health: 115, speed: 0.94, shot: 0.9, colorBoost: -0.02 }
  ];

  const weaponAmmo = weapons.map((weapon) => weapon.mag);

  window.targetRangeFpsStatus = {
    ready: false,
    frames: 0,
    targets: 0,
    bullets: 0,
    player: { x: 0, z: 22, yaw: 0 },
    scoped: false,
    weapon: "Pistol",
    weaponSlot: "1",
    teams: { blue: [], red: ["P1"] },
    running: false
  };
  window.targetRangeFpsDebugStep = (seconds = 1) => {
    const step = Math.min(Math.max(Number(seconds) || 0, 0), 5);
    if (!state.running) return window.targetRangeFpsStatus;
    targets.forEach((target) => {
      target.userData.updatedAt = performance.now() - step * 1000;
      if (target.userData.armed) target.userData.nextShotAt = performance.now() - 1;
    });
    updateTargets(step);
    updateEnemyBullets(step);
    updateObjective(performance.now());
    updatePickups(step);
    drawMiniMap();
    syncHud();
    return window.targetRangeFpsStatus;
  };

  const keys = new Set();
  const touchMoves = new Set();
  const targets = [];
  const bullets = [];
  const enemyBullets = [];
  const particles = [];
  const coverObjects = [];
  const obstacleColliders = [];
  const weaponPickups = [];
  const remotePlayers = new Map();
  const remotePlayerMaterial = new THREE.MeshStandardMaterial({ color: teams.red.color, roughness: 0.42, metalness: 0.45 });
  const remotePlayerCoreMaterial = new THREE.MeshStandardMaterial({ color: teams.red.color, emissive: teams.red.glow, emissiveIntensity: 0.72 });
  let audioContext = null;
  let hitMarkerTimeout = null;
  let nextNetworkSendAt = 0;
  let nextHostSyncAt = 0;
  let lastScopeToggleAt = 0;
  const tempDirection = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const bulletDirection = new THREE.Vector3();
  const bulletStart = new THREE.Vector3();
  const bulletEnd = new THREE.Vector3();
  const muzzlePosition = new THREE.Vector3();
  const closestPoint = new THREE.Vector3();
  const walkTarget = new THREE.Vector3();
  const walkDirection = new THREE.Vector3();
  const obstacleBox = new THREE.Box3();
  const obstacleHitPoint = new THREE.Vector3();
  const controlPoint = new THREE.Vector3(0, 0, -6);
  const difficultySettings = {
    easy: { playerDamage: 0.7, botDamage: 0.85, fireRate: 1.25 },
    normal: { playerDamage: 1, botDamage: 1, fireRate: 1 },
    hard: { playerDamage: 1.25, botDamage: 1.15, fireRate: 0.74 }
  };
  const groundY = 2.1;
  const jumpVelocity = 8.8;
  const gravity = 25;
  const arenaBounds = {
    playerMinX: -56,
    playerMaxX: 56,
    playerMinZ: -50,
    playerMaxZ: 42,
    botMinX: -56,
    botMaxX: 56,
    botMinZ: -48,
    botMaxZ: 38,
    mapMinX: -62,
    mapMaxX: 62,
    mapMinZ: -56,
    mapMaxZ: 46
  };
  const net = {
    peer: null,
    id: "",
    roomCode: "",
    isHost: false,
    online: false,
    connections: new Map(),
    playerName: "P1"
  };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.background = new THREE.Color(0x07101a);
  scene.fog = new THREE.Fog(0x07101a, 28, 92);

  const hemi = new THREE.HemisphereLight(0x9ad8ff, 0x122012, 1.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0c2, 1.7);
  sun.position.set(-16, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const floorTexture = makeGridTexture();
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(22, 20);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 116),
    new THREE.MeshStandardMaterial({ color: 0x15202b, roughness: 0.82, metalness: 0.08, map: floorTexture })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x18293a, roughness: 0.7, metalness: 0.12 });
  addWall(0, 4, -56, 124, 8, 2);
  addWall(0, 4, 46, 124, 8, 2);
  addWall(-62, 4, -5, 2, 8, 104);
  addWall(62, 4, -5, 2, 8, 104);

  for (let index = 0; index < 26; index += 1) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5 + Math.random() * 4, 1.2),
      new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0x27455c : 0x203342, roughness: 0.62 })
    );
    const row = index < 13 ? -43 : 34;
    pillar.position.set(-50 + (index % 13) * 8.4, pillar.geometry.parameters.height / 2, row + Math.sin(index) * 2.5);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }

  const muzzleLight = new THREE.PointLight(0xffd166, 0, 12, 2);
  camera.add(muzzleLight);
  const gun = makeGun();
  camera.add(gun);
  scene.add(camera);

  const enemyGunMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.32, metalness: 0.72 });
  createCoverObjects();
  createControlPoint();
  createWeaponPickups();
  bestValue.textContent = state.best;
  syncWeaponHud();
  resize();
  resetTargets();
  window.targetRangeFpsStatus.ready = true;
  document.body.dataset.fpsReady = "true";
  animate();

  function addWall(x, y, z, width, height, depth) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  function updateOnlineStatus(message) {
    onlineStatusValue.textContent = message;
    document.body.dataset.fpsOnline = net.online ? (net.isHost ? "host" : "guest") : "offline";
    document.body.dataset.fpsRoom = net.roomCode;
  }

  function getPlayerName() {
    const cleanName = playerNameInput.value.trim().replace(/[^\w -]/g, "").slice(0, 12);
    return cleanName || "P1";
  }

  function makeRoomCode() {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function ensurePeerAvailable() {
    if (!window.Peer) {
      updateOnlineStatus("Online failed: PeerJS could not load.");
      return false;
    }
    return true;
  }

  function hostOnline() {
    if (!ensurePeerAvailable()) return;
    cleanupNetwork();
    net.isHost = true;
    net.online = true;
    net.playerName = getPlayerName();
    net.roomCode = makeRoomCode();
    net.id = `trfps-${net.roomCode}`;
    updateOnlineStatus(`Hosting room ${net.roomCode}. Share this code.`);
    net.peer = new Peer(net.id, { debug: 0 });
    net.peer.on("open", () => updateOnlineStatus(`Hosting room ${net.roomCode}. Share this code.`));
    net.peer.on("connection", (connection) => registerConnection(connection));
    net.peer.on("error", (error) => {
      if (error?.type === "unavailable-id" || error?.type === "invalid-id") {
        cleanupNetwork();
        updateOnlineStatus("Host failed. Try Host Online again.");
        return;
      }
      updateOnlineStatus(`Hosting ${net.roomCode}. Connection hiccup; room is still open.`);
    });
  }

  function joinOnline() {
    if (!ensurePeerAvailable()) return;
    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      updateOnlineStatus("Type a room code first.");
      return;
    }
    cleanupNetwork();
    net.isHost = false;
    net.online = true;
    net.playerName = getPlayerName();
    net.roomCode = code;
    updateOnlineStatus(`Joining room ${code}...`);
    net.peer = new Peer(undefined, { debug: 0 });
    net.peer.on("open", () => {
      net.id = net.peer.id;
      const connection = net.peer.connect(`trfps-${code}`, { reliable: false });
      registerConnection(connection);
    });
    net.peer.on("error", () => {
      cleanupNetwork();
      updateOnlineStatus("Join failed. Check the room code.");
    });
  }

  function cleanupNetwork() {
    net.connections.forEach((connection) => connection.close?.());
    net.connections.clear();
    remotePlayers.forEach((remote) => scene.remove(remote.group));
    remotePlayers.clear();
    if (net.peer) {
      net.peer.destroy?.();
      net.peer = null;
    }
    net.online = false;
    net.isHost = false;
    net.id = "";
    net.roomCode = "";
    syncTeamHud();
    updateOnlineStatus("Offline: bots still play.");
  }

  function registerConnection(connection) {
    connection.on("open", () => {
      net.connections.set(connection.peer, connection);
      connection.send({
        type: "hello",
        id: net.id || net.peer?.id,
        name: net.playerName,
        host: net.isHost,
        running: state.running,
        settings: getSettingsPayload()
      });
      if (net.isHost && state.running) sendStartToConnection(connection);
      updateOnlineStatus(net.isHost
        ? `Hosting ${net.roomCode} | Players ${net.connections.size + 1}`
        : `Connected to ${net.roomCode}`);
    });
    connection.on("data", (message) => handleNetworkMessage(connection, message));
    connection.on("close", () => {
      net.connections.delete(connection.peer);
      removeRemotePlayer(connection.peer);
      updateOnlineStatus(net.isHost
        ? `Hosting ${net.roomCode} | Players ${net.connections.size + 1}`
        : "Disconnected from host.");
    });
    connection.on("error", () => updateOnlineStatus("Online connection hiccup."));
  }

  function handleNetworkMessage(connection, message) {
    if (!message || typeof message !== "object") return;
    if (message.type === "hello") {
      upsertRemotePlayer(connection.peer, message.name || "Player");
      syncTeamHud();
      return;
    }
    if (message.type === "start" && !net.isHost) {
      applyRemoteSettings(message.settings);
      startGame({ fromNetwork: true });
      return;
    }
    if (message.type === "player") {
      const remotePeerId = net.isHost ? connection.peer : (message.peer || connection.peer);
      upsertRemotePlayer(remotePeerId, message.name || "Player", message);
      if (net.isHost) broadcast({ ...message, peer: connection.peer }, connection.peer);
      return;
    }
    if (message.type === "shot") {
      spawnRemoteShot(message);
      if (net.isHost) {
        handleRemoteShot(connection.peer, message);
        broadcast({ ...message, peer: connection.peer }, connection.peer);
      }
      return;
    }
    if (message.type === "world" && !net.isHost) {
      applyWorldSnapshot(message);
      return;
    }
    if (message.type === "damage" && !net.isHost) {
      damagePlayer(message.amount || 0, message.source || "Online robot");
      return;
    }
    if (message.type === "feed") addFeed(message.text || "Online event");
  }

  function broadcast(message, exceptPeer = "") {
    net.connections.forEach((connection, peerId) => {
      if (peerId !== exceptPeer && connection.open) connection.send(message);
    });
  }

  function getSettingsPayload() {
    return {
      mode: state.mode,
      botCount: state.botCount,
      difficulty: state.difficulty,
      matchTarget: state.matchTarget
    };
  }

  function applyRemoteSettings(settings = {}) {
    modeSelect.value = settings.mode || modeSelect.value;
    botCountSelect.value = String(settings.botCount || botCountSelect.value);
    difficultySelect.value = settings.difficulty || difficultySelect.value;
    matchLengthSelect.value = String(settings.matchTarget || matchLengthSelect.value);
    applySettings();
  }

  function createCoverObjects() {
    const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x25384b, roughness: 0.76, metalness: 0.18 });
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x33485d, roughness: 0.68, metalness: 0.22 });
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4052, roughness: 0.7, metalness: 0.16 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x43d5ff, emissive: 0x0c6f8f, emissiveIntensity: 0.18, roughness: 0.42 });

    addBarricade(-44, -38, 12, 2.7, 2.2, 0, coverMaterial, trimMaterial);
    addBarricade(-9, -39, 16, 2.3, 2, 0.08, coverMaterial, trimMaterial);
    addBarricade(31, -38, 12, 2.5, 2.4, -0.08, coverMaterial, trimMaterial);
    addBarricade(-51, -7, 10, 2.8, 2.3, Math.PI / 2, coverMaterial, trimMaterial);
    addBarricade(-14, -7, 5, 2.8, 11, 0, coverMaterial, trimMaterial);
    addBarricade(18, 3, 17, 2.2, 2.2, 0.12, coverMaterial, trimMaterial);
    addBarricade(50, 12, 11, 2.5, 2.4, Math.PI / 2, coverMaterial, trimMaterial);
    addBarricade(-42, 31, 15, 2.2, 2, -0.1, coverMaterial, trimMaterial);
    addBarricade(31, 31, 7, 2.9, 11, 0, coverMaterial, trimMaterial);

    addCrateStack(-29, -28, 3, crateMaterial, trimMaterial);
    addCrateStack(7, -30, 4, crateMaterial, trimMaterial);
    addCrateStack(46, -25, 3, crateMaterial, trimMaterial);
    addCrateStack(-27, 9, 4, crateMaterial, trimMaterial);
    addCrateStack(-18, 33, 3, crateMaterial, trimMaterial);
    addCrateStack(4, 25, 3, crateMaterial, trimMaterial);

    addTower(-4, -19, 3.2, 8.5, coverMaterial, trimMaterial);
    addTower(38, -6, 3.4, 9.5, coverMaterial, trimMaterial);
    addTower(-37, 19, 3.4, 8.8, coverMaterial, trimMaterial);
    addTower(11, 33, 3.1, 8.2, coverMaterial, trimMaterial);

    addRamp(-24, -3, 7.5, 1.8, 5.5, 0.18, rampMaterial);
    addRamp(24, -19, 7.5, 1.8, 5.5, -0.2, rampMaterial);
    addRamp(-2, 15, 9, 2, 5.5, Math.PI, rampMaterial);

    addArchway(0, -47, 11, 7.5, 2.2, coverMaterial, trimMaterial);
    addArchway(0, 40, 13, 8, 2.2, coverMaterial, trimMaterial);
  }

  function registerObstacle(mesh, navigable = true) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (navigable) {
      coverObjects.push(mesh);
      mesh.updateMatrixWorld(true);
      obstacleBox.setFromObject(mesh);
      obstacleColliders.push({ object: mesh, box: obstacleBox.clone() });
    }
    return mesh;
  }

  function addBarricade(x, z, width, height, depth, rotation, material, trimMaterial) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material.clone());
    const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.22, depth + 0.25), trimMaterial.clone());
    base.position.y = height / 2;
    cap.position.y = height + 0.15;
    [base, cap].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      group.add(part);
    });
    registerObstacle(group);
  }

  function addCrateStack(x, z, count, material, trimMaterial) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    for (let index = 0; index < count; index += 1) {
      const size = index % 2 === 0 ? 2.3 : 1.9;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material.clone());
      crate.position.set((index % 2) * 1.7 - 0.85, size / 2 + Math.floor(index / 2) * 1.7, Math.sin(index) * 0.55);
      crate.rotation.y = index * 0.22;
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);
    }
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.18), trimMaterial.clone());
    beacon.position.set(0, 2.65, 0);
    group.add(beacon);
    registerObstacle(group);
  }

  function addTower(x, z, radius, height, material, trimMaterial) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.12, height, 8), material.clone());
    tower.position.set(x, height / 2, z);
    tower.rotation.y = Math.PI / 8;
    registerObstacle(tower);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.05, 0.08, 8, 24), trimMaterial.clone());
    ring.position.set(x, height + 0.08, z);
    ring.rotation.x = Math.PI / 2;
    registerObstacle(ring, false);
  }

  function addRamp(x, z, width, height, depth, rotation, material) {
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material.clone());
    ramp.position.set(x, height / 2, z);
    ramp.rotation.set(-0.22, rotation, 0);
    registerObstacle(ramp);
  }

  function addArchway(x, z, width, height, depth, material, trimMaterial) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const left = new THREE.Mesh(new THREE.BoxGeometry(1.7, height, depth), material.clone());
    const right = new THREE.Mesh(new THREE.BoxGeometry(1.7, height, depth), material.clone());
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 1.4, depth), material.clone());
    const trim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.2, depth + 0.4), trimMaterial.clone());
    left.position.set(-width / 2, height / 2, 0);
    right.position.set(width / 2, height / 2, 0);
    top.position.set(0, height, 0);
    trim.position.set(0, height + 0.82, 0);
    [left, right, top, trim].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      group.add(part);
    });
    registerObstacle(group);
  }

  function createControlPoint() {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 0.14, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.28 })
    );
    base.position.copy(controlPoint).setY(0.08);
    scene.add(base);
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.32, 4.2, 18),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.42 })
    );
    beacon.position.copy(controlPoint).setY(2.1);
    scene.add(beacon);
  }

  function createWeaponPickups() {
    const pickupGeometry = new THREE.BoxGeometry(1.2, 0.42, 1.2);
    const slots = [
      [-48, 34, 1],
      [-36, -42, 2],
      [-8, 36, 4],
      [18, -44, 6],
      [44, 19, 8],
      [6, -12, 9],
      [52, -34, 3],
      [-52, -9, 7]
    ];
    slots.forEach(([x, z, weaponIndex]) => {
      const weapon = weapons[weaponIndex];
      const pickup = new THREE.Mesh(
        pickupGeometry,
        new THREE.MeshStandardMaterial({ color: weapon.color, emissive: weapon.color, emissiveIntensity: 0.18, roughness: 0.34 })
      );
      pickup.position.set(x, 0.55, z);
      pickup.castShadow = true;
      pickup.userData = { weaponIndex, respawnAt: 0, baseY: 0.55 };
      scene.add(pickup);
      weaponPickups.push(pickup);
    });
  }

  function makeRemotePlayer(name) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.35, 0.48), remotePlayerMaterial.clone());
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.54), remotePlayerMaterial.clone());
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.08), remotePlayerCoreMaterial.clone());
    const gunModel = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.16, 0.82),
      new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.32, metalness: 0.7 })
    );
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), remotePlayerCoreMaterial.clone());
    body.position.y = 1.25;
    head.position.y = 2.18;
    core.position.set(0, 1.46, 0.28);
    gunModel.position.set(0.6, 1.32, 0.45);
    marker.position.y = 2.95;
    [body, head, core, gunModel, marker].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      group.add(part);
    });
    group.userData = { name, team: "red", body, head, core, gunModel, marker, health: 100 };
    scene.add(group);
    return group;
  }

  function upsertRemotePlayer(peerId, name, message = null) {
    if (!peerId) return null;
    let remote = remotePlayers.get(peerId);
    if (!remote) {
      remote = { group: makeRemotePlayer(name), name, lastSeen: performance.now() };
      remotePlayers.set(peerId, remote);
    }
    remote.name = name || remote.name;
    remote.lastSeen = performance.now();
    if (message?.position) {
      remote.group.position.set(message.position.x, 0, message.position.z);
      remote.group.rotation.y = message.yaw || 0;
      remote.group.userData.health = message.health ?? remote.group.userData.health;
      remote.group.userData.marker.visible = Boolean(message.scoped);
    }
    return remote;
  }

  function removeRemotePlayer(peerId) {
    const remote = remotePlayers.get(peerId);
    if (!remote) return;
    scene.remove(remote.group);
    remotePlayers.delete(peerId);
    syncTeamHud();
  }

  function getPlayerSnapshot() {
    return {
      type: "player",
      name: net.playerName,
      position: {
        x: Number(player.position.x.toFixed(3)),
        y: Number(player.position.y.toFixed(3)),
        z: Number(player.position.z.toFixed(3))
      },
      yaw: Number(player.yaw.toFixed(4)),
      pitch: Number(player.pitch.toFixed(4)),
      health: Math.max(0, Math.ceil(player.health)),
      weaponIndex: state.weaponIndex,
      scoped: state.scoped
    };
  }

  function getBotSnapshot() {
    return targets.map((target) => ({
      name: target.userData.name,
      team: target.userData.team,
      x: Number(target.position.x.toFixed(3)),
      z: Number(target.position.z.toFixed(3)),
      yaw: Number(target.rotation.y.toFixed(4)),
      health: Math.ceil(target.userData.health),
      maxHealth: target.userData.maxHealth,
      alive: target.userData.alive,
      armed: target.userData.armed,
      className: target.userData.className
    }));
  }

  function applyWorldSnapshot(message) {
    if (typeof message.redScore === "number") state.redScore = message.redScore;
    if (typeof message.blueScore === "number") state.blueScore = message.blueScore;
    if (typeof message.timeLeft === "number") state.timeLeft = message.timeLeft;
    if (typeof message.controlOwner !== "undefined") state.controlOwner = message.controlOwner;
    if (Array.isArray(message.bots)) {
      while (targets.length < message.bots.length) makeTarget();
      message.bots.forEach((snapshot, index) => {
        const target = targets[index];
        if (!target) return;
        target.position.set(snapshot.x, 0, snapshot.z);
        target.rotation.y = snapshot.yaw;
        target.userData.health = snapshot.health;
        target.userData.maxHealth = snapshot.maxHealth || target.userData.maxHealth;
        target.userData.alive = snapshot.alive;
        target.userData.team = snapshot.team;
        target.userData.name = snapshot.name;
        target.userData.className = snapshot.className || target.userData.className;
        target.visible = snapshot.alive;
        updateHealthBar(target);
      });
    }
    syncTeamHud();
  }

  function sendStartToConnection(connection) {
    if (connection.open) connection.send({ type: "start", settings: getSettingsPayload() });
  }

  function sendNetworkUpdates(now) {
    if (!net.online || now < nextNetworkSendAt) return;
    nextNetworkSendAt = now + 75;
    const snapshot = getPlayerSnapshot();
    if (net.isHost) {
      broadcast(snapshot);
    } else {
      const hostConnection = [...net.connections.values()][0];
      if (hostConnection?.open) hostConnection.send(snapshot);
    }
  }

  function sendHostWorld(now) {
    if (!net.online || !net.isHost || now < nextHostSyncAt) return;
    nextHostSyncAt = now + 120;
    broadcast({
      type: "world",
      bots: getBotSnapshot(),
      redScore: state.redScore,
      blueScore: state.blueScore,
      timeLeft: state.timeLeft,
      controlOwner: state.controlOwner
    });
  }

  function makeGridTexture() {
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = 256;
    gridCanvas.height = 256;
    const context = gridCanvas.getContext("2d");
    context.fillStyle = "#162432";
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = "rgba(67, 213, 255, 0.22)";
    context.lineWidth = 2;
    for (let line = 0; line <= 256; line += 32) {
      context.beginPath();
      context.moveTo(line, 0);
      context.lineTo(line, 256);
      context.moveTo(0, line);
      context.lineTo(256, line);
      context.stroke();
    }
    context.strokeStyle = "rgba(255, 209, 102, 0.2)";
    context.strokeRect(3, 3, 250, 250);
    return new THREE.CanvasTexture(gridCanvas);
  }

  function makeGun() {
    const group = new THREE.Group();
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.48, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x121a22, roughness: 0.46, metalness: 0.45 })
    );
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.28, 0.78),
      new THREE.MeshStandardMaterial({ color: 0x2a3948, roughness: 0.34, metalness: 0.6 })
    );
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.07, 0.74, 16),
      new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: 0.24, metalness: 0.85 })
    );
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.07, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x7a4f00, emissiveIntensity: 0.3 })
    );

    body.position.set(0.34, -0.28, -0.76);
    grip.position.set(0.28, -0.56, -0.48);
    grip.rotation.x = -0.28;
    barrel.position.set(0.34, -0.25, -1.2);
    barrel.rotation.x = Math.PI / 2;
    sight.position.set(0.34, -0.1, -0.82);
    group.add(grip, body, barrel, sight);
    group.userData = { body, barrel, sight };
    group.position.set(0, 0, 0);
    return group;
  }

  function makeTarget() {
    const group = new THREE.Group();
    const botNumber = state.botCounter + 1;
    state.botCounter += 1;
    const teamKey = botNumber % 4 === 0 || botNumber % 5 === 0 ? "red" : "blue";
    const team = teams[teamKey];
    const botClass = botClasses[(botNumber - 1) % botClasses.length];
    const robotBodyMaterial = new THREE.MeshStandardMaterial({ color: team.color, roughness: 0.42, metalness: 0.55 });
    const robotArmorMaterial = new THREE.MeshStandardMaterial({ color: team.dark, roughness: 0.5, metalness: 0.3 });
    const robotJointMaterial = new THREE.MeshStandardMaterial({ color: team.color, emissive: team.glow, emissiveIntensity: 0.35 });
    const robotCoreMaterial = new THREE.MeshStandardMaterial({ color: team.color, emissive: team.glow, emissiveIntensity: 0.85 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.55, 0.55), robotBodyMaterial);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.12), robotCoreMaterial);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 0.62), robotArmorMaterial);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.04), robotCoreMaterial.clone());
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.25, 0.3), robotBodyMaterial.clone());
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.25, 0.3), robotBodyMaterial.clone());
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.22, 0.34), robotArmorMaterial.clone());
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.22, 0.34), robotArmorMaterial.clone());
    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), robotJointMaterial.clone());
    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), robotJointMaterial.clone());
    const enemyGun = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.88), enemyGunMaterial.clone());
    const avatar = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), robotCoreMaterial.clone());
    const healthBack = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0x050910 }));
    const healthFill = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.08, 0.09), new THREE.MeshBasicMaterial({ color: team.color }));
    const armed = targets.length % 3 === 0 || Math.random() < 0.24;

    body.position.y = 2.22;
    chest.position.set(0, 2.38, 0.31);
    head.position.y = 3.32;
    eye.position.set(0, 3.38, 0.33);
    leftArm.position.set(-0.82, 2.12, 0);
    rightArm.position.set(0.82, 2.12, 0);
    leftLeg.position.set(-0.28, 0.74, 0);
    rightLeg.position.set(0.28, 0.74, 0);
    leftShoulder.position.set(-0.72, 2.8, 0);
    rightShoulder.position.set(0.72, 2.8, 0);
    enemyGun.position.set(0.92, 2.1, 0.42);
    avatar.position.set(0, 4.1, 0);
    healthBack.position.set(0, 4.44, 0);
    healthFill.position.set(0, 4.45, 0.02);

    [body, chest, head, eye, leftArm, rightArm, leftLeg, rightLeg, leftShoulder, rightShoulder, enemyGun, avatar].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      part.userData.targetRoot = group;
    });
    [body, chest, head, eye, leftArm, rightArm, leftLeg, rightLeg, leftShoulder, rightShoulder, avatar, healthBack, healthFill].forEach((part) => group.add(part));
    if (armed) group.add(enemyGun);
    const maxHealth = Math.round(botClass.health * (teamKey === "blue" ? 1.04 : 1));
    group.userData = {
      name: `Bot ${botNumber}`,
      team: teamKey,
      className: botClass.name,
      body,
      chest,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      enemyGun,
      avatar,
      healthFill,
      armed,
      core: chest,
      health: maxHealth,
      maxHealth,
      alive: true,
      respawnAt: 0,
      value: 150,
      age: 0,
      shotCooldown: (1200 + Math.random() * 1600) / botClass.shot,
      nextShotAt: performance.now() + 350 + Math.random() * 900,
      updatedAt: performance.now(),
      destination: new THREE.Vector3(),
      turnSpeed: 4 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      speed: (3.4 + Math.random() * 1.8) * botClass.speed,
      lane: Math.random() > 0.5 ? 1 : -1,
      radius: 12 + Math.random() * 22,
      baseY: 0
    };
    scene.add(group);
    targets.push(group);
    placeTarget(group, true);
    syncTeamHud();
    return group;
  }

  function placeTarget(target, fresh = false) {
    target.position.set(
      THREE.MathUtils.randFloat(-48, 48),
      0,
      THREE.MathUtils.randFloat(-42, 30)
    );
    setWalkDestination(target);
    if (!fresh) {
      target.userData.phase = Math.random() * Math.PI * 2;
      target.userData.speed = Math.min(target.userData.speed + 0.12, 7.2);
    }
  }

  function resetTargets() {
    while (targets.length) {
      const target = targets.pop();
      scene.remove(target);
    }
    clearBullets();
    clearEnemyBullets();
    state.botCounter = 0;
    const total = state.botCount + Math.min(state.wave - 1, 6);
    for (let index = 0; index < total; index += 1) {
      makeTarget();
    }
    window.targetRangeFpsStatus.targets = targets.length;
    syncTeamHud();
  }

  function startGame(options = {}) {
    if (net.online && !net.isHost && !options.fromNetwork) {
      updateOnlineStatus("Connected. Waiting for host to start.");
      return;
    }
    if (!options.fromNetwork) applySettings();
    state.running = true;
    state.score = 0;
    state.streak = 0;
    state.wave = 1;
    state.timeLeft = state.mode === "control" ? 120 : 90;
    state.spawnTimer = 0;
    state.recoilTimer = 0;
    state.nextFireAt = 0;
    state.hitCount = 0;
    state.botHits = 0;
    state.lastEnemyShotAt = 0;
    state.redScore = 0;
    state.blueScore = 0;
    state.controlOwner = null;
    state.controlTickAt = performance.now() + 2500;
    state.reloadUntil = 0;
    weaponAmmo.forEach((_, index) => {
      weaponAmmo[index] = weapons[index].mag;
    });
    weaponPickups.forEach((pickup) => {
      pickup.visible = true;
      pickup.userData.respawnAt = 0;
    });
    killFeed.replaceChildren();
    setScoped(false);
    player.position.set(0, 2.1, 22);
    player.velocity.set(0, 0, 0);
    player.verticalVelocity = 0;
    player.grounded = true;
    player.yaw = 0;
    player.pitch = 0;
    player.health = player.maxHealth;
    startPanel.hidden = true;
    endPanel.hidden = true;
    hitPanel.hidden = true;
    resetTargets();
    syncHud();
    if (net.online && net.isHost && !options.fromNetwork) {
      broadcast({ type: "start", settings: getSettingsPayload() });
      updateOnlineStatus(`Hosting ${net.roomCode} | Players ${net.connections.size + 1}`);
    }
    requestCanvasLock();
  }

  function applySettings() {
    state.mode = modeSelect.value;
    state.botCount = Number(botCountSelect.value);
    state.difficulty = difficultySelect.value;
    state.matchTarget = Number(matchLengthSelect.value);
  }

  function endGame(reason = "") {
    state.running = false;
    setScoped(false);
    document.exitPointerLock?.();
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    bestValue.textContent = state.best;
    const winner = state.redScore === state.blueScore ? "Draw" : `${state.redScore > state.blueScore ? "Red" : "Blue"} wins`;
    endTitle.textContent = reason || winner;
    endStats.textContent = `Score ${state.score} | Red ${state.redScore} | Blue ${state.blueScore} | Wave ${state.wave}`;
    endPanel.hidden = false;
  }

  function showHitScreen(source = "A robot tagged you.") {
    if (!state.running) return;
    state.running = false;
    state.hitCount += 1;
    setScoped(false);
    document.exitPointerLock?.();
    hitStats.textContent = `${source} Red ${state.redScore} | Blue ${state.blueScore} | Score ${state.score}`;
    hitPanel.hidden = false;
  }

  function showMenu() {
    state.running = false;
    setScoped(false);
    clearBullets();
    clearEnemyBullets();
    document.exitPointerLock?.();
    hitPanel.hidden = true;
    endPanel.hidden = true;
    startPanel.hidden = false;
  }

  function requestCanvasLock() {
    if (!canvas.requestPointerLock || !matchMedia("(hover: hover)").matches) return;
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest?.catch) lockRequest.catch(() => {});
    } catch (error) {
      // Some embedded browsers reject pointer lock even after a user gesture.
    }
  }

  function syncHud() {
    scoreValue.textContent = state.score;
    streakValue.textContent = state.streak;
    timeValue.textContent = Math.max(0, Math.ceil(state.timeLeft));
    waveValue.textContent = state.wave;
    healthValue.textContent = Math.max(0, Math.ceil(player.health));
    redScoreValue.textContent = state.redScore;
    blueScoreValue.textContent = state.blueScore;
    roundValue.textContent = `Round ${state.round} | First to ${state.matchTarget}`;
    objectiveValue.textContent = state.mode === "control"
      ? `Control Point: ${state.controlOwner ? teams[state.controlOwner].name : "Neutral"}`
      : "Team Deathmatch";
    syncWeaponHud();
    window.targetRangeFpsStatus.targets = targets.length;
    window.targetRangeFpsStatus.aliveTargets = targets.filter((target) => target.userData.alive).length;
    window.targetRangeFpsStatus.armedTargets = targets.filter((target) => target.userData.armed && target.userData.alive).length;
    window.targetRangeFpsStatus.bullets = bullets.length;
    window.targetRangeFpsStatus.enemyBullets = enemyBullets.length;
    window.targetRangeFpsStatus.hitCount = state.hitCount;
    window.targetRangeFpsStatus.enemyShots = state.enemyShots;
    window.targetRangeFpsStatus.botHits = state.botHits;
    window.targetRangeFpsStatus.teams = getTeamRosters();
    window.targetRangeFpsStatus.scoped = state.scoped;
    window.targetRangeFpsStatus.weapon = weapons[state.weaponIndex].name;
    window.targetRangeFpsStatus.weaponSlot = weapons[state.weaponIndex].slot;
    window.targetRangeFpsStatus.running = state.running;
    window.targetRangeFpsStatus.online = net.online ? (net.isHost ? "host" : "guest") : "offline";
    window.targetRangeFpsStatus.onlinePeers = remotePlayers.size;
    window.targetRangeFpsStatus.obstacleColliders = obstacleColliders.length;
    window.targetRangeFpsStatus.player = {
      x: Number(player.position.x.toFixed(2)),
      y: Number(player.position.y.toFixed(2)),
      z: Number(player.position.z.toFixed(2)),
      yaw: Number(player.yaw.toFixed(3)),
      health: Math.max(0, Math.ceil(player.health)),
      grounded: player.grounded
    };
    document.body.dataset.fpsTargets = String(targets.length);
    document.body.dataset.fpsArmedTargets = String(targets.filter((target) => target.userData.armed).length);
    document.body.dataset.fpsBotPositions = JSON.stringify(targets.slice(0, 5).map((target) => ({
      name: target.userData.name,
      team: target.userData.team,
      alive: target.userData.alive,
      health: Math.ceil(target.userData.health),
      x: Number(target.position.x.toFixed(2)),
      z: Number(target.position.z.toFixed(2))
    })));
    document.body.dataset.fpsBullets = String(bullets.length);
    document.body.dataset.fpsEnemyBullets = String(enemyBullets.length);
    document.body.dataset.fpsHitCount = String(state.hitCount);
    document.body.dataset.fpsEnemyShots = String(state.enemyShots);
    document.body.dataset.fpsBotHits = String(state.botHits);
    document.body.dataset.fpsScoped = String(state.scoped);
    document.body.dataset.fpsWeapon = weapons[state.weaponIndex].name;
    document.body.dataset.fpsWeaponSlot = weapons[state.weaponIndex].slot;
    document.body.dataset.fpsRunning = String(state.running);
    document.body.dataset.fpsHealth = String(Math.max(0, Math.ceil(player.health)));
    document.body.dataset.fpsPlayerY = player.position.y.toFixed(2);
    document.body.dataset.fpsGrounded = String(player.grounded);
    document.body.dataset.fpsAmmo = ammoValue.textContent;
    document.body.dataset.fpsRedScore = String(state.redScore);
    document.body.dataset.fpsBlueScore = String(state.blueScore);
    document.body.dataset.fpsMode = state.mode;
    document.body.dataset.fpsObjective = state.controlOwner || "neutral";
    document.body.dataset.fpsOnlinePeers = String(remotePlayers.size);
    document.body.dataset.fpsObstacleColliders = String(obstacleColliders.length);
  }

  function resolveObstacleCollision(position, radius) {
    let blocked = false;
    obstacleColliders.forEach(({ box }) => {
      if (position.y < box.min.y - 0.35 || position.y > box.max.y + 2.5) return;
      const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
      const offsetX = position.x - closestX;
      const offsetZ = position.z - closestZ;
      const distanceSq = offsetX * offsetX + offsetZ * offsetZ;
      if (distanceSq >= radius * radius) return;
      blocked = true;
      if (distanceSq > 0.0001) {
        const distance = Math.sqrt(distanceSq);
        const pushDistance = radius - distance;
        position.x += (offsetX / distance) * pushDistance;
        position.z += (offsetZ / distance) * pushDistance;
        return;
      }
      const pushLeft = Math.abs(position.x - box.min.x);
      const pushRight = Math.abs(box.max.x - position.x);
      const pushBack = Math.abs(position.z - box.min.z);
      const pushFront = Math.abs(box.max.z - position.z);
      const nearestSide = Math.min(pushLeft, pushRight, pushBack, pushFront);
      if (nearestSide === pushLeft) position.x = box.min.x - radius;
      else if (nearestSide === pushRight) position.x = box.max.x + radius;
      else if (nearestSide === pushBack) position.z = box.min.z - radius;
      else position.z = box.max.z + radius;
    });
    return blocked;
  }

  function getObstacleHit(start, direction, maxDistance) {
    let closestHit = null;
    let closestDistance = Infinity;
    raycaster.set(start, direction);
    raycaster.far = maxDistance;
    obstacleColliders.forEach(({ box }) => {
      const hit = raycaster.ray.intersectBox(box, obstacleHitPoint);
      if (!hit) return;
      const distance = start.distanceTo(hit);
      if (distance <= maxDistance && distance < closestDistance) {
        closestDistance = distance;
        closestHit = hit.clone();
      }
    });
    return closestHit ? { point: closestHit, distance: closestDistance } : null;
  }

  function getTeamRosters() {
    const rosters = targets.reduce((currentRosters, target) => {
      currentRosters[target.userData.team].push(target.userData.name);
      return currentRosters;
    }, { blue: [], red: ["P1"] });
    remotePlayers.forEach((remote) => rosters.red.push(remote.name));
    return rosters;
  }

  function syncTeamHud() {
    const rosters = getTeamRosters();
    blueTeamValue.textContent = rosters.blue.length ? rosters.blue.join(", ") : "None";
    redTeamValue.textContent = rosters.red.join(", ");
    window.targetRangeFpsStatus.teams = rosters;
    document.body.dataset.fpsBlueTeam = rosters.blue.join(", ");
    document.body.dataset.fpsRedTeam = rosters.red.join(", ");
  }

  function syncWeaponHud() {
    const weapon = weapons[state.weaponIndex];
    weaponSlotValue.textContent = weapon.slot;
    weaponValue.textContent = weapon.name;
    if (state.reloadUntil > performance.now()) {
      ammoValue.textContent = "Reload";
    } else {
      ammoValue.textContent = `${weaponAmmo[state.weaponIndex]}/${weapon.mag}`;
    }
  }

  function equipWeapon(index) {
    if (index < 0 || index >= weapons.length) return;
    state.weaponIndex = index;
    state.reloadUntil = 0;
    const weapon = weapons[state.weaponIndex];
    syncWeaponHud();
    document.body.dataset.fpsWeapon = weapon.name;
    document.body.dataset.fpsWeaponSlot = weapon.slot;
    window.targetRangeFpsStatus.weapon = weapon.name;
    window.targetRangeFpsStatus.weaponSlot = weapon.slot;
    gun.userData.sight.material.color.setHex(weapon.color);
    gun.userData.sight.material.emissive.setHex(weapon.color);
  }

  function setScoped(scoped) {
    state.scoped = scoped && state.running;
    gameShell.classList.toggle("is-scoped", state.scoped);
    camera.fov = state.scoped ? 36 : 72;
    camera.updateProjectionMatrix();
    document.body.dataset.fpsScoped = String(state.scoped);
    window.targetRangeFpsStatus.scoped = state.scoped;
  }

  function toggleScopeFromInput(event) {
    if (!state.running || event.target.closest("button")) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastScopeToggleAt < 90) return;
    lastScopeToggleAt = now;
    setScoped(!state.scoped);
  }

  function updateCamera() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    camera.position.copy(player.position);
    if (state.recoilTimer > 0) {
      camera.rotation.x -= state.recoilTimer * (state.scoped ? 0.008 : 0.018);
    }
    gun.position.z = state.recoilTimer > 0 ? state.recoilTimer * (state.scoped ? 0.035 : 0.08) : 0;
    gun.position.x = state.scoped ? -0.08 : 0;
    gun.position.y = state.scoped ? 0.04 : 0;
  }

  function updateMovement(delta) {
    const movingForward = keys.has("KeyW") || keys.has("ArrowUp") || touchMoves.has("forward");
    const movingBack = keys.has("KeyS") || keys.has("ArrowDown") || touchMoves.has("backward");
    const movingLeft = keys.has("KeyA") || keys.has("ArrowLeft") || touchMoves.has("left");
    const movingRight = keys.has("KeyD") || keys.has("ArrowRight") || touchMoves.has("right");

    forward.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw)).normalize();
    tempDirection.set(0, 0, 0);
    if (movingForward) tempDirection.add(forward);
    if (movingBack) tempDirection.sub(forward);
    if (movingRight) tempDirection.add(right);
    if (movingLeft) tempDirection.sub(right);
    if (tempDirection.lengthSq() > 0) tempDirection.normalize();

    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 15 : 10.5;
    const finalSpeed = state.scoped ? speed * 0.62 : speed;
    player.velocity.lerp(tempDirection.multiplyScalar(finalSpeed), 1 - Math.pow(0.02, delta));
    player.position.addScaledVector(player.velocity, delta);
    player.verticalVelocity -= gravity * delta;
    player.position.y += player.verticalVelocity * delta;
    if (player.position.y <= groundY) {
      player.position.y = groundY;
      player.verticalVelocity = 0;
      player.grounded = true;
    }
    player.position.x = THREE.MathUtils.clamp(player.position.x, arenaBounds.playerMinX, arenaBounds.playerMaxX);
    player.position.z = THREE.MathUtils.clamp(player.position.z, arenaBounds.playerMinZ, arenaBounds.playerMaxZ);
    if (resolveObstacleCollision(player.position, 0.9)) {
      player.velocity.multiplyScalar(0.35);
      player.position.x = THREE.MathUtils.clamp(player.position.x, arenaBounds.playerMinX, arenaBounds.playerMaxX);
      player.position.z = THREE.MathUtils.clamp(player.position.z, arenaBounds.playerMinZ, arenaBounds.playerMaxZ);
    }
  }

  function jump() {
    if (!state.running || !player.grounded) return;
    player.verticalVelocity = jumpVelocity;
    player.grounded = false;
    playTone(360, 0.045, "triangle");
  }

  function updateTargets(delta) {
    const now = performance.now();
    let nextEnemyShotIn = Infinity;
    targets.forEach((target) => {
      const data = target.userData;
      if (!data.alive) {
        if (data.respawnAt && now >= data.respawnAt) respawnBot(target);
        return;
      }
      const botDelta = Math.min((now - data.updatedAt) / 1000, 0.5) || delta;
      data.updatedAt = now;
      data.age += botDelta;
      walkTarget.copy(data.destination);
      walkDirection.copy(walkTarget).sub(target.position);
      walkDirection.y = 0;
      const distanceToGoal = walkDirection.length();
      if (distanceToGoal < 1.6) {
        setWalkDestination(target);
        walkDirection.copy(data.destination).sub(target.position);
        walkDirection.y = 0;
      }
      if (walkDirection.lengthSq() > 0.001) {
        const previousX = target.position.x;
        const previousZ = target.position.z;
        walkDirection.normalize();
        target.position.addScaledVector(walkDirection, data.speed * botDelta);
        target.position.x = THREE.MathUtils.clamp(target.position.x, arenaBounds.botMinX, arenaBounds.botMaxX);
        target.position.z = THREE.MathUtils.clamp(target.position.z, arenaBounds.botMinZ, arenaBounds.botMaxZ);
        const blocked = resolveObstacleCollision(target.position, 1.05);
        target.position.x = THREE.MathUtils.clamp(target.position.x, arenaBounds.botMinX, arenaBounds.botMaxX);
        target.position.z = THREE.MathUtils.clamp(target.position.z, arenaBounds.botMinZ, arenaBounds.botMaxZ);
        if (blocked || Math.hypot(target.position.x - previousX, target.position.z - previousZ) < 0.08) {
          setWalkDestination(target);
        }
        const walkYaw = Math.atan2(walkDirection.x, walkDirection.z);
        let yawDelta = walkYaw - target.rotation.y;
        yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
        target.rotation.y += THREE.MathUtils.clamp(yawDelta, -data.turnSpeed * botDelta, data.turnSpeed * botDelta);
      }
      target.position.y = 0;
      target.rotation.z = Math.sin(data.age * 5 + data.phase) * 0.025;
      data.core.scale.setScalar(1 + Math.sin(data.age * 8) * 0.12);
      data.avatar.position.y = 4.1 + Math.sin(data.age * 4 + data.phase) * 0.08;
      const stride = data.age * data.speed * 2.4 + data.phase;
      data.leftArm.rotation.x = Math.sin(stride + Math.PI) * 0.42;
      data.rightArm.rotation.x = Math.sin(stride) * 0.42;
      data.leftLeg.rotation.x = Math.sin(stride) * 0.34;
      data.rightLeg.rotation.x = Math.sin(stride + Math.PI) * 0.34;
      if (data.armed) {
        data.enemyGun.rotation.x = -0.08 + Math.sin(data.age * 3 + data.phase) * 0.04;
        nextEnemyShotIn = Math.min(nextEnemyShotIn, (data.nextShotAt - now) / 1000);
        if (state.running && now >= data.nextShotAt && camera.position.distanceTo(target.position) < 86) {
          shootEnemyBullet(target);
          const setting = difficultySettings[state.difficulty] || difficultySettings.normal;
          data.nextShotAt = now + data.shotCooldown * setting.fireRate + Math.random() * 1100;
          nextEnemyShotIn = Math.min(nextEnemyShotIn, (data.nextShotAt - now) / 1000);
        }
      }

      if (target.position.x < arenaBounds.botMinX || target.position.x > arenaBounds.botMaxX || target.position.z > arenaBounds.botMaxZ || target.position.z < arenaBounds.botMinZ) {
        placeTarget(target);
      }
    });
    if (Number.isFinite(nextEnemyShotIn)) {
      document.body.dataset.fpsNextEnemyShot = Math.max(0, nextEnemyShotIn).toFixed(2);
      window.targetRangeFpsStatus.nextEnemyShot = Number(document.body.dataset.fpsNextEnemyShot);
    }
  }

  function setWalkDestination(target) {
    if (coverObjects.length && Math.random() < 0.4) {
      const cover = coverObjects[Math.floor(Math.random() * coverObjects.length)];
      target.userData.destination.set(
        cover.position.x + THREE.MathUtils.randFloatSpread(5.5),
        0,
        cover.position.z + THREE.MathUtils.randFloatSpread(5.5)
      );
      target.userData.destination.x = THREE.MathUtils.clamp(target.userData.destination.x, arenaBounds.botMinX, arenaBounds.botMaxX);
      target.userData.destination.z = THREE.MathUtils.clamp(target.userData.destination.z, arenaBounds.botMinZ, arenaBounds.botMaxZ);
      return;
    }
    target.userData.destination.set(
      THREE.MathUtils.randFloat(arenaBounds.botMinX, arenaBounds.botMaxX),
      0,
      THREE.MathUtils.randFloat(arenaBounds.botMinZ, arenaBounds.botMaxZ)
    );
  }

  function spawnParticles(position, color) {
    for (let index = 0; index < 10; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.16),
        new THREE.MeshBasicMaterial({ color })
      );
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        Math.random() * 7,
        (Math.random() - 0.5) * 9
      );
      particle.userData.life = 0.48 + Math.random() * 0.28;
      scene.add(particle);
      particles.push(particle);
    }
  }

  function addFeed(message) {
    const item = document.createElement("p");
    item.textContent = message;
    killFeed.prepend(item);
    while (killFeed.children.length > 5) {
      killFeed.lastElementChild.remove();
    }
  }

  function showHitMarker() {
    hitMarker.classList.add("is-active");
    clearTimeout(hitMarkerTimeout);
    hitMarkerTimeout = setTimeout(() => hitMarker.classList.remove("is-active"), 130);
  }

  function playTone(frequency, duration = 0.05, type = "square") {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      audioContext = null;
    }
  }

  function updateHealthBar(target) {
    const ratio = THREE.MathUtils.clamp(target.userData.health / target.userData.maxHealth, 0, 1);
    target.userData.healthFill.scale.x = ratio;
    target.userData.healthFill.position.x = -0.63 * (1 - ratio);
  }

  function damageBot(target, amount, attackerTeam, attackerName, hitPoint = null) {
    const data = target.userData;
    if (!data.alive || data.team === attackerTeam) return false;
    data.health -= amount;
    updateHealthBar(target);
    spawnParticles(hitPoint || target.position.clone().add(new THREE.Vector3(0, 2.2, 0)), data.core.material.color);
    if (attackerName === "P1") showHitMarker();
    playTone(attackerName === "P1" ? 520 : 280, 0.045, "triangle");
    if (data.health > 0) return false;

    data.alive = false;
    data.respawnAt = performance.now() + 2600;
    target.visible = false;
    state.botHits += 1;
    if (attackerTeam === "red") state.redScore += 1;
    if (attackerTeam === "blue") state.blueScore += 1;
    if (attackerName === "P1") {
      const closeBonus = Math.max(0, Math.floor((32 - camera.position.distanceTo(target.position)) * 2));
      const streakBonus = Math.min(400, state.streak * 20);
      state.score += data.value + closeBonus + streakBonus;
      state.streak += 1;
      if (state.streak % 8 === 0) {
        state.wave += 1;
        makeTarget();
      }
    }
    addFeed(`${attackerName} dropped ${data.name} (${data.className})`);
    checkRoundEnd();
    return true;
  }

  function respawnBot(target) {
    const data = target.userData;
    data.health = data.maxHealth;
    data.alive = true;
    data.respawnAt = 0;
    target.visible = true;
    updateHealthBar(target);
    placeTarget(target);
    addFeed(`${data.name} respawned`);
  }

  function damagePlayer(amount, source) {
    if (!state.running || player.health <= 0) return;
    const setting = difficultySettings[state.difficulty] || difficultySettings.normal;
    player.health -= amount * setting.playerDamage;
    spawnParticles(camera.position, teams.blue.color);
    playTone(130, 0.08, "sawtooth");
    if (player.health > 0) {
      addFeed(`${source} hit P1`);
      syncHud();
      return;
    }
    player.health = 0;
    state.blueScore += 1;
    addFeed(`${source} eliminated P1`);
    checkRoundEnd();
    if (state.running) showHitScreen(`${source} shot you.`);
  }

  function shootEnemyBullet(target) {
    const start = target.localToWorld(new THREE.Vector3(0.92, 2.12, 0.96));
    const aimPoint = getAimPointForTeam(target.userData.team);
    if (!aimPoint) return;
    const direction = aimPoint.sub(start).normalize();
    direction.x += (Math.random() - 0.5) * 0.035;
    direction.y += (Math.random() - 0.5) * 0.018;
    direction.z += (Math.random() - 0.5) * 0.035;
    direction.normalize();

    const shot = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      new THREE.MeshBasicMaterial({ color: teams[target.userData.team].color })
    );
    shot.position.copy(start);
    shot.userData.velocity = direction.multiplyScalar(45);
    shot.userData.life = 1.35;
    shot.userData.previous = start.clone();
    shot.userData.updatedAt = performance.now();
    shot.userData.team = target.userData.team;
    shot.userData.damage = 22 * ((difficultySettings[state.difficulty] || difficultySettings.normal).botDamage || 1);
    shot.userData.source = target.userData.name;
    shot.add(new THREE.PointLight(teams[target.userData.team].color, 1.5, 6, 2));
    scene.add(shot);
    enemyBullets.push(shot);
    state.enemyShots += 1;
    state.lastEnemyShotAt = performance.now();
    document.body.dataset.fpsEnemyBullets = String(enemyBullets.length);
    document.body.dataset.fpsEnemyShots = String(state.enemyShots);
  }

  function getAimPointForTeam(teamKey) {
    if (teamKey === "blue") {
      const redBots = targets.filter((target) => target.userData.team === "red" && target.userData.alive);
      const redPlayers = [...remotePlayers.values()].map((remote) => remote.group);
      const options = [...redBots, ...redPlayers];
      if (options.length && Math.random() < 0.78) {
        const target = options[Math.floor(Math.random() * options.length)];
        return target.position.clone().add(new THREE.Vector3(0, target.userData?.health ? 1.8 : 2.2, 0));
      }
      return camera.position.clone().add(new THREE.Vector3(0, -0.18, 0));
    }
    const blueBots = targets.filter((target) => target.userData.team === "blue" && target.userData.alive);
    if (!blueBots.length) return null;
    return blueBots[Math.floor(Math.random() * blueBots.length)].position.clone().add(new THREE.Vector3(0, 2.2, 0));
  }

  function updateParticles(delta) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.userData.life -= delta;
      particle.userData.velocity.y -= delta * 12;
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.rotation.x += delta * 10;
      particle.rotation.y += delta * 8;
      particle.material.opacity = Math.max(0, particle.userData.life);
      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(index, 1);
      }
    }
  }

  function makeBullet(weapon, direction) {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(weapon.radius, 12, 8),
      new THREE.MeshBasicMaterial({ color: weapon.color })
    );
    const glow = new THREE.PointLight(weapon.color, weapon.name === "Nova" ? 2.2 : 1.4, 5 + weapon.radius * 18, 2);
    camera.updateMatrixWorld();
    muzzlePosition.set(0.34, -0.25, -1.32);
    camera.localToWorld(muzzlePosition);
    bullet.position.copy(muzzlePosition);
    bullet.userData.previous = muzzlePosition.clone();
    bullet.userData.velocity = direction.clone().multiplyScalar(weapon.speed);
    bullet.userData.life = weapon.life;
    bullet.userData.distance = 0;
    bullet.userData.weapon = weapon;
    bullet.add(glow);
    if (weapon.name === "Rail") {
      bullet.scale.set(0.72, 0.72, 4.5);
    }
    scene.add(bullet);
    bullets.push(bullet);
    document.body.dataset.fpsBullets = String(bullets.length);
  }

  function spawnRemoteShot(message) {
    if (!message.position || !message.direction) return;
    const weapon = weapons[message.weaponIndex] || weapons[0];
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(weapon.radius * 0.8, 0.04), 10, 8),
      new THREE.MeshBasicMaterial({ color: weapon.color })
    );
    bullet.position.set(message.position.x, message.position.y || 1.8, message.position.z);
    bullet.userData.velocity = new THREE.Vector3(message.direction.x, message.direction.y, message.direction.z).normalize().multiplyScalar(weapon.speed);
    bullet.userData.life = 0.5;
    bullet.add(new THREE.PointLight(weapon.color, 1.1, 4, 2));
    scene.add(bullet);
    particles.push(bullet);
  }

  function handleRemoteShot(peerId, message) {
    if (!message.position || !message.direction) return;
    const weapon = weapons[message.weaponIndex] || weapons[0];
    const start = new THREE.Vector3(message.position.x, message.position.y || 1.8, message.position.z);
    const direction = new THREE.Vector3(message.direction.x, message.direction.y, message.direction.z).normalize();
    raycaster.set(start, direction);
    raycaster.far = 90;
    const obstacleHit = getObstacleHit(start, direction, 90);
    raycaster.set(start, direction);
    raycaster.far = 90;
    const hits = raycaster.intersectObjects(targets, true);
    const hitGroup = hits.map((hit) => getTargetGroup(hit.object)).find((target) => target?.userData.team !== "red" && target.userData.alive);
    if (!hitGroup) return;
    const hit = hits.find((candidate) => getTargetGroup(candidate.object) === hitGroup);
    if (obstacleHit && hit && obstacleHit.distance < start.distanceTo(hit.point)) return;
    const remote = remotePlayers.get(peerId);
    const attackerName = remote?.name || "Online player";
    damageBot(hitGroup, weapon.damage, "red", attackerName, hit?.point);
    broadcast({ type: "feed", text: `${attackerName} hit ${hitGroup.userData.name}` });
  }

  function clearBullets() {
    while (bullets.length) {
      const bullet = bullets.pop();
      scene.remove(bullet);
    }
    document.body.dataset.fpsBullets = "0";
  }

  function clearEnemyBullets() {
    while (enemyBullets.length) {
      const bullet = enemyBullets.pop();
      scene.remove(bullet);
    }
    document.body.dataset.fpsEnemyBullets = "0";
  }

  function updateBullets(delta) {
    for (let index = bullets.length - 1; index >= 0; index -= 1) {
      const bullet = bullets[index];
      bulletStart.copy(bullet.position);
      bullet.userData.previous.copy(bulletStart);
      bullet.position.addScaledVector(bullet.userData.velocity, delta);
      bulletEnd.copy(bullet.position);
      const travel = bulletStart.distanceTo(bulletEnd);
      bulletDirection.copy(bulletEnd).sub(bulletStart).normalize();
      raycaster.set(bulletStart, bulletDirection);
      raycaster.far = travel + 0.24;
      const obstacleHit = getObstacleHit(bulletStart, bulletDirection, travel + 0.24);
      raycaster.set(bulletStart, bulletDirection);
      raycaster.far = travel + 0.24;
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        const hitGroup = hits.map((hit) => getTargetGroup(hit.object)).find((target) => target?.userData.team !== "red" && target.userData.alive);
        if (hitGroup) {
          const hit = hits.find((candidate) => getTargetGroup(candidate.object) === hitGroup);
          if (obstacleHit && obstacleHit.distance < bulletStart.distanceTo(hit.point)) {
            bullet.position.copy(obstacleHit.point);
            spawnParticles(obstacleHit.point, bullet.material.color);
            scene.remove(bullet);
            bullets.splice(index, 1);
            state.streak = 0;
            continue;
          }
          bullet.position.copy(hit.point);
          if (!net.online || net.isHost) handleTargetHit(hitGroup, hit.point, bullet.userData.weapon);
          if (net.online && !net.isHost) showHitMarker();
          scene.remove(bullet);
          bullets.splice(index, 1);
          continue;
        }
      }
      if (obstacleHit) {
        bullet.position.copy(obstacleHit.point);
        spawnParticles(obstacleHit.point, bullet.material.color);
        scene.remove(bullet);
        bullets.splice(index, 1);
        state.streak = 0;
        continue;
      }

      bullet.userData.life -= delta;
      bullet.userData.distance += travel;
      if (bullet.userData.life <= 0 || bullet.userData.distance > 95) {
        scene.remove(bullet);
        bullets.splice(index, 1);
        state.streak = 0;
      }
    }
    document.body.dataset.fpsBullets = String(bullets.length);
  }

  function updateEnemyBullets(delta) {
    const now = performance.now();
    const playerHitRadius = state.scoped ? 0.92 : 1.18;
    for (let index = enemyBullets.length - 1; index >= 0; index -= 1) {
      const bullet = enemyBullets[index];
      const step = Math.min((now - bullet.userData.updatedAt) / 1000, 0.25);
      bullet.userData.updatedAt = now;
      bullet.userData.previous.copy(bullet.position);
      bullet.position.addScaledVector(bullet.userData.velocity, step || delta);
      bullet.userData.life -= step || delta;
      bulletDirection.copy(bullet.position).sub(bullet.userData.previous);
      const travel = bulletDirection.length();
      if (travel > 0.001) {
        bulletDirection.normalize();
        const obstacleHit = getObstacleHit(bullet.userData.previous, bulletDirection, travel + 0.24);
        if (obstacleHit) {
          bullet.position.copy(obstacleHit.point);
          spawnParticles(obstacleHit.point, bullet.material.color);
          scene.remove(bullet);
          enemyBullets.splice(index, 1);
          continue;
        }
      }
      if (state.running && bullet.userData.team === "blue" && distanceToSegment(camera.position, bullet.userData.previous, bullet.position) < playerHitRadius) {
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
        damagePlayer(bullet.userData.damage, bullet.userData.source || "A robot");
        break;
      }
      const remoteHit = net.isHost && bullet.userData.team === "blue" ? getRemotePlayerBulletHit(bullet) : null;
      if (remoteHit) {
        damageRemotePlayer(remoteHit.peerId, bullet.userData.damage, bullet.userData.source || "A robot");
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
        continue;
      }
      const botHit = getEnemyBulletHit(bullet);
      if (botHit) {
        damageBot(botHit, bullet.userData.damage, bullet.userData.team, bullet.userData.source || "Bot", botHit.position.clone().add(new THREE.Vector3(0, 2.2, 0)));
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
        document.body.dataset.fpsBotHits = String(state.botHits);
        syncTeamHud();
        continue;
      }
      if (bullet.userData.life <= 0 || bullet.position.length() > 120) {
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
      }
    }
    document.body.dataset.fpsEnemyBullets = String(enemyBullets.length);
  }

  function getEnemyBulletHit(bullet) {
    return targets.find((target) => (
      target.userData.team !== bullet.userData.team &&
      target.userData.alive &&
      (
        distanceToSegment(target.position.clone().add(new THREE.Vector3(0, 2.2, 0)), bullet.userData.previous, bullet.position) < 1.35 ||
        distanceToSegment(target.position.clone().add(new THREE.Vector3(0, 1.1, 0)), bullet.userData.previous, bullet.position) < 0.95
      )
    ));
  }

  function getRemotePlayerBulletHit(bullet) {
    for (const [peerId, remote] of remotePlayers.entries()) {
      if (distanceToSegment(remote.group.position.clone().add(new THREE.Vector3(0, 1.35, 0)), bullet.userData.previous, bullet.position) < 1.18) {
        return { peerId, remote };
      }
    }
    return null;
  }

  function damageRemotePlayer(peerId, amount, source) {
    const remote = remotePlayers.get(peerId);
    const connection = net.connections.get(peerId);
    if (!remote || !connection?.open) return;
    remote.group.userData.health = Math.max(0, (remote.group.userData.health || 100) - amount);
    connection.send({ type: "damage", amount, source });
    if (remote.group.userData.health <= 0) {
      state.blueScore += 1;
      remote.group.userData.health = 100;
      addFeed(`${source} eliminated ${remote.name}`);
      broadcast({ type: "feed", text: `${source} eliminated ${remote.name}` });
      checkRoundEnd();
    }
  }

  function distanceToSegment(point, start, end) {
    bulletDirection.copy(end).sub(start);
    const lengthSquared = bulletDirection.lengthSq();
    if (lengthSquared === 0) return point.distanceTo(start);
    const t = THREE.MathUtils.clamp(closestPoint.copy(point).sub(start).dot(bulletDirection) / lengthSquared, 0, 1);
    closestPoint.copy(start).addScaledVector(bulletDirection, t);
    return point.distanceTo(closestPoint);
  }

  function shoot() {
    if (!state.running) return;
    const weapon = weapons[state.weaponIndex];
    const now = performance.now();
    if (now < state.nextFireAt) return;
    if (now < state.reloadUntil) return;
    if (weaponAmmo[state.weaponIndex] <= 0) {
      state.reloadUntil = now + weapon.reload;
      addFeed(`Reloading ${weapon.name}`);
      syncWeaponHud();
      return;
    }
    weaponAmmo[state.weaponIndex] -= 1;
    state.nextFireAt = now + (state.scoped ? weapon.cooldown * 1.08 : weapon.cooldown);
    state.recoilTimer = weapon.recoil;
    state.flashTimer = 0.07;
    muzzleLight.intensity = 9;
    camera.updateMatrixWorld();
    camera.getWorldDirection(bulletDirection).normalize();
    for (let pellet = 0; pellet < weapon.pellets; pellet += 1) {
      const spread = state.scoped ? weapon.spread * 0.35 : weapon.spread;
      const direction = bulletDirection.clone();
      if (spread > 0) {
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread;
        direction.normalize();
      }
      makeBullet(weapon, direction);
      sendShotMessage(weapon, direction);
    }
    playTone(210 + state.weaponIndex * 32, 0.045, weapon.name === "Rail" ? "sine" : "square");
    if (weaponAmmo[state.weaponIndex] <= 0) {
      state.reloadUntil = now + weapon.reload;
      addFeed(`Reloading ${weapon.name}`);
    }
    syncWeaponHud();
  }

  function sendShotMessage(weapon, direction) {
    if (!net.online) return;
    const message = {
      type: "shot",
      name: net.playerName,
      weaponIndex: state.weaponIndex,
      position: {
        x: Number(muzzlePosition.x.toFixed(3)),
        y: Number(muzzlePosition.y.toFixed(3)),
        z: Number(muzzlePosition.z.toFixed(3))
      },
      direction: {
        x: Number(direction.x.toFixed(4)),
        y: Number(direction.y.toFixed(4)),
        z: Number(direction.z.toFixed(4))
      }
    };
    if (net.isHost) {
      broadcast(message);
    } else {
      const hostConnection = [...net.connections.values()][0];
      if (hostConnection?.open) hostConnection.send(message);
    }
  }

  function handleTargetHit(hitGroup, hitPoint, weapon) {
    damageBot(hitGroup, weapon.damage, "red", "P1", hitPoint);
    syncHud();
  }

  function getTargetGroup(object) {
    if (object.userData.targetRoot) return object.userData.targetRoot;
    let current = object;
    while (current && current.parent) {
      if (targets.includes(current)) return current;
      current = current.parent;
    }
    return null;
  }

  function updateReload(now) {
    if (state.reloadUntil && now >= state.reloadUntil) {
      weaponAmmo[state.weaponIndex] = weapons[state.weaponIndex].mag;
      state.reloadUntil = 0;
      addFeed(`${weapons[state.weaponIndex].name} ready`);
      playTone(680, 0.05, "triangle");
      syncWeaponHud();
    }
  }

  function updatePickups(delta) {
    const now = performance.now();
    weaponPickups.forEach((pickup) => {
      if (!pickup.visible) {
        if (now >= pickup.userData.respawnAt) {
          pickup.visible = true;
          pickup.position.x = THREE.MathUtils.randFloat(-50, 50);
          pickup.position.z = THREE.MathUtils.randFloat(-42, 34);
        }
        return;
      }
      pickup.rotation.y += delta * 1.8;
      pickup.position.y = pickup.userData.baseY + Math.sin(now * 0.004 + pickup.userData.weaponIndex) * 0.12;
      if (player.position.distanceTo(pickup.position) < 2.1) {
        const pickupWeapon = pickup.userData.weaponIndex;
        weaponAmmo[pickupWeapon] = weapons[pickupWeapon].mag;
        equipWeapon(pickupWeapon);
        pickup.visible = false;
        pickup.userData.respawnAt = now + 9000;
        state.reloadUntil = 0;
        addFeed(`Picked up ${weapons[pickupWeapon].name}`);
        playTone(820, 0.08, "triangle");
      }
    });
  }

  function updateObjective(now) {
    if (state.mode !== "control") return;
    let redPresence = player.position.distanceTo(controlPoint) < 7 ? 1 : 0;
    let bluePresence = 0;
    targets.forEach((target) => {
      if (!target.userData.alive || target.position.distanceTo(controlPoint) >= 7) return;
      if (target.userData.team === "red") redPresence += 1;
      if (target.userData.team === "blue") bluePresence += 1;
    });
    remotePlayers.forEach((remote) => {
      if (remote.group.position.distanceTo(controlPoint) < 7) redPresence += 1;
    });
    const owner = redPresence === bluePresence ? null : (redPresence > bluePresence ? "red" : "blue");
    if (owner !== state.controlOwner) {
      state.controlOwner = owner;
      addFeed(owner ? `${teams[owner].name} captured control` : "Control point neutral");
    }
    if (state.controlOwner && now >= state.controlTickAt) {
      if (state.controlOwner === "red") state.redScore += 1;
      if (state.controlOwner === "blue") state.blueScore += 1;
      state.controlTickAt = now + 2200;
      checkRoundEnd();
    }
  }

  function checkRoundEnd() {
    if (!state.running) return;
    if (state.redScore >= state.matchTarget || state.blueScore >= state.matchTarget) {
      const winner = state.redScore > state.blueScore ? "Red wins" : "Blue wins";
      endGame(winner);
    }
  }

  function drawMiniMap() {
    const size = miniMap.width;
    miniMapContext.clearRect(0, 0, size, size);
    miniMapContext.fillStyle = "rgba(5, 9, 16, 0.78)";
    miniMapContext.fillRect(0, 0, size, size);
    miniMapContext.strokeStyle = "rgba(255, 255, 255, 0.22)";
    miniMapContext.strokeRect(8, 8, size - 16, size - 16);
    const scale = (value, min, max) => 8 + ((value - min) / (max - min)) * (size - 16);
    const drawDot = (x, z, color, radius = 4) => {
      miniMapContext.fillStyle = color;
      miniMapContext.beginPath();
      miniMapContext.arc(scale(x, arenaBounds.mapMinX, arenaBounds.mapMaxX), scale(z, arenaBounds.mapMinZ, arenaBounds.mapMaxZ), radius, 0, Math.PI * 2);
      miniMapContext.fill();
    };
    drawDot(controlPoint.x, controlPoint.z, state.controlOwner === "blue" ? "#43d5ff" : state.controlOwner === "red" ? "#ff4c65" : "#ffd166", 6);
    coverObjects.forEach((cover) => drawDot(cover.position.x, cover.position.z, "rgba(158, 179, 201, 0.45)", 2.5));
    weaponPickups.filter((pickup) => pickup.visible).forEach((pickup) => drawDot(pickup.position.x, pickup.position.z, "#ffd166", 3));
    targets.filter((target) => target.userData.alive).forEach((target) => {
      drawDot(target.position.x, target.position.z, target.userData.team === "blue" ? "#43d5ff" : "#ff4c65", 3.5);
    });
    remotePlayers.forEach((remote) => drawDot(remote.group.position.x, remote.group.position.z, "#ff4c65", 4));
    drawDot(player.position.x, player.position.z, "#ffffff", 5);
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    window.targetRangeFpsStatus.frames += 1;
    document.body.dataset.fpsFrames = String(window.targetRangeFpsStatus.frames);

    if (state.running) {
      const now = performance.now();
      state.timeLeft -= delta;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        endGame("Time up");
      }
      state.spawnTimer += delta;
      if (state.spawnTimer > 12 && targets.length < 18) {
        state.spawnTimer = 0;
        state.wave += 1;
        makeTarget();
        syncTeamHud();
      }
      updateMovement(delta);
      updateReload(now);
      updatePickups(delta);
      if (!net.online || net.isHost) updateObjective(now);
      if (!net.online || net.isHost) updateTargets(delta);
      updateBullets(delta);
      if (!net.online || net.isHost) updateEnemyBullets(delta);
      sendNetworkUpdates(now);
      sendHostWorld(now);
      drawMiniMap();
      syncHud();
    } else {
      updateTargets(delta * 0.45);
      updateBullets(delta);
      updateEnemyBullets(delta);
      drawMiniMap();
    }

    state.recoilTimer = Math.max(0, state.recoilTimer - delta * 8);
    state.flashTimer = Math.max(0, state.flashTimer - delta);
    muzzleLight.intensity = state.flashTimer > 0 ? 9 : 0;
    updateParticles(delta);
    updateCamera();
    renderer.render(scene, camera);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("contextmenu", (event) => {
    if (state.running) event.preventDefault();
  });
  window.addEventListener("mousedown", (event) => {
    if (event.button === 2) toggleScopeFromInput(event);
  });
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (/^Digit[0-9]$/.test(event.code)) {
      event.preventDefault();
      equipWeapon(event.code === "Digit0" ? 9 : Number(event.code.slice(5)) - 1);
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      jump();
    }
    if (event.code === "Escape" && state.running) {
      endGame();
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("mousemove", (event) => {
    if (!state.running) return;
    if (document.pointerLockElement !== canvas && matchMedia("(hover: hover)").matches) return;
    player.yaw -= event.movementX * 0.0022;
    player.pitch -= event.movementY * 0.0022;
    player.pitch = THREE.MathUtils.clamp(player.pitch, -1.18, 1.1);
  });
  window.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (!state.running) return;
    if (document.pointerLockElement !== canvas) requestCanvasLock();
    if (event.button === 2) {
      toggleScopeFromInput(event);
      return;
    }
    shoot();
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    const move = button.dataset.move;
    const start = (event) => {
      event.preventDefault();
      touchMoves.add(move);
    };
    const stop = (event) => {
      event.preventDefault();
      touchMoves.delete(move);
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });

  let lastTouchX = null;
  let lastTouchY = null;
  canvas.addEventListener("touchstart", (event) => {
    if (!state.running || !event.touches.length) return;
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener("touchmove", (event) => {
    if (!state.running || !event.touches.length || lastTouchX === null) return;
    const touch = event.touches[0];
    player.yaw -= (touch.clientX - lastTouchX) * 0.006;
    player.pitch -= (touch.clientY - lastTouchY) * 0.006;
    player.pitch = THREE.MathUtils.clamp(player.pitch, -1.18, 1.1);
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }, { passive: true });

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  retryButton.addEventListener("click", startGame);
  menuButton.addEventListener("click", showMenu);
  touchFire.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    shoot();
  });
  touchJump.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    jump();
  });
  touchScope.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (state.running) setScoped(!state.scoped);
  });
  hostOnlineButton.addEventListener("click", hostOnline);
  joinOnlineButton.addEventListener("click", joinOnline);
  roomCodeInput.addEventListener("input", () => {
    roomCodeInput.value = roomCodeInput.value.toUpperCase();
  });
  resetButton.addEventListener("click", () => {
    state.best = 0;
    localStorage.removeItem(bestKey);
    bestValue.textContent = "0";
  });
})();
