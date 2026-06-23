import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { webId } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

/** Wraps a scalar or missing JSON-LD value as an array for uniform checks. */
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value].filter((item) => item !== undefined);
}

/** Extracts an identifier from a string value or JSON-LD node reference. */
function linkedIdentifier(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>)["@id"] === "string") {
    return (value as Record<string, string>)["@id"];
  }
  return undefined;
}

export const checks: ScenarioCheck[] = [
  {
    id: "V-1",
    scenario: "V",
    description: "The governance model accredits the Farmer to issue product-origin data",
    run: async (context) => {
      const expectedIssuer = webId("farmer");
      const accreditationPath = path.join(
        context.repoRoot,
        "dev/fixtures/product-shipment/overlays/scenario-v/consortium/governance/accreditations/farmer-product-origin.jsonld"
      );
      let body: string;

      try {
        body = await readFile(accreditationPath, "utf8");
      } catch {
        assert.fail(
          `Missing issuer-accreditation governance evidence at ${path.relative(context.repoRoot, accreditationPath)}; expected a governance model proving ${expectedIssuer} may issue product-origin data`
        );
      }

      const accreditation = context.asObject(JSON.parse(body), "issuer-accreditation governance evidence");
      assert.ok(
        asArray(accreditation["@type"]).includes("ex:IssuerAccreditation"),
        "Governance evidence is not typed as ex:IssuerAccreditation"
      );
      assert.equal(
        linkedIdentifier(accreditation["ex:accreditedIssuer"]),
        expectedIssuer,
        `Governance evidence does not accredit credential issuer ${expectedIssuer}`
      );
      assert.equal(
        linkedIdentifier(accreditation["ex:authorizedClaimType"]),
        "http://example.org/terms#ProductOriginData",
        "Governance evidence does not authorize product-origin data"
      );
      assert.equal(
        accreditation["ex:governanceStatus"],
        "active",
        "Issuer accreditation is not active"
      );

      return `${expectedIssuer} is actively accredited to issue product-origin data by ${path.relative(context.repoRoot, accreditationPath)}`;
    },
  },
];
