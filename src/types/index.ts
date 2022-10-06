import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { Types } from 'aptos'
import { MoveAbility } from 'aptos/dist/generated'

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
  typeArguments: {
    constraints: string[]
  }[]
  args: TypeStruct[]
}

export type ResourceStruct = {
  name: string
}

export type StructStruct = {
  name: string
  abilities: MoveAbility[]
  fields: StructFieldStruct[]
}

export type StructFieldStruct = {
  name: string
  type: TypeStruct
}

export type EventStruct = {
  name: string
  type: EventHandleTypeStruct
}

export type EventHandleFieldStrut = {
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
  aliases?: Partial<Record<Types.Address, string>>
}

export type RawConfig = Omit<Config, 'aliases'> & {
  aliases?: string[]
}
