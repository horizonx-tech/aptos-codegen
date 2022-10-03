import { MoveType } from 'aptos/dist/generated'

export const JS_NATIVE_TYPES = ['boolean', 'string', 'Array', 'any']

export const RESERVERD_MODULES = [
  { key: 'aptos', types: ['BCS', 'MaybeHexString', 'Types'] },
  {
    key: '@horizonx/aptos-module-client',
    types: [
      'AptosModuleClient',
      'TypedMoveResource',
      'TypedEvent',
      'EventGetterParams',
    ],
  },
]

export const RESERVED_TYPE_DICT: Partial<Record<MoveType, string>> = {
  bool: 'boolean',
  u8: 'BCS.Uint8',
  u16: 'BCS.Uint16',
  u32: 'BCS.Uint32',
  u64: 'BCS.Uint64',
  u128: 'BCS.Uint128',
  address: 'MaybeHexString',
  vector: 'Array',
  '0x1::string::String': 'string',
}

export const RESOURCE_TYPE_REGEX = /^(\w*::\w*::\w*)(?:<(.*)>)?/
export const TYPE_PARAMETER_REGEX = /^T[0-9]+$/
