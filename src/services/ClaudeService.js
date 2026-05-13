const SYSTEM_PROMPT = `You are an expert home cook and recipe developer for HomeHarvest, a home pantry management app.
Respond ONLY with valid JSON — no markdown fences, no explanation, just the raw JSON object.
Required JSON shape:
{
  "recipes": [
    {
      "name": "string",
      "description": "string",
      "prepTime": 0,
      "cookTime": 0,
      "servings": 0,
      "categories": ["string"],
      "ingredients": [{ "name": "string", "qty": 0, "unit": "string", "category": "one of the valid categories below", "prep": "string" }],
      "instructions": ["string"]
    }
  ]
}
Cooking standards you must follow:
- Use correct temperatures and times for each protein (e.g. chicken breasts need medium heat and adequate resting time to stay juicy, not high heat which dries them out)
- Instructions must be specific: include heat levels, visual cues, internal temperatures where relevant, and resting times
- Season at each stage, not just at the end
- Recipes must be practical and reliably reproducible in a home kitchen
- Keep recipe names simple and to the point and do not exceed 30 characters for a name.
- Include at minimum three relevant categories per recipe (e.g. dinner, quick, spicy, vegetarian, comfort food, one-pan, etc.)
Valid ingredient categories (use ONLY these exact strings for the category field):
Produce, Dairy, Meat, Deli, Grains, Frozen, Canned Goods, Snacks, Condiments, Spices, Baking, Beverages, Breakfast, Misc
Examples: chicken → Meat, milk → Dairy, flour → Baking, olive oil → Condiments, pasta → Grains, garlic → Produce, cumin → Spices, canned tomatoes → Canned Goods

Ingredient and measurement rules:
- List the TOTAL quantity of each ingredient needed for the whole recipe — never per-serving amounts
- Instructions must reference ingredients by name only, not by quantity (say "spread the butter" not "spread 0.5 tbsp of butter")
- Never use decimal tablespoons — convert to teaspoons for amounts under 1 tbsp (0.5 tbsp = 1.5 tsp, 0.25 tbsp = 0.75 tsp)
- Use clean whole or half numbers where possible (1, 2, 0.5, 1.5) — avoid 0.333, 0.75, etc.
- Normalize ingredient names: "name" must be the bare ingredient only (e.g. "parsley", "garlic", "onion"). Move ALL descriptors — freshness (fresh, dried, dry), size (large, small), variety (flat-leaf, yellow), preparation (minced, chopped, diced, sliced, grated, crushed, finely, roughly, etc.), flavor/state (seasoned, spiced, salted, sweetened, roasted, smoked, etc.) — into the optional "prep" field as a short phrase. Omit "prep" only if there are truly no descriptors. (e.g. "fresh flat-leaf parsley" → name: "parsley", prep: "fresh, flat-leaf"; "finely minced garlic" → name: "garlic", prep: "finely minced"; "large yellow onion, diced" → name: "onion", prep: "large, diced"; "seasoned dry bread crumbs" → name: "bread crumbs", prep: "seasoned, dry")
- When the prompt provides pantry item names, use those EXACT names as-is in the ingredient list — do not expand, qualify, or reword them (e.g. if given "sage", write "sage", not "fresh sage leaves" or "dried sage")
JSON formatting rules:
- Every object in the recipes array must be separated by a comma — the array must be valid: [{...},{...},{...},{...}]
- Never use the inch symbol (") inside string values — write "inch" instead (e.g. 12 inch skillet, not 12" skillet)
- Never include literal newlines or tab characters inside string values
- All qty values must be numbers, not strings (use 0.5 not "1/2")`

import { auth } from '../firebase.js'

// Returns a dietary restrictions preamble string, or empty string if none
function dietaryPrefix(restrictions) {
    if (!restrictions?.length) return ''
    return `DIETARY REQUIREMENTS (non-negotiable — substitute any non-compliant ingredients with appropriate alternatives, do not just omit them): ${restrictions.join(', ')}.\n`
}

class ClaudeService {
    // Generates 4 recipes focused on using the given expiring pantry items
    static async generateFromExpiring(expiringItems, dietaryRestrictions = []) {
        const list = expiringItems
            .map(i => `${i.name} (${i.daysUntil} day${i.daysUntil === 1 ? '' : 's'} left)`)
            .join(', ')
        return this._call(
            dietaryPrefix(dietaryRestrictions) +
            `Generate 4 practical recipes using these pantry items that are expiring soon: ${list}. ` +
            `Prioritize using as many of these as possible. Focus on simple, everyday meals. ` +
            `Use the ingredient names EXACTLY as written above — do not reword, qualify, or expand them.`
        )
    }

    // Generates 4 recipes from a free-text prompt, optionally hinted with pantry item names
    static async generateFromPrompt(prompt, pantryNames = [], dietaryRestrictions = []) {
        const hint = pantryNames.length
            ? ` The user currently has these pantry items available: ${pantryNames.slice(0, 15).join(', ')}.`
            : ''
        return this._call(`${dietaryPrefix(dietaryRestrictions)}Generate 4 recipes for this request: "${prompt}".${hint}`)
    }

    // Fetches a URL's recipe content server-side and converts it to a single recipe object
    static async importFromUrl(url) {
        await auth.authStateReady()
        if (!auth.currentUser) throw new Error('Not logged in')
        const token = await auth.currentUser.getIdToken()

        const fetchRes = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url }),
        })
        if (!fetchRes.ok) {
            let message = 'Failed to fetch URL'
            try { const e = await fetchRes.json(); message = e.error ?? message } catch { /* empty body */ }
            throw new Error(message)
        }
        const { text, structured } = await fetchRes.json()

        const prompt = structured
            ? `Convert this structured recipe data into the required format. Return exactly one recipe in the recipes array:\n\n${text}`
            : `Extract the recipe from this webpage text. Return exactly one recipe in the recipes array:\n\n${text}`

        const recipes = await this._call(prompt)
        return recipes[0] ?? null
    }

    // Generates 2 recipes from a specific list of pantry item names
    static async generateFromPantryItems(names, dietaryRestrictions = []) {
        return this._call(
            dietaryPrefix(dietaryRestrictions) +
            `Generate 2 recipes using primarily these pantry items: ${names.join(', ')}. ` +
            `You may include common staples (salt, pepper, oil, garlic) as supporting ingredients. ` +
            `Use the pantry item names EXACTLY as written above — do not reword, qualify, or expand them.`
        )
    }

    // Sends the prompt to the server-side Claude proxy and returns a parsed array of recipe objects
    static async _call(userContent) {
        await auth.authStateReady()
        if (!auth.currentUser) throw new Error('Not logged in')
        const token = await auth.currentUser.getIdToken()
        const res = await fetch('/api/claude', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 8192,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: userContent }],
            }),
        })

        if (!res.ok) throw new Error(`Generation failed (${res.status})`)

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const raw = data.content?.[0]?.text ?? ''
        // Fix missing commas between adjacent objects in arrays (Claude occasionally omits them)
        // Fix unescaped inch symbols inside string values
        const text = raw
            .replace(/，/g, ',')
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/\}\s*\{/g, '},{')
            .replace(/(\d)"\s*([a-zA-Z])/g, '$1 inch $2')
            .replace(/(\d)",/g, '$1 inch,')
            .replace(/(\d)"\]/g, '$1 inch]')

        let parsed
        try {
            parsed = JSON.parse(text)
        } catch (e) {
            console.error('[ClaudeService] JSON parse failed:', e.message)
            console.log('[ClaudeService] Raw response text:\n', raw)
            console.log('[ClaudeService] Sanitized text:\n', text)
            const match = text.match(/\{[\s\S]*\}/)
            if (!match) throw new Error('Could not parse recipe response')
            try {
                parsed = JSON.parse(match[0])
            } catch (e2) {
                console.error('[ClaudeService] Fallback parse also failed:', e2.message)
                throw new Error('Could not parse recipe response')
            }
        }

        return (parsed.recipes ?? []).map(r => ({
            ...r,
            id: crypto.randomUUID(),
            source: 'ai',
            savedToBook: false,
            photo: null,
            tags: r.categories ?? [],
        }))
    }
}

export default ClaudeService
