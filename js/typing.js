(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const ROUND_TIME = 45;
  const WORD_BANK = [
    "anchor", "apple", "beacon", "bridge", "bright", "candle", "castle", "cobalt",
    "compass", "coral", "course", "craft", "crystal", "daring", "drift", "ember",
    "engine", "feather", "fishing", "flower", "forest", "garden", "glimmer", "glow",
    "granite", "harbor", "horizon", "island", "jungle", "keeper", "kingdom", "lantern",
    "marble", "meadow", "meteor", "mossy", "ocean", "orchard", "paddle", "parade",
    "pearl", "player", "prairie", "quartz", "racing", "rescue", "river", "rocket",
    "sailor", "shadow", "signal", "silver", "spirit", "spring", "steady", "stone",
    "storm", "summit", "temple", "thunder", "timber", "travel", "typing", "valley",
    "velvet", "village", "violet", "voyage", "wander", "whisper", "window", "zephyr"
  ];

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  class InputHandler {
    constructor() {
      this.keys = Object.create(null);
      this.previous = Object.create(null);
      this.typed = [];

      window.addEventListener("keydown", (event) => {
        const key = event.key;
        const lower = key.toLowerCase();
        this.keys[lower] = true;
        if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.typed.push(key);
        }
        if (["enter", "escape", "tab", "backspace", " "].includes(lower)) {
          event.preventDefault();
        }
      });

      window.addEventListener("keyup", (event) => {
        this.keys[event.key.toLowerCase()] = false;
      });

      window.addEventListener("blur", () => {
        this.keys = Object.create(null);
        this.previous = Object.create(null);
        this.typed = [];
      });
    }

    wasPressed(...keys) {
      return keys.some((key) => this.keys[key] && !this.previous[key]);
    }

    consumeTyped() {
      const typed = this.typed.join("");
      this.typed = [];
      return typed;
    }

    endFrame() {
      this.previous = { ...this.keys };
    }
  }

  function pickWord(previousWord) {
    let word = previousWord;
    while (word === previousWord) {
      word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    }
    return word;
  }

  function createState() {
    return {
      screen: "title",
      target: pickWord(""),
      typed: "",
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctChars: 0,
      totalChars: 0,
      timeLeft: ROUND_TIME,
      flashTimer: 0,
      message: "Type the highlighted word exactly.",
      particles: []
    };
  }

  const input = new InputHandler();
  let state = createState();
  let lastTime = 0;

  function resetRun() {
    state = createState();
    state.screen = "playing";
  }

  function spawnBurst(color) {
    for (let i = 0; i < 14; i += 1) {
      state.particles.push({
        x: WIDTH * 0.5,
        y: HEIGHT * 0.52,
        vx: -120 + Math.random() * 240,
        vy: -120 + Math.random() * 240,
        life: 0.25 + Math.random() * 0.45,
        maxLife: 1,
        size: 3 + Math.random() * 5,
        color
      });
      state.particles[state.particles.length - 1].maxLife = state.particles[state.particles.length - 1].life;
    }
  }

  function commitWord(success) {
    if (success) {
      state.score += 100 + state.streak * 10;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.flashTimer = 0.18;
      state.message = "Clean word. Keep the rhythm.";
      spawnBurst("#7de3ff");
    } else {
      state.streak = 0;
      state.message = "Reset and type the whole word cleanly.";
      spawnBurst("#ff9f7d");
    }

    state.target = pickWord(state.target);
    state.typed = "";
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function updateTyping() {
    const typed = input.consumeTyped();
    if (typed) {
      for (const char of typed) {
        if (char === " ") {
          commitWord(state.typed === state.target);
          continue;
        }
        state.typed += char.toLowerCase();
        state.totalChars += 1;
        const index = state.typed.length - 1;
        if (state.target[index] === char.toLowerCase()) {
          state.correctChars += 1;
        }
        if (state.typed === state.target) {
          commitWord(state.typed === state.target);
        }
      }
    }

    if (input.wasPressed("backspace")) {
      state.typed = state.typed.slice(0, -1);
    }
  }

  function update(dt) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
    updateParticles(dt);

    if (input.wasPressed("escape")) {
      returnToMenu();
      return;
    }

    if (input.wasPressed("tab")) {
      if (state.screen === "playing") state.screen = "paused";
      else if (state.screen === "paused") state.screen = "playing";
    }

    if (state.screen === "title") {
      if (input.wasPressed("enter")) resetRun();
      return;
    }

    if (state.screen === "paused") {
      return;
    }

    if (state.screen === "gameover") {
      if (input.wasPressed("enter")) resetRun();
      return;
    }

    state.timeLeft = Math.max(0, state.timeLeft - dt);
    updateTyping();

    if (state.timeLeft <= 0) {
      state.screen = "gameover";
      state.message = "Round over. Press R to try again.";
    }
  }

  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, "#10263d");
    bg.addColorStop(1, "#07121f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(125, 227, 255, 0.08)";
    for (let x = 0; x < WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
  }

  function drawWordPanel() {
    ctx.fillStyle = "rgba(7, 15, 24, 0.82)";
    ctx.fillRect(120, 150, 660, 230);
    ctx.strokeStyle = "rgba(125, 227, 255, 0.2)";
    ctx.strokeRect(120, 150, 660, 230);

    ctx.fillStyle = "#dff8ff";
    ctx.font = "bold 18px Trebuchet MS";
    ctx.fillText("Target Word", 146, 186);

    ctx.font = "bold 54px Trebuchet MS";
    ctx.fillStyle = "#ecfaff";
    ctx.fillText(state.target, 146, 255);

    const typedGood = state.target.slice(0, state.typed.length) === state.typed;
    ctx.font = "30px Trebuchet MS";
    ctx.fillStyle = typedGood ? "#7de3ff" : "#ff9f7d";
    ctx.fillText(state.typed || "_", 146, 320);
  }

  function drawHud() {
    const accuracy = state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100;
    const elapsed = Math.max(1, ROUND_TIME - state.timeLeft);
    const wordsPerMinute = Math.round((state.correctChars / 5) * (60 / elapsed));

    ctx.fillStyle = "rgba(7, 15, 24, 0.82)";
    ctx.fillRect(20, 20, 420, 112);
    ctx.strokeStyle = "rgba(125, 227, 255, 0.2)";
    ctx.strokeRect(20, 20, 420, 112);
    ctx.fillStyle = "#ecfaff";
    ctx.font = "bold 22px Trebuchet MS";
    ctx.fillText("Typing Tempo", 34, 48);
    ctx.font = "15px Verdana";
    ctx.fillStyle = "#94afc0";
    ctx.fillText("Score " + state.score, 34, 76);
    ctx.fillText("Streak " + state.streak, 130, 76);
    ctx.fillText("Best " + state.bestStreak, 238, 76);
    ctx.fillText("Accuracy " + accuracy + "%", 320, 76);
    ctx.fillStyle = "#ffd66b";
    ctx.fillText("Time " + state.timeLeft.toFixed(1) + "s", 34, 104);
    ctx.fillStyle = "#7de3ff";
    ctx.fillText("Tempo " + wordsPerMinute + " WPM", 146, 104);

    ctx.fillStyle = "rgba(7, 15, 24, 0.82)";
    ctx.fillRect(120, 410, 660, 44);
    ctx.strokeStyle = "rgba(125, 227, 255, 0.18)";
    ctx.strokeRect(120, 410, 660, 44);
    ctx.fillStyle = "#dff8ff";
    ctx.fillText(state.message, 142, 438);
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    if (state.screen === "playing") return;

    ctx.fillStyle = "rgba(3, 8, 14, 0.72)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ecfaff";
    ctx.font = "bold 42px Trebuchet MS";

    if (state.screen === "title") {
      ctx.fillText("Typing Tempo", WIDTH / 2, HEIGHT / 2 - 36);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#94afc0";
      ctx.fillText("Press Enter to start. Type each word cleanly and hit Space to submit early if needed.", WIDTH / 2, HEIGHT / 2 + 6);
    } else if (state.screen === "paused") {
      ctx.fillText("Paused", WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#94afc0";
      ctx.fillText("Press Tab to return to the drill.", WIDTH / 2, HEIGHT / 2 + 18);
    } else if (state.screen === "gameover") {
      ctx.fillText("Round Complete", WIDTH / 2, HEIGHT / 2 - 24);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#94afc0";
      ctx.fillText("Press Enter to restart or Esc for the menu.", WIDTH / 2, HEIGHT / 2 + 18);
    }
    ctx.textAlign = "start";
  }

  function render() {
    drawBackground();
    drawWordPanel();
    drawHud();
    drawParticles();
    if (state.flashTimer > 0) {
      ctx.fillStyle = "rgba(125, 227, 255, " + (state.flashTimer * 0.35) + ")";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    drawOverlay();
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
}());
