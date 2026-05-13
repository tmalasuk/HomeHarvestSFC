<script>
import BaseDurationInput from './BaseDurationInput.vue';

export default {
    name: "GroceryItem",

    components: { BaseDurationInput },

    props: {
        sortedByCat: { type: Array, required: true },
        categories: { type: Array, required: true },
        selectedCategoryGrocery: { type: Object, default: () => ({ name: '' }) },
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
        units: { type: Array, required: true },
        hideEmpty: { type: Boolean, default: false },
    },

    emits: [
        'rename-category',
        'qty-increase',
        'qty-decrease',
        'update-expiration',
    ],

    data() {
        return {
            editingCatId: null,
            editingCatName: '',
        };
    },

    computed: {
        // if hide empty is not clicked, give everything else filter
        displayedCategories() {
            if (!this.hideEmpty) return this.sortedByCat;
            return this.sortedByCat.filter(c => c.products.length > 0);
        },
    },

    methods: {
        // Enters rename mode for a category and focuses the rename input
        startEdit(cat) {
            this.editingCatId = cat.id;
            this.editingCatName = cat.name;
            this.$nextTick(() => {
                const input = document.querySelector('.cat-rename-input');
                if (input) input.focus();
            });
        },

        // Emits rename-category if the name changed, then exits rename mode
        commitEdit(cat) {
            const newName = this.editingCatName.trim();
            if (newName && newName !== cat.name) {
                this.$emit('rename-category', { id: cat.id, newName });
            }
            this.editingCatId = null;
            this.editingCatName = '';
        },

        // Exits rename mode without saving
        cancelEdit() {
            this.editingCatId = null;
            this.editingCatName = '';
        },

        // Locks the element's dimensions before a CSS leave transition so it animates from its current position
        // prevents things from jumping around
        catBeforeLeave(el) {
            el.style.width = el.offsetWidth + 'px';
            el.style.height = el.offsetHeight + 'px';
            el.style.top = el.offsetTop + 'px';
            el.style.left = el.offsetLeft + 'px';
        },

        // Clears the locked dimensions if the leave transition was cancelled
        catLeaveCancelled(el) {
            el.style.width = '';
            el.style.height = '';
            el.style.top = '';
            el.style.left = '';
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <TransitionGroup tag="div" name="cat-hide" class="grid" id="grocery-grid" @before-leave="catBeforeLeave" @leave-cancelled="catLeaveCancelled">
    <div v-for="cat in displayedCategories" :key="cat.id" :data-id="cat.id">
        <div class="grid-item" :class="{ 'empty-cat': cat.products.length === 0 }">
            <div class="category-header">
                <input v-if="editingCatId === cat.id" class="cat-rename-input" v-model="editingCatName"
                    @keydown.enter.prevent="commitEdit(cat)" @keydown.escape="cancelEdit" @blur="cancelEdit"
                    @click.stop />
                <template v-else>
                    <span>{{ cat.name }}</span>
                    <div class="wrap">
                        <i class="bi bi-pencil-square" @click.stop="startEdit(cat)"></i>
                    </div>
                </template>
            </div>

            <ul class="item-list">
                <li v-for="product in cat.products" :key="product.id">
                    <label class="circle-check">
                        <input class="check-me-off" v-model="product.bought" type="checkbox">
                        <span class="circle"></span>
                        <span class="item-name" :class="{ 'checked': product.bought }">
                            {{ product.product.name }}<span v-if="product.qtyHint" class="qty-hint">({{ product.qtyHint }})</span>
                        </span>
                    </label>
                    <transition name="item-swap" mode="out-in">
                        <div class="item-count" v-if="!product.bought" :key="'qty'">
                            <i :class="product.qty === 1 ? 'bi bi-trash-fill' : 'bi bi-dash-lg'"
                                @click="$emit('qty-decrease', product)"></i>
                            <p class="number">{{ product.qty }}</p>
                            <i class="bi bi-plus-lg" @click="$emit('qty-increase', product)"></i>
                        </div>
                        <base-duration-input v-else :key="'exp'" :duration="product.expiration.durationValue"
                            :unit-index="product.expiration.unitIndex" :units="units" track-width="80px" variant="grocery"
                            @update:duration="product.expiration.durationValue = $event; $emit('update-expiration', product)"
                            @update:unit-index="product.expiration.unitIndex = $event; $emit('update-expiration', product)" />
                    </transition>
                </li>
            </ul>
        </div>
    </div>
    </TransitionGroup>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

.item-count {
    display: flex;
    margin-left: auto;


    i {
        opacity: .5;
        transition: opacity 0.3s ease-in-out;
        cursor: pointer;
        padding-right: 15px;
        padding-left: 15px;

        &:hover {
            opacity: 1;
        }
    }

    .bi-trash-fill {
        color: var(--danger);
    }

    .number {
        font-weight: 600;
    }
}

.empty-cat {
    opacity: 0.4;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 1;
    }
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    align-items: start;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

.grid-item {
    width: 100%;
    border-radius: 20px;
    transition: background-color 0.4s ease, border-radius 0.4s ease;

    .item-list {
        max-height: 2000px;
        overflow: hidden;
        opacity: 1;
        transition: max-height 0.4s ease, opacity 0.25s ease;
    }
}

.cat-rename-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid currentColor;
    outline: none;
    font-family: "Oxygen";
    font-weight: 500;
    font-size: inherit;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: inherit;
    width: 100%;
    padding: 0;
}

.category-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px;
    padding-left: 30px;
    margin-bottom: 0;
    font-family: "Oxygen";
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 20px 20px 0px 0px;
    border-bottom: 1px solid var(--border-subtle);
    user-select: none;
    transition: border-radius 0.4s ease, padding 0.35s ease,
        border-bottom 0.3s ease, opacity 0.3s ease;

    .wrap {
        margin-left: auto;
        min-width: 20px;

        .bi-pencil-square {
            cursor: pointer;
            opacity: 0.5;

            &:hover {
                opacity: 1;
            }
        }
    }

    input {
        border: none;
        border-bottom: 1px solid currentColor;
        font-family: "Oxygen";
        font-size: small;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        outline: none;
        width: 300px;
        opacity: 0.8;

        &.input-error {
            border-bottom: none;
            border: 2px solid var(--danger);
            border-radius: 4px;
            padding: 2px 6px;
        }
    }
}


.item-list {
    list-style: none;
    margin: 0;
    border-radius: 0px 0px 20px 20px;
    padding-left: 0px;
}




.item-list li {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;
    height: 60px;

}


// qty ↔ duration-input swap transition
.item-swap-enter-active,
.item-swap-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.item-swap-leave-to {
    opacity: 0;
    transform: translateX(-6px);
}

.item-swap-enter-from {
    opacity: 0;
    transform: translateX(6px);
}

.item-name {
    position: relative;
    display: inline-block;
    transition: color 0.3s ease;
}

.qty-hint {
    font-size: 0.75rem;
    opacity: 0.4;
    margin-left: 4px;
    font-style: italic;
}

.item-name.checked+.item-count i {
    opacity: 0;
    pointer-events: none;
}

.item-name::after {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 0;
    height: 2px;
    transform: translateY(-50%);
    transition: width 0.3s ease;
    /* animation */
}

.item-name.checked::after {
    width: 100%;
}

.item-name.checked {
    color: var(--text-faint);
    /* optional fade out */
}

.bi-dash {
    pointer-events: all;
}

.bi-plus {
    pointer-events: all;
}

.grid {
    position: relative;
}

.cat-hide-move {
    transition: transform 0.45s ease;
}

.cat-hide-enter-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.cat-hide-enter-from {
    opacity: 0;
    transform: scale(0.92) translateY(6px);
}

.cat-hide-leave-active {
    position: absolute;
    pointer-events: none;
    transition: opacity 0.32s ease, transform 0.38s ease;
    z-index: 5;
}

.cat-hide-leave-to {
    opacity: 0;
    transform: scale(0.88) translateY(-8px);
}




label {
    pointer-events: all;
}

.check-me-off {
    display: none;
    /* hide default checkbox */
}

.circle-check {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--text-opposite);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.1s ease;
}

.check-me-off:checked+.circle {
    animation: colorGrow 0.4s ease forwards;
    border-color: transparent;
}

.check-me-off:checked+.circle::after {
    content: '✓';
    color: white;
    font-size: 13px;
    font-weight: bold;
}

@keyframes colorGrow {
    0% {
        transform: scale(1);
        background-color: #60a5fa;
        /* blue */
    }

    50% {
        transform: scale(1.3);
        background-color: #34d399;
        /* teal in between */
    }

    100% {
        transform: scale(1.1);
        background-color: #22c55e;
        /* green */
    }
}

// ── Mobile layout ─────────────────────────────────────────────
@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .grid-item {
        border-radius: 14px;
        margin-bottom: 0;
        background: var(--bg);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .category-header {
        padding: 12px 16px;
        border-radius: 14px 14px 0 0;
        font-size: 0.78rem;
    }

    .item-list {
        border-radius: 0 0 14px 14px;
    }

    .item-list li {
        height: auto;
        min-height: 50px;
        padding: 10px 14px;
    }

    .item-count i {
        padding: 8px 12px;
        font-size: 1rem;
    }

    .circle {
        border-color: var(--border-subtle);
    }
}
</style>
