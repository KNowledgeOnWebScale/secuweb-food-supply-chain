# !/bin/bash
# get-identity-record-by-name.sh
# This script retrieves an identity record by name from the identities.json file.
set -e
set -u
set -o pipefail

source $PWD/firefly/scripts/.env


if [ ! -f "$FPATH_IDENTITIES" ]; then
  echo "❌ Error: $FPATH_IDENTITIES file not found!"
  exit 1
fi
NAME=$1
SELECTOR='.[] | select(.name == "'$NAME'")'
jq "$SELECTOR" "$FPATH_IDENTITIES"
