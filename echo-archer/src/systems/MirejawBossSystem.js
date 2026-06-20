import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class MirejawBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.mirejaw;
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
      chargeCooldown: 3.2,
      mudSplashCooldown: 4.4,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(-109, 0, -91),
      patrolPoints: [
        new THREE.Vector3(-109, 0, -91),
        new THREE.Vector3(-116, 0, -96),
        new THREE.Vector3(-103, 0, -102),
        new THREE.Vector3(-101, 0, -88),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.mirejawBoss = boss;
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
    const hide = new THREE.MeshStandardMaterial({ color: 0x3b3a2a, roughness: 0.92 });
    const mud = new THREE.MeshStandardMaterial({ color: 0x2b281d, roughness: 0.98 });
    const moss = new THREE.MeshStandardMaterial({ color: 0x6f7e4d, roughness: 0.9 });
    const glow = new THREE.MeshStandardMaterial({ color: 0x9af6b9, roughness: 0.44, emissive: 0x35b86b, emissiveIntensity: 0.48 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xc7b87a, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12), hide);
    body.position.y = 1.05;
    body.scale.set(1.62, 0.86, 1.05);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 10), mud);
    head.position.set(1.15, 1.22, 0);
    head.scale.set(1.15, 0.78, 0.9);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.62), bone);
    jaw.position.set(1.68, 0.98, 0);
    group.add(body, head, jaw);

    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 7), bone);
      horn.position.set(1.2, 1.78, side * 0.42);
      horn.rotation.set(Math.PI * 0.5, 0, side * 0.35);
      group.add(horn);
      const shoulderWeak = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow);
      shoulderWeak.name = "mirejaw-weakspot";
      shoulderWeak.position.set(0.34, 1.55, side * 0.82);
      group.add(shoulderWeak);
      for (let index = 0; index < 2; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.86, 6, 10), hide);
        leg.position.set(-0.35 + index * 0.86, 0.45, side * 0.48);
        leg.rotation.z = index === 0 ? -0.1 : 0.12;
        group.add(leg);
      }
    });

    const backWeak = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow);
    backWeak.name = "mirejaw-weakspot";
    backWeak.position.set(-0.42, 1.66, 0);
    group.add(backWeak);

    for (let index = 0; index < 6; index += 1) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.72, 5), moss);
      reed.position.set(-0.72 + index * 0.24, 1.78 + Math.sin(index) * 0.06, -0.22);
      reed.rotation.x = -0.55;
      reed.rotation.z = -0.16 + index * 0.05;
      group.add(reed);
    }

    group.userData.glow = glow;
    group.scale.setScalar(1.72);
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
    boss.mudSplashCooldown = Math.max(0, boss.mudSplashCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "mudSplash") {
      this.updateMudSplash(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, player.group.position);
      } else if (distance <= this.config.mudSplashDistance && boss.mudSplashCooldown <= 0) {
        this.startMudSplash(boss);
      } else {
        this.moveToward(boss, player.group.position, this.config.chaseSpeed, deltaSeconds);
      }
    } else if (homeDistance > this.config.leashRadius) {
      boss.noticed = false;
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.8, deltaSeconds);
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
    this.feedback?.playSound("bossNotice", 1.02);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startCharge(boss, target) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.65, 0)), 0x6f7e4d, 1.6);
    this.feedback?.playSound("bossCharge", 0.86);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.24);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0x3f3526, 2.35);
      this.feedback?.shake(0.18);
    }
  }

  startMudSplash(boss) {
    boss.state = "mudSplash";
    boss.stateTimer = 0.9;
    boss.mudSplashCooldown = this.config.mudSplashCooldown;
    boss.hitReactTimer = 0.34;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x5a4a35, 2.7);
    this.feedback?.playSound("enemyHit", 0.72);
    this.feedback?.shake(0.12);
  }

  updateMudSplash(deltaSeconds, boss) {
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
    const bogMultiplier = this.world.getBogEnemySpeedMultiplierAt?.(boss.group.position, "mirejaw") ?? 1;
    boss.group.position.addScaledVector(scratch, speed * bogMultiplier * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(scratch.x, scratch.z), 0.12);
  }

  placeOnGround(boss) {
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z);
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 8 : 3.1)) * 0.035 + hit * 0.15;
    boss.group.scale.setScalar(1.72 + hit * 0.08 + (boss.state === "charge" ? 0.08 : 0));
    if (boss.group.userData.glow) {
      boss.group.userData.glow.emissiveIntensity = boss.state === "mudSplash" || boss.hitReactTimer > 0 ? 0.82 : 0.48;
    }
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.mirejawBoss;
    if (!boss || boss.defeated) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const typeBonus = arrow.arrowType?.id === "ice" ? 1.1 : arrow.arrowType?.id === "fire" ? 0.96 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 0.95 * typeBonus * (weakSpot ? 1.62 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.32 + shotPower * 0.24;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0x9af6b9 : (weakSpot ? 0x9af6b9 : 0x5a4a35), boss.health <= 0 ? 3.7 : (weakSpot ? 2.1 : 1.35));
    this.feedback?.shake(boss.health <= 0 ? 0.34 : 0.07 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "MIREJAW SINKS" : (weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`), boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 1.7) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.5 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.35);
    this.showBossCombatText(boss, boss.health <= 0 ? "MIREJAW SINKS" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 2.9;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x9af6b9, 4.0);
    this.feedback?.playSound("bossDefeat", 1.16);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Mirejaw Scale", rarity: "epic", text: "A rare swamp gear component and proof of the Sunken Shrine victory." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "mirejaw" }));
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
