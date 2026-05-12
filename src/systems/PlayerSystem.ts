import Phaser from "phaser";
import { toolHotkeys } from "../data/gameData";
import { Player } from "../entities/Player";
import type { Direction, ToolId, Vector2Like } from "../types";
import { FarmMap } from "./FarmMap";

export interface PlayerActions {
  onUseTool: () => void;
  onAskAssistant: () => void;
  onNextDay: () => void;
  onSelectTool: (tool: ToolId) => void;
  onCycleCrop: () => void;
  onPause: () => void;
}

export class PlayerSystem {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(private readonly scene: Phaser.Scene, private readonly player: Player, private readonly map: FarmMap, private readonly actions: PlayerActions) {}

  createInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.keys = keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      cursorUp: "UP",
      cursorDown: "DOWN",
      cursorLeft: "LEFT",
      cursorRight: "RIGHT",
      interact: "E",
      space: "SPACE",
      ask: "Q",
      nextDay: "N",
      cycleCrop: "TAB",
      pause: "ESC",
      one: "ONE",
      two: "TWO",
      three: "THREE",
      four: "FOUR",
      five: "FIVE",
      six: "SIX",
      seven: "SEVEN",
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(deltaSeconds: number): void {
    if (!this.keys) return;

    if (this.isTypingInEditableField()) {
      this.player.moving = false;
      return;
    }

    let dx = 0;
    let dy = 0;

    if (this.keys.left.isDown || this.keys.cursorLeft.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.cursorRight.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.cursorUp.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.cursorDown.isDown) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.player.moving = dx !== 0 || dy !== 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.player.setFacing(dx > 0 ? "right" : "left");
    } else if (dy !== 0) {
      this.player.setFacing(dy > 0 ? "down" : "up");
    }

    this.move(dx * this.player.speed * deltaSeconds, 0);
    this.move(0, dy * this.player.speed * deltaSeconds);

    this.processActions();
  }

  getCurrentTile(): Vector2Like {
    return this.map.pixelToTile(this.player.x, this.player.y + this.player.bodyHeight / 4);
  }

  getFacingTile(): Vector2Like {
    const tile = this.getCurrentTile();
    const facingDelta: Record<Direction, Vector2Like> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const delta = facingDelta[this.player.facing];
    return { x: tile.x + delta.x, y: tile.y + delta.y };
  }

  getInteractionTile(): Vector2Like {
    const current = this.getCurrentTile();
    const facing = this.getFacingTile();
    return this.map.isPlantingTile(facing.x, facing.y) ? facing : current;
  }

  private move(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;

    const nextX = this.player.x + dx;
    const nextY = this.player.y + dy;
    const collisionWidth = 12;
    const collisionHeight = 11;
    const left = nextX - collisionWidth / 2;
    const top = nextY + 2;

    if (!this.map.isBlockedRect(left, top, collisionWidth, collisionHeight)) {
      this.player.setPosition(nextX, nextY);
    }
  }

  private processActions(): void {
    if (this.isTypingInEditableField()) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.interact) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.actions.onUseTool();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ask)) {
      this.actions.onAskAssistant();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.nextDay)) {
      this.actions.onNextDay();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.cycleCrop)) {
      this.actions.onCycleCrop();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      this.actions.onPause();
    }

    const keyPairs: Array<[string, string]> = [
      ["one", "1"],
      ["two", "2"],
      ["three", "3"],
      ["four", "4"],
      ["five", "5"],
      ["six", "6"],
      ["seven", "7"],
    ];

    keyPairs.forEach(([keyName, hotkey]) => {
      if (Phaser.Input.Keyboard.JustDown(this.keys[keyName])) {
        this.actions.onSelectTool(toolHotkeys[hotkey]);
      }
    });
  }

  private isTypingInEditableField(): boolean {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return false;
    return active.isContentEditable || active.matches("input, textarea, select, [contenteditable='true']");
  }
}
