import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;
const scratch = new THREE.Vector3();

export class AncientGrovekeeperBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.ancientGrovekeeper;
    this.defeatListeners = [];
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:ancient-grovekeeper-ready", () => this.activateQuest());
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
      phase: 1,
      rootChargeCooldown: 3.4,
      vinePulseCooldown: 4.4,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(-52, 0, -160),
      patrolPoints: [
        new THREE.Vector3(-52, 0, -160),
        new THREE.Vector3(-61, 0, -154),
        new THREE.Vector3(-47, 0, -149),
        new THREE.Vector3(-58, 0, -167),
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
        child.userData.ancientGrovekeeperBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4b3424, roughness: 0.92, emissive: 0x10200d, emissiveIntensity: 0.08 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x466b55, roughness: 0.9, emissive: 0x102814, emissiveIntensity: 0.08 });
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x6b4729, roughness: 0.9 });
    const weakMat = new THREE.MeshStandardMaterial({ color: 0x9af6b9, roughness: 0.25, emissive: 0x2aa35f, emissiveIntensity: 0.86 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.35, 8, 14), barkMat);
    torso.position.y = 1.75;
    torso.scale.set(1.15, 1.24, 0.94);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 1), barkMat);
    head.position.set(0, 3.28, 0.08);
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), weakMat);
    heart.name = "ancient-grovekeeper-weakspot";
    heart.position.set(0, 2.15, -0.72);
    group.add(torso, head, heart);

    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.6, 5, 8), branchMat);
      arm.position.set(side * 1.0, 2.28, -0.08);
      arm.rotation.set(0.28, 0, side * 0.88);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 6), branchMat);
      claw.position.set(side * 1.68, 1.55, -0.12);
      claw.rotation.z = side * 0.48;
      const shoulderWeak = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), weakMat);
      shoulderWeak.name = "ancient-grovekeeper-weakspot";
      shoulderWeak.position.set(side * 0.82, 2.62, -0.52);
      group.add(arm, claw, shoulderWeak);
    });

    for (let index = 0; index < 7; index += 1) {
      const branch = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 1.1 + index * 0.07, 4, 7), branchMat);
      branch.position.set(Math.sin(index) * 0.55, 3.55 + index * 0.08, Math.cos(index * 0.7) * 0.38);
      branch.rotation.set(0.35 + index * 0.04, index * 0.7, (index - 3) * 0.12);
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), mossMat);
      leaf.position.set(branch.position.x * 1.4, branch.position.y + 0.48, branch.position.z * 1.5);
      group.add(branch, leaf);
    }

    for (let index = 0; index < 5; index += 1) {
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 1.6, 5, 7), branchMat);
      const angle = index * 1.25;
      root.position.set(Math.sin(angle) * 0.7, 0.24, Math.cos(angle) * 0.7);
      root.rotation.set(Math.PI / 2, 0, angle);
      group.add(root);
    }

    group.scale.setScalar(1.75);
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
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 0x9af6b9, 4.4);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "ANCIENT GROVEKEEPER WAKES", kind: "damage strong", x: window.innerWidth / 2, y: window.innerHeight * 0.22 },
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
    boss.rootChargeCooldown = Math.max(0, boss.rootChargeCooldown - deltaSeconds);
    boss.vinePulseCooldown = Math.max(0, boss.vinePulseCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    boss.phase = boss.health <= boss.maxHealth * 0.45 ? 2 : 1;

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.state === "rootCharge") {
      this.updateRootCharge(deltaSeconds, boss);
    } else if (boss.state === "vinePulse") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "recover";
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.rootChargeDistance && boss.rootChargeCooldown <= 0) {
        this.startRootCharge(boss, player.group.position);
      } else if (distance <= this.config.vinePulseDistance && boss.vinePulseCooldown <= 0) {
        this.startVinePulse(boss);
      } else {
        this.moveToward(boss, player.group.position, boss.phase === 2 ? this.config.phaseTwoSpeed : this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.68, deltaSeconds);
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
    this.feedback?.playSound("bossNotice", 1.12);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startRootCharge(boss, target) {
    boss.state = "rootCharge";
    boss.stateTimer = this.config.rootChargeDuration;
    boss.rootChargeCooldown = this.config.rootChargeCooldown * (boss.phase === 2 ? 0.72 : 1);
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9af6b9, 2.9);
    this.feedback?.playSound("bossCharge", 1.05);
  }

  updateRootCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.rootChargeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.26);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.32);
    }
  }

  startVinePulse(boss) {
    boss.state = "vinePulse";
    boss.stateTimer = 1.08;
    boss.vinePulseCooldown = this.config.vinePulseCooldown * (boss.phase === 2 ? 0.74 : 1);
    boss.hitReactTimer = 0.44;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0x8ff0b1, 3.4);
    this.feedback?.playSound("bossCharge", 0.92);
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state === "vinePulse" ? "slam" : boss.state === "rootCharge" ? "charge" : boss.state, this.config);
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
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(scratch.x, scratch.z), 0.13);
  }

  placeOnGround(boss) {
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z) + 0.28;
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "rootCharge" ? 6.8 : 2.4)) * 0.045 + hit * 0.12;
    boss.group.scale.setScalar(1.75 + hit * 0.08 + (boss.phase === 2 ? 0.08 : 0));
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.ancientGrovekeeperBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const shotPower = arrow.shotPower ?? 0.5;
    const damage = SETTINGS.enemies.arrowDamage * (weakSpot ? 2.25 : 0.76) * (boss.phase === 2 ? 1.12 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.34 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, weakSpot ? 0x9af6b9 : 0x6f9b59, weakSpot ? 2.9 : 1.35);
    this.feedback?.shake(boss.health <= 0 ? 0.56 : weakSpot ? 0.16 : 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "GROVEKEEPER FALLS" : weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2.5) return;
    if (!boss.noticed) this.noticeBoss(boss);
    boss.health = Math.max(0, boss.health - SETTINGS.enemies.arrowDamage * 0.5 * (arrow.damageMultiplier ?? 1));
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0x9af6b9, 2.6);
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.8;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x9af6b9, 5.6);
    this.feedback?.playSound("bossDefeat", 1.3);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Whisperbranch", rarity: "legendary", category: "bows", itemId: "whisperbranch", text: "Whisperbranch bends toward the archer patient enough to uncover the Hidden Road." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "ancientGrovekeeper" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.045);
    boss.group.scale.multiplyScalar(0.996);
    if (boss.stateTimer <= 0) this.ui.bar.classList.remove("visible");
  }

  showBossCombatText(boss, text, kind) {
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text, kind, x: window.innerWidth / 2, y: window.innerHeight * 0.22 },
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
