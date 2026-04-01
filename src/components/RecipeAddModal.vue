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
        show(val) {
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
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <teleport to="body">
    <div class="modal-backdrop" :class="{ show: show }"></div>
    <div class="add-recipe-container" :class="{ show: show, 'fill-active': fillActive, closing: closing }">
        <svg class="modal-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect class="modal-svg-rect" ref="svgRect" x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="18" ry="18"
                fill="none" stroke="white" stroke-width="3"
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

<style scoped></style>
