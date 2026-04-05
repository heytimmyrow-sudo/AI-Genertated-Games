(function () {
  const canvas = document.getElementById("skyArcherCanvas");
  if (!canvas || !window.SkyArcher || !window.SkyArcher.Game) {
    return;
  }

  const game = new window.SkyArcher.Game(canvas);
  requestAnimationFrame(game.frame);
}());
