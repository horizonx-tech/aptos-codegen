import { StructDefinition, StructStruct, TypeStruct } from 'src/types'
import { RESERVERD_MODULES } from './constants'
import {
  hasTypeParameters as hasTypeParametersRecursive,
  isJsNativeType,
  isString,
  isTypeParameter,
  toModuleMapKey,
  toPath,
} from './utils'

export interface IModuleResolver {
  getDependenciesMap: () => Map<string, Set<string>>
  getStructDefinition: (moduleId: string, name: string) => StructDefinition
}

export class ModuleResolverFactory {
  private modulePathMap = new Map<string, string>()
  private structMap = new Map<string, StructStruct>()
  private structDefinitionMap = new Map<string, StructDefinition>()

  constructor(
    modules: { id: string; name: string; structs: StructStruct[] }[],
  ) {
    this.resolveGenericTypeParameters(modules)
    modules.forEach(({ id, name }) => this.modulePathMap.set(id, toPath(name)))
    RESERVERD_MODULES.forEach(({ path, types }) =>
      types.forEach((type) => this.modulePathMap.set(type, path)),
    )
  }

  build = (dependencies: string[]): IModuleResolver => {
    const dependenciesMap = new Map<string, Set<string>>()
    for (const dependency of dependencies) {
      const moduleMapKey = toModuleMapKey(dependency)
      if (isJsNativeType(moduleMapKey)) continue
      const path = this.modulePathMap.get(moduleMapKey)
      if (!path) {
        console.warn('Skip: module path not found:', dependency)
        continue
      }
      const type = dependency.split('::')[2] || moduleMapKey
      if (dependenciesMap.has(path)) dependenciesMap.get(path).add(type)
      else dependenciesMap.set(path, new Set([type]))
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
        struct.fields.flatMap(({ type }) =>
          this.resolveGenericTypeParametersRecursive(type),
        ),
      ),
    ).sort()
    this.structDefinitionMap.set(`${moduleId}::${struct.name}`, {
      typeParameters,
    })
    return typeParameters
  }

  private resolveGenericTypeParametersRecursive = (
    type: TypeStruct,
  ): string[] => {
    if (!isString(type)) {
      const genericTypes = type.genericTypes.filter(hasTypeParametersRecursive)
      if (!genericTypes.length) return []
    }
    return this.extractGenericType(type)
  }

  private extractGenericType = (type: TypeStruct): string[] => {
    if (isString(type)) return isTypeParameter(type) ? [type] : []

    if (!type.moduleId)
      return type.genericTypes.flatMap(this.extractGenericType)

    const fqn = `${type.moduleId}::${type.name}`
    const definition = this.structDefinitionMap.get(fqn)
    if (definition)
      return type.genericTypes
        .flatMap(this.resolveGenericTypeParametersRecursive)
        .slice(0, definition.typeParameters.length)

    const struct = this.structMap.get(fqn)
    if (!struct) {
      console.warn('Skip: unknown struct:', fqn)
      return []
    }
    return this.resolveStructGenericTypeParametersRecursive(
      type.moduleId,
      struct,
    )
  }
}

class ModuleResolver implements IModuleResolver {
  constructor(
    private dependenciesMap: Map<string, Set<string>>,
    private structDefinitionMap: Map<string, StructDefinition>,
  ) {}

  getDependenciesMap: IModuleResolver['getDependenciesMap'] = () =>
    this.dependenciesMap

  getStructDefinition: IModuleResolver['getStructDefinition'] = (
    moduleId,
    name,
  ) => this.structDefinitionMap.get(`${moduleId}::${name}`)
}
