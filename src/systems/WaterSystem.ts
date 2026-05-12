import Phaser from "phaser";
import type { Vector2Like, Weather } from "../types";

export class WaterSystem {
  static readonly center = { x: 32, y: 23 };
  static readonly radius = { x: 7.5, y: 4.4 };
  private static readonly lilies = [
    { x: 26, y: 23, ox: 23, oy: 11, size: 1.18, phase: 0.2 },
    { x: 28, y: 21, ox: 12, oy: 24, size: 0.62, phase: 1.1 },
    { x: 29, y: 25, ox: 24, oy: 8, size: 0.78, phase: 1.4 },
    { x: 31, y: 24, ox: 7, oy: 20, size: 1.32, phase: 2.8 },
    { x: 33, y: 26, ox: 18, oy: 10, size: 0.9, phase: 4.1 },
    { x: 35, y: 22, ox: 23, oy: 18, size: 1.08, phase: 3.3 },
    { x: 36, y: 25, ox: 8, oy: 7, size: 0.54, phase: 5.8 },
    { x: 37, y: 23, ox: 9, oy: 13, size: 0.72, phase: 5.2 },
    { x: 32, y: 27, ox: 12, oy: 18, size: 0.58, phase: 2.1 },
  ];

  static isLakeTile(x: number, y: number): boolean {
    const dx = (x - this.center.x) / this.radius.x;
    const dy = (y - this.center.y) / this.radius.y;
    return dx * dx + dy * dy <= 1;
  }

  static isNearWater(tile: Vector2Like): boolean {
    for (let y = tile.y - 1; y <= tile.y + 1; y += 1) {
      for (let x = tile.x - 1; x <= tile.x + 1; x += 1) {
        if (this.isLakeTile(x, y)) return true;
      }
    }
    return false;
  }

  static nearestWaterTile(tile: Vector2Like): Vector2Like | null {
    let best: Vector2Like | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let y = tile.y - 3; y <= tile.y + 3; y += 1) {
      for (let x = tile.x - 3; x <= tile.x + 3; x += 1) {
        if (!this.isLakeTile(x, y)) continue;
        const distance = Math.abs(tile.x - x) + Math.abs(tile.y - y);
        if (distance < bestDistance) {
          best = { x, y };
          bestDistance = distance;
        }
      }
    }

    return best;
  }

  static drawWaterTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, tileSize: number, time: number, weather: Weather): void {
    const px = x * tileSize;
    const py = y * tileSize;
    const wind = weather === "chuvoso" ? 2.35 : weather === "nublado" ? 1.28 : weather === "seco" ? 0.82 : 1;
    const pulse = Math.sin(time / 720 + x * 0.7 + y * 0.3) * 0.07 * wind;
    const wave = Math.sin(time / (weather === "chuvoso" ? 360 : 520) + x * 0.9 + y * 0.25) * 3 * wind;
    const color = weather === "chuvoso" ? 0x4a8db2 : weather === "seco" ? 0x4f9fc2 : 0x5fa8d3;

    graphics.fillStyle(0x2f6e8d, 1);
    graphics.fillRect(px, py, tileSize, tileSize);
    graphics.fillStyle(color, 0.92 + pulse);
    graphics.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
    graphics.fillStyle(0xb8efff, 0.22 + pulse);
    graphics.fillRect(px + 4 + wave, py + 8 + ((x + y) % 3), 16, 2);
    graphics.fillRect(px + 12 - wave * 0.6, py + 21, 13, 2);

    if ((x * 17 + y * 9 + Math.floor(time / 520)) % 19 === 0) {
      graphics.fillStyle(0xeef8ff, 0.45);
      graphics.fillCircle(px + 8 + ((x + y) % 15), py + 8 + ((x * y) % 17), 2);
      graphics.fillCircle(px + 15, py + 19, 1.5);
    }

    if ((x * 5 + y * 11 + Math.floor(time / 900)) % 37 === 0) {
      graphics.fillStyle(0x2f6e8d, 0.24);
      graphics.fillEllipse(px + 14 + wave, py + 17, 22, 6);
    }

    this.drawLilies(graphics, x, y, tileSize, time, weather);
  }

  private static drawLilies(graphics: Phaser.GameObjects.Graphics, x: number, y: number, tileSize: number, time: number, weather: Weather): void {
    const px = x * tileSize;
    const py = y * tileSize;
    this.lilies.filter((lily) => lily.x === x && lily.y === y).forEach((lily) => {
      const wind = weather === "chuvoso" ? 2.45 : weather === "nublado" ? 1.34 : 1;
      const driftX = Math.sin(time / 1050 + lily.phase) * 2.1 * wind;
      const driftY = Math.cos(time / 1320 + lily.phase) * 1.2 * wind;
      const cx = px + lily.ox + driftX;
      const cy = py + lily.oy + driftY;
      graphics.fillStyle(0x8fd460, 0.82);
      graphics.fillEllipse(cx, cy, 16 * lily.size, 9 * lily.size);
      graphics.fillStyle(0x4f9143, 0.78);
      graphics.fillTriangle(cx, cy, cx + 7 * lily.size, cy - 4 * lily.size, cx + 6 * lily.size, cy + 4 * lily.size);
      graphics.fillStyle(0xfff7dc, 0.86);
      graphics.fillCircle(cx + 1 * lily.size, cy - 3 * lily.size, 2.2 * lily.size);
    });
  }
}
