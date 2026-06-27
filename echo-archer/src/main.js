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
import { GraphicsSettingsSystem } from "./systems/GraphicsSettingsSystem.js";
import { PerformanceDebugSystem } from "./systems/PerformanceDebugSystem.js";
import { AudioManager } from "./systems/AudioManager.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { ArcherLodgeSystem } from "./systems/ArcherLodgeSystem.js";
import { LivingWorldEventsSystem } from "./systems/LivingWorldEventsSystem.js";
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
const deathScreen = document.querySelector("#death-screen");
const playerHealthText = document.querySelector("#player-health-text");
const playerHealthFill = document.querySelector("#player-health-fill");
const playerStaminaText = document.querySelector("#player-stamina-text");
const playerStaminaFill = document.querySelector("#player-stamina-fill");
const saveGameButton = document.querySelector("#save-game-button");
const saveState = document.querySelector("#save-state");
const questTitle = document.querySelector("#quest-title");
const questObjective = document.querySelector("#quest-objective");
const trackedSideQuest = document.querySelector("#tracked-side-quest");
const trackedSideTitle = document.querySelector("#tracked-side-title");
const trackedSideObjective = document.querySelector("#tracked-side-objective");
const findLandmarkButton = document.querySelector("#find-landmark-button");
const questMenuButton = document.querySelector("#quest-menu-button");
const questMenuBadge = document.querySelector("#quest-menu-badge");
const questSidebarButton = document.querySelector("#quest-sidebar-button");
const questSidebarBadge = document.querySelector("#quest-sidebar-badge");
const questMenu = document.querySelector("#quest-menu");
const questMenuContent = document.querySelector("#quest-menu-content");
const questMenuClose = document.querySelector("#quest-menu-close");
const sideQuestNotifications = document.querySelector("#side-quest-notifications");
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
const worldMapZoomIn = document.querySelector("#world-map-zoom-in");
const worldMapZoomOut = document.querySelector("#world-map-zoom-out");
const worldMapReset = document.querySelector("#world-map-reset");
const journalMenu = document.querySelector("#journal-menu");
const journalBody = document.querySelector("#journal-body");
const photoModeOverlay = document.querySelector("#photo-mode-overlay");
const masterCeremony = document.querySelector("#master-ceremony");
const muteToggle = document.querySelector("#mute-toggle");
const volumeSlider = document.querySelector("#volume-slider");
const graphicsToggle = document.querySelector("#graphics-toggle");
const performanceToggle = document.querySelector("#performance-toggle");
const graphicsQualityState = document.querySelector("#graphics-quality-state");
const graphicsMenu = document.querySelector("#graphics-menu");
const graphicsButtons = document.querySelectorAll("#graphics-menu [data-quality]");
const performanceDebug = document.querySelector("#performance-debug");
const performanceDebugBody = document.querySelector("#performance-debug-body");
const loadingScreen = document.querySelector("#loading-screen");
const loadingMessage = document.querySelector("#loading-message");
const loadingFill = document.querySelector("#loading-fill");

function setLoading(message, progress) {
  if (loadingMessage) {
    loadingMessage.textContent = message;
  }
  if (loadingFill) {
    loadingFill.style.setProperty("--loading-progress", `${Math.round(progress * 100)}%`);
  }
}

function hideLoadingScreen() {
  loadingScreen?.classList.add("hidden");
}

window.setTimeout(() => {
  hideLoadingScreen();
}, 4200);

function prefersPerformanceDetail() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("detail") === "full") {
      return false;
    }
    if (params.get("detail") === "performance") {
      return true;
    }
    return localStorage.getItem("echo-archer-detail") !== "full";
  } catch {
    return true;
  }
}

const performanceDetail = prefersPerformanceDetail();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !performanceDetail, powerPreference: "high-performance" });
const pixelRatioCap = performanceDetail ? 1 : ((navigator.hardwareConcurrency ?? 8) <= 4 ? 1.15 : 1.35);
const lowGpuMode = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !lowGpuMode;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 420);
camera.position.set(0, 4, -8);

const input = new InputController(canvas);
const cameraRig = new CameraRig(camera);
setLoading("Building world...", 0.18);
const world = new World(scene);
const archerLodge = new ArcherLodgeSystem(world);
setLoading("Preparing archer...", 0.34);
const player = new PlayerController(scene, world);
const audio = new AudioManager({
  mute: muteToggle,
  volume: volumeSlider,
});
const feedback = new FeedbackSystem(scene, cameraRig);
setLoading("Loading quests and creatures...", 0.48);
const quests = new QuestSystem(scene, world, player, {
  title: questTitle,
  objective: questObjective,
  trackedSide: trackedSideQuest,
  trackedSideTitle,
  trackedSideObjective,
  findButton: findLandmarkButton,
  questButton: questMenuButton,
  questBadge: questMenuBadge,
  questSideButton: questSidebarButton,
  questSideBadge: questSidebarBadge,
  questMenu,
  questContent: questMenuContent,
  questClose: questMenuClose,
  sideNotifications: sideQuestNotifications,
  prompt: interactionPrompt,
  dialogue: dialogueBox,
  speaker: dialogueSpeaker,
  text: dialogueText,
  toast: questToast,
});
const enemies = new EnemySystem(scene, world, { bars: enemyBars }, feedback);
setLoading("Waking bosses...", 0.58);
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
const bossSystems = [
  miniBoss,
  frostBoss,
  stormBoss,
  rootBoss,
  mirejawBoss,
  stonehornBoss,
  infernoBoss,
  astralBoss,
  ironhornBoss,
  firstSentinelBoss,
  skyboundWardenBoss,
  tideboundWardenBoss,
  ancientGrovekeeperBoss,
];
applyBossCombatPolish(bossSystems, feedback);
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
const graphics = new GraphicsSettingsSystem(renderer, {
  world,
  feedback,
  weather,
  archery,
  cameraRig,
}, {
  panel: graphicsMenu,
  toggle: graphicsToggle,
  label: graphicsQualityState,
  buttons: Array.from(graphicsButtons),
});
const performanceDebugSystem = new PerformanceDebugSystem(renderer, scene, {
  enemies,
  archery,
  bosses: bossSystems,
  regionState,
}, {
  panel: performanceDebug,
  body: performanceDebugBody,
  toggle: performanceToggle,
});
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
  zoomIn: worldMapZoomIn,
  zoomOut: worldMapZoomOut,
  reset: worldMapReset,
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
const livingWorldEvents = new LivingWorldEventsSystem(scene, world, player, {
  toast: questToast,
}, {
  economy,
  progression,
  masterTrials,
  lodge: archerLodge,
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
if (!world.performanceMode) {
  try {
    wildlife = new WildlifeSystem(scene, world);
  } catch (error) {
    console.warn("Wildlife system disabled:", error);
  }
}
const saves = new SaveSystem({
  button: saveGameButton,
  label: saveState,
}, {
  player,
  world,
  progression,
  inventory,
  quests,
  economy,
  rpg,
  journal,
  worldMap,
  masterTrials,
  frontierExpedition,
  lostKingdomQuest,
  celestialExpanseQuest,
  shatteredCoastQuest,
  veiledWildsQuest,
});
setLoading(saves.loaded ? "Progress restored." : "Starting fresh adventure.", 0.92);
let caveAudioActive = false;
let currentRegionId = null;
let firstFrameRendered = false;
window.setTimeout(() => {
  if (!firstFrameRendered) {
    hideLoadingScreen();
  }
}, 5200);

targetPractice.onTargetHit(({ target, score, challengeComplete }) => {
  quests.handleTargetHit(target);
  masterTrials.handleTargetHit(target, score);
  economy.awardTarget(score);
  window.dispatchEvent(new CustomEvent("echo-archer:target-hit", {
    detail: { targetId: target.id, score },
  }));
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
  const staminaMax = Math.max(1, player.stats.staminaMax ?? 100);
  const stamina = THREE.MathUtils.clamp(player.stats.stamina ?? staminaMax, 0, staminaMax);
  playerStaminaText.textContent = `${Math.ceil(stamina)} / ${Math.ceil(staminaMax)}`;
  playerStaminaFill.style.setProperty("--player-stamina", (stamina / staminaMax).toFixed(3));
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
  if (player.inSafeZone || world.isSafeZone?.(player.group.position)) {
    return false;
  }
  const playerPosition = player.group.position;
  const nearbyEnemy = enemies.enemies?.some((enemy) => (
    enemy?.active && !enemy.removed && enemy.group.position.distanceTo(playerPosition) < 18 && enemy.state !== "patrol"
  ));
  const activeBoss = [miniBoss, frostBoss, stormBoss, rootBoss, mirejawBoss, stonehornBoss, infernoBoss, astralBoss, ironhornBoss, firstSentinelBoss, skyboundWardenBoss, tideboundWardenBoss, ancientGrovekeeperBoss].some((system) => (
    system.boss?.noticed && !system.boss?.defeated
  ));
  return Boolean(nearbyEnemy || activeBoss);
}

function setDeathScreenVisible(visible) {
  deathScreen?.classList.toggle("visible", visible);
  document.body.classList.toggle("player-defeated", visible);
}

function continueFromDeath() {
  saves.continueFromLastSave();
  player.inSafeZone = world.isSafeZone?.(player.group.position) ?? false;
  enemies.forceReturnAll?.({ resetHealth: true });
  calmBossesForSafety();
  archery.cancelDraw?.();
  cameraRig.setAimState(false, 0);
  setDeathScreenVisible(false);
  window.dispatchEvent(new CustomEvent("echo-archer:combat-text", {
    detail: { text: "Adventure continued", kind: "xp", x: window.innerWidth / 2, y: window.innerHeight * 0.34 },
  }));
}

function calmBossesForSafety() {
  let bossWasActive = false;
  bossSystems.forEach((system) => {
    const boss = system.boss;
    if (!boss || boss.defeated || !boss.noticed) {
      return;
    }
    bossWasActive = true;
    boss.noticed = false;
    boss.attackCooldown = 0;
    if (boss.state && boss.state !== "defeated") {
      boss.state = "patrol";
    }
  });
  if (bossWasActive) {
    window.dispatchEvent(new CustomEvent("echo-archer:music-state", { detail: { boss: false } }));
  }
}

function applyBossCombatPolish(systems, feedbackSystem) {
  const telegraphMethods = [
    "startCharge",
    "startPounce",
    "startDive",
    "startSlam",
    "startRootCharge",
    "startSurge",
    "startRockSlam",
    "startStomp",
    "startMudSplash",
    "startLavaBurst",
    "startPulse",
    "startWave",
    "startBeam",
    "startGust",
    "startVinePulse",
    "startStarVolley",
  ];

  systems.forEach((system) => {
    if (typeof system.moveToward === "function" && !system.moveToward.__echoMovementPolished) {
      const originalMoveToward = system.moveToward.bind(system);
      const wrappedMoveToward = function wrappedBossMoveToward(boss, target, speed, deltaSeconds, ...args) {
        if (!boss?.group || !target || boss.defeated) {
          return originalMoveToward(boss, target, speed, deltaSeconds, ...args);
        }
        boss.polishedVelocity ??= new THREE.Vector3();
        const before = boss.group.position.clone();
        originalMoveToward(boss, target, speed, deltaSeconds, ...args);
        const after = boss.group.position.clone();
        const step = after.sub(before);
        if (step.lengthSq() <= 0.000001) {
          return;
        }
        const desiredVelocity = step.divideScalar(Math.max(deltaSeconds, 0.001));
        boss.polishedVelocity.lerp(desiredVelocity, 1 - Math.exp(-6.4 * deltaSeconds));
        boss.group.position.copy(before).addScaledVector(boss.polishedVelocity, deltaSeconds);
        const planar = boss.polishedVelocity.clone();
        planar.y = 0;
        if (planar.lengthSq() > 0.0001) {
          const yaw = Math.atan2(planar.x, planar.z);
          boss.group.rotation.y = THREE.MathUtils.lerp(boss.group.rotation.y, yaw, 0.1);
        }
      };
      wrappedMoveToward.__echoMovementPolished = true;
      system.moveToward = wrappedMoveToward;
    }

    telegraphMethods.forEach((methodName) => {
      if (typeof system[methodName] !== "function" || system[methodName].__echoPolished) {
        return;
      }

      const original = system[methodName].bind(system);
      const wrapped = function wrappedBossTelegraph(boss, ...args) {
        if (boss?.group && !boss.defeated) {
          const impactPoint = boss.group.position.clone().add(new THREE.Vector3(0, 1.15, 0));
          const isAreaAttack = /Slam|Stomp|Splash|Burst|Pulse|Wave|Beam|Gust|Volley/i.test(methodName);
          feedbackSystem?.spawnImpact?.(impactPoint, isAreaAttack ? 0xffcf5f : 0xff8a3d, isAreaAttack ? 2.15 : 1.55);
          feedbackSystem?.shake?.(isAreaAttack ? 0.08 : 0.055);
          feedbackSystem?.playSound?.("bossCharge", isAreaAttack ? 0.74 : 0.92);
          boss.telegraphTimer = Math.max(boss.telegraphTimer ?? 0, isAreaAttack ? 0.48 : 0.34);
        }
        return original(boss, ...args);
      };
      wrapped.__echoPolished = true;
      system[methodName] = wrapped;
    });
  });
}

function updateBossWhenRelevant(system, deltaSeconds) {
  const boss = system.boss;
  if (!boss?.group || boss.defeated) {
    system.update(deltaSeconds, player, camera);
    return;
  }
  const distance = boss.group.position.distanceTo(player.group.position);
  if (boss.noticed || distance <= (world.performanceMode ? 72 : 120)) {
    const previousPhase = boss.phase;
    system.update(deltaSeconds, player, camera);
    if (boss.phase && previousPhase && boss.phase !== previousPhase) {
      feedback.spawnImpact(boss.group.position.clone().add(new THREE.Vector3(0, 1.35, 0)), 0xfff1a6, 2.65);
      feedback.playSound("bossNotice", 0.78);
      feedback.shake(0.12);
    }
  }
}

function update(deltaSeconds) {
  progression.update(input);
  inventory.update(input);
  economy.update(deltaSeconds, input);
  rpg.update(input);
  journal.update(input);
  worldMap.update(input);
  graphics.update(input);
  performanceDebugSystem.update(deltaSeconds, input);
  photoMode.update(input, deltaSeconds);
  saves.update(deltaSeconds);

  const inventoryOpen = inventory.open;
  const shopOpen = economy.shopOpen;
  const questBoardOpen = economy.questBoardOpen;
  const rpgOpen = Boolean(rpg.openScreen);
  const journalOpen = journal.open;
  const mapOpen = worldMap.open;
  const graphicsOpen = graphics.open;
  const photoOpen = photoMode.open;
  const questMenuOpen = quests.menuOpen;
  const defeatedOpen = player.defeated;

  if (questMenuOpen && (input.wasPressed("KeyQ") || input.wasPressed("Escape"))) {
    quests.setQuestMenuOpen(false);
  }

  const menuOpen = progression.menuOpen || inventoryOpen || shopOpen || questBoardOpen || rpgOpen || journalOpen || mapOpen || graphicsOpen || photoOpen || questMenuOpen || defeatedOpen;
  input.setGameplayBlocked(menuOpen);
  audio.setGameplayPaused(menuOpen);

  if (defeatedOpen) {
    setDeathScreenVisible(true);
    archery.cancelDraw?.();
    cameraRig.setAimState(false, 0);
    enemies.forceReturnAll?.({ resetHealth: true });
    if (input.wasPressed("KeyE")) {
      continueFromDeath();
    }
    updateHud();
    renderer.render(scene, camera);
    input.endFrame();
    return;
  }

  setDeathScreenVisible(false);

  if (inventoryOpen || shopOpen || questBoardOpen || rpgOpen || journalOpen || mapOpen || graphicsOpen || photoOpen || questMenuOpen) {
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
  player.inSafeZone = world.isSafeZone?.(player.group.position) ?? false;
  if (player.inSafeZone) {
    enemies.forceReturnAll?.({ resetHealth: false });
    calmBossesForSafety();
  }
  world.updateDayNight(deltaSeconds, timeState);
  world.updateDistanceDetail?.(player.group.position, deltaSeconds);
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
  quests.refreshHud();
  livingWorldEvents.update(deltaSeconds);
  specialArrows.update(input);
  archery.update(deltaSeconds, input, player, cameraRig, world);
  cameraRig.setAimState(archery.isDrawing, archery.drawAmount);
  cameraRig.update(player, world.terrain, deltaSeconds);
  enemies.update(deltaSeconds, player, camera);
  bossSystems.forEach((system) => updateBossWhenRelevant(system, deltaSeconds));
  player.updateSafeRecovery(deltaSeconds, player.inSafeZone && !isCombatActive());
  weather.update(deltaSeconds, player);
  wind.update(deltaSeconds, player);
  wildlife.update(deltaSeconds, player);
  mounts.update(input, player);
  targetPractice.update(deltaSeconds, camera);
  feedback.update(deltaSeconds);
  updateRegionHud();
  updateHud();
  renderer.render(scene, camera);
  if (!firstFrameRendered) {
    firstFrameRendered = true;
    window.setTimeout(hideLoadingScreen, 450);
  }
  input.endFrame();
}

window.addEventListener("resize", resize);
new GameLoop(update).start();
