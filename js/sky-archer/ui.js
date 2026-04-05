(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});

  SkyArcher.drawUI = function drawUI(ctx, game) {
    ctx.fillStyle = "rgba(9, 21, 34, 0.72)";
    ctx.fillRect(18, 18, 320, 126);
    ctx.strokeStyle = "rgba(255, 241, 183, 0.26)";
    ctx.strokeRect(18, 18, 320, 126);

    ctx.fillStyle = "#fff4dd";
    ctx.font = "bold 26px Trebuchet MS";
    ctx.fillText("Sky Archer", 34, 50);

    ctx.font = "15px Verdana";
    ctx.fillStyle = "#e8f8ff";
    ctx.fillText("Tower " + game.towerHealth + "/" + game.maxTowerHealth, 34, 78);
    ctx.fillText("Wave " + game.displayWave, 152, 78);
    ctx.fillText("Score " + game.score, 34, 104);
    ctx.fillText("Arrows " + Math.floor(game.arrowAmmo) + "/" + game.maxArrowAmmo, 152, 104);
    ctx.fillText("Arrow Type " + game.arrowTypeLabel, 34, 130);

    if (game.waveIntroTimer > 0 && game.screen === "playing") {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 252, 238, 0.96)";
      ctx.font = "bold 38px Trebuchet MS";
      ctx.fillText(game.waveLabel, game.width * 0.5, 92);
      ctx.font = "18px Verdana";
      ctx.fillStyle = "#d4efff";
      ctx.fillText("Draw the bow and break the next push.", game.width * 0.5, 122);
      ctx.textAlign = "start";
    }
  };

  SkyArcher.drawOverlay = function drawOverlay(ctx, game) {
    if (game.screen === "playing") return;

    ctx.fillStyle = "rgba(5, 12, 24, 0.62)";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7e6";
    ctx.font = "bold 54px Trebuchet MS";

    if (game.screen === "title") {
      ctx.fillText("Sky Archer", game.width * 0.5, game.height * 0.34);
      ctx.font = "21px Verdana";
      ctx.fillStyle = "#d9f5ff";
      ctx.fillText("Hold the mouse to draw the bow. Release to fire. Protect the tower across five rising waves.", game.width * 0.5, game.height * 0.42);
      ctx.fillText("Click to start.", game.width * 0.5, game.height * 0.48);
    } else if (game.screen === "paused") {
      ctx.fillText("Paused", game.width * 0.5, game.height * 0.42);
      ctx.font = "21px Verdana";
      ctx.fillStyle = "#d9f5ff";
      ctx.fillText("Press P to resume or Esc for the menu.", game.width * 0.5, game.height * 0.48);
    } else if (game.screen === "gameover") {
      ctx.fillText("Tower Fallen", game.width * 0.5, game.height * 0.38);
      ctx.font = "21px Verdana";
      ctx.fillStyle = "#d9f5ff";
      ctx.fillText("Final score " + game.score + ". Click to defend again.", game.width * 0.5, game.height * 0.46);
    } else if (game.screen === "win") {
      ctx.fillText("Kingdom Saved", game.width * 0.5, game.height * 0.38);
      ctx.font = "21px Verdana";
      ctx.fillStyle = "#d9f5ff";
      ctx.fillText("All five waves held. Click to start a new defense.", game.width * 0.5, game.height * 0.46);
    }

    ctx.textAlign = "start";
  };
}());
