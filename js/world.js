import { Enemy } from "./enemy.js";
import { Player } from "./player.js";

export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clonePointList(items) {
  return items.map((item) => ({ ...item }));
}

export function createWorld(level) {
  return {
    name: level.name,
    objective: level.objective,
    bounds: { ...level.world },
    player: new Player(level.playerStart.x, level.playerStart.y),
    walls: clonePointList(level.walls),
    enemies: level.enemies.map((enemy) => new Enemy(enemy)),
    crystals: clonePointList(level.crystals),
    keyFragments: clonePointList(level.keyFragments ?? []),
    switches: clonePointList(level.switches),
    gates: clonePointList(level.gates),
    shrine: { ...level.shrine },
    lamp: { ...level.lamp },
    completed: false
  };
}

export function getSolidBodies(world) {
  return [...world.walls, ...world.gates.filter((gate) => !gate.open)];
}
