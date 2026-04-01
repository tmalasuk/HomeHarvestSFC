<script>
import GroceryShopSection from './GroceryShopSection.vue';
import { computeExpirationDate } from '../utils.js';
export default{
  name: 'Grocery',
    components: { GroceryShopSection },
    emits: ['add-to-pantry', 'add-item', 'add-category', 'edit-category', 'reorder-categories', 'learn-override', 'rename-category'],

    props: {
        shoppingList: { type: Object, required: true },
        restockShoppingList: { type: Array, required: true },
        categories: { type: Array, required: true },
        units: { type: Array, required: true },
        //to do: we only need one of these
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
    },

    data() {
        return {
            selectedCategoryGrocery: { name: '' },
            checkAll: false,
            deletedItemToast: null,
            toastTimer: null,
        };
    },

    computed: {
        sortedByCat() {
            let sortedArray = this.categories.map(c => ({ ...c, products: [] }));
            this.shoppingList.products.forEach(p => {
                let category = sortedArray.find(c => c.name === p.category);
                if (category) category.products.push(p);
            });
            this.restockShoppingList.forEach(p => {
                let category = sortedArray.find(c => c.name === p.category);
                if (category) category.products.push(p);
            });
            return sortedArray;
        },

        filteredShoppingList() {
            const combined = [...this.shoppingList.products, ...this.restockShoppingList];
            if (!this.selectedCategoryGrocery.name) return combined;
            return combined.filter(p => p.category === this.selectedCategoryGrocery.name);
        },

        boughtItems() {
            return this.sortedByCat
                .map(c => ({ ...c, products: c.products.filter(i => i.bought) }))
                .filter(c => c.products.length > 0);
        },
    },

    methods: {
        selectCategoryGrocery(category) {
            if (this.selectedCategoryGrocery && this.selectedCategoryGrocery.id === category.id) {
                this.selectedCategoryGrocery = { name: '' };
            } else {
                this.selectedCategoryGrocery = category;
            }
        },

        checkAllMethod() {
            this.checkAll = !this.checkAll;
            if (this.checkAll) {
                this.sortedByCat.forEach(c => { c.products.forEach(i => { i.bought = true; }); });
            } else {
                this.sortedByCat.forEach(c => { c.products.forEach(i => { i.bought = false; }); });
            }
        },

        lowerQty(product) {
            if (product.qty > 1) {
                product.qty--;
            } else {
                const index = this.shoppingList.products.findIndex(p => p.id === product.id);
                if (index === -1) return;
                const [removed] = this.shoppingList.products.splice(index, 1);
                if (this.toastTimer) clearTimeout(this.toastTimer);
                this.deletedItemToast = { item: removed, index };
                this.toastTimer = setTimeout(() => { this.deletedItemToast = null; }, 5000);
            }
        },

        increaseQty(product) {
            product.qty++;
        },

        moveGroceryItem({ productId, newCatId, dropIndex }) {
            const newCat = this.categories.find(c => c.id === newCatId);
            if (!newCat) return;

            let product = this.shoppingList.products.find(p => p.id === productId);
            const inRestock = !product;
            if (inRestock) product = this.restockShoppingList.find(p => p.id === productId);
            if (!product) return;

            this.$emit('learn-override', { name: product.name, category: newCat.name });
            product.category = newCat.name;

            const list = inRestock ? this.restockShoppingList : this.shoppingList.products;
            list.splice(list.indexOf(product), 1);

            const catItems = list.filter(p => p.category === newCat.name);
            let insertAt;
            if (catItems.length === 0 || dropIndex >= catItems.length) {
                const last = catItems[catItems.length - 1];
                insertAt = last ? list.indexOf(last) + 1 : list.length;
            } else {
                insertAt = list.indexOf(catItems[dropIndex]);
            }
            list.splice(insertAt, 0, product);
        },

        updateExpiration(product) {
            const unit = this.units[product.selectedUnit];
            product.expiration = computeExpirationDate(product.durationValue, unit);
        },

        undoDelete() {
            if (!this.deletedItemToast) return;
            clearTimeout(this.toastTimer);
            this.shoppingList.products.splice(this.deletedItemToast.index, 0, this.deletedItemToast.item);
            this.deletedItemToast = null;
        },

        dismissToast() {
            clearTimeout(this.toastTimer);
            this.deletedItemToast = null;
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <grocery-shop-section
        :sorted-by-cat="sortedByCat"
        :categories="categories"
        :filtered-shopping-list="filteredShoppingList"
        :selected-category-grocery="selectedCategoryGrocery"
        :is-desktop="isDesktop"
        :is-mobile="isMobile"
        :has-bought="boughtItems.length > 0"
        :units="units"
        @check-all="checkAllMethod"
        @select-category="selectCategoryGrocery($event)"
        @rename-category="$emit('rename-category', $event)"
        @reorder-categories="$emit('reorder-categories', $event)"
        @qty-increase="increaseQty($event)"
        @qty-decrease="lowerQty($event)"
        @update-expiration="updateExpiration($event)"
        @add-to-pantry="$emit('add-to-pantry')"
        @update:selected-category-grocery="selectedCategoryGrocery = $event"
        @move-item="moveGroceryItem($event)"
        @add-item="$emit('add-item', $event)">
    </grocery-shop-section>

    <transition name="toast-slide">
        <div class="delete-toast" v-if="deletedItemToast">
            <span class="toast-msg"><i class="bi bi-trash3"></i> <strong>{{ deletedItemToast.item.name }}</strong> removed</span>
            <button class="toast-undo" @click="undoDelete">Undo</button>
            <button class="toast-close" @click="dismissToast"><i class="bi bi-x"></i></button>
        </div>
    </transition>
</template>

<style lang="scss" scoped>
.delete-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    background: #2c2c2c;
    color: #fff;
    padding: 12px 16px;
    border-radius: 10px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    z-index: 9999;
    white-space: nowrap;
    font-size: 0.9rem;

    .toast-msg {
        display: flex;
        align-items: center;
        gap: 7px;

        i {
            color: #e05252;
        }
    }

    .toast-undo {
        background: #e05252;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 4px 12px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
            background: #c0392b;
        }
    }

    .toast-close {
        background: transparent;
        border: none;
        color: #aaa;
        font-size: 1rem;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;

        &:hover {
            color: #fff;
        }
    }
}
</style>