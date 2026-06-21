const STORAGE_KEY = "echo-archer-archers-lodge-v1";

export class ArcherLodgeSystem {
  constructor(world) {
    this.world = world;
    this.state = {
      bosses: new Set(),
      quests: new Set(),
      rareLoot: new Set(),
      masterArcher: false,
      upgrades: {
        furniture: 0,
        displays: 0,
        records: 0,
      },
    };
    this.load();
    this.bindEvents();
    this.apply();
  }

  bindEvents() {
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      const id = event.detail?.type ?? event.detail?.name;
      if (!id) return;
      this.state.bosses.add(id);
      this.state.upgrades.displays = Math.max(this.state.upgrades.displays, Math.min(3, this.state.bosses.size));
      this.persistAndApply();
    });

    window.addEventListener("echo-archer:quest-reward", (event) => {
      const id = event.detail?.questId ?? event.detail?.title;
      if (!id) return;
      this.state.quests.add(id);
      this.state.upgrades.furniture = Math.max(this.state.upgrades.furniture, Math.min(3, Math.floor(this.state.quests.size / 2)));
      this.persistAndApply();
    });

    window.addEventListener("echo-archer:rare-loot", (event) => {
      const id = event.detail?.itemId ?? event.detail?.name;
      if (!id) return;
      this.state.rareLoot.add(id);
      this.state.upgrades.records = Math.max(this.state.upgrades.records, Math.min(3, Math.floor(this.state.rareLoot.size / 2)));
      this.persistAndApply();
    });

    window.addEventListener("echo-archer:master-archer-complete", () => {
      this.state.masterArcher = true;
      this.state.upgrades.displays = 3;
      this.persistAndApply();
    });
  }

  getSummary() {
    return {
      bossesDefeated: this.state.bosses.size,
      questsCompleted: this.state.quests.size,
      rareLootFound: this.state.rareLoot.size,
      masterArcher: this.state.masterArcher,
      upgrades: { ...this.state.upgrades },
    };
  }

  apply() {
    this.world.setLodgeTrophyState?.(this.getSummary());
  }

  persistAndApply() {
    this.save();
    this.apply();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.state.bosses = new Set(saved.bosses ?? []);
      this.state.quests = new Set(saved.quests ?? []);
      this.state.rareLoot = new Set(saved.rareLoot ?? []);
      this.state.masterArcher = Boolean(saved.masterArcher);
      this.state.upgrades = {
        ...this.state.upgrades,
        ...(saved.upgrades ?? {}),
      };
    } catch (error) {
      console.warn("Archer lodge save ignored:", error);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bosses: [...this.state.bosses],
        quests: [...this.state.quests],
        rareLoot: [...this.state.rareLoot],
        masterArcher: this.state.masterArcher,
        upgrades: this.state.upgrades,
      }));
    } catch (error) {
      console.warn("Archer lodge save failed:", error);
    }
  }
}
