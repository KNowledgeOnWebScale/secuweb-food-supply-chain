import { createServer, type ServerResponse } from "node:http";
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

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

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

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);

  if (request.method !== "GET") {
    send(response, 405, "text/plain; charset=utf-8", "Method not allowed");
    return;
  }

  if (requestUrl.pathname === "/api/results") {
    await serveReport(response);
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
});

server.listen(port, host, () => {
  console.log(`Scenario results UI: http://${host}:${port}`);
  console.log(`Reading report: ${reportPath}`);
});
