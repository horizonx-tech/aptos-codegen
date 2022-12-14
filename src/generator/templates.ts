import {
  MoveModuleJSON,
  MoveModuleJSONMinified,
} from '@horizonx/aptos-module-client'
import { Types } from 'aptos'
import { pascalCase } from 'change-case'
import { FunctionStruct } from 'src/types'

export const factory = ({
  name,
  abi,
  addressAlias,
  dirAliased,
}: {
  name: string
  abi: MoveModuleJSON | MoveModuleJSONMinified
  addressAlias: string
  dirAliased: boolean
}) => `${comments}
import { AptosModuleClient, MoveModuleJSON, MoveModuleJSONMinified, SignerOrClient } from '@horizonx/aptos-module-client'
import { ${name}Module } from './${name}'
import { ${addressAlias} } from '${dirAliased ? '..' : '.'}/addresses'
  
const _abi: MoveModuleJSON | MoveModuleJSONMinified = ${JSON.stringify(
  abi,
  undefined,
  2,
).replace(`"${abi.address}"`, addressAlias)}
  
export class ${name}ModuleFactory {
  static readonly abi = _abi
  static connect = (signerOrClient: SignerOrClient, address?: string) => {
    return new AptosModuleClient(_abi, signerOrClient, address) as ${name}Module
  }
}
`

export const types = ({
  importsContent,
  typesContent,
}: {
  importsContent: string
  typesContent: string
}) => `${comments}\n${importsContent}${importsContent && '\n\n'}${typesContent}`

export const typesContent = ({
  structs,
  ...params
}: {
  name: string
  entryFunctions: string[]
  resourceGetters: string[]
  eventsGetters: string[]
  structs: string[]
}) => {
  const moduleContent = moduleType(params)
  return `${moduleContent}${moduleContent && '\n'}${structs.join('\n')}`
}

const moduleType = ({
  name,
  entryFunctions,
  resourceGetters,
  eventsGetters,
}: {
  name: string
  entryFunctions: string[]
  resourceGetters: string[]
  eventsGetters: string[]
}) =>
  entryFunctions.length || resourceGetters.length
    ? `export interface ${name}Module extends AptosModuleClient  {
  ${[...entryFunctions, ...resourceGetters, ...eventsGetters].join('\n  ')}
}
`
    : ''

export const entryFunction = (
  fn: Omit<FunctionStruct, 'args'> & { args: string[] },
) => {
  const args = [
    fn.typeArguments.length === 0
      ? undefined
      : `type_arguments: [${fn.typeArguments.map(() => 'string').join(', ')}]`,
    fn.args.length === 0 ? undefined : `arguments: [${fn.args.join(', ')}]`,
  ]
    .filter(Boolean)
    .join(', ')
  const options = `options?: Partial<Types.SubmitTransactionRequest>`
  return `${fn.name}: (${
    args.length ? `payload: { ${args} }, ${options}` : options
  }) => Promise<Types.HashValue>`
}

export const resourceGetter = ({
  name,
  typeParameters,
}: {
  name: string
  typeParameters: string[] | undefined
}) =>
  `get${name}: ${genericType(
    typeParameters,
  )}(owner: MaybeHexString, typeParameter?: string) => Promise<TypedMoveResource<${name}${genericType(
    typeParameters,
  )}>>`

export const eventsGetter = ({
  name,
  type,
  typeParameters,
}: {
  name: string
  type: string
  typeParameters: string[] | undefined
}) =>
  `get${pascalCase(name)}: ${genericType(
    typeParameters,
  )}(address: MaybeHexString, params?: EventGetterParams) => Promise<TypedVersionedEvent<${type}${genericType(
    typeParameters,
  )}>[]>`

export const struct = ({
  name,
  fields,
  typeParameters,
}: {
  name: string
  fields: string[]
  typeParameters: string[] | undefined
}) => `export type ${name}${genericType(typeParameters)} = {
  ${fields.join(`\n  `)}
}
`

export const structField = ({ name, type }: { name: string; type: string }) =>
  `${name}: ${type}`

export const imports = (
  moduleId: string,
  dependenciesMap: Map<string, { path: string; types: Set<string> }>,
  typeCount: Record<string, number>,
  aliased?: boolean,
) => {
  const [moduleAddress] = moduleId.split('::')
  return Array.from(dependenciesMap.entries())
    .filter(([key]) => key !== moduleId)
    .map(([key, { path, types }]) => {
      const [address, moduleName] = key.split('::')
      const aliasedPath =
        aliased && moduleName && address !== moduleAddress ? `.${path}` : path
      return `import { ${Array.from(types)
        .map((type) =>
          moduleName && typeCount[type] > 1 ? toAliasedImport(key, type) : type,
        )
        .sort()
        .join(', ')} } from '${aliasedPath}'`
    })
    .join('\n')
}
export const utilities = ({
  moduleName,
  resourceNames,
  utilitiesContents,
  addressAlias,
  dirAliased,
}: {
  addressAlias: string
  moduleName: string
  resourceNames: string[]
  utilitiesContents: string[]
  dirAliased: boolean
}) => `${comments}
import { TypedMoveResource } from '@horizonx/aptos-module-client'
import { Types } from 'aptos'
import { ${resourceNames.join(', ')} } from './${moduleName}'
import { ${addressAlias} } from '${dirAliased ? '..' : '.'}/addresses'

export class ${moduleName}Utils {
  constructor(private address: string = ${addressAlias}){}

${utilitiesContents.join('\n')}}
`

export const resourceTypeGuard = ({
  moduleId,
  moduleName,
  name,
  typeParameters,
}: {
  moduleId: string
  moduleName: string
  name: string
  typeParameters: string[] | undefined
}) =>
  `  is${name} = ${genericType(
    typeParameters,
  )}(resource: Types.MoveResource): resource is TypedMoveResource<${name}${genericType(
    typeParameters,
  )}> => {
    const regexp = new RegExp(\`\${this.address}::${moduleName}::${name}(?:<|$)\`)
    return regexp.test(resource.type)
  }
`

const genericType = (typeParameters: string[] | undefined) =>
  typeParameters?.length ? `<${typeParameters.join(', ')}>` : ''

export const comments = `/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */`

export const toAlias = (moduleId: string, type: string) =>
  `${pascalCase(moduleId.split('::')[1])}_${type}`

const toAliasedImport = (moduleId: string, type: string) =>
  `${type} as ${toAlias(moduleId, type)}`

export const addresses = (addressAliases: Record<Types.Address, string>) => {
  const items = [
    ...Object.keys(addressAliases)
      .sort()
      .map(
        (address) => `export const ${addressAliases[address]} = '${address}'`,
      ),
  ]
  return `${comments}
${items.join('\n')}
`
}
