<script>
import Expiration from '../models/Expiration.js';

export default {
  name: "PantryExpiration",

  props: {
    batch: { type: Array, default: null },  // product-level: use the worst item
    item: { type: Object, default: null },  // item-level: single batch entry
    variant: { type: String, default: 'row' }, // 'row' (Bootstrap) | 'card' (custom CSS)
  },

  computed: {
    percent() {
      if (this.batch) {
        if (!this.batch.length) return 0;
        return Math.max(...this.batch.map(i => Expiration.toPercent(i.expiration.toDate())));
      }
      if (this.item) return Expiration.toPercent(this.item.expiration.toDate());
      return 0;
    },
    barClass() {
      if (this.percent <= 40) return 'bg-success';
      if (this.percent <= 70) return 'bg-warning';
      return 'bg-danger';
    },
  },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
  <div v-if="variant === 'row'" class="progress-wrapper">
    <div class="progress">
      <div class="progress-bar" :class="barClass"
           role="progressbar"
           :style="{ width: percent + '%' }">
      </div>
    </div>
  </div>
  <div v-else class="exp-track">
    <div class="exp-fill" :class="barClass"
         :style="{ width: percent + '%' }">
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

//bootstrap override
.progress {
    --bs-progress-bg: var(--progress-bar); 
}


</style>
