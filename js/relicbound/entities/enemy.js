(function () {
window.Relicbound = window.Relicbound || {};

const { GAME_CONFIG, angleFromVector, distance, normalizeVector } = window.Relicbound;

class Enemy {
  constructor(data) {
    const template = GAME_CONFIG.enemyTypes[data.type];
    this.type = data.type;
    this.label = template.label;
    this.x = data.x;
    this.y = data.y;
    this.homeX = data.x;
    this.homeY = data.y;
    this.color = template.color;
    this.radius = template.radius;
    this.speed = template.speed;
    this.maxHealth = template.maxHealth;
    this.health = template.maxHealth;
    this.touchDamage = template.touchDamage;
    this.detectionRange = template.detectionRange;
    this.patrolDistance = template.patrolDistance;
    this.patrolStyle = template.patrolStyle;
    this.isBoss = Boolean(template.isBoss);
    this.hitTimer = 0;
    this.contactTimer = 0;
    this.aiTime = Math.random() * Math.PI * 2;
    this.facing = 0;
    this.dead = false;
  }

  update(game, dt) {
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.contactTimer = Math.max(0, this.contactTimer - dt);
    this.aiTime += dt;

    const playerDistance = distance(this.x, this.y, game.player.x, game.player.y);
    let move = { x: 0, y: 0 };

    if (playerDistance < this.detectionRange) {
      move = normalizeVector(game.player.x - this.x, game.player.y - this.y);
    } else if (this.patrolStyle === "orbit") {
      const orbitX = this.homeX + Math.cos(this.aiTime * 0.9) * this.patrolDistance;
      const orbitY = this.homeY + Math.sin(this.aiTime * 0.9) * this.patrolDistance;
      move = normalizeVector(orbitX - this.x, orbitY - this.y);
    } else {
      const lineTarget = this.homeX + Math.sin(this.aiTime * 0.8) * this.patrolDistance;
      move = normalizeVector(lineTarget - this.x, this.homeY - this.y);
    }

    if (move.x !== 0 || move.y !== 0) {
      this.facing = angleFromVector(move.x, move.y, this.facing);
    }

    game.world.moveCircle(this, move.x * this.speed * dt, move.y * this.speed * dt);

    if (playerDistance < this.radius + game.player.radius + 2 && this.contactTimer <= 0) {
      this.contactTimer = 0.55;
      game.player.takeDamage(game, this.touchDamage);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitTimer = 0.15;
    if (this.health <= 0) {
      this.dead = true;
    }
  }
}

window.Relicbound.Enemy = Enemy;
}());
