import { NPC } from "../entities/NPC.js";
import { GEAR_DEFINITIONS } from "./InventorySystem.js";

const { THREE } = window;

export const GUILD_RANKS = [
  { id: "novice", name: "Novice Archer", reputation: 0 },
  { id: "apprentice", name: "Apprentice Archer", reputation: 120 },
  { id: "ranger", name: "Ranger", reputation: 320 },
  { id: "master", name: "Master Archer", reputation: 680 },
];

export const SHOP_DEFINITIONS = {
  bowShop: {
    title: "Lysa's Bow Shop",
    keeper: "Lysa",
    description: "Bows, field arrows, and temple-ready fletching.",
    items: [
      { id: "hunter-bow", category: "bows", price: 90, sell: 34, minRank: "novice" },
      { id: "longbow", category: "bows", price: 165, sell: 62, minRank: "apprentice" },
      { id: "ancient-bow", category: "bows", price: 280, sell: 96, minRank: "ranger" },
      { id: "whisperwind", category: "bows", price: 520, sell: 180, minRank: "master" },
      { id: "stormcaller", category: "bows", price: 620, sell: 220, minRank: "master" },
      { id: "fire-arrow-bundle", category: "items", price: 36, sell: 10, minRank: "novice" },
      { id: "ice-arrow-bundle", category: "items", price: 44, sell: 12, minRank: "apprentice" },
      { id: "explosive-arrow-bundle", category: "items", price: 70, sell: 18, minRank: "ranger" },
    ],
  },
  equipmentShop: {
    title: "Quartermaster Stores",
    keeper: "Bram",
    description: "Outfits, shields, supplies, and future field kits.",
    items: [
      { id: "wooden-shield", category: "shields", price: 80, sell: 30, minRank: "novice" },
      { id: "reinforced-shield", category: "shields", price: 190, sell: 72, minRank: "apprentice" },
      { id: "traveler-outfit", category: "outfits", price: 105, sell: 38, minRank: "novice" },
      { id: "hunter-outfit", category: "outfits", price: 125, sell: 45, minRank: "apprentice" },
      { id: "guild-ranger-outfit", category: "outfits", price: 240, sell: 90, minRank: "ranger" },
      { id: "ancient-archer-outfit", category: "outfits", price: 430, sell: 150, minRank: "master" },
      { id: "forest-elk", category: "mounts", price: 360, sell: 120, minRank: "ranger" },
      { id: "guild-supply-token", category: "items", price: 28, sell: 8, minRank: "novice" },
    ],
  },
  blacksmithShop: {
    title: "Orin's Blacksmith",
    keeper: "Orin",
    description: "Weapon frames, shield repairs, and future forging hooks.",
    items: [
      { id: "wooden-sword", category: "weapons", price: 65, sell: 22, minRank: "novice" },
      { id: "short-blade", category: "weapons", price: 115, sell: 42, minRank: "apprentice" },
      { id: "forest-spear", category: "weapons", price: 165, sell: 58, minRank: "ranger" },
      { id: "wooden-shield", category: "shields", price: 80, sell: 30, minRank: "novice" },
      { id: "reinforced-shield", category: "shields", price: 190, sell: 72, minRank: "apprentice" },
    ],
  },
};

export const GUILD_QUESTS = [
  { id: "guild-targets", title: "Guild Target Round", type: "Target Challenge", objective: "Hit 12 total targets", goal: 12, reward: { gold: 80, reputation: 70, xp: 80 } },
  { id: "guild-scouting", title: "Survey the Roads", type: "Exploration Quest", objective: "Discover 8 landmarks or regions", goal: 8, reward: { gold: 95, reputation: 90, xp: 90 } },
  { id: "guild-task", title: "Keep the Roads Clear", type: "Guild Task", objective: "Defeat 5 creatures", goal: 5, reward: { gold: 115, reputation: 110, xp: 110 } },
  { id: "guild-boss-hunt", title: "Watchtower Hunt", type: "Boss Hunt", objective: "Defeat Barkhide Stalker", goal: 1, reward: { gold: 150, reputation: 150, xp: 120 } },
];

export const VILLAGE_JOBS = [
  { id: "village-target-competition", title: "Evening Target Pot", type: "Target Competition", objective: "Hit 8 targets", goal: 8, repeatable: true, reward: { gold: 60, reputation: 35, villageReputation: 45, xp: 55 } },
  { id: "village-hunting-contract", title: "Roadside Hunting Contract", type: "Hunting Contract", objective: "Defeat 4 creatures", goal: 4, repeatable: true, reward: { gold: 85, reputation: 45, villageReputation: 55, xp: 75 } },
  { id: "village-delivery-route", title: "Courier Route", type: "Delivery Job", objective: "Visit 3 regions", goal: 3, repeatable: true, reward: { gold: 50, reputation: 25, villageReputation: 50, xp: 45 } },
  { id: "village-exploration-task", title: "Scout's Sketches", type: "Exploration Task", objective: "Discover 4 new places", goal: 4, repeatable: true, reward: { gold: 70, reputation: 42, villageReputation: 60, xp: 70 } },
  { id: "post-arc-master-range", title: "Master Range Rotation", type: "Repeatable Challenge", objective: "Hit 10 targets after earning Master Archer", goal: 10, repeatable: true, requiresMaster: true, reward: { gold: 120, reputation: 80, villageReputation: 75, xp: 110 } },
  { id: "post-arc-frontier-hunt", title: "Frontier Rumor Hunt", type: "Advanced Guild Hunt", objective: "Defeat 6 creatures after earning Master Archer", goal: 6, repeatable: true, requiresMaster: true, reward: { gold: 155, reputation: 105, villageReputation: 85, xp: 135 } },
  { id: "post-arc-map-reports", title: "Strange Map Reports", type: "Arc 2 Hook", objective: "Visit 4 regions and gather rumors", goal: 4, repeatable: true, requiresMaster: true, reward: { gold: 95, reputation: 90, villageReputation: 80, xp: 100 } },
];

const STORAGE_KEY = "echo-archer-economy-v1";

export class EconomyGuildSystem {
  constructor(scene, world, player, ui, systems) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.systems = systems;
    this.gold = 45;
    this.reputation = 0;
    this.villageReputation = 0;
    this.activeShopId = null;
    this.shopOpen = false;
    this.questBoardOpen = false;
    this.activeGuildQuestIndex = 0;
    this.guildQuests = GUILD_QUESTS.map((quest) => ({ ...quest, progress: 0, complete: false }));
    this.villageJobs = VILLAGE_JOBS.map((job) => ({ ...job, progress: 0, completions: 0 }));
    this.masterArcherUnlocked = false;
    this.discoveryCredits = new Set();
    this.load();
    this.npcs = this.createGuildNpcs();
    this.bindShopUi();
    this.bindMasterArcherEvents();
    this.updateUi();
  }

  createGuildNpcs() {
    const origin = this.world.archersGuild ?? { x: -56, z: 28 };
    const services = this.world.guildVillageServices ?? {};
    const point = (name, fallback) => services[name] ?? new THREE.Vector3(origin.x + fallback[0], 0, origin.z + fallback[1]);
    const home = (index, fallback) => services.homes?.[index] ?? new THREE.Vector3(origin.x + fallback[0], 0, origin.z + fallback[1]);
    return [
      this.makeVillageNpc("guild-master", "dialogue", "Maera", "Guild Master Archer", point("guildHall", [-1.2, -3.6]), home(1, [-4, 12]), { cloak: 0x37543f, hood: 0x24382d, trim: 0xf0c66a, feather: 0xf4dd90, badge: true }, () => this.getGuildMasterLine()),
      this.makeVillageNpc("bowyer", "shop", "Lysa", "Bowyer Archer", point("bowyer", [8, -1]), home(2, [8, 12]), { cloak: 0x775536, hood: 0x3d5542, staff: 0xb47c42, trim: 0xe8b85b, feather: 0xffd890 }, () => "Strings, arrows, and patience. That is most of archery.", "bowShop"),
      this.makeVillageNpc("quartermaster", "shop", "Bram", "Quartermaster", point("market", [3, 3]), home(0, [-14, 10]), { cloak: 0x554333, hood: 0x2f3c3f, staff: 0x8f6035, trim: 0xd9a14f, badge: true }, () => "Good equipment does not brag. It holds.", "equipmentShop"),
      this.makeVillageNpc("explorer", "dialogue", "Tavi", "Explorer", point("questBoard", [-1, 6]), home(1, [-4, 12]), { cloak: 0x52613d, hood: 0x475f52, staff: 0x94704d, trim: 0xbfd27a, feather: 0xdde38a }, () => "Every road bends toward a secret if you stop charging down it."),
      this.makeVillageNpc("blacksmith", "blacksmith", "Orin", "Blacksmith", point("blacksmith", [-10, -1]), home(0, [-14, 10]), { cloak: 0x5c3b2b, hood: 0x2f2d29, staff: 0x6f4a2a, trim: 0xff8a3d, badge: true }, () => "I can oil, tighten, and prepare your kit. Real forging comes later.", "blacksmithShop"),
      this.makeVillageNpc("innkeeper", "inn", "Sella", "Innkeeper", point("inn", [-8, 6]), home(1, [-4, 12]), { cloak: 0x8b6844, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffc579 }, () => "A warm bed clears more mistakes than pride does."),
      this.makeVillageNpc("stable-master", "dialogue", "Fen", "Stable Master", point("stable", [12, 6]), home(2, [8, 12]), { cloak: 0x5f5134, hood: 0x31483c, staff: 0x8f6035, trim: 0xbfd27a }, () => "Mounts need calm hands. The village stable is ready for future breeds."),
      this.makeVillageNpc("merchant", "shop", "Nima", "Merchant", point("market", [5, 6]), home(3, [16, 3]), { cloak: 0x6b4a74, hood: 0x2f3c3f, staff: 0xa87543, trim: 0xe6b75d }, () => "Coin moves faster when the roads are safe.", "equipmentShop"),
      this.makeVillageNpc("hunter", "dialogue", "Corin", "Hunter", point("questBoard", [-1, 6]), home(3, [16, 3]), { cloak: 0x475f32, hood: 0x293d2d, staff: 0x6f4a2a, trim: 0xd0a15d, feather: 0xcfffc2 }, () => "The board has contracts, but the forest has the truth."),
      this.makeVillageNpc("farmer", "dialogue", "Elsie", "Farmer", point("market", [5, 6]), home(0, [-14, 10]), { cloak: 0x7a6b3f, hood: 0x4d5f35, staff: 0x94704d, trim: 0xe8bc66 }, () => "If the roads stay clear, the gardens feed everyone."),
      this.makeVillageNpc("traveler", "dialogue", "Padrig", "Traveler", point("inn", [-8, 6]), home(1, [-4, 12]), { cloak: 0x4d5966, hood: 0x2d3644, staff: 0x9a6d3d, trim: 0x82c8ff }, () => "A village like this becomes a compass point."),
      this.makeVillageNpc("guild-recruit", "dialogue", "Rune", "Guild Recruit Archer", point("guildHall", [0, -2]), home(2, [8, 12]), { cloak: 0x355f42, hood: 0x223f33, staff: 0x9b6838, trim: 0xf0c66a, feather: 0xf0c66a }, () => "I practice until my arms shake. Then I listen to why I missed."),
    ];
  }

  makeVillageNpc(id, kind, name, role, workPoint, homePoint, appearance, line, shopId = null) {
    const schedule = {
      morning: this.offsetPoint(workPoint, -0.8, 0.7),
      day: workPoint,
      evening: this.world.guildVillageServices?.square ?? workPoint,
      night: homePoint,
    };
    return {
      id,
      kind,
      shopId,
      schedule,
      npc: new NPC(this.scene, this.world, {
        name,
        role,
        position: [schedule.day.x, schedule.day.z],
        interactRadius: 4,
        appearance,
      }),
      line,
    };
  }

  offsetPoint(point, x, z) {
    return new THREE.Vector3(point.x + x, 0, point.z + z);
  }

  bindShopUi() {
    this.ui.close?.addEventListener("click", () => this.closeShop());
    this.ui.sell?.addEventListener("click", () => this.sellSelected());
    this.ui.questBoard?.close?.addEventListener("click", () => this.closeQuestBoard());
  }

  bindMasterArcherEvents() {
    window.addEventListener("echo-archer:master-archer-complete", () => {
      if (this.masterArcherUnlocked) {
        return;
      }
      this.masterArcherUnlocked = true;
      this.addGold(240, "Master Archer ceremony purse");
      this.addReputation(260, "Master Archer recognition");
      this.addVillageReputation(180, "Village celebration");
      this.showToast("Advanced guild hunts unlocked");
      this.save();
      if (this.questBoardOpen) {
        this.renderQuestBoard();
      }
    });
  }

  update(deltaSeconds, input) {
    this.updateNpcSchedules(deltaSeconds);
    this.npcs.forEach(({ npc }) => npc.update(this.player));
    this.trackDiscoveryCredit();
    if (this.shopOpen || this.questBoardOpen) {
      if (input.wasPressed("Escape") || input.wasPressed("KeyI")) {
        this.closeShop();
        this.closeQuestBoard();
      }
      return;
    }

    const nearby = this.getNearbyNpc();
    if (!nearby) {
      return;
    }

    this.ui.prompt.textContent = this.getPromptForInteraction(nearby);
    this.ui.prompt.classList.add("visible");

    if (input.wasPressed("KeyE")) {
      this.showDialogue(nearby.npc.name, nearby.line());
      if (nearby.kind === "shop") {
        this.openShop(nearby.shopId);
      } else if (nearby.kind === "blacksmith") {
        this.repairEquipment();
        this.openShop(nearby.shopId);
      } else if (nearby.kind === "inn") {
        this.rentRoom();
      } else if (nearby.kind === "questBoard") {
        this.openQuestBoard();
      }
    }
  }

  getNearbyNpc() {
    const npc = this.npcs.find(({ npc }) => npc.isPlayerNear(this.player));
    if (npc) {
      return npc;
    }
    const board = this.world.guildVillageServices?.questBoard;
    if (board && this.player.group.position.distanceTo(board) <= 4.2) {
      return {
        id: "quest-board",
        kind: "questBoard",
        npc: { name: "Quest Board", isPlayerNear: () => true },
        line: () => "Village work is posted here. Pick a task, help the hub, earn your keep.",
      };
    }
    return null;
  }

  getPromptForInteraction(interaction) {
    if (interaction.kind === "shop") return "E Shop";
    if (interaction.kind === "blacksmith") return "E Repair / Smith";
    if (interaction.kind === "inn") return "E Rent Room";
    if (interaction.kind === "questBoard") return "E Jobs";
    return "E Talk";
  }

  updateNpcSchedules(deltaSeconds) {
    const phase = this.getVillageDayPhase();
    const blend = Math.min(1, deltaSeconds * 1.8);
    this.npcs.forEach((entry) => {
      const target = entry.schedule?.[phase];
      if (!target) {
        return;
      }
      entry.npc.moveTo(target.x, target.z, blend);
    });
  }

  getVillageDayPhase() {
    const time = this.world.timeOfDay ?? 0.32;
    if (time >= 0.22 && time < 0.38) return "morning";
    if (time >= 0.38 && time < 0.72) return "day";
    if (time >= 0.72 && time < 0.86) return "evening";
    return "night";
  }

  getGuildMasterLine() {
    const quest = this.getActiveGuildQuest();
    if (!quest) {
      return `${this.getRank().name}. The guild has noticed your work. Better assignments are coming.`;
    }
    return `${quest.type}: ${quest.objective}. Progress ${quest.progress}/${quest.goal}.`;
  }

  getActiveGuildQuest() {
    return this.guildQuests[this.activeGuildQuestIndex] ?? null;
  }

  addGold(amount, reason = "Gold earned") {
    const value = Math.max(0, Math.round(amount));
    if (!value) {
      return;
    }
    this.gold += value;
    this.save();
    this.updateUi();
    this.showToast(`${reason}: +${value} Gold`);
  }

  addReputation(amount, reason = "Guild reputation") {
    const value = Math.max(0, Math.round(amount));
    if (!value) {
      return;
    }
    const previousRank = this.getRank().id;
    this.reputation += value;
    this.save();
    this.updateUi();
    const nextRank = this.getRank();
    this.showToast(`${reason}: +${value} Rep`);
    if (nextRank.id !== previousRank) {
      this.showToast(`Guild rank: ${nextRank.name}`);
      window.dispatchEvent(new CustomEvent("echo-archer:reputation-rank", {
        detail: { id: nextRank.id, name: nextRank.name },
      }));
      window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
        detail: {
          name: `${nextRank.name} Writ`,
          rarity: nextRank.id === "master" ? "legendary" : "rare",
          text: "Guild rank reward hook for future vendors and quests.",
        },
      }));
    }
  }

  addVillageReputation(amount, reason = "Village help") {
    const value = Math.max(0, Math.round(amount));
    if (!value) {
      return;
    }
    this.villageReputation += value;
    this.save();
    this.updateUi();
    this.showToast(`${reason}: +${value} Village Rep`);
  }

  awardTarget(score) {
    if (score?.bullseye) {
      this.addGold(3, "Bullseye purse");
    }
    this.advanceGuildQuest("guild-targets", 1);
    this.advanceGuildQuest("village-target-competition", 1);
    this.advanceGuildQuest("post-arc-master-range", 1);
  }

  awardChallenge(id, label) {
    const isTemple = id?.startsWith("shrine");
    this.addGold(isTemple ? 40 : 22, `${isTemple ? "Temple" : label} reward`);
    this.addReputation(isTemple ? 34 : 18, `${isTemple ? "Temple" : label} renown`);
    this.addVillageReputation(isTemple ? 24 : 12, `${label} village tale`);
    if (isTemple) {
      window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
        detail: {
          name: `${label} Relic Thread`,
          rarity: "rare",
          text: "Temple reward hook for legendary bow and armor progression.",
        },
      }));
    }
  }

  awardEnemyDefeat() {
    this.advanceGuildQuest("guild-task", 1);
    this.advanceGuildQuest("village-hunting-contract", 1);
    this.advanceGuildQuest("post-arc-frontier-hunt", 1);
  }

  awardBoss(type) {
    const isAstralGuardian = type === "astralGuardian";
    const isIronhorn = type === "ironhorn";
    const isFirstSentinel = type === "firstSentinel";
    const isSkyboundWarden = type === "skyboundWarden";
    this.addGold(isSkyboundWarden ? 380 : isFirstSentinel ? 320 : isIronhorn ? 260 : isAstralGuardian ? 220 : 125, isSkyboundWarden ? "First Sky bounty" : isFirstSentinel ? "Lost Kingdom royal bounty" : isIronhorn ? "Ironhorn frontier bounty" : isAstralGuardian ? "Astral Guardian bounty" : "Boss bounty");
    this.addReputation(isSkyboundWarden ? 310 : isFirstSentinel ? 260 : isIronhorn ? 220 : isAstralGuardian ? 190 : 110, isSkyboundWarden ? "Celestial Expanse renown" : isFirstSentinel ? "Lost Kingdom renown" : isIronhorn ? "Frontier hunt renown" : isAstralGuardian ? "Celestial hunt renown" : "Boss hunt renown");
    this.addVillageReputation(isSkyboundWarden ? 190 : isFirstSentinel ? 160 : isIronhorn ? 140 : isAstralGuardian ? 120 : 90, isSkyboundWarden ? "First Sky mystery secured" : isFirstSentinel ? "Kingdom secrets secured" : isIronhorn ? "Frontier outpost safety" : isAstralGuardian ? "Starfall safety" : "Village safety");
    this.advanceGuildQuest("guild-boss-hunt", 1);
  }

  awardQuest(reward) {
    this.addGold(reward?.gold ?? 55, "Quest purse");
    this.addReputation(reward?.reputation ?? 42, "Quest renown");
    this.addVillageReputation(reward?.villageReputation ?? 24, "Village thanks");
  }

  awardTempleChest(name) {
    if (!/temple/i.test(name ?? "")) {
      return;
    }
    this.addGold(32, "Temple cache");
    this.addReputation(26, "Temple discovery");
  }

  trackDiscoveryCredit() {
    const region = this.world.getRegionAt?.(this.player.group.position);
    if (!region || this.discoveryCredits.has(region.id)) {
      return;
    }
    this.discoveryCredits.add(region.id);
    this.advanceGuildQuest("guild-scouting", 1);
    this.advanceGuildQuest("village-delivery-route", 1);
    this.advanceGuildQuest("village-exploration-task", 1);
    this.advanceGuildQuest("post-arc-map-reports", 1);
  }

  advanceGuildQuest(id, amount) {
    const quest = this.guildQuests.find((item) => item.id === id) ?? this.villageJobs.find((item) => item.id === id);
    if (!quest || quest.complete || (quest.requiresMaster && !this.masterArcherUnlocked)) {
      return;
    }
    quest.progress = Math.min(quest.goal, quest.progress + amount);
    if (quest.progress >= quest.goal) {
      quest.complete = !quest.repeatable;
      quest.completions = (quest.completions ?? 0) + 1;
      this.addGold(quest.reward.gold, `${quest.title}`);
      this.addReputation(quest.reward.reputation, `${quest.title}`);
      this.addVillageReputation(quest.reward.villageReputation ?? Math.round(quest.reward.reputation * 0.5), `${quest.title}`);
      window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
        detail: {
          questId: quest.id,
          title: quest.title,
          xp: quest.reward.xp,
          upgradePoints: 0,
          message: `${quest.title} complete`,
          gold: 0,
          reputation: 0,
          villageReputation: 0,
        },
      }));
      if (quest.repeatable) {
        quest.progress = 0;
      } else if (this.activeGuildQuestIndex < this.guildQuests.length - 1) {
        this.activeGuildQuestIndex += 1;
      }
    }
    this.save();
    this.updateUi();
    if (this.questBoardOpen) {
      this.renderQuestBoard();
    }
  }

  openShop(shopId) {
    this.activeShopId = shopId;
    this.shopOpen = true;
    this.ui.menu.classList.add("visible");
    document.body.classList.add("shop-open");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.renderShop();
    this.playUiClick();
  }

  closeShop() {
    if (!this.shopOpen) {
      return;
    }
    this.shopOpen = false;
    this.activeShopId = null;
    this.ui.menu.classList.remove("visible");
    document.body.classList.remove("shop-open");
    this.playUiClick();
  }

  rentRoom() {
    const cost = 18;
    if (this.gold < cost) {
      this.showToast("Need 18 Gold to rent a room");
      return;
    }
    this.gold -= cost;
    this.world.timeOfDay = 0.24;
    this.player.stats.health = this.player.stats.healthMax;
    this.player.stats.stamina = this.player.stats.staminaMax;
    this.addVillageReputation(6, "Stayed at the inn");
    this.save();
    this.updateUi();
    this.showToast("Rested at the inn: health and stamina restored");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.5 },
    }));
  }

  repairEquipment() {
    const cost = Math.min(12, this.gold);
    if (cost > 0) {
      this.gold -= cost;
    }
    this.addVillageReputation(4, "Smithing support");
    this.save();
    this.updateUi();
    this.showToast(cost > 0 ? `Orin checks your kit: -${cost} Gold` : "Orin checks your kit on credit");
  }

  openQuestBoard() {
    this.questBoardOpen = true;
    this.ui.questBoard?.menu?.classList.add("visible");
    document.body.classList.add("quest-board-open");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.renderQuestBoard();
    this.playUiClick();
  }

  closeQuestBoard() {
    if (!this.questBoardOpen) {
      return;
    }
    this.questBoardOpen = false;
    this.ui.questBoard?.menu?.classList.remove("visible");
    document.body.classList.remove("quest-board-open");
    this.playUiClick();
  }

  renderQuestBoard() {
    if (!this.ui.questBoard?.items) {
      return;
    }
    this.ui.questBoard.items.innerHTML = "";
    this.villageJobs.filter((job) => !job.requiresMaster || this.masterArcherUnlocked).forEach((job) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quest-board-item";
      button.innerHTML = `
        <span>
          <strong>${job.title}</strong>
          <small>${job.type}: ${job.objective}. Progress ${job.progress}/${job.goal}. Completed ${job.completions ?? 0}x.</small>
        </span>
        <em>${job.reward.gold} Gold • ${job.reward.villageReputation} Village Rep</em>
      `;
      button.addEventListener("click", () => {
        this.showToast(`${job.title}: ${job.objective}`);
        this.playUiClick();
      });
      this.ui.questBoard.items.appendChild(button);
    });
  }

  renderShop() {
    const shop = SHOP_DEFINITIONS[this.activeShopId];
    if (!shop) {
      return;
    }
    this.ui.title.textContent = shop.title;
    this.ui.description.textContent = `${shop.description} Gold: ${this.gold}`;
    this.ui.items.innerHTML = "";
    shop.items.forEach((entry) => {
      const item = this.getShopItem(entry);
      const owned = this.systems.inventory.owned[entry.category]?.has(entry.id);
      const equipped = this.systems.inventory.equipped[entry.category] === entry.id;
      const rankLocked = !this.hasRank(entry.minRank);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shop-item";
      button.disabled = rankLocked || (!owned && this.gold < entry.price) || equipped;
      button.innerHTML = `
        <span>
          <strong>${item?.name ?? entry.id}</strong>
          <small>${rankLocked ? `Requires ${this.getRankName(entry.minRank)}` : item?.description ?? "Future-ready stock"}</small>
        </span>
        <em>${equipped ? "Equipped" : owned ? `Sell ${entry.sell} Gold` : `${entry.price} Gold`}</em>
      `;
      button.addEventListener("click", () => (owned ? this.sellItem(entry) : this.buyItem(entry)));
      this.ui.items.appendChild(button);
    });
  }

  buyItem(entry) {
    if (this.gold < entry.price || !this.hasRank(entry.minRank)) {
      return;
    }
    const bought = this.systems.inventory.addItem(entry.category, entry.id);
    if (!bought) {
      return;
    }
    this.gold -= entry.price;
    this.addReputation(Math.max(4, Math.round(entry.price * 0.08)), "Guild trade");
    this.save();
    this.updateUi();
    this.renderShop();
    this.playUiClick();
  }

  sellSelected() {
    const inventory = this.systems.inventory;
    const category = inventory.activeCategory;
    const itemId = inventory.selected[category];
    const shop = SHOP_DEFINITIONS[this.activeShopId];
    const entry = shop?.items.find((stock) => stock.category === category && stock.id === itemId);
    if (!entry || inventory.equipped[category] === itemId || !inventory.owned[category]?.has(itemId)) {
      this.showToast("Select unequipped shop gear to sell");
      return;
    }
    inventory.owned[category].delete(itemId);
    this.gold += entry.sell;
    inventory.render();
    this.save();
    this.updateUi();
    this.renderShop();
    this.showToast(`Sold ${this.getShopItem(entry)?.name ?? "gear"}: +${entry.sell} Gold`);
  }

  sellItem(entry) {
    const inventory = this.systems.inventory;
    if (inventory.equipped[entry.category] === entry.id || !inventory.owned[entry.category]?.has(entry.id)) {
      this.showToast("Equipped gear cannot be sold");
      return;
    }
    inventory.owned[entry.category].delete(entry.id);
    this.gold += entry.sell;
    inventory.render();
    this.save();
    this.updateUi();
    this.renderShop();
    this.showToast(`Sold ${this.getShopItem(entry)?.name ?? "gear"}: +${entry.sell} Gold`);
    this.playUiClick();
  }

  getShopItem(entry) {
    return GEAR_DEFINITIONS[entry.category]?.find((item) => item.id === entry.id) ?? null;
  }

  hasRank(rankId) {
    return GUILD_RANKS.findIndex((rank) => rank.id === this.getRank().id) >= GUILD_RANKS.findIndex((rank) => rank.id === rankId);
  }

  getRankName(rankId) {
    return GUILD_RANKS.find((rank) => rank.id === rankId)?.name ?? "Guild Rank";
  }

  getRank() {
    return GUILD_RANKS.reduce((best, rank) => (this.reputation >= rank.reputation ? rank : best), GUILD_RANKS[0]);
  }

  updateUi() {
    this.ui.gold.textContent = `Gold ${this.gold}`;
    this.ui.reputation.textContent = `Rep ${this.reputation} • Village ${this.villageReputation}`;
    this.ui.rank.textContent = this.getRank().name;
  }

  showDialogue(speaker, text) {
    this.ui.speaker.textContent = speaker;
    this.ui.text.textContent = text;
    this.ui.dialogue.classList.add("visible");
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
      this.gold = Number.isFinite(saved.gold) ? saved.gold : this.gold;
      this.reputation = Number.isFinite(saved.reputation) ? saved.reputation : this.reputation;
      this.villageReputation = Number.isFinite(saved.villageReputation) ? saved.villageReputation : this.villageReputation;
      if (Array.isArray(saved.guildQuests)) {
        this.guildQuests = this.guildQuests.map((quest) => ({ ...quest, ...(saved.guildQuests.find((item) => item.id === quest.id) ?? {}) }));
      }
      if (Array.isArray(saved.villageJobs)) {
        this.villageJobs = this.villageJobs.map((job) => ({ ...job, ...(saved.villageJobs.find((item) => item.id === job.id) ?? {}) }));
      }
      this.activeGuildQuestIndex = Number.isFinite(saved.activeGuildQuestIndex) ? saved.activeGuildQuestIndex : this.activeGuildQuestIndex;
      this.masterArcherUnlocked = Boolean(saved.masterArcherUnlocked);
    } catch (error) {
      console.warn("Economy save ignored:", error);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      gold: this.gold,
      reputation: this.reputation,
      villageReputation: this.villageReputation,
      activeGuildQuestIndex: this.activeGuildQuestIndex,
      masterArcherUnlocked: this.masterArcherUnlocked,
      guildQuests: this.guildQuests.map(({ id, progress, complete }) => ({ id, progress, complete })),
      villageJobs: this.villageJobs.map(({ id, progress, completions }) => ({ id, progress, completions })),
    }));
  }
}
