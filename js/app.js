(function () {
  var form = document.getElementById("caseForm");
  var analyzeButton = document.getElementById("analyzeButton");
  var applyButton = document.getElementById("applyButton");
  var randomButton = document.getElementById("randomButton");
  var clearCasesButton = document.getElementById("clearCasesButton");
  var explanationToggle = document.getElementById("explanationToggle");
  var explanationContent = document.getElementById("explanationContent");
  var currentCaseTags = document.getElementById("currentCaseTags");
  var recommendationBox = document.getElementById("recommendationBox");
  var matchedCaseBox = document.getElementById("matchedCaseBox");
  var similarityScore = document.getElementById("similarityScore");
  var casesTableBody = document.getElementById("casesTableBody");
  var totalCases = document.getElementById("totalCases");
  var savedCases = document.getElementById("savedCases");
  var plantStatus = document.getElementById("plantStatus");
  var farmScene = document.getElementById("farmScene");
  var fieldRows = document.getElementById("fieldRows");

  var lastAnalysis = null;

  var OPTIONS = {
    clima: ["seco", "chuvoso", "nublado", "quente"],
    solo: ["seco", "normal", "encharcado", "pobre em nutrientes"],
    folhas: ["verdes", "amarelas", "murchas", "com manchas"],
    pragas: ["nenhuma", "baixa", "média", "alta"],
    crescimento: ["baixo", "médio", "alto"]
  };

  var LABELS = {
    clima: "Clima",
    solo: "Solo",
    folhas: "Folhas",
    pragas: "Pragas",
    crescimento: "Crescimento"
  };

  function getCurrentCaseFromForm() {
    return {
      clima: form.clima.value,
      solo: form.solo.value,
      folhas: form.folhas.value,
      pragas: form.pragas.value,
      crescimento: form.crescimento.value
    };
  }

  function setFormValues(caseData) {
    Object.keys(caseData).forEach(function (fieldName) {
      if (form[fieldName]) {
        form[fieldName].value = caseData[fieldName];
      }
    });
  }

  function getRandomValue(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function generateRandomCase() {
    var randomCase = {};

    Object.keys(OPTIONS).forEach(function (attribute) {
      randomCase[attribute] = getRandomValue(OPTIONS[attribute]);
    });

    setFormValues(randomCase);
    updateCurrentCaseView();
    recommendationBox.innerHTML = "<p>Situação aleatória gerada. Clique em <strong>Analisar com CBR</strong> para consultar a IA.</p>";
    applyButton.disabled = true;
    lastAnalysis = null;
  }

  function formatCaseTags(caseData) {
    return Object.keys(LABELS).map(function (attribute) {
      return "<span>" + LABELS[attribute] + ": " + caseData[attribute] + "</span>";
    }).join("");
  }

  function updateCurrentCaseView() {
    var currentCase = getCurrentCaseFromForm();
    currentCaseTags.innerHTML = formatCaseTags(currentCase);
    updateFarmScene(currentCase);
  }

  function updateFarmScene(caseData) {
    var sceneClasses = ["is-seco", "is-chuvoso", "is-nublado", "is-quente"];
    sceneClasses.forEach(function (className) {
      farmScene.classList.remove(className);
    });

    farmScene.classList.add("is-" + caseData.clima);
    renderPlants(caseData);
  }

  function renderPlants(caseData) {
    var plantCount = caseData.crescimento === "alto" ? 10 : caseData.crescimento === "médio" ? 8 : 6;
    var leafColor = "#5fa75f";
    var plantHeight = caseData.crescimento === "alto" ? 92 : caseData.crescimento === "médio" ? 74 : 56;

    if (caseData.folhas === "amarelas") {
      leafColor = "#dfc44d";
    }

    if (caseData.folhas === "murchas") {
      leafColor = "#83a45a";
      plantHeight -= 12;
    }

    if (caseData.folhas === "com manchas") {
      leafColor = "#72a95b";
    }

    fieldRows.innerHTML = "";

    for (var index = 0; index < plantCount; index += 1) {
      var plant = document.createElement("div");
      plant.className = "plant";
      plant.style.setProperty("--leaf-color", leafColor);
      plant.style.setProperty("--plant-height", Math.max(42, plantHeight + (index % 3) * 6) + "px");

      if (caseData.folhas === "murchas") {
        plant.classList.add("wilted");
      }

      if (caseData.folhas === "com manchas" || caseData.pragas === "alta") {
        plant.classList.add("spotted");
      }

      fieldRows.appendChild(plant);
    }
  }

  function renderMatchedCase(analysis) {
    var storedCase = analysis.retrievedCase;
    matchedCaseBox.innerHTML = [
      "<h3>Caso mais parecido</h3>",
      "<p><strong>ID:</strong> " + storedCase.id + "</p>",
      "<div class=\"case-tags\">" + formatCaseTags(storedCase) + "</div>",
      "<p><strong>Solução antiga:</strong> " + storedCase.solucao + "</p>",
      "<p><strong>Resultado anterior:</strong> " + storedCase.resultado + "</p>",
      "<p><strong>Explicação:</strong> " + storedCase.explicacao + "</p>"
    ].join("");
  }

  function renderRecommendation(analysis, result) {
    var recommendation = analysis.recommendation;
    var complementText = recommendation.complement ? " Complemento sugerido: <strong>" + recommendation.complement + "</strong>." : "";
    var resultText = result ? "<p><strong>Resultado da ação:</strong> " + result + "</p>" : "";

    recommendationBox.innerHTML = [
      "<p><strong>Ação recomendada:</strong> " + recommendation.solution + "." + complementText + "</p>",
      "<p><strong>Por que:</strong> " + analysis.explanation + "</p>",
      resultText
    ].join("");
  }

  function setCycleStep(stepId, text, active) {
    var step = document.getElementById(stepId);
    step.classList.toggle("is-active", active);
    step.querySelector("p").textContent = text;
  }

  function renderCycle(analysis, learnedCase) {
    setCycleStep(
      "retrieveStep",
      "Caso recuperado: " + analysis.retrievedCase.id + " com " + analysis.similarity.percentage + "% de similaridade.",
      true
    );
    setCycleStep(
      "reuseStep",
      "Solução reaproveitada: " + analysis.reusedSolution + ".",
      true
    );
    setCycleStep(
      "reviseStep",
      analysis.recommendation.adaptations.length
        ? analysis.recommendation.adaptations.join(" ")
        : "Nenhuma adaptação foi necessária para o caso atual.",
      true
    );
    setCycleStep(
      "retainStep",
      learnedCase ? "Novo caso salvo: " + learnedCase.id + "." : "Aguardando o jogador aplicar a ação para salvar o novo caso.",
      Boolean(learnedCase)
    );
  }

  function analyzeCurrentCase() {
    var currentCase = getCurrentCaseFromForm();
    var analysis = window.FazendaCBR.analyze(currentCase);

    lastAnalysis = analysis;
    similarityScore.textContent = analysis.similarity.percentage + "%";
    plantStatus.textContent = "IA recomendou: " + analysis.recommendation.solution;
    renderMatchedCase(analysis);
    renderRecommendation(analysis);
    renderCycle(analysis);
    applyButton.disabled = false;
  }

  function applyRecommendedAction() {
    if (!lastAnalysis) {
      return;
    }

    var result = window.FazendaCBR.estimateResult(lastAnalysis.currentCase, lastAnalysis.recommendation);
    var learnedCase = window.FazendaCBR.retain(
      lastAnalysis.currentCase,
      lastAnalysis.retrievedCase,
      lastAnalysis.similarity,
      lastAnalysis.recommendation,
      result
    );

    plantStatus.textContent = "Resultado: " + result;
    renderRecommendation(lastAnalysis, result);
    renderCycle(lastAnalysis, learnedCase);
    renderCaseBaseInfo();
    applyButton.disabled = true;
  }

  function renderCaseBaseInfo() {
    var allCases = window.FazendaCBR.getCaseBase();
    var learnedCases = window.FazendaCBR.loadSavedCases();
    totalCases.textContent = allCases.length;
    savedCases.textContent = learnedCases.length;

    if (!learnedCases.length) {
      casesTableBody.innerHTML = "<tr><td colspan=\"4\">Nenhum caso aprendido ainda.</td></tr>";
      return;
    }

    casesTableBody.innerHTML = learnedCases.slice(0, 8).map(function (caseData) {
      var summary = [
        "Clima: " + caseData.clima,
        "Solo: " + caseData.solo,
        "Folhas: " + caseData.folhas,
        "Pragas: " + caseData.pragas,
        "Crescimento: " + caseData.crescimento
      ].join("<br>");

      return [
        "<tr>",
        "<td>" + caseData.id + "</td>",
        "<td>" + summary + "</td>",
        "<td>" + caseData.solucao + (caseData.complemento ? "<br><span class=\"tag\">" + caseData.complemento + "</span>" : "") + "</td>",
        "<td>" + caseData.resultado + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function clearLearnedCases() {
    var confirmation = confirm("Deseja apagar apenas os casos aprendidos no navegador? A base inicial será mantida.");

    if (!confirmation) {
      return;
    }

    window.FazendaCBR.clearSavedCases();
    renderCaseBaseInfo();
    applyButton.disabled = true;
    lastAnalysis = null;
    plantStatus.textContent = "Casos salvos limpos";
    recommendationBox.innerHTML = "<p>Casos aprendidos foram removidos. A base inicial de 10 casos continua disponível.</p>";
    setCycleStep("retainStep", "Casos aprendidos removidos do LocalStorage.", false);
  }

  function toggleExplanationMode() {
    explanationContent.hidden = !explanationToggle.checked;
  }

  form.addEventListener("change", function () {
    updateCurrentCaseView();
    applyButton.disabled = true;
    lastAnalysis = null;
  });

  analyzeButton.addEventListener("click", analyzeCurrentCase);
  applyButton.addEventListener("click", applyRecommendedAction);
  randomButton.addEventListener("click", generateRandomCase);
  clearCasesButton.addEventListener("click", clearLearnedCases);
  explanationToggle.addEventListener("change", toggleExplanationMode);

  updateCurrentCaseView();
  renderCaseBaseInfo();
  toggleExplanationMode();
})();
