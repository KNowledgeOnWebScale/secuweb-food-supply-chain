# Drop-in: Batch Anchoring for all VCs

Anchors every VC under `src/flows/output/**/vc/*.jsonld` by delegating to the existing Bash adapter
that runs Hardhat **inside `./secuweb-anchors`**.

## Files
- `src/scripts/anchor-all.sh` — scans output tree and anchors each VC
- `src/flows/flow1+anchor-all.sh` — runs your existing `flow1.sh` then batch-anchors
  (requires your existing `src/scripts/anchor.external.sh` from the previous drop-in)

## Usage
```bash
unzip -o poc-dropin-batch-anchor.zip -d .
chmod +x src/scripts/anchor-all.sh src/flows/flow1+anchor-all.sh

# Terminal A
cd secuweb-anchors
npx hardhat node

# Terminal B (repo root)
./src/flows/flow1+anchor-all.sh     # issue/upload then anchor all

# or just anchor everything without re-running flow1
./src/scripts/anchor-all.sh
```

### Env knobs
- `ANCHOR_REPO` — path to `./secuweb-anchors` (defaults to repo root + that folder)
- `SUBJECT_DID` — if set, use this DID for all anchors
- `SUBJECT_DID_BASE` — base for auto-derived DIDs when `SUBJECT_DID` is unset
- `METADATA_URI` — optional pointer (e.g., Solid URL) stored alongside the hash
