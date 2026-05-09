import { cropTypeOrder, cropTypes } from "../data/cropTypes";
import { fishTypeOrder, fishTypes } from "../data/fishTypes";
import { actionLabels, resultLabels, toolLabels, weatherLabels } from "../data/gameData";
import type { CBRAnalysis, CBRResult, CropType, EconomyState, FishTypeId, InventoryState, ToolId, Weather } from "../types";

type MessageType = "info" | "success" | "warning" | "error" | "cbr";

interface MessageOptions {
  duration?: number;
  persistent?: boolean;
  type?: MessageType;
}

interface UIElements {
  day: HTMLElement;
  weather: HTMLElement;
  coins: HTMLElement;
  seeds: HTMLElement;
  selectedCrop: HTMLElement;
  selectedCropIcon: HTMLElement;
  harvests: HTMLElement;
  fish: HTMLElement;
  tool: HTMLElement;
  message: HTMLElement;
  assistantText: HTMLElement;
  assistantSimilarity: HTMLElement;
  assistantAction: HTMLElement;
  assistantCycle: HTMLElement;
  assistantPanel: HTMLElement;
  toolButtons: HTMLElement;
  seedButtons: HTMLElement;
  askButton: HTMLButtonElement;
  nextDayButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  muteButton: HTMLButtonElement;
  shopModal: HTMLElement;
  shopClose: HTMLButtonElement;
  shopSeeds: HTMLElement;
  shopHarvests: HTMLElement;
  shopFish: HTMLElement;
  marketEvent: HTMLElement;
  houseModal: HTMLElement;
  houseClose: HTMLButtonElement;
  houseSleep: HTMLButtonElement;
  pauseModal: HTMLElement;
  pauseClose: HTMLButtonElement;
  pauseSave: HTMLButtonElement;
  pauseFullscreen: HTMLButtonElement;
}

interface UIActions {
  onAskAssistant: () => void;
  onNextDay: () => void;
  onSave: () => void;
  onReset: () => void;
  onToggleMute: () => void;
  onSelectTool: (tool: ToolId) => void;
  onSelectCrop: (cropType: CropType) => void;
  onBuySeed: (cropType: CropType) => void;
  onSellCrop: (cropType: CropType) => void;
  onSellFish: (fishId: FishTypeId) => void;
  onSleep: () => void;
  onFullscreen: () => void;
}

const defaultDurations: Record<MessageType, number> = {
  info: 4500,
  success: 5200,
  warning: 5000,
  error: 3800,
  cbr: 8000,
};

const messageTypeClasses: MessageType[] = ["info", "success", "warning", "error", "cbr"];

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento de UI não encontrado: ${id}`);
  return element as T;
}

function totalFish(inventory: InventoryState): number {
  return fishTypeOrder.reduce((sum, id) => sum + inventory.fishStock[id], 0);
}

function trendSymbol(trend: string): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export class UISystem {
  private readonly elements: UIElements;
  private readonly actions: UIActions;
  private messageTimeout = 0;
  private messageClearTimeout = 0;
  private latestInventory?: InventoryState;
  private latestEconomy?: EconomyState;

  constructor(actions: UIActions) {
    this.actions = actions;
    this.elements = {
      day: getElement("hud-day"),
      weather: getElement("hud-weather"),
      coins: getElement("hud-coins"),
      seeds: getElement("hud-seeds"),
      selectedCrop: getElement("hud-selected-crop"),
      selectedCropIcon: getElement("hud-crop-icon"),
      harvests: getElement("hud-harvests"),
      fish: getElement("hud-fish"),
      tool: getElement("hud-tool"),
      message: getElement("game-message"),
      assistantText: getElement("assistant-text"),
      assistantSimilarity: getElement("assistant-similarity"),
      assistantAction: getElement("assistant-action"),
      assistantCycle: getElement("assistant-cycle"),
      assistantPanel: getElement("assistant-panel"),
      toolButtons: getElement("tool-buttons"),
      seedButtons: getElement("seed-buttons"),
      askButton: getElement<HTMLButtonElement>("ask-cbr"),
      nextDayButton: getElement<HTMLButtonElement>("next-day"),
      saveButton: getElement<HTMLButtonElement>("save-game"),
      resetButton: getElement<HTMLButtonElement>("reset-game"),
      muteButton: getElement<HTMLButtonElement>("mute-audio"),
      shopModal: getElement("shop-modal"),
      shopClose: getElement<HTMLButtonElement>("shop-close"),
      shopSeeds: getElement("shop-seeds"),
      shopHarvests: getElement("shop-harvests"),
      shopFish: getElement("shop-fish"),
      marketEvent: getElement("market-event"),
      houseModal: getElement("house-modal"),
      houseClose: getElement<HTMLButtonElement>("house-close"),
      houseSleep: getElement<HTMLButtonElement>("house-sleep"),
      pauseModal: getElement("pause-modal"),
      pauseClose: getElement<HTMLButtonElement>("pause-close"),
      pauseSave: getElement<HTMLButtonElement>("pause-save"),
      pauseFullscreen: getElement<HTMLButtonElement>("pause-fullscreen"),
    };

    this.elements.askButton.addEventListener("click", actions.onAskAssistant);
    this.elements.nextDayButton.addEventListener("click", actions.onNextDay);
    this.elements.saveButton.addEventListener("click", actions.onSave);
    this.elements.resetButton.addEventListener("click", actions.onReset);
    this.elements.muteButton.addEventListener("click", actions.onToggleMute);
    this.elements.shopClose.addEventListener("click", () => this.hideShop());
    this.elements.houseClose.addEventListener("click", () => this.hideHouse());
    this.elements.houseSleep.addEventListener("click", actions.onSleep);
    this.elements.pauseClose.addEventListener("click", () => this.hidePause());
    this.elements.pauseSave.addEventListener("click", actions.onSave);
    this.elements.pauseFullscreen.addEventListener("click", actions.onFullscreen);

    this.elements.toolButtons.querySelectorAll<HTMLButtonElement>("button[data-tool]").forEach((button) => {
      button.addEventListener("click", () => actions.onSelectTool(button.dataset.tool as ToolId));
    });

    this.hideMessage(true);
  }

  sync(day: number, weather: Weather, inventory: InventoryState, economy?: EconomyState): void {
    this.latestInventory = inventory;
    this.latestEconomy = economy;
    const crop = cropTypes[inventory.selectedCrop];

    this.elements.day.textContent = String(day);
    this.elements.weather.textContent = weatherLabels[weather];
    this.elements.coins.textContent = String(inventory.coins);
    this.elements.seeds.textContent = String(inventory.seeds);
    this.elements.harvests.textContent = String(inventory.harvests);
    this.elements.fish.textContent = String(totalFish(inventory));
    this.elements.selectedCrop.textContent = crop.name;
    this.elements.selectedCropIcon.textContent = crop.icon;
    this.elements.tool.textContent = toolLabels[inventory.currentTool];

    this.elements.toolButtons.querySelectorAll<HTMLButtonElement>("button[data-tool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tool === inventory.currentTool);
    });

    this.renderSeedButtons(inventory);
    if (economy) this.renderShop(inventory, economy);
  }

  syncSound(muted: boolean): void {
    this.elements.muteButton.textContent = muted ? "Som: desligado" : "Som: ligado";
    this.elements.muteButton.classList.toggle("is-muted", muted);
  }

  showInitialHint(): void {
    this.showMessage("Explore a fazenda. Clique nos canteiros, use E nos prédios, TAB troca sementes e Q chama o Assistente CBR.", {
      duration: 6500,
      type: "info",
    });
  }

  showShop(): void {
    this.elements.shopModal.classList.remove("is-hidden");
    if (this.latestInventory && this.latestEconomy) this.renderShop(this.latestInventory, this.latestEconomy);
  }

  hideShop(): void {
    this.elements.shopModal.classList.add("is-hidden");
  }

  showHouse(): void {
    this.elements.houseModal.classList.remove("is-hidden");
  }

  hideHouse(): void {
    this.elements.houseModal.classList.add("is-hidden");
  }

  togglePause(): void {
    this.elements.pauseModal.classList.toggle("is-hidden");
  }

  hidePause(): void {
    this.elements.pauseModal.classList.add("is-hidden");
  }

  showMessage(message: string, options: MessageOptions = {}): void {
    const type = options.type ?? "info";
    const duration = options.duration ?? defaultDurations[type];

    this.clearMessageTimer();
    this.clearMessageClasses();
    this.elements.message.classList.add(`is-${type}`);
    this.elements.message.classList.remove("is-hidden");
    this.elements.message.textContent = message;

    if (!options.persistent) {
      this.messageTimeout = window.setTimeout(() => this.hideMessage(), duration);
    }
  }

  clearMessageTimer(): void {
    if (this.messageTimeout) {
      window.clearTimeout(this.messageTimeout);
      this.messageTimeout = 0;
    }

    if (this.messageClearTimeout) {
      window.clearTimeout(this.messageClearTimeout);
      this.messageClearTimeout = 0;
    }
  }

  showAssistantWaiting(): void {
    this.elements.assistantText.textContent = "Chegue perto de um canteiro e pressione Q. Eu comparo clima, solo, pragas e cultura com experiências antigas.";
    this.elements.assistantSimilarity.textContent = "--";
    this.elements.assistantAction.textContent = "--";
    this.elements.assistantCycle.textContent = "aguardando";
  }

  showNoPlot(): void {
    this.elements.assistantText.textContent = "Preciso que você fique sobre, de frente ou clique em um canteiro para analisar a plantação.";
    this.elements.assistantSimilarity.textContent = "--";
    this.elements.assistantAction.textContent = "--";
    this.elements.assistantCycle.textContent = "sem canteiro";
  }

  showFishingTip(text: string): void {
    this.elements.assistantText.textContent = text;
    this.elements.assistantSimilarity.textContent = "--";
    this.elements.assistantAction.textContent = "pescar";
    this.elements.assistantCycle.textContent = "dica";
    this.flashAssistantPanel();
  }

  showAssistantThinking(): void {
    this.elements.assistantText.textContent = "Analisando o canteiro... procurando uma experiência parecida na memória CBR.";
    this.elements.assistantSimilarity.textContent = "...";
    this.elements.assistantAction.textContent = "...";
    this.elements.assistantCycle.textContent = "Retrieve";
    this.flashAssistantPanel();
  }

  showAnalysis(analysis: CBRAnalysis): void {
    this.elements.assistantText.textContent = analysis.explanation;
    this.elements.assistantSimilarity.textContent = `${analysis.similarity.percentage}%`;
    this.elements.assistantAction.textContent = actionLabels[analysis.recommendedAction];
    this.elements.assistantCycle.textContent = "Retrieve > Reuse > Revise";
    this.flashAssistantPanel();
  }

  showRetain(learnedCount: number, result: CBRResult): void {
    this.elements.assistantCycle.textContent = `Retain: ${learnedCount} casos`;
    this.elements.assistantText.textContent = `Nova experiência salva na memória CBR. Resultado registrado: ${resultLabels[result]}. Vou usar isso nas próximas recomendações.`;
    this.flashAssistantPanel();
  }

  private renderSeedButtons(inventory: InventoryState): void {
    this.elements.seedButtons.innerHTML = "";
    cropTypeOrder.forEach((id) => {
      const crop = cropTypes[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = inventory.selectedCrop === id ? "is-active" : "";
      button.innerHTML = `<strong>${crop.icon}</strong><span>${crop.name}</span><em>${inventory.seedStock[id]}</em>`;
      button.addEventListener("click", () => this.actions.onSelectCrop(id));
      this.elements.seedButtons.appendChild(button);
    });
  }

  private renderShop(inventory: InventoryState, economy: EconomyState): void {
    this.elements.marketEvent.textContent = economy.eventText;
    this.elements.shopSeeds.innerHTML = "";
    this.elements.shopHarvests.innerHTML = "";
    this.elements.shopFish.innerHTML = "";

    cropTypeOrder.forEach((id) => {
      const crop = cropTypes[id];
      const seedButton = document.createElement("button");
      seedButton.type = "button";
      seedButton.innerHTML = `<strong>${crop.icon} ${crop.name}</strong><span>Semente: ${Math.round(crop.seedPrice)} moedas · estoque ${economy.shopSeedStock[id]}</span>`;
      seedButton.addEventListener("click", () => this.actions.onBuySeed(id));
      this.elements.shopSeeds.appendChild(seedButton);

      const cropButton = document.createElement("button");
      cropButton.type = "button";
      cropButton.innerHTML = `<strong>${crop.icon} ${crop.name}</strong><span>${inventory.harvestStock[id]} un. · ${economy.prices[id]} moedas <b class="trend-${economy.trends[id]}">${trendSymbol(economy.trends[id])}</b></span>`;
      cropButton.addEventListener("click", () => this.actions.onSellCrop(id));
      this.elements.shopHarvests.appendChild(cropButton);
    });

    fishTypeOrder.forEach((id) => {
      const fish = fishTypes[id];
      const fishButton = document.createElement("button");
      fishButton.type = "button";
      fishButton.innerHTML = `<strong>${fish.icon} ${fish.name}</strong><span>${inventory.fishStock[id]} un. · ${economy.prices[id]} moedas <b class="trend-${economy.trends[id]}">${trendSymbol(economy.trends[id])}</b></span>`;
      fishButton.addEventListener("click", () => this.actions.onSellFish(id));
      this.elements.shopFish.appendChild(fishButton);
    });
  }

  private hideMessage(immediate = false): void {
    this.elements.message.classList.add("is-hidden");
    if (immediate) {
      this.elements.message.textContent = "";
      return;
    }

    this.messageClearTimeout = window.setTimeout(() => {
      if (this.elements.message.classList.contains("is-hidden")) this.elements.message.textContent = "";
    }, 220);
  }

  private clearMessageClasses(): void {
    messageTypeClasses.forEach((type) => this.elements.message.classList.remove(`is-${type}`));
  }

  private flashAssistantPanel(): void {
    this.elements.assistantPanel.classList.remove("is-glowing");
    void this.elements.assistantPanel.offsetWidth;
    this.elements.assistantPanel.classList.add("is-glowing");
  }
}
