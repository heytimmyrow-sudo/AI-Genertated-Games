(function () {
window.Relicbound = window.Relicbound || {};

const { clamp, lerp } = window.Relicbound;

class Camera {
  constructor(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.x = 0;
    this.y = 0;
    this.shakeStrength = 0;
    this.shakeTime = 0;
  }

  update(targetX, targetY, worldWidth, worldHeight, dt, smoothness, anchorX = 0.5, anchorY = 0.5) {
    const desiredX = clamp(targetX - this.viewWidth * anchorX, 0, Math.max(0, worldWidth - this.viewWidth));
    const desiredY = clamp(targetY - this.viewHeight * anchorY, 0, Math.max(0, worldHeight - this.viewHeight));
    this.x = lerp(this.x, desiredX, 1 - Math.pow(1 - smoothness, dt * 60));
    this.y = lerp(this.y, desiredY, 1 - Math.pow(1 - smoothness, dt * 60));
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.shakeTime <= 0) {
      this.shakeStrength = 0;
    }
  }

  shake(strength, duration = 0.18) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  getRenderOffset() {
    if (this.shakeTime <= 0 || this.shakeStrength <= 0) {
      return { x: this.x, y: this.y };
    }

    return {
      x: this.x + (Math.random() - 0.5) * this.shakeStrength * 2,
      y: this.y + (Math.random() - 0.5) * this.shakeStrength * 2
    };
  }
}

window.Relicbound.Camera = Camera;
}());
