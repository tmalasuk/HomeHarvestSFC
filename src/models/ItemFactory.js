import PantryItem from './PantryItem.js'
import ShoppingItem from './ShoppingItem.js'

class ItemFactory {
    // Creates a new PantryItem from a Product with the given quantity, expiration, and optional location
    static makePantryItem(product, qty, expiration, location = null) {
        return new PantryItem(product, qty, expiration, location)
    }

    // Creates a new ShoppingItem from a Product with the given quantity and optional expiration
    static makeShoppingItem(product, qty, expiration = null) {
        return new ShoppingItem(product, qty, expiration)
    }

}

export default ItemFactory
