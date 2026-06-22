import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

import { expandJsonLd } from "../util/jsonld.js";
import { loadManifest } from "../fixtures/load-manifest.js";
import type { ManifestResource } from "../fixtures/manifest-types.js";

const MANIFEST_PATH = path.resolve(process.cwd(), "dev/fixtures/product-shipment/manifest.json");

function vcOutputPath(resource: ManifestResource): string {
  return path.resolve(process.cwd(), "local-run/generated/vcs", resource.owner, resource.podPath);
}

async function extractPodRef(vcPath: string): Promise<string> {
  const raw = await readFile(vcPath, "utf8");
  const expanded = await expandJsonLd(JSON.parse(raw)) as Record<string, unknown>[];

  if (expanded.length !== 1) {
    throw new Error(`Expected 1 expanded document in ${vcPath}, got ${expanded.length}`);
  }

  const [expandedVc] = expanded;
  const cs = expandedVc["https://www.w3.org/2018/credentials#credentialSubject"] as Record<string, unknown>[] | undefined;
  if (!cs || cs.length === 0) {
    throw new Error(`No credentialSubject in expanded VC: ${vcPath}`);
  }

  const urlValues = cs[0]["http://schema.org/url"] as { "@value": string }[] | undefined;
  const podRef = urlValues?.[0]?.["@value"];
  if (!podRef) {
    throw new Error(`No schema:url (podRef) in credentialSubject of ${vcPath}`);
  }

  return podRef;
}

function runAnchor(vcPath: string, subjectDid: string, metadataUri: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("/bin/bash", ["./src/flows/anchor.sh"], {
      stdio: "inherit",
      env: {
        ...process.env,
        VC_PATH: vcPath,
        SUBJECT_DID: subjectDid,
        METADATA_URI: metadataUri,
      },
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}

async function main(): Promise<void> {
  const manifest = await loadManifest(MANIFEST_PATH);
  const anchorResources = manifest.resources.filter((r) => r.anchor);

  console.log(`Anchoring ${anchorResources.length} resources from manifest "${manifest.id}"...`);

  for (const resource of anchorResources) {
    const vcPath = vcOutputPath(resource);

    try {
      await access(vcPath);
    } catch {
      throw new Error(
        `VC file not found for ${resource.id}: ${vcPath}\n` +
        `Run "npm run setup:fixtures" to issue and upload VCs first.`
      );
    }

    if (!resource.subjectDid) {
      throw new Error(`Resource ${resource.id} has anchor: true but no subjectDid`);
    }

    console.log(`[anchor] ${resource.id}`);
    const metadataUri = await extractPodRef(vcPath);
    console.log(`        metadataUri: ${metadataUri}`);
    console.log(`        subjectDid:  ${resource.subjectDid}`);

    const exitCode = await runAnchor(vcPath, resource.subjectDid, metadataUri);
    if (exitCode !== 0) {
      throw new Error(`anchor.sh failed for ${resource.id} (exit code ${exitCode})`);
    }
  }

  console.log(`\nDone: anchored ${anchorResources.length} resources.`);
}

main().catch((error) => {
  console.error("Failed to anchor fixtures:", error);
  process.exitCode = 1;
});
