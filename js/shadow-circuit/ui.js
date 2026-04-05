(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});
  const { CONFIG, utils } = ShadowCircuit;

  function drawPanel(ctx, x, y, w, h, title) {
    ctx.fillStyle = "rgba(3, 10, 18, 0.84)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(112, 241, 255, 0.18)";
    ctx.strokeRect(x, y, w, h);
    if (title) {
      ctx.fillStyle = "#84f6ff";
      ctx.font = "bold 14px Trebuchet MS";
      ctx.fillText(title, x + 14, y + 22);
    }
  }

  ShadowCircuit.drawUI = function drawUI(ctx, state) {
    drawPanel(ctx, 16, 16, 334, 112, state.world.getZoneName(state.player.x, state.player.y));
    ctx.fillStyle = "#e4f8ff";
    ctx.font = "bold 24px Trebuchet MS";
    ctx.fillText("Shadow Circuit", 30, 52);
    ctx.font = "15px Verdana";
    ctx.fillStyle = "#8eafc3";
    ctx.fillText("Health " + state.player.health + "/" + state.player.maxHealth, 30, 80);
    ctx.fillText("Lives " + state.player.lives, 154, 80);
    ctx.fillText("Cores " + state.coresCollected + "/" + CONFIG.progression.finalExitCores, 240, 80);
    ctx.fillStyle = state.player.dashCooldown <= 0 ? "#78ffca" : "#ffd36e";
    ctx.fillText("Dash " + utils.formatCooldown(state.player.dashCooldown), 30, 106);

    drawPanel(ctx, 16, 140, 334, 84, "Objective");
    ctx.fillStyle = "#dff7ff";
    ctx.font = "16px Verdana";
    ctx.fillText(state.message, 30, 176);
    ctx.fillStyle = "#92b4c8";
    ctx.fillText("Score " + state.score, 30, 202);

    drawPanel(ctx, state.width - 240, 16, 224, 140, "Status");
    ctx.fillStyle = "#e4f8ff";
    ctx.font = "15px Verdana";
    ctx.fillText("Checkpoint " + state.checkpointLabel, state.width - 226, 50);
    ctx.fillText("Shield " + (state.player.shield > 0 ? state.player.shield.toFixed(1) + "s" : "offline"), state.width - 226, 76);
    ctx.fillText("Boost " + (state.player.speedBoost > 0 ? state.player.speedBoost.toFixed(1) + "s" : "offline"), state.width - 226, 102);
    ctx.fillText("Upgrades slot: reserved", state.width - 226, 128);
  };

  ShadowCircuit.drawOverlay = function drawOverlay(ctx, state) {
    if (state.screen === "playing") return;

    ctx.fillStyle = "rgba(2, 7, 14, 0.78)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#effdff";
    ctx.font = "bold 48px Trebuchet MS";

    if (state.screen === "title") {
      ctx.fillText("Shadow Circuit", state.width / 2, state.height / 2 - 44);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#9bbccc";
      ctx.fillText("Break out of the maze, gather cores, and unlock the final port.", state.width / 2, state.height / 2 + 2);
      ctx.fillText("Press Enter to boot in. Dash with Shift, fire with Space.", state.width / 2, state.height / 2 + 34);
    } else if (state.screen === "paused") {
      ctx.fillText("Paused", state.width / 2, state.height / 2 - 20);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#9bbccc";
      ctx.fillText("Press P to resume the run.", state.width / 2, state.height / 2 + 20);
    } else if (state.screen === "gameover") {
      ctx.fillText("System Failure", state.width / 2, state.height / 2 - 24);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#9bbccc";
      ctx.fillText("Press Enter to restart the run or Esc for the menu.", state.width / 2, state.height / 2 + 18);
    } else if (state.screen === "win") {
      ctx.fillText("Escape Confirmed", state.width / 2, state.height / 2 - 24);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#9bbccc";
      ctx.fillText("You broke the circuit. Press Enter to run it again.", state.width / 2, state.height / 2 + 18);
    }
    ctx.textAlign = "start";
  };
}());
