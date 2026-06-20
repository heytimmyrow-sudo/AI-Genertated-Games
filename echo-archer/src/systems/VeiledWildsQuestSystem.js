const STORAGE_KEY = "echo-archer-veiled-wilds-v1";

const OBJECTIVES = [
  { id: "arrival", title: "The Hidden Road", objective: "Discover The Veiled Wilds", goal: 1 },
  { id: "landmarks", title: "Places Under Leaves", objective: "Discover 5 Veiled Wilds landmarks", goal: 5 },
  { id: "records", title: "Records Lost to Nature", objective: "Recover 2 Wilds records", goal: 2 },
  { id: "paths", title: "Hidden Paths", objective: "Reveal 3 concealed trails", goal: 3 },
  { id: "range", title: "Patient Shots", objective: "Complete the Veiled Wilds target challenge", goal: 1 },
  { id: "grovekeeper", title: "The Ancient Grovekeeper", objective: "Defeat The Ancient Grovekeeper", goal: 1 },
];

const VEILED_LANDMARKS = new Set([
  "worldroot-grove",
  "hidden-lake",
  "greenheart-ruins",
  "sleeping-arch",
  "mistveil-hollow",
  "forgotten-circle-wilds",
]);

const PATH_REVEALS = {
  "worldroot-grove": "worldroot-trail",
  "hidden-lake": "lake-trail",
  "forgotten-circle-wilds": "circle-trail",
};

export class VeiledWildsQuestSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.active = false;
    this.complete = false;
    this.objectiveIndex = 0;
    this.progress = {};
    this.landmarks = new Set();
    this.records = new Set();
    this.paths = new Set();
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:region-discovered", (event) => this.recordDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.recordDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:rare-loot", (event) => this.recordRecord(event.detail?.name));
    window.addEventListener("echo-archer:xp-pickup", (event) => this.recordRecord(event.detail?.name));
    window.addEventListener("echo-archer:challenge-complete", (event) => {
      if (event.detail?.id === "veiledWildsTargets") this.advanceSpecific("range", 1);
    });
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type === "ancientGrovekeeper") this.advanceSpecific("grovekeeper", 1);
    });
  }

  update() {
    if (this.active || this.complete) this.updateTracker();
  }

  start() {
    if (this.complete) return;
    if (!this.active) {
      this.active = true;
      this.showToast("Main Quest started: The Hidden Road");
    }
    this.advanceSpecific("arrival", 1);
    this.save();
    this.updateTracker();
  }

  recordDiscovery(id) {
    if (id === "veiled-wilds") this.start();
    if (!this.active || this.complete || !id) return;
    if (VEILED_LANDMARKS.has(id) && !this.landmarks.has(id)) {
      this.landmarks.add(id);
      this.progress.landmarks = Math.min(OBJECTIVES[1].goal, this.landmarks.size);
      if (PATH_REVEALS[id]) this.revealPath(PATH_REVEALS[id]);
      if (this.currentObjective()?.id === "landmarks" && this.progress.landmarks >= OBJECTIVES[1].goal) this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  revealPath(id) {
    if (this.paths.has(id)) return;
    this.paths.add(id);
    this.progress.paths = Math.min(OBJECTIVES[3].goal, this.paths.size);
    window.dispatchEvent(new CustomEvent("echo-archer:veiled-wilds-hidden-path", {
      detail: { id },
    }));
    this.showToast(`Hidden path revealed (${this.progress.paths}/3)`);
    if (this.currentObjective()?.id === "paths" && this.progress.paths >= OBJECTIVES[3].goal) this.completeCurrentObjective();
  }

  recordRecord(name = "") {
    if (!this.active || this.complete) return;
    if (!/greenheart|lake-sealed|whisperbranch marker/i.test(name)) return;
    const id = name.toLowerCase().replaceAll(" ", "-");
    if (this.records.has(id)) return;
    this.records.add(id);
    this.progress.records = Math.min(OBJECTIVES[2].goal, this.records.size);
    this.showToast(`Wilds record recovered (${this.progress.records}/2)`);
    if (this.currentObjective()?.id === "records" && this.progress.records >= OBJECTIVES[2].goal) this.completeCurrentObjective();
    this.save();
    this.updateTracker();
  }

  advanceSpecific(id, amount) {
    if (!this.active || this.complete) return;
    const objective = OBJECTIVES.find((item) => item.id === id);
    if (!objective) return;
    this.progress[id] = Math.min(objective.goal, (this.progress[id] ?? 0) + amount);
    if (this.currentObjective()?.id === id && this.progress[id] >= objective.goal) this.completeCurrentObjective();
    this.save();
    this.updateTracker();
  }

  completeCurrentObjective() {
    const objective = this.currentObjective();
    if (!objective) return;
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: `veiled-wilds-${objective.id}`,
        title: objective.title,
        xp: objective.id === "grovekeeper" ? 440 : 185,
        upgradePoints: objective.id === "grovekeeper" ? 1 : 0,
        message: `${objective.title} complete`,
        gold: objective.id === "grovekeeper" ? 225 : 95,
        reputation: objective.id === "grovekeeper" ? 240 : 110,
        villageReputation: objective.id === "grovekeeper" ? 120 : 55,
      },
    }));
    this.objectiveIndex += 1;
    if (objective.id === "range") {
      window.dispatchEvent(new CustomEvent("echo-archer:ancient-grovekeeper-ready", {
        detail: { title: "The Ancient Grovekeeper", message: "The Worldroot answers. Something immense moves beneath the leaves." },
      }));
    }
    if (this.objectiveIndex >= OBJECTIVES.length) {
      this.completeQuestline();
    } else {
      const nextObjective = this.currentObjective();
      if ((this.progress[nextObjective.id] ?? 0) >= nextObjective.goal) {
        this.completeCurrentObjective();
        return;
      }
      this.showToast(OBJECTIVES[this.objectiveIndex].objective);
    }
  }

  completeQuestline() {
    this.active = false;
    this.complete = true;
    this.showToast("The Hidden Road points toward histories buried by root and hand alike.");
    window.dispatchEvent(new CustomEvent("echo-archer:veiled-wilds-complete", {
      detail: {
        title: "The Hidden Road",
        message: "Nature covered evidence of something enormous, and someone helped it disappear.",
      },
    }));
  }

  currentObjective() {
    return OBJECTIVES[this.objectiveIndex] ?? null;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.complete)) return;
    if (this.complete) {
      this.ui.title.textContent = "Veiled Wilds";
      this.ui.objective.textContent = "The Hidden Road points deeper into Arc 2's buried history.";
      return;
    }
    const objective = this.currentObjective();
    this.ui.title.textContent = objective?.title ?? "The Hidden Road";
    this.ui.objective.textContent = `${objective?.objective ?? "Investigate the Wilds"} (${this.progress[objective?.id] ?? 0}/${objective?.goal ?? 1})`;
  }

  showToast(text) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", { detail: { name: "questComplete", intensity: 0.78 } }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.active = Boolean(saved.active);
      this.complete = Boolean(saved.complete);
      this.objectiveIndex = saved.objectiveIndex ?? 0;
      this.progress = saved.progress ?? {};
      this.landmarks = new Set(saved.landmarks ?? []);
      this.records = new Set(saved.records ?? []);
      this.paths = new Set(saved.paths ?? []);
      this.paths.forEach((id) => {
        window.dispatchEvent(new CustomEvent("echo-archer:veiled-wilds-hidden-path", { detail: { id } }));
      });
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
      landmarks: [...this.landmarks],
      records: [...this.records],
      paths: [...this.paths],
    }));
  }
}
