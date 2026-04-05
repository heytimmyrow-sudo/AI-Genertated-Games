(function () {
  const SkyArcher = window.SkyArcher || (window.SkyArcher = {});
  const { CONFIG } = SkyArcher;

  class World {
    constructor() {
      this.bridgeLanes = [
        { y: 478, startX: 1120, towerX: 315 },
        { y: 535, startX: 1180, towerX: 330 },
        { y: 598, startX: 1230, towerX: 350 }
      ];
      this.flyLanes = [
        { y: 250, startX: 1180, towerX: 420 },
        { y: 330, startX: 1240, towerX: 430 },
        { y: 185, startX: 1210, towerX: 450 }
      ];
      this.clouds = Array.from({ length: 9 }, (_, index) => ({
        x: 100 + index * 180,
        y: 80 + (index % 4) * 58,
        speed: 16 + (index % 3) * 10,
        size: 68 + (index % 4) * 18
      }));
    }

    update(dt, width) {
      for (const cloud of this.clouds) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x < -cloud.size * 2) {
          cloud.x = width + cloud.size * 2;
        }
      }
    }

    spawnPoint(type, laneIndex) {
      if (type === "flyer") {
        const lane = this.flyLanes[laneIndex % this.flyLanes.length];
        return { x: lane.startX, y: lane.y, towerX: lane.towerX };
      }

      const lane = this.bridgeLanes[laneIndex % this.bridgeLanes.length];
      return { x: lane.startX, y: lane.y, towerX: lane.towerX };
    }

    groundY(x) {
      if (x < 330) return 630;
      if (x < 760) return 630 + Math.sin((x - 330) * 0.004) * 10;
      return 622 + Math.sin((x - 760) * 0.005) * 6;
    }
  }

  SkyArcher.World = World;
}());
