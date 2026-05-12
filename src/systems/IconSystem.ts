import type { CropType, FishTypeId, ToolId, Weather } from "../types";

type IconKind = CropType | FishTypeId | ToolId | Weather | "coin" | "shop" | "harvests" | "sellBox";

const labelMap: Record<IconKind, string> = {
  carrot: "cenoura",
  corn: "milho",
  tomato: "tomate",
  strawberry: "morango",
  lambari: "lambari",
  tilapia: "tilápia",
  carpa: "carpa",
  dourado: "peixe dourado",
  hoe: "enxada",
  seed: "semente",
  water: "regador",
  fertilizer: "adubo",
  pesticide: "inseticida",
  harvest: "cesta",
  fishingRod: "vara de pesca",
  ensolarado: "sol",
  chuvoso: "chuva",
  nublado: "nuvem",
  seco: "tempo seco",
  coin: "moeda",
  shop: "loja",
  harvests: "colheitas",
  sellBox: "caixa de venda",
};

const bodyMap: Record<IconKind, string> = {
  carrot: `<path d="M17 4c4 4 3 12-3 17C8 15 8 8 17 4Z" fill="#ef8b35"/><path d="M16 5c-2 2-4 4-6 5" stroke="#bc5b24"/><path d="M18 5c2-2 4-2 5-1M17 5c0-2 2-4 4-4" stroke="#3f9a49" stroke-width="2" stroke-linecap="round"/>`,
  corn: `<path d="M12 4c6 3 8 9 5 17-6-3-8-10-5-17Z" fill="#f4cc58"/><path d="M7 10c3 3 4 7 4 12-4-2-6-6-4-12ZM20 10c-3 3-4 7-4 12 4-2 6-6 4-12Z" fill="#4f9143"/><path d="M14 7v11M11 11h7M11 15h7" stroke="#c99a3a"/>`,
  tomato: `<circle cx="14" cy="15" r="8" fill="#d94b3d"/><path d="M14 7c2-3 5-3 7-1M14 7c-2-3-5-3-7-1" stroke="#3f9a49" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="12" r="2" fill="#ee7467"/>`,
  strawberry: `<path d="M14 6c6 4 8 10 0 17C6 16 8 10 14 6Z" fill="#d94b62"/><path d="M9 7h10M14 6v-3" stroke="#3f9a49" stroke-width="2" stroke-linecap="round"/><path d="M11 12h1M16 12h1M14 17h1" stroke="#fff0a2" stroke-width="2" stroke-linecap="round"/>`,
  lambari: `<path d="M3 14c5-6 13-6 18 0-5 6-13 6-18 0Z" fill="#9edfff"/><path d="M21 14l4-4v8Z" fill="#79c5eb"/><circle cx="8" cy="13" r="1.5" fill="#243326"/>`,
  tilapia: `<path d="M4 14c5-7 14-7 18 0-4 7-14 7-18 0Z" fill="#7bb27a"/><path d="M22 14l4-5v10Z" fill="#5a9c5f"/><path d="M11 9l3-4 3 4" fill="#5a9c5f"/><circle cx="8" cy="13" r="1.5" fill="#243326"/>`,
  carpa: `<path d="M3 15c5-8 15-8 20 0-5 6-15 6-20 0Z" fill="#d68b3a"/><path d="M22 15l5-5v10Z" fill="#b95234"/><path d="M10 10h8" stroke="#fff0a2"/><circle cx="8" cy="14" r="1.5" fill="#243326"/>`,
  dourado: `<path d="M3 14c5-7 15-7 20 0-5 7-15 7-20 0Z" fill="#f4cc58"/><path d="M22 14l5-5v10Z" fill="#e2a93a"/><path d="M12 8l2-4 3 4" fill="#fff0a2"/><circle cx="8" cy="13" r="1.5" fill="#243326"/>`,
  hoe: `<path d="M6 22L19 5" stroke="#7a4a24" stroke-width="3" stroke-linecap="round"/><path d="M16 5h8" stroke="#c8d0c8" stroke-width="4" stroke-linecap="round"/>`,
  seed: `<path d="M8 8h12l2 14H6Z" fill="#d8b06b"/><path d="M10 10h8" stroke="#7a4a24"/><circle cx="14" cy="16" r="4" fill="#f4cc58"/>`,
  water: `<path d="M7 11h12v9H7Z" fill="#7f8a93"/><path d="M10 13h7v5h-7Z" fill="#5fa8d3"/><path d="M19 12c5 0 5 4 0 5M20 10l5-4" stroke="#7f8a93" stroke-width="2"/><path d="M24 13l2 4" stroke="#79c5eb" stroke-width="2" stroke-linecap="round"/>`,
  fertilizer: `<path d="M7 6h14l2 17H5Z" fill="#8fd460"/><path d="M10 12h8" stroke="#fff7dc" stroke-width="3"/><circle cx="10" cy="18" r="1.5" fill="#f4cc58"/><circle cx="18" cy="18" r="1.5" fill="#f4cc58"/>`,
  pesticide: `<path d="M9 9h9v13H9Z" fill="#9adf8c"/><path d="M11 5h5v5h-5Z" fill="#5fa8d3"/><path d="M18 8h6M23 6l3-2M23 10l3 2" stroke="#243326" stroke-width="2" stroke-linecap="round"/>`,
  harvest: `<path d="M8 13c1-6 11-6 12 0" fill="none" stroke="#7a4a24" stroke-width="2"/><path d="M6 13h16l-2 9H8Z" fill="#d8b06b"/><path d="M9 17h10" stroke="#8d5627" stroke-width="2"/><circle cx="11" cy="14" r="2.4" fill="#d94b3d"/><circle cx="17" cy="15" r="2.3" fill="#f4cc58"/>`,
  fishingRod: `<path d="M6 22L22 4" stroke="#7a4a24" stroke-width="3" stroke-linecap="round"/><path d="M22 4c4 6 3 12-2 15" fill="none" stroke="#eef8ff" stroke-width="1.5"/><circle cx="20" cy="20" r="2" fill="#f4cc58"/>`,
  ensolarado: `<circle cx="14" cy="14" r="6" fill="#f4cc58"/><path d="M14 2v4M14 22v4M2 14h4M22 14h4M5 5l3 3M23 5l-3 3M5 23l3-3M23 23l-3-3" stroke="#f4cc58" stroke-width="2" stroke-linecap="round"/>`,
  chuvoso: `<path d="M8 14c-3 0-4-5 0-6 2-5 10-4 11 1 5 0 5 7 0 7H8Z" fill="#9bb2a7"/><path d="M9 20l-2 4M15 20l-2 4M21 20l-2 4" stroke="#5fa8d3" stroke-width="2" stroke-linecap="round"/>`,
  nublado: `<path d="M7 17c-4 0-5-6 0-7 2-5 10-4 11 1 6 0 6 8 0 8H7Z" fill="#dbe6e8"/>`,
  seco: `<circle cx="12" cy="12" r="7" fill="#e7b74a"/><path d="M4 22h18M8 18h14M3 15h6" stroke="#c99a5a" stroke-width="2" stroke-linecap="round"/>`,
  coin: `<circle cx="14" cy="14" r="10" fill="#f4cc58"/><circle cx="14" cy="14" r="7" fill="#e0a93d"/><path d="M10 14h8" stroke="#fff7dc" stroke-width="2"/>`,
  shop: `<path d="M5 10h18v14H5Z" fill="#c99a5a"/><path d="M4 10h20L21 4H7Z" fill="#b95234"/><path d="M8 14h12" stroke="#fff7dc" stroke-width="3"/>`,
  harvests: `<path d="M6 13h16l-2 10H8Z" fill="#d8b06b"/><path d="M9 12c1-5 9-5 10 0" fill="none" stroke="#7a4a24" stroke-width="2"/><circle cx="11" cy="16" r="3" fill="#d94b3d"/><circle cx="17" cy="17" r="3" fill="#f4cc58"/>`,
  sellBox: `<path d="M6 9h16v14H6Z" fill="#8d5627"/><path d="M8 12h12" stroke="#f4cc58" stroke-width="3"/><path d="M9 17h10" stroke="#52311d" stroke-width="2"/>`,
};

export class IconSystem {
  static svg(kind: IconKind, className = "game-icon"): string {
    return `<svg class="${className}" viewBox="0 0 28 28" role="img" aria-label="${labelMap[kind]}">${bodyMap[kind]}</svg>`;
  }
}
