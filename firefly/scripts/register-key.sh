# Registers a (previously created) keypair at a Firefly instance.
# Ref: https://hyperledger.github.io/firefly/latest/tutorials/create_custom_identity
# TODO: update doc
#
set -e
set -o pipefail
set -u
IDENTITY_NAME="$1"
KEY_ADDRESS="$2"
PARENT_UUID="$3"
HOST="$4"
FPATH_OUTPUT=$5
WEB_ID=$6

if [ -z "$IDENTITY_NAME" ] || [ -z "$KEY_ADDRESS" ] || [ -z "$PARENT_UUID" ] || [ -z "$HOST" ] || [ -z "$FPATH_OUTPUT" ]; then
  # TODO: update usage
  echo "⚠️ Usage: $0 <identity_name> <key_address> <parent_org_uuid> <host> <fpath response>"
  exit 1
fi

# Register the keypair at Firefly
echo "Registering keypair at Firefly"
API_URL="$HOST/api/v1/identities"
echo "API URL: $API_URL"
echo "Identity Name: $IDENTITY_NAME"
echo "Key Address: $KEY_ADDRESS"
echo "Parent UUID: $PARENT_UUID"

#curl -s -X POST "$API_URL" \
#  -H "Content-Type: application/json" \
#  -d "{
#    \"name\": \"${IDENTITY_NAME}\",
#    \"key\": \"${KEY_ADDRESS}\",
#    \"parent\": \"${PARENT_UUID}\"
#  }" > $FPATH_OUTPUT

echo "[!] Registration result will be stored at $FPATH_OUTPUT"
npm run ff:register-identity --\
  --address $KEY_ADDRESS \
  --name $IDENTITY_NAME \
  --parent $PARENT_UUID \
  --webid $WEB_ID \
  --host $HOST > $FPATH_OUTPUT

  