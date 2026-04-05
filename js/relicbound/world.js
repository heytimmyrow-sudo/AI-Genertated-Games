(function () {
window.Relicbound = window.Relicbound || {};

const {
  GAME_CONFIG,
  MAPS,
  Collectible,
  Enemy,
  circleIntersectsRect,
  rectsIntersect
} = window.Relicbound;

class WorldController {
  constructor() {
    this.area = null;
    this.tileSize = GAME_CONFIG.tileSize;
    this.width = 0;
    this.height = 0;
    this.enemies = [];
    this.collectibles = [];
    this.decorations = [];
    this.exits = [];
    this.shrines = [];
    this.npcs = [];
    this.merchants = [];
    this.sanctuaries = [];
    this.dungeons = [];
    this.villages = [];
    this.houses = [];
    this.craftingStations = [];
    this.resourceNodes = [];
    this.camps = [];
    this.biomes = [];
  }

  loadArea(id) {
    // Area loading rebuilds runtime entities from data so maps stay content-driven.
    const area = MAPS[id];
    this.area = area;
    this.scale = area.scale || 1;
    this.tileSize = GAME_CONFIG.tileSize * this.scale;
    this.width = area.tiles[0].length * this.tileSize;
    this.height = area.tiles.length * this.tileSize;
    this.enemies = area.enemies.map((enemy) => new Enemy(this.placeEntityOnOpenTile(this.scalePoint(enemy), 18)));
    this.collectibles = area.collectibles.map((item) => new Collectible(this.placeEntityOnOpenTile(this.scalePoint(item), 14)));
    this.exits = area.exits.map((exit) => ({
      ...exit,
      x: exit.x * this.scale,
      y: exit.y * this.scale,
      width: exit.width * this.scale,
      height: exit.height * this.scale
    }));
    this.decorations = [];
    this.shrines = [];
    this.npcs = (area.npcs || []).map((npc) => this.placeEntityOnOpenTile(this.scaleEntity(npc), 18));
    this.merchants = (area.merchants || []).map((merchant) => this.placeEntityOnOpenTile(this.scaleEntity(merchant), 18));
    this.sanctuaries = (area.sanctuaries || []).map((sanctuary) => {
      const scaled = {
        ...this.scaleEntity(sanctuary),
        radius: sanctuary.radius * this.scale
      };
      return this.placeEntityOnOpenTile(scaled, 20);
    });
    this.dungeons = (area.dungeons || []).map((dungeon) => this.placeEntityOnOpenTile(this.scaleEntity(dungeon), 20));
    this.villages = (area.villages || []).map((village) => ({
      ...village,
      x: village.x * this.scale,
      y: village.y * this.scale,
      width: village.width * this.scale,
      height: village.height * this.scale
    }));
    this.houses = (area.houses || []).map((house) => ({
      ...house,
      x: house.x * this.scale,
      y: house.y * this.scale,
      width: house.width * this.scale,
      height: house.height * this.scale
    }));
    this.craftingStations = (area.craftingStations || []).map((station) => this.placeEntityOnOpenTile(this.scaleEntity(station), 20));
    this.resourceNodes = (area.resourceNodes || []).map((node) => ({
      ...this.placeEntityOnOpenTile(this.scaleEntity(node), 20),
      remaining: node.yield
    }));
    this.camps = (area.camps || []).map((camp) => ({
      ...this.placeEntityOnOpenTile(this.scaleEntity(camp), 24),
      radius: camp.radius * this.scale
    }));
    this.biomes = (area.biomes || []).map((biome) => ({
      ...biome,
      x: biome.x * this.scale,
      y: biome.y * this.scale,
      width: biome.width * this.scale,
      height: biome.height * this.scale
    }));

    for (let row = 0; row < area.tiles.length; row += 1) {
      for (let col = 0; col < area.tiles[row].length; col += 1) {
        const tile = area.tiles[row][col];
        if (tile === "t" || tile === "R") {
          this.decorations.push({ tile, x: col * this.tileSize, y: row * this.tileSize });
        }
        if (tile === "S") {
          this.shrines.push(this.placeEntityOnOpenTile({
            x: col * this.tileSize + this.tileSize / 2,
            y: row * this.tileSize + this.tileSize / 2,
            radius: 28
          }, 18));
        }
      }
    }
  }

  getSpawnPoint(id, key) {
    const area = MAPS[id];
    const scale = area.scale || 1;
    const point = area.spawnPoints[key];
    return { x: point.x * scale, y: point.y * scale };
  }

  findNearestOpenPoint(x, y, radius) {
    if (!this.collidesCircle(x, y, radius)) {
      return { x, y };
    }

    const step = this.tileSize * 0.5;
    for (let ring = 1; ring <= 6; ring += 1) {
      for (let offsetY = -ring; offsetY <= ring; offsetY += 1) {
        for (let offsetX = -ring; offsetX <= ring; offsetX += 1) {
          const candidateX = x + offsetX * step;
          const candidateY = y + offsetY * step;
          if (!this.collidesCircle(candidateX, candidateY, radius)) {
            return { x: candidateX, y: candidateY };
          }
        }
      }
    }

    return { x, y };
  }

  isWallTile(col, row) {
    const rowData = this.area.tiles[row];
    if (!rowData) return true;
    const tile = rowData[col];
    return tile === "#" || tile === "R";
  }

  moveCircle(entity, dx, dy) {
    // Movement is resolved axis-by-axis to keep collision stable and predictable.
    const radius = entity.radius;
    const nextX = entity.x + dx;
    const nextY = entity.y + dy;

    if (!this.collidesCircle(nextX, entity.y, radius)) {
      entity.x = nextX;
    }
    if (!this.collidesCircle(entity.x, nextY, radius)) {
      entity.y = nextY;
    }
  }

  collidesCircle(x, y, radius) {
    const minCol = Math.floor((x - radius) / this.tileSize);
    const maxCol = Math.floor((x + radius) / this.tileSize);
    const minRow = Math.floor((y - radius) / this.tileSize);
    const maxRow = Math.floor((y + radius) / this.tileSize);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (this.isWallTile(col, row)) {
          const rect = {
            x: col * this.tileSize,
            y: row * this.tileSize,
            width: this.tileSize,
            height: this.tileSize
          };
          if (circleIntersectsRect({ x, y, radius }, rect)) {
            return true;
          }
        }
      }
    }
    return x - radius < 0 || y - radius < 0 || x + radius > this.width || y + radius > this.height;
  }

  update(dt) {
    for (const collectible of this.collectibles) {
      if (!collectible.taken) collectible.update(dt);
    }
  }

  scalePoint(data) {
    return {
      ...data,
      x: data.x * this.scale,
      y: data.y * this.scale
    };
  }

  scaleEntity(data) {
    return this.scalePoint(data);
  }

  placeEntityOnOpenTile(entity, radius = 16) {
    const open = this.findNearestOpenPoint(entity.x, entity.y, radius);
    return {
      ...entity,
      x: open.x,
      y: open.y
    };
  }

  getBiomeAt(x, y) {
    return this.biomes.find((biome) => (
      x >= biome.x &&
      x < biome.x + biome.width &&
      y >= biome.y &&
      y < biome.y + biome.height
    )) || null;
  }

  getAvailableExit(playerRect, flags) {
    for (const exit of this.exits) {
      if (exit.requires && !flags[exit.requires]) continue;
      if (rectsIntersect(playerRect, exit)) {
        return exit;
      }
    }
    return null;
  }
}

window.Relicbound.WorldController = WorldController;
}());
