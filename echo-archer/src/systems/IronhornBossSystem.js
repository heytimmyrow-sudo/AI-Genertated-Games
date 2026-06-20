import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class IronhornBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.ironhorn;
    this.defeatListeners = [];
    this.tracks = new Set();
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:frontier-track", (event) => {
      this.tracks.add(event.detail?.id);
      if (this.tracks.size >= 3) {
        this.activateQuest();
      }
    });
  }

  createBoss() {
    const boss = {
      name: this.config.name,
      health: this.config.health,
      maxHealth: this.config.health,
      active: false,
      defeated: false,
      noticed: false,
      state: "dormant",
      patrolIndex: 0,
      chargeCooldown: 2.0,
      stompCooldown: 3.5,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(171, 0, -162),
      patrolPoints: [
        new THREE.Vector3(171, 0, -162),
        new THREE.Vector3(161, 0, -169),
        new THREE.Vector3(148, 0, -161),
        new THREE.Vector3(158, 0, -150),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    boss.group.visible = false;
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.ironhornBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const hideMat = new THREE.MeshStandardMaterial({ color: 0x6d5e3c, roughness: 0.88 });
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x9b967a, roughness: 0.62, metalness: 0.08 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xe0c078, roughness: 0.42, metalness: 0.12, emissive: 0x3a1d00, emissiveIntensity: 0.16 });
    const weakMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.36, emissive: 0xff8a3d, emissiveIntensity: 0.42 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 1.8, 8, 14), hideMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.15;
    body.scale.set(1.42, 1.0, 0.86);
    const shell = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.34, 1.08), armorMat);
    shell.position.set(-0.15, 1.62, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), hideMat);
    head.position.set(1.12, 1.28, 0);
    head.scale.set(1.16, 0.82, 0.9);
    group.add(body, shell, head);

    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.35, 6), hornMat);
      horn.position.set(1.52, 1.42, side * 0.28);
      horn.rotation.set(Math.PI / 2, 0, side * 0.18);
      group.add(horn);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.85, 6, 10), hideMat);
      leg.position.set(-0.45, 0.48, side * 0.42);
      group.add(leg);
      const frontLeg = leg.clone();
      frontLeg.position.x = 0.56;
      group.add(frontLeg);
      const weak = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), weakMat);
      weak.name = "ironhorn-weakspot";
      weak.position.set(0.86, 1.55, side * 0.52);
      group.add(weak);
    });

    const chestWeak = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), weakMat);
    chestWeak.name = "ironhorn-weakspot";
    chestWeak.position.set(1.02, 1.0, 0);
    group.add(chestWeak);
    group.scale.setScalar(1.95);
    return group;
  }

  onDefeated(callback) {
    this.defeatListeners.push(callback);
  }

  activateQuest() {
    const boss = this.boss;
    if (this.questActive || boss.defeated) return;
    this.questActive = true;
    boss.active = true;
    boss.state = "patrol";
    boss.group.visible = true;
    boss.colliders.forEach((collider) => {
      if (!this.world.colliders.includes(collider)) this.world.colliders.push(collider);
    });
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xffd166, 3.2);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "IRONHORN ROAMS THE PLAINS", kind: "damage strong", x: window.innerWidth / 2, y: window.innerHeight * 0.24 },
    }));
  }

  update(deltaSeconds, player) {
    const boss = this.boss;
    if (!this.questActive && !boss.defeated) return;
    if (boss.defeated) {
      this.updateDefeated(deltaSeconds, boss);
      this.updateBossBar();
      return;
    }

    boss.hitReactTimer = Math.max(0, boss.hitReactTimer - deltaSeconds);
    boss.chargeCooldown = Math.max(0, boss.chargeCooldown - deltaSeconds);
    boss.stompCooldown = Math.max(0, boss.stompCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "stomp") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "recover";
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, player.group.position);
      } else if (distance <= this.config.stompDistance && boss.stompCooldown <= 0) {
        this.startStomp(boss);
      } else {
        this.moveToward(boss, player.group.position, this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.75, deltaSeconds);
    } else {
      this.patrol(deltaSeconds, boss);
    }

    this.tryDamagePlayer(boss, player);
    this.placeOnGround(boss);
    this.animate(boss);
    this.updateBossBar();
  }

  noticeBoss(boss) {
    boss.noticed = true;
    this.ui.bar.classList.add("visible");
    this.feedback?.playSound("bossNotice", 1.05);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startCharge(boss, target) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffd166, 1.8);
    this.feedback?.playSound("bossCharge", 1.05);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.28);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.24);
    }
  }

  startStomp(boss) {
    boss.state = "stomp";
    boss.stateTimer = 0.9;
    boss.stompCooldown = this.config.stompCooldown;
    boss.hitReactTimer = 0.55;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xb89563, 2.6);
    this.feedback?.playSound("bossCharge", 0.78);
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state === "stomp" ? "slam" : boss.state, this.config);
    damagePlayerIfInRange({ attacker: boss, player, feedback: this.feedback, ...profile });
  }

  patrol(deltaSeconds, boss) {
    if (boss.group.position.distanceTo(boss.patrolPoints[boss.patrolIndex]) < 0.9) {
      boss.patrolIndex = (boss.patrolIndex + 1) % boss.patrolPoints.length;
    }
    this.moveToward(boss, boss.patrolPoints[boss.patrolIndex], this.config.patrolSpeed, deltaSeconds);
  }

  moveToward(boss, target, speed, deltaSeconds) {
    scratch.copy(target).sub(boss.group.position);
    scratch.y = 0;
    if (scratch.lengthSq() < 0.001) return;
    scratch.normalize();
    boss.group.position.addScaledVector(scratch, speed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(scratch.x, scratch.z), 0.12);
  }

  placeOnGround(boss) {
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z);
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 9 : 3)) * 0.035 + hit * 0.11;
    boss.group.scale.setScalar(1.95 + hit * 0.06);
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.ironhornBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const shotPower = arrow.shotPower ?? 0.5;
    const damage = SETTINGS.enemies.arrowDamage * 1.12 * (weakSpot ? 1.8 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.32 + shotPower * 0.22;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, weakSpot ? 0xffd166 : 0xb89563, weakSpot ? 2.4 : 1.35);
    this.feedback?.shake(boss.health <= 0 ? 0.42 : 0.08 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "IRONHORN FALLS" : weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.48 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.4;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffcf5f, 2.4);
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.2;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xffd166, 4.2);
    this.feedback?.playSound("bossDefeat", 1.18);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Windrunner", rarity: "legendary", category: "bows", itemId: "windrunner", text: "Windrunner answers the first expedition beyond the frontier." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "ironhorn" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.04);
    boss.group.scale.multiplyScalar(0.997);
    if (boss.stateTimer <= 0) this.ui.bar.classList.remove("visible");
  }

  showBossCombatText(boss, text, kind) {
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text, kind, x: window.innerWidth / 2, y: window.innerHeight * 0.24 },
    }));
  }

  updateBossBar() {
    const boss = this.boss;
    if (!boss.noticed && !boss.defeated) return;
    this.ui.name.textContent = boss.name;
    this.ui.fill.style.setProperty("--boss-health", (boss.health / boss.maxHealth).toFixed(3));
    this.ui.bar.classList.toggle("visible", boss.noticed && !boss.defeated);
  }
}
