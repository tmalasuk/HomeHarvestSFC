import Expiration from './Expiration.js'

class PantryItem {
    constructor(product, qty, expiration, location = null) {
        this.id = crypto.randomUUID()
        this.createdAt = Date.now()
        this.product = product
        this.qty = qty
        this.unit = product.defaultUnit ?? 'count'
        this.expiration = expiration instanceof Expiration
            ? expiration
            : Expiration.create(product.defaultDurationValue, product.defaultUnitIndex)
        this.location = location ?? product.defaultLocation
    }

    // Returns the number of whole days remaining before this item expires
    daysUntilExpired() {
        const today = new Date()
        return Math.round((this.expiration.toDate() - today) / (1000 * 60 * 60 * 24))
    }

    // Adds 1 to the item's quantity
    increaseQty() { this.qty += 1 }
    // Subtracts 1 from the item's quantity, floored at 0
    decreaseQty() { this.qty = Math.max(0, this.qty - 1) }

    // Always true — placeholder for future capacity limits
    canIncrease() { return true }
    // Returns true if the item still has quantity to remove
    canDecrease() { return this.qty > 0 }

    // Returns true if the given total quantity is below the product's restock threshold
    isLowQty(totalQty = this.qty) {
        if (this.product.restockThreshold) {
            return totalQty < 0.25 * this.product.defaultQty
        }
        return totalQty < this.product.restockQty * this.product.defaultQty
    }
}

export default PantryItem
