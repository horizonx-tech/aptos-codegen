#!/usr/bin/env node

import { exit } from 'process'
import { execute } from 'src/generator'
import { configure } from './config'

const main = async () => {
  const config = await configure(process.argv.slice(2))
  return execute(config)
}

main().catch((e) => {
  console.error(e)
  exit(1)
})
