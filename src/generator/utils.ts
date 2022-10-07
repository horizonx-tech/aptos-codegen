import { MoveStruct, MoveStructField } from 'aptos/dist/generated'
import { EventHandleFieldStrut, StructFieldStruct, TypeStruct } from 'src/types'
import {
  JS_NATIVE_TYPES,
  RESERVED_TYPE_DICT,
  RESOURCE_TYPE_REGEX,
  TYPE_PARAMETER_REGEX,
} from './constants'

export const isString = (arg: any): arg is string => typeof arg === 'string'

export const isResource = (struct: { abilities: string[] }) =>
  struct.abilities.includes('key')

export const isEventHandle = ({ type }: MoveStructField) =>
  isString(type) && type.startsWith('0x1::event::EventHandle')

export const hasEventHandle = (struct: MoveStruct) =>
  struct.fields.some(isEventHandle)

export const isEventHandleFieldStruct = (
  field: StructFieldStruct,
): field is EventHandleFieldStrut =>
  !isString(field.type) &&
  field.type.moduleId === '0x1::event' &&
  field.type.name === 'EventHandle'

export const notSigner = (param: string) => param !== '&signer'

export const isJsNativeType = (arg: any) => JS_NATIVE_TYPES.includes(arg)

export const isTypeParameter = (arg: string) =>
  isString(arg) && TYPE_PARAMETER_REGEX.test(arg)

export const toReservedType = (
  name: string,
  moduleId?: string,
): string | undefined =>
  moduleId
    ? RESERVED_TYPE_DICT[`${moduleId}::${name}`]
    : RESERVED_TYPE_DICT[name]

export const toReservedTypeOrAny = (name: string, moduleId?: string) =>
  toReservedType(name, moduleId) || 'any'

export const hasTypeParameters = ({ name, genericTypes }: TypeStruct) => {
  if (genericTypes?.length) return genericTypes.some(hasTypeParameters)
  return TYPE_PARAMETER_REGEX.test(name)
}

export const parseFromResourceType = (maybeResourceType: string) => {
  const res = RESOURCE_TYPE_REGEX.exec(maybeResourceType)
  if (!res || res.length < 2) {
    return
  }
  const fqn = res[1]
  const [address, moduleName, structName] = fqn.split('::')
  return {
    moduleId: `${address}::${moduleName}`,
    structName,
    genericTypesStr: res[2],
  }
}

export const toModuleMapKey = (dependency: string) => {
  const reservedType = RESERVED_TYPE_DICT[dependency]
  if (reservedType) return reservedType.split('.')[0]
  if (dependency.includes('::')) return toModuleId(dependency)
  return dependency
}

export const toModuleId = (dependency: string): string | undefined => {
  if (!dependency.includes('::')) return
  return dependency.split('::').slice(0, 2).join('::')
}

export const typesFileName = (moduleName: string) => `${moduleName}.ts`

export const utilitiesFileName = (moduleName: string) => `${moduleName}Utils.ts`

export const factoryFileName = (moduleName: string) =>
  `${moduleName}ModuleFactory.ts`

export const toPath = (filePath: string, prefix = './') =>
  `${prefix}${filePath}`
