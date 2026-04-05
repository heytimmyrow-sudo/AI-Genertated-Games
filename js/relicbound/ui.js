(function () {
window.Relicbound = window.Relicbound || {};

function drawUI(ctx, game) {
  drawHud(ctx, game);
  drawOverlay(ctx, game);
}

function drawHud(ctx, game) {
  const { player, state } = game;
  ctx.save();
  ctx.fillStyle = "rgba(12, 18, 39, 0.76)";
  ctx.fillRect(16, 16, 320, 122);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.2)";
  ctx.strokeRect(16, 16, 320, 122);

  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 20px Georgia";
  ctx.fillText("Relicbound Vale", 28, 42);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#b8bddb";
  ctx.fillText(game.world.area.name + "  |  Coins " + state.coins, 28, 64);
  ctx.fillText("Relics " + state.relics + "  |  Score " + state.score + (state.activeBiome ? "  |  " + state.activeBiome : ""), 28, 84);
  ctx.fillText("Wood " + state.materials.wood + "  |  Stone " + state.materials.stone, 28, 104);
  if (state.navigationHint) {
    ctx.fillText(state.navigationHint, 28, 128);
  }

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(28, 96, 180, 14);
  ctx.fillStyle = "#ff7d72";
  ctx.fillRect(28, 96, 180 * (player.health / player.maxHealth), 14);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.strokeRect(28, 96, 180, 14);
  ctx.fillStyle = "#fff6ec";
  ctx.fillText("Health " + player.health + "/" + player.maxHealth, 220, 108);

  ctx.fillStyle = "rgba(12, 18, 39, 0.68)";
  ctx.fillRect(ctx.canvas.width - 292, 16, 276, 112);
  ctx.strokeStyle = "rgba(125, 227, 255, 0.16)";
  ctx.strokeRect(ctx.canvas.width - 292, 16, 276, 112);
  ctx.fillStyle = "#92fbff";
  ctx.fillText("Quest", ctx.canvas.width - 280, 40);
  ctx.fillStyle = "#b8bddb";
  ctx.fillText(game.getQuestText(), ctx.canvas.width - 280, 62, 248);
  ctx.fillText("Relic Shards " + state.upgradePoints + "  |  Shrine " + (state.shrineHint ? "Nearby" : "Dormant"), ctx.canvas.width - 280, 86, 248);
  if (state.interactHint) {
    ctx.fillText(state.interactHint + "  |  Interact E / X", ctx.canvas.width - 280, 104, 248);
  }

  drawQuestLog(ctx, game);

  ctx.fillStyle = "rgba(12, 18, 39, 0.72)";
  ctx.fillRect(16, ctx.canvas.height - 52, 620, 34);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.16)";
  ctx.strokeRect(16, ctx.canvas.height - 52, 620, 34);
  ctx.fillStyle = "#e6d9ff";
  ctx.fillText(state.message, 28, ctx.canvas.height - 30);
  ctx.restore();

  if (state.shrineHint) {
    drawShrinePanel(ctx, game);
  }
  if (state.shop.open) {
    drawShopPanel(ctx, game);
  }
  if (state.fastTravel.open) {
    drawFastTravelPanel(ctx, game);
  }
  if (state.crafting.open) {
    drawCraftingPanel(ctx, game);
  }
  if (state.mapOpen) {
    drawWorldMap(ctx, game);
  }
}

window.Relicbound.drawUI = drawUI;

function drawOverlay(ctx, game) {
  if (game.state.screen === "playing") return;

  ctx.save();
  ctx.fillStyle = "rgba(6, 8, 14, 0.76)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 42px Georgia";
  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;

  if (game.state.screen === "title") {
    ctx.fillText("Relicbound Vale", cx, cy - 54);
    ctx.font = "18px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("A modular fantasy action-adventure framework with biomes, camps, shrines, and NPCs.", cx, cy - 10);
    ctx.fillText("Press Enter to begin. Keyboard and controller both work.", cx, cy + 18);
  } else if (game.state.screen === "paused") {
    ctx.fillText("Paused", cx, cy - 18);
    ctx.font = "18px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("Press Esc or P to continue.", cx, cy + 18);
  } else if (game.state.screen === "gameover") {
    ctx.fillText("Fallen In The Vale", cx, cy - 18);
    ctx.font = "18px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("Press R or the restart button to try again.", cx, cy + 18);
  } else if (game.state.screen === "victory") {
    ctx.fillText("Vale Secured", cx, cy - 18);
    ctx.font = "18px Segoe UI";
    ctx.fillStyle = "#b8bddb";
    ctx.fillText("You cleared the full wilds region. Press R to replay.", cx, cy + 18);
  }

  ctx.restore();
}

function drawShrinePanel(ctx, game) {
  const upgrades = window.Relicbound.GAME_CONFIG.upgrades;
  const panelWidth = 360;
  const panelHeight = 210;
  const x = ctx.canvas.width - panelWidth - 18;
  const y = ctx.canvas.height - panelHeight - 18;

  ctx.save();
  ctx.fillStyle = "rgba(8, 16, 30, 0.9)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(146, 251, 255, 0.24)";
  ctx.strokeRect(x, y, panelWidth, panelHeight);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 20px Georgia";
  ctx.fillText("Shrine Attunement", x + 16, y + 28);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#92fbff";
  ctx.fillText("Spend relic shards to strengthen your run.", x + 16, y + 50);

  let rowY = y + 78;
  for (const upgrade of upgrades) {
    const rank = game.state.upgrades[upgrade.id] || 0;
    const locked = rank >= upgrade.maxRank || game.state.upgradePoints < upgrade.cost;
    ctx.fillStyle = locked ? "rgba(255,255,255,0.06)" : "rgba(146, 251, 255, 0.08)";
    ctx.fillRect(x + 14, rowY - 18, panelWidth - 28, 34);
    ctx.fillStyle = locked ? "#8d95aa" : "#fff6ec";
    ctx.fillText(upgrade.key + ". " + upgrade.name + "  " + rank + "/" + upgrade.maxRank, x + 22, rowY);
    ctx.fillStyle = "#b8bddb";
    ctx.fillText(upgrade.description, x + 22, rowY + 16, panelWidth - 44);
    rowY += 42;
  }
  ctx.restore();
}

function drawShopPanel(ctx, game) {
  const merchant = game.world.merchants.find((entry) => entry.id === game.state.shop.merchantId);
  if (!merchant) return;

  const panelWidth = 360;
  const panelHeight = 150;
  const x = 18;
  const y = ctx.canvas.height - panelHeight - 70;

  ctx.save();
  ctx.fillStyle = "rgba(28, 19, 10, 0.94)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(229, 192, 123, 0.24)";
  ctx.strokeRect(x, y, panelWidth, panelHeight);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 20px Georgia";
  ctx.fillText(merchant.name + "'s Pack", x + 16, y + 28);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#e5c07b";
  ctx.fillText("Press 1-2 to buy. Press E or Esc to close.", x + 16, y + 50);

  let rowY = y + 84;
  for (const item of merchant.items) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x + 14, rowY - 18, panelWidth - 28, 34);
    ctx.fillStyle = "#fff6ec";
    ctx.fillText(item.key + ". " + item.name + "  (" + item.cost + " coins)", x + 22, rowY);
    ctx.fillStyle = "#b8bddb";
    ctx.fillText(item.description, x + 22, rowY + 16, panelWidth - 44);
    rowY += 42;
  }
  ctx.restore();
}

function drawFastTravelPanel(ctx, game) {
  const sanctuaries = game.world.sanctuaries.filter((entry) => game.state.checkpoints[entry.id]);
  if (!sanctuaries.length) return;

  const panelWidth = 360;
  const panelHeight = 70 + sanctuaries.length * 34;
  const x = ctx.canvas.width - panelWidth - 18;
  const y = 140;

  ctx.save();
  ctx.fillStyle = "rgba(10, 22, 32, 0.94)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(146, 251, 255, 0.26)";
  ctx.strokeRect(x, y, panelWidth, panelHeight);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 20px Georgia";
  ctx.fillText("Sanctuary Travel", x + 16, y + 28);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#92fbff";
  ctx.fillText("Press 1-" + sanctuaries.length + " to travel, E or Esc to stay.", x + 16, y + 50);

  let rowY = y + 82;
  sanctuaries.forEach((sanctuary, index) => {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x + 14, rowY - 18, panelWidth - 28, 26);
    ctx.fillStyle = "#fff6ec";
    ctx.fillText(String(index + 1) + ". " + sanctuary.name, x + 22, rowY);
    rowY += 34;
  });
  ctx.restore();
}

function drawCraftingPanel(ctx, game) {
  const station = game.world.craftingStations.find((entry) => entry.id === game.state.crafting.stationId);
  if (!station) return;

  const panelWidth = 380;
  const panelHeight = 180;
  const x = 18;
  const y = 180;

  ctx.save();
  ctx.fillStyle = "rgba(36, 20, 12, 0.94)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(216, 157, 91, 0.28)";
  ctx.strokeRect(x, y, panelWidth, panelHeight);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 20px Georgia";
  ctx.fillText(station.name, x + 16, y + 28);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#d89d5b";
  ctx.fillText("Press 1-3 to craft. Attack trees and stone nodes to gather.", x + 16, y + 50);

  let rowY = y + 84;
  for (const recipe of station.recipes) {
    const crafted = game.state.craftedRecipes[recipe.id];
    ctx.fillStyle = crafted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 14, rowY - 18, panelWidth - 28, 34);
    ctx.fillStyle = crafted ? "#8d95aa" : "#fff6ec";
    ctx.fillText(recipe.key + ". " + recipe.name + "  (" + recipe.wood + " wood / " + recipe.stone + " stone)", x + 22, rowY);
    ctx.fillStyle = "#b8bddb";
    ctx.fillText(recipe.description, x + 22, rowY + 16, panelWidth - 44);
    rowY += 42;
  }
  ctx.restore();
}

function drawQuestLog(ctx, game) {
  const entries = game.getQuestEntries();
  const x = 16;
  const y = 148;
  const width = 320;
  const height = 30 + entries.length * 24;

  ctx.save();
  ctx.fillStyle = "rgba(12, 18, 39, 0.56)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255, 214, 107, 0.14)";
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 16px Georgia";
  ctx.fillText("Quest Log", x + 12, y + 22);
  ctx.font = "13px Segoe UI";

  let rowY = y + 44;
  for (const entry of entries) {
    ctx.fillStyle = entry.done ? "#92fbff" : "#b8bddb";
    ctx.fillText((entry.done ? "Done: " : "Next: ") + entry.title, x + 12, rowY);
    rowY += 18;
  }
  ctx.restore();
}

function drawWorldMap(ctx, game) {
  const panelWidth = 460;
  const panelHeight = 320;
  const x = (ctx.canvas.width - panelWidth) / 2;
  const y = (ctx.canvas.height - panelHeight) / 2;
  const mapPadding = 18;
  const mapX = x + mapPadding;
  const mapY = y + 54;
  const mapWidth = panelWidth - mapPadding * 2;
  const mapHeight = panelHeight - 80;
  const scaleX = mapWidth / game.world.width;
  const scaleY = mapHeight / game.world.height;

  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 18, 0.94)";
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(146, 251, 255, 0.2)";
  ctx.strokeRect(x, y, panelWidth, panelHeight);
  ctx.fillStyle = "#fff6ec";
  ctx.font = "bold 22px Georgia";
  ctx.fillText("World Map", x + 16, y + 28);
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#92fbff";
  ctx.fillText("Press M to close", x + panelWidth - 110, y + 28);

  for (const biome of game.world.biomes) {
    ctx.fillStyle = biome.floor;
    ctx.fillRect(mapX + biome.x * scaleX, mapY + biome.y * scaleY, biome.width * scaleX, biome.height * scaleY);
  }

  for (const camp of game.world.camps) {
    ctx.fillStyle = game.state.campsCleared[camp.id] ? "#92fbff" : "#ffb16e";
    ctx.fillRect(mapX + camp.x * scaleX - 4, mapY + camp.y * scaleY - 4, 8, 8);
  }

  for (const sanctuary of game.world.sanctuaries) {
    ctx.fillStyle = game.state.checkpoints[sanctuary.id] ? "#92fbff" : "#61b9c7";
    ctx.beginPath();
    ctx.arc(mapX + sanctuary.x * scaleX, mapY + sanctuary.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const dungeon of game.world.dungeons) {
    ctx.fillStyle = "#8f7cff";
    ctx.fillRect(mapX + dungeon.x * scaleX - 4, mapY + dungeon.y * scaleY - 4, 8, 8);
  }

  ctx.fillStyle = "#ffe88d";
  ctx.beginPath();
  ctx.arc(mapX + game.player.x * scaleX, mapY + game.player.y * scaleY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
  ctx.restore();
}
}());
