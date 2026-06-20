import { NPC } from "../entities/NPC.js";
import { SETTINGS } from "../config/settings.js";

const { THREE } = window;

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
      { id: "rowan-targets", title: "Rowan's Mark", objective: "Hit 10 targets", progress: 0, goal: 10, complete: false, reward: SETTINGS.progression.questRewards.rowanTargets },
      { id: "rowan-creatures", title: "Quiet the Brush", objective: "Defeat 4 creatures", progress: 0, goal: 4, complete: false, reward: SETTINGS.progression.questRewards.rowanCreatures },
      { id: "rowan-landmarks", title: "Know the Grounds", objective: "Discover key landmarks", progress: 0, goal: this.getTrainingLandmarks().length || 12, complete: false, reward: SETTINGS.progression.questRewards.rowanLandmarks },
    ];
    this.activeQuestIndex = 0;
    this.discoveredLandmarks = new Set();
    this.dialogueTimer = 0;
    this.toastTimer = 0;
    this.finderActive = false;
    this.finderTarget = null;
    this.finderArrow = this.createFinderArrow();
    this.bindFinderButton();
    this.updateTracker();
  }

  update(deltaSeconds, input) {
    this.trainer.update(this.player);
    this.trackLandmarkDiscovery();
    const nearTrainer = this.trainer.isPlayerNear(this.player);
    const nearbyInteractable = this.getNearbyInteractable();
    const showPrompt = nearTrainer || nearbyInteractable;
    this.ui.prompt.textContent = nearTrainer ? "E Talk" : nearbyInteractable?.prompt ?? "E Interact";
    this.ui.prompt.classList.toggle("visible", Boolean(showPrompt));

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
    this.updateTracker();
  }

  completeQuest(quest) {
    quest.complete = true;
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
      this.showDialogue(this.getQuestIntro(this.getActiveQuest()));
    } else {
      this.showDialogue("Good work. The woods remember careful feet.");
    }
  }

  getActiveQuest() {
    return this.quests[this.activeQuestIndex];
  }

  updateTracker() {
    const quest = this.getActiveQuest();
    if (!quest) {
      this.ui.title.textContent = "Training Complete";
      this.ui.objective.textContent = "Return to the clearing.";
      return;
    }

    this.ui.title.textContent = quest.title;
    this.ui.objective.textContent = quest.complete
      ? "Training complete"
      : `${quest.objective} (${quest.progress}/${quest.goal})`;
    this.updateFinderButton();
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
      return;
    }

    const previousProgress = quest.progress;
    const foundTrainingLandmarks = this.getTrainingLandmarks().filter((landmark) => this.discoveredLandmarks.has(landmark.id)).length;
    quest.progress = Math.min(quest.goal, foundTrainingLandmarks);
    if (changed || quest.progress !== previousProgress) {
      this.updateTracker();
    }
    if (!quest.complete && quest.progress >= quest.goal) {
      this.completeQuest(quest);
      this.updateTracker();
    }
  }

  getRelevantLandmarkObjective() {
    const quest = this.getActiveQuest();
    if (quest?.id !== "rowan-landmarks" || quest.complete || !this.world.landmarks?.length) {
      return null;
    }
    const playerPosition = this.player.group.position;
    return this.getTrainingLandmarks()
      .filter((landmark) => !this.discoveredLandmarks.has(landmark.id))
      .sort((a, b) => playerPosition.distanceTo(a.position) - playerPosition.distanceTo(b.position))[0] ?? null;
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
}
