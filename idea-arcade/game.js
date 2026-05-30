const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameList = document.getElementById("gameList");
const titleEl = document.getElementById("gameTitle");
const kickerEl = document.getElementById("gameKicker");
const goalEl = document.getElementById("gameGoal");
const controlsEl = document.getElementById("gameControls");
const scoreEl = document.getElementById("scoreStat");
const timeEl = document.getElementById("timeStat");
const statusEl = document.getElementById("statusStat");
const tokenEl = document.getElementById("tokenCount");
const achievementCountEl = document.getElementById("achievementCount");
const achievementListEl = document.getElementById("achievementList");
const overlayEl = document.getElementById("gameOverlay");
const overlayKickerEl = document.getElementById("overlayKicker");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayBodyEl = document.getElementById("overlayBody");
const overlayStatsEl = document.getElementById("overlayStats");
const overlayPrimaryEl = document.getElementById("overlayPrimary");
const overlaySecondaryEl = document.getElementById("overlaySecondary");
const settingsPanel = document.getElementById("settingsPanel");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const musicToggle = document.getElementById("musicToggle");
const reducedMotionToggle = document.getElementById("reducedMotionToggle");
const highContrastToggle = document.getElementById("highContrastToggle");
const largeTextToggle = document.getElementById("largeTextToggle");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
let current = 0;
let paused = false;
let lastTime = performance.now();
let elapsed = 0;
let mode = "intro";
let bindingTarget = null;
let audioCtx = null;
let ambient = null;
let previousStatus = "";

const defaultSettings = {
  difficulty: "standard",
  sound: true,
  music: true,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  bindings: {
    up: "w",
    left: "a",
    down: "s",
    right: "d",
    action: " "
  }
};

const achievements = [
  { id: "first-run", name: "First Credit", test: () => arcade.totalPlays >= 1 },
  { id: "score-100", name: "Triple Digits", test: () => bestAnyScore() >= 100 },
  { id: "five-games", name: "Sampler Plate", test: () => Object.keys(arcade.plays).length >= 5 },
  { id: "all-games", name: "Full Cabinet", test: () => Object.keys(arcade.plays).length >= games.length },
  { id: "planet-clear", name: "Clean Orbit", test: () => arcade.flags["planet-cleared"] },
  { id: "echo-exit", name: "Found By Sound", test: () => arcade.flags["echo-exit"] },
  { id: "train-engine", name: "Engine Room", test: () => arcade.flags["train-win"] },
  { id: "kaiju-week", name: "One Week Rehab", test: () => arcade.flags["kaiju-week"] },
  { id: "lighthouse-50", name: "Beacon Keeper", test: () => (arcade.highScores.lighthouse || 0) >= 50 },
  { id: "witch-60", name: "Clean Casting", test: () => (arcade.highScores.witch || 0) >= 60 }
];

const arcade = loadArcade();
const settings = loadSettings();

const colors = {
  ink: "#0f1520",
  panel: "#182230",
  line: "#33404d",
  text: "#eef3f8",
  muted: "#aab6c2",
  gold: "#ffc857",
  blue: "#61c8ff",
  green: "#65d18f",
  red: "#ff6b6b",
  violet: "#b28cff",
  orange: "#ff9b54"
};

const scenePalettes = {
  necromancer: ["#111622", "#172231", "#20192a"],
  planet: ["#081820", "#12323a", "#122019"],
  lighthouse: ["#06101a", "#0b2534", "#132033"],
  witch: ["#171121", "#251836", "#141929"],
  museum: ["#101820", "#1d2633", "#211926"],
  delivery: ["#102016", "#1d331d", "#182018"],
  chef: ["#0b1020", "#18264a", "#161b2b"],
  echo: ["#05080d", "#0b1320", "#06090f"],
  kaiju: ["#101811", "#1d2f22", "#18241c"],
  train: ["#101018", "#1d2430", "#201b24"]
};

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem("ideaArcadeSettings") || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem("ideaArcadeSettings", JSON.stringify(settings));
}

function loadArcade() {
  try {
    return {
      tokens: 0,
      totalPlays: 0,
      highScores: {},
      bestTimes: {},
      plays: {},
      achievements: {},
      flags: {},
      tutorials: {},
      ...JSON.parse(localStorage.getItem("ideaArcadeSave") || "{}")
    };
  } catch {
    return { tokens: 0, totalPlays: 0, highScores: {}, bestTimes: {}, plays: {}, achievements: {}, flags: {}, tutorials: {} };
  }
}

function saveArcade() {
  localStorage.setItem("ideaArcadeSave", JSON.stringify(arcade));
}

function bestAnyScore() {
  return Math.max(0, ...Object.values(arcade.highScores));
}

function difficultyValue() {
  return { casual: 0.82, standard: 1, hard: 1.22 }[settings.difficulty] || 1;
}

function scoreMultiplier() {
  return { casual: 0.8, standard: 1, hard: 1.3 }[settings.difficulty] || 1;
}

function applySettings() {
  difficultySelect.value = settings.difficulty;
  soundToggle.checked = settings.sound;
  musicToggle.checked = settings.music;
  reducedMotionToggle.checked = settings.reducedMotion;
  highContrastToggle.checked = settings.highContrast;
  largeTextToggle.checked = settings.largeText;
  document.body.classList.toggle("reduced-motion", settings.reducedMotion);
  document.body.classList.toggle("high-contrast", settings.highContrast);
  document.body.classList.toggle("large-text", settings.largeText);
  for (const [name, key] of Object.entries(settings.bindings)) {
    const el = document.getElementById(`bind-${name}`);
    if (el) el.textContent = key === " " ? "Space" : key.toUpperCase();
  }
  if (!settings.music) stopAmbient();
}

function isMoveKey(direction) {
  const key = settings.bindings[direction];
  return keys.has(key) || keys.has(key.toUpperCase()) || keys.has(`Gamepad${direction}`);
}

function isActionKey(key) {
  return key === settings.bindings.action || (settings.bindings.action === " " && key === " ");
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(kind = "select") {
  if (!settings.sound) return;
  const ctxAudio = ensureAudio();
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  const table = {
    select: [360, 0.035],
    start: [520, 0.06],
    success: [740, 0.08],
    fail: [140, 0.12],
    hit: [210, 0.05],
    pickup: [620, 0.05]
  };
  const [freq, dur] = table[kind] || table.select;
  osc.frequency.value = freq;
  osc.type = kind === "fail" ? "sawtooth" : "triangle";
  gain.gain.setValueAtTime(0.0001, ctxAudio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, ctxAudio.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime + dur);
  osc.connect(gain).connect(ctxAudio.destination);
  osc.start();
  osc.stop(ctxAudio.currentTime + dur + 0.02);
}

function startAmbient() {
  if (!settings.music || ambient) return;
  const ctxAudio = ensureAudio();
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  osc.type = "sine";
  osc.frequency.value = 88 + current * 8;
  gain.gain.value = 0.018;
  osc.connect(gain).connect(ctxAudio.destination);
  osc.start();
  ambient = { osc, gain };
}

function stopAmbient() {
  if (!ambient) return;
  ambient.gain.gain.exponentialRampToValueAtTime(0.0001, ensureAudio().currentTime + 0.04);
  ambient.osc.stop(ensureAudio().currentTime + 0.05);
  ambient = null;
}

function updateProgressUI() {
  tokenEl.textContent = arcade.tokens;
  const unlocked = Object.keys(arcade.achievements).length;
  achievementCountEl.textContent = `${unlocked}/${achievements.length}`;
  const rows = achievements.slice(0, 8).map((a) => {
    const got = arcade.achievements[a.id];
    return `<p>${got ? "Unlocked" : "Locked"}: ${a.name}</p>`;
  });
  achievementListEl.innerHTML = rows.join("");
  [...gameList.children].forEach((button, index) => {
    const game = games[index];
    const meta = button.querySelector(".game-meta");
    if (meta) meta.textContent = `${game.kicker} | Best ${arcade.highScores[game.id] || 0} | Plays ${arcade.plays[game.id] || 0}`;
  });
}

function checkAchievements() {
  let changed = false;
  for (const achievement of achievements) {
    if (!arcade.achievements[achievement.id] && achievement.test()) {
      arcade.achievements[achievement.id] = Date.now();
      arcade.tokens += 5;
      changed = true;
      playTone("success");
    }
  }
  if (changed) {
    saveArcade();
    updateProgressUI();
  }
}

function showOverlay(state, title, body, primary = "Start") {
  const game = games[current];
  overlayKickerEl.textContent = game.kicker;
  overlayTitleEl.textContent = title;
  overlayBodyEl.textContent = body;
  overlayStatsEl.innerHTML = `
    <span><strong>${arcade.highScores[game.id] || 0}</strong>Best Score</span>
    <span><strong>${arcade.plays[game.id] || 0}</strong>Plays</span>
    <span><strong>${settings.difficulty}</strong>Difficulty</span>
  `;
  overlayPrimaryEl.textContent = primary;
  overlaySecondaryEl.textContent = state === "intro" ? "Random Game" : "Next Game";
  overlayEl.classList.add("is-open");
}

function hideOverlay() {
  overlayEl.classList.remove("is-open");
}

function startGame() {
  const game = games[current];
  if (!arcade.tutorials[game.id]) {
    arcade.tutorials[game.id] = true;
    saveArcade();
  }
  mode = "playing";
  paused = false;
  elapsed = 0;
  arcade.totalPlays += 1;
  arcade.plays[game.id] = (arcade.plays[game.id] || 0) + 1;
  saveArcade();
  updateProgressUI();
  hideOverlay();
  playTone("start");
  startAmbient();
}

function finishGame(result, reason) {
  if (mode === "ended") return;
  const game = games[current];
  mode = "ended";
  stopAmbient();
  const score = Math.floor((game.score || 0) * scoreMultiplier());
  if (score > (arcade.highScores[game.id] || 0)) {
    arcade.highScores[game.id] = score;
    arcade.tokens += Math.max(2, Math.floor(score / 25));
  }
  arcade.bestTimes[game.id] = Math.max(arcade.bestTimes[game.id] || 0, Math.floor(elapsed));
  saveArcade();
  checkAchievements();
  updateProgressUI();
  playTone(result === "win" ? "success" : "fail");
  showOverlay("ended", result === "win" ? "Cleared" : "Run Over", `${reason} Final score: ${score}.`, "Retry");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function clear(bg = colors.ink) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

function scene(name) {
  const [a, b, c] = scenePalettes[name] || [colors.ink, "#162131", "#111820"];
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, a);
  gradient.addColorStop(0.58, b);
  gradient.addColorStop(1, c);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 48) ctx.fillRect(0, y, W, 1);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 560);
  vignette.addColorStop(0, "rgba(255,255,255,0.02)");
  vignette.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function roundedRect(x, y, w, h, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function glowCircle(x, y, r, color, glow = 18) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  circle(x, y, r, color);
  ctx.restore();
}

function panel(x, y, w, h, label = "") {
  roundedRect(x, y, w, h, 10, "rgba(13, 18, 24, 0.68)", "rgba(180, 205, 225, 0.22)");
  if (label) drawSmall(label, x + 14, y + 18, colors.muted);
}

function drawDiamond(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drawSparkles(count, color = "rgba(255,255,255,0.18)") {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = (i * 137.5 + elapsed * 12) % W;
    const y = (i * 71.3 + Math.sin(elapsed + i) * 9 + H) % H;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawText(text, x, y, size = 22, color = colors.text, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawSmall(text, x, y, color = colors.muted, align = "left") {
  ctx.fillStyle = color;
  ctx.font = "500 16px system-ui, sans-serif";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawBar(x, y, w, h, value, max, color, label) {
  roundedRect(x, y, w, h, 7, "rgba(5, 9, 14, 0.72)", "rgba(220, 235, 245, 0.18)");
  ctx.save();
  ctx.beginPath();
  roundedRect(x, y, w, h, 7, null);
  ctx.clip();
  const fill = ctx.createLinearGradient(x, y, x + w, y);
  fill.addColorStop(0, color);
  fill.addColorStop(1, "rgba(255,255,255,0.72)");
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * clamp(value / max, 0, 1), h);
  ctx.restore();
  drawSmall(label, x + 8, y + h / 2, colors.text);
}

function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function movePoint(p, speed, dt) {
  if (keys.has("ArrowLeft") || isMoveKey("left")) p.x -= speed * dt;
  if (keys.has("ArrowRight") || isMoveKey("right")) p.x += speed * dt;
  if (keys.has("ArrowUp") || isMoveKey("up")) p.y -= speed * dt;
  if (keys.has("ArrowDown") || isMoveKey("down")) p.y += speed * dt;
  p.x = clamp(p.x, 20, W - 20);
  p.y = clamp(p.y, 20, H - 20);
}

const games = [
  {
    id: "necromancer",
    title: "Night Shift Necromancer",
    kicker: "Prototype 01",
    accent: colors.violet,
    goal: "Sort spirits into the matching ritual desk before the queue overwhelms you.",
    controls: "Arrow keys move. Space picks up or drops a spirit.",
    init() {
      this.player = { x: W / 2, y: H - 80 };
      this.carry = null;
      this.spawn = 0;
      this.score = 0;
      this.strikes = 0;
      this.status = "Clocked in";
      this.types = [
        { name: "Memory", color: colors.blue, x: 150, y: 110 },
        { name: "Grudge", color: colors.red, x: 380, y: 110 },
        { name: "Oath", color: colors.green, x: 610, y: 110 },
        { name: "Debt", color: colors.gold, x: 830, y: 110 }
      ];
      this.ghosts = [];
    },
    update(dt) {
      movePoint(this.player, 250, dt);
      this.spawn -= dt;
      if (this.spawn <= 0) {
        const type = Math.floor(rand(0, this.types.length));
        this.ghosts.push({ x: rand(80, W - 80), y: H + 20, type, patience: 12 });
        this.spawn = Math.max(0.8, 2.2 - this.score * 0.03);
      }
      for (const ghost of this.ghosts) {
        ghost.y -= 18 * dt;
        ghost.patience -= dt;
      }
      const expired = this.ghosts.filter((g) => g.patience <= 0).length;
      if (expired) {
        this.strikes += expired;
        this.status = "Queue slipping";
      }
      this.ghosts = this.ghosts.filter((g) => g.patience > 0 && g.y > 155);
      if (this.strikes >= 5) this.status = "Overrun. Restart.";
    },
    action() {
      if (this.strikes >= 5) return;
      if (this.carry) {
        const desk = this.types[this.carry.type];
        if (Math.hypot(this.player.x - desk.x, this.player.y - desk.y) < 72) {
          this.score += 10;
          this.status = `${desk.name} resolved`;
          this.carry = null;
        }
        return;
      }
      let nearest = null;
      let best = 999;
      for (const ghost of this.ghosts) {
        const d = Math.hypot(this.player.x - ghost.x, this.player.y - ghost.y);
        if (d < best && d < 46) {
          nearest = ghost;
          best = d;
        }
      }
      if (nearest) {
        this.carry = nearest;
        this.ghosts = this.ghosts.filter((g) => g !== nearest);
        this.status = `Carrying ${this.types[nearest.type].name}`;
      }
    },
    draw() {
      scene("necromancer");
      drawSparkles(36, "rgba(178,140,255,0.22)");
      panel(28, 72, 904, 94, "Ritual desks");
      for (const desk of this.types) {
        roundedRect(desk.x - 64, desk.y - 38, 128, 76, 8, "rgba(22, 30, 41, 0.92)", desk.color);
        glowCircle(desk.x - 42, desk.y, 7, desk.color, 12);
        drawSmall(desk.name, desk.x, desk.y, colors.text, "center");
      }
      for (const ghost of this.ghosts) {
        const type = this.types[ghost.type];
        glowCircle(ghost.x, ghost.y, 23, type.color, 20);
        circle(ghost.x - 7, ghost.y - 6, 4, "#111318");
        circle(ghost.x + 7, ghost.y - 6, 4, "#111318");
        drawSmall(Math.ceil(ghost.patience), ghost.x, ghost.y + 1, "#101318", "center");
      }
      glowCircle(this.player.x, this.player.y, 23, colors.violet, 18);
      drawText("N", this.player.x, this.player.y, 18, "#101318", "center");
      if (this.carry) glowCircle(this.player.x, this.player.y - 38, 15, this.types[this.carry.type].color, 16);
      drawSmall(`Strikes ${this.strikes}/5`, 24, 28, this.strikes >= 4 ? colors.red : colors.muted);
    }
  },
  {
    id: "planet",
    title: "Tiny Planet Salvage",
    kicker: "Prototype 02",
    accent: colors.green,
    goal: "Circle the planet, collect scrap, and avoid orbiting hazards.",
    controls: "Left/right drive. Space boosts over hazards.",
    init() {
      this.angle = -Math.PI / 2;
      this.boost = 0;
      this.score = 0;
      this.status = "Surveying";
      this.scraps = Array.from({ length: 9 }, () => ({ a: rand(0, Math.PI * 2), taken: false }));
      this.hazards = Array.from({ length: 4 }, () => ({ a: rand(0, Math.PI * 2), s: rand(0.45, 0.9) }));
      this.hits = 0;
    },
    update(dt) {
      if (keys.has("ArrowLeft") || keys.has("a")) this.angle -= 2.2 * dt;
      if (keys.has("ArrowRight") || keys.has("d")) this.angle += 2.2 * dt;
      this.boost = Math.max(0, this.boost - dt);
      for (const h of this.hazards) h.a += h.s * dt;
      const player = this.pos(this.angle, 148 + (this.boost > 0 ? 38 : 0));
      for (const scrap of this.scraps) {
        if (!scrap.taken && dist(player, this.pos(scrap.a, 150)) < 30) {
          scrap.taken = true;
          this.score += 8;
          this.status = "Scrap recovered";
        }
      }
      for (const h of this.hazards) {
        if (this.boost <= 0 && dist(player, this.pos(h.a, 150)) < 24) {
          this.hits += 1;
          this.angle += 0.8;
          this.status = "Hull clipped";
        }
      }
      if (this.scraps.every((s) => s.taken)) this.status = "Planet cleared";
    },
    action() {
      if (this.boost <= 0) this.boost = 0.55;
    },
    pos(a, r) {
      return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r };
    },
    draw() {
      scene("planet");
      drawSparkles(70, "rgba(180,230,255,0.2)");
      ctx.strokeStyle = "rgba(97,200,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 150, 0, Math.PI * 2);
      ctx.stroke();
      glowCircle(W / 2, H / 2, 118, "#31533f", 24);
      circle(W / 2 - 35, H / 2 - 18, 18, "#76ad78");
      circle(W / 2 + 48, H / 2 + 34, 26, "#243e32");
      circle(W / 2 + 10, H / 2 - 58, 12, "#86c17a");
      for (const scrap of this.scraps) if (!scrap.taken) {
        const p = this.pos(scrap.a, 150);
        drawDiamond(p.x, p.y, 10, colors.gold);
      }
      for (const h of this.hazards) {
        const p = this.pos(h.a, 150);
        glowCircle(p.x, p.y, 13, colors.red, 18);
      }
      const rover = this.pos(this.angle, 148 + (this.boost > 0 ? 38 : 0));
      glowCircle(rover.x, rover.y, 17, this.boost > 0 ? colors.gold : colors.blue, 18);
      rect(rover.x - 12, rover.y - 5, 24, 10, "#d7e5ef");
      drawSmall(`Hull hits ${this.hits}`, 24, 28);
    }
  },
  {
    id: "lighthouse",
    title: "The Last Lighthouse",
    kicker: "Prototype 03",
    accent: colors.gold,
    goal: "Sweep the light across incoming ships before they reach the rocks.",
    controls: "Left/right rotate the beam. Space sends a flare pulse.",
    init() {
      this.angle = -Math.PI / 2;
      this.spawn = 0;
      this.ships = [];
      this.pulse = 0;
      this.score = 0;
      this.lives = 5;
      this.status = "Lamp lit";
    },
    update(dt) {
      if (keys.has("ArrowLeft") || keys.has("a")) this.angle -= 2.4 * dt;
      if (keys.has("ArrowRight") || keys.has("d")) this.angle += 2.4 * dt;
      this.pulse = Math.max(0, this.pulse - dt);
      this.spawn -= dt;
      if (this.spawn <= 0) {
        const edge = rand(0, Math.PI * 2);
        this.ships.push({ x: W / 2 + Math.cos(edge) * 440, y: H / 2 + Math.sin(edge) * 270, safe: false });
        this.spawn = 1.4;
      }
      for (const ship of this.ships) {
        const dx = W / 2 - ship.x;
        const dy = H / 2 - ship.y;
        const len = Math.hypot(dx, dy);
        ship.x += (dx / len) * 42 * dt;
        ship.y += (dy / len) * 42 * dt;
        const shipAngle = Math.atan2(ship.y - H / 2, ship.x - W / 2);
        let diff = Math.abs(Math.atan2(Math.sin(shipAngle - this.angle), Math.cos(shipAngle - this.angle)));
        if (diff < (this.pulse > 0 ? 0.32 : 0.18)) {
          ship.safe = true;
          this.score += 6;
          this.status = "Ship guided";
        }
        if (!ship.safe && len < 88) {
          this.lives -= 1;
          ship.safe = true;
          this.status = "Ship lost";
        }
      }
      this.ships = this.ships.filter((s) => !s.safe);
      if (this.lives <= 0) this.status = "Light failed. Restart.";
    },
    action() {
      this.pulse = 0.45;
    },
    draw() {
      scene("lighthouse");
      for (let i = 0; i < 7; i += 1) {
        ctx.strokeStyle = `rgba(97,200,255,${0.08 + i * 0.01})`;
        ctx.beginPath();
        ctx.moveTo(0, 430 + i * 18 + Math.sin(elapsed + i) * 6);
        ctx.bezierCurveTo(240, 390 + i * 16, 520, 470 + i * 10, W, 420 + i * 18);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.pulse > 0 ? "rgba(255, 232, 145, 0.42)" : "rgba(255, 200, 87, 0.26)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(430, -55);
      ctx.lineTo(430, 55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      glowCircle(W / 2, H / 2, 48, "#ffe891", 28);
      roundedRect(W / 2 - 24, H / 2 - 94, 48, 110, 10, "#7a838d", "#cdd6df");
      rect(W / 2 - 34, H / 2 + 16, 68, 24, "#495563");
      for (const ship of this.ships) {
        roundedRect(ship.x - 17, ship.y - 9, 34, 18, 5, colors.blue);
        ctx.beginPath();
        ctx.moveTo(ship.x - 1, ship.y - 22);
        ctx.lineTo(ship.x + 18, ship.y - 3);
        ctx.lineTo(ship.x - 1, ship.y - 3);
        ctx.fillStyle = colors.text;
        ctx.fill();
      }
      drawSmall(`Lives ${this.lives}`, 24, 28, this.lives <= 2 ? colors.red : colors.muted);
    }
  },
  {
    id: "witch",
    title: "Button Witch",
    kicker: "Prototype 04",
    accent: colors.violet,
    goal: "Type spell sequences to stop the advancing training dummies.",
    controls: "Type the shown letters. Space skips a spell at a cost.",
    init() {
      this.letters = "QWERASDF";
      this.sequence = this.newSpell();
      this.progress = 0;
      this.enemies = [];
      this.spawn = 0;
      this.score = 0;
      this.health = 5;
      this.status = "Spellbook open";
    },
    newSpell() {
      const len = Math.floor(rand(3, 6));
      return Array.from({ length: len }, () => this.letters[Math.floor(rand(0, this.letters.length))]);
    },
    update(dt) {
      this.spawn -= dt;
      if (this.spawn <= 0) {
        this.enemies.push({ x: W + 20, y: rand(150, H - 80), speed: rand(35, 65) });
        this.spawn = Math.max(0.6, 1.6 - this.score * 0.01);
      }
      for (const e of this.enemies) e.x -= e.speed * dt;
      const hits = this.enemies.filter((e) => e.x < 80).length;
      if (hits) {
        this.health -= hits;
        this.status = "Ward struck";
      }
      this.enemies = this.enemies.filter((e) => e.x >= 80);
      if (this.health <= 0) this.status = "Ward broken. Restart.";
    },
    key(key) {
      const k = key.toUpperCase();
      if (this.letters.includes(k)) {
        if (k === this.sequence[this.progress]) {
          this.progress += 1;
          if (this.progress >= this.sequence.length) {
            this.enemies.shift();
            this.score += 12;
            this.sequence = this.newSpell();
            this.progress = 0;
            this.status = "Spell landed";
          }
        } else {
          this.progress = 0;
          this.status = "Miscast";
        }
      }
    },
    action() {
      this.sequence = this.newSpell();
      this.progress = 0;
      this.health = Math.max(1, this.health - 1);
      this.status = "Spell skipped";
    },
    draw() {
      scene("witch");
      drawSparkles(44, "rgba(255,200,87,0.18)");
      ctx.save();
      ctx.shadowColor = colors.violet;
      ctx.shadowBlur = 24;
      roundedRect(50, 96, 34, 430, 16, colors.violet);
      ctx.restore();
      for (const e of this.enemies) {
        glowCircle(e.x, e.y, 20, colors.red, 16);
        roundedRect(e.x - 13, e.y + 17, 26, 28, 7, "#7d3841");
        circle(e.x - 7, e.y - 5, 3, "#111318");
        circle(e.x + 7, e.y - 5, 3, "#111318");
      }
      glowCircle(95, H / 2, 30, colors.gold, 24);
      panel(250, 54, 460, 108);
      drawText(this.sequence.join(" "), W / 2, 96, 38, colors.text, "center");
      drawSmall("^".repeat(this.progress), W / 2, 138, colors.green, "center");
      drawSmall(`Ward ${this.health}`, 24, 28, this.health <= 2 ? colors.red : colors.muted);
    }
  },
  {
    id: "museum",
    title: "Museum of Stolen Time",
    kicker: "Prototype 05",
    accent: colors.orange,
    goal: "Set each exhibit to its correct time phase before instability peaks.",
    controls: "Left/right select an exhibit. Space advances its phase.",
    init() {
      this.items = Array.from({ length: 5 }, (_, i) => ({ phase: Math.floor(rand(0, 4)), target: i % 4 }));
      this.selected = 0;
      this.instability = 0;
      this.score = 0;
      this.status = "Gallery locked";
    },
    update(dt) {
      this.instability += dt * 2.2;
      if (this.items.every((i) => i.phase === i.target)) {
        this.score += 50;
        this.status = "Timeline restored";
        this.items = Array.from({ length: 5 }, () => ({ phase: Math.floor(rand(0, 4)), target: Math.floor(rand(0, 4)) }));
        this.instability = 0;
      }
      if (this.instability >= 100) this.status = "Timeline cracked. Restart.";
    },
    key(key) {
      if (key === "ArrowLeft") this.selected = (this.selected + this.items.length - 1) % this.items.length;
      if (key === "ArrowRight") this.selected = (this.selected + 1) % this.items.length;
    },
    action() {
      const item = this.items[this.selected];
      item.phase = (item.phase + 1) % 4;
      this.score += item.phase === item.target ? 5 : 0;
    },
    draw() {
      scene("museum");
      drawSparkles(26, "rgba(255,255,255,0.13)");
      drawBar(28, 28, 220, 18, this.instability, 100, colors.red, "Instability");
      this.items.forEach((item, index) => {
        const x = 150 + index * 165;
        roundedRect(x - 62, 176, 124, 206, 8, "rgba(29,39,50,0.92)", index === this.selected ? colors.gold : "rgba(170,190,210,0.24)");
        ctx.strokeStyle = index === this.selected ? colors.gold : colors.line;
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 54, 185, 108, 190);
        glowCircle(x, 265, 28 + item.phase * 5, [colors.blue, colors.green, colors.orange, colors.violet][item.phase], 20);
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(x, 265, 50, 0, Math.PI * 2 * ((item.phase + 1) / 4));
        ctx.stroke();
        drawText(`${item.phase}`, x, 344, 28, colors.text, "center");
        drawSmall(`Target ${item.target}`, x, 405, item.phase === item.target ? colors.green : colors.muted, "center");
      });
    }
  },
  {
    id: "delivery",
    title: "Delivery Knight",
    kicker: "Prototype 06",
    accent: colors.blue,
    goal: "Carry parcels from the depot to marked houses while avoiding bandits.",
    controls: "Arrow keys ride. Space picks up or drops off.",
    init() {
      this.player = { x: 105, y: 500 };
      this.depot = { x: 105, y: 500 };
      this.houses = [{ x: 790, y: 135 }, { x: 480, y: 470 }, { x: 815, y: 485 }];
      this.target = 0;
      this.carry = false;
      this.bandits = Array.from({ length: 4 }, () => ({ x: rand(240, 830), y: rand(120, 500), vx: rand(-70, 70), vy: rand(-60, 60) }));
      this.score = 0;
      this.hp = 5;
      this.status = "Route posted";
    },
    update(dt) {
      movePoint(this.player, 230, dt);
      for (const b of this.bandits) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 180 || b.x > 900) b.vx *= -1;
        if (b.y < 90 || b.y > 540) b.vy *= -1;
        if (dist(this.player, b) < 28) {
          this.hp -= 1;
          this.player.x = this.depot.x;
          this.player.y = this.depot.y;
          this.status = "Ambushed";
        }
      }
      if (this.hp <= 0) this.status = "Route failed. Restart.";
    },
    action() {
      if (!this.carry && dist(this.player, this.depot) < 55) {
        this.carry = true;
        this.status = "Parcel loaded";
      } else if (this.carry && dist(this.player, this.houses[this.target]) < 55) {
        this.carry = false;
        this.score += 20;
        this.target = (this.target + 1) % this.houses.length;
        this.status = "Delivered";
      }
    },
    draw() {
      scene("delivery");
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(105, 500);
      ctx.bezierCurveTo(250, 420, 385, 185, 790, 135);
      ctx.bezierCurveTo(670, 320, 610, 450, 480, 470);
      ctx.bezierCurveTo(620, 520, 725, 520, 815, 485);
      ctx.stroke();
      roundedRect(70, 465, 70, 70, 8, colors.gold, "#fff0b0");
      drawSmall("Depot", 105, 552, colors.text, "center");
      this.houses.forEach((h, i) => {
        roundedRect(h.x - 36, h.y - 30, 72, 60, 8, i === this.target ? colors.green : "#44505a", "rgba(255,255,255,0.22)");
        ctx.beginPath();
        ctx.moveTo(h.x - 42, h.y - 30);
        ctx.lineTo(h.x, h.y - 66);
        ctx.lineTo(h.x + 42, h.y - 30);
        ctx.fillStyle = i === this.target ? "#9ef0b5" : "#62707c";
        ctx.fill();
        drawSmall(`${i + 1}`, h.x, h.y, "#101318", "center");
      });
      for (const b of this.bandits) {
        glowCircle(b.x, b.y, 18, colors.red, 13);
        drawText("!", b.x, b.y, 20, "#101318", "center");
      }
      glowCircle(this.player.x, this.player.y, 21, colors.blue, 15);
      drawText("K", this.player.x, this.player.y, 16, "#101318", "center");
      if (this.carry) roundedRect(this.player.x - 12, this.player.y - 42, 24, 22, 4, colors.gold, "#fff0b0");
      drawSmall(`HP ${this.hp}`, 24, 28, this.hp <= 2 ? colors.red : colors.muted);
    }
  },
  {
    id: "chef",
    title: "Orbit Chef",
    kicker: "Prototype 07",
    accent: colors.orange,
    goal: "Catch floating ingredients in order and serve complete plates.",
    controls: "Arrow keys move the pan. Space serves or clears a bad plate.",
    init() {
      this.player = { x: W / 2, y: H / 2 };
      this.ingredients = ["Miso", "Lime", "Bean", "Star"];
      this.order = this.newOrder();
      this.plate = [];
      this.bits = Array.from({ length: 12 }, () => this.newBit());
      this.score = 0;
      this.status = "Order up";
    },
    newOrder() {
      return Array.from({ length: 3 }, () => this.ingredients[Math.floor(rand(0, this.ingredients.length))]);
    },
    newBit() {
      return { x: rand(40, W - 40), y: rand(80, H - 40), vx: rand(-70, 70), vy: rand(-70, 70), kind: Math.floor(rand(0, this.ingredients.length)) };
    },
    update(dt) {
      movePoint(this.player, 260, dt);
      for (const bit of this.bits) {
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        if (bit.x < 20 || bit.x > W - 20) bit.vx *= -1;
        if (bit.y < 80 || bit.y > H - 20) bit.vy *= -1;
        if (dist(this.player, bit) < 30) {
          this.plate.push(this.ingredients[bit.kind]);
          Object.assign(bit, this.newBit());
          this.status = "Ingredient caught";
        }
      }
      if (this.plate.length > 5) {
        this.plate = [];
        this.status = "Plate overflow";
      }
    },
    action() {
      if (this.plate.slice(0, this.order.length).join("|") === this.order.join("|")) {
        this.score += 25;
        this.order = this.newOrder();
        this.status = "Served";
      } else {
        this.status = "Plate cleared";
      }
      this.plate = [];
    },
    draw() {
      scene("chef");
      drawSparkles(60, "rgba(255,255,255,0.18)");
      const palette = [colors.gold, colors.green, colors.orange, colors.blue];
      panel(210, 20, 540, 76);
      drawText(`Order: ${this.order.join(" + ")}`, W / 2, 42, 24, colors.text, "center");
      drawSmall(`Plate: ${this.plate.join(" + ") || "empty"}`, W / 2, 76, colors.muted, "center");
      for (const bit of this.bits) {
        glowCircle(bit.x, bit.y, 15, palette[bit.kind], 15);
        drawSmall(this.ingredients[bit.kind][0], bit.x, bit.y, "#101318", "center");
      }
      roundedRect(this.player.x - 42, this.player.y - 12, 84, 24, 12, "#d7dbe0", "#ffffff");
      glowCircle(this.player.x, this.player.y, 22, colors.violet, 18);
    }
  },
  {
    id: "echo",
    title: "Echo Caves",
    kicker: "Prototype 08",
    accent: colors.blue,
    goal: "Use sound pulses to reveal walls and reach the exit.",
    controls: "Arrow keys move. Space emits a sonar pulse.",
    init() {
      this.map = [
        "################",
        "#P..#.....#....#",
        "#.#.#.###.#.##.#",
        "#.#...#...#....#",
        "#.#####.####.#.#",
        "#.......#....#E#",
        "################"
      ];
      this.tile = 58;
      this.offsetX = 16;
      this.offsetY = 92;
      this.player = { x: 1, y: 1 };
      this.pulse = 2;
      this.score = 0;
      this.status = "Listening";
      this.steps = 0;
    },
    update(dt) {
      this.pulse = Math.max(0, this.pulse - dt);
    },
    key(key) {
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!moves[key]) return;
      const [dx, dy] = moves[key];
      const nx = this.player.x + dx;
      const ny = this.player.y + dy;
      if (this.map[ny][nx] !== "#") {
        this.player.x = nx;
        this.player.y = ny;
        this.steps += 1;
        if (this.map[ny][nx] === "E") {
          this.score = Math.max(10, 200 - this.steps * 3);
          this.status = "Exit found";
        }
      }
    },
    action() {
      this.pulse = 2.4;
      this.status = "Echo cast";
    },
    draw() {
      scene("echo");
      for (let y = 0; y < this.map.length; y += 1) {
        for (let x = 0; x < this.map[y].length; x += 1) {
          const d = Math.hypot(x - this.player.x, y - this.player.y);
          const visible = d < 1.7 || (this.pulse > 0 && d < 4.8);
          if (!visible) continue;
          const px = this.offsetX + x * this.tile;
          const py = this.offsetY + y * this.tile;
          const alpha = clamp(1 - d / 5.5, 0.28, 1);
          ctx.globalAlpha = alpha;
          if (this.map[y][x] === "#") roundedRect(px, py, this.tile - 4, this.tile - 4, 6, "#30404d", "#506070");
          else roundedRect(px, py, this.tile - 4, this.tile - 4, 6, "#121b24", "rgba(97,200,255,0.1)");
          if (this.map[y][x] === "E") glowCircle(px + 27, py + 27, 18, colors.green, 22);
          ctx.globalAlpha = 1;
        }
      }
      glowCircle(this.offsetX + this.player.x * this.tile + 27, this.offsetY + this.player.y * this.tile + 27, 18, colors.blue, 22);
      if (this.pulse > 0) {
        ctx.strokeStyle = "rgba(97, 200, 255, 0.45)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.offsetX + this.player.x * this.tile + 27, this.offsetY + this.player.y * this.tile + 27, (2.4 - this.pulse) * 120, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawSmall(`Steps ${this.steps}`, 24, 28);
    }
  },
  {
    id: "kaiju",
    title: "Pocket Kaiju Rehab",
    kicker: "Prototype 09",
    accent: colors.green,
    goal: "Balance hunger, trust, and city repairs for as many days as possible.",
    controls: "Press 1 Feed, 2 Train, 3 Rebuild. Space performs the weakest need.",
    init() {
      this.hunger = 62;
      this.trust = 45;
      this.city = 55;
      this.day = 1;
      this.tick = 0;
      this.score = 0;
      this.status = "Intake started";
    },
    update(dt) {
      this.tick += dt;
      if (this.tick > 2.4) {
        this.tick = 0;
        this.day += 1;
        this.hunger -= rand(7, 13);
        this.trust -= rand(5, 10);
        this.city -= rand(4, 9);
        this.score = this.day * 10;
        this.status = "New day";
      }
      if (Math.min(this.hunger, this.trust, this.city) <= 0) this.status = "Rehab failed. Restart.";
    },
    key(key) {
      if (key === "1") this.feed();
      if (key === "2") this.train();
      if (key === "3") this.rebuild();
    },
    action() {
      const min = Math.min(this.hunger, this.trust, this.city);
      if (min === this.hunger) this.feed();
      else if (min === this.trust) this.train();
      else this.rebuild();
    },
    feed() {
      this.hunger = clamp(this.hunger + 20, 0, 100);
      this.city = clamp(this.city - 4, 0, 100);
      this.status = "Fed";
    },
    train() {
      this.trust = clamp(this.trust + 18, 0, 100);
      this.hunger = clamp(this.hunger - 6, 0, 100);
      this.status = "Trained";
    },
    rebuild() {
      this.city = clamp(this.city + 20, 0, 100);
      this.trust = clamp(this.trust - 4, 0, 100);
      this.status = "Rebuilt";
    },
    draw() {
      scene("kaiju");
      for (let i = 0; i < 7; i += 1) {
        roundedRect(62 + i * 126, 422 - (i % 3) * 28, 72, 90 + (i % 4) * 16, 6, "#26332d", "rgba(255,255,255,0.12)");
      }
      glowCircle(W / 2, 315, 105, "#567864", 22);
      ctx.beginPath();
      ctx.moveTo(W / 2 - 74, 220);
      ctx.lineTo(W / 2 - 48, 170);
      ctx.lineTo(W / 2 - 22, 222);
      ctx.moveTo(W / 2 + 22, 222);
      ctx.lineTo(W / 2 + 48, 170);
      ctx.lineTo(W / 2 + 74, 220);
      ctx.fillStyle = "#6c9174";
      ctx.fill();
      glowCircle(W / 2 - 48, 260, 20, colors.gold, 14);
      glowCircle(W / 2 + 48, 260, 20, colors.gold, 14);
      roundedRect(W / 2 - 58, 360, 116, 16, 8, "#26352d");
      drawBar(80, 72, 260, 24, this.hunger, 100, colors.gold, "1 Hunger");
      drawBar(350, 72, 260, 24, this.trust, 100, colors.blue, "2 Trust");
      drawBar(620, 72, 260, 24, this.city, 100, colors.green, "3 City");
      drawText(`Day ${this.day}`, W / 2, 505, 34, colors.text, "center");
    }
  },
  {
    id: "train",
    title: "Train to Nowhere",
    kicker: "Prototype 10",
    accent: colors.gold,
    goal: "Choose train cars to keep fuel and morale alive until the engine room.",
    controls: "Press 1, 2, or 3 to choose a car. Space chooses the safest visible option.",
    init() {
      this.fuel = 70;
      this.morale = 65;
      this.distance = 0;
      this.score = 0;
      this.cards = this.deal();
      this.status = "Rolling";
    },
    deal() {
      const deck = [
        { name: "Coal Tender", fuel: 22, morale: -5 },
        { name: "Dining Car", fuel: -8, morale: 20 },
        { name: "Quiet Sleeper", fuel: -4, morale: 12 },
        { name: "Broken Bridge", fuel: -18, morale: -10 },
        { name: "Ticket Cache", fuel: 8, morale: 8 },
        { name: "Fog Engine", fuel: -12, morale: 3 }
      ];
      return Array.from({ length: 3 }, () => deck[Math.floor(rand(0, deck.length))]);
    },
    update(dt) {
      this.fuel -= dt * 2.2;
      this.morale -= dt * 1.2;
      if (this.fuel <= 0 || this.morale <= 0) this.status = "Stranded. Restart.";
      if (this.distance >= 100) this.status = "Engine room reached";
    },
    key(key) {
      if (["1", "2", "3"].includes(key)) this.choose(Number(key) - 1);
    },
    action() {
      let best = 0;
      let bestValue = -999;
      this.cards.forEach((card, i) => {
        const value = card.fuel + card.morale;
        if (value > bestValue) {
          bestValue = value;
          best = i;
        }
      });
      this.choose(best);
    },
    choose(index) {
      const card = this.cards[index];
      if (!card || this.status.includes("Restart") || this.status.includes("reached")) return;
      this.fuel = clamp(this.fuel + card.fuel, 0, 100);
      this.morale = clamp(this.morale + card.morale, 0, 100);
      this.distance += 12;
      this.score = this.distance;
      this.status = card.name;
      this.cards = this.deal();
    },
    draw() {
      scene("train");
      drawSparkles(36, "rgba(255,200,87,0.14)");
      drawBar(70, 56, 260, 22, this.fuel, 100, colors.gold, "Fuel");
      drawBar(350, 56, 260, 22, this.morale, 100, colors.green, "Morale");
      drawBar(630, 56, 260, 22, this.distance, 100, colors.blue, "Distance");
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(100, 500);
      ctx.lineTo(860, 500);
      ctx.moveTo(100, 535);
      ctx.lineTo(860, 535);
      ctx.stroke();
      roundedRect(150, 405, 660, 70, 12, "#273240", "#4a5a6a");
      for (let i = 0; i < 5; i += 1) roundedRect(190 + i * 120, 365, 80, 40, 8, "#202833", "#4a5a6a");
      glowCircle(785, 440, 16, colors.gold, 22);
      this.cards.forEach((card, index) => {
        const x = 160 + index * 250;
        roundedRect(x, 150, 210, 150, 10, "rgba(32,40,51,0.94)", index === 0 ? "rgba(255,200,87,0.5)" : colors.line);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(x + 1, 151, 208, 38);
        drawText(`${index + 1}`, x + 26, 180, 26, colors.gold);
        drawText(card.name, x + 105, 215, 22, colors.text, "center");
        drawSmall(`Fuel ${card.fuel > 0 ? "+" : ""}${card.fuel}`, x + 105, 254, card.fuel >= 0 ? colors.green : colors.red, "center");
        drawSmall(`Morale ${card.morale > 0 ? "+" : ""}${card.morale}`, x + 105, 282, card.morale >= 0 ? colors.green : colors.red, "center");
      });
    }
  }
];

function selectGame(index) {
  current = index;
  paused = false;
  mode = "intro";
  elapsed = 0;
  stopAmbient();
  const game = games[current];
  game.init();
  previousStatus = game.status;
  document.documentElement.style.setProperty("--accent", game.accent || colors.gold);
  titleEl.textContent = game.title;
  kickerEl.textContent = game.kicker;
  goalEl.textContent = game.goal;
  controlsEl.textContent = game.controls;
  [...gameList.children].forEach((button, i) => button.setAttribute("aria-current", String(i === index)));
  showOverlay("intro", game.title, arcade.tutorials[game.id] ? game.goal : `${game.goal} First run tip: ${game.controls}`, "Start");
  updateProgressUI();
}

games.forEach((game, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.style.setProperty("--game-color", game.accent || colors.gold);
  button.innerHTML = `<i class="game-icon" aria-hidden="true"></i><strong>${game.title}</strong><span class="game-meta">${game.kicker}</span>`;
  button.addEventListener("click", () => selectGame(index));
  gameList.appendChild(button);
});

document.getElementById("restartGame").addEventListener("click", () => selectGame(current));
document.getElementById("pauseGame").addEventListener("click", () => {
  if (mode !== "playing") return;
  paused = !paused;
  statusEl.textContent = paused ? "Paused" : games[current].status;
});
document.getElementById("fullscreenGame").addEventListener("click", () => {
  const target = document.querySelector(".stage");
  if (!document.fullscreenElement) target.requestFullscreen?.();
  else document.exitFullscreen?.();
});
document.getElementById("settingsToggle").addEventListener("click", () => settingsPanel.classList.add("is-open"));
document.getElementById("closeSettings").addEventListener("click", () => settingsPanel.classList.remove("is-open"));

overlayPrimaryEl.addEventListener("click", () => {
  games[current].init();
  startGame();
});
overlaySecondaryEl.addEventListener("click", () => {
  const next = mode === "intro" ? Math.floor(rand(0, games.length)) : (current + 1) % games.length;
  selectGame(next);
});

difficultySelect.addEventListener("change", () => {
  settings.difficulty = difficultySelect.value;
  saveSettings();
  mode = "intro";
  paused = false;
  stopAmbient();
  showOverlay("intro", games[current].title, games[current].goal, "Restart With Setting");
});

[
  [soundToggle, "sound"],
  [musicToggle, "music"],
  [reducedMotionToggle, "reducedMotion"],
  [highContrastToggle, "highContrast"],
  [largeTextToggle, "largeText"]
].forEach(([input, key]) => {
  input.addEventListener("change", () => {
    settings[key] = input.checked;
    saveSettings();
    applySettings();
  });
});

document.querySelectorAll("[data-bind]").forEach((button) => {
  button.addEventListener("click", () => {
    bindingTarget = button.dataset.bind;
    document.getElementById("settingsHint").textContent = `Press a key for ${bindingTarget}.`;
  });
});

document.querySelectorAll("[data-touch]").forEach((button) => {
  const key = button.dataset.touch;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys.add(key);
    if (key === " " && mode === "playing" && !paused) games[current].action?.();
  });
  button.addEventListener("pointerup", () => keys.delete(key));
  button.addEventListener("pointerleave", () => keys.delete(key));
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (bindingTarget) {
    settings.bindings[bindingTarget] = event.key;
    bindingTarget = null;
    document.getElementById("settingsHint").textContent = "Click a binding, then press a key.";
    saveSettings();
    applySettings();
    return;
  }
  if (event.key === "p" || event.key === "P") {
    if (mode === "playing") paused = !paused;
    return;
  }
  if (event.key === "Enter" && mode !== "playing") {
    games[current].init();
    startGame();
    return;
  }
  keys.add(event.key);
  if (mode !== "playing" || paused) return;
  if (isActionKey(event.key)) games[current].action?.();
  games[current].key?.(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  const game = games[current];
  pollGamepad();
  if (mode === "playing" && !paused) {
    elapsed += dt;
    game.update(dt * difficultyValue());
    if (game.status !== previousStatus) {
      if (/recovered|resolved|guided|landed|restored|Delivered|caught|Served|Fed|Trained|Rebuilt|loaded|cleared|found|reached/i.test(game.status)) playTone("pickup");
      if (/clipped|lost|struck|Miscast|Ambushed|overflow|failed|broken|Stranded|Restart/i.test(game.status)) playTone("hit");
      previousStatus = game.status;
    }
    detectMilestones(game);
    detectEnding(game);
    checkAchievements();
  }
  game.draw();
  if (mode !== "playing") drawTitleCurtain(game);
  scoreEl.textContent = `Score ${Math.floor((game.score || 0) * scoreMultiplier())}`;
  timeEl.textContent = `Time ${formatTime(elapsed)}`;
  statusEl.textContent = paused ? "Paused" : game.status;
  requestAnimationFrame(frame);
}

function pollGamepad() {
  keys.delete("Gamepadup");
  keys.delete("Gamepaddown");
  keys.delete("Gamepadleft");
  keys.delete("Gamepadright");
  const pad = Array.from(navigator.getGamepads?.() || []).find(Boolean);
  if (!pad) return;
  const x = pad.axes[0] || 0;
  const y = pad.axes[1] || 0;
  if (x < -0.35 || pad.buttons[14]?.pressed) keys.add("Gamepadleft");
  if (x > 0.35 || pad.buttons[15]?.pressed) keys.add("Gamepadright");
  if (y < -0.35 || pad.buttons[12]?.pressed) keys.add("Gamepadup");
  if (y > 0.35 || pad.buttons[13]?.pressed) keys.add("Gamepaddown");
  if (pad.buttons[0]?.pressed && mode === "playing" && !paused && !pollGamepad.wasPressed) {
    games[current].action?.();
    pollGamepad.wasPressed = true;
  }
  if (!pad.buttons[0]?.pressed) pollGamepad.wasPressed = false;
}

function detectMilestones(game) {
  let changed = false;
  if (game.id === "planet" && game.status === "Planet cleared" && !arcade.flags["planet-cleared"]) changed = arcade.flags["planet-cleared"] = true;
  if (game.id === "echo" && game.status === "Exit found" && !arcade.flags["echo-exit"]) changed = arcade.flags["echo-exit"] = true;
  if (game.id === "train" && game.status === "Engine room reached" && !arcade.flags["train-win"]) changed = arcade.flags["train-win"] = true;
  if (game.id === "kaiju" && game.day >= 7 && !arcade.flags["kaiju-week"]) changed = arcade.flags["kaiju-week"] = true;
  if (changed) saveArcade();
}

function detectEnding(game) {
  const status = game.status || "";
  if (status.includes("Restart") || status.includes("failed") || status.includes("broken") || status.includes("Stranded")) {
    finishGame("loss", status);
  } else if (status === "Planet cleared" || status === "Exit found" || status === "Engine room reached") {
    finishGame("win", status);
  }
}

function drawTitleCurtain(game) {
  ctx.save();
  ctx.globalAlpha = overlayEl.classList.contains("is-open") ? 0.16 : 0.36;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  drawText(game.title, W / 2, H - 78, 24, game.accent || colors.gold, "center");
  ctx.restore();
}

applySettings();
updateProgressUI();
selectGame(0);
requestAnimationFrame(frame);
