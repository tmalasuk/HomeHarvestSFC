import BaseItem from './BaseItem.js';

function ShoppingItem(name, category, qty) {
    BaseItem.call(this, name, category);
    this.qty = qty;
    this.expiration = null;
    this.bought = false;
    this.durationValue = 2;
    this.selectedUnit = 1;
}

ShoppingItem.prototype = Object.create(BaseItem.prototype);
ShoppingItem.prototype.constructor = ShoppingItem;

export default ShoppingItem;
