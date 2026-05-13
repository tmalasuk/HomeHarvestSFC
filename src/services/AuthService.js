import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

// Rejects after `ms` with a db/timeout error — prevents Firestore from hanging forever
// when the database isn't reachable (e.g. not set up in Firebase Console yet)
function withTimeout(promise, ms = 10000) {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => {
            const err = new Error('Could not reach the database. Make sure Firestore is set up in your Firebase project.')
            err.code = 'db/timeout'
            reject(err)
        }, ms)
    })
    return Promise.race([promise, timeout])
}

class AuthService {
    // Registers a new user with email/password and writes the user doc to Firestore
    static async register(name, email, password) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const uid = credential.user.uid
        await updateProfile(credential.user, { displayName: name })
        await withTimeout(setDoc(doc(db, 'users', uid), {
            id: uid,
            name,
            email,
            householdId: null,
            preferences: { theme: 'light', dietaryRestrictions: [] },
        }))
        return credential.user
    }

    // Signs in with email/password and returns the Firebase user
    static async login(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        return credential.user
    }

    // Signs in with Google popup, creating a user doc if this is the first login
    static async loginWithGoogle() {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        const user = result.user

        // Must succeed — if Firestore is unreachable, sign back out so the user
        // isn't left in a half-authenticated state with no user record
        try {
            const userRef = doc(db, 'users', user.uid)
            const snap = await withTimeout(getDoc(userRef))
            if (!snap.exists()) {
                await withTimeout(setDoc(userRef, {
                    id: user.uid,
                    name: user.displayName || '',
                    email: user.email,
                    householdId: null,
                    preferences: { theme: 'light', dietaryRestrictions: [] },
                }))
            }
        } catch (err) {
            await signOut(auth)
            throw err
        }

        return user
    }

    // Signs out the current Firebase user
    static async logout() {
        await signOut(auth)
    }

    // Fetches the user's Firestore document, returns null if not found
    static async getUserDoc(uid) {
        const snap = await getDoc(doc(db, 'users', uid))
        return snap.exists() ? snap.data() : null
    }

    // Subscribes to Firebase auth state changes and returns the unsubscribe function
    static onAuthChange(callback) {
        return onAuthStateChanged(auth, callback)
    }
}

export default AuthService
