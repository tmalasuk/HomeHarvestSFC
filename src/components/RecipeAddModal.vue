<script>
export default {
    name: "RecipeAddModal",

    emits: ['close', 'submit', 'add-category'],

    props: {
        show: { type: Boolean, required: true },
        recipeCategories: { type: Array, required: true },
    },

    data() {
        return {
            fillActive: false,
            closing: false,
            screen: 1,
            slideDir: 'forward',
            nameError: false,
            // screen 1
            name: '',
            description: '',
            servings: 2,
            prepTime: 10,
            cookTime: 20,
            // screen 2
            selectedCategories: [],
            catSearch: '',
            newCat: '',
            // screen 3
            ingredients: [],
            newIngName: '',
            newIngQty: '',
            newIngUnit: '',
            // screen 4
            steps: [],
            newStep: '',
        };
    },

    computed: {
        filteredCategories() {
            const q = this.catSearch.trim().toLowerCase();
            if (!q) return this.recipeCategories;
            return this.recipeCategories.filter(c => c.toLowerCase().includes(q));
        },
        slideTransition() {
            return this.slideDir === 'forward' ? 'recipe-screen' : 'recipe-screen-back';
        },
    },

    methods: {
        handleClose() {
            if (this.closing) return;
            this.closing = true;
            setTimeout(() => {
                this.$emit('close');
            }, 280);
        },

        resetForm() {
            this.screen = 1;
            this.slideDir = 'forward';
            this.nameError = false;
            this.name = '';
            this.description = '';
            this.servings = 2;
            this.prepTime = 10;
            this.cookTime = 20;
            this.selectedCategories = [];
            this.catSearch = '';
            this.newCat = '';
            this.ingredients = [];
            this.newIngName = '';
            this.newIngQty = '';
            this.newIngUnit = '';
            this.steps = [];
            this.newStep = '';
        },

        goTo(n) {
            this.slideDir = n > this.screen ? 'forward' : 'back';
            this.screen = n;
        },

        goToCategories() {
            if (!this.name.trim()) {
                this.nameError = true;
                setTimeout(() => { this.nameError = false; }, 700);
                return;
            }
            this.goTo(2);
        },

        toggleCategory(cat) {
            const idx = this.selectedCategories.indexOf(cat);
            if (idx === -1) this.selectedCategories.push(cat);
            else this.selectedCategories.splice(idx, 1);
        },

        addCategory() {
            const name = this.newCat.trim();
            if (!name) return;
            this.$emit('add-category', name);
            if (!this.selectedCategories.includes(name)) {
                this.selectedCategories.push(name);
            }
            this.newCat = '';
        },

        addIngredient() {
            const name = this.newIngName.trim();
            if (!name) return;
            this.ingredients.push({
                name,
                qty: this.newIngQty !== '' ? Number(this.newIngQty) : '',
                unit: this.newIngUnit.trim(),
            });
            this.newIngName = '';
            this.newIngQty = '';
            this.newIngUnit = '';
        },

        removeIngredient(i) {
            this.ingredients.splice(i, 1);
        },

        addStep() {
            const t = this.newStep.trim();
            if (!t) return;
            this.steps.push(t);
            this.newStep = '';
        },

        removeStep(i) {
            this.steps.splice(i, 1);
        },

        handleSubmit() {
            if (!this.name.trim()) return;
            this.$emit('submit', {
                name: this.name.trim(),
                description: this.description.trim(),
                servings: this.servings,
                prepTime: this.prepTime,
                cookTime: this.cookTime,
                categories: [...this.selectedCategories],
                ingredients: [...this.ingredients],
                steps: [...this.steps],
            });
            setTimeout(() => this.handleClose(), 150);
        },
    },

    watch: {
        show: {
          immediate: true,
          handler(val) {
            if (val) {
                this.$nextTick(() => {
                    setTimeout(() => {
                        const rect = this.$refs.svgRect;
                        if (rect) {
                            const len = Math.ceil(rect.getTotalLength()) + 2;
                            rect.style.strokeDasharray = len;
                            rect.style.strokeDashoffset = len;
                            void rect.getBoundingClientRect();
                            rect.style.animation = 'sketch-in 0.7s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards';
                        }
                        this._fillTimer = setTimeout(() => {
                            this.fillActive = true;
                            const r = this.$refs.svgRect;
                            if (r) {
                                r.style.strokeDasharray = '10000';
                                r.style.strokeDashoffset = '0';
                            }
                        }, 700);
                    }, 300);
                });
            } else {
                this.resetForm();
                this.closing = false;
                this.fillActive = false;
                clearTimeout(this._fillTimer);
                const rect = this.$refs.svgRect;
                if (rect) {
                    rect.style.animation = 'none';
                    rect.style.strokeDasharray = '';
                    rect.style.strokeDashoffset = '';
                }
            }
          },
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <teleport to="body">
    <div class="modal-backdrop" :class="{ show: show }"></div>
    <div class="add-recipe-container" :class="{ show: show, 'fill-active': fillActive, closing: closing }">
        <svg class="modal-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect class="modal-svg-rect" ref="svgRect" x="0" y="0" width="100%" height="100%" rx="18" ry="18"
                fill="none" stroke="white" stroke-width="6"
                stroke-dasharray="9999" stroke-dashoffset="9999"/>
        </svg>
        <span class="close-x" @click="handleClose">&times;</span>
        <div class="add-recipe-body">

            <transition :name="slideTransition" mode="out-in">

                <!-- ── SCREEN 1: Info ── -->
                <div v-if="screen === 1" key="s1" class="recipe-screen">
                    <h3 class="add-recipe-title">New Recipe <span class="screen-indicator">1 / 4</span></h3>

                    <label>Name</label>
                    <input type="text" v-model="name" :class="{ 'input-error': nameError }" placeholder="Recipe name" />

                    <div class="recipe-time-row">
                        <div>
                            <label>Servings</label>
                            <input type="number" v-model.number="servings" min="1" />
                        </div>
                        <div>
                            <label>Prep (min)</label>
                            <input type="number" v-model.number="prepTime" min="0" />
                        </div>
                        <div>
                            <label>Cook (min)</label>
                            <input type="number" v-model.number="cookTime" min="0" />
                        </div>
                    </div>

                    <label>Description</label>
                    <textarea v-model="description" placeholder="Optional..." rows="2"></textarea>

                    <div class="recipe-screen-nav">
                        <button class="btn" type="button" @click="goToCategories">
                            <span>Next</span><i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- ── SCREEN 2: Categories ── -->
                <div v-else-if="screen === 2" key="s2" class="recipe-screen cat-screen">
                    <h3 class="add-recipe-title">Categories <span class="screen-indicator">2 / 4</span></h3>

                    <div class="cat-search-row">
                        <i class="bi bi-search cat-search-icon"></i>
                        <input type="text" class="cat-search" v-model="catSearch" placeholder="Search categories..." />
                    </div>

                    <div class="recipe-chips-scroll">
                        <div class="recipe-modal-cats">
                            <button type="button" v-for="cat in filteredCategories" :key="cat"
                                class="recipe-modal-chip"
                                :class="{ active: selectedCategories.includes(cat) }"
                                @click="toggleCategory(cat)">{{ cat }}</button>
                            <p v-if="filteredCategories.length === 0" class="cats-no-results">No matches for "{{ catSearch }}"</p>
                        </div>
                    </div>

                    <div class="cat-add-row">
                        <input type="text" v-model="newCat" placeholder="New category..." @keydown.enter.prevent="addCategory" />
                        <button type="button" class="step-add-btn" @click="addCategory">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>

                    <div class="recipe-screen-nav two-btns">
                        <button class="btn btn-back" type="button" @click="goTo(1)">
                            <i class="bi bi-arrow-left"></i><span> Back</span>
                        </button>
                        <button class="btn" type="button" @click="goTo(3)">
                            <span>Next</span><i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- ── SCREEN 3: Ingredients ── -->
                <div v-else-if="screen === 3" key="s3" class="recipe-screen">
                    <h3 class="add-recipe-title">Ingredients <span class="screen-indicator">3 / 4</span></h3>

                    <ul class="ing-list" v-if="ingredients.length">
                        <li v-for="(ing, i) in ingredients" :key="i" class="ing-item">
                            <span class="ing-qty-unit">{{ ing.qty }}{{ ing.unit ? ' ' + ing.unit : '' }}</span>
                            <span class="ing-name">{{ ing.name }}</span>
                            <button type="button" class="step-remove" @click="removeIngredient(i)">&times;</button>
                        </li>
                    </ul>
                    <p v-else class="steps-empty">No ingredients yet — add one below.</p>

                    <div class="ing-add-row">
                        <input type="number" v-model="newIngQty" placeholder="Qty" min="0" class="ing-input-qty" />
                        <input type="text" v-model="newIngUnit" placeholder="Unit" class="ing-input-unit" />
                        <input type="text" v-model="newIngName" placeholder="Ingredient" class="ing-input-name"
                            @keydown.enter.prevent="addIngredient" />
                        <button type="button" class="step-add-btn" @click="addIngredient">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>

                    <div class="recipe-screen-nav two-btns">
                        <button class="btn btn-back" type="button" @click="goTo(2)">
                            <i class="bi bi-arrow-left"></i><span> Back</span>
                        </button>
                        <button class="btn" type="button" @click="goTo(4)">
                            <span>Next</span><i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- ── SCREEN 4: Directions ── -->
                <div v-else key="s4" class="recipe-screen">
                    <h3 class="add-recipe-title">Directions <span class="screen-indicator">4 / 4</span></h3>

                    <ol class="step-list" v-if="steps.length">
                        <li v-for="(step, i) in steps" :key="i" class="step-item">
                            <span class="step-text">{{ step }}</span>
                            <button type="button" class="step-remove" @click="removeStep(i)">&times;</button>
                        </li>
                    </ol>
                    <p v-else class="steps-empty">No directions yet — add one below.</p>

                    <div class="step-add-row">
                        <textarea v-model="newStep" placeholder="Describe this step..." rows="2"
                            @keydown.enter.prevent="addStep"></textarea>
                        <button type="button" class="step-add-btn" @click="addStep">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>

                    <div class="recipe-screen-nav two-btns">
                        <button class="btn btn-back" type="button" @click="goTo(3)">
                            <i class="bi bi-arrow-left"></i><span> Back</span>
                        </button>
                        <button class="btn" type="button" @click="handleSubmit">
                            <i class="bi bi-floppy"></i><span> Save</span>
                        </button>
                    </div>
                </div>

            </transition>
        </div>
    </div>
    </teleport>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 1000;
    pointer-events: none;
    transition: background 0.3s ease;

    &.show {
        background: rgba(0, 0, 0, 0.5);
        pointer-events: all;
    }
}

.add-recipe-container {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 320px;
    border-radius: 20px;
    padding: 30px;
    font-family: 'Quicksand', sans-serif;
    z-index: 1050;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: opacity 0.2s ease, visibility 0.2s ease;

    > .close-x {
        opacity: 0;
        position: absolute;
        top: 20px;
        right: 22px;
        z-index: 10;
    }

    > .add-recipe-body {
        opacity: 0;
    }

    &.show {
        width: 460px;
        visibility: visible;
        opacity: 1;
        pointer-events: auto;
        max-height: 90vh;
        overflow-y: auto;
    }

    &.closing {
        visibility: visible;
        animation: modal-pop-out 0.28s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
    }

    &.fill-active {
        box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px;
        background-color: var(--modal-bg);

        > .close-x,
        > .add-recipe-body {
            animation: sink-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
    }
}

.modal-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
    overflow: visible;
}

.modal-svg-rect {
    fill: none;
}

.close-x {
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    color: var(--text-faint);
    transition: color 0.15s ease;

    &:hover {
        color: var(--text);
    }
}

.add-recipe-body {
    margin-top: 10px;
}

.add-recipe-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 16px;
}

.screen-indicator {
    font-size: 0.62rem;
    font-weight: 400;
    opacity: 0.45;
    margin-left: 8px;
    letter-spacing: 0.04em;
}

.recipe-screen {
    label {
        display: block;
        font-size: 1.05rem;
        font-family: 'Quicksand', sans-serif;
        font-weight: 600;
        margin-bottom: 6px;
        margin-top: 14px;
        color: var(--text);
    }

    input[type="text"],
    input[type="url"],
    textarea {
        text-align: center;
        width: 100%;
        border: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        padding: 8px 10px;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.95rem;
        background: transparent;
        color: var(--text);
        resize: none;
        box-sizing: border-box;

        &:focus { outline: none; }
        &::placeholder { color: var(--text-faint); opacity: 1; }

        &.input-error {
            border-bottom-color: #c0392b;
            animation: shake 0.35s ease;
        }
    }

    textarea {
        text-align: left;
        line-height: 1.5;
    }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25%       { transform: translateX(-6px); }
    75%       { transform: translateX(6px); }
}

.recipe-time-row {
    margin-top: 10px;
    display: flex;
    gap: 12px;
    margin-bottom: 4px;

    > div {
        flex: 1;

        label {
            margin-top: 0;
            font-size: 0.95rem;
        }

        input[type="number"] {
            width: 100%;
            border: none;
            border-bottom: 1px solid rgba(0, 0, 0, 0.15);
            padding: 6px 8px;
            font-family: 'Quicksand', sans-serif;
            font-size: 0.95rem;
            text-align: center;
            background: transparent;
            color: var(--text);

            &:focus { outline: none; }
        }
    }
}

.recipe-screen-nav {
    margin-top: 20px;
    display: flex;
    gap: 10px;
}

.btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background-color: rgb(239, 206, 181);
    color: rgba(0, 0, 0, 0.75);
    font-family: 'Quicksand', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover { opacity: 0.8; }
}

.btn-back {
    flex: 0 0 auto;
    padding-left: 14px;
    padding-right: 14px;
    opacity: 0.65;
}

// Category screen
.cat-search-row {
    position: relative;
    margin-top: 14px;
    margin-bottom: 12px;
    background: transparent;
    border: none;
    padding: 0;

    .cat-search-icon {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.35;
        font-size: 0.75rem;
        pointer-events: none;
    }

    .cat-search {
        width: 100%;
        border: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        padding: 6px 8px 6px 24px;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.9rem;
        background: transparent;
        color: var(--text);

        &:focus { outline: none; }
        &::placeholder { color: var(--text-faint); opacity: 1; }
    }
}

.recipe-chips-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0 8px;
    margin-bottom: 12px;
}

.recipe-modal-cats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
}

.recipe-modal-chip {
    font-size: 0.7rem;
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: transparent;
    cursor: pointer;
    font-family: 'Quicksand', sans-serif;
    color: var(--text);
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover { border-color: rgba(0, 0, 0, 0.4); }

    &.active {
        background: rgb(239, 206, 181);
        border-color: rgb(239, 206, 181);
        color: rgba(0, 0, 0, 0.75);
    }
}

.cats-no-results {
    font-size: 0.85rem;
    opacity: 0.4;
    font-style: italic;
    margin: 8px 0 0;
}

.cat-add-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.07);

    input { flex: 1; }
}

// Ingredients
.ing-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    max-height: 200px;
    overflow-y: auto;
}

.ing-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    font-size: 0.9rem;
    color: var(--text);
}

.ing-qty-unit {
    font-size: 0.7rem;
    font-weight: 700;
    opacity: 0.6;
    min-width: 44px;
    flex-shrink: 0;
}

.ing-name { flex: 1; }

.ing-add-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;

    input { padding: 6px; }
    input.ing-input-qty  { width: 70px;  flex-shrink: 0; text-align: center; }
    input.ing-input-unit { width: 64px;  flex-shrink: 0; }
    input.ing-input-name { width: auto;  flex: 1; min-width: 0; }
}

// Steps
.step-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    max-height: 220px;
    overflow-y: auto;
    counter-reset: step-counter;
}

.step-item {
    counter-increment: step-counter;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    color: var(--text);

    &::before {
        content: counter(step-counter);
        min-width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6rem;
        font-weight: 700;
        flex-shrink: 0;
        margin-top: 1px;
    }
}

.step-text { flex: 1; font-size: 0.9rem; line-height: 1.4; }

.step-add-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 14px;

    textarea { flex: 1; }
}

.step-add-btn {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
    transition: opacity 0.15s;
    opacity: 0.6;

    &:hover { opacity: 1; }
}

.step-remove {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.35;
    font-size: 1rem;
    line-height: 1;
    padding: 0 2px;
    flex-shrink: 0;
    color: var(--text);
    transition: opacity 0.15s;

    &:hover { opacity: 0.75; }
}

.steps-empty {
    font-size: 0.9rem;
    opacity: 0.4;
    margin: 14px 0 4px;
    font-style: italic;
}

// Slide transitions
.recipe-screen-enter-active,
.recipe-screen-leave-active,
.recipe-screen-back-enter-active,
.recipe-screen-back-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.recipe-screen-enter-from { opacity: 0; transform: translateX(14px); }
.recipe-screen-leave-to   { opacity: 0; transform: translateX(-14px); }
.recipe-screen-back-enter-from { opacity: 0; transform: translateX(-14px); }
.recipe-screen-back-leave-to   { opacity: 0; transform: translateX(14px); }
</style>
