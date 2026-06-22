#!/usr/bin/env bash
# Anchor a VC
#
# Environment variables:
#   VC_PATH     - path to the VC file to anchor (preferred)
#   VC          - (optional) alternative env name for VC path; used if VC_PATH is unset
#   SUBJECT_DID - DID of the subject of the VC
#   ISSUER_DID  - DID recorded on-chain as the credential issuer (default: did:secuweb:consortium)
#   ACTOR       - issuing actor name; selects the per-actor signer (default: consortium)
#   ANCHOR_REPO - path to the anchor repository (default: <repo-root>/secuweb-anchors)
#   METADATA_URI - optional URI to store as VC metadata
#
# Usage:
#   VC_PATH=<path> SUBJECT_DID=<did> ACTOR=<actor> ISSUER_DID=<did> ANCHOR_REPO=<repo> ./src/flows/anchor.sh

set -euo pipefail

# Go to repo root
cd "$(dirname "$0")/../.."

# Defaults / env handling
ANCHOR_REPO="${ANCHOR_REPO:-$(pwd)/secuweb-anchors}"
VC="${VC_PATH:-${VC:-src/flows/output/farmer/products/vc/product-x.jsonld}}"
SUBJECT_DID="${SUBJECT_DID:-did:secuweb:product:batch123}"
METADATA_URI="${METADATA_URI:-}"
ACTOR="${ACTOR:-consortium}"
ISSUER_DID="${ISSUER_DID:-did:secuweb:consortium}"

echo "Anchoring VC: $VC"

# Absolutize VC relative to the current repo root
if [ -f "$VC" ]; then
  VC_ABS="$(cd "$(dirname "$VC")" && pwd)/$(basename "$VC")"
else
  echo "ERROR: VC not found at $VC" >&2
  exit 1
fi

# Check anchor repo
if [ ! -d "$ANCHOR_REPO" ]; then
  echo "ERROR: Anchor repo not found at $ANCHOR_REPO" >&2
  exit 1
fi

echo "[anchor] repo=$ANCHOR_REPO"
echo "[anchor] actor=$ACTOR"
echo "[anchor] issuerDid=$ISSUER_DID"
echo "[anchor] did=$SUBJECT_DID"
echo "[anchor] vc=$VC_ABS"
if [ -n "$METADATA_URI" ]; then
  echo "[anchor] metadata=$METADATA_URI"
fi

# Run Hardhat *inside* the submodule, passing absolute VC path
(
  cd "$ANCHOR_REPO"
  SUBJECT_DID="$SUBJECT_DID" VC="$VC_ABS" METADATA_URI="$METADATA_URI" \
  ACTOR="$ACTOR" ISSUER_DID="$ISSUER_DID" \
    npx hardhat run scripts/anchorVc.ts --network localhost
)