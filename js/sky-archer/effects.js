(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});
  const { Particle } = SkyArcher;

  class Effects {
    constructor() {
      this.particles = [];
      this.shake = 0;
    }

    burst(x, y, count, color, speed) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = speed * (0.35 + Math.random() * 0.85);
        this.particles.push(new Particle(
          x,
          y,
          Math.cos(angle) * velocity,
          Math.sin(angle) * velocity,
          color,
          0.3 + Math.random() * 0.45,
          2 + Math.random() * 4
        ));
      }
    }

    towerShake(amount) {
      this.shake = Math.max(this.shake, amount);
    }

    update(dt, gravity) {
      this.shake = Math.max(0, this.shake - dt * 24);
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const particle = this.particles[i];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += gravity * dt * 0.18;
        if (particle.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  SkyArcher.Effects = Effects;
}());
