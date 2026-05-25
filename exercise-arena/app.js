const STORAGE_KEY = "pulseLeagueState";
const SECOND = 1000;
const MIN_WORKOUT_MINUTES = 5;
const SHORT_WORKOUT_MESSAGE = "Workout too short to be recorded.";

const levelNames = ["Rookie", "Pacer", "Strider", "Climber", "Contender", "Champion", "Legend"];

const state = loadState();
const timer = {
  mode: "stopwatch",
  activity: "Running",
  running: false,
  startedAt: 0,
  elapsedBeforeStart: 0,
  duration: 20 * 60 * SECOND,
  ticker: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  const fallback = {
    sessions: [],
    dark: false
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatShortMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getElapsed() {
  if (!timer.running) {
    return timer.elapsedBeforeStart;
  }
  return timer.elapsedBeforeStart + Date.now() - timer.startedAt;
}

function getDisplayTime() {
  if (timer.mode === "timer") {
    return Math.max(0, timer.duration - getElapsed());
  }
  return getElapsed();
}

function tick() {
  $("#clockDisplay").textContent = formatClock(getDisplayTime());
  if (timer.mode === "timer" && timer.running && getElapsed() >= timer.duration) {
    finishSession();
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

  timer.running = true;
  timer.startedAt = Date.now();
  timer.ticker = setInterval(tick, 250);
  $("#startPauseButton").textContent = "Pause";
  $("#timer-title").textContent = timer.activity;
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

  const minutes = Math.max(1, Math.round(elapsed / 60000));
  logSession(timer.activity, minutes);
  resetTimer();
}

function showSessionMessage(message) {
  $("#sessionMessage").textContent = message;
}

function logSession(activity, minutes) {
  if (minutes < MIN_WORKOUT_MINUTES) {
    showSessionMessage(SHORT_WORKOUT_MESSAGE);
    return false;
  }

  state.sessions.unshift({
    id: crypto.randomUUID(),
    activity,
    minutes,
    points: minutes * 10,
    createdAt: new Date().toISOString()
  });
  state.sessions = state.sessions.slice(0, 60);
  saveState();
  render();
  showSessionMessage("");
  return true;
}

function getTotalMinutes() {
  return state.sessions.reduce((sum, session) => sum + session.minutes, 0);
}

function getTotalPoints() {
  return state.sessions.reduce((sum, session) => sum + session.points, 0);
}

function getLevelInfo() {
  const xp = getTotalPoints();
  const level = Math.floor(xp / 500) + 1;
  const progress = (xp % 500) / 500;
  return {
    xp,
    level,
    label: levelNames[Math.min(level - 1, levelNames.length - 1)],
    next: level * 500,
    progress
  };
}

function getStreakDays() {
  const days = new Set(state.sessions.map((session) => session.createdAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getFavoriteActivity() {
  const totals = state.sessions.reduce((map, session) => {
    map[session.activity] = (map[session.activity] || 0) + session.minutes;
    return map;
  }, {});
  const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return winner ? winner[0] : "None";
}

function getWeeklyPoints() {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * SECOND;
  return state.sessions
    .filter((session) => new Date(session.createdAt).getTime() >= weekAgo)
    .reduce((sum, session) => sum + session.points, 0);
}

function renderProgress() {
  const totalMinutes = getTotalMinutes();
  const level = getLevelInfo();
  const longest = state.sessions.reduce((max, session) => Math.max(max, session.minutes), 0);
  const weeklyPoints = getWeeklyPoints();

  $("#totalTimeHero").textContent = formatShortMinutes(totalMinutes);
  $("#levelHero").textContent = `Level ${level.level}`;
  $("#tournamentHero").textContent = `${weeklyPoints} pts`;
  $("#levelTitle").textContent = `Level ${level.level} ${level.label}`;
  $("#pointsChip").textContent = `${level.xp} XP`;
  $("#levelFill").style.width = `${Math.round(level.progress * 100)}%`;
  $("#levelHint").textContent = `${Math.max(0, level.next - level.xp)} XP until Level ${level.level + 1}. Every tracked minute is worth 10 XP.`;
  $("#sessionCount").textContent = state.sessions.length;
  $("#longestSession").textContent = formatShortMinutes(longest);
  $("#streakDays").textContent = `${getStreakDays()} days`;
  $("#favoriteActivity").textContent = getFavoriteActivity();
}

function renderHistory() {
  const list = $("#historyList");
  list.innerHTML = "";

  if (!state.sessions.length) {
    list.append($("#historyEmptyTemplate").content.cloneNode(true));
    return;
  }

  state.sessions.slice(0, 8).forEach((session) => {
    const item = document.createElement("li");
    item.className = "history-row";
    const date = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(session.createdAt));
    item.innerHTML = `
      <div class="history-meta">
        <strong>${escapeHtml(session.activity)}</strong>
        <span>${date} · ${session.points} XP</span>
      </div>
      <span class="history-time">${formatShortMinutes(session.minutes)}</span>
    `;
    list.append(item);
  });
}

function renderLeaderboard() {
  const list = $("#leaderboard");
  const entries = [
    { name: "You", relation: "Public profile", points: getWeeklyPoints() }
  ];

  list.innerHTML = "";
  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "leader-row";
    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <div class="leader-meta">
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${entry.relation} · Your weekly score</span>
      </div>
      <span class="leader-score">${entry.points} pts</span>
    `;
    list.append(item);
  });
}

function render() {
  document.body.classList.toggle("dark", state.dark);
  document.body.classList.toggle("timer-mode", timer.mode === "timer");
  $("#timerModeLabel").textContent = timer.mode === "timer" ? "Timer" : "Stopwatch";
  renderProgress();
  renderHistory();
  renderLeaderboard();
  tick();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
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
    if (!timer.running) {
      $("#timer-title").textContent = "Ready";
    }
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

$("#durationInput").addEventListener("input", () => {
  timer.duration = Math.max(1, Number($("#durationInput").value) || 20) * 60 * SECOND;
  if (!timer.running) {
    tick();
  }
});

$("#startPauseButton").addEventListener("click", startTimer);
$("#finishButton").addEventListener("click", finishSession);
$("#resetButton").addEventListener("click", resetTimer);
$("#newSessionTop").addEventListener("click", () => document.querySelector(".timer-panel").scrollIntoView({ behavior: "smooth", block: "center" }));

$("#themeToggle").addEventListener("click", () => {
  state.dark = !state.dark;
  saveState();
  render();
});

$("#clearHistory").addEventListener("click", () => {
  if (!state.sessions.length || !confirm("Clear all local workout history?")) {
    return;
  }
  state.sessions = [];
  saveState();
  render();
});

$("#customForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const activity = $("#customActivity").value.trim() || "Other";
  const minutes = Math.max(1, Math.round(Number($("#manualMinutes").value) || 1));
  if (logSession(activity, minutes)) {
    $("#customActivity").value = "";
  }
});

$("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), sessions: state.sessions }, null, 2);
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

render();
