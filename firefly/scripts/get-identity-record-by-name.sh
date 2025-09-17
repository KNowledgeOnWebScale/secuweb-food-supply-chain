# !/bin/bash
# get-identity-record-by-name.sh <name> <path to identities file>
# This script retrieves an identity record by name from the identities.json file.
set -e
set -u
set -o pipefail
NAME=$1
FPATH_IDENTITIES=$2
if [ ! -f "$FPATH_IDENTITIES" ]; then
  echo "❌ Error: $FPATH_IDENTITIES file not found!"
  exit 1
fi

SELECTOR='.[] | select(.name == "'$NAME'")'
jq "$SELECTOR" "$FPATH_IDENTITIES"
