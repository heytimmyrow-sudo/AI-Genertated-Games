const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.querySelector("#startScreen");
const pauseScreen = document.querySelector("#pauseScreen");
const winScreen = document.querySelector("#winScreen");
const startButton = document.querySelector("#startButton");
const resumeButton = document.querySelector("#resumeButton");
const restartButtons = document.querySelectorAll(".restart-button");
const nextLevelButton = document.querySelector("#nextLevelButton");
const practiceButton = document.querySelector("#practiceButton");
const speedrunButton = document.querySelector("#speedrunButton");
const cosmeticButton = document.querySelector("#cosmeticButton");
const reducedMotionButton = document.querySelector("#reducedMotionButton");
const touchSizeButton = document.querySelector("#touchSizeButton");
const resetSaveButton = document.querySelector("#resetSaveButton");
const shopButton = document.querySelector("#shopButton");
const closeShopButton = document.querySelector("#closeShopButton");
const vaultButton = document.querySelector("#vaultButton");
const closeVaultButton = document.querySelector("#closeVaultButton");
const muteButton = document.querySelector("#muteButton");
const pauseButton = document.querySelector("#pauseButton");
const levelSelect = document.querySelector("#levelSelect");
const worldMap = document.querySelector("#worldMap");
const storyText = document.querySelector("#storyText");
const levelPreview = document.querySelector("#levelPreview");
const journalPanel = document.querySelector("#journalPanel");
const vaultPanel = document.querySelector("#vaultPanel");
const vaultScreen = document.querySelector("#vaultScreen");
const vaultGrid = document.querySelector("#vaultGrid");
const vaultSummary = document.querySelector("#vaultSummary");
const shopScreen = document.querySelector("#shopScreen");
const shopGrid = document.querySelector("#shopGrid");
const shopBalance = document.querySelector("#shopBalance");
const scoreRow = document.querySelector("#scoreRow");
const levelTitle = document.querySelector("#levelTitle");
const statusText = document.querySelector("#statusText");
const keyBadge = document.querySelector("#keyBadge");
const healthBadge = document.querySelector("#healthBadge");
const coinBadge = document.querySelector("#coinBadge");
const timerBadge = document.querySelector("#timerBadge");
const bestBadge = document.querySelector("#bestBadge");
const winSummary = document.querySelector("#winSummary");

const GAME = {
  width: canvas.width,
  height: canvas.height,
  gravity: 2200,
  maxFall: 980,
  storageKey: "treasureTrailSaveV3",
};

const MOVEMENT = {
  maxSpeed: 330,
  groundAcceleration: 3600,
  groundDeceleration: 4600,
  airAcceleration: 2450,
  airDeceleration: 1800,
  jumpPower: 780,
  jumpCutMultiplier: 0.48,
  coyoteTime: 0.11,
  jumpBufferTime: 0.12,
  cameraSharpness: 7.8,
};

const TREASURES = {
  Forest: "Emerald Crown",
  Ice: "Frost Pearl",
  Cave: "Lantern Ruby",
  Lava: "Cinder Chalice",
  Space: "Star Compass",
};

const WORLD_STORIES = {
  Forest: "The Forest trail opens under old green canopies. Recover the Emerald Crown before the roots close the path.",
  Ice: "The Ice world is slick and bright. Carry the Frost Pearl out before the glacier swallows the chest.",
  Cave: "The Cave world echoes with hidden relics and falling stone. Follow the lanterns to the Lantern Ruby.",
  Lava: "The Lava world burns in waves. Time your jumps and claim the Cinder Chalice.",
  Space: "The Space world bends gravity around silent ruins. Bring home the Star Compass and open the final vault.",
};

const RELIC_LORE = {
  Forest: "Forest relic: a leaf medallion that hums near secret doors.",
  Ice: "Ice relic: a frozen bell still ringing under the snow.",
  Cave: "Cave relic: a lantern wick that never burns out.",
  Lava: "Lava relic: cooled obsidian shaped like a key tooth.",
  Space: "Space relic: a tiny moon shard with a map inside.",
};

const WORLD_HINTS = {
  Forest: "A gentle trail: learn the jump, grab the key, and keep moving.",
  Ice: "Ice is slippery. Start slowing down before the edge.",
  Cave: "Cave routes introduce moving and falling platforms.",
  Lava: "Lava heat bursts punish low routes. Watch the timing.",
  Space: "Space has low gravity. Hold jumps less than you think.",
};

const MEDALS = [
  { name: "Bronze", color: "#c98532" },
  { name: "Silver", color: "#d9e6e8" },
  { name: "Gold", color: "#ffe483" },
];

const COSMETICS = [
  { name: "Trail", body: "#3655b8", hat: "#f4c94d" },
  { name: "Forest", body: "#2e8a5f", hat: "#f4c94d" },
  { name: "Frost", body: "#4da9d8", hat: "#fff8e7" },
  { name: "Cinder", body: "#b9473e", hat: "#ffe483" },
  { name: "Star", body: "#6c5bd6", hat: "#7ee3ff" },
];

const SHOP_ITEMS = [
  { id: "skin_forest", name: "Forest Skin", type: "skin", cost: 18, description: "Permanent green explorer outfit.", cosmetic: { name: "Forest", body: "#2e8a5f", hat: "#f4c94d" } },
  { id: "skin_frost", name: "Frost Skin", type: "skin", cost: 24, description: "Permanent icy outfit.", cosmetic: { name: "Frost", body: "#4da9d8", hat: "#fff8e7" } },
  { id: "skin_star", name: "Star Skin", type: "skin", cost: 36, description: "Permanent space outfit.", cosmetic: { name: "Star", body: "#6c5bd6", hat: "#7ee3ff" } },
  { id: "hat_crown", name: "Crown Hat", type: "hat", cost: 20, description: "Permanent gold crown look." },
  { id: "trail_spark", name: "Spark Trail", type: "trail", cost: 28, description: "Permanent sparkle movement dust." },
  { id: "flag_blue", name: "Blue Flags", type: "flag", cost: 14, description: "Permanent checkpoint flag style." },
  { id: "sound_chime", name: "Chime Pack", type: "sound", cost: 22, description: "Permanent brighter pickup sounds." },
  { id: "heart_charm", name: "Heart Charm", type: "upgrade", cost: 35, description: "Permanent +1 max health." },
  { id: "jump_boots", name: "Jump Boots", type: "upgrade", cost: 40, description: "Permanent slightly stronger jump." },
  { id: "gem_magnet", name: "Gem Magnet", type: "upgrade", cost: 45, description: "Permanent nearby gem pickup." },
  { id: "shield", name: "Shield", type: "consumable", cost: 10, description: "Blocks one hit. Spent when used.", inventoryKey: "shields" },
  { id: "extra_life", name: "Extra Life", type: "consumable", cost: 18, description: "Prevents one knockout. Spent when used.", inventoryKey: "extraLives" },
];

const STATE = {
  START: "start",
  PLAYING: "playing",
  PAUSED: "paused",
  WON: "won",
};

const LEGACY_LEVELS = [
  {
    id: "cove-run",
    name: "Cove Run",
    subtitle: "Cliffs and crab patrols",
    theme: "cove",
    worldWidth: 2860,
    start: { x: 80, y: 390 },
    chest: { x: 2700, y: 410, width: 58, height: 60 },
    key: { x: 1532, y: 235, width: 34, height: 24 },
    platforms: [
      { x: 0, y: 474, width: 420, height: 66, kind: "grass" },
      { x: 500, y: 428, width: 270, height: 34, kind: "stone" },
      { x: 850, y: 376, width: 250, height: 34, kind: "grass" },
      { x: 1180, y: 318, width: 260, height: 34, kind: "stone" },
      { x: 1495, y: 292, width: 170, height: 34, kind: "grass", secret: true },
      { x: 1770, y: 376, width: 280, height: 34, kind: "stone", move: { axis: "x", min: 1730, max: 1900, speed: 72 } },
      { x: 2150, y: 430, width: 260, height: 34, kind: "grass" },
      { x: 2520, y: 474, width: 340, height: 66, kind: "stone" },
    ],
    checkpoints: [{ x: 1220, y: 270, width: 24, height: 48 }],
    gems: [
      { x: 300, y: 418 }, { x: 590, y: 372 }, { x: 955, y: 318 }, { x: 1280, y: 260 },
      { x: 1552, y: 232, secret: true }, { x: 1860, y: 318 }, { x: 2260, y: 372 }, { x: 2620, y: 418 },
    ],
    relic: { x: 1626, y: 235, width: 24, height: 28 },
    spikes: [
      { x: 432, y: 474, width: 62, height: 30 },
      { x: 1118, y: 474, width: 86, height: 30 },
      { x: 2078, y: 474, width: 78, height: 30 },
      { x: 2428, y: 474, width: 86, height: 30 },
    ],
    enemies: [
      { type: "crab", x: 920, y: 330, width: 42, height: 34, minX: 875, maxX: 1040, speed: 84 },
      { type: "slime", x: 1810, y: 328, width: 42, height: 36, minX: 1785, maxX: 1990, speed: 76 },
    ],
    traps: [
      { type: "swing", x: 730, y: 230, length: 92, radius: 18, speed: 2.1 },
      { type: "fire", x: 2320, y: 390, width: 34, height: 74, interval: 2.4, activeTime: 1.1 },
    ],
    scenery: [
      { x: 180, y: 392, type: "palm" }, { x: 690, y: 350, type: "fern" }, { x: 1290, y: 240, type: "fern" },
      { x: 2260, y: 350, type: "palm" }, { x: 2640, y: 394, type: "fern" },
    ],
  },
  {
    id: "lantern-cavern",
    name: "Lantern Cavern",
    subtitle: "Falling ledges and hidden gems",
    theme: "cave",
    worldWidth: 3150,
    start: { x: 80, y: 390 },
    chest: { x: 3000, y: 410, width: 58, height: 60 },
    key: { x: 1960, y: 196, width: 34, height: 24 },
    platforms: [
      { x: 0, y: 474, width: 360, height: 66, kind: "stone" },
      { x: 430, y: 420, width: 220, height: 34, kind: "moss" },
      { x: 760, y: 350, width: 190, height: 30, kind: "stone", falling: { delay: 0.5, reset: 2.8 } },
      { x: 1060, y: 410, width: 220, height: 34, kind: "moss" },
      { x: 1370, y: 330, width: 250, height: 34, kind: "stone", move: { axis: "y", min: 284, max: 390, speed: 58 } },
      { x: 1760, y: 270, width: 330, height: 34, kind: "moss" },
      { x: 2200, y: 380, width: 190, height: 30, kind: "stone", falling: { delay: 0.4, reset: 2.6 } },
      { x: 2500, y: 442, width: 260, height: 34, kind: "moss" },
      { x: 2890, y: 474, width: 300, height: 66, kind: "stone" },
      { x: 1540, y: 170, width: 170, height: 28, kind: "moss", secret: true },
    ],
    checkpoints: [{ x: 1398, y: 278, width: 24, height: 48 }],
    gems: [
      { x: 250, y: 418 }, { x: 540, y: 365 }, { x: 835, y: 292 }, { x: 1150, y: 354 },
      { x: 1588, y: 112, secret: true }, { x: 1870, y: 214 }, { x: 2305, y: 322 }, { x: 2620, y: 386 }, { x: 2985, y: 418 },
    ],
    relic: { x: 1662, y: 112, width: 24, height: 28 },
    spikes: [
      { x: 365, y: 474, width: 62, height: 30 },
      { x: 960, y: 474, width: 86, height: 30 },
      { x: 1650, y: 474, width: 120, height: 30 },
      { x: 2400, y: 474, width: 86, height: 30 },
    ],
    enemies: [
      { type: "bat", x: 1070, y: 260, width: 44, height: 30, minX: 1040, maxX: 1260, speed: 102, amplitude: 32 },
      { type: "crab", x: 2540, y: 396, width: 42, height: 34, minX: 2515, maxX: 2700, speed: 94 },
    ],
    traps: [
      { type: "rock", x: 660, y: 96, width: 34, height: 34, triggerX: 610, reset: 2.4 },
      { type: "swing", x: 2020, y: 130, length: 120, radius: 18, speed: 2.4 },
    ],
    scenery: [
      { x: 250, y: 405, type: "crystal" }, { x: 1280, y: 355, type: "waterfall" },
      { x: 1760, y: 220, type: "crystal" }, { x: 2700, y: 398, type: "waterfall" },
    ],
  },
  {
    id: "storm-ruins",
    name: "Storm Ruins",
    subtitle: "Wall jumps and final traps",
    theme: "storm",
    worldWidth: 3420,
    start: { x: 80, y: 390 },
    chest: { x: 3265, y: 410, width: 58, height: 60 },
    key: { x: 2370, y: 162, width: 34, height: 24 },
    platforms: [
      { x: 0, y: 474, width: 300, height: 66, kind: "ruin" },
      { x: 410, y: 420, width: 180, height: 34, kind: "ruin" },
      { x: 700, y: 350, width: 180, height: 34, kind: "storm", move: { axis: "x", min: 660, max: 880, speed: 92 } },
      { x: 1030, y: 286, width: 170, height: 34, kind: "ruin" },
      { x: 1320, y: 420, width: 210, height: 34, kind: "storm", falling: { delay: 0.35, reset: 2.2 } },
      { x: 1640, y: 356, width: 210, height: 34, kind: "ruin" },
      { x: 1980, y: 288, width: 190, height: 34, kind: "storm" },
      { x: 2290, y: 220, width: 230, height: 34, kind: "ruin", secret: true },
      { x: 2620, y: 360, width: 200, height: 34, kind: "storm", move: { axis: "y", min: 300, max: 420, speed: 76 } },
      { x: 2940, y: 474, width: 520, height: 66, kind: "ruin" },
    ],
    walls: [
      { x: 1210, y: 238, width: 32, height: 230 },
      { x: 1884, y: 190, width: 32, height: 246 },
    ],
    checkpoints: [{ x: 1670, y: 304, width: 24, height: 48 }, { x: 2700, y: 304, width: 24, height: 48 }],
    gems: [
      { x: 210, y: 418 }, { x: 495, y: 364 }, { x: 765, y: 292 }, { x: 1100, y: 228 },
      { x: 1410, y: 364 }, { x: 1730, y: 300 }, { x: 2058, y: 230 }, { x: 2390, y: 164, secret: true },
      { x: 2700, y: 296 }, { x: 3165, y: 418 },
    ],
    relic: { x: 2490, y: 164, width: 24, height: 28 },
    spikes: [
      { x: 305, y: 474, width: 98, height: 30 },
      { x: 1248, y: 474, width: 72, height: 30 },
      { x: 1535, y: 474, width: 96, height: 30 },
      { x: 2840, y: 474, width: 92, height: 30 },
    ],
    enemies: [
      { type: "boar", x: 1680, y: 310, width: 54, height: 42, minX: 1645, maxX: 1838, speed: 150 },
      { type: "bat", x: 2620, y: 210, width: 44, height: 30, minX: 2580, maxX: 2820, speed: 122, amplitude: 38 },
    ],
    traps: [
      { type: "fire", x: 935, y: 350, width: 34, height: 90, interval: 2.1, activeTime: 0.9 },
      { type: "rock", x: 2220, y: 60, width: 36, height: 36, triggerX: 2120, reset: 2.5 },
      { type: "swing", x: 3070, y: 220, length: 116, radius: 18, speed: 2.8 },
    ],
    scenery: [
      { x: 310, y: 405, type: "ruin" }, { x: 1140, y: 230, type: "ruin" },
      { x: 2040, y: 236, type: "crystal" }, { x: 3160, y: 405, type: "ruin" },
    ],
  },
];

const WORLD_CONFIGS = [
  {
    id: "forest",
    name: "Forest",
    theme: "forest",
    kind: "grass",
    enemyTypes: ["slime", "crab", "boar"],
    trapTypes: ["swing", "rock"],
    sceneryTypes: ["palm", "fern", "ruin"],
    subtitles: ["Fern Steps", "Canopy Rise", "Moss Gate", "Thorn Sprint", "Elderwood Vault"],
  },
  {
    id: "ice",
    name: "Ice",
    theme: "ice",
    kind: "ice",
    enemyTypes: ["slime", "bat", "boar"],
    trapTypes: ["rock", "swing"],
    sceneryTypes: ["crystal", "waterfall", "ruin"],
    subtitles: ["Frost Flats", "Glacier Lift", "Snowfall Pass", "Crystal Cut", "Aurora Lock"],
  },
  {
    id: "cave",
    name: "Cave",
    theme: "cave",
    kind: "moss",
    enemyTypes: ["bat", "slime", "crab"],
    trapTypes: ["rock", "swing", "fire"],
    sceneryTypes: ["crystal", "waterfall", "fern"],
    subtitles: ["Lantern Drop", "Echo Bridge", "Gem Grotto", "Stalactite Run", "Deep Key"],
  },
  {
    id: "lava",
    name: "Lava",
    theme: "lava",
    kind: "basalt",
    enemyTypes: ["boar", "bat", "crab"],
    trapTypes: ["fire", "rock", "swing"],
    sceneryTypes: ["ruin", "crystal", "lavafall"],
    subtitles: ["Ash Landing", "Ember Steps", "Magma Lift", "Cinder Gauntlet", "Volcano Vault"],
  },
  {
    id: "space",
    name: "Space",
    theme: "space",
    kind: "cosmic",
    enemyTypes: ["bat", "boar", "slime"],
    trapTypes: ["swing", "fire", "rock"],
    sceneryTypes: ["star", "crystal", "ruin"],
    subtitles: ["Moonwalk", "Orbital Ledge", "Comet Crossing", "Nebula Gate", "Star Chest"],
  },
];

const CAMPAIGN_LEVELS = buildCampaignLevels(WORLD_CONFIGS);
const BONUS_LEVELS = buildBonusLevels(WORLD_CONFIGS);
const LEVELS = [...CAMPAIGN_LEVELS, ...BONUS_LEVELS];
const MAIN_LEVEL_COUNT = CAMPAIGN_LEVELS.length;

function buildCampaignLevels(worlds) {
  return worlds.flatMap((world, worldIndex) => {
    return Array.from({ length: 5 }, (_, levelIndex) => createCampaignLevel(world, worldIndex, levelIndex));
  });
}

function buildBonusLevels(worlds) {
  return worlds.map((world, worldIndex) => createBonusLevel(world, worldIndex));
}

function createBonusLevel(world, worldIndex) {
  const level = createCampaignLevel(world, worldIndex, 4);
  level.id = `${world.id}-bonus`;
  level.stage = "Bonus";
  level.name = `${world.name} Bonus`;
  level.subtitle = "Relic Route";
  level.isBoss = false;
  level.isBonus = true;
  level.hasSecretExit = false;
  level.parTime += 18;
  level.treasure = `${TREASURES[world.name]} Shard`;
  level.story = `${world.name} bonus route unlocked by relic hunters. It is optional, tougher, and packed with gems.`;
  level.tutorials = [];
  level.gems = createPlatformGems(level.platforms.filter((platform) => platform.width >= 145), 12, 5);
  return level;
}

function createCampaignLevel(world, worldIndex, levelIndex) {
  const stage = levelIndex + 1;
  const globalLevel = worldIndex * 5 + stage;
  const difficulty = worldIndex * 1.35 + Math.max(0, levelIndex - 1) * 0.55;
  const worldWidth = 2620 + worldIndex * 190 + levelIndex * (worldIndex === 0 ? 80 : 135);
  const endX = worldWidth - 180;
  const baseY = 474;
  const gapBase = 286 + worldIndex * 12 + Math.max(0, levelIndex - 2) * 8;
  const platformCount = 7 + levelIndex + (worldIndex >= 3 ? 1 : 0);
  const heightPattern = worldIndex === 0
    ? [438, 416, 392, 426]
    : worldIndex === 1
      ? [432, 400, 368, 416]
      : [426, 374, 318, 392];
  const platforms = [
    { x: 0, y: baseY, width: 380, height: 66, kind: world.kind },
  ];

  for (let i = 0; i < platformCount; i += 1) {
    const x = 470 + i * gapBase;
    const wave = (i + levelIndex + worldIndex) % 4;
    const y = heightPattern[wave] - Math.min((worldIndex + Math.max(0, levelIndex - 1)) * 3, 16);
    const width = clampNumber(285 - worldIndex * 12 - levelIndex * (worldIndex === 0 ? 5 : 8) + (i % 2) * 34, worldIndex === 0 ? 210 : 155, 310);
    const platform = { x, y, width, height: 34, kind: i % 3 === 1 ? alternateKind(world.kind) : world.kind };
    if (shouldAddMovingPlatform(worldIndex, levelIndex, i)) platform.move = movingPlatformFor(platform, i, levelIndex, worldIndex);
    if (shouldAddFallingPlatform(worldIndex, levelIndex, i)) platform.falling = { delay: Math.max(0.28, 0.65 - difficulty * 0.03), reset: 2.7 };
    if (i === Math.floor(platformCount / 2)) platform.secret = true;
    platforms.push(platform);
  }

  platforms.push({ x: endX - 120, y: baseY, width: 340, height: 66, kind: world.kind });
  normalizePlatformRoute(platforms, world.kind);
  addReachabilityBridges(platforms, world.kind);

  const checkpoints = createStableCheckpoints(platforms, worldWidth);
  const routePlatforms = platforms.filter((platform) => platform.width >= 145);

  const gems = createPlatformGems(routePlatforms, 7 + levelIndex, levelIndex);

  const spikeCount = Math.max(1, Math.floor(1 + levelIndex * 0.55 + worldIndex * 1.15));
  const spikes = createPlatformSpikes(routePlatforms, spikeCount, levelIndex, worldIndex);

  const enemyCount = Math.min(5, 1 + Math.floor((Math.max(0, levelIndex - 1) + worldIndex) / 2));
  const enemies = Array.from({ length: enemyCount }, (_, i) => {
    const type = world.enemyTypes[(i + levelIndex) % world.enemyTypes.length];
    const platform = routePlatforms[clampNumber(2 + i * 2, 1, routePlatforms.length - 2)];
    const x = clampNumber(platform.x + 44 + i * 18, platform.x + 24, platform.x + platform.width - 86);
    return makeEnemyOnPlatform(type, x, platform, 95 + difficulty * 12);
  });
  if (stage === 5) {
    const bossPlatform = routePlatforms[routePlatforms.length - 2];
    enemies.push(makeEnemyOnPlatform("boss", bossPlatform.x + bossPlatform.width / 2 - 39, bossPlatform, 110 + difficulty * 10));
  }

  const trapCount = trapCountFor(worldIndex, levelIndex);
  const traps = Array.from({ length: trapCount }, (_, i) => {
    const type = worldIndex === 0 ? "swing" : world.trapTypes[(i + stage + worldIndex) % world.trapTypes.length];
    const x = 690 + i * Math.floor((worldWidth - 1200) / Math.max(1, trapCount));
    return makeTrap(type, x, difficulty, world.theme);
  });

  const walls = worldIndex >= 2 && levelIndex >= 3
    ? [
        { x: Math.floor(worldWidth * 0.42), y: 240, width: 32, height: 228 },
        { x: Math.floor(worldWidth * 0.63), y: 190, width: 32, height: 246 },
      ]
    : [];

  const scenery = Array.from({ length: 7 }, (_, i) => ({
    x: 180 + i * Math.floor((worldWidth - 420) / 6),
    y: [392, 350, 260, 405][i % 4],
    type: world.sceneryTypes[i % world.sceneryTypes.length],
  }));

  const keyPlatform = platforms[Math.max(2, Math.floor(platforms.length * 0.62))];
  return {
    id: `${world.id}-${stage}`,
    world: world.name,
    stage,
    name: `${world.name} ${stage}`,
    subtitle: world.subtitles[levelIndex],
    theme: world.theme,
    treasure: TREASURES[world.name],
    story: WORLD_STORIES[world.name],
    relicLore: RELIC_LORE[world.name],
    isBoss: stage === 5,
    isBonus: false,
    parTime: 54 + worldIndex * 8 + levelIndex * 7,
    hasSecretExit: levelIndex >= 2,
    hint: WORLD_HINTS[world.name],
    worldWidth,
    start: { x: 80, y: 390 },
    chest: { x: endX, y: 410, width: 58, height: 60 },
    key: { x: keyPlatform.x + Math.min(80, keyPlatform.width - 60), y: keyPlatform.y - 58, width: 34, height: 24 },
    platforms,
    walls,
    checkpoints,
    gems,
    relic: { x: keyPlatform.x + keyPlatform.width - 44, y: keyPlatform.y - 62, width: 24, height: 28 },
    spikes,
    enemies,
    traps,
    scenery,
    tutorials: createTutorialPrompts(worldIndex, stage, platforms, keyPlatform, endX),
    globalLevel,
  };
}

function alternateKind(kind) {
  const alternates = {
    grass: "moss",
    ice: "stone",
    moss: "stone",
    basalt: "ruin",
    cosmic: "storm",
  };
  return alternates[kind] || "stone";
}

function shouldAddMovingPlatform(worldIndex, levelIndex, platformIndex) {
  if (worldIndex === 0) return levelIndex >= 4 && platformIndex === 3;
  if (worldIndex === 1) return levelIndex >= 2 && platformIndex > 2 && platformIndex % 4 === 0;
  return levelIndex >= 1 && platformIndex > 1 && platformIndex % 3 === 0;
}

function shouldAddFallingPlatform(worldIndex, levelIndex, platformIndex) {
  if (worldIndex < 2) return false;
  if (worldIndex === 2) return levelIndex >= 2 && platformIndex % 5 === 2;
  return levelIndex >= 2 && platformIndex % 4 === 2;
}

function trapCountFor(worldIndex, levelIndex) {
  if (worldIndex === 0) return levelIndex >= 3 ? 1 : 0;
  if (worldIndex === 1) return levelIndex >= 2 ? 1 : 0;
  if (worldIndex === 2) return Math.min(3, 1 + Math.floor(levelIndex / 2));
  return Math.min(5, 1 + levelIndex + Math.floor(worldIndex / 2));
}

function createTutorialPrompts(worldIndex, stage, platforms, keyPlatform, endX) {
  if (worldIndex !== 0 || stage > 3) return [];
  const prompts = [];
  if (stage === 1) {
    prompts.push({ x: 140, y: 386, text: "Move and jump" });
    prompts.push({ x: keyPlatform.x + 30, y: keyPlatform.y - 112, text: "Grab the key" });
    prompts.push({ x: endX - 70, y: 374, text: "Open the chest" });
  }
  if (stage === 2) {
    prompts.push({ x: platforms[2].x + 20, y: platforms[2].y - 86, text: "Hold jump for height" });
    prompts.push({ x: platforms[4].x + 20, y: platforms[4].y - 86, text: "Tap jump for control" });
  }
  if (stage === 3) {
    prompts.push({ x: platforms[3].x + 20, y: platforms[3].y - 86, text: "Spikes hurt" });
    prompts.push({ x: keyPlatform.x + 20, y: keyPlatform.y - 112, text: "Look for relics" });
  }
  return prompts;
}

function movingPlatformFor(platform, index, levelIndex, worldIndex) {
  const speed = 56 + levelIndex * 12 + worldIndex * 8;
  if ((index + worldIndex) % 2 === 0) {
    return { axis: "x", min: platform.x - 70, max: platform.x + 110, speed };
  }
  return { axis: "y", min: platform.y - 62, max: platform.y + 64, speed: speed * 0.7 };
}

function createStableCheckpoints(platforms, worldWidth) {
  return [0.38, 0.68].map((progress) => checkpointForStablePlatform(platforms, worldWidth * progress));
}

function normalizePlatformRoute(platforms) {
  const route = [...platforms].sort((a, b) => a.x - b.x);
  for (let i = 1; i < route.length; i += 1) {
    const previous = route[i - 1];
    const platform = route[i];
    const originalY = platform.y;
    if (previous.y - platform.y > 122) platform.y = previous.y - 122;
    if (platform.y - previous.y > 168) platform.y = previous.y + 168;
    platform.y = clampNumber(platform.y, 286, 474);
    const deltaY = platform.y - originalY;
    if (platform.baseY !== undefined) platform.baseY += deltaY;
    if (platform.move?.axis === "y") {
      platform.move.min += deltaY;
      platform.move.max += deltaY;
    }
  }
}

function addReachabilityBridges(platforms, kind) {
  let route = [...platforms].sort((a, b) => a.x - b.x);
  for (let i = 1; i < route.length; i += 1) {
    const previous = route[i - 1];
    const platform = route[i];
    const gap = platform.x - (previous.x + previous.width);
    if (gap <= 245) continue;
    const bridge = {
      x: previous.x + previous.width + 96,
      y: clampNumber((previous.y + platform.y) / 2, Math.min(previous.y, platform.y) - 50, Math.max(previous.y, platform.y) + 50),
      width: Math.min(210, gap - 120),
      height: 30,
      kind,
    };
    platforms.push(bridge);
    route = [...platforms].sort((a, b) => a.x - b.x);
    i = 0;
  }
}

function checkpointForStablePlatform(platforms, targetX) {
  const stablePlatforms = platforms.filter((platform) => !platform.falling && !platform.move && platform.width >= 150);
  const candidates = stablePlatforms.length ? stablePlatforms : platforms.filter((platform) => !platform.falling);
  const platform = candidates.reduce((best, current) => {
    const bestDistance = Math.abs(best.x + best.width / 2 - targetX);
    const currentDistance = Math.abs(current.x + current.width / 2 - targetX);
    return currentDistance < bestDistance ? current : best;
  }, candidates[0] || platforms[0]);
  const x = clampNumber(targetX, platform.x + 32, platform.x + platform.width - 56);
  return { x, y: platform.y - 48, width: 24, height: 48 };
}

function createPlatformGems(platforms, count, levelIndex) {
  const usable = platforms.filter((platform) => platform.width >= 150);
  return Array.from({ length: count }, (_, i) => {
    const platform = usable[clampNumber(1 + i, 0, usable.length - 1)];
    const lane = ((i * 37 + levelIndex * 19) % Math.max(1, platform.width - 88)) + 34;
    return {
      x: clampNumber(platform.x + lane, platform.x + 28, platform.x + platform.width - 50),
      y: platform.y - 56,
      secret: i === 5 && levelIndex >= 2,
    };
  });
}

function createPlatformSpikes(platforms, count, levelIndex, worldIndex) {
  const usable = platforms.filter((platform, index) => index > 0 && index < platforms.length - 1 && platform.width >= 170);
  return Array.from({ length: count }, (_, i) => {
    const platform = usable[(i * 2 + levelIndex + worldIndex) % usable.length] || platforms[0];
    const width = Math.min(58 + (i % 3) * 18, platform.width - 72);
    const safeSpan = Math.max(1, platform.width - width - 68);
    const offset = 34 + ((i * 53 + worldIndex * 29) % safeSpan);
    return {
      x: clampNumber(platform.x + offset, platform.x + 28, platform.x + platform.width - width - 28),
      y: platform.y,
      width,
      height: 30,
    };
  });
}

function makeEnemy(type, x, y, speed) {
  const sizes = {
    crab: { width: 42, height: 34 },
    slime: { width: 42, height: 36 },
    bat: { width: 44, height: 30 },
    boar: { width: 54, height: 42 },
    boss: { width: 78, height: 62 },
  };
  const size = sizes[type] || sizes.crab;
  return {
    type,
    x,
    y: type === "bat" ? y - 92 : type === "boss" ? y - 20 : y,
    width: size.width,
    height: size.height,
    minX: x - 62,
    maxX: x + 190,
    speed: type === "boar" ? speed + 45 : type === "boss" ? speed * 0.75 : speed,
    amplitude: type === "bat" ? 30 + speed * 0.08 : undefined,
  };
}

function makeEnemyOnPlatform(type, x, platform, speed) {
  const enemy = makeEnemy(type, x, platform.y, speed);
  if (type === "bat") {
    enemy.y = platform.y - 96;
    enemy.startY = enemy.y;
  } else {
    enemy.y = platform.y - enemy.height;
    enemy.startY = enemy.y;
  }
  enemy.minX = clampNumber(platform.x + 12, platform.x, platform.x + platform.width - enemy.width);
  enemy.maxX = clampNumber(platform.x + platform.width - 12, enemy.minX + enemy.width + 8, platform.x + platform.width);
  enemy.x = clampNumber(enemy.x, enemy.minX, enemy.maxX - enemy.width);
  return enemy;
}

function makeTrap(type, x, difficulty, theme) {
  if (type === "fire") {
    return {
      type,
      x,
      y: theme === "space" ? 350 : 386,
      width: 34,
      height: 78 + difficulty * 3,
      interval: Math.max(1.45, 2.5 - difficulty * 0.08),
      activeTime: 0.88 + Math.min(0.35, difficulty * 0.03),
    };
  }
  if (type === "rock") {
    return { type, x, y: 70, width: 34, height: 34, triggerX: x - 40, reset: Math.max(1.8, 2.8 - difficulty * 0.06) };
  }
  return { type: "swing", x, y: 160, length: 88 + difficulty * 5, radius: 18, speed: 2.0 + difficulty * 0.14 };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class InputController {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, jump: false };
    this.gamepad = { left: false, right: false, jump: false, pause: false };
    this.jumpQueued = false;
    this.pauseQueued = false;
    this.gamepadJumpHeld = false;
    this.gamepadPauseHeld = false;

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w", "p"].includes(key)) {
        event.preventDefault();
      }
      if ((key === "arrowup" || key === "w" || key === " ") && !this.keys.has(key)) this.jumpQueued = true;
      if (key === "p" && !this.keys.has(key)) this.pauseQueued = true;
      this.keys.add(key);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    document.querySelectorAll("[data-touch]").forEach((button) => {
      const action = button.dataset.touch;
      const press = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.touch[action] = true;
        if (action === "jump") this.jumpQueued = true;
      };
      const release = (event) => {
        event.preventDefault();
        button.releasePointerCapture?.(event.pointerId);
        this.touch[action] = false;
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointerleave", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
  }

  horizontal() {
    const keyboard = Number(this.keys.has("arrowright") || this.keys.has("d")) - Number(this.keys.has("arrowleft") || this.keys.has("a"));
    const touch = Number(this.touch.right) - Number(this.touch.left);
    const pad = Number(this.gamepad.right) - Number(this.gamepad.left);
    return clamp(keyboard + touch + pad, -1, 1);
  }

  jumpHeld() {
    return this.keys.has("arrowup") || this.keys.has("w") || this.keys.has(" ") || this.touch.jump || this.gamepad.jump;
  }

  consumeJump() {
    this.pollGamepad();
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  consumePause() {
    this.pollGamepad();
    const queued = this.pauseQueued;
    this.pauseQueued = false;
    return queued;
  }

  pollGamepad() {
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const pad = pads[0];
    if (!pad) {
      this.gamepad = { left: false, right: false, jump: false, pause: false };
      return;
    }
    const axisX = pad.axes[0] || 0;
    const jump = Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);
    const pause = Boolean(pad.buttons[9]?.pressed);
    this.gamepad.left = axisX < -0.3 || Boolean(pad.buttons[14]?.pressed);
    this.gamepad.right = axisX > 0.3 || Boolean(pad.buttons[15]?.pressed);
    this.gamepad.jump = jump;
    if (jump && !this.gamepadJumpHeld) this.jumpQueued = true;
    if (pause && !this.gamepadPauseHeld) this.pauseQueued = true;
    this.gamepadJumpHeld = jump;
    this.gamepadPauseHeld = pause;
  }
}

class AudioSystem {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  toggle() {
    this.muted = !this.muted;
    muteButton.textContent = this.muted ? "Muted" : "Sound";
  }

  play(type) {
    if (this.muted) return;
    if (!this.context) this.context = new AudioContext();
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const tones = {
      jump: [360, 0.06, "triangle"],
      gem: [760, 0.07, "sine"],
      key: [980, 0.12, "sine"],
      hurt: [150, 0.16, "sawtooth"],
      checkpoint: [540, 0.12, "triangle"],
      chest: [620, 0.35, "sine"],
      click: [420, 0.05, "square"],
    };
    const chimePack = game?.save?.shopOwned?.sound_chime;
    const [baseFrequency, duration, wave] = tones[type] || tones.click;
    const frequency = chimePack && ["gem", "key", "checkpoint", "chest"].includes(type) ? baseFrequency * 1.18 : baseFrequency;
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.55), now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  playWorldCue(world) {
    const cues = {
      Forest: [420, 560],
      Ice: [720, 920],
      Cave: [260, 340],
      Lava: [180, 240],
      Space: [520, 780],
    };
    const notes = cues[world] || cues.Forest;
    notes.forEach((frequency, index) => this.playTone(frequency, 0.09, index * 0.08));
  }

  playTone(frequency, duration, delay = 0) {
    if (this.muted) return;
    if (!this.context) this.context = new AudioContext();
    const now = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }
}

class Player {
  constructor(start, upgrades = {}) {
    this.width = 34;
    this.height = 48;
    this.speed = MOVEMENT.maxSpeed;
    this.jumpPower = MOVEMENT.jumpPower + (upgrades.jumpBoots ? 46 : 0);
    this.wallJumpX = 430;
    this.maxHealth = 3 + (upgrades.heartCharm ? 1 : 0);
    this.setSpawn(start);
    this.reset(true);
  }

  setSpawn(point) {
    this.spawn = { x: point.x, y: point.y };
  }

  reset(clearProgress = false) {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.wallSide = 0;
    this.doubleJump = 1;
    this.invulnerableTimer = 0;
    this.animTime = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpReleased = true;
    this.landingSquash = 0;
    this.jumpStretch = 0;
    this.groundEdgeDistance = 999;
    this.justLanded = false;
    this.justJumped = false;
    if (clearProgress) {
      this.health = this.maxHealth;
      this.hasKey = false;
      this.gems = 0;
      this.relic = false;
    }
  }

  get rect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(input, level, delta, audio) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.justLanded = false;
    this.justJumped = false;
    const wasGrounded = this.grounded;
    const move = input.horizontal();
    const targetSpeed = move * MOVEMENT.maxSpeed;
    const iceFactor = level.theme === "ice" ? 0.42 : 1;
    const acceleration = this.grounded
      ? (move ? MOVEMENT.groundAcceleration : MOVEMENT.groundDeceleration)
      : (move ? MOVEMENT.airAcceleration : MOVEMENT.airDeceleration);
    this.vx = approach(this.vx, targetSpeed, acceleration * iceFactor * delta);
    if (move !== 0) this.facing = Math.sign(move);

    if (this.grounded) this.coyoteTimer = MOVEMENT.coyoteTime;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    if (input.consumeJump()) this.jumpBufferTimer = MOVEMENT.jumpBufferTime;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    this.tryBufferedJump(audio);
    this.applyVariableJump(input);

    const gravityScale = level.theme === "space" ? 0.62 : level.theme === "lava" ? 1.08 : 1;
    this.vy = Math.min(this.vy + GAME.gravity * gravityScale * delta, GAME.maxFall);
    if (this.wallSide && !this.grounded && this.vy > 240) this.vy = 240;

    this.x += this.vx * delta;
    this.collideHorizontally(level.walls);
    this.y += this.vy * delta;
    this.collideVertically(level.solids);
    this.groundEdgeDistance = this.grounded ? edgeDistanceForGround(this, level.solids) : 999;
    this.tryBufferedJump(audio);
    this.x = clamp(this.x, 0, level.worldWidth - this.width);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
    this.animTime += delta;
    this.landingSquash = Math.max(0, this.landingSquash - delta * 5.2);
    this.jumpStretch = Math.max(0, this.jumpStretch - delta * 6.5);
    if (!wasGrounded && this.grounded) this.justLanded = true;

    if (this.y > GAME.height + 180) this.takeDamage(level, audio, "Watch your step");
  }

  tryBufferedJump(audio) {
    if (this.jumpBufferTimer <= 0) return;
    if (this.grounded || this.coyoteTimer > 0) {
      this.performJump(audio, 1);
      this.doubleJump = 1;
      this.coyoteTimer = 0;
      return;
    }
    if (this.wallSide) {
      this.vy = -this.jumpPower * 0.9;
      this.vx = -this.wallSide * this.wallJumpX;
      this.x += -this.wallSide * 10;
      this.facing = -this.wallSide;
      this.wallSide = 0;
      this.doubleJump = 1;
      audio.play("jump");
      this.jumpBufferTimer = 0;
      this.jumpReleased = false;
      this.jumpStretch = 1;
      this.justJumped = true;
      return;
    }
    if (this.doubleJump > 0) {
      this.performJump(audio, 0.82);
      this.doubleJump -= 1;
    }
  }

  performJump(audio, powerScale) {
    this.vy = -this.jumpPower * powerScale;
    this.grounded = false;
    this.jumpBufferTimer = 0;
    this.jumpReleased = false;
    this.jumpStretch = 1;
    this.justJumped = true;
    audio.play("jump");
  }

  applyVariableJump(input) {
    const held = input.jumpHeld();
    if (!held && !this.jumpReleased && this.vy < 0) {
      this.vy *= MOVEMENT.jumpCutMultiplier;
      this.jumpReleased = true;
    }
    if (held) this.jumpReleased = false;
  }

  collideHorizontally(solids) {
    this.wallSide = 0;
    for (const solid of solids) {
      if (solid.active === false) continue;
      if (!rectsOverlap(this.rect, solid)) continue;
      if (this.vx > 0) {
        this.x = solid.x - this.width;
        this.wallSide = 1;
      } else if (this.vx < 0) {
        this.x = solid.x + solid.width;
        this.wallSide = -1;
      }
      this.vx = 0;
    }
  }

  collideVertically(platforms) {
    this.grounded = false;
    const previousBottom = this.prevY + this.height;
    const previousTop = this.prevY;
    const landingForgiveness = 8;
    for (const platform of platforms) {
      if (!platform.active || !rectsOverlap(this.rect, platform)) continue;
      const wasAbove = previousBottom <= platform.y + landingForgiveness;
      const wasBelow = previousTop >= platform.y + platform.height - landingForgiveness;
      if (this.vy > 0 && wasAbove) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.grounded = true;
        this.coyoteTimer = MOVEMENT.coyoteTime;
        this.doubleJump = 1;
        this.landingSquash = Math.min(1, Math.max(this.landingSquash, Math.abs(this.prevY - this.y) / 70));
        this.x += platform.dx || 0;
        if (platform.falling) platform.triggered = true;
      } else if (this.vy < 0 && wasBelow) {
        this.y = platform.y + platform.height;
        this.vy = 0;
      }
    }
  }

  takeDamage(level, audio, message, inventory = null) {
    if (this.invulnerableTimer > 0) return null;
    this.health -= 1;
    audio.play("hurt");
    const result = this.health <= 0 ? "full-reset" : "checkpoint";
    if (this.health <= 0 && inventory?.extraLives > 0) {
      inventory.extraLives -= 1;
      this.health = this.maxHealth;
      this.x = this.spawn.x;
      this.y = this.spawn.y;
      this.vx = 0;
      this.vy = 0;
      this.invulnerableTimer = 1.4;
      return "extra-life";
    }
    if (this.health <= 0) {
      this.health = this.maxHealth;
      this.hasKey = false;
      level.resetPickups();
    }
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.invulnerableTimer = 1.2;
    return message || result;
  }
}

class Enemy {
  constructor(config) {
    Object.assign(this, config);
    this.startX = config.x;
    this.startY = config.y;
    this.direction = 1;
    this.time = 0;
  }

  get rect() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(delta) {
    this.time += delta;
    if (this.type === "boss") {
      const cycle = this.time % 3.2;
      const charge = cycle > 1.05 && cycle < 2.35;
      this.x += this.speed * (charge ? 1.75 : 0.25) * this.direction * delta;
      this.telegraphing = !charge;
    } else if (this.type === "bat") {
      this.x += this.speed * this.direction * delta;
      this.y = this.startY + Math.sin(this.time * 3) * (this.amplitude || 24);
    } else if (this.type === "boar") {
      this.x += this.speed * this.direction * delta;
    } else {
      this.x += this.speed * this.direction * delta;
      if (this.type === "slime") this.y = this.startY + Math.sin(this.time * 7) * 5;
    }

    if (this.x < this.minX) {
      this.x = this.minX;
      this.direction = 1;
    }
    if (this.x + this.width > this.maxX) {
      this.x = this.maxX - this.width;
      this.direction = -1;
    }
  }
}

class Level {
  constructor(config) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.subtitle = config.subtitle;
    this.world = config.world;
    this.stage = config.stage;
    this.theme = config.theme;
    this.treasure = config.treasure;
    this.story = config.story;
    this.hint = config.hint;
    this.relicLore = config.relicLore;
    this.isBoss = Boolean(config.isBoss);
    this.isBonus = Boolean(config.isBonus);
    this.parTime = config.parTime;
    this.hasSecretExit = Boolean(config.hasSecretExit);
    this.worldWidth = config.worldWidth;
    this.start = { ...config.start };
    this.chest = { ...config.chest };
    this.key = { ...config.key, collected: false };
    this.relic = config.relic ? { ...config.relic, collected: false } : null;
    this.platforms = config.platforms.map((platform) => ({
      ...platform,
      baseX: platform.x,
      baseY: platform.y,
      dx: 0,
      dy: 0,
      active: true,
      triggered: false,
      fallTimer: 0,
      resetTimer: 0,
      direction: 1,
    }));
    this.walls = (config.walls || []).map((wall) => ({ ...wall }));
    this.solids = [...this.platforms, ...this.walls];
    this.checkpoints = config.checkpoints.map((checkpoint) => ({ ...checkpoint, active: false }));
    this.gems = config.gems.map((gem) => ({ ...gem, width: 22, height: 22, collected: false }));
    this.spikes = config.spikes.map((spike) => attachSpikeToPlatform({ ...spike }, this.platforms));
    this.enemies = config.enemies.map((enemy) => new Enemy(enemy));
    this.traps = config.traps.map((trap) => ({ ...trap, time: 0, active: false, falling: false, y: trap.y, startY: trap.y }));
    this.scenery = config.scenery.map((item) => ({ ...item }));
    this.tutorials = (config.tutorials || []).map((prompt) => ({ ...prompt }));
    this.environmentTime = 0;
    this.heatActive = false;
  }

  update(delta, playerX) {
    this.environmentTime += delta;
    this.heatActive = this.theme === "lava" && this.environmentTime % 4 < 0.85;
    for (const platform of this.platforms) {
      platform.dx = 0;
      platform.dy = 0;
      if (platform.move) {
        const oldX = platform.x;
        const oldY = platform.y;
        platform[platform.move.axis] += platform.move.speed * platform.direction * delta;
        if (platform[platform.move.axis] < platform.move.min) {
          platform[platform.move.axis] = platform.move.min;
          platform.direction = 1;
        }
        if (platform[platform.move.axis] > platform.move.max) {
          platform[platform.move.axis] = platform.move.max;
          platform.direction = -1;
        }
        platform.dx = platform.x - oldX;
        platform.dy = platform.y - oldY;
      }
      if (platform.falling) {
        if (platform.triggered && platform.active) platform.fallTimer += delta;
        if (platform.fallTimer > platform.falling.delay) {
          platform.y += 360 * delta;
          platform.dy = 360 * delta;
          if (platform.y > GAME.height + 80) {
            platform.active = false;
            platform.resetTimer += delta;
          }
        }
        if (!platform.active) platform.resetTimer += delta;
        if (platform.resetTimer > platform.falling.reset) {
          platform.y = platform.baseY;
          platform.x = platform.baseX;
          platform.active = true;
          platform.triggered = false;
          platform.fallTimer = 0;
          platform.resetTimer = 0;
        }
      }
    }

    this.updateAnchoredSpikes();
    this.enemies.forEach((enemy) => enemy.update(delta));
    this.updateTraps(delta, playerX);
  }

  updateAnchoredSpikes() {
    for (const spike of this.spikes) {
      if (spike.platformIndex === undefined) continue;
      const platform = this.platforms[spike.platformIndex];
      if (!platform) continue;
      spike.x = platform.x + spike.platformOffsetX;
      spike.y = platform.y + spike.platformOffsetY;
      spike.active = platform.active !== false;
    }
  }

  updateTraps(delta, playerX) {
    for (const trap of this.traps) {
      trap.time += delta;
      if (trap.type === "fire") trap.active = trap.time % trap.interval < trap.activeTime;
      if (trap.type === "rock") {
        if (!trap.falling && Math.abs(playerX - trap.triggerX) < 80) trap.falling = true;
        if (trap.falling) {
          trap.y += 520 * delta;
          if (trap.y > GAME.height + 60) {
            trap.falling = false;
            trap.y = trap.startY;
          }
        }
      }
    }
  }

  resetPickups() {
    this.key.collected = false;
    this.gems.forEach((gem) => {
      gem.collected = false;
    });
    if (this.relic) this.relic.collected = false;
  }
}

class TreasureTrail {
  constructor(levelConfigs) {
    this.input = new InputController();
    this.audio = new AudioSystem();
    this.levelConfigs = levelConfigs;
    this.save = loadSave();
    this.save.unlockedLevel = clamp(this.save.unlockedLevel || 0, 0, MAIN_LEVEL_COUNT - 1);
    this.selectedLevel = this.save.unlockedLevel;
    this.mode = "campaign";
    this.speedrun = false;
    this.speedrunTime = 0;
    this.cosmeticIndex = this.save.cosmeticIndex || 0;
    this.activeCosmetic = null;
    this.state = STATE.START;
    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.transitionTimer = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.damageTaken = 0;
    this.messageTimer = 0;
    this.particles = [];
    this.loadLevel(this.selectedLevel);
    this.renderLevelSelect();
    requestAnimationFrame((time) => this.loop(time));
  }

  loadLevel(index) {
    this.levelIndex = clamp(index, 0, this.levelConfigs.length - 1);
    this.level = new Level(this.levelConfigs[this.levelIndex]);
    this.player = new Player(this.level.start, this.getPlayerUpgrades());
    this.player.cosmetic = this.getActiveCosmetic();
    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.elapsed = 0;
    this.damageTaken = 0;
    this.transitionTimer = 1.15;
    this.particles = [];
    this.setStatus(`${this.level.world} trail begins`);
    levelTitle.textContent = `${this.level.name}: ${this.level.subtitle}`;
    storyText.textContent = this.level.story || WORLD_STORIES[this.level.world] || storyText.textContent;
    nextLevelButton.style.display = !this.level.isBonus && this.levelIndex < MAIN_LEVEL_COUNT - 1 ? "inline-block" : "none";
    if (this.state === STATE.PLAYING) this.audio.playWorldCue(this.level.world);
    this.updateBadges();
    this.renderMetaPanels();
  }

  start() {
    this.audio.play("click");
    this.state = STATE.PLAYING;
    if (this.speedrun && this.elapsed === 0) this.speedrunTime = 0;
    this.loadLevel(this.selectedLevel);
    hide(startScreen);
    hide(pauseScreen);
    hide(winScreen);
    hide(vaultScreen);
    hide(shopScreen);
  }

  restart() {
    this.audio.play("click");
    this.state = STATE.PLAYING;
    this.loadLevel(this.levelIndex);
    hide(startScreen);
    hide(pauseScreen);
    hide(winScreen);
    hide(vaultScreen);
    hide(shopScreen);
  }

  togglePause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      show(pauseScreen);
      pauseButton.textContent = "Resume";
      return;
    }
    if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      hide(pauseScreen);
      pauseButton.textContent = "Pause";
    }
  }

  nextLevel() {
    const nextIndex = clamp(this.levelIndex + 1, 0, MAIN_LEVEL_COUNT - 1);
    if (nextIndex > this.save.unlockedLevel) {
      this.flashStatus("Next level is locked");
      return;
    }
    this.selectedLevel = nextIndex;
    this.state = STATE.PLAYING;
    this.loadLevel(this.selectedLevel);
    hide(winScreen);
  }

  loop(time) {
    const delta = Math.min((time - this.lastTime) / 1000 || 0, 0.033);
    this.lastTime = time;
    if (this.input.consumePause() && (this.state === STATE.PLAYING || this.state === STATE.PAUSED)) this.togglePause();
    if (this.state === STATE.PLAYING) this.update(delta);
    this.draw();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(delta) {
    this.elapsed += delta;
    if (this.speedrun) this.speedrunTime += delta;
    this.messageTimer = Math.max(0, this.messageTimer - delta);
    this.transitionTimer = Math.max(0, this.transitionTimer - delta);
    this.level.update(delta, this.player.x);
    this.player.update(this.input, this.level, delta, this.audio);
    this.emitMovementFeedback();
    this.checkCheckpoints();
    this.checkPickups();
    this.checkHazards();
    this.checkChest();
    this.updateParticles(delta);
    this.updateCamera(delta);
    if (this.messageTimer === 0) this.setStatus(this.player.hasKey ? "Reach the chest" : "Find the key");
    this.updateBadges();
  }

  updateCamera(delta) {
    const lookAhead = clamp(this.player.vx * 0.18, -72, 92);
    this.cameraTargetX = clamp(this.player.x + this.player.width / 2 + lookAhead - GAME.width * 0.42, 0, this.level.worldWidth - GAME.width);
    const blend = 1 - Math.exp(-MOVEMENT.cameraSharpness * delta);
    this.cameraX += (this.cameraTargetX - this.cameraX) * blend;
  }

  getPlayerUpgrades() {
    return {
      heartCharm: Boolean(this.save.shopOwned.heart_charm),
      jumpBoots: Boolean(this.save.shopOwned.jump_boots),
      gemMagnet: Boolean(this.save.shopOwned.gem_magnet),
    };
  }

  getActiveCosmetic() {
    const activeItem = SHOP_ITEMS.find((item) => item.id === this.save.activeSkin && item.cosmetic);
    const base = activeItem?.cosmetic || COSMETICS[this.cosmeticIndex % COSMETICS.length];
    return {
      ...base,
      crown: Boolean(this.save.shopOwned.hat_crown),
      sparkTrail: Boolean(this.save.shopOwned.trail_spark),
    };
  }

  emitMovementFeedback() {
    if (this.player.justJumped) {
      this.emitMovementDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 8, 90);
    }
    if (this.player.justLanded) {
      this.emitMovementDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10, 130);
    }
  }

  checkCheckpoints() {
    for (const checkpoint of this.level.checkpoints) {
      if (!checkpoint.active && rectsOverlap(this.player.rect, checkpoint)) {
        checkpoint.active = true;
        this.player.setSpawn({
          x: checkpoint.x + checkpoint.width / 2 - this.player.width / 2,
          y: checkpoint.y + checkpoint.height - this.player.height,
        });
        this.flashStatus("Checkpoint saved");
        this.audio.play("checkpoint");
      }
    }
  }

  checkPickups() {
    if (!this.level.key.collected && rectsOverlap(this.player.rect, this.level.key)) {
      this.level.key.collected = true;
      this.player.hasKey = true;
      this.flashStatus("Key collected");
      this.audio.play("key");
      this.emitSparkles(this.level.key.x + 17, this.level.key.y + 10, "#ffe483", 18);
    }

    for (const gem of this.level.gems) {
      const magnetRange = this.save.shopOwned.gem_magnet ? 64 : 0;
      const magnetHit = magnetRange > 0 && distanceBetweenRects(this.player.rect, gem) <= magnetRange;
      if (!gem.collected && (rectsOverlap(this.player.rect, gem) || magnetHit)) {
        gem.collected = true;
        this.player.gems += 1;
        this.flashStatus(gem.secret ? "Secret gem found" : "Gem collected");
        this.audio.play("gem");
        this.emitSparkles(gem.x + 11, gem.y + 11, gem.secret ? "#ba7cff" : "#7ee3ff", 10);
      }
    }

    if (this.level.relic && !this.level.relic.collected && rectsOverlap(this.player.rect, this.level.relic)) {
      this.level.relic.collected = true;
      this.player.relic = true;
      this.flashStatus("Hidden relic found");
      this.audio.play("key");
      this.emitSparkles(this.level.relic.x + 12, this.level.relic.y + 12, "#ba7cff", 20);
    }
  }

  checkHazards() {
    if (this.player.invulnerableTimer > 0) return;
    const body = insetRect(this.player.rect, 6);
    const enemyHit = this.level.enemies.some((enemy) => rectsOverlap(body, enemy.rect));
    const spikeHit = this.level.spikes.some((spike) => spike.active !== false && rectsOverlap(body, spike));
    const trapHit = this.level.traps.some((trap) => trapHitsPlayer(trap, body));
    const heatHit = this.level.heatActive && this.player.y + this.player.height > 452;
    if (!enemyHit && !spikeHit && !trapHit && !heatHit) return;

    const reason = heatHit ? "Lava heat burst" : spikeHit ? "Watch the spikes" : trapHit ? "Trap sprung" : "Avoid the enemies";
    if (this.save.inventory.shields > 0) {
      this.save.inventory.shields -= 1;
      this.player.invulnerableTimer = 1.25;
      saveGame(this.save);
      this.flashStatus("Shield blocked hit");
      this.audio.play("checkpoint");
      return;
    }
    const result = this.player.takeDamage(this.level, this.audio, reason, this.save.inventory);
    if (result === "extra-life") saveGame(this.save);
    if (result) this.damageTaken += 1;
    this.flashStatus(result === "extra-life" ? "Extra life used" : result === "full-reset" ? "Health restored at start" : reason);
  }

  checkChest() {
    if (!rectsOverlap(this.player.rect, this.level.chest)) return;
    if (!this.player.hasKey) {
      this.flashStatus("Chest is locked");
      return;
    }
    this.win();
  }

  win() {
    this.state = STATE.WON;
    this.audio.play("chest");
    this.emitSparkles(this.level.chest.x + 30, this.level.chest.y + 20, "#ffe483", 42);
    this.setStatus("Treasure found");
    const bestKey = this.level.id;
    const oldBest = this.save.bestTimes[bestKey];
    if (!oldBest || this.elapsed < oldBest) this.save.bestTimes[bestKey] = this.elapsed;
    const stars = this.calculateStars();
    this.save.walletGems += this.player.gems;
    this.save.stars[bestKey] = Math.max(this.save.stars[bestKey] || 0, stars.count);
    this.save.medals[bestKey] = bestMedal(this.save.medals[bestKey], stars.medal);
    if (this.player.relic && this.level.relicLore) this.save.relics[this.level.world] = this.level.relicLore;
    if (this.player.relic && this.level.hasSecretExit) {
      this.save.secretExits[bestKey] = true;
      this.save.bonusLevels[this.level.world] = true;
    }
    if (this.mode !== "practice" && !this.level.isBonus) {
      this.save.unlockedLevel = Math.max(this.save.unlockedLevel || 0, Math.min(this.levelIndex + 1, MAIN_LEVEL_COUNT - 1));
    }
    saveGame(this.save);
    this.renderLevelSelect();
    this.renderMetaPanels();
    this.renderScore(stars);
    const treasure = this.level.treasure || "treasure";
    winSummary.textContent = `Recovered the ${treasure} in ${formatTime(this.elapsed)} with ${this.player.gems}/${this.level.gems.length} gems${this.player.relic ? ", the hidden relic" : ""}${this.player.relic && this.level.hasSecretExit ? ", and a bonus route" : ""}${this.speedrun ? `, campaign time ${formatTime(this.speedrunTime)}` : ""}.`;
    show(winScreen);
    this.updateBadges();
  }

  calculateStars() {
    const finish = true;
    const allGems = this.player.gems >= this.level.gems.length;
    const relic = Boolean(this.player.relic);
    const noDamage = this.damageTaken === 0;
    const timeRatio = this.elapsed / Math.max(1, this.level.parTime || 60);
    const medal = timeRatio <= 1 && allGems && noDamage ? "Gold" : timeRatio <= 1.35 && (allGems || noDamage) ? "Silver" : "Bronze";
    return {
      count: Number(finish) + Number(allGems) + Number(relic),
      medal,
      labels: [
        { text: "Finish", earned: finish },
        { text: "All gems", earned: allGems },
        { text: "Relic", earned: relic },
        { text: `${medal} medal`, earned: true },
      ],
    };
  }

  renderScore(stars) {
    scoreRow.innerHTML = "";
    stars.labels.forEach((star) => {
      const item = document.createElement("span");
      item.className = `score-star${star.earned ? "" : " missing"}`;
      item.textContent = `${star.earned ? "Star" : "Empty"}: ${star.text}`;
      scoreRow.append(item);
    });
  }

  renderLevelSelect() {
    levelSelect.innerHTML = "";
    this.levelConfigs.forEach((level, index) => {
      const locked = this.isLevelLocked(level, index);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-choice${index === this.selectedLevel ? " active" : ""}${locked ? " locked" : ""}`;
      button.disabled = locked;
      button.setAttribute("aria-disabled", String(locked));
      const best = this.save.bestTimes[level.id] ? `Best ${formatTime(this.save.bestTimes[level.id])}` : "No best yet";
      const stars = this.save.stars[level.id] ? ` ${"*".repeat(this.save.stars[level.id])}` : "";
      const medal = this.save.medals[level.id] ? ` ${this.save.medals[level.id]}` : "";
      const label = level.isBonus ? `${level.world} Bonus` : `${index + 1}. ${level.name}`;
      button.textContent = locked ? `${label} - Locked` : `${label} - ${best}${stars}${medal}`;
      button.addEventListener("click", () => {
        if (locked) {
          this.flashStatus("Finish the previous level first");
          return;
        }
        this.selectedLevel = index;
        this.audio.play("click");
        this.renderLevelSelect();
        this.renderLevelPreview();
      });
      levelSelect.append(button);
    });
    this.renderLevelPreview();
  }

  renderMetaPanels() {
    this.renderWorldMap();
    this.renderVault();
    const relics = Object.values(this.save.relics);
    const bonusCount = Object.keys(this.save.bonusLevels).length;
    journalPanel.textContent = relics.length ? `Relic journal: ${relics.join(" ")}` : "Relic journal: none found yet.";
    const allMainComplete = this.allMainComplete();
    const relicCount = Object.keys(this.save.relics).length;
    vaultPanel.textContent = allMainComplete
      ? `Final vault: open. Relics found ${relicCount}/5. Bonus routes unlocked ${bonusCount}/5.`
      : `Final vault: locked. Clear all 25 levels to open it. Relics found ${relicCount}/5. Bonus routes unlocked ${bonusCount}/5.`;
    cosmeticButton.textContent = `Look: ${this.getActiveCosmetic().name}`;
    practiceButton.textContent = this.mode === "practice" ? "Practice On" : "Practice Off";
    speedrunButton.textContent = this.speedrun ? "Speedrun On" : "Speedrun Off";
    vaultButton.textContent = this.allMainComplete() ? "Vault Open" : "Vault Locked";
    shopButton.textContent = `Shop: ${this.save.walletGems} gems`;
    reducedMotionButton.textContent = this.save.reducedMotion ? "Motion: Reduced" : "Motion: Full";
    touchSizeButton.textContent = this.save.largeTouch ? "Touch: Large" : "Touch: Normal";
    document.body.classList.toggle("reduced-motion", Boolean(this.save.reducedMotion));
    document.body.classList.toggle("large-touch", Boolean(this.save.largeTouch));
  }

  isLevelLocked(level, index) {
    if (level.isBonus) return !this.save.bonusLevels[level.world];
    return index > this.save.unlockedLevel;
  }

  renderLevelPreview() {
    const level = this.levelConfigs[this.selectedLevel];
    if (!level) return;
    const tags = previewTags(level);
    levelPreview.innerHTML = `<strong>${level.name}: ${level.subtitle}</strong><br>${level.hint || WORLD_HINTS[level.world] || "Reach the chest with the key."}<div class="preview-tags">${tags.map((tag) => `<span class="preview-tag">${tag}</span>`).join("")}</div>`;
  }

  allMainComplete() {
    return this.save.unlockedLevel >= MAIN_LEVEL_COUNT - 1 && CAMPAIGN_LEVELS.every((level) => this.save.bestTimes[level.id]);
  }

  renderVault() {
    const open = this.allMainComplete();
    vaultGrid.innerHTML = "";
    WORLD_CONFIGS.forEach((world) => {
      const tile = document.createElement("div");
      const recovered = CAMPAIGN_LEVELS.filter((level) => level.world === world.name).every((level) => this.save.bestTimes[level.id]);
      tile.className = `vault-tile${recovered ? " open" : ""}`;
      tile.textContent = recovered ? `${TREASURES[world.name]} recovered` : `${world.name} treasure locked`;
      vaultGrid.append(tile);
    });
    vaultSummary.textContent = open
      ? "The final vault is open. Every world treasure is displayed here."
      : "Clear all 25 main levels to open the final treasure vault.";
  }

  showVault() {
    this.renderVault();
    show(vaultScreen);
  }

  showShop() {
    this.renderShop();
    show(shopScreen);
  }

  renderShop() {
    shopBalance.textContent = `Gems: ${this.save.walletGems} | Shields: ${this.save.inventory.shields} | Extra lives: ${this.save.inventory.extraLives}`;
    shopGrid.innerHTML = "";
    SHOP_ITEMS.forEach((item) => {
      const owned = Boolean(this.save.shopOwned[item.id]);
      const active = this.save.activeSkin === item.id || this.save.activeSound === item.id || this.save.activeFlag === item.id;
      const card = document.createElement("article");
      card.className = `shop-card${owned ? " owned" : ""}`;
      const title = document.createElement("h3");
      title.textContent = item.name;
      const desc = document.createElement("p");
      desc.textContent = `${item.description} Cost: ${item.cost} gems.`;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.type === "consumable" ? "Buy" : owned ? active ? "Equipped" : "Equip" : "Buy";
      button.disabled = item.type !== "consumable" && active;
      button.addEventListener("click", () => this.buyOrEquipItem(item));
      card.append(title, desc, button);
      shopGrid.append(card);
    });
  }

  buyOrEquipItem(item) {
    const owned = Boolean(this.save.shopOwned[item.id]);
    if (item.type !== "consumable" && owned) {
      this.equipShopItem(item);
      return;
    }
    if (this.save.walletGems < item.cost) {
      this.flashStatus("Not enough gems");
      this.renderShop();
      return;
    }
    this.save.walletGems -= item.cost;
    if (item.type === "consumable") {
      this.save.inventory[item.inventoryKey] = (this.save.inventory[item.inventoryKey] || 0) + 1;
    } else {
      this.save.shopOwned[item.id] = true;
      this.equipShopItem(item, false);
    }
    saveGame(this.save);
    if (this.player) {
      this.player.cosmetic = this.getActiveCosmetic();
      this.player.maxHealth = 3 + (this.save.shopOwned.heart_charm ? 1 : 0);
      this.player.health = Math.min(this.player.maxHealth, Math.max(this.player.health, this.player.maxHealth));
      this.player.jumpPower = MOVEMENT.jumpPower + (this.save.shopOwned.jump_boots ? 46 : 0);
    }
    this.audio.play("key");
    this.renderShop();
    this.renderMetaPanels();
  }

  equipShopItem(item, persist = true) {
    if (item.type === "skin") this.save.activeSkin = item.id;
    if (item.type === "sound") this.save.activeSound = item.id;
    if (item.type === "flag") this.save.activeFlag = item.id;
    if (this.player) this.player.cosmetic = this.getActiveCosmetic();
    if (persist) saveGame(this.save);
    this.renderShop();
    this.renderMetaPanels();
  }

  renderWorldMap() {
    worldMap.innerHTML = "";
    WORLD_CONFIGS.forEach((world, worldIndex) => {
      const firstLevel = worldIndex * 5;
      const lastLevel = firstLevel + 4;
      const node = document.createElement("div");
      const unlocked = this.save.unlockedLevel >= firstLevel;
      const complete = this.save.unlockedLevel > lastLevel || (lastLevel === MAIN_LEVEL_COUNT - 1 && this.save.bestTimes[CAMPAIGN_LEVELS[lastLevel].id]);
      node.className = `world-node${unlocked ? " unlocked" : ""}${complete ? " complete" : ""}`;
      node.textContent = `${world.name} ${complete ? "complete" : unlocked ? "open" : "locked"}`;
      worldMap.append(node);
    });
  }

  flashStatus(text) {
    this.setStatus(text);
    this.messageTimer = 1.15;
  }

  setStatus(text) {
    statusText.textContent = text;
  }

  updateBadges() {
    healthBadge.textContent = `Health: ${this.player.health}`;
    coinBadge.textContent = `Gems: ${this.player.gems}/${this.level.gems.length}`;
    timerBadge.textContent = `Time: ${formatTime(this.elapsed)}`;
    bestBadge.textContent = `Best: ${this.save.bestTimes[this.level.id] ? formatTime(this.save.bestTimes[this.level.id]) : "--"}`;
    keyBadge.textContent = this.player.hasKey ? "Key: collected" : "Key: missing";
  }

  emitSparkles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 80 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1,
        color,
      });
    }
  }

  emitMovementDust(x, y, count, spread) {
    for (let i = 0; i < count; i += 1) {
      const direction = i % 2 === 0 ? -1 : 1;
      this.particles.push({
        x,
        y,
        vx: direction * (35 + Math.random() * spread),
        vy: -25 - Math.random() * 55,
        life: 0.18 + Math.random() * 0.18,
        maxLife: 0.36,
        color: this.player?.cosmetic?.sparkTrail ? "#ffe483" : "rgba(255, 248, 231, 0.58)",
        size: 2 + Math.random() * 2,
      });
    }
  }

  updateParticles(delta) {
    for (const particle of this.particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 520 * delta;
      particle.life -= delta;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  draw() {
    drawBackground(this.level.theme, this.cameraX);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    drawScenery(this.level);
    drawPlatforms(this.level.platforms);
    drawWalls(this.level.walls);
    drawCheckpoints(this.level.checkpoints);
    drawSpikes(this.level.spikes);
    drawTraps(this.level.traps);
    drawChest(this.level.chest, this.player.hasKey, this.state === STATE.WON);
    if (!this.level.key.collected) drawKey(this.level.key);
    drawGems(this.level.gems);
    if (this.level.relic && !this.level.relic.collected) drawRelic(this.level.relic);
    drawTutorialPrompts(this.level.tutorials);
    this.level.enemies.forEach(drawEnemy);
    drawPlayer(this.player);
    drawParticles(this.particles);
    ctx.restore();
    drawForeground();
    drawWorldTransition(this.level, this.transitionTimer);
  }
}

function drawBackground(theme, cameraX) {
  const sky = ctx.createLinearGradient(0, 0, 0, GAME.height);
  if (theme === "cave") {
    sky.addColorStop(0, "#26344b");
    sky.addColorStop(0.55, "#344852");
    sky.addColorStop(1, "#18252e");
  } else if (theme === "ice") {
    sky.addColorStop(0, "#bdeaff");
    sky.addColorStop(0.55, "#d8f4ff");
    sky.addColorStop(1, "#8ab6d3");
  } else if (theme === "lava") {
    sky.addColorStop(0, "#3b1f2f");
    sky.addColorStop(0.5, "#7f3328");
    sky.addColorStop(1, "#1b1518");
  } else if (theme === "space") {
    sky.addColorStop(0, "#0b1028");
    sky.addColorStop(0.55, "#1d2b56");
    sky.addColorStop(1, "#080a16");
  } else if (theme === "storm") {
    sky.addColorStop(0, "#52627b");
    sky.addColorStop(0.55, "#8d9eaa");
    sky.addColorStop(1, "#2a3648");
  } else {
    sky.addColorStop(0, "#79c4e4");
    sky.addColorStop(0.58, "#cbe7d5");
    sky.addColorStop(1, "#f2c678");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  if (theme === "space") {
    drawStars(cameraX);
  }

  const farHill = theme === "ice" ? "#b8d9e8" : theme === "lava" ? "#5d2c2c" : theme === "cave" ? "#2d4050" : "#6c8f72";
  const midHill = theme === "ice" ? "#8fb8cb" : theme === "lava" ? "#3f2528" : theme === "storm" || theme === "space" ? "#46536a" : "#4f785e";
  const nearHill = theme === "forest" ? "#345849" : theme === "lava" ? "#2a1b20" : "#263846";
  drawLayeredHill(-cameraX * 0.16, 340, farHill, 0.8, 190);
  drawLayeredHill(-cameraX * 0.3, 392, midHill, 0.9, 150);
  drawLayeredHill(-cameraX * 0.48, 450, nearHill, 1, 110);

  ctx.fillStyle = "rgba(255, 248, 231, 0.84)";
  if (theme === "cave") {
    drawCaveLights(cameraX);
  } else if (theme === "space") {
    drawPlanets(cameraX);
  } else {
    drawCloud(150 - cameraX * 0.12, 92, 1.05);
    drawCloud(620 - cameraX * 0.1, 142, 0.82);
    drawCloud(1090 - cameraX * 0.12, 88, 0.95);
  }
}

function drawLayeredHill(offset, baseY, color, alpha, height) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GAME.height);
  for (let x = -240; x <= GAME.width + 240; x += 120) {
    const worldX = x + positiveModulo(offset, 240);
    const y = baseY - Math.sin((x + offset) * 0.008) * height * 0.28;
    ctx.quadraticCurveTo(worldX + 60, y - height, worldX + 120, y);
  }
  ctx.lineTo(GAME.width, GAME.height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(positiveModulo(x, GAME.width + 440) - 220, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 10, 26, Math.PI, 0);
  ctx.arc(30, -2, 34, Math.PI, 0);
  ctx.arc(70, 11, 25, Math.PI, 0);
  ctx.lineTo(96, 26);
  ctx.lineTo(-24, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCaveLights(cameraX) {
  for (let x = -120; x < GAME.width + 160; x += 280) {
    const px = positiveModulo(x - cameraX * 0.2, GAME.width + 300) - 150;
    const glow = ctx.createRadialGradient(px, 150, 0, px, 150, 90);
    glow.addColorStop(0, "rgba(244, 201, 77, 0.24)");
    glow.addColorStop(1, "rgba(244, 201, 77, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(px - 90, 60, 180, 180);
  }
}

function drawStars(cameraX) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 231, 0.82)";
  for (let i = 0; i < 80; i += 1) {
    const x = positiveModulo(i * 137 - cameraX * 0.08, GAME.width);
    const y = 24 + positiveModulo(i * 73, 250);
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.restore();
}

function drawPlanets(cameraX) {
  ctx.save();
  const x = positiveModulo(760 - cameraX * 0.08, GAME.width + 260) - 130;
  ctx.fillStyle = "rgba(244, 201, 77, 0.8)";
  ctx.beginPath();
  ctx.arc(x, 118, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(126, 227, 255, 0.56)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, 118, 54, 14, -0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScenery(level) {
  for (const item of level.scenery) {
    if (item.type === "palm") drawPalm(item.x, item.y);
    if (item.type === "fern") drawFern(item.x, item.y);
    if (item.type === "crystal") drawCrystal(item.x, item.y);
    if (item.type === "waterfall") drawWaterfall(item.x, item.y);
    if (item.type === "lavafall") drawLavafall(item.x, item.y);
    if (item.type === "ruin") drawRuin(item.x, item.y);
    if (item.type === "star") drawStarMarker(item.x, item.y);
  }
}

function drawPalm(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#7b5739";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 82);
  ctx.quadraticCurveTo(18, 34, 4, 0);
  ctx.stroke();
  ctx.fillStyle = "#2e8a5f";
  for (let i = 0; i < 7; i += 1) {
    ctx.save();
    ctx.rotate((i - 3) * 0.52);
    ctx.beginPath();
    ctx.ellipse(0, -24, 13, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawFern(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#2e8a5f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.quadraticCurveTo(i * 16, 20, i * 34, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrystal(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(126, 227, 255, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(18, 0);
  ctx.lineTo(34, 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7ee3ff";
  ctx.fillRect(14, 14, 7, 28);
  ctx.restore();
}

function drawWaterfall(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const gradient = ctx.createLinearGradient(0, -150, 0, 80);
  gradient.addColorStop(0, "rgba(126, 227, 255, 0.12)");
  gradient.addColorStop(1, "rgba(126, 227, 255, 0.42)");
  ctx.fillStyle = gradient;
  roundRect(-18, -150, 44, 220, 8);
  ctx.fill();
  ctx.restore();
}

function drawLavafall(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const gradient = ctx.createLinearGradient(0, -150, 0, 80);
  gradient.addColorStop(0, "rgba(255, 228, 131, 0.18)");
  gradient.addColorStop(0.45, "rgba(232, 93, 91, 0.58)");
  gradient.addColorStop(1, "rgba(126, 42, 26, 0.36)");
  ctx.fillStyle = gradient;
  roundRect(-18, -150, 44, 220, 8);
  ctx.fill();
  ctx.restore();
}

function drawStarMarker(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(126, 227, 255, 0.5)";
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? 22 : 8;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRuin(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(210, 220, 218, 0.28)";
  ctx.fillRect(-18, -70, 36, 86);
  ctx.fillRect(-30, 8, 60, 12);
  ctx.fillStyle = "rgba(40, 48, 56, 0.25)";
  ctx.fillRect(-7, -42, 14, 24);
  ctx.restore();
}

function drawPlatforms(platforms) {
  for (const platform of platforms) {
    if (!platform.active) continue;
    const palette = platformPalette(platform.kind);
    ctx.globalAlpha = platform.falling && platform.triggered ? 0.76 + Math.sin(performance.now() / 60) * 0.16 : 1;
    ctx.fillStyle = palette.base;
    roundRect(platform.x, platform.y, platform.width, platform.height, 8);
    ctx.fill();
    ctx.fillStyle = platform.secret ? "#ba7cff" : palette.top;
    roundRect(platform.x, platform.y, platform.width, 13, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 248, 231, 0.12)";
    for (let x = platform.x + 18; x < platform.x + platform.width - 12; x += 42) ctx.fillRect(x, platform.y + 24, 18, 4);
    ctx.globalAlpha = 1;
  }
}

function drawWalls(walls) {
  for (const wall of walls) {
    ctx.fillStyle = "#64707a";
    roundRect(wall.x, wall.y, wall.width, wall.height, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 248, 231, 0.12)";
    ctx.fillRect(wall.x + 5, wall.y + 8, wall.width - 10, 4);
  }
}

function drawCheckpoints(checkpoints) {
  for (const checkpoint of checkpoints) {
    ctx.save();
    ctx.translate(checkpoint.x + checkpoint.width / 2, checkpoint.y + checkpoint.height / 2);
    const pulse = checkpoint.active ? 1 + Math.sin(performance.now() / 130) * 0.08 : 1;
    ctx.scale(pulse, pulse);
    if (checkpoint.active) {
      ctx.strokeStyle = "rgba(126, 227, 255, 0.36)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 31 + Math.sin(performance.now() / 170) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    const flagColor = game?.save?.shopOwned?.flag_blue ? "#7ee3ff" : "#f4c94d";
    ctx.strokeStyle = checkpoint.active ? "#7ee3ff" : "#fff8e7";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.fillStyle = checkpoint.active ? "#7ee3ff" : flagColor;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(26, -12);
    ctx.lineTo(0, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawSpikes(spikes) {
  for (const spike of spikes) {
    if (spike.active === false) continue;
    const count = Math.max(2, Math.floor(spike.width / 20));
    const step = spike.width / count;
    for (let i = 0; i < count; i += 1) {
      const x = spike.x + i * step;
      ctx.fillStyle = "#d9e6e8";
      ctx.beginPath();
      ctx.moveTo(x, spike.y);
      ctx.lineTo(x + step / 2, spike.y - spike.height);
      ctx.lineTo(x + step, spike.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8fa2a7";
      ctx.stroke();
    }
  }
}

function drawTraps(traps) {
  for (const trap of traps) {
    if (trap.type === "swing") {
      const bob = swingBob(trap);
      ctx.strokeStyle = "rgba(255, 248, 231, 0.52)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trap.x, trap.y);
      ctx.lineTo(bob.x, bob.y);
      ctx.stroke();
      ctx.fillStyle = "#e85d5b";
      ctx.beginPath();
      ctx.arc(bob.x, bob.y, trap.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (trap.type === "fire") {
      ctx.fillStyle = "#4b3b31";
      ctx.fillRect(trap.x, trap.y + trap.height - 12, trap.width, 12);
      if (trap.active) {
        const flame = ctx.createLinearGradient(0, trap.y, 0, trap.y + trap.height);
        flame.addColorStop(0, "#ffe483");
        flame.addColorStop(0.5, "#e85d5b");
        flame.addColorStop(1, "rgba(232, 93, 91, 0.15)");
        ctx.fillStyle = flame;
        roundRect(trap.x, trap.y, trap.width, trap.height, 14);
        ctx.fill();
      }
    }
    if (trap.type === "rock") {
      ctx.fillStyle = "#64707a";
      ctx.beginPath();
      ctx.arc(trap.x + trap.width / 2, trap.y + trap.height / 2, trap.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer(player) {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 14) % 2 === 0) ctx.globalAlpha = 0.48;
  const runBob = player.grounded && Math.abs(player.vx) > 1 ? Math.sin(player.animTime * 18) * 3 : 0;
  const squash = player.landingSquash * 0.08;
  const stretch = player.jumpStretch * 0.06;
  const skid = player.grounded && Math.abs(player.vx) > 160 && Math.sign(player.vx) !== player.facing;
  const ledgeBalance = player.grounded && Math.abs(player.vx) < 8 && player.groundEdgeDistance < 12;
  const fallLoop = !player.grounded && player.vy > 300;
  const fallStretch = fallLoop ? clamp((player.vy - 300) / 900, 0, 1) * 0.06 : 0;
  ctx.rotate((skid ? -player.facing * 0.13 : 0) + (ledgeBalance ? Math.sin(player.animTime * 10) * 0.05 : 0));
  ctx.scale(1 + squash - stretch * 0.35 - fallStretch * 0.25, 1 - squash + stretch + fallStretch);

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(2, 27, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, runBob);

  ctx.fillStyle = player.cosmetic?.body || "#3655b8";
  roundRect(-13, -3, 26, 26, 7);
  ctx.fill();
  ctx.strokeStyle = "#263b86";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 21);
  ctx.lineTo(-12, 31);
  ctx.moveTo(8, 21);
  ctx.lineTo(12, 31);
  ctx.stroke();
  ctx.fillStyle = "#f2b66d";
  ctx.beginPath();
  ctx.arc(0, -17, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2338";
  ctx.fillRect(player.facing > 0 ? 4 : -8, -20, 4, 4);
  ctx.fillStyle = player.cosmetic?.hat || "#f4c94d";
  ctx.beginPath();
  ctx.moveTo(-15, -26);
  ctx.lineTo(0, -43);
  ctx.lineTo(15, -26);
  ctx.closePath();
  ctx.fill();
  if (player.cosmetic?.crown) {
    ctx.fillStyle = "#ffe483";
    ctx.fillRect(-12, -47, 24, 7);
    ctx.beginPath();
    ctx.moveTo(-12, -47);
    ctx.lineTo(-6, -58);
    ctx.lineTo(0, -47);
    ctx.lineTo(7, -58);
    ctx.lineTo(12, -47);
    ctx.fill();
  }
  if (skid) {
    ctx.strokeStyle = "rgba(255, 248, 231, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-player.facing * 16, 27);
    ctx.lineTo(-player.facing * 29, 29);
    ctx.moveTo(-player.facing * 9, 31);
    ctx.lineTo(-player.facing * 22, 34);
    ctx.stroke();
  }
  if (ledgeBalance) {
    ctx.strokeStyle = "rgba(255, 248, 231, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.facing * 12, -2);
    ctx.lineTo(player.facing * 21, 6);
    ctx.stroke();
  }
  if (!player.grounded && player.doubleJump === 0) {
    ctx.strokeStyle = "rgba(255, 248, 231, 0.65)";
    ctx.beginPath();
    ctx.arc(0, 1, 24, 0.2, Math.PI * 1.55);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldTransition(level, timer) {
  if (timer <= 0) return;
  const alpha = clamp(timer / 1.15, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha * 0.78;
  ctx.fillStyle = "rgba(10, 16, 24, 0.5)";
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fff8e7";
  ctx.font = "900 42px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${level.world} World`, GAME.width / 2, 234);
  ctx.fillStyle = "#ffe483";
  ctx.font = "800 18px Segoe UI, sans-serif";
  ctx.fillText(level.subtitle, GAME.width / 2, 268);
  ctx.fillStyle = "#c4d4d8";
  ctx.font = "700 15px Segoe UI, sans-serif";
  ctx.fillText(level.hint || WORLD_HINTS[level.world] || "", GAME.width / 2, 300);
  ctx.restore();
}

function drawTutorialPrompts(prompts) {
  for (const prompt of prompts || []) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = "rgba(20, 31, 40, 0.88)";
    roundRect(prompt.x - 10, prompt.y - 28, Math.max(120, prompt.text.length * 8), 32, 8);
    ctx.fill();
    ctx.fillStyle = "#ffe483";
    ctx.font = "800 14px Segoe UI, sans-serif";
    ctx.fillText(prompt.text, prompt.x, prompt.y - 8);
    ctx.restore();
  }
}

function drawEnemy(enemy) {
  drawEnemyTelegraph(enemy);
  if (enemy.type === "boss") return drawBoss(enemy);
  if (enemy.type === "bat") return drawBat(enemy);
  if (enemy.type === "boar") return drawBoar(enemy);
  return drawGroundEnemy(enemy);
}

function drawEnemyTelegraph(enemy) {
  const pulse = 0.45 + Math.sin(enemy.time * 6) * 0.18;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#ffe483";
  ctx.beginPath();
  ctx.moveTo(enemy.x + enemy.width / 2, enemy.y - 16);
  ctx.lineTo(enemy.x + enemy.width / 2 - 7, enemy.y - 4);
  ctx.lineTo(enemy.x + enemy.width / 2 + 7, enemy.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBoss(enemy) {
  ctx.save();
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 39, 46, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7b3346";
  roundRect(-39, -22, 78, 58, 12);
  ctx.fill();
  ctx.fillStyle = "#ffe483";
  ctx.beginPath();
  ctx.moveTo(-28, -22);
  ctx.lineTo(-16, -42);
  ctx.lineTo(-4, -22);
  ctx.lineTo(12, -42);
  ctx.lineTo(28, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.beginPath();
  ctx.arc(-14, -4, 6, 0, Math.PI * 2);
  ctx.arc(14, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGroundEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 25, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.type === "slime" ? "#7fbf5d" : "#e85d5b";
  ctx.beginPath();
  ctx.ellipse(0, 2, 23, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.beginPath();
  ctx.arc(-7, -7, 4, 0, Math.PI * 2);
  ctx.arc(7, -7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBat(enemy) {
  ctx.save();
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
  ctx.fillStyle = "#3f315f";
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-28, -20 + Math.sin(enemy.time * 12) * 8, -38, 8);
  ctx.lineTo(-8, 8);
  ctx.moveTo(8, 0);
  ctx.quadraticCurveTo(28, -20 + Math.sin(enemy.time * 12) * 8, 38, 8);
  ctx.lineTo(8, 8);
  ctx.fill();
  ctx.restore();
}

function drawBoar(enemy) {
  ctx.save();
  ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 25, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8c6251";
  ctx.beginPath();
  ctx.ellipse(0, 4, 28, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(enemy.direction > 0 ? 15 : -20, 2, 8, 4);
  ctx.restore();
}

function drawKey(key) {
  ctx.save();
  ctx.translate(key.x + key.width / 2, key.y + key.height / 2 + Math.sin(performance.now() / 230) * 4);
  ctx.rotate(Math.sin(performance.now() / 330) * 0.18);
  ctx.strokeStyle = "#ffe483";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-9, 0, 8, 0, Math.PI * 2);
  ctx.moveTo(-1, 0);
  ctx.lineTo(17, 0);
  ctx.moveTo(9, 0);
  ctx.lineTo(9, 8);
  ctx.moveTo(15, 0);
  ctx.lineTo(15, 6);
  ctx.stroke();
  ctx.restore();
}

function drawGems(gems) {
  for (const gem of gems) {
    if (gem.collected) continue;
    ctx.save();
    ctx.translate(gem.x + 11, gem.y + 11 + Math.sin(performance.now() / 220 + gem.x) * 3);
    ctx.fillStyle = gem.secret ? "#ba7cff" : "#7ee3ff";
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawRelic(relic) {
  ctx.save();
  ctx.translate(relic.x + 12, relic.y + 14 + Math.sin(performance.now() / 250) * 3);
  ctx.fillStyle = "#ba7cff";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(-3, -9, 6, 18);
  ctx.restore();
}

function drawChest(chest, unlocked, opened) {
  ctx.save();
  ctx.translate(chest.x + chest.width / 2, chest.y + chest.height / 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(1, 31, 36, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = unlocked ? "#c98532" : "#8f5b35";
  roundRect(-29, -3, 58, 34, 7);
  ctx.fill();
  ctx.fillStyle = unlocked ? "#ffd95d" : "#b47a3c";
  roundRect(-29, opened ? -31 : -18, 58, 22, 8);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(-4, 5, 8, 13);
  if (!unlocked) {
    ctx.fillStyle = "#4b3b31";
    ctx.fillRect(-2, 10, 4, 5);
  }
  ctx.restore();
}

function drawParticles(particles) {
  for (const particle of particles) {
    ctx.globalAlpha = clamp(particle.life / (particle.maxLife || 1), 0, 1);
    ctx.fillStyle = particle.color;
    const size = particle.size || 4;
    ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawForeground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME.height);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME.width, GAME.height);
}

function trapHitsPlayer(trap, rect) {
  if (trap.type === "fire") return trap.active && rectsOverlap(rect, trap);
  if (trap.type === "rock") return rectsOverlap(rect, { x: trap.x, y: trap.y, width: trap.width, height: trap.height });
  if (trap.type === "swing") {
    const bob = swingBob(trap);
    return circleRectOverlap(bob.x, bob.y, trap.radius, rect);
  }
  return false;
}

function swingBob(trap) {
  const angle = Math.sin(trap.time * trap.speed) * 0.85;
  return {
    x: trap.x + Math.sin(angle) * trap.length,
    y: trap.y + Math.cos(angle) * trap.length,
  };
}

function platformPalette(kind) {
  const palettes = {
    grass: { base: "#78533d", top: "#51a366" },
    ice: { base: "#7faec5", top: "#d8f4ff" },
    stone: { base: "#5e6971", top: "#8d9aa2" },
    moss: { base: "#4b5d52", top: "#64ad75" },
    ruin: { base: "#5c5d68", top: "#a2a4ad" },
    storm: { base: "#4a5773", top: "#7ee3ff" },
    basalt: { base: "#3d3035", top: "#e85d5b" },
    cosmic: { base: "#28335f", top: "#ba7cff" },
  };
  return palettes[kind] || palettes.grass;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function circleRectOverlap(cx, cy, radius, rect) {
  const x = clamp(cx, rect.x, rect.x + rect.width);
  const y = clamp(cy, rect.y, rect.y + rect.height);
  return Math.hypot(cx - x, cy - y) < radius;
}

function distanceBetweenRects(a, b) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}

function insetRect(rect, amount) {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: rect.width - amount * 2,
    height: rect.height - amount * 2,
  };
}

function attachSpikeToPlatform(spike, platforms) {
  const platformIndex = platforms.findIndex((platform) => {
    const fullyInside = spike.x >= platform.x - 0.5 && spike.x + spike.width <= platform.x + platform.width + 0.5;
    const onTop = Math.abs(spike.y - platform.y) <= 1;
    return fullyInside && onTop;
  });
  if (platformIndex === -1) return { ...spike, active: true };
  const platform = platforms[platformIndex];
  return {
    ...spike,
    active: platform.active !== false,
    platformIndex,
    platformOffsetX: spike.x - platform.x,
    platformOffsetY: spike.y - platform.y,
  };
}

function edgeDistanceForGround(player, solids) {
  const footY = player.y + player.height + 2;
  const centerX = player.x + player.width / 2;
  const ground = solids.find((solid) => {
    if (solid.active === false) return false;
    const horizontallyInside = centerX >= solid.x && centerX <= solid.x + solid.width;
    const verticallyClose = Math.abs(footY - solid.y) <= 5;
    return horizontallyInside && verticallyClose;
  });
  if (!ground) return 999;
  return Math.min(centerX - ground.x, ground.x + ground.width - centerX);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function hide(element) {
  element.classList.add("hidden");
}

function show(element) {
  element.classList.remove("hidden");
}

function formatTime(seconds) {
  return seconds.toFixed(1);
}

function previewTags(level) {
  const tags = [];
  tags.push(`${level.gems.length} gems`);
  if (level.spikes.length) tags.push(`${level.spikes.length} spikes`);
  if (level.enemies.length) tags.push(`${level.enemies.length} enemies`);
  if (level.platforms.some((platform) => platform.move)) tags.push("moving platforms");
  if (level.platforms.some((platform) => platform.falling)) tags.push("falling platforms");
  if (level.traps.some((trap) => trap.type === "fire")) tags.push("fire traps");
  if (level.traps.some((trap) => trap.type === "rock")) tags.push("falling rocks");
  if (level.traps.some((trap) => trap.type === "swing")) tags.push("swing traps");
  if (level.isBoss) tags.push("boss");
  if (level.isBonus) tags.push("bonus route");
  tags.push(`par ${formatTime(level.parTime || 60)}`);
  return tags;
}

function bestMedal(current, next) {
  const rank = { Bronze: 1, Silver: 2, Gold: 3 };
  return (rank[next] || 0) > (rank[current] || 0) ? next : current || next;
}

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GAME.storageKey) || "{}");
    return {
      unlockedLevel: parsed.unlockedLevel || 0,
      bestTimes: parsed.bestTimes || {},
      stars: parsed.stars || {},
      medals: parsed.medals || {},
      walletGems: parsed.walletGems || 0,
      shopOwned: parsed.shopOwned || {},
      inventory: {
        shields: parsed.inventory?.shields || 0,
        extraLives: parsed.inventory?.extraLives || 0,
      },
      activeSkin: parsed.activeSkin || "",
      activeSound: parsed.activeSound || "",
      activeFlag: parsed.activeFlag || "",
      relics: parsed.relics || {},
      secretExits: parsed.secretExits || {},
      bonusLevels: parsed.bonusLevels || {},
      cosmeticIndex: parsed.cosmeticIndex || 0,
      reducedMotion: Boolean(parsed.reducedMotion),
      largeTouch: Boolean(parsed.largeTouch),
    };
  } catch {
    return { unlockedLevel: 0, bestTimes: {}, stars: {}, medals: {}, walletGems: 0, shopOwned: {}, inventory: { shields: 0, extraLives: 0 }, activeSkin: "", activeSound: "", activeFlag: "", relics: {}, secretExits: {}, bonusLevels: {}, cosmeticIndex: 0, reducedMotion: false, largeTouch: false };
  }
}

function saveGame(save) {
  localStorage.setItem(GAME.storageKey, JSON.stringify(save));
}

const game = new TreasureTrail(LEVELS);
window.treasureTrailGame = game;

startButton.addEventListener("click", () => game.start());
resumeButton.addEventListener("click", () => game.togglePause());
pauseButton.addEventListener("click", () => game.togglePause());
muteButton.addEventListener("click", () => game.audio.toggle());
nextLevelButton.addEventListener("click", () => game.nextLevel());
shopButton.addEventListener("click", () => game.showShop());
closeShopButton.addEventListener("click", () => hide(shopScreen));
vaultButton.addEventListener("click", () => game.showVault());
closeVaultButton.addEventListener("click", () => hide(vaultScreen));
practiceButton.addEventListener("click", () => {
  game.mode = game.mode === "practice" ? "campaign" : "practice";
  game.renderMetaPanels();
});
speedrunButton.addEventListener("click", () => {
  game.speedrun = !game.speedrun;
  game.speedrunTime = 0;
  game.renderMetaPanels();
});
cosmeticButton.addEventListener("click", () => {
  game.cosmeticIndex = (game.cosmeticIndex + 1) % Math.min(COSMETICS.length, Math.max(1, Math.floor(game.save.unlockedLevel / 5) + 2));
  game.save.cosmeticIndex = game.cosmeticIndex;
  game.save.activeSkin = "";
  if (game.player) game.player.cosmetic = game.getActiveCosmetic();
  saveGame(game.save);
  game.renderMetaPanels();
});
reducedMotionButton.addEventListener("click", () => {
  game.save.reducedMotion = !game.save.reducedMotion;
  saveGame(game.save);
  game.renderMetaPanels();
});
touchSizeButton.addEventListener("click", () => {
  game.save.largeTouch = !game.save.largeTouch;
  saveGame(game.save);
  game.renderMetaPanels();
});
resetSaveButton.addEventListener("click", () => {
  localStorage.removeItem(GAME.storageKey);
  game.save = loadSave();
  game.selectedLevel = 0;
  game.cosmeticIndex = 0;
  game.mode = "campaign";
  game.speedrun = false;
  game.loadLevel(0);
  game.renderLevelSelect();
  game.renderMetaPanels();
});
restartButtons.forEach((button) => button.addEventListener("click", () => game.restart()));
