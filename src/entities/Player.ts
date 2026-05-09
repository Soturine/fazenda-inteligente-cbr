import Phaser from "phaser";
import { ToolVisualSystem } from "../systems/ToolVisualSystem";
import type { CharacterCustomization, Direction, PlayerSaveState, ToolId } from "../types";

export class Player extends Phaser.GameObjects.Container {
  readonly bodyWidth = 18;
  readonly bodyHeight = 24;
  speed = 130;
  facing: Direction = "down";
  moving = false;

  private readonly face: Phaser.GameObjects.Rectangle[] = [];
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly shirt: Phaser.GameObjects.Rectangle;
  private readonly scarf: Phaser.GameObjects.Rectangle;
  private readonly head: Phaser.GameObjects.Rectangle;
  private readonly hair: Phaser.GameObjects.Rectangle;
  private readonly hat: Phaser.GameObjects.Rectangle;
  private readonly leftFoot: Phaser.GameObjects.Rectangle;
  private readonly rightFoot: Phaser.GameObjects.Rectangle;
  private readonly toolGraphics: Phaser.GameObjects.Graphics;
  private currentTool: ToolId = "hoe";
  private swingUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, saved?: PlayerSaveState, customization?: CharacterCustomization) {
    super(scene, saved?.x ?? x, saved?.y ?? y);
    this.facing = saved?.facing ?? "down";

    const skin = customization?.skinColor ? Phaser.Display.Color.HexStringToColor(customization.skinColor).color : 0xf1b77a;
    const hairColor = customization?.hairColor ? Phaser.Display.Color.HexStringToColor(customization.hairColor).color : 0x7a4a24;
    const outfit = customization?.outfitColor ? Phaser.Display.Color.HexStringToColor(customization.outfitColor).color : 0x4d6fb3;

    this.shadow = scene.add.rectangle(0, 15, 24, 7, 0x000000, 0.2);
    this.leftFoot = scene.add.rectangle(-5, 17, 6, 6, 0x263027, 1);
    this.rightFoot = scene.add.rectangle(5, 17, 6, 6, 0x263027, 1);
    this.shirt = scene.add.rectangle(0, 5, 16, 18, outfit, 1);
    this.scarf = scene.add.rectangle(0, -2, 18, 4, 0xf4cc58, 1);
    this.head = scene.add.rectangle(0, -12, 14, 12, skin, 1);
    this.hair = scene.add.rectangle(0, -19, customization?.style === "C" ? 18 : 15, customization?.style === "B" ? 9 : 6, hairColor, 1);
    this.hat = scene.add.rectangle(0, -24, 20, 5, 0x7a4a24, 1);
    this.face = [scene.add.rectangle(-4, -14, 3, 3, 0x263027, 1), scene.add.rectangle(4, -14, 3, 3, 0x263027, 1)];
    this.toolGraphics = scene.add.graphics();

    this.add([this.shadow, this.leftFoot, this.rightFoot, this.toolGraphics, this.shirt, this.scarf, this.head, this.hair, this.hat, ...this.face]);
    this.setSize(this.bodyWidth, this.bodyHeight);
    this.setFacing(this.facing);
    this.setTool(this.currentTool);
    scene.add.existing(this);
  }

  setTool(tool: ToolId): void {
    this.currentTool = tool;
    this.redrawTool(0);
  }

  playToolAction(tool = this.currentTool): void {
    this.currentTool = tool;
    this.swingUntil = this.scene.time.now + 360;
  }

  setFacing(direction: Direction): void {
    this.facing = direction;
    const showFace = direction !== "up";
    this.face.forEach((part) => part.setVisible(showFace));

    const eyeOffset = direction === "left" ? -2 : direction === "right" ? 2 : 0;
    this.face[0].setX(-4 + eyeOffset);
    this.face[1].setX(4 + eyeOffset);
    this.hat.setY(direction === "up" ? -25 : -24);
    this.hair.setY(direction === "up" ? -20 : -19);
    this.redrawTool(0);
  }

  animate(time: number): void {
    const stride = Math.sin(time / 90);
    const bob = this.moving ? Math.abs(stride) * 1.6 : Math.sin(time / 620) * 0.35;
    const swing = Math.max(0, (this.swingUntil - time) / 360);

    this.leftFoot.setY(17 + (this.moving ? stride * 2 : 0));
    this.rightFoot.setY(17 - (this.moving ? stride * 2 : 0));
    this.shirt.setY(5 - bob);
    this.scarf.setY(-2 - bob);
    this.head.setY(-12 - bob);
    this.hair.setY((this.facing === "up" ? -20 : -19) - bob);
    this.hat.setY((this.facing === "up" ? -25 : -24) - bob);
    this.face.forEach((part) => part.setY(-14 - bob));
    this.shadow.setScale(this.moving ? 1.05 + Math.abs(stride) * 0.08 : 1, 1);
    this.redrawTool(Math.sin(swing * Math.PI));
  }

  serialize(): PlayerSaveState {
    return {
      x: this.x,
      y: this.y,
      facing: this.facing,
    };
  }

  private redrawTool(swing: number): void {
    ToolVisualSystem.drawHeldTool(this.toolGraphics, this.currentTool, this.facing, swing);
    this.toolGraphics.setDepth(this.facing === "up" ? -1 : 1);
  }
}
