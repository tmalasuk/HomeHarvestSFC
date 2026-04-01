<script>
export default {
    name: "RecipeImportModal",

    emits: ['close', 'import'],

    props: {
        show: { type: Boolean, required: true },
    },

    data() {
        return {
            fillActive: false,
            closing: false,
            url: '',
        };
    },

    methods: {
        handleClose() {
            if (this.closing) return;
            this.closing = true;
            setTimeout(() => {
                this.url = '';
                this.$emit('close');
            }, 280);
        },

        handleImport() {
            if (!this.url.trim()) return;
            this.$emit('import', this.url.trim());
            setTimeout(() => this.handleClose(), 150);
        },
    },

    watch: {
        show(val) {
            if (val) {
                this.$nextTick(() => {
                    setTimeout(() => {
                        const rect = this.$refs.svgRect;
                        if (rect) {
                            const len = Math.ceil(rect.getTotalLength()) + 2;
                            rect.style.strokeDasharray = len;
                            rect.style.strokeDashoffset = len;
                            void rect.getBoundingClientRect();
                            rect.style.animation = 'sketch-in 0.7s cubic-bezier(0.165, 0.840, 0.440, 1.000) forwards';
                        }
                        this._fillTimer = setTimeout(() => { this.fillActive = true; }, 700);
                    }, 300);
                });
            } else {
                this.closing = false;
                this.fillActive = false;
                clearTimeout(this._fillTimer);
                const rect = this.$refs.svgRect;
                if (rect) {
                    rect.style.animation = 'none';
                    rect.style.strokeDasharray = '';
                    rect.style.strokeDashoffset = '';
                }
            }
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <teleport to="body">
    <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose"></div>
    <div class="import-url-container" :class="{ show: show, 'fill-active': fillActive, closing: closing }">
        <svg class="modal-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect class="modal-svg-rect" ref="svgRect" x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="18" ry="18"
                fill="none" stroke="white" stroke-width="3"
                stroke-dasharray="9999" stroke-dashoffset="9999"/>
        </svg>
        <span class="close-x" @click="handleClose">&times;</span>
        <div class="import-url-body">
            <h3 class="import-url-title">Import from URL</h3>
            <label>Recipe URL</label>
            <input type="url" v-model="url" placeholder="https://..." />
            <button class="btn" type="button" @click="handleImport">
                <i class="bi bi-cloud-download"></i><span> Import</span>
            </button>
        </div>
    </div>
    </teleport>
</template>

<style scoped></style>
