import Recipe from '../models/Recipe.js';

function RecipeCollection(arr) {
    const items = arr || [];

    items.add = function(recipeData) {
        const recipe = new Recipe(
            recipeData.name,
            recipeData.description,
            recipeData.servings,
            recipeData.prepTime,
            recipeData.cookTime,
            recipeData.categories,
            recipeData.ingredients,
            recipeData.instructions
        );
        recipe.photo = recipeData.photo ?? null;
        this.push(recipe);
        return this;
    }

    items.remove = function(recipe) {
        const index = this.indexOf(recipe);
        if (index !== -1) this.splice(index, 1);
        return this;
    }

    items.findById = function(id) {
        return this.find(r => r.id === id);
    }

    return items;
}

export default RecipeCollection;
