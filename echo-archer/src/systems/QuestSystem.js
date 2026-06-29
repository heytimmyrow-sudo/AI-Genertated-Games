import { NPC } from "../entities/NPC.js";
import { SETTINGS } from "../config/settings.js";

const { THREE } = window;
const STORAGE_KEY = "echo-archer-quests-v1";

const TRAINING_LANDMARK_IDS = new Set([
  "starting-camp",
  "training-area",
  "old-watchtower",
  "hidden-pond",
  "ancient-ruins",
  "hunters-cabin",
  "cliff-overlook",
  "whisper-cave",
  "river-crossing",
  "forgotten-grove",
  "archers-guild",
  "guild-village",
]);

const MAIN_QUEST_OBJECTIVES = [
  {
    id: "rowan-targets",
    title: "The Path of the Master Archer",
    objective: "Complete Rowan's target lesson at the training clearing.",
    location: "Starting Camp",
  },
  {
    id: "rowan-creatures",
    title: "The Path of the Master Archer",
    objective: "Defeat creatures near the training grounds without losing distance.",
    location: "Training Area",
  },
  {
    id: "rowan-landmarks",
    title: "The Path of the Master Archer",
    objective: "Discover the key landmarks around the guild grounds.",
    location: "Forest Meadow",
    landmark: true,
  },
  {
    id: "master-trials",
    title: "The Path of the Master Archer",
    objective: "Seek the Hall of Arrows and complete the Master Archer Trials.",
    location: "Hall of Arrows",
    landmark: true,
  },
  {
    id: "frontier-expedition",
    title: "The Path of the Master Archer",
    objective: "Begin Arc 2 by establishing the First Expedition beyond the Frontier Gate.",
    location: "Frontier Outpost",
    landmark: true,
  },
  {
    id: "lost-kingdom",
    title: "The Path of the Master Archer",
    objective: "Investigate the Lost Kingdom records beneath the frontier.",
    location: "King's Gate",
    landmark: true,
  },
  {
    id: "celestial-expanse",
    title: "The Path of the Master Archer",
    objective: "Follow the First Sky mystery into the Celestial Expanse.",
    location: "Observatory Prime",
    landmark: true,
  },
  {
    id: "shattered-coast",
    title: "The Path of the Master Archer",
    objective: "Investigate the Sea of Forgotten Kings along the Shattered Coast.",
    location: "Stormwatch Fortress",
    landmark: true,
  },
  {
    id: "veiled-wilds",
    title: "The Path of the Master Archer",
    objective: "Follow the Hidden Road through the Veiled Wilds.",
    location: "Worldroot Grove",
    landmark: true,
  },
  {
    id: "future-frontier",
    title: "The Path of the Master Archer",
    objective: "Main Quest Updated: return to the guild, finish open leads, and watch for new frontier reports.",
    location: "Archer's Guild",
  },
];

const MAIN_QUEST_REWARD_ADVANCEMENTS = new Map([
  ["master-champion", "master-trials"],
  ["frontier-ironhorn", "frontier-expedition"],
  ["lost-kingdom-sentinel", "lost-kingdom"],
  ["celestial-expanse-warden", "celestial-expanse"],
  ["shattered-coast-warden", "shattered-coast"],
  ["veiled-wilds-grovekeeper", "veiled-wilds"],
]);

const MAIN_QUEST_HANDOFFS = new Map([
  ["master-trials", "Arc 1 closes here, but the world stays open. Side quests and frontier leads unlock."],
  ["frontier-expedition", "The first outpost proves the Unknown Lands are older than the guild expected."],
  ["lost-kingdom", "The erased kingdom records point toward a civilization before recorded history."],
  ["celestial-expanse", "The First Sky confirms the Lost Kingdom was only one piece of the mystery."],
  ["shattered-coast", "Destroyed sea records suggest someone hid the oldest routes on purpose."],
  ["veiled-wilds", "Nature has covered evidence that multiple civilizations crossed these lands."],
]);

const SIDE_QUEST_DEFINITIONS = [
  {
    id: "rowan-targets",
    title: "Rowan's Mark",
    type: "training",
    giver: "Rowan",
    location: "Training Clearing",
    objective: "Hit 10 targets.",
    description: "Rowan watches your rhythm and release.",
    rewards: "90 XP, 1 upgrade point",
    unlock: "arc1",
    tracking: true,
  },
  {
    id: "rowan-creatures",
    title: "Quiet the Brush",
    type: "training",
    giver: "Rowan",
    location: "Forest Meadow",
    objective: "Defeat 4 creatures.",
    description: "Thin nearby threats without letting them crowd you.",
    rewards: "130 XP, 1 upgrade point",
    unlock: "after-rowan-targets",
    tracking: true,
  },
  {
    id: "rowan-landmarks",
    title: "Know the Grounds",
    type: "exploration",
    giver: "Rowan",
    location: "Guild Grounds",
    objective: "Discover key landmarks.",
    description: "Learn the nearby world before following distant rumors.",
    rewards: "160 XP, 1 upgrade point",
    unlock: "after-rowan-creatures",
    tracking: true,
    landmark: true,
  },
  {
    id: "blacksmith-help",
    title: "The Blacksmith Needs Help",
    type: "village",
    giver: "Guild Blacksmith",
    location: "Guild Village",
    objective: "Check the forge notice after becoming Master Archer.",
    description: "The forge has work fit for a proven archer.",
    rewards: "Gold, village reputation",
    unlock: "post-arc1",
    tracking: true,
  },
  {
    id: "village-deliveries",
    title: "Village Deliveries",
    type: "delivery",
    giver: "Innkeeper",
    location: "Guild Village",
    objective: "Ask the innkeeper about errands after Arc 1.",
    description: "Simple village help that keeps the world alive.",
    rewards: "Gold, rumors",
    unlock: "post-arc1",
    tracking: true,
  },
  {
    id: "hunting-requests",
    title: "Hunting Requests",
    type: "hunting",
    giver: "Quest Board",
    location: "Guild Village",
    objective: "Review the quest board for hunting work.",
    description: "Repeatable contracts open after the guild recognizes your title.",
    rewards: "XP, gold, guild reputation",
    unlock: "post-arc1",
    tracking: true,
  },
  {
    id: "frontier-rumors",
    title: "Frontier Rumors",
    type: "exploration",
    giver: "Explorer",
    location: "Frontier Outpost",
    objective: "Speak with explorers about new paths beyond Arc 1.",
    description: "Rumors point toward future expeditions and hidden routes.",
    rewards: "Lore, discovery leads",
    unlock: "post-arc1",
    tracking: true,
  },
];

export class QuestSystem {
  constructor(scene, world, player, ui) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.trainer = new NPC(scene, world, {
      name: "Rowan",
      role: "Master Archer",
      position: [-30.7, -20.7],
      interactRadius: 4.2,
    });
    this.quests = [
      { id: "rowan-targets", title: "Rowan's Mark", type: "side", status: "active", objective: "Hit 10 targets", progress: 0, goal: 10, complete: false, reward: SETTINGS.progression.questRewards.rowanTargets },
      { id: "rowan-creatures", title: "Quiet the Brush", type: "side", status: "locked", objective: "Defeat 4 creatures", progress: 0, goal: 4, complete: false, reward: SETTINGS.progression.questRewards.rowanCreatures },
      { id: "rowan-landmarks", title: "Know the Grounds", type: "side", status: "locked", objective: "Discover key landmarks", progress: 0, goal: this.getTrainingLandmarks().length || 12, complete: false, reward: SETTINGS.progression.questRewards.rowanLandmarks },
    ];
    this.mainQuest = {
      id: "path-master-archer",
      title: "The Path of the Master Archer",
      objectiveIndex: 0,
      objectives: MAIN_QUEST_OBJECTIVES.map((objective) => ({ ...objective, complete: false })),
    };
    this.sideQuestCatalog = SIDE_QUEST_DEFINITIONS.map((quest) => ({ ...quest }));
    this.completedQuestHistory = [];
    this.trackedSideQuestId = "rowan-targets";
    this.unlockedSideQuestIds = new Set(["rowan-targets"]);
    this.newSideQuestIds = new Set(["rowan-targets"]);
    this.notifiedSideQuestIds = new Set();
    this.notificationQueue = [];
    this.menuOpen = false;
    this.activeQuestIndex = 0;
    this.discoveredLandmarks = new Set();
    this.dialogueTimer = 0;
    this.toastTimer = 0;
    this.finderActive = false;
    this.finderTarget = null;
    this.legendaryPlatformTimers = new Map();
    this.finderArrow = this.createFinderArrow();
    this.load();
    this.bindFinderButton();
    this.bindQuestMenu();
    this.bindQuestEvents();
    this.syncQuestState();
    this.updateTracker();
    this.renderQuestMenu();
  }

  update(deltaSeconds, input) {
    if (input.wasPressed("KeyQ")) {
      this.toggleQuestMenu();
    }
    if (this.menuOpen && input.wasPressed("Escape")) {
      this.setQuestMenuOpen(false);
    }
    this.trainer.update(this.player);
    this.trackLandmarkDiscovery();
    const nearTrainer = this.trainer.isPlayerNear(this.player);
    const nearbyInteractable = this.getNearbyInteractable();
    const showPrompt = nearTrainer || nearbyInteractable;
    this.ui.prompt.textContent = nearTrainer ? "E Talk" : nearbyInteractable?.prompt ?? "E Interact";
    this.ui.prompt.classList.toggle("visible", Boolean(showPrompt));
    if (nearbyInteractable?.type === "legendary-platform") {
      this.updateLegendaryPlatform(nearbyInteractable, deltaSeconds);
    }

    if (nearTrainer && input.wasPressed("KeyE")) {
      this.showDialogue(this.getTrainerLine());
    } else if (nearbyInteractable && input.wasPressed("KeyE")) {
      this.readInteractable(nearbyInteractable);
    }

    this.dialogueTimer = Math.max(0, this.dialogueTimer - deltaSeconds);
    if (this.dialogueTimer === 0) {
      this.ui.dialogue.classList.remove("visible");
    }
    this.updateFinder(deltaSeconds);
  }

  createFinderArrow() {
    const group = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xe6b75d, roughness: 0.42, emissive: 0x4a2a00, emissiveIntensity: 0.22 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x9dffd0, roughness: 0.38, emissive: 0x2aa35f, emissiveIntensity: 0.28 });
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.82, 5), gold);
    pointer.rotation.x = Math.PI / 2;
    pointer.position.z = 0.34;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.72), gold);
    tail.position.z = -0.28;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), accent);
    gem.position.z = -0.02;
    group.add(pointer, tail, gem);
    group.visible = false;
    this.scene.add(group);
    return group;
  }

  bindFinderButton() {
    if (!this.ui.findButton) {
      return;
    }
    this.ui.findButton.addEventListener("click", () => {
      this.finderActive = !this.finderActive;
      if (this.finderActive) {
        this.finderTarget = this.getRelevantLandmarkObjective();
        if (!this.finderTarget) {
          this.finderActive = false;
          this.showToast("No landmark objective available");
        }
      }
      this.updateFinderButton();
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "uiClick", intensity: 0.62 },
      }));
    });
  }

  bindQuestMenu() {
    this.ui.questButton?.addEventListener("click", () => {
      this.toggleQuestMenu();
    });
    this.ui.questSideButton?.addEventListener("click", () => {
      this.toggleQuestMenu();
    });
    this.ui.questClose?.addEventListener("click", () => {
      this.setQuestMenuOpen(false);
    });
    this.ui.questContent?.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-track-quest]");
      if (!button) {
        return;
      }
      this.trackSideQuest(button.dataset.trackQuest);
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "uiClick", intensity: 0.58 },
      }));
    });
  }

  bindQuestEvents() {
    window.addEventListener("echo-archer:quest-reward", (event) => this.handleQuestReward(event.detail ?? {}));
    window.addEventListener("echo-archer:master-archer-complete", () => {
      this.completeMainObjective("master-trials");
      this.unlockPostArcSideQuests();
    });
    window.addEventListener("echo-archer:frontier-expedition-complete", () => this.completeMainObjective("frontier-expedition"));
    window.addEventListener("echo-archer:lost-kingdom-complete", () => this.completeMainObjective("lost-kingdom"));
    window.addEventListener("echo-archer:celestial-expanse-complete", () => this.completeMainObjective("celestial-expanse"));
    window.addEventListener("echo-archer:shattered-coast-complete", () => this.completeMainObjective("shattered-coast"));
    window.addEventListener("echo-archer:veiled-wilds-complete", () => this.completeMainObjective("veiled-wilds"));
  }

  toggleQuestMenu() {
    this.setQuestMenuOpen(!this.menuOpen);
  }

  setQuestMenuOpen(open) {
    this.menuOpen = Boolean(open);
    this.ui.questMenu?.classList.toggle("visible", this.menuOpen);
    document.body.classList.toggle("quests-open", this.menuOpen);
    if (this.menuOpen) {
      this.newSideQuestIds.clear();
      this.renderQuestMenu();
      this.updateQuestBadge();
    }
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.55 },
    }));
  }

  trackSideQuest(id) {
    const quest = this.getSideQuestById(id);
    if (!quest || quest.status === "locked" || quest.status === "completed") {
      return;
    }
    this.trackedSideQuestId = id;
    this.newSideQuestIds.delete(id);
    this.updateTracker();
    this.renderQuestMenu();
    this.save();
  }

  showSideQuestAvailable(definition) {
    if (!this.ui.sideNotifications || this.notifiedSideQuestIds.has(definition.id)) {
      return;
    }
    this.notifiedSideQuestIds.add(definition.id);
    const activeNotifications = this.ui.sideNotifications.querySelectorAll(".side-quest-notification").length;
    if (activeNotifications >= 2) {
      this.notificationQueue.push(definition);
      return;
    }
    const notification = document.createElement("div");
    notification.className = "side-quest-notification";
    notification.innerHTML = `
      <span>Side Quest Available</span>
      <strong>${definition.title}</strong>
      <small>${definition.giver} - ${definition.location}. ${definition.description ?? ""}</small>
    `;
    this.ui.sideNotifications.appendChild(notification);
    window.setTimeout(() => {
      notification.remove();
      const next = this.notificationQueue.shift();
      if (next) {
        this.notifiedSideQuestIds.delete(next.id);
        this.showSideQuestAvailable(next);
      }
    }, 4300);
  }

  handleTargetHit() {
    const quest = this.getActiveQuest();
    if (quest?.id !== "rowan-targets") {
      return;
    }

    this.advanceQuest(1);
  }

  handleEnemyDefeated() {
    const quest = this.getActiveQuest();
    if (quest?.id !== "rowan-creatures") {
      return;
    }

    this.advanceQuest(1);
  }

  advanceQuest(amount) {
    const quest = this.getActiveQuest();
    if (!quest || quest.complete) {
      return;
    }

    quest.progress = Math.min(quest.goal, quest.progress + amount);
    if (quest.progress >= quest.goal) {
      this.completeQuest(quest);
    }
    this.save();
    this.updateTracker();
  }

  completeQuest(quest) {
    quest.complete = true;
    quest.status = "completed";
    this.recordCompletedQuest({
      id: quest.id,
      title: quest.title,
      type: "Side Quest",
      rewards: this.formatReward(quest.reward),
    });
    this.completeMainObjective(quest.id);
    this.showToast(`Quest complete: ${quest.title}`);
    window.dispatchEvent(new CustomEvent("echo-archer:quest-reward", {
      detail: {
        questId: quest.id,
        title: quest.title,
        xp: quest.reward?.xp ?? 0,
        upgradePoints: quest.reward?.upgradePoints ?? 0,
        message: quest.reward?.message ?? `${quest.title} complete`,
      },
    }));
    if (this.activeQuestIndex < this.quests.length - 1) {
      this.activeQuestIndex += 1;
      const nextQuest = this.getActiveQuest();
      if (nextQuest && !nextQuest.complete) {
        nextQuest.status = "active";
        this.announceSideQuest(nextQuest.id);
        this.trackedSideQuestId = nextQuest.id;
      }
      this.showDialogue(this.getQuestIntro(this.getActiveQuest()));
    } else {
      this.showDialogue("Good work. The woods remember careful feet.");
    }
    this.save();
    this.renderQuestMenu();
  }

  getActiveQuest() {
    return this.quests[this.activeQuestIndex];
  }

  updateTracker() {
    const mainObjective = this.getCurrentMainObjective();
    if (this.ui.title) {
      this.ui.title.textContent = this.mainQuest.title;
    }
    if (this.ui.objective) {
      this.ui.objective.textContent = this.formatMainObjective(mainObjective);
    }
    const tracked = this.getTrackedSideQuest();
    if (this.ui.trackedSide) {
      this.ui.trackedSide.hidden = !tracked;
    }
    if (tracked) {
      this.ui.trackedSideTitle.textContent = tracked.title;
      this.ui.trackedSideObjective.textContent = this.formatSideObjective(tracked);
    }
    this.updateQuestBadge();
    this.updateFinderButton();
  }

  refreshHud() {
    this.updateTracker();
  }

  getCurrentMainObjective() {
    return this.mainQuest.objectives[this.mainQuest.objectiveIndex] ?? this.mainQuest.objectives[this.mainQuest.objectives.length - 1];
  }

  formatMainObjective(objective) {
    if (!objective) {
      return "Main Quest Updated: the adventure continues.";
    }
    return objective.objective;
  }

  getTrackedSideQuest() {
    const quest = this.getSideQuestById(this.trackedSideQuestId);
    if (!quest || quest.status === "locked" || quest.status === "completed") {
      return null;
    }
    return quest;
  }

  formatSideObjective(sideQuest) {
    const activeQuest = this.quests.find((quest) => quest.id === sideQuest.id);
    if (activeQuest) {
      return `${activeQuest.objective} (${activeQuest.progress}/${activeQuest.goal})`;
    }
    return sideQuest.objective;
  }

  getSideQuestById(id) {
    const definition = this.sideQuestCatalog.find((quest) => quest.id === id);
    if (!definition) {
      return null;
    }
    const liveQuest = this.quests.find((quest) => quest.id === id);
    const status = liveQuest?.status
      ?? (this.unlockedSideQuestIds.has(id) ? "available" : definition.status)
      ?? (definition.unlock === "post-arc1" ? "locked" : "available");
    return {
      ...definition,
      status,
      progress: liveQuest?.progress,
      goal: liveQuest?.goal,
      complete: liveQuest?.complete ?? status === "completed",
      reward: liveQuest?.reward,
    };
  }

  syncQuestState() {
    this.quests.forEach((quest, index) => {
      if (index <= this.activeQuestIndex || quest.complete) {
        this.unlockedSideQuestIds.add(quest.id);
      }
      if (quest.complete) {
        quest.status = "completed";
        this.newSideQuestIds.delete(quest.id);
        this.completeMainObjective(quest.id, { silent: true });
        this.recordCompletedQuest({
          id: quest.id,
          title: quest.title,
          type: "Side Quest",
          rewards: this.formatReward(quest.reward),
        }, { silent: true });
        return;
      }
      if (index === this.activeQuestIndex) {
        quest.status = "active";
      } else if (index < this.activeQuestIndex) {
        quest.status = "completed";
      } else {
        quest.status = "locked";
      }
    });
    if (!this.getTrackedSideQuest()) {
      this.trackedSideQuestId = this.getActiveQuest()?.id ?? null;
    }
    this.syncMainQuestFromExistingSaves();
    this.updateQuestBadge();
  }

  syncMainQuestFromExistingSaves() {
    const savedMilestones = [
      ["echo-archer-master-trials-v1", "completed", "master-trials"],
      ["echo-archer-frontier-expedition-v1", "complete", "frontier-expedition"],
      ["echo-archer-lost-kingdom-v1", "complete", "lost-kingdom"],
      ["echo-archer-celestial-expanse-v1", "complete", "celestial-expanse"],
      ["echo-archer-shattered-coast-v1", "complete", "shattered-coast"],
      ["echo-archer-veiled-wilds-v1", "complete", "veiled-wilds"],
    ];
    savedMilestones.forEach(([key, field, objectiveId]) => {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
        if (saved?.[field]) {
          this.completeMainObjective(objectiveId, { silent: true });
        }
      } catch {
      }
    });
    if (this.mainQuest.objectives.find((objective) => objective.id === "master-trials")?.complete) {
      SIDE_QUEST_DEFINITIONS
        .filter((quest) => quest.unlock === "post-arc1")
        .forEach((quest) => this.unlockedSideQuestIds.add(quest.id));
    }
  }

  completeMainObjective(id, options = {}) {
    const index = this.mainQuest.objectives.findIndex((objective) => objective.id === id);
    if (index < 0) {
      return;
    }
    const objective = this.mainQuest.objectives[index];
    if (!objective.complete) {
      objective.complete = true;
      this.recordCompletedQuest({
        id: `main-${objective.id}`,
        title: objective.title,
        type: "Main Milestone",
        objective: objective.objective,
        rewards: "Main Quest Updated",
      }, { silent: true });
    }
    const nextIndex = this.mainQuest.objectives.findIndex((item) => !item.complete);
    this.mainQuest.objectiveIndex = nextIndex >= 0 ? nextIndex : this.mainQuest.objectives.length - 1;
    if (!options.silent) {
      this.showToast("Main Quest Updated");
      this.save();
      this.renderQuestMenu();
      this.updateTracker();
    }
  }

  handleQuestReward(detail) {
    const questId = detail.questId;
    if (!questId) {
      return;
    }

    if (!this.quests.some((quest) => quest.id === questId)) {
      this.recordCompletedQuest({
        id: `reward-${questId}`,
        title: detail.title ?? detail.message ?? "Guild Record",
        type: this.getRewardQuestType(questId),
        objective: detail.message ?? "Recorded by the Archer's Guild.",
        rewards: this.formatReward(detail),
      }, { silent: true });
    }

    const mainObjectiveId = MAIN_QUEST_REWARD_ADVANCEMENTS.get(questId);
    if (mainObjectiveId) {
      this.completeMainObjective(mainObjectiveId);
    }
  }

  getRewardQuestType(questId) {
    if (questId.startsWith("master-")) return "Master Trial";
    if (questId.startsWith("frontier-")) return "Arc 2 - Frontier";
    if (questId.startsWith("lost-kingdom-")) return "Arc 2 - Lost Kingdom";
    if (questId.startsWith("celestial-expanse-")) return "Arc 2 - Celestial Expanse";
    if (questId.startsWith("shattered-coast-")) return "Arc 2 - Shattered Coast";
    if (questId.startsWith("veiled-wilds-")) return "Arc 2 - Veiled Wilds";
    return "Guild Record";
  }

  unlockPostArcSideQuests() {
    SIDE_QUEST_DEFINITIONS
      .filter((quest) => quest.unlock === "post-arc1")
      .forEach((quest) => this.announceSideQuest(quest.id));
    this.save();
    this.renderQuestMenu();
  }

  announceSideQuest(id) {
    const definition = this.sideQuestCatalog.find((quest) => quest.id === id);
    if (!definition) {
      return;
    }
    this.unlockedSideQuestIds.add(id);
    this.newSideQuestIds.add(id);
    this.showSideQuestAvailable(definition);
    this.updateQuestBadge();
  }

  recordCompletedQuest(entry, options = {}) {
    if (!entry?.id || this.completedQuestHistory.some((item) => item.id === entry.id)) {
      return;
    }
    this.completedQuestHistory.push({
      id: entry.id,
      title: entry.title,
      type: entry.type ?? "Quest",
      objective: entry.objective ?? "",
      rewards: entry.rewards ?? "",
      completedAt: Date.now(),
    });
    if (!options.silent) {
      this.renderQuestMenu();
    }
  }

  formatReward(reward) {
    if (!reward) {
      return "";
    }
    const parts = [];
    if (reward.xp) parts.push(`${reward.xp} XP`);
    if (reward.upgradePoints) parts.push(`${reward.upgradePoints} upgrade point${reward.upgradePoints === 1 ? "" : "s"}`);
    if (reward.gold) parts.push(`${reward.gold} gold`);
    if (reward.reputation) parts.push(`${reward.reputation} reputation`);
    return parts.join(", ");
  }

  updateFinderButton() {
    if (!this.ui.findButton) {
      return;
    }
    const available = Boolean(this.getRelevantLandmarkObjective());
    this.ui.findButton.hidden = !available;
    this.ui.findButton.classList.toggle("active", this.finderActive && available);
    this.ui.findButton.textContent = this.finderActive && available ? "Hide Guide" : "Find Landmark";
    if (!available) {
      this.finderActive = false;
      this.finderTarget = null;
      this.finderArrow.visible = false;
    }
  }

  updateQuestBadge() {
    if (!this.ui.questBadge && !this.ui.questSideBadge) {
      return;
    }
    const count = this.newSideQuestIds.size;
    [this.ui.questBadge, this.ui.questSideBadge].forEach((badge) => {
      if (!badge) {
        return;
      }
      badge.hidden = count <= 0;
      badge.textContent = String(count);
    });
  }

  renderQuestMenu() {
    if (!this.ui.questContent) {
      return;
    }
    const currentMain = this.getCurrentMainObjective();
    const availableSideQuests = this.sideQuestCatalog
      .map((quest) => this.getSideQuestById(quest.id))
      .filter((quest) => quest && quest.status !== "locked" && quest.status !== "completed");
    const lockedSideQuests = this.sideQuestCatalog
      .map((quest) => this.getSideQuestById(quest.id))
      .filter((quest) => quest?.status === "locked");
    const completed = [...this.completedQuestHistory].slice(-18).reverse();

    this.ui.questContent.innerHTML = `
      <section class="quest-ledger-section">
        <h3>Main Quest</h3>
        <article class="quest-ledger-item">
          <span class="quest-ledger-meta">${currentMain?.location ?? "Guild Records"}</span>
          <strong>${this.mainQuest.title}</strong>
          <p>${this.formatMainObjective(currentMain)}</p>
          ${this.getCurrentStoryHint(currentMain)}
        </article>
      </section>
      <section class="quest-ledger-section">
        <h3>Story Path</h3>
        ${this.renderMainQuestPath()}
      </section>
      <section class="quest-ledger-section">
        <h3>Side Quests</h3>
        ${availableSideQuests.length ? availableSideQuests.map((quest) => this.renderSideQuestItem(quest)).join("") : "<p>No side quests available right now.</p>"}
      </section>
      <section class="quest-ledger-section">
        <h3>Completed Quests</h3>
        ${completed.length ? completed.map((quest) => this.renderCompletedQuestItem(quest)).join("") : "<p>No completed quest history yet.</p>"}
      </section>
      <section class="quest-ledger-section">
        <h3>Locked / Future Quests</h3>
        ${lockedSideQuests.length ? lockedSideQuests.map((quest) => `
          <article class="quest-ledger-item">
            <span class="quest-ledger-meta">${quest.type} - ${quest.location}</span>
            <strong>${quest.title}</strong>
            <p>${quest.unlock === "post-arc1" ? "Unlocks after Arc 1 / Master Archer recognition." : "Locked until earlier training is complete."}</p>
          </article>
        `).join("") : "<p>Future quest slots are ready for Arc 2 and Arc 3.</p>"}
      </section>
    `;
  }

  getCurrentStoryHint(objective) {
    if (!objective) {
      return "<p>Main Quest Updated: the guild is ready for the next report.</p>";
    }
    const handoff = MAIN_QUEST_HANDOFFS.get(objective.id);
    return handoff ? `<p>${handoff}</p>` : "";
  }

  renderMainQuestPath() {
    return this.mainQuest.objectives.map((objective, index) => {
      const current = index === this.mainQuest.objectiveIndex;
      const state = objective.complete ? "Complete" : current ? "Current" : "Locked";
      const stateClass = objective.complete ? "completed" : current ? "active" : "locked";
      return `
        <article class="quest-ledger-item quest-path-item ${stateClass}">
          <span class="quest-ledger-meta">${state} - ${objective.location}</span>
          <strong>${objective.title}</strong>
          <p>${objective.objective}</p>
        </article>
      `;
    }).join("");
  }

  renderSideQuestItem(quest) {
    const tracked = quest.id === this.trackedSideQuestId;
    const fresh = this.newSideQuestIds.has(quest.id);
    return `
      <article class="quest-ledger-item">
        <span class="quest-ledger-meta">${fresh ? "New - " : ""}${quest.type} - ${quest.giver} - ${quest.location}</span>
        <strong>${quest.title}</strong>
        <p>${this.formatSideObjective(quest)}</p>
        <p>${quest.description}</p>
        <p>Rewards: ${quest.rewards}</p>
        <button class="quest-track-button" type="button" data-track-quest="${quest.id}" ${tracked ? "disabled" : ""}>${tracked ? "Tracking" : "Track Side Quest"}</button>
      </article>
    `;
  }

  renderCompletedQuestItem(quest) {
    return `
      <article class="quest-ledger-item">
        <span class="quest-ledger-meta">${quest.type}</span>
        <strong>${quest.title}</strong>
        <p>${quest.objective || "Completed and recorded in the guild ledger."}</p>
        ${quest.rewards ? `<p>Rewards: ${quest.rewards}</p>` : ""}
      </article>
    `;
  }

  getTrainerLine() {
    const quest = this.getActiveQuest();
    if (!quest) {
      return "Breathe, aim, release. That is the path.";
    }

    if (quest.id === "rowan-targets") {
      return quest.progress === 0
        ? "Ten targets. No rush. Smooth hands beat fast hands."
        : `Good rhythm. Targets hit: ${quest.progress} of ${quest.goal}.`;
    }

    if (quest.id === "rowan-creatures") {
      return quest.progress === 0
        ? "Creatures keep to their ground. If they press you, make the shot count."
        : `Keep your distance. Creatures defeated: ${quest.progress} of ${quest.goal}.`;
    }

    if (quest.id === "rowan-landmarks") {
      return quest.progress === 0
        ? "Walk the grounds. Find the key places first; the far frontier can wait."
        : `Landmarks found: ${quest.progress} of ${quest.goal}. Hidden targets like quiet corners.`;
    }

    return "Check your line, then loose.";
  }

  getQuestIntro(quest) {
    if (quest.id === "rowan-creatures") {
      return "Next, thin the trouble. Four creatures. Stay practical.";
    }
    if (quest.id === "rowan-landmarks") {
      return "Last lesson: learn the land. A good archer knows the way home.";
    }
    return "Stay sharp.";
  }

  trackLandmarkDiscovery() {
    if (!this.world.landmarks?.length) {
      return;
    }

    let changed = false;
    this.world.landmarks.forEach((landmark) => {
      if (this.discoveredLandmarks.has(landmark.id)) {
        return;
      }

      if (this.player.group.position.distanceTo(landmark.position) <= landmark.radius) {
        this.discoveredLandmarks.add(landmark.id);
        changed = true;
        this.showToast(`Discovered: ${landmark.name}`);
        window.dispatchEvent(new CustomEvent("echo-archer:landmark-discovered", {
          detail: { id: landmark.id, name: landmark.name },
        }));
        if (this.finderTarget?.id === landmark.id) {
          this.finderActive = false;
          this.finderTarget = null;
          this.finderArrow.visible = false;
        }
      }
    });

    const quest = this.getActiveQuest();
    if (quest?.id !== "rowan-landmarks") {
      if (changed) {
        this.save();
      }
      return;
    }

    const previousProgress = quest.progress;
    const foundTrainingLandmarks = this.getTrainingLandmarks().filter((landmark) => this.discoveredLandmarks.has(landmark.id)).length;
    quest.progress = Math.min(quest.goal, foundTrainingLandmarks);
    if (changed || quest.progress !== previousProgress) {
      this.save();
      this.updateTracker();
    }
    if (!quest.complete && quest.progress >= quest.goal) {
      this.completeQuest(quest);
      this.updateTracker();
    }
  }

  getRelevantLandmarkObjective() {
    if (!this.world.landmarks?.length) {
      return null;
    }
    const tracked = this.getTrackedSideQuest();
    const activeTrainingQuest = this.getActiveQuest();
    if ((tracked?.id === "rowan-landmarks" || activeTrainingQuest?.id === "rowan-landmarks") && !activeTrainingQuest?.complete) {
      const playerPosition = this.player.group.position;
      return this.getTrainingLandmarks()
        .filter((landmark) => !this.discoveredLandmarks.has(landmark.id))
        .sort((a, b) => playerPosition.distanceTo(a.position) - playerPosition.distanceTo(b.position))[0] ?? null;
    }

    const mainObjective = this.getCurrentMainObjective();
    if (mainObjective?.landmark) {
      return this.findLandmarkByObjective(mainObjective);
    }
    return null;
  }

  findLandmarkByObjective(objective) {
    const wanted = `${objective.location ?? ""} ${objective.objective ?? ""}`.toLowerCase();
    return (this.world.landmarks ?? []).find((landmark) => (
      wanted.includes(landmark.name.toLowerCase())
      || wanted.includes(landmark.id.replace(/-/g, " "))
    )) ?? null;
  }

  getTrainingLandmarks() {
    return (this.world.landmarks ?? []).filter((landmark) => TRAINING_LANDMARK_IDS.has(landmark.id)).slice(0, 12);
  }

  updateFinder(deltaSeconds) {
    if (!this.finderActive) {
      this.finderArrow.visible = false;
      return;
    }
    if (!this.finderTarget || this.discoveredLandmarks.has(this.finderTarget.id)) {
      this.finderTarget = this.getRelevantLandmarkObjective();
    }
    if (!this.finderTarget) {
      this.finderActive = false;
      this.updateFinderButton();
      this.finderArrow.visible = false;
      return;
    }

    const playerPosition = this.player.group.position;
    const toTarget = this.finderTarget.position.clone().sub(playerPosition);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (distance <= this.finderTarget.radius) {
      this.finderActive = false;
      this.updateFinderButton();
      this.finderArrow.visible = false;
      return;
    }
    toTarget.normalize();
    this.finderArrow.visible = true;
    this.finderArrow.position.copy(playerPosition).add(new THREE.Vector3(0, 3.0 + Math.sin(performance.now() * 0.004) * 0.14, 0));
    this.finderArrow.rotation.y = Math.atan2(toTarget.x, toTarget.z);
    this.finderArrow.rotation.z = Math.sin(performance.now() * 0.003) * 0.08;
  }

  getNearbyInteractable() {
    if (!this.world.interactables?.length) {
      return null;
    }

    return this.world.interactables.find((interactable) => (
      !interactable.hidden && !interactable.collected && this.player.group.position.distanceTo(interactable.position) <= interactable.radius
    )) ?? null;
  }

  readInteractable(interactable) {
    if (interactable.type === "xp-pickup") {
      this.collectInteractable(interactable);
      return;
    }

    if (interactable.type === "gear-pickup") {
      if (interactable.requiresQuest && !this.isQuestComplete(interactable.requiresQuest)) {
        this.showMessage(interactable.name, interactable.lockedText ?? "This gear is not ready yet.");
        window.dispatchEvent(new CustomEvent("echo-archer:sound", {
          detail: { name: "uiClick", intensity: 0.5 },
        }));
        return;
      }
      this.collectGear(interactable);
      return;
    }

    if (interactable.type === "rare-loot") {
      this.collectRareLoot(interactable);
      return;
    }

    if (interactable.type === "discovery-trail") {
      this.activateDiscoveryTrail(interactable);
      return;
    }

    if (interactable.type === "celestial-energy") {
      this.activateCelestialEnergy(interactable);
      return;
    }

    if (interactable.type === "master-trials-console") {
      this.showMessage(interactable.name, interactable.text);
      window.dispatchEvent(new CustomEvent("echo-archer:master-trials-interact", {
        detail: { id: interactable.id, name: interactable.name },
      }));
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "questComplete", intensity: 0.72 },
      }));
      return;
    }

    if (interactable.type === "legendary-platform") {
      this.useLegendaryPlatform(interactable, true);
      return;
    }

    if (interactable.type === "frontier-track" || interactable.type === "frontier-expedition-console") {
      interactable.read = true;
      this.showMessage(interactable.name, interactable.text);
      window.dispatchEvent(new CustomEvent(interactable.type === "frontier-track" ? "echo-archer:frontier-track" : "echo-archer:frontier-expedition", {
        detail: { id: interactable.id, name: interactable.name, text: interactable.text },
      }));
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "questComplete", intensity: interactable.type === "frontier-track" ? 0.62 : 0.72 },
      }));
      return;
    }

    if (interactable.type === "ancient-record" || interactable.type === "ancient-mechanism" || interactable.type === "lost-kingdom-console") {
      interactable.read = true;
      this.showMessage(interactable.name, interactable.text);
      if (interactable.type === "ancient-mechanism") {
        this.world.activateLostKingdomMechanism?.(interactable.mechanismId);
      }
      window.dispatchEvent(new CustomEvent(
        interactable.type === "ancient-record" ? "echo-archer:ancient-record" : interactable.type === "ancient-mechanism" ? "echo-archer:ancient-mechanism-read" : "echo-archer:lost-kingdom-quest",
        { detail: { id: interactable.recordId ?? interactable.mechanismId ?? interactable.id, name: interactable.name, text: interactable.text } },
      ));
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "questComplete", intensity: interactable.type === "lost-kingdom-console" ? 0.74 : 0.62 },
      }));
      return;
    }

    if (interactable.type === "celestial-record" || interactable.type === "celestial-relay" || interactable.type === "celestial-expanse-console") {
      interactable.read = true;
      this.showMessage(interactable.name, interactable.text);
      if (interactable.type === "celestial-relay") {
        this.world.activateCelestialRelay?.(interactable.relayId);
      }
      window.dispatchEvent(new CustomEvent(
        interactable.type === "celestial-record" ? "echo-archer:celestial-record" : interactable.type === "celestial-relay" ? "echo-archer:celestial-relay-read" : "echo-archer:celestial-expanse-quest",
        { detail: { id: interactable.recordId ?? interactable.relayId ?? interactable.id, name: interactable.name, text: interactable.text } },
      ));
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "questComplete", intensity: interactable.type === "celestial-expanse-console" ? 0.78 : 0.64 },
      }));
      return;
    }

    interactable.read = true;
    this.showMessage(interactable.name, interactable.text);
    if (interactable.type === "lookout") {
      window.dispatchEvent(new CustomEvent("echo-archer:lookout", {
        detail: { target: interactable.focus },
      }));
    }
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.7 },
    }));
  }

  updateLegendaryPlatform(interactable, deltaSeconds) {
    const current = this.legendaryPlatformTimers.get(interactable.id) ?? 0;
    this.legendaryPlatformTimers.set(interactable.id, Math.max(0, current - deltaSeconds));
    const activationRadius = interactable.activationRadius ?? Math.min(1.75, interactable.radius * 0.58);
    if (this.player.group.position.distanceTo(interactable.position) <= activationRadius) {
      this.useLegendaryPlatform(interactable, false);
    }
  }

  useLegendaryPlatform(interactable, manual = false) {
    const timer = this.legendaryPlatformTimers.get(interactable.id) ?? 0;
    if (timer > 0 || interactable.teleporting) {
      return;
    }
    this.legendaryPlatformTimers.set(interactable.id, manual ? 0.9 : 2.4);

    if (!interactable.unlocked) {
      this.showMessage(interactable.name, interactable.lockedText ?? "Locked: this legendary structure is not awake yet.");
      window.dispatchEvent(new CustomEvent("echo-archer:sound", {
        detail: { name: "uiClick", intensity: 0.42 },
      }));
      return;
    }

    const destination = interactable.destination;
    if (!destination) {
      this.showMessage(interactable.name, interactable.unlockedText ?? "The legendary platform hums, but its destination is still being prepared.");
      return;
    }

    interactable.teleporting = true;
    this.showMessage(interactable.name, interactable.unlockedText ?? "The platform wakes beneath your boots.");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.72 },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
      detail: {
        text: `Entering ${interactable.destinationName ?? interactable.name}`,
        kind: "xp",
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.33,
      },
    }));
    window.setTimeout(() => {
      const y = Number.isFinite(destination.y) ? destination.y : this.world.terrain.getHeightAt(destination.x, destination.z);
      this.player.group.position.set(destination.x, y + 0.02, destination.z);
      this.player.velocity?.set?.(0, 0, 0);
      interactable.teleporting = false;
      this.legendaryPlatformTimers.set(interactable.id, 2.2);
    }, 720);
  }

  collectInteractable(interactable) {
    interactable.collected = true;
    interactable.group?.parent?.remove(interactable.group);
    this.showMessage(interactable.name, interactable.text);
    window.dispatchEvent(new CustomEvent("echo-archer:xp-pickup", {
      detail: { id: interactable.id, amount: interactable.xp ?? 0, name: interactable.name },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.55 },
    }));
    this.save();
  }

  collectGear(interactable) {
    interactable.collected = true;
    interactable.group?.parent?.remove(interactable.group);
    this.showMessage(interactable.name, interactable.text);
    window.dispatchEvent(new CustomEvent("echo-archer:gear-pickup", {
      detail: {
        category: interactable.category,
        itemId: interactable.itemId,
        name: interactable.name,
      },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.62 },
    }));
    this.save();
  }

  collectRareLoot(interactable) {
    interactable.collected = true;
    interactable.group?.parent?.remove(interactable.group);
    this.showMessage(interactable.name, interactable.text);
    window.dispatchEvent(new CustomEvent("echo-archer:rare-loot", {
      detail: {
        name: interactable.name,
        rarity: interactable.rarity ?? "rare",
        text: interactable.text,
        category: interactable.category,
        itemId: interactable.itemId,
      },
    }));
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.72 },
    }));
    this.save();
  }

  activateDiscoveryTrail(interactable) {
    const revealed = this.world.revealDiscoveryTrail?.(interactable.id);
    interactable.collected = Boolean(revealed);
    this.showMessage(interactable.name, interactable.text);
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: revealed ? "questComplete" : "uiClick", intensity: revealed ? 0.68 : 0.5 },
    }));
  }

  activateCelestialEnergy(interactable) {
    const activated = this.world.activateCelestialEnergy?.(interactable);
    this.showMessage(interactable.name, activated ? interactable.text : "This celestial source is already awake.");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: activated ? "questComplete" : "uiClick", intensity: activated ? 0.72 : 0.52 },
    }));
  }

  isQuestComplete(id) {
    return this.quests.some((quest) => quest.id === id && quest.complete);
  }

  showDialogue(text) {
    this.showMessage(this.trainer.name, text);
  }

  showMessage(speaker, text) {
    this.ui.speaker.textContent = speaker;
    this.ui.text.textContent = text;
    this.ui.dialogue.classList.add("visible");
    this.dialogueTimer = 4.2;
  }

  showToast(text) {
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "questComplete", intensity: 0.9 },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.restoreSaveData(saved);
    } catch (error) {
      console.warn("Quest save ignored:", error);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getSaveData()));
    } catch (error) {
      console.warn("Quest save failed:", error);
    }
  }

  getStoryPhase() {
    if (!this.mainQuest?.objectives?.length) {
      return "opening";
    }
    if (!this.mainQuest.objectives.find((objective) => objective.id === "rowan-landmarks")?.complete) {
      return "opening";
    }
    if (!this.mainQuest.objectives.find((objective) => objective.id === "master-trials")?.complete) {
      return "arc1-fortress";
    }
    if (!this.mainQuest.objectives.find((objective) => objective.id === "frontier-expedition")?.complete) {
      return "frontier";
    }
    if (!this.mainQuest.objectives.find((objective) => objective.id === "lost-kingdom")?.complete) {
      return "lost-kingdom";
    }
    if (!this.mainQuest.objectives.find((objective) => objective.id === "celestial-expanse")?.complete) {
      return "celestial";
    }
    return "open-world";
  }

  isOpeningChapter() {
    return this.getStoryPhase() === "opening";
  }

  hasCompletedMainObjective(id) {
    return Boolean(this.mainQuest?.objectives?.find((objective) => objective.id === id)?.complete);
  }

  getSaveData() {
    return {
      version: 2,
      activeQuestIndex: this.activeQuestIndex,
      discoveredLandmarks: [...this.discoveredLandmarks],
      mainQuest: {
        objectiveIndex: this.mainQuest.objectiveIndex,
        objectives: this.mainQuest.objectives.map(({ id, complete }) => ({ id, complete })),
      },
      trackedSideQuestId: this.trackedSideQuestId,
      unlockedSideQuestIds: [...this.unlockedSideQuestIds],
      newSideQuestIds: [...this.newSideQuestIds],
      notifiedSideQuestIds: [...this.notifiedSideQuestIds],
      completedQuestHistory: this.completedQuestHistory,
      quests: this.quests.map(({ id, progress, complete, status }) => ({ id, progress, complete, status })),
    };
  }

  restoreSaveData(saved = {}) {
    this.activeQuestIndex = THREE.MathUtils.clamp(Number(saved.activeQuestIndex) || 0, 0, this.quests.length - 1);
    this.discoveredLandmarks = new Set(Array.isArray(saved.discoveredLandmarks) ? saved.discoveredLandmarks : []);
    this.trackedSideQuestId = saved.trackedSideQuestId ?? this.trackedSideQuestId;
    this.unlockedSideQuestIds = new Set(Array.isArray(saved.unlockedSideQuestIds) ? saved.unlockedSideQuestIds : [...this.unlockedSideQuestIds]);
    this.newSideQuestIds = new Set(Array.isArray(saved.newSideQuestIds) ? saved.newSideQuestIds : [...this.newSideQuestIds]);
    this.notifiedSideQuestIds = new Set(Array.isArray(saved.notifiedSideQuestIds) ? saved.notifiedSideQuestIds : []);
    this.completedQuestHistory = Array.isArray(saved.completedQuestHistory) ? saved.completedQuestHistory : [];
    (saved.mainQuest?.objectives ?? []).forEach((savedObjective) => {
      const objective = this.mainQuest.objectives.find((item) => item.id === savedObjective.id);
      if (objective) {
        objective.complete = Boolean(savedObjective.complete);
      }
    });
    const nextMainIndex = this.mainQuest.objectives.findIndex((objective) => !objective.complete);
    const fallbackMainIndex = nextMainIndex >= 0 ? nextMainIndex : this.mainQuest.objectives.length - 1;
    this.mainQuest.objectiveIndex = THREE.MathUtils.clamp(
      Number(saved.mainQuest?.objectiveIndex ?? fallbackMainIndex) || 0,
      0,
      this.mainQuest.objectives.length - 1,
    );
    (saved.quests ?? []).forEach((savedQuest) => {
      const quest = this.quests.find((item) => item.id === savedQuest.id);
      if (!quest) {
        return;
      }
      quest.progress = THREE.MathUtils.clamp(Number(savedQuest.progress) || 0, 0, quest.goal);
      quest.complete = Boolean(savedQuest.complete);
      quest.status = savedQuest.status ?? (quest.complete ? "completed" : quest.status);
    });
    this.finderActive = false;
    this.finderTarget = null;
    if (this.finderArrow) {
      this.finderArrow.visible = false;
    }
  }
}
