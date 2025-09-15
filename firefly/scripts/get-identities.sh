# This script fetches all identities from a Firefly instance and saves them to a file.
# Usage: ./get-identities.sh
set -e
set -o pipefail
source $PWD/firefly/scripts/.env

HOST="http://localhost:10000"
# Fetches all identities from a Firefly instance.
echo "Fetching all identities from Firefly at $HOST"
API_URL="${HOST}/api/v1/identities?fetchverifiers=true"
curl -s -X GET "$API_URL" \
  -H "Content-Type: application/json" \
  > $FPATH_IDENTITIES