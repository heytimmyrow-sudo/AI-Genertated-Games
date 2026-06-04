const STORAGE_KEY = "pulseLeagueState";
const SUPABASE_URL = "https://jbljqusdpifdyewlenun.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYq_rDXqj_Ate8B66PcJEQ_a6yv1YUl";
const SECOND = 1000;
const MIN_WORKOUT_MINUTES = 5;
const SHORT_WORKOUT_MESSAGE = "Workout too short to be recorded.";
const levelNames = ["Rookie", "Pacer", "Strider", "Climber", "Contender", "Champion", "Legend"];
const activityOptions = ["Volleyball", "Running", "Bike Riding", "Swimming", "Strength", "Other"];
const cosmeticRules = [
  { id: "rookie-pass", type: "profile", rarity: "common", featured: false, name: "Rookie Pass", unlockLevel: 1, cost: 0, accent: "PL", title: "Court Rookie", reward: "Starter profile badge" },
  { id: "bronze-band", type: "profile", rarity: "common", featured: false, name: "Bronze Wristband", unlockLevel: 2, cost: 80, accent: "BR", title: "Warmup Winner", reward: "Bronze leaderboard frame" },
  { id: "sunset-court", type: "background", rarity: "rare", featured: true, name: "Sunset Court", unlockLevel: 2, cost: 120, accent: "BG", title: "Golden Hour", reward: "Warm sunset app background" },
  { id: "water-arena", type: "background", rarity: "rare", featured: false, name: "Water Arena", unlockLevel: 3, cost: 160, accent: "BG", title: "Pool Lights", reward: "Blue aquatic app background" },
  { id: "xp-hour", type: "booster", rarity: "epic", featured: true, name: "1-Hour XP Booster", unlockLevel: 3, cost: 180, accent: "2X", title: "Boost Active", reward: "Double XP for one hour" },
  { id: "power-sweat", type: "effect", rarity: "rare", featured: false, name: "Power Sweatband", unlockLevel: 3, cost: 140, accent: "FX", title: "Practice Streaker", reward: "Animated court stripe effect" },
  { id: "captain-card", type: "profile", rarity: "rare", featured: false, name: "Captain Card", unlockLevel: 4, cost: 220, accent: "CP", title: "Team Captain", reward: "Captain spotlight card" },
  { id: "captain-title", type: "title", rarity: "epic", featured: false, name: "Captain Title", unlockLevel: 4, cost: 210, accent: "CP", title: "Team Captain", reward: "Profile title upgrade" },
  { id: "gold-token", type: "profile", rarity: "epic", featured: true, name: "Gold Prize Token", unlockLevel: 5, cost: 340, accent: "GT", title: "League Finisher", reward: "Gold profile glow" },
  { id: "neon-serve", type: "effect", rarity: "legendary", featured: false, name: "Neon Serve Trail", unlockLevel: 7, cost: 520, accent: "NS", title: "Challenge Crusher", reward: "Neon motion trail effect" },
  { id: "trophy-room", type: "background", rarity: "legendary", featured: true, name: "Trophy Room Key", unlockLevel: 10, cost: 900, accent: "99", title: "Prize Room Legend", reward: "Max-level trophy room background" }
];
const challengeRules = [
  { id: "daily-30", name: "Daily Spark", reward: 35, test: (stats) => stats.todayMinutes >= 30, detail: "Log 30 minutes today." },
  { id: "weekly-150", name: "Weekly Heat", reward: 100, test: (stats) => stats.weeklyMinutes >= 150, detail: "Reach 150 minutes this week." },
  { id: "try-three", name: "Triple Threat", reward: 75, test: (stats) => Object.values(stats.activityMinutes).filter(Boolean).length >= 3, detail: "Train in 3 activity types." },
  { id: "team-push", name: "Team Push", reward: 60, test: (stats) => stats.sessions >= 3, detail: "Finish 3 sessions." }
];
const rarityNames = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary"
};
const notificationTypes = {
  all: "All",
  workout: "Workouts",
  shop: "Shop",
  request: "Requests",
  challenge: "Challenges",
  safety: "Safety",
  recovery: "Recovery",
  system: "System"
};
const legacyPrizeMap = {
  neon: "neon-serve",
  wave: "power-sweat",
  bronze: "bronze-band",
  gold: "gold-token",
  classic: "rookie-pass"
};
const badgeRules = [
  { id: "first", name: "First Workout", test: (stats) => stats.sessions >= 1 },
  { id: "five", name: "5 Sessions", test: (stats) => stats.sessions >= 5 },
  { id: "streak", name: "5-Day Streak", test: (stats) => stats.streak >= 5 },
  { id: "hour", name: "Hour Session", test: (stats) => stats.longest >= 60 },
  { id: "volleyball", name: "Volleyball Practice", test: (stats) => (stats.activityMinutes.Volleyball || 0) >= 5 },
  { id: "week150", name: "150-Minute Week", test: (stats) => stats.weeklyMinutes >= 150 },
  { id: "level5", name: "Level 5", test: (stats) => stats.level >= 5 },
  { id: "balanced", name: "Cross Trainer", test: (stats) => Object.values(stats.activityMinutes).filter(Boolean).length >= 3 }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const todayKey = () => new Date().toISOString().slice(0, 10);

const state = loadState();
const online = {
  enabled: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  ready: false,
  busy: false,
  message: "Online sync starting."
};
const timer = {
  mode: "stopwatch",
  activity: "Volleyball",
  running: false,
  startedAt: 0,
  elapsedBeforeStart: 0,
  duration: 20 * 60 * SECOND,
  ticker: null,
  presetLabel: ""
};
saveState();

function loadState() {
  const fallback = {
    sessions: [],
    profiles: [{ id: "you", name: "You", username: "you", relation: "Self", setupCode: "PL-YOU", cosmetic: "rookie-pass", inLeague: true, owned: true }],
    activeProfileId: "you",
    ownerToken: makeOwnerToken(),
    recoveryCode: makeSetupCode("recover"),
    recoveryBackups: [],
    coins: 0,
    claimedChallenges: [],
    ownedPrizes: ["rookie-pass"],
    activeBoostUntil: "",
    equippedBackground: "",
    equippedEffect: "",
    equippedTitle: "",
    friendRequests: [],
    notifications: [],
    notificationFilter: "all",
    group: { name: "Family League", inviteCode: makeSetupCode("family"), private: true },
    teamName: "Pulse Team",
    coachChallenge: "",
    proofRequired: false,
    blockedUsers: [],
    freezeTokens: 1,
    lastSection: "progress",
    goals: { daily: 30, weekly: 150 },
    theme: "court",
    dark: false,
    sound: true,
    vibration: false
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const merged = { ...fallback, ...parsed };
    merged.goals = { ...fallback.goals, ...(parsed.goals || {}) };
    merged.group = { ...fallback.group, ...(parsed.group || {}) };
    merged.claimedChallenges = parsed.claimedChallenges || fallback.claimedChallenges;
    merged.ownedPrizes = [...new Set((parsed.ownedPrizes || fallback.ownedPrizes)
      .map((id) => legacyPrizeMap[id] || id)
      .filter((id) => cosmeticRules.some((entry) => entry.id === id)))];
    merged.friendRequests = parsed.friendRequests || fallback.friendRequests;
    merged.notificationFilter = parsed.notificationFilter || fallback.notificationFilter;
    merged.notifications = (parsed.notifications || fallback.notifications).map((note) => ({
      id: note.id || crypto.randomUUID(),
      type: note.type || "system",
      title: note.title || "Pulse League",
      message: note.message || "",
      createdAt: note.createdAt || new Date().toISOString(),
      read: Boolean(note.read)
    }));
    merged.blockedUsers = parsed.blockedUsers || fallback.blockedUsers;
    merged.recoveryBackups = parsed.recoveryBackups || fallback.recoveryBackups;
    merged.profiles = parsed.profiles?.length ? parsed.profiles.map((profile, index) => {
      const cosmeticMap = {
        classic: "rookie-pass",
        bronze: "bronze-band",
        wave: "power-sweat",
        captain: "captain-card",
        gold: "gold-token",
        neon: "neon-serve"
      };
      return {
        relation: index === 0 ? "Self" : "Friend",
        username: normalizeUsername(profile.username || profile.name || `player_${index + 1}`),
        setupCode: makeSetupCode(profile.name || `Player ${index + 1}`),
        cosmetic: "rookie-pass",
        inLeague: index === 0 || profile.relation === "Friend" || profile.relation === "Family",
        owned: index === 0 || profile.relation === "Self",
        ...profile,
        cosmetic: legacyPrizeMap[cosmeticMap[profile.cosmetic] || profile.cosmetic] || cosmeticMap[profile.cosmetic] || profile.cosmetic || "rookie-pass"
      };
    }) : fallback.profiles;
    merged.sessions = (parsed.sessions || []).map((session) => ({
      profileId: "you",
      note: "",
      ...session
    }));
    if (!merged.profiles.some((profile) => profile.id === merged.activeProfileId)) {
      merged.activeProfileId = merged.profiles[0].id;
    }
    if (merged.dark && !parsed.theme) merged.theme = "dark";
    return merged;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeOwnerToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function makeSetupCode(name) {
  const seed = String(name || "Player").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "PL";
  return `PL-${seed}-${Math.floor(100 + Math.random() * 900)}`;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 24);
}

function activeProfile() {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0];
}

function activeBooster() {
  return state.activeBoostUntil && new Date(state.activeBoostUntil).getTime() > Date.now();
}

function profileSessions(profileId = state.activeProfileId) {
  return state.sessions.filter((session) => session.profileId === profileId);
}

function weekStart(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function sameDay(a, b) {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

function timeUntilNextWeek() {
  const next = weekStart();
  next.setDate(next.getDate() + 7);
  const diff = Math.max(0, next.getTime() - Date.now());
  const days = Math.floor(diff / (24 * 60 * 60 * SECOND));
  const hours = Math.floor((diff % (24 * 60 * 60 * SECOND)) / (60 * 60 * SECOND));
  return `${days}d ${hours}h`;
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatShortMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getElapsed() {
  if (!timer.running) return timer.elapsedBeforeStart;
  return timer.elapsedBeforeStart + Date.now() - timer.startedAt;
}

function getDisplayTime() {
  return timer.mode === "timer" ? Math.max(0, timer.duration - getElapsed()) : getElapsed();
}

function tick() {
  $("#clockDisplay").textContent = formatClock(getDisplayTime());
  if (timer.mode === "timer" && timer.running && getElapsed() >= timer.duration) {
    finishSession();
    fireAlert();
  }
}

function fireAlert() {
  if (state.vibration && navigator.vibrate) navigator.vibrate([160, 80, 160]);
  if (!state.sound) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 740;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch {
    showSessionMessage("Timer finished.");
  }
}

function startTimer() {
  if (timer.running) {
    timer.elapsedBeforeStart = getElapsed();
    timer.running = false;
    clearInterval(timer.ticker);
    $("#startPauseButton").textContent = "Resume";
    $("#timer-title").textContent = "Paused";
    tick();
    return;
  }

  showSessionMessage("");
  timer.running = true;
  timer.startedAt = Date.now();
  timer.ticker = setInterval(tick, 250);
  $("#startPauseButton").textContent = "Pause";
  $("#timer-title").textContent = timer.presetLabel || timer.activity;
  tick();
}

function resetTimer() {
  timer.running = false;
  timer.elapsedBeforeStart = 0;
  clearInterval(timer.ticker);
  $("#startPauseButton").textContent = "Start";
  $("#timer-title").textContent = "Ready";
  tick();
}

async function finishSession() {
  const elapsed = timer.mode === "timer" ? Math.min(getElapsed(), timer.duration) : getElapsed();
  if (elapsed < MIN_WORKOUT_MINUTES * 60 * SECOND) {
    showSessionMessage(SHORT_WORKOUT_MESSAGE);
    resetTimer();
    return;
  }

  const minutes = Math.max(MIN_WORKOUT_MINUTES, Math.round(elapsed / 60000));
  const note = $("#timerNote").value.trim();
  if (await logSession(timer.activity, minutes, note)) {
    $("#timerNote").value = "";
  }
  resetTimer();
}

function showSessionMessage(message) {
  $("#sessionMessage").textContent = message;
}

function showProfileMessage(message) {
  $("#profileMessage").textContent = message;
}

function showOnlineMessage(message, isError = false) {
  const el = $("#onlineStatus");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function notify(message, type = "system", title = "Pulse League") {
  state.notifications.unshift({
    id: crypto.randomUUID(),
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false
  });
  state.notifications = state.notifications.slice(0, 30);
}

function notificationTypeLabel(type) {
  return notificationTypes[type] || notificationTypes.system;
}

function suspiciousSession(minutes, note = "") {
  return minutes > 180 || /fake|cheat|not real/i.test(note);
}

async function logSession(activity, minutes, note = "") {
  if (minutes < MIN_WORKOUT_MINUTES) {
    showSessionMessage(SHORT_WORKOUT_MESSAGE);
    return false;
  }
  if (state.proofRequired && !$("#proofNote")?.value.trim()) {
    showSessionMessage("Proof note required for this league.");
    return false;
  }

  const flagged = suspiciousSession(minutes, note);
  const multiplier = activeBooster() ? 2 : 1;
  const session = {
    id: crypto.randomUUID(),
    profileId: state.activeProfileId,
    activity: activity || "Other",
    minutes,
    note,
    points: minutes * 10 * multiplier,
    proof: $("#proofNote")?.value.trim() || "",
    flagged,
    createdAt: new Date().toISOString()
  };
  state.sessions.unshift(session);
  state.sessions = state.sessions.slice(0, 240);
  if (!flagged) {
    state.coins += Math.max(1, Math.round(minutes / 5));
    notify(`${formatShortMinutes(minutes)} ${activity || "Other"} logged.`, "workout", "Workout recorded");
    if (multiplier > 1) notify("1-hour XP booster doubled this workout.", "shop", "Booster");
  } else {
    notify("A workout was flagged for review and did not earn coins.", "safety", "Safety check");
  }
  saveState();
  render();
  showSessionMessage("");
  syncSessionOnline(session);
  return true;
}

function statsFor(profileId = state.activeProfileId) {
  const sessions = profileSessions(profileId);
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * SECOND;
  const currentWeek = weekStart();
  const activityMinutes = {};
  let totalMinutes = 0;
  let weeklyMinutes = 0;
  let weeklyPoints = 0;
  let todayMinutes = 0;
  let longest = 0;

  for (const session of sessions) {
    totalMinutes += session.minutes;
    longest = Math.max(longest, session.minutes);
    activityMinutes[session.activity] = (activityMinutes[session.activity] || 0) + session.minutes;
    const time = new Date(session.createdAt).getTime();
    if (time >= weekAgo) weeklyPoints += session.points;
    if (new Date(session.createdAt) >= currentWeek) weeklyMinutes += session.minutes;
    if (sameDay(session.createdAt, new Date())) todayMinutes += session.minutes;
  }

  const xp = sessions.reduce((sum, session) => sum + session.points, 0);
  const level = Math.floor(xp / 500) + 1;
  const progress = (xp % 500) / 500;
  const favorite = Object.entries(activityMinutes).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  return {
    sessions: sessions.length,
    sessionList: sessions,
    totalMinutes,
    weeklyMinutes,
    weeklyPoints,
    todayMinutes,
    longest,
    xp,
    level,
    progress,
    favorite,
    activityMinutes,
    streak: getStreakDays(sessions)
  };
}

function getStreakDays(sessions) {
  const days = new Set(sessions.map((session) => session.createdAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderProgress() {
  const stats = statsFor();
  const label = levelNames[Math.min(stats.level - 1, levelNames.length - 1)];
  $("#totalTimeHero").textContent = formatShortMinutes(stats.totalMinutes);
  $("#levelHero").textContent = `Level ${stats.level}`;
  $("#tournamentHero").textContent = `${stats.weeklyPoints} pts`;
  $("#levelTitle").textContent = `Level ${stats.level} ${label}`;
  $("#pointsChip").textContent = `${stats.xp} XP`;
  $("#coinHero").textContent = `${state.coins} coins`;
  $("#levelFill").style.width = `${Math.round(stats.progress * 100)}%`;
  $("#levelHint").textContent = `${Math.max(0, stats.level * 500 - stats.xp)} XP until Level ${stats.level + 1}. Every tracked minute is worth 10 XP.`;
  $("#sessionCount").textContent = stats.sessions;
  $("#longestSession").textContent = formatShortMinutes(stats.longest);
  $("#streakDays").textContent = `${stats.streak} days`;
  $("#favoriteActivity").textContent = stats.favorite;
}

function renderGoals() {
  $("#dailyGoal").value = state.goals.daily;
  $("#weeklyGoal").value = state.goals.weekly;
  const stats = statsFor();
  const goals = [
    { label: "Today", done: stats.todayMinutes, target: state.goals.daily },
    { label: "This week", done: stats.weeklyMinutes, target: state.goals.weekly }
  ];
  $("#goalList").innerHTML = goals.map((goal) => {
    const pct = goal.target ? Math.min(100, Math.round((goal.done / goal.target) * 100)) : 0;
    return `
      <div class="goal-item">
        <div><strong>${goal.label}</strong><span>${formatShortMinutes(goal.done)} / ${formatShortMinutes(goal.target)}</span></div>
        <div class="level-track"><div class="level-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderProfiles() {
  $("#displayName").value = activeProfile().name;
  $("#profileSelect").innerHTML = state.profiles.filter((profile) => profile.owned || profile.relation === "Self").map((profile) => (
    `<option value="${profile.id}" ${profile.id === state.activeProfileId ? "selected" : ""}>${escapeHtml(profile.name)}</option>`
  )).join("");

  const leaders = state.profiles
    .filter((profile) => profile.relation === "Self" || profile.inLeague)
    .map((profile) => ({ ...profile, stats: statsFor(profile.id) }))
    .sort((a, b) => b.stats.weeklyPoints - a.stats.weeklyPoints);
  $("#leaderboard").innerHTML = leaders.map((profile, index) => `
    <li class="leader-row cosmetic-${escapeHtml(profile.cosmetic || "rookie-pass")}">
      <span class="rank">${index + 1}</span>
      <div class="leader-meta">
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(profile.relation || "Friend")} profile · @${escapeHtml(profile.username || normalizeUsername(profile.name))}${profile.id === state.activeProfileId ? " · Active" : ""}</span>
      </div>
      <div class="leader-actions">
        <span class="leader-score">${profile.stats.weeklyPoints} pts</span>
        ${profile.relation === "Self" ? "" : `<button class="ghost-button mini danger" type="button" data-remove-profile="${profile.id}">Remove</button>`}
      </div>
    </li>
  `).join("");
}

function renderCosmetics() {
  const profile = activeProfile();
  const stats = statsFor();
  const selected = profile.cosmetic || "rookie-pass";
  const cosmetic = cosmeticRules.find((entry) => entry.id === selected) || cosmeticRules[0];
  $("#cosmeticLevel").textContent = `Level ${stats.level}`;
  $("#profileCard").className = `profile-card cosmetic-${cosmetic.id} effect-${state.equippedEffect || "none"} background-${state.equippedBackground || "none"}`;
  $("#profileCard").innerHTML = `
    <div class="avatar-badge">${escapeHtml(cosmetic.accent)}</div>
    <div>
      <strong>${escapeHtml(profile.name)}</strong>
      <span>${escapeHtml(cosmetic.title)} · ${escapeHtml(cosmetic.reward)}</span>
    </div>
  `;
  $("#cosmeticGrid").innerHTML = cosmeticRules.filter((entry) => state.ownedPrizes.includes(entry.id)).map((entry) => {
    const active = (
      (entry.type === "profile" && selected === entry.id) ||
      (entry.type === "background" && state.equippedBackground === entry.id) ||
      (entry.type === "effect" && state.equippedEffect === entry.id) ||
      (entry.type === "title" && state.equippedTitle === entry.title)
    );
    const label = entry.type === "booster" ? (activeBooster() ? "2x XP is active" : "Consumable booster") : active ? `Equipped - ${entry.title}` : `${entry.type} - ${entry.reward}`;
    return `
      <button class="cosmetic-card cosmetic-${entry.id} ${active ? "active" : ""}" type="button" data-cosmetic="${entry.id}" ${entry.type === "booster" ? "disabled" : ""}>
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }).join("") || `<div class="empty-state">Buy prizes in the shop, then equip them here.</div>`;
}

function renderPrizeShop() {
  const stats = statsFor();
  $("#coinBalance").textContent = `${state.coins} coins`;
  $("#featuredPrizeGrid").innerHTML = cosmeticRules.filter((entry) => entry.featured).map((entry) => `
    <div class="featured-prize cosmetic-${entry.id}">
      <strong>${escapeHtml(entry.name)}</strong>
      <span>${escapeHtml(rarityNames[entry.rarity])} ${escapeHtml(entry.type)} - ${entry.cost} coins</span>
    </div>
  `).join("");
  $("#prizeShopGrid").innerHTML = cosmeticRules.map((entry) => {
    const owned = state.ownedPrizes.includes(entry.id);
    const unlocked = stats.level >= entry.unlockLevel;
    const affordable = state.coins >= entry.cost;
    const boosterRunning = entry.type === "booster" && activeBooster();
    return `
      <button class="shop-card rarity-${entry.rarity} cosmetic-${entry.id}" type="button" data-buy-prize="${entry.id}" ${owned || boosterRunning || !unlocked || !affordable ? "disabled" : ""}>
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${escapeHtml(rarityNames[entry.rarity])} ${entry.type} - ${boosterRunning ? "Active now" : owned ? "Owned" : !unlocked ? `Unlocks at Level ${entry.unlockLevel}` : `${entry.cost} coins - ${entry.reward}`}</span>
      </button>
    `;
  }).join("");
}

function renderChallenges() {
  const stats = statsFor();
  $("#challengeGrid").innerHTML = challengeRules.map((challenge) => {
    const done = challenge.test(stats);
    const claimed = state.claimedChallenges.includes(challenge.id);
    return `
      <button class="challenge-card ${done ? "ready" : ""}" type="button" data-claim-challenge="${challenge.id}" ${!done || claimed ? "disabled" : ""}>
        <strong>${escapeHtml(challenge.name)}</strong>
        <span>${claimed ? "Claimed" : done ? `Claim ${challenge.reward} coins` : challenge.detail}</span>
      </button>
    `;
  }).join("");
}

function renderActivityStats() {
  const stats = statsFor();
  const all = [...new Set([...activityOptions, ...Object.keys(stats.activityMinutes)])];
  $("#activityStats").innerHTML = all.map((activity) => {
    const mins = stats.activityMinutes[activity] || 0;
    return `<div class="activity-stat"><strong>${escapeHtml(activity)}</strong><span>${formatShortMinutes(mins)}</span></div>`;
  }).join("");
}

function renderChart() {
  const sessions = profileSessions();
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const minutes = sessions.filter((session) => session.createdAt.slice(0, 10) === key)
      .reduce((sum, session) => sum + session.minutes, 0);
    days.push({ label: day.toLocaleDateString(undefined, { weekday: "short" }), minutes });
  }
  const max = Math.max(30, ...days.map((day) => day.minutes));
  $("#weeklyChart").innerHTML = days.map((day) => `
    <div class="bar-column">
      <div class="bar-fill" style="height:${Math.max(6, Math.round((day.minutes / max) * 100))}%"></div>
      <strong>${day.minutes}</strong>
      <span>${day.label}</span>
    </div>
  `).join("");
}

function renderCalendar() {
  const now = new Date();
  $("#calendarTitle").textContent = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const activeDays = new Set(profileSessions().map((session) => session.createdAt.slice(0, 10)));
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(`<span class="calendar-day muted"></span>`);
  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);
    cells.push(`<span class="calendar-day ${activeDays.has(date) ? "active" : ""}">${day}</span>`);
  }
  $("#calendarGrid").innerHTML = ["S", "M", "T", "W", "T", "F", "S"].map((d) => `<strong>${d}</strong>`).join("") + cells.join("");
}

function renderRecords() {
  const stats = statsFor();
  const dayTotals = {};
  const weekTotals = {};
  for (const session of stats.sessionList) {
    const day = session.createdAt.slice(0, 10);
    const week = weekStart(new Date(session.createdAt)).toISOString().slice(0, 10);
    dayTotals[day] = (dayTotals[day] || 0) + session.minutes;
    weekTotals[week] = (weekTotals[week] || 0) + session.minutes;
  }
  const records = [
    ["Longest workout", formatShortMinutes(stats.longest)],
    ["Best day", formatShortMinutes(Math.max(0, ...Object.values(dayTotals)))],
    ["Best week", formatShortMinutes(Math.max(0, ...Object.values(weekTotals)))],
    ["Highest streak", `${stats.streak} days`]
  ];
  $("#recordGrid").innerHTML = records.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderBadges() {
  const stats = statsFor();
  $("#badgeGrid").innerHTML = badgeRules.map((badge) => {
    const unlocked = badge.test(stats);
    return `<div class="badge ${unlocked ? "unlocked" : ""}"><strong>${escapeHtml(badge.name)}</strong><span>${unlocked ? "Unlocked" : "Locked"}</span></div>`;
  }).join("");
}

function renderTournamentHistory() {
  const leaders = state.profiles
    .filter((profile) => profile.relation === "Self" || profile.inLeague)
    .map((profile) => ({ ...profile, stats: statsFor(profile.id) }))
    .sort((a, b) => b.stats.weeklyPoints - a.stats.weeklyPoints);
  const current = leaders[0];
  $("#cupCountdown").textContent = timeUntilNextWeek();
  $("#cupLeader").textContent = current ? `${current.name} - ${current.stats.weeklyPoints} pts` : "No leader yet";
  $("#cupMedals").innerHTML = leaders.slice(0, 3).map((profile, index) => `
    <div class="cup-medal">
      <strong>${["Gold", "Silver", "Bronze"][index]}</strong>
      <span>${escapeHtml(profile.name)} - ${profile.stats.weeklyPoints} pts</span>
    </div>
  `).join("") || `<div class="empty-state">Log a workout to start the cup.</div>`;
  $("#cupStandings").innerHTML = leaders.map((profile, index) => `
    <li class="history-row">
      <div class="history-meta"><strong>#${index + 1} ${escapeHtml(profile.name)}</strong><span>${profile.stats.weeklyMinutes} minutes this week</span></div>
      <span class="history-time">${profile.stats.weeklyPoints} pts</span>
    </li>
  `).join("") || `<li class="empty-state">No standings yet.</li>`;
  const sessions = profileSessions();
  const weeks = {};
  for (const session of sessions) {
    const key = weekStart(new Date(session.createdAt)).toISOString().slice(0, 10);
    weeks[key] = (weeks[key] || 0) + session.points;
  }
  const rows = Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  $("#tournamentHistory").innerHTML = rows.length ? rows.map(([week, points]) => `
    <li class="history-row"><div class="history-meta"><strong>Week of ${week}</strong><span>Weekly cup</span></div><span class="history-time">${points} pts</span></li>
  `).join("") : `<li class="empty-state">No weekly cups yet.</li>`;
}

function renderHistory() {
  const list = $("#historyList");
  const sessions = profileSessions();
  list.innerHTML = "";
  if (!sessions.length) {
    list.append($("#historyEmptyTemplate").content.cloneNode(true));
    return;
  }
  for (const session of sessions.slice(0, 12)) {
    const item = document.createElement("li");
    item.className = "history-row";
    const date = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(session.createdAt));
    item.innerHTML = `
      <div class="history-meta">
        <strong>${escapeHtml(session.activity)}</strong>
        <span>${date} · ${session.points} XP${session.note ? ` · ${escapeHtml(session.note)}` : ""}</span>
      </div>
      <div class="row-actions">
        <span class="history-time">${formatShortMinutes(session.minutes)}</span>
        <button class="ghost-button mini" type="button" data-edit="${session.id}">Edit</button>
        <button class="ghost-button mini danger" type="button" data-delete="${session.id}">Delete</button>
      </div>
    `;
    list.append(item);
  }
}

function renderUpgradePanels() {
  const profile = activeProfile();
  const stats = statsFor();
  const pending = state.friendRequests.filter((request) => request.status === "pending");
  const flagged = state.sessions.filter((session) => session.flagged);
  const teamMembers = state.profiles.filter((entry) => entry.relation === "Self" || entry.inLeague);
  const teamMinutes = teamMembers.reduce((sum, entry) => sum + statsFor(entry.id).weeklyMinutes, 0);
  $("#profilePageCard").innerHTML = `
    <div class="profile-card cosmetic-${escapeHtml(profile.cosmetic || "rookie-pass")}">
      <div class="avatar-badge">${escapeHtml((profile.username || profile.name || "PL").slice(0, 2).toUpperCase())}</div>
      <div>
        <strong>${escapeHtml(profile.name)}</strong>
        <span>@${escapeHtml(profile.username || normalizeUsername(profile.name))} - Level ${stats.level} - ${formatShortMinutes(stats.totalMinutes)}</span>
      </div>
    </div>
  `;
  const accepted = state.friendRequests.filter((request) => request.status === "accepted").length;
  const declined = state.friendRequests.filter((request) => request.status === "declined").length;
  $("#requestStats").innerHTML = `
    <div><span>Pending</span><strong>${pending.length}</strong></div>
    <div><span>Accepted</span><strong>${accepted}</strong></div>
    <div><span>Declined</span><strong>${declined}</strong></div>
    <div><span>Online</span><strong>${online.ready ? "Ready" : "Local"}</strong></div>
  `;
  $("#friendRequestList").innerHTML = state.friendRequests.length ? state.friendRequests.map((request) => `
    <li class="history-row">
      <div class="history-meta"><strong>@${escapeHtml(request.username)}</strong><span>${escapeHtml(request.relation)} request - ${escapeHtml(request.status)}</span></div>
      <div class="row-actions">
        ${request.status === "pending" ? `<button class="ghost-button mini" type="button" data-accept-request="${request.id}">Accept</button><button class="ghost-button mini danger" type="button" data-decline-request="${request.id}">Decline</button>` : ""}
      </div>
    </li>
  `).join("") : `<li class="empty-state">No friend requests yet.</li>`;
  $("#leagueSummary").innerHTML = `
    <div><span>Private group</span><strong>${escapeHtml(state.group.name)}</strong></div>
    <div><span>Invite code</span><strong>${escapeHtml(state.group.inviteCode)}</strong></div>
    <div><span>Team</span><strong>${escapeHtml(state.teamName)}</strong></div>
    <div><span>Team week</span><strong>${formatShortMinutes(teamMinutes)}</strong></div>
  `;
  $("#safetySummary").innerHTML = `
    <div><span>Flagged sessions</span><strong>${flagged.length}</strong></div>
    <div><span>Proof required</span><strong>${state.proofRequired ? "On" : "Off"}</strong></div>
    <div><span>Blocked users</span><strong>${state.blockedUsers.length}</strong></div>
    <div><span>Freeze tokens</span><strong>${state.freezeTokens}</strong></div>
  `;
  $("#coachChallengeText").textContent = state.coachChallenge || "No coach challenge set.";
  $("#recoveryCode").textContent = state.recoveryCode;
  $("#recoveryCodeMirror").textContent = state.recoveryCode;
  $("#recoveryBackupList").innerHTML = state.recoveryBackups.length ? state.recoveryBackups.map((backup) => (
    `<li class="history-row"><div class="history-meta"><strong>${escapeHtml(backup.label)}</strong><span>${new Date(backup.createdAt).toLocaleString()}</span></div></li>`
  )).join("") : `<li class="empty-state">No recovery backups yet.</li>`;
  $("#proofRequired").checked = state.proofRequired;
}

function renderNotifications() {
  const unread = state.notifications.filter((note) => !note.read).length;
  const filter = notificationTypes[state.notificationFilter] ? state.notificationFilter : "all";
  const visible = filter === "all"
    ? state.notifications
    : state.notifications.filter((note) => (note.type || "system") === filter);
  $("#notificationBadge").textContent = `${unread} unread`;
  $("#topNotificationCount").textContent = unread;
  $("#topNotificationButton").classList.toggle("has-alerts", unread > 0);
  $("#markNotificationsRead").disabled = unread === 0;
  $("#clearNotifications").disabled = state.notifications.length === 0;
  $("#notificationFilters").innerHTML = Object.entries(notificationTypes).map(([type, label]) => {
    const count = type === "all"
      ? state.notifications.length
      : state.notifications.filter((note) => (note.type || "system") === type).length;
    return `<button class="filter-chip ${filter === type ? "active" : ""}" type="button" data-notification-filter="${type}">${label} <span>${count}</span></button>`;
  }).join("");
  $("#notificationList").innerHTML = visible.length ? visible.map((note) => {
    const createdAt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(note.createdAt));
    return `
      <li class="history-row notification-row ${note.read ? "" : "unread"}">
        <div class="history-meta">
          <strong>${escapeHtml(note.title || "Pulse League")}</strong>
          <span><b>${escapeHtml(notificationTypeLabel(note.type))}</b> - ${createdAt} - ${escapeHtml(note.message)}</span>
        </div>
        <div class="row-actions">
          ${note.read ? `<span class="read-state">Read</span>` : `<button class="ghost-button mini" type="button" data-read-notification="${note.id}">Read</button>`}
        </div>
      </li>
    `;
  }).join("") : `<li class="empty-state">No notifications in this filter.</li>`;
}

function renderSettings() {
  document.body.className = "";
  document.body.classList.toggle("timer-mode", timer.mode === "timer");
  document.body.classList.add(`theme-${state.theme}`);
  if (state.theme === "dark") document.body.classList.add("dark");
  $("#themeSelect").value = state.theme;
  $("#soundToggle").checked = state.sound;
  $("#vibrationToggle").checked = state.vibration;
  $("#groupName").value = state.group.name;
  $("#teamName").value = state.teamName;
  $("#coachChallenge").value = state.coachChallenge;
}

function render() {
  renderSettings();
  showOnlineMessage(online.message, !online.ready && !online.busy);
  $("#timerModeLabel").textContent = timer.mode === "timer" ? "Timer" : "Stopwatch";
  renderProfiles();
  renderCosmetics();
  renderPrizeShop();
  renderChallenges();
  renderProgress();
  renderGoals();
  renderActivityStats();
  renderChart();
  renderCalendar();
  renderRecords();
  renderBadges();
  renderTournamentHistory();
  renderHistory();
  renderUpgradePanels();
  renderNotifications();
  tick();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function setActiveButton(buttons, activeButton) {
  buttons.forEach((button) => button.classList.toggle("active", button === activeButton));
}

function closeMobileSidebar() {
  const sidebar = $("#mobileSidebar");
  const scrim = $("#mobileSidebarScrim");
  document.body.classList.remove("sidebar-open");
  sidebar?.setAttribute("aria-hidden", "true");
  if (sidebar) sidebar.style.transform = "";
  if (scrim) {
    scrim.style.opacity = "";
    scrim.style.pointerEvents = "";
  }
  $("#mobileMenuButton")?.setAttribute("aria-expanded", "false");
}

function openMobileSidebar() {
  const sidebar = $("#mobileSidebar");
  const scrim = $("#mobileSidebarScrim");
  document.body.classList.add("sidebar-open");
  sidebar?.setAttribute("aria-hidden", "false");
  if (sidebar) sidebar.style.transform = "translateX(0)";
  if (scrim) {
    scrim.style.opacity = "1";
    scrim.style.pointerEvents = "auto";
  }
  $("#mobileMenuButton")?.setAttribute("aria-expanded", "true");
}

function activateDashboardSection(sectionName, shouldScroll = true) {
  $$(".dashboard-section").forEach((section) => {
    section.classList.toggle("active", section.dataset.section === sectionName);
  });
  $$("[data-section-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sectionTarget === sectionName);
  });
  closeMobileSidebar();
  if (shouldScroll) {
    const target = document.querySelector(`[data-section="${sectionName}"]`);
    if (!target) return;
    const jumpToSection = () => window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 10,
      behavior: "smooth"
    });
    jumpToSection();
    if (window.matchMedia("(max-width: 980px)").matches) {
      setTimeout(jumpToSection, 220);
    }
  }
}

function showDashboardSection(sectionName) {
  state.lastSection = sectionName;
  saveState();
  activateDashboardSection(sectionName);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRpc(name, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Pulse League online request failed (${response.status}).`);
  }
  return response.json();
}

function setOnlineState(message, ready = online.ready, busy = false) {
  online.message = message;
  online.ready = ready;
  online.busy = busy;
  showOnlineMessage(message, !ready && !busy);
}

function upsertProfileFromOnline(remoteProfile, relation = "Friend", owned = false) {
  const username = remoteProfile.username || normalizeUsername(remoteProfile.display_name);
  const existing = state.profiles.find((profile) => profile.remoteId === remoteProfile.id || profile.username === username);
  if (owned) {
    state.profiles.forEach((profile) => {
      profile.owned = false;
      if (profile.relation === "Self") profile.relation = "Unlisted";
    });
  }
  const next = {
    id: existing?.id || remoteProfile.id,
    remoteId: remoteProfile.id,
    username,
    name: remoteProfile.display_name || username,
    relation: owned ? "Self" : relation,
    setupCode: `@${username}`,
    cosmetic: remoteProfile.cosmetic || "rookie-pass",
    inLeague: true,
    owned
  };
  if (existing) {
    Object.assign(existing, next);
    if (owned && Number.isFinite(remoteProfile.coins)) state.coins = remoteProfile.coins;
    return existing;
  }
  state.profiles.push(next);
  if (owned && Number.isFinite(remoteProfile.coins)) state.coins = remoteProfile.coins;
  return next;
}

function importLeagueData(payload) {
  const active = activeProfile();
  const profiles = payload?.profiles || [];
  const sessions = payload?.sessions || [];
  const localIdsByRemote = new Map();
  profiles.forEach((profile) => {
    const relation = profile.id === active.remoteId ? "Self" : (profile.relation || "Friend");
    const local = upsertProfileFromOnline(profile, relation, profile.id === active.remoteId);
    localIdsByRemote.set(profile.id, local.id);
  });
  state.sessions = state.sessions.filter((session) => !session.remoteId);
  for (const session of sessions) {
    const localProfileId = localIdsByRemote.get(session.profile_id);
    if (!localProfileId) continue;
    state.sessions.push({
      id: session.id,
      remoteId: session.id,
      profileId: localProfileId,
      activity: session.activity,
      minutes: session.minutes,
      note: session.note || "",
      points: session.points,
      proof: session.proof || "",
      flagged: Boolean(session.flagged),
      createdAt: session.created_at
    });
  }
  state.sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveState();
}

async function claimOnlineProfile(name) {
  const username = normalizeUsername(name);
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    showProfileMessage("Use 3-24 letters, numbers, or underscores for an online username.");
    return null;
  }
  setOnlineState("Saving online profile...", false, true);
  const previousProfileId = activeProfile().id;
  const result = await supabaseRpc("pulse_league_claim_profile", {
    p_username: username,
    p_display_name: name.trim(),
    p_owner_token: state.ownerToken
  });
  if (!["claimed", "owned"].includes(result.status)) {
    showProfileMessage(result.status === "taken" ? "That Pulse League username is already taken." : "That username cannot be used.");
    setOnlineState("Online profile not saved.", false, false);
    return null;
  }
  const profile = upsertProfileFromOnline(result.profile, "Self", true);
  state.sessions.forEach((session) => {
    if (session.profileId === previousProfileId && !session.remoteId) session.profileId = profile.id;
  });
  state.activeProfileId = profile.id;
  saveState();
  setOnlineState(`Online as @${profile.username}.`, true, false);
  showProfileMessage(`Your online Pulse League name is @${profile.username}.`);
  await syncLeagueOnline();
  render();
  return profile;
}

async function addFriendOnline(query, relation) {
  const active = activeProfile();
  if (!active.remoteId) {
    showProfileMessage("Create your online username first.");
    return;
  }
  setOnlineState("Finding online profile...", online.ready, true);
  const result = await supabaseRpc("pulse_league_add_connection", {
    p_owner_profile_id: active.remoteId,
    p_owner_token: state.ownerToken,
    p_target_username: normalizeUsername(query),
    p_relation: relation
  });
  if (result.status !== "added") {
    showProfileMessage(result.status === "missing" ? "No Pulse League profile found for that username." : "Could not add that profile.");
    setOnlineState(`Online as @${active.username}.`, true, false);
    return;
  }
  upsertProfileFromOnline(result.profile, relation, false);
  saveState();
  showProfileMessage(`${result.profile.display_name} added as ${relation}.`);
  setOnlineState(`Online as @${active.username}.`, true, false);
  await syncLeagueOnline();
  render();
}

async function syncLeagueOnline() {
  const active = activeProfile();
  if (!online.enabled || !active.remoteId) return;
  try {
    setOnlineState("Syncing league...", online.ready, true);
    const data = await supabaseRpc("pulse_league_get_league", { p_profile_id: active.remoteId });
    importLeagueData(data);
    setOnlineState(`Online as @${active.username}.`, true, false);
    render();
  } catch (error) {
    setOnlineState("Online setup needed. Run supabase/pulse-league-online.sql.", false, false);
  }
}

async function syncSessionOnline(session) {
  const profile = activeProfile();
  if (!online.enabled || !profile.remoteId || session.remoteId) return;
  try {
    const result = await supabaseRpc("pulse_league_log_session", {
      p_profile_id: profile.remoteId,
      p_owner_token: state.ownerToken,
      p_activity: session.activity,
      p_minutes: session.minutes,
      p_note: session.note || ""
    });
    session.remoteId = result.session?.id;
    saveState();
    await syncLeagueOnline();
  } catch {
    showSessionMessage("Saved on this device. Online sync will retry after setup.");
  }
}

async function removeConnectionOnline(profile) {
  const active = activeProfile();
  if (!profile.remoteId || !active.remoteId) return;
  await supabaseRpc("pulse_league_remove_connection", {
    p_owner_profile_id: active.remoteId,
    p_owner_token: state.ownerToken,
    p_target_profile_id: profile.remoteId
  });
}

async function deleteSessionOnline(session) {
  if (!session.remoteId) return;
  await supabaseRpc("pulse_league_delete_session", {
    p_session_id: session.remoteId,
    p_owner_token: state.ownerToken
  });
}

async function updateSessionOnline(session) {
  if (!session.remoteId) return;
  await supabaseRpc("pulse_league_update_session", {
    p_session_id: session.remoteId,
    p_owner_token: state.ownerToken,
    p_activity: session.activity,
    p_minutes: session.minutes,
    p_note: session.note || ""
  });
}

async function initOnline() {
  if (!online.enabled) return;
  const self = state.profiles.find((profile) => profile.relation === "Self") || state.profiles[0];
  if (self?.remoteId) {
    await syncLeagueOnline();
  } else {
    setOnlineState("Create your online username to sync with friends.", false, false);
  }
}

$$(".activity").forEach((button) => {
  button.addEventListener("click", () => {
    timer.activity = button.dataset.activity;
    setActiveButton($$(".activity"), button);
    if (!timer.running) $("#timer-title").textContent = "Ready";
  });
});

$("#mobileMenuButton")?.addEventListener("click", openMobileSidebar);
$("#closeMobileMenu")?.addEventListener("click", closeMobileSidebar);
$("#mobileSidebarScrim")?.addEventListener("click", closeMobileSidebar);
$$("[data-section-target]").forEach((button) => {
  button.addEventListener("click", () => showDashboardSection(button.dataset.sectionTarget));
});
$("#topNotificationButton").addEventListener("click", () => showDashboardSection("notifications"));

$("#notificationFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-notification-filter]");
  if (!button) return;
  state.notificationFilter = button.dataset.notificationFilter;
  saveState();
  renderNotifications();
});

$("#notificationList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-read-notification]");
  if (!button) return;
  const note = state.notifications.find((entry) => entry.id === button.dataset.readNotification);
  if (!note) return;
  note.read = true;
  saveState();
  renderNotifications();
});

$("#markNotificationsRead").addEventListener("click", () => {
  state.notifications.forEach((note) => {
    note.read = true;
  });
  saveState();
  renderNotifications();
});

$("#clearNotifications").addEventListener("click", () => {
  if (!state.notifications.length) return;
  state.notifications = [];
  saveState();
  renderNotifications();
});

$$(".mode-choice").forEach((button) => {
  button.addEventListener("click", () => {
    timer.mode = button.dataset.mode;
    timer.duration = Math.max(1, Number($("#durationInput").value) || 20) * 60 * SECOND;
    setActiveButton($$(".mode-choice"), button);
    resetTimer();
    render();
  });
});

$$(".preset-button").forEach((button) => {
  button.addEventListener("click", () => {
    timer.mode = "timer";
    timer.duration = Number(button.dataset.preset) * 60 * SECOND;
    timer.presetLabel = button.dataset.label || button.textContent;
    $("#durationInput").value = button.dataset.preset;
    setActiveButton($$(".mode-choice"), $$(".mode-choice").find((entry) => entry.dataset.mode === "timer"));
    resetTimer();
    render();
  });
});

$("#durationInput").addEventListener("input", () => {
  timer.duration = Math.max(1, Number($("#durationInput").value) || 20) * 60 * SECOND;
  timer.presetLabel = "";
  if (!timer.running) tick();
});

$("#startPauseButton").addEventListener("click", startTimer);
$("#finishButton").addEventListener("click", finishSession);
$("#resetButton").addEventListener("click", resetTimer);
$("#newSessionTop").addEventListener("click", () => document.querySelector(".timer-panel").scrollIntoView({ behavior: "smooth", block: "center" }));

$("#profileSelect").addEventListener("change", () => {
  state.activeProfileId = $("#profileSelect").value;
  saveState();
  render();
});

$("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#profileName").value.trim();
  if (!name) return;
  const exists = state.profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showProfileMessage("That Pulse League username already exists.");
    return;
  }
  try {
    const profile = await claimOnlineProfile(name);
    if (profile) $("#profileName").value = "";
  } catch {
    showProfileMessage("Online profiles are not set up yet. Run the Pulse League Supabase setup first.");
    setOnlineState("Online setup needed. Run supabase/pulse-league-online.sql.", false, false);
  }
});

$("#addExistingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = $("#existingProfileName").value.trim();
  if (!query) return;
  try {
    await addFriendOnline(query, $("#profileRelation").value);
    $("#existingProfileName").value = "";
  } catch {
    showProfileMessage("No Pulse League profile found for that username.");
    setOnlineState("Online lookup unavailable.", false, false);
  }
});

$("#renameForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#displayName").value.trim();
  if (!name) return;
  try {
    await claimOnlineProfile(name);
  } catch {
    activeProfile().name = name;
    saveState();
    renderProfiles();
    renderCosmetics();
    showProfileMessage("Renamed on this device. Online setup is not ready yet.");
  }
});

$("#cosmeticGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cosmetic]");
  if (!button || button.disabled) return;
  const profile = activeProfile();
  const prize = cosmeticRules.find((entry) => entry.id === button.dataset.cosmetic);
  if (!prize) return;
  if (prize.type === "profile") profile.cosmetic = prize.id;
  if (prize.type === "background") state.equippedBackground = prize.id;
  if (prize.type === "effect") state.equippedEffect = prize.id;
  if (prize.type === "title") state.equippedTitle = prize.title;
  saveState();
  renderProfiles();
  renderCosmetics();
  if (profile.remoteId) {
    supabaseRpc("pulse_league_update_profile", {
      p_profile_id: profile.remoteId,
      p_owner_token: state.ownerToken,
      p_display_name: profile.name,
      p_cosmetic: profile.cosmetic
    }).catch(() => {});
  }
});

$("#prizeShopGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-buy-prize]");
  if (!button || button.disabled) return;
  const prize = cosmeticRules.find((entry) => entry.id === button.dataset.buyPrize);
  if (!prize || state.ownedPrizes.includes(prize.id) || state.coins < prize.cost) return;
  state.coins -= prize.cost;
  if (prize.type === "booster") {
    state.activeBoostUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    notify(`${prize.name} activated for one hour.`, "shop", "Booster activated");
  } else {
    state.ownedPrizes.push(prize.id);
    notify(`${prize.name} unlocked in the prize shop.`, "shop", "Prize unlocked");
  }
  saveState();
  render();
});

$("#challengeGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-claim-challenge]");
  if (!button || button.disabled) return;
  const challenge = challengeRules.find((entry) => entry.id === button.dataset.claimChallenge);
  if (!challenge || state.claimedChallenges.includes(challenge.id) || !challenge.test(statsFor())) return;
  state.claimedChallenges.push(challenge.id);
  state.coins += challenge.reward;
  notify(`${challenge.name} paid ${challenge.reward} coins.`, "challenge", "Challenge claimed");
  saveState();
  render();
});

$("#requestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = normalizeUsername($("#requestUsername").value);
  if (!username || state.blockedUsers.includes(username)) return;
  state.friendRequests.unshift({ id: crypto.randomUUID(), username, relation: "Friend", status: "pending", createdAt: new Date().toISOString() });
  notify(`Friend request prepared for @${username}.`, "request", "Friend request");
  $("#requestUsername").value = "";
  saveState();
  render();
});

$("#friendRequestList").addEventListener("click", (event) => {
  const acceptId = event.target.dataset.acceptRequest;
  const declineId = event.target.dataset.declineRequest;
  const request = state.friendRequests.find((entry) => entry.id === (acceptId || declineId));
  if (!request) return;
  request.status = acceptId ? "accepted" : "declined";
  if (acceptId) {
    state.profiles.push({
      id: crypto.randomUUID(),
      name: request.username,
      username: request.username,
      relation: request.relation,
      setupCode: `@${request.username}`,
      cosmetic: "rookie-pass",
      inLeague: true,
      owned: false
    });
  }
  notify(`Request from @${request.username} ${request.status}.`, "request", "Request updated");
  saveState();
  render();
});

$("#copyRecovery").addEventListener("click", async () => {
  const payload = JSON.stringify({ recoveryCode: state.recoveryCode, ownerToken: state.ownerToken, exportedAt: new Date().toISOString() }, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    notify("Recovery code copied.", "recovery", "Recovery");
  } catch {
    notify("Recovery code ready to copy manually.", "recovery", "Recovery");
  }
  render();
});

$("#recoveryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const code = $("#recoveryInput").value.trim();
  if (!code) return;
  if (code !== state.recoveryCode) {
    notify("Recovery code did not match this profile.", "recovery", "Recovery failed");
    render();
    return;
  }
  state.recoveryBackups.unshift({ id: crypto.randomUUID(), label: "Recovery verified", createdAt: new Date().toISOString() });
  $("#recoveryInput").value = "";
  notify("Recovery code verified.", "recovery", "Recovery verified");
  saveState();
  render();
});

$("#leaderboard").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-profile]");
  if (!button) return;
  const profileId = button.dataset.removeProfile;
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (!profile || profile.relation === "Self") return;
  if (!confirm(`Remove ${profile.name} from your Pulse League board?`)) return;
  try {
    await removeConnectionOnline(profile);
  } catch {}
  state.profiles = state.profiles.filter((entry) => entry.id !== profileId);
  state.sessions = state.sessions.filter((session) => session.profileId !== profileId);
  if (state.activeProfileId === profileId) {
    state.activeProfileId = state.profiles[0]?.id || "you";
  }
  saveState();
  render();
});

$("#dailyGoal").addEventListener("change", () => {
  state.goals.daily = Math.max(5, Number($("#dailyGoal").value) || 30);
  saveState();
  renderGoals();
});

$("#weeklyGoal").addEventListener("change", () => {
  state.goals.weekly = Math.max(5, Number($("#weeklyGoal").value) || 150);
  saveState();
  renderGoals();
});

$("#leagueForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.group.name = $("#groupName").value.trim() || "Family League";
  state.teamName = $("#teamName").value.trim() || "Pulse Team";
  notify(`${state.group.name} league saved.`, "system", "League saved");
  saveState();
  render();
});

$("#coachForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.coachChallenge = $("#coachChallenge").value.trim();
  notify(state.coachChallenge ? "Coach challenge posted." : "Coach challenge cleared.", "challenge", "Coach mode");
  saveState();
  render();
});

$("#proofRequired").addEventListener("change", () => {
  state.proofRequired = $("#proofRequired").checked;
  saveState();
  renderUpgradePanels();
});

$("#useFreezeToken").addEventListener("click", () => {
  if (state.freezeTokens <= 0) return;
  state.freezeTokens -= 1;
  notify("Streak freeze used for today.", "safety", "Streak freeze");
  saveState();
  render();
});

$("#blockForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = normalizeUsername($("#blockedUsername").value);
  if (!username || state.blockedUsers.includes(username)) return;
  state.blockedUsers.push(username);
  $("#blockedUsername").value = "";
  notify(`@${username} blocked.`, "safety", "User blocked");
  saveState();
  render();
});

$("#themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "court" : "dark";
  saveState();
  render();
});

$("#themeSelect").addEventListener("change", () => {
  state.theme = $("#themeSelect").value;
  saveState();
  render();
});

$("#soundToggle").addEventListener("change", () => {
  state.sound = $("#soundToggle").checked;
  saveState();
});

$("#vibrationToggle").addEventListener("change", () => {
  state.vibration = $("#vibrationToggle").checked;
  saveState();
});

$("#clearHistory").addEventListener("click", () => {
  if (!profileSessions().length || !confirm("Clear this profile's workout history?")) return;
  state.sessions = state.sessions.filter((session) => session.profileId !== state.activeProfileId);
  saveState();
  render();
});

$("#customForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const activity = $("#customActivity").value.trim() || "Other";
  const minutes = Math.max(1, Math.round(Number($("#manualMinutes").value) || 1));
  const note = $("#manualNote").value.trim();
  if (await logSession(activity, minutes, note)) {
    $("#customActivity").value = "";
    $("#manualNote").value = "";
  }
});

$("#historyList").addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openEdit(editId);
  if (deleteId && confirm("Delete this workout?")) {
    const session = state.sessions.find((entry) => entry.id === deleteId);
    try {
      if (session) await deleteSessionOnline(session);
    } catch {}
    state.sessions = state.sessions.filter((session) => session.id !== deleteId);
    saveState();
    render();
  }
});

function openEdit(id) {
  const session = state.sessions.find((entry) => entry.id === id);
  if (!session) return;
  $("#editId").value = session.id;
  $("#editActivity").value = session.activity;
  $("#editMinutes").value = session.minutes;
  $("#editNote").value = session.note || "";
  $("#editDialog").showModal();
}

$("#cancelEdit").addEventListener("click", () => $("#editDialog").close());
$("#editForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = state.sessions.find((entry) => entry.id === $("#editId").value);
  if (!session) return;
  const minutes = Math.max(MIN_WORKOUT_MINUTES, Math.round(Number($("#editMinutes").value) || MIN_WORKOUT_MINUTES));
  session.activity = $("#editActivity").value.trim() || "Other";
  session.minutes = minutes;
  session.points = minutes * 10;
  session.note = $("#editNote").value.trim();
  try {
    await updateSessionOnline(session);
  } catch {}
  saveState();
  $("#editDialog").close();
  render();
});

$("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    $("#exportButton").textContent = "Copied";
  } catch {
    $("#exportButton").textContent = "Ready";
  }
  setTimeout(() => {
    $("#exportButton").textContent = "Export";
  }, 1200);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();
activateDashboardSection(state.lastSection || "progress", false);
initOnline();
