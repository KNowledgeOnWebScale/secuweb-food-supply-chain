import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cssBaseUrl, verifierBaseUrl } from "../config/runtime.js";
import { createContext } from "./scenario-context.js";
import type { CheckResult, ScenarioCheck } from "./scenario-types.js";

import { checks as checksA } from "./scenarios/a-provenance-integrity.js";
import { checks as checksB } from "./scenarios/b-blockchain-anchoring.js";
import { checks as checksC } from "./scenarios/c-audit-trail.js";
import { checks as checksD } from "./scenarios/d-governance-audit.js";
import { checks as checksE } from "./scenarios/e-digital-signature.js";
import { checks as checksF } from "./scenarios/f-compliance-evidence.js";
import { checks as checksG } from "./scenarios/g-acl-integrity.js";
import { checks as checksH } from "./scenarios/h-governance-rule.js";
import { checks as checksI } from "./scenarios/i-did-binding.js";
import { checks as checksJ } from "./scenarios/j-compliance-operation.js";
import { checks as checksK } from "./scenarios/k-access-control.js";
import { checks as checksL } from "./scenarios/l-governance-enforcement.js";
import { checks as checksM } from "./scenarios/m-policy-attribution.js";
import { checks as checksN } from "./scenarios/n-data-minimization.js";
import { checks as checksO } from "./scenarios/o-selective-query.js";
import { checks as checksP } from "./scenarios/p-federated-query.js";
import { checks as checksQ } from "./scenarios/q-governed-discovery.js";
import { checks as checksR } from "./scenarios/r-distributed-discovery.js";
import { checks as checksS } from "./scenarios/s-protocol-interop.js";
import { checks as checksT } from "./scenarios/t-uniform-api.js";
import { checks as checksU } from "./scenarios/u-data-model-interoperability.js";
import { checks as checksV } from "./scenarios/v-issuer-accreditation-verifiability.js";

const catalogueVersion = "202606190419";
const definedScenarios = "ABCDEFGHIJKLMNOPQRSTUV".split("");
const repoRoot = process.cwd();
const evidenceDir = path.resolve(
  process.env.SCENARIO_EVIDENCE_DIR || "local-run/readme-smoke/scenarios"
);
const reportFileName = "scenario-test-report.json";
const legacyReportFileName = "initial-scenarios-report.json";

function parseScenarioStrictMode(value: string | undefined): boolean {
  if (value === undefined || value === "") {
    return true;
  }

  switch (value.toLowerCase()) {
    case "1":
    case "true":
    case "yes":
      return true;
    case "0":
    case "false":
    case "no":
      return false;
    default:
      throw new Error(
        `Invalid SCENARIO_TEST_STRICT value "${value}". Use true/false, 1/0, or yes/no.`
      );
  }
}

const strictMode = parseScenarioStrictMode(process.env.SCENARIO_TEST_STRICT);

const allChecks: ScenarioCheck[] = [
  ...checksA, ...checksB, ...checksC, ...checksD,
  ...checksE, ...checksF, ...checksG, ...checksH,
  ...checksI, ...checksJ, ...checksK, ...checksL,
  ...checksM, ...checksN, ...checksO, ...checksP,
  ...checksQ, ...checksR, ...checksS, ...checksT,
  ...checksU, ...checksV,
];

async function runCheck(
  check: ScenarioCheck,
  context: ReturnType<typeof createContext>
): Promise<CheckResult> {
  assert.match(check.scenario, /^[A-Z]$/, `Invalid scenario identifier: ${check.scenario}`);
  assert.ok(
    check.id.startsWith(`${check.scenario}-`),
    `Check ${check.id} must belong to exactly scenario ${check.scenario}`
  );

  if (check.skip) {
    console.log(`SKIP ${check.id}: ${check.description}`);
    return { id: check.id, scenario: check.scenario, description: check.description, passed: false, skipped: true, detail: "TODO — no scenario or acceptance criteria defined yet" };
  }

  try {
    const detail = await check.run(context);
    console.log(`PASS ${check.id}: ${check.description}`);
    return { id: check.id, scenario: check.scenario, description: check.description, passed: true, skipped: false, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${check.id}: ${check.description}: ${detail}`);
    return { id: check.id, scenario: check.scenario, description: check.description, passed: false, skipped: false, detail };
  }
}

async function main(): Promise<void> {
  await mkdir(evidenceDir, { recursive: true });

  const context = createContext(evidenceDir, repoRoot);
  const results: CheckResult[] = [];

  for (const check of allChecks) {
    results.push(await runCheck(check, context));
  }

  const coveredScenarios = [...new Set(results.map((result) => result.scenario))].sort();
  assert.deepEqual(
    coveredScenarios,
    definedScenarios,
    "The scenario report does not cover every catalogue scenario"
  );

  const report = {
    catalogueVersion,
    generatedAt: new Date().toISOString(),
    cssBaseUrl,
    verifierBaseUrl,
    strictMode,
    definedScenarios,
    coveredScenarios,
    passed: results.filter((result) => result.passed && !result.skipped).length,
    failed: results.filter((result) => !result.passed && !result.skipped).length,
    skipped: results.filter((result) => result.skipped).length,
    results,
  };
  const reportJson = `${JSON.stringify(report, null, 2)}\n`;
  const reportPath = path.join(evidenceDir, reportFileName);
  const legacyReportPath = path.join(evidenceDir, legacyReportFileName);
  await writeFile(reportPath, reportJson, "utf8");
  await writeFile(legacyReportPath, reportJson, "utf8");

  console.log(`Scenario evidence written to ${reportPath}`);
  console.log(`Legacy scenario evidence copy written to ${legacyReportPath}`);
  console.log(`Scenario strict mode: ${strictMode ? "enabled" : "disabled"}`);
  if (report.failed > 0 && strictMode) {
    process.exitCode = 1;
  } else if (report.failed > 0) {
    console.warn(
      `Scenario strict mode disabled: ${report.failed} non-skipped failed check(s) recorded without failing the process.`
    );
  }
}

main().catch((error) => {
  console.error("Scenario test setup failed:", error);
  process.exitCode = 1;
});
