import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cssBaseUrl, verifierBaseUrl } from "../config/runtime.js";
import { createContext } from "./scenario-context.js";
import type {
  CachedScenarioOutput,
  CacheOutputOptions,
  CheckOutputCache,
  CheckResult,
  ScenarioCacheWrite,
  ScenarioCheck,
  SkipCategory,
} from "./scenario-types.js";

import { checks as checksA } from "./scenarios/a-data-holder-verifiability.js";
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

const catalogueVersion = "202606300117";
const definedScenarios = "ABCDEFGHIJKLMNOPQRSTUV".split("");
const analysisScenarios = [
  "A", "B", "C", "D", "E", "F", "G", "I",
  "J", "K", "M", "N", "O", "P", "Q", "R",
  "S", "T", "U", "V",
];
const excludedScenarios = definedScenarios.filter((scenario) => !analysisScenarios.includes(scenario));
const repoRoot = process.cwd();
const evidenceDir = path.resolve(
  process.env.SCENARIO_EVIDENCE_DIR || "local-run/readme-smoke/scenarios"
);
const reportFileName = "scenario-test-report.json";
const legacyReportFileName = "initial-scenarios-report.json";
const runStartedAt = new Date();
const runId = runStartedAt.toISOString().replace(/[:.]/g, "-");
const outputCacheRoot = path.resolve(
  process.env.SCENARIO_OUTPUT_CACHE_DIR || path.join(evidenceDir, "output-cache", runId)
);
const skipCategories: SkipCategory[] = [
  "feature-absent",
  "pending-implementation",
  "under-specified",
  "excluded-from-analysis",
];

/** Parses the environment flag that controls whether scenario failures fail the process. */
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

/** Returns whether a scenario should execute and contribute to analysis metrics. */
function includeScenarioInAnalysis(scenario: string): boolean {
  return analysisScenarios.includes(scenario);
}

/** Converts absolute paths into portable report paths relative to the repository root. */
function relativeToRepo(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

/** Prevents cache writes from escaping a check's output directory. */
function assertSafeRelativePath(name: string): void {
  const normalized = path.normalize(name);
  assert.ok(name.length > 0, "Cached output name must not be empty");
  assert.notEqual(normalized, ".", "Cached output name must refer to a file");
  assert.ok(!path.isAbsolute(name), `Cached output name must be relative: ${name}`);
  assert.ok(
    normalized !== ".." && !normalized.startsWith(`..${path.sep}`),
    `Cached output name must not escape output cache: ${name}`
  );
}

/** Serializes arbitrary scenario output into a cacheable file payload. */
function serializeCachedValue(
  value: unknown,
  options: CacheOutputOptions | undefined
): { content: string | Uint8Array; contentType: string; bytes: number } {
  if (typeof value === "string") {
    const contentType = options?.contentType || "text/plain; charset=utf-8";
    return { content: value, contentType, bytes: Buffer.byteLength(value) };
  }

  if (value instanceof Uint8Array) {
    const contentType = options?.contentType || "application/octet-stream";
    return { content: value, contentType, bytes: value.byteLength };
  }

  const content = `${JSON.stringify(value, null, 2)}\n`;
  const contentType = options?.contentType || "application/json; charset=utf-8";
  return { content, contentType, bytes: Buffer.byteLength(content) };
}

/** Creates a cache writer scoped to one scenario check. */
function createCacheOutputWriter(
  checkOutputDir: string,
  cachedOutputs: CachedScenarioOutput[]
): (name: string, value: unknown, options?: CacheOutputOptions) => Promise<ScenarioCacheWrite> {
  return async (name: string, value: unknown, options?: CacheOutputOptions) => {
    assertSafeRelativePath(name);
    const outputPath = path.join(checkOutputDir, path.normalize(name));
    const serialized = serializeCachedValue(value, options);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, serialized.content);

    const output: CachedScenarioOutput = {
      label: options?.label || name,
      path: relativeToRepo(outputPath),
      contentType: serialized.contentType,
      bytes: serialized.bytes,
    };
    cachedOutputs.push(output);
    return { ...output, absolutePath: outputPath };
  };
}

/** Writes the per-check cached result files and returns report metadata for them. */
async function writeCheckOutputCache(
  checkOutputDir: string,
  result: Omit<CheckResult, "outputCache">,
  artifacts: CachedScenarioOutput[]
): Promise<CheckOutputCache> {
  await mkdir(checkOutputDir, { recursive: true });

  const detailPath = path.join(checkOutputDir, "detail.txt");
  const resultPath = path.join(checkOutputDir, "result.json");
  const outputCache: CheckOutputCache = {
    directory: relativeToRepo(checkOutputDir),
    result: relativeToRepo(resultPath),
    detail: relativeToRepo(detailPath),
    artifacts,
  };
  const cachedResult: CheckResult = { ...result, outputCache };

  await writeFile(detailPath, `${result.detail}\n`, "utf8");
  await writeFile(resultPath, `${JSON.stringify(cachedResult, null, 2)}\n`, "utf8");

  return outputCache;
}

/** Executes one scenario check and converts its outcome to report evidence. */
async function runCheck(check: ScenarioCheck): Promise<CheckResult> {
  assert.match(check.scenario, /^[A-Z]$/, `Invalid scenario identifier: ${check.scenario}`);
  assert.ok(
    check.id.startsWith(`${check.scenario}-`),
    `Check ${check.id} must belong to exactly scenario ${check.scenario}`
  );
  assert.ok(
    definedScenarios.includes(check.scenario),
    `Check ${check.id} belongs to scenario ${check.scenario}, which is not in catalogue version ${catalogueVersion}`
  );

  const startedAt = new Date();
  const checkOutputDir = path.join(outputCacheRoot, check.id.toLowerCase());
  const artifacts: CachedScenarioOutput[] = [];
  const includeInAnalysis = includeScenarioInAnalysis(check.scenario);

  let resultWithoutCache: Omit<CheckResult, "outputCache">;

  if (!includeInAnalysis) {
    console.log(`EXCLUDE ${check.id}: ${check.description}`);
    const completedAt = new Date();
    const skipReason = "Excluded from coverage analysis by the scenario catalogue Include in Analysis flag.";
    resultWithoutCache = {
      id: check.id,
      scenario: check.scenario,
      description: check.description,
      passed: false,
      skipped: true,
      includeInAnalysis,
      skipCategory: "excluded-from-analysis",
      skipReason,
      detail: skipReason,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
    };
    const outputCache = await writeCheckOutputCache(checkOutputDir, resultWithoutCache, artifacts);
    return { ...resultWithoutCache, outputCache };
  }

  if (check.skip) {
    console.log(`SKIP ${check.id}: ${check.description}`);
    const completedAt = new Date();
    resultWithoutCache = {
      id: check.id,
      scenario: check.scenario,
      description: check.description,
      passed: false,
      skipped: true,
      includeInAnalysis,
      skipCategory: check.skipCategory,
      skipReason: check.skipReason,
      detail: check.skipReason,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
    };
    const outputCache = await writeCheckOutputCache(checkOutputDir, resultWithoutCache, artifacts);
    return { ...resultWithoutCache, outputCache };
  }

  const cacheOutput = createCacheOutputWriter(checkOutputDir, artifacts);
  const context = createContext(evidenceDir, checkOutputDir, repoRoot, cacheOutput);

  try {
    const detail = await check.run(context);
    console.log(`PASS ${check.id}: ${check.description}`);
    const completedAt = new Date();
    resultWithoutCache = {
      id: check.id,
      scenario: check.scenario,
      description: check.description,
      passed: true,
      skipped: false,
      includeInAnalysis,
      detail,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${check.id}: ${check.description}: ${detail}`);
    const completedAt = new Date();
    resultWithoutCache = {
      id: check.id,
      scenario: check.scenario,
      description: check.description,
      passed: false,
      skipped: false,
      includeInAnalysis,
      detail,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
    };
  }

  const outputCache = await writeCheckOutputCache(checkOutputDir, resultWithoutCache, artifacts);
  return { ...resultWithoutCache, outputCache };
}

/** Runs all scenario checks and writes the current scenario evidence report. */
async function main(): Promise<void> {
  await mkdir(evidenceDir, { recursive: true });
  await mkdir(outputCacheRoot, { recursive: true });
  const results: CheckResult[] = [];

  for (const check of allChecks) {
    results.push(await runCheck(check));
  }

  const coveredScenarios = [...new Set(results.map((result) => result.scenario))].sort();
  assert.deepEqual(
    coveredScenarios,
    definedScenarios,
    "The scenario report does not cover every catalogue scenario"
  );
  const analysisResults = results.filter((result) => result.includeInAnalysis);
  const excludedResults = results.filter((result) => !result.includeInAnalysis);
  const analysisCoveredScenarios = [...new Set(analysisResults.map((result) => result.scenario))].sort();
  assert.deepEqual(
    analysisCoveredScenarios,
    analysisScenarios,
    "The scenario report does not cover every scenario included in analysis"
  );

  const report = {
    catalogueVersion,
    generatedAt: runStartedAt.toISOString(),
    runId,
    cssBaseUrl,
    verifierBaseUrl,
    strictMode,
    outputCacheRoot: relativeToRepo(outputCacheRoot),
    definedScenarios,
    analysisScenarios,
    excludedScenarios,
    coveredScenarios,
    analysisCoveredScenarios,
    passed: analysisResults.filter((result) => result.passed && !result.skipped).length,
    failed: analysisResults.filter((result) => !result.passed && !result.skipped).length,
    skipped: analysisResults.filter((result) => result.skipped).length,
    excluded: excludedResults.length,
    skippedByCategory: Object.fromEntries(
      skipCategories.map((category) => [
        category,
        analysisResults.filter((result) => result.skipped && result.skipCategory === category).length,
      ])
    ),
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
