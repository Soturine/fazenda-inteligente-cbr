import Phaser from "phaser";
import type { Direction, PlayerSaveState } from "../types";

export class Player extends Phaser.GameObjects.Container {
  readonly bodyWidth = 18;
  readonly bodyHeight = 24;
  speed = 120;
  facing: Direction = "down";
  moving = false;

  private readonly face: Phaser.GameObjects.Rectangle[] = [];
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly shirt: Phaser.GameObjects.Rectangle;
  private readonly head: Phaser.GameObjects.Rectangle;
  private readonly hat: Phaser.GameObjects.Rectangle;
  private readonly hatTop: Phaser.GameObjects.Rectangle;
  private readonly leftFoot: Phaser.GameObjects.Rectangle;
  private readonly rightFoot: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, saved?: PlayerSaveState) {
    super(scene, saved?.x ?? x, saved?.y ?? y);
    this.facing = saved?.facing ?? "down";

    this.shadow = scene.add.rectangle(0, 15, 24, 7, 0x000000, 0.2);
    this.leftFoot = scene.add.rectangle(-5, 17, 6, 6, 0x263027, 1);
    this.rightFoot = scene.add.rectangle(5, 17, 6, 6, 0x263027, 1);
    this.shirt = scene.add.rectangle(0, 5, 16, 18, 0x4d6fb3, 1);
    const scarf = scene.add.rectangle(0, -2, 18, 4, 0xf4cc58, 1);
    this.head = scene.add.rectangle(0, -12, 14, 12, 0xf1b77a, 1);
    this.hat = scene.add.rectangle(0, -21, 20, 7, 0x7a4a24, 1);
    this.hatTop = scene.add.rectangle(0, -26, 14, 5, 0x7a4a24, 1);
    this.face = [scene.add.rectangle(-4, -14, 3, 3, 0x263027, 1), scene.add.rectangle(4, -14, 3, 3, 0x263027, 1)];

    this.add([this.shadow, this.leftFoot, this.rightFoot, this.shirt, scarf, this.head, this.hat, this.hatTop, ...this.face]);
    this.setSize(this.bodyWidth, this.bodyHeight);
    this.setFacing(this.facing);
    scene.add.existing(this);
  }

  setFacing(direction: Direction): void {
    this.facing = direction;
    const showFace = direction !== "up";
    this.face.forEach((part) => part.setVisible(showFace));

    const eyeOffset = direction === "left" ? -2 : direction === "right" ? 2 : 0;
    this.face[0].setX(-4 + eyeOffset);
    this.face[1].setX(4 + eyeOffset);
    this.hat.setY(direction === "up" ? -23 : -21);
    this.hatTop.setY(direction === "up" ? -28 : -26);
  }

  animate(time: number): void {
    const stride = Math.sin(time / 90);
    const bob = this.moving ? Math.abs(stride) * 1.6 : Math.sin(time / 620) * 0.35;

    this.leftFoot.setY(17 + (this.moving ? stride * 2 : 0));
    this.rightFoot.setY(17 - (this.moving ? stride * 2 : 0));
    this.shirt.setY(5 - bob);
    this.head.setY(-12 - bob);
    this.hat.setY((this.facing === "up" ? -23 : -21) - bob);
    this.hatTop.setY((this.facing === "up" ? -28 : -26) - bob);
    this.face.forEach((part) => part.setY(-14 - bob));
    this.shadow.setScale(this.moving ? 1.05 + Math.abs(stride) * 0.08 : 1, 1);
  }

  serialize(): PlayerSaveState {
    return {
      x: this.x,
      y: this.y,
      facing: this.facing,
    };
  }
}
