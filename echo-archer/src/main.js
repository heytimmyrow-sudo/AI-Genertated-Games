import { GameLoop } from "./core/GameLoop.js";
import { InputController } from "./core/InputController.js";
import { CameraRig } from "./systems/CameraRig.js";
import { ArcherySystem } from "./systems/ArcherySystem.js";
import { TargetPracticeSystem } from "./systems/TargetPracticeSystem.js";
import { EnemySystem } from "./systems/EnemySystem.js";
import { MiniBossSystem } from "./systems/MiniBossSystem.js";
import { FrostpeakBossSystem } from "./systems/FrostpeakBossSystem.js";
import { StormtalonBossSystem } from "./systems/StormtalonBossSystem.js";
import { RootGuardianBossSystem } from "./systems/RootGuardianBossSystem.js";
import { MirejawBossSystem } from "./systems/MirejawBossSystem.js";
import { StonehornBossSystem } from "./systems/StonehornBossSystem.js";
import { InfernoBehemothBossSystem } from "./systems/InfernoBehemothBossSystem.js";
import { AstralGuardianBossSystem } from "./systems/AstralGuardianBossSystem.js";
import { IronhornBossSystem } from "./systems/IronhornBossSystem.js";
import { FirstSentinelBossSystem } from "./systems/FirstSentinelBossSystem.js";
import { SkyboundWardenBossSystem } from "./systems/SkyboundWardenBossSystem.js";
import { TideboundWardenBossSystem } from "./systems/TideboundWardenBossSystem.js";
import { AncientGrovekeeperBossSystem } from "./systems/AncientGrovekeeperBossSystem.js";
import { QuestSystem } from "./systems/QuestSystem.js";
import { FrontierExpeditionSystem } from "./systems/FrontierExpeditionSystem.js";
import { LostKingdomQuestSystem } from "./systems/LostKingdomQuestSystem.js";
import { CelestialExpanseQuestSystem } from "./systems/CelestialExpanseQuestSystem.js";
import { ShatteredCoastQuestSystem } from "./systems/ShatteredCoastQuestSystem.js";
import { VeiledWildsQuestSystem } from "./systems/VeiledWildsQuestSystem.js";
import { ProgressionSystem } from "./systems/ProgressionSystem.js";
import { InventorySystem } from "./systems/InventorySystem.js";
import { SpecialArrowSystem } from "./systems/SpecialArrowSystem.js";
import { WeatherSystem } from "./systems/WeatherSystem.js";
import { WindSystem } from "./systems/WindSystem.js";
import { WildlifeSystem } from "./systems/WildlifeSystem.js";
import { MountSystem } from "./systems/MountSystem.js";
import { EconomyGuildSystem } from "./systems/EconomyGuildSystem.js";
import { RPGProgressionSystem } from "./systems/RPGProgressionSystem.js";
import { AdventureJournalSystem } from "./systems/AdventureJournalSystem.js";
import { WorldMapSystem } from "./systems/WorldMapSystem.js";
import { PhotoModeSystem } from "./systems/PhotoModeSystem.js";
import { MasterArcherTrialsSystem } from "./systems/MasterArcherTrialsSystem.js";
import { FeedbackSystem } from "./systems/FeedbackSystem.js";
import { AudioManager } from "./systems/AudioManager.js";
import { World } from "./world/World.js";
import { PlayerController } from "./entities/PlayerController.js";

const { THREE } = window;

const canvas = document.querySelector("#game-canvas");
const cameraLabel = document.querySelector("#camera-mode");
const lockState = document.querySelector("#lock-state");
const levelState = document.querySelector("#level-state");
const xpState = document.querySelector("#xp-state");
const timeState = document.querySelector("#time-state");
const weatherState = document.querySelector("#weather-state");
const windState = document.querySelector("#wind-state");
const arrowState = document.querySelector("#arrow-state");
const goldState = document.querySelector("#gold-state");
const reputationState = document.querySelector("#reputation-state");
const guildRankState = document.querySelector("#guild-rank-state");
const challengeState = document.querySelector("#challenge-state");
const accuracyState = document.querySelector("#accuracy-state");
const regionState = document.querySelector("#region-state");
const reticle = document.querySelector("#reticle");
const scorePopups = document.querySelector("#score-popups");
const enemyBars = document.querySelector("#enemy-bars");
const bossHealth = document.querySelector("#boss-health");
const bossName = document.querySelector("#boss-name");
const bossHealthFill = document.querySelector("#boss-health-fill");
const playerHealthText = document.querySelector("#player-health-text");
const playerHealthFill = document.querySelector("#player-health-fill");
const questTitle = document.querySelector("#quest-title");
const questObjective = document.querySelector("#quest-objective");
const findLandmarkButton = document.querySelector("#find-landmark-button");
const interactionPrompt = document.querySelector("#interaction-prompt");
const dialogueBox = document.querySelector("#dialogue-box");
const dialogueSpeaker = document.querySelector("#dialogue-speaker");
const dialogueText = document.querySelector("#dialogue-text");
const questToast = document.querySelector("#quest-toast");
const upgradeMenu = document.querySelector("#upgrade-menu");
const upgradePoints = document.querySelector("#upgrade-points");
const upgradeList = document.querySelector("#upgrade-list");
const inventoryMenu = document.querySelector("#inventory-menu");
const inventoryTabs = document.querySelector("#inventory-tabs");
const inventoryList = document.querySelector("#inventory-list");
const inventoryDetails = document.querySelector("#inventory-details");
const shopMenu = document.querySelector("#shop-menu");
const shopTitle = document.querySelector("#shop-title");
const shopDescription = document.querySelector("#shop-description");
const shopItems = document.querySelector("#shop-items");
const shopClose = document.querySelector("#shop-close");
const shopSell = document.querySelector("#shop-sell");
const questBoardMenu = document.querySelector("#quest-board-menu");
const questBoardItems = document.querySelector("#quest-board-items");
const questBoardClose = document.querySelector("#quest-board-close");
const skillTreeMenu = document.querySelector("#skill-tree-menu");
const skillPoints = document.querySelector("#skill-points");
const skillTree = document.querySelector("#skill-tree");
const characterStatsMenu = document.querySelector("#character-stats-menu");
const characterStatsBody = document.querySelector("#character-stats-body");
const mountMenu = document.querySelector("#mount-menu");
const mountBody = document.querySelector("#mount-body");
const worldMapMenu = document.querySelector("#world-map-menu");
const worldMapCanvas = document.querySelector("#world-map-canvas");
const worldMapDetails = document.querySelector("#world-map-details");
const worldMapClose = document.querySelector("#world-map-close");
const journalMenu = document.querySelector("#journal-menu");
const journalBody = document.querySelector("#journal-body");
const photoModeOverlay = document.querySelector("#photo-mode-overlay");
const masterCeremony = document.querySelector("#master-ceremony");
const muteToggle = document.querySelector("#mute-toggle");
const volumeSlider = document.querySelector("#volume-slider");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 420);
camera.position.set(0, 4, -8);

const input = new InputController(canvas);
const cameraRig = new CameraRig(camera);
const world = new World(scene);
const player = new PlayerController(scene, world);
const audio = new AudioManager({
  mute: muteToggle,
  volume: volumeSlider,
});
const feedback = new FeedbackSystem(scene, cameraRig);
const quests = new QuestSystem(scene, world, player, {
  title: questTitle,
  objective: questObjective,
  findButton: findLandmarkButton,
  prompt: interactionPrompt,
  dialogue: dialogueBox,
  speaker: dialogueSpeaker,
  text: dialogueText,
  toast: questToast,
});
const enemies = new EnemySystem(scene, world, { bars: enemyBars }, feedback);
const miniBoss = new MiniBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const frostBoss = new FrostpeakBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const stormBoss = new StormtalonBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const rootBoss = new RootGuardianBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const mirejawBoss = new MirejawBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const stonehornBoss = new StonehornBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const infernoBoss = new InfernoBehemothBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const astralBoss = new AstralGuardianBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const ironhornBoss = new IronhornBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const firstSentinelBoss = new FirstSentinelBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const skyboundWardenBoss = new SkyboundWardenBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const tideboundWardenBoss = new TideboundWardenBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const ancientGrovekeeperBoss = new AncientGrovekeeperBossSystem(scene, world, {
  bar: bossHealth,
  name: bossName,
  fill: bossHealthFill,
}, feedback);
const targetPractice = new TargetPracticeSystem(world, {
  challenge: challengeState,
  accuracy: accuracyState,
  popups: scorePopups,
});
const bossRouter = {
  handleArrowHit: (arrow) => {
    miniBoss.handleArrowHit(arrow);
    frostBoss.handleArrowHit(arrow);
    stormBoss.handleArrowHit(arrow);
    rootBoss.handleArrowHit(arrow);
    mirejawBoss.handleArrowHit(arrow);
    stonehornBoss.handleArrowHit(arrow);
    infernoBoss.handleArrowHit(arrow);
    astralBoss.handleArrowHit(arrow);
    ironhornBoss.handleArrowHit(arrow);
    firstSentinelBoss.handleArrowHit(arrow);
    skyboundWardenBoss.handleArrowHit(arrow);
    tideboundWardenBoss.handleArrowHit(arrow);
    ancientGrovekeeperBoss.handleArrowHit(arrow);
  },
  handleAreaArrowEffect: (arrow) => {
    miniBoss.handleAreaArrowEffect?.(arrow);
    frostBoss.handleAreaArrowEffect?.(arrow);
    stormBoss.handleAreaArrowEffect?.(arrow);
    rootBoss.handleAreaArrowEffect?.(arrow);
    mirejawBoss.handleAreaArrowEffect?.(arrow);
    stonehornBoss.handleAreaArrowEffect?.(arrow);
    infernoBoss.handleAreaArrowEffect?.(arrow);
    astralBoss.handleAreaArrowEffect?.(arrow);
    ironhornBoss.handleAreaArrowEffect?.(arrow);
    firstSentinelBoss.handleAreaArrowEffect?.(arrow);
    skyboundWardenBoss.handleAreaArrowEffect?.(arrow);
    tideboundWardenBoss.handleAreaArrowEffect?.(arrow);
    ancientGrovekeeperBoss.handleAreaArrowEffect?.(arrow);
  },
};
const archery = new ArcherySystem(scene, targetPractice, enemies, feedback, bossRouter);
const specialArrows = new SpecialArrowSystem({ label: arrowState });
archery.setArrowTypeSystem(specialArrows);
const wind = new WindSystem(world, { label: windState });
archery.setWindSystem(wind);
let weather = { update() {} };
try {
  weather = new WeatherSystem(scene, world, { label: weatherState });
} catch (error) {
  console.warn("Weather system disabled:", error);
}
const progression = new ProgressionSystem({
  level: levelState,
  xp: xpState,
  menu: upgradeMenu,
  points: upgradePoints,
  list: upgradeList,
  toast: questToast,
}, {
  player,
  archery,
});
const inventory = new InventorySystem({
  menu: inventoryMenu,
  tabs: inventoryTabs,
  list: inventoryList,
  details: inventoryDetails,
  toast: questToast,
}, {
  player,
  archery,
});
const economy = new EconomyGuildSystem(scene, world, player, {
  gold: goldState,
  reputation: reputationState,
  rank: guildRankState,
  prompt: interactionPrompt,
  dialogue: dialogueBox,
  speaker: dialogueSpeaker,
  text: dialogueText,
  toast: questToast,
  menu: shopMenu,
  title: shopTitle,
  description: shopDescription,
  items: shopItems,
  close: shopClose,
  sell: shopSell,
  questBoard: {
    menu: questBoardMenu,
    items: questBoardItems,
    close: questBoardClose,
  },
}, {
  inventory,
});
const mounts = new MountSystem(world, inventory, scene, player, { toast: questToast });
const rpg = new RPGProgressionSystem({
  skills: skillTreeMenu,
  skillPoints,
  skillTree,
  stats: characterStatsMenu,
  statsBody: characterStatsBody,
  mounts: mountMenu,
  mountBody,
  toast: questToast,
}, {
  player,
  archery,
  inventory,
  mounts,
});
inventory.systems.rpg = rpg;
const journal = new AdventureJournalSystem({
  menu: journalMenu,
  body: journalBody,
});
const worldMap = new WorldMapSystem(world, player, {
  menu: worldMapMenu,
  canvas: worldMapCanvas,
  details: worldMapDetails,
  close: worldMapClose,
  toast: questToast,
  fade: document.createElement("div"),
}, {
  quests,
  isCombatActive: () => isCombatActive(),
});
worldMap.ui.fade.className = "fast-travel-fade";
document.querySelector("#game-shell")?.appendChild(worldMap.ui.fade);
const photoMode = new PhotoModeSystem(camera, cameraRig, player, {
  overlay: photoModeOverlay,
});
const masterTrials = new MasterArcherTrialsSystem(world, player, {
  title: questTitle,
  objective: questObjective,
  toast: questToast,
  ceremony: masterCeremony,
});
const frontierExpedition = new FrontierExpeditionSystem({
  title: questTitle,
  objective: questObjective,
  toast: questToast,
});
const lostKingdomQuest = new LostKingdomQuestSystem({
  title: questTitle,
  objective: questObjective,
  toast: questToast,
});
const celestialExpanseQuest = new CelestialExpanseQuestSystem({
  title: questTitle,
  objective: questObjective,
  toast: questToast,
});
const shatteredCoastQuest = new ShatteredCoastQuestSystem({
  title: questTitle,
  objective: questObjective,
  toast: questToast,
});
const veiledWildsQuest = new VeiledWildsQuestSystem({
  title: questTitle,
  objective: questObjective,
  toast: questToast,
});
let wildlife = { update() {} };
try {
  wildlife = new WildlifeSystem(scene, world);
} catch (error) {
  console.warn("Wildlife system disabled:", error);
}
let caveAudioActive = false;
let currentRegionId = null;

targetPractice.onTargetHit(({ target, score, challengeComplete }) => {
  quests.handleTargetHit(target);
  masterTrials.handleTargetHit(target, score);
  economy.awardTarget(score);
  if (target.switchId === "whisper-cave-gate") {
    world.openWhisperCaveGate();
  }
  if (target.switchId === "ancient-ruins-cache") {
    world.openAncientRuinsCache();
  }
  if (target.switchId === "lost-kingdom-sun-temple") {
    world.activateLostKingdomMechanism?.("sun-temple");
  }
  if (target.switchId === "lost-kingdom-archive-door") {
    world.activateLostKingdomMechanism?.("archive-door");
  }
  if (target.switchId === "celestial-relay-floating-reach") {
    world.activateCelestialRelay?.("floating-reach");
  }
  if (target.caveSound) {
    feedback.playSound("caveArrowHit", 0.9);
  }
  progression.awardTarget(score);
  if (challengeComplete) {
    progression.awardExplorationChallenge(challengeComplete.id, challengeComplete.label);
    economy.awardChallenge(challengeComplete.id, challengeComplete.label);
    window.dispatchEvent(new CustomEvent("echo-archer:challenge-complete", {
      detail: { id: challengeComplete.id, label: challengeComplete.label },
    }));
  }
});
enemies.onEnemyDefeated(({ type }) => {
  quests.handleEnemyDefeated();
  masterTrials.handleEnemyDefeated(type);
  progression.awardEnemy(type);
  economy.awardEnemyDefeat(type);
});
miniBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Barkhide Stalker" },
  }));
});
frostBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("frostbite");
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Icefang" },
  }));
});
stormBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("tidepiercer");
  questToast.textContent = "Tidepiercer answers the coastal wind.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3200);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Stormtalon" },
  }));
});
rootBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("whisperwind");
  questToast.textContent = "Whisperwind stirs in the quiet branches.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3200);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The Root Guardian" },
  }));
});
mirejawBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("bogpiercer");
  questToast.textContent = "Bogpiercer cuts a line through the Blackwater fog.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3200);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Mirejaw" },
  }));
});
stonehornBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("sunpiercer");
  questToast.textContent = "Sunpiercer blazes across the Red Canyon.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3200);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Stonehorn" },
  }));
});
infernoBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("infernoheart");
  questToast.textContent = "Infernoheart burns steady in your hands.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3200);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Inferno Behemoth" },
  }));
});
astralBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("starpiercer");
  questToast.textContent = "Starpiercer answers from beyond the fallen stars.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3600);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "Astral Guardian" },
  }));
});
ironhornBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("windrunner");
  questToast.textContent = "Windrunner follows the open frontier.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3600);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The Ironhorn" },
  }));
});
firstSentinelBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("kingmaker");
  questToast.textContent = "Kingmaker stands steady in the old silence.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 3800);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The First Sentinel" },
  }));
});
skyboundWardenBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("voidstar");
  questToast.textContent = "Voidstar hums with First Sky silence.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 4000);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The Skybound Warden" },
  }));
});
tideboundWardenBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("stormcaller");
  questToast.textContent = "Stormcaller answers across the shattered sea.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 4000);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The Tidebound Warden" },
  }));
});
ancientGrovekeeperBoss.onDefeated(({ type }) => {
  progression.awardBoss(type);
  economy.awardBoss(type);
  rpg.unlockLegendary?.("whisperbranch");
  questToast.textContent = "Whisperbranch waits in the quiet places between leaves.";
  questToast.classList.add("visible");
  window.setTimeout(() => questToast.classList.remove("visible"), 4000);
  window.dispatchEvent(new CustomEvent("echo-archer:boss-defeated", {
    detail: { type, name: "The Ancient Grovekeeper" },
  }));
});
window.addEventListener("echo-archer:xp-pickup", (event) => {
  progression.addXp(event.detail?.amount ?? 0);
  economy.awardTempleChest(event.detail?.name);
});
window.addEventListener("echo-archer:quest-reward", (event) => {
  progression.awardQuest(event.detail);
  economy.awardQuest(event.detail);
});
window.addEventListener("echo-archer:gear-pickup", (event) => {
  const { category, itemId } = event.detail ?? {};
  if (category && itemId) {
    inventory.addItem(category, itemId);
    rpg.applyBonuses();
    rpg.renderAll();
  }
});
window.addEventListener("echo-archer:combat-text", (event) => {
  const { text = "", x = window.innerWidth / 2, y = window.innerHeight / 2, kind = "" } = event.detail ?? {};
  if (!text || !scorePopups) {
    return;
  }

  const popup = document.createElement("span");
  popup.className = `score-popup combat-text ${kind}`.trim();
  popup.textContent = text;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  scorePopups.appendChild(popup);
  window.setTimeout(() => popup.remove(), 1050);
});
window.addEventListener("echo-archer:lookout", (event) => {
  if (event.detail?.target) {
    cameraRig.startScenicLook(event.detail.target);
  }
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateHud() {
  cameraLabel.textContent = cameraRig.mode === "third" ? "Third-person camera" : "First-person camera";
  lockState.textContent = input.pointerLocked ? "Mouse look active" : "Click to enter mouse look";
  const healthMax = Math.max(1, player.stats.healthMax ?? 100);
  const health = THREE.MathUtils.clamp(player.stats.health ?? healthMax, 0, healthMax);
  playerHealthText.textContent = `${Math.ceil(health)} / ${Math.ceil(healthMax)}`;
  playerHealthFill.style.setProperty("--player-health", (health / healthMax).toFixed(3));
  reticle.classList.toggle("first-person", cameraRig.mode === "first");
  reticle.classList.toggle("third-person", cameraRig.mode === "third");
  reticle.classList.toggle("is-drawing", archery.isDrawing);
  reticle.style.setProperty("--draw-power", archery.drawAmount.toFixed(3));
}

function updateRegionHud() {
  if (!regionState) {
    return;
  }
  const region = world.getRegionAt?.(player.group.position);
  if (!region || region.id === currentRegionId) {
    return;
  }
  currentRegionId = region.id;
  regionState.textContent = region.name;
  regionState.classList.remove("region-pulse");
  void regionState.offsetWidth;
  regionState.classList.add("region-pulse");
  window.dispatchEvent(new CustomEvent("echo-archer:journal-landmark", {
    detail: { id: region.id, name: region.name },
  }));
  window.dispatchEvent(new CustomEvent("echo-archer:region-discovered", {
    detail: { id: region.id, name: region.name },
  }));
}

function isCombatActive() {
  const playerPosition = player.group.position;
  const nearbyEnemy = enemies.enemies?.some((enemy) => (
    enemy.active && !enemy.removed && enemy.group.position.distanceTo(playerPosition) < 18 && enemy.state !== "patrol"
  ));
  const activeBoss = [miniBoss, frostBoss, stormBoss, rootBoss, mirejawBoss, stonehornBoss, infernoBoss, astralBoss, ironhornBoss, firstSentinelBoss, skyboundWardenBoss, tideboundWardenBoss, ancientGrovekeeperBoss].some((system) => (
    system.boss?.noticed && !system.boss?.defeated
  ));
  return Boolean(nearbyEnemy || activeBoss);
}

function update(deltaSeconds) {
  progression.update(input);
  inventory.update(input);
  economy.update(deltaSeconds, input);
  rpg.update(input);
  journal.update(input);
  worldMap.update(input);
  photoMode.update(input, deltaSeconds);

  const inventoryOpen = inventory.open;
  const shopOpen = economy.shopOpen;
  const questBoardOpen = economy.questBoardOpen;
  const rpgOpen = Boolean(rpg.openScreen);
  const journalOpen = journal.open;
  const mapOpen = worldMap.open;
  const photoOpen = photoMode.open;
  const menuOpen = progression.menuOpen || inventoryOpen || shopOpen || questBoardOpen || rpgOpen || journalOpen || mapOpen || photoOpen;
  input.setGameplayBlocked(menuOpen);
  audio.setGameplayPaused(menuOpen);

  if (inventoryOpen || shopOpen || questBoardOpen || rpgOpen || journalOpen || mapOpen || photoOpen) {
    archery.cancelDraw?.();
    cameraRig.setAimState(false, 0);
    updateHud();
    renderer.render(scene, camera);
    input.endFrame();
    return;
  }

  const mouseDelta = input.consumeMouseDelta();
  cameraRig.applyMouseLook(mouseDelta);

  if (input.wasPressed("KeyC")) {
    cameraRig.toggleMode();
  }

  player.update(deltaSeconds, input, cameraRig);
  world.updateDayNight(deltaSeconds, timeState);
  const nextCaveAudioActive = world.isInsideWhisperCave?.(player.group.position) ?? false;
  if (nextCaveAudioActive !== caveAudioActive) {
    caveAudioActive = nextCaveAudioActive;
    window.dispatchEvent(new CustomEvent("echo-archer:cave-state", {
      detail: { active: caveAudioActive },
    }));
  }
  quests.update(deltaSeconds, input);
  masterTrials.update(deltaSeconds);
  frontierExpedition.update(deltaSeconds);
  lostKingdomQuest.update(deltaSeconds);
  celestialExpanseQuest.update(deltaSeconds);
  shatteredCoastQuest.update(deltaSeconds);
  veiledWildsQuest.update(deltaSeconds);
  specialArrows.update(input);
  archery.update(deltaSeconds, input, player, cameraRig, world);
  cameraRig.setAimState(archery.isDrawing, archery.drawAmount);
  cameraRig.update(player, world.terrain, deltaSeconds);
  enemies.update(deltaSeconds, player, camera);
  miniBoss.update(deltaSeconds, player, camera);
  frostBoss.update(deltaSeconds, player, camera);
  stormBoss.update(deltaSeconds, player, camera);
  rootBoss.update(deltaSeconds, player, camera);
  mirejawBoss.update(deltaSeconds, player, camera);
  stonehornBoss.update(deltaSeconds, player, camera);
  infernoBoss.update(deltaSeconds, player, camera);
  astralBoss.update(deltaSeconds, player, camera);
  ironhornBoss.update(deltaSeconds, player, camera);
  firstSentinelBoss.update(deltaSeconds, player, camera);
  skyboundWardenBoss.update(deltaSeconds, player, camera);
  tideboundWardenBoss.update(deltaSeconds, player, camera);
  ancientGrovekeeperBoss.update(deltaSeconds, player, camera);
  weather.update(deltaSeconds, player);
  wind.update(deltaSeconds, player);
  wildlife.update(deltaSeconds, player);
  mounts.update(input, player);
  targetPractice.update(deltaSeconds, camera);
  feedback.update(deltaSeconds);
  updateRegionHud();
  updateHud();
  renderer.render(scene, camera);
  input.endFrame();
}

window.addEventListener("resize", resize);
new GameLoop(update).start();
