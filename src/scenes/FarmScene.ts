import Phaser from "phaser";
import { cropTypes } from "../data/cropTypes";
import { fishTypes } from "../data/fishTypes";
import { actionLabels, resultLabels, tileSize, toolLabels, weatherLabels } from "../data/gameData";
import { Assistant } from "../entities/Assistant";
import { CropPlot } from "../entities/CropPlot";
import { Player } from "../entities/Player";
import { CBRSystem } from "../systems/CBRSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { CharacterCustomizationSystem } from "../systems/CharacterCustomizationSystem";
import { CropSystem } from "../systems/CropSystem";
import { DayNightSystem } from "../systems/DayNightSystem";
import { EconomySystem } from "../systems/EconomySystem";
import { EffectSystem } from "../systems/EffectSystem";
import { FarmMap } from "../systems/FarmMap";
import { FishingSystem } from "../systems/FishingSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { PlayerSystem } from "../systems/PlayerSystem";
import { PointerInteractionSystem } from "../systems/PointerInteractionSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { ShopSystem } from "../systems/ShopSystem";
import { SoundSystem, type GameSound } from "../systems/SoundSystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { WeatherVisualSystem } from "../systems/WeatherVisualSystem";
import { UISystem } from "../ui/UISystem";
import type {
  CBRCurrentCase,
  CharacterCustomization,
  CropPlotState,
  CropType,
  FishTypeId,
  GameSaveState,
  PendingLearningCase,
  ToolId,
  Vector2Like,
} from "../types";

interface TargetPlotInfo {
  tile: Vector2Like;
  plot: CropPlotState;
}

type DebugWindow = Window & {
  fazendinhaGame?: FarmScene;
};

export class FarmScene extends Phaser.Scene {
  map!: FarmMap;
  crops!: CropSystem;
  inventory!: InventorySystem;
  weather!: WeatherSystem;
  dayNight!: DayNightSystem;
  cbr!: CBRSystem;
  ui!: UISystem;
  player!: Player;
  assistant!: Assistant;
  playerSystem!: PlayerSystem;
  pointerSystem!: PointerInteractionSystem;
  effects!: EffectSystem;
  audio!: SoundSystem;
  economy!: EconomySystem;
  shop!: ShopSystem;
  fishing!: FishingSystem;
  weatherVisual!: WeatherVisualSystem;
  pendingCases: PendingLearningCase[] = [];

  private mapGraphics!: Phaser.GameObjects.Graphics;
  private cropGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private lastRenderTime = 0;
  private customization!: CharacterCustomization;

  constructor() {
    super("FarmScene");
  }

  create(): void {
    const saved = SaveSystem.loadGame();
    this.customization = CharacterCustomizationSystem.load();

    this.map = new FarmMap();
    this.inventory = new InventorySystem(saved?.inventory);
    this.weather = new WeatherSystem(saved?.weather ?? "ensolarado");
    this.dayNight = new DayNightSystem(saved?.day ?? 1);
    this.economy = new EconomySystem(saved?.economy, this.dayNight.currentDay, this.weather.weather);
    this.shop = new ShopSystem(this.inventory, this.economy);
    this.fishing = new FishingSystem(this.inventory);
    this.cbr = new CBRSystem();
    this.audio = new SoundSystem();
    this.weatherVisual = new WeatherVisualSystem();
    this.pendingCases = saved?.pendingCases ?? [];
    this.crops = new CropSystem(this.map.plantingTiles, saved?.crops);

    this.mapGraphics = this.add.graphics().setDepth(0);
    this.cropGraphics = this.add.graphics().setDepth(2);
    this.overlayGraphics = this.add.graphics().setDepth(4);
    this.effects = new EffectSystem(this);
    this.pointerSystem = new PointerInteractionSystem(this, this.map);

    this.map.render(this.mapGraphics, 0, this.weather.weather);
    this.crops.render(this.cropGraphics, this.map.tileSize, this.dayNight.currentDay, 0);

    this.assistant = new Assistant(this, this.map.assistantTile, this.map.tileSize).setDepth(3);
    this.player = new Player(this, 9.5 * tileSize, 10.5 * tileSize, saved?.player, this.customization).setDepth(5) as Player;
    this.player.setTool(this.inventory.currentTool);

    CameraSystem.setup(this, this.map, this.player);

    this.playerSystem = new PlayerSystem(this, this.player, this.map, {
      onUseTool: () => this.useTool(),
      onAskAssistant: () => this.askAssistant(),
      onNextDay: () => this.openHouseOrSleep(),
      onSelectTool: (tool) => this.selectTool(tool),
      onCycleCrop: () => this.cycleCrop(),
      onPause: () => this.ui.togglePause(),
    });
    this.playerSystem.createInput();

    this.ui = new UISystem({
      onAskAssistant: () => this.askAssistant(),
      onNextDay: () => this.openHouseOrSleep(),
      onSave: () => this.saveGame(true),
      onReset: () => this.resetGame(),
      onToggleMute: () => this.toggleSound(),
      onSelectTool: (tool) => this.selectTool(tool),
      onSelectCrop: (cropType) => this.selectCrop(cropType),
      onBuySeed: (cropType) => this.buySeed(cropType),
      onSellCrop: (cropType) => this.sellCrop(cropType),
      onSellFish: (fishId) => this.sellFish(fishId),
      onSleep: () => this.sleepInHouse(),
      onFullscreen: () => this.openFullscreen(),
    });
    this.ui.showAssistantWaiting();
    this.ui.syncSound(this.audio.isMuted);
    this.ui.showInitialHint();
    this.syncUI();

    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));
    (window as DebugWindow).fazendinhaGame = this;
  }

  override update(time: number, delta: number): void {
    this.lastRenderTime = time;
    this.map.render(this.mapGraphics, time, this.weather.weather);
    this.playerSystem.update(delta / 1000);
    this.player.animate(time);

    if (this.player.moving && this.effects.playStep(this.player.x, this.player.y)) {
      this.audio.play("step");
    }

    this.renderCrops(time);
    this.renderOverlay();
    this.effects.updateWeather(time, this.weather.weather);
    this.effects.showTargetIndicator(this.getTargetPlotInfo()?.tile ?? null);
  }

  selectTool(tool: ToolId): void {
    this.inventory.setTool(tool);
    this.player.setTool(tool);
    this.syncUI();
    this.ui.showMessage(`Ferramenta atual: ${toolLabels[tool]}.`, { duration: 3200, type: "info" });
  }

  selectCrop(cropType: CropType): void {
    this.inventory.setSelectedCrop(cropType);
    this.syncUI();
    this.ui.showMessage(`Semente selecionada: ${cropTypes[cropType].name}.`, { duration: 3600, type: "info" });
  }

  cycleCrop(): void {
    const cropType = this.inventory.cycleSelectedCrop();
    this.syncUI();
    this.ui.showMessage(`Semente selecionada: ${cropTypes[cropType].name}.`, { duration: 3600, type: "info" });
  }

  useTool(): void {
    const currentTile = this.playerSystem.getCurrentTile();
    const facingTile = this.playerSystem.getFacingTile();

    if (this.map.isNearHouseDoor(currentTile) || this.map.isNearHouseDoor(facingTile)) {
      this.ui.showHouse();
      this.audio.play("click");
      return;
    }

    if (this.map.isNearShop(currentTile) || this.map.isNearShop(facingTile) || this.map.isNearSellBox(currentTile)) {
      this.ui.showShop();
      this.audio.play("click");
      return;
    }

    if (this.inventory.currentTool === "fishingRod") {
      this.tryFishing(currentTile);
      return;
    }

    const target = this.getTargetPlotInfo();
    if (!target) {
      this.ui.showMessage("Fique sobre, de frente ou clique em um canteiro para usar a ferramenta.", { type: "error" });
      this.audio.play("error");
      return;
    }

    this.applyToolToPlot(target);
  }

  askAssistant(targetOverride?: TargetPlotInfo): void {
    const target = targetOverride ?? this.getTargetPlotInfo();

    if (!target) {
      const currentTile = this.playerSystem.getCurrentTile();
      if (this.map.isNearWater(currentTile)) {
        this.showFishingCbrTip();
        return;
      }

      this.ui.showNoPlot();
      this.ui.showMessage("O assistente precisa de um canteiro perto de você.", { type: "error" });
      this.audio.play("error");
      return;
    }

    const currentCase: CBRCurrentCase = this.cbr.createCaseFromPlot(target.plot, this.weather.weather);
    this.ui.showAssistantThinking();
    this.effects.playAssistantThinking(this.map.assistantTile);
    this.assistant.pulse();
    this.audio.play("cbr");

    this.time.delayedCall(450, () => {
      const analysis = this.cbr.analyze(currentCase);
      this.ui.showAnalysis(analysis);
      this.effects.playCbrRecommendation(target.tile, this.map.assistantTile);
      this.ui.showMessage(`O espantalho recomendou: ${actionLabels[analysis.recommendedAction]}.`, { duration: 8000, type: "cbr" });
    });
  }

  nextDay(): void {
    this.effects.playDayTransition();
    this.audio.play("nextDay");
    const summary = this.dayNight.advanceDay(this.crops, this.weather, this.cbr, this.pendingCases);
    this.pendingCases = [];
    this.economy.advanceDay(this.dayNight.currentDay, this.weather.weather);
    this.renderCrops(this.lastRenderTime);
    this.saveGame(false);
    this.syncUI();

    let message = `Dia ${this.dayNight.currentDay}: clima ${weatherLabels[this.weather.weather]}. ${summary.grown} planta(s) cresceram.`;
    if (summary.problems > 0) {
      message += ` ${summary.problems} canteiro(s) precisam de cuidado.`;
    }
    message += ` ${this.economy.data.eventText}`;
    this.ui.showMessage(message, { duration: 7200, type: summary.problems > 0 ? "warning" : "success" });

    if (summary.retained > 0 && summary.lastResult) {
      this.ui.showRetain(this.cbr.getLearnedCases().length, summary.lastResult);
      this.effects.playRetainGlow(this.map.assistantTile);
      this.ui.showMessage(`Nova experiência salva na memória CBR: resultado ${resultLabels[summary.lastResult]}.`, { duration: 8000, type: "cbr" });
    }
  }

  saveGame(notify: boolean): void {
    SaveSystem.saveGame(this.serialize());

    if (notify) {
      this.ui.showMessage("Jogo salvo no navegador.", { duration: 3800, type: "success" });
    }
  }

  resetGame(): void {
    if (!window.confirm("Resetar progresso, inventário e casos aprendidos?")) {
      return;
    }

    SaveSystem.clearAll();
    this.scene.start("MenuScene");
  }

  toggleSound(): void {
    const muted = this.audio.toggleMuted();
    this.ui.syncSound(muted);
    this.ui.showMessage(muted ? "Som desligado." : "Som ligado.", { duration: 3000, type: "info" });
  }

  getTargetPlotInfo(): TargetPlotInfo | null {
    const tile = this.playerSystem.getInteractionTile();

    if (!this.map.isPlantingTile(tile.x, tile.y)) {
      return null;
    }

    const plot = this.crops.getPlotByTile(tile.x, tile.y);
    return plot ? { tile, plot } : null;
  }

  private applyToolToPlot(target: TargetPlotInfo): void {
    const beforePlot = CropPlot.clone(target.plot);
    const caseData = this.cbr.createCaseFromPlot(target.plot, this.weather.weather);
    const result = this.crops.applyTool(target.plot, this.inventory.currentTool, this.inventory, this.dayNight.currentDay);

    this.ui.showMessage(result.message, { type: result.ok ? "success" : "warning", duration: result.ok ? 5000 : 4000 });

    if (result.ok) {
      this.player.playToolAction(this.inventory.currentTool);
      this.effects.playToolEffect(this.inventory.currentTool, target.tile);
      this.audio.play(this.soundForTool(this.inventory.currentTool));

      if (result.result === "colheu") {
        this.audio.play("coin");
      }

      this.pendingCases.push({
        plotId: target.plot.id,
        caseData,
        beforePlot,
        action: result.action,
        actionImmediateResult: result.result,
      });
      this.renderCrops(this.lastRenderTime);
      this.saveGame(false);
    } else {
      this.effects.playInvalid(target.tile);
      this.audio.play("error");
    }

    this.syncUI();
  }

  private tryFishing(playerTile: Vector2Like): void {
    const facingTile = this.playerSystem.getFacingTile();
    const fishingTile = this.map.isWaterTile(facingTile.x, facingTile.y) ? facingTile : playerTile;

    if (!this.map.isNearWater(playerTile) && !this.map.isNearWater(facingTile)) {
      this.ui.showMessage("Aproxime-se do lago para pescar.", { type: "warning" });
      this.audio.play("error");
      return;
    }

    this.player.playToolAction("fishingRod");
    this.effects.playToolEffect("fishingRod", fishingTile);
    this.audio.play("fish");

    const outcome = this.fishing.fish(this.weather.weather, this.lastRenderTime);
    this.ui.showMessage(outcome.message, { type: outcome.ok ? "success" : "warning", duration: outcome.ok ? 5600 : 4200 });

    if (outcome.ok && outcome.fishId) {
      this.effects.playFishingCast(fishingTile, true);
      this.audio.play("coin");
      this.ui.showMessage(`${fishTypes[outcome.fishId].name} fisgado! Venda na loja quando quiser.`, { type: "success", duration: 5200 });
    }

    this.syncUI();
    this.saveGame(false);
  }

  private showFishingCbrTip(): void {
    const text = this.weather.weather === "chuvoso"
      ? "Com chuva, o lago fica mais ativo. A chance de tilápia e carpa melhora, então pescar agora é uma boa."
      : this.weather.weather === "seco"
        ? "Em clima seco, a pesca fica mais difícil. Talvez seja melhor cuidar das plantas ou vender colheitas."
        : "O lago está calmo. Se estiver com a vara equipada, dá para tentar pescar e vender na loja.";
    this.ui.showFishingTip(text);
    this.ui.showMessage(text, { duration: 7600, type: "cbr" });
    this.effects.playAssistantThinking(this.map.assistantTile);
    this.audio.play("cbr");
  }

  private buySeed(cropType: CropType): void {
    const result = this.shop.buySeed(cropType, 1);
    this.ui.showMessage(result.message, { type: result.ok ? "success" : "warning", duration: 4200 });
    this.audio.play(result.ok ? "coin" : "error");
    this.syncUI();
    this.saveGame(false);
  }

  private sellCrop(cropType: CropType): void {
    const result = this.shop.sellCrop(cropType);
    this.ui.showMessage(result.message, { type: result.ok ? "success" : "warning", duration: 4200 });
    this.audio.play(result.ok ? "coin" : "error");
    this.syncUI();
    this.saveGame(false);
  }

  private sellFish(fishId: FishTypeId): void {
    const result = this.shop.sellFish(fishId);
    this.ui.showMessage(result.message, { type: result.ok ? "success" : "warning", duration: 4200 });
    this.audio.play(result.ok ? "coin" : "error");
    this.syncUI();
    this.saveGame(false);
  }

  private openHouseOrSleep(): void {
    if (this.map.isNearHouseDoor(this.playerSystem.getCurrentTile())) {
      this.ui.showHouse();
      this.audio.play("click");
      return;
    }

    this.sleepInHouse();
  }

  private sleepInHouse(): void {
    this.ui.hideHouse();
    this.nextDay();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const tile = this.pointerSystem.pointerTile(pointer);
    const currentTile = this.playerSystem.getCurrentTile();
    const assistant = this.map.assistantTile;

    if (Math.abs(tile.x - assistant.x) <= 1 && Math.abs(tile.y - assistant.y) <= 1) {
      this.askAssistant();
      return;
    }

    if (this.map.isNearHouseDoor(tile) && this.pointerSystem.isInRange(currentTile, this.map.houseDoorTile, 4)) {
      this.ui.showHouse();
      this.audio.play("click");
      return;
    }

    if ((this.map.isNearShop(tile) || this.map.isNearSellBox(tile)) && this.pointerSystem.isInRange(currentTile, tile, 5)) {
      this.ui.showShop();
      this.audio.play("click");
      return;
    }

    if (this.map.isWaterTile(tile.x, tile.y) || this.map.isNearWater(tile)) {
      if (this.inventory.currentTool !== "fishingRod") {
        this.ui.showMessage("Equipe a vara de pesca para usar o lago.", { type: "info", duration: 3600 });
        return;
      }

      if (!this.pointerSystem.isInRange(currentTile, tile, 4)) {
        this.ui.showMessage("Chegue mais perto do lago para pescar.", { type: "warning" });
        this.audio.play("error");
        return;
      }

      this.tryFishing(currentTile);
      return;
    }

    if (!this.map.isPlantingTile(tile.x, tile.y)) {
      return;
    }

    const plot = this.crops.getPlotByTile(tile.x, tile.y);
    if (!plot) return;

    const target = { tile, plot };
    if (pointer.rightButtonDown()) {
      this.askAssistant(target);
      return;
    }

    if (!this.pointerSystem.isInRange(currentTile, tile, 4)) {
      this.ui.showMessage("Esse canteiro está longe demais. Aproxime-se para interagir.", { type: "warning" });
      this.effects.playInvalid(tile);
      this.audio.play("error");
      return;
    }

    this.applyToolToPlot(target);
  }

  private renderCrops(time = 0): void {
    this.crops.render(this.cropGraphics, this.map.tileSize, this.dayNight.currentDay, time);
  }

  private renderOverlay(): void {
    this.overlayGraphics.clear();
    const target = this.getTargetPlotInfo();

    if (target) {
      this.map.drawTileHighlight(this.overlayGraphics, target.tile);
    }

    const hover = this.pointerSystem.getHoverTile();
    if (!hover) return;

    const isActionTile = this.map.isPlantingTile(hover.x, hover.y)
      || this.map.isWaterTile(hover.x, hover.y)
      || this.map.isNearShop(hover)
      || this.map.isNearHouseDoor(hover)
      || this.map.isNearSellBox(hover);

    if (isActionTile) {
      this.map.drawTileHighlight(this.overlayGraphics, hover, 0xffe066);
    }
  }

  private syncUI(): void {
    this.ui.sync(this.dayNight.currentDay, this.weather.weather, this.inventory.data, this.economy.data);
    this.weatherVisual.sync(this.weather.weather);
  }

  private soundForTool(tool: ToolId): GameSound {
    const sounds: Record<ToolId, GameSound> = {
      hoe: "hoe",
      seed: "seed",
      water: "water",
      fertilizer: "fertilizer",
      pesticide: "pesticide",
      harvest: "harvest",
      fishingRod: "fish",
    };
    return sounds[tool];
  }

  private openFullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  private serialize(): GameSaveState {
    return {
      version: 3,
      day: this.dayNight.currentDay,
      weather: this.weather.weather,
      inventory: this.inventory.serialize(),
      player: this.player.serialize(),
      crops: this.crops.serialize(),
      pendingCases: this.pendingCases,
      economy: this.economy.serialize(),
      customization: this.customization,
    };
  }
}
