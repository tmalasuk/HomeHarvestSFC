<script>
import RecipeAddModal from './RecipeAddModal.vue';
import RecipeImportModal from './RecipeImportModal.vue';
import RecipeDetail from './RecipeDetail.vue';
import RecipeMakeModal from './RecipeMakeModal.vue';
import ClaudeService from '../services/ClaudeService.js';
import StorageService from '../services/StorageService.js';
import RecipeService from '../services/RecipeService.js';
import { convertUnit, normalizeIngredientName, INGREDIENT_SUBSTITUTES } from '../utils/unitConvert.js';
import { getIngredientStatus } from '../utils/ingredientStatus.js';

export default {
    name: 'Recipes',

    components: { RecipeAddModal, RecipeImportModal, RecipeDetail, RecipeMakeModal },

    props: {
        recipes:               { type: Array,   required: true },
        pantryProducts:        { type: Array,   required: true },
        shoppingList:          { type: Array,   required: true },
        restockShoppingList:   { type: Array,   required: true },
        newlyAddedIngredients: { type: Array,   required: true },
        householdId:           { type: String,  default: null },
        dietaryRestrictions:   { type: Array,   default: () => [] },
    },

    emits: ['add-recipe-to-grocery', 'make-recipe'],

    data() {
        return {
            recipeCategories: [
                'Soup', 'Salad', 'Sandwich', 'Pasta', 'Stew', 'Casserole',
                'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink',
                'Vegetarian', 'Vegan', 'Meat', 'Seafood',
                'Quick', 'Slow Cooker', 'One-Pot',
                'Comfort Food', 'Baked', 'Spicy', 'International',
            ],

            recipeMode:                 'book',
            selectedBookRecipe:         null,
            selectedDiscoverRecipe:     null,
            recipeBookSearch:           '',
            recipePage:                 1,
            recipesPerPage:             12,
            selectedRecipeCategories:   [],
            managingRecipeCats:         false,
            editingRecipeCat:           null,
            editingRecipeCatName:       '',
            showAddRecipeCategoryInput: false,
            newRecipeCategoryName:      '',
            discoverPrompt:             '',
            showAddRecipeModal:         false,
            showImportUrlModal:         false,
            showMakeModal:              false,
            recipeFilterOpen:           false,
            recipeSearchOpen:           false,
            selectedCookTime:           'any',
            sortByPantryMatch:          false,
            collapsed: { recipeCategories: false, cookTime: false, pantryMatch: false },
            makingRecipe:               null,
            makeReceipt:                [],

            expiringRecipes:        [],
            promptRecipes:          [],
            pantrySelectionRecipes: [],

            generatingExpiring: false,
            generatingPrompt:   false,
            generatingPantry:   false,

            expiringError: null,
            promptError:   null,
            pantryError:   null,

            selectedPantryItems:  [],
            showPantrySelector:   false,
            pantrySearch:         '',
            openPantryCategories: [],

            uploadingPhoto: false,

            chefPhrases: [
                'Reading your pantry…',
                'Balancing flavors…',
                'Checking temperatures…',
                'Crafting instructions…',
                'Perfecting the seasoning…',
                'Almost on the plate…',
            ],
            chefPhraseIndex:  0,
            _phraseTimer:     null,
            _progressTimers:  {},
            expiringProgress: 0,
            promptProgress:   0,
            pantryProgress:   0,
        };
    },

    watch: {
        '$route.query'(query, oldQuery) {
            if (query.tab !== 'recipes') return;
            if (query.rmode && query.rmode !== this.recipeMode) {
                this.recipeMode = query.rmode;
            }
            if (oldQuery.rid && !query.rid) {
                this.selectedBookRecipe = null;
                this.selectedDiscoverRecipe = null;
            }
        },

        showMakeModal(val) {
            if (val && this.makingRecipe) {
                this.makeReceipt = this.computeReceipt(this.makingRecipe);
            }
        },

        recipeBookSearch() { this.recipePage = 1; },

        selectedRecipeCategories() {
            const el = this.$refs.recipeGrid;
            if (!el) return;
            const fromHeight = el.offsetHeight;
            this.$nextTick(() => {
                el.style.transition = 'none';
                el.style.height = 'auto';
                const toHeight = el.offsetHeight;
                el.style.height = fromHeight + 'px';
                void el.offsetHeight;
                el.style.transition = '';
                el.style.height = toHeight + 'px';
                el.addEventListener('transitionend', () => {
                    el.style.height = 'auto';
                }, { once: true });
            });
        },

        householdId(val) {
            if (!val) return;
            try {
                const cached = JSON.parse(localStorage.getItem(this._lsKey('expiring_recipes')) ?? 'null');
                if (cached?.recipes?.length) {
                    const age = Date.now() - new Date(cached.generatedAt).getTime();
                    if (age < 48 * 60 * 60 * 1000) this.expiringRecipes = cached.recipes;
                }
            } catch { /* stale cache */ }
            try {
                const cached = JSON.parse(localStorage.getItem(this._lsKey('pantry_recipes')) ?? 'null');
                if (cached?.recipes?.length) this.pantrySelectionRecipes = cached.recipes;
            } catch { /* stale cache */ }
            try {
                const savedItems = JSON.parse(localStorage.getItem(this._lsKey('pantry_selected_items')) ?? 'null');
                if (Array.isArray(savedItems)) this.selectedPantryItems = savedItems;
            } catch { /* stale cache */ }
            const savedMode = localStorage.getItem(this._lsKey('recipe_mode'));
            if (savedMode === 'discover') this.recipeMode = 'discover';
        },

        recipeMode(val) {
            if (val === 'discover') this.loadExpiringRecipes();
            localStorage.setItem(this._lsKey('recipe_mode'), val);
        },

        expiringPantryItems(newVal, oldVal) {
            if (this.recipeMode === 'discover' && newVal.length > 0 && oldVal.length === 0) {
                this.loadExpiringRecipes();
            }
        },

        selectedPantryItems: {
            deep: true,
            handler(val) {
                localStorage.setItem(this._lsKey('pantry_selected_items'), JSON.stringify(val));
            },
        },
    },

    computed: {
        sortedRecipeCategories() {
            return [...this.recipeCategories].sort((a, b) => a.localeCompare(b));
        },

        recentlySaved() {
            return [...this.recipes]
                .filter(r => r.savedAt)
                .sort((a, b) => b.savedAt - a.savedAt)
                .slice(0, 4);
        },

        filteredBookRecipes() {
            let results = [...this.recipes];
            const q = this.recipeBookSearch.toLowerCase();
            if (q) results = results.filter(r => r.name.toLowerCase().includes(q));
            if (this.selectedRecipeCategories.length > 0) {
                results = results.filter(r =>
                    this.selectedRecipeCategories.every(cat => (r.categories || []).includes(cat))
                );
            }
            if (this.selectedCookTime !== 'any') {
                results = results.filter(r => {
                    const t = (r.prepTime || 0) + (r.cookTime || 0);
                    if (this.selectedCookTime === 'under-30') return t < 30;
                    if (this.selectedCookTime === '30-60')   return t >= 30 && t <= 60;
                    if (this.selectedCookTime === '60+')     return t > 60;
                });
            }
            if (this.sortByPantryMatch) {
                return results.sort((a, b) => this.recipeMatchScore(b) - this.recipeMatchScore(a));
            }
            return results.sort((a, b) => a.name.localeCompare(b.name));
        },

        recipePageCount() {
            return Math.max(1, Math.ceil(this.filteredBookRecipes.length / this.recipesPerPage));
        },

        paginatedBookRecipes() {
            const start = (this.recipePage - 1) * this.recipesPerPage;
            return this.filteredBookRecipes.slice(start, start + this.recipesPerPage);
        },

        expiringPantryItems() {
            const seen = new Set();
            const items = [];
            this.pantryProducts.forEach(p => {
                const daysUntil = p.daysUntilExpired();
                const name = p.product.name;
                if (daysUntil <= 7 && !seen.has(name)) {
                    seen.add(name);
                    items.push({ name, daysUntil });
                }
            });
            return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
        },

        uniquePantryNames() {
            const names = new Set();
            this.pantryProducts.forEach(p => names.add(p.product.name));
            return [...names].sort();
        },

        pantryItemsByCategory() {
            const q = this.pantrySearch.trim().toLowerCase();
            const map = new Map();
            this.pantryProducts.forEach(p => {
                const name = p.product.name;
                const cat  = p.product.category || 'Other';
                if (q && !name.toLowerCase().includes(q)) return;
                if (!map.has(cat)) map.set(cat, new Set());
                map.get(cat).add(name);
            });
            return [...map.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([category, names]) => ({ category, names: [...names].sort() }));
        },
    },

    methods: {
        // Builds a household-scoped localStorage key for the given name
        _lsKey(name) {
            return this.householdId ? `hh_${this.householdId}_${name}` : `hh_${name}`;
        },

        // Clears selected recipes and switches between book and discover modes
        switchRecipeMode(mode) {
            this.selectedBookRecipe = null;
            this.selectedDiscoverRecipe = null;
            this.recipeMode = mode;
            this.$router.push({ query: { tab: 'recipes', rmode: mode } });
        },

        // Sets the selected book recipe and pushes its URL
        openBookRecipe(recipe) {
            this.selectedBookRecipe = recipe;
            this.$router.push({ query: { tab: 'recipes', rmode: 'book', rid: recipe.id } });
        },

        // Sets the selected discover recipe and pushes its URL
        openDiscoverRecipe(recipe) {
            this.selectedDiscoverRecipe = recipe;
            this.$router.push({ query: { tab: 'recipes', rmode: 'discover', rid: recipe.id } });
        },

        // Clears the selected recipe and navigates back to the browse view
        goBackFromRecipe() {
            this.selectedBookRecipe = null;
            this.selectedDiscoverRecipe = null;
            this.$router.replace({ query: { tab: 'recipes', rmode: this.recipeMode } });
        },

        // Returns a deterministic gradient background style derived from the recipe name hash
        recipeCardStyle(recipe) {
            const string = recipe.name || String(recipe.id);
            let hash = 0;
            for (let i = 0; i < string.length; i++) {
                hash = string.charCodeAt(i) + ((hash << 5) - hash);
                hash |= 0;
            }
            const hue = 20 + (Math.abs(hash) % 150);
            return {
                background: `linear-gradient(135deg, hsla(${hue}, 45%, 40%, 0.28), hsla(${hue + 25}, 40%, 35%, 0.22))`
            };
        },

        // Adds or removes a category from the active filter list and resets pagination to page 1
        toggleRecipeCategoryFilter(cat) {
            const idx = this.selectedRecipeCategories.indexOf(cat);
            if (idx === -1) this.selectedRecipeCategories.push(cat);
            else this.selectedRecipeCategories.splice(idx, 1);
            this.recipePage = 1;
        },

        // Adds a new category name to the list if it does not already exist
        addRecipeCategory(name) {
            if (name && !this.recipeCategories.includes(name)) {
                this.recipeCategories.push(name);
            }
        },

        // Removes a category from the list and clears it from the active filter
        deleteRecipeCategory(cat) {
            const idx = this.recipeCategories.indexOf(cat);
            if (idx !== -1) this.recipeCategories.splice(idx, 1);
            const si = this.selectedRecipeCategories.indexOf(cat);
            if (si !== -1) this.selectedRecipeCategories.splice(si, 1);
        },

        // Validates and commits the new category name input, then resets the form
        addCustomRecipeCategory() {
            const name = this.newRecipeCategoryName.trim();
            if (!name) return;
            this.addRecipeCategory(name);
            this.newRecipeCategoryName = '';
            this.showAddRecipeCategoryInput = false;
        },

        // Applies the pending category rename to the list, selected filters, and all affected recipes
        saveRenameCat() {
            const newName = this.editingRecipeCatName.trim();
            if (!newName || this.editingRecipeCat === null) return;
            const oldName = this.recipeCategories[this.editingRecipeCat];
            if (oldName === newName) { this.cancelRenameCat(); return; }
            this.recipeCategories.splice(this.editingRecipeCat, 1, newName);
            const idx = this.selectedRecipeCategories.indexOf(oldName);
            if (idx !== -1) this.selectedRecipeCategories.splice(idx, 1, newName);
            this.recipes.forEach(r => {
                const ci = (r.categories || []).indexOf(oldName);
                if (ci !== -1) r.categories.splice(ci, 1, newName);
            });
            this.cancelRenameCat();
        },

        // Cancels the in-progress category rename without saving
        cancelRenameCat() {
            this.editingRecipeCat = null;
            this.editingRecipeCatName = '';
        },

        // Returns a 0–100 pantry match score for the given recipe based on ingredient overlap
        recipeMatchScore(recipe) {
            const ingredients = recipe.ingredients || [];
            if (!ingredients.length) return 0;
            const pantryNames = new Set(
                this.pantryProducts.map(p => p.product.name.trim().toLowerCase())
            );
            const matched = ingredients.filter(ing =>
                pantryNames.has((ing.name || '').trim().toLowerCase())
            ).length;
            return Math.round((matched / ingredients.length) * 100);
        },

        // Opens the recipe search bar and focuses the input
        openRecipeSearch() {
            this.recipeSearchOpen = true;
            this.$nextTick(() => this.$refs.recipeSearchInput?.focus());
        },
        // Clears the search query and closes the recipe search bar
        closeRecipeSearch() {
            this.recipeBookSearch = '';
            this.recipeSearchOpen = false;
        },
        // Closes the recipe search bar on blur if the query is empty
        onRecipeSearchBlur() {
            if (!this.recipeBookSearch.trim()) this.closeRecipeSearch();
        },

        // Adds the new recipe to the book and navigates to its detail view
        submitNewRecipe({ name, description, servings, prepTime, cookTime, categories, ingredients, steps }) {
            (categories || []).forEach(cat => this.addRecipeCategory(cat));
            this.recipes.add({ name, description, servings, prepTime, cookTime, categories, ingredients, instructions: steps ?? [] });
            const newRecipe = this.recipes[this.recipes.length - 1];
            this.recipeMode = 'book';
            this.selectedBookRecipe = newRecipe;
            this.$router.push({ query: { tab: 'recipes', rmode: 'book', rid: newRecipe.id } });
        },

        // Forwards an imported recipe object into submitNewRecipe
        handleImportedRecipe(recipe) {
            if (!recipe) return;
            this.showImportUrlModal = false;
            this.submitNewRecipe({
                name:        recipe.name,
                description: recipe.description,
                servings:    recipe.servings,
                prepTime:    recipe.prepTime,
                cookTime:    recipe.cookTime,
                categories:  recipe.categories,
                ingredients: recipe.ingredients,
                steps:       recipe.instructions,
            });
        },

        // Copies a discovered recipe into the recipe book if it has not already been saved
        saveToBook(recipe) {
            if (recipe.savedToBook) return;
            const { savedToBook, ...recipeData } = recipe;
            (recipeData.categories || []).forEach(cat => this.addRecipeCategory(cat));
            this.recipes.add(recipeData);
            recipe.savedToBook = true;
        },

        // Returns the pantry match status for a recipe ingredient
        ingredientStatus(ingredient) {
            return getIngredientStatus(ingredient, this.pantryProducts);
        },

        // Sets the recipe to make and opens the make modal
        handleMakeRecipe(recipe) {
            this.makingRecipe = recipe;
            this.showMakeModal = true;
        },

        // Builds a per-ingredient receipt describing how each ingredient can be fulfilled from the pantry
        computeReceipt(recipe) {
            return (recipe.ingredients || []).map(ing => {
                const ingName     = (ing.name || '').trim().toLowerCase();
                const ingNameNorm = INGREDIENT_SUBSTITUTES[ingName]
                    ?? INGREDIENT_SUBSTITUTES[normalizeIngredientName(ingName)]
                    ?? normalizeIngredientName(ingName);
                const ingQty      = parseFloat(ing.qty) || 0;
                const ingUnit     = (ing.unit || '').trim();

                // Exact match first; fall back to normalized/substituted name so
                // "egg yolk" finds "eggs", "skinless chicken breast halves" finds "chicken breast".
                let matches = this.pantryProducts.filter(p =>
                    p.product.name.trim().toLowerCase() === ingName
                );
                if (!matches.length && ingNameNorm !== ingName) {
                    matches = this.pantryProducts.filter(p => {
                        const pName = p.product.name.trim().toLowerCase();
                        return pName === ingNameNorm
                            || normalizeIngredientName(pName) === ingNameNorm;
                    });
                }

                if (!matches.length) {
                    return { ingredient: ing, status: 'missing', pantryItems: [] };
                }

                const pantryUnit     = (matches[0].unit || 'count');
                const totalPantryQty = matches.reduce((s, p) => s + p.qty, 0);
                const fromUnit       = ingUnit || pantryUnit;
                const converted      = convertUnit(ingQty, fromUnit, pantryUnit, ingNameNorm);

                if (converted === null) {
                    return { ingredient: ing, status: 'incompatible', pantryItems: matches, pantryUnit, totalPantryQty };
                }

                const needed = converted;
                if (totalPantryQty < needed - 0.001) {
                    return { ingredient: ing, status: 'insufficient', pantryItems: matches, pantryUnit, totalPantryQty, needed };
                }

                return { ingredient: ing, status: 'ok', pantryItems: matches, pantryUnit, totalPantryQty, needed };
            });
        },

        // Emits the make-recipe event with a deduction plan built from the receipt, then closes the modal
        confirmMakeRecipe() {
            const plan = this.makeReceipt
                .filter(r => r.status === 'ok' || r.status === 'insufficient')
                .map(r => ({
                    pantryItems: r.pantryItems,
                    needed: r.status === 'ok' ? r.needed : r.totalPantryQty,
                }));
            this.$emit('make-recipe', plan);
            this.showMakeModal = false;
        },

        // Returns true if the ingredient name appears in either the shopping or restock list
        isIngredientOnShoppingList(name) {
            const key = name.trim().toLowerCase();
            return [...this.shoppingList, ...this.restockShoppingList]
                .some(p => p.product.name.trim().toLowerCase() === key);
        },

        // Generates or loads cached expiring-ingredient recipe suggestions (48-hour cache)
        async loadExpiringRecipes(force = false) {
            if (this.expiringPantryItems.length === 0) return;

            const itemsKey = this.expiringPantryItems.map(i => i.name).sort().join(',');

            if (!force) {
                try {
                    const cached = JSON.parse(localStorage.getItem(this._lsKey('expiring_recipes')) ?? 'null');
                    if (cached?.recipes?.length) {
                        const age = Date.now() - new Date(cached.generatedAt).getTime();
                        if (age < 48 * 60 * 60 * 1000) {
                            this.expiringRecipes = cached.recipes;
                            return;
                        }
                    }
                } catch { /* stale cache, regenerate */ }
            }

            this.generatingExpiring = true;
            this.expiringError = null;
            this._startProgress('expiringProgress');
            try {
                this.expiringRecipes = await ClaudeService.generateFromExpiring(this.expiringPantryItems, this.dietaryRestrictions);
                localStorage.setItem(this._lsKey('expiring_recipes'), JSON.stringify({
                    itemsKey,
                    recipes: this.expiringRecipes,
                    generatedAt: new Date().toISOString(),
                }));
            } catch (err) {
                this.expiringError = err.message;
            } finally {
                await this._stopProgress('expiringProgress');
                this.generatingExpiring = false;
            }
        },

        // Calls Claude to generate recipes from the user's free-text prompt and pantry names
        async generateFromPrompt() {
            if (!this.discoverPrompt.trim()) return;
            this.generatingPrompt = true;
            this.promptError = null;
            this._startProgress('promptProgress');
            try {
                this.promptRecipes = await ClaudeService.generateFromPrompt(
                    this.discoverPrompt.trim(),
                    this.uniquePantryNames,
                    this.dietaryRestrictions
                );
            } catch (err) {
                this.promptError = err.message;
            } finally {
                await this._stopProgress('promptProgress');
                this.generatingPrompt = false;
            }
        },

        // Toggles a pantry item name in the selected list for recipe generation
        togglePantryItem(name) {
            const idx = this.selectedPantryItems.indexOf(name);
            if (idx === -1) this.selectedPantryItems.push(name);
            else this.selectedPantryItems.splice(idx, 1);
        },

        // Toggles a pantry category's open/closed state in the selection UI
        togglePantryCategory(cat) {
            const idx = this.openPantryCategories.indexOf(cat);
            if (idx === -1) this.openPantryCategories.push(cat);
            else this.openPantryCategories.splice(idx, 1);
        },

        // Returns the count of selected items within the given pantry category
        selectedInCategory(category) {
            const group = this.pantryItemsByCategory.find(g => g.category === category);
            if (!group) return 0;
            return group.names.filter(n => this.selectedPantryItems.includes(n)).length;
        },

        // Calls Claude to generate recipes from the user's selected pantry items
        async generateFromPantrySelection() {
            if (this.selectedPantryItems.length === 0) return;
            this.generatingPantry = true;
            this.pantryError = null;
            this._startProgress('pantryProgress');
            try {
                this.pantrySelectionRecipes = await ClaudeService.generateFromPantryItems(this.selectedPantryItems, this.dietaryRestrictions);
                localStorage.setItem(this._lsKey('pantry_recipes'), JSON.stringify({
                    items:   this.selectedPantryItems,
                    recipes: this.pantrySelectionRecipes,
                }));
            } catch (err) {
                this.pantryError = err.message;
            } finally {
                await this._stopProgress('pantryProgress');
                this.generatingPantry = false;
            }
        },

        // Starts an exponential-decay progress bar animation and rotating chef phrases for the given key
        _startProgress(key) {
            this[key] = 0;
            const start = Date.now();
            this._progressTimers[key] = setInterval(() => {
                const elapsed = Date.now() - start;
                // Exponential decay: fast start, slows asymptotically — never actually reaches 95
                this[key] = Math.round(95 * (1 - Math.exp(-elapsed / 12000)));
            }, 150);
            if (!this._phraseTimer) {
                this._phraseTimer = setInterval(() => {
                    this.chefPhraseIndex = (this.chefPhraseIndex + 1) % this.chefPhrases.length;
                }, 2500);
            }
        },

        // Compresses and uploads a recipe photo, then saves the resulting URL back to the recipe
        async uploadRecipePhoto(file, recipe) {
            if (!file || !recipe || !this.householdId) return;
            this.uploadingPhoto = true;
            try {
                const url = await StorageService.uploadRecipePhoto(this.householdId, recipe.id, file);
                recipe.photo = url;
                await RecipeService.saveRecipe(this.householdId, recipe);
            } catch (err) {
                console.error('Photo upload failed:', err);
            } finally {
                this.uploadingPhoto = false;
            }
        },

        // Snaps the named progress to 100%, waits 800ms, then clears all phrase timers if all bars are done
        _stopProgress(key) {
            clearInterval(this._progressTimers[key]);
            delete this._progressTimers[key];
            this[key] = 100;
            return new Promise(resolve => {
                setTimeout(() => {
                    if (Object.keys(this._progressTimers).length === 0) {
                        clearInterval(this._phraseTimer);
                        this._phraseTimer = null;
                        this.chefPhraseIndex = 0;
                    }
                    resolve();
                }, 800);
            });
        },
    },

    beforeUnmount() {
        Object.values(this._progressTimers).forEach(t => clearInterval(t));
        clearInterval(this._phraseTimer);
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <section class="tab-pane show fade active" id="recipes" role="tabpanel" aria-labelledby="recipes-tab">

        <!-- Mobile toolbar -->
        <div class="recipe-mobile-bar">

            <!-- Detail view: back + camera -->
            <template v-if="selectedBookRecipe || selectedDiscoverRecipe">
                <div class="recipe-mode-flip">
                    <button class="recipe-icon-btn" @click="goBackFromRecipe">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <span class="flip-label">{{ selectedBookRecipe ? 'Book' : 'Discover' }}</span>
                </div>
                <div class="recipe-mobile-actions" v-if="selectedBookRecipe">
                    <label class="recipe-icon-btn" :class="{ 'uploading': uploadingPhoto }" title="Upload photo">
                        <i :class="uploadingPhoto ? 'bi bi-hourglass-split' : 'bi bi-camera'"></i>
                        <input type="file" accept="image/*" style="display:none"
                            :disabled="uploadingPhoto"
                            @change="uploadRecipePhoto($event.target.files[0], selectedBookRecipe); $event.target.value = ''">
                    </label>
                </div>
            </template>

            <!-- Browse view: flip + actions -->
            <template v-else>
                <div class="recipe-mode-flip">
                    <button class="recipe-icon-btn" @click="switchRecipeMode(recipeMode === 'book' ? 'discover' : 'book')">
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                    <transition name="chip-swap" mode="out-in">
                        <span :key="recipeMode" class="flip-label">{{ recipeMode === 'book' ? 'Book' : 'Discover' }}</span>
                    </transition>
                </div>
                <div class="recipe-mobile-actions" v-show="recipeMode === 'book'">
                    <button class="recipe-icon-btn" @click="showAddRecipeModal = true" title="New Recipe">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                    <button class="recipe-icon-btn" @click="showImportUrlModal = true" title="Import URL">
                        <i class="bi bi-link-45deg"></i>
                    </button>
                    <button class="recipe-icon-btn" :class="{ 'has-filters': selectedRecipeCategories.length > 0 }"
                        @click="recipeFilterOpen = true" title="Filter">
                        <i :class="selectedRecipeCategories.length > 0 ? 'bi bi-funnel-fill' : 'bi bi-funnel'"></i>
                        <span v-if="selectedRecipeCategories.length > 0" class="filter-active-dot"></span>
                    </button>
                </div>
            </template>

        </div>

        <!-- Mobile filter panel -->
        <Teleport to="body">
            <transition name="filter-fade">
                <div v-if="recipeFilterOpen" class="recipe-filter-overlay" @click="recipeFilterOpen = false"></div>
            </transition>
            <transition name="filter-drop">
                <div v-if="recipeFilterOpen" class="recipe-filter-panel">
                    <div class="filter-panel-handle"></div>
                    <div class="filter-panel-head">
                        <span class="filter-panel-title">Filter Recipes</span>
                        <button v-if="selectedRecipeCategories.length > 0" class="filter-panel-clear" @click="selectedRecipeCategories = []">
                            Clear all
                        </button>
                        <button class="filter-panel-close" @click="recipeFilterOpen = false">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="filter-panel-group">
                        <div class="filter-panel-label">Categories</div>
                        <div class="filter-panel-chips">
                            <button v-for="cat in sortedRecipeCategories" :key="cat"
                                class="filter-chip"
                                :class="{ active: selectedRecipeCategories.includes(cat) }"
                                @click="toggleRecipeCategoryFilter(cat)">{{ cat }}</button>
                        </div>
                    </div>
                    <button class="filter-panel-done" @click="recipeFilterOpen = false">Done</button>
                </div>
            </transition>
        </Teleport>

        <!-- Detail views — full width when a recipe is open -->
        <recipe-detail v-if="selectedBookRecipe"
            :recipe="selectedBookRecipe"
            :get-ingredient-status="ingredientStatus"
            :is-ingredient-on-shopping-list="isIngredientOnShoppingList"
            :newly-added-ingredients="newlyAddedIngredients"
            :card-style="recipeCardStyle(selectedBookRecipe)"
            back-label="Back to Book"
            :show-tags="true"
            @back="goBackFromRecipe()"
            @add-to-grocery="$emit('add-recipe-to-grocery', $event)"
            @make-recipe="handleMakeRecipe($event)">
            <template #actions>
                <label class="upload-photo-btn" :class="{ 'uploading': uploadingPhoto }">
                    <i :class="uploadingPhoto ? 'bi bi-hourglass-split' : 'bi bi-camera'"></i>
                    {{ uploadingPhoto ? 'Uploading…' : selectedBookRecipe.photo ? 'Change Photo' : 'Upload Photo' }}
                    <input type="file" accept="image/*" style="display:none"
                        :disabled="uploadingPhoto"
                        @change="uploadRecipePhoto($event.target.files[0], selectedBookRecipe); $event.target.value = ''">
                </label>
            </template>
        </recipe-detail>

        <recipe-detail v-else-if="selectedDiscoverRecipe"
            :recipe="selectedDiscoverRecipe"
            :get-ingredient-status="ingredientStatus"
            :is-ingredient-on-shopping-list="isIngredientOnShoppingList"
            :newly-added-ingredients="newlyAddedIngredients"
            :card-style="recipeCardStyle(selectedDiscoverRecipe)"
            back-label="Back to Discover"
            :show-tags="true"
            @back="goBackFromRecipe()"
            @add-to-grocery="$emit('add-recipe-to-grocery', $event)"
            @make-recipe="handleMakeRecipe($event)">
            <template #actions>
                <button class="save-recipe-btn"
                    :class="{ 'saved-state': selectedDiscoverRecipe.savedToBook }"
                    @click="saveToBook(selectedDiscoverRecipe)"
                    :disabled="selectedDiscoverRecipe.savedToBook">
                    <i :class="selectedDiscoverRecipe.savedToBook ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
                    {{ selectedDiscoverRecipe.savedToBook ? 'Saved to Book' : 'Save Recipe' }}
                </button>
            </template>
        </recipe-detail>

        <!-- Desktop layout: sidebar + main (browse mode only) -->
        <div v-else class="recipe-layout">

            <!-- LEFT: Filter Sidebar — desktop only -->
            <aside class="recipe-filter-sidebar" :class="{ 'sidebar-collapsed': recipeMode === 'discover' }">

                <!-- Book-mode filters -->
                <template v-if="recipeMode === 'book'">

                    <!-- Pantry Match -->
                    <div class="filter-section">
                        <button class="section-header" @click="collapsed.pantryMatch = !collapsed.pantryMatch">
                            Pantry Match
                            <i :class="collapsed.pantryMatch ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                        </button>
                        <div v-show="!collapsed.pantryMatch" class="section-pills">
                            <button class="side-pill" :class="{ active: !sortByPantryMatch }" @click="sortByPantryMatch = false">Default order</button>
                            <button class="side-pill" :class="{ active: sortByPantryMatch }" @click="sortByPantryMatch = true">Best match first</button>
                        </div>
                    </div>

                    <!-- Category -->
                    <div class="filter-section">
                        <button class="section-header" @click="collapsed.recipeCategories = !collapsed.recipeCategories">
                            Category
                            <i :class="collapsed.recipeCategories ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                        </button>
                        <div v-show="!collapsed.recipeCategories" class="section-pills">
                            <button class="side-pill" :class="{ active: selectedRecipeCategories.length === 0 }"
                                @click="selectedRecipeCategories = []; recipePage = 1">All</button>
                            <template v-if="!managingRecipeCats">
                                <button v-for="cat in sortedRecipeCategories" :key="cat" class="side-pill"
                                    :class="{ active: selectedRecipeCategories.includes(cat) }"
                                    @click="toggleRecipeCategoryFilter(cat)">{{ cat }}</button>
                                <div v-if="showAddRecipeCategoryInput" class="recipe-cat-add-input">
                                    <input type="text" v-model="newRecipeCategoryName" placeholder="New category..."
                                        @keyup.enter="addCustomRecipeCategory"
                                        @keyup.escape="showAddRecipeCategoryInput = false; newRecipeCategoryName = ''">
                                    <button @click="addCustomRecipeCategory"><i class="bi bi-check2"></i></button>
                                    <button @click="showAddRecipeCategoryInput = false; newRecipeCategoryName = ''"><i class="bi bi-x-lg"></i></button>
                                </div>
                                <button v-else class="side-pill add-pill" @click="showAddRecipeCategoryInput = true"><i class="bi bi-plus"></i> Add</button>
                                <button class="side-pill manage-pill" @click="managingRecipeCats = true"><i class="bi bi-pencil"></i> Edit</button>
                            </template>
                            <template v-else>
                                <template v-for="(cat, i) in recipeCategories" :key="cat">
                                    <div v-if="editingRecipeCat === i" class="recipe-cat-add-input">
                                        <input type="text" v-model="editingRecipeCatName"
                                            @keyup.enter="saveRenameCat" @keyup.escape="cancelRenameCat">
                                        <button @click="saveRenameCat"><i class="bi bi-check2"></i></button>
                                        <button @click="cancelRenameCat"><i class="bi bi-x-lg"></i></button>
                                    </div>
                                    <span v-else class="side-pill manage-chip" @click="deleteRecipeCategory(cat)">
                                        {{ cat }} <button class="chip-del" @click.stop="deleteRecipeCategory(cat)">&times;</button>
                                    </span>
                                </template>
                                <button class="side-pill done-pill" @click="managingRecipeCats = false; cancelRenameCat()">Done</button>
                            </template>
                        </div>
                    </div>

                    <!-- Cook Time -->
                    <div class="filter-section">
                        <button class="section-header" @click="collapsed.cookTime = !collapsed.cookTime">
                            Cook Time
                            <i :class="collapsed.cookTime ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                        </button>
                        <div v-show="!collapsed.cookTime" class="section-pills">
                            <button class="side-pill" :class="{ active: selectedCookTime === 'any' }" @click="selectedCookTime = 'any'">Any</button>
                            <button class="side-pill" :class="{ active: selectedCookTime === 'under-30' }" @click="selectedCookTime = 'under-30'">Under 30 min</button>
                            <button class="side-pill" :class="{ active: selectedCookTime === '30-60' }" @click="selectedCookTime = '30-60'">30–60 min</button>
                            <button class="side-pill" :class="{ active: selectedCookTime === '60+' }" @click="selectedCookTime = '60+'">60+ min</button>
                        </div>
                    </div>

                </template>

            </aside>

            <!-- RIGHT: Main content -->
            <div class="recipe-main">

                <!-- Action toolbar — desktop -->
                <div class="recipe-toolbar">
                    <!-- Mode flip — always visible -->
                    <div class="toolbar-mode-flip">
                        <button class="toolbar-flip-btn" @click="switchRecipeMode(recipeMode === 'book' ? 'discover' : 'book')">
                            <i class="bi bi-arrow-left-right"></i>
                        </button>
                        <transition name="chip-swap" mode="out-in">
                            <span :key="recipeMode" class="toolbar-flip-label">{{ recipeMode === 'book' ? 'Recipe Book' : 'Discover' }}</span>
                        </transition>
                    </div>

                    <!-- Book-mode actions (right-aligned) -->
                    <div v-if="recipeMode === 'book' && !selectedBookRecipe" class="toolbar-actions">
                        <button class="recipe-icon-btn" @click="showAddRecipeModal = true" title="New Recipe">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                        <button class="recipe-icon-btn" @click="showImportUrlModal = true" title="Import URL">
                            <i class="bi bi-link-45deg"></i>
                        </button>
                        <div class="toolbar-search" :class="{ 'search-open': recipeSearchOpen }">
                            <button class="search-icon-btn" @click="openRecipeSearch" title="Search recipes">
                                <i class="bi bi-search"></i>
                            </button>
                            <input ref="recipeSearchInput" type="text" class="search-input"
                                placeholder="Search…" v-model="recipeBookSearch"
                                @blur="onRecipeSearchBlur" @keydown.escape="closeRecipeSearch">
                        </div>
                    </div>
                </div>

                <!-- Scrollable content -->
                <div class="recipe-content">
                <transition name="tab-fade" mode="out-in">
                    <div v-if="recipeMode === 'book'" key="book" class="recipe-book">

                <!-- Book Browse View -->
                <div class="book-main-view">

                    <!-- Empty state -->
                    <div v-if="recipes.length === 0" class="book-empty">
                        <i class="bi bi-journal-text"></i>
                        <p>No recipes saved yet.</p>
                        <p>Save a recipe from Discover, or add one from scratch.</p>
                    </div>

                    <!-- Recently Saved -->
                    <div v-if="recentlySaved.length && !recipeBookSearch && selectedRecipeCategories.length === 0" class="recently-saved">
                        <p class="section-label">Recently Saved</p>
                        <div class="recently-saved-scroll">
                            <div class="recipe-book-card" v-for="recipe in recentlySaved" :key="'rs-' + recipe.id"
                                @click="openBookRecipe(recipe)">
                                <div class="card-photo" :style="recipeCardStyle(recipe)">
                                    <img v-if="recipe.photo" :src="recipe.photo" :alt="recipe.name">
                                    <div v-else class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                </div>
                                <div class="card-info">
                                    <span class="card-name">{{ recipe.name }}</span>
                                    <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recipe grid -->
                    <div class="book-cards-flat">
                        <div class="recipe-book-card" v-for="(recipe, index) in paginatedBookRecipes"
                            :key="recipe.id" :style="{ '--i': index }" @click="openBookRecipe(recipe)">
                            <div class="card-photo" :style="recipeCardStyle(recipe)">
                                <img v-if="recipe.photo" :src="recipe.photo" :alt="recipe.name">
                                <div v-else class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                <span v-if="sortByPantryMatch" class="card-match-badge">{{ recipeMatchScore(recipe) }}% match</span>
                            </div>
                            <div class="card-info">
                                <span class="card-name">{{ recipe.name }}</span>
                                <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                            </div>
                        </div>
                        <p v-if="paginatedBookRecipes.length === 0" class="empty-msg">No recipes match your filters.</p>
                    </div>

                    <!-- Pagination -->
                    <div v-if="recipePageCount > 1" class="recipe-pagination">
                        <button class="page-btn" :disabled="recipePage === 1" @click="recipePage--">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <button v-for="p in recipePageCount" :key="p" class="page-num"
                            :class="{ active: recipePage === p }" @click="recipePage = p">{{ p }}</button>
                        <button class="page-btn" :disabled="recipePage === recipePageCount" @click="recipePage++">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>

                </div>
            </div>

            <!-- ── DISCOVER MODE ── -->
            <div v-else key="discover" class="discover-view">

                <!-- Discover Browse view -->
                <div class="discover-browse">

                    <!-- Using what's expiring -->
                    <div v-if="expiringPantryItems.length" class="discover-section">
                        <div class="discover-section-header">
                            <span class="discover-section-title">Using what's expiring</span>
                            <button class="discover-icon-btn" @click="loadExpiringRecipes(true)"
                                :disabled="generatingExpiring" title="Refresh">
                                <i class="bi bi-arrow-clockwise" :class="{ spin: generatingExpiring }"></i>
                            </button>
                        </div>
                        <div class="expiring-chips">
                            <span class="expiring-chip" v-for="item in expiringPantryItems.slice(0, 2)" :key="item.name">{{ item.name }}</span>
                            <span v-if="expiringPantryItems.length > 2" class="expiring-chip expiring-chip--more">+{{ expiringPantryItems.length - 2 }}</span>
                        </div>
                        <div class="discover-results-area">
                            <div v-if="generatingExpiring" class="chef-loading">
                                <div class="chef-details">
                                    <transition name="phrase-fade" mode="out-in">
                                        <span class="chef-phrase" :key="chefPhraseIndex">{{ chefPhrases[chefPhraseIndex] }}</span>
                                    </transition>
                                    <div class="chef-bar-wrap">
                                        <div class="chef-bar-fill" :style="{ width: expiringProgress + '%' }"></div>
                                    </div>
                                    <span class="chef-pct">{{ expiringProgress }}%</span>
                                </div>
                            </div>
                            <div v-else-if="expiringError" class="discover-error">
                                <i class="bi bi-exclamation-circle"></i> {{ expiringError }}
                                <button class="discover-retry-btn" @click="loadExpiringRecipes(true)">Retry</button>
                            </div>
                            <div v-else-if="expiringRecipes.length" class="book-cards-flat">
                                <div class="recipe-book-card" v-for="(recipe, index) in expiringRecipes"
                                    :key="recipe.id" :style="{ '--i': index }" @click="openDiscoverRecipe(recipe)">
                                    <div class="card-photo" :style="recipeCardStyle(recipe)">
                                        <div class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                    </div>
                                    <div class="card-info">
                                        <span class="card-name">{{ recipe.name }}</span>
                                        <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- From your pantry -->
                    <div class="discover-section">
                        <div class="discover-section-header">
                            <span class="discover-section-title">From your pantry</span>
                        </div>
                        <div class="pantry-two-col">

                            <!-- Left: toolbox -->
                            <div class="pantry-toolbox">
                                <div class="pantry-search-bar">
                                    <i class="bi bi-search"></i>
                                    <input type="text" v-model="pantrySearch" placeholder="Search pantry items…" />
                                    <button v-if="pantrySearch" class="pantry-search-clear" @click="pantrySearch = ''">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>

                                <div v-if="selectedPantryItems.length" class="pantry-selected-summary">
                                    <span v-for="name in selectedPantryItems" :key="name"
                                        class="pantry-pick-chip selected"
                                        @click="togglePantryItem(name)">
                                        {{ name }} <i class="bi bi-x-lg"></i>
                                    </span>
                                </div>

                                <div class="pantry-accordion">
                                    <div v-for="group in pantryItemsByCategory" :key="group.category" class="pantry-acc-group">
                                        <button class="pantry-acc-header" @click="togglePantryCategory(group.category)">
                                            <i class="bi"
                                                :class="openPantryCategories.includes(group.category) || pantrySearch
                                                    ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                                            <span class="pantry-acc-cat-name">{{ group.category }}</span>
                                            <span class="pantry-acc-count">{{ group.names.length }}</span>
                                            <span v-if="selectedInCategory(group.category)" class="pantry-acc-sel-badge">
                                                {{ selectedInCategory(group.category) }} selected
                                            </span>
                                        </button>
                                        <div v-if="openPantryCategories.includes(group.category) || pantrySearch"
                                            class="pantry-acc-items">
                                            <label v-for="name in group.names" :key="name" class="pantry-acc-item">
                                                <input type="checkbox"
                                                    :checked="selectedPantryItems.includes(name)"
                                                    @change="togglePantryItem(name)" />
                                                <span>{{ name }}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <p v-if="pantryItemsByCategory.length === 0" class="discover-empty-note">
                                        {{ uniquePantryNames.length === 0 ? 'Your pantry is empty.' : 'No items match your search.' }}
                                    </p>
                                </div>

                                <button class="pantry-gen-btn"
                                    :disabled="selectedPantryItems.length === 0 || generatingPantry"
                                    @click="generateFromPantrySelection">
                                    <i class="bi" :class="generatingPantry ? 'bi-hourglass-split' : 'bi-stars'"></i>
                                    {{ generatingPantry ? 'Generating…' : selectedPantryItems.length ? `Generate from ${selectedPantryItems.length} ${selectedPantryItems.length === 1 ? 'item' : 'items'}` : 'Generate' }}
                                </button>
                            </div>

                            <!-- Right: results -->
                            <div class="pantry-results">
                                <div v-if="pantryError" class="discover-error">
                                    <i class="bi bi-exclamation-circle"></i> {{ pantryError }}
                                </div>
                                <div v-if="generatingPantry" class="chef-loading pantry-chef-loading">
                                    <div class="chef-details">
                                        <transition name="phrase-fade" mode="out-in">
                                            <span class="chef-phrase" :key="chefPhraseIndex">{{ chefPhrases[chefPhraseIndex] }}</span>
                                        </transition>
                                        <div class="chef-bar-wrap">
                                            <div class="chef-bar-fill" :style="{ width: pantryProgress + '%' }"></div>
                                        </div>
                                        <span class="chef-pct">{{ pantryProgress }}%</span>
                                    </div>
                                </div>
                                <div v-else-if="pantrySelectionRecipes.length" class="pantry-recipe-grid">
                                    <div class="recipe-book-card" v-for="(recipe, index) in pantrySelectionRecipes"
                                        :key="recipe.id" :style="{ '--i': index }" @click="openDiscoverRecipe(recipe)">
                                        <div class="card-photo" :style="recipeCardStyle(recipe)">
                                            <div class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                        </div>
                                        <div class="card-info">
                                            <span class="card-name">{{ recipe.name }}</span>
                                            <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="pantry-results-empty">
                                    <i class="bi bi-journal-richtext"></i>
                                    <p>Pick some ingredients<br>to start crafting.</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- Ask for a recipe -->
                    <div class="discover-prompt-area">
                        <div class="discover-section-header">
                            <span class="discover-section-title">Ask for a recipe</span>
                        </div>
                        <div class="discover-prompt-input">
                            <textarea v-model="discoverPrompt"
                                placeholder="e.g. something quick with chicken, or a cozy soup for tonight…"
                                @keydown.ctrl.enter="generateFromPrompt"></textarea>
                            <button class="discover-generate-btn"
                                :disabled="!discoverPrompt.trim() || generatingPrompt"
                                @click="generateFromPrompt">
                                <i class="bi" :class="generatingPrompt ? 'bi-hourglass-split' : 'bi-stars'"></i>
                                {{ generatingPrompt ? 'Generating…' : 'Generate' }}
                            </button>
                        </div>
                        <div v-if="promptError" class="discover-error" style="margin-top:10px">
                            <i class="bi bi-exclamation-circle"></i> {{ promptError }}
                        </div>

                        <!-- Prompt results -->
                        <div v-if="!generatingPrompt && !promptRecipes.length" class="prompt-empty-state">
                            <i class="bi bi-stars"></i>
                            <p>Your generated recipes<br>will appear here</p>
                        </div>
                        <div class="discover-results-area" v-if="generatingPrompt || promptRecipes.length">
                            <div v-if="generatingPrompt" class="chef-loading">
                                <div class="chef-details">
                                    <transition name="phrase-fade" mode="out-in">
                                        <span class="chef-phrase" :key="chefPhraseIndex">{{ chefPhrases[chefPhraseIndex] }}</span>
                                    </transition>
                                    <div class="chef-bar-wrap">
                                        <div class="chef-bar-fill" :style="{ width: promptProgress + '%' }"></div>
                                    </div>
                                    <span class="chef-pct">{{ promptProgress }}%</span>
                                </div>
                            </div>
                            <div v-else>
                                <div class="book-cards-flat">
                                    <div class="recipe-book-card" v-for="(recipe, index) in promptRecipes"
                                        :key="recipe.id" :style="{ '--i': index }" @click="openDiscoverRecipe(recipe)">
                                        <div class="card-photo" :style="recipeCardStyle(recipe)">
                                            <div class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                        </div>
                                        <div class="card-info">
                                            <span class="card-name">{{ recipe.name }}</span>
                                            <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </transition>
                </div>
            </div>
        </div>

        <!-- Modals (position:fixed, DOM position irrelevant) -->
        <recipe-add-modal v-if="showAddRecipeModal" :show="showAddRecipeModal" :recipe-categories="recipeCategories"
            @close="showAddRecipeModal = false"
            @submit="submitNewRecipe"
            @add-category="addRecipeCategory" />
        <recipe-import-modal v-if="showImportUrlModal" :show="showImportUrlModal"
            @close="showImportUrlModal = false"
            @import="handleImportedRecipe" />
        <recipe-make-modal v-if="showMakeModal" :show="showMakeModal"
            :recipe="makingRecipe"
            :receipt="makeReceipt"
            @close="showMakeModal = false"
            @confirm="confirmMakeRecipe" />

    </section>
</template>

<style lang="scss" scoped>

@use "@/assets/variables" as *;

// ── Recipes tab card wrapper ────────────────────────────────
#recipes {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    padding: 0;
    background-color: var(--bg);
    border-radius: 15px;
    overflow: hidden;
}

// ── Desktop layout: sidebar + main ─────────────────────────
.recipe-layout {
    display: flex;
    height: 100%;
    min-height: 0;
}

.recipe-filter-sidebar {
    width: 28%;
    flex-shrink: 0;
    border-right: 1px solid var(--border-subtle);
    overflow: hidden;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.3s ease;

    &.sidebar-collapsed {
        width: 0;
        padding: 0;
        border-color: transparent;
    }
}

.filter-section + .filter-section {
    border-top: 1px solid var(--border-subtle);
    padding-top: 4px;
    margin-top: 4px;
}

.section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    padding: 7px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    transition: background 0.12s;

    &:hover { background: var(--surface); }

    i { font-size: 0.6rem; opacity: 0.55; }
}

.section-pills {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 2px 4px 8px;
}

.side-pill {
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 7px 12px;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.88rem;
    cursor: pointer;
    color: var(--text-muted);
    text-align: left;
    transition: background 0.12s, color 0.12s;

    &:hover {
        background: var(--surface);
        color: var(--text);
    }

    &.active {
        background: var(--surface2);
        color: var(--text);
        font-weight: 600;
    }

    &.add-pill, &.manage-pill {
        color: var(--text-faint);
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        gap: 5px;
        i { font-size: 0.7rem; }
    }

    &.done-pill {
        color: var(--text-muted);
        font-size: 0.78rem;
    }

    &.manage-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px dashed var(--border);
        font-size: 0.82rem;

        &:hover {
            background: var(--danger);
            color: var(--text-opposite);
            border-color: var(--danger);
        }

        .chip-del {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 0;
            opacity: 0.5;
            color: inherit;
        }
    }
}

.recipe-main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

// ── Action toolbar ──────────────────────────────────────────
.recipe-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
    flex-wrap: wrap;
}

.toolbar-mode-flip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 6px;
}

.toolbar-flip-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--border-subtle);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;

    &:hover {
        background: var(--surface2);
        color: var(--text);
    }
}

.toolbar-flip-label {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
}

.toolbar-search {
    display: flex;
    align-items: center;
    border-radius: 50px;
    background-color: var(--search-surface);
    overflow: hidden;
    width: 40px;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &.search-open { width: 220px; }
}

.search-icon-btn {
    flex-shrink: 0;
    width: 40px;
    padding: 10px 0;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.15s;

    &:hover { color: var(--text); }
    i { font-size: 0.9rem; }
}

.search-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 0 14px 0 2px;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    outline: none;
    opacity: 0;
    transition: opacity 0.15s ease 0.1s;
    color: var(--text);

    &::placeholder { color: var(--text-faint); }
    .search-open & { opacity: 1; }
}

// ── Scrollable content area ─────────────────────────────────
.recipe-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 20px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

// ── Recipe list rows ────────────────────────────────────────
.recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 4px;
}

.recipe-list-row {
    display: flex;
    align-items: stretch;
    gap: 0;
    cursor: pointer;
    border-bottom: 1px solid var(--border-subtle);
    transition: background 0.12s;
    opacity: 0;
    animation: cardStaggerIn 0.2s ease forwards;
    animation-delay: calc(var(--i, 0) * 0.04s);

    &:hover {
        background: var(--surface);
    }

    &:first-child {
        border-top: 1px solid var(--border-subtle);
    }
}

.row-photo {
    width: 90px;
    min-width: 90px;
    height: 90px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.row-photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
        font-size: 28px;
        opacity: 0.3;
    }
}

.row-category-badge {
    position: absolute;
    bottom: 4px;
    left: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    color: #fff;
    font-family: 'Oxygen';
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.row-details {
    flex: 1;
    min-width: 0;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
}

.row-name {
    font-family: 'Oxygen';
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.row-meta {
    font-family: 'Oxygen';
    font-size: 0.78rem;
    color: var(--text-faint);
}

.row-description {
    font-family: 'Oxygen';
    font-size: 0.82rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 4px 0 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.row-match-badge {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    gap: 2px;
    border-left: 1px solid var(--border-subtle);
}

.row-match-pct {
    font-family: 'Oxygen';
    font-size: 1rem;
    font-weight: 700;
    color: var(--accent);
}

.row-match-label {
    font-family: 'Oxygen';
    font-size: 0.65rem;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

// ── Mobile toolbar — hidden on desktop ───────────────────────
.recipe-mobile-bar {
    display: none;
}

.recipe-icon-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--search-surface);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;

    &:hover { color: var(--text); }
}

.chip-swap-enter-active,
.chip-swap-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.chip-swap-enter-from { opacity: 0; transform: translateX(6px); }
.chip-swap-leave-to   { opacity: 0; transform: translateX(-6px); }

.recipe-book,
.discover-view {
    position: relative;
}

.discover-view {
    padding: 10px 0 0;
}

// (recipe-book-actions moved into .recipe-toolbar)

.recipe-action-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border: 1.5px solid var(--pantry-btn);
    border-radius: 20px;
    background: var(--pantry-btn);
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    transition: opacity 0.15s ease;
    opacity: 0.85;

    &:hover {
        opacity: 1;
    }
}

@keyframes cardStaggerIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.recipe-book-card {
    opacity: 0;
    animation: cardStaggerIn 0.25s ease forwards;
    animation-delay: calc(var(--i, 0) * 0.06s);
    flex-shrink: 0;
    width: 300px;
    height: 400px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--bg);
    transition: filter 0.2s ease, transform 0.2s ease;

    &:hover {
        filter: brightness(1.05);
        transform: translateY(-2px);
    }

    .card-photo {
        height: 300px;
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .card-photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            i {
                font-size: 60px;
                opacity: 0.35;
            }
        }


        .meal-type-banner {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            color: white;
            font-family: 'Oxygen';
            font-size: 11px;
            font-weight: 700;
            text-transform: capitalize;
            letter-spacing: 0.06em;
            text-align: center;
        }

        .card-match-badge {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
            color: #fff;
            font-family: 'Oxygen';
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 20px;
            letter-spacing: 0.03em;
        }
    }

    .card-info {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .card-name {
        font-family: 'Oxygen';
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
        line-height: 1.3;
    }

    .card-meta {
        font-size: 18px;
        color: var(--text-faint);
        font-family: 'Oxygen';
    }

    .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 5px;

        .tag {
            font-size: 10px;
            padding: 2px 7px;
            border-radius: 20px;
            background: var(--surface);
            color: var(--text-faint);
            border: none;
        }
    }
}

.section-label {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 12px;
}

.recently-saved {
    margin-bottom: 24px;
    display: none;
}

.recently-saved-scroll {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    padding: 4px;

    .recipe-book-card {
        width: 100%;
    }
}

.recipe-cat-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 18px 0 12px;
    justify-content: center;
}

.recipe-cat-chip {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    font-size: 12px;
    font-family: 'Oxygen';
    cursor: pointer;
    color: var(--text-muted);
    transition: border-color 0.15s, background 0.15s, color 0.15s;

    &:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    &.active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
    }

    &.add-cat-chip {
        padding: 5px 10px;
        font-size: 14px;
        color: var(--text-faint);

        &:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
    }

    &.manage-cats-btn {
        padding: 5px 10px;
        color: var(--text-faint);

        &:hover {
            border-color: var(--accent);
            color: var(--accent);
        }

        &.done-btn {
            color: var(--text-muted);
        }
    }
}

.manage-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px 4px 12px;
    border-radius: 20px;
    border: 1px dashed var(--border);
    font-size: 12px;
    font-family: 'Oxygen';
    color: var(--text-muted);
    cursor: pointer;

    .chip-del {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 0;
        opacity: 0.4;
        color: inherit;
        transition: opacity 0.15s;
    }

    &:hover{
        background-color: var(--danger);
        color: var(--text-opposite);
    }
}

.recipe-cat-add-input {
    display: flex;
    align-items: center;
    gap: 4px;

    input {
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid var(--accent);
        font-size: 12px;
        font-family: 'Oxygen';
        color: var(--text);
        outline: none;
        width: 140px;
    }

    button {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        transition: background 0.15s, color 0.15s;

        &:hover {
            background: var(--surface2);
            color: var(--text);
        }
    }
}

.book-cards-flat {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 28px;
    margin-top: 8px;
    padding: 4px;
    transition: height 0.35s ease;

    .recipe-book-card {
        width: 100%;
    }

    .empty-msg {
        width: 100%;
        color: var(--text-faint);
        font-size: 13px;
    }
}

.recipe-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;

    .page-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        transition: background 0.15s;

        &:hover:not(:disabled) {
            background: var(--surface2);
            color: var(--text);
        }

        &:disabled {
            opacity: 0.35;
            cursor: default;
        }
    }

    .page-num {
        min-width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        color: var(--text-muted);
        font-size: 13px;
        font-family: 'Oxygen';
        transition: background 0.15s, color 0.15s;

        &:hover {
            background: var(--surface2);
            color: var(--text);
        }

        &.active {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
        }
    }
}

.discover-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.discover-section-title {
    font-family: 'Oxygen';
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.01em;
}

.expiring-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.expiring-chip {
    font-family: 'Oxygen';
    font-size: 15px;
    padding: 2px 10px;
    border-radius: 20px;
    background: rgba(200, 146, 45, 0.15);
    color: var(--warning);
    border: 1px solid rgba(200, 146, 45, 0.35);
    white-space: nowrap;
}

.expiring-chip--more {
    background: var(--surface2);
    color: var(--text-faint);
    border-color: var(--border);
    font-size: 12px;
    padding: 2px 8px;
}

.discover-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;

    .recipe-book-card {
        width: 100%;
        box-shadow: none;
    }
}

.discover-browse {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.discover-section {
    background: var(--surface);
    border-radius: 12px;
    padding: 20px 24px;

    .recipe-book-card { box-shadow: none; }
}

.discover-results-area,
.pantry-two-col {
    .recipe-book-card { box-shadow: none; }
}

.discover-prompt-area {
    background: var(--surface);
    border-radius: 12px;
    padding: 20px 24px;
}

.discover-prompt-input {
    display: flex;
    gap: 12px;
    align-items: flex-end;

    textarea {
        flex: 1;
        font-family: 'Oxygen';
        font-size: 14px;
        color: var(--text);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px 16px;
        resize: none;
        height: 72px;
        outline: none;
        line-height: 1.5;
        transition: border-color 0.15s ease;

        &::placeholder {
            color: var(--text-faint);
        }

        &:focus {
            border-color: var(--accent-dim);
        }
    }
}

.discover-generate-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 22px;
    border-radius: 10px;
    border: none;
    background: var(--success);
    color: #fff;
    font-family: 'Oxygen';
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    height: 72px;
    transition: opacity 0.15s ease;

    i {
        font-size: 15px;
    }

    &:hover:not(:disabled) {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
}

// ── Discover generation states ──────────────────────────────

@keyframes spin {
    to { transform: rotate(360deg); }
}

.spin {
    display: inline-block;
    animation: spin 0.8s linear infinite;
}

.phrase-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.phrase-fade-leave-active { transition: opacity 0.2s ease; }
.phrase-fade-enter-from   { opacity: 0; transform: translateY(5px); }
.phrase-fade-leave-to     { opacity: 0; }

.discover-results-area {
    min-height: 430px;
}

.chef-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    min-height: 430px;
}

.chef-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 260px;
}

.chef-phrase {
    font-family: 'Oxygen';
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
    min-height: 22px;
}

.chef-bar-wrap {
    width: 100%;
    height: 6px;
    background: var(--border);
    border-radius: 10px;
    overflow: hidden;
}

.chef-bar-fill {
    height: 100%;
    background: linear-gradient(to right, var(--accent-dim, #a0c0aa), var(--accent, #5a8a6a));
    border-radius: 10px;
    transition: width 0.25s ease;
}

.chef-pct {
    font-family: 'Oxygen';
    font-size: 12px;
    color: var(--text-faint);
    letter-spacing: 0.05em;
}

.discover-error {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Oxygen';
    font-size: 13px;
    color: var(--danger-accent);
    padding: 8px 0;
}

.discover-retry-btn {
    margin-left: 6px;
    padding: 2px 10px;
    border: 1px solid var(--danger-accent);
    border-radius: 20px;
    background: transparent;
    color: var(--danger-accent);
    font-family: 'Oxygen';
    font-size: 12px;
    cursor: pointer;

    &:hover { background: rgba(184, 64, 64, 0.08); }
}

.discover-icon-btn {
    margin-left: auto;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    color: var(--text-faint);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: background 0.15s, color 0.15s;

    &:hover:not(:disabled) {
        background: var(--surface2);
        color: var(--text);
    }

    &:disabled { opacity: 0.4; cursor: default; }
}


.pantry-search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;

    i { color: var(--text-faint); font-size: 13px; flex-shrink: 0; }

    input {
        flex: 1;
        border: none;
        background: transparent;
        font-family: 'Oxygen';
        font-size: 13px;
        color: var(--text);
        outline: none;

        &::placeholder { color: var(--text-faint); }
    }
}

.pantry-search-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-faint);
    font-size: 11px;
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.15s;

    &:hover { color: var(--text); }
}

.pantry-selected-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
}

.pantry-pick-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    font-family: 'Oxygen';
    font-size: 12px;
    cursor: pointer;
    color: var(--text-muted);
    transition: border-color 0.15s, background 0.15s, color 0.15s;
    user-select: none;

    i { font-size: 10px; }

    &.selected {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;

        &:hover { opacity: 0.85; }
    }
}

.pantry-accordion {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    max-height: 320px;
    overflow-y: auto;
}

.pantry-acc-group {
    border-bottom: 1px solid var(--border);

    &:last-child { border-bottom: none; }
}

.pantry-acc-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    background: var(--surface);
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover { background: var(--surface2); }

    i { font-size: 11px; color: var(--text-faint); flex-shrink: 0; }
}

.pantry-acc-cat-name {
    font-family: 'Oxygen';
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    flex: 1;
}

.pantry-acc-count {
    font-family: 'Oxygen';
    font-size: 11px;
    color: var(--text-faint);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1px 7px;
}

.pantry-acc-sel-badge {
    font-family: 'Oxygen';
    font-size: 11px;
    color: #fff;
    background: var(--accent);
    border-radius: 20px;
    padding: 1px 8px;
}

.pantry-acc-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 2px;
    padding: 6px 10px 8px;
    background: var(--bg);
}

.pantry-acc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 6px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Oxygen';
    font-size: 13px;
    color: var(--text-muted);
    transition: background 0.12s;
    user-select: none;

    &:hover { background: var(--surface); }

    input[type="checkbox"] {
        accent-color: var(--accent);
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        cursor: pointer;
    }
}

.pantry-two-col {
    display: grid;
    grid-template-columns: 560px 1fr;
    gap: 20px;
    align-items: start;
}

.pantry-toolbox {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.pantry-gen-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 8px 14px;
    border: 1.5px solid var(--success);
    border-radius: 8px;
    background: var(--success);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    transition: opacity 0.15s ease;
    opacity: 0.85;

    i { font-size: 13px; }

    &:hover:not(:disabled) { opacity: 1; }
    &:disabled { opacity: 0.35; cursor: default; }
}

.pantry-results {
    min-height: 420px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.pantry-recipe-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .recipe-book-card { width: 100%; }
}

.pantry-chef-loading {
    min-height: 420px;
}

.pantry-results-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--text-faint);
    text-align: center;
    padding: 40px 20px;

    i { font-size: 48px; opacity: 0.3; }

    p {
        font-family: 'Oxygen';
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
    }
}

.prompt-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: var(--text-faint);
    text-align: center;
    padding: 28px 20px 12px;

    i { font-size: 36px; opacity: 0.3; }

    p {
        font-family: 'Oxygen';
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
    }
}

.discover-empty-note {
    font-family: 'Oxygen';
    font-size: 13px;
    color: var(--text-faint);
    padding: 12px 14px;
}

// ── End discover generation states ──────────────────────────

.upload-photo-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    font-family: 'Oxygen';
    font-size: 13px;
    cursor: pointer;
    color: var(--text-muted);
    transition: background 0.15s ease, opacity 0.15s ease;

    &:hover {
        background: var(--bg);
    }

    &.uploading {
        opacity: 0.6;
        cursor: default;
        pointer-events: none;
    }
}

.save-recipe-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 18px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: 'Oxygen';
    font-size: 13px;
    cursor: pointer;
    color: var(--text-muted);
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

    i {
        font-size: 14px;
    }

    &:hover {
        background: var(--bg2);
    }

    &.saved-state {
        background: var(--text);
        color: var(--bg);
        border-color: var(--text);
    }
}

// ── Mobile overhaul ─────────────────────────────────────────
@media (max-width: 768px) {
    #recipes {
        margin-top: 0;
        padding: 0 12px 32px;
        border-radius: 0;
        box-shadow: none;
        overflow: visible;
    }

    // Flatten layout on mobile — sidebar hidden, wrappers transparent
    .recipe-layout {
        display: block;
    }

    .recipe-filter-sidebar {
        display: none;
    }

    .recipe-main {
        display: block;
        overflow: visible;
    }

    .recipe-toolbar {
        display: none;
    }

    .recipe-content {
        overflow: visible;
        padding: 0;
    }

    // List rows collapse to a compact mobile format
    .recipe-list-row {
        .row-description { display: none; }

        .row-photo {
            width: 70px;
            min-width: 70px;
            height: 70px;
        }

        .row-match-badge { display: none; }
    }

    .recipe-mobile-bar {
        display: flex;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border-subtle);
        margin-left: -12px;
        margin-right: -12px;
        width: calc(100% + 24px);
        margin-bottom: 14px;
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--bg);
    }

    .recipe-mode-flip {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .flip-label {
        font-family: 'Oxygen', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text);
    }

    .recipe-cat-filters {
        display: none;
    }

    .recipe-mobile-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
    }

    .recipe-icon-btn {
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--search-surface);
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
        transition: color 0.15s, background 0.15s;

        &:hover, &.has-filters { color: var(--sage); }
    }

    .filter-active-dot {
        position: absolute;
        top: 7px;
        right: 7px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--sage);
        pointer-events: none;
    }

    .pantry-two-col {
        grid-template-columns: 1fr;
    }

    .recently-saved {
        display: block;
        background: var(--surface);
        border-radius: 0;
        padding: 14px 0 16px;
        margin-left: -12px;
        margin-right: -12px;
        margin-bottom: 20px;

        .section-label {
            padding: 0 14px;
            margin-bottom: 10px;
        }

        .recipe-book-card {
            box-shadow: none;
            border-color: transparent;
        }
    }

    .recently-saved-scroll {
        display: flex;
        flex-direction: row;
        overflow-x: auto;
        gap: 12px;
        padding: 4px 14px 4px;
        scrollbar-width: none;
        &::-webkit-scrollbar { display: none; }
    }

    .book-cards-flat {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .recipe-book-card {
        height: auto;
        min-height: 230px;
        flex-shrink: 0;
        width: 160px;

        .card-photo {
            height: 180px;
        }

        .card-info {
            padding: 6px 10px 8px;
            gap: 2px;
        }

        .card-name {
            font-size: 17px;
        }

        .card-meta {
            font-size: 11px;
        }
    }

    .book-cards-flat .recipe-book-card {
        width: 100%;
        min-height: unset;
        height: auto;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        border-radius: 12px;

        .card-photo {
            width: 90px;
            min-width: 90px;
            height: auto;
            border-radius: 12px 0 0 12px;
            flex-shrink: 0;
        }

        .card-info {
            flex: 1;
            min-width: 0;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
        }

        .card-name {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card-meta { font-size: 12px; }
    }

    .discover-section-header {
        flex-wrap: wrap;
        gap: 8px;
    }

    .expiring-chips {
        flex-wrap: nowrap;
        overflow: hidden;
    }

    .discover-prompt-input {
        flex-direction: column;
        align-items: stretch;

        textarea {
            height: 80px;
        }
    }

    .discover-generate-btn {
        height: auto;
        padding: 12px 16px;
        justify-content: center;
    }

    .pantry-recipe-grid {
        grid-template-columns: 1fr;
    }

    // ── Discover: expiring refresh button ──
    .discover-section:first-child {
        position: relative;

        .discover-icon-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
            background: var(--sage);
            border-color: var(--sage);
            color: #fff;
            margin-left: 0;
            opacity: 1;

            &:disabled { opacity: 0.45; }
        }
    }

    // ── Discover: three distinct cards ──
    .discover-browse {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .discover-section,
    .discover-prompt-area {
        background: var(--surface);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 0;
        border: 1px solid var(--border);
    }

    .discover-section-title {
        font-size: 13px;
    }

    .discover-results-area {
        min-height: 0;
        margin-top: 12px;
    }

    .chef-loading {
        min-height: 100px;
        gap: 10px;
    }

    .pantry-results {
        min-height: 0;
        margin-top: 12px;
    }

    .pantry-chef-loading {
        min-height: 100px;
    }

    .pantry-results-empty {
        padding: 20px 10px;
        i { font-size: 28px; }
        p { font-size: 13px; }
    }

    .pantry-accordion {
        max-height: none;
        overflow-y: visible;
    }

    .discover-prompt-input {
        margin-top: 12px;

        textarea {
            background: color-mix(in srgb, var(--bg) 55%, var(--surface));
        }
    }

    .pantry-search-bar {
        background: color-mix(in srgb, var(--bg) 55%, var(--surface));
    }
}

// ── Recipe filter panel (Teleport'd to body, not scoped) ─────
.recipe-filter-overlay {
    position: fixed;
    inset: 0;
    z-index: 399;
    background: rgba(0, 0, 0, 0.35);
}

.recipe-filter-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 400;
    background: var(--bg);
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22);
    padding: 12px 20px 24px;
    max-height: 80vh;
    overflow-y: auto;
}

.recipe-filter-panel .filter-panel-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-subtle);
    margin: 0 auto 14px;
}

.recipe-filter-panel .filter-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
}

.recipe-filter-panel .filter-panel-title {
    font-family: 'Oxygen', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
}

.recipe-filter-panel .filter-panel-clear {
    background: none;
    border: none;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.78rem;
    color: var(--danger-accent);
    cursor: pointer;
    padding: 4px 8px;
    margin-left: auto;
    opacity: 0.8;
    &:hover { opacity: 1; }
}

.recipe-filter-panel .filter-panel-close {
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    line-height: 1;
}

.recipe-filter-panel .filter-panel-group { margin-bottom: 18px; }

.recipe-filter-panel .filter-panel-label {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.recipe-filter-panel .filter-panel-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.recipe-filter-panel .filter-chip {
    border: 1.5px solid var(--border-subtle);
    border-radius: 20px;
    padding: 6px 14px;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.88rem;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.recipe-filter-panel .filter-chip.active {
    background: var(--sage);
    border-color: var(--sage);
    color: #fff;
    font-weight: 600;
}

.recipe-filter-panel .filter-panel-done {
    width: 100%;
    margin-top: 4px;
    padding: 13px;
    border-radius: 12px;
    border: none;
    background: var(--sage);
    color: #fff;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
}

.filter-drop-enter-active { transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
.filter-drop-leave-active { animation: rfp-bounce-up 0.38s ease-in forwards; }
.filter-drop-enter-from   { transform: translateY(-110%); }

@keyframes rfp-bounce-up {
    0%   { transform: translateY(0); }
    22%  { transform: translateY(18px); }
    100% { transform: translateY(-110%); }
}

.filter-fade-enter-active,
.filter-fade-leave-active { transition: opacity 0.25s; }
.filter-fade-enter-from,
.filter-fade-leave-to     { opacity: 0; }
</style>

