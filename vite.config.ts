import fs from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const VENUE_MAP_FILE = 'src/data/venue-map.json'

/**
 * Lets the in-browser map editor save straight to `venue-map.json` while
 * `npm run dev` is running, so laying out the venue is edit → Save → done
 * rather than edit → download → move the file. Dev only: there is no server
 * behind the built site, and the editor falls back to downloading the file
 * when this endpoint isn't there.
 */
function venueMapWriter(): Plugin {
  return {
    name: 'venue-map-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__venue-map', (req, res, next) => {
        if (req.method !== 'POST') return next()
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          const body = Buffer.concat(chunks).toString('utf8')
          try {
            // Parse before writing: a malformed body must never land on disk
            // and break the next build.
            JSON.parse(body)
            await fs.writeFile(
              path.resolve(server.config.root, VENUE_MAP_FILE),
              body.endsWith('\n') ? body : `${body}\n`,
              'utf8',
            )
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: VENUE_MAP_FILE }))
          } catch (error) {
            res.statusCode = 400
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'bad request',
              }),
            )
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), venueMapWriter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
