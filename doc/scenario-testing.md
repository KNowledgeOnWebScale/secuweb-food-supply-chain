# Scenario Tests

The acceptance runner covers every scenario in SecuWeb scenario catalogue
version `202606292322`, from Scenario A through Scenario V.

Coverage and successful implementation are separate concerns:

- every defined scenario must produce at least one result;
- implemented capabilities should pass;
- runnable checks for missing capabilities should fail with concrete evidence
  about the missing resource, policy, log, endpoint, or definition; and
- one check contributes evidence to exactly one scenario.

The scenario catalogue also defines `Include in Analysis`. Scenarios with this
flag set to `false` are still represented in the report for traceability, but
their checks are skipped and excluded from coverage metrics, the assurance
matrix counts, and strict-mode failure decisions.

Trust (`TR`) is treated as a proxy design goal. TR scenarios therefore carry
dependency semantics that identify which non-TR design-goal evidence they rely
on:

| TR scenario | Primary dependency | Secondary dependency |
| --- | --- | --- |
| B - TR x Verifiability | DS via A | -- |
| E - TR x Auditability | DS via C | DG via D |
| I - TR x Authentication | DS via G | DG via Q |
| M - TR x Authorization | DS via K | DG via Q |

## Skip Category Codes

Skipped checks are categorized because they do not all mean the same thing. The
JSON report stores the category in `skipCategory`; the dashboard and copied
assurance matrix use the shorter matrix code.

| Matrix code | `skipCategory` | Description | Evaluation meaning |
| --- | --- | --- | --- |
| `FA` | `feature-absent` | Required architectural feature is absent. | The scenario identifies a capability gap in the demonstrator, such as a missing audit log or policy-decision evidence source. |
| `PI` | `pending-implementation` | Implementable check has not been implemented yet. | The scenario is expected to be testable in the current architecture, but fixture or test work is still pending. |
| `US` | `under-specified` | Scenario needs sharper acceptance criteria. | The scenario should be refined before an executable check can provide meaningful evidence. |
| `EX` | `excluded-from-analysis` | Scenario catalogue excludes this check from coverage metrics. | The scenario is represented for traceability, but is not counted in coverage metrics, assurance matrix totals, or strict-mode failure decisions. |
| `UNK` | `unknown` | Skip category was missing or not recognized. | Treat this as a report metadata issue; the skipped check should be assigned one of the explicit categories above. |

## Test Catalogue

| Check | Scenario | Acceptance criterion | Current expectation |
| --- | --- | --- | --- |
| `A-1` | A | The Farmer VC anchor is signed by the `did:secuweb:farmer` cryptographic identity. | May pass |
| `A-2` | A | The Farmer WebID-DID binding and product-origin control or accreditation assertion are verifiable. | Skipped: feature absent |
| `B-1` | B | The unchanged Farmer VC matches its on-chain commitment. | May pass |
| `B-2` | B | A modified Farmer VC does not match an on-chain commitment. | May pass |
| `C-1` | C | The Farmer inspects recorded read and update operations for shared data. | Skipped: feature absent |
| `D-1` | D | An auditor correlates a governance rule, access decision, and actor. | Skipped: feature absent |
| `E-1` | E | The unchanged Farmer VC passes signature verification. | May pass |
| `E-2` | E | A modified Farmer VC fails signature verification. | May pass |
| `F-1` | F | A compliance package contains controller, recipient, policy, log, and resource evidence. | Skipped: feature absent |
| `G-1` | G | The authenticated Farmer can inspect its resource ACL. | May pass |
| `G-2` | G | Another authenticated actor cannot change the Farmer ACL. | May pass |
| `H-1` | H | A governance rule identifies its issuer and governed action. | Excluded from analysis |
| `I-1` | I | The VC issuer WebID resolves to its actor DID. | May pass |
| `I-2` | I | The Farmer DID is registered on-chain with the Farmer address as controller. | May pass |
| `J-1` | J | A compliance operation identifies the responsible actor. | Skipped: feature absent |
| `K-1` | K | The authorized Packager can read the Farmer product. | May pass |
| `K-2` | K | The unauthorized Transporter cannot read the Farmer product. | May pass |
| `L-1` | L | An explicit governance rule agrees with runtime authorization. | Excluded from analysis |
| `M-1` | M | An auditor can verify the policy basis of an access decision. | Skipped: feature absent |
| `N-1` | N | Anonymous and unrelated actors cannot read confidential data. | May pass |
| `N-2` | N | The shared credential states its permitted processing purpose. | Skipped: pending implementation |
| `N-3` | N | The Packager view retains source product weight while removing source-only location and farm-lot fields. | May pass after fixture setup publishes the minimized product view |
| `O-1` | O | A query selects only five permitted fields for matching events from one Transporter Pod. | May pass |
| `P-1` | P | One query joins shipment, event, and receipt facts across four actor Pods. | May pass |
| `Q-1` | Q | A governed registration resolves one shipment identifier to its authoritative resource. | May pass after `setup:discoverability` |
| `R-1` | R | One entry point discovers four manifests and eight registered resources. | May pass after `setup:discoverability` |
| `S-1` | S | A uniform domain-data API pattern retrieves supply-chain resources from three actor data stores. | May pass |
| `T-1` | T | Verification evidence for retrieved domain data is available through a uniform API pattern aligned with domain-data access. | Expected failure: no uniform verification-evidence API |
| `U-1` | U | Product-shipment fixtures expose stable Web identifiers and shared semantic vocabularies across actors. | May pass |
| `U-2` | U | Representative supply-chain event resources declare EPCIS vocabulary usage through `epcis:ObjectEvent`, `epcis:bizStep`, and `epcis:disposition`. | Expected failure: transporter event fixtures still lack EPCIS vocabulary usage |
| `V-1` | V | The governance model accredits the Farmer to issue product-origin data. | May pass |

The runner validates that the result set contains all 22 catalogue scenario
identifiers and that every included scenario has at least one included result.
An omitted scenario therefore fails the test run as a framework error.

## Running Tests

Run the checks as part of the complete local setup:

```bash
npm run test:readme-setup
```

When CSS, Hardhat, the verifier service, actor data, and anchors are already
running, execute only the scenario checks:

```bash
npm run test:scenarios
```

The runner writes machine-readable evidence and generated VC fixtures to:

```text
local-run/readme-smoke/scenarios/
```

The canonical report is:

```text
local-run/readme-smoke/scenarios/scenario-test-report.json
```

For compatibility with older tooling, the runner also writes the same payload
to `local-run/readme-smoke/scenarios/initial-scenarios-report.json`.

The report includes:

- the scenario-catalogue version;
- all defined, covered, analysis-included, and excluded scenario identifiers;
- analysis-only passed, failed, and skipped counts;
- the number of excluded checks; and
- a description, observed detail, timing metadata, and output-cache paths for
  every check.

Skipped checks include `skipCategory` and `skipReason`, and the aggregate report
includes `skippedByCategory`. The dashboard matrix renders cells as
`passed/failed/total [skip-code:count]` when skipped checks are present.
Scenarios excluded by `Include in Analysis = false` are rendered as `EX` where
they appear in the catalogue matrix and are not included in aggregate metrics.

Each scenario run also caches per-check outputs under:

```text
local-run/readme-smoke/scenarios/output-cache/<run-id>/<check-id>/
```

Every check directory contains `result.json` and `detail.txt`. Checks that use
shared framework helpers also cache fetched Solid resources, verifier
responses, explorer responses, and VC CLI outputs as structured artifacts. The
aggregate report records the cache root as `outputCacheRoot` and each check's
cache metadata under `outputCache`.

By default, `npm run test:scenarios` exits unsuccessfully when any non-skipped
scenario check fails. Set `SCENARIO_TEST_STRICT=false` to collect the full JSON
report without failing the process on scenario-level failures.

## Results Dashboard

After a scenario run, start the local results dashboard:

```bash
npm run scenario:ui
```

Open <http://127.0.0.1:4173>. The dashboard reads the latest JSON report on
each refresh and provides status filtering, search, and expandable evidence.

Set `SCENARIO_UI_PORT` to use another port, or set
`SCENARIO_EVIDENCE_FILE` to display a different report.
