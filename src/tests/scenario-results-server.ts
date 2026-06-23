import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const host = process.env.SCENARIO_UI_HOST || "127.0.0.1";
const port = Number.parseInt(process.env.SCENARIO_UI_PORT || "4173", 10);
const repoRoot = process.cwd();
const staticDir = path.join(repoRoot, "web", "scenario-results");
const reportPath = path.resolve(
  process.env.SCENARIO_EVIDENCE_FILE ||
    path.join(
      repoRoot,
      "local-run",
      "readme-smoke",
      "scenarios",
      "scenario-test-report.json"
    )
);
const evidenceRoot = path.dirname(reportPath);

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

/** Sends an HTTP response with consistent security and cache headers. */
function send(
  response: ServerResponse,
  status: number,
  contentType: string,
  body: string | Buffer
): void {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

/** Serves the latest scenario JSON report or a structured not-found response. */
async function serveReport(response: ServerResponse): Promise<void> {
  try {
    const report = await readFile(reportPath);
    send(response, 200, "application/json; charset=utf-8", report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(
      response,
      404,
      "application/json; charset=utf-8",
      JSON.stringify({
        error: "Scenario report not found",
        detail: message,
        reportPath,
      })
    );
  }
}

/** Resolves a requested cached-output path while keeping access inside the evidence directory. */
function resolveOutputPath(outputPath: string): string {
  const resolvedPath = path.resolve(repoRoot, outputPath);
  const relativeToEvidenceRoot = path.relative(evidenceRoot, resolvedPath);

  if (
    relativeToEvidenceRoot.startsWith("..") ||
    path.isAbsolute(relativeToEvidenceRoot)
  ) {
    throw new Error(`Output path is outside the scenario evidence directory: ${outputPath}`);
  }

  return resolvedPath;
}

/** Serves one cached scenario-output file as inert text for dashboard display. */
async function serveOutput(requestUrl: URL, response: ServerResponse): Promise<void> {
  const outputPath = requestUrl.searchParams.get("path");
  if (!outputPath) {
    send(
      response,
      400,
      "application/json; charset=utf-8",
      JSON.stringify({ error: "Missing required query parameter: path" })
    );
    return;
  }

  try {
    const resolvedPath = resolveOutputPath(outputPath);
    const output = await readFile(resolvedPath, "utf8");
    send(response, 200, "text/plain; charset=utf-8", output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(
      response,
      404,
      "application/json; charset=utf-8",
      JSON.stringify({
        error: "Scenario output not found",
        detail: message,
        outputPath,
      })
    );
  }
}

/** Routes dashboard HTTP requests to the API, health endpoint, or static assets. */
async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);

  if (request.method !== "GET") {
    send(response, 405, "text/plain; charset=utf-8", "Method not allowed");
    return;
  }

  if (requestUrl.pathname === "/api/results") {
    await serveReport(response);
    return;
  }

  if (requestUrl.pathname === "/api/output") {
    await serveOutput(requestUrl, response);
    return;
  }

  if (requestUrl.pathname === "/health") {
    send(
      response,
      200,
      "application/json; charset=utf-8",
      JSON.stringify({ status: "ok", reportPath })
    );
    return;
  }

  const staticFile = staticFiles.get(requestUrl.pathname);
  if (!staticFile) {
    send(response, 404, "text/plain; charset=utf-8", "Not found");
    return;
  }

  const [fileName, contentType] = staticFile;
  try {
    const contents = await readFile(path.join(staticDir, fileName));
    send(response, 200, contentType, contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(response, 500, "text/plain; charset=utf-8", message);
  }
}

const server = createServer(handleRequest);

server.listen(port, host, () => {
  console.log(`Scenario results UI: http://${host}:${port}`);
  console.log(`Reading report: ${reportPath}`);
});
