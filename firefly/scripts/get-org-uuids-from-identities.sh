# This script extracts organizations' UUIDs from the identities (JSON) file.
# Usage: ./get-org-uuids-from-identities.sh <path to identities file>
set -e
set -u
set -o pipefail

jq '[.[] | select(.type == "org") | {id, type, name}]' $1