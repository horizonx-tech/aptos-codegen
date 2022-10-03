import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { pascalCase } from 'change-case'
import { FunctionStruct } from 'src/types'
import { toPath } from './utils'

export const factory = ({
  name,
  abi,
}: {
  name: string
  abi: MoveModuleJSON
}) => `${comments}
import { AptosModuleClient, MoveModuleJSON, SignerOrClient } from '@horizonx/aptos-module-client'
import { ${name}Module } from './${name}'
  
const _abi: MoveModuleJSON = ${JSON.stringify(abi, undefined, 2)}
  
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
}) => `${comments}${importsContent}${importsContent && '\n\n'}${typesContent}`

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

export const entryFunction = (fn: FunctionStruct) => {
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
  )}(address: MaybeHexString, params: { typeParameter?: string, query?: { start?:BigInt, limit?: number } }) => Promise<TypedEvent<${type}${genericType(
    typeParameters,
  )}[]>>`

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
  map: Map<string, Set<string>>,
  typeCount: Record<string, number>,
) =>
  Array.from(map.entries())
    .filter(([key]) => !key.startsWith(moduleId))
    .map(([key, typeSet]) => {
      const moduleName = key.split('::')[1]
      return `import { ${Array.from(typeSet)
        .map((type) =>
          moduleName && typeCount[type] > 1 ? toAliasedImport(key, type) : type,
        )
        .sort()
        .join(', ')} } from '${
        moduleName ? toPath(pascalCase(moduleName)) : key
      }'`
    })
    .join('\n')

export const utilities = ({
  address,
  moduleName,
  resourceNames,
  utilitiesContents,
}: {
  address: string
  moduleName: string
  resourceNames: string[]
  utilitiesContents: string[]
}) => `${comments}import { TypedMoveResource } from '@horizonx/aptos-module-client'
import { Types } from 'aptos'
import { ${resourceNames.join(', ')} } from './${moduleName}'

export class ${moduleName}Utils {
  private address: string

  constructor(address?: string){
    this.address = address || '${address}'
  }

${utilitiesContents.join('\n')}
}
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

export const typeParametersExtaractor = ({
  moduleId,
  moduleName,
  name,
}: {
  moduleId: string
  moduleName: string
  name: string
}) =>
  `  extract${name}TypeParameters = (type: string) => {
    const result = new RegExp(\`^\${this.address}::${moduleName}::${name}<(.*)>$\`).exec(type)
    return result && result[1]?.split(', ')
  }
`

const genericType = (typeParameters: string[] | undefined) =>
  typeParameters?.length ? `<${typeParameters.join(', ')}>` : ''

const comments = `/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
`

export const toAlias = (moduleId: string, type: string) =>
  `${pascalCase(moduleId.split('::')[1])}_${type}`

const toAliasedImport = (moduleId: string, type: string) =>
  `${type} as ${toAlias(moduleId, type)}`
