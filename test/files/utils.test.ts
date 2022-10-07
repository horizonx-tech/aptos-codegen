import {
  extractTypeParameters,
  parseTypeStr,
  typeToString,
} from 'src/files/utils'

describe('parser', () => {
  describe('extractTypeParameters', () => {
    it('returns type parameters', () => {
      expect(
        extractTypeParameters(
          '0x1::example::Generics<vector<u8>, 0x1::example::Generics<address, bool>>',
        ),
      ).toEqual([
        { type: 'vector', genericTypes: [{ type: 'u8' }] },
        {
          type: '0x1::example::Generics',
          genericTypes: [{ type: 'address' }, { type: 'bool' }],
        },
      ])
    })
  })
  describe('parseTypeStr', () => {
    it('returns name and generic types without module id if arg starts with vector', () => {
      expect(parseTypeStr('vector<u8>')).toEqual({
        type: 'vector',
        genericTypes: [{ type: 'u8' }],
      })
      expect(parseTypeStr('vector<0x1::simple_map::Element<T0, T1>>')).toEqual({
        type: 'vector',
        genericTypes: [
          {
            type: '0x1::simple_map::Element',
            genericTypes: [{ type: 'T0' }, { type: 'T1' }],
          },
        ],
      })
    })
    it('returns module id and name and generic types if arg is struct', () => {
      expect(parseTypeStr('0x1::aptos_coin::AptosCoin')).toEqual({
        type: '0x1::aptos_coin::AptosCoin',
      })
    })
    it('returns arg itself as name if arg is pointer', () => {
      expect(parseTypeStr('&0x1::coin::FreezeCapability<T0>')).toEqual({
        type: '&0x1::coin::FreezeCapability',
        genericTypes: [{ type: 'T0' }],
      })
    })
    it('returns generic types recursive', () => {
      expect(
        parseTypeStr(
          '0x1::example::Generics<vector<u8>, 0x1::example::Generics<address, bool>>',
        ),
      ).toEqual({
        type: '0x1::example::Generics',
        genericTypes: [
          { type: 'vector', genericTypes: [{ type: 'u8' }] },
          {
            type: '0x1::example::Generics',
            genericTypes: [{ type: 'address' }, { type: 'bool' }],
          },
        ],
      })
    })
    it('return undefined if no type found or type is malformed', () => {
      expect(parseTypeStr('<')).toBeUndefined()
      expect(parseTypeStr('vector<u8')).toBeUndefined()
    })
  })
  describe('typeToString', () => {
    it('returns type if no genericTypes', () => {
      expect(typeToString({ type: 'u8' })).toEqual('u8')
      expect(typeToString({ type: '0x1::example::Example' })).toEqual(
        '0x1::example::Example',
      )
    })
    it('returns type if no genericTypes', () => {
      expect(typeToString({ type: 'u8' })).toEqual('u8')
      expect(typeToString({ type: '0x1::example::Example' })).toEqual(
        '0x1::example::Example',
      )
    })
    it('returns type with genericTypes', () => {
      expect(
        typeToString({ type: 'vector', genericTypes: [{ type: 'u8' }] }),
      ).toEqual('vector<u8>')
      expect(
        typeToString({
          type: '0x1::example::Example',
          genericTypes: [
            {
              type: 'vector',
              genericTypes: [
                { type: 'vector', genericTypes: [{ type: 'u8' }] },
              ],
            },
            {
              type: 'vector',
              genericTypes: [
                {
                  type: '0x1::example::Example2',
                  genericTypes: [{ type: 'u8' }],
                },
              ],
            },
          ],
        }),
      ).toEqual(
        '0x1::example::Example<vector<vector<u8>>, vector<0x1::example::Example2<u8>>>',
      )
    })
  })
})
