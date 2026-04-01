// Seed data with dates relative to today so they never go stale for demos.

const today = () => new Date();
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ─── Pantry ──────────────────────────────────────────────────────────────────
// Items tagged EXPIRING: expiration <= 3 days → triggers "Expiring Soon" filter
// Items tagged LOW QTY:  single batch, qty < 50 → triggers "Low Qty" filter

export const seedPantryProducts = [

    // ── Dairy ──────────────────────────────────────────────────────────────
    {
        id: 1, name: 'Milk', category: 'Dairy', restock: true, restockQty: 1, isOpen: false,
        batch: [
            { id: 1, name: 'Milk', category: 'Dairy', dateAdded: daysAgo(10), expiration: daysFromNow(2), qty: 30 },  // EXPIRING + low in this batch
            { id: 2, name: 'Milk', category: 'Dairy', dateAdded: daysAgo(3),  expiration: daysFromNow(12), qty: 100 },
        ]
    },
    {
        id: 2, name: 'Yogurt', category: 'Dairy', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Yogurt', category: 'Dairy', dateAdded: daysAgo(5), expiration: daysFromNow(1), qty: 60 }, // EXPIRING
        ]
    },
    {
        id: 3, name: 'Eggs', category: 'Dairy', restock: true, restockQty: 1, isOpen: false,
        batch: [
            { id: 1, name: 'Eggs', category: 'Dairy', dateAdded: daysAgo(7), expiration: daysFromNow(14), qty: 75 },
        ]
    },
    {
        id: 4, name: 'Cheddar Cheese', category: 'Dairy', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Cheddar Cheese', category: 'Dairy', dateAdded: daysAgo(2), expiration: daysFromNow(21), qty: 85 },
        ]
    },
    {
        id: 5, name: 'Butter', category: 'Dairy', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Butter', category: 'Dairy', dateAdded: daysAgo(14), expiration: daysFromNow(45), qty: 40 }, // LOW QTY
        ]
    },
    {
        id: 6, name: 'Sour Cream', category: 'Dairy', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Sour Cream', category: 'Dairy', dateAdded: daysAgo(8), expiration: daysFromNow(2), qty: 20 }, // EXPIRING + LOW QTY
        ]
    },

    // ── Produce ────────────────────────────────────────────────────────────
    {
        id: 10, name: 'Strawberries', category: 'Produce', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Strawberries', category: 'Produce', dateAdded: daysAgo(4), expiration: daysFromNow(2), qty: 45 }, // EXPIRING + LOW QTY
        ]
    },
    {
        id: 11, name: 'Spinach', category: 'Produce', restock: true, restockQty: 1, isOpen: false,
        batch: [
            { id: 1, name: 'Spinach', category: 'Produce', dateAdded: daysAgo(5), expiration: daysFromNow(1), qty: 30 }, // EXPIRING + LOW QTY
        ]
    },
    {
        id: 12, name: 'Apples', category: 'Produce', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Apples', category: 'Produce', dateAdded: daysAgo(3), expiration: daysFromNow(18), qty: 100 },
            { id: 2, name: 'Apples', category: 'Produce', dateAdded: daysAgo(3), expiration: daysFromNow(18), qty: 100 },
            { id: 3, name: 'Apples', category: 'Produce', dateAdded: daysAgo(3), expiration: daysFromNow(18), qty: 100 },
        ]
    },
    {
        id: 13, name: 'Bananas', category: 'Produce', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Bananas', category: 'Produce', dateAdded: daysAgo(6), expiration: daysFromNow(4), qty: 80 },
        ]
    },
    {
        id: 14, name: 'Bell Peppers', category: 'Produce', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Bell Peppers', category: 'Produce', dateAdded: daysAgo(2), expiration: daysFromNow(10), qty: 100 },
        ]
    },
    {
        id: 15, name: 'Avocados', category: 'Produce', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Avocados', category: 'Produce', dateAdded: daysAgo(1), expiration: daysFromNow(3), qty: 100 }, // borderline expiring
        ]
    },

    // ── Meat ───────────────────────────────────────────────────────────────
    {
        id: 20, name: 'Chicken Breast', category: 'Meat', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Chicken Breast', category: 'Meat', dateAdded: daysAgo(1), expiration: daysFromNow(2), qty: 100 }, // EXPIRING
        ]
    },
    {
        id: 21, name: 'Ground Beef', category: 'Meat', restock: true, restockQty: 2, isOpen: false,
        batch: [
            { id: 1, name: 'Ground Beef', category: 'Meat', dateAdded: daysAgo(3), expiration: daysFromNow(1), qty: 100 }, // EXPIRING
            { id: 2, name: 'Ground Beef', category: 'Meat', dateAdded: daysAgo(3), expiration: daysFromNow(1), qty: 100 }, // EXPIRING
        ]
    },
    {
        id: 22, name: 'Salmon', category: 'Meat', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Salmon', category: 'Meat', dateAdded: daysAgo(0), expiration: daysFromNow(30), qty: 100 },
        ]
    },
    {
        id: 23, name: 'Deli Turkey', category: 'Deli', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Deli Turkey', category: 'Deli', dateAdded: daysAgo(4), expiration: daysFromNow(3), qty: 35 }, // EXPIRING + LOW QTY
        ]
    },

    // ── Grains ─────────────────────────────────────────────────────────────
    {
        id: 30, name: 'Bread', category: 'Grains', restock: true, restockQty: 1, isOpen: false,
        batch: [
            { id: 1, name: 'Bread', category: 'Grains', dateAdded: daysAgo(5), expiration: daysFromNow(2), qty: 25 }, // EXPIRING + LOW QTY
        ]
    },
    {
        id: 31, name: 'Rice', category: 'Grains', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Rice', category: 'Grains', dateAdded: daysAgo(30), expiration: daysFromNow(180), qty: 70 },
            { id: 2, name: 'Rice', category: 'Grains', dateAdded: daysAgo(10), expiration: daysFromNow(200), qty: 100 },
        ]
    },
    {
        id: 32, name: 'Pasta', category: 'Grains', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Pasta', category: 'Grains', dateAdded: daysAgo(20), expiration: daysFromNow(365), qty: 100 },
        ]
    },
    {
        id: 33, name: 'Oats', category: 'Grains', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Oats', category: 'Grains', dateAdded: daysAgo(40), expiration: daysFromNow(90), qty: 20 }, // LOW QTY
        ]
    },

    // ── Frozen ─────────────────────────────────────────────────────────────
    {
        id: 40, name: 'Frozen Pizza', category: 'Frozen', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Frozen Pizza', category: 'Frozen', dateAdded: daysAgo(14), expiration: daysFromNow(90), qty: 100 },
            { id: 2, name: 'Frozen Pizza', category: 'Frozen', dateAdded: daysAgo(14), expiration: daysFromNow(90), qty: 100 },
        ]
    },
    {
        id: 41, name: 'Ice Cream', category: 'Frozen', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Ice Cream', category: 'Frozen', dateAdded: daysAgo(21), expiration: daysFromNow(60), qty: 30 }, // LOW QTY
        ]
    },
    {
        id: 42, name: 'Edamame', category: 'Frozen', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Edamame', category: 'Frozen', dateAdded: daysAgo(7), expiration: daysFromNow(120), qty: 100 },
        ]
    },

    // ── Canned Goods ───────────────────────────────────────────────────────
    {
        id: 50, name: 'Black Beans', category: 'Canned Goods', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Black Beans', category: 'Canned Goods', dateAdded: daysAgo(60), expiration: daysFromNow(730), qty: 100 },
            { id: 2, name: 'Black Beans', category: 'Canned Goods', dateAdded: daysAgo(60), expiration: daysFromNow(730), qty: 100 },
            { id: 3, name: 'Black Beans', category: 'Canned Goods', dateAdded: daysAgo(60), expiration: daysFromNow(730), qty: 100 },
        ]
    },
    {
        id: 51, name: 'Crushed Tomatoes', category: 'Canned Goods', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Crushed Tomatoes', category: 'Canned Goods', dateAdded: daysAgo(45), expiration: daysFromNow(700), qty: 100 },
            { id: 2, name: 'Crushed Tomatoes', category: 'Canned Goods', dateAdded: daysAgo(45), expiration: daysFromNow(700), qty: 100 },
        ]
    },
    {
        id: 52, name: 'Chicken Broth', category: 'Canned Goods', restock: true, restockQty: 2, isOpen: false,
        batch: [
            { id: 1, name: 'Chicken Broth', category: 'Canned Goods', dateAdded: daysAgo(90), expiration: daysFromNow(600), qty: 45 }, // LOW QTY
        ]
    },

    // ── Snacks ─────────────────────────────────────────────────────────────
    {
        id: 60, name: 'Chips', category: 'Snacks', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Chips', category: 'Snacks', dateAdded: daysAgo(10), expiration: daysFromNow(30), qty: 15 }, // LOW QTY
        ]
    },
    {
        id: 61, name: 'Granola Bars', category: 'Snacks', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Granola Bars', category: 'Snacks', dateAdded: daysAgo(5), expiration: daysFromNow(60), qty: 100 },
            { id: 2, name: 'Granola Bars', category: 'Snacks', dateAdded: daysAgo(5), expiration: daysFromNow(60), qty: 100 },
        ]
    },
    {
        id: 62, name: 'Almonds', category: 'Snacks', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Almonds', category: 'Snacks', dateAdded: daysAgo(20), expiration: daysFromNow(150), qty: 80 },
        ]
    },

    // ── Beverages ──────────────────────────────────────────────────────────
    {
        id: 70, name: 'Orange Juice', category: 'Beverages', restock: true, restockQty: 1, isOpen: false,
        batch: [
            { id: 1, name: 'Orange Juice', category: 'Beverages', dateAdded: daysAgo(6), expiration: daysFromNow(2), qty: 20 }, // EXPIRING + LOW QTY
        ]
    },
    {
        id: 71, name: 'Almond Milk', category: 'Beverages', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Almond Milk', category: 'Beverages', dateAdded: daysAgo(2), expiration: daysFromNow(20), qty: 100 },
            { id: 2, name: 'Almond Milk', category: 'Beverages', dateAdded: daysAgo(2), expiration: daysFromNow(20), qty: 100 },
        ]
    },

    // ── Condiments ─────────────────────────────────────────────────────────
    {
        id: 80, name: 'Ketchup', category: 'Condiments', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Ketchup', category: 'Condiments', dateAdded: daysAgo(30), expiration: daysFromNow(180), qty: 60 },
        ]
    },
    {
        id: 81, name: 'Mustard', category: 'Condiments', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Mustard', category: 'Condiments', dateAdded: daysAgo(60), expiration: daysFromNow(120), qty: 10 }, // LOW QTY
        ]
    },
    {
        id: 82, name: 'Soy Sauce', category: 'Condiments', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Soy Sauce', category: 'Condiments', dateAdded: daysAgo(45), expiration: daysFromNow(365), qty: 50 },
        ]
    },

    // ── Breakfast ──────────────────────────────────────────────────────────
    {
        id: 90, name: 'Cereal', category: 'Breakfast', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Cereal', category: 'Breakfast', dateAdded: daysAgo(14), expiration: daysFromNow(45), qty: 35 }, // LOW QTY
        ]
    },
    {
        id: 91, name: 'Pancake Mix', category: 'Breakfast', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Pancake Mix', category: 'Breakfast', dateAdded: daysAgo(10), expiration: daysFromNow(200), qty: 100 },
        ]
    },
    {
        id: 92, name: 'Maple Syrup', category: 'Breakfast', restock: false, isOpen: false,
        batch: [
            { id: 1, name: 'Maple Syrup', category: 'Breakfast', dateAdded: daysAgo(30), expiration: daysFromNow(365), qty: 40 }, // LOW QTY
        ]
    },
];

// ─── Shopping List ────────────────────────────────────────────────────────────
export const seedShoppingProducts = [
    { id: 1,  name: 'Milk',              qty: 1, category: 'Dairy',       expiration: daysFromNow(14), action: false, bought: false, durationValue: 2, selectedUnit: 1 },
    { id: 2,  name: 'Eggs',              qty: 1, category: 'Dairy',       expiration: daysFromNow(21), action: false, bought: false, durationValue: 2, selectedUnit: 1 },
    { id: 3,  name: 'Yogurt',            qty: 2, category: 'Dairy',       expiration: daysFromNow(10), action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 4,  name: 'Strawberries',      qty: 1, category: 'Produce',     expiration: daysFromNow(7),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 5,  name: 'Spinach',           qty: 1, category: 'Produce',     expiration: daysFromNow(7),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 6,  name: 'Bananas',           qty: 1, category: 'Produce',     expiration: daysFromNow(5),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 7,  name: 'Chicken Breast',    qty: 2, category: 'Meat',        expiration: daysFromNow(5),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 8,  name: 'Ground Beef',       qty: 2, category: 'Meat',        expiration: daysFromNow(5),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 9,  name: 'Bread',             qty: 1, category: 'Grains',      expiration: daysFromNow(7),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 10, name: 'Chips',             qty: 2, category: 'Snacks',      expiration: daysFromNow(60), action: false, bought: false, durationValue: 2, selectedUnit: 2 },
    { id: 11, name: 'Orange Juice',      qty: 1, category: 'Beverages',   expiration: daysFromNow(14), action: false, bought: false, durationValue: 2, selectedUnit: 1 },
    { id: 12, name: 'Ketchup',           qty: 1, category: 'Condiments',  expiration: daysFromNow(90), action: false, bought: false, durationValue: 6, selectedUnit: 2 },
    { id: 13, name: 'Mustard',           qty: 1, category: 'Condiments',  expiration: daysFromNow(90), action: false, bought: false, durationValue: 6, selectedUnit: 2 },
    { id: 14, name: 'Frozen Pizza',      qty: 2, category: 'Frozen',      expiration: daysFromNow(90), action: false, bought: false, durationValue: 3, selectedUnit: 2 },
    { id: 15, name: 'Black Beans',       qty: 4, category: 'Canned Goods', expiration: daysFromNow(730), action: false, bought: false, durationValue: 2, selectedUnit: 3 },
    { id: 16, name: 'Cereal',            qty: 1, category: 'Breakfast',   expiration: daysFromNow(45), action: false, bought: false, durationValue: 6, selectedUnit: 1 },
    { id: 17, name: 'Deli Turkey',       qty: 1, category: 'Deli',        expiration: daysFromNow(7),  action: false, bought: false, durationValue: 1, selectedUnit: 1 },
    { id: 18, name: 'Oats',              qty: 1, category: 'Grains',      expiration: daysFromNow(90), action: false, bought: false, durationValue: 3, selectedUnit: 2 },
];

// ─── Recipes ──────────────────────────────────────────────────────────────────
export const seedRecipes = [
    {
        id: 1,
        name: 'Honey Garlic Chicken',
        description: 'Tender pan-seared chicken glazed with a sweet and savory honey garlic sauce.',
        tags: ['chicken', 'quick', 'savory'],
        prepTime: 10, cookTime: 20, servings: 4,
        categories: ['Dinner', 'Meat', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Chicken', qty: 2, unit: 'lbs', category: 'Meat' },
            { name: 'Garlic', qty: 4, unit: 'cloves', category: 'Produce' },
            { name: 'Honey', qty: 3, unit: 'tbsp', category: 'Misc' },
            { name: 'Soy Sauce', qty: 2, unit: 'tbsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        instructions: [
            'Season chicken with salt and pepper on both sides.',
            'Heat olive oil in a large skillet over medium-high heat.',
            'Sear chicken for 6–7 minutes per side until golden and cooked through. Remove and set aside.',
            'In the same pan, melt butter and sauté garlic for 1 minute.',
            'Add honey and soy sauce, stir and simmer 2 minutes until slightly thickened.',
            'Return chicken to the pan, coat in sauce, and serve.',
        ],
    },
    {
        id: 2,
        name: 'Strawberry Yogurt Parfait',
        description: 'A quick layered breakfast with creamy yogurt, fresh strawberries, and crunchy granola.',
        tags: ['breakfast', 'quick', 'no-cook', 'strawberry'],
        prepTime: 5, cookTime: 0, servings: 1,
        categories: ['Breakfast', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Yogurt', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Strawberries', qty: 0.5, unit: 'cup', category: 'Produce' },
            { name: 'Granola', qty: 0.25, unit: 'cup', category: 'Grains' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        instructions: [
            'Wash and slice strawberries.',
            'Spoon half the yogurt into a glass or bowl.',
            'Add a layer of strawberries and granola.',
            'Repeat layers with remaining yogurt and toppings.',
            'Drizzle with honey and serve immediately.',
        ],
    },
    {
        id: 3,
        name: 'French Toast',
        description: 'Classic thick-cut French toast with a custardy egg-and-milk soak, served with maple syrup.',
        tags: ['breakfast', 'bread', 'quick'],
        prepTime: 5, cookTime: 10, servings: 2,
        categories: ['Breakfast', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Bread', qty: 4, unit: 'slices', category: 'Grains' },
            { name: 'Eggs', qty: 2, unit: 'whole', category: 'Dairy' },
            { name: 'Milk', qty: 0.25, unit: 'cup', category: 'Dairy' },
            { name: 'Cinnamon', qty: 0.5, unit: 'tsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Maple Syrup', qty: 2, unit: 'tbsp', category: 'Misc' },
        ],
        instructions: [
            'Whisk together eggs, milk, and cinnamon in a shallow bowl.',
            'Heat a skillet over medium heat and melt butter.',
            'Dip each bread slice in the egg mixture, coating both sides.',
            'Cook for 2–3 minutes per side until golden brown.',
            'Serve warm with maple syrup.',
        ],
    },
    {
        id: 4,
        name: 'Apple Cinnamon Oatmeal',
        description: 'Warm stovetop oatmeal with sautéed apple, brown sugar, and cinnamon.',
        tags: ['breakfast', 'apple', 'quick'],
        prepTime: 5, cookTime: 10, servings: 2,
        categories: ['Breakfast', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Oats', qty: 1, unit: 'cup', category: 'Grains' },
            { name: 'Milk', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Brown Sugar', qty: 1, unit: 'tbsp', category: 'Misc' },
            { name: 'Cinnamon', qty: 0.5, unit: 'tsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tsp', category: 'Dairy' },
        ],
        instructions: [
            'Dice the apple into small cubes.',
            'Melt butter in a small pan, add apple, cinnamon, and brown sugar. Cook 3 minutes.',
            'Meanwhile, combine oats and milk in a saucepan over medium heat.',
            'Cook oats, stirring frequently, until thickened, about 5 minutes.',
            'Top oatmeal with the sautéed apple mixture and serve.',
        ],
    },
    {
        id: 5,
        name: 'Chicken Noodle Soup',
        description: 'Comforting homemade chicken soup with vegetables and egg noodles.',
        tags: ['chicken', 'soup', 'comfort food'],
        prepTime: 15, cookTime: 40, servings: 6,
        categories: ['Dinner', 'Soup', 'Meat', 'Comfort Food'], source: 'ai',
        ingredients: [
            { name: 'Chicken', qty: 1.5, unit: 'lbs', category: 'Meat' },
            { name: 'Carrots', qty: 3, unit: 'whole', category: 'Produce' },
            { name: 'Onions', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
            { name: 'Egg Noodles', qty: 2, unit: 'cups', category: 'Grains' },
            { name: 'Chicken Broth', qty: 6, unit: 'cups', category: 'Canned Goods' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        instructions: [
            'Dice onion and carrots. Mince garlic.',
            'Heat oil in a large pot over medium heat. Sauté onion, carrots, and garlic for 5 minutes.',
            'Add chicken and broth. Bring to a boil, then reduce heat and simmer 25 minutes.',
            'Remove chicken, shred with forks, and return to pot.',
            'Add egg noodles and cook another 8 minutes until tender.',
            'Season with salt and pepper and serve hot.',
        ],
    },
    {
        id: 6,
        name: 'Spaghetti Bolognese',
        description: 'A hearty Italian meat sauce slow-simmered with crushed tomatoes over spaghetti.',
        tags: ['pasta', 'beef', 'savory'],
        prepTime: 10, cookTime: 35, servings: 4,
        categories: ['Dinner', 'Pasta', 'Meat'], source: 'ai',
        ingredients: [
            { name: 'Spaghetti Noodles', qty: 12, unit: 'oz', category: 'Grains' },
            { name: 'Ground Beef', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Crushed Tomatoes', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Onions', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 3, unit: 'cloves', category: 'Produce' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
            { name: 'Italian Seasoning', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        instructions: [
            'Boil salted water and cook spaghetti according to package directions.',
            'Heat olive oil in a skillet. Sauté diced onion and garlic 3 minutes.',
            'Add ground beef, breaking it up, and cook until browned.',
            'Stir in crushed tomatoes and Italian seasoning. Simmer 20 minutes.',
            'Drain pasta and serve topped with meat sauce.',
        ],
    },
    {
        id: 7,
        name: 'Black Bean Tacos',
        description: 'Quick weeknight tacos with seasoned black beans, peppers, and fresh toppings.',
        tags: ['vegetarian', 'quick', 'tacos'],
        prepTime: 10, cookTime: 10, servings: 4,
        categories: ['Lunch', 'Vegetarian', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Black Beans', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Peppers', qty: 2, unit: 'whole', category: 'Produce' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Tortillas', qty: 8, unit: 'whole', category: 'Grains' },
            { name: 'Cumin', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Sour Cream', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Lime', qty: 1, unit: 'whole', category: 'Produce' },
        ],
        instructions: [
            'Drain and rinse black beans.',
            'Slice peppers and onion into strips. Sauté in oil over medium heat 5 minutes.',
            'Add beans and cumin to the pan. Cook 3 minutes until warmed through.',
            'Warm tortillas in a dry skillet or microwave.',
            'Fill tortillas with bean mixture, top with sour cream and a squeeze of lime.',
        ],
    },
    {
        id: 8,
        name: 'Strawberry Smoothie',
        description: 'A creamy three-ingredient smoothie perfect for using up strawberries before they turn.',
        tags: ['breakfast', 'quick', 'no-cook', 'strawberry'],
        prepTime: 5, cookTime: 0, servings: 1,
        categories: ['Breakfast', 'Drink', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Strawberries', qty: 1, unit: 'cup', category: 'Produce' },
            { name: 'Yogurt', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Milk', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        instructions: [
            'Hull and halve strawberries.',
            'Add all ingredients to a blender.',
            'Blend on high for 30–45 seconds until smooth.',
            'Pour into a glass and serve immediately.',
        ],
    },
    {
        id: 9,
        name: 'Chicken Fried Rice',
        description: 'Better-than-takeout fried rice with chicken, eggs, and vegetables.',
        tags: ['chicken', 'rice', 'savory'],
        prepTime: 10, cookTime: 15, servings: 4,
        categories: ['Dinner', 'Meat', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Chicken', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Rice', qty: 2, unit: 'cups cooked', category: 'Grains' },
            { name: 'Eggs', qty: 2, unit: 'whole', category: 'Dairy' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Carrots', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Soy Sauce', qty: 3, unit: 'tbsp', category: 'Misc' },
            { name: 'Sesame Oil', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        instructions: [
            'Dice chicken into bite-sized pieces. Season with salt and pepper.',
            'Cook chicken in a wok or large skillet over high heat. Set aside.',
            'In the same pan, scramble the eggs. Push to the side.',
            'Add diced onion and carrots, stir-fry 3 minutes.',
            'Add cold cooked rice, breaking up clumps. Stir-fry 3 minutes.',
            'Return chicken to the pan. Add soy sauce and sesame oil. Toss and serve.',
        ],
    },
    {
        id: 10,
        name: 'Mushroom Omelette',
        description: 'A fluffy three-egg omelette stuffed with sautéed mushrooms and a touch of cheese.',
        tags: ['breakfast', 'quick', 'eggs'],
        prepTime: 5, cookTime: 8, servings: 1,
        categories: ['Breakfast', 'Vegetarian', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Eggs', qty: 3, unit: 'whole', category: 'Dairy' },
            { name: 'Mushrooms', qty: 0.5, unit: 'cup', category: 'Produce' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Shredded Cheese', qty: 2, unit: 'tbsp', category: 'Dairy' },
            { name: 'Chives', qty: 1, unit: 'tbsp', category: 'Produce' },
        ],
        instructions: [
            'Slice mushrooms and sauté in half the butter for 3 minutes. Set aside.',
            'Whisk eggs with a pinch of salt.',
            'Melt remaining butter in a non-stick pan over medium heat.',
            'Pour in eggs. When edges set, lift and tilt pan to let raw egg flow underneath.',
            'Add mushrooms and cheese to one side. Fold omelette and slide onto a plate.',
            'Garnish with chives and serve.',
        ],
    },
    {
        id: 11,
        name: 'Apple Walnut Salad',
        description: 'A crisp autumn salad with sliced apple, candied walnuts, and a honey-dijon dressing.',
        tags: ['salad', 'apple', 'no-cook', 'quick'],
        prepTime: 10, cookTime: 0, servings: 2,
        categories: ['Lunch', 'Salad', 'Vegetarian', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Mixed Greens', qty: 3, unit: 'cups', category: 'Produce' },
            { name: 'Walnuts', qty: 0.25, unit: 'cup', category: 'Snacks' },
            { name: 'Feta Cheese', qty: 2, unit: 'oz', category: 'Dairy' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Dijon Mustard', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Olive Oil', qty: 2, unit: 'tbsp', category: 'Misc' },
        ],
        instructions: [
            'Thinly slice the apple.',
            'Whisk together honey, dijon mustard, and olive oil for the dressing.',
            'Toss greens with dressing in a large bowl.',
            'Top with apple slices, walnuts, and crumbled feta.',
            'Serve immediately.',
        ],
    },
    {
        id: 12,
        name: 'Tomato Rice',
        description: 'Simple one-pot rice cooked in seasoned crushed tomatoes — great as a side or base.',
        tags: ['vegetarian', 'rice', 'side dish'],
        prepTime: 5, cookTime: 25, servings: 4,
        categories: ['Dinner', 'Vegetarian', 'One-Pot'], source: 'ai',
        ingredients: [
            { name: 'Rice', qty: 1.5, unit: 'cups', category: 'Grains' },
            { name: 'Crushed Tomatoes', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
            { name: 'Chicken Broth', qty: 1, unit: 'cup', category: 'Canned Goods' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        instructions: [
            'Sauté diced onion and garlic in olive oil in a medium pot for 3 minutes.',
            'Add rice and toast for 1 minute, stirring.',
            'Pour in crushed tomatoes and chicken broth. Season with salt.',
            'Bring to a boil, then cover and reduce heat to low.',
            'Cook 18 minutes until liquid is absorbed. Fluff with a fork and serve.',
        ],
    },
    {
        id: 13,
        name: 'Chicken Quesadillas',
        description: 'Crispy flour tortillas stuffed with seasoned chicken and melted cheese.',
        tags: ['chicken', 'quick', 'savory'],
        prepTime: 10, cookTime: 10, servings: 2,
        categories: ['Lunch', 'Meat', 'Quick'], source: 'ai',
        ingredients: [
            { name: 'Chicken', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Tortillas', qty: 4, unit: 'whole', category: 'Grains' },
            { name: 'Shredded Cheese', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Peppers', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Sour Cream', qty: 0.25, unit: 'cup', category: 'Dairy' },
            { name: 'Cumin', qty: 0.5, unit: 'tsp', category: 'Misc' },
        ],
        instructions: [
            'Dice chicken and season with cumin, salt, and pepper. Cook in a skillet until done.',
            'Slice peppers and sauté in the same pan 3 minutes.',
            'Lay a tortilla flat, top half with cheese, chicken, and peppers. Fold over.',
            'Cook in a dry skillet over medium heat 2 minutes per side until golden and crispy.',
            'Slice into wedges and serve with sour cream.',
        ],
    },
];
