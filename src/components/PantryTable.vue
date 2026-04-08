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
    },

    emits: ['stop-editing-name', 'delete-product', 'delete-item', 'restock-change'],
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div class="container inventory">

        <!-- v-show keeps DOM alive across resize — avoids destroy/recreate bugs -->

        <div class="row table-header" v-show="!isMobile">
            <div class="col-1"></div>
            <div class="col-md-10">Name</div>
            <div class="col-md-7" style="display:flex;justify-content:center">Qty</div>
            <div class="col-md-7">Exp</div>
            <div class="col-md-7">Category</div>
            <div class="col-md-3" style="display:flex;justify-content:center">Trash</div>
            <div class="col-md-3" style="display:flex;justify-content:center;margin-left:30px">Restock</div>
        </div>

        <pantry-row
            v-show="!isMobile"
            v-for="(product, index) in products"
            :key="'desktop-' + product.id"
            :product="product"
            :index="index"
            :is-mobile="isMobile"
            :units="units"
            @stop-editing-name="$emit('stop-editing-name', $event)"
            @delete-product="$emit('delete-product', $event)"
            @delete-item="$emit('delete-item', $event)"
            @restock-change="$emit('restock-change')"
        />

        <div class="inventory-cards" v-show="isMobile">
            <pantry-card
                v-for="(product, index) in products"
                :key="'mobile-' + product.id"
                :product="product"
                :index="index"
                :units="units"
                :categories="categories"
                @stop-editing-name="$emit('stop-editing-name', $event)"
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
}

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
    max-height: 55vh;
    min-height: 55vh;
    overflow: auto;
    scroll-behavior: smooth;
    font-family: "Quicksand";
    font-weight: 500;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--box-shadow);


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
