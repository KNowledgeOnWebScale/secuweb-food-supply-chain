
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
    const result = await addFileToContainer(urlContainer, inputFile, authFetch);
    const { sourceIri } = result.internal_resourceInfo
    console.log(`✅ File added to Solid Pod: ${sourceIri}`);
    

    console.log(`🔐 Setting public read access to ${sourceIri}`);
    const am = {
      read: true,
      append: false,
      write: false,
    }
    const resultPublicAccess = await universalAccess.setPublicAccess(sourceIri, am, { fetch: authFetch });
    console.log('✅ Public access set:', resultPublicAccess);

  } catch (error) {
    console.error('❌ Error during the process:', error);
  }
}

main().catch(console.error);