import FireFly, {FireFlyIdentityRequest} from "@hyperledger/firefly-sdk";
import {Command} from "commander";

async function main() {
  const program = new Command();

  program
    .requiredOption("--address <string>", "Key address")
    .requiredOption("--name <string>", "Identity name")
    .requiredOption("--parent <string>", "Parent UUID")
    .requiredOption("--webid <string>", "WebID")
    .requiredOption("--host <string>", "Host URL")
    .parse(process.argv);

  const {address, name, parent, webid, host} = program.opts()
  const namespace = "default"
  console.log(`
  Registering identity:
    name: ${name}
    webid: ${webid}
    address: ${address}
    parent: ${parent}
    host: ${host}
  `)
  try {
    const ffi = new FireFly({host, namespace});
    const idRequest: FireFlyIdentityRequest = {
      description: "no desc",
      key: address,
      name: name,
      parent: parent,
      profile: {
        webid: `http://localhost:3000/${name}/profile/card#me`
      },
      type: "custom"
    }
    const result = await ffi.createIdentity(idRequest)
    console.log('result')
    console.log(result)
  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().catch(console.error);

main().then().catch(console.error)
