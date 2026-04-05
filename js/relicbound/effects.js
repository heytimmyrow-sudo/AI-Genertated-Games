(function () {
window.Relicbound = window.Relicbound || {};

class EffectsSystem {
  constructor() {
    this.particles = [];
    this.text = [];
  }

  addParticleBurst(x, y, color, count, spread = 120) {
    for (let i = 0; i < count; i += 1) {
      const particle = {
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        size: 3 + Math.random() * 4,
        life: 0.25 + Math.random() * 0.45,
        maxLife: 0,
        color
      };
      particle.maxLife = particle.life;
      this.particles.push(particle);
    }
  }

  addHitBurst(x, y, color) {
    this.addParticleBurst(x, y, color, 10, 140);
  }

  addPickupBurst(x, y, color) {
    this.addParticleBurst(x, y, color, 14, 170);
  }

  addText(x, y, value, color = "#fff6ec") {
    this.text.push({ x, y, value, color, life: 0.8, maxLife: 0.8 });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.text.length - 1; i >= 0; i -= 1) {
      const text = this.text[i];
      text.y -= 18 * dt;
      text.life -= dt;
      if (text.life <= 0) {
        this.text.splice(i, 1);
      }
    }
  }
}

window.Relicbound.EffectsSystem = EffectsSystem;
}());
