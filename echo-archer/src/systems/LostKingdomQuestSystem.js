const STORAGE_KEY = "echo-archer-lost-kingdom-v1";

const OBJECTIVES = [
  { id: "gate", title: "Secrets Beneath the Frontier", objective: "Read the King's Gate inscription", goal: 1 },
  { id: "records", title: "Incomplete Records", objective: "Recover 4 Lost Kingdom records", goal: 4 },
  { id: "mechanisms", title: "Ancient Mechanisms", objective: "Activate 3 ancient mechanisms", goal: 3 },
  { id: "trial", title: "Sun Trial", objective: "Complete the Lost Kingdom target trial", goal: 1, challengeId: "lostKingdomTargets" },
  { id: "sentinel", title: "The First Sentinel", objective: "Defeat The First Sentinel", goal: 1 },
];

const LOST_KINGDOM_LANDMARKS = new Set([
  "lost-kingdom",
  "kings-gate",
  "sun-temple",
  "forgotten-plaza",
  "watchers-tower",
  "hall-of-echoes",
  "sealed-archive",
]);

export class LostKingdomQuestSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.active = false;
    this.complete = false;
    this.objectiveIndex = 0;
    this.progress = {};
    this.records = new Set();
    this.mechanisms = new Set();
    this.landmarks = new Set();
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:lost-kingdom-quest", () => this.start());
    window.addEventListener("echo-archer:ancient-record", (event) => this.recordAncientRecord(event.detail?.id, event.detail?.name));
    window.addEventListener("echo-archer:ancient-mechanism", (event) => this.recordMechanism(event.detail?.id, event.detail?.name));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:region-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:challenge-complete", (event) => this.recordChallenge(event.detail?.id));
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type === "firstSentinel") this.advanceSpecific("sentinel", 1);
    });
  }

  update() {
    if (this.active || this.complete) {
      this.updateTracker();
    }
  }

  start() {
    if (this.complete) {
      this.showToast("The Lost Kingdom records remain incomplete. The erased history points farther beyond the frontier.");
      return;
    }
    if (!this.active) {
      this.active = true;
      this.showToast("Main Quest started: Secrets Beneath the Frontier");
    }
    this.advanceSpecific("gate", 1);
    this.save();
    this.updateTracker();
  }

  recordAncientRecord(id, name) {
    if (!this.active || this.complete || !id || this.records.has(id)) return;
    this.records.add(id);
    this.progress.records = Math.min(OBJECTIVES[1].goal, this.records.size);
    this.showToast(`${name ?? "Record"} recovered (${this.progress.records}/4)`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: "lost-kingdom-record",
        title: "Lost Kingdom Record",
        xp: 45,
        upgradePoints: 0,
        message: "Ancient record recovered",
        gold: 12,
        reputation: 12,
        villageReputation: 8,
      },
    }));
    if (this.currentObjective()?.id === "records" && this.progress.records >= OBJECTIVES[1].goal) {
      this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  recordMechanism(id, name) {
    if (!this.active || this.complete || !id || this.mechanisms.has(id)) return;
    this.mechanisms.add(id);
    this.progress.mechanisms = Math.min(OBJECTIVES[2].goal, this.mechanisms.size);
    this.showToast(`${name ?? "Mechanism"} activated (${this.progress.mechanisms}/3)`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: "lost-kingdom-mechanism",
        title: "Ancient Mechanism",
        xp: 55,
        upgradePoints: 0,
        message: "Ancient mechanism restored",
        gold: 14,
        reputation: 14,
        villageReputation: 8,
      },
    }));
    if (this.currentObjective()?.id === "mechanisms" && this.progress.mechanisms >= OBJECTIVES[2].goal) {
      this.completeCurrentObjective();
      window.dispatchEvent(new CustomEvent("echo-archer:first-sentinel-ready", {
        detail: { title: "The First Sentinel", message: "The Sealed Archive answers with a low stone heartbeat." },
      }));
    }
    this.save();
    this.updateTracker();
  }

  recordLandmark(id) {
    if (!this.active || this.complete || !LOST_KINGDOM_LANDMARKS.has(id) || this.landmarks.has(id)) return;
    this.landmarks.add(id);
    this.save();
  }

  recordChallenge(id) {
    if (id === "lostKingdomTargets") {
      this.advanceSpecific("trial", 1);
    }
  }

  advanceSpecific(id, amount) {
    if (!this.active || this.complete) return;
    const objective = OBJECTIVES.find((item) => item.id === id);
    if (!objective) return;
    this.progress[id] = Math.min(objective.goal, (this.progress[id] ?? 0) + amount);
    if (this.currentObjective()?.id === id && this.progress[id] >= objective.goal) {
      this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  completeCurrentObjective() {
    const objective = this.currentObjective();
    if (!objective) return;
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: `lost-kingdom-${objective.id}`,
        title: objective.title,
        xp: objective.id === "sentinel" ? 300 : 145,
        upgradePoints: objective.id === "sentinel" ? 1 : 0,
        message: `${objective.title} complete`,
        gold: objective.id === "sentinel" ? 160 : 70,
        reputation: objective.id === "sentinel" ? 180 : 80,
        villageReputation: objective.id === "sentinel" ? 95 : 42,
      },
    }));
    this.objectiveIndex += 1;
    if (this.objectiveIndex >= OBJECTIVES.length) {
      this.completeQuestline();
    } else {
      this.showToast(OBJECTIVES[this.objectiveIndex].objective);
    }
  }

  completeQuestline() {
    this.active = false;
    this.complete = true;
    this.showToast("The Lost Kingdom mystery deepens. Someone erased the truth on purpose.");
    window.dispatchEvent(new CustomEvent("echo-archer:lost-kingdom-complete", {
      detail: {
        title: "Secrets Beneath the Frontier",
        message: "The Lost Kingdom did not simply fall. Missing records point beyond the frontier.",
      },
    }));
  }

  currentObjective() {
    return OBJECTIVES[this.objectiveIndex] ?? null;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.complete)) return;
    if (this.complete) {
      this.ui.title.textContent = "Lost Kingdom";
      this.ui.objective.textContent = "The erased history points beyond the frontier.";
      return;
    }
    const objective = this.currentObjective();
    this.ui.title.textContent = objective?.title ?? "Secrets Beneath the Frontier";
    this.ui.objective.textContent = `${objective?.objective ?? "Investigate the kingdom"} (${this.progress[objective?.id] ?? 0}/${objective?.goal ?? 1})`;
  }

  showToast(text) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.74 },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.active = Boolean(saved.active);
      this.complete = Boolean(saved.complete);
      this.objectiveIndex = saved.objectiveIndex ?? 0;
      this.progress = saved.progress ?? {};
      this.records = new Set(saved.records ?? []);
      this.mechanisms = new Set(saved.mechanisms ?? []);
      this.landmarks = new Set(saved.landmarks ?? []);
    } catch (error) {
      this.progress = {};
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      active: this.active,
      complete: this.complete,
      objectiveIndex: this.objectiveIndex,
      progress: this.progress,
      records: [...this.records],
      mechanisms: [...this.mechanisms],
      landmarks: [...this.landmarks],
    }));
  }
}
