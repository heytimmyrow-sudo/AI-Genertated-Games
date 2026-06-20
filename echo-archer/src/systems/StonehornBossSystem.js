import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class StonehornBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.stonehorn;
    this.defeatListeners = [];
    this.boss = this.createBoss();
    this.updateBossBar();
  }

  createBoss() {
    const boss = {
      name: this.config.name,
      health: this.config.health,
      maxHealth: this.config.health,
      active: true,
      defeated: false,
      noticed: false,
      state: "patrol",
      patrolIndex: 0,
      chargeCooldown: 3.4,
      rockSlamCooldown: 4.6,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(18, 0, 130),
      patrolPoints: [
        new THREE.Vector3(18, 0, 130),
        new THREE.Vector3(25, 0, 136),
        new THREE.Vector3(15, 0, 143),
        new THREE.Vector3(9, 0, 134),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.stonehornBoss = boss;
        child.castShadow = true;
        child.receiveShadow = true;
        boss.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const hide = new THREE.MeshStandardMaterial({ color: 0x8f4d2f, roughness: 0.92 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a2c24, roughness: 0.96 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.64 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xffc35b, roughness: 0.34, emissive: 0xff8b35, emissiveIntensity: 0.58 });
    const dust = new THREE.MeshStandardMaterial({ color: 0xc27439, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.18, 18, 12), hide);
    body.position.y = 1.08;
    body.scale.set(1.72, 0.9, 1.05);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 10), dark);
    chest.position.set(0.82, 1.17, 0);
    chest.scale.set(1.22, 0.86, 0.96);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 16, 10), dark);
    head.position.set(1.48, 1.32, 0);
    head.scale.set(1.06, 0.78, 0.9);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.82), hornMat);
    brow.position.set(1.62, 1.58, 0);
    group.add(body, chest, head, brow);

    [-1, 1].forEach((side) => {
      const mainHorn = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.12, 8), hornMat);
      mainHorn.position.set(1.44, 1.72, side * 0.48);
      mainHorn.rotation.set(Math.PI * 0.48, side * 0.22, side * 0.78);
      group.add(mainHorn);

      const shoulderWeak = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), glow);
      shoulderWeak.name = "stonehorn-weakspot";
      shoulderWeak.position.set(0.28, 1.6, side * 0.86);
      group.add(shoulderWeak);

      for (let index = 0; index < 2; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.92, 6, 10), hide);
        leg.position.set(-0.42 + index * 0.9, 0.44, side * 0.52);
        leg.rotation.z = index === 0 ? -0.12 : 0.12;
        group.add(leg);
      }
    });

    const backWeak = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), glow);
    backWeak.name = "stonehorn-weakspot";
    backWeak.position.set(-0.5, 1.74, 0);
    group.add(backWeak);

    for (let index = 0; index < 7; index += 1) {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.54, 5), dust);
      ridge.position.set(-0.82 + index * 0.27, 1.82 + Math.sin(index) * 0.05, 0);
      ridge.rotation.z = -0.18 + index * 0.05;
      group.add(ridge);
    }

    group.userData.glow = glow;
    group.scale.setScalar(1.82);
    return group;
  }

  onDefeated(callback) {
    this.defeatListeners.push(callback);
  }

  update(deltaSeconds, player) {
    const boss = this.boss;
    if (boss.defeated) {
      this.updateDefeated(deltaSeconds, boss);
      this.updateBossBar();
      return;
    }

    boss.hitReactTimer = Math.max(0, boss.hitReactTimer - deltaSeconds);
    boss.chargeCooldown = Math.max(0, boss.chargeCooldown - deltaSeconds);
    boss.rockSlamCooldown = Math.max(0, boss.rockSlamCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "rockSlam") {
      this.updateRockSlam(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, player.group.position);
      } else if (distance <= this.config.slamDistance && boss.rockSlamCooldown <= 0) {
        this.startRockSlam(boss);
      } else {
        this.moveToward(boss, player.group.position, this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.78, deltaSeconds);
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
    this.feedback?.playSound("bossNotice", 1.06);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startCharge(boss, target) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xc27439, 1.85);
    this.feedback?.playSound("bossCharge", 0.94);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.25);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0x8f4d2f, 2.6);
      this.feedback?.shake(0.2);
    }
  }

  startRockSlam(boss) {
    boss.state = "rockSlam";
    boss.stateTimer = 0.95;
    boss.rockSlamCooldown = this.config.slamCooldown;
    boss.hitReactTimer = 0.3;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xffb35d, 2.75);
    this.feedback?.playSound("enemyHit", 0.78);
    this.feedback?.shake(0.14);
  }

  updateRockSlam(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
    }
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "patrol") {
      return;
    }
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

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 8.4 : 2.9)) * 0.032 + hit * 0.14;
    boss.group.scale.setScalar(1.82 + hit * 0.08 + (boss.state === "charge" ? 0.1 : 0));
    if (boss.group.userData.glow) {
      boss.group.userData.glow.emissiveIntensity = boss.state === "rockSlam" || boss.hitReactTimer > 0 ? 0.95 : 0.58;
    }
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.stonehornBoss;
    if (!boss || boss.defeated) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const typeBonus = arrow.arrowType?.id === "fire" ? 1.08 : arrow.arrowType?.id === "ice" ? 0.96 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 0.98 * typeBonus * (weakSpot ? 1.65 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.34 + shotPower * 0.22;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xffd276 : (weakSpot ? 0xffd276 : 0xc27439), boss.health <= 0 ? 4 : (weakSpot ? 2.25 : 1.45));
    this.feedback?.shake(boss.health <= 0 ? 0.36 : 0.075 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "STONEHORN BREAKS" : (weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`), boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 1.9) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.52 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.45);
    this.showBossCombatText(boss, boss.health <= 0 ? "STONEHORN BREAKS" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 3.1;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffd276, 4.35);
    this.feedback?.playSound("bossDefeat", 1.2);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Stonehorn Sunplate", rarity: "epic", text: "Rare canyon gear and proof of the Sunspire victory." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "stonehorn" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.055);
    boss.group.scale.multiplyScalar(0.996);
    if (boss.stateTimer <= 0) this.ui.bar.classList.remove("visible");
  }

  showBossCombatText(boss, text, kind) {
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text, kind, x: window.innerWidth / 2, y: window.innerHeight * 0.28 },
    }));
  }

  updateBossBar() {
    const boss = this.boss;
    if (!boss.noticed && !boss.defeated) {
      return;
    }
    this.ui.name.textContent = boss.name;
    this.ui.fill.style.setProperty("--boss-health", (boss.health / boss.maxHealth).toFixed(3));
    this.ui.bar.classList.toggle("visible", boss.noticed && !boss.defeated);
  }
}
