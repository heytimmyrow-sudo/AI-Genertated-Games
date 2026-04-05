(function () {
  const canvas = document.getElementById("shadowCircuitCanvas");
  if (!canvas || !window.ShadowCircuit || !window.ShadowCircuit.Game) {
    return;
  }

  const game = new window.ShadowCircuit.Game(canvas);
  requestAnimationFrame(game.frame);
}());
