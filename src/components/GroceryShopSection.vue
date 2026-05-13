<script>
import GroceryItem from './GroceryItem.vue';
import { getSuggestions } from '../data/ingredientCategories.js';

export default {
    name: "GroceryShopSection",

    components: { GroceryItem },

    props: {
        sortedByCat: { type: Array, required: true },
        categories: { type: Array, required: true },
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
        hasBought: { type: Boolean, default: false },
        units: { type: Array, required: true },
    },

    emits: [
        'check-all',
        'rename-category',
        'reorder-categories',
        'qty-increase',
        'qty-decrease',
        'update-expiration',
        'add-to-pantry',
        'add-item',
    ],

    data() {
        return {
            copied: false,
            quickAddName: '',
            suggestions: [],
            highlightedIdx: -1,
            showSuggestions: false,
            hideEmpty: true,
            draggingCatIndex: null,
            dragOverCatIndex: null,
        };
    },

    computed: {
        isEmpty() {
            return this.sortedByCat.every(c => c.products.length === 0);
        },
    },

    methods: {
        // Submits the quick-add input as a new shopping item
        quickAdd() {
            const name = this.quickAddName.trim();
            if (!name) return;
            this.$emit('add-item', { name, quantity: 1, mode: 'grocery' });
            //reset
            this.quickAddName = '';
            this.suggestions = [];
            this.showSuggestions = false;
            this.highlightedIdx = -1;
        },

        // Updates the autocomplete suggestions as the user types
        onQuickAddInput() {
            this.highlightedIdx = -1;
            this.suggestions = getSuggestions(this.quickAddName);
            this.showSuggestions = this.suggestions.length > 0;
        },

        // Handles keyboard navigation (Enter/ArrowUp/ArrowDown/Escape) for the quick-add autocomplete dropdown
        onQuickAddKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.showSuggestions && this.highlightedIdx >= 0) {
                    this.pickSuggestion(this.suggestions[this.highlightedIdx]);
                } else {
                    this.quickAdd();
                }
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

        // Fills the input with the chosen suggestion and submits the add immediately
        pickSuggestion(s) {
            this.quickAddName = s.charAt(0).toUpperCase() + s.slice(1);
            this.showSuggestions = false;
            this.suggestions = [];
            this.highlightedIdx = -1;
            this.quickAdd();
        },

        // Hides autocomplete suggestions after a short delay to allow click events to register first
        hideSuggestions() {
            setTimeout(() => { this.showSuggestions = false; }, 120);
        },

        // Records the dragged category index and sets the drag transfer effect
        onCatDragStart(index, e) {
            this.draggingCatIndex = index;
            e.dataTransfer.effectAllowed = 'move';
        },
        // Tracks the current drag-over category index for visual feedback
        onCatDragOver(index) {
            this.dragOverCatIndex = index;
        },
        // Reorders categories by splicing the dragged item into the drop position
        onCatDrop(dropIndex) {
            if (this.draggingCatIndex === null || this.draggingCatIndex === dropIndex) return;
            const newOrder = [...this.categories];
            const [moved] = newOrder.splice(this.draggingCatIndex, 1);
            newOrder.splice(dropIndex, 0, moved);
            this.$emit('reorder-categories', newOrder);
            this.draggingCatIndex = null;
            this.dragOverCatIndex = null;
        },
        // Clears drag state after a drag operation ends
        onCatDragEnd() {
            this.draggingCatIndex = null;
            this.dragOverCatIndex = null;
        },

        // Copies the shopping list as plain text grouped by category to the clipboard
        copyList() {
            const lines = [];
            this.sortedByCat.forEach(cat => {
                if (cat.products.length === 0) return;
                lines.push('--- ' + cat.name + ' ---');
                cat.products.forEach(p => lines.push(p.product.name + ' x' + p.qty));
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
        <div class="grocery-layout">

            <!-- Sidebar: draggable category list (desktop only) -->
            <aside class="grocery-sidebar">
                <div class="sidebar-cat-list">
                    <div v-for="(cat, index) in sortedByCat" :key="cat.id" class="sidebar-cat-item" :class="{
                        empty: cat.products.length === 0,
                        'drag-over': dragOverCatIndex === index
                    }" draggable="true" @dragstart="onCatDragStart(index, $event)"
                        @dragover.prevent="onCatDragOver(index)" @drop.prevent="onCatDrop(index)"
                        @dragend="onCatDragEnd">
                        <i class="bi bi-grip-vertical sidebar-grip"></i>
                        <span class="sidebar-cat-name">{{ cat.name }}</span>
                        <span v-if="cat.products.length > 0" class="sidebar-cat-count">{{ cat.products.length }}</span>
                    </div>
                </div>
            </aside>

            <!-- Main content -->
            <div class="grocery-main">

                <div class="shop-toolbar">
                    <div class="suggest-wrap" :class="{ open: showSuggestions }">
                        <input type="text" class="quick-add-input" placeholder="Add item..." v-model="quickAddName"
                            autocomplete="off" @input="onQuickAddInput" @keydown="onQuickAddKeydown"
                            @blur="hideSuggestions" />
                        <transition name="suggest-drop">
                            <ul class="suggest-dropdown" v-if="showSuggestions">
                                <li v-for="(s, i) in suggestions" :key="s" class="suggest-item"
                                    :class="{ active: i === highlightedIdx }"
                                    :style="{ animationDelay: (i * 0.05) + 's' }"
                                    @mousedown.prevent="pickSuggestion(s)">{{ s.charAt(0).toUpperCase() + s.slice(1) }}
                                </li>
                            </ul>
                        </transition>
                    </div>
                    <div class="right-actions">
                        <transition name="toolbar-btn">
                            <button v-if="hasBought" class="add-to-pantry-btn" @click="$emit('add-to-pantry')">
                                <i class="bi bi-arrow-right-circle"></i><span>Add &#10004; to pantry</span>
                            </button>
                        </transition>

                        <button class="mobile-icon-btn" @click="$emit('check-all')" title="Check all">
                            <i class="bi bi-check2-all"></i>
                        </button>
                        <button class="mobile-icon-btn" :class="{ active: hideEmpty }" @click="hideEmpty = !hideEmpty"
                            title="Toggle empty categories">
                            <i :class="hideEmpty ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>

                        <span id="print-list"><i class="bi bi-printer"></i></span>
                        <span id="copy-list" @click="copyList" :title="copied ? 'Copied!' : 'Copy list'">
                            <i :class="copied ? 'bi bi-clipboard-check' : 'bi bi-clipboard'"></i>
                        </span>
                    </div>
                </div>

                <transition name="empty-fade">
                    <div v-if="isEmpty" class="empty-state">
                        <div class="store-scene">
                            <div class="scene-shelf">
                                <div class="shelf-items">
                                    <div class="si si-a"></div>
                                    <div class="si si-c"></div>
                                    <div class="si si-b"></div>
                                    <div class="si si-d"></div>
                                    <div class="si si-a"></div>
                                    <div class="si si-c"></div>
                                    <div class="si si-b"></div>
                                    <div class="si si-d"></div>
                                    <div class="si si-a"></div>
                                    <div class="si si-c"></div>
                                    <div class="si si-b"></div>
                                    <div class="si si-d"></div>
                                </div>
                                <div class="shelf-board"></div>
                            </div>
                            <div class="scene-shelf">
                                <div class="shelf-items">
                                    <div class="si si-b"></div>
                                    <div class="si si-a"></div>
                                    <div class="si si-d"></div>
                                    <div class="si si-c"></div>
                                    <div class="si si-a"></div>
                                    <div class="si si-b"></div>
                                    <div class="si si-d"></div>
                                    <div class="si si-c"></div>
                                    <div class="si si-a"></div>
                                    <div class="si si-b"></div>
                                    <div class="si si-d"></div>
                                </div>
                                <div class="shelf-board"></div>
                            </div>
                            <div class="cart-lane">
                                <svg class="rolling-cart" viewBox="0 0 60 54" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 9 L14 9" stroke="currentColor" stroke-width="3"
                                        stroke-linecap="round" />
                                    <path d="M14 9 L52 9 L48 33 L18 33 Z" stroke="currentColor" stroke-width="2.5"
                                        stroke-linejoin="round" />
                                    <path d="M18 33 L52 9" stroke="currentColor" stroke-width="1.5" opacity="0.2" />
                                    <path d="M22 40 L42 40" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" opacity="0.35" />
                                    <g class="wheel-l">
                                        <circle cx="24" cy="45" r="5" stroke="currentColor" stroke-width="2.5" />
                                        <line x1="19.5" y1="45" x2="28.5" y2="45" stroke="currentColor" stroke-width="1"
                                            opacity="0.4" />
                                        <line x1="24" y1="40.5" x2="24" y2="49.5" stroke="currentColor" stroke-width="1"
                                            opacity="0.4" />
                                    </g>
                                    <g class="wheel-r">
                                        <circle cx="42" cy="45" r="5" stroke="currentColor" stroke-width="2.5" />
                                        <line x1="37.5" y1="45" x2="46.5" y2="45" stroke="currentColor" stroke-width="1"
                                            opacity="0.4" />
                                        <line x1="42" y1="40.5" x2="42" y2="49.5" stroke="currentColor" stroke-width="1"
                                            opacity="0.4" />
                                    </g>
                                </svg>
                                <div class="aisle-floor"></div>
                            </div>
                        </div>
                        <p class="empty-label">Your list is empty</p>
                        <p class="empty-hint">Add something above to get started</p>
                    </div>
                </transition>

                <div v-if="!isEmpty" class="shopping-list">
                    <grocery-item :sorted-by-cat="sortedByCat" :categories="categories"
                        :is-desktop="isDesktop"
                        :is-mobile="isMobile" :units="units" :hide-empty="hideEmpty"
                        @rename-category="$emit('rename-category', $event)"
                        @qty-increase="$emit('qty-increase', $event)" @qty-decrease="$emit('qty-decrease', $event)"
                        @update-expiration="$emit('update-expiration', $event)">
                    </grocery-item>
                </div>

            </div><!-- /grocery-main -->
        </div><!-- /grocery-layout -->

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
        font-size: 1.1rem;
    }

    &:hover {
        cursor: pointer;
        opacity: 1;
    }
}

#shopSection {
    box-shadow: var(--box-shadow);
    margin-top: 50px;
    padding: 0;
    background-color: var(--bg);
    border-radius: 15px;
    overflow: hidden;
}

.grocery-layout {
    display: flex;
    min-height: 500px;
}

.grocery-sidebar {
    width: 28%;
    flex-shrink: 0;
    border-right: 1px solid var(--border-subtle);
    overflow-y: auto;
    padding: 12px 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

.grocery-main {
    flex: 1;
    min-width: 0;
    padding: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

.sidebar-cat-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar-cat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: grab;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    transition: background 0.12s, color 0.12s;
    user-select: none;

    &:hover {
        background: var(--surface);
        color: var(--text);
    }

    &.active {
        background: var(--surface2);
        color: var(--text);
    }

    &.empty {
        opacity: 0.4;
    }

    &.drag-over {
        position: relative;

        &::before {
            content: '';
            position: absolute;
            top: -2px;
            left: 6px;
            right: 6px;
            height: 2px;
            background: var(--sage);
            border-radius: 2px;
        }
    }

}

.sidebar-grip {
    opacity: 0.3;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.sidebar-cat-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-cat-count {
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    background: var(--surface3);
    color: var(--text-muted);
    padding: 1px 6px;
    border-radius: 10px;
    flex-shrink: 0;
}

.shopping-list {
    padding: 20px;
}

.shop-toolbar {
    display: flex;
    align-items: center;
    padding: 14px 20px 12px;
    position: relative;
    border-bottom: 1px solid var(--border-subtle);
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
    background: linear-gradient(to right, transparent, var(--surface3), transparent);
}

.suggest-wrap {
    flex: 1;
    max-width: 240px;
    position: relative;
    transition: max-width 0.2s ease;

    &:focus-within {
        max-width: 320px;
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
    background-color: var(--search-surface);
}

.suggest-wrap.open .quick-add-input {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.suggest-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg);
    border: 1px solid var(--border-subtle);
    border-top: none;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    list-style: none;
    margin: 0;
    padding: 4px 0 8px;
    z-index: 1100;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    max-height: 220px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface3) transparent;
}

.suggest-item {
    padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--text);
    animation: suggest-in 0.12s ease both;

    &:hover,
    &.active {
        background: var(--surface);
    }
}

@keyframes suggest-in {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.suggest-drop-enter-active,
.suggest-drop-leave-active {
    transition: opacity 0.12s ease, transform 0.12s ease;
}

.suggest-drop-enter-from {
    opacity: 0;
    transform: translateY(-6px);
}

.suggest-drop-leave-to {
    opacity: 0;
    transform: translateY(-4px);
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

// ── Empty state ───────────────────────────────────────────────────────────────

.empty-fade-enter-active,
.empty-fade-leave-active {
    transition: opacity 0.3s ease;
}

.empty-fade-enter-from,
.empty-fade-leave-to {
    opacity: 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 20px 40px;
    pointer-events: none;
    user-select: none;
}

.store-scene {
    width: 100%;
    max-width: 520px;
    border-radius: 14px;
    overflow: hidden;
    background: var(--surface);
}

.scene-shelf {
    padding-top: 10px;
}

.shelf-items {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    padding: 0 18px;
}

.si {
    border-radius: 3px 3px 0 0;
    width: 20px;
    flex-shrink: 0;

    &.si-a {
        height: 32px;
        background: var(--surface2);
    }

    &.si-b {
        height: 24px;
        background: var(--surface3);
    }

    &.si-c {
        height: 16px;
        background: var(--surface4);
    }

    &.si-d {
        height: 28px;
        background: var(--sage);
    }
}

.shelf-board {
    height: 9px;
    margin-top: 3px;
    background: var(--surface3);
    border-top: 2px solid var(--surface4);
}

.cart-lane {
    position: relative;
    height: 72px;
    overflow: hidden;
}

.aisle-floor {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--surface3);
    border-radius: 2px;
}

.rolling-cart {
    position: absolute;
    bottom: 13px;
    left: 0;
    width: 62px;
    height: auto;
    color: var(--text-faint);
    animation: cart-roll 5s linear infinite;
}

.wheel-l,
.wheel-r {
    transform-box: fill-box;
    transform-origin: center;
    animation: wheel-spin 0.8s linear infinite;
}

@keyframes cart-roll {
    from {
        transform: translateX(-80px);
    }

    to {
        transform: translateX(640px);
    }
}

@keyframes wheel-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.empty-label {
    margin-top: 28px;
    margin-bottom: 5px;
    font-family: 'Quicksand', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.03em;
}

.empty-hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-faint);
    font-family: 'Inter', sans-serif;
}

.mobile-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border: none;
    border-radius: 50%;
    background: var(--search-surface);
    color: var(--text-muted);
    font-size: 1.15rem;
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
        color: var(--text);
    }

    &.active {
        color: var(--sage);
    }

    i {
        pointer-events: none;
    }
}

// ── Mobile layout ─────────────────────────────────────────────
@media (max-width: 768px) {
    #shopSection {
        margin-top: 0;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
        background: transparent;
        overflow: visible;
    }

    .grocery-layout {
        display: block;
    }

    .grocery-sidebar {
        display: none;
    }

    .grocery-main {
        padding: 0;
        overflow-y: visible;
    }

    .shop-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--bg);
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-subtle);
        flex-wrap: nowrap;
        gap: 6px;
        align-items: center;
    }

    .suggest-wrap {
        min-width: 0;
        max-width: 50vw;

        &:focus-within {
            max-width: 62vw;
        }
    }

    .quick-add-input {
        padding: 8px 12px;
        font-size: 0.9rem;
    }

    .right-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        margin-left: auto;
    }

    .add-to-pantry-btn {
        padding: 6px 8px;
        flex-shrink: 0;
        letter-spacing: 0;

        span {
            display: none;
        }

        i {
            font-size: 1.1rem;
        }
    }

    #print-list {
        display: none;
    }

    #copy-list i {
        font-size: 1.3rem;
    }

    .shopping-list {
        padding: 12px 12px 80px;
    }

    .empty-state {
        padding: 36px 16px 32px;
    }
}
</style>
