import { doc, setDoc, getDoc, updateDoc, deleteDoc, arrayRemove, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase.js'

class HouseholdService {
    // Fetches the household document, returns null if not found
    static async get(householdId) {
        const snap = await getDoc(doc(db, 'households', householdId))
        return snap.exists() ? snap.data() : null
    }

    // Creates a new household, assigns the owner as its first member, and links the user to it
    static async create(userId, name, preferences, locations) {
        const householdId = crypto.randomUUID()
        await setDoc(doc(db, 'households', householdId), {
            id: householdId,
            name,
            ownerId: userId,
            members: [userId],
            invites: [],
            locations,
            preferences,
        })
        // merge: true creates the user doc if it doesn't exist yet (e.g. first Google sign-in)
        await setDoc(doc(db, 'users', userId), { householdId }, { merge: true })
        return householdId
    }

    // Partially updates fields on an existing household document
    static async update(householdId, data) {
        await updateDoc(doc(db, 'households', householdId), data)
    }

    // Fetches user documents for each member id and returns the ones that exist
    static async getMemberDocs(memberIds) {
        const snaps = await Promise.all(memberIds.map(id => getDoc(doc(db, 'users', id))))
        return snaps.filter(s => s.exists()).map(s => s.data())
    }

    // Creates a 7-day invite token, appends it to the household, and writes a top-level invite doc
    static async addInvite(householdId, email) {
        const invite = {
            token: crypto.randomUUID(),
            email,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        const snap = await getDoc(doc(db, 'households', householdId))
        const existing = snap.data()?.invites ?? []
        await Promise.all([
            updateDoc(doc(db, 'households', householdId), { invites: [...existing, invite] }),
            setDoc(doc(db, 'invites', invite.token), { householdId, email, expiresAt: invite.expiresAt }),
        ])
        return invite
    }

    // Removes an invite from the household and deletes the top-level invite doc
    static async revokeInvite(householdId, token) {
        const snap = await getDoc(doc(db, 'households', householdId))
        const invites = (snap.data()?.invites ?? []).filter(i => i.token !== token)
        await Promise.all([
            updateDoc(doc(db, 'households', householdId), { invites }),
            deleteDoc(doc(db, 'invites', token)),
        ])
    }

    // Fetches a top-level invite doc by token, returns null if not found
    static async getInvite(token) {
        const snap = await getDoc(doc(db, 'invites', token))
        return snap.exists() ? snap.data() : null
    }

    // Validates the invite, removes the user from their current household, and adds them to the new one
    static async acceptInvite(token, userId) {
        const invite = await this.getInvite(token)
        if (!invite) throw new Error('Invite not found or already used.')
        if (new Date() > new Date(invite.expiresAt)) throw new Error('This invite has expired.')

        const { householdId: newHouseholdId } = invite

        // Leave the old household first
        const userSnap = await getDoc(doc(db, 'users', userId))
        const currentHouseholdId = userSnap.data()?.householdId

        if (currentHouseholdId && currentHouseholdId !== newHouseholdId) {
            const oldSnap = await getDoc(doc(db, 'households', currentHouseholdId))
            if (oldSnap.exists()) {
                const oldHh = oldSnap.data()
                const remaining = (oldHh.members ?? []).filter(id => id !== userId)

                if (remaining.length === 0) {
                    await deleteDoc(doc(db, 'households', currentHouseholdId))
                } else {
                    const updates = { members: remaining }
                    if (oldHh.ownerId === userId) updates.ownerId = remaining[0]
                    await updateDoc(doc(db, 'households', currentHouseholdId), updates)
                }
            }
        }

        // Join the new household
        const newSnap = await getDoc(doc(db, 'households', newHouseholdId))
        const invites = (newSnap.data()?.invites ?? []).filter(i => i.token !== token)

        await Promise.all([
            updateDoc(doc(db, 'households', newHouseholdId), {
                members: arrayUnion(userId),
                invites,
            }),
            setDoc(doc(db, 'users', userId), { householdId: newHouseholdId }, { merge: true }),
            deleteDoc(doc(db, 'invites', token)),
        ])

        return newHouseholdId
    }

    // Removes a user from a household's members array
    static async removeMember(householdId, userId) {
        await updateDoc(doc(db, 'households', householdId), {
            members: arrayRemove(userId),
        })
    }

    // Removes the user from their household, deleting it if they were the last member
    static async leaveHousehold(userId) {
        const userSnap = await getDoc(doc(db, 'users', userId))
        const householdId = userSnap.data()?.householdId
        if (!householdId) return

        const hhSnap = await getDoc(doc(db, 'households', householdId))
        if (hhSnap.exists()) {
            const hh = hhSnap.data()
            const remaining = (hh.members ?? []).filter(id => id !== userId)

            if (remaining.length === 0) {
                await deleteDoc(doc(db, 'households', householdId))
            } else {
                const updates = { members: remaining }
                if (hh.ownerId === userId) updates.ownerId = remaining[0]
                await updateDoc(doc(db, 'households', householdId), updates)
            }
        }

        await setDoc(doc(db, 'users', userId), { householdId: null }, { merge: true })
    }
}

export default HouseholdService
