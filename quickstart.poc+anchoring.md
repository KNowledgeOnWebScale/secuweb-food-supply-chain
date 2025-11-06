# Quickstart: PoC + VC Anchoring

Spin up a clean CSS.

```bash
# Terminal A
# At repository root
rm -rf css/root
npm run pod
```

Start the hardhat node.

```bash
# Terminal B
cd secuweb-anchors
npx hardhat node
```

Redeploy contract and produce at least one event (in this case: registering a DID).

```bash
# Terminal C
cd secuweb-anchors
npm run redeploy
npm run register
```

Run flow.

```bash
# Terminal D
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
# Terminal E
cd secuweb-anchors
npm run explore
```
