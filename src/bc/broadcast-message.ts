import {Command} from "commander";
import fs from 'fs'
import {broadcastMessage} from "./messaging";

async function main() {
  const program = new Command();

  program
    .requiredOption("--address <string>", "Key address of the sender/author.")
    .requiredOption("--did <string>", "DID of the sender/author.")
    .requiredOption("--fpathPayload <string>", "Path to payload of the message.")
    .requiredOption("--tag <string>",
      "Message tag." +
      "The message tag indicates the purpose of the message to the applications that process it." +
      "The tag should tell the apps receiving the broadcast (including the local app), what to do when it receives the message. Its the reason for the broadcast - an application specific type for the message.")
    .requiredOption("--topic <string>",
      "Message topic. \n" +
      "A message topic associates this message with an ordered stream of data. A custom topic should be assigned - using the default topic is discouraged." +
      "A topic should be something like a well known identifier that relates to the information you are publishing. It is used as an ordering context, so all broadcasts on a given topic are assured to be processed in order.")
    .parse(process.argv);

  const {address, did, fpathPayload, tag, topic } = program.opts()
  const payload = fs.readFileSync(fpathPayload, 'utf8')
  try {
    console.log('broadcasting message…')
    await broadcastMessage(did, address, tag, topic, payload)
  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().then().catch(console.error)
