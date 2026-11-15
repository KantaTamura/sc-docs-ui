'use strict'

module.exports = (files) => async () => {
  const { default: stylelint } = await import('stylelint')
  const result = await stylelint.lint({ files, formatter: 'string' })
  if (result.report) process.stdout.write(result.report)
  if (result.errored) throw new Error('CSS lint failed')
}
