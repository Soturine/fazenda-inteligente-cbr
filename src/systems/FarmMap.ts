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
  readonly vendorTile = { x: 32, y: 9 };
  readonly sellBoxTile = { x: 9, y: 9 };
  readonly tutorialSignTile = { x: 11, y: 11 };
  readonly shopSignTile = { x: 28, y: 11 };
  readonly cropStatsSignTile = { x: 27, y: 8 };
  readonly lakeSignTile = { x: 25, y: 21 };
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
        if (this.isBridgeTile(x, y)) type = "bridge";
        if (x >= 13 && x <= 22 && y >= 12 && y <= 19) {
          type = "plot";
          this.plantingTiles.push({ x, y });
        }
        if (x === this.sellBoxTile.x && y === this.sellBoxTile.y) type = "sellBox";
        if (trees.has(`${x},${y}`) && type === "grass") type = "tree";

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

  getSignKind(tile: Vector2Like): "tutorial" | "shop" | "stats" | "lake" | null {
    if (Math.abs(tile.x - this.tutorialSignTile.x) <= 1 && Math.abs(tile.y - this.tutorialSignTile.y) <= 1) return "tutorial";
    if (Math.abs(tile.x - this.cropStatsSignTile.x) <= 1 && Math.abs(tile.y - this.cropStatsSignTile.y) <= 1) return "stats";
    if (Math.abs(tile.x - this.shopSignTile.x) <= 1 && Math.abs(tile.y - this.shopSignTile.y) <= 1) return "shop";
    if (Math.abs(tile.x - this.lakeSignTile.x) <= 1 && Math.abs(tile.y - this.lakeSignTile.y) <= 1) return "lake";
    return null;
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

    this.drawTrees(graphics, time, weather);
    this.drawHouse(graphics);
    this.drawShop(graphics);
    this.drawSellBox(graphics);
    this.drawVendor(graphics, time);
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
      this.drawSmallDecorations(graphics, x, y, time, weather);
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

    if (type === "bridge") {
      if (WaterSystem.isLakeTile(x, y)) {
        WaterSystem.drawWaterTile(graphics, x, y, this.tileSize, time, weather);
      } else {
        graphics.fillStyle((x + y) % 2 === 0 ? 0xc99a5a : 0xb9874f, 1);
        graphics.fillRect(px, py, this.tileSize, this.tileSize);
      }

      graphics.fillStyle(0x000000, 0.16);
      graphics.fillRect(px + 1, py + 20, this.tileSize - 2, 5);
      graphics.fillStyle(0x8d5627, 1);
      graphics.fillRect(px + 1, py + 8, this.tileSize - 2, 7);
      graphics.fillRect(px + 1, py + 21, this.tileSize - 2, 7);
      graphics.fillStyle(0xb9874f, 1);
      graphics.fillRect(px + 3, py + 9, this.tileSize - 6, 3);
      graphics.fillRect(px + 3, py + 22, this.tileSize - 6, 3);
      graphics.fillStyle(0x623819, 0.42);
      graphics.fillRect(px + 8, py + 5, 4, this.tileSize - 7);
      graphics.fillRect(px + 21, py + 5, 4, this.tileSize - 7);
      graphics.fillStyle(0xffdf92, 0.32);
      graphics.fillRect(px + 5, py + 11, 8, 2);
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
      const edgeLeft = x === 0;
      const edgeRight = x === this.width - 1;
      const edgeTop = y === 0;
      const edgeBottom = y === this.height - 1;
      const isVertical = edgeLeft || edgeRight;
      const isHorizontal = edgeTop || edgeBottom;
      const isCorner = (edgeLeft || edgeRight) && (edgeTop || edgeBottom);

      graphics.fillStyle(0x000000, 0.14);
      if (isCorner) {
        graphics.fillRect(px + 8, py + 8, 18, 18);
      } else if (isVertical) {
        graphics.fillRect(px + 10, py + 3, 6, this.tileSize - 6);
        graphics.fillRect(px + 22, py + 3, 6, this.tileSize - 6);
      } else {
        graphics.fillRect(px + 4, py + 10, this.tileSize - 8, 6);
        graphics.fillRect(px + 4, py + 22, this.tileSize - 8, 6);
      }

      graphics.fillStyle(shade === 0 ? 0xa06933 : 0x8d5627, 1);
      if (isCorner) {
        graphics.fillRoundedRect(px + 8, py + 8, 17, 17, 3);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 12, py + 4, 9, 25);
        graphics.fillRect(px + 4, py + 12, 25, 9);
      } else if (isVertical) {
        graphics.fillRect(px + 9, py + 4, 6, this.tileSize - 8);
        graphics.fillRect(px + 21, py + 4, 6, this.tileSize - 8);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 7, py + 7, 22, 5);
        graphics.fillRect(px + 7, py + 20, 22, 5);
      } else {
        graphics.fillRect(px + 3, py + 8, this.tileSize - 6, 5);
        graphics.fillRect(px + 3, py + 20, this.tileSize - 6, 5);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 7, py + 5, 6, 24);
        graphics.fillRect(px + 21, py + 5, 6, 24);
      }

      if ((x + y) % 7 === 0 && !isCorner) {
        graphics.fillStyle(0xf4cc58, 0.85);
        graphics.fillRect(px + 13, py + 14, 6, 3);
      }

      if (isHorizontal && x === 6 && y === 0) {
        graphics.fillStyle(0x7a4a24, 1);
        graphics.fillRect(px + 2, py + 9, 28, 13);
        graphics.fillStyle(0xf4cc58, 1);
        graphics.fillRect(px + 14, py + 11, 4, 9);
      }
    }
  }

  private drawGrassDetails(graphics: Phaser.GameObjects.Graphics, x: number, y: number, time: number, weather: Weather): void {
    const seed = (x * 37 + y * 19) % 97;
    const wind = weather === "chuvoso" ? 3.4 : weather === "nublado" ? 2.1 : weather === "seco" ? 1.1 : 0.75;
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    const clumpCount = seed % 3 === 0 ? 3 : seed % 4 === 0 ? 2 : 1;

    for (let i = 0; i < clumpCount; i += 1) {
      const localSeed = seed + i * 23;
      const sway = Math.sin(time / (650 + localSeed * 3) + localSeed) * wind;
      const bladeHeight = 4 + (localSeed % 6);
      const bladeX = 4 + ((localSeed * 7) % 23);
      const bladeY = 6 + ((localSeed * 11) % 19);
      graphics.fillStyle(localSeed % 2 === 0 ? 0x347c30 : 0x5bae58, localSeed % 2 === 0 ? 0.28 : 0.2);
      graphics.fillRect(px + bladeX + sway, py + bladeY, 2, bladeHeight);
      if (localSeed % 5 === 0) graphics.fillRect(px + bladeX + 4 - sway * 0.4, py + bladeY + 2, 2, Math.max(3, bladeHeight - 2));
    }
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
    graphics.fillRect(x + 55, y + 29, 50, 3);
    graphics.fillStyle(0xf4cc58, 0.8);
    graphics.fillRect(x + 51, y + 17, 58, 2);
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
    graphics.fillStyle(0xfff7dc, 1);
    graphics.fillRect(px - 8, py + 1, 48, 8);
    graphics.fillStyle(0x623819, 1);
    graphics.fillRect(px - 3, py + 4, 38, 2);
  }

  private drawVendor(graphics: Phaser.GameObjects.Graphics, time: number): void {
    const px = this.vendorTile.x * this.tileSize + this.tileSize / 2;
    const py = this.vendorTile.y * this.tileSize + 8;
    const bob = Math.sin(time / 620) * 1.2;
    const blink = time % 4300 > 4140;
    graphics.fillStyle(0x000000, 0.18);
    graphics.fillEllipse(px, py + 18, 24, 7);
    graphics.fillStyle(0x7c4a25, 1);
    graphics.fillRect(px - 18, py + 8, 36, 13);
    graphics.fillStyle(0xb95234, 1);
    graphics.fillRoundedRect(px - 9, py - 1 + bob, 18, 20, 3);
    graphics.fillStyle(0xfff7dc, 1);
    graphics.fillRect(px - 5, py + 2 + bob, 10, 5);
    graphics.fillStyle(0xf1b77a, 1);
    graphics.fillRoundedRect(px - 7, py - 16 + bob, 14, 12, 3);
    graphics.fillStyle(0x7a4a24, 1);
    graphics.fillRect(px - 9, py - 21 + bob, 18, 5);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillRect(px - 12, py - 24 + bob, 24, 4);
    graphics.fillRect(px - 7, py - 29 + bob, 14, 6);
    graphics.fillStyle(0x263027, 1);
    graphics.fillRect(px - 4, py - 12 + bob, 2, blink ? 1 : 2);
    graphics.fillRect(px + 3, py - 12 + bob, 2, blink ? 1 : 2);
    graphics.fillStyle(0x7a3f2c, 1);
    graphics.fillRect(px - 3, py - 8 + bob, 6, 2);
  }

  private drawTrees(graphics: Phaser.GameObjects.Graphics, time: number, weather: Weather): void {
    const wind = weather === "chuvoso" ? 5 : weather === "nublado" ? 3 : weather === "seco" ? 1.8 : 1.15;
    const leafColor = weather === "seco" ? 0x6f9d48 : 0x2f7c3b;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.getTile(x, y) !== "tree") continue;
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const seed = (x * 17 + y * 31) % 5;
        const sway = Math.sin(time / (760 + seed * 95) + x * 0.9 + y) * wind;
        const heightBoost = seed === 3 ? -8 : seed === 1 ? 4 : 0;
        graphics.fillStyle(0x000000, 0.18);
        graphics.fillEllipse(px + 17, py + 31, seed === 3 ? 28 : 38, 10);
        graphics.fillStyle(0x6f3f1e, 1);
        graphics.fillRect(px + 12, py + 12 + heightBoost * 0.25, 10, 21 - heightBoost * 0.25);

        if (seed === 3) {
          graphics.fillStyle(weather === "seco" ? 0x738b49 : 0x2f6e45, 1);
          graphics.fillTriangle(px + 16 + sway, py - 13, px + 2 + sway * 0.4, py + 16, px + 30 + sway * 0.4, py + 16);
          graphics.fillStyle(weather === "seco" ? 0x8da75a : 0x3f8d52, 1);
          graphics.fillTriangle(px + 16 + sway * 0.8, py - 2, px + 4, py + 24, px + 28, py + 24);
        } else if (seed === 2) {
          graphics.fillStyle(weather === "seco" ? 0xa5a65e : 0x3f9a49, 1);
          graphics.fillEllipse(px + 16 + sway, py + 9, 34, 26);
          graphics.fillStyle(0xd96b75, weather === "seco" ? 0.35 : 0.78);
          graphics.fillCircle(px + 8 + sway * 0.7, py + 12, 3);
          graphics.fillCircle(px + 23 + sway * 0.7, py + 17, 3);
          graphics.fillStyle(weather === "seco" ? 0x8f9c55 : 0x2f7c3b, 0.9);
          graphics.fillEllipse(px + 17 + sway * 0.6, py + 0, 22, 16);
        } else if (seed === 1) {
          graphics.fillStyle(weather === "seco" ? 0x88a75a : 0x4f9143, 1);
          graphics.fillEllipse(px + 16 + sway, py + 8, 38, 24);
          graphics.fillStyle(weather === "seco" ? 0x9ab867 : 0x5bae58, 0.95);
          graphics.fillEllipse(px + 7 + sway * 0.6, py + 17, 26, 20);
          graphics.fillEllipse(px + 25 + sway * 0.7, py + 17, 26, 20);
        } else {
          graphics.fillStyle(leafColor, 1);
          graphics.fillEllipse(px + 16 + sway, py + 10, 29, 22);
          graphics.fillStyle(weather === "seco" ? 0x88b65a : 0x3f9a49, 1);
          graphics.fillEllipse(px + 7 + sway * 0.8, py + 17, 27, 20);
          graphics.fillEllipse(px + 25 + sway * 0.7, py + 17, 27, 20);
          graphics.fillStyle(0x23632f, weather === "seco" ? 0.55 : 0.9);
          graphics.fillEllipse(px + 16 + sway, py + 3, 20, 14);
        }

        graphics.fillStyle(0x5bad52, weather === "seco" ? 0.28 : 0.55);
        graphics.fillEllipse(px + 23 + sway * 0.8, py + 12, 12, 8);
      }
    }
  }

  private drawSignposts(graphics: Phaser.GameObjects.Graphics): void {
    const signs = [
      { x: 11, y: 11, w: 32, label: 0x4f3520 },
      { x: 27, y: 8, w: 38, label: 0x3f8d52 },
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
      graphics.fillStyle(0xfff7dc, 1);
      graphics.fillCircle(px + sign.w - 5, py + 11, 3);
    });
  }

  private grassTone(x: number, y: number, time: number, weather: Weather): number {
    const base = (x * 13 + y * 29) % 4;
    const palette = weather === "seco"
      ? [0x82a85a, 0x789e52, 0x8ab163, 0x74a051]
      : weather === "nublado"
        ? [0x68a35b, 0x629a55, 0x6aa65d, 0x5b914f]
        : [0x70b85d, 0x69ae57, 0x78bf66, 0x63a950];
    const wind = weather === "chuvoso" ? 1 : weather === "nublado" ? 0.72 : weather === "seco" ? 0.42 : 0.34;
    const wave = Math.sin(time / 850 + x * 0.63 + y * 0.41) * wind;
    const color = Phaser.Display.Color.ValueToColor(palette[base % palette.length]);
    const shifted = wave >= 0
      ? color.brighten(Math.round(wave * 8))
      : color.darken(Math.round(Math.abs(wave) * 7));
    return shifted.color;
  }

  private drawSmallDecorations(graphics: Phaser.GameObjects.Graphics, x: number, y: number, time: number, weather: Weather): void {
    const seed = (x * 71 + y * 43) % 101;
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    const wind = weather === "chuvoso" ? 2.2 : weather === "nublado" ? 1.4 : weather === "seco" ? 0.8 : 0.55;
    const sway = Math.sin(time / (760 + seed * 4) + seed) * wind;

    if ([3, 11, 21, 44, 68, 87].includes(seed)) {
      const colors = [0xfff0a2, 0xd96b75, 0x8d5fb8, 0x5fa8d3];
      const color = colors[seed % colors.length];
      const ox = 5 + (seed * 3) % 20;
      const oy = 8 + (seed * 7) % 17;
      graphics.fillStyle(0x3f9a49, 0.82);
      graphics.fillRect(px + ox + sway * 0.35, py + oy + 3, 2, 5);
      graphics.fillStyle(color, 0.92);
      graphics.fillCircle(px + ox + 1 + sway, py + oy + 2, 2 + (seed % 2));
      if (seed % 3 === 0) {
        graphics.fillStyle(0xfff7dc, 0.88);
        graphics.fillCircle(px + ox + 5 - sway * 0.6, py + oy + 4, 1.5);
      }
    }

    if ([7, 19, 51, 79].includes(seed)) {
      graphics.fillStyle(0x7f8a7a, 0.85);
      graphics.fillRoundedRect(px + 5 + (seed % 17), py + 16 + (seed % 9), 5 + (seed % 4), 4, 2);
      graphics.fillStyle(0xa8b29d, 0.6);
      graphics.fillRect(px + 6 + (seed % 17), py + 17 + (seed % 9), 3, 1);
    }

    if ([23, 29, 37, 62, 94].includes(seed)) {
      graphics.fillStyle(0x3f8d42, 0.85);
      graphics.fillEllipse(px + 10 + (seed % 14) + sway * 0.35, py + 16 + (seed % 10), 13 + (seed % 7), 8 + (seed % 4));
      graphics.fillStyle(0x5bae58, 0.8);
      graphics.fillEllipse(px + 13 + (seed % 12) + sway * 0.55, py + 13 + (seed % 9), 8 + (seed % 5), 5);
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
    return (x >= 6 && x <= 32 && y === 10)
      || (x >= 6 && x <= 32 && y === 11 && x % 2 === 0)
      || (x === 12 && y >= 10 && y <= 20)
      || (x === 13 && y >= 12 && y <= 19)
      || (x >= 23 && x <= 32 && y === 20)
      || (x === 32 && y >= 10 && y <= 22)
      || (x >= 6 && x <= 12 && y === 9)
      || (x >= 9 && x <= 12 && y === 11)
      || (x >= 25 && x <= 32 && y === 22)
      || (x >= 9 && x <= 12 && y === 8)
      || (x === 9 && y >= 8 && y <= 11)
      || (x >= 25 && x <= 28 && y === 11);
  }

  private isBridgeTile(x: number, y: number): boolean {
    return (x === 32 && y >= 20 && y <= 22)
      || (y === 22 && x >= 25 && x <= 32);
  }
}
