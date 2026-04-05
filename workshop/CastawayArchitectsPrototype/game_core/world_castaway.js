// game_core/world_castaway.js
import { STARTING_ISLAND_LAYOUT } from "../data_castaway/island_blueprints.js";

export const TILE_SIZE = 40; // pixels

export const TILE_TYPES = {
  WATER: 0,
  GROUND: 1,
  SPAWN: 2,
};

export class CastawayWorld {
  constructor(layout) {
    this.layout = layout;
    this.rows = layout.length;
    this.cols = layout[0].length;
  }

  findSpawnTile() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.layout[row][col] === TILE_TYPES.SPAWN) {
          return { row, col };
        }
      }
    }
    // fallback: first ground tile if no spawn tile
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.layout[row][col] === TILE_TYPES.GROUND) {
          return { row, col };
        }
      }
    }
    // if no suitable tile, start at 0,0
    return { row: 0, col: 0 };
  }

  isWalkable(row, col) {
    if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
      return false;
    }
    const tile = this.layout[row][col];
    return tile === TILE_TYPES.GROUND || tile === TILE_TYPES.SPAWN;
  }

  draw(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const tile = this.layout[row][col];

        if (tile === TILE_TYPES.WATER) {
          ctx.fillStyle = "#0b2942"; // water
        } else if (tile === TILE_TYPES.GROUND) {
          ctx.fillStyle = "#3b6b2a"; // ground
        } else if (tile === TILE_TYPES.SPAWN) {
          ctx.fillStyle = "#4f8e3b"; // spawn tile
        } else {
          ctx.fillStyle = "#000000";
        }

        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function createStartingWorld() {
  return new CastawayWorld(STARTING_ISLAND_LAYOUT);
}
