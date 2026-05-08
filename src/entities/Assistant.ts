import Phaser from "phaser";
import type { Vector2Like } from "../types";

export class Assistant extends Phaser.GameObjects.Container {
  private readonly lens: Phaser.GameObjects.Rectangle;
  private readonly head: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, tile: Vector2Like, tileSize: number) {
    super(scene, tile.x * tileSize + tileSize / 2, tile.y * tileSize + tileSize / 2);

    const shadow = scene.add.rectangle(0, 18, 24, 6, 0x000000, 0.16);
    const post = scene.add.rectangle(0, 6, 4, 22, 0x7c4a25, 1);
    const hat = scene.add.rectangle(0, -17, 25, 5, 0x8d5627, 1);
    this.head = scene.add.rectangle(0, -6, 22, 17, 0xf4cc58, 1);
    const leftEye = scene.add.rectangle(-6, -8, 4, 4, 0x4f3520, 1);
    const rightEye = scene.add.rectangle(6, -8, 4, 4, 0x4f3520, 1);
    const mouth = scene.add.rectangle(0, 0, 10, 3, 0x4f3520, 1);
    this.lens = scene.add.rectangle(11, -14, 9, 9, 0x5fa8d3, 1);
    const shine = scene.add.rectangle(12, -15, 3, 3, 0xfff7dc, 1);

    this.add([shadow, post, hat, this.head, leftEye, rightEye, mouth, this.lens, shine]);
    scene.add.existing(this);

    scene.tweens.add({
      targets: this,
      y: this.y - 2,
      angle: 1.2,
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.tweens.add({
      targets: this.lens,
      alpha: 0.55,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  pulse(): void {
    this.scene.tweens.add({
      targets: this.head,
      scaleX: 1.18,
      scaleY: 1.12,
      duration: 140,
      yoyo: true,
      repeat: 1,
    });
  }
}
