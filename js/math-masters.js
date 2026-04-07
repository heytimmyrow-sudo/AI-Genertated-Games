(function () {
  const STORAGE_KEY = "math-masters-progress-v1";
  const SKILLS = [
    { id: "add-sub", name: "Addition + Subtraction", generate: () => additiveQuestion(20) },
    { id: "multiply", name: "Multiplication Facts", generate: () => multiplyQuestion(12) },
    { id: "divide", name: "Division Sense", generate: () => divisionQuestion(12) },
    { id: "mixed", name: "Mental Math Mix", generate: mixedQuestion }
  ];

  const el = {
    skillName: document.getElementById("skillName"),
    promptText: document.getElementById("promptText"),
    answerForm: document.getElementById("answerForm"),
    answerInput: document.getElementById("answerInput"),
    submitButton: document.getElementById("submitButton"),
    startButton: document.getElementById("startButton"),
    skipButton: document.getElementById("skipButton"),
    feedbackText: document.getElementById("feedbackText"),
    streakValue: document.getElementById("streakValue"),
    scoreValue: document.getElementById("scoreValue"),
    accuracyValue: document.getElementById("accuracyValue"),
    levelValue: document.getElementById("levelValue"),
    xpFill: document.getElementById("xpFill"),
    xpText: document.getElementById("xpText"),
    questText: document.getElementById("questText"),
    skillList: document.getElementById("skillList")
  };

  if (!el.answerForm) return;

  const inputState = { keys: Object.create(null), previous: Object.create(null) };

  window.addEventListener("keydown", (event) => {
    inputState.keys[event.key.toLowerCase()] = true;
    if (event.key === "Escape") event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    inputState.keys[event.key.toLowerCase()] = false;
  });

  let state = createState();
  render();

  el.startButton.addEventListener("click", startSession);
  el.skipButton.addEventListener("click", skipQuestion);

  el.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.activeRound || !state.currentQuestion) return;

    const raw = el.answerInput.value.trim();
    if (raw.length === 0 || Number.isNaN(Number(raw))) {
      setFeedback("Type a number first.", false);
      return;
    }

    const answer = Number(raw);
    const isCorrect = answer === state.currentQuestion.answer;
    state.questionsAnswered += 1;

    if (isCorrect) {
      state.correctAnswers += 1;
      state.streak += 1;
      state.questProgress += 1;
      state.score += 30 + state.streak * 5;
      awardXp(18);
      adjustMastery(state.currentSkill.id, 10);
      setFeedback("Correct. Nice rhythm.", true);
    } else {
      state.streak = 0;
      state.questProgress = 0;
      adjustMastery(state.currentSkill.id, -4);
      setFeedback(`Not quite. Correct answer: ${state.currentQuestion.answer}.`, false);
    }

    if (state.questProgress >= state.questGoal) {
      state.score += 120;
      awardXp(24);
      state.questProgress = 0;
      state.questGoal = 4 + Math.floor(Math.random() * 4);
      setFeedback("Quest complete! Bonus mastery earned.", true);
    }

    nextQuestion();
    saveProgress();
    render();
  });

  function createState() {
    const fromStorage = loadProgress();
    return {
      activeRound: false,
      streak: 0,
      score: 0,
      xp: fromStorage?.xp || 0,
      level: fromStorage?.level || 1,
      questProgress: 0,
      questGoal: 5,
      questionsAnswered: 0,
      correctAnswers: 0,
      skillMastery: fromStorage?.skillMastery || { "add-sub": 0, multiply: 0, divide: 0, mixed: 0 },
      currentSkill: SKILLS[3],
      currentQuestion: null
    };
  }

  function startSession() {
    state.activeRound = true;
    state.streak = 0;
    state.score = 0;
    state.questionsAnswered = 0;
    state.correctAnswers = 0;
    state.questProgress = 0;
    state.questGoal = 5;
    chooseSkill();
    nextQuestion();
    setFeedback("Session started. Stay accurate.", true);
    render();
    el.answerInput.focus();
  }

  function skipQuestion() {
    if (!state.activeRound) return;
    state.streak = 0;
    state.questProgress = 0;
    state.score = Math.max(0, state.score - 10);
    adjustMastery(state.currentSkill.id, -2);
    setFeedback("Skipped. No stress—next one.", false);
    nextQuestion();
    saveProgress();
    render();
  }

  function chooseSkill() {
    const ranked = [...SKILLS].sort((a, b) => getMastery(a.id) - getMastery(b.id));
    const useWeakest = Math.random() < 0.7;
    state.currentSkill = useWeakest ? ranked[0] : ranked[Math.floor(Math.random() * ranked.length)];
  }

  function nextQuestion() {
    chooseSkill();
    state.currentQuestion = state.currentSkill.generate();
    el.answerInput.value = "";
  }

  function awardXp(amount) {
    state.xp += amount;
    while (state.xp >= 100) {
      state.xp -= 100;
      state.level += 1;
    }
  }

  function adjustMastery(skillId, delta) {
    state.skillMastery[skillId] = clamp(getMastery(skillId) + delta, 0, 100);
  }

  function getMastery(skillId) {
    return state.skillMastery[skillId] || 0;
  }

  function setFeedback(message, positive) {
    el.feedbackText.textContent = message;
    el.feedbackText.style.color = positive ? "#7de3ff" : "#ff9f7d";
  }

  function render() {
    const accuracy = state.questionsAnswered === 0
      ? 100
      : Math.round((state.correctAnswers / state.questionsAnswered) * 100);

    el.skillName.textContent = state.currentSkill.name;
    el.promptText.textContent = state.currentQuestion
      ? `${state.currentQuestion.prompt} = ?`
      : "Press Start to begin.";
    el.streakValue.textContent = String(state.streak);
    el.scoreValue.textContent = String(state.score);
    el.accuracyValue.textContent = `${accuracy}%`;
    el.levelValue.textContent = String(state.level);
    el.xpFill.style.width = `${state.xp}%`;
    el.xpText.textContent = `${state.xp} / 100 mastery XP`;
    el.questText.textContent = `Answer ${state.questGoal} in a row correctly (${state.questProgress}/${state.questGoal}).`;

    el.answerInput.disabled = !state.activeRound;
    el.submitButton.disabled = !state.activeRound;
    el.skipButton.disabled = !state.activeRound;

    renderSkillList();
  }

  function renderSkillList() {
    el.skillList.innerHTML = "";
    for (const skill of SKILLS) {
      const item = document.createElement("article");
      item.className = "skill-item";
      const xp = getMastery(skill.id);
      item.innerHTML = `
        <div class="skill-item__top">
          <strong>${skill.name}</strong>
          <span>${xp}%</span>
        </div>
        <div class="xp-track"><div style="width:${xp}%;height:100%;background:linear-gradient(90deg,#7de3ff,#52d273)"></div></div>
      `;
      el.skillList.appendChild(item);
    }
  }

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        xp: state.xp,
        level: state.level,
        skillMastery: state.skillMastery
      }));
    } catch {
      // ignore storage failures in private mode
    }
  }

  function additiveQuestion(max) {
    const a = randomInt(2, max);
    const b = randomInt(2, max);
    if (Math.random() < 0.5) return { prompt: `${a} + ${b}`, answer: a + b };
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return { prompt: `${high} - ${low}`, answer: high - low };
  }

  function multiplyQuestion(max) {
    const a = randomInt(2, max);
    const b = randomInt(2, max);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }

  function divisionQuestion(max) {
    const divisor = randomInt(2, max);
    const result = randomInt(2, max);
    const dividend = divisor * result;
    return { prompt: `${dividend} ÷ ${divisor}`, answer: result };
  }

  function mixedQuestion() {
    const roll = Math.random();
    if (roll < 0.34) return additiveQuestion(35);
    if (roll < 0.67) return multiplyQuestion(15);
    return divisionQuestion(12);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  function tick() {
    if (inputState.keys.escape && !inputState.previous.escape) {
      returnToMenu();
    }
    inputState.previous = { ...inputState.keys };
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
