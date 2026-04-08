<script>
import RecipeAddModal from './RecipeAddModal.vue';
import RecipeImportModal from './RecipeImportModal.vue';
import RecipeDetail from './RecipeDetail.vue';

export default {
    name: 'Recipes',

    components: { RecipeAddModal, RecipeImportModal, RecipeDetail },

    props: {
        recipes:               { type: Array, required: true },
        recipeCategories:      { type: Array, required: true },
        pantryProducts:        { type: Array, required: true },
        shoppingList:          { type: Array, required: true },
        restockShoppingList:   { type: Array, required: true },
        newlyAddedIngredients: { type: Array, required: true },
    },

    emits: ['add-recipe-to-grocery'],

    data() {
        return {
            recipeMode:                 'book',
            recipeIndicatorStyle:       {},
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
            generatedRecipes: [
                {
                    id: 'g1',
                    name: 'Apple Yogurt Parfait',
                    description: 'A quick layered parfait using fresh apple slices and creamy yogurt from your fridge.',
                    tags: ['quick', 'no-cook', 'breakfast'],
                    prepTime: 5, cookTime: 0, servings: 1, savedToBook: false,
                    categories: ['Breakfast', 'Quick'], source: 'ai',
                    ingredients: [
                        { name: 'Yogurt', qty: 1, unit: 'cup', category: 'Dairy' },
                        { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
                        { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
                        { name: 'Granola', qty: 0.25, unit: 'cup', category: 'Grains' },
                    ],
                    instructions: [
                        'Core and dice the apple into small cubes.',
                        'Spoon half the yogurt into a bowl or glass.',
                        'Add a layer of diced apple and granola.',
                        'Repeat with remaining yogurt and toppings.',
                        'Drizzle with honey and serve.',
                    ],
                },
                {
                    id: 'g2',
                    name: 'Honey Garlic Chicken Skillet',
                    description: 'Quick pan-seared chicken glazed with honey and garlic — great way to use up chicken before it turns.',
                    tags: ['chicken', 'quick', 'savory'],
                    prepTime: 5, cookTime: 20, servings: 2, savedToBook: false,
                    categories: ['Dinner', 'Meat', 'Quick'], source: 'ai',
                    ingredients: [
                        { name: 'Chicken', qty: 1, unit: 'lb', category: 'Meat' },
                        { name: 'Garlic', qty: 3, unit: 'cloves', category: 'Produce' },
                        { name: 'Honey', qty: 2, unit: 'tbsp', category: 'Misc' },
                        { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
                        { name: 'Soy Sauce', qty: 1, unit: 'tbsp', category: 'Misc' },
                    ],
                    instructions: [
                        'Season chicken with salt and pepper.',
                        'Sear in a hot skillet over medium-high heat, 6 minutes per side. Set aside.',
                        'Melt butter in the same pan, add minced garlic and cook 1 minute.',
                        'Stir in honey and soy sauce, simmer 2 minutes.',
                        'Return chicken to pan, coat in glaze, and serve.',
                    ],
                },
                {
                    id: 'g3',
                    name: 'Strawberry French Toast',
                    description: 'Classic French toast topped with fresh strawberries — uses up both the bread and berries expiring soon.',
                    tags: ['breakfast', 'quick', 'strawberry'],
                    prepTime: 5, cookTime: 10, servings: 2, savedToBook: false,
                    categories: ['Breakfast', 'Quick'], source: 'ai',
                    ingredients: [
                        { name: 'Bread', qty: 4, unit: 'slices', category: 'Grains' },
                        { name: 'Milk', qty: 0.25, unit: 'cup', category: 'Dairy' },
                        { name: 'Eggs', qty: 2, unit: 'whole', category: 'Dairy' },
                        { name: 'Strawberries', qty: 0.5, unit: 'cup', category: 'Produce' },
                        { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
                    ],
                    instructions: [
                        'Whisk eggs and milk together in a shallow bowl.',
                        'Melt butter in a skillet over medium heat.',
                        'Dip each bread slice in the egg mixture and cook 2–3 minutes per side until golden.',
                        'Slice strawberries and layer on top of the toast.',
                        'Serve warm with maple syrup or a dusting of powdered sugar.',
                    ],
                },
                {
                    id: 'g4',
                    name: 'Creamy Milk & Apple Oatmeal',
                    description: 'Warm oatmeal cooked in milk with sautéed apple — uses up the milk and apples before they go.',
                    tags: ['breakfast', 'quick', 'apple'],
                    prepTime: 3, cookTime: 8, servings: 1, savedToBook: false,
                    categories: ['Breakfast', 'Quick'], source: 'ai',
                    ingredients: [
                        { name: 'Milk', qty: 1, unit: 'cup', category: 'Dairy' },
                        { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
                        { name: 'Oats', qty: 0.5, unit: 'cup', category: 'Grains' },
                        { name: 'Cinnamon', qty: 0.25, unit: 'tsp', category: 'Misc' },
                        { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
                    ],
                    instructions: [
                        'Dice the apple into small cubes.',
                        'Combine oats and milk in a small saucepan over medium heat.',
                        'Cook, stirring, until thickened — about 5 minutes.',
                        'Stir in apple, cinnamon, and honey.',
                        'Cook 2 more minutes and serve warm.',
                    ],
                },
            ],
        };
    },

    watch: {
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
    },

    computed: {
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
            const today = new Date();
            const seen = new Set();
            const items = [];
            this.pantryProducts.forEach(p => {
                p.batch.forEach(b => {
                    const daysUntil = Math.ceil((b.expiration - today) / (1000 * 60 * 60 * 24));
                    if (daysUntil <= 7 && !seen.has(b.name)) {
                        seen.add(b.name);
                        items.push({ name: b.name, daysUntil });
                    }
                });
            });
            return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
        },
    },

    methods: {
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

        toggleRecipeCategoryFilter(cat) {
            const idx = this.selectedRecipeCategories.indexOf(cat);
            if (idx === -1) this.selectedRecipeCategories.push(cat);
            else this.selectedRecipeCategories.splice(idx, 1);
            this.recipePage = 1;
        },

        addRecipeCategory(name) {
            if (name && !this.recipeCategories.includes(name)) {
                this.recipeCategories.push(name);
            }
        },

        deleteRecipeCategory(cat) {
            const idx = this.recipeCategories.indexOf(cat);
            if (idx !== -1) this.recipeCategories.splice(idx, 1);
            const si = this.selectedRecipeCategories.indexOf(cat);
            if (si !== -1) this.selectedRecipeCategories.splice(si, 1);
        },

        addCustomRecipeCategory() {
            const name = this.newRecipeCategoryName.trim();
            if (!name) return;
            this.addRecipeCategory(name);
            this.newRecipeCategoryName = '';
            this.showAddRecipeCategoryInput = false;
        },

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

        cancelRenameCat() {
            this.editingRecipeCat = null;
            this.editingRecipeCatName = '';
        },

        submitNewRecipe({ name, description, servings, prepTime, cookTime, categories, ingredients, steps }) {
            (categories || []).forEach(cat => this.addRecipeCategory(cat));
            this.recipes.add({ name, description, servings, prepTime, cookTime, categories, ingredients, instructions: steps ?? [] });
            const newRecipe = this.recipes[this.recipes.length - 1];
            this.recipeMode = 'book';
            this.selectedBookRecipe = newRecipe;
        },

        saveToBook(recipe) {
            if (recipe.savedToBook) return;
            const { savedToBook, ...recipeData } = recipe;
            (recipeData.categories || []).forEach(cat => this.addRecipeCategory(cat));
            this.recipes.add(recipeData);
            recipe.savedToBook = true;
        },

        isIngredientInPantry(name) {
            return this.pantryProducts.hasIngredient(name);
        },

        isIngredientOnShoppingList(name) {
            const key = name.trim().toLowerCase();
            return [...this.shoppingList, ...this.restockShoppingList]
                .some(p => p.name.trim().toLowerCase() === key);
        },

        updateRecipeIndicator() {
            const toggle = this.$el.querySelector('.recipe-mode-toggle');
            const activeBtn = toggle?.querySelector('button.active');
            if (!toggle || !activeBtn) return;
            const toggleRect = toggle.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const w = btnRect.width * 0.5;
            const left = (btnRect.left - toggleRect.left) + (btnRect.width - w) / 2;
            this.recipeIndicatorStyle = { left: left + 'px', width: w + 'px' };
        },
    },

    watch: {
        recipeMode() {
            this.$nextTick(() => this.updateRecipeIndicator());
        },
    },

    mounted() {
        this.$nextTick(() => this.updateRecipeIndicator());
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <section class="tab-pane show fade active" id="recipes" role="tabpanel" aria-labelledby="recipes-tab">

        <!-- Mode Toggle -->
        <div class="recipe-mode-toggle">
            <button :class="{ active: recipeMode === 'book' }"
                @click="recipeMode = 'book'; selectedBookRecipe = null">
                <span>Recipe Book</span>
            </button>
            <button :class="{ active: recipeMode === 'discover' }" @click="recipeMode = 'discover'">
                <span>Discover</span>
            </button>
            <span class="recipe-mode-indicator" :style="recipeIndicatorStyle"></span>
        </div>

        <!-- ── BOOK / DISCOVER MODE ── -->
        <transition name="tab-fade" mode="out-in">
            <div v-if="recipeMode === 'book'" key="book" class="recipe-book">

                <!-- Book Detail View -->
                <recipe-detail v-if="selectedBookRecipe"
                    :recipe="selectedBookRecipe"
                    :is-ingredient-in-pantry="isIngredientInPantry"
                    :is-ingredient-on-shopping-list="isIngredientOnShoppingList"
                    :newly-added-ingredients="newlyAddedIngredients"
                    :card-style="recipeCardStyle(selectedBookRecipe)"
                    back-label="Back to Book"
                    :show-tags="true"
                    @back="selectedBookRecipe = null"
                    @add-to-grocery="$emit('add-recipe-to-grocery', $event)">
                    <template #actions>
                        <label class="upload-photo-btn">
                            <i class="bi bi-camera"></i> Upload Photo
                            <input type="file" accept="image/*" style="display:none">
                        </label>
                    </template>
                </recipe-detail>

                <!-- Book Main View -->
                <div v-else class="book-main-view">

                    <div class="recipe-book-actions">
                        <button class="recipe-action-btn first-btn" @click="showAddRecipeModal = true">
                            <i class="bi bi-plus-lg"></i> <span>New Recipe</span>
                        </button>
                        <button class="recipe-action-btn" @click="showImportUrlModal = true">
                            <i class="bi bi-link-45deg"></i> <span>Import URL</span>
                        </button>
                        <div class="recipe-book-search">
                            <i class="bi bi-search"></i>
                            <input type="text" placeholder="Search your recipes..." v-model="recipeBookSearch">
                        </div>
                    </div>

                    <!-- Search results -->
                    <div v-if="recipeBookSearch" class="book-search-results">
                        <p class="search-label">Results for "{{ recipeBookSearch }}"</p>
                        <div class="book-cards-row">
                            <div class="recipe-book-card" v-for="(recipe, index) in filteredBookRecipes"
                                :key="recipe.id" :style="{ '--i': index }" @click="selectedBookRecipe = recipe">
                                <div class="card-photo" :style="recipeCardStyle(recipe)">
                                    <img v-if="recipe.photo" :src="recipe.photo" :alt="recipe.name">
                                    <div v-else class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                                    <span v-if="recipe.categories && recipe.categories.length" class="meal-type-pill">{{ recipe.categories[0] }}</span>
                                </div>
                                <div class="card-info">
                                    <span class="card-name">{{ recipe.name }}</span>
                                    <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                                </div>
                            </div>
                            <p v-if="filteredBookRecipes.length === 0" class="empty-msg">No saved recipes match "{{ recipeBookSearch }}"</p>
                        </div>
                    </div>

                    <!-- Recently Saved -->
                    <div v-if="!recipeBookSearch && recentlySaved.length > 0" class="recently-saved">
                        <h4 class="section-label">Recently Saved</h4>
                        <div class="recently-saved-scroll">
                            <div class="recipe-book-card" v-for="(recipe, index) in recentlySaved"
                                :key="recipe.id" :style="{ '--i': index }" @click="selectedBookRecipe = recipe">
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

                    <!-- Empty state -->
                    <div v-if="!recipeBookSearch && recipes.length === 0" class="book-empty">
                        <i class="bi bi-journal-text"></i>
                        <p>No recipes saved yet.</p>
                        <p>Save a recipe from Discover, or add one from scratch.</p>
                    </div>

                    <!-- Category Filters -->
                    <div v-if="!recipeBookSearch" class="recipe-cat-filters">
                        <template v-if="!managingRecipeCats">
                            <button v-for="cat in recipeCategories" :key="cat" class="recipe-cat-chip"
                                :class="{ active: selectedRecipeCategories.includes(cat) }"
                                @click="toggleRecipeCategoryFilter(cat)">{{ cat }}</button>
                            <button v-if="!showAddRecipeCategoryInput" class="recipe-cat-chip add-cat-chip"
                                @click="showAddRecipeCategoryInput = true">
                                <i class="bi bi-plus"></i>
                            </button>
                            <div v-else class="recipe-cat-add-input">
                                <input type="text" v-model="newRecipeCategoryName" placeholder="New category..."
                                    @keyup.enter="addCustomRecipeCategory"
                                    @keyup.escape="showAddRecipeCategoryInput = false; newRecipeCategoryName = ''">
                                <button @click="addCustomRecipeCategory"><i class="bi bi-check2"></i></button>
                                <button @click="showAddRecipeCategoryInput = false; newRecipeCategoryName = ''"><i class="bi bi-x-lg"></i></button>
                            </div>
                            <button class="recipe-cat-chip manage-cats-btn" @click="managingRecipeCats = true" title="Edit categories">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </template>

                        <template v-else>
                            <template v-for="(cat, i) in recipeCategories" :key="cat">
                                <div v-if="editingRecipeCat === i" class="recipe-cat-add-input">
                                    <input type="text" v-model="editingRecipeCatName"
                                        @keyup.enter="saveRenameCat" @keyup.escape="cancelRenameCat">
                                    <button @click="saveRenameCat"><i class="bi bi-check2"></i></button>
                                    <button @click="cancelRenameCat"><i class="bi bi-x-lg"></i></button>
                                </div>
                                <span v-else class="recipe-cat-chip manage-chip" @click="deleteRecipeCategory(cat)">
                                    <span class="manage-chip-name">{{ cat }}</span>
                                    <button class="chip-del">&times;</button>
                                </span>
                            </template>
                            <button class="recipe-cat-chip manage-cats-btn done-btn"
                                @click="managingRecipeCats = false; cancelRenameCat()">Done</button>
                        </template>
                    </div>

                    <!-- Recipe grid -->
                    <div v-if="!recipeBookSearch" ref="recipeGrid" class="book-cards-flat">
                        <div class="recipe-book-card" v-for="(recipe, index) in paginatedBookRecipes"
                            :key="recipe.id" :style="{ '--i': index }" @click="selectedBookRecipe = recipe">
                            <div class="card-photo" :style="recipeCardStyle(recipe)">
                                <img v-if="recipe.photo" :src="recipe.photo" :alt="recipe.name">
                                <div v-else class="card-photo-placeholder"><i class="bi bi-journal-richtext"></i></div>
                            </div>
                            <div class="card-info">
                                <span class="card-name">{{ recipe.name }}</span>
                                <span class="card-meta">{{ recipe.prepTime + recipe.cookTime }} min · {{ recipe.servings }} servings</span>
                            </div>
                        </div>
                        <p v-if="paginatedBookRecipes.length === 0" class="empty-msg">No saved recipes match your filters.</p>
                    </div>

                    <!-- Pagination -->
                    <div v-if="!recipeBookSearch && recipePageCount > 1" class="recipe-pagination">
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

                <!-- Detail view when recipe selected -->
                <recipe-detail v-if="selectedDiscoverRecipe"
                    :recipe="selectedDiscoverRecipe"
                    :is-ingredient-in-pantry="isIngredientInPantry"
                    :is-ingredient-on-shopping-list="isIngredientOnShoppingList"
                    :newly-added-ingredients="newlyAddedIngredients"
                    :card-style="recipeCardStyle(selectedDiscoverRecipe)"
                    back-label="Back to Discover"
                    :show-tags="false"
                    @back="selectedDiscoverRecipe = null"
                    @add-to-grocery="$emit('add-recipe-to-grocery', $event)">
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

                <!-- Browse view -->
                <div v-else class="discover-browse">

                    <div v-if="expiringPantryItems.length" class="discover-section">
                        <div class="discover-section-header">
                            <span class="discover-section-title">Using what's expiring</span>
                            <div class="expiring-chips">
                                <span class="expiring-chip" v-for="item in expiringPantryItems" :key="item.name">{{ item.name }}</span>
                            </div>
                        </div>
                        <div class="recently-saved-scroll">
                            <div class="recipe-book-card" v-for="(recipe, index) in generatedRecipes.slice(0, 6)"
                                :key="recipe.id" :style="{ '--i': index }" @click="selectedDiscoverRecipe = recipe">
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

                    <div class="discover-prompt-area">
                        <div class="discover-section-header">
                            <span class="discover-section-title">Ask for a recipe</span>
                        </div>
                        <div class="discover-prompt-input">
                            <textarea v-model="discoverPrompt"
                                placeholder="e.g. something quick with chicken, or a cozy soup for tonight..."></textarea>
                            <button class="discover-generate-btn">
                                <i class="bi bi-stars"></i> Generate
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </transition>

        <!-- Modals (position:fixed, DOM position irrelevant) -->
        <recipe-add-modal v-if="showAddRecipeModal" :show="showAddRecipeModal" :recipe-categories="recipeCategories"
            @close="showAddRecipeModal = false"
            @submit="submitNewRecipe"
            @add-category="addRecipeCategory" />
        <recipe-import-modal v-if="showImportUrlModal" :show="showImportUrlModal"
            @close="showImportUrlModal = false"
            @import="showImportUrlModal = false" />

    </section>
</template>

<style lang="scss" scoped>

@use "@/assets/variables" as *;

// ── Recipes tab card wrapper ────────────────────────────────
#recipes {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    padding: 30px;
    background-color: var(--bg);
    border-radius: 15px;
}

// ── Internal sub-nav ────────────────────────────────────────
.recipe-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 20px;
    position: relative;
    border-bottom: 1px solid transparent;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 2%;
        right: 2%;
        height: 1px;
        background: linear-gradient(to right, transparent, rgb(197, 197, 197), transparent);
    }

    button {
        display: flex;
        align-items: center;
        padding: 8px 28px;
        border: none;
        background: transparent;
        font-family: 'Quicksand', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        cursor: pointer;
        color: var(--text-faint);
        transition: color 0.15s ease;

        &.active {
            color: var(--text);
        }

        &:not(.active):hover {
            color: var(--text-muted);
        }
    }

    .recipe-mode-indicator {
        position: absolute;
        bottom: 0;
        height: 3px;
        border-radius: 10px;
        transition: left 0.3s ease, width 0.3s ease;
        background: var(--border-subtle);
        z-index: 3;
    }
}

.recipe-book,
.discover-view {
    position: relative;
}

.discover-view {
    padding: 10px 0 0;
}

.recipe-book-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

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

.first-btn {
    margin-left: auto;
    background: var(--add-button-bg-light);
    border-color: var(--add-button-bg-light);
}

.recipe-book-search {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 180px;
    max-width: 300px;
    background: rgb(233, 231, 231);
    border: none;
    border-radius: 50px;
    padding: 10px 18px;

    i {
        color: var(--text-faint);
        font-size: 13px;
        flex-shrink: 0;
    }

    input {
        border: none;
        background: transparent;
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        color: var(--text);
        width: 100%;
        outline: none;

        &::placeholder {
            color: var(--text-faint);
        }
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
    box-shadow: var(--box-shadow);
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

.recently-saved {
    margin-bottom: 24px;
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
    gap: 16px;
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
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: var(--text-faint);
}

.expiring-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.expiring-chip {
    font-family: 'Oxygen';
    font-size: 15px;
    padding: 2px 10px;
    border-radius: 20px;
    background: rgba(240, 144, 58, 0.12);
    color: rgba(180, 90, 10, 0.85);
    border: 1px solid rgba(240, 144, 58, 0.3);
}

.discover-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;

    .recipe-book-card {
        width: 100%;
    }
}

.discover-prompt-area {
    margin-bottom: 28px;
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
    background: var(--text);
    color: var(--bg);
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

    &:hover {
        opacity: 0.85;
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
</style>
