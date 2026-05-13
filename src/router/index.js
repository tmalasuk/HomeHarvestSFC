import { createRouter, createWebHashHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import HouseholdService from '../services/HouseholdService.js'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import JoinView from '../views/JoinView.vue'

// Returns a promise that resolves to the current Firebase user once auth state is known
function getCurrentUser() {
    return new Promise(resolve => {
        const unsub = onAuthStateChanged(auth, user => {
            unsub()
            resolve(user)
        })
    })
}

// Generates a random friendly household name like "The Cozy Pantry"
function generateHouseholdName() {
    const adj  = ['Cozy', 'Sunny', 'Happy', 'Warm', 'Bright', 'Green', 'Golden', 'Little', 'Merry', 'Rustic']
    const noun = ['Kitchen', 'Pantry', 'Homestead', 'Harvest', 'Hearth', 'Garden', 'Larder', 'Nook', 'Basket', 'Cellar']
    const a = adj[Math.floor(Math.random() * adj.length)]
    const n = noun[Math.floor(Math.random() * noun.length)]
    return `The ${a} ${n}`
}

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/login',    component: LoginView,    meta: { requiresGuest: true } },
        { path: '/',         component: HomeView,     meta: { requiresAuth: true } },
        { path: '/settings', redirect: '/' },
        { path: '/join',     component: JoinView,     meta: {} },
    ],
})

// Guards routes: redirects unauthenticated users to login, auto-creates a household for new users
router.beforeEach(async (to) => {
    const user = await getCurrentUser()

    if (to.meta.requiresAuth && !user) return { path: '/login', query: { redirect: to.fullPath } }

    if (user) {
        if (to.meta.requiresGuest) return '/'

        // Skip auto-creating a household when the user is about to accept an invite
        if (to.path !== '/join') {
            const snap = await getDoc(doc(db, 'users', user.uid))
            if (!snap.data()?.householdId) {
                await HouseholdService.create(
                    user.uid,
                    generateHouseholdName(),
                    { autoGenShoppingList: false },
                    []
                )
            }
        }
    }
})

export default router
