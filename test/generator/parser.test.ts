import {
  extractDependencies,
  extractTypeStrRecursive,
  parseFromABI,
  parseTypesStr,
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
      expect(module.dependencies).toHaveLength(16)
    })
  })
  describe('parseTypesStr', () => {
    it('returns name and generic types without module id if arg starts with vector', () => {
      expect(parseTypesStr('vector<u8>')).toEqual({
        name: 'vector',
        genericTypes: [{ name: 'u8' }],
      })
      expect(parseTypesStr('vector<0x1::simple_map::Element<T0, T1>>')).toEqual(
        {
          name: 'vector',
          genericTypes: [
            {
              moduleId: '0x1::simple_map',
              name: 'Element',
              genericTypes: [{ name: 'T0' }, { name: 'T1' }],
            },
          ],
        },
      )
    })
    it('returns module id and name and generic types if arg is struct', () => {
      expect(parseTypesStr('0x1::aptos_coin::AptosCoin')).toEqual({
        moduleId: '0x1::aptos_coin',
        name: 'AptosCoin',
      })
    })
    it('returns arg itself as name if arg is pointer', () => {
      expect(parseTypesStr('&0x1::coin::FreezeCapability<T0>')).toEqual({
        name: '&0x1::coin::FreezeCapability',
        genericTypes: [{ name: 'T0' }],
      })
    })
    it('returns generic types recursive', () => {
      expect(
        parseTypesStr(
          '0x1::example::Generics<vector<u8>, 0x1::example::Generics<address, bool>>',
        ),
      ).toEqual({
        moduleId: '0x1::example',
        name: 'Generics',
        genericTypes: [
          { name: 'vector', genericTypes: [{ name: 'u8' }] },
          {
            moduleId: '0x1::example',
            name: 'Generics',
            genericTypes: [{ name: 'address' }, { name: 'bool' }],
          },
        ],
      })
    })
    it('throw error if no type found or type is malformed', () => {
      expect(() => parseTypesStr('<')).toThrowError()
      expect(() => parseTypesStr('vector<u8')).toThrowError()
    })
  })
  describe('extractDependencies', () => {
    it('can extract types from entryFunctions and structs', () => {
      const moduleId = '0x1::coin'
      const entryFunctions: FunctionStruct[] = [
        {
          name: '0x1::coin::transfer',
          typeArguments: [],
          args: [{ name: 'address' }, { name: 'u64' }],
        },
      ]
      const resources: ResourceStruct[] = []
      const events: EventStruct[] = []
      const structs: StructStruct[] = [
        {
          name: 'Example',
          abilities: ['key'],
          fields: [
            {
              name: 'example',
              type: {
                moduleId: '0x1::option',
                name: 'Option',
                genericTypes: [{ name: 'u8' }],
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
        'Types',
        '0x1::coin::Example',
      ])
    })
    it('add "address" and "TypedMoveResource" and "Types" if resources is not empty', () => {
      const moduleId = '0x::example'
      const resources: ResourceStruct[] = [{ name: '0x1::example::Example' }]

      expect(extractDependencies(moduleId, [], resources, [], [])).toEqual([
        'address',
        'TypedMoveResource',
        'Types',
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
    it('add "AptosModuleClient" and "Types" if entryFunctions or resources are not empty', () => {
      const moduleId = '0x::example'
      const entryFunctions: FunctionStruct[] = [
        { name: '0x1::example::example', typeArguments: [], args: [] },
      ]
      const resources: ResourceStruct[] = [{ name: '0x1::example::Example' }]
      const structs: StructStruct[] = []

      expect(
        extractDependencies(moduleId, entryFunctions, [], [], structs),
      ).toEqual(['AptosModuleClient', 'Types'])
      expect(extractDependencies(moduleId, [], resources, [], structs)).toEqual(
        ['address', 'TypedMoveResource', 'Types', 'AptosModuleClient'],
      )
      expect(extractDependencies(moduleId, [], [], [], structs)).toHaveLength(0)
    })
    it('ignore js native types', () => {
      const moduleId = '0x::example'
      const entryFunctions: FunctionStruct[] = [
        {
          name: '0x1::example::example',
          typeArguments: [],
          args: [
            { name: 'bool' },
            { name: 'vector', genericTypes: [{ name: 'u8' }] },
            { moduleId: '0x1::string', name: 'String' },
          ],
        },
      ]
      expect(extractDependencies(moduleId, entryFunctions, [], [], [])).toEqual(
        ['u8', 'AptosModuleClient', 'Types'],
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
      expect(extractTypeStrRecursive({ name: 'u8' })).toEqual(['u8'])
    })
    it('returns name with moduleId if arg is a type in a module', () => {
      expect(extractTypeStrRecursive(aptosCoinTypeStruct)).toEqual([
        '0x1::aptos_coin::AptosCoin',
      ])
    })
    it('returns name if arg is not a type in a module', () => {
      expect(extractTypeStrRecursive(vectorTypeStruct)).toEqual(['vector'])
    })
    it('returns with name of generic parameters if cointains', () => {
      expect(
        extractTypeStrRecursive({
          moduleId: '0x1::coin',
          name: 'CoinInfo',
          genericTypes: [aptosCoinTypeStruct, { name: 'u8' }],
        }),
      ).toEqual(['0x1::coin::CoinInfo', '0x1::aptos_coin::AptosCoin', 'u8'])
      expect(
        extractTypeStrRecursive({
          moduleId: '0x1::example',
          name: 'Generics',
          genericTypes: [
            {
              moduleId: '0x1::option',
              name: 'Option',
              genericTypes: [
                { name: 'vector', genericTypes: [{ name: 'u8' }] },
              ],
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
      expect(extractTypeStrRecursive({ name: 'T0' })).toEqual([])
      expect(
        extractTypeStrRecursive({
          name: 'vector',
          genericTypes: [{ name: 'T99' }],
        }),
      ).toEqual(['vector'])
    })
  })
})
