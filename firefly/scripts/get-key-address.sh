# !/bin/bash
# get-key-address.sh
# Retrieves the address of a key from a given key file.
# Usage: ./get-key-address.sh <key_file>
set -e
KEYFILE="$1"
if [ -z "$KEYFILE" ]; then
  echo "⚠️ Usage: $0 <key_file>"
  exit 1
fi
jq '.address' "$KEYFILE" | tr -d '"'
