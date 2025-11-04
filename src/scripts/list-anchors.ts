import hre from "hardhat";
import { resolve } from "node:path";
async function main() {
  const did = process.env.SUBJECT_DID || "did:secuweb:product:batch123";
  const addr = require(resolve("secuweb-anchors","cache","contract.json")).address as string;
  const artifact = await hre.artifacts.readArtifact("DIDRegistry");
  const [signer] = await hre.ethers.getSigners();
  const reg = new hre.ethers.Contract(addr, artifact.abi, signer);
  const count: bigint = await reg.getAnchorCount(did).catch(() => 0n);
  console.log("DID:", did, "anchors:", count.toString());
  for (let i=0; i<Number(count); i++) {
    const a = await reg.getAnchor(did,i);
    console.log(i, a);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
