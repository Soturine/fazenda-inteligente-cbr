import type { CBRCase, GameSaveState } from "../types";

const saveKey = "fazendinha-cbr-save-vite";
const casesKey = "fazendinha-cbr-cases-vite";

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Falha ao ler ${key} no LocalStorage`, error);
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class SaveSystem {
  static readonly saveKey = saveKey;
  static readonly casesKey = casesKey;

  static hasGame(): boolean {
    return localStorage.getItem(saveKey) !== null;
  }

  static loadGame(): GameSaveState | null {
    return readJson<GameSaveState | null>(saveKey, null);
  }

  static saveGame(state: GameSaveState): void {
    writeJson(saveKey, state);
  }

  static clearGame(): void {
    localStorage.removeItem(saveKey);
  }

  static loadLearnedCases(): CBRCase[] {
    const cases = readJson<CBRCase[]>(casesKey, []);
    return Array.isArray(cases) ? cases : [];
  }

  static saveLearnedCases(cases: CBRCase[]): void {
    writeJson(casesKey, cases);
  }

  static clearAll(): void {
    localStorage.removeItem(saveKey);
    localStorage.removeItem(casesKey);
  }
}
