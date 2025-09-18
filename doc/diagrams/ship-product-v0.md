# Flow: Ship Product (V0)

Source diagram: [`ship-product-v0.mermaid`](./ship-product-v0.mermaid)

Steps:

- Actor A creates a shipment record
- Actor A posts the shipment record onto its pod
- Upon success, the Solid Pod responds with a URI to the shipment record
- Actor A creates a verifiable credential from the shipment record
- Actor A posts the VC to its pod
- Upon success, the Solid Pod responds with a URI to the VC of the shipment record
- Actor A sends a message, containing the URI of the VC, to Actor B
- Actor B requests the VC from A’s Solid POd
- A’s Solid Pod responds with the VC
- Actor B verifies the VC
