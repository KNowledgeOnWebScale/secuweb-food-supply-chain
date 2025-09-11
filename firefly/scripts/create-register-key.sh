# !/bin/bash
# create-register-key.sh
# This script creates a keypair and registers it at a Firefly instance.
set -e
function banner() {
  echo "========================================"
  echo "$1"
  echo "========================================"
}

STACK=$1
KEYNAME=$2
HOST=http://localhost:10000
echo "Currently, host is fixed to: $HOST"

if [ -z "$STACK" ] || [ -z "$KEYNAME" ]; then
  echo "⚠️ Usage: $0 <stack> <key_name>"
  exit 1
fi

banner "Creating keypair for stack: $STACK with name: $KEYNAME"
./create-key.sh "$STACK" "$KEYNAME"
cat $KEYNAME.json

banner "Extracting key address from key file"
KEY_ADDRESS=$(./get-key-address.sh "$KEYNAME.json")

banner "Fetching identities…"
./get-identities.sh

banner "Filtering organizations…"
ORG_UUIDS=$(./get-org-uuids-from-identities.sh)
echo "Organization UUIDs: $ORG_UUIDS"

banner "Get parent organization UUID from first organization"
PARENT_UUID=$(echo "$ORG_UUIDS" | jq -r '.[0].id')
echo "Parent Organization UUID: $PARENT_UUID"

banner "Registering keypair"
./register-key.sh $KEYNAME $KEY_ADDRESS $PARENT_UUID $HOST

banner "Fetching updated identities"
./get-identities.sh
SELECTOR='.[] | .name'
jq "$SELECTOR" identities.json