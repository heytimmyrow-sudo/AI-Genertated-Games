import { SETTINGS } from "../config/settings.js";
import {
  getBossAttackProfile,
  tryDamagePlayer as damagePlayerIfInRange,
  updateAttackCooldown,
} from "./CombatDamage.js";

const { THREE } = window;

const scratch = new THREE.Vector3();

export class RootGuardianBossSystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.config = SETTINGS.bosses.rootGuardian;
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
      slamCooldown: 2.8,
      vinePulseCooldown: 4.8,
      attackCooldown: 0,
      stateTimer: 0,
      hitReactTimer: 0,
      chargeDirection: new THREE.Vector3(),
      home: new THREE.Vector3(105, 0, 88),
      patrolPoints: [
        new THREE.Vector3(105, 0, 88),
        new THREE.Vector3(112, 0, 94),
        new THREE.Vector3(104, 0, 101),
        new THREE.Vector3(96, 0, 93),
      ],
      group: this.createBossMesh(),
      colliders: [],
    };
    boss.group.position.copy(boss.home);
    this.placeOnGround(boss);
    this.scene.add(boss.group);
    boss.group.traverse((child) => {
      if (child.isMesh) {
        child.userData.rootBoss = boss;
        child.castShadow = true;
        boss.colliders.push(child);
        this.world.colliders.push(child);
      }
    });
    return boss;
  }

  createBossMesh() {
    const group = new THREE.Group();
    const bark = new THREE.MeshStandardMaterial({ color: 0x57402f, roughness: 0.92 });
    const moss = new THREE.MeshStandardMaterial({ color: 0x6f9b59, roughness: 0.86 });
    const glow = new THREE.MeshStandardMaterial({ color: 0x9dffd0, roughness: 0.42, emissive: 0x35b06a, emissiveIntensity: 0.38 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x5e675b, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12), bark);
    body.position.y = 1.25;
    body.scale.set(1.08, 1.35, 0.82);
    const chestWeak = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow);
    chestWeak.name = "rootguardian-weakspot";
    chestWeak.position.set(0.64, 1.45, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), stone);
    head.position.set(0.44, 2.28, 0);
    head.scale.set(1.1, 0.82, 0.86);
    group.add(body, chestWeak, head);

    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 1.35, 6, 10), bark);
      arm.position.set(0.28, 1.24, side * 0.78);
      arm.rotation.set(0.2, 0, side * 0.55);
      group.add(arm);
      const shoulderWeak = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), glow);
      shoulderWeak.name = "rootguardian-weakspot";
      shoulderWeak.position.set(0.22, 1.88, side * 0.72);
      group.add(shoulderWeak);
      for (let index = 0; index < 2; index += 1) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.8, 6, 10), bark);
        leg.position.set(-0.32 + index * 0.7, 0.5, side * 0.28);
        leg.rotation.z = index === 0 ? -0.08 : 0.12;
        group.add(leg);
      }
    });

    for (let index = 0; index < 7; index += 1) {
      const branch = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.9, 5), moss);
      branch.position.set(-0.58 + index * 0.2, 2.68 + Math.sin(index) * 0.08, -0.34);
      branch.rotation.x = -0.8;
      branch.rotation.z = -0.25 + index * 0.08;
      group.add(branch);
    }

    group.userData.body = body;
    group.userData.glow = glow;
    group.scale.setScalar(1.62);
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
    boss.slamCooldown = Math.max(0, boss.slamCooldown - deltaSeconds);
    boss.vinePulseCooldown = Math.max(0, boss.vinePulseCooldown - deltaSeconds);
    updateAttackCooldown(boss, deltaSeconds);

    const distance = boss.group.position.distanceTo(player.group.position);
    const homeDistance = boss.group.position.distanceTo(boss.home);
    if (!boss.noticed && distance <= this.config.noticeDistance) {
      this.noticeBoss(boss);
    }

    if (boss.state === "slam") {
      this.updateSlam(deltaSeconds, boss);
    } else if (boss.state === "vinePulse") {
      this.updateVinePulse(deltaSeconds, boss);
    } else if (boss.state === "recover") {
      boss.stateTimer -= deltaSeconds;
      if (boss.stateTimer <= 0) boss.state = "chase";
    } else if (boss.noticed && homeDistance <= this.config.leashRadius) {
      if (distance <= this.config.slamDistance && boss.slamCooldown <= 0) {
        this.startSlam(boss, player.group.position);
      } else if (distance <= this.config.vinePulseDistance && boss.vinePulseCooldown <= 0) {
        this.startVinePulse(boss);
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

  startSlam(boss, target) {
    boss.state = "slam";
    boss.stateTimer = this.config.slamDuration;
    boss.slamCooldown = this.config.slamCooldown;
    boss.chargeDirection.copy(target).sub(boss.group.position);
    boss.chargeDirection.y = 0;
    boss.chargeDirection.normalize();
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0x8ff0b1, 1.5);
    this.feedback?.playSound("bossCharge", 0.78);
  }

  updateSlam(deltaSeconds, boss) {
    boss.stateTimer -= deltaSeconds;
    boss.group.position.addScaledVector(boss.chargeDirection, this.config.rootSlamSpeed * deltaSeconds);
    boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, Math.atan2(boss.chargeDirection.x, boss.chargeDirection.z), 0.24);
    if (boss.stateTimer <= 0) {
      boss.state = "recover";
      boss.stateTimer = this.config.recoveryDuration;
      this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x6f9b59, 2.2);
      this.feedback?.shake(0.18);
    }
  }

  startVinePulse(boss) {
    boss.state = "vinePulse";
    boss.stateTimer = 0.9;
    boss.vinePulseCooldown = this.config.vinePulseCooldown;
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x9dffd0, 2.5);
    this.feedback?.playSound("bossCharge", 0.62);
  }

  updateVinePulse(deltaSeconds, boss) {
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
    boss.group.position.y += Math.sin(time * (boss.state === "slam" ? 8 : 3.5)) * 0.045 + hit * 0.16;
    boss.group.scale.setScalar(1.62 + hit * 0.08 + (boss.state === "slam" ? 0.07 : 0));
    if (boss.group.userData.glow) {
      boss.group.userData.glow.emissiveIntensity = boss.state === "vinePulse" || boss.hitReactTimer > 0 ? 0.72 : 0.38;
    }
  }

  handleArrowHit(arrow) {
    const boss = arrow.hitObjectRef?.userData.rootBoss;
    if (!boss || boss.defeated) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const shotPower = arrow.shotPower ?? 0.5;
    const weakSpot = arrow.hitObjectRef?.name?.includes("weakspot");
    const typeBonus = arrow.arrowType?.id === "fire" ? 1.16 : arrow.arrowType?.id === "ice" ? 0.9 : 1;
    const damage = SETTINGS.enemies.arrowDamage * 0.92 * typeBonus * (weakSpot ? 1.58 : 1) * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.3 + shotPower * 0.22;
    this.feedback?.spawnImpact(arrow.hitPoint ?? boss.group.position, boss.health <= 0 ? 0xffd166 : (weakSpot ? 0x9dffd0 : 0x6f9b59), boss.health <= 0 ? 3.5 : (weakSpot ? 2.0 : 1.35));
    this.feedback?.shake(boss.health <= 0 ? 0.34 : 0.07 + shotPower * 0.08);
    this.showBossCombatText(boss, boss.health <= 0 ? "ROOT GUARDIAN FALLS" : (weakSpot ? `WEAK ${Math.round(damage)}` : `${Math.round(damage)}`), boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
    this.updateBossBar();
  }

  handleAreaArrowEffect(arrow) {
    const boss = this.boss;
    if (arrow.arrowType?.id !== "explosive" || boss.defeated || !arrow.hitPoint) return;
    const distance = boss.group.position.distanceTo(arrow.hitPoint);
    if (distance > (arrow.arrowType.radius ?? 4) + 1.4) return;
    if (!boss.noticed) this.noticeBoss(boss);
    const damage = SETTINGS.enemies.arrowDamage * 0.48 * (arrow.damageMultiplier ?? 1);
    boss.health = Math.max(0, boss.health - damage);
    boss.hitReactTimer = 0.42;
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffcf5f, 2.3);
    this.showBossCombatText(boss, boss.health <= 0 ? "ROOT GUARDIAN FALLS" : `${Math.round(damage)}`, boss.health <= 0 ? "xp" : "damage strong");
    if (boss.health <= 0) this.defeatBoss(boss);
  }

  defeatBoss(boss) {
    boss.defeated = true;
    boss.active = false;
    boss.state = "defeated";
    boss.stateTimer = 2.8;
    this.world.colliders = this.world.colliders.filter((collider) => !boss.colliders.includes(collider));
    this.feedback?.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0x9dffd0, 3.7);
    this.feedback?.playSound("bossDefeat", 1.16);
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: { name: "Root Guardian Heartwood", rarity: "legendary", text: "The living proof needed to claim Whisperwind." },
    }));
    this.defeatListeners.forEach((callback) => callback({ boss, type: "rootGuardian" }));
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
