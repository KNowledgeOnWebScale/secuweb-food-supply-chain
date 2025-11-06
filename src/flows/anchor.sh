#!/usr/bin/env bash
# Anchor a VC
# Environment variables:
#   VC_PATH - path to the VC file to anchor
#   SUBJECT_DID - DID of the subject of the VC
#   ANCHOR_REPO - path to the anchor repository (default: secuweb-anchors)
# Usage:
#   VC_PATH=<path> SUBJECT_DID=<did> ANCHOR_REPO=<repo> ./src/flows/anchor.sh

set -euo pipefail
cd "$(dirname "$0")/../.."

ANCHOR_REPO="${ANCHOR_REPO:-$(pwd)/secuweb-anchors}"

echo "Anchoring VC: $VC_PATH"
VC="$VC_PATH" SUBJECT_DID="$SUBJECT_DID" ANCHOR_REPO="$ANCHOR_REPO"   ./src/scripts/anchor.external.sh
