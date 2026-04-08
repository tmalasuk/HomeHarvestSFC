import PantryProduct from './models/PantryProduct.js';
import PantryItem from './models/PantryItem.js';
import ShoppingItem from './models/ShoppingItem.js';
import Recipe from './models/Recipe.js';

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// helper: build a PantryProduct with a pre-filled batch
function makeProduct(name, category, restock, restockQty, items) {
    const p = new PantryProduct(name, category);
    p.restock = restock;
    p.restockQty = restockQty ?? 1;
    p.batch = items;
    return p;
}

// helper: build a PantryItem
function makeItem(name, category, qty, daysAdded, daysExp) {
    return new PantryItem(name, category, qty, daysFromNow(daysExp), daysAgo(daysAdded));
}

// helper: build a ShoppingItem with overrides
function makeShoppingItem(name, category, qty, durationValue, selectedUnit) {
    const item = new ShoppingItem(name, category, qty);
    item.durationValue = durationValue;
    item.selectedUnit = selectedUnit;
    return item;
}

// ─── Pantry ───────────────────────────────────────────────────────────────────
// Items tagged EXPIRING: expiration <= 3 days → triggers "Expiring Soon" filter
// Items tagged LOW QTY:  single batch, qty < 50 → triggers "Low Qty" filter

export const seedPantryProducts = [

    // ── Dairy ──────────────────────────────────────────────────────────────
    makeProduct('Milk', 'Dairy', true, 1, [
        makeItem('Milk', 'Dairy', 30, 10, 2),   // EXPIRING + LOW QTY
        makeItem('Milk', 'Dairy', 100, 3, 12),
    ]),
    makeProduct('Yogurt', 'Dairy', false, 1, [
        makeItem('Yogurt', 'Dairy', 60, 5, 1),  // EXPIRING
    ]),
    makeProduct('Eggs', 'Dairy', true, 1, [
        makeItem('Eggs', 'Dairy', 75, 7, 14),
    ]),
    makeProduct('Cheddar Cheese', 'Dairy', false, 1, [
        makeItem('Cheddar Cheese', 'Dairy', 85, 2, 21),
    ]),
    makeProduct('Butter', 'Dairy', false, 1, [
        makeItem('Butter', 'Dairy', 40, 14, 45), // LOW QTY
    ]),
    makeProduct('Sour Cream', 'Dairy', false, 1, [
        makeItem('Sour Cream', 'Dairy', 20, 8, 2), // EXPIRING + LOW QTY
    ]),

    // ── Produce ────────────────────────────────────────────────────────────
    makeProduct('Strawberries', 'Produce', false, 1, [
        makeItem('Strawberries', 'Produce', 45, 4, 2), // EXPIRING + LOW QTY
    ]),
    makeProduct('Spinach', 'Produce', true, 1, [
        makeItem('Spinach', 'Produce', 30, 5, 1), // EXPIRING + LOW QTY
    ]),
    makeProduct('Apples', 'Produce', false, 1, [
        makeItem('Apples', 'Produce', 100, 3, 18),
        makeItem('Apples', 'Produce', 100, 3, 18),
        makeItem('Apples', 'Produce', 100, 3, 18),
    ]),
    makeProduct('Bananas', 'Produce', false, 1, [
        makeItem('Bananas', 'Produce', 80, 6, 4),
    ]),
    makeProduct('Bell Peppers', 'Produce', false, 1, [
        makeItem('Bell Peppers', 'Produce', 100, 2, 10),
    ]),
    makeProduct('Avocados', 'Produce', false, 1, [
        makeItem('Avocados', 'Produce', 100, 1, 3),
    ]),

    // ── Meat ───────────────────────────────────────────────────────────────
    makeProduct('Chicken Breast', 'Meat', false, 1, [
        makeItem('Chicken Breast', 'Meat', 100, 1, 2), // EXPIRING
    ]),
    makeProduct('Ground Beef', 'Meat', true, 2, [
        makeItem('Ground Beef', 'Meat', 100, 3, 1), // EXPIRING
        makeItem('Ground Beef', 'Meat', 100, 3, 1), // EXPIRING
    ]),
    makeProduct('Salmon', 'Meat', false, 1, [
        makeItem('Salmon', 'Meat', 100, 0, 30),
    ]),
    makeProduct('Deli Turkey', 'Deli', false, 1, [
        makeItem('Deli Turkey', 'Deli', 35, 4, 3), // EXPIRING + LOW QTY
    ]),

    // ── Grains ─────────────────────────────────────────────────────────────
    makeProduct('Bread', 'Grains', true, 1, [
        makeItem('Bread', 'Grains', 25, 5, 2), // EXPIRING + LOW QTY
    ]),
    makeProduct('Rice', 'Grains', false, 1, [
        makeItem('Rice', 'Grains', 70, 30, 180),
        makeItem('Rice', 'Grains', 100, 10, 200),
    ]),
    makeProduct('Pasta', 'Grains', false, 1, [
        makeItem('Pasta', 'Grains', 100, 20, 365),
    ]),
    makeProduct('Oats', 'Grains', false, 1, [
        makeItem('Oats', 'Grains', 20, 40, 90), // LOW QTY
    ]),

    // ── Frozen ─────────────────────────────────────────────────────────────
    makeProduct('Frozen Pizza', 'Frozen', false, 1, [
        makeItem('Frozen Pizza', 'Frozen', 100, 14, 90),
        makeItem('Frozen Pizza', 'Frozen', 100, 14, 90),
    ]),
    makeProduct('Ice Cream', 'Frozen', false, 1, [
        makeItem('Ice Cream', 'Frozen', 30, 21, 60), // LOW QTY
    ]),
    makeProduct('Edamame', 'Frozen', false, 1, [
        makeItem('Edamame', 'Frozen', 100, 7, 120),
    ]),

    // ── Canned Goods ───────────────────────────────────────────────────────
    makeProduct('Black Beans', 'Canned Goods', false, 1, [
        makeItem('Black Beans', 'Canned Goods', 100, 60, 730),
        makeItem('Black Beans', 'Canned Goods', 100, 60, 730),
        makeItem('Black Beans', 'Canned Goods', 100, 60, 730),
    ]),
    makeProduct('Crushed Tomatoes', 'Canned Goods', false, 1, [
        makeItem('Crushed Tomatoes', 'Canned Goods', 100, 45, 700),
        makeItem('Crushed Tomatoes', 'Canned Goods', 100, 45, 700),
    ]),
    makeProduct('Chicken Broth', 'Canned Goods', true, 2, [
        makeItem('Chicken Broth', 'Canned Goods', 45, 90, 600), // LOW QTY
    ]),

    // ── Snacks ─────────────────────────────────────────────────────────────
    makeProduct('Chips', 'Snacks', false, 1, [
        makeItem('Chips', 'Snacks', 15, 10, 30), // LOW QTY
    ]),
    makeProduct('Granola Bars', 'Snacks', false, 1, [
        makeItem('Granola Bars', 'Snacks', 100, 5, 60),
        makeItem('Granola Bars', 'Snacks', 100, 5, 60),
    ]),
    makeProduct('Almonds', 'Snacks', false, 1, [
        makeItem('Almonds', 'Snacks', 80, 20, 150),
    ]),

    // ── Beverages ──────────────────────────────────────────────────────────
    makeProduct('Orange Juice', 'Beverages', true, 1, [
        makeItem('Orange Juice', 'Beverages', 20, 6, 2), // EXPIRING + LOW QTY
    ]),
    makeProduct('Almond Milk', 'Beverages', false, 1, [
        makeItem('Almond Milk', 'Beverages', 100, 2, 20),
        makeItem('Almond Milk', 'Beverages', 100, 2, 20),
    ]),

    // ── Condiments ─────────────────────────────────────────────────────────
    makeProduct('Ketchup', 'Condiments', false, 1, [
        makeItem('Ketchup', 'Condiments', 60, 30, 180),
    ]),
    makeProduct('Mustard', 'Condiments', false, 1, [
        makeItem('Mustard', 'Condiments', 10, 60, 120), // LOW QTY
    ]),
    makeProduct('Soy Sauce', 'Condiments', false, 1, [
        makeItem('Soy Sauce', 'Condiments', 50, 45, 365),
    ]),

    // ── Breakfast ──────────────────────────────────────────────────────────
    makeProduct('Cereal', 'Breakfast', false, 1, [
        makeItem('Cereal', 'Breakfast', 35, 14, 45), // LOW QTY
    ]),
    makeProduct('Pancake Mix', 'Breakfast', false, 1, [
        makeItem('Pancake Mix', 'Breakfast', 100, 10, 200),
    ]),
    makeProduct('Maple Syrup', 'Breakfast', false, 1, [
        makeItem('Maple Syrup', 'Breakfast', 40, 30, 365), // LOW QTY
    ]),
];

// ─── Shopping List ────────────────────────────────────────────────────────────
export const seedShoppingProducts = [
    makeShoppingItem('Milk',           'Dairy',        1, 2, 1),
    makeShoppingItem('Eggs',           'Dairy',        1, 2, 1),
    makeShoppingItem('Yogurt',         'Dairy',        2, 1, 1),
    makeShoppingItem('Strawberries',   'Produce',      1, 1, 1),
    makeShoppingItem('Spinach',        'Produce',      1, 1, 1),
    makeShoppingItem('Bananas',        'Produce',      1, 1, 1),
    makeShoppingItem('Chicken Breast', 'Meat',         2, 1, 1),
    makeShoppingItem('Ground Beef',    'Meat',         2, 1, 1),
    makeShoppingItem('Bread',          'Grains',       1, 1, 1),
    makeShoppingItem('Chips',          'Snacks',       2, 2, 2),
    makeShoppingItem('Ketchup',        'Condiments',   1, 6, 2),
    makeShoppingItem('Mustard',        'Condiments',   1, 6, 2),
    makeShoppingItem('Frozen Pizza',   'Frozen',       2, 3, 2),
    makeShoppingItem('Black Beans',    'Canned Goods', 4, 2, 3),
    makeShoppingItem('Cereal',         'Breakfast',    1, 6, 1),
    makeShoppingItem('Deli Turkey',    'Deli',         1, 1, 1),
    makeShoppingItem('Oats',           'Grains',       1, 3, 2),
];

// ─── Recipes ──────────────────────────────────────────────────────────────────
export const seedRecipes = [
    new Recipe(
        'Honey Garlic Chicken',
        'Tender pan-seared chicken glazed with a sweet and savory honey garlic sauce.',
        4, 10, 20,
        ['Dinner', 'Meat', 'Quick'],
        [
            { name: 'Chicken', qty: 2, unit: 'lbs', category: 'Meat' },
            { name: 'Garlic', qty: 4, unit: 'cloves', category: 'Produce' },
            { name: 'Honey', qty: 3, unit: 'tbsp', category: 'Misc' },
            { name: 'Soy Sauce', qty: 2, unit: 'tbsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        [
            'Season chicken with salt and pepper on both sides.',
            'Heat olive oil in a large skillet over medium-high heat.',
            'Sear chicken for 6–7 minutes per side until golden and cooked through. Remove and set aside.',
            'In the same pan, melt butter and sauté garlic for 1 minute.',
            'Add honey and soy sauce, stir and simmer 2 minutes until slightly thickened.',
            'Return chicken to the pan, coat in sauce, and serve.',
        ]
    ),
    new Recipe(
        'Strawberry Yogurt Parfait',
        'A quick layered breakfast with creamy yogurt, fresh strawberries, and crunchy granola.',
        1, 5, 0,
        ['Breakfast', 'Quick'],
        [
            { name: 'Yogurt', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Strawberries', qty: 0.5, unit: 'cup', category: 'Produce' },
            { name: 'Granola', qty: 0.25, unit: 'cup', category: 'Grains' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        [
            'Wash and slice strawberries.',
            'Spoon half the yogurt into a glass or bowl.',
            'Add a layer of strawberries and granola.',
            'Repeat layers with remaining yogurt and toppings.',
            'Drizzle with honey and serve immediately.',
        ]
    ),
    new Recipe(
        'French Toast',
        'Classic thick-cut French toast with a custardy egg-and-milk soak, served with maple syrup.',
        2, 5, 10,
        ['Breakfast', 'Quick'],
        [
            { name: 'Bread', qty: 4, unit: 'slices', category: 'Grains' },
            { name: 'Eggs', qty: 2, unit: 'whole', category: 'Dairy' },
            { name: 'Milk', qty: 0.25, unit: 'cup', category: 'Dairy' },
            { name: 'Cinnamon', qty: 0.5, unit: 'tsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Maple Syrup', qty: 2, unit: 'tbsp', category: 'Misc' },
        ],
        [
            'Whisk together eggs, milk, and cinnamon in a shallow bowl.',
            'Heat a skillet over medium heat and melt butter.',
            'Dip each bread slice in the egg mixture, coating both sides.',
            'Cook for 2–3 minutes per side until golden brown.',
            'Serve warm with maple syrup.',
        ]
    ),
    new Recipe(
        'Apple Cinnamon Oatmeal',
        'Warm stovetop oatmeal with sautéed apple, brown sugar, and cinnamon.',
        2, 5, 10,
        ['Breakfast', 'Quick'],
        [
            { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Oats', qty: 1, unit: 'cup', category: 'Grains' },
            { name: 'Milk', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Brown Sugar', qty: 1, unit: 'tbsp', category: 'Misc' },
            { name: 'Cinnamon', qty: 0.5, unit: 'tsp', category: 'Misc' },
            { name: 'Butter', qty: 1, unit: 'tsp', category: 'Dairy' },
        ],
        [
            'Dice the apple into small cubes.',
            'Melt butter in a small pan, add apple, cinnamon, and brown sugar. Cook 3 minutes.',
            'Meanwhile, combine oats and milk in a saucepan over medium heat.',
            'Cook oats, stirring frequently, until thickened, about 5 minutes.',
            'Top oatmeal with the sautéed apple mixture and serve.',
        ]
    ),
    new Recipe(
        'Chicken Noodle Soup',
        'Comforting homemade chicken soup with vegetables and egg noodles.',
        6, 15, 40,
        ['Dinner', 'Soup', 'Meat', 'Comfort Food'],
        [
            { name: 'Chicken', qty: 1.5, unit: 'lbs', category: 'Meat' },
            { name: 'Carrots', qty: 3, unit: 'whole', category: 'Produce' },
            { name: 'Onions', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
            { name: 'Egg Noodles', qty: 2, unit: 'cups', category: 'Grains' },
            { name: 'Chicken Broth', qty: 6, unit: 'cups', category: 'Canned Goods' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        [
            'Dice onion and carrots. Mince garlic.',
            'Heat oil in a large pot over medium heat. Sauté onion, carrots, and garlic for 5 minutes.',
            'Add chicken and broth. Bring to a boil, then reduce heat and simmer 25 minutes.',
            'Remove chicken, shred with forks, and return to pot.',
            'Add egg noodles and cook another 8 minutes until tender.',
            'Season with salt and pepper and serve hot.',
        ]
    ),
    new Recipe(
        'Spaghetti Bolognese',
        'A hearty Italian meat sauce slow-simmered with crushed tomatoes over spaghetti.',
        4, 10, 35,
        ['Dinner', 'Pasta', 'Meat'],
        [
            { name: 'Spaghetti Noodles', qty: 12, unit: 'oz', category: 'Grains' },
            { name: 'Ground Beef', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Crushed Tomatoes', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Onions', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 3, unit: 'cloves', category: 'Produce' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
            { name: 'Italian Seasoning', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        [
            'Boil salted water and cook spaghetti according to package directions.',
            'Heat olive oil in a skillet. Sauté diced onion and garlic 3 minutes.',
            'Add ground beef, breaking it up, and cook until browned.',
            'Stir in crushed tomatoes and Italian seasoning. Simmer 20 minutes.',
            'Drain pasta and serve topped with meat sauce.',
        ]
    ),
    new Recipe(
        'Black Bean Tacos',
        'Quick weeknight tacos with seasoned black beans, peppers, and fresh toppings.',
        4, 10, 10,
        ['Lunch', 'Vegetarian', 'Quick'],
        [
            { name: 'Black Beans', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Peppers', qty: 2, unit: 'whole', category: 'Produce' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Tortillas', qty: 8, unit: 'whole', category: 'Grains' },
            { name: 'Cumin', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Sour Cream', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Lime', qty: 1, unit: 'whole', category: 'Produce' },
        ],
        [
            'Drain and rinse black beans.',
            'Slice peppers and onion into strips. Sauté in oil over medium heat 5 minutes.',
            'Add beans and cumin to the pan. Cook 3 minutes until warmed through.',
            'Warm tortillas in a dry skillet or microwave.',
            'Fill tortillas with bean mixture, top with sour cream and a squeeze of lime.',
        ]
    ),
    new Recipe(
        'Strawberry Smoothie',
        'A creamy three-ingredient smoothie perfect for using up strawberries before they turn.',
        1, 5, 0,
        ['Breakfast', 'Drink', 'Quick'],
        [
            { name: 'Strawberries', qty: 1, unit: 'cup', category: 'Produce' },
            { name: 'Yogurt', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Milk', qty: 0.5, unit: 'cup', category: 'Dairy' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        [
            'Hull and halve strawberries.',
            'Add all ingredients to a blender.',
            'Blend on high for 30–45 seconds until smooth.',
            'Pour into a glass and serve immediately.',
        ]
    ),
    new Recipe(
        'Chicken Fried Rice',
        'Better-than-takeout fried rice with chicken, eggs, and vegetables.',
        4, 10, 15,
        ['Dinner', 'Meat', 'Quick'],
        [
            { name: 'Chicken', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Rice', qty: 2, unit: 'cups cooked', category: 'Grains' },
            { name: 'Eggs', qty: 2, unit: 'whole', category: 'Dairy' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Carrots', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Soy Sauce', qty: 3, unit: 'tbsp', category: 'Misc' },
            { name: 'Sesame Oil', qty: 1, unit: 'tsp', category: 'Misc' },
        ],
        [
            'Dice chicken into bite-sized pieces. Season with salt and pepper.',
            'Cook chicken in a wok or large skillet over high heat. Set aside.',
            'In the same pan, scramble the eggs. Push to the side.',
            'Add diced onion and carrots, stir-fry 3 minutes.',
            'Add cold cooked rice, breaking up clumps. Stir-fry 3 minutes.',
            'Return chicken to the pan. Add soy sauce and sesame oil. Toss and serve.',
        ]
    ),
    new Recipe(
        'Mushroom Omelette',
        'A fluffy three-egg omelette stuffed with sautéed mushrooms and a touch of cheese.',
        1, 5, 8,
        ['Breakfast', 'Vegetarian', 'Quick'],
        [
            { name: 'Eggs', qty: 3, unit: 'whole', category: 'Dairy' },
            { name: 'Mushrooms', qty: 0.5, unit: 'cup', category: 'Produce' },
            { name: 'Butter', qty: 1, unit: 'tbsp', category: 'Dairy' },
            { name: 'Shredded Cheese', qty: 2, unit: 'tbsp', category: 'Dairy' },
            { name: 'Chives', qty: 1, unit: 'tbsp', category: 'Produce' },
        ],
        [
            'Slice mushrooms and sauté in half the butter for 3 minutes. Set aside.',
            'Whisk eggs with a pinch of salt.',
            'Melt remaining butter in a non-stick pan over medium heat.',
            'Pour in eggs. When edges set, lift and tilt pan to let raw egg flow underneath.',
            'Add mushrooms and cheese to one side. Fold omelette and slide onto a plate.',
            'Garnish with chives and serve.',
        ]
    ),
    new Recipe(
        'Apple Walnut Salad',
        'A crisp autumn salad with sliced apple, candied walnuts, and a honey-dijon dressing.',
        2, 10, 0,
        ['Lunch', 'Salad', 'Vegetarian', 'Quick'],
        [
            { name: 'Apple', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Mixed Greens', qty: 3, unit: 'cups', category: 'Produce' },
            { name: 'Walnuts', qty: 0.25, unit: 'cup', category: 'Snacks' },
            { name: 'Feta Cheese', qty: 2, unit: 'oz', category: 'Dairy' },
            { name: 'Honey', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Dijon Mustard', qty: 1, unit: 'tsp', category: 'Misc' },
            { name: 'Olive Oil', qty: 2, unit: 'tbsp', category: 'Misc' },
        ],
        [
            'Thinly slice the apple.',
            'Whisk together honey, dijon mustard, and olive oil for the dressing.',
            'Toss greens with dressing in a large bowl.',
            'Top with apple slices, walnuts, and crumbled feta.',
            'Serve immediately.',
        ]
    ),
    new Recipe(
        'Tomato Rice',
        'Simple one-pot rice cooked in seasoned crushed tomatoes — great as a side or base.',
        4, 5, 25,
        ['Dinner', 'Vegetarian', 'One-Pot'],
        [
            { name: 'Rice', qty: 1.5, unit: 'cups', category: 'Grains' },
            { name: 'Crushed Tomatoes', qty: 1, unit: 'can', category: 'Canned Goods' },
            { name: 'Onions', qty: 0.5, unit: 'whole', category: 'Produce' },
            { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
            { name: 'Chicken Broth', qty: 1, unit: 'cup', category: 'Canned Goods' },
            { name: 'Olive Oil', qty: 1, unit: 'tbsp', category: 'Misc' },
        ],
        [
            'Sauté diced onion and garlic in olive oil in a medium pot for 3 minutes.',
            'Add rice and toast for 1 minute, stirring.',
            'Pour in crushed tomatoes and chicken broth. Season with salt.',
            'Bring to a boil, then cover and reduce heat to low.',
            'Cook 18 minutes until liquid is absorbed. Fluff with a fork and serve.',
        ]
    ),
    new Recipe(
        'Chicken Quesadillas',
        'Crispy flour tortillas stuffed with seasoned chicken and melted cheese.',
        2, 10, 10,
        ['Lunch', 'Meat', 'Quick'],
        [
            { name: 'Chicken', qty: 1, unit: 'lb', category: 'Meat' },
            { name: 'Tortillas', qty: 4, unit: 'whole', category: 'Grains' },
            { name: 'Shredded Cheese', qty: 1, unit: 'cup', category: 'Dairy' },
            { name: 'Peppers', qty: 1, unit: 'whole', category: 'Produce' },
            { name: 'Sour Cream', qty: 0.25, unit: 'cup', category: 'Dairy' },
            { name: 'Cumin', qty: 0.5, unit: 'tsp', category: 'Misc' },
        ],
        [
            'Dice chicken and season with cumin, salt, and pepper. Cook in a skillet until done.',
            'Slice peppers and sauté in the same pan 3 minutes.',
            'Lay a tortilla flat, top half with cheese, chicken, and peppers. Fold over.',
            'Cook in a dry skillet over medium heat 2 minutes per side until golden and crispy.',
            'Slice into wedges and serve with sour cream.',
        ]
    ),
];
