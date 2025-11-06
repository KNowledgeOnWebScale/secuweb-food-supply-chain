##################################################
# Actor: Farmer
##################################################
function __farmer() {
    

    echo "product-x"
    export VC_PATH="src/flows/output/farmer/products/vc/product-x.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:product-x"
    ./src/flows/anchor.sh

    echo "product-y"
    export VC_PATH="src/flows/output/farmer/products/vc/product-y.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:product-y"
    ./src/flows/anchor.sh

    echo "shipment1"
    export VC_PATH="src/flows/output/farmer/shipments/out/vc/shipment1.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:shipment1"
    ./src/flows/anchor.sh

    echo "shipment2"
    export VC_PATH="src/flows/output/farmer/shipments/out/vc/shipment2.jsonld"
    export SUBJECT_DID="did:secuweb:farmer:shipment2"
    ./src/flows/anchor.sh
}

##################################################
# Actor: Packager
##################################################
function __packager() {
    echo "receipt-shipment1"
    export VC_PATH="src/flows/output/packager/shipments/in/receipt-shipment1-vc.jsonld"
    export SUBJECT_DID="did:secuweb:packager:shipment1"
    ./src/flows/anchor.sh
}

##################################################
# Main
##################################################
__farmer
__packager
