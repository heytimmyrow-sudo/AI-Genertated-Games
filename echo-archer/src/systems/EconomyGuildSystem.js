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

const PERSONALITY_PROFILES = {
  guildMaster: {
    style: "measured and respected",
    lines: ["Discipline is kindness to your future self.", "The guild grows around steady hands, not loud ones.", "A clear shot begins long before the bow is raised."],
    respected: ["You carry yourself like someone who has survived the hard lessons.", "People look to you now. That is a heavier quiver than arrows."],
  },
  bowyer: {
    style: "proud, precise, and obsessed with bowcraft",
    lines: ["A bow has a mood. Treat it poorly and it sulks in your hands.", "Good string sings once. Bad string complains forever.", "If you listen, wood tells you where it wants to bend."],
    respected: ["I would trust you with my finest stave. That is not a compliment I spend cheaply.", "Your release has become cleaner. Even the bows seem less nervous."],
  },
  blacksmith: {
    style: "practical, direct, and hardworking",
    lines: ["If it rattles, tighten it. If it lies, replace it.", "Steel forgives less than wood, but at least it is honest.", "Pretty gear breaks the same as ugly gear if it is made wrong."],
    respected: ["You bring back gear with honest scars. I respect that.", "Master Archer or not, keep oiling your kit. Legends rust too."],
  },
  innkeeper: {
    style: "warm, social, and well informed",
    lines: ["People speak softer near soup. That is when you learn things.", "Every room has a story. I only repeat the useful ones.", "The road sounds different when guests are afraid of it."],
    respected: ["Your table stays ready. Heroes eat better when nobody fusses.", "The room quiets when you enter now, but in a good way."],
  },
  scout: {
    style: "curious, observant, and adventurous",
    lines: ["A bent reed says more than a loud witness.", "If a trail looks too easy, count your exits.", "The best route is usually the one that feels slightly rude."],
    respected: ["I mark your routes in darker ink now. They tend to be real.", "You notice the small signs. That is why you keep coming back."],
  },
  merchant: {
    style: "talkative, opportunistic, and funny",
    lines: ["I buy low, sell fair, and embellish only when bored.", "A safe road is worth more than a fat purse. Usually.", "If you find ancient treasure, remember your charming local merchant."],
    respected: ["For you, I only exaggerate by half.", "Your name moves prices before your coin does."],
  },
  guard: {
    style: "watchful, protective, and dry",
    lines: ["Quiet roads make me suspicious. Loud roads make me tired.", "A watchpost is just patience with a roof.", "If trouble comes, I prefer seeing it before it sees me."],
    respected: ["If you say a road is safe, people sleep easier.", "I still keep watch. Your reputation is not a wall."],
  },
  traveler: {
    style: "wandering, reflective, and rumor-rich",
    lines: ["Road dust is just memory that sticks to boots.", "I trust three things: old bridges, kind cooks, and second guesses.", "Every settlement thinks it is the center. Every road disagrees."],
    respected: ["Your story travels faster than I do, and I walk plenty.", "I have heard three songs about you. Two were nearly accurate."],
  },
  villager: {
    style: "grounded, local, and practical",
    lines: ["A place feels real once someone complains about the fence.", "Small work keeps big dreams from falling over.", "I like seeing smoke from chimneys. It means people stayed."],
    respected: ["You gave people room to believe the roads could be safe.", "The children play archer now. Try not to look too proud."],
  },
};

const SETTLEMENT_TOPICS = {
  guild: [
    "The Guild Village feels warmer since the roads became busier.",
    "At the guild, everyone notices your stance before your title.",
    "The training yard has become the village clock. Thunk, thunk, dinner.",
  ],
  frontier: [
    "Frontier Town is still mostly mud, hope, and stubborn carpentry.",
    "Out here, a new fence feels like a declaration of war against the wilderness.",
    "The plains are wide enough to make every rumor sound possible.",
  ],
  harbor: [
    "Coastal Harbor measures time by tides, gulls, and market bells.",
    "The harbor is busiest when fog rolls in. Everyone wants news before night.",
    "Salt gets into rope, timber, and conversations.",
  ],
  camp: [
    "Expedition camps collect people who prefer questions to comfort.",
    "The campfire burns low, but nobody here stops listening to the dark.",
    "Maps at camp are less certain than the people drawing them pretend.",
  ],
  road: [
    "Road travelers trade three things: warnings, jokes, and directions that almost work.",
    "A moving merchant hears more truth than a seated lord.",
    "The roads feel alive now. Not safe, exactly. Alive.",
  ],
};

const RUMOR_LINES = [
  "Rumor says a hidden trail near the Wilds opens only after someone watches it from above.",
  "I heard the old coastal records were destroyed in different towns on the same night.",
  "Some hunters claim the frontier tracks sometimes point against the wind.",
  "People whisper that the ancient mechanisms remember every arrow that wakes them.",
  "A pilgrim swore one temple bell rang before anyone found the temple.",
  "They say rare creatures avoid lantern light, but not moonlight.",
  "A trader from the marsh claims Witchlight Grove hums after boss storms pass.",
  "Someone found sea glass fletching near a place no wave should reach.",
  "The old kingdom carved warnings where only archers would look.",
  "At inns, sailors say the beacon shadows point toward ruins not on any map.",
];

const BOSS_MEMORY_LINES = {
  "Barkhide Stalker": "I heard you brought down Barkhide Stalker. The watchtower road feels less haunted now.",
  Icefang: "Word of Icefang reached even the warm valleys. People still mimic the howl badly.",
  Stormtalon: "Stormtalon falling made every coastal guard stand a little taller.",
  "The Root Guardian": "The Wilds feel quieter after the Root Guardian. Not empty. Listening.",
  Mirejaw: "Mirejaw is gone, and the marsh folk finally speak above a whisper.",
  Stonehorn: "Stonehorn's defeat turned into three tavern stories before sunset.",
  "Inferno Behemoth": "Ashen traders say the Inferno Behemoth's fall changed the smoke.",
  "The Ironhorn": "The Ironhorn is down? Frontier children will pretend to be you for weeks.",
  "The First Sentinel": "The First Sentinel was no campfire beast. That victory means history noticed you.",
  "The Skybound Warden": "People are still trying to understand what the Skybound Warden guarded.",
  "The Tidebound Warden": "The Tidebound Warden's fall made the harbor bells sound braver.",
};

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
    this.npcTalkCounts = {};
    this.bossVictories = new Set();
    this.regionDiscoveries = new Set();
    this.challengeMemories = new Set();
    this.npcScheduleTimer = 0;
    this.load();
    this.npcs = this.createGuildNpcs();
    this.bindShopUi();
    this.bindMasterArcherEvents();
    this.bindWorldMemoryEvents();
    this.updateUi();
  }

  createGuildNpcs() {
    const origin = this.world.archersGuild ?? { x: -56, z: 28 };
    const services = this.world.guildVillageServices ?? {};
    const point = (name, fallback) => services[name] ?? new THREE.Vector3(origin.x + fallback[0], 0, origin.z + fallback[1]);
    const home = (index, fallback) => services.homes?.[index] ?? new THREE.Vector3(origin.x + fallback[0], 0, origin.z + fallback[1]);
    const guildNpcs = [
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

    const frontier = this.world.frontierTownServices ?? {};
    const frontierOrigin = this.world.frontierOutpost ?? { x: 126, z: -132 };
    const frontierPoint = (name, fallback) => frontier[name] ?? new THREE.Vector3(frontierOrigin.x + fallback[0], 0, frontierOrigin.z + fallback[1]);
    const frontierHome = (index, fallback) => frontier.homes?.[index] ?? new THREE.Vector3(frontierOrigin.x + fallback[0], 0, frontierOrigin.z + fallback[1]);
    const frontierSquare = frontierPoint("square", [0, 0]);
    const frontierNpcs = [
      this.makeVillageNpc("frontier-mayor", "dialogue", "Alden", "Frontier Warden", frontierSquare, frontierHome(0, [-9, 2]), { cloak: 0x6f5130, hood: 0x31483c, staff: 0x8f6035, trim: 0xffd166, badge: true }, () => this.getCivLine("We keep the frontier small enough to defend and large enough to dream.", "Master Archer. Your name steadies folk faster than a town bell."), null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-innkeeper", "inn", "Mara", "Frontier Innkeeper", frontierPoint("inn", [-6, 4]), frontierHome(1, [-9, 7]), { cloak: 0x8b6844, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffc579 }, () => "Beds are narrow, stew is honest, and rumors are free if you listen.", null, { eveningPoint: frontierPoint("inn", [-6, 4]) }),
      this.makeVillageNpc("frontier-blacksmith", "blacksmith", "Hobb", "Frontier Smith", frontierPoint("blacksmith", [-7, -3]), frontierHome(0, [-9, 2]), { cloak: 0x5c3b2b, hood: 0x2f2d29, staff: 0x6f4a2a, trim: 0xff8a3d }, () => "The plains chew through buckles. I keep travelers moving.", "blacksmithShop", { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-bowyer", "shop", "Keela", "Frontier Bowyer", frontierPoint("bowyer", [6, -2]), frontierHome(2, [9, 1]), { cloak: 0x5d6b3f, hood: 0x2e4535, staff: 0xb47c42, trim: 0xe8b85b, feather: 0xf4dd90 }, () => "Wind on the plains teaches arrows humility.", "bowShop", { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-stablehand", "dialogue", "Noll", "Stable Hand", frontierPoint("stable", [7, 4]), frontierHome(3, [10, 6]), { cloak: 0x5f5134, hood: 0x31483c, staff: 0x8f6035, trim: 0xbfd27a }, () => "The elk smell storms before the rest of us see clouds.", null, { eveningPoint: frontierPoint("stable", [7, 4]) }),
      this.makeVillageNpc("frontier-merchant", "shop", "Sable", "Road Merchant", frontierPoint("market", [1, 4]), frontierHome(1, [-9, 7]), { cloak: 0x6b4a74, hood: 0x2f3c3f, staff: 0xa87543, trim: 0xe6b75d }, () => "If a road looks empty, it is only hiding the next buyer.", "equipmentShop", { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-guard", "dialogue", "Torren", "Watch Guard", frontierPoint("watchtower", [1, -6]), frontierHome(2, [9, 1]), { cloak: 0x3f4f42, hood: 0x252f2a, trim: 0xbfd27a, badge: true }, () => "From the tower, the old road looks like a scar that never healed.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-scout", "dialogue", "Pella", "Trail Scout", frontierPoint("mapStation", [0, -2]), frontierHome(3, [10, 6]), { cloak: 0x52613d, hood: 0x475f52, staff: 0x94704d, trim: 0xbfd27a, feather: 0xdde38a }, () => "Tracks near the river split twice. One path is animal. One is not.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-farmer", "dialogue", "Bryn", "Frontier Farmer", frontierPoint("market", [1, 4]), frontierHome(0, [-9, 2]), { cloak: 0x7a6b3f, hood: 0x4d5f35, staff: 0x94704d, trim: 0xe8bc66 }, () => "Wildflowers grow first. Fences come later.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-recruit", "dialogue", "Jory", "Young Recruit", frontierPoint("watchtower", [1, -6]), frontierHome(2, [9, 1]), { cloak: 0x355f42, hood: 0x223f33, staff: 0x9b6838, trim: 0xf0c66a }, () => "I can hit close targets now. Far ones still laugh at me.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-cook", "dialogue", "Melli", "Camp Cook", frontierPoint("inn", [-6, 4]), frontierHome(1, [-9, 7]), { cloak: 0x8b6844, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffc579 }, () => "A tired scout tells the truth after two bowls.", null, { eveningPoint: frontierPoint("inn", [-6, 4]) }),
      this.makeVillageNpc("frontier-carpenter", "dialogue", "Rusk", "Carpenter", frontierPoint("storage", [-2, -4]), frontierHome(3, [10, 6]), { cloak: 0x775536, hood: 0x3d5542, staff: 0xb47c42, trim: 0xd0a15d }, () => "Every new beam says we intend to stay.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-herbalist", "dialogue", "Elow", "Herbalist", frontierPoint("market", [1, 4]), frontierHome(0, [-9, 2]), { cloak: 0x466b55, hood: 0x263f35, staff: 0x94704d, trim: 0x8ff0b1 }, () => "The frontier plants are gentle until they are not.", null, { eveningPoint: frontierSquare }),
      this.makeVillageNpc("frontier-mapkeeper", "dialogue", "Venn", "Mapkeeper", frontierPoint("mapStation", [0, -2]), frontierHome(1, [-9, 7]), { cloak: 0x4d5966, hood: 0x2d3644, staff: 0x9a6d3d, trim: 0x82c8ff }, () => "Maps are promises. The frontier enjoys breaking them.", null, { eveningPoint: frontierSquare }),
    ];

    const harbor = this.world.coastalHarborServices ?? {};
    const harborOrigin = this.world.coastalHarbor ?? { x: -128, z: -134 };
    const harborPoint = (name, fallback) => harbor[name] ?? new THREE.Vector3(harborOrigin.x + fallback[0], 0, harborOrigin.z + fallback[1]);
    const harborHome = (index, fallback) => harbor.homes?.[index] ?? new THREE.Vector3(harborOrigin.x + fallback[0], 0, harborOrigin.z + fallback[1]);
    const harborSquare = harborPoint("square", [1, 0]);
    const harborNpcs = [
      this.makeVillageNpc("harbor-master", "dialogue", "Selka", "Harbor Master", harborPoint("docks", [-6, -1]), harborHome(0, [7, 7]), { cloak: 0x315d69, hood: 0x2d3644, staff: 0x9a6d3d, trim: 0x82c8ff, badge: true }, () => "Storms break docks. Secrets break families.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-innkeeper", "inn", "Caddo", "Tavern Keeper", harborPoint("tavern", [2, 4]), harborHome(0, [7, 7]), { cloak: 0x8b6844, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffc579 }, () => "The gulls steal bread. The sailors steal the better stories.", null, { eveningPoint: harborPoint("tavern", [2, 4]) }),
      this.makeVillageNpc("harbor-fisher", "dialogue", "Neris", "Fisher", harborPoint("docks", [-6, -1]), harborHome(1, [-6, 6]), { cloak: 0x3f8fb4, hood: 0x315d69, staff: 0x8a633d, trim: 0xdaf0e6 }, () => "The tide has been wrong since the old beacon woke.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-bowyer", "shop", "Orris", "Coastal Bowyer", harborPoint("bowyer", [5, -1]), harborHome(2, [8, 1]), { cloak: 0x52613d, hood: 0x2f3c3f, staff: 0xb47c42, trim: 0x82c8ff, feather: 0xdaf0e6 }, () => "Salt warps poor wood. Good bows learn the sea breeze.", "bowShop", { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-merchant", "shop", "Mira", "Harbor Trader", harborPoint("market", [0, 2]), harborHome(1, [-6, 6]), { cloak: 0x6b4a74, hood: 0x2f3c3f, staff: 0xa87543, trim: 0xe6b75d }, () => "I sell rope, oil, and advice. Only the rope is guaranteed.", "equipmentShop", { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-keeper", "dialogue", "Iven", "Lighthouse Keeper", harborPoint("lighthouseKeeper", [7, 4]), harborHome(2, [8, 1]), { cloak: 0xe9dfc3, hood: 0xa94e3f, staff: 0xd9b978, trim: 0xffd166 }, () => this.getCivLine("At night, the beacon throws shadows that do not match the rocks.", "Master Archer, if you see a light blink twice at sea, tell me first."), null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-netmaker", "dialogue", "Talla", "Netmaker", harborPoint("warehouse", [-3, 3]), harborHome(1, [-6, 6]), { cloak: 0x5f7a41, hood: 0x31483c, staff: 0x8f6035, trim: 0xd7bd83 }, () => "Knots remember tension. People do too.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-sailor", "dialogue", "Brant", "Sailor", harborPoint("docks", [-6, -1]), harborHome(0, [7, 7]), { cloak: 0x4d5966, hood: 0x2d3644, staff: 0x9a6d3d, trim: 0x82c8ff }, () => "Records at King's Sea Gate were burned, not lost. I know ash when I smell it.", null, { eveningPoint: harborPoint("tavern", [2, 4]) }),
      this.makeVillageNpc("harbor-child", "dialogue", "Pip", "Dock Runner", harborPoint("market", [0, 2]), harborHome(2, [8, 1]), { cloak: 0xf0c6a0, hood: 0x315d69, trim: 0xffd166 }, () => "I can beat gulls in a footrace. Mostly.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-guard", "dialogue", "Kest", "Harbor Guard", harborPoint("warehouse", [-3, 3]), harborHome(0, [7, 7]), { cloak: 0x3f4f42, hood: 0x252f2a, trim: 0xbfd27a, badge: true }, () => "Wrecker's Point looks empty until the fog folds wrong.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-healer", "dialogue", "Anwen", "Tide Healer", harborPoint("tavern", [2, 4]), harborHome(1, [-6, 6]), { cloak: 0x466b55, hood: 0x263f35, staff: 0x94704d, trim: 0x8ff0b1 }, () => "Sea mist is medicine if you breathe it slowly.", null, { eveningPoint: harborSquare }),
      this.makeVillageNpc("harbor-warehouse", "dialogue", "Garrick", "Warehouse Clerk", harborPoint("warehouse", [-3, 3]), harborHome(2, [8, 1]), { cloak: 0x775536, hood: 0x3d5542, staff: 0xb47c42, trim: 0xd0a15d }, () => "Every missing crate has a story. Most are embarrassing.", null, { eveningPoint: harborSquare }),
    ];

    const camp = this.world.expeditionCampServices ?? {};
    const campOrigin = this.world.forgottenCamp ?? { x: 112, z: -166 };
    const campPoint = (name, fallback) => camp[name] ?? new THREE.Vector3(campOrigin.x + fallback[0], 0, campOrigin.z + fallback[1]);
    const campNpcs = [
      this.makeVillageNpc("camp-cartographer", "dialogue", "Rhel", "Expedition Cartographer", campPoint("mapTent", [-3, -2]), campPoint("travelerRest", [-3, 3]), { cloak: 0x4d5966, hood: 0x2d3644, staff: 0x9a6d3d, trim: 0x82c8ff }, () => "I mark what we know in ink and what we fear in pencil.", null, { eveningPoint: campPoint("fire", [0, 0]) }),
      this.makeVillageNpc("camp-supplier", "shop", "Dessa", "Supply Scout", campPoint("supply", [2, 1]), campPoint("travelerRest", [-3, 3]), { cloak: 0x6b4a74, hood: 0x2f3c3f, staff: 0xa87543, trim: 0xe6b75d }, () => "Light packs save lives. Heavy packs save pride.", "equipmentShop", { eveningPoint: campPoint("fire", [0, 0]) }),
      this.makeVillageNpc("camp-scout", "dialogue", "Wyl", "Road Scout", campPoint("scoutPost", [4, -2]), campPoint("travelerRest", [-3, 3]), { cloak: 0x52613d, hood: 0x475f52, staff: 0x94704d, trim: 0xbfd27a }, () => "Something big crossed the grasslands and did not care who saw.", null, { eveningPoint: campPoint("fire", [0, 0]) }),
      this.makeVillageNpc("camp-traveler", "dialogue", "Lio", "Pilgrim", campPoint("fire", [0, 0]), campPoint("travelerRest", [-3, 3]), { cloak: 0x8b6844, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffc579 }, () => "I walk because old roads remember footsteps.", null, { eveningPoint: campPoint("fire", [0, 0]) }),
    ];

    const travelers = [
      this.makeTravelerNpc("road-trader-essa", "Essa", "Traveling Merchant", [point("market", [5, 6]), frontierPoint("market", [1, 4]), campPoint("fire", [0, 0]), frontierHome(1, [-9, 7])], { cloak: 0x6b4a74, hood: 0x2f3c3f, staff: 0xa87543, trim: 0xe6b75d }, () => "My pack has more mud than profit today."),
      this.makeTravelerNpc("road-hunter-varek", "Varek", "Road Hunter", [frontierPoint("watchtower", [1, -6]), campPoint("scoutPost", [4, -2]), point("questBoard", [-1, 6]), frontierHome(2, [9, 1])], { cloak: 0x475f32, hood: 0x293d2d, staff: 0x6f4a2a, trim: 0xd0a15d }, () => "Creatures avoid busy roads until they do not."),
      this.makeTravelerNpc("road-explorer-nyx", "Nyx", "Wandering Explorer", [harborPoint("docks", [-6, -1]), point("inn", [-8, 6]), frontierPoint("mapStation", [0, -2]), harborHome(1, [-6, 6])], { cloak: 0x52613d, hood: 0x475f52, staff: 0x94704d, trim: 0x82c8ff }, () => "The best clues are the ones locals stopped noticing."),
      this.makeTravelerNpc("road-pilgrim-sorin", "Sorin", "Pilgrim Archer", [campPoint("fire", [0, 0]), frontierPoint("square", [0, 0]), harborPoint("tavern", [2, 4]), point("inn", [-8, 6])], { cloak: 0xe8d3a0, hood: 0x5a3f2d, staff: 0xa87543, trim: 0xffd166 }, () => this.getCivLine("Every shrine changes the silence around it.", "Master Archer, your trial songs already reached the road.")),
      this.makeTravelerNpc("road-courier-til", "Til", "Guild Courier", [point("guildHall", [0, -2]), frontierPoint("mapStation", [0, -2]), harborPoint("warehouse", [-3, 3]), point("guildHall", [0, -2])], { cloak: 0x355f42, hood: 0x223f33, staff: 0x9b6838, trim: 0xf0c66a, badge: true }, () => "Guild seals open doors. Good manners keep them open."),
      this.makeTravelerNpc("road-minstrel-ava", "Ava", "Traveling Minstrel", [harborPoint("tavern", [2, 4]), frontierPoint("inn", [-6, 4]), point("inn", [-8, 6]), harborPoint("tavern", [2, 4])], { cloak: 0xb8553f, hood: 0x6b4a74, staff: 0xa87543, trim: 0xffc579 }, () => "Every town wants a song where it survives the storm."),
    ];

    return [...guildNpcs, ...frontierNpcs, ...harborNpcs, ...campNpcs, ...travelers];
  }

  makeVillageNpc(id, kind, name, role, workPoint, homePoint, appearance, line, shopId = null, options = {}) {
    const schedule = {
      morning: this.offsetPoint(workPoint, -0.8, 0.7),
      day: workPoint,
      evening: options.eveningPoint ?? this.world.guildVillageServices?.square ?? workPoint,
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
        idleStyle: options.idleStyle ?? this.getIdleStyleForRole(role),
      }),
      line,
      personality: options.personality ?? this.inferPersonality(id, role),
      settlement: options.settlement ?? this.inferSettlement(id),
    };
  }

  makeTravelerNpc(id, name, role, route, appearance, line) {
    const [morning, day, evening, night] = route;
    return {
      id,
      kind: "dialogue",
      shopId: null,
      schedule: {
        morning,
        day,
        evening,
        night,
      },
      npc: new NPC(this.scene, this.world, {
        name,
        role,
        position: [day.x, day.z],
        interactRadius: 4,
        appearance,
        idleStyle: "restless",
      }),
      line,
      personality: "traveler",
      settlement: "road",
    };
  }

  getCivLine(defaultLine, masterLine) {
    return this.masterArcherUnlocked ? masterLine : defaultLine;
  }

  inferPersonality(id, role = "") {
    const value = `${id} ${role}`.toLowerCase();
    if (value.includes("guild-master") || value.includes("warden")) return "guildMaster";
    if (value.includes("bowyer") || value.includes("archer")) return "bowyer";
    if (value.includes("blacksmith") || value.includes("smith")) return "blacksmith";
    if (value.includes("inn") || value.includes("tavern") || value.includes("cook")) return "innkeeper";
    if (value.includes("scout") || value.includes("map") || value.includes("explorer") || value.includes("cartographer")) return "scout";
    if (value.includes("merchant") || value.includes("trader") || value.includes("supplier")) return "merchant";
    if (value.includes("guard") || value.includes("watch")) return "guard";
    if (value.includes("traveler") || value.includes("pilgrim") || value.includes("courier") || value.includes("minstrel")) return "traveler";
    return "villager";
  }

  inferSettlement(id) {
    if (id.startsWith("frontier-")) return "frontier";
    if (id.startsWith("harbor-")) return "harbor";
    if (id.startsWith("camp-")) return "camp";
    if (id.startsWith("road-")) return "road";
    return "guild";
  }

  getIdleStyleForRole(role = "") {
    const value = role.toLowerCase();
    if (value.includes("scout") || value.includes("traveler") || value.includes("courier")) return "restless";
    if (value.includes("guard") || value.includes("watch") || value.includes("warden")) return "watchful";
    return "calm";
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

  bindWorldMemoryEvents() {
    window.addEventListener("echo-archer:boss-defeated", (event) => {
      const name = event.detail?.name ?? event.detail?.type;
      if (!name) {
        return;
      }
      this.bossVictories.add(name);
      this.save();
    });
    window.addEventListener("echo-archer:region-discovered", (event) => {
      const name = event.detail?.name ?? event.detail?.id;
      if (!name) {
        return;
      }
      this.regionDiscoveries.add(name);
      this.save();
    });
    window.addEventListener("echo-archer:challenge-complete", (event) => {
      const label = event.detail?.label ?? event.detail?.id;
      if (!label) {
        return;
      }
      this.challengeMemories.add(label);
      this.save();
    });
  }

  update(deltaSeconds, input) {
    this.updateNpcSchedules(deltaSeconds);
    this.npcs.forEach(({ npc }) => {
      if (!this.world.performanceMode || npc.group.position.distanceTo(this.player.group.position) <= 38) {
        npc.update(this.player);
      }
    });
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
      this.rememberNpcTalk(nearby);
      this.showDialogue(nearby.npc.name, this.getNpcDialogue(nearby));
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
        personality: "villager",
        settlement: "guild",
      };
    }
    return null;
  }

  rememberNpcTalk(entry) {
    if (!entry?.id || entry.kind === "questBoard") {
      return;
    }
    this.npcTalkCounts[entry.id] = (this.npcTalkCounts[entry.id] ?? 0) + 1;
    this.save();
  }

  getNpcDialogue(entry) {
    if (!entry || entry.kind === "questBoard") {
      return entry?.line?.() ?? "";
    }
    const talkCount = this.npcTalkCounts[entry.id] ?? 0;
    const relationship = this.getRelationshipTier(entry);
    const memoryLine = this.getMemoryLine(entry, talkCount);
    if (memoryLine) {
      return this.decorateDialogue(entry, memoryLine, relationship);
    }
    if (talkCount % 5 === 0) {
      return this.decorateDialogue(entry, this.getRumorLine(entry), relationship);
    }
    if (talkCount % 3 === 0) {
      return this.decorateDialogue(entry, this.getSettlementLine(entry), relationship);
    }
    const profile = PERSONALITY_PROFILES[entry.personality] ?? PERSONALITY_PROFILES.villager;
    const pool = relationship === "respected" && profile.respected?.length ? profile.respected : profile.lines;
    const line = pool[this.stableIndex(entry.id, talkCount, pool.length)];
    return this.decorateDialogue(entry, line ?? entry.line?.() ?? "", relationship);
  }

  decorateDialogue(entry, line, relationship) {
    const profile = PERSONALITY_PROFILES[entry.personality] ?? PERSONALITY_PROFILES.villager;
    if (relationship === "neutral") {
      return line;
    }
    if (relationship === "friendly") {
      return `${line} ${this.getFriendlyAside(entry)}`;
    }
    return `${line} ${profile.style ? `(${profile.style})` : ""}`.trim();
  }

  getFriendlyAside(entry) {
    const settlement = entry.settlement ?? "guild";
    if (settlement === "frontier") return "Stay for stew if the wind turns mean.";
    if (settlement === "harbor") return "If gulls start screaming, check the sky.";
    if (settlement === "camp") return "The fire is yours if you need it.";
    if (settlement === "road") return "May your boots find the better path.";
    return "The village is glad to see you.";
  }

  getRelationshipTier(entry) {
    const talks = this.npcTalkCounts[entry.id] ?? 0;
    if (this.masterArcherUnlocked || this.reputation >= 680 || this.villageReputation >= 900) {
      return "respected";
    }
    if (talks >= 2 || this.reputation >= 220 || this.villageReputation >= 260) {
      return "friendly";
    }
    return "neutral";
  }

  getMemoryLine(entry, talkCount) {
    if (this.masterArcherUnlocked && talkCount % 7 === 1) {
      return this.getMasterRecognitionLine(entry);
    }
    const bossName = Array.from(this.bossVictories).find((name) => BOSS_MEMORY_LINES[name]);
    if (bossName && talkCount % 6 === 2) {
      return BOSS_MEMORY_LINES[bossName];
    }
    const regionName = Array.from(this.regionDiscoveries).at(-1);
    if (regionName && talkCount % 6 === 3) {
      return `I heard you reached ${regionName}. New places change old conversations.`;
    }
    const challenge = Array.from(this.challengeMemories).at(-1);
    if (challenge && talkCount % 6 === 4) {
      return `${challenge} is making the rounds. Archers argue about your best shot already.`;
    }
    return "";
  }

  getMasterRecognitionLine(entry) {
    const personality = entry.personality ?? "villager";
    if (personality === "blacksmith") return "Master Archer, hm. Good. Now your gear has to survive better stories.";
    if (personality === "bowyer") return "A Master Archer makes a bow look calm. That is harder than power.";
    if (personality === "innkeeper") return "People ask which chair you used. Fame is very silly, but good for business.";
    if (personality === "scout") return "Master Archer or not, I bet you still check tracks twice. That is why it suits you.";
    if (personality === "merchant") return "Master Archer! I knew you before your name became expensive.";
    if (personality === "guard") return "Respectfully, I still watch the gate. Titles do not stop wolves.";
    if (personality === "traveler") return "I heard your title two roads ago. It arrived before breakfast.";
    return "Master Archer. That sounds grand, but you still feel like one of ours.";
  }

  getRumorLine(entry) {
    const settlementBias = {
      guild: 0,
      frontier: 2,
      harbor: 7,
      camp: 4,
      road: 6,
    };
    const base = settlementBias[entry.settlement] ?? 0;
    return RUMOR_LINES[this.stableIndex(entry.id, (this.npcTalkCounts[entry.id] ?? 0) + base, RUMOR_LINES.length)];
  }

  getSettlementLine(entry) {
    const pool = SETTLEMENT_TOPICS[entry.settlement] ?? SETTLEMENT_TOPICS.guild;
    return pool[this.stableIndex(entry.id, this.npcTalkCounts[entry.id] ?? 0, pool.length)];
  }

  stableIndex(id, salt, length) {
    if (!length) {
      return 0;
    }
    let value = salt * 17;
    for (let index = 0; index < id.length; index += 1) {
      value += id.charCodeAt(index) * (index + 3);
    }
    return Math.abs(value) % length;
  }

  getPromptForInteraction(interaction) {
    if (interaction.kind === "shop") return "E Shop";
    if (interaction.kind === "blacksmith") return "E Repair / Smith";
    if (interaction.kind === "inn") return "E Rent Room";
    if (interaction.kind === "questBoard") return "E Jobs";
    return "E Talk";
  }

  updateNpcSchedules(deltaSeconds) {
    if (this.world.performanceMode) {
      this.npcScheduleTimer -= deltaSeconds;
      if (this.npcScheduleTimer > 0) {
        return;
      }
      this.npcScheduleTimer = 0.35;
    }
    const phase = this.getVillageDayPhase();
    const blend = Math.min(1, (this.world.performanceMode ? 0.35 : deltaSeconds) * 1.8);
    this.npcs.forEach((entry) => {
      const target = entry.schedule?.[phase];
      if (!target) {
        return;
      }
      if (this.world.performanceMode && entry.npc.group.position.distanceTo(this.player.group.position) > 90) {
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
      this.npcTalkCounts = saved.npcTalkCounts && typeof saved.npcTalkCounts === "object" ? saved.npcTalkCounts : this.npcTalkCounts;
      this.bossVictories = new Set(Array.isArray(saved.bossVictories) ? saved.bossVictories : []);
      this.regionDiscoveries = new Set(Array.isArray(saved.regionDiscoveries) ? saved.regionDiscoveries : []);
      this.challengeMemories = new Set(Array.isArray(saved.challengeMemories) ? saved.challengeMemories : []);
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
      npcTalkCounts: this.npcTalkCounts,
      bossVictories: Array.from(this.bossVictories),
      regionDiscoveries: Array.from(this.regionDiscoveries),
      challengeMemories: Array.from(this.challengeMemories),
      guildQuests: this.guildQuests.map(({ id, progress, complete }) => ({ id, progress, complete })),
      villageJobs: this.villageJobs.map(({ id, progress, completions }) => ({ id, progress, completions })),
    }));
  }
}
