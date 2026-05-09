import type { CBRResult, ToolId, Weather } from "../types";

export const tileSize = 32;
export const mapWidth = 44;
export const mapHeight = 32;

export const toolLabels: Record<ToolId, string> = {
  hoe: "enxada",
  seed: "semente",
  water: "regador",
  fertilizer: "adubo",
  pesticide: "controle de pragas",
  harvest: "colher",
  fishingRod: "vara de pesca",
};

export const toolHotkeys: Record<string, ToolId> = {
  "1": "hoe",
  "2": "seed",
  "3": "water",
  "4": "fertilizer",
  "5": "pesticide",
  "6": "harvest",
  "7": "fishingRod",
};

export const weatherLabels: Record<Weather, string> = {
  ensolarado: "ensolarado",
  chuvoso: "chuvoso",
  seco: "seco",
  nublado: "nublado",
};

export const actionLabels = {
  preparar_solo: "preparar solo",
  plantar: "plantar",
  regar: "regar",
  adubar: "adubar",
  tratar_pragas: "tratar pragas",
  colher: "colher",
  esperar: "esperar",
} as const;

export const resultLabels: Record<CBRResult, string> = {
  colheu: "colheu",
  melhorou: "melhorou",
  melhorou_parcialmente: "melhorou parcialmente",
  sem_efeito: "sem efeito",
  piorou: "piorou",
};
