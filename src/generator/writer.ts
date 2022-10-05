import { mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'

export const writeFiles = async (
  targets: {
    types: { content: string; path: string }
    factory?: { content: string; path: string }
    utilities?: { content: string; path: string }
  }[],
  outDir: string,
) => {
  mkdirSync(outDir, { recursive: true })
  await Promise.all(
    targets.flatMap(({ types, factory, utilities }) => {
      const dirname = path.dirname(path.join(outDir, types.path))
      mkdirSync(dirname, { recursive: true })
      return [
        writeFile(path.join(outDir, types.path), types.content),
        factory && writeFile(path.join(outDir, factory.path), factory.content),
        utilities &&
          writeFile(path.join(outDir, utilities.path), utilities.content),
      ]
    }),
  )
}
