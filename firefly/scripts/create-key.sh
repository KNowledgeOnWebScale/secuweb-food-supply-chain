#!/usr/bin/env bash
set -e
set -u
set -o pipefail

# -------------------------
# Create a new keypair for a Firefly stack
# Usage:
#   ./create_key.sh <stack> <key_name> [output_file]
#
# Examples:
#   ./create_key.sh mystack mykey
#   ./create_key.sh mystack mykey keypair.json
# -------------------------

usage() {
  echo "⚠️  Usage: $0 <stack> <key_name> [output_file]"
  echo
  echo "Arguments:"
  echo "  stack        Name of the Firefly stack to use"
  echo "  key_name     Name of the key to create"
  echo "  output_file  (optional) Path to save the keypair JSON"
  echo
  echo "If no output_file is provided, the keypair is printed to stdout."
  exit 1
}

# Parse arguments
STACK="${1:-}"
KEYNAME="${2:-}"
FPATH_OUTPUT="${3:-}"  # optional third argument

# Validate required arguments
if [[ -z "$STACK" || -z "$KEYNAME" ]]; then
  echo "❌ Error: Missing required arguments."
  usage
fi

echo "Creating keypair for stack '$STACK' with name '$KEYNAME'..."

# Run Firefly command
if ! KEY_OUTPUT=$(firefly accounts create "$STACK" 2>&1); then
  echo "❌ Failed to create keypair:"
  echo "$KEY_OUTPUT"
  exit 1
fi

# Output handling
if [[ -n "$FPATH_OUTPUT" ]]; then
  echo "$KEY_OUTPUT" > "$FPATH_OUTPUT"
  echo "✅ Keypair created and saved to: $FPATH_OUTPUT"
else
  echo "✅ Keypair created:"
  echo "$KEY_OUTPUT"
fi