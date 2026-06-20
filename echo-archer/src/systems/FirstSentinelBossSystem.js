import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class FirstSentinelBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.firstSentinel;
    this.defeatListeners = [];
    this.mechanisms = new Set();
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:ancient-mechanism", (event) => {
      if (event.detail?.id) this.mechanisms.add(event.detail.id);
    });
    window.addEventListener("echo-archer:first-sentinel-ready", () => this.activateQuest());
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
      chargeCooldown: 2.4,
      pulseCooldown: 3.6,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      phase: 1,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(55, 0, -150),
      patrolPoints: [
        new THREE.Vector3(55, 0, -150),
        new THREE.Vector3(63, 0, -155),
        new THREE.Vector3(67, 0, -146),
        new THREE.Vector3(58, 0, -139),
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
        child.userData.firstSentinelBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x686858, roughness: 0.9, metalness: 0.03 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x30342e, roughness: 0.92 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9ad57, roughness: 0.42, metalness: 0.18, emissive: 0x3b2100, emissiveIntensity: 0.18 });
    const weakMat = new THREE.MeshStandardMaterial({ color: 0x8bc8ff, roughness: 0.28, emissive: 0x1d5f9d, emissiveIntensity: 0.7 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.85, 0.82), stoneMat);
    torso.position.y = 1.85;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), weakMat);
    core.name = "first-sentinel-weakspot";
    core.position.set(0, 1.95, -0.46);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.72), darkMat);
    head.position.y = 3.02;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 28), goldMat);
    crown.position.y = 3.38;
    crown.rotation.x = Math.PI / 2;
    group.add(torso, core, head, crown);

    [-1, 1].forEach((side) => {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.7), goldMat);
      shoulder.position.set(side * 1.05, 2.35, 0);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.25, 6, 9), stoneMat);
      arm.position.set(side * 1.32, 1.52, 0);
      arm.rotation.z = side * 0.18;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.35, 6, 10), darkMat);
      leg.position.set(side * 0.38, 0.72, 0);
      const handWeak = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), weakMat);
      handWeak.name = "first-sentinel-weakspot";
      handWeak.position.set(side * 1.36, 0.98, -0.1);
      group.add(shoulder, arm, leg, handWeak);
    });

    const backHalo = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 8, 44), goldMat);
    backHalo.position.set(0, 2.25, 0.48);
    backHalo.rotation.x = Math.PI / 2;
    group.add(backHalo);
    group.scale.setScalar(1.72);
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
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0x8bc8ff, 3.6);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "THE FIRST SENTINEL AWAKENS", kind: "damage strong", x: window.innerWidth / 2, y: window.innerHeight * 0.24 },
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
    boss.pulseCooldown = Math.max(0, boss.pulseCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    boss.phase = boss.health <= boss.maxHealth * 0.48 ? 2 : 1;

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "pulse") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "recover";
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, player.group.position);
      } else if (distance <= this.config.pulseDistance && boss.pulseCooldown <= 0) {
        this.startPulse(boss);
      } else {
        this.moveToward(boss, player.group.position, boss.phase === 2 ? this.config.phaseTwoSpeed : this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.72, deltaSeconds);
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
    this.feedback?.playSound("bossNotice", 1.1);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startCharge(boss, target) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown * (boss.phase === 2 ? 0.78 : 1);
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xd9ad57, 2.2);
    this.feedback?.playSound("bossCharge", 1.05);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.28);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.28);
    }
  }

  startPulse(boss) {
    boss.state = "pulse";
    boss.stateTimer = 0.9;
    boss.pulseCooldown = this.config.pulseCooldown * (boss.phase === 2 ? 0.76 : 1);
    boss.hitReactTimer = 0.45;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0x8bc8ff, 3.0);
    this.feedback?.playSound("bossCharge", 0.82);
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state === "pulse" ? "slam" : boss.state, this.config);
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
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 9 : boss.phase === 2 ? 4.8 : 3)) * 0.035 + hit * 0.12;
    boss.group.scale.setScalar(1.72 + hit * 0.07 + (boss.phase === 2 ? 0.08 : 0));
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.firstSentinelBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const shotPower = arrow.shotPower ?? 0.5;
    const phaseBonus = boss.phase === 2 ? 1.12 : 1;
    const damage = SETTINGS.enemies.arrowDamage * phaseBonus * (weakSpot ? 2.05 : 0.86) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.34 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, weakSpot ? 0x8bc8ff : 0xd9ad57, weakSpot ? 2.7 : 1.35);
    this.feedback?.shake(boss.health <= 0 ? 0.48 : weakSpot ? 0.14 : 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "SENTINEL QUIETED" : weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.5 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.4;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x8bc8ff, 2.4);
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.6;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0x8bc8ff, 4.8);
    this.feedback?.playSound("bossDefeat", 1.22);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Kingmaker", rarity: "legendary", category: "bows", itemId: "kingmaker", text: "Kingmaker accepts the archer who restored the erased kingdom's mechanisms." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "firstSentinel" }));
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
