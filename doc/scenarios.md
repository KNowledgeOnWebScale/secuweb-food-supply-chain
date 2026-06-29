# Scenarios

**Version**: 202606300117  
Green \= implemented  
Orange \= partially implemented  
Purple \= not implemented but low-hanging fruit  
Red \= not implemented  
Grey \= not directly tested, through proxy

| Technical aspect | DS | DG | INT | TR | LC |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Auditability | ●C | ●D |  | ●E ← C,D | ●F |
| Authentication | ●G | ●G,Q |  | ●I ← G,Q | ●J |
| Authorization | ●K | ●K,Q |  | ●M ← K,Q | ●N |
| Queryability | ○O |  | ●P |  |  |
| Discoverability |  | ●Q | ●R |  |  |
| Data API Interoperability (DAI) | ○ | ○ | ●S, T |  |  |
| Data Model Interoperability (DMI) | ○ | ○ | ●U |  | ○ |
| Verifiability | ●A | ○ V |  | ●B |  |

●: strong impact; ○ partial impact

**Note**: Trust (TR) is treated as a proxy design goal. TR scenarios are placed in the matrix as direct TR scenarios, and they carry explicit dependency references to the non-TR design-goal evidence they rely on.

## Design Goals

**DS –** \`\`Data sovereignty refers to meaningful control, ownership, claims to data, and enforcement of fundamental rights of data subjects. \[...\] Data ecosystems can offer mechanisms, such as authentication and authorization, to ensure control and ownership \[...\].''\~\\cite{chrysakis:2026:ExploringCuttingedgeData}  
In short, data sovereignty is the ability of an actor to control data and enforce conditions on its access and use.  
**DG –** \`\`Data governance is related to decision mechanisms to mandate responsibilities for participants as they arise from different data operations. It ensures data access through specific roles, decision rights, and accountability, usually denoted through a data governance model.''\~\\cite{chrysakis:2026:ExploringCuttingedgeData}  
In short, data governance mandates the set of rules, roles, and processes that define how data is managed and used.  
**INT –**  \`\`Data interoperability refers to the mutual understanding in the use of data between or within data ecosystems and contributes positively to the evolution of data ecosystems.''\~\\cite{chrysakis:2026:ExploringCuttingedgeData}  
In short, data interoperability entails the consistency with which data is exchanged and its meaning conveyed.  
**TR –** \`\`Trust is an enabler for the data economy, and as such, data ecosystems promote trustworthy data sharing, i.e., all participants need to agree on how they share their data. Trust introduces a fundamental social requirement towards building relationships among different participants within or across different data ecosystems.''\~\\cite{chrysakis:2026:ExploringCuttingedgeData}  
In short, trust is established through collective agreements on how data is shared between participants and their ability to verify compliance with those agreements.  
**LC –** \`\`Compliance with legislation is fundamental for building trust among data ecosystem participants when sharing data, as it prevents problems that arise due to noncompliance (e.g., fines). Without adhering to these principles, ensuring the proper function of data ecosystems becomes a formidable challenge, primarily due to the absence of trust, data incompatibilities, and data anarchy.''\~\\cite{chrysakis:2026:ExploringCuttingedgeData}  
In short, Legal Compliance supports trust by enforcing additional constraints to Data Governance, Data Sovereignty, and Interoperability.

## Actors

* Farmer  
* Transporter  
* Packager  
* Retailer  
* Audit assessor

## 

## Scenario Structure

- **Core Claim**: An abstract, high-level functional description of the scenario.  
- **Scenario**: A concrete use case scenario described in a technology-agnostic way.  
- **Scenario (detail)**: (Optional) A lower-level scenario description with technical details.  
- **Test Scenario Implementation Status**: Status description regarding the extent to which the considered test scenario has been implemented in the test framework.  
- **PoC Support**: (Optional) A side-note about the extent to which the PoC provides the functionality to support the scenario.  
- **Include in Analysis**: If True, the scenario test should be executed, and its outcome should be included in the coverage metrics. Otherwise (false), the test should be skipped.  
- **Primary Dependency**: (Optional) Design-goal and scenario reference containing the primary non-TR evidence on which a proxy TR scenario relies.  
- **Secondary Dependency**: (Optional) Design-goal and scenario reference containing additional non-TR evidence on which a proxy TR scenario relies.  
- **Supporting Requirement References**: (Optional) One or more related work references containing a requirement that strongly matches the current scenario.

## Scenario A – DS x Verifiability

**Core Claim**. The system supports data sovereignty by making the data holder’s control over a shared resource verifiable.

**Scenario**. The Farmer shares product data with the Packager. Before relying on the data, the Packager verifies that the data can be traced back to the Farmer as the responsible data holder. This allows the Packager to confirm that the data was not presented as Farmer-controlled data by an unrelated or unauthorized party.

**Scenario (detail)**. The Farmer stores product data and publishes a verifiable commitment for that data. When the Packager retrieves the product data, the Packager can verify that the commitment was issued by the Farmer’s registered identity, establishing that the data provenance is bound to the Farmer as data holder.

**Test Scenario Implementation Status.** A-1 Implemented. A-2 Defined.

**Include in Analysis**. True.

**Supporting Requirement References.** Req04 (integrity of data), Req05 (ability to verify data), Req18 (validation of attributes), Req20 (link signatures with attributes) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario B – TR x Verifiability

**Core Claim.** The system supports trust by allowing participants to verify that shared data is authentic and unchanged.

**Scenario.**  The Farmer shares product data with the Packager. Before relying on it, the Packager checks that the received data is the same data that was originally made available by the Farmer and that it has not been altered in transit or after publication.

**Scenario (detail).** The Farmer stores product data. The Packager retrieves the product data and verifies that the retrieved content matches a previously recorded verifiable commitment. If the content is modified, verification detects the mismatch.

**Test Scenario Implementation Status.** Implemented.

**Include in Analysis.** True.

**Primary Dependency**. DS via Scenario A.

**Supporting Requirement References.** Req02 (information quality), Req04 (integrity of data), Req05 (ability to verify data), Req06 (independent sources of information), Req09 (public ledger / blockchain) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario C – DS x Auditability

**Core Claim.** A data holder can inspect what happened to its shared data.

**Scenario.** The Farmer stores product data. The Farmer grants the Packager access to that product data. Later, the Farmer inspects whether only relevant data operations occurred: data access by the Packager, data update by the Farmer.

**Test Scenario Implementation Status.** TODO.

**Include in Analysis.** True.

## Scenario D – DG x Auditability

**Core Claim.** The system supports data governance by producing evidence that governance-related rules, roles, and decisions were followed or violated.

**Scenario.** Within the supply chain, only authorized actors may access or verify a shipment record. This is an extension of Scenario C: The auditor checks whether the recorded action corresponds to the expected governance process.

**Test Scenario Implementation Status.** TODO.

**PoC Support.**  
No governance rule/policy/role has been implemented in the PoC; neither are audit logs.  
Access requests and decisions are not recorded (not off-chain (e.g., a Solid Pod) or on-chain), nor made available so that an auditor role has access.

**Include in Analysis.** True.

## Scenario E – TR x Auditability

**Core Claim**. The system supports trust by enabling participants to tamper-evident evidence of past actions instead of having to blindly trust unilateral assertions.

**Scenario.** The Packager receives a product or shipment record from the Farmer. Instead of simply trusting that the Farmer’s current Pod content is unchanged, the Packager checks whether the corresponding event or resource hash was previously recorded and whether the retrieved content matches that evidence.

**Test Scenario Implementation Status.** Implemented on the data plane (i.e., domain-data). Not implemented on the control plane (i.e., actions).

**PoC Support**.  
A verifying actor can independently verify that the shared data is unchanged by i) verifying the digital signature of the shared data; and ii) verifying the hash of the shared data with the hash recorded on-chain.

**Include in Analysis**. True.

**Primary Dependency**. DS via Scenario C.

**Secondary Dependency**. DG via Scenario D.

**Supporting Requirement References.** Req06 (independent sources of information), Req09 (public ledger / blockchain) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario F – LC x Auditability {#scenario-f-–-lc-x-auditability}

**Core Claim.** The system facilitates legal compliance by producing technical evidence that can support accountability, reporting, or dispute resolution.

**Scenario**. A compliance assessor needs evidence about a data-sharing operation: who controlled the data, who accessed or received it, under which access condition, and whether the record was modified. The system provides a verifiable evidence package containing identity, access policy, event log, and resource reference.

**Test Scenario Implementation Status.** Not implemented.

**Include in Analysis.** True.

## Scenario G – DS x Authentication

**Core Claim**. The system supports data sovereignty by ensuring that data-control decisions are bound to authenticated actors.

**Scenario**. The Farmer stores product data. The Farmer grants access to the Packager. The system must prove that the access decision was made by the Farmer, not by an unauthenticated script, anonymous user, or wrongly assumed actor.

**Test Scenario Implementation Status.** Implemented (Solid Server \+ WAC).

**Include in Analysis.** True.

## Scenario H – DG x Authentication

**Core Claim**. The system supports data governance by making governance-related rules attributable to identifiable actors.

**Scenario**. A governance rule says that only certain actors may publish, share, update, or verify specific supply-chain records. For the rule to be meaningful, the system must know which actor performed the operation. For example, the Packager verifies a shipment record; the system records that the verification was performed by the Packager identity, not by an anonymous verifier.

**Test Scenario Implementation Status.** Partially implemented. The PoC supports governance-related attribution by linking allowed operations to actor identities. However, no explicit governance model (i.e., rules, roles, policies) are implemented.

**Include in Analysis**. False.

## Scenario I – TR x Authentication

**Core Claim.** The system supports trust by enabling actors to verify who asserted, shared, anchored a claim.

**Scenario**. The Packager receives a product/shipment credential or linked data resource. Before relying on it, the Packager must determine who asserted it: Farmer, Transporter, Packager, or another issuer. Authentication is therefore a prerequisite for trusting the claim.

**Scenario (detail)**: I-1 tests the WebID-DID binding by resolving the VC issuer WebID and querying its profile for an RDF triple like  
`<FarmerWebID#me>owl:sameAs  <did:secuweb:farmer> .`  
I-1 passes only if the result is exactly did:secuweb:farmer.  
I-2 adds the on-chain controller check for did:secuweb:farmer, but the bridge between “WebID profile says sameAs DID” and “this is a trusted identity binding” is currently a profile assertion, not a verifiable attestation.

**Test Scenario Implementation Status**. Partially implemented. The PoC supports authentication by enabling independent verification of an issuer’s identity, including the WebID-DID binding and on-chain DID controller check. Issuer accreditation is handled separately by Scenario V.

**Primary Dependency**. DS via Scenario G.

**Secondary Dependency**. DG via Scenario Q.

**Include in Analysis**. True.

**Supporting Requirement References.** Req03 (trust attribution), Req16 (verify service response), Req17 (retrieve public keys) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario J – LC x Authentication

**Core Claim**. The system supports compliance-relevant accountability by making actions attributable to responsible actors.

**Scenario.** A compliance assessor needs to determine who performed a data operation: who shared a resource, who granted access, who anchored a credential, or who verified a claim. The system provides identity evidence linking the operation to a responsible actor.

**Test Scenario Implementation Status.** Not implemented.

**Include in Analysis.** True.

**Note**. Related to [Scenario F – LC x Auditability](#scenario-f-–-lc-x-auditability) (F depends on J).

## Scenario K – DS x Authorization {#scenario-k-–-ds-x-authorization}

**Core Claim.** The system supports data sovereignty by allowing a data holder to determine who can access which data resource.

**Scenario.** The Farmer stores product data. The Farmer wants to share a specific resource with the Packager, but not with the Transporter. The system must enforce this actor-specific access decision.

**Test Scenario Implementation Status.** Implemented.

**Include in Analysis.** True.

**Supporting Requirement References.** Req21 (protection of attributes) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario L – DG x Authorization

**Core Claim**. The system supports data governance by operationalizing rules about which actors may perform which actions.

**Scenario**. A governance rule states that only the Packager may read a Farmer’s product data for packaging-related traceability, while other actors are excluded. The system must not merely store the rule; it must enforce it during access.

**Test Scenario Implementation Status.** Not Implemented.

**PoC Support.** Partially. The current PoC demonstrates access control through ACL rules. However, no data governance model stating organizational rules and roles is defined.

**Include in Analysis**. False.

## Scenario M – TR x Authorization

**Core Claim**. The system supports trust by allowing participants to define explicit authorization decision rules and, later, verify that access to a resource was granted according to these explicit rules.

**Scenario**. A Farmer stores a shipment record in its Solid Pod. The Packager requests access to that record. Access is granted only if the Packager is authorized according to a policy defined by the Farmer or by the applicable supply-chain governance rules.

A third party, such as an auditor or verifier, later checks that the Packager’s access was not arbitrary: it was based on an explicit authorization rule.

**Test Scenario Implementation Status.** Not Implemented.

**PoC Suport.** Explicit definition and enforcement of access control rules are provided through Solid. However, it does not allow an auditor to later verify that an access grant was based on an explicit authorization rule.

**Include in Analysis**. True.

**Primary Dependency**. DS via Scenario K.

**Secondary Dependency**. DG via Scenario Q.

## Scenario N – LC x Authorization

**Core Claim**. The system facilitates legal compliance by the ability to encode compliance-relevant constraints such as confidentiality, purpose limitation, data minimization.

**Scenario** (confidentiality) – See [Scenario K – DS x Authorization](#scenario-k-–-ds-x-authorization).

**Scenario** (purpose limitation) – Farmer provides a legal assessor access to internal process information (e.g., periods and use of pesticides and fertilization).

**Scenario** (data minimization) – Farmer provides Packager with information relevant to a transported product batch that needs to be packaged (e.g., general product information such as quantity and weight, but not the location of originating farm lot)).

**Test Scenario Implementation Status.**

- Confidentiality (N-1): Implemented.  
- Purpose limitation (N-2): Not Implemented.  
- Data minimization (N-3): Implemented.

**PoC Support.**  
Confidentiality (N-1): A data holder can specify which actor has access to a resource using the actor’s WebID.

Purpose limitation (N-2) and data minimization (N-3) are partially supported, although not explicitly implemented. Actors create and share purpose-based/minimized views of their data. This can be explicitly implemented through Verifiable Credentials, i.e., using the `termsOfUse` property[^1] (to indicate the purpose) and applying selective disclosure (for data minimization).

**Include in Analysis.** True.

**Supporting Requirement References.** Req11 (privacy by design), Req21 (protection of attributes) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario O – DS x Queryability

**Core Claim.** The system supports data sovereignty by allowing actors to select subsets of data rather than full-resource retrieval. The query result remains constrained by the access rights granted by the data holder.

**Scenario.** A Transporter stores pickup and delivery events from multiple shipments as separate resources. A Retailer needs transport information about a specific product batch, but does not need the Transporter’s complete event history in the matching event records. 

**Test Scenario Implementation Status.** Implemented.

**Include in Analysis**. True.

## Scenario P – INT x Queryability

**Core Claim.** The system supports interoperability by allowing actors to selectively retrieve relevant supply-chain data across decentralized resources. This scenario crosses organizational and storage boundaries while presenting the requester with one logical query result.

**Scenario.** Given a product batch, a Retailer issues a query to reconstruct selected transportation provenance from authorized resources distributed across the Farmer, Packager, Transporter, and Retailer data stores.

**Test Scenario Implementation Status.** Implemented.

**Include in Analysis.** True.

**Supporting Requirement References.** Req08 (decentralized information) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario Q – DG x Discoverability

**Core Claim.** The system supports data governance by making governance-relevant actors, resources, policies, and service endpoints discoverable.

**Scenario**. A Packager expects a shipment from a Farmer and needs the corresponding shipment record. The Packager consults a governance-controlled registration. Using the shipment identifier and its role as shipment destination, the Packager discovers the authoritative resource.

**Test Scenario Implementation Status.** Test scenario implemented.

**Include in Analysis.** True.

## Scenario R – INT x Discoverability

**Core Claim**. The architecture supports interoperability by allowing systems to find relevant data resources and service endpoints across organizational boundaries.

**Scenario**. Given the identifier of a packaged product batch and one known consortium discovery entry point, an authenticated retailer discovers every registered resource needed to reconstruct that batch's transportation provenance across the Farmer, Packager, Transporter, and Retailer data stores.

**Test Scenario Implementation Status.** Test scenario implemented

**Include in Analysis.** True.

**Supporting Requirement References.** Req08 (decentralized information) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

## Scenario S – INT x Data API Interoperability (data)

**Core Claim.** The architecture supports interoperability by exposing data through standardized data APIs.

**Scenario**. A Packager needs to retrieve shipment data from a Farmer and transport data from a Transporter. Instead of calling different system-specific APIs for each actor, the same data interaction pattern can be used to query any other actor. It prevents the need for a client to be tailored to bespoke operations, each with its own request/response scheme and SDK.

**Test Scenario Implementation Status.** Implemented.

**Include in Analysis.** True.

## Scenario T – INT x Data API Interoperability (verification)

**Core Claim.** The system supports interoperability by exposing verification evidence through a standard API pattern aligned with the domain-data access pattern.

**Scenario.** After retrieving product or shipment data, the client retrieves the corresponding verification evidence through a uniform API. The client does not need to know whether the evidence is backed by a blockchain, verifier service, database, or other implementation-specific component.

**Test Scenario Implementation Status**. Not implemented.

**PoC Support**. Scenario T requires a uniform adapter interface on top of the blockchain API.

**Include in Analysis**. True.

## Scenario U – INT x Data Model Interoperability

**Core Claim.** The system supports interoperability by ensuring that supply-chain data exchanged by different actors retain the same meaning across organizational boundaries.

**Scenario**. The retailer reconstructs the provenance of a product batch using data from different actors across the supply chain. The farmer shares product data, the transporter shares transport-event data, and the packager publishes packaging-event data. Although these data are stored across organizational boundaries, potentially using actor/domain-specific models. The shared identifiers and semantic data models are resolvable over the Web, enabling actors uniquely reference and resolve any kind of domain data (e.g., products, shipments, events, etc.) while retaining the correct semantics.

**Test Scenario Implementation Status.** Partially implemented. U-1 is implemented. U-2 is executable and currently exposes missing EPCIS vocabulary usage in the transporter event fixtures.

**Include in Analysis.** True.

## Scenario V – DG x Verifiability

**Core Claim.** The system allows an actor to independently verify the governance rule about issuer accreditation/eligibility. For example, a governance rule stating that only an accredited farmer is entitled to issue product-origin data.

**Scenario**. Packager receives product-origin data for a product batch. Before accepting the data, the Packager verifies that the issuer is effectively accredited to issue product-origin data as described by a governance model.

**Scenario (detail)**.  
V-1: The governance model accredits the Farmer to issue product-origin data. The packager is able to verify this accreditation.  
V-2: A Packager rejects product-origin data because the Farmer is no longer accredited to issue it (hence, the Farmer’s accreditation has been revoked).

**Test Scenario Implementation Status.**  
V-1: Implemented.  
V-2: Not Implemented.

**Include in Analysis.** True.

**Supporting Requirement References.** Req08 (decentralized information) in \~\\cite{hofmeier:2024:DistINAnalysisValidation}

[^1]:  [https://www.w3.org/TR/vc-data-model-2.0/\#terms-of-use](https://www.w3.org/TR/vc-data-model-2.0/#terms-of-use) 