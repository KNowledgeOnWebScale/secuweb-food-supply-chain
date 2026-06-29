# NPM Scripts

This document describes the scripts in the repository root
[`package.json`](../package.json). Run them from the repository root.

Install the root dependencies before using individual scripts:

```bash
npm install
```

Some scripts also depend on the initialized `vc` and `secuweb-anchors`
submodules:

```bash
git submodule update --init --recursive
```

Pass arguments to an underlying script after `--`:

```bash
npm run <script> -- <arguments>
```

## Quick Reference

| Script | Purpose | Process behavior |
| --- | --- | --- |
| `build` | Compile the main TypeScript application into `build/`. | Exits |
| `pod` | Start the seeded Community Solid Server. | Runs until stopped |
| `scratch` | Run the scratch TypeScript entry point. | Currently unavailable |
| `scratch:dev` | Rebuild and rerun the scratch entry point on source changes. | Currently unavailable |
| `flows:create-vc` | Issue a Solid-backed verifiable credential from a JSON-LD file. | Exits |
| `flows:add-file-to-solid-pod` | Upload a file to an authenticated Pod container. | Exits |
| `flows:set-acl` | Grant an agent read access to a Pod resource. | Exits |
| `setup:actor-identities` | Bind actor WebIDs to their SecuWeb DIDs. | Exits |
| `setup:catalog` | Publish the public supply-chain resource catalog. | Exits |
| `setup:discoverability` | Publish Scenario Q/R discovery fixtures and ACLs. | Exits |
| `canon-hash` | Canonicalize and hash a VC. | Currently unavailable |
| `explore` | Print the local SecuWeb anchor-chain state. | Exits |
| `jsonld:expand` | Extract a credential-subject ID and Pod reference from a VC. | Exits |
| `test:readme-setup` | Run the complete non-viewer README smoke test. | Exits and stops services |
| `test:readme-setup:viewer` | Run the complete smoke test including Miravi. | Exits and stops services |
| `start:viewer` | Set up the complete demo and leave all services running. | Runs until stopped |
| `test:scenarios` | Run all defined scenario acceptance checks. | Exits |
| `scenario:ui` | Serve the latest scenario-test report. | Runs until stopped |

## Build and Development

### `npm run build`

Runs:

```text
tsc -p tsconfig.app.json
```

The compiled JavaScript is written to `build/`. Most command scripts invoke
this build automatically before running their entry point.

### `npm run scratch`

Intended to compile the application and execute `build/scratch.js`.

This script is currently unavailable because `src/scratch.ts` is not present,
so the build does not emit `build/scratch.js`.

### `npm run scratch:dev`

Intended to watch `src/` with Nodemon and rerun `npm run scratch` when a
TypeScript or JavaScript file changes.

This script has the same missing `src/scratch.ts` limitation as `scratch`.

## Local Services

### `npm run pod`

Starts a Community Solid Server using:

- configuration: `css/css.json`;
- seeded users: `css/css-users.json`;
- runtime data: `css/root`; and
- default URL: <http://localhost:3000>.

The process runs until interrupted. Remove `css/root` before starting it when
a clean seeded server is required:

```bash
rm -rf css/root
npm run pod
```

### `npm run start:viewer`

Runs the complete local setup and leaves these services available:

| Service | URL |
| --- | --- |
| Miravi viewer | <http://127.0.0.1:5173> |
| Community Solid Server | <http://127.0.0.1:3000> |
| Verifier service | <http://127.0.0.1:4444> |
| Hardhat JSON-RPC | <http://127.0.0.1:8545> |

The setup installs dependencies, clones and builds Miravi, resets and seeds
CSS, deploys the anchor contract, loads actor data, configures access,
publishes the catalog, anchors the VCs, and runs the initial scenario checks.

Keep the command running while using the viewer. Press `Ctrl+C` to stop all
services.

Supported options:

```bash
# Reuse already installed dependencies.
npm run start:viewer -- --skip-install

# Change the readiness timeout for each service.
npm run start:viewer -- --timeout 180
```

Logs and scenario evidence are written below
`local-run/readme-smoke/`.

## Flow Commands

The flow commands use the Solid server configured in
[`src/flows/config.ts`](../src/flows/config.ts), currently
`http://localhost:3000`.

### `npm run flows:create-vc`

Creates a verifiable credential from an input JSON-LD document through the
VC submodule's Solid implementation.

Required options:

| Option | Meaning |
| --- | --- |
| `--name` | Pod username |
| `--email` | Pod account email |
| `--password` | Pod account password |
| `--data` | Input JSON-LD file |
| `--output` | Output VC file |

Example:

```bash
npm run flows:create-vc -- \
  --name farmer \
  --email info@farmer.com \
  --password farmer123 \
  --data src/flows/data/farmer/products/product-x.jsonld \
  --output src/flows/output/farmer/products/vc/product-x.jsonld
```

Prerequisites:

- CSS is running;
- `vc` dependencies are installed; and
- `npm run build` has been run in `vc`.

### `npm run flows:add-file-to-solid-pod`

Authenticates as a Pod owner, creates the target container when necessary,
and uploads a file.

Required options:

| Option | Meaning |
| --- | --- |
| `--name` | Pod username |
| `--email` | Pod account email |
| `--password` | Pod account password |
| `--container` | Container path relative to the Pod root |
| `--inputFile` | Local file to upload |
| `--outputBasename` | Resource filename in the Pod |

Example:

```bash
npm run flows:add-file-to-solid-pod -- \
  --name farmer \
  --email info@farmer.com \
  --password farmer123 \
  --container products/vc \
  --inputFile src/flows/output/farmer/products/vc/product-x.jsonld \
  --outputBasename product-x.jsonld
```

### `npm run flows:set-acl`

Authenticates as a resource owner and grants one WebID read-only access to a
resource.

Required options:

| Option | Meaning |
| --- | --- |
| `--name` | Resource owner's Pod username |
| `--email` | Resource owner's account email |
| `--password` | Resource owner's account password |
| `--resourceUrl` | Absolute resource URL |
| `--webId` | Agent WebID receiving read access |

Example:

```bash
npm run flows:set-acl -- \
  --name farmer \
  --email info@farmer.com \
  --password farmer123 \
  --resourceUrl http://localhost:3000/farmer/products/vc/product-x.jsonld \
  --webId http://localhost:3000/packager/profile/card#me
```

## Identity, Catalog, and Discovery Setup

### `npm run setup:actor-identities`

Adds an `owl:sameAs` link from each actor WebID to its SecuWeb DID:

- Farmer;
- Transporter;
- Packager; and
- Retailer.

CSS must be running with the seeded demo accounts. Set `CSS_BASE_URL` to
target a server other than `http://localhost:3000`.

### `npm run setup:catalog`

Publishes a public JSON-LD supply-chain catalog at:

```text
http://localhost:3000/consortium/catalog/index.jsonld
```

The catalog lists the participants, their DIDs and service endpoints, and the
authoritative VC resources used by the demo. CSS must be running with the
seeded Consortium account.

Set `CSS_BASE_URL` to change the Solid server base URL.

### `npm run setup:discoverability`

Publishes the discoverability fixtures used by Scenario Q and Scenario R:

- Scenario Q governed shipment registration;
- Scenario Q governed shipment resource;
- Scenario R batch discovery entry point;
- Scenario R four actor manifests; and
- Scenario R eight manifest-listed domain resources.

The command rewrites fixture URLs from `http://localhost:3000` to
`CSS_BASE_URL` before upload and applies the fixture ACL grants through Solid's
access-control API. CSS must be running with the seeded demo accounts.

## Blockchain and JSON-LD Utilities

### `npm run explore`

Delegates to `npm run explore` in `secuweb-anchors` and prints the events and
state of the contract deployed on the local Hardhat network.

Prerequisites:

- Hardhat is running on port `8545`;
- the contract has been deployed; and
- `secuweb-anchors/cache/contract.json` identifies that deployment.

### `npm run jsonld:expand`

Expands a VC JSON-LD file and writes a small JSON document containing:

- `credentialSubjectId`; and
- `podRef`.

Usage:

```bash
npm run jsonld:expand -- <input-vc.jsonld> <output.json>
```

This utility is used by
[`register-products-and-shipments.sh`](../src/flows/register-products-and-shipments.sh)
before anchoring each credential.

### `npm run canon-hash`

Intended to canonicalize a VC as normalized N-Quads and calculate its SHA-256
digest.

Intended options:

```text
--vc <path>                 Required input VC
--outputCanonized <path>    Optional N-Quads output
--outputHash <path>         Optional hexadecimal digest output
```

This script is currently unavailable because `src/bc/canon-hash.ts` is not
included by `tsconfig.app.json`, while the npm command expects
`build/bc/canon-hash.js`.

## Tests and Reports

### `npm run test:readme-setup`

Runs the complete README setup as a smoke test:

1. installs root and `secuweb-anchors` dependencies;
2. starts a clean CSS instance;
3. starts Hardhat and deploys/registers the contract;
4. starts the verifier;
5. installs and builds `vc`;
6. creates and uploads actor VCs;
7. binds actor identities and publishes the catalog;
8. publishes discoverability fixtures for Scenarios Q and R;
9. anchors products, shipments, receipts, and transport events;
10. runs all defined scenario acceptance checks;
11. explores the chain and checks the verifier endpoint; and
12. stops all started services.

Options:

```bash
npm run test:readme-setup -- --skip-install
npm run test:readme-setup -- --timeout 180
```

The command does not update Git submodules. Initialize them before running it.

### `npm run test:readme-setup:viewer`

Runs the same smoke test as `test:readme-setup`, with these additional steps:

- clone and build the Miravi viewer;
- apply the SecuWeb viewer configuration;
- start Miravi on `127.0.0.1:5173`; and
- verify that the viewer port is reachable.

The command stops Miravi and all supporting services when the test completes.
Use `npm run start:viewer` for interactive use.

Options:

```bash
npm run test:readme-setup:viewer -- --skip-install
npm run test:readme-setup:viewer -- --timeout 180
```

### `npm run test:scenarios`

Runs the acceptance checks for all scenarios defined in catalogue version
`202606292322`. CSS, Hardhat, the verifier, VC files, identity bindings,
catalog, access rules, and anchors must already be set up for implementation
checks to pass. Missing capabilities for scenarios included in analysis are
recorded as explicit failures rather than omitted from the report. Scenarios
with `Include in Analysis = false` are skipped and excluded from coverage
metrics.

Supported environment variables:

| Variable | Default |
| --- | --- |
| `CSS_BASE_URL` | `http://localhost:3000` |
| `VERIFIER_BASE_URL` | `http://localhost:4444` |
| `SCENARIO_EVIDENCE_DIR` | `local-run/readme-smoke/scenarios` |
| `SCENARIO_OUTPUT_CACHE_DIR` | `local-run/readme-smoke/scenarios/output-cache/<run-id>` |

See [`doc/scenario-testing.md`](../doc/scenario-testing.md) for the
acceptance-check inventory.

### `npm run scenario:ui`

Starts the scenario-results dashboard at <http://127.0.0.1:4173>. It reads the
latest report on every refresh.

Supported environment variables:

| Variable | Default |
| --- | --- |
| `SCENARIO_UI_HOST` | `127.0.0.1` |
| `SCENARIO_UI_PORT` | `4173` |
| `SCENARIO_EVIDENCE_FILE` | `local-run/readme-smoke/scenarios/scenario-test-report.json` |

Example:

```bash
SCENARIO_UI_PORT=4174 npm run scenario:ui
```
