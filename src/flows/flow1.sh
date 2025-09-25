# This script automates the process of adding files to a Solid Pod and creating verifiable credentials (VCs) for those files.

function addFileToSolidPod() { 
  echo "Adding file $1 to Solid Pod and creating VC at $2"
  echo "-----------------------------------------"
  local _USERNAME=$1
  local _EMAIL=$2
  local_PASSWORD=$3
  local _CONTAINER=$4
  local _FPATH_DATA=$5
  local _FPATH_DATA_VC=$6
  # Write the original data to the Solid Pod
  npm run flows:add-file-to-solid-pod -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --container $_CONTAINER --inputFile $_FPATH_DATA

  # Create a verifiable credential from the data file
  npm run flows:create-vc -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --data $_FPATH_DATA --output $_FPATH_DATA_VC

  # Write the verifiable credential to the Solid Pod
  npm run flows:add-file-to-solid-pod -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --container $_CONTAINER_VC --inputFile $_FPATH_DATA_VC --outputBasename $(basename $_FPATH_DATA_VC)
}

########################################################################################
# Actor: Farmer
########################################################################################
_USERNAME=farmer
_EMAIL="info@farmer.com"
_PASSWORD=farmer123
_CONTAINER='shipments'
_CONTAINER_VC="${_CONTAINER}/vc"

# Process shipment1.jsonld
_FPATH_DATA='./src/flows/data/farmer/shipment1.jsonld'
_FPATH_DATA_VC='./src/flows/output/shipment1-vc.jsonld'
addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC

# Process shipment2.jsonld
_FPATH_DATA='./src/flows/data/farmer/shipment2.jsonld'
_FPATH_DATA_VC='./src/flows/output/shipment2-vc.jsonld'
addFileToSolidPod $_USERNAME $_EMAIL $_PASSWORD $_CONTAINER $_FPATH_DATA $_FPATH_DATA_VC
