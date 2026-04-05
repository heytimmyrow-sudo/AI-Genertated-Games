export class Enemy {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width ?? 26;
    this.height = config.height ?? 26;
    this.speed = config.speed ?? 78;
    this.health = config.health ?? 30;
    this.detectionRadius = config.detectionRadius ?? 190;
    this.damage = config.damage ?? 12;
    this.contactCooldown = 0;
    this.color = config.color ?? "#ff6270";
    this.kind = config.kind ?? "crawler";
  }

  center() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  chasePlayer(player, dt, solids) {
    const source = this.center();
    const target = player.center();
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy);

    if (distance === 0 || distance > this.detectionRadius) {
      return;
    }

    const stepX = (dx / distance) * this.speed * dt;
    const stepY = (dy / distance) * this.speed * dt;
    const nextX = this.x + stepX;
    const nextY = this.y + stepY;

    if (!this.collides(nextX, this.y, solids)) {
      this.x = nextX;
    }

    if (!this.collides(this.x, nextY, solids)) {
      this.y = nextY;
    }
  }

  collides(x, y, solids) {
    return solids.some((solid) => (
      x < solid.x + solid.width &&
      x + this.width > solid.x &&
      y < solid.y + solid.height &&
      y + this.height > solid.y
    ));
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(player, dt, solids) {
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.chasePlayer(player, dt, solids);
  }
}
