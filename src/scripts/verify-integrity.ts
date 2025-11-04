import hre from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const did = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const vcPath = process.env.VC || resolve("src","flows","output","farmer","products","vc","product-x.jsonld");
  const bytes = readFileSync(vcPath);
  const computed = hre.ethers.keccak256(bytes);

  const addr = require(resolve("secuweb-anchors","cache","contract.json")).address as string;
  const artifact = await hre.artifacts.readArtifact("DIDRegistry");
  const [signer] = await hre.ethers.getSigners();
  const reg = new hre.ethers.Contract(addr, artifact.abi, signer);

  const count: bigint = await reg.getAnchorCount(did).catch(() => 0n);
  if (count === 0n) { console.log("No anchors for DID:", did); return; }
  const last = Number(count - 1n);
  const anchor = await reg.getAnchor(did, last);
  const onchain = anchor[0];

  console.log("Computed:", computed);
  console.log("On-chain:", onchain);
  console.log(computed.toLowerCase() === String(onchain).toLowerCase()
    ? "[ok] integrity: MATCH"
    : "[!] integrity: MISMATCH");
}
main().catch(e => { console.error(e); process.exit(1); });
