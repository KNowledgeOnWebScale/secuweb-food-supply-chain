import { wrapper_createAuthenticatedFetch } from "../css/client-credentials";
import { n3patch } from "../css/n3";
import { cssBaseUrl, webId } from "../config/runtime";
import { actorDid, loadActors } from "../fixtures/actors";

type ActorIdentity = {
  name: string;
  email: string;
  password: string;
  did: string;
};

async function bindActorIdentity(actor: ActorIdentity): Promise<void> {
  const actorWebId = webId(actor.name);
  const profileUrl = actorWebId.replace("#me", "");
  const authFetch = await wrapper_createAuthenticatedFetch(
    actor.name,
    actor.email,
    actor.password,
    cssBaseUrl
  );

  await n3patch(
    authFetch,
    profileUrl,
    undefined,
    `<${actorWebId}> <http://www.w3.org/2002/07/owl#sameAs> <${actor.did}> .`
  );

  console.log(`Bound ${actorWebId} to ${actor.did}`);
}

async function main(): Promise<void> {
  const actorIdentities = Object.values(await loadActors())
    .filter((actor) => actor.name !== "consortium")
    .map((actor) => ({
      name: actor.name,
      email: actor.email,
      password: actor.password,
      did: actorDid(actor),
    }));

  for (const actor of actorIdentities) {
    await bindActorIdentity(actor);
  }
}

main().catch((error) => {
  console.error("Failed to bind actor identities:", error);
  process.exitCode = 1;
});
