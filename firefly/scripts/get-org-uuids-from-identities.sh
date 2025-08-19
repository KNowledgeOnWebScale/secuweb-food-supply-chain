# This script retrieves the UUID of an organization by its name from the identities.json file.
# Usage: ./get-org-uuid-by-name.sh <org_name>
set -e
set -u
set -o pipefail

jq '[.[] | select(.type == "org") | {id, type, name}]' identities.json