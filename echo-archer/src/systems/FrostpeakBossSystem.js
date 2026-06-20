import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class FrostpeakBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.icefang;
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
      cooldown: 2.2,
      howlCooldown: 3.4,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(-110, 0, 96),
      patrolPoints: [
        new THREE.Vector3(-110, 0, 96),
        new THREE.Vector3(-118, 0, 101),
        new THREE.Vector3(-112, 0, 110),
        new THREE.Vector3(-103, 0, 104),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.frostBoss = boss;
        child.castShadow = true;
        boss.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const fur = new THREE.MeshStandardMaterial({ color: 0xdbe9ed, roughness: 0.82 });
    const ice = new THREE.MeshStandardMaterial({ color: 0x8ddcff, roughness: 0.34, emissive: 0x1c7ccf, emissiveIntensity: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4d6f82, roughness: 0.88 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.54, 1.65, 8, 16), fur);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.05;
    body.scale.set(1.58, 1, 0.9);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 10), dark);
    chest.position.set(0.72, 1.18, 0);
    chest.scale.set(0.86, 1.12, 0.88);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), fur);
    head.position.set(1.5, 1.35, 0);
    head.scale.set(1.12, 0.9, 0.86);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), dark);
    snout.position.set(1.92, 1.25, 0);
    snout.rotation.z = -Math.PI / 2;
    const mane = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.12, 6), ice);
    mane.position.set(0.54, 1.62, -0.08);
    mane.rotation.z = Math.PI / 2;
    mane.scale.set(0.82, 1.18, 0.7);
    group.add(body, chest, head, snout, mane);
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), ice);
      eye.position.set(1.78, 1.46, side * 0.18);
      group.add(eye);
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32, 5), ice);
      fang.position.set(1.95, 1.05, side * 0.1);
      fang.rotation.z = Math.PI;
      group.add(fang);
      for (let index = 0; index < 2; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.78, 5, 9), dark);
        leg.position.set(-0.45 + index * 1.08, 0.45, side * 0.28);
        leg.castShadow = true;
        group.add(leg);
      }
    });
    for (let index = 0; index < 6; index += 1) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 5), ice);
      spike.position.set(-0.56 + index * 0.32, 1.72 + Math.sin(index) * 0.05, -0.48);
      spike.rotation.x = -0.9;
      group.add(spike);
    }
    group.userData.mane = mane;
    group.scale.setScalar(1.55);
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
    boss.cooldown = Math.max(0, boss.cooldown - deltaSeconds);
    boss.howlCooldown = Math.max(0, boss.howlCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);
    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }
    if (boss.state === "pounce") {
      this.updatePounce(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (boss.howlCooldown <= 0) {
        this.frostHowl(boss);
      } else if (distance <= this.config.pounceDistance && boss.cooldown <= 0) {
        this.startPounce(boss, player.group.position);
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
    this.updateBossBar(camera);
  }

  noticeBoss(boss) {
    boss.noticed = true;
    this.ui.bar.classList.add("visible");
    this.feedback?.playSound("bossNotice", 1.05);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: true } }));
  }

  frostHowl(boss) {
    boss.howlCooldown = this.config.frostHowlCooldown;
    boss.cooldown = Math.max(boss.cooldown, 1.4);
    boss.hitReactTimer = 0.5;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x8ddcff, 2.1);
    this.feedback?.shake(0.14);
    this.feedback?.playSound("bossCharge", 0.65);
  }

  startPounce(boss, target) {
    boss.state = "pounce";
    boss.stateTimer = this.config.pounceDuration;
    boss.cooldown = this.config.pounceCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0x8ddcff, 1.4);
    this.feedback?.playSound("bossCharge", 0.9);
  }

  updatePounce(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.pounceSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.24);
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
    boss.group.position.y += Math.sin(time * (boss.state === "pounce" ? 10 : 4)) * 0.05 + hit * 0.16;
    boss.group.scale.setScalar(1.55 + hit * 0.1 + (boss.state === "pounce" ? 0.08 : 0));
    if (boss.group.userData.mane) {
      boss.group.userData.mane.material.emissiveIntensity = boss.state === "pounce" || boss.hitReactTimer > 0 ? 0.55 : 0.28;
    }
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.frostBoss;
    if (!boss || boss.defeated) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const typeBonus = arrow.arrowType?.id === "fire" ? 1.18 : arrow.arrowType?.id === "ice" ? 0.78 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 0.95 * typeBonus * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.3 + shotPower * 0.22;
    if (arrow.arrowType?.id === "ice") boss.cooldown = Math.max(boss.cooldown, 1.2);
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xffd166 : 0x8ddcff, boss.health <= 0 ? 3.1 : 1.5);
    this.feedback?.shake(boss.health <= 0 ? 0.34 : 0.08 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "ICEFANG DOWN" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 1.4) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.52 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.45;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.4);
    this.showBossCombatText(boss, boss.health <= 0 ? "ICEFANG DOWN" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 2.6;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0x8ddcff, 3.6);
    this.feedback?.playSound("bossDefeat", 1.18);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Icefang Fang", rarity: "legendary", text: "A key proof for the Frostbite bow quest." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "icefang" }));
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
