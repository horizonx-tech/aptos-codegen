import { AptosClient } from 'aptos'
import { Config } from 'src/types'
import { generate, generateFiles } from './generator'
import { ModuleLoader } from './loader'
import { ModuleResolverFactory } from './resolver'
import { writeFiles } from './writer'

export const execute = async (config: Config) => {
  const { modules, addressAliases } = await generateFromModules(config)
  const files = generateFiles({ addressAliases })
  return writeFiles(files, modules, config.outDir)
}

export const generateFromModules = async (config: Config) => {
  const { modules, dirAliases, varAliases } = await new ModuleLoader(
    new AptosClient(config.nodeUrl),
  ).loadModules(config.modules, config)
  const resolverFactory = new ModuleResolverFactory(modules, dirAliases)

  const generated = modules.map((module) =>
    generate({
      module,
      resolver: resolverFactory.build(module.id, module.dependencies),
      factoryDisabled:
        !config.modules.includes(module.id) ||
        (config.targets &&
          !config.targets.entryFunctions &&
          !config.targets.getters),
      varAlias: varAliases[module.address],
      dirAlias: dirAliases[module.address],
      minify: config.minifyAbi,
      targets: config.targets,
    }),
  )

  return { modules: generated, addressAliases: varAliases }
}
