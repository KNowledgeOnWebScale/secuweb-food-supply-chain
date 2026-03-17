# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-17

### Fixed

- Updated the `vc` and `secuweb-anchors` submodule URLs from SSH to HTTPS so
  the FSC repository and its submodules can be cloned recursively on a more restrictive lab infrastructure without SSH access errors.

## [1.0.0] - 2026-03-16

Initial stable release of the SecuWeb food supply chain demonstrator.

### Added

- End-to-end demonstrator for controlled data sharing across a food supply chain
  using Solid Pods, Verifiable Credentials, and blockchain anchoring.
- Actor flows and sample data for farmer, packager, transporter, and retailer
  perspectives, including shipment, product, transport-event, and receipt data.
- Integration with the `secuweb-anchors` and `vc` submodules for DID setup,
  credential issuance, proof verification, and on-chain hash anchoring.
- Miravi viewer integration and walkthrough documentation for inspecting data
  from the perspective of different authenticated actors.
- Utility scripts for credential creation, ACL management, canonical hashing,
  JSON-LD expansion, blockchain exploration, and setup automation.
- Automated README smoke tests and GitLab CI coverage for validating the
  documented local setup flow.

### Changed

- Expanded the demonstrator scope from the initial PoC into a more complete
  SecuWeb food supply chain scenario with retailer and transporter actors.
- Hardened local developer setup with repository path auto-detection, improved
  viewer setup, and safeguards to avoid destructive local clone operations.
- Refined access-control modeling and walkthrough documentation to reflect the
  intended least-privilege data sharing rules between actors.

### Fixed

- Corrected build and script wiring so utility sources, flow scripts, and
  supporting setup commands execute consistently from the repository root.
- Improved setup instructions, submodule references, and verifier/viewer
  integration points across the repository documentation.
- Addressed data publication and access issues so the expected shipment and
  credential resources are exposed to the intended downstream actors.
