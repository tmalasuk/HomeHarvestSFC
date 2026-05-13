<script>
import GroceryShopSection from './GroceryShopSection.vue';
import Expiration from '../models/Expiration.js';
export default{
  name: 'Grocery',
    components: { GroceryShopSection },
    emits: ['add-to-pantry', 'add-item', 'reorder-categories', 'rename-category', 'remove-restock-item'],

    props: {
        shoppingList: { type: Array, required: true },
        restockShoppingList: { type: Array, required: true },
        categories: { type: Array, required: true },
        units: { type: Array, required: true },
        //to do: we only need one of these
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
    },

    data() {
        return {
            checkAll: false,
            deletedItemToast: null,
            toastTimer: null,
        };
    },

    computed: {
        sortedByCat() {
            //says ... is for creating a shallow copy...?
            // makes a new array where each category gets a fresh product array
            let sortedArray = this.categories.map(c => (
                { ...c, products: [] }
            ));
            //populate
            this.shoppingList.forEach(p => {
                let category = sortedArray.find(c => c.name === p.product.category);
                if (category) category.products.push(p);
            });
            this.restockShoppingList.forEach(p => {
                let category = sortedArray.find(c => c.name === p.product.category);
                if (category) category.products.push(p);
            });
            // gives back array with items grouped by categories
            return sortedArray;
        },

        boughtItems() {
            return this.sortedByCat
                .map(c => ({ ...c, products: c.products.filter(i => i.bought) }))
                .filter(c => c.products.length > 0);
        },
    },

    methods: {
        // Toggles all shopping items between bought and not bought
        checkAllMethod() {
            this.checkAll = !this.checkAll;
            if (this.checkAll) {
                this.sortedByCat.forEach(c => { c.products.forEach(i => { i.bought = true; }); });
            } else {
                this.sortedByCat.forEach(c => { c.products.forEach(i => { i.bought = false; }); });
            }
        },

        // Decrements qty, or removes the item and shows an undo toast if qty would reach zero
        lowerQty(product) {
            if (product.qty > 1) {
                product.qty--;
            } else {
                const index = this.shoppingList.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    const [removed] = this.shoppingList.splice(index, 1);
                    if (this.toastTimer) clearTimeout(this.toastTimer);
                    this.deletedItemToast = { item: removed, index };
                    this.toastTimer = setTimeout(() => { this.deletedItemToast = null; }, 5000);
                } else {
                    // Restock item — clearing it means turning off ghost.restock
                    this.$emit('remove-restock-item', product);
                }
            }
        },

        // Increments the item's qty by one
        increaseQty(product) {
            product.qty++;
        },

        // Recomputes the item's expiration date from its current duration and unit
        updateExpiration(item) {
            item.expiration = Expiration.create(item.expiration.durationValue, item.expiration.unitIndex);
        },

        // Restores the most recently deleted item from the undo toast
        undoDelete() {
            if (!this.deletedItemToast) return;
            clearTimeout(this.toastTimer);
            this.shoppingList.splice(this.deletedItemToast.index, 0, this.deletedItemToast.item);
            this.deletedItemToast = null;
        },

        // Dismisses the undo toast without restoring the deleted item
        dismissToast() {
            clearTimeout(this.toastTimer);
            this.deletedItemToast = null;
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div>
        <grocery-shop-section
            :sorted-by-cat="sortedByCat"
            :categories="categories"
            :is-desktop="isDesktop"
            :is-mobile="isMobile"
            :has-bought="boughtItems.length > 0"
            :units="units"
            @check-all="checkAllMethod"
            @rename-category="$emit('rename-category', $event)"
            @reorder-categories="$emit('reorder-categories', $event)"
            @qty-increase="increaseQty($event)"
            @qty-decrease="lowerQty($event)"
            @update-expiration="updateExpiration($event)"
            @add-to-pantry="$emit('add-to-pantry')"
            @add-item="$emit('add-item', $event)">
        </grocery-shop-section>

        <teleport to="body">
            <transition name="toast-slide">
                <div class="delete-toast" v-if="deletedItemToast">
                    <span class="toast-msg"><i class="bi bi-trash3"></i> <strong>{{ deletedItemToast.item.product.name }}</strong> removed</span>
                    <button class="toast-undo" @click="undoDelete">Undo</button>
                    <button class="toast-close" @click="dismissToast"><i class="bi bi-x"></i></button>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<style lang="scss">
.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
}
</style>

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