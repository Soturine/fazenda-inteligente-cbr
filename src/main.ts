import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { FarmScene } from "./scenes/FarmScene";
import { MenuScene } from "./scenes/MenuScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: "game-container",
  width: 768,
  height: 576,
  backgroundColor: "#70b85d",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, FarmScene],
};

new Phaser.Game(config);
