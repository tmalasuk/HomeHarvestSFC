<script>
import ClaudeService from '../services/ClaudeService.js';

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
            active: false,
            isMobile: window.matchMedia('(max-width: 768px)').matches,
            url: '',
            importing: false,
            error: null,
            importProgress: 0,
            importPhraseIndex: 0,
            importPhrases: [
                'Fetching the page…',
                'Reading ingredients…',
                'Parsing the recipe…',
                'Formatting details…',
                'Checking cook times…',
                'Almost there…',
            ],
            _phraseTimer: null,
            _progressTimer: null,
        };
    },

    methods: {
        // Triggers the closing animation then resets state and emits close (blocked while importing)
        handleClose() {
            if (this.closing || this.importing) return;
            this.closing = true;
            setTimeout(() => {
                this.url = '';
                this.error = null;
                this.$emit('close');
            }, 280);
        },

        // Fetches and imports a recipe from the entered URL, showing progress during the request
        async handleImport() {
            if (!this.url.trim() || this.importing) return;
            this.importing = true;
            this.error = null;
            this._startProgress();
            let recipe = null;
            let caughtError = null;
            try {
                recipe = await ClaudeService.importFromUrl(this.url.trim());
                if (!recipe) throw new Error('No recipe found at that URL');
            } catch (err) {
                caughtError = err.message;
            }
            await this._stopProgress();
            this.importing = false;
            if (caughtError) {
                this.error = caughtError;
            } else {
                this.$emit('import', recipe);
                setTimeout(() => this.handleClose(), 150);
            }
        },

        // Starts the animated progress bar and rotating status phrases
        _startProgress() {
            this.importProgress = 0;
            this.importPhraseIndex = 0;
            const start = Date.now();
            this._progressTimer = setInterval(() => {
                const elapsed = Date.now() - start;
                this.importProgress = Math.round(95 * (1 - Math.exp(-elapsed / 12000)));
            }, 150);
            this._phraseTimer = setInterval(() => {
                this.importPhraseIndex = (this.importPhraseIndex + 1) % this.importPhrases.length;
            }, 2500);
        },

        // Stops the progress timers, snaps to 100%, and waits 800ms for the fill animation to finish
        _stopProgress() {
            clearInterval(this._progressTimer);
            clearInterval(this._phraseTimer);
            this._progressTimer = null;
            this._phraseTimer = null;
            this.importProgress = 100;
            return new Promise(resolve => setTimeout(resolve, 800));
        },
    },

    watch: {
        show: {
          immediate: true,
          handler(val) {
            if (val) {
                this.$nextTick(() => requestAnimationFrame(() => { this.active = true; }));
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
                this.active = false;
                this.closing = false;
                this.fillActive = false;
                this.url = '';
                this.error = null;
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
    },

    mounted() {
        this._mq = window.matchMedia('(max-width: 768px)');
        this._mqCb = e => { this.isMobile = e.matches; };
        this._mq.addEventListener('change', this._mqCb);
    },

    beforeUnmount() {
        clearInterval(this._progressTimer);
        clearInterval(this._phraseTimer);
        this._mq?.removeEventListener('change', this._mqCb);
    },
}
</script>

<template>
    <teleport to="body">
    <div class="modal-backdrop" :class="{ show: active }" @click.self="handleClose"></div>
    <div class="import-url-container" :class="{ show: active, 'fill-active': fillActive, closing: closing, 'is-mobile': isMobile }">
        <svg class="modal-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect class="modal-svg-rect" ref="svgRect" x="1.5" y="1.5" width="calc(100% - 3px)" height="calc(100% - 3px)" rx="18" ry="18"
                fill="none" stroke="white" stroke-width="3"
                stroke-dasharray="9999" stroke-dashoffset="9999"/>
        </svg>
        <span class="close-x" @click="handleClose">&times;</span>
        <div class="import-url-body">
            <h3 class="import-url-title">Import from URL</h3>

            <transition name="panel-fade" mode="out-in">

                <!-- Loading state -->
                <div v-if="importing" key="loading" class="chef-loading">
                    <div class="chef-details">
                        <transition name="phrase-fade" mode="out-in">
                            <span class="chef-phrase" :key="importPhraseIndex">{{ importPhrases[importPhraseIndex] }}</span>
                        </transition>
                        <div class="chef-bar-wrap">
                            <div class="chef-bar-fill" :style="{ width: importProgress + '%' }"></div>
                        </div>
                        <span class="chef-pct">{{ importProgress }}%</span>
                    </div>
                </div>

                <!-- Input state -->
                <div v-else key="input" class="import-input-area">
                    <p class="import-url-hint">Paste a link to any recipe page and we'll extract it for you.</p>

                    <label>Recipe URL</label>
                    <input type="url" v-model="url" placeholder="https://..."
                        @keydown.enter="handleImport" />

                    <p v-if="error" class="import-error"><i class="bi bi-exclamation-circle"></i> {{ error }}</p>

                    <button class="btn" type="button" :disabled="!url.trim()" @click="handleImport">
                        <i class="bi bi-cloud-download"></i>
                        <span>Import</span>
                    </button>
                </div>

            </transition>
        </div>
    </div>
    </teleport>
</template>

<style lang="scss" scoped>
@use "@/assets/variables" as *;

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

.import-url-container {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 320px;
    border-radius: 20px;
    padding: 30px;
    font-family: 'Quicksand', sans-serif;
    z-index: 1050;
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: opacity 0.2s ease, visibility 0.2s ease;

    > .close-x {
        opacity: 0;
        position: absolute;
        top: 20px;
        right: 22px;
        z-index: 10;
    }

    > .import-url-body {
        opacity: 0;
    }

    &.show {
        width: 420px;
        visibility: visible;
        opacity: 1;
        pointer-events: auto;
    }

    &.closing {
        visibility: visible;
        animation: modal-pop-out 0.28s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
    }

    &.fill-active {
        box-shadow: rgba(0, 0, 0, 0.56) 0px 22px 70px 4px;
        background-color: var(--modal-bg);

        > .close-x,
        > .import-url-body {
            animation: sink-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
    }
}

.modal-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
    overflow: visible;
}

.modal-svg-rect { fill: none; }

.close-x {
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    color: var(--text-faint);
    transition: color 0.15s ease;

    &:hover { color: var(--text); }
}

.import-url-body {
    margin-top: 10px;
}

.import-url-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 16px;
}

// ── Panel transition between input and loading ──────────────
.panel-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.panel-fade-leave-active { transition: opacity 0.15s ease; }
.panel-fade-enter-from   { opacity: 0; transform: translateY(6px); }
.panel-fade-leave-to     { opacity: 0; }

// ── Loading state ───────────────────────────────────────────
.chef-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0 16px;
}

.chef-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.phrase-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.phrase-fade-leave-active { transition: opacity 0.2s ease; }
.phrase-fade-enter-from   { opacity: 0; transform: translateY(5px); }
.phrase-fade-leave-to     { opacity: 0; }

.chef-phrase {
    font-family: 'Oxygen';
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
    min-height: 22px;
}

.chef-bar-wrap {
    width: 100%;
    height: 6px;
    background: var(--border);
    border-radius: 10px;
    overflow: hidden;
}

.chef-bar-fill {
    height: 100%;
    background: linear-gradient(to right, var(--accent-dim, #a0c0aa), var(--accent, #5a8a6a));
    border-radius: 10px;
    transition: width 0.25s ease;
}

.chef-pct {
    font-family: 'Oxygen';
    font-size: 12px;
    color: var(--text-faint);
    letter-spacing: 0.05em;
}

// ── Input state ─────────────────────────────────────────────
.import-url-hint {
    font-size: 0.82rem;
    color: var(--text-faint);
    margin: 0 0 20px;
}

label {
    display: block;
    font-size: 1.05rem;
    font-family: 'Quicksand', sans-serif;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--text);
}

input[type="url"] {
    width: 100%;
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 8px 10px;
    font-family: 'Quicksand', sans-serif;
    font-size: 0.95rem;
    background: transparent;
    color: var(--text);
    box-sizing: border-box;
    margin-bottom: 16px;

    &:focus { outline: none; }
    &::placeholder { color: var(--text-faint); opacity: 1; }
}

.import-error {
    font-size: 0.82rem;
    color: var(--danger-accent, #c0392b);
    margin: -8px 0 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background-color: var(--modal-btn-bg);
    color: var(--text);
    font-family: 'Quicksand', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.15s ease;

    &:hover:not(:disabled) { opacity: 0.8; }
    &:disabled { opacity: 0.4; cursor: default; }
}

// ── Hide SVG border on mobile ─────────────────────────────────
@media (max-width: 768px) {
    .modal-svg { display: none; }
}

// ── Mobile bottom sheet (JS-detected — higher specificity than .show rules) ──
.is-mobile.import-url-container {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    min-height: 45dvh;
    max-height: 90dvh;
    padding: 0;
    border-radius: 24px 24px 0 0;
    background: var(--bg);
    box-shadow: 0 -6px 40px rgba(0, 0, 0, 0.22);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    visibility: visible;
    opacity: 1;
    pointer-events: none;
    transform: translateY(110%);
    transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);

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

    > .close-x { opacity: 1; animation: none; }

    > .import-url-body {
        opacity: 1;
        animation: none;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding: 8px 20px env(safe-area-inset-bottom, 32px);
        margin-top: 0;
    }
}

.is-mobile.import-url-container.show {
    transform: translateY(0);
    pointer-events: auto;
    overflow: hidden;
    max-height: 90dvh;
    width: 100%;
}

.is-mobile.import-url-container.fill-active {
    background: var(--bg);
    box-shadow: 0 -6px 40px rgba(0, 0, 0, 0.22);
    > .close-x, > .import-url-body { animation: none; opacity: 1; }
}

.is-mobile.import-url-container.closing {
    animation: none;
    transform: translateY(110%);
    pointer-events: none;
    transition: transform 0.28s ease-in;
}
</style>
