<script>
export default {
    name: 'RecipeMakeModal',

    props: {
        show:    { type: Boolean, required: true },
        recipe:  { type: Object,  default: null },
        receipt: { type: Array,   default: () => [] },
    },

    emits: ['close', 'confirm'],

    data() {
        return { closing: false, active: false, isMobile: window.matchMedia('(max-width: 768px)').matches };
    },

    mounted() {
        this._mq = window.matchMedia('(max-width: 768px)');
        this._mqCb = e => { this.isMobile = e.matches; };
        this._mq.addEventListener('change', this._mqCb);
    },

    beforeUnmount() {
        this._mq?.removeEventListener('change', this._mqCb);
    },

    computed: {
        deductCount() {
            return this.receipt.filter(r => r.status === 'ok' || r.status === 'insufficient').length;
        },
        skipCount() {
            return this.receipt.filter(r => r.status === 'missing' || r.status === 'incompatible').length;
        },
        gridCols() {
            const n = this.receipt.length;
            if (n >= 16) return 3;
            if (n >= 8)  return 2;
            return 1;
        },
    },

    methods: {
        // Triggers the closing animation then emits close after it completes
        handleClose() {
            if (this.closing) return;
            this.closing = true;
            setTimeout(() => {
                this.$emit('close');
                this.closing = false;
            }, 300);
        },

        // Emits confirm to trigger pantry deduction, then closes the modal
        handleConfirm() {
            this.$emit('confirm');
            this.handleClose();
        },

        // Returns a human-readable label describing what will happen to the pantry quantity for a receipt row
        rowLabel(row) {
            const { status, pantryUnit, totalPantryQty, needed } = row;
            if (status === 'ok')
                return `deduct ${this.fmt(needed)} ${pantryUnit}`;
            if (status === 'insufficient')
                return `use all ${this.fmt(totalPantryQty)} ${pantryUnit} (need ${this.fmt(needed)})`;
            if (status === 'missing')
                return 'not in pantry';
            if (status === 'incompatible') {
                const recipeUnit = (row.ingredient.unit || '').trim() || pantryUnit;
                return `unit mismatch — recipe: ${recipeUnit}, pantry: ${pantryUnit}`;
            }
            return '';
        },

        // Formats a number to 2 decimal places, dropping trailing zeros, or '—' if invalid
        fmt(n) {
            if (n == null || isNaN(n)) return '—';
            return parseFloat(n.toFixed(2)).toString();
        },
    },

    watch: {
        show: {
            immediate: true,
            handler(val) {
                if (val) {
                    this.closing = false;
                    this.$nextTick(() => requestAnimationFrame(() => { this.active = true; }));
                } else {
                    this.active = false;
                }
            },
        },
    },
};
</script>

<template>
    <teleport to="body">
        <div class="modal-backdrop" :class="{ show: active }" @click="handleClose"></div>

        <div class="recipe-drawer" :class="[{ show: active, closing, 'is-mobile': isMobile }, `cols-${gridCols}`]">

            <div class="drawer-header">
                <div class="drawer-title-block">
                    <h3 class="make-title"><i class="bi bi-fire"></i> Make this?</h3>
                    <p class="make-recipe-name">{{ recipe?.name }}</p>
                </div>
                <span class="close-x" @click="handleClose">&times;</span>
            </div>

            <div class="drawer-body">
                <ul class="receipt-list">
                    <li
                        v-for="(row, i) in receipt"
                        :key="i"
                        class="receipt-row"
                        :class="row.status"
                    >
                        <i class="row-icon bi"
                            :class="{
                                'bi-check-circle-fill':         row.status === 'ok',
                                'bi-exclamation-triangle-fill': row.status === 'insufficient' || row.status === 'incompatible',
                                'bi-x-circle':                  row.status === 'missing',
                            }"
                        ></i>
                        <span class="row-name">{{ row.ingredient.name }}</span>
                        <span class="row-amount">{{ row.ingredient.qty }} {{ row.ingredient.unit }}</span>
                        <span class="row-action">{{ rowLabel(row) }}</span>
                    </li>
                </ul>
            </div>

            <div class="drawer-footer">
                <p class="receipt-summary">
                    <template v-if="deductCount">
                        Deducting <strong>{{ deductCount }}</strong> ingredient{{ deductCount !== 1 ? 's' : '' }} from your pantry.
                    </template>
                    <template v-if="skipCount">
                        {{ deductCount ? ' ' : 'Nothing to deduct — ' }}
                        <span class="skip-note">{{ skipCount }} skipped</span> (not found or incompatible units).
                    </template>
                </p>
                <div class="make-actions">
                    <button class="btn-cancel" @click="handleClose">Cancel</button>
                    <button class="btn-confirm" :disabled="deductCount === 0" @click="handleConfirm">
                        <i class="bi bi-fire"></i> Cook it!
                    </button>
                </div>
            </div>

        </div>
    </teleport>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

// ── Backdrop ──────────────────────────────────────────────────
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 1000;
    pointer-events: none;
    transition: background 0.3s ease;

    &.show {
        background: rgba(0, 0, 0, 0.5);
        pointer-events: all;
    }
}

// ── Drawer shell ──────────────────────────────────────────────
.recipe-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 460px;
    max-width: 95vw;
    background: var(--modal-bg);
    box-shadow: -6px 0 32px rgba(0, 0, 0, 0.2);
    z-index: 1050;
    display: flex;
    flex-direction: column;
    font-family: 'Quicksand', sans-serif;
    transform: translateX(110%);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                width    0.35s cubic-bezier(0.22, 1, 0.36, 1);

    &.show    { transform: translateX(0); }
    &.closing { transform: translateX(110%); transition: transform 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97); }

    &.cols-2 { width: min(740px,  95vw); }
    &.cols-3 { width: min(1000px, 95vw); }
}

// ── Header ────────────────────────────────────────────────────
.drawer-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 28px 16px;
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.drawer-title-block { flex: 1; min-width: 0; }

.make-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 7px;
    i { color: var(--sage); }
}

.make-recipe-name {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.close-x {
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    color: var(--text-faint);
    flex-shrink: 0;
    margin-left: 16px;
    transition: color 0.15s ease;
    &:hover { color: var(--text); }
}

// ── Body (scrollable middle) ──────────────────────────────────
.drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 28px;
    min-height: 0; // required for flex child to scroll
}

// ── Receipt list — single column (default) ────────────────────
.receipt-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--border-subtle);
}

.receipt-row {
    display: grid;
    grid-template-columns: 22px 1fr auto auto;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 0.88rem;

    &.ok                         { .row-icon { color: var(--sage); } }
    &.insufficient, &.incompatible { .row-icon { color: #d4a017; } }
    &.missing                    { opacity: 0.5; .row-icon { color: var(--text-muted); } }
}

.row-icon   { font-size: 1.15rem; flex-shrink: 0; }
.row-name   { font-size: 0.95rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-amount { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
.row-action { font-size: 0.75rem; color: var(--text-faint); white-space: nowrap; flex-shrink: 0; font-style: italic; }

// ── Receipt list — multi-column card grid ─────────────────────
.cols-2,
.cols-3 {
    .receipt-list {
        display: grid;
        gap: 8px;
        border-top: none;
    }

    .receipt-row {
        display: grid;
        grid-template-columns: 1.3rem 1fr;
        grid-template-areas:
            "icon name"
            ".    amount"
            ".    action";
        align-items: start;
        gap: 2px 10px;
        padding: 10px 12px;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
    }

    .row-icon   { grid-area: icon; font-size: 1.2rem; padding-top: 2px; }
    .row-name   { grid-area: name; font-size: 0.92rem; font-weight: 700; white-space: normal; }
    .row-amount { grid-area: amount; }
    .row-action { grid-area: action; font-size: 0.72rem; white-space: normal; }
}

.cols-2 .receipt-list { grid-template-columns: 1fr 1fr; }
.cols-3 .receipt-list { grid-template-columns: 1fr 1fr 1fr; }

// ── Footer ────────────────────────────────────────────────────
.drawer-footer {
    padding: 16px 28px 24px;
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
}

.receipt-summary {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 16px;
    line-height: 1.5;
    strong { color: var(--text); }
}

.skip-note { color: var(--text-faint); }

.make-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn-cancel {
    padding: 8px 18px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    font-family: 'Quicksand', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: var(--surface); }
}

.btn-confirm {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: var(--sage);
    color: #fff;
    font-family: 'Quicksand', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
    &:hover:not(:disabled) { opacity: 0.85; }
    &:disabled { opacity: 0.4; cursor: default; }
}

// ── Mobile bottom sheet (JS-detected — higher specificity than .show/.cols rules) ──
.is-mobile.recipe-drawer {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    max-height: 85dvh;
    overflow: hidden;
    border-radius: 24px 24px 0 0;
    background: var(--bg);
    box-shadow: 0 -6px 40px rgba(0, 0, 0, 0.22);
    visibility: visible;
    pointer-events: none;
    transform: translateY(110%);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    &::before {
        content: '';
        display: block;
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: var(--border-subtle);
        margin: 14px auto 0;
        flex-shrink: 0;
    }
}

.is-mobile.recipe-drawer.show {
    transform: translateY(0);
    pointer-events: auto;
    width: 100%;
    height: auto;
    max-height: 85dvh;
    overflow: hidden;
}

.is-mobile.recipe-drawer.closing {
    transform: translateY(110%);
    pointer-events: none;
    transition: transform 0.28s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

// Always single column on mobile, regardless of item count
.is-mobile.recipe-drawer.cols-2,
.is-mobile.recipe-drawer.cols-3 {
    width: 100%;

    .receipt-list {
        display: block;
        border-top: 1px solid var(--border-subtle);
    }

    .receipt-row {
        display: grid;
        grid-template-columns: 22px 1fr;
        grid-template-areas: unset;
        grid-template-rows: auto auto;
        padding: 10px 0;
        border: none;
        border-bottom: 1px solid var(--border-subtle);
        border-radius: 0;
        gap: 2px 8px;
        align-items: start;

        .row-amount { grid-column: 2; font-size: 0.7rem; }
        .row-action { grid-column: 2; font-size: 0.7rem; white-space: normal; }
    }
}

.is-mobile .drawer-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.is-mobile .receipt-row {
    grid-template-columns: 22px 1fr;
    grid-template-rows: auto auto;
    gap: 2px 8px;

    .row-amount { grid-column: 2; font-size: 0.7rem; }
    .row-action { grid-column: 2; font-size: 0.7rem; white-space: normal; }
}
</style>
