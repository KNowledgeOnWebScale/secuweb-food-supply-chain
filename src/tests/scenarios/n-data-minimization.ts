import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

const farmerProductUrl = resourceUrl("farmer", "products/vc/product-x.jsonld");

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
  },
  {
    id: "N-3",
    scenario: "N",
    description: "The Packager receives a minimized product view without farm-lot location",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const subject = context.asObject(credential.credentialSubject, "Product credentialSubject");
      assert.ok(subject["schema:weight"], "Minimized view omits required product weight");
      assert.equal(subject["schema:location"], undefined, "Minimized view exposes schema:location");
      assert.equal(subject["ex:farmLot"], undefined, "Minimized view exposes the originating farm lot");
      return "Product view contains weight but no farm-lot location";
    },
  },
];
