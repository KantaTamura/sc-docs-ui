'use strict'

const { createServer } = require('node:http')
const sirv = require('sirv')

module.exports = (root, opts = {}, watch) => (done) => {
  const server = createServer(sirv(root, { dev: true }))
  server.once('error', done)
  server.listen(opts.port, opts.host, () => {
    process.stdout.write(`Preview: http://localhost:${opts.port}\n`)
    if (watch) watch()
  })
}
