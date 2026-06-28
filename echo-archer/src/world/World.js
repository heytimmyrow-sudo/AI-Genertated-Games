import { SETTINGS } from "../config/settings.js";
import { getBowVisual } from "../config/gearVisuals.js";
import { Terrain } from "./Terrain.js";

const { THREE } = window;

export class World {
  constructor(scene) {
    this.scene = scene;
    this.size = SETTINGS.world.size;
    this.performanceMode = this.getPerformanceMode();
    this.colliders = [];
    this.collisionVolumes = [];
    this.targets = [];
    this.interactables = [];
    this.legendaryStructures = [];
    this.detailObjects = [];
    this.livingMotionObjects = [];
    this.livingMotionTime = 0;
    this.livingMotionTimer = 0;
    this.detailTimer = 0;
    this.detailWorldPosition = new THREE.Vector3();
    this.optimizationStats = { detailObjects: 0, shadowCastersReduced: 0 };
    this.graphicsQuality = null;
    this.timeOfDay = SETTINGS.world.dayNight.startTime;
    this.dayNightState = { phase: "Morning", nightFactor: 0 };
    this.terrain = new Terrain(scene);
    window.addEventListener("echo-archer:veiled-wilds-hidden-path", (event) => this.revealVeiledHiddenPath(event.detail?.id));
    this.createSharedAssets();
    this.addSky();
    this.addLighting();
    this.addTrainingClearing();
  }

  getPerformanceMode() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("detail") === "full") {
        localStorage.setItem("echo-archer-detail", "full");
        return false;
      }
      if (params.get("detail") === "performance") {
        localStorage.setItem("echo-archer-detail", "performance");
        return true;
      }
      return localStorage.getItem("echo-archer-detail") !== "full";
    } catch {
      return true;
    }
  }

  createSharedAssets() {
    this.materials = {
      stone: new THREE.MeshStandardMaterial({ color: 0x8e876d, roughness: 0.86, metalness: 0.02 }),
      ancientStone: new THREE.MeshStandardMaterial({ color: 0x9a9378, roughness: 0.88, metalness: 0.02 }),
      darkStone: new THREE.MeshStandardMaterial({ color: 0x565c49, roughness: 0.9 }),
      caveStone: new THREE.MeshStandardMaterial({ color: 0x3d4651, roughness: 0.92, metalness: 0.02 }),
      caveFloor: new THREE.MeshStandardMaterial({ color: 0x59606a, roughness: 0.9 }),
      crystalBlue: new THREE.MeshStandardMaterial({ color: 0x7ed7ff, roughness: 0.36, metalness: 0.04, emissive: 0x1c7ccf, emissiveIntensity: 0.72 }),
      crystalViolet: new THREE.MeshStandardMaterial({ color: 0xb99cff, roughness: 0.42, metalness: 0.04, emissive: 0x5d36b8, emissiveIntensity: 0.62 }),
      mossStone: new THREE.MeshStandardMaterial({ color: 0x6f7a56, roughness: 0.94, metalness: 0.01 }),
      agedWood: new THREE.MeshStandardMaterial({ color: 0x7c5433, roughness: 0.86 }),
      warmTrim: new THREE.MeshStandardMaterial({ color: 0xc18a4a, roughness: 0.7, emissive: 0x241000, emissiveIntensity: 0.04 }),
      glyphStone: new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.56, metalness: 0.08, emissive: 0x2f1a00, emissiveIntensity: 0.12 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x6b4729, roughness: 0.88 }),
      barkDark: new THREE.MeshStandardMaterial({ color: 0x3c281d, roughness: 0.9 }),
      pine: new THREE.MeshStandardMaterial({ color: 0x355f42, roughness: 0.82 }),
      pineDark: new THREE.MeshStandardMaterial({ color: 0x223f33, roughness: 0.86 }),
      leafAccent: new THREE.MeshStandardMaterial({ color: 0x6f9b59, roughness: 0.84 }),
      grass: new THREE.MeshStandardMaterial({ color: 0x78924f, roughness: 0.94 }),
      grassLight: new THREE.MeshStandardMaterial({ color: 0xa6b965, roughness: 0.94 }),
      flower: new THREE.MeshStandardMaterial({ color: 0xe8bc66, roughness: 0.72, emissive: 0x1c0f00, emissiveIntensity: 0.06 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x9b6838, roughness: 0.72 }),
      cutWood: new THREE.MeshStandardMaterial({ color: 0xd0a15d, roughness: 0.66 }),
      rope: new THREE.MeshStandardMaterial({ color: 0xd7bd83, roughness: 0.82 }),
      canvas: new THREE.MeshStandardMaterial({ color: 0x8b6844, roughness: 0.86 }),
      banner: new THREE.MeshStandardMaterial({ color: 0x2f5545, roughness: 0.78 }),
      targetFace: new THREE.MeshStandardMaterial({ color: 0xf0d7a5, roughness: 0.78 }),
      targetOuter: new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.74 }),
      targetRed: new THREE.MeshStandardMaterial({ color: 0xb8553f, roughness: 0.7 }),
      targetBlue: new THREE.MeshStandardMaterial({ color: 0x315d69, roughness: 0.72 }),
      targetGold: new THREE.MeshStandardMaterial({ color: 0xefbf5c, roughness: 0.58, emissive: 0x2b1800, emissiveIntensity: 0.08 }),
      parchment: new THREE.MeshStandardMaterial({ color: 0xe8d3a0, roughness: 0.82, emissive: 0x2a1700, emissiveIntensity: 0.05 }),
      warmWindow: new THREE.MeshStandardMaterial({ color: 0xffc579, roughness: 0.48, emissive: 0xff8f3a, emissiveIntensity: 0.42 }),
      hideLeather: new THREE.MeshStandardMaterial({ color: 0x6f4c2f, roughness: 0.9 }),
      water: new THREE.MeshPhysicalMaterial({ color: 0x79b6ad, roughness: 0.12, metalness: 0.03, transparent: true, opacity: 0.72, envMapIntensity: 1.12 }),
      wetShore: new THREE.MeshStandardMaterial({ color: 0x7f8064, roughness: 0.96, transparent: true, opacity: 0.42, depthWrite: false }),
      riverFoam: new THREE.MeshBasicMaterial({ color: 0xdaf0e6, transparent: true, opacity: 0.42, depthWrite: false }),
      lily: new THREE.MeshStandardMaterial({ color: 0x7fa35b, roughness: 0.86 }),
      blossom: new THREE.MeshStandardMaterial({ color: 0xf0c6a0, roughness: 0.72, emissive: 0x2a1208, emissiveIntensity: 0.05 }),
      snow: new THREE.MeshStandardMaterial({ color: 0xe7f1ee, roughness: 0.82 }),
      packedSnow: new THREE.MeshStandardMaterial({ color: 0xc8d7d5, roughness: 0.86 }),
      blueIce: new THREE.MeshPhysicalMaterial({ color: 0x9fdcff, roughness: 0.16, metalness: 0.02, transparent: true, opacity: 0.78, emissive: 0x123f5f, emissiveIntensity: 0.08 }),
      frostRock: new THREE.MeshStandardMaterial({ color: 0x758895, roughness: 0.88 }),
      frostPine: new THREE.MeshStandardMaterial({ color: 0xb9d6cf, roughness: 0.86 }),
      sand: new THREE.MeshStandardMaterial({ color: 0xd9b978, roughness: 0.9 }),
      cliffStone: new THREE.MeshStandardMaterial({ color: 0x9a886b, roughness: 0.88 }),
      seaGrass: new THREE.MeshStandardMaterial({ color: 0x6f9258, roughness: 0.86 }),
      seaWater: new THREE.MeshPhysicalMaterial({ color: 0x4198bd, roughness: 0.08, metalness: 0.02, transparent: true, opacity: 0.74, envMapIntensity: 1.24 }),
      seaFoam: new THREE.MeshStandardMaterial({ color: 0xdaf0e6, roughness: 0.5, transparent: true, opacity: 0.72 }),
      weatheredDock: new THREE.MeshStandardMaterial({ color: 0x8a633d, roughness: 0.9 }),
      lighthouseWhite: new THREE.MeshStandardMaterial({ color: 0xe9dfc3, roughness: 0.78 }),
      lighthouseRed: new THREE.MeshStandardMaterial({ color: 0xa94e3f, roughness: 0.74 }),
      mistLeaf: new THREE.MeshStandardMaterial({ color: 0x466b55, roughness: 0.88 }),
      mistLeafDark: new THREE.MeshStandardMaterial({ color: 0x263f35, roughness: 0.9 }),
      elderBark: new THREE.MeshStandardMaterial({ color: 0x57402f, roughness: 0.92 }),
      moonPetal: new THREE.MeshStandardMaterial({ color: 0xc5d8ff, roughness: 0.62, emissive: 0x314a8a, emissiveIntensity: 0.16 }),
      glowPlant: new THREE.MeshStandardMaterial({ color: 0x8ff0b1, roughness: 0.5, emissive: 0x2aa35f, emissiveIntensity: 0.42 }),
      mistStone: new THREE.MeshStandardMaterial({ color: 0x6b7568, roughness: 0.9 }),
      visibleTrail: new THREE.MeshStandardMaterial({ color: 0xaacb9a, roughness: 0.82, transparent: true, opacity: 0.72, emissive: 0x193c25, emissiveIntensity: 0.08 }),
      swampWater: new THREE.MeshPhysicalMaterial({ color: 0x344f46, roughness: 0.22, metalness: 0.03, transparent: true, opacity: 0.64, envMapIntensity: 0.75 }),
      swampMud: new THREE.MeshStandardMaterial({ color: 0x3f3526, roughness: 0.96 }),
      bogMud: new THREE.MeshStandardMaterial({ color: 0x2d2a1e, roughness: 0.98, transparent: true, opacity: 0.88 }),
      marshGrass: new THREE.MeshStandardMaterial({ color: 0x5c7447, roughness: 0.92 }),
      blackwaterWood: new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.94 }),
      hangingMoss: new THREE.MeshStandardMaterial({ color: 0x6f7e4d, roughness: 0.9, transparent: true, opacity: 0.82 }),
      witchlight: new THREE.MeshStandardMaterial({ color: 0x9af6b9, roughness: 0.42, emissive: 0x36c875, emissiveIntensity: 0.68 }),
      sunkenStone: new THREE.MeshStandardMaterial({ color: 0x596253, roughness: 0.92, metalness: 0.02 }),
      canyonRock: new THREE.MeshStandardMaterial({ color: 0xb7603b, roughness: 0.92 }),
      canyonDark: new THREE.MeshStandardMaterial({ color: 0x6f3328, roughness: 0.94 }),
      canyonSand: new THREE.MeshStandardMaterial({ color: 0xd2965f, roughness: 0.96 }),
      canyonTrail: new THREE.MeshStandardMaterial({ color: 0xa85435, roughness: 0.94 }),
      sunstone: new THREE.MeshStandardMaterial({ color: 0xffb45f, roughness: 0.48, emissive: 0xff7a28, emissiveIntensity: 0.28 }),
      canyonDust: new THREE.MeshBasicMaterial({ color: 0xd89b69, transparent: true, opacity: 0.16, depthWrite: false }),
      ashStone: new THREE.MeshStandardMaterial({ color: 0x514846, roughness: 0.94, metalness: 0.03 }),
      obsidian: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.42, metalness: 0.14 }),
      emberRock: new THREE.MeshStandardMaterial({ color: 0x8d3d2d, roughness: 0.88, emissive: 0x2c0800, emissiveIntensity: 0.08 }),
      ashField: new THREE.MeshStandardMaterial({ color: 0x6b6058, roughness: 0.98 }),
      lava: new THREE.MeshBasicMaterial({ color: 0xff6a1d, transparent: true, opacity: 0.9 }),
      lavaGlow: new THREE.MeshStandardMaterial({ color: 0xffb65d, roughness: 0.36, emissive: 0xff4a12, emissiveIntensity: 0.85 }),
      smoke: new THREE.MeshBasicMaterial({ color: 0x4d4746, transparent: true, opacity: 0.18, depthWrite: false }),
      starMeadow: new THREE.MeshStandardMaterial({ color: 0x596c8f, roughness: 0.76, emissive: 0x111c55, emissiveIntensity: 0.14 }),
      starGrass: new THREE.MeshStandardMaterial({ color: 0x8ebbc0, roughness: 0.72, emissive: 0x1b5d7a, emissiveIntensity: 0.18 }),
      astralStone: new THREE.MeshStandardMaterial({ color: 0x6c6f9b, roughness: 0.62, metalness: 0.04, emissive: 0x1b1d55, emissiveIntensity: 0.18 }),
      starCrystal: new THREE.MeshStandardMaterial({ color: 0xcdb7ff, roughness: 0.32, metalness: 0.06, emissive: 0x7f6fff, emissiveIntensity: 0.78 }),
      moonCrystal: new THREE.MeshStandardMaterial({ color: 0x9fdcff, roughness: 0.34, metalness: 0.04, emissive: 0x2f8fd8, emissiveIntensity: 0.62 }),
      starWater: new THREE.MeshPhysicalMaterial({ color: 0x6fd6ff, roughness: 0.1, metalness: 0.02, transparent: true, opacity: 0.62, envMapIntensity: 1.25, emissive: 0x0d3558, emissiveIntensity: 0.12 }),
      astralGold: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.42, metalness: 0.12, emissive: 0x4a2600, emissiveIntensity: 0.22 }),
      masterMarble: new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 0.6, metalness: 0.03, emissive: 0x241800, emissiveIntensity: 0.06 }),
      masterBronze: new THREE.MeshStandardMaterial({ color: 0xb88745, roughness: 0.42, metalness: 0.18, emissive: 0x3a1d00, emissiveIntensity: 0.18 }),
      masterBlue: new THREE.MeshStandardMaterial({ color: 0x82c8ff, roughness: 0.36, metalness: 0.04, emissive: 0x1c5d9a, emissiveIntensity: 0.32 }),
      frontierGrass: new THREE.MeshStandardMaterial({ color: 0x9fbf63, roughness: 0.9 }),
      frontierGrassDark: new THREE.MeshStandardMaterial({ color: 0x5f7a41, roughness: 0.92 }),
      frontierFlower: new THREE.MeshStandardMaterial({ color: 0xf4c96f, roughness: 0.7, emissive: 0x251200, emissiveIntensity: 0.06 }),
      frontierStone: new THREE.MeshStandardMaterial({ color: 0x9b967a, roughness: 0.86, metalness: 0.02 }),
      frontierRoad: new THREE.MeshStandardMaterial({ color: 0xb89563, roughness: 0.94 }),
      frontierWater: new THREE.MeshPhysicalMaterial({ color: 0x6bb2a8, roughness: 0.14, metalness: 0.02, transparent: true, opacity: 0.66, envMapIntensity: 1.0 }),
      kingdomStone: new THREE.MeshStandardMaterial({ color: 0x8f8973, roughness: 0.9, metalness: 0.02 }),
      kingdomDarkStone: new THREE.MeshStandardMaterial({ color: 0x4d5046, roughness: 0.94, metalness: 0.02 }),
      kingdomGold: new THREE.MeshStandardMaterial({ color: 0xd9ad57, roughness: 0.46, metalness: 0.16, emissive: 0x3b2100, emissiveIntensity: 0.18 }),
      archiveBlue: new THREE.MeshStandardMaterial({ color: 0x8bc8ff, roughness: 0.34, metalness: 0.04, emissive: 0x1d5f9d, emissiveIntensity: 0.42 }),
      overgrowthVine: new THREE.MeshStandardMaterial({ color: 0x536f42, roughness: 0.9 }),
      celestialStone: new THREE.MeshStandardMaterial({ color: 0x6f72a8, roughness: 0.62, metalness: 0.04, emissive: 0x171c58, emissiveIntensity: 0.18 }),
      celestialMarble: new THREE.MeshStandardMaterial({ color: 0xc9d5ff, roughness: 0.48, metalness: 0.03, emissive: 0x1a3270, emissiveIntensity: 0.12 }),
      voidCrystal: new THREE.MeshStandardMaterial({ color: 0x8c6dff, roughness: 0.28, metalness: 0.06, emissive: 0x6f45ff, emissiveIntensity: 0.78 }),
      stellarGold: new THREE.MeshStandardMaterial({ color: 0xffd98c, roughness: 0.38, metalness: 0.14, emissive: 0xff9f3d, emissiveIntensity: 0.26 }),
      crystalSand: new THREE.MeshStandardMaterial({ color: 0xbfc8ff, roughness: 0.72, metalness: 0.02, emissive: 0x243070, emissiveIntensity: 0.08 }),
      cloudSoft: new THREE.MeshBasicMaterial({ color: 0xfff0d6, transparent: true, opacity: 0.16, depthWrite: false }),
      moonGlow: new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.32, depthWrite: false }),
      vistaGold: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.48, metalness: 0.08, emissive: 0x3a1d00, emissiveIntensity: 0.2 }),
      marketAwningRed: new THREE.MeshStandardMaterial({ color: 0xb8553f, roughness: 0.74, emissive: 0x210600, emissiveIntensity: 0.06 }),
      marketAwningBlue: new THREE.MeshStandardMaterial({ color: 0x315d69, roughness: 0.74, emissive: 0x06141f, emissiveIntensity: 0.06 }),
      lodgeWall: new THREE.MeshStandardMaterial({ color: 0x9a7047, roughness: 0.82, emissive: 0x160b03, emissiveIntensity: 0.04 }),
      lodgeRoof: new THREE.MeshStandardMaterial({ color: 0x4a2d20, roughness: 0.88, emissive: 0x120704, emissiveIntensity: 0.03 }),
      lodgeStone: new THREE.MeshStandardMaterial({ color: 0x756f5d, roughness: 0.9, metalness: 0.02 }),
      trophyBronze: new THREE.MeshStandardMaterial({ color: 0xb88745, roughness: 0.46, metalness: 0.18, emissive: 0x241000, emissiveIntensity: 0.08 }),
      trophyInactive: new THREE.MeshStandardMaterial({ color: 0x4d473c, roughness: 0.92, metalness: 0.02, transparent: true, opacity: 0.56 }),
    };

    this.geometries = {
      trunk: new THREE.CylinderGeometry(0.2, 0.3, 1, 8),
      pineTop: new THREE.ConeGeometry(1, 1, 9),
      pineTopSoft: new THREE.ConeGeometry(1, 1, 12),
      grassBlade: new THREE.ConeGeometry(0.055, 0.55, 5),
      pebble: new THREE.DodecahedronGeometry(0.45, 1),
      fencePost: new THREE.CylinderGeometry(0.12, 0.16, 1.35, 8),
      fenceRail: new THREE.BoxGeometry(2.7, 0.14, 0.16),
      log: new THREE.CylinderGeometry(0.18, 0.2, 1.8, 10),
      crate: new THREE.BoxGeometry(1, 1, 1),
    };
  }

  createLayeredGableRoof(width, depth, y, material, options = {}) {
    const roof = new THREE.Group();
    const pitch = options.pitch ?? 0.48;
    const overhang = options.overhang ?? 0.42;
    const thickness = options.thickness ?? 0.22;
    const asymmetry = options.asymmetry ?? 0;
    const panelLength = width * 0.68 + overhang;
    const panelDepth = depth + overhang * 2;
    const ridgeY = y + Math.sin(pitch) * width * 0.36;

    const left = new THREE.Mesh(new THREE.BoxGeometry(panelLength, thickness, panelDepth), material);
    left.position.set(-width * 0.22 - asymmetry, y, 0);
    left.rotation.z = pitch;
    const right = new THREE.Mesh(new THREE.BoxGeometry(panelLength * (0.96 + Math.abs(asymmetry) * 0.04), thickness, panelDepth * 0.98), material);
    right.position.set(width * 0.22 - asymmetry * 0.35, y + asymmetry * 0.02, 0.02);
    right.rotation.z = -pitch * 0.94;

    const shingleRows = options.shingleRows ?? (this.performanceMode ? 2 : 4);
    for (let row = 0; row < shingleRows; row += 1) {
      [-1, 1].forEach((side) => {
        const shingle = new THREE.Mesh(new THREE.BoxGeometry(panelLength * (0.82 - row * 0.035), 0.035, panelDepth * 0.96), this.materials.bark);
        shingle.position.set(
          side * (width * 0.22 + row * width * 0.052) - asymmetry * 0.45,
          y - 0.14 + row * 0.135,
          Math.sin(row * 1.7 + side) * 0.018,
        );
        shingle.rotation.z = side < 0 ? pitch * 0.98 : -pitch * 0.94;
        shingle.castShadow = true;
        shingle.receiveShadow = true;
        roof.add(shingle);
      });
    }

    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, panelDepth + 0.12, 8), this.materials.cutWood);
    ridge.position.set(-asymmetry * 0.7, ridgeY, 0);
    ridge.rotation.x = Math.PI / 2;

    const ridgeSeam = new THREE.Mesh(new THREE.BoxGeometry(0.16, thickness * 1.15, panelDepth * 1.01), this.materials.cutWood);
    ridgeSeam.position.set(-asymmetry * 0.7, ridgeY - thickness * 0.18, 0);
    ridgeSeam.rotation.z = -asymmetry * 0.02;

    [-1, 1].forEach((side) => {
      const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, panelDepth, 7), this.materials.barkDark);
      eave.position.set(side * (width * 0.53 + overhang * 0.08), y - 0.16, 0);
      eave.rotation.x = Math.PI / 2;
      eave.rotation.z = -side * pitch;
      roof.add(eave);
    });

    [-1, 1].forEach((side) => {
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(width + overhang * 1.2, 0.12, 0.13), this.materials.barkDark);
      fascia.position.set(0, y - 0.02, side * (depth * 0.5 + overhang * 0.84));
      fascia.rotation.z = side > 0 ? -0.03 : 0.04;
      roof.add(fascia);
    });

    const rafterCount = this.performanceMode ? 3 : Math.max(3, Math.min(7, Math.round(panelDepth / 0.9)));
    for (let index = 0; index < rafterCount; index += 1) {
      const z = -panelDepth * 0.42 + (panelDepth * 0.84 * index) / Math.max(1, rafterCount - 1);
      [-1, 1].forEach((side) => {
        const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.32), this.materials.cutWood);
        rafter.position.set(side * (width * 0.52 + overhang * 0.1), y - 0.28, z);
        rafter.rotation.z = side < 0 ? pitch * 0.9 : -pitch * 0.9;
        roof.add(rafter);
      });
    }

    if (!this.performanceMode && width > 3.2 && depth > 2.2) {
      const dormerWidth = Math.min(0.82, width * 0.18);
      const dormer = new THREE.Group();
      dormer.position.set(-asymmetry * 0.45 + width * 0.12, y + 0.28, -depth * 0.18);
      const face = new THREE.Mesh(new THREE.BoxGeometry(dormerWidth, 0.44, 0.12), this.materials.cutWood);
      face.position.y = 0.1;
      const window = new THREE.Mesh(new THREE.BoxGeometry(dormerWidth * 0.5, 0.24, 0.04), this.materials.warmWindow);
      window.position.set(0, 0.12, -0.08);
      const cap = this.createLayeredGableRoof(dormerWidth * 1.18, 0.7, 0.42, material, {
        pitch: pitch * 0.72,
        overhang: 0.12,
        thickness: 0.08,
        shingleRows: 1,
      });
      cap.scale.z = 0.72;
      dormer.add(face, window, cap);
      dormer.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      roof.add(dormer);
    }

    [left, right, ridge, ridgeSeam].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
      roof.add(piece);
    });
    return roof;
  }

  addBuildingCraftDetails(group, width, depth, height, options = {}) {
    const trimMaterial = options.trim ?? this.materials.warmTrim;
    const beamMaterial = options.beam ?? this.materials.barkDark;
    const windowMaterial = options.window ?? this.materials.warmWindow;
    const frontZ = -depth * 0.505;
    const sideZ = depth * 0.505;
    const wallTopY = height + 0.22;

    [-1, 1].forEach((side) => {
      const frontPost = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, height + 0.34, 7), beamMaterial);
      frontPost.position.set(side * (width * 0.49), height * 0.52 + 0.2, frontZ - 0.045);
      frontPost.rotation.z = side * 0.025;
      const backPost = frontPost.clone();
      backPost.position.z = sideZ + 0.035;
      group.add(frontPost, backPost);
    });

    [0.54, wallTopY].forEach((trimY, index) => {
      const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, index ? 0.11 : 0.08, 0.09), index ? trimMaterial : beamMaterial);
      frontTrim.position.set(0, trimY, frontZ - 0.06);
      const backTrim = frontTrim.clone();
      backTrim.position.z = sideZ + 0.055;
      group.add(frontTrim, backTrim);
    });

    [-1, 1].forEach((side) => {
      const roofSeat = new THREE.Mesh(new THREE.BoxGeometry(width * 1.06, 0.12, 0.14), beamMaterial);
      roofSeat.position.set(0, wallTopY + 0.08, side * (depth * 0.5 + 0.04));
      group.add(roofSeat);
      const foundationSkirt = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.12, 0.12), trimMaterial);
      foundationSkirt.position.set(0, 0.31, side * (depth * 0.5 + 0.045));
      group.add(foundationSkirt);
    });

    [-1, 1].forEach((side) => {
      const sideTrim = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, depth * 1.02), beamMaterial);
      sideTrim.position.set(side * (width * 0.505), height * 0.52 + 0.08, 0);
      sideTrim.rotation.y = Math.PI / 2;
      group.add(sideTrim);

      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.1, height * 0.62, 0.08), trimMaterial);
      brace.position.set(side * (width * 0.36), height * 0.58, frontZ - 0.065);
      brace.rotation.z = side * 0.52;
      group.add(brace);
    });

    [-0.28, 0.32].forEach((offset, index) => {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.055), windowMaterial);
      window.position.set(width * offset, height * 0.58 + 0.18, frontZ - 0.07);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.08), trimMaterial);
      sill.position.set(window.position.x, window.position.y - 0.28, frontZ - 0.08);
      const leftShutter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.07), beamMaterial);
      leftShutter.position.set(window.position.x - 0.42, window.position.y, frontZ - 0.082);
      const rightShutter = leftShutter.clone();
      rightShutter.position.x = window.position.x + 0.42;
      group.add(window, sill, leftShutter, rightShutter);
      if (index === 0 && width > 3.7) {
        const sideWindow = window.clone();
        sideWindow.position.set(width * 0.515, height * 0.6, depth * 0.12);
        sideWindow.rotation.y = Math.PI / 2;
        const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.08), trimMaterial);
        sideSill.position.set(width * 0.525, height * 0.6 - 0.28, depth * 0.12);
        sideSill.rotation.y = Math.PI / 2;
        group.add(sideWindow, sideSill);
      }
    });

    const doorTrimY = 0.82;
    [-1, 1].forEach((side) => {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.26, 0.09), beamMaterial);
      jamb.position.set(side * 0.42, doorTrimY, frontZ - 0.095);
      group.add(jamb);
    });
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.09, 0.1), beamMaterial);
    doorHeader.position.set(0, 1.46, frontZ - 0.1);
    group.add(doorHeader);

    const stoneCount = Math.max(3, Math.round(width / 1.2));
    for (let index = 0; index < stoneCount; index += 1) {
      const t = stoneCount === 1 ? 0.5 : index / (stoneCount - 1);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 ? this.materials.darkStone : this.materials.stone);
      stone.position.set((t - 0.5) * width * 0.88, 0.14, frontZ - 0.12);
      stone.scale.set(0.22 + (index % 2) * 0.05, 0.08, 0.16);
      stone.rotation.set(0.1, index * 0.6, -0.06);
      group.add(stone);
    }
  }

  createGuildSymbol(scale = 1, options = {}) {
    const group = new THREE.Group();
    const gold = options.gold ?? this.materials.targetGold;
    const dark = options.dark ?? this.materials.banner;

    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * scale, 0.022 * scale, 0.92 * scale, 6), gold);
    arrow.rotation.z = Math.PI / 2;
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.22 * scale, 5), gold);
    arrowHead.position.x = 0.54 * scale;
    arrowHead.rotation.z = -Math.PI / 2;
    const leftWing = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 0.52 * scale, 4), dark);
    leftWing.position.set(-0.08 * scale, 0.15 * scale, 0);
    leftWing.rotation.z = -0.92;
    leftWing.scale.set(1.1, 0.62, 0.28);
    const rightWing = leftWing.clone();
    rightWing.position.y = -0.15 * scale;
    rightWing.rotation.z = 0.92;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * scale, 0.22 * scale, 5, 8), gold);
    body.rotation.z = Math.PI / 2;
    body.position.x = -0.08 * scale;

    group.add(arrow, arrowHead, leftWing, rightWing, body);
    group.userData.guildSymbol = true;
    return group;
  }

  addSky() {
    this.scene.background = new THREE.Color(SETTINGS.world.skyHorizonColor);
    this.scene.fog = new THREE.FogExp2(SETTINGS.world.fogColor, 0.0115);

    const skyGeometry = new THREE.SphereGeometry(this.size * 1.35, 36, 20);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(SETTINGS.world.skyTopColor) },
        horizonColor: { value: new THREE.Color(SETTINGS.world.skyHorizonColor) },
        groundColor: { value: new THREE.Color(SETTINGS.world.skyGroundColor) },
        sunColor: { value: new THREE.Color(0xffd08a) },
        sunDirection: { value: new THREE.Vector3(-0.34, 0.38, -0.18).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldDirection;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldDirection = normalize(worldPosition.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldDirection;
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 groundColor;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        void main() {
          float horizon = smoothstep(-0.18, 0.38, vWorldDirection.y);
          vec3 sky = mix(horizonColor, topColor, horizon);
          sky = mix(groundColor, sky, smoothstep(-0.34, 0.08, vWorldDirection.y));
          float sunGlow = pow(max(dot(vWorldDirection, sunDirection), 0.0), 18.0);
          float wideGlow = pow(max(dot(vWorldDirection, sunDirection), 0.0), 3.0);
          gl_FragColor = vec4(sky + sunColor * sunGlow * 0.55 + sunColor * wideGlow * 0.12, 1.0);
        }
      `,
    });

    this.skyMaterial = skyMaterial;
    this.scene.add(new THREE.Mesh(skyGeometry, skyMaterial));
    this.addStars();
    this.addCloudBands();
    this.moonDisc = null;
  }

  addStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let index = 0; index < 120; index += 1) {
      const angle = index * 2.399;
      const radius = 120 + (index % 7) * 12;
      const y = 62 + (index % 11) * 8;
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xdcecff,
      size: 0.75,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  addCloudBands() {
    this.clouds = new THREE.Group();
    [
      [-58, 72, -92, 18, 4.8, 1.3], [34, 64, -72, -12, 5.6, 1.1], [102, 76, 14, 26, 6.4, 1.25],
      [-126, 82, 108, -20, 7.2, 1.35], [18, 86, 142, 34, 7.8, 1.0], [-78, 68, 24, -28, 5.2, 1.18],
      [2, 58, 86, 12, 5.8, 1.4], [-38, 63, -12, -34, 4.4, 1.22], [126, 70, -132, 28, 6.8, 1.32],
    ].forEach(([x, y, z, yaw, scale, stretch], index) => {
      const puff = new THREE.Group();
      puff.position.set(x, y, z);
      puff.rotation.y = THREE.MathUtils.degToRad(yaw);
      for (let part = 0; part < 4; part += 1) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), this.materials.cloudSoft);
        mesh.position.set((part - 1.5) * scale * 0.34, Math.sin(part + index) * 0.22, Math.cos(part * 1.7) * scale * 0.08);
        mesh.scale.set(scale * (0.72 + part * 0.08), scale * 0.18, scale * 0.28 * stretch);
        puff.add(mesh);
      }
      this.clouds.add(puff);
    });
    this.scene.add(this.clouds);
  }

  addMoonDisc() {
    this.moonDisc = null;
  }

  addLighting() {
    const ambient = new THREE.AmbientLight(0xffecd0, 0.26);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffefc7, 0x35543a, 1.44);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffc978, 3.62);
    sun.position.set(-31, 31, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.performanceMode ? 1024 : 2048, this.performanceMode ? 1024 : 2048);
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.00012;
    sun.shadow.normalBias = 0.018;
    sun.shadow.camera.left = -54;
    sun.shadow.camera.right = 54;
    sun.shadow.camera.top = 54;
    sun.shadow.camera.bottom = -54;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 95;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x9cc7ff, 0.98);
    rim.position.set(26, 20, -31);
    this.scene.add(rim);

    const forestBounce = new THREE.DirectionalLight(0x9ebf75, 0.42);
    forestBounce.position.set(18, 9, 24);
    this.scene.add(forestBounce);

    const moon = new THREE.DirectionalLight(0xaac7ff, 0.22);
    moon.position.set(35, 24, -52);
    this.scene.add(moon);

    this.lighting = { ambient, hemi, sun, rim, forestBounce, moon };
  }

  addTrainingClearing() {
    this.addForestRing();
    this.addTargetRange();
    this.addTrainingCamp();
    this.addFenceLine();
    this.addRockGroups();
    this.addGrassPatches();
    this.addSmallDetails();
    this.addOldWatchtower();
    this.addHiddenPond();
    this.addAncientRuins();
    this.addHuntersCabin();
    this.addCliffOverlook();
    this.addWhisperCave();
    this.addWorldCohesionPass();
    this.addAdventureMapExpansion();
    this.addWorldArtDirectionPass();
    this.registerLandmarks();
    this.registerRegions();
    this.registerSafeZones();
    this.registerCollisionVolumes();
    this.optimizeStaticScene();
  }

  addCollisionCylinder(x, z, radius, height = 2.2, yOffset = 0) {
    const baseY = this.terrain.getHeightAt(x, z) + yOffset;
    this.collisionVolumes.push({
      type: "cylinder",
      x,
      z,
      radius,
      minY: baseY,
      maxY: baseY + height,
    });
  }

  addCollisionBox(x, z, width, depth, height = 2.2, yaw = 0, yOffset = 0) {
    const baseY = this.terrain.getHeightAt(x, z) + yOffset;
    this.collisionVolumes.push({
      type: "box",
      x,
      z,
      width,
      depth,
      yaw,
      minY: baseY,
      maxY: baseY + height,
    });
  }

  getLocalFromOrigin(origin, x, z) {
    const dx = x - origin.x;
    const dz = z - origin.z;
    const cos = Math.cos(-origin.yaw);
    const sin = Math.sin(-origin.yaw);
    return {
      x: (dx * cos - dz * sin) / origin.scale,
      z: (dx * sin + dz * cos) / origin.scale,
    };
  }

  getPlatformHeightAt(x, z) {
    let platformHeight = -Infinity;
    if (this.watchtower) {
      const local = this.getLocalFromOrigin(this.watchtower, x, z);
      const onPlatform = Math.abs(local.x) <= 2.15 && Math.abs(local.z) <= 2.0;
      const onRampTop = local.x > 1.1 && local.x < 4.65 && local.z > -2.15 && local.z < -0.55;
      if (onPlatform || onRampTop) {
        const base = this.terrain.getHeightAt(this.watchtower.x, this.watchtower.z);
        const rampLift = onRampTop ? THREE.MathUtils.clamp((local.x - 1.1) / 3.55, 0, 1) * 2.45 : 2.55;
        platformHeight = Math.max(platformHeight, base + rampLift);
      }
    }
    return platformHeight;
  }

  registerCollisionVolumes() {
    if (this.watchtower) {
      const base = this.getWatchtowerPoint(this.watchtower, 0, 0);
      this.addCollisionCylinder(base.x, base.z, 0.78, 3.1);
    }
    if (this.huntersCabin) {
      const cabin = this.getHuntersCabinPoint(this.huntersCabin, 0, 0);
      const porch = this.getHuntersCabinPoint(this.huntersCabin, 0, -2.45);
      this.addCollisionBox(cabin.x, cabin.z, 4.9, 3.5, 3.0, this.huntersCabin.yaw);
      this.addCollisionBox(porch.x, porch.z, 3.8, 0.55, 0.7, this.huntersCabin.yaw);
    }
    if (this.ancientRuins) {
      [[-3.2, -0.2, 0.55], [2.8, -1.4, 0.62], [0.4, 2.8, 0.72], [-4.6, 2.4, 0.48]].forEach(([localX, localZ, radius]) => {
        const point = this.getAncientRuinsPoint(this.ancientRuins, localX, localZ);
        this.addCollisionCylinder(point.x, point.z, radius, 2.4);
      });
      const arch = this.getAncientRuinsPoint(this.ancientRuins, -1.6, -2.2);
      this.addCollisionBox(arch.x, arch.z, 2.8, 0.48, 2.7, this.ancientRuins.yaw + 0.16);
    }
    if (this.hiddenPond) {
      const tree = this.getHiddenPondPoint(this.hiddenPond, -1.9, 2.35);
      this.addCollisionCylinder(tree.x, tree.z, 0.82, 5.2);
    }
    if (this.cliffOverlook) {
      [[-2.35, -2.05], [0, -2.38], [2.35, -2.05]].forEach(([localX, localZ]) => {
        const point = this.getCliffOverlookPoint(this.cliffOverlook, localX, localZ);
        this.addCollisionBox(point.x, point.z, 1.45, 0.28, 1.0, this.cliffOverlook.yaw);
      });
    }
    if (this.whisperCave) {
      [[-3.2, 0.2, 1.35], [3.2, 0.2, 1.35], [-4.8, 7.8, 1.05], [4.8, 7.8, 1.05], [-3.8, 14.5, 1.1], [3.6, 14.2, 1.1]].forEach(([localX, localZ, radius]) => {
        const point = this.getWhisperCavePoint(this.whisperCave, localX, localZ);
        this.addCollisionCylinder(point.x, point.z, radius, 3.3);
      });
    }

    [
      [-22, 10, 1.05], [-18, 13, 0.58], [-7, 16, 0.8], [17, 13, 0.86], [22, 9, 0.62],
      [-28, -2, 0.66], [31, -1, 0.96], [-4, -12, 0.52], [9, -10, 0.54],
      [-4.2, 5.9, 0.55], [5.5, 8.4, 0.5], [13.2, -2.4, 0.52], [-18.4, 5.8, 0.56], [21.8, -15.4, 0.54],
    ].forEach(([x, z, radius]) => {
      this.addCollisionCylinder(x, z, radius, 1.6);
    });

    [
      [-15, 8, 0.05], [-10.8, 8.3, 0.1], [-6.6, 8.4, 0.02], [7.6, 8, -0.06], [11.8, 7.5, -0.13], [16, 6.6, -0.2],
      [-25, -13, 0.85], [-27, -9.4, 0.95], [26, -13, -0.82], [28, -9.5, -0.92],
    ].forEach(([x, z, yaw]) => {
      this.addCollisionBox(x, z, 2.8, 0.42, 1.2, yaw);
    });

    this.addCollisionCylinder(-17, -8, 1.65, 2.1);
    this.addCollisionBox(-20.05, -3.25, 2.2, 1.5, 1.2, 0.42);
    this.addCollisionCylinder(-13.2, -5.3, 0.68, 0.6);
  }

  updateDayNight(deltaSeconds, timeElement = null) {
    const config = SETTINGS.world.dayNight;
    this.timeOfDay = (this.timeOfDay + deltaSeconds / config.cycleDuration) % 1;
    const sunAngle = this.timeOfDay * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const daylight = THREE.MathUtils.smoothstep(sunHeight, -0.18, 0.62);
    const nightFactor = 1 - daylight;
    const dawnGlow = Math.max(0, 1 - Math.abs(this.timeOfDay - 0.25) * 8) + Math.max(0, 1 - Math.abs(this.timeOfDay - 0.75) * 8);

    const dayTop = new THREE.Color(SETTINGS.world.skyTopColor);
    const nightTop = new THREE.Color(0x172a45);
    const dayHorizon = new THREE.Color(SETTINGS.world.skyHorizonColor);
    const nightHorizon = new THREE.Color(0x283858);
    const dayFog = new THREE.Color(SETTINGS.world.fogColor);
    const nightFog = new THREE.Color(0x233450);

    this.scene.background.copy(dayHorizon).lerp(nightHorizon, nightFactor * 0.85);
    this.scene.fog.color.copy(dayFog).lerp(nightFog, nightFactor * 0.82);
    this.scene.fog.density = THREE.MathUtils.lerp(0.012, 0.019, nightFactor * 0.65);

    if (this.skyMaterial) {
      this.skyMaterial.uniforms.topColor.value.copy(dayTop).lerp(nightTop, nightFactor * 0.9);
      this.skyMaterial.uniforms.horizonColor.value.copy(dayHorizon).lerp(nightHorizon, nightFactor * 0.82);
      this.skyMaterial.uniforms.groundColor.value.set(0x587247).lerp(new THREE.Color(0x1f3440), nightFactor * 0.75);
      this.skyMaterial.uniforms.sunColor.value.set(0xffd08a).lerp(new THREE.Color(0xb7d3ff), nightFactor);
      this.skyMaterial.uniforms.sunDirection.value.set(Math.cos(sunAngle) * -0.65, Math.max(sunHeight, -0.22), Math.sin(sunAngle) * -0.42).normalize();
    }

    if (this.lighting) {
      this.lighting.ambient.intensity = THREE.MathUtils.lerp(0.24, 0.15, nightFactor);
      this.lighting.hemi.intensity = THREE.MathUtils.lerp(1.44, 0.54, nightFactor);
      this.lighting.sun.intensity = THREE.MathUtils.lerp(3.62, 0.24, nightFactor) + dawnGlow * 0.52;
      this.lighting.sun.position.set(Math.cos(sunAngle) * -34, 10 + Math.max(sunHeight, 0.08) * 34, Math.sin(sunAngle) * 28);
      this.lighting.rim.intensity = THREE.MathUtils.lerp(0.98, 1.34, nightFactor);
      this.lighting.rim.color.set(nightFactor > 0.45 ? 0x9fc3ff : 0x8ebdff);
      this.lighting.forestBounce.intensity = THREE.MathUtils.lerp(0.42, 0.18, nightFactor);
      this.lighting.moon.intensity = THREE.MathUtils.lerp(0.12, 0.96, nightFactor);
    }
    if (this.stars) {
      this.stars.material.opacity = THREE.MathUtils.clamp((nightFactor - 0.35) / 0.65, 0, 0.95);
    }
    if (this.moonDisc?.material) {
      this.moonDisc.material.opacity = THREE.MathUtils.lerp(0.08, 0.48, nightFactor);
    }
    if (this.clouds) {
      this.clouds.children.forEach((cloud, index) => {
        cloud.position.x += Math.sin(this.timeOfDay * Math.PI * 2 + index) * 0.002;
      });
    }

    const phase = daylight > 0.72 ? "Day" : nightFactor > 0.68 ? "Night" : sunHeight > 0 ? "Dawn" : "Dusk";
    this.dayNightState = { phase, nightFactor };
    this.updateTidalPaths();
    this.baseFogDensity = this.scene.fog.density;
    this.baseLighting = this.lighting ? {
      ambient: this.lighting.ambient.intensity,
      hemi: this.lighting.hemi.intensity,
      sun: this.lighting.sun.intensity,
      rim: this.lighting.rim.intensity,
      forestBounce: this.lighting.forestBounce.intensity,
      moon: this.lighting.moon.intensity,
    } : null;
    if (timeElement) {
      timeElement.textContent = phase;
    }
  }

  applyWeather(profile = null) {
    if (!profile || !this.scene.fog) {
      return;
    }

    this.lastWeatherProfile = profile;
    this.scene.fog.density = (this.baseFogDensity ?? this.scene.fog.density) + profile.fogBoost;
    const weatherTint = new THREE.Color(profile.skyTint ?? 0xffffff);
    this.scene.fog.color.lerp(weatherTint, 0.06 + profile.lightDim * 0.08);
    if (this.skyMaterial) {
      this.skyMaterial.uniforms.horizonColor.value.lerp(weatherTint, 0.04 + profile.lightDim * 0.08);
      this.skyMaterial.uniforms.topColor.value.lerp(weatherTint, 0.025);
    }
    if (this.baseLighting && this.lighting) {
      const dim = 1 - profile.lightDim;
      this.lighting.ambient.intensity = this.baseLighting.ambient * (0.9 + dim * 0.1);
      this.lighting.hemi.intensity = this.baseLighting.hemi * dim;
      this.lighting.sun.intensity = this.baseLighting.sun * dim;
      this.lighting.rim.intensity = this.baseLighting.rim * (1 + profile.lightDim * 0.25);
      this.lighting.forestBounce.intensity = this.baseLighting.forestBounce * dim;
      this.lighting.moon.intensity = this.baseLighting.moon * (1 + profile.lightDim * 0.35);
    }
  }

  applyGraphicsQuality(preset = null) {
    this.graphicsQuality = preset;
    if (!preset) {
      return;
    }

    if (this.lighting?.sun) {
      const mapSize = preset.shadows ? preset.shadowMapSize : 512;
      this.lighting.sun.castShadow = preset.shadows;
      this.lighting.sun.shadow.mapSize.set(mapSize, mapSize);
      this.lighting.sun.shadow.needsUpdate = true;
      this.lighting.sun.shadow.camera.left = preset.id === "high" ? -62 : -48;
      this.lighting.sun.shadow.camera.right = preset.id === "high" ? 62 : 48;
      this.lighting.sun.shadow.camera.top = preset.id === "high" ? 62 : 48;
      this.lighting.sun.shadow.camera.bottom = preset.id === "high" ? -62 : -48;
      this.lighting.sun.shadow.camera.updateProjectionMatrix();
    }

    const waterQuality = preset.waterQuality ?? 0.75;
    ["water", "seaWater", "frontierWater", "swampWater", "starWater"].forEach((key) => {
      const material = this.materials?.[key];
      if (!material) return;
      material.roughness = THREE.MathUtils.lerp(0.32, 0.1, waterQuality);
      material.opacity = THREE.MathUtils.lerp(0.58, 0.76, waterQuality);
      material.envMapIntensity = THREE.MathUtils.lerp(0.45, 1.15, waterQuality);
      material.needsUpdate = true;
    });

    if (this.scene.fog) {
      this.scene.fog.density = THREE.MathUtils.clamp(this.scene.fog.density, 0.01, preset.id === "low" ? 0.024 : 0.03);
    }
  }

  optimizeStaticScene() {
    this.detailObjects = [];
    let shadowCastersReduced = 0;

    this.scene.traverse((object) => {
      if (!object.isMesh || !object.geometry) {
        return;
      }

      object.frustumCulled = true;
      object.geometry.computeBoundingSphere();
      const radius = object.geometry.boundingSphere?.radius ?? 1;
      const scale = Math.max(object.scale.x, object.scale.y, object.scale.z);
      const worldRadius = radius * scale;
      const transparent = Boolean(object.material?.transparent);
      const isGround = object.userData?.terrain || object.name?.toLowerCase().includes("terrain");
      const isImportant = object.userData?.important || object.userData?.target || object.userData?.landmark || isGround;

      if ((transparent || worldRadius < (this.performanceMode ? 0.95 : 0.55)) && object.castShadow) {
        object.castShadow = false;
        shadowCastersReduced += 1;
      }

      if (!isImportant && worldRadius > 0.05 && worldRadius < 1.15) {
        object.userData.detailObject = true;
        this.detailObjects.push(object);
      }
    });

    this.optimizationStats = {
      detailObjects: this.detailObjects.length,
      shadowCastersReduced,
    };
  }

  updateDistanceDetail(playerPosition, deltaSeconds = 0) {
    if (!this.detailObjects.length) {
      return;
    }

    this.detailTimer -= deltaSeconds;
    if (this.detailTimer > 0) {
      return;
    }
    this.detailTimer = this.graphicsQuality?.id === "low" ? 0.85 : 0.55;

    const detailDistance = this.graphicsQuality?.detailDistance ?? (this.performanceMode ? 38 : 70);
    const detailDistanceSq = detailDistance * detailDistance;
    const fadeDistanceSq = (detailDistance + 14) * (detailDistance + 14);

    this.detailObjects.forEach((object) => {
      if (!object.parent) {
        return;
      }
      object.getWorldPosition(this.detailWorldPosition);
      const dx = this.detailWorldPosition.x - playerPosition.x;
      const dz = this.detailWorldPosition.z - playerPosition.z;
      const distanceSq = dx * dx + dz * dz;
      object.visible = distanceSq <= fadeDistanceSq || (!this.performanceMode && distanceSq <= detailDistanceSq);
    });
  }

  getCreatureAlertMultiplier() {
    return THREE.MathUtils.lerp(1, SETTINGS.world.dayNight.nightAlertMultiplier, this.dayNightState.nightFactor);
  }

  addWorldArtDirectionPass() {
    this.addLivingWorldMotionPass();
    this.applyVisualMasterpieceMaterialTuning();
    this.addVisualMasterpieceAtmosphere();
    if (this.performanceMode) {
      return;
    }
    this.addRegionVistaFrames();
    this.addLandmarkAccentLighting();
    this.addVillageVisualPolish();
    this.addEnvironmentalStorytellingDetails();
    this.addMasterpieceCompositionPass();
  }

  addMasterpieceCompositionPass() {
    this.addReadablePathEdges();
    this.addLandmarkSilhouetteAccents();
    this.addForestFloorLayering();
    this.addVillageLivedInDetails();
    this.addMarketMasterpassDetails();
    this.addRegionalAtmosphereAccents();
    this.addVisualMasterpiecePass2();
    this.addForestMasterpiecePass();
  }

  applyVisualMasterpieceMaterialTuning() {
    const tune = (key, color, options = {}) => {
      const material = this.materials?.[key];
      if (!material) return;
      if (color !== null && material.color) material.color.setHex(color);
      if (options.roughness !== undefined) material.roughness = options.roughness;
      if (options.metalness !== undefined) material.metalness = options.metalness;
      if (options.opacity !== undefined) {
        material.transparent = options.opacity < 1 || material.transparent;
        material.opacity = options.opacity;
      }
      if (options.emissive !== undefined && material.emissive) material.emissive.setHex(options.emissive);
      if (options.emissiveIntensity !== undefined && material.emissive) material.emissiveIntensity = options.emissiveIntensity;
      material.needsUpdate = true;
    };

    tune("agedWood", 0x8b6038, { roughness: 0.84 });
    tune("wood", 0xa8733f, { roughness: 0.72 });
    tune("cutWood", 0xd5a867, { roughness: 0.64 });
    tune("barkDark", 0x34241c, { roughness: 0.92 });
    tune("stone", 0x958d73, { roughness: 0.9 });
    tune("ancientStone", 0xaaa184, { roughness: 0.9 });
    tune("darkStone", 0x505746, { roughness: 0.94 });
    tune("grass", 0x789653, { roughness: 0.96 });
    tune("grassLight", 0xb0bd69, { roughness: 0.95 });
    tune("pine", 0x315f45, { roughness: 0.86 });
    tune("pineDark", 0x1f3c32, { roughness: 0.9 });
    tune("banner", 0x315d4a, { roughness: 0.8 });
    tune("warmWindow", 0xffc77a, { roughness: 0.42, emissive: 0xff8c32, emissiveIntensity: 0.5 });
    tune("water", 0x77aaa1, { roughness: 0.16, opacity: 0.7 });
    tune("seaWater", 0x3e91b8, { roughness: 0.1, opacity: 0.72 });
    tune("swampWater", 0x314c43, { roughness: 0.24, opacity: 0.64 });
    tune("starWater", 0x74d4ff, { roughness: 0.08, opacity: 0.64, emissive: 0x0e3a60, emissiveIntensity: 0.14 });
  }

  addVisualMasterpieceAtmosphere() {
    if (this.scene.fog) {
      this.scene.fog.color.lerp(new THREE.Color(0xe2c992), 0.16);
      this.scene.fog.density = Math.max(0.0105, this.scene.fog.density * 0.94);
    }
    if (this.lighting) {
      this.lighting.hemi.color.set(0xfff1cf);
      this.lighting.hemi.groundColor.set(0x536f46);
      this.lighting.rim.color.set(0x9fc8ff);
      this.lighting.forestBounce.color?.set?.(0x9fcf78);
    }
    if (this.skyMaterial) {
      this.skyMaterial.uniforms.horizonColor.value.lerp(new THREE.Color(0xf7c685), 0.18);
      this.skyMaterial.uniforms.groundColor.value.lerp(new THREE.Color(0x64814f), 0.12);
    }
  }

  addVisualMasterpiecePass2() {
    this.addHandcraftedArchitectureOverlays();
    this.addLandmarkCompositionBrushstrokes();
    this.addTerrainColorBrushstrokes();
    this.addTerrainMasterpiecePass();
    this.addForestUnderstoryMasterpass();
    this.addRegionIdentityBrushstrokes();
  }

  addLivingWorldMotionPass() {
    if (this.livingMotionObjects.length) {
      return;
    }

    const density = this.performanceMode ? 0.55 : 1;
    this.addChimneySmokeStacks([
      { x: (this.archersGuild?.x ?? -56) - 8, z: (this.archersGuild?.z ?? 28) + 7 },
      { x: (this.archersGuild?.x ?? -56) + 8, z: (this.archersGuild?.z ?? 28) + 12 },
      { x: (this.frontierOutpost?.x ?? 126) - 6, z: (this.frontierOutpost?.z ?? -132) + 4 },
      { x: (this.coastalHarbor?.x ?? -128) + 2, z: (this.coastalHarbor?.z ?? -134) + 4 },
      { x: (this.archersLodge?.x ?? -88) + 2, z: (this.archersLodge?.z ?? 74) - 1 },
    ].slice(0, Math.max(2, Math.round(5 * density))));

    this.addFallingLeafDrifts([
      { x: -18, z: 18, radius: 9 },
      { x: (this.archersGuild?.x ?? -56) + 2, z: (this.archersGuild?.z ?? 28) + 8, radius: 10 },
      { x: 92, z: 88, radius: 12 },
      { x: 130, z: 34, radius: 12 },
    ], Math.round(9 * density));

    this.addSwayingNaturalMotifs([
      { x: -8, z: 12, radius: 10, material: this.materials.grassLight },
      { x: 62, z: 34, radius: 9, material: this.materials.lily },
      { x: -75, z: -62, radius: 12, material: this.materials.marshGrass },
      { x: 138, z: 38, radius: 10, material: this.materials.mistLeaf },
    ], Math.round(10 * density));

    this.addDuskLanternGlows([
      { x: (this.archersGuild?.x ?? -56) - 6, z: (this.archersGuild?.z ?? 28) + 6 },
      { x: (this.archersGuild?.x ?? -56) + 5, z: (this.archersGuild?.z ?? 28) + 7 },
      { x: (this.frontierOutpost?.x ?? 126), z: (this.frontierOutpost?.z ?? -132) },
      { x: (this.coastalHarbor?.x ?? -128), z: (this.coastalHarbor?.z ?? -134) + 2 },
    ]);

    this.addWeatherReactionMotifs([
      { x: (this.archersGuild?.x ?? -56) - 2, z: (this.archersGuild?.z ?? 28) + 9, kind: "village" },
      { x: (this.archersGuild?.x ?? -56) + 9, z: (this.archersGuild?.z ?? 28) + 5, kind: "market" },
      { x: (this.frontierOutpost?.x ?? 126) - 3, z: (this.frontierOutpost?.z ?? -132) + 3, kind: "frontier" },
      { x: (this.coastalHarbor?.x ?? -128) - 2, z: (this.coastalHarbor?.z ?? -134) + 2, kind: "harbor" },
      { x: -14, z: 12, kind: "trail" },
    ]);
  }

  addChimneySmokeStacks(points) {
    points.forEach((point, stackIndex) => {
      const baseY = this.terrain.getHeightAt(point.x, point.z) + 2.1;
      for (let index = 0; index < 4; index += 1) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + index * 0.045, 8, 6), this.materials.smoke.clone());
        puff.position.set(point.x + index * 0.06, baseY + index * 0.28, point.z - index * 0.04);
        puff.userData.livingMotion = {
          type: "smoke",
          baseX: puff.position.x,
          baseY: puff.position.y,
          baseZ: puff.position.z,
          seed: stackIndex * 1.7 + index * 0.41,
        };
        this.scene.add(puff);
        this.livingMotionObjects.push(puff);
      }
    });
  }

  addFallingLeafDrifts(areas, leavesPerArea) {
    const leafGeometry = new THREE.BoxGeometry(0.09, 0.018, 0.045);
    areas.forEach((area, areaIndex) => {
      for (let index = 0; index < leavesPerArea; index += 1) {
        const angle = (index / leavesPerArea) * Math.PI * 2 + areaIndex;
        const radius = area.radius * (0.24 + ((index * 37) % 100) / 130);
        const x = area.x + Math.cos(angle) * radius;
        const z = area.z + Math.sin(angle) * radius;
        const y = this.terrain.getHeightAt(x, z) + 1.6 + (index % 5) * 0.55;
        const leaf = new THREE.Mesh(leafGeometry, index % 3 ? this.materials.leafAccent : this.materials.flower);
        leaf.position.set(x, y, z);
        leaf.rotation.set(index * 0.4, angle, index * 0.23);
        leaf.userData.livingMotion = {
          type: "leaf",
          homeX: area.x,
          homeZ: area.z,
          radius: area.radius,
          seed: areaIndex * 3.1 + index * 0.67,
          baseY: y,
        };
        this.scene.add(leaf);
        this.livingMotionObjects.push(leaf);
      }
    });
  }

  addSwayingNaturalMotifs(areas, bladesPerArea) {
    areas.forEach((area, areaIndex) => {
      for (let index = 0; index < bladesPerArea; index += 1) {
        const angle = (index / bladesPerArea) * Math.PI * 2 + areaIndex * 0.5;
        const radius = area.radius * (0.18 + ((index * 19) % 100) / 135);
        const x = area.x + Math.cos(angle) * radius;
        const z = area.z + Math.sin(angle) * radius;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.42 + (index % 3) * 0.08, 4), area.material);
        blade.position.set(x, this.terrain.getHeightAt(x, z) + 0.21, z);
        blade.rotation.set(0.08, angle, 0);
        blade.userData.livingMotion = {
          type: "sway",
          baseRotX: blade.rotation.x,
          baseRotZ: blade.rotation.z,
          seed: areaIndex * 2.2 + index * 0.33,
        };
        this.scene.add(blade);
        this.livingMotionObjects.push(blade);
      }
    });
  }

  addDuskLanternGlows(points) {
    points.forEach((point, index) => {
      const y = this.terrain.getHeightAt(point.x, point.z);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), this.materials.warmWindow.clone());
      glow.position.set(point.x, y + 1.25, point.z);
      glow.userData.livingMotion = { type: "lantern", seed: index * 0.9 };
      this.scene.add(glow);
      this.livingMotionObjects.push(glow);
    });
  }

  addWeatherReactionMotifs(points) {
    const puddleMaterial = this.materials.water.clone();
    puddleMaterial.opacity = 0.08;
    puddleMaterial.transparent = true;
    puddleMaterial.depthWrite = false;
    const clothMaterial = this.materials.parchment.clone();
    const darkClothMaterial = this.materials.banner.clone();
    points.forEach((point, index) => {
      const y = this.terrain.getHeightAt(point.x, point.z);
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.55 + (index % 3) * 0.18, 18), puddleMaterial.clone());
      puddle.position.set(point.x + 0.45, y + 0.018, point.z - 0.35);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(1.35, 0.72, 1);
      puddle.userData.livingMotion = { type: "puddle", seed: index * 0.64 };
      this.scene.add(puddle);
      this.livingMotionObjects.push(puddle);

      if (point.kind !== "trail") {
        const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 5), this.materials.rope);
        line.position.set(point.x - 0.34, y + 1.22, point.z + 0.58);
        line.rotation.z = Math.PI / 2;
        const clothA = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.025), index % 2 ? clothMaterial : darkClothMaterial);
        clothA.position.set(point.x - 0.66, y + 1.02, point.z + 0.58);
        const clothB = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.025), index % 2 ? darkClothMaterial : clothMaterial);
        clothB.position.set(point.x - 0.12, y + 1.04, point.z + 0.58);
        [line, clothA, clothB].forEach((object, clothIndex) => {
          object.userData.livingMotion = {
            type: clothIndex === 0 ? "clothline" : "cloth",
            seed: index * 1.2 + clothIndex,
            baseY: object.position.y,
            baseRotZ: object.rotation.z,
          };
          this.scene.add(object);
          this.livingMotionObjects.push(object);
        });
      }
    });
  }

  updateLivingWorldMotion(deltaSeconds = 0, playerPosition = null) {
    if (!this.livingMotionObjects.length) {
      return;
    }

    this.livingMotionTime += deltaSeconds;
    this.livingMotionTimer -= deltaSeconds;
    const lowFrequencyUpdate = this.performanceMode && this.livingMotionTimer > 0;
    if (lowFrequencyUpdate) {
      return;
    }
    this.livingMotionTimer = this.performanceMode ? 0.08 : 0;

    const wind = (this.lastWeatherProfile?.wind ?? 0) + (this.lastWeatherProfile?.rain ?? 0) * 0.25;
    const rain = this.lastWeatherProfile?.rain ?? 0;
    const duskGlow = THREE.MathUtils.smoothstep(this.dayNightState?.nightFactor ?? 0, 0.12, 0.75);
    this.livingMotionObjects.forEach((object) => {
      const motion = object.userData?.livingMotion;
      if (!motion) {
        return;
      }
      if (playerPosition) {
        const dx = object.position.x - playerPosition.x;
        const dz = object.position.z - playerPosition.z;
        object.visible = dx * dx + dz * dz < 210 * 210;
        if (!object.visible) {
          return;
        }
      }

      const t = this.livingMotionTime + motion.seed;
      if (motion.type === "smoke") {
        object.position.x = motion.baseX + Math.sin(t * 0.9) * (0.08 + wind * 0.18);
        object.position.y = motion.baseY + (Math.sin(t * 0.45) + 1) * 0.08;
        object.position.z = motion.baseZ + Math.cos(t * 0.7) * 0.06;
        object.scale.setScalar(1 + Math.sin(t * 0.8) * 0.08);
      } else if (motion.type === "leaf") {
        object.position.x += Math.sin(t * 1.4) * 0.002 + wind * 0.004;
        object.position.y -= 0.006 + wind * 0.003;
        object.rotation.x += 0.02;
        object.rotation.z += 0.014;
        const ground = this.terrain.getHeightAt(object.position.x, object.position.z) + 0.2;
        if (object.position.y < ground) {
          const angle = t * 2.1;
          object.position.x = motion.homeX + Math.cos(angle) * motion.radius * 0.55;
          object.position.z = motion.homeZ + Math.sin(angle) * motion.radius * 0.55;
          object.position.y = this.terrain.getHeightAt(object.position.x, object.position.z) + 3.2;
        }
      } else if (motion.type === "sway") {
        const sway = Math.sin(t * 1.8) * (0.055 + wind * 0.06);
        object.rotation.x = motion.baseRotX + sway;
        object.rotation.z = motion.baseRotZ + Math.cos(t * 1.2) * 0.035;
      } else if (motion.type === "lantern") {
        const pulse = 0.85 + duskGlow * 0.55 + Math.sin(t * 3.2) * 0.04;
        object.scale.setScalar(pulse);
        if (object.material?.emissive) {
          object.material.emissiveIntensity = 0.18 + duskGlow * 0.75;
        }
      } else if (motion.type === "puddle") {
        object.visible = rain > 0.05 || duskGlow > 0.35;
        object.material.opacity = THREE.MathUtils.lerp(object.material.opacity, 0.04 + rain * 0.22 + duskGlow * 0.025, 0.06);
        object.scale.x = 1.2 + rain * 0.45 + Math.sin(t * 1.8) * 0.015;
        object.scale.y = 0.72 + rain * 0.2;
      } else if (motion.type === "cloth" || motion.type === "clothline") {
        const gust = Math.sin(t * 2.4) * (0.018 + wind * 0.08);
        object.rotation.z = (motion.baseRotZ ?? 0) + gust;
        object.position.y = (motion.baseY ?? object.position.y) + Math.sin(t * 2.1) * (0.01 + wind * 0.03);
      }
    });
  }

  addRegionVistaFrames() {
    [
      { x: -8, z: 38, name: "forest", color: 0xffd166, yaw: 0.2 },
      { x: -116, z: 116, name: "frostpeak", color: 0x9fdcff, yaw: -0.25 },
      { x: 84, z: -80, name: "coastal", color: 0x5fd8ff, yaw: -0.62 },
      { x: 104, z: 84, name: "mistwood", color: 0x9dffd0, yaw: 0.28 },
      { x: -80, z: -70, name: "blackwater", color: 0x9af6b9, yaw: 0.18 },
      { x: 20, z: 132, name: "red-canyon", color: 0xffb45f, yaw: -0.16 },
      { x: -146, z: 150, name: "ashen", color: 0xff6a1d, yaw: 0.22 },
      { x: 142, z: 42, name: "starfall", color: 0xcdb7ff, yaw: 0.42 },
    ].forEach((vista) => this.addVistaComposition(vista));
  }

  addVistaComposition({ x, z, name, color, yaw }) {
    const y = this.terrain.getHeightAt(x, z);
    const material = this.materials.vistaGold.clone();
    material.color.setHex(color);
    material.emissive.setHex(color);
    material.emissiveIntensity = 0.16;
    const cairn = new THREE.Group();
    cairn.position.set(x, y, z);
    cairn.rotation.y = yaw;
    for (let index = 0; index < 3; index += 1) {
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 ? this.materials.stone : material);
      stone.position.set(0, 0.16 + index * 0.18, 0);
      stone.scale.set(0.72 - index * 0.12, 0.28, 0.54 - index * 0.08);
      stone.rotation.set(index * 0.24, index * 0.7, -0.08);
      cairn.add(stone);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.86, 0.42), material);
    banner.position.set(0.42, 0.92, -0.18);
    banner.rotation.z = -0.1;
    cairn.add(banner);
    this.scene.add(cairn);
    const glow = new THREE.PointLight(color, 0.45, 8, 2.4);
    glow.position.set(x, y + 1.1, z);
    glow.userData.visualPass = `${name}-vista`;
    this.scene.add(glow);
  }

  addLandmarkAccentLighting() {
    [
      [-24, 11, 0xffc579, 0.72, 9], [23, 20, 0x9dffd0, 0.5, 8], [27, -29, 0xe6b75d, 0.45, 7],
      [-56, 28, 0xffc579, 0.75, 10], [-74, 78, 0x9fdcff, 0.55, 9], [115, -92, 0xfff0c2, 0.7, 12],
      [104, 84, 0x8ff0b1, 0.56, 10], [-112, -96, 0x9af6b9, 0.52, 9], [16, 98, 0xffb45f, 0.5, 9],
      [-114, 126, 0xff6a1d, 0.62, 10], [142, 42, 0xcdb7ff, 0.78, 12], [166, 72, 0xfff0c2, 0.9, 13],
    ].forEach(([x, z, color, intensity, distance]) => {
      const light = new THREE.PointLight(color, intensity, distance, 2.2);
      light.position.set(x, this.terrain.getHeightAt(x, z) + 2.0, z);
      this.scene.add(light);
    });
  }

  addVillageVisualPolish() {
    const origin = this.archersGuild;
    if (!origin) return;
    [
      [-9.4, 3.6, 0xffc579], [-4.8, 7.2, 0xffd166], [0.8, 6.4, 0xffc579],
      [5.4, 5.4, 0xffd166], [10.6, 2.4, 0xffc579], [-12.2, -3.6, 0xff8a3d],
    ].forEach(([localX, localZ, color]) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addVillageLantern(point.x, point.z, color);
    });

    [
      [3.4, 5.4, this.materials.marketAwningRed], [5.5, 5.9, this.materials.marketAwningBlue], [6.8, 4.2, this.materials.banner],
    ].forEach(([localX, localZ, material], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addMarketAwnings(point.x, point.z, origin.yaw + index * 0.12, material);
    });

    [
      [-7.8, 4.2], [-6.2, 5.4], [8.8, 4.6], [10.4, 5.2], [-1.5, 8.4], [2.5, 8.1],
    ].forEach(([localX, localZ], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addGardenPatch(point.x, point.z, index);
    });
  }

  addVillageLantern(x, z, color = 0xffc579) {
    const y = this.terrain.getHeightAt(x, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.35, 6), this.materials.barkDark);
    post.position.set(x, y + 0.68, z);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.materials.warmWindow);
    lamp.position.set(x, y + 1.38, z);
    const light = new THREE.PointLight(color, 0.5, 6, 2.3);
    light.position.set(x, y + 1.38, z);
    this.scene.add(post, lamp, light);
  }

  addMarketAwnings(x, z, yaw, material) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const left = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.07, 1.18), material);
    left.position.set(-0.46, 1.54, 0);
    left.rotation.z = -0.18;
    const right = left.clone();
    right.position.x = 0.46;
    right.rotation.z = 0.18;
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.25, 6), this.materials.rope);
    ridge.position.y = 1.66;
    ridge.rotation.x = Math.PI / 2;
    [left, right, ridge].forEach((piece) => {
      piece.castShadow = true;
      group.add(piece);
    });
    const goods = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.42), this.materials.cutWood);
    goods.position.y = 0.72;
    group.add(goods);
    this.scene.add(group);
  }

  addGardenPatch(x, z, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.58, 10), index % 2 ? this.materials.grassLight : this.materials.leafAccent);
    patch.position.set(x, y + 0.035, z);
    patch.rotation.x = -Math.PI / 2;
    this.scene.add(patch);
    for (let petal = 0; petal < 4; petal += 1) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 5), this.materials.flower);
      const angle = petal * Math.PI * 0.5 + index * 0.2;
      flower.position.set(x + Math.sin(angle) * 0.32, y + 0.12, z + Math.cos(angle) * 0.32);
      this.scene.add(flower);
    }
  }

  addEnvironmentalStorytellingDetails() {
    [
      [-18, 45, 0.4, "forest"], [-93, 88, -0.25, "frost"], [96, -103, 0.8, "coast"],
      [92, 98, 0.15, "mist"], [-101, -68, -0.45, "marsh"], [-32, 126, 0.6, "canyon"], [-132, 112, -0.2, "ashen"],
    ].forEach(([x, z, yaw, style]) => this.addStorySilhouette(x, z, yaw, style));
  }

  addStorySilhouette(x, z, yaw, style) {
    const y = this.terrain.getHeightAt(x, z);
    const baseMaterial = style === "ashen" ? this.materials.obsidian : style === "frost" ? this.materials.frostRock : style === "coast" ? this.materials.weatheredDock : this.materials.agedWood;
    const cart = new THREE.Group();
    cart.position.set(x, y, z);
    cart.rotation.y = yaw;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.28), baseMaterial);
    beam.position.y = 0.22;
    beam.rotation.z = -0.08;
    cart.add(beam);
    [-0.72, 0.72].forEach((offset) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 16), this.materials.rope);
      wheel.position.set(offset, 0.22, 0.22);
      wheel.rotation.y = Math.PI / 2;
      cart.add(wheel);
    });
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.72, 5), style === "mist" ? this.materials.glowPlant : style === "marsh" ? this.materials.witchlight : this.materials.vistaGold);
    marker.position.set(0.78, 0.72, -0.14);
    cart.add(marker);
    this.scene.add(cart);
  }

  addReadablePathEdges() {
    [
      [-12, -8, 0.7, 7, "forest"], [-5, -14, 0.08, 8, "training"], [-16, 4, -0.76, 7, "watchtower"],
      [11, 8, 0.82, 7, "pond"], [15, -17, -0.58, 7, "ruins"], [-26, -13, 0.58, 6, "cabin"],
      [-8, 26, -0.08, 8, "cliff"], [-34, 18, -0.58, 7, "cave"], [-49, 19, -0.68, 7, "guild"],
      [128, -134, 0.36, 8, "frontier"], [-124, -135, -0.42, 7, "coast"], [-68, -126, -0.2, 7, "wilds"],
    ].forEach(([x, z, yaw, count, style], index) => this.addPathEdgeCluster(x, z, yaw, count, style, index));
  }

  addPathEdgeCluster(x, z, yaw, count = 6, style = "forest", seed = 0) {
    const rightX = Math.sin(yaw + Math.PI / 2);
    const rightZ = Math.cos(yaw + Math.PI / 2);
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const stoneMaterial = style === "coast" ? this.materials.cliffStone
      : style === "wilds" ? this.materials.mossStone
        : style === "frontier" ? this.materials.frontierStone
          : this.materials.stone;
    const grassMaterial = style === "wilds" ? this.materials.mistLeaf
      : style === "frontier" ? this.materials.frontierGrass
        : this.materials.grassLight;

    for (let index = 0; index < count; index += 1) {
      const along = (index - count * 0.5) * 1.0;
      const side = index % 2 === 0 ? -1 : 1;
      const px = x + forwardX * along + rightX * side * (0.9 + (index % 3) * 0.16);
      const pz = z + forwardZ * along + rightZ * side * (0.9 + (index % 3) * 0.16);
      const y = this.terrain.getHeightAt(px, pz);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 3 === 0 ? stoneMaterial : this.materials.darkStone);
      stone.position.set(px, y + 0.07, pz);
      stone.scale.set(0.22 + (index % 2) * 0.08, 0.08, 0.16 + (index % 3) * 0.04);
      stone.rotation.set(0.12, yaw + index * 0.48, -0.06);
      stone.receiveShadow = true;
      this.scene.add(stone);

      if (index % 2 === 0) {
        const tuft = new THREE.Mesh(this.geometries.grassBlade, grassMaterial);
        tuft.position.set(px - rightX * side * 0.28, y + 0.2, pz - rightZ * side * 0.28);
        tuft.scale.setScalar(0.7 + (seed % 3) * 0.08);
        tuft.rotation.set(0.08, yaw + index * 0.37, side * 0.1);
        tuft.castShadow = true;
        this.scene.add(tuft);
      }
    }
  }

  addLandmarkSilhouetteAccents() {
    [
      { x: -24, z: 11, yaw: -0.2, material: this.materials.cutWood, kind: "watch" },
      { x: 27, z: -29, yaw: 0.24, material: this.materials.ancientStone, kind: "ruin" },
      { x: -40, z: 25, yaw: -0.48, material: this.materials.caveStone, kind: "cave" },
      { x: -92, z: 74, yaw: -0.28, material: this.materials.ancientStone, kind: "fortress" },
      { x: -148, z: -146, yaw: -0.35, material: this.materials.kingdomStone, kind: "coast" },
      { x: -42, z: -148, yaw: 0.2, material: this.materials.mossStone, kind: "wilds" },
    ].forEach((accent) => this.addLandmarkAccentSilhouette(accent));
  }

  addLandmarkAccentSilhouette({ x, z, yaw, material, kind }) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const archMaterial = material ?? this.materials.ancientStone;

    if (kind === "cave") {
      [-1, 1].forEach((side) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.45, 6), archMaterial);
        fang.position.set(side * 2.15, 1.15, -1.1);
        fang.rotation.z = side * 0.2;
        group.add(fang);
      });
    } else {
      [-1, 1].forEach((side) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, kind === "fortress" ? 3.2 : 1.85, 8), archMaterial);
        pillar.position.set(side * (kind === "fortress" ? 4.2 : 2.1), kind === "fortress" ? 1.7 : 1.0, -1.15);
        pillar.rotation.z = side * 0.035;
        group.add(pillar);
      });
      const cap = new THREE.Mesh(new THREE.BoxGeometry(kind === "fortress" ? 5.2 : 2.8, 0.18, 0.34), kind === "watch" ? this.materials.cutWood : archMaterial);
      cap.position.set(0, kind === "fortress" ? 3.25 : 1.92, -1.16);
      cap.rotation.z = kind === "ruin" ? 0.08 : 0;
      group.add(cap);
    }

    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.06), kind === "wilds" ? this.materials.glowPlant : this.materials.banner);
    banner.position.set(kind === "fortress" ? 0 : 0.8, kind === "fortress" ? 2.55 : 1.45, -1.36);
    banner.rotation.z = 0.05;
    group.add(banner);
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
  }

  addForestFloorLayering() {
    [
      [-30, -5, 0.8, "forest"], [-18, 24, 1.2, "forest"], [31, 18, -0.4, "pond"],
      [45, 49, 0.2, "grove"], [95, 86, -0.25, "mist"], [-42, -142, 0.6, "wilds"],
    ].forEach(([x, z, yaw, style], index) => {
      const y = this.terrain.getHeightAt(x, z);
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.4, 9), style === "wilds" ? this.materials.elderBark : this.materials.bark);
      log.position.set(x, y + 0.18, z);
      log.rotation.set(Math.PI / 2, 0, yaw);
      log.castShadow = true;
      log.receiveShadow = true;
      this.scene.add(log);
      this.addFlowerPatch(x + Math.sin(yaw) * 0.9, z + Math.cos(yaw) * 0.7, 4 + (index % 3));
    });
  }

  addVillageLivedInDetails() {
    const origin = this.archersGuild;
    if (!origin) return;
    [
      [-13.0, 8.7, "laundry"], [-5.2, 11.0, "woodpile"], [6.6, 10.6, "garden"], [14.2, 1.1, "tools"],
      [-11.7, 1.8, "forge"], [9.2, -3.8, "bows"], [1.2, 9.2, "bench"],
    ].forEach(([localX, localZ, type], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addVillageLifeProp(point.x, point.z, origin.yaw + index * 0.12, type);
    });
  }

  addVillageLifeProp(x, z, yaw, type) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;

    if (type === "laundry") {
      [-0.8, 0.8].forEach((offset) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 6), this.materials.barkDark);
        post.position.set(offset, 0.55, 0);
        group.add(post);
      });
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 5), this.materials.rope);
      line.position.y = 1.05;
      line.rotation.z = Math.PI / 2;
      group.add(line);
      [-0.35, 0.2, 0.55].forEach((offset, index) => {
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.035), index % 2 ? this.materials.parchment : this.materials.banner);
        cloth.position.set(offset, 0.84, 0.02);
        group.add(cloth);
      });
    } else if (type === "woodpile" || type === "forge" || type === "bows") {
      for (let index = 0; index < 4; index += 1) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, type === "bows" ? 0.86 : 0.7, 6), type === "forge" ? this.materials.obsidian : this.materials.cutWood);
        log.position.set((index - 1.5) * 0.18, 0.16 + index * 0.045, 0);
        log.rotation.set(Math.PI / 2, 0, yaw + index * 0.18);
        group.add(log);
      }
    } else if (type === "garden") {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.74), this.materials.darkStone);
      bed.position.y = 0.08;
      group.add(bed);
      for (let index = 0; index < 5; index += 1) {
        const plant = new THREE.Mesh(this.geometries.grassBlade, index % 2 ? this.materials.flower : this.materials.grassLight);
        plant.position.set(-0.48 + index * 0.24, 0.28, Math.sin(index) * 0.18);
        plant.scale.setScalar(0.72);
        group.add(plant);
      }
    } else {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.36), this.materials.cutWood);
      bench.position.y = 0.4;
      group.add(bench);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
  }

  addMarketMasterpassDetails() {
    const origin = this.archersGuild;
    if (!origin) return;
    [
      [2.3, 9.2, 0xe8bc66, "fruit"], [5.6, 11.7, 0xd7bd83, "cloth"], [7.6, 9.5, 0xffc579, "tools"],
      [3.7, 13.0, 0x9fdcff, "fish"],
    ].forEach(([localX, localZ, color, type], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addDisplayedMarketGoods(point.x, point.z, origin.yaw + index * 0.24, color, type);
    });
  }

  addDisplayedMarketGoods(x, z, yaw, color, type) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.72, emissive: color, emissiveIntensity: 0.04 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.54), this.materials.cutWood);
    crate.position.y = 0.18;
    group.add(crate);
    for (let index = 0; index < 5; index += 1) {
      const good = type === "cloth"
        ? new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.38), material)
        : new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), material);
      good.position.set(-0.32 + index * 0.16, 0.4 + (index % 2) * 0.05, Math.sin(index) * 0.13);
      group.add(good);
    }
    this.scene.add(group);
  }

  addRegionalAtmosphereAccents() {
    [
      [-120, 118, 0x9fdcff, "snow"], [98, -98, 0x5fd8ff, "sea"], [96, 84, 0x8ff0b1, "mist"],
      [-110, -84, 0x9af6b9, "marsh"], [18, 126, 0xffb45f, "dust"], [-132, 132, 0xff6a1d, "ash"],
      [142, 42, 0xcdb7ff, "star"],
    ].forEach(([x, z, color, type], index) => this.addAtmosphereMotif(x, z, color, type, index));
  }

  addAtmosphereMotif(x, z, color, type, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.08, z);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: type === "dust" || type === "ash" ? 0.18 : 0.34, depthWrite: false });
    const count = type === "star" ? 7 : 5;
    for (let index = 0; index < count; index += 1) {
      const angle = seed + index * 2.399;
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (index % 3) * 0.025, 8, 5), material);
      mote.position.set(Math.sin(angle) * (0.8 + index * 0.18), 0.45 + index * 0.18, Math.cos(angle) * (0.7 + index * 0.14));
      group.add(mote);
    }
    this.scene.add(group);
  }

  addHandcraftedArchitectureOverlays() {
    const buildings = [
      ...(this.villageBuildings ?? []),
      ...(this.settlementBuildings ?? []),
    ].slice(0, 32);

    buildings.forEach((building, index) => this.addArchitectureDetailOverlay(building, index));
    if (this.archersGuild) {
      const point = this.getGuildPoint(this.archersGuild, 0, -1.6);
      this.addArchitectureDetailOverlay({
        id: "guild-hall-master-front",
        label: "Guild Hall",
        position: new THREE.Vector3(point.x, this.terrain.getHeightAt(point.x, point.z), point.z),
        yaw: this.archersGuild.yaw,
        width: 7.2,
        depth: 4.7,
      }, 99);
    }
  }

  addArchitectureDetailOverlay(building, index = 0) {
    if (!building?.position) return;
    const group = new THREE.Group();
    group.position.copy(building.position);
    group.rotation.y = building.yaw ?? 0;
    const width = building.width ?? 3.6;
    const depth = building.depth ?? 2.8;
    const frontZ = -depth * 0.515;
    const trim = /smith/i.test(building.label ?? "") ? this.materials.emberRock : /bow/i.test(building.label ?? "") ? this.materials.targetGold : this.materials.warmTrim;
    const beam = /coast|harbor/i.test(`${building.id} ${building.label}`) ? this.materials.weatheredDock : this.materials.barkDark;

    [-1, 1].forEach((side) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.12), beam);
      bracket.position.set(side * width * 0.46, 1.08, frontZ - 0.045);
      bracket.rotation.z = side * 0.1;
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.1), beam);
      brace.position.set(side * width * 0.31, 1.55, frontZ - 0.065);
      brace.rotation.z = side * 0.65;
      group.add(bracket, brace);
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.12, 0.12), trim);
    lintel.position.set(0, 1.46, frontZ - 0.075);
    lintel.rotation.z = Math.sin(index) * 0.035;
    group.add(lintel);

    [-0.31, 0.31].forEach((offset, windowIndex) => {
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.06), this.materials.warmWindow);
      windowFrame.position.set(offset * width, 1.08 + (index % 2) * 0.08, frontZ - 0.075);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.12), trim);
      sill.position.set(offset * width, 0.84 + (index % 2) * 0.08, frontZ - 0.095);
      sill.rotation.z = (windowIndex ? -1 : 1) * 0.025;
      group.add(windowFrame, sill);
    });

    if (index % 3 !== 1) {
      const awning = this.createLayeredGableRoof(width * 0.34, depth * 0.32, 1.78, index % 2 ? this.materials.canvas : this.materials.marketAwningRed, {
        pitch: 0.28,
        overhang: 0.12,
        shingleRows: 1,
        asymmetry: Math.sin(index) * 0.03,
      });
      awning.position.set(-width * 0.28, 0, frontZ - 0.06);
      awning.scale.set(0.68, 0.68, 0.68);
      group.add(awning);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.detailObject = true;
      }
    });
    this.scene.add(group);
  }

  addInteriorDetailSet(group, width, depth, height, role = "home", options = {}) {
    const trim = options.trim ?? this.materials.warmTrim;
    const wood = options.wood ?? this.materials.cutWood;
    const dark = options.dark ?? this.materials.barkDark;
    const cloth = options.cloth ?? this.materials.parchment;
    const glow = options.glow ?? this.materials.warmWindow;
    const backZ = depth * 0.34;
    const sideX = width * 0.36;

    const rug = new THREE.Mesh(new THREE.BoxGeometry(width * 0.54, 0.035, depth * 0.34), role === "smith" ? this.materials.darkStone : role === "bowyer" ? this.materials.groundPath : cloth);
    rug.position.set(0, 0.25, 0.05);
    rug.rotation.y = Math.sin(width + depth) * 0.04;
    group.add(rug);

    const table = new THREE.Mesh(new THREE.BoxGeometry(width * 0.28, 0.12, depth * 0.22), wood);
    table.position.set(-sideX * 0.55, 0.72, backZ * 0.35);
    table.rotation.y = -0.08;
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.58, 6), dark);
    tableLeg.position.set(table.position.x, 0.44, table.position.z);
    group.add(table, tableLeg);

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.16, Math.max(0.78, height * 0.36), depth * 0.42), dark);
    shelf.position.set(sideX, 0.94, backZ * 0.15);
    shelf.rotation.y = -0.04;
    group.add(shelf);
    for (let index = 0; index < 3; index += 1) {
      const item = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18 + index * 0.035, 0.08), index % 2 ? trim : cloth);
      item.position.set(sideX - 0.1, 0.62 + index * 0.22, backZ * 0.15 - depth * 0.14 + index * depth * 0.12);
      item.rotation.y = -0.04;
      group.add(item);
    }

    if (role === "inn") {
      [-0.22, 0.24].forEach((offset, index) => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(width * 0.32, 0.16, 0.34), wood);
        bench.position.set(offset * width, 0.54, -depth * 0.16 - index * 0.16);
        bench.rotation.y = offset * -0.25;
        group.add(bench);
      });
      const hearth = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.16), this.materials.darkStone);
      hearth.position.set(-sideX, 0.62, depth * 0.18);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 6), this.materials.lavaGlow ?? glow);
      fire.position.set(-sideX, 0.88, depth * 0.1);
      group.add(hearth, fire);
    } else if (role === "smith") {
      const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.32), this.materials.obsidian ?? this.materials.darkStone);
      anvil.position.set(0.04, 0.52, -depth * 0.12);
      const forge = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.2), this.materials.lavaGlow ?? glow);
      forge.position.set(-sideX, 0.64, depth * 0.16);
      group.add(anvil, forge);
    } else if (role === "bowyer") {
      [-0.18, 0.18].forEach((offset) => {
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.01, 6, 18, Math.PI * 1.35), trim);
        bow.position.set(sideX * 0.8, 0.88, offset * depth);
        bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
        group.add(bow);
      });
      const fletching = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 3), this.materials.banner);
      fletching.position.set(-sideX * 0.35, 0.86, -depth * 0.18);
      fletching.rotation.x = Math.PI / 2;
      group.add(fletching);
    } else if (role === "shop" || role === "storage") {
      [-0.32, 0, 0.32].forEach((offset, index) => {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.3), index % 2 ? this.materials.wood : this.materials.cutWood);
        crate.position.set(offset * width, 0.42, depth * 0.12 + index * 0.08);
        crate.rotation.y = index * 0.12;
        group.add(crate);
      });
    } else {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, 0.14, depth * 0.34), cloth);
      bed.position.set(-sideX, 0.47, depth * 0.12);
      bed.rotation.y = 0.08;
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, 0.08, depth * 0.12), this.materials.canvas ?? cloth);
      pillow.position.set(-sideX, 0.59, depth * 0.25);
      pillow.rotation.y = 0.08;
      group.add(bed, pillow);
    }

    [-1, 1].forEach((side) => {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), glow);
      lantern.position.set(side * sideX, Math.min(height + 0.2, 1.65), -depth * 0.2);
      group.add(lantern);
    });

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.detailObject = true;
      }
    });
  }

  addLandmarkCompositionBrushstrokes() {
    [
      [-24, 11, -0.2, "watch", 1.05], [23, 20, 0.4, "pond", 0.82], [27, -29, 0.24, "ruin", 1.0],
      [-38, 9, -0.5, "cabin", 0.9], [-40, 25, -0.48, "cave", 0.95], [-92, 74, -0.25, "fortress", 1.35],
      [-148, -146, -0.35, "coast", 1.1], [-42, -148, 0.2, "wilds", 1.05], [142, 42, 0.22, "star", 1.0],
    ].forEach(([x, z, yaw, style, scale], index) => this.addLandmarkCompositionAccent(x, z, yaw, style, scale, index));
  }

  addLandmarkCompositionAccent(x, z, yaw, style, scale = 1, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const stone = style === "fortress" ? this.materials.kingdomDarkStone
      : style === "coast" ? this.materials.cliffStone
        : style === "wilds" ? this.materials.mossStone
          : style === "star" ? this.materials.celestialStone
            : this.materials.ancientStone;
    const accent = style === "pond" || style === "wilds" ? this.materials.glowPlant : style === "cave" ? this.materials.crystalBlue : this.materials.vistaGold;

    [-1, 1].forEach((side) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.2 * scale, (1.1 + (seed % 3) * 0.22) * scale, 7), stone);
      pillar.position.set(side * (1.5 + scale * 0.35), 0.55 * scale, -1.2 * scale);
      pillar.rotation.z = side * (0.08 + seed * 0.006);
      group.add(pillar);
      const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 * scale, 0), stone);
      cap.position.set(pillar.position.x, pillar.position.y + 0.68 * scale, pillar.position.z);
      cap.scale.set(1.2, 0.6, 0.9);
      group.add(cap);
    });

    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.28 * scale, 0.025 * scale, 7, 24), accent);
    marker.position.set(0, 1.12 * scale, -1.26 * scale);
    marker.rotation.x = Math.PI / 2;
    group.add(marker);

    if (style === "fortress" || style === "coast") {
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.24 * scale, 0.92 * scale, 0.05), this.materials.banner);
      banner.position.set(0.42 * scale, 0.9 * scale, -1.32 * scale);
      banner.rotation.z = 0.07;
      group.add(banner);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
  }

  addTerrainColorBrushstrokes() {
    const patches = [
      [-15, 4, 8.4, 3.2, 0.58, this.materials.grassLight], [12, -15, 7.6, 2.6, -0.52, this.materials.groundPath ?? this.materials.cutWood],
      [-63, 26, 12, 3.6, -0.55, this.materials.groundPath ?? this.materials.cutWood], [124, -135, 11, 3.2, 0.32, this.materials.frontierRoad],
      [-126, -140, 10, 2.8, -0.4, this.materials.sand], [-72, -128, 9, 3.1, -0.2, this.materials.visibleTrail],
      [96, 86, 8, 3.2, 0.16, this.materials.mistLeaf], [-116, 126, 10, 3.6, -0.3, this.materials.ashField],
    ];
    patches.forEach(([x, z, width, depth, yaw, material], index) => {
      const y = this.terrain.getHeightAt(x, z);
      const patchMaterial = material.clone?.() ?? material;
      if (patchMaterial) {
        patchMaterial.transparent = true;
        patchMaterial.opacity = Math.min(patchMaterial.opacity ?? 1, index % 2 ? 0.42 : 0.5);
        patchMaterial.depthWrite = false;
      }
      const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 24), patchMaterial);
      patch.position.set(x, y + 0.022 + index * 0.001, z);
      patch.rotation.set(-Math.PI / 2, 0, yaw);
      patch.scale.set(width, depth, 1);
      patch.receiveShadow = true;
      patch.userData.detailObject = true;
      this.scene.add(patch);
    });
  }

  addTerrainMasterpiecePass() {
    this.addIntegratedRoadShoulders();
    this.addBiomeTransitionBrushstrokes();
    this.addGeologyMasterpieceAccents();
    this.addRiverbankAndCoastlineDetails();
    this.addPathsAndWaterMasterpiecePass();
    this.addScenicVistaFrames();
  }

  addPathsAndWaterMasterpiecePass() {
    this.addWindingRouteMasterpieceOverlays();
    this.addWaterShorelineMasterpieceDetails();
    this.addBridgeAndCrossingMasterpieceDetails();
  }

  addWindingRouteMasterpieceOverlays() {
    const routes = [
      {
        style: "forest",
        material: this.materials.groundPath ?? this.materials.cutWood,
        width: 2.6,
        points: [[-18, -8], [-12, -3], [-17, 8], [-25, 15], [-34, 20], [-45, 24], [-56, 28]],
      },
      {
        style: "pond",
        material: this.materials.visibleTrail,
        width: 2.15,
        points: [[2, 4], [8, 7], [15, 10], [24, 14], [31, 18]],
      },
      {
        style: "river",
        material: this.materials.groundPath ?? this.materials.cutWood,
        width: 2.4,
        points: [[30, -3], [39, 0], [50, 4], [62, 4], [72, 8]],
      },
      {
        style: "frontier",
        material: this.materials.frontierRoad,
        width: 2.7,
        points: [[112, -119], [123, -130], [134, -139], [143, -150], [154, -157]],
      },
      {
        style: "coast",
        material: this.materials.sand,
        width: 2.45,
        points: [[-112, -126], [-126, -134], [-140, -143], [-153, -150], [-168, -154]],
      },
      {
        style: "mountain",
        material: this.materials.visibleTrail,
        width: 2.2,
        points: [[-55, 31], [-65, 42], [-76, 57], [-86, 70], [-92, 84]],
      },
    ];

    routes.forEach((route, routeIndex) => {
      this.addWindingRouteOverlay(route.points, route.width, route.material, route.style, routeIndex);
      if (!this.performanceMode) {
        route.points.forEach(([x, z], pointIndex) => {
          if (pointIndex % 2 === 0) {
            this.addPathEdgeCluster(x, z, Math.sin(routeIndex + pointIndex) * 0.8, 3, route.style, routeIndex * 7 + pointIndex);
          }
        });
      }
    });
  }

  addWindingRouteOverlay(points, width, material, style = "forest", seed = 0) {
    const routeMaterial = material.clone?.() ?? material;
    if (routeMaterial) {
      routeMaterial.transparent = true;
      routeMaterial.opacity = Math.min(routeMaterial.opacity ?? 1, style === "coast" ? 0.58 : 0.46);
      routeMaterial.depthWrite = false;
      routeMaterial.needsUpdate = true;
    }

    for (let index = 0; index < points.length - 1; index += 1) {
      const [ax, az] = points[index];
      const [bx, bz] = points[index + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const length = Math.hypot(dx, dz);
      if (length <= 0.01) continue;
      const yaw = Math.atan2(dx, dz);
      const sideX = Math.sin(yaw + Math.PI / 2);
      const sideZ = Math.cos(yaw + Math.PI / 2);
      const pieces = Math.max(2, Math.round(length / 5));
      for (let piece = 0; piece < pieces; piece += 1) {
        const t = (piece + 0.5) / pieces;
        const bend = Math.sin((t + seed * 0.17) * Math.PI * 2 + index) * width * 0.22;
        const x = ax + dx * t + sideX * bend;
        const z = az + dz * t + sideZ * bend;
        const y = this.terrain.getHeightAt(x, z);
        const segment = new THREE.Mesh(new THREE.CircleGeometry(1, 22), routeMaterial);
        segment.position.set(x, y + 0.044 + (seed + index + piece) * 0.0006, z);
        segment.rotation.set(-Math.PI / 2, 0, yaw + Math.sin(piece + seed) * 0.08);
        segment.scale.set(width * (0.92 + (piece % 2) * 0.08), Math.max(1.6, length / pieces * 0.58), 1);
        segment.receiveShadow = true;
        segment.userData.terrain = true;
        this.scene.add(segment);
      }
    }
  }

  addWaterShorelineMasterpieceDetails() {
    const shorelines = [
      { x: this.hiddenPond?.x ?? 28, z: this.hiddenPond?.z ?? 17, rx: 5.4, rz: 3.7, yaw: 0.08, style: "pond", water: this.materials.water },
      { x: this.hiddenLake?.x ?? -18, z: this.hiddenLake?.z ?? -142, rx: 6.4, rz: 5.6, yaw: -0.1, style: "lake", water: this.materials.water },
      { x: 143, z: -145, rx: 13.8, rz: 2.9, yaw: -0.18, style: "river", water: this.materials.frontierWater },
      { x: 53, z: 2.5, rx: 20.5, rz: 3.1, yaw: 0.08, style: "river", water: this.materials.water },
      { x: 136, z: -118, rx: 46, rz: 34, yaw: -0.04, style: "coast", water: this.materials.seaWater },
      { x: -184, z: -150, rx: 36, rz: 43, yaw: 0.03, style: "coast", water: this.materials.seaWater },
      { x: -108, z: -84, rx: 12, rz: 5.8, yaw: 0.2, style: "marsh", water: this.materials.swampWater },
      { x: 80, z: 154, rx: 9.5, rz: 4.5, yaw: 0.16, style: "star", water: this.materials.starWater },
    ];

    shorelines.forEach((shoreline, index) => {
      this.addNaturalShoreline(shoreline, index);
      this.addWaterRippleSet(shoreline, index);
    });
  }

  addNaturalShoreline({ x, z, rx, rz, yaw = 0, style = "pond" }, seed = 0) {
    const material = style === "coast" ? this.materials.sand
      : style === "marsh" ? this.materials.swampMud
        : style === "star" ? this.materials.crystalSand
          : this.materials.wetShore;
    const ringMaterial = material.clone?.() ?? material;
    if (ringMaterial) {
      ringMaterial.transparent = true;
      ringMaterial.opacity = Math.min(ringMaterial.opacity ?? 1, style === "coast" ? 0.36 : 0.42);
      ringMaterial.depthWrite = false;
      ringMaterial.needsUpdate = true;
    }
    const count = this.performanceMode ? 8 : 14;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const wobble = 1 + Math.sin(seed * 1.7 + index * 1.31) * 0.08;
      const localX = Math.sin(angle) * rx * wobble;
      const localZ = Math.cos(angle) * rz * (1 + Math.cos(seed + index) * 0.06);
      const rotatedX = x + Math.sin(yaw + Math.PI / 2) * localX + Math.sin(yaw) * localZ;
      const rotatedZ = z + Math.cos(yaw + Math.PI / 2) * localX + Math.cos(yaw) * localZ;
      const y = this.terrain.getHeightAt(rotatedX, rotatedZ);
      const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 14), ringMaterial);
      patch.position.set(rotatedX, y + 0.038 + index * 0.0005, rotatedZ);
      patch.rotation.set(-Math.PI / 2, 0, yaw + angle + Math.sin(index) * 0.18);
      patch.scale.set(1.2 + (index % 3) * 0.28, 0.34 + (index % 2) * 0.14, 1);
      patch.receiveShadow = true;
      patch.userData.terrain = true;
      this.scene.add(patch);
    }
  }

  addWaterRippleSet({ x, z, rx, rz, yaw = 0, style = "pond", water }, seed = 0) {
    const rippleMaterial = style === "coast" ? this.materials.seaFoam : this.materials.riverFoam;
    const count = this.performanceMode ? 3 : 6;
    for (let index = 0; index < count; index += 1) {
      const offset = (index - count * 0.5) / Math.max(1, count);
      const px = x + Math.sin(yaw + Math.PI / 2) * offset * rx * 0.9 + Math.sin(seed + index) * rx * 0.08;
      const pz = z + Math.cos(yaw + Math.PI / 2) * offset * rx * 0.9 + Math.cos(seed * 0.8 + index) * rz * 0.08;
      const y = this.terrain.getHeightAt(px, pz) + 0.095 + index * 0.004;
      const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.62 + index * 0.1, 0.012, 6, 36), rippleMaterial);
      ripple.position.set(px, y, pz);
      ripple.rotation.set(-Math.PI / 2, 0, yaw + Math.sin(seed + index) * 0.2);
      ripple.scale.set(Math.max(0.8, rx * 0.08), Math.max(0.45, rz * 0.08), 1);
      ripple.userData.detailObject = true;
      this.scene.add(ripple);
    }

    if (water?.color && style !== "coast") {
      water.needsUpdate = true;
    }
  }

  addBridgeAndCrossingMasterpieceDetails() {
    [
      { x: this.riverCrossing?.x ?? 52, z: this.riverCrossing?.z ?? 2, yaw: this.riverCrossing?.yaw ?? -0.12, style: "river" },
      { x: this.greenwaterCrossing?.x ?? 161, z: this.greenwaterCrossing?.z ?? -132, yaw: this.greenwaterCrossing?.yaw ?? -0.62, style: "frontier" },
      { x: this.windspireBridge?.x ?? 108, z: this.windspireBridge?.z ?? -94, yaw: this.windspireBridge?.yaw ?? 0.2, style: "coast" },
    ].forEach((crossing, index) => this.addCrossingApproachDetails(crossing, index));
  }

  addCrossingApproachDetails({ x, z, yaw, style }, seed = 0) {
    const material = style === "coast" ? this.materials.weatheredDock : style === "frontier" ? this.materials.frontierRoad : this.materials.cutWood;
    const shoulder = style === "coast" ? this.materials.sand : this.materials.groundPath ?? this.materials.cutWood;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    [-1, 1].forEach((side) => {
      const padX = x + forwardX * side * 4.2;
      const padZ = z + forwardZ * side * 4.2;
      this.addTerrainBlendOval(padX, padZ, 4.2, 1.4, yaw, shoulder, 0.34, seed + side + 91);
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.82, 7), material);
      marker.position.set(
        padX + Math.sin(yaw + Math.PI / 2) * 1.8,
        this.terrain.getHeightAt(padX, padZ) + 0.42,
        padZ + Math.cos(yaw + Math.PI / 2) * 1.8,
      );
      marker.rotation.z = side * 0.08;
      marker.castShadow = true;
      marker.userData.detailObject = true;
      this.scene.add(marker);
    });
  }

  addIntegratedRoadShoulders() {
    [
      [-12, -8, 10.5, 2.1, 0.68, "forest"],
      [-28, 14, 11.5, 2.0, -0.62, "forest"],
      [-6, 34, 8.4, 1.8, -0.22, "cliff"],
      [50, 5, 10.0, 2.2, 0.54, "river"],
      [126, -134, 13.0, 2.4, 0.34, "frontier"],
      [-68, -126, 12.0, 2.2, -0.22, "wilds"],
      [-124, -136, 11.4, 2.0, -0.42, "coast"],
      [18, 126, 13.5, 2.2, 0.08, "canyon"],
      [-116, 128, 12.5, 2.4, -0.34, "ash"],
      [78, 154, 11.2, 2.0, 0.18, "star"],
    ].forEach(([x, z, width, depth, yaw, style], index) => {
      const material = style === "coast" ? this.materials.sand
        : style === "canyon" ? this.materials.canyonTrail
          : style === "ash" ? this.materials.ashField
            : style === "star" ? this.materials.crystalSand
              : style === "wilds" ? this.materials.visibleTrail
                : this.materials.groundPath ?? this.materials.cutWood;
      this.addTerrainBlendOval(x, z, width, depth, yaw, material, 0.3 + (index % 2) * 0.08, index);
      this.addPathEdgeCluster(x, z, yaw, this.performanceMode ? 3 : 5, style, index + 13);
    });
  }

  addBiomeTransitionBrushstrokes() {
    [
      [72, -60, 18, 8, -0.56, this.materials.seaGrass, "forest-to-coast"],
      [-24, 76, 18, 7, 0.12, this.materials.frostRock, "forest-to-frost"],
      [-82, 132, 20, 8, -0.22, this.materials.ashField, "forest-to-ash"],
      [62, 58, 19, 8, 0.3, this.materials.mistLeaf, "forest-to-star"],
      [-78, -108, 18, 7, 0.08, this.materials.mossStone, "marsh-to-wilds"],
      [74, -126, 18, 7, -0.34, this.materials.kingdomStone, "frontier-to-kingdom"],
    ].forEach(([x, z, width, depth, yaw, material, id], index) => {
      this.addTerrainBlendOval(x, z, width, depth, yaw, material, 0.24, index + 31);
      if (!this.performanceMode) {
        this.addTransitionPebbleTrail(x, z, yaw, id, index);
      }
    });
  }

  addTerrainBlendOval(x, z, width, depth, yaw, material, opacity = 0.32, seed = 0) {
    const patchMaterial = material.clone?.() ?? material;
    if (patchMaterial) {
      patchMaterial.transparent = true;
      patchMaterial.opacity = Math.min(patchMaterial.opacity ?? 1, opacity);
      patchMaterial.depthWrite = false;
      patchMaterial.needsUpdate = true;
    }
    const y = this.terrain.getHeightAt(x, z);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 24), patchMaterial);
    patch.position.set(x, y + 0.034 + seed * 0.0008, z);
    patch.rotation.set(-Math.PI / 2, 0, yaw);
    patch.scale.set(width, depth, 1);
    patch.receiveShadow = true;
    patch.userData.terrain = true;
    this.scene.add(patch);
  }

  addTransitionPebbleTrail(x, z, yaw, id, seed = 0) {
    const styleMaterial = id.includes("coast") ? this.materials.cliffStone
      : id.includes("ash") ? this.materials.obsidian
        : id.includes("kingdom") ? this.materials.kingdomStone
          : id.includes("frost") ? this.materials.frostRock
            : this.materials.mossStone;
    for (let index = 0; index < 7; index += 1) {
      const lateral = (index - 3) * 1.1;
      const forward = Math.sin(index + seed) * 1.4;
      const px = x + Math.sin(yaw + Math.PI / 2) * lateral + Math.sin(yaw) * forward;
      const pz = z + Math.cos(yaw + Math.PI / 2) * lateral + Math.cos(yaw) * forward;
      const y = this.terrain.getHeightAt(px, pz);
      const pebble = new THREE.Mesh(this.geometries.pebble, index % 2 ? styleMaterial : this.materials.stone);
      pebble.position.set(px, y + 0.08, pz);
      pebble.scale.set(0.22 + (index % 3) * 0.05, 0.08, 0.18);
      pebble.rotation.set(0.12, yaw + index * 0.45, -0.04);
      pebble.castShadow = true;
      pebble.receiveShadow = true;
      pebble.userData.detailObject = true;
      this.scene.add(pebble);
    }
  }

  addGeologyMasterpieceAccents() {
    [
      [-8, 44, 1.55, "cliff", 0],
      [-94, 82, 1.9, "mountain", 1],
      [4, 136, 2.0, "canyon", 2],
      [29, 132, 1.55, "canyon", 3],
      [-138, 124, 1.75, "ash", 4],
      [-150, -148, 1.65, "coast", 5],
      [84, 154, 1.5, "star", 6],
    ].forEach(([x, z, scale, style, seed]) => {
      const material = style === "canyon" ? this.materials.canyonRock
        : style === "ash" ? this.materials.obsidian
          : style === "coast" ? this.materials.cliffStone
            : style === "star" ? this.materials.celestialStone
              : this.materials.frostRock ?? this.materials.stone;
      this.addOrganicRockCluster(x, z, scale, seed, material);
      if (!this.performanceMode) {
        this.addStrataShelf(x + Math.sin(seed) * 1.4, z + Math.cos(seed) * 1.2, scale, seed, material);
      }
    });
  }

  addStrataShelf(x, z, scale, seed, material) {
    const group = new THREE.Group();
    group.position.set(x, this.terrain.getHeightAt(x, z), z);
    group.rotation.y = seed * 0.42;
    for (let index = 0; index < 3; index += 1) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(scale * (1.5 - index * 0.22), 0.12, scale * (0.55 - index * 0.06)), material);
      shelf.position.set(Math.sin(index + seed) * scale * 0.18, 0.12 + index * 0.16, Math.cos(index) * scale * 0.12);
      shelf.rotation.set(0.05, index * 0.08, -0.04 + index * 0.03);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      shelf.userData.detailObject = true;
      group.add(shelf);
    }
    this.scene.add(group);
  }

  addRiverbankAndCoastlineDetails() {
    [
      [42, 3.8, 0.2, "river"], [50, 1.2, -0.1, "river"], [58, 5.4, 0.34, "river"],
      [-158, -136, -0.28, "coast"], [-168, -158, 0.18, "coast"], [-140, -168, -0.12, "coast"],
    ].forEach(([x, z, yaw, style], index) => {
      const material = style === "coast" ? this.materials.seaGrass : this.materials.grassLight;
      this.addBankGrassCluster(x, z, yaw, material, index);
    });
  }

  addBankGrassCluster(x, z, yaw, material, seed = 0) {
    const count = this.performanceMode ? 4 : 8;
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 ? 1 : -1;
      const px = x + Math.sin(yaw + Math.PI / 2) * side * (0.35 + index * 0.16) + Math.sin(seed + index) * 0.25;
      const pz = z + Math.cos(yaw + Math.PI / 2) * side * (0.35 + index * 0.16) + Math.cos(seed + index) * 0.25;
      const y = this.terrain.getHeightAt(px, pz);
      const reed = new THREE.Mesh(this.geometries.grassBlade, material);
      reed.position.set(px, y + 0.2, pz);
      reed.scale.set(0.78, 1.0 + (index % 3) * 0.18, 0.78);
      reed.rotation.set(0.08, yaw + index * 0.26, side * 0.14);
      reed.castShadow = true;
      reed.userData.detailObject = true;
      this.scene.add(reed);
    }
  }

  addScenicVistaFrames() {
    [
      [-8, 39, -0.1, "cliff"],
      [-6, 70, 0.18, "mountain"],
      [-92, 86, -0.26, "fortress"],
      [2, 143, 0.34, "canyon"],
      [-148, -150, -0.32, "coast"],
      [142, 45, 0.16, "star"],
    ].forEach(([x, z, yaw, style], index) => {
      const material = style === "canyon" ? this.materials.canyonRock
        : style === "coast" ? this.materials.cliffStone
          : style === "star" ? this.materials.stellarGold
            : style === "fortress" ? this.materials.kingdomDarkStone
              : this.materials.ancientStone;
      const y = this.terrain.getHeightAt(x, z);
      const frame = new THREE.Group();
      frame.position.set(x, y, z);
      frame.rotation.y = yaw;
      [-1, 1].forEach((side) => {
        const stone = new THREE.Mesh(this.geometries.pebble, material);
        stone.position.set(side * 1.3, 0.18, -0.5);
        stone.scale.set(0.62, 0.24, 0.38);
        stone.rotation.set(0.08, side * 0.3, side * 0.08);
        frame.add(stone);
      });
      const wornGround = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), this.materials.groundPath ?? this.materials.cutWood);
      wornGround.position.y = 0.035;
      wornGround.rotation.x = -Math.PI / 2;
      wornGround.scale.set(1.4, 0.7, 1);
      wornGround.userData.terrain = true;
      frame.add(wornGround);
      frame.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.detailObject = !child.userData.terrain;
        }
      });
      this.scene.add(frame);
      if (!this.performanceMode && index % 2 === 0) {
        this.addAtmosphereMotif(x, z, 0xffd166, "vista", index);
      }
    });
  }

  addForestUnderstoryMasterpass() {
    [
      [-20, 15, 8, "forest"], [-2, 22, 7, "forest"], [32, 22, 7, "pond"], [-36, 12, 7, "cabin"],
      [-66, 34, 8, "guild"], [80, 94, 9, "mist"], [-54, -144, 9, "wilds"], [-108, -82, 8, "marsh"],
    ].forEach(([x, z, radius, style], seed) => this.addUnderstoryCluster(x, z, radius, style, seed));
  }

  addForestMasterpiecePass() {
    this.addHandcraftedForestGroves();
    this.addForestTerrainBlendPatches();
    this.addForestRockAndRootCompositions();
    this.addForestStorytellingVignettes();
    this.addForestAtmosphereAccents();
  }

  addHandcraftedForestGroves() {
    [
      { center: [-25, 20], radius: 6.8, count: 5, style: "meadow", gapAngle: 0.25 },
      { center: [25, 16], radius: 6.2, count: 4, style: "pond", gapAngle: -0.7 },
      { center: [-42, 20], radius: 5.6, count: 4, style: "cabin", gapAngle: 0.9 },
      { center: [86, 91], radius: 8.2, count: 6, style: "mist", gapAngle: 1.5 },
      { center: [-50, -142], radius: 8.8, count: 6, style: "wilds", gapAngle: -0.35 },
    ].forEach((grove, seed) => this.addHandcraftedForestGrove(grove, seed));
  }

  addHandcraftedForestGrove(grove, seed = 0) {
    const [centerX, centerZ] = grove.center;
    for (let index = 0; index < grove.count; index += 1) {
      const t = index / Math.max(1, grove.count - 1);
      const angle = grove.gapAngle + index * 2.05 + seed * 0.37;
      const stagger = 0.68 + (index % 3) * 0.16;
      const x = centerX + Math.sin(angle) * grove.radius * stagger + Math.sin(index * 1.7 + seed) * 1.2;
      const z = centerZ + Math.cos(angle) * grove.radius * (0.62 + t * 0.28) + Math.cos(index * 1.3) * 0.9;
      const height = 3.9 + (index % 4) * 0.42 + (grove.style === "wilds" || grove.style === "mist" ? 0.85 : 0);
      const material = grove.style === "wilds" ? this.materials.mistLeafDark
        : grove.style === "mist" ? this.materials.mistLeaf
          : grove.style === "pond" ? this.materials.leafAccent
            : index % 2 ? this.materials.pineDark : this.materials.pine;
      if (index % 3 === 1 && grove.style !== "meadow") {
        this.addBroadleafForestTree(x, z, height, material, seed + index);
      } else {
        this.addPine(x, z, height, material);
      }
    }
  }

  addBroadleafForestTree(x, z, height = 4.4, leafMaterial = this.materials.leafAccent, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = seed * 0.24;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, height * 0.58, 9), this.materials.bark);
    trunk.position.y = height * 0.29;
    trunk.rotation.z = Math.sin(seed) * 0.08;
    group.add(trunk);
    for (let branchIndex = 0; branchIndex < (this.performanceMode ? 2 : 4); branchIndex += 1) {
      const angle = seed + branchIndex * 1.55;
      const branch = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, height * 0.42, 4, 6), this.materials.barkDark);
      branch.position.set(Math.sin(angle) * 0.22, height * (0.52 + branchIndex * 0.03), Math.cos(angle) * 0.22);
      branch.rotation.set(Math.PI / 2 + 0.34, 0, -angle);
      group.add(branch);
    }
    const crownCount = this.performanceMode ? 3 : 5;
    for (let crownIndex = 0; crownIndex < crownCount; crownIndex += 1) {
      const angle = seed + crownIndex * 2.1;
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), crownIndex % 2 ? leafMaterial : this.materials.leafAccent);
      crown.position.set(Math.sin(angle) * height * 0.16, height * (0.72 + (crownIndex % 3) * 0.07), Math.cos(angle) * height * 0.13);
      crown.scale.set(height * (0.22 + crownIndex * 0.015), height * 0.16, height * (0.22 + Math.sin(angle) * 0.02));
      crown.rotation.set(0.08, angle, Math.sin(angle) * 0.1);
      group.add(crown);
    }
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
    this.addCollisionCylinder(x, z, Math.max(0.34, height * 0.075), height * 0.95);
  }

  addForestTerrainBlendPatches() {
    [
      [-21, 17, 9.4, 4.2, 0.48, this.materials.grassLight],
      [22, 16, 8.2, 3.7, -0.42, this.materials.leafAccent],
      [-37, 13, 7.8, 3.1, -0.55, this.materials.mossStone],
      [83, 88, 10.5, 4.8, 0.2, this.materials.mistLeaf],
      [-50, -142, 11.0, 5.2, -0.18, this.materials.mistLeafDark],
      [8, -28, 10.2, 3.6, 0.08, this.materials.grassLight],
    ].forEach(([x, z, width, depth, yaw, material], index) => this.addForestBlendPatch(x, z, width, depth, yaw, material, index));
  }

  addForestBlendPatch(x, z, width, depth, yaw, material, seed = 0) {
    const patchMaterial = material.clone?.() ?? material;
    if (patchMaterial) {
      patchMaterial.transparent = true;
      patchMaterial.opacity = Math.min(patchMaterial.opacity ?? 1, 0.36 + (seed % 2) * 0.08);
      patchMaterial.depthWrite = false;
    }
    const y = this.terrain.getHeightAt(x, z);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 22), patchMaterial);
    patch.position.set(x, y + 0.026 + seed * 0.001, z);
    patch.rotation.set(-Math.PI / 2, 0, yaw);
    patch.scale.set(width, depth, 1);
    patch.receiveShadow = true;
    patch.userData.terrain = true;
    this.scene.add(patch);
  }

  addForestRockAndRootCompositions() {
    [
      [-31, 9, 1.25, 0], [-17, 25, 1.05, 1], [28, 21, 1.12, 2], [37, 7, 0.92, 3],
      [74, 86, 1.35, 4], [101, 96, 1.2, 5], [-63, -143, 1.32, 6],
    ].forEach(([x, z, scale, seed]) => {
      this.addOrganicRockCluster(x, z, scale, seed, seed > 3 ? this.materials.mossStone : null);
      this.addForestRootTangle(x + Math.sin(seed) * 1.2, z + Math.cos(seed) * 1.1, seed);
    });
  }

  addForestRootTangle(x, z, seed = 0) {
    const group = new THREE.Group();
    group.position.set(x, this.terrain.getHeightAt(x, z), z);
    group.rotation.y = seed * 0.33;
    const rootCount = this.performanceMode ? 2 : 4;
    for (let index = 0; index < rootCount; index += 1) {
      const angle = seed + index * 1.4;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 + index * 0.006, 1.1 + index * 0.18, 4, 6), this.materials.barkDark);
      root.position.set(Math.sin(angle) * 0.35, 0.12 + index * 0.02, Math.cos(angle) * 0.25);
      root.rotation.set(Math.PI / 2 + 0.16, 0, -angle + Math.sin(seed) * 0.2);
      root.castShadow = true;
      root.receiveShadow = true;
      root.userData.detailObject = true;
      group.add(root);
    }
    this.scene.add(group);
  }

  addForestStorytellingVignettes() {
    [
      [-20.2, 11.8, -0.42, "old-marker"],
      [30.8, 25.6, 0.35, "rest-stop"],
      [-41.5, 16.4, -0.64, "hunter-cache"],
      [88.4, 96.6, 0.24, "mist-charm"],
      [-56.8, -139.8, -0.2, "root-shrine"],
    ].forEach(([x, z, yaw, type], index) => this.addForestStoryProp(x, z, yaw, type, index));
  }

  addForestStoryProp(x, z, yaw, type, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    if (type === "old-marker") {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 1.25, 7), this.materials.barkDark);
      post.position.y = 0.62;
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.46, 5), this.materials.targetGold);
      arrow.position.set(0.28, 1.08, 0);
      arrow.rotation.z = -Math.PI / 2;
      group.add(post, arrow);
    } else if (type === "rest-stop") {
      const log = new THREE.Mesh(this.geometries.log, this.materials.cutWood);
      log.position.y = 0.24;
      log.rotation.z = Math.PI / 2;
      const stones = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 7, 18), this.materials.darkStone);
      stones.position.set(0.9, 0.1, 0.25);
      stones.rotation.x = Math.PI / 2;
      group.add(log, stones);
    } else if (type === "hunter-cache") {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.5), this.materials.agedWood);
      crate.position.y = 0.22;
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 7, 24, Math.PI * 1.35), this.materials.cutWood);
      bow.position.set(0.58, 0.52, 0);
      bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
      group.add(crate, bow);
    } else if (type === "mist-charm" || type === "root-shrine") {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), type === "mist-charm" ? this.materials.mistStone : this.materials.mossStone);
      stone.position.y = 0.32;
      stone.scale.set(0.8, 1.4, 0.68);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), type === "mist-charm" ? this.materials.glowPlant : this.materials.targetGold);
      glow.position.y = 0.88;
      group.add(stone, glow);
    }
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.detailObject = true;
      }
    });
    this.scene.add(group);
    if (seed < 3) {
      this.addFlowerPatch(x + Math.sin(yaw) * 0.6, z + Math.cos(yaw) * 0.6, 3 + seed);
    }
  }

  addForestAtmosphereAccents() {
    [
      [-18, 18, 0xffd98c, 0.26, 8],
      [28, 18, 0xbfd27a, 0.18, 7],
      [86, 92, 0x9af6b9, 0.22, 8],
      [-52, -142, 0x8ff0b1, 0.18, 7],
    ].forEach(([x, z, color, intensity, distance]) => {
      const y = this.terrain.getHeightAt(x, z);
      const glow = new THREE.PointLight(color, intensity, distance, 2.1);
      glow.position.set(x, y + 1.6, z);
      glow.castShadow = false;
      this.scene.add(glow);
    });
  }

  addUnderstoryCluster(x, z, radius, style, seed = 0) {
    const material = style === "mist" || style === "wilds" ? this.materials.mistLeaf
      : style === "marsh" ? this.materials.marshGrass
        : style === "pond" ? this.materials.lily
          : this.materials.grassLight;
    const count = this.performanceMode ? 4 : 8;
    for (let index = 0; index < count; index += 1) {
      const angle = seed + index * 2.399;
      const distance = radius * (0.26 + (index % 5) * 0.13);
      const px = x + Math.sin(angle) * distance;
      const pz = z + Math.cos(angle) * distance;
      const y = this.terrain.getHeightAt(px, pz);
      const blade = new THREE.Mesh(this.geometries.grassBlade, material);
      blade.position.set(px, y + 0.2, pz);
      blade.scale.set(0.8 + (index % 3) * 0.16, 0.9 + (index % 4) * 0.12, 0.8);
      blade.rotation.set(0.08, angle, Math.sin(index) * 0.16);
      blade.castShadow = true;
      blade.userData.detailObject = true;
      this.scene.add(blade);

      if (index % 3 === 0) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 5), style === "wilds" || style === "mist" ? this.materials.glowPlant : this.materials.flower);
        flower.position.set(px + Math.sin(angle + 1) * 0.16, y + 0.46, pz + Math.cos(angle + 1) * 0.16);
        flower.castShadow = true;
        flower.userData.detailObject = true;
        this.scene.add(flower);
      }
    }
  }

  addRegionIdentityBrushstrokes() {
    [
      [-86, 90, "frost"], [100, -98, "coast"], [100, 96, "mist"], [-108, -84, "marsh"],
      [18, 132, "canyon"], [-126, 128, "ashen"], [142, 44, "star"], [136, -146, "frontier"],
    ].forEach(([x, z, style], seed) => {
      const colorMaterial = style === "frost" ? this.materials.crystalBlue
        : style === "coast" ? this.materials.seaFoam
          : style === "mist" ? this.materials.glowPlant
            : style === "marsh" ? this.materials.witchlight
              : style === "canyon" ? this.materials.sunstone
                : style === "ashen" ? this.materials.lavaGlow
                  : style === "star" ? this.materials.starCrystal
                    : this.materials.frontierFlower;
      this.addRegionIdentityAccent(x, z, style, colorMaterial, seed);
    });
  }

  addRegionIdentityAccent(x, z, style, material, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = seed * 0.4;
    const baseMaterial = style === "coast" ? this.materials.cliffStone
      : style === "ashen" ? this.materials.obsidian
        : style === "star" ? this.materials.celestialStone
          : style === "frost" ? this.materials.frostRock
            : this.materials.stone;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.66, 0.24, 8), baseMaterial);
    base.position.y = 0.12;
    group.add(base);
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), material);
    shard.position.set(0, 0.62, 0);
    shard.scale.set(0.72, 1.45, 0.72);
    shard.rotation.y = seed * 0.7;
    group.add(shard);
    [-1, 1].forEach((side) => {
      const small = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), baseMaterial);
      small.position.set(side * 0.48, 0.26, -0.22 + seed * 0.02);
      small.scale.set(1.2, 0.58, 0.9);
      group.add(small);
    });
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.detailObject = true;
      }
    });
    this.scene.add(group);
  }

  addForestRing() {
    const treePositions = [
      [-28, -27, 5.2], [-20, -31, 4.7], [-10, -34, 5.4], [4, -34, 4.9], [17, -31, 5.7], [30, -25, 5.1],
      [-36, -13, 5.6], [-39, 0, 4.8], [-36, 14, 5.3], [-27, 27, 5.8], [-14, 32, 4.9], [2, 34, 5.4],
      [16, 31, 5.1], [30, 23, 5.7], [38, 9, 5.2], [39, -7, 4.8],
      [-23, 18, 4.2], [26, 13, 4.1], [-18, -19, 4.4], [22, -18, 4.3],
    ];

    treePositions.forEach(([x, z, height], index) => {
      this.addPine(x, z, height, index % 2 === 0 ? this.materials.pine : this.materials.pineDark);
    });
  }

  addPine(x, z, height, leafMaterial = this.materials.pine) {
    const ground = this.terrain.getHeightAt(x, z);
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, ground, z);
    const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    const styleRoll = seed - Math.floor(seed);
    const trunkMaterial = styleRoll > 0.72 ? this.materials.elderBark ?? this.materials.bark : this.materials.bark;
    const accentLeaf = styleRoll > 0.62 ? this.materials.leafAccent : leafMaterial;
    const trunk = new THREE.Mesh(this.geometries.trunk, this.materials.bark);
    trunk.material = trunkMaterial;
    trunk.position.set(0, height * 0.22, 0);
    trunk.scale.set(0.82 + Math.sin(x * 0.37) * 0.1, height * 0.42, 0.92 + Math.cos(z * 0.31) * 0.1);
    trunk.rotation.z = Math.sin(x + z) * 0.085;
    trunk.rotation.x = Math.cos(x * 0.21) * 0.04;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const roots = [];
    const rootCount = this.performanceMode ? 3 : 4;
    for (let index = 0; index < rootCount; index += 1) {
      const angle = index * (Math.PI * 2 / rootCount) + Math.sin(x + z) * 0.4;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 + (index % 2) * 0.014, height * (0.28 + index * 0.035), 4, 6), this.materials.barkDark);
      root.position.set(Math.sin(angle) * (0.28 + index * 0.05), 0.13, Math.cos(angle) * (0.28 + index * 0.04));
      root.rotation.set(Math.PI / 2 + 0.12 + index * 0.035, 0, -angle);
      root.castShadow = true;
      roots.push(root);
      treeGroup.add(root);
    }

    const lower = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), accentLeaf);
    lower.position.set(Math.sin(seed) * 0.05, height * 0.61, Math.cos(seed) * 0.06);
    lower.scale.set(height * (0.38 + styleRoll * 0.08), height * 0.22, height * (0.32 + Math.sin(seed) * 0.035));
    lower.rotation.y = Math.sin(x * 0.3) * 0.2;
    lower.rotation.z = Math.sin(z * 0.23) * 0.035;
    lower.castShadow = true;

    const middle = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), leafMaterial);
    middle.position.set(Math.sin(z) * 0.08, height * 0.82, Math.cos(x) * 0.08);
    middle.scale.set(height * 0.34, height * 0.22, height * 0.29);
    middle.rotation.y = 0.4 + Math.sin(z * 0.2) * 0.18;
    middle.rotation.z = -Math.sin(x * 0.19) * 0.04;
    middle.castShadow = true;

    const upperMaterial = Math.sin(x * 0.41 + z * 0.27) > 0.2 ? this.materials.leafAccent : leafMaterial;
    const upper = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), upperMaterial);
    upper.position.set(Math.sin(x + z) * 0.06, height * 1.01, 0);
    upper.scale.set(height * (0.22 + styleRoll * 0.04), height * 0.2, height * (0.22 + Math.cos(seed) * 0.03));
    upper.rotation.y = -0.25;
    upper.castShadow = true;

    const branch = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, height * 0.38, 4, 6), this.materials.barkDark);
    branch.position.set(Math.sin(x) * 0.22, height * 0.52, Math.cos(z) * 0.22);
    branch.rotation.set(Math.PI / 2 + 0.18, 0, Math.sin(x * 0.22) * Math.PI);
    branch.castShadow = true;
    treeGroup.add(lower, middle, upper, branch);

    const branchCount = this.performanceMode ? 1 : 3;
    for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
      const angle = branchIndex * 2.25 + Math.sin(x * 0.5 + z) * 0.4;
      const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, height * (0.22 + branchIndex * 0.035), 4, 6), this.materials.barkDark);
      limb.position.set(Math.sin(angle) * 0.24, height * (0.58 + branchIndex * 0.08), Math.cos(angle) * 0.24);
      limb.rotation.set(Math.PI / 2 + 0.4, 0, -angle);
      limb.castShadow = true;
      treeGroup.add(limb);
    }

    if (!this.performanceMode && styleRoll > 0.46) {
      const sideSpray = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), styleRoll > 0.7 ? this.materials.mistLeaf ?? accentLeaf : accentLeaf);
      const side = styleRoll > 0.58 ? 1 : -1;
      sideSpray.position.set(side * height * 0.22, height * 0.72, Math.sin(seed) * height * 0.08);
      sideSpray.scale.set(height * 0.18, height * 0.14, height * 0.24);
      sideSpray.rotation.set(0.08, seed, side * 0.16);
      sideSpray.castShadow = true;
      treeGroup.add(sideSpray);
    }

    this.scene.add(treeGroup);
    this.colliders.push(trunk, lower, middle, upper, branch);
    if (height >= 3.8) {
      const baseY = this.terrain.getHeightAt(x, z);
      this.collisionVolumes.push({
        type: "cylinder",
        x,
        z,
        radius: Math.max(0.32, height * 0.07),
        minY: baseY,
        maxY: baseY + height * 1.15,
        fromTree: true,
      });
    }
  }

  addTargetRange() {
    this.addTarget(0, -18, 0, 1.35);
    this.addTarget(-5.8, -21.5, 0.18, 1.15);
    this.addTarget(6.2, -22.5, -0.2, 1.25);
    this.addTarget(12.5, -16.5, -0.48, 0.95);
    this.addArrowRack(-8.5, -8.8);
    this.addTargetSign(4.8, -8.4);
  }

  addTarget(x, z, yaw, scale, options = {}) {
    const group = new THREE.Group();
    group.position.set(x, this.terrain.getHeightAt(x, z) + (options.yOffset ?? 0), z);
    group.rotation.y = yaw;
    group.scale.setScalar(scale);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.2, 0.28), this.materials.wood);
    stand.position.set(0, 1.05, -0.36);
    stand.castShadow = true;
    stand.receiveShadow = true;
    group.add(stand);

    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.22), this.materials.wood);
    cross.position.set(0, 1.72, -0.38);
    cross.castShadow = true;
    group.add(cross);

    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.95, 0.16), this.materials.barkDark);
    brace.position.set(0, 0.98, -0.5);
    brace.rotation.z = 0.56;
    brace.castShadow = true;
    group.add(brace);

    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.16, 28), this.materials.targetFace.clone());
    disk.position.set(0, 1.72, -0.08);
    disk.rotation.x = Math.PI / 2;
    disk.castShadow = true;
    group.add(disk);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.038, 8, 32), this.materials.targetOuter.clone());
    outerRing.position.copy(disk.position).z += 0.098;
    group.add(outerRing);

    const blueRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.028, 8, 32), this.materials.targetBlue.clone());
    blueRing.position.copy(disk.position).z += 0.104;
    group.add(blueRing);

    const redRing = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.034, 8, 28), this.materials.targetRed.clone());
    redRing.position.copy(disk.position).z += 0.1;
    group.add(redRing);

    const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 22), this.materials.targetGold.clone());
    goldRing.position.copy(disk.position).z += 0.11;
    group.add(goldRing);

    const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.035, 20), this.materials.targetGold.clone());
    bullseye.position.copy(disk.position).z += 0.12;
    bullseye.rotation.x = Math.PI / 2;
    group.add(bullseye);

    const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 3), this.materials.banner);
    pennant.position.set(0.86, 2.53, -0.22);
    pennant.rotation.set(0, 0, -Math.PI / 2);
    pennant.castShadow = true;
    group.add(pennant);

    this.scene.add(group);
    const target = {
      id: this.targets.length + 1,
      group,
      face: disk,
      rings: [blueRing, redRing, goldRing, bullseye],
      radius: 0.78 * scale,
      bullseyeRadius: 0.2 * scale,
      active: true,
      resetTimer: 0,
      baseScale: scale,
      baseY: group.position.y,
      challengeId: options.challengeId ?? null,
      challengeLabel: options.challengeLabel ?? null,
      switchId: options.switchId ?? null,
      caveSound: options.caveSound ?? false,
      motion: options.motion ?? null,
      basePosition: group.position.clone(),
      masterTrial: options.masterTrial ?? null,
    };
    disk.userData.target = target;
    this.targets.push(target);
    this.colliders.push(stand, cross, brace, disk);
  }

  addArrowRack(x, z) {
    const baseY = this.terrain.getHeightAt(x, z);
    const rack = new THREE.Group();
    rack.position.set(x, baseY, z);
    rack.rotation.y = -0.32;

    for (let index = 0; index < 5; index += 1) {
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.45, 6), this.materials.rope);
      arrow.position.set(-0.44 + index * 0.22, 0.78, 0);
      arrow.rotation.x = 0.22;
      arrow.rotation.z = -0.1;
      arrow.castShadow = true;
      rack.add(arrow);
    }

    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.24), this.materials.wood);
    rail.position.y = 0.32;
    rail.castShadow = true;
    rack.add(rail);
    this.scene.add(rack);
  }

  addTargetSign(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    const post = new THREE.Mesh(this.geometries.fencePost, this.materials.wood);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.34, 0.1), this.materials.cutWood);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.08, 0.12), this.materials.targetGold);
    post.position.set(x, y + 0.68, z);
    board.position.set(x, y + 1.2, z);
    cap.position.set(x, y + 1.4, z);
    board.rotation.y = -0.18;
    cap.rotation.y = -0.18;
    post.castShadow = true;
    board.castShadow = true;
    cap.castShadow = true;
    this.scene.add(post, board, cap);
    this.colliders.push(post, board, cap);
  }

  addTrainingCamp() {
    this.addTent(-17, -8, 0.62);
    this.addCampfire(-13.2, -5.3);
    this.addCrates(-20.5, -3.8);
    this.addLogSeats(-10.8, -3.2);
  }

  addTent(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;

    const canvas = new THREE.Group();
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 3.25), this.materials.canvas);
    leftPanel.position.set(-0.58, 1.02, 0);
    leftPanel.rotation.z = -0.62;
    const rightPanel = leftPanel.clone();
    rightPanel.position.x = 0.58;
    rightPanel.rotation.z = 0.62;
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 3.42, 7), this.materials.rope);
    ridge.position.y = 1.84;
    ridge.rotation.x = Math.PI / 2;
    const backRib = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.12), this.materials.barkDark);
    backRib.position.set(0, 0.92, 1.62);
    backRib.rotation.z = -0.02;
    [leftPanel, rightPanel, ridge, backRib].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
      canvas.add(piece);
    });
    group.add(canvas);

    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.2), this.materials.darkStone);
    flap.position.set(0, 0.62, -1.3);
    flap.rotation.z = -0.2;
    group.add(flap);

    this.scene.add(group);
    this.colliders.push(leftPanel, rightPanel);
  }

  addCampfire(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    const coal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 12), this.materials.darkStone);
    coal.position.set(x, y + 0.06, z);
    coal.receiveShadow = true;

    const glow = new THREE.PointLight(0xffa75f, 1.15, 9, 2.2);
    glow.position.set(x, y + 0.9, z);

    for (let index = 0; index < 4; index += 1) {
      const log = new THREE.Mesh(this.geometries.log, this.materials.bark);
      log.position.set(x, y + 0.2, z);
      log.rotation.set(Math.PI / 2, 0, (index / 4) * Math.PI);
      log.scale.set(0.75, 0.75, 0.75);
      log.castShadow = true;
      this.scene.add(log);
      this.colliders.push(log);
    }

    this.scene.add(coal, glow);
  }

  addCrates(x, z) {
    const placements = [[0, 0, 1], [1.05, 0.18, 0.75], [0.25, 0.92, 0.58]];
    placements.forEach(([offsetX, offsetZ, scale], index) => {
      const crate = new THREE.Mesh(this.geometries.crate, this.materials.wood);
      const crateX = x + offsetX;
      const crateZ = z + offsetZ;
      crate.position.set(crateX, this.terrain.getHeightAt(crateX, crateZ) + scale / 2, crateZ);
      crate.scale.setScalar(scale);
      crate.rotation.y = 0.25 + index * 0.4;
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.colliders.push(crate);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(scale * 1.08, scale * 0.08, scale * 1.08), index % 2 ? this.materials.cutWood : this.materials.barkDark);
      lid.position.set(crateX, crate.position.y + scale * 0.54, crateZ);
      lid.rotation.y = crate.rotation.y + 0.08;
      lid.castShadow = true;
      this.scene.add(lid);
      [-0.26, 0.26].forEach((band) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.08, scale * 1.05, scale * 1.12), this.materials.barkDark);
        strap.position.set(crateX, crate.position.y, crateZ);
        strap.rotation.y = crate.rotation.y + band;
        strap.castShadow = true;
        this.scene.add(strap);
      });
    });
  }

  addLogSeats(x, z) {
    for (let index = 0; index < 3; index += 1) {
      const log = new THREE.Mesh(this.geometries.log, this.materials.cutWood);
      const angle = index * 2.1;
      const logX = x + Math.sin(angle) * 1.7;
      const logZ = z + Math.cos(angle) * 1.1;
      log.position.set(logX, this.terrain.getHeightAt(logX, logZ) + 0.23, logZ);
      log.rotation.set(Math.PI / 2, 0, angle + 0.5);
      log.castShadow = true;
      log.receiveShadow = true;
      this.scene.add(log);
      this.colliders.push(log);
    }
  }

  addFenceLine() {
    const fencePieces = [
      [-15, 8, 0.05], [-10.8, 8.3, 0.1], [-6.6, 8.4, 0.02], [7.6, 8, -0.06], [11.8, 7.5, -0.13], [16, 6.6, -0.2],
      [-25, -13, 0.85], [-27, -9.4, 0.95], [26, -13, -0.82], [28, -9.5, -0.92],
    ];
    fencePieces.forEach(([x, z, yaw]) => this.addFencePiece(x, z, yaw));
  }

  addFencePiece(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;

    const left = new THREE.Mesh(this.geometries.fencePost, this.materials.wood);
    const right = new THREE.Mesh(this.geometries.fencePost, this.materials.wood);
    const railTop = new THREE.Mesh(this.geometries.fenceRail, this.materials.wood);
    const railLow = new THREE.Mesh(this.geometries.fenceRail, this.materials.wood);

    left.position.set(-1.25, 0.67, 0);
    right.position.set(1.25, 0.67, 0);
    railTop.position.set(0, 0.92, 0);
    railTop.rotation.z = 0.06;
    railLow.position.set(0, 0.48, 0);
    railLow.rotation.z = -0.04;

    [left, right, railTop, railLow].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
      group.add(piece);
      this.colliders.push(piece);
    });

    this.scene.add(group);
  }

  addRockGroups() {
    const rocks = [
      [-22, 10, 1.5], [-18, 13, 0.8], [-7, 16, 1.1], [17, 13, 1.2], [22, 9, 0.85],
      [-28, -2, 0.9], [31, -1, 1.35], [-4, -12, 0.7], [9, -10, 0.75],
    ];

    rocks.forEach(([x, z, scale], index) => {
      this.addOrganicRockCluster(x, z, scale, index);
    });
  }

  addOrganicRockCluster(x, z, scale = 1, index = 0, material = null) {
    const group = new THREE.Group();
    group.position.set(x, this.terrain.getHeightAt(x, z), z);
    const count = scale > 1.1 ? 4 : 3;
    for (let piece = 0; piece < count; piece += 1) {
      const angle = index * 0.73 + piece * 2.05;
      const rock = new THREE.Mesh(this.geometries.pebble, material ?? (piece % 2 ? this.materials.darkStone : this.materials.stone));
      const pieceScale = scale * (piece === 0 ? 1 : 0.48 + piece * 0.12);
      rock.position.set(Math.sin(angle) * scale * 0.26 * piece, pieceScale * 0.22, Math.cos(angle) * scale * 0.2 * piece);
      rock.scale.set(pieceScale * (1.1 + piece * 0.12), pieceScale * (0.42 + piece * 0.08), pieceScale * (0.78 + Math.sin(index + piece) * 0.1));
      rock.rotation.set(index * 0.37 + piece * 0.18, angle, index * 0.16 - piece * 0.11);
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
      this.colliders.push(rock);
    }
    const strataCount = scale > 1.25 && !this.performanceMode ? 3 : 1;
    for (let layer = 0; layer < strataCount; layer += 1) {
      const angle = index * 0.41 + layer * 0.55;
      const shelf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), material ?? (layer % 2 ? this.materials.darkStone : this.materials.stone));
      shelf.position.set(Math.sin(angle) * scale * 0.18, 0.12 + layer * scale * 0.13, Math.cos(angle) * scale * 0.14);
      shelf.scale.set(scale * (1.25 - layer * 0.18), scale * 0.13, scale * (0.72 - layer * 0.06));
      shelf.rotation.set(0.12, angle, -0.08 + layer * 0.04);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);
    }
    this.scene.add(group);
    return group;
  }

  addGrassPatches() {
    const positions = [];
    for (let ring = 0; ring < 8; ring += 1) {
      const radius = 8 + ring * 4.2;
      for (let index = 0; index < 18; index += 1) {
        const angle = index * 2.399 + ring * 0.4;
        const x = Math.sin(angle) * radius + Math.sin(index) * 1.8;
        const z = Math.cos(angle) * radius + Math.cos(ring) * 1.6;
        const nearPath = Math.abs(z - (Math.sin((x + 24) * 0.16) * 2.1 - 6.4)) < 2.6;
        const inLane = Math.abs(x) < 4 && z < 1 && z > -24;
        if (!nearPath && !inLane && Math.hypot(x, z + 2) < 39) {
          positions.push([x, z, 0.7 + ((index + ring) % 4) * 0.12]);
        }
      }
    }

    const grass = new THREE.InstancedMesh(this.geometries.grassBlade, this.materials.grass, positions.length);
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Euler();
    positions.forEach(([x, z, scale], index) => {
      const y = this.terrain.getHeightAt(x, z) + scale * 0.23;
      rotation.set(0.06 * Math.sin(index), index * 1.7, 0.12 * Math.cos(index));
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(rotation),
        new THREE.Vector3(scale, scale, scale)
      );
      grass.setMatrixAt(index, matrix);
    });
    grass.castShadow = true;
    grass.receiveShadow = true;
    this.scene.add(grass);
  }

  addSmallDetails() {
    this.addStump(11.5, -4.8);
    this.addStump(-5, 7.2);
    this.addPracticeBowStand(14.5, -6.5);
    this.addBannerLine(-7.5, -10.5, 5);
    this.addFlowerClusters();
  }

  addStump(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.74, 10), this.materials.cutWood);
    stump.position.set(x, y + 0.37, z);
    stump.castShadow = true;
    stump.receiveShadow = true;
    this.scene.add(stump);
    this.colliders.push(stump);
  }

  addPracticeBowStand(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    const post = new THREE.Mesh(this.geometries.fencePost, this.materials.wood);
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), this.materials.rope);
    post.position.set(x, y + 0.74, z);
    peg.position.set(x, y + 1.18, z);
    peg.rotation.z = Math.PI / 2;
    post.castShadow = true;
    peg.castShadow = true;
    this.scene.add(post, peg);
    this.colliders.push(post, peg);
  }

  addBannerLine(x, z, count) {
    for (let index = 0; index < count; index += 1) {
      const bannerX = x + index * 1.7;
      const bannerZ = z + Math.sin(index) * 0.35;
      const y = this.terrain.getHeightAt(bannerX, bannerZ);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.35, 7), this.materials.barkDark);
      pole.position.set(bannerX, y + 0.68, bannerZ);
      pole.castShadow = true;

      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 3), index % 2 === 0 ? this.materials.banner : this.materials.targetGold);
      flag.position.set(bannerX + 0.2, y + 1.18, bannerZ);
      flag.rotation.set(0, Math.PI / 2 + 0.12 * index, -Math.PI / 2);
      flag.castShadow = true;
      this.scene.add(pole, flag);
    }
  }

  addFlowerClusters() {
    const clusters = [[-12, 4], [-2, 10], [8, 5], [18, -4], [-19, -1]];
    clusters.forEach(([x, z], clusterIndex) => {
      for (let index = 0; index < 7; index += 1) {
        const angle = index * 2.35;
        const flowerX = x + Math.sin(angle) * (0.35 + (index % 3) * 0.18);
        const flowerZ = z + Math.cos(angle) * (0.32 + (index % 2) * 0.2);
        const y = this.terrain.getHeightAt(flowerX, flowerZ);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.22, 5), this.materials.grassLight);
        stem.position.set(flowerX, y + 0.11, flowerZ);
        const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), clusterIndex % 2 === 0 ? this.materials.flower : this.materials.targetRed);
        bloom.position.set(flowerX, y + 0.24, flowerZ);
        bloom.scale.set(1, 0.58, 1);
        this.scene.add(stem, bloom);
      }
    });
  }

  addOldWatchtower() {
    const origin = { x: -24, z: 11, yaw: -0.42, scale: 1 };
    this.watchtower = origin;
    this.addWatchtowerPath(origin);
    this.addWatchtowerStructure(origin);
    this.addWatchtowerSurroundings(origin);
    this.addWatchtowerTargets(origin);
    this.addWatchtowerLoreNote(origin);
    this.addWatchtowerLookout(origin);
  }

  getWatchtowerPoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addWatchtowerPath(origin) {
    const stones = [
      [-8.6, -5.1, 0.45], [-6.7, -3.9, 0.34], [-4.8, -2.7, 0.42], [-2.7, -1.5, 0.32], [-0.8, -0.5, 0.36],
    ];
    stones.forEach(([localX, localZ, scale], index) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      stone.position.set(point.x, y + scale * 0.12, point.z);
      stone.scale.set(scale * 1.4, scale * 0.22, scale * 0.82);
      stone.rotation.set(index * 0.32, origin.yaw + index * 0.5, index * 0.18);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
    });
  }

  addWatchtowerStructure(origin) {
    const group = new THREE.Group();
    group.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z), origin.z);
    group.rotation.y = origin.yaw;
    group.scale.setScalar(origin.scale);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.45, 1.05, 9), this.materials.darkStone);
    base.position.y = 0.52;
    base.scale.set(1, 1, 0.88);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.18, 0.26, 8), this.materials.wood);
    platform.position.y = 2.42;
    platform.scale.set(1.08, 1, 0.9);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    const lookoutRail = new THREE.Group();
    const railPlacements = [[0, -2.02, 0], [1.8, -0.72, Math.PI / 2], [-1.8, -0.72, Math.PI / 2]];
    railPlacements.forEach(([x, z, rot]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 0.16), this.materials.wood);
      rail.position.set(x, 2.98, z);
      rail.rotation.y = rot;
      rail.castShadow = true;
      lookoutRail.add(rail);
    });
    group.add(lookoutRail);

    const posts = [[-1.65, -1.55], [1.65, -1.55], [-1.55, 1.45], [1.35, 1.25]];
    posts.forEach(([x, z], index) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, index === 3 ? 2.35 : 3.15, 7), this.materials.barkDark);
      post.position.set(x, index === 3 ? 1.62 : 1.78, z);
      post.rotation.z = (index - 1.5) * 0.04;
      post.castShadow = true;
      group.add(post);
    });

    const brokenRoof = new THREE.Group();
    brokenRoof.position.set(-0.18, 3.25, -0.18);
    brokenRoof.rotation.y = Math.PI / 7;
    [
      [-0.48, 0.12, 1.9, 0.2, 1.55, -0.5, -0.12],
      [0.54, 0.02, 1.45, 0.18, 1.42, 0.42, 0.16],
      [0.05, 0.42, 1.2, 0.13, 1.65, -0.04, 0.03],
    ].forEach(([x, y, width, height, depth, roll, yawOffset], index) => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), index === 1 ? this.materials.barkDark : this.materials.bark);
      plank.position.set(x, y, index === 2 ? 0.1 : 0);
      plank.rotation.set(0.04 * index, yawOffset, roll);
      plank.castShadow = true;
      plank.receiveShadow = true;
      brokenRoof.add(plank);
    });
    const roofRidge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 1.8, 7), this.materials.cutWood);
    roofRidge.position.set(0, 0.62, 0.02);
    roofRidge.rotation.x = Math.PI / 2;
    brokenRoof.add(roofRidge);
    group.add(brokenRoof);

    const ladder = new THREE.Group();
    ladder.position.set(1.95, 1.28, 0.22);
    ladder.rotation.set(0.05, 0, -0.42);
    for (let side = -1; side <= 1; side += 2) {
      const sideRail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.6, 6), this.materials.rope);
      sideRail.position.x = side * 0.18;
      sideRail.rotation.z = 0.05;
      sideRail.castShadow = true;
      ladder.add(sideRail);
    }
    for (let rung = 0; rung < 5; rung += 1) {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.5, 6), this.materials.cutWood);
      step.position.y = -1 + rung * 0.45;
      step.rotation.z = Math.PI / 2;
      step.castShadow = true;
      ladder.add(step);
    }
    group.add(ladder);

    const ramp = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.18, 1.45), this.materials.cutWood);
    ramp.position.set(2.9, 1.22, -1.35);
    ramp.rotation.set(0, 0, -0.36);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    group.add(ramp);

    this.scene.add(group);
    group.traverse((child) => {
      if (child.isMesh) {
        this.colliders.push(child);
      }
    });
  }

  addWatchtowerSurroundings(origin) {
    const pines = [[-5.2, 3.8, 4.4], [4.8, 3.1, 4.1], [-3.8, -4.6, 3.7]];
    pines.forEach(([localX, localZ, height], index) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      this.addPine(point.x, point.z, height, index === 1 ? this.materials.pineDark : this.materials.pine);
    });

    const rocks = [[-3.8, 2.3, 0.85], [3.2, 2.5, 0.62], [-1.4, -4.3, 0.55], [5.2, -2.3, 0.72]];
    rocks.forEach(([localX, localZ, scale], index) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      rock.position.set(point.x, y + scale * 0.28, point.z);
      rock.scale.set(scale * 1.2, scale * 0.55, scale * 0.82);
      rock.rotation.set(index * 0.3, origin.yaw + index * 0.45, index * 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    });

    const beams = [[-2.8, -2.7, 0.7], [2.6, 1.8, -0.5], [0.2, 3.4, 1.45]];
    beams.forEach(([localX, localZ, yaw], index) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4 - index * 0.25, 0.18, 0.22), this.materials.barkDark);
      beam.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.16, point.z);
      beam.rotation.set(0.08, origin.yaw + yaw, 0.1 * index);
      beam.castShadow = true;
      beam.receiveShadow = true;
      this.scene.add(beam);
      this.colliders.push(beam);
    });

    this.addWatchtowerGrassTufts(origin);
  }

  addWatchtowerGrassTufts(origin) {
    const positions = [];
    for (let index = 0; index < 42; index += 1) {
      const angle = index * 2.399;
      const radius = 2.8 + (index % 6) * 0.62;
      const localX = Math.sin(angle) * radius;
      const localZ = Math.cos(angle) * radius;
      if (Math.abs(localX) < 1.6 && localZ < -1.2) {
        continue;
      }
      positions.push([localX, localZ, 0.58 + (index % 4) * 0.1]);
    }

    const grass = new THREE.InstancedMesh(this.geometries.grassBlade, this.materials.grassLight, positions.length);
    const matrix = new THREE.Matrix4();
    positions.forEach(([localX, localZ, scale], index) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z) + scale * 0.22;
      matrix.compose(
        new THREE.Vector3(point.x, y, point.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, origin.yaw + index * 1.9, 0.08)),
        new THREE.Vector3(scale, scale, scale)
      );
      grass.setMatrixAt(index, matrix);
    });
    grass.castShadow = true;
    grass.receiveShadow = true;
    this.scene.add(grass);
  }

  addWatchtowerTargets(origin) {
    const targets = [
      [-6.4, 1.4, origin.yaw + 1.55, 0.82],
      [4.8, 3.7, origin.yaw - 2.5, 0.88],
      [1.5, -6.2, origin.yaw + 0.25, 0.76],
    ];
    targets.forEach(([localX, localZ, yaw, scale]) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, yaw, scale);
    });
  }

  addWatchtowerLoreNote(origin) {
    const point = this.getWatchtowerPoint(origin, -0.9, -1.1);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const group = new THREE.Group();
    group.position.set(point.x, y + 0.34, point.z);
    group.rotation.y = origin.yaw + 0.36;

    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.5), this.materials.darkStone);
    stone.castShadow = true;
    stone.receiveShadow = true;
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.018, 0.3), this.materials.parchment);
    note.position.y = 0.11;
    note.rotation.y = 0.12;
    const seal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), this.materials.targetRed);
    seal.position.set(0.12, 0.13, 0.02);
    group.add(stone, note, seal);
    this.scene.add(group);

    this.interactables.push({
      id: "old-watchtower-note",
      type: "lore-note",
      name: "Weathered Watch Note",
      prompt: "E Read note",
      position: new THREE.Vector3(point.x, y + 0.4, point.z),
      radius: 2.7,
      text: "The old bell is gone, but the forest still answers every arrow.",
    });
  }

  addWatchtowerLookout(origin) {
    const point = this.getWatchtowerPoint(origin, -0.25, -0.45);
    const platformY = this.terrain.getHeightAt(origin.x, origin.z) + 2.7;
    this.interactables.push({
      id: "old-watchtower-lookout",
      type: "lookout",
      name: "Old Watchtower Lookout",
      prompt: "E Look out",
      position: new THREE.Vector3(point.x, platformY, point.z),
      radius: 2.4,
      focus: new THREE.Vector3(-7, platformY + 2.2, 37),
      text: "From the old platform, the cliff target and forest paths line up clearly.",
    });
  }

  addHiddenPond() {
    const origin = { x: 23, z: 20, yaw: 0.7, scale: 1 };
    this.hiddenPond = origin;
    this.addHiddenPondPath(origin);
    this.addHiddenPondWater(origin);
    this.addHiddenPondAncientTree(origin);
    this.addHiddenPondSurroundings(origin);
    this.addHiddenPondTargets(origin);
    this.addHiddenPondLore(origin);
    this.addHiddenPondDiscovery(origin);
  }

  getHiddenPondPoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addHiddenPondPath(origin) {
    const stones = [
      [-12, -5.4, 0.34], [-9.3, -4.7, 0.28], [-6.6, -3.7, 0.36], [-4.1, -2.2, 0.24], [-1.8, -1.3, 0.3],
    ];
    stones.forEach(([localX, localZ, scale], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      stone.position.set(point.x, y + scale * 0.08, point.z);
      stone.scale.set(scale * 1.5, scale * 0.16, scale * 0.88);
      stone.rotation.set(index * 0.22, origin.yaw + index * 0.42, 0.08);
      stone.receiveShadow = true;
      this.scene.add(stone);
    });
  }

  addHiddenPondWater(origin) {
    const water = new THREE.Mesh(new THREE.CircleGeometry(4.55, 48), this.materials.water);
    water.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.12, origin.z);
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1.18, 0.78, 1);
    water.receiveShadow = true;
    this.scene.add(water);

    const glow = new THREE.PointLight(0x9bd4c8, 0.36, 13, 2.2);
    glow.position.set(origin.x - 1.5, water.position.y + 1.1, origin.z + 1);
    this.scene.add(glow);

    const rippleMaterial = new THREE.LineBasicMaterial({ color: 0xd8fff1, transparent: true, opacity: 0.32 });
    for (let index = 0; index < 3; index += 1) {
      const ripple = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 1.25 + index * 0.9, 0.55 + index * 0.42, 0, Math.PI * 2).getPoints(48).map((point) => new THREE.Vector3(point.x, 0, point.y))),
        rippleMaterial
      );
      ripple.position.set(origin.x - 0.4 + index * 0.34, water.position.y + 0.018 + index * 0.004, origin.z + 0.2 - index * 0.22);
      ripple.rotation.x = -Math.PI / 2;
      ripple.rotation.z = origin.yaw + index * 0.4;
      this.scene.add(ripple);
    }
  }

  addHiddenPondAncientTree(origin) {
    const point = this.getHiddenPondPoint(origin, -3.7, 2.5);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = origin.yaw - 0.45;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.88, 4.2, 9), this.materials.bark);
    trunk.position.y = 2;
    trunk.rotation.z = -0.12;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    for (const [x, yOffset, z, rotZ, scale] of [[-0.72, 3.3, 0.08, 0.82, 1], [0.78, 3.05, 0.02, -0.72, 0.88], [0.08, 3.65, -0.35, 0.12, 0.78]]) {
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 2.4 * scale, 8), this.materials.barkDark);
      limb.position.set(x, yOffset, z);
      limb.rotation.set(0.35, 0.1, rotZ);
      limb.castShadow = true;
      group.add(limb);
    }

    const canopies = [[0, 4.25, 0, 1.55], [-1.05, 3.9, 0.35, 1.18], [1.1, 3.75, -0.2, 1.1], [0.1, 4.8, -0.35, 0.95]];
    canopies.forEach(([x, yOffset, z, scale], index) => {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), index % 2 === 0 ? this.materials.leafAccent : this.materials.pine);
      crown.position.set(x, yOffset, z);
      crown.scale.set(scale * 1.25, scale * 0.78, scale);
      crown.castShadow = true;
      group.add(crown);
    });

    this.scene.add(group);
    group.traverse((child) => {
      if (child.isMesh) {
        this.colliders.push(child);
      }
    });
  }

  addHiddenPondSurroundings(origin) {
    const trees = [[4.8, 2.8, 3.8], [2.8, -5.1, 3.5], [-6.4, -2.8, 4.2]];
    trees.forEach(([localX, localZ, height], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      this.addPine(point.x, point.z, height, index === 0 ? this.materials.pineDark : this.materials.pine);
    });

    const rocks = [[-4.7, -1.1, 0.62], [3.2, 3.4, 0.78], [5.5, -1.5, 0.52], [-1.8, 4.6, 0.48]];
    rocks.forEach(([localX, localZ, scale], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      rock.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + scale * 0.24, point.z);
      rock.scale.set(scale * 1.12, scale * 0.45, scale * 0.86);
      rock.rotation.set(index * 0.3, origin.yaw + index * 0.6, index * 0.16);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    });

    const pads = [[-1.4, 0.9], [0.8, -1.2], [1.7, 0.6], [-0.6, -1.9], [2.4, -0.4]];
    pads.forEach(([localX, localZ], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(origin.x, origin.z) + 0.16;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.28 + (index % 2) * 0.08, 12), this.materials.lily);
      pad.position.set(point.x, y, point.z);
      pad.rotation.set(-Math.PI / 2, 0, origin.yaw + index);
      this.scene.add(pad);
    });

    this.addHiddenPondPlants(origin);
  }

  addHiddenPondPlants(origin) {
    const positions = [];
    for (let index = 0; index < 54; index += 1) {
      const angle = index * 2.399;
      const radius = 4.4 + (index % 5) * 0.5;
      positions.push([Math.sin(angle) * radius, Math.cos(angle) * radius, 0.52 + (index % 4) * 0.08]);
    }

    const grass = new THREE.InstancedMesh(this.geometries.grassBlade, this.materials.grassLight, positions.length);
    const matrix = new THREE.Matrix4();
    positions.forEach(([localX, localZ, scale], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z) + scale * 0.2;
      matrix.compose(
        new THREE.Vector3(point.x, y, point.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, origin.yaw + index * 1.4, 0.12)),
        new THREE.Vector3(scale, scale, scale)
      );
      grass.setMatrixAt(index, matrix);
    });
    grass.castShadow = true;
    grass.receiveShadow = true;
    this.scene.add(grass);

    const blossoms = [[-5.1, 1.8], [-3.9, 3.3], [3.8, -3.5], [4.6, 1.8]];
    blossoms.forEach(([localX, localZ]) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), this.materials.blossom);
      bloom.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.28, point.z);
      bloom.scale.set(1, 0.62, 1);
      this.scene.add(bloom);
    });
  }

  addHiddenPondTargets(origin) {
    const targets = [
      [-6.8, 4.4, origin.yaw + 2.15, 0.58],
      [5.9, -4.7, origin.yaw - 0.85, 0.55],
      [4.6, 4.9, origin.yaw - 2.35, 0.52],
    ];
    targets.forEach(([localX, localZ, yaw, scale]) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, yaw, scale, {
        challengeId: "hiddenPond",
        challengeLabel: "Hidden Pond",
      });
    });
  }

  addHiddenPondLore(origin) {
    const point = this.getHiddenPondPoint(origin, -4.7, 3.8);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const marker = new THREE.Group();
    marker.position.set(point.x, y + 0.24, point.z);
    marker.rotation.y = origin.yaw - 0.25;

    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.42), this.materials.stone);
    const carving = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 22), this.materials.targetGold);
    carving.position.set(0, 0.14, 0.06);
    carving.rotation.x = Math.PI / 2;
    marker.add(stone, carving);
    this.scene.add(marker);
    this.colliders.push(stone);

    this.interactables.push({
      id: "hidden-pond-carving",
      type: "lore-note",
      name: "Moss-Carved Stone",
      prompt: "E Read carving",
      position: new THREE.Vector3(point.x, y + 0.4, point.z),
      radius: 2.5,
      text: "Where the water keeps still, the lost arrows remember their names.",
    });
  }

  addHiddenPondDiscovery(origin) {
    const point = this.getHiddenPondPoint(origin, 2.6, -1.15);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const glint = new THREE.Group();
    glint.position.set(point.x, y + 0.18, point.z);
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.012, 8, 28), this.materials.crystalBlue);
    ripple.rotation.x = Math.PI / 2;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.materials.targetGold);
    shard.position.y = 0.18;
    glint.add(ripple, shard);
    this.scene.add(glint);

    this.interactables.push({
      id: "hidden-pond-water-edge",
      type: "xp-pickup",
      name: "Stillwater Glint",
      prompt: "E Inspect water",
      position: new THREE.Vector3(point.x, y + 0.28, point.z),
      radius: 2.3,
      xp: 24,
      group: glint,
      text: "A quiet glint rests under the pond's edge. +24 XP",
    });
  }

  addAncientRuins() {
    const origin = { x: 27, z: -29, yaw: -0.24, scale: 1 };
    this.ancientRuins = origin;
    this.addAncientRuinsPath(origin);
    this.addAncientRuinsStructures(origin);
    this.addAncientRuinsOvergrowth(origin);
    this.addAncientRuinsTargets(origin);
    this.addAncientRuinsPickups(origin);
    this.addAncientRuinsLore(origin);
    this.addAncientRuinsMechanism(origin);
  }

  getAncientRuinsPoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addAncientRuinsPath(origin) {
    const slabs = [
      [-11, 4.6, 0.9, 0.55], [-8.6, 3.6, 0.72, 0.48], [-6.3, 2.5, 0.95, 0.5], [-3.7, 1.4, 0.68, 0.42], [-1.3, 0.4, 0.9, 0.48],
      [1.5, -0.2, 0.82, 0.54], [3.9, -1.1, 0.72, 0.44],
    ];
    slabs.forEach(([localX, localZ, width, depth], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), this.materials.ancientStone);
      slab.position.set(point.x, y + 0.04, point.z);
      slab.rotation.set(0.02 * Math.sin(index), origin.yaw + index * 0.07, 0.03 * Math.cos(index));
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.scene.add(slab);
      this.colliders.push(slab);
    });
  }

  addAncientRuinsStructures(origin) {
    const floor = new THREE.Group();
    floor.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.04, origin.z);
    floor.rotation.y = origin.yaw;
    const floorPieces = [[0, 0, 2.1, 1.7], [-2.2, 0.8, 1.4, 1.1], [2.1, -1, 1.5, 1.2], [0.7, 2.1, 1.1, 0.9]];
    floorPieces.forEach(([x, z, width, depth], index) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), this.materials.ancientStone);
      piece.position.set(x, 0, z);
      piece.rotation.y = index * 0.22;
      piece.receiveShadow = true;
      piece.castShadow = true;
      floor.add(piece);
    });
    this.scene.add(floor);
    floor.traverse((child) => {
      if (child.isMesh) this.colliders.push(child);
    });

    this.addBrokenArch(origin, -3.2, -0.7, 0.1, 1.15);
    this.addBrokenArch(origin, 2.8, 1.1, Math.PI * 0.52, 0.92);
    this.addBrokenArch(origin, 0.4, -3.2, -Math.PI * 0.3, 0.72);

    const pillars = [
      [-4.4, 2.9, 1.6, 0.08], [-1.7, 3.7, 1.05, -0.18], [3.8, -2.8, 1.35, 0.22],
      [4.5, 2.3, 0.55, 1.35], [-3.1, -3.6, 0.5, -0.9],
    ];
    pillars.forEach(([localX, localZ, height, tilt], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, height, 8), index % 2 === 0 ? this.materials.ancientStone : this.materials.darkStone);
      pillar.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + height / 2, point.z);
      pillar.rotation.set(0.08, origin.yaw + index * 0.3, tilt);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.colliders.push(pillar);
    });

    const ledges = [[-5.6, -1.8, 1.8, 0.52], [4.8, 0.6, 1.55, -0.3]];
    ledges.forEach(([localX, localZ, width, yaw], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 1.15), this.materials.ancientStone);
      ledge.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.17, point.z);
      ledge.rotation.y = origin.yaw + yaw;
      ledge.castShadow = true;
      ledge.receiveShadow = true;
      this.scene.add(ledge);
      this.colliders.push(ledge);
    });

    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 8, 32), this.materials.glyphStone);
    glyph.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.16, origin.z);
    glyph.rotation.set(-Math.PI / 2, 0, origin.yaw);
    this.scene.add(glyph);

    const hush = new THREE.PointLight(0xb9c7ff, 0.28, 11, 2);
    hush.position.set(origin.x - 1.4, this.terrain.getHeightAt(origin.x, origin.z) + 1.6, origin.z - 0.7);
    this.scene.add(hush);
  }

  addBrokenArch(origin, localX, localZ, yaw, scale) {
    const point = this.getAncientRuinsPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = origin.yaw + yaw;
    group.scale.setScalar(scale);

    const left = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.2, 0.46), this.materials.ancientStone);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.62, 0.46), this.materials.ancientStone);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.34, 0.5), this.materials.ancientStone);
    left.position.set(-0.72, 1.1, 0);
    right.position.set(0.72, 0.81, 0);
    right.rotation.z = -0.08;
    cap.position.set(-0.13, 2.14, 0);
    cap.rotation.z = -0.12;

    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.55), this.materials.glyphStone);
    keystone.position.set(-0.18, 1.88, 0.02);
    group.add(left, right, cap, keystone);
    this.scene.add(group);
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        this.colliders.push(child);
      }
    });
  }

  addAncientRuinsOvergrowth(origin) {
    const vines = [[-3.6, 0.4, 1.8], [2.4, 1.4, 1.5], [0.5, -3.1, 1.2], [-5.1, 2.5, 1.1]];
    vines.forEach(([localX, localZ, height], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, height, 5), this.materials.grass);
      vine.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + height / 2, point.z);
      vine.rotation.set(0.16, origin.yaw + index * 0.8, 0.28 * Math.sin(index));
      vine.castShadow = true;
      this.scene.add(vine);
    });

    const grassPositions = [];
    for (let index = 0; index < 58; index += 1) {
      const angle = index * 2.399;
      const radius = 2.8 + (index % 6) * 0.65;
      if (index % 5 === 0) continue;
      grassPositions.push([Math.sin(angle) * radius, Math.cos(angle) * radius, 0.5 + (index % 4) * 0.11]);
    }
    const grass = new THREE.InstancedMesh(this.geometries.grassBlade, this.materials.grass, grassPositions.length);
    const matrix = new THREE.Matrix4();
    grassPositions.forEach(([localX, localZ, scale], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      matrix.compose(
        new THREE.Vector3(point.x, this.terrain.getHeightAt(point.x, point.z) + scale * 0.21, point.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, origin.yaw + index * 1.33, 0.1)),
        new THREE.Vector3(scale, scale, scale)
      );
      grass.setMatrixAt(index, matrix);
    });
    grass.castShadow = true;
    grass.receiveShadow = true;
    this.scene.add(grass);
  }

  addAncientRuinsTargets(origin) {
    const targets = [
      [-5.8, -1.9, origin.yaw + 1.4, 0.62, 0.48],
      [4.7, 0.6, origin.yaw - 1.72, 0.58, 0.42],
      [0.2, -5.2, origin.yaw + 0.18, 0.52, 0.1],
      [-1.9, 4.6, origin.yaw + Math.PI, 0.55, 0.26],
    ];
    targets.forEach(([localX, localZ, yaw, scale, yOffset]) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, yaw, scale, {
        challengeId: "ancientRuins",
        challengeLabel: "Ancient Ruins",
        yOffset,
      });
    });
  }

  addAncientRuinsPickups(origin) {
    const pickups = [
      [-4.7, 3.6, "Echo Shard", 18],
      [5.3, -2.1, "Chipped Arrowhead", 18],
      [1.1, -4.7, "Sunken Crest", 22],
    ];
    pickups.forEach(([localX, localZ, name, xp], index) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const group = new THREE.Group();
      group.position.set(point.x, y + 0.38, point.z);
      group.rotation.y = origin.yaw + index * 0.6;

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.14, 7), this.materials.darkStone);
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), this.materials.glyphStone);
      shard.position.y = 0.22;
      shard.castShadow = true;
      group.add(base, shard);
      this.scene.add(group);

      this.interactables.push({
        id: `ancient-ruins-pickup-${index}`,
        type: "xp-pickup",
        name,
        prompt: "E Collect",
        position: new THREE.Vector3(point.x, y + 0.4, point.z),
        radius: 2.2,
        xp,
        group,
        text: `${name} recovered. +${xp} XP`,
      });
    });
  }

  addAncientRuinsLore(origin) {
    const point = this.getAncientRuinsPoint(origin, -0.7, 2.8);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const tablet = new THREE.Group();
    tablet.position.set(point.x, y + 0.68, point.z);
    tablet.rotation.y = origin.yaw + 0.2;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.24, 0.22), this.materials.ancientStone);
    const glyphTop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 24), this.materials.glyphStone);
    const glyphLine = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.035, 0.035), this.materials.glyphStone);
    glyphTop.position.set(0, 0.22, 0.13);
    glyphLine.position.set(0, -0.18, 0.13);
    tablet.add(slab, glyphTop, glyphLine);
    this.scene.add(tablet);
    this.colliders.push(slab);

    this.interactables.push({
      id: "ancient-ruins-tablet",
      type: "lore-note",
      name: "Weathered Stone Tablet",
      prompt: "E Read tablet",
      position: new THREE.Vector3(point.x, y + 0.8, point.z),
      radius: 2.8,
      text: "Before the campfires, archers stood here and watched the old roads.",
    });
  }

  addAncientRuinsMechanism(origin) {
    const switchPoint = this.getAncientRuinsPoint(origin, 2.7, 3.25);
    this.addTarget(switchPoint.x, switchPoint.z, origin.yaw - 2.25, 0.36, {
      challengeId: "ancientRuins",
      challengeLabel: "Ancient Ruins",
      yOffset: 0.74,
      switchId: "ancient-ruins-cache",
    });

    const cachePoint = this.getAncientRuinsPoint(origin, -3.55, 3.55);
    const y = this.terrain.getHeightAt(cachePoint.x, cachePoint.z);
    const cache = new THREE.Group();
    cache.position.set(cachePoint.x, y + 0.18, cachePoint.z);
    cache.rotation.y = origin.yaw + 0.35;
    cache.visible = false;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.62), this.materials.ancientStone);
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), this.materials.glyphStone);
    shard.position.y = 0.22;
    cache.add(slab, shard);
    this.scene.add(cache);

    this.ancientRuinsCache = { group: cache, open: false };
    this.interactables.push({
      id: "ancient-ruins-revealed-cache",
      type: "xp-pickup",
      hidden: true,
      name: "Revealed Ruin Cache",
      prompt: "E Collect",
      position: new THREE.Vector3(cachePoint.x, y + 0.42, cachePoint.z),
      radius: 2.3,
      xp: 40,
      group: cache,
      text: "The old mechanism reveals a stored echo shard. +40 XP",
    });
  }

  openAncientRuinsCache() {
    if (!this.ancientRuinsCache || this.ancientRuinsCache.open) {
      return;
    }
    this.ancientRuinsCache.open = true;
    this.ancientRuinsCache.group.visible = true;
    const interactable = this.interactables.find((item) => item.id === "ancient-ruins-revealed-cache");
    if (interactable) {
      interactable.hidden = false;
    }
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.62 },
    }));
  }

  addHuntersCabin() {
    const origin = { x: -33, z: -18, yaw: 0.58, scale: 1 };
    this.huntersCabin = origin;
    this.addHuntersCabinStructure(origin);
    this.addHuntersCabinPorch(origin);
    this.addHuntersCabinSupplies(origin);
    this.addHuntersCabinTargets(origin);
    this.addHuntersCabinDetails(origin);
    this.addHuntersCabinDoorPrompt(origin);
  }

  getHuntersCabinPoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addHuntersCabinStructure(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const cabin = new THREE.Group();
    cabin.position.set(origin.x, y, origin.z);
    cabin.rotation.y = origin.yaw;

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.7, 2.25, 3.7), this.materials.wood);
    body.position.y = 1.15;
    body.scale.set(1.0, 1.0, 0.96);
    body.castShadow = true;
    body.receiveShadow = true;
    cabin.add(body);

    for (let row = 0; row < 5; row += 1) {
      const logY = 0.32 + row * 0.38;
      [-1, 1].forEach((side) => {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 4.95, 8), row % 2 === 0 ? this.materials.bark : this.materials.barkDark);
        log.position.set(0, logY, side * 1.95);
        log.rotation.z = Math.PI / 2;
        log.castShadow = true;
        cabin.add(log);
      });
    }

    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.32, 4.35), this.materials.barkDark);
    roofLeft.position.set(-0.82, 2.58, 0);
    roofLeft.rotation.z = 0.54;
    roofLeft.castShadow = true;
    roofLeft.receiveShadow = true;
    const roofRight = roofLeft.clone();
    roofRight.position.x = 0.82;
    roofRight.rotation.z = -0.54;
    cabin.add(roofLeft, roofRight);
    this.addBuildingCraftDetails(cabin, 4.7, 3.7, 2.25, { trim: this.materials.cutWood, beam: this.materials.barkDark });

    [-1, 1].forEach((side) => {
      const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 4.65, 8), this.materials.cutWood);
      eave.position.set(side * 2.18, 2.32, 0);
      eave.rotation.x = Math.PI / 2;
      eave.rotation.z = -side * 0.54;
      eave.castShadow = true;
      cabin.add(eave);
    });

    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.55, 8), this.materials.cutWood);
    ridge.position.y = 3.05;
    ridge.rotation.x = Math.PI / 2;
    ridge.castShadow = true;
    cabin.add(ridge);

    const sideLeanTo = this.createLayeredGableRoof(2.4, 2.2, 1.86, this.materials.lodgeRoof ?? this.materials.barkDark, {
      pitch: 0.28,
      overhang: 0.28,
      thickness: 0.16,
      asymmetry: 0.04,
      shingleRows: 2,
    });
    sideLeanTo.position.set(2.72, 0, 0.82);
    sideLeanTo.rotation.y = Math.PI / 2;
    cabin.add(sideLeanTo);

    [-2.18, 2.18].forEach((xOffset) => {
      const cornerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.44, 7), this.materials.barkDark);
      cornerPost.position.set(xOffset, 1.28, -1.96);
      cornerPost.rotation.z = xOffset > 0 ? -0.04 : 0.04;
      cornerPost.castShadow = true;
      cabin.add(cornerPost);
    });

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.42, 0.08), this.materials.barkDark);
    door.position.set(-0.62, 0.8, -1.91);
    door.castShadow = true;
    cabin.add(door);

    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), this.materials.targetGold);
    handle.position.set(-0.25, 0.82, -1.96);
    cabin.add(handle);

    const window = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.56, 0.07), this.materials.warmWindow);
    window.position.set(0.92, 1.26, -1.93);
    const windowSill = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.1), this.materials.cutWood);
    windowSill.position.set(0.92, 0.91, -1.98);
    cabin.add(window, windowSill);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.18, 0.52), this.materials.darkStone);
    chimney.position.set(1.18, 3.02, 0.72);
    chimney.rotation.z = -0.08;
    chimney.castShadow = true;
    cabin.add(chimney);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.66), this.materials.ancientStone);
    chimneyCap.position.set(1.18, 3.68, 0.72);
    chimneyCap.castShadow = true;
    cabin.add(chimneyCap);

    const loftWindow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.065), this.materials.warmWindow);
    loftWindow.position.set(0.08, 2.18, -2.02);
    const loftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.08), this.materials.cutWood);
    loftTrim.position.set(0.08, 1.92, -2.04);
    cabin.add(loftWindow, loftTrim);

    this.scene.add(cabin);
    this.colliders.push(body, roofLeft, roofRight, chimney);
  }

  addHuntersCabinPorch(origin) {
    const porchPoint = this.getHuntersCabinPoint(origin, -0.55, -2.55);
    const y = this.terrain.getHeightAt(porchPoint.x, porchPoint.z);
    const porch = new THREE.Group();
    porch.position.set(porchPoint.x, y + 0.16, porchPoint.z);
    porch.rotation.y = origin.yaw;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 1.35), this.materials.cutWood);
    deck.castShadow = true;
    deck.receiveShadow = true;
    porch.add(deck);

    [-1.35, 1.35].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.45, 7), this.materials.barkDark);
      post.position.set(x, 0.78, -0.42);
      post.castShadow = true;
      porch.add(post);
    });

    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.18, 1.15), this.materials.canvas);
    awning.position.set(0, 1.5, -0.28);
    awning.rotation.x = -0.12;
    awning.castShadow = true;
    porch.add(awning);

    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), this.materials.warmWindow);
    lantern.position.set(1.05, 1.18, -0.54);
    porch.add(lantern);

    const lanternLight = new THREE.PointLight(0xffb56a, 0.8, 7, 2.2);
    lanternLight.position.set(0.98, 1.22, -0.55);
    porch.add(lanternLight);

    this.scene.add(porch);
    this.colliders.push(deck);
  }

  addHuntersCabinSupplies(origin) {
    const placements = [
      [-3.6, -0.5, "woodpile"],
      [3.4, -0.9, "crate"],
      [2.8, 1.55, "rack"],
      [-2.8, 2.1, "hide"],
    ];

    placements.forEach(([localX, localZ, type], index) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      if (type === "woodpile") {
        for (let logIndex = 0; logIndex < 5; logIndex += 1) {
          const y = this.terrain.getHeightAt(point.x, point.z);
          const log = new THREE.Mesh(this.geometries.log, logIndex % 2 === 0 ? this.materials.cutWood : this.materials.bark);
          log.position.set(point.x + (logIndex % 2) * 0.18, y + 0.2 + Math.floor(logIndex / 2) * 0.2, point.z + logIndex * 0.13);
          log.rotation.set(Math.PI / 2, 0, origin.yaw + 0.18);
          log.scale.set(0.66, 0.66, 0.66);
          log.castShadow = true;
          this.scene.add(log);
          this.colliders.push(log);
        }
      } else if (type === "crate") {
        this.addCrates(point.x, point.z);
      } else if (type === "rack") {
        this.addArrowRack(point.x, point.z);
      } else {
        const y = this.terrain.getHeightAt(point.x, point.z);
        const hide = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8), this.materials.hideLeather);
        hide.position.set(point.x, y + 0.08, point.z);
        hide.scale.set(1.15, 0.08, 0.72);
        hide.rotation.set(0, origin.yaw + index * 0.2, 0);
        hide.receiveShadow = true;
        this.scene.add(hide);
      }
    });

    const firePoint = this.getHuntersCabinPoint(origin, -0.2, -5.0);
    this.addCampfire(firePoint.x, firePoint.z);
    this.addLogSeats(firePoint.x - 1.2, firePoint.z + 0.4);
  }

  addHuntersCabinTargets(origin) {
    const targets = [
      [4.6, -4.6, -0.72, 0.86],
      [6.4, -2.2, -1.08, 0.72],
      [5.4, 1.2, -1.36, 0.62],
    ];
    targets.forEach(([localX, localZ, yawOffset, scale]) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, origin.yaw + yawOffset, scale);
    });
  }

  addHuntersCabinDetails(origin) {
    const details = [
      [-4.4, -2.8, 0.42],
      [3.8, 3.2, 0.36],
      [-1.8, -4.1, 0.32],
      [1.7, -4.5, 0.3],
    ];
    details.forEach(([localX, localZ, scale], index) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      rock.position.set(point.x, y + scale * 0.18, point.z);
      rock.scale.set(scale * 1.25, scale * 0.42, scale * 0.85);
      rock.rotation.set(index * 0.34, origin.yaw + index * 0.28, 0.1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    });

    const notePoint = this.getHuntersCabinPoint(origin, 0.9, -2.95);
    const y = this.terrain.getHeightAt(notePoint.x, notePoint.z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.46), this.materials.parchment);
    board.position.set(notePoint.x, y + 0.38, notePoint.z);
    board.rotation.y = origin.yaw + 0.08;
    board.castShadow = true;
    this.scene.add(board);

    this.interactables.push({
      id: "hunters-cabin-notes",
      type: "lore-note",
      name: "Rowan's Field Notes",
      prompt: "E Read notes",
      position: new THREE.Vector3(notePoint.x, y + 0.45, notePoint.z),
      radius: 2.4,
      text: "Pond targets reward patience. Ruin targets reward angles. The tower rewards nerve.",
    });
  }

  addHuntersCabinDoorPrompt(origin) {
    const point = this.getHuntersCabinPoint(origin, 0, -2.05);
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.interactables.push({
      id: "hunters-cabin-door",
      type: "lore-note",
      name: "Hunter's Cabin",
      prompt: "E Knock",
      position: new THREE.Vector3(point.x, y + 0.5, point.z),
      radius: 2.7,
      text: "The cabin smells of cedar, waxed bowstrings, and practical advice. Rowan keeps the porch ready.",
    });
  }

  addCliffOverlook() {
    const origin = { x: -8, z: 37, yaw: Math.PI, scale: 1 };
    this.cliffOverlook = origin;
    this.addCliffOverlookPath(origin);
    this.addCliffOverlookPlatform(origin);
    this.addCliffOverlookRailing(origin);
    this.addCliffOverlookNature(origin);
    this.addCliffOverlookTarget(origin);
    this.addCliffOverlookLore(origin);
    this.addCliffOverlookScenicPoint(origin);
  }

  getCliffOverlookPoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addCliffOverlookPath(origin) {
    const stones = [
      [1.4, 13.2, 0.36], [0.8, 10.4, 0.3], [0.3, 7.8, 0.42], [-0.2, 5.1, 0.34], [-0.6, 2.7, 0.38],
    ];
    stones.forEach(([localX, localZ, scale], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.ancientStone : this.materials.stone);
      stone.position.set(point.x, y + scale * 0.08, point.z);
      stone.scale.set(scale * 1.7, scale * 0.16, scale * 0.86);
      stone.rotation.set(0.05, origin.yaw + index * 0.38, 0.08);
      stone.receiveShadow = true;
      stone.castShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);
    });
  }

  addCliffOverlookPlatform(origin) {
    const point = this.getCliffOverlookPoint(origin, 0, 0);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const overlook = new THREE.Group();
    overlook.position.set(point.x, y + 0.08, point.z);
    overlook.rotation.y = origin.yaw;

    const mainShelf = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.85, 0.3, 12), this.materials.ancientStone);
    mainShelf.scale.set(1.18, 1, 0.72);
    mainShelf.rotation.y = 0.18;
    mainShelf.castShadow = true;
    mainShelf.receiveShadow = true;
    overlook.add(mainShelf);

    const frontLip = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.34, 0.54), this.materials.darkStone);
    frontLip.position.set(0, 0.05, -2.35);
    frontLip.rotation.z = -0.03;
    frontLip.castShadow = true;
    frontLip.receiveShadow = true;
    overlook.add(frontLip);

    const vistaStone = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 0.24, 8), this.materials.glyphStone);
    vistaStone.position.set(-1.9, 0.24, 0.86);
    vistaStone.scale.set(1.1, 1, 0.72);
    vistaStone.castShadow = true;
    vistaStone.receiveShadow = true;
    overlook.add(vistaStone);

    this.scene.add(overlook);
    this.colliders.push(mainShelf, frontLip, vistaStone);
  }

  addCliffOverlookRailing(origin) {
    const railPieces = [
      [-2.35, -2.05, 0.18],
      [0, -2.38, 0],
      [2.35, -2.05, -0.18],
    ];
    railPieces.forEach(([localX, localZ, yawOffset], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const rail = new THREE.Group();
      rail.position.set(point.x, y, point.z);
      rail.rotation.y = origin.yaw + yawOffset;

      const left = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.92, 7), this.materials.barkDark);
      const right = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.72, 7), this.materials.barkDark);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(index === 1 ? 1.6 : 1.28, 0.1, 0.12), index === 1 ? this.materials.wood : this.materials.cutWood);
      left.position.set(-0.62, 0.46, 0);
      right.position.set(0.62, 0.36, 0);
      right.rotation.z = 0.12;
      cross.position.set(0, 0.72, 0);
      cross.rotation.z = -0.06;
      [left, right, cross].forEach((piece) => {
        piece.castShadow = true;
        rail.add(piece);
        this.colliders.push(piece);
      });
      this.scene.add(rail);
    });
  }

  addCliffOverlookNature(origin) {
    const trees = [
      [-4.5, 0.8, 3.4, -0.18],
      [3.8, 1.2, 3.0, 0.22],
      [-2.6, 4.1, 2.8, -0.28],
    ];
    trees.forEach(([localX, localZ, height, lean], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const trunk = new THREE.Mesh(this.geometries.trunk, this.materials.barkDark);
      trunk.position.set(point.x, y + height * 0.22, point.z);
      trunk.scale.set(0.78, height * 0.34, 0.78);
      trunk.rotation.z = lean;
      trunk.castShadow = true;

      const crown = new THREE.Mesh(this.geometries.pineTopSoft, index % 2 === 0 ? this.materials.pineDark : this.materials.leafAccent);
      crown.position.set(point.x + lean * 0.65, y + height * 0.7, point.z);
      crown.scale.set(height * 0.3, height * 0.42, height * 0.24);
      crown.rotation.z = lean * 0.8;
      crown.castShadow = true;
      this.scene.add(trunk, crown);
      this.colliders.push(trunk, crown);
    });

    const flowers = [
      [-3.2, -0.8], [-2.2, -1.25], [1.9, -1.1], [2.9, -0.45], [0.4, 1.9], [-1.1, 2.4],
    ];
    flowers.forEach(([localX, localZ], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const grass = new THREE.Mesh(this.geometries.grassBlade, index % 2 === 0 ? this.materials.grassLight : this.materials.grass);
      grass.position.set(point.x, y + 0.22, point.z);
      grass.scale.set(1.2, 0.9, 1.2);
      grass.rotation.z = 0.12 * (index % 2 === 0 ? 1 : -1);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 5), index % 3 === 0 ? this.materials.flower : this.materials.blossom);
      bloom.position.set(point.x + 0.06, y + 0.48, point.z - 0.03);
      bloom.scale.set(1, 0.58, 1);
      this.scene.add(grass, bloom);
    });
  }

  addCliffOverlookTarget(origin) {
    const targetPoint = this.getCliffOverlookPoint(origin, 7.8, 8.4);
    this.addTarget(targetPoint.x, targetPoint.z, origin.yaw - 0.92, 0.52, {
      challengeId: "cliffOverlook",
      challengeLabel: "Cliff Overlook",
      yOffset: 0.55,
    });
  }

  addCliffOverlookLore(origin) {
    const point = this.getCliffOverlookPoint(origin, -1.15, -0.72);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const group = new THREE.Group();
    group.position.set(point.x, y + 0.36, point.z);
    group.rotation.y = origin.yaw - 0.18;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.58), this.materials.ancientStone);
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 22), this.materials.glyphStone);
    glyph.position.set(0, 0.17, 0.02);
    glyph.rotation.x = Math.PI / 2;
    group.add(stone, glyph);
    this.scene.add(group);
    this.colliders.push(stone);

    this.interactables.push({
      id: "cliff-overlook-carving",
      type: "xp-pickup",
      name: "Overlook Carving",
      prompt: "E Read carving",
      position: new THREE.Vector3(point.x, y + 0.48, point.z),
      radius: 2.6,
      xp: 35,
      group,
      text: "From up here, every path looks connected. Some trails only appear when you are ready. +35 XP",
    });
  }

  addCliffOverlookScenicPoint(origin) {
    const point = this.getCliffOverlookPoint(origin, 0.25, -1.2);
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.interactables.push({
      id: "cliff-overlook-scenic-view",
      type: "lookout",
      name: "Cliff Overlook",
      prompt: "E Look out",
      position: new THREE.Vector3(point.x, y + 0.7, point.z),
      radius: 2.6,
      focus: new THREE.Vector3(14, y + 1.8, -8),
      text: "Every trail below feels connected for a breath.",
    });
  }

  addWhisperCave() {
    const origin = { x: -40, z: 25, yaw: -Math.PI / 2, scale: 1 };
    this.whisperCave = origin;
    this.whisperCaveGate = null;
    this.addWhisperCaveEntrance(origin);
    this.addWhisperCaveInterior(origin);
    this.addWhisperCaveCrystals(origin);
    this.addWhisperCaveTargets(origin);
    this.addWhisperCavePuzzle(origin);
    this.addWhisperCaveReward(origin);
    this.addWhisperCaveEntrancePrompt(origin);
  }

  getWhisperCavePoint(origin, localX, localZ) {
    const cos = Math.cos(origin.yaw);
    const sin = Math.sin(origin.yaw);
    return {
      x: origin.x + (localX * cos - localZ * sin) * origin.scale,
      z: origin.z + (localX * sin + localZ * cos) * origin.scale,
    };
  }

  addWhisperCaveEntrance(origin) {
    const archStones = [
      [-2.3, 0.2, 1.4, 2.4, 0.9],
      [2.3, 0.2, 1.3, 2.35, 0.9],
      [0, 0.5, 2.2, 1.05, 0.92],
      [-3.3, 1.5, 0.86, 1.3, 0.72],
      [3.2, 1.8, 0.78, 1.15, 0.68],
    ];

    archStones.forEach(([localX, localZ, width, height, depth], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), index % 2 === 0 ? this.materials.caveStone : this.materials.darkStone);
      stone.position.set(point.x, y + height * 0.42, point.z);
      stone.scale.set(width, height, depth);
      stone.rotation.set(index * 0.2, origin.yaw + index * 0.3, index * 0.11);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);
    });

    const signPoint = this.getWhisperCavePoint(origin, -3.6, -1.6);
    const signY = this.terrain.getHeightAt(signPoint.x, signPoint.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 7), this.materials.barkDark);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.08), this.materials.cutWood);
    post.position.set(signPoint.x, signY + 0.45, signPoint.z);
    board.position.set(signPoint.x, signY + 0.88, signPoint.z);
    board.rotation.y = origin.yaw + 0.18;
    post.castShadow = true;
    board.castShadow = true;
    this.scene.add(post, board);
    this.colliders.push(post);
  }

  addWhisperCaveEntrancePrompt(origin) {
    const point = this.getWhisperCavePoint(origin, 0, -1.2);
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.interactables.push({
      id: "whisper-cave-entrance-listen",
      type: "lore-note",
      name: "Whisper Cave",
      prompt: "E Listen",
      position: new THREE.Vector3(point.x, y + 0.6, point.z),
      radius: 3.0,
      text: "Cool air moves through the cave. Arrow impacts sound sharper inside.",
    });
  }

  addWhisperCaveInterior(origin) {
    const floorPieces = [
      [0, 2.6, 4.4, 3.4],
      [0, 6.6, 3.2, 4.2],
      [0, 11.2, 6.2, 5.2],
      [2.4, 14.5, 2.9, 2.4],
    ];

    floorPieces.forEach(([localX, localZ, width, depth], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), this.materials.caveFloor);
      floor.position.set(point.x, y + 0.03, point.z);
      floor.rotation.y = origin.yaw + (index === 3 ? -0.22 : 0);
      floor.receiveShadow = true;
      this.scene.add(floor);
    });

    const walls = [
      [-2.7, 3.2, 0.7, 2.4, 4.6], [2.7, 3.2, 0.7, 2.3, 4.6],
      [-2.2, 7.2, 0.72, 2.1, 3.8], [2.15, 7.2, 0.72, 2.1, 3.8],
      [-3.8, 11.5, 0.78, 2.6, 4.7], [3.8, 11.5, 0.78, 2.6, 4.7],
      [0, 15.2, 5.4, 2.1, 0.78],
    ];

    walls.forEach(([localX, localZ, width, height, depth], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), index % 2 === 0 ? this.materials.caveStone : this.materials.darkStone);
      wall.position.set(point.x, y + height / 2, point.z);
      wall.rotation.y = origin.yaw + (Math.sin(index) * 0.08);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
      this.colliders.push(wall);
    });

    const chamberLightPoint = this.getWhisperCavePoint(origin, 0, 11.4);
    const chamberY = this.terrain.getHeightAt(chamberLightPoint.x, chamberLightPoint.z);
    const chamberLight = new THREE.PointLight(0x8ddcff, 1.25, 12, 2.1);
    chamberLight.position.set(chamberLightPoint.x, chamberY + 2.1, chamberLightPoint.z);
    this.scene.add(chamberLight);

    const detailPieces = [
      [-1.65, 2.7, "pack"], [1.72, 4.0, "bones"], [-1.7, 7.2, "ledge"], [2.2, 8.2, "marker"],
      [-2.7, 11.4, "altar"], [2.9, 12.2, "ledge"], [0.6, 15.0, "camp"],
    ];
    detailPieces.forEach(([localX, localZ, type], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const group = new THREE.Group();
      group.position.set(point.x, y + 0.08, point.z);
      group.rotation.y = origin.yaw + Math.sin(index) * 0.28;
      if (type === "ledge") {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.44), index % 2 ? this.materials.caveStone : this.materials.darkStone);
        shelf.position.y = 0.48;
        shelf.rotation.z = Math.sin(index) * 0.08;
        group.add(shelf);
      } else if (type === "altar") {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.42, 8), this.materials.glyphStone);
        base.position.y = 0.28;
        const glyph = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.materials.crystalViolet);
        glyph.position.y = 0.62;
        group.add(base, glyph);
      } else if (type === "camp") {
        const mat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.42), this.materials.canvas);
        mat.position.y = 0.12;
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), this.materials.crystalBlue);
        lantern.position.set(0.42, 0.34, -0.08);
        group.add(mat, lantern);
      } else {
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), type === "marker" ? this.materials.glyphStone : this.materials.caveStone);
        stone.position.y = 0.2;
        stone.scale.set(1.2, 0.55, 0.9);
        const small = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.22), type === "pack" ? this.materials.hideLeather : this.materials.parchment);
        small.position.set(0.18, 0.16, 0.22);
        group.add(stone, small);
      }
      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.detailObject = true;
        }
      });
      this.scene.add(group);
    });
  }

  addWhisperCaveCrystals(origin) {
    const crystals = [
      [-1.8, 4.6, 0.72, "blue"], [1.65, 6.2, 0.56, "violet"], [-3.0, 10.1, 0.9, "violet"],
      [2.7, 12.4, 0.78, "blue"], [0.8, 15.8, 0.62, "blue"], [-0.9, 13.6, 0.44, "violet"],
    ];

    crystals.forEach(([localX, localZ, scale, tone], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const group = new THREE.Group();
      group.position.set(point.x, y, point.z);
      group.rotation.y = origin.yaw + index * 0.31;
      const material = tone === "blue" ? this.materials.crystalBlue : this.materials.crystalViolet;
      for (let shard = 0; shard < 3; shard += 1) {
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.18 - shard * 0.03, 0.86 - shard * 0.12, 5), material);
        crystal.position.set((shard - 1) * 0.18, 0.38 + shard * 0.06, Math.sin(shard) * 0.12);
        crystal.rotation.z = (shard - 1) * 0.18;
        crystal.castShadow = true;
        group.add(crystal);
      }
      group.scale.setScalar(scale);
      this.scene.add(group);

      const glow = new THREE.PointLight(tone === "blue" ? 0x6fd8ff : 0xb99cff, 0.45 * scale, 6, 2.2);
      glow.position.set(point.x, y + 0.85 * scale, point.z);
      this.scene.add(glow);
    });
  }

  addWhisperCaveTargets(origin) {
    const targets = [
      [-1.7, 5.2, -0.04, 0.58],
      [2.35, 10.8, 0.26, 0.55],
      [-2.8, 13.2, -0.34, 0.48],
    ];
    targets.forEach(([localX, localZ, yawOffset, scale]) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, origin.yaw + Math.PI + yawOffset, scale, {
        challengeId: "whisperCaveTargets",
        challengeLabel: "Whisper Cave Targets",
        yOffset: 0.22,
        caveSound: true,
      });
    });
  }

  addWhisperCavePuzzle(origin) {
    const gatePoint = this.getWhisperCavePoint(origin, 0, 8.7);
    const gateY = this.terrain.getHeightAt(gatePoint.x, gatePoint.z);
    const gate = new THREE.Group();
    gate.position.set(gatePoint.x, gateY, gatePoint.z);
    gate.rotation.y = origin.yaw;

    const bars = [];
    for (let index = 0; index < 5; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.14), index % 2 === 0 ? this.materials.darkStone : this.materials.caveStone);
      bar.position.set(-0.78 + index * 0.39, 0.92, 0);
      bar.castShadow = true;
      gate.add(bar);
      bars.push(bar);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.16), this.materials.glyphStone);
    cross.position.set(0, 1.38, 0.02);
    cross.castShadow = true;
    gate.add(cross);
    this.scene.add(gate);
    this.colliders.push(...bars, cross);
    this.whisperCaveGate = { group: gate, colliders: [...bars, cross], open: false };

    const switchPoint = this.getWhisperCavePoint(origin, -2.75, 7.6);
    this.addTarget(switchPoint.x, switchPoint.z, origin.yaw + Math.PI * 0.72, 0.34, {
      challengeId: "whisperGate",
      challengeLabel: "Whisper Gate",
      yOffset: 0.72,
      switchId: "whisper-cave-gate",
      caveSound: true,
    });
  }

  openWhisperCaveGate() {
    if (!this.whisperCaveGate || this.whisperCaveGate.open) {
      return;
    }

    this.whisperCaveGate.open = true;
    this.whisperCaveGate.group.position.y += 2.2;
    this.colliders = this.colliders.filter((collider) => !this.whisperCaveGate.colliders.includes(collider));
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "caveGateOpen", intensity: 0.95 },
    }));
  }

  addWhisperCaveReward(origin) {
    const point = this.getWhisperCavePoint(origin, 2.45, 15.3);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const chest = new THREE.Group();
    chest.position.set(point.x, y + 0.28, point.z);
    chest.rotation.y = origin.yaw - 0.24;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.42, 0.56), this.materials.wood);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.6), this.materials.cutWood);
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), this.materials.targetGold);
    lid.position.y = 0.3;
    latch.position.set(0, 0.2, -0.32);
    base.castShadow = true;
    lid.castShadow = true;
    chest.add(base, lid, latch);
    this.scene.add(chest);
    this.colliders.push(base);

    this.interactables.push({
      id: "whisper-cave-cache",
      type: "xp-pickup",
      name: "Whisper Cave Cache",
      prompt: "E Open cache",
      position: new THREE.Vector3(point.x, y + 0.55, point.z),
      radius: 2.5,
      xp: 75,
      group: chest,
      text: "A quiet cache tucked beyond the gate. +75 XP",
    });
  }

  isInsideWhisperCave(position) {
    return position.x > -38.7 && position.x < -22.5 && position.z > 19.4 && position.z < 31.8;
  }

  addLandmarkPolishPass() {
    this.polishStartingCamp();
    this.polishWatchtower();
    this.polishHiddenPond();
    this.polishAncientRuins();
    this.polishHuntersCabin();
    this.polishCliffOverlook();
    this.polishWhisperCave();
  }

  addDetailBox(x, z, yOffset, width, height, depth, yaw, material, options = {}) {
    const y = this.terrain.getHeightAt(x, z);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y + yOffset, z);
    mesh.rotation.set(options.pitch ?? 0, yaw, options.roll ?? 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (options.collider) {
      this.colliders.push(mesh);
    }
    return mesh;
  }

  addDetailCylinder(x, z, yOffset, radiusTop, radiusBottom, height, yaw, material, options = {}) {
    const y = this.terrain.getHeightAt(x, z);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.sides ?? 7), material);
    mesh.position.set(x, y + yOffset, z);
    mesh.rotation.set(options.pitch ?? 0, yaw, options.roll ?? 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (options.collider) {
      this.colliders.push(mesh);
    }
    return mesh;
  }

  polishStartingCamp() {
    const trimPieces = [
      [-18.25, -7.4, 0.72, 1.7, 0.1, 0.12, 0.62],
      [-15.55, -8.55, 0.58, 1.15, 0.09, 0.1, 0.62],
      [-13.7, -3.95, 0.34, 1.35, 0.08, 0.1, -0.3],
      [-11.9, -5.0, 0.31, 1.05, 0.08, 0.1, 0.7],
    ];
    trimPieces.forEach(([x, z, yOffset, width, height, depth, yaw]) => {
      this.addDetailBox(x, z, yOffset, width, height, depth, yaw, this.materials.warmTrim);
    });

    const campMarkers = [
      [-16.0, -4.6, 0.95],
      [-20.0, -6.8, 0.55],
      [-12.1, -8.0, -0.2],
    ];
    campMarkers.forEach(([x, z, yaw], index) => {
      const y = this.terrain.getHeightAt(x, z);
      const banner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 3), index === 1 ? this.materials.banner : this.materials.targetGold);
      banner.position.set(x, y + 1.18, z);
      banner.rotation.set(0, yaw, -Math.PI / 2);
      banner.castShadow = true;
      this.scene.add(banner);
    });
  }

  polishWatchtower() {
    const origin = this.watchtower;
    const braces = [
      [-1.85, -1.85, 1.6, 0.2],
      [1.72, -1.85, 1.48, -0.2],
      [-1.6, 1.42, 1.3, -0.36],
      [1.45, 1.15, 1.12, 0.32],
    ];
    braces.forEach(([localX, localZ, height, roll]) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, height, 0.14, 2.15, 0.16, origin.yaw + 0.18, this.materials.agedWood, { roll, collider: true });
    });

    const crownBits = [
      [-0.8, -1.92, 3.2, 1.1, 0.14, 0.18, 0],
      [0.85, -1.92, 3.05, 0.82, 0.12, 0.16, 0.18],
      [-1.8, 0.6, 2.92, 0.72, 0.12, 0.16, Math.PI / 2],
    ];
    crownBits.forEach(([localX, localZ, yOffset, width, height, depth, yawOffset]) => {
      const point = this.getWatchtowerPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, width, height, depth, origin.yaw + yawOffset, this.materials.cutWood);
    });

    const point = this.getWatchtowerPoint(origin, -2.65, 0.25);
    this.addDetailCylinder(point.x, point.z, 1.0, 0.07, 0.09, 1.65, origin.yaw, this.materials.rope, { roll: 0.18 });
  }

  polishHiddenPond() {
    const origin = this.hiddenPond;
    const shoreStones = [
      [-4.2, 0.2, 0.44], [-2.5, -3.5, 0.34], [0.4, -4.35, 0.38], [3.3, -2.6, 0.48],
      [4.15, 1.2, 0.36], [1.8, 3.9, 0.42], [-1.2, 4.25, 0.32], [-4.0, 2.55, 0.4],
    ];
    shoreStones.forEach(([localX, localZ, scale], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 3 === 0 ? this.materials.mossStone : this.materials.stone);
      stone.position.set(point.x, y + scale * 0.12, point.z);
      stone.scale.set(scale * 1.5, scale * 0.2, scale * 0.86);
      stone.rotation.set(0.05, origin.yaw + index * 0.55, 0.08);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);
    });

    const focusPoint = this.getHiddenPondPoint(origin, -2.55, 1.1);
    this.addDetailCylinder(focusPoint.x, focusPoint.z, 0.5, 0.12, 0.16, 1.05, origin.yaw - 0.42, this.materials.glyphStone, { roll: -0.18 });

    const blossomArcs = [[-3.2, 3.4], [-2.3, 4.0], [2.6, 2.9], [3.4, 1.8]];
    blossomArcs.forEach(([localX, localZ], index) => {
      const point = this.getHiddenPondPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), index % 2 === 0 ? this.materials.blossom : this.materials.flower);
      bloom.position.set(point.x, y + 0.32, point.z);
      bloom.scale.set(1, 0.62, 1);
      this.scene.add(bloom);
    });
  }

  polishAncientRuins() {
    const origin = this.ancientRuins;
    const storyBlocks = [
      [-1.2, -0.4, 0.26, 1.05, 0.22, 0.44, 0.08, this.materials.glyphStone],
      [1.7, 1.95, 0.2, 1.25, 0.16, 0.34, -0.28, this.materials.mossStone],
      [-4.8, 0.9, 0.32, 1.4, 0.24, 0.46, 0.46, this.materials.ancientStone],
      [4.15, -0.85, 0.28, 1.15, 0.18, 0.4, -0.4, this.materials.darkStone],
    ];
    storyBlocks.forEach(([localX, localZ, yOffset, width, height, depth, yawOffset, material]) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, width, height, depth, origin.yaw + yawOffset, material, { roll: 0.04, collider: true });
    });

    const archCaps = [
      [-3.2, -0.7, 2.18, 0.96, 0.12, 0.2, 0.1],
      [2.8, 1.1, 1.85, 0.78, 0.1, 0.18, Math.PI * 0.52],
      [0.4, -3.2, 1.5, 0.62, 0.1, 0.18, -Math.PI * 0.3],
    ];
    archCaps.forEach(([localX, localZ, yOffset, width, height, depth, yawOffset]) => {
      const point = this.getAncientRuinsPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, width, height, depth, origin.yaw + yawOffset, this.materials.glyphStone);
    });
  }

  polishHuntersCabin() {
    const origin = this.huntersCabin;
    const trim = [
      [-1.85, -1.93, 1.62, 0.12, 1.55, 0.1, 0],
      [1.85, -1.93, 1.62, 0.12, 1.35, 0.1, 0],
      [0.25, -2.02, 1.58, 1.35, 0.12, 0.1, 0],
      [-2.35, 0.0, 2.1, 0.12, 2.25, 0.12, 0.02],
      [2.35, 0.0, 2.0, 0.12, 2.0, 0.12, -0.02],
    ];
    trim.forEach(([localX, localZ, yOffset, width, height, depth, yawOffset]) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, width, height, depth, origin.yaw + yawOffset, this.materials.agedWood, { collider: true });
    });

    const roofCaps = [[-1.25, -0.08, 3.08], [1.25, -0.08, 3.08], [0, 1.75, 2.68]];
    roofCaps.forEach(([localX, localZ, yOffset], index) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, 1.25 - index * 0.18, 0.12, 0.18, origin.yaw + 0.08 * (index - 1), this.materials.warmTrim);
    });

    const livedIn = [[-3.0, -2.6, 0.28], [2.55, -3.15, -0.18], [3.55, 0.55, 0.36]];
    livedIn.forEach(([localX, localZ, yawOffset], index) => {
      const point = this.getHuntersCabinPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, 0.24 + index * 0.04, 0.72, 0.18, 0.42, origin.yaw + yawOffset, index === 0 ? this.materials.canvas : this.materials.cutWood);
    });
  }

  polishCliffOverlook() {
    const origin = this.cliffOverlook;
    const edgeStones = [
      [-3.0, -2.45, 0.58], [-1.2, -2.8, 0.42], [1.25, -2.75, 0.48], [3.05, -2.38, 0.54],
    ];
    edgeStones.forEach(([localX, localZ, scale], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.mossStone : this.materials.ancientStone);
      stone.position.set(point.x, y + scale * 0.14, point.z);
      stone.scale.set(scale * 1.5, scale * 0.32, scale * 0.84);
      stone.rotation.set(0.08, origin.yaw + index * 0.5, 0.08);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);
    });

    const sightlineMarkers = [[-2.1, 0.7, -0.3], [2.0, 0.62, 0.32], [0, -1.72, 0]];
    sightlineMarkers.forEach(([localX, localZ, yawOffset], index) => {
      const point = this.getCliffOverlookPoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, 0.48 + index * 0.04, 0.62, 0.08, 0.24, origin.yaw + yawOffset, this.materials.glyphStone);
    });
  }

  polishWhisperCave() {
    const origin = this.whisperCave;
    const mouthTeeth = [
      [-1.45, -0.15, 1.9, 0.24, 0.75],
      [1.35, -0.05, 1.72, -0.18, 0.68],
      [0.0, 0.1, 2.35, 0.04, 0.82],
      [-2.8, 1.0, 1.2, -0.34, 0.52],
      [2.75, 1.15, 1.1, 0.28, 0.48],
    ];
    mouthTeeth.forEach(([localX, localZ, yOffset, roll, scale], index) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      this.addDetailCylinder(point.x, point.z, yOffset, 0.08 * scale, 0.18 * scale, 1.2 * scale, origin.yaw + index * 0.2, index % 2 === 0 ? this.materials.caveStone : this.materials.darkStone, { roll, sides: 5, collider: true });
    });

    const chamberLayers = [
      [-3.0, 9.8, 0.62, 1.2, 0.18, 0.42, 0.4],
      [3.0, 10.6, 0.52, 1.0, 0.16, 0.38, -0.5],
      [-1.2, 14.3, 0.38, 0.9, 0.14, 0.32, 0.18],
    ];
    chamberLayers.forEach(([localX, localZ, yOffset, width, height, depth, yawOffset]) => {
      const point = this.getWhisperCavePoint(origin, localX, localZ);
      this.addDetailBox(point.x, point.z, yOffset, width, height, depth, origin.yaw + yawOffset, this.materials.mossStone, { pitch: 0.04, collider: true });
    });

    const crystalFocus = this.getWhisperCavePoint(origin, 0.1, 12.3);
    const y = this.terrain.getHeightAt(crystalFocus.x, crystalFocus.z);
    const focal = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.45, 5), this.materials.crystalBlue);
    focal.position.set(crystalFocus.x, y + 0.78, crystalFocus.z);
    focal.rotation.z = 0.08;
    focal.castShadow = true;
    this.scene.add(focal);
  }

  registerLandmarks() {
    this.landmarks = [
      { id: "starting-camp", name: "Starting Camp", position: new THREE.Vector3(-15, 0, -6), radius: 6.4 },
      { id: "training-area", name: "Training Area", position: new THREE.Vector3(0, 0, -18), radius: 7.2 },
      { id: "old-watchtower", name: "Old Watchtower", position: new THREE.Vector3(this.watchtower.x, 0, this.watchtower.z), radius: 7.2 },
      { id: "hidden-pond", name: "Hidden Pond", position: new THREE.Vector3(this.hiddenPond.x, 0, this.hiddenPond.z), radius: 7.4 },
      { id: "ancient-ruins", name: "Ancient Ruins", position: new THREE.Vector3(this.ancientRuins.x, 0, this.ancientRuins.z), radius: 7.8 },
      { id: "hunters-cabin", name: "Hunter's Cabin", position: new THREE.Vector3(this.huntersCabin.x, 0, this.huntersCabin.z), radius: 7 },
      { id: "cliff-overlook", name: "Cliff Overlook", position: new THREE.Vector3(this.cliffOverlook.x, 0, this.cliffOverlook.z), radius: 7.2 },
      { id: "whisper-cave", name: "Whisper Cave", position: new THREE.Vector3(this.whisperCave.x, 0, this.whisperCave.z), radius: 8 },
      { id: "river-crossing", name: "River Crossing", position: new THREE.Vector3(this.riverCrossing.x, 0, this.riverCrossing.z), radius: 8.4 },
      { id: "mountain-path", name: "Mountain Path", position: new THREE.Vector3(this.mountainPath.x, 0, this.mountainPath.z), radius: 10 },
      { id: "forgotten-grove", name: "Forgotten Grove", position: new THREE.Vector3(this.forgottenGrove.x, 0, this.forgottenGrove.z), radius: 10.5 },
      { id: "archers-guild", name: "Archer's Guild", position: new THREE.Vector3(this.archersGuild.x, 0, this.archersGuild.z), radius: 12 },
      { id: "guild-village", name: "Guild Village", position: new THREE.Vector3(this.archersGuild.x, 0, this.archersGuild.z + 3), radius: 20 },
      { id: "guild-quest-board", name: "Guild Quest Board", position: new THREE.Vector3(this.guildVillageServices.questBoard.x, 0, this.guildVillageServices.questBoard.z), radius: 5 },
      { id: "hall-of-arrows", name: "Hall of Arrows", position: new THREE.Vector3(this.hallOfArrows.x, 0, this.hallOfArrows.z), radius: 14 },
      { id: "mountain-fortress", name: "Mountain Fortress", position: new THREE.Vector3(this.mountainFortress.x, 0, this.mountainFortress.z), radius: 18 },
      { id: "archers-lodge", name: "Archer's Lodge", position: new THREE.Vector3(this.archersLodge.x, 0, this.archersLodge.z), radius: 12 },
      { id: "frostpeak-mountains", name: "Frostpeak Mountains", position: new THREE.Vector3(this.frostpeak.x, 0, this.frostpeak.z), radius: 20 },
      { id: "frozen-watchtower", name: "Frozen Watchtower", position: new THREE.Vector3(this.frozenWatchtower.x, 0, this.frozenWatchtower.z), radius: 8 },
      { id: "icefall-cavern", name: "Icefall Cavern", position: new THREE.Vector3(this.icefallCavern.x, 0, this.icefallCavern.z), radius: 8 },
      { id: "frost-shrine", name: "Frost Shrine", position: new THREE.Vector3(this.frostTemple.x, 0, this.frostTemple.z), radius: 8 },
      { id: "summit-overlook", name: "Summit Overlook", position: new THREE.Vector3(this.summitOverlook.x, 0, this.summitOverlook.z), radius: 9 },
      { id: "coastal-cliffs", name: "Coastal Cliffs", position: new THREE.Vector3(this.coastalCliffs.x, 0, this.coastalCliffs.z), radius: 21 },
      { id: "broken-lighthouse", name: "Broken Lighthouse", position: new THREE.Vector3(this.brokenLighthouse.x, 0, this.brokenLighthouse.z), radius: 9 },
      { id: "sea-cave-shrine", name: "Sea Cave Shrine", position: new THREE.Vector3(this.seaCaveShrine.x, 0, this.seaCaveShrine.z), radius: 9 },
      { id: "shipwreck-cove", name: "Shipwreck Cove", position: new THREE.Vector3(this.shipwreckCove.x, 0, this.shipwreckCove.z), radius: 9.5 },
      { id: "windspire-bridge", name: "Windspire Bridge", position: new THREE.Vector3(this.windspireBridge.x, 0, this.windspireBridge.z), radius: 9 },
      { id: "mistwood", name: "Mistwood", position: new THREE.Vector3(this.mistwood.x, 0, this.mistwood.z), radius: 21 },
      { id: "elder-tree", name: "Elder Tree", position: new THREE.Vector3(this.elderTree.x, 0, this.elderTree.z), radius: 10 },
      { id: "moonlit-clearing", name: "Moonlit Clearing", position: new THREE.Vector3(this.moonlitClearing.x, 0, this.moonlitClearing.z), radius: 9 },
      { id: "forgotten-shrine", name: "Forgotten Shrine", position: new THREE.Vector3(this.forgottenShrine.x, 0, this.forgottenShrine.z), radius: 9 },
      { id: "rootfall-hollow", name: "Rootfall Hollow", position: new THREE.Vector3(this.rootfallHollow.x, 0, this.rootfallHollow.z), radius: 9 },
      { id: "echo-grove", name: "Echo Grove", position: new THREE.Vector3(this.echoGrove.x, 0, this.echoGrove.z), radius: 9 },
      { id: "blackwater-marsh", name: "Blackwater Marsh", position: new THREE.Vector3(this.blackwaterMarsh.x, 0, this.blackwaterMarsh.z), radius: 23 },
      { id: "sunken-shrine", name: "Sunken Shrine", position: new THREE.Vector3(this.sunkenShrine.x, 0, this.sunkenShrine.z), radius: 10 },
      { id: "mosswatch-tower", name: "Mosswatch Tower", position: new THREE.Vector3(this.mosswatchTower.x, 0, this.mosswatchTower.z), radius: 9 },
      { id: "crooked-boardwalk", name: "Crooked Boardwalk", position: new THREE.Vector3(this.crookedBoardwalk.x, 0, this.crookedBoardwalk.z), radius: 10 },
      { id: "drowned-ruins", name: "Drowned Ruins", position: new THREE.Vector3(this.drownedRuins.x, 0, this.drownedRuins.z), radius: 10 },
      { id: "witchlight-grove", name: "Witchlight Grove", position: new THREE.Vector3(this.witchlightGrove.x, 0, this.witchlightGrove.z), radius: 10 },
      { id: "red-canyon", name: "Red Canyon", position: new THREE.Vector3(this.redCanyon.x, 0, this.redCanyon.z), radius: 24 },
      { id: "skybridge-crossing", name: "Skybridge Crossing", position: new THREE.Vector3(this.skybridgeCrossing.x, 0, this.skybridgeCrossing.z), radius: 10 },
      { id: "crimson-arch", name: "Crimson Arch", position: new THREE.Vector3(this.crimsonArch.x, 0, this.crimsonArch.z), radius: 10 },
      { id: "forgotten-outpost", name: "Forgotten Outpost", position: new THREE.Vector3(this.forgottenOutpost.x, 0, this.forgottenOutpost.z), radius: 10 },
      { id: "sunspire-plateau", name: "Sunspire Plateau", position: new THREE.Vector3(this.sunspirePlateau.x, 0, this.sunspirePlateau.z), radius: 11 },
      { id: "echo-chasm", name: "Echo Chasm", position: new THREE.Vector3(this.echoChasm.x, 0, this.echoChasm.z), radius: 11 },
      { id: "ashen-highlands", name: "Ashen Highlands", position: new THREE.Vector3(this.ashenHighlands.x, 0, this.ashenHighlands.z), radius: 25 },
      { id: "ember-peak", name: "Ember Peak", position: new THREE.Vector3(this.emberPeak.x, 0, this.emberPeak.z), radius: 12 },
      { id: "obsidian-citadel", name: "Obsidian Citadel", position: new THREE.Vector3(this.obsidianCitadel.x, 0, this.obsidianCitadel.z), radius: 12 },
      { id: "ashfall-basin", name: "Ashfall Basin", position: new THREE.Vector3(this.ashfallBasin.x, 0, this.ashfallBasin.z), radius: 12 },
      { id: "firewatch-spire", name: "Firewatch Spire", position: new THREE.Vector3(this.firewatchSpire.x, 0, this.firewatchSpire.z), radius: 12 },
      { id: "molten-hollow", name: "Molten Hollow", position: new THREE.Vector3(this.moltenHollow.x, 0, this.moltenHollow.z), radius: 12 },
      { id: "starfall-vale", name: "Starfall Vale", position: new THREE.Vector3(this.starfallVale.x, 0, this.starfallVale.z), radius: 23 },
      { id: "starfall-observatory", name: "Starfall Observatory", position: new THREE.Vector3(this.starfallObservatory.x, 0, this.starfallObservatory.z), radius: 12 },
      { id: "moonspire-ridge", name: "Moonspire Ridge", position: new THREE.Vector3(this.moonspireRidge.x, 0, this.moonspireRidge.z), radius: 12 },
      { id: "celestial-basin", name: "Celestial Basin", position: new THREE.Vector3(this.celestialBasin.x, 0, this.celestialBasin.z), radius: 13 },
      { id: "shattered-sky-bridge", name: "Shattered Sky Bridge", position: new THREE.Vector3(this.shatteredSkyBridge.x, 0, this.shatteredSkyBridge.z), radius: 12 },
      { id: "crystalheart-grove", name: "Crystalheart Grove", position: new THREE.Vector3(this.crystalheartGrove.x, 0, this.crystalheartGrove.z), radius: 12 },
      { id: "astral-sanctum", name: "Astral Sanctum", position: new THREE.Vector3(this.astralSanctum.x, 0, this.astralSanctum.z), radius: 13 },
      { id: "frontier-plains", name: "Frontier Plains", position: new THREE.Vector3(this.frontierPlains.x, 0, this.frontierPlains.z), radius: 26 },
      { id: "frontier-outpost", name: "Frontier Outpost", position: new THREE.Vector3(this.frontierOutpost.x, 0, this.frontierOutpost.z), radius: 12 },
      { id: "frontier-watch", name: "Frontier Watch", position: new THREE.Vector3(this.frontierWatch.x, 0, this.frontierWatch.z), radius: 11 },
      { id: "whispering-fields", name: "Whispering Fields", position: new THREE.Vector3(this.whisperingFields.x, 0, this.whisperingFields.z), radius: 12 },
      { id: "stone-circle-echoes", name: "Stone Circle of Echoes", position: new THREE.Vector3(this.stoneCircleEchoes.x, 0, this.stoneCircleEchoes.z), radius: 12 },
      { id: "broken-kings-road", name: "Broken King's Road", position: new THREE.Vector3(this.brokenKingsRoad.x, 0, this.brokenKingsRoad.z), radius: 12 },
      { id: "greenwater-crossing", name: "Greenwater Crossing", position: new THREE.Vector3(this.greenwaterCrossing.x, 0, this.greenwaterCrossing.z), radius: 12 },
      { id: "forgotten-camp", name: "Forgotten Camp", position: new THREE.Vector3(this.forgottenCamp.x, 0, this.forgottenCamp.z), radius: 11 },
      { id: "lost-kingdom", name: "The Lost Kingdom", position: new THREE.Vector3(this.lostKingdom.x, 0, this.lostKingdom.z), radius: 24 },
      { id: "kings-gate", name: "King's Gate", position: new THREE.Vector3(this.kingsGate.x, 0, this.kingsGate.z), radius: 11 },
      { id: "sun-temple", name: "Sun Temple", position: new THREE.Vector3(this.sunTemple.x, 0, this.sunTemple.z), radius: 12 },
      { id: "forgotten-plaza", name: "Forgotten Plaza", position: new THREE.Vector3(this.forgottenPlaza.x, 0, this.forgottenPlaza.z), radius: 12 },
      { id: "watchers-tower", name: "Watcher's Tower", position: new THREE.Vector3(this.watchersTower.x, 0, this.watchersTower.z), radius: 11 },
      { id: "hall-of-echoes", name: "Hall of Echoes", position: new THREE.Vector3(this.hallOfEchoes.x, 0, this.hallOfEchoes.z), radius: 12 },
      { id: "sealed-archive", name: "The Sealed Archive", position: new THREE.Vector3(this.sealedArchive.x, 0, this.sealedArchive.z), radius: 13 },
      { id: "celestial-expanse", name: "The Celestial Expanse", position: new THREE.Vector3(this.celestialExpanse.x, 0, this.celestialExpanse.z), radius: 24 },
      { id: "observatory-prime", name: "Observatory Prime", position: new THREE.Vector3(this.observatoryPrime.x, 0, this.observatoryPrime.z), radius: 12 },
      { id: "skyfall-basin", name: "Skyfall Basin", position: new THREE.Vector3(this.skyfallBasin.x, 0, this.skyfallBasin.z), radius: 12 },
      { id: "crystal-sea", name: "Crystal Sea", position: new THREE.Vector3(this.crystalSea.x, 0, this.crystalSea.z), radius: 12 },
      { id: "floating-reach", name: "The Floating Reach", position: new THREE.Vector3(this.floatingReach.x, 0, this.floatingReach.z), radius: 12 },
      { id: "starforge-ruins", name: "Starforge Ruins", position: new THREE.Vector3(this.starforgeRuins.x, 0, this.starforgeRuins.z), radius: 12 },
      { id: "temple-first-sky", name: "Temple of the First Sky", position: new THREE.Vector3(this.templeFirstSky.x, 0, this.templeFirstSky.z), radius: 13 },
      { id: "shattered-coast", name: "Shattered Coast", position: new THREE.Vector3(this.shatteredCoast.x, 0, this.shatteredCoast.z), radius: 24 },
      { id: "stormwatch-fortress", name: "Stormwatch Fortress", position: new THREE.Vector3(this.stormwatchFortress.x, 0, this.stormwatchFortress.z), radius: 13 },
      { id: "broken-beacon", name: "The Broken Beacon", position: new THREE.Vector3(this.brokenBeacon.x, 0, this.brokenBeacon.z), radius: 12 },
      { id: "tidefall-caverns", name: "Tidefall Caverns", position: new THREE.Vector3(this.tidefallCaverns.x, 0, this.tidefallCaverns.z), radius: 12 },
      { id: "kings-sea-gate", name: "King's Sea Gate", position: new THREE.Vector3(this.kingsSeaGate.x, 0, this.kingsSeaGate.z), radius: 12 },
      { id: "wreckers-point", name: "Wrecker's Point", position: new THREE.Vector3(this.wreckersPoint.x, 0, this.wreckersPoint.z), radius: 12 },
      { id: "drowned-citadel", name: "The Drowned Citadel", position: new THREE.Vector3(this.drownedCitadel.x, 0, this.drownedCitadel.z), radius: 14 },
      { id: "veiled-wilds", name: "The Veiled Wilds", position: new THREE.Vector3(this.veiledWilds.x, 0, this.veiledWilds.z), radius: 24 },
      { id: "worldroot-grove", name: "Worldroot Grove", position: new THREE.Vector3(this.worldrootGrove.x, 0, this.worldrootGrove.z), radius: 13 },
      { id: "hidden-lake", name: "Hidden Lake", position: new THREE.Vector3(this.hiddenLake.x, 0, this.hiddenLake.z), radius: 12 },
      { id: "greenheart-ruins", name: "Greenheart Ruins", position: new THREE.Vector3(this.greenheartRuins.x, 0, this.greenheartRuins.z), radius: 12 },
      { id: "sleeping-arch", name: "The Sleeping Arch", position: new THREE.Vector3(this.sleepingArch.x, 0, this.sleepingArch.z), radius: 12 },
      { id: "mistveil-hollow", name: "Mistveil Hollow", position: new THREE.Vector3(this.mistveilHollow.x, 0, this.mistveilHollow.z), radius: 12 },
      { id: "forgotten-circle-wilds", name: "The Forgotten Circle", position: new THREE.Vector3(this.forgottenCircleWilds.x, 0, this.forgottenCircleWilds.z), radius: 12 },
    ];
  }

  registerRegions() {
    this.regions = [
      { id: "forest-meadow", name: "Forest Meadow", center: new THREE.Vector3(0, 0, -8), radius: 26 },
      { id: "watchtower-region", name: "Old Watchtower Region", center: new THREE.Vector3(this.watchtower.x, 0, this.watchtower.z), radius: 15 },
      { id: "hidden-pond-region", name: "Hidden Pond Region", center: new THREE.Vector3(this.hiddenPond.x, 0, this.hiddenPond.z), radius: 15 },
      { id: "ancient-ruins-region", name: "Ancient Ruins Region", center: new THREE.Vector3(this.ancientRuins.x, 0, this.ancientRuins.z), radius: 15 },
      { id: "hunters-cabin-region", name: "Hunter's Cabin Region", center: new THREE.Vector3(this.huntersCabin.x, 0, this.huntersCabin.z), radius: 14 },
      { id: "cliff-overlook-region", name: "Cliff Overlook Region", center: new THREE.Vector3(this.cliffOverlook.x, 0, this.cliffOverlook.z), radius: 15 },
      { id: "whisper-cave-region", name: "Whisper Cave Region", center: new THREE.Vector3(this.whisperCave.x, 0, this.whisperCave.z), radius: 14 },
      { id: "river-crossing", name: "River Crossing", center: new THREE.Vector3(this.riverCrossing.x, 0, this.riverCrossing.z), radius: 14 },
      { id: "mountain-path", name: "Mountain Path", center: new THREE.Vector3(this.mountainPath.x, 0, this.mountainPath.z), radius: 17 },
      { id: "forgotten-grove", name: "Forgotten Grove", center: new THREE.Vector3(this.forgottenGrove.x, 0, this.forgottenGrove.z), radius: 16 },
      { id: "archers-guild", name: "Archer's Guild", center: new THREE.Vector3(this.archersGuild.x, 0, this.archersGuild.z), radius: 18 },
      { id: "guild-village", name: "Guild Village", center: new THREE.Vector3(this.archersGuild.x, 0, this.archersGuild.z + 3), radius: 28 },
      { id: "hall-of-arrows", name: "Hall of Arrows", center: new THREE.Vector3(this.hallOfArrows.x, 0, this.hallOfArrows.z), radius: 18 },
      { id: "mountain-fortress", name: "Mountain Fortress", center: new THREE.Vector3(this.mountainFortress.x, 0, this.mountainFortress.z), radius: 24 },
      { id: "archers-lodge", name: "Archer's Lodge", center: new THREE.Vector3(this.archersLodge.x, 0, this.archersLodge.z), radius: 16 },
      { id: "frostpeak-mountains", name: "Frostpeak Mountains", center: new THREE.Vector3(this.frostpeak.x, 0, this.frostpeak.z), radius: 42 },
      { id: "frozen-watchtower", name: "Frozen Watchtower", center: new THREE.Vector3(this.frozenWatchtower.x, 0, this.frozenWatchtower.z), radius: 11 },
      { id: "icefall-cavern", name: "Icefall Cavern", center: new THREE.Vector3(this.icefallCavern.x, 0, this.icefallCavern.z), radius: 11 },
      { id: "frost-shrine", name: "Frost Shrine", center: new THREE.Vector3(this.frostTemple.x, 0, this.frostTemple.z), radius: 11 },
      { id: "summit-overlook", name: "Summit Overlook", center: new THREE.Vector3(this.summitOverlook.x, 0, this.summitOverlook.z), radius: 12 },
      { id: "coastal-cliffs", name: "Coastal Cliffs", center: new THREE.Vector3(this.coastalCliffs.x, 0, this.coastalCliffs.z), radius: 43 },
      { id: "broken-lighthouse", name: "Broken Lighthouse", center: new THREE.Vector3(this.brokenLighthouse.x, 0, this.brokenLighthouse.z), radius: 12 },
      { id: "sea-cave-shrine", name: "Sea Cave Shrine", center: new THREE.Vector3(this.seaCaveShrine.x, 0, this.seaCaveShrine.z), radius: 12 },
      { id: "shipwreck-cove", name: "Shipwreck Cove", center: new THREE.Vector3(this.shipwreckCove.x, 0, this.shipwreckCove.z), radius: 13 },
      { id: "windspire-bridge", name: "Windspire Bridge", center: new THREE.Vector3(this.windspireBridge.x, 0, this.windspireBridge.z), radius: 12 },
      { id: "mistwood", name: "Mistwood", center: new THREE.Vector3(this.mistwood.x, 0, this.mistwood.z), radius: 42 },
      { id: "elder-tree", name: "Elder Tree", center: new THREE.Vector3(this.elderTree.x, 0, this.elderTree.z), radius: 13 },
      { id: "moonlit-clearing", name: "Moonlit Clearing", center: new THREE.Vector3(this.moonlitClearing.x, 0, this.moonlitClearing.z), radius: 12 },
      { id: "forgotten-shrine", name: "Forgotten Shrine", center: new THREE.Vector3(this.forgottenShrine.x, 0, this.forgottenShrine.z), radius: 12 },
      { id: "rootfall-hollow", name: "Rootfall Hollow", center: new THREE.Vector3(this.rootfallHollow.x, 0, this.rootfallHollow.z), radius: 12 },
      { id: "echo-grove", name: "Echo Grove", center: new THREE.Vector3(this.echoGrove.x, 0, this.echoGrove.z), radius: 12 },
      { id: "blackwater-marsh", name: "Blackwater Marsh", center: new THREE.Vector3(this.blackwaterMarsh.x, 0, this.blackwaterMarsh.z), radius: 46 },
      { id: "sunken-shrine", name: "Sunken Shrine", center: new THREE.Vector3(this.sunkenShrine.x, 0, this.sunkenShrine.z), radius: 13 },
      { id: "mosswatch-tower", name: "Mosswatch Tower", center: new THREE.Vector3(this.mosswatchTower.x, 0, this.mosswatchTower.z), radius: 12 },
      { id: "crooked-boardwalk", name: "Crooked Boardwalk", center: new THREE.Vector3(this.crookedBoardwalk.x, 0, this.crookedBoardwalk.z), radius: 13 },
      { id: "drowned-ruins", name: "Drowned Ruins", center: new THREE.Vector3(this.drownedRuins.x, 0, this.drownedRuins.z), radius: 13 },
      { id: "witchlight-grove", name: "Witchlight Grove", center: new THREE.Vector3(this.witchlightGrove.x, 0, this.witchlightGrove.z), radius: 13 },
      { id: "red-canyon", name: "Red Canyon", center: new THREE.Vector3(this.redCanyon.x, 0, this.redCanyon.z), radius: 48 },
      { id: "skybridge-crossing", name: "Skybridge Crossing", center: new THREE.Vector3(this.skybridgeCrossing.x, 0, this.skybridgeCrossing.z), radius: 13 },
      { id: "crimson-arch", name: "Crimson Arch", center: new THREE.Vector3(this.crimsonArch.x, 0, this.crimsonArch.z), radius: 13 },
      { id: "forgotten-outpost", name: "Forgotten Outpost", center: new THREE.Vector3(this.forgottenOutpost.x, 0, this.forgottenOutpost.z), radius: 13 },
      { id: "sunspire-plateau", name: "Sunspire Plateau", center: new THREE.Vector3(this.sunspirePlateau.x, 0, this.sunspirePlateau.z), radius: 14 },
      { id: "echo-chasm", name: "Echo Chasm", center: new THREE.Vector3(this.echoChasm.x, 0, this.echoChasm.z), radius: 14 },
      { id: "ashen-highlands", name: "Ashen Highlands", center: new THREE.Vector3(this.ashenHighlands.x, 0, this.ashenHighlands.z), radius: 50 },
      { id: "ember-peak", name: "Ember Peak", center: new THREE.Vector3(this.emberPeak.x, 0, this.emberPeak.z), radius: 15 },
      { id: "obsidian-citadel", name: "Obsidian Citadel", center: new THREE.Vector3(this.obsidianCitadel.x, 0, this.obsidianCitadel.z), radius: 15 },
      { id: "ashfall-basin", name: "Ashfall Basin", center: new THREE.Vector3(this.ashfallBasin.x, 0, this.ashfallBasin.z), radius: 15 },
      { id: "firewatch-spire", name: "Firewatch Spire", center: new THREE.Vector3(this.firewatchSpire.x, 0, this.firewatchSpire.z), radius: 15 },
      { id: "molten-hollow", name: "Molten Hollow", center: new THREE.Vector3(this.moltenHollow.x, 0, this.moltenHollow.z), radius: 15 },
      { id: "starfall-vale", name: "Starfall Vale", center: new THREE.Vector3(this.starfallVale.x, 0, this.starfallVale.z), radius: 42 },
      { id: "starfall-observatory", name: "Starfall Observatory", center: new THREE.Vector3(this.starfallObservatory.x, 0, this.starfallObservatory.z), radius: 15 },
      { id: "moonspire-ridge", name: "Moonspire Ridge", center: new THREE.Vector3(this.moonspireRidge.x, 0, this.moonspireRidge.z), radius: 15 },
      { id: "celestial-basin", name: "Celestial Basin", center: new THREE.Vector3(this.celestialBasin.x, 0, this.celestialBasin.z), radius: 16 },
      { id: "shattered-sky-bridge", name: "Shattered Sky Bridge", center: new THREE.Vector3(this.shatteredSkyBridge.x, 0, this.shatteredSkyBridge.z), radius: 15 },
      { id: "crystalheart-grove", name: "Crystalheart Grove", center: new THREE.Vector3(this.crystalheartGrove.x, 0, this.crystalheartGrove.z), radius: 15 },
      { id: "astral-sanctum", name: "Astral Sanctum", center: new THREE.Vector3(this.astralSanctum.x, 0, this.astralSanctum.z), radius: 16 },
      { id: "frontier-plains", name: "Frontier Plains", center: new THREE.Vector3(this.frontierPlains.x, 0, this.frontierPlains.z), radius: 48 },
      { id: "frontier-outpost", name: "Frontier Outpost", center: new THREE.Vector3(this.frontierOutpost.x, 0, this.frontierOutpost.z), radius: 15 },
      { id: "frontier-watch", name: "Frontier Watch", center: new THREE.Vector3(this.frontierWatch.x, 0, this.frontierWatch.z), radius: 14 },
      { id: "whispering-fields", name: "Whispering Fields", center: new THREE.Vector3(this.whisperingFields.x, 0, this.whisperingFields.z), radius: 15 },
      { id: "stone-circle-echoes", name: "Stone Circle of Echoes", center: new THREE.Vector3(this.stoneCircleEchoes.x, 0, this.stoneCircleEchoes.z), radius: 15 },
      { id: "broken-kings-road", name: "Broken King's Road", center: new THREE.Vector3(this.brokenKingsRoad.x, 0, this.brokenKingsRoad.z), radius: 15 },
      { id: "greenwater-crossing", name: "Greenwater Crossing", center: new THREE.Vector3(this.greenwaterCrossing.x, 0, this.greenwaterCrossing.z), radius: 15 },
      { id: "forgotten-camp", name: "Forgotten Camp", center: new THREE.Vector3(this.forgottenCamp.x, 0, this.forgottenCamp.z), radius: 14 },
      { id: "lost-kingdom", name: "The Lost Kingdom", center: new THREE.Vector3(this.lostKingdom.x, 0, this.lostKingdom.z), radius: 40 },
      { id: "kings-gate", name: "King's Gate", center: new THREE.Vector3(this.kingsGate.x, 0, this.kingsGate.z), radius: 14 },
      { id: "sun-temple", name: "Sun Temple", center: new THREE.Vector3(this.sunTemple.x, 0, this.sunTemple.z), radius: 15 },
      { id: "forgotten-plaza", name: "Forgotten Plaza", center: new THREE.Vector3(this.forgottenPlaza.x, 0, this.forgottenPlaza.z), radius: 15 },
      { id: "watchers-tower", name: "Watcher's Tower", center: new THREE.Vector3(this.watchersTower.x, 0, this.watchersTower.z), radius: 14 },
      { id: "hall-of-echoes", name: "Hall of Echoes", center: new THREE.Vector3(this.hallOfEchoes.x, 0, this.hallOfEchoes.z), radius: 15 },
      { id: "sealed-archive", name: "The Sealed Archive", center: new THREE.Vector3(this.sealedArchive.x, 0, this.sealedArchive.z), radius: 16 },
      { id: "celestial-expanse", name: "The Celestial Expanse", center: new THREE.Vector3(this.celestialExpanse.x, 0, this.celestialExpanse.z), radius: 40 },
      { id: "observatory-prime", name: "Observatory Prime", center: new THREE.Vector3(this.observatoryPrime.x, 0, this.observatoryPrime.z), radius: 15 },
      { id: "skyfall-basin", name: "Skyfall Basin", center: new THREE.Vector3(this.skyfallBasin.x, 0, this.skyfallBasin.z), radius: 15 },
      { id: "crystal-sea", name: "Crystal Sea", center: new THREE.Vector3(this.crystalSea.x, 0, this.crystalSea.z), radius: 15 },
      { id: "floating-reach", name: "The Floating Reach", center: new THREE.Vector3(this.floatingReach.x, 0, this.floatingReach.z), radius: 15 },
      { id: "starforge-ruins", name: "Starforge Ruins", center: new THREE.Vector3(this.starforgeRuins.x, 0, this.starforgeRuins.z), radius: 15 },
      { id: "temple-first-sky", name: "Temple of the First Sky", center: new THREE.Vector3(this.templeFirstSky.x, 0, this.templeFirstSky.z), radius: 16 },
      { id: "shattered-coast", name: "Shattered Coast", center: new THREE.Vector3(this.shatteredCoast.x, 0, this.shatteredCoast.z), radius: 44 },
      { id: "stormwatch-fortress", name: "Stormwatch Fortress", center: new THREE.Vector3(this.stormwatchFortress.x, 0, this.stormwatchFortress.z), radius: 16 },
      { id: "broken-beacon", name: "The Broken Beacon", center: new THREE.Vector3(this.brokenBeacon.x, 0, this.brokenBeacon.z), radius: 15 },
      { id: "tidefall-caverns", name: "Tidefall Caverns", center: new THREE.Vector3(this.tidefallCaverns.x, 0, this.tidefallCaverns.z), radius: 15 },
      { id: "kings-sea-gate", name: "King's Sea Gate", center: new THREE.Vector3(this.kingsSeaGate.x, 0, this.kingsSeaGate.z), radius: 15 },
      { id: "wreckers-point", name: "Wrecker's Point", center: new THREE.Vector3(this.wreckersPoint.x, 0, this.wreckersPoint.z), radius: 15 },
      { id: "drowned-citadel", name: "The Drowned Citadel", center: new THREE.Vector3(this.drownedCitadel.x, 0, this.drownedCitadel.z), radius: 17 },
      { id: "veiled-wilds", name: "The Veiled Wilds", center: new THREE.Vector3(this.veiledWilds.x, 0, this.veiledWilds.z), radius: 42 },
      { id: "worldroot-grove", name: "Worldroot Grove", center: new THREE.Vector3(this.worldrootGrove.x, 0, this.worldrootGrove.z), radius: 16 },
      { id: "hidden-lake", name: "Hidden Lake", center: new THREE.Vector3(this.hiddenLake.x, 0, this.hiddenLake.z), radius: 15 },
      { id: "greenheart-ruins", name: "Greenheart Ruins", center: new THREE.Vector3(this.greenheartRuins.x, 0, this.greenheartRuins.z), radius: 15 },
      { id: "sleeping-arch", name: "The Sleeping Arch", center: new THREE.Vector3(this.sleepingArch.x, 0, this.sleepingArch.z), radius: 15 },
      { id: "mistveil-hollow", name: "Mistveil Hollow", center: new THREE.Vector3(this.mistveilHollow.x, 0, this.mistveilHollow.z), radius: 15 },
      { id: "forgotten-circle-wilds", name: "The Forgotten Circle", center: new THREE.Vector3(this.forgottenCircleWilds.x, 0, this.forgottenCircleWilds.z), radius: 15 },
    ];
  }

  registerSafeZones() {
    const safeZoneSpecs = [
      { id: "starting-camp", name: "Starting Camp", x: -15, z: -6, radius: 17 },
      { id: "training-grounds", name: "Training Grounds", x: -2, z: -18, radius: 22 },
      { id: "archers-guild", name: "Archer's Guild", x: this.archersGuild?.x ?? -42, z: this.archersGuild?.z ?? -39, radius: 30 },
      { id: "guild-village", name: "Guild Village", x: this.archersGuild?.x ?? -42, z: (this.archersGuild?.z ?? -39) + 3, radius: 34 },
      { id: "hall-of-arrows", name: "Hall of Arrows", x: this.hallOfArrows?.x ?? -76, z: this.hallOfArrows?.z ?? 47, radius: 12 },
      { id: "mountain-fortress", name: "Mountain Fortress", x: this.mountainFortress?.x ?? -92, z: this.mountainFortress?.z ?? 74, radius: 16 },
      { id: "archers-lodge", name: "Archer's Lodge", x: this.archersLodge?.x ?? -73, z: this.archersLodge?.z ?? 62, radius: 14 },
      { id: "hunters-cabin", name: "Hunter's Cabin", x: this.huntersCabin?.x ?? -38, z: this.huntersCabin?.z ?? 9, radius: 18 },
      { id: "frontier-outpost", name: "Frontier Outpost", x: this.frontierOutpost?.x ?? 136, z: this.frontierOutpost?.z ?? -142, radius: 20 },
      { id: "coastal-harbor", name: "Coastal Harbor", x: -144, z: -148, radius: 19 },
    ];

    this.safeZones = safeZoneSpecs
      .filter((zone) => Number.isFinite(zone.x) && Number.isFinite(zone.z))
      .map((zone) => ({
        ...zone,
        position: new THREE.Vector3(zone.x, 0, zone.z),
      }));
  }

  getSafeZoneAt(position) {
    if (!position || !this.safeZones?.length) {
      return null;
    }
    return this.safeZones.find((zone) => {
      const dx = position.x - zone.position.x;
      const dz = position.z - zone.position.z;
      return dx * dx + dz * dz <= zone.radius * zone.radius;
    }) ?? null;
  }

  isSafeZone(position) {
    return Boolean(this.getSafeZoneAt(position));
  }

  getRegionAt(position) {
    if (!this.regions?.length) {
      return null;
    }
    return this.regions.find((region) => (
      Math.hypot(position.x - region.center.x, position.z - region.center.z) <= region.radius
    )) ?? null;
  }

  addWorldCohesionPass() {
    this.addTrailMarkers();
    this.addTransitionGroves();
    this.addScenicOverlooks();
    this.addWorldDiscoveryPickups();
    this.addWorldHiddenTargets();
  }

  addTrailMarkers() {
    const signs = [
      [-7.5, 2.5, -0.48, [["Pond", 0.38], ["Ruins", -0.38]]],
      [-17.2, 4.2, 0.78, [["Tower", 0.28]]],
      [10.8, -12.2, -0.58, [["Ruins", 0.24], ["Camp", -0.34]]],
      [15.4, 12.4, 0.42, [["Pond", 0.28]]],
      [-22.4, -10.8, -0.86, [["Cabin", 0.22]]],
      [-6.2, 18.2, 0.1, [["Cliff", 0.16]]],
    ];

    signs.forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.2, 7), this.materials.barkDark);
      post.position.set(x, y + 0.6, z);
      post.rotation.z = 0.06;
      post.castShadow = true;
      this.scene.add(post);
      this.colliders.push(post);

      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.92 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.34, y + 1.02 - index * 0.22, z + Math.cos(yaw + offset) * 0.34);
        board.rotation.y = yaw + offset;
        board.rotation.z = 0.05 * (index % 2 === 0 ? 1 : -1);
        board.castShadow = true;
        this.scene.add(board);
      });
    });

    const archeryMarkers = [[-2.8, -9.5, 0.2], [7.4, -14.5, -0.2], [19.4, -20.5, 0.46]];
    archeryMarkers.forEach(([x, z, yaw], index) => this.addAbandonedArcheryMarker(x, z, yaw, index));
  }

  addAbandonedArcheryMarker(x, z, yaw, index) {
    const y = this.terrain.getHeightAt(x, z);
    const marker = new THREE.Group();
    marker.position.set(x, y, z);
    marker.rotation.y = yaw;

    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.9, 6), this.materials.barkDark);
    stake.position.y = 0.45;
    stake.rotation.z = 0.18;
    const ribbon = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 3), index % 2 === 0 ? this.materials.banner : this.materials.targetGold);
    ribbon.position.set(0.18, 0.78, 0.04);
    ribbon.rotation.set(0, Math.PI / 2, -Math.PI / 2);
    marker.add(stake, ribbon);
    this.scene.add(marker);
  }

  addTransitionGroves() {
    const groves = [
      [[-11, 6], [-14, 9], [-8, 10]],
      [[8, 7], [11, 10], [13, 5]],
      [[16, -17], [19, -14], [21, -20]],
      [[-4, -2], [-1, 4], [3, 2]],
      [[-25, -13], [-28, -15], [-31, -12]],
      [[-3, 24], [-7, 27], [-11, 25]],
    ];

    groves.forEach((cluster, clusterIndex) => {
      cluster.forEach(([x, z], index) => {
        this.addPine(x, z, 3.2 + ((index + clusterIndex) % 3) * 0.45, (index + clusterIndex) % 2 === 0 ? this.materials.pine : this.materials.pineDark);
      });
    });

    const rockLines = [
      [-5, 6, 0.52], [0, 8, 0.38], [5, 9, 0.44], [13, 0, 0.46], [18, -7, 0.52],
      [22, -15, 0.42], [-15, 1, 0.4], [-20, 5, 0.48],
    ];
    rockLines.forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      rock.position.set(x, this.terrain.getHeightAt(x, z) + scale * 0.22, z);
      rock.scale.set(scale * 1.2, scale * 0.42, scale * 0.82);
      rock.rotation.set(index * 0.4, index * 0.6, index * 0.12);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    });

    this.addTinyTrailCamp(3.6, 6.4, -0.38);
    this.addSupplyCache(14.2, -9.3, 0.44);
    this.addBrokenFenceRemnants(-10.8, 1.1, 0.78);
  }

  addTinyTrailCamp(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 18), this.materials.darkStone);
    ring.position.set(x, y + 0.05, z);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1, 0.72, 1);
    const bedroll = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.42), this.materials.canvas);
    bedroll.position.set(x + Math.sin(yaw) * 0.85, y + 0.08, z + Math.cos(yaw) * 0.85);
    bedroll.rotation.y = yaw;
    bedroll.castShadow = true;
    this.scene.add(ring, bedroll);
  }

  addSupplyCache(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 0.62), this.materials.wood);
    crate.position.set(x, y + 0.26, z);
    crate.rotation.y = yaw;
    crate.castShadow = true;
    crate.receiveShadow = true;
    const arrows = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.05, 6), this.materials.rope);
    arrows.position.set(x + 0.42, y + 0.72, z - 0.18);
    arrows.rotation.set(Math.PI / 2.8, 0, yaw + 0.4);
    arrows.castShadow = true;
    this.scene.add(crate, arrows);
    this.colliders.push(crate);
  }

  addBrokenFenceRemnants(x, z, yaw) {
    for (let index = 0; index < 3; index += 1) {
      const pieceX = x + Math.sin(yaw + Math.PI / 2) * index * 0.9;
      const pieceZ = z + Math.cos(yaw + Math.PI / 2) * index * 0.9;
      const y = this.terrain.getHeightAt(pieceX, pieceZ);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2 - index * 0.18, 0.12, 0.14), this.materials.wood);
      rail.position.set(pieceX, y + 0.35 + index * 0.08, pieceZ);
      rail.rotation.set(0.1, yaw + index * 0.18, -0.28 + index * 0.12);
      rail.castShadow = true;
      this.scene.add(rail);
    }
  }

  addScenicOverlooks() {
    const vistas = [
      [-5.2, 11.5, 1.2, "watchtower-vista"],
      [17.8, 8.4, 0.9, "pond-vista"],
      [20.3, -17.8, 1.05, "ruins-vista"],
    ];
    vistas.forEach(([x, z, scale]) => {
      const y = this.terrain.getHeightAt(x, z);
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.92, 0.28, 9), this.materials.ancientStone);
      stone.position.set(x, y + 0.14, z);
      stone.scale.set(scale, 1, scale * 0.72);
      stone.rotation.y = x * 0.2;
      stone.receiveShadow = true;
      stone.castShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);
    });
  }

  addWorldDiscoveryPickups() {
    const pickups = [
      [-6.1, 12.3, "Trail Charm", 14],
      [12.6, 7.6, "Weathered Fletching", 16],
      [20.1, -16.6, "Old Road Coin", 16],
      [-27.8, -13.4, "Hunter's Token", 18],
    ];
    pickups.forEach(([x, z, name, xp], index) => {
      const y = this.terrain.getHeightAt(x, z);
      const group = new THREE.Group();
      group.position.set(x, y + 0.32, z);
      group.rotation.y = index * 0.7;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.1, 7), this.materials.darkStone);
      const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.materials.targetGold);
      glint.position.y = 0.18;
      group.add(base, glint);
      this.scene.add(group);
      this.interactables.push({
        id: `world-cohesion-pickup-${index}`,
        type: "xp-pickup",
        name,
        prompt: "E Collect",
        position: new THREE.Vector3(x, y + 0.35, z),
        radius: 2.1,
        xp,
        group,
        text: `${name} found. +${xp} XP`,
      });
    });
  }

  addWorldHiddenTargets() {
    const targets = [
      [-4.7, 7.6, -0.28, 0.48, 0.12],
      [13.4, 10.8, 0.85, 0.45, 0.16],
      [18.8, -13.2, -0.72, 0.5, 0.14],
    ];
    targets.forEach(([x, z, yaw, scale, yOffset]) => {
      this.addTarget(x, z, yaw, scale, {
        challengeId: "trailMarkers",
        challengeLabel: "Trail Markers",
        yOffset,
      });
    });
  }

  addAdventureMapExpansion() {
    this.riverCrossing = { x: 52, z: 2, yaw: -0.12, scale: 1 };
    this.mountainPath = { x: -5, z: 68, yaw: 0.08, scale: 1 };
    this.forgottenGrove = { x: 52, z: 54, yaw: -0.42, scale: 1 };

    this.addOuterRegionalForest();
    this.addRiverCrossingRegion(this.riverCrossing);
    this.addMountainPathRegion(this.mountainPath);
    this.addForgottenGroveRegion(this.forgottenGrove);
    this.addSecretTemples();
    this.addArchersGuild();
    this.addHallOfArrows();
    this.addMountainFortressMasterpiece();
    this.addArchersLodge();
    this.addProgressionDiscoveries();
    this.addStablePlaceholder();
    this.addFrostpeakMountains();
    this.addCoastalCliffs();
    this.addMistwood();
    this.addBlackwaterMarsh();
    this.addRedCanyon();
    this.addAshenHighlands();
    this.addStarfallVale();
    this.addFrontierPlains();
    this.addLostKingdom();
    this.addCelestialExpanse();
    this.addShatteredCoast();
    this.addVeiledWilds();
    this.addExpandedNavigationSigns();
    this.addDefensiveArchitectureMasterpiecePass();
    this.addLegendaryBossStructures();
    this.addWorldCompositionClearings();
    this.addLakesAndBoathousesPass();
    this.addGearPickups();
  }

  addFrontierPlains() {
    this.frontierPlains = { x: 136, z: -145, yaw: 0.22, scale: 1 };
    this.frontierOutpost = { x: 126, z: -132, yaw: -0.34 };
    this.frontierWatch = { x: 114, z: -122, yaw: 0.28 };
    this.whisperingFields = { x: 139, z: -164, yaw: 0.08 };
    this.stoneCircleEchoes = { x: 154, z: -148, yaw: -0.12 };
    this.brokenKingsRoad = { x: 128, z: -154, yaw: 0.86 };
    this.greenwaterCrossing = { x: 161, z: -132, yaw: -0.62 };
    this.forgottenCamp = { x: 145, z: -119, yaw: 0.42 };

    this.addFrontierRoadsAndWater();
    this.addFrontierGrasslands();
    this.addFrontierOutpost(this.frontierOutpost);
    this.addFrontierWatch(this.frontierWatch);
    this.addWhisperingFields(this.whisperingFields);
    this.addStoneCircleOfEchoes(this.stoneCircleEchoes);
    this.addBrokenKingsRoad(this.brokenKingsRoad);
    this.addGreenwaterCrossing(this.greenwaterCrossing);
    this.addForgottenCamp(this.forgottenCamp);
    this.addFrontierTracksAndRewards();
  }

  addFrontierRoadsAndWater() {
    [
      [116, -121, 7.0, 1.0, 0.72],
      [124, -130, 8.2, 1.1, 0.64],
      [133, -141, 9.2, 1.15, 0.54],
      [142, -150, 8.0, 1.1, 0.42],
      [151, -157, 7.0, 0.95, 0.32],
    ].forEach(([x, z, width, depth, yaw]) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, depth), this.materials.frontierRoad);
      road.position.set(x, this.terrain.getHeightAt(x, z) + 0.055, z);
      road.rotation.y = yaw;
      road.receiveShadow = true;
      this.scene.add(road);
    });

    [[143, -145, 26, 4.8, -0.18], [160, -132, 13, 3.2, 0.42]].forEach(([x, z, width, depth, yaw]) => {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.frontierWater);
      water.position.set(x, this.terrain.getHeightAt(x, z) + 0.08, z);
      water.rotation.set(-Math.PI / 2, 0, yaw);
      this.scene.add(water);
    });
  }

  addFrontierGrasslands() {
    [
      [119, -141, 4.4], [129, -148, 4.8], [137, -134, 4.5], [148, -137, 4.9], [160, -155, 4.4],
      [121, -163, 4.2], [139, -169, 4.6], [155, -168, 4.3], [169, -142, 4.1],
    ].forEach(([x, z, height], index) => this.addFrontierTree(x, z, height, index));

    for (let index = 0; index < 22; index += 1) {
      const x = 112 + (index % 7) * 9 + Math.sin(index) * 2.3;
      const z = -166 + Math.floor(index / 7) * 15 + Math.cos(index * 0.7) * 2.4;
      this.addFrontierFlowerPatch(x, z, 4 + (index % 4));
    }
  }

  addFrontierTree(x, z, height, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, height, 9), this.materials.bark);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = Math.sin(index) * 0.08;
    group.add(trunk);
    for (let tier = 0; tier < 3; tier += 1) {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92 - tier * 0.08, 1), (tier + index) % 2 ? this.materials.frontierGrassDark : this.materials.frontierGrass);
      crown.position.set(Math.sin(index + tier) * 0.22, height * (0.78 + tier * 0.12), Math.cos(index * 0.6 + tier) * 0.18);
      crown.scale.set(1.42 - tier * 0.12, 0.54, 1.08 - tier * 0.08);
      crown.rotation.y = index * 0.27 + tier * 0.4;
      group.add(crown);
    }
    for (let rootIndex = 0; rootIndex < 3; rootIndex += 1) {
      const angle = index * 0.7 + rootIndex * 2.1;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.72, 4, 6), this.materials.barkDark);
      root.position.set(Math.sin(angle) * 0.36, 0.12, Math.cos(angle) * 0.36);
      root.rotation.set(Math.PI / 2, 0, -angle);
      group.add(root);
    }
    this.scene.add(group);
    this.addCollisionCylinder(x, z, 0.42, height);
  }

  addFrontierFlowerPatch(x, z, count = 5) {
    const y = this.terrain.getHeightAt(x, z);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.44 + count * 0.04, 10), this.materials.frontierGrass);
    patch.position.set(x, y + 0.035, z);
    patch.rotation.x = -Math.PI / 2;
    this.scene.add(patch);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399;
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), index % 2 ? this.materials.frontierFlower : this.materials.blossom);
      bloom.position.set(x + Math.sin(angle) * (0.2 + index * 0.04), y + 0.12, z + Math.cos(angle) * (0.2 + index * 0.04));
      this.scene.add(bloom);
    }
  }

  addFrontierOutpost(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const service = (localX, localZ) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      return new THREE.Vector3(point.x, 0, point.z);
    };
    this.frontierTownServices = {
      square: service(0, 0.2),
      inn: service(-5.8, 3.8),
      blacksmith: service(-6.8, -2.8),
      bowyer: service(5.6, -2.4),
      stable: service(7.2, 3.9),
      market: service(1.0, 4.0),
      watchtower: service(0.5, -5.8),
      storage: service(-1.6, -4.1),
      mapStation: service(0.2, -1.9),
      homes: [service(-10.3, 1.6), service(-9.2, 6.8), service(9.7, 0.8), service(10.2, 6.4)],
    };
    this.settlementHooks = this.settlementHooks ?? [];
    this.settlementHooks.push({
      id: "frontier-town",
      name: "Frontier Town",
      services: this.frontierTownServices,
      futureUses: ["frontier shops", "Arc 2 scouts", "settlement upgrades", "job board"],
    });

    this.addSettlementRoad(origin, 0, 0.8, 20, 2.2, 0, this.materials.frontierRoad);
    this.addSettlementRoad(origin, -2.2, 3.3, 2.0, 11.5, 0.08, this.materials.frontierRoad);
    this.addSettlementRoad(origin, 4.2, 2.6, 1.7, 10.0, -0.08, this.materials.frontierRoad);
    this.addSettlementRoad(origin, 0.5, -4.6, 12.5, 1.55, 0.03, this.materials.frontierRoad);

    this.addSettlementBuilding(origin, "frontier-inn", "Frontier Inn", -5.8, 3.8, 4.6, 3.2, 2.05, -0.1, {
      material: this.materials.agedWood,
      roof: this.materials.barkDark,
      sign: 0xffc579,
      porch: true,
      chimney: true,
    });
    this.addSettlementBuilding(origin, "frontier-smithy", "Frontier Smith", -6.8, -2.8, 4.2, 3.0, 1.95, 0.12, {
      material: this.materials.darkStone,
      roof: this.materials.barkDark,
      sign: 0xff8a3d,
      chimney: true,
      toolRack: true,
    });
    this.addSettlementBuilding(origin, "frontier-bowyer", "Frontier Bowyer", 5.6, -2.4, 4.0, 2.8, 1.9, -0.08, {
      material: this.materials.wood,
      roof: this.materials.pineDark,
      sign: 0xe6b75d,
      bowRack: true,
    });
    this.addSettlementBuilding(origin, "frontier-storage", "Storehouse", -1.6, -4.1, 3.4, 2.5, 1.75, 0.18, {
      material: this.materials.canvas,
      roof: this.materials.weatheredDock,
      sign: 0xd7bd83,
    });
    this.addSettlementBuilding(origin, "frontier-stable", "Stable", 7.2, 3.9, 4.4, 2.7, 1.65, 0.06, {
      material: this.materials.agedWood,
      roof: this.materials.barkDark,
      sign: 0xbfd27a,
      openFront: true,
    });
    [
      [-10.3, 1.6, 3.25, 2.35, 1.6, 0.1],
      [-9.2, 6.8, 3.1, 2.4, 1.58, -0.16],
      [9.7, 0.8, 3.2, 2.35, 1.62, 0.16],
      [10.2, 6.4, 3.0, 2.25, 1.55, -0.08],
    ].forEach(([localX, localZ, width, depth, height, yawOffset], index) => {
      this.addSettlementBuilding(origin, `frontier-home-${index + 1}`, "Home", localX, localZ, width, depth, height, yawOffset, {
        material: index % 2 ? this.materials.wood : this.materials.agedWood,
        roof: index % 2 ? this.materials.barkDark : this.materials.weatheredDock,
        sign: 0xe8bc66,
      });
    });

    this.addFrontierTownWatchtower(origin, 0.5, -5.8);
    this.addSettlementMarket(origin, 1.0, 4.0, "frontier");
    this.addSettlementAtmosphere(origin, [
      [-8.0, 0.1, "firewood"],
      [-6.0, 6.2, "laundry"],
      [4.0, 4.8, "barrels"],
      [8.6, 5.8, "animalPen"],
      [-0.2, 2.2, "garden"],
      [3.8, -4.5, "sign"],
    ]);

    [[-1.8, 0.5, 1.4], [2.2, 0.2, 1.1]].forEach(([dx, dz, scale], index) => {
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.1 * scale, 1.25 * scale, 4), index % 2 ? this.materials.canvas : this.materials.parchment);
      tent.position.set(origin.x + dx, y + 0.62 * scale, origin.z + dz);
      tent.rotation.y = origin.yaw + Math.PI / 4;
      tent.castShadow = true;
      this.scene.add(tent);
      this.addCollisionCylinder(origin.x + dx, origin.z + dz, 0.82 * scale, 1.3 * scale);
    });
    this.addFrontierCrate(origin.x + 0.6, origin.z - 2.1, origin.yaw);
    this.addFrontierCrate(origin.x - 3.0, origin.z - 1.3, origin.yaw + 0.3);
    this.interactables.push({
      id: "frontier-outpost-map",
      type: "frontier-expedition-console",
      name: "Frontier Outpost Map",
      prompt: "E Study map",
      position: new THREE.Vector3(origin.x + 0.2, y + 0.7, origin.z - 1.9),
      radius: 3.2,
      text: "The First Expedition begins: follow tracks, mark landmarks, and learn why the old road was abandoned.",
    });
  }

  addFrontierCrate(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.58, 0.72), this.materials.cutWood);
    crate.position.set(x, y + 0.29, z);
    crate.rotation.y = yaw;
    crate.castShadow = true;
    this.scene.add(crate);
    this.addCollisionBox(x, z, 0.88, 0.78, 0.62, yaw);
  }

  getSettlementPoint(origin, localX, localZ) {
    const scale = origin.scale ?? 1;
    const yaw = origin.yaw ?? 0;
    return {
      x: origin.x + (Math.sin(yaw + Math.PI / 2) * localX + Math.sin(yaw) * localZ) * scale,
      z: origin.z + (Math.cos(yaw + Math.PI / 2) * localX + Math.cos(yaw) * localZ) * scale,
    };
  }

  addSettlementRoad(origin, localX, localZ, width, depth, yawOffset = 0, material = this.materials.cutWood) {
    const point = this.getSettlementPoint(origin, localX, localZ);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 3, 4), material);
    road.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.04, point.z);
    road.rotation.set(-Math.PI / 2, 0, (origin.yaw ?? 0) + yawOffset);
    road.receiveShadow = true;
    this.scene.add(road);
    if (!this.performanceMode && width > 3.4) {
      this.addPathEdgeCluster(point.x, point.z, (origin.yaw ?? 0) + yawOffset, Math.min(8, Math.round(width / 2)), "frontier", Math.round(localX + localZ));
    }
  }

  addSettlementBuilding(origin, id, label, localX, localZ, width, depth, height, yawOffset = 0, options = {}) {
    const point = this.getSettlementPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = (origin.yaw ?? 0) + yawOffset;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, 0.2, depth + 0.36), this.materials.darkStone);
    foundation.position.y = 0.1;
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), options.material ?? this.materials.agedWood);
    body.position.y = 0.2 + height * 0.5;
    body.scale.x = 0.98 + Math.sin(localX * 0.73) * 0.025;
    body.scale.z = 0.98 + Math.cos(localZ * 0.61) * 0.02;
    const roof = this.createLayeredGableRoof(width, depth, height + 0.68, options.roof ?? this.materials.barkDark, {
      pitch: 0.38 + Math.abs(yawOffset) * 0.18,
      overhang: 0.46,
      asymmetry: Math.sin(localX - localZ) * 0.09,
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.15, 0.1), this.materials.warmTrim);
    door.position.set(0, 0.78, -depth * 0.515);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.24, 0.08), new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.66, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.07 }));
    sign.position.set(0, height + 0.12, -depth * 0.56);
    group.add(foundation, body, roof, door, sign);
    this.addBuildingCraftDetails(group, width, depth, height, {
      trim: new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.7, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.04 }),
    });
    const interiorRole = /inn/i.test(label) ? "inn"
      : /smith/i.test(label) ? "smith"
        : /bow/i.test(label) ? "bowyer"
          : /store/i.test(label) ? "storage"
            : /stable/i.test(label) ? "storage"
              : "home";
    this.addInteriorDetailSet(group, width, depth, height, interiorRole, {
      trim: new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.62, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.08 }),
      wood: options.material ?? this.materials.cutWood,
      cloth: interiorRole === "inn" ? this.materials.parchment : this.materials.canvas,
    });

    if (options.porch) {
      const porch = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.16, 0.78), this.materials.cutWood);
      porch.position.set(0, 0.18, -depth * 0.5 - 0.42);
      group.add(porch);
      [-0.38, 0.38].forEach((side) => {
        const porchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.18, 7), this.materials.barkDark);
        porchPost.position.set(side * width * 0.55, 0.76, -depth * 0.5 - 0.72);
        group.add(porchPost);
      });
    }
    if (options.chimney) {
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.12, 7), this.materials.darkStone);
      chimney.position.set(width * 0.28, height + 1.04, depth * 0.16);
      chimney.rotation.z = -0.06;
      group.add(chimney);
      const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.46), this.materials.ancientStone);
      chimneyCap.position.set(width * 0.28, height + 1.64, depth * 0.16);
      chimneyCap.rotation.y = 0.15;
      group.add(chimneyCap);
    }
    if (options.toolRack) {
      this.addToolRackToGroup(group, width * 0.5 + 0.08, 0.72, 0.35);
    }
    if (options.bowRack) {
      [-0.48, 0, 0.48].forEach((offset) => {
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 7, 24, Math.PI * 1.35), this.materials.cutWood);
        bow.position.set(width * 0.5 + 0.08, 0.94, offset);
        bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
        group.add(bow);
      });
    }
    if (options.openFront) {
      door.visible = false;
      const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.9, 9), this.materials.grassLight);
      hay.position.set(-width * 0.28, 0.3, depth * 0.08);
      hay.rotation.z = Math.PI / 2;
      group.add(hay);
    }

    if (!options.openFront && width > 3.2) {
      const rearLeanTo = new THREE.Mesh(new THREE.BoxGeometry(width * 0.46, 0.13, depth * 0.56), options.roof ?? this.materials.barkDark);
      rearLeanTo.position.set(-width * 0.28, height * 0.84, depth * 0.62);
      rearLeanTo.rotation.z = -0.18;
      rearLeanTo.rotation.y = 0.02;
      group.add(rearLeanTo);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, width + 0.22, depth + 0.22, height + 0.82, yaw);
    this.settlementBuildings = this.settlementBuildings ?? [];
    this.settlementBuildings.push({ id, label, position: new THREE.Vector3(point.x, y, point.z), yaw, width, depth });
  }

  addToolRackToGroup(group, x, y, z) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.08), this.materials.barkDark);
    rail.position.set(x, y, z);
    group.add(rail);
    [-0.26, 0.22].forEach((offset) => {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.74, 6), this.materials.cutWood);
      handle.position.set(x + 0.08, y + 0.08, z + offset);
      handle.rotation.z = 0.22;
      group.add(handle);
    });
  }

  addFrontierTownWatchtower(origin, localX, localZ) {
    const point = this.getSettlementPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = (origin.yaw ?? 0) - 0.08;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.2, 7), this.materials.agedWood);
      post.position.set(side * 0.78, 1.6, -0.42);
      const back = post.clone();
      back.position.z = 0.72;
      group.add(post, back);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.22, 1.75), this.materials.cutWood);
    deck.position.y = 2.28;
    const roof = this.createLayeredGableRoof(2.4, 1.8, 3.0, this.materials.barkDark, { pitch: 0.36, overhang: 0.26, asymmetry: 0.05 });
    group.add(deck, roof);
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, 1.9, 1.45, 3.2, yaw);
  }

  addSettlementMarket(origin, localX, localZ, style = "frontier") {
    const colors = style === "coastal" ? [0x315d69, 0xd9b978, 0x5fd8ff] : [0x8b6844, 0x2f5545, 0xb8553f];
    [[-1.5, 0.1], [1.3, -0.3], [0.15, 1.65]].forEach(([offsetX, offsetZ], index) => {
      const point = this.getSettlementPoint(origin, localX + offsetX, localZ + offsetZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const yaw = (origin.yaw ?? 0) + (index - 1) * 0.18;
      const group = new THREE.Group();
      group.position.set(point.x, y, point.z);
      group.rotation.y = yaw;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.5, 0.7), this.materials.cutWood);
      counter.position.y = 0.25;
      const clothMaterial = new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.82 });
      const awningLeft = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 1.08), clothMaterial);
      awningLeft.position.set(-0.38, 1.12, 0);
      awningLeft.rotation.z = -0.16;
      const awningRight = awningLeft.clone();
      awningRight.position.x = 0.38;
      awningRight.rotation.z = 0.16;
      [-0.52, 0, 0.52].forEach((frillZ) => {
        const frill = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 7), clothMaterial);
        frill.position.set(0, 1.04, frillZ);
        frill.rotation.z = Math.PI / 2;
        group.add(frill);
      });
      const goods = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.26, 8), index % 2 ? this.materials.rope : this.materials.frontierFlower);
      goods.position.set(0.46, 0.42, 0.3);
      group.add(counter, awningLeft, awningRight, goods);
      this.scene.add(group);
    });
  }

  addSettlementAtmosphere(origin, details) {
    details.forEach(([localX, localZ, type], index) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const yaw = (origin.yaw ?? 0) + Math.sin(index) * 0.2;
      if (type === "firewood") {
        [-0.2, 0.05, 0.3].forEach((offset) => {
          const log = new THREE.Mesh(this.geometries.log, this.materials.bark);
          log.position.set(point.x + offset, y + 0.18, point.z + offset * 0.4);
          log.rotation.set(Math.PI / 2, yaw + offset, 0);
          this.scene.add(log);
        });
      } else if (type === "laundry") {
        const postA = new THREE.Mesh(this.geometries.fencePost, this.materials.barkDark);
        const postB = postA.clone();
        postA.position.set(point.x - 0.85, y + 0.68, point.z);
        postB.position.set(point.x + 0.85, y + 0.68, point.z + 0.12);
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.035), this.materials.parchment);
        cloth.position.set(point.x, y + 1.12, point.z + 0.06);
        this.scene.add(postA, postB, cloth);
      } else if (type === "animalPen") {
        [-1, 1].forEach((side) => {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.12), this.materials.barkDark);
          rail.position.set(point.x, y + 0.58, point.z + side * 0.82);
          rail.rotation.y = yaw;
          this.scene.add(rail);
        });
      } else if (type === "garden") {
        for (let i = 0; i < 5; i += 1) {
          this.addFrontierFlowerPatch(point.x + Math.sin(i) * 0.7, point.z + Math.cos(i * 1.2) * 0.55, 3);
        }
      } else if (type === "sign") {
        this.addSettlementSign(point.x, point.z, yaw);
      } else {
        this.addFrontierCrate(point.x, point.z, yaw);
      }
    });
  }

  addSettlementSign(x, z, yaw) {
    const y = this.terrain.getHeightAt(x, z);
    const post = new THREE.Mesh(this.geometries.fencePost, this.materials.barkDark);
    post.position.set(x, y + 0.68, z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.38, 0.08), this.materials.cutWood);
    board.position.set(x, y + 1.25, z);
    board.rotation.y = yaw;
    this.scene.add(post, board);
  }

  addFrontierWatch(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const tower = new THREE.Group();
    tower.position.set(origin.x, y, origin.z);
    tower.rotation.y = origin.yaw;
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.6, 7), this.materials.agedWood);
      post.position.set(side * 0.8, 1.8, side * 0.2);
      tower.add(post);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 1.9), this.materials.cutWood);
    deck.position.y = 2.45;
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 3), this.materials.banner);
    flag.position.set(1.05, 3.25, -0.55);
    flag.rotation.z = -Math.PI / 2;
    tower.add(deck, flag);
    this.scene.add(tower);
    this.addCollisionBox(origin.x, origin.z, 1.9, 1.6, 3.7, origin.yaw);
    this.addTarget(origin.x - 6.2, origin.z + 3.8, origin.yaw + 1.4, 0.46, { challengeId: "frontierTargets", challengeLabel: "Frontier Plains Range", yOffset: 1.2 });
  }

  addWhisperingFields(origin) {
    for (let index = 0; index < 18; index += 1) {
      const x = origin.x + Math.sin(index * 1.7) * (2.2 + (index % 4));
      const z = origin.z + Math.cos(index * 1.3) * (2.4 + (index % 5));
      this.addFrontierFlowerPatch(x, z, 5);
    }
    this.addTarget(origin.x + 7.0, origin.z - 4.5, origin.yaw - 1.0, 0.42, { challengeId: "frontierTargets", challengeLabel: "Frontier Plains Range", yOffset: 0.55 });
  }

  addStoneCircleOfEchoes(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2;
      const x = origin.x + Math.sin(angle) * 3.2;
      const z = origin.z + Math.cos(angle) * 3.2;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.8 + (index % 3) * 0.26, 0.42), this.materials.frontierStone);
      stone.position.set(x, this.terrain.getHeightAt(x, z) + stone.geometry.parameters.height * 0.5, z);
      stone.rotation.set(0.06, angle + 0.3, 0.04);
      stone.castShadow = true;
      this.scene.add(stone);
      this.addCollisionBox(x, z, 0.62, 0.52, 2.1, angle + 0.3);
    }
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 8, 36), this.materials.masterBlue);
    glyph.position.set(origin.x, y + 0.12, origin.z);
    glyph.rotation.x = Math.PI / 2;
    this.scene.add(glyph);
  }

  addBrokenKingsRoad(origin) {
    [[-4, -2, 2.1, 0.36], [0, 0, 2.6, -0.1], [4, 2, 2.2, 0.22]].forEach(([dx, dz, width, yawOffset], index) => {
      const x = origin.x + dx;
      const z = origin.z + dz;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 1.0), index % 2 ? this.materials.frontierStone : this.materials.ancientStone);
      slab.position.set(x, this.terrain.getHeightAt(x, z) + 0.08, z);
      slab.rotation.y = origin.yaw + yawOffset;
      slab.receiveShadow = true;
      this.scene.add(slab);
    });
    this.addLegendaryHint(origin.x + 3.8, origin.z - 3.2, "Windrunner Road Mark", "Old road scratches show an archer running beside the wind, not against it.");
  }

  addGreenwaterCrossing(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const bridge = new THREE.Group();
    bridge.position.set(origin.x, y + 0.22, origin.z);
    bridge.rotation.y = origin.yaw;
    for (let index = -2; index <= 2; index += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 2.8), this.materials.weatheredDock);
      plank.position.x = index * 0.62;
      plank.rotation.z = index * 0.015;
      bridge.add(plank);
    }
    this.scene.add(bridge);
    this.addCollisionBox(origin.x, origin.z, 3.5, 0.34, 0.5, origin.yaw);
    this.addTarget(origin.x + 5.5, origin.z + 5.2, origin.yaw - 1.35, 0.44, { challengeId: "frontierTargets", challengeLabel: "Frontier Plains Range", yOffset: 0.45 });
  }

  addForgottenCamp(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const service = (localX, localZ) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      return new THREE.Vector3(point.x, 0, point.z);
    };
    this.expeditionCampServices = {
      fire: service(0, 0),
      mapTent: service(-2.6, -1.7),
      supply: service(2.3, 1.4),
      scoutPost: service(3.6, -2.2),
      travelerRest: service(-2.8, 2.5),
    };
    const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.1, 12), this.materials.darkStone);
    fire.position.set(origin.x, y + 0.05, origin.z);
    this.scene.add(fire);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), this.materials.warmWindow);
    ember.position.set(origin.x, y + 0.22, origin.z);
    this.scene.add(ember);
    [[-2.6, -1.7, 1.0, 0.12], [2.9, -1.9, 0.78, -0.16]].forEach(([localX, localZ, scale, yawOffset], index) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      const tent = new THREE.Mesh(new THREE.ConeGeometry(0.95 * scale, 1.05 * scale, 4), index % 2 ? this.materials.canvas : this.materials.parchment);
      tent.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.52 * scale, point.z);
      tent.rotation.y = origin.yaw + Math.PI / 4 + yawOffset;
      tent.castShadow = true;
      this.scene.add(tent);
      this.addCollisionCylinder(point.x, point.z, 0.72 * scale, 1.1 * scale);
    });
    this.addSettlementAtmosphere(origin, [
      [2.3, 1.4, "barrels"],
      [-2.8, 2.5, "firewood"],
      [3.6, -2.2, "sign"],
      [-0.9, 2.0, "laundry"],
    ]);
    [[-1.6, 1.1, 0.2], [1.4, 1.3, -0.4], [0.2, -1.8, 0.8]].forEach(([dx, dz, yaw]) => this.addFrontierCrate(origin.x + dx, origin.z + dz, origin.yaw + yaw));
    this.interactables.push({
      id: "frontier-forgotten-camp-journal",
      type: "lore",
      name: "Expedition Journal",
      prompt: "E Read",
      position: new THREE.Vector3(origin.x + 1.4, y + 0.55, origin.z + 1.3),
      radius: 2.6,
      text: "The road stones are older than any guild record. Someone crossed before us, and something drove them silent.",
    });
  }

  addFrontierTracksAndRewards() {
    [
      ["old-road-ruts", 121, -136, "Old Road Ruts", "The wheel marks bend toward the Broken King's Road."],
      ["riverfang-prints", 158, -136, "Riverfang Prints", "Wet tracks cross Greenwater and vanish near reeds."],
      ["circle-scratches", 151, -151, "Circle Scratches", "Claw marks stop exactly at the stone circle."],
      ["ironhorn-gouge", 132, -166, "Ironhorn Gouge", "Deep horn cuts point toward the southern plain."],
    ].forEach(([id, x, z, name, text]) => this.addFrontierTrack(id, x, z, name, text));

    this.addRareLootCache(168, -157, "Frontier Survey Compass", "epic", "A compass prepared for Arc 2 route mapping.");
    this.addRareLootCache(118, -168, "Old Road Keystone", "rare", "A stone key shape from a civilization older than the guild.");
    this.addLegendaryHint(150, -117, "Windrunner Feather", "A feather tied to a grassland bow. The trail says it must be earned from Ironhorn.");
  }

  addFrontierTrack(id, x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.04, z);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.035, 0.18), this.materials.frontierRoad);
    mark.rotation.y = Math.sin(x + z);
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), this.materials.masterBlue);
    glint.position.y = 0.18;
    group.add(mark, glint);
    this.scene.add(group);
    this.interactables.push({
      id: `frontier-track-${id}`,
      type: "frontier-track",
      name,
      prompt: "E Study tracks",
      position: new THREE.Vector3(x, y + 0.35, z),
      radius: 2.4,
      group,
      text,
    });
  }

  addLakesAndBoathousesPass() {
    if (this.hiddenLake) {
      this.addLakeDestinationDetails(this.hiddenLake, {
        id: "hidden-lake",
        style: "wilds",
        radiusX: 6.8,
        radiusZ: 5.9,
        yaw: -0.12,
      });
      this.addBoathouseSite({
        id: "hidden-lake-boathouse",
        waterName: "Hidden Lake",
        keeper: "Mira Reed",
        itemId: "lake-skiff-permit",
        rewardName: "Lake Skiff Permit",
        origin: { x: this.hiddenLake.x + 7.4, z: this.hiddenLake.z - 2.8, yaw: -0.55 },
        launchLocal: [-1.1, 2.9],
        destination: { x: this.hiddenLake.x - 5.4, z: this.hiddenLake.z + 3.9 },
        material: this.materials.agedWood,
        roof: this.materials.mistLeafDark ?? this.materials.pineDark,
        accent: this.materials.glowPlant,
        water: this.materials.water,
      });
    }

    if (this.greenwaterCrossing) {
      const origin = { x: this.greenwaterCrossing.x - 6.6, z: this.greenwaterCrossing.z + 4.7, yaw: 0.78 };
      this.addLakeDestinationDetails({ x: 160, z: -132, yaw: 0.42 }, {
        id: "greenwater",
        style: "frontier",
        radiusX: 8.4,
        radiusZ: 3.4,
        yaw: 0.42,
      });
      this.addBoathouseSite({
        id: "greenwater-boathouse",
        waterName: "Greenwater Crossing",
        keeper: "Old Noll",
        itemId: "keeper-rowboat",
        rewardName: "Keeper Rowboat",
        origin,
        launchLocal: [1.2, 3.2],
        destination: { x: this.greenwaterCrossing.x + 5.6, z: this.greenwaterCrossing.z - 4.1 },
        material: this.materials.wood,
        roof: this.materials.weatheredDock,
        accent: this.materials.frontierFlower ?? this.materials.flower,
        water: this.materials.frontierWater,
      });
    }
  }

  addLakeDestinationDetails(origin, options = {}) {
    const shoreline = {
      x: origin.x,
      z: origin.z,
      rx: options.radiusX ?? 6,
      rz: options.radiusZ ?? 4,
      yaw: options.yaw ?? origin.yaw ?? 0,
      style: options.style === "frontier" ? "river" : "lake",
      water: options.water ?? this.materials.water,
    };
    this.addNaturalShoreline(shoreline, 19);
    this.addWaterRippleSet(shoreline, 21);
    const detailCount = this.performanceMode ? 4 : 8;
    for (let index = 0; index < detailCount; index += 1) {
      const angle = index * Math.PI * 2 / detailCount + (options.yaw ?? 0);
      const x = origin.x + Math.sin(angle) * (shoreline.rx + 1.0 + (index % 2) * 0.7);
      const z = origin.z + Math.cos(angle) * (shoreline.rz + 0.8 + (index % 3) * 0.35);
      if (index % 3 === 0) {
        this.addOrganicRockCluster(x, z, 0.55 + (index % 2) * 0.16, index, options.style === "frontier" ? this.materials.frontierStone : this.materials.mossStone);
      } else {
        this.addLakeGrassClump(x, z, index, options.style);
      }
    }
  }

  addLakeGrassClump(x, z, seed = 0, style = "lake") {
    const y = this.terrain.getHeightAt(x, z);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.36 + (seed % 3) * 0.08, 9), style === "frontier" ? this.materials.frontierGrass : this.materials.grassLight);
    patch.position.set(x, y + 0.04, z);
    patch.rotation.x = -Math.PI / 2;
    this.scene.add(patch);
    if (this.performanceMode) {
      return;
    }
    for (let index = 0; index < 3; index += 1) {
      const blade = new THREE.Mesh(this.geometries.grassBlade, index % 2 ? this.materials.lily : this.materials.flower);
      blade.position.set(x + Math.sin(seed + index) * 0.28, y + 0.18, z + Math.cos(seed * 0.7 + index) * 0.24);
      blade.rotation.y = seed + index * 0.8;
      blade.scale.setScalar(0.7 + index * 0.08);
      this.scene.add(blade);
    }
  }

  addBoathouseSite(config) {
    const { origin } = config;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw ?? 0;

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.34, 2.85), this.materials.darkStone);
    foundation.position.y = 0.18;
    group.add(foundation);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.08, 1.55, 2.22), config.material ?? this.materials.agedWood);
    body.position.y = 1.1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = this.createLayeredGableRoof(4.2, 3.05, 2.05, config.roof ?? this.materials.barkDark, {
      overhang: 0.44,
      pitch: 0.58,
      trim: this.materials.warmTrim,
      beams: true,
      dormer: true,
    });
    group.add(roof);

    [-1.68, 1.68].forEach((xOffset) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.25, 7), this.materials.barkDark);
      post.position.set(xOffset, 1.1, 1.1);
      group.add(post);
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.05, 0.08), this.materials.barkDark);
    door.position.set(0, 0.88, 1.16);
    group.add(door);
    [-1.1, 1.1].forEach((xOffset) => {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.07), this.materials.warmWindow);
      window.position.set(xOffset, 1.22, 1.18);
      group.add(window);
    });
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 0.34), this.materials.darkStone);
    chimney.position.set(-1.08, 2.72, -0.64);
    group.add(chimney);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 0.06), this.materials.parchment);
    sign.position.set(0, 1.58, 1.28);
    group.add(sign);

    const dock = new THREE.Group();
    dock.position.set(0, 0.18, 2.08);
    for (let index = 0; index < 7; index += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 2.4), this.materials.weatheredDock);
      plank.position.x = (index - 3) * 0.42;
      plank.position.z = 0.84 + Math.sin(index) * 0.03;
      plank.rotation.z = Math.sin(index * 1.7) * 0.025;
      dock.add(plank);
    }
    [-1.55, 1.55].forEach((xOffset) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.55, 6), this.materials.barkDark);
      rail.position.set(xOffset, 0.42, 0.86);
      rail.rotation.x = Math.PI / 2;
      dock.add(rail);
    });
    group.add(dock);

    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.44), this.materials.cutWood);
    crate.position.set(-1.28, 0.58, -1.06);
    group.add(crate);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.55, 6), this.materials.cutWood);
    oar.position.set(1.34, 0.76, -0.92);
    oar.rotation.set(0.2, 0.2, Math.PI / 2);
    group.add(oar);

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 3.75, 2.9, 2.9, origin.yaw ?? 0);

    const launchPoint = this.getSettlementPoint(origin, ...(config.launchLocal ?? [0, 3.0]));
    this.addRowboatModel(launchPoint.x, launchPoint.z, origin.yaw ?? 0, config.water ?? this.materials.water);
    this.addBoatKeeperFigure(origin.x - Math.sin(origin.yaw + Math.PI / 2) * 2.35, origin.z - Math.cos(origin.yaw + Math.PI / 2) * 2.35, origin.yaw + 0.45, config);

    const keeperPoint = this.getSettlementPoint(origin, -2.4, 0.4);
    this.interactables.push({
      id: `${config.id}-keeper`,
      type: "boat-keeper",
      name: `${config.keeper}, Boat Keeper`,
      prompt: "E Talk boats",
      position: new THREE.Vector3(keeperPoint.x, this.terrain.getHeightAt(keeperPoint.x, keeperPoint.z) + 0.75, keeperPoint.z),
      radius: 3.2,
      category: "items",
      itemId: config.itemId,
      rewardName: config.rewardName,
      text: `${config.keeper}: Calm water teaches patience. I can unlock a boat for this lake, and someday we'll stock bait and rods here too.`,
      unlockText: `${config.keeper}: Take this ${config.rewardName}. Use marked launch docks to cross calm water.`,
      unlockedText: `${config.keeper}: Your ${config.rewardName} is ready. The fishing racks are still empty, but not for long.`,
    });

    this.interactables.push({
      id: `${config.id}-launch`,
      type: "boat-launch",
      name: `${config.waterName} Boat Launch`,
      prompt: "E Launch boat",
      position: new THREE.Vector3(launchPoint.x, this.terrain.getHeightAt(launchPoint.x, launchPoint.z) + 0.55, launchPoint.z),
      radius: 2.8,
      itemIds: ["keeper-rowboat", "lake-skiff-permit"],
      destination: new THREE.Vector3(config.destination.x, this.terrain.getHeightAt(config.destination.x, config.destination.z), config.destination.z),
      destinationName: config.waterName,
      lockedText: "A Boat Keeper can unlock a skiff before you use this launch.",
      travelText: `You glide quietly across ${config.waterName}.`,
    });

    const fishingPoint = this.getSettlementPoint(origin, 1.55, 2.7);
    this.interactables.push({
      id: `${config.id}-future-fishing`,
      type: "future-fishing-dock",
      name: `${config.waterName} Fishing Rack`,
      prompt: "E Inspect",
      position: new THREE.Vector3(fishingPoint.x, this.terrain.getHeightAt(fishingPoint.x, fishingPoint.z) + 0.55, fishingPoint.z),
      radius: 2.2,
      text: "A neat rack for rods, bait tins, and lake notes. The Boat Keepers are clearly preparing for fishing lessons later.",
    });
  }

  addRowboatModel(x, z, yaw = 0, waterMaterial = this.materials.water) {
    const y = this.terrain.getHeightAt(x, z) + 0.12;
    const boat = new THREE.Group();
    boat.position.set(x, y, z);
    boat.rotation.y = yaw;
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.5, 4, 10), this.materials.weatheredDock);
    hull.scale.set(1.0, 0.32, 1.62);
    hull.rotation.z = Math.PI / 2;
    boat.add(hull);
    const inset = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.52), this.materials.barkDark);
    inset.position.y = 0.12;
    boat.add(inset);
    [-0.46, 0.46].forEach((xOffset) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.68), this.materials.cutWood);
      bench.position.set(xOffset, 0.2, 0);
      boat.add(bench);
    });
    const waterShadow = new THREE.Mesh(new THREE.CircleGeometry(1.25, 18), waterMaterial);
    waterShadow.position.y = -0.05;
    waterShadow.rotation.x = -Math.PI / 2;
    waterShadow.scale.set(1.45, 0.58, 1);
    boat.add(waterShadow);
    boat.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    this.scene.add(boat);
  }

  addBoatKeeperFigure(x, z, yaw = 0, config = {}) {
    const y = this.terrain.getHeightAt(x, z);
    const figure = new THREE.Group();
    figure.position.set(x, y, z);
    figure.rotation.y = yaw;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.82, 8), this.materials.canvas);
    body.position.y = 0.62;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), this.materials.parchment);
    head.position.y = 1.18;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 8), config.accent ?? this.materials.banner);
    hat.position.y = 1.39;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.25, 6), this.materials.cutWood);
    pole.position.set(0.34, 0.76, 0.05);
    pole.rotation.z = -0.2;
    figure.add(body, head, hat, pole);
    figure.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    this.scene.add(figure);
  }

  addLostKingdom() {
    this.lostKingdom = { x: 82, z: -150, yaw: -0.16, scale: 1 };
    this.kingsGate = { x: 96, z: -132, yaw: -0.48 };
    this.sunTemple = { x: 68, z: -166, yaw: 0.28 };
    this.forgottenPlaza = { x: 84, z: -149, yaw: 0.04 };
    this.watchersTower = { x: 104, z: -160, yaw: -0.2 };
    this.hallOfEchoes = { x: 74, z: -134, yaw: 0.64 };
    this.sealedArchive = { x: 58, z: -145, yaw: 0.12 };
    this.lostKingdomMechanisms = new Map();

    this.addLostKingdomRoads();
    this.addKingsGate(this.kingsGate);
    this.addSunTemple(this.sunTemple);
    this.addForgottenPlaza(this.forgottenPlaza);
    this.addWatchersTower(this.watchersTower);
    this.addHallOfEchoes(this.hallOfEchoes);
    this.addSealedArchive(this.sealedArchive);
    this.addLostKingdomStoryRewards();
  }

  addLostKingdomRoads() {
    [
      [99, -128, 7.4, 1.25, -0.55],
      [92, -137, 8.2, 1.2, -0.42],
      [84, -149, 7.6, 1.15, -0.1],
      [73, -158, 6.8, 1.05, 0.72],
      [63, -146, 7.2, 1.0, 1.45],
    ].forEach(([x, z, width, depth, yaw], index) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.09, depth), index % 2 ? this.materials.kingdomStone : this.materials.ancientStone);
      slab.position.set(x, this.terrain.getHeightAt(x, z) + 0.075, z);
      slab.rotation.y = yaw;
      slab.receiveShadow = true;
      this.scene.add(slab);
    });

    [
      [88, -132, 2.3, 0.4], [80, -138, 1.8, -0.6], [91, -155, 2.0, 0.7], [64, -153, 2.4, -0.3], [70, -170, 1.7, 0.2],
    ].forEach(([x, z, scale, yaw]) => this.addKingdomRuinChunk(x, z, scale, yaw));
  }

  addKingsGate(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const gate = new THREE.Group();
    gate.position.set(origin.x, y, origin.z);
    gate.rotation.y = origin.yaw;
    [-1, 1].forEach((side) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.6, 1.15), this.materials.kingdomStone);
      pillar.position.set(side * 2.1, 2.8, 0);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.46, 1.45), this.materials.kingdomDarkStone);
      cap.position.set(side * 2.1, 5.8, 0);
      const gold = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 0.08), this.materials.kingdomGold);
      gold.position.set(side * 1.54, 3.0, -0.6);
      gate.add(pillar, cap, gold);
      this.addCollisionBox(origin.x + Math.cos(origin.yaw) * side * 2.1, origin.z - Math.sin(origin.yaw) * side * 2.1, 1.18, 1.18, 5.8, origin.yaw);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.72, 1.05), this.materials.kingdomDarkStone);
    lintel.position.set(0, 5.45, 0);
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.045, 8, 36), this.materials.kingdomGold);
    crest.position.set(0, 4.55, -0.58);
    crest.rotation.x = Math.PI / 2;
    gate.add(lintel, crest);
    this.scene.add(gate);

    this.interactables.push({
      id: "lost-kingdom-kings-gate",
      type: "lost-kingdom-console",
      name: "King's Gate Inscription",
      prompt: "E Read inscription",
      position: new THREE.Vector3(origin.x, y + 1.2, origin.z - 1.4),
      radius: 3.5,
      text: "The kingdom once welcomed caravans here. Later chisel marks deliberately remove every royal name.",
    });
  }

  addSunTemple(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.42, 8), this.materials.kingdomStone);
    base.position.set(origin.x, y + 0.21, origin.z);
    base.rotation.y = origin.yaw;
    base.receiveShadow = true;
    this.scene.add(base);
    for (let index = 0; index < 6; index += 1) {
      const angle = origin.yaw + (index / 6) * Math.PI * 2;
      const x = origin.x + Math.sin(angle) * 2.8;
      const z = origin.z + Math.cos(angle) * 2.8;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.3 - (index % 2) * 0.35, 7), this.materials.kingdomStone);
      column.position.set(x, this.terrain.getHeightAt(x, z) + column.geometry.parameters.height * 0.5, z);
      column.rotation.z = Math.sin(index) * 0.08;
      column.castShadow = true;
      this.scene.add(column);
      this.addCollisionCylinder(x, z, 0.34, 2.2);
    }
    const sunDisk = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.05, 8, 40), this.materials.kingdomGold);
    sunDisk.position.set(origin.x, y + 2.45, origin.z - 1.1);
    sunDisk.rotation.set(Math.PI / 2, 0, origin.yaw);
    this.scene.add(sunDisk);
    this.addTarget(origin.x - 5.8, origin.z + 3.6, origin.yaw + 1.8, 0.46, {
      challengeId: "lostKingdomTargets",
      challengeLabel: "Lost Kingdom Sun Trial",
      switchId: "lost-kingdom-sun-temple",
      yOffset: 1.15,
    });
    this.addAncientRecord("sun-temple-record", origin.x + 1.8, origin.z - 2.4, "Sun Temple Record", "The sun order trained royal archers here. Their final log ends mid-sentence.");
  }

  addForgottenPlaza(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.055, 8, 48), this.materials.kingdomGold);
    ring.position.set(origin.x, y + 0.13, origin.z);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      const x = origin.x + Math.sin(angle) * (3.2 + (index % 2) * 0.5);
      const z = origin.z + Math.cos(angle) * (3.2 + (index % 3) * 0.35);
      this.addKingdomRuinChunk(x, z, 0.82 + (index % 3) * 0.22, angle);
    }
    this.addTarget(origin.x + 7.2, origin.z - 1.8, origin.yaw - 1.3, 0.42, {
      challengeId: "lostKingdomTargets",
      challengeLabel: "Lost Kingdom Sun Trial",
      yOffset: 0.65,
    });
    this.addAncientRecord("plaza-record", origin.x - 2.3, origin.z + 1.4, "Plaza Record Shard", "Merchants wrote that the city prospered for generations. The last lines were scraped clean.");
  }

  addWatchersTower(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const tower = new THREE.Group();
    tower.position.set(origin.x, y, origin.z);
    tower.rotation.y = origin.yaw;
    for (let level = 0; level < 3; level += 1) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05 - level * 0.13, 1.25 - level * 0.12, 1.55, 7), level % 2 ? this.materials.kingdomDarkStone : this.materials.kingdomStone);
      body.position.y = 0.78 + level * 1.38;
      body.rotation.y = level * 0.35;
      tower.add(body);
    }
    const brokenCrown = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.42), this.materials.kingdomGold);
    brokenCrown.position.set(0.25, 4.45, -0.25);
    brokenCrown.rotation.z = -0.18;
    tower.add(brokenCrown);
    this.scene.add(tower);
    this.addCollisionCylinder(origin.x, origin.z, 1.2, 4.5);
    this.addTarget(origin.x - 6.2, origin.z - 4.8, origin.yaw + 2.6, 0.44, {
      challengeId: "lostKingdomTargets",
      challengeLabel: "Lost Kingdom Sun Trial",
      yOffset: 1.4,
    });
  }

  addHallOfEchoes(origin) {
    for (let index = 0; index < 5; index += 1) {
      const x = origin.x + index * 2.1 - 4.2;
      const z = origin.z + Math.sin(index * 0.8) * 0.7;
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.8, 0.58), this.materials.kingdomStone);
      const right = left.clone();
      left.position.set(x, this.terrain.getHeightAt(x, z) + 1.4, z - 1.1);
      right.position.set(x, this.terrain.getHeightAt(x, z) + 1.25, z + 1.1);
      right.scale.y = 0.88;
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24, Math.PI), this.materials.kingdomGold);
      arch.position.set(x, this.terrain.getHeightAt(x, z) + 2.82, z);
      arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      this.scene.add(left, right, arch);
      this.addCollisionBox(x, z - 1.1, 0.52, 0.7, 2.8, origin.yaw);
      this.addCollisionBox(x, z + 1.1, 0.52, 0.7, 2.5, origin.yaw);
    }
    this.addAncientRecord("hall-record", origin.x + 4.8, origin.z + 1.6, "Echoed Wall Carving", "A carved procession is interrupted by a blank panel, as if history was cut from the stone.");
  }

  addSealedArchive(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const archive = new THREE.Group();
    archive.position.set(origin.x, y, origin.z);
    archive.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.5, 4.6), this.materials.kingdomDarkStone);
    base.position.y = 0.25;
    archive.add(base);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.1, 4.7), this.materials.kingdomStone);
      wall.position.set(side * 2.9, 1.75, 0);
      archive.add(wall);
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.8, 0.58), this.materials.kingdomStone);
    back.position.set(0, 1.7, 2.05);
    archive.add(back);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.28), this.materials.archiveBlue);
    door.position.set(0, 1.65, -2.18);
    archive.add(door);
    this.scene.add(archive);
    this.addCollisionBox(origin.x - 2.9, origin.z, 0.78, 4.8, 3.1, origin.yaw);
    this.addCollisionBox(origin.x + 2.9, origin.z, 0.78, 4.8, 3.1, origin.yaw);
    this.lostKingdomMechanisms.set("archive-door", { door, active: false, name: "Archive Door" });
    this.addTarget(origin.x + 6.0, origin.z - 3.8, origin.yaw - 1.1, 0.48, {
      challengeId: "lostKingdomTargets",
      challengeLabel: "Lost Kingdom Sun Trial",
      switchId: "lost-kingdom-archive-door",
      yOffset: 1.0,
    });
    this.addAncientRecord("archive-record", origin.x - 1.2, origin.z + 1.2, "Sealed Archive Fragment", "The archive was locked from inside. Every surviving index skips the same missing reign.");
    this.addLegendaryHint(origin.x + 2.7, origin.z + 2.4, "Kingmaker Writ", "Recover the records, wake the mechanisms, open the archive, and face the First Sentinel.");
  }

  addLostKingdomStoryRewards() {
    this.addAncientRecord("watcher-record", 103.4, -157.2, "Watcher Tablet", "A tower watcher wrote that the kingdom did not fall in battle; it was made to vanish.");
    this.addRareLootCache(61.2, -158.6, "Royal Seal Fragment", "epic", "A seal from a dynasty missing from every frontier record.");
    this.addRareLootCache(90.5, -142.4, "Archive Lens", "rare", "A clear lens designed for reading deliberately faded carvings.");
    this.addAncientMechanismMarker("plaza-obelisk", 81.2, -151.6, "Plaza Obelisk", "A low hum travels toward the Sealed Archive.");
  }

  addKingdomRuinChunk(x, z, scale = 1, yaw = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.75 * scale, 0.55 * scale, 1.2 * scale), this.materials.kingdomStone);
    stone.position.set(x, y + 0.28 * scale, z);
    stone.rotation.set(0.04 * scale, yaw, -0.05 * scale);
    stone.castShadow = true;
    stone.receiveShadow = true;
    this.scene.add(stone);
    if (scale > 1.1) this.addCollisionBox(x, z, 0.82 * scale, 1.15 * scale, 0.6 * scale, yaw);

    const vine = new THREE.Mesh(new THREE.CapsuleGeometry(0.035 * scale, 0.8 * scale, 4, 6), this.materials.overgrowthVine);
    vine.position.set(x + 0.18 * scale, y + 0.58 * scale, z - 0.2 * scale);
    vine.rotation.set(0.6, yaw + 0.4, 0.2);
    this.scene.add(vine);
  }

  addAncientMechanismMarker(id, x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const obelisk = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.55, 0.58), this.materials.kingdomDarkStone);
    obelisk.position.set(x, y + 0.78, z);
    obelisk.rotation.y = 0.4;
    this.scene.add(obelisk);
    const glow = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), this.materials.archiveBlue);
    glow.position.set(x, y + 1.72, z);
    this.scene.add(glow);
    this.interactables.push({
      id: `lost-kingdom-mechanism-${id}`,
      type: "ancient-mechanism",
      mechanismId: id,
      name,
      prompt: "E Align mechanism",
      position: new THREE.Vector3(x, y + 0.9, z),
      radius: 2.8,
      text,
    });
    this.lostKingdomMechanisms.set(id, { glow, active: false, name });
  }

  addAncientRecord(id, x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.52), this.materials.parchment);
    tablet.position.set(x, y + 0.14, z);
    tablet.rotation.set(-0.15, Math.sin(x + z), 0.04);
    this.scene.add(tablet);
    this.interactables.push({
      id: `lost-kingdom-record-${id}`,
      type: "ancient-record",
      recordId: id,
      name,
      prompt: "E Read record",
      position: new THREE.Vector3(x, y + 0.35, z),
      radius: 2.4,
      text,
    });
  }

  activateLostKingdomMechanism(id) {
    const key = id.replace("lost-kingdom-", "").replace("sun-temple", "sun-temple").replace("archive-door", "archive-door");
    if (key === "sun-temple" && !this.lostKingdomMechanisms.has(key)) {
      this.lostKingdomMechanisms.set(key, { active: false, name: "Sun Temple Lens" });
    }
    const mechanism = this.lostKingdomMechanisms.get(key);
    if (!mechanism || mechanism.active) {
      return;
    }
    mechanism.active = true;
    if (mechanism.door) {
      mechanism.door.position.y += 2.2;
      mechanism.door.material = this.materials.kingdomGold;
    }
    if (mechanism.glow) {
      mechanism.glow.scale.setScalar(1.65);
    }
    const activeCount = [...this.lostKingdomMechanisms.values()].filter((item) => item.active).length;
    window.dispatchEvent(new CustomEvent("echo-archer:ancient-mechanism", {
      detail: { id: key, name: mechanism.name ?? "Ancient Mechanism", activeCount, total: this.lostKingdomMechanisms.size },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "ANCIENT MECHANISM AWAKENED", kind: "xp", x: window.innerWidth / 2, y: window.innerHeight * 0.28 },
    }));
  }

  addCelestialExpanse() {
    this.celestialExpanse = { x: 78, z: 154, yaw: 0.18, scale: 1 };
    this.observatoryPrime = { x: 72, z: 135, yaw: -0.28 };
    this.skyfallBasin = { x: 78, z: 146, yaw: 0.05 };
    this.crystalSea = { x: 96, z: 143, yaw: -0.38 };
    this.floatingReach = { x: 60, z: 166, yaw: 0.42 };
    this.starforgeRuins = { x: 82, z: 160, yaw: 0.2 };
    this.templeFirstSky = { x: 96, z: 172, yaw: -0.08 };
    this.celestialRelays = new Map();

    this.addCelestialRoutesAndVistas();
    this.addObservatoryPrime(this.observatoryPrime);
    this.addSkyfallBasin(this.skyfallBasin);
    this.addCrystalSea(this.crystalSea);
    this.addFloatingReach(this.floatingReach);
    this.addStarforgeRuins(this.starforgeRuins);
    this.addTempleOfFirstSky(this.templeFirstSky);
    this.addCelestialStoryRewards();
  }

  addCelestialRoutesAndVistas() {
    [
      [58, 138, 7.2, 1.1, 0.72],
      [68, 145, 8.4, 1.0, 0.48],
      [78, 154, 8.8, 1.05, 0.18],
      [90, 162, 7.8, 1.0, -0.38],
      [98, 171, 6.8, 0.95, -0.1],
    ].forEach(([x, z, width, depth, yaw], index) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth), index % 2 ? this.materials.crystalSand : this.materials.celestialMarble);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.075, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });

    [
      [64, 142, 1.4], [73, 150, 1.7], [89, 151, 1.5], [101, 158, 1.9], [58, 172, 1.6], [94, 176, 2.0],
    ].forEach(([x, z, scale], index) => this.addCelestialCrystalCluster(x, z, scale, index));
  }

  addObservatoryPrime(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.6, 0.5, 10), this.materials.celestialStone);
    base.position.set(origin.x, y + 0.25, origin.z);
    base.rotation.y = origin.yaw;
    this.scene.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.07, 8, 56), this.materials.stellarGold);
    ring.position.set(origin.x, y + 2.4, origin.z);
    ring.rotation.set(Math.PI / 2.3, 0.2, origin.yaw);
    this.scene.add(ring);
    for (let index = 0; index < 5; index += 1) {
      const angle = origin.yaw + (index / 5) * Math.PI * 2;
      const x = origin.x + Math.sin(angle) * 2.55;
      const z = origin.z + Math.cos(angle) * 2.55;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.55, 7), this.materials.celestialMarble);
      pillar.position.set(x, this.terrain.getHeightAt(x, z) + 1.28, z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.addCollisionCylinder(x, z, 0.32, 2.55);
    }
    this.addCelestialRelay("observatory-prime", origin.x + 1.8, origin.z - 2.0, "Observatory Prime Relay", "The lenses turn toward a sky older than the Lost Kingdom.");
    this.addCelestialRecord("prime-record", origin.x - 2.0, origin.z + 1.7, "Prime Observatory Record", "The Lost Kingdom copied only fragments. The first sky-keepers measured forces no kingdom fully understood.");
    this.interactables.push({
      id: "celestial-expanse-prime-console",
      type: "celestial-expanse-console",
      name: "First Sky Orrery",
      prompt: "E Study orrery",
      position: new THREE.Vector3(origin.x, y + 1.0, origin.z),
      radius: 3.4,
      text: "The orrery shows a civilization before the Lost Kingdom, then a sudden empty orbit where history breaks.",
    });
  }

  addSkyfallBasin(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 0.16, 18), this.materials.voidCrystal);
    basin.position.set(origin.x, y + 0.08, origin.z);
    basin.scale.y = 0.55;
    this.scene.add(basin);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      this.addFloatingStone(origin.x + Math.sin(angle) * 3.9, origin.z + Math.cos(angle) * 3.2, 0.55 + (index % 3) * 0.28, angle);
    }
    this.addTarget(origin.x - 6.8, origin.z + 2.8, origin.yaw + 1.5, 0.43, {
      challengeId: "celestialTargets",
      challengeLabel: "Celestial Relay Range",
      yOffset: 1.4,
    });
  }

  addCrystalSea(origin) {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 5.2), this.materials.starWater ?? this.materials.seaWater);
    water.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.08, origin.z);
    water.rotation.set(-Math.PI / 2, 0, origin.yaw);
    this.scene.add(water);
    for (let index = 0; index < 12; index += 1) {
      const x = origin.x + Math.sin(index * 1.7) * (2.0 + (index % 4) * 0.7);
      const z = origin.z + Math.cos(index * 1.2) * (1.4 + (index % 3) * 0.8);
      this.addCelestialCrystalCluster(x, z, 0.7 + (index % 3) * 0.2, index);
    }
    this.addCelestialRecord("crystal-sea-record", origin.x + 2.8, origin.z - 1.8, "Crystal Sea Record", "The lakes remember starfall. Their light repeats the night of catastrophe without naming its cause.");
  }

  addFloatingReach(origin) {
    for (let index = 0; index < 7; index += 1) {
      const x = origin.x + (index - 3) * 1.7;
      const z = origin.z + Math.sin(index * 0.9) * 1.5;
      this.addFloatingStone(x, z, 1.2 + index * 0.18, index * 0.5);
    }
    this.addTarget(origin.x + 4.8, origin.z + 3.8, origin.yaw - 1.3, 0.46, {
      challengeId: "celestialTargets",
      challengeLabel: "Celestial Relay Range",
      switchId: "celestial-relay-floating-reach",
      yOffset: 2.0,
    });
    this.addCelestialRelay("floating-reach", origin.x - 2.4, origin.z - 1.6, "Floating Reach Relay", "A path of suspended stones steadies for a few impossible breaths.");
  }

  addStarforgeRuins(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const forge = new THREE.Group();
    forge.position.set(origin.x, y, origin.z);
    forge.rotation.y = origin.yaw;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), this.materials.voidCrystal);
    core.position.y = 1.45;
    const cradle = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 42), this.materials.stellarGold);
    cradle.position.y = 1.42;
    cradle.rotation.x = Math.PI / 2;
    forge.add(core, cradle);
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.42), this.materials.celestialStone);
      arm.position.set(side * 1.25, 0.8, 0);
      arm.rotation.z = side * 0.1;
      forge.add(arm);
    });
    this.scene.add(forge);
    this.addCelestialRelay("starforge", origin.x + 2.6, origin.z + 1.6, "Starforge Relay", "The forge answers with a pulse, but one chamber remains sealed.");
    this.addTarget(origin.x - 5.2, origin.z - 4.6, origin.yaw + 2.1, 0.44, {
      challengeId: "celestialTargets",
      challengeLabel: "Celestial Relay Range",
      yOffset: 1.1,
    });
  }

  addTempleOfFirstSky(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const temple = new THREE.Group();
    temple.position.set(origin.x, y, origin.z);
    temple.rotation.y = origin.yaw;
    const steps = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.42, 4.6), this.materials.celestialMarble);
    steps.position.y = 0.21;
    const gate = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.4, 0.55), this.materials.celestialStone);
    gate.position.set(0, 1.9, -1.9);
    const opening = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 0.6), this.materials.voidCrystal);
    opening.position.set(0, 1.7, -2.0);
    temple.add(steps, gate, opening);
    this.scene.add(temple);
    this.addCollisionBox(origin.x, origin.z - 1.9, 4.5, 0.8, 3.4, origin.yaw);
    this.addCelestialRelay("first-sky-temple", origin.x - 1.8, origin.z + 2.0, "First Sky Relay", "The temple machinery reveals a hidden sanctum beneath the blue light.");
    this.addCelestialRecord("first-sky-record", origin.x + 2.0, origin.z + 2.4, "First Sky Tablet", "The sky-keepers vanished after opening something they could not close.");
    this.addLegendaryHint(origin.x + 2.8, origin.z - 1.6, "Voidstar Constellation", "Restore the relays, recover the first-sky records, open the sanctum, and defeat the Skybound Warden.");
  }

  addCelestialStoryRewards() {
    this.addCelestialRecord("skyfall-fragment", 79.8, 149.8, "Skyfall Fragment", "The Lost Kingdom was not the first to fear erasure. The celestial records are older still.");
    this.addRareLootCache(102.2, 151.3, "Void Glass Prism", "epic", "A prism from the celestial machinery, prepared for future Arc 2 crafting.");
    this.addRareLootCache(56.4, 160.5, "Floating Stone Core", "rare", "A light core that hums when relays awaken.");
  }

  addCelestialCrystalCluster(x, z, scale = 1, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    for (let shard = 0; shard < 3; shard += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.16 * scale, (0.9 + shard * 0.22) * scale, 5), shard % 2 ? this.materials.voidCrystal : this.materials.moonCrystal);
      crystal.position.set((shard - 1) * 0.24 * scale, 0.42 * scale, Math.sin(index + shard) * 0.18 * scale);
      crystal.rotation.set(0.08 * shard, index * 0.2, -0.12 + shard * 0.08);
      group.add(crystal);
    }
    this.scene.add(group);
  }

  addFloatingStone(x, z, yOffset = 1.0, yaw = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), this.materials.celestialStone);
    stone.position.set(x, y + yOffset, z);
    stone.scale.set(1.4, 0.4, 1.0);
    stone.rotation.set(0.16, yaw, 0.08);
    stone.castShadow = true;
    this.scene.add(stone);
  }

  addCelestialRelay(id, x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.5, 8), this.materials.celestialStone);
    plinth.position.y = 0.25;
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), this.materials.voidCrystal);
    orb.position.y = 0.95;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 32), this.materials.stellarGold);
    ring.position.y = 0.95;
    ring.rotation.x = Math.PI / 2;
    group.add(plinth, orb, ring);
    this.scene.add(group);
    this.interactables.push({
      id: `celestial-relay-${id}`,
      type: "celestial-relay",
      relayId: id,
      name,
      prompt: "E Activate relay",
      position: new THREE.Vector3(x, y + 0.8, z),
      radius: 2.9,
      text,
    });
    this.celestialRelays.set(id, { group, orb, ring, active: false, name });
  }

  addCelestialRecord(id, x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.56), this.materials.celestialMarble);
    tablet.position.set(x, y + 0.14, z);
    tablet.rotation.set(-0.18, Math.sin(x * 0.2 + z), 0.05);
    this.scene.add(tablet);
    this.interactables.push({
      id: `celestial-record-${id}`,
      type: "celestial-record",
      recordId: id,
      name,
      prompt: "E Decode record",
      position: new THREE.Vector3(x, y + 0.36, z),
      radius: 2.4,
      text,
    });
  }

  activateCelestialRelay(id) {
    const key = id.replace("celestial-relay-", "");
    const relay = this.celestialRelays.get(key);
    if (!relay) return;
    if (relay.active) {
      const activeCount = [...this.celestialRelays.values()].filter((item) => item.active).length;
      window.dispatchEvent(new CustomEvent("echo-archer:celestial-relay", {
        detail: { id: key, name: relay.name, activeCount, total: this.celestialRelays.size },
      }));
      return;
    }
    relay.active = true;
    relay.orb.scale.setScalar(1.65);
    relay.ring.scale.setScalar(1.35);
    relay.group.position.y += 0.18;
    const activeCount = [...this.celestialRelays.values()].filter((item) => item.active).length;
    window.dispatchEvent(new CustomEvent("echo-archer:celestial-relay", {
      detail: { id: key, name: relay.name, activeCount, total: this.celestialRelays.size },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "CELESTIAL RELAY RESTORED", kind: "xp", x: window.innerWidth / 2, y: window.innerHeight * 0.28 },
    }));
  }

  addHallOfArrows() {
    this.hallOfArrows = { x: -94, z: 88, yaw: -0.28, scale: 1.85, interior: true };
    this.masterTrialGrounds = {
      precision: new THREE.Vector3(-107, 0, 94),
      survival: new THREE.Vector3(-84, 0, 94),
      mastery: new THREE.Vector3(-105, 0, 75),
      champion: new THREE.Vector3(-82, 0, 76),
    };

    if (!this.hallOfArrows.interior) {
      this.addHallApproach();
    }
    this.addHallStructure();
    this.addMasterTrialTargets();
    this.addMasterTrialInteractables();
  }

  addHallApproach() {
    const approach = this.hallOfArrows.interior
      ? [
        [-91, 77, 4.8, 1.0, -0.18],
        [-93, 81, 5.8, 1.08, -0.2],
        [-94, 85, 7.0, 1.18, -0.24],
      ]
      : [
        [-59, 36, 4.8, 1.0, 0.62],
        [-64, 40, 5.2, 1.0, 0.72],
        [-70, 44, 5.6, 1.04, 0.82],
        [-76, 47, 6.4, 1.18, 1.02],
      ];

    approach.forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), this.materials.visibleTrail);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.06, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });

    const markers = this.hallOfArrows.interior
      ? [[-90, 80, 0.8], [-93, 84, 0.9], [-97, 86.5, 1.0]]
      : [[-62, 40, 0.7], [-67, 43, 0.8], [-72, 45.5, 0.9], [-80, 46.2, 1.0]];
    markers.forEach(([x, z, scale], index) => {
      const y = this.terrain.getHeightAt(x, z);
      const marker = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.95 * scale, 5), index % 2 ? this.materials.masterBlue : this.materials.masterBronze);
      marker.position.set(x, y + 0.48 * scale, z);
      marker.rotation.z = 0.04 * (index % 2 ? -1 : 1);
      marker.castShadow = true;
      this.scene.add(marker);
    });
  }

  addHallStructure() {
    const origin = this.hallOfArrows;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const hall = new THREE.Group();
    hall.position.set(origin.x, y, origin.z);
    hall.rotation.y = origin.yaw;
    hall.scale.setScalar(origin.scale ?? 1);

    const foundation = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.2, 0.38, 10), this.materials.masterMarble);
    foundation.position.y = 0.19;
    foundation.receiveShadow = true;
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.75, 0.42, 10), this.materials.masterBronze);
    dais.position.y = 0.62;
    dais.receiveShadow = true;
    const crest = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 10, 42), this.materials.targetGold);
    crest.position.set(0, 2.65, -2.75);
    crest.rotation.x = Math.PI / 2;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.4, 5), this.materials.targetGold);
    arrow.position.set(0, 2.65, -2.75);
    arrow.rotation.x = Math.PI / 2;
    hall.add(foundation, dais, crest, arrow);

    [-1, 1].forEach((side) => {
      for (let index = 0; index < 3; index += 1) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 2.8 - index * 0.14, 8), this.materials.masterMarble);
        pillar.position.set(side * (2.0 + index * 1.15), 1.48 - index * 0.04, -2.2 + index * 1.05);
        pillar.rotation.z = side * (0.03 + index * 0.02);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        hall.add(pillar);
      }
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.3, 0.08), this.materials.banner);
      banner.position.set(side * 3.5, 2.0, -2.2);
      banner.castShadow = true;
      hall.add(banner);
    });

    this.scene.add(hall);
    this.addCollisionCylinder(origin.x, origin.z, 2.25, 0.55);
    this.addCollisionBox(origin.x + Math.sin(origin.yaw) * -2.75, origin.z + Math.cos(origin.yaw) * -2.75, 5.4, 0.55, 3.0, origin.yaw);

    const glow = new THREE.PointLight(0xffd166, 1.25, 24, 2.1);
    glow.position.set(origin.x, y + 5.4, origin.z - 2.8);
    this.scene.add(glow);

    this.addHallOfArrowsMasterpieceDetails(origin, y);
    this.addHallInteriorShell(origin, y);
  }

  addHallInteriorShell(origin, groundY) {
    const shell = new THREE.Group();
    shell.position.set(origin.x, groundY, origin.z);
    shell.rotation.y = origin.yaw;
    shell.scale.setScalar(origin.scale ?? 1);

    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(9.4, 4.8, 0.55), this.materials.kingdomDarkStone);
    rearWall.position.set(0, 2.55, 4.25);
    const sideWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.8, 8.5), this.materials.ancientStone);
    sideWallLeft.position.set(-5.2, 2.15, 0.55);
    const sideWallRight = sideWallLeft.clone();
    sideWallRight.position.x = 5.2;
    const vaultedBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 10.2, 10), this.materials.cutWood);
    vaultedBeam.position.set(0, 4.75, 0.35);
    vaultedBeam.rotation.x = Math.PI / 2;
    const ceilingHint = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.55, 0.34, 18, 1, false, 0, Math.PI), this.materials.darkStone);
    ceilingHint.position.set(0, 4.85, 0.55);
    ceilingHint.rotation.z = Math.PI;
    const centerRunner = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.045, 7.4), this.materials.banner);
    centerRunner.position.set(0, 0.16, 0.15);
    const sideRunnerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 6.2), this.materials.masterBlue);
    sideRunnerLeft.position.set(-3.05, 0.17, 0.32);
    const sideRunnerRight = sideRunnerLeft.clone();
    sideRunnerRight.position.x = 3.05;
    shell.add(rearWall, sideWallLeft, sideWallRight, vaultedBeam, ceilingHint, centerRunner, sideRunnerLeft, sideRunnerRight);

    [-1, 1].forEach((side) => {
      for (let index = 0; index < 4; index += 1) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.34), this.materials.cutWood);
        bench.position.set(side * 2.4, 0.44, -2.3 + index * 1.22);
        bench.rotation.y = side * -0.08;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.26), this.materials.barkDark);
        leg.position.set(side * 2.4, 0.26, -2.3 + index * 1.22);
        shell.add(bench, leg);
      }
    });

    [-3.6, -1.2, 1.2, 3.6].forEach((xOffset, index) => {
      const sconce = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), this.materials.warmWindow);
      sconce.position.set(xOffset, 2.85, 3.92);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.08), this.materials.masterBronze);
      plate.position.set(xOffset, 2.85, 3.98);
      shell.add(plate, sconce);
      if (!this.performanceMode) {
        const light = new THREE.PointLight(0xffb65d, 0.22, 7, 2);
        light.position.set(origin.x + xOffset * Math.cos(origin.yaw), groundY + 3.1, origin.z + 3.7);
        this.scene.add(light);
      }
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.45, 0.08), index % 2 ? this.materials.masterBlue : this.materials.banner);
      banner.position.set(xOffset, 1.85, 3.86);
      const bannerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.09), this.materials.targetGold);
      bannerTrim.position.set(xOffset, 2.62, 3.84);
      shell.add(banner, bannerTrim);
    });

    shell.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.landmark = "hall-of-arrows-interior";
      }
    });
    this.scene.add(shell);
  }

  addHallOfArrowsMasterpieceDetails(origin, groundY) {
    const hallDetails = new THREE.Group();
    hallDetails.position.set(origin.x, groundY, origin.z);
    hallDetails.rotation.y = origin.yaw;

    const rearBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 8.8, 8), this.materials.barkDark);
    rearBeam.position.set(0, 3.1, 2.85);
    rearBeam.rotation.x = Math.PI / 2;
    rearBeam.castShadow = true;
    hallDetails.add(rearBeam);

    [-1, 1].forEach((side) => {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.18, 2.6), this.materials.masterMarble);
      stair.position.set(side * 2.25, 0.88, 1.55);
      stair.rotation.z = side * 0.08;
      stair.castShadow = true;
      stair.receiveShadow = true;
      hallDetails.add(stair);

      const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.78), this.materials.warmTrim);
      balcony.position.set(side * 2.8, 2.35, 1.95);
      balcony.rotation.z = side * -0.02;
      balcony.castShadow = true;
      balcony.receiveShadow = true;
      hallDetails.add(balcony);

      const statue = this.createMasterArcherStatue(0.9);
      statue.position.set(side * 4.15, 0.72, 1.2);
      statue.rotation.y = side * -0.32;
      hallDetails.add(statue);

      const tallBanner = new THREE.Mesh(new THREE.BoxGeometry(0.58, 2.05, 0.08), this.materials.banner);
      tallBanner.position.set(side * 4.55, 2.7, -0.85);
      tallBanner.castShadow = true;
      const symbol = this.createGuildSymbol(0.48);
      symbol.position.set(side * 4.56, 2.84, -0.91);
      symbol.rotation.y = Math.PI / 2;
      symbol.scale.x = side;
      hallDetails.add(tallBanner, symbol);
    });

    const hearth = new THREE.Group();
    hearth.position.set(0, 0.82, 2.85);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.32, 12), this.materials.masterBronze);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.92, 7), this.materials.warmWindow);
    flame.position.y = 0.52;
    hearth.add(basin, flame);
    hallDetails.add(hearth);

    const hallLight = new THREE.PointLight(0xffb65d, 0.82, 12, 2);
    hallLight.position.set(origin.x, groundY + 1.7, origin.z + 2.3);
    this.scene.add(hallLight);

    const ceremonialBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 10.8, 9), this.materials.cutWood);
    ceremonialBeam.position.set(0, 4.15, 0.1);
    ceremonialBeam.rotation.x = Math.PI / 2;
    ceremonialBeam.castShadow = true;
    hallDetails.add(ceremonialBeam);

    [-1, 1].forEach((side) => {
      const recordDesk = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 0.72), this.materials.cutWood);
      recordDesk.position.set(side * 3.65, 0.82, 2.72);
      recordDesk.rotation.y = side * -0.18;
      const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.42), this.materials.parchment);
      ledger.position.set(side * 3.65, 0.96, 2.72);
      ledger.rotation.y = side * -0.18;
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8), this.materials.warmWindow);
      candle.position.set(side * 3.2, 1.02, 2.46);
      hallDetails.add(recordDesk, ledger, candle);

      const arrowRack = new THREE.Group();
      arrowRack.position.set(side * 4.58, 1.28, 0.18);
      arrowRack.rotation.y = side * -0.08;
      const rackBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.9), this.materials.barkDark);
      arrowRack.add(rackBack);
      for (let index = 0; index < 5; index += 1) {
        const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.86, 5), index % 2 ? this.materials.targetGold : this.materials.rope);
        arrow.position.set(0.08, -0.46 + index * 0.22, -0.3 + index * 0.15);
        arrow.rotation.x = Math.PI / 2;
        arrowRack.add(arrow);
      }
      hallDetails.add(arrowRack);
    });

    [-1, 1].forEach((side) => {
      for (let index = 0; index < 4; index += 1) {
        const pillar = new THREE.Group();
        pillar.position.set(side * (1.45 + index * 1.08), 1.65, -1.85 + index * 0.92);
        pillar.rotation.z = side * (0.012 + index * 0.006);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.25, 10), this.materials.masterMarble);
        shaft.position.y = 1.6;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.18, 10), this.materials.masterBronze);
        cap.position.y = 3.28;
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.18, 10), this.materials.masterBronze);
        plinth.position.y = -0.06;
        pillar.add(shaft, cap, plinth);
        pillar.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        hallDetails.add(pillar);
      }

      const balconyRail = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 0.14), this.materials.barkDark);
      balconyRail.position.set(side * 2.75, 2.72, 2.34);
      balconyRail.rotation.z = side * -0.02;
      balconyRail.castShadow = true;
      hallDetails.add(balconyRail);
    });

    const masterCrest = this.createGuildSymbol(1.85, { gold: this.materials.masterBronze, dark: this.materials.banner });
    masterCrest.position.set(0, 3.52, -2.82);
    masterCrest.rotation.y = Math.PI;
    hallDetails.add(masterCrest);

    this.scene.add(hallDetails);
    this.addLegendaryBowDisplays(origin, groundY);
  }

  createMasterArcherStatue(scale = 1) {
    const statue = new THREE.Group();
    const stone = this.materials.masterMarble;
    const bronze = this.materials.masterBronze;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.56 * scale, 0.28 * scale, 9), stone);
    base.position.y = 0.14 * scale;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18 * scale, 0.76 * scale, 7, 12), stone);
    body.position.y = 0.76 * scale;
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.21 * scale, 12, 8), stone);
    hood.position.y = 1.3 * scale;
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.42 * scale, 0.018 * scale, 7, 28, Math.PI * 1.35), bronze);
    bow.position.set(0.34 * scale, 0.92 * scale, 0.02);
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * scale, 0.012 * scale, 0.9 * scale, 6), bronze);
    arrow.position.set(0.2 * scale, 0.96 * scale, 0.02);
    arrow.rotation.z = Math.PI / 2;
    statue.add(base, body, hood, bow, arrow);
    statue.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return statue;
  }

  addLegendaryBowDisplays(origin, groundY) {
    const displays = [
      { id: "stormcaller", name: "Stormcaller", local: [-4.2, -3.3], yaw: 0.18 },
      { id: "whisperbranch", name: "Whisperbranch", local: [-2.55, -3.75], yaw: 0.08 },
      { id: "windrunner", name: "Windrunner", local: [-0.85, -3.95], yaw: 0.02 },
      { id: "kingmaker", name: "Kingmaker", local: [0.85, -3.95], yaw: -0.02 },
      { id: "voidstar", name: "Voidstar", local: [2.55, -3.75], yaw: -0.08 },
      { id: "starpiercer", name: "Starpiercer", local: [4.2, -3.3], yaw: -0.18 },
    ];

    displays.forEach((display, index) => {
      const point = this.localToWorldPoint(origin, display.local[0], display.local[1]);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const group = new THREE.Group();
      group.position.set(point.x, y + 0.18, point.z);
      group.rotation.y = origin.yaw + display.yaw;
      const visual = getBowVisual(display.id);
      const displayMaterial = new THREE.MeshStandardMaterial({
        color: visual.limb,
        roughness: 0.38,
        metalness: 0.08,
        emissive: visual.limb,
        emissiveIntensity: 0.12,
      });
      const accentMaterial = new THREE.MeshStandardMaterial({
        color: visual.accent,
        roughness: 0.32,
        metalness: 0.16,
        emissive: visual.accent,
        emissiveIntensity: 0.24,
      });
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 0.36, 9), this.materials.masterMarble);
      plinth.position.y = 0.18;
      const bowRig = new THREE.Group();
      bowRig.position.y = 0.98;
      bowRig.rotation.z = index % 2 ? 0.08 : -0.08;
      bowRig.scale.set(0.95, visual.scale, 0.95);
      const upperLimb = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.54, 6, 10), displayMaterial);
      upperLimb.position.y = 0.24;
      upperLimb.rotation.z = -0.12 - visual.curve * 0.28;
      const lowerLimb = upperLimb.clone();
      lowerLimb.position.y = -0.24;
      lowerLimb.rotation.z = 0.12 + visual.curve * 0.28;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), this.materials.rope);
      grip.rotation.x = Math.PI / 2;
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.9, 5), this.materials.rope);
      string.position.x = 0.08 + visual.curve * 0.18;
      [-1, 1].forEach((side) => {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), accentMaterial);
        tip.position.set(side * 0.055, side * 0.55, 0);
        tip.rotation.z = side > 0 ? -0.72 : Math.PI + 0.72;
        bowRig.add(tip);
      });
      const motif = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), accentMaterial);
      motif.position.set(0.02, 0, 0.04);
      bowRig.add(upperLimb, lowerLimb, grip, string, motif);
      const namePlate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.06), this.materials.targetGold);
      namePlate.position.set(0, 0.46, -0.43);
      group.add(plinth, bowRig, namePlate);
      group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(group);
      this.interactables.push({
        id: `legendary-display-${display.name.toLowerCase()}`,
        type: "lore-note",
        name: `${display.name} Display`,
        prompt: "E Inspect display",
        position: new THREE.Vector3(point.x, y + 1.0, point.z),
        radius: 2.0,
        text: `${display.name} has a place in the Hall of Arrows. Earned legendary bows should feel like permanent history here.`,
      });
    });
  }

  addMasterTrialTargets() {
    const precision = [
      [-91, 63, 0.58, 0.42, 1.2, { axis: "x", amplitude: 1.8, speed: 0.9 }],
      [-99, 68, 0.48, 0.38, 2.1, { axis: "y", amplitude: 0.72, speed: 1.15 }],
      [-105, 58, 0.74, 0.36, 2.8, { axis: "x", amplitude: 2.4, speed: 0.72 }],
    ];
    precision.forEach(([x, z, yaw, scale, yOffset, motion]) => this.addTarget(x, z, yaw, scale, {
      challengeId: "masterPrecision",
      challengeLabel: "Trial of Precision",
      yOffset,
      motion,
      masterTrial: "precision",
    }));

    const mastery = [
      [-86, 34, 1.05, 0.34, 1.35],
      [-78, 31, 0.78, 0.34, 1.9],
      [-70, 33, 0.48, 0.34, 1.45],
    ];
    mastery.forEach(([x, z, yaw, scale, yOffset]) => this.addTarget(x, z, yaw, scale, {
      challengeId: "masterWeakpoints",
      challengeLabel: "Trial of Mastery",
      yOffset,
      motion: { axis: "y", amplitude: 0.36, speed: 1.35 },
      masterTrial: "mastery",
    }));

    const champion = [
      [-92, 49, 0.72, 0.36, 1.7],
      [-84, 62, 0.38, 0.34, 2.35],
      [-67, 61, -0.35, 0.36, 1.5],
      [-60, 47, -0.72, 0.34, 2.05],
      [-73, 35, 0.05, 0.32, 2.8],
    ];
    champion.forEach(([x, z, yaw, scale, yOffset], index) => this.addTarget(x, z, yaw, scale, {
      challengeId: "masterChampion",
      challengeLabel: "Trial of the Champion",
      yOffset,
      motion: { axis: index % 2 ? "y" : "x", amplitude: index % 2 ? 0.5 : 1.4, speed: 0.8 + index * 0.12 },
      masterTrial: "champion",
    }));
  }

  addMasterTrialInteractables() {
    const origin = this.hallOfArrows;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const lectern = new THREE.Group();
    lectern.position.set(origin.x, y + 0.76, origin.z - 1.2);
    lectern.rotation.y = origin.yaw;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.72, 7), this.materials.masterBronze);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.5), this.materials.parchment);
    book.position.y = 0.42;
    book.rotation.x = -0.18;
    lectern.add(stand, book);
    this.scene.add(lectern);
    this.interactables.push({
      id: "master-archer-trial-lectern",
      type: "master-trials-console",
      name: "Hall of Arrows",
      prompt: "E Begin trials",
      position: new THREE.Vector3(origin.x, y + 0.9, origin.z - 1.2),
      radius: 3.2,
      group: lectern,
      text: "The five Master Archer Trials are ready. Precision, exploration, survival, mastery, and champion.",
    });

    this.addLegendaryHint(origin.x + 4.2, origin.z + 3.6, "Frontier Map Fragment", "A sealed map marks lands beyond Arc 1. The guild will speak of it after the trials.");
    this.addRareLootCache(origin.x - 5.2, origin.z + 4.8, "Master Trial Seal", "epic", "A prestige seal used by the Hall of Arrows to record champion attempts.");
  }

  addMountainFortressMasterpiece() {
    this.mountainFortress = { x: -92, z: 74, yaw: -0.28, scale: 1 };
    const origin = this.mountainFortress;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;

    const cliff = new THREE.Group();
    const cliffShapes = [
      [0, 2.8, -0.2, 11.8, 8.8, 4.35, 0.02],
      [-5.2, 2.1, 1.05, 5.4, 6.3, 3.9, -0.08],
      [5.15, 2.35, 0.8, 5.7, 6.95, 3.55, 0.1],
      [-1.6, 4.82, -1.55, 8.0, 4.55, 2.45, 0.04],
      [2.8, 4.0, -2.05, 5.2, 4.85, 2.1, -0.05],
    ];
    cliffShapes.forEach(([x, pieceY, z, width, height, depth, roll], index) => {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), index % 2 ? this.materials.darkStone : this.materials.ancientStone);
      stone.position.set(x, pieceY, z);
      stone.scale.set(width * 0.5, height * 0.5, depth * 0.5);
      stone.rotation.set(0.08 + index * 0.04, index * 0.36, roll);
      stone.castShadow = true;
      stone.receiveShadow = true;
      cliff.add(stone);
    });
    group.add(cliff);

    const keep = new THREE.Group();
    keep.position.set(0, 4.2, -1.35);
    const base = new THREE.Mesh(new THREE.BoxGeometry(6.7, 2.4, 2.7), this.materials.ancientStone);
    base.position.y = 0.95;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(5.15, 1.65, 2.2), this.materials.darkStone);
    upper.position.set(-0.25, 2.55, -0.08);
    const roof = this.createLayeredGableRoof(5.8, 2.35, 3.62, this.materials.barkDark, {
      pitch: 0.46,
      overhang: 0.5,
      thickness: 0.24,
      asymmetry: -0.12,
    });
    keep.add(base, upper, roof);
    [-2.4, -1.2, 0, 1.2, 2.4].forEach((xOffset, index) => {
      const verticalRib = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.28, 7), index % 2 ? this.materials.warmTrim : this.materials.barkDark);
      verticalRib.position.set(xOffset, 1.38, -1.42);
      verticalRib.castShadow = true;
      keep.add(verticalRib);
    });
    [-1.75, 1.75].forEach((xOffset) => {
      const carvedWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.08, 10), this.materials.warmWindow);
      carvedWindow.position.set(xOffset, 2.1, -1.48);
      carvedWindow.rotation.x = Math.PI / 2;
      keep.add(carvedWindow);
    });
    this.addBuildingCraftDetails(keep, 5.2, 2.2, 2.0, { trim: this.materials.warmTrim, beam: this.materials.barkDark });
    group.add(keep);

    const towerSpecs = [
      [-4.05, 4.3, -0.9, 0.82, 3.9],
      [3.8, 4.05, -0.75, 0.9, 4.6],
      [-1.0, 5.9, -1.85, 0.68, 3.4],
      [1.9, 5.55, -1.95, 0.62, 3.1],
    ];
    towerSpecs.forEach(([x, towerY, z, radius, height], index) => {
      const tower = new THREE.Group();
      tower.position.set(x, towerY, z);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius, height, 9), index % 2 ? this.materials.ancientStone : this.materials.darkStone);
      shaft.position.y = height * 0.5;
      const balcony = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 1.18, 0.22, 9), this.materials.warmTrim);
      balcony.position.y = height * 0.82;
      const roofTower = this.createLayeredGableRoof(radius * 2.2, radius * 1.7, height + 0.28, this.materials.barkDark, {
        pitch: 0.5,
        overhang: 0.22,
        asymmetry: index % 2 ? 0.08 : -0.05,
      });
      roofTower.rotation.y = index * 0.7;
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.44), this.materials.banner);
      banner.position.set(radius * 0.82, height * 0.58, -radius * 0.72);
      const symbol = this.createGuildSymbol(0.38);
      symbol.position.set(radius * 0.86, height * 0.58, -radius * 0.78);
      symbol.rotation.y = Math.PI / 2;
      symbol.scale.setScalar(0.7);
      tower.add(shaft, balcony, roofTower, banner, symbol);
      tower.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(tower);
    });

    const terraces = [
      [0, 3.25, 1.25, 7.8, 0.34, 1.55],
      [-3.2, 2.3, 2.25, 3.9, 0.26, 1.2],
      [3.0, 2.55, 2.05, 4.2, 0.26, 1.18],
    ];
    terraces.forEach(([x, terraceY, z, width, height, depth]) => {
      const terrace = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.materials.warmTrim);
      terrace.position.set(x, terraceY, z);
      terrace.castShadow = true;
      terrace.receiveShadow = true;
      group.add(terrace);
      [-0.42, 0, 0.42].forEach((offset) => {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.7, 7), this.materials.barkDark);
        beam.position.set(x + offset * width, terraceY - 1.0, z + depth * 0.44);
        beam.rotation.x = 0.18;
        beam.castShadow = true;
        group.add(beam);
      });
    });

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.18, 0.74), this.materials.cutWood);
    bridge.position.set(7.2, 2.92, 1.85);
    bridge.rotation.y = -0.16;
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    group.add(bridge);
    [-1, 1].forEach((side) => {
      const rail = bridge.clone();
      rail.geometry = new THREE.BoxGeometry(12.3, 0.08, 0.08);
      rail.position.z += side * 0.46;
      rail.position.y += 0.34;
      rail.material = this.materials.barkDark;
      group.add(rail);
    });

    this.addFortressDistantCrown(group);
    this.addFortressCliffsideAdditions(group);
    this.addFortressEntryDepth(group);
    this.addFortressBelievableFacade(group);
    this.addFortressWallConstructionDetails(group);
    this.addFortressApproachDominance(group);

    const entrance = new THREE.Group();
    entrance.position.set(0, 0.28, 5.3);
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.85, 0.38, 18), this.materials.masterMarble);
    platform.position.y = 0.19;
    const activationRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.05, 10, 48), this.materials.targetGold);
    activationRing.position.y = 0.46;
    activationRing.rotation.x = Math.PI / 2;
    const symbol = this.createGuildSymbol(1.25);
    symbol.position.y = 0.51;
    symbol.rotation.x = -Math.PI / 2;
    const platformBase = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.38, 0.24, 12), this.materials.kingdomDarkStone);
    platformBase.position.y = 0.04;
    const archLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.65, 8), this.materials.ancientStone);
    archLeft.position.set(-1.55, 1.38, -0.72);
    const archRight = archLeft.clone();
    archRight.position.x = 1.55;
    const archTop = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.17, 8, 30, Math.PI), this.materials.ancientStone);
    archTop.position.set(0, 2.7, -0.72);
    archTop.rotation.z = Math.PI;
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.22, 1.1), this.materials.warmTrim);
    threshold.position.set(0, 0.24, -1.05);
    entrance.add(platformBase, platform, activationRing, symbol, archLeft, archRight, archTop, threshold);
    entrance.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(entrance);

    this.scene.add(group);
    const worldEntrance = this.localToWorldPoint(origin, 0, 5.3);
    const entranceY = this.terrain.getHeightAt(worldEntrance.x, worldEntrance.z);
    this.interactables.push({
      id: "mountain-fortress-entrance",
      type: "legendary-platform",
      name: "Mountain Fortress Gate",
      prompt: "Stand on platform",
      position: new THREE.Vector3(worldEntrance.x, entranceY + 0.85, worldEntrance.z),
      radius: 4.4,
      lockedText: "Locked: the fortress platform hums, but the guild seal has not fully opened.",
      unlockedText: "The fortress platform wakes. The Hall of Arrows unfolds far larger than the cliff should allow.",
      destination: new THREE.Vector3(this.hallOfArrows.x, this.terrain.getHeightAt(this.hallOfArrows.x, this.hallOfArrows.z) + 0.05, this.hallOfArrows.z - 4.8),
      destinationName: "Hall of Arrows",
      unlocked: true,
    });

    this.addCollisionBox(origin.x, origin.z, 12.0, 7.2, 8.6, origin.yaw);
    this.addCollisionCylinder(worldEntrance.x, worldEntrance.z, 2.5, 0.6);
  }

  addFortressBelievableFacade(group) {
    const facade = new THREE.Group();
    facade.position.set(0, 0.2, 1.55);

    const wallRuns = [
      [-3.9, 2.55, 0.0, 2.4, 3.3, 0.42, 0.02],
      [-1.35, 2.75, -0.1, 2.7, 3.7, 0.5, -0.02],
      [1.4, 2.72, -0.05, 2.85, 3.55, 0.48, 0.03],
      [4.05, 2.52, 0.06, 2.35, 3.25, 0.42, -0.015],
    ];
    wallRuns.forEach(([x, y, z, width, height, depth, roll], index) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), index % 2 ? this.materials.kingdomDarkStone : this.materials.ancientStone);
      wall.position.set(x, y, z);
      wall.rotation.z = roll;
      facade.add(wall);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.22, depth * 1.35), this.materials.masterMarble);
      cap.position.set(x, y + height * 0.52 + 0.08, z - 0.02);
      cap.rotation.z = roll * 0.5;
      facade.add(cap);

      const merlonCount = Math.max(2, Math.round(width / 0.65));
      for (let merlon = 0; merlon < merlonCount; merlon += 1) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, depth * 1.18), this.materials.darkStone);
        block.position.set(x - width * 0.42 + (width * 0.84 * merlon) / Math.max(1, merlonCount - 1), y + height * 0.52 + 0.38, z - 0.02);
        block.rotation.z = roll * 0.4;
        facade.add(block);
      }
    });

    [-5.35, -2.65, 0, 2.7, 5.35].forEach((xOffset, index) => {
      const buttress = new THREE.Group();
      buttress.position.set(xOffset, 1.9 + (index % 2) * 0.12, 0.52);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.1, 0.72), this.materials.kingdomDarkStone);
      body.position.y = 1.55;
      body.rotation.z = xOffset * 0.004;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.44, 1.08), this.materials.darkStone);
      foot.position.y = 0.22;
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 0.38), this.materials.warmTrim);
      brace.position.set(0, 1.15, 0.42);
      brace.rotation.x = 0.32;
      buttress.add(body, foot, brace);
      facade.add(buttress);
    });

    const gateHouse = new THREE.Group();
    gateHouse.position.set(0, 0.2, 1.25);
    const gateStone = new THREE.Mesh(new THREE.BoxGeometry(3.75, 3.85, 1.08), this.materials.kingdomDarkStone);
    gateStone.position.y = 1.8;
    const gateArch = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.18, 10, 32, Math.PI), this.materials.masterMarble);
    gateArch.position.set(0, 2.68, -0.54);
    gateArch.rotation.z = Math.PI;
    const gateDark = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.25, 0.12), this.materials.caveStone);
    gateDark.position.set(0, 1.38, -0.62);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.28, 0.72), this.materials.warmTrim);
    lintel.position.set(0, 3.45, -0.2);
    const gateRoof = this.createLayeredGableRoof(4.15, 1.58, 3.92, this.materials.barkDark, {
      pitch: 0.44,
      overhang: 0.24,
      thickness: 0.16,
      shingleRows: this.performanceMode ? 1 : 2,
      asymmetry: -0.06,
    });
    [-1, 1].forEach((side) => {
      const gatePier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.4, 1.28), this.materials.darkStone);
      gatePier.position.set(side * 2.08, 1.7, -0.02);
      const pierCap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.22, 1.42), this.materials.masterMarble);
      pierCap.position.set(side * 2.08, 3.48, -0.02);
      gateHouse.add(gatePier, pierCap);
    });
    gateHouse.add(gateStone, gateArch, gateDark, lintel, gateRoof);
    facade.add(gateHouse);

    const carvedSeams = [-4.8, -3.2, -1.8, -0.55, 0.55, 1.8, 3.2, 4.8];
    carvedSeams.forEach((xOffset, index) => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.4 + (index % 3) * 0.22, 0.035), this.materials.darkStone);
      seam.position.set(xOffset, 2.42, -0.25);
      seam.rotation.z = (index % 2 ? -1 : 1) * 0.018;
      facade.add(seam);
    });

    facade.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.landmark = "mountain-fortress-facade";
      }
    });
    group.add(facade);
  }

  addFortressWallConstructionDetails(group) {
    const masonry = new THREE.Group();
    masonry.position.set(0, 0.44, 2.04);

    for (let row = 0; row < 6; row += 1) {
      const course = new THREE.Mesh(new THREE.BoxGeometry(10.6 - row * 0.34, 0.055, 0.075), row % 2 ? this.materials.kingdomDarkStone : this.materials.masterMarble);
      course.position.set(Math.sin(row) * 0.12, 1.25 + row * 0.48, -0.36);
      course.rotation.z = Math.sin(row * 1.7) * 0.012;
      masonry.add(course);
    }

    [-4.6, -3.35, -2.1, 2.1, 3.35, 4.6].forEach((xOffset, index) => {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.065), this.materials.caveStone);
      slit.position.set(xOffset, 2.38 + (index % 2) * 0.32, -0.44);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.075), this.materials.warmTrim);
      sill.position.set(xOffset, slit.position.y - 0.36, -0.46);
      masonry.add(slit, sill);
    });

    [-1, 1].forEach((side) => {
      for (let index = 0; index < 3; index += 1) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 1.36), this.materials.barkDark);
        beam.position.set(side * (2.6 + index * 1.1), 3.9 + index * 0.22, 0.24 - index * 0.12);
        beam.rotation.z = side * (0.08 + index * 0.025);
        masonry.add(beam);
      }
    });

    const cliffTie = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.24, 0.32), this.materials.darkStone);
    cliffTie.position.set(0, 0.76, -0.22);
    masonry.add(cliffTie);
    masonry.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.landmark = "mountain-fortress-construction-detail";
      }
    });
    group.add(masonry);
  }

  addFortressApproachDominance(group) {
    const approach = new THREE.Group();
    approach.position.set(0, 0.08, 6.9);

    const causeway = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 4.9), this.materials.kingdomDarkStone);
    causeway.position.set(0, 0.08, 0.9);
    const centralPath = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.06, 4.8), this.materials.visibleTrail);
    centralPath.position.set(0, 0.22, 0.86);
    const lowerStep = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 0.72), this.materials.masterMarble);
    lowerStep.position.set(0, 0.22, 3.24);
    const upperStep = lowerStep.clone();
    upperStep.scale.set(0.82, 1, 0.82);
    upperStep.position.set(0, 0.42, 2.64);
    approach.add(causeway, centralPath, lowerStep, upperStep);

    [-1, 1].forEach((side) => {
      const retaining = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.58, 4.6), this.materials.darkStone);
      retaining.position.set(side * 3.05, 0.42, 0.8);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 4.4), this.materials.warmTrim);
      rail.position.set(side * 3.05, 0.86, 0.7);
      const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.45, 6), this.materials.barkDark);
      bannerPole.position.set(side * 2.72, 1.22, 2.55);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.92, 0.055), this.materials.banner);
      banner.position.set(side * 2.72, 1.18, 2.28);
      banner.rotation.z = side * 0.04;
      approach.add(retaining, rail, bannerPole, banner);
    });

    approach.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.landmark = "mountain-fortress-approach";
      }
    });
    group.add(approach);
  }

  addFortressDistantCrown(group) {
    const mountainBack = new THREE.Group();
    mountainBack.position.set(0, 2.0, -3.8);
    const ridges = [
      [-5.6, 4.8, -0.2, 4.8, 8.8, 3.2, -0.16],
      [0.2, 5.75, -0.65, 6.8, 10.4, 3.7, 0.04],
      [5.7, 4.95, -0.05, 4.6, 8.4, 3.0, 0.18],
    ];
    ridges.forEach(([x, y, z, width, height, depth, roll], index) => {
      const ridge = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), index === 1 ? this.materials.darkStone : this.materials.ancientStone);
      ridge.position.set(x, y, z);
      ridge.scale.set(width * 0.5, height * 0.5, depth * 0.5);
      ridge.rotation.set(0.12, index * 0.38, roll);
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      mountainBack.add(ridge);
    });

    const centralSpire = new THREE.Group();
    centralSpire.position.set(0.35, 8.4, -1.2);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.35, 3.7, 10), this.materials.darkStone);
    base.position.y = 1.85;
    const crownWalk = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.62, 0.28, 10), this.materials.warmTrim);
    crownWalk.position.y = 3.32;
    const roof = this.createLayeredGableRoof(2.7, 2.1, 3.65, this.materials.barkDark, {
      pitch: 0.55,
      overhang: 0.26,
      thickness: 0.2,
      asymmetry: 0.08,
    });
    roof.rotation.y = Math.PI / 4;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), this.materials.warmWindow);
    beacon.position.y = 4.72;
    centralSpire.add(base, crownWalk, roof, beacon);

    const beaconLight = new THREE.PointLight(0xffbf6f, 0.62, 20, 2.2);
    beaconLight.position.set(0.35, 13.2, -5.0);
    group.add(beaconLight);

    [-1, 1].forEach((side) => {
      const shoulderTower = new THREE.Group();
      shoulderTower.position.set(side * 5.7, 6.55, -1.35);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.96, 3.2, 9), this.materials.ancientStone);
      shaft.position.y = 1.6;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.2, 0.25, 9), this.materials.warmTrim);
      cap.position.y = 2.96;
      const pennantPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.55, 6), this.materials.barkDark);
      pennantPole.position.set(side * 0.28, 3.78, 0);
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.62, 3), side > 0 ? this.materials.banner : this.materials.targetGold);
      pennant.position.set(side * 0.55, 3.95, 0.03);
      pennant.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      shoulderTower.add(shaft, cap, pennantPole, pennant);
      shoulderTower.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      mountainBack.add(shoulderTower);
    });

    centralSpire.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    mountainBack.add(centralSpire);
    group.add(mountainBack);
  }

  addFortressCliffsideAdditions(group) {
    const walkways = [
      [-5.2, 5.1, 0.95, 3.3, 0.22, 1.0, -0.18],
      [5.4, 5.4, 0.65, 3.6, 0.22, 0.95, 0.16],
      [0.1, 6.25, -0.65, 5.4, 0.2, 0.82, 0.02],
    ];
    walkways.forEach(([x, y, z, width, height, depth, rotation]) => {
      const terrace = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.materials.cutWood);
      terrace.position.set(x, y, z);
      terrace.rotation.y = rotation;
      terrace.castShadow = true;
      terrace.receiveShadow = true;
      group.add(terrace);

      [-0.42, 0, 0.42].forEach((offset) => {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 3.2, 7), this.materials.barkDark);
        support.position.set(x + offset * width, y - 1.45, z + depth * 0.42);
        support.rotation.z = offset * 0.18;
        support.castShadow = true;
        group.add(support);
      });
    });

    const windows = [
      [-2.7, 5.35, 0.14], [-1.2, 5.55, -0.05], [1.15, 5.5, -0.06], [2.75, 5.28, 0.12],
      [-4.85, 3.95, 1.1], [4.8, 4.1, 0.92],
    ];
    windows.forEach(([x, y, z], index) => {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.08), index % 2 ? this.materials.warmWindow : this.materials.masterBlue);
      window.position.set(x, y, z);
      window.castShadow = false;
      group.add(window);
    });

    [-1, 1].forEach((side) => {
      const hangingBanner = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.1, 0.08), this.materials.banner);
      hangingBanner.position.set(side * 3.25, 4.38, 2.58);
      hangingBanner.rotation.z = side * 0.04;
      const guildMark = this.createGuildSymbol(0.55);
      guildMark.position.set(side * 3.25, 4.72, 2.52);
      guildMark.rotation.y = Math.PI;
      hangingBanner.castShadow = true;
      group.add(hangingBanner, guildMark);
    });
  }

  addFortressEntryDepth(group) {
    const innerPortal = new THREE.Group();
    innerPortal.position.set(0, 1.0, 4.28);
    const shadowDoor = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.45, 0.18), this.materials.caveStone);
    shadowDoor.position.set(0, 1.18, -0.1);
    const warmHall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.65, 0.08), this.materials.warmWindow);
    warmHall.position.set(0, 1.38, -0.22);
    warmHall.scale.set(0.8, 1, 1);
    const leftSconce = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), this.materials.warmWindow);
    leftSconce.position.set(-1.12, 1.5, 0.02);
    const rightSconce = leftSconce.clone();
    rightSconce.position.x = 1.12;
    const stairHint = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.12, 0.48), this.materials.masterMarble);
    stairHint.position.set(0, 0.38, 0.38);
    stairHint.rotation.x = -0.18;
    innerPortal.add(shadowDoor, warmHall, leftSconce, rightSconce, stairHint);
    innerPortal.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(innerPortal);
  }

  addFortressLifeDetails(origin, groundY) {
    const people = [
      [-4.9, 2.8, 0.65, "trainer"],
      [-2.1, 5.6, 0.15, "guard"],
      [2.8, 5.2, -0.3, "worker"],
      [5.7, 2.2, -0.62, "guard"],
      [0.8, 6.05, 0.35, "archer"],
    ];
    people.forEach(([localX, localZ, yaw, role]) => {
      const point = this.localToWorldPoint(origin, localX, localZ);
      const person = this.createFortressGuildMember(role);
      person.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.05, point.z);
      person.rotation.y = origin.yaw + yaw;
      this.scene.add(person);
    });

    const trainingPoint = this.localToWorldPoint(origin, -6.8, 6.9);
    this.addTarget(trainingPoint.x, trainingPoint.z, origin.yaw + 0.82, 0.42, {
      challengeId: "fortressTraining",
      challengeLabel: "Fortress Training Mark",
      yOffset: 1.25,
    });

    const serviceLight = new THREE.PointLight(0xffb65d, 0.54, 13, 2);
    serviceLight.position.set(origin.x - 2.3, groundY + 4.3, origin.z + 1.8);
    this.scene.add(serviceLight);
  }

  createFortressGuildMember(role = "archer") {
    const group = new THREE.Group();
    const cloakMaterial = role === "worker" ? this.materials.cutWood : role === "guard" ? this.materials.banner : this.materials.masterBlue;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.74, 5, 9), cloakMaterial);
    body.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), this.materials.parchment);
    head.position.y = 1.36;
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 8), this.materials.barkDark);
    hood.position.y = 1.52;
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.016, 6, 24, Math.PI * 1.36), this.materials.rope);
    bow.position.set(0.28, 0.96, 0.03);
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, role === "worker" ? 0.6 : 0.78, 5), role === "worker" ? this.materials.cutWood : this.materials.targetGold);
    tool.position.set(-0.18, 0.88, 0.03);
    tool.rotation.z = role === "worker" ? 0.3 : Math.PI / 2;
    group.add(body, head, hood, bow, tool);
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return group;
  }

  addFortressServiceInteractables(origin, groundY) {
    const services = [
      {
        id: "fortress-guild-records",
        name: "Guild Records",
        local: [-3.8, 5.15],
        text: "Fortress records track Master Archer titles, legendary bow discoveries, and frontier reports for future guild ranks.",
      },
      {
        id: "fortress-bowyer-alcove",
        name: "Fortress Bowyer Alcove",
        local: [3.95, 4.95],
        text: "Seasoned bowyers tune strings here before trials. Future bow upgrades can plug into this alcove without moving the fortress.",
      },
      {
        id: "fortress-map-balcony",
        name: "Strategic Map Balcony",
        local: [0.15, 7.25],
        text: "A high balcony overlooks the guild routes. It is a natural home for future region maps, hunts, and post-Arc-1 missions.",
      },
    ];

    services.forEach((service) => {
      const point = this.localToWorldPoint(origin, service.local[0], service.local[1]);
      this.interactables.push({
        id: service.id,
        type: "lore-note",
        name: service.name,
        prompt: "E Inspect service",
        position: new THREE.Vector3(point.x, this.terrain.getHeightAt(point.x, point.z) + 1.0, point.z),
        radius: 3.4,
        text: service.text,
      });
    });

    const plaquePoint = this.localToWorldPoint(origin, 0, 3.95);
    const plaqueY = this.terrain.getHeightAt(plaquePoint.x, plaquePoint.z);
    const plaque = new THREE.Group();
    plaque.position.set(plaquePoint.x, plaqueY + 0.85, plaquePoint.z);
    plaque.rotation.y = origin.yaw;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.68, 0.08), this.materials.masterBronze);
    const mark = this.createGuildSymbol(0.62);
    mark.position.z = -0.06;
    plaque.add(back, mark);
    plaque.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(plaque);

    this.interactables.push({
      id: "fortress-master-archer-plaque",
      type: "lore-note",
      name: "Master Archer Plaque",
      prompt: "E Inspect plaque",
      position: new THREE.Vector3(plaquePoint.x, plaqueY + 1.2, plaquePoint.z),
      radius: 3,
      text: "A blank bronze plate waits for every archer who earns the title. After the trials, this is where the fortress remembers you.",
    });
  }

  addDefensiveArchitectureMasterpiecePass() {
    const structures = [
      { origin: this.watchtower, name: "Old Watchtower", style: "forest", footprint: [4.8, 4.2], height: 3.3, wall: this.materials.agedWood, tower: this.materials.barkDark, roof: this.materials.bark },
      { origin: this.frozenWatchtower, name: "Frozen Watchtower", style: "frost", footprint: [5.2, 4.5], height: 3.6, wall: this.materials.frostRock, tower: this.materials.packedSnow, roof: this.materials.blueIce },
      { origin: this.mosswatchTower, name: "Mosswatch Tower", style: "marsh", footprint: [5.3, 4.4], height: 3.4, wall: this.materials.blackwaterWood, tower: this.materials.sunkenStone, roof: this.materials.hangingMoss },
      { origin: this.watchersTower, name: "Watcher's Tower", style: "kingdom", footprint: [6.0, 4.8], height: 4.2, wall: this.materials.kingdomStone, tower: this.materials.kingdomDarkStone, roof: this.materials.kingdomGold },
      { origin: this.stormwatchFortress, name: "Stormwatch Fortress", style: "coast", footprint: [8.8, 7.2], height: 4.4, wall: this.materials.kingdomStone, tower: this.materials.kingdomDarkStone, roof: this.materials.weatheredDock },
      { origin: this.drownedCitadel, name: "Drowned Citadel", style: "coast-ruin", footprint: [8.4, 7.8], height: 3.8, wall: this.materials.sunkenStone, tower: this.materials.kingdomStone, roof: this.materials.seaWater },
      { origin: this.obsidianCitadel, name: "Obsidian Citadel", style: "ashen", footprint: [8.0, 6.4], height: 5.0, wall: this.materials.obsidian, tower: this.materials.ashStone, roof: this.materials.lavaGlow },
      { origin: this.firewatchSpire, name: "Firewatch Spire", style: "ashen-spire", footprint: [5.8, 5.0], height: 6.2, wall: this.materials.emberRock, tower: this.materials.obsidian, roof: this.materials.lavaGlow },
      { origin: this.moonspireRidge, name: "Moonspire Ridge", style: "celestial", footprint: [6.2, 5.4], height: 6.4, wall: this.materials.astralStone, tower: this.materials.celestialStone, roof: this.materials.starCrystal },
      { origin: this.mountainFortress, name: "Mountain Fortress", style: "mountain", footprint: [14.5, 9.6], height: 7.2, wall: this.materials.kingdomDarkStone, tower: this.materials.ancientStone, roof: this.materials.cutWood },
    ];

    structures
      .filter((item) => item.origin)
      .forEach((item, index) => this.addDefensiveArchitectureOverlay(item, index));
  }

  addDefensiveArchitectureOverlay(config, index = 0) {
    const { origin, name, style, footprint, height, wall, tower, roof } = config;
    const [width, depth] = footprint;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y + 0.035, origin.z);
    group.rotation.y = origin.yaw ?? 0;
    group.userData.landmark = `${name}-defensive-masterpiece`;

    this.addDefensiveTerrainSeat(group, width, depth, style, wall);
    this.addDefensiveCurtainWalls(group, width, depth, height, wall, tower, style);
    this.addDefensiveGatehouse(group, width, depth, height, wall, tower, roof, style);
    this.addDefensiveCornerTowers(group, width, depth, height, tower, roof, style);
    this.addDefensiveBridgeAndSupports(group, width, depth, height, wall, tower, roof, style);

    const bannerCount = style === "mountain" ? 4 : 2;
    for (let bannerIndex = 0; bannerIndex < bannerCount; bannerIndex += 1) {
      const side = bannerIndex % 2 ? 1 : -1;
      const row = Math.floor(bannerIndex / 2);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.1 + row * 0.24, 0.06), style === "ashen" || style === "ashen-spire" ? this.materials.marketAwningRed : this.materials.banner);
      banner.position.set(side * (width * 0.28 + row * 0.8), height * 0.72, -depth * 0.55 - 0.12);
      banner.rotation.z = side * 0.035;
      group.add(banner);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.landmark = `${name}-defensive-masterpiece`;
      }
    });

    if (style === "mountain") {
      group.scale.set(1.05, 1.08, 1.02);
    } else if (style.includes("spire")) {
      group.scale.set(0.9, 1.12, 0.9);
    } else if (style.includes("ruin")) {
      group.scale.set(1.02, 0.95, 1.04);
    }

    this.scene.add(group);
  }

  addDefensiveTerrainSeat(group, width, depth, style, material) {
    const seatMaterial = style === "coast" || style === "coast-ruin" ? this.materials.cliffStone
      : style === "frost" ? this.materials.packedSnow
        : style === "ashen" || style === "ashen-spire" ? this.materials.ashField
          : style === "marsh" ? this.materials.swampMud
            : this.materials.mossStone;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(width * 1.08, 0.2, depth * 1.08), seatMaterial ?? material);
    seat.position.y = 0.1;
    seat.rotation.y = style === "mountain" ? -0.015 : Math.sin(width + depth) * 0.02;
    const lowerSeat = new THREE.Mesh(new THREE.BoxGeometry(width * 1.2, 0.16, depth * 1.18), material);
    lowerSeat.position.y = 0.0;
    lowerSeat.rotation.y = -seat.rotation.y * 0.6;
    group.add(lowerSeat, seat);

    [-0.34, 0.34].forEach((offset, index) => {
      const retainingWall = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.32, 0.24), material);
      retainingWall.position.set(0, 0.33, offset * depth * 1.04);
      retainingWall.rotation.y = Math.sin(index + width) * 0.025;
      group.add(retainingWall);
    });

    [-1, 1].forEach((side) => {
      const sideRetainer = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, depth * 0.88), material);
      sideRetainer.position.set(side * width * 0.55, 0.31, 0);
      sideRetainer.rotation.y = side * 0.025;
      group.add(sideRetainer);
    });
  }

  addDefensiveCurtainWalls(group, width, depth, height, wallMaterial, trimMaterial, style) {
    const wallHeight = height * (style === "mountain" ? 0.54 : 0.42);
    const wallThickness = style === "mountain" ? 0.48 : 0.34;
    const front = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), wallMaterial);
    front.position.set(0, wallHeight * 0.5 + 0.22, -depth * 0.5);
    const rear = front.clone();
    rear.position.z = depth * 0.5;
    rear.scale.x = 0.92;
    const left = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight * 0.92, depth), wallMaterial);
    left.position.set(-width * 0.5, wallHeight * 0.48 + 0.24, 0);
    const right = left.clone();
    right.position.x = width * 0.5;
    group.add(front, rear, left, right);

    for (let row = 0; row < 3; row += 1) {
      const frontCourse = new THREE.Mesh(new THREE.BoxGeometry(width * (0.96 - row * 0.035), 0.055, wallThickness * 1.12), trimMaterial);
      frontCourse.position.set(0, 0.74 + row * wallHeight * 0.28, -depth * 0.5 - wallThickness * 0.03);
      const rearCourse = frontCourse.clone();
      rearCourse.position.z = depth * 0.5 + wallThickness * 0.03;
      rearCourse.scale.x = 0.9;
      group.add(frontCourse, rearCourse);
    }

    [-1, 1].forEach((side) => {
      for (let index = 0; index < 3; index += 1) {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.38, 0.08), this.materials.caveStone);
        slit.position.set(side * (-width * 0.24 + index * width * 0.24), wallHeight * 0.62 + 0.42, -depth * 0.5 - wallThickness * 0.62);
        group.add(slit);
      }
    });

    const merlonRows = [
      { z: -depth * 0.5 - wallThickness * 0.18, width: width * 0.92 },
      { z: depth * 0.5 + wallThickness * 0.18, width: width * 0.78 },
    ];
    merlonRows.forEach((row, rowIndex) => {
      const count = Math.max(4, Math.round(row.width / 0.8));
      for (let merlon = 0; merlon < count; merlon += 1) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, wallThickness * 1.25), trimMaterial);
        block.position.set(-row.width * 0.5 + (row.width * merlon) / Math.max(1, count - 1), wallHeight + 0.56, row.z);
        block.rotation.z = Math.sin(merlon + rowIndex) * 0.012;
        group.add(block);
      }
    });

    [-1, 1].forEach((side) => {
      const count = Math.max(3, Math.round(depth / 1.1));
      for (let merlon = 0; merlon < count; merlon += 1) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(wallThickness * 1.15, 0.3, 0.26), trimMaterial);
        block.position.set(side * (width * 0.5 + wallThickness * 0.14), wallHeight + 0.48, -depth * 0.38 + (depth * 0.76 * merlon) / Math.max(1, count - 1));
        group.add(block);
      }
    });
  }

  addDefensiveGatehouse(group, width, depth, height, wallMaterial, trimMaterial, roofMaterial, style) {
    const gate = new THREE.Group();
    gate.position.set(0, 0.18, -depth * 0.58);
    const gateWidth = Math.min(width * 0.44, style === "mountain" ? 5.8 : 3.6);
    const gateHeight = height * (style === "mountain" ? 0.72 : 0.58);
    const body = new THREE.Mesh(new THREE.BoxGeometry(gateWidth, gateHeight, 1.02), wallMaterial);
    body.position.y = gateHeight * 0.5;
    const archDark = new THREE.Mesh(new THREE.BoxGeometry(gateWidth * 0.42, gateHeight * 0.56, 0.12), this.materials.caveStone);
    archDark.position.set(0, gateHeight * 0.36, -0.56);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(gateWidth * 1.14, 0.26, 0.9), trimMaterial);
    lintel.position.set(0, gateHeight * 0.88, -0.12);
    const crest = this.createGuildSymbol(style === "mountain" ? 0.82 : 0.48, { gold: this.materials.targetGold, dark: this.materials.banner });
    crest.position.set(0, gateHeight * 0.7, -0.62);
    crest.rotation.y = Math.PI;
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(gateWidth * 0.92, 0.16, 1.24), trimMaterial);
    threshold.position.set(0, 0.08, -0.08);
    gate.add(body, archDark, lintel, crest, threshold);

    [-1, 1].forEach((side) => {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.34, gateHeight * 0.84, 1.18), trimMaterial);
      buttress.position.set(side * gateWidth * 0.54, gateHeight * 0.42, -0.02);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 1.26), wallMaterial);
      cap.position.set(side * gateWidth * 0.54, gateHeight * 0.86, -0.02);
      gate.add(buttress, cap);
    });

    const barCount = style === "mountain" ? 7 : 5;
    for (let index = 0; index < barCount; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, gateHeight * 0.46, 0.055), this.materials.barkDark);
      bar.position.set(-gateWidth * 0.18 + (gateWidth * 0.36 * index) / Math.max(1, barCount - 1), gateHeight * 0.32, -0.66);
      gate.add(bar);
    }

    if (!style.includes("ruin")) {
      const roof = this.createLayeredGableRoof(gateWidth * 1.12, 1.32, gateHeight + 0.18, roofMaterial, {
        pitch: style === "frost" ? 0.58 : 0.42,
        overhang: 0.2,
        thickness: 0.12,
        asymmetry: style === "forest" ? 0.08 : -0.04,
        shingleRows: this.performanceMode ? 1 : 2,
      });
      gate.add(roof);
    }

    group.add(gate);
  }

  addDefensiveCornerTowers(group, width, depth, height, towerMaterial, roofMaterial, style) {
    const towerHeight = height * (style === "mountain" ? 0.95 : style.includes("spire") ? 1.18 : 0.72);
    const radius = Math.max(0.34, Math.min(0.9, width * 0.095));
    const positions = [
      [-width * 0.48, -depth * 0.47],
      [width * 0.48, -depth * 0.47],
      [-width * 0.45, depth * 0.45],
      [width * 0.45, depth * 0.45],
    ];
    positions.forEach(([x, z], towerIndex) => {
      const tower = new THREE.Group();
      tower.position.set(x, 0.18, z);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius, towerHeight, 9), towerMaterial);
      shaft.position.y = towerHeight * 0.5;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.12, radius * 1.22, 0.22, 9), this.materials.warmTrim);
      ring.position.y = towerHeight * 0.86;
      tower.add(shaft, ring);

      const ribCount = style === "mountain" ? 6 : 4;
      for (let rib = 0; rib < ribCount; rib += 1) {
        const angle = (rib / ribCount) * Math.PI * 2;
        const verticalRib = new THREE.Mesh(new THREE.BoxGeometry(0.08, towerHeight * 0.78, 0.08), this.materials.darkStone);
        verticalRib.position.set(Math.sin(angle) * radius * 0.78, towerHeight * 0.46, Math.cos(angle) * radius * 0.78);
        verticalRib.rotation.y = angle;
        tower.add(verticalRib);
      }

      const merlonCount = 5;
      for (let merlon = 0; merlon < merlonCount; merlon += 1) {
        const angle = (merlon / merlonCount) * Math.PI * 2;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.18), towerMaterial);
        block.position.set(Math.sin(angle) * radius * 0.9, towerHeight + 0.24, Math.cos(angle) * radius * 0.9);
        block.rotation.y = angle;
        tower.add(block);
      }

      if (!style.includes("ruin")) {
        const roof = this.createLayeredGableRoof(radius * 2.25, radius * 1.8, towerHeight + 0.48, roofMaterial, {
          pitch: style === "frost" ? 0.62 : style === "marsh" ? 0.34 : 0.46,
          overhang: 0.14,
          thickness: 0.08,
          asymmetry: towerIndex % 2 ? 0.05 : -0.04,
          shingleRows: 1,
        });
        roof.rotation.y = towerIndex * 0.7;
        tower.add(roof);
      }

      const window = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.045), style === "ashen" || style === "ashen-spire" ? this.materials.lavaGlow : this.materials.warmWindow);
      window.position.set(0, towerHeight * 0.54, -radius * 0.82);
      const lowerSlit = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.05), this.materials.caveStone);
      lowerSlit.position.set(0, towerHeight * 0.28, -radius * 0.86);
      tower.add(window, lowerSlit);
      group.add(tower);
    });
  }

  addDefensiveBridgeAndSupports(group, width, depth, height, wallMaterial, trimMaterial, roofMaterial, style) {
    const bridgeLength = Math.max(3.2, width * 0.62);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(bridgeLength, 0.16, 0.72), style === "coast" || style === "marsh" ? this.materials.weatheredDock : this.materials.cutWood);
    bridge.position.set(0, 0.62, -depth * 0.82);
    bridge.rotation.y = style === "mountain" ? -0.05 : Math.sin(width + depth) * 0.08;
    group.add(bridge);

    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bridgeLength, 0.08, 0.08), trimMaterial);
      rail.position.set(0, 0.94, -depth * 0.82 + side * 0.42);
      rail.rotation.y = bridge.rotation.y;
      group.add(rail);
    });

    const supportCount = style === "mountain" ? 5 : 3;
    for (let support = 0; support < supportCount; support += 1) {
      const x = -bridgeLength * 0.42 + (bridgeLength * 0.84 * support) / Math.max(1, supportCount - 1);
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 1.5 + (support % 2) * 0.28, 7), trimMaterial);
      brace.position.set(x, 0.0, -depth * 0.78);
      brace.rotation.z = (support % 2 ? -1 : 1) * 0.26;
      group.add(brace);
    }

    if (style === "mountain") {
      const terrace = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.22, 1.24), this.materials.cutWood);
      terrace.position.set(0, height * 0.62, depth * 0.18);
      const rearRail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.1, 0.12), this.materials.barkDark);
      rearRail.position.set(0, height * 0.82, depth * 0.72);
      const underBrace = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.16, 0.16), trimMaterial);
      underBrace.position.set(0, height * 0.52, depth * 0.58);
      group.add(terrace, rearRail, underBrace);
    }
  }

  addLegendaryBossStructures() {
    const structures = [
      {
        id: "barkhide-stalker",
        name: "Barkhide Stalker Hollow",
        position: [-25.8, 14.2],
        material: this.materials.mossStone,
        glow: this.materials.glowPlant,
        event: "echo-archer:barkhide-stalker-ready",
        locked: "Locked: the hollow waits for a watchtower hunt to begin.",
      },
      {
        id: "icefang",
        name: "Icefang Den",
        position: [-110, 96],
        material: this.materials.frostRock,
        glow: this.materials.blueIce,
        event: "echo-archer:icefang-ready",
        locked: "Locked: frost seals the den until the Frostbite trail is active.",
      },
      {
        id: "stormtalon",
        name: "Stormtalon Eyrie",
        position: [116, -95],
        material: this.materials.cliffStone,
        glow: this.materials.seaFoam,
        event: "echo-archer:stormtalon-ready",
        locked: "Locked: sea wind circles the eyrie, but the hunt has not begun.",
      },
      {
        id: "root-guardian",
        name: "Root Guardian Circle",
        position: [105, 88],
        material: this.materials.elderBark,
        glow: this.materials.glowPlant,
        event: "echo-archer:root-guardian-ready",
        locked: "Locked: old roots cover the way until Mistwood's markers wake.",
      },
      {
        id: "mirejaw",
        name: "Mirejaw Sunken Seal",
        position: [-109, -91],
        material: this.materials.sunkenStone,
        glow: this.materials.witchlight,
        event: "echo-archer:mirejaw-ready",
        locked: "Locked: blackwater bubbles over the seal. The marsh quest has not opened it.",
      },
      {
        id: "stonehorn",
        name: "Stonehorn Echo Gate",
        position: [18, 130],
        material: this.materials.canyonRock,
        glow: this.materials.sunstone,
        event: "echo-archer:stonehorn-ready",
        locked: "Locked: canyon echoes answer only after the Sunpiercer clues are complete.",
      },
      {
        id: "inferno-behemoth",
        name: "Inferno Behemoth Crucible",
        position: [-146, 150],
        material: this.materials.obsidian,
        glow: this.materials.lavaGlow,
        event: "echo-archer:inferno-behemoth-ready",
        locked: "Locked: the crucible smolders, but the Infernoheart trial is dormant.",
      },
      {
        id: "astral-guardian",
        name: "Astral Guardian Relay",
        position: [166, 72],
        material: this.materials.astralStone,
        glow: this.materials.starCrystal,
        event: "echo-archer:astral-guardian-ready",
        locked: "Locked: the stars remain misaligned.",
      },
      {
        id: "ironhorn",
        name: "Ironhorn Frontier Ring",
        position: [171, -162],
        material: this.materials.frontierStone,
        glow: this.materials.frontierFlower,
        event: "echo-archer:ironhorn-ready",
        locked: "Locked: the frontier ring waits for the expedition's hunt.",
      },
      {
        id: "first-sentinel",
        name: "First Sentinel Archive Seal",
        position: [55, -150],
        material: this.materials.kingdomStone,
        glow: this.materials.archiveBlue,
        event: "echo-archer:first-sentinel-ready",
        locked: "Locked: the archive seal is silent until the ancient mechanisms align.",
      },
      {
        id: "skybound-warden",
        name: "Skybound Warden Aerie",
        position: [102, 174],
        material: this.materials.celestialStone,
        glow: this.materials.voidCrystal,
        event: "echo-archer:skybound-warden-ready",
        locked: "Locked: the First Sky has not opened this way.",
      },
      {
        id: "tidebound-warden",
        name: "Tidebound Warden Sea Gate",
        position: [-168, -162],
        material: this.materials.cliffStone,
        glow: this.materials.seaWater,
        event: "echo-archer:tidebound-warden-ready",
        locked: "Locked: the tide route is sealed.",
      },
      {
        id: "ancient-grovekeeper",
        name: "Ancient Grovekeeper Root Gate",
        position: [-52, -160],
        material: this.materials.mistStone,
        glow: this.materials.glowPlant,
        event: "echo-archer:ancient-grovekeeper-ready",
        locked: "Locked: the oldest roots will not part yet.",
      },
    ];

    structures.forEach((structure, index) => this.addLegendaryPlatformStructure(structure, index));
  }

  addLegendaryPlatformStructure(structure, index = 0) {
    const [x, z] = structure.position;
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.04, z);
    group.rotation.y = (index * 0.73) % Math.PI;

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.45, 0.32, 14), structure.material ?? this.materials.ancientStone);
    platform.position.y = 0.16;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.18, 0.08, 14), structure.glow ?? this.materials.targetGold);
    inner.position.y = 0.38;
    inner.material = (structure.glow ?? this.materials.targetGold).clone?.() ?? structure.glow ?? this.materials.targetGold;
    if (inner.material.emissiveIntensity !== undefined) {
      inner.material.emissiveIntensity = Math.max(inner.material.emissiveIntensity ?? 0, 0.22);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.055, 8, 44), this.materials.targetGold);
    ring.position.y = 0.47;
    ring.rotation.x = Math.PI / 2;
    group.add(platform, inner, ring);

    [-1, 1].forEach((side) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 8), structure.material ?? this.materials.ancientStone);
      pillar.position.set(side * 1.92, 0.98, -0.62);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.58), this.materials.masterBronze);
      cap.position.set(side * 1.92, 1.94, -0.62);
      group.add(pillar, cap);
    });

    const rearMarker = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 0.42), this.materials.warmTrim);
    rearMarker.position.set(0, 1.72, -1.95);
    const sigil = this.createGuildSymbol(0.56, { gold: this.materials.targetGold, dark: this.materials.banner });
    sigil.position.set(0, 1.9, -2.2);
    sigil.rotation.y = Math.PI;
    group.add(rearMarker, sigil);

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.legendaryStructure = structure.id;
        child.userData.landmark = true;
      }
    });
    this.scene.add(group);
    this.legendaryStructures.push({ ...structure, group, unlocked: Boolean(structure.unlocked) });
    if (structure.event) {
      window.addEventListener(structure.event, () => this.activateLegendaryStructure(structure.id));
    }

    this.interactables.push({
      id: `legendary-platform-${structure.id}`,
      type: "legendary-platform",
      name: structure.name,
      prompt: "Stand on platform",
      position: new THREE.Vector3(x, y + 0.9, z),
      radius: 3.2,
      group,
      lockedText: structure.locked ?? "Locked: this legendary structure has not awakened.",
      unlockedText: `${structure.name} opens. The arena within feels much larger than the structure outside.`,
      destinationName: structure.name,
      destination: new THREE.Vector3(x, y + 0.08, z - 3.5),
      unlocked: Boolean(structure.unlocked),
      unlockEvent: structure.event,
    });
  }

  activateLegendaryStructure(id) {
    const key = String(id ?? "").replace(/^legendary-platform-/, "");
    const structure = this.legendaryStructures.find((item) => item.id === key);
    const platform = this.interactables.find((item) => item.id === `legendary-platform-${key}`);
    if (structure) {
      structure.unlocked = true;
    }
    if (platform) {
      platform.unlocked = true;
      platform.lockedText = `${platform.name} is awake. Step onto the platform to enter.`;
    }
  }

  addWorldCompositionClearings() {
    const focalPoints = [
      { x: -92, z: 74, radius: 20 },
      { x: -94, z: 88, radius: 14 },
      { x: -18, z: 18, radius: 15 },
      { x: -38, z: 8, radius: 12 },
      { x: 18, z: 28, radius: 13 },
      { x: 0, z: 0, radius: 15 },
      { x: -25, z: 14, radius: 11 },
      { x: -110, z: 96, radius: 15 },
      { x: 116, z: -95, radius: 16 },
      { x: -109, z: -91, radius: 15 },
    ];

    this.detailObjects.forEach((object) => {
      if (!object?.position || object.userData?.important || object.userData?.target || object.userData?.landmark) {
        return;
      }
      const nearFocalPoint = focalPoints.some((point) => {
        const dx = object.position.x - point.x;
        const dz = object.position.z - point.z;
        return dx * dx + dz * dz < point.radius * point.radius;
      });
      if (nearFocalPoint) {
        object.visible = false;
      }
    });

    focalPoints.slice(0, 6).forEach((point, index) => {
      const y = this.terrain.getHeightAt(point.x, point.z);
      const clearing = new THREE.Mesh(
        new THREE.CircleGeometry(point.radius * 0.44, 28),
        this.materials.visibleTrail.clone(),
      );
      clearing.material.opacity = 0.24;
      clearing.material.depthWrite = false;
      clearing.position.set(point.x, y + 0.035 + index * 0.001, point.z);
      clearing.rotation.x = -Math.PI / 2;
      clearing.rotation.z = index * 0.47;
      clearing.receiveShadow = true;
      clearing.userData.compositionClearing = true;
      this.scene.add(clearing);
    });
  }

  addArchersLodge() {
    this.archersLodge = { x: -73, z: 62, yaw: -0.54, scale: 1 };
    const origin = this.archersLodge;
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.42, 6.2), this.materials.lodgeStone);
    foundation.position.y = 0.21;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    group.add(foundation);

    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.45, 4.35), this.materials.lodgeWall);
    mainHall.position.set(-0.85, 1.55, 0);
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    group.add(mainHall);

    const trophyWing = new THREE.Mesh(new THREE.BoxGeometry(3.65, 2.05, 3.55), this.materials.agedWood);
    trophyWing.position.set(3.0, 1.34, 0.6);
    trophyWing.rotation.y = 0.04;
    trophyWing.castShadow = true;
    trophyWing.receiveShadow = true;
    group.add(trophyWing);

    const roof = this.createLayeredGableRoof(7.2, 5.0, 3.12, this.materials.lodgeRoof, {
      pitch: 0.52,
      overhang: 0.62,
      thickness: 0.28,
      asymmetry: -0.08,
    });
    roof.position.set(-0.45, 0, 0);
    group.add(roof);

    const wingRoof = this.createLayeredGableRoof(4.1, 3.9, 2.72, this.materials.barkDark, {
      pitch: 0.46,
      overhang: 0.48,
      thickness: 0.22,
      asymmetry: 0.1,
    });
    wingRoof.position.set(3.0, 0, 0.6);
    wingRoof.rotation.y = 0.04;
    group.add(wingRoof);

    this.addBuildingCraftDetails(group, 6.2, 4.35, 2.45, {
      trim: this.materials.warmTrim,
      beam: this.materials.barkDark,
      window: this.materials.warmWindow,
    });

    const porch = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 1.35), this.materials.cutWood);
    porch.position.set(-0.85, 0.62, -3.18);
    porch.castShadow = true;
    porch.receiveShadow = true;
    group.add(porch);
    [-3.3, -1.1, 1.1, 3.3].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.62, 7), this.materials.barkDark);
      post.position.set(x, 1.32, -3.62);
      post.castShadow = true;
      group.add(post);
    });

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.75, 0.55), this.materials.darkStone);
    chimney.position.set(-3.0, 3.55, 1.34);
    chimney.rotation.z = -0.04;
    chimney.castShadow = true;
    group.add(chimney);
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), this.materials.smoke);
    smoke.position.set(-3.0, 4.64, 1.34);
    smoke.scale.set(1.0, 0.55, 0.75);
    group.add(smoke);

    this.addLodgeInterior(group);
    this.addLodgeExteriorDetails(group);
    this.addLodgeTrophyDisplays(group);

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = child.castShadow ?? true;
        child.receiveShadow = child.receiveShadow ?? true;
      }
    });
    this.scene.add(group);

    this.addCollisionBox(origin.x, origin.z, 8.8, 6.2, 3.7, origin.yaw);
    const porchPoint = this.localToWorldPoint(origin, -0.85, -3.18);
    this.addCollisionBox(porchPoint.x, porchPoint.z, 5.8, 1.35, 0.9, origin.yaw);

    this.interactables.push({
      id: "archers-lodge-entry",
      type: "lore-note",
      name: "Archer's Lodge",
      prompt: "E Enter lodge",
      position: new THREE.Vector3(porchPoint.x, this.terrain.getHeightAt(porchPoint.x, porchPoint.z) + 0.85, porchPoint.z),
      radius: 4.2,
      text: "Warm firelight, trophy plaques, and field maps make this feel like your place between adventures.",
    });

    const mapPoint = this.localToWorldPoint(origin, -1.0, -1.05);
    this.interactables.push({
      id: "archers-lodge-map-table",
      type: "lore-note",
      name: "Lodge Map Table",
      prompt: "E Study map table",
      position: new THREE.Vector3(mapPoint.x, this.terrain.getHeightAt(mapPoint.x, mapPoint.z) + 0.95, mapPoint.z),
      radius: 3.4,
      text: "Pins mark discovered regions, frontier routes, and places worth returning to. Future lodge upgrades can deepen this into a full home map room.",
    });

    const recordsPoint = this.localToWorldPoint(origin, 2.7, 1.7);
    this.interactables.push({
      id: "archers-lodge-records",
      type: "lore-note",
      name: "Expedition Records",
      prompt: "E Read records",
      position: new THREE.Vector3(recordsPoint.x, this.terrain.getHeightAt(recordsPoint.x, recordsPoint.z) + 1.0, recordsPoint.z),
      radius: 3.2,
      text: "Neat shelves hold region notes, lore copies, and sketches of legendary bows. The collection grows with your discoveries.",
    });
  }

  addLodgeInterior(group) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 5.2), this.materials.wood);
    floor.position.set(-0.2, 0.52, 0);
    group.add(floor);

    const fireplace = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.18, 0.48), this.materials.darkStone);
    fireplace.position.set(-3.7, 1.12, 1.35);
    group.add(fireplace);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 7), this.materials.lavaGlow);
    fire.position.set(-3.7, 1.28, 0.96);
    fire.rotation.y = 0.28;
    group.add(fire);

    const mapTable = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.16, 1.35), this.materials.parchment);
    mapTable.position.set(-1.0, 1.04, -1.05);
    mapTable.rotation.y = 0.08;
    group.add(mapTable);
    const tableBase = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.72, 0.85), this.materials.barkDark);
    tableBase.position.set(-1.0, 0.73, -1.05);
    tableBase.rotation.y = 0.08;
    group.add(tableBase);

    [[1.55, -1.35], [2.25, -1.25], [2.95, -1.1]].forEach(([x, z], index) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.3, 0.22), this.materials.barkDark);
      shelf.position.set(x, 1.28, z);
      shelf.rotation.y = -0.05;
      group.add(shelf);
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.16), index % 2 ? this.materials.banner : this.materials.targetRed);
      book.position.set(x + 0.03, 1.35, z - 0.16);
      book.rotation.y = -0.05;
      group.add(book);
    });

    [[-2.75, -1.85, 0.72], [-2.15, -1.9, 0.62], [0.95, 1.95, 0.7]].forEach(([x, z, width]) => {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(width, 0.46, 0.5), this.materials.hideLeather);
      chest.position.set(x, 0.82, z);
      group.add(chest);
    });

    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.5), this.materials.cutWood);
    chair.position.set(-2.45, 0.88, 1.58);
    chair.rotation.y = 0.35;
    group.add(chair);

    const readingNook = new THREE.Group();
    readingNook.position.set(2.0, 0.56, 1.35);
    const nookBench = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 0.48), this.materials.cutWood);
    nookBench.position.y = 0.18;
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.08, 0.4), this.materials.banner);
    cushion.position.y = 0.32;
    const sideLamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 9, 7), this.materials.warmWindow);
    sideLamp.position.set(0.72, 0.78, -0.2);
    readingNook.add(nookBench, cushion, sideLamp);
    group.add(readingNook);

    [-0.62, 0, 0.62].forEach((offset, index) => {
      const mapPin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.16, 6), index % 2 ? this.materials.targetRed : this.materials.targetGold);
      mapPin.position.set(-1.0 + offset, 1.16, -1.05 + Math.sin(index) * 0.26);
      mapPin.rotation.z = 0.08;
      group.add(mapPin);
    });

    const ceilingBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 6.8, 7), this.materials.barkDark);
    ceilingBeam.position.set(-0.2, 2.35, 0);
    ceilingBeam.rotation.z = Math.PI / 2;
    group.add(ceilingBeam);
  }

  addLodgeExteriorDetails(group) {
    const symbol = this.createGuildSymbol(0.82);
    symbol.position.set(-0.85, 2.1, -2.23);
    symbol.rotation.set(0, 0, 0);
    group.add(symbol);

    [[-4.2, -2.4], [4.0, -2.15], [4.9, 2.4]].forEach(([x, z], index) => {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), this.materials.warmWindow);
      lantern.position.set(x, 1.35, z);
      group.add(lantern);
      const light = new THREE.PointLight(0xffb56a, 0.45, 7);
      light.position.set(x, 1.35, z);
      group.add(light);
      if (index < 2) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), this.materials.barkDark);
        bracket.position.set(x * 0.98, 1.38, z + 0.12);
        bracket.rotation.y = index ? -0.35 : 0.35;
        group.add(bracket);
      }
    });

    [[-4.8, 3.0, 0.8], [5.1, 3.2, 0.68], [-5.1, -1.5, 0.62]].forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 ? this.materials.darkStone : this.materials.lodgeStone);
      rock.position.set(x, 0.55, z);
      rock.scale.set(scale * 1.25, scale * 0.55, scale);
      rock.rotation.set(0.14, index * 0.7, -0.08);
      group.add(rock);
    });

    [[-5.8, -2.8], [5.6, -2.6], [5.7, 3.1], [-5.6, 3.3]].forEach(([x, z]) => {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.1, 7), this.materials.barkDark);
      marker.position.set(x, 0.95, z);
      group.add(marker);
    });
  }

  addLodgeTrophyDisplays(group) {
    this.lodgeTrophyDisplays = {
      bosses: [],
      quests: [],
      loot: [],
      master: [],
    };

    const bossNames = ["Barkhide", "Icefang", "Stonehorn", "Mirejaw", "Warden"];
    bossNames.forEach((name, index) => {
      const display = this.createLodgePlaque(name, "bosses", index);
      display.position.set(-3.35 + index * 0.82, 1.85, 2.22);
      display.rotation.y = Math.PI;
      group.add(display);
    });

    ["Guild Deeds", "World Notes", "Rare Finds"].forEach((name, index) => {
      const display = this.createLodgePlaque(name, index === 2 ? "loot" : "quests", index);
      display.position.set(1.75 + index * 0.86, 1.58, 2.18);
      display.rotation.y = Math.PI;
      group.add(display);
    });

    const bowWall = new THREE.Group();
    bowWall.position.set(3.35, 1.78, -1.12);
    bowWall.rotation.y = -Math.PI / 2;
    ["Frostbite", "Stormcaller", "Sunpiercer", "Voidstar"].forEach((name, index) => {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 24, Math.PI * 1.25), this.materials.trophyInactive);
      bow.position.set(0, index * -0.24 + 0.32, 0);
      bow.rotation.z = Math.PI / 2;
      bow.userData.lodgeCategory = "loot";
      bow.userData.lodgeLabel = name;
      this.lodgeTrophyDisplays.loot.push(bow);
      bowWall.add(bow);
    });
    group.add(bowWall);

    const masterBanner = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, 0.08), this.materials.banner);
    masterBanner.position.set(0.35, 2.03, 2.24);
    masterBanner.rotation.y = Math.PI;
    masterBanner.visible = false;
    masterBanner.userData.lodgeCategory = "master";
    this.lodgeTrophyDisplays.master.push(masterBanner);
    group.add(masterBanner);
  }

  createLodgePlaque(label, category, index) {
    const group = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.08), this.materials.barkDark);
    const token = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 12), this.materials.trophyInactive);
    token.position.z = -0.06;
    token.rotation.x = Math.PI / 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.035), this.materials.trophyBronze);
    marker.position.set(0, -0.19, -0.075);
    marker.scale.x = 0.72 + index * 0.08;
    group.add(back, token, marker);
    group.userData.lodgeCategory = category;
    group.userData.lodgeLabel = label;
    this.lodgeTrophyDisplays[category]?.push(group);
    return group;
  }

  setLodgeTrophyState(state = {}) {
    if (!this.lodgeTrophyDisplays) return;
    const counts = {
      bosses: state.bossesDefeated ?? 0,
      quests: state.questsCompleted ?? 0,
      loot: state.rareLootFound ?? 0,
    };

    Object.entries(this.lodgeTrophyDisplays).forEach(([category, displays]) => {
      displays.forEach((display, index) => {
        const unlocked = category === "master"
          ? Boolean(state.masterArcher)
          : index < Math.max(0, counts[category] ?? 0);
        display.visible = category !== "master" || unlocked;
        display.traverse?.((child) => {
          if (!child.isMesh || !child.material) return;
          if (child.userData.lodgeCategory || child.geometry?.type === "CylinderGeometry" || child.geometry?.type === "TorusGeometry") {
            child.material = unlocked ? this.materials.trophyBronze : this.materials.trophyInactive;
          }
        });
      });
    });
  }

  localToWorldPoint(origin, localX, localZ) {
    return {
      x: origin.x + (Math.sin(origin.yaw + Math.PI / 2) * localX + Math.sin(origin.yaw) * localZ) * (origin.scale ?? 1),
      z: origin.z + (Math.cos(origin.yaw + Math.PI / 2) * localX + Math.cos(origin.yaw) * localZ) * (origin.scale ?? 1),
    };
  }

  addMistwood() {
    this.mistwood = { x: 92, z: 84, yaw: 0.35, scale: 1 };
    this.elderTree = { x: 101, z: 82, yaw: -0.22 };
    this.moonlitClearing = { x: 83, z: 104, yaw: 0.18 };
    this.forgottenShrine = { x: 114, z: 108, yaw: -0.55 };
    this.rootfallHollow = { x: 72, z: 78, yaw: 0.72 };
    this.echoGrove = { x: 119, z: 70, yaw: -0.05 };
    this.discoveryTrails = this.discoveryTrails ?? [];

    this.addMistwoodTransitionTrail();
    this.addMistwoodForestMass();
    this.addElderTree(this.elderTree);
    this.addMoonlitClearing(this.moonlitClearing);
    this.addForgottenMistShrine(this.forgottenShrine);
    this.addRootfallHollow(this.rootfallHollow);
    this.addEchoGrove(this.echoGrove);
    this.addMistwoodDiscoveryTrails();
    this.addMistwoodRewards();
  }

  addMistwoodTransitionTrail() {
    const trailPoints = [
      [57, 58, 4.4, 1.0, 0.64], [65, 64, 4.2, 1.0, 0.72], [73, 70, 4.0, 1.0, 0.62],
      [82, 77, 4.4, 1.05, 0.48], [91, 83, 4.6, 1.08, 0.3],
    ];
    trailPoints.forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, depth), this.materials.visibleTrail);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.055, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[67, 65, 0.62, [["Mistwood", 0.25]]], [94, 84, 0.22, [["Elder Tree", 0.18], ["Shrine", -0.28]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.25, 7), this.materials.elderBark);
      post.position.set(x, y + 0.62, z);
      post.rotation.z = 0.06;
      post.castShadow = true;
      this.scene.add(post);
      this.colliders.push(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.08 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.36, y + 1.05 - index * 0.22, z + Math.cos(yaw + offset) * 0.36);
        board.rotation.y = yaw + offset;
        board.rotation.z = -0.05;
        board.castShadow = true;
        this.scene.add(board);
      });
    });
  }

  addMistwoodForestMass() {
    if (this.performanceMode) {
      return;
    }
    const canopy = [
      [78, 70, 5.2], [88, 72, 5.8], [99, 72, 6.2], [111, 78, 5.5], [123, 84, 5.2],
      [69, 88, 5.7], [80, 94, 5.3], [96, 96, 6.1], [110, 96, 5.8], [124, 101, 5.2],
      [72, 111, 5.0], [90, 116, 5.6], [106, 119, 5.4], [119, 114, 5.8],
    ];
    canopy.forEach(([x, z, height], index) => {
      this.addAncientMistTree(x, z, height, index);
    });

    const fogPatches = [
      [88, 86, 16, 9, 0.18], [105, 99, 18, 10, -0.34], [76, 101, 14, 8, 0.42], [117, 75, 13, 8, -0.2],
    ];
    fogPatches.forEach(([x, z, width, depth, yaw]) => {
      const fog = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({
        color: 0xd5ead9,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }));
      fog.rotation.set(-Math.PI / 2, 0, yaw);
      fog.position.set(x, this.terrain.getHeightAt(x, z) + 0.16, z);
      this.scene.add(fog);
    });

    [[86, 88], [94, 107], [111, 86], [118, 101], [76, 82], [105, 114], [122, 72]].forEach(([x, z], index) => {
      this.addGlowingPlantCluster(x, z, 3 + (index % 3));
    });
  }

  addAncientMistTree(x, z, height, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.62, height, 9), this.materials.elderBark);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = Math.sin(index) * 0.08;
    trunk.castShadow = true;
    const crownA = new THREE.Mesh(new THREE.SphereGeometry(1.35, 14, 10), index % 2 ? this.materials.mistLeaf : this.materials.mistLeafDark);
    crownA.position.set(0.1, height + 0.2, 0);
    crownA.scale.set(1.25, 0.68, 1.08);
    const crownB = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 8), this.materials.mistLeaf);
    crownB.position.set(-0.58, height - 0.15, 0.42);
    crownB.scale.set(1.15, 0.58, 0.95);
    group.add(trunk, crownA, crownB);
    this.scene.add(group);
    this.addCollisionCylinder(x, z, 0.56, height);
  }

  addGlowingPlantCluster(x, z, count = 3) {
    const y = this.terrain.getHeightAt(x, z);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const plant = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5 + index * 0.04, 5), this.materials.glowPlant);
      plant.position.set(x + Math.sin(angle) * (0.28 + index * 0.04), y + 0.25, z + Math.cos(angle) * (0.28 + index * 0.04));
      plant.rotation.z = Math.sin(index) * 0.12;
      this.scene.add(plant);
    }
  }

  addElderTree(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.55, 7.2, 12), this.materials.elderBark);
    trunk.position.y = 3.6;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(3.3, 18, 12), this.materials.mistLeafDark);
    crown.position.y = 7.4;
    crown.scale.set(1.25, 0.72, 1.08);
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), this.materials.glowPlant);
    heart.position.set(0.25, 2.4, 0.95);
    group.add(trunk, crown, heart);
    [-1, 1].forEach((side) => {
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 4.3, 6, 10), this.materials.elderBark);
      root.position.set(side * 1.7, 0.34, 0.6);
      root.rotation.set(Math.PI / 2, 0, side * 0.82);
      group.add(root);
    });
    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 1.45, 7.2);
    this.addTarget(origin.x - 6.4, origin.z + 3.2, origin.yaw + 1.2, 0.52, { challengeId: "mistwoodTargets", challengeLabel: "Mistwood Hidden Range", yOffset: 0.8 });
  }

  addMoonlitClearing(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), this.materials.moonPetal);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(origin.x, y + 0.045, origin.z);
    this.scene.add(disc);
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      const stone = new THREE.Mesh(this.geometries.pebble, this.materials.mistStone);
      stone.position.set(origin.x + Math.sin(angle) * 4.2, y + 0.22, origin.z + Math.cos(angle) * 4.2);
      stone.scale.set(0.55, 0.28, 0.72);
      stone.rotation.y = angle;
      stone.castShadow = true;
      this.scene.add(stone);
    }
    this.addTarget(origin.x + 4.8, origin.z - 4.6, origin.yaw - 0.92, 0.45, { challengeId: "mistwoodTargets", challengeLabel: "Mistwood Hidden Range", yOffset: 0.38 });
    this.interactables.push({
      id: "mistwood-moonlit-view",
      type: "lookout",
      name: "Moonlit Clearing",
      prompt: "E Study the moon path",
      position: new THREE.Vector3(origin.x, y + 0.7, origin.z),
      radius: 3.8,
      focus: new THREE.Vector3(this.forgottenShrine.x, y + 4.5, this.forgottenShrine.z),
      text: "Silver pollen gathers toward a hidden shrine route.",
    });
  }

  addForgottenMistShrine(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.7, 0.32, 9), this.materials.mistStone);
    base.position.y = 0.16;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.18, 8, 28, Math.PI), this.materials.ancientStone);
    arch.position.y = 1.65;
    arch.rotation.z = Math.PI;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.35), this.materials.glyphStone);
    marker.position.set(0, 0.95, 0.4);
    group.add(base, arch, marker);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z + 0.2, 1.1, 0.6, 1.6, origin.yaw);
    this.addTarget(origin.x - 4.7, origin.z + 3.8, origin.yaw + 1.48, 0.42, { challengeId: "mistwoodTargets", challengeLabel: "Mistwood Hidden Range", yOffset: 0.6 });
    this.interactables.push({
      id: "whisperwind-shrine-clue",
      type: "lore-note",
      name: "Forgotten Shrine",
      prompt: "E Read swift carving",
      position: new THREE.Vector3(origin.x, y + 1.2, origin.z + 0.4),
      radius: 3,
      text: "Three markers, one hidden trail, then the Elder Tree guardian. Whisperwind chooses the quick and quiet.",
    });
  }

  addRootfallHollow(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const hollow = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.24, 8, 32, Math.PI * 1.35), this.materials.elderBark);
    hollow.position.set(origin.x, y + 0.95, origin.z);
    hollow.rotation.set(Math.PI / 2, 0, origin.yaw);
    hollow.scale.set(1.4, 0.9, 0.6);
    hollow.castShadow = true;
    this.scene.add(hollow);
    this.addCollisionCylinder(origin.x - 1.3, origin.z, 0.45, 1.5);
    this.addCollisionCylinder(origin.x + 1.3, origin.z, 0.45, 1.5);
    this.addSimpleLandmarkPickup(origin.x + 2.8, origin.z - 2.6, "Rootfall Cache", 42, "A hidden satchel tucked under a living root.");
  }

  addEchoGrove(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const chime = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.3, 7), this.materials.crystalViolet);
      chime.position.set(origin.x + Math.sin(angle) * 2.9, y + 1.1, origin.z + Math.cos(angle) * 2.9);
      chime.rotation.z = Math.sin(index) * 0.12;
      chime.castShadow = true;
      this.scene.add(chime);
    }
    this.addRareLootCache(origin.x - 2.4, origin.z + 1.8, "Echo Grove Thread", "epic", "A pale strand that hums like an unfinished bowstring.");
  }

  addMistwoodDiscoveryTrails() {
    this.addDiscoveryTrail({
      id: "moonlit-shrine-trail",
      name: "Moonlit Shrine Trail",
      marker: [84.6, 101.2],
      points: [[88, 104], [94, 106], [101, 108], [108, 108]],
      reward: 38,
      text: "The moonlit pollen settles, revealing a trail to the Forgotten Shrine.",
    });
    this.addDiscoveryTrail({
      id: "rootfall-echo-trail",
      name: "Rootfall Echo Trail",
      marker: [74.2, 79.5],
      points: [[77, 80], [84, 77], [94, 74], [106, 72], [116, 70]],
      reward: 42,
      text: "A low echo rolls through the roots. A hidden grove path glows ahead.",
    });
    this.addDiscoveryTrail({
      id: "elder-guardian-trail",
      name: "Elder Guardian Trail",
      marker: [103.4, 84.2],
      points: [[103, 84], [106, 88], [109, 92], [112, 96]],
      reward: 52,
      text: "The Elder Tree opens a guardian path through the mist.",
    });
  }

  addDiscoveryTrail({ id, name, marker, points, reward, text }) {
    const material = this.materials.visibleTrail.clone();
    material.opacity = 0;
    const meshes = points.map(([x, z], index) => {
      const next = points[Math.min(points.length - 1, index + 1)];
      const dx = next[0] - x;
      const dz = next[1] - z;
      const length = Math.max(2.8, Math.hypot(dx, dz));
      const trail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.04, 0.62), material);
      trail.position.set(x, this.terrain.getHeightAt(x, z) + 0.065, z);
      trail.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
      trail.visible = false;
      this.scene.add(trail);
      return trail;
    });
    this.discoveryTrails.push({ id, name, meshes, material, revealed: false, reward, text });
    const [markerX, markerZ] = marker;
    const markerY = this.terrain.getHeightAt(markerX, markerZ);
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.82, 7), this.materials.glyphStone);
    stone.position.set(markerX, markerY + 0.41, markerZ);
    stone.castShadow = true;
    this.scene.add(stone);
    this.interactables.push({
      id,
      type: "discovery-trail",
      name,
      prompt: "E Activate marker",
      position: new THREE.Vector3(markerX, markerY + 0.6, markerZ),
      radius: 3,
      text,
    });
  }

  revealDiscoveryTrail(id) {
    const trail = this.discoveryTrails?.find((item) => item.id === id);
    if (!trail || trail.revealed) {
      return false;
    }
    trail.revealed = true;
    trail.meshes.forEach((mesh) => {
      mesh.visible = true;
    });
    trail.material.opacity = 0.72;
    window.dispatchEvent(new CustomEvent("echo-archer:xp-pickup", {
      detail: { id, amount: trail.reward ?? 0, name: trail.name },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:discovery-trail", {
      detail: { id, name: trail.name },
    }));
    return true;
  }

  addMistwoodRewards() {
    this.addRareLootCache(89.4, 112.2, "Moonlit Seed", "rare", "A softly glowing seed saved for future alchemy and bow crafting.");
    this.addRareLootCache(116.6, 103.2, "Whisperwind Bowstring", "legendary", "A bowstring clue for the Mistwood legendary bow quest.");
    this.addLegendaryHint(104.8, 80.5, "Whisperwind Marker", "The Elder Tree marks a bow of speed. Activate the hidden trails, find the shrine, and face the guardian.");
  }

  addBlackwaterMarsh() {
    this.blackwaterMarsh = { x: -96, z: -82, yaw: 0.42, scale: 1 };
    this.sunkenShrine = { x: -112, z: -96, yaw: -0.35 };
    this.mosswatchTower = { x: -80, z: -70, yaw: 0.18 };
    this.crookedBoardwalk = { x: -98, z: -60, yaw: 0.72 };
    this.drownedRuins = { x: -119, z: -74, yaw: -0.12 };
    this.witchlightGrove = { x: -84, z: -104, yaw: 0.28 };
    this.bogZones = this.bogZones ?? [];
    this.discoveryTrails = this.discoveryTrails ?? [];

    this.addBlackwaterTransitionTrail();
    this.addBlackwaterLowlands();
    this.addSunkenShrine(this.sunkenShrine);
    this.addMosswatchTower(this.mosswatchTower);
    this.addCrookedBoardwalk(this.crookedBoardwalk);
    this.addDrownedRuins(this.drownedRuins);
    this.addWitchlightGrove(this.witchlightGrove);
    this.addBlackwaterBogZones();
    this.addBlackwaterDiscoveryTrails();
    this.addBlackwaterRewards();
  }

  addBlackwaterTransitionTrail() {
    const trailPoints = [
      [-42, -24, 4.4, 1.0, -0.8], [-52, -34, 4.4, 1.02, -0.72], [-62, -44, 4.2, 1.0, -0.66],
      [-73, -55, 4.8, 1.08, -0.56], [-85, -68, 5.2, 1.12, -0.42], [-96, -82, 5.6, 1.16, -0.28],
    ];
    trailPoints.forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, depth), this.materials.swampMud);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.052, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[-55, -36, -0.75, [["Marsh", 0.18]]], [-92, -73, -0.2, [["Shrine", -0.28], ["Tower", 0.28]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.25, 7), this.materials.blackwaterWood);
      post.position.set(x, y + 0.62, z);
      post.rotation.z = -0.08;
      post.castShadow = true;
      this.scene.add(post);
      this.colliders.push(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.08 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.36, y + 1.05 - index * 0.22, z + Math.cos(yaw + offset) * 0.36);
        board.rotation.y = yaw + offset;
        board.rotation.z = 0.07;
        board.castShadow = true;
        this.scene.add(board);
      });
    });
  }

  addBlackwaterLowlands() {
    if (this.performanceMode) {
      return;
    }
    const waterPatches = [
      [-95, -82, 18, 12, 0.28], [-108, -101, 14, 9, -0.2], [-81, -98, 12, 8, 0.55],
      [-119, -72, 13, 8, -0.36], [-93, -60, 16, 7, 0.2], [-77, -82, 10, 7, -0.48],
    ];
    waterPatches.forEach(([x, z, width, depth, yaw]) => {
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.swampWater);
      pool.rotation.set(-Math.PI / 2, 0, yaw);
      pool.position.set(x, this.terrain.getHeightAt(x, z) + 0.035, z);
      pool.receiveShadow = true;
      this.scene.add(pool);
    });

    const fogPatches = [
      [-99, -91, 19, 9, 0.12], [-116, -82, 16, 8, -0.2], [-81, -107, 15, 8, 0.46],
    ];
    fogPatches.forEach(([x, z, width, depth, yaw]) => {
      const fog = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({
        color: 0xa8bea6,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }));
      fog.rotation.set(-Math.PI / 2, 0, yaw);
      fog.position.set(x, this.terrain.getHeightAt(x, z) + 0.18, z);
      this.scene.add(fog);
    });

    [
      [-74, -70, 4.2], [-86, -75, 4.8], [-101, -72, 5.0], [-118, -86, 4.4],
      [-90, -111, 4.9], [-75, -101, 4.1], [-109, -108, 4.2], [-124, -64, 3.9],
      [-67, -87, 3.8], [-102, -56, 4.1], [-118, -104, 4.0],
    ].forEach(([x, z, height], index) => this.addSwampTree(x, z, height, index));

    [[-88, -87], [-99, -104], [-114, -91], [-78, -91], [-123, -78], [-87, -61], [-79, -111]].forEach(([x, z], index) => {
      this.addSwampGlowCluster(x, z, 3 + (index % 3));
    });
  }

  addSwampTree(x, z, height, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.56, height, 8), this.materials.blackwaterWood);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = Math.sin(index * 1.7) * 0.13;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), index % 2 ? this.materials.mistLeafDark : this.materials.marshGrass);
    crown.position.set(0.12, height + 0.25, 0.08);
    crown.scale.set(1.25, 0.54, 1.02);
    group.add(trunk, crown);
    [-0.52, 0.48].forEach((offset, mossIndex) => {
      const moss = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.15 + mossIndex * 0.2, 5), this.materials.hangingMoss);
      moss.position.set(offset, height - 0.42, 0.28 + mossIndex * 0.16);
      moss.rotation.z = offset * 0.12;
      group.add(moss);
    });
    this.scene.add(group);
    this.addCollisionCylinder(x, z, 0.52, height);
  }

  addSwampGlowCluster(x, z, count = 3) {
    const y = this.terrain.getHeightAt(x, z);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.38, 6), this.materials.marshGrass);
      stem.position.set(x + Math.sin(angle) * 0.36, y + 0.19, z + Math.cos(angle) * 0.36);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), this.materials.witchlight);
      bulb.position.set(stem.position.x, y + 0.43 + index * 0.025, stem.position.z);
      this.scene.add(stem, bulb);
    }
  }

  addSunkenShrine(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.0, 0.34, 9), this.materials.sunkenStone);
    base.position.y = 0.16;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.22, 8, 30, Math.PI), this.materials.ancientStone);
    arch.position.y = 1.72;
    arch.rotation.z = Math.PI;
    const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.24, 0.34), this.materials.glyphStone);
    glyph.position.set(0, 0.94, 0.62);
    const waterline = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), this.materials.swampWater);
    waterline.position.y = 0.08;
    waterline.rotation.x = -Math.PI / 2;
    group.add(base, arch, glyph, waterline);
    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 1.7, 1.9);
    this.addTarget(origin.x + 5.3, origin.z - 3.7, origin.yaw - 0.95, 0.46, {
      challengeId: "sunkenShrineTrial",
      challengeLabel: "Sunken Shrine Trial",
      yOffset: 0.48,
    });
    this.interactables.push({
      id: "bogpiercer-shrine-clue",
      type: "lore-note",
      name: "Sunken Shrine Carving",
      prompt: "E Read wet carving",
      position: new THREE.Vector3(origin.x, y + 1.22, origin.z + 0.7),
      radius: 3,
      text: "Fog parts for the patient shot. Witchlights, drowned markers, shrine trial, then Mirejaw.",
    });
  }

  addMosswatchTower(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    legs.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 3.1, 7), this.materials.blackwaterWood);
      leg.position.set(lx * 1.1, 1.55, lz * 0.86);
      leg.rotation.z = lx * 0.07;
      leg.castShadow = true;
      group.add(leg);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.22, 2.65), this.materials.weatheredDock);
    deck.position.y = 3.02;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.95, 4), this.materials.hangingMoss);
    roof.position.y = 3.78;
    roof.rotation.y = Math.PI * 0.25;
    group.add(deck, roof);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 2.7, 2.0, 3.2, origin.yaw);
    this.addTarget(origin.x - 5.9, origin.z + 2.6, origin.yaw + 1.3, 0.52, {
      challengeId: "blackwaterTargets",
      challengeLabel: "Blackwater Hidden Range",
      yOffset: 0.72,
    });
    this.addSimpleLandmarkPickup(origin.x + 3.2, origin.z - 2.2, "Mosswatch Survey Token", 38, "A damp token from an old watch post.");
  }

  addCrookedBoardwalk(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y + 0.16, origin.z);
    group.rotation.y = origin.yaw;
    for (let index = 0; index < 11; index += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 1.35), this.materials.weatheredDock);
      plank.position.set((index - 5) * 0.78, Math.sin(index * 1.2) * 0.025, Math.sin(index * 0.8) * 0.22);
      plank.rotation.y = Math.sin(index * 1.7) * 0.07;
      plank.rotation.z = Math.sin(index) * 0.035;
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }
    [-4.2, -1.2, 2.0, 4.7].forEach((xOffset, index) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.0, 7), this.materials.blackwaterWood);
      post.position.set(xOffset, 0.45, index % 2 ? 0.82 : -0.78);
      post.castShadow = true;
      group.add(post);
    });
    this.scene.add(group);
    this.addTarget(origin.x + 7.0, origin.z + 3.1, origin.yaw - 1.0, 0.5, {
      challengeId: "blackwaterTargets",
      challengeLabel: "Blackwater Hidden Range",
      yOffset: 0.36,
    });
  }

  addDrownedRuins(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    [-1.8, 0.2, 2.2].forEach((xOffset, index) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.8 + index * 0.34, 8), this.materials.sunkenStone);
      pillar.position.set(xOffset, 0.9 + index * 0.17, Math.sin(index) * 0.7);
      pillar.rotation.z = (index - 1) * 0.13;
      pillar.castShadow = true;
      group.add(pillar);
    });
    const fallen = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 3.6, 6, 10), this.materials.sunkenStone);
    fallen.position.set(0.5, 0.42, -1.2);
    fallen.rotation.set(Math.PI / 2, 0.14, 0.8);
    group.add(fallen);
    this.scene.add(group);
    this.addCollisionCylinder(origin.x - 1.8, origin.z, 0.46, 1.8);
    this.addCollisionCylinder(origin.x + 2.2, origin.z + 0.4, 0.46, 2.5);
    this.addTarget(origin.x - 4.4, origin.z - 4.9, origin.yaw + 1.75, 0.44, {
      challengeId: "blackwaterTargets",
      challengeLabel: "Blackwater Hidden Range",
      yOffset: 0.55,
    });
  }

  addWitchlightGrove(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.6, 28), this.materials.bogMud);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(origin.x, y + 0.045, origin.z);
    this.scene.add(disc);
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      this.addSwampGlowCluster(origin.x + Math.sin(angle) * 3.2, origin.z + Math.cos(angle) * 3.2, 2);
    }
    this.addTarget(origin.x + 4.7, origin.z + 4.2, origin.yaw - 1.42, 0.42, {
      challengeId: "blackwaterTargets",
      challengeLabel: "Blackwater Hidden Range",
      yOffset: 0.42,
    });
    this.interactables.push({
      id: "witchlight-grove-clue",
      type: "lore-note",
      name: "Witchlight Grove",
      prompt: "E Study witchlights",
      position: new THREE.Vector3(origin.x, y + 0.8, origin.z),
      radius: 3.4,
      text: "Green lights gather where arrows should land. Follow them before seeking the sunken trial.",
    });
  }

  addBlackwaterBogZones() {
    [
      { id: "bog-sunken-shrine", name: "Sunken Shrine Bog", x: -108, z: -92, radius: 6.4, slow: 0.78 },
      { id: "bog-boardwalk", name: "Boardwalk Mire", x: -96, z: -63, radius: 5.6, slow: 0.82 },
      { id: "bog-witchlight", name: "Witchlight Mire", x: -86, z: -101, radius: 5.8, slow: 0.8 },
      { id: "bog-drowned", name: "Drowned Ruins Bog", x: -117, z: -76, radius: 5.2, slow: 0.84 },
    ].forEach((zone) => this.addBogZone(zone));
  }

  addBogZone({ id, name, x, z, radius, slow }) {
    const y = this.terrain.getHeightAt(x, z);
    const bog = new THREE.Mesh(new THREE.CircleGeometry(radius, 30), this.materials.bogMud);
    bog.rotation.x = -Math.PI / 2;
    bog.position.set(x, y + 0.058, z);
    bog.receiveShadow = true;
    this.scene.add(bog);
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.9, radius, 30), this.materials.witchlight);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.068, z);
    ring.material = ring.material.clone();
    ring.material.opacity = 0.22;
    ring.material.transparent = true;
    this.scene.add(ring);
    this.bogZones.push({ id, name, position: new THREE.Vector3(x, y, z), radius, slow });
  }

  getBogSlowMultiplierAt(position) {
    if (!this.bogZones?.length) {
      return 1;
    }
    return this.bogZones.reduce((multiplier, zone) => {
      const distance = Math.hypot(position.x - zone.position.x, position.z - zone.position.z);
      return distance <= zone.radius ? Math.min(multiplier, zone.slow ?? 0.82) : multiplier;
    }, 1);
  }

  getBogEnemySpeedMultiplierAt(position, type) {
    const slow = this.getBogSlowMultiplierAt(position);
    if (slow >= 0.99) {
      return 1;
    }
    if (["marshStalker", "mudCrawler", "swampHornbeast", "mirejaw"].includes(type)) {
      return 1.04;
    }
    if (type === "mireBat") {
      return 1;
    }
    return Math.max(0.9, slow);
  }

  addBlackwaterDiscoveryTrails() {
    this.addDiscoveryTrail({
      id: "drowned-marker-trail",
      name: "Drowned Ruins Marker Trail",
      marker: [-116.8, -75.2],
      points: [[-114, -77], [-109, -83], [-106, -89], [-112, -95]],
      reward: 48,
      text: "The drowned markers glow. A trial route curls toward the Sunken Shrine.",
    });
    this.addDiscoveryTrail({
      id: "witchlight-bogpiercer-trail",
      name: "Witchlight Bogpiercer Trail",
      marker: [-84.4, -103.2],
      points: [[-88, -102], [-95, -98], [-102, -96], [-109, -96]],
      reward: 52,
      text: "The witchlights form a careful line through the fog toward Bogpiercer's trial.",
    });
  }

  addBlackwaterRewards() {
    this.addRareLootCache(-101.5, -67.8, "Bog Iron Fragment", "rare", "A heavy upgrade material placeholder from the boardwalk shallows.");
    this.addRareLootCache(-122.2, -70.5, "Sunken Archer Sigil", "epic", "A drowned sigil tied to old marsh archers.");
    this.addRareLootCache(-82.6, -106.4, "Witchlight Resin", "rare", "A glowing resin saved for future bow and arrow crafting.");
    this.addSimpleLandmarkPickup(-91.2, -88.5, "Blackwater Reed Bundle", 42, "Useful reeds tied with an old archer's knot.");
    this.addLegendaryHint(-111.4, -99.4, "Bogpiercer Trial Marker", "Bogpiercer waits beyond witchlights, drowned markers, the sunken trial, and Mirejaw.");
  }

  addRedCanyon() {
    this.redCanyon = { x: 0, z: 114, yaw: 0.08, scale: 1 };
    this.skybridgeCrossing = { x: -22, z: 108, yaw: -0.38 };
    this.crimsonArch = { x: 16, z: 98, yaw: 0.45 };
    this.forgottenOutpost = { x: -30, z: 130, yaw: 0.22 };
    this.sunspirePlateau = { x: 20, z: 132, yaw: -0.16 };
    this.echoChasm = { x: 0, z: 146, yaw: 0.02 };

    this.addRedCanyonRoute();
    this.addRedCanyonMass();
    this.addSkybridgeCrossing(this.skybridgeCrossing);
    this.addCrimsonArch(this.crimsonArch);
    this.addForgottenOutpost(this.forgottenOutpost);
    this.addSunspirePlateau(this.sunspirePlateau);
    this.addEchoChasm(this.echoChasm);
    this.addRedCanyonEchoTargets();
    this.addRedCanyonRewards();
  }

  addRedCanyonRoute() {
    [
      [-3, 72, 4.5, 1.0, 0.02], [-1, 82, 4.2, 1.0, 0.08], [3, 92, 4.2, 1.0, 0.18],
      [2, 103, 5.0, 1.08, -0.05], [0, 114, 5.8, 1.12, -0.12],
    ].forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), this.materials.canyonTrail);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.055, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[-2, 86, 0.06, [["Red Canyon", 0.24]]], [1, 112, -0.12, [["Skybridge", -0.36], ["Plateau", 0.34]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.28, 7), this.materials.blackwaterWood);
      post.position.set(x, y + 0.64, z);
      this.scene.add(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.18 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.38, y + 1.08 - index * 0.22, z + Math.cos(yaw + offset) * 0.38);
        board.rotation.y = yaw + offset;
        board.rotation.z = -0.06;
        this.scene.add(board);
      });
    });
  }

  addRedCanyonMass() {
    if (this.performanceMode) {
      return;
    }
    const walls = [
      [-38, 105, 8, 26, 8.8, -0.2], [39, 110, 8, 30, 9.2, 0.18], [-42, 134, 9, 26, 10.4, 0.28],
      [42, 140, 9, 28, 10.8, -0.24], [-18, 151, 12, 8, 8.8, 0.1], [20, 153, 12, 8, 9.6, -0.08],
      [-8, 96, 8, 8, 5.4, 0.35], [25, 120, 8, 9, 6.8, -0.4],
    ];
    walls.forEach(([x, z, width, depth, height, yaw]) => this.addCanyonButte(x, z, width, depth, height, yaw));
    [[-18, 118, 1.4], [12, 116, 1.2], [-28, 142, 1.1], [28, 98, 1.0], [8, 138, 1.3]].forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 ? this.materials.canyonDark : this.materials.canyonRock);
      rock.position.set(x, this.terrain.getHeightAt(x, z) + scale * 0.32, z);
      rock.scale.set(scale * 1.6, scale * 0.8, scale * 1.1);
      rock.rotation.set(index * 0.1, index * 0.54, -0.12);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.addCollisionCylinder(x, z, scale * 0.78, 1.7);
    });
    [[-15, 126, 16, 7, 0.25], [16, 111, 14, 6, -0.38], [0, 143, 19, 5, 0.05]].forEach(([x, z, width, depth, yaw]) => {
      const dust = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.canyonDust);
      dust.position.set(x, this.terrain.getHeightAt(x, z) + 0.18, z);
      dust.rotation.set(-Math.PI / 2, 0, yaw);
      this.scene.add(dust);
    });
  }

  addCanyonButte(x, z, width, depth, height, yaw = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.58, width * 0.72, height, 8), this.materials.canyonRock);
    base.position.y = height * 0.5;
    base.scale.z = depth / Math.max(width, 0.1);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.66, width * 0.55, 0.6, 8), this.materials.canyonDark);
    cap.position.y = height + 0.28;
    cap.scale.z = depth / Math.max(width, 0.1);
    group.add(base, cap);
    this.scene.add(group);
    this.addCollisionBox(x, z, width, depth, height, yaw);
  }

  addSkybridgeCrossing(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    this.addCanyonButte(origin.x - 4.8, origin.z, 3.2, 4.5, 5.2, origin.yaw);
    this.addCanyonButte(origin.x + 4.8, origin.z + 1.2, 3.4, 4.4, 5.7, origin.yaw);
    const group = new THREE.Group();
    group.position.set(origin.x, y + 4.1, origin.z);
    group.rotation.y = origin.yaw;
    for (let index = 0; index < 9; index += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 1.25), this.materials.weatheredDock);
      plank.position.set((index - 4) * 0.82, Math.sin(index) * 0.035, 0);
      plank.rotation.z = Math.sin(index * 1.5) * 0.04;
      group.add(plank);
    }
    [-1, 1].forEach((side) => {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.07, 0.07), this.materials.rope);
      rope.position.set(0, 0.55, side * 0.66);
      group.add(rope);
    });
    this.scene.add(group);
    this.addTarget(origin.x + 9.6, origin.z - 7.4, origin.yaw - 1.25, 0.46, { challengeId: "redCanyonTargets", challengeLabel: "Red Canyon Long Shots", yOffset: 2.2 });
  }

  addCrimsonArch(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.34, 8, 32, Math.PI * 1.08), this.materials.canyonRock);
    arch.position.set(origin.x, y + 2.7, origin.z);
    arch.rotation.set(Math.PI / 2, 0, origin.yaw);
    arch.scale.set(1.2, 1.0, 0.7);
    this.scene.add(arch);
    this.addCollisionCylinder(origin.x - 2.4, origin.z, 0.72, 4.2);
    this.addCollisionCylinder(origin.x + 2.4, origin.z, 0.72, 4.2);
    this.addTarget(origin.x - 7.8, origin.z + 5.8, origin.yaw + 1.4, 0.44, { challengeId: "redCanyonTargets", challengeLabel: "Red Canyon Long Shots", yOffset: 1.2 });
    this.interactables.push({
      id: "sunpiercer-crimson-clue",
      type: "lore-note",
      name: "Crimson Arch Carving",
      prompt: "E Read sun mark",
      position: new THREE.Vector3(origin.x, y + 1.1, origin.z),
      radius: 3,
      text: "The arch remembers arrows that crossed the whole canyon without falling.",
    });
  }

  addForgottenOutpost(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 2.0), this.materials.weatheredDock);
    tower.position.y = 1.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), this.materials.barkDark);
    roof.position.y = 4.0;
    roof.rotation.y = Math.PI / 4;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.55), this.materials.banner);
    flag.position.set(0.9, 4.25, -0.2);
    group.add(tower, roof, flag);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 2.4, 2.2, 4.1, origin.yaw);
    this.addSimpleLandmarkPickup(origin.x + 3.0, origin.z - 2.5, "Outpost Survey", 52, "A brittle survey showing long-range canyon firing lanes.");
  }

  addSunspirePlateau(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 0.5, 12), this.materials.canyonSand);
    disc.position.set(origin.x, y + 2.1, origin.z);
    disc.scale.set(1.18, 1, 0.78);
    disc.rotation.y = origin.yaw;
    this.scene.add(disc);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.4, 7), this.materials.sunstone);
    spire.position.set(origin.x, y + 4.0, origin.z);
    spire.castShadow = true;
    this.scene.add(spire);
    this.addCollisionCylinder(origin.x, origin.z, 1.2, 3.8);
    this.addTarget(origin.x - 10.8, origin.z - 7.2, origin.yaw + 1.0, 0.5, { challengeId: "sunspireEcho", challengeLabel: "Sunspire Echo Targets", yOffset: 2.8 });
    this.interactables.push({
      id: "sunpiercer-plateau-clue",
      type: "lore-note",
      name: "Sunspire Journal",
      prompt: "E Read journal",
      position: new THREE.Vector3(origin.x + 1.5, y + 2.55, origin.z - 0.8),
      radius: 3.2,
      text: "Sunpiercer is not fire alone. It is distance, breath, and a target that answers back.",
    });
  }

  addEchoChasm(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const chasm = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.5), this.materials.canyonDark);
    chasm.position.set(origin.x, y + 0.045, origin.z);
    chasm.rotation.set(-Math.PI / 2, 0, origin.yaw);
    this.scene.add(chasm);
    [-5.5, 5.5].forEach((offset) => this.addCanyonButte(origin.x + offset, origin.z + 0.6, 2.6, 5.8, 5.1, origin.yaw + 0.2));
    this.addTarget(origin.x + 12.0, origin.z - 3.0, origin.yaw - 1.5, 0.42, { challengeId: "echoChasmTargets", challengeLabel: "Echo Chasm Trial", yOffset: 3.2 });
    this.addRareLootCache(origin.x - 3.8, origin.z + 4.6, "Chasm Echo Crystal", "epic", "A resonant crystal for future canyon bow quests.");
  }

  addRedCanyonEchoTargets() {
    [
      [-12, 118, 0.62, "echo-target-skybridge", "Skybridge Echo Cache"],
      [24, 104, -0.75, "echo-target-crimson", "Crimson Arch Echo Cache"],
      [-35, 138, 0.35, "echo-target-outpost", "Forgotten Outpost Echo Cache"],
      [8, 151, -0.25, "echo-target-chasm", "Echo Chasm Cache"],
    ].forEach(([x, z, yaw, id, cacheName], index) => {
      this.addEchoTarget(x, z, yaw, id, cacheName, index);
    });
  }

  addEchoTarget(x, z, yaw, id, cacheName, index = 0) {
    this.addTarget(x, z, yaw, 0.38, {
      challengeId: "echoTargets",
      challengeLabel: "Echo Targets",
      yOffset: 2.4 + (index % 2) * 0.8,
    });
    const y = this.terrain.getHeightAt(x, z);
    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 32), this.materials.sunstone);
    marker.position.set(x, y + 2.45 + (index % 2) * 0.8, z);
    marker.rotation.set(Math.PI / 2, 0, yaw);
    this.scene.add(marker);
    this.addRareLootCache(x + Math.sin(yaw) * 2.0, z + Math.cos(yaw) * 2.0, cacheName, "rare", "A distant echo cache unlocked by precision canyon shooting.");
  }

  addRedCanyonRewards() {
    this.addRareLootCache(-24.2, 118.4, "Canyon Hawk Fletching", "rare", "Stiff fletching for future long-range arrow crafting.");
    this.addRareLootCache(22.8, 135.5, "Sunstone Lens", "epic", "A lens tied to the Sunpiercer legendary bow quest.");
    this.addLegendaryHint(18.8, 130.2, "Sunpiercer Plateau Mark", "Complete the Echo Targets, find the Sunspire clues, and face Stonehorn to earn Sunpiercer.");
  }

  addAshenHighlands() {
    this.ashenHighlands = { x: -126, z: 134, yaw: -0.18, scale: 1 };
    this.emberPeak = { x: -146, z: 150, yaw: 0.22 };
    this.obsidianCitadel = { x: -114, z: 126, yaw: -0.34 };
    this.ashfallBasin = { x: -140, z: 110, yaw: 0.18 };
    this.firewatchSpire = { x: -100, z: 148, yaw: -0.5 };
    this.moltenHollow = { x: -158, z: 126, yaw: 0.58 };
    this.heatZones = this.heatZones ?? [];

    this.addAshenRoute();
    this.addAshenHighlandMass();
    this.addEmberPeak(this.emberPeak);
    this.addObsidianCitadel(this.obsidianCitadel);
    this.addAshfallBasin(this.ashfallBasin);
    this.addFirewatchSpire(this.firewatchSpire);
    this.addMoltenHollow(this.moltenHollow);
    this.addAshenHeatZones();
    this.addAshenRewards();
  }

  addAshenRoute() {
    [
      [-28, 148, 5.0, 1.0, 1.2], [-48, 150, 5.4, 1.05, 1.35], [-70, 146, 5.2, 1.05, 1.7],
      [-92, 138, 5.8, 1.1, 1.9], [-112, 134, 6.0, 1.12, 1.72], [-130, 132, 6.4, 1.12, 1.58],
    ].forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth), this.materials.ashField);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.06, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[-62, 148, 1.58, [["Highlands", 0.18]]], [-124, 133, 1.55, [["Peak", -0.35], ["Citadel", 0.32]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.32, 7), this.materials.obsidian);
      post.position.set(x, y + 0.66, z);
      post.castShadow = true;
      this.scene.add(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.22 - index * 0.08, 0.18, 0.08), this.materials.emberRock);
        board.position.set(x + Math.sin(yaw + offset) * 0.38, y + 1.12 - index * 0.22, z + Math.cos(yaw + offset) * 0.38);
        board.rotation.y = yaw + offset;
        this.scene.add(board);
      });
    });
  }

  addAshenHighlandMass() {
    if (this.performanceMode) {
      return;
    }
    const ridges = [
      [-170, 112, 9, 22, 9.4, -0.4], [-166, 150, 10, 23, 10.8, 0.2], [-126, 164, 12, 9, 8.6, -0.1],
      [-94, 158, 9, 21, 8.8, 0.34], [-88, 118, 8, 22, 8.4, -0.28], [-145, 96, 14, 8, 7.8, 0.08],
      [-121, 136, 7, 7, 5.4, 0.22], [-151, 136, 8, 8, 6.5, -0.34],
    ];
    ridges.forEach(([x, z, width, depth, height, yaw]) => this.addVolcanicRidge(x, z, width, depth, height, yaw));
    [[-135, 126, 16, 3.2, -0.35], [-148, 142, 15, 2.8, 0.48], [-111, 142, 14, 2.6, -0.62]].forEach(([x, z, width, depth, yaw]) => {
      const lava = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.lava);
      lava.position.set(x, this.terrain.getHeightAt(x, z) + 0.07, z);
      lava.rotation.set(-Math.PI / 2, 0, yaw);
      this.scene.add(lava);
      const glow = new THREE.Mesh(new THREE.RingGeometry(width * 0.22, width * 0.28, 32), this.materials.lavaGlow);
      glow.position.set(x, this.terrain.getHeightAt(x, z) + 0.08, z);
      glow.rotation.set(-Math.PI / 2, 0, yaw);
      glow.scale.z = depth / Math.max(width, 0.1);
      this.scene.add(glow);
    });
    [[-117, 116], [-151, 117], [-105, 153], [-160, 140], [-132, 152]].forEach(([x, z], index) => this.addSmokeVent(x, z, 1.1 + (index % 3) * 0.2));
    [[-98, 132, 4.1], [-118, 154, 3.6], [-153, 104, 3.9], [-139, 138, 4.4]].forEach(([x, z, height], index) => this.addScorchedTree(x, z, height, index));
  }

  addVolcanicRidge(x, z, width, depth, height, yaw = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.5, width * 0.72, height, 7), this.materials.ashStone);
    base.position.y = height * 0.5;
    base.scale.z = depth / Math.max(width, 0.1);
    const obsidianCap = new THREE.Mesh(new THREE.ConeGeometry(width * 0.42, height * 0.36, 7), this.materials.obsidian);
    obsidianCap.position.y = height + height * 0.16;
    obsidianCap.scale.z = depth / Math.max(width, 0.1);
    group.add(base, obsidianCap);
    this.scene.add(group);
    this.addCollisionBox(x, z, width, depth, height, yaw);
  }

  addSmokeVent(x, z, scale = 1) {
    const y = this.terrain.getHeightAt(x, z);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.58 * scale, 0.18, 8), this.materials.obsidian);
    ring.position.set(x, y + 0.09, z);
    this.scene.add(ring);
    for (let index = 0; index < 3; index += 1) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.42 + index * 0.16, 10, 6), this.materials.smoke);
      smoke.position.set(x + Math.sin(index) * 0.18, y + 0.7 + index * 0.5, z + Math.cos(index * 1.7) * 0.14);
      smoke.scale.set(1.2 + index * 0.2, 0.52, 0.86);
      this.scene.add(smoke);
    }
  }

  addScorchedTree(x, z, height, index = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, height, 7), this.materials.barkDark);
    trunk.position.set(x, y + height * 0.5, z);
    trunk.rotation.z = Math.sin(index * 1.3) * 0.16;
    trunk.castShadow = true;
    this.scene.add(trunk);
    this.addCollisionCylinder(x, z, 0.32, height);
    [-0.5, 0.45].forEach((side, branchIndex) => {
      const branch = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 1.1, 4, 6), this.materials.barkDark);
      branch.position.set(x + side * 0.35, y + height * (0.65 + branchIndex * 0.1), z);
      branch.rotation.set(Math.PI / 2, 0, side * 0.72);
      this.scene.add(branch);
    });
  }

  addEmberPeak(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    this.addVolcanicRidge(origin.x, origin.z, 7.2, 7.8, 7.6, origin.yaw);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.2, 8), this.materials.lavaGlow);
    crown.position.set(origin.x, y + 8.9, origin.z);
    crown.castShadow = true;
    this.scene.add(crown);
    this.addTarget(origin.x + 8.8, origin.z - 4.6, origin.yaw - 1.25, 0.48, { challengeId: "ashenTargets", challengeLabel: "Ashen Highlands Trials", yOffset: 2.4 });
    this.interactables.push({
      id: "infernoheart-ember-peak-clue",
      type: "lore-note",
      name: "Ember Peak Tablet",
      prompt: "E Read hot tablet",
      position: new THREE.Vector3(origin.x - 2, y + 1.4, origin.z + 1.8),
      radius: 3.2,
      text: "Infernoheart was sealed where the mountain breathes. Only clean shots can wake the old mechanisms.",
    });
  }

  addObsidianCitadel(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const keep = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.8, 3.4), this.materials.obsidian);
    keep.position.y = 2.4;
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.28), this.materials.lavaGlow);
    gate.position.set(0, 1.05, 1.72);
    [-1.8, 1.8].forEach((xOffset) => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 5), this.materials.ashStone);
      fang.position.set(xOffset, 5.4, 0);
      group.add(fang);
    });
    group.add(keep, gate);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 4.4, 3.7, 4.9, origin.yaw);
    this.addTarget(origin.x - 6.8, origin.z + 4.2, origin.yaw + 1.4, 0.46, { challengeId: "ashenMechanisms", challengeLabel: "Forgotten Fire Mechanisms", yOffset: 1.25 });
  }

  addAshfallBasin(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.8, 0.28, 18), this.materials.ashField);
    basin.position.set(origin.x, y + 0.14, origin.z);
    basin.scale.set(1.15, 1, 0.78);
    basin.rotation.y = origin.yaw;
    this.scene.add(basin);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.1 + (index % 2) * 0.45, 5), this.materials.obsidian);
      shard.position.set(origin.x + Math.sin(angle) * 3.6, y + 0.55, origin.z + Math.cos(angle) * 2.4);
      shard.rotation.z = Math.sin(index) * 0.2;
      shard.castShadow = true;
      this.scene.add(shard);
    }
    this.addTarget(origin.x + 5.7, origin.z + 4.4, origin.yaw - 1.05, 0.44, { challengeId: "ashenTargets", challengeLabel: "Ashen Highlands Trials", yOffset: 0.5 });
    this.addSimpleLandmarkPickup(origin.x - 2.8, origin.z - 2.2, "Volcanic Relic", 58, "A warm relic marked by old highland archers.");
  }

  addFirewatchSpire(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.25, 6.2, 7), this.materials.emberRock);
    spire.position.set(origin.x, y + 3.1, origin.z);
    spire.castShadow = true;
    this.scene.add(spire);
    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 3.0), this.materials.weatheredDock);
    platform.position.set(origin.x, y + 5.4, origin.z);
    platform.rotation.y = origin.yaw;
    this.scene.add(platform);
    this.addCollisionCylinder(origin.x, origin.z, 1.15, 6.4);
    this.addTarget(origin.x + 7.6, origin.z - 5.2, origin.yaw - 1.5, 0.48, { challengeId: "firewatchRange", challengeLabel: "Firewatch Range", yOffset: 3.0 });
  }

  addMoltenHollow(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.34, 8, 30, Math.PI), this.materials.obsidian);
    mouth.position.set(origin.x, y + 2.1, origin.z);
    mouth.rotation.set(Math.PI, 0, origin.yaw);
    this.scene.add(mouth);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), this.materials.lava);
    glow.position.set(origin.x, y + 0.18, origin.z);
    glow.rotation.x = -Math.PI / 2;
    this.scene.add(glow);
    this.addCollisionCylinder(origin.x - 2.0, origin.z, 0.64, 3.2);
    this.addCollisionCylinder(origin.x + 2.0, origin.z, 0.64, 3.2);
    this.addTarget(origin.x - 5.8, origin.z - 3.8, origin.yaw + 1.75, 0.44, { challengeId: "ashenMechanisms", challengeLabel: "Forgotten Fire Mechanisms", yOffset: 0.9 });
    this.addRareLootCache(origin.x + 3.4, origin.z + 2.8, "Molten Hollow Core", "epic", "A volcanic upgrade material placeholder for Arc 1 crafting.");
  }

  addAshenHeatZones() {
    [
      { id: "heat-ember-peak", name: "Ember Peak Heat", x: -146, z: 150, radius: 8.2, intensity: 0.78 },
      { id: "heat-lava-river", name: "Lava River Heat", x: -135, z: 126, radius: 7.2, intensity: 0.62 },
      { id: "heat-molten-hollow", name: "Molten Hollow Heat", x: -158, z: 126, radius: 7.8, intensity: 0.7 },
      { id: "heat-firewatch", name: "Firewatch Vent Field", x: -104, z: 151, radius: 6.8, intensity: 0.52 },
    ].forEach((zone) => this.addHeatZone(zone));
  }

  addHeatZone({ id, name, x, z, radius, intensity }) {
    const y = this.terrain.getHeightAt(x, z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), this.materials.lavaGlow);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y + 0.05, z);
    disc.material = disc.material.clone();
    disc.material.transparent = true;
    disc.material.opacity = 0.18;
    this.scene.add(disc);
    this.heatZones.push({ id, name, position: new THREE.Vector3(x, y, z), radius, intensity });
  }

  getHeatAt(position) {
    if (!this.heatZones?.length) {
      return { intensity: 0, zone: null };
    }
    return this.heatZones.reduce((hottest, zone) => {
      const distance = Math.hypot(position.x - zone.position.x, position.z - zone.position.z);
      if (distance > zone.radius) return hottest;
      const falloff = 1 - distance / zone.radius;
      const intensity = (zone.intensity ?? 0.5) * (0.55 + falloff * 0.45);
      return intensity > hottest.intensity ? { intensity, zone } : hottest;
    }, { intensity: 0, zone: null });
  }

  getHeatMovementMultiplierAt(position, resistance = 0) {
    const heat = this.getHeatAt(position);
    if (heat.intensity <= 0.05) return 1;
    const mitigated = Math.max(0, heat.intensity - resistance * 0.65);
    return THREE.MathUtils.clamp(1 - mitigated * 0.12, 0.88, 1);
  }

  addAshenRewards() {
    this.addRareLootCache(-120.4, 121.8, "Obsidian Fletching", "rare", "Sharp volcanic fletching for future destructive arrows.");
    this.addRareLootCache(-148.8, 151.6, "Infernoheart Ember", "legendary", "A legendary bow clue held near Ember Peak.");
    this.addRareLootCache(-101.5, 150.4, "Firewatch Lens", "epic", "A heat-proof lens reserved for Master Archer quests.");
    this.addLegendaryHint(-145.4, 148.2, "Infernoheart Seal", "Find volcanic mechanisms, complete the fire trials, and defeat the Inferno Behemoth to unlock Infernoheart.");
  }

  addStarfallVale() {
    this.starfallVale = { x: 142, z: 42, yaw: 0.18, scale: 1 };
    this.starfallObservatory = { x: 132, z: 62, yaw: -0.28 };
    this.moonspireRidge = { x: 162, z: 58, yaw: 0.52 };
    this.celestialBasin = { x: 144, z: 44, yaw: 0.12 };
    this.shatteredSkyBridge = { x: 154, z: 34, yaw: -0.62 };
    this.crystalheartGrove = { x: 124, z: 38, yaw: 0.36 };
    this.astralSanctum = { x: 166, z: 72, yaw: -0.36 };
    this.celestialEnergyNodes = [];

    this.addStarfallRoute();
    this.addStarfallValleyMass();
    this.addStarfallObservatory(this.starfallObservatory);
    this.addMoonspireRidge(this.moonspireRidge);
    this.addCelestialBasin(this.celestialBasin);
    this.addShatteredSkyBridge(this.shatteredSkyBridge);
    this.addCrystalheartGrove(this.crystalheartGrove);
    this.addAstralSanctum(this.astralSanctum);
    this.addStarfallEnergySystem();
    this.addStarfallRewards();
  }

  addStarfallRoute() {
    [
      [64, 52, 4.2, 1.1, 0.85], [82, 50, 4.8, 1.15, 0.9], [101, 48, 5.2, 1.2, 0.96],
      [119, 45, 5.4, 1.25, 1.12], [136, 42, 5.7, 1.25, 1.26],
    ].forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth), this.materials.visibleTrail);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.06, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[102, 48, 1.18, [["Starfall", 0.16]]], [139, 43, 0.92, [["Observatory", -0.32], ["Sanctum", 0.35]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.45, 7), this.materials.astralStone);
      post.position.set(x, y + 0.72, z);
      this.scene.add(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.28 - index * 0.08, 0.18, 0.08), this.materials.astralGold);
        board.position.set(x + Math.sin(yaw + offset) * 0.42, y + 1.18 - index * 0.22, z + Math.cos(yaw + offset) * 0.42);
        board.rotation.y = yaw + offset;
        this.scene.add(board);
      });
    });
  }

  addStarfallValleyMass() {
    if (this.performanceMode) {
      return;
    }
    [
      [112, 31, 5.4, 2.6, 0.1], [118, 58, 4.8, 3.1, -0.28], [145, 27, 6.0, 2.9, 0.4],
      [170, 42, 5.8, 3.2, -0.1], [158, 80, 6.2, 3.0, 0.22], [131, 74, 5.2, 2.8, -0.35],
    ].forEach(([x, z, height, scale, yaw]) => this.addStarfallTree(x, z, height, scale, yaw));

    [
      [121, 48, 1.1], [135, 35, 1.25], [151, 50, 1.4], [165, 64, 1.1], [131, 70, 0.95],
    ].forEach(([x, z, scale]) => this.addStarCrystalCluster(x, z, scale));

    [
      [116, 68, 3.4, 1.3], [151, 25, 4.2, 1.0], [171, 53, 3.8, 1.5], [140, 82, 3.0, 0.7],
    ].forEach(([x, z, height, phase]) => this.addFloatingStarStone(x, z, height, phase));

    [[133, 44, 18, 3.2, 0.24], [153, 46, 15, 2.4, -0.22]].forEach(([x, z, width, depth, yaw]) => {
      const river = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.starWater);
      river.position.set(x, this.terrain.getHeightAt(x, z) + 0.075, z);
      river.rotation.set(-Math.PI / 2, 0, yaw);
      this.scene.add(river);
    });
  }

  addStarfallTree(x, z, height, scale = 1, yaw = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.42 * scale, height, 8), this.materials.elderBark);
    trunk.position.y = height * 0.5;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), this.materials.starGrass);
    crown.position.y = height + 0.4;
    crown.scale.set(1.25 * scale, 0.72 * scale, 1.05 * scale);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 6), this.materials.starCrystal);
    glow.position.set(0.38 * scale, height + 0.55, 0.28 * scale);
    group.add(trunk, crown, glow);
    this.scene.add(group);
    this.addCollisionCylinder(x, z, 0.42 * scale, height);
  }

  addStarCrystalCluster(x, z, scale = 1) {
    const y = this.terrain.getHeightAt(x, z);
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI * 0.5 + scale;
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.16 * scale, (0.9 + index * 0.18) * scale, 5), index % 2 ? this.materials.moonCrystal : this.materials.starCrystal);
      crystal.position.set(x + Math.sin(angle) * 0.55 * scale, y + 0.45 * scale, z + Math.cos(angle) * 0.55 * scale);
      crystal.rotation.z = Math.sin(index) * 0.18;
      crystal.castShadow = true;
      this.scene.add(crystal);
    }
    const light = new THREE.PointLight(0xb99cff, 0.48 * scale, 8 * scale, 2.2);
    light.position.set(x, y + 1.2 * scale, z);
    this.scene.add(light);
  }

  addFloatingStarStone(x, z, height = 3.2, phase = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), this.materials.astralStone);
    stone.position.set(x, y + height, z);
    stone.rotation.set(0.4 + phase, phase * 0.7, 0.18);
    stone.scale.set(1.3, 0.58, 0.95);
    stone.castShadow = true;
    this.scene.add(stone);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.025, 8, 32), this.materials.astralGold);
    ring.position.set(x, y + height - 0.08, z);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
  }

  addStarfallObservatory(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 4.0, 1.2, 10), this.materials.astralStone);
    base.position.y = 0.6;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.35, 18, 10), this.materials.moonCrystal);
    dome.position.y = 2.0;
    dome.scale.y = 0.42;
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 3.2, 8), this.materials.astralGold);
    scope.position.set(0, 2.45, -1.3);
    scope.rotation.x = Math.PI / 2.7;
    group.add(base, dome, scope);
    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 3.5, 2.6);
    this.addTarget(origin.x - 7.8, origin.z + 4.4, origin.yaw + 1.35, 0.5, { challengeId: "starfallTargets", challengeLabel: "Starfall Celestial Trials", yOffset: 1.8 });
    this.interactables.push({
      id: "starpiercer-observatory-records",
      type: "lore-note",
      name: "Observatory Records",
      prompt: "E Read records",
      position: new THREE.Vector3(origin.x + 1.4, y + 1.2, origin.z - 1.6),
      radius: 3,
      text: "The masters watched fallen stars, then learned to loose arrows between heartbeats.",
    });
  }

  addMoonspireRidge(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 7.4, 7), this.materials.astralStone);
    spire.position.set(origin.x, y + 3.7, origin.z);
    spire.castShadow = true;
    this.scene.add(spire);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 6), this.materials.moonCrystal);
    crown.position.set(origin.x, y + 8.0, origin.z);
    this.scene.add(crown);
    this.addCollisionCylinder(origin.x, origin.z, 1.35, 7.7);
    this.addTarget(origin.x + 7.5, origin.z - 5.2, origin.yaw - 1.3, 0.46, { challengeId: "starfallTargets", challengeLabel: "Starfall Celestial Trials", yOffset: 3.1 });
  }

  addCelestialBasin(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 7.4, 0.24, 20), this.materials.starMeadow);
    basin.position.set(origin.x, y + 0.12, origin.z);
    basin.scale.set(1.12, 1, 0.78);
    basin.rotation.y = origin.yaw;
    this.scene.add(basin);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), this.materials.starWater);
    pool.position.set(origin.x, y + 0.16, origin.z);
    pool.rotation.x = -Math.PI / 2;
    this.scene.add(pool);
    this.addEnergySource("basin-star", origin.x - 3.4, origin.z + 2.2, "Basin Starwell");
  }

  addShatteredSkyBridge(origin) {
    for (let index = 0; index < 5; index += 1) {
      const x = origin.x + (index - 2) * 2.1;
      const z = origin.z + Math.sin(index) * 0.9;
      const y = this.terrain.getHeightAt(x, z);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.22, 2.4), this.materials.astralStone);
      slab.position.set(x, y + 1.05 + Math.sin(index * 1.7) * 0.28, z);
      slab.rotation.set(0.02 * index, origin.yaw + Math.sin(index) * 0.12, Math.sin(index) * 0.08);
      slab.castShadow = true;
      this.scene.add(slab);
      if (index % 2 === 0) this.addCollisionBox(x, z, 1.65, 2.35, 0.45, origin.yaw, 0.8);
    }
    this.addTarget(origin.x + 8.2, origin.z + 4.6, origin.yaw - 1.8, 0.42, { challengeId: "celestialMechanisms", challengeLabel: "Celestial Mechanisms", yOffset: 2.6 });
  }

  addCrystalheartGrove(origin) {
    [[-3.8, -2.8, 4.8], [2.5, -3.4, 5.2], [-2.5, 3.6, 4.5], [3.7, 3.1, 4.9]].forEach(([dx, dz, height], index) => {
      this.addStarfallTree(origin.x + dx, origin.z + dz, height, 1.05 + index * 0.08, origin.yaw + index * 0.2);
    });
    this.addStarCrystalCluster(origin.x, origin.z, 1.55);
    this.addSimpleLandmarkPickup(origin.x + 3.4, origin.z - 2.7, "Crystalheart Seed", 72, "A luminous seed kept for future celestial gear crafting.");
  }

  addAstralSanctum(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    [-2.4, 0, 2.4].forEach((xOffset, index) => {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.46, 3.2 + index * 0.4, 0.54), this.materials.astralStone);
      arch.position.set(xOffset, 1.6 + index * 0.2, 0);
      group.add(arch);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.44, 0.62), this.materials.astralGold);
    lintel.position.y = 3.42;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), this.materials.starCrystal);
    core.position.set(0, 1.72, -0.15);
    group.add(lintel, core);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 6.0, 0.7, 3.6, origin.yaw);
    this.addEnergySource("sanctum-core", origin.x - 2.8, origin.z + 3.1, "Sanctum Celestial Core");
  }

  addEnergySource(id, x, z, name) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.34, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.2, 9), this.materials.astralStone);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), this.materials.starCrystal);
    core.position.y = 0.42;
    group.add(base, core);
    this.scene.add(group);
    this.interactables.push({
      id: `celestial-energy-${id}`,
      type: "celestial-energy",
      name,
      prompt: "E Channel energy",
      position: new THREE.Vector3(x, y + 0.58, z),
      radius: 2.6,
      group,
      text: `${name} hums awake. A hidden Starfall route glimmers for a future trial.`,
    });
    this.celestialEnergyNodes.push({ id, name, position: new THREE.Vector3(x, y, z), active: false });
  }

  activateCelestialEnergy(interactable) {
    const nodeId = interactable.id?.replace("celestial-energy-", "");
    const node = this.celestialEnergyNodes?.find((item) => item.id === nodeId);
    if (!node || node.active) {
      return false;
    }
    node.active = true;
    interactable.read = true;
    const color = 0xfff0c2;
    interactable.group?.traverse?.((child) => {
      if (child.isMesh && child.material?.emissive) {
        child.material = child.material.clone();
        child.material.emissive.setHex(color);
        child.material.emissiveIntensity = 1.1;
      }
    });
    const light = new THREE.PointLight(color, 0.9, 10, 2.1);
    light.position.copy(interactable.position).add(new THREE.Vector3(0, 0.8, 0));
    this.scene.add(light);
    window.dispatchEvent(new CustomEvent("echo-archer:celestial-energy", {
      detail: {
        id: node.id,
        name: node.name,
        activeCount: this.celestialEnergyNodes.filter((item) => item.active).length,
        total: this.celestialEnergyNodes.length,
      },
    }));
    return true;
  }

  addStarfallEnergySystem() {
    this.addEnergySource("observatory-lens", this.starfallObservatory.x + 3.1, this.starfallObservatory.z - 2.2, "Observatory Star Lens");
    this.addEnergySource("moonspire-focus", this.moonspireRidge.x - 2.2, this.moonspireRidge.z + 2.4, "Moonspire Focus");
    const reveal = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.2), this.materials.visibleTrail);
    reveal.position.set(158, this.terrain.getHeightAt(158, 64) + 0.075, 64);
    reveal.rotation.set(-Math.PI / 2, 0, -0.42);
    reveal.material = reveal.material.clone();
    reveal.material.opacity = 0.42;
    this.scene.add(reveal);
  }

  addStarfallRewards() {
    this.addRareLootCache(128.6, 64.8, "Astral Lens", "epic", "An observatory lens tied to the Starpiercer legendary bow quest.");
    this.addRareLootCache(162.4, 57.2, "Moonspire Fletching", "rare", "Pale fletching saved for future celestial arrows.");
    this.addRareLootCache(166.8, 72.8, "Starpiercer Fragment", "legendary", "A bow fragment that will answer only after the Astral Guardian falls.");
    this.addSimpleLandmarkPickup(147.2, 43.5, "Fallen Star Shard", 84, "A warm shard from the valley's first night.");
    this.addLegendaryHint(133.2, 61.3, "Starpiercer Records", "Read the observatory, channel celestial energy, complete the Starfall trials, and face the Astral Guardian.");
    this.interactables.push({
      id: "master-archer-rumor-starfall",
      type: "lore-note",
      name: "Guild Rumor: Forgotten Masters",
      prompt: "E Read rumor",
      position: new THREE.Vector3(124.4, this.terrain.getHeightAt(124.4, 39.2) + 0.9, 39.2),
      radius: 2.6,
      text: "Rowan once said the forgotten masters did not train in towns. They trained where the sky itself could judge a shot.",
    });
  }

  addCoastalCliffs() {
    this.coastalCliffs = { x: 102, z: -86, yaw: -0.72, scale: 1 };
    this.brokenLighthouse = { x: 115, z: -92, yaw: 0.28 };
    this.seaCaveShrine = { x: 96, z: -118, yaw: -0.18 };
    this.shipwreckCove = { x: 121, z: -113, yaw: 0.82 };
    this.windspireBridge = { x: 84, z: -80, yaw: -0.62 };

    this.addCoastalTransitionTrail();
    this.addCoastalOceanView();
    this.addCoastalCliffFields();
    this.addBrokenLighthouse(this.brokenLighthouse);
    this.addSeaCaveShrine(this.seaCaveShrine);
    this.addShipwreckCove(this.shipwreckCove);
    this.addWindspireBridge(this.windspireBridge);
    this.addCoastalRewards();
  }

  addCoastalTransitionTrail() {
    const trailPoints = [
      [54, -18, 4.3, 1.05, -0.62], [63, -27, 4.5, 1.05, -0.7], [72, -38, 4.2, 1.0, -0.64],
      [82, -50, 4.6, 1.08, -0.54], [91, -64, 4.8, 1.08, -0.42], [101, -78, 5.4, 1.12, -0.34],
    ];
    trailPoints.forEach(([x, z, width, depth, yaw]) => {
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, depth), this.materials.sand);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.055, z);
      path.rotation.y = yaw;
      path.receiveShadow = true;
      this.scene.add(path);
    });
    [[60, -25, -0.8, [["Coast", 0.22]]], [94, -72, -0.38, [["Lighthouse", 0.24], ["Cove", -0.32]]]].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.25, 7), this.materials.weatheredDock);
      post.position.set(x, y + 0.62, z);
      post.rotation.z = -0.08;
      post.castShadow = true;
      this.scene.add(post);
      this.colliders.push(post);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.0 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.36, y + 1.05 - index * 0.22, z + Math.cos(yaw + offset) * 0.36);
        board.rotation.y = yaw + offset;
        board.rotation.z = 0.06;
        board.castShadow = true;
        this.scene.add(board);
      });
    });
  }

  addCoastalOceanView() {
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(95, 80, 1, 1), this.materials.seaWater);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(136, this.terrain.getHeightAt(118, -112) + 0.03, -118);
    ocean.receiveShadow = true;
    this.scene.add(ocean);

    for (let index = 0; index < 10; index += 1) {
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(6 + (index % 3) * 2, 0.42), this.materials.seaFoam);
      foam.rotation.set(-Math.PI / 2, 0, -0.15 + index * 0.04);
      foam.position.set(103 + index * 3.4, this.terrain.getHeightAt(104 + index * 2.4, -123) + 0.09, -121 - (index % 2) * 2.2);
      this.scene.add(foam);
    }
  }

  addCoastalCliffFields() {
    if (this.performanceMode) {
      return;
    }
    const sandPatches = [
      [102, -86, 18, 11, -0.32], [116, -105, 18, 12, 0.28], [92, -113, 14, 9, -0.06],
      [84, -79, 14, 8, -0.6], [124, -118, 12, 8, 0.42],
    ];
    sandPatches.forEach(([x, z, width, depth, yaw]) => {
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.sand);
      patch.rotation.set(-Math.PI / 2, 0, yaw);
      patch.position.set(x, this.terrain.getHeightAt(x, z) + 0.04, z);
      patch.receiveShadow = true;
      this.scene.add(patch);
    });

    const cliffRocks = [
      [95, -78, 1.4], [108, -83, 1.8], [126, -101, 1.6], [113, -122, 1.3], [88, -108, 1.1],
      [78, -75, 1.2], [103, -101, 1.0], [125, -89, 1.35],
    ];
    cliffRocks.forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, this.materials.cliffStone);
      rock.position.set(x, this.terrain.getHeightAt(x, z) + scale * 0.28, z);
      rock.scale.set(scale * 1.35, scale * 0.7, scale * 0.9);
      rock.rotation.set(index * 0.18, index * 0.55, -0.18);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.addCollisionCylinder(x, z, scale * 0.72, 1.7);
    });

    [[91, -73], [98, -90], [110, -76], [80, -88], [118, -82], [90, -122], [106, -114]].forEach(([x, z], index) => {
      this.addPine(x, z, 3.3 + (index % 3) * 0.35, index % 2 ? this.materials.seaGrass : this.materials.pine);
      this.addCollisionCylinder(x, z, 0.45, 2.4);
    });

    [[104, -118, 2.2], [127, -115, 1.8], [117, -121, 1.4]].forEach(([x, z, radius]) => {
      const pool = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), this.materials.seaWater);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, this.terrain.getHeightAt(x, z) + 0.07, z);
      this.scene.add(pool);
    });
  }

  addBrokenLighthouse(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.65, 0.55, 12), this.materials.cliffStone);
    base.position.y = 0.28;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 3.6, 12), this.materials.lighthouseWhite);
    lower.position.y = 2.2;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.38, 0.42, 12), this.materials.lighthouseRed);
    band.position.y = 3.35;
    const brokenTop = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.22, 1.25, 9, 1, true), this.materials.cliffStone);
    brokenTop.position.y = 4.65;
    brokenTop.rotation.z = -0.12;
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), this.materials.warmWindow);
    lantern.position.set(0.2, 5.15, 0.1);
    group.add(base, lower, band, brokenTop, lantern);

    for (let index = 0; index < 4; index += 1) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.18), this.materials.weatheredDock);
      beam.position.set(Math.sin(index * Math.PI * 0.5) * 1.35, 4.2, Math.cos(index * Math.PI * 0.5) * 1.35);
      beam.rotation.z = (index % 2 ? 0.2 : -0.18);
      beam.castShadow = true;
      group.add(beam);
    }

    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 1.65, 5.2);
    this.addTarget(origin.x - 6.2, origin.z + 2.6, origin.yaw + 1.15, 0.55, { challengeId: "coastalTargets", challengeLabel: "Coastal Cliffs Range", yOffset: 0.7 });
  }

  addSeaCaveShrine(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;

    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.28, 8, 32, Math.PI), this.materials.cliffStone);
    arch.position.y = 1.32;
    arch.rotation.z = Math.PI;
    const darkMouth = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.35), this.materials.caveStone);
    darkMouth.position.set(0, 1.12, -0.12);
    const shrineStone = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.35, 0.36), this.materials.glyphStone);
    shrineStone.position.set(0, 0.86, 1.25);
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 5), this.materials.crystalBlue);
    crystal.position.set(0, 1.65, 1.28);
    group.add(arch, darkMouth, shrineStone, crystal);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z - 0.1, 4.2, 0.55, 2.6, origin.yaw);
    this.addTarget(origin.x + 4.8, origin.z - 4.8, origin.yaw - 0.85, 0.42, { challengeId: "seaCaveShrine", challengeLabel: "Sea Cave Shrine", yOffset: 0.45 });
    this.interactables.push({
      id: "tidepiercer-shrine-clue",
      type: "lore-note",
      name: "Sea Cave Shrine",
      prompt: "E Read tide carving",
      position: new THREE.Vector3(origin.x, y + 1.25, origin.z + 1.25),
      radius: 3,
      text: "Wind bends the arrow. Tidepiercer belongs to the archer who reads the coast before releasing.",
    });
  }

  addShipwreckCove(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;

    const keel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 0.42), this.materials.weatheredDock);
    keel.position.y = 0.42;
    keel.rotation.z = -0.1;
    group.add(keel);
    for (let index = -2; index <= 2; index += 1) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.75 - Math.abs(index) * 0.18, 0.22), this.materials.weatheredDock);
      rib.position.set(index * 0.9, 0.95, 0.15);
      rib.rotation.z = index * 0.12;
      rib.castShadow = true;
      group.add(rib);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 8), this.materials.agedWood);
    mast.position.set(-1.1, 1.45, -0.4);
    mast.rotation.z = 0.44;
    mast.castShadow = true;
    group.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), this.materials.canvas);
    sail.position.set(-0.6, 1.55, -0.55);
    sail.rotation.set(0.2, 0.05, 0.36);
    group.add(sail);
    this.scene.add(group);
    this.addCollisionBox(origin.x, origin.z, 5.5, 1.0, 1.6, origin.yaw);
    this.addTarget(origin.x - 5.5, origin.z - 2.2, origin.yaw + 1.9, 0.48, { challengeId: "coastalTargets", challengeLabel: "Coastal Cliffs Range", yOffset: 0.36 });
    this.interactables.push({
      id: "shipwreck-tidepiercer-clue",
      type: "lore-note",
      name: "Salt-Stained Logbook",
      prompt: "E Read logbook",
      position: new THREE.Vector3(origin.x + 1.4, y + 0.85, origin.z + 1.1),
      radius: 2.8,
      text: "The lighthouse bird guards the final string. The sea cave test names the bow Tidepiercer.",
    });
  }

  addWindspireBridge(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y + 0.2, origin.z);
    group.rotation.y = origin.yaw;

    for (let index = 0; index < 8; index += 1) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.13, 1.42), this.materials.weatheredDock);
      plank.position.set((index - 3.5) * 0.82, 0.18 + Math.sin(index) * 0.025, 0);
      plank.rotation.z = Math.sin(index * 1.7) * 0.035;
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }
    [-1, 1].forEach((side) => {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 0.08), this.materials.rope);
      rope.position.set(0, 0.68, side * 0.72);
      group.add(rope);
      [-3.5, 3.5].forEach((x) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.35, 7), this.materials.weatheredDock);
        post.position.set(x, 0.62, side * 0.72);
        post.castShadow = true;
        group.add(post);
      });
    });
    this.scene.add(group);
    this.addTarget(origin.x + 6.8, origin.z - 4.2, origin.yaw - 1.25, 0.5, { challengeId: "coastalTargets", challengeLabel: "Coastal Cliffs Range", yOffset: 1.15 });
    this.addSimpleLandmarkPickup(origin.x - 4.2, origin.z + 2.5, "Windspire Crest", 34, "A cliffside crest etched with wind arrows.");
  }

  addCoastalRewards() {
    this.addRareLootCache(107.5, -100.5, "Sea Glass Fletching", "rare", "A coastal upgrade component reserved for future bow crafting.");
    this.addRareLootCache(124.5, -120.5, "Stormtalon Feather", "epic", "A huge feather caught in the shipwreck timbers.");
    this.addSimpleLandmarkPickup(93.5, -108.2, "Tidepool Cache", 38, "A small cache tucked between wet stones.");
    this.addLegendaryHint(118.6, -108.8, "Tidepiercer Clue", "Shipwreck marks say Tidepiercer favors patient archers and long wind-read shots.");
  }

  addFrostpeakMountains() {
    this.frostpeak = { x: -96, z: 92, yaw: -0.35, scale: 1 };
    this.frozenWatchtower = { x: -74, z: 78, yaw: 0.38 };
    this.icefallCavern = { x: -105, z: 72, yaw: 0.15 };
    this.frostTemple = { x: -88, z: 104, yaw: -0.62 };
    this.summitOverlook = { x: -116, z: 116, yaw: -0.25 };
    this.addFrostpeakTrails();
    this.addFrostpeakSnowFields();
    this.addFrozenWatchtower(this.frozenWatchtower);
    this.addIcefallCavern(this.icefallCavern);
    this.addFrostTemple(this.frostTemple);
    this.addSummitOverlook(this.summitOverlook);
    this.addFrostpeakRewards();
  }

  addFrostpeakSnowFields() {
    if (this.performanceMode) {
      return;
    }
    const patches = [
      [-82, 76, 13, 8, -0.28], [-96, 90, 18, 10, 0.18], [-112, 108, 20, 12, -0.42],
      [-74, 100, 15, 8, 0.32], [-108, 72, 16, 7, 0.1],
    ];
    patches.forEach(([x, z, width, depth, yaw]) => {
      const snow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), this.materials.snow);
      snow.rotation.set(-Math.PI / 2, 0, yaw);
      snow.position.set(x, this.terrain.getHeightAt(x, z) + 0.035, z);
      snow.receiveShadow = true;
      this.scene.add(snow);
    });
    [[-76, 70], [-83, 84], [-91, 76], [-100, 86], [-116, 98], [-122, 113], [-68, 93], [-96, 112]].forEach(([x, z], index) => {
      this.addPine(x, z, 4.2 + (index % 3) * 0.6, this.materials.frostPine);
      this.addCollisionCylinder(x, z, 0.5, 2.6);
    });
    [[-84, 88, 0.8], [-102, 98, 1.1], [-118, 104, 0.9], [-95, 69, 0.7], [-72, 86, 0.75]].forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 ? this.materials.frostRock : this.materials.blueIce);
      rock.position.set(x, this.terrain.getHeightAt(x, z) + scale * 0.25, z);
      rock.scale.set(scale * 1.4, scale * 0.58, scale);
      rock.rotation.set(index * 0.2, index * 0.6, -0.12);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.addCollisionCylinder(x, z, scale * 0.7, 1.5);
    });
    [[-94, 82, 13, 2.6, -0.18], [-106, 90, 14, 2.8, -0.06], [-118, 100, 12, 2.4, 0.16]].forEach(([x, z, width, depth, yaw]) => {
      const river = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.blueIce);
      river.rotation.set(-Math.PI / 2, 0, yaw);
      river.position.set(x, this.terrain.getHeightAt(x, z) + 0.07, z);
      river.receiveShadow = true;
      this.scene.add(river);
    });
  }

  addFrostpeakTrails() {
    for (let index = 0; index < 18; index += 1) {
      const t = index / 17;
      const x = -50 + (-114 + 50) * t + Math.sin(t * Math.PI * 4) * 4.2;
      const z = 42 + (112 - 42) * t + Math.cos(t * Math.PI * 2) * 2.4;
      const y = this.terrain.getHeightAt(x, z);
      const trail = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.045, 1.05), this.materials.packedSnow);
      trail.position.set(x, y + 0.05, z);
      trail.rotation.y = -0.72 + Math.sin(t * 5) * 0.18;
      trail.receiveShadow = true;
      this.scene.add(trail);
    }
    [[-59, 54, -0.55], [-73, 70, -0.7], [-92, 88, -0.42], [-108, 103, -0.3]].forEach(([x, z, yaw]) => {
      this.addAbandonedArcheryMarker(x, z, yaw, 0);
    });
  }

  addFrozenWatchtower(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const tower = new THREE.Group();
    tower.position.set(origin.x, y, origin.z);
    tower.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.25, 2.1, 8), this.materials.frostRock);
    base.position.y = 1.05;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.24, 8), this.materials.packedSnow);
    deck.position.y = 2.28;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.9, 5), this.materials.blueIce);
    roof.position.y = 3.05;
    tower.add(base, deck, roof);
    this.scene.add(tower);
    this.addCollisionCylinder(origin.x, origin.z, 1.6, 3.2);
    this.addTarget(origin.x + 5.8, origin.z + 1.5, origin.yaw - 1.2, 0.56, { challengeId: "frostpeakTargets", challengeLabel: "Frostpeak Range", yOffset: 0.25 });
  }

  addIcefallCavern(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const cavern = new THREE.Group();
    cavern.position.set(origin.x, y, origin.z);
    cavern.rotation.y = origin.yaw;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.22, 8, 28, Math.PI), this.materials.frostRock);
    arch.position.y = 1.2;
    arch.rotation.z = Math.PI;
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.3), this.materials.blueIce);
    curtain.position.set(0, 1.15, -0.1);
    cavern.add(arch, curtain);
    this.scene.add(cavern);
    this.addCollisionBox(origin.x, origin.z, 3.8, 0.5, 2.5, origin.yaw);
    this.addTarget(origin.x - 4.8, origin.z + 4.5, origin.yaw + 1.4, 0.48, { challengeId: "frostpeakTargets", challengeLabel: "Frostpeak Range", yOffset: 0.5 });
  }

  addFrostTemple(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const temple = new THREE.Group();
    temple.position.set(origin.x, y, origin.z);
    temple.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 0.34, 9), this.materials.packedSnow);
    base.position.y = 0.17;
    const monolith = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.8, 0.5), this.materials.blueIce);
    monolith.position.set(0, 1.55, 0.35);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 8, 32), this.materials.crystalBlue);
    ring.position.set(0, 1.75, 0.67);
    ring.rotation.x = Math.PI / 2;
    temple.add(base, monolith, ring);
    this.scene.add(temple);
    this.addCollisionBox(origin.x, origin.z + 0.35, 1.5, 0.7, 2.9, origin.yaw);
    this.interactables.push({
      id: "frostbite-shrine-clue",
      type: "lore-note",
      name: "Frost Shrine Inscription",
      prompt: "E Study shrine",
      position: new THREE.Vector3(origin.x, y + 1.2, origin.z),
      radius: 3,
      text: "Precision opens the ice. The guardian carries the final proof for Frostbite.",
    });
    this.addTarget(origin.x + 4.2, origin.z - 5.2, origin.yaw - 0.8, 0.44, { challengeId: "frostpeakTargets", challengeLabel: "Frostpeak Range", yOffset: 0.42 });
  }

  addSummitOverlook(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const shelf = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.1, 0.42, 10), this.materials.frostRock);
    shelf.position.set(origin.x, y + 0.21, origin.z);
    shelf.scale.set(1.35, 1, 0.72);
    shelf.rotation.y = origin.yaw;
    shelf.receiveShadow = true;
    shelf.castShadow = true;
    this.scene.add(shelf);
    this.addCollisionCylinder(origin.x + 2.2, origin.z - 1.1, 0.5, 1.3);
    this.interactables.push({
      id: "summit-overlook-view",
      type: "lookout",
      name: "Summit Overlook",
      prompt: "E Look out",
      position: new THREE.Vector3(origin.x, y + 0.8, origin.z),
      radius: 4,
      focus: new THREE.Vector3(-78, y + 8, 72),
      text: "From Frostpeak, the old world looks warm and far away.",
    });
  }

  addFrostpeakRewards() {
    this.addRareLootCache(-82, 101, "Frostpeak Survey Pin", "rare", "A cold-bitten pin marking the first route through Frostpeak.");
    this.addRareLootCache(-112, 118, "Summit Ice Crystal", "epic", "A clear crystal that hums near legendary bow carvings.");
    this.addSimpleLandmarkPickup(-96, 84, "Frozen Trail Cache", 36, "A small cache left by mountain archers.");
  }

  addArchersGuild() {
    const origin = { x: -56, z: 28, yaw: -0.55, scale: 1 };
    this.archersGuild = origin;
    const group = new THREE.Group();
    group.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z), origin.z);
    group.rotation.y = origin.yaw;

    const hall = new THREE.Group();
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.34, 5.2), this.materials.darkStone);
    foundation.position.y = 0.18;
    foundation.receiveShadow = true;
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.25, 4.35), this.materials.agedWood);
    body.position.y = 1.45;
    body.castShadow = true;
    body.receiveShadow = true;
    const roof = this.createLayeredGableRoof(7.35, 4.8, 2.72, this.materials.barkDark, {
      pitch: 0.42,
      overhang: 0.62,
      thickness: 0.28,
      asymmetry: -0.05,
    });
    const entry = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.72, 0.16), this.materials.warmTrim);
    entry.position.set(0, 1.06, -2.26);
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 10, 32), this.materials.targetGold);
    crest.position.set(0, 2.42, -2.36);
    crest.rotation.x = Math.PI / 2;
    const guildSymbol = this.createGuildSymbol(0.62);
    guildSymbol.position.set(0, 2.42, -2.43);
    guildSymbol.rotation.y = Math.PI / 2;
    hall.add(foundation, body, roof, entry, crest, guildSymbol);
    this.addBuildingCraftDetails(hall, 6.8, 4.35, 2.25, { trim: this.materials.targetGold });

    [-2.7, 2.7].forEach((x) => {
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.08), this.materials.banner);
      banner.position.set(x, 1.95, -2.44);
      banner.castShadow = true;
      hall.add(banner);
    });

    group.add(hall);

    const yard = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 7.2, 0.16, 12), this.materials.groundPath ?? this.materials.cutWood);
    yard.position.set(0, 0.09, -6.2);
    yard.scale.set(1.12, 1, 0.72);
    yard.receiveShadow = true;
    group.add(yard);

    const equipment = new THREE.Group();
    equipment.position.set(4.9, 0, -4.6);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 0.72), this.materials.wood);
    counter.position.y = 0.36;
    counter.castShadow = true;
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.6, 1.9), this.materials.barkDark);
    rack.position.set(1.35, 0.8, 0);
    rack.castShadow = true;
    equipment.add(counter, rack);
    group.add(equipment);

    const gathering = new THREE.Group();
    gathering.position.set(-4.9, 0, -4.8);
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.95), this.materials.cutWood);
    table.position.y = 0.64;
    table.castShadow = true;
    [-0.95, 0.95].forEach((x) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.32), this.materials.wood);
      bench.position.set(x, 0.36, 0.86);
      bench.castShadow = true;
      gathering.add(bench);
    });
    gathering.add(table);
    group.add(gathering);

    [-6.4, -3.2, 0, 3.2, 6.4].forEach((x, index) => {
      const post = new THREE.Mesh(this.geometries.fencePost, this.materials.barkDark);
      post.position.set(x, 0.68, -10.3 + Math.sin(index) * 0.26);
      post.castShadow = true;
      group.add(post);
    });

    this.scene.add(group);

    this.addGuildPath(origin);
    this.addGuildTargets(origin);
    this.addGuildDetails(origin);
    this.addGuildVillageExpansion(origin);
    this.addGuildExpansionReserve(origin);
    this.addCollisionBox(origin.x, origin.z, 7.8, 5.2, 3.2, origin.yaw);
    this.addCollisionBox(origin.x + Math.sin(origin.yaw + Math.PI / 2) * 4.9 + Math.sin(origin.yaw) * -4.6, origin.z + Math.cos(origin.yaw + Math.PI / 2) * 4.9 + Math.cos(origin.yaw) * -4.6, 2.5, 0.9, 1.0, origin.yaw);
    this.addCollisionBox(origin.x + Math.sin(origin.yaw - Math.PI / 2) * 4.9 + Math.sin(origin.yaw) * -4.8, origin.z + Math.cos(origin.yaw - Math.PI / 2) * 4.9 + Math.cos(origin.yaw) * -4.8, 2.5, 0.9, 1.0, origin.yaw);
  }

  getGuildPoint(origin, localX, localZ) {
    return {
      x: origin.x + (Math.sin(origin.yaw + Math.PI / 2) * localX + Math.sin(origin.yaw) * localZ) * origin.scale,
      z: origin.z + (Math.cos(origin.yaw + Math.PI / 2) * localX + Math.cos(origin.yaw) * localZ) * origin.scale,
    };
  }

  addGuildPath(origin) {
    for (let index = 0; index < 10; index += 1) {
      const t = index / 9;
      const x = -38 + (-56 + 38) * t + Math.sin(t * Math.PI * 2) * 1.8;
      const z = 10 + (22 - 10) * t;
      const y = this.terrain.getHeightAt(x, z) + 0.025;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(2.4 - t * 0.4, 0.05, 0.95), this.materials.cutWood);
      stone.position.set(x, y, z);
      stone.rotation.y = -0.75 + Math.sin(t * 3) * 0.12;
      stone.receiveShadow = true;
      this.scene.add(stone);
    }

    [[-43, 14.5, -0.8], [-50, 19.8, -0.65], [-59, 21.2, -0.2]].forEach(([x, z, yaw]) => {
      this.addPine(x, z, 4.2, this.materials.pineDark);
      this.addCollisionCylinder(x, z, 0.5, 2.4);
      this.addAbandonedArcheryMarker(x + 1.2, z - 0.8, yaw, 1);
    });
  }

  addGuildTargets(origin) {
    [
      [-4.7, -12.6, origin.yaw + 0.05, 0.64],
      [0, -13.5, origin.yaw, 0.74],
      [4.9, -12.4, origin.yaw - 0.08, 0.64],
    ].forEach(([localX, localZ, yaw, scale]) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addTarget(point.x, point.z, yaw, scale, {
        challengeId: "guildTargets",
        challengeLabel: "Archer's Guild Range",
        yOffset: 0.18,
      });
    });
  }

  addGuildDetails(origin) {
    const signPoint = this.getGuildPoint(origin, -7.4, -2.3);
    this.addTargetSign(signPoint.x, signPoint.z);
    const cachePoint = this.getGuildPoint(origin, 6.7, 1.8);
    this.addSimpleLandmarkPickup(cachePoint.x, cachePoint.z, "Guild Road Coin", 20, "A coin stamped with the guild crest.");
    [[-7.2, -7.4], [7.1, -7.2], [-6.1, 2.2], [6.2, 2.5]].forEach(([localX, localZ], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.54, 0.62), index % 2 ? this.materials.wood : this.materials.cutWood);
      crate.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.27, point.z);
      crate.rotation.y = origin.yaw + index * 0.31;
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.addCollisionBox(point.x, point.z, 0.8, 0.7, 0.7, crate.rotation.y);
    });
  }

  addGuildVillageExpansion(origin) {
    this.guildVillageServices = {
      guildHall: this.getGuildPoint(origin, 0, -1.6),
      inn: this.getGuildPoint(origin, -14.4, 8.9),
      blacksmith: this.getGuildPoint(origin, -15.6, -4.2),
      bowyer: this.getGuildPoint(origin, 15.1, -4.0),
      stable: this.getGuildPoint(origin, 16.3, 8.8),
      market: this.getGuildPoint(origin, 4.2, 10.5),
      questBoard: this.getGuildPoint(origin, -2.2, 7.4),
      square: this.getGuildPoint(origin, 0.4, 5.6),
      homes: [
        this.getGuildPoint(origin, -22.4, 12.6),
        this.getGuildPoint(origin, -8.2, 17.0),
        this.getGuildPoint(origin, 8.8, 17.2),
        this.getGuildPoint(origin, 22.2, 3.7),
      ],
    };

    this.addGuildVillageRoads(origin);
    this.addGuildVillageBuilding(origin, "guild-inn", "Inn", -14.4, 8.9, 5.55, 3.85, 2.45, -0.14, { material: this.materials.agedWood, roof: this.materials.barkDark, sign: 0xffc579 });
    this.addGuildVillageBuilding(origin, "guild-blacksmith", "Smith", -15.6, -4.2, 4.85, 3.55, 2.24, 0.12, { material: this.materials.darkStone, roof: this.materials.barkDark, sign: 0xff8a3d, chimney: true });
    this.addGuildVillageBuilding(origin, "guild-bowyer", "Bowyer", 15.1, -4.0, 4.75, 3.35, 2.12, -0.08, { material: this.materials.wood, roof: this.materials.pineDark, sign: 0xe6b75d, rack: true });
    this.addGuildVillageStable(origin, 16.3, 8.8);
    this.addGuildVillageMarket(origin, 4.2, 10.5);
    this.addGuildQuestBoard(origin, -2.2, 7.4);
    [
      [-22.4, 12.6, 3.75, 2.75, 1.82, 0.16],
      [-8.2, 17.0, 3.45, 2.62, 1.76, -0.08],
      [8.8, 17.2, 3.62, 2.72, 1.8, 0.1],
      [22.2, 3.7, 3.35, 2.48, 1.72, -0.16],
    ].forEach(([localX, localZ, width, depth, height, yawOffset], index) => {
      this.addGuildVillageBuilding(origin, `guild-home-${index + 1}`, "Home", localX, localZ, width, depth, height, yawOffset, {
        material: index % 2 ? this.materials.agedWood : this.materials.wood,
        roof: this.materials.barkDark,
        sign: 0xe8bc66,
      });
    });
    this.addGuildVillageAtmosphere(origin);
    this.addGuildVillageReadabilityPolish(origin);
    this.addGuildVillageMasterpiecePass(origin);
  }

  addGuildVillageRoads(origin) {
    [
      [0, 5.6, 30, 2.75, 0],
      [-9.2, 4.7, 2.25, 19.5, 0.12],
      [10.2, 4.4, 2.25, 18.4, -0.08],
      [0, 13.0, 27.0, 2.05, 0.02],
      [-14.0, 1.8, 2.15, 11.8, -0.1],
      [14.2, 1.6, 2.05, 10.6, 0.08],
    ].forEach(([localX, localZ, width, depth, yawOffset]) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 3, 5), this.materials.groundPath ?? this.materials.cutWood);
      road.rotation.set(-Math.PI / 2, 0, origin.yaw + yawOffset);
      road.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.032, point.z);
      road.scale.x = 0.92 + Math.sin(localZ) * 0.05;
      road.scale.y = 0.94 + Math.cos(localX) * 0.04;
      road.receiveShadow = true;
      this.scene.add(road);
      if (!this.performanceMode) {
        this.addPathEdgeCluster(point.x, point.z, origin.yaw + yawOffset, Math.min(9, Math.round(width / 2.4)), "guild", Math.round(localX * 2 + localZ));
      }
    });
  }

  addGuildVillageBuilding(origin, id, label, localX, localZ, width, depth, height, yawOffset = 0, options = {}) {
    const point = this.getGuildPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = origin.yaw + yawOffset;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(width + 0.35, 0.22, depth + 0.35), this.materials.darkStone);
    foundation.position.y = 0.11;
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), options.material ?? this.materials.agedWood);
    body.position.y = 0.22 + height * 0.5;
    body.scale.x = 0.98 + Math.sin(localX * 0.7) * 0.015;
    body.scale.z = 0.98 + Math.cos(localZ * 0.6) * 0.015;
    const roof = this.createLayeredGableRoof(width, depth, height + 0.72, options.roof ?? this.materials.barkDark, {
      pitch: 0.43 + Math.abs(yawOffset) * 0.24,
      overhang: 0.48,
      asymmetry: Math.sin(localX + localZ) * 0.08,
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.25, 0.1), this.materials.warmTrim);
    door.position.set(0, 0.86, -depth * 0.51);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.08), new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.64, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.08 }));
    sign.position.set(0, 1.72, -depth * 0.56);
    group.add(foundation, body, roof, door, sign);
    this.addBuildingCraftDetails(group, width, depth, height, {
      trim: new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.68, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.04 }),
    });
    const interiorRole = label === "Inn" ? "inn"
      : label === "Smith" ? "smith"
        : label === "Bowyer" ? "bowyer"
          : label === "Stable" ? "storage"
            : "home";
    this.addInteriorDetailSet(group, width, depth, height, interiorRole, {
      trim: new THREE.MeshStandardMaterial({ color: options.sign ?? 0xe6b75d, roughness: 0.62, emissive: options.sign ?? 0xe6b75d, emissiveIntensity: 0.08 }),
      wood: options.material ?? this.materials.cutWood,
      cloth: label === "Inn" ? this.materials.parchment : this.materials.canvas,
    });

    if (label === "Inn") {
      const balcony = new THREE.Mesh(new THREE.BoxGeometry(width * 0.56, 0.14, 0.42), this.materials.cutWood);
      balcony.position.set(0.42, height * 0.75, -depth * 0.62);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.08, 0.08), this.materials.barkDark);
      rail.position.set(0.42, height * 0.98, -depth * 0.84);
      group.add(balcony, rail);
    }

    if (label === "Smith") {
      const forgeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.52, 0.08), this.materials.lavaGlow ?? this.materials.warmWindow);
      forgeGlow.position.set(width * 0.28, 0.72, -depth * 0.565);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.36, 0.16), this.materials.obsidian ?? this.materials.darkStone);
      hood.position.set(width * 0.28, 1.12, -depth * 0.58);
      group.add(forgeGlow, hood);
    }

    if (label === "Bowyer") {
      const curvedSign = this.createGuildSymbol(0.38, { color: options.sign ?? 0xe6b75d });
      curvedSign.position.set(-width * 0.32, height + 0.38, -depth * 0.58);
      curvedSign.rotation.y = Math.PI;
      group.add(curvedSign);
    }

    if (options.chimney) {
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.25, 7), this.materials.darkStone);
      chimney.position.set(width * 0.28, height + 0.92, depth * 0.16);
      chimney.rotation.z = -0.07;
      group.add(chimney);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.56), this.materials.ancientStone);
      cap.position.set(width * 0.28, height + 1.58, depth * 0.16);
      cap.rotation.y = 0.18;
      group.add(cap);
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), this.materials.warmWindow);
      ember.position.set(width * 0.28, height + 1.72, depth * 0.16);
      group.add(ember);
    }

    if (options.rack) {
      [-0.55, 0, 0.55].forEach((offset) => {
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.014, 7, 24, Math.PI * 1.35), this.materials.cutWood);
        bow.position.set(width * 0.5 + 0.08, 1.0 + offset * 0.08, offset);
        bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
        group.add(bow);
      });
    }

    if (label === "Home") {
      const sideShed = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.12, depth * 0.52), options.roof ?? this.materials.barkDark);
      sideShed.position.set(-width * 0.52, height * 0.72, depth * 0.08);
      sideShed.rotation.z = 0.2;
      sideShed.rotation.y = -0.04;
      group.add(sideShed);
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, width + 0.25, depth + 0.25, height + 0.9, yaw);
    this.villageBuildings = this.villageBuildings ?? [];
    this.villageBuildings.push({ id, label, position: new THREE.Vector3(point.x, y, point.z), yaw, width, depth });
  }

  addGuildVillageStable(origin, localX, localZ) {
    const point = this.getGuildPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = origin.yaw + 0.08;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;
    const roof = this.createLayeredGableRoof(5.0, 3.15, 2.0, this.materials.barkDark, {
      pitch: 0.34,
      overhang: 0.38,
      asymmetry: 0.06,
      shingleRows: 3,
    });
    group.add(roof);
    [-1.8, 0, 1.8].forEach((x) => {
      const post = new THREE.Mesh(this.geometries.fencePost, this.materials.barkDark);
      post.position.set(x, 0.78, -1.25);
      group.add(post);
      const back = post.clone();
      back.position.z = 1.25;
      group.add(back);
    });
    const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 9), this.materials.grassLight);
    hay.position.set(-1.2, 0.28, 0.4);
    hay.rotation.z = Math.PI / 2;
    group.add(hay);
    const tackRack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.92, 1.9), this.materials.barkDark);
    tackRack.position.set(2.1, 0.76, 0);
    const waterTrough = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.48), this.materials.cutWood);
    waterTrough.position.set(0.85, 0.2, 1.15);
    group.add(tackRack, waterTrough);
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, 4.9, 0.4, 2.2, yaw);
  }

  addGuildVillageMarket(origin, localX, localZ) {
    const stalls = [
      [-1.6, 0.3, 0x8b6844],
      [1.45, -0.4, 0x2f5545],
      [0.15, 1.85, 0xa94e3f],
    ];
    stalls.forEach(([offsetX, offsetZ, color], index) => {
      const point = this.getGuildPoint(origin, localX + offsetX, localZ + offsetZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const yaw = origin.yaw + (index - 1) * 0.18;
      const group = new THREE.Group();
      group.position.set(point.x, y, point.z);
      group.rotation.y = yaw;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.72), this.materials.cutWood);
      counter.position.y = 0.28;
      const clothMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
      const awningLeft = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.16), clothMaterial);
      awningLeft.position.set(-0.42, 1.24, 0);
      awningLeft.rotation.z = -0.16;
      const awningRight = awningLeft.clone();
      awningRight.position.x = 0.42;
      awningRight.rotation.z = 0.16;
      [-0.48, 0, 0.48].forEach((frillZ) => {
        const frill = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 7), clothMaterial);
        frill.position.set(0, 1.16, frillZ);
        frill.rotation.z = Math.PI / 2;
        group.add(frill);
      });
      [-0.72, 0.72].forEach((xOffset) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 1.18, 6), this.materials.barkDark);
        post.position.set(xOffset, 0.72, -0.42);
        group.add(post);
      });
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.32, 9), index % 2 ? this.materials.rope : this.materials.wood);
      basket.position.set(0.52, 0.34, 0.38);
      group.add(counter, awningLeft, awningRight, basket);
      this.scene.add(group);
    });
  }

  addGuildQuestBoard(origin, localX, localZ) {
    const point = this.getGuildPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = origin.yaw;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.35, 0.16), this.materials.agedWood);
    board.position.y = 1.1;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.24), this.materials.barkDark);
    cap.position.y = 1.86;
    [-0.92, 0.92].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.8, 7), this.materials.barkDark);
      post.position.set(x, 0.9, 0);
      group.add(post);
    });
    for (let index = 0; index < 5; index += 1) {
      const note = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), this.materials.parchment);
      note.position.set(-0.68 + index * 0.34, 1.12 + Math.sin(index) * 0.08, -0.091);
      note.rotation.z = Math.sin(index * 1.4) * 0.08;
      group.add(note);
    }
    group.add(board, cap);
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, 2.35, 0.28, 1.8, yaw);
  }

  addGuildVillageAtmosphere(origin) {
    [
      [-16.8, 2.2], [-14.2, 12.2], [-2.2, 9.2], [5.9, 13.0], [16.4, 12.4], [15.0, -6.7], [-15.8, -7.0],
    ].forEach(([localX, localZ], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.35, 7), this.materials.barkDark);
      post.position.set(point.x, y + 0.68, point.z);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.materials.warmWindow);
      lantern.position.set(point.x, y + 1.36, point.z);
      this.scene.add(post, lantern);
      if (index % 2 === 0) {
        this.addFlowerPatch(point.x + 0.55, point.z - 0.35, 3);
      }
    });
    [[-20.5, 8.2, 4.6], [20.4, 9.0, 4.2], [0.5, 18.2, 6.2]].forEach(([localX, localZ, length]) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      this.addCollisionBox(point.x, point.z, length, 0.28, 0.9, origin.yaw + 0.06);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.16, 0.16), this.materials.barkDark);
      rail.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.62, point.z);
      rail.rotation.y = origin.yaw + 0.06;
      rail.castShadow = true;
      this.scene.add(rail);
    });
  }

  addGuildVillageReadabilityPolish(origin) {
    this.addGuildVillagePlazaFocus(origin);
    [
      [-15.6, -4.2, 0xff8a3d, "smith"],
      [15.1, -4.0, 0xe6b75d, "bowyer"],
      [-14.4, 8.9, 0xffc579, "inn"],
      [16.3, 8.8, 0xbfd27a, "stable"],
      [-2.2, 7.4, 0xe8d3a0, "jobs"],
    ].forEach(([localX, localZ, color, type]) => this.addGuildServiceMarker(origin, localX, localZ, color, type));

    [
      [0, 5.6, 14, 0],
      [-9.2, 4.7, 9, 0.12],
      [10.2, 4.4, 9, -0.08],
      [0, 13.0, 12, 0.02],
    ].forEach(([localX, localZ, count, yawOffset]) => this.addGuildRoadEdgeStones(origin, localX, localZ, count, yawOffset));

    [
      [-7.6, 8.9, -0.14],
      [5.8, 8.8, 0.12],
      [1.2, 3.05, 0.02],
      [-13.2, 5.5, 0.42],
      [13.2, 5.5, -0.42],
    ].forEach(([localX, localZ, yawOffset]) => this.addGuildVillageBench(origin, localX, localZ, yawOffset));

    this.addGuildVillageGateway(origin);
  }

  addGuildVillagePlazaFocus(origin) {
    const point = this.getGuildPoint(origin, 0.4, 5.6);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(3.2, 16), this.materials.groundPath ?? this.materials.cutWood);
    plaza.position.set(point.x, y + 0.04, point.z);
    plaza.rotation.x = -Math.PI / 2;
    plaza.rotation.z = origin.yaw + 0.2;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    const crest = new THREE.Group();
    crest.position.set(point.x, y + 0.08, point.z);
    crest.rotation.y = origin.yaw;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 10, 36), this.materials.targetGold);
    ring.rotation.x = Math.PI / 2;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.1, 5), this.materials.targetGold);
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.x = 0.14;
    crest.add(ring, arrow);
    this.scene.add(crest);
  }

  addGuildServiceMarker(origin, localX, localZ, color, type) {
    const point = this.getGuildPoint(origin, localX, localZ - 1.65);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = origin.yaw;

    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.58, emissive: color, emissiveIntensity: 0.1 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.45, 7), this.materials.barkDark);
    post.position.y = 0.72;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.08), material);
    sign.position.set(0, 1.38, -0.03);
    group.add(post, sign);

    const icon = type === "smith"
      ? new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.12), this.materials.obsidian ?? this.materials.darkStone)
      : type === "bowyer"
        ? new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 7, 24, Math.PI * 1.35), this.materials.cutWood)
        : type === "stable"
          ? new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 5), this.materials.grassLight)
          : new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), this.materials.parchment);
    icon.position.set(0, 1.39, -0.09);
    icon.rotation.y = Math.PI;
    group.add(icon);
    this.scene.add(group);
  }

  addGuildRoadEdgeStones(origin, localX, localZ, count, yawOffset = 0) {
    for (let index = 0; index < count; index += 1) {
      const t = count <= 1 ? 0.5 : index / (count - 1);
      const side = index % 2 === 0 ? -1 : 1;
      const along = (t - 0.5) * count * 1.15;
      const point = this.getGuildPoint(origin, localX + side * 1.35, localZ + along);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const stone = new THREE.Mesh(this.geometries.pebble, index % 3 === 0 ? this.materials.targetGold : this.materials.stone);
      stone.position.set(point.x, y + 0.08, point.z);
      stone.rotation.set(0.08, origin.yaw + yawOffset + index * 0.37, 0.04);
      stone.scale.set(0.34 + (index % 2) * 0.1, 0.12, 0.24);
      stone.castShadow = true;
      this.scene.add(stone);
    }
  }

  addGuildVillageBench(origin, localX, localZ, yawOffset = 0) {
    const point = this.getGuildPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = origin.yaw + yawOffset;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 0.34), this.materials.cutWood);
    seat.position.set(point.x, y + 0.42, point.z);
    seat.rotation.y = yaw;
    seat.castShadow = true;
    this.scene.add(seat);
    [-0.42, 0.42].forEach((offset) => {
      const legPoint = {
        x: point.x + Math.sin(yaw + Math.PI / 2) * offset,
        z: point.z + Math.cos(yaw + Math.PI / 2) * offset,
      };
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), this.materials.barkDark);
      leg.position.set(legPoint.x, y + 0.21, legPoint.z);
      leg.rotation.y = yaw;
      this.scene.add(leg);
    });
  }

  addGuildVillageGateway(origin) {
    const point = this.getGuildPoint(origin, 0, 20.2);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = origin.yaw;
    const group = new THREE.Group();
    group.position.set(point.x, y, point.z);
    group.rotation.y = yaw;
    [-1.55, 1.55].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 7), this.materials.barkDark);
      post.position.set(x, 1.2, 0);
      group.add(post);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.2, 0.24), this.materials.cutWood);
    beam.position.y = 2.25;
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.06), this.materials.banner);
    banner.position.y = 1.74;
    group.add(beam, banner);
    this.scene.add(group);
    this.addCollisionBox(point.x, point.z, 0.22, 3.5, 2.4, yaw);
  }

  addGuildVillageMasterpiecePass(origin) {
    this.addGuildVillageGreenAndIntersections(origin);
    this.addGuildHallCenterpieceDetails(origin);
    this.addGuildMarketMasterpieceDetails(origin);
    this.addGuildServiceYardDetails(origin);
    this.addGuildHomeGardenDetails(origin);
    this.addGuildVillageGatheringDetails(origin);
    this.addGuildVillageLightingPass(origin);
  }

  createGuildVillageDetailGroup(origin, localX, localZ, yawOffset = 0) {
    const point = this.getGuildPoint(origin, localX, localZ);
    const group = new THREE.Group();
    group.position.set(point.x, this.terrain.getHeightAt(point.x, point.z), point.z);
    group.rotation.y = origin.yaw + yawOffset;
    return group;
  }

  finishGuildVillageDetailGroup(group) {
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = child.castShadow ?? true;
        child.receiveShadow = true;
        child.userData.detailObject = true;
      }
    });
    this.scene.add(group);
  }

  addGuildVillageGreenAndIntersections(origin) {
    [
      [0.4, 5.6, 5.2, 0.78],
      [4.2, 10.5, 4.4, 0.58],
      [-14.4, 8.9, 3.3, 0.42],
      [16.3, 8.8, 3.5, 0.42],
    ].forEach(([localX, localZ, radius, opacity], index) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      const patchMaterial = (this.materials.groundPath ?? this.materials.frontierRoad ?? this.materials.cutWood).clone();
      patchMaterial.transparent = true;
      patchMaterial.opacity = opacity;
      const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), patchMaterial);
      patch.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 0.045 + index * 0.002, point.z);
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = origin.yaw + index * 0.24;
      patch.receiveShadow = true;
      patch.userData.terrain = true;
      this.scene.add(patch);
    });

    [
      [-5.2, 5.4, 2.4, 0.4], [5.8, 5.5, 2.6, -0.36],
      [-5.8, 12.8, 2.2, -0.18], [9.6, 12.2, 2.1, 0.28],
    ].forEach(([localX, localZ, length, yawOffset]) => this.addGuildFlowerBed(origin, localX, localZ, length, yawOffset));
  }

  addGuildHallCenterpieceDetails(origin) {
    const group = this.createGuildVillageDetailGroup(origin, 0, -0.6, 0);
    const stairMaterial = this.materials.ancientStone;
    for (let index = 0; index < 3; index += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(6.2 - index * 0.8, 0.16, 0.72), stairMaterial);
      step.position.set(0, 0.08 + index * 0.11, 2.18 + index * 0.48);
      group.add(step);
    }
    [-3.25, 3.25].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.8, 8), this.materials.barkDark);
      post.position.set(x, 1.4, 1.35);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.45, 0.07), this.materials.banner);
      banner.position.set(x * 0.92, 1.65, 1.08);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), this.materials.warmWindow);
      lantern.position.set(x * 0.88, 2.62, 1.02);
      group.add(post, banner, lantern);
    });
    const crestBase = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.04, 0.16, 18), this.materials.targetGold);
    crestBase.position.set(0, 0.15, 1.0);
    const crestArrow = new THREE.Mesh(new THREE.ConeGeometry(0.13, 1.2, 5), this.materials.targetGold);
    crestArrow.position.set(0.12, 0.3, 1.0);
    crestArrow.rotation.set(0, 0, -Math.PI / 2);
    const meetingTable = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.18, 0.9), this.materials.cutWood);
    meetingTable.position.set(0, 0.72, -0.65);
    meetingTable.rotation.y = 0.04;
    const mapParchment = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.62), this.materials.parchment);
    mapParchment.position.set(0, 0.84, -0.65);
    mapParchment.rotation.y = 0.04;
    [-0.92, 0.92].forEach((x) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.16, 0.34), this.materials.barkDark);
      bench.position.set(x, 0.52, -0.68);
      bench.rotation.y = x * -0.04;
      group.add(bench);
    });
    [-1.8, -0.9, 0, 0.9, 1.8].forEach((x, index) => {
      const record = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.08), index % 2 ? this.materials.masterBlue : this.materials.parchment);
      record.position.set(x, 1.18, -1.34);
      record.rotation.z = Math.sin(index) * 0.05;
      group.add(record);
    });
    group.add(crestBase, crestArrow, meetingTable, mapParchment);
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildMarketMasterpieceDetails(origin) {
    [
      [1.8, 9.0, -0.3, this.materials.marketAwningRed ?? this.materials.canvas, "produce"],
      [5.7, 9.0, 0.28, this.materials.marketAwningBlue ?? this.materials.canvas, "cloth"],
      [1.6, 12.6, -0.18, this.materials.canvas, "supplies"],
      [6.3, 12.8, 0.22, this.materials.banner, "bows"],
    ].forEach(([localX, localZ, yawOffset, material, type], index) => {
      this.addGuildMarketStallDetail(origin, localX, localZ, yawOffset, material, type, index);
    });
    this.addGuildVillageCart(origin, 8.6, 11.4, 0.34);
    this.addGuildVillageCrateStack(origin, 0.2, 11.2, -0.18, 4);
    this.addGuildVillageCrateStack(origin, 7.8, 8.2, 0.24, 3);
  }

  addGuildMarketStallDetail(origin, localX, localZ, yawOffset, awningMaterial, type, seed = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.48, 0.74), this.materials.cutWood);
    counter.position.y = 0.26;
    const awning = this.createLayeredGableRoof(2.15, 1.55, 1.2, awningMaterial, {
      pitch: 0.26,
      overhang: 0.18,
      thickness: 0.08,
      shingleRows: 1,
      asymmetry: seed % 2 ? 0.04 : -0.03,
    });
    [-0.78, 0.78].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.18, 6), this.materials.barkDark);
      post.position.set(x, 0.62, -0.44);
      group.add(post);
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.22, 0.08), this.materials.parchment);
    sign.position.set(0, 1.18, -0.84);
    group.add(counter, awning, sign);
    const goodMaterial = type === "bows"
      ? this.materials.targetGold
      : type === "cloth"
        ? this.materials.marketAwningBlue ?? this.materials.banner
        : type === "produce"
          ? this.materials.flower
          : this.materials.rope;
    for (let index = 0; index < 6; index += 1) {
      const good = type === "bows"
        ? new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.01, 6, 18, Math.PI * 1.35), this.materials.cutWood)
        : type === "cloth"
          ? new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.34), goodMaterial)
          : new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 5), goodMaterial);
      good.position.set(-0.62 + index * 0.24, 0.55 + (index % 2) * 0.06, 0.02 + Math.sin(index) * 0.16);
      if (type === "bows") good.rotation.set(0, Math.PI / 2, Math.PI / 2);
      group.add(good);
    }
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildServiceYardDetails(origin) {
    this.addBlacksmithYardDetails(origin, -15.6, -4.2);
    this.addBowyerYardDetails(origin, 15.1, -4.0);
    this.addInnYardDetails(origin, -14.4, 8.9);
    this.addStableYardDetails(origin, 16.3, 8.8);
  }

  addBlacksmithYardDetails(origin, localX, localZ) {
    const group = this.createGuildVillageDetailGroup(origin, localX + 3.2, localZ + 1.5, 0.12);
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.28, 0.28), this.materials.obsidian ?? this.materials.darkStone);
    anvil.position.set(-0.75, 0.42, 0);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.42, 8), this.materials.barkDark);
    stump.position.set(-0.75, 0.21, 0);
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), this.materials.obsidian ?? this.materials.darkStone);
    coal.position.set(0.72, 0.18, 0.38);
    coal.scale.set(1.3, 0.45, 0.9);
    const forge = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.48, 0.62), this.materials.darkStone);
    forge.position.set(0.35, 0.24, -0.42);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.44), this.materials.lavaGlow ?? this.materials.warmWindow);
    glow.position.set(0.35, 0.52, -0.42);
    group.add(stump, anvil, coal, forge, glow);
    this.finishGuildVillageDetailGroup(group);
  }

  addBowyerYardDetails(origin, localX, localZ) {
    const group = this.createGuildVillageDetailGroup(origin, localX - 3.0, localZ + 1.4, -0.1);
    [-0.62, 0, 0.62].forEach((x, index) => {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 7, 24, Math.PI * 1.35), index % 2 ? this.materials.targetGold : this.materials.cutWood);
      bow.position.set(x, 0.9, -0.28);
      bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
      group.add(bow);
    });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.48), this.materials.cutWood);
    bench.position.set(0, 0.42, 0.52);
    const stringRack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.18, 1.6), this.materials.barkDark);
    stringRack.position.set(1.18, 0.68, 0);
    group.add(bench, stringRack);
    this.finishGuildVillageDetailGroup(group);
  }

  addInnYardDetails(origin, localX, localZ) {
    const group = this.createGuildVillageDetailGroup(origin, localX + 3.4, localZ - 1.2, -0.2);
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 0.86), this.materials.cutWood);
    table.position.y = 0.56;
    [-0.72, 0.72].forEach((x) => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 8), this.materials.wood);
      stool.position.set(x, 0.22, 0.62);
      group.add(stool);
    });
    [-1.28, -1.0].forEach((x, index) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.58, 9), this.materials.agedWood);
      barrel.position.set(x, 0.29, -0.54 + index * 0.32);
      group.add(barrel);
    });
    group.add(table);
    this.finishGuildVillageDetailGroup(group);
  }

  addStableYardDetails(origin, localX, localZ) {
    [
      [localX - 3.0, localZ + 2.4, 3.4, 0.04],
      [localX + 1.0, localZ + 2.6, 3.6, -0.02],
      [localX - 1.0, localZ + 4.0, 4.8, Math.PI / 2],
    ].forEach(([x, z, length, yawOffset]) => this.addGuildFenceRail(origin, x, z, length, yawOffset));
    const group = this.createGuildVillageDetailGroup(origin, localX - 1.4, localZ + 2.7, 0.08);
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.26, 0.46), this.materials.cutWood);
    trough.position.set(0, 0.2, 0);
    const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 1.0, 9), this.materials.grassLight);
    hay.position.set(1.2, 0.28, -0.2);
    hay.rotation.z = Math.PI / 2;
    group.add(trough, hay);
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildHomeGardenDetails(origin) {
    [
      [-22.4, 12.6, -2.7, 1.7, 2.4, -0.1],
      [-8.2, 17.0, 2.3, -1.5, 2.0, 0.18],
      [8.8, 17.2, -2.5, -1.4, 2.2, -0.16],
      [22.2, 3.7, -2.2, 1.7, 1.9, 0.12],
    ].forEach(([homeX, homeZ, offsetX, offsetZ, length, yawOffset], index) => {
      this.addGuildFlowerBed(origin, homeX + offsetX, homeZ + offsetZ, length, yawOffset);
      if (index % 2 === 0) {
        this.addGuildClothesline(origin, homeX - offsetX * 0.42, homeZ + offsetZ * 0.58, yawOffset + 0.12);
      } else {
        this.addGuildWoodPile(origin, homeX + offsetX * 0.5, homeZ - offsetZ * 0.3, yawOffset - 0.08);
      }
    });
    this.addGuildVillageWell(origin, -3.4, 13.9);
  }

  addGuildVillageGatheringDetails(origin) {
    [
      [-3.6, 5.9, 0.2], [3.3, 5.9, -0.2], [0.4, 8.4, 0],
    ].forEach(([localX, localZ, yawOffset]) => this.addGuildVillageBench(origin, localX, localZ, yawOffset));
    const camp = this.createGuildVillageDetailGroup(origin, -5.2, 10.6, 0.1);
    const firePit = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 12), this.materials.darkStone);
    firePit.position.y = 0.06;
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 7), this.materials.warmWindow);
    ember.position.y = 0.24;
    camp.add(firePit, ember);
    this.finishGuildVillageDetailGroup(camp);
  }

  addGuildVillageLightingPass(origin) {
    [
      [0.4, 5.6, 0.55, 9], [-14.4, 8.9, 0.46, 8], [4.2, 10.5, 0.46, 8],
      [16.3, 8.8, 0.42, 8], [-15.6, -4.2, 0.38, 7], [15.1, -4.0, 0.38, 7],
    ].forEach(([localX, localZ, intensity, distance]) => {
      const point = this.getGuildPoint(origin, localX, localZ);
      const light = new THREE.PointLight(0xffb96b, intensity, distance, 1.8);
      light.position.set(point.x, this.terrain.getHeightAt(point.x, point.z) + 2.2, point.z);
      light.castShadow = false;
      this.scene.add(light);
    });
  }

  addGuildFlowerBed(origin, localX, localZ, length = 2, yawOffset = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.48), this.materials.darkStone);
    bed.position.y = 0.04;
    group.add(bed);
    const plantCount = Math.max(4, Math.round(length * 2.2));
    for (let index = 0; index < plantCount; index += 1) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.2, 5), this.materials.grass);
      stem.position.set(-length * 0.42 + index * (length * 0.84 / Math.max(1, plantCount - 1)), 0.18, Math.sin(index * 1.7) * 0.14);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), index % 2 ? this.materials.flower : this.materials.blossom);
      bloom.position.set(stem.position.x, 0.31, stem.position.z);
      group.add(stem, bloom);
    }
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildFenceRail(origin, localX, localZ, length, yawOffset = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.13, 0.13), this.materials.barkDark);
    rail.position.y = 0.68;
    [-0.45, 0.45].forEach((heightOffset) => {
      const secondRail = rail.clone();
      secondRail.position.y += heightOffset * 0.26;
      group.add(secondRail);
    });
    [-0.5, 0, 0.5].forEach((t) => {
      const post = new THREE.Mesh(this.geometries.fencePost, this.materials.barkDark);
      post.position.set(t * length, 0.68, 0);
      group.add(post);
    });
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildVillageCrateStack(origin, localX, localZ, yawOffset = 0, count = 3) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    for (let index = 0; index < count; index += 1) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.44), index % 2 ? this.materials.agedWood : this.materials.cutWood);
      crate.position.set((index % 2) * 0.42, 0.19 + Math.floor(index / 2) * 0.34, Math.floor(index / 2) * 0.28);
      crate.rotation.y = index * 0.16;
      group.add(crate);
    }
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildVillageCart(origin, localX, localZ, yawOffset = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.28, 0.82), this.materials.agedWood);
    bed.position.y = 0.42;
    [-0.52, 0.52].forEach((x) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), this.materials.barkDark);
      wheel.position.set(x, 0.24, -0.48);
      wheel.rotation.z = Math.PI / 2;
      const rearWheel = wheel.clone();
      rearWheel.position.z = 0.48;
      group.add(wheel, rearWheel);
    });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), this.materials.barkDark);
    handle.position.set(0.86, 0.46, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(bed, handle);
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildClothesline(origin, localX, localZ, yawOffset = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    [-0.9, 0.9].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.18, 6), this.materials.barkDark);
      post.position.set(x, 0.58, 0);
      group.add(post);
    });
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.035, 0.035), this.materials.rope);
    line.position.y = 1.08;
    group.add(line);
    [-0.48, 0.04, 0.52].forEach((x, index) => {
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.035), index % 2 ? this.materials.marketAwningBlue ?? this.materials.banner : this.materials.parchment);
      cloth.position.set(x, 0.82, 0);
      group.add(cloth);
    });
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildWoodPile(origin, localX, localZ, yawOffset = 0) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, yawOffset);
    for (let index = 0; index < 5; index += 1) {
      const log = new THREE.Mesh(this.geometries.log, this.materials.bark);
      log.position.set(0, 0.16 + (index % 2) * 0.12, -0.44 + index * 0.22);
      log.rotation.set(0, Math.PI / 2 + index * 0.04, 0);
      log.scale.set(0.42, 0.42, 0.42);
      group.add(log);
    }
    this.finishGuildVillageDetailGroup(group);
  }

  addGuildVillageWell(origin, localX, localZ) {
    const group = this.createGuildVillageDetailGroup(origin, localX, localZ, 0.08);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.68, 12), this.materials.ancientStone);
    base.position.y = 0.34;
    [-0.54, 0.54].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.45, 7), this.materials.barkDark);
      post.position.set(x, 1.03, 0);
      group.add(post);
    });
    const cap = this.createLayeredGableRoof(1.55, 1.2, 1.45, this.materials.barkDark, {
      pitch: 0.32,
      overhang: 0.12,
      shingleRows: 1,
    });
    group.add(base, cap);
    this.finishGuildVillageDetailGroup(group);
    const point = this.getGuildPoint(origin, localX, localZ);
    this.addCollisionCylinder(point.x, point.z, 0.72, 1.25);
  }

  addFlowerPatch(x, z, count = 4) {
    const y = this.terrain.getHeightAt(x, z);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / Math.max(1, count)) * Math.PI * 2;
      const flowerX = x + Math.sin(angle) * (0.18 + index * 0.08);
      const flowerZ = z + Math.cos(angle) * (0.18 + index * 0.06);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.22, 5), this.materials.grass);
      stem.position.set(flowerX, y + 0.11, flowerZ);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 7, 5), index % 2 ? this.materials.flower : this.materials.blossom);
      bloom.position.set(flowerX, y + 0.24, flowerZ);
      this.scene.add(stem, bloom);
    }
  }

  addGuildExpansionReserve(origin) {
    this.settlementExpansion = {
      id: "archers-guild-village-reserve",
      name: "Guild Village Reserve",
      anchor: new THREE.Vector3(origin.x, 0, origin.z),
      futureNpcHooks: ["village-steward", "marsh-guide", "traveler-cook"],
      futureShopHooks: ["blacksmith", "fletcher", "provisioner"],
      plots: [
        { id: "future-blacksmith", name: "Future Blacksmith Plot", local: [-27.0, -4.0], size: [4.8, 3.6], purpose: "future-building" },
        { id: "future-fletcher", name: "Future Fletcher Plot", local: [27.0, -3.6], size: [4.2, 3.2], purpose: "future-shop" },
        { id: "future-inn", name: "Future Traveler Inn Plot", local: [-24.8, 18.2], size: [5.6, 4.2], purpose: "future-building" },
        { id: "future-market", name: "Future Market Green", local: [21.8, 18.4], size: [5.8, 4.4], purpose: "future-shops" },
        { id: "future-marsh-guide-hut", name: "Future Marsh Guide Hut", local: [-30.2, 10.8], size: [3.8, 3.1], purpose: "future-npc" },
      ],
    };

    this.settlementExpansion.plots.forEach((plot, index) => {
      const point = this.getGuildPoint(origin, plot.local[0], plot.local[1]);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(plot.size[0], plot.size[1]), this.materials.visibleTrail ?? this.materials.groundPath ?? this.materials.cutWood);
      pad.rotation.set(-Math.PI / 2, 0, origin.yaw + (index % 2 ? 0.08 : -0.06));
      pad.position.set(point.x, y + 0.035, point.z);
      pad.receiveShadow = true;
      this.scene.add(pad);

      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.95, 7), this.materials.barkDark);
      marker.position.set(point.x, y + 0.48, point.z);
      marker.castShadow = true;
      this.scene.add(marker);
      plot.position = new THREE.Vector3(point.x, y, point.z);
      plot.yaw = pad.rotation.y;
    });
  }

  getSettlementExpansionPlots() {
    return this.settlementExpansion?.plots ?? [];
  }

  addProgressionDiscoveries() {
    this.addLegendaryHint(-8.8, 63.5, "Stormcaller Carving", "Lightning marks the high stones. The guild believes Stormcaller answers only proven archers.");
    this.addLegendaryHint(35.8, 31.4, "Frostbite Etching", "Stillwater's old temple script names a bow that can slow a charging beast.");
    this.addLegendaryHint(43.8, -22.6, "Sunpiercer Ash", "Warm ash circles this marker. A legendary fire bow may be tied to temple trials.");
    this.addLegendaryHint(-22.8, 17.8, "Whisperwind Thread", "A pale bowstring hums in the wind near old watch paths.");
    this.addLegendaryHint(-63.4, -47.6, "Bogpiercer Reed Mark", "A damp reed marker points toward Blackwater and an arrow that can read fog.");
    this.addRareLootCache(-55.2, 34.6, "Guild Ranger Pattern", "epic", "A folded guild pattern unlocks future ranger set crafting hooks.");
    this.addRareLootCache(29.8, -25.8, "Ancient Archer Buckle", "epic", "A relic buckle suggests the Ancient Archer Set can be restored.");
  }

  addLegendaryHint(x, z, name, text) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.34, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.16, 8), this.materials.darkStone);
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 8, 24), this.materials.targetGold);
    glyph.position.y = 0.2;
    glyph.rotation.x = Math.PI / 2;
    group.add(base, glyph);
    this.scene.add(group);
    this.interactables.push({
      id: `legendary-hint-${name.toLowerCase().replaceAll(" ", "-")}`,
      type: "lore-note",
      name,
      prompt: "E Study",
      position: new THREE.Vector3(x, y + 0.46, z),
      radius: 2.3,
      group,
      text,
    });
  }

  addRareLootCache(x, z, name, rarity, text) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.32, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.42), this.materials.wood);
    const glow = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), rarity === "epic" ? this.materials.crystalViolet : this.materials.crystalBlue);
    glow.position.y = 0.26;
    base.castShadow = true;
    group.add(base, glow);
    this.scene.add(group);
    this.interactables.push({
      id: `rare-cache-${name.toLowerCase().replaceAll(" ", "-")}`,
      type: "rare-loot",
      name,
      prompt: "E Open cache",
      position: new THREE.Vector3(x, y + 0.42, z),
      radius: 2.4,
      rarity,
      group,
      text,
    });
  }

  addOuterRegionalForest() {
    if (this.performanceMode) {
      return;
    }
    const trees = [
      [39, 18, 4.8], [46, 20, 4.4], [59, 19, 5.1], [65, 7, 4.7], [62, -8, 4.9], [43, -11, 4.6],
      [-18, 46, 4.8], [-10, 54, 5.2], [7, 54, 4.5], [14, 63, 4.9], [-18, 70, 4.4],
      [39, 42, 4.7], [47, 66, 5.8], [61, 62, 5.4], [68, 47, 4.9], [58, 36, 4.7],
      [24, 43, 4.2], [32, 53, 4.5], [18, 64, 4.6],
    ];
    trees.forEach(([x, z, height], index) => {
      this.addPine(x, z, height, index % 3 === 0 ? this.materials.pineDark : this.materials.pine);
    });

    [[33, 15, 0.62], [41, 7, 0.54], [49, -7, 0.58], [-10, 46, 0.66], [-2, 55, 0.6], [36, 39, 0.64], [57, 43, 0.7]].forEach(([x, z, scale], index) => {
      const rock = new THREE.Mesh(this.geometries.pebble, index % 2 === 0 ? this.materials.stone : this.materials.darkStone);
      rock.position.set(x, this.terrain.getHeightAt(x, z) + scale * 0.24, z);
      rock.scale.set(scale * 1.25, scale * 0.48, scale * 0.9);
      rock.rotation.set(index * 0.31, index * 0.58, index * 0.13);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.addCollisionCylinder(x, z, scale * 0.72, 1.4);
    });
  }

  addRiverCrossingRegion(origin) {
    const waterSegments = [
      [43, 0.4, 12, 4.1, -0.08],
      [55, 1.6, 15, 4.4, 0.04],
      [68, 3.4, 12, 4.0, 0.16],
    ];
    waterSegments.forEach(([x, z, width, depth, yaw]) => {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 1, 1), this.materials.water);
      water.rotation.set(-Math.PI / 2, 0, yaw);
      water.position.set(x, this.terrain.getHeightAt(x, z) + 0.08, z);
      water.receiveShadow = true;
      this.scene.add(water);
    });

    const bridge = new THREE.Group();
    bridge.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.38, origin.z);
    bridge.rotation.y = origin.yaw;
    for (let plank = -3; plank <= 3; plank += 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.16, 3.8), plank % 2 === 0 ? this.materials.wood : this.materials.cutWood);
      mesh.position.x = plank * 0.68;
      mesh.rotation.z = plank * 0.012;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bridge.add(mesh);
    }
    [-2.7, 2.7].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 4.2), this.materials.barkDark);
      rail.position.set(x, 0.55, 0);
      rail.castShadow = true;
      bridge.add(rail);
    });
    this.scene.add(bridge);
    this.addCollisionBox(origin.x - 2.9, origin.z, 0.28, 4.2, 1.1, origin.yaw);
    this.addCollisionBox(origin.x + 2.9, origin.z, 0.28, 4.2, 1.1, origin.yaw);

    this.addTarget(origin.x + 7.6, origin.z + 4.8, origin.yaw - 1.2, 0.55, {
      challengeId: "riverCrossing",
      challengeLabel: "River Crossing",
      yOffset: 0.2,
    });
    this.addSimpleLandmarkPickup(origin.x + 5.4, origin.z - 4.6, "River Stone Token", 24, "A smooth token marks the bridge crossing.");
  }

  addMountainPathRegion(origin) {
    const lookout = new THREE.Group();
    lookout.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z) + 0.12, origin.z);
    lookout.rotation.y = origin.yaw;
    const shelf = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.1, 0.34, 10), this.materials.darkStone);
    shelf.scale.set(1.25, 1, 0.72);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    lookout.add(shelf);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.5, 5), this.materials.glyphStone);
    marker.position.set(-2.1, 0.86, -0.35);
    marker.castShadow = true;
    lookout.add(marker);
    this.scene.add(lookout);
    this.addCollisionCylinder(origin.x - 2.1, origin.z - 0.35, 0.42, 1.7);

    for (let index = 0; index < 7; index += 1) {
      const x = -5 + Math.sin(index * 0.9) * 2.1;
      const z = 42 + index * 3.7;
      const y = this.terrain.getHeightAt(x, z);
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.78), this.materials.ancientStone);
      step.position.set(x, y + 0.06, z);
      step.rotation.y = 0.22 * Math.sin(index);
      step.receiveShadow = true;
      this.scene.add(step);
    }

    this.addTarget(origin.x + 5.8, origin.z - 2.2, origin.yaw - 1.6, 0.54, {
      challengeId: "mountainPath",
      challengeLabel: "Mountain Path",
      yOffset: 1.1,
    });
    this.addSimpleLandmarkPickup(origin.x - 3.9, origin.z + 2.6, "Wind-Worn Crest", 30, "The crest hums faintly in the high air.");
  }

  addForgottenGroveRegion(origin) {
    const temple = new THREE.Group();
    temple.position.set(origin.x, this.terrain.getHeightAt(origin.x, origin.z), origin.z);
    temple.rotation.y = origin.yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.75, 0.34, 9), this.materials.mossStone);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.25, 0.42), this.materials.ancientStone);
    archLeft.position.set(-1.25, 1.25, -0.35);
    const archRight = archLeft.clone();
    archRight.position.x = 1.25;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.42, 0.5), this.materials.ancientStone);
    lintel.position.set(0, 2.35, -0.35);
    [archLeft, archRight, lintel].forEach((piece) => {
      piece.castShadow = true;
      piece.receiveShadow = true;
      temple.add(piece);
    });
    temple.add(base);
    this.scene.add(temple);
    this.addCollisionCylinder(origin.x - 1.25, origin.z - 0.35, 0.42, 2.6);
    this.addCollisionCylinder(origin.x + 1.25, origin.z - 0.35, 0.42, 2.6);

    const gatePoint = { x: origin.x + 5.2, z: origin.z - 1.6 };
    const gate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 0.22), this.materials.barkDark);
    gate.position.set(gatePoint.x, this.terrain.getHeightAt(gatePoint.x, gatePoint.z) + 0.95, gatePoint.z);
    gate.rotation.y = origin.yaw + 0.65;
    gate.castShadow = true;
    this.scene.add(gate);
    this.addCollisionBox(gatePoint.x, gatePoint.z, 2.5, 0.38, 2.0, gate.rotation.y);

    this.interactables.push({
      id: "forgotten-grove-gate",
      type: "lore-note",
      name: "Sealed Grove Gate",
      prompt: "E Inspect gate",
      position: new THREE.Vector3(gatePoint.x, gate.position.y, gatePoint.z),
      radius: 3,
      text: "Old roots hold this path shut. It feels like a future lesson belongs here.",
    });

    this.addTarget(origin.x - 5.5, origin.z + 3.8, origin.yaw + 1.9, 0.5, {
      challengeId: "forgottenGrove",
      challengeLabel: "Forgotten Grove",
      yOffset: 0.35,
    });
    this.addSimpleLandmarkPickup(origin.x + 1.7, origin.z + 3.3, "Grove Echo", 36, "A small echo of old archers rests among the roots.");
  }

  addExpandedNavigationSigns() {
    [
      [29, 13, -0.55, [["River", 0.2], ["Pond", -0.3]]],
      [44, 10, 0.2, [["Grove", 0.32], ["Bridge", -0.25]]],
      [-8, 42, 0.05, [["Mountain", 0.24], ["Cliff", -0.28]]],
      [34, 44, -0.34, [["Grove", 0.26], ["River", -0.32]]],
    ].forEach(([x, z, yaw, arms]) => {
      const y = this.terrain.getHeightAt(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.22, 7), this.materials.barkDark);
      post.position.set(x, y + 0.61, z);
      post.castShadow = true;
      this.scene.add(post);
      this.addCollisionCylinder(x, z, 0.16, 1.25);
      arms.forEach(([, offset], index) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.96 - index * 0.08, 0.18, 0.08), this.materials.cutWood);
        board.position.set(x + Math.sin(yaw + offset) * 0.34, y + 1.04 - index * 0.22, z + Math.cos(yaw + offset) * 0.34);
        board.rotation.y = yaw + offset;
        board.castShadow = true;
        this.scene.add(board);
      });
    });
  }

  addGearPickups() {
    this.addGearPickup(-31.2, -15.4, "bows", "hunter-bow", "Hunter Bow", "E Claim bow", "Rowan left this bow after your target lesson.", "rowan-targets");
    this.addGearPickup(-11.2, 36.2, "outfits", "traveler-outfit", "Traveler Outfit", "E Collect outfit", "Light travel cloth, made for long paths.");
    this.addGearPickup(28.8, -24.4, "shields", "wooden-shield", "Wooden Shield", "E Collect shield", "A simple shield weathered by the ruins.");
    this.addGearPickup(-21.4, 16.6, "bows", "longbow", "Longbow", "E Claim longbow", "Hidden near the tower route, built for long shots.");
  }

  addSecretTemples() {
    [
      { id: "shrineEmber", name: "Emberleaf Temple", x: 42, z: -24, color: this.materials.targetGold, yaw: 0.4 },
      { id: "shrineFrost", name: "Stillwater Temple", x: 34, z: 33, color: this.materials.crystalBlue, yaw: -0.75 },
      { id: "shrineGale", name: "Highwind Temple", x: -20, z: 58, color: this.materials.crystalViolet, yaw: 0.15 },
    ].forEach((temple) => this.addSecretTemple(temple));
  }

  addSecretTemple({ id, name, x, z, color, yaw }) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.9, 0.26, 9), this.materials.mossStone);
    base.position.y = 0.13;
    base.receiveShadow = true;
    const backStone = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.8, 0.32), this.materials.ancientStone);
    backStone.position.set(0, 1.05, 0.72);
    backStone.castShadow = true;
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 28), color);
    glyph.position.set(0, 1.22, 0.91);
    glyph.rotation.x = Math.PI / 2;
    group.add(base, backStone, glyph);
    this.scene.add(group);
    this.addCollisionBox(x, z + 0.72, 1.3, 0.45, 1.9, yaw);

    const targetA = { x: x + Math.sin(yaw + 1.8) * 4.2, z: z + Math.cos(yaw + 1.8) * 4.2 };
    const targetB = { x: x + Math.sin(yaw - 1.65) * 4.9, z: z + Math.cos(yaw - 1.65) * 4.9 };
    this.addTarget(targetA.x, targetA.z, yaw - 1.2, 0.48, { challengeId: id, challengeLabel: name, yOffset: 0.24 });
    this.addTarget(targetB.x, targetB.z, yaw + 1.15, 0.48, { challengeId: id, challengeLabel: name, yOffset: 0.42 });
    this.addTempleChest(x - Math.sin(yaw) * 1.8, z - Math.cos(yaw) * 1.8, `${name} Cache`, 42, `${name} rewards a quiet eye.`);
  }

  addTempleChest(x, z, name, xp, text) {
    const y = this.terrain.getHeightAt(x, z);
    const chest = new THREE.Group();
    chest.position.set(x, y + 0.26, z);
    chest.rotation.y = Math.sin(x + z) * 0.8;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.48), this.materials.wood);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.52), this.materials.cutWood);
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), this.materials.targetGold);
    lid.position.y = 0.26;
    latch.position.set(0, 0.15, -0.28);
    base.castShadow = true;
    lid.castShadow = true;
    chest.add(base, lid, latch);
    this.scene.add(chest);
    this.interactables.push({
      id: `temple-chest-${name.toLowerCase().replaceAll(" ", "-")}`,
      type: "xp-pickup",
      name,
      prompt: "E Open chest",
      position: new THREE.Vector3(x, y + 0.48, z),
      radius: 2.4,
      xp,
      group: chest,
      text: `${text} +${xp} XP`,
    });
  }

  addStablePlaceholder() {
    const x = -38;
    const z = -9;
    const y = this.terrain.getHeightAt(x, z);
    const stable = new THREE.Group();
    stable.position.set(x, y, z);
    stable.rotation.y = 0.7;
    const posts = [[-1.4, -0.9], [1.4, -0.9], [-1.4, 1.0], [1.4, 1.0]];
    posts.forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.6, 7), this.materials.barkDark);
      post.position.set(px, 0.8, pz);
      post.castShadow = true;
      stable.add(post);
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.18, 2.4), this.materials.wood);
    roof.position.y = 1.68;
    roof.rotation.z = -0.04;
    roof.castShadow = true;
    stable.add(roof);
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.34, 0.42), this.materials.cutWood);
    trough.position.set(0, 0.22, -1.36);
    trough.castShadow = true;
    stable.add(trough);
    this.scene.add(stable);
    this.addCollisionBox(x, z - 1.36, 1.9, 0.52, 0.6, 0.7);
    this.mountStable = {
      position: new THREE.Vector3(x, y, z),
      spawnPoint: new THREE.Vector3(x + 2.8, y, z + 1.6),
    };
    this.interactables.push({
      id: "mount-stable-placeholder",
      type: "lore-note",
      name: "Quiet Stable",
      prompt: "E Inspect stable",
      position: new THREE.Vector3(x, y + 0.8, z),
      radius: 3.2,
      text: "The tack hooks are empty for now, but this stable is ready for future mounts.",
    });
  }

  addShatteredCoast() {
    this.shatteredCoast = { x: -148, z: -146, yaw: -0.18, scale: 1 };
    this.stormwatchFortress = { x: -158, z: -132, yaw: 0.32 };
    this.brokenBeacon = { x: -172, z: -143, yaw: -0.12 };
    this.tidefallCaverns = { x: -144, z: -170, yaw: -0.62 };
    this.kingsSeaGate = { x: -136, z: -154, yaw: 0.52 };
    this.wreckersPoint = { x: -168, z: -119, yaw: 0.82 };
    this.drownedCitadel = { x: -168, z: -162, yaw: -0.34 };
    this.coastalHarbor = { x: -128, z: -134, yaw: -0.54, scale: 1 };
    this.tidalPathObjects = [];

    this.addShatteredCoastMass();
    this.addShatteredCoastRoutes();
    this.addCoastalHarborSettlement(this.coastalHarbor);
    this.addStormwatchFortress(this.stormwatchFortress);
    this.addBrokenBeacon(this.brokenBeacon);
    this.addTidefallCaverns(this.tidefallCaverns);
    this.addKingsSeaGate(this.kingsSeaGate);
    this.addWreckersPoint(this.wreckersPoint);
    this.addDrownedCitadel(this.drownedCitadel);
    this.addTidalPaths();
    this.addShatteredCoastRewards();
  }

  addShatteredCoastMass() {
    if (this.performanceMode) {
      return;
    }
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(72, 92, 2, 2), this.materials.seaWater);
    ocean.position.set(-184, this.terrain.getHeightAt(-174, -154) - 0.58, -150);
    ocean.rotation.x = -Math.PI / 2;
    ocean.receiveShadow = true;
    this.scene.add(ocean);

    for (let index = 0; index < 11; index += 1) {
      const x = -174 + (index % 4) * 9.5 + Math.sin(index) * 2.2;
      const z = -176 + Math.floor(index / 4) * 23 + Math.cos(index * 0.7) * 3.8;
      this.addOrganicRockCluster(x, z, 1.8 + (index % 3) * 0.46, index, index % 2 ? this.materials.cliffStone : this.materials.caveStone);
      if (index % 3 === 0) {
        const foam = new THREE.Mesh(new THREE.PlaneGeometry(7 + index % 2, 1.0), this.materials.seaFoam);
        foam.position.set(x - 4.5, this.terrain.getHeightAt(x, z) + 0.05, z + 1.1);
        foam.rotation.set(-Math.PI / 2, 0, -0.18 + index * 0.08);
        this.scene.add(foam);
      }
    }

    [[-152, -130, 5.1], [-140, -139, 4.2], [-126, -158, 4.6], [-156, -174, 4.8], [-173, -124, 3.9]].forEach(([x, z, height], index) => {
      this.addPine(x, z, height, index % 2 ? this.materials.seaGrass : this.materials.pineDark);
    });
  }

  addShatteredCoastRoutes() {
    [
      [-116, -126, 15, 1.1, -0.46],
      [-132, -135, 16, 1.05, -0.56],
      [-144, -144, 14, 0.95, -0.62],
      [-156, -150, 12, 0.82, -0.18],
      [-166, -153, 10, 0.72, 0.28],
    ].forEach(([x, z, width, depth, yaw], index) => {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 3, 2), this.materials.sand);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.055, z);
      path.rotation.set(-Math.PI / 2, 0, yaw + Math.sin(index) * 0.05);
      path.receiveShadow = true;
      this.scene.add(path);
    });
  }

  addCoastalHarborSettlement(origin) {
    const service = (localX, localZ) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      return new THREE.Vector3(point.x, 0, point.z);
    };
    this.coastalHarborServices = {
      square: service(0.8, 0.4),
      docks: service(-5.9, -0.9),
      tavern: service(2.4, 4.2),
      market: service(0.1, 1.7),
      warehouse: service(-3.0, 3.3),
      bowyer: service(4.9, -1.4),
      lighthouseKeeper: service(6.5, 3.7),
      homes: [service(7.0, 6.7), service(-5.9, 6.0), service(8.4, 1.3)],
    };
    this.settlementHooks = this.settlementHooks ?? [];
    this.settlementHooks.push({
      id: "coastal-harbor",
      name: "Coastal Harbor",
      services: this.coastalHarborServices,
      futureUses: ["boat travel", "coastal contracts", "fish market", "lighthouse quests"],
    });

    this.addSettlementRoad(origin, 0.1, 2.2, 15, 2.0, -0.05, this.materials.sand);
    this.addSettlementRoad(origin, -4.3, 0.0, 2.0, 8.5, 0.12, this.materials.sand);
    this.addSettlementRoad(origin, 5.3, 2.2, 1.8, 8.0, -0.1, this.materials.sand);
    this.addHarborDock(origin, -6.2, -1.0, 5.8, 1.7, -0.08);
    this.addHarborDock(origin, -4.7, -3.4, 4.8, 1.35, 0.12);

    this.addSettlementBuilding(origin, "coastal-tavern", "Harbor Tavern", 2.4, 4.2, 4.8, 3.25, 2.05, -0.08, {
      material: this.materials.weatheredDock,
      roof: this.materials.lighthouseRed,
      sign: 0xffc579,
      porch: true,
      chimney: true,
    });
    this.addSettlementBuilding(origin, "coastal-warehouse", "Warehouse", -3.0, 3.3, 4.7, 3.3, 1.85, 0.08, {
      material: this.materials.agedWood,
      roof: this.materials.barkDark,
      sign: 0xd7bd83,
    });
    this.addSettlementBuilding(origin, "coastal-bowyer", "Coast Bowyer", 4.9, -1.4, 3.8, 2.7, 1.8, 0.12, {
      material: this.materials.wood,
      roof: this.materials.pineDark,
      sign: 0x82c8ff,
      bowRack: true,
    });
    this.addSettlementBuilding(origin, "lighthouse-keeper-hut", "Keeper", 6.5, 3.7, 3.4, 2.45, 1.7, -0.18, {
      material: this.materials.lighthouseWhite,
      roof: this.materials.lighthouseRed,
      sign: 0xffd166,
    });
    [
      [7.0, 6.7, 3.0, 2.2, 1.55, 0.12],
      [-5.9, 6.0, 3.2, 2.4, 1.6, -0.16],
      [8.4, 1.3, 2.9, 2.25, 1.52, 0.08],
    ].forEach(([localX, localZ, width, depth, height, yawOffset], index) => {
      this.addSettlementBuilding(origin, `coastal-home-${index + 1}`, "Harbor Home", localX, localZ, width, depth, height, yawOffset, {
        material: index % 2 ? this.materials.weatheredDock : this.materials.agedWood,
        roof: index % 2 ? this.materials.barkDark : this.materials.lighthouseRed,
        sign: 0xd9b978,
      });
    });
    this.addSettlementMarket(origin, 0.1, 1.7, "coastal");
    this.addHarborBoats(origin);
    this.addSettlementAtmosphere(origin, [
      [-5.2, 2.3, "barrels"],
      [-1.4, 4.8, "laundry"],
      [3.8, 1.1, "sign"],
      [7.7, 5.7, "garden"],
      [-7.0, -0.2, "firewood"],
    ]);
    this.interactables.push({
      id: "coastal-harbor-rumor-board",
      type: "lore-note",
      name: "Harbor Rumor Board",
      prompt: "E Read harbor rumors",
      position: new THREE.Vector3(origin.x + 0.5, this.terrain.getHeightAt(origin.x, origin.z) + 0.85, origin.z + 1.6),
      radius: 3.6,
      text: "Fisherfolk trade stories of vanished records, storm-lit fortresses, and a sea route older than the kingdom.",
    });
  }

  addHarborDock(origin, localX, localZ, length, width, yawOffset = 0) {
    const point = this.getSettlementPoint(origin, localX, localZ);
    const y = this.terrain.getHeightAt(point.x, point.z);
    const yaw = (origin.yaw ?? 0) + yawOffset;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, width), this.materials.weatheredDock);
    deck.position.set(point.x, y + 0.12, point.z);
    deck.rotation.y = yaw;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.scene.add(deck);
    for (let index = 0; index < 4; index += 1) {
      const offset = -length * 0.38 + index * (length * 0.25);
      [-1, 1].forEach((side) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.1, 7), this.materials.barkDark);
        const x = point.x + Math.cos(yaw) * offset - Math.sin(yaw) * side * width * 0.42;
        const z = point.z + Math.sin(yaw) * offset + Math.cos(yaw) * side * width * 0.42;
        post.position.set(x, this.terrain.getHeightAt(x, z) + 0.55, z);
        this.scene.add(post);
      });
    }
    this.addCollisionBox(point.x, point.z, length, width, 0.5, yaw);
  }

  addHarborBoats(origin) {
    [[-8.1, -2.9, 1.0], [-5.6, -4.9, -0.2], [-9.2, 0.1, 0.3]].forEach(([localX, localZ, yawOffset], index) => {
      const point = this.getSettlementPoint(origin, localX, localZ);
      const y = this.terrain.getHeightAt(point.x, point.z);
      const yaw = (origin.yaw ?? 0) + yawOffset;
      const boat = new THREE.Group();
      boat.position.set(point.x, y + 0.18, point.z);
      boat.rotation.y = yaw;
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.54, 2.2, 8), index % 2 ? this.materials.weatheredDock : this.materials.agedWood);
      hull.scale.z = 0.48;
      hull.rotation.z = Math.PI / 2;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.45, 6), this.materials.barkDark);
      mast.position.y = 0.76;
      const sail = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.92, 3), this.materials.parchment);
      sail.position.set(0.18, 0.9, 0);
      sail.rotation.z = -Math.PI / 2;
      boat.add(hull, mast, sail);
      this.scene.add(boat);
    });
  }

  addStormwatchFortress(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const fort = new THREE.Group();
    fort.position.set(origin.x, y, origin.z);
    fort.rotation.y = origin.yaw;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.0, 0.58, 9), this.materials.kingdomDarkStone);
    base.position.y = 0.28;
    const keep = new THREE.Mesh(new THREE.BoxGeometry(4.9, 3.1, 4.0), this.materials.kingdomStone);
    keep.position.y = 1.85;
    const roof = this.createLayeredGableRoof(5.3, 4.4, 3.45, this.materials.weatheredDock, { pitch: 0.38, overhang: 0.52, asymmetry: 0.12 });
    this.addBuildingCraftDetails(fort, 4.9, 4.0, 3.1, { trim: this.materials.kingdomGold, beam: this.materials.kingdomDarkStone });
    fort.add(base, keep, roof);

    [-1.9, 0, 1.9].forEach((xOffset, index) => {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.35 - index * 0.14, 0.5), this.materials.kingdomDarkStone);
      buttress.position.set(xOffset, 1.45, -2.22);
      buttress.rotation.z = (index - 1) * 0.035;
      fort.add(buttress);
      const window = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 9), this.materials.warmWindow);
      window.position.set(xOffset + 0.48, 2.26, -2.27);
      window.rotation.x = Math.PI / 2;
      fort.add(window);
    });

    [[-2.9, -1.8], [2.8, -1.7], [-2.5, 1.9], [2.4, 1.75]].forEach(([x, z], index) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.86, 3.7 - index * 0.2, 8), this.materials.kingdomDarkStone);
      tower.position.set(x, 1.85, z);
      const cap = this.createLayeredGableRoof(1.3, 1.1, 3.72 - index * 0.18, this.materials.weatheredDock, { pitch: 0.32, overhang: 0.18, asymmetry: index * 0.02 });
      cap.position.set(x, 0, z);
      fort.add(tower, cap);
    });

    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 8, 32), this.materials.kingdomGold);
    crest.position.set(0, 2.8, -2.08);
    crest.rotation.x = Math.PI / 2;
    fort.add(crest);
    fort.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(fort);
    this.addCollisionBox(origin.x, origin.z, 5.4, 4.4, 3.8, origin.yaw);
  }

  addBrokenBeacon(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const beacon = new THREE.Group();
    beacon.position.set(origin.x, y, origin.z);
    beacon.rotation.y = origin.yaw;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.18, 5.4, 10), this.materials.lighthouseWhite);
    shaft.position.y = 2.7;
    shaft.scale.x = 0.82;
    const brokenTop = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.72, 0.65, 8), this.materials.lighthouseRed);
    brokenTop.position.set(0.28, 5.55, -0.12);
    brokenTop.rotation.z = -0.22;
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), this.materials.warmWindow);
    lantern.position.set(0.35, 5.9, -0.18);
    beacon.add(shaft, brokenTop, lantern);
    [-1, 1].forEach((side) => {
      const crackedRib = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 5.2, 6), this.materials.kingdomDarkStone);
      crackedRib.position.set(side * 0.7, 2.8, -0.08);
      crackedRib.rotation.z = side * 0.08;
      beacon.add(crackedRib);
    });
    beacon.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    this.scene.add(beacon);
    this.addCollisionCylinder(origin.x, origin.z, 1.08, 5.8);
  }

  addTidefallCaverns(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const cave = new THREE.Group();
    cave.position.set(origin.x, y, origin.z);
    cave.rotation.y = origin.yaw;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.32, 8, 32, Math.PI), this.materials.caveStone);
    arch.position.y = 1.75;
    arch.rotation.z = Math.PI;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.8), this.materials.seaWater);
    pool.position.set(0, 0.08, -1.5);
    pool.rotation.x = -Math.PI / 2;
    cave.add(arch, pool);
    [-3.1, -1.8, 1.9, 3.2].forEach((xOffset, index) => {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.18 + index * 0.02, 1.1 + index * 0.12, 5), this.materials.caveStone);
      tooth.position.set(xOffset, 0.62 + index * 0.08, -0.2);
      tooth.rotation.z = (index - 1.5) * 0.12;
      cave.add(tooth);
    });
    cave.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(cave);
    this.addCollisionCylinder(origin.x - 2.8, origin.z, 0.9, 2.8);
    this.addCollisionCylinder(origin.x + 2.4, origin.z, 0.9, 2.8);
  }

  addKingsSeaGate(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const gate = new THREE.Group();
    gate.position.set(origin.x, y, origin.z);
    gate.rotation.y = origin.yaw;
    [-1, 1].forEach((side) => {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.6, 1.0), this.materials.kingdomStone);
      pier.position.set(side * 1.55, 1.8, 0);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.42, 1.18), this.materials.kingdomGold);
      cap.position.set(side * 1.55, 3.74, 0);
      gate.add(pier, cap);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.48, 1.08), this.materials.kingdomDarkStone);
    lintel.position.y = 3.4;
    const seaSigil = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 30), this.materials.archiveBlue);
    seaSigil.position.set(0, 2.75, -0.58);
    seaSigil.rotation.x = Math.PI / 2;
    gate.add(lintel, seaSigil);
    gate.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(gate);
    this.addCollisionBox(origin.x, origin.z, 4.6, 1.1, 3.9, origin.yaw);
  }

  addWreckersPoint(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const wreck = new THREE.Group();
    wreck.position.set(origin.x, y, origin.z);
    wreck.rotation.y = origin.yaw;
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.08, 5.3, 8), this.materials.weatheredDock);
    hull.position.set(0, 0.65, 0);
    hull.rotation.set(Math.PI / 2, 0, 0.18);
    hull.scale.z = 0.52;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.2, 7), this.materials.barkDark);
    mast.position.set(-0.45, 2.0, 0.15);
    mast.rotation.z = -0.32;
    const sail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.65, 1.18), this.materials.canvas);
    sail.position.set(-0.72, 2.05, 0.18);
    sail.rotation.z = -0.28;
    wreck.add(hull, mast, sail);
    wreck.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(wreck);
    this.addCollisionBox(origin.x, origin.z, 5.4, 1.4, 1.4, origin.yaw);
  }

  addDrownedCitadel(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const citadel = new THREE.Group();
    citadel.position.set(origin.x, y, origin.z);
    citadel.rotation.y = origin.yaw;
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.2, 0.32, 11), this.materials.sunkenStone);
    platform.position.y = 0.16;
    citadel.add(platform);
    [[-2.0, -1.7, 3.1], [2.2, -1.2, 2.4], [-1.5, 1.9, 2.0], [1.8, 1.7, 2.7]].forEach(([x, z, height], index) => {
      const ruin = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.62, height, 8), index % 2 ? this.materials.sunkenStone : this.materials.kingdomStone);
      ruin.position.set(x, height * 0.5 + 0.2, z);
      ruin.rotation.z = (index - 1.5) * 0.08;
      citadel.add(ruin);
    });
    const floodedCourt = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18), this.materials.seaWater);
    floodedCourt.position.y = 0.36;
    floodedCourt.rotation.x = -Math.PI / 2;
    citadel.add(floodedCourt);
    citadel.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(citadel);
    this.addCollisionCylinder(origin.x, origin.z, 1.0, 3.0);
  }

  addTidalPaths() {
    [
      { id: "tidefall-citadel", x: -158, z: -167, width: 16, depth: 1.1, yaw: 0.28, target: "drowned-citadel" },
      { id: "beacon-cove", x: -172, z: -151, width: 12, depth: 1.0, yaw: -0.56, target: "broken-beacon" },
    ].forEach((path) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(path.width, path.depth, 3, 1), this.materials.sand);
      mesh.position.set(path.x, this.terrain.getHeightAt(path.x, path.z) + 0.09, path.z);
      mesh.rotation.set(-Math.PI / 2, 0, path.yaw);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.tidalPathObjects.push({ ...path, mesh });
    });
    this.updateTidalPaths();
  }

  updateTidalPaths() {
    if (!this.tidalPathObjects?.length) return;
    const lowTide = Math.sin((this.timeOfDay ?? 0) * Math.PI * 4) > -0.18;
    this.tidalPathObjects.forEach((path) => {
      path.mesh.visible = lowTide;
      path.open = lowTide;
    });
  }

  isTidalPathOpen(id) {
    return Boolean(this.tidalPathObjects?.find((path) => path.id === id)?.open);
  }

  addShatteredCoastRewards() {
    this.addTarget(-153, -131, -0.45, 0.72, { challengeId: "shatteredCoastTargets", challengeLabel: "Stormwatch Range", yOffset: 1.8 });
    this.addTarget(-136, -156, 0.85, 0.62, { challengeId: "shatteredCoastTargets", challengeLabel: "King's Sea Gate", yOffset: 1.0 });
    this.addTarget(-166, -163, -0.25, 0.58, { challengeId: "shatteredCoastTargets", challengeLabel: "Drowned Citadel", yOffset: 0.55 });
    this.addSimpleLandmarkPickup(-162, -123, "Salt-King Record", 180, "A ruined fortress record says old rulers traded by sea before the archives burned.");
    this.addSimpleLandmarkPickup(-171, -156, "Tide-Key Fragment", 160, "A barnacled fragment marks hidden routes that only appear at low tide.");
    this.addRareLootCache(-144, -169, "Stormcaller Beacon Shard", "legendary", "A storm-bright shard used as a future proof for Stormcaller.");
    this.interactables.push({
      id: "shattered-coast-records",
      type: "lore-note",
      name: "Destroyed Coastal Records",
      prompt: "E Read records",
      position: new THREE.Vector3(-158, this.terrain.getHeightAt(-158, -132) + 1.0, -132),
      radius: 3.2,
      text: "The sea led kings to older truths. Someone burned the harbor records before the last voyage returned.",
    });
  }

  addVeiledWilds() {
    this.veiledWilds = { x: -42, z: -148, yaw: 0.18, scale: 1 };
    this.worldrootGrove = { x: -52, z: -160, yaw: -0.28 };
    this.hiddenLake = { x: -18, z: -142, yaw: 0.12 };
    this.greenheartRuins = { x: -62, z: -130, yaw: 0.48 };
    this.sleepingArch = { x: -30, z: -169, yaw: -0.62 };
    this.mistveilHollow = { x: -73, z: -154, yaw: 0.28 };
    this.forgottenCircleWilds = { x: -46, z: -121, yaw: -0.1 };
    this.veiledHiddenPaths = [];

    this.addVeiledWildsCanopy();
    this.addVeiledWildsRoutes();
    this.addWorldrootGrove(this.worldrootGrove);
    this.addHiddenLakeLandmark(this.hiddenLake);
    this.addGreenheartRuins(this.greenheartRuins);
    this.addSleepingArch(this.sleepingArch);
    this.addMistveilHollow(this.mistveilHollow);
    this.addForgottenCircleWilds(this.forgottenCircleWilds);
    this.addVeiledHiddenPaths();
    this.addVeiledWildsRewards();
  }

  addVeiledWildsCanopy() {
    if (this.performanceMode) {
      return;
    }
    const trees = [
      [-56, -154, 7.2], [-48, -168, 8.4], [-34, -161, 6.7], [-66, -139, 6.5],
      [-23, -134, 5.8], [-70, -164, 6.9], [-40, -122, 5.9], [-16, -151, 6.4],
      [-58, -118, 5.8], [-75, -146, 6.2], [-28, -174, 5.7], [-12, -128, 5.4],
    ];
    trees.forEach(([x, z, height], index) => {
      this.addAncientWildTree(x, z, height, index);
    });
    [[-64, -156], [-38, -157], [-22, -139], [-56, -126], [-31, -127], [-72, -148]].forEach(([x, z], index) => {
      this.addOrganicRockCluster(x, z, 1.1 + (index % 3) * 0.22, index, index % 2 ? this.materials.mossStone : this.materials.mistStone);
    });
  }

  addAncientWildTree(x, z, height, seed = 0) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.72, height, 9), this.materials.elderBark);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = Math.sin(seed * 1.7) * 0.08;
    group.add(trunk);
    for (let rootIndex = 0; rootIndex < 5; rootIndex += 1) {
      const angle = seed + rootIndex * 1.25;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 1.2 + (rootIndex % 2) * 0.36, 5, 7), this.materials.elderBark);
      root.position.set(Math.sin(angle) * 0.72, 0.18, Math.cos(angle) * 0.72);
      root.rotation.set(Math.PI / 2, 0, angle);
      group.add(root);
    }
    for (let tier = 0; tier < 3; tier += 1) {
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.28 - tier * 0.16, 1), tier % 2 ? this.materials.mistLeaf : this.materials.mistLeafDark);
      canopy.position.set(Math.sin(seed + tier) * 0.38, height * (0.68 + tier * 0.1), Math.cos(seed * 0.7 + tier) * 0.32);
      canopy.scale.set(1.5 - tier * 0.16, 0.72, 1.26 - tier * 0.08);
      group.add(canopy);
    }
    group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(group);
    this.addCollisionCylinder(x, z, 0.72, height * 0.72);
  }

  addVeiledWildsRoutes() {
    [
      [-48, -112, 14, 0.9, -1.38],
      [-46, -131, 16, 0.86, -0.08],
      [-54, -148, 18, 0.78, -0.58],
      [-31, -144, 15, 0.74, 1.08],
    ].forEach(([x, z, width, depth, yaw], index) => {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 4, 1), this.materials.visibleTrail);
      path.position.set(x, this.terrain.getHeightAt(x, z) + 0.06, z);
      path.rotation.set(-Math.PI / 2, 0, yaw + Math.sin(index) * 0.08);
      path.receiveShadow = true;
      this.scene.add(path);
    });
  }

  addWorldrootGrove(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 2.1, 7.6, 12), this.materials.elderBark);
    trunk.position.y = 3.8;
    group.add(trunk);
    for (let index = 0; index < 8; index += 1) {
      const angle = index * Math.PI * 0.25;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 4.0 + (index % 3) * 0.8, 6, 8), this.materials.elderBark);
      root.position.set(Math.sin(angle) * 2.2, 0.32, Math.cos(angle) * 2.2);
      root.rotation.set(Math.PI / 2, 0, angle);
      group.add(root);
    }
    for (let tier = 0; tier < 4; tier += 1) {
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 - tier * 0.24, 1), tier % 2 ? this.materials.mistLeaf : this.materials.mistLeafDark);
      canopy.position.set(Math.sin(tier) * 0.7, 6.1 + tier * 0.82, Math.cos(tier) * 0.55);
      canopy.scale.set(1.7, 0.62, 1.36);
      group.add(canopy);
    }
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), this.materials.glowPlant);
    heart.position.set(0, 2.2, -1.45);
    group.add(heart);
    group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 1.8, 7.2);
  }

  addHiddenLakeLandmark(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const lake = new THREE.Mesh(new THREE.CircleGeometry(5.8, 28), this.materials.water);
    lake.position.set(origin.x, y + 0.08, origin.z);
    lake.rotation.x = -Math.PI / 2;
    this.scene.add(lake);
    [[-5.8, -1.2], [5.4, 1.4], [-2.2, 4.8], [3.2, -4.2]].forEach(([dx, dz], index) => {
      this.addOrganicRockCluster(origin.x + dx, origin.z + dz, 0.8 + index * 0.12, index, this.materials.mossStone);
    });
    for (let index = 0; index < 7; index += 1) {
      const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.materials.glowPlant);
      const angle = index * 0.9;
      flower.position.set(origin.x + Math.sin(angle) * 5.0, y + 0.22, origin.z + Math.cos(angle) * 4.5);
      this.scene.add(flower);
    }
  }

  addGreenheartRuins(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.9, 0.34, 10), this.materials.mossStone);
    plinth.position.y = 0.17;
    group.add(plinth);
    [[-2.0, -1.4, 2.8], [2.1, -1.1, 2.1], [-1.7, 1.7, 1.8], [1.9, 1.8, 2.5]].forEach(([x, z, height], index) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, height, 7), index % 2 ? this.materials.mistStone : this.materials.mossStone);
      pillar.position.set(x, height * 0.5 + 0.2, z);
      pillar.rotation.z = (index - 1.5) * 0.08;
      group.add(pillar);
    });
    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 8, 32), this.materials.glowPlant);
    marker.position.set(0, 1.15, -2.5);
    marker.rotation.x = Math.PI / 2;
    group.add(marker);
    group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(group);
    this.addCollisionCylinder(origin.x, origin.z, 1.2, 2.8);
  }

  addSleepingArch(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const group = new THREE.Group();
    group.position.set(origin.x, y, origin.z);
    group.rotation.y = origin.yaw;
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.28, 9, 36, Math.PI), this.materials.mossStone);
    arch.position.y = 2.0;
    arch.rotation.z = Math.PI;
    group.add(arch);
    [-2.65, 2.65].forEach((xOffset) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 2.1, 8), this.materials.mistStone);
      base.position.set(xOffset, 1.05, 0);
      group.add(base);
    });
    group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    this.scene.add(group);
    this.addCollisionCylinder(origin.x - 2.2, origin.z, 0.72, 2.4);
    this.addCollisionCylinder(origin.x + 2.2, origin.z, 0.72, 2.4);
  }

  addMistveilHollow(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    const hollow = new THREE.Group();
    hollow.position.set(origin.x, y, origin.z);
    hollow.rotation.y = origin.yaw;
    const bowl = new THREE.Mesh(new THREE.CircleGeometry(4.4, 24), this.materials.visibleTrail);
    bowl.position.y = 0.08;
    bowl.rotation.x = -Math.PI / 2;
    hollow.add(bowl);
    for (let index = 0; index < 6; index += 1) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8 + index * 0.06, 6), this.materials.elderBark);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), this.materials.glowPlant);
      const angle = index * 1.05;
      stem.position.set(Math.sin(angle) * 3.1, 0.42, Math.cos(angle) * 2.8);
      bulb.position.set(stem.position.x, stem.position.y + 0.48, stem.position.z);
      hollow.add(stem, bulb);
    }
    this.scene.add(hollow);
  }

  addForgottenCircleWilds(origin) {
    const y = this.terrain.getHeightAt(origin.x, origin.z);
    for (let index = 0; index < 9; index += 1) {
      const angle = index * Math.PI * 2 / 9;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.4 + (index % 3) * 0.22, 0.32), index % 2 ? this.materials.mistStone : this.materials.mossStone);
      stone.position.set(origin.x + Math.sin(angle) * 3.6, y + stone.geometry.parameters.height * 0.5, origin.z + Math.cos(angle) * 3.6);
      stone.rotation.set(0.08, angle + origin.yaw, (index - 4) * 0.025);
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);
      this.addCollisionBox(stone.position.x, stone.position.z, 0.7, 0.5, 1.8, angle + origin.yaw);
    }
  }

  addVeiledHiddenPaths() {
    [
      { id: "worldroot-trail", x: -55, z: -149, width: 14, depth: 0.9, yaw: -0.92 },
      { id: "lake-trail", x: -30, z: -144, width: 13, depth: 0.8, yaw: 1.2 },
      { id: "circle-trail", x: -46, z: -128, width: 12, depth: 0.82, yaw: 0.08 },
    ].forEach((path) => {
      const material = this.materials.visibleTrail.clone();
      material.opacity = 0.18;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(path.width, path.depth, 4, 1), material);
      mesh.position.set(path.x, this.terrain.getHeightAt(path.x, path.z) + 0.085, path.z);
      mesh.rotation.set(-Math.PI / 2, 0, path.yaw);
      mesh.visible = false;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.veiledHiddenPaths.push({ ...path, mesh });
    });
  }

  revealVeiledHiddenPath(id = "all") {
    if (!this.veiledHiddenPaths?.length) return;
    this.veiledHiddenPaths.forEach((path) => {
      if (id !== "all" && path.id !== id) return;
      path.mesh.visible = true;
      path.mesh.material.opacity = 0.68;
    });
  }

  addVeiledWildsRewards() {
    this.addTarget(-54, -158, -0.28, 0.62, { challengeId: "veiledWildsTargets", challengeLabel: "Worldroot Grove", yOffset: 1.2 });
    this.addTarget(-31, -168, 0.72, 0.58, { challengeId: "veiledWildsTargets", challengeLabel: "Sleeping Arch", yOffset: 1.0 });
    this.addTarget(-47, -121, -0.1, 0.6, { challengeId: "veiledWildsTargets", challengeLabel: "Forgotten Circle", yOffset: 0.9 });
    this.addSimpleLandmarkPickup(-62, -130, "Greenheart Record", 180, "Moss-covered markings say multiple civilizations crossed the hidden road.");
    this.addSimpleLandmarkPickup(-18, -142, "Lake-Sealed Memory", 170, "A reflected carving suggests someone buried the route on purpose.");
    this.addRareLootCache(-73, -154, "Whisperbranch Marker", "legendary", "A patient greenwood marker used as future proof for Whisperbranch.");
    this.interactables.push({
      id: "veiled-wilds-carving",
      type: "lore-note",
      name: "Root-Hidden Carving",
      prompt: "E Read carving",
      position: new THREE.Vector3(-52, this.terrain.getHeightAt(-52, -160) + 1.0, -160),
      radius: 3.2,
      text: "Nature covered more than ruins here. Whole roads were hidden, and someone wanted them forgotten.",
    });
  }

  addGearPickup(x, z, category, itemId, name, prompt, text, requiresQuest = null) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.38, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.12, 8), this.materials.darkStone);
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), category === "bows" ? this.materials.targetGold : this.materials.crystalBlue);
    glint.position.y = 0.2;
    group.add(base, glint);
    this.scene.add(group);
    this.interactables.push({
      id: `gear-${category}-${itemId}`,
      type: "gear-pickup",
      category,
      itemId,
      name,
      prompt,
      position: new THREE.Vector3(x, y + 0.44, z),
      radius: 2.4,
      group,
      requiresQuest,
      lockedText: "Rowan seems to be saving this for after your current lesson.",
      text,
    });
  }

  addSimpleLandmarkPickup(x, z, name, xp, text) {
    const y = this.terrain.getHeightAt(x, z);
    const group = new THREE.Group();
    group.position.set(x, y + 0.32, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.1, 7), this.materials.darkStone);
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.materials.targetGold);
    glint.position.y = 0.18;
    group.add(base, glint);
    this.scene.add(group);
    this.interactables.push({
      id: `expanded-pickup-${name.toLowerCase().replaceAll(" ", "-")}`,
      type: "xp-pickup",
      name,
      prompt: "E Collect",
      position: new THREE.Vector3(x, y + 0.35, z),
      radius: 2.1,
      xp,
      group,
      text: `${text} +${xp} XP`,
    });
  }
}
