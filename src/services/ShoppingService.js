import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import ShoppingItem from '../models/ShoppingItem.js'
import Expiration from '../models/Expiration.js'
import ShoppingListCollection from '../collections/ShoppingListCollection.js'
import PantryService from './PantryService.js'

class ShoppingService {

    // ── Refs ─────────────────────────────────────────────────────────────────

    // Returns the Firestore doc ref for a shopping item
    static _itemRef(householdId, itemId) {
        return doc(db, 'households', householdId, 'shoppingItems', itemId)
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    // Serializes a ShoppingItem to a plain Firestore-compatible object
    static itemToDoc(item) {
        return {
            id: item.id,
            productId: item.product.id,
            qty: item.qty,
            expiration: {
                durationValue: item.expiration.durationValue,
                unitIndex: item.expiration.unitIndex,
            },
            bought: item.bought,
        }
    }

    // Deserializes a Firestore document into a ShoppingItem using the given products map
    static docToItem(data, productsMap) {
        const product = productsMap.get(data.productId)
        if (!product) return null
        const exp = new Expiration(data.expiration.durationValue, data.expiration.unitIndex)
        const item = new ShoppingItem(product, data.qty, exp)
        item.bought = data.bought ?? false
        item.id = data.id
        return item
    }

    // ── Writes ────────────────────────────────────────────────────────────────

    // Writes a shopping item and its product to Firestore concurrently
    static async saveItem(householdId, item) {
        await Promise.all([
            setDoc(this._itemRef(householdId, item.id), this.itemToDoc(item)),
            PantryService.saveProduct(householdId, item.product),
        ])
    }

    // Deletes a single shopping item document
    static async deleteItem(householdId, itemId) {
        await deleteDoc(this._itemRef(householdId, itemId))
    }

    // Deletes multiple shopping items in a single Firestore batch
    static async deleteMany(householdId, itemIds) {
        if (!itemIds.length) return
        const batch = writeBatch(db)
        itemIds.forEach(id => batch.delete(this._itemRef(householdId, id)))
        await batch.commit()
    }

    // ── Reads ─────────────────────────────────────────────────────────────────

    // Loads all products and shopping items from Firestore and returns a ShoppingListCollection
    static async loadAll(householdId) {
        const [productSnap, itemSnap] = await Promise.all([
            getDocs(collection(db, 'households', householdId, 'products')),
            getDocs(collection(db, 'households', householdId, 'shoppingItems')),
        ])
        const productsMap = new Map()
        productSnap.docs.forEach(d => productsMap.set(d.id, PantryService.docToProduct(d.data())))
        const items = itemSnap.docs.map(d => this.docToItem(d.data(), productsMap)).filter(Boolean)
        return new ShoppingListCollection(items)
    }
}

export default ShoppingService
