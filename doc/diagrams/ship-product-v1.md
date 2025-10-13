# Flow: Ship Product (V1)
<!-- Init: Mon Oct 13 02:46:18 CEST 2025 -->

Source diagram: [`ship-product-v1.mermaid`](./ship-product-v1.mermaid)


In this interaction sequence, Actor A initiates a decentralized data exchange 
process concerning a shipment record. The process involves four entities: Actor A,
Actor B, A’s Solid Pod, and the Blockchain.

First, Actor A creates a shipment record locally. This record represents the 
factual details of a shipment but initially exists only in A’s local context. 
To make this record verifiable, Actor A next creates a Verifiable Credential (VC) 
encapsulating the shipment record’s claims, signed with A’s decentralized 
identity.

Once the VC is generated, A proceeds to store it within A’s Solid Pod—a personal
online data store that A controls. The VC is uploaded via a POST request, and 
the Pod returns a URI that uniquely identifies the stored credential. This URI 
becomes a reference point for others to retrieve the VC in a verifiable manner.

To ensure integrity and non-repudiation, A then anchors the VC on a blockchain.
A broadcasts a message under their decentralized identifier (e.g., 
did:firefly:actorA), containing the URI of the VC and a cryptographic hash of 
its canonicaliz ed representation. The blockchain responds with metadata about the transaction 
(such as batch ID, message hash, and transaction state), thereby immutably 
recording a proof of the VC’s existence and integrity.

After successful anchoring, A notifies Actor B by sending a message that 
includes both the VC’s URI and the blockchain reference to the anchoring 
transaction. With these two references, B can independently verify the VC 
without relying on A’s direct authority.

The verification process involves four critical steps.
1.	Retrieval: Actor B fetches the VC directly from A’s Solid Pod using the
      provided URI.
2.	Blockchain Query: B retrieves the hash of the corresponding anchoring 
transaction from the blockchain.
3.	Local Hash Computation: B canonicalizes the fetched VC and computes its 
local hash value.
4.	Hash Comparison: B compares the locally computed hash with the one 
recorded on the blockchain.

If the two hash values match, B can confirm that the VC has not been altered 
since it was anchored, thus verifying both its authenticity and integrity. 
Through
this decentralized verification process, the system achieves a trustless 
assurance of data validity — without requiring centralized intermediaries.
