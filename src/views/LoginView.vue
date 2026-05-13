<script>
import AuthService from '../services/AuthService.js'

export default {
    name: 'LoginView',

    data() {
        return {
            mode: 'login',
            name: '',
            email: '',
            password: '',
            error: null,
            loading: false,
            googleLoading: false,
        }
    },

    methods: {
        // Submits the login or register form, redirecting on success
        async submit() {
            this.error = null
            this.loading = true
            try {
                if (this.mode === 'login') {
                    await AuthService.login(this.email, this.password)
                } else {
                    if (!this.name.trim()) {
                        this.error = 'Name is required.'
                        this.loading = false
                        return
                    }
                    await AuthService.register(this.name.trim(), this.email, this.password)
                }
                this.$router.push(this.$route.query.redirect || '/')
            } catch (e) {
                this.error = this.friendlyError(e.code)
            } finally {
                this.loading = false
            }
        },

        // Signs in via Google popup and redirects on success
        async signInWithGoogle() {
            this.error = null
            this.googleLoading = true
            try {
                await AuthService.loginWithGoogle()
                this.$router.push(this.$route.query.redirect || '/')
            } catch (e) {
                if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
                    this.error = this.friendlyError(e.code)
                }
            } finally {
                this.googleLoading = false
            }
        },

        // Maps Firebase auth error codes to human-readable messages
        friendlyError(code) {
            const map = {
                'auth/invalid-email':          'Invalid email address.',
                'auth/invalid-credential':     'Incorrect email or password.',
                'auth/email-already-in-use':   'An account with that email already exists.',
                'auth/weak-password':          'Password must be at least 6 characters.',
            }
            return map[code] ?? 'Something went wrong. Please try again.'
        },

        // Switches between login and register modes and resets the form
        switchMode(m) {
            this.mode = m
            this.error = null
            this.name = ''
            this.email = ''
            this.password = ''
        },
    },
}
</script>

<template>
    <main class="d-flex">
        <div class="login-body">

            <!-- Leaf decorations -->
            <div class="leaves" aria-hidden="true">
                <div class="leaf leaf-a"></div>
                <div class="leaf leaf-b"></div>
                <div class="leaf leaf-c"></div>
                <div class="leaf leaf-d"></div>
                <div class="leaf leaf-e"></div>
                <div class="leaf leaf-f"></div>
                <div class="leaf leaf-g"></div>
                <div class="leaf leaf-h"></div>
            </div>

            <!-- Card: two-column on md+ -->
            <div class="login-card" :style="{ maxWidth: mode === 'register' ? '460px' : '1100px' }">
                <div class="row g-0">

                    <!-- Left: Features pitch panel -->
                    <div class="features-panel flex-column d-none"
                         :class="{ 'd-md-flex': mode !== 'register' }">

                        <div class="d-flex align-items-center gap-2 mb-4">
                            <img src="/img/HH_icon.png" alt="" class="fp-icon">
                            <span class="fp-brand">HomeHarvest</span>
                        </div>

                        <h2 class="fp-headline">Your kitchen,<br>organized.</h2>
                        <p class="fp-sub">Stop guessing what's in your pantry. HomeHarvest keeps everything in one place so nothing gets wasted.</p>

                        <ul class="list-unstyled mt-4 d-flex flex-column gap-3 mb-0">
                            <li class="d-flex align-items-start gap-3">
                                <div class="fp-feat-icon"><i class="bi bi-archive"></i></div>
                                <div>
                                    <div class="fp-feat-title">Pantry tracking</div>
                                    <div class="fp-feat-desc">Always know what you have on hand.</div>
                                </div>
                            </li>
                            <li class="d-flex align-items-start gap-3">
                                <div class="fp-feat-icon"><i class="bi bi-stars"></i></div>
                                <div>
                                    <div class="fp-feat-title">Smart recipe generation</div>
                                    <div class="fp-feat-desc">Get recipe ideas based on what's already in your pantry.</div>
                                </div>
                            </li>
                            <li class="d-flex align-items-start gap-3">
                                <div class="fp-feat-icon"><i class="bi bi-cart-check"></i></div>
                                <div>
                                    <div class="fp-feat-title">Smart shopping lists</div>
                                    <div class="fp-feat-desc">Build your list from what you're running low on.</div>
                                </div>
                            </li>
                            <li class="d-flex align-items-start gap-3">
                                <div class="fp-feat-icon"><i class="bi bi-people"></i></div>
                                <div>
                                    <div class="fp-feat-title">Household sharing</div>
                                    <div class="fp-feat-desc">Keep everyone at home on the same page.</div>
                                </div>
                            </li>
                        </ul>

                        <div class="mt-auto pt-4">
                            <span class="fp-badge"><i class="bi bi-leaf me-1"></i>Reduce food waste</span>
                        </div>

                    </div>

                    <!-- Right: Login panel -->
                    <div class="login-panel">

                        <!-- Icon shown on mobile only (branding is in left panel on desktop) -->
                        <div class="card-icon-wrap d-md-none">
                            <img src="/img/HH_icon.png" alt="" class="card-icon">
                        </div>

                        <h1 class="card-title">
                            {{ mode === 'login' ? 'Welcome back' : 'Create an account' }}
                        </h1>
                        <p class="card-subtitle">
                            {{ mode === 'login' ? "Sign in to see what's in your pantry." : 'Join HomeHarvest today.' }}
                        </p>

                        <!-- Google -->
                        <button class="google-btn" @click="signInWithGoogle" :disabled="googleLoading || loading">
                            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>{{ googleLoading ? 'Signing in…' : 'Continue with Google' }}</span>
                        </button>

                        <!-- Divider -->
                        <div class="divider">
                            <span class="line"></span>
                            <span class="divider-text">or with email</span>
                            <span class="line"></span>
                        </div>

                        <!-- Form -->
                        <form @submit.prevent="submit">
                            <div v-if="mode === 'register'" class="field">
                                <label>Name</label>
                                <div class="input-wrap">
                                    <i class="bi bi-person field-icon"></i>
                                    <input v-model="name" type="text" placeholder="Your name" autocomplete="name">
                                </div>
                            </div>

                            <div class="field">
                                <label>Email</label>
                                <div class="input-wrap">
                                    <i class="bi bi-envelope field-icon"></i>
                                    <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email">
                                </div>
                            </div>

                            <div class="field">
                                <div class="field-header">
                                    <label>Password</label>
                                    <a v-if="mode === 'login'" href="#" class="forgot-link" @click.prevent>Forgot?</a>
                                </div>
                                <div class="input-wrap">
                                    <i class="bi bi-lock field-icon"></i>
                                    <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password">
                                </div>
                            </div>

                            <p v-if="error" class="auth-error">
                                <i class="bi bi-exclamation-circle"></i> {{ error }}
                            </p>

                            <button type="submit" class="submit-btn" :disabled="loading || googleLoading">
                                {{ loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}
                            </button>
                        </form>

                        <p class="switch-mode">
                            <template v-if="mode === 'login'">
                                New to HomeHarvest?
                                <a href="#" @click.prevent="switchMode('register')">Create an account</a>
                            </template>
                            <template v-else>
                                Already have an account?
                                <a href="#" @click.prevent="switchMode('login')">Sign in</a>
                            </template>
                        </p>

                    </div>
                </div>
            </div>

        </div>
    </main>
</template>

<style lang="scss" scoped>
// ── Layout ───────────────────────────────────────────────────────────────
main {
    background: #eae7e2;
    flex-direction: column;
}

.login-body {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    min-height: calc(100vh - 90px);
}

// ── Leaf decorations ─────────────────────────────────────────────────────
.leaves {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.leaf {
    position: absolute;
    border-radius: 0 100% 0 100%;
    background: rgba(122, 140, 112, 0.30);
}

.leaf-a { width: 160px; height: 260px; top: -80px; left: -60px; transform: rotate(32deg); }
.leaf-b { width: 110px; height: 190px; top: 20px; left: 30px; transform: rotate(62deg); background: rgba(140, 158, 128, 0.20); }
.leaf-c { width: 160px; height: 260px; top: -80px; right: -60px; transform: rotate(-32deg); }
.leaf-d { width: 110px; height: 190px; top: 20px; right: 30px; transform: rotate(-62deg); background: rgba(140, 158, 128, 0.20); }
.leaf-e { width: 160px; height: 260px; bottom: -80px; left: -60px; transform: rotate(-32deg); }
.leaf-f { width: 110px; height: 190px; bottom: 20px; left: 30px; transform: rotate(-62deg); background: rgba(140, 158, 128, 0.20); }
.leaf-g { width: 160px; height: 260px; bottom: -80px; right: -60px; transform: rotate(32deg); }
.leaf-h { width: 110px; height: 190px; bottom: 20px; right: 30px; transform: rotate(62deg); background: rgba(140, 158, 128, 0.20); }

// ── Card ─────────────────────────────────────────────────────────────────
.login-card {
    position: relative;
    z-index: 1;
    width: 100%;
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0, 0, 0, 0.05);
    transition: max-width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

// ── Features panel (left) ─────────────────────────────────────────────────
.features-panel {
    background: #3d5640;
    padding: 2.5rem 2rem;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    overflow: hidden;
    flex: 1 1 0;
    min-width: 0;
    transition: opacity 0.3s ease;
}

.fp-icon {
    width: 30px;
    height: 30px;
}

.fp-brand {
    font-size: 1.05rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
}

.fp-headline {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.025em;
    line-height: 1.25;
    margin: 0 0 0.75rem;
}

.fp-sub {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.6;
    margin: 0;
}

.fp-feat-icon {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.88);
    font-size: 0.95rem;
}

.fp-feat-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.1rem;
}

.fp-feat-desc {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.45;
}

.fp-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.13);
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.35rem 0.8rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.18);
}

// ── Login panel (right) ───────────────────────────────────────────────────
.login-panel {
    padding: 2.25rem 2.25rem 2rem;
    flex: 0 0 420px;
}

// ── Card header ──────────────────────────────────────────────────────────
.card-icon-wrap {
    width: 52px;
    height: 52px;
    background: #f2f0ec;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
}

.card-icon {
    width: 30px;
    height: 30px;
}

.card-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #1a1a18;
    text-align: center;
    margin: 0 0 0.3rem;
    letter-spacing: -0.02em;
}

.card-subtitle {
    font-size: 0.85rem;
    color: #888880;
    text-align: center;
    margin: 0 0 1.5rem;
}

// ── Google button ─────────────────────────────────────────────────────────
.google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.65rem 1rem;
    background: #fff;
    border: 1.5px solid #dedad4;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #2a2a28;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;

    &:hover:not(:disabled) {
        background: #f9f8f6;
        border-color: #c8c4be;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.google-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

// ── Divider ──────────────────────────────────────────────────────────────
.divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.25rem 0;

    .line {
        flex: 1;
        height: 1px;
        background: #e8e4df;
    }
}

.divider-text {
    font-size: 0.75rem;
    color: #aaa89f;
    white-space: nowrap;
}

// ── Form fields ──────────────────────────────────────────────────────────
.field {
    margin-bottom: 0.9rem;
}

.field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.35rem;
}

label {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: #4a4a46;
    margin-bottom: 0.35rem;
}

.field-header label { margin-bottom: 0; }

.forgot-link {
    font-size: 0.78rem;
    color: #888880;
    text-decoration: none;

    &:hover { color: #4a6647; text-decoration: underline; }
}

.input-wrap {
    position: relative;

    .field-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #b8b5ae;
        font-size: 0.85rem;
        pointer-events: none;
    }

    input {
        width: 100%;
        padding: 0.62rem 0.8rem 0.62rem 2.2rem;
        background: #fff;
        border: 1.5px solid #e2dfd9;
        border-radius: 10px;
        font-size: 0.9rem;
        color: #1a1a18;
        box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s;
        outline: none;

        &::placeholder { color: #c4c1ba; }

        &:focus {
            border-color: #6a9a6e;
            box-shadow: 0 0 0 3px rgba(106, 154, 110, 0.12);
        }
    }
}

// ── Error ─────────────────────────────────────────────────────────────────
.auth-error {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: #c0392b;
    background: #fdf2f2;
    border: 1px solid #f5c6c6;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    margin: 0 0 0.9rem;
}

// ── Submit button ─────────────────────────────────────────────────────────
.submit-btn {
    width: 100%;
    padding: 0.72rem;
    background: #4a6647;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.25rem;
    letter-spacing: 0.01em;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;

    &:hover:not(:disabled) {
        background: #3d5640;
        box-shadow: 0 2px 8px rgba(74, 102, 71, 0.3);
    }

    &:active:not(:disabled) { transform: scale(0.99); }

    &:disabled { opacity: 0.55; cursor: not-allowed; }
}

// ── Switch mode ───────────────────────────────────────────────────────────
.switch-mode {
    text-align: center;
    font-size: 0.82rem;
    color: #888880;
    margin: 1.25rem 0 0;

    a {
        color: #4a6647;
        font-weight: 600;
        text-decoration: none;

        &:hover { text-decoration: underline; }
    }
}
</style>
