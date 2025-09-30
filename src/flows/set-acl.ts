
import {wrapper_createAuthenticatedFetch} from "../css/client-credentials";
import { Command } from "commander";
import { createContainer, addFileToContainer } from "../css/helpers";


import { universalAccess } from "@inrupt/solid-client";


const urlServer = 'http://localhost:3000';

/**
 * Add a file to a Solid Pod container, creating the container if it does not exist.
 */
async function main() {
  const program = new Command();

  program
    .description('Add a file to a Solid Pod container, creating the container if it does not exist.')
    .requiredOption("--name <string>", "User's name")
    .requiredOption("--email <string>", "User's email")
    .requiredOption("--password <string>", "User's password")
    .requiredOption("--resourceUrl <string>", "URL to resource")
    .requiredOption("--webId <string>", "WebID that will be granted read access")
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
    const {name: username, email, password, resourceUrl, webId} = options;
    console.log('🔐 createAuthenticatedFetch')
    const authFetch = await wrapper_createAuthenticatedFetch(username, email, password, urlServer);

    const am = {
      read: true,
      append: false,
      write: false,
    }
    console.log(`[!] Granting ${webId} read access to ${resourceUrl}`);
    await universalAccess.setAgentAccess(resourceUrl, webId, am, {fetch: authFetch});

  } catch (error) {
    console.error('❌ Error during the process:', error);
  }
}

main().catch(console.error);