import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import syncHandler from './api/sync.js'

function localSyncApiPlugin() {
  const middleware = (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/sync')) {
      return next()
    }
    let rawBody = ''
    req.on('data', (chunk) => {
      rawBody += chunk
    })
    req.on('end', () => {
      if (rawBody) {
        try {
          req.body = JSON.parse(rawBody)
        } catch {
          req.body = {}
        }
      }
      res.status = (code) => {
        res.statusCode = code
        return res
      }
      res.json = (obj) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(obj))
      }
      syncHandler(req, res)
    })
  }
  return {
    name: 'cendis-local-sync-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), localSyncApiPlugin()],
})
