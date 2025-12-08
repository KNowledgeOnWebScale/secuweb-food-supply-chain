# src/scripts/anchor.external.sh
#!/usr/bin/env bash
set -euo pipefail

ANCHOR_REPO="${ANCHOR_REPO:-$(pwd)/secuweb-anchors}"
VC="${VC:-src/flows/output/farmer/products/vc/product-x.jsonld}"
SUBJECT_DID="${SUBJECT_DID:-did:secuweb:product:batch123}"
METADATA_URI="${METADATA_URI:-}"

# absolutize VC relative to the current repo root
if [ -f "$VC" ]; then
  VC_ABS="$(cd "$(dirname "$VC")" && pwd)/$(basename "$VC")"
else
  echo "ERROR: VC not found at $VC" >&2; exit 1
fi

if [ ! -d "$ANCHOR_REPO" ]; then
  echo "ERROR: Anchor repo not found at $ANCHOR_REPO" >&2; exit 1
fi

echo "[anchor] repo=$ANCHOR_REPO"
echo "[anchor] did=$SUBJECT_DID"
echo "[anchor] vc=$VC_ABS"

# Run Hardhat *inside* the submodule, passing absolute VC path
( cd "$ANCHOR_REPO" && \
  SUBJECT_DID="$SUBJECT_DID" VC="$VC_ABS" METADATA_URI="$METADATA_URI" \
  npx hardhat run scripts/anchorVc.ts --network localhost )