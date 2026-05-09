import { cropTypeOrder, cropTypes } from "../data/cropTypes";
import type { CropType } from "../types";

export class CropTypeSystem {
  static readonly order = cropTypeOrder;

  static get(cropType: CropType) {
    return cropTypes[cropType];
  }

  static next(current: CropType): CropType {
    const index = cropTypeOrder.indexOf(current);
    return cropTypeOrder[(index + 1) % cropTypeOrder.length];
  }

  static initialSeedStock(): Record<CropType, number> {
    return Object.fromEntries(cropTypeOrder.map((id) => [id, cropTypes[id].initialSeeds])) as Record<CropType, number>;
  }

  static emptyCropStock(): Record<CropType, number> {
    return Object.fromEntries(cropTypeOrder.map((id) => [id, 0])) as Record<CropType, number>;
  }

  static normalizeCropStock(stock: Partial<Record<CropType, number>> | undefined, fallbackInitial = 0): Record<CropType, number> {
    return Object.fromEntries(cropTypeOrder.map((id) => [id, Math.max(0, Number(stock?.[id] ?? fallbackInitial))])) as Record<CropType, number>;
  }

  static total(stock: Record<CropType, number>): number {
    return cropTypeOrder.reduce((sum, id) => sum + stock[id], 0);
  }
}
