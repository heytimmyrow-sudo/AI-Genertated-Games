// Kingdom of Grace - Clicker/Idle Game
const SAVE_KEY = "kingdom_of_grace_save_v3";

// ===== State =====
let state = {
  grace: 0,
  bestGrace: 0,

  perClickBase: 1,
  toolsClickBonus: 0,
  perSecond: 0,

  multiplier: 1.0, // blessings multiplier
  virtue: 0,       // prestige currency
  lastSeen: Date.now(),

  owned: {},            // scalable items
  blessingsBought: {},  // one-time blessings
  saintsUnlocked: {},   // one-time saints

  // audio settings
  sfxOn: true,
  musicOn: false,
};

// ===== DOM =====
const graceEl = document.getElementById("grace");
const perClickEl = document.getElementById("perClick");
const perSecondEl = document.getElementById("perSecond");
const multiplierEl = document.getElementById("multiplier");
const virtueEl = document.getElementById("virtue");
const virtueBonusEl = document.getElementById("virtueBonus");
const bestGraceEl = document.getElementById("bestGrace");

const prayBtn = document.getElementById("prayBtn");
const floatLayer = document.getElementById("floatLayer");

const helpersPanel = document.getElementById("helpers");
const toolsPanel = document.getElementById("tools");
const saintsPanel = document.getElementById("saints");
const blessingsPanel = document.getElementById("blessings");
const prestigePanel = document.getElementById("prestige");

const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const sfxBtn = document.getElementById("sfxBtn");
const musicBtn = document.getElementById("musicBtn");
const tabs = document.querySelectorAll(".tab");

// ===== Utils =====
function fmt(n) {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["K","M","B","T","Qa","Qi"];
  let u = -1;
  let x = n;
  while (x >= 1000 && u < units.length - 1) { x /= 1000; u++; }
  return (x >= 10 ? x.toFixed(1) : x.toFixed(2)) + units[u];
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function getOwned(id) { return state.owned[id] ?? 0; }
function addOwned(id, amt) { state.owned[id] = getOwned(id) + amt; }

function hasBlessing(id) { return !!state.blessingsBought[id]; }
function setBlessingBought(id) { state.blessingsBought[id] = true; }

function hasSaint(id) { return !!state.saintsUnlocked[id]; }
function setSaint(id) { state.saintsUnlocked[id] = true; }

function popFloat(text) {
  const el = document.createElement("div");
  el.className = "floaty";
  el.textContent = text;
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function updateBest() {
  state.bestGrace = Math.max(state.bestGrace, state.grace);
}

// ===== Prestige math =====
function virtueBonusMultiplier() {
  // +2% per Virtue
  return 1 + (state.virtue * 0.02);
}
function virtueFromBest(bestGrace) {
  // smooth curve: sqrt
  return Math.floor(Math.sqrt(bestGrace / 100000));
}

// ===== Effective rates =====
function effectivePerClick() {
  const raw = state.perClickBase + state.toolsClickBonus;
  return raw * state.multiplier * virtueBonusMultiplier();
}
function effectivePerSecond() {
  return state.perSecond * state.multiplier * virtueBonusMultiplier();
}

// ===== Items =====
const HELPERS = [
  { id:"altar_server", name:"Altar Servers", desc:"+0.5 Grace/sec each", baseCost:15, costGrowth:1.15, unlockAt:0,
    onBuy:()=>{ state.perSecond += 0.5; } },
  { id:"choir", name:"Choir Practice", desc:"+2 Grace/sec each", baseCost:120, costGrowth:1.16, unlockAt:60,
    onBuy:()=>{ state.perSecond += 2; } },
  { id:"charity_team", name:"Charity Team", desc:"+6 Grace/sec each", baseCost:650, costGrowth:1.17, unlockAt:300,
    onBuy:()=>{ state.perSecond += 6; } },
  { id:"catechists", name:"Catechists", desc:"+18 Grace/sec each", baseCost:3000, costGrowth:1.18, unlockAt:1200,
    onBuy:()=>{ state.perSecond += 18; } },
  { id:"mission_trip", name:"Mission Trips", desc:"+60 Grace/sec each", baseCost:15000, costGrowth:1.19, unlockAt:5000,
    onBuy:()=>{ state.perSecond += 60; } },
  { id:"parish_school", name:"Parish School", desc:"+200 Grace/sec each", baseCost:80000, costGrowth:1.20, unlockAt:25000,
    onBuy:()=>{ state.perSecond += 200; } },
];

const TOOLS = [
  { id:"rosary", name:"Rosary", desc:"+1 Grace per Prayer each", baseCost:25, costGrowth:1.14, unlockAt:0,
    onBuy:()=>{ state.toolsClickBonus += 1; } },
  { id:"daily_mass", name:"Daily Mass", desc:"+4 Grace per Prayer each", baseCost:250, costGrowth:1.15, unlockAt:120,
    onBuy:()=>{ state.toolsClickBonus += 4; } },
  { id:"holy_hour", name:"Holy Hour", desc:"+12 Grace per Prayer each", baseCost:1400, costGrowth:1.16, unlockAt:700,
    onBuy:()=>{ state.toolsClickBonus += 12; } },
  { id:"scripture_study", name:"Scripture Study", desc:"+30 Grace per Prayer each", baseCost:7000, costGrowth:1.17, unlockAt:3000,
    onBuy:()=>{ state.toolsClickBonus += 30; } },
  { id:"confession_day", name:"Confession Day", desc:"+5 Grace/sec AND +10 per Prayer each", baseCost:20000, costGrowth:1.18, unlockAt:9000,
    onBuy:()=>{ state.perSecond += 5; state.toolsClickBonus += 10; } },
];

const BLESSINGS = [
  { id:"blessing_small", name:"Blessing of Peace", desc:"Multiplier x1.25 (one-time)", cost:1000, unlockAt:400,
    onBuy:()=>{ state.multiplier *= 1.25; } },
  { id:"blessing_medium", name:"Blessing of Courage", desc:"Multiplier x1.75 (one-time)", cost:15000, unlockAt:6000,
    onBuy:()=>{ state.multiplier *= 1.75; } },
  { id:"blessing_big", name:"Blessing of Joy", desc:"Multiplier x2.5 (one-time)", cost:250000, unlockAt:90000,
    onBuy:()=>{ state.multiplier *= 2.5; } },
];

const SAINTS = [
  { id:"st_francis", name:"St. Francis of Assisi", desc:"+20% Grace/sec (one-time)", cost:5000, unlockAt:1500,
    onBuy:()=>{ state.perSecond *= 1.20; } },
  { id:"st_therese", name:"St. Thérèse of Lisieux", desc:"+20% Grace per Prayer (one-time)", cost:8000, unlockAt:2500,
    onBuy:()=>{ state.perClickBase *= 1.20; } },
  { id:"st_augustine", name:"St. Augustine", desc:"+10% to EVERYTHING (multiplier x1.10) (one-time)", cost:25000, unlockAt:9000,
    onBuy:()=>{ state.multiplier *= 1.10; } },
  { id:"st_joseph", name:"St. Joseph", desc:"Tools are 10% stronger (one-time)", cost:60000, unlockAt:20000,
    onBuy:()=>{ state.toolsClickBonus *= 1.10; } },
  { id:"st_teresa_calc", name:"St. Teresa of Calcutta", desc:"+50% Grace/sec (one-time)", cost:180000, unlockAt:70000,
    onBuy:()=>{ state.perSecond *= 1.50; } },
];

// ===== Costs / Unlocks =====
function currentCost(item) {
  const owned = getOwned(item.id);
  if (item.cost != null) return item.cost; // one-time items
  return Math.floor(item.baseCost * Math.pow(item.costGrowth, owned));
}
function isUnlocked(item) {
  return state.bestGrace >= item.unlockAt || state.grace >= item.unlockAt;
}

// ===== Audio (Web Audio API) =====
let audioCtx = null;
let musicGain = null;
let sfxGain = null;
let musicTimer = null;
let musicNoteIndex = 0;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.12;
  sfxGain.connect(audioCtx.destination);

  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.035; // soft background
  musicGain.connect(audioCtx.destination);
}

function resumeAudioIfNeeded() {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function clickPop() {
  if (!state.sfxOn) return;
  resumeAudioIfNeeded();

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(190, t + 0.06);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(1.0, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start(t);
  osc.stop(t + 0.08);
}

const melody = [
  392, 440, 392, 349,
  330, 349, 392, 440,
  392, 349, 330, 294,
  262, 294, 330, 349
];

function playMusicNote(freq, durationSec = 0.28) {
  const t = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(1.0, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

  osc.connect(gain);
  gain.connect(musicGain);

  osc.start(t);
  osc.stop(t + durationSec + 0.02);
}

function startMusic() {
  if (!state.musicOn) return;
  resumeAudioIfNeeded();

  stopMusic();
  musicNoteIndex = 0;

  musicTimer = setInterval(() => {
    if (!state.musicOn) return;
    const freq = melody[musicNoteIndex % melody.length];
    playMusicNote(freq, 0.26);
    musicNoteIndex++;
  }, 300);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// ===== UI =====
function makeCard(item, kind) {
  const card = document.createElement("div");
  card.className = "card";

  const left = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.name;

  const p = document.createElement("p");

  if (kind === "blessing") {
    p.textContent = `${item.desc} | Cost: ${fmt(item.cost)} | ${hasBlessing(item.id) ? "Purchased" : "Not purchased"}`;
  } else if (kind === "saint") {
    p.textContent = `${item.desc} | Cost: ${fmt(item.cost)} | ${hasSaint(item.id) ? "Unlocked" : "Locked"}`;
  } else {
    p.textContent = `${item.desc} | Owned: ${getOwned(item.id)} | Next cost: ${fmt(currentCost(item))}`;
  }

  left.appendChild(title);
  left.appendChild(p);

  const btn = document.createElement("button");
  btn.className = "buy";

  if (!isUnlocked(item)) {
      btn.textContent = `Unlock at best ${fmt(item.unlockAt)}`;
    btn.disabled = true;
  } else {
    if (kind === "blessing" && hasBlessing(item.id)) {
      btn.textContent = "Purchased";
      btn.disabled = true;
    } else if (kind === "saint" && hasSaint(item.id)) {
      btn.textContent = "Unlocked";
      btn.disabled = true;
    } else {
      const cost = currentCost(item);
      btn.textContent = `Buy (${fmt(cost)})`;
      btn.disabled = state.grace < cost;
      btn.addEventListener("click", () => buyItem(item, kind));
    }
  }

  card.appendChild(left);
  card.appendChild(btn);
  return card;
}

function render() {
  updateBest();

  graceEl.textContent = fmt(state.grace);
  bestGraceEl.textContent = fmt(state.bestGrace);

  perClickEl.textContent = fmt(effectivePerClick());
  perSecondEl.textContent = fmt(effectivePerSecond());

  multiplierEl.textContent = "x" + state.multiplier.toFixed(2);

  virtueEl.textContent = state.virtue.toString();
  virtueBonusEl.textContent = `+${Math.round((virtueBonusMultiplier() - 1) * 100)}%`;

  helpersPanel.innerHTML = "";
  toolsPanel.innerHTML = "";
  saintsPanel.innerHTML = "";
  blessingsPanel.innerHTML = "";
  prestigePanel.innerHTML = "";

  HELPERS.forEach(i => helpersPanel.appendChild(makeCard(i, "helper")));
  TOOLS.forEach(i => toolsPanel.appendChild(makeCard(i, "tool")));
  SAINTS.forEach(i => saintsPanel.appendChild(makeCard(i, "saint")));
  BLESSINGS.forEach(i => blessingsPanel.appendChild(makeCard(i, "blessing")));

  // Prestige panel
  const canEarn = virtueFromBest(state.bestGrace);
  const pending = Math.max(0, canEarn - state.virtue);

  const wrap = document.createElement("div");
  wrap.className = "card";

  const left = document.createElement("div");
  const h = document.createElement("h3");
  h.textContent = "Begin Anew (Prestige)";

  const p = document.createElement("p");
  p.textContent =
    `Virtue is earned from your Best Grace. ` +
    `Each Virtue gives +2% to all gains. ` +
    `If you prestige now, you gain: ${pending} Virtue.`;

  left.appendChild(h);
  left.appendChild(p);

  const btn = document.createElement("button");
  btn.className = "buy";
  btn.textContent = pending > 0 ? `Prestige (+${pending} Virtue)` : "Need more Best Grace";
  btn.disabled = pending <= 0;
  btn.addEventListener("click", () => prestige(pending));

  wrap.appendChild(left);
  wrap.appendChild(btn);
  prestigePanel.appendChild(wrap);

  updateAudioButtons();
}

// ===== Buying =====
function buyItem(item, kind) {
  const cost = currentCost(item);
  if (state.grace < cost) return;

  state.grace -= cost;

  if (kind === "blessing") {
    setBlessingBought(item.id);
    item.onBuy();
    popFloat("Blessing!");
  } else if (kind === "saint") {
    setSaint(item.id);
    item.onBuy();
    popFloat("Saint Unlocked!");
  } else {
    addOwned(item.id, 1);
    item.onBuy();
    popFloat(`+${fmt(effectivePerClick())}`);
  }

  updateBest();
  save();
  render();
}

// ===== Prestige =====
function prestige(gainVirtue) {
  const ok = confirm(
    `Prestige now and gain ${gainVirtue} Virtue?\n\n` +
    `This resets Grace + bought Helpers/Tools.\n` +
    `Saints, Blessings, and Virtue stay.`
  );
  if (!ok) return;

  state.virtue += gainVirtue;

  // Keep one-time unlocks
  const keepBlessings = { ...state.blessingsBought };
  const keepSaints = { ...state.saintsUnlocked };

  // Reset run
  state.grace = 0;
  state.perClickBase = 1;
  state.toolsClickBonus = 0;
  state.perSecond = 0;
  state.multiplier = 1.0;
  state.owned = {};

  // Re-apply blessings/saints effects after reset
  for (const b of BLESSINGS) if (keepBlessings[b.id]) b.onBuy();
  for (const s of SAINTS) if (keepSaints[s.id]) s.onBuy();

  popFloat("Begin Anew!");
  save();
  render();
}

// ===== Tabs =====
tabs.forEach(t => {
  t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");

    const tab = t.dataset.tab;
    document.getElementById("helpers").classList.toggle("hidden", tab !== "helpers");
    document.getElementById("tools").classList.toggle("hidden", tab !== "tools");
    document.getElementById("saints").classList.toggle("hidden", tab !== "saints");
    document.getElementById("blessings").classList.toggle("hidden", tab !== "blessings");
    document.getElementById("prestige").classList.toggle("hidden", tab !== "prestige");
  });
});

// ===== Audio UI =====
function updateAudioButtons() {
  if (sfxBtn) sfxBtn.textContent = state.sfxOn ? "SFX: ON" : "SFX: OFF";
  if (musicBtn) musicBtn.textContent = state.musicOn ? "Music: ON" : "Music: OFF";
}

if (sfxBtn) {
  sfxBtn.addEventListener("click", () => {
    state.sfxOn = !state.sfxOn;
    updateAudioButtons();
    save();
    if (state.sfxOn) clickPop();
  });
}

if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    state.musicOn = !state.musicOn;
    updateAudioButtons();
    save();

    // this click counts as user interaction, so it's allowed to start audio
    if (state.musicOn) startMusic();
    else stopMusic();
  });
}

// ===== Main click =====
prayBtn.addEventListener("click", () => {
  clickPop();

  // if user had music ON from last time, first click will start it
  if (state.musicOn && !musicTimer) startMusic();

  const gain = effectivePerClick();
  state.grace += gain;
  popFloat(`+${fmt(gain)}`);
  updateBest();
  render();
});

// ===== Save / Load / Offline =====
function save() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    state = {
      ...state,
      ...data,
      owned: data.owned ?? {},
      blessingsBought: data.blessingsBought ?? {},
      saintsUnlocked: data.saintsUnlocked ?? {},
    };
  } catch {}
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsedSec = Math.max(0, Math.floor((now - (state.lastSeen ?? now)) / 1000));
  if (elapsedSec <= 1) return;

  const capped = clamp(elapsedSec, 0, 8 * 60 * 60); // cap 8 hours
  const earned = effectivePerSecond() * capped;
  if (earned > 0) {
    state.grace += earned;
    popFloat(`+${fmt(earned)} offline`);
  }
}

// ===== Buttons =====
saveBtn.addEventListener("click", () => {
  save();
  popFloat("Saved!");
});

resetBtn.addEventListener("click", () => {
  const ok = confirm("Reset everything (including saints + virtue)? This cannot be undone.");
  if (!ok) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
});

// ===== Tick =====
setInterval(() => {
  const gain = effectivePerSecond();
  if (gain > 0) {
    state.grace += gain;
    updateBest();
    render();
  }
}, 1000);

setInterval(() => save(), 5000);

// ===== Start =====
load();
applyOfflineProgress();
render();
updateAudioButtons();
if (state.musicOn) {
  // will actually start on first user click if browser blocks autoplay
  // but if allowed, this will begin immediately
  startMusic();
}
save();
