const STORAGE_KEY = "echo-archer-frontier-expedition-v1";

const OBJECTIVES = [
  { id: "outpost", title: "The First Expedition", objective: "Study the Frontier Outpost map", goal: 1 },
  { id: "tracks", title: "Tracks and Trails", objective: "Study 3 old frontier tracks", goal: 3 },
  { id: "landmarks", title: "Unknown Lands", objective: "Discover 4 Frontier Plains landmarks", goal: 4 },
  { id: "range", title: "Frontier Range", objective: "Complete the Frontier Plains target course", goal: 1, challengeId: "frontierTargets" },
  { id: "ironhorn", title: "The Ironhorn", objective: "Defeat The Ironhorn", goal: 1 },
];

const FRONTIER_LANDMARKS = new Set([
  "frontier-plains",
  "frontier-outpost",
  "frontier-watch",
  "whispering-fields",
  "stone-circle-echoes",
  "broken-kings-road",
  "greenwater-crossing",
  "forgotten-camp",
]);

export class FrontierExpeditionSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.active = false;
    this.complete = false;
    this.objectiveIndex = 0;
    this.progress = {};
    this.tracks = new Set();
    this.landmarks = new Set();
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:frontier-expedition", () => this.start());
    window.addEventListener("echo-archer:frontier-track", (event) => this.recordTrack(event.detail?.id, event.detail?.name));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:region-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:challenge-complete", (event) => this.recordChallenge(event.detail?.id));
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type === "ironhorn") this.advanceSpecific("ironhorn", 1);
    });
  }

  update() {
    if (this.active || this.complete) {
      this.updateTracker();
    }
  }

  start() {
    if (this.complete) {
      this.showToast("The first frontier outpost is established. Stranger reports wait beyond the plains.");
      return;
    }
    this.active = true;
    this.advanceSpecific("outpost", 1);
    this.showToast("Main Quest started: The First Expedition");
    this.save();
    this.updateTracker();
  }

  recordTrack(id, name) {
    if (!this.active || this.complete || !id || this.tracks.has(id)) {
      return;
    }
    this.tracks.add(id);
    this.progress.tracks = Math.min(OBJECTIVES[1].goal, this.tracks.size);
    this.showToast(`${name ?? "Track"} studied (${this.progress.tracks}/3)`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: "frontier-track",
        title: "Frontier Track",
        xp: 35,
        upgradePoints: 0,
        message: "Old trail evidence recorded",
        gold: 8,
        reputation: 8,
        villageReputation: 5,
      },
    }));
    if (this.currentObjective()?.id === "tracks" && this.progress.tracks >= 3) {
      this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  recordLandmark(id) {
    if (!this.active || this.complete || !FRONTIER_LANDMARKS.has(id) || this.landmarks.has(id)) {
      return;
    }
    this.landmarks.add(id);
    this.progress.landmarks = Math.min(OBJECTIVES[2].goal, this.landmarks.size);
    if (this.currentObjective()?.id === "landmarks" && this.progress.landmarks >= 4) {
      this.completeCurrentObjective();
    }
    this.save();
  }

  recordChallenge(id) {
    if (id === "frontierTargets") {
      this.advanceSpecific("range", 1);
    }
  }

  advanceSpecific(id, amount) {
    if (!this.active || this.complete) {
      return;
    }
    const objective = OBJECTIVES.find((item) => item.id === id);
    if (!objective) {
      return;
    }
    this.progress[id] = Math.min(objective.goal, (this.progress[id] ?? 0) + amount);
    if (this.currentObjective()?.id === id && this.progress[id] >= objective.goal) {
      this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  completeCurrentObjective() {
    const objective = this.currentObjective();
    if (!objective) {
      return;
    }
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: `frontier-${objective.id}`,
        title: objective.title,
        xp: objective.id === "ironhorn" ? 220 : 120,
        upgradePoints: objective.id === "ironhorn" ? 1 : 0,
        message: `${objective.title} complete`,
        gold: objective.id === "ironhorn" ? 120 : 55,
        reputation: objective.id === "ironhorn" ? 140 : 65,
        villageReputation: objective.id === "ironhorn" ? 80 : 35,
      },
    }));
    this.objectiveIndex += 1;
    if (this.objectiveIndex >= OBJECTIVES.length) {
      this.completeExpedition();
    } else {
      this.showToast(OBJECTIVES[this.objectiveIndex].objective);
    }
  }

  completeExpedition() {
    this.active = false;
    this.complete = true;
    this.showToast("The First Expedition is established. The Arc 2 mystery deepens.");
    window.dispatchEvent(new CustomEvent("echo-archer:frontier-expedition-complete", {
      detail: {
        title: "The First Expedition",
        message: "Ancient roads, silent camps, and unknown ruins point farther into Arc 2.",
      },
    }));
  }

  currentObjective() {
    return OBJECTIVES[this.objectiveIndex] ?? null;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.complete)) {
      return;
    }
    if (this.complete) {
      this.ui.title.textContent = "Frontier Outpost";
      this.ui.objective.textContent = "Arc 2 has begun. Explore the Unknown Lands.";
      return;
    }
    const objective = this.currentObjective();
    this.ui.title.textContent = objective?.title ?? "The First Expedition";
    this.ui.objective.textContent = `${objective?.objective ?? "Explore the frontier"} (${this.progress[objective?.id] ?? 0}/${objective?.goal ?? 1})`;
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
      detail: { name: "questComplete", intensity: 0.72 },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.active = Boolean(saved.active);
      this.complete = Boolean(saved.complete);
      this.objectiveIndex = saved.objectiveIndex ?? 0;
      this.progress = saved.progress ?? {};
      this.tracks = new Set(saved.tracks ?? []);
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
      tracks: [...this.tracks],
      landmarks: [...this.landmarks],
    }));
  }
}
