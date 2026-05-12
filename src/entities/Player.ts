import Phaser from "phaser";
import { ToolVisualSystem } from "../systems/ToolVisualSystem";
import type { CharacterCustomization, CharacterHairStyle, CharacterOutfitStyle, Direction, PlayerSaveState, ToolId } from "../types";

export class Player extends Phaser.GameObjects.Container {
  readonly bodyWidth = 18;
  readonly bodyHeight = 24;
  speed = 130;
  facing: Direction = "down";
  moving = false;

  private readonly face: Phaser.GameObjects.Rectangle[] = [];
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly shirt: Phaser.GameObjects.Rectangle;
  private readonly leftSleeve: Phaser.GameObjects.Rectangle;
  private readonly rightSleeve: Phaser.GameObjects.Rectangle;
  private readonly lowerOutfit: Phaser.GameObjects.Rectangle;
  private readonly scarf: Phaser.GameObjects.Rectangle;
  private readonly head: Phaser.GameObjects.Rectangle;
  private readonly hairBack: Phaser.GameObjects.Rectangle;
  private readonly hair: Phaser.GameObjects.Rectangle;
  private readonly hairLeftLock: Phaser.GameObjects.Rectangle;
  private readonly hairRightLock: Phaser.GameObjects.Rectangle;
  private readonly hairAccent: Phaser.GameObjects.Rectangle;
  private readonly hairTie: Phaser.GameObjects.Rectangle;
  private readonly hat: Phaser.GameObjects.Rectangle;
  private readonly hatBrim: Phaser.GameObjects.Rectangle;
  private readonly hatBand: Phaser.GameObjects.Rectangle;
  private readonly ponytail: Phaser.GameObjects.Rectangle;
  private readonly outfitDetail: Phaser.GameObjects.Rectangle;
  private readonly mouth: Phaser.GameObjects.Rectangle;
  private readonly leftFoot: Phaser.GameObjects.Rectangle;
  private readonly rightFoot: Phaser.GameObjects.Rectangle;
  private readonly toolGraphics: Phaser.GameObjects.Graphics;
  private currentTool: ToolId = "hoe";
  private swingUntil = 0;
  private readonly hairStyle: CharacterHairStyle;
  private readonly outfitStyle: CharacterOutfitStyle;

  constructor(scene: Phaser.Scene, x: number, y: number, saved?: PlayerSaveState, customization?: CharacterCustomization) {
    super(scene, saved?.x ?? x, saved?.y ?? y);
    this.facing = saved?.facing ?? "down";

    const skin = customization?.skinColor ? Phaser.Display.Color.HexStringToColor(customization.skinColor).color : 0xf1b77a;
    const hairColor = customization?.hairColor ? Phaser.Display.Color.HexStringToColor(customization.hairColor).color : 0x7a4a24;
    const outfit = customization?.outfitColor ? Phaser.Display.Color.HexStringToColor(customization.outfitColor).color : 0x4d6fb3;

    this.shadow = scene.add.rectangle(0, 15, 24, 7, 0x000000, 0.2);
    this.leftFoot = scene.add.rectangle(-5, 17, 6, 6, 0x263027, 1);
    this.rightFoot = scene.add.rectangle(5, 17, 6, 6, 0x263027, 1);
    this.outfitStyle = customization?.outfitStyle ?? "avental";
    this.hairStyle = customization?.style ?? "curto";
    const bodyWidth = this.outfitStyle === "casaco" ? 20 : this.outfitStyle === "jardineira" || this.outfitStyle === "fazenda" ? 18 : 16;
    const lowerWidth = this.outfitStyle === "vestido" ? 22 : this.outfitStyle === "macacao" ? 18 : 14;
    const lowerColor = this.outfitStyle === "macacao" || this.outfitStyle === "jardineira" ? 0x2f6e8d : Phaser.Display.Color.ValueToColor(outfit).darken(18).color;
    this.shirt = scene.add.rectangle(0, 5, bodyWidth, 18, outfit, 1);
    this.leftSleeve = scene.add.rectangle(-11, 5, 5, this.outfitStyle === "alca" ? 8 : 13, outfit, 1);
    this.rightSleeve = scene.add.rectangle(11, 5, 5, this.outfitStyle === "alca" ? 8 : 13, outfit, 1);
    this.lowerOutfit = scene.add.rectangle(0, 15, lowerWidth, this.outfitStyle === "vestido" ? 11 : 8, lowerColor, 1);
    this.scarf = scene.add.rectangle(0, -2, this.outfitStyle === "alca" ? 11 : 18, 4, this.outfitStyle === "fazenda" ? 0xfff7dc : 0xf4cc58, 1);
    this.head = scene.add.rectangle(0, -12, 14, 12, skin, 1);
    this.hairBack = scene.add.rectangle(0, -12, this.hairBackWidth(this.hairStyle), this.hairBackHeight(this.hairStyle), hairColor, 1).setVisible(this.hasBackHair(this.hairStyle));
    this.hair = scene.add.rectangle(0, -19, this.hairWidth(this.hairStyle), this.hairHeight(this.hairStyle), hairColor, 1);
    this.hairLeftLock = scene.add.rectangle(-9, -12, 4, this.sideLockHeight(this.hairStyle), hairColor, 1).setVisible(this.hasSideLocks(this.hairStyle));
    this.hairRightLock = scene.add.rectangle(9, -12, 4, this.sideLockHeight(this.hairStyle), hairColor, 1).setVisible(this.hasSideLocks(this.hairStyle));
    this.ponytail = scene.add.rectangle(this.ponytailX(this.hairStyle), -8, this.ponytailWidth(this.hairStyle), this.ponytailHeight(this.hairStyle), hairColor, 1).setVisible(this.hasPonytail(this.hairStyle));
    this.hairAccent = scene.add.rectangle(-8, -16, this.hairAccentWidth(this.hairStyle), this.hairAccentHeight(this.hairStyle), hairColor, 1).setVisible(this.hasHairAccent(this.hairStyle));
    this.hairTie = scene.add.rectangle(8, -8, 4, 4, 0xf4cc58, 1).setVisible(this.hairStyle === "rabo" || this.hairStyle === "tranca" || this.hairStyle === "femininoA");
    this.hatBrim = scene.add.rectangle(0, -22, this.hatBrimWidth(this.hairStyle), this.hatBrimHeight(this.hairStyle), this.hatColor(this.hairStyle), 1).setVisible(this.hasHat(this.hairStyle));
    this.hat = scene.add.rectangle(0, -26, this.hatWidth(this.hairStyle), this.hatHeight(this.hairStyle), this.hatColor(this.hairStyle), 1).setVisible(this.hasHat(this.hairStyle));
    this.hatBand = scene.add.rectangle(0, -25, this.hatWidth(this.hairStyle) - 4, 2, this.hairStyle === "bone" ? 0xfff7dc : 0x623819, 1).setVisible(this.hasHat(this.hairStyle));
    this.outfitDetail = scene.add.rectangle(0, 7, this.outfitStyle === "macacao" ? 10 : this.outfitStyle === "fazenda" ? 8 : 14, this.outfitStyle === "jardineira" ? 12 : 3, this.detailColor(this.outfitStyle), 1);
    this.face = [scene.add.rectangle(-4, -14, 3, 3, 0x263027, 1), scene.add.rectangle(4, -14, 3, 3, 0x263027, 1)];
    this.mouth = scene.add.rectangle(0, -9, 6, 2, 0x7a3f2c, 1);
    this.toolGraphics = scene.add.graphics();

    this.add([
      this.shadow,
      this.leftFoot,
      this.rightFoot,
      this.toolGraphics,
      this.lowerOutfit,
      this.leftSleeve,
      this.rightSleeve,
      this.shirt,
      this.outfitDetail,
      this.scarf,
      this.hairBack,
      this.ponytail,
      this.head,
      this.hair,
      this.hairLeftLock,
      this.hairRightLock,
      this.hairAccent,
      this.hairTie,
      this.hatBrim,
      this.hat,
      this.hatBand,
      ...this.face,
      this.mouth,
    ]);
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
    const side = direction === "right" ? -1 : 1;
    this.face.forEach((part) => part.setVisible(showFace));
    this.mouth.setVisible(showFace);

    const eyeOffset = direction === "left" ? -2 : direction === "right" ? 2 : 0;
    this.face[0].setX(-4 + eyeOffset);
    this.face[1].setX(4 + eyeOffset);
    this.hairBack.setY(direction === "up" ? -13 : -12);
    this.hairBack.setVisible(this.hasBackHair(this.hairStyle));
    this.hair.setY(direction === "up" ? -20 : -19);
    this.ponytail.setX(this.ponytailX(this.hairStyle) * side);
    this.ponytail.setY(direction === "up" ? -11 : -9);
    this.hairTie.setX((Math.abs(this.ponytailX(this.hairStyle)) || 8) * side);
    this.hairTie.setY(direction === "up" ? -10 : -8);
    this.hairTie.setVisible(this.hairStyle === "rabo" || this.hairStyle === "tranca" || this.hairStyle === "femininoA");
    this.hairLeftLock.setVisible(this.hasSideLocks(this.hairStyle) && direction !== "right");
    this.hairRightLock.setVisible(this.hasSideLocks(this.hairStyle) && direction !== "left");
    this.hairLeftLock.setY(direction === "up" ? -15 : -12);
    this.hairRightLock.setY(direction === "up" ? -15 : -12);
    this.hairAccent.setX(this.hairAccentX(this.hairStyle) * side);
    this.hairAccent.setY(direction === "up" ? -17 : -16);
    this.hairAccent.setVisible(this.hasHairAccent(this.hairStyle) && direction !== "up");
    this.positionHat(direction);
    this.redrawTool(0);
  }

  animate(time: number): void {
    const stride = Math.sin(time / 90);
    const bob = this.moving ? Math.abs(stride) * 1.6 : Math.sin(time / 620) * 0.35;
    const idleScale = this.moving ? 1 : 1 + Math.sin(time / 880) * 0.012;
    const swing = Math.max(0, (this.swingUntil - time) / 360);

    this.setScale(1, idleScale);
    this.leftFoot.setY(17 + (this.moving ? stride * 2 : 0));
    this.rightFoot.setY(17 - (this.moving ? stride * 2 : 0));
    this.lowerOutfit.setY(15 - bob * 0.55);
    this.leftSleeve.setY(5 - bob);
    this.rightSleeve.setY(5 - bob);
    this.shirt.setY(5 - bob);
    this.scarf.setY(-2 - bob);
    this.head.setY(-12 - bob);
    this.hairBack.setY((this.facing === "up" ? -13 : -12) - bob * 0.55);
    this.hair.setY((this.facing === "up" ? -20 : -19) - bob);
    this.hairLeftLock.setY((this.facing === "up" ? -15 : -12) - bob * 0.7);
    this.hairRightLock.setY((this.facing === "up" ? -15 : -12) - bob * 0.7);
    this.ponytail.setY((this.facing === "up" ? -11 : -9) - bob * 0.7);
    this.hairAccent.setY((this.facing === "up" ? -17 : -16) - bob * 0.8);
    this.hairTie.setY((this.facing === "up" ? -10 : -8) - bob * 0.75);
    this.positionHat(this.facing, bob);
    this.face.forEach((part) => part.setY(-14 - bob));
    this.mouth.setY(-9 - bob);
    this.updateBlink(time);
    this.shadow.setScale(this.moving ? 1.05 + Math.abs(stride) * 0.08 : 1, 1);
    this.redrawTool(Math.sin(swing * Math.PI));
  }

  getFishingRodTip(): { x: number; y: number } {
    const swing = Math.max(0, (this.swingUntil - this.scene.time.now) / 360);
    const swingOffset = Math.sin(swing * Math.PI) * 5;

    if (this.facing === "left") {
      return { x: this.x - 32, y: this.y - 13 - swingOffset };
    }

    if (this.facing === "right") {
      return { x: this.x + 32, y: this.y - 13 - swingOffset };
    }

    if (this.facing === "up") {
      return { x: this.x + 15, y: this.y - 15 - swingOffset };
    }

    return { x: this.x + 32, y: this.y - 13 - swingOffset };
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

  private updateBlink(time: number): void {
    const blinking = this.facing !== "up" && time % 4300 > 4140;
    this.face.forEach((part) => part.setScale(1, blinking ? 0.25 : 1));
  }

  private hairWidth(style: CharacterHairStyle | undefined): number {
    if (style === "longo" || style === "femininoB" || style === "tranca") return 23;
    if (style === "cacheado") return 24;
    if (style === "femininoA" || style === "rabo" || style === "chapeuPalha") return 20;
    if (style === "neutroA" || style === "medio") return 17;
    if (style === "bone" || style === "chapeu") return 17;
    return 15;
  }

  private hairHeight(style: CharacterHairStyle | undefined): number {
    if (style === "longo" || style === "femininoB") return 13;
    if (style === "tranca") return 10;
    if (style === "cacheado") return 13;
    if (style === "medio" || style === "femininoA") return 9;
    return 6;
  }

  private hairBackWidth(style: CharacterHairStyle): number {
    if (style === "longo" || style === "femininoB") return 22;
    if (style === "tranca") return 12;
    if (style === "cacheado") return 24;
    return 14;
  }

  private hairBackHeight(style: CharacterHairStyle): number {
    if (style === "longo") return 24;
    if (style === "femininoB") return 18;
    if (style === "tranca") return 13;
    if (style === "cacheado") return 15;
    return 8;
  }

  private hasBackHair(style: CharacterHairStyle): boolean {
    return style === "longo" || style === "femininoB" || style === "cacheado" || style === "tranca";
  }

  private hasSideLocks(style: CharacterHairStyle): boolean {
    return style === "longo" || style === "femininoB" || style === "cacheado" || style === "femininoA";
  }

  private sideLockHeight(style: CharacterHairStyle): number {
    if (style === "longo") return 15;
    if (style === "femininoB") return 13;
    if (style === "cacheado") return 8;
    return 10;
  }

  private hasPonytail(style: CharacterHairStyle): boolean {
    return style === "rabo" || style === "femininoA" || style === "femininoB" || style === "tranca";
  }

  private ponytailX(style: CharacterHairStyle): number {
    if (style === "tranca") return 11;
    if (style === "femininoB") return 10;
    if (style === "femininoA") return 12;
    return 9;
  }

  private ponytailWidth(style: CharacterHairStyle): number {
    return style === "tranca" ? 5 : style === "femininoB" ? 8 : 7;
  }

  private ponytailHeight(style: CharacterHairStyle): number {
    return style === "tranca" ? 22 : style === "femininoB" ? 16 : 13;
  }

  private hasHairAccent(style: CharacterHairStyle): boolean {
    return style === "femininoA" || style === "cacheado" || style === "tranca" || style === "femininoB";
  }

  private hairAccentX(style: CharacterHairStyle): number {
    if (style === "femininoB") return -6;
    if (style === "tranca") return -7;
    return -8;
  }

  private hairAccentWidth(style: CharacterHairStyle): number {
    return style === "cacheado" ? 7 : style === "femininoB" ? 5 : 6;
  }

  private hairAccentHeight(style: CharacterHairStyle): number {
    return style === "cacheado" ? 7 : style === "femininoB" ? 13 : 10;
  }

  private hasHat(style: CharacterHairStyle): boolean {
    return style === "bone" || style === "chapeu" || style === "chapeuPalha";
  }

  private hatWidth(style: CharacterHairStyle): number {
    if (style === "chapeuPalha") return 28;
    if (style === "chapeu") return 22;
    return 18;
  }

  private hatHeight(style: CharacterHairStyle): number {
    return style === "bone" ? 5 : style === "chapeuPalha" ? 7 : 6;
  }

  private hatBrimWidth(style: CharacterHairStyle): number {
    if (style === "chapeuPalha") return 34;
    if (style === "chapeu") return 30;
    return 21;
  }

  private hatBrimHeight(style: CharacterHairStyle): number {
    return style === "bone" ? 4 : 5;
  }

  private hatColor(style: CharacterHairStyle): number {
    if (style === "bone") return 0x2f6e8d;
    if (style === "chapeuPalha") return 0xd8b06b;
    return 0x7a4a24;
  }

  private positionHat(direction: Direction, bob = 0): void {
    const baseY = direction === "up" ? -25 : -24;
    const side = direction === "right" ? 1 : direction === "left" ? -1 : 0;
    const brimX = this.hairStyle === "bone" ? side * 6 : 0;
    const brimY = this.hairStyle === "bone" && direction === "down" ? -22 : baseY + 2;

    this.hatBrim.setPosition(brimX, brimY - bob);
    this.hat.setPosition(0, baseY - 2 - bob);
    this.hatBand.setPosition(0, baseY - 2 - bob);
  }

  private detailColor(style: CharacterOutfitStyle): number {
    if (style === "camisa" || style === "alca") return 0xfff7dc;
    if (style === "casaco") return 0x263027;
    if (style === "fazenda") return 0x8d5627;
    return 0xf4cc58;
  }
}
