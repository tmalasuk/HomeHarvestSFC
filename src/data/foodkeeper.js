import foodkeeperData from './foodkeeper.json'

// unitIndex used by HomeHarvest: 0=days  1=weeks  2=months  3=years
const METRIC_TO_INDEX = {
    'Days':   0,
    'Weeks':  1,
    'Months': 2,
    'Year':   3,
    'Years':  3,
}

// Storage field groups in priority order.
// Refrigerated-from-purchase comes first (perishable items like fresh meat/dairy).
// Pantry (unopened) comes before after-opening variants — the default expiration
// for a newly purchased item should reflect how long it lasts sealed in the pantry.
const STORAGE_PRIORITY = [
    ['DOP_Refrigerate_Min',     'DOP_Refrigerate_Max',     'DOP_Refrigerate_Metric'],
    ['Refrigerate_Min',         'Refrigerate_Max',         'Refrigerate_Metric'],
    ['DOP_Pantry_Min',          'DOP_Pantry_Max',          'DOP_Pantry_Metric'],
    ['Pantry_Min',              'Pantry_Max',              'Pantry_Metric'],
    ['Refrigerate_After_Opening_Min', 'Refrigerate_After_Opening_Max', 'Refrigerate_After_Opening_Metric'],
    ['Pantry_After_Opening_Min','Pantry_After_Opening_Max','Pantry_After_Opening_Metric'],
]

// Flatten the jagged row format [{ Key: value }, ...] into a plain object
function flattenRow(row) {
    return Object.assign({}, ...row)
}

// Extract the best available storage duration from a product record
function pickStorage(product) {
    for (const [minKey, maxKey, metricKey] of STORAGE_PRIORITY) {
        const unitIndex = METRIC_TO_INDEX[product[metricKey]]
        if (unitIndex === undefined) continue
        const val = product[maxKey] ?? product[minKey]
        if (val != null) return { durationValue: val, unitIndex }
    }
    return null
}

// Build flat product list once at module load
const PRODUCTS = foodkeeperData.sheets
    .find(s => s.name === 'Product')
    .data.map(flattenRow)

// Manual overrides for items where foodkeeper has no usable duration data
// (e.g. "Package use-by date" metric) or where the scoring picks a wrong variant.
// unitIndex: 0=days 1=weeks 2=months 3=years
const SHELF_LIFE_OVERRIDES = {
    'milk':            { durationValue: 2,  unitIndex: 1 }, // foodkeeper uses "Package use-by date"
    'whole milk':      { durationValue: 2,  unitIndex: 1 },
    '2% milk':         { durationValue: 2,  unitIndex: 1 },
    'skim milk':       { durationValue: 2,  unitIndex: 1 },
    'almond milk':     { durationValue: 10, unitIndex: 0 }, // ~7-10 days after opening
    'oat milk':        { durationValue: 10, unitIndex: 0 },
    'soy milk':        { durationValue: 10, unitIndex: 0 },
    'buttermilk':      { durationValue: 2,  unitIndex: 1 },
    'chocolate milk':  { durationValue: 2,  unitIndex: 1 },
    'bread':           { durationValue: 1,  unitIndex: 1 }, // only "homemade" / "commercial" entries
    'tomato sauce':    { durationValue: 18, unitIndex: 2 }, // only after-opening data in foodkeeper
    'orange juice':    { durationValue: 2,  unitIndex: 1 }, // only after-opening / fresh-squeezed data
    'canned tomatoes': { durationValue: 18, unitIndex: 2 }, // high-acid canned goods ~18 months

    // Frozen vegetables — foodkeeper has no frozen veg entries; scores hit wrong products
    'frozen peas':          { durationValue: 8, unitIndex: 2 },
    'frozen corn':          { durationValue: 8, unitIndex: 2 },
    'frozen corn kernels':  { durationValue: 8, unitIndex: 2 },
    'frozen broccoli':      { durationValue: 8, unitIndex: 2 },
    'frozen spinach':       { durationValue: 8, unitIndex: 2 },
    'frozen green beans':   { durationValue: 8, unitIndex: 2 },
    'frozen carrots':       { durationValue: 8, unitIndex: 2 },
    'frozen edamame':       { durationValue: 8, unitIndex: 2 },
    'frozen cauliflower':   { durationValue: 8, unitIndex: 2 },
    'frozen mixed vegetables': { durationValue: 8, unitIndex: 2 },
}

/**
 * Look up the default shelf life for a pantry item by name.
 * Returns { durationValue, unitIndex } matching HomeHarvest's units array.
 * Falls back to 2 weeks if nothing matches.
 */
export function getShelfLife(name) {
    const n = name.toLowerCase().trim()
    if (SHELF_LIFE_OVERRIDES[n]) return SHELF_LIFE_OVERRIDES[n]
    const queryTokens = n.split(/\s+/)

    let bestMatch = null
    let bestScore = -1

    for (const product of PRODUCTS) {
        const storage = pickStorage(product)
        if (!storage) continue

        // Build candidate terms: keywords + name + subtitle
        const keywords = (product.Keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
        const terms = [
            ...keywords,
            (product.Name || '').toLowerCase().trim(),
            (product.Name_subtitle || '').toLowerCase().trim(),
        ].filter(Boolean)

        // Primary score: how many query words this product's vocabulary covers.
        // "olive oil" → Oils covers both tokens {olive, oil}; Olives covers only {olive}.
        const termVocab = new Set(terms.flatMap(t => t.split(/\s+/)))
        const coverage = queryTokens.filter(qt => termVocab.has(qt)).length
        if (coverage === 0) continue

        // Secondary score: longest substring match as a tiebreaker
        let bonus = 0
        for (const term of terms) {
            if (n === term)           bonus = Math.max(bonus, term.length * 2)
            else if (n.includes(term)) bonus = Math.max(bonus, term.length)
            else if (term.includes(n)) bonus = Math.max(bonus, n.length * 0.5)
        }

        // Penalty: Name tokens the query didn't ask for — breaks ties in favour of
        // the plain ingredient over prepared/cooked variants.
        // e.g. "pasta" → "Cooked pasta" (-15) loses to "Pasta - dry" (0).
        const nameTokens = (product.Name || '').toLowerCase().split(/[\s,\-()/]+/).filter(Boolean)
        const penalty = nameTokens.filter(t => !queryTokens.includes(t)).length * 15

        const score = coverage * 100 + bonus - penalty
        if (score > bestScore) {
            bestScore = score
            bestMatch = storage
        }
    }

    return bestMatch ?? { durationValue: 2, unitIndex: 1 }  // default: 2 weeks
}
