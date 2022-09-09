import {
  extractDependencies,
  extractIdentifiersFromGenericTypeStr,
  extractTypeNameRecursive,
  parseFromABI,
  toTypeStruct,
} from 'src/generator/parser'
import {
  EventStruct,
  FunctionStruct,
  ResourceStruct,
  StructStruct,
  TypeStruct,
} from 'src/types'
import { MOCK_ABI } from '../__mocks__/abi'

describe('parser', () => {
  describe('parseFromABI', () => {
    it('can parse from ABI', () => {
      const module = parseFromABI(MOCK_ABI)
      expect(module.id).toBe(`${MOCK_ABI.address}::${MOCK_ABI.name}`)
      expect(module.name).toBe(`Coin`)
      expect(module.entryFunctions).toHaveLength(1)
      expect(module.resources).toHaveLength(2)
      expect(module.structs).toHaveLength(5)
      expect(module.dependencies).toHaveLength(10)
    })
  })
  describe('toTypeStruct', () => {
    it('returns arg itself if arg is matched to reserved type or type parameter', () => {
      expect(toTypeStruct('bool')).toBe('bool')
      expect(toTypeStruct('u8')).toBe('u8')
      expect(toTypeStruct('u16')).toBe('u16')
      expect(toTypeStruct('u32')).toBe('u32')
      expect(toTypeStruct('u64')).toBe('u64')
      expect(toTypeStruct('u128')).toBe('u128')
      expect(toTypeStruct('address')).toBe('address')
      expect(toTypeStruct('0x1::string::String')).toBe('0x1::string::String')
      expect(toTypeStruct('T0')).toBe('T0')
      expect(toTypeStruct('T99')).toBe('T99')
    })
    it('returns name and generic types without module id if arg starts with vector', () => {
      expect(toTypeStruct('vector<u8>')).toEqual({
        name: 'vector',
        genericTypes: ['u8'],
      })
      expect(toTypeStruct('vector<0x1::simple_map::Element<T0, T1>>')).toEqual({
        name: 'vector',
        genericTypes: [
          {
            moduleId: '0x1::simple_map',
            name: 'Element',
            genericTypes: ['T0', 'T1'],
          },
        ],
      })
    })
    it('returns module id and name and generic types if arg is struct', () => {
      expect(toTypeStruct('0x1::aptos_coin::AptosCoin')).toEqual({
        moduleId: '0x1::aptos_coin',
        name: 'AptosCoin',
        genericTypes: [],
      })
    })
    it('returns generic types recursive', () => {
      expect(
        toTypeStruct(
          '0x1::example::Generics<vector<u8>, 0x1::example::Generics<address, bool>>',
        ),
      ).toEqual({
        moduleId: '0x1::example',
        name: 'Generics',
        genericTypes: [
          { name: 'vector', genericTypes: ['u8'] },
          {
            moduleId: '0x1::example',
            name: 'Generics',
            genericTypes: ['address', 'bool'],
          },
        ],
      })
    })
    it('returns "any" if arg is unexpected or unsupported', () => {
      expect(toTypeStruct('&0x1::coin::FreezeCapability<T0>')).toBe('any')
      expect(toTypeStruct('Unexpected')).toBe('any')
    })
  })
  describe('extractIdentifiersFromGenericTypeStr', () => {
    it('can extract type names', () => {
      expect(
        extractIdentifiersFromGenericTypeStr('u8, 0x1::aptos_coin::AptosCoin'),
      ).toEqual(['u8', '0x1::aptos_coin::AptosCoin'])
    })
    it('can extract genetic type names', () => {
      expect(extractIdentifiersFromGenericTypeStr('vector<u8>')).toEqual([
        'vector<u8>',
      ])
    })
    it('can extract multiple generic types', () => {
      expect(
        extractIdentifiersFromGenericTypeStr(
          '0x1::exmple::Generics<address, bool>, 0x1::aptos_coin::AptosCoin',
        ),
      ).toEqual([
        '0x1::exmple::Generics<address, bool>',
        '0x1::aptos_coin::AptosCoin',
      ])
    })
    it('can extract nested multiple generic types', () => {
      expect(
        extractIdentifiersFromGenericTypeStr(
          '0x1::exmple::Generics<0x1::exmple::Generics<u8, test, address>, 0x1::exmple::Generics<bool, u128>>, 0x1::aptos_coin::AptosCoin',
        ),
      ).toEqual([
        '0x1::exmple::Generics<0x1::exmple::Generics<u8, test, address>, 0x1::exmple::Generics<bool, u128>>',
        '0x1::aptos_coin::AptosCoin',
      ])
    })
    it('throw error if arg is malformed', () => {
      expect(() =>
        extractIdentifiersFromGenericTypeStr('vector<u8, address'),
      ).toThrowError()
    })
  })
  describe('extractDependencies', () => {
    it('can extract types from entryFunctions and structs except self-defined types', () => {
      const moduleId = '0x::coin'
      const entryFunctions: FunctionStruct[] = [
        { name: '0x1::coin::transfer', args: ['address', 'u64'] },
      ]
      const resources: ResourceStruct[] = []
      const events: EventStruct[] = []
      const structs: StructStruct[] = [
        {
          name: '0x1::coin::Example',
          fields: [
            {
              name: 'example',
              type: {
                moduleId: '0x1::option',
                name: 'Option',
                genericTypes: ['u8'],
              },
            },
          ],
        },
      ]
      const dependencies = extractDependencies(
        moduleId,
        entryFunctions,
        resources,
        events,
        structs,
      )
      expect(dependencies).toEqual([
        'address',
        'u64',
        '0x1::option::Option',
        'u8',
        'AptosModuleClient',
      ])
    })
    it('add "address" and "TypedMoveResource" if resources is not empty', () => {
      const moduleId = '0x::example'
      const resources: ResourceStruct[] = [{ name: '0x1::example::Example' }]

      expect(extractDependencies(moduleId, [], resources, [], [])).toEqual([
        'address',
        'TypedMoveResource',
        'AptosModuleClient',
      ])
      expect(extractDependencies(moduleId, [], [], [], [])).toHaveLength(0)
    })
    it('add "TypedEvent" and "EventGetterParams", if events is not empty', () => {
      const moduleId = '0x::example'
      const events: EventStruct[] = [
        {
          name: 'example_events',
          type: {
            moduleId: '0x1::event',
            name: 'EventHandle',
            genericTypes: [
              {
                moduleId: '0x1::example',
                name: 'ExampleEvent',
                genericTypes: [],
              },
            ],
          },
        },
      ]
      expect(extractDependencies(moduleId, [], [], events, [])).toEqual([
        'TypedEvent',
        'EventGetterParams',
      ])
      expect(extractDependencies(moduleId, [], [], [], [])).toHaveLength(0)
    })
    it('add "AptosModuleClient" if entryFunctions or resources are not empty', () => {
      const moduleId = '0x::example'
      const entryFunctions: FunctionStruct[] = [
        { name: '0x1::example::example', args: [] },
      ]
      const resources: ResourceStruct[] = [{ name: '0x1::example::Example' }]
      const structs: StructStruct[] = []

      expect(
        extractDependencies(moduleId, entryFunctions, [], [], structs),
      ).toEqual(['AptosModuleClient'])
      expect(extractDependencies(moduleId, [], resources, [], structs)).toEqual(
        ['address', 'TypedMoveResource', 'AptosModuleClient'],
      )
      expect(extractDependencies(moduleId, [], [], [], structs)).toHaveLength(0)
    })
    it('ignore js native types', () => {
      const moduleId = '0x::example'
      const entryFunctions: FunctionStruct[] = [
        {
          name: '0x1::example::example',
          args: [
            'bool',
            { name: 'vector', genericTypes: ['u8'] },
            '0x1::string::String',
          ],
        },
      ]
      expect(extractDependencies(moduleId, entryFunctions, [], [], [])).toEqual(
        ['u8', 'AptosModuleClient'],
      )
    })
  })
  describe('extractTypeNameRecursive', () => {
    const aptosCoinTypeStruct: TypeStruct = {
      moduleId: '0x1::aptos_coin',
      name: 'AptosCoin',
      genericTypes: [],
    }
    const vectorTypeStruct: TypeStruct = {
      name: 'vector',
      genericTypes: [],
    }
    it('returns arg itself if arg is non-generic native type of move', () => {
      expect(extractTypeNameRecursive('u8')).toEqual(['u8'])
    })
    it('returns name with moduleId if arg is a type in a module', () => {
      expect(extractTypeNameRecursive(aptosCoinTypeStruct)).toEqual([
        '0x1::aptos_coin::AptosCoin',
      ])
    })
    it('returns name if arg is not a type in a module', () => {
      expect(extractTypeNameRecursive(vectorTypeStruct)).toEqual(['vector'])
    })
    it('returns with name of generic parameters if cointains', () => {
      expect(
        extractTypeNameRecursive({
          moduleId: '0x1::coin',
          name: 'CoinInfo',
          genericTypes: [aptosCoinTypeStruct, 'u8'],
        }),
      ).toEqual(['0x1::coin::CoinInfo', '0x1::aptos_coin::AptosCoin', 'u8'])
      expect(
        extractTypeNameRecursive({
          moduleId: '0x1::example',
          name: 'Generics',
          genericTypes: [
            {
              moduleId: '0x1::option',
              name: 'Option',
              genericTypes: [{ name: 'vector', genericTypes: ['u8'] }],
            },
          ],
        }),
      ).toEqual([
        '0x1::example::Generics',
        '0x1::option::Option',
        'vector',
        'u8',
      ])
    })
    it('ignore type parameter', () => {
      expect(extractTypeNameRecursive('T0')).toEqual([])
      expect(
        extractTypeNameRecursive({
          name: 'vector',
          genericTypes: ['T99'],
        }),
      ).toEqual(['vector'])
    })
  })
})
