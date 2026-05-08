export type Weather = "ensolarado" | "chuvoso" | "seco" | "nublado";
export type TileType = "grass" | "path" | "plot" | "house" | "tree" | "fence";
export type ToolId = "hoe" | "seed" | "water" | "fertilizer" | "pesticide" | "harvest";
export type CBRAction = "preparar_solo" | "plantar" | "regar" | "adubar" | "tratar_pragas" | "colher" | "esperar";
export type Soil = "normal" | "seco" | "encharcado" | "pobre";
export type Moisture = "baixa" | "media" | "alta";
export type PestLevel = "nenhuma" | "baixa" | "media" | "alta";
export type Growth = "semente" | "broto" | "medio" | "adulto";
export type Health = "saudavel" | "amarelada" | "murcha" | "com_manchas";
export type PlantStage = "vazio" | "preparado" | "plantado" | "crescendo" | "pronto";
export type CropVisualStage = "empty" | "prepared" | "seed" | "sprout" | "middle" | "adult" | "problem" | "ready";
export type CBRResult = "melhorou" | "melhorou_parcialmente" | "piorou" | "colheu" | "sem_efeito";
export type Direction = "up" | "down" | "left" | "right";

export interface Vector2Like {
  x: number;
  y: number;
}

export interface InventoryState {
  seeds: number;
  harvests: number;
  coins: number;
  currentTool: ToolId;
}

export interface CropPlotState {
  id: string;
  x: number;
  y: number;
  stage: CropVisualStage;
  previousStage: CropVisualStage;
  age: number;
  soil: Soil;
  moisture: Moisture;
  pests: PestLevel;
  growth: Growth;
  health: Health;
  daysDry: number;
  visualSeed: number;
  fertilizedUntilDay?: number;
}

export interface CBRCase {
  id: string;
  clima: Weather;
  solo: Soil;
  umidade: Moisture;
  pragas: PestLevel;
  crescimento: Growth;
  saude: Health;
  estagioPlanta: PlantStage;
  acaoAplicada: CBRAction;
  resultado: CBRResult;
  explicacao: string;
  criadoEm?: string;
}

export interface CBRCurrentCase extends Omit<CBRCase, "id" | "acaoAplicada" | "resultado" | "explicacao" | "criadoEm"> {}

export interface SimilarityResult {
  score: number;
  percentage: number;
  matches: Record<keyof CBRCurrentCase, boolean>;
}

export interface CBRAnalysis {
  currentCase: CBRCurrentCase;
  retrievedCase: CBRCase;
  similarity: SimilarityResult;
  reusedAction: CBRAction;
  recommendedAction: CBRAction;
  adaptations: string[];
  explanation: string;
}

export interface PendingLearningCase {
  plotId: string;
  caseData: CBRCurrentCase;
  beforePlot: CropPlotState;
  action: CBRAction;
  actionImmediateResult?: CBRResult;
}

export interface PlayerSaveState {
  x: number;
  y: number;
  facing: Direction;
}

export interface GameSaveState {
  version: number;
  day: number;
  weather: Weather;
  inventory: InventoryState;
  player: PlayerSaveState;
  crops: Record<string, CropPlotState>;
  pendingCases: PendingLearningCase[];
}

export interface ActionResult {
  ok: boolean;
  action: CBRAction;
  message: string;
  result?: CBRResult;
}

export interface DaySummary {
  grown: number;
  problems: number;
  retained: number;
  lastResult?: CBRResult;
}
