# Quickstart: PoC + VC Anchoring

Setup and start Miravi.

```bash
# CLI A
source env-localhost

./scripts/setup/finalize-setup.sh
cd ../poc-food-use-case-miravi/main
npm run dev
```

Spin up a clean CSS.

```bash
# Terminal B
# At repository root
rm -rf css/root
npm run pod
```

Start the hardhat node.

```bash
# Terminal C
cd secuweb-anchors
npx hardhat node
```

Redeploy contract and at least one event (in this case: registering a DID).
Then, start the verifier service.

```bash
# Terminal D
cd secuweb-anchors
npm run redeploy
npm run register
npm run server # start verifier service
```

Run flow.

```bash
# Terminal E
# At repository root
# Create each actor's VCs and store them on their pod
./src/flows/flow1.sh
# Anchor each actor's VC on the chain
./dev.register-products-and-shipments.sh
# Verify
./dev.verify-vc.sh
```

Explore chain transactions.

```bash
# Terminal F
cd secuweb-anchors
npm run explore
```
