(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const TAU = Math.PI * 2;
  const KEY = "neonSiegeProgressV2";
  const modes = {
    survival: "Survival",
    score: "Score Attack",
    boss: "Boss Rush",
    daily: "Daily Seed"
  };
  const weapons = {
    blaster: { name: "Blaster", color: "#e6fbff", rate: 0.15, dmg: 1, speed: 650, life: 1.1, count: 1, spread: 0, pierce: 0, bounce: 0 },
    rapid: { name: "Rapid Fire", color: "#95ffef", rate: 0.065, dmg: 1, speed: 690, life: 0.92, count: 1, spread: 0, pierce: 0, bounce: 0 },
    shotgun: { name: "Shotgun", color: "#ffd36e", rate: 0.38, dmg: 1, speed: 610, life: 0.58, count: 6, spread: 0.56, pierce: 0, bounce: 0 },
    rail: { name: "Rail Beam", color: "#ff72d2", rate: 0.42, dmg: 4, speed: 920, life: 0.72, count: 1, spread: 0, pierce: 6, bounce: 0 },
    bounce: { name: "Bounce Shots", color: "#b9ff67", rate: 0.18, dmg: 1, speed: 620, life: 1.6, count: 2, spread: 0.14, pierce: 0, bounce: 3 }
  };
  const enemyTypes = {
    runner: { name: "Runner", color: "#ff5f7d", r: 13, speed: 138, hp: 2, score: 2, dmg: 22 },
    tank: { name: "Tank", color: "#ff9a64", r: 24, speed: 70, hp: 8, score: 7, dmg: 32 },
    splitter: { name: "Splitter", color: "#b9ff67", r: 19, speed: 94, hp: 4, score: 5, dmg: 24 },
    sniper: { name: "Sniper", color: "#f7f2a1", r: 16, speed: 62, hp: 3, score: 6, dmg: 18 },
    exploder: { name: "Exploder", color: "#ff4b38", r: 18, speed: 126, hp: 3, score: 5, dmg: 48 },
    summoner: { name: "Summoner", color: "#c285ff", r: 21, speed: 58, hp: 5, score: 8, dmg: 18 }
  };
  const upgrades = [
    ["Hotter Rounds", "+1 bullet damage", (s) => { s.stats.dmg += 1; }],
    ["Fast Trigger", "Fire 12% faster", (s) => { s.stats.rate *= 0.88; }],
    ["Light Boots", "+12% move speed", (s) => { s.stats.speed += 34; }],
    ["Bigger Battery", "+20 max HP and heal", (s) => { s.player.max += 20; s.player.hp = Math.min(s.player.max, s.player.hp + 36); }],
    ["Tuned Chamber", "Weapon pickups last longer", (s) => { s.stats.weaponTime += 2.5; }],
    ["Phase Dash", "Dash cools down faster", (s) => { s.stats.dash = Math.max(0.58, s.stats.dash - 0.18); }],
    ["Lucky Capacitor", "+10% critical chance", (s) => { s.stats.crit += 0.1; }],
    ["Laser Drone", "Gain an orbiting helper", (s) => { s.stats.drones = Math.min(3, s.stats.drones + 1); }]
  ];

  class Input {
    constructor() {
      this.keys = Object.create(null);
      this.prev = Object.create(null);
      this.mouse = { x: W / 2, y: H / 2, down: false };
      window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        this.keys[key] = true;
        if ("wasd arrowup arrowdown arrowleft arrowright   enter escape p r q e 1 2 3 4".includes(key)) event.preventDefault();
      });
      window.addEventListener("keyup", (event) => { this.keys[event.key.toLowerCase()] = false; });
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * W;
        this.mouse.y = ((event.clientY - rect.top) / rect.height) * H;
      });
      canvas.addEventListener("mousedown", () => { this.mouse.down = true; audioReady(); });
      window.addEventListener("mouseup", () => { this.mouse.down = false; });
      window.addEventListener("blur", () => {
        this.keys = Object.create(null);
        this.prev = Object.create(null);
        this.mouse.down = false;
      });
    }
    down() { return Array.from(arguments).some((key) => this.keys[key]); }
    pressed() { return Array.from(arguments).some((key) => this.keys[key] && !this.prev[key]); }
    end() { this.prev = { ...this.keys }; }
  }

  function makeRng(seed) {
    let value = seed >>> 0;
    return function () {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function dailySeed() {
    const now = new Date();
    return Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
  }
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const roll = () => state && state.rng ? state.rng() : Math.random();
  const rand = (min, max) => min + roll() * (max - min);
  const pick = (items) => items[Math.floor(roll() * items.length)];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { best: 0, coins: 0, wave: 0, unlocks: ["blaster"] };
    } catch (error) {
      return { best: 0, coins: 0, wave: 0, unlocks: ["blaster"] };
    }
  }
  function saveProgress() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (error) {}
  }
  function menu() {
    if (window.top && window.top !== window) window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
    else window.location.href = "../index.html";
  }

  let audio = null;
  function audioReady() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audio && AudioContext) audio = new AudioContext();
    if (audio && audio.state === "suspended") audio.resume();
  }
  function beep(freq, dur, type, vol) {
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  }

  const progress = loadProgress();
  const input = new Input();
  let state = freshState();
  let last = performance.now();

  function freshState() {
    return {
      screen: "title", mode: "survival", message: "Press 1, 2, 3, or 4 to choose a mode. Enter starts.",
      score: 0, coinsEarned: 0, time: 0, limit: 180, wave: 0, kills: 0, target: 8,
      spawn: 0, pickup: 8, hazard: 4, fire: 0, flash: 0, shake: 0, weapon: "blaster", weaponTime: 0, droneFire: 0,
      choices: [], selected: 0, rng: null, seedLabel: "",
      stats: { speed: 255, dmg: 1, rate: 1, crit: 0.05, dash: 1.45, weaponTime: 0, drones: progress.unlocks.includes("drone") ? 1 : 0 },
      player: { x: W / 2, y: H / 2, r: 16, hp: 110, max: 110, dash: 0, inv: 0 },
      bullets: [], enemyShots: [], enemies: [], pickups: [], hazards: [], particles: [], numbers: []
    };
  }
  function start(mode) {
    const selected = mode || state.mode;
    state = freshState();
    state.mode = selected;
    if (selected === "daily") {
      const seed = dailySeed();
      state.rng = makeRng(seed);
      state.seedLabel = String(seed);
    }
    state.screen = "playing";
    if (selected === "boss") state.wave = 4;
    nextWave();
    beep(330, 0.08, "triangle", 0.045);
  }
  function over(message) {
    if (state.screen === "gameover") return;
    state.screen = "gameover";
    state.message = message || "The siege broke through. Press R to restart.";
    state.coinsEarned = Math.max(1, Math.floor(state.score / 18) + state.wave);
    progress.coins += state.coinsEarned;
    progress.best = Math.max(progress.best, state.score);
    progress.wave = Math.max(progress.wave, state.wave);
    if (progress.coins >= 12 && !progress.unlocks.includes("drone")) progress.unlocks.push("drone");
    if (progress.coins >= 22 && !progress.unlocks.includes("rail")) progress.unlocks.push("rail");
    saveProgress();
    beep(90, 0.28, "sawtooth", 0.05);
  }
  function nextWave() {
    state.wave += 1;
    state.kills = 0;
    state.target = state.mode === "boss" ? 2 : 7 + state.wave * 3;
    state.spawn = 0.2;
    state.message = state.mode === "boss" ? `Boss Rush ${state.wave}` : `Wave ${state.wave}`;
    if (state.wave % 5 === 0 || state.mode === "boss") spawnBoss();
    else for (let i = 0; i < Math.min(4, 1 + Math.floor(state.wave / 2)); i += 1) spawnEnemy();
    beep(220 + state.wave * 12, 0.08, "triangle", 0.04);
  }
  function rewards() {
    state.choices = [...upgrades].sort(() => roll() - 0.5).slice(0, 3);
    state.screen = "reward";
    state.message = "Choose an upgrade with 1, 2, or 3.";
  }
  function applyReward(index) {
    const choice = state.choices[index];
    if (!choice) return;
    choice[2](state);
    state.message = `${choice[0]} installed.`;
    state.screen = "playing";
    state.choices = [];
    nextWave();
    beep(660, 0.08, "sine", 0.05);
  }
  function edgePos() {
    const edge = Math.floor(rand(0, 4));
    if (edge === 0) return { x: rand(-40, W + 40), y: -34 };
    if (edge === 1) return { x: W + 34, y: rand(-40, H + 40) };
    if (edge === 2) return { x: rand(-40, W + 40), y: H + 34 };
    return { x: -34, y: rand(-40, H + 40) };
  }
  function spawnEnemy(forced, x, y) {
    const pool = ["runner", state.wave >= 2 && "tank", state.wave >= 2 && "splitter", state.wave >= 3 && "sniper", state.wave >= 3 && "exploder", state.wave >= 4 && "summoner"].filter(Boolean);
    const type = forced || pick(pool);
    const base = enemyTypes[type];
    const pos = x === undefined ? edgePos() : { x, y };
    const hp = base.hp + Math.floor(state.wave / 4);
    state.enemies.push({ ...base, type, x: pos.x, y: pos.y, hp, max: hp, cooldown: rand(0.7, 1.8), flash: 0, boss: false });
  }
  function spawnBoss() {
    const hp = 42 + state.wave * 12;
    state.enemies.push({ type: "boss", name: pick(["Gatebreaker", "Pulse Tyrant", "Hex Warden", "Storm Engine"]), color: "#7de3ff", x: W / 2, y: 80, r: 42, speed: 58 + state.wave * 2, hp, max: hp, score: 40 + state.wave * 4, dmg: 42, cooldown: 1.1, flash: 0, boss: true });
    state.shake = 0.35;
  }
  function spawnPickup() {
    const guns = ["rapid", "shotgun", "bounce"];
    if (progress.unlocks.includes("rail")) guns.push("rail");
    const firstRoll = roll();
    const secondRoll = roll();
    const type = firstRoll < 0.18 ? "heal" : secondRoll < 0.3 ? "drone" : pick(guns);
    state.pickups.push({ type, x: rand(70, W - 70), y: rand(90, H - 70), r: 15, life: 13, pulse: 0 });
  }
  function spawnHazard() {
    const kind = pick(["zap", "turret", "wall"]);
    state.hazards.push({ kind, x: rand(90, W - 90), y: rand(110, H - 80), w: rand(90, 160), h: 24, r: rand(44, 70), life: kind === "turret" ? 8 : 4.5, warm: 1.1, shot: 0.6, spin: rand(0, TAU) });
  }
  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = rand(0, TAU), v = rand(30, speed || 210), life = rand(0.18, 0.62);
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rand(2, 6), life, max: life, color });
    }
  }
  function number(x, y, text, color) {
    state.numbers.push({ x, y, text, color, life: 0.72, max: 0.72 });
  }
  function shoot(angle, key, source) {
    const gun = weapons[key || state.weapon];
    const crit = roll() < state.stats.crit;
    const from = source || state.player;
    state.bullets.push({ x: from.x + Math.cos(angle) * 20, y: from.y + Math.sin(angle) * 20, vx: Math.cos(angle) * gun.speed, vy: Math.sin(angle) * gun.speed, r: key === "rail" ? 6 : 4, life: gun.life, dmg: (gun.dmg + state.stats.dmg - 1) * (crit ? 2 : 1), color: crit ? "#ffffff" : gun.color, pierce: gun.pierce, bounce: gun.bounce });
  }
  function fireWeapon() {
    const gun = weapons[state.weapon];
    const base = Math.atan2(input.mouse.y - state.player.y, input.mouse.x - state.player.x);
    for (let i = 0; i < gun.count; i += 1) {
      const off = gun.count === 1 ? 0 : (i - (gun.count - 1) / 2) * gun.spread / Math.max(1, gun.count - 1);
      shoot(base + off, state.weapon);
    }
    state.shake = Math.max(state.shake, state.weapon === "rail" ? 0.16 : 0.06);
    beep(state.weapon === "shotgun" ? 120 : 420, 0.035, "square", 0.025);
  }
  function enemyShot(enemy, angle, speed, radius) {
    state.enemyShots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * (speed || 230), vy: Math.sin(angle) * (speed || 230), r: radius || 5, life: 4, dmg: enemy.boss ? 17 : 12, color: enemy.boss ? "#ff72d2" : "#f7f2a1" });
  }
  function hurt(amount, x, y) {
    if (state.player.inv > 0) return;
    state.player.hp = Math.max(0, state.player.hp - amount);
    state.player.inv = 0.18;
    state.flash = 0.12;
    state.shake = Math.max(state.shake, 0.24);
    burst(x || state.player.x, y || state.player.y, "#ff7b8b", 10, 180);
    beep(150, 0.07, "sawtooth", 0.04);
    if (state.player.hp <= 0) {
      burst(state.player.x, state.player.y, "#ff7b8b", 30, 300);
      over();
    }
  }
  function killEnemy(index) {
    const enemy = state.enemies[index];
    if (!enemy) return;
    state.enemies.splice(index, 1);
    state.score += enemy.score;
    state.kills += enemy.boss ? state.target : 1;
    burst(enemy.x, enemy.y, enemy.boss ? "#7de3ff" : "#67ff9b", enemy.boss ? 34 : 15, enemy.boss ? 340 : 220);
    state.shake = Math.max(state.shake, enemy.boss ? 0.42 : 0.1);
    if (enemy.type === "splitter") for (let i = 0; i < 2; i += 1) spawnEnemy("runner", enemy.x + rand(-16, 16), enemy.y + rand(-16, 16));
    if (enemy.type === "exploder" && dist(enemy, state.player) < 95) hurt(28, enemy.x, enemy.y);
    if (roll() < (enemy.boss ? 0.9 : 0.08)) spawnPickup();
    beep(enemy.boss ? 90 : 540, enemy.boss ? 0.18 : 0.045, "triangle", 0.04);
  }

  function updatePlayer(dt) {
    const mx = (input.down("d", "arrowright") ? 1 : 0) - (input.down("a", "arrowleft") ? 1 : 0);
    const my = (input.down("s", "arrowdown") ? 1 : 0) - (input.down("w", "arrowup") ? 1 : 0);
    const m = Math.hypot(mx, my) || 1;
    state.player.dash = Math.max(0, state.player.dash - dt);
    state.player.inv = Math.max(0, state.player.inv - dt);
    if (input.pressed("q", "e") && state.player.dash <= 0 && (mx || my)) {
      state.player.x += mx / m * 105;
      state.player.y += my / m * 105;
      state.player.dash = state.stats.dash;
      state.player.inv = 0.34;
      state.shake = Math.max(state.shake, 0.12);
      burst(state.player.x, state.player.y, "#7de3ff", 18, 260);
      beep(720, 0.06, "sine", 0.035);
    }
    state.player.x = clamp(state.player.x + mx / m * state.stats.speed * dt, 24, W - 24);
    state.player.y = clamp(state.player.y + my / m * state.stats.speed * dt, 24, H - 24);
    state.fire = Math.max(0, state.fire - dt);
    if ((input.mouse.down || input.down(" ")) && state.fire <= 0) {
      audioReady();
      fireWeapon();
      state.fire = weapons[state.weapon].rate * state.stats.rate;
    }
    if (state.weapon !== "blaster") {
      state.weaponTime -= dt;
      if (state.weaponTime <= 0) state.weapon = "blaster";
    }
  }
  function updateBullets(dt) {
    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const b = state.bullets[i];
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.bounce > 0 && (b.x < 8 || b.x > W - 8)) { b.vx *= -1; b.bounce -= 1; b.x = clamp(b.x, 8, W - 8); }
      if (b.bounce > 0 && (b.y < 8 || b.y > H - 8)) { b.vy *= -1; b.bounce -= 1; b.y = clamp(b.y, 8, H - 8); }
      if (b.life <= 0 || b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40) state.bullets.splice(i, 1);
    }
    for (let i = state.enemyShots.length - 1; i >= 0; i -= 1) {
      const s = state.enemyShots[i];
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (dist(s, state.player) <= s.r + state.player.r) { state.enemyShots.splice(i, 1); hurt(s.dmg, s.x, s.y); }
      else if (s.life <= 0 || s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30) state.enemyShots.splice(i, 1);
    }
  }
  function updateEnemies(dt) {
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const e = state.enemies[i];
      e.flash = Math.max(0, e.flash - dt);
      e.cooldown -= dt;
      const a = ang(e, state.player), d = dist(e, state.player);
      if (e.type === "sniper" && d < 320) { e.x -= Math.cos(a) * e.speed * 0.7 * dt; e.y -= Math.sin(a) * e.speed * 0.7 * dt; }
      else { const strafe = e.boss ? Math.sin(state.time * 1.8) * 0.7 : 0; e.x += (Math.cos(a) + Math.cos(a + Math.PI / 2) * strafe) * e.speed * dt; e.y += (Math.sin(a) + Math.sin(a + Math.PI / 2) * strafe) * e.speed * dt; }
      e.x = clamp(e.x, e.r, W - e.r); e.y = clamp(e.y, e.boss ? 80 : e.r, H - e.r);
      if ((e.type === "sniper" || e.type === "summoner" || e.boss) && e.cooldown <= 0) {
        if (e.type === "summoner") { spawnEnemy("runner", e.x + rand(-28, 28), e.y + rand(-28, 28)); e.cooldown = 3.4; }
        else if (e.boss) { for (let s = -2; s <= 2; s += 1) enemyShot(e, a + s * 0.22, 210 + state.wave * 7, 6); if (roll() < 0.45) spawnEnemy(pick(["runner", "exploder"]), e.x + rand(-40, 40), e.y + rand(30, 60)); e.cooldown = 1.15; }
        else { enemyShot(e, a, 270, 5); e.cooldown = 1.55; }
      }
      if (d <= e.r + state.player.r) hurt(e.dmg * dt, e.x, e.y);
      for (let j = state.bullets.length - 1; j >= 0; j -= 1) {
        const b = state.bullets[j];
        if (dist(e, b) <= e.r + b.r) {
          e.hp -= b.dmg; e.flash = 0.08; number(e.x + rand(-8, 8), e.y - e.r, Math.round(b.dmg).toString(), b.color); burst(b.x, b.y, b.color, 5, 140);
          if (b.pierce > 0) b.pierce -= 1; else state.bullets.splice(j, 1);
          if (e.hp <= 0) killEnemy(i);
          break;
        }
      }
    }
  }
  function updatePickups(dt) {
    state.pickup -= dt;
    if (state.pickup <= 0) { spawnPickup(); state.pickup = rand(7, 12); }
    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const p = state.pickups[i];
      p.life -= dt; p.pulse += dt * 5;
      if (dist(p, state.player) <= p.r + state.player.r) {
        state.pickups.splice(i, 1);
        if (p.type === "heal") { state.player.hp = Math.min(state.player.max, state.player.hp + 34); state.message = "Repair charge collected."; }
        else if (p.type === "drone") { state.stats.drones = Math.min(3, state.stats.drones + 1); state.message = "Laser drone online."; }
        else { state.weapon = p.type; state.weaponTime = 7 + state.stats.weaponTime; state.message = `${weapons[p.type].name} online.`; }
        burst(p.x, p.y, "#ffd66b", 18, 230); beep(880, 0.07, "sine", 0.045);
      } else if (p.life <= 0) state.pickups.splice(i, 1);
    }
  }
  function updateHazards(dt) {
    state.hazard -= dt;
    if (state.hazard <= 0) { spawnHazard(); state.hazard = rand(Math.max(2.4, 6.4 - state.wave * 0.24), Math.max(3, 8.2 - state.wave * 0.22)); }
    for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
      const h = state.hazards[i];
      h.life -= dt; h.warm -= dt; h.shot -= dt; h.spin += dt;
      if (h.warm <= 0 && h.kind === "zap" && dist(h, state.player) < h.r + state.player.r) hurt(18 * dt, h.x, h.y);
      if (h.warm <= 0 && h.kind === "wall" && Math.abs(state.player.x - h.x) < h.w / 2 && Math.abs(state.player.y - h.y) < h.h / 2 + state.player.r) hurt(20 * dt, h.x, h.y);
      if (h.warm <= 0 && h.kind === "turret" && h.shot <= 0) { enemyShot(h, ang(h, state.player), 260, 5); h.shot = 0.85; }
      if (h.life <= 0) state.hazards.splice(i, 1);
    }
  }
  function updateDrone(dt) {
    if (state.stats.drones <= 0 || state.enemies.length === 0) return;
    state.droneFire -= dt;
    if (state.droneFire > 0) return;
    const target = state.enemies.reduce((a, b) => dist(state.player, a) < dist(state.player, b) ? a : b);
    for (let i = 0; i < state.stats.drones; i += 1) {
      const a = state.time * 2.2 + i * TAU / state.stats.drones;
      const src = { x: state.player.x + Math.cos(a) * 36, y: state.player.y + Math.sin(a) * 36 };
      shoot(ang(src, target), "rapid", src);
    }
    state.droneFire = 0.42;
  }
  function updateFx(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.numbers.length - 1; i >= 0; i -= 1) {
      const n = state.numbers[i];
      n.life -= dt; n.y -= 28 * dt;
      if (n.life <= 0) state.numbers.splice(i, 1);
    }
  }
  function updateWave(dt) {
    if (state.mode === "score" && state.time >= state.limit) { over("Time. Cash out and press R for another score attack."); return; }
    if (state.kills >= state.target && state.enemies.length === 0) { rewards(); return; }
    state.spawn -= dt;
    const interval = Math.max(0.38, 1.4 - state.wave * 0.08);
    while (state.spawn <= 0 && state.kills + state.enemies.length < state.target + 4) {
      spawnEnemy();
      if (roll() < Math.min(0.52, state.wave * 0.08)) spawnEnemy();
      state.spawn += interval;
    }
  }
  function updatePlaying(dt) {
    state.time += dt;
    state.flash = Math.max(0, state.flash - dt);
    state.shake = Math.max(0, state.shake - dt * 1.8);
    updatePlayer(dt); updateBullets(dt); updateWave(dt); updateEnemies(dt); updatePickups(dt); updateHazards(dt); updateDrone(dt); updateFx(dt);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#06111a"); g.addColorStop(0.55, "#10162e"); g.addColorStop(1, "#07120d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(125, 227, 255, 0.14)";
    for (let x = 0; x <= W; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(state.time + x) * 4, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + Math.cos(state.time + y) * 4); ctx.stroke(); }
    if (state.flash > 0) { ctx.fillStyle = "rgba(255, 92, 121, 0.18)"; ctx.fillRect(0, 0, W, H); }
  }
  function drawPlayer() {
    const look = Math.atan2(input.mouse.y - state.player.y, input.mouse.x - state.player.x);
    ctx.save(); ctx.translate(state.player.x, state.player.y);
    if (state.player.inv > 0) ctx.globalAlpha = 0.55 + Math.sin(state.time * 38) * 0.25;
    ctx.fillStyle = "rgba(106, 237, 255, 0.24)"; ctx.beginPath(); ctx.arc(0, 0, state.player.r + 9, 0, TAU); ctx.fill();
    ctx.rotate(look); ctx.fillStyle = "#52e5ff"; ctx.beginPath(); ctx.arc(0, 0, state.player.r, 0, TAU); ctx.fill();
    ctx.fillStyle = "#d9fbff"; ctx.fillRect(6, -4, 18, 8); ctx.restore();
    for (let i = 0; i < state.stats.drones; i += 1) {
      const a = state.time * 2.2 + i * TAU / state.stats.drones;
      ctx.fillStyle = "#ffd66b"; ctx.beginPath(); ctx.arc(state.player.x + Math.cos(a) * 36, state.player.y + Math.sin(a) * 36, 6, 0, TAU); ctx.fill();
    }
  }
  function drawBullets() {
    for (const b of state.bullets) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); }
    for (const s of state.enemyShots) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
  }
  function drawEnemies() {
    for (const e of state.enemies) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = e.flash > 0 ? "#ffffff" : e.color;
      if (e.boss) { ctx.rotate(state.time * 0.8); for (let i = 0; i < 6; i += 1) { ctx.rotate(TAU / 6); ctx.fillRect(e.r * 0.35, -8, e.r * 0.9, 16); } }
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r * 2, 4);
      ctx.fillStyle = e.boss ? "#7de3ff" : "#67ff9b"; ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r * 2 * e.hp / e.max, 4);
    }
  }
  function drawPickups() {
    for (const p of state.pickups) {
      const color = p.type === "heal" ? "#58f3a1" : p.type === "drone" ? "#ffd66b" : weapons[p.type].color;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + Math.sin(p.pulse) * 3, 0, TAU); ctx.stroke();
      ctx.font = "bold 12px Arial"; ctx.textAlign = "center"; ctx.fillText(p.type === "heal" ? "+" : p.type === "drone" ? "D" : "W", p.x, p.y + 4); ctx.textAlign = "start";
    }
  }
  function drawHazards() {
    for (const h of state.hazards) {
      const active = h.warm <= 0; ctx.save(); ctx.globalAlpha = active ? 0.72 : 0.28;
      ctx.strokeStyle = active ? "#ff5e7a" : "#ffd66b"; ctx.fillStyle = active ? "rgba(255, 94, 122, 0.18)" : "rgba(255, 214, 107, 0.12)"; ctx.lineWidth = 3;
      if (h.kind === "wall") { ctx.translate(h.x, h.y); ctx.rotate(Math.sin(h.spin) * 0.18); ctx.fillRect(-h.w / 2, -h.h / 2, h.w, h.h); ctx.strokeRect(-h.w / 2, -h.h / 2, h.w, h.h); }
      else { ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.stroke(); if (h.kind === "turret") { ctx.fillStyle = "#ff5e7a"; ctx.beginPath(); ctx.arc(h.x, h.y, 16, 0, TAU); ctx.fill(); } }
      ctx.restore();
    }
  }
  function drawFx() {
    for (const p of state.particles) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const n of state.numbers) { ctx.globalAlpha = clamp(n.life / n.max, 0, 1); ctx.fillStyle = n.color; ctx.font = "bold 16px Arial"; ctx.fillText(n.text, n.x, n.y); }
    ctx.globalAlpha = 1;
  }
  function drawHud() {
    ctx.fillStyle = "rgba(7, 15, 24, 0.84)"; ctx.fillRect(14, 12, 330, 122); ctx.strokeStyle = "rgba(125, 227, 255, 0.42)"; ctx.strokeRect(14, 12, 330, 122);
    ctx.fillStyle = "#d8ecff"; ctx.font = "bold 18px Arial"; ctx.fillText(`${modes[state.mode]} | Wave ${state.wave}`, 28, 39);
    ctx.font = "15px Arial"; ctx.fillText(`Score ${state.score} | Best ${Math.max(progress.best, state.score)}`, 28, 64);
    ctx.fillText(`${state.mode === "score" ? `Time ${(state.limit - state.time).toFixed(1)}s` : `Time ${state.time.toFixed(1)}s`} | Coins ${progress.coins}+${state.coinsEarned}`, 28, 88);
    ctx.fillText(`Weapon ${weapons[state.weapon].name}${state.weapon !== "blaster" ? ` ${state.weaponTime.toFixed(1)}s` : ""}`, 28, 112);
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(W - 260, 20, 210, 20); ctx.fillStyle = "#58f3a1"; ctx.fillRect(W - 260, 20, 210 * state.player.hp / state.player.max, 20); ctx.strokeStyle = "rgba(197,255,226,0.82)"; ctx.strokeRect(W - 260, 20, 210, 20);
    ctx.fillStyle = "#dfffea"; ctx.font = "bold 14px Arial"; ctx.fillText("HP", W - 292, 35);
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(W - 260, 52, 210, 14); ctx.fillStyle = state.player.dash <= 0 ? "#ffd66b" : "#7de3ff"; ctx.fillRect(W - 260, 52, 210 * (1 - state.player.dash / state.stats.dash), 14);
    ctx.fillStyle = "#d8ecff"; ctx.font = "12px Arial"; ctx.fillText("Dash Q/E", W - 326, 64);
    ctx.fillStyle = "#ffd66b"; ctx.font = "bold 15px Arial"; ctx.fillText(state.message, 28, H - 24);
  }
  function overlay() {
    if (state.screen === "playing") return;
    ctx.fillStyle = "rgba(3, 5, 16, 0.76)"; ctx.fillRect(0, 0, W, H); ctx.textAlign = "center"; ctx.fillStyle = "#ebf5ff"; ctx.font = "bold 50px Arial"; ctx.fillText("Neon Siege", W / 2, H / 2 - 112);
    if (state.screen === "title") {
      ctx.font = "22px Arial"; ctx.fillText("1 Survival   2 Score Attack   3 Boss Rush   4 Daily Seed", W / 2, H / 2 - 52); ctx.fillStyle = "#ffd66b"; ctx.fillText(`Selected: ${modes[state.mode]}`, W / 2, H / 2 - 16);
      ctx.fillStyle = "#d8ecff"; ctx.font = "17px Arial"; ctx.fillText("Enter starts. Mouse aims. Space or click fires. Q/E dashes. P pauses.", W / 2, H / 2 + 28); ctx.fillText(`Progress: best ${progress.best}, best wave ${progress.wave}, coins ${progress.coins}`, W / 2, H / 2 + 58);
    } else if (state.screen === "paused") { ctx.font = "24px Arial"; ctx.fillText("Paused", W / 2, H / 2 - 12); ctx.font = "18px Arial"; ctx.fillText("Press P to continue.", W / 2, H / 2 + 28); }
    else if (state.screen === "reward") {
      ctx.font = "24px Arial"; ctx.fillText("Wave Cleared", W / 2, H / 2 - 58); ctx.font = "18px Arial";
      state.choices.forEach((choice, index) => { ctx.fillStyle = index === state.selected ? "#ffd66b" : "#ebf5ff"; ctx.fillText(`${index + 1}. ${choice[0]} - ${choice[1]}`, W / 2, H / 2 - 12 + index * 42); });
    } else {
      ctx.font = "24px Arial"; ctx.fillText("Run Over", W / 2, H / 2 - 42); ctx.font = "18px Arial"; ctx.fillText(state.message, W / 2, H / 2 - 4); ctx.fillText(`Final Score: ${state.score} | Wave: ${state.wave} | Coins earned: ${state.coinsEarned}`, W / 2, H / 2 + 30); ctx.fillText("Press R or Enter to restart.", W / 2, H / 2 + 62);
    }
    ctx.textAlign = "start";
  }
  function update(dt) {
    if (input.pressed("escape")) return menu();
    if (input.pressed("1")) state.screen === "reward" ? applyReward(0) : state.screen === "title" && (state.mode = "survival");
    if (input.pressed("2")) state.screen === "reward" ? applyReward(1) : state.screen === "title" && (state.mode = "score");
    if (input.pressed("3")) state.screen === "reward" ? applyReward(2) : state.screen === "title" && (state.mode = "boss");
    if (input.pressed("4") && state.screen === "title") state.mode = "daily";
    if (state.screen === "title" && input.pressed("enter")) { audioReady(); start(); }
    if (state.screen === "gameover" && input.pressed("r", "enter")) start(state.mode);
    if (state.screen === "playing" && input.pressed("p")) { state.screen = "paused"; state.message = "Press P to continue."; }
    else if (state.screen === "paused" && input.pressed("p")) { state.screen = "playing"; state.message = "Back in the fight."; }
    if (state.screen === "playing") updatePlaying(dt); else updateFx(dt);
  }
  function render() {
    ctx.save();
    if (state.shake > 0) ctx.translate(rand(-state.shake * 10, state.shake * 10), rand(-state.shake * 10, state.shake * 10));
    drawBg(); drawHazards(); drawPickups(); drawBullets(); drawEnemies(); drawPlayer(); drawFx(); drawHud(); ctx.restore(); overlay();
  }
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now; update(dt); render(); input.end(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}());
