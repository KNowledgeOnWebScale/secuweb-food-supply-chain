<!-- omit in toc -->
# Food Supply Chain - PoC

- [Install](#install)
- [Usage](#usage)
  - [Setup](#setup)
- [Flows](#flows)
  - [Flow 1](#flow-1)
- [License (TODO)](#license-todo)

## Install

> Developed using Node: v20.19.5

```bash
# Install this package
npm i

# Install VC package
cd vc
npm i
```

## Usage

### Setup

Run setup.

```bash
# CLI 1
source env-localhost

./scripts/setup/finalize-setup.sh
```

Start Solid Pod(s).

```bash
# CLI 2
# Start from a clean CSS
rm -rf css/root
npm run pod
```

Register actors at BC and update WebID Profile:

```bash
./register-css-user.sh
```

Start Miravi.

```bash
# CLI 3
cd ../poc-food-use-case-miravi/main
npm run dev
```

## Flows

### Flow 1

Prelims:

- User A

- Given a data file, `X`

Steps:

1. Store `X` on Solid Pod, under container `<c>`

2. Create VC from `X`, resulting in `VC_X`

3. Store `VC_X` on Solid Pod, , under container `<c>/<vc>`

These above steps are executed in [`src/flows/flow1.sh`](src/flows/flow1.sh).

#### Usage

```bash
# TERMINAL A
# At repository root
rm -rf css/root
npm run pod
# [!] Wait for setup to complete
```

```bash
# TERMINAL B
# At repository root
./src/flows/flows1.sh
```

## License (TODO)

TODO
