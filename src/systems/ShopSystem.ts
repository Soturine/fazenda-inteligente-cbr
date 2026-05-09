import { cropTypes } from "../data/cropTypes";
import { fishTypes } from "../data/fishTypes";
import type { CropType, FishTypeId } from "../types";
import { EconomySystem } from "./EconomySystem";
import { InventorySystem } from "./InventorySystem";

export class ShopSystem {
  constructor(private readonly inventory: InventorySystem, private readonly economy: EconomySystem) {}

  buySeed(cropType: CropType, amount = 1): { ok: boolean; message: string; total: number } {
    const unitPrice = this.economy.getSeedPrice(cropType);
    const available = this.economy.data.shopSeedStock[cropType];

    if (available <= 0) {
      return { ok: false, message: `A loja está sem sementes de ${cropTypes[cropType].name}.`, total: 0 };
    }

    const quantity = Math.min(amount, available);
    const total = quantity * unitPrice;
    if (!this.inventory.spendCoins(total)) {
      return { ok: false, message: `Moedas insuficientes para comprar ${cropTypes[cropType].name}.`, total: 0 };
    }

    const bought = this.economy.buySeed(cropType, quantity);
    this.inventory.addSeeds(cropType, bought);
    return { ok: true, message: `Sementes de ${cropTypes[cropType].name} compradas.`, total };
  }

  sellCrop(cropType: CropType): { ok: boolean; message: string; total: number } {
    const removed = this.inventory.removeHarvest(cropType, 1);
    if (removed <= 0) {
      return { ok: false, message: `Você não tem ${cropTypes[cropType].name} para vender.`, total: 0 };
    }

    const total = removed * this.economy.getPrice(cropType);
    this.inventory.addCoins(total);
    this.economy.recordSale(cropType, removed);
    return { ok: true, message: `${cropTypes[cropType].name} vendido por ${total} moedas.`, total };
  }

  sellFish(fishId: FishTypeId): { ok: boolean; message: string; total: number } {
    const removed = this.inventory.removeFish(fishId, 1);
    if (removed <= 0) {
      return { ok: false, message: `Você não tem ${fishTypes[fishId].name} para vender.`, total: 0 };
    }

    const total = removed * this.economy.getPrice(fishId);
    this.inventory.addCoins(total);
    this.economy.recordSale(fishId, removed);
    return { ok: true, message: `${fishTypes[fishId].name} vendido por ${total} moedas.`, total };
  }
}
