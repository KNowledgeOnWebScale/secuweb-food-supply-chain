#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root, regardless of where this script lives or is called from
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." &> /dev/null && pwd)"

##################################################
# Actor: Farmer
##################################################
function __farmer() {
    echo "product-x"
    export VC_PATH="src/flows/output/farmer/products/vc/product-x.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:product-x"
    # METADATA_URI extraction from VC
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI

    echo "product-y"
    export VC_PATH="src/flows/output/farmer/products/vc/product-y.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:product-y"
    # METADATA_URI extraction from VC
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI

    echo "shipment1"
    export VC_PATH="src/flows/output/farmer/shipments/out/vc/shipment1.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:shipment1"
    # METADATA_URI extraction from VC
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI

    echo "shipment2"
    export VC_PATH="src/flows/output/farmer/shipments/out/vc/shipment2.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:shipment2"
    # METADATA_URI extraction from VC
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI
}

##################################################
# Actor: Packager
##################################################
function __packager() {
    echo "receipt-shipment1"
    export VC_PATH="src/flows/output/packager/shipments/in/receipt-shipment1-vc.jsonld"
    export SUBJECT_DID="did:secuweb:packager:shipment1"
    

    # METADATA_URI extraction from VC
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI

    echo "packaged-batch-001"
    export VC_PATH="src/flows/output/packager/products/vc/packaged-batch-001.jsonld"
    export SUBJECT_DID="did:secuweb:packager:batch-001"
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI

    echo "shipment3"
    export VC_PATH="src/flows/output/packager/shipments/out/vc/shipment3.jsonld"
    export SUBJECT_DID="did:secuweb:packager:shipment3"
    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp
    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI
}

##################################################
# Actor: Transporter
##################################################
function __transporter() {
    for ITEM in pickup-shipment1 delivery-shipment1 pickup-shipment3 delivery-shipment3; do
        echo "$ITEM"
        export VC_PATH="src/flows/output/transporter/transport-events/vc/${ITEM}.jsonld"
        export SUBJECT_DID="did:secuweb:transporter:${ITEM}"

        mktemp=$(mktemp)
        npm run jsonld:expand -- $VC_PATH $mktemp
        export METADATA_URI=$(jq -r .podRef $mktemp)
        rm $mktemp

        echo "METADATA_URI: $METADATA_URI"
        ./src/flows/anchor.sh
        unset METADATA_URI
    done
}

##################################################
# Actor: Retailer
##################################################
function __retailer() {
    echo "receipt-shipment3"
    export VC_PATH="src/flows/output/retailer/shipments/in/receipt-shipment3-vc.jsonld"
    export SUBJECT_DID="did:secuweb:retailer:shipment3"

    mktemp=$(mktemp)
    npm run jsonld:expand -- $VC_PATH $mktemp
    export METADATA_URI=$(jq -r .podRef $mktemp)
    rm $mktemp

    echo "METADATA_URI: $METADATA_URI"
    ./src/flows/anchor.sh
    unset METADATA_URI
}

##################################################
# Main
##################################################
cd "$REPO_ROOT"
__farmer
__packager
__transporter
__retailer
