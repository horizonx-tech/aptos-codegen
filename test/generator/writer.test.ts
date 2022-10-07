import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { writeFiles } from 'src/generator/writer'

jest.mock('fs')
jest.mock('fs/promises')

describe('writer', () => {
  describe('writeFiles', () => {
    it('call fs functions with passed args', async () => {
      const files = [{ content: 'file1', path: 'file.ts' }]
      const modules = [
        {
          types: { content: 'types1', path: 'Types1.ts' },
          factory: { content: 'factory', path: 'Factory.ts' },
          utilities: { content: 'utilities', path: 'Utils.ts' },
        },
        { types: { content: 'types2', path: 'Types2.ts' } },
      ]
      const outDir = 'src/__generated__'
      await writeFiles(files, modules, outDir)
      expect(fs.mkdirSync).toHaveBeenCalledWith(outDir, { recursive: true })
      expect(fsPromises.writeFile).toHaveBeenNthCalledWith(
        1,
        path.join(outDir, files[0].path),
        files[0].content,
      )
      expect(fsPromises.writeFile).toHaveBeenNthCalledWith(
        2,
        path.join(outDir, modules[0].types.path),
        modules[0].types.content,
      )
      expect(fsPromises.writeFile).toHaveBeenNthCalledWith(
        3,
        path.join(outDir, modules[0].factory.path),
        modules[0].factory.content,
      )
      expect(fsPromises.writeFile).toHaveBeenNthCalledWith(
        4,
        path.join(outDir, modules[0].utilities.path),
        modules[0].utilities.content,
      )
      expect(fsPromises.writeFile).toHaveBeenNthCalledWith(
        5,
        path.join(outDir, modules[1].types.path),
        modules[1].types.content,
      )
    })
  })
})
