import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;
const scratch = new THREE.Vector3();

export class SkyboundWardenBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.skyboundWarden;
    this.defeatListeners = [];
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:skybound-warden-ready", () => this.activateQuest());
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
      diveCooldown: 2.8,
      beamCooldown: 4.2,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      diveDirection: new THREE.Vector3(),
      home: new THREE.Vector3(102, 0, 174),
      patrolPoints: [
        new THREE.Vector3(102, 0, 174),
        new THREE.Vector3(94, 0, 168),
        new THREE.Vector3(86, 0, 176),
        new THREE.Vector3(98, 0, 181),
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
        child.userData.skyboundWardenBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5f66a8, roughness: 0.54, metalness: 0.06, emissive: 0x141a60, emissiveIntensity: 0.2 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x9fdcff, roughness: 0.42, transparent: true, opacity: 0.86, emissive: 0x2f8fd8, emissiveIntensity: 0.34 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd98c, roughness: 0.38, metalness: 0.14, emissive: 0xff9f3d, emissiveIntensity: 0.22 });
    const weakMat = new THREE.MeshStandardMaterial({ color: 0x8c6dff, roughness: 0.26, emissive: 0x6f45ff, emissiveIntensity: 0.82 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 1.65, 8, 14), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.85;
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), bodyMat);
    head.position.set(1.15, 1.92, 0);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), weakMat);
    core.name = "skybound-warden-weakspot";
    core.position.set(0.68, 2.02, -0.42);
    group.add(body, head, core);

    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.4, 4), wingMat);
      wing.position.set(-0.35, 1.94, side * 0.86);
      wing.rotation.set(Math.PI / 2, 0.25, side * 0.82);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 28), goldMat);
      halo.position.set(-0.28, 2.55, side * 0.55);
      halo.rotation.x = Math.PI / 2;
      const wingWeak = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), weakMat);
      wingWeak.name = "skybound-warden-weakspot";
      wingWeak.position.set(-0.2, 2.05, side * 1.0);
      group.add(wing, halo, wingWeak);
    });

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.3, 5), goldMat);
    tail.position.set(-1.2, 1.78, 0);
    tail.rotation.z = Math.PI / 2;
    group.add(tail);
    group.scale.setScalar(1.85);
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
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 0x8c6dff, 4.0);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "SKYBOUND WARDEN DESCENDS", kind: "damage strong", x: window.innerWidth / 2, y: window.innerHeight * 0.22 },
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
    boss.diveCooldown = Math.max(0, boss.diveCooldown - deltaSeconds);
    boss.beamCooldown = Math.max(0, boss.beamCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    boss.phase = boss.health <= boss.maxHealth * 0.38 ? 3 : boss.health <= boss.maxHealth * 0.68 ? 2 : 1;

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.state === "dive") {
      this.updateDive(deltaSeconds, boss);
    } else if (boss.state === "beam") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "recover";
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.diveDistance && boss.diveCooldown <= 0) {
        this.startDive(boss, player.group.position);
      } else if (distance <= this.config.beamDistance && boss.beamCooldown <= 0) {
        this.startBeam(boss);
      } else {
        this.moveToward(boss, player.group.position, boss.phase >= 2 ? this.config.phaseTwoSpeed : this.config.chaseSpeed, deltaSeconds);
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
    this.feedback?.playSound("bossNotice", 1.14);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startDive(boss, target) {
    boss.state = "dive";
    boss.stateTimer = this.config.diveDuration;
    boss.diveCooldown = this.config.diveCooldown * (boss.phase >= 2 ? 0.76 : 1);
    boss.diveDirection.copy(target).sub(boss.group.position);
    boss.diveDirection.y = 0;
    boss.diveDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0x8c6dff, 2.5);
    this.feedback?.playSound("bossCharge", 1.08);
  }

  updateDive(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.diveDirection, this.config.diveSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.diveDirection.x, boss.diveDirection.z), 0.3);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.32);
    }
  }

  startBeam(boss) {
    boss.state = "beam";
    boss.stateTimer = 1.0;
    boss.beamCooldown = this.config.beamCooldown * (boss.phase === 3 ? 0.7 : 1);
    boss.hitReactTimer = 0.45;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0x9fdcff, 3.2);
    this.feedback?.playSound("bossCharge", 0.86);
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state === "beam" ? "slam" : boss.state === "dive" ? "charge" : boss.state, this.config);
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
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z) + 0.95;
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "dive" ? 8 : 3.6)) * 0.16 + hit * 0.12;
    boss.group.scale.setScalar(1.85 + hit * 0.07 + (boss.phase - 1) * 0.05);
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.skyboundWardenBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const shotPower = arrow.shotPower ?? 0.5;
    const phaseBonus = boss.phase === 3 ? 1.18 : boss.phase === 2 ? 1.08 : 1;
    const damage = SETTINGS.enemies.arrowDamage * phaseBonus * (weakSpot ? 2.15 : 0.82) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.34 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, weakSpot ? 0x8c6dff : 0x9fdcff, weakSpot ? 2.9 : 1.35);
    this.feedback?.shake(boss.health <= 0 ? 0.52 : weakSpot ? 0.16 : 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "WARDEN FALLS" : weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2.4) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.5 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x8c6dff, 2.6);
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.8;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0x8c6dff, 5.2);
    this.feedback?.playSound("bossDefeat", 1.26);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Voidstar", rarity: "legendary", category: "bows", itemId: "voidstar", text: "Voidstar answers the archer who restored the First Sky relays." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "skyboundWarden" }));
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
