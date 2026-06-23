import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "E-1",
    scenario: "E",
    description: "The unchanged Farmer VC passes digital-signature verification",
    run: async (context) => {
      const configPath = path.resolve(process.cwd(), "local-run/generated/vc-setup/vc.setup.farmer.json");
      const { text } = await context.getOriginalCredential();
      const cachedVc = await context.cacheOutput("inputs/product-x-original.jsonld", text, {
        contentType: "application/ld+json",
        label: "Original Farmer VC signature input",
      });
      const vcPath = path.join(context.evidenceDir, "product-x-original.jsonld");
      await writeFile(vcPath, text, "utf8");
      const verification = await context.runVcCli(cachedVc.absolutePath, configPath);
      assert.equal(verification.exitCode, 0, `Signature verification failed: ${verification.output}`);
      return verification.output;
    },
  },
  {
    id: "E-2",
    scenario: "E",
    description: "A modified Farmer VC fails digital-signature verification",
    run: async (context) => {
      const configPath = path.resolve(process.cwd(), "local-run/generated/vc-setup/vc.setup.farmer.json");
      const { credential } = await context.getOriginalCredential();
      const tamperedCredential = structuredClone(credential);
      tamperedCredential.credentialSubject["schema:name"] = "Tampered product";
      const tamperedContent = JSON.stringify(tamperedCredential);
      const cachedTamperedVc = await context.cacheOutput("inputs/product-x-tampered.jsonld", tamperedContent, {
        contentType: "application/ld+json",
        label: "Tampered Farmer VC signature input",
      });
      const tamperedPath = path.join(context.evidenceDir, "product-x-tampered.jsonld");
      await writeFile(tamperedPath, tamperedContent, "utf8");
      const verification = await context.runVcCli(cachedTamperedVc.absolutePath, configPath);
      assert.notEqual(
        verification.exitCode,
        0,
        "The modified credential unexpectedly passed signature verification"
      );
      assert.match(
        verification.output,
        /Verification result: fail\./,
        `The modified credential failed for an unexpected reason: ${verification.output}`
      );
      return verification.output;
    },
  },
];
