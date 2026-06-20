import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class StormtalonBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.stormtalon;
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
      diveCooldown: 2.4,
      gustCooldown: 4.1,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(116, 0, -95),
      patrolPoints: [
        new THREE.Vector3(116, 0, -95),
        new THREE.Vector3(123, 0, -101),
        new THREE.Vector3(118, 0, -108),
        new THREE.Vector3(109, 0, -100),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeAboveGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.stormBoss = boss;
        child.castShadow = true;
        boss.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const feather = new THREE.MeshStandardMaterial({ color: 0x9a7951, roughness: 0.82 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.88 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe7bb62, roughness: 0.48, emissive: 0x2a1600, emissiveIntensity: 0.14 });
    const wind = new THREE.MeshStandardMaterial({ color: 0xa6e6ff, roughness: 0.36, emissive: 0x2c8fb5, emissiveIntensity: 0.22 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 1.52, 8, 16), feather);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.55;
    body.scale.set(1.52, 1, 0.86);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), dark);
    chest.position.set(0.62, 1.63, 0);
    chest.scale.set(0.8, 1.08, 0.82);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), feather);
    head.position.set(1.38, 1.82, 0);
    head.scale.set(1.08, 0.86, 0.78);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.62, 8), gold);
    beak.position.set(1.82, 1.74, 0);
    beak.rotation.z = -Math.PI / 2;
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 5), wind);
    crest.position.set(1.18, 2.16, 0);
    crest.rotation.z = -0.55;
    group.add(body, chest, head, beak, crest);

    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.6, 6), feather);
      wing.position.set(0.08, 1.62, side * 0.7);
      wing.rotation.set(Math.PI / 2, 0, side * 1.18);
      wing.scale.set(0.82, 1.15, 0.28);
      group.add(wing);
      group.userData.wings = [...(group.userData.wings ?? []), { mesh: wing, side }];

      const weakSpot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), wind);
      weakSpot.name = "stormtalon-weakspot";
      weakSpot.position.set(0.24, 1.62, side * 1.04);
      group.add(weakSpot);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), gold);
      eye.position.set(1.62, 1.92, side * 0.14);
      group.add(eye);
    });

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.86, 5), dark);
    tail.position.set(-0.92, 1.5, 0);
    tail.rotation.z = Math.PI / 2;
    group.add(tail);

    group.userData.crest = crest;
    group.userData.tail = tail;
    group.scale.setScalar(1.45);
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
    boss.diveCooldown = Math.max(0, boss.diveCooldown - deltaSeconds);
    boss.gustCooldown = Math.max(0, boss.gustCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }

    if (boss.state === "dive") {
      this.updateDive(deltaSeconds, boss);
    } else if (boss.state === "gust") {
      this.updateGust(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.diveDistance && boss.diveCooldown <= 0) {
        this.startDive(boss, player.group.position);
      } else if (distance <= this.config.gustDistance && boss.gustCooldown <= 0) {
        this.startGust(boss);
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
    this.placeAboveGround(boss);
    this.animate(boss);
    this.updateBossBar();
  }

  noticeBoss(boss) {
    boss.noticed = true;
    this.ui.bar.classList.add("visible");
    this.feedback?.playSound("bossNotice", 1.12);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  startDive(boss, target) {
    boss.state = "dive";
    boss.stateTimer = this.config.diveDuration;
    boss.diveCooldown = this.config.diveCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xa6e6ff, 1.6);
    this.feedback?.playSound("bossCharge", 0.95);
  }

  updateDive(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.diveSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.24);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.shake(0.16);
      this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xdaf0e6, 2.0);
    }
  }

  startGust(boss) {
    boss.state = "gust";
    boss.stateTimer = 0.85;
    boss.gustCooldown = this.config.gustCooldown;
    boss.hitReactTimer = 0.35;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xc9f4ff, 2.4);
    this.feedback?.playSound("bossCharge", 0.7);
  }

  updateGust(deltaSeconds, boss) {
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

  placeAboveGround(boss) {
    const ground = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z);
    const hover = boss.state === "dive" ? 1.3 : 2.3;
    boss.group.position.y = ground + hover;
  }

  animate(boss) {
    const time = performance.now() * 0.001;
    const hit = boss.hitReactTimer > 0 ? boss.hitReactTimer : 0;
    boss.group.position.y += Math.sin(time * (boss.state === "dive" ? 9 : 4.2)) * 0.12 + hit * 0.18;
    boss.group.scale.setScalar(1.45 + hit * 0.1 + (boss.state === "dive" ? 0.08 : 0));
    boss.group.userData.wings?.forEach(({ mesh, side }) => {
      mesh.rotation.z = side * (1.18 + Math.sin(time * (boss.state === "dive" ? 13 : 6)) * 0.34);
    });
    if (boss.group.userData.crest) {
      boss.group.userData.crest.material.emissiveIntensity = boss.state === "gust" || boss.hitReactTimer > 0 ? 0.58 : 0.22;
    }
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.stormBoss;
    if (!boss || boss.defeated) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const typeBonus = arrow.arrowType?.id === "ice" ? 1.12 : arrow.arrowType?.id === "explosive" ? 0.85 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 0.95 * typeBonus * (weakSpot ? 1.55 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.32 + shotPower * 0.22;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xffd166 : (weakSpot ? 0xa6e6ff : 0xd7a45e), boss.health <= 0 ? 3.4 : (weakSpot ? 2.1 : 1.4));
    this.feedback?.shake(boss.health <= 0 ? 0.36 : 0.08 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "STORMTALON DOWN" : (weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`), boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 1.6) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.48 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.4);
    this.showBossCombatText(boss, boss.health <= 0 ? "STORMTALON DOWN" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 2.8;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xa6e6ff, 3.8);
    this.feedback?.playSound("bossDefeat", 1.2);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Stormtalon Plume", rarity: "legendary", text: "A wind-cut feather needed to claim Tidepiercer." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "stormtalon" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.06);
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
