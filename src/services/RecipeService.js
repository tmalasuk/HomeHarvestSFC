import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import Recipe from '../models/Recipe.js'
import RecipeCollection from '../collections/RecipeCollection.js'

class RecipeService {

    // ── Refs ─────────────────────────────────────────────────────────────────

    // Returns the Firestore doc ref for a recipe
    static _recipeRef(householdId, recipeId) {
        return doc(db, 'households', householdId, 'recipes', recipeId)
    }

    // ── Serialization ─────────────────────────────────────────────────────────

    // Serializes a Recipe to a plain Firestore-compatible object
    static recipeToDoc(recipe) {
        return {
            id: recipe.id,
            name: recipe.name,
            description: recipe.description ?? '',
            servings: recipe.servings ?? null,
            prepTime: recipe.prepTime ?? null,
            cookTime: recipe.cookTime ?? null,
            categories: recipe.categories ?? [],
            ingredients: recipe.ingredients ?? [],
            instructions: recipe.instructions ?? [],
            photo: recipe.photo ?? null,
            savedAt: recipe.savedAt instanceof Date ? recipe.savedAt.toISOString() : (recipe.savedAt ?? new Date().toISOString()),
        }
    }

    // Deserializes a Firestore document into a Recipe instance
    static docToRecipe(data) {
        const recipe = new Recipe(
            data.name,
            data.description,
            data.servings,
            data.prepTime,
            data.cookTime,
            data.categories,
            data.ingredients,
            data.instructions
        )
        recipe.id = data.id
        recipe.photo = data.photo ?? null
        recipe.savedAt = data.savedAt ? new Date(data.savedAt) : new Date()
        return recipe
    }

    // ── Writes ────────────────────────────────────────────────────────────────

    // Writes a recipe document to Firestore
    static async saveRecipe(householdId, recipe) {
        await setDoc(this._recipeRef(householdId, recipe.id), this.recipeToDoc(recipe))
    }

    // Deletes a recipe document from Firestore
    static async deleteRecipe(householdId, recipeId) {
        await deleteDoc(this._recipeRef(householdId, recipeId))
    }

    // ── Reads ─────────────────────────────────────────────────────────────────

    // Loads all recipes from Firestore and returns a RecipeCollection
    static async loadAll(householdId) {
        const snap = await getDocs(collection(db, 'households', householdId, 'recipes'))
        const recipes = snap.docs.map(d => this.docToRecipe(d.data()))
        return new RecipeCollection(recipes)
    }
}

export default RecipeService
