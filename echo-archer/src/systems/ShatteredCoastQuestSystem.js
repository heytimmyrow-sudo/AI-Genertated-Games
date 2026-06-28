const STORAGE_KEY = "echo-archer-shattered-coast-v1";

const OBJECTIVES = [
  { id: "arrival", title: "The Sea of Forgotten Kings", objective: "Discover Shattered Coast", goal: 1 },
  { id: "landmarks", title: "Coastal Ruins", objective: "Discover 5 Shattered Coast landmarks", goal: 5 },
  { id: "records", title: "Destroyed Coastal Records", objective: "Recover 2 coastal records", goal: 2 },
  { id: "tidal", title: "Tidal Routes", objective: "Find the low-tide passages", goal: 2 },
  { id: "range", title: "Stormwatch Range", objective: "Complete the Shattered Coast target challenge", goal: 1 },
  { id: "warden", title: "The Tidebound Warden", objective: "Defeat The Tidebound Warden", goal: 1 },
];

const SHATTERED_COAST_LANDMARKS = new Set([
  "stormwatch-fortress",
  "broken-beacon",
  "tidefall-caverns",
  "kings-sea-gate",
  "wreckers-point",
  "drowned-citadel",
]);

const TIDAL_LANDMARKS = new Set(["broken-beacon", "tidefall-caverns", "drowned-citadel"]);

export class ShatteredCoastQuestSystem {
  constructor(ui = {}) {
    this.ui = ui;
    this.active = false;
    this.complete = false;
    this.objectiveIndex = 0;
    this.progress = {};
    this.landmarks = new Set();
    this.records = new Set();
    this.tidalRoutes = new Set();
    this.load();
    this.bindEvents();
    this.updateTracker();
  }

  bindEvents() {
    window.addEventListener("echo-archer:region-discovered", (event) => this.recordDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:landmark-discovered", (event) => this.recordDiscovery(event.detail?.id));
    window.addEventListener("echo-archer:rare-loot", (event) => this.recordLoot(event.detail?.name));
    window.addEventListener("echo-archer:xp-pickup", (event) => this.recordLoot(event.detail?.name));
    window.addEventListener("echo-archer:challenge-complete", (event) => {
      if (event.detail?.id === "shatteredCoastTargets" || event.detail?.id === "shatteredCoast") this.advanceSpecific("range", 1);
    });
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type === "tideboundWarden") this.advanceSpecific("warden", 1);
    });
  }

  update() {
    if (this.active || this.complete) this.updateTracker();
  }

  start() {
    if (this.complete) return;
    if (!this.active) {
      this.active = true;
      this.showToast("Main Quest started: The Sea of Forgotten Kings");
    }
    this.advanceSpecific("arrival", 1);
    this.save();
    this.updateTracker();
  }

  recordDiscovery(id) {
    if (id === "shattered-coast") this.start();
    if (!this.active || this.complete || !id) return;
    if (SHATTERED_COAST_LANDMARKS.has(id) && !this.landmarks.has(id)) {
      this.landmarks.add(id);
      this.progress.landmarks = Math.min(OBJECTIVES[1].goal, this.landmarks.size);
      if (this.currentObjective()?.id === "landmarks" && this.progress.landmarks >= OBJECTIVES[1].goal) this.completeCurrentObjective();
    }
    if (TIDAL_LANDMARKS.has(id) && !this.tidalRoutes.has(id)) {
      this.tidalRoutes.add(id);
      this.progress.tidal = Math.min(OBJECTIVES[3].goal, this.tidalRoutes.size);
      if (this.currentObjective()?.id === "tidal" && this.progress.tidal >= OBJECTIVES[3].goal) this.completeCurrentObjective();
    }
    this.save();
    this.updateTracker();
  }

  recordLoot(name = "") {
    if (!this.active || this.complete) return;
    if (!/salt-king|tide-key|stormcaller beacon/i.test(name)) return;
    const id = name.toLowerCase().replaceAll(" ", "-");
    if (this.records.has(id)) return;
    this.records.add(id);
    this.progress.records = Math.min(OBJECTIVES[2].goal, this.records.size);
    this.showToast(`Coastal record recovered (${this.progress.records}/2)`);
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
        questId: `shattered-coast-${objective.id}`,
        title: objective.title,
        xp: objective.id === "warden" ? 420 : 175,
        upgradePoints: objective.id === "warden" ? 1 : 0,
        message: `${objective.title} complete`,
        gold: objective.id === "warden" ? 210 : 90,
        reputation: objective.id === "warden" ? 230 : 105,
        villageReputation: objective.id === "warden" ? 115 : 52,
      },
    }));
    this.objectiveIndex += 1;
    if (objective.id === "range") {
      window.dispatchEvent(new CustomEvent("echo-archer:tidebound-warden-ready", {
        detail: { title: "The Tidebound Warden", message: "The Drowned Citadel answers the restored beacon with a tide-black roar." },
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
    this.showToast("The coastal records were destroyed on purpose. Older truths wait beyond the sea.");
    window.dispatchEvent(new CustomEvent("echo-archer:shattered-coast-complete", {
      detail: {
        title: "The Sea of Forgotten Kings",
        message: "The ancient kingdom traded by sea, and someone erased what those voyages found.",
      },
    }));
  }

  currentObjective() {
    return OBJECTIVES[this.objectiveIndex] ?? null;
  }

  updateTracker() {
    if (!this.ui.title || !this.ui.objective || (!this.active && !this.complete)) return;
    if (this.complete) {
      this.ui.title.textContent = "Shattered Coast";
      this.ui.objective.textContent = "Destroyed records point toward an older civilization beyond the sea.";
      return;
    }
    const objective = this.currentObjective();
    this.ui.title.textContent = objective?.title ?? "The Sea of Forgotten Kings";
    this.ui.objective.textContent = `${objective?.objective ?? "Investigate the coast"} (${this.progress[objective?.id] ?? 0}/${objective?.goal ?? 1})`;
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
      this.tidalRoutes = new Set(saved.tidalRoutes ?? []);
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
      tidalRoutes: [...this.tidalRoutes],
    }));
  }
}
