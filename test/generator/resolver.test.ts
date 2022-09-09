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
          [{ id: '', name: '', structs: [] }]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(['u8', 'address', 'AptosModuleClient'])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(2)
        expect(dependenciesMap.get('aptos')).toEqual(
          new Set(['BCS', 'MaybeHexString']),
        )
        expect(dependenciesMap.get('@horizonx/aptos-module-client')).toEqual(
          new Set(['AptosModuleClient']),
        )
      })
      it('can resolve build struct definitionMap', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [STRING_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build([])
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
        const resolver = factory.build([
          'bool',
          '0x1::string::String',
          'vector',
        ])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(0)
      })
      it('ignore if module path not found', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [STRING_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build(['0x1::exmaple::undefined'])
        const dependenciesMap = resolver.getDependenciesMap()
        expect(Array.from(dependenciesMap.keys())).toHaveLength(0)
      })
    })
    describe('resolveGenericTypeParametersRecursive', () => {
      it('collect type parameters of non-module type', () => {
        const modules: ConstructorParameters<typeof ModuleResolverFactory>[0] =
          [OPTION_STRUCT]
        const factory = new ModuleResolverFactory(modules)
        const resolver = factory.build([])
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
        const resolver = factory.build([])
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
        const resolver = factory.build([])
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
      const resolver = factory.build([])
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
      const resolver = factory.build([])
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
      const resolver = factory.build([])
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
      const resolver = factory.build([])
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
      const resolver = factory.build([])
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
      const resolver = factory.build([])
      expect(resolver.getStructDefinition('0x1::example', 'Example')).toEqual({
        typeParameters: [],
      })
    })
  })
})
