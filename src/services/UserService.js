import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

class UserService {
    // Fetches the user's Firestore document, returns null if not found
    static async getUserDoc(uid) {
        const snap = await getDoc(doc(db, 'users', uid))
        return snap.exists() ? snap.data() : null
    }

    // Merges the given preferences object into the user's Firestore document
    static async updatePreferences(uid, preferences) {
        await setDoc(doc(db, 'users', uid), { preferences }, { merge: true })
    }
}

export default UserService
