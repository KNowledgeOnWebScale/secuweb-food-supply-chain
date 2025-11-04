#!/usr/bin/env bash
set -euo pipefail
if [ -f "env/.env" ]; then . env/.env; fi
banner(){ printf '\n== %s ==\n' "$*"; }
die(){ echo "ERROR: $*" >&2; exit 1; }
need(){ command -v "$1" >/dev/null || die "Missing $1"; }
req(){ [ -n "${!1-}" ] || die "Missing env: $1"; }
bytes(){ wc -c < "$1" | tr -d ' '; }
need node; need npx; need jq
req VC_LIB; req VC_MODE; req VC_CONFIG; req VC_UNSIGNED
export VC_OUT="${VC_OUT:-$PWD/data/vcs/issued-external.jsonld}"
mkdir -p "$(dirname "$VC_OUT")"
