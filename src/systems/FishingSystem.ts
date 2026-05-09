import { fishTypeOrder, fishTypes } from "../data/fishTypes";
import type { FishingOutcome, Weather } from "../types";
import { InventorySystem } from "./InventorySystem";

export class FishingSystem {
  private lastCast = 0;

  constructor(private readonly inventory: InventorySystem) {}

  fish(weather: Weather, time: number): FishingOutcome {
    if (time - this.lastCast < 1100) {
      return { ok: false, message: "A linha ainda está balançando. Espere um instante." };
    }

    this.lastCast = time;
    const roll = Math.random();

    if (roll < (weather === "chuvoso" ? 0.1 : 0.18)) {
      return { ok: false, message: "A boia mexeu, mas nada mordeu." };
    }

    if (roll < 0.28) {
      return { ok: false, message: "Você pescou um galho velho. Pelo menos limpou o lago." };
    }

    const fishId = this.pickFish(weather);
    const fish = fishTypes[fishId];
    this.inventory.addFish(fishId);

    return {
      ok: true,
      message: `Peixe fisgado: ${fish.name}! Venda na loja para ganhar moedas.`,
      fishId,
      value: fish.basePrice,
      rarity: fish.rarity,
    };
  }

  private pickFish(weather: Weather) {
    const weighted = fishTypeOrder.flatMap((id) => {
      const fish = fishTypes[id];
      const weatherBonus = fish.preferredWeather.includes(weather) ? 2 : 0;
      const rarityWeight = fish.rarity === "raro" ? 1 : fish.rarity === "incomum" ? 3 : 6;
      return Array.from({ length: rarityWeight + weatherBonus }, () => id);
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
  }
}
