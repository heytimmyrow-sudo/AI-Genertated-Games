import { SETTINGS } from "../config/settings.js";
import {
  getPlayerVerticalDelta,
  tryDamagePlayer,
  updateAttackCooldown,
} from "../systems/CombatDamage.js";

const { THREE } = window;

const scratchDirection = new THREE.Vector3();

export class Enemy {
  constructor(type, scene, world, position, patrolPoints, feedback = null, options = {}) {
    this.type = type;
    this.scene = scene;
    this.world = world;
    this.feedback = feedback;
    this.config = SETTINGS.enemies[type];
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.state = "patrol";
    this.aggroed = false;
    this.patrolIndex = 0;
    this.patrolPoints = patrolPoints.map((point) => new THREE.Vector3(point[0], 0, point[1]));
    this.homePosition = new THREE.Vector3(position[0], 0, position[1]);
    this.territory = {
      id: options.territory?.id ?? `${type}-territory`,
      center: new THREE.Vector3(
        options.territory?.center?.[0] ?? position[0],
        0,
        options.territory?.center?.[1] ?? position[1],
      ),
      radius: options.territory?.radius ?? this.config.leashRadius,
      resetHealthOnReturn: options.territory?.resetHealthOnReturn ?? true,
    };
    this.hitReactTimer = 0;
    this.hitDirection = new THREE.Vector3();
    this.moveVelocity = new THREE.Vector3();
    this.statusEffects = { burn: 0, slow: 0, burnTick: 0 };
    this.attackCooldown = 0;
    this.tacticTimer = 0;
    this.tactic = "direct";
    this.strafeSign = Math.random() > 0.5 ? 1 : -1;
    this.lastCombatPosition = new THREE.Vector3(position[0], 0, position[1]);
    this.stuckTimer = 0;
    this.defeatTimer = 0;
    this.active = true;
    this.removed = false;
    this.group = this.createMeshForType(type);
    this.group.position.set(position[0], 0, position[1]);
    this.placeOnGround();
    scene.add(this.group);
    this.registerColliders();
  }

  createMeshForType(type) {
    if (type === "crawler") return this.createCrawler();
    if (type === "frostCrawler") return this.createCrawler({
      body: 0x8fb8c8,
      shell: 0xd8eef8,
      trim: 0x9ccfff,
      moss: 0xb7e4ff,
      eye: 0x8ddcff,
      scale: 1.08,
    });
    if (type === "iceStag") return this.createWolf({
      fur: 0xc8d8d8,
      dark: 0x6f8ea0,
      belly: 0xf2f8ef,
      mane: 0x9fc8dc,
      eye: 0x8ddcff,
      antlers: true,
      scale: 1.18,
    });
    if (type === "snowWolf") return this.createWolf({
      fur: 0xdde6df,
      dark: 0x718aa0,
      belly: 0xf5f2df,
      mane: 0xb8d8e8,
      eye: 0x8ddcff,
      scale: 1.05,
    });
    if (type === "tideCrawler") return this.createCrawler({
      body: 0x335d59,
      shell: 0x8f7650,
      trim: 0xc9b070,
      moss: 0x6f9b73,
      eye: 0x8df0ff,
      scale: 1.02,
    });
    if (type === "shellbackBeast") return this.createCrawler({
      body: 0x3b5548,
      shell: 0x6d5c42,
      trim: 0xd0b66d,
      moss: 0x7f9966,
      eye: 0xffd37a,
      scale: 1.32,
    });
    if (type === "cliffRaptor") return this.createRaptor({
      body: 0x8c744f,
      wing: 0xb9975f,
      accent: 0x513c2e,
      eye: 0xffd06f,
      scale: 1.05,
    });
    if (type === "windGull") return this.createRaptor({
      body: 0xd7d7c7,
      wing: 0x8fa0a0,
      accent: 0xf0c36a,
      eye: 0x8ddcff,
      scale: 0.68,
      gull: true,
    });
    if (type === "mistStag") return this.createWolf({
      fur: 0x8aa88c,
      dark: 0x34483c,
      belly: 0xc7d6bb,
      mane: 0x6fcf9a,
      eye: 0x9dffd0,
      antlers: true,
      scale: 1.16,
    });
    if (type === "glowFox") return this.createWolf({
      fur: 0xb27c4a,
      dark: 0x4b3329,
      belly: 0xffd08c,
      mane: 0x8ff0b1,
      eye: 0x9dffd0,
      scale: 0.78,
    });
    if (type === "rootBeast") return this.createCrawler({
      body: 0x42513b,
      shell: 0x5b3e2e,
      trim: 0x8fbc72,
      moss: 0x7ab36b,
      eye: 0x9dffd0,
      scale: 1.34,
    });
    if (type === "forestWisp") return this.createWisp({
      core: 0x9dffd0,
      halo: 0x6fd6ff,
      scale: 1,
    });
    if (type === "marshStalker") return this.createWolf({
      fur: 0x44513c,
      dark: 0x23281f,
      belly: 0x6f7e4d,
      mane: 0x8fb56a,
      eye: 0x9af6b9,
      scale: 1.08,
    });
    if (type === "mudCrawler") return this.createCrawler({
      body: 0x3d3529,
      shell: 0x5a4a35,
      trim: 0x8c7f4f,
      moss: 0x6f7e4d,
      eye: 0x9af6b9,
      scale: 1.18,
    });
    if (type === "mireBat") return this.createRaptor({
      body: 0x394135,
      wing: 0x253027,
      accent: 0x8fb56a,
      eye: 0x9af6b9,
      scale: 0.62,
      gull: true,
    });
    if (type === "swampHornbeast") return this.createWolf({
      fur: 0x5a5639,
      dark: 0x2f3325,
      belly: 0x87784f,
      mane: 0x6f7e4d,
      eye: 0xffd37a,
      antlers: true,
      scale: 1.34,
    });
    if (type === "canyonStrider") return this.createWolf({
      fur: 0xb7603b,
      dark: 0x5c2b22,
      belly: 0xd2965f,
      mane: 0xffb45f,
      eye: 0xffd37a,
      scale: 0.92,
    });
    if (type === "rockbackRam") return this.createWolf({
      fur: 0x8b4b34,
      dark: 0x4b241e,
      belly: 0xc68455,
      mane: 0x6f3328,
      eye: 0xffd37a,
      antlers: true,
      scale: 1.26,
    });
    if (type === "dustRaptor") return this.createRaptor({
      body: 0xb46a42,
      wing: 0xd2965f,
      accent: 0x6f3328,
      eye: 0xffd37a,
      scale: 0.94,
    });
    if (type === "sandViper") return this.createCrawler({
      body: 0x9f5736,
      shell: 0xd2965f,
      trim: 0xffb45f,
      moss: 0x6f3328,
      eye: 0xffd37a,
      scale: 0.72,
    });
    if (type === "ashHound") return this.createWolf({
      fur: 0x4c4542,
      dark: 0x17191d,
      belly: 0x8d3d2d,
      mane: 0xff6a1d,
      eye: 0xffb65d,
      scale: 1.02,
    });
    if (type === "emberDrake") return this.createRaptor({
      body: 0x5b2b24,
      wing: 0xc24f2f,
      accent: 0xff8b35,
      eye: 0xffd37a,
      scale: 0.98,
    });
    if (type === "magmaCrawler") return this.createCrawler({
      body: 0x352f2e,
      shell: 0x8d3d2d,
      trim: 0xff6a1d,
      moss: 0x16181c,
      eye: 0xffb65d,
      scale: 1.18,
    });
    if (type === "firehornBeast") return this.createWolf({
      fur: 0x6f3328,
      dark: 0x1a1414,
      belly: 0xa85435,
      mane: 0xff6a1d,
      eye: 0xffd37a,
      antlers: true,
      scale: 1.38,
    });
    if (type === "astralStag") return this.createWolf({
      fur: 0x7f86d8,
      dark: 0x2a2d58,
      belly: 0xd9dcff,
      mane: 0x9fdcff,
      eye: 0xfff0c2,
      antlers: true,
      scale: 1.26,
    });
    if (type === "crystalWyrm") return this.createCrawler({
      body: 0x34305f,
      shell: 0x7f6fff,
      trim: 0xcdb7ff,
      moss: 0x8ddcff,
      eye: 0xfff0c2,
      scale: 1.38,
    });
    if (type === "starboundHunter") return this.createWolf({
      fur: 0x4d547f,
      dark: 0x171a35,
      belly: 0xb8c8ff,
      mane: 0xffd166,
      eye: 0xfff0c2,
      scale: 1.05,
    });
    if (type === "celestialWisp") return this.createWisp({
      core: 0xfff0c2,
      halo: 0xb99cff,
      scale: 1.18,
    });
    if (type === "moonclawBeast") return this.createWolf({
      fur: 0x58629d,
      dark: 0x202348,
      belly: 0xbfc8ff,
      mane: 0xb99cff,
      eye: 0xfff0c2,
      antlers: true,
      scale: 1.46,
    });
    if (type === "plainsStag") return this.createWolf({
      fur: 0xb79a5d,
      dark: 0x5f4f32,
      belly: 0xf0d690,
      mane: 0xd7b86a,
      eye: 0xffd37a,
      antlers: true,
      scale: 1.12,
    });
    if (type === "riverfang") return this.createWolf({
      fur: 0x4f7668,
      dark: 0x263c36,
      belly: 0xa5d6c8,
      mane: 0x6bb2a8,
      eye: 0x8df0ff,
      scale: 0.96,
    });
    if (type === "skyHawk") return this.createRaptor({
      body: 0xb89563,
      wing: 0xe0c078,
      accent: 0x5f4b2d,
      eye: 0xffd37a,
      scale: 0.72,
      gull: true,
    });
    if (type === "frontierWolf") return this.createWolf({
      fur: 0x8a734a,
      dark: 0x3f3324,
      belly: 0xc7b278,
      mane: 0xb89563,
      eye: 0xffcf5f,
      scale: 1.02,
    });
    if (type === "stonehideGrazer") return this.createCrawler({
      body: 0x7f795d,
      shell: 0xa8a07d,
      trim: 0x5f6848,
      moss: 0x9fbf63,
      eye: 0xffd37a,
      scale: 1.42,
    });
    if (type === "kingdomSentinel") return this.createWolf({
      fur: 0x8f8973,
      dark: 0x3f4238,
      belly: 0xd9ad57,
      mane: 0x8bc8ff,
      eye: 0x8bc8ff,
      scale: 1.18,
    });
    if (type === "ruinStalker") return this.createWolf({
      fur: 0x5d604f,
      dark: 0x252820,
      belly: 0x8f8973,
      mane: 0x536f42,
      eye: 0xd9ad57,
      scale: 1.02,
    });
    if (type === "archiveWisp") return this.createWisp({
      core: 0x8bc8ff,
      halo: 0xd9ad57,
      scale: 1.12,
    });
    if (type === "stoneGuardian") return this.createCrawler({
      body: 0x4d5046,
      shell: 0x8f8973,
      trim: 0xd9ad57,
      moss: 0x536f42,
      eye: 0x8bc8ff,
      scale: 1.46,
    });
    if (type === "skyWyrm") return this.createRaptor({
      body: 0x5f66a8,
      wing: 0x9fdcff,
      accent: 0x8c6dff,
      eye: 0xffd98c,
      scale: 1.0,
    });
    if (type === "astralHunter") return this.createWolf({
      fur: 0x5b5f9c,
      dark: 0x1d2355,
      belly: 0xbfc8ff,
      mane: 0xffd98c,
      eye: 0x9fdcff,
      scale: 1.08,
    });
    if (type === "crystalDrake") return this.createCrawler({
      body: 0x38406c,
      shell: 0x8c6dff,
      trim: 0xbfc8ff,
      moss: 0x9fdcff,
      eye: 0xffd98c,
      scale: 1.34,
    });
    if (type === "celestialWatcher") return this.createWisp({
      core: 0xffd98c,
      halo: 0x8c6dff,
      scale: 1.22,
    });
    if (type === "reefStalker") return this.createWolf({
      fur: 0x4f6f68,
      dark: 0x263f3e,
      belly: 0xb8d0bd,
      mane: 0x6fa8a2,
      eye: 0x8df0ff,
      scale: 1.08,
    });
    if (type === "tideDrake") return this.createCrawler({
      body: 0x355c63,
      shell: 0x8f7650,
      trim: 0x9fdcff,
      moss: 0x6fa8a2,
      eye: 0x8df0ff,
      scale: 1.36,
    });
    if (type === "cliffTalon") return this.createRaptor({
      body: 0x7c6d58,
      wing: 0xa89a78,
      accent: 0x3f4650,
      eye: 0xffd37a,
      scale: 0.98,
    });
    if (type === "saltbackBeast") return this.createCrawler({
      body: 0x596b68,
      shell: 0xb9b18e,
      trim: 0xdaf0e6,
      moss: 0x6f9258,
      eye: 0xffd37a,
      scale: 1.52,
    });
    if (type === "deepwaterWisp") return this.createWisp({
      core: 0x8df0ff,
      halo: 0x315d69,
      scale: 1.18,
    });
    if (type === "rootStalker") return this.createWolf({
      fur: 0x3f5f3d,
      dark: 0x243526,
      belly: 0x8fa66a,
      mane: 0x5b3b25,
      eye: 0x9af6b9,
      scale: 1.12,
    });
    if (type === "wildhorn") return this.createCrawler({
      body: 0x5f6f3f,
      shell: 0x9b7f4e,
      trim: 0xd7bd83,
      moss: 0x6f9b59,
      eye: 0xffd37a,
      scale: 1.34,
    });
    if (type === "mossDrake") return this.createCrawler({
      body: 0x324f38,
      shell: 0x6f7a56,
      trim: 0x9af6b9,
      moss: 0x8fb56a,
      eye: 0x9af6b9,
      scale: 1.42,
    });
    if (type === "groveGuardian") return this.createCrawler({
      body: 0x4d5046,
      shell: 0x6b5f45,
      trim: 0x8ff0b1,
      moss: 0x466b55,
      eye: 0x8ff0b1,
      scale: 1.62,
    });
    if (type === "mistFox") return this.createWolf({
      fur: 0x8fa89a,
      dark: 0x40584d,
      belly: 0xd8e8d0,
      mane: 0x9af6b9,
      eye: 0xc5d8ff,
      scale: 0.82,
    });
    return this.createWolf();
  }

  createCrawler(style = {}) {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: style.body ?? 0x324f38, roughness: 0.86 });
    const shellMaterial = new THREE.MeshStandardMaterial({ color: style.shell ?? 0x765f3a, roughness: 0.78 });
    const shellTrimMaterial = new THREE.MeshStandardMaterial({ color: style.trim ?? 0xb38a4f, roughness: 0.62, emissive: style.trim ? 0x10354a : 0x000000, emissiveIntensity: style.trim ? 0.08 : 0 });
    const mossMaterial = new THREE.MeshStandardMaterial({ color: style.moss ?? 0x6f8b4b, roughness: 0.88 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: style.eye ?? 0xffd46f, roughness: 0.38, emissive: style.eye ?? 0x5a3206, emissiveIntensity: 0.42 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 12), bodyMaterial);
    body.scale.set(1.34, 0.42, 0.82);
    body.position.y = 0.42;
    body.castShadow = true;
    group.add(body);

    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.63, 16, 10), shellMaterial);
    shell.scale.set(1.18, 0.4, 0.86);
    shell.position.set(-0.18, 0.68, 0);
    shell.castShadow = true;
    group.add(shell);

    for (let index = 0; index < 4; index += 1) {
      const plate = new THREE.Mesh(new THREE.TorusGeometry(0.36 + index * 0.045, 0.012, 6, 20, Math.PI * 0.9), shellTrimMaterial);
      plate.position.set(-0.36 + index * 0.19, 0.74, 0);
      plate.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      plate.scale.set(1, 0.7, 1);
      plate.castShadow = true;
      group.add(plate);
    }

    for (let index = 0; index < 5; index += 1) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 5), shellTrimMaterial);
      spike.position.set(-0.58 + index * 0.24, 0.96, Math.sin(index) * 0.08);
      spike.rotation.z = -0.18 + index * 0.08;
      spike.castShadow = true;
      group.add(spike);
    }

    const mossPatch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 6), mossMaterial);
    mossPatch.position.set(-0.26, 0.88, -0.28);
    mossPatch.scale.set(1, 0.22, 0.65);
    group.add(mossPatch);

    for (let side = -1; side <= 1; side += 2) {
      for (let index = 0; index < 3; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.46, 4, 7), bodyMaterial);
        leg.position.set(-0.36 + index * 0.36, 0.23, side * 0.48);
        leg.rotation.set(Math.PI / 2, 0, side * (0.92 - index * 0.12));
        leg.castShadow = true;
        group.add(leg);
      }
    }

    for (const side of [-1, 1]) {
      const feeler = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.42, 4, 6), shellTrimMaterial);
      feeler.position.set(0.66, 0.62, side * 0.14);
      feeler.rotation.set(0.38, 0, side * 0.5);
      group.add(feeler);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), eyeMaterial);
      eye.position.set(0.74, 0.57, side * 0.11);
      group.add(eye);
    }
    group.userData.primaryBody = body;
    group.userData.shell = shell;
    group.userData.crawler = true;
    group.scale.setScalar(style.scale ?? 1);
    return group;
  }

  createWisp(style = {}) {
    const group = new THREE.Group();
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: style.core ?? 0x9dffd0,
      roughness: 0.32,
      transparent: true,
      opacity: 0.82,
      emissive: style.core ?? 0x9dffd0,
      emissiveIntensity: 0.72,
    });
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: style.halo ?? 0x6fd6ff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), coreMaterial);
    core.position.y = 0.9;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 32), haloMaterial);
    halo.position.y = 0.9;
    halo.rotation.x = Math.PI / 2;
    group.add(core, halo);
    group.userData.primaryBody = core;
    group.userData.halo = halo;
    group.userData.wisp = true;
    group.scale.setScalar(style.scale ?? 1);
    return group;
  }

  createRaptor(style = {}) {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: style.body ?? 0x8c744f, roughness: 0.82 });
    const wingMaterial = new THREE.MeshStandardMaterial({ color: style.wing ?? 0xb9975f, roughness: 0.78 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: style.accent ?? 0x513c2e, roughness: 0.84 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: style.eye ?? 0xffd06f, roughness: 0.34, emissive: style.eye ?? 0x5a3200, emissiveIntensity: 0.4 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.74, 7, 12), bodyMaterial);
    body.position.y = style.gull ? 0.72 : 0.62;
    body.rotation.z = Math.PI / 2;
    body.scale.set(0.9, style.gull ? 1.18 : 1.35, 0.72);
    body.castShadow = true;
    group.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), bodyMaterial);
    chest.position.set(0.42, body.position.y + 0.04, 0);
    chest.scale.set(0.86, 1.05, 0.82);
    chest.castShadow = true;
    group.add(chest);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 9), bodyMaterial);
    head.position.set(0.86, body.position.y + 0.15, 0);
    head.scale.set(1.05, 0.86, 0.8);
    head.castShadow = true;
    group.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, style.gull ? 0.36 : 0.28, 7), accentMaterial);
    beak.position.set(1.08, body.position.y + 0.12, 0);
    beak.rotation.z = -Math.PI / 2;
    beak.castShadow = true;
    group.add(beak);

    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMaterial);
      eye.position.set(1.0, body.position.y + 0.22, side * 0.08);
      group.add(eye);

      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.18, style.gull ? 1.25 : 0.95, 5), wingMaterial);
      wing.position.set(0.06, body.position.y + 0.02, side * 0.38);
      wing.rotation.set(Math.PI / 2, 0, side * 1.12);
      wing.scale.set(0.72, 1.1, 0.22);
      wing.castShadow = true;
      group.add(wing);
      if (!group.userData.wings) group.userData.wings = [];
      group.userData.wings.push({ mesh: wing, side });

      const talon = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 5), accentMaterial);
      talon.position.set(0.28, 0.27, side * 0.12);
      talon.rotation.x = side * 0.2;
      group.add(talon);
    });

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.54, 5), wingMaterial);
    tail.position.set(-0.58, body.position.y + 0.02, 0);
    tail.rotation.z = Math.PI / 2;
    tail.scale.set(0.65, 1, 0.4);
    group.add(tail);

    group.userData.primaryBody = body;
    group.userData.tail = tail;
    group.userData.canine = true;
    group.userData.avian = true;
    group.scale.setScalar(style.scale ?? 1);
    return group;
  }

  createWolf(style = {}) {
    const group = new THREE.Group();
    const furMaterial = new THREE.MeshStandardMaterial({ color: style.fur ?? 0x6b684f, roughness: 0.84 });
    const darkFurMaterial = new THREE.MeshStandardMaterial({ color: style.dark ?? 0x323d34, roughness: 0.88 });
    const bellyMaterial = new THREE.MeshStandardMaterial({ color: style.belly ?? 0x9b875e, roughness: 0.78 });
    const maneMaterial = new THREE.MeshStandardMaterial({ color: style.mane ?? 0x252f29, roughness: 0.9 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: style.eye ?? 0xffd37a, roughness: 0.34, emissive: style.eye ?? 0x5c3208, emissiveIntensity: 0.42 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.82, 7, 12), furMaterial);
    body.position.y = 0.58;
    body.rotation.z = Math.PI / 2;
    body.scale.set(0.92, 1.34, 0.78);
    body.castShadow = true;
    group.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 10), darkFurMaterial);
    chest.position.set(0.48, 0.66, 0);
    chest.scale.set(0.82, 1.05, 0.86);
    chest.castShadow = true;
    group.add(chest);

    const mane = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.58, 5), maneMaterial);
    mane.position.set(0.54, 0.84, -0.03);
    mane.rotation.z = Math.PI / 2;
    mane.scale.set(0.9, 1.1, 0.72);
    mane.castShadow = true;
    group.add(mane);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), bellyMaterial);
    belly.position.set(0.04, 0.48, 0.02);
    belly.scale.set(1.65, 0.55, 0.7);
    group.add(belly);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), furMaterial);
    head.position.set(0.92, 0.78, 0);
    head.scale.set(1.08, 0.9, 0.86);
    head.castShadow = true;
    group.add(head);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), darkFurMaterial);
    snout.position.set(1.18, 0.72, 0);
    snout.rotation.z = -Math.PI / 2;
    snout.scale.set(0.82, 1, 0.72);
    snout.castShadow = true;
    group.add(snout);

    for (let side = -1; side <= 1; side += 2) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMaterial);
      eye.position.set(1.12, 0.84, side * 0.12);
      group.add(eye);

      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.23, 4), darkFurMaterial);
      ear.position.set(0.84, 1, side * 0.15);
      ear.rotation.set(0.15, 0.25, side * 0.35);
      ear.castShadow = true;
      group.add(ear);

      for (let index = 0; index < 2; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.43, 4, 7), darkFurMaterial);
        leg.position.set(-0.28 + index * 0.65, 0.27, side * 0.18);
        leg.rotation.z = index === 0 ? -0.08 : 0.12;
        leg.castShadow = true;
        group.add(leg);
        if (!group.userData.legs) group.userData.legs = [];
        group.userData.legs.push({ mesh: leg, side, index });
      }
    }

    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.62, 5, 8), darkFurMaterial);
    tail.position.set(-0.72, 0.72, 0);
    tail.rotation.z = Math.PI / 2.8;
    tail.scale.set(1, 1.05, 0.82);
    tail.castShadow = true;
    group.add(tail);
    group.userData.primaryBody = body;
    group.userData.tail = tail;
    group.userData.mane = mane;
    group.userData.canine = true;
    if (style.antlers) {
      [-1, 1].forEach((side) => {
        const antler = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.72, 5), eyeMaterial);
        antler.position.set(0.96, 1.18, side * 0.18);
        antler.rotation.set(0.42, 0, side * 0.42);
        antler.castShadow = true;
        group.add(antler);
      });
    }
    group.scale.setScalar(style.scale ?? 1);
    return group;
  }

  registerColliders() {
    this.colliders = [];
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.enemy = this;
        this.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
  }

  update(deltaSeconds, player) {
    if (!this.active) {
      this.updateDefeated(deltaSeconds);
      return;
    }

    this.hitReactTimer = Math.max(0, this.hitReactTimer - deltaSeconds);
    updateAttackCooldown(this, deltaSeconds);
    this.updateStatusEffects(deltaSeconds);
    const playerPosition = player.group.position;
    const playerSafe = this.world.isSafeZone?.(playerPosition) ?? false;
    const enemySafe = this.world.isSafeZone?.(this.group.position) ?? false;
    const horizontalToPlayer = Math.hypot(playerPosition.x - this.group.position.x, playerPosition.z - this.group.position.z);
    const verticalToPlayer = getPlayerVerticalDelta(this.group.position, player);
    const distanceFromHome = Math.hypot(this.group.position.x - this.homePosition.x, this.group.position.z - this.homePosition.z);
    const playerInTerritory = this.isPointInTerritory(playerPosition, 1);
    const enemyInTerritory = this.isPointInTerritory(this.group.position, 1.12);
    const alertMultiplier = this.world.getCreatureAlertMultiplier?.() ?? 1;
    const canReachPlayer = verticalToPlayer <= (SETTINGS.enemies.verticalHitReach ?? SETTINGS.enemies.verticalReach);
    const canNoticePlayer = !playerSafe
      && !enemySafe
      && playerInTerritory
      && enemyInTerritory
      && horizontalToPlayer <= this.config.noticeDistance * alertMultiplier
      && verticalToPlayer <= (SETTINGS.enemies.combatNoticeVerticalRange ?? 6.5)
      && distanceFromHome <= this.config.leashRadius * 0.96;

    if (!this.aggroed && canNoticePlayer) {
      this.aggroed = true;
    }

    if (this.aggroed && (playerSafe || enemySafe || !playerInTerritory || !enemyInTerritory || distanceFromHome > this.config.leashRadius)) {
      this.aggroed = false;
      this.tactic = "direct";
      this.tacticTimer = 0;
    }

    if (!this.aggroed && (!enemyInTerritory || enemySafe || distanceFromHome > this.config.leashRadius * 0.85)) {
      this.state = "return";
    } else {
      this.state = this.aggroed ? (canReachPlayer ? this.selectCombatState(deltaSeconds, horizontalToPlayer) : "guard") : "patrol";
    }

    if (this.state === "chase") {
      this.moveToward(playerPosition, this.getEffectiveSpeed(this.config.chaseSpeed), deltaSeconds);
    } else if (this.state === "flank" || this.state === "circle") {
      this.moveWithTactic(playerPosition, this.getEffectiveSpeed(this.config.chaseSpeed), deltaSeconds, this.state);
    } else if (this.state === "retreat") {
      this.retreatFrom(playerPosition, this.getEffectiveSpeed(this.config.chaseSpeed * 0.72), deltaSeconds);
    } else if (this.state === "guard") {
      const baseTarget = new THREE.Vector3(playerPosition.x, 0, playerPosition.z);
      if (horizontalToPlayer > SETTINGS.enemies.elevatedGuardDistance) {
        this.moveToward(baseTarget, this.getEffectiveSpeed(this.config.chaseSpeed * 0.78), deltaSeconds);
      } else {
        this.faceToward(baseTarget);
      }
    } else if (this.state === "return") {
      this.moveToward(this.homePosition, this.getEffectiveSpeed(this.config.chaseSpeed * 0.8), deltaSeconds);
      if (this.group.position.distanceTo(this.homePosition) < 1) {
        this.state = "patrol";
        this.health = this.territory.resetHealthOnReturn ? this.maxHealth : Math.max(this.health, this.maxHealth * 0.5);
        this.statusEffects = { burn: 0, slow: 0, burnTick: 0 };
      }
    } else {
      this.patrol(deltaSeconds);
    }

    if (!playerSafe && this.aggroed) {
      this.tryAttackPlayer(player);
    }
    this.resolveCombatStuck(deltaSeconds);
    this.placeOnGround();
    this.animate(deltaSeconds);
  }

  isPointInTerritory(position, radiusMultiplier = 1) {
    const radius = Math.max(4, this.territory.radius * radiusMultiplier);
    const dx = position.x - this.territory.center.x;
    const dz = position.z - this.territory.center.z;
    return dx * dx + dz * dz <= radius * radius;
  }

  forceReturnHome(options = {}) {
    if (!this.active || this.removed) {
      return;
    }
    this.aggroed = false;
    this.state = "return";
    this.tactic = "direct";
    this.tacticTimer = 0;
    this.attackCooldown = 0;
    if (options.resetHealth) {
      this.health = this.maxHealth;
    }
  }

  selectCombatState(deltaSeconds, horizontalToPlayer) {
    this.tacticTimer -= deltaSeconds;
    const healthRatio = this.health / this.maxHealth;
    const fastCreature = (this.config.chaseSpeed ?? 0) >= 3 || this.group.userData.avian;

    if (healthRatio <= (SETTINGS.enemies.retreatHealthRatio ?? 0.28) && this.tactic !== "retreat" && this.tacticTimer <= 0) {
      this.tactic = "retreat";
      this.tacticTimer = 0.75 + Math.random() * 0.45;
      return this.tactic;
    }

    if (this.tacticTimer <= 0) {
      if (fastCreature && horizontalToPlayer > 2.2) {
        this.tactic = Math.random() > 0.45 ? "flank" : "circle";
      } else if (horizontalToPlayer < 2.1 && healthRatio < 0.6) {
        this.tactic = "retreat";
      } else {
        this.tactic = Math.random() > 0.68 ? "circle" : "chase";
      }
      this.strafeSign *= Math.random() > 0.35 ? 1 : -1;
      this.tacticTimer = 0.7 + Math.random() * 0.9;
    }

    return this.tactic === "direct" ? "chase" : this.tactic;
  }

  tryAttackPlayer(player) {
    if (!this.aggroed || !this.active) {
      return;
    }

    const baseRange = (this.config.bodyRadius ?? 0.5) + (SETTINGS.enemies.meleeRange ?? 1.25);
    const verticalRange = SETTINGS.enemies.verticalHitReach ?? SETTINGS.enemies.verticalReach;
    tryDamagePlayer({
      attacker: this,
      player,
      amount: this.config.damage ?? SETTINGS.enemies.contactDamage ?? 8,
      horizontalRange: this.state === "guard" ? baseRange + 0.45 : baseRange,
      verticalRange: this.state === "guard" ? verticalRange + 0.6 : verticalRange,
      cooldown: SETTINGS.enemies.playerDamageCooldown ?? 0.85,
      feedback: this.feedback,
      hitKind: this.state === "guard" ? "area" : "contact",
    });
  }

  patrol(deltaSeconds) {
    const target = this.patrolPoints[this.patrolIndex];
    if (this.group.position.distanceTo(target) < 0.8) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
    }
    this.moveToward(this.patrolPoints[this.patrolIndex], this.getEffectiveSpeed(this.config.patrolSpeed), deltaSeconds);
  }

  moveWithTactic(target, speed, deltaSeconds, tactic) {
    scratchDirection.copy(target).sub(this.group.position);
    scratchDirection.y = 0;
    if (scratchDirection.lengthSq() < 0.001) {
      return;
    }

    const forward = scratchDirection.normalize();
    const side = new THREE.Vector3(-forward.z, 0, forward.x).multiplyScalar(this.strafeSign);
    const distance = Math.hypot(target.x - this.group.position.x, target.z - this.group.position.z);
    const sideWeight = tactic === "circle" ? 0.72 : 0.42;
    const forwardWeight = tactic === "circle" && distance < (SETTINGS.enemies.flankDistance ?? 4.2) ? 0.08 : 0.72;
    const blended = forward.multiplyScalar(forwardWeight).add(side.multiplyScalar(sideWeight)).normalize();
    this.applyMovement(blended, speed, deltaSeconds, 0.16);
  }

  retreatFrom(target, speed, deltaSeconds) {
    scratchDirection.copy(this.group.position).sub(target);
    scratchDirection.y = 0;
    if (scratchDirection.lengthSq() < 0.001) {
      scratchDirection.set(this.strafeSign, 0, 0.25);
    }

    const away = scratchDirection.normalize();
    const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(this.strafeSign * 0.45);
    const blended = away.multiplyScalar(0.9).add(side).normalize();
    this.applyMovement(blended, speed, deltaSeconds, 0.14, false);
    this.faceToward(target);
  }

  resolveCombatStuck(deltaSeconds) {
    if (!this.aggroed || this.state === "patrol" || this.state === "guard") {
      this.lastCombatPosition.copy(this.group.position);
      this.stuckTimer = 0;
      return;
    }

    const moved = this.group.position.distanceTo(this.lastCombatPosition);
    this.lastCombatPosition.copy(this.group.position);
    if (moved > 0.012) {
      this.stuckTimer = 0;
      return;
    }

    this.stuckTimer += deltaSeconds;
    if (this.stuckTimer > 0.5) {
      const yaw = this.group.rotation.y + this.strafeSign * Math.PI * 0.5;
      this.moveVelocity.x += Math.sin(yaw) * 0.45;
      this.moveVelocity.z += Math.cos(yaw) * 0.45;
      this.stuckTimer = 0.15;
    }
  }

  updateStatusEffects(deltaSeconds) {
    if (this.statusEffects.slow > 0) {
      this.statusEffects.slow = Math.max(0, this.statusEffects.slow - deltaSeconds);
    }
    if (this.statusEffects.burn > 0) {
      this.statusEffects.burn = Math.max(0, this.statusEffects.burn - deltaSeconds);
      this.statusEffects.burnTick -= deltaSeconds;
      if (this.statusEffects.burnTick <= 0) {
        this.statusEffects.burnTick = 0.75;
        this.health = Math.max(0, this.health - 4);
        this.hitReactTimer = Math.max(this.hitReactTimer, 0.12);
        if (this.health <= 0) {
          this.defeat();
        }
      }
    }
  }

  getEffectiveSpeed(speed) {
    const statusMultiplier = this.statusEffects.slow > 0 ? 0.58 : 1;
    const bogMultiplier = this.world.getBogEnemySpeedMultiplierAt?.(this.group.position, this.type) ?? 1;
    return speed * statusMultiplier * bogMultiplier;
  }

  moveToward(target, speed, deltaSeconds) {
    scratchDirection.copy(target).sub(this.group.position);
    scratchDirection.y = 0;
    if (scratchDirection.lengthSq() < 0.001) {
      return;
    }

    scratchDirection.normalize();
    this.applyMovement(scratchDirection, speed, deltaSeconds, 0.12);
  }

  applyMovement(direction, speed, deltaSeconds, yawBlend = 0.12, faceDirection = true) {
    const targetX = direction.x * speed;
    const targetZ = direction.z * speed;
    const acceleration = this.aggroed ? 8.5 : 5.4;
    const blend = 1 - Math.exp(-acceleration * deltaSeconds);
    this.moveVelocity.x = THREE.MathUtils.lerp(this.moveVelocity.x, targetX, blend);
    this.moveVelocity.z = THREE.MathUtils.lerp(this.moveVelocity.z, targetZ, blend);
    this.group.position.x += this.moveVelocity.x * deltaSeconds;
    this.group.position.z += this.moveVelocity.z * deltaSeconds;
    if (faceDirection) {
      const yaw = Math.atan2(direction.x, direction.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, yawBlend);
    }
  }

  faceToward(target) {
    scratchDirection.copy(target).sub(this.group.position);
    scratchDirection.y = 0;
    if (scratchDirection.lengthSq() < 0.001) {
      return;
    }
    scratchDirection.normalize();
    const yaw = Math.atan2(scratchDirection.x, scratchDirection.z);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, yaw, 0.12);
  }

  placeOnGround() {
    const groundY = this.world.terrain.getHeightAt(this.group.position.x, this.group.position.z);
    if (this.type === "windGull" || this.type === "forestWisp" || this.type === "mireBat") {
      this.group.position.y = groundY + 2.35 + Math.sin(performance.now() * 0.0018) * 0.22;
      return;
    }
    if (this.type === "cliffRaptor" && this.state === "chase") {
      this.group.position.y = groundY + Math.max(0, Math.sin(performance.now() * 0.004) * 0.18);
      return;
    }
    this.group.position.y = groundY;
  }

  animate(deltaSeconds) {
    const time = performance.now() * 0.001;
    const canine = this.group.userData.canine;
    const avian = this.group.userData.avian;
    const wisp = this.group.userData.wisp;
    const speed = this.state === "chase" ? (avian ? 10 : (canine ? 12 : 7)) : (avian ? 5 : (canine ? 6 : 3.6));
    const bob = Math.sin(performance.now() * 0.001 * speed) * (wisp ? 0.14 : (avian ? 0.075 : (canine ? 0.055 : 0.025)));
    const hitKick = this.hitReactTimer > 0 ? this.hitReactTimer / 0.48 : 0;
    if (hitKick > 0) {
      this.group.position.addScaledVector(this.hitDirection, -deltaSeconds * (avian ? 2.2 : (canine ? 1.95 : 1.05)));
    }
    this.group.position.y += bob + hitKick * 0.16;
    const chaseStretch = this.state === "chase" ? 0.035 : 0;
    this.group.scale.set(1 + hitKick * 0.14 + chaseStretch, 1 - hitKick * 0.06, 1 + hitKick * 0.1 - chaseStretch * 0.5);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.state === "chase" ? (canine ? -0.08 : -0.03) : 0, 0.12);

    if (this.group.userData.tail) {
      this.group.userData.tail.rotation.z = Math.PI / 2.8 + Math.sin(time * speed) * (this.state === "chase" ? 0.22 : 0.1);
    }
    if (this.group.userData.shell) {
      this.group.userData.shell.rotation.z = Math.sin(time * 3.2) * 0.025 + hitKick * 0.08;
    }
    this.group.userData.legs?.forEach(({ mesh, side, index }) => {
      mesh.rotation.z = (index === 0 ? -0.08 : 0.12) + Math.sin(time * speed + index * Math.PI + side) * 0.14;
    });
    this.group.userData.wings?.forEach(({ mesh, side }) => {
      mesh.rotation.z = side * (1.12 + Math.sin(time * speed) * (this.state === "chase" ? 0.32 : 0.18));
      mesh.rotation.y = Math.sin(time * speed + side) * 0.12;
    });
    if (this.group.userData.halo) {
      this.group.userData.halo.rotation.z += deltaSeconds * (this.state === "chase" ? 2.8 : 1.3);
      this.group.userData.halo.scale.setScalar(1 + Math.sin(time * 3.4) * 0.08 + hitKick * 0.2);
    }
  }

  takeDamage(amount, hitDirection = null, impactPower = 0.5) {
    if (!this.active) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.aggroed = true;
    this.tacticTimer = Math.min(this.tacticTimer, 0.22);
    this.hitReactTimer = 0.28 + impactPower * 0.32;
    if (hitDirection) {
      this.hitDirection.copy(hitDirection);
    }
    if (this.health <= 0) {
      this.defeat();
      return true;
    }

    return false;
  }

  applyArrowEffect(arrowType, impactPower = 0.5) {
    if (!arrowType || !this.active) {
      return;
    }
    if (arrowType.id === "fire") {
      this.statusEffects.burn = Math.max(this.statusEffects.burn, arrowType.burnDuration ?? 3.5);
      this.statusEffects.burnTick = Math.min(this.statusEffects.burnTick, 0.2);
    }
    if (arrowType.id === "ice") {
      this.statusEffects.slow = Math.max(this.statusEffects.slow, arrowType.slowDuration ?? 3);
      this.hitReactTimer = Math.max(this.hitReactTimer, 0.18 + impactPower * 0.16);
    }
  }

  defeat() {
    this.active = false;
    this.defeatTimer = 1.8;
    this.group.userData.defeated = true;
    this.unregisterColliders();
  }

  updateDefeated(deltaSeconds) {
    this.defeatTimer -= deltaSeconds;
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, this.type === "wolf" ? -Math.PI / 2.2 : -Math.PI / 2, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.type === "wolf" ? 0.28 : 0.12, 0.06);
    this.group.position.y = Math.max(this.world.terrain.getHeightAt(this.group.position.x, this.group.position.z) + 0.05, this.group.position.y - deltaSeconds * 0.3);
    this.group.scale.multiplyScalar(0.99);
    if (this.defeatTimer <= 0 && !this.removed) {
      this.scene.remove(this.group);
      this.removed = true;
    }
  }

  unregisterColliders() {
    this.world.colliders = this.world.colliders.filter((collider) => !this.colliders.includes(collider));
  }

  getHealthRatio() {
    return this.health / this.maxHealth;
  }

  getHealthBarPosition() {
    return this.group.position.clone().add(new THREE.Vector3(0, this.type === "wolf" ? 1.35 : 1.08, 0));
  }
}
