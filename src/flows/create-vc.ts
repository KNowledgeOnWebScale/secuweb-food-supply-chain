import {Command} from "commander";
// import {writeDataToSolidPod} from "../css/api";
import {urlServer} from "./config";
import {writeFileSync} from "node:fs";


import { spawn } from "node:child_process";


interface UserParams {
    name: string
    email: string
    password: string
}


function runCommand(cmd: string, args: string[] = []) {
    
  return new Promise<number>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",  // pipes output directly to console
      shell: false,      // use true if you need shell features like globs
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}


class VCProxy {
    private userParams: UserParams;
    private vcSetupConfig: any;
    private fpathVcSetup: string

    constructor(p: UserParams) {
        this.userParams = p;
        this.fpathVcSetup =`./src/flows/output/vc.setup.${this.userParams.name}.json`
        this.vcSetupConfig = {
            ...p,
            css: `${urlServer}/`,
            webId: `${urlServer}/${p.name}/profile/card#me`
        }
    }

    async setup(){
        writeFileSync(this.fpathVcSetup,
            JSON.stringify(this.vcSetupConfig, null, 2))

        await runCommand('node', [
            './vc/dist/cli.js',
            'setup',
            '-m', 'solid',
            '-c', this.fpathVcSetup
        ])
    }
    async issue(fpathData: string, fpathOutput: string): Promise<any> {

        return await runCommand('node', [
            './vc/dist/cli.js',
            'issue',
            '-m', 'solid',
            '-c', this.fpathVcSetup,
            '-i', fpathData,
            '-o', fpathOutput
        ])


    }

}
async function main() {
    const program = new Command();

    program
        .requiredOption("--name <string>", "User's name")
        .requiredOption("--email <string>", "User's email")
        .requiredOption("--password <string>", "User's password")
        .requiredOption("--data <string>", "Path to data to upload")
        .requiredOption("--output <string>", "Path to resulting VC")
        .parse(process.argv);

    const options = program.opts();

    function validateEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate email
    if (!validateEmail(options.email)) {
        console.error("❌ Error: Invalid email format.");
        process.exit(1);
    }

    console.log("✅ CLI Input Received:");
    console.log("Name: ", options.name);
    console.log("Email:", options.email);
    console.log("Password:", "*".repeat(options.password.length)); // Mask password
    console.log("Path data:", options.data);
    console.log("Path output:", options.output);


    const vcProxy = new VCProxy({name: options.name, email: options.email, password: options.password,});
    await vcProxy.setup();
    await vcProxy.issue(options.data, options.output)



    //const vcData = fs.readFileSync(options.output, "utf8")

    // const buffer = await readFile(options.output);
    // const blob = new Blob([buffer as BlobPart], );
    // const writeResult = await writeDataToSolidPod(
    //     options.name,
    //     options.email,
    //     options.password,
    //     urlServer,
    //     blob
    // )
    // console.log({writeResult})




    try {
        /*await writeDataToSolidPod(
            options.name,
            options.email,
            options.password,
            urlServer,
            data
        );*/
    } catch (error) {
        console.error('Error during the process:', error);
    }
}

main().catch(console.error);