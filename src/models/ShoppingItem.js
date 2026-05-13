import Expiration from './Expiration.js'

class ShoppingItem {
    constructor(product, qty, expiration = null) {
        this.id = crypto.randomUUID()
        this.product = product
        this.qty = qty
        this.qtyHint = null  // faint deficit label shown in grocery list, e.g. "3 count"
        this.expiration = expiration ?? Expiration.create(
            product.defaultDurationValue,
            product.defaultUnitIndex
        )
        this.bought = false
    }
}

export default ShoppingItem
