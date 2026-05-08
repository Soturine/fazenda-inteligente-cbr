import Phaser from "phaser";
import { mapHeight, mapWidth, tileSize } from "../data/gameData";
import type { ToolId, Vector2Like, Weather } from "../types";

const depth = {
  ground: 3,
  weather: 7,
  overlay: 8,
  uiWorld: 9,
};

export class EffectSystem {
  private readonly width = mapWidth * tileSize;
  private readonly height = mapHeight * tileSize;
  private readonly weatherOverlay: Phaser.GameObjects.Rectangle;
  private targetIndicator?: Phaser.GameObjects.Triangle;
  private lastWeatherParticle = 0;
  private stepCooldown = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.weatherOverlay = scene.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xffffff, 0).setDepth(depth.weather);
  }

  updateWeather(time: number, weather: Weather): void {
    const overlays: Record<Weather, { color: number; alpha: number }> = {
      ensolarado: { color: 0xffe28a, alpha: 0.08 },
      chuvoso: { color: 0x5d7f9a, alpha: 0.16 },
      seco: { color: 0xe5bd6a, alpha: 0.14 },
      nublado: { color: 0x9bb2a7, alpha: 0.18 },
    };

    const overlay = overlays[weather];
    this.weatherOverlay.setFillStyle(overlay.color, overlay.alpha);

    if (time - this.lastWeatherParticle < (weather === "chuvoso" ? 52 : 170)) {
      return;
    }

    this.lastWeatherParticle = time;

    if (weather === "chuvoso") {
      for (let i = 0; i < 5; i += 1) {
        const x = Phaser.Math.Between(0, this.width);
        const drop = this.scene.add.rectangle(x, -8, 2, 14, 0x9edfff, 0.68).setDepth(depth.weather + 1).setAngle(-10);
        this.scene.tweens.add({
          targets: drop,
          y: this.height + 16,
          x: x - 42,
          duration: 620,
          ease: "Linear",
          onComplete: () => drop.destroy(),
        });
      }
    }

    if (weather === "seco") {
      const dust = this.scene.add.rectangle(Phaser.Math.Between(0, this.width), Phaser.Math.Between(80, this.height - 40), 4, 2, 0xe9c97a, 0.28).setDepth(depth.weather);
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(18, 54),
        y: dust.y - Phaser.Math.Between(2, 10),
        alpha: 0,
        duration: 1000,
        ease: "Sine.easeOut",
        onComplete: () => dust.destroy(),
      });
    }
  }

  playStep(x: number, y: number): boolean {
    const now = this.scene.time.now;
    if (now < this.stepCooldown) return false;
    this.stepCooldown = now + 230;
    const puff = this.scene.add.rectangle(x, y + 13, 8, 3, 0x3a5f2d, 0.16).setDepth(depth.ground);
    this.scene.tweens.add({
      targets: puff,
      scaleX: 1.5,
      alpha: 0,
      duration: 190,
      onComplete: () => puff.destroy(),
    });
    return true;
  }

  playInvalid(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    const mark = this.scene.add.text(x, y - 20, "x", {
      color: "#b95234",
      fontFamily: "Arial",
      fontSize: "20px",
      fontStyle: "900",
    }).setOrigin(0.5).setDepth(depth.uiWorld);
    this.scene.tweens.add({
      targets: mark,
      y: mark.y - 14,
      alpha: 0,
      duration: 520,
      onComplete: () => mark.destroy(),
    });
    this.highlightTile(tile, 0xb95234, 320);
  }

  playToolEffect(tool: ToolId, tile: Vector2Like): void {
    if (tool === "hoe") this.playHoe(tile);
    if (tool === "seed") this.playSeed(tile);
    if (tool === "water") this.playWater(tile);
    if (tool === "fertilizer") this.playFertilizer(tile);
    if (tool === "pesticide") this.playPesticide(tile);
    if (tool === "harvest") this.playHarvest(tile);
  }

  highlightTile(tile: Vector2Like, color = 0xffe066, duration = 900): void {
    const x = tile.x * tileSize + 2;
    const y = tile.y * tileSize + 2;
    const stroke = this.scene.add.rectangle(x + tileSize / 2 - 2, y + tileSize / 2 - 2, tileSize - 4, tileSize - 4)
      .setStrokeStyle(3, color, 1)
      .setFillStyle(color, 0)
      .setDepth(depth.overlay);

    this.scene.tweens.add({
      targets: stroke,
      alpha: 0.18,
      scale: 1.08,
      yoyo: true,
      repeat: 2,
      duration: duration / 4,
      onComplete: () => stroke.destroy(),
    });
  }

  showTargetIndicator(tile: Vector2Like | null): void {
    if (!tile) {
      this.targetIndicator?.setVisible(false);
      return;
    }

    const x = tile.x * tileSize + tileSize / 2;
    const y = tile.y * tileSize - 2 + Math.sin(this.scene.time.now / 180) * 2;

    if (!this.targetIndicator) {
      this.targetIndicator = this.scene.add.triangle(x, y, 0, 0, 12, 0, 6, 10, 0xffe066, 0.95).setDepth(depth.overlay);
    }

    this.targetIndicator.setPosition(x, y).setVisible(true);
  }

  playAssistantThinking(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    const bubble = this.scene.add.text(x + 20, y - 24, "...", {
      backgroundColor: "rgba(255,247,220,0.92)",
      color: "#4f3520",
      fontFamily: "Arial",
      fontSize: "18px",
      fontStyle: "900",
      padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(depth.uiWorld);

    this.scene.tweens.add({
      targets: bubble,
      scale: 1.08,
      yoyo: true,
      repeat: 2,
      duration: 150,
      onComplete: () => bubble.destroy(),
    });

    for (let i = 0; i < 9; i += 1) {
      this.spawnParticle(x, y - 6, 0x79c5eb, Phaser.Math.Between(-22, 22), Phaser.Math.Between(-24, 8), 620, 4, 0.75);
    }
  }

  playCbrRecommendation(tile: Vector2Like, assistantTile: Vector2Like): void {
    this.highlightTile(tile, 0xffe066, 1000);
    const { x, y } = this.tileCenter(assistantTile);
    for (let i = 0; i < 11; i += 1) {
      this.spawnParticle(x, y - 8, i % 2 === 0 ? 0xffe066 : 0x79c5eb, Phaser.Math.Between(-28, 28), Phaser.Math.Between(-34, 12), 760, 4, 0.85);
    }
  }

  playRetainGlow(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 15; i += 1) {
      this.spawnParticle(x, y, i % 2 === 0 ? 0x8fd460 : 0xffe066, Phaser.Math.Between(-32, 32), Phaser.Math.Between(-42, 8), 900, 5, 0.85);
    }
  }

  playDayTransition(): void {
    const cover = this.scene.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x172019, 0).setDepth(30);
    this.scene.tweens.add({
      targets: cover,
      alpha: 0.72,
      duration: 260,
      yoyo: true,
      hold: 160,
      onComplete: () => cover.destroy(),
    });
  }

  private playHoe(tile: Vector2Like): void {
    this.highlightTile(tile, 0xc99a5a, 420);
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 10; i += 1) {
      this.spawnParticle(x + Phaser.Math.Between(-8, 8), y + 7, 0x9b6438, Phaser.Math.Between(-18, 18), Phaser.Math.Between(-14, 2), 420, 4, 0.62);
    }
  }

  private playSeed(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    const seed = this.scene.add.circle(x - 12, y - 22, 3, 0xffe066, 1).setDepth(depth.uiWorld);
    this.scene.tweens.add({
      targets: seed,
      x,
      y,
      scale: 1.5,
      duration: 430,
      ease: "Quad.easeIn",
      onComplete: () => seed.destroy(),
    });
    this.spawnParticle(x, y, 0xfff0a2, 0, -10, 520, 5, 0.9);
  }

  private playWater(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 16; i += 1) {
      const drop = this.scene.add.rectangle(x + Phaser.Math.Between(-13, 13), y - Phaser.Math.Between(18, 36), 3, 7, 0x79c5eb, 0.78).setDepth(depth.uiWorld);
      this.scene.tweens.add({
        targets: drop,
        y: y + Phaser.Math.Between(-2, 9),
        alpha: 0,
        duration: Phaser.Math.Between(280, 460),
        onComplete: () => drop.destroy(),
      });
    }
    this.highlightTile(tile, 0x79c5eb, 520);
  }

  private playFertilizer(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 14; i += 1) {
      this.spawnParticle(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-4, 8), i % 2 === 0 ? 0x8fd460 : 0xffe066, Phaser.Math.Between(-18, 18), Phaser.Math.Between(-20, -4), 700, 4, 0.85);
    }
    this.highlightTile(tile, 0x8fd460, 700);
  }

  private playPesticide(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 10; i += 1) {
      const mist = this.scene.add.circle(x - 15 + i * 3, y + Phaser.Math.Between(-12, 8), Phaser.Math.Between(4, 9), 0x9adf8c, 0.22).setDepth(depth.uiWorld);
      this.scene.tweens.add({
        targets: mist,
        x: mist.x + Phaser.Math.Between(12, 30),
        scale: 1.4,
        alpha: 0,
        duration: 620,
        onComplete: () => mist.destroy(),
      });
    }
    this.highlightTile(tile, 0xa7ef9a, 620);
  }

  private playHarvest(tile: Vector2Like): void {
    const { x, y } = this.tileCenter(tile);
    for (let i = 0; i < 12; i += 1) {
      this.spawnParticle(x, y - 2, i % 2 === 0 ? 0xffe066 : 0xffffff, Phaser.Math.Between(-22, 22), Phaser.Math.Between(-34, -8), 760, 4, 0.95);
    }
    const coins = this.scene.add.text(x, y - 18, "+20", {
      color: "#f4cc58",
      fontFamily: "Arial",
      fontSize: "16px",
      fontStyle: "900",
      stroke: "#4f3520",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(depth.uiWorld);
    this.scene.tweens.add({
      targets: coins,
      y: coins.y - 24,
      alpha: 0,
      duration: 820,
      onComplete: () => coins.destroy(),
    });
    this.highlightTile(tile, 0xffe066, 700);
  }

  private spawnParticle(x: number, y: number, color: number, dx: number, dy: number, duration: number, size: number, alpha: number): void {
    const particle = this.scene.add.rectangle(x, y, size, size, color, alpha).setDepth(depth.uiWorld);
    this.scene.tweens.add({
      targets: particle,
      x: x + dx,
      y: y + dy,
      alpha: 0,
      scale: 0.35,
      duration,
      ease: "Sine.easeOut",
      onComplete: () => particle.destroy(),
    });
  }

  private tileCenter(tile: Vector2Like): Vector2Like {
    return {
      x: tile.x * tileSize + tileSize / 2,
      y: tile.y * tileSize + tileSize / 2,
    };
  }
}
