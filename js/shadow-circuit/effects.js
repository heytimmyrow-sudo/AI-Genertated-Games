(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});

  class EffectsSystem {
    constructor() {
      this.particles = [];
      this.floaters = [];
      this.shake = 0;
    }

    burst(x, y, color, count, speed) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.4 + Math.random() * 0.8);
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 0.25 + Math.random() * 0.35,
          maxLife: 1,
          size: 2 + Math.random() * 4,
          color
        });
        this.particles[this.particles.length - 1].maxLife = this.particles[this.particles.length - 1].life;
      }
    }

    text(x, y, label, color) {
      this.floaters.push({ x, y, label, color, life: 0.8, maxLife: 0.8 });
    }

    addShake(amount) {
      this.shake = Math.max(this.shake, amount);
    }

    update(dt) {
      this.shake = Math.max(0, this.shake - dt * 24);

      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const particle = this.particles[i];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
        const floater = this.floaters[i];
        floater.life -= dt;
        floater.y -= dt * 24;
        if (floater.life <= 0) {
          this.floaters.splice(i, 1);
        }
      }
    }
  }

  ShadowCircuit.EffectsSystem = EffectsSystem;
}());
