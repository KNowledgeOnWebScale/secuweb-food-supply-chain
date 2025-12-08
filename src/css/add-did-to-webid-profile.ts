
import { getAuthorizationToken, getClientCredentials, getAccessTokenAndDpopKey, createAuthenticatedFetch } from './client-credentials';
import { n3patch } from './n3';
import { Command } from "commander";

const urlServer = 'http://localhost:3000';
const urlAccount = `${urlServer}/.account/`;

async function addDIDToWebIDProfile(name: string, email: string, password: string, did: string) {
  console.log('STEP 1: obtain authorization token');
  const authorizationToken = await getAuthorizationToken(urlAccount, email, password);
  
  console.log('STEP 2: obtain client credentials');
  const clientCredentials = await getClientCredentials(urlServer, urlAccount, authorizationToken, name );

  console.log('STEP 3: obtain access token and DPoP key');
  const step3Output =  await getAccessTokenAndDpopKey(urlServer, clientCredentials);
  console.log(step3Output)

  console.log('STEP 4: obtain authenticated fetch');
  const authenticatedFetch = await createAuthenticatedFetch(step3Output.accessToken, step3Output.dpopKey);

  console.log('STEP 5: using authenticated fetch to get profile');
  const profileResponse = await authenticatedFetch(`${urlServer}/${name}/profile/card`);
  const profile = await profileResponse.text();
  console.log('Profile:', profile);

  console.log('STEP 6: updating profile by adding reference to another ID');
  const urlProfile = `${urlServer}/${name}/profile/card`
  const otherId = did
  await n3patch(
    authenticatedFetch,
    urlProfile,
    undefined,
    `<#me> owl:sameAs ${otherId} .`,
    undefined,
    {
      owl: 'http://www.w3.org/2002/07/owl#',
      did: 'https://www.w3.org/ns/did#'
    }
  );
  const updatedProfile = await (await fetch(urlProfile)).text()
  console.log('Updated Profile:', updatedProfile);
}

async function main() {
  const program = new Command();

  program
    .requiredOption("--name <string>", "User's name")
    .requiredOption("--email <string>", "User's email")
    .requiredOption("--password <string>", "User's password")
    .requiredOption("--did <string>", "DID to add to WebID profile")
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
  console.log("DID:", options.did);
  try {
    await addDIDToWebIDProfile(
      options.name,
      options.email,
      options.password,
      options.did);
  } catch (error) {
    console.error('Error during the process:', error);
  }
}

main().catch(console.error);