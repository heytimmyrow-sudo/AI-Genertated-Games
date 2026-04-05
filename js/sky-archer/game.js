(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});
  const { CONFIG, Arrow, Enemy, Effects, Input, World, WAVES } = SkyArcher;

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
      this.input = new Input(canvas);
      this.world = new World();
      this.effects = new Effects();
      this.lastTime = 0;
      this.maxTowerHealth = CONFIG.tower.health;
      this.maxArrowAmmo = CONFIG.arrows.maxAmmo;
      this.arrowTypeLabel = CONFIG.arrows.specialTypes.normal.label;
      this.resetRun();

      canvas.addEventListener("click", () => {
        if (this.screen === "title" || this.screen === "gameover" || this.screen === "win") {
          this.startRun();
        }
      });
    }

    resetRun() {
      this.screen = "title";
      this.score = 0;
      this.towerHealth = this.maxTowerHealth;
      this.towerHitCooldown = 0;
      this.arrowAmmo = this.maxArrowAmmo;
      this.arrowDraw = 0;
      this.wasDrawing = false;
      this.activeArrows = [];
      this.stuckArrows = [];
      this.enemies = [];
      this.waveIndex = 0;
      this.displayWave = 1;
      this.waveQueue = [];
      this.waveTimer = 0;
      this.waveLabel = "Wave 1";
      this.waveIntroTimer = 0;
      this.arrowType = "normal";
    }

    startRun() {
      this.resetRun();
      this.screen = "playing";
      this.loadWave(0);
    }

    loadWave(index) {
      this.waveIndex = index;
      this.displayWave = index + 1;
      this.waveQueue = WAVES[index].enemies.map((entry) => ({ ...entry, spawned: false }));
      this.waveTimer = 0;
      this.waveLabel = WAVES[index].label;
      this.waveIntroTimer = 1.6;
    }

    currentAim() {
      const dx = this.input.mouseX - CONFIG.bow.anchorX;
      const dy = this.input.mouseY - CONFIG.bow.anchorY;
      let angle = Math.atan2(dy, dx);
      angle = Math.max(CONFIG.bow.maxAngleUp, Math.min(CONFIG.bow.minAngleDown, angle));
      return angle;
    }

    bowState() {
      const angle = this.currentAim();
      const drawRatio = Math.min(1, this.arrowDraw / CONFIG.bow.drawTime);
      const handDistance = 16 + drawRatio * 18;
      return {
        angle: angle,
        drawRatio: drawRatio,
        handX: CONFIG.bow.anchorX + Math.cos(angle) * handDistance,
        handY: CONFIG.bow.anchorY + Math.sin(angle) * handDistance
      };
    }

    spawnEnemy(type, lane) {
      const point = this.world.spawnPoint(type, lane);
      const enemy = new Enemy(type, lane, point.x, point.y);
      enemy.towerX = point.towerX;
      this.enemies.push(enemy);
    }

    releaseArrow() {
      if (this.arrowAmmo < 1) return;
      const bow = this.bowState();
      const power = CONFIG.bow.minPower + (CONFIG.bow.maxPower - CONFIG.bow.minPower) * bow.drawRatio;
      this.arrowAmmo -= 1;
      this.activeArrows.push(new Arrow(bow.handX, bow.handY, bow.angle, power, this.arrowType));
      this.effects.burst(bow.handX, bow.handY, 7, "rgba(255, 241, 183, 0.8)", 90);
      this.arrowDraw = 0;
    }

    updateBow(dt) {
      if (this.input.mouseDown && this.screen === "playing") {
        this.arrowDraw = Math.min(CONFIG.bow.drawTime, this.arrowDraw + dt);
      } else if (this.wasDrawing && this.screen === "playing") {
        this.releaseArrow();
      } else {
        this.arrowDraw = 0;
      }

      this.wasDrawing = this.input.mouseDown;
      this.arrowAmmo = Math.min(this.maxArrowAmmo, this.arrowAmmo + CONFIG.arrows.refillRate * dt);
    }

    updateArrows(dt) {
      for (let i = this.activeArrows.length - 1; i >= 0; i -= 1) {
        const arrow = this.activeArrows[i];
        arrow.vy += CONFIG.gravity * dt;
        arrow.x += arrow.vx * dt;
        arrow.y += arrow.vy * dt;
        arrow.angle = Math.atan2(arrow.vy, arrow.vx);
        arrow.history.push({ x: arrow.x, y: arrow.y });
        if (arrow.history.length > 7) {
          arrow.history.shift();
        }

        let hitEnemy = false;
        for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
          const enemy = this.enemies[enemyIndex];
          if (Math.hypot(enemy.x - arrow.x, enemy.y - arrow.y) < enemy.radius + CONFIG.arrows.radius) {
            enemy.health -= arrow.damage;
            enemy.hitFlash = 0.16;
            this.effects.burst(arrow.x, arrow.y, 10, "rgba(255, 198, 128, 0.9)", 120);
            arrow.stuck = true;
            arrow.embedded = { enemy: enemy };
            this.stuckArrows.push(arrow);
            this.activeArrows.splice(i, 1);
            hitEnemy = true;

            if (enemy.health <= 0) {
              this.score += enemy.score;
              this.effects.burst(enemy.x, enemy.y, 18, enemy.type === "flyer" ? "rgba(163, 235, 255, 0.95)" : "rgba(255, 214, 140, 0.95)", 180);
              this.enemies.splice(enemyIndex, 1);
            }
            break;
          }
        }

        if (hitEnemy) continue;

        const groundY = this.world.groundY(arrow.x);
        if (arrow.y >= groundY || arrow.x > this.width + 80 || arrow.y > this.height + 80) {
          arrow.stuck = true;
          arrow.x = Math.min(arrow.x, this.width + 40);
          arrow.y = Math.min(groundY, this.height - 10);
          this.stuckArrows.push(arrow);
          this.activeArrows.splice(i, 1);
        }
      }

      for (let i = this.stuckArrows.length - 1; i >= 0; i -= 1) {
        const arrow = this.stuckArrows[i];
        arrow.stuckTimer -= dt;
        if (arrow.embedded && arrow.embedded.enemy) {
          arrow.x = arrow.embedded.enemy.x;
          arrow.y = arrow.embedded.enemy.y;
        }
        if (arrow.stuckTimer <= 0) {
          this.stuckArrows.splice(i, 1);
        }
      }
    }

    updateEnemies(dt) {
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.enemies[i];
        enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

        if (enemy.path === "air") {
          enemy.x -= enemy.speed * dt;
          enemy.y = enemy.baseY + Math.sin(performance.now() * 0.002 + enemy.phase) * 18;
        } else {
          enemy.x -= enemy.speed * dt;
        }

        if (enemy.x <= enemy.towerX && !enemy.reachedTower) {
          enemy.reachedTower = true;
          this.towerHitCooldown = CONFIG.tower.hitCooldown;
          this.towerHealth -= enemy.damage;
          this.effects.towerShake(10);
          this.effects.burst(enemy.x, enemy.y, 12, "rgba(255, 124, 124, 0.92)", 140);
          this.enemies.splice(i, 1);

          if (this.towerHealth <= 0) {
            this.screen = "gameover";
          }
        }
      }
    }

    updateWave(dt) {
      if (this.screen !== "playing") return;

      this.waveTimer += dt;
      this.waveIntroTimer = Math.max(0, this.waveIntroTimer - dt);

      for (const spawn of this.waveQueue) {
        if (!spawn.spawned && this.waveTimer >= spawn.delay) {
          spawn.spawned = true;
          this.spawnEnemy(spawn.type, spawn.lane);
        }
      }

      const waveDone = this.waveQueue.every((entry) => entry.spawned) && this.enemies.length === 0;
      if (waveDone) {
        if (this.waveIndex >= WAVES.length - 1) {
          this.screen = "win";
        } else {
          this.loadWave(this.waveIndex + 1);
        }
      }
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

      if (this.screen !== "playing") {
        this.input.endFrame();
        return;
      }

      this.world.update(dt, this.width);
      this.updateBow(dt);
      this.updateArrows(dt);
      this.updateEnemies(dt);
      this.updateWave(dt);
      this.effects.update(dt, CONFIG.gravity);
      this.towerHitCooldown = Math.max(0, this.towerHitCooldown - dt);
      this.input.endFrame();
    }

    drawBackground(ctx) {
      ctx.fillStyle = "#6bc4ff";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = "rgba(255,255,255,0.58)";
      for (const cloud of this.world.clouds) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.42, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.28, cloud.y + 6, cloud.size * 0.34, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.25, cloud.y + 10, cloud.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255, 236, 189, 0.82)";
      ctx.beginPath();
      ctx.arc(1060, 118, 56, 0, Math.PI * 2);
      ctx.fill();
    }

    drawWorld(ctx) {
      this.drawBackground(ctx);

      ctx.fillStyle = "#6f8d5e";
      ctx.fillRect(0, 610, 420, 120);
      ctx.fillStyle = "#5b744d";
      ctx.fillRect(420, 622, 860, 98);

      ctx.fillStyle = "#ceb78f";
      ctx.fillRect(305, 468, 765, 16);
      ctx.fillRect(330, 525, 802, 16);
      ctx.fillRect(355, 588, 842, 16);

      ctx.fillStyle = "#9ec070";
      ctx.beginPath();
      ctx.ellipse(210, 620, 210, 62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(980, 632, 320, 54, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#b7c8d8";
      ctx.fillRect(122, 250, 132, 360);
      ctx.fillStyle = "#ddd4bc";
      ctx.fillRect(108, 214, 164, 44);
      ctx.fillStyle = "#8fa2b7";
      ctx.fillRect(132, 172, 108, 64);
      ctx.fillStyle = "#f0e6ca";
      ctx.beginPath();
      ctx.moveTo(186, 120);
      ctx.lineTo(258, 202);
      ctx.lineTo(114, 202);
      ctx.closePath();
      ctx.fill();

      const bow = this.bowState();
      const bowAngle = bow.angle;
      const drawRatio = bow.drawRatio;
      const handX = bow.handX;
      const handY = bow.handY;

      ctx.fillStyle = "#6c4b2d";
      ctx.fillRect(208, 350, 44, 98);
      ctx.fillStyle = "#f7d2b3";
      ctx.beginPath();
      ctx.arc(232, 323, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a7a4d";
      ctx.fillRect(214, 394, 26, 74);

      ctx.strokeStyle = "#8b5c39";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(CONFIG.bow.anchorX - 12, CONFIG.bow.anchorY - 62);
      ctx.quadraticCurveTo(CONFIG.bow.anchorX + 18, CONFIG.bow.anchorY, CONFIG.bow.anchorX - 12, CONFIG.bow.anchorY + 62);
      ctx.stroke();

      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CONFIG.bow.anchorX - 8, CONFIG.bow.anchorY - 58);
      ctx.lineTo(handX, handY);
      ctx.lineTo(CONFIG.bow.anchorX - 8, CONFIG.bow.anchorY + 58);
      ctx.stroke();

      if (this.screen === "playing" && this.input.mouseDown) {
        ctx.strokeStyle = "rgba(255, 243, 181, 0.65)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(CONFIG.bow.anchorX, CONFIG.bow.anchorY);
        ctx.lineTo(CONFIG.bow.anchorX + Math.cos(bowAngle) * 90, CONFIG.bow.anchorY + Math.sin(bowAngle) * 90);
        ctx.stroke();

        const previewPower = CONFIG.bow.minPower + (CONFIG.bow.maxPower - CONFIG.bow.minPower) * drawRatio;
        let previewX = handX;
        let previewY = handY;
        let previewVX = Math.cos(bowAngle) * previewPower;
        let previewVY = Math.sin(bowAngle) * previewPower;
        ctx.fillStyle = "rgba(255, 248, 206, 0.72)";
        for (let step = 0; step < 18; step += 1) {
          previewX += previewVX * 0.05;
          previewY += previewVY * 0.05;
          previewVY += CONFIG.gravity * 0.05;
          ctx.beginPath();
          ctx.arc(previewX, previewY, Math.max(1.5, 4 - step * 0.16), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const arrow of this.stuckArrows.concat(this.activeArrows)) {
        this.drawArrow(ctx, arrow);
      }

      for (const enemy of this.enemies) {
        this.drawEnemy(ctx, enemy);
      }

      for (const particle of this.effects.particles) {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      ctx.globalAlpha = 1;
    }

    drawArrow(ctx, arrow) {
      if (arrow.history.length > 1 && !arrow.stuck) {
        ctx.strokeStyle = "rgba(255, 246, 198, 0.26)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrow.history[0].x, arrow.history[0].y);
        for (const point of arrow.history) {
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);
      ctx.fillStyle = "#6b472a";
      ctx.fillRect(-20, -2, 40, 4);
      ctx.fillStyle = "#d8e3ef";
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(14, -5);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffefc1";
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-26, -6);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawEnemy(ctx, enemy) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      if (enemy.hitFlash > 0) {
        ctx.globalAlpha = 0.55;
      }

      if (enemy.type === "flyer") {
        ctx.fillStyle = "#6f78d7";
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b9d7ff";
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-28, -12);
        ctx.lineTo(-18, 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(28, -12);
        ctx.lineTo(18, 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = enemy.type === "runner" ? "#b15e49" : "#6f5d96";
        ctx.fillRect(-14, -34, 28, 34);
        ctx.fillStyle = "#f5d7bc";
        ctx.beginPath();
        ctx.arc(0, -44, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(-18, -58, 36, 5);
      ctx.fillStyle = "#7bffb1";
      ctx.fillRect(-18, -58, 36 * (enemy.health / enemy.maxHealth), 5);
      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      const shakeX = (Math.random() - 0.5) * this.effects.shake;
      const shakeY = (Math.random() - 0.5) * this.effects.shake;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      this.drawWorld(ctx);
      SkyArcher.drawUI(ctx, this);
      SkyArcher.drawOverlay(ctx, this);
      ctx.restore();
    }

    frame = (timestamp) => {
      const dt = Math.min(0.033, ((timestamp - this.lastTime) / 1000) || 0);
      this.lastTime = timestamp;
      this.update(dt);
      this.render();
      requestAnimationFrame(this.frame);
    };
  }

  SkyArcher.Game = Game;
}());
