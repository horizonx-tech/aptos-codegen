import { ModuleResolverFactory } from 'src/generator/resolver'

type MODULE_STRUCTS = ConstructorParameters<typeof ModuleResolverFactory>[0][0]
export const STRING_STRUCT: MODULE_STRUCTS = {
  id: '0x1::string',
  name: 'String',
  structs: [
    {
      name: 'String',
      abilities: [],
      fields: [
        {
          name: 'bytes',
          type: { name: 'vector', genericTypes: ['u8'] },
        },
      ],
    },
  ],
}

export const OPTION_STRUCT: MODULE_STRUCTS = {
  id: '0x1::option',
  name: 'Option',
  structs: [
    {
      name: 'Option',
      abilities: [],
      fields: [
        {
          name: 'vec',
          type: { name: 'vector', genericTypes: ['T0'] },
        },
      ],
    },
  ],
}

export const ITERABLE_VALUE_STRUCT: MODULE_STRUCTS = {
  id: '0x1::iterable_table',
  name: 'IterableValue',
  structs: [
    {
      name: 'IterableValue',
      abilities: [],
      fields: [
        { name: 'val', type: 'T1' },
        {
          name: 'prev',
          type: {
            moduleId: '0x1::option',
            name: 'Option',
            genericTypes: ['T0'],
          },
        },
        {
          name: 'next',
          type: {
            moduleId: '0x1::option',
            name: 'Option',
            genericTypes: ['T0'],
          },
        },
      ],
    },
  ],
}
