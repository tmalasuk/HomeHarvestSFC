import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import Product from '../models/Product.js'
import PantryItem from '../models/PantryItem.js'
import Expiration from '../models/Expiration.js'
import PantryCollection from '../collections/PantryCollection.js'

class PantryService {

    // ── Refs ─────────────────────────────────────────────────────────────────

    // Returns the Firestore doc ref for a household product
    static _productRef(householdId, productId) {
        return doc(db, 'households', householdId, 'products', productId)
    }

    // Returns the Firestore doc ref for a pantry item
    static _itemRef(householdId, itemId) {
        return doc(db, 'households', householdId, 'pantryItems', itemId)
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    // Serializes a Product to a plain Firestore-compatible object
    static productToDoc(product) {
        return {
            id: product.id,
            name: product.name,
            category: product.category,
            restock: product.restock,
            restockQty: product.restockQty,
            defaultDurationValue: product.defaultDurationValue,
            defaultUnitIndex: product.defaultUnitIndex,
            defaultLocation: product.defaultLocation ?? null,
            foodId: product.foodId ?? null,
            defaultUnit: product.defaultUnit,
            defaultQty: product.defaultQty,
            addedAt: product.addedAt ?? 0,
        }
    }

    // Deserializes a Firestore document into a Product instance
    static docToProduct(data) {
        const p = new Product(data.id, data.name, data.category)
        p.restock = data.restock ?? false
        p.restockQty = data.restockQty ?? 1
        p.defaultDurationValue = data.defaultDurationValue ?? 2
        p.defaultUnitIndex = data.defaultUnitIndex ?? 1
        p.defaultLocation = data.defaultLocation ?? null
        p.foodId = data.foodId ?? null
        p.defaultUnit = data.defaultUnit ?? 'count'
        p.defaultQty = data.defaultQty ?? 1
        p.addedAt = data.addedAt ?? 0
        return p
    }

    // Serializes a PantryItem to a plain Firestore-compatible object
    static itemToDoc(item) {
        return {
            id: item.id,
            createdAt: item.createdAt ?? Date.now(),
            productId: item.product.id,
            qty: item.qty,
            unit: item.unit,
            expiration: {
                durationValue: item.expiration.durationValue,
                unitIndex: item.expiration.unitIndex,
                fixedDate: item.expiration._fixedDate ? item.expiration._fixedDate.toISOString() : null,
            },
            location: item.location ?? null,
        }
    }

    // Deserializes a Firestore document into a PantryItem using the given products map
    static docToItem(data, productsMap) {
        const product = productsMap.get(data.productId)
        if (!product) return null
        const exp = new Expiration(
            data.expiration.durationValue,
            data.expiration.unitIndex,
            data.expiration.fixedDate
        )
        // Old docs without a unit field get the product's default
        const qty = data.unit ? data.qty : product.defaultQty
        const item = new PantryItem(product, qty, exp, data.location)
        item.unit = data.unit ?? product.defaultUnit
        item.id = data.id
        item.createdAt = data.createdAt ?? 0
        return item
    }

    // ── Writes ────────────────────────────────────────────────────────────────

    // Writes a product document to Firestore (merge to preserve unknown fields)
    static async saveProduct(householdId, product) {
        await setDoc(this._productRef(householdId, product.id), this.productToDoc(product), { merge: true })
    }

    // Writes a pantry item and its product to Firestore concurrently
    static async savePantryItem(householdId, item) {
        await Promise.all([
            setDoc(this._itemRef(householdId, item.id), this.itemToDoc(item)),
            setDoc(this._productRef(householdId, item.product.id), this.productToDoc(item.product), { merge: true }),
        ])
    }

    // Deletes a single pantry item document
    static async deletePantryItem(householdId, itemId) {
        await deleteDoc(this._itemRef(householdId, itemId))
    }

    // Deletes all pantry items for a product and the product itself in a single batch
    static async deleteProduct(householdId, product, itemIds) {
        const batch = writeBatch(db)
        itemIds.forEach(id => batch.delete(this._itemRef(householdId, id)))
        batch.delete(this._productRef(householdId, product.id))
        await batch.commit()
    }

    // ── Reads ─────────────────────────────────────────────────────────────────

    // Loads all products and pantry items from Firestore and returns a PantryCollection
    static async loadAll(householdId) {
        const [productSnap, itemSnap] = await Promise.all([
            getDocs(collection(db, 'households', householdId, 'products')),
            getDocs(collection(db, 'households', householdId, 'pantryItems')),
        ])
        const productsMap = new Map()
        productSnap.docs.forEach(d => productsMap.set(d.id, this.docToProduct(d.data())))
        const items = itemSnap.docs.map(d => this.docToItem(d.data(), productsMap)).filter(Boolean)
        return new PantryCollection(items)
    }
}

export default PantryService
