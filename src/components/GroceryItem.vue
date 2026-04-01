<script>
import BaseDurationInput from './BaseDurationInput.vue';

export default {
    name: "GroceryItem",

    components: { BaseDurationInput },

    props: {
        sortedByCat: { type: Array, required: true },
        categories: { type: Array, required: true },
        filteredShoppingList: { type: Array, required: true },
        selectedCategoryGrocery: { type: Object, default: () => ({ name: '' }) },
        isDesktop: { type: Boolean, required: true },
        isMobile: { type: Boolean, required: true },
        units: { type: Array, required: true },
    },

    emits: [
        'select-category',
        'rename-category',
        'qty-increase',
        'qty-decrease',
        'update-expiration',
        'move-item',
    ],

    data() {
        return {
            dragOverCatId: null,
            editingCatId: null,
            editingCatName: '',
        };
    },

    mounted() {
        this.initSortable();
    },

    watch: {
        sortedByCat() {
            this.$nextTick(() => {
                if ($('.item-list').data('ui-sortable')) {
                    $('.item-list').sortable('refresh');
                }
            });
        },
    },

    methods: {
        handleCategoryClick(cat) {
            this.$emit('select-category', cat);
        },

        startEdit(cat) {
            this.editingCatId = cat.id;
            this.editingCatName = cat.name;
            this.$nextTick(() => {
                const input = document.querySelector('.cat-rename-input');
                if (input) input.focus();
            });
        },

        commitEdit(cat) {
            const newName = this.editingCatName.trim();
            if (newName && newName !== cat.name) {
                this.$emit('rename-category', { id: cat.id, newName });
            }
            this.editingCatId = null;
            this.editingCatName = '';
        },

        cancelEdit() {
            this.editingCatId = null;
            this.editingCatName = '';
        },

        initSortable() {
            const vm = this;
            $('.item-list').sortable({
                connectWith: '.item-list',
                delay: 200,
                cancel: '.item-count, .item-count *, input, .circle',
                helper: 'clone',
                appendTo: 'body',
                tolerance: 'pointer',
                start() {
                    if (vm.isMobile) {
                        document.querySelector('#grocery-grid').classList.add('mobile-dragging');
                    }
                },
                stop() {
                    document.querySelector('#grocery-grid').classList.remove('mobile-dragging');
                    vm.dragOverCatId = null;
                },
                over() {
                    if (vm.isMobile) {
                        vm.dragOverCatId = parseInt($(this).data('cat-id'));
                    }
                },
                out() {
                    if (vm.isMobile) {
                        vm.dragOverCatId = null;
                    }
                },
                receive(event, ui) {
                    const newCatId = parseInt($(this).data('cat-id'));
                    const productId = parseInt($(ui.item).data('product-id'));
                    const dropIndex = $(ui.item).index();
                    vm.$emit('move-item', { productId, newCatId, dropIndex });
                },
            });
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div v-for="(cat, index) in sortedByCat" :key="cat.id" :data-id="cat.id">
        <div class="grid-item" v-if="cat.products.length !== 0" :class="{ 'drag-target': dragOverCatId === cat.id }">
            <div class="sort-box">
                <div class="category-header" @click="editingCatId !== cat.id && handleCategoryClick(cat)">
                    <input v-if="editingCatId === cat.id" class="cat-rename-input" v-model="editingCatName"
                        @keydown.enter.prevent="commitEdit(cat)" @keydown.escape="cancelEdit" @blur="cancelEdit"
                        @click.stop />
                    <template v-else>
                        <span :class="{ 'active-header': selectedCategoryGrocery.name == cat.name }">{{ cat.name
                            }}</span>
                        <div class="wrap">
                            <i class="bi bi-pencil-square" @click.stop="startEdit(cat)"></i>
                        </div>
                    </template>
                </div>
            </div>

            <ul class="item-list" :data-cat-id="cat.id">
                <li v-for="product in cat.products" :key="product.id" :data-product-id="product.id">
                    <label class="circle-check">
                        <input class="check-me-off" v-model="product.bought" type="checkbox">
                        <span class="circle"></span>
                        <span class="item-name" :class="{ 'checked': product.bought }">{{ product.name }}</span>
                    </label>
                    <transition name="item-swap" mode="out-in">
                        <div class="item-count" v-if="!product.bought" :key="'qty'">
                            <i :class="product.qty === 1 ? 'bi bi-trash-fill' : 'bi bi-dash-lg'"
                                @click="$emit('qty-decrease', product)"></i>
                            <p class="number">{{ product.qty }}</p>
                            <i class="bi bi-plus-lg" @click="$emit('qty-increase', product)"></i>
                        </div>
                        <base-duration-input v-else :key="'exp'" :duration="product.durationValue"
                            :unit-index="product.selectedUnit" :units="units" track-width="80px"
                            @update:duration="product.durationValue = $event; $emit('update-expiration', product)"
                            @update:unit-index="product.selectedUnit = $event; $emit('update-expiration', product)" />
                    </transition>
                </li>
            </ul>
        </div>
    </div>
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

.grid-item {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    width: 100%;
    border-radius: 20px;
    margin-bottom: 20px;
    transition: background-color 0.4s ease, box-shadow 0.4s ease,
        border-radius 0.4s ease, margin-bottom 0.4s ease;

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

.sort-box {
    position: relative;
    z-index: 1;
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
    user-select: none;
    transition: border-radius 0.4s ease, padding 0.35s ease,
        border-bottom 0.3s ease, opacity 0.3s ease;

    .grip {
        cursor: grab;
        opacity: 0.4;
        font-size: 1.1rem;
        line-height: 1;
        flex-shrink: 0;

        &:active {
            cursor: grabbing;
        }
    }

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
    /* optional fade */
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

// ── Duration input inside item list ──
//TODO: should this be here?
.item-list .duration-input {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
    margin-right: 20px;
}


.item-list .duration-number {
    width: 36px;
    font-family: "Oxygen";
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    border-radius: 5px;
    color: var(--text);
    padding: 3px 0;
    background: transparent;
    border: none;
    border: 1px solid var(--border);
    transition: border-color .2s;

    &:focus {
        outline: none;
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
    }
}

.item-list .unit-switcher {
    display: flex;
    align-items: center;
}

.item-list .unit-arrow {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.55rem;
    opacity: 0.25;
    padding: 4px 3px;
    transition: opacity .15s, transform .15s;
    line-height: 1;
    color: var(--text);

    &:hover {
        opacity: .85;
    }

    &.left:hover {
        transform: translateX(-2px);
    }

    &.right:hover {
        transform: translateX(2px);
    }
}

.item-list .unit-display {
    overflow: hidden;
    width: 80px;
    height: 24px;
    display: flex;
    align-items: center;
}

.item-list .unit-track {
    display: flex;
    transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);

    span {
        flex: 0 0 80px;
        text-align: center;
        font-family: "Inter";
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.03em;
        color: var(--text-muted);
    }
}
</style>
