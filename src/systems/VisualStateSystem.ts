import Phaser from "phaser";
import type { CropPlotState, Health, Moisture, Soil } from "../types";

const moistureColors: Record<Moisture, number> = {
  baixa: 0xb97845,
  media: 0x8e5b31,
  alta: 0x583a28,
};

const soilColors: Record<Soil, number> = {
  normal: 0x8e5b31,
  seco: 0xc1844f,
  encharcado: 0x3c3029,
  pobre: 0x8a7245,
};

const healthColors: Record<Health, number> = {
  saudavel: 0x3fa44c,
  amarelada: 0xd7c84e,
  murcha: 0x78994a,
  com_manchas: 0x4d8d45,
};

function variant(seed: number, salt: number, range: number): number {
  const raw = Math.sin((seed + salt) * 12.9898) * 43758.5453;
  return Math.floor((raw - Math.floor(raw)) * range);
}

function wave(time: number, seed: number, amount = 1): number {
  return Math.sin(time / 420 + seed * 0.15) * amount;
}

export class VisualStateSystem {
  static isRecentlyFertilized(plot: CropPlotState, currentDay: number): boolean {
    return typeof plot.fertilizedUntilDay === "number" && plot.fertilizedUntilDay >= currentDay;
  }

  static drawPlot(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, tileSize: number, currentDay: number, time: number): void {
    const px = plot.x * tileSize;
    const py = plot.y * tileSize;
    const x = px + 3;
    const y = py + 3;
    const size = tileSize - 6;
    const centerX = px + tileSize / 2;
    const centerY = py + tileSize / 2;

    this.drawSoil(graphics, plot, x, y, size, currentDay, time);

    if (plot.stage === "empty") {
      this.drawEmptyPlotDetails(graphics, plot, px, py, tileSize);
      return;
    }

    if (plot.stage === "prepared") {
      this.drawPreparedRows(graphics, plot, px, py, tileSize);
      return;
    }

    if (plot.stage === "seed") {
      this.drawSeed(graphics, plot, centerX, centerY, time);
      return;
    }

    if (plot.stage === "sprout") {
      this.drawPlant(graphics, plot, centerX, centerY, 0, time);
      return;
    }

    if (plot.stage === "middle") {
      this.drawPlant(graphics, plot, centerX, centerY, 1, time);
      return;
    }

    if (plot.stage === "adult") {
      this.drawPlant(graphics, plot, centerX, centerY, 2, time);
      return;
    }

    if (plot.stage === "problem") {
      const fallbackStage = plot.previousStage === "adult" || plot.previousStage === "ready" ? 2 : plot.previousStage === "middle" ? 1 : 0;
      this.drawPlant(graphics, plot, centerX, centerY, fallbackStage, time, true);
      this.drawProblemMarks(graphics, plot, centerX, centerY);
      return;
    }

    if (plot.stage === "ready") {
      this.drawPlant(graphics, plot, centerX, centerY, 2, time);
      this.drawReadyFruit(graphics, plot, centerX, centerY, time);
    }
  }

  private static drawSoil(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number, size: number, currentDay: number, time: number): void {
    const base = plot.soil === "normal" ? moistureColors[plot.moisture] : soilColors[plot.soil];

    graphics.fillStyle(0x000000, 0.12);
    graphics.fillRect(x + 2, y + 3, size, size);
    graphics.fillStyle(base, 1);
    graphics.fillRect(x, y, size, size);
    graphics.lineStyle(1, 0x5b371e, 0.42);
    graphics.strokeRect(x + 1, y + 1, size - 2, size - 2);

    graphics.fillStyle(0x4e2e1b, plot.moisture === "alta" || plot.soil === "encharcado" ? 0.22 : 0.12);
    for (let i = 0; i < 3; i += 1) {
      const rowY = y + 7 + i * 8 + variant(plot.visualSeed, i, 2);
      graphics.fillRect(x + 4, rowY, size - 8, 2);
    }

    if (plot.moisture === "baixa" || plot.soil === "seco") {
      this.drawDryCracks(graphics, plot, x, y, size);
    }

    if (plot.moisture === "alta") {
      this.drawWetHighlights(graphics, plot, x, y, size, time);
    }

    if (plot.soil === "encharcado") {
      this.drawPuddles(graphics, plot, x, y, size, time);
    }

    if (plot.soil === "pobre") {
      this.drawPoorSoil(graphics, plot, x, y);
    }

    if (this.isRecentlyFertilized(plot, currentDay)) {
      this.drawFertilizedSoil(graphics, plot, x, y, size, time);
    }
  }

  private static drawDryCracks(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number, size: number): void {
    graphics.lineStyle(1, 0x6f3f1e, 0.65);
    for (let i = 0; i < 4; i += 1) {
      const startX = x + 7 + variant(plot.visualSeed, i, size - 13);
      const startY = y + 6 + variant(plot.visualSeed, i + 20, size - 12);
      graphics.lineBetween(startX, startY, startX + 5, startY + 2);
      graphics.lineBetween(startX + 5, startY + 2, startX + 7, startY - 3);
    }
  }

  private static drawWetHighlights(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number, size: number, time: number): void {
    const shimmer = 0.24 + Math.sin(time / 330 + plot.visualSeed) * 0.08;
    graphics.fillStyle(0x8ad8ff, shimmer);
    graphics.fillRect(x + 6 + variant(plot.visualSeed, 2, 12), y + 7, 5, 2);
    graphics.fillRect(x + size - 13, y + 18 + variant(plot.visualSeed, 3, 6), 4, 2);
    graphics.fillStyle(0xb8efff, shimmer * 0.75);
    graphics.fillRect(x + 15, y + 23, 2, 2);
  }

  private static drawPuddles(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number, size: number, time: number): void {
    const pulse = 0.38 + Math.sin(time / 380 + plot.visualSeed) * 0.08;
    graphics.fillStyle(0x5fa8d3, pulse);
    graphics.fillEllipse(x + size / 2 - 5, y + size / 2 + 2, 13, 5);
    graphics.fillEllipse(x + size - 10, y + 10, 8, 4);
  }

  private static drawPoorSoil(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number): void {
    graphics.fillStyle(0xd1b75a, 0.55);
    graphics.fillRect(x + 8 + variant(plot.visualSeed, 5, 6), y + 8, 3, 3);
    graphics.fillStyle(0x655f56, 0.6);
    graphics.fillRect(x + 18, y + 20 + variant(plot.visualSeed, 6, 4), 4, 3);
    graphics.fillRect(x + 5, y + 22, 3, 3);
  }

  private static drawFertilizedSoil(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, x: number, y: number, size: number, time: number): void {
    const glow = 0.48 + Math.sin(time / 260 + plot.visualSeed) * 0.14;
    graphics.lineStyle(2, 0x8fd460, glow);
    graphics.strokeRect(x + 1, y + 1, size - 2, size - 2);
    graphics.fillStyle(0xd8e86f, 0.75);
    graphics.fillRect(x + 6, y + 6 + variant(plot.visualSeed, 8, 9), 3, 3);
    graphics.fillStyle(0x7fd45b, 0.8);
    graphics.fillRect(x + 21, y + 8, 3, 3);
    graphics.fillRect(x + 13, y + 22, 2, 2);
  }

  private static drawEmptyPlotDetails(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, px: number, py: number, tileSize: number): void {
    graphics.fillStyle(0x000000, 0.08);
    graphics.fillRect(px + 6, py + 6 + variant(plot.visualSeed, 10, 3), tileSize - 12, 2);
    graphics.fillRect(px + 8, py + 23, tileSize - 16, 2);
  }

  private static drawPreparedRows(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, px: number, py: number, tileSize: number): void {
    graphics.fillStyle(0xfff0bf, 0.32);
    for (let i = 0; i < 3; i += 1) {
      graphics.fillRect(px + 6, py + 7 + i * 8 + variant(plot.visualSeed, 12 + i, 2), tileSize - 12, 3);
    }
  }

  private static drawSeed(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, cx: number, cy: number, time: number): void {
    graphics.fillStyle(0x543019, 0.32);
    graphics.fillEllipse(cx, cy + 3, 12, 5);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillEllipse(cx, cy + wave(time, plot.visualSeed, 0.8), 7, 5);
    graphics.fillStyle(0xfff7c7, 0.65);
    graphics.fillRect(cx - 1, cy - 2, 2, 1);
  }

  private static drawPlant(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, cx: number, cy: number, stage: 0 | 1 | 2, time: number, forcedProblem = false): void {
    const sway = wave(time, plot.visualSeed, stage + 0.8);
    const color = forcedProblem ? healthColors[plot.health] : 0x38a64c + variant(plot.visualSeed, 3, 0x1010);
    const dark = forcedProblem ? 0x5d763f : 0x237a36;
    const stemHeight = [13, 21, 28][stage];
    const stemWidth = [4, 5, 7][stage];
    const lean = plot.health === "murcha" || forcedProblem ? 4 : 0;

    graphics.fillStyle(dark, 1);
    graphics.fillRect(cx - stemWidth / 2 + sway + lean / 2, cy + 8 - stemHeight, stemWidth, stemHeight);

    graphics.fillStyle(color, 1);
    const leafSets = stage === 0 ? 1 : stage === 1 ? 3 : 4;
    for (let i = 0; i < leafSets; i += 1) {
      const leafY = cy - 3 - i * 5;
      const leafW = 8 + stage * 3 + variant(plot.visualSeed, 30 + i, 3);
      const side = i % 2 === 0 ? -1 : 1;
      graphics.fillEllipse(cx + sway + side * (5 + stage * 2) + lean, leafY, leafW, 6);
      graphics.fillEllipse(cx + sway - side * (5 + stage * 2) + lean / 2, leafY + 2, leafW - 1, 6);
    }

    if (plot.health === "com_manchas" || plot.pests === "media" || plot.pests === "alta") {
      this.drawPestMarks(graphics, plot, cx, cy, time);
    }
  }

  private static drawProblemMarks(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, cx: number, cy: number): void {
    graphics.fillStyle(plot.health === "murcha" ? 0x6a4b32 : 0x9d4030, 0.9);
    graphics.fillRect(cx - 10, cy - 11, 4, 4);
    graphics.fillRect(cx + 7, cy - 4, 4, 4);

    if (plot.health === "murcha") {
      graphics.lineStyle(2, 0x6a4b32, 0.55);
      graphics.lineBetween(cx - 9, cy - 6, cx - 15, cy + 1);
      graphics.lineBetween(cx + 8, cy - 4, cx + 14, cy + 1);
    }
  }

  private static drawPestMarks(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, cx: number, cy: number, time: number): void {
    const count = plot.pests === "alta" ? 5 : plot.pests === "media" ? 3 : 2;
    for (let i = 0; i < count; i += 1) {
      const bugX = cx - 11 + variant(plot.visualSeed, 40 + i, 22) + Math.sin(time / 190 + i) * 1.5;
      const bugY = cy - 20 + variant(plot.visualSeed, 50 + i, 18) + Math.cos(time / 230 + i) * 1.2;
      graphics.fillStyle(i % 2 === 0 ? 0x2f2118 : 0xa94038, 0.92);
      graphics.fillRect(bugX, bugY, 3, 3);
    }
  }

  private static drawReadyFruit(graphics: Phaser.GameObjects.Graphics, plot: CropPlotState, cx: number, cy: number, time: number): void {
    const glow = 0.26 + Math.sin(time / 260 + plot.visualSeed) * 0.08;
    graphics.fillStyle(0xfff0a2, glow);
    graphics.fillCircle(cx, cy - 16, 15);
    graphics.fillStyle(0xf4cc58, 1);
    graphics.fillEllipse(cx - 7, cy - 13, 7, 10);
    graphics.fillEllipse(cx + 7, cy - 13, 7, 10);
    graphics.fillEllipse(cx, cy - 19, 8, 10);
    graphics.fillStyle(0xfff7dc, 0.72);
    graphics.fillRect(cx - 1, cy - 22, 2, 3);
  }
}
