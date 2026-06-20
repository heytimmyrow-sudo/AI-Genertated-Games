import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratchDirection = new THREE.Vector3();

export class MiniBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.barkhideStalker;
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
      chargeCooldown: 1.4,
      attackCooldown: 0,
      stateTimer: 0,
      chargeDirection: new THREE.Vector3(),
      hitReactTimer: 0,
      home: new THREE.Vector3(-25.8, 0, 14.2),
      patrolPoints: [
        new THREE.Vector3(-25.8, 0, 14.2),
        new THREE.Vector3(-31.5, 0, 13.2),
        new THREE.Vector3(-29.2, 0, 19.1),
        new THREE.Vector3(-22.6, 0, 18.4),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };

    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.boss = boss;
        child.castShadow = true;
        boss.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const barkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b4328, roughness: 0.88 });
    const barkDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x2f251b, roughness: 0.92 });
    const mossMaterial = new THREE.MeshStandardMaterial({ color: 0x516d3d, roughness: 0.9 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf6a, roughness: 0.38, emissive: 0x6c3300, emissiveIntensity: 0.55 });
    const thornMaterial = new THREE.MeshStandardMaterial({ color: 0x241a13, roughness: 0.94 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.56, 1.08, 8, 14), barkMaterial);
    torso.position.y = 1.18;
    torso.scale.set(1.12, 1.18, 0.82);
    group.add(torso);

    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.76, 16, 10), barkDarkMaterial);
    shoulders.position.y = 1.72;
    shoulders.scale.set(1.42, 0.62, 0.78);
    group.add(shoulders);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), barkMaterial);
    head.position.set(0.18, 2.18, 0.12);
    head.scale.set(0.82, 0.9, 0.78);
    group.add(head);

    for (const side of [-1, 1]) {
      const antler = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.78, 5), barkDarkMaterial);
      antler.position.set(side * 0.32, 2.66, 0.04);
      antler.rotation.set(0.32, 0, side * -0.42);
      group.add(antler);

      const branch = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.42, 5), thornMaterial);
      branch.position.set(side * 0.48, 2.74, -0.02);
      branch.rotation.set(0.4, 0.08, side * -0.9);
      group.add(branch);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), eyeMaterial);
      eye.position.set(side * 0.13, 2.18, 0.42);
      group.add(eye);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.82, 5, 9), barkDarkMaterial);
      arm.position.set(side * 0.78, 1.22, 0.1);
      arm.rotation.z = side * 0.34;
      group.add(arm);

      const hand = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 6), barkDarkMaterial);
      hand.position.set(side * 0.96, 0.72, 0.18);
      hand.rotation.z = side * -0.2;
      group.add(hand);

      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.72, 5, 9), barkMaterial);
      leg.position.set(side * 0.28, 0.45, 0);
      leg.rotation.z = side * 0.08;
      group.add(leg);

      const shoulderThorn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.46, 5), thornMaterial);
      shoulderThorn.position.set(side * 0.76, 1.96, -0.18);
      shoulderThorn.rotation.set(-0.2, 0, side * -0.62);
      shoulderThorn.castShadow = true;
      group.add(shoulderThorn);
    }

    const mossBack = new THREE.Mesh(new THREE.ConeGeometry(0.74, 1.05, 7), mossMaterial);
    mossBack.position.set(-0.18, 1.48, -0.28);
    mossBack.rotation.x = -0.24;
    mossBack.scale.set(1, 0.72, 0.58);
    group.add(mossBack);

    const backSpines = [];
    for (let index = 0; index < 5; index += 1) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.44 - index * 0.035, 5), thornMaterial);
      spine.position.set(-0.36 + index * 0.18, 1.72 + Math.sin(index) * 0.12, -0.62);
      spine.rotation.x = -0.82;
      spine.castShadow = true;
      group.add(spine);
      backSpines.push(spine);
    }

    const chestRune = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 22), eyeMaterial);
    chestRune.position.set(0, 1.48, 0.45);
    chestRune.rotation.x = Math.PI / 2;
    group.add(chestRune);

    group.userData = { chestRune, mossBack, backSpines };
    group.scale.setScalar(1.48);
    return group;
  }

  onDefeated(callback) {
    this.defeatListeners.push(callback);
  }

  update(deltaSeconds, player, camera) {
    const boss = this.boss;
    if (boss.defeated) {
      this.updateDefeated(deltaSeconds, boss);
      this.updateBossBar();
      return;
    }

    boss.hitReactTimer = Math.max(0, boss.hitReactTimer - deltaSeconds);
    boss.chargeCooldown = Math.max(0, boss.chargeCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    const playerPosition = player.group.position;
    const distanceToPlayer = boss.group.position.distanceTo(playerPosition);
    const distanceFromHome = boss.group.position.distanceTo(boss.home);

    if (!boss.noticed && distanceToPlayer <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }

    if (boss.state === "charge") {
      this.updateCharge(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) {
        boss.state = boss.noticed ? "chase" : "patrol";
      }
    } else if (boss.noticed && distanceFromHome <= this.config.leashRadius) {
      if (distanceToPlayer <= this.config.chargeDistance && boss.chargeCooldown <= 0) {
        this.startCharge(boss, playerPosition);
      } else {
        boss.state = "chase";
        this.moveToward(boss, playerPosition, this.config.chaseSpeed, deltaSeconds);
      }
    } else if (distanceFromHome > this.config.leashRadius) {
      boss.noticed = false;
      boss.state = "return";
      this.ui.bar.classList.remove("visible");
      window.dispatchEvent(new CustomEvent("echo-archer:music-state", {
        detail: { boss: false },
      }));
      this.moveToward(boss, boss.home, this.config.chaseSpeed * 0.78, deltaSeconds);
    } else {
      boss.state = "patrol";
      this.patrol(deltaSeconds, boss);
    }

    this.tryDamagePlayer(boss, player);
    this.placeOnGround(boss);
    this.animate(deltaSeconds, boss);
    this.updateBossBar(camera);
  }

  noticeBoss(boss) {
    boss.noticed = true;
    boss.state = "chase";
    this.ui.bar.classList.add("visible");
    this.feedback?.playSound("bossNotice", 1);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", {
      detail: { boss: true },
    }));
  }

  patrol(deltaSeconds, boss) {
    const target = boss.patrolPoints[boss.patrolIndex];
    if (boss.group.position.distanceTo(target) < 0.9) {
      boss.patrolIndex = (boss.patrolIndex + 1) % boss.patrolPoints.length;
    }
    this.moveToward(boss, boss.patrolPoints[boss.patrolIndex], this.config.patrolSpeed, deltaSeconds);
  }

  startCharge(boss, playerPosition) {
    boss.state = "charge";
    boss.stateTimer = this.config.chargeDuration;
    boss.chargeCooldown = this.config.chargeCooldown;
    boss.chargeDirection.copy(playerPosition).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.playSound("bossCharge", 0.9);
  }

  updateCharge(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.chargeSpeed * deltaSeconds);
    const yaw = Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, yaw, 0.24);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
    }
  }

  tryDamagePlayer(boss, player) {
    if (!boss.noticed || boss.state === "return" || boss.state === "patrol") {
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

  moveToward(boss, target, speed, deltaSeconds) {
    scratchDirection.copy(target).sub(boss.group.position);
    scratchDirection.y = 0;
    if (scratchDirection.lengthSq() < 0.001) {
      return;
    }

    scratchDirection.normalize();
    boss.group.position.addScaledVector(scratchDirection, speed * deltaSeconds);
    const yaw = Math.atan2(scratchDirection.x, scratchDirection.z);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, yaw, 0.1);
  }

  placeOnGround(boss) {
    boss.group.position.y = this.world.terrain.getHeightAt(boss.group.position.x, boss.group.position.z);
  }

  animate(deltaSeconds, boss) {
    const time = performance.now() * 0.001;
    const hitKick = boss.hitReactTimer > 0 ? boss.hitReactTimer / 0.28 : 0;
    const chargeLean = boss.state === "charge" ? 0.28 : boss.state === "recover" ? -0.16 : 0;
    boss.group.rotation.x = THREE.MathUtils.lerp(boss.group.rotation.x, chargeLean, 0.14);
    boss.group.position.y += Math.sin(time * (boss.state === "charge" ? 9 : 3.2)) * 0.04 + hitKick * 0.18;
    boss.group.scale.setScalar(1.48 + hitKick * 0.1 + (boss.state === "charge" ? 0.06 : 0) + (boss.state === "recover" ? -0.05 : 0));
    const rune = boss.group.userData.chestRune;
    if (rune) {
      rune.scale.setScalar(1 + (boss.state === "charge" ? 0.22 : 0) + Math.sin(time * 4) * 0.04);
      rune.material.emissiveIntensity = boss.state === "charge" ? 0.8 : 0.55;
    }
    boss.group.userData.backSpines?.forEach((spine, index) => {
      spine.rotation.z = Math.sin(time * 2.4 + index) * 0.04;
    });
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.boss;
    if (!boss || boss.defeated) {
      return;
    }

    if (!boss.noticed) {
      this.noticeBoss(boss);
    }

    const shotPower = arrow.shotPower ?? 0.5;
    const damage = SETTINGS.enemies.arrowDamage * 0.9 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    if (arrow.arrowType?.id === "fire") {
      boss.hitReactTimer = Math.max(boss.hitReactTimer, 0.45);
      this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, 0xff8a3d, 1.65);
    }
    if (arrow.arrowType?.id === "ice") {
      boss.chargeCooldown = Math.max(boss.chargeCooldown, 1.4);
      this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, 0x8ddcff, 1.45);
    }
    boss.hitReactTimer = 0.28 + shotPower * 0.22;
    this.feedback?.shake(boss.health <= 0 ? 0.32 : 0.09 + shotPower * 0.1);
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xe6b75d : (shotPower > 0.72 ? 0xffb15f : 0xa9793e), boss.health <= 0 ? 2.8 : 1.35 + shotPower * 0.65);
    this.feedback?.playSound("enemyHit", 1.05 + shotPower * 0.35);
    this.showBossCombatText(boss, boss.health <= 0 ? "BARKHIDE DOWN" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : (shotPower > 0.72 ? "damage strong" : "damage"));

    if (boss.health <= 0) {
      this.defeatBoss(boss);
    }
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) {
      return;
    }
    const radius = arrow.arrowType.radius ?? 4;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > radius + 1.2) {
      return;
    }
    if (!boss.noticed) {
      this.noticeBoss(boss);
    }
    const falloff = Math.max(0.2, 1 - distance / (radius + 1.2));
    const damage = SETTINGS.enemies.arrowDamage * 0.5 * falloff * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = Math.max(boss.hitReactTimer, 0.42);
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.2);
    this.feedback?.shake(0.18 + falloff * 0.12);
    this.showBossCombatText(boss, boss.health <= 0 ? "BARKHIDE DOWN" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) {
      this.defeatBoss(boss);
    }
    this.updateBossBar();
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 2.2;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xe6b75d, 3.3);
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x7fa35b, 2.4);
    this.feedback?.playSound("bossDefeat", 1.12);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", {
      detail: { boss: false },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "barkhideStalker" }));
  }

  updateDefeated(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.rotation.z = THREE.MathUtils.lerp(boss.group.rotation.z, -Math.PI / 2, 0.06);
    boss.group.rotation.x = THREE.MathUtils.lerp(boss.group.rotation.x, 0.34, 0.045);
    boss.group.scale.multiplyScalar(0.995);
    if (boss.stateTimer <= 0) {
      this.ui.bar.classList.remove("visible");
    }
  }

  showBossCombatText(boss, text, kind) {
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text,
        kind,
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.32,
      },
    }));
  }

  updateBossBar() {
    const boss = this.boss;
    this.ui.name.textContent = boss.name;
    this.ui.fill.style.setProperty("--boss-health", (boss.health / boss.maxHealth).toFixed(3));
    this.ui.bar.classList.toggle("visible", boss.noticed && !boss.defeated);
  }
}
