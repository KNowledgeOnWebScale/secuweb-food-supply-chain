#!/bin/bash
#
# Assumptions:
#   - this script is run after yarn install and after sourcing one of the environment variable files
#   - this script is run from the repository root

set -euo pipefail

if [[ -z $OD_ENVVARS_FILE ]] ; then
  echo "⚠️ source one of the environment variable files and come back!"
  exit 2
fi
case "$OD_ENVVARS_FILE" in
  "env-docker-public")
    ;;
  "env-localhost")
    ;;
  *)
    echo "⚠️ Unknown environment variables file $OD_ENVVARS_FILE"
    exit 2
    ;;
esac

echo "👉 Finalizing setup with environment variables file $OD_ENVVARS_FILE..."

echo "➡️ Getting rid of previous derived and temp files..."
rm -rf ./local-run

echo "➡️ Creating derived files from their templates..."
./scripts/templates/apply-templates.sh

echo "➡️ Building the Generic Data Viewer contents..."
cd ./scripts/viewer && ./build-webclient-contents.sh && cd ../../

echo "👉 Setup finalized..."
