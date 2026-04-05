(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});
  const { CONFIG } = SkyArcher;

  class Arrow {
    constructor(x, y, angle, power, type) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * power;
      this.vy = Math.sin(angle) * power;
      this.angle = angle;
      this.type = type;
      this.damage = CONFIG.arrows.specialTypes[type].damage;
      this.stuck = false;
      this.stuckTimer = 3.8;
      this.embedded = null;
      this.history = [];
    }
  }

  class Enemy {
    constructor(type, pathIndex, startX, startY) {
      const config = CONFIG.enemyTypes[type];
      this.type = type;
      this.x = startX;
      this.y = startY;
      this.baseY = startY;
      this.pathIndex = pathIndex;
      this.radius = config.radius;
      this.speed = config.speed;
      this.health = config.health;
      this.maxHealth = config.health;
      this.damage = config.damage;
      this.score = config.score;
      this.path = config.path;
      this.hitFlash = 0;
      this.phase = Math.random() * Math.PI * 2;
      this.reachedTower = false;
    }
  }

  class Particle {
    constructor(x, y, vx, vy, color, life, size) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.life = life;
      this.maxLife = life;
      this.size = size;
    }
  }

  SkyArcher.Arrow = Arrow;
  SkyArcher.Enemy = Enemy;
  SkyArcher.Particle = Particle;
}());
