import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { resourceUrl } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

const farmerProductUrl = resourceUrl("farmer", "products/vc/product-x.jsonld");
const farmerProductSourcePath = path.join(
  "dev",
  "fixtures",
  "product-shipment",
  "resources",
  "farmer",
  "products",
  "product-x.jsonld"
);

/** Returns whether a JSON object explicitly defines a property. */
function hasOwnProperty(object: Record<string, any>, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

/** Loads the full Farmer product source fixture used as minimization evidence. */
async function loadSourceProduct(repoRoot: string): Promise<Record<string, any>> {
  const fixture = await readFile(path.join(repoRoot, farmerProductSourcePath), "utf8");
  return JSON.parse(fixture) as Record<string, any>;
}

export const checks: ScenarioCheck[] = [
  {
    id: "N-1",
    scenario: "N",
    description: "The confidential Farmer resource is unavailable to anonymous and unrelated actors",
    run: async (context) => {
      const retailerFetch = await context.getActorFetch("retailer");
      const attempts = [
        ["anonymous", fetch],
        ["retailer", retailerFetch],
      ] as const;
      const statuses: string[] = [];
      for (const [actor, request] of attempts) {
        const response = await request(farmerProductUrl);
        assert.ok(
          context.isDeniedStatus(response.status),
          `${actor} unexpectedly received HTTP ${response.status}`
        );
        statuses.push(`${actor}=${response.status}`);
      }
      return statuses.join(", ");
    },
  },
  {
    id: "N-2",
    scenario: "N",
    description: "The Farmer credential states the permitted processing purpose",
    skip: true,
    skipCategory: "pending-implementation",
    skipReason: "The termsOfUse or equivalent purpose statement is implementable but has not yet been added to the shared credential.",
  },
  {
    id: "N-3",
    scenario: "N",
    description: "The Packager receives a product view that removes source-only farm-lot fields",
    run: async (context) => {
      const sourceProduct = await loadSourceProduct(context.repoRoot);
      assert.ok(
        hasOwnProperty(sourceProduct, "schema:weight"),
        "Source product fixture lacks schema:weight; cannot evaluate the retained field"
      );
      assert.ok(
        hasOwnProperty(sourceProduct, "schema:location"),
        "Source product fixture lacks schema:location; cannot prove the Packager view removed location"
      );
      assert.ok(
        hasOwnProperty(sourceProduct, "ex:farmLot"),
        "Source product fixture lacks ex:farmLot; cannot prove the Packager view removed farm lot"
      );

      const { credential } = await context.getOriginalCredential();
      const subject = context.asObject(credential.credentialSubject, "Product credentialSubject");
      assert.ok(subject["schema:weight"], "Minimized view omits required product weight");
      assert.deepEqual(
        subject["schema:weight"],
        sourceProduct["schema:weight"],
        "Minimized view weight differs from source product weight"
      );
      assert.equal(
        hasOwnProperty(subject, "schema:location"),
        false,
        "Minimized view exposes schema:location"
      );
      assert.equal(hasOwnProperty(subject, "ex:farmLot"), false, "Minimized view exposes ex:farmLot");
      return "Source contains weight/location/farmLot; Packager view retains weight and removes location/farmLot";
    },
  },
];
