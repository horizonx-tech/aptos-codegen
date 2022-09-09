import { MoveModuleJSON } from '@horizonx/aptos-module-client'

export const MOCK_ABI: MoveModuleJSON = {
  address: '0x1',
  name: 'coin',
  friends: ['0x1::aptos_coin', '0x1::genesis'],
  exposed_functions: [
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', 'u64'],
      return: [],
    },
    {
      name: 'balance',
      visibility: 'public',
      is_entry: false,
      generic_type_params: [{ constraints: [] }],
      params: ['address'],
      return: ['u64'],
    },
  ],
  structs: [
    {
      name: 'Coin',
      is_native: false,
      abilities: ['store'],
      generic_type_params: [{ constraints: [] }],
      fields: [{ name: 'value', type: 'u64' }],
    },
    {
      name: 'CoinInfo',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [{ constraints: [] }],
      fields: [
        { name: 'name', type: '0x1::string::String' },
        { name: 'symbol', type: '0x1::string::String' },
        { name: 'decimals', type: 'u8' },
        {
          name: 'supply',
          type: '0x1::option::Option<0x1::optional_aggregator::OptionalAggregator>',
        },
      ],
    },
    {
      name: 'CoinStore',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [
        {
          constraints: [],
        },
      ],
      fields: [
        {
          name: 'coin',
          type: '0x1::coin::Coin<T0>',
        },
        {
          name: 'frozen',
          type: 'bool',
        },
        {
          name: 'deposit_events',
          type: '0x1::event::EventHandle<0x1::coin::DepositEvent>',
        },
        {
          name: 'withdraw_events',
          type: '0x1::event::EventHandle<0x1::coin::WithdrawEvent>',
        },
      ],
    },
    {
      name: 'DepositEvent',
      is_native: false,
      abilities: ['drop', 'store'],
      generic_type_params: [],
      fields: [{ name: 'amount', type: 'u64' }],
    },
    {
      name: 'WithdrawEvent',
      is_native: false,
      abilities: ['drop', 'store'],
      generic_type_params: [],
      fields: [{ name: 'amount', type: 'u64' }],
    },
  ],
}
