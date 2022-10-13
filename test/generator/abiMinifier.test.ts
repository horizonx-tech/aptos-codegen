import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { Types } from 'aptos'
import { minifyABI } from 'src/generator/abiMInifier'
import { isEventHandle } from 'src/generator/utils'

describe('abiMinifier', () => {
  const FUNCTION: MoveModuleJSON['exposed_functions'][0] = {
    name: 'example_fn',
    visibility: 'public',
    is_entry: false,
    generic_type_params: [{ constraints: [] }],
    params: [],
    return: [],
  }
  const ENTRY_FUNCTION: MoveModuleJSON['exposed_functions'][0] = {
    name: 'example_fntry_fn',
    visibility: 'public',
    is_entry: true,
    generic_type_params: [{ constraints: [] }],
    params: ['u64', 'address'],
    return: [],
  }
  const ENTRY_FUNCTION_WTIH_SIGNER: MoveModuleJSON['exposed_functions'][0] = {
    name: 'example_entry_fn_with_signer',
    visibility: 'public',
    is_entry: true,
    generic_type_params: [{ constraints: [] }],
    params: ['&signer', 'u64', 'address'],
    return: [],
  }
  const ENTRY_FUNCTIONS = [ENTRY_FUNCTION, ENTRY_FUNCTION_WTIH_SIGNER]

  const KEY_STRUCTS: MoveModuleJSON['structs'] = [
    {
      name: 'Example',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [],
      fields: [
        { name: 'example_field', type: 'u64' },
        {
          name: 'example_events',
          type: '0x1::event::EventHandle<0x1::example::ExampleEvent>',
        },
      ],
    },
  ]
  const ABI: MoveModuleJSON = {
    address: '0x1',
    name: 'example',
    friends: [],
    exposed_functions: [FUNCTION, ...ENTRY_FUNCTIONS],
    structs: [
      ...KEY_STRUCTS,
      {
        name: 'ExampleStore',
        is_native: false,
        abilities: ['store'],
        generic_type_params: [],
        fields: [],
      },
    ],
  }
  it('minify', () => {
    const abi = ABI
    const minified = minifyABI(abi)

    expect(minified.address).toBe(abi.address)
    expect(minified.name).toBe(abi.name)
    expect(minified).not.toHaveProperty('friends')

    expect(minified.exposed_functions).toHaveLength(ENTRY_FUNCTIONS.length)
    minified.exposed_functions.forEach((fn) => {
      expect(fn.is_entry).toBeTruthy()
      fn.generic_type_params.forEach((each) => {
        expect(each).toEqual({})
      })
      expect(fn).not.toHaveProperty('visibility')
      expect(fn).not.toHaveProperty('return')
    })
    const entryFn = minified.exposed_functions[0]
    expect(entryFn.name).toBe(ENTRY_FUNCTION.name)
    expect(entryFn.generic_type_params).toHaveLength(
      ENTRY_FUNCTION.generic_type_params.length,
    )
    expect(entryFn.params).toEqual(ENTRY_FUNCTION.params)

    const entryFnWithSigner = minified.exposed_functions[1]
    expect(entryFnWithSigner.name).toBe(ENTRY_FUNCTION_WTIH_SIGNER.name)
    expect(entryFnWithSigner.generic_type_params).toHaveLength(
      ENTRY_FUNCTION_WTIH_SIGNER.generic_type_params.length,
    )
    expect(entryFnWithSigner.params).toHaveLength(
      ENTRY_FUNCTION_WTIH_SIGNER.params.length - 1,
    )
    expect(entryFnWithSigner.params[0]).toBe(
      ENTRY_FUNCTION_WTIH_SIGNER.params[1],
    )
    expect(entryFnWithSigner.params[1]).toBe(
      ENTRY_FUNCTION_WTIH_SIGNER.params[2],
    )

    expect(minified.structs).toHaveLength(KEY_STRUCTS.length)
    minified.structs.forEach((struct) => {
      expect(struct.abilities).toEqual(['key'])
      expect(struct).not.toHaveProperty('is_native')
      expect(struct).not.toHaveProperty('generic_type_params')
    })

    minified.structs.forEach((struct, i) => {
      expect(struct.name).toBe(KEY_STRUCTS[i].name)
      expect(struct.fields).toHaveLength(KEY_STRUCTS[i].fields.length)
      struct.fields.forEach((field, j) => {
        expect(field.name).toBe(KEY_STRUCTS[0].fields[j].name)
        if (field.type)
          expect(isEventHandle(field as Types.MoveStructField)).toBeTruthy()
      })
    })
  })

  describe('options', () => {
    it('entryFunctionsDisabled', () => {
      const abi = ABI
      const minified = minifyABI(abi, { entryFunctionsDisabled: true })
      expect(minified.exposed_functions).toHaveLength(0)
      expect(minified.structs).toHaveLength(KEY_STRUCTS.length)
    })
    it('gettersDisabled', () => {
      const abi = ABI
      const minified = minifyABI(abi, { gettersDisabled: true })
      expect(minified.exposed_functions).toHaveLength(ENTRY_FUNCTIONS.length)
      expect(minified.structs).toHaveLength(0)
    })
  })
})
