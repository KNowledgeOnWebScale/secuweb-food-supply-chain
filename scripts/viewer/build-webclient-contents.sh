#!/bin/bash
#
# Note: this script assumes:
#   - to run it the directory where it is located
#   - our repo is cloned in a directory $OUR_CLONE
set -euo pipefail

OUR_CLONE=food-supply-chain
VIEWER_REPO=miravi-a-linked-data-viewer
VIEWER_CLONE=food-supply-chain-miravi
VIEWER_CLONE_URI="git@gitlab.ilabt.imec.be:KNoWS/projects/SecuWeb/demonstrator/miravi-a-linked-data-viewer.git"
VIEWER_CLONE_BRANCH="secuweb/fsc-demo-20251114"
# FLAGS
SAFEGUARD_VIEWER_CLONE=false

# absolute dir
OUR_ROOT_DIR=$(pwd)/../..

# Helper
function clone() {
    echo "Cloning $VIEWER_REPO into $VIEWER_CLONE..."
    git clone $VIEWER_CLONE_URI -b $VIEWER_CLONE_BRANCH ${VIEWER_CLONE}
}

#
pushd ${OUR_ROOT_DIR}/.. > /dev/null
if [ -d "$VIEWER_CLONE" ]; then
    if [ "$SAFEGUARD_VIEWER_CLONE" = true ] ; then
        echo "
        ⚠️ Directory $VIEWER_CLONE already exists.
        Thus, it will not be deleted and overridden.
        Your setup will use the existing directory ($(basename $VIEWER_CLONE)).
        If you want to override it, please set SAFEGUARD_VIEWER_CLONE=false to proceed anyway;
        This will delete the existing directory $VIEWER_CLONE and all its contents,
        before cloning the viewer repository again.
        "
    else
        echo "⚠️ Removing existing directory $VIEWER_CLONE since SAFEGUARD_VIEWER_CLONE is false."
        rm -rf $VIEWER_CLONE
        clone;
    fi
else
    clone;
fi

echo "Installing ${VIEWER_CLONE}/main"
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
