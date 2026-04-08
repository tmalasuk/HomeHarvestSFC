<script>
import PantryExpiration from './PantryExpiration.vue';
import BaseDurationInput from './BaseDurationInput.vue';
import { computeExpirationDate, getDurationValueAndUnit } from '../utils.js';

export default {
    name: "PantryRow",

    components: { PantryExpiration, BaseDurationInput },

    data() {
        return {
            editingNameItemId: null,
            editingNameValue: '',
            editingExpItemId: null,
            editingExpValue: 1,
            editingExpUnitIndex: 0,
            isDragging: false,
        };
    },

    props: {
        product: { type: Object, required: true },
        isMobile: { type: Boolean, required: true },
        index: { type: Number, required: true },
        units: { type: Array, required: true },
    },

    methods: {
        toggleBatchOpen() {
            this.product.isOpen = !this.product.isOpen;
        },

        onRestockChange() {
            if (this.product.restock && !this.product.restockQty) {
                this.product.restockQty = 1;
            }
            this.$emit('restock-change');
            if (this.product.restock) {
                this.$nextTick(() => {
                    this.$el.querySelector('.restock-qty-num')?.focus();
                });
            }
        },

        startEditName(item) {
            this.editingNameItemId = item.id;
            this.editingNameValue = item.name;
            this.$nextTick(() => {
                const input = this.$el.querySelector('.inline-name-input');
                if (input) { input.focus(); input.select(); }
            });
        },

        commitName(item, product) {
            const trimmed = this.editingNameValue.trim();
            this.editingNameItemId = null;
            if (!trimmed) return;
            item.name = trimmed;
            this.$emit('stop-editing-name', { item, product });
        },

        cancelName() {
            this.editingNameItemId = null;
        },

        adjustQty(item, delta) {
            item.qty = Math.min(100, Math.max(0, item.qty + delta));
        },

        startEditExp(item) {
            const { value, unitIndex } = getDurationValueAndUnit(new Date(item.expiration));
            this.editingExpValue = value;
            this.editingExpUnitIndex = unitIndex;
            this.editingExpItemId = item.id;
            this.$nextTick(() => {
                this.$el.querySelector('.exp-inline-editor .duration-number')?.focus();
            });
        },

        commitExp(item) {
            const unit = this.units[this.editingExpUnitIndex];
            item.expiration = computeExpirationDate(this.editingExpValue, unit);
            this.editingExpItemId = null;
        },

        cancelExp() {
            this.editingExpItemId = null;
        },

        onDragStart(e) {
            e.dataTransfer.setData('productId', String(this.product.id));
            e.dataTransfer.effectAllowed = 'move';
            this.isDragging = true;
        },
        onDragEnd() {
            this.isDragging = false;
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div class="product" :class="{ 'row-dragging': isDragging }" @dragend="onDragEnd">

        <!-- Main row -->
        <div :class="{
            'row': true,
            'align-items-center': true,
            'py-2 td': true,
            'batch-header-open': product.isOpen
        }">

            <!-- Batch toggle or empty -->
            <div class="col-1 edit dropdown" v-if="product.batch.length > 1" @click="toggleBatchOpen">
                <i :class="product.isOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
            </div>
            <div class="col-1" v-else></div>

            <!-- Name -->
            <div class="col-md-10 col-12 truncate">
                <template v-if="product.batch.length === 1">
                    <input v-if="editingNameItemId === product.batch[0].id" class="inline-name-input"
                        v-model="editingNameValue" @blur="commitName(product.batch[0], product)"
                        @keyup.enter="commitName(product.batch[0], product)" @keyup.escape="cancelName" />
                    <span v-else class="editable-name" @click="startEditName(product.batch[0])">{{ product.name
                    }}</span>
                </template>
                <template v-else>
                    {{ product.name }} <span>(x{{ product.batch.length }})</span>
                </template>
            </div>

            <!-- Qty -->
            <div class="col-md-7 col-6">
                <div v-if="!product.isOpen" class="qty-controls">
                    <template v-if="product.batch.length === 1">
                        <button class="qty-btn" @click.stop="adjustQty(product.batch[0], -10)">−</button>
                        <span class="qty-val">{{ product.batch[0].qty }}%</span>
                        <button class="qty-btn" @click.stop="adjustQty(product.batch[0], 10)">+</button>
                    </template>
                    <template v-else>
                        <span class="qty-val">{{ product.getMaxBatchQtyPercent() }}%</span>
                    </template>
                </div>
            </div>

            <!-- Expiration -->
            <div class="col-md-7 col-10">
                <template v-if="!product.isOpen">
                    <transition name="exp-swap" mode="out-in">
                        <div v-if="product.batch.length === 1 && editingExpItemId === product.batch[0].id" key="editor"
                            class="exp-inline-editor" @click.stop>
                            <base-duration-input :duration="editingExpValue" :unit-index="editingExpUnitIndex"
                                :units="units" track-width="72px" @update:duration="editingExpValue = $event"
                                @update:unit-index="editingExpUnitIndex = $event" />
                            <button class="exp-confirm-btn" @click.stop="commitExp(product.batch[0])">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        </div>
                        <div v-else key="badge" :class="{ 'exp-badge-wrap': product.batch.length === 1 }"
                            @click.stop="product.batch.length === 1 && startEditExp(product.batch[0])">
                            <pantry-expiration :batch="product.batch" />
                        </div>
                    </transition>
                </template>
            </div>

            <!-- Category -->
            <div class="col-md-7 col-0 drag-handle" draggable="true" @dragstart="onDragStart">{{ product.category }}</div>

            <!-- Trash -->
            <div class="col-md-3 col-4 trash">
                <div v-if="product.batch.length == 1" class="delete-btn" @click="$emit('delete-product', product)">
                    <svg viewBox="0 0 35.6 35.6">
                        <rect class="bg" x="0" y="0" width="35.6" height="35.6" rx="4" ry="4"></rect>
                        <line class="x-line" x1="11" y1="11" x2="24.6" y2="24.6"></line>
                        <line class="x-line" x1="24.6" y1="11" x2="11" y2="24.6"></line>
                    </svg>
                </div>
            </div>

            <!-- Restock -->
            <div class="col-md-3 col-4 restock">
                <label class="restock-toggle" @click.stop>
                    <input type="checkbox" v-model="product.restock" @change="onRestockChange"
                        class="restock-cb-hidden">
                    <div class="restock-pill" :class="{ checked: product.restock }">
                        <svg class="restock-check-icon" viewBox="0 0 20 20" fill="none">
                            <polyline class="restock-checkmark" points="3,11 8,16 17,5"></polyline>
                        </svg>
                        <input v-if="product.restock" type="number" min="1" v-model.number="product.restockQty"
                            @change="$emit('restock-change')" @click.stop class="restock-qty-num">
                    </div>
                </label>
            </div>

            <div class="col-md-0 col-3"></div>
        </div>

        <!-- Batch rows (multi-batch only) -->
        <transition name="slide" v-if="product.batch.length > 1" v-for="(item) in product.batch" :key="item.id"
            :class="'batch-content-' + product.name" v-show="product.isOpen">
            <div class="row batch-row">
                <div class="col-40">
                    <div class="row align-items-center py-2">

                        <div class="col-1"></div>

                        <!-- Name -->
                        <div class="col-md-10 col-10">
                            <input v-if="editingNameItemId === item.id" class="inline-name-input"
                                v-model="editingNameValue" @blur="commitName(item, product)"
                                @keyup.enter="commitName(item, product)" @keyup.escape="cancelName" />
                            <span v-else class="editable-name" @click="startEditName(item)">{{ item.name }}</span>
                        </div>

                        <!-- Qty -->
                        <div class="col-md-7 col-8">
                            <div class="qty-controls">
                                <button class="qty-btn" @click.stop="adjustQty(item, -10)">−</button>
                                <span class="qty-val">{{ item.qty }}%</span>
                                <button class="qty-btn" @click.stop="adjustQty(item, 10)">+</button>
                            </div>
                        </div>

                        <!-- Expiration -->
                        <div class="col-md-7 col-10">
                            <transition name="exp-swap" mode="out-in">
                                <div v-if="editingExpItemId === item.id" key="editor" class="exp-inline-editor"
                                    @click.stop>
                                    <base-duration-input :duration="editingExpValue" :unit-index="editingExpUnitIndex"
                                        :units="units" track-width="72px" @update:duration="editingExpValue = $event"
                                        @update:unit-index="editingExpUnitIndex = $event" />
                                    <button class="exp-confirm-btn" @click.stop="commitExp(item)">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                    <button class="exp-cancel-btn" @click.stop="cancelExp">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div v-else key="badge" class="exp-badge-wrap" @click.stop="startEditExp(item)">
                                    <pantry-expiration :item="item" />
                                </div>
                            </transition>
                        </div>

                        <!-- Category -->
                        <div class="col-md-7 col-0">{{ item.category }}</div>

                        <!-- Trash -->
                        <div class="col-md-3 col-4 trash">
                            <div class="delete-btn" @click="$emit('delete-item', { item, product })">
                                <svg viewBox="0 0 35.6 35.6">
                                    <rect class="bg" x="0" y="0" width="35.6" height="35.6" rx="4" ry="4"></rect>
                                    <line class="x-line" x1="11" y1="11" x2="24.6" y2="24.6"></line>
                                    <line class="x-line" x1="24.6" y1="11" x2="11" y2="24.6"></line>
                                </svg>
                            </div>
                        </div>

                        <div class="col-md-3 col-4"></div>
                    </div>
                </div>
            </div>
        </transition>

    </div>
</template>

<style lang="scss" scoped>
.editable-name {
    cursor: pointer;

    &:hover {
        text-decoration: underline dotted;
    }
}

.inline-name-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid currentColor;
    outline: none;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    width: 100%;
}

.qty-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
}

.qty-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: #fff;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.15);
    transition: background 0.15s ease, transform 0.1s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.28);
        transform: scale(1.08);
    }

    &:active {
        transform: scale(0.93);
    }
}

.qty-val {
    font-size: medium;
    width: 32px;
    text-align: center;
}

.exp-badge-wrap {
    cursor: pointer;
}

// Draggable row
.product {
    &.row-dragging {
        opacity: 0.35;
    }
}

.drag-handle {
    cursor: grab;
}

.edit.dropdown {
    cursor: pointer;
}

// Category pill drop target highlight
.cat-pill.pill-drop-over {
    background: rgb(144, 157, 165) !important;
    border-color: rgb(144, 157, 165) !important;
    color: #fff !important;
    transform: scale(1.06);
}

// Mobile category stepper arrows
.cat-step-btn {
    border: none;
    background: none;
    cursor: pointer;
    padding: 0 3px;
    font-size: 0.8rem;
    color: inherit;
    opacity: 0.45;
    line-height: 1;
    flex-shrink: 0;

    &:hover {
        opacity: 1;
    }
}

// Inline expiration editor (replaces modal)
.exp-inline-editor {
    display: flex;
    align-items: center;
    gap: 4px;

    .exp-confirm-btn,
    .exp-cancel-btn {
        margin-left: auto;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        font-size: 1rem;
        line-height: 1;
        flex-shrink: 0;
        transition: background 0.15s ease, transform 0.1s ease;

        &:hover {
            transform: scale(1.08);
        }

        &:active {
            transform: scale(0.93);
        }
    }

    .exp-confirm-btn {
        background: rgba(76, 175, 80, 0.25);
        color: #4caf50;

        &:hover {
            background: rgba(76, 175, 80, 0.45);
        }
    }

    .exp-cancel-btn {
        background: rgba(0, 0, 0, 0.15);
        color: #fff;
        opacity: 0.7;

        &:hover {
            background: rgba(0, 0, 0, 0.28);
            opacity: 1;
        }
    }
}

// Transition: exp badge ↔ inline editor
.exp-swap-enter-active,
.exp-swap-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.exp-swap-enter-from {
    opacity: 0;
    transform: translateX(6px);
}

.exp-swap-leave-to {
    opacity: 0;
    transform: translateX(-6px);
}

.exp-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
}

.exp-preset {
    border: 1px solid currentColor;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font-size: 0.65rem;
    padding: 1px 5px;
    cursor: pointer;
    opacity: 0.7;

    &:hover {
        opacity: 1;
    }
}

.exp-date-input {
    font-size: 0.65rem;
    border: none;
    border-bottom: 1px solid currentColor;
    background: transparent;
    color: inherit;
    outline: none;
    width: 90px;
}

// ── Restock pill (shared: table row + mobile card) ──
.restock-toggle {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
}

.restock-cb-hidden {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.restock-pill {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 28px;
    height: 28px;
    border-radius: 14px;
    background: #afaea9;
    overflow: hidden;
    padding: 0 5px;
    box-sizing: border-box;
    transition:
        width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-radius 0.4s ease,
        background 0.4s ease;

    &.checked {
        width: 90px;
        border-radius: 6px;
        background: #6cbe45;
    }
}

.restock-check-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.restock-checkmark {
    fill: none;
    stroke: #fff;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    transition: stroke-dashoffset 0.3s ease 0.25s;
}

.restock-pill.checked .restock-checkmark {
    stroke-dashoffset: 0;
}

.restock-qty-num {
    width: 44px;
    background: rgba(255, 255, 255, 0.25);
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 1rem;
    text-align: center;
    padding: 2px;
    margin-left: 4px;
    flex-shrink: 0;
    opacity: 0;
    animation: restock-qty-in 0.2s ease 0.35s forwards;

    &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.4);
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    &[type=number] {
        -moz-appearance: textfield;
        appearance: textfield;
    }
}

@keyframes restock-qty-in {
    from {
        opacity: 0;
        transform: translateX(-6px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.restock-label {
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.4;
    max-width: 80px;
    overflow: hidden;
    white-space: nowrap;
    user-select: none;
    margin-left: 5px;
    transition: opacity 0.25s ease, max-width 0.3s ease, margin-left 0.3s ease;
}

.restock-pill.checked+.restock-label {
    opacity: 0;
    max-width: 0;
    margin-left: 0;
}

.td {
    .trash {
        display: flex;
    }

    .delete-btn {
        margin: 0 auto;
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .delete-btn svg {
        width: 20px;
        height: 20px;
        display: block;
    }

    .delete-btn .bg {
        fill: #b3b3b3;
        transition: fill 0.3s ease;
    }

    .delete-btn .x-line {
        stroke: #fff;
        stroke-width: 2.5px;
        stroke-linecap: round;
        stroke-dasharray: 20;
        stroke-dashoffset: 20;
        transition: stroke-dashoffset 0.3s ease;
    }

    .delete-btn .x-line:nth-child(3) {
        transition-delay: 0.15s;
    }

    .delete-btn:hover .bg {
        fill: var(--danger);
    }

    .delete-btn:hover .x-line {
        stroke-dashoffset: 0;
    }

    .restock {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
    }

    .checkbox-wrapper-31:hover .check {
        stroke-dashoffset: 0;
    }

    .checkbox-wrapper-31 {
        margin: 0 auto;
        position: relative;
        display: inline;

        svg {
            width: 25px;
            height: 25px;
            display: inline;
        }
    }

    .checkbox-wrapper-31 .background {
        fill: #afaea9;
        transition: ease all 0.6s;
        -webkit-transition: ease all 0.6s;
    }

    .checkbox-wrapper-31 .stroke {
        fill: none;
        stroke: #d0d0d0;
        stroke-miterlimit: 10;
        stroke-width: 2px;
        stroke-dashoffset: 100;
        stroke-dasharray: 100;
        transition: ease all 0.6s;
        -webkit-transition: ease all 0.6s;
    }

    .checkbox-wrapper-31 .check {
        fill: none;
        stroke: #f7f5f5;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 2px;
        stroke-dashoffset: 22;
        stroke-dasharray: 22;
        transition: ease all 0.6s;
        -webkit-transition: ease all 0.6s;
    }

    .checkbox-wrapper-31 .fancy-checkbox {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        margin: 0;
        opacity: 0;
        -appearance: none;
        -webkit-appearance: none;
    }

    .checkbox-wrapper-31 .fancy-checkbox {
        cursor: pointer;
    }

    .checkbox-wrapper-31 input[type=checkbox]:checked+svg .background {
        fill: #6cbe45;
    }

    .checkbox-wrapper-31 input[type=checkbox]:checked+svg .stroke {
        stroke-dashoffset: 0;
    }

    .checkbox-wrapper-31 input[type=checkbox]:checked+svg .check {
        stroke-dashoffset: 0;
    }

}

.td {
    vertical-align: middle;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;

    &:hover {
        border-color: var(--border-subtle);
    }
}

.batch-header-open {
    background: var(--surface3);
    border-bottom: 1px solid var(--border-subtle);
}

.batch-row {
    background: var(--surface);
}

.slide-enter-active,
.slide-leave-active {
    transition: max-height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
    max-height: 200px;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
}

.trash {
    color: var(--danger);
    display: flex;
}

.delete-btn {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin: 0 auto;
}

.delete-btn svg {
    width: 20px;
    height: 20px;
    display: block;
}

.delete-btn .bg {
    fill: #b3b3b3;
    transition: fill 0.3s ease;
}

.delete-btn .x-line {
    stroke: #fff;
    stroke-width: 2.5px;
    stroke-linecap: round;
    stroke-dasharray: 20;
    stroke-dashoffset: 20;
    transition: stroke-dashoffset 0.3s ease;
}

.delete-btn .x-line:nth-child(3) {
    transition-delay: 0.15s;
}

.delete-btn:hover .bg {
    fill: #c0392b;
}

.delete-btn:hover .x-line {
    stroke-dashoffset: 0;
}
</style>
