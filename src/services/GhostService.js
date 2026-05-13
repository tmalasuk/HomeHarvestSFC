import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import Product from '../models/Product.js'
import ProductGhost from '../models/ProductGhost.js'

class GhostService {
    // Returns the Firestore doc ref for a product ghost
    static _ref(householdId, ghostId) {
        return doc(db, 'households', householdId, 'ghosts', ghostId)
    }

    // Serializes a ProductGhost and its embedded product fields to a Firestore document
    static toDoc(ghost) {
        return {
            id: ghost.id,
            productId: ghost.product.id,
            productName: ghost.product.name,
            productCategory: ghost.product.category,
            productDefaultDurationValue: ghost.product.defaultDurationValue,
            productDefaultUnitIndex: ghost.product.defaultUnitIndex,
            productDefaultLocation: ghost.product.defaultLocation ?? null,
            productFoodId: ghost.product.foodId ?? null,
            productDefaultUnit: ghost.product.defaultUnit ?? 'count',
            productDefaultQty: ghost.product.defaultQty ?? 1,
            restock: ghost.restock,
            restockQty: ghost.restockQty,
        }
    }

    // Deserializes a Firestore document into a ProductGhost, reusing a live product if available
    static fromDoc(data, productsMap = null) {
        // Reuse the live product object if it's still in pantry, otherwise reconstruct from stored fields
        const product = productsMap?.get(data.productId) ?? (() => {
            const p = new Product(data.productId, data.productName, data.productCategory)
            p.defaultDurationValue = data.productDefaultDurationValue ?? 2
            p.defaultUnitIndex = data.productDefaultUnitIndex ?? 1
            p.defaultLocation = data.productDefaultLocation ?? null
            p.foodId = data.productFoodId ?? null
            p.defaultUnit = data.productDefaultUnit ?? 'count'
            p.defaultQty = data.productDefaultQty ?? 1
            return p
        })()

        const ghost = new ProductGhost(data.id, product)
        ghost.restock = data.restock ?? false
        ghost.restockQty = data.restockQty ?? 1
        return ghost
    }

    // Writes a ghost document to Firestore
    static async save(householdId, ghost) {
        await setDoc(this._ref(householdId, ghost.id), this.toDoc(ghost), { merge: true })
    }

    // Deletes a ghost document from Firestore
    static async delete(householdId, ghostId) {
        await deleteDoc(this._ref(householdId, ghostId))
    }

    // Loads all ghosts from Firestore and returns them as ProductGhost instances
    static async loadAll(householdId, productsMap = null) {
        const snap = await getDocs(collection(db, 'households', householdId, 'ghosts'))
        return snap.docs.map(d => this.fromDoc(d.data(), productsMap))
    }
}

export default GhostService
