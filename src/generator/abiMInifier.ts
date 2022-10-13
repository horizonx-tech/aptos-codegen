import {
  MoveModuleJSON,
  MoveModuleJSONMinified,
} from '@horizonx/aptos-module-client'
import { isEventHandle, isResource } from './utils'

type ABIMinifierOptions = {
  entryFunctionsDisabled?: boolean
  gettersDisabled?: boolean
}
export const minifyABI = (
  abi: MoveModuleJSON,
  options?: ABIMinifierOptions,
): MoveModuleJSONMinified => ({
  name: abi.name,
  address: abi.address,
  exposed_functions: options?.entryFunctionsDisabled
    ? []
    : abi.exposed_functions
        .filter(({ is_entry }) => is_entry)
        .map(({ name, is_entry, generic_type_params, params }) => ({
          name,
          is_entry,
          generic_type_params: generic_type_params.map(() => ({})),
          params: params.filter((param) => param !== '&signer'),
        })),
  structs: options?.gettersDisabled
    ? []
    : abi.structs.filter(isResource).map(({ name, abilities, fields }) => ({
        name,
        abilities: abilities.filter((ability) => ability === 'key'),
        fields: fields.map((field) =>
          isEventHandle(field) ? field : { name: field.name },
        ),
      })),
})
