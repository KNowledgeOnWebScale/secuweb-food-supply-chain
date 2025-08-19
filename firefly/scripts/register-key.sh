# Registers a (previously created) keypair at a Firefly instance.
# Ref: https://hyperledger.github.io/firefly/latest/tutorials/create_custom_identity
set -e
set -o pipefail

IDENTITY_NAME="$1"
KEY_ADDRESS="$2"
PARENT_UUID="$3"
HOST="$4"

if [ -z "$IDENTITY_NAME" ] || [ -z "$KEY_ADDRESS" ] || [ -z "$PARENT_UUID" ] || [ -z "$HOST" ]; then
  echo "⚠️ Usage: $0 <identity_name> <key_address> <parent_org_uuid> <host>"
  exit 1
fi

# Register the keypair at Firefly
echo "Registering keypair at Firefly"
API_URL="$HOST/api/v1/identities"
echo "API URL: $API_URL"
echo "Identity Name: $IDENTITY_NAME"
echo "Key Address: $KEY_ADDRESS"
echo "Parent UUID: $PARENT_UUID"

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${IDENTITY_NAME}\",
    \"key\": \"${KEY_ADDRESS}\",
    \"parent\": \"${PARENT_UUID}\"
  }" | jq .
  