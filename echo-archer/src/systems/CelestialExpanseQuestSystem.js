const STORAGE_KEY = "echo-archer-celestial-expanse-v1";

const OBJECTIVES = [
  { id: "orrery", title: "Echoes of the First Sky", objective: "Study the First Sky Orrery", goal: 1 },
  { id: "records", title: "First Sky Records", objective: "Recover 4 celestial records", goal: 4 },
  { id: "relays", title: "Celestial Relays", objective: "Restore 4 celestial relays", goal: 4 },
  { id: "range", title: "Relay Range", objective: "Complete the Celestial Relay target range", goal: 1, challengeId: "celestialTargets" },
  { id: "warden", title: "The Skybound Warden", objective: "Defeat The Skybound Warden", goal: 1 },
];

const CELESTIAL_LANDMARKS = new Set([
  "celestial-expanse",
  "observatory-prime",
  "skyfall-basin",
  "crystal-sea",
  "floating-reach",
  "starforge-ruins",
  "temple-first-sky",
]);

export class CelestialExpanseQuestSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.active = false;
    this.complete = false;
    this.objectiveIndex = 0;
    this.progress = {};
    this.records = new Set();
    this.relays = new Set();
    this.landmarks = new Set();
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:celestial-expanse-quest", () => this.start());
    window.addEventListener("echo-archer:celestial-record", (event) => this.recordCelestialRecord(event.detail?.id, event.detail?.name));
    window.addEventListener("echo-archer:celestial-relay", (event) => this.recordRelay(event.detail?.id, event.detail?.name));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:region-discovered", (event) => this.recordLandmark(event.detail?.id));
    window.addEventListener("echo-archer:challenge-complete", (event) => this.recordChallenge(event.detail?.id));
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type === "skyboundWarden") this.advanceSpecific("warden", 1);
    });
  }

  update() {
    if (this.active || this.complete) this.updateTracker();
  }

  start() {
    if (this.complete) {
      this.showToast("The First Sky remains partly hidden. Something greater still leaves traces.");
      return;
    }
    if (!this.active) {
      this.active = true;
      this.showToast("Main Quest started: Echoes of the First Sky");
    }
    this.advanceSpecific("orrery", 1);
    this.save();
    this.updateTracker();
  }

  recordCelestialRecord(id, name) {
    if (!this.active || this.complete || !id || this.records.has(id)) return;
    this.records.add(id);
    this.progress.records = Math.min(OBJECTIVES[1].goal, this.records.size);
    this.showToast(`${name ?? "Record"} decoded (${this.progress.records}/4)`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: "celestial-record",
        title: "Celestial Record",
        xp: 55,
        upgradePoints: 0,
        message: "Celestial record decoded",
        gold: 16,
        reputation: 16,
        villageReputation: 9,
      },
    }));
    if (this.currentObjective()?.id === "records" && this.progress.records >= OBJECTIVES[1].goal) {
      this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  recordRelay(id, name) {
    if (!this.active || this.complete || !id || this.relays.has(id)) return;
    this.relays.add(id);
    this.progress.relays = Math.min(OBJECTIVES[2].goal, this.relays.size);
    this.showToast(`${name ?? "Relay"} restored (${this.progress.relays}/4)`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: "celestial-relay",
        title: "Celestial Relay",
        xp: 65,
        upgradePoints: 0,
        message: "Celestial relay restored",
        gold: 18,
        reputation: 18,
        villageReputation: 10,
      },
    }));
    if (this.currentObjective()?.id === "relays" && this.progress.relays >= OBJECTIVES[2].goal) {
      this.completeCurrentObjective();
      window.dispatchEvent(new CustomEvent("echo-archer:skybound-warden-ready", {
        detail: { title: "The Skybound Warden", message: "The Temple of the First Sky answers with a silent orbit." },
      }));
    }
    this.save();
    this.updateTracker();
  }

  recordLandmark(id) {
    if (!this.active || this.complete || !CELESTIAL_LANDMARKS.has(id) || this.landmarks.has(id)) return;
    this.landmarks.add(id);
    this.save();
  }

  recordChallenge(id) {
    if (id === "celestialTargets") this.advanceSpecific("range", 1);
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
        questId: `celestial-expanse-${objective.id}`,
        title: objective.title,
        xp: objective.id === "warden" ? 360 : 165,
        upgradePoints: objective.id === "warden" ? 1 : 0,
        message: `${objective.title} complete`,
        gold: objective.id === "warden" ? 190 : 82,
        reputation: objective.id === "warden" ? 220 : 95,
        villageReputation: objective.id === "warden" ? 110 : 48,
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
    this.showToast("The First Sky is not the end of the mystery. A greater force left traces behind.");
    window.dispatchEvent(new CustomEvent("echo-archer:celestial-expanse-complete", {
      detail: {
        title: "Echoes of the First Sky",
        message: "The Lost Kingdom was one piece of a much older celestial disaster.",
      },
    }));
  }

  currentObjective() {
    return OBJECTIVES[this.objectiveIndex] ?? null;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.complete)) return;
    if (this.complete) {
      this.ui.title.textContent = "Celestial Expanse";
      this.ui.objective.textContent = "A greater force still leaves traces beyond the First Sky.";
      return;
    }
    const objective = this.currentObjective();
    this.ui.title.textContent = objective?.title ?? "Echoes of the First Sky";
    this.ui.objective.textContent = `${objective?.objective ?? "Investigate the First Sky"} (${this.progress[objective?.id] ?? 0}/${objective?.goal ?? 1})`;
  }

  showToast(text) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.78 },
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
      this.relays = new Set(saved.relays ?? []);
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
      relays: [...this.relays],
      landmarks: [...this.landmarks],
    }));
  }
}
