import { AptosClient } from 'aptos'
import { Config } from 'src/types'
import { generate } from './generator'
import { ModuleLoader } from './loader'
import { ModuleResolverFactory } from './resolver'
import { writeFiles } from './writer'

export const execute = async (config: Config) => {
  const files = await generateFiles(config)
  return writeFiles(files, config.outDir)
}

export const generateFiles = async (config: Config) => {
  const { modules, aliases } = await new ModuleLoader(
    new AptosClient(config.nodeUrl),
  ).loadModules(config.modules, config)
  const resolverFactory = new ModuleResolverFactory(modules, aliases)
  return modules.map((module) =>
    generate({
      module,
      resolver: resolverFactory.build(module.id, module.dependencies),
      factoryDisabled: !config.modules.includes(module.id),
      alias: aliases[module.address],
    }),
  )
}
