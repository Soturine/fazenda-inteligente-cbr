import Phaser from "phaser";
import { FarmMap } from "./FarmMap";
import { Player } from "../entities/Player";

export class CameraSystem {
  static setup(scene: Phaser.Scene, map: FarmMap, player: Player): void {
    const camera = scene.cameras.main;
    camera.setBounds(0, 0, map.width * map.tileSize, map.height * map.tileSize);
    camera.startFollow(player, true, 0.12, 0.12);
    camera.setZoom(1);
  }
}
