import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

const farmerProductUrl = resourceUrl("farmer", "products/vc/product-x.jsonld");

export const checks: ScenarioCheck[] = [
  {
    id: "K-1",
    scenario: "K",
    description: "The Packager can read the Farmer resource explicitly shared with it",
    run: async (context) => {
      const packagerFetch = await context.getActorFetch("packager");
      await context.fetchCredential(packagerFetch, farmerProductUrl);
      return "Authorized Packager received HTTP 200 with a Verifiable Credential";
    },
  },
  {
    id: "K-2",
    scenario: "K",
    description: "The Transporter cannot read the Farmer resource shared with the Packager",
    run: async (context) => {
      const transporterFetch = await context.getActorFetch("transporter");
      const response = await transporterFetch(farmerProductUrl);
      assert.ok(
        context.isDeniedStatus(response.status),
        `Transporter unexpectedly received HTTP ${response.status}`
      );
      return `Unauthorized Transporter read was denied with HTTP ${response.status}`;
    },
  },
];
