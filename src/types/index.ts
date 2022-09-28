import { MoveModuleJSON } from '@horizonx/aptos-module-client'

export type StructTypeStruct = {
  moduleId: string
  name: string
  genericTypes: TypeStruct[]
}

export type TypeStruct =
  | (Omit<StructTypeStruct, 'moduleId'> & { moduleId?: string })
  | string

export type EventHandleTypeStruct = {
  moduleId: '0x1::event'
  name: 'EventHandle'
  genericTypes: [StructTypeStruct]
}

export type FunctionStruct = {
  name: string
  // type_arguments: string[]
  args: TypeStruct[]
}

export type ResourceStruct = {
  name: string
}

export type StructStruct = {
  name: string
  fields: {
    name: string
    type: TypeStruct
  }[]
}

export type EventStruct = {
  name: string
  type: EventHandleTypeStruct
}

export type StructDefinition = {
  typeParameters: string[]
}

export type ModuleStruct = {
  id: string
  address: string
  name: string
  abi: MoveModuleJSON
  entryFunctions: FunctionStruct[]
  resources: ResourceStruct[]
  structs: StructStruct[]
  events: EventStruct[]
  dependencies: string[]
}

export type Config = {
  outDir: string
  modules: string[]
  nodeUrl: string
  abiFilePathPatterns?: string[]
  configurationFile?: string
}
