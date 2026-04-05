(function () {
  const ShadowCircuit = window.ShadowCircuit || (window.ShadowCircuit = {});
  const { MAP_DATA, Enemy, utils } = ShadowCircuit;

  class World {
    constructor() {
      this.reset();
    }

    reset() {
      const data = MAP_DATA;
      // Clone the authored content so each run can mutate gates, pickups, and enemies safely.
      this.name = data.name;
      this.width = data.width;
      this.height = data.height;
      this.walls = data.walls.map((wall) => ({ ...wall }));
      this.hazards = data.hazards.map((hazard) => ({ ...hazard }));
      this.gates = data.gates.map((gate) => ({ ...gate }));
      this.checkpoints = data.checkpoints.map((checkpoint) => ({ ...checkpoint }));
      this.cores = data.cores.map((core, index) => ({ id: index, x: core.x, y: core.y, collected: false }));
      this.pickups = data.pickups.map((pickup, index) => ({ id: index, ...pickup, taken: false }));
      this.terminals = data.terminals.map((terminal) => ({ ...terminal }));
      this.zones = data.zones.map((zone) => ({ ...zone }));
      this.finalExit = { ...data.finalExit };
      this.playerSpawn = { ...data.playerSpawn };
      this.enemies = data.enemies.map((enemy) => new Enemy(enemy));
    }

    getColliders(collectedCores) {
      const activeGates = this.gates
        .filter((gate) => !gate.open && collectedCores < gate.requiredCores)
        .map((gate) => gate.rect);
      return this.walls.concat(activeGates);
    }

    getZoneName(x, y) {
      const zone = this.zones.find((candidate) => utils.pointInRect(x, y, candidate.rect));
      return zone ? zone.name : "Shadow Circuit";
    }
  }

  ShadowCircuit.World = World;
}());
