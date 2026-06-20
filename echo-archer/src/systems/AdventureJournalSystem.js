const STORAGE_KEY = "echo-archer-journal-v1";

export class AdventureJournalSystem {
  constructor(ui) {
    this.ui = ui;
    this.open = false;
    this.entries = {
      landmarks: new Map(),
      bosses: new Map(),
      bows: new Map(),
      quests: new Map(),
      shrines: new Map(),
      trails: new Map(),
      regions: new Map(),
      reputation: new Map(),
    };
    this.load();
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.addEventListener("echo-archer:journal-landmark", (event) => {
      this.record("landmarks", event.detail?.id, event.detail?.name);
    });
    window.addEventListener("echo-archer:region-discovered", (event) => {
      this.record("regions", event.detail?.id, event.detail?.name);
    });
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      this.record("bosses", event.detail?.type, event.detail?.name ?? event.detail?.type);
    });
    window.addEventListener("echo-archer:quest-reward", (event) => {
      this.record("quests", event.detail?.questId, event.detail?.title);
    });
    window.addEventListener("echo-archer:rare-loot", (event) => {
      const name = event.detail?.name ?? "";
      if (/frostbite|stormcaller|sunpiercer|whisperwind|whisperbranch|tidepiercer|bogpiercer|infernoheart|starpiercer|windrunner|kingmaker|voidstar/i.test(name)) {
        this.record("bows", name.toLowerCase().replaceAll(" ", "-"), name);
      }
    });
    window.addEventListener("echo-archer:challenge-complete", (event) => {
      const id = event.detail?.id ?? "";
      if (id.startsWith("shrine") || /temple|shrine/i.test(event.detail?.label ?? "")) {
        this.record("shrines", id, event.detail?.label);
      }
    });
    window.addEventListener("echo-archer:discovery-trail", (event) => {
      this.record("trails", event.detail?.id, event.detail?.name);
    });
    window.addEventListener("echo-archer:celestial-energy", (event) => {
      this.record("trails", `celestial-${event.detail?.id}`, event.detail?.name);
    });
    window.addEventListener("echo-archer:reputation-rank", (event) => {
      this.record("reputation", event.detail?.id, event.detail?.name);
    });
    window.addEventListener("echo-archer:master-archer-complete", (event) => {
      this.record("quests", "master-archer-trials", "The Master Archer Trials");
      this.record("reputation", "master-archer-title", event.detail?.title ?? "Master Archer");
    });
    window.addEventListener("echo-archer:frontier-expedition-complete", (event) => {
      this.record("quests", "frontier-expedition", event.detail?.title ?? "The First Expedition");
      this.record("regions", "frontier-plains", "Frontier Plains");
    });
    window.addEventListener("echo-archer:lost-kingdom-complete", (event) => {
      this.record("quests", "lost-kingdom-secrets", event.detail?.title ?? "Secrets Beneath the Frontier");
      this.record("regions", "lost-kingdom", "The Lost Kingdom");
    });
    window.addEventListener("echo-archer:ancient-record", (event) => {
      this.record("trails", `lost-record-${event.detail?.id}`, event.detail?.name);
    });
    window.addEventListener("echo-archer:ancient-mechanism", (event) => {
      this.record("trails", `ancient-mechanism-${event.detail?.id}`, event.detail?.name);
    });
    window.addEventListener("echo-archer:celestial-expanse-complete", (event) => {
      this.record("quests", "celestial-expanse-echoes", event.detail?.title ?? "Echoes of the First Sky");
      this.record("regions", "celestial-expanse", "The Celestial Expanse");
    });
    window.addEventListener("echo-archer:celestial-record", (event) => {
      this.record("trails", `celestial-record-${event.detail?.id}`, event.detail?.name);
    });
    window.addEventListener("echo-archer:celestial-relay", (event) => {
      this.record("trails", `celestial-relay-${event.detail?.id}`, event.detail?.name);
    });
    window.addEventListener("echo-archer:shattered-coast-complete", (event) => {
      this.record("quests", "shattered-coast-sea-kings", event.detail?.title ?? "The Sea of Forgotten Kings");
      this.record("regions", "shattered-coast", "Shattered Coast");
    });
    window.addEventListener("echo-archer:veiled-wilds-complete", (event) => {
      this.record("quests", "veiled-wilds-hidden-road", event.detail?.title ?? "The Hidden Road");
      this.record("regions", "veiled-wilds", "The Veiled Wilds");
    });
    window.addEventListener("echo-archer:veiled-wilds-hidden-path", (event) => {
      this.record("trails", `veiled-path-${event.detail?.id}`, "Veiled Wilds Hidden Path");
    });
  }

  update(input) {
    if (input.wasPressed("KeyJ")) {
      this.toggle();
    }
    if (input.wasPressed("Escape") && this.open) {
      this.close();
    }
  }

  toggle() {
    this.open = !this.open;
    this.ui.menu.classList.toggle("visible", this.open);
    document.body.classList.toggle("journal-open", this.open);
    if (this.open && document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.render();
    this.playUiClick();
  }

  close() {
    this.open = false;
    this.ui.menu.classList.remove("visible");
    document.body.classList.remove("journal-open");
    this.playUiClick();
  }

  record(category, id, name) {
    if (!id || !name || !this.entries[category]) {
      return;
    }
    this.entries[category].set(id, { id, name, time: Date.now() });
    this.save();
    this.render();
  }

  render() {
    this.ui.body.innerHTML = "";
    [
      ["landmarks", "Landmarks Discovered"],
      ["bosses", "Bosses Defeated"],
      ["bows", "Legendary Bows"],
      ["quests", "Quests Completed"],
      ["shrines", "Shrines / Temples Completed"],
      ["trails", "Discovery Trails Revealed"],
      ["regions", "Regions Charted"],
      ["reputation", "Reputation Ranks"],
    ].forEach(([key, label]) => {
      const section = document.createElement("section");
      section.className = "journal-section";
      const values = [...this.entries[key].values()];
      section.innerHTML = `
        <h3>${label}</h3>
        ${values.length ? values.map((entry) => `<p>${entry.name}</p>`).join("") : "<p class=\"empty\">Nothing recorded yet.</p>"}
      `;
      this.ui.body.appendChild(section);
    });
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      Object.keys(this.entries).forEach((key) => {
        this.entries[key] = new Map((saved[key] ?? []).map((entry) => [entry.id, entry]));
      });
    } catch (error) {
      console.warn("Journal save ignored:", error);
    }
  }

  save() {
    const payload = Object.fromEntries(Object.entries(this.entries).map(([key, map]) => [key, [...map.values()]]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  playUiClick() {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.55 },
    }));
  }
}
