const STORAGE_KEY = "pulseLeagueState";
const SECOND = 1000;
const MIN_WORKOUT_MINUTES = 5;
const SHORT_WORKOUT_MESSAGE = "Workout too short to be recorded.";
const levelNames = ["Rookie", "Pacer", "Strider", "Climber", "Contender", "Champion", "Legend"];
const activityOptions = ["Volleyball", "Running", "Bike Riding", "Swimming", "Strength", "Other"];
const cosmeticRules = [
  { id: "classic", name: "Classic Court", unlockLevel: 1, accent: "PL" },
  { id: "bronze", name: "Bronze Frame", unlockLevel: 2, accent: "BR" },
  { id: "wave", name: "Wave Glow", unlockLevel: 3, accent: "WG" },
  { id: "captain", name: "Captain Band", unlockLevel: 4, accent: "CP" },
  { id: "gold", name: "Gold League", unlockLevel: 5, accent: "GL" },
  { id: "neon", name: "Neon Serve", unlockLevel: 7, accent: "NS" }
];
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
    profiles: [{ id: "you", name: "You", relation: "Self", setupCode: "PL-YOU", cosmetic: "classic" }],
    activeProfileId: "you",
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
    merged.profiles = parsed.profiles?.length ? parsed.profiles.map((profile, index) => ({
      relation: index === 0 ? "Self" : "Friend",
      setupCode: makeSetupCode(profile.name || `Player ${index + 1}`),
      cosmetic: "classic",
      ...profile
    })) : fallback.profiles;
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

function makeSetupCode(name) {
  const seed = String(name || "Player").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "PL";
  return `PL-${seed}-${Math.floor(100 + Math.random() * 900)}`;
}

function activeProfile() {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0];
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

function finishSession() {
  const elapsed = timer.mode === "timer" ? Math.min(getElapsed(), timer.duration) : getElapsed();
  if (elapsed < MIN_WORKOUT_MINUTES * 60 * SECOND) {
    showSessionMessage(SHORT_WORKOUT_MESSAGE);
    resetTimer();
    return;
  }

  const minutes = Math.max(MIN_WORKOUT_MINUTES, Math.round(elapsed / 60000));
  const note = $("#timerNote").value.trim();
  if (logSession(timer.activity, minutes, note)) {
    $("#timerNote").value = "";
  }
  resetTimer();
}

function showSessionMessage(message) {
  $("#sessionMessage").textContent = message;
}

function logSession(activity, minutes, note = "") {
  if (minutes < MIN_WORKOUT_MINUTES) {
    showSessionMessage(SHORT_WORKOUT_MESSAGE);
    return false;
  }

  state.sessions.unshift({
    id: crypto.randomUUID(),
    profileId: state.activeProfileId,
    activity: activity || "Other",
    minutes,
    note,
    points: minutes * 10,
    createdAt: new Date().toISOString()
  });
  state.sessions = state.sessions.slice(0, 240);
  saveState();
  render();
  showSessionMessage("");
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
  $("#profileSelect").innerHTML = state.profiles.map((profile) => (
    `<option value="${profile.id}" ${profile.id === state.activeProfileId ? "selected" : ""}>${escapeHtml(profile.name)}</option>`
  )).join("");

  const leaders = state.profiles.map((profile) => ({ ...profile, stats: statsFor(profile.id) }))
    .sort((a, b) => b.stats.weeklyPoints - a.stats.weeklyPoints);
  $("#leaderboard").innerHTML = leaders.map((profile, index) => `
    <li class="leader-row cosmetic-${escapeHtml(profile.cosmetic || "classic")}">
      <span class="rank">${index + 1}</span>
      <div class="leader-meta">
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(profile.relation || "Friend")} profile · ${escapeHtml(profile.setupCode || "Set up")}${profile.id === state.activeProfileId ? " · Active" : ""}</span>
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
  const selected = profile.cosmetic || "classic";
  const cosmetic = cosmeticRules.find((entry) => entry.id === selected) || cosmeticRules[0];
  $("#cosmeticLevel").textContent = `Level ${stats.level}`;
  $("#profileCard").className = `profile-card cosmetic-${cosmetic.id}`;
  $("#profileCard").innerHTML = `
    <div class="avatar-badge">${escapeHtml(cosmetic.accent)}</div>
    <div>
      <strong>${escapeHtml(profile.name)}</strong>
      <span>${escapeHtml(profile.relation || "Friend")} · ${escapeHtml(cosmetic.name)}</span>
    </div>
  `;
  $("#cosmeticGrid").innerHTML = cosmeticRules.map((entry) => {
    const unlocked = stats.level >= entry.unlockLevel;
    const active = selected === entry.id;
    return `
      <button class="cosmetic-card cosmetic-${entry.id} ${active ? "active" : ""}" type="button" data-cosmetic="${entry.id}" ${unlocked ? "" : "disabled"}>
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${unlocked ? (active ? "Equipped" : "Unlocked") : `Unlocks at Level ${entry.unlockLevel}`}</span>
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

function renderSettings() {
  document.body.className = "";
  document.body.classList.toggle("timer-mode", timer.mode === "timer");
  document.body.classList.add(`theme-${state.theme}`);
  if (state.theme === "dark") document.body.classList.add("dark");
  $("#themeSelect").value = state.theme;
  $("#soundToggle").checked = state.sound;
  $("#vibrationToggle").checked = state.vibration;
}

function render() {
  renderSettings();
  $("#timerModeLabel").textContent = timer.mode === "timer" ? "Timer" : "Stopwatch";
  renderProfiles();
  renderCosmetics();
  renderProgress();
  renderGoals();
  renderActivityStats();
  renderChart();
  renderCalendar();
  renderRecords();
  renderBadges();
  renderTournamentHistory();
  renderHistory();
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

$$(".activity").forEach((button) => {
  button.addEventListener("click", () => {
    timer.activity = button.dataset.activity;
    setActiveButton($$(".activity"), button);
    if (!timer.running) $("#timer-title").textContent = "Ready";
  });
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

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#profileName").value.trim();
  if (!name) return;
  const profile = {
    id: crypto.randomUUID(),
    name,
    relation: $("#profileRelation").value,
    setupCode: makeSetupCode(name),
    cosmetic: "classic"
  };
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  $("#profileName").value = "";
  saveState();
  render();
});

$("#cosmeticGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cosmetic]");
  if (!button || button.disabled) return;
  const profile = activeProfile();
  profile.cosmetic = button.dataset.cosmetic;
  saveState();
  renderProfiles();
  renderCosmetics();
});

$("#leaderboard").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-profile]");
  if (!button) return;
  const profileId = button.dataset.removeProfile;
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (!profile || profile.relation === "Self") return;
  if (!confirm(`Remove ${profile.name}'s Pulse League profile and workouts?`)) return;
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

$("#customForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const activity = $("#customActivity").value.trim() || "Other";
  const minutes = Math.max(1, Math.round(Number($("#manualMinutes").value) || 1));
  const note = $("#manualNote").value.trim();
  if (logSession(activity, minutes, note)) {
    $("#customActivity").value = "";
    $("#manualNote").value = "";
  }
});

$("#historyList").addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openEdit(editId);
  if (deleteId && confirm("Delete this workout?")) {
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
$("#editForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const session = state.sessions.find((entry) => entry.id === $("#editId").value);
  if (!session) return;
  const minutes = Math.max(MIN_WORKOUT_MINUTES, Math.round(Number($("#editMinutes").value) || MIN_WORKOUT_MINUTES));
  session.activity = $("#editActivity").value.trim() || "Other";
  session.minutes = minutes;
  session.points = minutes * 10;
  session.note = $("#editNote").value.trim();
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
