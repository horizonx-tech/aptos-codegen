import { mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'

export const writeFiles = async (
  targets: {
    factory?: { content: string; path: string }
    types: { content: string; path: string }
  }[],
  outDir: string,
) => {
  mkdirSync(outDir, { recursive: true })
  await Promise.all(
    targets.flatMap(({ types, factory }) => [
      writeFile(path.join(outDir, types.path), types.content),
      factory && writeFile(path.join(outDir, factory.path), factory.content),
    ]),
  )
}
