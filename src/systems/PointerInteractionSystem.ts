import Phaser from "phaser";
import type { Vector2Like } from "../types";
import { FarmMap } from "./FarmMap";

export class PointerInteractionSystem {
  constructor(private readonly scene: Phaser.Scene, private readonly map: FarmMap) {}

  pointerTile(pointer: Phaser.Input.Pointer): Vector2Like {
    return this.map.pixelToTile(pointer.worldX, pointer.worldY);
  }

  isInRange(playerTile: Vector2Like, targetTile: Vector2Like, range = 3): boolean {
    return Math.abs(playerTile.x - targetTile.x) + Math.abs(playerTile.y - targetTile.y) <= range;
  }

  getHoverTile(): Vector2Like | null {
    const pointer = this.scene.input.activePointer;
    if (!pointer) return null;
    const tile = this.pointerTile(pointer);
    if (tile.x < 0 || tile.y < 0 || tile.x >= this.map.width || tile.y >= this.map.height) return null;
    return tile;
  }
}
