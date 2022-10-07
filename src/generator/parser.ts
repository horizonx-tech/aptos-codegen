import { MoveModuleJSON } from '@horizonx/aptos-module-client'
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
  isTypeParameter,
  notSigner,
  toReservedType,
} from './utils'

export const parseFromABI = (abi: MoveModuleJSON): ModuleStruct => {
  const id = `${abi.address}::${abi.name}`

  const entryFunctions = abi.exposed_functions
    .filter(({ is_entry }) => is_entry)
    .map(({ name, generic_type_params, params }) => ({
      name,
      typeArguments: generic_type_params,
      args: params.filter(notSigner).map(parseTypesStr),
    }))

  const resourceStructs = abi.structs.filter(isResource)

  const resources = resourceStructs.map(({ name }) => ({ name }))
  const events = resourceStructs.filter(hasEventHandle).flatMap(({ fields }) =>
    fields.filter(isEventHandle).map(({ name, type }) => ({
      name: pascalCase(name),
      type: parseTypesStr(type) as EventHandleTypeStruct,
    })),
  )

  const structs = abi.structs.map(({ name, fields, abilities }) => ({
    name,
    abilities,
    fields: fields.map(({ name, type }) => ({
      name,
      type: parseTypesStr(type),
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
  const ownStructs = structs.map(({ name }) => `${moduleId}::${name}`)
  const additionalDependencies = [
    ...(resources.length ? ['address', 'TypedMoveResource', 'Types'] : []),
    ...(entryFunctions.length || resources.length
      ? ['AptosModuleClient', 'Types']
      : []),
    ...(events.length ? ['TypedEvent', 'EventGetterParams'] : []),
  ]
  return Array.from(
    new Set([
      ...allTypeStructs
        .flatMap(extractTypeStrRecursive)
        .filter(
          (type) =>
            !isJsNativeType(toReservedType(type)) && !type.startsWith('&'),
        ),
      ...additionalDependencies,
      ...ownStructs,
    ]),
  )
}

export const parseTypesStr = (str: string) => {
  let cursor = 0
  const arr = str.split(/(, |[<>])/)
  const parentTypes: TypeStruct[] = []
  while (cursor < arr.length) {
    const typeStr = arr[cursor++]
    const seperator = arr[cursor++]
    if (typeStr) {
      const type = parseTypeStr(typeStr)
      if (parentTypes.length) {
        const parentType = parentTypes[parentTypes.length - 1]
        if (parentType.genericTypes) parentType.genericTypes.push(type)
        else parentType.genericTypes = [type]
      } else parentTypes.push(type)
      if (seperator === '<') parentTypes.push(type)
    }
    if (seperator === '>') parentTypes.pop()
  }
  if (parentTypes.length !== 1) throw new Error(`Failed to parse: ${str}`)
  return parentTypes[0]
}

const parseTypeStr = (str: string): TypeStruct => {
  if (str.startsWith('&')) return { name: str }
  const splitted = str.split('::')
  if (splitted.length !== 3) return { name: str }
  return {
    moduleId: `${splitted[0]}::${splitted[1]}`,
    name: splitted[2],
  }
}

export const extractTypeStrRecursive = ({
  name,
  moduleId,
  genericTypes,
}: TypeStruct): string[] => {
  if (isTypeParameter(name)) return []
  return [
    moduleId ? `${moduleId}::${name}` : name,
    ...(genericTypes?.flatMap(extractTypeStrRecursive) || []),
  ]
}
