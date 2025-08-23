# !/bin/bash
# get-org-uuid-by-name.sh
# This script retrieves the UUID of an organization by its name from the identities.json file.
set -e
set -u
set -o pipefail

NAME=$1
SELECTOR='.[] | select(.name == "'$NAME'")'
jq "$SELECTOR" identities.json