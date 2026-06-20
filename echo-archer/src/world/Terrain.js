import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

const WATCHTOWER = {
  x: -24,
  z: 11,
  plateauRadius: 4.8,
  height: 2.15,
};

const HIDDEN_POND = {
  x: 23,
  z: 20,
  radius: 5.4,
  depth: 0.68,
};

const ANCIENT_RUINS = {
  x: 27,
  z: -29,
  radius: 6.2,
  height: 0.82,
};

const HUNTERS_CABIN = {
  x: -33,
  z: -18,
  radius: 5.2,
  height: 0.42,
};

const CLIFF_OVERLOOK = {
  x: -8,
  z: 37,
  radius: 6.4,
  height: 3.05,
};

const WHISPER_CAVE = {
  x: -40,
  z: 25,
  radius: 5.8,
  depth: 0.38,
};

const RIVER_CROSSING = {
  x: 52,
  z: 2,
  radius: 7.5,
};

const MOUNTAIN_PATH = {
  x: -5,
  z: 68,
  radius: 10,
  height: 4.1,
};

const FORGOTTEN_GROVE = {
  x: 52,
  z: 54,
  radius: 10.5,
  height: 0.5,
};

const RED_CANYON = {
  x: 0,
  z: 124,
  radius: 50,
  height: 1.25,
};

const ASHEN_HIGHLANDS = {
  x: -128,
  z: 132,
  radius: 52,
  height: 2.15,
};

const STARFALL_VALE = {
  x: 142,
  z: 42,
  radius: 38,
  height: 2.65,
};

const FRONTIER_PLAINS = {
  x: 136,
  z: -145,
  radius: 46,
  height: 0.72,
};

const LOST_KINGDOM = {
  x: 82,
  z: -150,
  radius: 39,
  height: 1.38,
};

const CELESTIAL_EXPANSE = {
  x: 78,
  z: 154,
  radius: 38,
  height: 2.85,
};

const SHATTERED_COAST = {
  x: -148,
  z: -146,
  radius: 34,
  height: 2.45,
};

const VEILED_WILDS = {
  x: -42,
  z: -148,
  radius: 38,
  height: 1.55,
};

export class Terrain {
  constructor(scene) {
    this.size = SETTINGS.world.size;
    this.segments = SETTINGS.world.terrainSegments;
    this.mesh = this.createMesh();
    scene.add(this.mesh);
  }

  createMesh() {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position;
    const colors = [];
    const lowColor = new THREE.Color(SETTINGS.world.groundLowColor);
    const midColor = new THREE.Color(SETTINGS.world.groundMidColor);
    const highColor = new THREE.Color(SETTINGS.world.groundHighColor);
    const pathColor = new THREE.Color(SETTINGS.world.groundPathColor);

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const z = position.getZ(index);
      const height = this.getHeightAt(x, z);
      const color = this.getGroundColor(x, z, height, lowColor, midColor, highColor, pathColor);
      position.setY(index, height);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.93,
      metalness: 0.02,
      envMapIntensity: 0.35,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
  }

  getHeightAt(x, z) {
    const broadRise = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 0.78;
    const smallRoll = Math.sin((x + z) * 0.18) * 0.22;
    const erosionRoll = Math.sin(x * 0.035 + z * 0.052) * Math.cos(z * 0.041 - x * 0.018) * 0.34;
    const softKnolls = Math.sin((x - 16) * 0.025) * Math.sin((z + 9) * 0.03) * 0.28;
    const clearingEase = Math.max(0, 1 - Math.hypot(x, z + 2) / 24);
    const naturalHeight = broadRise + smallRoll + erosionRoll + softKnolls - clearingEase * 0.48;
    return naturalHeight + this.getWorldCohesionRise(x, z) + this.getWatchtowerRise(x, z) + this.getHiddenPondShape(x, z) + this.getAncientRuinsRise(x, z) + this.getHuntersCabinRise(x, z) + this.getCliffOverlookRise(x, z) + this.getWhisperCaveShape(x, z) + this.getRiverCrossingShape(x, z) + this.getMountainPathRise(x, z) + this.getForgottenGroveRise(x, z) + this.getRedCanyonRise(x, z) + this.getAshenHighlandsRise(x, z) + this.getStarfallValeRise(x, z) + this.getFrontierPlainsRise(x, z) + this.getLostKingdomRise(x, z) + this.getCelestialExpanseRise(x, z) + this.getShatteredCoastRise(x, z) + this.getVeiledWildsRise(x, z);
  }

  getWatchtowerRise(x, z) {
    const distanceToPlatform = Math.hypot(x - WATCHTOWER.x, z - WATCHTOWER.z);
    const plateau = THREE.MathUtils.smoothstep(WATCHTOWER.plateauRadius - distanceToPlatform, 0, WATCHTOWER.plateauRadius);
    const rampStartX = -14.5;
    const rampStartZ = 4.5;
    const rampEndX = WATCHTOWER.x + 1.2;
    const rampEndZ = WATCHTOWER.z - 1.4;
    const rampDistance = this.getDistanceToSegment(x, z, rampStartX, rampStartZ, rampEndX, rampEndZ);
    const alongRamp = this.getSegmentProgress(x, z, rampStartX, rampStartZ, rampEndX, rampEndZ);
    const ramp = THREE.MathUtils.clamp(1 - rampDistance / 2.1, 0, 1) * alongRamp;
    return Math.max(plateau * WATCHTOWER.height, ramp * WATCHTOWER.height * 0.88);
  }

  getDistanceToSegment(x, z, ax, az, bx, bz) {
    const segmentX = bx - ax;
    const segmentZ = bz - az;
    const lengthSq = segmentX * segmentX + segmentZ * segmentZ;
    const t = lengthSq === 0 ? 0 : THREE.MathUtils.clamp(((x - ax) * segmentX + (z - az) * segmentZ) / lengthSq, 0, 1);
    const pointX = ax + segmentX * t;
    const pointZ = az + segmentZ * t;
    return Math.hypot(x - pointX, z - pointZ);
  }

  getSegmentProgress(x, z, ax, az, bx, bz) {
    const segmentX = bx - ax;
    const segmentZ = bz - az;
    const lengthSq = segmentX * segmentX + segmentZ * segmentZ;
    return lengthSq === 0 ? 0 : THREE.MathUtils.clamp(((x - ax) * segmentX + (z - az) * segmentZ) / lengthSq, 0, 1);
  }

  getHiddenPondShape(x, z) {
    const distance = Math.hypot(x - HIDDEN_POND.x, z - HIDDEN_POND.z);
    const basin = THREE.MathUtils.clamp(1 - distance / HIDDEN_POND.radius, 0, 1);
    const rim = THREE.MathUtils.clamp(1 - Math.abs(distance - HIDDEN_POND.radius) / 2.4, 0, 1);
    const approach = this.getDistanceToSegment(x, z, 8, 6, HIDDEN_POND.x - 2.8, HIDDEN_POND.z - 3.1) < 2.1 ? 0.18 : 0;
    return -basin * HIDDEN_POND.depth + rim * 0.28 - approach;
  }

  getAncientRuinsRise(x, z) {
    const distance = Math.hypot(x - ANCIENT_RUINS.x, z - ANCIENT_RUINS.z);
    const centralPlatform = THREE.MathUtils.clamp(1 - distance / ANCIENT_RUINS.radius, 0, 1);
    const outerRing = THREE.MathUtils.clamp(1 - Math.abs(distance - ANCIENT_RUINS.radius * 0.82) / 2.8, 0, 1);
    const approach = this.getDistanceToSegment(x, z, 10, -13, ANCIENT_RUINS.x - 3.8, ANCIENT_RUINS.z + 3.2) < 2.4 ? 0.22 : 0;
    return centralPlatform * ANCIENT_RUINS.height + outerRing * 0.2 - approach;
  }

  getHuntersCabinRise(x, z) {
    const distance = Math.hypot(x - HUNTERS_CABIN.x, z - HUNTERS_CABIN.z);
    const clearing = THREE.MathUtils.clamp(1 - distance / HUNTERS_CABIN.radius, 0, 1);
    const approach = this.getDistanceToSegment(x, z, -20, -9, HUNTERS_CABIN.x + 3.2, HUNTERS_CABIN.z + 2.2) < 2.35 ? 0.16 : 0;
    return clearing * HUNTERS_CABIN.height - approach;
  }

  getCliffOverlookRise(x, z) {
    const distance = Math.hypot(x - CLIFF_OVERLOOK.x, z - CLIFF_OVERLOOK.z);
    const plateau = THREE.MathUtils.clamp(1 - distance / CLIFF_OVERLOOK.radius, 0, 1);
    const rim = THREE.MathUtils.clamp(1 - Math.abs(distance - CLIFF_OVERLOOK.radius * 0.82) / 2.2, 0, 1);
    const approachDistance = this.getDistanceToSegment(x, z, -5.5, 13, CLIFF_OVERLOOK.x + 1.4, CLIFF_OVERLOOK.z - 4.1);
    const approachProgress = this.getSegmentProgress(x, z, -5.5, 13, CLIFF_OVERLOOK.x + 1.4, CLIFF_OVERLOOK.z - 4.1);
    const ramp = THREE.MathUtils.clamp(1 - approachDistance / 2.5, 0, 1) * approachProgress;
    const cliffFace = z > CLIFF_OVERLOOK.z + 2 ? THREE.MathUtils.clamp((z - CLIFF_OVERLOOK.z - 2) / 4.5, 0, 1) : 0;
    return Math.max(plateau * CLIFF_OVERLOOK.height, ramp * CLIFF_OVERLOOK.height * 0.86) + rim * 0.25 - cliffFace * 0.62;
  }

  getWhisperCaveShape(x, z) {
    const distance = Math.hypot(x - WHISPER_CAVE.x, z - WHISPER_CAVE.z);
    const mouth = THREE.MathUtils.clamp(1 - distance / WHISPER_CAVE.radius, 0, 1);
    const approach = this.getDistanceToSegment(x, z, -23, 12, WHISPER_CAVE.x + 1.8, WHISPER_CAVE.z - 1.2) < 2.15 ? 0.18 : 0;
    const innerFloor = x > WHISPER_CAVE.x + 2 && x < WHISPER_CAVE.x + 16 && Math.abs(z - WHISPER_CAVE.z) < 4.4 ? 0.16 : 0;
    return -mouth * WHISPER_CAVE.depth - approach - innerFloor;
  }

  getRiverCrossingShape(x, z) {
    const riverDistance = Math.abs(z - (Math.sin((x - 30) * 0.09) * 3.2 + 1.6));
    const channel = THREE.MathUtils.clamp(1 - riverDistance / 3.4, 0, 1);
    const bridgeFlat = Math.hypot(x - RIVER_CROSSING.x, z - RIVER_CROSSING.z) < RIVER_CROSSING.radius ? 0.22 : 0;
    return -channel * 0.56 + bridgeFlat;
  }

  getMountainPathRise(x, z) {
    const distance = Math.hypot(x - MOUNTAIN_PATH.x, z - MOUNTAIN_PATH.z);
    const plateau = THREE.MathUtils.clamp(1 - distance / MOUNTAIN_PATH.radius, 0, 1);
    const approachDistance = this.getDistanceToSegment(x, z, -4, 37, MOUNTAIN_PATH.x + 1.5, MOUNTAIN_PATH.z - 5);
    const approachProgress = this.getSegmentProgress(x, z, -4, 37, MOUNTAIN_PATH.x + 1.5, MOUNTAIN_PATH.z - 5);
    const pathRamp = THREE.MathUtils.clamp(1 - approachDistance / 3.2, 0, 1) * approachProgress;
    const cliffShoulder = Math.max(0, z - 54) * 0.035;
    return Math.max(plateau * MOUNTAIN_PATH.height, pathRamp * MOUNTAIN_PATH.height * 0.82) + cliffShoulder;
  }

  getForgottenGroveRise(x, z) {
    const distance = Math.hypot(x - FORGOTTEN_GROVE.x, z - FORGOTTEN_GROVE.z);
    const grove = THREE.MathUtils.clamp(1 - distance / FORGOTTEN_GROVE.radius, 0, 1);
    const hiddenRoute = this.getDistanceToSegment(x, z, RIVER_CROSSING.x + 3, RIVER_CROSSING.z + 5, FORGOTTEN_GROVE.x - 4, FORGOTTEN_GROVE.z - 6) < 2.1 ? 0.18 : 0;
    return grove * FORGOTTEN_GROVE.height - hiddenRoute;
  }

  getRedCanyonRise(x, z) {
    const distance = Math.hypot(x - RED_CANYON.x, z - RED_CANYON.z);
    const basin = THREE.MathUtils.clamp(1 - distance / RED_CANYON.radius, 0, 1);
    const shelf = THREE.MathUtils.clamp(1 - Math.abs(distance - RED_CANYON.radius * 0.52) / 12, 0, 1);
    const route = this.getDistanceToSegment(x, z, MOUNTAIN_PATH.x, MOUNTAIN_PATH.z + 7, RED_CANYON.x - 5, RED_CANYON.z - 34) < 3.4 ? 0.24 : 0;
    const chasm = Math.abs(x) < 4.8 && z > RED_CANYON.z + 12 && z < RED_CANYON.z + 31 ? 0.76 : 0;
    return basin * RED_CANYON.height + shelf * 0.62 - route - chasm;
  }

  getAshenHighlandsRise(x, z) {
    const distance = Math.hypot(x - ASHEN_HIGHLANDS.x, z - ASHEN_HIGHLANDS.z);
    const highland = THREE.MathUtils.clamp(1 - distance / ASHEN_HIGHLANDS.radius, 0, 1);
    const rim = THREE.MathUtils.clamp(1 - Math.abs(distance - ASHEN_HIGHLANDS.radius * 0.62) / 10, 0, 1);
    const route = this.getDistanceToSegment(x, z, -28, 148, ASHEN_HIGHLANDS.x + 7, ASHEN_HIGHLANDS.z) < 3.4 ? 0.36 : 0;
    const lavaChannels = Math.max(
      this.getDistanceToSegment(x, z, -141, 118, -130, 138) < 3 ? 0.5 : 0,
      this.getDistanceToSegment(x, z, -155, 125, -140, 145) < 2.8 ? 0.42 : 0
    );
    return highland * ASHEN_HIGHLANDS.height + rim * 0.8 - route - lavaChannels;
  }

  getStarfallValeRise(x, z) {
    const distance = Math.hypot(x - STARFALL_VALE.x, z - STARFALL_VALE.z);
    const valley = THREE.MathUtils.clamp(1 - distance / STARFALL_VALE.radius, 0, 1);
    const ridge = THREE.MathUtils.clamp(1 - Math.abs(distance - STARFALL_VALE.radius * 0.72) / 8, 0, 1);
    const basin = THREE.MathUtils.clamp(1 - Math.hypot(x - 144, z - 46) / 13, 0, 1);
    const observatory = THREE.MathUtils.clamp(1 - Math.hypot(x - 132, z - 62) / 9, 0, 1);
    const moonspire = THREE.MathUtils.clamp(1 - Math.hypot(x - 162, z - 58) / 7.5, 0, 1);
    const route = Math.max(
      this.getDistanceToSegment(x, z, FORGOTTEN_GROVE.x + 8, FORGOTTEN_GROVE.z - 4, STARFALL_VALE.x - 23, STARFALL_VALE.z + 1) < 3.2 ? 0.35 : 0,
      this.getDistanceToSegment(x, z, 122, 47, 151, 37) < 2.5 ? 0.2 : 0
    );
    return valley * STARFALL_VALE.height + ridge * 1.1 + observatory * 1.35 + moonspire * 2.2 - basin * 0.8 - route;
  }

  getFrontierPlainsRise(x, z) {
    const distance = Math.hypot(x - FRONTIER_PLAINS.x, z - FRONTIER_PLAINS.z);
    const plains = THREE.MathUtils.clamp(1 - distance / FRONTIER_PLAINS.radius, 0, 1);
    const hills = Math.sin(x * 0.055 + 1.8) * Math.cos(z * 0.05 - 0.7) * 0.42;
    const road = Math.max(
      this.getDistanceToSegment(x, z, 118, -118, FRONTIER_PLAINS.x - 8, FRONTIER_PLAINS.z + 4) < 3.6 ? 0.22 : 0,
      this.getDistanceToSegment(x, z, FRONTIER_PLAINS.x - 8, FRONTIER_PLAINS.z + 4, FRONTIER_PLAINS.x + 24, FRONTIER_PLAINS.z - 12) < 3.2 ? 0.2 : 0
    );
    const river = Math.abs((z + 148) - Math.sin((x - 118) * 0.08) * 4.5) < 3.2 ? 0.48 : 0;
    const stoneCircle = THREE.MathUtils.clamp(1 - Math.hypot(x - 154, z + 148) / 9, 0, 1);
    return plains * FRONTIER_PLAINS.height + plains * hills + stoneCircle * 0.36 - road - river;
  }

  getLostKingdomRise(x, z) {
    const distance = Math.hypot(x - LOST_KINGDOM.x, z - LOST_KINGDOM.z);
    const buriedPlateau = THREE.MathUtils.clamp(1 - distance / LOST_KINGDOM.radius, 0, 1);
    const plaza = THREE.MathUtils.clamp(1 - Math.hypot(x - 84, z + 149) / 11, 0, 1);
    const archive = THREE.MathUtils.clamp(1 - Math.hypot(x - 58, z + 145) / 9, 0, 1);
    const gate = THREE.MathUtils.clamp(1 - Math.hypot(x - 96, z + 132) / 10, 0, 1);
    const road = Math.max(
      this.getDistanceToSegment(x, z, 118, -118, 96, -132) < 3.1 ? 0.24 : 0,
      this.getDistanceToSegment(x, z, 96, -132, 84, -149) < 2.8 ? 0.22 : 0,
      this.getDistanceToSegment(x, z, 84, -149, 58, -145) < 2.5 ? 0.18 : 0
    );
    const sunkenCourtyard = THREE.MathUtils.clamp(1 - Math.hypot(x - 72, z + 162) / 12, 0, 1);
    return buriedPlateau * LOST_KINGDOM.height + plaza * 0.36 + archive * 0.48 + gate * 0.32 - road - sunkenCourtyard * 0.42;
  }

  getCelestialExpanseRise(x, z) {
    const distance = Math.hypot(x - CELESTIAL_EXPANSE.x, z - CELESTIAL_EXPANSE.z);
    const expanse = THREE.MathUtils.clamp(1 - distance / CELESTIAL_EXPANSE.radius, 0, 1);
    const basin = THREE.MathUtils.clamp(1 - Math.hypot(x - 76, z - 145) / 12, 0, 1);
    const temple = THREE.MathUtils.clamp(1 - Math.hypot(x - 96, z - 172) / 9, 0, 1);
    const floatingReach = THREE.MathUtils.clamp(1 - Math.hypot(x - 61, z - 166) / 10, 0, 1);
    const crystalSea = THREE.MathUtils.clamp(1 - Math.hypot(x - 95, z - 143) / 10, 0, 1);
    const route = Math.max(
      this.getDistanceToSegment(x, z, RED_CANYON.x + 18, RED_CANYON.z + 8, 62, 138) < 3.1 ? 0.28 : 0,
      this.getDistanceToSegment(x, z, 62, 138, CELESTIAL_EXPANSE.x, CELESTIAL_EXPANSE.z) < 2.8 ? 0.24 : 0,
      this.getDistanceToSegment(x, z, CELESTIAL_EXPANSE.x, CELESTIAL_EXPANSE.z, 96, 172) < 2.4 ? 0.18 : 0
    );
    return expanse * CELESTIAL_EXPANSE.height + temple * 1.25 + floatingReach * 1.0 + crystalSea * 0.35 - basin * 0.75 - route;
  }

  getShatteredCoastRise(x, z) {
    const distance = Math.hypot(x - SHATTERED_COAST.x, z - SHATTERED_COAST.z);
    const coast = THREE.MathUtils.clamp(1 - distance / SHATTERED_COAST.radius, 0, 1);
    const cliffBand = THREE.MathUtils.clamp(1 - Math.abs(distance - SHATTERED_COAST.radius * 0.62) / 9, 0, 1);
    const fortress = THREE.MathUtils.clamp(1 - Math.hypot(x + 158, z + 132) / 11, 0, 1);
    const seaGate = THREE.MathUtils.clamp(1 - Math.hypot(x + 136, z + 154) / 10, 0, 1);
    const drowned = THREE.MathUtils.clamp(1 - Math.hypot(x + 168, z + 162) / 13, 0, 1);
    const coves = Math.max(
      THREE.MathUtils.clamp(1 - Math.hypot(x + 144, z + 170) / 12, 0, 1),
      THREE.MathUtils.clamp(1 - Math.hypot(x + 172, z + 143) / 10, 0, 1)
    );
    const route = Math.max(
      this.getDistanceToSegment(x, z, -112, -126, SHATTERED_COAST.x + 22, SHATTERED_COAST.z + 9) < 3.0 ? 0.32 : 0,
      this.getDistanceToSegment(x, z, SHATTERED_COAST.x + 22, SHATTERED_COAST.z + 9, SHATTERED_COAST.x - 16, SHATTERED_COAST.z - 12) < 2.6 ? 0.24 : 0
    );
    const seaDrop = x < SHATTERED_COAST.x - 20 ? THREE.MathUtils.clamp((SHATTERED_COAST.x - 20 - x) / 16, 0, 1) : 0;
    return coast * SHATTERED_COAST.height + cliffBand * 1.35 + fortress * 0.85 + seaGate * 0.52 + drowned * 0.38 - coves * 1.15 - route - seaDrop * 1.45;
  }

  getVeiledWildsRise(x, z) {
    const distance = Math.hypot(x - VEILED_WILDS.x, z - VEILED_WILDS.z);
    const wilds = THREE.MathUtils.clamp(1 - distance / VEILED_WILDS.radius, 0, 1);
    const valley = THREE.MathUtils.clamp(1 - Math.hypot(x + 18, z + 142) / 15, 0, 1);
    const worldroot = THREE.MathUtils.clamp(1 - Math.hypot(x + 52, z + 160) / 13, 0, 1);
    const greenheart = THREE.MathUtils.clamp(1 - Math.hypot(x + 62, z + 130) / 12, 0, 1);
    const arch = THREE.MathUtils.clamp(1 - Math.hypot(x + 30, z + 169) / 11, 0, 1);
    const forgottenCircle = THREE.MathUtils.clamp(1 - Math.hypot(x + 46, z + 121) / 12, 0, 1);
    const hiddenLake = THREE.MathUtils.clamp(1 - Math.hypot(x + 18, z + 142) / 10, 0, 1);
    const oldRoad = Math.max(
      this.getDistanceToSegment(x, z, -48, -112, -45, -132) < 2.6 ? 0.22 : 0,
      this.getDistanceToSegment(x, z, -45, -132, -58, -156) < 2.4 ? 0.24 : 0,
      this.getDistanceToSegment(x, z, -45, -132, -22, -144) < 2.2 ? 0.2 : 0
    );
    return wilds * VEILED_WILDS.height
      + Math.sin((x + z) * 0.09) * wilds * 0.24
      + worldroot * 0.85
      + greenheart * 0.42
      + arch * 0.5
      + forgottenCircle * 0.38
      - valley * 0.6
      - hiddenLake * 0.78
      - oldRoad;
  }

  getWorldCohesionRise(x, z) {
    const trailMask = this.getRouteMask(x, z);
    const ridge = Math.sin((x - z) * 0.11) * 0.13 + Math.sin(x * 0.17) * 0.06;
    const shoulder = Math.sin((x + z) * 0.045) * Math.sin(z * 0.033) * 0.16;
    return ridge + shoulder * (1 - trailMask * 0.65) - trailMask * 0.14;
  }

  getRouteMask(x, z) {
    const routes = [
      [-15, -7, 0, -16, 2.25],
      [-13, -3, -22.8, 9.8, 2.15],
      [-7, 4, 20.2, 16.9, 2.3],
      [6, -10, 23.2, -25.8, 2.3],
      [20.2, 16.9, 25, -24.6, 2.05],
      [-22.8, 9.8, -7, 4, 2.1],
      [-20, -9, HUNTERS_CABIN.x + 3.2, HUNTERS_CABIN.z + 2.2, 2.15],
      [-5.5, 13, CLIFF_OVERLOOK.x + 1.4, CLIFF_OVERLOOK.z - 4.1, 2.2],
      [-23, 12, WHISPER_CAVE.x + 1.8, WHISPER_CAVE.z - 1.2, 2.1],
      [26, 13, RIVER_CROSSING.x - 6, RIVER_CROSSING.z + 2, 2.35],
      [RIVER_CROSSING.x + 4, RIVER_CROSSING.z + 4, FORGOTTEN_GROVE.x - 3, FORGOTTEN_GROVE.z - 5, 2.15],
      [-5.5, 13, MOUNTAIN_PATH.x + 1.5, MOUNTAIN_PATH.z - 5, 2.45],
      [MOUNTAIN_PATH.x, MOUNTAIN_PATH.z - 2, FORGOTTEN_GROVE.x - 8, FORGOTTEN_GROVE.z + 2, 2.1],
      [MOUNTAIN_PATH.x, MOUNTAIN_PATH.z + 7, RED_CANYON.x - 5, RED_CANYON.z - 34, 2.9],
      [RED_CANYON.x - 5, RED_CANYON.z - 34, RED_CANYON.x - 20, RED_CANYON.z - 10, 2.4],
      [RED_CANYON.x - 5, RED_CANYON.z - 34, RED_CANYON.x + 18, RED_CANYON.z + 8, 2.35],
      [RED_CANYON.x + 18, RED_CANYON.z + 8, RED_CANYON.x, RED_CANYON.z + 24, 2.2],
      [-28, 148, -70, 146, 2.7],
      [-70, 146, ASHEN_HIGHLANDS.x + 7, ASHEN_HIGHLANDS.z, 2.8],
      [ASHEN_HIGHLANDS.x + 7, ASHEN_HIGHLANDS.z, -146, 150, 2.3],
      [ASHEN_HIGHLANDS.x + 7, ASHEN_HIGHLANDS.z, -114, 126, 2.3],
      [FORGOTTEN_GROVE.x + 8, FORGOTTEN_GROVE.z - 4, STARFALL_VALE.x - 23, STARFALL_VALE.z + 1, 3.0],
      [STARFALL_VALE.x - 23, STARFALL_VALE.z + 1, STARFALL_VALE.x + 9, STARFALL_VALE.z - 5, 2.35],
      [STARFALL_VALE.x + 5, STARFALL_VALE.z, STARFALL_VALE.x + 20, STARFALL_VALE.z + 14, 2.2],
      [118, -118, FRONTIER_PLAINS.x - 8, FRONTIER_PLAINS.z + 4, 3.1],
      [FRONTIER_PLAINS.x - 8, FRONTIER_PLAINS.z + 4, FRONTIER_PLAINS.x + 24, FRONTIER_PLAINS.z - 12, 2.8],
      [FRONTIER_PLAINS.x - 4, FRONTIER_PLAINS.z + 10, FRONTIER_PLAINS.x + 18, FRONTIER_PLAINS.z + 22, 2.25],
      [118, -118, 96, -132, 2.8],
      [96, -132, 84, -149, 2.6],
      [84, -149, 58, -145, 2.35],
      [84, -149, 68, -166, 2.25],
      [RED_CANYON.x + 18, RED_CANYON.z + 8, 62, 138, 2.8],
      [62, 138, CELESTIAL_EXPANSE.x, CELESTIAL_EXPANSE.z, 2.7],
      [CELESTIAL_EXPANSE.x, CELESTIAL_EXPANSE.z, 96, 172, 2.25],
      [CELESTIAL_EXPANSE.x, CELESTIAL_EXPANSE.z, 58, 166, 2.25],
      [-112, -126, SHATTERED_COAST.x + 22, SHATTERED_COAST.z + 9, 2.8],
      [SHATTERED_COAST.x + 22, SHATTERED_COAST.z + 9, SHATTERED_COAST.x - 16, SHATTERED_COAST.z - 12, 2.4],
      [-48, -112, VEILED_WILDS.x - 3, VEILED_WILDS.z + 16, 2.5],
      [VEILED_WILDS.x - 3, VEILED_WILDS.z + 16, VEILED_WILDS.x - 10, VEILED_WILDS.z - 12, 2.15],
      [VEILED_WILDS.x - 3, VEILED_WILDS.z + 16, VEILED_WILDS.x + 24, VEILED_WILDS.z + 6, 1.9],
    ];

    return routes.reduce((mask, [ax, az, bx, bz, width]) => {
      const distance = this.getDistanceToSegment(x, z, ax, az, bx, bz);
      return Math.max(mask, THREE.MathUtils.smoothstep(width - distance, 0, width));
    }, 0);
  }

  getGroundColor(x, z, height, lowColor, midColor, highColor, pathColor) {
    const color = lowColor.clone().lerp(midColor, THREE.MathUtils.clamp((height + 1.8) / 3.8, 0, 1));
    color.lerp(highColor, THREE.MathUtils.clamp((height - 0.85) / 2.2, 0, 0.45));

    const mainPath = Math.abs(z - (Math.sin((x + 24) * 0.16) * 2.1 - 6.4));
    const targetLane = Math.abs(x) < 4.2 && z < 4 && z > -24 ? 1 : 0;
    const campPath = Math.abs((z + 9) - (x + 18) * 0.22) < 2.5 && x < -7 && x > -24 ? 1 : 0;
    const watchtowerPath = this.getDistanceToSegment(x, z, -14.5, 4.5, WATCHTOWER.x + 1.2, WATCHTOWER.z - 1.4) < 2.2 ? 0.74 : 0;
    const pondPath = this.getDistanceToSegment(x, z, 8, 6, HIDDEN_POND.x - 2.8, HIDDEN_POND.z - 3.1) < 2.25 ? 0.7 : 0;
    const pondShore = Math.abs(Math.hypot(x - HIDDEN_POND.x, z - HIDDEN_POND.z) - HIDDEN_POND.radius) < 1.4 ? 0.46 : 0;
    const ruinsPath = this.getDistanceToSegment(x, z, 10, -13, ANCIENT_RUINS.x - 3.8, ANCIENT_RUINS.z + 3.2) < 2.5 ? 0.72 : 0;
    const ruinsFloor = Math.hypot(x - ANCIENT_RUINS.x, z - ANCIENT_RUINS.z) < ANCIENT_RUINS.radius ? 0.52 : 0;
    const cabinYard = Math.hypot(x - HUNTERS_CABIN.x, z - HUNTERS_CABIN.z) < HUNTERS_CABIN.radius ? 0.52 : 0;
    const cabinPath = this.getDistanceToSegment(x, z, -20, -9, HUNTERS_CABIN.x + 3.2, HUNTERS_CABIN.z + 2.2) < 2.3 ? 0.7 : 0;
    const cliffPath = this.getDistanceToSegment(x, z, -5.5, 13, CLIFF_OVERLOOK.x + 1.4, CLIFF_OVERLOOK.z - 4.1) < 2.4 ? 0.7 : 0;
    const cliffShelf = Math.hypot(x - CLIFF_OVERLOOK.x, z - CLIFF_OVERLOOK.z) < CLIFF_OVERLOOK.radius ? 0.5 : 0;
    const cavePath = this.getDistanceToSegment(x, z, -23, 12, WHISPER_CAVE.x + 1.8, WHISPER_CAVE.z - 1.2) < 2.25 ? 0.72 : 0;
    const caveMouth = Math.hypot(x - WHISPER_CAVE.x, z - WHISPER_CAVE.z) < WHISPER_CAVE.radius ? 0.58 : 0;
    const riverBank = Math.abs(z - (Math.sin((x - 30) * 0.09) * 3.2 + 1.6)) < 3.7 ? 0.38 : 0;
    const bridgePath = Math.hypot(x - RIVER_CROSSING.x, z - RIVER_CROSSING.z) < RIVER_CROSSING.radius ? 0.74 : 0;
    const mountainShelf = Math.hypot(x - MOUNTAIN_PATH.x, z - MOUNTAIN_PATH.z) < MOUNTAIN_PATH.radius ? 0.54 : 0;
    const groveFloor = Math.hypot(x - FORGOTTEN_GROVE.x, z - FORGOTTEN_GROVE.z) < FORGOTTEN_GROVE.radius ? 0.48 : 0;
    const canyonDistance = Math.hypot(x - RED_CANYON.x, z - RED_CANYON.z);
    const canyonFloor = THREE.MathUtils.clamp(1 - canyonDistance / RED_CANYON.radius, 0, 1);
    const canyonRoute = z > RED_CANYON.z - 45 ? this.getRouteMask(x, z) * 0.82 : 0;
    const ashenDistance = Math.hypot(x - ASHEN_HIGHLANDS.x, z - ASHEN_HIGHLANDS.z);
    const ashenFloor = THREE.MathUtils.clamp(1 - ashenDistance / ASHEN_HIGHLANDS.radius, 0, 1);
    const ashenRoute = ashenDistance < ASHEN_HIGHLANDS.radius + 14 ? this.getRouteMask(x, z) * 0.9 : 0;
    const shatteredDistance = Math.hypot(x - SHATTERED_COAST.x, z - SHATTERED_COAST.z);
    const shatteredFloor = THREE.MathUtils.clamp(1 - shatteredDistance / SHATTERED_COAST.radius, 0, 1);
    const shatteredRoute = shatteredDistance < SHATTERED_COAST.radius + 12 ? this.getRouteMask(x, z) * 0.86 : 0;
    const veiledDistance = Math.hypot(x - VEILED_WILDS.x, z - VEILED_WILDS.z);
    const veiledFloor = THREE.MathUtils.clamp(1 - veiledDistance / VEILED_WILDS.radius, 0, 1);
    const veiledRoute = veiledDistance < VEILED_WILDS.radius + 10 ? this.getRouteMask(x, z) * 0.72 : 0;
    const worldRoutes = this.getRouteMask(x, z) * 0.62;
    const pathMask = Math.max(
      THREE.MathUtils.clamp(1 - mainPath / 3.6, 0, 1),
      targetLane * 0.72,
      campPath * 0.62,
      watchtowerPath,
      pondPath,
      pondShore,
      ruinsPath,
      ruinsFloor,
      cabinYard,
      cabinPath,
      cliffPath,
      cliffShelf,
      cavePath,
      caveMouth,
      riverBank,
      bridgePath,
      mountainShelf,
      groveFloor,
      canyonRoute,
      ashenRoute,
      shatteredRoute,
      veiledRoute,
      worldRoutes
    );
    const noise = Math.sin(x * 0.41) * Math.sin(z * 0.37) * 0.045;

    const canyonColor = new THREE.Color(0xb7603b);
    color.lerp(canyonColor, canyonFloor * 0.62);
    const ashColor = new THREE.Color(0x5d5551);
    const emberColor = new THREE.Color(0x8d3d2d);
    color.lerp(ashColor, ashenFloor * 0.68);
    color.lerp(emberColor, ashenFloor * 0.22);
    const coastStone = new THREE.Color(0x6f7f84);
    const tideSand = new THREE.Color(0xb89a6d);
    color.lerp(coastStone, shatteredFloor * 0.56);
    color.lerp(tideSand, shatteredFloor * 0.24);
    const veiledGreen = new THREE.Color(0x314f35);
    const veiledMoss = new THREE.Color(0x7f9460);
    color.lerp(veiledGreen, veiledFloor * 0.58);
    color.lerp(veiledMoss, veiledRoute * 0.48);
    color.lerp(pathColor, pathMask * 0.32);
    color.offsetHSL(0.015, noise, noise * 0.7);
    return color;
  }
}
