import { generateFromModules } from 'src/generator'

it('snapshot entryFunctionsOnly', async () => {
  const files = await generateFromModules({
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    outDir: 'test/__snapshots__',
    modules: ['0x1::coin'],
    abiFilePathPatterns: ['abi/**/*.json'],
    minifyAbi: true,
    targets: {
      entryFunctions: true,
    },
  })
  expect(
    files.sort((a, b) => (a.types.path > b.types.path ? 1 : -1)),
  ).toMatchSnapshot()
})