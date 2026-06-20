import { SETTINGS } from "../config/settings.js";

export const UPGRADE_DEFINITIONS = [
  {
    id: "faster-draw",
    name: "Faster Draw",
    description: "Draw the bow faster.",
    maxRank: 5,
    apply: ({ archery }, rank) => {
      archery.stats.drawSpeedMultiplier = 1 + rank * 0.14;
    },
  },
  {
    id: "stronger-arrows",
    name: "Stronger Arrows",
    description: "Arrows deal more damage.",
    maxRank: 5,
    apply: ({ archery }, rank) => {
      archery.stats.damageMultiplier = 1 + rank * 0.18;
    },
  },
  {
    id: "more-stamina",
    name: "More Stamina",
    description: "Increase stamina capacity.",
    maxRank: 4,
    apply: ({ player }, rank) => {
      player.stats.staminaMax = SETTINGS.player.stamina + rank * 18;
    },
  },
  {
    id: "steadier-aim",
    name: "Steadier Aim",
    description: "Reduce natural bow drift.",
    maxRank: 4,
    apply: ({ archery }, rank) => {
      archery.stats.steadiness = Math.min(0.85, rank * 0.18);
    },
  },
];

export const GEAR_UPGRADE_HOOKS = {
  bowTiers: [
    { id: "starter-bow", name: "Starter Bow", damageMultiplier: 1, drawSpeedMultiplier: 1 },
    { id: "hunter-bow", name: "Hunter Bow", damageMultiplier: 1.14, drawSpeedMultiplier: 1.06 },
    { id: "elderwood-bow", name: "Elderwood Bow", damageMultiplier: 1.28, drawSpeedMultiplier: 1.1 },
  ],
  arrowTypes: [
    { id: "field-arrow", name: "Field Arrow", gravityMultiplier: 1, damageMultiplier: 1 },
    { id: "piercing-arrow", name: "Piercing Arrow", gravityMultiplier: 1.04, damageMultiplier: 1.18 },
  ],
  statChannels: ["damageMultiplier", "drawSpeedMultiplier", "staminaMax", "steadiness"],
};

export class ProgressionSystem {
  constructor(ui, systems) {
    this.ui = ui;
    this.systems = systems;
    this.level = 1;
    this.xp = 0;
    this.upgradePoints = 0;
    this.upgradeRanks = Object.fromEntries(UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, 0]));
    this.menuOpen = false;
    this.renderUpgradeMenu();
    this.applyUpgrades();
    this.updateUi();
  }

  update(input) {
    if (input.wasPressed("KeyU")) {
      this.toggleMenu();
    }
  }

  addXp(amount) {
    const gained = Math.max(0, Math.round(amount));
    this.xp += amount;
    while (this.xp >= this.getXpToNextLevel()) {
      this.xp -= this.getXpToNextLevel();
      this.level += 1;
      this.upgradePoints += 1;
      this.showToast(`Level ${this.level} reached`);
      window.dispatchEvent(new CustomEvent("echo-archer:level-up", {
        detail: { level: this.level },
      }));
    }
    this.updateUi();
    this.renderUpgradeMenu();
    if (gained > 0) {
      this.pulseXp(gained);
    }
  }

  awardTarget(score) {
    this.addXp(score.bullseye ? SETTINGS.progression.rewards.bullseye : SETTINGS.progression.rewards.target);
  }

  awardEnemy(type) {
    this.addXp(SETTINGS.progression.rewards[type] ?? 40);
  }

  awardBoss(type) {
    this.addXp(SETTINGS.progression.rewards[type] ?? 100);
    this.upgradePoints += 1;
    const messages = {
      icefang: "Icefang's trail falls silent. Frostbite is earned.",
      stormtalon: "Stormtalon falls. Tidepiercer is earned.",
      rootGuardian: "The Root Guardian rests. Whisperwind is earned.",
      mirejaw: "Mirejaw sinks beneath Blackwater. Bogpiercer is earned.",
      stonehorn: "Stonehorn breaks. Sunpiercer is earned.",
      infernoBehemoth: "The Inferno Behemoth falls. Infernoheart is earned.",
      astralGuardian: "The Astral Guardian quiets. Starpiercer is earned.",
      ironhorn: "Ironhorn falls. Windrunner is earned.",
      firstSentinel: "The First Sentinel yields. Kingmaker is earned.",
      skyboundWarden: "The Skybound Warden falls. Voidstar is earned.",
      tideboundWarden: "The Tidebound Warden sinks. Stormcaller is earned.",
      ancientGrovekeeper: "The Ancient Grovekeeper rests. Whisperbranch is earned.",
      barkhideStalker: "The path beyond the watchtower feels safer now.",
    };
    this.showToast(messages[type] ?? "A dangerous guardian has fallen.");
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: {
        name: type === "barkhideStalker" ? "Barkhide Trophy Crest" : type === "icefang" ? "Frostbite Bow Writ" : type === "stormtalon" ? "Tidepiercer Bow Writ" : type === "rootGuardian" ? "Whisperwind Bow Writ" : type === "mirejaw" ? "Bogpiercer Bow Writ" : type === "stonehorn" ? "Sunpiercer Bow Writ" : type === "infernoBehemoth" ? "Infernoheart Bow Writ" : type === "astralGuardian" ? "Starpiercer Bow Writ" : type === "ironhorn" ? "Windrunner Bow Writ" : type === "firstSentinel" ? "Kingmaker Bow Writ" : type === "skyboundWarden" ? "Voidstar Bow Writ" : type === "tideboundWarden" ? "Stormcaller Bow Writ" : type === "ancientGrovekeeper" ? "Whisperbranch Bow Writ" : "Boss Trophy",
        rarity: type === "icefang" || type === "stormtalon" || type === "rootGuardian" || type === "mirejaw" || type === "stonehorn" || type === "infernoBehemoth" || type === "astralGuardian" || type === "ironhorn" || type === "firstSentinel" || type === "skyboundWarden" || type === "tideboundWarden" || type === "ancientGrovekeeper" ? "legendary" : "epic",
        text: "A future boss reward hook for crafting and achievements.",
      },
    }));
    this.updateUi();
    this.renderUpgradeMenu();
  }

  awardExplorationChallenge(id, label) {
    this.addXp(SETTINGS.progression.rewards[id] ?? 60);
    this.showToast(`${label} challenge complete`);
  }

  awardQuest(reward) {
    const xp = reward?.xp ?? 0;
    const upgradePoints = reward?.upgradePoints ?? 0;
    if (xp > 0) {
      this.addXp(xp);
    }
    if (upgradePoints > 0) {
      this.upgradePoints += upgradePoints;
    }
    this.showToast(reward?.message ?? "Quest reward earned");
    this.updateUi();
    this.renderUpgradeMenu();
  }

  buyUpgrade(id) {
    const upgrade = UPGRADE_DEFINITIONS.find((item) => item.id === id);
    if (!upgrade || this.upgradePoints <= 0 || this.upgradeRanks[id] >= upgrade.maxRank) {
      return;
    }

    this.upgradePoints -= 1;
    this.upgradeRanks[id] += 1;
    this.applyUpgrades();
    this.updateUi();
    this.renderUpgradeMenu();
    this.playUiClick();
  }

  applyUpgrades() {
    this.systems.archery.stats.drawSpeedMultiplier = 1;
    this.systems.archery.stats.damageMultiplier = 1;
    this.systems.archery.stats.steadiness = 0;
    this.systems.player.stats.staminaMax = SETTINGS.player.stamina;

    UPGRADE_DEFINITIONS.forEach((upgrade) => {
      upgrade.apply(this.systems, this.upgradeRanks[upgrade.id]);
    });
  }

  getXpToNextLevel() {
    return SETTINGS.progression.baseXpToLevel + (this.level - 1) * SETTINGS.progression.xpGrowth;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.ui.menu.classList.toggle("visible", this.menuOpen);
    this.playUiClick();
  }

  updateUi() {
    this.ui.level.textContent = `Lv ${this.level}`;
    this.ui.xp.textContent = `XP ${this.xp}/${this.getXpToNextLevel()}`;
    this.ui.points.textContent = `${this.upgradePoints} point${this.upgradePoints === 1 ? "" : "s"}`;
  }

  renderUpgradeMenu() {
    this.ui.list.innerHTML = "";
    UPGRADE_DEFINITIONS.forEach((upgrade) => {
      const rank = this.upgradeRanks[upgrade.id];
      const button = document.createElement("button");
      button.className = "upgrade-option";
      button.disabled = this.upgradePoints <= 0 || rank >= upgrade.maxRank;
      button.innerHTML = `
        <span>
          <strong>${upgrade.name}</strong>
          <small>${upgrade.description}</small>
        </span>
        <em>${rank}/${upgrade.maxRank}</em>
      `;
      button.addEventListener("click", () => this.buyUpgrade(upgrade.id));
      this.ui.list.appendChild(button);
    });
    this.updateUi();
  }

  showToast(text) {
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
  }

  playUiClick() {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.65 },
    }));
  }

  pulseXp(amount) {
    this.ui.xp.classList.remove("xp-pulse");
    void this.ui.xp.offsetWidth;
    this.ui.xp.classList.add("xp-pulse");
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text: `+${amount} XP`,
        kind: "xp",
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.18,
      },
    }));
  }
}
