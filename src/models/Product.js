import { getShelfLife } from '../data/foodkeeper.js'
import { getIngredientDefault, isThresholdRestock } from '../data/ingredientDefaults.js'

class Product {
    constructor(id, name, category) {
        this.id = id
        this.name = name
        this.category = category
        this.restock = false
        this.restockQty = 1
        this.defaultDurationValue = 2
        this.defaultUnitIndex = 1
        this.defaultLocation = null
        this.foodId = null
        this.defaultUnit = 'count'
        this.defaultQty = 1
        this.restockThreshold = true
        this.addedAt = 0
    }

    // Creates a new Product with a UUID and auto-fills shelf life and default qty/unit from lookup tables
    static create(name, category) {
        const product = new Product(crypto.randomUUID(), name, category)
        const { durationValue, unitIndex } = getShelfLife(name)
        product.defaultDurationValue = durationValue
        product.defaultUnitIndex = unitIndex
        const { qty, unit } = getIngredientDefault(name, category)
        product.defaultQty = qty
        product.defaultUnit = unit
        product.restockThreshold = isThresholdRestock(unit, qty)
        return product
    }

    // Flips the restock flag on/off
    toggleRestock() {
        this.restock = !this.restock
    }

    // Returns true if the product name equals the query (case-insensitive)
    matchesName(query) {
        return this.name.toLowerCase() === query.toLowerCase()
    }
}

export default Product
