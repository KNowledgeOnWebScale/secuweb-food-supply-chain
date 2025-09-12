#!/bin/bash
# register-css-users.sh
# This script registers CSS users in the Firefly instance.

DIR_FF_SCRIPTS='./firefly/scripts'
FPATH_CSS_USERS="./css/css-users.json"

STACK="dev"
echo "Currently, stack is fixed to: $STACK"
HOST=http://localhost:10000
echo "Currently, host is fixed to: $HOST"

USERNAMES=$(jq '[ .[] |  .pods[0].name ]' "$FPATH_CSS_USERS")
pods=($(jq -r '.[].pods[0].name' $FPATH_CSS_USERS))
echo "Pods array: ${pods[@]}"
#pods=("${pods[@]1:}")


for pod in "${pods[@]}"; do
  USERNAME=$pod
  echo "➡️ Registering user: $USERNAME"
  
  # Extract email and password for the user from the JSON file
  EMAIL=$(jq -r '.[] | select(.pods[].name=="'$USERNAME'") | .email' "$FPATH_CSS_USERS")
  PASSWORD=$(jq -r '.[] | select(.pods[].name=="'$USERNAME'") | .password' "$FPATH_CSS_USERS")
  echo "Email for user $USERNAME: $EMAIL"
  echo "Password for user $USERNAME: $PASSWORD"
  
  cd ${DIR_FF_SCRIPTS}
  echo "➡️ Create and register keypair for user $USERNAME"
  ./create-register-key.sh $STACK $USERNAME
  
  # Fetch identities again to ensure we have the latest data
  sleep 5
  ./get-identities.sh
  
  echo "Identities:"
  jq '.[] | .name' identities.json

  echo "Identity record for user $USERNAME:"
  # Extract the DID from the identity record
  FF_ID_RECORD=$(./get-identity-record-by-name.sh $USERNAME)
  echo "$FF_ID_RECORD"
  # Validate that FF_ID_RECORD is not empty
  if [ -z "$FF_ID_RECORD" ]; then
    echo "❌ Error: No identity record found for user $USERNAME."
    exit 1
  fi
  FF_DID=$(echo "$FF_ID_RECORD" | jq .did)
  cd -

  echo "➡️ Updating WebID profile for user $USERNAME with Firefly DID: $FF_DID"
  # Check if FF_DID is empty or null
  if [ -z "$FF_DID" ] || [ "$FF_DID" == "null" ]; then
    echo "❌ Error: Firefly DID is empty or null for user $USERNAME."
    exit 1
  fi
  # Add the Firefly DID to the user's WebID profile
  npm run add-firefly-did-to-webid-profile -- --name $USERNAME --email "${EMAIL}" --password "${PASSWORD}" --firefly-did "${FF_DID}"
  
done

