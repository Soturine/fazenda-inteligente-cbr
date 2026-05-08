import Phaser from "phaser";
import { mapHeight, mapWidth, tileSize } from "../data/gameData";
import type { TileType, Vector2Like, Weather } from "../types";

const blockedTiles = new Set<TileType>(["fence", "house", "tree"]);

export class FarmMap {
  readonly width = mapWidth;
  readonly height = mapHeight;
  readonly tileSize = tileSize;
  readonly assistantTile = { x: 18, y: 9 };
  readonly plantingTiles: Vector2Like[] = [];

  private readonly tiles: TileType[][] = [];

  constructor() {
    const trees = new Set(["18,2", "20,3", "3,12", "5,14", "19,14", "21,13", "12,2"]);

    for (let y = 0; y < this.height; y += 1) {
      const row: TileType[] = [];

      for (let x = 0; x < this.width; x += 1) {
        let type: TileType = "grass";

        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          type = "fence";
        }

        if (x >= 2 && x <= 5 && y >= 2 && y <= 5) {
          type = "house";
        }

        if ((x >= 6 && x <= 8 && y === 5) || (x === 8 && y >= 5 && y <= 8)) {
          type = "path";
        }

        if (x >= 9 && x <= 16 && y >= 8 && y <= 13) {
          type = "plot";
          this.plantingTiles.push({ x, y });
        }

        if (trees.has(`${x},${y}`)) {
          type = "tree";
        }

        row.push(type);
      }

      this.tiles.push(row);
    }
  }

  key(x: number, y: number): string {
    return `${x},${y}`;
  }

  getTile(x: number, y: number): TileType {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return "fence";
    }

    return this.tiles[y][x];
  }

  isBlockedTile(x: number, y: number): boolean {
    return blockedTiles.has(this.getTile(x, y));
  }

  isPlantingTile(x: number, y: number): boolean {
    return this.getTile(x, y) === "plot";
  }

  pixelToTile(x: number, y: number): Vector2Like {
    return {
      x: Math.floor(x / this.tileSize),
      y: Math.floor(y / this.tileSize),
    };
  }

  isBlockedRect(left: number, top: number, width: number, height: number): boolean {
    const points = [
      this.pixelToTile(left, top),
      this.pixelToTile(left + width, top),
      this.pixelToTile(left, top + height),
      this.pixelToTile(left + width, top + height),
    ];

    return points.some((point) => this.isBlockedTile(point.x, point.y));
  }

  render(graphics: Phaser.GameObjects.Graphics, time = 0, weather: Weather = "ensolarado"): void {
    graphics.clear();

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.drawTile(graphics, x, y, this.getTile(x, y), time, weather);
      }
    }

    this.drawHouse(graphics);
    this.drawTrees(graphics, time);
  }

  drawTileHighlight(graphics: Phaser.GameObjects.Graphics, tile: Vector2Like, color = 0xfff7dc): void {
    graphics.lineStyle(3, color, 1);
    graphics.strokeRect(tile.x * this.tileSize + 2, tile.y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4);
  }

  private drawTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, type: TileType, time: number, weather: Weather): void {
    const px = x * this.tileSize;
    const py = y * this.tileSize;

    if (type === "grass" || type === "house" || type === "tree") {
      graphics.fillStyle(this.grassTone(x, y, time, weather), 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      this.drawGrassDetails(graphics, x, y, time);
      this.drawSmallDecorations(graphics, x, y);
    }

    if (type === "path") {
      graphics.fillStyle((x + y) % 2 === 0 ? 0xc99a5a : 0xb9874f, 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      graphics.fillStyle(0x704525, 0.2);
      graphics.fillRect(px + 3, py + 23 + ((x + y) % 2), 20, 3);
      graphics.fillRect(px + 15, py + 8, 12, 3);
      graphics.fillStyle(0xf0c17b, 0.22);
      graphics.fillRect(px + 5, py + 6, 5, 2);
      graphics.fillRect(px + 22, py + 18, 4, 2);
    }

    if (type === "plot") {
      graphics.fillStyle(0x5c8e45, 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      graphics.fillStyle(0x704222, 1);
      graphics.fillRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
      graphics.fillStyle(0xa46d3d, 0.55);
      graphics.fillRect(px + 3, py + 3, this.tileSize - 6, this.tileSize - 6);
      this.drawPlotEdgeGrass(graphics, x, y);
    }

    if (type === "fence") {
      graphics.fillStyle(this.grassTone(x, y, time, weather), 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      graphics.fillStyle(0x000000, 0.14);
      graphics.fillRect(px + 5, py + 10, this.tileSize - 9, 5);
      graphics.fillRect(px + 5, py + 22, this.tileSize - 9, 5);
      graphics.fillStyle(0xa06933, 1);
      graphics.fillRect(px + 3, py + 8, this.tileSize - 6, 5);
      graphics.fillRect(px + 3, py + 20, this.tileSize - 6, 5);
      graphics.fillStyle(0x6f3f1e, 1);
      graphics.fillRect(px + 7, py + 4, 6, 25);
      graphics.fillRect(px + 21, py + 4, 6, 25);
      graphics.fillStyle(0xd09a57, 1);
      graphics.fillRect(px + 8, py + 5, 4, 4);
      graphics.fillRect(px + 22, py + 5, 4, 4);
    }
  }

  private drawGrassDetails(graphics: Phaser.GameObjects.Graphics, x: number, y: number, time: number): void {
    const seed = (x * 37 + y * 19) % 17;
    const sway = Math.sin(time / 520 + seed) > 0 ? 1 : 0;
    graphics.fillStyle(seed % 2 === 0 ? 0x347c30 : 0xffffff, seed % 2 === 0 ? 0.24 : 0.08);
    graphics.fillRect(x * this.tileSize + 7 + seed, y * this.tileSize + 8, 3, 8 + sway);
    graphics.fillRect(x * this.tileSize + 19, y * this.tileSize + 17 + (seed % 4), 3, 6 + sway);
  }

  private drawHouse(graphics: Phaser.GameObjects.Graphics): void {
    const x = 2 * this.tileSize;
    const y = 2 * this.tileSize;
    graphics.fillStyle(0x000000, 0.18);
    graphics.fillEllipse(x + 64, y + 127, 130, 18);
    graphics.fillStyle(0x8b4a2b, 1);
    graphics.fillRect(x + 4, y + 24, 4 * this.tileSize - 8, 3 * this.tileSize + 4);
    graphics.fillStyle(0xa45f38, 1);
    graphics.fillRect(x + 10, y + 32, 4 * this.tileSize - 20, 16);
    graphics.fillStyle(0xd45c3d, 1);
    graphics.fillTriangle(x - 5, y + 30, x + 2 * this.tileSize, y - 4, x + 4 * this.tileSize + 5, y + 30);
    graphics.fillStyle(0x9b3f30, 1);
    graphics.fillRect(x + 21, y + 19, 86, 8);
    graphics.fillStyle(0xffe7a3, 1);
    graphics.fillRect(x + 18, y + 50, 24, 20);
    graphics.fillRect(x + 80, y + 50, 24, 20);
    graphics.fillStyle(0x5fa8d3, 0.6);
    graphics.fillRect(x + 21, y + 53, 18, 14);
    graphics.fillRect(x + 83, y + 53, 18, 14);
    graphics.fillStyle(0x52311d, 1);
    graphics.fillRect(x + 52, y + 75, 24, 45);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(x + 70, y + 95, 3, 3);
  }

  private drawTrees(graphics: Phaser.GameObjects.Graphics, time: number): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.getTile(x, y) !== "tree") continue;
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const sway = Math.sin(time / 700 + x * 0.9 + y) * 1.5;
        graphics.fillStyle(0x000000, 0.16);
        graphics.fillEllipse(px + 16, py + 30, 26, 8);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 13, py + 17, 8, 15);
        graphics.fillStyle(0x2f7c3b, 1);
        graphics.fillRect(px + 6 + sway, py + 5, 20, 18);
        graphics.fillStyle(0x3f9a49, 1);
        graphics.fillRect(px + 2 + sway, py + 11, 28, 14);
        graphics.fillStyle(0x23632f, 1);
        graphics.fillRect(px + 9 + sway, py + 2, 15, 8);
        graphics.fillStyle(0x5bad52, 0.65);
        graphics.fillRect(px + 18 + sway, py + 8, 8, 5);
      }
    }
  }

  private grassTone(x: number, y: number, time: number, weather: Weather): number {
    const base = (x * 13 + y * 29) % 4;
    const animated = Math.sin(time / 900 + x * 0.4 + y * 0.2) > 0.65 ? 1 : 0;
    const palette = weather === "seco"
      ? [0x82a85a, 0x789e52, 0x8ab163, 0x74a051]
      : weather === "nublado"
        ? [0x68a35b, 0x629a55, 0x6aa65d, 0x5b914f]
        : [0x70b85d, 0x69ae57, 0x78bf66, 0x63a950];
    return palette[(base + animated) % palette.length];
  }

  private drawSmallDecorations(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const seed = (x * 71 + y * 43) % 31;
    const px = x * this.tileSize;
    const py = y * this.tileSize;

    if (seed === 3 || seed === 11) {
      graphics.fillStyle(0xfff0a2, 0.92);
      graphics.fillRect(px + 9, py + 20, 3, 3);
      graphics.fillStyle(0xd96b75, 0.9);
      graphics.fillRect(px + 13, py + 17, 3, 3);
    }

    if (seed === 7 || seed === 19) {
      graphics.fillStyle(0x7f8a7a, 0.85);
      graphics.fillRect(px + 18, py + 22, 6, 4);
      graphics.fillStyle(0xa8b29d, 0.6);
      graphics.fillRect(px + 19, py + 22, 3, 1);
    }

    if (seed === 23) {
      graphics.fillStyle(0x3f8d42, 0.85);
      graphics.fillRect(px + 8, py + 16, 16, 9);
      graphics.fillStyle(0x5bae58, 0.8);
      graphics.fillRect(px + 11, py + 13, 10, 6);
    }
  }

  private drawPlotEdgeGrass(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    graphics.fillStyle(0x5f9a45, 0.9);
    if ((x + y) % 2 === 0) graphics.fillRect(px, py + 3, 3, 14);
    if ((x + y) % 3 === 0) graphics.fillRect(px + this.tileSize - 3, py + 13, 3, 12);
    if ((x * y) % 4 === 0) graphics.fillRect(px + 8, py, 12, 3);
  }
}
