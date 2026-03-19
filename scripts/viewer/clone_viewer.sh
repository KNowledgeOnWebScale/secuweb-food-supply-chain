#!/bin/bash
#
# Note: this script assumes:
#   - to run it the directory where it is located
#   - our repo is cloned in a directory $OUR_CLONE
set -euo pipefail
source viewer.env

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

popd > /dev/null
