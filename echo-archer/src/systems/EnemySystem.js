import { SETTINGS } from "../config/settings.js";
import { Enemy } from "../entities/Enemy.js";

const { THREE } = window;

export class EnemySystem {
  constructor(scene, world, ui, feedback = null) {
    this.scene = scene;
    this.world = world;
    this.ui = ui;
    this.feedback = feedback;
    this.slots = [
      { type: "crawler", position: [-24, -48], patrol: [[-24, -48], [-31, -46], [-32, -54], [-22, -56]], territoryRadius: 16, respawnTimer: 0 },
      { type: "wolf", position: [28, -47], patrol: [[28, -47], [36, -44], [34, -54], [24, -56]], territoryRadius: 17, respawnTimer: 0 },
      { type: "crawler", position: [-18, 36], patrol: [[-18, 36], [-23, 32], [-15, 28], [-10, 34]], territoryRadius: 16, respawnTimer: 0 },
      { type: "wolf", position: [-8, 42], patrol: [[-8, 42], [-13, 47], [-21, 43], [-15, 36]], territoryRadius: 17, respawnTimer: 0 },
      { type: "crawler", position: [30, 25], patrol: [[30, 25], [34, 21], [29, 17], [25, 22]], respawnTimer: 0 },
      { type: "crawler", position: [-24, 62], patrol: [[-24, 62], [-20, 59], [-16, 64], [-22, 68]], territoryRadius: 15, respawnTimer: 0 },
      { type: "wolf", position: [-19, 50], patrol: [[-19, 50], [-14, 46], [-10, 52], [-16, 57]], territoryRadius: 16, respawnTimer: 0 },
      { type: "crawler", position: [-12, 46], patrol: [[-12, 46], [-7, 48], [-10, 53], [-16, 51]], territoryRadius: 15, respawnTimer: 0 },
      { type: "snowWolf", position: [-68, 78], patrol: [[-68, 78], [-73, 82], [-69, 87], [-63, 83]], respawnTimer: 0 },
      { type: "iceStag", position: [-88, 95], patrol: [[-88, 95], [-94, 98], [-91, 105], [-84, 102]], respawnTimer: 0 },
      { type: "frostCrawler", position: [-112, 65], patrol: [[-112, 65], [-118, 69], [-114, 76], [-106, 72]], territoryRadius: 16, respawnTimer: 0 },
      { type: "snowWolf", position: [-116, 108], patrol: [[-116, 108], [-121, 112], [-115, 118], [-109, 113]], respawnTimer: 0 },
      { type: "cliffRaptor", position: [108, -86], patrol: [[108, -86], [114, -90], [111, -98], [102, -94]], respawnTimer: 0 },
      { type: "tideCrawler", position: [118, -111], patrol: [[118, -111], [124, -114], [121, -120], [114, -118]], respawnTimer: 0 },
      { type: "windGull", position: [86, -79], patrol: [[86, -79], [92, -84], [88, -91], [80, -86]], respawnTimer: 0 },
      { type: "shellbackBeast", position: [100, -116], patrol: [[100, -116], [106, -121], [98, -124], [92, -118]], respawnTimer: 0 },
      { type: "mistStag", position: [87, 100], patrol: [[87, 100], [94, 104], [90, 112], [81, 108]], respawnTimer: 0 },
      { type: "glowFox", position: [118, 70], patrol: [[118, 70], [124, 74], [120, 80], [112, 77]], respawnTimer: 0 },
      { type: "rootBeast", position: [74, 78], patrol: [[74, 78], [80, 82], [76, 90], [69, 86]], respawnTimer: 0 },
      { type: "forestWisp", position: [111, 105], patrol: [[111, 105], [116, 110], [109, 116], [103, 109]], respawnTimer: 0 },
      { type: "marshStalker", position: [-91, -84], patrol: [[-91, -84], [-98, -88], [-94, -96], [-86, -91]], respawnTimer: 0 },
      { type: "mudCrawler", position: [-113, -88], patrol: [[-113, -88], [-119, -91], [-116, -99], [-108, -96]], respawnTimer: 0 },
      { type: "mireBat", position: [-119, -74], patrol: [[-119, -74], [-125, -78], [-121, -84], [-113, -80]], respawnTimer: 0 },
      { type: "swampHornbeast", position: [-92, -62], patrol: [[-92, -62], [-101, -64], [-104, -56], [-95, -53]], respawnTimer: 0 },
      { type: "canyonStrider", position: [-12, 118], patrol: [[-12, 118], [-19, 114], [-15, 126], [-7, 123]], respawnTimer: 0 },
      { type: "rockbackRam", position: [18, 126], patrol: [[18, 126], [25, 132], [19, 139], [12, 133]], respawnTimer: 0 },
      { type: "dustRaptor", position: [-28, 132], patrol: [[-28, 132], [-34, 137], [-29, 144], [-21, 139]], respawnTimer: 0 },
      { type: "sandViper", position: [6, 146], patrol: [[6, 146], [13, 148], [9, 154], [0, 151]], respawnTimer: 0 },
      { type: "ashHound", position: [-125, 136], patrol: [[-125, 136], [-132, 132], [-128, 144], [-118, 142]], respawnTimer: 0 },
      { type: "emberDrake", position: [-101, 150], patrol: [[-101, 150], [-108, 156], [-96, 160], [-92, 150]], respawnTimer: 0 },
      { type: "magmaCrawler", position: [-153, 124], patrol: [[-153, 124], [-160, 127], [-155, 134], [-146, 130]], respawnTimer: 0 },
      { type: "firehornBeast", position: [-140, 108], patrol: [[-140, 108], [-148, 112], [-139, 119], [-130, 113]], respawnTimer: 0 },
      { type: "astralStag", position: [126, 46], patrol: [[126, 46], [132, 50], [128, 58], [119, 54]], respawnTimer: 0 },
      { type: "crystalWyrm", position: [145, 35], patrol: [[145, 35], [153, 38], [150, 47], [140, 43]], respawnTimer: 0 },
      { type: "starboundHunter", position: [157, 53], patrol: [[157, 53], [164, 57], [159, 65], [151, 61]], respawnTimer: 0 },
      { type: "celestialWisp", position: [137, 68], patrol: [[137, 68], [144, 72], [139, 78], [130, 73]], respawnTimer: 0 },
      { type: "moonclawBeast", position: [165, 34], patrol: [[165, 34], [171, 39], [166, 47], [158, 42]], respawnTimer: 0 },
      { type: "wolf", position: [-44, 72], patrol: [[-44, 72], [-49, 76], [-54, 71], [-48, 66]], territoryRadius: 15, respawnTimer: 0 },
      { type: "crawler", position: [-108, 51], patrol: [[-108, 51], [-114, 55], [-110, 61], [-102, 57]], territoryRadius: 16, respawnTimer: 0 },
      { type: "dustRaptor", position: [-58, 70], patrol: [[-58, 70], [-53, 76], [-62, 80], [-67, 73]], territoryRadius: 17, respawnTimer: 0 },
      { type: "plainsStag", position: [130, -160], patrol: [[130, -160], [139, -166], [148, -158], [138, -151]], respawnTimer: 0 },
      { type: "riverfang", position: [160, -137], patrol: [[160, -137], [168, -133], [164, -126], [154, -130]], respawnTimer: 0 },
      { type: "skyHawk", position: [108, -116], patrol: [[108, -116], [118, -120], [114, -130], [104, -126]], territoryRadius: 18, respawnTimer: 0 },
      { type: "frontierWolf", position: [145, -118], patrol: [[145, -118], [153, -121], [151, -130], [140, -128]], respawnTimer: 0 },
      { type: "stonehideGrazer", position: [151, -154], patrol: [[151, -154], [160, -160], [168, -152], [158, -144]], respawnTimer: 0 },
      { type: "kingdomSentinel", position: [91, -146], patrol: [[91, -146], [97, -139], [88, -135], [82, -145]], respawnTimer: 0 },
      { type: "ruinStalker", position: [67, -160], patrol: [[67, -160], [74, -166], [80, -158], [72, -151]], respawnTimer: 0 },
      { type: "archiveWisp", position: [60, -140], patrol: [[60, -140], [66, -145], [61, -152], [54, -147]], respawnTimer: 0 },
      { type: "stoneGuardian", position: [103, -158], patrol: [[103, -158], [108, -164], [99, -169], [95, -160]], respawnTimer: 0 },
      { type: "skyWyrm", position: [64, 166], patrol: [[64, 166], [72, 172], [79, 164], [70, 158]], respawnTimer: 0 },
      { type: "astralHunter", position: [89, 160], patrol: [[89, 160], [98, 165], [94, 174], [84, 170]], respawnTimer: 0 },
      { type: "crystalDrake", position: [99, 144], patrol: [[99, 144], [107, 148], [103, 156], [94, 152]], respawnTimer: 0 },
      { type: "celestialWatcher", position: [75, 136], patrol: [[75, 136], [82, 141], [77, 148], [68, 143]], respawnTimer: 0 },
      { type: "reefStalker", position: [-151, -137], patrol: [[-151, -137], [-158, -134], [-155, -127], [-145, -131]], respawnTimer: 0 },
      { type: "tideDrake", position: [-144, -170], patrol: [[-144, -170], [-152, -174], [-161, -167], [-150, -160]], respawnTimer: 0 },
      { type: "cliffTalon", position: [-170, -128], patrol: [[-170, -128], [-176, -134], [-171, -142], [-162, -137]], respawnTimer: 0 },
      { type: "saltbackBeast", position: [-166, -156], patrol: [[-166, -156], [-174, -162], [-166, -170], [-157, -163]], respawnTimer: 0 },
      { type: "deepwaterWisp", position: [-136, -154], patrol: [[-136, -154], [-144, -158], [-138, -165], [-130, -160]], respawnTimer: 0 },
      { type: "rootStalker", position: [-54, -151], patrol: [[-54, -151], [-61, -157], [-55, -165], [-47, -158]], respawnTimer: 0 },
      { type: "wildhorn", position: [-24, -140], patrol: [[-24, -140], [-16, -146], [-18, -135], [-30, -132]], respawnTimer: 0 },
      { type: "mossDrake", position: [-64, -130], patrol: [[-64, -130], [-70, -136], [-62, -143], [-55, -134]], respawnTimer: 0 },
      { type: "groveGuardian", position: [-45, -122], patrol: [[-45, -122], [-53, -126], [-48, -134], [-38, -130]], respawnTimer: 0 },
      { type: "mistFox", position: [-72, -154], patrol: [[-72, -154], [-77, -160], [-69, -166], [-64, -157]], respawnTimer: 0 },
    ];
    this.prepareTerritories();
    this.enemies = this.slots.map((slot) => (this.world.performanceMode || this.isSlotInSafeZone(slot) ? null : this.spawnEnemy(slot)));
    this.healthBars = new Map();
    this.defeatListeners = [];
  }

  spawnEnemy(slot) {
    return new Enemy(slot.type, this.scene, this.world, slot.position, slot.patrol, this.feedback, {
      territory: slot.territory,
    });
  }

  prepareTerritories() {
    this.slots.forEach((slot, index) => {
      const points = [slot.position, ...(slot.patrol ?? [])];
      const center = points.reduce((sum, point) => {
        sum[0] += point[0];
        sum[1] += point[1];
        return sum;
      }, [0, 0]).map((value) => value / Math.max(1, points.length));
      const configRadius = SETTINGS.enemies[slot.type]?.leashRadius ?? 16;
      slot.territory = {
        id: slot.territoryId ?? `${slot.type}-${index}`,
        center,
        radius: slot.territoryRadius ?? Math.max(configRadius, this.getPatrolRadius(slot, center) + 7),
        resetHealthOnReturn: slot.resetHealthOnReturn ?? true,
      };
    });
  }

  getPatrolRadius(slot, center) {
    return [slot.position, ...(slot.patrol ?? [])].reduce((max, point) => {
      const dx = point[0] - center[0];
      const dz = point[1] - center[1];
      return Math.max(max, Math.hypot(dx, dz));
    }, 0);
  }

  onEnemyDefeated(callback) {
    this.defeatListeners.push(callback);
  }

  update(deltaSeconds, player, camera) {
    this.updateGroupBehavior(player);
    this.enemies.forEach((enemy, index) => {
      if (!enemy) {
        if (!this.isSlotInSafeZone(this.slots[index]) && this.isSlotNearPlayer(this.slots[index], player, this.world.performanceMode ? 58 : 96)) {
          this.enemies[index] = this.spawnEnemy(this.slots[index]);
        }
        return;
      }
      if (this.world.isSafeZone?.(player.group.position) || this.world.isSafeZone?.(enemy.group.position)) {
        enemy.forceReturnHome?.({ resetHealth: true });
        this.hideHealthBar(enemy);
      }
      if (!this.shouldUpdateEnemy(enemy, player)) {
        this.hideHealthBar(enemy);
        return;
      }
      enemy.update(deltaSeconds, player);
      if (enemy.removed) {
        const slot = this.slots[index];
        slot.respawnTimer -= deltaSeconds;
        if (slot.respawnTimer <= 0) {
          this.hideHealthBar(enemy);
          this.enemies[index] = this.spawnEnemy(slot);
        }
      }
    });
    this.updateHealthBars(camera);
  }

  updateGroupBehavior(player) {
    const activeEnemies = this.enemies.filter((enemy) => enemy?.active && !enemy.removed);
    activeEnemies.forEach((enemy) => {
      enemy.groupPressure?.set?.(0, 0, 0);
    });

    for (let index = 0; index < activeEnemies.length; index += 1) {
      const enemy = activeEnemies[index];
      for (let otherIndex = index + 1; otherIndex < activeEnemies.length; otherIndex += 1) {
        const other = activeEnemies[otherIndex];
        if (enemy.territory?.id !== other.territory?.id && enemy.group.position.distanceTo(other.group.position) > 7.5) {
          continue;
        }
        const offset = enemy.group.position.clone().sub(other.group.position);
        offset.y = 0;
        const distance = offset.length();
        if (distance <= 0.001 || distance > 5.4) {
          continue;
        }
        const pressure = offset.normalize().multiplyScalar((5.4 - distance) / 5.4);
        enemy.groupPressure?.add?.(pressure);
        other.groupPressure?.add?.(pressure.clone().multiplyScalar(-1));
      }
    }

    activeEnemies.forEach((enemy) => {
      if (!enemy.aggroed || enemy.alertTimer <= 0) {
        return;
      }
      let allyIndex = 0;
      activeEnemies.forEach((ally) => {
        if (ally === enemy || ally.aggroed || ally.territory?.id !== enemy.territory?.id) {
          return;
        }
        const distance = ally.group.position.distanceTo(enemy.group.position);
        if (distance <= 10.5 && ally.isPointInTerritory?.(player.group.position, 1)) {
          ally.awareness = Math.max(ally.awareness ?? 0, 0.64);
          ally.alertTimer = Math.max(ally.alertTimer ?? 0, 1.8);
          ally.sharedAlertTimer = Math.max(ally.sharedAlertTimer ?? 0, 2.2);
          ally.lastKnownPlayerPosition?.copy?.(player.group.position);
          if (ally.tacticTimer <= 0.15) {
            ally.setTactic?.(allyIndex % 2 === 0 ? "flank" : "circle");
            ally.tacticTimer = 0.55 + allyIndex * 0.18;
          }
          allyIndex += 1;
        }
      });
    });
  }

  forceReturnAll(options = {}) {
    this.enemies.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }
      enemy.forceReturnHome?.(options);
      this.hideHealthBar(enemy);
    });
  }

  isSlotNearPlayer(slot, player, radius) {
    const dx = slot.position[0] - player.group.position.x;
    const dz = slot.position[1] - player.group.position.z;
    return dx * dx + dz * dz <= radius * radius;
  }

  isSlotInSafeZone(slot) {
    return Boolean(this.world.isSafeZone?.({ x: slot.position[0], z: slot.position[1] }));
  }

  shouldUpdateEnemy(enemy, player) {
    if (!enemy?.group || enemy.hitReactTimer > 0 || enemy.state !== "patrol") {
      return true;
    }
    const distance = enemy.group.position.distanceTo(player.group.position);
    return distance <= (this.world.performanceMode ? 52 : 86);
  }

  handleArrowHit(arrow) {
    const enemy = arrow.hitObjectRef?.userData.enemy;
    if (!enemy || !enemy.active) {
      return;
    }

    const hitDirection = arrow.velocity.clone().normalize();
    const shotPower = arrow.shotPower ?? 0.5;
    const damage = SETTINGS.enemies.arrowDamage * (arrow.damageMultiplier ?? 1);
    const defeated = enemy.takeDamage(damage, hitDirection, shotPower);
    this.alertNearbyEnemies(enemy, arrow.hitPoint ?? enemy.group.position);
    enemy.applyArrowEffect?.(arrow.arrowType, shotPower);
    enemy.hitReactTimer = Math.max(enemy.hitReactTimer ?? 0, (arrow.critical ? 0.68 : 0.42) + shotPower * 0.42);
    enemy.attackPoseTimer = 0;
    this.ensureHealthBar(enemy);
    this.pulseHealthBar(enemy, defeated || arrow.critical || shotPower > 0.72);
    const impactStrength = defeated ? 2.55 : 1.24 + shotPower * 0.98 + (arrow.critical ? 0.55 : 0);
    this.feedback?.spawnImpact(arrow.hitPoint ?? enemy.group.position, defeated ? 0xe6b75d : (shotPower > 0.72 ? 0xffb15f : 0xcf7c4e), impactStrength);
    this.feedback?.shake(defeated ? 0.26 : 0.052 + shotPower * 0.078 + (arrow.critical ? 0.05 : 0));
    if (!defeated && (shotPower > 0.82 || arrow.critical)) {
      this.feedback?.playSound(arrow.critical ? "weakpointHit" : "powerfulHit", 0.32 + shotPower * 0.38);
    }
    const damageText = arrow.critical ? `CRIT ${Math.round(damage)}` : `${Math.round(damage)}`;
    this.showCombatText(enemy, defeated ? "DEFEATED" : damageText, defeated ? "xp" : (shotPower > 0.72 || arrow.critical ? "damage strong" : "damage"));
    if (!defeated && shotPower > 0.84) {
      this.showCombatText(enemy, "STAGGER", "damage strong");
    }
    if (arrow.arrowType?.id === "ice") {
      this.showCombatText(enemy, "SLOWED", "damage");
    } else if (arrow.arrowType?.id === "fire") {
      this.showCombatText(enemy, "BURNING", "damage strong");
    }
    if (defeated) {
      const slot = this.slots[this.enemies.indexOf(enemy)];
      if (slot) slot.respawnTimer = 5.5;
      this.feedback?.spawnImpact(enemy.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xffd27a, 2.2);
      this.feedback?.playSound("enemyDefeat", 1.08);
      this.defeatListeners.forEach((callback) => callback({ enemy, type: enemy.type }));
    }
  }

  alertNearbyEnemies(sourceEnemy, point) {
    this.enemies.forEach((enemy) => {
      if (!enemy?.active || enemy === sourceEnemy || enemy.territory?.id !== sourceEnemy.territory?.id) {
        return;
      }
      const distance = enemy.group.position.distanceTo(point);
      if (distance > 9) {
        return;
      }
      enemy.awareness = Math.max(enemy.awareness ?? 0, 0.9);
      enemy.alertTimer = Math.max(enemy.alertTimer ?? 0, 2.5);
      enemy.sharedAlertTimer = Math.max(enemy.sharedAlertTimer ?? 0, 2.4);
      enemy.lastKnownPlayerPosition?.copy?.(point);
      if ((enemy.tacticTimer ?? 0) <= 0.2) {
        enemy.setTactic?.(distance < 4.5 ? "circle" : "flank");
        enemy.tacticTimer = 0.55;
      }
    });
  }

  handleAreaArrowEffect(arrow) {
    if (arrow.arrowType?.id !== "explosive" || !arrow.hitPoint) {
      return;
    }

    const radius = arrow.arrowType.radius ?? 4;
    this.enemies.forEach((enemy) => {
      if (!enemy) {
        return;
      }
      if (!enemy.active) {
        return;
      }
      const distance = enemy.group.position.distanceTo(arrow.hitPoint);
      if (distance > radius) {
        return;
      }
      const falloff = 1 - distance / radius;
      const direction = enemy.group.position.clone().sub(arrow.hitPoint).normalize();
      const damage = SETTINGS.enemies.arrowDamage * 0.72 * falloff * (arrow.damageMultiplier ?? 1);
      const defeated = enemy.takeDamage(damage, direction, arrow.shotPower ?? 0.7);
      this.ensureHealthBar(enemy);
      this.pulseHealthBar(enemy, true);
      enemy.hitReactTimer = Math.max(enemy.hitReactTimer ?? 0, 0.34 + falloff * 0.26);
      this.feedback?.spawnImpact(enemy.group.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xffcf5f, 1.25 + falloff * 0.85);
      this.feedback?.shake(0.05 + falloff * 0.08);
      this.showCombatText(enemy, defeated ? "DEFEATED" : `${Math.round(damage)}`, defeated ? "xp" : "damage strong");
      if (defeated) {
        const slot = this.slots[this.enemies.indexOf(enemy)];
        if (slot) slot.respawnTimer = 5.5;
        this.feedback?.playSound("enemyDefeat", 0.92);
        this.defeatListeners.forEach((callback) => callback({ enemy, type: enemy.type }));
      }
    });
  }

  showCombatText(enemy, text, kind) {
    if (!this.lastCamera) {
      return;
    }

    const position = enemy.getHealthBarPosition().project(this.lastCamera);
    if (position.z < -1 || position.z > 1) {
      return;
    }

    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text,
        kind,
        x: (position.x * 0.5 + 0.5) * window.innerWidth,
        y: (-position.y * 0.5 + 0.5) * window.innerHeight,
      },
    }));
  }

  updateHealthBars(camera) {
    this.lastCamera = camera;
    this.enemies.forEach((enemy) => {
      if (!enemy) {
        return;
      }
      const visible = enemy.active && this.shouldShowHealth(enemy, camera);
      const existingBar = this.healthBars.get(enemy);
      if (!visible && !existingBar) {
        return;
      }
      const bar = existingBar ?? this.ensureHealthBar(enemy);
      bar.classList.toggle("visible", visible);

      if (!visible) {
        return;
      }

      const projected = enemy.getHealthBarPosition().project(camera);
      bar.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
      bar.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
      bar.style.setProperty("--health", enemy.getHealthRatio().toFixed(3));
    });
  }

  shouldShowHealth(enemy, camera) {
    const cameraDirection = new THREE.Vector3();
    const toEnemy = enemy.getHealthBarPosition().sub(camera.position);
    const distance = toEnemy.length();
    if (distance > SETTINGS.enemies.healthBarDistance) {
      return false;
    }

    camera.getWorldDirection(cameraDirection);
    const aimDot = cameraDirection.dot(toEnemy.normalize());
    return aimDot > SETTINGS.enemies.healthBarAimDot || enemy.hitReactTimer > 0;
  }

  ensureHealthBar(enemy) {
    if (this.healthBars.has(enemy)) {
      return this.healthBars.get(enemy);
    }

    const bar = document.createElement("span");
    bar.className = "enemy-health";
    const fill = document.createElement("span");
    fill.className = "enemy-health-fill";
    bar.appendChild(fill);
    this.ui.bars.appendChild(bar);
    this.healthBars.set(enemy, bar);
    return bar;
  }

  pulseHealthBar(enemy, strong = false) {
    const bar = this.ensureHealthBar(enemy);
    bar.classList.toggle("strong-hit", strong);
    bar.classList.remove("hit");
    void bar.offsetWidth;
    bar.classList.add("hit");
  }

  hideHealthBar(enemy) {
    const bar = this.healthBars.get(enemy);
    if (bar) {
      bar.classList.remove("visible");
    }
  }
}
