import assert from "node:assert/strict";

import {
  assertFixtureQueryMatchesExpected,
  overlayResourceUrls,
} from "../fixture-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "P-1",
    scenario: "P",
    description: "The Retailer queries batch provenance across four decentralized actor Pods",
    run: async (context) => {
      const retailerFetch = await context.getActorFetch("retailer");
      const sources = await overlayResourceUrls("shared");
      const result = await assertFixtureQueryMatchesExpected({
        scenario: "P",
        queryName: "batch-provenance",
        sources,
        fetch: retailerFetch,
      });

      assert.equal(result.rows.length, 1, "Scenario P should return one batch provenance row");
      const [row] = result.rows;
      assert.equal(row.batch, "did:secuweb:packager:batch-001");
      assert.equal(row.upstreamShipment, "did:secuweb:farmer:shipment-fp-001");
      assert.equal(row.outboundShipment, "did:secuweb:packager:shipment-pr-001");
      assert.ok(
        row.upstreamShipmentStatus === "shipped" && row.outboundShipmentStatus === "shipped",
        "The query returned a shipment with an unexpected status"
      );
      return `Fixture query ${result.queryPath} matched ${result.expectedPath} across ${sources.length} sources`;
    },
  },
];
