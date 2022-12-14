import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { Types } from 'aptos'

export type StructTypeStruct = {
  moduleId: string
  name: string
  genericTypes: TypeStruct[]
}

export type TypeStruct = {
  moduleId?: string
  name: string
  genericTypes?: TypeStruct[]
}

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
  abilities: Types.MoveAbility[]
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
  minifyAbi?: boolean
  targets?: Partial<{
    entryFunctions: boolean
    getters: boolean
    utilities: boolean
  }>
}

export type RawConfig = Omit<Config, 'aliases' | 'targets' | 'minifyABI'> & {
  minifyAbi?: boolean
  aliases?: string[]
  targets?: string[]
}
