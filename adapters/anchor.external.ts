import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

async function main(){
  const ANCHOR_REPO = process.env.ANCHOR_REPO || resolve("secuweb-anchors");
  const VC = process.env.VC || resolve("data","vcs","issued-external.jsonld");
  const SUBJECT_DID = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const METADATA_URI = process.env.METADATA_URI || "";

  if(!existsSync(ANCHOR_REPO)) throw new Error(`Anchor repo not found at ${ANCHOR_REPO}`);
  if(!existsSync(VC)) throw new Error(`VC not found at ${VC}`);

  const p = spawnSync("npx", ["hardhat","run","scripts/anchorVc.ts","--network","localhost"], {
    cwd: ANCHOR_REPO,
    stdio: "inherit",
    env: { ...process.env, SUBJECT_DID, VC, METADATA_URI }
  });
  if (p.status !== 0) process.exit(p.status ?? 1);
  console.log("[ok] anchored via ./secuweb-anchors");
}
main().catch(e=>{console.error(e);process.exit(1);});
