(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});
  const { CONFIG } = ShadowCircuit;

  class Player {
    constructor(spawn) {
      this.x = spawn.x;
      this.y = spawn.y;
      this.facingX = 1;
      this.facingY = 0;
      this.radius = CONFIG.player.radius;
      this.maxHealth = CONFIG.player.maxHealth;
      this.health = this.maxHealth;
      this.lives = CONFIG.player.lives;
      this.invincible = 0;
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.blastCooldown = 0;
      this.speedBoost = 0;
      this.shield = 0;
    }

    resetToSpawn(spawn) {
      this.x = spawn.x;
      this.y = spawn.y;
      this.health = this.maxHealth;
      this.invincible = CONFIG.player.respawnShield;
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.blastCooldown = 0;
    }
  }

  class Enemy {
    constructor(data) {
      const typeConfig = CONFIG.enemyTypes[data.type];
      this.type = data.type;
      this.x = data.x;
      this.y = data.y;
      this.radius = typeConfig.radius;
      this.maxHealth = typeConfig.maxHealth;
      this.health = this.maxHealth;
      this.speed = typeConfig.speed;
      this.aggroRange = typeConfig.aggroRange;
      this.contactDamage = typeConfig.contactDamage;
      this.color = typeConfig.color;
      this.score = typeConfig.score;
      this.path = data.path || null;
      this.pathIndex = 0;
      this.fireTimer = 0.5 + Math.random();
    }
  }

  class Projectile {
    constructor(x, y, vx, vy, color, damage, owner, radius) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.damage = damage;
      this.owner = owner;
      this.radius = radius;
      this.life = 1.4;
    }
  }

  ShadowCircuit.Player = Player;
  ShadowCircuit.Enemy = Enemy;
  ShadowCircuit.Projectile = Projectile;
}());
