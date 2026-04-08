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

        </div>

    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

.book-detail-view {
    padding: 4px 0;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-family: 'Oxygen';
    font-size: 13px;
    cursor: pointer;
    margin-bottom: 22px;
    transition: color 0.15s ease;

    &:hover {
        color: var(--text);
    }
}

// ── Book Detail — Recipe Card Style ──
.book-recipe-photo-full {
    width: 100%;
    height: 300px;
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .photo-placeholder-full {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        color: rgba(0, 0, 0, 0.25);

        i {
            font-size: 48px;
        }

        span {
            font-family: 'Oxygen';
            font-size: 13px;
            letter-spacing: 0.05em;
        }
    }

    background: var(--surface2);
}

.book-detail-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0 20px;
}

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
    transition: background 0.15s ease;

    &:hover {
        background: var(--bg);
    }
}

.book-recipe-card-content {
    background: var(--bg);
    border-radius: 0 0 16px 16px;
    border: 1px solid var(--border);
    border-top: none;
    padding: 32px 40px 40px;
}

.book-recipe-card-header {
    text-align: center;
    margin-bottom: 20px;
}

.recipe-card-title {
    font-family: 'Oxygen';
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text);
    margin-bottom: 12px;
}

.recipe-card-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 14px;
    font-family: 'Oxygen';
    font-size: 14px;
    letter-spacing: 0.08em;
    color: var(--text-faint);
    margin-bottom: 14px;

    .stat-divider {
        color: var(--border);
    }
}

.recipe-card-desc {
    font-family: 'Oxygen';
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.65;
    max-width: 560px;
    margin: 0 auto 16px;
}

.book-recipe-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;

    .tag {
        font-size: 11px;
        padding: 3px 11px;
        border-radius: 20px;
        background: var(--surface);
        color: var(--text-faint);
        border: 1px solid var(--border);
    }
}

.recipe-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
}

.recipe-card-columns {
    display: grid;
    grid-template-columns: 1fr 1px 1.5fr;
    gap: 0 36px;
    margin-bottom: 28px;
}

.recipe-card-divider {
    background: var(--border);
}

.recipe-col-title {
    font-family: 'Georgia', serif;
    font-size: 26px;
    font-style: italic;
    font-weight: 400;
    color: var(--text);
    margin-bottom: 16px;
}

.ingredient-row {
    display: flex;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-family: 'Oxygen';
    font-size: 15px;
    align-items: center;

    .ing-qty {
        min-width: 80px;
        color: var(--text-faint);
        flex-shrink: 0;
    }

    .ing-name {
        color: var(--text);
        flex: 1;
    }

    .ing-in-pantry {
        margin-left: auto;
        color: #7d9e8b;
        font-size: 14px;
        flex-shrink: 0;
    }

    .ing-on-list {
        margin-left: auto;
        color: #8a9aae;
        font-size: 14px;
        flex-shrink: 0;

        &.just-added {
            animation: ing-pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
    }
}

@keyframes ing-pop-in {
    from {
        opacity: 0;
        transform: scale(0.4);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.add-to-grocery-wrap {
    margin-top: 16px;
}

.add-to-grocery-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 22px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: 'Oxygen';
    font-size: 14px;
    cursor: pointer;
    color: var(--text-muted);
    transition: background 0.15s ease;

    i {
        font-size: 16px;
    }

    &:hover {
        background: var(--bg2);
    }
}

.direction-row {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    font-family: 'Oxygen';
    font-size: 15px;

    .step-num {
        font-weight: 700;
        color: var(--text);
        flex-shrink: 0;
    }

    .step-text {
        color: var(--text-muted);
        line-height: 1.6;
    }
}

.book-recipe-notes {
    margin-top: 28px;
    padding: 16px 18px;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);

    h4 {
        font-family: 'Oxygen';
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-faint);
        margin-bottom: 8px;
        font-weight: 700;
    }

    p {
        font-size: 15px;
        color: var(--text-muted);
        font-family: 'Oxygen';
        line-height: 1.6;
    }
}
</style>
