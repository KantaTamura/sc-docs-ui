'use strict'

const Asciidoctor = require('@asciidoctor/core')
const fs = require('fs-extra')
const { glob } = require('node:fs/promises')
const path = require('node:path')
const handlebars = require('handlebars')
const requireFromString = require('require-from-string')
const yaml = require('js-yaml')

const ASCIIDOC_ATTRIBUTES = { experimental: '', icons: 'font', sectanchors: '', 'source-highlighter': 'highlight.js' }

module.exports = (src, previewSrc, previewDest) => async () => {
  const baseUiModel = yaml.load(await fs.readFile(path.join(previewSrc, 'ui-model.yml'), 'utf8'))
  const templates = handlebars.create()
  templates.registerHelper('resolvePage', (spec) => spec && { pub: { url: resolvePageURL(spec) } })
  templates.registerHelper('resolvePageURL', resolvePageURL)
  for await (const file of glob('helpers/*.js', { cwd: src })) {
    templates.registerHelper(path.basename(file, '.js'), requireFromString(await fs.readFile(path.join(src, file), 'utf8')))
  }
  for await (const file of glob('partials/*.hbs', { cwd: src })) {
    templates.registerPartial(path.basename(file, '.hbs'), await fs.readFile(path.join(src, file), 'utf8'))
  }
  const layouts = new Map()
  for await (const file of glob('layouts/*.hbs', { cwd: src })) {
    layouts.set(path.basename(file, '.hbs'), templates.compile(await fs.readFile(path.join(src, file), 'utf8'), {
      preventIndent: true,
      srcName: path.join(src, file),
    }))
  }
  for await (const file of glob('**/*.{png,svg}', { cwd: previewSrc })) {
    await fs.copy(path.join(previewSrc, file), path.join(previewDest, file))
  }
  for await (const file of glob('**/*.adoc', { cwd: previewSrc })) {
    const siteRootPath = path.relative(path.dirname(file), '.').split(path.sep).join('/')
    const uiModel = {
      ...baseUiModel,
      env: process.env,
      page: { ...baseUiModel.page },
      siteRootPath,
      uiRootPath: path.posix.join(siteRootPath, '_'),
    }
    if (path.basename(file) === '404.adoc') {
      uiModel.page = { layout: '404', title: 'Page Not Found' }
    } else {
      const doc = await Asciidoctor.load(await fs.readFile(path.join(previewSrc, file), 'utf8'), {
        safe: 'safe',
        attributes: ASCIIDOC_ATTRIBUTES,
      })
      uiModel.page.attributes = Object.fromEntries(Object.entries(doc.getAttributes())
        .filter(([name]) => name.startsWith('page-'))
        .map(([name, value]) => [name.slice(5), value]))
      uiModel.page.layout = doc.getAttribute('page-layout', 'default')
      uiModel.page.title = doc.getDocumentTitle()
      uiModel.page.contents = await doc.convert()
    }
    const layout = layouts.get(uiModel.page.layout)
    if (!layout) throw new Error(`Unknown preview layout: ${uiModel.page.layout} (${file})`)
    await fs.outputFile(path.join(previewDest, file.replace(/\.adoc$/, '.html')), layout(uiModel))
  }
}

function resolvePageURL (spec) {
  if (spec) return '/' + spec.split(':').pop().replace(/\.adoc$/, '.html')
}
