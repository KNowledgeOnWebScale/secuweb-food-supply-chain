import assert from "node:assert/strict";

import { resourceUrl, webId } from "../../config/runtime.js";
import { assertFixtureQueryMatchesExpected } from "../fixture-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

const packagerWebId = webId("packager");

export const checks: ScenarioCheck[] = [
  {
    id: "Q-1",
    scenario: "Q",
    description: "The Packager discovers one authoritative shipment through governed registration",
    run: async (context) => {
      const packagerFetch = await context.getActorFetch("packager");
      const registrationUrl = resourceUrl("consortium", "governance/registrations/shipment-fp-001.jsonld");
      const result = await assertFixtureQueryMatchesExpected({
        scenario: "Q",
        queryName: "discover-shipment",
        sources: [registrationUrl],
        fetch: packagerFetch,
      });

      assert.equal(result.rows.length, 1, "Scenario Q should discover one governed resource");
      const [registration] = result.rows;
      const shipment = await context.fetchJsonResource(
        packagerFetch,
        registration.resource,
        "Scenario Q registered shipment"
      );
      assert.equal(shipment["@id"], "did:secuweb:farmer:shipment-fp-001");
      assert.equal(shipment["@type"], "ex:ShipmentRecord");
      assert.equal(context.linkedIdentifier(shipment["ex:destination"]), packagerWebId);
      return `Fixture query ${result.queryPath} matched ${result.expectedPath} and fetched ${registration.resource}`;
    },
  },
];
