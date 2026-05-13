<script>
export default {
    name: "BaseDurationInput",

    props: {
        duration: { type: Number, required: true },
        unitIndex: { type: Number, required: true },
        units: { type: Array, required: true },
        trackWidth: { type: String, default: '100%' },
        variant: { type: String, default: 'pantry' }, // 'pantry' | 'grocery'
    },

    methods: {
        // Decrements the unit index to the previous unit in the list
        prevUnit() {
            if (this.unitIndex > 0) {
                this.$emit('update:unit-index', this.unitIndex - 1);
            }
        },
        // Increments the unit index to the next unit in the list
        nextUnit() {
            if (this.unitIndex < this.units.length - 1) {
                this.$emit('update:unit-index', this.unitIndex + 1);
            }
        },
        // Emits the updated numeric duration value from the input event
        onDurationChange(e) {
            this.$emit('update:duration', Number(e.target.value));
        },
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div :class="['duration-input', `duration-input--${variant}`, { 'col-10': trackWidth === '100%' }]">
        <input type="number" min="1" class="duration-number" :value="duration" @change="onDurationChange" />
        <div class="unit-switcher">
            <button class="unit-arrow left" type="button" @click="prevUnit">
                <i class="bi bi-caret-left-fill"></i>
            </button>
            <div class="unit-display">
                <div class="unit-track"
                    :style="{ transform: 'translateX(calc(-' + unitIndex + ' * ' + trackWidth + '))' }">
                    <span v-for="(unit, index) in units" :key="unit" :class="{ active: index === unitIndex }">
                        {{ unit }}
                    </span>
                </div>
            </div>
            <button class="unit-arrow right" type="button" @click="nextUnit">
                <i class="bi bi-caret-right-fill"></i>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// ── Shared base ──────────────────────────────────────────────
.duration-input {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.duration-number {
    text-align: center;
    background: transparent;
    color: inherit;
    font-family: inherit;

    &:focus {
        outline: none;
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

.unit-switcher {
    display: flex;
    align-items: center;
    
}

.unit-display {
    overflow: hidden;
    display: flex;
    align-items: center;
}

.unit-track {
    display: flex;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.unit-arrow {
    border: none;
    background: none;
    cursor: pointer;
    line-height: 1;
    color: inherit;
    flex-shrink: 0;

    &:disabled {
        opacity: 0.2;
        cursor: default;
    }
}

// ── Pantry variant (inline expiration editor) ────────────────
.duration-input--pantry {
    gap: 20px;

    .duration-number {
        width: 28px;
        font-size: .8rem;
        font-weight: 600;
        border-radius: 5px;
        font-family: 'Quicksand', sans-serif;
        border: none;
        border: 1px solid var(--border);
    }

    .unit-track span {
        flex: 0 0 72px;
        font-size: .9rem;
        text-align: center;
        line-height: 1rem;
    }

    .unit-display {
        width: 72px;
        height: 1rem;
    }

    .unit-arrow {
        font-size: 0.5rem;
        padding: 0 2px;
        opacity: 0.7;

        &:hover {
            opacity: 1;
        }

        &.left:hover { transform: translateX(-1px); }
        &.right:hover { transform: translateX(1px); }
    }
}

// ── Grocery variant (item list) ──────────────────────────────
.duration-input--grocery {
    gap: 20px;
    margin-right: 20px;

    .duration-number {
        width: 36px;
        font-family: 'Oxygen', sans-serif;
        font-size: 0.8rem;
        font-weight: 500;
        border: 1px solid var(--border);
        border-radius: 5px;
        padding: 3px 0;
        transition: border-color 0.2s;
    }

    .unit-track span {
        flex: 0 0 80px;
        text-align: center;
        font-family: 'Inter', sans-serif;
        font-size: 0.68rem;
        font-weight: 300;
        letter-spacing: 0.03em;
        color: var(--text-muted);
        line-height: 24px;
    }

    .unit-display {
        width: 80px;
        height: 24px;
    }

    .unit-arrow {
        font-size: 0.55rem;
        padding: 4px 3px;
        opacity: 0.25;
        color: var(--text);
        transition: opacity 0.15s, transform 0.15s;

        &:hover {
            opacity: 0.85;
        }

        &.left:hover { transform: translateX(-2px); }
        &.right:hover { transform: translateX(2px); }
    }
}
</style>
