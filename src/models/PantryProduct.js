import { daysToPercent } from '../utils.js';

function PantryProduct(name, category) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.category = category;
    this.batch = [];
    this.restock = false;
    this.restockQty = 1;
    this.isOpen = false;

    this.addToBatch = function(pantryItem) {
        this.batch.unshift(pantryItem);
    }

    this.removeFromBatch = function(id) {
        const index = this.batch.findIndex(item => item.id === id);
        if (index !== -1) this.batch.splice(index, 1);
    }

    this.isLowQuantity = function() {
        if (!this.batch.length) return false;
        return this.batch.every(item => item.qty <= 35);
    }

    this.getMaxBatchQtyPercent = function() {
        if (!this.batch.length) return 0;
        return Math.max(...this.batch.map(b => b.qty || 0));
    }

    this.batchPercent = function() {
        if (!this.batch.length) return 0;
        return Math.max(...this.batch.map(i => daysToPercent(i.expiration)));
    }

    this.statusClass = function() {
        const p = this.batchPercent();
        if (p === 0) return 'status-green';
        if (p <= 30) return 'status-yellow';
        if (p <= 60) return 'status-red';
        return 'status-expired';
    }

    this.moveItemTo = function(item, products) {
        const indexInBatch = this.batch.findIndex(b => b.id === item.id);
        if (indexInBatch === -1) return null;

        this.batch.splice(indexInBatch, 1);

        let targetProduct = products.find(p =>
            p.name === item.name && p.category === item.category
        );

        const created = !targetProduct;
        if (created) {
            targetProduct = new PantryProduct(item.name, item.category);
        }
        targetProduct.batch.push(item);

        return { targetProduct, created };
    }
}

export default PantryProduct;
