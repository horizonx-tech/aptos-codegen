import { ModuleStruct, TypeStruct } from 'src/types'
import { IModuleResolver } from './resolver'
import {
  entryFunction,
  eventsGetter,
  factory,
  imports,
  resourceGetter,
  struct,
  structField,
  types,
  typesContent,
} from './templates'
import {
  factoryFileName,
  isString,
  isTypeParameter,
  toPath,
  toReservedTypeOrAny,
  typesFileName,
} from './utils'

export const generate = (params: {
  module: ModuleStruct
  resolver: IModuleResolver
  factoryDisabled?: boolean
}) => ({
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
          path: toPath(factoryFileName(params.module.name)),
        },
  types: {
    content: generateTypes(params),
    path: toPath(typesFileName(params.module.name)),
  },
})

const generateTypes = (params: {
  module: ModuleStruct
  resolver: IModuleResolver
}) => {
  const importsContent = imports(params.resolver.getDependenciesMap())
  return types({
    importsContent,
    typesContent: generateTypesContent(params),
  })
}

const generateTypesContent = ({
  module,
  resolver,
}: {
  module: ModuleStruct
  resolver: IModuleResolver
}) => {
  const entryFunctions = module.entryFunctions.map(({ name, args }) =>
    entryFunction({
      name,
      params: args.map((type) => toTypeName(type, resolver)),
    }),
  )

  const resourceGetters = module.resources.map(({ name }) => {
    const structDef = resolver.getStructDefinition(module.id, name)
    return resourceGetter({
      name,
      typeParameters: structDef.typeParameters,
    })
  })

  const eventsGetters = module.events.map(({ name, type }) => {
    const genericType = type.genericTypes[0]
    const structDef = resolver.getStructDefinition(
      genericType.moduleId,
      genericType.name,
    )
    return eventsGetter({
      name,
      type: toTypeName(genericType, resolver),
      typeParameters: structDef.typeParameters,
    })
  })

  const structs = module.structs.map((each) => {
    const fields = each.fields.map(({ name, type }) =>
      structField({
        name: name,
        type: toTypeName(type, resolver),
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

const toTypeName = (type: TypeStruct, resolver: IModuleResolver): string => {
  if (isString(type))
    return isTypeParameter(type) ? type : toReservedTypeOrAny(type)
  if (!type.moduleId) {
    const genericTypeNames = type.genericTypes.map((type) =>
      toTypeName(type, resolver),
    )
    return `Array<${genericTypeNames.join(', ')}>`
  }
  const structDef = resolver.getStructDefinition(type.moduleId, type.name)
  return `${type.name}${
    structDef.typeParameters?.length
      ? `<${type.genericTypes
          .slice(0, structDef.typeParameters.length)
          .map((each) => toTypeName(each, resolver))
          .join(', ')}>`
      : ''
  }`
}
