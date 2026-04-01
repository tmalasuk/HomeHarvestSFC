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
            <div class="col-md-13">Name</div>
            <div class="col-md-4">Qty</div>
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

<style scoped></style>
