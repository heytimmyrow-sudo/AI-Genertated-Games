export const RARITY = {
  common: { label: "Common", color: "#d8d3bd" },
  rare: { label: "Rare", color: "#82c8ff" },
  epic: { label: "Epic", color: "#c79cff" },
  legendary: { label: "Legendary", color: "#ffd166" },
};

export const SKILL_TREE = {
  archer: {
    name: "Archer",
    description: "Damage, precision, range, and bow speed.",
    skills: [
      { id: "stronger-arrows", name: "Stronger Arrows", maxRank: 4, cost: 1, description: "+8% arrow damage per rank.", effects: { damageMultiplier: 0.08 } },
      { id: "faster-draw", name: "Faster Draw", maxRank: 4, cost: 1, requires: "stronger-arrows", description: "+7% draw speed per rank.", effects: { drawSpeedMultiplier: 0.07 } },
      { id: "critical-eye", name: "Critical Eye", maxRank: 3, cost: 1, requires: "faster-draw", description: "+5% critical chance per rank.", effects: { critChance: 0.05 } },
      { id: "longer-range", name: "Longer Range", maxRank: 3, cost: 1, requires: "critical-eye", description: "+8% arrow range per rank.", effects: { rangeMultiplier: 0.08 } },
    ],
  },
  explorer: {
    name: "Explorer",
    description: "Travel, stamina, discoveries, and tracking.",
    skills: [
      { id: "trail-stamina", name: "Trail Stamina", maxRank: 4, cost: 1, description: "+10 stamina per rank.", effects: { staminaMax: 10 } },
      { id: "swift-paths", name: "Swift Paths", maxRank: 3, cost: 1, requires: "trail-stamina", description: "+4% movement speed per rank.", effects: { movementSpeedMultiplier: 0.04 } },
      { id: "keen-discovery", name: "Keen Discovery", maxRank: 3, cost: 1, requires: "swift-paths", description: "+10% discovery rewards per rank.", effects: { discoveryRewardMultiplier: 0.1 } },
      { id: "better-tracking", name: "Better Tracking", maxRank: 2, cost: 1, requires: "keen-discovery", description: "Future tracking bonuses and clearer reward instincts.", effects: { tracking: 1 } },
    ],
  },
  survivor: {
    name: "Survivor",
    description: "Health, defense, resistance, and recovery.",
    skills: [
      { id: "hardy-frame", name: "Hardy Frame", maxRank: 4, cost: 1, description: "+12 health per rank.", effects: { healthMax: 12 } },
      { id: "weathered-guard", name: "Weathered Guard", maxRank: 3, cost: 1, requires: "hardy-frame", description: "+6% defense per rank.", effects: { defense: 0.06 } },
      { id: "natural-resist", name: "Natural Resist", maxRank: 3, cost: 1, requires: "weathered-guard", description: "Reduces future weather and environment penalties.", effects: { environmentalResistance: 0.12 } },
      { id: "field-recovery", name: "Field Recovery", maxRank: 2, cost: 1, requires: "natural-resist", description: "+12% recovery per rank.", effects: { recoveryMultiplier: 0.12 } },
    ],
  },
};

export const LEGENDARY_BOWS = [
  { id: "stormcaller", name: "Stormcaller", rarity: "legendary", theme: "Storm Wind", hint: "Shattered Coast records say Stormcaller answers restored beacons and a defeated Tidebound Warden.", stats: { power: 1.42, drawSpeed: 1.06, range: 1.24, accuracy: 0.12 }, effect: "Future storm shots can reward wind-aware precision and beacon-linked weak-point hits." },
  { id: "frostbite", name: "Frostbite", rarity: "legendary", theme: "Ice", hint: "Stillwater Temple carvings mention a bow that remembers winter.", stats: { power: 1.3, drawSpeed: 1.02, range: 1.16, accuracy: 0.18 }, effect: "Strengthens ice arrow slow effects." },
  { id: "sunpiercer", name: "Sunpiercer", rarity: "legendary", theme: "Extreme Range", hint: "Red Canyon journals say Sunpiercer wakes only after the far Echo Targets answer.", stats: { power: 1.42, drawSpeed: 0.94, range: 1.5, accuracy: 0.24 }, effect: "Greatly improves long-range precision and future sun-shot effects." },
  { id: "whisperwind", name: "Whisperwind", rarity: "legendary", theme: "Speed", hint: "Old hunters say it can be heard before it is seen.", stats: { power: 1.22, drawSpeed: 1.34, range: 1.1, accuracy: 0.16 }, effect: "Greatly improves fast draw builds." },
  { id: "tidepiercer", name: "Tidepiercer", rarity: "legendary", theme: "Ocean Wind", hint: "Shipwreck Cove and the Sea Cave Shrine describe a bow that ignores distance when the wind is understood.", stats: { power: 1.34, drawSpeed: 1.08, range: 1.42, accuracy: 0.2 }, effect: "Future coastal shots can pierce wind and reward long-range precision." },
  { id: "bogpiercer", name: "Bogpiercer", rarity: "legendary", theme: "Fog Precision", hint: "Blackwater carvings speak of a bow that finds clean lines through fog and mire.", stats: { power: 1.36, drawSpeed: 1.0, range: 1.34, accuracy: 0.24 }, effect: "Future swamp shots can ignore fog penalties and reward precise weak-point hits." },
  { id: "infernoheart", name: "Infernoheart", rarity: "legendary", theme: "Volcanic Power", hint: "Ashen tablets say Infernoheart answers mechanisms, fire trials, and a behemoth's fall.", stats: { power: 1.62, drawSpeed: 0.88, range: 1.24, accuracy: 0.08 }, effect: "Future fire shots can hit harder and trigger destructive volcanic effects." },
  { id: "starpiercer", name: "Starpiercer", rarity: "legendary", theme: "Celestial Precision", hint: "Starfall Vale observatory records describe a bow that answers only completed celestial mechanisms.", stats: { power: 1.55, drawSpeed: 1.08, range: 1.48, accuracy: 0.28 }, effect: "Future Master Archer trials can reward perfect long-range celestial shots." },
  { id: "windrunner", name: "Windrunner", rarity: "legendary", theme: "Frontier Mobility", hint: "Frontier tracks say Windrunner belongs to archers who read old roads and defeat Ironhorn.", stats: { power: 1.38, drawSpeed: 1.24, range: 1.36, accuracy: 0.24 }, effect: "Future Arc 2 builds can reward precise shots while moving." },
  { id: "kingmaker", name: "Kingmaker", rarity: "legendary", theme: "Royal Stability", hint: "Lost Kingdom records say Kingmaker waits behind restored mechanisms and the First Sentinel.", stats: { power: 1.6, drawSpeed: 0.98, range: 1.44, accuracy: 0.32 }, effect: "Future Arc 2 mastery builds can reward steady weak-point shots and royal mechanism puzzles." },
  { id: "voidstar", name: "Voidstar", rarity: "legendary", theme: "Celestial Mastery", hint: "First Sky records say Voidstar answers only restored relays and a defeated Skybound Warden.", stats: { power: 1.66, drawSpeed: 1.04, range: 1.58, accuracy: 0.34 }, effect: "Future celestial builds can reward perfect relay shots and void-marked weak points." },
  { id: "whisperbranch", name: "Whisperbranch", rarity: "legendary", theme: "Stealth Precision", hint: "Veiled Wilds clues say Whisperbranch waits for archers who uncover hidden trails and wake the Grovekeeper.", stats: { power: 1.44, drawSpeed: 1.18, range: 1.38, accuracy: 0.3 }, effect: "Future stealth builds can reward patient shots, hidden-route discovery, and quiet weak-point hits." },
];

export const GEAR_SETS = {
  hunter: { name: "Hunter Set", pieces: ["hunter-outfit"], bonus: { steadiness: 0.06 }, description: "Cleaner aim against forest threats." },
  explorer: { name: "Explorer Set", pieces: ["traveler-outfit"], bonus: { staminaRecoveryMultiplier: 0.12, movementSpeedMultiplier: 0.03 }, description: "Longer travel, faster route reading." },
  guildRanger: { name: "Guild Ranger Set", pieces: ["guild-ranger-outfit"], bonus: { drawSpeedMultiplier: 0.08, reputationRewardMultiplier: 0.08 }, description: "Guild discipline turns practice into rank." },
  ancientArcher: { name: "Ancient Archer Set", pieces: ["ancient-archer-outfit"], bonus: { damageMultiplier: 0.1, rangeMultiplier: 0.08 }, description: "Old temple craft favors powerful shots." },
  masterArcher: { name: "Master Archer Set", pieces: ["master-archer-regalia"], bonus: { damageMultiplier: 0.08, drawSpeedMultiplier: 0.08, reputationRewardMultiplier: 0.12 }, description: "Prestige gear earned by completing the Arc 1 trials." },
};

const STORAGE_KEY = "echo-archer-rpg-progression-v1";

export class RPGProgressionSystem {
  constructor(ui, systems) {
    this.ui = ui;
    this.systems = systems;
    this.skillPoints = 1;
    this.skillRanks = {};
    this.openScreen = null;
    this.unlockedLegendaries = new Set();
    this.unlockedLoot = [];
    this.buildName = "Balanced Ranger";
    this.load();
    this.bindEvents();
    this.renderAll();
    this.applyBonuses();
  }

  bindEvents() {
    window.addEventListener("echo-archer:level-up", () => {
      this.skillPoints += 1;
      this.showToast("+1 Skill Point");
      this.renderAll();
      this.save();
    });

    window.addEventListener("echo-archer:rare-loot", (event) => {
      this.addLoot(event.detail);
    });
  }

  update(input) {
    if (input.wasPressed("KeyK")) {
      this.toggleScreen("skills");
    }
    if (input.wasPressed("KeyO")) {
      this.toggleScreen("stats");
    }
    if (input.wasPressed("KeyN")) {
      this.toggleScreen("mounts");
    }
    if (input.wasPressed("Escape") && this.openScreen) {
      this.closeScreens();
    }
  }

  toggleScreen(screen) {
    this.openScreen = this.openScreen === screen ? null : screen;
    this.renderAll();
    if (this.openScreen && document.pointerLockElement) {
      document.exitPointerLock();
    }
    document.body.classList.toggle("rpg-open", Boolean(this.openScreen));
    this.playUiClick();
  }

  closeScreens() {
    this.openScreen = null;
    document.body.classList.remove("rpg-open");
    this.renderAll();
    this.playUiClick();
  }

  buySkill(branchId, skillId) {
    const skill = SKILL_TREE[branchId]?.skills.find((item) => item.id === skillId);
    if (!skill || !this.canBuySkill(branchId, skill)) {
      return;
    }
    this.skillPoints -= skill.cost;
    this.skillRanks[skill.id] = (this.skillRanks[skill.id] ?? 0) + 1;
    this.updateBuildName();
    this.applyBonuses();
    this.renderAll();
    this.save();
    this.playUiClick();
  }

  canBuySkill(branchId, skill) {
    const currentRank = this.skillRanks[skill.id] ?? 0;
    const hasRequirement = !skill.requires || (this.skillRanks[skill.requires] ?? 0) > 0;
    return currentRank < skill.maxRank && this.skillPoints >= skill.cost && hasRequirement && Boolean(SKILL_TREE[branchId]);
  }

  getSkillEffects() {
    const effects = {};
    Object.values(SKILL_TREE).forEach((branch) => {
      branch.skills.forEach((skill) => {
        const rank = this.skillRanks[skill.id] ?? 0;
        Object.entries(skill.effects).forEach(([key, value]) => {
          effects[key] = (effects[key] ?? 0) + value * rank;
        });
      });
    });
    return effects;
  }

  getGearSetEffects() {
    const equippedIds = Object.values(this.systems.inventory.equipped).filter(Boolean);
    const activeSets = [];
    const effects = {};
    Object.values(GEAR_SETS).forEach((set) => {
      const active = set.pieces.every((piece) => equippedIds.includes(piece));
      if (!active) {
        return;
      }
      activeSets.push(set.name);
      Object.entries(set.bonus).forEach(([key, value]) => {
        effects[key] = (effects[key] ?? 0) + value;
      });
    });
    return { effects, activeSets };
  }

  applyBonuses() {
    const skillEffects = this.getSkillEffects();
    const { effects: setEffects } = this.getGearSetEffects();
    const rpgModifiers = {
      damageMultiplier: 1 + (skillEffects.damageMultiplier ?? 0) + (setEffects.damageMultiplier ?? 0),
      drawSpeedMultiplier: 1 + (skillEffects.drawSpeedMultiplier ?? 0) + (setEffects.drawSpeedMultiplier ?? 0),
      rangeMultiplier: 1 + (skillEffects.rangeMultiplier ?? 0) + (setEffects.rangeMultiplier ?? 0),
      steadiness: setEffects.steadiness ?? 0,
      critChance: skillEffects.critChance ?? 0,
    };
    const playerModifiers = {
      staminaMaxBonus: skillEffects.staminaMax ?? 0,
      movementSpeedMultiplier: 1 + (skillEffects.movementSpeedMultiplier ?? 0) + (setEffects.movementSpeedMultiplier ?? 0),
      staminaRecoveryMultiplier: 1 + (setEffects.staminaRecoveryMultiplier ?? 0),
      healthMaxBonus: skillEffects.healthMax ?? 0,
      defense: skillEffects.defense ?? 0,
      environmentalResistance: skillEffects.environmentalResistance ?? 0,
      recoveryMultiplier: 1 + (skillEffects.recoveryMultiplier ?? 0),
      discoveryRewardMultiplier: 1 + (skillEffects.discoveryRewardMultiplier ?? 0),
      reputationRewardMultiplier: 1 + (setEffects.reputationRewardMultiplier ?? 0),
    };
    this.systems.archery.setRpgModifiers?.(rpgModifiers);
    this.systems.player.setRpgModifiers?.(playerModifiers);
  }

  addLoot(detail = {}) {
    const rarity = detail.rarity ?? "rare";
    const name = detail.name ?? "Rare Cache";
    this.unlockedLoot.unshift({ id: `${Date.now()}-${name}`, name, rarity, text: detail.text ?? "A useful reward for later systems." });
    this.unlockedLoot = this.unlockedLoot.slice(0, 12);
    if (detail.category && detail.itemId) {
      this.systems.inventory.addItem(detail.category, detail.itemId);
    }
    this.showToast(`${RARITY[rarity]?.label ?? "Rare"} loot: ${name}`);
    this.renderAll();
    this.save();
  }

  unlockLegendary(id) {
    if (this.unlockedLegendaries.has(id)) {
      return;
    }
    const bow = LEGENDARY_BOWS.find((item) => item.id === id);
    if (!bow) {
      return;
    }
    this.unlockedLegendaries.add(id);
    this.addLoot({ name: bow.name, rarity: "legendary", category: "bows", itemId: id, text: bow.effect });
  }

  updateBuildName() {
    const branchTotals = Object.fromEntries(Object.entries(SKILL_TREE).map(([branchId, branch]) => [
      branchId,
      branch.skills.reduce((total, skill) => total + (this.skillRanks[skill.id] ?? 0), 0),
    ]));
    const [bestBranch, bestTotal] = Object.entries(branchTotals).sort((a, b) => b[1] - a[1])[0];
    this.buildName = bestTotal < 3
      ? "Balanced Ranger"
      : ({ archer: "Sharpshooter", explorer: "Explorer", survivor: "Survivor" }[bestBranch] ?? "Balanced Ranger");
  }

  renderAll() {
    this.ui.skills.classList.toggle("visible", this.openScreen === "skills");
    this.ui.stats.classList.toggle("visible", this.openScreen === "stats");
    this.ui.mounts.classList.toggle("visible", this.openScreen === "mounts");
    this.renderSkills();
    this.renderStats();
    this.renderMounts();
  }

  renderSkills() {
    this.ui.skillPoints.textContent = `${this.skillPoints} point${this.skillPoints === 1 ? "" : "s"}`;
    this.ui.skillTree.innerHTML = "";
    Object.entries(SKILL_TREE).forEach(([branchId, branch]) => {
      const branchElement = document.createElement("section");
      branchElement.className = "skill-branch";
      branchElement.innerHTML = `<h3>${branch.name}</h3><p>${branch.description}</p>`;
      branch.skills.forEach((skill) => {
        const rank = this.skillRanks[skill.id] ?? 0;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "skill-node";
        button.disabled = !this.canBuySkill(branchId, skill);
        button.innerHTML = `
          <strong>${skill.name}</strong>
          <span>${skill.description}</span>
          <em>${rank}/${skill.maxRank}${skill.requires ? ` • requires ${skill.requires.replaceAll("-", " ")}` : ""}</em>
        `;
        button.addEventListener("click", () => this.buySkill(branchId, skill.id));
        branchElement.appendChild(button);
      });
      this.ui.skillTree.appendChild(branchElement);
    });
  }

  renderStats() {
    const skillEffects = this.getSkillEffects();
    const { activeSets } = this.getGearSetEffects();
    const bow = this.systems.inventory.getEquipped("bows");
    const mountPlan = this.systems.mounts?.getSpawnPlan?.();
    this.ui.statsBody.innerHTML = `
      <article><strong>Build</strong><span>${this.buildName}</span></article>
      <article><strong>Equipped Bow</strong><span>${bow?.name ?? "None"}</span></article>
      <article><strong>Active Gear Sets</strong><span>${activeSets.join(", ") || "None"}</span></article>
      <article><strong>Critical Chance</strong><span>${Math.round((skillEffects.critChance ?? 0) * 100)}%</span></article>
      <article><strong>Discovery Bonus</strong><span>${Math.round((skillEffects.discoveryRewardMultiplier ?? 0) * 100)}%</span></article>
      <article><strong>Mount Ready</strong><span>${mountPlan?.ready ? mountPlan.mount : "No mount equipped"}</span></article>
      <article><strong>Recent Rare Loot</strong><span>${this.unlockedLoot[0]?.name ?? "None yet"}</span></article>
    `;
  }

  renderMounts() {
    const plan = this.systems.mounts?.getSpawnPlan?.();
    this.ui.mountBody.innerHTML = `
      <article><strong>Equipped Mount</strong><span>${plan?.mount ?? "No Mount"}</span></article>
      <article><strong>Mount Gear</strong><span>${plan?.equipment ?? "None"}</span></article>
      <article><strong>Controls</strong><span>N opens this screen. Press R during gameplay to summon/ride.</span></article>
      <article><strong>Status</strong><span>${this.systems.mounts?.riding ? "Riding" : plan?.ready ? "Ready at stable" : "Equip a mount first"}</span></article>
    `;
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

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.skillPoints = Number.isFinite(saved.skillPoints) ? saved.skillPoints : this.skillPoints;
      this.skillRanks = saved.skillRanks ?? {};
      this.unlockedLoot = Array.isArray(saved.unlockedLoot) ? saved.unlockedLoot : [];
      this.unlockedLegendaries = new Set(Array.isArray(saved.unlockedLegendaries) ? saved.unlockedLegendaries : []);
      this.buildName = saved.buildName ?? this.buildName;
    } catch (error) {
      console.warn("RPG progression save ignored:", error);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      skillPoints: this.skillPoints,
      skillRanks: this.skillRanks,
      unlockedLoot: this.unlockedLoot,
      unlockedLegendaries: [...this.unlockedLegendaries],
      buildName: this.buildName,
    }));
  }
}
