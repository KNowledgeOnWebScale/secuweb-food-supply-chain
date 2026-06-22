import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { QueryEngine } from "@comunica/query-sparql";
import type { Term } from "@rdfjs/types";

import { cssBaseUrl, resourceUrl } from "../config/runtime.js";
import type { AuthenticatedFetch } from "./scenario-types.js";

const fixtureBaseUrl = "http://localhost:3000";
const overlayRoot = path.resolve(process.cwd(), "dev/fixtures/product-shipment/overlays");

type SparqlJsonBindingTerm = {
  type: string;
  value: string;
};

type SparqlJsonResults = {
  head: {
    vars: string[];
  };
  results: {
    bindings: Record<string, SparqlJsonBindingTerm>[];
  };
};

export type FixtureQueryResult = {
  queryPath: string;
  expectedPath: string;
  rows: Record<string, string>[];
};

function replaceFixtureBaseUrl(value: string): string {
  return value.split(fixtureBaseUrl).join(cssBaseUrl);
}

function scenarioOverlayPath(scenario: string): string {
  return path.join(overlayRoot, `scenario-${scenario.toLowerCase()}`);
}

export async function loadScenarioQuery(scenario: string, queryName: string): Promise<{
  query: string;
  queryPath: string;
}> {
  const queryPath = path.join(scenarioOverlayPath(scenario), "query", `${queryName}.rq`);
  return {
    query: replaceFixtureBaseUrl(await readFile(queryPath, "utf8")),
    queryPath,
  };
}

async function loadExpectedResults(scenario: string, queryName: string): Promise<{
  expected: SparqlJsonResults;
  expectedPath: string;
}> {
  const expectedPath = path.join(scenarioOverlayPath(scenario), "expected", `${queryName}.srj`);
  const expected = JSON.parse(replaceFixtureBaseUrl(await readFile(expectedPath, "utf8"))) as SparqlJsonResults;
  return { expected, expectedPath };
}

function termType(term: Term): string {
  switch (term.termType) {
    case "NamedNode":
      return "uri";
    case "BlankNode":
      return "bnode";
    case "Literal":
      return "literal";
    default:
      return term.termType;
  }
}

function comparableBinding(binding: Record<string, SparqlJsonBindingTerm>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(binding)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([variable, term]) => [variable, { type: term.type, value: term.value }])
    )
  );
}

function expectedBindings(expected: SparqlJsonResults): Record<string, SparqlJsonBindingTerm>[] {
  return expected.results.bindings.map((binding) => {
    const normalized: Record<string, SparqlJsonBindingTerm> = {};
    for (const variable of expected.head.vars) {
      const term = binding[variable];
      if (term) {
        normalized[variable] = { type: term.type, value: term.value };
      }
    }
    return normalized;
  });
}

async function actualBindings(
  query: string,
  sources: string[],
  fetchFunction: AuthenticatedFetch
): Promise<Record<string, SparqlJsonBindingTerm>[]> {
  assert.ok(sources.length > 0, "Fixture query requires at least one source");

  const engine = new QueryEngine();
  const bindingsStream = await engine.queryBindings(query, {
    sources: sources as [string, ...string[]],
    fetch: fetchFunction,
    lenient: true,
  });
  const bindings = await bindingsStream.toArray();

  return bindings.map((binding) => {
    const row: Record<string, SparqlJsonBindingTerm> = {};
    for (const [variable, term] of binding) {
      row[variable.value] = {
        type: termType(term),
        value: term.value,
      };
    }
    return row;
  });
}

function valueRows(bindings: Record<string, SparqlJsonBindingTerm>[]): Record<string, string>[] {
  return bindings.map((binding) => (
    Object.fromEntries(
      Object.entries(binding).map(([variable, term]) => [variable, term.value])
    )
  ));
}

export async function assertFixtureQueryMatchesExpected(params: {
  scenario: string;
  queryName: string;
  sources: string[];
  fetch: AuthenticatedFetch;
}): Promise<FixtureQueryResult> {
  const { query, queryPath } = await loadScenarioQuery(params.scenario, params.queryName);
  const { expected, expectedPath } = await loadExpectedResults(params.scenario, params.queryName);
  const actual = await actualBindings(query, params.sources, params.fetch);

  assert.deepEqual(
    actual.map(comparableBinding).sort(),
    expectedBindings(expected).map(comparableBinding).sort(),
    `${params.scenario}/${params.queryName} query result did not match ${expectedPath}`
  );

  return {
    queryPath,
    expectedPath,
    rows: valueRows(actual),
  };
}

async function listJsonLdFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return await listJsonLdFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".jsonld") ? [entryPath] : [];
  }));
  return nested.flat().sort();
}

export async function overlayResourceUrls(overlayName: string): Promise<string[]> {
  const root = path.join(overlayRoot, overlayName);
  const files = await listJsonLdFiles(root);

  return files.map((file) => {
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    const [actor, ...resourceParts] = relativePath.split("/");
    assert.ok(actor && resourceParts.length > 0, `Invalid overlay resource path: ${file}`);
    return resourceUrl(actor, resourceParts.join("/"));
  });
}
