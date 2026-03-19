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

echo "👉 Finalizing setup with environment variables file $OD_ENVVARS_FILE..."

echo "➡️ Getting rid of previous derived and temp files..."
rm -rf ./local-run

# 1) Clone viewer
echo "➡️ Cloning the viewer repository"
cd ./scripts/viewer && ./clone_viewer.sh && cd -

# 2) Apply templates to secuweb config in viewer
echo "➡️ Applying templates to viewer configuration"
source ./scripts/viewer/viewer.env
FPATH_VIEWER_REPO=$(pwd)/../${VIEWER_CLONE}
ABS_FPATH_APPLY_TEMPLATES=$(realpath ./scripts/templates/apply-templates.sh)
cd $FPATH_VIEWER_REPO && $ABS_FPATH_APPLY_TEMPLATES && cd -

# 3) Install & build viewer
echo "➡️ Installing the viewer"
cd ./scripts/viewer && ./install_and_build_viewer.sh && cd -

echo "👉 Setup finalized..."
