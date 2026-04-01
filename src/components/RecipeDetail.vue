<script>
export default {
    name: 'RecipeDetail',

    props: {
        recipe:                     { type: Object,   required: true },
        isIngredientInPantry:       { type: Function, required: true },
        isIngredientOnShoppingList: { type: Function, required: true },
        newlyAddedIngredients:      { type: Array,    required: true },
        cardStyle:                  { type: Object,   default: () => ({}) },
        backLabel:                  { type: String,   default: 'Back' },
        showTags:                   { type: Boolean,  default: true },
    },

    emits: ['back', 'add-to-grocery'],
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div class="book-detail-view">

        <div class="book-recipe-photo-full" :style="cardStyle">
            <img v-if="recipe.photo" :src="recipe.photo" :alt="recipe.name">
            <div v-else class="photo-placeholder-full">
                <i class="bi bi-image"></i>
                <span>No photo yet</span>
            </div>
        </div>

        <div class="book-detail-action-bar">
            <button class="back-btn" @click="$emit('back')">
                <i class="bi bi-arrow-left"></i> {{ backLabel }}
            </button>
            <slot name="actions"></slot>
        </div>

        <div class="book-recipe-card-content">
            <div class="book-recipe-card-header">
                <h1 class="recipe-card-title">{{ recipe.name }}</h1>
                <div class="recipe-card-stats">
                    <span>SERVES: {{ recipe.servings }}</span>
                    <span class="stat-divider">|</span>
                    <span>PREP TIME: {{ recipe.prepTime }}M</span>
                    <span class="stat-divider">|</span>
                    <span>COOK TIME: {{ recipe.cookTime }}M</span>
                </div>
                <p v-if="recipe.description" class="recipe-card-desc">{{ recipe.description }}</p>
                <div v-if="showTags && recipe.categories && recipe.categories.length" class="book-recipe-tags">
                    <span v-for="cat in recipe.categories" :key="cat" class="tag">{{ cat }}</span>
                </div>
            </div>

            <hr class="recipe-divider">

            <div class="recipe-card-columns">
                <div class="recipe-card-ingredients">
                    <h3 class="recipe-col-title">Ingredients</h3>
                    <div class="ingredient-row" v-for="ingredient in recipe.ingredients" :key="ingredient.name">
                        <span class="ing-qty">{{ ingredient.qty }} {{ ingredient.unit }}</span>
                        <span class="ing-name">{{ ingredient.name }}</span>
                        <i class="bi bi-check-circle-fill ing-in-pantry" v-if="isIngredientInPantry(ingredient.name)"></i>
                        <i class="bi bi-cart-fill ing-on-list"
                            v-else-if="isIngredientOnShoppingList(ingredient.name)"
                            :class="{ 'just-added': newlyAddedIngredients.includes(ingredient.name) }"
                            :style="newlyAddedIngredients.includes(ingredient.name) ? { animationDelay: newlyAddedIngredients.indexOf(ingredient.name) * 150 + 'ms' } : {}">
                        </i>
                    </div>
                    <div class="add-to-grocery-wrap">
                        <button class="add-to-grocery-btn" @click="$emit('add-to-grocery', recipe)">
                            <i class="bi bi-cart-plus"></i> Add to My Grocery List
                        </button>
                    </div>
                </div>

                <div class="recipe-card-divider"></div>

                <div class="recipe-card-directions">
                    <h3 class="recipe-col-title">Directions</h3>
                    <div class="direction-row" v-for="(step, i) in recipe.instructions" :key="i">
                        <span class="step-num">{{ i + 1 }}.</span>
                        <span class="step-text">{{ step }}</span>
                    </div>
                </div>
            </div>

            <div v-if="recipe.notes" class="book-recipe-notes">
                <h4>Notes</h4>
                <p>{{ recipe.notes }}</p>
            </div>
        </div>

    </div>
</template>

<style scoped></style>
