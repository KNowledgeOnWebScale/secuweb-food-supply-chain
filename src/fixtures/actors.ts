import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ActorFixture = {
  name: string;
  displayName?: string;
  role?: string;
  did?: string;
  email: string;
  password: string;
};

export type ActorsMap = Record<string, ActorFixture>;

export const ACTORS_PATH = path.resolve(process.cwd(), "dev/fixtures/actors.json");

function parseActors(raw: string): ActorsMap {
  const actors = JSON.parse(raw) as ActorsMap;

  for (const [key, actor] of Object.entries(actors)) {
    if (!actor.name || !actor.email || !actor.password) {
      throw new Error(`Invalid actor fixture "${key}": expected name, email, and password`);
    }
    if (actor.name !== key) {
      throw new Error(`Invalid actor fixture "${key}": actor.name must match the fixture key`);
    }
  }

  return actors;
}

export async function loadActors(): Promise<ActorsMap> {
  return parseActors(await readFile(ACTORS_PATH, "utf8"));
}

export function loadActorsSync(): ActorsMap {
  return parseActors(readFileSync(ACTORS_PATH, "utf8"));
}

export function requireActor(actors: ActorsMap, actorName: string): ActorFixture {
  const actor = actors[actorName];
  if (!actor) {
    throw new Error(`No actor fixture found for: ${actorName}`);
  }
  return actor;
}

export function actorDid(actor: ActorFixture): string {
  return actor.did || `did:secuweb:${actor.name}`;
}

export function actorDisplayName(actor: ActorFixture): string {
  return actor.displayName || `${actor.name.charAt(0).toUpperCase()}${actor.name.slice(1)}`;
}

export function actorRole(actor: ActorFixture): string {
  return actor.role || actorDisplayName(actor);
}
