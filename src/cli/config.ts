import { readFileSync } from 'fs'
import { Config } from 'src/types'
import yargs from 'yargs'

export const configure = async (args: string[]): Promise<Config> => {
  let config: Partial<Config> = await yargs(args)
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
    .option('--abi-file-path-patterns', {
      alias: 'f',
      description: 'File Path Patterns(glob) of ABI',
      type: 'string',
      array: true,
    })
    .help().argv

  if (config.configurationFile) {
    const configInFile: Partial<Config> = JSON.parse(
      readFileSync(config.configurationFile, 'utf8'),
    )
    config = {
      ...configInFile,
      ...config,
      modules: mergeArrays(configInFile.modules, config.modules),
    }
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
