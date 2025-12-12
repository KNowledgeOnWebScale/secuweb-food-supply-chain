set -e
set -u
# This script automates the process of adding files to a Solid Pod and creating verifiable credentials (VCs) for those files.

function addFileToSolidPod() { 
  echo "Adding file $1 to Solid Pod and creating VC at $2"
  echo "-----------------------------------------"
  local _USERNAME=$1
  local _EMAIL=$2
  local _PASSWORD=$3
  local _CONTAINER=$4
  local _CONTAINER_VC="${_CONTAINER}/vc"
  local _FPATH_DATA=$5
  local _FPATH_DATA_VC=$6

#
#  # Write the original data to the Solid Pod
#  npm run flows:add-file-to-solid-pod -- \
#    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
#    --container $_CONTAINER --inputFile $_FPATH_DATA --outputBasename $(basename $_FPATH_DATA)
#

  echo "Create a verifiable credential from the data file ($(basename $_FPATH_DATA))"
  npm run flows:create-vc -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --data $_FPATH_DATA --output $_FPATH_DATA_VC

  # Write the verifiable credential to the Solid Pod
  RESULT=$(npm run flows:add-file-to-solid-pod -- \
               --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
             --container $_CONTAINER_VC --inputFile $_FPATH_DATA_VC --outputBasename $(basename $_FPATH_DATA_VC))
  echo "RESULT FROM ADDING VC TO SOLID POD: "
  echo $RESULT
}

function processActor_Farmer() {
  ########################################################################################
  # Actor: Farmer
  ########################################################################################
  _USERNAME=farmer
  _EMAIL="info@farmer.com"
  _PASSWORD=farmer123
  _DIR_INPUT_DATA="./src/flows/data/$_USERNAME"
  _DIR_OUTPUT_DATA="./src/flows/output/$_USERNAME"
  echo "Actor: $_USERNAME 🚜"

  # Products
  _CONTAINER='products'
  
  # Process products/product-x.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/product-x.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Process products/product-x.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/product-y.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Shipments (OUTBOUND)  
  _CONTAINER='shipments/out'
  mkdir -p $_DIR_OUTPUT_DATA/$_CONTAINER/vc
  
  # Process shipments/out/shipment1.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/shipment1.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Process shipments/out/shipment2.jsonld  
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/shipment2.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC
}

function processActor_Packager() {
  ########################################################################################
  # Actor: Packager
  ########################################################################################
  _USERNAME=packager
  _EMAIL="info@packager.com"
  _PASSWORD=packager123
  echo "Actor: $_USERNAME 📦"

  # Shipments (INBOUND)
  _CONTAINER='shipments/in'
  _FPATH_OUTPUT_DIR=./src/flows/output/packager/shipments/in
  mkdir -p $_FPATH_OUTPUT_DIR

  # Process receipt-shipment1.jsonld
  _FPATH_DATA='./src/flows/data/packager/shipments/in/receipt-shipment1.jsonld'
  _FPATH_DATA_VC="$_FPATH_OUTPUT_DIR/receipt-shipment1-vc.jsonld"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC
}

function setACLs_Farmer() {
  ########################################################################################
  # Actor: Farmer
  ########################################################################################
  _USERNAME=farmer
  _EMAIL="info@farmer.com"
  _PASSWORD=farmer123

  # vc/product-x
  # READ access:
  # - Packager
  URI_RESOURCE="http://localhost:3000/farmer/products/vc/product-x.jsonld"

  URI_AGENT="http://localhost:3000/packager/profile/card#me"
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/product-y
  # READ access:
  # - Packager
  URI_RESOURCE="http://localhost:3000/farmer/products/vc/product-y.jsonld"

  URI_AGENT="http://localhost:3000/packager/profile/card#me"
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/shipment1
  # READ access:
  # - Packager (destination)
  # - Transporter (transport)
  URI_RESOURCE="http://localhost:3000/farmer/shipments/out/vc/shipment1.jsonld"

  URI_AGENT="http://localhost:3000/packager/profile/card#me"
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT="http://localhost:3000/transporter/profile/card#me"
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/shipment2
  # READ access:
  # - Packager (destination)
  # - Transporter (transport)
  URI_RESOURCE="http://localhost:3000/farmer/shipments/out/vc/shipment2.jsonld"

  URI_AGENT="http://localhost:3000/packager/profile/card#me"
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT="http://localhost:3000/transporter/profile/card#me"
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT
}

processActor_Farmer;
processActor_Packager;
# setACLs_Farmer;
