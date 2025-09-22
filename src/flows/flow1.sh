# This script creates a verifiable credential from a data file and writes it to a Solid Pod.
_USERNAME=farmer
_EMAIL="info@farmer.com"
_PASSWORD=farmer123
_FPATH_DATA='./src/flows/data/farmer/shipment.json'
_FPATH_DATA_VC='./src/flows/output/shipment1-vc.jsonld'
_CONTAINER='shipments'
# Create a verifiable credential from the data file
npm run flows:create-vc -- --name $_USERNAME --email $_EMAIL --password $_PASSWORD --data $_FPATH_DATA --output $_FPATH_DATA_VC

# Write the verifiable credential to the Solid Pod
npm run flows:add-file-to-solid-pod -- --name $_USERNAME --email $_EMAIL --password $_PASSWORD --container $_CONTAINER --inputFile $_FPATH_DATA_VC 
