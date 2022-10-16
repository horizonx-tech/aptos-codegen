import { generateFromModules } from 'src/generator'

it('snapshot entryFunctionsOnly', async () => {
  const { modules } = await generateFromModules({
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
    modules.sort((a, b) => (a.types.path > b.types.path ? 1 : -1)),
  ).toMatchSnapshot()
})
