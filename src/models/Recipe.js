function Recipe(name, description, servings, prepTime, cookTime, categories, ingredients, instructions) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.description = description;
    this.servings = servings;
    this.prepTime = prepTime;
    this.cookTime = cookTime;
    this.categories = categories ?? [];
    this.ingredients = ingredients ?? [];
    this.instructions = instructions ?? [];
    this.photo = null;
    this.savedAt = new Date();
}


export default Recipe;
