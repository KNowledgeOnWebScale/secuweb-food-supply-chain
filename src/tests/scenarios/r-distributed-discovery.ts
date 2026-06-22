import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import { assertFixtureQueryMatchesExpected } from "../fixture-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "R-1",
    scenario: "R",
    description: "The Retailer discovers every registered provenance resource from one entry point",
    run: async (context) => {
      const retailerFetch = await context.getActorFetch("retailer");
      const entryPointUrl = resourceUrl("consortium", "discovery/batch-001.jsonld");
      const entryPoint = await context.fetchJsonResource(
        retailerFetch,
        entryPointUrl,
        "Scenario R discovery entry point"
      );
      assert.equal(entryPoint["ex:expectedManifestCount"], 4);
      assert.equal(entryPoint["ex:expectedResourceCount"], 8);

      const manifestResult = await assertFixtureQueryMatchesExpected({
        scenario: "R",
        queryName: "discover-manifests",
        sources: [entryPointUrl],
        fetch: retailerFetch,
      });
      const manifests = manifestResult.rows.map((row) => row.manifest);
      assert.equal(manifests.length, 4, "Scenario R should discover four actor manifests");

      await Promise.all(manifests.map((manifest) => context.fetchJsonResource(
        retailerFetch,
        manifest,
        `Scenario R manifest ${manifest}`
      )));

      const resourceResult = await assertFixtureQueryMatchesExpected({
        scenario: "R",
        queryName: "discover-resources",
        sources: manifests,
        fetch: retailerFetch,
      });
      assert.equal(resourceResult.rows.length, 8, "Discovery did not return all eight resources");

      const fetchedResources = await Promise.all(resourceResult.rows.map((resource) => context.fetchJsonResource(
        retailerFetch,
        resource.resource,
        `Scenario R discovered resource ${resource.resourceIdentifier}`
      )));
      assert.deepEqual(
        new Set(fetchedResources.map((resource) => context.linkedIdentifier(resource["@id"]))),
        new Set(resourceResult.rows.map((resource) => resource.resourceIdentifier))
      );
      return `Fixture queries ${manifestResult.queryPath} and ${resourceResult.queryPath} matched expected SRJ files and yielded ${resourceResult.rows.length} fetchable resources`;
    },
  },
];
