'use strict'

const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const esbuild = require('esbuild')
const fs = require('fs-extra')
const { glob } = require('node:fs/promises')
const path = require('node:path')
const postcss = require('postcss')
const postcssImport = require('postcss-import')

const sourceNotice = 'Space Cubics UI, derived from Antora Default UI. MPL-2.0. ' +
  'Source: https://github.com/spacecubics/sc-docs-ui; license: https://mozilla.org/MPL/2.0/.'

module.exports = (src, dest, preview) => async () => {
  const sourcemaps = preview || process.env.SOURCEMAPS === 'true'
  const jsOptions = {
    bundle: true,
    minify: !preview,
    sourcemap: sourcemaps,
    target: ['es2020'],
    legalComments: 'inline',
    banner: { js: `/*! ${sourceNotice} */` },
  }
  await fs.ensureDir(dest)
  const scripts = (await Array.fromAsync(glob('js/[0-9]*-*.js', { cwd: src }))).sort()
  await esbuild.build({
    ...jsOptions,
    stdin: {
      contents: scripts.map((file) => `require(${JSON.stringify('./' + file)})`).join('\n'),
      resolveDir: path.resolve(src),
      sourcefile: 'site-entry.js',
    },
    outfile: path.join(dest, 'js/site.js'),
  })
  for await (const file of glob('js/vendor/*.js', { cwd: src })) {
    await esbuild.build({
      ...jsOptions,
      entryPoints: [path.join(src, file)],
      outfile: path.join(dest, file.replace(/(?:\.bundle|\.min)?\.js$/, '.js')),
    })
  }
  for await (const file of glob(['css/site.css', 'css/vendor/*.css'], { cwd: src })) {
    const from = path.join(src, file)
    const to = path.join(dest, file)
    const plugins = [postcssImport(), autoprefixer()]
    if (!preview) plugins.push(cssnano({ preset: 'default' }))
    const result = await postcss(plugins).process(await fs.readFile(from, 'utf8'), {
      from,
      to,
      map: sourcemaps ? { inline: false } : false,
    })
    await fs.outputFile(to, result.css)
    if (result.map) await fs.outputFile(`${to}.map`, result.map.toString())
  }
  // Copy images unchanged, preserving binary data and embedded attribution.
  for (const entry of ['ui.yml', 'font', 'img', 'helpers', 'layouts', 'partials']) {
    if (await fs.pathExists(path.join(src, entry))) {
      await fs.copy(path.join(src, entry), path.join(dest, entry))
    }
  }
  if (await fs.pathExists(path.join(src, 'static'))) await fs.copy(path.join(src, 'static'), dest)
}
