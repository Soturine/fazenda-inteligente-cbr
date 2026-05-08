import Phaser from "phaser";
import { tileSize, toolLabels } from "../data/gameData";
import { Player } from "../entities/Player";
import { Assistant } from "../entities/Assistant";
import { CBRSystem } from "../systems/CBRSystem";
import { CropSystem } from "../systems/CropSystem";
import { DayNightSystem } from "../systems/DayNightSystem";
import { EffectSystem } from "../systems/EffectSystem";
import { FarmMap } from "../systems/FarmMap";
import { InventorySystem } from "../systems/InventorySystem";
import { PlayerSystem } from "../systems/PlayerSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { SoundSystem, type GameSound } from "../systems/SoundSystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { UISystem } from "../ui/UISystem";
import type { CBRCurrentCase, CropPlotState, GameSaveState, PendingLearningCase, ToolId, Vector2Like } from "../types";
import { CropPlot } from "../entities/CropPlot";

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
  effects!: EffectSystem;
  audio!: SoundSystem;
  pendingCases: PendingLearningCase[] = [];

  private mapGraphics!: Phaser.GameObjects.Graphics;
  private cropGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private lastRenderTime = 0;

  constructor() {
    super("FarmScene");
  }

  create(): void {
    const saved = SaveSystem.loadGame();

    this.map = new FarmMap();
    this.inventory = new InventorySystem(saved?.inventory);
    this.weather = new WeatherSystem(saved?.weather ?? "ensolarado");
    this.dayNight = new DayNightSystem(saved?.day ?? 1);
    this.cbr = new CBRSystem();
    this.audio = new SoundSystem();
    this.pendingCases = saved?.pendingCases ?? [];
    this.crops = new CropSystem(this.map.plantingTiles, saved?.crops);

    this.mapGraphics = this.add.graphics().setDepth(0);
    this.cropGraphics = this.add.graphics().setDepth(2);
    this.overlayGraphics = this.add.graphics().setDepth(4);
    this.effects = new EffectSystem(this);

    this.map.render(this.mapGraphics, 0, this.weather.weather);
    this.crops.render(this.cropGraphics, this.map.tileSize, this.dayNight.currentDay, 0);

    this.assistant = new Assistant(this, this.map.assistantTile, this.map.tileSize).setDepth(3);
    this.player = new Player(this, 9.5 * tileSize, 8.5 * tileSize, saved?.player).setDepth(5) as Player;

    this.playerSystem = new PlayerSystem(this, this.player, this.map, {
      onUseTool: () => this.useTool(),
      onAskAssistant: () => this.askAssistant(),
      onNextDay: () => this.nextDay(),
      onSelectTool: (tool) => this.selectTool(tool),
    });
    this.playerSystem.createInput();

    this.ui = new UISystem({
      onAskAssistant: () => this.askAssistant(),
      onNextDay: () => this.nextDay(),
      onSave: () => this.saveGame(true),
      onReset: () => this.resetGame(),
      onToggleMute: () => this.toggleSound(),
      onSelectTool: (tool) => this.selectTool(tool),
    });
    this.ui.showAssistantWaiting();
    this.ui.syncSound(this.audio.isMuted);
    this.syncUI();

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
    this.syncUI();
    this.ui.showMessage(`Ferramenta atual: ${toolLabels[tool]}.`);
  }

  useTool(): void {
    const target = this.getTargetPlotInfo();

    if (!target) {
      this.ui.showMessage("Fique sobre ou de frente para um canteiro para usar a ferramenta.");
      this.audio.play("error");
      return;
    }

    const beforePlot = CropPlot.clone(target.plot);
    const caseData = this.cbr.createCaseFromPlot(target.plot, this.weather.weather);
    const result = this.crops.applyTool(target.plot, this.inventory.currentTool, this.inventory, this.dayNight.currentDay);

    this.ui.showMessage(result.message);

    if (result.ok) {
      this.effects.playToolEffect(this.inventory.currentTool, target.tile);
      this.audio.play(this.soundForTool(this.inventory.currentTool));
      if (result.result === "colheu") this.audio.play("coin");

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

  askAssistant(): void {
    const target = this.getTargetPlotInfo();

    if (!target) {
      this.ui.showNoPlot();
      this.ui.showMessage("O assistente precisa de um canteiro perto de você.");
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
      this.ui.showMessage(`Assistente CBR sugeriu: ${analysis.recommendedAction}.`);
    });
  }

  nextDay(): void {
    this.effects.playDayTransition();
    this.audio.play("nextDay");
    const summary = this.dayNight.advanceDay(this.crops, this.weather, this.cbr, this.pendingCases);
    this.pendingCases = [];
    this.renderCrops(this.lastRenderTime);
    this.saveGame(false);
    this.syncUI();

    let message = `Dia ${this.dayNight.currentDay}: clima ${this.weather.weather}. ${summary.grown} planta(s) cresceram.`;
    if (summary.problems > 0) {
      message += ` ${summary.problems} canteiro(s) precisam de cuidado.`;
    }
    this.ui.showMessage(message, true);

    if (summary.retained > 0 && summary.lastResult) {
      this.ui.showRetain(this.cbr.getLearnedCases().length, summary.lastResult);
      this.effects.playRetainGlow(this.map.assistantTile);
    }
  }

  saveGame(notify: boolean): void {
    SaveSystem.saveGame(this.serialize());

    if (notify) {
      this.ui.showMessage("Jogo salvo no navegador.");
    }
  }

  resetGame(): void {
    if (!window.confirm("Resetar progresso, inventário e casos aprendidos?")) {
      return;
    }

    SaveSystem.clearAll();
    this.scene.restart();
  }

  toggleSound(): void {
    const muted = this.audio.toggleMuted();
    this.ui.syncSound(muted);
    this.ui.showMessage(muted ? "Som desligado." : "Som ligado.");
  }

  getTargetPlotInfo(): TargetPlotInfo | null {
    const tile = this.playerSystem.getInteractionTile();

    if (!this.map.isPlantingTile(tile.x, tile.y)) {
      return null;
    }

    const plot = this.crops.getPlotByTile(tile.x, tile.y);
    return plot ? { tile, plot } : null;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const tile = this.map.pixelToTile(pointer.worldX, pointer.worldY);
    const assistant = this.map.assistantTile;

    if (Math.abs(tile.x - assistant.x) <= 1 && Math.abs(tile.y - assistant.y) <= 1) {
      this.askAssistant();
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
  }

  private syncUI(): void {
    this.ui.sync(this.dayNight.currentDay, this.weather.weather, this.inventory.data);
  }

  private soundForTool(tool: ToolId): GameSound {
    const sounds: Record<ToolId, GameSound> = {
      hoe: "hoe",
      seed: "seed",
      water: "water",
      fertilizer: "fertilizer",
      pesticide: "pesticide",
      harvest: "harvest",
    };
    return sounds[tool];
  }

  private serialize(): GameSaveState {
    return {
      version: 2,
      day: this.dayNight.currentDay,
      weather: this.weather.weather,
      inventory: this.inventory.serialize(),
      player: this.player.serialize(),
      crops: this.crops.serialize(),
      pendingCases: this.pendingCases,
    };
  }
}
