import { BOW_VISUALS, RARITY_VISUALS } from "../config/gearVisuals.js";

export const GEAR_DEFINITIONS = {
  outfits: [
    { id: "starter-outfit", name: "Starter Outfit", rarity: "common", description: "A simple green archer outfit.", effects: {} },
    { id: "hunter-outfit", name: "Hunter Outfit", rarity: "rare", setId: "hunter", description: "Steadier stance for careful shots.", effects: { steadiness: 0.08 } },
    { id: "traveler-outfit", name: "Traveler Outfit", rarity: "rare", setId: "explorer", description: "Light gear for long routes.", effects: { staminaRecoveryMultiplier: 1.12 } },
    { id: "guild-ranger-outfit", name: "Guild Ranger Outfit", rarity: "epic", setId: "guildRanger", description: "Formal field gear issued to trusted guild archers.", effects: { steadiness: 0.1 } },
    { id: "ancient-archer-outfit", name: "Ancient Archer Outfit", rarity: "legendary", setId: "ancientArcher", description: "Temple-woven cloth carrying old archer markings.", effects: { steadiness: 0.14 } },
    { id: "master-archer-regalia", name: "Master Archer Regalia", rarity: "legendary", setId: "masterArcher", description: "Prestige regalia awarded by the Hall of Arrows.", effects: { steadiness: 0.18, staminaRecoveryMultiplier: 1.08 } },
  ],
  weapons: [
    { id: "wooden-sword", name: "Wooden Sword", description: "Training blade. Melee support only for now.", stats: { power: 1 } },
    { id: "short-blade", name: "Short Blade", description: "Compact sidearm placeholder.", stats: { power: 1.1 } },
    { id: "forest-spear", name: "Forest Spear", description: "Reach weapon placeholder.", stats: { power: 1.18 } },
  ],
  shields: [
    { id: "wooden-shield", name: "Wooden Shield", description: "Basic shield frame for future defense.", stats: { guard: 1 } },
    { id: "reinforced-shield", name: "Reinforced Shield", description: "Stronger shield placeholder.", stats: { guard: 1.25 } },
  ],
  bows: [
    { id: "starter-bow", name: "Starter Bow", rarity: "common", description: "Balanced training bow.", stats: { power: 1, drawSpeed: 1, range: 1, accuracy: 0 } },
    { id: "hunter-bow", name: "Hunter Bow", rarity: "rare", description: "Fast draw and steady forest handling.", stats: { power: 1.08, drawSpeed: 1.12, range: 1.03, accuracy: 0.05 } },
    { id: "longbow", name: "Longbow", rarity: "rare", description: "Slower but excellent at range.", stats: { power: 1.18, drawSpeed: 0.92, range: 1.22, accuracy: 0.04 } },
    { id: "ancient-bow", name: "Ancient Bow", rarity: "epic", description: "A relic bow slot with strong scaling.", stats: { power: 1.28, drawSpeed: 1.04, range: 1.18, accuracy: 0.1 } },
    { id: "stormcaller", name: "Stormcaller", rarity: "legendary", description: "Storm-forged legendary bow earned by restoring coastal beacons and defeating the Tidebound Warden.", stats: { power: 1.42, drawSpeed: 1.06, range: 1.24, accuracy: 0.12 } },
    { id: "frostbite", name: "Frostbite", rarity: "legendary", description: "Ice-themed legendary bow. Progression locked.", stats: { power: 1.3, drawSpeed: 1.02, range: 1.16, accuracy: 0.18 } },
    { id: "sunpiercer", name: "Sunpiercer", rarity: "legendary", description: "Extreme-range canyon bow earned through Echo Target trials.", stats: { power: 1.42, drawSpeed: 0.94, range: 1.5, accuracy: 0.24 } },
    { id: "whisperwind", name: "Whisperwind", rarity: "legendary", description: "Speed-themed legendary bow. Progression locked.", stats: { power: 1.22, drawSpeed: 1.34, range: 1.1, accuracy: 0.16 } },
    { id: "tidepiercer", name: "Tidepiercer", rarity: "legendary", description: "Ocean-wind legendary bow earned through the Coastal Cliffs quest.", stats: { power: 1.34, drawSpeed: 1.08, range: 1.42, accuracy: 0.2 } },
    { id: "bogpiercer", name: "Bogpiercer", rarity: "legendary", description: "Swamp legendary bow earned by clearing the Blackwater fog trial.", stats: { power: 1.36, drawSpeed: 1.0, range: 1.34, accuracy: 0.24 } },
    { id: "infernoheart", name: "Infernoheart", rarity: "legendary", description: "Volcanic legendary bow earned by breaking the Ember Peak seal.", stats: { power: 1.62, drawSpeed: 0.88, range: 1.24, accuracy: 0.08 } },
    { id: "starpiercer", name: "Starpiercer", rarity: "legendary", description: "Celestial mastery bow earned from the Astral Guardian trial.", stats: { power: 1.55, drawSpeed: 1.08, range: 1.48, accuracy: 0.28 } },
    { id: "hallmarked-bow", name: "Hallmarked Bow", rarity: "legendary", description: "A ceremonial Master Archer bow skin with balanced champion stats.", stats: { power: 1.48, drawSpeed: 1.12, range: 1.38, accuracy: 0.3 } },
    { id: "windrunner", name: "Windrunner", rarity: "legendary", description: "Arc 2 frontier bow focused on mobility, clean draw, and precision while moving.", stats: { power: 1.38, drawSpeed: 1.24, range: 1.36, accuracy: 0.24 } },
    { id: "kingmaker", name: "Kingmaker", rarity: "legendary", description: "Lost Kingdom bow focused on power, stability, and Master Archer precision.", stats: { power: 1.6, drawSpeed: 0.98, range: 1.44, accuracy: 0.32 } },
    { id: "voidstar", name: "Voidstar", rarity: "legendary", description: "Celestial mastery bow earned by restoring the First Sky relays.", stats: { power: 1.66, drawSpeed: 1.04, range: 1.58, accuracy: 0.34 } },
    { id: "whisperbranch", name: "Whisperbranch", rarity: "legendary", description: "Patient greenwood bow earned by uncovering hidden trails and defeating the Ancient Grovekeeper.", stats: { power: 1.44, drawSpeed: 1.18, range: 1.38, accuracy: 0.3 } },
  ],
  items: [
    { id: "echo-shard", name: "Echo Shard", description: "A flexible future crafting or quest item.", stats: {} },
    { id: "fire-arrow-bundle", name: "Fire Arrow Bundle", description: "Trade stock for future fire arrow ammunition limits.", stats: { arrows: 8 } },
    { id: "ice-arrow-bundle", name: "Ice Arrow Bundle", description: "Trade stock for future ice arrow ammunition limits.", stats: { arrows: 8 } },
    { id: "explosive-arrow-bundle", name: "Explosive Arrow Bundle", description: "Trade stock for future explosive arrow ammunition limits.", stats: { arrows: 4 } },
    { id: "guild-supply-token", name: "Guild Supply Token", description: "A simple economy item reserved for later crafting and guild orders.", stats: { value: 1 } },
    { id: "lake-skiff-permit", name: "Lake Skiff Permit", rarity: "rare", description: "A Boat Keeper's mark that unlocks a small guild skiff for calm lakes and marked waterways. Fishing-ready for a future update.", stats: { boat: true, waterTravel: 1, fishingReady: 1 } },
    { id: "keeper-rowboat", name: "Keeper Rowboat", rarity: "epic", description: "A warm cedar rowboat prepared by lake keepers for larger crossings, scenic water travel, and future fishing docks.", stats: { boat: true, waterTravel: 1.15, fishingReady: 1 } },
  ],
  mounts: [
    { id: "no-mount", name: "No Mount", rarity: "common", description: "Travel on foot.", stats: {} },
    { id: "horse", name: "Horse", rarity: "rare", description: "Reliable guild riding horse. Press R to summon and ride.", stats: { speed: 1.52 } },
    { id: "forest-elk", name: "Forest Elk", rarity: "epic", description: "Quiet forest mount for future advanced traversal.", stats: { speed: 1.42, grace: 1.2 } },
    { id: "arrowcrest-stag", name: "Arrowcrest Stag", rarity: "legendary", description: "Ceremonial Master Archer mount. Press R to summon and ride.", stats: { speed: 1.58, grace: 1.35 } },
  ],
  mountGear: [
    { id: "plain-saddle", name: "Plain Saddle", description: "A future mount equipment slot.", stats: { handling: 1 } },
  ],
};

const STARTING_ITEMS = {
  outfits: ["starter-outfit", "hunter-outfit"],
  weapons: ["wooden-sword"],
  shields: [],
  bows: ["starter-bow"],
  items: [],
  mounts: ["no-mount", "horse"],
  mountGear: ["plain-saddle"],
};

const DEFAULT_EQUIPPED = {
  outfits: "starter-outfit",
  weapons: "wooden-sword",
  shields: null,
  bows: "starter-bow",
  mounts: "no-mount",
  mountGear: null,
};

export class InventorySystem {
  constructor(ui, systems) {
    this.ui = ui;
    this.systems = systems;
    this.open = false;
    this.activeCategory = "bows";
    this.owned = Object.fromEntries(Object.entries(STARTING_ITEMS).map(([key, values]) => [key, new Set(values)]));
    this.equipped = { ...DEFAULT_EQUIPPED };
    this.selected = { ...DEFAULT_EQUIPPED, items: "echo-shard" };
    this.render();
    this.applyGear();
  }

  update(input) {
    if (input.wasPressed("KeyI")) {
      this.toggle();
    }
  }

  toggle() {
    this.open = !this.open;
    this.ui.menu.classList.toggle("visible", this.open);
    document.body.classList.toggle("inventory-open", this.open);
    if (this.open && document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.playUiClick();
  }

  addItem(category, itemId) {
    if (!this.owned[category]) {
      return false;
    }

    const wasNew = !this.owned[category].has(itemId);
    this.owned[category].add(itemId);
    if (!this.equipped[category] && category !== "items") {
      this.equipped[category] = itemId;
    }
    this.selected[category] = itemId;
    this.render();
    this.applyGear();
    this.showToast(wasNew ? `${this.getItem(category, itemId)?.name ?? "Gear"} acquired` : "Already collected");
    return wasNew;
  }

  equip(category, itemId) {
    this.selected[category] = itemId;
    if (category === "items" || !this.owned[category]?.has(itemId)) {
      this.render();
      return;
    }
    this.equipped[category] = itemId;
    this.render();
    this.applyGear();
    this.playUiClick();
  }

  applyGear() {
    const bow = this.getEquipped("bows");
    const outfit = this.getEquipped("outfits");
    const weapon = this.getEquipped("weapons");
    const shield = this.getEquipped("shields");
    const bowStats = bow?.stats ?? {};
    const outfitEffects = outfit?.effects ?? {};

    this.systems.archery.setGearModifiers?.({
      damageMultiplier: bowStats.power ?? 1,
      drawSpeedMultiplier: bowStats.drawSpeed ?? 1,
      rangeMultiplier: bowStats.range ?? 1,
      steadiness: (bowStats.accuracy ?? 0) + (outfitEffects.steadiness ?? 0),
    });
    this.systems.archery.setBowStyle?.(bow);
    this.systems.player.setOutfitStyle?.(outfit?.setId ?? "starter");
    this.systems.player.setBowStyle?.(bow);
    this.systems.player.setEquipmentStyle?.({ weapon, shield, outfit, bow });
    this.systems.player.stats.staminaRecoveryMultiplier = outfitEffects.staminaRecoveryMultiplier ?? 1;
    this.systems.rpg?.applyBonuses?.();
  }

  getEquipped(category) {
    return this.getItem(category, this.equipped[category]);
  }

  getItem(category, itemId) {
    return GEAR_DEFINITIONS[category]?.find((item) => item.id === itemId) ?? null;
  }

  render() {
    this.ui.tabs.innerHTML = "";
    this.ui.list.innerHTML = "";
    this.ui.details.innerHTML = "";

    Object.keys(GEAR_DEFINITIONS).forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `inventory-tab ${category === this.activeCategory ? "active" : ""}`;
      button.textContent = this.getCategoryLabel(category);
      button.addEventListener("click", () => {
        this.activeCategory = category;
        this.render();
        this.playUiClick();
      });
      this.ui.tabs.appendChild(button);
    });

    GEAR_DEFINITIONS[this.activeCategory].forEach((item) => {
      const owned = this.owned[this.activeCategory]?.has(item.id);
      const equipped = this.equipped[this.activeCategory] === item.id;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `inventory-item ${equipped ? "equipped" : ""} rarity-${item.rarity ?? "common"}`;
      button.innerHTML = `
        <i class="gear-swatch" style="--gear-color: #${this.getVisualColor(item).toString(16).padStart(6, "0")}"></i>
        <span>
          <strong>${item.name}</strong>
          <small>${owned ? item.description : "Not found yet"}</small>
        </span>
        <em>${equipped ? "Equipped" : owned ? "Equip" : "Locked"}</em>
      `;
      button.addEventListener("click", () => this.equip(this.activeCategory, item.id));
      this.ui.list.appendChild(button);
    });

    const equippedItem = this.getEquipped(this.activeCategory);
    const selected = this.getItem(this.activeCategory, this.selected[this.activeCategory]) ?? equippedItem ?? GEAR_DEFINITIONS[this.activeCategory][0];
    const selectedOwned = this.owned[this.activeCategory]?.has(selected.id);
    const selectedEquipped = this.equipped[this.activeCategory] === selected.id;
    this.ui.details.innerHTML = `
      <strong class="rarity-${selected.rarity ?? "common"}">${selected.name}</strong>
      <em>${selectedEquipped ? "Equipped" : selectedOwned ? "Unlocked" : "Locked"}</em>
      <span class="gear-preview" style="--gear-color: #${this.getVisualColor(selected).toString(16).padStart(6, "0")}"></span>
      <p>${selected.description}</p>
      <p class="item-rarity">${this.formatRarity(selected.rarity)}</p>
      <dl>${this.renderStats(selected)}</dl>
    `;
  }

  renderStats(item) {
    const stats = item.stats ?? item.effects ?? {};
    const entries = Object.entries(stats);
    if (!entries.length) {
      return "<dt>Effect</dt><dd>Future-ready slot</dd>";
    }
    return entries.map(([key, value]) => `<dt>${this.formatStat(key)}</dt><dd>${typeof value === "number" ? value.toFixed(2) : value}</dd>`).join("");
  }

  getCategoryLabel(category) {
    return {
      outfits: "Outfits",
      weapons: "Weapons",
      shields: "Shields",
      bows: "Bows",
      items: "Items",
      mounts: "Mount",
      mountGear: "Mount Gear",
    }[category] ?? category;
  }

  formatStat(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  }

  formatRarity(rarity = "common") {
    return `${rarity.slice(0, 1).toUpperCase()}${rarity.slice(1)}${rarity === "legendary" ? " • Legendary hook" : ""}`;
  }

  formatRarity(rarity = "common") {
    const visual = RARITY_VISUALS[rarity] ?? RARITY_VISUALS.common;
    return `${visual.label}${rarity === "legendary" ? " • Legendary signature" : ""}`;
  }

  getVisualColor(item) {
    if (!item) {
      return RARITY_VISUALS.common.color;
    }
    if (this.activeCategory === "bows") {
      return BOW_VISUALS[item.id]?.accent ?? RARITY_VISUALS[item.rarity ?? "common"]?.color ?? RARITY_VISUALS.common.color;
    }
    return RARITY_VISUALS[item.rarity ?? "common"]?.color ?? RARITY_VISUALS.common.color;
  }

  showToast(text) {
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
  }

  playUiClick() {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.58 },
    }));
  }
}
