import { SETTINGS } from "../config/settings.js";

const STORAGE_KEY = "echo-archer-save-v1";
const AUTOSAVE_DELAY = 8;
const AUTOSAVE_INTERVAL = 24;
const STORAGE_PREFIX = "echo-archer-";

const { THREE } = window;

export class SaveSystem {
  constructor(ui, systems) {
    this.ui = ui;
    this.systems = systems;
    this.autosaveTimer = AUTOSAVE_INTERVAL;
    this.dirtyTimer = AUTOSAVE_DELAY;
    this.dirty = false;
    this.lastSavedAt = 0;
    this.lastSavedPosition = null;
    this.restarting = false;
    this.loaded = this.load();
    this.bindUi();
    this.bindEvents();
    if (!this.loaded) {
      this.updateLabel("Autosave ready");
    }
  }

  bindUi() {
    this.ui.button?.addEventListener("click", () => {
      this.save("Manual save");
      this.playUiClick();
    });
  }

  restartEntireGame() {
    try {
      this.restarting = true;
      this.clearProgressStorage();
      this.dirty = false;
      this.dirtyTimer = AUTOSAVE_DELAY;
      this.autosaveTimer = AUTOSAVE_INTERVAL;
      this.updateLabel("Restarting...", "saved");
      this.playUiClick();
      window.setTimeout(() => window.location.reload(), 180);
      return true;
    } catch (error) {
      console.warn("Echo Archer restart failed:", error);
      this.updateLabel("Restart failed", "error");
      return false;
    }
  }

  clearProgressStorage() {
    const preserved = new Map();
    const keysToRemove = [];
    const shouldPreserve = (key) => (
      key === "echo-archer-muted"
      || key === "echo-archer-volume"
      || key === "echo-archer-detail"
      || key === "echo-archer-graphics-quality-v1"
      || key === "echo-archer-shortcut-sidebar-collapsed"
      || key === "echo-archer-mobile-hud-mode"
      || key.startsWith("echo-archer-mobile-panel-")
    );

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(STORAGE_PREFIX)) {
        continue;
      }
      if (shouldPreserve(key)) {
        preserved.set(key, localStorage.getItem(key));
      } else {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    preserved.forEach((value, key) => {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      }
    });
  }

  bindEvents() {
    [
      "echo-archer:quest-reward",
      "echo-archer:gear-pickup",
      "echo-archer:rare-loot",
      "echo-archer:boss-defeated",
      "echo-archer:challenge-complete",
      "echo-archer:landmark-discovered",
      "echo-archer:region-discovered",
      "echo-archer:level-up",
    ].forEach((eventName) => {
      window.addEventListener(eventName, () => this.markDirty());
    });

    window.addEventListener("beforeunload", () => {
      if (!this.restarting) {
        this.save("Saved");
      }
    });
  }

  update(deltaSeconds) {
    if (this.restarting || this.systems.player?.defeated) {
      return;
    }
    this.trackMovementProgress();
    if (this.dirty) {
      this.dirtyTimer -= deltaSeconds;
      if (this.dirtyTimer <= 0) {
        this.save("Autosaved");
        return;
      }
    }

    this.autosaveTimer -= deltaSeconds;
    if (this.autosaveTimer <= 0) {
      this.save("Autosaved");
    }
  }

  markDirty() {
    this.dirty = true;
    this.dirtyTimer = Math.min(this.dirtyTimer, AUTOSAVE_DELAY);
    this.updateLabel("Unsaved changes");
  }

  save(label = "Saved") {
    try {
      this.flushSystemSaves();
      const snapshot = this.createSnapshot();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      this.lastSavedAt = Date.now();
      this.lastSavedPosition = this.systems.player.group.position.clone();
      this.dirty = false;
      this.dirtyTimer = AUTOSAVE_DELAY;
      this.autosaveTimer = AUTOSAVE_INTERVAL;
      this.updateLabel(label, "saved");
      window.dispatchEvent(new CustomEvent("echo-archer:save-complete", {
        detail: { label, savedAt: this.lastSavedAt },
      }));
      return true;
    } catch (error) {
      console.warn("Echo Archer save failed:", error);
      this.updateLabel("Save failed", "error");
      return false;
    }
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (!saved) {
        return false;
      }
      this.restoreSnapshot(saved);
      this.lastSavedAt = saved.savedAt ?? Date.now();
      this.updateLabel("Progress loaded", "saved");
      return true;
    } catch (error) {
      console.warn("Echo Archer save ignored:", error);
      this.updateLabel("Save unreadable", "error");
      return false;
    }
  }

  continueFromLastSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) {
        this.restoreSnapshot(saved);
        this.ensureContinuedPlayerHealth(saved.player);
        this.lastSavedAt = saved.savedAt ?? this.lastSavedAt;
        this.updateLabel("Continued from save", "saved");
        window.dispatchEvent(new CustomEvent("echo-archer:save-continue", {
          detail: { savedAt: this.lastSavedAt, fallback: false },
        }));
        return true;
      }
    } catch (error) {
      console.warn("Echo Archer continue ignored bad save:", error);
    }

    this.respawnAtSafeStart();
    this.updateLabel("Continued at camp", "saved");
    window.dispatchEvent(new CustomEvent("echo-archer:save-continue", {
      detail: { fallback: true },
    }));
    return false;
  }

  createSnapshot() {
    const { player, progression, inventory, quests, world } = this.systems;
    return {
      version: 1,
      savedAt: Date.now(),
      player: this.serializePlayer(player, world),
      progression: {
        level: progression.level,
        xp: progression.xp,
        upgradePoints: progression.upgradePoints,
        upgradeRanks: { ...progression.upgradeRanks },
      },
      inventory: {
        owned: Object.fromEntries(Object.entries(inventory.owned).map(([category, items]) => [category, [...items]])),
        equipped: { ...inventory.equipped },
        selected: { ...inventory.selected },
        activeCategory: inventory.activeCategory,
      },
      quests: {
        ...(quests.getSaveData?.() ?? {
          activeQuestIndex: quests.activeQuestIndex,
          discoveredLandmarks: [...quests.discoveredLandmarks],
          quests: quests.quests.map((quest) => ({
            id: quest.id,
            progress: quest.progress,
            complete: quest.complete,
          })),
        }),
      },
      world: {
        timeOfDay: world.timeOfDay,
      },
      storage: this.createStorageSnapshot(),
    };
  }

  createStorageSnapshot() {
    const storage = {};
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(STORAGE_PREFIX) && key !== STORAGE_KEY && !key.includes("volume") && !key.includes("muted")) {
          storage[key] = localStorage.getItem(key);
        }
      }
    } catch (error) {
      console.warn("Echo Archer storage snapshot skipped:", error);
    }
    return storage;
  }

  serializePlayer(player, world) {
    const position = player.group.position;
    const groundY = this.getGroundY(world, position.x, position.z);
    return {
      position: { x: position.x, y: groundY, z: position.z },
      health: player.stats.health,
      healthMax: player.stats.healthMax,
      stamina: player.stats.stamina,
      staminaMax: player.stats.staminaMax,
    };
  }

  restoreSnapshot(saved) {
    this.restoreStorageSnapshot(saved.storage);
    this.restorePlayer(saved.player);
    this.restoreProgression(saved.progression);
    this.restoreInventory(saved.inventory);
    this.restoreQuests(saved.quests);
    this.restoreWorld(saved.world);
    this.refreshSystems();
  }

  restoreStorageSnapshot(storage) {
    if (!storage || typeof storage !== "object") {
      return;
    }
    Object.entries(storage).forEach(([key, value]) => {
      if (!key.startsWith(STORAGE_PREFIX) || key === STORAGE_KEY || typeof value !== "string") {
        return;
      }
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn(`Echo Archer could not restore ${key}:`, error);
      }
    });
  }

  restorePlayer(savedPlayer) {
    const { player, world } = this.systems;
    if (!savedPlayer?.position) {
      return;
    }

    const x = Number(savedPlayer.position.x);
    const z = Number(savedPlayer.position.z);
    if (Number.isFinite(x) && Number.isFinite(z)) {
      const groundY = this.getGroundY(world, x, z);
      player.group.position.set(x, groundY + SETTINGS.player.height / 2, z);
      player.velocity?.set?.(0, 0, 0);
      player.onGround = true;
      player.lastGroundY = groundY;
    }
    if (Number.isFinite(savedPlayer.healthMax)) {
      player.stats.healthMax = Math.max(1, savedPlayer.healthMax);
    }
    if (Number.isFinite(savedPlayer.staminaMax)) {
      player.stats.staminaMax = Math.max(1, savedPlayer.staminaMax);
    }
    if (Number.isFinite(savedPlayer.health)) {
      player.stats.health = THREE.MathUtils.clamp(savedPlayer.health, 1, player.stats.healthMax);
      player.defeated = false;
    }
    if (Number.isFinite(savedPlayer.stamina)) {
      player.stats.stamina = THREE.MathUtils.clamp(savedPlayer.stamina, 0, player.stats.staminaMax);
    }
  }

  ensureContinuedPlayerHealth(savedPlayer = {}) {
    const { player } = this.systems;
    const maxHealth = Math.max(1, player.stats.healthMax ?? savedPlayer.healthMax ?? 100);
    const savedHealth = Number(savedPlayer.health);
    player.stats.health = Number.isFinite(savedHealth) && savedHealth > 0
      ? THREE.MathUtils.clamp(savedHealth, Math.max(1, maxHealth * 0.25), maxHealth)
      : Math.max(35, maxHealth * 0.45);
    player.stats.stamina = Math.max(player.stats.stamina ?? 0, player.stats.staminaMax ?? SETTINGS.player.stamina);
    player.defeated = false;
    player.damageCooldown = 0;
  }

  respawnAtSafeStart() {
    const { player, world } = this.systems;
    const start = { x: -15, z: -6 };
    const groundY = this.getGroundY(world, start.x, start.z);
    player.group.position.set(start.x, groundY + SETTINGS.player.height / 2, start.z);
    player.velocity?.set?.(0, 0, 0);
    player.onGround = true;
    player.lastGroundY = groundY;
    player.stats.health = Math.max(50, (player.stats.healthMax ?? 100) * 0.5);
    player.stats.stamina = player.stats.staminaMax ?? SETTINGS.player.stamina;
    player.defeated = false;
    player.damageCooldown = 0;
  }

  getGroundY(world, x, z) {
    const terrainY = world.terrain.getHeightAt(x, z);
    const platformY = world.getPlatformHeightAt?.(x, z) ?? -Infinity;
    return Math.max(terrainY, platformY);
  }

  restoreProgression(savedProgression) {
    const { progression } = this.systems;
    if (!savedProgression) {
      return;
    }
    progression.level = Math.max(1, Number(savedProgression.level) || progression.level);
    progression.xp = Math.max(0, Number(savedProgression.xp) || 0);
    progression.upgradePoints = Math.max(0, Number(savedProgression.upgradePoints) || 0);
    if (savedProgression.upgradeRanks) {
      Object.keys(progression.upgradeRanks).forEach((id) => {
        progression.upgradeRanks[id] = Math.max(0, Number(savedProgression.upgradeRanks[id]) || 0);
      });
    }
    progression.applyUpgrades();
    progression.renderUpgradeMenu();
    progression.updateUi();
  }

  restoreInventory(savedInventory) {
    const { inventory } = this.systems;
    if (!savedInventory) {
      return;
    }
    Object.entries(savedInventory.owned ?? {}).forEach(([category, items]) => {
      if (inventory.owned[category]) {
        inventory.owned[category] = new Set(Array.isArray(items) ? items : []);
      }
    });
    inventory.equipped = { ...inventory.equipped, ...(savedInventory.equipped ?? {}) };
    inventory.selected = { ...inventory.selected, ...(savedInventory.selected ?? {}) };
    inventory.activeCategory = savedInventory.activeCategory ?? inventory.activeCategory;
    inventory.render();
    inventory.applyGear();
  }

  restoreQuests(savedQuests) {
    const { quests } = this.systems;
    if (!savedQuests) {
      return;
    }
    if (typeof quests.restoreSaveData === "function") {
      quests.restoreSaveData(savedQuests);
      quests.syncQuestState?.();
    } else {
      quests.activeQuestIndex = THREE.MathUtils.clamp(Number(savedQuests.activeQuestIndex) || 0, 0, quests.quests.length - 1);
      quests.discoveredLandmarks = new Set(savedQuests.discoveredLandmarks ?? []);
      (savedQuests.quests ?? []).forEach((savedQuest) => {
        const quest = quests.quests.find((item) => item.id === savedQuest.id);
        if (!quest) {
          return;
        }
        quest.progress = THREE.MathUtils.clamp(Number(savedQuest.progress) || 0, 0, quest.goal);
        quest.complete = Boolean(savedQuest.complete);
      });
    }
    quests.finderActive = false;
    quests.finderTarget = null;
    quests.finderArrow.visible = false;
    quests.updateTracker();
    quests.renderQuestMenu?.();
    quests.save?.();
  }

  restoreWorld(savedWorld) {
    const { world } = this.systems;
    if (Number.isFinite(savedWorld?.timeOfDay)) {
      world.timeOfDay = savedWorld.timeOfDay;
    }
  }

  refreshSystems() {
    [
      this.systems.quests,
      this.systems.economy,
      this.systems.rpg,
      this.systems.journal,
      this.systems.worldMap,
      this.systems.masterTrials,
      this.systems.frontierExpedition,
      this.systems.lostKingdomQuest,
      this.systems.celestialExpanseQuest,
      this.systems.shatteredCoastQuest,
      this.systems.veiledWildsQuest,
    ].forEach((system) => {
      try {
        system?.load?.();
      } catch (error) {
        console.warn("Echo Archer subsystem load skipped:", error);
      }
    });
    this.systems.economy?.updateUi?.();
    this.systems.rpg?.applyBonuses?.();
    this.systems.rpg?.renderAll?.();
    this.systems.worldMap?.render?.();
    this.systems.journal?.render?.();
  }

  flushSystemSaves() {
    [
      this.systems.quests,
      this.systems.economy,
      this.systems.rpg,
      this.systems.journal,
      this.systems.worldMap,
      this.systems.masterTrials,
      this.systems.frontierExpedition,
      this.systems.lostKingdomQuest,
      this.systems.celestialExpanseQuest,
      this.systems.shatteredCoastQuest,
      this.systems.veiledWildsQuest,
    ].forEach((system) => {
      try {
        system?.save?.();
      } catch (error) {
        console.warn("Echo Archer subsystem save skipped:", error);
      }
    });
  }

  trackMovementProgress() {
    const position = this.systems.player.group.position;
    if (!this.lastSavedPosition) {
      this.lastSavedPosition = position.clone();
      return;
    }
    if (position.distanceTo(this.lastSavedPosition) > 2.5) {
      this.markDirty();
    }
  }

  updateLabel(text, state = "") {
    if (!this.ui.label) {
      return;
    }
    this.ui.label.textContent = text;
    this.ui.label.className = state;
    if (state === "saved") {
      window.clearTimeout(this.labelTimer);
      this.labelTimer = window.setTimeout(() => {
        if (!this.dirty && this.ui.label) {
          this.ui.label.textContent = this.lastSavedAt ? `Saved ${new Date(this.lastSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Autosave ready";
          this.ui.label.className = "saved";
        }
      }, 1400);
    }
  }

  playUiClick() {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.58 },
    }));
  }
}
