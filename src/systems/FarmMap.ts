import Phaser from "phaser";
import { mapHeight, mapWidth, tileSize } from "../data/gameData";
import type { TileType, Vector2Like, Weather } from "../types";
import { WaterSystem } from "./WaterSystem";

const blockedTiles = new Set<TileType>(["fence", "house", "tree", "water", "shop"]);

export class FarmMap {
  readonly width = mapWidth;
  readonly height = mapHeight;
  readonly tileSize = tileSize;
  readonly assistantTile = { x: 23, y: 14 };
  readonly houseDoorTile = { x: 6, y: 9 };
  readonly shopDoorTile = { x: 32, y: 10 };
  readonly sellBoxTile = { x: 9, y: 9 };
  readonly plantingTiles: Vector2Like[] = [];

  private readonly tiles: TileType[][] = [];

  constructor() {
    const trees = new Set([
      "3,5", "4,6", "10,4", "16,5", "22,4", "39,5", "40,7",
      "4,23", "7,26", "12,25", "17,28", "25,26", "35,28", "39,25",
      "30,3", "36,14", "41,18", "2,15",
    ]);

    for (let y = 0; y < this.height; y += 1) {
      const row: TileType[] = [];

      for (let x = 0; x < this.width; x += 1) {
        let type: TileType = "grass";

        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) type = "fence";
        if (WaterSystem.isLakeTile(x, y)) type = "water";
        if (this.isHouseArea(x, y)) type = "house";
        if (this.isShopArea(x, y)) type = "shop";
        if (this.isPathTile(x, y)) type = "path";
        if (x >= 13 && x <= 22 && y >= 12 && y <= 19) {
          type = "plot";
          this.plantingTiles.push({ x, y });
        }
        if (x === this.sellBoxTile.x && y === this.sellBoxTile.y) type = "sellBox";
        if (trees.has(`${x},${y}`)) type = "tree";

        row.push(type);
      }

      this.tiles.push(row);
    }

    this.tiles[this.houseDoorTile.y][this.houseDoorTile.x] = "path";
    this.tiles[this.shopDoorTile.y][this.shopDoorTile.x] = "path";
  }

  key(x: number, y: number): string {
    return `${x},${y}`;
  }

  getTile(x: number, y: number): TileType {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return "fence";
    return this.tiles[y][x];
  }

  isBlockedTile(x: number, y: number): boolean {
    return blockedTiles.has(this.getTile(x, y));
  }

  isPlantingTile(x: number, y: number): boolean {
    return this.getTile(x, y) === "plot";
  }

  isWaterTile(x: number, y: number): boolean {
    return this.getTile(x, y) === "water";
  }

  isNearWater(tile: Vector2Like): boolean {
    return WaterSystem.isNearWater(tile);
  }

  isNearShop(tile: Vector2Like): boolean {
    return Math.abs(tile.x - this.shopDoorTile.x) <= 1 && Math.abs(tile.y - this.shopDoorTile.y) <= 1;
  }

  isNearHouseDoor(tile: Vector2Like): boolean {
    return Math.abs(tile.x - this.houseDoorTile.x) <= 1 && Math.abs(tile.y - this.houseDoorTile.y) <= 1;
  }

  isNearSellBox(tile: Vector2Like): boolean {
    return Math.abs(tile.x - this.sellBoxTile.x) <= 1 && Math.abs(tile.y - this.sellBoxTile.y) <= 1;
  }

  pixelToTile(x: number, y: number): Vector2Like {
    return { x: Math.floor(x / this.tileSize), y: Math.floor(y / this.tileSize) };
  }

  tileToPixel(tile: Vector2Like): Vector2Like {
    return { x: tile.x * this.tileSize + this.tileSize / 2, y: tile.y * this.tileSize + this.tileSize / 2 };
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
    this.drawShop(graphics);
    this.drawSellBox(graphics);
    this.drawTrees(graphics, time, weather);
    this.drawSignposts(graphics);
  }

  drawTileHighlight(graphics: Phaser.GameObjects.Graphics, tile: Vector2Like, color = 0xfff7dc): void {
    graphics.lineStyle(3, color, 1);
    graphics.strokeRect(tile.x * this.tileSize + 2, tile.y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4);
  }

  private drawTile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, type: TileType, time: number, weather: Weather): void {
    const px = x * this.tileSize;
    const py = y * this.tileSize;

    if (type === "water") {
      WaterSystem.drawWaterTile(graphics, x, y, this.tileSize, time, weather);
      return;
    }

    if (type === "grass" || type === "house" || type === "tree" || type === "shop" || type === "sellBox") {
      graphics.fillStyle(this.grassTone(x, y, time, weather), 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      this.drawGrassDetails(graphics, x, y, time, weather);
      this.drawSmallDecorations(graphics, x, y);
    }

    if (type === "path") {
      graphics.fillStyle((x + y) % 2 === 0 ? 0xc99a5a : 0xb9874f, 1);
      graphics.fillRect(px, py, this.tileSize, this.tileSize);
      graphics.fillStyle(0x704525, 0.2);
      graphics.fillRect(px + 3, py + 23 + ((x + y) % 2), 22, 3);
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
      const shade = (x * 5 + y * 7) % 3;
      graphics.fillStyle(0x000000, 0.14);
      graphics.fillRect(px + 5, py + 11, this.tileSize - 9, 5);
      graphics.fillRect(px + 5, py + 23, this.tileSize - 9, 5);
      graphics.fillStyle(shade === 0 ? 0xa06933 : 0x8d5627, 1);
      graphics.fillRect(px + 3, py + 8, this.tileSize - 6, 5);
      graphics.fillRect(px + 3, py + 20, this.tileSize - 6, 5);
      graphics.fillStyle(0x6f3f1e, 1);
      graphics.fillRect(px + 7, py + 4, 6, 25);
      graphics.fillRect(px + 21, py + 4, 6, 25);
      if ((x + y) % 7 === 0) {
        graphics.fillStyle(0xf4cc58, 0.85);
        graphics.fillRect(px + 13, py + 14, 6, 3);
      }
    }
  }

  private drawGrassDetails(graphics: Phaser.GameObjects.Graphics, x: number, y: number, time: number, weather: Weather): void {
    const seed = (x * 37 + y * 19) % 17;
    const wind = weather === "chuvoso" || weather === "nublado" ? 2 : weather === "seco" ? 1.4 : 0.8;
    const sway = Math.sin(time / 520 + seed) * wind;
    graphics.fillStyle(seed % 2 === 0 ? 0x347c30 : 0xffffff, seed % 2 === 0 ? 0.24 : 0.08);
    graphics.fillRect(x * this.tileSize + 7 + seed + sway, y * this.tileSize + 8, 3, 8);
    graphics.fillRect(x * this.tileSize + 19 + sway, y * this.tileSize + 17 + (seed % 4), 3, 6);
  }

  private drawHouse(graphics: Phaser.GameObjects.Graphics): void {
    const x = 3 * this.tileSize;
    const y = 4 * this.tileSize;
    graphics.fillStyle(0x000000, 0.18);
    graphics.fillEllipse(x + 72, y + 145, 150, 22);
    graphics.fillStyle(0x8b4a2b, 1);
    graphics.fillRoundedRect(x + 4, y + 32, 5 * this.tileSize - 8, 3 * this.tileSize + 18, 4);
    graphics.fillStyle(0xa45f38, 1);
    graphics.fillRect(x + 13, y + 42, 5 * this.tileSize - 26, 18);
    graphics.fillStyle(0xd45c3d, 1);
    graphics.fillTriangle(x - 8, y + 38, x + 2.5 * this.tileSize, y - 8, x + 5 * this.tileSize + 8, y + 38);
    graphics.fillStyle(0x9b3f30, 1);
    graphics.fillRect(x + 20, y + 25, 120, 9);
    graphics.fillStyle(0x6f3f1e, 1);
    graphics.fillRect(x + 105, y + 2, 16, 28);
    graphics.fillStyle(0xffe7a3, 1);
    graphics.fillRect(x + 20, y + 66, 24, 20);
    graphics.fillRect(x + 104, y + 66, 24, 20);
    graphics.fillStyle(0x5fa8d3, 0.62);
    graphics.fillRect(x + 23, y + 69, 18, 14);
    graphics.fillRect(x + 107, y + 69, 18, 14);
    graphics.fillStyle(0x52311d, 1);
    graphics.fillRect(x + 62, y + 91, 28, 55);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(x + 82, y + 116, 3, 3);
    graphics.fillStyle(0xd96b75, 1);
    graphics.fillRect(x + 38, y + 123, 6, 6);
    graphics.fillRect(x + 101, y + 123, 6, 6);
    graphics.fillStyle(0x4f9143, 1);
    graphics.fillRect(x + 33, y + 129, 18, 7);
    graphics.fillRect(x + 96, y + 129, 18, 7);
    graphics.fillStyle(0xa06933, 1);
    graphics.fillRect(x + 150, y + 106, 16, 14);
    graphics.fillStyle(0xfff7dc, 1);
    graphics.fillRect(x + 153, y + 109, 10, 3);
  }

  private drawShop(graphics: Phaser.GameObjects.Graphics): void {
    const x = 29 * this.tileSize;
    const y = 6 * this.tileSize;
    graphics.fillStyle(0x000000, 0.16);
    graphics.fillEllipse(x + 72, y + 112, 145, 18);
    graphics.fillStyle(0xc99a5a, 1);
    graphics.fillRoundedRect(x + 5, y + 34, 5 * this.tileSize - 10, 78, 5);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(x + 15, y + 53, 130, 20);
    graphics.fillStyle(0xb95234, 1);
    graphics.fillTriangle(x - 5, y + 42, x + 80, y + 2, x + 165, y + 42);
    graphics.fillStyle(0x7c4a25, 1);
    graphics.fillRect(x + 12, y + 104, 136, 16);
    graphics.fillStyle(0xfff7dc, 1);
    graphics.fillRect(x + 45, y + 14, 70, 20);
    graphics.fillStyle(0x623819, 1);
    graphics.fillRect(x + 53, y + 20, 54, 6);
    graphics.fillStyle(0x3f9a49, 1);
    graphics.fillCircle(x + 46, y + 96, 6);
    graphics.fillStyle(0xe85b75, 1);
    graphics.fillCircle(x + 65, y + 94, 6);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(x + 88, y + 90, 12, 18);
  }

  private drawSellBox(graphics: Phaser.GameObjects.Graphics): void {
    const px = this.sellBoxTile.x * this.tileSize;
    const py = this.sellBoxTile.y * this.tileSize;
    graphics.fillStyle(0x000000, 0.16);
    graphics.fillEllipse(px + 16, py + 28, 24, 7);
    graphics.fillStyle(0x8d5627, 1);
    graphics.fillRoundedRect(px + 4, py + 8, 24, 20, 3);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(px + 9, py + 12, 14, 4);
    graphics.fillStyle(0x52311d, 1);
    graphics.fillRect(px + 7, py + 18, 18, 3);
  }

  private drawTrees(graphics: Phaser.GameObjects.Graphics, time: number, weather: Weather): void {
    const wind = weather === "chuvoso" || weather === "nublado" ? 3.2 : weather === "seco" ? 2.2 : 1.4;
    const leafColor = weather === "seco" ? 0x6f9d48 : 0x2f7c3b;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.getTile(x, y) !== "tree") continue;
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const sway = Math.sin(time / 700 + x * 0.9 + y) * wind;
        graphics.fillStyle(0x000000, 0.18);
        graphics.fillEllipse(px + 17, py + 31, 34, 10);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 12, py + 13, 10, 20);
        graphics.fillStyle(leafColor, 1);
        graphics.fillEllipse(px + 16 + sway, py + 10, 29, 22);
        graphics.fillStyle(weather === "seco" ? 0x88b65a : 0x3f9a49, 1);
        graphics.fillEllipse(px + 7 + sway, py + 17, 27, 20);
        graphics.fillEllipse(px + 25 + sway, py + 17, 27, 20);
        graphics.fillStyle(0x23632f, weather === "seco" ? 0.55 : 0.9);
        graphics.fillEllipse(px + 16 + sway, py + 3, 20, 14);
        graphics.fillStyle(0x5bad52, 0.65);
        graphics.fillEllipse(px + 23 + sway, py + 12, 12, 8);
      }
    }
  }

  private drawSignposts(graphics: Phaser.GameObjects.Graphics): void {
    const signs = [
      { x: 11, y: 11, w: 32, label: 0x4f3520 },
      { x: 28, y: 11, w: 48, label: 0x623819 },
      { x: 25, y: 21, w: 42, label: 0x2f6e8d },
    ];

    signs.forEach((sign) => {
      const px = sign.x * this.tileSize;
      const py = sign.y * this.tileSize;
      graphics.fillStyle(0x6f3f1e, 1);
      graphics.fillRect(px + 14, py + 14, 4, 18);
      graphics.fillStyle(0xf4cc58, 1);
      graphics.fillRoundedRect(px + 2, py + 4, sign.w, 14, 2);
      graphics.fillStyle(sign.label, 1);
      graphics.fillRect(px + 8, py + 9, sign.w - 12, 3);
    });
  }

  private grassTone(x: number, y: number, time: number, weather: Weather): number {
    const base = (x * 13 + y * 29) % 4;
    const animated = Math.sin(time / 1400 + x * 0.4 + y * 0.2) > 0.65 ? 1 : 0;
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

    if (seed === 3 || seed === 11 || seed === 21) {
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

    if (seed === 23 || seed === 29) {
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

  private isHouseArea(x: number, y: number): boolean {
    return x >= 3 && x <= 7 && y >= 4 && y <= 8;
  }

  private isShopArea(x: number, y: number): boolean {
    return x >= 29 && x <= 33 && y >= 6 && y <= 9;
  }

  private isPathTile(x: number, y: number): boolean {
    return (x >= 6 && x <= 28 && y === 10)
      || (x === 12 && y >= 10 && y <= 20)
      || (x >= 23 && x <= 32 && y === 20)
      || (x === 32 && y >= 10 && y <= 22)
      || (x >= 6 && x <= 12 && y === 9);
  }
}
