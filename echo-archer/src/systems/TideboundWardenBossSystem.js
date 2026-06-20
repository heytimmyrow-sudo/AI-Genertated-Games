import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;
const scratch = new THREE.Vector3();

export class TideboundWardenBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.tideboundWarden;
    this.defeatListeners = [];
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:tidebound-warden-ready", () => this.activateQuest());
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
      surgeCooldown: 3.2,
      waveCooldown: 4.6,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      surgeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(-168, 0, -162),
      patrolPoints: [
        new THREE.Vector3(-168, 0, -162),
        new THREE.Vector3(-160, 0, -168),
        new THREE.Vector3(-173, 0, -171),
        new THREE.Vector3(-176, 0, -158),
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
        child.userData.tideboundWardenBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x4f6366, roughness: 0.82, metalness: 0.04, emissive: 0x0c2730, emissiveIntensity: 0.14 });
    const tideMat = new THREE.MeshStandardMaterial({ color: 0x6fa8a2, roughness: 0.38, emissive: 0x1a6f82, emissiveIntensity: 0.26 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9ad57, roughness: 0.44, metalness: 0.14, emissive: 0x3b2100, emissiveIntensity: 0.14 });
    const weakMat = new THREE.MeshStandardMaterial({ color: 0x9fdcff, roughness: 0.24, emissive: 0x2f8fd8, emissiveIntensity: 0.82 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 1.95, 8, 14), shellMat);
    body.position.y = 1.35;
    body.rotation.z = Math.PI / 2;
    body.scale.set(1.28, 0.92, 1.04);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.64, 1), shellMat);
    head.position.set(1.42, 1.48, 0);
    const chestCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), weakMat);
    chestCore.name = "tidebound-warden-weakspot";
    chestCore.position.set(0.64, 1.72, -0.58);
    group.add(body, head, chestCore);

    [-1, 1].forEach((side) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.82, 6), goldMat);
      claw.position.set(0.72, 0.82, side * 0.92);
      claw.rotation.set(Math.PI / 2, 0, side * 0.34);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), tideMat);
      shoulder.position.set(0.22, 1.4, side * 0.78);
      const weak = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), weakMat);
      weak.name = "tidebound-warden-weakspot";
      weak.position.set(0.18, 1.62, side * 1.06);
      group.add(claw, shoulder, weak);
    });

    for (let index = 0; index < 5; index += 1) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.48 - index * 0.035, 5), goldMat);
      spine.position.set(-0.55 + index * 0.28, 2.1 + Math.sin(index) * 0.06, 0);
      spine.rotation.z = -0.15 + index * 0.06;
      group.add(spine);
    }

    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 30), goldMat);
    crown.position.set(1.72, 1.86, 0);
    crown.rotation.x = Math.PI / 2;
    group.add(crown);
    group.scale.setScalar(1.8);
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
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0x9fdcff, 4.2);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "TIDEBOUND WARDEN RISES", kind: "damage strong", x: window.innerWidth / 2, y: window.innerHeight * 0.22 },
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
    boss.surgeCooldown = Math.max(0, boss.surgeCooldown - deltaSeconds);
    boss.waveCooldown = Math.max(0, boss.waveCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    boss.phase = boss.health <= boss.maxHealth * 0.42 ? 2 : 1;

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.state === "surge") {
      this.updateSurge(deltaSeconds, boss);
    } else if (boss.state === "wave") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "recover";
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.surgeDistance && boss.surgeCooldown <= 0) {
        this.startSurge(boss, player.group.position);
      } else if (distance <= this.config.waveDistance && boss.waveCooldown <= 0) {
        this.startWave(boss);
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
    this.feedback?.playSound("bossNotice", 1.18);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startSurge(boss, target) {
    boss.state = "surge";
    boss.stateTimer = this.config.surgeDuration;
    boss.surgeCooldown = this.config.surgeCooldown * (boss.phase === 2 ? 0.72 : 1);
    boss.surgeDirection.copy(target).sub(boss.group.position);
    boss.surgeDirection.y = 0;
    boss.surgeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x6fa8a2, 2.8);
    this.feedback?.playSound("bossCharge", 1.1);
  }

  updateSurge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.surgeDirection, this.config.surgeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.surgeDirection.x, boss.surgeDirection.z), 0.28);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.34);
    }
  }

  startWave(boss) {
    boss.state = "wave";
    boss.stateTimer = 1.05;
    boss.waveCooldown = this.config.waveCooldown * (boss.phase === 2 ? 0.74 : 1);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9fdcff, 3.3);
    this.feedback?.playSound("bossCharge", 0.9);
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state === "wave" ? "slam" : boss.state === "surge" ? "charge" : boss.state, this.config);
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
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z) + 0.35;
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "surge" ? 7.5 : 2.8)) * 0.05 + hit * 0.12;
    boss.group.scale.setScalar(1.8 + hit * 0.08 + (boss.phase === 2 ? 0.08 : 0));
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.tideboundWardenBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const shotPower = arrow.shotPower ?? 0.5;
    const damage = SETTINGS.enemies.arrowDamage * (weakSpot ? 2.2 : 0.78) * (boss.phase === 2 ? 1.12 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.34 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, weakSpot ? 0x9fdcff : 0x6fa8a2, weakSpot ? 2.85 : 1.35);
    this.feedback?.shake(boss.health <= 0 ? 0.54 : weakSpot ? 0.16 : 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "WARDEN SINKS" : weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2.4) return;
    if (!boss.noticed) this.noticeBoss(boss);
    boss.health = Math.max(0, boss.health - SETTINGS.enemies.arrowDamage * 0.52 * (arrow.damageMultiplier ?? 1));
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0x9fdcff, 2.6);
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.8;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0x9fdcff, 5.4);
    this.feedback?.playSound("bossDefeat", 1.3);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Stormcaller", rarity: "legendary", category: "bows", itemId: "stormcaller", text: "Stormcaller answers the archer who restored the beacons and broke the Tidebound Warden." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "tideboundWarden" }));
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
