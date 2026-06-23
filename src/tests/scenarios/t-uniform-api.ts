import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "T-1",
    scenario: "T",
    description: "Verification evidence is retrievable through a uniform API pattern aligned with domain data",
    skip: false,
    run: async (context) => {
      const domainResource = resourceUrl("farmer", "products/vc/product-X.jsonld");
      const expectedEvidenceContract = {
        scenario: "T",
        domainResource,
        expectedCapability:
          "A client can retrieve verification evidence for a domain resource through the same stable HTTP/API pattern used for domain data.",
        expectedEvidenceShape: {
          resource: "IRI of the verified domain resource",
          verified: "boolean verification result",
          commitment: "stable integrity reference for the verified resource",
          issuerOrController: "actor identity associated with the evidence",
          generatedAt: "timestamp or event time for the evidence",
        },
        missingCapability:
          "No uniform verification-evidence resource, link relation, or adapter endpoint is defined for domain resources.",
      };
      await context.cacheOutput("expected-verification-evidence-api.json", expectedEvidenceContract, {
        contentType: "application/json",
        label: "Expected uniform verification-evidence API contract",
      });

      assert.fail(
        "No uniform verification-evidence API is defined for retrieved domain data. " +
          "The current verifier/blockchain integration is a separate implementation-specific service rather than a resource-level API pattern aligned with domain data access."
      );
    },
  },
];
