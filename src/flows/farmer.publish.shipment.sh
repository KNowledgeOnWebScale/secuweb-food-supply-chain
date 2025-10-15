set -e

_DID="did:firefly:farmer"
# jq
# -r: raw output, no quotes
_ADDRESS=$(jq -r .address ../../firefly/scripts/output/keys/farmer.json)

# Filepath should be relative to the repo root
_FPATH_SHIPMENT_VC="src/flows/output/farmer/shipments/out/vc/shipment1.jsonld"

npm run ff:publish-shipment -- \
  --address $_ADDRESS \
  --did $_DID \
  --fpathPayload $_FPATH_SHIPMENT_VC
