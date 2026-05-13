<script>
import PantryExpiration from './PantryExpiration.vue';
import BaseDurationInput from './BaseDurationInput.vue';
import Expiration from '../models/Expiration.js';
import { QUANTITY_UNITS } from '../data/ingredientDefaults.js';

export default {
    name: "PantryItemRow",
    components: { PantryExpiration, BaseDurationInput },
    props: {
        item: { type: Object, required: true },
        product: { type: Object, required: true },
        locations: { type: Array, default: () => [] },
        units: { type: Array, required: true },
        categories: { type: Array, default: () => [] },
        showRestock: { type: Boolean, default: false },
        showDefaults: { type: Boolean, default: false },
        rowClass: { type: String, default: '' },
    },
    emits: ['delete', 'location-change', 'restock-change'],
    data() {
        return {
            activePanel: null, // 'qty' | 'exp' | null
            isEditingQty: false,
            editingQtyValue: 1,
            editingExpValue: 1,
            editingExpUnitIndex: 0,
            quantityUnits: QUANTITY_UNITS,
        };
    },
    computed: {
        restockClass() {
            if (!this.product.restock) return '';
            const totalQty = this.item.qty;
            if (this.product.restockThreshold) {
                return totalQty < 0.25 * this.product.defaultQty ? 'stock-below' : 'stock-above';
            }
            const targetQty = this.product.restockQty * this.product.defaultQty;
            const deficit = targetQty - totalQty;
            if (deficit > 0) return 'stock-below';
            if (deficit === 0) return 'stock-even';
            return 'stock-above';
        },
    },

    methods: {
        // Toggles the named detail panel open or closed; seeds expiration fields when opening the exp panel
        togglePanel(panel) {
            if (this.activePanel === panel) {
                this.activePanel = null;
            } else {
                if (panel === 'exp') {
                    const { value, unitIndex } = Expiration.toComponents(this.item.expiration.toDate());
                    this.editingExpValue = value;
                    this.editingExpUnitIndex = unitIndex;
                }
                this.activePanel = panel;
            }
        },
        // Enters inline quantity edit mode, seeding the input with the item's current qty
        startEditQty() {
            this.editingQtyValue = this.item.qty;
            this.isEditingQty = true;
            this.$nextTick(() => this.$el.querySelector('.qty-input')?.select());
        },
        // Parses and applies the edited quantity, then exits inline qty edit mode
        commitQty() {
            const val = Math.round(parseFloat(this.editingQtyValue) * 100) / 100;
            if (!isNaN(val) && val >= 0) this.item.qty = val;
            this.isEditingQty = false;
        },
        // Updates the expiration when the duration value changes
        onExpDurationChange(val) {
            this.editingExpValue = val;
            this.item.expiration = Expiration.fromDate(Expiration.compute(val, this.editingExpUnitIndex));
        },
        // Updates the expiration when the unit index changes
        onExpUnitIndexChange(idx) {
            this.editingExpUnitIndex = idx;
            this.item.expiration = Expiration.fromDate(Expiration.compute(this.editingExpValue, idx));
        },
        // Syncs the unit change to both the item and the product default
        onUnitChange(unit) {
            this.item.unit = unit;
            this.product.defaultUnit = unit;
        },
        // Updates the item's location and emits location-change to the parent
        onLocationChange(val) {
            const loc = val || null;
            this.item.location = loc;
            this.$emit('location-change', loc);
        },
        // Sets the product's restockThreshold flag and emits a restock-change event
        setRestockThreshold(val) {
            this.product.restockThreshold = val;
            this.$emit('restock-change');
        },
        // Initializes restockQty, emits restock-change, and focuses the qty input if restock was just enabled
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
    },
}
</script>

<template>
    <div :class="rowClass">

        <!-- Compact row (always visible) -->
        <div class="row compact-row align-items-center py-2" :class="{ 'row-open': activePanel }">

            <div class="col-1 expand-col" @click.stop="activePanel = null">
                <i v-if="activePanel" class="bi bi-chevron-up"></i>
            </div>

            <div class="col-9 truncate name-col">{{ item.product.name }}</div>

            <div class="col-4 qty-col" :class="{ 'cell-active': activePanel === 'qty' }" @click.stop="togglePanel('qty')">
                <span class="qty-display">{{ item.qty }} {{ item.unit }}</span>
            </div>

            <div class="col-7 exp-col" :class="{ 'cell-active': activePanel === 'exp' }" @click.stop="togglePanel('exp')">
                <pantry-expiration :item="item" />
            </div>

            <div class="col-6 truncate cat-col" :class="{ 'cell-active': activePanel === 'cat' }" @click.stop="togglePanel('cat')">
                {{ item.product.category }}
            </div>

            <div class="col-6 loc-col" :class="{ 'cell-active': activePanel === 'loc' }" @click.stop="togglePanel('loc')">
                <span class="loc-display">{{ item.location || '—' }}</span>
            </div>

            <div class="col-4 restock-col" @click.stop>
                <template v-if="showRestock">
                    <label class="restock-toggle">
                        <input type="checkbox" v-model="product.restock" @change="onRestockChange" class="restock-cb-hidden">
                        <div class="restock-pill" :class="[{ checked: product.restock && !product.restockThreshold, 'checked-circle': product.restock && product.restockThreshold }, restockClass]">
                            <input v-if="product.restock && !product.restockThreshold" type="number" min="1"
                                v-model.number="product.restockQty"
                                @change="$emit('restock-change')" @click.stop class="restock-qty-num">
                            <svg class="restock-check-icon" viewBox="0 0 20 20" fill="none">
                                <polyline class="restock-checkmark" points="3,11 8,16 17,5"></polyline>
                            </svg>
                        </div>
                    </label>
                </template>
            </div>

            <div class="col-3 trash-col" @click.stop>
                <div class="delete-btn" @click="$emit('delete', { item, product })">
                    <svg viewBox="0 0 35.6 35.6">
                        <rect class="bg" x="0" y="0" width="35.6" height="35.6" rx="4" ry="4"></rect>
                        <line class="x-line" x1="11" y1="11" x2="24.6" y2="24.6"></line>
                        <line class="x-line" x1="24.6" y1="11" x2="11" y2="24.6"></line>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Detail panel -->
        <transition name="detail-slide">
            <div v-if="activePanel" class="detail-panel">

                <!-- QTY PANEL -->
                <template v-if="activePanel === 'qty'">
                    <div class="detail-section">
                        <span class="detail-label">THIS ITEM</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Qty</span>
                                <div class="qty-controls">
                                    <button class="qty-btn" :class="{ invisible: !item.canDecrease() }" @click="item.decreaseQty()">−</button>
                                    <transition name="qty-swap" mode="out-in">
                                        <input v-if="isEditingQty" key="input" class="qty-input" type="number" min="0" step="1"
                                            v-model.number="editingQtyValue"
                                            @blur="commitQty"
                                            @keydown.enter.prevent="commitQty"
                                            @keydown.escape="isEditingQty = false"
                                            @click.stop />
                                        <span v-else key="val" class="qty-val" @click.stop="startEditQty">{{ item.qty }}</span>
                                    </transition>
                                    <button class="qty-btn" @click="item.increaseQty()">+</button>
                                </div>
                            </div>

                            <div class="detail-field">
                                <span class="field-label">Unit</span>
                                <select class="detail-select" :value="item.unit" @change="onUnitChange($event.target.value)">
                                    <option v-for="u in quantityUnits" :key="u" :value="u">{{ u }}</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    <div class="detail-section defaults-section" v-if="showDefaults">
                        <span class="detail-label">Product Default:</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Qty</span>
                                <input type="number" min="0.1" step="0.1" class="default-num-input"
                                    v-model.number="product.defaultQty">
                            </div>

                            <div class="detail-field">
                                <span class="field-label">Unit</span>
                                <select class="detail-select" v-model="product.defaultUnit">
                                    <option v-for="u in quantityUnits" :key="u" :value="u">{{ u }}</option>
                                </select>
                            </div>

                            <div class="detail-field">
                                <span class="field-label">Restock</span>
                                <div class="mode-switch">
                                    <button :class="['mode-opt', { active: product.restockThreshold }]" @click="setRestockThreshold(true)">When low</button>
                                    <button :class="['mode-opt', { active: !product.restockThreshold }]" @click="setRestockThreshold(false)">Count</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </template>

                <!-- EXP PANEL -->
                <template v-if="activePanel === 'exp'">
                    <div class="detail-section">
                        <span class="detail-label">This item</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Expires in</span>
                                <base-duration-input
                                    :duration="editingExpValue"
                                    :unit-index="editingExpUnitIndex"
                                    :units="units"
                                    track-width="72px"
                                    @update:duration="onExpDurationChange($event)"
                                    @update:unit-index="onExpUnitIndexChange($event)" />
                            </div>

                        </div>
                    </div>

                    <div class="detail-section defaults-section" v-if="showDefaults">
                        <span class="detail-label">Product Default:</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Shelf life</span>
                                <base-duration-input
                                    :duration="product.defaultDurationValue"
                                    :unit-index="product.defaultUnitIndex"
                                    :units="units"
                                    track-width="72px"
                                    @update:duration="product.defaultDurationValue = $event"
                                    @update:unit-index="product.defaultUnitIndex = $event" />
                            </div>

                        </div>
                    </div>
                </template>

                <!-- LOC PANEL -->
                <template v-if="activePanel === 'loc'">
                    <div class="detail-section">
                        <span class="detail-label">This item</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Location</span>
                                <select class="detail-select" :value="item.location || ''" @change="onLocationChange($event.target.value)">
                                    <option value="">—</option>
                                    <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    <div class="detail-section defaults-section" v-if="showDefaults">
                        <span class="detail-label">Product Default:</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Location</span>
                                <select class="detail-select"
                                    :value="product.defaultLocation || ''"
                                    @change="product.defaultLocation = $event.target.value || null">
                                    <option value="">—</option>
                                    <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
                                </select>
                            </div>

                        </div>
                    </div>
                </template>

                <!-- CAT PANEL -->
                <template v-if="activePanel === 'cat'">
                    <div class="detail-section">
                        <span class="detail-label">Category</span>
                        <div class="detail-fields">

                            <div class="detail-field">
                                <span class="field-label">Category</span>
                                <select class="detail-select" v-model="product.category">
                                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                                </select>
                            </div>

                        </div>
                    </div>
                </template>

            </div>
        </transition>

    </div>
</template>

<style lang="scss" scoped>

// ── Compact row ───────────────────────────────────────────────

.compact-row {
    transition: background 0.15s ease;
    &:hover { background: var(--surface); }
    &.row-open { background: var(--surface); }
}

.expand-col {
    color: var(--text-muted);
    font-size: 0.65rem;
    display: flex;
    align-items: center;
}

.name-col { font-size: 0.9rem; }

.qty-col {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.qty-display {
    font-size: 0.82rem;
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-muted);
    transition: background 0.12s, color 0.12s;
    white-space: nowrap;
}

.qty-col:hover .qty-display,
.qty-col.cell-active .qty-display {
    background: var(--surface2);
    color: var(--text);
}

.qty-col.cell-active .qty-display {
    background: var(--surface3);
}

.exp-col {
    padding-right: 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.12s;

    &:hover { background: var(--surface2); }
    &.cell-active { background: var(--surface3); }

    :deep(.progress-wrapper),
    :deep(.exp-track) {
        width: 100%;
    }
}

.cat-col {
    font-size: 0.78rem;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    transition: background 0.12s, color 0.12s;
    &:hover, &.cell-active { background: var(--surface2); color: var(--text); }
    &.cell-active { background: var(--surface3); }
}

.loc-col {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.loc-display {
    font-size: 0.78rem;
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-muted);
    transition: background 0.12s, color 0.12s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.loc-col:hover .loc-display,
.loc-col.cell-active .loc-display {
    background: var(--surface2);
    color: var(--text);
}

.loc-col.cell-active .loc-display {
    background: var(--surface3);
}

.restock-col, .trash-col {
    display: flex;
    align-items: center;
    justify-content: center;
}

.invisible { visibility: hidden; pointer-events: none; }

// ── Detail panel ──────────────────────────────────────────────

.detail-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 52px;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 2px solid var(--border-subtle);
    background: var(--surface2);
    margin-left: -0.75rem;
    margin-right: -0.75rem;
    padding: 0 16px;
    box-shadow: inset 5px 0 0 var(--sage);
}

.detail-section {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 20px 0 0;

    &.defaults-section {
        border-left: 2px solid var(--sage);
        padding-left: 20px;
        padding-right: 0;
    }
}

.detail-label {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text);
    font-family: 'Oxygen', sans-serif;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
    opacity: 0.55;
}

.detail-fields {
    display: flex;
    align-items: center;
    gap: 14px;
}

.detail-field {
    display: flex;
    align-items: center;
    gap: 5px;
}

.field-label {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
}

// ── Qty controls (in detail panel) ───────────────────────────

.qty-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.qty-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: none;
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--text-muted);
    background: transparent;
    transition: color 0.15s ease, background 0.15s ease;
    &:hover { color: var(--text); background: var(--surface3); }
    &:active { background: var(--surface4); }
}

.qty-val {
    font-size: 1rem;
    font-weight: 600;
    min-width: 28px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    padding: 1px 4px;
    transition: background 0.12s;
    &:hover { background: var(--surface2); }
}

.qty-input {
    width: 48px;
    text-align: center;
    border: none;
    border-bottom: 1.5px solid var(--sage);
    background: transparent;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    outline: none;
    padding: 1px 2px;
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    &[type=number] { -moz-appearance: textfield; appearance: textfield; }
}

.qty-swap-enter-active, .qty-swap-leave-active { transition: opacity 0.1s ease; }
.qty-swap-enter-from, .qty-swap-leave-to { opacity: 0; }

// ── Inputs in detail panel ────────────────────────────────────

.detail-select {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text);
    font-family: 'Quicksand', sans-serif;
    font-size: 0.85rem;
    padding: 2px 4px;
    cursor: pointer;
    outline: none;
    option { background: var(--bg); color: var(--text); }
}

.default-num-input {
    width: 52px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text);
    font-family: 'Quicksand', sans-serif;
    font-size: 0.9rem;
    text-align: center;
    padding: 2px 4px;
    outline: none;
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    &[type=number] { -moz-appearance: textfield; appearance: textfield; }
}

// ── Restock mode switch ───────────────────────────────────────

.mode-switch {
    display: flex;
    gap: 2px;
    background: var(--surface3);
    border-radius: 5px;
    padding: 2px;
}

.mode-opt {
    background: transparent;
    border: none;
    border-radius: 3px;
    font-size: 0.6rem;
    font-family: 'Quicksand', sans-serif;
    font-weight: 600;
    padding: 2px 7px;
    cursor: pointer;
    color: var(--text-muted);
    line-height: 1.4;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    &:hover { color: var(--text); }
    &.active {
        background: var(--surface);
        color: var(--text);
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
}

// ── Slide transition ──────────────────────────────────────────

.detail-slide-enter-active,
.detail-slide-leave-active {
    transition: max-height 0.22s ease, opacity 0.18s ease;
    overflow: hidden;
    max-height: 56px;
}
.detail-slide-enter-from,
.detail-slide-leave-to {
    max-height: 0;
    opacity: 0;
}

// ── Row variants ──────────────────────────────────────────────


.batch-row {
    .compact-row { background: var(--surface); }
}

// ── Delete button ─────────────────────────────────────────────

.delete-btn {
    width: 20px;
    height: 20px;
    cursor: pointer;
    svg { width: 20px; height: 20px; display: block; }
    .bg { fill: #b3b3b3; transition: fill 0.3s ease; }
    .x-line {
        stroke: #fff;
        stroke-width: 2.5px;
        stroke-linecap: round;
        stroke-dasharray: 20;
        stroke-dashoffset: 20;
        transition: stroke-dashoffset 0.3s ease;
        &:nth-child(3) { transition-delay: 0.15s; }
    }
    &:hover .bg { fill: #c0392b; }
    &:hover .x-line { stroke-dashoffset: 0; }
}

// ── Restock pill ──────────────────────────────────────────────

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
        &.stock-even  { background: #f0b429; }
        &.stock-below { background: #e05252; }
    }

    &.checked-circle {
        background: #6cbe45;
        &.stock-below { background: #e05252; }
    }
}

.restock-check-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-left: auto;
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

.restock-pill.checked .restock-checkmark,
.restock-pill.checked-circle .restock-checkmark { stroke-dashoffset: 0; }

.restock-qty-num {
    width: 44px;
    background: rgba(255,255,255,0.25);
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 1rem;
    text-align: center;
    padding: 2px;
    margin-left: 8px;
    margin-right: 4px;
    flex-shrink: 0;
    opacity: 0;
    animation: restock-qty-in 0.2s ease 0.35s forwards;

    &:focus { outline: none; background: rgba(255,255,255,0.4); }
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    &[type=number] { -moz-appearance: textfield; appearance: textfield; }
}

@keyframes restock-qty-in {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
}

</style>
