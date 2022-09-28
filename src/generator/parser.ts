import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { MoveType } from 'aptos/dist/generated'
import { pascalCase } from 'change-case'
import {
  EventHandleTypeStruct,
  EventStruct,
  FunctionStruct,
  ModuleStruct,
  ResourceStruct,
  StructStruct,
  TypeStruct,
} from '../types'
import {
  hasEventHandle,
  isEventHandle,
  isJsNativeType,
  isResource,
  isString,
  isTypeParameter,
  notSigner,
  parseFromResourceType,
  toReservedType,
} from './utils'

export const parseFromABI = (abi: MoveModuleJSON): ModuleStruct => {
  const id = `${abi.address}::${abi.name}`

  const entryFunctions = abi.exposed_functions
    .filter(({ is_entry }) => is_entry)
    .map(({ name, generic_type_params, params }) => ({
      name,
      typeArguments: generic_type_params,
      args: params.filter(notSigner).map(toTypeStruct),
    }))

  const resourceStructs = abi.structs.filter(isResource)

  const resources = resourceStructs.map(({ name }) => ({ name }))
  const events = resourceStructs.filter(hasEventHandle).flatMap(({ fields }) =>
    fields.filter(isEventHandle).map(({ name, type }) => ({
      name: pascalCase(name),
      type: toTypeStruct(type) as EventHandleTypeStruct,
    })),
  )

  const structs = abi.structs.map(({ name, fields }) => ({
    name,
    fields: fields.map(({ name, type }) => ({
      name,
      type: toTypeStruct(type),
    })),
  }))

  const dependencies = extractDependencies(
    id,
    entryFunctions,
    resources,
    events,
    structs,
  )

  return {
    id,
    address: abi.address,
    name: pascalCase(abi.name),
    abi,
    entryFunctions,
    resources,
    events,
    structs,
    dependencies,
  }
}

export const extractDependencies = (
  moduleId: string,
  entryFunctions: FunctionStruct[],
  resources: ResourceStruct[],
  events: EventStruct[],
  structs: StructStruct[],
) => {
  const allTypeStructs = [
    ...entryFunctions.flatMap(({ args }) => args),
    ...structs.flatMap(({ fields }) => fields.flatMap(({ type }) => type)),
  ]
  const additionalDependencies = [
    ...(resources.length ? ['address', 'TypedMoveResource', 'Types'] : []),
    ...(entryFunctions.length || resources.length ? ['AptosModuleClient'] : []),
    ...(events.length ? ['TypedEvent', 'EventGetterParams'] : []),
  ]
  return Array.from(
    new Set([
      ...allTypeStructs
        .flatMap(extractTypeNameRecursive)
        .filter(
          (type) =>
            !type.startsWith(moduleId) && !isJsNativeType(toReservedType(type)),
        ),
      ...additionalDependencies,
    ]),
  )
}

export const toTypeStruct = (param: MoveType): TypeStruct => {
  const reservedType = toReservedType(param)
  if (reservedType) return param
  if (isTypeParameter(param)) return param
  if (param.startsWith('vector')) {
    const genericTypes = extractIdentifiersFromGenericTypeStr(
      param.replace(/^.*?</, '').replace(/>$/, ''),
    )
    return {
      name: 'vector',
      genericTypes: genericTypes.map(toTypeStruct),
    }
  }
  const res = parseFromResourceType(param)
  if (!res) {
    console.warn(`Skip unknown type: ${param}`)
    return 'any'
  }
  return {
    moduleId: res.moduleId,
    name: res.structName,
    genericTypes: res.genericTypesStr
      ? extractIdentifiersFromGenericTypeStr(res.genericTypesStr).map(
          toTypeStruct,
        )
      : [],
  }
}

export const extractIdentifiersFromGenericTypeStr = (str: string) => {
  const result = []
  let current = ''
  for (const each of str.split(', ')) {
    if (current) {
      current = [current, each].join(', ')
      if (!each.includes('>')) continue
      const numOfLeft = current.match(/</g).length
      const numOfRight = current.match(/>/g).length
      if (numOfLeft !== numOfRight) continue
      result.push(current)
      current = ''
      continue
    }
    if (each.includes('<') && !each.includes('>')) {
      current += each
      continue
    }
    result.push(each)
  }
  if (current) throw new Error(`Failed to parse generic types: ${str}`)
  return result
}

export const extractTypeNameRecursive = (type: TypeStruct): string[] => {
  if (isString(type)) return isTypeParameter(type) ? [] : [type]
  return [
    type.moduleId ? `${type.moduleId}::${type.name}` : type.name,
    ...type.genericTypes.flatMap(extractTypeNameRecursive),
  ]
}
