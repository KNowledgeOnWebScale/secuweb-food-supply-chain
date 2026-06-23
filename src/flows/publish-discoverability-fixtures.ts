import { overwriteFile, universalAccess } from "@inrupt/solid-client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { wrapper_createAuthenticatedFetch } from "../css/client-credentials";
import { createContainer } from "../css/helpers";
import {
  actorContainerUrl,
  cssBaseUrl,
  resourceUrl,
  webId,
} from "../config/runtime";
import { loadActorsSync } from "../fixtures/actors";

type AuthenticatedFetch = typeof fetch;

type FixtureResource = {
  actor: string;
  resourcePath: string;
  resourceUrl: string;
  content: string;
  sourceFile: string;
};

type AccessGrant = {
  read: boolean;
  append: boolean;
  write: boolean;
  controlRead: boolean;
  controlWrite: boolean;
};

const fixtureBaseUrl = "http://localhost:3000";
const projectRoot = process.cwd();
const actorCredentials = loadActorsSync();
const fixtureRoots = [
  path.join(projectRoot, "dev", "fixtures", "product-shipment", "overlays", "shared"),
  path.join(projectRoot, "dev", "fixtures", "product-shipment", "overlays", "scenario-q"),
  path.join(projectRoot, "dev", "fixtures", "product-shipment", "overlays", "scenario-r"),
  path.join(projectRoot, "dev", "fixtures", "product-shipment", "overlays", "scenario-v"),
];

const actorFetches = new Map<string, Promise<AuthenticatedFetch>>();

function isActorName(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(actorCredentials, value);
}

function replaceFixtureBaseUrl(text: string): string {
  return text.split(fixtureBaseUrl).join(cssBaseUrl);
}

async function listFiles(root: string, suffix: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return await listFiles(entryPath, suffix);
    }
    return entry.isFile() && entry.name.endsWith(suffix) ? [entryPath] : [];
  }));
  return nestedFiles.flat().sort();
}

function parseFixtureTarget(root: string, filePath: string): {
  actor: string;
  resourcePath: string;
  resourceUrl: string;
} {
  const relativePath = path.relative(root, filePath).split(path.sep).join("/");
  const [actor, ...resourceParts] = relativePath.split("/");

  if (!actor || !isActorName(actor)) {
    throw new Error(`Fixture path does not start with a known actor: ${filePath}`);
  }
  if (resourceParts.length === 0) {
    throw new Error(`Fixture path has no resource path: ${filePath}`);
  }

  const resourcePath = resourceParts.join("/");
  return {
    actor,
    resourcePath,
    resourceUrl: resourceUrl(actor, resourcePath),
  };
}

async function collectResources(): Promise<Map<string, FixtureResource>> {
  const resources = new Map<string, FixtureResource>();

  for (const root of fixtureRoots) {
    const files = await listFiles(root, ".jsonld");
    for (const file of files) {
      const target = parseFixtureTarget(root, file);
      const content = replaceFixtureBaseUrl(await readFile(file, "utf8"));
      const existing = resources.get(target.resourceUrl);

      if (existing && existing.content !== content) {
        throw new Error(
          `Fixture resource conflict for ${target.resourceUrl}: ${existing.sourceFile} and ${file}`
        );
      }

      resources.set(target.resourceUrl, {
        ...target,
        content,
        sourceFile: file,
      });
    }
  }

  return resources;
}

function emptyGrant(): AccessGrant {
  return {
    read: false,
    append: false,
    write: false,
    controlRead: false,
    controlWrite: false,
  };
}

function parseModes(block: string): AccessGrant {
  const modes = /acl:mode\s+([^.]*)\./s.exec(block)?.[1] || "";
  return {
    read: /\bacl:Read\b/.test(modes),
    append: /\bacl:Append\b/.test(modes),
    write: /\bacl:Write\b/.test(modes),
    controlRead: /\bacl:Control\b/.test(modes),
    controlWrite: /\bacl:Control\b/.test(modes),
  };
}

function mergeGrant(left: AccessGrant, right: AccessGrant): AccessGrant {
  return {
    read: left.read || right.read,
    append: left.append || right.append,
    write: left.write || right.write,
    controlRead: left.controlRead || right.controlRead,
    controlWrite: left.controlWrite || right.controlWrite,
  };
}

function actorFromResourceUrl(resourceUrl: string): string {
  const actor = new URL(resourceUrl).pathname.split("/").filter(Boolean)[0];
  if (!actor || !isActorName(actor)) {
    throw new Error(`Resource URL does not point to a known actor Pod: ${resourceUrl}`);
  }
  return actor;
}

function ownerWebId(resourceUrl: string): string {
  return webId(actorFromResourceUrl(resourceUrl));
}

async function collectAccessGrants(): Promise<Map<string, Map<string, AccessGrant>>> {
  const grants = new Map<string, Map<string, AccessGrant>>();

  for (const root of fixtureRoots) {
    const files = await listFiles(root, ".acl");
    for (const file of files) {
      const acl = replaceFixtureBaseUrl(await readFile(file, "utf8"));
      const blocks = acl.split(/\n\s*\n/);

      for (const block of blocks) {
        const resourceUrl = /acl:accessTo\s+<([^>]+)>/.exec(block)?.[1];
        const agent = /acl:agent\s+<([^>]+)>/.exec(block)?.[1];
        if (!resourceUrl || !agent || agent === ownerWebId(resourceUrl)) {
          continue;
        }

        const grant = parseModes(block);
        const resourceGrants = grants.get(resourceUrl) || new Map<string, AccessGrant>();
        resourceGrants.set(
          agent,
          mergeGrant(resourceGrants.get(agent) || emptyGrant(), grant)
        );
        grants.set(resourceUrl, resourceGrants);
      }
    }
  }

  return grants;
}

function getActorFetch(actor: string): Promise<AuthenticatedFetch> {
  const existing = actorFetches.get(actor);
  if (existing) {
    return existing;
  }

  const credentials = actorCredentials[actor];
  const authFetch = wrapper_createAuthenticatedFetch(
    credentials.name,
    credentials.email,
    credentials.password,
    cssBaseUrl
  );
  actorFetches.set(actor, authFetch);
  return authFetch;
}

async function ensureParentContainers(
  actor: string,
  resourcePath: string,
  authFetch: AuthenticatedFetch
): Promise<void> {
  const segments = resourcePath.split("/");
  let containerUrl = actorContainerUrl(actor);

  for (const segment of segments.slice(0, -1)) {
    containerUrl = `${containerUrl}${segment}/`;
    await createContainer(containerUrl, authFetch);
  }
}

async function publishResource(resource: FixtureResource): Promise<void> {
  const authFetch = await getActorFetch(resource.actor);
  await ensureParentContainers(resource.actor, resource.resourcePath, authFetch);
  await overwriteFile(
    resource.resourceUrl,
    new Blob([resource.content]),
    {
      contentType: "application/ld+json",
      fetch: authFetch,
    }
  );
  console.log(`Published ${resource.resourceUrl}`);
}

async function applyGrants(grants: Map<string, Map<string, AccessGrant>>): Promise<void> {
  for (const [resourceUrl, resourceGrants] of [...grants.entries()].sort()) {
    const owner = actorFromResourceUrl(resourceUrl);
    const authFetch = await getActorFetch(owner);

    for (const [agent, grant] of [...resourceGrants.entries()].sort()) {
      await universalAccess.setAgentAccess(resourceUrl, agent, grant, { fetch: authFetch });
      console.log(`Granted ${agent} access to ${resourceUrl}`);
    }
  }
}

async function main(): Promise<void> {
  const resources = await collectResources();
  const grants = await collectAccessGrants();

  for (const resource of [...resources.values()].sort((left, right) => (
    left.resourceUrl.localeCompare(right.resourceUrl)
  ))) {
    await publishResource(resource);
  }

  await applyGrants(grants);

  console.log(
    `Published ${resources.size} discoverability resources and ${[...grants.values()].reduce(
      (sum, resourceGrants) => sum + resourceGrants.size,
      0
    )} access grants`
  );
}

main().catch((error) => {
  console.error("Failed to publish discoverability fixtures:", error);
  process.exitCode = 1;
});
