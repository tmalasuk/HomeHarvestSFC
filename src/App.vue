<script>
import Pantry from './components/Pantry.vue';
import Recipes from './components/Recipes.vue';
import AppThemeToggle from './components/AppThemeToggle.vue';
import Grocery from './components/Grocery.vue';
import { computeExpirationDate } from './utils.js';
import { getIngredientCategory } from './ingredientCategories.js';
import { seedPantryProducts, seedShoppingProducts, seedRecipes } from './seedData.js';

export default {
    name: 'App',

    components: { Pantry, Recipes, AppThemeToggle, Grocery },

    data() {
        return {
           // changes tabs
            currentTab: 'pantry',

            //hard set categories - no more adding or removing categories. TODO: remove unused categories from pantry view
            categories: [
                { id: 1,  name: 'Produce',      products: []},
                { id: 2,  name: 'Dairy',         products: []},
                { id: 3,  name: 'Meat',          products: []},
                { id: 14, name: 'Deli',          products: []},
                { id: 4,  name: 'Grains',        products: []},
                { id: 5,  name: 'Frozen',        products: []},
                { id: 6,  name: 'Canned Goods',  products: []},
                { id: 7,  name: 'Snacks',        products: []},
                { id: 8,  name: 'Condiments',    products: []},
                { id: 9,  name: 'Spices',        products: []},
                { id: 10, name: 'Baking',        products: []},
                { id: 11, name: 'Beverages',     products: []},
                { id: 13, name: 'Breakfast',     products: []},
                { id: 12, name: 'Misc',          products: []},
            ],

            // starter data
            pantry: {
                products: seedPantryProducts,
            },

            shoppingList: {
                products: seedShoppingProducts,
            },

            recipes: seedRecipes,

            //TODO: I only need one of these. 
            isDesktop: window.innerWidth >= 1400,
            isMobile: window.innerWidth < 1400,
            units: ['day(s)', 'week(s)', 'month(s)', 'year(s)'],
            userOverrides: {},
            categoryRenames: {},
            restockShoppingList: [],
            newlyAddedIngredients: [],

            recipeCategories: [
                'Soup', 'Salad', 'Sandwich', 'Pasta', 'Stew', 'Casserole',
                'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink',
                'Vegetarian', 'Vegan', 'Meat', 'Seafood',
                'Quick', 'Slow Cooker', 'One-Pot',
                'Comfort Food', 'Baked', 'Spicy', 'International',
            ],
        };
    },

    methods: {

        // ── User overrides ────────────────────────────────────────
        learnCategoryOverride(itemName, categoryName) {
            const key = itemName.trim().toLowerCase();
            if (!key || !categoryName) return;
            this.userOverrides[key] = categoryName;
        },

        getCategoryForItem(name) {
            const key = name.trim().toLowerCase();
            const cat = this.userOverrides[key] ?? getIngredientCategory(name);
            return this.categoryRenames[cat] ?? cat;
        },

        // ── Category management ───────────────────────────────────
        renameCategory({ id, newName }) {
            const category = this.categories.find(c => c.id === id);
            if (!category) return;
            const oldName = category.name;
            this.pantry.products.forEach(p => {
                if (p.category === oldName) {
                    p.category = newName;
                    p.batch.forEach(i => { i.category = newName; });
                }
            });
            this.shoppingList.products.forEach(p => {
                if (p.category === oldName) p.category = newName;
            });
            for (const key in this.userOverrides) {
                if (this.userOverrides[key] === oldName) this.userOverrides[key] = newName;
            }
            for (const key in this.categoryRenames) {
                if (this.categoryRenames[key] === oldName) this.categoryRenames[key] = newName;
            }
            this.categoryRenames[oldName] = newName;
            category.name = newName;
        },

        stopEditingName(item, product) {
            let oldProduct = product;
            const indexInBatch = product.batch.findIndex(b => b.id === item.id);
            if (indexInBatch !== -1) {
                const [movedItem] = product.batch.splice(indexInBatch, 1);
                let targetProduct = this.pantry.products.find(p =>
                    p.name === movedItem.name && p.category === movedItem.category
                );
                if (targetProduct) {
                    this.productOfEditItem = targetProduct;
                    targetProduct.batch.push(movedItem);
                } else {
                    const newProductId = this.pantry.products.length
                        ? Math.max(...this.pantry.products.map(p => p.id)) + 1
                        : 1;
                    targetProduct = {
                        id: newProductId,
                        name: movedItem.name,
                        category: movedItem.category,
                        restock: false,
                        restockQty: 1,
                        isOpen: false,
                        batch: [movedItem]
                    };
                    const originalProductIndex = this.pantry.products.findIndex(p => p.id === oldProduct.id);
                    if (originalProductIndex !== -1) {
                        this.pantry.products.splice(originalProductIndex + 1, 0, targetProduct);
                        this.productOfEditItem = targetProduct;
                    } else {
                        this.pantry.products.push(targetProduct);
                        this.productOfEditItem = targetProduct;
                    }
                }
                if (oldProduct.batch.length === 0) {
                    const indexProduct = this.pantry.products.findIndex(p => p.id === oldProduct.id);
                    if (indexProduct !== -1) this.pantry.products.splice(indexProduct, 1);
                } else if (oldProduct.batch.length === 1) {
                    oldProduct.isOpen = false;
                }
            }
        },

        deleteProduct(product) {
            const index = this.pantry.products.findIndex(p => p === product);
            if (index !== -1) this.pantry.products.splice(index, 1);
        },

        deleteItem(item, product) {
            const productIndex = this.pantry.products.findIndex(p => p.name === product.name);
            const targetProduct = this.pantry.products[productIndex];
            const itemIndex = targetProduct.batch.findIndex(i => i.name === item.name);
            targetProduct.batch.splice(itemIndex, 1);
            if (targetProduct.batch.length === 0) {
                this.pantry.products.splice(productIndex, 1);
            } else if (targetProduct.batch.length === 1) {
                targetProduct.isOpen = false;
            }
        },

        handlePantryAddItem({ name, categoryOverride }) {
            if (categoryOverride) {
                this.learnCategoryOverride(name, categoryOverride.name);
            }
            this.handleAddItem({ name, quantity: 1, mode: 'pantry', categoryOverride });
        },

        handleAddItem({ name, quantity, mode, categoryOverride }) {
            let category = categoryOverride;
            if (!category) {
                const catName = this.getCategoryForItem(name);
                category = this.categories.find(c => c.name === catName)
                    ?? this.categories.find(c => c.name === 'Misc')
                    ?? this.categories[0];
            }
            if (mode === 'pantry') {
                this.addToPantry(name, category, quantity);
            } else {
                this.addToShoppingList(name, category, quantity);
            }
        },

        addToPantry(name, category, quantity) {
            let matchProduct = this.pantry.products.find(p => p.name === name && p.category === category.name);
            const newItems = [];
            const now = new Date();
            for (let i = 0; i < quantity; i++) {
                newItems.push({
                    id: crypto.randomUUID(),
                    name,
                    category: category.name,
                    dateAdded: now,
                    expiration: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000) * 2),
                    qty: 100,
                });
            }
            if (matchProduct) {
                matchProduct.batch.unshift(...newItems);
            } else {
                this.pantry.products.unshift({
                    id: crypto.randomUUID(),
                    name,
                    category: category.name,
                    restock: false,
                    restockQty: 1,
                    isOpen: false,
                    batch: newItems,
                });
            }
        },

        addToShoppingList(name, newCategory, quantity) {
            const combined = [...this.shoppingList.products, ...this.restockShoppingList];
            const matchItem = combined.find(p => p.name === name && p.category === newCategory.name);
            if (matchItem) {
                matchItem.qty += quantity;
            } else {
                this.shoppingList.products = [...this.shoppingList.products, {
                    id: crypto.randomUUID(),
                    name,
                    qty: quantity,
                    category: newCategory.name,
                    expiration: null,
                    action: false,
                    bought: false,
                    durationValue: 2,
                    selectedUnit: 1,
                }];
            }
        },

        isIngredientInPantry(name) {
            const key = name.trim().toLowerCase();
            return this.pantry.products.some(p => p.name.trim().toLowerCase() === key);
        },

        isIngredientOnShoppingList(name) {
            const key = name.trim().toLowerCase();
            return this.shoppingList.products.some(p => p.name.trim().toLowerCase() === key);
        },

        addRecipeToGroceryList(recipe) {
            const newItems = [];
            recipe.ingredients.forEach(ingredient => {
                if (this.isIngredientInPantry(ingredient.name)) return;
                const wasOnList = this.isIngredientOnShoppingList(ingredient.name);
                const catName = this.getCategoryForItem(ingredient.name);
                const category = this.categories.find(c => c.name === catName)
                    ?? this.categories.find(c => c.name === 'Misc')
                    ?? this.categories[0];
                this.addToShoppingList(ingredient.name, category, 1);
                if (!wasOnList) newItems.push(ingredient.name);
            });
            this.newlyAddedIngredients = newItems;
            setTimeout(() => { this.newlyAddedIngredients = []; }, newItems.length * 150 + 600);
        },

        handleResize() {
            this.isDesktop = window.innerWidth >= 1400;
            this.isMobile = window.innerWidth < 1400;
        },

        updateRestockShoppingList() {
            this.restockShoppingList = this.pantry.products
                .filter(p => p.restock === true)
                .map(item => ({
                    id: crypto.randomUUID(),
                    name: item.name,
                    category: item.category,
                    qty: item.restockQty || 1,
                    notes: '',
                    originalPantryItem: item,
                    action: false,
                    bought: false,
                    durationValue: 2,
                    selectedUnit: 1,
                }));
        },

        addBoughtToPantry() {
            const bought = [...this.shoppingList.products, ...this.restockShoppingList].filter(p => p.bought);
            const now = new Date();
            bought.forEach(p => {
                let matchProduct = this.pantry.products.find(
                    product => product.name === p.name && product.category === p.category
                );
                const newItems = [];
                for (let i = 0; i < p.qty; i++) {
                    newItems.push({
                        id: crypto.randomUUID(),
                        name: p.name,
                        category: p.category,
                        dateAdded: now,
                        expiration: computeExpirationDate(p.durationValue, this.units[p.selectedUnit]),
                        qty: 100,
                    });
                }
                if (matchProduct) {
                    matchProduct.batch.unshift(...newItems);
                } else {
                    this.pantry.products.unshift({
                        id: crypto.randomUUID(),
                        name: p.name,
                        category: p.category,
                        restock: false,
                        restockQty: 1,
                        isOpen: false,
                        batch: newItems,
                    });
                }
            });
            this.shoppingList.products = this.shoppingList.products.filter(p => !p.bought);
            this.updateRestockShoppingList();
        },
    },

    mounted() {
        window.addEventListener('resize', this.handleResize);
        this.updateRestockShoppingList();
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <main id="app">
        <div class="wrapper">
            <header class="d-flex main-header">
                <div class="logo">
                    <img src="/img/HH_icon.png" alt="HomeHarvest icon" class="logo-icon">
                    <h1><span class="logo-home">Home</span><span class="logo-harvest">Harvest</span></h1>
                </div>
                <app-theme-toggle />
                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="header-nav">
                        <button class="nav-link" :class="{ active: currentTab === 'pantry' }"
                            @click="currentTab = 'pantry'" type="button">
                            <span>Pantry</span><i class="bi bi-box-seam"></i>
                        </button>
                    </li>
                    <li class="nav-item middle-tab" role="header-nav">
                        <button class="nav-link middle-tab" :class="{ active: currentTab === 'grocery' }"
                            @click="currentTab = 'grocery'" type="button">
                            <span>Grocery List</span><i class="bi bi-basket"></i>
                        </button>
                    </li>
                    <li class="nav-item" role="header-nav">
                        <button class="nav-link" :class="{ active: currentTab === 'recipes' }"
                            @click="currentTab = 'recipes'" type="button">
                            <span>Recipes</span><i class="bi bi-journal-text"></i>
                        </button>
                    </li>
                    <span class="nav-indicator"></span>
                </ul>
            </header>
        </div>

        <div class="tab-content" id="myTabContent">

            <!-- PANTRY -->
            <pantry
                v-show="currentTab === 'pantry'"
                :products="pantry.products"
                :categories="categories"
                :units="units"
                :is-mobile="isMobile"
                @add-item="handlePantryAddItem"
                @stop-editing-name="stopEditingName($event.item, $event.product)"
                @delete-product="deleteProduct($event)"
                @delete-item="deleteItem($event.item, $event.product)"
                @restock-change="updateRestockShoppingList" />

            <!-- GROCERY LIST -->
            <section v-show="currentTab === 'grocery'" class="tab-pane show fade active" id="grocery"
                role="tabpanel" aria-labelledby="grocery-tab">
                <div class="section-content">
                    <grocery
                        :shopping-list="shoppingList"
                        :restock-shopping-list="restockShoppingList"
                        :categories="categories"
                        :units="units"
                        :is-desktop="isDesktop"
                        :is-mobile="isMobile"
                        @add-to-pantry="addBoughtToPantry"
                        @add-item="handleAddItem($event)"
                        @rename-category="renameCategory($event)"
                        @reorder-categories="categories = $event"
                        @learn-override="learnCategoryOverride($event.name, $event.category)" />
                </div>
            </section>

            <!-- RECIPES -->
            <recipes
                v-show="currentTab === 'recipes'"
                :recipes="recipes"
                :recipe-categories="recipeCategories"
                :pantry-products="pantry.products"
                :shopping-list="shoppingList.products"
                :restock-shopping-list="restockShoppingList"
                :newly-added-ingredients="newlyAddedIngredients"
                @add-recipe-to-grocery="addRecipeToGroceryList($event)" />

        </div>
    </main>
</template>

<style lang="scss" scoped>
.nav-tabs {
    border-bottom: none;
    position: relative;
    display: flex;
    margin-left: auto;
    font-family: 'Inter';
    font-size: small;
    margin-top: auto;
    margin-right: 10vw;

    .nav-item {
        i {
            display: none;
        }

        .nav-link {
            border: none;
            position: relative;
            transition: background-color 0.2s ease, color 0.2s ease;
        }
    }
}

.nav-indicator {
    position: absolute;
    bottom: 0;
    height: 4px;
    width: 60px;
    border-radius: 10px;
    transition: all 0.3s ease;
}
</style>
