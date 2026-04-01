<script>
export default {
    name: "AppThemeToggle",

    data() {
        return {
            isDark: document.documentElement.getAttribute('data-theme') === 'dark',
        };
    },

    methods: {
        toggle() {
            this.isDark = !this.isDark;
            document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        },
    },
    mounted() {
        // Set the attribute on page load so styles actually apply
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    },
}
</script>

<!-- // paths must be relative (what file you are currently in)-->
<template>
    <div id="vue-toggle" class="toggle">
        <div class="toggle-track" role="switch" tabindex="0" :aria-checked="!isDark" @click="toggle"
            @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle">

            <span class="track-star s1"></span>
            <span class="track-star s2"></span>
            <span class="track-star s3"></span>
            <span class="track-cloud c1"></span>
            <span class="track-cloud c2"></span>

            <div class="toggle-thumb" :class="isDark ? 'dark-mode' : 'light-mode'">
                <span class="icon-wrap icon-moon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </span>
                <span class="icon-wrap icon-sun">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        width="16" height="16">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

@use "@/assets/variables" as *;
//dark and light mode toggle
.toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    box-shadow: var(--box-shadow);
    border-radius: 50%;

    // ── Toggle Wrapper ──
    #vue-toggle {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    // ── Label ──
    .toggle-label {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
        font-weight: 500;
        transition: color var(--toggle-transition);
    }

    // ── Track ──
    .toggle-track {
        position: relative;
        width: 80px;
        height: 40px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--track-from, #1a183a), var(--track-to, #2d2660));

        border: 1.5px solid var(--border);
        cursor: pointer;
        transition:
            background-color var(--toggle-transition),
            border-color var(--toggle-transition),
            box-shadow var(--toggle-transition);

        &:hover {
            box-shadow: 0 0 18px 4px var(--glow);
        }

        &:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 3px;
        }

        &:active .toggle-thumb {
            transform: scale(0.92);
        }
    }

    // ── Thumb ──
    .toggle-thumb {
        position: absolute;
        top: 4px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--thumb);
        box-shadow: var(--box-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition:
            left var(--toggle-transition),
            background-color var(--toggle-transition),
            transform 0.15s ease;

        &.dark-mode {
            left: 4px;
        }

        &.light-mode {
            left: 46px;
        }
    }

    // ── Icons ──
    .icon-wrap {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            opacity 0.3s ease,
            transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
    }

    .icon-moon {
        color: #ffeed4;
    }

    .icon-sun {
        color: #ffeed4;
    }

    .toggle-thumb {
        &.dark-mode {
            .icon-moon {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            .icon-sun {
                opacity: 0;
                transform: rotate(90deg) scale(0.5);
            }
        }

        &.light-mode {
            .icon-sun {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            .icon-moon {
                opacity: 0;
                transform: rotate(-90deg) scale(0.5);
            }
        }
    }

    // ── Track Stars (dark mode) ──
    .track-star {
        position: absolute;
        border-radius: 50%;
        background: var(--star-color);
        opacity: 0;
        transition: opacity 0.4s ease;

        [data-theme="dark"] & {
            opacity: 1;
        }

        &.s1 {
            width: 3px;
            height: 3px;
            top: 8px;
            right: 14px;
        }

        &.s2 {
            width: 2px;
            height: 2px;
            top: 18px;
            right: 20px;
        }

        &.s3 {
            width: 2px;
            height: 2px;
            top: 12px;
            right: 26px;
        }
    }

    // ── Track Sun Rays (light mode) ──
    .track-ray {
        position: absolute;
        top: 50%;
        left: 12px;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        opacity: 0;
        transition: opacity 0.4s ease;

        [data-theme="light"] & {
            opacity: 0.45;
        }

        &::before,
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 14px;
            height: 1.5px;
            background: #32302e;
            border-radius: 2px;
        }

        &::before {
            transform: translate(-50%, -50%) rotate(0deg);
        }

        &::after {
            transform: translate(-50%, -50%) rotate(90deg);
        }
    }
}

.track-cloud {
    position: absolute;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    opacity: 0;
    transition: opacity 0.4s ease;

    [data-theme="light"] & {
        opacity: 1;
    }

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
    }

    &.c1 {
        width: 14px;
        height: 5px;
        top: 10px;
        left: 10px;

        &::before {
            width: 6px;
            height: 6px;
            top: -3px;
            left: 2px;
        }

        &::after {
            width: 5px;
            height: 5px;
            top: -2px;
            left: 6px;
        }
    }

    &.c2 {
        width: 10px;
        height: 4px;
        top: 22px;
        left: 20px;

        &::before {
            width: 4px;
            height: 4px;
            top: -2px;
            left: 1px;
        }

        &::after {
            width: 4px;
            height: 4px;
            top: -2px;
            left: 4px;
        }
    }
}
</style>
