<script>
import PantryExpiration from "./PantryExpiration.vue";
import BaseDurationInput from "./BaseDurationInput.vue";
import Expiration from '../models/Expiration.js';
import { QUANTITY_UNITS } from '../data/ingredientDefaults.js';

export default {
  name: "PantryCard",

  components: { PantryExpiration, BaseDurationInput },

  props: {
    group: { type: Object, required: true }, // { product: Product, batch: PantryItem[] }
    index: { type: Number, required: true },
    units: { type: Array, default: () => [] },
    locations: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
  },

  emits: ['delete-product', 'delete-item', 'restock-change'],

  data() {
    return {
      expanded: false,
      showEditSheet: false,
      editingItem: null,
      editingExpValue: 1,
      editingExpUnitIndex: 0,
      activeTab: 'item',
      isEditingQty: false,
      editingQtyValue: 1,
      quantityUnits: QUANTITY_UNITS,
    };
  },

  computed: {
    maxExpPercent() {
      if (!this.group.batch.length) return 0
      return Math.max(...this.group.batch.map(i => Expiration.toPercent(i.expiration.toDate())))
    },
    cardStatusClass() {
      const p = this.maxExpPercent
      if (p >= 100) return 'status-expired'
      if (p >= 75) return 'status-red'
      if (p >= 50) return 'status-yellow'
      return ''
    },
    totalQty() {
      if (!this.group.batch.length) return 0
      return Math.round(this.group.batch.reduce((acc, i) => acc + i.qty, 0) * 100) / 100
    },
  },

  methods: {
    // Expands the batch list if there are multiple items, otherwise opens the edit sheet for the single item
    handleCardTap() {
      if (this.group.batch.length > 1) {
        this.expanded = !this.expanded;
      } else {
        this.openEdit(this.group.batch[0]);
      }
    },

    // Opens the edit sheet for the given item, decomposing its expiration into editable fields
    openEdit(item) {
      this.editingItem = item;
      const { value, unitIndex } = Expiration.toComponents(item.expiration.toDate());
      this.editingExpValue = value;
      this.editingExpUnitIndex = unitIndex;
      this.activeTab = 'item';
      this.isEditingQty = false;
      this.showEditSheet = true;
    },

    // Applies the edited expiration to the item and closes the edit sheet
    commitEdit() {
      if (this.editingItem) {
        this.editingItem.expiration = Expiration.fromDate(
          Expiration.compute(this.editingExpValue, this.editingExpUnitIndex)
        );
      }
      this.showEditSheet = false;
      this.editingItem = null;
    },

    // Emits a restock-change event and focuses the qty input if restock was just enabled
    onRestockChange() {
      this.$emit('restock-change');
      if (this.group.product.restock) {
        this.$nextTick(() => {
          this.$el.querySelector('.restock-qty-num')?.focus();
        });
      }
    },

    // Updates the location on the product and all of its batch items
    onLocationChange(val) {
      const loc = val || null;
      this.group.product.defaultLocation = loc;
      this.group.batch.forEach(item => { item.location = loc; });
    },

    // Enters inline quantity edit mode, seeding the input with the item's current qty
    startEditQty() {
      this.editingQtyValue = this.editingItem.qty;
      this.isEditingQty = true;
    },

    // Parses and applies the edited quantity, then exits inline qty edit mode
    commitQty() {
      const val = Math.round(parseFloat(this.editingQtyValue) * 100) / 100;
      if (!isNaN(val) && val >= 0) this.editingItem.qty = val;
      this.isEditingQty = false;
    },

    // Updates the unit on the editing item and syncs it back to the product's default
    onUnitChange(unit) {
      this.editingItem.unit = unit;
      this.group.product.defaultUnit = unit;
    },

    // Sets the product's restockThreshold flag and emits a restock-change event
    setRestockThreshold(val) {
      this.group.product.restockThreshold = val;
      this.$emit('restock-change');
    },
  },

}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
  <div class="inv-card" :class="cardStatusClass" @click="handleCardTap">

    <div class="card-top">
      <div class="card-name truncate">{{ group.product.name }}</div>
      <div class="exp-expired-label" v-if="maxExpPercent >= 100">
        <i class="bi bi-x-circle-fill"></i> Expired
      </div>

      <div v-if="group.batch.length > 1" class="card-batch-badge">
        ×{{ group.batch.length }}
        <i :class="expanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" style="font-size:0.5rem; margin-left:3px;"></i>
      </div>

      <div class="card-top-actions" @click.stop>
        <label class="restock-toggle" @click.stop>
          <input type="checkbox" v-model="group.product.restock" @change="onRestockChange" class="restock-cb-hidden">
          <span class="restock-label">restock</span>
          <div class="restock-pill" :class="{ checked: group.product.restock && !group.product.restockThreshold, 'checked-circle': group.product.restock && group.product.restockThreshold }">
            <input v-if="group.product.restock && !group.product.restockThreshold" type="number" min="1"
              v-model.number="group.product.restockQty"
              @change="$emit('restock-change')" @click.stop class="restock-qty-num">
            <svg class="restock-check-icon" viewBox="0 0 20 20" fill="none">
              <polyline class="restock-checkmark" points="3,11 8,16 17,5"></polyline>
            </svg>
          </div>
        </label>
        <button class="del-btn" :style="group.batch.length !== 1 ? { visibility: 'hidden' } : {}" @click.stop="$emit('delete-product', group.product)">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>

    <div class="card-meta">
      <span class="card-qty">{{ totalQty }} {{ group.product.defaultUnit }}</span>
      <span class="card-dot"></span>
      <span class="card-category">{{ group.product.category }}</span>
      <template v-if="locations.length">
        <span class="card-dot card-loc-desktop"></span>
        <select class="card-loc-select card-loc-desktop"
          :value="group.product.defaultLocation || ''"
          @change="onLocationChange($event.target.value)"
          @click.stop>
          <option value="">📍</option>
          <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
        </select>
        <template v-if="group.product.defaultLocation">
          <span class="card-dot card-loc-mobile"></span>
          <span class="card-loc-mobile">{{ group.product.defaultLocation }}</span>
        </template>
      </template>
    </div>

    <div class="card-exp">
      <pantry-expiration variant="card" :batch="group.batch" />
    </div>

    <!-- ── Batch expansion (multi-batch only) ── -->
    <transition name="batch-expand">
      <div v-if="group.batch.length > 1 && expanded" class="card-batch-list" @click.stop>
        <div v-for="item in group.batch" :key="item.id" class="card-batch-item" @click="openEdit(item)">

          <span class="batch-name truncate">{{ item.product.name }}</span>

          <span class="batch-qty">{{ item.qty }} {{ item.unit }}</span>

          <div class="batch-exp-wrap">
            <pantry-expiration variant="card" :item="item" />
          </div>

          <button class="del-btn" @click.stop="$emit('delete-item', { item, product: group.product })">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    </transition>

  </div>

  <!-- ── Mobile edit sheet ── -->
  <Teleport to="body">
    <transition name="sheet-fade">
      <div v-if="showEditSheet" class="edit-sheet-overlay" @click="commitEdit"></div>
    </transition>
    <transition name="sheet-slide">
      <div v-if="showEditSheet && editingItem" class="edit-sheet">
        <div class="edit-sheet-handle"></div>

        <div class="edit-sheet-head">
          <span class="edit-sheet-title">{{ group.product.name }}</span>
          <button class="edit-sheet-close" @click="commitEdit"><i class="bi bi-x-lg"></i></button>
        </div>

        <!-- Tabs -->
        <div class="edit-tabs" :class="{ 'pill-right': activeTab === 'defaults' }">
          <button :class="['edit-tab', { active: activeTab === 'item' }]" @click="activeTab = 'item'">This Item</button>
          <button :class="['edit-tab', { active: activeTab === 'defaults' }]" @click="activeTab = 'defaults'">Defaults</button>
        </div>

        <div class="edit-sheet-body">

        <!-- ── This Item tab ── -->
        <template v-if="activeTab === 'item'">

          <!-- Qty + Unit -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Quantity</label>
            <div class="edit-qty-row">
              <div class="edit-qty-amount">
                <input class="edit-qty-input" type="number" min="0" step="0.01"
                  :value="editingItem.qty"
                  @change="editingItem.qty = Math.round(parseFloat($event.target.value) * 100) / 100 || 0" />
                <select class="edit-unit-inline" :value="editingItem.unit" @change="onUnitChange($event.target.value)">
                  <option v-for="u in quantityUnits" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Expiration -->
          <div class="edit-field edit-field--exp">
            <label class="edit-label">Expires in</label>
            <base-duration-input
              :duration="editingExpValue"
              :unit-index="editingExpUnitIndex"
              :units="units"
              track-width="96px"
              @update:duration="editingExpValue = $event"
              @update:unit-index="editingExpUnitIndex = $event" />
          </div>

          <!-- Location -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Location</label>
            <select class="edit-select"
              :value="editingItem.location || ''"
              @change="editingItem.location = $event.target.value || null">
              <option value="">None</option>
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>

        </template>

        <!-- ── Defaults tab ── -->
        <template v-if="activeTab === 'defaults'">

          <!-- Default Qty + Unit -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Quantity</label>
            <div class="edit-qty-amount">
              <input type="number" min="0.1" step="0.1" class="edit-qty-input"
                v-model.number="group.product.defaultQty" style="margin-right:16px;">
              <select class="edit-unit-inline" v-model="group.product.defaultUnit">
                <option v-for="u in quantityUnits" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <!-- Shelf life -->
          <div class="edit-field edit-field--exp">
            <label class="edit-label">Shelf life</label>
            <base-duration-input
              :duration="group.product.defaultDurationValue"
              :unit-index="group.product.defaultUnitIndex"
              :units="units"
              track-width="96px"
              @update:duration="group.product.defaultDurationValue = $event"
              @update:unit-index="group.product.defaultUnitIndex = $event" />
          </div>

          <!-- Default Location -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Location</label>
            <select class="edit-select"
              :value="group.product.defaultLocation || ''"
              @change="group.product.defaultLocation = $event.target.value || null">
              <option value="">None</option>
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>

          <!-- Restock mode -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Restock</label>
            <div class="mode-switch" :class="{ 'pill-right': !group.product.restockThreshold }">
              <button :class="['mode-opt', { active: group.product.restockThreshold }]" @click="setRestockThreshold(true)">When low</button>
              <button :class="['mode-opt', { active: !group.product.restockThreshold }]" @click="setRestockThreshold(false)">Count</button>
            </div>
          </div>

          <!-- Category -->
          <div class="edit-field edit-field--inline">
            <label class="edit-label">Category</label>
            <select class="edit-select" v-model="group.product.category">
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>

        </template>

        </div><!-- end edit-sheet-body -->

        <button class="edit-sheet-done" @click="commitEdit">Done</button>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.inv-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 12px 14px 10px;
    border: 1px solid var(--border);
    border-left: 3px solid transparent;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.15s ease;
    margin-bottom: 10px;
    min-width: 0;

    &:hover {
        box-shadow: var(--box-shadow);
        transform: translateY(-1px);

        .card-actions {
            opacity: 1;
        }
    }

    &.status-yellow {
        border-left-color: var(--warning);
    }

    &.status-red {
        border-left-color: var(--danger-accent);
    }

    &.status-expired {
        border-left-color: var(--danger);
        opacity: 0.7;
    }
}

.card-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.card-name {
    font-family: 'Quicksand', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    flex: 0 1 auto;
    min-width: 0;
    max-width: 55%;
    color: var(--text);
}

.exp-expired-label {
    font-size: 0.62rem;
    color: var(--danger);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
}

.card-batch-badge {
    font-size: 0.62rem;
    color: var(--text-faint);
    background: var(--surface2);
    border-radius: 8px;
    padding: 2px 6px;
    display: flex;
    align-items: center;
    white-space: nowrap;
}


.del-btn {
    background: none;
    border: none;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    color: var(--danger);
    opacity: 0.8;
    &:hover { opacity: 1; }
}

.card-batch-item i {
    opacity: 0.65;
    font-size: 1rem;
    padding: 6px;
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    color: var(--text-faint);
    margin-bottom: 8px;
    overflow: hidden;
}

.card-qty {
    font-weight: 600;
    color: var(--text-muted);
    font-family: 'Quicksand', sans-serif;
}

.card-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--surface3);
    flex-shrink: 0;
}

.card-category {
    letter-spacing: 0.02em;
}

.card-loc-select {
    background: transparent;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    color: var(--text-faint);
    cursor: pointer;
    outline: none;
    padding: 0;
    max-width: 80px;

    option {
        background: var(--bg2);
        color: var(--text);
    }
}

.card-loc-mobile {
    display: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    color: var(--text-faint);
}

@media (max-width: 768px) {
    .card-loc-desktop { display: none; }
    .card-loc-mobile  { display: inline; }
}

.card-top-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    flex-shrink: 0;
}

.card-exp {
    margin-top: 2px;
}

// Batch expansion
.card-batch-list {
    margin-top: 8px;
    border-top: 1px solid var(--border);
    padding-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.card-batch-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: var(--text-muted);
    padding: 4px 2px;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.15s;
    &:hover { background: var(--surface2); }

    i {
        font-size: 0.7rem;
        cursor: pointer;
        opacity: 0.45;

        &:hover {
            opacity: 1;
        }
    }

    .del-btn {
        padding: 4px 6px;
        i { font-size: 1.25rem; }
    }
}

.batch-name {
    flex: 1;
    min-width: 0;
    max-width: 45%;
    font-weight: 600;
    font-family: 'Quicksand', sans-serif;
    color: var(--text);
}

.batch-qty {
    font-weight: 600;
    font-family: 'Quicksand', sans-serif;
    min-width: 32px;
    flex-shrink: 0;
}

.batch-exp-wrap {
    flex: 1;
}

.batch-expand-enter-active,
.batch-expand-leave-active {
    transition: max-height 0.25s ease, opacity 0.2s ease;
    overflow: hidden;
    max-height: 300px;
}

.batch-expand-enter-from,
.batch-expand-leave-to {
    max-height: 0;
    opacity: 0;
}

// Restock pill
.restock-toggle {
    cursor: pointer;
    display: flex;
    align-items: center;
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
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.4s ease, background 0.4s ease;

    &.checked {
        width: 90px;
        border-radius: 6px;
        background: #6cbe45;
    }

    &.checked-circle {
        background: #6cbe45;
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
.restock-pill.checked-circle .restock-checkmark {
    stroke-dashoffset: 0;
}

.restock-qty-num {
    width: 44px;
    background: rgba(255, 255, 255, 0.25);
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 0.8rem;
    text-align: center;
    padding: 2px;
    margin-left: 8px;
    margin-right: 4px;
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
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
}

.restock-label {
    font-size: 0.56rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.4;
    max-width: 80px;
    overflow: hidden;
    white-space: nowrap;
    user-select: none;
    margin-right: 5px;
    transition: opacity 0.25s ease, max-width 0.3s ease, margin-right 0.3s ease;
}

.restock-label:has(+ .restock-pill.checked),
.restock-label:has(+ .restock-pill.checked-circle) {
    opacity: 0;
    max-width: 0;
    margin-right: 0;
}

// ── Edit bottom sheet ──────────────────────────────────────

.edit-sheet-overlay {
    position: fixed;
    inset: 0;
    z-index: 499;
    background: rgba(0, 0, 0, 0.4);
}

.edit-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 500;
    background: var(--bg);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    padding: 10px 24px 36px;
    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.18);
}

.edit-sheet-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-subtle);
    margin: 0 auto 16px;
}

.edit-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.edit-sheet-title {
    font-family: 'Quicksand', sans-serif;
    font-weight: 700;
    font-size: 2.1rem;
    color: var(--text);
}

.edit-sheet-close {
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    &:hover { color: var(--text); }
}

.edit-tabs {
    display: flex;
    gap: 4px;
    background: var(--surface2);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 20px;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 3px;
        bottom: 3px;
        left: 3px;
        width: calc(50% - 3px);
        border-radius: 7px;
        background: var(--bg);
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    }

    &.pill-right::before {
        left: 50%;
    }
}

.edit-tab {
    flex: 1;
    padding: 8px 0;
    border: none;
    border-radius: 7px;
    background: transparent;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    cursor: pointer;
    position: relative;
    z-index: 1;
    transition: color 0.2s;
    &.active { color: var(--text); }
}

.edit-sheet-body {
    height: 325px;
    overflow-y: auto;
}

.qty-swap-enter-active, .qty-swap-leave-active { transition: opacity 0.1s ease; }
.qty-swap-enter-from, .qty-swap-leave-to { opacity: 0; }

.edit-qty-amount {
    display: flex;
    align-items: center;
    gap: 6px;
}

.edit-unit-inline {
    max-width: 90px;
    overflow: hidden;
    background: var(--surface2);
    border: none;
    border-radius: 6px;
    color: var(--text-faint);
    font-family: 'Quicksand', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    padding: 4px 10px;
    appearance: none;
    -webkit-appearance: none;
    text-overflow: ellipsis;
    option { background: var(--bg); color: var(--text); }
}

.edit-qty-input {
    width: 56px;
    text-align: center;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: transparent;
    font-family: 'Quicksand', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text);
    outline: none;
    padding: 4px;
    margin-right: 16px;
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    &[type=number] { -moz-appearance: textfield; appearance: textfield; }
}

.mode-switch {
    display: flex;
    gap: 4px;
    background: var(--surface2);
    border-radius: 8px;
    padding: 3px;
    position: relative;
    width: 100%;

    &::before {
        content: '';
        position: absolute;
        top: 3px;
        bottom: 3px;
        left: 3px;
        width: calc(50% - 3px);
        border-radius: 5px;
        background: var(--bg);
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    }

    &.pill-right::before {
        left: 50%;
    }
}

.mode-opt {
    flex: 1;
    background: transparent;
    border: none;
    border-radius: 5px;
    font-family: 'Quicksand', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px 12px;
    white-space: nowrap;
    cursor: pointer;
    color: var(--text-muted);
    position: relative;
    z-index: 1;
    transition: color 0.15s;
    &:hover { color: var(--text); }
    &.active { color: var(--text); }
}

.edit-field {
    margin-bottom: 20px;
}

.edit-field--inline,
.edit-field--exp {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;

    .edit-label {
        margin-bottom: 0;
        min-width: 80px;
        flex-shrink: 0;
    }
}

.edit-field--exp {

    :deep(.duration-input--pantry) {
        gap: 16px;

        .duration-number {
            width: 56px;
            font-size: 1.3rem;
            padding: 4px;
        }

        .unit-display {
            width: 96px;
            height: 1.6rem;
        }

        .unit-track span {
            flex: 0 0 96px;
            font-size: 1.1rem;
            line-height: 1.6rem;
        }

        .unit-arrow {
            font-size: 0.8rem;
            padding: 8px 6px;
            opacity: 0.6;
        }
    }
}

.edit-label {
    display: block;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.edit-qty-row {
    display: flex;
    align-items: center;
    gap: 20px;
}

.edit-select {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
    background: var(--surface);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    outline: none;
    cursor: pointer;
    option { background: var(--bg); color: var(--text); }
}

.edit-sheet-done {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: var(--success);
    color: #fff;
    font-family: 'Oxygen', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.15s;
    &:hover { opacity: 0.88; }
}

// Transitions
.sheet-fade-enter-active, .sheet-fade-leave-active { transition: opacity 0.25s; }
.sheet-fade-enter-from, .sheet-fade-leave-to       { opacity: 0; }

.sheet-slide-enter-active { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sheet-slide-leave-active { transition: transform 0.28s ease-in; }
.sheet-slide-enter-from,
.sheet-slide-leave-to     { transform: translateY(100%); }
</style>
