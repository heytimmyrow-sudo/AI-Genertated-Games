export class GameLoop {
  constructor(update) {
    this.update = update;
    this.lastTime = 0;
    this.rafId = 0;
    this.tick = this.tick.bind(this);
  }

  start() {
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }

  tick(time) {
    const deltaSeconds = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(deltaSeconds);
    this.rafId = requestAnimationFrame(this.tick);
  }
}
