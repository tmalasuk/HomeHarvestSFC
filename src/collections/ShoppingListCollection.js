import ItemFactory from '../models/ItemFactory.js'

function ShoppingListCollection(arr) {
    const items = arr || []

    // Adds a new shopping item or increments qty if the product is already on the list
    items.add = function(product, qty) {
        const match = this.find(item => item.product.id === product.id)
        if (match) {
            match.qty += qty
        } else {
            this.push(ItemFactory.makeShoppingItem(product, qty))
        }
        return this
    }

    // Removes a shopping item by id
    items.remove = function(item) {
        const index = this.findIndex(i => i.id === item.id)
        if (index !== -1) this.splice(index, 1)
        return this
    }

    // Returns true if any item's product name matches the given name (case-insensitive)
    items.hasIngredient = function(name) {
        const key = name.trim().toLowerCase()
        return this.some(item => item.product.name.trim().toLowerCase() === key)
    }

    return items
}

export default ShoppingListCollection
