import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import inject from '@rollup/plugin-inject'
import Anthropic from '@anthropic-ai/sdk'

function claudeApiMiddleware(apiKey) {
  return {
    name: 'claude-api',
    configureServer(server) {
      server.middlewares.use('/api/claude', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const client = new Anthropic({ apiKey })
            const message = await client.messages.create(JSON.parse(body))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(message))
          } catch (err) {
            console.error('[claude-api]', err.message)
            res.statusCode = err.status ?? 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

      server.middlewares.use('/api/fetch-url', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          const json = (data, status = 200) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }
          try {
            const { url } = JSON.parse(body)
            if (!url) return json({ error: 'URL required' }, 400)

            const pageRes = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
              },
              signal: AbortSignal.timeout(15000),
              redirect: 'follow',
            })
            if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`)
            const html = await pageRes.text()

            // Try JSON-LD structured recipe data first
            const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
            for (const block of ldBlocks) {
              try {
                const data = JSON.parse(block[1].trim())
                const items = [data, ...(data['@graph'] ?? [])]
                const recipe = items.find(item => {
                  const t = item['@type']
                  return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))
                })
                if (recipe) return json({ text: JSON.stringify(recipe), structured: true })
              } catch { /* malformed ld+json, try next */ }
            }

            // Fall back to stripped plain text
            const text = html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 12000)
            if (text.length < 100) throw new Error('Page returned no readable content (bot protection?)')
            json({ text, structured: false })
          } catch (err) {
            console.error('[fetch-url]', err.message)
            json({ error: `Could not fetch page: ${err.message}` }, 400)
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
    plugins: [
      claudeApiMiddleware(env.ANTHROPIC_API_KEY),
      vue(),
inject({
        $: 'jquery',
        jQuery: 'jquery',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
          loadPaths: ['node_modules']
        }
      }
    }
  }
})
