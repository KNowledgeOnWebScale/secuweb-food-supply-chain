import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { QueryEngine } from "@comunica/query-sparql";
import type { Quad, Term } from "@rdfjs/types";
import jsonld from "jsonld";

const FIXTURE_BASE_URL = "http://localhost:3000";

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

type RdfSource = {
  match: (
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null
  ) => Readable;
};

async function listFiles(root: string, suffix: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath, suffix);
    return entry.isFile() && entry.name.endsWith(suffix) ? [entryPath] : [];
  }));
  return nested.flat().sort();
}

async function listOverlayRoots(overlaysDir: string): Promise<string[]> {
  const entries = await readdir(overlaysDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(overlaysDir, entry.name))
    .sort();
}

function impliedPodUrl(overlayRoot: string, filePath: string): string {
  const relative = path.relative(overlayRoot, filePath);
  const withoutAcl = relative.endsWith(".acl") ? relative.slice(0, -4) : relative;
  return `${FIXTURE_BASE_URL}/${withoutAcl.split(path.sep).join("/")}`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkAclFiles(
  overlayRoot: string,
  knownWebIds: Set<string>,
  errors: string[]
): Promise<number> {
  const files = await listFiles(overlayRoot, ".acl");
  for (const file of files) {
    const label = path.relative(process.cwd(), file);
    const text = await readFile(file, "utf8");
    const expected = impliedPodUrl(overlayRoot, file);

    for (const [, url] of text.matchAll(/acl:accessTo\s+<([^>]+)>/g)) {
      if (url !== expected) {
        errors.push(`[${label}] acl:accessTo mismatch — expected <${expected}>, found <${url}>`);
      }
    }

    for (const [, agent] of text.matchAll(/acl:agent\s+<([^>]+)>/g)) {
      if (!knownWebIds.has(agent)) {
        errors.push(`[${label}] acl:agent <${agent}> is not a known actor WebID`);
      }
    }
  }
  return files.length;
}

async function checkJsonLdFiles(
  overlayRoot: string,
  errors: string[]
): Promise<number> {
  const files = await listFiles(overlayRoot, ".jsonld");
  for (const file of files) {
    const label = path.relative(process.cwd(), file);
    const raw = await readFile(file, "utf8");
    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      errors.push(`[${label}] invalid JSON`);
      continue;
    }

    const expected = impliedPodUrl(overlayRoot, file);
    const schemaUrl = doc["schema:url"];

    if (schemaUrl !== null && schemaUrl !== undefined &&
        typeof schemaUrl === "object" &&
        typeof (schemaUrl as Record<string, unknown>)["@id"] === "string") {
      const actual = (schemaUrl as Record<string, string>)["@id"];
      if (actual !== expected) {
        errors.push(`[${label}] schema:url mismatch — expected <${expected}>, found <${actual}>`);
      }
    } else {
      const id = doc["@id"];
      if (typeof id === "string" && id.startsWith("http://")) {
        if (id !== expected) {
          errors.push(`[${label}] @id mismatch — expected <${expected}>, found <${id}>`);
        }
      }
      // DID/URN @id with no schema:url: no pod-URL assertion to check
    }
  }
  return files.length;
}

async function checkQueryExpectedPairing(
  overlaysDir: string,
  errors: string[]
): Promise<number> {
  const rqFiles = await listFiles(overlaysDir, ".rq");
  for (const rqFile of rqFiles) {
    const label = path.relative(process.cwd(), rqFile);
    const basename = path.basename(rqFile, ".rq");
    const srjPath = path.join(path.dirname(rqFile), "..", "expected", `${basename}.srj`);
    if (!(await fileExists(srjPath))) {
      errors.push(
        `[${label}] no matching expected result — expected ${path.relative(process.cwd(), srjPath)}`
      );
    }
  }
  return rqFiles.length;
}

function termEquals(left: Term, right?: Term | null): boolean {
  if (!right) {
    return true;
  }
  if (left.termType !== right.termType || left.value !== right.value) {
    return false;
  }
  return true;
}

function withEquals<T extends Term>(term: T, blankNodeScope: string): T {
  const scopedTerm = term.termType === "BlankNode"
    ? { ...term, value: `${blankNodeScope}:${term.value}` }
    : term;
  return {
    ...scopedTerm,
    equals(other?: Term | null) {
      return termEquals(this, other);
    },
  } as T;
}

function normalizeQuad(quad: Quad, blankNodeScope: string): Quad {
  return {
    termType: "Quad",
    value: "",
    subject: withEquals(quad.subject, blankNodeScope),
    predicate: withEquals(quad.predicate, blankNodeScope),
    object: withEquals(quad.object, blankNodeScope),
    graph: withEquals(quad.graph, blankNodeScope),
    equals(other?: Term | null) {
      if (!other || other.termType !== "Quad") {
        return false;
      }
      return termEquals(this.subject, (other as Quad).subject) &&
        termEquals(this.predicate, (other as Quad).predicate) &&
        termEquals(this.object, (other as Quad).object) &&
        termEquals(this.graph, (other as Quad).graph);
    },
  } as Quad;
}

async function loadQuads(files: string[]): Promise<Quad[]> {
  const quads: Quad[] = [];
  for (const [index, file] of files.entries()) {
    const doc = JSON.parse(await readFile(file, "utf8"));
    const parsed = await jsonld.toRDF(doc) as Quad[];
    quads.push(...parsed.map((quad) => normalizeQuad(quad, `file${index}`)));
  }
  return quads;
}

function createRdfSource(quads: Quad[]): RdfSource {
  return {
    match(subject, predicate, object, graph) {
      return Readable.from(quads.filter((quad) => (
        termEquals(quad.subject, subject) &&
        termEquals(quad.predicate, predicate) &&
        termEquals(quad.object, object) &&
        termEquals(quad.graph, graph)
      )));
    },
  };
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
  source: RdfSource
): Promise<Record<string, SparqlJsonBindingTerm>[]> {
  const engine = new QueryEngine();
  const bindingsStream = await engine.queryBindings(query, {
    sources: [{ type: "rdfjsSource", value: source }],
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

function scenarioRootForQuery(overlaysDir: string, rqFile: string): string {
  const relative = path.relative(overlaysDir, rqFile);
  const [scenario] = relative.split(path.sep);
  return path.join(overlaysDir, scenario);
}

async function checkExecutableQueryExpectations(
  overlaysDir: string,
  errors: string[]
): Promise<number> {
  const sharedRoot = path.join(overlaysDir, "shared");
  const rqFiles = await listFiles(overlaysDir, ".rq");

  for (const rqFile of rqFiles) {
    const label = path.relative(process.cwd(), rqFile);
    const basename = path.basename(rqFile, ".rq");
    const expectedPath = path.join(path.dirname(rqFile), "..", "expected", `${basename}.srj`);

    if (!(await fileExists(expectedPath))) {
      continue;
    }

    const scenarioRoot = scenarioRootForQuery(overlaysDir, rqFile);
    const jsonLdFiles = [
      ...await listFiles(sharedRoot, ".jsonld"),
      ...await listFiles(scenarioRoot, ".jsonld"),
    ];

    try {
      const [query, expectedRaw] = await Promise.all([
        readFile(rqFile, "utf8"),
        readFile(expectedPath, "utf8"),
      ]);
      const expected = JSON.parse(expectedRaw) as SparqlJsonResults;
      const actual = await actualBindings(query, createRdfSource(await loadQuads(jsonLdFiles)));

      if (actual.length !== expected.results.bindings.length) {
        errors.push(
          `[${label}] executable expectation mismatch — expected ${expected.results.bindings.length} binding(s), got ${actual.length}`
        );
        continue;
      }

      try {
        assertDeepEqualBindings(actual, expected, expectedPath);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push(`[${label}] executable expectation mismatch against ${path.relative(process.cwd(), expectedPath)}: ${detail}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`[${label}] could not execute fixture query: ${detail}`);
    }
  }

  return rqFiles.length;
}

function assertDeepEqualBindings(
  actual: Record<string, SparqlJsonBindingTerm>[],
  expected: SparqlJsonResults,
  expectedPath: string
): void {
  const actualComparable = actual.map(comparableBinding).sort();
  const expectedComparable = expectedBindings(expected).map(comparableBinding).sort();
  if (JSON.stringify(actualComparable) !== JSON.stringify(expectedComparable)) {
    throw new Error(`actual bindings do not match ${expectedPath}`);
  }
}

async function main(): Promise<void> {
  const fixtureDir = path.resolve(process.cwd(), process.argv[2] || "dev/fixtures/product-shipment");
  const overlaysDir = path.join(fixtureDir, "overlays");
  const actorsPath = path.resolve(process.cwd(), "dev/fixtures/actors.json");

  const actorsRaw = await readFile(actorsPath, "utf8");
  const actors = Object.keys(JSON.parse(actorsRaw) as Record<string, unknown>);
  const knownWebIds = new Set(actors.map((actor) => `${FIXTURE_BASE_URL}/${actor}/profile/card#me`));

  const overlayRoots = await listOverlayRoots(overlaysDir);
  if (overlayRoots.length === 0) {
    console.error(`No overlay directories found under ${overlaysDir}`);
    process.exitCode = 1;
    return;
  }

  const errors: string[] = [];
  let totalAcl = 0;
  let totalJsonLd = 0;

  for (const root of overlayRoots) {
    totalAcl += await checkAclFiles(root, knownWebIds, errors);
    totalJsonLd += await checkJsonLdFiles(root, errors);
  }

  const totalRq = await checkQueryExpectedPairing(overlaysDir, errors);
  const totalExecutableRq = await checkExecutableQueryExpectations(overlaysDir, errors);

  if (errors.length > 0) {
    console.error(`Overlay validation failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Overlays valid: ${totalAcl} ACL file(s), ${totalJsonLd} JSON-LD file(s), ${totalRq} query/expected pair(s), ${totalExecutableRq} executable expectation(s) checked across ${overlayRoots.length} overlay(s).`
  );
}

main().catch((error) => {
  console.error("Unexpected error during overlay validation:", error);
  process.exitCode = 1;
});
