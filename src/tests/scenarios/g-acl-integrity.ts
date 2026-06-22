import assert from "node:assert/strict";

import { resourceUrl, webId } from "../../config/runtime.js";
import type { ScenarioCheck } from "../scenario-types.js";

const farmerProductUrl = resourceUrl("farmer", "products/vc/product-x.jsonld");
const retailerWebId = webId("retailer");

export const checks: ScenarioCheck[] = [
  {
    id: "G-1",
    scenario: "G",
    description: "The authenticated Farmer can inspect the ACL governing its resource",
    run: async (context) => {
      const farmerFetch = await context.getActorFetch("farmer");
      const response = await farmerFetch(`${farmerProductUrl}.acl`, {
        headers: { accept: "text/turtle" },
      });
      assert.equal(response.status, 200, `Farmer ACL GET returned HTTP ${response.status}`);
      const acl = await response.text();
      assert.match(acl, /acl#Control/, "Farmer ACL does not contain owner control");
      return `Authenticated Farmer retrieved its ACL with HTTP ${response.status}`;
    },
  },
  {
    id: "G-2",
    scenario: "G",
    description: "A different authenticated actor cannot change the Farmer resource ACL",
    run: async (context) => {
      const transporterFetch = await context.getActorFetch("transporter");
      const maliciousAcl = [
        "@prefix acl: <http://www.w3.org/ns/auth/acl#>.",
        "",
        "<#unauthorized> a acl:Authorization;",
        `  acl:accessTo <${farmerProductUrl}>;`,
        `  acl:agent <${retailerWebId}>;`,
        "  acl:mode acl:Read.",
        "",
      ].join("\n");
      const response = await transporterFetch(`${farmerProductUrl}.acl`, {
        method: "PUT",
        headers: { "content-type": "text/turtle" },
        body: maliciousAcl,
      });
      assert.ok(
        context.isDeniedStatus(response.status),
        `Transporter unexpectedly changed the ACL with HTTP ${response.status}`
      );
      return `ACL write denied with HTTP ${response.status}`;
    },
  },
];
