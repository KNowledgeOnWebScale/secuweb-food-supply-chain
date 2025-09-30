import { AuthorizationToken } from "./types";
import { ClientCredentials } from "./interfaces";
import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';

export async function getAuthorizationToken(
  urlAccount: string,
  email: string,
  password: string): Promise<AuthorizationToken> {
  // All these examples assume the server is running at `http://localhost:3000/`.

  // First we request the account API controls to find out where we can log in
  const indexResponse = await fetch(urlAccount);
  const { controls } = await indexResponse.json();
  // And then we log in to the account API
  const response = await fetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password}),
  });
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }
  // This authorization value will be used to authenticate in the next step
  const { authorization } = await response.json();
  
  return authorization;
}

export async function getClientCredentials(urlServer: string, urlAccount: string, authorization: AuthorizationToken, name: string): Promise<ClientCredentials> {
  // Now that we are logged in, we need to request the updated controls from the server.
  // These will now have more values than in the previous example.
  const indexResponse = await fetch(urlAccount, {
    headers: { authorization: `CSS-Account-Token ${authorization}` }
  });
  const { controls } = await indexResponse.json();

  // Here we request the server to generate a token on our account
  const response = await fetch(controls.account.clientCredentials, {
    method: 'POST',
    headers: { authorization: `CSS-Account-Token ${authorization}`, 'content-type': 'application/json' },
    // The name field will be used when generating the ID of your token.
    // The WebID field determines which WebID you will identify as when using the token.
    // Only WebIDs linked to your account can be used.
    body: JSON.stringify({ name: name, webId: `${urlServer}/${name}/profile/card#me` }),
  });

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!
  // The `resource` value can be used to delete the token at a later point in time.
  const { id, secret, resource } = await response.json();
  return { id, secret, resource };
}

export async function getAccessTokenAndDpopKey(urlServer: string, { id, secret }: ClientCredentials): Promise<any> {
  // A key pair is needed for encryption.
  // This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair();

  // These are the ID and secret generated in the previous step.
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.
  const tokenUrl = `${urlServer}/.oidc/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  });

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds,
  // which you can use to know when you need request a new Access token.
  const responseJSON = await response.json();
  const { access_token: accessToken } = responseJSON;
  return {accessToken, dpopKey};
}

export async function createAuthenticatedFetch(accessToken: any, dpopKey: any): Promise<any> {
  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.

  const authFetch = await buildAuthenticatedFetch(accessToken as string, { dpopKey  });
  // authFetch can now be used as a standard fetch function that will authenticate as your WebID.
  return authFetch
}

export async function wrapper_createAuthenticatedFetch(name: string, email: string, password: string, urlServer: string) {
    const urlAccount = `${urlServer}/.account/`;
    const authorizationToken = await getAuthorizationToken(urlAccount, email, password);
    const clientCredentials = await getClientCredentials(urlServer, urlAccount, authorizationToken, name);
    const step3Output = await getAccessTokenAndDpopKey(urlServer, clientCredentials);
    const authenticatedFetch = await createAuthenticatedFetch(step3Output.accessToken, step3Output.dpopKey);
    return authenticatedFetch
}