import Phaser from "phaser";
import type { Direction, ToolId } from "../types";

export class ToolVisualSystem {
  static drawHeldTool(graphics: Phaser.GameObjects.Graphics, tool: ToolId, facing: Direction, swing = 0): void {
    graphics.clear();
    const dir = facing === "left" ? -1 : 1;
    const hiddenBehind = facing === "up";
    const baseX = hiddenBehind ? -7 : 10 * dir;
    const baseY = hiddenBehind ? 0 : 2;
    const angle = swing * dir;

    graphics.save();
    graphics.translateCanvas(baseX, baseY);
    graphics.rotateCanvas(angle * 0.25);

    if (tool === "hoe") {
      graphics.lineStyle(3, 0x7a4a24, 1);
      graphics.lineBetween(0, -2, 12 * dir, 13);
      graphics.lineStyle(3, 0xc8d0c8, 1);
      graphics.lineBetween(9 * dir, 12, 17 * dir, 7 + swing * 4);
    }

    if (tool === "seed") {
      graphics.fillStyle(0xd8b06b, 1);
      graphics.fillRoundedRect(-1, 1, 12 * dir, 12, 3);
      graphics.fillStyle(0xf4cc58, 1);
      graphics.fillCircle(5 * dir, 7, 3);
    }

    if (tool === "water") {
      graphics.fillStyle(0x7f8a93, 1);
      graphics.fillRect(-1, 0, 13 * dir, 9);
      graphics.fillStyle(0x5fa8d3, 1);
      graphics.fillRect(2 * dir, 2, 7 * dir, 5);
      graphics.lineStyle(2, 0x7f8a93, 1);
      graphics.lineBetween(10 * dir, 2, 17 * dir, -3 - swing * 2);
      graphics.fillStyle(0x79c5eb, 0.75);
      if (swing > 0.2) graphics.fillRect(18 * dir, -3, 3 * dir, 4);
    }

    if (tool === "fertilizer") {
      graphics.fillStyle(0x8fd460, 1);
      graphics.fillRoundedRect(0, 0, 13 * dir, 13, 3);
      graphics.fillStyle(0xfff7dc, 1);
      graphics.fillRect(3 * dir, 4, 6 * dir, 3);
    }

    if (tool === "pesticide") {
      graphics.fillStyle(0x9adf8c, 1);
      graphics.fillRect(0, 0, 8 * dir, 12);
      graphics.fillStyle(0x5fa8d3, 1);
      graphics.fillRect(2 * dir, -4, 5 * dir, 5);
      graphics.lineStyle(2, 0x263027, 1);
      graphics.lineBetween(7 * dir, -3, 15 * dir, -5);
    }

    if (tool === "harvest") {
      graphics.lineStyle(2, 0x7a4a24, 1);
      graphics.beginPath();
      graphics.arc(7 * dir, 4, 7, Math.PI, 0);
      graphics.strokePath();
      graphics.fillStyle(0xd8b06b, 1);
      graphics.fillRoundedRect(0, 4, 15 * dir, 10, 3);
      graphics.fillStyle(0x8d5627, 0.5);
      graphics.fillRect(2 * dir, 9, 11 * dir, 2);
      graphics.fillStyle(0xd94b3d, 1);
      graphics.fillCircle(5 * dir, 6, 2.4);
      graphics.fillStyle(0xf4cc58, 1);
      graphics.fillCircle(10 * dir, 7, 2.2);
    }

    if (tool === "fishingRod") {
      graphics.lineStyle(2, 0x7a4a24, 1);
      graphics.lineBetween(0, 6, 22 * dir, -15 - swing * 5);
      graphics.lineStyle(1, 0xeef8ff, 0.9);
      graphics.lineBetween(22 * dir, -15 - swing * 5, 26 * dir, 11);
      graphics.fillStyle(0xf4cc58, 1);
      graphics.fillRect(25 * dir, 11, 3 * dir, 3);
    }

    graphics.restore();
  }
}
