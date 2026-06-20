import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class AstralGuardianBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.astralGuardian;
    this.defeatListeners = [];
    this.questActive = false;
    this.boss = this.createBoss();
    this.bindEvents();
    this.updateBossBar();
  }

  bindEvents() {
    window.addEventListener("echo-archer:celestial-energy", (event) => {
      if ((event.detail?.activeCount ?? 0) >= (event.detail?.total ?? 99)) {
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
      phase: 1,
      state: "dormant",
      patrolIndex: 0,
      chargeCooldown: 2.4,
      starVolleyCooldown: 3.2,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(166, 0, 72),
      patrolPoints: [
        new THREE.Vector3(166, 0, 72),
        new THREE.Vector3(172, 0, 66),
        new THREE.Vector3(160, 0, 62),
        new THREE.Vector3(154, 0, 73),
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
        child.userData.astralGuardianBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d547f, roughness: 0.72, emissive: 0x151944, emissiveIntensity: 0.18 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1d3f, roughness: 0.82 });
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0xcdb7ff, roughness: 0.34, emissive: 0x7f6fff, emissiveIntensity: 0.72 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.42, metalness: 0.12, emissive: 0x4a2600, emissiveIntensity: 0.2 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.0, 18, 12), bodyMat);
    body.position.y = 1.35;
    body.scale.set(1.22, 1.42, 0.9);
    const chestWeak = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), crystalMat);
    chestWeak.name = "astralguardian-weakspot";
    chestWeak.position.set(0.68, 1.55, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 10), darkMat);
    head.position.set(0.52, 2.42, 0);
    head.scale.set(1.04, 0.78, 0.84);
    group.add(body, chestWeak, head);

    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.15, 5), crystalMat);
      horn.position.set(0.38, 3.02, side * 0.28);
      horn.rotation.set(0.46, 0, side * 0.52);
      group.add(horn);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 1.22, 6, 10), bodyMat);
      arm.position.set(0.28, 1.38, side * 0.78);
      arm.rotation.set(0.12, 0, side * 0.52);
      group.add(arm);
      const shoulderWeak = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), crystalMat);
      shoulderWeak.name = "astralguardian-weakspot";
      shoulderWeak.position.set(0.18, 1.98, side * 0.72);
      group.add(shoulderWeak);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.94, 6, 10), darkMat);
      leg.position.set(-0.24, 0.48, side * 0.34);
      group.add(leg);
    });

    for (let index = 0; index < 5; index += 1) {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.82 + index * 0.16, 0.014, 7, 32), index % 2 ? crystalMat : goldMat);
      halo.position.y = 2.0 + index * 0.1;
      halo.rotation.set(Math.PI / 2 + index * 0.12, index * 0.44, 0);
      group.add(halo);
      group.userData.halos = [...(group.userData.halos ?? []), halo];
    }

    group.userData.glow = crystalMat;
    group.scale.setScalar(1.92);
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
      if (!this.world.colliders.includes(collider)) {
        this.world.colliders.push(collider);
      }
    });
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xcdb7ff, 3.4);
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text: "THE ASTRAL SANCTUM AWAKENS", kind: "xp", x: window.innerWidth / 2, y: window.innerHeight * 0.24 },
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
    boss.starVolleyCooldown = Math.max(0, boss.starVolleyCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) this.noticeBoss(boss);

    if (boss.health / boss.maxHealth < 0.52 && boss.phase === 1) {
      boss.phase = 2;
      boss.hitReactTimer = 0.85;
      this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xfff0c2, 3.2);
      this.showBossCombatText(boss, "PHASE SHIFT", "damage strong");
    }

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "starVolley") {
      this.updateStarVolley(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, player.group.position);
      } else if (distance <= this.config.starVolleyDistance && boss.starVolleyCooldown <= 0) {
        this.startStarVolley(boss);
      } else {
        this.moveToward(boss, player.group.position, boss.phase === 2 ? this.config.phaseTwoSpeed : this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.8, deltaSeconds);
    } else {
      this.patrol(deltaSeconds, boss);
    }

    this.tryDamagePlayer(boss, player);
    this.placeOnGround(boss);
    this.animate(boss, deltaSeconds);
    this.updateBossBar();
  }

  noticeBoss(boss) {
    boss.noticed = true;
    this.ui.bar.classList.add("visible");
    this.feedback?.playSound("bossNotice", 1.16);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startCharge(boss, target) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown * (boss.phase === 2 ? 0.78 : 1);
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xcdb7ff, 1.9);
    this.feedback?.playSound("bossCharge", 1.0);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * (boss.phase === 2 ? 1.12 : 1) * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.26);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.22);
    }
  }

  startStarVolley(boss) {
    boss.state = "starVolley";
    boss.stateTimer = this.config.volleyDuration;
    boss.starVolleyCooldown = this.config.starVolleyCooldown * (boss.phase === 2 ? 0.76 : 1);
    boss.hitReactTimer = 0.48;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xfff0c2, 2.8);
    this.feedback?.playSound("bossCharge", 0.76);
  }

  updateStarVolley(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
    }
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") return;
    const profile = getBossAttackProfile(boss.state, this.config);
    damagePlayerIfInRange({
      attacker: boss,
      player,
      feedback: this.feedback,
      ...profile,
    });
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

  animate(boss, deltaSeconds) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 8.8 : 3.4)) * 0.045 + hit * 0.13;
    boss.group.scale.setScalar(1.92 + hit * 0.08 + (boss.phase === 2 ? 0.08 : 0));
    boss.group.userData.halos?.forEach((halo, index) => {
      halo.rotation.z += deltaSeconds * (0.8 + index * 0.16) * (boss.phase === 2 ? 1.5 : 1);
      halo.material.emissiveIntensity = boss.state === "starVolley" || boss.hitReactTimer > 0 ? 1.05 : 0.52;
    });
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.astralGuardianBoss;
    if (!boss || boss.defeated || !this.questActive) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const typeBonus = arrow.arrowType?.id === "standard" ? 1.06 : arrow.arrowType?.id === "explosive" ? 0.88 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 1.06 * typeBonus * (weakSpot ? 1.72 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.36 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xfff0c2 : (weakSpot ? 0xcdb7ff : 0x7f86d8), boss.health <= 0 ? 4.5 : (weakSpot ? 2.5 : 1.55));
    this.feedback?.shake(boss.health <= 0 ? 0.4 : 0.09 + shotPower * 0.09);
    this.showBossCombatText(boss, boss.health <= 0 ? "ASTRAL GUARDIAN QUIETS" : (weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`), boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint || !this.questActive) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 2.0) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.5 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xffcf5f, 2.55);
    this.showBossCombatText(boss, boss.health <= 0 ? "ASTRAL GUARDIAN QUIETS" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.4;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xfff0c2, 4.8);
    this.feedback?.playSound("bossDefeat", 1.24);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Starpiercer", rarity: "legendary", category: "bows", itemId: "starpiercer", text: "The celestial bow accepts your hand after the Astral Guardian falls." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "astralGuardian" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.045);
    boss.group.scale.multiplyScalar(0.996);
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
    this.ui.name.textContent = `${boss.name}${boss.phase === 2 && !boss.defeated ? " • Phase II" : ""}`;
    this.ui.fill.style.setProperty("--boss-health", (boss.health / boss.maxHealth).toFixed(3));
    this.ui.bar.classList.toggle("visible", boss.noticed && !boss.defeated);
  }
}
