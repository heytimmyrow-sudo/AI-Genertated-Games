function drawBar(ctx, x, y, width, height, amount, max, fill, background) {
  const ratio = Math.max(0, Math.min(1, amount / max));
  ctx.fillStyle = background;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width * ratio, height);
  ctx.strokeStyle = "rgba(210, 240, 255, 0.25)";
  ctx.strokeRect(x, y, width, height);
}

export function renderHud(ctx, world, state) {
  const { player } = world;

  ctx.save();
  ctx.fillStyle = "rgba(6, 12, 20, 0.64)";
  ctx.fillRect(16, 16, 290, 110);
  ctx.strokeStyle = "rgba(125, 227, 255, 0.2)";
  ctx.strokeRect(16, 16, 290, 110);

  ctx.fillStyle = "#ecfaff";
  ctx.font = "bold 18px Trebuchet MS";
  ctx.fillText("Restoration Status", 28, 42);

  ctx.font = "14px Verdana";
  ctx.fillStyle = "#94afc0";
  ctx.fillText(world.objective, 28, 62, 260);

  drawBar(ctx, 28, 82, 180, 14, player.health, player.maxHealth, "#ff7f8b", "rgba(255,255,255,0.08)");
  ctx.fillStyle = "#ecfaff";
  ctx.fillText(`Health ${Math.ceil(player.health)}/${player.maxHealth}`, 218, 94);

  ctx.fillStyle = "#7de3ff";
  ctx.fillText(`Crystals: ${player.crystalsCollected}`, 28, 116);
  ctx.fillStyle = "#ffd66b";
  ctx.fillText(`Key Fragments: ${player.keyFragments}`, 146, 116);
  ctx.fillStyle = "#ecfaff";
  ctx.fillText(`State: ${state.screen.toUpperCase()}`, 28, 138);
  ctx.restore();
}

export function renderOverlay(ctx, state, world) {
  if (state.screen === "playing") {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 14, 0.72)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ecfaff";
  ctx.font = "bold 40px Trebuchet MS";

  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  if (state.screen === "title") {
    ctx.fillText("Shadow Keys", centerX, centerY - 30);
    ctx.font = "18px Verdana";
    ctx.fillStyle = "#94afc0";
    ctx.fillText("Press Enter to begin restoring the island.", centerX, centerY + 12);
  } else if (state.screen === "paused") {
    ctx.fillText("Paused", centerX, centerY - 30);
    ctx.font = "18px Verdana";
    ctx.fillStyle = "#94afc0";
    ctx.fillText("Press Esc to return to the island.", centerX, centerY + 12);
  } else if (state.screen === "gameover") {
    ctx.fillText("Light Fades", centerX, centerY - 30);
    ctx.font = "18px Verdana";
    ctx.fillStyle = "#94afc0";
    ctx.fillText("Press R to try the island again.", centerX, centerY + 12);
  } else if (state.screen === "victory") {
    ctx.fillText("Island Restored", centerX, centerY - 30);
    ctx.font = "18px Verdana";
    ctx.fillStyle = "#94afc0";
    ctx.fillText(`Crystals recovered: ${world.player.crystalsCollected}. Press R to replay.`, centerX, centerY + 12);
  }

  ctx.restore();
}
