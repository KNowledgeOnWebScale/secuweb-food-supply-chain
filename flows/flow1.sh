#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
. flows/lib/flow.base.sh
banner "00) Setup via vc-prototyping-library"
npx hardhat run adapters/vc.setup.external.ts --network localhost
banner "01) Issue VC via external library"
npx hardhat run adapters/vc.issue.external.ts --network localhost
echo "VC_OUT: $VC_OUT"
echo "VC bytes: $(bytes "$VC_OUT")"
banner "02) Verify VC via external library"
VC="$VC_OUT" npx hardhat run adapters/vc.verify.external.ts --network localhost
banner "03) Anchor VC hash on chain (runs inside ./secuweb-anchors)"
SUBJECT_DID="${SUBJECT_DID:-did:secuweb:product:batch123}" VC="$VC_OUT" npx hardhat run adapters/anchor.external.ts --network localhost
banner "DONE"
