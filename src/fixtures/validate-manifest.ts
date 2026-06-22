import { access } from "node:fs/promises";
import path from "node:path";
import { loadManifest, resolveSource } from "./load-manifest.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("Usage: validate-manifest <path-to-manifest.json>");
    process.exitCode = 1;
    return;
  }

  const resolvedManifestPath = path.resolve(process.cwd(), manifestPath);
  const manifest = await loadManifest(resolvedManifestPath);
  const manifestDir = path.dirname(resolvedManifestPath);
  const errors: string[] = [];

  const podTargets = new Set<string>();

  for (const resource of manifest.resources) {
    const label = `[${resource.id}]`;

    const sourcePath = resolveSource(resource, manifestDir);
    if (!(await fileExists(sourcePath))) {
      errors.push(`${label} source file not found: ${resource.source}`);
    }

    if (resource.publication === "verifiableCredential" && !resource.subjectDid) {
      errors.push(`${label} verifiableCredential resource is missing subjectDid`);
    }

    for (const grant of resource.grants) {
      if (!manifest.actors.includes(grant.agent)) {
        errors.push(`${label} grant agent "${grant.agent}" is not in actors list`);
      }
    }

    const podTarget = `${resource.owner}/${resource.podPath}`;
    if (podTargets.has(podTarget)) {
      errors.push(`${label} duplicate pod target: ${podTarget}`);
    }
    podTargets.add(podTarget);
  }

  if (errors.length > 0) {
    console.error(`Manifest validation failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Manifest "${manifest.id}" is valid: ${manifest.resources.length} resources checked.`);
  for (const resource of manifest.resources) {
    const flags = [
      resource.catalog ? "catalog" : null,
      resource.anchor ? "anchor" : null,
    ].filter(Boolean).join(", ");
    console.log(`  ${resource.id} (${resource.owner}) [${flags || "none"}]`);
  }
}

main().catch((error) => {
  console.error("Unexpected error during validation:", error);
  process.exitCode = 1;
});
