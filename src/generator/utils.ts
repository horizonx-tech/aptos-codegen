import { MoveStruct, MoveStructField } from 'aptos/dist/generated'
import { TypeStruct } from 'src/types'
import {
  JS_NATIVE_TYPES,
  RESERVED_TYPE_DICT,
  RESOURCE_TYPE_REGEX,
  TYPE_PARAMETER_REGEX,
} from './constants'

export const isString = (arg: any): arg is string => typeof arg === 'string'

export const isResource = (struct: MoveStruct) =>
  struct.abilities.includes('key')

export const isEventHandle = ({ type }: MoveStructField) =>
  isString(type) && type.startsWith('0x1::event::EventHandle')

export const hasEventHandle = (struct: MoveStruct) =>
  struct.fields.some(isEventHandle)

export const notSigner = (param: string) => param !== '&signer'

export const isJsNativeType = (arg: any) => JS_NATIVE_TYPES.includes(arg)

export const isTypeParameter = (arg: TypeStruct) =>
  isString(arg) && TYPE_PARAMETER_REGEX.test(arg)

export const toReservedType = (arg: string): string | undefined =>
  RESERVED_TYPE_DICT[arg]

export const toReservedTypeOrAny = (arg: string) => toReservedType(arg) || 'any'

export const hasTypeParameters = (type: TypeStruct) => {
  if (isString(type)) return TYPE_PARAMETER_REGEX.test(type)
  return type.genericTypes.some(hasTypeParameters)
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

export const factoryFileName = (moduleName: string) =>
  `${moduleName}ModuleFactory.ts`

export const toPath = (filePath: string, prefix = './') =>
  `${prefix}${filePath}`
