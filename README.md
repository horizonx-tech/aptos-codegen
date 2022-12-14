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

| Option(\*Required) | Description                                                              | Examples                                               |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `-m`\*             | Module identifier(s).                                                    | `0x1::coin`, `0x1::coin 0x1::account`                  |
| `-o`\*             | Output generated code to this directory.                                 | `__generated__`                                        |
| `-u`\*             | Aptos node URL.                                                          | `https://fullnode.devnet.aptoslabs.com/v1`             |
| `-f`               | ABI file path pattern(s) (glob). (\*1)                                   | `abi/**/*.json`                                        |
| `-a`               | Directory name alias(es) of an address for duplicate name modules. (\*2) | `0x1=framework`                                        |
| `-t`               | Generation target(s) of code. `entryFunctions`/`getters`/`utilities`     | `entryFunctions`, `entryFunctions utilities`           |
| `--minify-abi`     | Minify ABI output to factory.                                            | -                                                      |
| `-c`               | Read options from this configuration file. (\*3)                         | `./aptos-codegen.json` ([example](aptos-codegen.json)) |

\*1: ABIs loaded from files are referenced in preference to those loaded from the chain.

\*2: By default, files are output to address dir if a duplicate name module is included.

\*3: Configuration can be overwritten by arguments.

### Factory of Module Interface

| Function | Description                        | Arguments                                    |
| -------- | ---------------------------------- | -------------------------------------------- |
| connect  | creates the module client instance | `signerOrClient`: AptosClient or Signer(\*1) |

\*1 `Signer` is a implementation of `signAndSubmitTransaction: (payload, options) => Promise<string | { hash: string }>`, \
such as [aptos-wallet-connector](https://github.com/horizonx-tech/aptos-wallet-connector) or [aptos-wallet-adapter](https://github.com/hippospace/aptos-wallet-adapter).

```typescript
import { CoinModuleFactory } from './__generated__/CoinModuleFactory'

const coin = CoinModuleFactory.connect(signerOrClient)

// You can overwrite address of module
const coin = CoinModuleFactory.connect(signerOrClient, "0xAnotherAddress")
```

### Utils of Module

| Function | Description                  | Arguments                |
| -------- | ---------------------------- | ------------------------ |
| isXXX    | a type guard of the resource | `resource`: MoveResource |


### Common Utils
| Function              | Description                                         | Arguments                 |
| --------------------- | --------------------------------------------------- | ------------------------- |
| extractTypeParameters | extract type parameters string of the resource type | `type`: MoveResource.type |
| typeToString          | convert parsed type to string                       | `type`: ParsedType        |
| parseTypeStr          | parse type str                                      | `type`: MoveResource.type |

```typescript
import { Types } from 'aptos'
import { CoinUtils } from './__generated__/CoinUtils'
import { extractTypeParameters, parseTypeStr, typeToString } from 'src/libs/modules/__generated__/utils'

const coinUtils = new CoinUtils() // or new CoinUtils("0xAnotherAddress")

const resources: Types.MoveResource[] = [
  { type: "0x1::coin::CoinInfo<0x123456::coin::CoinA>", data: { symbol: "CoinA", ...} },
  { type: "0x1::coin::CoinInfo<0x123456::coin::CoinB>", data: { symbol: "CoinB", ...} },
  { type: "0x123456::type::SomeType", data: {...} },
  ...
]

if (coinUtils.isCoinInfo(resources[0])) {
  console.log(resources[0].data.symbol) // You can access as CoinInfo
}

resources.filter(coinUtils.isCoinInfo)
  .forEach((resource) => console.log(resource.data.symbol))  // You can access as CoinInfo

const coins = resources.filter(coinUtils.isCoinInfo).map(({ type }) => {
  const parsedTypes = extractTypeParameters(type)
  return parsedTypes.type
})
console.log(coins) // ["0x123456::coin::CoinA", "0x123456::coin::CoinB"]

const exampleStruct = { type: "0x1::exmaple::Example<0x123456::coin::CoinA, 0x1::coin::CoinInfo<0x123456::coin::CoinB>>", data: {...} }
const parsedType = parseTypeStr(coinA.type)
console.log(parsedType) 
  // { 
  //   type: "0x1::coin::Example",
  //   genericTypes: [
  //     { type: "0x123456::coin::CoinA" },
  //     { type: "0x1::coin::CoinInfo", genericTypes: [{ type: "0x123456::coin::CoinB" }] }
  //   ]
  // }
console.log(typeToString(parsedType)) // "0x1::exmaple::Example<0x123456::coin::CoinA, 0x1::coin::CoinInfo<0x123456::coin::CoinB>>"
```
