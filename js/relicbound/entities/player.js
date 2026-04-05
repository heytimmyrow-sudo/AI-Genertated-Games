(function () {
window.Relicbound = window.Relicbound || {};

const { GAME_CONFIG, angleFromVector, clamp, normalizeVector } = window.Relicbound;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = GAME_CONFIG.player.radius;
    this.facing = 0;
    this.attackCooldown = 0;
    this.attackTimer = 0;
    this.invulnerableTimer = 0;
    this.stepBob = 0;
    this.hitFlash = 0;
    this.upgrades = {
      vigor: 0,
      tempo: 0,
      edge: 0,
      ward: 0
    };
    this.runBonuses = {
      merchantDamage: 0,
      craftedDamage: 0,
      craftedHealth: 0
    };
    this.syncStats();
    this.health = this.maxHealth;
  }

  update(game, dt) {
    const inputMove = game.input.getMoveVector();
    const moveX = inputMove.x;
    const moveY = inputMove.y;
    const movement = normalizeVector(moveX, moveY);
    const moveStrength = Math.min(1, Math.hypot(moveX, moveY));
    const moving = moveX !== 0 || moveY !== 0;

    if (moving) {
      this.facing = angleFromVector(movement.x, movement.y, this.facing);
      this.stepBob += dt * 10;
    }

    const stepX = movement.x * this.speed * moveStrength * dt;
    const stepY = movement.y * this.speed * moveStrength * dt;
    game.world.moveCircle(this, stepX, stepY);

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    if (game.input.wasPressed(" ", "j", "pad_attack")) {
      this.tryAttack(game);
    }
  }

  tryAttack(game) {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = this.attackCooldownTime;
    this.attackTimer = GAME_CONFIG.player.attackWindow;
    game.resolvePlayerAttack(this);
  }

  takeDamage(game, amount) {
    if (this.invulnerableTimer > 0) return;
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.invulnerableTimer = this.invulnerabilityTime;
    this.hitFlash = 0.16;
    game.effects.addHitBurst(this.x, this.y, "#ff8fa2");
    game.camera.shake(GAME_CONFIG.combat.screenShakeOnHit);
  }

  heal(amount) {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  applyUpgrade(upgradeId, rank) {
    if (!(upgradeId in this.upgrades)) return false;
    this.upgrades[upgradeId] = rank;
    this.syncStats();
    if (upgradeId === "vigor") {
      this.heal(1);
    }
    return true;
  }

  syncStats() {
    // Derived stats are recalculated from upgrade ranks so future save/load can restore them from data.
    this.maxHealth = GAME_CONFIG.player.maxHealth + this.upgrades.vigor * 1 + this.runBonuses.craftedHealth;
    this.speed = GAME_CONFIG.player.speed + this.upgrades.tempo * 18;
    this.attackDamage = GAME_CONFIG.player.attackDamage + this.upgrades.edge * 1 + this.runBonuses.merchantDamage + this.runBonuses.craftedDamage;
    this.attackCooldownTime = Math.max(0.16, GAME_CONFIG.player.attackCooldown - this.upgrades.tempo * 0.04);
    this.invulnerabilityTime = GAME_CONFIG.player.invulnerability + this.upgrades.ward * 0.12;
    this.health = clamp(this.health ?? this.maxHealth, 0, this.maxHealth);
  }
}

window.Relicbound.Player = Player;
}());
