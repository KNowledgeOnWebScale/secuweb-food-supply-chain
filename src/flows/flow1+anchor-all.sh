#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# 1) Run existing flow (issues and uploads VCs)
src/flows/flow1.sh

# 2) Anchor all VCs found under src/flows/output/**/vc/*.jsonld
./src/scripts/anchor-all.sh
