const state = {
  report: null,
  filter: "all",
  search: "",
  showMatrixAggregates: true,
  copyStatusTimeout: null,
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

const scenarioMatrix = {
  Auditability: {
    DS: ["C"],
    DG: ["D"],
    TR: ["C", "D"],
    LC: ["F"],
  },
  Authentication: {
    DS: ["G"],
    DG: ["G", "Q"],
    TR: ["G", "Q"],
    LC: ["J"],
  },
  Authorization: {
    DS: ["K"],
    DG: ["K", "Q"],
    TR: ["K", "Q"],
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
    DS: ["B"],
    DG: ["V"],
    TR: ["B"],
  },
};

const scenarioMetadata = {
  A: {
    goals: ["DS", "TR"],
    aspect: "Verifiability",
    title: "Cross-actor provenance reconstruction",
  },
  B: { goals: ["TR", "DS"], aspect: "Verifiability" },
  C: { goals: ["DS"], aspect: "Auditability" },
  D: { goals: ["DG"], aspect: "Auditability" },
  E: { goals: ["TR"], aspect: "Auditability" },
  F: { goals: ["LC"], aspect: "Auditability" },
  G: { goals: ["DS"], aspect: "Authentication" },
  H: { goals: ["DG"], aspect: "Authentication" },
  I: { goals: ["TR"], aspect: "Authentication" },
  J: { goals: ["LC"], aspect: "Authentication" },
  K: { goals: ["DS"], aspect: "Authorization" },
  L: { goals: ["DG"], aspect: "Authorization" },
  M: { goals: ["TR"], aspect: "Authorization" },
  N: { goals: ["LC"], aspect: "Authorization" },
  O: { goals: ["DS"], aspect: "Queryability" },
  P: { goals: ["INT"], aspect: "Queryability" },
  Q: { goals: ["DG"], aspect: "Discoverability" },
  R: { goals: ["INT"], aspect: "Discoverability" },
  S: { goals: ["INT"], aspect: "Data API interoperability" },
  T: { goals: ["INT"], aspect: "Data API interoperability" },
  U: { goals: ["INT"], aspect: "Data model interoperability" },
  V: { goals: ["DG"], aspect: "Verifiability" },
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

function renderSummary(report) {
  const skipped = report.skipped ?? 0;
  const evaluated = report.passed + report.failed;
  const total = evaluated + skipped;
  const percentage = evaluated === 0 ? 0 : Math.round((report.passed / evaluated) * 100);
  const scenarios = [...new Set(report.results.flatMap(getResultScenarios))].sort();
  const generated = formatTimestamp(report.generatedAt);
  const allPassed = report.failed === 0 && skipped === 0 && total > 0;
  const someSkipped = report.failed === 0 && skipped > 0;

  elements.passedCount.textContent = report.passed;
  elements.failedCount.textContent = report.failed;
  elements.skippedCount.textContent = skipped;
  elements.scenarioCount.textContent = scenarios.length;
  elements.scenarioList.textContent = scenarios.join(" · ");
  elements.passedNote.textContent = `${report.passed} of ${evaluated} evaluated checks`;
  elements.generatedTime.textContent = generated.time;
  elements.generatedDate.textContent = generated.date;
  elements.coverageFill.style.width = `${percentage}%`;
  elements.coverageTrack.setAttribute("aria-valuenow", String(percentage));
  elements.coveragePercent.textContent = `${percentage}%`;
  elements.allFilterCount.textContent = total;
  elements.passedFilterCount.textContent = report.passed;
  elements.failedFilterCount.textContent = report.failed;
  elements.skippedFilterCount.textContent = skipped;
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

function getConfiguredAspectScenarios(aspect) {
  return sortScenarios(
    designGoalOrder.flatMap((goal) => scenarioMatrix[aspect]?.[goal] || [])
  );
}

function getConfiguredGoalScenarios(goal) {
  return sortScenarios(
    technicalAspectOrder.flatMap((aspect) => scenarioMatrix[aspect]?.[goal] || [])
  );
}

function buildMatrixCounts(results) {
  const matrix = createEmptyMatrix();

  for (const result of results) {
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

function buildMatrixAggregates(results) {
  const aspects = Object.fromEntries(
    technicalAspectOrder.map((aspect) => [aspect, createMatrixCell()])
  );
  const goals = Object.fromEntries(
    designGoalOrder.map((goal) => [goal, createMatrixCell()])
  );
  const aspectScenarioSets = Object.fromEntries(
    technicalAspectOrder.map((aspect) => [
      aspect,
      new Set(getConfiguredAspectScenarios(aspect)),
    ])
  );
  const goalScenarioSets = Object.fromEntries(
    designGoalOrder.map((goal) => [goal, new Set(getConfiguredGoalScenarios(goal))])
  );

  for (const result of results) {
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

function renderMatrixCell(cell, aspect, goal) {
  const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
  if (configuredScenarios.length === 0) {
    return `<td class="matrix-cell is-empty" title="No scenarios defined for ${escapeHtml(goal)} x ${escapeHtml(aspect)}">—</td>`;
  }

  const scenarioLabel = configuredScenarios.join(", ");
  const title = [
    `${designGoalLabels[goal] || goal} x ${aspect}`,
    `Scenarios: ${scenarioLabel}`,
    `Passed: ${cell.passed}`,
    `Failed: ${cell.failed}`,
    `Skipped: ${cell.skipped}`,
    `Total: ${cell.total}`,
  ].join(" · ");

  return `
    <td class="matrix-cell ${matrixCellClass(cell)}" title="${escapeHtml(title)}">
      <span class="matrix-counts">
        <strong>${cell.passed}</strong>
        <span>${cell.failed}</span>
        <span>${cell.total}</span>
      </span>
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
    `Total: ${cell.total}`,
  ].join(" · ");

  return `
    <td class="matrix-cell matrix-aggregate-cell ${extraClass} ${matrixCellClass(cell)}" title="${escapeHtml(title)}">
      <span class="matrix-counts">
        <strong>${cell.passed}</strong>
        <span>${cell.failed}</span>
        <span>${cell.total}</span>
      </span>
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
            getConfiguredGoalScenarios(goal),
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
  const aggregates = buildMatrixAggregates(report.results || []);
  const rows = technicalAspectOrder
    .map((aspect) => `
      <tr>
        <th scope="row">${escapeHtml(aspect)}</th>
        ${designGoalOrder.map((goal) => renderMatrixCell(matrix[aspect][goal], aspect, goal)).join("")}
        ${
          state.showMatrixAggregates
            ? renderAggregateCountCell(aggregates.aspects[aspect], `${aspect} total`, "matrix-aggregate-start") +
              renderAggregateScenarioCell(getConfiguredAspectScenarios(aspect), `${aspect} scenarios`)
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

function renderLatexMatrixCell(cell, aspect, goal) {
  const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
  if (configuredScenarios.length === 0) {
    return "--";
  }

  return `${cell.passed}/${cell.failed}/${cell.total}`;
}

function generateMatrixLatex(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || []);
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
      renderLatexMatrixCell(matrix[aspect][goal], aspect, goal)
    );
    if (includeAggregates) {
      cells.push(
        `${aggregates.aspects[aspect].passed}/${aggregates.aspects[aspect].failed}/${aggregates.aspects[aspect].total}`,
        escapeLatex(formatScenarioList(getConfiguredAspectScenarios(aspect)))
      );
    }
    return `${escapeLatex(aspect)} & ${cells.join(" & ")} \\\\`;
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map(
            (goal) =>
              `${aggregates.goals[goal].passed}/${aggregates.goals[goal].failed}/${aggregates.goals[goal].total}`
          ),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal))),
          "--",
          "--",
        ],
      ].map((row) => row.map(escapeLatex).join(" & ") + " \\\\")
    : [];

  return [
    "\\begin{table}[htbp]",
    "\\centering",
    "\\caption{Scenario assurance matrix. Cell format: passing/failing/total.}",
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

function renderMarkdownMatrixCell(cell, aspect, goal) {
  const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
  if (configuredScenarios.length === 0) {
    return "--";
  }

  return `${cell.passed}/${cell.failed}/${cell.total}`;
}

function generateMatrixMarkdown(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || []);
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
      renderMarkdownMatrixCell(matrix[aspect][goal], aspect, goal)
    );
    if (includeAggregates) {
      cells.push(
        `${aggregates.aspects[aspect].passed}/${aggregates.aspects[aspect].failed}/${aggregates.aspects[aspect].total}`,
        formatScenarioList(getConfiguredAspectScenarios(aspect))
      );
    }
    return `| ${[aspect, ...cells].map(escapeMarkdownTableCell).join(" | ")} |`;
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map(
            (goal) =>
              `${aggregates.goals[goal].passed}/${aggregates.goals[goal].failed}/${aggregates.goals[goal].total}`
          ),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal))),
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
    "Cell format: passing/failing/total. Total includes skipped checks.",
  ].join("\n");
}

function renderHtmlMatrixCell(cell, aspect, goal) {
  const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
  const cellStyle = "border: 1px solid #d0d7de; padding: 6px 8px; text-align: center;";
  if (configuredScenarios.length === 0) {
    return `<td style="${cellStyle}">--</td>`;
  }

  return `<td style="${cellStyle}">${cell.passed}/${cell.failed}/${cell.total}</td>`;
}

function renderHtmlValueCell(value, textAlign = "center", extraStyle = "") {
  return `<td style="border: 1px solid #d0d7de; padding: 6px 8px; text-align: ${textAlign}; ${extraStyle}">${escapeHtml(value)}</td>`;
}

function generateMatrixHtml(report) {
  const matrix = buildMatrixCounts(report.results || []);
  const aggregates = buildMatrixAggregates(report.results || []);
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
        .map((goal) => renderHtmlMatrixCell(matrix[aspect][goal], aspect, goal))
        .join("");
      const aggregateCells = includeAggregates
        ? [
            renderHtmlValueCell(
              `${aggregates.aspects[aspect].passed}/${aggregates.aspects[aspect].failed}/${aggregates.aspects[aspect].total}`,
              "center",
              aggregateStartStyle
            ),
            renderHtmlValueCell(formatScenarioList(getConfiguredAspectScenarios(aspect)), "left"),
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
              `${aggregates.goals[goal].passed}/${aggregates.goals[goal].failed}/${aggregates.goals[goal].total}`,
              "center",
              aggregateRowStyle
            )
          )
          .join("")}${renderHtmlValueCell("--", "center", aggregateRowStyle + aggregateStartStyle)}${renderHtmlValueCell("--", "center", aggregateRowStyle)}\n  </tr>`,
        `  <tr>\n    <th scope="row" style="${rowHeadingStyle} ${aggregateRowStyle}">Design goal scenarios</th>\n    ${designGoalOrder
          .map((goal) =>
            renderHtmlValueCell(
              formatScenarioList(getConfiguredGoalScenarios(goal)),
              "left",
              aggregateRowStyle
            )
          )
          .join("")}${renderHtmlValueCell("--", "center", aggregateRowStyle + aggregateStartStyle)}${renderHtmlValueCell("--", "center", aggregateRowStyle)}\n  </tr>`,
      ].join("\n")
    : "";

  return [
    '<table aria-label="Scenario assurance matrix" style="border-collapse: collapse;">',
    '  <caption style="caption-side: top; font-weight: 700; margin-bottom: 6px;">Scenario assurance matrix. Cell format: passing/failing/total. Total includes skipped checks.</caption>',
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
  const aggregates = buildMatrixAggregates(report.results || []);
  const includeAggregates = state.showMatrixAggregates;
  const header = [
    "Technical aspect",
    ...designGoalOrder,
    ...(includeAggregates ? ["Aspect total", "Aspect scenarios"] : []),
  ].join("\t");
  const rows = technicalAspectOrder.map((aspect) => {
    const cells = designGoalOrder.map((goal) => {
      const configuredScenarios = scenarioMatrix[aspect]?.[goal] || [];
      return configuredScenarios.length === 0
        ? "--"
        : `${matrix[aspect][goal].passed}/${matrix[aspect][goal].failed}/${matrix[aspect][goal].total}`;
    });
    if (includeAggregates) {
      cells.push(
        `${aggregates.aspects[aspect].passed}/${aggregates.aspects[aspect].failed}/${aggregates.aspects[aspect].total}`,
        formatScenarioList(getConfiguredAspectScenarios(aspect))
      );
    }
    return [aspect, ...cells].join("\t");
  });
  const aggregateRows = includeAggregates
    ? [
        [
          "Design goal totals",
          ...designGoalOrder.map(
            (goal) =>
              `${aggregates.goals[goal].passed}/${aggregates.goals[goal].failed}/${aggregates.goals[goal].total}`
          ),
          "--",
          "--",
        ],
        [
          "Design goal scenarios",
          ...designGoalOrder.map((goal) => formatScenarioList(getConfiguredGoalScenarios(goal))),
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
    "Cell format: passing/failing/total. Total includes skipped checks.",
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

function scenarioSearchTerms(result) {
  return getResultScenarios(result).flatMap((scenario) => {
    const metadata = getScenarioMetadata(scenario);
    const placements = getScenarioMatrixPlacements(scenario);
    return [
      scenario,
      metadata.aspect,
      metadata.title,
      ...metadata.goals,
      ...metadata.goals.map((goal) => designGoalLabels[goal]),
      ...placements.map((placement) => placement.aspect),
      ...placements.map((placement) => placement.goal),
      ...placements.map((placement) => designGoalLabels[placement.goal]),
    ].filter(Boolean);
  });
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
  ].filter(Boolean).join(" · ");

  return `
    <span class="scenario-tag" title="${escapeHtml(title)}">
      <span class="scenario-code">${escapeHtml(scenario)}</span>
      <span class="scenario-goal">${escapeHtml(goalCode)}</span>
      <span class="scenario-aspect">${escapeHtml(metadata.aspect)}</span>
    </span>
  `;
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
      const isSkipped = result.skipped === true;
      const isPassed = result.passed && !isSkipped;
      const cardClass = isSkipped ? "is-skipped" : isPassed ? "is-passed" : "is-failed";
      const statusLabel = isSkipped ? "Skipped" : isPassed ? "Passed" : "Failed";
      const statusIcon = isSkipped ? "–" : isPassed ? "✓" : "!";
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
              <span class="status-label">${statusLabel}</span>
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
    renderAssuranceMatrix(payload);
    renderResults();
  } catch (error) {
    state.report = null;
    elements.resultList.hidden = true;
    elements.emptyState.hidden = true;
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

if (elements.copyMatrixButton) {
  elements.copyMatrixButton.addEventListener("click", copyMatrixAsLatex);
}

if (elements.copyMarkdownMatrixButton) {
  elements.copyMarkdownMatrixButton.addEventListener("click", copyMatrixAsMarkdown);
}

if (elements.copyHtmlMatrixButton) {
  elements.copyHtmlMatrixButton.addEventListener("click", copyMatrixAsHtml);
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
