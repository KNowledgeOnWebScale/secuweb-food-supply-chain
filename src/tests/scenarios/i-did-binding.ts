import assert from "node:assert/strict";

import { actorAddress, loadActorsSync, requireActor } from "../../fixtures/actors.js";
import { queryActorDidBinding } from "../../query/provenance-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

const actors = loadActorsSync();

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
  {
    id: "I-2",
    scenario: "I",
    description: "The Farmer DID is registered on-chain with the Farmer's address as controller",
    run: async (context) => {
      const explorer = await context.getExplorerData();
      const row = (explorer.dids ?? []).find((entry) => entry.did === "did:secuweb:farmer");
      assert.ok(row, "did:secuweb:farmer is not present in the on-chain DID registry");
      assert.equal(row.active, true, "did:secuweb:farmer is not active on-chain");
      const farmerAddress = actorAddress(requireActor(actors, "farmer"));
      assert.equal(
        row.controller.toLowerCase(),
        farmerAddress.toLowerCase(),
        `On-chain controller ${row.controller} is not the Farmer address ${farmerAddress}`
      );
      return `did:secuweb:farmer controller is ${row.controller}`;
    },
  },
];
