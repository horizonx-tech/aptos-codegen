import { Types } from 'aptos'
import { readFileSync } from 'fs'
import { Config, RawConfig } from 'src/types'
import yargs from 'yargs'

export const configure = async (args: string[]): Promise<Config> => {
  let config: Partial<Config> = {}
  const rawConfigArgs: Partial<RawConfig> = await yargs(args)
    .option('configuration-file', {
      alias: 'c',
      description: 'Configuration File',
      type: 'string',
    })
    .option('out-dir', {
      alias: 'o',
      description: 'Output Directory',
      type: 'string',
    })
    .option('modules', {
      alias: 'm',
      description: 'Modules',
      type: 'string',
      array: true,
    })
    .option('node-url', {
      alias: 'u',
      description: 'Node URL',
      type: 'string',
    })
    .option('aliases', {
      alias: 'a',
      description: 'Aliases of address: {address}={alias}',
      type: 'string',
      array: true,
    })
    .option('minify-abi', {
      description: 'Minify ABI output to factory',
      type: 'boolean',
    })
    .option('targets', {
      alias: 't',
      description:
        'Generation target(s) of code. entryFunctions/getters/utilities',
      type: 'string',
      array: true,
    })
    .option('abi-file-path-patterns', {
      alias: 'f',
      description: 'File Path Patterns(glob) of ABI',
      type: 'string',
      array: true,
    })
    .help().argv

  const { aliases, targets, ...rest } = rawConfigArgs
  config = {
    ...rest,
    targets: targets?.reduce((res, target) => ({ ...res, [target]: true }), {}),
    aliases: aliases?.reduce((res, each) => {
      const [address, alias] = each.split('=')
      return { ...res, [address]: alias }
    }, {}),
  }
  if (config.configurationFile) {
    const configInFile: Partial<Config> = JSON.parse(
      readFileSync(config.configurationFile, 'utf8'),
    )
    config = {
      ...configInFile,
      ...config,
      aliases: (configInFile.aliases || config.aliases) && {
        ...configInFile.aliases,
        ...config.aliases,
      },
      targets: (configInFile.targets || config.targets) && {
        ...configInFile.targets,
        ...config.targets,
      },
      modules: mergeArrays(configInFile.modules, config.modules),
    }
  }
  if (config.aliases) {
    config.modules = resolveAddress(config.modules, config.aliases)
  }
  return isValidConfig(config) && config
}

const isValidConfig = (config: Partial<Config>): config is Config => {
  if (!config.outDir) throw new Error('"outDir" is required.')
  if (!config.modules?.length) throw new Error('"modules" are required.')
  if (!config.nodeUrl) throw new Error('"node-url" is required.')
  return true
}

const mergeArrays = <T>(...maybeArrays: (T | null | undefined)[][]): T[] =>
  maybeArrays.filter(Boolean).flat()

const resolveAddress = (
  moduleIds: string[],
  aliases: Partial<Record<Types.Address, string>>,
) => {
  const aliasesReversed = Object.entries(aliases).reduce<
    Partial<Record<string, Types.Address>>
  >((res, [key, value]) => ({ ...res, [value]: key }), {})
  return moduleIds.map((moduleId) => {
    const [alias, name] = moduleId.split('::')
    const address = aliasesReversed[alias]
    if (address) return `${address}::${name}`
    return moduleId
  })
}
