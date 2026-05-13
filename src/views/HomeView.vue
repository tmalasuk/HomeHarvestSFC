<script>
import Pantry from '../components/Pantry.vue';
import Recipes from '../components/Recipes.vue';
import Grocery from '../components/Grocery.vue';
import SettingsView from './SettingsView.vue';
import { getIngredientCategory } from '../data/ingredientCategories.js';
import Product from '../models/Product.js';
import Expiration from '../models/Expiration.js';
import ItemFactory from '../models/ItemFactory.js';
import ProductGhost from '../models/ProductGhost.js';
import PantryCollection from '../collections/PantryCollection.js';
import ShoppingListCollection from '../collections/ShoppingListCollection.js';
import RecipeCollection from '../collections/RecipeCollection.js';
import AuthService from '../services/AuthService.js';
import PantryService from '../services/PantryService.js';
import GhostService from '../services/GhostService.js';
import ShoppingService from '../services/ShoppingService.js';
import RecipeService from '../services/RecipeService.js';
import HouseholdService from '../services/HouseholdService.js';
import { roundQty, INGREDIENT_SUBSTITUTES } from '../utils/unitConvert.js'
import { getIngredientStatus } from '../utils/ingredientStatus.js'
import { isThresholdRestock } from '../data/ingredientDefaults.js';

export default {
    name: 'HomeView',

    components: { Pantry, Recipes, Grocery, SettingsView },

    data() {
        return {
            navIndicatorStyle: {},

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

            pantry: new PantryCollection([]),
            shoppingList: new ShoppingListCollection([]),
            recipes: new RecipeCollection([]),
            ghosts: [],

            householdId: null,
            dataLoaded: false,
            householdPrefs: {
                autoGenShoppingList: false,
                lowStockThreshold: 30,
            },
            householdLocations: [],

            isDesktop: window.innerWidth >= 1400,
            isMobile: window.innerWidth < 1400,
            units: ['day(s)', 'week(s)', 'month(s)', 'year(s)'],
            userOverrides: {},
            categoryRenames: {},
            restockShoppingList: [],
            newlyAddedIngredients: [],

            currentUser: null,
            showUserMenu: false,
            showSettings: false,
            dietaryRestrictions: [],

        };
    },

    computed: {
        currentTab() {
            const tab = this.$route.query.tab;
            return ['pantry', 'grocery', 'recipes'].includes(tab) ? tab : 'pantry';
        },
        userName() {
            return this.currentUser?.displayName || this.currentUser?.email?.split('@')[0] || ''
        },
        greenTab() {
            const tabs = ['pantry', 'grocery', 'recipes'];
            const idx = tabs.indexOf(this.currentTab);
            return idx < tabs.length - 1 ? tabs[idx + 1] : tabs[idx - 1];
        },
    },

    methods: {

        // ── Auth ──────────────────────────────────────────────────

        // Signs out the current user and redirects to /login
        async handleSignOut() {
            await AuthService.logout();
            this.$router.push('/login');
        },

        // ── Firestore data loading ────────────────────────────────

        // Loads all Firestore data for the user's household and initializes change-detection snapshots
        async loadHouseholdData(uid) {
            this._persistEnabled = false;
            if (!this.$route.query.tab) {
                const savedTab = localStorage.getItem(`hh_${uid}_tab`);
                if (savedTab) this.$router.replace({ query: { tab: savedTab } });
            }
            const userDoc = await AuthService.getUserDoc(uid);
            this.householdId = userDoc?.householdId ?? null;
            this.dietaryRestrictions = userDoc?.preferences?.dietaryRestrictions ?? [];
            if (userDoc?.preferences?.theme) {
                document.documentElement.setAttribute('data-theme', userDoc.preferences.theme);
            }
            if (!this.householdId) return;

            const pantry = await PantryService.loadAll(this.householdId);
            const productsMap = new Map(pantry.getProducts().map(p => [p.id, p]));
            const [shoppingList, recipes, household, ghosts] = await Promise.all([
                ShoppingService.loadAll(this.householdId),
                RecipeService.loadAll(this.householdId),
                HouseholdService.get(this.householdId),
                GhostService.loadAll(this.householdId, productsMap),
            ]);
            if (household?.preferences) {
                this.householdPrefs = { ...this.householdPrefs, ...household.preferences };
            }
            this.householdLocations = household?.locations ?? []

            this.pantry = pantry;
            this.shoppingList = shoppingList;
            this.recipes = recipes;
            this.ghosts = ghosts;

            // Backfill ghosts for pantry products that existed before this system was introduced
            pantry.getProducts().forEach(product => {
                if (!ghosts.find(g => g.product.id === product.id)) {
                    const ghost = ProductGhost.create(product);
                    ghosts.push(ghost);
                    GhostService.save(this.householdId, ghost).catch(console.error);
                }
            });

            // Sync ghost preferences onto ghost-only products (not in pantry, reconstructed from Firestore)
            const pantryProductIds = new Set(pantry.getProducts().map(p => p.id));
            ghosts.forEach(ghost => {
                if (!pantryProductIds.has(ghost.product.id)) {
                    ghost.product.restock = ghost.restock;
                    ghost.product.restockQty = ghost.restockQty;
                }
            });

            // Backfill addedAt for products loaded without it (old data before this field existed)
            pantry.getProducts().forEach(product => {
                if (!product.addedAt) {
                    product.addedAt = Math.max(...pantry.getBatch(product).map(i => i.createdAt ?? 0), 0)
                }
            });

            // Initialize change-detection snapshots so the deep watcher
            // doesn't fire Firestore writes immediately after load.
            this._initSnapshots();
            this._persistEnabled = true;
            this.dataLoaded = true;
            this.updateRestockShoppingList();
        },

        // ── Change-detection snapshots ────────────────────────────

        // Initializes snapshot maps used to detect which items have changed since last save
        _initSnapshots() {
            this._pantrySnapshot = new Map(
                this.pantry.map(item => [item.id, this._pantryItemKey(item)])
            );
            this._productSnapshot = new Map(
                this.pantry.getProducts().map(p => [p.id, this._productKey(p)])
            );
            this._shoppingSnapshot = new Map(
                this.shoppingList.map(item => [item.id, this._shoppingItemKey(item)])
            );
            this._ghostSnapshot = new Map(
                this.ghosts.map(g => [g.id, this._ghostKey(g)])
            );
            this._savedRecipeIds = new Set(this.recipes.map(r => r.id));
        },

        // Returns a JSON fingerprint of the pantry item fields that trigger a Firestore write when changed
        _pantryItemKey(item) {
            return JSON.stringify({
                qty: item.qty,
                dv: item.expiration.durationValue,
                ui: item.expiration.unitIndex,
                fd: item.expiration._fixedDate?.toISOString() ?? null,
                loc: item.location,
            });
        },

        // Returns a JSON fingerprint of the product fields that trigger a Firestore write when changed
        _productKey(product) {
            return JSON.stringify({
                name: product.name,
                category: product.category,
                restock: product.restock,
                rqty: product.restockQty,
                loc: product.defaultLocation,
                dunit: product.defaultUnit,
                dqty: product.defaultQty,
                ddur: product.defaultDurationValue,
                dui: product.defaultUnitIndex,
                addedAt: product.addedAt ?? 0,
            });
        },

        // Returns a JSON fingerprint of the shopping item fields that trigger a Firestore write when changed
        _shoppingItemKey(item) {
            return JSON.stringify({
                qty: item.qty,
                dv: item.expiration.durationValue,
                ui: item.expiration.unitIndex,
                bought: item.bought,
            });
        },

        // Returns a JSON fingerprint of the ghost fields that trigger a Firestore write when changed
        _ghostKey(ghost) {
            return JSON.stringify({
                restock: ghost.restock,
                rqty: ghost.restockQty,
            });
        },

        // ── Ghost sync ────────────────────────────────────────────

        // Syncs restock state from each live pantry product onto its corresponding ghost
        _syncGhostsFromProducts() {
            this.pantry.getProducts().forEach(product => {
                const ghost = this.ghosts.find(g => g.product.id === product.id);
                if (ghost) ghost.syncFromProduct();
            });
        },

        // ── Debounced persist helpers ─────────────────────────────

        // Debounces a pantry save by 800ms
        _schedulePantrySave() {
            clearTimeout(this._pantrySaveTimer);
            this._pantrySaveTimer = setTimeout(() => this._savePantryUpdates(), 800);
        },

        // Debounces a shopping list save by 800ms
        _scheduleShoppingSave() {
            clearTimeout(this._shoppingSaveTimer);
            this._shoppingSaveTimer = setTimeout(() => this._saveShoppingUpdates(), 800);
        },

        // Debounces a recipe save by 800ms
        _scheduleRecipeSave() {
            clearTimeout(this._recipeSaveTimer);
            this._recipeSaveTimer = setTimeout(() => this._saveRecipeUpdates(), 800);
        },

        // Writes changed pantry items and products to Firestore, then syncs updated product state to ghosts
        _savePantryUpdates() {
            if (!this.householdId || !this._persistEnabled) return;
            // Save new or changed items
            this.pantry.forEach(item => {
                const key = this._pantryItemKey(item);
                if (this._pantrySnapshot.get(item.id) !== key) {
                    PantryService.savePantryItem(this.householdId, item).catch(console.error);
                    this._pantrySnapshot.set(item.id, key);
                }
            });
            // Save changed products and sync restock fields to ghost
            this.pantry.getProducts().forEach(product => {
                const key = this._productKey(product);
                if (this._productSnapshot.get(product.id) !== key) {
                    PantryService.saveProduct(this.householdId, product).catch(console.error);
                    this._productSnapshot.set(product.id, key);
                    const ghost = this.ghosts.find(g => g.product.id === product.id);
                    if (ghost) {
                        ghost.syncFromProduct();
                        GhostService.save(this.householdId, ghost).catch(console.error);
                        this._ghostSnapshot.set(ghost.id, this._ghostKey(ghost));
                    }
                }
            });
        },

        // Writes changed shopping items to Firestore and deletes items that were removed from the list
        _saveShoppingUpdates() {
            if (!this.householdId || !this._persistEnabled) return;
            // Save new or changed items
            this.shoppingList.forEach(item => {
                const key = this._shoppingItemKey(item);
                if (this._shoppingSnapshot.get(item.id) !== key) {
                    ShoppingService.saveItem(this.householdId, item).catch(console.error);
                    this._shoppingSnapshot.set(item.id, key);
                }
            });
            // Delete items removed from the list (e.g. Grocery's lowerQty splice)
            this._shoppingSnapshot.forEach((_, id) => {
                if (!this.shoppingList.find(i => i.id === id)) {
                    ShoppingService.deleteItem(this.householdId, id).catch(console.error);
                    this._shoppingSnapshot.delete(id);
                }
            });
        },

        // Writes new recipes to Firestore and deletes recipes that were removed from the collection
        _saveRecipeUpdates() {
            if (!this.householdId || !this._persistEnabled) return;
            const currentIds = new Set(this.recipes.map(r => r.id));
            // Save new recipes
            this.recipes.forEach(recipe => {
                if (!this._savedRecipeIds.has(recipe.id)) {
                    RecipeService.saveRecipe(this.householdId, recipe).catch(console.error);
                    this._savedRecipeIds.add(recipe.id);
                }
            });
            // Delete removed recipes
            this._savedRecipeIds.forEach(id => {
                if (!currentIds.has(id)) {
                    RecipeService.deleteRecipe(this.householdId, id).catch(console.error);
                    this._savedRecipeIds.delete(id);
                }
            });
        },

        // ── User overrides ────────────────────────────────────────

        // Records a user-specified category for an ingredient name, overriding the default lookup
        learnCategoryOverride(itemName, categoryName) {
            const key = itemName.trim().toLowerCase();
            if (!key || !categoryName) return;
            this.userOverrides[key] = categoryName;
        },

        // Returns the best category name for an ingredient, respecting user overrides and renames
        getCategoryForItem(name, unit = null) {
            const key = name.trim().toLowerCase();
            const cat = this.userOverrides[key] ?? getIngredientCategory(name, unit);
            return this.categoryRenames[cat] ?? cat;
        },

        // ── Category management ───────────────────────────────────

        // Renames a category everywhere: all product/shopping item records, overrides map, and renames map
        renameCategory({ id, newName }) {
            const category = this.categories.find(c => c.id === id);
            if (!category) return;
            const oldName = category.name;
            this.pantry.forEach(item => {
                if (item.product.category === oldName) item.product.category = newName;
            });
            this.shoppingList.forEach(item => {
                if (item.product.category === oldName) item.product.category = newName;
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


        // ── Pantry mutations ──────────────────────────────────────

        // Removes a product and all its pantry items from state and Firestore (ghost is kept intentionally)
        deleteProduct(product) {
            const itemIds = this.pantry.getBatch(product).map(i => i.id);
            this.pantry.removeProduct(product);
            if (this.householdId) {
                PantryService.deleteProduct(this.householdId, product, itemIds).catch(console.error);
                itemIds.forEach(id => this._pantrySnapshot.delete(id));
                this._productSnapshot.delete(product.id);
                // Ghost is intentionally kept — restock intent survives pantry deletion
            }
            this.updateRestockShoppingList();
        },

        // Clears the restock flag on the ghost for a shopping item and updates the restock list
        removeRestockItem(shoppingItem) {
            const ghost = this.ghosts.find(g => g.product.id === shoppingItem.product.id);
            if (!ghost) return;
            ghost.clearRestock();
            if (this.householdId) {
                GhostService.save(this.householdId, ghost).catch(console.error);
                this._ghostSnapshot.set(ghost.id, this._ghostKey(ghost));
            }
            this.updateRestockShoppingList();
        },

        // Removes a ghost from local state and deletes it from Firestore
        deleteGhost(ghost) {
            const idx = this.ghosts.findIndex(g => g.id === ghost.id);
            if (idx !== -1) this.ghosts.splice(idx, 1);
            if (this.householdId) {
                GhostService.delete(this.householdId, ghost.id).catch(console.error);
                this._ghostSnapshot.delete(ghost.id);
            }
        },

        // Removes a single pantry item from state and deletes it from Firestore
        deleteItem(item) {
            this.pantry.removeItem(item);
            if (this.householdId) {
                PantryService.deletePantryItem(this.householdId, item.id).catch(console.error);
                this._pantrySnapshot.delete(item.id);
            }
        },

        // Deducts ingredients from the pantry based on the make-recipe plan, consuming oldest items first
        makeRecipe(plan) {
            for (const { pantryItems, needed } of plan) {
                const sorted = [...pantryItems].sort(
                    (a, b) => a.expiration.toDate() - b.expiration.toDate()
                );
                let remaining = roundQty(needed);
                for (const item of sorted) {
                    if (remaining <= 0) break;
                    if (item.qty <= remaining) {
                        remaining = roundQty(remaining - item.qty);
                        this.deleteItem(item);
                    } else {
                        item.qty = roundQty(item.qty - remaining);
                        remaining = 0;
                    }
                }
            }
            this.updateRestockShoppingList();
        },

        // Learns a category override if provided, then adds the item to the pantry
        handlePantryAddItem({ name, categoryOverride }) {
            if (categoryOverride) {
                this.learnCategoryOverride(name, categoryOverride.name);
            }
            this.handleAddItem({ name, quantity: null, mode: 'pantry', categoryOverride });
        },

        // Resolves the category and routes the add to pantry or shopping list based on mode
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

        // Adds a product to the pantry, reusing existing products or ghosts when available
        addToPantry(name, category, quantity) {
            const existing = this.pantry.getProducts().find(p => p.matchesName(name));
            const ghost = !existing && this.ghosts.find(g => g.product.matchesName(name));
            const product = existing ?? ghost?.product ?? Product.create(name, category.name);
            // Use the product's defaultQty; the passed quantity is ignored for pantry adds
            // (it is only meaningful for shopping-list restock counts)
            this.pantry.add(product, product.defaultQty);
            // New item is at index 0 (PantryCollection uses unshift)
            const newItem = this.pantry[0];
            product.addedAt = Math.max(product.addedAt ?? 0, newItem?.createdAt ?? Date.now())
            if (this.householdId && newItem) {
                PantryService.savePantryItem(this.householdId, newItem).catch(console.error);
                this._pantrySnapshot.set(newItem.id, this._pantryItemKey(newItem));
                this._productSnapshot.set(product.id, this._productKey(product));
            }
            // Upsert ghost — create only if one doesn't already exist for this product
            if (!this.ghosts.find(g => g.product.id === product.id)) {
                const ghost = ProductGhost.create(product);
                this.ghosts.push(ghost);
                if (this.householdId) {
                    GhostService.save(this.householdId, ghost).catch(console.error);
                    this._ghostSnapshot.set(ghost.id, this._ghostKey(ghost));
                }
            }
        },

        // Adds a product to the shopping list, incrementing quantity if already present
        addToShoppingList(name, category, quantity) {
            const existing = this.pantry.getProducts().find(p => p.matchesName(name))
                ?? this.shoppingList.find(i => i.product.matchesName(name))?.product;
            const product = existing ?? Product.create(name, category.name);
            this.shoppingList.add(product, quantity);
            const item = this.shoppingList.find(i => i.product.id === product.id);
            if (this.householdId && item) {
                ShoppingService.saveItem(this.householdId, item).catch(console.error);
                this._shoppingSnapshot.set(item.id, this._shoppingItemKey(item));
            }
        },

        // Returns true if the shopping list contains an item matching the given ingredient name
        isIngredientOnShoppingList(name) {
            return this.shoppingList.hasIngredient(name);
        },

        // Adds all missing or insufficient recipe ingredients to the shopping list, animating newly added ones
        addRecipeToGroceryList(recipe) {
            const newItems = [];
            const NON_SHOPABLE = new Set(['water', 'ice', 'ice water', 'boiling water', 'cold water', 'warm water', 'hot water']);
            recipe.ingredients.forEach(ingredient => {
                const rawName  = (ingredient.name || '').trim().toLowerCase();
                const shopName = INGREDIENT_SUBSTITUTES[rawName] ?? rawName;
                if (NON_SHOPABLE.has(shopName)) return;
                const status = getIngredientStatus({ ...ingredient, name: shopName }, this.pantry);
                if (status === 'ok' || status === 'incompatible') return;
                const wasOnList = this.isIngredientOnShoppingList(shopName);
                const catName = this.getCategoryForItem(shopName, ingredient.unit);
                const category = this.categories.find(c => c.name === catName)
                    ?? this.categories.find(c => c.name === 'Misc')
                    ?? this.categories[0];
                this.addToShoppingList(shopName, category, 1);
                if (!wasOnList) newItems.push(shopName);
            });
            this.newlyAddedIngredients = newItems;
            setTimeout(() => { this.newlyAddedIngredients = []; }, newItems.length * 150 + 600);
        },

        // Updates isDesktop/isMobile flags and recalculates the nav indicator on window resize
        handleResize() {
            this.isDesktop = window.innerWidth >= 1400;
            this.isMobile = window.innerWidth < 1400;
            this.updateNavIndicator();
        },

        // Positions the animated underline indicator below the active nav tab button
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

        // Rebuilds restockShoppingList from ghosts with restock enabled and auto-restock low-stock products
        updateRestockShoppingList() {
            const restockGhosts = this.ghosts.filter(g => g.restock);
            const restockProductIds = new Set(restockGhosts.map(g => g.product.id));

            let autoProducts = [];
            if (this.householdPrefs.autoGenShoppingList) {
                const threshold = this.householdPrefs.lowStockThreshold ?? 30;
                autoProducts = this.pantry.getProducts().filter(product => {
                    if (restockProductIds.has(product.id)) return false;
                    if (this.shoppingList.find(i => i.product.id === product.id)) return false;
                    const batch = this.pantry.getBatch(product);
                    const totalQty = batch.reduce((sum, item) => sum + item.qty, 0);
                    return totalQty <= threshold;
                });
            }

            const newRestockList = [];
            for (const ghost of restockGhosts) {
                const batch = this.pantry.getBatch(ghost.product);
                const totalQty = batch.reduce((sum, item) => sum + item.qty, 0);

                let shouldRestock, shoppingQty, hint;

                if (isThresholdRestock(ghost.product.defaultUnit, ghost.product.defaultQty)) {
                    const threshold = 0.25 * ghost.product.defaultQty;
                    shouldRestock = totalQty < threshold;
                    shoppingQty = ghost.restockQty || 1;
                    hint = shouldRestock
                        ? `${parseFloat((ghost.product.defaultQty * shoppingQty).toFixed(1))} ${ghost.product.defaultUnit}`
                        : null;
                } else {
                    const targetQty = ghost.restockQty * ghost.product.defaultQty;
                    const deficit = targetQty - totalQty;
                    shouldRestock = deficit > 0;
                    shoppingQty = ghost.restockQty;
                    hint = shouldRestock
                        ? `${parseFloat(deficit.toFixed(1))} ${ghost.product.defaultUnit}`
                        : null;
                }

                const existingShoppingItem = this.shoppingList.find(i => i.product.id === ghost.product.id);
                if (existingShoppingItem) {
                    existingShoppingItem.qtyHint = hint;
                } else if (shouldRestock) {
                    const item = ItemFactory.makeShoppingItem(ghost.product, shoppingQty);
                    item.qtyHint = hint;
                    newRestockList.push(item);
                }
            }

            this.restockShoppingList = [
                ...newRestockList,
                ...autoProducts.map(p => ItemFactory.makeShoppingItem(p, p.restockQty || 1)),
            ];
        },

        // Moves all checked-off shopping items into the pantry, creating one entry per unit bought
        addBoughtToPantry() {
            const bought = [...this.shoppingList, ...this.restockShoppingList].filter(item => item.bought);
            const deletedShoppingIds = [];

            bought.forEach(item => {
                const expiration = Expiration.fromDate(item.expiration.toDate());
                // Create one separate pantry entry per unit bought so each can have
                // its own location (e.g. 2 bottles of olive oil → 2 trackable entries)
                const count = Math.max(1, Math.round(item.qty));
                for (let i = 0; i < count; i++) {
                    this.pantry.add(item.product, item.product.defaultQty, expiration);
                    const newItem = this.pantry[0];
                    item.product.addedAt = Math.max(item.product.addedAt ?? 0, newItem?.createdAt ?? Date.now())
                    if (this.householdId && newItem) {
                        PantryService.savePantryItem(this.householdId, newItem).catch(console.error);
                        this._pantrySnapshot.set(newItem.id, this._pantryItemKey(newItem));
                        this._productSnapshot.set(item.product.id, this._productKey(item.product));
                    }
                }
                if (!this.ghosts.find(g => g.product.id === item.product.id)) {
                    const ghost = ProductGhost.create(item.product);
                    this.ghosts.push(ghost);
                    if (this.householdId) {
                        GhostService.save(this.householdId, ghost).catch(console.error);
                        this._ghostSnapshot.set(ghost.id, this._ghostKey(ghost));
                    }
                }
            });

            for (let i = this.shoppingList.length - 1; i >= 0; i--) {
                if (this.shoppingList[i].bought) {
                    deletedShoppingIds.push(this.shoppingList[i].id);
                    this._shoppingSnapshot.delete(this.shoppingList[i].id);
                    this.shoppingList.splice(i, 1);
                }
            }

            if (this.householdId && deletedShoppingIds.length) {
                ShoppingService.deleteMany(this.householdId, deletedShoppingIds).catch(console.error);
            }

            this.updateRestockShoppingList();
        },
    },

    watch: {
        '$route.query.tab'(val) {
            if (this.currentUser && val) {
                localStorage.setItem(`hh_${this.currentUser.uid}_tab`, val);
            }
            this.$nextTick(() => this.updateNavIndicator());
        },
        // Deep watchers catch in-place mutations (qty +/-, expiration edits,
        // restock toggles, category drag-and-drop) that bypass explicit methods.
        pantry: {
            deep: true,
            handler() {
                this._syncGhostsFromProducts();
                this._schedulePantrySave();
                this.updateRestockShoppingList();
            },
        },
        shoppingList: {
            deep: true,
            handler() { this._scheduleShoppingSave(); },
        },
        recipes: {
            deep: true,
            handler() { this._scheduleRecipeSave(); },
        },
    },

    mounted() {
        // Non-reactive instance fields used for persistence tracking
        this._persistEnabled = false;
        this._pantrySnapshot = new Map();
        this._productSnapshot = new Map();
        this._shoppingSnapshot = new Map();
        this._ghostSnapshot = new Map();
        this._savedRecipeIds = new Set();
        this._pantrySaveTimer = null;
        this._shoppingSaveTimer = null;
        this._recipeSaveTimer = null;

        this._authUnsub = AuthService.onAuthChange(user => {
            this.currentUser = user;
            if (user && !this.dataLoaded) {
                this.loadHouseholdData(user.uid);
            }
        });
        window.addEventListener('resize', this.handleResize);
        this._closeUserMenu = (e) => {
            if (this.$refs.userMenuWrap && !this.$refs.userMenuWrap.contains(e.target)) {
                this.showUserMenu = false;
            }
        };
        document.addEventListener('click', this._closeUserMenu);
        this.$nextTick(() => this.updateNavIndicator());
    },

    beforeUnmount() {
        if (this._authUnsub) this._authUnsub();
        clearTimeout(this._pantrySaveTimer);
        clearTimeout(this._shoppingSaveTimer);
        clearTimeout(this._recipeSaveTimer);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('click', this._closeUserMenu);
    },
}
</script>

<template>
    <main>
        <div class="wrapper">
            <header class="d-flex main-header">
                <div class="logo">
                    <img src="/img/HH_icon.png" alt="HomeHarvest icon" class="logo-icon">
                    <h1><span class="logo-home">Home</span><span class="logo-harvest">Harvest</span></h1>
                </div>
                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="header-nav">
                        <button class="nav-link" :class="{ active: currentTab === 'pantry', 'tab-adjacent': greenTab === 'pantry' }"
                            @click="$router.push({ query: { tab: 'pantry' } })" type="button">
                            <span>Pantry</span><i class="bi bi-box-seam"></i>
                        </button>
                    </li>
                    <li class="nav-item" role="header-nav">
                        <button class="nav-link" :class="{ active: currentTab === 'grocery', 'tab-adjacent': greenTab === 'grocery' }"
                            @click="$router.push({ query: { tab: 'grocery' } })" type="button">
                            <span>Grocery List</span><i class="bi bi-basket"></i>
                        </button>
                    </li>
                    <li class="nav-item" role="header-nav">
                        <button class="nav-link" :class="{ active: currentTab === 'recipes', 'tab-adjacent': greenTab === 'recipes' }"
                            @click="$router.push({ query: { tab: 'recipes' } })" type="button">
                            <span>Recipes</span><i class="bi bi-journal-text"></i>
                        </button>
                    </li>
                    <span class="nav-indicator" :style="navIndicatorStyle"></span>
                </ul>
                <div class="user-menu-wrap" ref="userMenuWrap">
                    <button class="avatar-btn" @click.stop="showUserMenu = !showUserMenu">
                        <span class="user-avatar">{{ userName.charAt(0).toUpperCase() }}</span>
                    </button>
                    <transition name="menu-drop">
                        <div v-if="showUserMenu" class="user-dropdown">
                            <button class="dropdown-item-btn" @click="showSettings = true; showUserMenu = false">
                                <i class="bi bi-gear"></i> Settings
                            </button>
                            <button class="dropdown-item-btn danger" @click="handleSignOut">
                                <i class="bi bi-box-arrow-right"></i> Logout
                            </button>
                        </div>
                    </transition>
                </div>
            </header>
        </div>

        <div class="tab-content" id="myTabContent">

            <!-- PANTRY -->
            <pantry
                v-show="currentTab === 'pantry'"
                :visible="currentTab === 'pantry'"
                :products="pantry"
                :categories="categories"
                :units="units"
                :is-mobile="isMobile"
                :locations="householdLocations"
                :loading="!dataLoaded"
                @add-item="handlePantryAddItem"

                @delete-product="deleteProduct($event)"
                @delete-item="deleteItem($event.item)"
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
                        @remove-restock-item="removeRestockItem($event)"
                        @add-item="handleAddItem($event)"
                        @rename-category="renameCategory($event)"
                        @reorder-categories="categories = $event" />
                </div>
            </section>

            <!-- RECIPES -->
            <recipes
                v-show="currentTab === 'recipes'"
                :recipes="recipes"
                :pantry-products="pantry"
                :shopping-list="shoppingList"
                :restock-shopping-list="restockShoppingList"
                :newly-added-ingredients="newlyAddedIngredients"
                :household-id="householdId"
                :dietary-restrictions="dietaryRestrictions"
                @add-recipe-to-grocery="addRecipeToGroceryList($event)"
                @make-recipe="makeRecipe($event)" />

        </div>

        <!-- Settings overlay -->
        <transition name="settings-slide">
            <div v-if="showSettings" class="settings-overlay">
                <SettingsView @close="showSettings = false" @preferences-updated="dietaryRestrictions = $event.dietaryRestrictions ?? []" />
            </div>
        </transition>
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

            &.tab-adjacent {
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
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}

.tab-pane.fade.show {
    animation: tabSlideIn 0.25s ease forwards;
}

.wrapper {
    background-color: var(--sage);
    background-image: repeating-linear-gradient(45deg, var(--header-stripe) 0px, var(--header-stripe) 1px, transparent 1px, transparent 8px);
}

.user-menu-wrap {
    position: relative;
    align-self: center;
    margin-left: 0.5rem;
}

.avatar-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.2rem;
    color: rgba(255,255,255,0.75);
    transition: opacity 0.15s;

    &:hover { opacity: 0.82; }
}

.user-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #fff;
    color: var(--success);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    font-weight: 700;
    flex-shrink: 0;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.22);
}


.user-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    background: var(--bg2);
    border: 1px solid rgba(0, 0, 0, 0.09);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
    min-width: 160px;
    z-index: 200;
    overflow: hidden;
}

.dropdown-item-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0.65rem 1rem;
    font-size: 0.88rem;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    transition: background 0.12s;

    i { font-size: 0.88rem; }

    &:hover { background: rgba(0, 0, 0, 0.05); }

    &.danger { color: var(--danger); }
    &.danger:hover { background: rgba(176, 53, 39, 0.1); }
}

.menu-drop-enter-active,
.menu-drop-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-drop-enter-from,
.menu-drop-leave-to {
    opacity: 0;
    transform: translateY(-6px) scaleY(0.94);
    transform-origin: top right;
}

// ── Mobile ───────────────────────────────────────────────────────────────────

@media (max-width: 768px) {
    .logo {
        display: none !important;
    }

    .main-header {
        padding: 0 1rem;
        min-height: 56px;
        justify-content: flex-end;
        align-items: center;
    }

    .nav-tabs {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        flex-wrap: nowrap;
        margin: 0;
        background-color: var(--bg2);
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
        padding-bottom: env(safe-area-inset-bottom, 0px);

        .nav-indicator {
            display: none;
        }

        .nav-item {
            flex: 1;

            i {
                display: block;
                font-size: 1.4rem;
            }

            .nav-link {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3px;
                font-size: 0.65rem;
                padding: 0.6rem 0.25rem;
                width: 100%;
                background-color: transparent !important;
                color: var(--text);
                opacity: 0.4;

                &.active {
                    color: var(--text) !important;
                    opacity: 1;
                    font-weight: 700;

                    i {
                        background: var(--surface2);
                        border-radius: 14px;
                        padding: 4px 18px;
                    }
                }
            }
        }
    }

    .tab-content {
        padding-bottom: 72px;
    }

    .user-menu-wrap {
        margin-left: 0;
    }

    .user-avatar {
        width: 36px;
        height: 36px;
        font-size: 0.95rem;
    }
}

// ── Settings overlay ──────────────────────────────────────────────────────────

.settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    overflow-y: auto;
    background: var(--bg);
}

.settings-slide-enter-active,
.settings-slide-leave-active {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-slide-enter-from,
.settings-slide-leave-to {
    transform: translateY(-100%);
}
</style>
