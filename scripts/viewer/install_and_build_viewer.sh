#!/bin/bash
#
# Note: this script assumes:
#   - to run it the directory where it is located
#   - our repo is cloned in a directory $OUR_CLONE
set -euo pipefail
source viewer.env

pushd ${OUR_ROOT_DIR}/.. > /dev/null
echo "Installing ${VIEWER_CLONE}/main"
cd ${VIEWER_CLONE}/main
npm install

echo Selecting our configuration...
echo "OUR_CLONE: $OUR_CLONE"
node scripts/select-config.cjs secuweb

echo Rebuilding static content...
rm -rf dist
npm run build

echo Harvesting the static content into our file structure...
rm -rf ${OUR_ROOT_DIR}/actors/viewer/html
cp -r dist ${OUR_ROOT_DIR}/actors/viewer/html

popd > /dev/null
