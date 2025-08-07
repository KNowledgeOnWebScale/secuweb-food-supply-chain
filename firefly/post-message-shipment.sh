# References:
# https://hyperledger.github.io/firefly/latest/tutorials/broadcast_data/

curl --location $URL_MESSAGES_BROADCAST \
--header 'Content-Type: application/json' \
--data-raw '{
  "data": [
    {
      "value": {
          "@type": "ex:ShipmentRecord",
          "ex:status": "shipped",
          "ex:quantity": 1,
          "ex:productID": "http://c.be/products/product-123",
          "ex:origin": "http://a.be/profile/card#me",
          "ex:destination": "http://b.be/profile/card#me",
          "ex:transport": "http://c.be/profile/card#me"
        }
    }
  ],
  "header": {
    "tag": "shipment",
    "topics": [ "topic2"]
  }
}'