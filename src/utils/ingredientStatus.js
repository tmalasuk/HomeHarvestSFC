import { convertUnit, normalizeIngredientName, INGREDIENT_SUBSTITUTES } from './unitConvert.js'

/**
 * Given a recipe ingredient { name, qty, unit } and a PantryCollection (or any array
 * of PantryItem-shaped objects with .product.name, .qty, .unit), returns one of:
 *   'ok'           — pantry has enough
 *   'insufficient' — pantry has it but not enough quantity
 *   'incompatible' — pantry has it but units can't be compared (have it, qty unknown)
 *   'missing'      — not in pantry at all
 */
export function getIngredientStatus(ingredient, pantryItems) {
    const ingName     = (ingredient.name || '').trim().toLowerCase()
    const ingNameNorm = INGREDIENT_SUBSTITUTES[ingName]
        ?? INGREDIENT_SUBSTITUTES[normalizeIngredientName(ingName)]
        ?? normalizeIngredientName(ingName)
    const ingQty      = parseFloat(ingredient.qty) || 0
    const ingUnit     = (ingredient.unit || '').trim()

    // Exact name match first; fall back to normalized name
    let matches = pantryItems.filter(p =>
        p.product.name.trim().toLowerCase() === ingName
    )
    if (!matches.length && ingNameNorm !== ingName) {
        matches = pantryItems.filter(p => {
            const pName = p.product.name.trim().toLowerCase()
            return pName === ingNameNorm
                || normalizeIngredientName(pName) === ingNameNorm
        })
    }

    if (!matches.length) return 'missing'

    const pantryUnit     = (matches[0].unit || 'count')
    const totalPantryQty = matches.reduce((s, p) => s + p.qty, 0)
    const fromUnit       = ingUnit || pantryUnit
    const converted      = convertUnit(ingQty, fromUnit, pantryUnit, ingNameNorm)

    if (converted === null) return 'incompatible'

    return totalPantryQty < converted - 0.001 ? 'insufficient' : 'ok'
}
