'use strict'

const { ESLint } = require('eslint')

module.exports = (files, fix = false) => async () => {
  const eslint = new ESLint({ fix })
  const results = await eslint.lintFiles(files)
  if (fix) await ESLint.outputFixes(results)
  const output = (await eslint.loadFormatter('stylish')).format(results)
  if (output) process.stdout.write(output)
  if (results.some((result) => result.errorCount || result.warningCount)) {
    throw new Error('JavaScript lint failed')
  }
}
