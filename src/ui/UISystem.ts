import { actionLabels, toolLabels, weatherLabels } from "../data/gameData";
import type { CBRAnalysis, InventoryState, ToolId, Weather } from "../types";

interface UIElements {
  day: HTMLElement;
  weather: HTMLElement;
  coins: HTMLElement;
  seeds: HTMLElement;
  harvests: HTMLElement;
  tool: HTMLElement;
  message: HTMLElement;
  assistantText: HTMLElement;
  assistantSimilarity: HTMLElement;
  assistantAction: HTMLElement;
  assistantCycle: HTMLElement;
  assistantPanel: HTMLElement;
  toolButtons: HTMLElement;
  askButton: HTMLButtonElement;
  nextDayButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  muteButton: HTMLButtonElement;
}

interface UIActions {
  onAskAssistant: () => void;
  onNextDay: () => void;
  onSave: () => void;
  onReset: () => void;
  onToggleMute: () => void;
  onSelectTool: (tool: ToolId) => void;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Elemento de UI não encontrado: ${id}`);
  }
  return element as T;
}

export class UISystem {
  private readonly elements: UIElements;
  private messageTimeout = 0;

  constructor(actions: UIActions) {
    this.elements = {
      day: getElement("hud-day"),
      weather: getElement("hud-weather"),
      coins: getElement("hud-coins"),
      seeds: getElement("hud-seeds"),
      harvests: getElement("hud-harvests"),
      tool: getElement("hud-tool"),
      message: getElement("game-message"),
      assistantText: getElement("assistant-text"),
      assistantSimilarity: getElement("assistant-similarity"),
      assistantAction: getElement("assistant-action"),
      assistantCycle: getElement("assistant-cycle"),
      assistantPanel: getElement("assistant-panel"),
      toolButtons: getElement("tool-buttons"),
      askButton: getElement<HTMLButtonElement>("ask-cbr"),
      nextDayButton: getElement<HTMLButtonElement>("next-day"),
      saveButton: getElement<HTMLButtonElement>("save-game"),
      resetButton: getElement<HTMLButtonElement>("reset-game"),
      muteButton: getElement<HTMLButtonElement>("mute-audio"),
    };

    this.elements.askButton.addEventListener("click", actions.onAskAssistant);
    this.elements.nextDayButton.addEventListener("click", actions.onNextDay);
    this.elements.saveButton.addEventListener("click", actions.onSave);
    this.elements.resetButton.addEventListener("click", actions.onReset);
    this.elements.muteButton.addEventListener("click", actions.onToggleMute);

    this.elements.toolButtons.querySelectorAll<HTMLButtonElement>("button[data-tool]").forEach((button) => {
      button.addEventListener("click", () => actions.onSelectTool(button.dataset.tool as ToolId));
    });
  }

  sync(day: number, weather: Weather, inventory: InventoryState): void {
    this.elements.day.textContent = String(day);
    this.elements.weather.textContent = weatherLabels[weather];
    this.elements.coins.textContent = String(inventory.coins);
    this.elements.seeds.textContent = String(inventory.seeds);
    this.elements.harvests.textContent = String(inventory.harvests);
    this.elements.tool.textContent = toolLabels[inventory.currentTool];

    this.elements.toolButtons.querySelectorAll<HTMLButtonElement>("button[data-tool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tool === inventory.currentTool);
    });
  }

  syncSound(muted: boolean): void {
    this.elements.muteButton.textContent = muted ? "Som: desligado" : "Som: ligado";
    this.elements.muteButton.classList.toggle("is-muted", muted);
  }

  showMessage(message: string, persistent = false): void {
    this.clearMessageTimer();
    this.elements.message.textContent = message;
    this.messageTimeout = persistent ? 0 : window.setTimeout(() => {
      this.elements.message.textContent = "WASD/setas movem. E usa ferramenta. Q consulta o Assistente CBR. N passa o dia.";
      this.messageTimeout = 0;
    }, 4500);
  }

  clearMessageTimer(): void {
    if (this.messageTimeout) {
      window.clearTimeout(this.messageTimeout);
      this.messageTimeout = 0;
    }
  }

  showAssistantWaiting(): void {
    this.elements.assistantText.textContent = "Chegue perto de um canteiro e pressione Q. Eu comparo a situação com experiências antigas.";
    this.elements.assistantSimilarity.textContent = "--";
    this.elements.assistantAction.textContent = "--";
    this.elements.assistantCycle.textContent = "aguardando";
  }

  showNoPlot(): void {
    this.elements.assistantText.textContent = "Preciso que você fique sobre ou de frente para um canteiro para analisar a plantação.";
    this.elements.assistantSimilarity.textContent = "--";
    this.elements.assistantAction.textContent = "--";
    this.elements.assistantCycle.textContent = "sem canteiro";
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

  showRetain(learnedCount: number, result: string): void {
    this.elements.assistantCycle.textContent = `Retain: ${learnedCount} casos`;
    this.elements.assistantText.textContent = `Nova experiência salva na memória CBR. Resultado registrado: ${result}. Vou usar isso nas próximas recomendações.`;
    this.flashAssistantPanel();
  }

  private flashAssistantPanel(): void {
    this.elements.assistantPanel.classList.remove("is-glowing");
    void this.elements.assistantPanel.offsetWidth;
    this.elements.assistantPanel.classList.add("is-glowing");
  }
}
