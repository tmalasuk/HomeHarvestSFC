import ShoppingItem from '../models/ShoppingItem.js';

function ShoppingListCollection(arr) {
    const items = arr || [];

    items.add = function(name, category, qty) {
        const matchItem = this.find(p => p.name === name && p.category === category.name);
        if (matchItem) {
            matchItem.qty += qty;
        } else {
            const item = new ShoppingItem(name, category.name, qty);
            this.push(item);
        }
        return this;
    }

    items.hasIngredient = function(name) {
        const key = name.trim().toLowerCase();
        return this.some(p => p.name.trim().toLowerCase() === key);
    }

    return items;
}

export default ShoppingListCollection;
