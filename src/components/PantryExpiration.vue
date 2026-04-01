<script>
import * as utils from '../utils.js';

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
        return Math.max(...this.batch.map(i => utils.daysToPercent(i.expiration)));
      }
      if (this.item) return utils.daysToPercent(this.item.expiration);
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

.progress {
        width: 100%;
        height: 10px;
        border-radius: 5px;
        position: relative;

        .fill {
            height: 100%;
            border-radius: 4px 0 0 4px;
            transition: width 0.3s ease;

            &.green {
                background-color: var(--success);
            }

            &.yellow {
                background-color: var(--warning);
            }

            &.red {
                background-color: var(--danger);
            }
        }
    }

</style>
