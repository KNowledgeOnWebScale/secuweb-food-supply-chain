<!-- omit in toc -->
# SecuWeb Demonstrator: Food Supply Chain

- [Introduction](#introduction)
- [Instructions](#instructions)
- [License](#license)

## Introduction

- [ ] Introduce SecuWeb project
- [ ] Explain demonstrator

## Instructions

Install.

```bash
# CLI A
npm i
```

Setup and start Miravi.

```bash
# CLI B
npm i
source env-localhost
./scripts/setup/finalize-setup.sh
cd ../poc-food-use-case-miravi/main
npm run dev
```

Spin up a clean CSS.

```bash
# Terminal C
# At repository root
rm -rf css/root
npm run pod
```

Start the hardhat node.

```bash
# Terminal D
cd secuweb-anchors
npm i
npx hardhat node
```

Redeploy contract and at least one event (in this case: registering a DID).
Then, start the verifier service.

```bash
# Terminal E
cd secuweb-anchors
npm run redeploy
npm run register
npm run server # start verifier service
```

Run flow.

```bash
# Terminal F
# At repository root
# Create each actor's VCs and store them on their pod
./src/flows/load-actor-data-into-solid-pods.sh
# Anchor each actor's VC on the chain
./src/flows/register-products-and-shipments.sh
# Verify
./dev.verify-vc.sh
```

Explore chain transactions.

```bash
# Terminal G
cd secuweb-anchors
npm run explore
```

## License

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/)
and released under the [MIT license](http://opensource.org/licenses/MIT).