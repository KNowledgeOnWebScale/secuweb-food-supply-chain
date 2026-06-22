import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { overwriteFile, universalAccess } from "@inrupt/solid-client";

import { wrapper_createAuthenticatedFetch } from "../css/client-credentials.js";
import { createContainer } from "../css/helpers.js";
import { actorContainerUrl, cssBaseUrl, webId } from "../config/runtime.js";
import { loadActors, requireActor } from "./actors.js";
import { loadManifest, resolveSource, resolvePodUrl } from "./load-manifest.js";
import { VCProxy } from "../flows/create-vc.js";

type AuthenticatedFetch = typeof fetch;

const MANIFEST_PATH = path.resolve(process.cwd(), "dev/fixtures/product-shipment/manifest.json");

function vcOutputPath(owner: string, podPath: string): string {
  return path.resolve(process.cwd(), "local-run/generated/vcs", owner, podPath);
}

async function ensureParentContainers(
  owner: string,
  podPath: string,
  authFetch: AuthenticatedFetch
): Promise<void> {
  const segments = podPath.split("/");
  let containerUrl = actorContainerUrl(owner);
  for (const segment of segments.slice(0, -1)) {
    containerUrl = `${containerUrl}${segment}/`;
    await createContainer(containerUrl, authFetch);
  }
}

async function main(): Promise<void> {
  const manifest = await loadManifest(MANIFEST_PATH);
  const actors = await loadActors();

  const authFetches = new Map<string, Promise<AuthenticatedFetch>>();

  function getAuthFetch(actorName: string): Promise<AuthenticatedFetch> {
    if (!authFetches.has(actorName)) {
      const creds = requireActor(actors, actorName);
      authFetches.set(
        actorName,
        wrapper_createAuthenticatedFetch(creds.name, creds.email, creds.password, cssBaseUrl)
      );
    }
    return authFetches.get(actorName)!;
  }

  // Set up VCProxy once per actor that owns at least one verifiableCredential resource.
  const vcProxies = new Map<string, VCProxy>();
  const vcOwners = [
    ...new Set(
      manifest.resources
        .filter((r) => r.publication === "verifiableCredential")
        .map((r) => r.owner)
    ),
  ];

  await mkdir(path.resolve(process.cwd(), "local-run/generated/vcs"), { recursive: true });

  for (const owner of vcOwners) {
    const creds = requireActor(actors, owner);
    const proxy = new VCProxy({ name: creds.name, email: creds.email, password: creds.password });
    console.log(`[setup] VCProxy for ${owner}`);
    const setupCode = await proxy.setup();
    if (setupCode !== 0) {
      throw new Error(`VC setup failed for ${owner} (exit code ${setupCode})`);
    }
    vcProxies.set(owner, proxy);
  }

  // Issue VCs and upload to pods.
  for (const resource of manifest.resources) {
    if (resource.publication !== "verifiableCredential") continue;

    const sourcePath = resolveSource(resource, path.dirname(MANIFEST_PATH));
    const outputPath = vcOutputPath(resource.owner, resource.podPath);

    await mkdir(path.dirname(outputPath), { recursive: true });

    const proxy = vcProxies.get(resource.owner)!;
    console.log(`[issue] ${resource.id}`);
    const issueCode = await proxy.issue(sourcePath, outputPath);
    if (issueCode !== 0) {
      throw new Error(`VC issuance failed for ${resource.id} (exit code ${issueCode})`);
    }

    const authFetch = await getAuthFetch(resource.owner);
    const podUrl = resolvePodUrl(resource, cssBaseUrl);

    await ensureParentContainers(resource.owner, resource.podPath, authFetch);

    const vcContent = await readFile(outputPath, "utf8");
    await overwriteFile(podUrl, new Blob([vcContent]), {
      contentType: "application/ld+json",
      fetch: authFetch,
    });
    console.log(`[upload] ${podUrl}`);
  }

  // Apply ACL grants declared in the manifest.
  let grantCount = 0;
  for (const resource of manifest.resources) {
    if (resource.grants.length === 0) continue;

    const podUrl = resolvePodUrl(resource, cssBaseUrl);
    const authFetch = await getAuthFetch(resource.owner);

    for (const grant of resource.grants) {
      const agentWebId = webId(grant.agent);
      await universalAccess.setAgentAccess(
        podUrl,
        agentWebId,
        { read: grant.read, append: false, write: false, controlRead: false, controlWrite: false },
        { fetch: authFetch }
      );
      console.log(`[acl] ${grant.agent} -> ${podUrl}`);
      grantCount++;
    }
  }

  console.log(
    `\nDone: ${manifest.resources.length} VCs issued and uploaded, ${grantCount} ACL grants applied.`
  );
}

main().catch((error) => {
  console.error("Failed to publish Product Shipment fixtures:", error);
  process.exitCode = 1;
});
