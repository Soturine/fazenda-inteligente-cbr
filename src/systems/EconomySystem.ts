import { cropTypes } from "../data/cropTypes";
import { fishTypes } from "../data/fishTypes";
import { marketEvents } from "../data/shopData";
import type { CropType, EconomyState, FishTypeId, MarketItemId, MarketTrend, Weather } from "../types";

const allMarketIds = [...Object.keys(cropTypes), ...Object.keys(fishTypes)] as MarketItemId[];

function basePrice(id: MarketItemId): number {
  if (id in cropTypes) return cropTypes[id as CropType].sellPrice;
  return fishTypes[id as FishTypeId].basePrice;
}

function baseSeedStock(): Record<CropType, number> {
  return {
    carrot: 18,
    corn: 12,
    tomato: 10,
    strawberry: 8,
  };
}

export class EconomySystem {
  private state: EconomyState;

  constructor(saved?: Partial<EconomyState>, day = 1, weather: Weather = "ensolarado") {
    this.state = this.normalize(saved, day, weather);
  }

  get data(): EconomyState {
    return this.state;
  }

  getPrice(id: MarketItemId): number {
    return this.state.prices[id] ?? basePrice(id);
  }

  getTrend(id: MarketItemId): MarketTrend {
    return this.state.trends[id] ?? "stable";
  }

  getSeedPrice(cropType: CropType): number {
    const marketPressure = this.getTrend(cropType) === "up" ? 1.1 : this.getTrend(cropType) === "down" ? 0.95 : 1;
    return Math.max(1, Math.round(cropTypes[cropType].seedPrice * marketPressure));
  }

  recordSale(id: MarketItemId, amount: number): void {
    this.state.soldToday[id] = (this.state.soldToday[id] ?? 0) + amount;
  }

  buySeed(cropType: CropType, amount: number): number {
    const available = Math.min(this.state.shopSeedStock[cropType], amount);
    this.state.shopSeedStock[cropType] -= available;
    return available;
  }

  advanceDay(day: number, weather: Weather): void {
    const previousPrices = { ...this.state.prices };
    const eventIndex = (day * 7 + weather.length) % marketEvents.length;
    const eventText = marketEvents[eventIndex];

    allMarketIds.forEach((id, index) => {
      const sold = this.state.soldToday[id] ?? 0;
      const base = basePrice(id);
      const weatherFactor = this.weatherFactor(id, weather);
      const demandFactor = Math.max(0.74, 1 - sold * 0.035);
      const wave = 1 + Math.sin(day * 0.77 + index * 1.3) * 0.12;
      const eventFactor = this.eventFactor(id, eventIndex);
      const price = Math.max(2, Math.round(base * weatherFactor * demandFactor * wave * eventFactor));
      this.state.prices[id] = price;
      this.state.trends[id] = price > previousPrices[id] ? "up" : price < previousPrices[id] ? "down" : "stable";
      this.state.soldToday[id] = 0;
    });

    this.state.shopSeedStock = {
      carrot: Math.min(30, this.state.shopSeedStock.carrot + 5),
      corn: Math.min(24, this.state.shopSeedStock.corn + 4),
      tomato: Math.min(22, this.state.shopSeedStock.tomato + 3),
      strawberry: Math.min(18, this.state.shopSeedStock.strawberry + 2),
    };
    this.state.lastUpdatedDay = day;
    this.state.eventText = eventText;
  }

  serialize(): EconomyState {
    return JSON.parse(JSON.stringify(this.state)) as EconomyState;
  }

  private normalize(saved: Partial<EconomyState> | undefined, day: number, weather: Weather): EconomyState {
    const prices = Object.fromEntries(allMarketIds.map((id) => [id, saved?.prices?.[id] ?? basePrice(id)])) as Record<MarketItemId, number>;
    const trends = Object.fromEntries(allMarketIds.map((id) => [id, saved?.trends?.[id] ?? "stable"])) as Record<MarketItemId, MarketTrend>;
    const soldToday = Object.fromEntries(allMarketIds.map((id) => [id, saved?.soldToday?.[id] ?? 0])) as Record<MarketItemId, number>;
    const stock = { ...baseSeedStock(), ...(saved?.shopSeedStock ?? {}) };
    const state: EconomyState = {
      prices,
      trends,
      soldToday,
      shopSeedStock: stock,
      lastUpdatedDay: saved?.lastUpdatedDay ?? day,
      eventText: saved?.eventText ?? "Mercado local estável.",
    };
    this.state = state;
    if (!saved) this.advanceDay(day, weather);
    return this.state;
  }

  private weatherFactor(id: MarketItemId, weather: Weather): number {
    if (id in cropTypes) {
      const crop = cropTypes[id as CropType];
      if (crop.preferredWeather.includes(weather)) return 0.96;
      if (weather === "seco" && crop.droughtResistance < 0.45) return 1.24;
      if (weather === "chuvoso" && crop.preferredWeather.includes("chuvoso")) return 0.94;
      return 1.04;
    }

    const fish = fishTypes[id as FishTypeId];
    return fish.preferredWeather.includes(weather) ? 0.94 : 1.08;
  }

  private eventFactor(id: MarketItemId, eventIndex: number): number {
    if (eventIndex === 1 && id === "dourado") return 1.26;
    if (eventIndex === 3 && (id === "tomato" || id === "strawberry")) return 1.18;
    if (eventIndex === 4 && id === "strawberry") return 1.22;
    if (eventIndex === 0 && id === "carrot") return 1.1;
    return 1;
  }
}
