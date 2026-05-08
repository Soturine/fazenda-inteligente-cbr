import { actionLabels, resultLabels } from "../data/gameData";
import { initialCases } from "../data/initialCases";
import type { CBRAction, CBRAnalysis, CBRCase, CBRCurrentCase, CropPlotState, PlantStage, SimilarityResult, Weather } from "../types";
import { SaveSystem } from "./SaveSystem";

const weights: Record<keyof CBRCurrentCase, number> = {
  clima: 10,
  solo: 20,
  umidade: 15,
  pragas: 20,
  crescimento: 10,
  saude: 15,
  estagioPlanta: 10,
};

const resultPriority: Record<CBRCase["resultado"], number> = {
  colheu: 5,
  melhorou: 4,
  melhorou_parcialmente: 3,
  sem_efeito: 2,
  piorou: 1,
};

export class CBRSystem {
  getLearnedCases(): CBRCase[] {
    return SaveSystem.loadLearnedCases();
  }

  getCaseBase(): CBRCase[] {
    return [...initialCases, ...this.getLearnedCases()];
  }

  createCaseFromPlot(plot: CropPlotState, weather: Weather): CBRCurrentCase {
    return {
      clima: weather,
      solo: plot.soil,
      umidade: plot.moisture,
      pragas: plot.pests,
      crescimento: this.mapGrowth(plot),
      saude: plot.health,
      estagioPlanta: this.mapPlantStage(plot),
    };
  }

  calculateSimilarity(currentCase: CBRCurrentCase, storedCase: CBRCase): SimilarityResult {
    const matches = {} as Record<keyof CBRCurrentCase, boolean>;
    let score = 0;

    (Object.keys(weights) as Array<keyof CBRCurrentCase>).forEach((attribute) => {
      const matched = currentCase[attribute] === storedCase[attribute];
      matches[attribute] = matched;

      if (matched) {
        score += weights[attribute];
      }
    });

    return {
      score,
      percentage: score,
      matches,
    };
  }

  analyze(currentCase: CBRCurrentCase): CBRAnalysis {
    const retrieved = this.retrieve(currentCase);
    const reusedAction = retrieved.case.acaoAplicada;
    const revised = this.revise(currentCase, reusedAction);

    return {
      currentCase,
      retrievedCase: retrieved.case,
      similarity: retrieved.similarity,
      reusedAction,
      recommendedAction: revised.action,
      adaptations: revised.adaptations,
      explanation: this.buildExplanation(retrieved.similarity, reusedAction, revised.action, revised.adaptations),
    };
  }

  retain(caseData: CBRCurrentCase, action: CBRAction, result: CBRCase["resultado"]): CBRCase {
    const learnedCases = this.getLearnedCases();
    const learnedCase: CBRCase = {
      id: `aprendido-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...caseData,
      acaoAplicada: action,
      resultado: result,
      explicacao: `Caso aprendido no gameplay: ação ${actionLabels[action]} resultou em ${resultLabels[result]}.`,
      criadoEm: new Date().toISOString(),
    };

    SaveSystem.saveLearnedCases([learnedCase, ...learnedCases].slice(0, 80));
    return learnedCase;
  }

  private retrieve(currentCase: CBRCurrentCase): { case: CBRCase; similarity: SimilarityResult } {
    const base = this.getCaseBase();
    const firstCase = base[0];
    let best = {
      case: firstCase,
      similarity: this.calculateSimilarity(currentCase, firstCase),
    };

    base.slice(1).forEach((storedCase) => {
      const similarity = this.calculateSimilarity(currentCase, storedCase);

      if (similarity.score > best.similarity.score) {
        best = { case: storedCase, similarity };
        return;
      }

      if (similarity.score === best.similarity.score && resultPriority[storedCase.resultado] > resultPriority[best.case.resultado]) {
        best = { case: storedCase, similarity };
      }
    });

    return best;
  }

  private revise(currentCase: CBRCurrentCase, reusedAction: CBRAction): { action: CBRAction; adaptations: string[] } {
    let action = reusedAction;
    const adaptations: string[] = [];
    const hasPlant = currentCase.estagioPlanta === "plantado" || currentCase.estagioPlanta === "crescendo" || currentCase.estagioPlanta === "pronto";

    if (currentCase.estagioPlanta === "vazio") {
      action = "preparar_solo";
      adaptations.push("canteiro vazio pede preparo do solo antes do plantio");
    } else if (currentCase.estagioPlanta === "preparado") {
      action = "plantar";
      adaptations.push("solo preparado pode receber uma semente");
    } else if (currentCase.estagioPlanta === "pronto") {
      action = "colher";
      adaptations.push("planta pronta deve ser colhida");
    } else if (currentCase.pragas === "alta") {
      action = "tratar_pragas";
      adaptations.push("pragas altas têm prioridade");
    } else if (hasPlant && (currentCase.solo === "seco" || currentCase.umidade === "baixa")) {
      action = "regar";
      adaptations.push("solo seco ou umidade baixa pedem rega");
    } else if (hasPlant && currentCase.solo === "pobre" && currentCase.saude === "amarelada") {
      action = "adubar";
      adaptations.push("solo pobre com planta amarelada indica adubação");
    }

    if (hasPlant && (action === "plantar" || action === "preparar_solo")) {
      action = currentCase.umidade === "baixa" || currentCase.solo === "seco" ? "regar" : "esperar";
      adaptations.push("o canteiro já tem uma planta, então não deve ser preparado ou plantado novamente");
    }

    if (currentCase.solo === "encharcado" && action === "regar") {
      action = "esperar";
      adaptations.push("solo encharcado não deve receber mais água");
    }

    return { action, adaptations };
  }

  private buildExplanation(similarity: SimilarityResult, reusedAction: CBRAction, recommendedAction: CBRAction, adaptations: string[]): string {
    let text = `Já vi um caso parecido com ${similarity.percentage}% de similaridade. Minha recomendação é ${actionLabels[recommendedAction]}.`;

    if (recommendedAction !== reusedAction) {
      text += ` Adaptei a experiência anterior, que indicava ${actionLabels[reusedAction]}.`;
    }

    if (adaptations.length > 0) {
      text += ` Motivo: ${adaptations.join("; ")}.`;
    } else {
      text += " A experiência recuperada ainda combina com este canteiro.";
    }

    return text;
  }

  private mapGrowth(plot: CropPlotState): CBRCurrentCase["crescimento"] {
    if (plot.stage === "sprout") return "broto";
    if (plot.stage === "middle" || plot.stage === "problem") return plot.growth;
    if (plot.stage === "adult" || plot.stage === "ready") return "adulto";
    return "semente";
  }

  private mapPlantStage(plot: CropPlotState): PlantStage {
    if (plot.stage === "empty") return "vazio";
    if (plot.stage === "prepared") return "preparado";
    if (plot.stage === "seed") return "plantado";
    if (plot.stage === "ready") return "pronto";
    return "crescendo";
  }
}
