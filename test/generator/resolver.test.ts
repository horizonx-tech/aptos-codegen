import { toTypeStruct } from 'src/generator/parser'
import { ModuleResolverFactory } from 'src/generator/resolver'
import {
  ITERABLE_VALUE_STRUCT,
  OPTION_STRUCT,
  STRING_STRUCT,
} from '../__mocks__/structs'

describe('resolver', () => {
  describe('ModuleResolverFactory', () => {
    describe('build', () => {
      it('can resolve reserved modules', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [{ id: '0x1::example', name: '', structs: [] }]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(modules[0].id, [
          'u8',
          'address',
          'AptosModuleClient',
        ])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(2)
        expect(dependenciesMap.get('aptos')).toEqual({
          path: 'aptos',
          types: new Set(['BCS', 'MaybeHexString']),
        })
        expect(dependenciesMap.get('@horizonx/aptos-module-client')).toEqual({
          path: '@horizonx/aptos-module-client',
          types: new Set(['AptosModuleClient']),
        })
      })
      it('can resolve modules', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [{ id: '0x1::example', name: '', structs: [] }]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(modules[0].id, ['0x1::example::Example'])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(1)
        expect(dependenciesMap.get('0x1::example')).toEqual({
          path: './Example',
          types: new Set(['Example']),
        })
      })
      it('can resolve modules with alias', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [
            {
              id: '0x1::example',
              name: 'Example',
              structs: [],
            },
            { id: '0x2::example', name: 'Example', structs: [] },
          ]
        const factory = new ModuleResolverFactory(modules, {
          '0x2': '0x2',
        })
        const resolver = factory.build(modules[0].id, [
          '0x1::example::Example',
          '0x2::example::Example',
        ])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(2)
        expect(dependenciesMap.get('0x1::example')).toEqual({
          path: './Example',
          types: new Set(['Example']),
        })
        expect(dependenciesMap.get('0x2::example')).toEqual({
          path: './0x2/Example',
          types: new Set(['Example']),
        })
      })
      it('can build struct definitionMap', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [STRING_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build('', [])
        expect(
          resolver.getStructDefinition(STRING_STRUCT.id, STRING_STRUCT.name),
        ).toEqual({
          typeParameters: [],
        })
      })
      it('ignore javescript native types', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [
            STRING_STRUCT,
            {
              id: '0x1::example',
              name: 'Example',
              structs: [
                {
                  name: 'example',
                  abilities: [],
                  fields: [
                    { name: 'boolean', type: 'bool' },
                    { name: 'string', type: '0x1::string::String' },
                    { name: 'array', type: 'vector<bool>' },
                  ],
                },
              ],
            },
          ]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(modules[1].id, [
          'bool',
          '0x1::string::String',
          'vector',
        ])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(0)
      })
      it('ignore if module id or reserved key not found', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [STRING_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(modules[0].id, ['undefined'])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(0)
      })
    })
    describe('resolveGenericTypeParametersRecursive', () => {
      it('collect type parameters of non-module type', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [OPTION_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build('', [])
        expect(
          resolver.getStructDefinition(OPTION_STRUCT.id, OPTION_STRUCT.name),
        ).toEqual({
          typeParameters: ['T0'],
        })
      })
      it('collect type parameters of module', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [
            OPTION_STRUCT,
            {
              id: '0x1::iterable_table',
              name: 'IterableTable',
              structs: [
                {
                  name: 'IterableTable',
                  abilities: [],
                  fields: [
                    {
                      name: 'head',
                      type: toTypeStruct('0x1::option::Option<T0>'),
                    },
                  ],
                },
              ],
            },
          ]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build('', [])
        expect(
          resolver.getStructDefinition('0x1::iterable_table', 'IterableTable'),
        ).toEqual({
          typeParameters: ['T0'],
        })
      })
      it('ignore the same type parameters', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [OPTION_STRUCT, ITERABLE_VALUE_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build('', [])
        expect(
          resolver.getStructDefinition('0x1::iterable_table', 'IterableValue'),
        ).toEqual({
          typeParameters: ['T0', 'T1'],
        })
      })
    })
    it('can resolve in any order', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        ITERABLE_VALUE_STRUCT,
        OPTION_STRUCT,
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(
        resolver.getStructDefinition('0x1::iterable_table', 'IterableValue'),
      ).toEqual({
        typeParameters: ['T0', 'T1'],
      })
    })
    it('ignore specified type', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        OPTION_STRUCT,
        {
          id: '0x1::example',
          name: 'Example',
          structs: [
            {
              name: 'Example',
              abilities: [],
              fields: [
                {
                  name: 'example',
                  type: toTypeStruct('0x1::option::Option<u8>'),
                },
              ],
            },
          ],
        },
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: [],
      })
    })
    it('can resolve one-side parameters', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        OPTION_STRUCT,
        ITERABLE_VALUE_STRUCT,
        {
          id: '0x1::example',
          name: 'Example',
          structs: [
            {
              name: 'Example',
              abilities: [],
              fields: [
                {
                  name: 'example',
                  type: toTypeStruct(
                    '0x1::iterable_table::IterableValue<u8, T0>',
                  ),
                },
              ],
            },
          ],
        },
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: ['T0'],
      })
    })
    it('can resolve nested types', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        OPTION_STRUCT,
        ITERABLE_VALUE_STRUCT,
        {
          id: '0x1::example',
          name: 'Example',
          structs: [
            {
              name: 'Example',
              abilities: [],
              fields: [
                {
                  name: 'example',
                  type: toTypeStruct(
                    '0x1::iterable_table::IterableValue<u8, 0x1::option::Option<T0>>',
                  ),
                },
              ],
            },
          ],
        },
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: ['T0'],
      })
    })
    it('can resolve nested vector types', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        OPTION_STRUCT,
        ITERABLE_VALUE_STRUCT,
        {
          id: '0x1::example',
          name: 'Example',
          structs: [
            {
              name: 'Example',
              abilities: [],
              fields: [
                {
                  name: 'example',
                  type: toTypeStruct('0x1::option::Option<vector<T0>>'),
                },
              ],
            },
          ],
        },
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: ['T0'],
      })
    })
    it('ignore unknown types', () => {
      const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] = [
        {
          id: '0x1::example',
          name: 'Example',
          structs: [
            {
              name: 'Example',
              abilities: [],
              fields: [
                {
                  name: 'example',
                  type: toTypeStruct('0x1::example::Undefined<T0>'),
                },
              ],
            },
          ],
        },
      ]
      const factory = new ModuleResolverFactory(modules)
      const resolver = factory.build('', [])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: [],
      })
    })
  })
})
