import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Manifest, ManifestResource } from "./manifest-types.js";

export async function loadManifest(manifestPath: string): Promise<Manifest> {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as Manifest;

  if (!manifest.id || !Array.isArray(manifest.resources)) {
    throw new Error(`Invalid manifest at ${manifestPath}: missing id or resources array`);
  }

  const ids = manifest.resources.map((r) => r.id);
  const duplicateId = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicateId) {
    throw new Error(`Duplicate resource id in manifest: "${duplicateId}"`);
  }

  return manifest;
}

export function resolveSource(resource: ManifestResource, baseDir: string): string {
  return path.resolve(baseDir, resource.source);
}

export function resolvePodUrl(resource: ManifestResource, cssBaseUrl: string): string {
  return `${cssBaseUrl}/${resource.owner}/${resource.podPath}`;
}
