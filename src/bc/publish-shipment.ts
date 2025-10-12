import {Command} from "commander";
import fs from 'fs'
import {broadcastMessage} from "./messaging";

async function main() {
  const program = new Command();

  program
    .requiredOption("--address <string>", "Key address of the sender/author.")
    .requiredOption("--did <string>", "DID of the sender/author.")
    .requiredOption("--fpathPayload <string>", "Path to payload of the message.")
    .parse(process.argv);

  const {address, did, fpathPayload } = program.opts()
  const tag = 'shipment-issued';
  const topic = 'shipment'
  const payload = fs.readFileSync(fpathPayload, 'utf8')
  try {
    console.log('publishing shipment…')
    await broadcastMessage(did, address, tag, topic, payload)
  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().then().catch(console.error)
