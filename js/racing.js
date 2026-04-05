(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const STAR_COUNT = 70;
  const TOTAL_LAPS = 3;
  const TRACK_SAMPLES = 220;
  const CAMERA_LOOKAHEAD = 120;
  const CAMERA_HEIGHT = 38;
  const CAMERA_DISTANCE = 26;

  const TRACKS = [
    {
      name: "Classic Oval",
      description: "4 left turns",
      laneHalfWidth: 72,
      createPoint(t) {
        const angle = t * Math.PI * 2;
        return {
          x: Math.cos(angle) * 355,
          y: Math.sin(angle) * 205
        };
      }
    },
    {
      name: "Neon Esses",
      description: "flowing switchbacks",
      laneHalfWidth: 68,
      createPoint(t) {
        const angle = t * Math.PI * 2;
        return {
          x: Math.cos(angle) * 300 + Math.sin(angle * 2) * 110,
          y: Math.sin(angle) * 220 + Math.sin(angle * 4 + 0.4) * 54
        };
      }
    },
    {
      name: "Tri-Bend Loop",
      description: "three sweeping arcs",
      laneHalfWidth: 70,
      createPoint(t) {
        const angle = t * Math.PI * 2;
        const bend = 1 + 0.18 * Math.sin(angle * 3);
        return {
          x: Math.cos(angle) * 320 * bend,
          y: Math.sin(angle) * 220 * bend + Math.sin(angle * 1.5 + 0.7) * 26
        };
      }
    }
  ];

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);
      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if (["w", "a", "s", "d", "arrowleft", "arrowright", "arrowup", "arrowdown", " ", "enter", "escape", "p", "r"].includes(key)) {
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
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

  function wrap01(value) {
    let result = value % 1;
    if (result < 0) result += 1;
    return result;
  }

  function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  function createStars() {
    return Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: randomRange(1, 3),
      speed: randomRange(12, 34),
      alpha: randomRange(0.16, 0.8)
    }));
  }

  function buildTrack(track) {
    const points = [];
    const cumulative = [0];

    for (let i = 0; i <= TRACK_SAMPLES; i += 1) {
      points.push(track.createPoint(i / TRACK_SAMPLES));
      if (i > 0) {
        const a = points[i - 1];
        const b = points[i];
        cumulative[i] = cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
      }
    }

    return {
      ...track,
      points,
      cumulative,
      totalLength: cumulative[cumulative.length - 1]
    };
  }

  function sampleTrack(track, progress, laneOffset = 0) {
    const wrapped = wrap01(progress);
    const scaled = wrapped * TRACK_SAMPLES;
    const index = Math.floor(scaled);
    const nextIndex = (index + 1) % TRACK_SAMPLES;
    const alpha = scaled - index;
    const p1 = track.points[index];
    const p2 = track.points[nextIndex];
    const centerX = lerp(p1.x, p2.x, alpha);
    const centerY = lerp(p1.y, p2.y, alpha);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.max(0.0001, Math.hypot(dx, dy));
    const tangentX = dx / length;
    const tangentY = dy / length;
    const normalX = -tangentY;
    const normalY = tangentX;

    return {
      x: centerX + normalX * laneOffset * track.laneHalfWidth,
      y: centerY + normalY * laneOffset * track.laneHalfWidth,
      centerX,
      centerY,
      tangentX,
      tangentY,
      normalX,
      normalY,
      angle: Math.atan2(tangentY, tangentX)
    };
  }

  function progressDelta(a, b) {
    let delta = a - b;
    if (delta > 0.5) delta -= 1;
    if (delta < -0.5) delta += 1;
    return delta;
  }

  function createOpponent(index) {
    const colors = ["#ff7d72", "#92fbff", "#ffe88d", "#b38cff", "#7dfff8"];
    return {
      id: "rival-" + index,
      name: "Rival " + (index + 1),
      laneOffset: randomRange(-0.62, 0.62),
      targetLaneOffset: randomRange(-0.62, 0.62),
      progress: 0.04 + index * 0.045,
      lap: 1,
      speed: 0,
      targetSpeed: 0.075 + index * 0.003,
      color: colors[index % colors.length],
      wobble: Math.random() * Math.PI * 2,
      angle: 0
    };
  }

  function createState(trackIndex = 0) {
    const builtTrack = buildTrack(TRACKS[trackIndex]);
    return {
      screen: "title",
      message: "Three laps. Beat the rivals to the line.",
      trackIndex,
      builtTrack,
      stars: createStars(),
      flashTimer: 0,
      raceTime: 0,
      camera: {
        x: 0,
        y: 0,
        angle: 0
      },
      player: {
        laneOffset: 0,
        speed: 0.072,
        boost: 100,
        wobble: 0,
        progress: 0,
        lap: 1,
        finished: false,
        angle: 0
      },
      opponents: Array.from({ length: 5 }, (_, index) => createOpponent(index)),
      position: 6,
      bestFinish: null
    };
  }

  const input = new InputHandler();
  let state = createState();
  let lastTime = 0;

  function getEntrants() {
    return [{ id: "player", lap: state.player.lap, progress: state.player.progress }, ...state.opponents];
  }

  function updatePosition() {
    const ranked = getEntrants()
      .slice()
      .sort((a, b) => (b.lap - a.lap) || (b.progress - a.progress));
    state.position = ranked.findIndex((entry) => entry.id === "player") + 1;
  }

  function resetGame() {
    const bestFinish = state.bestFinish;
    const trackIndex = state.trackIndex;
    state = createState(trackIndex);
    state.bestFinish = bestFinish;
  }

  function startRun() {
    const bestFinish = state.bestFinish;
    const trackIndex = state.trackIndex;
    state = createState(trackIndex);
    state.bestFinish = bestFinish;
    state.screen = "playing";
    state.message = "Green light on " + TRACKS[state.trackIndex].name + ". Run the whole circuit and beat the field.";
  }

  function cycleTrack(direction) {
    state.trackIndex = (state.trackIndex + direction + TRACKS.length) % TRACKS.length;
    state.builtTrack = buildTrack(TRACKS[state.trackIndex]);
    state.message = TRACKS[state.trackIndex].name + ": " + TRACKS[state.trackIndex].description + ".";
  }

  function finishRace() {
    state.screen = "victory";
    state.bestFinish = state.bestFinish === null ? state.position : Math.min(state.bestFinish, state.position);
    state.message = "Finished " + state.position + "/" + (state.opponents.length + 1) + ". Press R to race again.";
  }

  function updateStars(dt) {
    for (const star of state.stars) {
      star.y += star.speed * dt;
      if (star.y > HEIGHT + 4) {
        star.y = -4;
        star.x = Math.random() * WIDTH;
      }
    }
  }

  function updatePlayer(dt) {
    const steer = (input.isDown("d", "arrowright") ? 1 : 0) - (input.isDown("a", "arrowleft") ? 1 : 0);
    const accel = input.isDown("w", "arrowup");
    const brake = input.isDown("s", "arrowdown");
    const boost = input.isDown(" ");

    let targetSpeed = 0.078;
    if (accel) targetSpeed = 0.11;
    if (brake) targetSpeed = 0.055;
    if (boost && state.player.boost > 0) {
      targetSpeed = 0.136;
      state.player.boost = Math.max(0, state.player.boost - 30 * dt);
    } else {
      state.player.boost = Math.min(100, state.player.boost + 14 * dt);
    }

    const offTrackPenalty = Math.max(0, Math.abs(state.player.laneOffset) - 0.88) * 0.06;
    targetSpeed = Math.max(0.045, targetSpeed - offTrackPenalty);

    state.player.speed += (targetSpeed - state.player.speed) * Math.min(1, dt * 3);
    state.player.laneOffset = clamp(state.player.laneOffset + steer * 1.5 * dt, -1.2, 1.2);
    state.player.wobble += dt * 8;
    state.player.progress += state.player.speed * dt;

    while (state.player.progress >= 1 && !state.player.finished) {
      state.player.progress -= 1;
      state.player.lap += 1;
      if (state.player.lap > TOTAL_LAPS) {
        state.player.finished = true;
        finishRace();
        return;
      }
      state.message = "Lap " + state.player.lap + "/" + TOTAL_LAPS + ". Push for position " + state.position + ".";
    }

    const pose = sampleTrack(state.builtTrack, state.player.progress, state.player.laneOffset);
    state.player.angle = pose.angle;
  }

  function updateOpponents(dt) {
    for (const opponent of state.opponents) {
      opponent.wobble += dt * (1.2 + opponent.targetSpeed * 12);
      if (Math.sin(opponent.wobble) > 0.98) {
        opponent.targetLaneOffset = randomRange(-0.65, 0.65);
      }
      opponent.laneOffset += (opponent.targetLaneOffset - opponent.laneOffset) * Math.min(1, dt * 1.6);
      opponent.speed += (opponent.targetSpeed - opponent.speed) * Math.min(1, dt * 1.8);
      opponent.progress += opponent.speed * dt;
      if (opponent.progress >= 1) {
        opponent.progress -= 1;
        opponent.lap += 1;
      }
      opponent.angle = sampleTrack(state.builtTrack, opponent.progress, opponent.laneOffset).angle;
    }
  }

  function updateContact() {
    const playerPose = sampleTrack(state.builtTrack, state.player.progress, state.player.laneOffset);
    for (const opponent of state.opponents) {
      const pose = sampleTrack(state.builtTrack, opponent.progress, opponent.laneOffset);
      const distance = Math.hypot(playerPose.x - pose.x, playerPose.y - pose.y);
      if (distance < 48) {
        state.player.speed = Math.max(0.048, state.player.speed - 0.018);
        opponent.speed = Math.max(0.05, opponent.speed - 0.008);
        state.flashTimer = 0.09;
        state.message = "Door-to-door with " + opponent.name + ". Hold the line.";
      }
    }
  }

  function updateRace(dt) {
    state.raceTime += dt;
    updateOpponents(dt);
    updateContact();
    updatePosition();
  }

  function updateCamera(dt) {
    const playerPose = sampleTrack(state.builtTrack, state.player.progress, state.player.laneOffset);
    const lookAheadPose = sampleTrack(state.builtTrack, state.player.progress + state.player.speed * CAMERA_LOOKAHEAD * dt, state.player.laneOffset);
    const forwardX = Math.cos(playerPose.angle);
    const forwardY = Math.sin(playerPose.angle);
    const targetX = playerPose.x + forwardX * CAMERA_DISTANCE;
    const targetY = playerPose.y + forwardY * CAMERA_DISTANCE;
    const targetAngle = playerPose.angle - Math.PI / 2;

    state.camera.x += (targetX - state.camera.x) * Math.min(1, dt * 4);
    state.camera.y += (targetY - state.camera.y) * Math.min(1, dt * 4);
    state.camera.angle += normalizeAngle(targetAngle - state.camera.angle) * Math.min(1, dt * 5);
  }

  function worldToScreen(x, y) {
    const dx = x - state.camera.x;
    const dy = y - state.camera.y;
    const cos = Math.cos(-state.camera.angle);
    const sin = Math.sin(-state.camera.angle);
    const depth = dx * sin + dy * cos;
    const perspective = clamp(0.24 + (depth + CAMERA_HEIGHT) / 220, 0.18, 3.2);
    return {
      x: WIDTH / 2 + (dx * cos - dy * sin) * perspective,
      y: HEIGHT * 0.96 + depth * 0.88
    };
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#071120");
    sky.addColorStop(0.45, "#170f39");
    sky.addColorStop(1, "#05070d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    ctx.fillStyle = "rgba(88, 43, 150, 0.18)";
    ctx.fillRect(0, HEIGHT * 0.58, WIDTH, HEIGHT * 0.18);
  }

  function drawInfieldGlow() {
    const center = worldToScreen(0, 0);
    const glow = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, 260);
    glow.addColorStop(0, "rgba(125,255,248,0.18)");
    glow.addColorStop(1, "rgba(125,255,248,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 260, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTrackSurface() {
    const roadPoints = [];
    const innerPoints = [];
    const outerPoints = [];

    for (let i = 0; i <= TRACK_SAMPLES; i += 1) {
      const pose = sampleTrack(state.builtTrack, i / TRACK_SAMPLES, 0);
      roadPoints.push(worldToScreen(pose.centerX, pose.centerY));
      innerPoints.push(worldToScreen(
        pose.centerX - pose.normalX * state.builtTrack.laneHalfWidth,
        pose.centerY - pose.normalY * state.builtTrack.laneHalfWidth
      ));
      outerPoints.push(worldToScreen(
        pose.centerX + pose.normalX * state.builtTrack.laneHalfWidth,
        pose.centerY + pose.normalY * state.builtTrack.laneHalfWidth
      ));
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.strokeStyle = "rgba(125,255,248,0.12)";
    ctx.lineWidth = state.builtTrack.laneHalfWidth * 2.6;
    ctx.beginPath();
    roadPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#181a25";
    ctx.lineWidth = state.builtTrack.laneHalfWidth * 2.02;
    ctx.beginPath();
    roadPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#ff4fd8";
    ctx.lineWidth = 9;
    ctx.beginPath();
    outerPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#7dfff8";
    ctx.lineWidth = 9;
    ctx.beginPath();
    innerPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([20, 16]);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    roadPoints.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    const startPose = sampleTrack(state.builtTrack, 0, 0);
    const startA = worldToScreen(
      startPose.centerX - startPose.normalX * state.builtTrack.laneHalfWidth * 1.05,
      startPose.centerY - startPose.normalY * state.builtTrack.laneHalfWidth * 1.05
    );
    const startB = worldToScreen(
      startPose.centerX + startPose.normalX * state.builtTrack.laneHalfWidth * 1.05,
      startPose.centerY + startPose.normalY * state.builtTrack.laneHalfWidth * 1.05
    );
    ctx.strokeStyle = "#ffe88d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startA.x, startA.y);
    ctx.lineTo(startB.x, startB.y);
    ctx.stroke();
  }

  function drawTrackDecor() {
    const landmarks = [
      { x: -430, y: -260, color: "#7dfff8", size: 18 },
      { x: 440, y: -220, color: "#ff4fd8", size: 20 },
      { x: 420, y: 260, color: "#ffe88d", size: 16 },
      { x: -420, y: 250, color: "#8f9dff", size: 18 },
      { x: 0, y: -320, color: "#ff7d72", size: 14 }
    ];

    for (const beacon of landmarks) {
      const point = worldToScreen(beacon.x, beacon.y);
      const glow = ctx.createRadialGradient(point.x, point.y, 2, point.x, point.y, beacon.size * 2.4);
      glow.addColorStop(0, beacon.color);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, beacon.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCar(screenX, screenY, angle, color, scale) {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(angle - state.camera.angle + Math.PI / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffe88d";
    ctx.fillRect(-11, -24, 22, 44);
    ctx.fillStyle = color;
    ctx.fillRect(-9, -18, 18, 30);
    ctx.fillStyle = "#0f1320";
    ctx.fillRect(-6, -11, 12, 12);
    ctx.fillStyle = "#7dfff8";
    ctx.fillRect(-9, -20, 4, 6);
    ctx.fillRect(5, -20, 4, 6);
    ctx.fillStyle = "rgba(10, 12, 20, 0.42)";
    ctx.fillRect(-13, 14, 26, 6);
    ctx.restore();
  }

  function drawOpponents() {
    const visible = [];
    for (const opponent of state.opponents) {
      const delta = progressDelta(opponent.progress, state.player.progress);
      const pose = sampleTrack(state.builtTrack, opponent.progress, opponent.laneOffset);
      visible.push({
        pose,
        opponent,
        sortKey: -delta
      });
    }

    visible.sort((a, b) => a.sortKey - b.sortKey);
    for (const entry of visible) {
      const screen = worldToScreen(entry.pose.x, entry.pose.y);
      if (screen.x < -60 || screen.x > WIDTH + 60 || screen.y < -60 || screen.y > HEIGHT + 60) continue;
      const scale = clamp((screen.y - HEIGHT * 0.08) / (HEIGHT * 0.9), 0.62, 1.1);
      drawCar(screen.x, screen.y, entry.pose.angle, entry.opponent.color, scale);
    }
  }

  function drawPlayer() {
    const pose = sampleTrack(state.builtTrack, state.player.progress, state.player.laneOffset);
    const screen = worldToScreen(pose.x, pose.y);
    const drift = state.player.laneOffset * 0.08 + Math.sin(state.player.wobble) * 0.02;
    drawCar(screen.x, screen.y + 180, pose.angle + drift, "#ff4fd8", 1.28);
  }

  function drawHud() {
    ctx.fillStyle = "rgba(10, 14, 33, 0.72)";
    ctx.fillRect(16, 16, 350, 116);
    ctx.strokeStyle = "rgba(167, 128, 255, 0.2)";
    ctx.strokeRect(16, 16, 350, 116);
    ctx.fillStyle = "#f8f4ff";
    ctx.font = "bold 20px Georgia";
    ctx.fillText("Neon Apex Rush", 28, 42);
    ctx.font = "14px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("Lap " + state.player.lap + "/" + TOTAL_LAPS, 28, 68);
    ctx.fillText("Position " + state.position + "/" + (state.opponents.length + 1), 124, 68);
    ctx.fillText("Speed " + Math.round(state.player.speed * 4200), 250, 68);
    ctx.fillStyle = "rgba(255,255,255,0.11)";
    ctx.fillRect(28, 82, 180, 14);
    ctx.fillStyle = "#7dfff8";
    ctx.fillRect(28, 82, 180 * (state.player.boost / 100), 14);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(28, 82, 180, 14);
    ctx.fillStyle = "#f8f4ff";
    ctx.fillText("Boost", 218, 94);
    if (state.bestFinish !== null) {
      ctx.fillStyle = "#ffe88d";
      ctx.fillText("Best Finish " + state.bestFinish, 28, 116);
    }
    ctx.fillStyle = "#92fbff";
    ctx.fillText(TRACKS[state.trackIndex].name, 188, 116);

    ctx.fillStyle = "rgba(10, 14, 33, 0.72)";
    ctx.fillRect(384, 16, 500, 56);
    ctx.strokeStyle = "rgba(167, 128, 255, 0.16)";
    ctx.strokeRect(384, 16, 500, 56);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(402, 38, 464, 10);
    ctx.fillStyle = "#ff4fd8";
    const lapProgress = wrap01(state.player.progress) * 464;
    ctx.fillRect(402, 38, lapProgress, 10);
    ctx.fillStyle = "#e6d9ff";
    ctx.fillText("Lap Progress", 402, 32);

    ctx.fillStyle = "rgba(10, 14, 33, 0.72)";
    ctx.fillRect(16, HEIGHT - 52, 510, 34);
    ctx.strokeStyle = "rgba(167, 128, 255, 0.16)";
    ctx.strokeRect(16, HEIGHT - 52, 510, 34);
    ctx.fillStyle = "#e6d9ff";
    ctx.fillText(state.message, 28, HEIGHT - 30);
  }

  function drawOverlay() {
    if (state.flashTimer > 0) {
      ctx.fillStyle = "rgba(255, 94, 122, 0.12)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (state.screen === "playing") return;
    ctx.fillStyle = "rgba(5, 7, 16, 0.76)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8f4ff";
    ctx.font = "bold 42px Georgia";
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    if (state.screen === "title") {
      ctx.fillText("Neon Apex Rush", cx, cy - 36);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Track: " + TRACKS[state.trackIndex].name + "  |  " + TRACKS[state.trackIndex].description, cx, cy + 2);
      ctx.fillText("Left/Right choose track. Enter starts the race.", cx, cy + 30);
      ctx.fillText("W accelerates, S brakes, A and D work the lane across a real circuit.", cx, cy + 58);
    } else if (state.screen === "paused") {
      ctx.fillText("Paused", cx, cy - 20);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press P to get back on the circuit.", cx, cy + 18);
    } else if (state.screen === "victory") {
      ctx.fillText("Race Finished", cx, cy - 20);
      ctx.font = "18px Segoe UI";
      ctx.fillStyle = "#b8bddb";
      ctx.fillText("Press R to run another race.", cx, cy + 18);
    }
    ctx.textAlign = "start";
  }

  function render() {
    drawBackground();
    drawInfieldGlow();
    drawTrackDecor();
    drawTrackSurface();
    drawOpponents();
    drawPlayer();
    drawHud();
    drawOverlay();
  }

  function update(dt) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
    updateStars(dt);

    if (input.wasPressed("escape")) {
      returnToMenu();
      return;
    }
    if (input.wasPressed("p")) {
      if (state.screen === "playing") state.screen = "paused";
      else if (state.screen === "paused") state.screen = "playing";
    }
    if (state.screen === "title") {
      if (input.wasPressed("arrowleft", "a")) cycleTrack(-1);
      if (input.wasPressed("arrowright", "d")) cycleTrack(1);
      if (input.wasPressed("enter")) startRun();
      updateCamera(dt);
      return;
    }
    if (state.screen === "paused") return;
    if (state.screen === "victory") {
      if (input.wasPressed("r")) resetGame();
      updateCamera(dt);
      return;
    }

    updatePlayer(dt);
    if (state.screen === "victory") {
      updateCamera(dt);
      return;
    }
    updateRace(dt);
    updateCamera(dt);
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
