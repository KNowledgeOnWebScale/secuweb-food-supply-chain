# This script fetches all identities from a Firefly instance and saves them to a file.
# Usage: ./get-identities.sh
set -e
set -u
set -o pipefail

FPATH_OUTPUT="${1:-}"  # optional first argument
HOST="http://localhost:10000"

echo "Fetching all identities from Firefly at $HOST"
API_URL="${HOST}/api/v1/identities?fetchverifiers=true"

if [[ -n "$FPATH_OUTPUT" ]]; then
  # If an output file path is provided, write to it
  curl -s -X GET "$API_URL" \
    -H "Content-Type: application/json" \
    > "$FPATH_OUTPUT"
else
  # Otherwise, print to console
  curl -s -X GET "$API_URL" \
    -H "Content-Type: application/json" | jq .
fi