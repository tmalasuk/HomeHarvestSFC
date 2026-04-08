import ShoppingItem from './ShoppingItem.js';

function RestockDecorator(pantryProduct) {
    ShoppingItem.call(this, pantryProduct.name, pantryProduct.category, pantryProduct.restockQty || 1);
    this.originalPantryItem = pantryProduct;
}

export default RestockDecorator;
