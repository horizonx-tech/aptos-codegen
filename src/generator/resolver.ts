import { Types } from 'aptos'
import { pascalCase } from 'change-case'
import { StructDefinition, StructStruct, TypeStruct } from 'src/types'
import { RESERVERD_MODULES } from './constants'
import {
  isJsNativeType,
  isTypeParameter,
  toModuleMapKey,
  toPath,
} from './utils'

export interface IModuleResolver {
  getDependenciesMap: () => Map<string, { path: string; types: Set<string> }>
  getStructDefinition: (
    moduleId: string,
    name: string,
  ) => StructDefinition | undefined
}

export class ModuleResolverFactory {
  private reservedModuleKeyMap = new Map<string, string>()
  private structMap = new Map<string, StructStruct>()
  private structDefinitionMap = new Map<string, StructDefinition>()
  private aliases: Partial<Record<Types.Address, string>>

  constructor(
    modules: { id: string; name: string; structs: StructStruct[] }[],
    aliases: Partial<Record<Types.Address, string>> = {},
  ) {
    this.resolveGenericTypeParameters(modules)
    RESERVERD_MODULES.forEach(({ key, types }) =>
      types.forEach((type) => this.reservedModuleKeyMap.set(type, key)),
    )
    this.aliases = aliases
  }

  build = (moduleId: string, dependencies: string[]): IModuleResolver => {
    const dependenciesMap = new Map<
      string,
      { path: string; types: Set<string> }
    >()
    for (const dependency of dependencies) {
      const moduleMapKey = toModuleMapKey(dependency)
      if (isJsNativeType(moduleMapKey)) continue
      const [address, moduleName, typeName] = dependency.split('::')
      const key = moduleName
        ? `${address}::${moduleName}`
        : this.reservedModuleKeyMap.get(moduleMapKey)
      if (!key) {
        console.warn('Skip: module id or reserved key not found:', dependency)
        continue
      }
      const type = typeName || moduleMapKey
      if (dependenciesMap.has(key)) dependenciesMap.get(key).types.add(type)
      else {
        const alias = this.aliases[address]
        const isSameAddress = moduleId.startsWith(address)
        dependenciesMap.set(key, {
          path:
            alias && !isSameAddress
              ? toPath(pascalCase(moduleName), `./${alias}/`)
              : moduleName
              ? toPath(pascalCase(moduleName))
              : key,
          types: new Set([type]),
        })
      }
    }
    return new ModuleResolver(dependenciesMap, this.structDefinitionMap)
  }

  private resolveGenericTypeParameters = (
    modules: { id: string; structs: StructStruct[] }[],
  ) => {
    modules.forEach(({ id, structs }) =>
      structs.forEach((struct) =>
        this.structMap.set(`${id}::${struct.name}`, struct),
      ),
    )
    modules.forEach(({ id, structs }) => {
      structs.forEach((struct) =>
        this.resolveStructGenericTypeParametersRecursive(id, struct),
      )
    })
  }

  private resolveStructGenericTypeParametersRecursive = (
    moduleId: string,
    struct: StructStruct,
  ) => {
    const typeParameters = Array.from(
      new Set(
        struct.fields.flatMap(({ type }) => this.extractGenericType(type)),
      ),
    ).sort()
    this.structDefinitionMap.set(`${moduleId}::${struct.name}`, {
      typeParameters,
    })
    return typeParameters
  }

  private extractGenericType = (type: TypeStruct): string[] => {
    const { moduleId, name, genericTypes } = type
    if (!moduleId) {
      if (isTypeParameter(name)) return [name]
      return genericTypes?.flatMap(this.extractGenericType) || []
    }
    if (!genericTypes?.length) return []

    const fqn = `${moduleId}::${name}`
    if (!this.structDefinitionMap.has(fqn)) {
      const struct = this.structMap.get(fqn)
      if (struct)
        this.resolveStructGenericTypeParametersRecursive(moduleId, struct)
      else console.warn('Unknown struct:', fqn)
    }
    const definition = this.structDefinitionMap.get(fqn)
    if (!definition?.typeParameters?.length) return []
    return genericTypes
      .flatMap(this.extractGenericType)
      .slice(0, definition.typeParameters.length)
  }
}

class ModuleResolver implements IModuleResolver {
  constructor(
    private dependenciesMap: Map<string, { path: string; types: Set<string> }>,
    private structDefinitionMap: Map<string, StructDefinition>,
  ) {}

  getDependenciesMap: IModuleResolver['getDependenciesMap'] = () =>
    this.dependenciesMap

  getStructDefinition: IModuleResolver['getStructDefinition'] = (
    moduleId,
    name,
  ) => this.structDefinitionMap.get(`${moduleId}::${name}`)
}
