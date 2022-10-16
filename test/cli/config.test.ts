import fs from 'fs'
import { configure } from 'src/cli/config'
import { Config } from 'src/types'

jest.mock('fs')

describe('config', () => {
  describe('configure', () => {
    const expected: Config = {
      modules: ['0x1::coin'],
      outDir: 'dist',
      nodeUrl: 'https:://example.com',
    }
    it('can configure with args', async () => {
      const { modules, outDir, nodeUrl } = await configure([
        '-m',
        expected.modules.join(' '),
        '-o',
        expected.outDir,
        '-u',
        expected.nodeUrl,
      ])
      expect(modules).toHaveLength(expected.modules.length)
      expected.modules.forEach((module) => modules.includes(module))
      expect(outDir).toBe(expected.outDir)
      expect(nodeUrl).toBe(expected.nodeUrl)
    })
    it('can configure from a configuration file', async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
      const { modules, outDir, nodeUrl } = await configure([
        '-c',
        'path-to-configuration-file',
      ])
      expect(modules).toHaveLength(expected.modules.length)
      expected.modules.forEach((module) => modules.includes(module))
      expect(outDir).toBe(expected.outDir)
      expect(nodeUrl).toBe(expected.nodeUrl)
    })
    it('can overwrite settings in a configuration file with args', async () => {
      jest
        .spyOn(require('fs'), 'readFileSync')
        .mockReturnValue(JSON.stringify(expected))
      const additionalConfig: Config = {
        outDir: 'dist2',
        modules: ['0x1::coin2'],
        nodeUrl: 'https://example2.com',
      }
      const { modules, outDir, nodeUrl } = await configure([
        '-c',
        'path-to-configuration-file',
        '-m',
        additionalConfig.modules.join(' '),
        '-o',
        additionalConfig.outDir,
        '-u',
        additionalConfig.nodeUrl,
      ])
      const expectedModules = expected.modules.concat(additionalConfig.modules)
      expect(modules).toHaveLength(expectedModules.length)
      expectedModules.forEach((module) => modules.includes(module))
      expect(outDir).toBe(additionalConfig.outDir)
      expect(nodeUrl).toBe(additionalConfig.nodeUrl)
    })
    describe('can parse aliases from args', () => {
      it('from args', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
        const { aliases } = await configure([
          '-c',
          'path-to-configuration-file',
          '-a',
          '0x1=framework',
          '0x2=example',
        ])
        expect(aliases['0x1']).toBe('framework')
        expect(aliases['0x2']).toBe('example')
      })
      it('from a file', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
          JSON.stringify({
            ...expected,
            aliases: { '0x1': 'framework', '0x2': 'example' },
          }),
        )
        const { aliases } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(aliases['0x1']).toBe('framework')
        expect(aliases['0x2']).toBe('example')
      })
      it('can resolve an alias to an address', async () => {
        const modulesWithAlias = [
          'framework::coin',
          'example::event',
          '0x3::raw',
        ]
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
          JSON.stringify({
            ...expected,
            aliases: { '0x1': 'framework', '0x2': 'example' },
            modules: modulesWithAlias,
          }),
        )
        const { modules } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(modules).toHaveLength(modulesWithAlias.length)
        expect(modules[0]).toBe('0x1::coin')
        expect(modules[1]).toBe('0x2::event')
        expect(modules[2]).toBe('0x3::raw')
      })
    })
    describe('can parse minifyAbi', () => {
      it('not passed', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
        const { minifyAbi } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(minifyAbi).toBeFalsy()
      })
      it('from args', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
        const { minifyAbi } = await configure([
          '-c',
          'path-to-configuration-file',
          '--minify-abi',
        ])
        expect(minifyAbi).toBeTruthy()
      })
      it('from a file', async () => {
        jest
          .spyOn(fs, 'readFileSync')
          .mockReturnValue(JSON.stringify({ ...expected, minifyAbi: true }))
        const { minifyAbi } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(minifyAbi).toBeTruthy()
      })
    })
    describe('can parse targets', () => {
      it('not passed', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
        const { targets } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(targets).toBeUndefined()
      })
      it('from args', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(expected))
        const { targets } = await configure([
          '-c',
          'path-to-configuration-file',
          '-t',
          'entryFunctions',
          'utilities',
          'getters',
        ])
        expect(targets.entryFunctions).toBeTruthy()
        expect(targets.utilities).toBeTruthy()
        expect(targets.getters).toBeTruthy()
      })
      it('from a file', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
          JSON.stringify({
            ...expected,
            targets: {
              entryFunctions: true,
              utilities: true,
              getters: true,
            },
          }),
        )
        const { targets } = await configure([
          '-c',
          'path-to-configuration-file',
        ])
        expect(targets.entryFunctions).toBeTruthy()
        expect(targets.utilities).toBeTruthy()
        expect(targets.getters).toBeTruthy()
      })
    })
    it('should throw error if outDir is not passed', async () => {
      await expect(
        configure(['-m', expected.modules.join(' '), '-u', expected.nodeUrl]),
      ).rejects.toThrowError()
    })
    it('should throw error if modules is not passed or empty', async () => {
      await expect(
        configure(['-o', expected.outDir, '-u', expected.nodeUrl]),
      ).rejects.toThrowError()
      await expect(
        configure(['-m', '-o', expected.outDir, '-u', expected.nodeUrl]),
      ).rejects.toThrowError()
    })
    it('should throw error if nodeUrl is not passed or empty', async () => {
      await expect(
        configure(['-m', expected.modules.join(' '), '-o', expected.outDir]),
      ).rejects.toThrowError()
    })
  })
})
