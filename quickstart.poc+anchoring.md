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
 ./src/flows/flow1+anchor-all.sh
```

Explore chain transactions.

```bash
# Terminal E
cd secuweb-anchors
npm run explore
```
