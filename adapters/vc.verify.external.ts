import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
function req(n:string){const v=process.env[n];if(!v?.trim()) throw new Error(`Missing env: ${n}`);return v;}
async function main(){
  const VC_LIB=req("VC_LIB"), VC_MODE=req("VC_MODE"), VC_CONFIG=req("VC_CONFIG");
  const VC=process.env.VC || resolve("data","vcs","issued-external.jsonld");
  if(!existsSync(VC)) throw new Error(`Missing VC at ${VC}`);
  const p=spawnSync("node",["dist/cli.js","verify","-m",VC_MODE,"-c",VC_CONFIG,"-i",VC],{cwd:VC_LIB,stdio:"inherit"});
  if(p.status!==0) process.exit(p.status??1);
  console.log("[ok] verified:", VC);
}
main().catch(e=>{console.error(e);process.exit(1);});
