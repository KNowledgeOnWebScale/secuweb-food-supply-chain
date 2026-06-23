import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "S-1",
    scenario: "S",
    description: "A uniform domain-data API pattern retrieves resources from different actors",
    run: async (context) => {
      const packagerFetch = await context.getActorFetch("packager");
      const sources = [
        resourceUrl("farmer", "shipments/out/vc/shipment1.jsonld"),
        resourceUrl("transporter", "transport-events/vc/pickup-shipment1.jsonld"),
        resourceUrl("packager", "products/vc/packaged-batch-001.jsonld"),
      ];
      const contentTypes = new Set<string>();
      const issuers = new Set<string>();
      for (const source of sources) {
        const fetched = await context.fetchCredential(packagerFetch, source);
        contentTypes.add((fetched.response.headers.get("content-type") || "").split(";")[0]);
        issuers.add(fetched.credential.issuer);
      }
      assert.equal(
        contentTypes.size,
        1,
        `Actor resources returned inconsistent media types: ${[...contentTypes].join(", ")}`
      );
      assert.equal(
        issuers.size,
        3,
        `Expected three actor issuers, received ${[...issuers].join(", ")}`
      );
      return `The same GET pattern returned ${[...contentTypes][0]} domain data for ${issuers.size} actor issuers`;
    },
  },
];
