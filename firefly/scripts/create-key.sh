set -e
set -u
set -o pipefail

# Create a new keypair
STACK=$1
KEYNAME=$2
FPATH_OUTPUT=$3

echo "FPATH_OUTPUT: $FPATH_OUTPUT"

if [ -z "$STACK" ] || [ -z "$KEYNAME" ] || [ -z "$FPATH_OUTPUT" ]; then
  echo "⚠️ Usage: $0 <stack> <key_name> <path to resulting key>"
  exit 1
fi

KEY_OUTPUT=$(firefly accounts create $STACK)


echo $KEY_OUTPUT > "${FPATH_OUTPUT}"

echo "Keypair created and saved to ${FPATH_OUTPUT}"
