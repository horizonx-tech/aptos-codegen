import { execute, generateFromModules } from 'src/generator'
import { writeFiles } from 'src/generator/writer'
import { Config } from 'src/types'

jest.mock('src/generator/writer')

describe('generator', () => {
  const config: Config = {
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    outDir: 'test/__snapshots__',
    modules: ['0x1::coin', '0x1::table'],
  }
  describe('execute', () => {
    it('call write files', async () => {
      await execute(config)
      expect(writeFiles).toHaveBeenCalled()
    })
  })
  it('snapshot', async () => {
    const files = await generateFromModules({
      nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
      outDir: 'test/__snapshots__',
      modules: [
        '0x1::coin',
        '0x1::aptos_governance',
        '0x1::iterable_table',
        '0x2::coin',
        '0x3b6e641ab8f8efad88169e44597b9c6822a158a5292a7aa7c0b41cf821603bd9::pool',
      ],
      aliases: {
        '0x1': 'framework',
        '0x3b6e641ab8f8efad88169e44597b9c6822a158a5292a7aa7c0b41cf821603bd9':
          'protocol',
      },
      abiFilePathPatterns: ['abi/**/*.json'],
    })
    expect(
      files.sort((a, b) => (a.types.path > b.types.path ? 1 : -1)),
    ).toMatchSnapshot()
  })
})
