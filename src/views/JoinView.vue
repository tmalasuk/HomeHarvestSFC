<script>
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import HouseholdService from '../services/HouseholdService.js'

export default {
    name: 'JoinView',

    data() {
        return {
            state: 'loading',   // loading | needsAuth | preview | accepting | joined | error
            errorMsg: '',
            householdName: '',
            inviteEmail: '',
        }
    },

    computed: {
        token() { return this.$route.query.token ?? '' },
    },

    async mounted() {
        if (!this.token) {
            this.errorMsg = 'Invalid invite link — no token found.'
            this.state = 'error'
            return
        }

        const user = await new Promise(resolve => {
            const unsub = onAuthStateChanged(auth, u => { unsub(); resolve(u) })
        })

        if (!user) {
            sessionStorage.setItem('pendingInviteToken', this.token)
            this.$router.push({ path: '/login', query: { redirect: `/join?token=${this.token}` } })
            return
        }

        // Validate the invite
        try {
            const invite = await HouseholdService.getInvite(this.token)
            if (!invite) {
                this.errorMsg = 'This invite link is invalid or has already been used.'
                this.state = 'error'
                return
            }
            if (new Date() > new Date(invite.expiresAt)) {
                this.errorMsg = 'This invite has expired. Ask the household owner to send a new one.'
                this.state = 'error'
                return
            }

            // Check if user is already in this household
            const userSnap = await getDoc(doc(db, 'users', user.uid))
            if (userSnap.exists() && userSnap.data()?.householdId === invite.householdId) {
                this.$router.replace('/')
                return
            }

            const hh = await HouseholdService.get(invite.householdId)
            this.householdName = hh?.name ?? 'a household'
            this.inviteEmail = invite.email
            this.state = 'preview'
        } catch (err) {
            this.errorMsg = err.message
            this.state = 'error'
        }
    },

    methods: {
        // Accepts the household invite for the current user
        async accept() {
            this.state = 'accepting'
            try {
                const user = auth.currentUser
                await HouseholdService.acceptInvite(this.token, user.uid)
                this.state = 'joined'
            } catch (err) {
                this.errorMsg = err.message
                this.state = 'error'
            }
        },

        // Navigates to the home page
        goHome() {
            this.$router.replace('/')
        },
    },
}
</script>

<template>
    <div class="join-page">
        <div class="join-card">
            <div class="join-logo">🌿 HomeHarvest</div>

            <!-- Loading -->
            <div v-if="state === 'loading'" class="join-body">
                <div class="join-spinner"></div>
                <p class="join-sub">Checking your invite…</p>
            </div>

            <!-- Accepting -->
            <div v-else-if="state === 'accepting'" class="join-body">
                <div class="join-spinner"></div>
                <p class="join-sub">Joining household…</p>
            </div>

            <!-- Preview -->
            <div v-else-if="state === 'preview'" class="join-body">
                <div class="join-icon">🏠</div>
                <h2 class="join-title">You're invited!</h2>
                <p class="join-sub">You've been invited to join</p>
                <p class="join-household">{{ householdName }}</p>
                <p v-if="inviteEmail" class="join-email">Sent to {{ inviteEmail }}</p>
                <button class="join-btn primary" @click="accept">Accept Invite</button>
                <button class="join-btn secondary" @click="goHome">Not now</button>
            </div>

            <!-- Joined -->
            <div v-else-if="state === 'joined'" class="join-body">
                <div class="join-icon">🎉</div>
                <h2 class="join-title">You're in!</h2>
                <p class="join-sub">Welcome to <strong>{{ householdName }}</strong></p>
                <button class="join-btn primary" @click="goHome">Open HomeHarvest</button>
            </div>

            <!-- Error -->
            <div v-else-if="state === 'error'" class="join-body">
                <div class="join-icon">⚠️</div>
                <h2 class="join-title">Something went wrong</h2>
                <p class="join-sub">{{ errorMsg }}</p>
                <button class="join-btn secondary" @click="goHome">Go Home</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.join-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg2, #f5f5f5);
    padding: 1rem;
}

.join-card {
    background: var(--bg, #fff);
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 18px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    text-align: center;
}

.join-logo {
    font-size: 1.2rem;
    font-weight: 700;
    font-family: 'Quicksand', sans-serif;
    color: var(--accent, #5a8a5a);
    margin-bottom: 2rem;
    letter-spacing: 0.02em;
}

.join-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}

.join-icon {
    font-size: 3rem;
    margin-bottom: 0.25rem;
}

.join-title {
    font-family: 'Quicksand', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text, #222);
    margin: 0;
}

.join-household {
    font-family: 'Oxygen', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--accent, #5a8a5a);
    margin: 0;
}

.join-email {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.85rem;
    color: var(--text-muted, #888);
    margin: 0;
}

.join-sub {
    font-family: 'Oxygen', sans-serif;
    font-size: 0.95rem;
    color: var(--text-muted, #666);
    margin: 0;
}

.join-btn {
    width: 100%;
    padding: 0.75rem;
    border-radius: 10px;
    border: none;
    font-family: 'Oxygen', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 0.25rem;
    transition: opacity 0.15s;

    &:hover { opacity: 0.85; }

    &.primary {
        background: var(--accent, #5a8a5a);
        color: #fff;
    }

    &.secondary {
        background: var(--surface, #f0f0f0);
        color: var(--text-muted, #666);
    }
}

@keyframes spin { to { transform: rotate(360deg); } }

.join-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border, #e0e0e0);
    border-top-color: var(--accent, #5a8a5a);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
</style>
