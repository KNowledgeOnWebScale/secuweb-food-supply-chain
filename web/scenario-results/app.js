const state = {
  report: null,
  filter: "all",
  search: "",
  showMatrixAggregates: true,
  copyStatusTimeout: null,
  overviewCopyStatusTimeout: null,
  outputContentCache: new Map(),
};

const elements = {
  runState: document.querySelector("#run-state"),
  runStateLabel: document.querySelector("#run-state-label"),
  passedCount: document.querySelector("#passed-count"),
  failedCount: document.querySelector("#failed-count"),
  skippedCount: document.querySelector("#skipped-count"),
  scenarioCount: document.querySelector("#scenario-count"),
  scenarioList: document.querySelector("#scenario-list"),
  passedNote: document.querySelector("#passed-note"),
  generatedTime: document.querySelector("#generated-time"),
  generatedDate: document.querySelector("#generated-date"),
  coverageFill: document.querySelector("#coverage-fill"),
  coverageTrack: document.querySelector("#coverage-track"),
  coveragePercent: document.querySelector("#coverage-percent"),
  overviewBody: document.querySelector("#overview-body"),
  copyOverviewButton: document.querySelector("#copy-overview-button"),
  copyMarkdownOverviewButton: document.querySelector("#copy-markdown-overview-button"),
  copyHtmlOverviewButton: document.querySelector("#copy-html-overview-button"),
  copyOverviewStatus: document.querySelector("#copy-overview-status"),
  allFilterCount: document.querySelector("#all-filter-count"),
  passedFilterCount: document.querySelector("#passed-filter-count"),
  failedFilterCount: document.querySelector("#failed-filter-count"),
  skippedFilterCount: document.querySelector("#skipped-filter-count"),
  matrixHead: document.querySelector("#matrix-head"),
  matrixBody: document.querySelector("#matrix-body"),
  matrixAggregatesToggle: document.querySelector("#matrix-aggregates-toggle"),
  copyMatrixButton: document.querySelector("#copy-matrix-button"),
  copyMarkdownMatrixButton: document.querySelector("#copy-markdown-matrix-button"),
  copyHtmlMatrixButton: document.querySelector("#copy-html-matrix-button"),
  copyMatrixStatus: document.querySelector("#copy-matrix-status"),
  scenarioOutputList: document.querySelector("#scenario-output-list"),
  scenarioOutputEmpty: document.querySelector("#scenario-output-empty"),
  resultList: document.querySelector("#result-list"),
  loadingPanel: document.querySelector("#loading-panel"),
  errorPanel: document.querySelector("#error-panel"),
  errorMessage: document.querySelector("#error-message"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#search-input"),
  refreshButton: document.querySelector("#refresh-button"),
  serviceEndpoints: document.querySelector("#service-endpoints"),
};

const designGoalLabels = {
  DS: "Data sovereignty",
  DG: "Data governance",
  INT: "Data interoperability",
  LC: "Legal compliance",
  TR: "Trust",
};

const designGoalOrder = ["DS", "DG", "INT", "TR", "LC"];
const technicalAspectOrder = [
  "Auditability",
  "Authentication",
  "Authorization",
  "Queryability",
  "Discoverability",
  "Data API interoperability",
  "Data model interoperability",
  "Verifiability",
];

const skipCategoryOrder = [
  "feature-absent",
  "pending-implementation",
  "under-specified",
  "excluded-from-analysis",
  "unknown",
];

const skipCategoryMetadata = {
  "feature-absent": {
    code: "FA",
    label: "Feature absent",
    description: "Required architectural feature is absent",
  },
  "pending-implementation": {
    code: "PI",
    label: "Pending implementation",
    description: "Implementable check has not been implemented yet",
  },
  "under-specified": {
    code: "US",
    label: "Under-specified",
    description: "Scenario needs sharper acceptance criteria",
  },
  "excluded-from-analysis": {
    code: "EX",
    label: "Excluded from analysis",
    description: "Scenario catalogue excludes this check from coverage metrics",
  },
  unknown: {
    code: "UNK",
    label: "Unknown skip",
    description: "Legacy report without skip-category metadata",
  },
};

const scenarioMatrix = {
  Auditability: {
    DS: ["C"],
    DG: ["D"],
    TR: ["E"],
    LC: ["F"],
  },
  Authentication: {
    DS: ["G"],
    DG: ["H"],
    TR: ["I"],
    LC: ["J"],
  },
  Authorization: {
    DS: ["K"],
    DG: ["L"],
    TR: ["M"],
    LC: ["N"],
  },
  Queryability: {
    DS: ["O"],
    INT: ["P"],
  },
  Discoverability: {
    DG: ["Q"],
    INT: ["R"],
  },
  "Data API interoperability": {
    INT: ["S", "T"],
  },
  "Data model interoperability": {
    INT: ["U"],
  },
  Verifiability: {
    DS: ["A"],
    DG: ["V"],
    TR: ["B"],
  },
};

const scenarioMetadata = {
  A: { goals: ["DS"], aspect: "Verifiability" },
  B: {
    goals: ["TR"],
    aspect: "Verifiability",
    primaryDependency: { designGoal: "DS", scenario: "A" },
  },
  C: { goals: ["DS"], aspect: "Auditability" },
  D: { goals: ["DG"], aspect: "Auditability" },
  E: {
    goals: ["TR"],
    aspect: "Auditability",
    primaryDependency: { designGoal: "DS", scenario: "C" },
    secondaryDependency: { designGoal: "DG", scenario: "D" },
  },
  F: { goals: ["LC"], aspect: "Auditability" },
  G: { goals: ["DS"], aspect: "Authentication" },
  H: { goals: ["DG"], aspect: "Authentication", includeInAnalysis: false },
  I: {
    goals: ["TR"],
    aspect: "Authentication",
    primaryDependency: { designGoal: "DS", scenario: "G" },
    secondaryDependency: { designGoal: "DG", scenario: "Q" },
  },
  J: { goals: ["LC"], aspect: "Authentication" },
  K: { goals: ["DS"], aspect: "Authorization" },
  L: { goals: ["DG"], aspect: "Authorization", includeInAnalysis: false },
  M: {
    goals: ["TR"],
    aspect: "Authorization",
    primaryDependency: { designGoal: "DS", scenario: "K" },
    secondaryDependency: { designGoal: "DG", scenario: "Q" },
  },
  N: { goals: ["LC"], aspect: "Authorization" },
  O: { goals: ["DS"], aspect: "Queryability" },
  P: { goals: ["INT"], aspect: "Queryability" },
  Q: { goals: ["DG"], aspect: "Discoverability" },
  R: { goals: ["INT"], aspect: "Discoverability" },
  S: { goals: ["INT"], aspect: "Data API interoperability" },
  T: { goals: ["INT"], aspect: "Data API interoperability" },
  U: { goals: ["INT"], aspect: "Data model interoperability" },
  V: { goals: ["DG"], aspect: "Verifiability", includeInAnalysis: false },
};

function getScenarioMatrixPlacements(scenario) {
  const placements = [];
  for (const aspect of technicalAspectOrder) {
    const row = scenarioMatrix[aspect] || {};
    for (const goal of designGoalOrder) {
      if ((row[goal] || []).includes(scenario)) {
        placements.push({ aspect, goal });
      }
    }
  }
  return placements;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return { time: "--", date: "Unknown generation time" };
  }

  return {
    time: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
    date: new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
  };
}

function formatPercent(numerator, denominator) {
  if (denominator === 0) {
    return "--";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatMetricRatio(numerator, denominator) {
  return `${numerator}/${denominator} = <strong>${formatPercent(numerator, denominator)}</strong>`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getDefinedScenarioList(report) {
  if (Array.isArray(report.definedScenarios) && report.definedScenarios.length > 0) {
    return sortScenarios(report.definedScenarios);
  }
  return sortScenarios(Object.keys(scenarioMetadata));
}

function scenarioIncludedByMetadata(scenario) {
  return getScenarioMetadata(scenario).includeInAnalysis !== false;
}

function getAnalysisScenarioList(report) {
  if (Array.isArray(report.analysisScenarios) && report.analysisScenarios.length > 0) {
    return sortScenarios(report.analysisScenarios);
  }
  return getDefinedScenarioList(report).filter(scenarioIncludedByMetadata);
}

function getExcludedScenarioList(report) {
  if (Array.isArray(report.excludedScenarios)) {
    return sortScenarios(report.excludedScenarios);
  }
  return getDefinedScenarioList(report).filter((scenario) => !scenarioIncludedByMetadata(scenario));
}

function resultIncludedInAnalysis(result) {
  return result.includeInAnalysis !== false;
}

function getAnalysisResults(report) {
  return (report.results || []).filter(resultIncludedInAnalysis);
}

function getExcludedResults(report) {
  return (report.results || []).filter((result) => !resultIncludedInAnalysis(result));
}

function getIncludedScenarioSet(report) {
  return new Set(getAnalysisScenarioList(report));
}

function getExcludedScenarioSet(report) {
  return new Set(getExcludedScenarioList(report));
}

function summarizeScenarioEvidence(report) {
  const analysisScenarios = getAnalysisScenarioList(report);
  const analysisScenarioSet = new Set(analysisScenarios);
  const scenarioCounts = Object.fromEntries(
    analysisScenarios.map((scenario) => [
      scenario,
      { passed: 0, failed: 0, skipped: 0, total: 0 },
    ])
  );

  for (const result of getAnalysisResults(report)) {
    for (const scenario of getResultScenarios(result)) {
      if (!analysisScenarioSet.has(scenario)) {
        continue;
      }
      if (!scenarioCounts[scenario]) {
        scenarioCounts[scenario] = { passed: 0, failed: 0, skipped: 0, total: 0 };
      }

      scenarioCounts[scenario].total += 1;
      if (result.skipped) {
        scenarioCounts[scenario].skipped += 1;
      } else if (result.passed) {
        scenarioCounts[scenario].passed += 1;
      } else {
        scenarioCounts[scenario].failed += 1;
      }
    }
  }

  return Object.values(scenarioCounts).reduce(
    (summary, counts) => {
      if (counts.failed > 0) {
        summary.failedOrAbsent += 1;
      } else if (counts.passed > 0 && counts.skipped === 0) {
        summary.fullyValidated += 1;
      } else if (counts.passed > 0) {
        summary.partiallyEvidenced += 1;
      } else {
        summary.untested += 1;
      }
      return summary;
    },
    {
      total: Object.keys(scenarioCounts).length,
      fullyValidated: 0,
      partiallyEvidenced: 0,
      untested: 0,
      failedOrAbsent: 0,
    }
  );
}

function getOverviewRows(report) {
  const analysisResults = getAnalysisResults(report);
  const definedCriteria = analysisResults.length;
  const passed = report.passed ?? analysisResults.filter((result) => result.passed && !result.skipped).length;
  const failed = report.failed ?? analysisResults.filter((result) => !result.passed && !result.skipped).length;
  const skipped = report.skipped ?? analysisResults.filter((result) => result.skipped).length;
  const excluded = report.excluded ?? getExcludedResults(report).length;
  const executed = passed + failed;
  const scenarioSummary = summarizeScenarioEvidence(report);

  return [
    {
      metric: "Defined criteria",
      result: String(definedCriteria),
      interpretation: "Checks included in analysis",
    },
    {
      metric: "Excluded criteria",
      result: String(excluded),
      interpretation: "Skipped by Include in Analysis = false and not counted in coverage metrics",
    },
    {
      metric: "Executed criteria",
      result: formatMetricRatio(executed, definedCriteria),
      interpretation:
        skipped === 0
          ? "All defined criteria have executable evidence"
          : `${pluralize(skipped, "criterion", "criteria")} still unexecuted`,
    },
    {
      metric: "Passed among executed criteria",
      result: formatMetricRatio(passed, executed),
      interpretation:
        executed === 0
          ? "No implemented checks executed yet"
          : passed / executed >= 0.9
          ? "High success rate for implemented checks"
          : "Implemented checks still expose material failures",
    },
    {
      metric: "Failed among executed criteria",
      result: formatMetricRatio(failed, executed),
      interpretation:
        failed === 0
          ? "No explicit architectural gaps surfaced"
          : `${pluralize(failed, "explicit architectural gap")} surfaced`,
    },
    {
      metric: "Skipped criteria",
      result: formatMetricRatio(skipped, definedCriteria),
      interpretation: "Not negative evidence, but absence of validation",
    },
    {
      metric: "Skipped by meaning",
      result: formatReportSkipBreakdown(report),
      interpretation: "FA = feature absent, PI = pending implementation, US = under-specified",
    },
    {
      metric: "Fully validated scenarios",
      result: formatMetricRatio(
        scenarioSummary.fullyValidated,
        scenarioSummary.total
      ),
      interpretation: "All currently defined checks passed",
    },
    {
      metric: "Partially evidenced scenarios",
      result: formatMetricRatio(
        scenarioSummary.partiallyEvidenced,
        scenarioSummary.total
      ),
      interpretation: "Some checks pass, but a material condition remains untested",
    },
    {
      metric: "Untested scenarios",
      result: formatMetricRatio(scenarioSummary.untested, scenarioSummary.total),
      interpretation: "No executable evidence",
    },
    {
      metric: "Failed/absent scenarios",
      result: formatMetricRatio(
        scenarioSummary.failedOrAbsent,
        scenarioSummary.total
      ),
      interpretation: "Required mechanism is missing",
    },
  ];
}

function renderOverview(report) {
  if (!elements.overviewBody) {
    return;
  }

  elements.overviewBody.innerHTML = getOverviewRows(report)
    .map(
      (row) => `
        <tr>
          <th scope="row">${escapeHtml(row.metric)}</th>
          <td class="overview-result">${row.result}</td>
          <td>${escapeHtml(row.interpretation)}</td>
        </tr>
      `
    )
    .join("");
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, "");
}

function renderSummary(report) {
  const analysisResults = getAnalysisResults(report);
  const passed = report.passed ?? analysisResults.filter((result) => result.passed && !result.skipped).length;
  const failed = report.failed ?? analysisResults.filter((result) => !result.passed && !result.skipped).length;
  const skipped = report.skipped ?? analysisResults.filter((result) => result.skipped).length;
  const evaluated = passed + failed;
  const total = evaluated + skipped;
  const percentage = evaluated === 0 ? 0 : Math.round((passed / evaluated) * 100);
  const scenarios = getAnalysisScenarioList(report);
  const generated = formatTimestamp(report.generatedAt);
  const allPassed = failed === 0 && skipped === 0 && total > 0;
  const someSkipped = failed === 0 && skipped > 0;
  const allResults = report.results || [];

  elements.passedCount.textContent = passed;
  elements.failedCount.textContent = failed;
  elements.skippedCount.textContent = skipped;
  elements.scenarioCount.textContent = scenarios.length;
  elements.scenarioList.textContent = scenarios.join(" · ");
  elements.passedNote.textContent = `${passed} of ${evaluated} evaluated checks`;
  elements.generatedTime.textContent = generated.time;
  elements.generatedDate.textContent = generated.date;
  elements.coverageFill.style.width = `${percentage}%`;
  elements.coverageTrack.setAttribute("aria-valuenow", String(percentage));
  elements.coveragePercent.textContent = `${percentage}%`;
  elements.allFilterCount.textContent = allResults.length;
  elements.passedFilterCount.textContent = allResults.filter((result) => result.passed && !result.skipped).length;
  elements.failedFilterCount.textContent = allResults.filter((result) => !result.passed && !result.skipped).length;
  elements.skippedFilterCount.textContent = allResults.filter((result) => result.skipped).length;
  elements.runState.classList.toggle("is-failed", !allPassed && !someSkipped);
  elements.runState.classList.toggle("is-skipped", someSkipped);
  elements.runStateLabel.textContent = allPassed
    ? "All checks passed"
    : someSkipped
    ? "Checks skipped"
    : "Failures detected";
  elements.serviceEndpoints.textContent =
    `CSS ${report.cssBaseUrl} · Verifier ${report.verifierBaseUrl}`;
}

function createMatrixCell() {
  return {
    passed: 0,
    failed: 0,
    skipped: 0,
    skipCategories: Object.fromEntries(skipCategoryOrder.map((category) => [category, 0])),
    total: 0,
    scenarios: new Set(),
  };
}

function createEmptyMatrix() {
  return Object.fromEntries(
    technicalAspectOrder.map((aspect) => [
      aspect,
      Object.fromEntries(designGoalOrder.map((goal) => [goal, createMatrixCell()])),
    ])
  );
}

function addResultToMatrixCell(cell, result, scenario) {
  cell.total += 1;
  cell.scenarios.add(scenario);
  if (result.skipped) {
    cell.skipped += 1;
    const category = result.skipCategory || "unknown";
    cell.skipCategories[category] = (cell.skipCategories[category] || 0) + 1;
  } else if (result.passed) {
    cell.passed += 1;
  } else {
    cell.failed += 1;
  }
}

function addResultToAggregateCell(cell, result, scenarios) {
  cell.total += 1;
  scenarios.forEach((scenario) => cell.scenarios.add(scenario));
  if (result.skipped) {
    cell.skipped += 1;
    const category = result.skipCategory || "unknown";
    cell.skipCategories[category] = (cell.skipCategories[category] || 0) + 1;
  } else if (result.passed) {
    cell.passed += 1;
  } else {
    cell.failed += 1;
  }
}

function sortScenarios(scenarios) {
  return [...new Set(scenarios)].sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true })
  );
}

function formatScenarioList(scenarios) {
  const sortedScenarios = sortScenarios(scenarios);
  return sortedScenarios.length === 0 ? "--" : sortedScenarios.join(", ");
}

function getSkipCategoryEntries(cell) {
  return skipCategoryOrder
    .map((category) => ({
      category,
      count: cell.skipCategories?.[category] || 0,
      metadata: skipCategoryMetadata[category] || skipCategoryMetadata.unknown,
    }))
    .filter((entry) => entry.count > 0);
}

function formatSkipBreakdown(cell, separator = " ") {
  const entries = getSkipCategoryEntries(cell);
  return entries.length === 0
    ? ""
    : entries.map((entry) => `${entry.metadata.code}:${entry.count}`).join(separator);
}

function formatMatrixValue(cell) {
  const base = `${cell.passed}/${cell.failed}/${cell.total}`;
  const skipBreakdown = formatSkipBreakdown(cell);
  return skipBreakdown ? `${base} [${skipBreakdown}]` : base;
}

function formatSkipTitleParts(cell) {
  return getSkipCategoryEntries(cell).map((entry) =>
    `${entry.metadata.label}: ${entry.count} (${entry.metadata.description})`
  );
}

function formatReportSkipBreakdown(report) {
  const counts = { ...(report.skippedByCategory || {}) };
  if (Object.keys(counts).length === 0) {
    for (const result of getAnalysisResults(report)) {
      if (!result.skipped) {
        continue;
      }
      const category = result.skipCategory || "unknown";
      counts[category] = (counts[category] || 0) + 1;
    }
  }
  const entries = skipCategoryOrder
    .map((category) => ({
      count: counts[category] || 0,
      metadata: skipCategoryMetadata[category] || skipCategoryMetadata.unknown,
    }))
    .filter((entry) => entry.count > 0);
  return entries.length === 0
    ? "No skipped checks"
    : entries.map((entry) => `${entry.metadata.code}:${entry.count}`).join(", ");
}

function getConfiguredAspectScenarios(aspect, report) {
  const scenarios = designGoalOrder.flatMap((goal) => scenarioMatrix[aspect]?.[goal] || []);
  if (!report) {
    return sortScenarios(scenarios.filter(scenarioIncludedByMetadata));
  }
  const includedScenarios = getIncludedScenarioSet(report);
  return sortScenarios(scenarios.filter((scenario) => includedScenarios.has(scenario)));
}

function getConfiguredGoalScenarios(goal, report) {
  const scenarios = technicalAspectOrder.flatMap((aspect) => scenarioMatrix[aspect]?.[goal] || []);
  if (!report) {
    return sortScenarios(scenarios.filter(scenarioIncludedByMetadata));
  }
  const includedScenarios = getIncludedScenarioSet(report);
  return sortScenarios(scenarios.filter((scenario) => includedScenarios.has(scenario)));
}

function buildMatrixCounts(results) {
  const matrix = createEmptyMatrix();

  for (const result of results) {
    if (!resultIncludedInAnalysis(result)) {
      continue;
    }
    const countedCells = new Set();
    for (const scenario of getResultScenarios(result)) {
      for (const placement of getScenarioMatrixPlacements(scenario)) {
        const key = `${placement.aspect}::${placement.goal}`;
        if (countedCells.has(key)) {
          matrix[placement.aspect][placement.goal].scenarios.add(scenario);
          continue;
        }
        countedCells.add(key);
        addResultToMatrixCell(matrix[placement.aspect][placement.goal], result, scenario);
      }
    }
  }

  return matrix;
}

function buildMatrixAggregates(results, report) {
  const aspects = Object.fromEntries(
    technicalAspectOrder.map((aspect) => [aspect, createMatrixCell()])
  );
  const goals = Object.fromEntries(
    designGoalOrder.map((goal) => [goal, createMatrixCell()])
  );
  const aspectScenarioSets = Object.fromEntries(
    technicalAspectOrder.map((aspect) => [
      aspect,
      new Set(getConfiguredAspectScenarios(aspect, report)),
    ])
  );
  const goalScenarioSets = Object.fromEntries(
    designGoalOrder.map((goal) => [goal, new Set(getConfiguredGoalScenarios(goal, report))])
  );

  for (const result of results) {
    if (!resultIncludedInAnalysis(result)) {
      continue;
    }
    const scenarios = getResultScenarios(result);
    for (const aspect of technicalAspectOrder) {
      const matchedScenarios = scenarios.filter((scenario) =>
        aspectScenarioSets[aspect].has(scenario)
      );
      if (matchedScenarios.length > 0) {
        addResultToAggregateCell(aspects[aspect], result, matchedScenarios);
      }
    }

    for (const goal of designGoalOrder) {
      const matchedScenarios = scenarios.filter((scenario) =>
        goalScenarioSets[goal].has(scenario)
      );
      if (matchedScenarios.length > 0) {
        addResultToAggregateCell(goals[goal], result, matchedScenarios);
      }
    }
  }

  return { aspects, goals };
}

function matrixCellClass(cell) {
  if (cell.total === 0) {
    return "is-empty";
  }
  if (cell.failed > 0) {
    return "is-failed";
  }
  if (cell.skipped > 0) {
    return "is-skipped";
  }
  return "is-passed";
}

function getMatrixScenarioGroups(aspect, goal, report) {
  const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
  const includedScenarios = report ? getIncludedScenarioSet(report) : new Set(configuredScenarios.filter(scenarioIncludedByMetadata));
  const excludedScenarios = report ? getExcludedScenarioSet(report) : new Set(configuredScenarios.filter((scenario) => !scenarioIncludedByMetadata(scenario)));

  return {
    configuredScenarios,
    includedConfigured: configuredScenarios.filter((scenario) => includedScenarios.has(scenario)),
    excludedConfigured: configuredScenarios.filter((scenario) => excludedScenarios.has(scenario)),
  };
}

function formatConfiguredScenarioLabel(includedConfigured, excludedConfigured) {
  const parts = [];
  if (includedConfigured.length > 0) {
    parts.push(includedConfigured.join(", "));
  }
  if (excludedConfigured.length > 0) {
    parts.push(`EX: ${excludedConfigured.join(", ")}`);
  }
  return parts.join(" · ");
}

function renderMatrixCell(cell, aspect, goal, report) {
  const { configuredScenarios, includedConfigured, excludedConfigured } =
    getMatrixScenarioGroups(aspect, goal, report);
  if (configuredScenarios.length === 0) {
    return `<td class="matrix-cell is-empty" title="No scenarios defined for ${escapeHtml(goal)} x ${escapeHtml(aspect)}">—</td>`;
  }

  if (includedConfigured.length === 0 && excludedConfigured.length > 0) {
    const excludedLabel = excludedConfigured.join(", ");
    const title = [
      `${designGoalLabels[goal] || goal} x ${aspect}`,
      `Excluded from analysis: ${excludedLabel}`,
    ].join(" · ");

    return `
      <td class="matrix-cell is-excluded" title="${escapeHtml(title)}">
        <span class="matrix-excluded">EX</span>
        <small>${escapeHtml(excludedLabel)}</small>
      </td>
    `;
  }

  const scenarioLabel = formatConfiguredScenarioLabel(includedConfigured, excludedConfigured);
  const title = [
    `${designGoalLabels[goal] || goal} x ${aspect}`,
    `Included scenarios: ${includedConfigured.join(", ")}`,
    excludedConfigured.length > 0 ? `Excluded scenarios: ${excludedConfigured.join(", ")}` : "",
    `Passed: ${cell.passed}`,
    `Failed: ${cell.failed}`,
    `Skipped: ${cell.skipped}`,
    ...formatSkipTitleParts(cell),
    `Total: ${cell.total}`,
  ].filter(Boolean).join(" · ");
  const skipBreakdown = formatSkipBreakdown(cell);

  return `
    <td class="matrix-cell ${matrixCellClass(cell)}" title="${escapeHtml(title)}">
      <span class="matrix-counts">
        <strong>${cell.passed}</strong>
        <span>${cell.failed}</span>
        <span>${cell.total}</span>
      </span>
      ${skipBreakdown ? `<span class="matrix-skip-breakdown">${escapeHtml(skipBreakdown)}</span>` : ""}
      <small>${escapeHtml(scenarioLabel)}</small>
    </td>
  `;
}

function renderMatrixHeader() {
  if (!elements.matrixHead) {
    return;
  }

  const aggregateHeaders = state.showMatrixAggregates
    ? `
        <th scope="col" class="matrix-aggregate-header matrix-aggregate-start">Aspect total</th>
        <th scope="col" class="matrix-aggregate-header">Aspect scenarios</th>
      `
    : "";

  elements.matrixHead.innerHTML = `
    <tr>
      <th scope="col">Technical aspect</th>
      ${designGoalOrder
        .map((goal) => `<th scope="col" title="${escapeHtml(designGoalLabels[goal])}">${escapeHtml(goal)}</th>`)
        .join("")}
      ${aggregateHeaders}
    </tr>
  `;
}

function renderAggregateCountCell(cell, label, extraClass = "") {
  const title = [
    label,
    `Passed: ${cell.passed}`,
    `Failed: ${cell.failed}`,
    `Skipped: ${cell.skipped}`,
    ...formatSkipTitleParts(cell),
    `Total: ${cell.total}`,
  ].join(" · ");
  const skipBreakdown = formatSkipBreakdown(cell);

  return `
    <td class="matrix-cell matrix-aggregate-cell ${extraClass} ${matrixCellClass(cell)}" title="${escapeHtml(title)}">
      <span class="matrix-counts">
        <strong>${cell.passed}</strong>
        <span>${cell.failed}</span>
        <span>${cell.total}</span>
      </span>
      ${skipBreakdown ? `<span class="matrix-skip-breakdown">${escapeHtml(skipBreakdown)}</span>` : ""}
    </td>
  `;
}

function renderAggregateScenarioCell(scenarios, label) {
  const scenarioLabel = formatScenarioList(scenarios);
  return `
    <td class="matrix-cell matrix-aggregate-cell matrix-scenarios-cell" title="${escapeHtml(label)}: ${escapeHtml(scenarioLabel)}">
      <span class="matrix-scenario-list">${escapeHtml(scenarioLabel)}</span>
    </td>
  `;
}

function renderAggregatePlaceholderCell(extraClass = "") {
  return `<td class="matrix-cell matrix-aggregate-cell ${extraClass} is-empty">—</td>`;
}

function renderGoalAggregateCountRow(aggregates) {
  return `
    <tr class="matrix-aggregate-row">
      <th scope="row">Design goal totals</th>
      ${designGoalOrder
        .map((goal) =>
          renderAggregateCountCell(aggregates.goals[goal], `${designGoalLabels[goal]} total`)
        )
        .join("")}
      ${renderAggregatePlaceholderCell("matrix-aggregate-start")}
      ${renderAggregatePlaceholderCell()}
    </tr>
  `;
}

function renderGoalAggregateScenarioRow() {
  return `
    <tr class="matrix-aggregate-row">
      <th scope="row">Design goal scenarios</th>
      ${designGoalOrder
        .map((goal) =>
          renderAggregateScenarioCell(
            getConfiguredGoalScenarios(goal, state.report),
            `${designGoalLabels[goal]} scenarios`
          )
        )
        .join("")}
      ${renderAggregatePlaceholderCell("matrix-aggregate-start")}
      ${renderAggregatePlaceholderCell()}
    </tr>
  `;
}

function renderAssuranceMatrix(report) {
  if (!elements.matrixBody) {
    return;
  }

  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || [], report);
  const rows = technicalAspectOrder
    .map((aspect) => `
      <tr>
        <th scope="row">${escapeHtml(aspect)}</th>
        ${designGoalOrder.map((goal) => renderMatrixCell(matrix[aspect][goal], aspect, goal, report)).join("")}
        ${
          state.showMatrixAggregates
            ? renderAggregateCountCell(aggregates.aspects[aspect], `${aspect} total`, "matrix-aggregate-start") +
              renderAggregateScenarioCell(getConfiguredAspectScenarios(aspect, report), `${aspect} scenarios`)
            : ""
        }
      </tr>
    `)
    .join("");
  renderMatrixHeader();
  elements.matrixBody.innerHTML = state.showMatrixAggregates
    ? rows + renderGoalAggregateCountRow(aggregates) + renderGoalAggregateScenarioRow()
    : rows;
}

function escapeLatex(value) {
  const replacements = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "#": "\\#",
    "$": "\\$",
    "%": "\\%",
    "&": "\\&",
    "_": "\\_",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };

  return String(value).replace(/[\\{}#$%&_~^]/g, (character) => replacements[character]);
}

function renderLatexMatrixCell(cell, aspect, goal, report) {
  const { configuredScenarios, includedConfigured, excludedConfigured } =
    getMatrixScenarioGroups(aspect, goal, report);
  if (configuredScenarios.length === 0) {
    return "--";
  }
  if (includedConfigured.length === 0 && excludedConfigured.length > 0) {
    return "EX";
  }

  return formatMatrixValue(cell);
}

function generateMatrixLatex(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || [], report);
  const includeAggregates = state.showMatrixAggregates;
  const columns = [
    "l",
    ...designGoalOrder.map(() => "c"),
    ...(includeAggregates ? ["c", "l"] : []),
  ].join("");
  const header = [
    "Technical aspect",
    ...designGoalOrder,
    ...(includeAggregates ? ["Aspect total", "Aspect scenarios"] : []),
  ]
    .map(escapeLatex)
    .join(" & ");
  const rows = technicalAspectOrder.map((aspect) => {
    const cells = designGoalOrder.map((goal) =>
      renderLatexMatrixCell(matrix[aspect][goal], aspect, goal, report)
    );
    if (includeAggregates) {
      cells.push(
        formatMatrixValue(aggregates.aspects[aspect]),
        escapeLatex(formatScenarioList(getConfiguredAspectScenarios(aspect, report)))
      );
    }
    return `${escapeLatex(aspect)} & ${cells.join(" & ")} \\\\`;
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map((goal) => formatMatrixValue(aggregates.goals[goal])),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal, report))),
          "--",
          "--",
        ],
      ].map((row) => row.map(escapeLatex).join(" & ") + " \\\\")
    : [];

  return [
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{Scenario assurance matrix. Cell format: passing/failing/total with optional skip breakdown (FA feature absent, PI pending implementation, US under-specified). EX means excluded from analysis.}",
    `\\begin{tabular}{${columns}}`,
    "\\hline",
    `${header} \\\\`,
    "\\hline",
    ...rows,
    ...aggregateRows,
    "\\hline",
    "\\end{tabular}",
    "\\end{table}",
  ].join("\n");
}

function escapeMarkdownTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function renderMarkdownMatrixCell(cell, aspect, goal, report) {
  const { configuredScenarios, includedConfigured, excludedConfigured } =
    getMatrixScenarioGroups(aspect, goal, report);
  if (configuredScenarios.length === 0) {
    return "--";
  }
  if (includedConfigured.length === 0 && excludedConfigured.length > 0) {
    return "EX";
  }

  return formatMatrixValue(cell);
}

function generateMatrixMarkdown(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || [], report);
  const includeAggregates = state.showMatrixAggregates;
  const header = [
    "Technical aspect",
    ...designGoalOrder,
    ...(includeAggregates ? ["Aspect total", "Aspect scenarios"] : []),
  ];
  const separator = [
    "---",
    ...designGoalOrder.map(() => "---:"),
    ...(includeAggregates ? ["---:", "---"] : []),
  ];
  const rows = technicalAspectOrder.map((aspect) => {
    const cells = designGoalOrder.map((goal) =>
      renderMarkdownMatrixCell(matrix[aspect][goal], aspect, goal, report)
    );
    if (includeAggregates) {
      cells.push(
        formatMatrixValue(aggregates.aspects[aspect]),
        formatScenarioList(getConfiguredAspectScenarios(aspect, report))
      );
    }
    return `| ${[aspect, ...cells].map(escapeMarkdownTableCell).join(" | ")} |`;
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map((goal) => formatMatrixValue(aggregates.goals[goal])),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal, report))),
          "--",
          "--",
        ],
      ].map((row) => `| ${row.map(escapeMarkdownTableCell).join(" | ")} |`)
    : [];

  return [
    "| " + header.map(escapeMarkdownTableCell).join(" | ") + " |",
    "| " + separator.join(" | ") + " |",
    ...rows,
    ...aggregateRows,
    "",
    "Cell format: passing/failing/total. Skip breakdown codes: FA = feature absent, PI = pending implementation, US = under-specified. EX = excluded from analysis.",
  ].join("\n");
}

function renderHtmlMatrixCell(cell, aspect, goal, report) {
  const { configuredScenarios, includedConfigured, excludedConfigured } =
    getMatrixScenarioGroups(aspect, goal, report);
  const cellStyle = "border: 1px solid #d0d7de; padding: 6px 8px; text-align: center;";
  if (configuredScenarios.length === 0) {
    return `<td style="${cellStyle}">--</td>`;
  }
  if (includedConfigured.length === 0 && excludedConfigured.length > 0) {
    return `<td style="${cellStyle} background: #eef2f6;">EX</td>`;
  }

  return `<td style="${cellStyle}">${escapeHtml(formatMatrixValue(cell))}</td>`;
}

function renderHtmlValueCell(value, textAlign = "center", extraStyle = "") {
  return `<td style="border: 1px solid #d0d7de; padding: 6px 8px; text-align: ${textAlign}; ${extraStyle}">${escapeHtml(value)}</td>`;
}

function generateMatrixHtml(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || [], report);
  const includeAggregates = state.showMatrixAggregates;
  const headingStyle = "border: 1px solid #d0d7de; padding: 6px 8px; background: #f6f8fa; font-weight: 700;";
  const aggregateStartStyle = "border-left: 4px solid #294b72;";
  const aggregateRowStyle = "border-top: 4px solid #294b72;";
  const rowHeadingStyle = "border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; font-weight: 700;";
  const header = [
    "Technical aspect",
    ...designGoalOrder,
    ...(includeAggregates ? ["Aspect total", "Aspect scenarios"] : []),
  ]
    .map((heading, index) => {
      const extraStyle =
        includeAggregates && index === designGoalOrder.length + 1
          ? aggregateStartStyle
          : "";
      return `<th scope="col" style="${headingStyle} ${extraStyle}">${escapeHtml(heading)}</th>`;
    })
    .join("");
  const rows = technicalAspectOrder
    .map((aspect) => {
      const cells = designGoalOrder
        .map((goal) => renderHtmlMatrixCell(matrix[aspect][goal], aspect, goal, report))
        .join("");
      const aggregateCells = includeAggregates
        ? [
            renderHtmlValueCell(
              formatMatrixValue(aggregates.aspects[aspect]),
              "center",
              aggregateStartStyle
            ),
            renderHtmlValueCell(formatScenarioList(getConfiguredAspectScenarios(aspect, report)), "left"),
          ].join("")
        : "";
      return `  <tr>\n    <th scope="row" style="${rowHeadingStyle}">${escapeHtml(aspect)}</th>\n    ${cells}${aggregateCells}\n  </tr>`;
    })
    .join("\n");
  const aggregateRows = includeAggregates
    ? [
        `  <tr>\n    <th scope="row" style="${rowHeadingStyle} ${aggregateRowStyle}">Design goal totals</th>\n    ${designGoalOrder
          .map((goal) =>
            renderHtmlValueCell(
              formatMatrixValue(aggregates.goals[goal]),
              "center",
              aggregateRowStyle
            )
          )
          .join("")}${renderHtmlValueCell("--", "center", aggregateRowStyle + aggregateStartStyle)}${renderHtmlValueCell("--", "center", aggregateRowStyle)}\n  </tr>`,
        `  <tr>\n    <th scope="row" style="${rowHeadingStyle} ${aggregateRowStyle}">Design goal scenarios</th>\n    ${designGoalOrder
          .map((goal) =>
            renderHtmlValueCell(
              formatScenarioList(getConfiguredGoalScenarios(goal, report)),
              "left",
              aggregateRowStyle
            )
          )
          .join("")}${renderHtmlValueCell("--", "center", aggregateRowStyle + aggregateStartStyle)}${renderHtmlValueCell("--", "center", aggregateRowStyle)}\n  </tr>`,
      ].join("\n")
    : "";

  return [
    '<table aria-label="Scenario assurance matrix" style="border-collapse: collapse;">',
    '  <caption style="caption-side: top; font-weight: 700; margin-bottom: 6px;">Scenario assurance matrix. Cell format: passing/failing/total. Skip breakdown codes: FA feature absent, PI pending implementation, US under-specified. EX excluded from analysis.</caption>',
    "  <thead>",
    `    <tr>${header}</tr>`,
    "  </thead>",
    "  <tbody>",
    rows,
    aggregateRows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

function generateMatrixTsv(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || [], report);
  const includeAggregates = state.showMatrixAggregates;
  const header = [
    "Technical aspect",
    ...designGoalOrder,
    ...(includeAggregates ? ["Aspect total", "Aspect scenarios"] : []),
  ].join("\t");
  const rows = technicalAspectOrder.map((aspect) => {
    const cells = designGoalOrder.map((goal) => {
      const { configuredScenarios, includedConfigured, excludedConfigured } =
        getMatrixScenarioGroups(aspect, goal, report);
      if (configuredScenarios.length === 0) {
        return "--";
      }
      if (includedConfigured.length === 0 && excludedConfigured.length > 0) {
        return "EX";
      }
      return formatMatrixValue(matrix[aspect][goal]);
    });
    if (includeAggregates) {
      cells.push(
        formatMatrixValue(aggregates.aspects[aspect]),
        formatScenarioList(getConfiguredAspectScenarios(aspect, report))
      );
    }
    return [aspect, ...cells].join("\t");
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map((goal) => formatMatrixValue(aggregates.goals[goal])),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal, report))),
          "--",
          "--",
        ],
      ].map((row) => row.join("\t"))
    : [];

  return [
    header,
    ...rows,
    ...aggregateRows,
    "",
    "Cell format: passing/failing/total. Skip breakdown codes: FA = feature absent, PI = pending implementation, US = under-specified. EX = excluded from analysis.",
  ].join("\n");
}

function getOverviewExportRows(report) {
  return getOverviewRows(report).map((row) => ({
    metric: row.metric,
    resultText: stripHtml(row.result),
    resultHtml: row.result,
    interpretation: row.interpretation,
  }));
}

function generateOverviewLatex(report) {
  const rows = getOverviewExportRows(report).map((row) =>
    [row.metric, row.resultText, row.interpretation].map(escapeLatex).join(" & ") + " \\\\"
  );

  return [
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{Scenario evidence overview.}",
    "\\begin{tabular}{lrl}",
    "\\hline",
    "Metric & Result & Interpretation \\\\",
    "\\hline",
    ...rows,
    "\\hline",
    "\\end{tabular}",
    "\\end{table}",
  ].join("\n");
}

function generateOverviewMarkdown(report) {
  const rows = getOverviewExportRows(report).map((row) =>
    `| ${[row.metric, row.resultText, row.interpretation].map(escapeMarkdownTableCell).join(" | ")} |`
  );

  return [
    "| Metric | Result | Interpretation |",
    "| --- | ---: | --- |",
    ...rows,
  ].join("\n");
}

function generateOverviewHtml(report) {
  const headingStyle = "border: 1px solid #d0d7de; padding: 6px 8px; background: #f6f8fa; font-weight: 700;";
  const metricHeadingStyle = "border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; font-weight: 700; background: #f7f9fb;";
  const rows = getOverviewExportRows(report)
    .map((row) => {
      return [
        "  <tr>",
        `    <th scope="row" style="${metricHeadingStyle}">${escapeHtml(row.metric)}</th>`,
        `    <td style="border: 1px solid #d0d7de; padding: 6px 8px; text-align: right; white-space: nowrap;">${row.resultHtml}</td>`,
        `    <td style="border: 1px solid #d0d7de; padding: 6px 8px; text-align: left;">${escapeHtml(row.interpretation)}</td>`,
        "  </tr>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<table aria-label="Scenario evidence overview" style="border-collapse: collapse;">',
    '  <caption style="caption-side: top; font-weight: 700; margin-bottom: 6px;">Scenario evidence overview</caption>',
    "  <thead>",
    `    <tr><th scope="col" style="${headingStyle}">Metric</th><th scope="col" style="${headingStyle} text-align: right;">Result</th><th scope="col" style="${headingStyle} text-align: left;">Interpretation</th></tr>`,
    "  </thead>",
    "  <tbody>",
    rows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

function generateOverviewTsv(report) {
  return [
    "Metric\tResult\tInterpretation",
    ...getOverviewExportRows(report).map((row) =>
      [row.metric, row.resultText, row.interpretation].join("\t")
    ),
  ].join("\n");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall through to the textarea copy path for browsers that block Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy was blocked by the browser");
  }
}

function copyHtmlBySelection(html) {
  const container = document.createElement("div");
  container.contentEditable = "true";
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-10000px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.userSelect = "text";
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  if (!selection) {
    document.body.removeChild(container);
    throw new Error("Rich HTML clipboard copy was blocked by the browser");
  }

  try {
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Rich HTML clipboard copy was blocked by the browser");
    }
  } finally {
    selection.removeAllRanges();
    document.body.removeChild(container);
  }
}

async function copyHtmlToClipboard(html, plainText) {
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch (error) {
      // Fall through to selection-based rich copy for browsers that block Clipboard API.
    }
  }

  copyHtmlBySelection(html);
}

function setCopyMatrixStatus(message, isError = false) {
  if (!elements.copyMatrixStatus) {
    return;
  }

  if (state.copyStatusTimeout) {
    clearTimeout(state.copyStatusTimeout);
  }

  elements.copyMatrixStatus.textContent = message;
  elements.copyMatrixStatus.classList.toggle("is-error", isError);
  if (message) {
    state.copyStatusTimeout = window.setTimeout(() => {
      elements.copyMatrixStatus.textContent = "";
      elements.copyMatrixStatus.classList.remove("is-error");
      state.copyStatusTimeout = null;
    }, 3200);
  }
}

function setCopyOverviewStatus(message, isError = false) {
  if (!elements.copyOverviewStatus) {
    return;
  }

  if (state.overviewCopyStatusTimeout) {
    clearTimeout(state.overviewCopyStatusTimeout);
  }

  elements.copyOverviewStatus.textContent = message;
  elements.copyOverviewStatus.classList.toggle("is-error", isError);
  if (message) {
    state.overviewCopyStatusTimeout = window.setTimeout(() => {
      elements.copyOverviewStatus.textContent = "";
      elements.copyOverviewStatus.classList.remove("is-error");
      state.overviewCopyStatusTimeout = null;
    }, 3200);
  }
}

async function copyOverviewAsLatex() {
  if (!state.report) {
    setCopyOverviewStatus("No report loaded", true);
    return;
  }

  try {
    const latex = generateOverviewLatex(state.report);
    await copyTextToClipboard(latex);
    setCopyOverviewStatus("Copied");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyOverviewStatus(message, true);
  }
}

async function copyOverviewAsMarkdown() {
  if (!state.report) {
    setCopyOverviewStatus("No report loaded", true);
    return;
  }

  try {
    const markdown = generateOverviewMarkdown(state.report);
    await copyTextToClipboard(markdown);
    setCopyOverviewStatus("Copied Markdown");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyOverviewStatus(message, true);
  }
}

async function copyOverviewAsHtml() {
  if (!state.report) {
    setCopyOverviewStatus("No report loaded", true);
    return;
  }

  try {
    const html = generateOverviewHtml(state.report);
    const plainText = generateOverviewTsv(state.report);
    await copyHtmlToClipboard(html, plainText);
    setCopyOverviewStatus("Copied HTML");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyOverviewStatus(message, true);
  }
}

async function copyMatrixAsLatex() {
  if (!state.report) {
    setCopyMatrixStatus("No report loaded", true);
    return;
  }

  try {
    const latex = generateMatrixLatex(state.report);
    await copyTextToClipboard(latex);
    setCopyMatrixStatus("Copied");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyMatrixStatus(message, true);
  }
}

async function copyMatrixAsMarkdown() {
  if (!state.report) {
    setCopyMatrixStatus("No report loaded", true);
    return;
  }

  try {
    const markdown = generateMatrixMarkdown(state.report);
    await copyTextToClipboard(markdown);
    setCopyMatrixStatus("Copied Markdown");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyMatrixStatus(message, true);
  }
}

async function copyMatrixAsHtml() {
  if (!state.report) {
    setCopyMatrixStatus("No report loaded", true);
    return;
  }

  try {
    const html = generateMatrixHtml(state.report);
    const plainText = generateMatrixTsv(state.report);
    await copyHtmlToClipboard(html, plainText);
    setCopyMatrixStatus("Copied HTML");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCopyMatrixStatus(message, true);
  }
}

function getResultScenarios(result) {
  if (typeof result.scenario === "string") {
    return [result.scenario];
  }
  return Array.isArray(result.scenarios) ? result.scenarios : [];
}

function getScenarioMetadata(scenario) {
  return scenarioMetadata[scenario] || {
    goals: [],
    aspect: "Unmapped",
  };
}

function formatDependencyReference(dependency) {
  if (!dependency) {
    return "";
  }

  const goal = dependency.designGoal || dependency.goal;
  const scenario = dependency.scenario;
  if (!goal) {
    return "";
  }
  return scenario ? `${goal} via ${scenario}` : goal;
}

function scenarioDependencyTerms(metadata) {
  return [
    metadata.primaryDependency ? "primary dependency" : "",
    formatDependencyReference(metadata.primaryDependency),
    metadata.secondaryDependency ? "secondary dependency" : "",
    formatDependencyReference(metadata.secondaryDependency),
    metadata.primaryDependency?.designGoal,
    metadata.primaryDependency?.scenario,
    metadata.secondaryDependency?.designGoal,
    metadata.secondaryDependency?.scenario,
  ].filter(Boolean);
}

function scenarioSearchTerms(result) {
  const scenarioTerms = getResultScenarios(result).flatMap((scenario) => {
    const metadata = getScenarioMetadata(scenario);
    const placements = getScenarioMatrixPlacements(scenario);
    return [
      scenario,
      metadata.aspect,
      metadata.title,
      ...metadata.goals,
      ...metadata.goals.map((goal) => designGoalLabels[goal]),
      ...scenarioDependencyTerms(metadata),
      ...placements.map((placement) => placement.aspect),
      ...placements.map((placement) => placement.goal),
      ...placements.map((placement) => designGoalLabels[placement.goal]),
    ].filter(Boolean);
  });
  const skipMetadata = result.skipped ? getSkipMetadata(result) : null;
  return [
    ...scenarioTerms,
    result.includeInAnalysis === false ? "excluded from analysis" : "included in analysis",
    result.includeInAnalysis === false ? "include in analysis false" : "include in analysis true",
    result.skipCategory,
    result.skipReason,
    skipMetadata?.code,
    skipMetadata?.label,
    skipMetadata?.description,
  ].filter(Boolean);
}

function renderScenarioTag(scenario) {
  const metadata = getScenarioMetadata(scenario);
  const goalCode = metadata.goals.length > 0 ? metadata.goals.join("/") : "n/a";
  const goalLabel = metadata.goals
    .map((goal) => `${goal}: ${designGoalLabels[goal] || goal}`)
    .join(", ");
  const title = [
    metadata.title || `Scenario ${scenario}`,
    goalLabel,
    metadata.aspect,
    metadata.primaryDependency
      ? `Primary dependency: ${formatDependencyReference(metadata.primaryDependency)}`
      : "",
    metadata.secondaryDependency
      ? `Secondary dependency: ${formatDependencyReference(metadata.secondaryDependency)}`
      : "",
    metadata.includeInAnalysis === false ? "Excluded from analysis" : "",
  ].filter(Boolean).join(" · ");
  const dependencyLabel = [
    formatDependencyReference(metadata.primaryDependency),
    formatDependencyReference(metadata.secondaryDependency),
  ].filter(Boolean).join(" + ");

  return `
    <span class="scenario-tag ${metadata.includeInAnalysis === false ? "is-excluded" : ""}" title="${escapeHtml(title)}">
      <span class="scenario-code">${escapeHtml(scenario)}</span>
      <span class="scenario-goal">${escapeHtml(goalCode)}</span>
      <span class="scenario-aspect">${escapeHtml(metadata.aspect)}</span>
      ${dependencyLabel ? `<span class="scenario-dependency">dep ${escapeHtml(dependencyLabel)}</span>` : ""}
    </span>
  `;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs)) {
    return "";
  }
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(2)} s`;
}

function getSkipMetadata(result) {
  return skipCategoryMetadata[result.skipCategory] || skipCategoryMetadata.unknown;
}

function checkStatus(result) {
  if (result.includeInAnalysis === false) {
    return { label: "Excluded from analysis", className: "is-excluded" };
  }
  if (result.skipped) {
    return { label: `Skipped: ${getSkipMetadata(result).label}`, className: "is-skipped" };
  }
  if (result.passed) {
    return { label: "Passed", className: "is-passed" };
  }
  return { label: "Failed", className: "is-failed" };
}

function scenarioStatus(results) {
  if (results.length > 0 && results.every((result) => result.includeInAnalysis === false)) {
    return { label: "Excluded", className: "is-excluded" };
  }

  const includedResults = results.filter(resultIncludedInAnalysis);
  const failed = includedResults.filter((result) => !result.passed && !result.skipped).length;
  const skipped = includedResults.filter((result) => result.skipped).length;
  const passed = includedResults.filter((result) => result.passed && !result.skipped).length;
  if (failed > 0) {
    return { label: "Failed", className: "is-failed" };
  }
  if (passed > 0 && skipped === 0) {
    return { label: "Validated", className: "is-passed" };
  }
  if (passed > 0) {
    return { label: "Partial", className: "is-skipped" };
  }
  return { label: "Untested", className: "is-skipped" };
}

function getOutputFiles(result) {
  const outputCache = result.outputCache || {};
  const files = [];
  if (outputCache.detail) {
    files.push({
      label: "Observed detail",
      path: outputCache.detail,
      contentType: "text/plain",
    });
  }
  if (outputCache.result) {
    files.push({
      label: "Cached check result",
      path: outputCache.result,
      contentType: "application/json",
    });
  }
  for (const artifact of outputCache.artifacts || []) {
    files.push({
      label: artifact.label || artifact.path,
      path: artifact.path,
      contentType: artifact.contentType,
      bytes: artifact.bytes,
    });
  }
  return files;
}

function renderOutputFile(file, resultId, index) {
  const size = file.bytes === undefined ? "" : ` · ${formatBytes(file.bytes)}`;
  return `
    <details
      class="output-file"
      data-output-path="${escapeHtml(file.path)}"
      data-output-content-type="${escapeHtml(file.contentType || "")}"
    >
      <summary>
        <span>${escapeHtml(file.label)}</span>
        <small>${escapeHtml(file.contentType || "text/plain")}${escapeHtml(size)}</small>
      </summary>
      <pre id="output-${escapeHtml(resultId)}-${index}" class="output-content">Open to load cached output…</pre>
    </details>
  `;
}

function renderOutputCheck(result) {
  const status = checkStatus(result);
  const duration = formatDuration(result.durationMs);
  const files = getOutputFiles(result);
  const fileMarkup = files.length === 0
    ? `<p class="output-empty">No cached files for this check.</p>`
    : files.map((file, index) => renderOutputFile(file, result.id, index)).join("");

  return `
    <details class="output-check">
      <summary>
        <span class="check-id">${escapeHtml(result.id)}</span>
        <span class="status-label ${status.className}">${escapeHtml(status.label)}</span>
        <span class="output-check-title">${escapeHtml(result.description)}</span>
        ${duration ? `<small>${escapeHtml(duration)}</small>` : ""}
      </summary>
      <div class="output-check-body">
        <p>${escapeHtml(result.detail)}</p>
        <div class="output-files">${fileMarkup}</div>
      </div>
    </details>
  `;
}

function renderScenarioOutputs(report) {
  if (!elements.scenarioOutputList || !elements.scenarioOutputEmpty) {
    return;
  }

  const resultsByScenario = new Map();
  for (const scenario of getDefinedScenarioList(report)) {
    resultsByScenario.set(scenario, []);
  }
  for (const result of report.results || []) {
    for (const scenario of getResultScenarios(result)) {
      if (!resultsByScenario.has(scenario)) {
        resultsByScenario.set(scenario, []);
      }
      resultsByScenario.get(scenario).push(result);
    }
  }

  const scenarioSections = [...resultsByScenario.entries()]
    .map(([scenario, results]) => {
      const status = scenarioStatus(results);
      const fileCount = results.flatMap(getOutputFiles).length;
      const checkLabel = pluralize(results.length, "check");
      const fileLabel = pluralize(fileCount, "cached file");

      return `
        <details class="scenario-output ${status.className}">
          <summary>
            <span class="scenario-output-code">${escapeHtml(scenario)}</span>
            <span class="scenario-output-title">${escapeHtml(getScenarioMetadata(scenario).title || `Scenario ${scenario}`)}</span>
            <span class="scenario-output-status">${escapeHtml(status.label)}</span>
            <small>${escapeHtml(checkLabel)} · ${escapeHtml(fileLabel)}</small>
          </summary>
          <div class="scenario-output-body">
            ${results.length === 0
              ? `<p class="output-empty">No checks were reported for this scenario.</p>`
              : results.map(renderOutputCheck).join("")}
          </div>
        </details>
      `;
    })
    .join("");

  elements.scenarioOutputList.innerHTML = scenarioSections;
  elements.scenarioOutputEmpty.hidden = scenarioSections.length !== 0;
}

function formatOutputContent(content, contentType, path) {
  if (
    contentType.includes("json") ||
    path.endsWith(".json") ||
    path.endsWith(".jsonld")
  ) {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch (error) {
      return content;
    }
  }
  return content;
}

async function loadOutputFile(details) {
  if (details.dataset.loaded === "true") {
    return;
  }

  const outputPath = details.dataset.outputPath;
  const contentType = details.dataset.outputContentType || "";
  const contentElement = details.querySelector(".output-content");
  if (!outputPath || !contentElement) {
    return;
  }

  contentElement.textContent = "Loading cached output…";

  try {
    let content = state.outputContentCache.get(outputPath);
    if (content === undefined) {
      const response = await fetch(`/api/output?path=${encodeURIComponent(outputPath)}`, {
        cache: "no-store",
      });
      content = await response.text();
      if (!response.ok) {
        throw new Error(content || `HTTP ${response.status}`);
      }
      state.outputContentCache.set(outputPath, content);
    }

    contentElement.textContent = formatOutputContent(content, contentType, outputPath);
    details.dataset.loaded = "true";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    contentElement.textContent = `Unable to load cached output: ${message}`;
    details.dataset.loaded = "error";
  }
}

function resultMatches(result) {
  if (state.filter === "passed" && (!result.passed || result.skipped)) {
    return false;
  }
  if (state.filter === "failed" && (result.passed || result.skipped)) {
    return false;
  }
  if (state.filter === "skipped" && !result.skipped) {
    return false;
  }

  const query = state.search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [
    result.id,
    result.description,
    result.detail,
    ...scenarioSearchTerms(result),
  ].some((value) => String(value).toLowerCase().includes(query));
}

function renderResults() {
  if (!state.report) {
    return;
  }

  const results = state.report.results.filter(resultMatches);
  elements.resultList.innerHTML = results
    .map((result, index) => {
      const status = checkStatus(result);
      const cardClass = status.className;
      const statusLabel = status.label;
      const statusIcon =
        status.className === "is-excluded"
          ? "EX"
          : status.className === "is-skipped"
          ? "–"
          : status.className === "is-passed"
          ? "✓"
          : "!";
      const scenarioTags = getResultScenarios(result)
        .map(renderScenarioTag)
        .join("");

      return `
        <article class="result-card ${cardClass}">
          <div class="result-status" aria-hidden="true">
            <span>${statusIcon}</span>
          </div>
          <div class="result-main">
            <div class="result-meta">
              <span class="check-id">${escapeHtml(result.id)}</span>
              <span class="status-label ${escapeHtml(status.className)}">${escapeHtml(statusLabel)}</span>
              <div class="scenario-tags" aria-label="Scenarios">${scenarioTags}</div>
            </div>
            <h3>${escapeHtml(result.description)}</h3>
            <button
              class="detail-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="detail-${index}"
            >
              View evidence
              <span aria-hidden="true">⌄</span>
            </button>
            <div class="result-detail" id="detail-${index}" hidden>
              <span>Observed result</span>
              <p>${escapeHtml(result.detail)}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.emptyState.hidden = results.length !== 0;
  elements.resultList.hidden = results.length === 0;
}

function setLoading(isLoading) {
  elements.loadingPanel.hidden = !isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.classList.toggle("is-loading", isLoading);
  [
    elements.copyOverviewButton,
    elements.copyMarkdownOverviewButton,
    elements.copyHtmlOverviewButton,
    elements.copyMatrixButton,
    elements.copyMarkdownMatrixButton,
    elements.copyHtmlMatrixButton,
  ].forEach((button) => {
    if (button) {
      button.disabled = isLoading || !state.report;
    }
  });
}

async function loadReport() {
  setLoading(true);
  elements.errorPanel.hidden = true;

  try {
    const response = await fetch(`/api/results?time=${Date.now()}`, {
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || payload.error || `HTTP ${response.status}`);
    }

    state.report = payload;
    renderSummary(payload);
    renderOverview(payload);
    renderAssuranceMatrix(payload);
    renderScenarioOutputs(payload);
    renderResults();
  } catch (error) {
    state.report = null;
    elements.resultList.hidden = true;
    elements.emptyState.hidden = true;
    if (elements.scenarioOutputList) {
      elements.scenarioOutputList.innerHTML = "";
    }
    if (elements.scenarioOutputEmpty) {
      elements.scenarioOutputEmpty.hidden = true;
    }
    elements.errorMessage.textContent =
      error instanceof Error ? error.message : String(error);
    elements.errorPanel.hidden = false;
    elements.runState.classList.add("is-failed");
    elements.runStateLabel.textContent = "Evidence unavailable";
  } finally {
    setLoading(false);
  }
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
    renderResults();
  });
});

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderResults();
});

elements.refreshButton.addEventListener("click", loadReport);

if (elements.matrixAggregatesToggle) {
  elements.matrixAggregatesToggle.addEventListener("change", (event) => {
    state.showMatrixAggregates = event.target.checked;
    if (state.report) {
      renderAssuranceMatrix(state.report);
    }
  });
}

if (elements.copyOverviewButton) {
  elements.copyOverviewButton.addEventListener("click", copyOverviewAsLatex);
}

if (elements.copyMarkdownOverviewButton) {
  elements.copyMarkdownOverviewButton.addEventListener("click", copyOverviewAsMarkdown);
}

if (elements.copyHtmlOverviewButton) {
  elements.copyHtmlOverviewButton.addEventListener("click", copyOverviewAsHtml);
}

if (elements.copyMatrixButton) {
  elements.copyMatrixButton.addEventListener("click", copyMatrixAsLatex);
}

if (elements.copyMarkdownMatrixButton) {
  elements.copyMarkdownMatrixButton.addEventListener("click", copyMatrixAsMarkdown);
}

if (elements.copyHtmlMatrixButton) {
  elements.copyHtmlMatrixButton.addEventListener("click", copyMatrixAsHtml);
}

if (elements.scenarioOutputList) {
  elements.scenarioOutputList.addEventListener(
    "toggle",
    (event) => {
      const details = event.target;
      if (
        details instanceof HTMLDetailsElement &&
        details.classList.contains("output-file") &&
        details.open
      ) {
        loadOutputFile(details);
      }
    },
    true
  );
}

elements.resultList.addEventListener("click", (event) => {
  const button = event.target.closest(".detail-toggle");
  if (!button) {
    return;
  }

  const detail = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  const isExpanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isExpanded));
  button.classList.toggle("is-expanded", !isExpanded);
  detail.hidden = isExpanded;
});

renderMatrixHeader();
loadReport();
