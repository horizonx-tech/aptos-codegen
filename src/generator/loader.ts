import { AptosClient } from 'aptos'
import { MoveModuleJSON } from '@horizonx/aptos-module-client'
import { readFile } from 'fs/promises'
import { glob } from 'glob'
import { ModuleStruct } from 'src/types'
import { parseFromABI } from './parser'
import { toModuleId } from './utils'

export class ModuleLoader {
  private touchedModules = new Set<string>()
  private moduleMap = new Map<string, ModuleStruct>()
  private localABIMap = new Map<string, MoveModuleJSON>()

  constructor(private client: AptosClient) {}

  loadModules = async (moduleIds: string[], abiFilePathPatterns?: string[]) => {
    if (abiFilePathPatterns) await this.loadABIFromLocal(abiFilePathPatterns)
    await Promise.all(moduleIds.map(this.loadModule))
    return Array.from(this.moduleMap.values())
  }

  private loadModule = async (id: string) => {
    if (this.touchedModules.has(id)) return
    this.touchedModules.add(id)

    const abi = await this.loadABI(id)
    const module = parseFromABI(abi)
    this.moduleMap.set(module.id, module)

    await Promise.all(
      module.dependencies.map((dependency) => {
        const moduleId = toModuleId(dependency)
        return moduleId && this.loadModule(moduleId)
      }),
    )
  }

  private loadABI = async (id: string) => {
    const localABI = this.localABIMap.get(id)
    if (localABI) {
      console.log('loading module from local...', id)
      return localABI
    }
    console.log('loading module from chain...', id)
    return this.loadABIFromChain(id)
  }

  private loadABIFromLocal = async (patterns: string[]) => {
    const abis = await Promise.all(
      patterns.map(
        (pattern) =>
          new Promise<MoveModuleJSON[]>((resolve, reject) => {
            glob(pattern, {}, async (err, filePaths) => {
              if (err) reject(err)
              const res = await Promise.all(
                filePaths.map(async (filePath) => {
                  const json = JSON.parse(await readFile(filePath, 'utf8')) as
                    | MoveModuleJSON
                    | { abi: MoveModuleJSON }
                    | { abi: MoveModuleJSON }[]
                  if (Array.isArray(json)) return json.map(({ abi }) => abi)
                  if ('abi' in json) return [json.abi]
                  return [json]
                }),
              )
              return resolve(res.flat())
            })
          }),
      ),
    )
    abis.flat().forEach((abi) => {
      this.localABIMap.set(`${abi.address}::${abi.name}`, abi)
    })
  }

  private loadABIFromChain = async (id: string) => {
    const [address, name] = id.split('::')
    if (!address || !name) throw new Error(`Invalid moduleId: ${id}`)

    const { abi } = await this.client.getAccountModule(address, name)
    if (!abi) throw new Error(`ABI not found. moduleId: ${id}`)
    return abi
  }
}
