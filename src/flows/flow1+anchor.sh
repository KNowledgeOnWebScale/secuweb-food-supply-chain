#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# 1) run your existing flow (creates VC files + uploads to Solid)
src/flows/flow1.sh

# 2) pick the VC file you want to anchor (adjust if needed)
VC_PATH="src/flows/output/farmer/products/vc/product-x.jsonld"
SUBJECT_DID="${SUBJECT_DID:-did:secuweb:product:batch123}"
ANCHOR_REPO="${ANCHOR_REPO:-$(pwd)/secuweb-anchors}"

echo "Anchoring VC: $VC_PATH"
VC="$VC_PATH" SUBJECT_DID="$SUBJECT_DID" ANCHOR_REPO="$ANCHOR_REPO"   ./src/scripts/anchor.external.sh
