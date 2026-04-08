import PantryProduct from '../models/PantryProduct.js';
import PantryItem from '../models/PantryItem.js';
import RestockDecorator from '../models/RestockDecorator.js';

function PantryCollection(arr) {
    const items = arr || [];

    items.add = function(name, category, qty, expiration) {
        let matchProduct = this.find(p => p.name === name && p.category === category.name);
        const defaultExpiration = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000) * 2);
        const newItems = [];
        for (let i = 0; i < qty; i++) {
            const item = new PantryItem(name, category.name, 100, expiration ?? defaultExpiration);
            newItems.push(item);
        }
        if (matchProduct) {
            matchProduct.batch.unshift(...newItems);
        } else {
            const product = new PantryProduct(name, category.name);
            product.batch = newItems;
            this.unshift(product);
        }
        return this;
    }

    items.removeProduct = function(product) {
        const index = this.indexOf(product);
        if (index !== -1) this.splice(index, 1);
        return this;
    }

    items.removeItem = function(item, product) {
        const productIndex = this.findIndex(p => p.name === product.name);
        const targetProduct = this[productIndex];
        const itemIndex = targetProduct.batch.findIndex(i => i.name === item.name);
        targetProduct.batch.splice(itemIndex, 1);
        if (targetProduct.batch.length === 0) {
            this.splice(productIndex, 1);
        } else if (targetProduct.batch.length === 1) {
            targetProduct.isOpen = false;
        }
        return this;
    }

    items.hasIngredient = function(name) {
        const key = name.trim().toLowerCase();
        return this.some(p => p.name.trim().toLowerCase() === key);
    }

    items.getRestockItems = function() {
        return this
            .filter(p => p.restock === true)
            .map(p => new RestockDecorator(p));
    }

    return items;
}

export default PantryCollection;
