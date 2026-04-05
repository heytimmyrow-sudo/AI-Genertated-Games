(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const STAR_COUNT = 90;

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);
      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["w", "a", "s", "d", " ", "enter", "escape", "p", "r"].includes(key)) event.preventDefault();
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

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
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
      r: randomRange(1, 3),
      speed: randomRange(10, 30),
      alpha: randomRange(0.2, 0.9)
    }));
  }

  function spawnCore() {
    return {
      x: randomRange(60, WIDTH - 60),
      y: randomRange(70, HEIGHT - 70),
      pulse: Math.random() * Math.PI * 2,
      taken: false
    };
  }

  function spawnDrone(level) {
    const edge = Math.floor(Math.random() * 4);
    const margin = 40;
    const points = [
      { x: randomRange(0, WIDTH), y: -margin },
      { x: WIDTH + margin, y: randomRange(0, HEIGHT) },
      { x: randomRange(0, WIDTH), y: HEIGHT + margin },
      { x: -margin, y: randomRange(0, HEIGHT) }
    ];
    const pos = points[edge];
    return {
      x: pos.x,
      y: pos.y,
      radius: 16,
      health: 24 + level * 8,
      maxHealth: 24 + level * 8,
      speed: 64 + level * 10,
      hitTimer: 0
    };
  }

  function createState() {
    return {
      screen: "title",
      message: "Collect every core and keep the drones off your hull.",
      level: 1,
      coresCollected: 0,
      targetCores: 6,
      flashTimer: 0,
      stars: createStars(),
      player: {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        radius: 18,
        health: 100,
        maxHealth: 100,
        dashTimer: 0,
        dashCooldown: 0,
        fireCooldown: 0,
        facing: 0
      },
      cores: Array.from({ length: 6 }, spawnCore),
      drones: [spawnDrone(1), spawnDrone(1)],
      shots: [],
      particles: []
    };
  }

  const input = new InputHandler();
  let state = createState();
  let lastTime = 0;

  function resetGame() {
    state = createState();
  }

  function startGame() {
    state = createState();
    state.screen = "playing";
    state.message = "Sweep the field and recover all 6 energy cores.";
  }

  function emitBurst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: randomRange(-130, 130),
        vy: randomRange(-130, 130),
        life: randomRange(0.3, 0.8),
        maxLife: 1,
        size: randomRange(2, 5),
        color
      });
      state.particles[state.particles.length - 1].maxLife = state.particles[state.particles.length - 1].life;
    }
  }

  function updateStars(dt) {
    for (const star of state.stars) {
      star.y += star.speed * dt;
      if (star.y > HEIGHT + star.r) {
        star.y = -star.r;
        star.x = Math.random() * WIDTH;
      }
    }
  }

  function updatePlayer(dt) {
    const moveX = (input.isDown("d") ? 1 : 0) - (input.isDown("a") ? 1 : 0);
    const moveY = (input.isDown("s") ? 1 : 0) - (input.isDown("w") ? 1 : 0);
    const mag = Math.hypot(moveX, moveY) || 1;
    const dashBoost = state.player.dashTimer > 0 ? 2.4 : 1;
    const speed = 180 * dashBoost;
    state.player.x = clamp(state.player.x + (moveX / mag) * speed * dt, 24, WIDTH - 24);
    state.player.y = clamp(state.player.y + (moveY / mag) * speed * dt, 24, HEIGHT - 24);
    if (moveX !== 0 || moveY !== 0) {
      state.player.facing = Math.atan2(moveY, moveX);
    }
    state.player.dashTimer = Math.max(0, state.player.dashTimer - dt);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);
    state.player.fireCooldown = Math.max(0, state.player.fireCooldown - dt);

    if (input.wasPressed(" ") && state.player.dashCooldown <= 0) {
      state.player.dashTimer = 0.18;
      state.player.dashCooldown = 1.1;
      emitBurst(state.player.x, state.player.y, "#9fe7ff", 12);
    }
  }

  function autoFire() {
    if (state.player.fireCooldown > 0) return;
    let target = null;
    let nearest = Infinity;
    for (const drone of state.drones) {
      const dist = distance(state.player.x, state.player.y, drone.x, drone.y);
      if (dist < nearest) {
        nearest = dist;
        target = drone;
      }
    }
    if (!target) return;
    const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
    state.shots.push({
      x: state.player.x,
      y: state.player.y,
      vx: Math.cos(angle) * 420,
      vy: Math.sin(angle) * 420,
      life: 0.8
    });
    state.player.fireCooldown = 0.24;
  }

  function updateShots(dt) {
    for (let i = state.shots.length - 1; i >= 0; i -= 1) {
      const shot = state.shots[i];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      let hit = false;
      for (const drone of state.drones) {
        if (distance(shot.x, shot.y, drone.x, drone.y) < drone.radius + 6) {
          drone.health -= 12;
          drone.hitTimer = 0.12;
          hit = true;
          emitBurst(shot.x, shot.y, "#7fefff", 6);
          if (drone.health <= 0) {
            emitBurst(drone.x, drone.y, "#ff9a6b", 12);
          }
          break;
        }
      }
      if (hit || shot.life <= 0 || shot.x < -10 || shot.x > WIDTH + 10 || shot.y < -10 || shot.y > HEIGHT + 10) {
        state.shots.splice(i, 1);
      }
    }
    state.drones = state.drones.filter((drone) => drone.health > 0);
  }

  function updateDrones(dt) {
    for (const drone of state.drones) {
      drone.hitTimer = Math.max(0, drone.hitTimer - dt);
      const dx = state.player.x - drone.x;
      const dy = state.player.y - drone.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      drone.x += (dx / dist) * drone.speed * dt;
      drone.y += (dy / dist) * drone.speed * dt;
      if (dist < drone.radius + state.player.radius + 2) {
        state.player.health = Math.max(0, state.player.health - 22 * dt);
        state.flashTimer = 0.08;
      }
    }
  }

  function updateCores(dt) {
    for (const core of state.cores) {
      if (core.taken) continue;
      core.pulse += dt * 4;
      if (distance(state.player.x, state.player.y, core.x, core.y) < 24) {
        core.taken = true;
        state.coresCollected += 1;
        state.level = 1 + Math.floor(state.coresCollected / 2);
        state.message = "Core secured. " + (state.targetCores - state.coresCollected) + " left.";
        emitBurst(core.x, core.y, "#9fe7ff", 10);
        state.drones.push(spawnDrone(state.level));
        if (state.coresCollected === state.targetCores) {
          state.screen = "victory";
          state.message = "Field cleared. Press R to salvage another sector.";
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }
  }

  function drawScene() {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, "#121833");
    bg.addColorStop(1, "#060810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(159, 231, 255, 0.1)";
    for (let x = 40; x < WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 40; y < HEIGHT; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    for (const core of state.cores) {
      if (core.taken) continue;
      const pulse = 1 + Math.sin(core.pulse) * 0.15;
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#9fe7ff";
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const shot of state.shots) {
      ctx.fillStyle = "#ffe88d";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const drone of state.drones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.fillStyle = drone.hitTimer > 0 ? "#fff0d8" : "#ff9a6b";
      ctx.fillRect(-14, -14, 28, 28);
      ctx.fillStyle = "#2a1620";
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.rotate(state.player.facing);
    ctx.fillStyle = state.player.dashTimer > 0 ? "#d9f5ff" : "#b38cff";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    for (const particle of state.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    ctx.fillStyle = "rgba(12, 18, 39, 0.76)";
    ctx.fillRect(16, 16, 320, 110);
    ctx.strokeStyle = "rgba(159, 231, 255, 0.2)";
    ctx.strokeRect(16, 16, 320, 110);
    ctx.fillStyle = "#f8f4ff";
    ctx.font = "bold 20px Georgia";
    ctx.fillText("Starforge Salvage", 28, 42);
    ctx.font = "14px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("Collect cores, dash through danger, and let auto-fire clean the drones.", 28, 62, 280);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(28, 78, 180, 14);
    ctx.fillStyle = "#ff7d72";
    ctx.fillRect(28, 78, 180 * (state.player.health / state.player.maxHealth), 14);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(28, 78, 180, 14);
    ctx.fillStyle = "#f8f4ff";
    ctx.fillText("Hull " + Math.ceil(state.player.health) + "/" + state.player.maxHealth, 218, 90);
    ctx.fillStyle = "#9fe7ff";
    ctx.fillText("Cores " + state.coresCollected + "/" + state.targetCores, 28, 112);
    ctx.fillStyle = "#ffe88d";
    ctx.fillText("Drones " + state.drones.length, 128, 112);
    ctx.fillStyle = "#b38cff";
    ctx.fillText("Sector " + state.level, 220, 112);

    ctx.fillStyle = "rgba(12, 18, 39, 0.76)";
    ctx.fillRect(16, HEIGHT - 52, 500, 34);
    ctx.strokeStyle = "rgba(159, 231, 255, 0.16)";
    ctx.strokeRect(16, HEIGHT - 52, 500, 34);
    ctx.fillStyle = "#e6d9ff";
    ctx.fillText(state.message, 28, HEIGHT - 30);
  }

  function drawOverlay() {
    if (state.flashTimer > 0) {
      ctx.fillStyle = "rgba(255, 90, 114, 0.12)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (state.screen === "playing") return;
    ctx.fillStyle = "rgba(4, 7, 16, 0.76)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8f4ff";
    ctx.font = "bold 42px Georgia";
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    if (state.screen === "title") {
      ctx.fillText("Starforge Salvage", cx, cy - 40);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press Enter to launch. Move with WASD, auto-fire the nearest drone, and dash with Space.", cx, cy + 6);
    } else if (state.screen === "paused") {
      ctx.fillText("Paused", cx, cy - 20);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press P to resume.", cx, cy + 18);
    } else if (state.screen === "gameover") {
      ctx.fillText("Salvage Lost", cx, cy - 20);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press R to fly a new run.", cx, cy + 18);
    } else if (state.screen === "victory") {
      ctx.fillText("Sector Cleared", cx, cy - 20);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press R to start another salvage route.", cx, cy + 18);
    }
    ctx.textAlign = "start";
  }

  function render() {
    drawScene();
    drawHud();
    drawOverlay();
  }

  function update(dt) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
    if (input.wasPressed("escape")) {
      returnToMenu();
      return;
    }
    if (input.wasPressed("p")) {
      if (state.screen === "playing") state.screen = "paused";
      else if (state.screen === "paused") state.screen = "playing";
    }
    if (state.screen === "title") {
      if (input.wasPressed("enter")) startGame();
      return;
    }
    if (state.screen === "paused") return;
    if (state.screen === "gameover" || state.screen === "victory") {
      if (input.wasPressed("r")) resetGame();
      return;
    }
    updateStars(dt);
    updatePlayer(dt);
    autoFire();
    updateShots(dt);
    updateDrones(dt);
    updateCores(dt);
    updateParticles(dt);
    if (state.player.health <= 0) {
      state.screen = "gameover";
      state.message = "Hunter drones tore through your hull.";
    }
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
