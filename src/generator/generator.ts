import { Types } from 'aptos'
import { utilsFileContent } from 'src/files/utils'
import { ModuleStruct, TypeStruct } from 'src/types'
import { minifyABI } from './abiMInifier'
import { IModuleResolver } from './resolver'
import {
  addresses,
  comments,
  entryFunction,
  eventsGetter,
  factory,
  imports,
  resourceGetter,
  resourceTypeGuard,
  struct,
  structField,
  toAlias,
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
  varAlias: string
  dirAlias?: string
  minify?: boolean
  targets?: { entryFunctions?: boolean; getters?: boolean; utilities?: boolean }
}

export const generateFiles = (params: {
  addressAliases: Record<string, Types.Address>
}) => [
  {
    content: addresses(params.addressAliases),
    path: 'addresses.ts',
  },
  {
    content: `${comments}\n${utilsFileContent}`,
    path: 'utils.ts',
  },
]

export const generate = (params: GeneratorParams) => {
  const prefix = params.dirAlias ? `./${params.dirAlias}/` : undefined

  const entryFunctionsDisabled =
    params.module.entryFunctions.length === 0 ||
    (params.targets && !params.targets.entryFunctions)
  const gettersDisabled =
    params.module.resources.length === 0 ||
    (params.targets && !params.targets.getters)

  const factoryDisabled =
    params.factoryDisabled || (entryFunctionsDisabled && gettersDisabled)
  return {
    factory: factoryDisabled
      ? undefined
      : {
          content: factory({
            name: params.module.name,
            abi: params.minify
              ? minifyABI(
                  params.module.abi,
                  params.targets && {
                    entryFunctionsDisabled: !params.targets.entryFunctions,
                    gettersDisabled: !params.targets.getters,
                  },
                )
              : params.module.abi,
            addressAlias: params.varAlias,
            dirAliased: !!params.dirAlias,
          }),
          path: toPath(factoryFileName(params.module.name), prefix),
        },
    types: {
      content: generateTypes(params),
      path: toPath(typesFileName(params.module.name), prefix),
    },
    utilities:
      params.module.resources.length === 0 ||
      (params.targets && !params.targets.utilities)
        ? undefined
        : {
            content: generateUtilities(params),
            path: toPath(utilitiesFileName(params.module.name), prefix),
          },
  }
}

const generateUtilities = ({
  module,
  resolver,
  varAlias: addrAlias,
  dirAlias,
}: GeneratorParams) => {
  const resourceTypeGuards = module.resources.map(({ name }) => {
    const structDef = resolver.getStructDefinition(module.id, name)
    return resourceTypeGuard({
      moduleId: module.id,
      moduleName: module.abi.name,
      name,
      typeParameters: structDef.typeParameters,
    })
  })

  return utilities({
    addressAlias: addrAlias,
    moduleName: module.name,
    resourceNames: module.resources.map(({ name }) => name),
    utilitiesContents: [...resourceTypeGuards],
    dirAliased: !!dirAlias,
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
    !!params.dirAlias,
  )
  return types({
    importsContent,
    typesContent: generateTypesContent(params, typeCount),
  })
}

const generateTypesContent = (
  { module, resolver, targets: moduleTarget }: GeneratorParams,
  typeCount: Record<string, number>,
) => {
  const entryFunctions =
    moduleTarget && !moduleTarget.entryFunctions
      ? []
      : module.entryFunctions.map(({ name, typeArguments, args }) =>
          entryFunction({
            name,
            typeArguments,
            args: args.map((type) => toTSType(type, resolver)),
          }),
        )

  const resourceGetters =
    moduleTarget && !moduleTarget.getters
      ? []
      : module.resources.map(({ name }) => {
          const structDef = resolver.getStructDefinition(module.id, name)
          return resourceGetter({
            name,
            typeParameters: structDef.typeParameters,
          })
        })

  const eventsGetters =
    moduleTarget && !moduleTarget.getters
      ? []
      : module.structs.filter(isResource).flatMap(({ fields }) =>
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
