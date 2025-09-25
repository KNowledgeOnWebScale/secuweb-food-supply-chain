# This script creates a verifiable credential from a data file and writes it to a Solid Pod.
_USERNAME=farmer
_EMAIL="info@farmer.com"
_PASSWORD=farmer123
_CONTAINER='shipments'
_CONTAINER_VC="${_CONTAINER}/vc"

function addFileToSolidPod() { 
  echo "Adding file $1 to Solid Pod and creating VC at $2"
  echo "-----------------------------------------"
  FPATH_DATA=$1
  FPATH_DATA_VC=$2
  # Write the original data to the Solid Pod
  npm run flows:add-file-to-solid-pod -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --container $_CONTAINER --inputFile $FPATH_DATA 

  # Create a verifiable credential from the data file
  npm run flows:create-vc -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --data $_FPATH_DATA --output $FPATH_DATA_VC

  # Write the verifiable credential to the Solid Pod
  npm run flows:add-file-to-solid-pod -- \
    --name $_USERNAME --email $_EMAIL --password $_PASSWORD \
    --container $_CONTAINER_VC --inputFile $FPATH_DATA_VC --outputBasename $(basename $FPATH_DATA_VC)
}

# Process shipment1.jsonld
_FPATH_DATA='./src/flows/data/farmer/shipment1.jsonld'
_FPATH_DATA_VC='./src/flows/output/shipment1-vc.jsonld'
addFileToSolidPod $_FPATH_DATA $_FPATH_DATA_VC

# Process shipment2.jsonld
_FPATH_DATA='./src/flows/data/farmer/shipment2.jsonld'
_FPATH_DATA_VC='./src/flows/output/shipment2-vc.jsonld'
addFileToSolidPod $_FPATH_DATA $_FPATH_DATA_VC
