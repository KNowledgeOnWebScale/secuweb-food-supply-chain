#!/usr/bin/env bash
set -euo pipefail

echo "src/flows/load-actor-data-into-solid-pods.sh is deprecated."
echo "Delegating to the manifest-driven fixture publisher: npm run setup:fixtures"

exec npm run setup:fixtures
