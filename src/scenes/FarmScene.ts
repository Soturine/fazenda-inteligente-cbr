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
import { WaterSystem } from "../systems/WaterSystem";
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

const DAY_CYCLE_DURATION_MS = 7 * 60 * 1000;
const MORNING_PROGRESS = 0.08;

type DayAdvanceSource = "sleep" | "shortcut" | "natural";

type DebugWindow = Window & {
  valeDosCasosGame?: FarmScene;
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
  private interactionPrompt?: Phaser.GameObjects.Text;
  private fishingPrompt?: Phaser.GameObjects.Text;
  private lastRenderTime = 0;
  private customization!: CharacterCustomization;
  private lastContextHint = "";
  private lastFishingPhase = "";
  private dayCycleStartedAt = 0;
  private lastDayCycleProgress = 0;
  private dayAdvanceInProgress = false;
  private readonly dayCycleDurationMs = DAY_CYCLE_DURATION_MS;

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
    if (this.weather.weather === "chuvoso") this.crops.applyRainMoisture();
    this.dayCycleStartedAt = this.time.now;
    this.lastDayCycleProgress = 0;

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
    this.createWorldLabels();

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
      onMainMenu: () => this.returnToMainMenu(),
    });
    this.ui.showAssistantWaiting();
    this.ui.syncSound(this.audio.isMuted);
    this.ui.showInitialHint();
    this.syncUI();

    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));
    (window as DebugWindow).valeDosCasosGame = this;
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
    this.updateInteractionPrompt(time);
    this.updateFishingVisuals(time);
    this.effects.updateWeather(time, this.weather.weather);
    this.updateDayCycle(time);
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
    this.inventory.setTool("seed");
    this.player.setTool("seed");
    this.syncUI();
    this.ui.showMessage(`Semente selecionada: ${cropTypes[cropType].name}. Ferramenta alterada para Semente.`, { duration: 4200, type: "info" });
  }

  cycleCrop(): void {
    const cropType = this.inventory.cycleSelectedCrop();
    this.inventory.setTool("seed");
    this.player.setTool("seed");
    this.syncUI();
    this.ui.showMessage(`Semente selecionada: ${cropTypes[cropType].name}. Ferramenta alterada para Semente.`, { duration: 4200, type: "info" });
  }

  useTool(): void {
    const currentTile = this.playerSystem.getCurrentTile();
    const facingTile = this.playerSystem.getFacingTile();
    const target = this.getTargetPlotInfo();

    if (this.map.isNearHouseDoor(currentTile) || this.map.isNearHouseDoor(facingTile)) {
      this.ui.showHouse();
      this.audio.play("click");
      return;
    }

    if (target && this.inventory.currentTool !== "fishingRod") {
      this.applyToolToPlot(target);
      return;
    }

    const signKind = this.map.getSignKind(currentTile) ?? this.map.getSignKind(facingTile);
    if (signKind) {
      this.showSignTip(signKind);
      return;
    }

    if (this.map.isNearSellBox(currentTile) || this.map.isNearSellBox(facingTile)) {
      this.ui.showSellBox();
      this.audio.play("click");
      return;
    }

    if (this.map.isNearShop(currentTile) || this.map.isNearShop(facingTile)) {
      this.ui.showShop();
      this.audio.play("click");
      return;
    }

    if (this.inventory.currentTool === "fishingRod") {
      this.tryFishing(currentTile);
      return;
    }

    if (this.map.isNearWater(currentTile) || this.map.isNearWater(facingTile)) {
      this.ui.showMessage("Equipe a vara de pesca para pescar aqui.", { type: "info", duration: 3600 });
      return;
    }

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

      if (this.map.isNearShop(currentTile) || this.map.isNearSellBox(currentTile)) {
        this.showMarketCbrTip();
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
      this.preventImpossibleCbrAction(analysis, target.plot);
      this.ui.showAnalysis(analysis);
      const marketInsight = this.marketInsightForCase(currentCase);
      if (marketInsight) this.ui.appendAssistantText(marketInsight);
      this.effects.playCbrRecommendation(target.tile, this.map.assistantTile);
      this.ui.showMessage(`O espantalho recomendou: ${actionLabels[analysis.recommendedAction]}.`, { duration: 8000, type: "cbr" });
    });
  }

  nextDay(): void {
    this.advanceDay("shortcut");
  }

  private advanceDay(source: DayAdvanceSource): void {
    if (this.dayAdvanceInProgress && source !== "sleep") return;
    this.dayAdvanceInProgress = true;
    this.effects.playDayTransition();
    this.audio.play("nextDay");
    const summary = this.dayNight.advanceDay(this.crops, this.weather, this.cbr, this.pendingCases);
    this.pendingCases = [];
    this.economy.advanceDay(this.dayNight.currentDay, this.weather.weather);
    this.dayCycleStartedAt = this.time.now - this.dayCycleDurationMs * MORNING_PROGRESS;
    this.lastDayCycleProgress = MORNING_PROGRESS;
    this.renderCrops(this.lastRenderTime);
    this.saveGame(false);
    this.syncUI();
    this.weatherVisual.resetToMorning(this.weather.weather);
    this.map.render(this.mapGraphics, this.lastRenderTime, this.weather.weather);

    let message = source === "natural"
      ? `Amanheceu! Dia ${this.dayNight.currentDay}: clima ${weatherLabels[this.weather.weather]}. ${summary.grown} planta(s) cresceram.`
      : `Dia ${this.dayNight.currentDay}: clima ${weatherLabels[this.weather.weather]}. ${summary.grown} planta(s) cresceram.`;
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

    this.time.delayedCall(650, () => {
      this.dayAdvanceInProgress = false;
    });
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
    this.audio.syncWeather(this.weather.weather);
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
    const fishingTile = this.map.isWaterTile(facingTile.x, facingTile.y) ? facingTile : WaterSystem.nearestWaterTile(playerTile);

    if (!fishingTile || (!this.map.isNearWater(playerTile) && !this.map.isNearWater(facingTile))) {
      this.ui.showMessage("Aproxime-se do lago para pescar.", { type: "warning" });
      this.audio.play("error");
      return;
    }

    this.player.playToolAction("fishingRod");
    const outcome = this.fishing.use(this.weather.weather, this.lastRenderTime, fishingTile);

    if (outcome.phase === "casting") {
      this.effects.playFishingCastFromPlayer(this.player.getFishingRodTip(), fishingTile, false);
      this.audio.play("fish");
    } else if (outcome.phase === "hooked" || outcome.phase === "waiting" || outcome.phase === "approaching") {
      this.audio.play("click");
    }

    this.ui.showMessage(outcome.message, { type: outcome.ok ? "success" : "warning", duration: outcome.ok ? 5600 : 4200 });

    if (outcome.ok && outcome.fishId) {
      this.effects.playFishingCatch(fishingTile, true);
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

  private updateDayCycle(time: number): void {
    if (this.dayAdvanceInProgress) return;

    const progress = this.getDayCycleProgress(time);
    if (this.lastDayCycleProgress > 0.92 && progress < 0.08) {
      this.advanceDay("natural");
      return;
    }

    this.weatherVisual.syncDayProgress(progress);
    this.lastDayCycleProgress = progress;
  }

  private getDayCycleProgress(time: number): number {
    const elapsed = ((time - this.dayCycleStartedAt) % this.dayCycleDurationMs + this.dayCycleDurationMs) % this.dayCycleDurationMs;
    return elapsed / this.dayCycleDurationMs;
  }

  private showMarketCbrTip(): void {
    const cropIds = Object.keys(cropTypes) as CropType[];
    const best = cropIds
      .map((id) => ({ id, price: this.economy.getPrice(id), base: cropTypes[id].sellPrice }))
      .sort((a, b) => b.price / b.base - a.price / a.base)[0];
    const trend = this.economy.getTrend(best.id);
    const trendText = trend === "up" ? "subiu" : trend === "down" ? "caiu" : "está estável";
    const text = `Análise CBR de mercado: ${cropTypes[best.id].name} está com preço ${trendText} e vale ${best.price} moedas hoje. Se tiver sementes, pode ser uma boa planejar essa cultura.`;
    this.ui.showFishingTip(text);
    this.ui.showMessage(text, { duration: 7600, type: "cbr" });
    this.effects.playAssistantThinking(this.map.assistantTile);
    this.audio.play("cbr");
  }

  private marketInsightForCase(currentCase: CBRCurrentCase): string {
    if (currentCase.tipoCultura === "nenhuma") {
      const selected = this.inventory.selectedCrop;
      const price = this.economy.getPrice(selected);
      if (price > cropTypes[selected].sellPrice * 1.08 && this.inventory.data.seedStock[selected] > 0) {
        return `${cropTypes[selected].name} está valorizada hoje; pode valer plantar se o canteiro estiver pronto.`;
      }
      return "";
    }

    const price = this.economy.getPrice(currentCase.tipoCultura);
    const base = cropTypes[currentCase.tipoCultura].sellPrice;
    const trend = this.economy.getTrend(currentCase.tipoCultura);
    if (trend === "down") return `O preço de ${cropTypes[currentCase.tipoCultura].name} caiu hoje. Se puder, vender depois pode ser melhor.`;
    if (price > base * 1.08) return `${cropTypes[currentCase.tipoCultura].name} está valorizada no mercado hoje. Cuidar bem dessa planta pode dar bom retorno.`;
    return "";
  }

  private showSignTip(kind: "tutorial" | "shop" | "stats" | "lake"): void {
    if (kind === "stats") {
      this.ui.showCropGuide();
      this.audio.play("click");
      return;
    }

    const text = kind === "tutorial"
      ? "Placa: E/Espaço interage, clique esquerdo usa ferramenta no canteiro, clique direito consulta CBR e TAB troca sementes."
      : kind === "shop"
        ? "Placa da loja: os preços mudam todo dia. Venda muito um item e o preço dele pode cair."
        : "Placa do lago: equipe a vara de pesca, lance a linha e aperte E quando a boia tremer.";
    this.ui.showMessage(text, { type: "info", duration: 6500 });
    this.audio.play("click");
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
    if (this.dayAdvanceInProgress) return;
    this.dayAdvanceInProgress = true;
    this.ui.hideHouse();
    this.weatherVisual.playNightCycle();
    this.time.delayedCall(760, () => this.advanceDay("sleep"));
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const tile = this.pointerSystem.pointerTile(pointer);
    const currentTile = this.playerSystem.getCurrentTile();
    const assistant = this.map.assistantTile;

    if (this.map.isNearHouseDoor(tile) && this.pointerSystem.isInRange(currentTile, this.map.houseDoorTile, 4)) {
      this.ui.showHouse();
      this.audio.play("click");
      return;
    }

    if (this.map.isNearSellBox(tile) && this.pointerSystem.isInRange(currentTile, tile, 5)) {
      this.ui.showSellBox();
      this.audio.play("click");
      return;
    }

    if (this.map.isNearShop(tile) && this.pointerSystem.isInRange(currentTile, tile, 5)) {
      this.ui.showShop();
      this.audio.play("click");
      return;
    }

    if (this.map.isPlantingTile(tile.x, tile.y)) {
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

    if (Math.abs(tile.x - assistant.x) <= 1 && Math.abs(tile.y - assistant.y) <= 1) {
      this.askAssistant();
      return;
    }

    const signKind = this.map.getSignKind(tile);
    if (signKind && this.pointerSystem.isInRange(currentTile, tile, 4)) {
      this.showSignTip(signKind);
      return;
    }

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
    this.audio.syncWeather(this.weather.weather);
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

  private createWorldLabels(): void {
    const addLabel = (tile: Vector2Like, text: string, color = "#623819") => {
      const pos = this.map.tileToPixel(tile);
      this.add.text(pos.x, pos.y - 24, text, {
        color,
        fontFamily: "Arial",
        fontSize: "13px",
        fontStyle: "900",
        stroke: "#fff7dc",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(6);
    };

    addLabel({ x: 31, y: 7 }, "LOJA");
    addLabel({ x: 9, y: 9 }, "Caixa de venda", "#4f3520");
    addLabel(this.map.cropStatsSignTile, "Culturas", "#3f8d52");
    addLabel(this.map.tutorialSignTile, "?");
    addLabel(this.map.lakeSignTile, "Pesca", "#2f6e8d");
  }

  private updateInteractionPrompt(time: number): void {
    const currentTile = this.playerSystem.getCurrentTile();
    const facingTile = this.playerSystem.getFacingTile();
    const signKind = this.map.getSignKind(currentTile) ?? this.map.getSignKind(facingTile);
    let tile: Vector2Like | null = null;
    let label = "";
    let message = "";

    if (this.map.isNearHouseDoor(currentTile) || this.map.isNearHouseDoor(facingTile)) {
      tile = this.map.houseDoorTile;
      label = "E";
      message = "Pressione E ou Espaço para entrar em casa.";
    } else if (this.map.isNearSellBox(currentTile) || this.map.isNearSellBox(facingTile)) {
      tile = this.map.sellBoxTile;
      label = "E";
      message = "Pressione E ou Espaço para vender itens na caixa.";
    } else if (this.map.isNearShop(currentTile) || this.map.isNearShop(facingTile)) {
      tile = this.map.vendorTile;
      label = "E";
      message = "Pressione E ou Espaço para abrir a Loja da Vila.";
    } else if (this.map.isNearWater(currentTile) || this.map.isNearWater(facingTile)) {
      tile = WaterSystem.nearestWaterTile(currentTile);
      label = this.inventory.currentTool === "fishingRod" ? "E" : "7";
      message = this.inventory.currentTool === "fishingRod" ? "Pressione E ou Espaço para lançar a vara." : "Equipe a vara de pesca para pescar aqui.";
    } else if (signKind) {
      tile = signKind === "tutorial"
        ? this.map.tutorialSignTile
        : signKind === "shop"
          ? this.map.shopSignTile
          : signKind === "stats"
            ? this.map.cropStatsSignTile
            : this.map.lakeSignTile;
      label = "?";
      message = signKind === "stats"
        ? "Pressione E ou Espaço para ver estatísticas das plantas."
        : "Pressione E ou Espaço para ler a placa.";
    } else if (!this.getTargetPlotInfo() && Math.abs(currentTile.x - this.map.assistantTile.x) <= 2 && Math.abs(currentTile.y - this.map.assistantTile.y) <= 2) {
      tile = this.map.assistantTile;
      label = "Q";
      message = "Pressione Q para pedir uma recomendação CBR.";
    }

    if (!tile) {
      this.interactionPrompt?.setVisible(false);
      return;
    }

    const pos = this.map.tileToPixel(tile);
    if (!this.interactionPrompt) {
      this.interactionPrompt = this.add.text(pos.x, pos.y - 26, label, {
        backgroundColor: "rgba(255,247,220,0.95)",
        color: "#623819",
        fontFamily: "Arial",
        fontSize: "15px",
        fontStyle: "900",
        padding: { x: 7, y: 3 },
      }).setOrigin(0.5).setDepth(10);
    }

    this.interactionPrompt.setText(label).setPosition(pos.x, pos.y - 26 + Math.sin(time / 210) * 2).setVisible(true);
    if (message !== this.lastContextHint) {
      this.lastContextHint = message;
      this.ui.showMessage(message, { duration: 2600, type: "info" });
    }
  }

  private updateFishingVisuals(time: number): void {
    const phase = this.fishing.update(time);
    const bobberTile = this.fishing.bobberTile;
    if (!bobberTile) {
      this.fishingPrompt?.setVisible(false);
      this.lastFishingPhase = phase;
      return;
    }

    const pos = this.map.tileToPixel(bobberTile);
    if (!this.fishingPrompt) {
      this.fishingPrompt = this.add.text(pos.x, pos.y - 12, "", {
        color: "#fff7dc",
        fontFamily: "Arial",
        fontSize: "16px",
        fontStyle: "900",
        stroke: "#2f6e8d",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(10);
    }

    const label = phase === "hooked" ? "!" : phase === "approaching" ? "..." : phase === "waiting" ? "o" : "";
    this.fishingPrompt.setText(label).setPosition(pos.x, pos.y - 12 + Math.sin(time / 120) * 2).setVisible(Boolean(label));

    if (phase !== this.lastFishingPhase) {
      if (phase === "approaching") this.effects.playFishingBubbles(bobberTile);
      if (phase === "hooked") {
        this.effects.playFishingNibble(bobberTile);
        this.ui.showMessage("Fisgou! Pressione E ou Espaço agora para puxar.", { type: "success", duration: 1800 });
        this.audio.play("cbr");
      }
      if (phase === "failed") {
        this.ui.showMessage("O peixe fugiu. Espere um pouco e tente de novo.", { type: "warning", duration: 3600 });
        this.audio.play("error");
      }
      this.lastFishingPhase = phase;
    }
  }

  private returnToMainMenu(): void {
    this.saveGame(false);
    this.ui.hidePause();
    this.scene.start("MenuScene");
  }

  private preventImpossibleCbrAction(analysis: ReturnType<CBRSystem["analyze"]>, plot: CropPlotState): void {
    if (analysis.recommendedAction === "plantar" && (plot.stage !== "prepared" || this.inventory.data.seedStock[this.inventory.selectedCrop] <= 0)) {
      analysis.recommendedAction = "esperar";
      const cropName = cropTypes[this.inventory.selectedCrop].name;
      analysis.explanation += plot.stage !== "prepared"
        ? " Ajustei a recomendação porque este canteiro ainda não está pronto para receber uma nova semente."
        : ` Ajustei a recomendação porque você está sem sementes de ${cropName}.`;
    }

    if (analysis.recommendedAction === "colher" && plot.stage !== "ready") {
      analysis.recommendedAction = "esperar";
      analysis.explanation += " Ajustei a recomendação porque a planta ainda não está pronta para colher.";
    }

    if (analysis.recommendedAction === "regar" && plot.soil === "encharcado") {
      analysis.recommendedAction = "esperar";
      analysis.explanation += " Ajustei a recomendação porque o solo já está encharcado.";
    }

    if (analysis.recommendedAction === "tratar_pragas" && plot.pests === "nenhuma") {
      analysis.recommendedAction = "esperar";
      analysis.explanation += " Ajustei a recomendação porque não há pragas neste canteiro.";
    }

    if (analysis.recommendedAction === "adubar" && plot.soil === "normal" && plot.health === "saudavel" && typeof plot.fertilizedUntilDay === "number" && plot.fertilizedUntilDay >= this.dayNight.currentDay) {
      analysis.recommendedAction = "esperar";
      analysis.explanation += " Ajustei a recomendação porque este canteiro já está adubado e saudável.";
    }

    analysis.explanation = analysis.explanation.replace(/Minha recomendação é [^.]+\./, `Minha recomendação é ${actionLabels[analysis.recommendedAction]}.`);
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
