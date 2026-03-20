set -e
set -u
# This script automates the process of adding files to a Solid Pod and creating verifiable credentials (VCs) for those files.

# Override this to target a different Solid server, for example:
# CSS_BASE_URL="https://solid.example.com" ./src/flows/load-actor-data-into-solid-pods.sh
CSS_BASE_URL="${CSS_BASE_URL:-http://localhost:3000}"
CSS_BASE_URL="${CSS_BASE_URL%/}"
readonly CSS_BASE_URL

function solidResourceUrl() {
  local _ACTOR=$1
  local _RESOURCE_PATH=$2
  printf '%s\n' "${CSS_BASE_URL}/${_ACTOR}/${_RESOURCE_PATH}"
}

function solidWebId() {
  local _ACTOR=$1
  printf '%s\n' "${CSS_BASE_URL}/${_ACTOR}/profile/card#me"
}

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

  # Packaging (batch)
  _CONTAINER='products'
  _DIR_INPUT_DATA='./src/flows/data/packager'
  _DIR_OUTPUT_DATA='./src/flows/output/packager'
  mkdir -p "$_DIR_OUTPUT_DATA/$_CONTAINER/vc"

  # Process products/packaged-batch-001.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/packaged-batch-001.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Shipments (OUTBOUND)
  _CONTAINER='shipments/out'
  mkdir -p "$_DIR_OUTPUT_DATA/$_CONTAINER/vc"

  # Process shipments/out/shipment3.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/shipment3.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC
}

function processActor_Transporter() {
  ########################################################################################
  # Actor: Transporter
  ########################################################################################
  _USERNAME=transporter
  _EMAIL="info@transporter.com"
  _PASSWORD=transporter123
  _DIR_INPUT_DATA="./src/flows/data/$_USERNAME"
  _DIR_OUTPUT_DATA="./src/flows/output/$_USERNAME"
  echo "Actor: $_USERNAME 🚚"

  # Transport events
  _CONTAINER='transport-events'
  mkdir -p "$_DIR_OUTPUT_DATA/$_CONTAINER/vc"

  # Process pickup-shipment1.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/pickup-shipment1.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Process delivery-shipment1.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/delivery-shipment1.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Process pickup-shipment3.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/pickup-shipment3.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

  # Process delivery-shipment3.jsonld
  _FPATH_DATA="$_DIR_INPUT_DATA/$_CONTAINER/delivery-shipment3.jsonld"
  _BASENAME_DATA=$(basename $_FPATH_DATA)
  _FPATH_DATA_VC="$_DIR_OUTPUT_DATA/$_CONTAINER/vc/$_BASENAME_DATA"
  addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC
}

function processActor_Retailer() {
  ########################################################################################
  # Actor: Retailer
  ########################################################################################
  _USERNAME=retailer
  _EMAIL="info@retailer.com"
  _PASSWORD=retailer123
  echo "Actor: $_USERNAME 🛒"

  # Shipments (INBOUND)
  _CONTAINER='shipments/in'
  _FPATH_OUTPUT_DIR=./src/flows/output/retailer/shipments/in
  mkdir -p $_FPATH_OUTPUT_DIR

  # Process receipt-shipment3.jsonld
  _FPATH_DATA='./src/flows/data/retailer/shipments/in/receipt-shipment3.jsonld'
  _FPATH_DATA_VC="$_FPATH_OUTPUT_DIR/receipt-shipment3-vc.jsonld"
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
  URI_RESOURCE=$(solidResourceUrl farmer "products/vc/product-x.jsonld")

  URI_AGENT=$(solidWebId packager)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/product-y
  # READ access:
  # - Packager
  URI_RESOURCE=$(solidResourceUrl farmer "products/vc/product-y.jsonld")

  URI_AGENT=$(solidWebId packager)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/shipment1
  # READ access:
  # - Packager (destination)
  # - Transporter (transport)
  URI_RESOURCE=$(solidResourceUrl farmer "shipments/out/vc/shipment1.jsonld")

  URI_AGENT=$(solidWebId packager)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT=$(solidWebId transporter)
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/shipment2
  # READ access:
  # - Packager (destination)
  # - Transporter (transport)
  URI_RESOURCE=$(solidResourceUrl farmer "shipments/out/vc/shipment2.jsonld")

  URI_AGENT=$(solidWebId packager)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT=$(solidWebId transporter)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT
}

function setACLs_Packager() {
  ########################################################################################
  # Actor: Packager
  ########################################################################################
  _USERNAME=packager
  _EMAIL="info@packager.com"
  _PASSWORD=packager123

  # vc/packaged-batch-001
  # READ access:
  # - Retailer
  URI_RESOURCE=$(solidResourceUrl packager "products/vc/packaged-batch-001.jsonld")
  URI_AGENT=$(solidWebId retailer)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  # vc/shipment3
  # READ access:
  # - Retailer (destination)
  # - Transporter (transport)
  URI_RESOURCE=$(solidResourceUrl packager "shipments/out/vc/shipment3.jsonld")

  URI_AGENT=$(solidWebId retailer)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT=$(solidWebId transporter)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT
}

function setACLs_Transporter() {
  ########################################################################################
  # Actor: Transporter
  ########################################################################################
  _USERNAME=transporter
  _EMAIL="info@transporter.com"
  _PASSWORD=transporter123

  # Transport events for shipment1 (Farmer -> Packager)
  for _EVENT in pickup-shipment1 delivery-shipment1; do
    URI_RESOURCE=$(solidResourceUrl transporter "transport-events/vc/${_EVENT}.jsonld")

    # READ access:
    # - Farmer
    URI_AGENT=$(solidWebId farmer)
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT

    # - Packager
    URI_AGENT=$(solidWebId packager)
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT
  done

  # Transport events for shipment3 (Packager -> Retailer)
  for _EVENT in pickup-shipment3 delivery-shipment3; do
    URI_RESOURCE=$(solidResourceUrl transporter "transport-events/vc/${_EVENT}.jsonld")

    # READ access:
    # - Packager
    URI_AGENT=$(solidWebId packager)
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT

    # - Retailer
    URI_AGENT=$(solidWebId retailer)
    npm run flows:set-acl -- \
      --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
      --resourceUrl $URI_RESOURCE --webId $URI_AGENT
  done
}

function setACLs_Retailer() {
  ########################################################################################
  # Actor: Retailer
  ########################################################################################
  _USERNAME=retailer
  _EMAIL="info@retailer.com"
  _PASSWORD=retailer123

  # vc/receipt-shipment3
  # READ access:
  # - Packager
  # - Farmer (upstream visibility)
  URI_RESOURCE=$(solidResourceUrl retailer "shipments/in/vc/receipt-shipment3-vc.jsonld")

  URI_AGENT=$(solidWebId packager)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT

  URI_AGENT=$(solidWebId farmer)
  npm run flows:set-acl -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --resourceUrl $URI_RESOURCE --webId $URI_AGENT
}

processActor_Farmer;
processActor_Packager;
processActor_Transporter;
processActor_Retailer;

setACLs_Farmer;
setACLs_Packager;
setACLs_Transporter;
setACLs_Retailer;
