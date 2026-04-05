(function () {
window.Relicbound = window.Relicbound || {};

class Collectible {
  constructor(data) {
    this.type = data.type;
    this.x = data.x;
    this.y = data.y;
    this.radius = data.type === "relic" ? 14 : 11;
    this.pulse = Math.random() * Math.PI * 2;
    this.taken = false;
  }

  update(dt) {
    this.pulse += dt * 4;
  }
}

window.Relicbound.Collectible = Collectible;
}());
