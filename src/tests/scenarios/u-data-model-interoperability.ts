import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ScenarioCheck } from "../scenario-types.js";

type JsonObject = Record<string, any>;

type FixtureExpectation = {
  label: string;
  relativePath: string;
  requiresEpcisEventModel?: boolean;
};

const representativeResources: FixtureExpectation[] = [
  {
    label: "Farmer product-origin data",
    relativePath: "dev/fixtures/product-shipment/resources/farmer/products/product-x.jsonld",
  },
  {
    label: "Farmer shipment data",
    relativePath: "dev/fixtures/product-shipment/resources/farmer/shipments/out/shipment1.jsonld",
  },
  {
    label: "Packager packaging data",
    relativePath: "dev/fixtures/product-shipment/resources/packager/products/packaged-batch-001.jsonld",
    requiresEpcisEventModel: true,
  },
  {
    label: "Packager receipt data",
    relativePath: "dev/fixtures/product-shipment/resources/packager/shipments/in/receipt-shipment1.jsonld",
    requiresEpcisEventModel: true,
  },
  {
    label: "Transporter pickup event",
    relativePath: "dev/fixtures/product-shipment/resources/transporter/transport-events/pickup-shipment1.jsonld",
    requiresEpcisEventModel: true,
  },
  {
    label: "Transporter delivery event",
    relativePath: "dev/fixtures/product-shipment/resources/transporter/transport-events/delivery-shipment1.jsonld",
    requiresEpcisEventModel: true,
  },
  {
    label: "Retailer receipt data",
    relativePath: "dev/fixtures/product-shipment/resources/retailer/shipments/in/receipt-shipment3.jsonld",
    requiresEpcisEventModel: true,
  },
];

/** Wraps a scalar or missing JSON-LD value as an array for uniform checks. */
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value].filter((item) => item !== undefined);
}

/** Extracts object-valued JSON-LD context entries from a fixture document. */
function contextObjects(document: JsonObject): JsonObject[] {
  return asArray(document["@context"]).filter(
    (item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}

/** Collects all context aliases declared by a fixture document. */
function contextAliases(document: JsonObject): Set<string> {
  return new Set(contextObjects(document).flatMap((context) => Object.keys(context)));
}

/** Returns whether a fixture document has the given JSON-LD type. */
function hasType(document: JsonObject, type: string): boolean {
  return asArray(document["@type"]).includes(type);
}

/** Extracts an identifier from a string value or JSON-LD node reference. */
function linkedIdentifier(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof (value as JsonObject)["@id"] === "string") {
    return (value as JsonObject)["@id"];
  }
  return undefined;
}

/** Loads a JSON-LD fixture relative to the repository root. */
async function loadFixture(repoRoot: string, relativePath: string): Promise<JsonObject> {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8")) as JsonObject;
}

/** Returns semantic-shape validation gaps for one interoperability fixture. */
function assertResolvableSemanticShape(label: string, document: JsonObject): string[] {
  const aliases = contextAliases(document);
  const missing: string[] = [];

  if (typeof document["@id"] !== "string" || !document["@id"].startsWith("did:secuweb:")) {
    missing.push(`${label}: missing stable did:secuweb @id`);
  }

  if (!linkedIdentifier(document["schema:url"])) {
    missing.push(`${label}: missing schema:url resource identifier`);
  }

  if (!aliases.has("schema")) {
    missing.push(`${label}: missing schema.org context alias`);
  }

  if (![...aliases].some((alias) => alias !== "ex")) {
    missing.push(`${label}: only actor-local ex vocabulary is declared`);
  }

  return missing;
}

/** Returns EPCIS event-model validation gaps for one fixture document. */
function assertEpcisEventModel(label: string, document: JsonObject): string[] {
  const aliases = contextAliases(document);
  const missing: string[] = [];

  if (!aliases.has("epcis")) {
    missing.push(`${label}: missing EPCIS/GS1 vocabulary alias`);
  }

  if (!hasType(document, "epcis:ObjectEvent")) {
    missing.push(`${label}: missing epcis:ObjectEvent type`);
  }

  if (typeof document["epcis:bizStep"] !== "string") {
    missing.push(`${label}: missing epcis:bizStep`);
  }

  if (typeof document["epcis:disposition"] !== "string") {
    missing.push(`${label}: missing epcis:disposition`);
  }

  return missing;
}

export const checks: ScenarioCheck[] = [
  {
    id: "U-1",
    scenario: "U",
    description: "Cross-actor product-shipment fixtures expose stable identifiers and shared semantic vocabularies",
    run: async (context) => {
      const documents = await Promise.all(
        representativeResources.map(async (resource) => ({
          ...resource,
          document: await loadFixture(context.repoRoot, resource.relativePath),
        }))
      );
      const missing = documents.flatMap(({ label, document }) =>
        assertResolvableSemanticShape(label, document)
      );

      assert.deepEqual(
        missing,
        [],
        `Scenario U requires Web-resolvable identifiers and shared vocabulary aliases:\n${missing.join("\n")}`
      );

      const aliases = [...new Set(documents.flatMap(({ document }) => [...contextAliases(document)]))].sort();
      return `${documents.length} resources expose stable identifiers with shared aliases: ${aliases.join(", ")}`;
    },
  },
  {
    id: "U-2",
    scenario: "U",
    description: "Representative supply-chain event data is aligned with EPCIS/GS1 event semantics",
    skip: true,
    skipCategory: "under-specified",
    skipReason: "The representative EPCIS/GS1 alignment level still needs to be specified before this can be a stable executable check.",
    // run: async (context) => {
    //   const documents = await Promise.all(
    //     representativeResources
    //       .filter((resource) => resource.requiresEpcisEventModel)
    //       .map(async (resource) => ({
    //         ...resource,
    //         document: await loadFixture(context.repoRoot, resource.relativePath),
    //       }))
    //   );
    //   const missing = documents.flatMap(({ label, document }) =>
    //     assertEpcisEventModel(label, document)
    //   );

    //   assert.deepEqual(
    //     missing,
    //     [],
    //     `Scenario U requires representative EPCIS/GS1 event-model alignment:\n${missing.join("\n")}`
    //   );

    //   return `${documents.length} representative resources include epcis:ObjectEvent, epcis:bizStep, and epcis:disposition`;
    // },
  },
];
