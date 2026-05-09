import { fishTypeOrder } from "../data/fishTypes";
import type { CropType, FishTypeId, InventoryState, ToolId } from "../types";
import { CropTypeSystem } from "./CropTypeSystem";

function emptyFishStock(): Record<FishTypeId, number> {
  return Object.fromEntries(fishTypeOrder.map((id) => [id, 0])) as Record<FishTypeId, number>;
}

function normalizeFishStock(stock?: Partial<Record<FishTypeId, number>>): Record<FishTypeId, number> {
  return Object.fromEntries(fishTypeOrder.map((id) => [id, Math.max(0, Number(stock?.[id] ?? 0))])) as Record<FishTypeId, number>;
}

export class InventorySystem {
  private state: InventoryState;

  constructor(saved?: Partial<InventoryState>) {
    const seedStock = saved?.seedStock
      ? CropTypeSystem.normalizeCropStock(saved.seedStock)
      : this.seedStockFromLegacy(saved?.seeds);
    const harvestStock = CropTypeSystem.normalizeCropStock(saved?.harvestStock);
    const fishStock = normalizeFishStock(saved?.fishStock);

    this.state = {
      seeds: CropTypeSystem.total(seedStock),
      seedStock,
      selectedCrop: saved?.selectedCrop ?? "carrot",
      harvests: CropTypeSystem.total(harvestStock),
      harvestStock,
      fishStock,
      coins: saved?.coins ?? 0,
      currentTool: saved?.currentTool ?? "hoe",
    };
  }

  get data(): InventoryState {
    this.refreshTotals();
    return this.state;
  }

  get currentTool(): ToolId {
    return this.state.currentTool;
  }

  get selectedCrop(): CropType {
    return this.state.selectedCrop;
  }

  setTool(tool: ToolId): void {
    this.state.currentTool = tool;
  }

  setSelectedCrop(cropType: CropType): void {
    this.state.selectedCrop = cropType;
  }

  cycleSelectedCrop(): CropType {
    this.state.selectedCrop = CropTypeSystem.next(this.state.selectedCrop);
    return this.state.selectedCrop;
  }

  consumeSeed(cropType = this.state.selectedCrop): boolean {
    if (this.state.seedStock[cropType] <= 0) {
      return false;
    }

    this.state.seedStock[cropType] -= 1;
    this.refreshTotals();
    return true;
  }

  addSeeds(cropType: CropType, amount: number): void {
    this.state.seedStock[cropType] += amount;
    this.refreshTotals();
  }

  addHarvest(cropType: CropType): void {
    this.state.harvestStock[cropType] += 1;
    this.refreshTotals();

    if (Math.random() < 0.35) {
      this.addSeeds(cropType, 1);
    }
  }

  removeHarvest(cropType: CropType, amount: number): number {
    const removed = Math.min(this.state.harvestStock[cropType], amount);
    this.state.harvestStock[cropType] -= removed;
    this.refreshTotals();
    return removed;
  }

  addFish(fishId: FishTypeId): void {
    this.state.fishStock[fishId] += 1;
  }

  removeFish(fishId: FishTypeId, amount: number): number {
    const removed = Math.min(this.state.fishStock[fishId], amount);
    this.state.fishStock[fishId] -= removed;
    return removed;
  }

  addCoins(amount: number): void {
    this.state.coins += Math.max(0, amount);
  }

  spendCoins(amount: number): boolean {
    if (this.state.coins < amount) return false;
    this.state.coins -= amount;
    return true;
  }

  serialize(): InventoryState {
    this.refreshTotals();
    return JSON.parse(JSON.stringify(this.state)) as InventoryState;
  }

  private refreshTotals(): void {
    this.state.seeds = CropTypeSystem.total(this.state.seedStock);
    this.state.harvests = CropTypeSystem.total(this.state.harvestStock);
  }

  private seedStockFromLegacy(legacySeeds?: number): Record<CropType, number> {
    const stock = CropTypeSystem.initialSeedStock();
    if (typeof legacySeeds === "number") {
      stock.carrot = Math.max(stock.carrot, legacySeeds);
    }
    return stock;
  }
}
