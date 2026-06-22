import assert from "node:assert/strict";

import { queryActorDidBinding } from "../../query/provenance-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "I-1",
    scenario: "I",
    description: "The VC issuer WebID is explicitly bound to the Farmer DID",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const issuer = credential.issuer;
      const dids = await queryActorDidBinding(issuer);
      assert.deepEqual(
        dids,
        ["did:secuweb:farmer"],
        `Unexpected DID bindings for ${issuer}: ${dids.join(", ")}`
      );
      return `${issuer} is bound to ${dids[0]}`;
    },
  },
];
