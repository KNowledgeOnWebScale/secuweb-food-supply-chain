import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { loadManifest, resolveSource } from "./load-manifest.js";

type JsonObject = Record<string, unknown>;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function hasOwnProperty(object: JsonObject, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

async function readJsonObject(
  filePath: string,
  label: string,
  errors: string[]
): Promise<JsonObject | undefined> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      errors.push(`${label} is not a JSON object`);
      return undefined;
    }
    return parsed as JsonObject;
  } catch (error) {
    errors.push(`${label} is not readable JSON: ${(error as Error).message}`);
    return undefined;
  }
}

function validateStringArray(value: unknown, label: string, errors: string[]): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }

  const invalid = value.filter((item) => typeof item !== "string");
  if (invalid.length > 0) {
    errors.push(`${label} must contain only strings`);
    return [];
  }

  return value as string[];
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

    if (resource.minimizedFrom !== undefined) {
      if (typeof resource.minimizedFrom !== "string") {
        errors.push(`${label} minimizedFrom must be a string`);
      }

      const retainedFields = validateStringArray(resource.retainedFields, `${label} retainedFields`, errors);
      const omittedFields = validateStringArray(resource.omittedFields, `${label} omittedFields`, errors);

      const fullSourcePath = path.resolve(manifestDir, resource.minimizedFrom);
      if (!(await fileExists(fullSourcePath))) {
        errors.push(`${label} minimizedFrom file not found: ${resource.minimizedFrom}`);
      } else if (await fileExists(sourcePath)) {
        const [fullSource, minimizedView] = await Promise.all([
          readJsonObject(fullSourcePath, `${label} minimizedFrom`, errors),
          readJsonObject(sourcePath, `${label} minimized source`, errors),
        ]);

        if (fullSource && minimizedView) {
          for (const field of retainedFields) {
            if (!hasOwnProperty(fullSource, field)) {
              errors.push(`${label} retained field "${field}" is missing from minimizedFrom source`);
            }
            if (!hasOwnProperty(minimizedView, field)) {
              errors.push(`${label} retained field "${field}" is missing from minimized source`);
            }
            if (
              hasOwnProperty(fullSource, field) &&
              hasOwnProperty(minimizedView, field) &&
              !isDeepStrictEqual(fullSource[field], minimizedView[field])
            ) {
              errors.push(`${label} retained field "${field}" differs between source and minimized view`);
            }
          }

          for (const field of omittedFields) {
            if (!hasOwnProperty(fullSource, field)) {
              errors.push(`${label} omitted field "${field}" is missing from minimizedFrom source`);
            }
            if (hasOwnProperty(minimizedView, field)) {
              errors.push(`${label} omitted field "${field}" is still present in minimized source`);
            }
          }
        }
      }
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
