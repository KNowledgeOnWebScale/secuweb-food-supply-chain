import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";

import { cssBaseUrl, resourceUrl, verifierBaseUrl } from "../config/runtime.js";
import { wrapper_createAuthenticatedFetch } from "../css/client-credentials.js";
import { loadActorsSync, requireActor } from "../fixtures/actors.js";
import type {
  AuthenticatedFetch,
  CacheOutputOptions,
  CredentialFixture,
  ExplorerData,
  ScenarioCacheWrite,
  ScenarioContext,
  VerificationResponse,
} from "./scenario-types.js";

const actors = loadActorsSync();

/** Returns whether an HTTP status represents denied access for scenario checks. */
export function isDeniedStatus(status: number): boolean {
  // A Solid server may hide an existing unauthorized resource behind 404.
  return status === 401 || status === 403 || status === 404;
}

/** Asserts that an unknown JSON value is a non-array object and returns it. */
export function asObject(value: unknown, label: string): Record<string, any> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} is not an object`);
  return value as Record<string, any>;
}

/** Extracts a linked identifier from either a string value or an object with @id. */
export function linkedIdentifier(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>)["@id"] === "string") {
    return (value as Record<string, string>)["@id"];
  }
  return undefined;
}

/** Creates a filesystem-safe artifact name component. */
function safeArtifactName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "output";
}

/** Converts response headers into plain JSON evidence. */
function headersObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

/** Parses JSON response bodies while preserving non-JSON bodies as text. */
function parseJsonIfPossible(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Builds a stable relative cache path for fetched resources. */
function fetchArtifactName(prefix: string, url: string, counter: number): string {
  let label = url;
  try {
    const parsedUrl = new URL(url);
    label = `${parsedUrl.host}${parsedUrl.pathname}`;
  } catch {
    // Keep the original value if it is not a URL.
  }
  return path.join("fetches", `${counter}-${prefix}-${safeArtifactName(label)}.json`);
}

/** Creates the shared helper context used by all scenario checks. */
export function createContext(
  evidenceDir: string,
  outputCacheDir: string,
  repoRoot: string,
  cacheOutput: (name: string, value: unknown, options?: CacheOutputOptions) => Promise<ScenarioCacheWrite>
): ScenarioContext {
  const actorFetchPromises = new Map<string, Promise<AuthenticatedFetch>>();
  let originalCredentialPromise: Promise<CredentialFixture> | undefined;
  let fetchCounter = 0;
  let verificationCounter = 0;
  let explorerCounter = 0;
  let vcCliCounter = 0;

  /** Returns a cached authenticated fetch implementation for a configured actor. */
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

  /** Fetches and validates a Verifiable Credential resource from a Solid URL. */
  async function fetchCredential(authFetch: AuthenticatedFetch, url: string): Promise<CredentialFixture> {
    const response = await authFetch(url, {
      method: "GET",
      headers: { accept: "application/ld+json, application/json" },
    });
    const text = await response.text();
    await cacheOutput(fetchArtifactName("credential", url, ++fetchCounter), {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: headersObject(response.headers),
      body: parseJsonIfPossible(text),
    }, {
      contentType: "application/json",
      label: `GET credential ${url}`,
    });

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

  /** Fetches and validates a generic JSON-LD resource from a Solid URL. */
  async function fetchJsonResource(
    authFetch: AuthenticatedFetch,
    url: string,
    label: string
  ): Promise<Record<string, any>> {
    const response = await authFetch(url, {
      headers: { accept: "application/ld+json, application/json" },
    });
    const text = await response.text();
    await cacheOutput(fetchArtifactName("resource", url, ++fetchCounter), {
      label,
      url,
      status: response.status,
      statusText: response.statusText,
      headers: headersObject(response.headers),
      body: parseJsonIfPossible(text),
    }, {
      contentType: "application/json",
      label: `${label} GET ${url}`,
    });
    assert.equal(response.status, 200, `${label} GET ${url} returned ${response.status}`);
    assert.match(
      response.headers.get("content-type") || "",
      /^application\/(ld\+)?json\b/,
      `${label} did not return JSON-LD or JSON`
    );
    return asObject(JSON.parse(text), label);
  }

  /** Sends a credential to the verifier service and returns its verification response. */
  async function verifyOnChain(credential: Record<string, any>): Promise<VerificationResponse> {
    const response = await fetch(`${verifierBaseUrl}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verifiableCredential: credential }),
    });
    const text = await response.text();
    await cacheOutput(`verifier/verify-${++verificationCounter}.json`, {
      url: `${verifierBaseUrl}/verify`,
      status: response.status,
      statusText: response.statusText,
      headers: headersObject(response.headers),
      request: { verifiableCredential: credential },
      body: parseJsonIfPossible(text),
    }, {
      contentType: "application/json",
      label: `Verifier response ${verificationCounter}`,
    });
    assert.equal(response.status, 200, `Verifier returned ${response.status}`);
    return JSON.parse(text) as VerificationResponse;
  }

  /** Retrieves the verifier explorer data used by blockchain-related checks. */
  async function getExplorerData(): Promise<ExplorerData> {
    const response = await fetch(`${verifierBaseUrl}/explorer/data`);
    const text = await response.text();
    await cacheOutput(`verifier/explorer-data-${++explorerCounter}.json`, {
      url: `${verifierBaseUrl}/explorer/data`,
      status: response.status,
      statusText: response.statusText,
      headers: headersObject(response.headers),
      body: parseJsonIfPossible(text),
    }, {
      contentType: "application/json",
      label: `Verifier explorer data ${explorerCounter}`,
    });
    assert.equal(response.status, 200, `Explorer returned ${response.status}`);
    return JSON.parse(text) as ExplorerData;
  }

  /** Runs the VC command-line verifier and captures its exit code and output. */
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

    const result = await new Promise<{ exitCode: number; output: string }>((resolve, reject) => {
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

    await cacheOutput(`vc-cli/run-${++vcCliCounter}.json`, {
      command: [process.execPath, ...args],
      cwd: repoRoot,
      inputFile,
      configFile,
      exitCode: result.exitCode,
      output: result.output,
    }, {
      contentType: "application/json",
      label: `VC CLI run ${vcCliCounter}`,
    });

    return result;
  }

  /** Fetches the Farmer product credential through the Packager actor once per run. */
  function getOriginalCredential(): Promise<CredentialFixture> {
    originalCredentialPromise ??= getActorFetch("packager")
      .then((packagerFetch) => fetchCredential(packagerFetch, resourceUrl("farmer", "products/vc/product-x.jsonld")));
    return originalCredentialPromise;
  }

  return {
    evidenceDir,
    outputCacheDir,
    repoRoot,
    cacheOutput,
    isDeniedStatus,
    asObject,
    linkedIdentifier,
    getActorFetch,
    getOriginalCredential,
    fetchCredential,
    fetchJsonResource,
    verifyOnChain,
    getExplorerData,
    runVcCli,
  };
}
