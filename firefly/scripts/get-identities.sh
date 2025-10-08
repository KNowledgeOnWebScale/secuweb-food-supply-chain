#!/usr/bin/env bash
set -e
set -u
set -o pipefail

# -----------------------------------------------------------------------------
# Script Name: get-identities.sh
#
# Description:
#   Fetches all identities from a local Firefly instance and optionally saves
#   the JSON output to a file. If no output file is provided, the results are
#   pretty-printed to the console using jq (if available).
#
# Usage:
#   ./get-identities.sh [output_file]
#
# Examples:
#   ./get-identities.sh
#       → Fetches identities and prints formatted JSON to stdout.
#
#   ./get-identities.sh identities.json
#       → Fetches identities and saves the JSON response to 'identities.json'.
#
# Requirements:
#   - curl (for HTTP requests)
#   - jq (optional, for pretty-printing JSON)
#
# Exit Codes:
#   0  Success
#   1  General error or missing dependencies
#
# -----------------------------------------------------------------------------

FPATH_OUTPUT="${1:-}"  # optional first argument
HOST="http://localhost:10000"

echo "Fetching all identities from Firefly at $HOST"
API_URL="${HOST}/api/v1/identities?fetchverifiers=true"

if [[ -n "$FPATH_OUTPUT" ]]; then
  # If an output file path is provided, write to it
  curl -s -X GET "$API_URL" \
    -H "Content-Type: application/json" \
    > "$FPATH_OUTPUT"
  echo "✅ Identities saved to: $FPATH_OUTPUT"
else
  # Otherwise, print to console (pretty-printed if jq is installed)
  if command -v jq >/dev/null 2>&1; then
    curl -s -X GET "$API_URL" \
      -H "Content-Type: application/json" | jq .
  else
    echo "⚠️ jq not found — printing raw JSON output."
    curl -s -X GET "$API_URL" \
      -H "Content-Type: application/json"
  fi
fi