// Castaway Architects - Ultimate Version
// - Fixed-angle camera + mouse wheel zoom
// - Sprint (Shift)
// - Passive income from houses
// - Beacon Tower, Wind Spire, Crystal Garden upgrades with REAL effects
// - Simple day/night cycle
// - Objectives panel that updates as you progress

const canvas = document.getElementById("castaway-canvas");

// HUD elements
const moneyEl = document.getElementById("money-count");
const logsEl = document.getElementById("logs-count");
const planksEl = document.getElementById("planks-count");
const stoneEl = document.getElementById("stone-count");
const bricksEl = document.getElementById("bricks-count");
const buildsEl = document.getElementById("builds-count");
const populationEl = document.getElementById("population-count");
const workersEl = document.getElementById("workers-count");
const foodEl = document.getElementById("food-count");
const moraleEl = document.getElementById("morale-count");
const objectiveEl = document.getElementById("objective-text");

const state = {
  money: 0,
  logs: 0,
  planks: 0,
  stone: 0,
  bricks: 0,
  builds: 0,          // houses
  bridgeBuilt: false,
  population: 0,
  workers: 0,
  food: 10,
  morale: 58,
  survivorsRescued: 0,

  woodProcessor: null,
  stoneCutter: null,
  constructionStation: null,

  // island upgrades
  hasBeaconTower: false,
  hasWindSpire: false,
  hasCrystalGarden: false
};

let objectiveStep = 0; // 0..6
function updateObjective() {
  switch (objectiveStep) {
    case 0:
      objectiveEl.textContent = "The wreck survivors need a camp. Gather logs and stone so the first shelters can go up.";
      break;
    case 1:
      objectiveEl.textContent = "Build a Wood Processor so your crew can turn salvage logs into usable planks.";
      break;
    case 2:
      objectiveEl.textContent = "Build a Stone Cutter and start shaping proper stormproof materials.";
      break;
    case 3:
      objectiveEl.textContent = "Raise a Construction Station. The colony needs a real center of work and planning.";
      break;
    case 4:
      objectiveEl.textContent = "Build the bridge and reach the eastern island. More survivors and supplies are stranded there.";
      break;
    case 5:
      objectiveEl.textContent = "Build at least 3 survivor houses so the camp turns into a living village.";
      break;
    case 6:
      objectiveEl.textContent = "Complete the colony upgrades: Beacon Tower, Wind Spire, and Crystal Garden.";
      break;
    default:
      objectiveEl.textContent = "The beacon colony stands. Keep food stocked, morale high, and the survivors ready for rescue sails.";
      break;
  }
}
updateObjective();

function updateHUD() {
  moneyEl.textContent = state.money;
  logsEl.textContent = state.logs;
  planksEl.textContent = state.planks;
  stoneEl.textContent = state.stone;
  bricksEl.textContent = state.bricks;
  buildsEl.textContent = state.builds;
  populationEl.textContent = state.population;
  workersEl.textContent = state.workers;
  foodEl.textContent = state.food;
  moraleEl.textContent = Math.round(state.morale);
}

// === THREE setup ===

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio || 1);

const scene = new THREE.Scene();
const colorDay = new THREE.Color(0x90c8ff);
const colorNight = new THREE.Color(0x020514);
scene.background = colorDay.clone();
scene.fog = new THREE.FogExp2(0x7bb1e6, 0.012);

const camera = new THREE.PerspectiveCamera(
  55,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);

// camera follow + zoom
let cameraDistance = 55;
const minCameraDistance = 28;
const maxCameraDistance = 85;
const cameraHeight = 26;
const cameraAzimuth = Math.PI * 0.72;
const cameraLookAhead = 3.8;
let cameraShake = 0;

const hemiLight = new THREE.HemisphereLight(0xe8fbff, 0x29425b, 1.1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(30, 60, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// resize handling
function resizeRendererToDisplaySize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  return needResize;
}

// === islands & water ===

const islandGroup = new THREE.Group();
scene.add(islandGroup);

function makeIsland(radiusTop, radiusBottom, height, radialSegments, color) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// main island
const island1 = makeIsland(38, 42, 4, 48, 0xf6e7b4);
island1.position.set(0, -2, 0);
islandGroup.add(island1);

const grassGeo1 = new THREE.CylinderGeometry(32, 32, 1, 48);
const grassMat1 = new THREE.MeshStandardMaterial({
  color: 0x7ad97c,
  roughness: 0.7
});
const grass1 = new THREE.Mesh(grassGeo1, grassMat1);
grass1.position.set(0, 0, 0);
grass1.receiveShadow = true;
islandGroup.add(grass1);

// second island
const island2 = makeIsland(30, 34, 4, 40, 0xf2e0b3);
island2.position.set(70, -2, 0);
islandGroup.add(island2);

const grassGeo2 = new THREE.CylinderGeometry(25, 25, 1, 40);
const grassMat2 = new THREE.MeshStandardMaterial({
  color: 0x88e3b0,
  roughness: 0.7
});
const grass2 = new THREE.Mesh(grassGeo2, grassMat2);
grass2.position.set(70, 0, 0);
grass2.receiveShadow = true;
islandGroup.add(grass2);

// water
const waterGeo = new THREE.PlaneGeometry(300, 200);
const waterMat = new THREE.MeshPhongMaterial({
  color: 0x3c82a6,
  transparent: true,
  opacity: 0.9,
  shininess: 70
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2;
water.position.y = -3.5;
scene.add(water);

let bridgeMesh = null;

// === player ===

const playerGroup = new THREE.Group();
scene.add(playerGroup);

const playerBodyGeo = new THREE.SphereGeometry(1.1, 24, 16);
const playerBodyMat = new THREE.MeshStandardMaterial({
  color: 0xf7f2da,
  metalness: 0,
  roughness: 0.8
});
const playerBody = new THREE.Mesh(playerBodyGeo, playerBodyMat);
playerBody.castShadow = true;
playerBody.position.y = 1.4;
playerGroup.add(playerBody);

const robeGeo = new THREE.SphereGeometry(1.3, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI);
const robeMat = new THREE.MeshStandardMaterial({
  color: 0x5a7bb8,
  metalness: 0,
  roughness: 0.65
});
const robe = new THREE.Mesh(robeGeo, robeMat);
robe.castShadow = true;
robe.position.y = 0.6;
playerGroup.add(robe);

const headGeo = new THREE.SphereGeometry(0.6, 20, 16);
const headMat = new THREE.MeshStandardMaterial({
  color: 0xf0c89f,
  roughness: 0.7
});
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 2.4;
head.castShadow = true;
playerGroup.add(head);

const hairGeo = new THREE.SphereGeometry(0.65, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.5);
const hairMat = new THREE.MeshStandardMaterial({
  color: 0xdec47a,
  roughness: 0.6
});
const hair = new THREE.Mesh(hairGeo, hairMat);
hair.position.y = 2.55;
playerGroup.add(hair);

const auraGeo = new THREE.SphereGeometry(1.9, 20, 16);
const auraMat = new THREE.MeshBasicMaterial({
  color: 0xb6f4ff,
  transparent: true,
  opacity: 0.18
});
const aura = new THREE.Mesh(auraGeo, auraMat);
aura.position.y = 1.3;
playerGroup.add(aura);

const playerPos = new THREE.Vector3(0, 0, 0);
playerGroup.position.copy(playerPos);

const cameraTargetPos = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();

// === resources ===

const resources = []; // { type, mesh, alive, respawnTime, island }

function makeTree(x, z, islandIndex) {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5e3b22,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  group.add(trunk);

  const leavesGeo = new THREE.ConeGeometry(1.0, 2.4, 14);
  const leavesMat = new THREE.MeshStandardMaterial({
    color: 0x4c9b4c,
    roughness: 0.7
  });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 2.3;
  leaves.castShadow = true;
  group.add(leaves);

  group.position.set(x, 0, z);
  scene.add(group);

  resources.push({
    type: "tree",
    mesh: group,
    alive: true,
    respawnTime: 0,
    island: islandIndex
  });
}

function makeRock(x, z, islandIndex) {
  const geo = new THREE.DodecahedronGeometry(0.9);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7b818f,
    roughness: 0.8,
    metalness: 0.1
  });
  const rock = new THREE.Mesh(geo, mat);
  rock.castShadow = true;
  rock.receiveShadow = true;
  rock.position.set(x, 0.3, z);
  scene.add(rock);

  resources.push({
    type: "rock",
    mesh: rock,
    alive: true,
    respawnTime: 0,
    island: islandIndex
  });
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnResources() {
  // island1 at (0,0)
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = randRange(8, 26);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (i % 3 === 0) makeRock(x, z, 1);
    else makeTree(x, z, 1);
  }

  // island2 at (70,0)
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = randRange(6, 20);
    const x = 70 + Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (i % 2 === 0) makeTree(x, z, 2);
    else makeRock(x, z, 2);
  }
}
spawnResources();

// === utils ===

function dist2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function isOnIsland(pos, islandIndex) {
  if (islandIndex === 1) {
    const d = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    return d < 28;
  } else if (islandIndex === 2) {
    const dx = pos.x - 70;
    const dz = pos.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    return d < 23;
  }
  return false;
}

// === structures & platforms ===

const structures = []; // { type, mesh, radius }
const villagers = [];
const houseAnchors = [];

function makePlatformBase(color) {
  const geo = new THREE.CylinderGeometry(2.6, 2.6, 0.4, 20);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0.2, 0);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

// animated bits
let woodRing = null;
let stoneBlade = null;
let beaconHead = null;
let windSpireBlades = null;
const crystalMeshes = [];

// wood processor
function makeWoodProcessor() {
  const x = -10;
  const z = 8;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = makePlatformBase(0x315b2d);
  group.add(base);

  const bodyGeo = new THREE.BoxGeometry(2.4, 1.4, 2.0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4d8950,
    roughness: 0.55
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 1.2, 0);
  body.castShadow = true;
  group.add(body);

  const ringGeo = new THREE.TorusGeometry(1.0, 0.1, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xdaf9c7,
    emissive: 0x8cf46a,
    emissiveIntensity: 0.7
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 1.6, 0);
  ring.castShadow = true;
  group.add(ring);

  scene.add(group);

  structures.push({
    type: "woodProcessor",
    mesh: group,
    radius: 4
  });
  state.woodProcessor = group;
  woodRing = ring;
}

// stone cutter
function makeStoneCutter() {
  const x = 10;
  const z = 8;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = makePlatformBase(0x34435f);
  group.add(base);

  const bodyGeo = new THREE.BoxGeometry(2.5, 1.2, 2.5);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4a5875,
    roughness: 0.6
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 1.1, 0);
  body.castShadow = true;
  group.add(body);

  const bladeGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 20);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xdce4ff,
    metalness: 0.75,
    roughness: 0.3
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0, 1.7, 0);
  blade.castShadow = true;
  group.add(blade);

  scene.add(group);

  structures.push({
    type: "stoneCutter",
    mesh: group,
    radius: 4
  });
  state.stoneCutter = group;
  stoneBlade = blade;
}

// construction station
function makeConstructionStation() {
  const x = 0;
  const z = -10;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = makePlatformBase(0x71562e);
  group.add(base);

  const pillarGeo = new THREE.BoxGeometry(0.4, 2.4, 0.4);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x8a6b3c,
    roughness: 0.7
  });

  const p1 = new THREE.Mesh(pillarGeo, pillarMat);
  const p2 = p1.clone();
  const p3 = p1.clone();
  const p4 = p1.clone();

  p1.position.set(-1.3, 1.4, -1.3);
  p2.position.set(1.3, 1.4, -1.3);
  p3.position.set(-1.3, 1.4, 1.3);
  p4.position.set(1.3, 1.4, 1.3);

  [p1, p2, p3, p4].forEach((m) => {
    m.castShadow = true;
    group.add(m);
  });

  const roofGeo = new THREE.BoxGeometry(3.2, 0.3, 3.2);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xdcc397,
    roughness: 0.6
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 2.8, 0);
  roof.castShadow = true;
  group.add(roof);

  const runeGeo = new THREE.CircleGeometry(0.6, 24);
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0xf7f7ff,
    emissive: 0x8ff2ff,
    emissiveIntensity: 0.8
  });
  const rune = new THREE.Mesh(runeGeo, runeMat);
  rune.position.set(0, 2.2, -1.61);
  rune.rotation.x = -Math.PI / 2;
  rune.castShadow = true;
  group.add(rune);

  scene.add(group);

  structures.push({
    type: "constructionStation",
    mesh: group,
    radius: 5
  });
  state.constructionStation = group;
}

function getHouseAnchor(buildIndex) {
  const cx = 0;
  const cz = -10;
  const radius = 10;
  const angle = (buildIndex / 8) * Math.PI * 2;
  return {
    x: cx + Math.cos(angle) * radius,
    z: cz + Math.sin(angle) * radius
  };
}

function createVillager(role, homeIndex) {
  const anchor = houseAnchors[Math.max(0, homeIndex)] || { x: 0, z: -10 };
  const group = new THREE.Group();

  const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.9, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: role === "worker" ? 0x5a9fd4 : 0xd8b47c,
    roughness: 0.7
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.24, 14, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xf0c89f,
    roughness: 0.75
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.72;
  head.castShadow = true;
  group.add(head);

  group.position.set(anchor.x + randRange(-0.8, 0.8), 0, anchor.z + randRange(-0.8, 0.8));
  scene.add(group);

  villagers.push({
    mesh: group,
    role,
    homeIndex,
    target: new THREE.Vector3(anchor.x, 0, anchor.z),
    speed: role === "worker" ? 3.1 : 2.3,
    wait: randRange(0.4, 2.0),
    bob: Math.random() * Math.PI * 2
  });
}

function syncVillagePopulation() {
  const desiredWorkers = Math.min(state.population, Math.max(0, Math.floor(state.builds * 0.5)));
  state.workers = desiredWorkers;

  while (villagers.length < state.population) {
    const index = villagers.length;
    const role = index < desiredWorkers ? "worker" : "settler";
    createVillager(role, Math.min(houseAnchors.length - 1, Math.floor(index / 2)));
  }

  for (let i = 0; i < villagers.length; i += 1) {
    villagers[i].role = i < desiredWorkers ? "worker" : "settler";
    villagers[i].mesh.children[0].material.color.setHex(i < desiredWorkers ? 0x5a9fd4 : 0xd8b47c);
  }
}

function chooseVillagerTarget(villager) {
  const home = houseAnchors[Math.max(0, villager.homeIndex)] || { x: 0, z: -10 };
  const workerStops = [
    { x: home.x, z: home.z },
    { x: 0, z: -10 },
    { x: -10, z: 8 },
    { x: 10, z: 8 },
    { x: 20, z: -2 },
    { x: 70, z: 0 }
  ];

  if (villager.role === "worker") {
    const stop = workerStops[Math.floor(Math.random() * workerStops.length)];
    villager.target.set(stop.x + randRange(-1.2, 1.2), 0, stop.z + randRange(-1.2, 1.2));
  } else {
    villager.target.set(home.x + randRange(-2.4, 2.4), 0, home.z + randRange(-2.4, 2.4));
  }
  villager.wait = randRange(1.2, 3.8);
}

// houses
function makeHouse(buildIndex) {
  const anchor = getHouseAnchor(buildIndex);
  const x = anchor.x;
  const z = anchor.z;
  houseAnchors.push(anchor);

  const baseGeo = new THREE.BoxGeometry(2.2, 1.5, 2.2);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc18b5e,
    roughness: 0.8
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(x, 1, z);
  base.castShadow = true;
  base.receiveShadow = true;

  const roofGeo = new THREE.ConeGeometry(1.7, 1.4, 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7b2f27,
    roughness: 0.7
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(x, 2.4, z);
  roof.castShadow = true;

  scene.add(base, roof);
}

// bridge
function makeBridge() {
  if (bridgeMesh) return;

  const bridgeGeo = new THREE.BoxGeometry(32, 0.4, 4);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0xb89463,
    roughness: 0.75
  });
  bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridgeMesh.position.set(35, 0, 0);
  bridgeMesh.castShadow = true;
  bridgeMesh.receiveShadow = true;
  scene.add(bridgeMesh);
}

// === ISLAND UPGRADES (original designs) ===

// 1) Beacon Tower – tall glowing tower on main island
function makeBeaconTower() {
  const group = new THREE.Group();
  const x = 24;
  const z = -8;
  group.position.set(x, 0, z);

  const baseGeo = new THREE.CylinderGeometry(2.0, 2.6, 1, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xb98f63,
    roughness: 0.8
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const towerGeo = new THREE.CylinderGeometry(1.2, 1.5, 6, 16);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0xf3f3f7,
    roughness: 0.7
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 3.5;
  tower.castShadow = true;
  group.add(tower);

  const ringGeo = new THREE.TorusGeometry(1.5, 0.1, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xcbe4ff,
    emissive: 0x96d7ff,
    emissiveIntensity: 0.7
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 6.6;
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);

  const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef7d5,
    emissive: 0xfce08a,
    emissiveIntensity: 0.9
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 7.5;
  head.castShadow = true;
  group.add(head);

  beaconHead = head;
  scene.add(group);
}

// 2) Wind Spire – slim tower with spinning blades
function makeWindSpire() {
  const group = new THREE.Group();
  const x = -24;
  const z = -6;
  group.position.set(x, 0, z);

  const mastGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 10);
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x4f5a73,
    roughness: 0.7
  });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = 2.7;
  mast.castShadow = true;
  group.add(mast);

  const hubGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xe7edf7,
    roughness: 0.4
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.y = 5.0;
  group.add(hub);

  const bladesGroup = new THREE.Group();
  bladesGroup.position.set(0, 5.0, 0.1);

  const bladeGeo = new THREE.BoxGeometry(0.2, 2.2, 0.1);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4
  });

  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 1.1;
    blade.rotation.z = (Math.PI / 2) * i;
    blade.castShadow = true;
    bladesGroup.add(blade);
  }

  group.add(bladesGroup);
  windSpireBlades = bladesGroup;
  scene.add(group);
}

// 3) Crystal Garden – glowing crystals on second island
function makeCrystal(x, z) {
  const geo = new THREE.ConeGeometry(0.4, 1.8, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9fd4ff,
    emissive: 0x77c5ff,
    emissiveIntensity: 0.8,
    roughness: 0.4,
    metalness: 0.3
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.position.set(x, 1, z);
  scene.add(m);
  crystalMeshes.push(m);
}

function makeCrystalGarden() {
  const cx = 70;
  const cz = 0;
  const radius = 5;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    makeCrystal(x, z);
  }
  makeCrystal(cx, cz);
}

// === input ===

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  switch (e.key.toLowerCase()) {
    case "e":
      handleHarvest();
      break;
    case "b":
      handleBuyWoodProcessor();
      break;
    case "c":
      handleBuyStoneCutter();
      break;
    case "n":
      handleBuyConstructionStation();
      break;
    case "f":
      handleUseWoodProcessor();
      break;
    case "r":
      handleUseStoneCutter();
      break;
    case "g":
      handleBuildHouse();
      break;
    case "j":
      handleBuildBridge();
      break;
    // new upgrades
    case "h":
      handleBuildBeaconTower();
      break;
    case "k":
      handleBuildWindSpire();
      break;
    case "l":
      handleBuildCrystalGarden();
      break;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// mouse wheel zoom
window.addEventListener("wheel", (e) => {
  const dir = Math.sign(e.deltaY);
  cameraDistance = THREE.MathUtils.clamp(
    cameraDistance + dir * 3,
    minCameraDistance,
    maxCameraDistance
  );
});

// === actions ===

function isNearStructure(structType, maxDistOverride) {
  const s = structures.find((s) => s.type === structType);
  if (!s) return false;
  const pos = new THREE.Vector3().setFromMatrixPosition(s.mesh.matrixWorld);
  const maxDist = maxDistOverride ?? s.radius + 1.5;
  return dist2D(pos, playerPos) <= maxDist;
}

function handleHarvest() {
  const radius = 4;
  let closest = null;
  let closestDist = Infinity;
  for (const res of resources) {
    if (!res.alive) continue;
    const resPos = new THREE.Vector3().setFromMatrixPosition(res.mesh.matrixWorld);
    const d = dist2D(resPos, playerPos);
    if (d < radius && d < closestDist) {
      closest = res;
      closestDist = d;
    }
  }
  if (!closest) return;

  closest.alive = false;
  // respawn faster if crystal garden
  const baseRespawn = closest.type === "tree" ? 8000 : 10000;
  const modifier = state.hasCrystalGarden ? 0.55 : 1;
  closest.respawnTime = performance.now() + baseRespawn * modifier;
  closest.mesh.visible = false;

  let moneyBonus = state.hasBeaconTower ? 1.5 : 1;
  if (closest.type === "tree") {
    const gainedLogs = 1 + Math.floor(Math.random() * 2);
    state.logs += gainedLogs;
    state.money += Math.round(5 * moneyBonus);
  } else if (closest.type === "rock") {
    const gainedStone = 1 + Math.floor(Math.random() * 2);
    state.stone += gainedStone;
    state.money += Math.round(8 * moneyBonus);
  }

  // tiny screen shake
  cameraShake = 0.35;

  if (objectiveStep === 0 && state.logs >= 3 && state.stone >= 3) {
    objectiveStep = 1;
    updateObjective();
  }

  updateHUD();
}

function handleBuyWoodProcessor() {
  if (state.woodProcessor) return;
  if (state.money < 50) return;
  state.money -= 50;
  makeWoodProcessor();
  if (objectiveStep < 2) {
    objectiveStep = 2;
    updateObjective();
  }
  updateHUD();
}

function handleBuyStoneCutter() {
  if (state.stoneCutter) return;
  if (state.money < 60 || state.stone < 4) return;
  state.money -= 60;
  state.stone -= 4;
  makeStoneCutter();
  if (objectiveStep < 3) {
    objectiveStep = 3;
    updateObjective();
  }
  updateHUD();
}

function handleBuyConstructionStation() {
  if (state.constructionStation) return;
  if (state.money < 80 || state.planks < 4 || state.bricks < 3) return;
  state.money -= 80;
  state.planks -= 4;
  state.bricks -= 3;
  makeConstructionStation();
  if (objectiveStep < 4) {
    objectiveStep = 4;
    updateObjective();
  }
  updateHUD();
}

function handleUseWoodProcessor() {
  if (!state.woodProcessor) return;
  if (!isNearStructure("woodProcessor", 5)) return;
  if (state.logs < 1) return;

  const amount = Math.min(3, state.logs);
  state.logs -= amount;
  state.planks += amount;
  updateHUD();
}

function handleUseStoneCutter() {
  if (!state.stoneCutter) return;
  if (!isNearStructure("stoneCutter", 5)) return;
  if (state.stone < 1) return;

  const amount = Math.min(3, state.stone);
  state.stone -= amount;
  state.bricks += amount;
  updateHUD();
}

function handleBuildHouse() {
  if (!state.constructionStation) return;
  if (!isNearStructure("constructionStation", 6)) return;
  if (state.planks < 2 || state.bricks < 1 || state.money < 15) return;

  state.planks -= 2;
  state.bricks -= 1;
  state.money -= 15;
  state.builds += 1;
  state.population += 2;
  state.survivorsRescued += 2;
  state.food += 2;
  state.morale = Math.min(100, state.morale + 5);

  makeHouse(state.builds - 1);
  syncVillagePopulation();
  // small bonus
  state.money += 5;

  if (objectiveStep < 6 && state.builds >= 3) {
    objectiveStep = 6; // next: island upgrades
    updateObjective();
  }

  updateHUD();
}

function handleBuildBridge() {
  if (!state.constructionStation) return;
  if (!isNearStructure("constructionStation", 6)) return;
  if (state.bridgeBuilt) return;
  if (state.planks < 40 || state.bricks < 20 || state.money < 100) return;

  state.planks -= 40;
  state.bricks -= 20;
  state.money -= 100;
  state.bridgeBuilt = true;

  makeBridge();
  if (objectiveStep < 5) {
    objectiveStep = 5; // now build houses
    updateObjective();
  }
  updateHUD();
}

// new island upgrade actions
function handleBuildBeaconTower() {
  if (state.hasBeaconTower) return;
  if (!state.constructionStation) return;
  if (!isNearStructure("constructionStation", 6)) return;
  if (state.planks < 20 || state.bricks < 15 || state.money < 70) return;

  state.planks -= 20;
  state.bricks -= 15;
  state.money -= 70;

  makeBeaconTower();
  state.hasBeaconTower = true;
  checkAllUpgradesObjective();
  updateHUD();
}

function handleBuildWindSpire() {
  if (state.hasWindSpire) return;
  if (!state.constructionStation) return;
  if (!isNearStructure("constructionStation", 6)) return;
  if (state.planks < 15 || state.bricks < 10 || state.money < 40) return;

  state.planks -= 15;
  state.bricks -= 10;
  state.money -= 40;

  makeWindSpire();
  state.hasWindSpire = true;
  checkAllUpgradesObjective();
  updateHUD();
}

function handleBuildCrystalGarden() {
  if (state.hasCrystalGarden) return;
  if (!state.constructionStation) return;
  if (!isNearStructure("constructionStation", 6)) return;
  if (state.planks < 12 || state.bricks < 12 || state.money < 50) return;

  state.planks -= 12;
  state.bricks -= 12;
  state.money -= 50;

  makeCrystalGarden();
  state.hasCrystalGarden = true;
  checkAllUpgradesObjective();
  updateHUD();
}

function checkAllUpgradesObjective() {
  if (
    state.hasBeaconTower &&
    state.hasWindSpire &&
    state.hasCrystalGarden &&
    objectiveStep < 7
  ) {
    objectiveStep = 7;
    updateObjective();
  }
}

// === movement + camera + day/night + passive income ===

const clock = new THREE.Clock();
let elapsedTime = 0;
let timeOfDay = 0; // 0..1
const dayLengthSeconds = 120; // full cycle
let moneyCarry = 0;
let colonyTickTimer = 0;
let moraleTickTimer = 0;

function runColonyTick() {
  if (state.population <= 0) return;

  const workerPower = Math.max(1, state.workers);
  const foodGain = workerPower + (state.bridgeBuilt ? 1 : 0) + (state.hasCrystalGarden ? 2 : 0);
  const foodUse = Math.max(1, Math.ceil(state.population * 0.7));
  state.food = Math.max(0, state.food + foodGain - foodUse);

  if (state.woodProcessor && state.logs > 0) {
    const craftedPlanks = Math.min(state.logs, Math.max(1, state.workers));
    state.logs -= craftedPlanks;
    state.planks += craftedPlanks;
  }

  if (state.stoneCutter && state.stone > 0) {
    const craftedBricks = Math.min(state.stone, Math.max(1, Math.ceil(state.workers * 0.5)));
    state.stone -= craftedBricks;
    state.bricks += craftedBricks;
  }

  const moraleFactor = 0.75 + state.morale / 100;
  const beaconBonus = state.hasBeaconTower ? 6 : 0;
  const housingIncome = state.population + state.builds * 2;
  state.money += Math.round(housingIncome * moraleFactor + beaconBonus);

  if (state.food === 0) {
    state.morale = Math.max(18, state.morale - 8);
  } else {
    const moraleGain =
      (state.hasWindSpire ? 3 : 0) +
      (state.hasCrystalGarden ? 2 : 0) +
      (state.hasBeaconTower ? 2 : 0) +
      (state.food > state.population ? 2 : 0);
    state.morale = Math.min(100, state.morale + moraleGain);
  }

  updateHUD();
}

function updateVillagers(delta) {
  for (const villager of villagers) {
    villager.wait -= delta;
    const pos = villager.mesh.position;
    const toTarget = new THREE.Vector3().subVectors(villager.target, pos);
    const dist = Math.hypot(toTarget.x, toTarget.z);

    if (villager.wait <= 0 || dist < 0.5) {
      chooseVillagerTarget(villager);
    } else if (dist > 0.001) {
      pos.x += (toTarget.x / dist) * villager.speed * delta;
      pos.z += (toTarget.z / dist) * villager.speed * delta;
      villager.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
    }

    villager.bob += delta * (villager.role === "worker" ? 7.5 : 5.2);
    pos.y = Math.sin(villager.bob) * 0.05;
  }
}

function update(delta) {
  elapsedTime += delta;

  // movement
  let moveX = 0;
  let moveZ = 0;
  if (keys["w"] || keys["arrowup"]) moveZ -= 1;
  if (keys["s"] || keys["arrowdown"]) moveZ += 1;
  if (keys["a"] || keys["arrowleft"]) moveX -= 1;
  if (keys["d"] || keys["arrowright"]) moveX += 1;

  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }

  let speed = 7;
  if (state.hasWindSpire) speed *= 1.25; // upgrade speed bonus
  if (keys["shift"]) speed *= 1.7;       // sprint

  const nextPos = playerPos.clone();
  nextPos.x += moveX * speed * delta;
  nextPos.z += moveZ * speed * delta;

  let allowed = false;
  if (isOnIsland(nextPos, 1)) allowed = true;

  if (state.bridgeBuilt) {
    if (nextPos.x >= 15 && nextPos.x <= 55 && Math.abs(nextPos.z) <= 2.5) {
      allowed = true;
    }
    if (isOnIsland(nextPos, 2)) allowed = true;
  }

  if (allowed) {
    playerPos.copy(nextPos);
    playerGroup.position.copy(playerPos);

    if (len > 0.01) {
      const angle = Math.atan2(moveX, moveZ);
      playerGroup.rotation.y = angle;
    }
  }

  // respawn resources
  const now = performance.now();
  for (const res of resources) {
    if (!res.alive && now >= res.respawnTime) {
      res.alive = true;
      res.mesh.visible = true;
    }
  }

  // animate structures
  if (woodRing) woodRing.rotation.y += delta * 3.0;
  if (stoneBlade) stoneBlade.rotation.x += delta * 4.0;
  if (beaconHead) beaconHead.rotation.y += delta * 0.7;
  if (windSpireBlades) windSpireBlades.rotation.z += delta * 4.0;

  // animate crystals pulsing
  for (let i = 0; i < crystalMeshes.length; i++) {
    const m = crystalMeshes[i];
    const s = 1 + 0.15 * Math.sin(elapsedTime * 2 + i);
    m.scale.setScalar(s);
    const mat = m.material;
    mat.emissiveIntensity = 0.6 + 0.3 * Math.sin(elapsedTime * 2.3 + i);
  }

  updateVillagers(delta);

  colonyTickTimer += delta;
  if (colonyTickTimer >= 4) {
    colonyTickTimer -= 4;
    runColonyTick();
  }

  moraleTickTimer += delta;
  if (moraleTickTimer >= 1.5) {
    moraleTickTimer = 0;
    if (state.population > 0 && state.food < Math.max(2, Math.ceil(state.population * 0.35))) {
      state.morale = Math.max(15, state.morale - 1);
      updateHUD();
    }
  }

  // day/night cycle
  timeOfDay = (timeOfDay + delta / dayLengthSeconds) % 1;
  const dayFactor = 0.5 - 0.5 * Math.cos(timeOfDay * Math.PI * 2); // 0 -> 1 -> 0
  scene.background.copy(colorNight).lerp(colorDay, dayFactor);
  hemiLight.intensity = 0.4 + dayFactor * 0.9;
  dirLight.intensity = 0.3 + dayFactor * 0.9;

  // small water shimmer
  waterMat.color.offsetHSL(0, 0, (Math.sin(elapsedTime * 0.2) * 0.002));

  // camera shake decay
  cameraShake = Math.max(0, cameraShake - delta * 1.5);

  updateCamera();
}

function updateCamera() {
  const offsetX = Math.sin(cameraAzimuth) * cameraDistance;
  const offsetZ = Math.cos(cameraAzimuth) * cameraDistance;

  cameraTargetPos.set(
    playerPos.x - offsetX,
    playerPos.y + cameraHeight,
    playerPos.z - offsetZ
  );

  // add little shake
  const shakeX = (Math.random() - 0.5) * cameraShake;
  const shakeY = (Math.random() - 0.5) * cameraShake * 0.5;
  const shakeZ = (Math.random() - 0.5) * cameraShake;

  cameraTargetPos.x += shakeX;
  cameraTargetPos.y += shakeY;
  cameraTargetPos.z += shakeZ;

  camera.position.lerp(cameraTargetPos, 0.08);

  cameraLookTarget.set(
    playerPos.x + Math.sin(playerGroup.rotation.y) * cameraLookAhead,
    playerPos.y + 1.6,
    playerPos.z + Math.cos(playerGroup.rotation.y) * cameraLookAhead
  );
  camera.lookAt(cameraLookTarget);
}

function render() {
  resizeRendererToDisplaySize();
  renderer.render(scene, camera);
}

function loop() {
  const delta = clock.getDelta();
  update(delta);
  render();
  requestAnimationFrame(loop);
}

updateHUD();
loop();
