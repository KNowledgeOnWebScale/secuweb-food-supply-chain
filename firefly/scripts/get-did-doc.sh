# !/bin/bash
# get-did-doc.sh
# This script fetches the DID Document for a given DID from a Firefly instance and saves it to a file.
# Usage: ./get-did-doc.sh <did> <output_file_path>
set -e
set -u
set -o pipefail

DID=$1
FPATH_OUTPUT=$2

HOST="http://localhost:10000"

# Fetch identity for given DID
API_URL="${HOST}/api/v1/network/diddocs/$DID"

curl -s -X GET "$API_URL" \
  -H "Content-Type: application/json" \
  > $FPATH_OUTPUT