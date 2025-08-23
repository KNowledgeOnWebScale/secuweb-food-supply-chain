#!/bin/bash
# register-css-users.sh
# This script registers CSS users in the Firefly instance.

DIR_FF_SCRIPTS='./firefly/scripts'
FPATH_CSS_USERS="./css/css-users.json"

STACK="dev2"
echo "Currently, stack is fixed to: $STACK"
HOST=http://localhost:10000
echo "Currently, host is fixed to: $HOST"

USERNAMES=$(jq '[ .[] |  .pods[0].name ]' "$FPATH_CSS_USERS")
echo "Registering the following CSS users on Firefly: $USERNAMES"

for USERNAME in $(echo "$USERNAMES" | jq -r '.[]'); do
  echo "➡️ Registering user: $USERNAME"
  # Extract email and password for the user from the JSON file
  EMAIL=$(jq -r '.[] | select(.pods[].name=="'$USERNAME'") | .email' "$FPATH_CSS_USERS")
  PASSWORD=$(jq -r '.[] | select(.pods[].name=="'$USERNAME'") | .password' "$FPATH_CSS_USERS")
  echo "Email for user $USERNAME: $EMAIL"
  echo "Password for user $USERNAME: $PASSWORD"
  
  cd ${DIR_FF_SCRIPTS}
  echo "➡️ Create and register keypair for user $USERNAME"
  ./create-register-key.sh $STACK $USERNAME
  
  echo "Identity record for user $USERNAME:"
  # Extract the DID from the identity record
  FF_ID_RECORD=$(./get-identity-record-by-name.sh $USERNAME)
  FF_DID=$(echo "$FF_ID_RECORD" | jq .did)
  cd -

  echo "➡️ Updating WebID profile for user $USERNAME with Firefly DID: $FF_DID"
  # Add the Firefly DID to the user's WebID profile
  npm run add-firefly-did-to-webid-profile -- --name $USERNAME --email "${EMAIL}" --password "${PASSWORD}" --firefly-did "${FF_DID}"
done

