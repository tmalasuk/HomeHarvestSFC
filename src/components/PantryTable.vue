<script>
import PantryRow from './PantryRow.vue';
import PantryCard from './PantryCard.vue';

export default {
    name: "PantryTable",

    components: { PantryRow, PantryCard },

    props: {
        products: { type: Array, required: true },
        isMobile: { type: Boolean, required: true },
        units: { type: Array, required: true },
        categories: { type: Array, required: true },
        locations: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
    },

    emits: ['delete-product', 'delete-item', 'restock-change'],

    computed: {
        productGroups() {
            const groups = new Map()
            this.products.forEach(item => {
                if (!groups.has(item.product.id)) {
                    groups.set(item.product.id, { product: item.product, batch: [] })
                }
                groups.get(item.product.id).batch.push(item)
            })
            return [...groups.values()]
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div class="container inventory h-100">

        <!-- v-show keeps DOM alive across resize — avoids destroy/recreate bugs -->

        <div class="row table-header" v-show="!isMobile">
            <div class="col-1"></div>
            <div class="col-9">Name</div>
            <div class="col-4">Qty</div>
            <div class="col-7">Exp</div>
            <div class="col-6">Category</div>
            <div class="col-6">Location</div>
            <div class="col-4" style="display:flex;justify-content:center;">Restock</div>
            <div class="col-3" style="display:flex;justify-content:center">Trash</div>
        </div>

        <!-- Skeleton rows (desktop) -->
        <div v-if="loading && !isMobile" class="skeleton-rows">
            <div v-for="i in 7" :key="i" class="row skeleton-row">
                <div class="col-1"><div class="skel skel-icon"></div></div>
                <div class="col-9"><div class="skel skel-name"></div></div>
                <div class="col-4"><div class="skel skel-qty"></div></div>
                <div class="col-7"><div class="skel skel-exp"></div></div>
                <div class="col-6"><div class="skel skel-cat"></div></div>
                <div class="col-6"><div class="skel skel-loc"></div></div>
                <div class="col-4"><div class="skel skel-icon"></div></div>
                <div class="col-3"><div class="skel skel-icon"></div></div>
            </div>
        </div>

        <pantry-row
            v-show="!isMobile"
            v-for="(group, index) in productGroups"
            :key="'desktop-' + group.product.id"
            :group="group"
            :index="index"
            :is-mobile="isMobile"
            :units="units"
            :locations="locations"
            :categories="categories"

            @delete-product="$emit('delete-product', $event)"
            @delete-item="$emit('delete-item', $event)"
            @restock-change="$emit('restock-change')"
        />

        <!-- Skeleton cards (mobile) -->
        <div v-if="loading && isMobile" class="inventory-cards">
            <div v-for="i in 6" :key="i" class="skeleton-card">
                <div class="skel skel-card-name"></div>
                <div class="skel skel-card-line"></div>
                <div class="skel skel-card-line short"></div>
            </div>
        </div>

        <div class="inventory-cards" v-show="isMobile">
            <pantry-card
                v-for="(group, index) in productGroups"
                :key="'mobile-' + group.product.id"
                :group="group"
                :index="index"
                :units="units"
                :locations="locations"
                :categories="categories"

                @delete-product="$emit('delete-product', $event)"
                @delete-item="$emit('delete-item', $event)"
                @restock-change="$emit('restock-change')"
            />

            <div class="inventory-empty" v-if="isMobile && !products.length">
                Nothing in your pantry yet
            </div>
        </div>

    </div>
</template>

<style scoped>
.inventory-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    padding: 16px;
    overflow: hidden;
}

@media (max-width: 768px) {
    .inventory-cards {
        grid-template-columns: 1fr;
    }
}

@keyframes shimmer {
    from { background-position: -400px 0; }
    to   { background-position:  400px 0; }
}

.skel {
    border-radius: 6px;
    background: linear-gradient(90deg, var(--border-subtle) 25%, var(--surface) 50%, var(--border-subtle) 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    height: 14px;
}

.skeleton-row {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle);
}

.skel-icon  { width: 20px; height: 20px; border-radius: 50%; }
.skel-name  { width: 70%; }
.skel-qty   { width: 40px; margin: 0 auto; }
.skel-exp   { width: 60px; }
.skel-cat   { width: 55px; }
.skel-loc   { width: 52px; }

.skeleton-card {
    border-radius: 12px;
    padding: 16px;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skel-card-name { width: 65%; height: 16px; }
.skel-card-line { width: 80%; }
.skel-card-line.short { width: 45%; }

.inventory-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    opacity: 0.4;
    font-size: 0.85rem;
}

.inventory {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: medium;
    scroll-behavior: smooth;
    font-family: "Quicksand";
    font-weight: 500;


    .table-header {
        position: sticky;
        top: 0;
        font-size: small;
        font-family: "Oxygen";
        letter-spacing: 1px;
        font-weight: 400;
        text-transform: uppercase;
        z-index: 1000;
        padding-top: 2px !important;
        padding-bottom: 2px !important;
        background-color: var(--border-subtle);

        >div {
            padding-top: 0;
            padding-bottom: 0;
        }
    }

}
</style>
