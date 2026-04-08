<script>
import PantryExpiration from "./PantryExpiration.vue";
export default {
  name: "PantryCard",

  components: { PantryExpiration },

  props: {
    product: { type: Object, required: true },
    index: { type: Number, required: true },
  },

  data() {
    return {
      expanded: false,
    };
  },

  methods: {
    getMaxBatchQtyPercent() {
      if (!this.product.batch || this.product.batch.length === 0) return 0;
      return Math.max(...this.product.batch.map(b => b.qty || 0));
    },

    handleCardTap() {
      if (this.product.batch.length > 1) {
        this.expanded = !this.expanded;
      } else {
        this.$emit('edit', { product: this.product, item: this.product.batch[0] });
      }
    },

    onRestockChange() {
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

<!-- // paths must be relative (what file you are currently in)-->
<template>
  <div class="inv-card" :class="product.statusClass()" @click="handleCardTap">

    <div class="card-top">
      <div class="card-name">{{ product.name }}</div>
      <div class="exp-expired-label" v-if="product.batchPercent() === 100">
        <i class="bi bi-x-circle-fill"></i> Expired
      </div>

      <div v-if="product.batch.length > 1" class="card-batch-badge">
        ×{{ product.batch.length }}
        <i :class="expanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" style="font-size:0.5rem; margin-left:3px;"></i>
      </div>

      <div class="card-actions" @click.stop>
        <button v-if="product.batch.length === 1" class="edit-btn"
          @click="$emit('edit', { product, item: product.batch[0] })">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button v-if="product.batch.length === 1" class="del-btn" @click="$emit('delete-product', product)">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>

    <div class="card-meta" @click.stop>
      <span class="card-qty">{{ product.getMaxBatchQtyPercent() }}%</span>
      <span class="card-dot"></span>
      <span class="card-category">{{ product.category }}</span>
      <label class="restock-toggle card-restock" @click.stop>
        <input type="checkbox" v-model="product.restock" @change="onRestockChange" class="restock-cb-hidden">
        <div class="restock-pill" :class="{ checked: product.restock }">
          <svg class="restock-check-icon" viewBox="0 0 20 20" fill="none">
            <polyline class="restock-checkmark" points="3,11 8,16 17,5"></polyline>
          </svg>
          <input v-if="product.restock" type="number" min="1" v-model.number="product.restockQty"
            @change="$emit('restock-change')" @click.stop class="restock-qty-num">
        </div>
        <span class="restock-label">restock</span>
      </label>
    </div>

    <div class="card-exp">
      <pantry-expiration variant="card" :batch="product.batch" />
    </div>

    <!-- ── Batch expansion (multi-batch only) ── -->
    <transition name="batch-expand">
      <div v-if="product.batch.length > 1 && expanded" class="card-batch-list" @click.stop>
        <div v-for="item in product.batch" :key="item.id" class="card-batch-item">

          <i class="bi bi-pencil-square" @click="$emit('edit', { product, item })"></i>

          <span class="batch-qty">{{ item.qty }}%</span>

          <div class="batch-exp-wrap">
            <pantry-expiration variant="card" :item="item" />
          </div>

          <i class="bi bi-x-circle" @click="$emit('delete-item', { item, product })"></i>
        </div>
      </div>
    </transition>

  </div>
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
    font-size: 0.88rem;
    flex: 1;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

.card-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
}

.edit-btn,
.del-btn {
    background: none;
    border: none;
    padding: 2px 5px;
    cursor: pointer;
    font-size: 0.72rem;
    color: var(--text-faint);
    line-height: 1;

    &:hover {
        color: var(--text);
    }
}

.del-btn:hover {
    color: var(--danger);
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    color: var(--text-faint);
    margin-bottom: 8px;
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

.card-restock {
    margin-left: auto;
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
    padding: 2px 0;

    i {
        font-size: 0.7rem;
        cursor: pointer;
        opacity: 0.45;

        &:hover {
            opacity: 1;
        }
    }
}

.batch-qty {
    font-weight: 600;
    font-family: 'Quicksand', sans-serif;
    min-width: 32px;
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
    width: 26px;
    height: 26px;
    border-radius: 13px;
    background: var(--surface3);
    overflow: hidden;
    padding: 0 4px;
    box-sizing: border-box;
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.4s ease, background 0.4s ease;

    &.checked {
        width: 82px;
        border-radius: 6px;
        background: #6cbe45;
    }
}

.restock-check-icon {
    width: 16px;
    height: 16px;
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
    width: 40px;
    background: rgba(255, 255, 255, 0.25);
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 0.8rem;
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
    margin-left: 5px;
    transition: opacity 0.25s ease, max-width 0.3s ease, margin-left 0.3s ease;
}

.restock-pill.checked + .restock-label {
    opacity: 0;
    max-width: 0;
    margin-left: 0;
}
</style>
