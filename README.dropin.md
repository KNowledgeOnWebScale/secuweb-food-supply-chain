# Drop-in: Bash Adapter for Anchoring (no build required)

This replaces the TypeScript adapter with a plain Bash wrapper to run Hardhat **inside `./secuweb-anchors`**.

## Files
- `src/scripts/anchor.external.sh`
- `src/flows/flow1+anchor.sh` (updated)

## Usage
```bash
unzip -o poc-dropin-bash-anchor.zip -d .
chmod +x src/scripts/anchor.external.sh src/flows/flow1+anchor.sh

# Terminal A
cd secuweb-anchors
npx hardhat node

# Terminal B (repo root)
./src/flows/flow1+anchor.sh
```
This version no longer depends on any compiled TypeScript for the anchoring step.
