import type { FishTypeDefinition, FishTypeId } from "../types";

export const fishTypes: Record<FishTypeId, FishTypeDefinition> = {
  lambari: {
    id: "lambari",
    name: "lambari",
    icon: "L",
    basePrice: 8,
    rarity: "comum",
    preferredWeather: ["ensolarado", "nublado"],
    difficulty: 0.25,
  },
  tilapia: {
    id: "tilapia",
    name: "tilápia",
    icon: "T",
    basePrice: 14,
    rarity: "comum",
    preferredWeather: ["chuvoso", "nublado"],
    difficulty: 0.38,
  },
  carpa: {
    id: "carpa",
    name: "carpa",
    icon: "C",
    basePrice: 22,
    rarity: "incomum",
    preferredWeather: ["chuvoso"],
    difficulty: 0.55,
  },
  dourado: {
    id: "dourado",
    name: "peixe dourado",
    icon: "D",
    basePrice: 48,
    rarity: "raro",
    preferredWeather: ["ensolarado"],
    difficulty: 0.78,
  },
};

export const fishTypeOrder: FishTypeId[] = ["lambari", "tilapia", "carpa", "dourado"];
