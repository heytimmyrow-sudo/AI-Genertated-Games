import { SETTINGS } from "../config/settings.js";

const STORAGE_KEY = "echo-archer-world-map-v1";

const REGION_GROUPS = [
  { id: "forest", name: "Forest Heartland", match: /forest|watchtower|hidden-pond|ancient-ruins|hunters-cabin|cliff-overlook|whisper-cave|river-crossing|mountain-path|forgotten-grove|archers-guild|guild-village|hall-of-arrows|mountain-fortress|archers-lodge/ },
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
  { id: "forest", color: "rgba(91, 137, 77, 0.38)", match: /forest|watchtower|hidden-pond|ancient-ruins|hunters-cabin|cliff-overlook|whisper-cave|river-crossing|mountain-path|forgotten-grove|archers-guild|guild-village|hall-of-arrows|mountain-fortress|archers-lodge/ },
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
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.dragState = null;
    this.mapLayer = null;
    this.load();
    this.bindEvents();
    this.bindUi();
  }

  bindUi() {
    this.ui.close?.addEventListener("click", () => this.close());
    this.ui.zoomIn?.addEventListener("click", () => this.setZoom(this.zoom + 0.18));
    this.ui.zoomOut?.addEventListener("click", () => this.setZoom(this.zoom - 0.18));
    this.ui.reset?.addEventListener("click", () => this.centerOnPlayer());
    this.ui.canvas?.addEventListener("wheel", (event) => {
      if (!this.open) return;
      event.preventDefault();
      this.setZoom(this.zoom + (event.deltaY < 0 ? 0.12 : -0.12), true);
    }, { passive: false });
    this.ui.canvas?.addEventListener("pointerdown", (event) => {
      if (!this.open || event.target.closest?.(".map-icon")) return;
      this.dragState = { x: event.clientX, y: event.clientY, panX: this.pan.x, panY: this.pan.y };
      this.ui.canvas.setPointerCapture?.(event.pointerId);
      this.ui.canvas.classList.add("dragging");
    });
    this.ui.canvas?.addEventListener("pointermove", (event) => {
      if (!this.dragState) return;
      this.pan.x = this.dragState.panX + event.clientX - this.dragState.x;
      this.pan.y = this.dragState.panY + event.clientY - this.dragState.y;
      this.applyMapTransform();
    });
    window.addEventListener("pointerup", () => {
      this.dragState = null;
      this.ui.canvas?.classList.remove("dragging");
    });
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
    this.centerOnPlayer(false);
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
    this.dragState = null;
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
    this.mapLayer = document.createElement("div");
    this.mapLayer.className = "map-layer";
    this.ui.canvas.appendChild(this.mapLayer);
    this.addParchmentDetails();
    this.addUndiscoveredRegionGhosts();
    this.addRegionWashes();
    this.addRoutes();
    this.addDiscoveredRegions();
    this.addDiscoveredLandmarks();
    this.addPlayerMarker();
    this.addFogNote();
    this.applyMapTransform();
    this.renderDetails();
  }

  addToMap(element) {
    (this.mapLayer ?? this.ui.canvas).appendChild(element);
  }

  addParchmentDetails() {
    const compass = document.createElement("span");
    compass.className = "map-compass";
    compass.innerHTML = "<b>N</b><i></i>";
    const guildMark = document.createElement("span");
    guildMark.className = "map-guild-mark";
    guildMark.innerHTML = "<i></i><b></b><em></em>";
    const annotation = document.createElement("span");
    annotation.className = "map-annotation";
    annotation.textContent = "Guild survey ink - routes verified by field archers";
    this.addToMap(compass);
    this.addToMap(guildMark);
    this.addToMap(annotation);
  }

  addUndiscoveredRegionGhosts() {
    this.world.regions?.forEach((region, index) => {
      if (this.discoveredRegions.has(region.id)) return;
      if (index % 4 !== 0) return;
      const coords = this.worldToMap(region.center);
      const area = document.createElement("span");
      area.className = "map-region-ghost";
      area.style.left = `${coords.x}%`;
      area.style.top = `${coords.y}%`;
      area.style.width = `${Math.max(5, Math.min(14, (region.radius ?? 12) * 0.42))}%`;
      area.style.height = `${Math.max(4, Math.min(10, (region.radius ?? 12) * 0.28))}%`;
      area.style.setProperty("--region-tilt", `${(index % 7) * 6 - 18}deg`);
      this.addToMap(area);
    });
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
    this.addToMap(route);
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
      this.addToMap(area);
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
        glyph: ".",
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
      const illustration = this.getLandmarkIllustration(landmark, shrine);
      this.addIcon({
        id: landmark.id,
        name: landmark.name,
        position: landmark.position,
        type: shrine ? "shrine" : "landmark",
        glyph: this.getGlyphForLandmark(landmark, shrine, bossDefeated),
        illustration,
        classes: [illustration, bossDefeated ? "boss-defeated" : "", questTarget ? "quest" : "", this.isFastTravelPoint(landmark) ? "travel-post" : ""].filter(Boolean),
      });
    });
  }

  addPlayerMarker() {
    this.addIcon({
      id: "player-location",
      name: "You",
      position: this.player.group.position,
      type: "player",
      glyph: "^",
    });
  }

  addIcon({ id, name, position, type, glyph, classes = [], style = null, illustration = "" }) {
    const coords = this.worldToMap(position);
    const button = document.createElement("button");
    button.type = "button";
    button.className = ["map-icon", type, style ? `map-region-${style.id}` : "", ...classes].filter(Boolean).join(" ");
    button.style.left = `${coords.x}%`;
    button.style.top = `${coords.y}%`;
    if (style?.color) {
      button.style.setProperty("--region-color", style.color);
    }
    button.innerHTML = illustration
      ? `<span class="map-illustration-mark" aria-hidden="true"></span><span class="map-icon-code">${glyph}</span>`
      : `<span class="map-icon-code">${glyph}</span>`;
    button.title = name;
    button.addEventListener("click", () => {
      this.selectedDestinationId = id;
      this.renderDetails();
    });
    const label = document.createElement("span");
    label.className = "map-label";
    label.style.left = `${coords.x}%`;
    label.style.top = `${coords.y}%`;
    label.textContent = name;
    this.addToMap(button);
    this.addToMap(label);
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
    const destination = this.getDestinationById(this.selectedDestinationId) ?? this.getMapDestinations()[0];
    const questDestination = this.getQuestDestination();
    const progress = this.getRegionProgress();
    const progressItems = progress
      .map((item) => `<li>${item.name}: ${item.landmarks} landmarks - ${item.shrines} temples - ${item.bosses} bosses</li>`)
      .join("");
    this.ui.details.innerHTML = `
      <h3>${destination?.name ?? "World Map"}</h3>
      <p>${this.getDestinationDescription(destination)}</p>
      <button class="map-fast-travel" type="button" ${this.canFastTravel(destination) ? "" : "disabled"}>${this.canFastTravel(destination) ? "Travel from guild post" : "No travel post"}</button>
      <h3>Current Objective</h3>
      <p>${this.getQuestSummary()}${questDestination ? ` Destination: ${questDestination.name}.` : ""}</p>
      <h3>Region Progress</h3>
      <ul>${progressItems}</ul>
      <h3>Journal Summary</h3>
      <p>${this.completedQuests.size} quests - ${this.defeatedBosses.size} bosses - ${this.collectedBows.size} legendary bows</p>
    `;
    this.ui.details.querySelector(".map-fast-travel")?.addEventListener("click", () => this.fastTravelTo(destination?.id));
  }

  getDestinationDescription(destination) {
    if (!destination) return "Open the map as you explore to reveal more routes.";
    if (destination.id === "player-location") return "Your current location.";
    return this.canFastTravel(destination)
      ? "A guild-approved travel post. Fast travel is available when safe."
      : "Marked in your explorer's notes. Reach it by traveling the roads, trails, and wild routes.";
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
    return this.getMapDestinations().filter((destination) => this.isFastTravelPoint(destination) && this.isDestinationAllowedByStory(destination));
  }

  getMapDestinations() {
    return (this.world.landmarks ?? [])
      .filter((landmark) => this.discoveredLandmarks.has(landmark.id))
      .concat((this.world.regions ?? [])
        .filter((region) => this.discoveredRegions.has(region.id) && this.isRegionHub(region))
        .map((region) => ({ id: region.id, name: region.name, position: region.center, radius: region.radius })));
  }

  isRegionHub(region) {
    return /forest-meadow|guild-village|archers-guild|hall-of-arrows|mountain-fortress|archers-lodge|frontier-outpost|frontier-plains|river-crossing|mountain-path|forgotten-grove/.test(region.id);
  }

  getDestinationById(id) {
    return this.getMapDestinations().find((item) => item.id === id);
  }

  canFastTravel(destination) {
    if (!destination || destination.id === "player-location") return false;
    if (this.player.defeated || this.player.stats?.health <= 0) return false;
    if (this.systems.isCombatActive?.()) return false;
    if (!this.isFastTravelPoint(destination)) return false;
    if (!this.isDestinationAllowedByStory(destination)) return false;
    return this.discoveredLandmarks.has(destination.id) || this.discoveredRegions.has(destination.id);
  }

  isDestinationAllowedByStory(destination = {}) {
    const id = destination.id ?? "";
    const quests = this.systems.quests;
    const phase = quests?.getStoryPhase?.() ?? "opening";
    const opening = /forest-meadow|watchtower|hidden-pond|ancient-ruins|hunters-cabin|cliff-overlook|whisper-cave|river-crossing|mountain-path|forgotten-grove|archers-guild|guild-village/.test(id);
    if (phase === "opening") return opening;
    if (phase === "arc1-fortress") return opening || /mountain-fortress|hall-of-arrows|archers-lodge/.test(id);
    if (/frontier|whispering|stone-circle|kings-road|greenwater|forgotten-camp/.test(id)) return phase !== "opening" && phase !== "arc1-fortress";
    if (/lost-kingdom|kings-gate|sun-temple|forgotten-plaza|watchers-tower|hall-of-echoes|sealed-archive/.test(id)) return Boolean(quests?.hasCompletedMainObjective?.("frontier-expedition"));
    if (/celestial-expanse|observatory|skyfall|crystal-sea|floating-reach|starforge|first-sky/.test(id)) return Boolean(quests?.hasCompletedMainObjective?.("lost-kingdom"));
    if (/frost|coastal|mistwood|blackwater|red-canyon|ashen|starfall|shattered-coast|veiled-wilds/.test(id)) return Boolean(quests?.hasCompletedMainObjective?.("master-trials"));
    return true;
  }

  fastTravelTo(id) {
    const destination = this.getDestinationById(id);
    if (!this.canFastTravel(destination)) {
      const lockedByStory = destination && !this.isDestinationAllowedByStory(destination);
      this.showToast(this.systems.isCombatActive?.() ? "Cannot fast travel during combat" : lockedByStory ? "That road opens in a later chapter" : "Destination not discovered");
      return;
    }
    this.ui.fade?.classList.add("visible");
    this.close();
    window.setTimeout(() => {
      const landing = destination.position.clone();
      const offset = destination.radius ? Math.min(3.5, destination.radius * 0.35) : 2.4;
      landing.x += offset;
      landing.z += offset * 0.35;
      const groundY = Math.max(
        this.world.terrain.getHeightAt(landing.x, landing.z),
        this.world.getPlatformHeightAt?.(landing.x, landing.z) ?? -Infinity,
      );
      landing.y = groundY + SETTINGS.player.height / 2;
      this.player.group.position.copy(landing);
      this.player.velocity?.set?.(0, 0, 0);
      this.player.onGround = true;
      this.player.lastGroundY = groundY;
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

  isFastTravelPoint(destination = {}) {
    const id = destination.id ?? "";
    const name = destination.name ?? "";
    return /camp|guild|village|town|outpost|settlement|hall-of-arrows|mountain-fortress|archers-lodge|hunters-cabin|frontier-outpost/i.test(`${id} ${name}`);
  }

  getGlyphForLandmark(landmark, shrine, bossDefeated) {
    if (bossDefeated) return "OK";
    if (landmark.id === "mountain-fortress") return "FORT";
    if (landmark.id === "guild-village" || landmark.id === "archers-guild") return "H";
    if (landmark.id === "hall-of-arrows") return "T";
    if (shrine) return "*";
    if (/tower|watch/i.test(landmark.name)) return "W";
    if (/cave|cavern/i.test(landmark.name)) return "C";
    return ".";
  }

  getLandmarkIllustration(landmark, shrine) {
    const text = `${landmark.id} ${landmark.name}`.toLowerCase();
    if (text.includes("mountain-fortress")) return "illustration-fortress";
    if (/guild|village|town|outpost|camp|cabin|lodge|hall-of-arrows/.test(text)) return "illustration-town";
    if (/observatory|starfall|celestial|skyfall|starforge|first-sky|astral/.test(text)) return "illustration-observatory";
    if (/coast|cove|shipwreck|lighthouse|beacon|sea|drowned|tide|wreckers/.test(text)) return "illustration-coast";
    if (shrine) return "illustration-shrine";
    if (/ruin|king|temple|archive|citadel|gate|plaza|sentinel|circle|arch/.test(text)) return "illustration-ruin";
    if (/tower|watch|spire/.test(text)) return "illustration-tower";
    if (/cave|cavern|hollow/.test(text)) return "illustration-cave";
    return "illustration-landmark";
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

  setZoom(nextZoom, silent = false) {
    this.zoom = THREE.MathUtils.clamp(nextZoom, 0.82, 2.25);
    this.applyMapTransform();
    if (!silent) this.playUiClick();
  }

  centerOnPlayer(resetZoom = true) {
    if (resetZoom) this.zoom = 1;
    const coords = this.worldToMap(this.player.group.position);
    const rect = this.ui.canvas?.getBoundingClientRect?.();
    if (rect) {
      this.pan.x = (50 - coords.x) * rect.width * 0.01 * this.zoom;
      this.pan.y = (50 - coords.y) * rect.height * 0.01 * this.zoom;
    } else {
      this.pan = { x: 0, y: 0 };
    }
    this.applyMapTransform();
  }

  applyMapTransform() {
    if (!this.mapLayer) return;
    this.mapLayer.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        discoveredLandmarks: [...this.discoveredLandmarks],
        discoveredRegions: [...this.discoveredRegions],
        completedShrines: [...this.completedShrines],
        defeatedBosses: [...this.defeatedBosses],
        collectedBows: [...this.collectedBows],
        completedQuests: [...this.completedQuests],
      }));
    } catch (error) {
      console.warn("World map save failed:", error);
    }
  }
}
