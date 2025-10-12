import {Command} from "commander";
import fs from 'fs'
import {fetchMessage} from "./messaging";
import {log} from "../util/log";

async function main() {
  const program = new Command();

  program
    .requiredOption("--did <string>", "DID of the sender/author.")
    .parse(process.argv);

  const { did } = program.opts()
  const tag = 'shipment-issued';
  const topic = 'shipment'

  try {
    console.log(`fetching shipment from author: ${did}; with tag ${tag}; on topic ${topic} …`)
    const messages = await fetchMessage(tag, topic, did)
    console.log('messages:');
    log(messages)
  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().then().catch(console.error)
