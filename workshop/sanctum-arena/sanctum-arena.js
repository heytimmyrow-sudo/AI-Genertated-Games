import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   Sanctum Arena (PvAI now, PvP later)
   + MINIMAP (top-right)
========================================================= */

/* =======================
   ERROR OVERLAY
======================= */
const errorBox = document.createElement("div");
Object.assign(errorBox.style, {
  position: "fixed",
  left: "12px",
  right: "12px",
  bottom: "12px",
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(140,0,0,0.85)",
  color: "white",
  fontFamily: "system-ui, Segoe UI, Arial",
  fontSize: "12px",
  lineHeight: "1.35",
  whiteSpace: "pre-wrap",
  zIndex: "9999",
  display: "none",
});
document.body.appendChild(errorBox);

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}
window.addEventListener("error", (e) => {
  showError(
    "JS Error:\n" +
      (e?.message || e) +
      "\n\n" +
      (e?.filename || "") +
      ":" +
      (e?.lineno || "")
  );
});
window.addEventListener("unhandledrejection", (e) => {
  showError("Unhandled Promise Rejection:\n" + (e?.reason?.message || e?.reason || e));
});

/* =======================
   HUD
======================= */
const statsEl = document.getElementById("stats");
const barEl = document.getElementById("bar");
const debugEl = document.getElementById("debug");
const setTextSafe = (el, text) => { if (el) el.textContent = text; };
const setBarSafe = (el, pct) => { if (el) el.style.width = `${pct}%`; };

/* =======================
   MINIMAP (2D Canvas)
======================= */
const mini = document.getElementById("minimap");
const miniCtx = mini ? mini.getContext("2d") : null;
let miniW = 0, miniH = 0, miniDPR = 1;

function setupMinimapCanvas() {
  if (!mini || !miniCtx) return;
  // CSS size is 180x180, but use DPR for crispness
  const cssW = 180;
  const cssH = 180;
  miniDPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  mini.width = Math.floor(cssW * miniDPR);
  mini.height = Math.floor(cssH * miniDPR);
  miniW = mini.width;
  miniH = mini.height;
  miniCtx.setTransform(miniDPR, 0, 0, miniDPR, 0, 0);
  miniCtx.imageSmoothingEnabled = true;
}
setupMinimapCanvas();

/* =======================
   INPUT
======================= */
const input = {
  w: false, a: false, s: false, d: false,
  shift: false,
  wantSwing: false,
  lastKey: "(none)",
};

function onKey(e, isDown) {
  const key = (e.key || "").toLowerCase();
  const code = e.code || "";
  input.lastKey = `${isDown ? "down" : "up"}: key="${e.key}" code="${code}"`;

  if (key === "w" || code === "KeyW") input.w = isDown;
  if (key === "a" || code === "KeyA") input.a = isDown;
  if (key === "s" || code === "KeyS") input.s = isDown;
  if (key === "d" || code === "KeyD") input.d = isDown;
  if (key === "shift" || code === "ShiftLeft" || code === "ShiftRight") input.shift = isDown;

  if ((code === "Space" || key === " ") && isDown) input.wantSwing = true;
}

window.addEventListener("keydown", (e) => onKey(e, true), true);
window.addEventListener("keyup", (e) => onKey(e, false), true);

window.addEventListener("keydown", (e) => {
  if (e.key?.startsWith("Arrow") || e.code === "Space") e.preventDefault();
}, { passive: false });

window.addEventListener("pointerdown", () => {
  document.body.focus({ preventScroll: true });
  input.wantSwing = true;
  audioUnlock();
});

/* =======================
   SAFE MATH
======================= */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function wrapPi(r) {
  const twoPi = Math.PI * 2;
  return ((r + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}
function lerpAngle(a, b, t) {
  const diff = wrapPi(b - a);
  return a + diff * t;
}

/* =======================
   TINY AUDIO (optional)
======================= */
let audioCtx = null;
let musicGain = null;

function audioUnlock() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.014;
    musicGain.connect(audioCtx.destination);

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";
    lfo.type = "sine";

    osc1.frequency.value = 55;
    osc2.frequency.value = 110;
    lfo.frequency.value = 0.16;

    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc2.frequency);

    const mix = audioCtx.createGain();
    mix.gain.value = 0.7;
    osc1.connect(mix);
    osc2.connect(mix);

    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;

    mix.connect(lp);
    lp.connect(musicGain);

    osc1.start();
    osc2.start();
    lfo.start();
  } catch {}
}

function pop(freq = 520, dur = 0.06, vol = 0.06, type = "square") {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.65), t0 + dur);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* =======================
   THREE SETUP
======================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

document.body.tabIndex = 0;
document.body.focus({ preventScroll: true });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a12);
scene.fog = new THREE.Fog(0x070a12, 16, 85);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 240);

// lights
scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x070a12, 0.85));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 140;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

const sanctumGlow = new THREE.PointLight(0xfff0c2, 0.55, 70, 2);
sanctumGlow.position.set(0, 10, 0);
scene.add(sanctumGlow);

/* =======================
   ARENA
======================= */
const ARENA = { tilesX: 26, tilesZ: 18, tileSize: 1.4, grout: 0.06 };
ARENA.halfW = ARENA.tilesX * ARENA.tileSize * 0.5 - 1.0;
ARENA.halfD = ARENA.tilesZ * ARENA.tileSize * 0.5 - 1.0;

function randInArena(margin = 1.3) {
  return {
    x: THREE.MathUtils.randFloat(-ARENA.halfW + margin, ARENA.halfW - margin),
    z: THREE.MathUtils.randFloat(-ARENA.halfD + margin, ARENA.halfD - margin),
  };
}

// floor base
const slab = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA.tilesX * ARENA.tileSize, ARENA.tilesZ * ARENA.tileSize),
  new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.95, metalness: 0.0 })
);
slab.rotation.x = -Math.PI / 2;
slab.receiveShadow = true;
scene.add(slab);

// tiles
const tileGeo = new THREE.PlaneGeometry(ARENA.tileSize - ARENA.grout, ARENA.tileSize - ARENA.grout);
tileGeo.rotateX(-Math.PI / 2);

const tileMat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.03, vertexColors: true });
const tiles = new THREE.InstancedMesh(tileGeo, tileMat, ARENA.tilesX * ARENA.tilesZ);
tiles.receiveShadow = true;
scene.add(tiles);

const palette = [
  new THREE.Color(0xcdd2d9),
  new THREE.Color(0xbfc6d1),
  new THREE.Color(0xd7d1c6),
  new THREE.Color(0xbfd8d2),
  new THREE.Color(0xbad0e3),
  new THREE.Color(0xd6c3d6),
];

const dummy = new THREE.Object3D();
const color = new THREE.Color();
let idx = 0;
const halfW = (ARENA.tilesX - 1) * ARENA.tileSize * 0.5;
const halfD = (ARENA.tilesZ - 1) * ARENA.tileSize * 0.5;

for (let x = 0; x < ARENA.tilesX; x++) {
  for (let z = 0; z < ARENA.tilesZ; z++) {
    dummy.position.set(x * ARENA.tileSize - halfW, 0.02, z * ARENA.tileSize - halfD);
    dummy.updateMatrix();
    tiles.setMatrixAt(idx, dummy.matrix);

    color.copy(palette[(x + z * 2) % palette.length]);
    color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
    tiles.setColorAt(idx, color);

    idx++;
  }
}
tiles.instanceMatrix.needsUpdate = true;
if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;

/* =======================
   SANCTUM STRUCTURE (design)
======================= */
function addLowWall() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x8e97a6, roughness: 0.95, metalness: 0.02 });
  const wallH = 1.15;
  const thick = 0.45;

  const wall1 = new THREE.Mesh(
    new THREE.BoxGeometry(ARENA.halfW * 2 + 2.2, wallH, thick),
    mat
  );
  wall1.position.set(0, wallH / 2, -ARENA.halfD - 0.75);
  wall1.castShadow = true; wall1.receiveShadow = true;

  const wall2 = wall1.clone();
  wall2.position.z = ARENA.halfD + 0.75;

  const wall3 = new THREE.Mesh(
    new THREE.BoxGeometry(thick, wallH, ARENA.halfD * 2 + 2.2),
    mat
  );
  wall3.position.set(-ARENA.halfW - 0.75, wallH / 2, 0);
  wall3.castShadow = true; wall3.receiveShadow = true;

  const wall4 = wall3.clone();
  wall4.position.x = ARENA.halfW + 0.75;

  scene.add(wall1, wall2, wall3, wall4);
}
addLowWall();

function addPillar(x, z, h = 4.6) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 0.35, 18),
    new THREE.MeshStandardMaterial({ color: 0xbfc6d1, roughness: 0.85, metalness: 0.05 })
  );
  base.position.set(0, 0.18, 0);
  base.castShadow = true;
  base.receiveShadow = true;

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.5, h, 18),
    new THREE.MeshStandardMaterial({ color: 0xcdd2d9, roughness: 0.9, metalness: 0.03 })
  );
  shaft.position.set(0, 0.35 + h / 2, 0);
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.55, 0.35, 18),
    new THREE.MeshStandardMaterial({ color: 0xbfc6d1, roughness: 0.85, metalness: 0.05 })
  );
  cap.position.set(0, 0.35 + h + 0.18, 0);
  cap.castShadow = true;
  cap.receiveShadow = true;

  group.add(base, shaft, cap);
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}
for (let i = -2; i <= 2; i++) {
  addPillar(-ARENA.halfW + 1.2, i * 4.2);
  addPillar( ARENA.halfW - 1.2, i * 4.2);
}

// altar block (we'll show it on minimap)
const altar = new THREE.Mesh(
  new THREE.BoxGeometry(4.8, 1.2, 2.2),
  new THREE.MeshStandardMaterial({ color: 0xbfc6d1, roughness: 0.9, metalness: 0.03 })
);
altar.position.set(0, 0.6, -ARENA.halfD + 1.4);
altar.castShadow = true; altar.receiveShadow = true;
scene.add(altar);

// stained-glass style beams
function addLightBeam(x, z, rotY = 0) {
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 18),
    new THREE.MeshStandardMaterial({
      color: 0xffd7a6,
      emissive: 0xffc58a,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  beam.position.set(x, 7.5, z);
  beam.rotation.set(0, rotY, 0);
  scene.add(beam);
  return beam;
}
const beamA = addLightBeam(-3.5, -2.0, Math.PI / 7);
const beamB = addLightBeam( 3.5,  1.0, -Math.PI / 8);
function updateBeams(t) {
  beamA.material.opacity = 0.08 + Math.sin(t * 0.6) * 0.02;
  beamB.material.opacity = 0.08 + Math.sin(t * 0.7 + 1.2) * 0.02;
}

/* =======================
   ATMOSPHERE: HOLY MOTES
======================= */
const motesCount = 220;
const motesGeo = new THREE.BufferGeometry();
const motesPos = new Float32Array(motesCount * 3);
const motesSeed = new Float32Array(motesCount);

for (let i = 0; i < motesCount; i++) {
  const p = randInArena(1.2);
  motesPos[i * 3 + 0] = p.x;
  motesPos[i * 3 + 1] = THREE.MathUtils.randFloat(0.8, 8.0);
  motesPos[i * 3 + 2] = p.z;
  motesSeed[i] = Math.random() * 10;
}
motesGeo.setAttribute("position", new THREE.BufferAttribute(motesPos, 3));

const motesMat = new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0.55 });
const motes = new THREE.Points(motesGeo, motesMat);
scene.add(motes);

function updateMotes(t, dt) {
  const pos = motesGeo.attributes.position;
  for (let i = 0; i < motesCount; i++) {
    const yIndex = i * 3 + 1;
    const base = 0.8 + (motesSeed[i] % 1) * 7.2;
    pos.array[yIndex] = base + Math.sin(t * 0.8 + motesSeed[i]) * 0.25;
    pos.array[i * 3 + 0] += Math.sin(t * 0.3 + motesSeed[i]) * dt * 0.08;
    pos.array[i * 3 + 2] += Math.cos(t * 0.25 + motesSeed[i]) * dt * 0.08;
  }
  pos.needsUpdate = true;
}

/* =======================
   GAME STATE
======================= */
const game = {
  alive: true,
  hpMax: 100,
  hp: 100,
  level: 1,
  xp: 0,
  dashCd: 0,
  dashCdMax: 0.85,
  swingT: 0,
  swingCd: 0,
  swingCdMax: 0.22,
  invuln: 0,
};

function xpToNext(lv) { return Math.floor(8 + lv * 6); }

/* =======================
   PLAYER (with facing helpers)
======================= */
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.72, 1.2, 6, 18),
  new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.35, metalness: 0.12 })
);
player.castShadow = true;
player.position.set(0, 1.2, 0);
scene.add(player);

// halo
const halo = new THREE.Mesh(
  new THREE.RingGeometry(0.55, 0.95, 40),
  new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffe08a,
    emissiveIntensity: 1.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  })
);
halo.rotation.x = -Math.PI / 2;
halo.position.set(0, 1.95, 0);
player.add(halo);

// front gem
const frontGem = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffe6a0,
    emissiveIntensity: 3.0,
    roughness: 0.2,
    metalness: 0.15,
  })
);
frontGem.position.set(0, 1.45, 0.62);
player.add(frontGem);

// ground pointer wedge
const pointer = new THREE.Mesh(
  new THREE.ConeGeometry(0.22, 0.55, 18),
  new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffe6a0,
    emissiveIntensity: 2.0,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  })
);
pointer.rotation.x = -Math.PI / 2;
pointer.position.set(0, 0.06, 0);
scene.add(pointer);

/* =======================
   SWORD (follows facing)
======================= */
const swordPivot = new THREE.Group();
player.add(swordPivot);

const sword = new THREE.Group();
sword.position.set(0.55, 0.0, 0.0);
swordPivot.add(sword);

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.09, 0.09, 0.55, 14),
  new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.9, metalness: 0.1 })
);
handle.castShadow = true;
handle.rotation.z = Math.PI / 2;
handle.position.set(0.35, 1.05, 0.0);
sword.add(handle);

const guard = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.38, 0.58),
  new THREE.MeshStandardMaterial({ color: 0xd7c16d, roughness: 0.35, metalness: 0.65 })
);
guard.castShadow = true;
guard.position.set(0.55, 1.05, 0.0);
sword.add(guard);

const blade = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.12, 1.7),
  new THREE.MeshStandardMaterial({
    color: 0xe8edf5,
    roughness: 0.25,
    metalness: 0.85,
    emissive: 0x0a0f20,
    emissiveIntensity: 0.25,
  })
);
blade.castShadow = true;
blade.position.set(0.55, 1.05, 0.85);
sword.add(blade);

// sword trail
const trail = new THREE.Mesh(
  new THREE.PlaneGeometry(0.10, 2.2),
  new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: 0xffe6a0,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
trail.position.set(0.55, 1.05, 1.0);
trail.rotation.y = Math.PI / 2;
sword.add(trail);

function applyLevelVisuals() {
  const scale = 1 + (game.level - 1) * 0.08;
  sword.scale.set(scale, scale, scale);
  halo.scale.set(1 + (game.level - 1) * 0.04, 1 + (game.level - 1) * 0.04, 1);
  halo.material.emissiveIntensity = 1.35 + (game.level - 1) * 0.06;
}
applyLevelVisuals();

/* =======================
   ORBS (Grace)
======================= */
const orbs = [];
const orbGeo = new THREE.IcosahedronGeometry(0.16, 0);
const orbMat = new THREE.MeshStandardMaterial({
  color: 0xfff3b0,
  emissive: 0xffe6a0,
  emissiveIntensity: 2.2,
  roughness: 0.2,
  metalness: 0.25,
  transparent: true,
  opacity: 0.95,
});

function spawnOrb(pos = null, value = 1) {
  const m = new THREE.Mesh(orbGeo, orbMat);
  const p = pos ?? randInArena();
  m.position.set(p.x, 0.45, p.z);
  scene.add(m);
  orbs.push({ mesh: m, value, seed: Math.random() * 10 });
}
function ensureOrbs(target = 28) { while (orbs.length < target) spawnOrb(null, 1); }
ensureOrbs();

/* =======================
   ENEMIES (PvAI)
======================= */
const enemies = [];
const enemyGeo = new THREE.SphereGeometry(0.55, 18, 18);

const enemyMatA = new THREE.MeshStandardMaterial({
  color: 0x5aa2ff, roughness: 0.55, metalness: 0.1,
  emissive: 0x1b2a66, emissiveIntensity: 0.9,
});
const enemyMatB = new THREE.MeshStandardMaterial({
  color: 0xff5a88, roughness: 0.55, metalness: 0.1,
  emissive: 0x551126, emissiveIntensity: 0.9,
});

function spawnEnemy() {
  const mesh = new THREE.Mesh(enemyGeo, Math.random() < 0.5 ? enemyMatA : enemyMatB);
  mesh.castShadow = true;

  const side = Math.floor(Math.random() * 4);
  const margin = 1.0;
  let x, z;

  if (side === 0) { x = -ARENA.halfW + margin; z = THREE.MathUtils.randFloat(-ARENA.halfD + margin, ARENA.halfD - margin); }
  else if (side === 1) { x =  ARENA.halfW - margin; z = THREE.MathUtils.randFloat(-ARENA.halfD + margin, ARENA.halfD - margin); }
  else if (side === 2) { z = -ARENA.halfD + margin; x = THREE.MathUtils.randFloat(-ARENA.halfW + margin, ARENA.halfW - margin); }
  else { z =  ARENA.halfD - margin; x = THREE.MathUtils.randFloat(-ARENA.halfW + margin, ARENA.halfW - margin); }

  mesh.position.set(x, 0.75, z);
  scene.add(mesh);

  enemies.push({
    mesh,
    hp: 18 + game.level * 4,
    speed: 1.8 + game.level * 0.06 + Math.random() * 0.4,
    dmg: 10 + game.level * 1.1,
    hitRadius: 0.95,
    wanderT: Math.random() * 2,
    wanderDir: Math.random() * Math.PI * 2,
  });
}
function ensureEnemies(target = 10) { while (enemies.length < target) spawnEnemy(); }
ensureEnemies(10);

/* =======================
   COMBAT
======================= */
function swingStats() {
  const reach = 1.9 + (game.level - 1) * 0.14;
  const dmg   = 10  + (game.level - 1) * 2.2;
  return { reach, dmg };
}

function startSwing() {
  if (!game.alive) return;
  if (game.swingCd > 0) return;

  game.swingCd = game.swingCdMax;
  game.swingT = 0.0001;
  swordPivot.userData.didHit = false;
  pop(520, 0.05, 0.06, "square");
}

function damageEnemiesInFrontCone() {
  const { reach, dmg } = swingStats();

  const yaw = player.rotation.y;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  const px = player.position.x;
  const pz = player.position.z;

  let killed = 0;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const ex = e.mesh.position.x;
    const ez = e.mesh.position.z;

    const dx = ex - px;
    const dz = ez - pz;
    const dist = Math.hypot(dx, dz);
    if (dist > reach + 0.65) continue;

    const dot = (dx / Math.max(0.0001, dist)) * fx + (dz / Math.max(0.0001, dist)) * fz;
    if (dot < 0.15) continue;

    e.hp -= dmg;

    const nx = dx / Math.max(0.0001, dist);
    const nz = dz / Math.max(0.0001, dist);
    e.mesh.position.x += nx * 0.35;
    e.mesh.position.z += nz * 0.35;

    if (e.hp <= 0) {
      const drops = 3 + Math.floor(game.level * 0.35);
      for (let k = 0; k < drops; k++) {
        spawnOrb({ x: ex + THREE.MathUtils.randFloat(-0.7, 0.7), z: ez + THREE.MathUtils.randFloat(-0.7, 0.7) }, 1);
      }
      scene.remove(e.mesh);
      enemies.splice(i, 1);
      killed++;
    }
  }

  if (killed > 0) pop(820, 0.06, 0.05, "triangle");
}

function addXP(amount) {
  game.xp += amount;
  while (game.xp >= xpToNext(game.level)) {
    game.xp -= xpToNext(game.level);
    game.level++;

    game.hpMax = Math.round(game.hpMax + 10);
    game.hp = Math.min(game.hpMax, game.hp + 18);

    applyLevelVisuals();
    pop(980, 0.09, 0.06, "sine");
  }
}

/* =======================
   MINIMAP DRAW
======================= */
function drawMinimap() {
  if (!miniCtx || !mini) return;

  const ctx = miniCtx;
  const W = 180;
  const H = 180;

  // Map world -> minimap coords
  const pad = 10;
  const worldW = (ARENA.halfW * 2);
  const worldH = (ARENA.halfD * 2);
  const scale = Math.min((W - pad * 2) / worldW, (H - pad * 2) / worldH);

  function toMini(x, z) {
    const mx = W / 2 + x * scale;
    const my = H / 2 + z * scale; // z goes down
    return { mx, my };
  }

  // background
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 0, W, H);

  // arena boundary
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    W / 2 - ARENA.halfW * scale,
    H / 2 - ARENA.halfD * scale,
    ARENA.halfW * 2 * scale,
    ARENA.halfD * 2 * scale
  );

  // altar mark
  if (altar) {
    const a = toMini(altar.position.x, altar.position.z);
    ctx.fillStyle = "rgba(255,235,170,0.85)";
    ctx.fillRect(a.mx - 3, a.my - 3, 6, 6);
  }

  // orbs
  ctx.fillStyle = "rgba(255,235,170,0.65)";
  for (const o of orbs) {
    const p = o.mesh.position;
    const m = toMini(p.x, p.z);
    ctx.fillRect(m.mx - 1, m.my - 1, 2, 2);
  }

  // enemies
  ctx.fillStyle = "rgba(255,90,136,0.9)";
  for (const e of enemies) {
    const p = e.mesh.position;
    const m = toMini(p.x, p.z);
    ctx.beginPath();
    ctx.arc(m.mx, m.my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // player + facing arrow
  const pp = toMini(player.position.x, player.position.z);
  const yaw = player.rotation.y;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  // arrow tip
  const tip = toMini(player.position.x + fx * 1.2, player.position.z + fz * 1.2);

  ctx.strokeStyle = "rgba(170,220,255,0.95)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pp.mx, pp.my);
  ctx.lineTo(tip.mx, tip.my);
  ctx.stroke();

  ctx.fillStyle = "rgba(170,220,255,0.95)";
  ctx.beginPath();
  ctx.arc(pp.mx, pp.my, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // subtle center crosshair
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W/2 - 6, H/2);
  ctx.lineTo(W/2 + 6, H/2);
  ctx.moveTo(W/2, H/2 - 6);
  ctx.lineTo(W/2, H/2 + 6);
  ctx.stroke();
}

/* =======================
   DEATH / RESTART
======================= */
function die() {
  game.alive = false;
  pop(180, 0.12, 0.08, "sawtooth");
}
function restart() {
  game.alive = true;
  game.hpMax = 100; game.hp = 100;
  game.level = 1; game.xp = 0;
  game.invuln = 0;
  game.dashCd = 0;
  game.swingCd = 0;
  game.swingT = 0;

  player.position.set(0, 1.2, 0);
  player.rotation.y = 0;

  applyLevelVisuals();

  for (const e of enemies) scene.remove(e.mesh);
  enemies.length = 0;
  for (const o of orbs) scene.remove(o.mesh);
  orbs.length = 0;

  ensureOrbs(28);
  ensureEnemies(10);
}

/* =======================
   CAMERA
======================= */
const camOffset = new THREE.Vector3(7.5, 9.0, 7.5);

/* =======================
   MAIN LOOP
======================= */
const clock = new THREE.Clock();
let t = 0;

function loop() {
  try {
    const dt = Math.min(clock.getDelta(), 0.033);
    t += dt;

    game.dashCd = Math.max(0, game.dashCd - dt);
    game.swingCd = Math.max(0, game.swingCd - dt);
    game.invuln = Math.max(0, game.invuln - dt);

    if (input.wantSwing) { input.wantSwing = false; startSwing(); }

    // movement
    let mx = 0, mz = 0;
    if (input.w) mz -= 1;
    if (input.s) mz += 1;
    if (input.a) mx -= 1;
    if (input.d) mx += 1;

    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }

    let speed = 6.5;
    if (game.alive && input.shift && game.dashCd <= 0 && len > 0) {
      speed = 15.0;
      game.dashCd = game.dashCdMax;
      pop(600, 0.04, 0.03, "square");
    }

    if (game.alive) {
      player.position.x += mx * speed * dt;
      player.position.z += mz * speed * dt;
    }

    player.position.x = clamp(player.position.x, -ARENA.halfW, ARENA.halfW);
    player.position.z = clamp(player.position.z, -ARENA.halfD, ARENA.halfD);

    // face from movement
    if (len > 0) {
      const targetYaw = Math.atan2(mx, mz);
      player.rotation.y = lerpAngle(player.rotation.y, targetYaw, 0.22);
    }

    // bob + halo
    const moveAmount = len * speed;
    player.position.y = 1.2 + Math.sin(t * 10) * 0.06 * Math.min(moveAmount / 6.5, 1);
    halo.rotation.z += dt * (0.9 + moveAmount * 0.03);

    // facing helpers
    {
      const yaw = player.rotation.y;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      pointer.position.x = player.position.x + fx * 0.95;
      pointer.position.z = player.position.z + fz * 0.95;
      pointer.position.y = 0.06 + Math.sin(t * 6) * 0.01;
      pointer.rotation.z = -yaw;
      frontGem.material.emissiveIntensity = 2.7 + Math.sin(t * 6) * 0.35;
    }

    // swing anim
    const heldAngle = 0.15;
    const heldTilt  = 0.18;

    if (game.swingT > 0) {
      game.swingT += dt;
      const a = Math.min(game.swingT / 0.11, 1);
      const swing = Math.sin(a * Math.PI);

      sword.rotation.y = heldAngle + swing * 1.6;
      sword.rotation.z = heldTilt  + swing * 0.45;
      trail.material.opacity = 0.18 * swing;

      if (a > 0.35 && a < 0.50 && !swordPivot.userData.didHit) {
        swordPivot.userData.didHit = true;
        damageEnemiesInFrontCone();
      }

      if (a >= 1) {
        game.swingT = 0;
        swordPivot.userData.didHit = false;
        sword.rotation.y = heldAngle;
        sword.rotation.z = heldTilt;
        trail.material.opacity = 0.0;
      }
    } else {
      sword.rotation.y = heldAngle;
      sword.rotation.z = heldTilt;
      trail.material.opacity = 0.0;
      swordPivot.userData.didHit = false;
    }

    // enemies AI + contact damage
    if (game.alive) {
      const px = player.position.x;
      const pz = player.position.z;

      for (const e of enemies) {
        const m = e.mesh;
        const vx = px - m.position.x;
        const vz = pz - m.position.z;
        const d = Math.hypot(vx, vz);

        let tx = 0, tz = 0;

        if (d < 8.5 + game.level * 0.15) {
          if (d > 0.0001) { tx = vx / d; tz = vz / d; }
        } else {
          e.wanderT -= dt;
          if (e.wanderT <= 0) {
            e.wanderT = THREE.MathUtils.randFloat(0.7, 2.0);
            e.wanderDir += THREE.MathUtils.randFloat(-1.2, 1.2);
          }
          tx = Math.sin(e.wanderDir);
          tz = Math.cos(e.wanderDir);
        }

        m.position.x = clamp(m.position.x + tx * e.speed * dt, -ARENA.halfW, ARENA.halfW);
        m.position.z = clamp(m.position.z + tz * e.speed * dt, -ARENA.halfD, ARENA.halfD);
        m.position.y = 0.75 + Math.sin(t * 5.5 + m.position.x * 0.3) * 0.05;

        if (game.invuln <= 0) {
          const dd = Math.hypot(px - m.position.x, pz - m.position.z);
          if (dd < e.hitRadius + 0.85) {
            game.hp -= e.dmg;
            game.invuln = 0.35;
            pop(240, 0.05, 0.07, "square");

            const push = 0.55;
            const nx = (px - m.position.x) / Math.max(0.0001, dd);
            const nz = (pz - m.position.z) / Math.max(0.0001, dd);
            player.position.x = clamp(player.position.x + nx * push, -ARENA.halfW, ARENA.halfW);
            player.position.z = clamp(player.position.z + nz * push, -ARENA.halfD, ARENA.halfD);

            if (game.hp <= 0) { game.hp = 0; die(); break; }
          }
        }
      }
    }

    // orb animation + pickup
    if (game.alive) {
      const px = player.position.x;
      const pz = player.position.z;

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        const m = o.mesh;

        m.position.y = 0.45 + Math.sin(t * 2.7 + o.seed) * 0.08;
        m.rotation.y += dt * 1.6;
        m.rotation.x += dt * 0.9;

        const d = Math.hypot(m.position.x - px, m.position.z - pz);
        const pickR = 0.9 + (game.level - 1) * 0.02;

        if (d < pickR) {
          addXP(o.value);
          pop(680, 0.04, 0.04, "triangle");
          scene.remove(m);
          orbs.splice(i, 1);
        }
      }
    }

    ensureOrbs(28);
    ensureEnemies(10 + Math.floor(game.level * 0.7));

    updateBeams(t);
    updateMotes(t, dt);

    // camera
    const desiredCam = new THREE.Vector3().copy(player.position).add(camOffset);
    camera.position.lerp(desiredCam, 0.10);
    camera.lookAt(player.position.x, 0.9, player.position.z);

    // HUD
    const xpNeed = xpToNext(game.level);
    const xpPct = (game.xp / Math.max(1, xpNeed)) * 100;
    setBarSafe(barEl, clamp(xpPct, 0, 100));

    const { reach, dmg } = swingStats();
    const dashPct  = game.dashCd  <= 0 ? 100 : (1 - game.dashCd / game.dashCdMax) * 100;
    const swingPct = game.swingCd <= 0 ? 100 : (1 - game.swingCd / game.swingCdMax) * 100;

    const status = game.alive
      ? `HP: ${Math.ceil(game.hp)}/${game.hpMax}
Level: ${game.level} • Faith: ${game.xp}/${xpNeed}
Sword: dmg ${dmg.toFixed(0)} • reach ${reach.toFixed(1)}
Enemies: ${enemies.length} • Orbs: ${orbs.length}
Dash: ${dashPct.toFixed(0)}% • Swing: ${swingPct.toFixed(0)}%`
      : `💀 You fell in the Sanctum.\nPress R to restart.`;

    setTextSafe(statsEl, status);

    setTextSafe(
      debugEl,
      `Last key: ${input.lastKey}
Down: ${Object.entries({w:input.w,a:input.a,s:input.s,d:input.d,shift:input.shift}).filter(([,v])=>v).map(([k])=>k).join(", ") || "(none)"}
Minimap: player arrow shows facing`
    );

    // minimap last (so it matches final positions)
    drawMinimap();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  } catch (err) {
    showError("Crash inside loop():\n" + (err?.stack || err));
  }
}

window.addEventListener("keydown", (e) => {
  const k = (e.key || "").toLowerCase();
  if (k === "r") restart();
  if (k === "m" && musicGain) musicGain.gain.value = musicGain.gain.value > 0 ? 0 : 0.014;
}, true);

loop();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  setupMinimapCanvas(); // keep minimap crisp on resize
});