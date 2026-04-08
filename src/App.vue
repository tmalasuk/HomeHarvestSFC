<script>
import Pantry from './components/Pantry.vue';
import Recipes from './components/Recipes.vue';
import AppThemeToggle from './components/AppThemeToggle.vue';
import Grocery from './components/Grocery.vue';
import { computeExpirationDate } from './utils.js';
import { getIngredientCategory } from './ingredientCategories.js';
import { seedPantryProducts, seedShoppingProducts, seedRecipes } from './seedData.js';
import PantryCollection from './collections/PantryCollection.js';
import ShoppingListCollection from './collections/ShoppingListCollection.js';
import RecipeCollection from './collections/RecipeCollection.js';

export default {
    name: 'App',

    components: { Pantry, Recipes, AppThemeToggle, Grocery },

    data() {
        return {
           // changes tabs
            currentTab: 'pantry',
            navIndicatorStyle: {},

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
            pantry: new PantryCollection(seedPantryProducts),
            shoppingList: new ShoppingListCollection(seedShoppingProducts),
            recipes: new RecipeCollection(seedRecipes),

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
            this.pantry.forEach(p => {
                if (p.category === oldName) {
                    p.category = newName;
                    p.batch.forEach(i => { i.category = newName; });
                }
            });
            this.shoppingList.forEach(p => {
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
            const result = product.moveItemTo(item, this.pantry);
            if (!result) return;

            const { targetProduct, created } = result;
            this.productOfEditItem = targetProduct;

            if (created) {
                const originalProductIndex = this.pantry.findIndex(p => p.id === product.id);
                if (originalProductIndex !== -1) {
                    this.pantry.splice(originalProductIndex + 1, 0, targetProduct);
                } else {
                    this.pantry.push(targetProduct);
                }
            }

            if (product.batch.length === 0) {
                const indexProduct = this.pantry.findIndex(p => p.id === product.id);
                if (indexProduct !== -1) this.pantry.splice(indexProduct, 1);
            } else if (product.batch.length === 1) {
                product.isOpen = false;
            }
        },

        deleteProduct(product) {
            this.pantry.removeProduct(product);
        },

        deleteItem(item, product) {
            this.pantry.removeItem(item, product);
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
            this.pantry.add(name, category, quantity);
        },

        addToShoppingList(name, newCategory, quantity) {
            this.shoppingList.add(name, newCategory, quantity);
        },

        isIngredientInPantry(name) {
            return this.pantry.hasIngredient(name);
        },

        isIngredientOnShoppingList(name) {
            return this.shoppingList.hasIngredient(name);
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
            this.updateNavIndicator();
        },

        updateNavIndicator() {
            const nav = this.$el.querySelector('.nav-tabs');
            const activeBtn = nav?.querySelector('.nav-link.active');
            if (!nav || !activeBtn) return;
            const navRect = nav.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const w = btnRect.width * 0.5;
            const left = (btnRect.left - navRect.left) + (btnRect.width - w) / 2;
            this.navIndicatorStyle = { left: left + 'px', width: w + 'px' };
        },

        updateRestockShoppingList() {
            this.restockShoppingList = this.pantry.getRestockItems();
        },

        addBoughtToPantry() {
            const bought = [...this.shoppingList, ...this.restockShoppingList].filter(p => p.bought);
            bought.forEach(p => {
                const category = { name: p.category };
                const expiration = computeExpirationDate(p.durationValue, this.units[p.selectedUnit]);
                this.pantry.add(p.name, category, p.qty, expiration);
            });
            const boughtIndices = this.shoppingList.reduce((acc, p, i) => { if (p.bought) acc.push(i); return acc; }, []);
            boughtIndices.reverse().forEach(i => this.shoppingList.splice(i, 1));
            this.updateRestockShoppingList();
        },
    },

    watch: {
        currentTab() {
            this.$nextTick(() => this.updateNavIndicator());
        },
    },

    mounted() {
        window.addEventListener('resize', this.handleResize);
        this.updateRestockShoppingList();
        this.$nextTick(() => this.updateNavIndicator());
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <main>
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
                    <span class="nav-indicator" :style="navIndicatorStyle"></span>
                </ul>
            </header>
        </div>

        <div class="tab-content" id="myTabContent">

            <!-- PANTRY -->
            <pantry
                v-show="currentTab === 'pantry'"
                :products="pantry"
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
                :pantry-products="pantry"
                :shopping-list="shoppingList"
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
            font-size: 1.5em;
            border: none;
            position: relative;
            transition: background-color 0.2s ease, color 0.2s ease;
            background-color: var(--outside-tab-deactive);
            color: var(--bg);

            &.middle-tab {
                background-color: var(--inside-tab-deactive);
            }

            &.active {
                background-color: var(--bg2);
                color: var(--text);
            }
        }
    }
}

.nav-indicator {
    position: absolute;
    bottom: 0;
    height: 4px;
    width: 60px;
    border-radius: 10px;
    background: var(--sage);
    transition: left 0.3s ease, width 0.3s ease;
}

@keyframes tabSlideIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.tab-pane.fade.show {
    animation: tabSlideIn 0.25s ease forwards;
}

.wrapper{
    background-color: var(--sage);
    background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.07) 0px, rgba(255, 255, 255, 0.07) 1px, transparent 1px, transparent 8px);
}
</style>
