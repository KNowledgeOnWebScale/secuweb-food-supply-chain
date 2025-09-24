<!-- omit in toc -->
# Food Supply Chain - PoC

- [Install](#install)
- [Usage](#usage)
  - [Setup](#setup)
- [Flows](#flows)
  - [Flow 1](#flow-1)
- [License (TODO)](#license-todo)

## Install

```bash
# Install this package
npm i

# Install VC package
cd vc
npm i
```

## Usage

### Setup

```bash
# Start from a clean CSS
rm -rf css/root
npm run pod
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

## License (TODO)

TODO
