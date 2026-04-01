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
            });
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div id="shopSection" class="section active">

        <div class="shop-toolbar">
            <div class="left-tools">
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
            </div>

            <div class="action-container">
                <div class="action-center">
                    <div class="checkbox-container">
                        <input type="checkbox" name="checkAll" id="check-all-off" @click="$emit('check-all')">
                        <label for="check-all-off">Check All Items</label>
                    </div>
                    <span id="print-list"><i class="bi bi-printer"></i></span>
                    <span id="copy-list" @click="copyList" :title="copied ? 'Copied!' : 'Copy list'">
                        <i :class="copied ? 'bi bi-clipboard-check' : 'bi bi-clipboard'"></i>
                    </span>
                </div>
                <transition name="toolbar-btn">
                    <button v-if="hasBought" class="add-to-pantry-btn" @click="$emit('add-to-pantry')">
                        <i class="bi bi-arrow-right-circle"></i><span>Add &#10004; to pantry</span>
                    </button>
                </transition>
            </div>
        </div>

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

    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

.action-container {
    display: flex;
    align-items: center;
    flex: 1;
    position: relative;

    .action-center {
        left: 50%;
        display: flex;
        align-items: center;
        gap: 25px;
        pointer-events: none;

        >* {
            pointer-events: all;
        }
    }

    .checkbox-container {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 5px 14px;
        border-radius: 20px;
        border: 1.5px solid currentColor;
        opacity: 0.55;
        transition: opacity 0.15s ease;

        &:hover {
            opacity: 1;
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
            font-size: 0.68rem;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            white-space: nowrap;
        }
    }

    #print-list,
    #copy-list {
        display: flex;
        align-items: center;
        opacity: 0.55;
        transition: opacity 0.15s ease;

        i {
            font-size: 1.35rem;
        }

        &:hover {
            cursor: pointer;
            opacity: 1;
        }
    }
}

.shopping-list {
    width: 1300px;
    padding-top: 50px;
    padding-bottom: 50px;
    margin: 0 auto;
}

.grid {
    max-width: 1300px;
    columns: 2;
    column-gap: 20px;
}

.shop-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px 0;

    .left-tools {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .quick-add-input {
        border: none;
        border-radius: 50px;
        padding: 10px 18px;
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        outline: none;
        width: 180px;
        transition: width 0.2s ease, border-radius 0.15s ease;

        &:focus {
            width: 240px;
        }
    }

    .suggest-wrap.open .quick-add-input {
        border-top-left-radius: 50px;
        border-top-right-radius: 50px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }
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
