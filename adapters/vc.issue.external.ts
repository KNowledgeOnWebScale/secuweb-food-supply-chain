import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
function req(n:string){const v=process.env[n];if(!v?.trim()) throw new Error(`Missing env: ${n}`);return v;}
async function main(){
  const VC_LIB=req("VC_LIB"), VC_MODE=req("VC_MODE"), VC_CONFIG=req("VC_CONFIG"), VC_UNSIGNED=req("VC_UNSIGNED");
  const VC_OUT=process.env.VC_OUT || resolve("data","vcs","issued-external.jsonld");
  mkdirSync(resolve("data","vcs"),{recursive:true});
  const p=spawnSync("node",["dist/cli.js","issue","-m",VC_MODE,"-c",VC_CONFIG,"-i",VC_UNSIGNED,"-o",VC_OUT],{cwd:VC_LIB,stdio:"inherit"});
  if(p.status!==0) process.exit(p.status??1);
  if(!existsSync(VC_OUT)) throw new Error(`VC not found at ${VC_OUT}`);
  console.log("[ok] issued:", VC_OUT, "bytes:", readFileSync(VC_OUT).byteLength);
}
main().catch(e=>{console.error(e);process.exit(1);});
