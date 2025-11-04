import { spawnSync } from "node:child_process";
function req(n:string){const v=process.env[n];if(!v?.trim()) throw new Error(`Missing env: ${n}`);return v;}
async function main(){
  const VC_LIB=req("VC_LIB"), VC_MODE=req("VC_MODE"), VC_CONFIG=req("VC_CONFIG");
  const p=spawnSync("node",["dist/cli.js","setup","-m",VC_MODE,"-c",VC_CONFIG],{cwd:VC_LIB,stdio:"inherit"});
  if(p.status!==0) process.exit(p.status??1);
  console.log("[ok] setup via vc-prototyping-library");
}
main().catch(e=>{console.error(e);process.exit(1);});
