import { mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'

export const writeFiles = async (
  files: { content: string; path: string }[],
  targets: {
    types: { content: string; path: string }
    factory?: { content: string; path: string }
    utilities?: { content: string; path: string }
  }[],
  outDir: string,
) => {
  mkdirSync(outDir, { recursive: true })
  await Promise.all([
    ...files.map((file) => write(outDir, file)),
    ...targets.flatMap(({ types, factory, utilities }) => {
      const dirname = path.dirname(path.join(outDir, types.path))
      mkdirSync(dirname, { recursive: true })
      return [
        write(outDir, types),
        factory && write(outDir, factory),
        utilities && write(outDir, utilities),
      ]
    }),
  ])
}

const write = (outDir: string, item: { content: string; path: string }) =>
  writeFile(path.join(outDir, item.path), item.content)
