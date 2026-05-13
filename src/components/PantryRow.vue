<script>
import PantryExpiration from './PantryExpiration.vue';
import PantryItemRow from './PantryItemRow.vue';
import { isThresholdRestock } from '../data/ingredientDefaults.js';

export default {
    name: "PantryRow",
    components: { PantryExpiration, PantryItemRow },

    props: {
        group: { type: Object, required: true }, // { product: Product, batch: PantryItem[] }
        isMobile: { type: Boolean, required: true },
        index: { type: Number, required: true },
        units: { type: Array, required: true },
        locations: { type: Array, default: () => [] },
        categories: { type: Array, default: () => [] },
    },

    data() {
        return {
            isOpen: false,
        };
    },

    computed: {
        totalQty() {
            const sum = this.group.batch.reduce((acc, i) => acc + i.qty, 0);
            return Math.round(sum * 100) / 100;
        },

        restockClass() {
            if (!this.group.product.restock) return '';
            const totalQty = this.totalQty;
            if (isThresholdRestock(this.group.product.defaultUnit, this.group.product.defaultQty)) {
                return totalQty < 0.25 * this.group.product.defaultQty ? 'stock-below' : 'stock-above';
            }
            const targetQty = this.group.product.restockQty * this.group.product.defaultQty;
            const deficit = targetQty - this.totalQty;
            if (deficit > 0) return 'stock-below';
            if (deficit === 0) return 'stock-even';
            return 'stock-above';
        },
    },

    methods: {
        // Toggles the expanded/collapsed state of the batch sub-rows
        toggleBatchOpen() {
            this.isOpen = !this.isOpen;
        },

        // Initializes restockQty, emits restock-change, and focuses the qty input if restock was just enabled
        onRestockChange() {
            if (this.group.product.restock && !this.group.product.restockQty) {
                this.group.product.restockQty = 1;
            }
            this.$emit('restock-change');
            if (this.group.product.restock) {
                this.$nextTick(() => {
                    this.$el.querySelector('.restock-qty-num')?.focus();
                });
            }
        },

    },
}
</script>

<template>
    <div class="product">

        <!-- Multi-batch header (compact) -->
        <div v-if="group.batch.length > 1"
            class="row compact-row align-items-center py-2 td"
            :class="{ 'batch-header-open': isOpen }"
            @click="toggleBatchOpen">

            <div class="col-1 expand-col">
                <i :class="isOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
            </div>

            <div class="col-9 truncate name-col">
                {{ group.product.name }}
                <span class="batch-count">(x{{ group.batch.length }})</span>
            </div>

            <div class="col-4 qty-col">
                <span class="qty-display">{{ totalQty }} {{ group.product.defaultUnit }}</span>
            </div>

            <div class="col-7 exp-col">
                <pantry-expiration :batch="group.batch" />
            </div>

            <div class="col-6 truncate cat-col">
                {{ group.product.category }}
            </div>

            <div class="col-6 loc-col" @click.stop>
                <span class="loc-display">{{ group.product.defaultLocation || '—' }}</span>
            </div>

            <div class="col-4 restock-col" @click.stop>
                <label class="restock-toggle">
                    <input type="checkbox" v-model="group.product.restock" @change="onRestockChange"
                        class="restock-cb-hidden">
                    <div class="restock-pill" :class="[{ checked: group.product.restock }, restockClass]">
                        <input v-if="group.product.restock" type="number" min="1"
                            v-model.number="group.product.restockQty"
                            @change="$emit('restock-change')" @click.stop class="restock-qty-num">
                        <svg class="restock-check-icon" viewBox="0 0 20 20" fill="none">
                            <polyline class="restock-checkmark" points="3,11 8,16 17,5"></polyline>
                        </svg>
                    </div>
                </label>
            </div>

            <div class="col-3 trash-col"></div>
        </div>

        <!-- Single-batch row -->
        <pantry-item-row
            v-if="group.batch.length === 1"
            :item="group.batch[0]"
            :product="group.product"
            :locations="locations"
            :units="units"
            :categories="categories"
            :show-restock="true"
            :show-defaults="true"
            row-class="td"
            @delete="$emit('delete-product', $event.product)"
            @location-change="group.product.defaultLocation = $event"
            @restock-change="$emit('restock-change')"
        />

        <!-- Batch sub-rows -->
        <div v-if="group.batch.length > 1" class="batch-items-area" :class="{ open: isOpen }">
            <pantry-item-row
                v-for="item in group.batch"
                :key="item.id"
                :item="item"
                :product="group.product"
                :locations="locations"
                :units="units"
                :categories="categories"
                :show-defaults="true"
                row-class="batch-row"
                @delete="$emit('delete-item', $event)"
            />
        </div>

    </div>
</template>

<style lang="scss" scoped>

// ── Compact row ───────────────────────────────────────────────

.compact-row {
    cursor: pointer;
    transition: background 0.15s ease;
    &:hover { background: var(--surface); }
}

.expand-col {
    font-size: 0.65rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
}

.name-col { font-size: 0.9rem; }

.batch-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-left: 4px;
}

.qty-col {
    display: flex;
    align-items: center;
}

.qty-display {
    font-size: 0.82rem;
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-muted);
    white-space: nowrap;
}

.exp-col {
    padding-right: 8px;

    :deep(.progress-wrapper),
    :deep(.exp-track) {
        width: 100%;
    }
}

.cat-col {
    font-size: 0.78rem;
    color: var(--text-muted);
}

.loc-col {
    display: flex;
    align-items: center;
}

.loc-display {
    font-size: 0.78rem;
    color: var(--text-muted);
    padding: 2px 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.restock-col, .trash-col {
    display: flex;
    align-items: center;
    justify-content: center;
}



.batch-header-open {
    background: var(--surface3);
    border-bottom: 1px solid var(--border-subtle);
}

// ── Slide transitions ─────────────────────────────────────────

.batch-items-area {
    margin: 0 -0.75rem;
    padding: 0 0.75rem;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.25s ease;

    &.open {
        max-height: 800px;
        opacity: 1;
    }
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

.restock-pill.checked .restock-checkmark { stroke-dashoffset: 0; }

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
