'use strict'

const { watch } = require('gulp')

module.exports = ({ name, desc, opts, call: fn, loop }) => {
  if (name) {
    fn.displayName = name
  }
  if (loop) {
    const delegate = fn
    name = delegate.displayName
    delegate.displayName = `${name}:loop`
    fn = () => watch(loop, { ignoreInitial: false }, delegate)
    fn.displayName = name
  }
  if (desc) fn.description = desc
  if (opts) fn.flags = opts
  return fn
}
