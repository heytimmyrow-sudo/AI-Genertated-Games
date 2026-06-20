const { THREE } = window;

const STORAGE_KEY = "echo-archer-master-trials-v1";

const TRIALS = [
  {
    id: "precision",
    title: "Trial 1: Precision",
    objective: "Complete the moving long-range target course",
    challengeId: "masterPrecision",
    reward: { xp: 180, gold: 90, reputation: 95, villageReputation: 55 },
  },
  {
    id: "exploration",
    title: "Trial 2: Exploration",
    objective: "Chart 3 trial landmarks or major regions",
    goal: 3,
    validDiscoveries: new Set(["old-watchtower", "cliff-overlook", "red-canyon", "ashen-highlands", "starfall-vale", "starfall-observatory", "hall-of-arrows"]),
    reward: { xp: 190, gold: 95, reputation: 105, villageReputation: 60 },
  },
  {
    id: "survival",
    title: "Trial 3: Survival",
    objective: "Defeat 5 creatures during the survival circuit",
    goal: 5,
    reward: { xp: 210, gold: 110, reputation: 115, villageReputation: 70 },
  },
  {
    id: "mastery",
    title: "Trial 4: Mastery",
    objective: "Complete the weak-point target course",
    challengeId: "masterWeakpoints",
    reward: { xp: 230, gold: 120, reputation: 130, villageReputation: 75 },
  },
  {
    id: "champion",
    title: "Trial 5: Champion",
    objective: "Complete the final champion target sequence",
    challengeId: "masterChampion",
    reward: { xp: 280, gold: 160, reputation: 180, villageReputation: 120, upgradePoints: 1 },
  },
];

export class MasterArcherTrialsSystem {
  constructor(world, player, ui = {}) {
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.active = false;
    this.completed = false;
    this.trialIndex = 0;
    this.progress = {};
    this.discoveries = new Set();
    this.ceremonyTimer = 0;
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:master-trials-interact", () => this.handleHallInteraction());
    window.addEventListener("echo-archer:challenge-complete", (event) => this.handleChallengeComplete(event.detail?.id));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.handleDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:region-discovered", (event) => this.handleDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:boss-defeated", () => this.handleBossDefeated());
  }

  update(deltaSeconds) {
    this.updateMovingTargets(deltaSeconds);
    this.updateCeremony(deltaSeconds);
    if (this.active || this.completed) {
      this.updateTracker();
    }
  }

  handleHallInteraction() {
    if (this.completed) {
      this.showToast("Master Archer recognized. Frontier rumors now circulate at the guild.");
      this.showCeremony("The Hall remembers your name.", "The world remains open. Arc 2 whispers wait beyond the frontier.");
      return;
    }
    if (!this.active) {
      this.active = true;
      this.trialIndex = this.findFirstIncompleteTrial();
      ["masterPrecision", "masterWeakpoints", "masterChampion"].forEach((id) => {
        window.dispatchEvent(new CustomEvent("echo-archer:reset-challenge", { detail: { id } }));
      });
      this.showToast("The Master Archer Trials begin.");
      this.showCeremony("The Hall of Arrows opens.", "Five trials. No ending. Only proof.");
      this.save();
    } else {
      this.showToast(`${this.currentTrial()?.title}: ${this.getProgressText()}`);
    }
    this.updateTracker();
  }

  handleTargetHit(target, score) {
    const trial = this.currentTrial();
    if (!trial || this.completed || !this.active) {
      return;
    }
    if (trial.id === "precision" && target.masterTrial === "precision" && score?.bullseye) {
      this.showCombatText("PERFECT LINE");
    }
    if (trial.id === "mastery" && target.masterTrial === "mastery" && score?.bullseye) {
      this.showCombatText("WEAK POINT");
    }
  }

  handleChallengeComplete(challengeId) {
    const trial = this.currentTrial();
    if (!trial || !this.active || trial.challengeId !== challengeId) {
      return;
    }
    this.completeCurrentTrial();
  }

  handleDiscovery(id) {
    const trial = this.currentTrial();
    if (!trial || !this.active || trial.id !== "exploration" || !trial.validDiscoveries.has(id)) {
      return;
    }
    this.discoveries.add(id);
    this.progress.exploration = Math.min(trial.goal, this.discoveries.size);
    if (this.progress.exploration >= trial.goal) {
      this.completeCurrentTrial();
    } else {
      this.showToast(`Exploration proof ${this.progress.exploration}/${trial.goal}`);
      this.save();
    }
  }

  handleEnemyDefeated() {
    const trial = this.currentTrial();
    if (!trial || !this.active || trial.id !== "survival") {
      return;
    }
    this.progress.survival = Math.min(trial.goal, (this.progress.survival ?? 0) + 1);
    if (this.progress.survival >= trial.goal) {
      this.completeCurrentTrial();
    } else {
      this.showCombatText(`SURVIVAL ${this.progress.survival}/${trial.goal}`);
      this.save();
    }
  }

  handleBossDefeated() {
    const trial = this.currentTrial();
    if (!trial || !this.active || trial.id !== "mastery") {
      return;
    }
    this.showCombatText("GUARDIAN PROOF");
  }

  completeCurrentTrial() {
    const trial = this.currentTrial();
    if (!trial) {
      return;
    }
    this.progress[trial.id] = trial.goal ?? 1;
    this.showToast(`${trial.title} complete`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: `master-${trial.id}`,
        title: trial.title,
        xp: trial.reward.xp,
        upgradePoints: trial.reward.upgradePoints ?? 0,
        message: `${trial.title} complete`,
        gold: trial.reward.gold,
        reputation: trial.reward.reputation,
        villageReputation: trial.reward.villageReputation,
      },
    }));
    this.trialIndex += 1;
    if (this.trialIndex >= TRIALS.length) {
      this.completeTrials();
    } else {
      this.showCeremony(TRIALS[this.trialIndex].title, TRIALS[this.trialIndex].objective);
    }
    this.save();
    this.updateTracker();
  }

  completeTrials() {
    this.active = false;
    this.completed = true;
    this.trialIndex = TRIALS.length;
    this.showCeremony("MASTER ARCHER", "The guild recognizes your title. The adventure continues.");
    this.showToast("Master Archer title earned.");
    [
      { name: "Master Archer Regalia", rarity: "legendary", category: "outfits", itemId: "master-archer-regalia", text: "Formal Arc 1 champion outfit." },
      { name: "Arrowcrest Stag", rarity: "legendary", category: "mounts", itemId: "arrowcrest-stag", text: "A ceremonial guild mount for proven archers." },
      { name: "Hallmarked Bow", rarity: "legendary", category: "bows", itemId: "hallmarked-bow", text: "A prestige bow cosmetic with balanced Master Archer stats." },
    ].forEach((detail) => window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", { detail })));
    window.dispatchEvent(new CustomEvent("echo-archer:master-archer-complete", {
      detail: {
        title: "Master Archer",
        message: "Frontier rumors, strange maps, and advanced guild hunts are now available.",
      },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:reputation-rank", {
      detail: { id: "master-archer-trials", name: "Master Archer Trials Complete" },
    }));
  }

  currentTrial() {
    return TRIALS[this.trialIndex] ?? null;
  }

  findFirstIncompleteTrial() {
    return Math.max(0, TRIALS.findIndex((trial) => (this.progress[trial.id] ?? 0) < (trial.goal ?? 1)));
  }

  getProgressText() {
    const trial = this.currentTrial();
    if (!trial) {
      return "All trials complete";
    }
    if (trial.challengeId) {
      return trial.objective;
    }
    return `${trial.objective} (${this.progress[trial.id] ?? 0}/${trial.goal})`;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.completed)) {
      return;
    }
    if (this.completed) {
      this.ui.title.textContent = "Master Archer";
      this.ui.objective.textContent = "Arc 1 complete. The world remains open.";
      return;
    }
    const trial = this.currentTrial();
    this.ui.title.textContent = trial?.title ?? "Master Archer Trials";
    this.ui.objective.textContent = this.getProgressText();
  }

  updateMovingTargets(deltaSeconds) {
    const time = performance.now() * 0.001;
    this.world.targets.forEach((target) => {
      if (!target.motion || !target.basePosition) {
        return;
      }
      const offset = Math.sin(time * target.motion.speed + target.id * 0.47) * target.motion.amplitude;
      target.group.position.copy(target.basePosition);
      if (target.motion.axis === "x") {
        target.group.position.x += offset;
      } else if (target.motion.axis === "z") {
        target.group.position.z += offset;
      } else {
        target.group.position.y += offset;
        target.baseY = target.group.position.y;
      }
      target.group.rotation.z = Math.sin(time * target.motion.speed + target.id) * 0.04;
    });
  }

  updateCeremony(deltaSeconds) {
    if (this.ceremonyTimer <= 0) {
      return;
    }
    this.ceremonyTimer -= deltaSeconds;
    if (this.ceremonyTimer <= 0) {
      this.ui.ceremony?.classList.remove("visible");
    }
  }

  showCeremony(title, subtitle) {
    if (!this.ui.ceremony) {
      return;
    }
    this.ui.ceremony.querySelector("strong").textContent = title;
    this.ui.ceremony.querySelector("span").textContent = subtitle;
    this.ui.ceremony.classList.add("visible");
    this.ceremonyTimer = 5.4;
  }

  showCombatText(text) {
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: { text, kind: "xp", x: window.innerWidth / 2, y: window.innerHeight * 0.32 },
    }));
  }

  showToast(text) {
    if (!this.ui.toast) {
      return;
    }
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.82 },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.completed = Boolean(saved.completed);
      this.active = Boolean(saved.active && !saved.completed);
      this.trialIndex = saved.trialIndex ?? 0;
      this.progress = saved.progress ?? {};
      this.discoveries = new Set(saved.discoveries ?? []);
    } catch (error) {
      this.progress = {};
      this.discoveries = new Set();
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: this.completed,
      active: this.active,
      trialIndex: this.trialIndex,
      progress: this.progress,
      discoveries: [...this.discoveries],
    }));
  }
}
