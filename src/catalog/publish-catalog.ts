import path from "node:path";
import { overwriteFile, universalAccess } from "@inrupt/solid-client";

import { wrapper_createAuthenticatedFetch } from "../css/client-credentials";
import { createContainer } from "../css/helpers";
import { actorContainerUrl, cssBaseUrl, resourceUrl, webId } from "../config/runtime";
import { actorDid, actorDisplayName, actorRole, loadActors, requireActor } from "../fixtures/actors.js";
import { loadManifest } from "../fixtures/load-manifest.js";

const MANIFEST_PATH = path.resolve(process.cwd(), "dev/fixtures/product-shipment/manifest.json");

function catalogResourceUrl(path: string): string {
  const [actor, ...resourceParts] = path.split("/");
  return resourceUrl(actor, resourceParts.join("/"));
}

function createCatalog(
  catalogUrl: string,
  resourcePaths: string[],
  participants: ReturnType<typeof requireActor>[]
): object {
  return {
    "@context": {
      ex: "http://example.org/terms#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      schema: "http://schema.org/",
    },
    "@id": catalogUrl,
    "@type": "ex:SupplyChainCatalog",
    "schema:provider": {
      "@id": webId("consortium"),
    },
    "ex:participant": participants.map((participant) => ({
      "@id": webId(participant.name),
      "@type": `ex:${participant.role}`,
      "schema:name": actorDisplayName(participant),
      "ex:did": {
        "@id": actorDid(participant),
      },
      "ex:serviceEndpoint": {
        "@id": actorContainerUrl(participant.name),
      },
    })),
    "rdfs:seeAlso": resourcePaths.map((resourcePath) => ({
      "@id": catalogResourceUrl(resourcePath),
    })),
  };
}

async function main(): Promise<void> {
  const manifest = await loadManifest(MANIFEST_PATH);
  const actors = await loadActors();
  const resourcePaths = manifest.resources
    .filter((r) => r.catalog)
    .map((r) => `${r.owner}/${r.podPath}`);
  const participants = manifest.actors.map((actorName) => {
    const actor = requireActor(actors, actorName);
    return { ...actor, role: actorRole(actor) };
  });
  const consortium = requireActor(actors, "consortium");

  const authFetch = await wrapper_createAuthenticatedFetch(
    consortium.name,
    consortium.email,
    consortium.password,
    cssBaseUrl
  );
  const catalogContainerUrl = actorContainerUrl("consortium", "catalog");
  const catalogUrl = `${catalogContainerUrl}index.jsonld`;
  const catalog = createCatalog(catalogUrl, resourcePaths, participants);

  await createContainer(catalogContainerUrl, authFetch);
  await overwriteFile(
    catalogUrl,
    new Blob([JSON.stringify(catalog, null, 2)]),
    {
      contentType: "application/ld+json",
      fetch: authFetch,
    }
  );
  await universalAccess.setPublicAccess(
    catalogUrl,
    {
      read: true,
      append: false,
      write: false,
    },
    { fetch: authFetch }
  );

  console.log(`Published public supply-chain catalog at ${catalogUrl}`);
}

main().catch((error) => {
  console.error("Failed to publish supply-chain catalog:", error);
  process.exitCode = 1;
});
