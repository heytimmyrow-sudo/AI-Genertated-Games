function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 26;
    this.height = 26;
    this.speed = 210;
    this.health = 100;
    this.maxHealth = 100;
    this.crystalsCollected = 0;
    this.keyFragments = 0;
    this.attackCooldown = 0;
    this.invulnerableTimer = 0;
    this.attackRadius = 86;
    this.attackActive = 0;
    this.color = "#e6fdff";
  }

  center() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  tryMove(dx, dy, dt, solids, bounds) {
    const nextX = this.x + dx * this.speed * dt;
    if (!this.collidesAt(nextX, this.y, solids, bounds)) {
      this.x = nextX;
    }

    const nextY = this.y + dy * this.speed * dt;
    if (!this.collidesAt(this.x, nextY, solids, bounds)) {
      this.y = nextY;
    }
  }

  collidesAt(x, y, solids, bounds) {
    if (x < bounds.x || y < bounds.y || x + this.width > bounds.x + bounds.width || y + this.height > bounds.y + bounds.height) {
      return true;
    }

    return solids.some((solid) => (
      x < solid.x + solid.width &&
      x + this.width > solid.x &&
      y < solid.y + solid.height &&
      y + this.height > solid.y
    ));
  }

  attack() {
    if (this.attackCooldown > 0) {
      return false;
    }

    this.attackCooldown = 0.45;
    this.attackActive = 0.14;
    return true;
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) {
      return false;
    }

    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.invulnerableTimer = 0.7;
    return true;
  }

  heal(amount) {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  updateTimers(dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.attackActive = Math.max(0, this.attackActive - dt);
  }
}
