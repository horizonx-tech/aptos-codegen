import { AptosClient } from 'aptos'
import glob from 'glob'
import { ModuleLoader } from 'src/generator/loader'

jest.mock('glob')

describe('loader', () => {
  let loader: ModuleLoader
  beforeEach(() => {
    const client = new AptosClient('https://example.com')
    const mockFn = jest.fn()
    mockFn.mockResolvedValue({})
    client.getAccountModule = mockFn
    loader = new ModuleLoader(client)
  })
  it('throw error if invalid module id', async () => {
    await expect(loader.loadModules(['invalid'])).rejects.toThrowError()
  })
  it('throw error if abi not found', async () => {
    await expect(loader.loadModules(['0x1::option'])).rejects.toThrowError()
  })
  it('throw error if failed to search files with patterns', async () => {
    jest.spyOn(glob, 'glob').mockImplementation((_0, _1, cb) => {
      cb(new Error(), [])
      return {} as any
    })
    await expect(
      loader.loadModules(['0x1::option'], {
        abiFilePathPatterns: ['thrown'],
      }),
    ).rejects.toThrowError()
  })
})
