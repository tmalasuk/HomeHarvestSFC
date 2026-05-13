//node.js file that runs on the server (not exposed or served through the browser)

const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const Anthropic = require('@anthropic-ai/sdk')

//hooks up google credentials
admin.initializeApp()

//super secret key injected via firebase
const anthropicKey = defineSecret('ANTHROPIC_API_KEY')

//method that checks if user is verified 
async function verifyAuth(req, res) {
    //extract token from HTTP header
    const token = req.headers.authorization?.split('Bearer ')[1]
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return false }
    try {
        await admin.auth().verifyIdToken(token)
        return true
    } catch (err) {
        console.error('verifyIdToken failed:', err.code, err.message)
        res.status(401).json({ error: 'Unauthorized' }); return false
    }
}

// argument "secrets" tells firebase to inject the secret key
// made invoker public because I handle auth
exports.claude = onRequest({ secrets: [anthropicKey], region: 'us-central1', invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') { res.status(405).end(); return }
    // where auth is checked
    if (!await verifyAuth(req, res)) return
    try {
        const client = new Anthropic({ apiKey: anthropicKey.value() })
        //where the actual message to claude is sent. When recipes are generated or parsing imported recipes
        const message = await client.messages.create(req.body)
        res.json(message)
    } catch (err) {
        console.error('Claude API error:', err.message)
        res.status(err.status ?? 500).json({ error: err.message })
    }
})

//recipe URL fetcher - AI implemented
exports.fetchUrl = onRequest({ region: 'us-central1', invoker: 'public', timeoutSeconds: 30 }, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    if (req.method !== 'POST') { res.status(405).end(); return }
    if (!await verifyAuth(req, res)) return

    const { url } = req.body
    if (!url) { res.status(400).json({ error: 'URL required' }); return }

    try {
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
                if (recipe) { res.json({ text: JSON.stringify(recipe), structured: true }); return }
            } catch { /* malformed ld+json, try next block */ }
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
        res.json({ text, structured: false })
    } catch (err) {
        res.status(400).json({ error: `Could not fetch page: ${err.message}` })
    }
})
