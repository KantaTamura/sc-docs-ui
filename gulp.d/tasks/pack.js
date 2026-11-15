'use strict'

const path = require('node:path')
const { pipeline } = require('node:stream/promises')
const vfs = require('vinyl-fs')

module.exports = (src, dest, bundleName, onFinish) => async () => {
  const { default: zip } = await import('gulp-zip')
  await pipeline(
    vfs.src('**/*', { base: src, cwd: src, dot: true, encoding: false }),
    zip(`${bundleName}-bundle.zip`),
    vfs.dest(dest, { encoding: false })
  )
  if (onFinish) onFinish(path.resolve(dest, `${bundleName}-bundle.zip`))
}
