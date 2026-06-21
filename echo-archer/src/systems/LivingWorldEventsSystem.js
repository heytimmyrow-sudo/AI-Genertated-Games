const { THREE } = window;

const STORAGE_KEY = "echo-archer-living-world-events-v1";

const EVENT_DEFINITIONS = [
  {
    id: "archer-festival",
    name: "Archer Festival",
    location: "Guild Range",
    anchor: "guild",
    duration: 80,
    interval: 95,
    reward: { xp: 35, gold: 28, reputation: 18, villageReputation: 16 },
    targetBonus: { xp: 10, gold: 4, reputation: 2 },
    music: "questComplete",
    text: "Archers gather for trick shots, target rounds, and friendly wagers. Bullseyes earn extra festival praise while this event is active.",
    rumors: [
      "A veteran says the best archers practice when nobody is watching.",
      "Someone jokes that target paint is the guild's true currency.",
      "A young recruit whispers that the fortress range sounds different at dusk.",
    ],
  },
  {
    id: "harvest-festival",
    name: "Harvest Festival",
    location: "Guild Village",
    anchor: "village",
    duration: 72,
    interval: 110,
    reward: { xp: 20, gold: 22, reputation: 10, villageReputation: 30 },
    music: "uiClick",
    text: "Lanterns, crates, warm food, and travelers turn the village square into a softer place for a while.",
    rumors: [
      "The innkeeper says roads feel safer when people have reasons to travel them.",
      "Farmers compare weather signs and argue about which hill gets the first frost.",
      "A merchant claims festival discounts are mostly a state of mind.",
    ],
  },
  {
    id: "frontier-celebration",
    name: "Frontier Celebration",
    location: "Frontier Outpost",
    anchor: "frontier",
    duration: 70,
    interval: 120,
    reward: { xp: 28, gold: 30, reputation: 20, villageReputation: 18 },
    music: "questComplete",
    text: "Scouts, supply crews, and travelers swap reports near the frontier map station.",
    rumors: [
      "An explorer insists some old roads move in memory before they move underfoot.",
      "A scout returns with grassland dust and half a story about ruins beyond the hills.",
      "Someone marks a route twice, then quietly erases one line.",
    ],
  },
  {
    id: "guild-day",
    name: "Guild Day",
    location: "Mountain Fortress",
    anchor: "fortress",
    duration: 78,
    interval: 130,
    reward: { xp: 32, gold: 24, reputation: 34, villageReputation: 12 },
    music: "bossNotice",
    text: "Guild archers hold announcements, ceremonies, and training exhibitions below the fortress walls.",
    rumors: [
      "A senior archer says the fortress remembers every oath made in its shadow.",
      "Recruits keep their voices low near the old gates.",
      "The ceremony bell rings once for duty and once for those still on the road.",
    ],
  },
  {
    id: "victory-festival",
    name: "Victory Festival",
    location: "Archer's Lodge",
    anchor: "lodge",
    duration: 82,
    interval: 145,
    requiresMaster: true,
    reward: { xp: 45, gold: 35, reputation: 30, villageReputation: 35 },
    music: "questComplete",
    text: "Friends, travelers, and guild archers leave small keepsakes at the lodge in honor of hard-won victories.",
    rumors: [
      "Someone raises a cup to the Master Archer without making too much fuss.",
      "A traveler says your lodge is becoming a landmark in its own right.",
      "A quiet plaque waits for the next story worth remembering.",
    ],
  },
  {
    id: "merchant-caravan",
    name: "Merchant Caravan",
    location: "Roadside Trail",
    anchor: "road",
    duration: 62,
    interval: 105,
    reward: { xp: 18, gold: 36, reputation: 8, villageReputation: 10 },
    music: "uiClick",
    text: "A small caravan pauses on the road with crates, gossip, and a careful eye on the treeline.",
    rumors: [
      "The caravan master swears every region has one road that locals pretend not to know.",
      "A pack animal refuses to face the mountains. Nobody laughs for very long.",
      "Fresh supplies mean busier roads by morning.",
    ],
  },
];

export class LivingWorldEventsSystem {
  constructor(scene, world, player, ui = {}, systems = {}) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.systems = systems;
    this.elapsed = 0;
    this.eventTimer = 0;
    this.nextEventTimer = 14;
    this.eventIndex = 0;
    this.activeEvent = null;
    this.activeRewardClaimed = false;
    this.targetHitsThisEvent = 0;
    this.masterArcher = false;
    this.decorGroups = new Map();
    this.eventInteractables = new Map();
    this.load();
    this.createEventSpaces();
    this.bindEvents();
    this.applyVisibility();
  }

  bindEvents() {
    window.addEventListener("echo-archer:master-archer-complete", () => {
      this.masterArcher = true;
      this.save();
    });

    window.addEventListener("echo-archer:target-hit", (event) => {
      if (this.activeEvent?.id !== "archer-festival") return;
      this.targetHitsThisEvent += 1;
      const score = event.detail?.score;
      const bonus = this.activeEvent.targetBonus;
      const bullseyeBoost = score?.bullseye ? 2 : 1;
      if (this.targetHitsThisEvent <= 8) {
        this.systems.progression?.addXp?.((bonus.xp ?? 0) * bullseyeBoost);
        this.systems.economy?.addGold?.((bonus.gold ?? 0) * bullseyeBoost, "Festival shot purse");
        this.systems.economy?.addReputation?.((bonus.reputation ?? 0) * bullseyeBoost, "Festival applause");
        this.showToast(score?.bullseye ? "Festival bullseye!" : "Festival shot counted");
      }
    });
  }

  createEventSpaces() {
    EVENT_DEFINITIONS.forEach((event) => {
      const anchor = this.getAnchor(event.anchor);
      const group = this.createDecorGroup(event, anchor);
      this.decorGroups.set(event.id, group);
      this.scene.add(group);

      const interactable = {
        id: `living-event-${event.id}`,
        type: "lore-note",
        name: event.name,
        prompt: "E Join event",
        position: new THREE.Vector3(anchor.x, this.world.terrain.getHeightAt(anchor.x, anchor.z) + 0.95, anchor.z),
        radius: 5.2,
        hidden: true,
        text: `${event.text} ${event.rumors[0]}`,
      };
      this.world.interactables.push(interactable);
      this.eventInteractables.set(event.id, interactable);
    });
  }

  createDecorGroup(event, anchor) {
    const group = new THREE.Group();
    group.position.set(anchor.x, this.world.terrain.getHeightAt(anchor.x, anchor.z), anchor.z);
    group.rotation.y = anchor.yaw ?? 0;
    group.visible = false;
    group.userData.eventId = event.id;

    const palette = this.getEventPalette(event.id);
    const bannerMaterial = new THREE.MeshStandardMaterial({ color: palette.banner, roughness: 0.72, emissive: palette.glow, emissiveIntensity: 0.08 });
    const clothMaterial = new THREE.MeshStandardMaterial({ color: palette.cloth, roughness: 0.82 });
    const lanternMaterial = this.world.materials.warmWindow;

    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + 0.4;
      const radius = 3.2 + (index % 2) * 0.9;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.75, 7), this.world.materials.barkDark);
      pole.position.set(x, 0.9, z);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.035), bannerMaterial);
      banner.position.set(x, 1.55, z);
      banner.rotation.y = -angle + Math.PI / 2;
      banner.rotation.z = index % 2 ? 0.08 : -0.06;
      group.add(pole, banner);
    }

    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      const radius = 1.6 + (index % 3) * 0.42;
      const figure = this.createGatheringFigure(index, clothMaterial);
      figure.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      figure.rotation.y = -angle + Math.PI;
      group.add(figure);
    }

    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.85), this.world.materials.cutWood);
    table.position.set(0.15, 0.78, -1.9);
    table.rotation.y = 0.14;
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.04, 0.96), bannerMaterial);
    cloth.position.set(0.15, 0.9, -1.9);
    cloth.rotation.y = 0.14;
    group.add(table, cloth);

    if (event.id === "archer-festival") {
      [-0.7, 0, 0.7].forEach((offset) => {
        const miniTarget = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 18), this.world.materials.targetFace);
        miniTarget.position.set(offset, 1.28, -2.45);
        miniTarget.rotation.x = Math.PI / 2;
        group.add(miniTarget);
      });
    }

    if (event.anchor === "fortress") {
      const ceremonyRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 8, 42), this.world.materials.trophyBronze ?? this.world.materials.masterBronze);
      ceremonyRing.position.set(0, 0.12, 0);
      ceremonyRing.rotation.x = Math.PI / 2;
      group.add(ceremonyRing);
    }

    if (event.anchor === "lodge") {
      const keepsake = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.36, 0.42), this.world.materials.trophyBronze ?? this.world.materials.masterBronze);
      keepsake.position.set(0.9, 0.8, -1.45);
      keepsake.rotation.y = -0.25;
      group.add(keepsake);
    }

    for (let index = 0; index < 4; index += 1) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lanternMaterial);
      lantern.position.set(Math.cos(index * Math.PI / 2) * 2.6, 1.25, Math.sin(index * Math.PI / 2) * 2.6);
      group.add(lantern);
    }

    return group;
  }

  createGatheringFigure(index, clothMaterial) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.48, 5, 8), clothMaterial);
    body.position.y = 0.55;
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), this.world.materials.barkDark);
    hood.position.y = 0.94;
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 5), this.world.materials.cutWood);
    staff.position.set(index % 2 ? 0.17 : -0.17, 0.56, 0.08);
    staff.rotation.z = index % 2 ? -0.08 : 0.08;
    group.add(body, hood, staff);
    group.userData.baseY = 0;
    group.userData.seed = index * 0.73;
    return group;
  }

  update(deltaSeconds) {
    this.elapsed += deltaSeconds;
    if (this.activeEvent) {
      this.eventTimer -= deltaSeconds;
      this.updateActiveDecor(deltaSeconds);
      this.checkParticipationReward();
      if (this.eventTimer <= 0) {
        this.endEvent();
      }
      return;
    }

    this.nextEventTimer -= deltaSeconds;
    if (this.nextEventTimer <= 0) {
      this.startNextEvent();
    }
  }

  startNextEvent() {
    const available = EVENT_DEFINITIONS.filter((event) => !event.requiresMaster || this.masterArcher);
    const event = available[this.eventIndex % available.length];
    this.eventIndex += 1;
    this.activeEvent = event;
    this.eventTimer = event.duration;
    this.activeRewardClaimed = false;
    this.targetHitsThisEvent = 0;
    this.applyVisibility();
    this.showToast(`${event.name} now active at ${event.location}`);
    this.playSound(event.music, 0.58);
    this.save();
  }

  endEvent() {
    const nextDelay = this.activeEvent?.interval ?? 100;
    this.activeEvent = null;
    this.nextEventTimer = nextDelay;
    this.applyVisibility();
    this.save();
  }

  applyVisibility() {
    this.decorGroups.forEach((group, id) => {
      group.visible = this.activeEvent?.id === id;
    });
    this.eventInteractables.forEach((interactable, id) => {
      const active = this.activeEvent?.id === id;
      interactable.hidden = !active;
      if (active && this.activeEvent) {
        const rumor = this.activeEvent.rumors[Math.floor(this.elapsed / 9) % this.activeEvent.rumors.length];
        interactable.text = `${this.activeEvent.text} ${this.masterArcher ? "Some people nod with quiet respect when you pass." : ""} ${rumor}`.trim();
      }
    });
  }

  updateActiveDecor() {
    const group = this.decorGroups.get(this.activeEvent.id);
    if (!group?.visible) return;
    group.children.forEach((child, index) => {
      if (!child.userData?.seed && child.type !== "Group") return;
      const sway = Math.sin(this.elapsed * 1.6 + (child.userData.seed ?? index)) * 0.025;
      child.position.y = (child.userData.baseY ?? child.position.y) + Math.max(0, sway);
      child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, sway, 0.06);
    });
  }

  checkParticipationReward() {
    if (this.activeRewardClaimed || !this.activeEvent) return;
    const anchor = this.getAnchor(this.activeEvent.anchor);
    const distance = Math.hypot(this.player.group.position.x - anchor.x, this.player.group.position.z - anchor.z);
    if (distance > 8.5) return;
    this.activeRewardClaimed = true;
    const reward = this.activeEvent.reward;
    this.systems.progression?.addXp?.(reward.xp ?? 0);
    this.systems.economy?.addGold?.(reward.gold ?? 0, `${this.activeEvent.name} purse`);
    this.systems.economy?.addReputation?.(reward.reputation ?? 0, `${this.activeEvent.name} renown`);
    this.systems.economy?.addVillageReputation?.(reward.villageReputation ?? 0, `${this.activeEvent.name} goodwill`);
    this.showToast(`Joined ${this.activeEvent.name}`);
    if (this.activeEvent.id === "victory-festival") {
      this.systems.lodge?.state?.rareLoot?.add?.("victory-festival-keepsake");
      this.systems.lodge?.persistAndApply?.();
    }
  }

  getAnchor(anchorId) {
    const source = {
      guild: this.world.archersGuild,
      village: { x: this.world.archersGuild?.x ?? 0, z: (this.world.archersGuild?.z ?? 0) + 6, yaw: this.world.archersGuild?.yaw ?? 0 },
      frontier: this.world.frontierOutpost,
      fortress: this.world.mountainFortress,
      lodge: this.world.archersLodge,
      road: this.world.riverCrossing,
    }[anchorId] ?? this.world.archersGuild ?? { x: 0, z: 0, yaw: 0 };
    return source;
  }

  getEventPalette(id) {
    return {
      "archer-festival": { banner: 0xe6b75d, cloth: 0x2f5545, glow: 0x332000 },
      "harvest-festival": { banner: 0xd88443, cloth: 0x7b5f34, glow: 0x2a1500 },
      "frontier-celebration": { banner: 0xb89563, cloth: 0x5f7a41, glow: 0x251700 },
      "guild-day": { banner: 0x315d69, cloth: 0x2f5545, glow: 0x06141f },
      "victory-festival": { banner: 0xb88745, cloth: 0x4b4267, glow: 0x3a1d00 },
      "merchant-caravan": { banner: 0xb8553f, cloth: 0x8b6844, glow: 0x210600 },
    }[id] ?? { banner: 0xe6b75d, cloth: 0x6a4c32, glow: 0x241000 };
  }

  showToast(text) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
  }

  playSound(name, intensity = 0.5) {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name, intensity },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.eventIndex = Number.isFinite(saved.eventIndex) ? saved.eventIndex : this.eventIndex;
      this.masterArcher = Boolean(saved.masterArcher);
    } catch (error) {
      console.warn("Living world event save ignored:", error);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        eventIndex: this.eventIndex,
        masterArcher: this.masterArcher,
      }));
    } catch (error) {
      console.warn("Living world event save failed:", error);
    }
  }
}
