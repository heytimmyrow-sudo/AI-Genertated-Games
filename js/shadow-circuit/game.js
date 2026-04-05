(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});
  const { CONFIG, utils, Player, Projectile, World, EffectsSystem } = ShadowCircuit;

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width;
      this.height = canvas.height;
      this.input = new ShadowCircuit.InputHandler();
      this.lastTime = 0;
      this.resetAll();
    }

    resetAll() {
      this.world = new World();
      this.player = new Player(this.world.playerSpawn);
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.effects = new EffectsSystem();
      this.camera = { x: this.player.x, y: this.player.y };
      this.screen = "title";
      this.score = 0;
      this.coresCollected = 0;
      this.checkpoint = { ...this.world.playerSpawn };
      this.checkpointLabel = "Cold Boot";
      this.message = "Collect cores to unlock sealed sectors.";
    }

    restartRun() {
      this.resetAll();
      this.screen = "playing";
    }

    damagePlayer(amount) {
      if (this.player.invincible > 0 || this.player.shield > 0) {
        return;
      }

      this.player.health -= amount;
      this.player.invincible = 0.9;
      this.effects.burst(this.player.x, this.player.y, "#ff7c96", 14, 180);
      this.effects.addShake(CONFIG.effects.shakeDamage);

      if (this.player.health <= 0) {
        this.player.lives -= 1;
        if (this.player.lives <= 0) {
          this.screen = "gameover";
          this.message = "The maze reset you. Boot again.";
        } else {
          this.player.resetToSpawn(this.checkpoint);
          this.message = "Life lost. Respawning at " + this.checkpointLabel + ".";
        }
      }
    }

    firePlayerBlast() {
      if (this.player.blastCooldown > 0 || this.screen !== "playing") return;
      const direction = utils.normalize(this.player.facingX, this.player.facingY);
      this.projectiles.push(new Projectile(
        this.player.x + direction.x * 18,
        this.player.y + direction.y * 18,
        direction.x * CONFIG.player.blastSpeed,
        direction.y * CONFIG.player.blastSpeed,
        "#82f6ff",
        CONFIG.player.blastDamage,
        "player",
        6
      ));
      this.player.blastCooldown = CONFIG.player.blastCooldown;
      this.effects.burst(this.player.x, this.player.y, "#7be9ff", 8, 120);
    }

    fireEnemyBlast(enemy, targetX, targetY) {
      const direction = utils.normalize(targetX - enemy.x, targetY - enemy.y);
      this.enemyProjectiles.push(new Projectile(
        enemy.x,
        enemy.y,
        direction.x * 260,
        direction.y * 260,
        "#ffcd66",
        1,
        "enemy",
        7
      ));
    }

    movePlayer(dt) {
      const movement = this.input.getMoveVector();
      const normalized = movement.x || movement.y ? utils.normalize(movement.x, movement.y) : { x: 0, y: 0 };

      if (normalized.x || normalized.y) {
        this.player.facingX = normalized.x;
        this.player.facingY = normalized.y;
      }

      if (this.input.pressed("shift") && this.player.dashCooldown <= 0 && (normalized.x || normalized.y)) {
        this.player.dashTimer = CONFIG.player.dashTime;
        this.player.dashCooldown = CONFIG.player.dashCooldown;
      }

      const speedMultiplier = this.player.speedBoost > 0 ? 1.35 : 1;
      const speed = this.player.dashTimer > 0 ? CONFIG.player.dashSpeed : CONFIG.player.speed * speedMultiplier;
      this.player.x += normalized.x * speed * dt;
      this.player.y += normalized.y * speed * dt;
      this.player.x = utils.clamp(this.player.x, this.player.radius, this.world.width - this.player.radius);
      this.player.y = utils.clamp(this.player.y, this.player.radius, this.world.height - this.player.radius);

      const colliders = this.world.getColliders(this.coresCollected);
      for (const collider of colliders) {
        utils.pushCircleOutOfRect(this.player, collider);
      }
    }

    updateEnemies(dt) {
      for (let i = this.world.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.world.enemies[i];
        const distanceToPlayer = utils.distance(enemy.x, enemy.y, this.player.x, this.player.y);
        let moveX = 0;
        let moveY = 0;

        if (enemy.type === "patrol" && enemy.path && enemy.path.length > 1) {
          const target = enemy.path[enemy.pathIndex];
          const toPoint = utils.normalize(target.x - enemy.x, target.y - enemy.y);
          moveX = toPoint.x;
          moveY = toPoint.y;
          if (utils.distance(enemy.x, enemy.y, target.x, target.y) < 10) {
            enemy.pathIndex = (enemy.pathIndex + 1) % enemy.path.length;
          }
          if (distanceToPlayer < enemy.aggroRange) {
            const chase = utils.normalize(this.player.x - enemy.x, this.player.y - enemy.y);
            moveX = chase.x;
            moveY = chase.y;
          }
        } else if (enemy.type === "chaser" && distanceToPlayer < enemy.aggroRange) {
          const chase = utils.normalize(this.player.x - enemy.x, this.player.y - enemy.y);
          moveX = chase.x;
          moveY = chase.y;
        } else if (enemy.type === "turret") {
          enemy.fireTimer -= dt;
          if (distanceToPlayer < enemy.aggroRange && enemy.fireTimer <= 0) {
            this.fireEnemyBlast(enemy, this.player.x, this.player.y);
            enemy.fireTimer = CONFIG.enemyTypes.turret.fireCooldown;
          }
        }

        enemy.x += moveX * enemy.speed * dt;
        enemy.y += moveY * enemy.speed * dt;
        enemy.x = utils.clamp(enemy.x, enemy.radius, this.world.width - enemy.radius);
        enemy.y = utils.clamp(enemy.y, enemy.radius, this.world.height - enemy.radius);

        for (const collider of this.world.getColliders(this.coresCollected)) {
          utils.pushCircleOutOfRect(enemy, collider);
        }

        if (utils.distance(enemy.x, enemy.y, this.player.x, this.player.y) < enemy.radius + this.player.radius) {
          this.damagePlayer(enemy.contactDamage);
        }
      }
    }

    updateProjectiles(dt, list, targetType) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const projectile = list[i];
        projectile.life -= dt;
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;

        if (projectile.life <= 0) {
          list.splice(i, 1);
          continue;
        }

        const hitWall = this.world.getColliders(this.coresCollected)
          .some((collider) => utils.overlapsCircleRect(projectile.x, projectile.y, projectile.radius, collider));
        if (hitWall) {
          this.effects.burst(projectile.x, projectile.y, projectile.color, 5, 80);
          list.splice(i, 1);
          continue;
        }

        if (targetType === "enemies") {
          let hit = false;
          for (let enemyIndex = this.world.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
            const enemy = this.world.enemies[enemyIndex];
            if (utils.distance(projectile.x, projectile.y, enemy.x, enemy.y) < projectile.radius + enemy.radius) {
              enemy.health -= projectile.damage;
              this.effects.burst(enemy.x, enemy.y, "#7cecff", 10, 140);
              this.effects.text(enemy.x, enemy.y - 20, "-1", "#d8fbff");
              if (enemy.health <= 0) {
                this.score += enemy.score;
                this.effects.burst(enemy.x, enemy.y, enemy.color, 18, 180);
                this.effects.addShake(CONFIG.effects.shakeKill);
                this.world.enemies.splice(enemyIndex, 1);
              }
              list.splice(i, 1);
              hit = true;
              break;
            }
          }
          if (hit) continue;
        } else if (utils.distance(projectile.x, projectile.y, this.player.x, this.player.y) < projectile.radius + this.player.radius) {
          this.damagePlayer(projectile.damage);
          list.splice(i, 1);
        }
      }
    }

    updateWorldInteractions() {
      // World interactions stay data-driven so more pickups, terminals, and gates can be added from map data.
      for (const hazard of this.world.hazards) {
        if (utils.overlapsCircleRect(this.player.x, this.player.y, this.player.radius, hazard)) {
          this.damagePlayer(1);
          break;
        }
      }

      for (const core of this.world.cores) {
        if (!core.collected && utils.distance(this.player.x, this.player.y, core.x, core.y) < this.player.radius + 12) {
          core.collected = true;
          this.coresCollected += 1;
          this.score += 120;
          this.message = "Energy core secured. Gates are reacting.";
          this.effects.burst(core.x, core.y, "#8cffce", 16, 140);
          this.effects.addShake(CONFIG.effects.shakeCore);
        }
      }

      for (const pickup of this.world.pickups) {
        if (!pickup.taken && utils.distance(this.player.x, this.player.y, pickup.x, pickup.y) < this.player.radius + 12) {
          pickup.taken = true;
          if (pickup.type === "shield") {
            this.player.shield = CONFIG.pickups.shield.duration;
            this.message = "Shield matrix online.";
          } else if (pickup.type === "speed") {
            this.player.speedBoost = CONFIG.pickups.speed.duration;
            this.message = "Speed burst loaded.";
          }
          this.effects.burst(pickup.x, pickup.y, "#ffe27f", 16, 150);
        }
      }

      for (const checkpoint of this.world.checkpoints) {
        if (utils.distance(this.player.x, this.player.y, checkpoint.x, checkpoint.y) < this.player.radius + 18) {
          checkpoint.active = true;
          this.checkpoint = { x: checkpoint.x, y: checkpoint.y };
          this.checkpointLabel = this.world.getZoneName(checkpoint.x, checkpoint.y);
        }
      }

      for (const terminal of this.world.terminals) {
        if (utils.distance(this.player.x, this.player.y, terminal.x, terminal.y) < this.player.radius + 28) {
          this.message = terminal.text;
        }
      }

      if (utils.pointInRect(this.player.x, this.player.y, this.world.finalExit) && this.coresCollected >= CONFIG.progression.finalExitCores) {
        this.screen = "win";
        this.message = "Exit breached.";
      } else if (utils.pointInRect(this.player.x, this.player.y, this.world.finalExit)) {
        this.message = "Final port requires " + CONFIG.progression.finalExitCores + " cores.";
      }

      for (const gate of this.world.gates) {
        if (!gate.open && this.coresCollected >= gate.requiredCores) {
          gate.open = true;
          this.message = "Gate unlocked: " + gate.requiredCores + "-core seal broken.";
        }
      }
    }

    updateCamera(dt) {
      this.camera.x = utils.lerp(this.camera.x, this.player.x, dt * 4);
      this.camera.y = utils.lerp(this.camera.y, this.player.y, dt * 4);
    }

    updateTimers(dt) {
      this.player.invincible = Math.max(0, this.player.invincible - dt);
      this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
      this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
      this.player.blastCooldown = Math.max(0, this.player.blastCooldown - dt);
      this.player.shield = Math.max(0, this.player.shield - dt);
      this.player.speedBoost = Math.max(0, this.player.speedBoost - dt);
    }

    update(dt) {
      if (this.input.pressed("escape")) {
        returnToMenu();
        return;
      }

      if (this.input.pressed("p")) {
        if (this.screen === "playing") this.screen = "paused";
        else if (this.screen === "paused") this.screen = "playing";
      }

      if (this.screen === "title") {
        if (this.input.pressed("enter")) this.restartRun();
        return;
      }

      if (this.screen === "paused") return;

      if (this.screen === "gameover" || this.screen === "win") {
        if (this.input.pressed("enter")) this.restartRun();
        return;
      }

      if (this.input.pressed(" ")) {
        this.firePlayerBlast();
      }

      this.updateTimers(dt);
      this.movePlayer(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt, this.projectiles, "enemies");
      this.updateProjectiles(dt, this.enemyProjectiles, "player");
      this.updateWorldInteractions();
      this.effects.update(dt);
      this.updateCamera(dt);
    }

    drawWorld() {
      const ctx = this.ctx;
      const shakeX = (Math.random() - 0.5) * this.effects.shake;
      const shakeY = (Math.random() - 0.5) * this.effects.shake;
      const cameraX = utils.clamp(this.camera.x - this.width / 2, 0, this.world.width - this.width);
      const cameraY = utils.clamp(this.camera.y - this.height / 2, 0, this.world.height - this.height);

      ctx.save();
      ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

      const bg = ctx.createLinearGradient(0, 0, 0, this.world.height);
      bg.addColorStop(0, "#081624");
      bg.addColorStop(1, "#04070e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.world.width, this.world.height);

      ctx.strokeStyle = "rgba(105, 248, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < this.world.width; x += CONFIG.tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.world.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.world.height; y += CONFIG.tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.world.width, y);
        ctx.stroke();
      }

      for (const zone of this.world.zones) {
        ctx.fillStyle = "rgba(31, 94, 138, 0.08)";
        ctx.fillRect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
      }

      ctx.fillStyle = "rgba(255, 82, 130, 0.14)";
      for (const hazard of this.world.hazards) {
        ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
      }

      ctx.fillStyle = "rgba(65, 90, 122, 0.82)";
      for (const wall of this.world.walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      }

      for (const gate of this.world.gates) {
        if (!gate.open && this.coresCollected < gate.requiredCores) {
          ctx.fillStyle = "rgba(255, 107, 157, 0.74)";
          ctx.fillRect(gate.rect.x, gate.rect.y, gate.rect.w, gate.rect.h);
          ctx.fillStyle = "#ffeef2";
          ctx.font = "bold 14px Trebuchet MS";
          ctx.fillText(String(gate.requiredCores), gate.rect.x + 12, gate.rect.y + 26);
        }
      }

      for (const checkpoint of this.world.checkpoints) {
        ctx.fillStyle = checkpoint.active ? "#7bffd4" : "#4c7fa3";
        ctx.beginPath();
        ctx.arc(checkpoint.x, checkpoint.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const terminal of this.world.terminals) {
        ctx.fillStyle = "#6fd8ff";
        ctx.fillRect(terminal.x - 10, terminal.y - 14, 20, 28);
      }

      for (const core of this.world.cores) {
        if (core.collected) continue;
        ctx.fillStyle = "#97ffd1";
        ctx.beginPath();
        ctx.arc(core.x, core.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const pickup of this.world.pickups) {
        if (pickup.taken) continue;
        ctx.fillStyle = pickup.type === "shield" ? "#ffd76f" : "#8ec4ff";
        ctx.fillRect(pickup.x - 9, pickup.y - 9, 18, 18);
      }

      for (const enemy of this.world.enemies) {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32 * (enemy.health / enemy.maxHealth), 4);
      }

      for (const projectile of this.projectiles.concat(this.enemyProjectiles)) {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const particle of this.effects.particles) {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      ctx.globalAlpha = 1;

      for (const floater of this.effects.floaters) {
        ctx.globalAlpha = floater.life / floater.maxLife;
        ctx.fillStyle = floater.color;
        ctx.font = "bold 14px Trebuchet MS";
        ctx.fillText(floater.label, floater.x, floater.y);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = this.player.shield > 0 ? "#c0fff3" : "#84f5ff";
      if (this.player.invincible > 0 && Math.sin(performance.now() * 0.03) > 0) {
        ctx.fillStyle = "#ffffff";
      }
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#dffcff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + this.player.facingX * 20, this.player.y + this.player.facingY * 20);
      ctx.stroke();

      ctx.strokeStyle = "rgba(140, 255, 199, 0.35)";
      ctx.strokeRect(this.world.finalExit.x, this.world.finalExit.y, this.world.finalExit.w, this.world.finalExit.h);

      ctx.restore();
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawWorld();
      ShadowCircuit.drawUI(this.ctx, this);
      ShadowCircuit.drawOverlay(this.ctx, this);
    }

    frame = (timestamp) => {
      const dt = Math.min(0.033, ((timestamp - this.lastTime) / 1000) || 0);
      this.lastTime = timestamp;
      this.update(dt);
      this.render();
      this.input.endFrame();
      requestAnimationFrame(this.frame);
    };
  }

  ShadowCircuit.Game = Game;
}());
