
import {wrapper_createAuthenticatedFetch} from "../css/client-credentials";
import { Command } from "commander";
import { createContainer, addFileToContainer } from "../css/helpers";

const urlServer = 'http://localhost:3000';

async function main() {
  const program = new Command();

  program
    .requiredOption("--name <string>", "User's name")
    .requiredOption("--email <string>", "User's email")
    .requiredOption("--password <string>", "User's password")
    .requiredOption("--container <string>", "Path to container, relative to the user's pod root")
    .requiredOption("--inputFile <string>", "Path to input file")
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
  
  try {
    const {name: username, email, password, container, inputFile} = options;
    console.log('🔐 createAuthenticatedFetch')
    const authFetch = await wrapper_createAuthenticatedFetch(username, email, password, urlServer);
    const urlPod = `${urlServer}/${username}`
    const urlContainer = `${urlPod}/${container}/`    
    await createContainer(urlContainer, authFetch)
    await addFileToContainer(urlContainer, inputFile, authFetch);

  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().catch(console.error);