import { MoveModuleJSON } from '@horizonx/aptos-module-client'

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
  static connect = (signerOrClient: SignerOrClient) => {
    return new AptosModuleClient(_abi, signerOrClient) as ${name}Module
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

export const entryFunction = ({
  name,
  params,
}: {
  name: string
  params: string[]
}) => {
  const noParam = params.length === 0
  const args = [
    'type_arguments?: string[]',
    noParam ? undefined : `arguments: [${params.join(', ')}]`,
  ]
    .filter(Boolean)
    .join(', ')
  return `${name}: (args${noParam ? '?' : ''}: { ${args} }) => Promise<void>`
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
  `get${name}: ${genericType(
    typeParameters,
  )}(address: MaybeHexString, typeParameter?: string) => Promise<TypedEvent<${type}${genericType(
    typeParameters,
  )}>>`

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

export const imports = (map: Map<string, Set<string>>) =>
  Array.from(map.entries())
    .map(
      ([path, typeSet]) =>
        `import { ${Array.from(typeSet).sort().join(', ')} } from '${path}'`,
    )
    .join('\n')

export const utilities = ({
  moduleName,
  resourceNames,
  utilitiesContents,
}: {
  moduleName: string
  resourceNames: string[]
  utilitiesContents: string[]
}) => `${comments}import { Types } from 'aptos'
import { ${resourceNames.join(', ')} } from './${moduleName}'
${utilitiesContents.join('\n')}
`

export const resourceTypeGuard = ({
  moduleId,
  name,
  typeParameters,
}: {
  moduleId: string
  name: string
  typeParameters: string[] | undefined
}) =>
  `
export const is${name} = ${genericType(
    typeParameters,
  )}(resource: Types.MoveResource): resource is { type: string; data: ${name}${genericType(
    typeParameters,
  )} } => /^${moduleId}::${name}(?:<|$)/.test(resource.type)`

export const typeParametersExtaractor = ({
  moduleId,
  name,
}: {
  moduleId: string
  name: string
}) =>
  `
export const extract${name}TypeParameters = (type: string) => {
  const result = /^${moduleId}::${name}<(.*)>$/.exec(type)
  return result && result[1]?.split(', ')
}`

const genericType = (typeParameters: string[] | undefined) =>
  typeParameters?.length ? `<${typeParameters.join(', ')}>` : ''

const comments = `/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
`
