(() => {
  const canvas = document.getElementById("gameCanvas");
  const scoreValue = document.getElementById("scoreValue");
  const streakValue = document.getElementById("streakValue");
  const timeValue = document.getElementById("timeValue");
  const waveValue = document.getElementById("waveValue");
  const weaponSlotValue = document.getElementById("weaponSlotValue");
  const weaponValue = document.getElementById("weaponValue");
  const blueTeamValue = document.getElementById("blueTeamValue");
  const redTeamValue = document.getElementById("redTeamValue");
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
    position: new THREE.Vector3(0, 2.1, 22)
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
    lastEnemyShotAt: 0,
    botCounter: 0,
    best: Number(localStorage.getItem(bestKey) || 0)
  };

  const teams = {
    blue: { name: "Blue", color: 0x43d5ff, dark: 0x18384c, glow: 0x0c6f8f },
    red: { name: "Red", color: 0xff4c65, dark: 0x4a1824, glow: 0x8f182b }
  };

  const weapons = [
    { slot: "1", name: "Pistol", cooldown: 260, pellets: 1, spread: 0.002, speed: 86, life: 1.15, radius: 0.075, color: 0xffd166, recoil: 1, points: 1 },
    { slot: "2", name: "Burst", cooldown: 170, pellets: 1, spread: 0.006, speed: 94, life: 1.08, radius: 0.055, color: 0x43d5ff, recoil: 0.72, points: 0.82 },
    { slot: "3", name: "Scatter", cooldown: 560, pellets: 7, spread: 0.052, speed: 76, life: 0.72, radius: 0.065, color: 0xff8a4c, recoil: 1.35, points: 0.46 },
    { slot: "4", name: "Rail", cooldown: 820, pellets: 1, spread: 0, speed: 150, life: 0.82, radius: 0.05, color: 0xf7fafc, recoil: 1.85, points: 2.25 },
    { slot: "5", name: "Plasma", cooldown: 440, pellets: 1, spread: 0.01, speed: 58, life: 1.6, radius: 0.16, color: 0x9b5cff, recoil: 0.95, points: 1.35 },
    { slot: "6", name: "Arc", cooldown: 380, pellets: 3, spread: 0.024, speed: 82, life: 1.05, radius: 0.08, color: 0x4ff0b1, recoil: 0.85, points: 0.74 },
    { slot: "7", name: "SMG", cooldown: 90, pellets: 1, spread: 0.018, speed: 98, life: 0.86, radius: 0.045, color: 0xff4c65, recoil: 0.44, points: 0.52 },
    { slot: "8", name: "Cannon", cooldown: 980, pellets: 1, spread: 0.004, speed: 66, life: 1.45, radius: 0.22, color: 0xffc857, recoil: 2.25, points: 2.8 },
    { slot: "9", name: "Needler", cooldown: 130, pellets: 2, spread: 0.015, speed: 112, life: 0.94, radius: 0.038, color: 0xc7ff4f, recoil: 0.36, points: 0.45 },
    { slot: "0", name: "Nova", cooldown: 1250, pellets: 10, spread: 0.06, speed: 72, life: 1.2, radius: 0.1, color: 0xff6bd6, recoil: 2.7, points: 0.72 }
  ];

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

  const keys = new Set();
  const touchMoves = new Set();
  const targets = [];
  const bullets = [];
  const enemyBullets = [];
  const particles = [];
  let lastScopeToggleAt = 0;
  const tempDirection = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const bulletDirection = new THREE.Vector3();
  const bulletStart = new THREE.Vector3();
  const bulletEnd = new THREE.Vector3();
  const muzzlePosition = new THREE.Vector3();
  const closestPoint = new THREE.Vector3();

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
  floorTexture.repeat.set(16, 16);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 96),
    new THREE.MeshStandardMaterial({ color: 0x15202b, roughness: 0.82, metalness: 0.08, map: floorTexture })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x18293a, roughness: 0.7, metalness: 0.12 });
  addWall(0, 4, -38, 84, 8, 2);
  addWall(-42, 4, 0, 2, 8, 76);
  addWall(42, 4, 0, 2, 8, 76);

  for (let index = 0; index < 18; index += 1) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5 + Math.random() * 4, 1.2),
      new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0x27455c : 0x203342, roughness: 0.62 })
    );
    pillar.position.set(-34 + index * 4, pillar.geometry.parameters.height / 2, -31 - Math.sin(index) * 2);
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

    [body, chest, head, eye, leftArm, rightArm, leftLeg, rightLeg, leftShoulder, rightShoulder, enemyGun, avatar].forEach((part) => {
      part.castShadow = true;
      part.receiveShadow = true;
      part.userData.targetRoot = group;
    });
    [body, chest, head, eye, leftArm, rightArm, leftLeg, rightLeg, leftShoulder, rightShoulder, avatar].forEach((part) => group.add(part));
    if (armed) group.add(enemyGun);
    group.userData = {
      name: `Bot ${botNumber}`,
      team: teamKey,
      body,
      chest,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      enemyGun,
      avatar,
      armed,
      core: chest,
      health: 1,
      value: 150,
      age: 0,
      shotCooldown: 1200 + Math.random() * 1600,
      nextShotAt: performance.now() + 350 + Math.random() * 900,
      phase: Math.random() * Math.PI * 2,
      speed: 0.95 + Math.random() * 0.85,
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
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
    const distance = target.userData.radius;
    target.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance - 10);
    if (!fresh) {
      target.userData.phase = Math.random() * Math.PI * 2;
      target.userData.speed += 0.04;
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
    const total = 7 + state.wave;
    for (let index = 0; index < total; index += 1) {
      makeTarget();
    }
    window.targetRangeFpsStatus.targets = targets.length;
    syncTeamHud();
  }

  function startGame() {
    state.running = true;
    state.score = 0;
    state.streak = 0;
    state.wave = 1;
    state.timeLeft = 90;
    state.spawnTimer = 0;
    state.recoilTimer = 0;
    state.nextFireAt = 0;
    state.hitCount = 0;
    state.lastEnemyShotAt = 0;
    setScoped(false);
    player.position.set(0, 2.1, 22);
    player.velocity.set(0, 0, 0);
    player.yaw = 0;
    player.pitch = 0;
    startPanel.hidden = true;
    endPanel.hidden = true;
    hitPanel.hidden = true;
    resetTargets();
    syncHud();
    requestCanvasLock();
  }

  function endGame() {
    state.running = false;
    setScoped(false);
    document.exitPointerLock?.();
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    bestValue.textContent = state.best;
    endTitle.textContent = state.score >= 5000 ? "Sharp shooting" : "Run complete";
    endStats.textContent = `Score ${state.score} | Streak ${state.streak} | Wave ${state.wave}`;
    endPanel.hidden = false;
  }

  function showHitScreen(source = "A robot tagged you.") {
    if (!state.running) return;
    state.running = false;
    state.hitCount += 1;
    setScoped(false);
    document.exitPointerLock?.();
    hitStats.textContent = `${source} Score ${state.score} | Wave ${state.wave}`;
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
    syncWeaponHud();
    window.targetRangeFpsStatus.targets = targets.length;
    window.targetRangeFpsStatus.armedTargets = targets.filter((target) => target.userData.armed).length;
    window.targetRangeFpsStatus.bullets = bullets.length;
    window.targetRangeFpsStatus.enemyBullets = enemyBullets.length;
    window.targetRangeFpsStatus.hitCount = state.hitCount;
    window.targetRangeFpsStatus.enemyShots = state.enemyShots;
    window.targetRangeFpsStatus.teams = getTeamRosters();
    window.targetRangeFpsStatus.scoped = state.scoped;
    window.targetRangeFpsStatus.weapon = weapons[state.weaponIndex].name;
    window.targetRangeFpsStatus.weaponSlot = weapons[state.weaponIndex].slot;
    window.targetRangeFpsStatus.running = state.running;
    window.targetRangeFpsStatus.player = {
      x: Number(player.position.x.toFixed(2)),
      z: Number(player.position.z.toFixed(2)),
      yaw: Number(player.yaw.toFixed(3))
    };
    document.body.dataset.fpsTargets = String(targets.length);
    document.body.dataset.fpsArmedTargets = String(targets.filter((target) => target.userData.armed).length);
    document.body.dataset.fpsBullets = String(bullets.length);
    document.body.dataset.fpsEnemyBullets = String(enemyBullets.length);
    document.body.dataset.fpsHitCount = String(state.hitCount);
    document.body.dataset.fpsEnemyShots = String(state.enemyShots);
    document.body.dataset.fpsScoped = String(state.scoped);
    document.body.dataset.fpsWeapon = weapons[state.weaponIndex].name;
    document.body.dataset.fpsWeaponSlot = weapons[state.weaponIndex].slot;
    document.body.dataset.fpsRunning = String(state.running);
  }

  function getTeamRosters() {
    return targets.reduce((rosters, target) => {
      rosters[target.userData.team].push(target.userData.name);
      return rosters;
    }, { blue: [], red: ["P1"] });
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
  }

  function equipWeapon(index) {
    if (index < 0 || index >= weapons.length) return;
    state.weaponIndex = index;
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
    player.position.x = THREE.MathUtils.clamp(player.position.x, -34, 34);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -31, 28);
  }

  function updateTargets(delta) {
    const now = performance.now();
    let nextEnemyShotIn = Infinity;
    targets.forEach((target, index) => {
      const data = target.userData;
      data.age += delta;
      target.position.x += Math.sin(data.age * data.speed + data.phase) * delta * 7.5 * data.lane;
      target.position.y = 0;
      target.position.z += Math.cos(data.age * data.speed * 0.8 + index) * delta * 2.4;
      const lookYaw = Math.atan2(camera.position.x - target.position.x, camera.position.z - target.position.z);
      target.rotation.y = lookYaw + Math.sin(data.age * 2 + data.phase) * 0.16;
      target.rotation.z = Math.sin(data.age * 2 + data.phase) * 0.22;
      data.core.scale.setScalar(1 + Math.sin(data.age * 8) * 0.12);
      data.avatar.position.y = 4.1 + Math.sin(data.age * 4 + data.phase) * 0.08;
      data.leftArm.rotation.x = Math.sin(data.age * 5 + data.phase) * 0.34;
      data.rightArm.rotation.x = Math.sin(data.age * 5 + data.phase + Math.PI) * 0.34;
      data.leftLeg.rotation.x = Math.sin(data.age * 5 + data.phase + Math.PI) * 0.18;
      data.rightLeg.rotation.x = Math.sin(data.age * 5 + data.phase) * 0.18;
      if (data.armed) {
        data.enemyGun.rotation.x = -0.08 + Math.sin(data.age * 3 + data.phase) * 0.04;
        nextEnemyShotIn = Math.min(nextEnemyShotIn, (data.nextShotAt - now) / 1000);
        if (state.running && now >= data.nextShotAt && camera.position.distanceTo(target.position) < 86) {
          shootEnemyBullet(target);
          data.nextShotAt = now + data.shotCooldown + Math.random() * 1100;
          nextEnemyShotIn = Math.min(nextEnemyShotIn, (data.nextShotAt - now) / 1000);
        }
      }

      if (Math.abs(target.position.x) > 38 || target.position.z > 26 || target.position.z < -36) {
        placeTarget(target);
      }
    });
    if (Number.isFinite(nextEnemyShotIn)) {
      document.body.dataset.fpsNextEnemyShot = Math.max(0, nextEnemyShotIn).toFixed(2);
      window.targetRangeFpsStatus.nextEnemyShot = Number(document.body.dataset.fpsNextEnemyShot);
    }
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
      const redBots = targets.filter((target) => target.userData.team === "red");
      if (redBots.length && Math.random() < 0.38) {
        return redBots[Math.floor(Math.random() * redBots.length)].position.clone().add(new THREE.Vector3(0, 2.2, 0));
      }
      return camera.position.clone().add(new THREE.Vector3(0, -0.18, 0));
    }
    const blueBots = targets.filter((target) => target.userData.team === "blue");
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
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        const hitGroup = hits.map((hit) => getTargetGroup(hit.object)).find((target) => target?.userData.team !== "red");
        if (hitGroup) {
          const hit = hits.find((candidate) => getTargetGroup(candidate.object) === hitGroup);
          bullet.position.copy(hit.point);
          handleTargetHit(hitGroup, hit.point, bullet.userData.weapon);
          scene.remove(bullet);
          bullets.splice(index, 1);
          continue;
        }
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
      if (state.running && bullet.userData.team === "blue" && distanceToSegment(camera.position, bullet.userData.previous, bullet.position) < playerHitRadius) {
        spawnParticles(camera.position, bullet.material.color);
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
        showHitScreen("A robot shot you.");
        break;
      }
      const botHit = getEnemyBulletHit(bullet);
      if (botHit) {
        spawnParticles(botHit.position.clone().add(new THREE.Vector3(0, 2.2, 0)), botHit.userData.core.material.color);
        placeTarget(botHit);
        scene.remove(bullet);
        enemyBullets.splice(index, 1);
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
      distanceToSegment(target.position.clone().add(new THREE.Vector3(0, 2.1, 0)), bullet.userData.previous, bullet.position) < 1.05
    ));
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
    }
  }

  function handleTargetHit(hitGroup, hitPoint, weapon) {
    const closeBonus = Math.max(0, Math.floor((32 - camera.position.distanceTo(hitGroup.position)) * 2));
    const streakBonus = Math.min(400, state.streak * 20);
    const points = Math.round((hitGroup.userData.value + closeBonus + streakBonus) * weapon.points);
    state.score += points;
    state.streak += 1;
    spawnParticles(hitPoint, hitGroup.userData.core.material.color);
    placeTarget(hitGroup);
    if (state.streak % 8 === 0) {
      state.wave += 1;
      makeTarget();
    }
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

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    window.targetRangeFpsStatus.frames += 1;
    document.body.dataset.fpsFrames = String(window.targetRangeFpsStatus.frames);

    if (state.running) {
      state.timeLeft -= delta;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        endGame();
      }
      state.spawnTimer += delta;
      if (state.spawnTimer > 12 && targets.length < 18) {
        state.spawnTimer = 0;
        state.wave += 1;
        makeTarget();
        syncTeamHud();
      }
      updateMovement(delta);
      updateTargets(delta);
      updateBullets(delta);
      updateEnemyBullets(delta);
      syncHud();
    } else {
      updateTargets(delta * 0.45);
      updateBullets(delta);
      updateEnemyBullets(delta);
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
      shoot();
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
  resetButton.addEventListener("click", () => {
    state.best = 0;
    localStorage.removeItem(bestKey);
    bestValue.textContent = "0";
  });
})();
