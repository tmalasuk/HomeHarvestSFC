import ItemFactory from '../models/ItemFactory.js'

function PantryCollection(arr) {
    const items = arr || []

    // Prepends a new PantryItem built from the given product to the front of the collection
    items.add = function(product, qty, expiration, location) {
        this.unshift(ItemFactory.makePantryItem(product, qty, expiration, location))
        return this
    }

    // Removes a single item by id
    items.removeItem = function(item) {
        const index = this.findIndex(i => i.id === item.id)
        if (index !== -1) this.splice(index, 1)
        return this
    }

    // Removes all pantry items belonging to the given product
    items.removeProduct = function(product) {
        this.getBatch(product).forEach(item => this.removeItem(item))
        return this
    }

    // Returns one unique Product per product id in this collection
    items.getProducts = function() {
        const seen = new Set()
        return this.filter(item => {
            if (seen.has(item.product.id)) return false
            seen.add(item.product.id)
            return true
        }).map(item => item.product)
    }

    // Returns all items in this collection that belong to the given product
    items.getBatch = function(product) {
        return this.filter(item => item.product.id === product.id)
    }

    // Returns true if any item's product name matches the given name (case-insensitive)
    items.hasIngredient = function(name) {
        const key = name.trim().toLowerCase()
        return this.some(item => item.product.name.trim().toLowerCase() === key)
    }

    return items
}

export default PantryCollection
