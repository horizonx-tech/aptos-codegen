import { ModuleStruct, TypeStruct } from 'src/types'
import { IModuleResolver } from './resolver'
import {
  entryFunction,
  eventsGetter,
  factory,
  imports,
  resourceGetter,
  resourceTypeGuard,
  struct,
  structField,
  toAlias,
  typeParametersExtaractor,
  types,
  typesContent,
  utilities,
} from './templates'
import {
  factoryFileName,
  isEventHandleFieldStruct,
  isResource,
  isTypeParameter,
  toPath,
  toReservedType,
  typesFileName,
  utilitiesFileName,
} from './utils'

type GeneratorParams = {
  module: ModuleStruct
  resolver: IModuleResolver
  factoryDisabled?: boolean
  alias?: string
}

export const generate = (params: GeneratorParams) => {
  const prefix = params.alias ? `./${params.alias}/` : undefined
  return {
    factory:
      params.factoryDisabled ||
      (params.module.entryFunctions.length === 0 &&
        params.module.resources.length === 0)
        ? undefined
        : {
            content: factory({
              name: params.module.name,
              abi: params.module.abi,
            }),
            path: toPath(factoryFileName(params.module.name), prefix),
          },
    types: {
      content: generateTypes(params),
      path: toPath(typesFileName(params.module.name), prefix),
    },
    utilities:
      params.module.resources.length === 0
        ? undefined
        : {
            content: generateUtilities(params),
            path: toPath(utilitiesFileName(params.module.name), prefix),
          },
  }
}

const generateUtilities = ({ module, resolver }: GeneratorParams) => {
  const resourceTypeGuards = module.resources.map(({ name }) => {
    const structDef = resolver.getStructDefinition(module.id, name)
    return resourceTypeGuard({
      moduleId: module.id,
      moduleName: module.abi.name,
      name,
      typeParameters: structDef.typeParameters,
    })
  })
  const typeParametersExtaractors = module.resources.map(({ name }) =>
    typeParametersExtaractor({
      moduleId: module.id,
      moduleName: module.abi.name,
      name,
    }),
  )
  return utilities({
    address: module.address,
    moduleName: module.name,
    resourceNames: module.resources.map(({ name }) => name),
    utilitiesContents: [...resourceTypeGuards, ...typeParametersExtaractors],
  })
}

const generateTypes = (params: GeneratorParams) => {
  const dependenciesMap = params.resolver.getDependenciesMap()
  const typeCount = Array.from(dependenciesMap.values())
    .flatMap((values) => Array.from(values.types))
    .reduce<Record<string, number>>(
      (res, type) => ({
        ...res,
        [type]: (res[type] || 0) + 1,
      }),
      {},
    )
  const importsContent = imports(
    params.module.id,
    dependenciesMap,
    typeCount,
    !!params.alias,
  )
  return types({
    importsContent,
    typesContent: generateTypesContent(params, typeCount),
  })
}

const generateTypesContent = (
  { module, resolver }: GeneratorParams,
  typeCount: Record<string, number>,
) => {
  const entryFunctions = module.entryFunctions.map(
    ({ name, typeArguments, args }) =>
      entryFunction({
        name,
        typeArguments,
        args: args.map((type) => toTSType(type, resolver)),
      }),
  )

  const resourceGetters = module.resources.map(({ name }) => {
    const structDef = resolver.getStructDefinition(module.id, name)
    return resourceGetter({
      name,
      typeParameters: structDef.typeParameters,
    })
  })

  const eventsGetters = module.structs
    .filter(isResource)
    .flatMap(({ fields }) =>
      fields.filter(isEventHandleFieldStruct).map(({ name, type }) => {
        const genericType = type.genericTypes[0]
        const structDef = resolver.getStructDefinition(
          genericType.moduleId,
          genericType.name,
        )
        return eventsGetter({
          name,
          type: toTSType(genericType, resolver),
          typeParameters: structDef.typeParameters,
        })
      }),
    )

  const structs = module.structs.map((each) => {
    const fields = each.fields.map(({ name, type }) =>
      structField({
        name: name,
        type: toTSType(type, resolver, typeCount),
      }),
    )
    const structDef = resolver.getStructDefinition(module.id, each.name)
    return struct({
      name: each.name,
      fields,
      typeParameters: structDef.typeParameters,
    })
  })

  return typesContent({
    name: module.name,
    entryFunctions,
    resourceGetters,
    eventsGetters,
    structs,
  })
}

const toTSType = (
  { moduleId, name, genericTypes }: TypeStruct,
  resolver: IModuleResolver,
  typeCount: Record<string, number> = {},
): string => {
  if (isTypeParameter(name)) return name
  const reservedType = toReservedType(name, moduleId)
  if (reservedType) {
    if (!genericTypes?.length) return reservedType
    const genericTypeNames = genericTypes.map((type) =>
      toTSType(type, resolver, typeCount),
    )
    return `${reservedType}<${genericTypeNames.join(', ')}>`
  }
  const structDef = resolver.getStructDefinition(moduleId, name)
  if (!structDef) return 'any'
  const typeName = typeCount[name] > 1 ? toAlias(moduleId, name) : name
  if (!structDef.typeParameters?.length) return typeName
  return `${typeName}<${genericTypes
    .slice(0, structDef.typeParameters.length)
    .map((each) => toTSType(each, resolver, typeCount))
    .join(', ')}>`
}
