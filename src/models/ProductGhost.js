class ProductGhost {
    constructor(id, product) {
        this.id = id
        this.product = product
        this.restock = false
        this.restockQty = 1
    }

    // Creates a ghost from a product, copying its current restock state
    static create(product) {
        const ghost = new ProductGhost(crypto.randomUUID(), product)
        ghost.restock = product.restock ?? false
        ghost.restockQty = product.restockQty ?? 1
        return ghost
    }

    // Refreshes the ghost's restock state from the live product
    syncFromProduct() {
        this.restock = this.product.restock
        this.restockQty = this.product.restockQty
    }

    // Clears the restock flag on both the ghost and its product
    clearRestock() {
        this.restock = false
        this.product.restock = false
    }
}

export default ProductGhost
