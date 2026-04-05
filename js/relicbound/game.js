(function () {
window.Relicbound = window.Relicbound || {};

const {
  Camera,
  GAME_CONFIG,
  EffectsSystem,
  InputManager,
  Player,
  drawUI,
  WorldController,
  distance
} = window.Relicbound;

class RelicboundGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new InputManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.world = new WorldController();
    this.effects = new EffectsSystem();
    this.lastTime = 0;
    this.ambient = Array.from({ length: GAME_CONFIG.world.ambientPetals }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 4,
      speed: 10 + Math.random() * 20,
      sway: Math.random() * Math.PI * 2
    }));
    this.reset();
  }

  reset() {
    this.state = {
      screen: "title",
      score: 0,
      coins: 0,
      relics: 0,
      upgradePoints: 0,
      materials: {
        wood: 0,
        stone: 0
      },
      shrineHint: "",
      interactHint: "",
      navigationHint: "",
      shopHint: "",
      activeBiome: "",
      mapOpen: false,
      message: "Press Enter to start your journey.",
      upgrades: GAME_CONFIG.upgrades.reduce((accumulator, upgrade) => {
        accumulator[upgrade.id] = 0;
        return accumulator;
      }, {}),
      flags: {
        wildsCleared: false,
        bossDefeated: false,
        talkedToMira: false,
        talkedToLyra: false,
        miraRewardClaimed: false,
        lyraRewardClaimed: false
      },
      campsCleared: {},
      checkpoints: {},
      checkpoint: null,
      shop: {
        open: false,
        merchantId: null
      },
      fastTravel: {
        open: false,
        sanctuaryId: null
      },
      crafting: {
        open: false,
        stationId: null
      },
      bonuses: {
        merchantDamage: 0,
        craftedDamage: 0,
        craftedHealth: 0
      },
      craftedRecipes: {},
      placeholders: {
        quests: [],
        inventory: [],
        shops: [],
        saveSlots: []
      }
    };

    this.loadArea("sunkenWilds", "entry");
    this.state.checkpoint = { x: this.player.x, y: this.player.y };
  }

  startNewRun() {
    this.player = null;
    this.reset();
    this.state.screen = "playing";
    this.message("Explore the Sunken Wilds, recover relic shards, and clear the roaming packs.");
  }

  restartRun() {
    if (this.state.screen === "gameover" && this.state.checkpoint) {
      this.state.screen = "playing";
      this.state.shop.open = false;
      this.state.fastTravel.open = false;
      this.state.crafting.open = false;
      this.player.health = this.player.maxHealth;
      this.player.x = this.state.checkpoint.x;
      this.player.y = this.state.checkpoint.y;
      this.player.attackTimer = 0;
      this.player.invulnerableTimer = 0;
      this.effects.addPickupBurst(this.player.x, this.player.y, "#92fbff");
      this.message("You return to your last sanctuary.");
      return;
    }
    this.startNewRun();
  }

  loadArea(areaId, spawnKey) {
    this.world.loadArea(areaId);
    const rawSpawn = this.world.getSpawnPoint(areaId, spawnKey);
    const spawn = this.world.findNearestOpenPoint(rawSpawn.x, rawSpawn.y, GAME_CONFIG.player.radius);
    if (!this.player) {
      this.player = new Player(spawn.x, spawn.y);
    } else {
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.player.attackTimer = 0;
    }
    this.player.syncStats();
    this.player.runBonuses.merchantDamage = this.state.bonuses.merchantDamage;
    this.player.runBonuses.craftedDamage = this.state.bonuses.craftedDamage;
    this.player.runBonuses.craftedHealth = this.state.bonuses.craftedHealth;
    this.player.syncStats();
    this.message("Entered " + this.world.area.name + ".");
  }

  start() {
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  loop(timestamp) {
    const dt = Math.min(0.033, ((timestamp - this.lastTime) / 1000) || 0);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((next) => this.loop(next));
  }

  message(text) {
    this.state.message = text;
  }

  returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  getQuestText() {
    if (!this.state.flags.talkedToMira) {
      return "Speak with Warden Mira in Lantern Rest to begin the regional quest line.";
    }
    if (!this.state.flags.wildsCleared) {
      const cleared = Object.values(this.state.campsCleared).filter(Boolean).length;
      const total = this.world.camps.length;
      if (!this.state.flags.talkedToLyra && cleared >= 1) {
        return "Report your first cleared camp to Lyra, then push deeper into the wilds.";
      }
      return "Clear camps " + cleared + "/" + total + ", recover relic shards, and bring down the Stone Warden.";
    }
    return "The Sunken Wilds are secure. This large-region framework is ready for bosses and quest chains.";
  }

  getQuestEntries() {
    const entries = [];
    entries.push({
      title: "Meet the Wardens",
      done: this.state.flags.talkedToMira,
      text: this.state.flags.talkedToMira ? "Mira briefed you at Lantern Rest." : "Speak with Warden Mira in Lantern Rest."
    });

    const cleared = Object.values(this.state.campsCleared).filter(Boolean).length;
    entries.push({
      title: "Break the Camps",
      done: cleared === this.world.camps.length && this.world.camps.length > 0,
      text: "Camps cleared: " + cleared + "/" + this.world.camps.length
    });

    entries.push({
      title: "Vault Dive",
      done: this.world.area.id === "glassVault" || this.state.relics >= 4,
      text: this.world.area.id === "glassVault" ? "Glass Vault entered." : "Find and enter the Glass Vault."
    });

    entries.push({
      title: "Stone Warden",
      done: this.state.flags.bossDefeated,
      text: this.state.flags.bossDefeated ? "Stone Warden defeated." : "Defeat the Stone Warden on the old road."
    });

    return entries;
  }

  getNavigationHint() {
    if (this.state.screen !== "playing") return "";
    const unclearedCamp = this.world.camps.find((camp) => !this.state.campsCleared[camp.id]);
    if (unclearedCamp) {
      return "Route: " + unclearedCamp.name;
    }
    if (!this.state.flags.bossDefeated) {
      return "Route: Stone Warden";
    }
    const remainingRelics = this.world.collectibles.filter((item) => item.type === "relic" && !item.taken).length;
    if (remainingRelics > 0) {
      return "Relics left: " + remainingRelics;
    }
    return "";
  }

  update(dt) {
    this.input.pollGamepad();
    this.state.shrineHint = "";
    this.state.interactHint = "";
    this.state.navigationHint = this.getNavigationHint();
    this.state.shopHint = "";
    this.state.activeBiome = this.world.getBiomeAt(this.player?.x || 0, this.player?.y || 0)?.name || "";

    if (this.input.wasPressed("escape")) {
      this.returnToMenu();
      return;
    }

    if (this.input.wasPressed("p", "pad_pause")) {
      if (this.state.screen === "playing") {
        this.state.screen = "paused";
      } else if (this.state.screen === "paused") {
        this.state.screen = "playing";
      }
    }

    if (this.input.wasPressed("m", "pad_map")) {
      this.state.mapOpen = !this.state.mapOpen;
    }

    if (this.state.screen === "title") {
      if (this.input.wasPressed("enter", "pad_attack", "pad_pause")) {
        this.startNewRun();
      }
      this.updateAmbient(dt);
      return;
    }

    if (this.state.screen === "paused") {
      this.updateAmbient(dt);
      return;
    }

    if (this.state.screen === "gameover" || this.state.screen === "victory") {
      if (this.input.wasPressed("r", "pad_restart")) {
        this.restartRun();
      }
      this.updateAmbient(dt);
      return;
    }

    if (this.input.wasPressed("r", "pad_restart")) {
      this.restartRun();
      return;
    }

    if (this.state.shop.open) {
      this.handleShopInput();
      this.updateAmbient(dt);
      this.effects.update(dt);
      return;
    }

    if (this.state.fastTravel.open) {
      this.handleFastTravelInput();
      this.updateAmbient(dt);
      this.effects.update(dt);
      return;
    }

    if (this.state.crafting.open) {
      this.handleCraftingInput();
      this.updateAmbient(dt);
      this.effects.update(dt);
      return;
    }

    if (this.state.mapOpen) {
      this.updateAmbient(dt);
      this.effects.update(dt);
      return;
    }

    this.updateAmbient(dt);
    this.player.update(this, dt);
    this.world.update(dt);
    this.updateEnemies(dt);
    this.updateCollectibles();
    this.handleShrineInput();
    this.handleWorldInteraction();
    this.checkAreaStatus();
    this.checkExits();
    this.effects.update(dt);
    this.camera.update(
      this.player.x,
      this.player.y,
      this.world.width,
      this.world.height,
      dt,
      GAME_CONFIG.camera.smoothness,
      GAME_CONFIG.camera.anchorX,
      GAME_CONFIG.camera.anchorY
    );

    if (this.player.health <= 0) {
      this.state.screen = "gameover";
      this.message(
        this.state.checkpoint
          ? "You fell in battle. Press R to restart from your last sanctuary."
          : "You fell in battle. Press R to begin again."
      );
    }
  }

  updateAmbient(dt) {
    for (const petal of this.ambient) {
      petal.y += petal.speed * dt;
      petal.x += Math.sin(petal.sway) * 12 * dt;
      petal.sway += dt * 1.4;
      if (petal.y > this.canvas.height + 10) {
        petal.y = -10;
        petal.x = Math.random() * this.canvas.width;
      }
    }
  }

  updateEnemies(dt) {
    for (let i = this.world.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.world.enemies[i];
      enemy.update(this, dt);
      if (enemy.dead) {
        this.handleEnemyDefeat(enemy);
        this.world.enemies.splice(i, 1);
      }
    }
  }

  updateCollectibles() {
    for (const collectible of this.world.collectibles) {
      if (collectible.taken) continue;
      if (distance(this.player.x, this.player.y, collectible.x, collectible.y) < this.player.radius + collectible.radius + 2) {
        collectible.taken = true;
        if (collectible.type === "coin") {
          this.state.coins += 1;
          this.state.score += GAME_CONFIG.progression.coinScoreValue;
          this.effects.addPickupBurst(collectible.x, collectible.y, "#ffe88d");
          this.effects.addText(collectible.x, collectible.y, "+1 coin", "#ffe88d");
        } else if (collectible.type === "relic") {
          this.state.relics += 1;
          this.state.upgradePoints += 1;
          this.state.score += GAME_CONFIG.progression.relicScoreValue;
          this.effects.addPickupBurst(collectible.x, collectible.y, "#92fbff");
          this.effects.addText(collectible.x, collectible.y, "Relic Shard", "#92fbff");
          this.message("Relic shard recovered. Find a shrine and spend your upgrade point.");
        }
      }
    }
  }

  handleShrineInput() {
    if (!this.world.shrines.length) return;
    const nearbyShrine = this.world.shrines.find((shrine) => (
      distance(this.player.x, this.player.y, shrine.x, shrine.y) < 72
    ));
    if (!nearbyShrine) return;

    this.state.shrineHint = "Shrine awakened. Press 1-4 to attune a sigil.";
    if (this.state.upgradePoints <= 0) {
      this.message("The shrine hums softly. Recover another relic shard to upgrade.");
      return;
    }

    this.message("Shrine awakened. Press 1-4 to attune a sigil.");
    for (const upgrade of GAME_CONFIG.upgrades) {
      if (this.input.wasPressed(upgrade.key)) {
        this.applyUpgrade(upgrade.id);
        break;
      }
    }
  }

  handleWorldInteraction() {
    const interactions = [];

    for (const npc of this.world.npcs) {
      if (distance(this.player.x, this.player.y, npc.x, npc.y) < 96) {
        interactions.push({ type: "npc", target: npc, label: npc.name });
      }
    }

    for (const merchant of this.world.merchants) {
      if (distance(this.player.x, this.player.y, merchant.x, merchant.y) < 96) {
        interactions.push({ type: "merchant", target: merchant, label: merchant.name });
      }
    }

    for (const sanctuary of this.world.sanctuaries) {
      if (distance(this.player.x, this.player.y, sanctuary.x, sanctuary.y) < sanctuary.radius) {
        interactions.push({ type: "sanctuary", target: sanctuary, label: sanctuary.name });
      }
    }

    for (const dungeon of this.world.dungeons) {
      if (distance(this.player.x, this.player.y, dungeon.x, dungeon.y) < 96) {
        interactions.push({ type: "dungeon", target: dungeon, label: dungeon.name });
      }
    }

    for (const station of this.world.craftingStations) {
      if (distance(this.player.x, this.player.y, station.x, station.y) < 96) {
        interactions.push({ type: "crafting", target: station, label: station.name });
      }
    }

    if (!interactions.length) return;

    const interaction = interactions[0];
    this.state.interactHint = interaction.label + " nearby";
    if (!this.input.wasPressed("e", "pad_interact")) {
      return;
    }

    if (interaction.type === "npc") {
      this.interactWithNpc(interaction.target);
    } else if (interaction.type === "merchant") {
      this.interactWithMerchant(interaction.target);
    } else if (interaction.type === "sanctuary") {
      this.interactWithSanctuary(interaction.target);
    } else if (interaction.type === "dungeon") {
      this.interactWithDungeon(interaction.target);
    } else if (interaction.type === "crafting") {
      this.interactWithCrafting(interaction.target);
    }
  }

  interactWithNpc(npc) {
    const lineIndex = npc.dialogueIndex || 0;
    this.message(npc.name + ": " + npc.lines[lineIndex]);
    npc.dialogueIndex = (lineIndex + 1) % npc.lines.length;

    if (npc.id === "warden-mira") {
      this.state.flags.talkedToMira = true;
      if (!this.state.flags.miraRewardClaimed) {
        this.state.flags.miraRewardClaimed = true;
        this.state.coins += 4;
        this.effects.addText(this.player.x, this.player.y - 24, "+4 coins", "#ffe88d");
        this.message(npc.name + ": Take these scout coins and start with the Thorn Camp.");
        return;
      }
    }
    if (npc.id === "sage-lyra" && Object.values(this.state.campsCleared).filter(Boolean).length >= 1) {
      this.state.flags.talkedToLyra = true;
      if (!this.state.flags.lyraRewardClaimed) {
        this.state.flags.lyraRewardClaimed = true;
        this.state.upgradePoints += 1;
        this.effects.addText(this.player.x, this.player.y - 24, "+1 relic shard", "#92fbff");
        this.message(npc.name + ": The lattice answers you. Take this shard and press on.");
        return;
      }
    }
  }

  interactWithMerchant(merchant) {
    this.state.shop.open = true;
    this.state.shop.merchantId = merchant.id;
    this.state.shopHint = merchant.name + " opened shop. Press 1-2 to buy or E/Esc to close.";
    this.message(merchant.name + ": Have a look. Press 1 or 2 to buy.");
  }

  interactWithSanctuary(sanctuary) {
    this.player.heal(this.player.maxHealth);
    this.state.checkpoints[sanctuary.id] = true;
    this.state.checkpoint = { x: sanctuary.x, y: sanctuary.y };
    this.effects.addPickupBurst(sanctuary.x, sanctuary.y, "#92fbff");
    const unlocked = this.world.sanctuaries.filter((entry) => this.state.checkpoints[entry.id]);
    if (unlocked.length > 1) {
      this.state.fastTravel.open = true;
      this.state.fastTravel.sanctuaryId = sanctuary.id;
      this.message(sanctuary.name + " restored you. Press 1-" + unlocked.length + " to fast travel or E to stay.");
      return;
    }
    this.message(sanctuary.name + " restored you and became your checkpoint.");
  }

  interactWithDungeon(dungeon) {
    if (dungeon.to) {
      this.state.shop.open = false;
      this.loadArea(dungeon.to, dungeon.spawnKey || "entry");
      return;
    }
    const lineIndex = dungeon.dialogueIndex || 0;
    this.message(dungeon.name + ": " + dungeon.lines[lineIndex]);
    dungeon.dialogueIndex = (lineIndex + 1) % dungeon.lines.length;
  }

  interactWithCrafting(station) {
    this.state.crafting.open = true;
    this.state.crafting.stationId = station.id;
    this.message(station.name + ": Press 1-3 to craft, E or Esc to close.");
  }

  handleShopInput() {
    const merchant = this.world.merchants.find((entry) => entry.id === this.state.shop.merchantId);
    if (!merchant) {
      this.state.shop.open = false;
      return;
    }

    this.state.shopHint = merchant.name + ": 1 buys " + merchant.items[0].name + ", 2 buys " + merchant.items[1].name + ".";
    if (this.input.wasPressed("e", "pad_interact")) {
      this.state.shop.open = false;
      this.message(merchant.name + ": Come back if you need supplies.");
      return;
    }

    for (const item of merchant.items) {
      if (this.input.wasPressed(item.key)) {
        this.purchaseMerchantItem(merchant, item);
        break;
      }
    }
  }

  purchaseMerchantItem(merchant, item) {
    if (this.state.coins < item.cost) {
      this.message(merchant.name + ": You need " + item.cost + " coins for " + item.name + ".");
      return;
    }

    this.state.coins -= item.cost;
    if (item.effect === "heal") {
      this.player.heal(3);
      this.effects.addText(this.player.x, this.player.y - 24, "+3 health", "#ffe88d");
    } else if (item.effect === "damage") {
      this.state.bonuses.merchantDamage += 1;
      this.player.runBonuses.merchantDamage = this.state.bonuses.merchantDamage;
      this.player.syncStats();
      this.effects.addText(this.player.x, this.player.y - 24, "+1 damage", "#fff0cf");
    }
    this.message(merchant.name + ": " + item.name + " is yours.");
  }

  handleFastTravelInput() {
    const available = this.world.sanctuaries.filter((entry) => this.state.checkpoints[entry.id]);
    if (this.input.wasPressed("e", "pad_interact")) {
      this.state.fastTravel.open = false;
      this.message("You remain at the current sanctuary.");
      return;
    }

    for (let index = 0; index < available.length && index < 4; index += 1) {
      if (this.input.wasPressed(String(index + 1))) {
        const sanctuary = available[index];
        this.state.fastTravel.open = false;
        this.state.checkpoint = { x: sanctuary.x, y: sanctuary.y };
        this.player.x = sanctuary.x;
        this.player.y = sanctuary.y;
        this.player.health = this.player.maxHealth;
        this.effects.addPickupBurst(sanctuary.x, sanctuary.y, "#92fbff");
        this.message("You travel to " + sanctuary.name + ".");
        return;
      }
    }
  }

  handleCraftingInput() {
    const station = this.world.craftingStations.find((entry) => entry.id === this.state.crafting.stationId);
    if (!station) {
      this.state.crafting.open = false;
      return;
    }

    if (this.input.wasPressed("e", "pad_interact")) {
      this.state.crafting.open = false;
      this.message(station.name + ": Come back with more timber and stone.");
      return;
    }

    for (const recipe of station.recipes) {
      if (this.input.wasPressed(recipe.key)) {
        this.craftRecipe(station, recipe);
        break;
      }
    }
  }

  craftRecipe(station, recipe) {
    if (this.state.craftedRecipes[recipe.id]) {
      this.message(station.name + ": " + recipe.name + " is already crafted this run.");
      return;
    }
    if (this.state.materials.wood < recipe.wood || this.state.materials.stone < recipe.stone) {
      this.message(station.name + ": You need " + recipe.wood + " wood and " + recipe.stone + " stone.");
      return;
    }

    this.state.materials.wood -= recipe.wood;
    this.state.materials.stone -= recipe.stone;
    this.state.craftedRecipes[recipe.id] = true;

    if (recipe.effect === "damage") {
      this.state.bonuses.craftedDamage += 1;
      this.player.runBonuses.craftedDamage = this.state.bonuses.craftedDamage;
      this.player.syncStats();
      this.effects.addText(this.player.x, this.player.y - 24, "+1 forged damage", "#fff0cf");
    } else if (recipe.effect === "health") {
      this.state.bonuses.craftedHealth += 1;
      this.player.runBonuses.craftedHealth = this.state.bonuses.craftedHealth;
      this.player.syncStats();
      this.player.heal(1);
      this.effects.addText(this.player.x, this.player.y - 24, "+1 forged health", "#8dffb4");
    } else if (recipe.effect === "heal") {
      this.player.heal(this.player.maxHealth);
      this.effects.addText(this.player.x, this.player.y - 24, "Camp supplies ready", "#ffe88d");
    }
    this.message(station.name + ": " + recipe.name + " crafted.");
  }

  applyUpgrade(id) {
    const upgrade = GAME_CONFIG.upgrades.find((entry) => entry.id === id);
    if (!upgrade || this.state.upgradePoints < upgrade.cost) return;

    const currentRank = this.state.upgrades[id] ?? 0;
    if (currentRank >= upgrade.maxRank) {
      this.message(upgrade.name + " is already at its final rank.");
      return;
    }

    this.state.upgradePoints -= upgrade.cost;
    this.state.upgrades[id] = currentRank + 1;
    this.player.applyUpgrade(id, this.state.upgrades[id]);

    this.effects.addText(
      this.player.x,
      this.player.y - 24,
      upgrade.name + " " + this.formatRank(this.state.upgrades[id]),
      "#92fbff"
    );
    this.effects.addPickupBurst(this.player.x, this.player.y - 12, "#92fbff");
    this.message(upgrade.name + " attuned to rank " + this.formatRank(this.state.upgrades[id]) + ".");
  }

  formatRank(rank) {
    return ["I", "II", "III", "IV", "V"][rank - 1] || String(rank);
  }

  checkAreaStatus() {
    for (const camp of this.world.camps) {
      if (this.state.campsCleared[camp.id]) continue;
      const enemiesInCamp = this.world.enemies.filter((enemy) => distance(enemy.x, enemy.y, camp.x, camp.y) <= camp.radius);
      if (enemiesInCamp.length === 0) {
        this.state.campsCleared[camp.id] = true;
        this.applyCampReward(camp);
      }
    }

    if (this.world.area.id === "sunkenWilds" && !this.state.flags.wildsCleared) {
      const relicTotal = this.world.area.collectibles.filter((item) => item.type === "relic").length;
      const allCampsCleared = this.world.camps.every((camp) => this.state.campsCleared[camp.id]);
      if (this.state.flags.bossDefeated && allCampsCleared && this.state.relics >= relicTotal) {
        this.state.flags.wildsCleared = true;
        this.state.screen = "victory";
        this.message("The Sunken Wilds are cleared. You conquered the full region.");
      }
    }
  }

  applyCampReward(camp) {
    const reward = camp.reward || null;
    if (!reward) {
      this.message(camp.name + " cleared.");
      return;
    }

    if (reward.type === "coins") {
      this.state.coins += reward.amount;
      this.effects.addText(this.player.x, this.player.y - 24, "+" + reward.amount + " coins", "#ffe88d");
      this.message(camp.name + " cleared. Scout cache recovered.");
    } else if (reward.type === "shard") {
      this.state.upgradePoints += reward.amount;
      this.effects.addText(this.player.x, this.player.y - 24, "+" + reward.amount + " shard", "#92fbff");
      this.message(camp.name + " cleared. A relic shard answers your call.");
    } else if (reward.type === "heal") {
      this.player.heal(reward.amount);
      this.effects.addText(this.player.x, this.player.y - 24, "+" + reward.amount + " health", "#8dffb4");
      this.message(camp.name + " cleared. The marsh calms and restores you.");
    } else {
      this.message(camp.name + " cleared.");
    }
  }

  checkExits() {
    const playerRect = {
      x: this.player.x - this.player.radius,
      y: this.player.y - this.player.radius,
      width: this.player.radius * 2,
      height: this.player.radius * 2
    };
    const exit = this.world.getAvailableExit(playerRect, this.state.flags);
    if (exit) {
      this.loadArea(exit.to, exit.spawnKey);
    }
  }

  resolvePlayerAttack(player) {
    // Combat is routed through one method so future weapons and abilities can plug in here.
    const attackX = player.x + Math.cos(player.facing) * GAME_CONFIG.player.attackRange;
    const attackY = player.y + Math.sin(player.facing) * GAME_CONFIG.player.attackRange;

    for (const enemy of this.world.enemies) {
      const dist = distance(attackX, attackY, enemy.x, enemy.y);
      if (dist <= GAME_CONFIG.player.attackRadius + enemy.radius) {
        enemy.takeDamage(player.attackDamage);
        this.effects.addHitBurst(enemy.x, enemy.y, "#fff0cf");
        this.effects.addText(enemy.x, enemy.y - 14, "-" + player.attackDamage, "#fff0cf");
      }
    }

    for (const node of this.world.resourceNodes) {
      if (node.remaining <= 0) continue;
      const dist = distance(attackX, attackY, node.x, node.y);
      if (dist <= GAME_CONFIG.player.attackRadius + 26) {
        this.harvestResourceNode(node);
      }
    }
  }

  harvestResourceNode(node) {
    if (node.remaining <= 0) return;
    node.remaining -= 1;
    const isTree = node.kind === "tree";
    const key = isTree ? "wood" : "stone";
    this.state.materials[key] += 1;
    this.effects.addPickupBurst(node.x, node.y, isTree ? "#8ac16e" : "#c9d1de");
    this.effects.addText(node.x, node.y - 18, "+" + key, isTree ? "#8ac16e" : "#c9d1de");
    this.message((isTree ? "Timber" : "Stone") + " gathered.");
  }

  handleEnemyDefeat(enemy) {
    this.state.score += enemy.isBoss ? 180 : 30;
    this.effects.addPickupBurst(enemy.x, enemy.y, enemy.color);
    this.effects.addText(enemy.x, enemy.y, enemy.label, enemy.color);
    if (enemy.isBoss) {
      this.state.flags.bossDefeated = true;
      this.state.upgradePoints += 2;
      this.effects.addText(enemy.x, enemy.y - 22, "+2 relic shards", "#92fbff");
      this.camera.shake(GAME_CONFIG.combat.screenShakeOnBossKill, 0.28);
      this.message("Stone Warden defeated. The old road is broken open.");
    } else {
      this.camera.shake(GAME_CONFIG.combat.screenShakeOnKill, 0.22);
    }
  }

  render() {
    const ctx = this.ctx;
    const cameraOffset = this.camera.getRenderOffset();

    this.drawBackdrop(ctx);
    this.drawWorld(ctx, cameraOffset);
    this.drawEffects(ctx, cameraOffset);
    drawUI(ctx, this);
  }

  drawBackdrop(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    sky.addColorStop(0, "#10263d");
    sky.addColorStop(1, "#08111d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const petal of this.ambient) {
      ctx.fillStyle = "rgba(255, 228, 179, 0.22)";
      ctx.beginPath();
      ctx.arc(petal.x, petal.y, petal.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWorld(ctx, cameraOffset) {
    // Rendering is layered: tiles, decorations, interactables, enemies, then player.
    const tileSize = GAME_CONFIG.tileSize;
    const camX = cameraOffset.x;
    const camY = cameraOffset.y;
    const worldTileSize = this.world.tileSize;
    const actors = [];

    for (let row = 0; row < this.world.area.tiles.length; row += 1) {
      for (let col = 0; col < this.world.area.tiles[row].length; col += 1) {
        const tile = this.world.area.tiles[row][col];
        const x = col * worldTileSize;
        const y = row * worldTileSize;
        this.drawTile(ctx, tile, x, y, worldTileSize, camX, camY);
      }
    }

    for (const camp of this.world.camps) {
      this.drawCampRing(ctx, camp, camX, camY);
    }

    for (const village of this.world.villages) {
      this.drawVillageOutline(ctx, village, camX, camY);
    }

    for (const decoration of this.world.decorations) {
      actors.push({ depth: decoration.y + worldTileSize * 0.7, draw: () => this.drawDecoration(ctx, decoration, camX, camY) });
    }

    for (const house of this.world.houses) {
      actors.push({ depth: house.y + house.height, draw: () => this.drawHouse(ctx, house, camX, camY) });
    }

    for (const shrine of this.world.shrines) {
      actors.push({ depth: shrine.y + 16, draw: () => this.drawShrine(ctx, shrine, camX, camY) });
    }

    for (const npc of this.world.npcs) {
      actors.push({ depth: npc.y, draw: () => this.drawNpc(ctx, npc, camX, camY) });
    }

    for (const merchant of this.world.merchants) {
      actors.push({ depth: merchant.y, draw: () => this.drawMerchant(ctx, merchant, camX, camY) });
    }

    for (const sanctuary of this.world.sanctuaries) {
      actors.push({ depth: sanctuary.y, draw: () => this.drawSanctuary(ctx, sanctuary, camX, camY) });
    }

    for (const dungeon of this.world.dungeons) {
      actors.push({ depth: dungeon.y, draw: () => this.drawDungeon(ctx, dungeon, camX, camY) });
    }

    for (const node of this.world.resourceNodes) {
      if (node.remaining > 0) {
        actors.push({ depth: node.y, draw: () => this.drawResourceNode(ctx, node, camX, camY) });
      }
    }

    for (const station of this.world.craftingStations) {
      actors.push({ depth: station.y, draw: () => this.drawCraftingStation(ctx, station, camX, camY) });
    }

    for (const collectible of this.world.collectibles) {
      if (collectible.taken) continue;
      actors.push({ depth: collectible.y, draw: () => this.drawCollectible(ctx, collectible, camX, camY) });
    }

    for (const enemy of this.world.enemies) {
      actors.push({ depth: enemy.y, draw: () => this.drawEnemy(ctx, enemy, camX, camY) });
    }

    actors.push({ depth: this.player.y, draw: () => this.drawPlayer(ctx, camX, camY) });
    actors.sort((a, b) => a.depth - b.depth);
    for (const actor of actors) {
      actor.draw();
    }
  }

  drawPlayer(ctx, camX, camY) {
    const shadow = this.projectPoint(this.player.x, this.player.y, 0, camX, camY);
    const body = this.projectPoint(this.player.x, this.player.y, GAME_CONFIG.render.actorHeight, camX, camY);
    const bob = Math.sin(this.player.stepBob) * 2;

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 12, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(body.x, body.y + bob);
    ctx.rotate(this.player.facing);
    ctx.fillStyle = this.player.hitFlash > 0 ? "#fff0cf" : "#ffdf9a";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5c3b2e";
    ctx.fillRect(-6, -8, 12, 16);
    ctx.fillStyle = "#7d4f2a";
    ctx.fillRect(6, -3, 20, 6);
    ctx.restore();

    if (this.player.attackTimer > 0) {
      ctx.save();
      ctx.translate(body.x, body.y);
      ctx.rotate(this.player.facing);
      ctx.fillStyle = "rgba(255, 227, 157, 0.28)";
      ctx.beginPath();
      ctx.arc(16, 0, 54, -0.5, 0.5);
      ctx.lineTo(16, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  drawEnemy(ctx, enemy, camX, camY) {
    const shadow = this.projectPoint(enemy.x, enemy.y, 0, camX, camY);
    const body = this.projectPoint(enemy.x, enemy.y, GAME_CONFIG.render.actorHeight - 6, camX, camY);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 10, enemy.radius + 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enemy.hitTimer > 0 ? "#fff0cf" : enemy.color;
    ctx.beginPath();
    ctx.arc(body.x, body.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(6,10,16,0.4)";
    ctx.fillRect(body.x - 6, body.y - 4, 12, 8);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(body.x - 18, body.y - enemy.radius - 14, 36, 6);
    ctx.fillStyle = "#ff8fa2";
    ctx.fillRect(body.x - 18, body.y - enemy.radius - 14, 36 * (enemy.health / enemy.maxHealth), 6);
  }

  drawEffects(ctx, cameraOffset) {
    const camX = cameraOffset.x;
    const camY = cameraOffset.y;
    for (const particle of this.effects.particles) {
      const point = this.projectPoint(particle.x, particle.y, 8, camX, camY);
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.fillRect(point.x, point.y, particle.size, particle.size);
    }

    for (const text of this.effects.text) {
      const point = this.projectPoint(text.x, text.y, 38, camX, camY);
      ctx.globalAlpha = text.life / text.maxLife;
      ctx.fillStyle = text.color;
      ctx.font = "bold 13px Segoe UI";
      ctx.fillText(text.value, point.x, point.y);
    }
    ctx.globalAlpha = 1;
  }

  projectPoint(worldX, worldY, height, camX, camY) {
    const floorSquash = GAME_CONFIG.render.floorSquash;
    return {
      x: worldX - camX,
      y: (worldY - camY) * floorSquash + 120 - height
    };
  }

  drawTile(ctx, tile, worldX, worldY, size, camX, camY) {
    const topLeft = this.projectPoint(worldX, worldY, 0, camX, camY);
    const topRight = this.projectPoint(worldX + size, worldY, 0, camX, camY);
    const bottomLeft = this.projectPoint(worldX, worldY + size, 0, camX, camY);
    const bottomRight = this.projectPoint(worldX + size, worldY + size, 0, camX, camY);
    const wallHeight = GAME_CONFIG.render.wallHeight;
    const isWall = tile === "#" || tile === "R";
    const biome = this.world.getBiomeAt(worldX + size * 0.5, worldY + size * 0.5);
    const topColor = tile === "R" ? "#5f6873" : isWall ? (biome?.wall || "#465642") : (biome?.floor || "#274632");
    const frontColor = tile === "R" ? "#41464f" : isWall ? shadeColor(biome?.wall || "#31402e", -16) : shadeColor(biome?.floor || "#1c2f23", -12);
    const sideColor = tile === "R" ? "#343942" : isWall ? shadeColor(biome?.wall || "#273323", -26) : shadeColor(biome?.floor || "#16261c", -20);

    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.fill();

    if (!isWall) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(topLeft.x + 4, topLeft.y + 4, Math.max(0, size - 8), Math.max(0, size * GAME_CONFIG.render.floorSquash - 8));
      return;
    }

    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y + wallHeight);
    ctx.lineTo(bottomLeft.x, bottomLeft.y + wallHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y + wallHeight);
    ctx.lineTo(topRight.x, topRight.y + wallHeight);
    ctx.closePath();
    ctx.fill();
  }

  drawDecoration(ctx, decoration, camX, camY) {
    if (decoration.tile === "t") {
      const trunk = this.projectPoint(decoration.x + this.world.tileSize * 0.5, decoration.y + this.world.tileSize * 0.52, 22, camX, camY);
      const canopy = this.projectPoint(decoration.x + this.world.tileSize * 0.5, decoration.y + this.world.tileSize * 0.5, 72, camX, camY);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(trunk.x, this.projectPoint(decoration.x + this.world.tileSize * 0.5, decoration.y + this.world.tileSize * 0.66, 0, camX, camY).y, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6d4b2d";
      ctx.fillRect(trunk.x - 7, trunk.y - 10, 14, 28);
      ctx.fillStyle = "#3d7d38";
      ctx.beginPath();
      ctx.arc(canopy.x, canopy.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6cab56";
      ctx.beginPath();
      ctx.arc(canopy.x - 16, canopy.y + 10, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const block = this.projectPoint(decoration.x + this.world.tileSize * 0.5, decoration.y + this.world.tileSize * 0.54, 54, camX, camY);
      ctx.fillStyle = "#798594";
      ctx.fillRect(block.x - 18, block.y - 10, 36, 28);
      ctx.fillStyle = "#535d67";
      ctx.fillRect(block.x - 18, block.y + 18, 36, 20);
    }
  }

  drawShrine(ctx, shrine, camX, camY) {
    const base = this.projectPoint(shrine.x, shrine.y, 0, camX, camY);
    const core = this.projectPoint(shrine.x, shrine.y, 80, camX, camY);
    ctx.fillStyle = "rgba(146, 251, 255, 0.16)";
    ctx.beginPath();
    ctx.ellipse(base.x, base.y + 4, 42, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6fd3dd";
    ctx.fillRect(base.x - 16, base.y - 10, 32, 24);
    ctx.fillStyle = "#92fbff";
    ctx.beginPath();
    ctx.moveTo(base.x, core.y);
    ctx.lineTo(base.x + 14, base.y - 10);
    ctx.lineTo(base.x, base.y - 30);
    ctx.lineTo(base.x - 14, base.y - 10);
    ctx.closePath();
    ctx.fill();
  }

  drawCollectible(ctx, collectible, camX, camY) {
    const pulse = 1 + Math.sin(collectible.pulse) * 0.12;
    const lift = GAME_CONFIG.render.collectableLift + Math.sin(collectible.pulse) * 4;
    const shadow = this.projectPoint(collectible.x, collectible.y, 0, camX, camY);
    const point = this.projectPoint(collectible.x, collectible.y, lift, camX, camY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 4, collectible.radius + 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = collectible.type === "relic" ? "#92fbff" : "#ffe88d";
    ctx.beginPath();
    ctx.arc(0, 0, collectible.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(-4, -collectible.radius, 8, collectible.radius * 0.8);
    ctx.restore();
  }

  drawNpc(ctx, npc, camX, camY) {
    const shadow = this.projectPoint(npc.x, npc.y, 0, camX, camY);
    const body = this.projectPoint(npc.x, npc.y, GAME_CONFIG.render.actorHeight, camX, camY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 10, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9d3b4";
    ctx.beginPath();
    ctx.arc(body.x, body.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#345d8c";
    ctx.fillRect(body.x - 8, body.y - 6, 16, 22);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 12px Segoe UI";
    ctx.fillText(npc.name, body.x - 22, body.y - 22);
  }

  drawMerchant(ctx, merchant, camX, camY) {
    const shadow = this.projectPoint(merchant.x, merchant.y, 0, camX, camY);
    const body = this.projectPoint(merchant.x, merchant.y, GAME_CONFIG.render.actorHeight, camX, camY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 10, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e5c07b";
    ctx.beginPath();
    ctx.arc(body.x, body.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7b4f2b";
    ctx.fillRect(body.x - 9, body.y - 6, 18, 22);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 12px Segoe UI";
    ctx.fillText(merchant.name, body.x - 16, body.y - 22);
  }

  drawSanctuary(ctx, sanctuary, camX, camY) {
    const base = this.projectPoint(sanctuary.x, sanctuary.y, 0, camX, camY);
    const lit = this.state.checkpoints[sanctuary.id];
    ctx.save();
    ctx.strokeStyle = lit ? "rgba(146, 251, 255, 0.6)" : "rgba(146, 251, 255, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(base.x, base.y + 4, 34, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = lit ? "#92fbff" : "#61b9c7";
    ctx.fillRect(base.x - 10, base.y - 28, 20, 34);
    ctx.restore();
  }

  drawDungeon(ctx, dungeon, camX, camY) {
    const point = this.projectPoint(dungeon.x, dungeon.y, 0, camX, camY);
    ctx.save();
    ctx.fillStyle = "rgba(110, 92, 160, 0.18)";
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + 6, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8f7cff";
    ctx.fillRect(point.x - 16, point.y - 24, 32, 28);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 12px Segoe UI";
    ctx.fillText(dungeon.name, point.x - 28, point.y - 30);
    ctx.restore();
  }

  drawCampRing(ctx, camp, camX, camY) {
    const point = this.projectPoint(camp.x, camp.y, 0, camX, camY);
    ctx.save();
    ctx.strokeStyle = this.state.campsCleared[camp.id] ? "rgba(146, 251, 255, 0.24)" : "rgba(255, 170, 110, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + 6, camp.radius, camp.radius * GAME_CONFIG.render.floorSquash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 12px Segoe UI";
    ctx.fillText(camp.name, point.x - 34, point.y - camp.radius * GAME_CONFIG.render.floorSquash - 8);
    ctx.restore();
  }

  drawVillageOutline(ctx, village, camX, camY) {
    const topLeft = this.projectPoint(village.x, village.y, 0, camX, camY);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 230, 160, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft.x, topLeft.y, village.width, village.height * GAME_CONFIG.render.floorSquash);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 13px Segoe UI";
    ctx.fillText(village.name, topLeft.x + 10, topLeft.y + 18);
    ctx.restore();
  }

  drawHouse(ctx, house, camX, camY) {
    const base = this.projectPoint(house.x + house.width * 0.5, house.y + house.height * 0.6, 0, camX, camY);
    const roof = this.projectPoint(house.x + house.width * 0.5, house.y + house.height * 0.55, 46, camX, camY);
    const width = house.width * 0.4;
    ctx.fillStyle = "#6c4d31";
    ctx.fillRect(base.x - width * 0.5, base.y - 18, width, 38);
    ctx.fillStyle = "#b96d4c";
    ctx.beginPath();
    ctx.moveTo(roof.x, roof.y - 10);
    ctx.lineTo(base.x + width * 0.65, base.y - 18);
    ctx.lineTo(base.x - width * 0.65, base.y - 18);
    ctx.closePath();
    ctx.fill();
  }

  drawResourceNode(ctx, node, camX, camY) {
    if (node.kind === "tree") {
      const trunk = this.projectPoint(node.x, node.y, 20, camX, camY);
      const canopy = this.projectPoint(node.x, node.y, 64, camX, camY);
      ctx.fillStyle = "#6d4b2d";
      ctx.fillRect(trunk.x - 6, trunk.y - 10, 12, 24);
      ctx.fillStyle = "#5ca24a";
      ctx.beginPath();
      ctx.arc(canopy.x, canopy.y, 24, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const stone = this.projectPoint(node.x, node.y, 24, camX, camY);
      ctx.fillStyle = "#8d96a4";
      ctx.beginPath();
      ctx.moveTo(stone.x, stone.y - 18);
      ctx.lineTo(stone.x + 18, stone.y - 2);
      ctx.lineTo(stone.x + 10, stone.y + 14);
      ctx.lineTo(stone.x - 14, stone.y + 10);
      ctx.lineTo(stone.x - 18, stone.y - 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawCraftingStation(ctx, station, camX, camY) {
    const point = this.projectPoint(station.x, station.y, 18, camX, camY);
    ctx.fillStyle = "#d89d5b";
    ctx.fillRect(point.x - 18, point.y - 10, 36, 20);
    ctx.fillStyle = "#fff6ec";
    ctx.font = "bold 12px Segoe UI";
    ctx.fillText(station.name, point.x - 28, point.y - 16);
  }
}

function shadeColor(hex, amount) {
  const value = hex.replace("#", "");
  const red = Math.max(0, Math.min(255, parseInt(value.slice(0, 2), 16) + amount));
  const green = Math.max(0, Math.min(255, parseInt(value.slice(2, 4), 16) + amount));
  const blue = Math.max(0, Math.min(255, parseInt(value.slice(4, 6), 16) + amount));
  return "#" + [red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("");
}

window.Relicbound.RelicboundGame = RelicboundGame;
}());
