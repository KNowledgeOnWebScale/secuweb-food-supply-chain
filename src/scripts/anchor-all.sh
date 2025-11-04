#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANCHOR_REPO="${ANCHOR_REPO:-$REPO_ROOT/secuweb-anchors}"
SUBJECT_DID_BASE="${SUBJECT_DID_BASE:-did:secuweb}"
METADATA_URI="${METADATA_URI:-}"

# Build a null-delimited list of VC paths (handles spaces safely)
VC_LIST="$(mktemp)"
trap 'rm -f "$VC_LIST"' EXIT
find "$REPO_ROOT/src/flows/output" -type f -path '*/vc/*.jsonld' -print0 > "$VC_LIST"

# Count and exit early if none
TOTAL="$(tr -cd '\0' < "$VC_LIST" | wc -c | tr -d ' ')"
if [ "$TOTAL" -eq 0 ]; then
  echo "No VC files found under src/flows/output/**/vc/*.jsonld" >&2
  exit 1
fi
echo "[batch] Found $TOTAL VC files to anchor"

i=0
# Read each VC path (null-delimited)
while IFS= read -r -d '' VC_PATH; do
  i=$((i+1))

  # Absolute path for safety (we cd into submodule)
  VC_ABS="$(cd "$(dirname "$VC_PATH")" && pwd)/$(basename "$VC_PATH")"

  # Derive DID if not provided
  if [ -z "${SUBJECT_DID:-}" ]; then
    rel="${VC_ABS#"$REPO_ROOT/"}"
    slug="$(echo "$rel" | sed 's#[/ ]#-#g' | sed 's#[^A-Za-z0-9:_-]#_#g')"
    DID="${SUBJECT_DID_BASE}:${slug}"
  else
    DID="$SUBJECT_DID"
  fi

  echo "[$i/$TOTAL] Anchoring $VC_ABS (DID=$DID)"
  VC="$VC_ABS" SUBJECT_DID="$DID" METADATA_URI="$METADATA_URI" \
    "$REPO_ROOT/src/scripts/anchor.external.sh"
done < "$VC_LIST"

echo "[batch] Done."