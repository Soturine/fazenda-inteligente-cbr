import type { CropPlotState, Vector2Like } from "../types";

function plotVisualSeed(tile: Vector2Like): number {
  return (tile.x * 928371 + tile.y * 364479 + 137) % 997;
}

export class CropPlot {
  static create(tile: Vector2Like): CropPlotState {
    return {
      id: `${tile.x},${tile.y}`,
      x: tile.x,
      y: tile.y,
      stage: "empty",
      previousStage: "seed",
      age: 0,
      soil: "normal",
      moisture: "baixa",
      pests: "nenhuma",
      growth: "semente",
      health: "saudavel",
      daysDry: 0,
      visualSeed: plotVisualSeed(tile),
    };
  }

  static normalize(plot: CropPlotState): CropPlotState {
    return {
      ...plot,
      visualSeed: plot.visualSeed ?? plotVisualSeed(plot),
    };
  }

  static reset(plot: CropPlotState): CropPlotState {
    return CropPlot.create({ x: plot.x, y: plot.y });
  }

  static clone(plot: CropPlotState): CropPlotState {
    return JSON.parse(JSON.stringify(plot)) as CropPlotState;
  }
}
