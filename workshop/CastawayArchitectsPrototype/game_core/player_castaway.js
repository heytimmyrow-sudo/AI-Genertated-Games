// game_core/player_castaway.js
import { TILE_SIZE } from "./world_castaway.js";

export class CastawayPlayer {
  constructor(startRow, startCol) {
    this.row = startRow;
    this.col = startCol;
    this.name = "Castaway";
  }

  tryMove(deltaRow, deltaCol, world) {
    const targetRow = this.row + deltaRow;
    const targetCol = this.col + deltaCol;

    if (world.isWalkable(targetRow, targetCol)) {
      this.row = targetRow;
      this.col = targetCol;
    }
  }

  update(deltaTime) {
    // Nothing yet - later we can add animations or stats
  }

  draw(ctx) {
    const x = this.col * TILE_SIZE;
    const y = this.row * TILE_SIZE;

    ctx.fillStyle = "#f5e663"; // placeholder player color
    ctx.fillRect(
      x + TILE_SIZE * 0.15,
      y + TILE_SIZE * 0.15,
      TILE_SIZE * 0.7,
      TILE_SIZE * 0.7
    );
  }
}
