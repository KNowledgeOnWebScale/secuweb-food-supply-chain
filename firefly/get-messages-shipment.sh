# Prerequisite: source actor01.env
set -ue
echo $URL_MESSAGES

URL=${URL_MESSAGES}'?tag=shipment&topics=topic2'
echo $URL
curl -X 'GET' \
  $URL\
  -H 'accept: application/json' \
  -H 'Request-Timeout: 2m0s' | jq . > output.json
  

