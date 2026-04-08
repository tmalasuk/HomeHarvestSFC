<script>
import PantryTable from './PantryTable.vue';
import { getSuggestions } from '../ingredientCategories.js';

export default {
    name: 'Pantry',

    components: { PantryTable },

    props: {
        products: { type: Array, required: true },
        categories: { type: Array, required: true },
        units: { type: Array, required: true },
        isMobile: { type: Boolean, required: true },
    },

    emits: ['add-item', 'stop-editing-name', 'delete-product', 'delete-item', 'restock-change'],

    data() {
        return {
            selectedCategory: null,
            selectedMetaFilter: 'all',
            searchQuery: '',
            pantryAddName: '',
            pantryAddSuggestions: [],
            pantryAddHighlightedIdx: -1,
            pantryAddShowSuggestions: false,
            dragOverCatId: null,
            pillDrag: { active: false, startX: 0, scrollLeft: 0, moved: false },
        };
    },

    computed: {
        occupiedCategories() {
            const names = new Set(this.products.map(p => p.category));
            const occupied = this.categories.filter(c => names.has(c.name));
            if (this.selectedCategory && !names.has(this.selectedCategory.name)) {
                this.selectedCategory = null;
            }
            return occupied;
        },

        pantryTable() {
            let products = this.products;

            if (this.selectedCategory !== null) {
                products = products.filter(p => p.category === this.selectedCategory.name);
            }

            if (this.searchQuery.trim() !== '') {
                const query = this.searchQuery.toLowerCase();
                products = products.filter(p => p.name.toLowerCase().includes(query));
            }

            if (this.selectedMetaFilter === 'expiring-soon') {
                const cutoff = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                products = products.filter(p =>
                    p.batch.some(b => b.expiration && new Date(b.expiration) <= cutoff)
                );
            } else if (this.selectedMetaFilter === 'low-qty') {
                products = products.filter(p => p.batch.length === 1 && p.batch[0].qty < 50);
            }

            return products;
        },
    },

    methods: {
        selectCategory(category) {
            if (this.pillDrag.moved) { this.pillDrag.moved = false; return; }
            this.selectedCategory = category;
        },

        onPillMousedown(e) {
            const el = this.$refs.categoryPills;
            this.pillDrag.active = true;
            this.pillDrag.moved = false;
            this.pillDrag.startX = e.pageX - el.offsetLeft;
            this.pillDrag.scrollLeft = el.scrollLeft;
        },

        onPillMousemove(e) {
            if (!this.pillDrag.active) return;
            const el = this.$refs.categoryPills;
            const x = e.pageX - el.offsetLeft;
            const walk = x - this.pillDrag.startX;
            if (Math.abs(walk) > 5) this.pillDrag.moved = true;
            el.scrollLeft = this.pillDrag.scrollLeft - walk;
        },

        onPillMouseup() {
            this.pillDrag.active = false;
        },

        selectMetaFilter(filter) {
            this.selectedMetaFilter = filter;
        },

        submitPantryAdd() {
            const name = this.pantryAddName.trim();
            if (!name) return;
            this.$emit('add-item', { name, categoryOverride: this.selectedCategory });
            this.pantryAddName = '';
            this.pantryAddSuggestions = [];
            this.pantryAddShowSuggestions = false;
            this.pantryAddHighlightedIdx = -1;
            if (this.selectedMetaFilter !== 'all') {
                this.selectedMetaFilter = 'all';
            }
        },

        onPantryAddInput() {
            this.pantryAddHighlightedIdx = -1;
            this.pantryAddSuggestions = getSuggestions(this.pantryAddName);
            this.pantryAddShowSuggestions = this.pantryAddSuggestions.length > 0;
        },

        onPantryAddKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.pantryAddShowSuggestions && this.pantryAddHighlightedIdx >= 0) {
                    this.pickPantryAddSuggestion(this.pantryAddSuggestions[this.pantryAddHighlightedIdx]);
                }
                this.submitPantryAdd();
                return;
            }
            if (!this.pantryAddShowSuggestions) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.pantryAddHighlightedIdx = Math.min(this.pantryAddHighlightedIdx + 1, this.pantryAddSuggestions.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.pantryAddHighlightedIdx = Math.max(this.pantryAddHighlightedIdx - 1, -1);
            } else if (e.key === 'Escape') {
                this.pantryAddShowSuggestions = false;
            }
        },

        pickPantryAddSuggestion(s) {
            this.pantryAddName = s.charAt(0).toUpperCase() + s.slice(1);
            this.pantryAddSuggestions = [];
            this.pantryAddShowSuggestions = false;
            this.pantryAddHighlightedIdx = -1;
        },

        hidePantryAddSuggestions() {
            setTimeout(() => { this.pantryAddShowSuggestions = false; }, 120);
        },

        dropOnCategory(cat, event) {
            const productId = event.dataTransfer.getData('productId');
            this.dragOverCatId = null;
            if (!productId) return;
            const product = this.products.find(p => String(p.id) === productId);
            if (!product || product.category === cat.name) return;
            product.category = cat.name;
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <section class="tab-pane show fade active" id="pantry" role="tabpanel" aria-labelledby="pantry-tab">
        <header>
            <div class="suggest-wrap" :class="{ open: pantryAddShowSuggestions }">
                <input type="text" class="pantry-add-input"
                    :placeholder="selectedCategory ? 'Add item to ' + selectedCategory.name : 'Add item...'"
                    v-model="pantryAddName" autocomplete="off" @input="onPantryAddInput" @keydown="onPantryAddKeydown"
                    @blur="hidePantryAddSuggestions" />
                <transition name="suggest-drop">
                    <ul class="suggest-dropdown" v-if="pantryAddShowSuggestions">
                        <li v-for="(s, i) in pantryAddSuggestions" :key="s" class="suggest-item"
                            :class="{ active: i === pantryAddHighlightedIdx }"
                            :style="{ animationDelay: (i * 0.05) + 's' }"
                            @mousedown.prevent="pickPantryAddSuggestion(s)">{{ s.charAt(0).toUpperCase() + s.slice(1) }}
                        </li>
                    </ul>
                </transition>
            </div>
            <h2 class="pantry-title"><i class="bi bi-leaf"></i> Your Pantry Items <i class="bi bi-leaf flip"></i></h2>
            <div class="header-right">
                <form class="desktop-search" role="search" @submit.prevent>
                    <input type="text" class="form-control ps-5" placeholder="Search" v-model="searchQuery">
                    <i class="bi bi-search"></i>
                </form>
            </div>
        </header>

        <div class="pill-filters">
            <div class="meta-pills">
                <button class="cat-pill meta-pill" :class="{ active: selectedMetaFilter === 'all' }"
                    @click="selectMetaFilter('all')">All</button>
                <button class="cat-pill meta-pill" :class="{ active: selectedMetaFilter === 'expiring-soon' }"
                    @click="selectMetaFilter('expiring-soon')">Expiring Soon</button>
                <button class="cat-pill meta-pill" :class="{ active: selectedMetaFilter === 'low-qty' }"
                    @click="selectMetaFilter('low-qty')">Low Qty</button>
            </div>
            <div class="category-pills" ref="categoryPills"
                :class="{ dragging: pillDrag.active }"
                @mousedown="onPillMousedown"
                @mousemove="onPillMousemove"
                @mouseup="onPillMouseup"
                @mouseleave="onPillMouseup">
                <button class="cat-pill" :class="{ active: selectedCategory === null }"
                    @click="selectCategory(null)">All</button>
                <button v-for="cat in occupiedCategories" :key="cat.id" class="cat-pill"
                    :class="{ active: selectedCategory && selectedCategory.id === cat.id, 'pill-drop-over': dragOverCatId === cat.id }"
                    @click="selectCategory(cat)" @dragover.prevent="dragOverCatId = cat.id"
                    @dragleave="dragOverCatId = null" @drop.prevent="dropOnCategory(cat, $event)">{{ cat.name
                    }}</button>
            </div>
        </div>

        <pantry-table :products="pantryTable" :is-mobile="isMobile" :units="units" :categories="categories"
            @stop-editing-name="$emit('stop-editing-name', $event)" @delete-product="$emit('delete-product', $event)"
            @delete-item="$emit('delete-item', $event)" @restock-change="$emit('restock-change')" />

    </section>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;


#pantry {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    padding: 30px;
    background-color: var(--bg);
    border-radius: 15px;
}

.desktop-search {
    position: relative;
    display: flex;
    align-items: center;
    max-height: 50px;

    i {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
    }
}

button {
    border: none;

}

header {
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 30px;
    padding-right: 30px;
    padding-bottom: 20px;
}

.pantry-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    font-family: 'Quicksand', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    .flip {
        transform: scaleX(-1);
    }
}

.pantry-add-input {
    border: none;
    border-radius: 50px;
    padding: 10px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    outline: none;
    width: 100%;
    transition: border-radius 0.15s ease;
    background-color: rgb(233, 231, 231);
}

.suggest-wrap {
    width: 240px;
    margin-right: 30px;
    transition: width 0.2s ease;

    &:focus-within {
        width: 320px;
    }
}

.suggest-wrap.open .pantry-add-input {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-right .meta-pills {
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
    padding: 0;

    &::after {
        display: none;
    }
}

.desktop-search input,
.mobile-search input {
    border-radius: 50px;
    border: none;
    box-shadow: none;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-right: 18px;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    background-color: rgb(233, 231, 231);

    &:focus {
        box-shadow: none;
    }
}

.pill-filters {
    padding: 20px 30px;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 2%;
        right: 2%;
        height: 1px;
        background: linear-gradient(to right, transparent, rgb(197, 197, 197), transparent);
    }
}

.category-pills {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
    scrollbar-width: none;
    cursor: grab;
    user-select: none;

    &.dragging {
        cursor: grabbing;
    }

    &::-webkit-scrollbar {
        display: none;
    }
}

.meta-pills {
    display: flex;
    padding-top: 20px;
    padding-bottom: 10px;
    position: relative;
    gap: 8px;
}

.cat-pill {
    background: transparent;
    border: 1px solid rgb(181, 181, 181);
    border-radius: 20px;
    padding: 5px 14px;
    font-family: 'Oxygen';
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s, color 0.15s;

    &:hover {
        border-color: rgb(144, 157, 165);
        color: rgb(144, 157, 165);
    }

    &.active {
        background: rgb(144, 157, 165);
        border-color: rgb(144, 157, 165);
        color: #fff;
    }
}


</style>
