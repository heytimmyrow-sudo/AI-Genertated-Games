(function () {
  const canvas = document.getElementById("stillwakeCanvas");
  if (!canvas || !window.THREE || !window.StillwakeHouse || !window.StillwakeHouse.Game) {
    return;
  }

  const game = new window.StillwakeHouse.Game(canvas);
  requestAnimationFrame(game.frame);
}());
