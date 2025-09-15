set -e
set -o pipefail

source $PWD/firefly/scripts/.env
# Create a new keypair
STACK=$1
KEYNAME=$2

if [ -z "$STACK" ] || [ -z "$KEYNAME" ]; then
  echo "⚠️ Usage: $0 <stack> <key_name>"
  exit 1
fi

KEY_OUTPUT=$(firefly accounts create $STACK)
FPATH_OUTPUT="${FPATH_DIR_KEYS}/${KEYNAME}.json"

echo $KEY_OUTPUT > "${FPATH_OUTPUT}"

FPATH_OUTPUT=$(realpath "${FPATH_OUTPUT}")
echo "Keypair created and saved to ${FPATH_OUTPUT}"
