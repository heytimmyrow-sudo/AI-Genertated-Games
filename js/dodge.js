(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const PLAYER_SIZE = 44;
  const PLAYER_SPEED = 420;
  const BASE_FALL_SPEED = 170;
  const SPAWN_INTERVAL = 0.58;
  const POWERUP_INTERVAL = 6;
  const STAR_COUNT = 48;

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);

      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["arrowleft", "arrowright", "a", "d", "enter", "escape", "p", "r"].includes(key)) {
          event.preventDefault();
        }
      });

      window.addEventListener("keyup", (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });

      window.addEventListener("blur", () => {
        this.keys = Object.create(null);
        this.previous = Object.create(null);
      });
    }

    isDown() {
      return Array.from(arguments).some((key) => this.keys[key]);
    }

    wasPressed() {
      return Array.from(arguments).some((key) => this.keys[key] && !this.previous[key]);
    }

    endFrame() {
      this.previous = { ...this.keys };
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.size &&
      a.x + a.size > b.x &&
      a.y < b.y + b.size &&
      a.y + a.size > b.y
    );
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  function createStars() {
    return Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: randomRange(1, 3),
      speed: randomRange(20, 70),
      alpha: randomRange(0.2, 0.9)
    }));
  }

  function createState() {
    return {
      screen: "title",
      message: "Dodge everything except the yellow squares.",
      score: 0,
      bestScore: 0,
      level: 1,
      survivalTime: 0,
      spawnTimer: 0,
      powerupTimer: POWERUP_INTERVAL,
      flashTimer: 0,
      stars: createStars(),
      player: {
        x: WIDTH / 2 - PLAYER_SIZE / 2,
        y: HEIGHT - 86,
        size: PLAYER_SIZE,
        speed: PLAYER_SPEED,
        shieldTimer: 0,
        slowTimer: 0,
        glow: 0
      },
      hazards: [],
      particles: []
    };
  }

  const input = new InputHandler();
  let state = createState();
  let lastTime = 0;

  function resetGame() {
    const bestScore = Math.max(state.bestScore, Math.floor(state.score));
    state = createState();
    state.bestScore = bestScore;
  }

  function spawnHazard() {
    const size = randomRange(26, 58);
    const palette = Math.random() > 0.5
      ? { fill: "#ff4d6d", glow: "rgba(255, 77, 109, 0.55)" }
      : { fill: "#52d273", glow: "rgba(82, 210, 115, 0.48)" };

    state.hazards.push({
      type: "hazard",
      x: randomRange(18, WIDTH - size - 18),
      y: -size - randomRange(0, 140),
      size,
      speed: BASE_FALL_SPEED + state.level * 22 + randomRange(0, 120),
      drift: randomRange(-26, 26),
      wobble: randomRange(0, Math.PI * 2),
      rotation: randomRange(-0.03, 0.03),
      angle: 0,
      fill: palette.fill,
      glow: palette.glow
    });
  }

  function spawnPowerup() {
    const size = 28;
    state.hazards.push({
      type: "powerup",
      x: randomRange(20, WIDTH - size - 20),
      y: -size - 30,
      size,
      speed: BASE_FALL_SPEED * 0.82 + state.level * 12,
      drift: randomRange(-18, 18),
      wobble: randomRange(0, Math.PI * 2),
      rotation: randomRange(-0.04, 0.04),
      angle: 0,
      fill: "#ffe066",
      glow: "rgba(255, 224, 102, 0.62)"
    });
  }

  function emitBurst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        size: randomRange(3, 8),
        vx: randomRange(-140, 140),
        vy: randomRange(-150, 20),
        life: randomRange(0.35, 0.8),
        maxLife: 0,
        color
      });
      state.particles[state.particles.length - 1].maxLife = state.particles[state.particles.length - 1].life;
    }
  }

  function startRun() {
    const bestScore = state.bestScore;
    state = createState();
    state.bestScore = bestScore;
    state.screen = "playing";
    state.message = "Stay alive and grab yellow powerups.";
  }

  function triggerGameOver() {
    state.bestScore = Math.max(state.bestScore, Math.floor(state.score));
    state.screen = "gameover";
    state.message = "A square got you. Press R to try again.";
    state.flashTimer = 0.4;
    emitBurst(state.player.x + state.player.size / 2, state.player.y + state.player.size / 2, "#ff9db0", 22);
  }

  function collectPowerup(item) {
    state.score += 125;
    state.player.shieldTimer = 4;
    state.player.slowTimer = 2.5;
    state.message = "Powerup collected: shield on, hazards slowed.";
    state.flashTimer = 0.2;
    emitBurst(item.x + item.size / 2, item.y + item.size / 2, "#ffe066", 14);
  }

  function updateStars(dt) {
    for (const star of state.stars) {
      star.y += star.speed * dt;
      if (star.y > HEIGHT + star.radius) {
        star.y = -star.radius;
        star.x = Math.random() * WIDTH;
      }
    }
  }

  function updatePlayer(dt) {
    const move = (input.isDown("arrowright", "d") ? 1 : 0) - (input.isDown("arrowleft", "a") ? 1 : 0);
    state.player.x += move * state.player.speed * dt;
    state.player.x = clamp(state.player.x, 14, WIDTH - state.player.size - 14);
    state.player.shieldTimer = Math.max(0, state.player.shieldTimer - dt);
    state.player.slowTimer = Math.max(0, state.player.slowTimer - dt);
    state.player.glow += dt * 4;
  }

  function updateHazards(dt) {
    const slowFactor = state.player.slowTimer > 0 ? 0.58 : 1;

    for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
      const item = state.hazards[i];
      item.wobble += dt * 2.6;
      item.angle += item.rotation;
      item.y += item.speed * slowFactor * dt;
      item.x += Math.sin(item.wobble) * item.drift * dt;
      item.x = clamp(item.x, 8, WIDTH - item.size - 8);

      if (intersects(state.player, item)) {
        if (item.type === "powerup") {
          collectPowerup(item);
          state.hazards.splice(i, 1);
          continue;
        }

        if (state.player.shieldTimer > 0) {
          state.player.shieldTimer = 0;
          state.flashTimer = 0.18;
          state.message = "Shield broke, but you stayed in the run.";
          emitBurst(item.x + item.size / 2, item.y + item.size / 2, "#b794ff", 16);
          state.hazards.splice(i, 1);
          continue;
        }

        triggerGameOver();
        return;
      }

      if (item.y > HEIGHT + item.size + 20) {
        if (item.type === "hazard") {
          state.score += 15;
        }
        state.hazards.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function updateSpawning(dt) {
    state.spawnTimer -= dt;
    state.powerupTimer -= dt;

    const interval = Math.max(0.18, SPAWN_INTERVAL - state.level * 0.03);
    while (state.spawnTimer <= 0) {
      spawnHazard();
      if (Math.random() < Math.min(0.38, 0.12 + state.level * 0.025)) {
        spawnHazard();
      }
      state.spawnTimer += interval;
    }

    if (state.powerupTimer <= 0) {
      spawnPowerup();
      state.powerupTimer = Math.max(3.2, POWERUP_INTERVAL - state.level * 0.18);
    }
  }

  function updateLevel(dt) {
    state.survivalTime += dt;
    state.score += dt * 10;
    state.level = 1 + Math.floor(state.survivalTime / 10);
  }

  function update(dt) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
    updateStars(dt);
    updateParticles(dt);

    if (input.wasPressed("escape")) {
      returnToMenu();
      return;
    }

    if (input.wasPressed("p")) {
      if (state.screen === "playing") {
        state.screen = "paused";
        state.message = "Paused.";
      } else if (state.screen === "paused") {
        state.screen = "playing";
        state.message = "Back in the run.";
      }
    }

    if (state.screen === "title") {
      if (input.wasPressed("enter")) {
        startRun();
      }
      return;
    }

    if (state.screen === "gameover") {
      if (input.wasPressed("r", "enter")) {
        resetGame();
        state.screen = "playing";
        state.message = "New run started.";
      }
      return;
    }

    if (state.screen === "paused") {
      return;
    }

    updatePlayer(dt);
    updateLevel(dt);
    updateSpawning(dt);
    updateHazards(dt);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#15162f");
    sky.addColorStop(0.5, "#1a1f43");
    sky.addColorStop(1, "#0b0c18");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const floor = ctx.createLinearGradient(0, HEIGHT - 120, 0, HEIGHT);
    floor.addColorStop(0, "rgba(96, 67, 255, 0.08)");
    floor.addColorStop(1, "rgba(30, 20, 70, 0.78)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, HEIGHT - 120, WIDTH, 120);
  }

  function drawLaneGuides() {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.setLineDash([10, 14]);
    for (let x = 150; x < WIDTH; x += 150) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, HEIGHT - 36);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSquares() {
    for (const item of state.hazards) {
      ctx.save();
      ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
      ctx.rotate(item.angle);
      ctx.shadowColor = item.glow;
      ctx.shadowBlur = item.type === "powerup" ? 24 : 18;
      ctx.fillStyle = item.fill;
      ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
      if (item.type === "powerup") {
        ctx.strokeStyle = "rgba(255, 250, 205, 0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(-item.size / 2 + 3, -item.size / 2 + 3, item.size - 6, item.size - 6);
      }
      ctx.restore();
    }
  }

  function drawPlayer() {
    ctx.save();
    const pulse = Math.sin(state.player.glow) * 6;
    ctx.shadowColor = state.player.shieldTimer > 0 ? "#ffe066" : "#b56cff";
    ctx.shadowBlur = state.player.shieldTimer > 0 ? 30 : 18 + pulse;
    ctx.fillStyle = "#8b3dff";
    ctx.fillRect(state.player.x, state.player.y, state.player.size, state.player.size);

    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.fillRect(state.player.x + 8, state.player.y + 7, state.player.size - 18, 8);

    if (state.player.shieldTimer > 0) {
      ctx.strokeStyle = "rgba(255, 224, 102, 0.95)";
      ctx.lineWidth = 4;
      ctx.strokeRect(state.player.x - 8, state.player.y - 8, state.player.size + 16, state.player.size + 16);
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawHud() {
    ctx.save();
    ctx.fillStyle = "rgba(8, 10, 24, 0.72)";
    ctx.fillRect(18, 18, 320, 122);
    ctx.strokeStyle = "rgba(183, 148, 255, 0.34)";
    ctx.strokeRect(18, 18, 320, 122);

    ctx.fillStyle = "#f7f2ff";
    ctx.font = "bold 24px Trebuchet MS";
    ctx.fillText("Purple Square Panic", 32, 48);

    ctx.font = "15px Segoe UI";
    ctx.fillStyle = "#c7c9f9";
    ctx.fillText(`Score: ${Math.floor(state.score)}`, 32, 76);
    ctx.fillText(`Best: ${Math.floor(state.bestScore)}`, 145, 76);
    ctx.fillText(`Level: ${state.level}`, 245, 76);

    ctx.fillStyle = "#ffd966";
    ctx.fillText(`Shield: ${state.player.shieldTimer > 0 ? state.player.shieldTimer.toFixed(1) + "s" : "off"}`, 32, 104);
    ctx.fillStyle = "#9ae6b4";
    ctx.fillText(`Slow: ${state.player.slowTimer > 0 ? state.player.slowTimer.toFixed(1) + "s" : "off"}`, 180, 104);

    ctx.fillStyle = "#f3e9ff";
    ctx.fillText(state.message, 32, 130);
    ctx.restore();
  }

  function drawOverlay() {
    if (state.screen === "playing") return;

    ctx.save();
    ctx.fillStyle = "rgba(6, 7, 16, 0.72)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";

    if (state.screen === "title") {
      ctx.fillStyle = "#f9f5ff";
      ctx.font = "bold 46px Trebuchet MS";
      ctx.fillText("Purple Square Panic", WIDTH / 2, HEIGHT / 2 - 74);
      ctx.font = "20px Segoe UI";
      ctx.fillStyle = "#ddd7ff";
      ctx.fillText("You are the purple square at the bottom.", WIDTH / 2, HEIGHT / 2 - 24);
      ctx.fillText("Red and green squares are danger. Yellow squares are powerups.", WIDTH / 2, HEIGHT / 2 + 8);
      ctx.fillText("Press Enter to start dodging.", WIDTH / 2, HEIGHT / 2 + 54);
    } else if (state.screen === "paused") {
      ctx.fillStyle = "#f9f5ff";
      ctx.font = "bold 42px Trebuchet MS";
      ctx.fillText("Paused", WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = "20px Segoe UI";
      ctx.fillStyle = "#ddd7ff";
      ctx.fillText("Press P to keep going.", WIDTH / 2, HEIGHT / 2 + 26);
    } else if (state.screen === "gameover") {
      ctx.fillStyle = "#fff2f6";
      ctx.font = "bold 42px Trebuchet MS";
      ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 48);
      ctx.font = "22px Segoe UI";
      ctx.fillStyle = "#ffd3df";
      ctx.fillText(`Score: ${Math.floor(state.score)}`, WIDTH / 2, HEIGHT / 2 - 4);
      ctx.fillText(`Best: ${Math.floor(state.bestScore)}`, WIDTH / 2, HEIGHT / 2 + 30);
      ctx.fillText("Press R or Enter to restart.", WIDTH / 2, HEIGHT / 2 + 78);
    }

    ctx.restore();
  }

  function render() {
    drawBackground();
    drawLaneGuides();
    drawSquares();
    drawPlayer();
    drawParticles();
    drawHud();

    if (state.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 240, 140, ${state.flashTimer * 0.42})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    drawOverlay();
  }

  function loop(timestamp) {
    const dt = Math.min(0.033, ((timestamp - lastTime) / 1000) || 0);
    lastTime = timestamp;
    update(dt);
    render();
    input.endFrame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
