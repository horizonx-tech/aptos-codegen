import { MoveStruct, MoveStructField } from 'aptos/dist/generated'
import {
  factoryFileName,
  hasEventHandle,
  hasTypeParameters,
  isEventHandle,
  isEventHandleFieldStruct,
  isJsNativeType,
  isResource,
  isString,
  isTypeParameter,
  notSigner,
  parseFromResourceType,
  toModuleId,
  toModuleMapKey,
  toPath,
  toReservedType,
  toReservedTypeOrAny,
  typesFileName,
  utilitiesFileName,
} from 'src/generator/utils'
import { StructFieldStruct } from 'src/types'

describe('utils', () => {
  describe('isString', () => {
    it('returns true if type of arg is string', () => {
      expect(isString('string')).toBeTruthy()
    })
    it('returns false if type of arg is not string', () => {
      expect(isString(0)).toBeFalsy()
    })
  })
  describe('isResource', () => {
    const struct: MoveStruct = {
      name: 'Example',
      abilities: [],
      fields: [],
      is_native: false,
      generic_type_params: [],
    }
    it('returns true if struct has "key" ability', () => {
      expect(isResource({ ...struct, abilities: ['key'] })).toBeTruthy()
    })
    it('otherwise returns false', () => {
      expect(isResource(struct)).toBeFalsy()
      expect(isResource({ ...struct, abilities: ['store'] })).toBeFalsy()
    })
  })
  describe('isEventHandle', () => {
    const struct: MoveStructField = {
      name: 'example_events',
      type: 'u8',
    }
    it('returns true if type of field is "0x1::event::EventHandle"', () => {
      expect(
        isEventHandle({
          ...struct,
          type: '0x1::event::EventHandle<0x1::example::ExampleEvent>',
        }),
      ).toBeTruthy()
    })
    it('otherwise returns false', () => {
      expect(isEventHandle(struct)).toBeFalsy()
    })
  })
  describe('hasEventHandle', () => {
    const struct: MoveStruct = {
      name: 'Example',
      abilities: [],
      fields: [{ name: 'example_events', type: 'u8' }],
      is_native: false,
      generic_type_params: [],
    }
    it('returns true if struct has one or more event handle fields', () => {
      expect(
        hasEventHandle({
          ...struct,
          fields: [
            {
              ...struct.fields[0],
              type: '0x1::event::EventHandle<0x1::example::ExampleEvent>',
            },
          ],
        }),
      ).toBeTruthy()
    })
    it('otherwise returns false', () => {
      expect(hasEventHandle(struct)).toBeFalsy()
    })
  })
  describe('isEventHandleFieldStruct', () => {
    const struct: StructFieldStruct = {
      name: 'example_events',
      type: 'u8',
    }
    it('returns true if type of field is "0x1::event::EventHandle"', () => {
      expect(
        isEventHandleFieldStruct({
          ...struct,
          type: {
            moduleId: '0x1::event',
            name: 'EventHandle',
            genericTypes: ['0x1::sample::ExampleEvent'],
          },
        }),
      ).toBeTruthy()
    })
    it('otherwise returns false', () => {
      expect(isEventHandleFieldStruct(struct)).toBeFalsy()
      expect(
        isEventHandleFieldStruct({
          ...struct,
          type: {
            moduleId: '0x2::event',
            name: 'EventHandle',
            genericTypes: ['0x1::sample::ExampleEvent'],
          },
        }),
      ).toBeFalsy()
      expect(
        isEventHandleFieldStruct({
          ...struct,
          type: {
            moduleId: '0x1::event',
            name: 'Other',
            genericTypes: ['0x1::sample::ExampleEvent'],
          },
        }),
      ).toBeFalsy()
    })
  })
  describe('notSigner', () => {
    it('returns true if arg is not "&signer"', () => {
      expect(notSigner('dummy')).toBeTruthy()
    })
    it('returns false if arg is  "&signer"', () => {
      expect(notSigner('&signer')).toBeFalsy()
    })
  })
  describe('isJsNativeType', () => {
    it('returns true if arg is javasctipt native type', () => {
      expect(isJsNativeType('boolean')).toBeTruthy()
      expect(isJsNativeType('string')).toBeTruthy()
      expect(isJsNativeType('Array')).toBeTruthy()
      expect(isJsNativeType('any')).toBeTruthy()
    })
    it('returns false if arg is not javasctipt native type', () => {
      expect(isJsNativeType('BCS.Uint8')).toBeFalsy()
      expect(isJsNativeType('0x:::coin::CoinInfo')).toBeFalsy()
    })
  })
  describe('isTypeParameter', () => {
    it('returns true if arg is matched to "^T[0-9]+$"', () => {
      expect(isTypeParameter('T0')).toBeTruthy()
      expect(isTypeParameter('T99')).toBeTruthy()
    })
    it('returns false if arg is not matched to "^T[0-9]+$"', () => {
      expect(isTypeParameter('T0Type')).toBeFalsy()
      expect(isTypeParameter('TypeT0')).toBeFalsy()
    })
  })
  describe('toReservedType', () => {
    it('returns reserved type if arg matches', () => {
      expect(toReservedType('bool')).toBe('boolean')
      expect(toReservedType('u8')).toBe('BCS.Uint8')
      expect(toReservedType('u16')).toBe('BCS.Uint16')
      expect(toReservedType('u32')).toBe('BCS.Uint32')
      expect(toReservedType('u64')).toBe('BCS.Uint64')
      expect(toReservedType('u128')).toBe('BCS.Uint128')
      expect(toReservedType('address')).toBe('MaybeHexString')
      expect(toReservedType('vector')).toBe('Array')
      expect(toReservedType('0x1::string::String')).toBe('string')
    })
    it('returns undefined if arg does not match', () => {
      expect(toReservedType('0x1::coin::Coin')).toBeUndefined()
    })
  })
  describe('toReservedTypeOrAny', () => {
    it('returns reserved type if arg matches', () => {
      expect(toReservedTypeOrAny('bool')).toBe('boolean')
      expect(toReservedTypeOrAny('u8')).toBe('BCS.Uint8')
      expect(toReservedTypeOrAny('u16')).toBe('BCS.Uint16')
      expect(toReservedTypeOrAny('u32')).toBe('BCS.Uint32')
      expect(toReservedTypeOrAny('u64')).toBe('BCS.Uint64')
      expect(toReservedTypeOrAny('u128')).toBe('BCS.Uint128')
      expect(toReservedTypeOrAny('address')).toBe('MaybeHexString')
      expect(toReservedTypeOrAny('vector')).toBe('Array')
      expect(toReservedTypeOrAny('0x1::string::String')).toBe('string')
    })
    it('returns any if arg does not match', () => {
      expect(toReservedTypeOrAny('0x1::coin::Coin')).toBe('any')
    })
  })
  describe('hasTypeParameters', () => {
    it('returns true if arg has type parmeters', () => {
      expect(
        hasTypeParameters({
          name: 'example',
          genericTypes: ['T0'],
        }),
      ).toBeTruthy()
      expect(hasTypeParameters('T99')).toBeTruthy()
    })
    it('returns false if arg does not have a type parmeter', () => {
      expect(
        hasTypeParameters({
          name: 'example',
          genericTypes: ['u8'],
        }),
      ).toBeFalsy()
      expect(hasTypeParameters('u8')).toBeFalsy()
    })
  })
  describe('parseFromResourceType', () => {
    it('can parse from resourceType', () => {
      expect(parseFromResourceType('0x1::coin::CoinInfo')).toEqual({
        moduleId: `0x1::coin`,
        structName: 'CoinInfo',
      })
    })
    it('can parse generic types', () => {
      expect(
        parseFromResourceType(
          '0x1::example::Generics<u8, 0x1::example::Generics<address>>',
        ),
      ).toEqual({
        moduleId: `0x1::example`,
        structName: 'Generics',
        genericTypesStr: 'u8, 0x1::example::Generics<address>',
      })
    })
    it('returns undefined if arg does not match', () => {
      expect(parseFromResourceType('vector<u8>')).toBeUndefined()
    })
  })
  describe('toModuleMapKey', () => {
    it('returns itself or parent of reserved type if arg matches', () => {
      expect(toModuleMapKey('bool')).toBe('boolean')
      expect(toModuleMapKey('u8')).toBe('BCS')
      expect(toModuleMapKey('u128')).toBe('BCS')
      expect(toModuleMapKey('address')).toBe('MaybeHexString')
      expect(toModuleMapKey('0x1::string::String')).toBe('string')
    })
    it('returns moduleId if arg is module', () => {
      expect(toModuleMapKey('0x1::aptos_coin::AptosCoin')).toBe(
        '0x1::aptos_coin',
      )
    })
    it('otherwise returns arg itself', () => {
      expect(toModuleMapKey('any')).toBe('any')
    })
  })
  describe('toModuleId', () => {
    it('returns moduleId if contains', () => {
      expect(toModuleId('0x1::aptos_coin::AptosCoin')).toBe('0x1::aptos_coin')
      expect(toModuleId('0x1::coin::transfer')).toBe('0x1::coin')
    })
    it('otherwise returns undefined', () => {
      expect(toModuleId('vector')).toBeUndefined()
    })
  })
  describe('typesFileName', () => {
    it('returns as a file name of types', () => {
      const moduleName = 'Coin'
      expect(typesFileName(moduleName)).toBe(`${moduleName}.ts`)
    })
  })
  describe('utilitiesFileName', () => {
    it('returns as a file name of utilities', () => {
      const moduleName = 'Coin'
      expect(utilitiesFileName(moduleName)).toBe(`${moduleName}Utils.ts`)
    })
  })
  describe('factoryFileName', () => {
    it('returns as a file name of factory', () => {
      const moduleName = 'Coin'
      expect(factoryFileName(moduleName)).toBe(`${moduleName}ModuleFactory.ts`)
    })
  })
  describe('toPath', () => {
    const filePath = 'path'
    it('returns as a file path with prefix', () => {
      expect(toPath(filePath)).toBe(`./${filePath}`)
      expect(toPath(filePath, './custom/')).toBe(`./custom/${filePath}`)
    })
  })
})
