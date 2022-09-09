# aptos-codegen

![workflow](https://gist.githubusercontent.com/horizonx-dev/0403f0d7cc7a5b7a02c6cd6d56546734/raw/3f8ebb1f2131828a878fb0ae2a416b3564f78f07/badge-statements.svg)
![workflow](https://gist.githubusercontent.com/horizonx-dev/0403f0d7cc7a5b7a02c6cd6d56546734/raw/e9dbd7c66f15425c69e0de58c68d33e3e288e759/badge-branches.svg)
![workflow](https://gist.githubusercontent.com/horizonx-dev/0403f0d7cc7a5b7a02c6cd6d56546734/raw/330a44e2c867f12bb9eabb1c60c9d1894c36acaf/badge-functions.svg)
![workflow](https://gist.githubusercontent.com/horizonx-dev/0403f0d7cc7a5b7a02c6cd6d56546734/raw/cbb01ce9164b8f28dd24ebc56094ad21ae0cce9d/badge-lines.svg)

```typescript
import { CoinModuleFactory } from './__generated__/CoinModuleFactory'

const coin = CoinModuleFactory.connect(signerOrClient)
coin.transfer({
  type_arguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: ['0x2', 99999999],
})

coin.getCoinInfo('0x1', '0x1::aptos_coin::AptosCoin')
// => {
//  type: '0x1::coin::CoinInfo<0x1::aptos_coin::AptosCoin>',
//  data: { ... }
// }

coin.getDepositEvents('0x1', { typeParameter: '0x1::aptos_coin::AptosCoin' })
// => [
//   { sequence_number: 1, data: { ... }, ... },
//   { sequence_number: 2, data: { ... }, ... },
// ]
```

## Installation

```
yarn add -D @horizonx/aptos-codegen
yarn add @horizonx/aptos-module-client
```

or

```
npm install --save-dev @horizonx/aptos-codegen
npm install @horizonx/aptos-module-client
```

## Usage

### CLI

```
aptos-codegen -m {module(s)} -o {output-dir} -u {node-url}
```

or

```
aptos-codegen -c {configuration-file}
```

#### Options

| Option(\*Required) | Description                                      | Examples                                   |
| ------------------ | ------------------------------------------------ | ------------------------------------------ |
| `-m`\*             | Module identifier(s).                            | `0x1::coin`, `0x1::coin 0x1::account`      |
| `-o`\*             | Output geeerated code to this directory.         | `__generated__`                            |
| `-u`\*             | Aptos node URL.                                  | `https://fullnode.devnet.aptoslabs.com/v1` |
| `-f`               | ABI file path pattern(s) (glob). (\*1)           | `abi/**/*.json`                            |
| `-c`               | Read options from this configuration file. (\*2) | `./aptos-codegen.json`                     |

\*1: ABIs loaded from files are referenced in preference to those loaded from the chain.

\*2: Configuration can be overwritten by arguments.

### Factory

| Function | Description                        | Arguments                                    |
| -------- | ---------------------------------- | -------------------------------------------- |
| connect  | creates the module client instance | `signerOrClient`: AptosClient or Signer(\*1) |

\*1 implements `signAndSubmitTransaction: (payload, options) => Promise`. \
You can use [aptos-wallet-connector](https://github.com/horizonx-tech/aptos-wallet-connector).

```typescript
import { CoinModuleFactory } from './__generated__/CoinModuleFactory'

const coin = CoinModuleFactory.connect(signerOrClient)
```
