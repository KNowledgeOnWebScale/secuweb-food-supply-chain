#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANCHOR_REPO="${ANCHOR_REPO:-$REPO_ROOT/secuweb-anchors}"
DID="${SUBJECT_DID:?usage: SUBJECT_DID=... VC=... $0}"
VC_IN="${VC:?usage: SUBJECT_DID=... VC=... $0}"

TMP=""
cleanup(){ [ -n "$TMP" ] && rm -f "$TMP"; }
trap cleanup EXIT

case "$VC_IN" in
  http://*|https://*)
    TMP="$(mktemp)"
    echo "[verify.one] fetching $VC_IN → $TMP"
    curl -fsSL "$VC_IN" -o "$TMP"
    VC_LOCAL="$TMP"
    ;;
  *)
    VC_LOCAL="$VC_IN"
    ;;
esac

[ -f "$VC_LOCAL" ] || { echo "VC not found: $VC_LOCAL" >&2; exit 1; }

( cd "$ANCHOR_REPO" &&   SUBJECT_DID="$DID" VC="$VC_LOCAL"   npm run verify:vc --silent )
