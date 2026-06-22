import assert from "node:assert/strict";

import { actorAddress, loadActorsSync, requireActor } from "../../fixtures/actors.js";
import type { ScenarioCheck } from "../scenario-types.js";

const actors = loadActorsSync();

export const checks: ScenarioCheck[] = [
  {
    id: "B-1",
    scenario: "B",
    description: "The unchanged Farmer VC matches its on-chain commitment",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const verification = await context.verifyOnChain(credential);
      assert.equal(
        verification.verified,
        true,
        `Expected an anchored credential, received ${JSON.stringify(verification)}`
      );
      assert.ok(verification.anchor?.vcHash, "Verifier returned no anchor hash");
      return `Retrieved content matched anchor ${verification.anchor.vcHash}`;
    },
  },
  {
    id: "B-2",
    scenario: "B",
    description: "A modified Farmer VC no longer matches its on-chain commitment",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const tamperedCredential = structuredClone(credential);
      tamperedCredential.credentialSubject["schema:name"] = "Tampered product";
      const verification = await context.verifyOnChain(tamperedCredential);
      assert.equal(
        verification.error,
        undefined,
        `Chain verifier returned an error: ${JSON.stringify(verification.error)}`
      );
      assert.equal(
        verification.verified,
        false,
        "The modified credential unexpectedly matched an on-chain commitment"
      );
      return "The modified content did not match an on-chain commitment";
    },
  },
  {
    id: "B-3",
    scenario: "B",
    description: "The Farmer VC anchor is signed by, and verified against, the Farmer's on-chain identity",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const verification = await context.verifyOnChain(credential);
      // `verified` now also requires issuerVerified (signer == controller of the issuer DID).
      assert.equal(
        verification.verified,
        true,
        `Expected a verified anchor, received ${JSON.stringify(verification)}`
      );
      assert.equal(
        verification.anchor?.issuerDid,
        "did:secuweb:farmer",
        `Unexpected anchor issuerDid: ${verification.anchor?.issuerDid}`
      );
      const farmerAddress = actorAddress(requireActor(actors, "farmer"));
      assert.equal(
        String(verification.anchor?.issuer).toLowerCase(),
        farmerAddress.toLowerCase(),
        `Anchor issuer ${verification.anchor?.issuer} is not the Farmer address ${farmerAddress}`
      );
      return `Anchor issued by ${verification.anchor?.issuerDid} (${verification.anchor?.issuer})`;
    },
  },
];
