export class PerformanceDebugSystem {
  constructor(renderer, scene, systems = {}, ui = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.systems = systems;
    this.ui = ui;
    this.visible = false;
    this.frames = 0;
    this.elapsed = 0;
    this.fps = 0;
    this.objectCount = 0;
    this.timer = 0;
    this.ui.toggle?.addEventListener("click", () => this.toggle());
  }

  toggle() {
    this.visible = !this.visible;
    if (this.ui.panel) {
      this.ui.panel.hidden = !this.visible;
    }
    if (this.visible) {
      this.render();
    }
  }

  update(deltaSeconds, input) {
    if (input.wasPressed("F3")) {
      this.toggle();
    }

    this.frames += 1;
    this.elapsed += deltaSeconds;
    this.timer += deltaSeconds;

    if (!this.visible) {
      return;
    }

    if (this.elapsed >= 0.5) {
      this.fps = Math.round(this.frames / this.elapsed);
      this.frames = 0;
      this.elapsed = 0;
    }

    if (this.timer < 0.35) {
      return;
    }

    this.timer = 0;
    this.collectObjectCount();
    this.render();
  }

  collectObjectCount() {
    this.objectCount = 0;
    this.scene.traverse((object) => {
      if (object.visible) {
        this.objectCount += 1;
      }
    });
  }

  render() {
    if (!this.ui.body) {
      return;
    }

    this.collectObjectCount();

    const enemies = this.systems.enemies?.enemies?.filter((enemy) => enemy?.group?.visible && !enemy.defeated).length ?? 0;
    const bosses = this.systems.bosses?.filter((system) => (
      system?.boss?.group?.visible
      && !system.boss.defeated
      && (system.boss.active || system.boss.noticed || system.questActive)
    )).length ?? 0;
    const arrows = this.systems.archery?.arrows?.filter((arrow) => arrow?.group?.parent || arrow?.trail?.parent).length ?? 0;
    const region = this.systems.regionState?.textContent ?? "Unknown";
    const calls = this.renderer.info.render.calls;
    const triangles = this.renderer.info.render.triangles;
    const warnings = [];

    if (this.fps > 0 && this.fps < 35) warnings.push("FPS low");
    if (calls > 520) warnings.push("High draw calls");
    if (this.objectCount > 1800) warnings.push("Many visible objects");
    if (arrows > 24) warnings.push("Arrow cleanup pressure");

    this.ui.body.innerHTML = `
      <span>FPS</span><strong>${this.fps || "..."}</strong>
      <span>Visible Objects</span><strong>${this.objectCount}</strong>
      <span>Draw Calls</span><strong>${calls}</strong>
      <span>Triangles</span><strong>${triangles.toLocaleString()}</strong>
      <span>Enemies</span><strong>${enemies}</strong>
      <span>Bosses</span><strong>${bosses}</strong>
      <span>Arrows</span><strong>${arrows}</strong>
      <span>Region</span><strong>${region}</strong>
      ${warnings.length ? `<span class="warning">${warnings.join(" - ")}</span>` : `<span class="warning">No warnings</span>`}
    `;
  }
}
