(function () {
  var STORAGE_KEY = "fazenda-inteligente-cbr-casos";
  var RESULT_PRIORITY = {
    "melhorou": 3,
    "melhorou parcialmente": 2,
    "não resolveu": 1
  };
  var ATTRIBUTE_WEIGHTS = {
    clima: 20,
    solo: 25,
    folhas: 25,
    pragas: 20,
    crescimento: 10
  };

  function getInitialCases() {
    return (window.FAZENDA_INITIAL_CASES || []).slice();
  }

  function loadSavedCases() {
    var rawCases = localStorage.getItem(STORAGE_KEY);

    if (!rawCases) {
      return [];
    }

    try {
      var parsedCases = JSON.parse(rawCases);
      return Array.isArray(parsedCases) ? parsedCases : [];
    } catch (error) {
      console.warn("Não foi possível ler a base salva.", error);
      return [];
    }
  }

  function saveLearnedCases(cases) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }

  function clearSavedCases() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getCaseBase() {
    return getInitialCases().concat(loadSavedCases());
  }

  function calculateSimilarity(currentCase, storedCase) {
    var score = 0;
    var matches = {};

    Object.keys(ATTRIBUTE_WEIGHTS).forEach(function (attribute) {
      var isMatch = currentCase[attribute] === storedCase[attribute];
      matches[attribute] = isMatch;

      if (isMatch) {
        score += ATTRIBUTE_WEIGHTS[attribute];
      }
    });

    return {
      score: score,
      percentage: score,
      matches: matches
    };
  }

  function compareResults(firstCase, secondCase) {
    var firstPriority = RESULT_PRIORITY[firstCase.resultado] || 0;
    var secondPriority = RESULT_PRIORITY[secondCase.resultado] || 0;
    return firstPriority - secondPriority;
  }

  function retrieve(currentCase, caseBase) {
    return caseBase.reduce(function (bestMatch, storedCase) {
      var similarity = calculateSimilarity(currentCase, storedCase);

      if (!bestMatch) {
        return {
          case: storedCase,
          similarity: similarity
        };
      }

      if (similarity.score > bestMatch.similarity.score) {
        return {
          case: storedCase,
          similarity: similarity
        };
      }

      if (similarity.score === bestMatch.similarity.score && compareResults(storedCase, bestMatch.case) > 0) {
        return {
          case: storedCase,
          similarity: similarity
        };
      }

      return bestMatch;
    }, null);
  }

  function reuse(retrievedCase) {
    return retrievedCase.solucao;
  }

  function revise(currentCase, reusedSolution) {
    var finalSolution = reusedSolution;
    var adaptations = [];

    // Regras de revisão: ajustam a solução reaproveitada ao contexto atual.
    if (currentCase.folhas === "amarelas" && currentCase.solo === "pobre em nutrientes") {
      finalSolution = "adubar";
      adaptations.push("Folhas amarelas com solo pobre indicam necessidade de adubação.");
    }

    if (currentCase.pragas === "alta") {
      finalSolution = "aplicar controle de pragas";
      adaptations.push("Pragas altas têm prioridade, então a solução foi ajustada para controle de pragas.");
    }

    if (currentCase.solo === "encharcado" && finalSolution === "irrigar") {
      finalSolution = "aguardar";
      adaptations.push("O solo está encharcado, por isso a IA evitou recomendar irrigação.");
    }

    if (currentCase.solo === "seco" && finalSolution !== "irrigar") {
      adaptations.push("Como o solo está seco, foi incluído o complemento: verificar irrigação.");
    }

    return {
      solution: finalSolution,
      complement: currentCase.solo === "seco" && finalSolution !== "irrigar" ? "verificar irrigação" : "",
      adaptations: adaptations
    };
  }

  function estimateResult(currentCase, recommendation) {
    if (currentCase.pragas === "alta" && recommendation.solution === "aplicar controle de pragas") {
      return "melhorou";
    }

    if (currentCase.folhas === "amarelas" && currentCase.solo === "pobre em nutrientes" && recommendation.solution === "adubar") {
      return "melhorou";
    }

    if (currentCase.solo === "seco" && recommendation.solution === "irrigar") {
      return "melhorou";
    }

    if (currentCase.solo === "encharcado" && recommendation.solution === "irrigar") {
      return "não resolveu";
    }

    if (recommendation.complement) {
      return "melhorou parcialmente";
    }

    if (currentCase.pragas === "média" && recommendation.solution !== "aplicar controle de pragas") {
      return "melhorou parcialmente";
    }

    return "melhorou parcialmente";
  }

  function createExplanation(currentCase, retrievedCase, similarity, recommendation, result) {
    var reason = "A IA encontrou " + similarity.percentage + "% de similaridade com o caso " + retrievedCase.id + ".";

    if (recommendation.adaptations.length > 0) {
      reason += " A solução foi revisada porque " + recommendation.adaptations.join(" ");
    } else {
      reason += " Como não houve conflito com as regras atuais, a solução foi reaproveitada diretamente.";
    }

    if (result) {
      reason += " Após aplicar a ação, o resultado registrado foi: " + result + ".";
    }

    return reason;
  }

  function retain(currentCase, retrievedCase, similarity, recommendation, result) {
    var savedCases = loadSavedCases();
    var learnedCase = {
      id: "aprendido-" + new Date().getTime(),
      clima: currentCase.clima,
      solo: currentCase.solo,
      folhas: currentCase.folhas,
      pragas: currentCase.pragas,
      crescimento: currentCase.crescimento,
      solucao: recommendation.solution,
      complemento: recommendation.complement,
      resultado: result,
      explicacao: createExplanation(currentCase, retrievedCase, similarity, recommendation, result),
      origem: "localStorage",
      criadoEm: new Date().toISOString()
    };

    savedCases.unshift(learnedCase);
    saveLearnedCases(savedCases);
    return learnedCase;
  }

  function analyze(currentCase) {
    var caseBase = getCaseBase();
    var retrieved = retrieve(currentCase, caseBase);
    var reusedSolution = reuse(retrieved.case);
    var recommendation = revise(currentCase, reusedSolution);

    return {
      currentCase: currentCase,
      caseBase: caseBase,
      retrievedCase: retrieved.case,
      similarity: retrieved.similarity,
      reusedSolution: reusedSolution,
      recommendation: recommendation,
      explanation: createExplanation(currentCase, retrieved.case, retrieved.similarity, recommendation)
    };
  }

  window.FazendaCBR = {
    ATTRIBUTE_WEIGHTS: ATTRIBUTE_WEIGHTS,
    STORAGE_KEY: STORAGE_KEY,
    analyze: analyze,
    calculateSimilarity: calculateSimilarity,
    clearSavedCases: clearSavedCases,
    estimateResult: estimateResult,
    getCaseBase: getCaseBase,
    getInitialCases: getInitialCases,
    loadSavedCases: loadSavedCases,
    retain: retain
  };
})();

