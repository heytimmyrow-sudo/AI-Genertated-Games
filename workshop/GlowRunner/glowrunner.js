// FLOORS RUNNER — with Shop, Upgrades, and Info button
// Keeps your last controls: double-jump UP, double-tap DOWN.
// Uses orbs you collect to buy upgrades in the MENU shop.
//
// IMPORTANT: paste this as a single file replacing the old one.

(() => {
  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../../index.html";
  }

  // ========= DOM =========
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const startBtn = document.getElementById("startBtn");
  const tipEl = overlay.querySelector(".tip");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");

  function createPlayer() {
    return {
      x: W * 0.18,
      y: floorY[1],
      w: Math.max(30, Math.floor(W * 0.034)),
      h: Math.max(36, Math.floor(H * 0.095)),
      floor: 1,
      moving: false,
      fromFloor: 1,
      toFloor: 1,
      moveT: 0,
      moveDur: 0.22 - upgrades.shift * 0.04,
      hopY: 0,
      hopV: 0,
      jumpArm: 0,
      downArm: 0
    };
  }

  // ========= Basic vars =========
  let W = canvas.width, H = canvas.height;

  // ========= Storage keys =========
  const LS = {
    BEST: "fr_best",
    ORBS: "fr_orbs",
    UPGRADES: "fr_upgrades"
  };

  // ========= Load saved =========
  let best = Number(localStorage.getItem(LS.BEST) || 0);
  bestEl.textContent = String(best);
  let orbs = Number(localStorage.getItem(LS.ORBS) || 0);

  // ========= Screens =========
  const SCREEN = { MENU:0, PLAY:1, SHOP:2 };
  let screen = SCREEN.MENU;
  let paused = false;

  // ========= Info toggling =========
  let infoOpen = false;

  // ========= Upgrade definitions =========
  const upgradeDefs = [
    {
      id: "phase",
      name: "Phase Duration",
      desc: "Longer safe window while switching floors",
      base: 15,
      step: 10,
      max: 4
    },
    {
      id: "shift",
      name: "Quick Shift",
      desc: "Move between floors faster",
      base: 20,
      step: 15,
      max: 3
    },
    {
      id: "preview",
      name: "Wave Preview",
      desc: "See next danger floor briefly",
      base: 25,
      step: 20,
      max: 1
    },
    {
      id: "orb",
      name: "Orb Value",
      desc: "Orbs give more score",
      base: 10,
      step: 10,
      max: 5
    },
    {
      id: "revive",
      name: "Second Chance",
      desc: "Survive 1 hit per run",
      base: 40,
      step: 0,
      max: 1
    }
  ];

  // ========= Upgrade state =========
  let upgrades = {
    phase: 0,
    shift: 0,
    preview: 0,
    orb: 0,
    revive: 0
  };

  try {
    const saved = JSON.parse(localStorage.getItem(LS.UPGRADES));
    if (saved) Object.assign(upgrades, saved);
  } catch {}

  // ========= Save helper =========
  function saveProgress() {
    localStorage.setItem(LS.ORBS, String(orbs));
    localStorage.setItem(LS.UPGRADES, JSON.stringify(upgrades));
  }

  // ========= Utility =========
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp = (a,b,t)=>a+(b-a)*t;

  // ========= Floors setup =========
  let floorY = [0,0,0];
  function recomputeFloors() {
    const top = Math.floor(H * 0.28);
    const mid = Math.floor(H * 0.52);
    const bot = Math.floor(H * 0.76);
    floorY = [top, mid, bot];
  }
  function floorName(i) {
    return i === 0 ? "Top" : (i === 1 ? "Middle" : "Bottom");
  }

  // ========= Game State =========
  let state = null;
  let player = null;
  let wave = null;

  // ========= Particles =========
  let particles = [];
  function puff(x, y, count, color="rgba(255,255,255,0.9)") {
    for (let i=0;i<count;i++) {
      particles.push({
        x, y,
        vx: (Math.random()*2-1)*220,
        vy: (Math.random()*2-1)*220 - 40,
        life: 0.55 + Math.random()*0.25,
        color
      });
    }
  }
  function updateParticles(dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
  }
  function drawParticles() {
    ctx.save();
    for (const p of particles) {
      const a = clamp(p.life / 0.8, 0, 1);
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.restore();
  }

  // ========= Hazards & orbs =========
  let hazards = [];
  let orbsArr = [];
  let hazardSpawnTimer = 0;
  let orbSpawnTimer = 0;

  function spawnHazard() {
    const f = wave.active;
    const roll = Math.random();
    if (roll < 0.60) {
      hazards.push({
        type: "block",
        floor: f,
        x: W + 120,
        y: floorY[f],
        w: 40 + Math.random()*30,
        h: 34 + Math.random()*22
      });
    } else {
      hazards.push({
        type: "runner",
        floor: f,
        x: W + 140,
        y: floorY[f],
        w: 34,
        h: 28,
        bob: Math.random()*Math.PI*2
      });
    }
  }

  function spawnOrb() {
    const f = Math.floor(Math.random()*3);
    orbsArr.push({
      floor: f,
      x: W + 120,
      y: floorY[f] - 38 - Math.random()*18,
      r: 10,
      taken: false
    });
  }

  function nextWave() {
    let nf = Math.floor(Math.random()*3);
    if (nf === wave.active) nf = (nf + 1 + Math.floor(Math.random()*2)) % 3;
    wave.active = nf;
    wave.time = 5 + Math.random()*3;

    // small reward
    state.score += 60;
    puff(W*0.5, H*0.2, 10, "rgba(46,242,255,0.8)");
  }

  // ========= Movement / floor shifting =========
  function moveUpOneFloor() {
    if (!state.alive || player.moving) return;
    if (player.floor <= 0) return;

    player.moving = true;
    player.fromFloor = player.floor;
    player.toFloor = player.floor - 1;
    player.moveT = 0;
    player.floor = player.toFloor;
    puff(player.x, player.y - 20, 10, "rgba(124,92,255,0.9)");
  }

  function moveDownOneFloor() {
    if (!state.alive || player.moving) return;
    if (player.floor >= 2) return;

    player.moving = true;
    player.fromFloor = player.floor;
    player.toFloor = player.floor + 1;
    player.moveT = 0;
    player.floor = player.toFloor;
    puff(player.x, player.y - 20, 10, "rgba(255,217,74,0.9)");
  }

  // Single hop + double logic
  function doHop() {
    if (player.hopY === 0) {
      player.hopV = -620;
    } else {
      player.hopV -= 120;
    }
    puff(player.x, player.y - 10, 6, "rgba(255,255,255,0.35)");
  }

  function onJumpPressed() {
    if (screen !== SCREEN.PLAY) {
      startRun();
      return;
    }
    if (!state.alive) return;

    doHop();

    if (player.jumpArm <= 0) {
      player.jumpArm = 0.34;
    } else {
      player.jumpArm = 0;
      moveUpOneFloor();
    }
  }

  function onDownPressed() {
    if (screen !== SCREEN.PLAY) {
      startRun();
      return;
    }
    if (!state.alive) return;

    if (player.downArm <= 0) {
      player.downArm = 0.34;
      puff(player.x, player.y - 6, 5, "rgba(255,255,255,0.22)");
    } else {
      player.downArm = 0;
      moveDownOneFloor();
    }
  }

  // ========= Reset / Start / Game Over =========
  function resetRun() {
    state = {
      score: 0,
      alive: true,
      reviveUsed: false
    };

    player = createPlayer();

    wave = {
      active: Math.floor(Math.random()*3),
      time: 6
    };

    hazards = [];
    orbsArr = [];
    particles = [];

    hazardSpawnTimer = 0.25;
    orbSpawnTimer = 0.45;

    scoreEl.textContent = "0";
    updateHud();
  }

  function startRun() {
    screen = SCREEN.PLAY;
    paused = false;
    overlay.style.display = "none";
    resetRun();
  }

  function gameOver() {
    // revive
    if (upgrades.revive && !state.reviveUsed) {
      state.reviveUsed = true;
      return;
    }

    state.alive = false;

    // bank orbs (simple rule: 1 orb per 50 score)
    orbs += Math.floor(state.score / 50);
    best = Math.max(best, Math.floor(state.score));

    localStorage.setItem(LS.BEST, String(best));
    saveProgress();

    bestEl.textContent = best;
    showMenu(true); // true = keep info off
  }

  // ========= HUD Updates =========
  function updateHud() {
    const ob = document.getElementById("orbBank");
    if (ob) ob.textContent = String(orbs);

    const fl = document.getElementById("floorLabel");
    if (fl) fl.textContent = floorName(player.floor);

    const wl = document.getElementById("waveLabel");
    if (wl) wl.textContent = `${floorName(wave.active)} (${Math.ceil(wave.time)}s)`;
  }

  // ========= Shop UI =========
  function showShop() {
    screen = SCREEN.SHOP;
    overlay.style.display = "flex";
    titleEl.textContent = "Shop";
    startBtn.textContent = "Back";
    tipEl.innerHTML = "";

    const card = overlay.querySelector(".card");
    let extra = card.querySelector(".shop");
    if (extra) extra.remove();

    extra = document.createElement("div");
    extra.className = "shop";
    extra.style.display = "grid";
    extra.style.gap = "12px";

    const orbLine = document.createElement("div");
    orbLine.innerHTML = `<b>Orbs:</b> ${orbs}`;
    extra.appendChild(orbLine);

    for (const u of upgradeDefs) {
      const lvl = upgrades[u.id];
      const cost = u.base + u.step * lvl;

      const row = document.createElement("div");
      row.style.border = "1px solid rgba(255,255,255,.15)";
      row.style.padding = "10px";
      row.style.borderRadius = "12px";

      const title = document.createElement("div");
      title.innerHTML = `<b>${u.name}</b> (Lv ${lvl}/${u.max})`;

      const desc = document.createElement("div");
      desc.style.opacity = "0.8";
      desc.style.fontSize = "12px";
      desc.textContent = u.desc;

      const btn = document.createElement("button");
      btn.style.marginTop = "6px";

      if (lvl >= u.max) {
        btn.textContent = "Maxed";
        btn.disabled = true;
      } else {
        btn.textContent = `Buy (${cost})`;
        btn.onclick = () => {
          if (orbs >= cost) {
            orbs -= cost;
            upgrades[u.id]++;
            saveProgress();
            showShop(); // refresh
          }
        };
      }

      row.append(title, desc, btn);
      extra.appendChild(row);
    }

    card.appendChild(extra);
  }

  // ========= Menu UI =========
  function showMenu(clearInfo=false) {
    screen = SCREEN.MENU;
    overlay.style.display = "flex";
    titleEl.textContent = "Glow Runner";
    startBtn.textContent = state && !state.alive ? "Restart" : "Start";

    // optionally close info (e.g., after game over)
    if (clearInfo) infoOpen = false;

    // remove old menu buttons if any
    const card = overlay.querySelector(".card");
    const shopPanel = card.querySelector(".shop");
    if (shopPanel) shopPanel.remove();
    let btns = card.querySelector(".menuBtns");
    if (btns) btns.remove();

    // create menu buttons row
    btns = document.createElement("div");
    btns.className = "menuBtns";
    btns.style.display = "flex";
    btns.style.gap = "10px";

    const shopBtn = document.createElement("button");
    shopBtn.textContent = "Shop";
    shopBtn.onclick = showShop;

    const infoBtn = document.createElement("button");
    infoBtn.textContent = "Info";
    infoBtn.onclick = () => {
      infoOpen = !infoOpen;
      renderOverlay();
    };

    btns.appendChild(shopBtn);
    btns.appendChild(infoBtn);
    card.appendChild(btns);

    renderOverlay();
  }

  // ========= Overlay Rendering (Info state) =========
  function renderOverlay() {
    if (screen === SCREEN.PLAY) return;

    overlay.style.display = "flex";
    titleEl.textContent = screen === SCREEN.SHOP ? "Shop" : "Glow Runner";
    startBtn.textContent = screen === SCREEN.SHOP ? "Back" : (state && !state.alive ? "Restart" : "Start");

    if (!infoOpen || screen !== SCREEN.MENU) {
      tipEl.innerHTML = "Press <b>Space</b> to jump | Avoid spikes | Grab orbs";
      return;
    }

    tipEl.innerHTML =
      `Start on <b>Middle</b> floor.<br>` +
      `Go <b>UP</b>: double-jump (press jump twice fast).<br>` +
      `Go <b>DOWN</b>: double-tap <b>Down</b> (or <b>S</b>).<br>` +
      `Safe while shifting between floors.<br>` +
      `Hazards happen in waves on one floor at a time.`;
  }

  // ========= Drawing helpers =========
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground() {
    ctx.save();
    ctx.fillStyle = "#060714";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(124,92,255,0.16)";
    ctx.beginPath();
    ctx.arc(W*0.35, H*0.35, Math.min(W,H)*0.55, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "rgba(46,242,255,0.12)";
    ctx.beginPath();
    ctx.arc(W*0.75, H*0.60, Math.min(W,H)*0.50, 0, Math.PI*2);
    ctx.fill();

    // floors
    for (let i=0;i<3;i++) {
      const y = floorY[i];
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = (i === wave.active) ? "rgba(255,59,107,0.85)" : "rgba(255,255,255,0.20)";
      ctx.lineWidth = (i === wave.active) ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(0, y + 1);
      ctx.lineTo(W, y + 1);
      ctx.stroke();

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = `${Math.max(12, Math.floor(H*0.022))}px ui-sans-serif, system-ui`;
      ctx.fillText(floorName(i), 14, y - 10);
    }

    // stars
    ctx.globalAlpha = 0.7;
    for (let i=0;i<40;i++) {
      const x = (i * 97 + (state ? state.t*65 : 0)) % (W + 220) - 110;
      const y = (i * 57) % (H - 40) + 20;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(W - x, y, 2, 2);
    }

    ctx.restore();
  }

  function drawPlayer() {
    if (!player) return;

    const x = player.x - player.w/2;
    const y = player.y - player.h;

    ctx.save();

    if (player.moving) {
      ctx.globalAlpha = 0.85;
      ctx.shadowBlur = 26;
      ctx.shadowColor = "rgba(46,242,255,0.9)";
    } else {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 22;
      ctx.shadowColor = "rgba(124,92,255,0.9)";
    }

    ctx.fillStyle = "rgba(124,92,255,0.95)";
    roundRect(x, y, player.w, player.h, 10);
    ctx.fill();

    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(46,242,255,0.85)";
    ctx.strokeStyle = "rgba(46,242,255,0.95)";
    ctx.lineWidth = 2;
    roundRect(x+2, y+2, player.w-4, player.h-4, 9);
    ctx.stroke();

    // armed rings
    if (player.jumpArm > 0 && !player.moving) {
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y - player.h/2, player.w*0.9, 0, Math.PI*2);
      ctx.stroke();
    }
    if (player.downArm > 0 && !player.moving) {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(255,217,74,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y - player.h/2, player.w*0.65, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHazard(h) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255,59,107,0.9)";
    ctx.fillStyle = "rgba(255,59,107,0.95)";

    const x = h.x - h.w/2;
    const y = h.y - h.h;

    if (h.type === "block") {
      roundRect(x, y, h.w, h.h, 12);
      ctx.fill();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(x + h.w*0.28, y + h.h*0.25, h.w*0.44, h.h*0.5, 10);
      ctx.fill();
    } else {
      roundRect(x, y, h.w, h.h, 10);
      ctx.fill();

      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const legY = h.y + 2;
      ctx.moveTo(h.x - 10, legY);
      ctx.lineTo(h.x - 16, legY + 10 + Math.sin(h.bob)*4);
      ctx.moveTo(h.x + 10, legY);
      ctx.lineTo(h.x + 16, legY + 10 + Math.cos(h.bob)*4);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawOrb(o) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(44,255,154,0.9)";
    ctx.fillStyle = "rgba(44,255,154,0.95)";
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
    ctx.fill();

    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,255,255,0.25)";
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r + 3, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);

    drawBackground();
    for (const o of orbsArr) drawOrb(o);
    for (const h of hazards) drawHazard(h);
    drawPlayer();
    drawParticles();

    // Safe notice while shifting
    if (player && player.moving) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `${Math.max(12, Math.floor(H*0.024))}px ui-sans-serif, system-ui`;
      ctx.fillText("PHASE SHIFT (SAFE)", Math.floor(W*0.5) - 70, Math.floor(H*0.12));
      ctx.restore();
    }

    ctx.restore();
  }

  // ========= Update =========
  let lastT = 0;
  let running = false;

  function update(dt) {
    if (!state || !player || !wave) return;

    // speed scaling
    if (!state.t) state.t = 0;
    state.t += dt;
    const difficulty = Math.min(1, state.t / 80);
    state.speed = 360 + difficulty * 260;

    // orbit score
    let orbValue = 35 + upgrades.orb * 5;
    state.score += dt * (14 + difficulty * 10);
    scoreEl.textContent = String(Math.floor(state.score));

    // double windows
    if (player.jumpArm > 0) player.jumpArm = Math.max(0, player.jumpArm - dt);
    if (player.downArm > 0) player.downArm = Math.max(0, player.downArm - dt);

    // hop physics
    player.hopV += 2100 * dt;
    player.hopY += player.hopV * dt;
    if (player.hopY > 0) {
      player.hopY = 0;
      player.hopV = 0;
    }

    // transition
    if (player.moving) {
      player.moveT += dt / player.moveDur;
      if (player.moveT >= 1) {
        player.moveT = 1;
        player.moving = false;
      }
      player.y = lerp(floorY[player.fromFloor], floorY[player.toFloor], player.moveT) + player.hopY;
    } else {
      player.y = floorY[player.floor] + player.hopY;

      // collisions only when fully on floor
      const pRect = {
        x: player.x - player.w/2,
        y: (player.y - player.h),
        w: player.w,
        h: player.h
      };

      // hazards
      for (const h of hazards) {
        if (h.floor !== player.floor) continue;
        const hRect = {
          x: h.x - h.w/2,
          y: (h.y - h.h),
          w: h.w,
          h: h.h
        };
        if (
          pRect.x < hRect.x + hRect.w &&
          pRect.x + pRect.w > hRect.x &&
          pRect.y < hRect.y + hRect.h &&
          pRect.y + pRect.h > hRect.y
        ) {
          return gameOver();
        }
      }

      // orb collect
      for (const o of orbsArr) {
        if (o.floor !== player.floor || o.taken) continue;
        const dx = player.x - o.x;
        const dy = (player.y - player.h/2) - o.y;
        const rr = (o.r + 18);
        if (dx*dx + dy*dy < rr*rr) {
          o.taken = true;
          orbs += 1;
          state.score += orbValue;
          puff(o.x, o.y, 10, "rgba(44,255,154,0.9)");
        }
      }
    }

    // wave
    wave.time -= dt;
    if (wave.time <= 0) nextWave();

    // spawning
    hazardSpawnTimer -= dt;
    orbSpawnTimer -= dt;

    const hazardEvery = 0.75 - difficulty * 0.20;
    const orbEvery = 0.65;

    if (hazardSpawnTimer <= 0) {
      spawnHazard();
      hazardSpawnTimer = hazardEvery * (0.8 + Math.random()*0.7);
    }
    if (orbSpawnTimer <= 0) {
      spawnOrb();
      orbSpawnTimer = orbEvery * (0.8 + Math.random()*0.9);
    }

    // hazards move
    for (const h of hazards) {
      h.x -= state.speed * dt;
      if (h.type === "runner") h.bob += dt * 6.0;
    }
    hazards = hazards.filter(h => h.x > -200);

    // orbs move
    for (const o of orbsArr) o.x -= state.speed * dt;
    orbsArr = orbsArr.filter(o => o.x > -120 && !o.taken);

    // particles
    updateParticles(dt);

    updateHud();
  }

  // ========= Loop =========
  function loop(now) {
    if (!lastT) lastT = now;
    const dt = clamp((now - lastT)/1000, 0, 1/20);
    lastT = now;

    if (screen === SCREEN.PLAY && state && state.alive && !paused) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ========= Input =========
  startBtn.addEventListener("click", () => {
    if (screen === SCREEN.PLAY && paused) {
      paused = false;
      overlay.style.display = "none";
      return;
    }
    if (screen === SCREEN.SHOP) return showMenu(true);
    startRun();
  });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    if (k === "escape") {
      e.preventDefault();
      returnToMenu();
      return;
    }

    if (k === "p") {
      e.preventDefault();
      if (screen === SCREEN.PLAY && state && state.alive) {
        paused = !paused;
        if (paused) {
          overlay.style.display = "flex";
          titleEl.textContent = "Paused";
          startBtn.textContent = "Resume";
          tipEl.innerHTML = "Press <b>P</b> to resume or <b>Esc</b> to return to the menu.";
        } else {
          overlay.style.display = "none";
        }
      }
      return;
    }

    if (k === "r") {
      e.preventDefault();
      startRun();
      return;
    }

    if (k === "f") {
      e.preventDefault();
      // Fullscreen API call (works in browsers per spec). :contentReference[oaicite:1]{index=1}
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
      } else {
        document.exitFullscreen().catch(()=>{});
      }
      return;
    }

    if (k === "arrowdown" || k === "s") {
      e.preventDefault();
      onDownPressed();
      return;
    }

    if (k === " " || k === "w" || k === "arrowup") {
      e.preventDefault();
      onJumpPressed();
      return;
    }
  });

  // ========= Resize =========
  function resizeCanvasToScreen() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    W = canvas.width;
    H = canvas.height;

    recomputeFloors();

    if (player) {
      if (!player.moving) {
        player.y = floorY[player.floor] + player.hopY;
      } else {
        player.y = lerp(floorY[player.fromFloor], floorY[player.toFloor], player.moveT) + player.hopY;
      }
    }
  }
  window.addEventListener("resize", () => setTimeout(resizeCanvasToScreen, 0));
  document.addEventListener("fullscreenchange", () => setTimeout(resizeCanvasToScreen, 60));

  // ========= Init =========
  function init() {
    recomputeFloors();

    // initial player location
    if (!player) {
      player = createPlayer();
    }

    // initial screen
    showMenu();

    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }

    updateHud();
    // adjust canvas after CSS layout settles
    setTimeout(resizeCanvasToScreen, 0);
    setTimeout(resizeCanvasToScreen, 150);
  }

  init();
})();
