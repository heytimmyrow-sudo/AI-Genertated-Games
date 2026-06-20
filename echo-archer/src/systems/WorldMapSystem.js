const STORAGE_KEY = "echo-archer-world-map-v1";

const REGION_GROUPS = [
  { id: "forest", name: "Forest Heartland", match: /forest|watchtower|hidden-pond|ancient-ruins|hunters-cabin|cliff-overlook|whisper-cave|river-crossing|mountain-path|forgotten-grove|archers-guild|guild-village|hall-of-arrows/ },
  { id: "frostpeak", name: "Frostpeak Mountains", match: /frost|icefall|summit/ },
  { id: "coastal", name: "Coastal Cliffs", match: /coastal|lighthouse|sea-cave|shipwreck|windspire/ },
  { id: "mistwood", name: "Mistwood", match: /mistwood|elder-tree|moonlit|forgotten-shrine|rootfall|echo-grove/ },
  { id: "blackwater", name: "Blackwater Marsh", match: /blackwater|sunken|mosswatch|crooked|drowned|witchlight/ },
  { id: "red-canyon", name: "Red Canyon", match: /red-canyon|skybridge|crimson|forgotten-outpost|sunspire|echo-chasm/ },
  { id: "ashen-highlands", name: "Ashen Highlands", match: /ashen|ember|obsidian|ashfall|firewatch|molten/ },
  { id: "starfall-vale", name: "Starfall Vale", match: /starfall|moonspire|celestial-basin|sky-bridge|crystalheart|astral/ },
  { id: "frontier-plains", name: "Frontier Plains", match: /frontier|whispering|stone-circle|kings-road|greenwater|forgotten-camp|ironhorn/ },
  { id: "lost-kingdom", name: "The Lost Kingdom", match: /lost-kingdom|kings-gate|sun-temple|forgotten-plaza|watchers-tower|hall-of-echoes|sealed-archive|sentinel/ },
  { id: "celestial-expanse", name: "The Celestial Expanse", match: /celestial-expanse|observatory-prime|skyfall-basin|crystal-sea|floating-reach|starforge|first-sky|skybound|voidstar/ },
  { id: "shattered-coast", name: "Shattered Coast", match: /shattered-coast|stormwatch|broken-beacon|tidefall|sea-gate|wreckers|drowned-citadel|tidebound|stormcaller/ },
  { id: "veiled-wilds", name: "The Veiled Wilds", match: /veiled-wilds|worldroot|hidden-lake|greenheart|sleeping-arch|mistveil|forgotten-circle-wilds|grovekeeper|whisperbranch/ },
];

const REGION_STYLES = [
  { id: "forest", color: "rgba(91, 137, 77, 0.38)", match: /forest|watchtower|hidden-pond|ancient-ruins|hunters-cabin|cliff-overlook|whisper-cave|river-crossing|mountain-path|forgotten-grove|archers-guild|guild-village|hall-of-arrows/ },
  { id: "frostpeak", color: "rgba(166, 218, 238, 0.44)", match: /frost|icefall|summit/ },
  { id: "coastal", color: "rgba(93, 172, 190, 0.38)", match: /coastal|lighthouse|sea-cave|shipwreck|windspire|shattered|stormwatch|beacon|tidefall|sea-gate|wreckers|drowned-citadel/ },
  { id: "mistwood", color: "rgba(98, 132, 103, 0.42)", match: /mistwood|elder-tree|moonlit|forgotten-shrine|rootfall|echo-grove|veiled|worldroot|hidden-lake|greenheart|sleeping-arch|mistveil|forgotten-circle-wilds/ },
  { id: "marsh", color: "rgba(76, 120, 99, 0.46)", match: /blackwater|sunken|mosswatch|crooked|drowned|witchlight/ },
  { id: "canyon", color: "rgba(200, 112, 59, 0.4)", match: /red-canyon|skybridge|crimson|forgotten-outpost|sunspire|echo-chasm/ },
  { id: "ashen", color: "rgba(179, 84, 55, 0.4)", match: /ashen|ember|obsidian|ashfall|firewatch|molten/ },
  { id: "frontier", color: "rgba(186, 169, 86, 0.36)", match: /frontier|whispering|stone-circle|kings-road|greenwater|forgotten-camp|ironhorn/ },
  { id: "kingdom", color: "rgba(156, 135, 184, 0.38)", match: /lost-kingdom|kings-gate|sun-temple|forgotten-plaza|watchers-tower|hall-of-echoes|sealed-archive|sentinel/ },
  { id: "celestial", color: "rgba(125, 134, 230, 0.4)", match: /celestial|observatory|skyfall|crystal-sea|floating-reach|starforge|first-sky|skybound|voidstar|starfall|astral/ },
];

const { THREE } = window;

export class WorldMapSystem {
  constructor(world, player, ui, systems = {}) {
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.systems = systems;
    this.open = false;
    this.selectedDestinationId = "guild-village";
    this.discoveredLandmarks = new Set(["archers-guild", "guild-village"]);
    this.discoveredRegions = new Set(["forest-meadow", "archers-guild", "guild-village"]);
    this.completedShrines = new Set();
    this.defeatedBosses = new Set();
    this.collectedBows = new Set();
    this.completedQuests = new Set();
    this.load();
    this.bindEvents();
    this.bindUi();
  }

  bindUi() {
    this.ui.close?.addEventListener("click", () => this.close());
  }

  bindEvents() {
    window.addEventListener("echo-archer:journal-landmark", (event) => {
      this.discoverRegion(event.detail?.id);
    });
    window.addEventListener("echo-archer:region-discovered", (event) => {
      this.discoverRegion(event.detail?.id);
    });
    window.addEventListener("echo-archer:landmark-discovered", (event) => {
      this.discoverLandmark(event.detail?.id);
    });
    window.addEventListener("echo-archer:challenge-complete", (event) => {
      const id = event.detail?.id ?? "";
      if (id.startsWith("shrine") || /temple|shrine/i.test(event.detail?.label ?? "")) {
        this.completedShrines.add(id);
        this.save();
        this.render();
      }
    });
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      if (event.detail?.type) {
        this.defeatedBosses.add(event.detail.type);
        this.save();
        this.render();
      }
    });
    window.addEventListener("echo-archer:quest-reward", (event) => {
      if (event.detail?.questId) {
        this.completedQuests.add(event.detail.questId);
        this.save();
        this.render();
      }
    });
    window.addEventListener("echo-archer:rare-loot", (event) => {
      const name = event.detail?.name ?? "";
      if (/frostbite|stormcaller|sunpiercer|whisperwind|whisperbranch|tidepiercer|bogpiercer|infernoheart|starpiercer|windrunner|kingmaker|voidstar/i.test(name)) {
        this.collectedBows.add(name.toLowerCase().replaceAll(" ", "-"));
        this.save();
        this.render();
      }
    });
  }

  update(input) {
    if (input.wasPressed("KeyM")) {
      this.toggle();
    }
    if (input.wasPressed("Escape") && this.open) {
      this.close();
    }
    this.trackCurrentDiscovery();
  }

  toggle() {
    this.open ? this.close() : this.openMap();
  }

  openMap() {
    this.open = true;
    this.ui.menu.classList.add("visible");
    document.body.classList.add("map-open");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.render();
    this.playUiClick();
  }

  close() {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.ui.menu.classList.remove("visible");
    document.body.classList.remove("map-open");
    this.playUiClick();
  }

  trackCurrentDiscovery() {
    const region = this.world.getRegionAt?.(this.player.group.position);
    if (region) {
      this.discoverRegion(region.id, false);
    }
    this.world.landmarks?.forEach((landmark) => {
      if (this.player.group.position.distanceTo(landmark.position) <= landmark.radius) {
        this.discoverLandmark(landmark.id, false);
      }
    });
  }

  discoverRegion(id, rerender = true) {
    if (!id || this.discoveredRegions.has(id)) {
      return;
    }
    this.discoveredRegions.add(id);
    this.save();
    if (rerender) this.render();
  }

  discoverLandmark(id, rerender = true) {
    if (!id || this.discoveredLandmarks.has(id)) {
      return;
    }
    this.discoveredLandmarks.add(id);
    this.save();
    if (rerender) this.render();
  }

  render() {
    if (!this.open || !this.ui.canvas || !this.ui.details) {
      return;
    }
    this.ui.canvas.innerHTML = "";
    this.addRegionWashes();
    this.addRoutes();
    this.addDiscoveredRegions();
    this.addDiscoveredLandmarks();
    this.addPlayerMarker();
    this.addFogNote();
    this.renderDetails();
  }

  addRoutes() {
    const points = this.getFastTravelDestinations();
    for (let index = 0; index < points.length - 1; index += 1) {
      this.addRoute(points[index].position, points[index + 1].position);
    }
  }

  addRoute(from, to) {
    const a = this.worldToMap(from);
    const b = this.worldToMap(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const route = document.createElement("span");
    route.className = "map-route";
    route.style.left = `${a.x}%`;
    route.style.top = `${a.y}%`;
    route.style.width = `${Math.hypot(dx, dy)}%`;
    route.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    this.ui.canvas.appendChild(route);
  }

  addRegionWashes() {
    this.world.regions?.forEach((region, index) => {
      if (!this.discoveredRegions.has(region.id)) {
        return;
      }

      const coords = this.worldToMap(region.center);
      const style = this.getRegionStyle(region.id);
      const radius = Math.max(7, Math.min(22, ((region.radius ?? 12) / (this.world.size ?? 260)) * 130));
      const area = document.createElement("span");
      area.className = `map-region-area map-region-${style.id}`;
      area.dataset.label = region.name;
      area.style.left = `${coords.x}%`;
      area.style.top = `${coords.y}%`;
      area.style.width = `${radius * 1.45}%`;
      area.style.height = `${radius}%`;
      area.style.setProperty("--region-color", style.color);
      area.style.setProperty("--region-tilt", `${(index % 5) * 7 - 14}deg`);
      this.ui.canvas.appendChild(area);
    });
  }

  addDiscoveredRegions() {
    this.world.regions?.forEach((region) => {
      if (!this.discoveredRegions.has(region.id)) {
        return;
      }
      const style = this.getRegionStyle(region.id);
      this.addIcon({
        id: region.id,
        name: region.name,
        position: region.center,
        type: "region",
        style,
        glyph: "•",
      });
    });
  }

  addDiscoveredLandmarks() {
    this.world.landmarks?.forEach((landmark) => {
      if (!this.discoveredLandmarks.has(landmark.id)) {
        return;
      }
      const shrine = /shrine|temple/i.test(landmark.name);
      const bossDefeated = this.isBossLandmarkDefeated(landmark.id);
      const questTarget = this.getQuestDestination()?.id === landmark.id;
      this.addIcon({
        id: landmark.id,
        name: landmark.name,
        position: landmark.position,
        type: shrine ? "shrine" : "landmark",
        glyph: this.getGlyphForLandmark(landmark, shrine, bossDefeated),
        classes: [bossDefeated ? "boss-defeated" : "", questTarget ? "quest" : ""].filter(Boolean),
        fastTravel: true,
      });
    });
  }

  addPlayerMarker() {
    this.addIcon({
      id: "player-location",
      name: "You",
      position: this.player.group.position,
      type: "player",
      glyph: "▲",
    });
  }

  addIcon({ id, name, position, type, glyph, classes = [], fastTravel = false, style = null }) {
    const coords = this.worldToMap(position);
    const button = document.createElement("button");
    button.type = "button";
    button.className = ["map-icon", type, style ? `map-region-${style.id}` : "", ...classes].filter(Boolean).join(" ");
    button.style.left = `${coords.x}%`;
    button.style.top = `${coords.y}%`;
    if (style?.color) {
      button.style.setProperty("--region-color", style.color);
    }
    button.textContent = glyph;
    button.title = name;
    button.addEventListener("click", () => {
      this.selectedDestinationId = id;
      this.renderDetails();
      if (fastTravel) {
        this.fastTravelTo(id);
      }
    });
    const label = document.createElement("span");
    label.className = "map-label";
    label.style.left = `${coords.x}%`;
    label.style.top = `${coords.y}%`;
    label.textContent = name;
    this.ui.canvas.append(button, label);
  }

  addFogNote() {
    const note = document.createElement("p");
    note.className = "map-fog-note";
    const hidden = (this.world.landmarks?.length ?? 0) - this.discoveredLandmarks.size;
    note.textContent = hidden > 0
      ? `${hidden} landmark${hidden === 1 ? "" : "s"} remain hidden by parchment fog.`
      : "All known landmarks are marked. Secret places can still emerge later.";
    this.ui.canvas.appendChild(note);
  }

  renderDetails() {
    const destination = this.getDestinationById(this.selectedDestinationId) ?? this.getFastTravelDestinations()[0];
    const questDestination = this.getQuestDestination();
    const progress = this.getRegionProgress();
    this.ui.details.innerHTML = `
      <h3>${destination?.name ?? "World Map"}</h3>
      <p>${this.getDestinationDescription(destination)}</p>
      <button class="map-fast-travel" type="button" ${this.canFastTravel(destination) ? "" : "disabled"}>Fast Travel</button>
      <h3>Current Objective</h3>
      <p>${this.getQuestSummary()}${questDestination ? ` Destination: ${questDestination.name}.` : ""}</p>
      <h3>Region Progress</h3>
      <ul>${progress.map((item) => `<li>${item.name}: ${item.landmarks} landmarks • ${item.shrines} shrines • ${item.bosses} bosses</li>`).join("")}</ul>
      <h3>Journal Summary</h3>
      <p>${this.completedQuests.size} quests • ${this.defeatedBosses.size} bosses • ${this.collectedBows.size} legendary bows</p>
    `;
    this.ui.details.querySelector(".map-fast-travel")?.addEventListener("click", () => this.fastTravelTo(destination?.id));
  }

  getDestinationDescription(destination) {
    if (!destination) return "Open the map as you explore to reveal more routes.";
    if (destination.id === "player-location") return "Your current location.";
    return this.canFastTravel(destination)
      ? "Discovered destination. Fast travel is available when safe."
      : "Fast travel unlocks after discovery and only while out of combat.";
  }

  getQuestSummary() {
    const quest = this.systems.quests?.getActiveQuest?.();
    if (!quest) return "No active quest objective.";
    return `${quest.title}: ${quest.objective} (${quest.progress}/${quest.goal}).`;
  }

  getQuestDestination() {
    return this.systems.quests?.getRelevantLandmarkObjective?.() ?? null;
  }

  getFastTravelDestinations() {
    return (this.world.landmarks ?? [])
      .filter((landmark) => this.discoveredLandmarks.has(landmark.id))
      .concat((this.world.regions ?? [])
        .filter((region) => this.discoveredRegions.has(region.id) && this.isRegionHub(region))
        .map((region) => ({ id: region.id, name: region.name, position: region.center, radius: region.radius })));
  }

  isRegionHub(region) {
    return /forest-meadow|guild-village|hall-of-arrows|frostpeak-mountains|coastal-cliffs|mistwood|blackwater-marsh|red-canyon|ashen-highlands|starfall-vale|frontier-plains|frontier-outpost|lost-kingdom|kings-gate|celestial-expanse|observatory-prime|shattered-coast|stormwatch-fortress|veiled-wilds|worldroot-grove|river-crossing|mountain-path|forgotten-grove/.test(region.id);
  }

  getDestinationById(id) {
    return this.getFastTravelDestinations().find((item) => item.id === id);
  }

  canFastTravel(destination) {
    if (!destination || destination.id === "player-location") return false;
    if (this.player.defeated || this.player.stats?.health <= 0) return false;
    if (this.systems.isCombatActive?.()) return false;
    return this.discoveredLandmarks.has(destination.id) || this.discoveredRegions.has(destination.id);
  }

  fastTravelTo(id) {
    const destination = this.getDestinationById(id);
    if (!this.canFastTravel(destination)) {
      this.showToast(this.systems.isCombatActive?.() ? "Cannot fast travel during combat" : "Destination not discovered");
      return;
    }
    this.ui.fade?.classList.add("visible");
    this.close();
    window.setTimeout(() => {
      const landing = destination.position.clone();
      const offset = destination.radius ? Math.min(3.5, destination.radius * 0.35) : 2.4;
      landing.x += offset;
      landing.z += offset * 0.35;
      landing.y = this.world.terrain.getHeightAt(landing.x, landing.z);
      this.player.group.position.copy(landing);
      this.player.velocity?.set?.(0, 0, 0);
      this.showToast(`Fast traveled to ${destination.name}`);
      window.dispatchEvent(new CustomEvent("echo-archer:sound", { detail: { name: "questComplete", intensity: 0.44 } }));
      window.setTimeout(() => this.ui.fade?.classList.remove("visible"), 220);
    }, 240);
  }

  isBossLandmarkDefeated(id) {
    const bossByLandmark = {
      "old-watchtower": "barkhideStalker",
      "frozen-watchtower": "icefang",
      "broken-lighthouse": "stormtalon",
      "elder-tree": "rootGuardian",
      "sunken-shrine": "mirejaw",
      "sunspire-plateau": "stonehorn",
      "ember-peak": "infernoBehemoth",
      "astral-sanctum": "astralGuardian",
      "frontier-plains": "ironhorn",
      "frontier-outpost": "ironhorn",
      "lost-kingdom": "firstSentinel",
      "sealed-archive": "firstSentinel",
      "celestial-expanse": "skyboundWarden",
      "temple-first-sky": "skyboundWarden",
      "shattered-coast": "tideboundWarden",
      "drowned-citadel": "tideboundWarden",
      "veiled-wilds": "ancientGrovekeeper",
      "worldroot-grove": "ancientGrovekeeper",
    };
    return this.defeatedBosses.has(bossByLandmark[id]);
  }

  getGlyphForLandmark(landmark, shrine, bossDefeated) {
    if (bossDefeated) return "✓";
    if (landmark.id === "guild-village" || landmark.id === "archers-guild") return "⌂";
    if (landmark.id === "hall-of-arrows") return "⇧";
    if (shrine) return "✦";
    if (/tower|watch/i.test(landmark.name)) return "♜";
    if (/cave|cavern/i.test(landmark.name)) return "◆";
    return "●";
  }

  getRegionProgress() {
    return REGION_GROUPS.map((group) => {
      const landmarks = (this.world.landmarks ?? []).filter((landmark) => group.match.test(landmark.id) && this.discoveredLandmarks.has(landmark.id));
      const shrines = landmarks.filter((landmark) => /shrine|temple/i.test(landmark.name));
      const bosses = [...this.defeatedBosses].filter((boss) => (
        (group.id === "forest" && boss === "barkhideStalker")
        || (group.id === "frostpeak" && boss === "icefang")
        || (group.id === "coastal" && boss === "stormtalon")
        || (group.id === "mistwood" && boss === "rootGuardian")
        || (group.id === "blackwater" && boss === "mirejaw")
        || (group.id === "red-canyon" && boss === "stonehorn")
        || (group.id === "ashen-highlands" && boss === "infernoBehemoth")
        || (group.id === "starfall-vale" && boss === "astralGuardian")
        || (group.id === "frontier-plains" && boss === "ironhorn")
        || (group.id === "lost-kingdom" && boss === "firstSentinel")
        || (group.id === "celestial-expanse" && boss === "skyboundWarden")
        || (group.id === "shattered-coast" && boss === "tideboundWarden")
        || (group.id === "veiled-wilds" && boss === "ancientGrovekeeper")
      ));
      return { name: group.name, landmarks: landmarks.length, shrines: shrines.length, bosses: bosses.length };
    });
  }

  getRegionStyle(id = "") {
    return REGION_STYLES.find((style) => style.match.test(id)) ?? REGION_STYLES[0];
  }

  worldToMap(position) {
    const size = this.world.size ?? 260;
    return {
      x: THREE.MathUtils.clamp(((position.x + size / 2) / size) * 100, 3, 97),
      y: THREE.MathUtils.clamp(((position.z + size / 2) / size) * 100, 3, 97),
    };
  }

  showToast(text) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove("visible");
    void this.ui.toast.offsetWidth;
    this.ui.toast.classList.add("visible");
  }

  playUiClick() {
    window.dispatchEvent(new CustomEvent("echo-archer:sound", {
      detail: { name: "uiClick", intensity: 0.56 },
    }));
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      this.discoveredLandmarks = new Set([...this.discoveredLandmarks, ...(saved.discoveredLandmarks ?? [])]);
      this.discoveredRegions = new Set([...this.discoveredRegions, ...(saved.discoveredRegions ?? [])]);
      this.completedShrines = new Set(saved.completedShrines ?? []);
      this.defeatedBosses = new Set(saved.defeatedBosses ?? []);
      this.collectedBows = new Set(saved.collectedBows ?? []);
      this.completedQuests = new Set(saved.completedQuests ?? []);
    } catch (error) {
      console.warn("World map save ignored:", error);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      discoveredLandmarks: [...this.discoveredLandmarks],
      discoveredRegions: [...this.discoveredRegions],
      completedShrines: [...this.completedShrines],
      defeatedBosses: [...this.defeatedBosses],
      collectedBows: [...this.collectedBows],
      completedQuests: [...this.completedQuests],
    }));
  }
}
