<script>
import GroceryItem from './GroceryItem.vue';
import { getSuggestions } from '../ingredientCategories.js';

export default {
    name: "GroceryShopSection",

    components: { GroceryItem },

    props: {
        sortedByCat: { type: Array, required: true },
        categories: { type: Array, required: true },
        filteredShoppingList: { type: Array, required: true },
        selectedCategoryGrocery: { type: Object, default: () => ({ name: '' }) },
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
        hasBought: { type: Boolean, default: false },
        units: { type: Array, required: true },
    },

    emits: [
        'check-all',
        'select-category',
        'rename-category',
        'reorder-categories',
        'qty-increase',
        'qty-decrease',
        'update-expiration',
        'add-to-pantry',
        'update:selected-category-grocery',
        'move-item',
        'add-item',
    ],

    data() {
        return {
            copied: false,
            quickAddName: '',
            suggestions: [],
            highlightedIdx: -1,
            showSuggestions: false,
        };
    },

    mounted() {
        $('#grocery-grid').sortable({
            items: '> div',
            handle: '.category-header',
            distance: 5,
            appendTo: 'body',
            tolerance: 'pointer',
            cursorAt: { top: 22, left: 60 },
            helper(_e, item) {
                return $('<div class="cat-drag-ghost">').text(
                    item.find('.category-header span').first().text()
                );
            },
            start(_e, ui) {
                ui.placeholder.height(62);
                ui.item.css('opacity', 0);
            },
            stop(_e, ui) {
                ui.item.css('opacity', '');
            },
        });
    },

    watch: {
        sortedByCat() {
            this.$nextTick(() => {
                if ($('#grocery-grid').data('ui-sortable')) {
                    $('#grocery-grid').sortable('refresh');
                }
            });
        },
    },

    methods: {
        quickAdd() {
            const name = this.quickAddName.trim();
            if (!name) return;
            this.$emit('add-item', { name, quantity: 1, mode: 'grocery' });
            this.quickAddName = '';
            this.suggestions = [];
            this.showSuggestions = false;
            this.highlightedIdx = -1;
        },

        onQuickAddInput() {
            this.highlightedIdx = -1;
            this.suggestions = getSuggestions(this.quickAddName);
            this.showSuggestions = this.suggestions.length > 0;
        },

        onQuickAddKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.showSuggestions && this.highlightedIdx >= 0) {
                    this.pickSuggestion(this.suggestions[this.highlightedIdx]);
                }
                this.quickAdd();
                return;
            }
            if (!this.showSuggestions) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.highlightedIdx = Math.min(this.highlightedIdx + 1, this.suggestions.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.highlightedIdx = Math.max(this.highlightedIdx - 1, -1);
            } else if (e.key === 'Escape') {
                this.showSuggestions = false;
            }
        },

        pickSuggestion(s) {
            this.quickAddName = s.charAt(0).toUpperCase() + s.slice(1);
            this.showSuggestions = false;
            this.suggestions = [];
            this.highlightedIdx = -1;
        },

        hideSuggestions() {
            setTimeout(() => { this.showSuggestions = false; }, 120);
        },

        copyList() {
            const lines = [];
            this.sortedByCat.forEach(cat => {
                if (cat.products.length === 0) return;
                lines.push('--- ' + cat.name + ' ---');
                cat.products.forEach(p => lines.push(p.name + ' x' + p.qty));
            });
            const text = lines.join('\n');
            navigator.clipboard.writeText(text).then(() => {
                this.copied = true;
                setTimeout(() => { this.copied = false; }, 1800);
            }).catch(() => {
                this.copied = true;
                setTimeout(() => { this.copied = false; }, 1800);
            });
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div id="shopSection" class="section active">

        <div class="shop-toolbar">
            <div class="suggest-wrap" :class="{ open: showSuggestions }">
                <input type="text" class="quick-add-input" placeholder="Add item..." v-model="quickAddName"
                    autocomplete="off" @input="onQuickAddInput" @keydown="onQuickAddKeydown"
                    @blur="hideSuggestions" />
                <transition name="suggest-drop">
                    <ul class="suggest-dropdown" v-if="showSuggestions">
                        <li v-for="(s, i) in suggestions" :key="s" class="suggest-item"
                            :class="{ active: i === highlightedIdx }" :style="{ animationDelay: (i * 0.05) + 's' }"
                            @mousedown.prevent="pickSuggestion(s)">{{ s.charAt(0).toUpperCase() + s.slice(1) }}</li>
                    </ul>
                </transition>
            </div>

            <h2 class="grocery-title"><i class="bi bi-leaf"></i> Your Grocery List <i class="bi bi-leaf flip"></i></h2>

            <div class="right-actions">
                <transition name="toolbar-btn">
                    <button v-if="hasBought" class="add-to-pantry-btn" @click="$emit('add-to-pantry')">
                        <i class="bi bi-arrow-right-circle"></i><span>Add &#10004; to pantry</span>
                    </button>
                </transition>
                <div class="checkbox-container">
                    <input type="checkbox" name="checkAll" id="check-all-off" @click="$emit('check-all')">
                    <label for="check-all-off">Check All</label>
                </div>
                <span id="print-list"><i class="bi bi-printer"></i></span>
                <span id="copy-list" @click="copyList" :title="copied ? 'Copied!' : 'Copy list'">
                    <i :class="copied ? 'bi bi-clipboard-check' : 'bi bi-clipboard'"></i>
                </span>
            </div>
        </div>

        <div class="grocery-divider"></div>

        <div class="shopping-list">
            <div class="grid" id="grocery-grid">
                <grocery-item :sorted-by-cat="sortedByCat" :categories="categories"
                    :filtered-shopping-list="filteredShoppingList" :selected-category-grocery="selectedCategoryGrocery"
                    :is-desktop="isDesktop" :is-mobile="isMobile" :units="units"
                    @select-category="$emit('select-category', $event)"
                    @rename-category="$emit('rename-category', $event)" @qty-increase="$emit('qty-increase', $event)"
                    @qty-decrease="$emit('qty-decrease', $event)"
                    @update-expiration="$emit('update-expiration', $event)" @move-item="$emit('move-item', $event)">
                </grocery-item>
            </div>
        </div>

    <teleport to="body">
        <transition name="toast-slide">
            <div class="copy-toast" v-if="copied">
                <i class="bi bi-clipboard-check"></i> Copied to clipboard!
            </div>
        </transition>
    </teleport>

    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

.right-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 16px;
}

.checkbox-container {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid var(--border-subtle);
    background: var(--add-button-bg-light);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
    opacity: 0.75;

    &:hover {
        opacity: 1;
        background: var(--add-button-bg-light);
    }

    input {
        accent-color: currentColor;
        cursor: pointer;
        width: 13px;
        height: 13px;
        flex-shrink: 0;
    }

    label {
        cursor: pointer;
        font-size: 1rem;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        white-space: nowrap;
    }
}

.add-to-pantry-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid var(--pantry-btn);
    background: var(--pantry-btn);
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: opacity 0.15s ease;
    opacity: 0.85;

    &:hover {
        opacity: 1;
    }
}

#print-list,
#copy-list {
    display: flex;
    align-items: center;
    opacity: 0.55;
    transition: opacity 0.15s ease;

    i {
        font-size: 2.35rem;
    }

    &:hover {
        cursor: pointer;
        opacity: 1;
    }
}

#shopSection {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    padding: 30px;
    background-color: var(--bg);
    border-radius: 15px;
}

.shopping-list {
    padding-top: 50px;
    padding-bottom: 50px;
}

.grid {
    columns: 3;
    column-gap: 20px;
}

.shop-toolbar {
    display: flex;
    align-items: center;
    padding: 0 0 20px;
    position: relative;
}

.grocery-title {
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

.grocery-divider {
    margin: 0 -30px 20px;
    height: 1px;
    background: linear-gradient(to right, transparent, rgb(197, 197, 197), transparent);
}

.suggest-wrap {
    width: 240px;
    transition: width 0.2s ease;

    &:focus-within {
        width: 240px;
    }
}

.quick-add-input {
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

.suggest-wrap.open .quick-add-input {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.copy-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    background: #2c2c2c;
    color: #fff;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    z-index: 9999;
    white-space: nowrap;
    font-size: 0.9rem;

    i {
        color: #6cbe45;
    }
}

.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
}

.toolbar-btn-enter-active,
.toolbar-btn-leave-active {
    transition: opacity 0.2s ease;
}

.toolbar-btn-enter-from,
.toolbar-btn-leave-to {
    opacity: 0;
}
</style>
