#!/bin/bash
#
# Note: this script assumes:
#   - to run it the directory where it is located
#   - our repo is cloned in a directory $OUR_CLONE

set -euo pipefail

OUR_CLONE=food-supply-chain
VIEWER_REPO=miravi-a-linked-data-viewer
VIEWER_CLONE=food-supply-chain-miravi

# absolute dir
OUR_ROOT_DIR=$(pwd)/../..



pushd ${OUR_ROOT_DIR}/.. > /dev/null

echo $PWD


echo Cloning, selecting tag, installing...
rm -rf ${VIEWER_CLONE}
echo "⚠️ Using SecuWeb fork of the viewer for the FSC demo"
git clone git@github.com:gertjandemulder/miravi-a-linked-data-viewer.git -b secuweb/fsc-demo-20251114 ${VIEWER_CLONE}
cd ${VIEWER_CLONE}/main
npm install

echo Selecting our configuration...
echo "pwd: $PWD"
node scripts/select-config.cjs ../../../${OUR_CLONE}/actors/viewer/setup

echo Rebuilding static content...
rm -rf dist
npm run build

echo Harvesting the static content into our file structure...
rm -rf ${OUR_ROOT_DIR}/actors/viewer/html
cp -r dist ${OUR_ROOT_DIR}/actors/viewer/html

popd > /dev/null
