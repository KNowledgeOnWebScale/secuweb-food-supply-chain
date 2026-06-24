import assert from "node:assert/strict";

import { actorAddress, loadActorsSync, requireActor } from "../../fixtures/actors.js";
import type { ScenarioCheck } from "../scenario-types.js";

const actors = loadActorsSync();

export const checks: ScenarioCheck[] = [
  {
    id: "A-1",
    scenario: "A",
    description: "The Farmer VC anchor is signed by the did:secuweb:farmer cryptographic identity",
    run: async (context) => {
      const { credential } = await context.getOriginalCredential();
      const verification = await context.verifyOnChain(credential);
      // `verified` also requires issuerVerified (signer == controller of the issuer DID).
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
  {
    id: "A-2",
    scenario: "A",
    description: "The Farmer WebID-DID binding and product-origin control or accreditation assertion are verifiable",
    skip: true,
    skipCategory: "feature-absent",
    skipReason:
      "No evidence source currently links the Farmer WebID to did:secuweb:farmer and to a verifiable resource-control or issuer-accreditation assertion for product-origin data. A-1 only proves control of the cryptographic DID.",
  },
];
