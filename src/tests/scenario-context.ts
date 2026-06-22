import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";

import { cssBaseUrl, resourceUrl, verifierBaseUrl } from "../config/runtime.js";
import { wrapper_createAuthenticatedFetch } from "../css/client-credentials.js";
import { loadActorsSync, requireActor } from "../fixtures/actors.js";
import type {
  AuthenticatedFetch,
  CredentialFixture,
  ScenarioContext,
  VerificationResponse,
} from "./scenario-types.js";

const actors = loadActorsSync();

export function isDeniedStatus(status: number): boolean {
  // A Solid server may hide an existing unauthorized resource behind 404.
  return status === 401 || status === 403 || status === 404;
}

export function asObject(value: unknown, label: string): Record<string, any> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} is not an object`);
  return value as Record<string, any>;
}

export function linkedIdentifier(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>)["@id"] === "string") {
    return (value as Record<string, string>)["@id"];
  }
  return undefined;
}

export function createContext(evidenceDir: string, repoRoot: string): ScenarioContext {
  const actorFetchPromises = new Map<string, Promise<AuthenticatedFetch>>();
  let originalCredentialPromise: Promise<CredentialFixture> | undefined;

  function getActorFetch(actorName: string): Promise<AuthenticatedFetch> {
    const existing = actorFetchPromises.get(actorName);
    if (existing) return existing;

    const actor = requireActor(actors, actorName);
    const authFetchPromise = wrapper_createAuthenticatedFetch(
      actor.name,
      actor.email,
      actor.password,
      cssBaseUrl
    );
    actorFetchPromises.set(actorName, authFetchPromise);
    return authFetchPromise;
  }

  async function fetchCredential(authFetch: AuthenticatedFetch, url: string): Promise<CredentialFixture> {
    const response = await authFetch(url, {
      method: "GET",
      headers: { accept: "application/ld+json, application/json" },
    });
    const text = await response.text();

    assert.equal(response.status, 200, `GET ${url} returned ${response.status}`);
    assert.match(
      response.headers.get("content-type") || "",
      /^application\/(ld\+)?json\b/,
      `GET ${url} did not return JSON-LD or JSON`
    );

    const credential = asObject(JSON.parse(text), `Credential at ${url}`);
    assert.ok(
      Array.isArray(credential.type) && credential.type.includes("VerifiableCredential"),
      `${url} did not return a Verifiable Credential`
    );
    assert.ok(credential.credentialSubject, `${url} has no credentialSubject`);

    return { response, text, credential };
  }

  async function fetchJsonResource(
    authFetch: AuthenticatedFetch,
    url: string,
    label: string
  ): Promise<Record<string, any>> {
    const response = await authFetch(url, {
      headers: { accept: "application/ld+json, application/json" },
    });
    const text = await response.text();
    assert.equal(response.status, 200, `${label} GET ${url} returned ${response.status}`);
    assert.match(
      response.headers.get("content-type") || "",
      /^application\/(ld\+)?json\b/,
      `${label} did not return JSON-LD or JSON`
    );
    return asObject(JSON.parse(text), label);
  }

  async function verifyOnChain(credential: Record<string, any>): Promise<VerificationResponse> {
    const response = await fetch(`${verifierBaseUrl}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verifiableCredential: credential }),
    });
    assert.equal(response.status, 200, `Verifier returned ${response.status}`);
    return await response.json() as VerificationResponse;
  }

  async function runVcCli(
    inputFile: string,
    configFile: string
  ): Promise<{ exitCode: number; output: string }> {
    const cliPath = path.join(repoRoot, "vc", "dist", "cli.js");
    const args = [
      cliPath,
      "verify",
      "--implementation",
      "solid",
      "--config-file",
      configFile,
      "--input-file",
      inputFile,
    ];

    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", (chunk) => { output += chunk.toString(); });
      child.stderr.on("data", (chunk) => { output += chunk.toString(); });
      child.on("error", reject);
      child.on("close", (code) => { resolve({ exitCode: code ?? 1, output: output.trim() }); });
    });
  }

  function getOriginalCredential(): Promise<CredentialFixture> {
    originalCredentialPromise ??= getActorFetch("packager")
      .then((packagerFetch) => fetchCredential(packagerFetch, resourceUrl("farmer", "products/vc/product-x.jsonld")));
    return originalCredentialPromise;
  }

  return {
    evidenceDir,
    repoRoot,
    isDeniedStatus,
    asObject,
    linkedIdentifier,
    getActorFetch,
    getOriginalCredential,
    fetchCredential,
    fetchJsonResource,
    verifyOnChain,
    runVcCli,
  };
}
