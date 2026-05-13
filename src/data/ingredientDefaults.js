// Default quantity and unit for common pantry ingredients.
// Units are the most common measurable purchase unit so recipe-unit conversion can work.
// Quantities reflect the most commonly bought size for that item.
// Lookup mirrors ingredientCategories.js: exact match first, then category fallback.

export const QUANTITY_UNITS = [
    // discrete / container
    'count', 'dozen', 'whole',
    'bottle', 'can', 'jar', 'bag', 'box', 'carton', 'pkg',
    'loaf', 'bunch', 'head', 'stick',
    // volume
    'tsp', 'tbsp', 'cup', 'fl oz', 'pt', 'qt', 'gal', 'ml', 'L',
    // weight
    'oz', 'lb', 'g', 'kg',
]

const categoryDefaults = {
    'Produce':      { qty: 1,  unit: 'count' },
    'Dairy':        { qty: 1,  unit: 'lb'    },
    'Meat':         { qty: 1,  unit: 'lb'    },
    'Deli':         { qty: 1,  unit: 'lb'    },
    'Grains':       { qty: 16, unit: 'oz'    },
    'Frozen':       { qty: 1,  unit: 'bag'   },
    'Canned Goods': { qty: 15, unit: 'oz'    },
    'Snacks':       { qty: 10, unit: 'oz'    },
    'Condiments':   { qty: 16, unit: 'fl oz' },
    'Spices':       { qty: 4,  unit: 'oz'    },
    'Baking':       { qty: 16, unit: 'oz'    },
    'Beverages':    { qty: 1,  unit: 'bottle'},
    'Breakfast':    { qty: 1,  unit: 'box'   },
    'Misc':         { qty: 1,  unit: 'count' },
}

const ingredientDefaultsMap = {

    // ── Dairy ────────────────────────────────────────────────
    'egg':                          { qty: 12,   unit: 'count' },
    'eggs':                         { qty: 12,   unit: 'count' },
    'egg whites':                   { qty: 32,   unit: 'fl oz' },  // 32 fl oz carton
    'milk':                         { qty: 128,  unit: 'fl oz' },  // 1 gallon = 128 fl oz
    'whole milk':                   { qty: 128,  unit: 'fl oz' },
    '2% milk':                      { qty: 128,  unit: 'fl oz' },
    'skim milk':                    { qty: 128,  unit: 'fl oz' },
    'almond milk':                  { qty: 64,   unit: 'fl oz' },  // half-gallon
    'oat milk':                     { qty: 64,   unit: 'fl oz' },
    'soy milk':                     { qty: 64,   unit: 'fl oz' },
    'coconut milk':                 { qty: 13.5, unit: 'fl oz' },  // standard 13.5 oz can
    'butter':                       { qty: 1,    unit: 'lb'    },  // 1 lb (4-stick package)
    'unsalted butter':              { qty: 1,    unit: 'lb'    },
    'salted butter':                { qty: 1,    unit: 'lb'    },
    'cream cheese':                 { qty: 8,    unit: 'oz'    },  // standard block
    'sour cream':                   { qty: 16,   unit: 'oz'    },  // 16 oz tub
    'heavy cream':                  { qty: 16,   unit: 'fl oz' },  // 1 pint = 16 fl oz
    'heavy whipping cream':         { qty: 16,   unit: 'fl oz' },
    'whipping cream':               { qty: 16,   unit: 'fl oz' },
    'half and half':                { qty: 16,   unit: 'fl oz' },
    'half-and-half':                { qty: 16,   unit: 'fl oz' },
    'buttermilk':                   { qty: 32,   unit: 'fl oz' },  // quart
    'yogurt':                       { qty: 32,   unit: 'oz'    },  // 32 oz tub
    'greek yogurt':                 { qty: 32,   unit: 'oz'    },
    'plain yogurt':                 { qty: 32,   unit: 'oz'    },
    'cottage cheese':               { qty: 16,   unit: 'oz'    },
    'ricotta':                      { qty: 15,   unit: 'oz'    },  // standard container
    'ricotta cheese':               { qty: 15,   unit: 'oz'    },
    'cheddar':                      { qty: 8,    unit: 'oz'    },
    'cheddar cheese':               { qty: 8,    unit: 'oz'    },
    'shredded cheddar':             { qty: 8,    unit: 'oz'    },
    'mozzarella':                   { qty: 8,    unit: 'oz'    },
    'shredded mozzarella':          { qty: 8,    unit: 'oz'    },
    'parmesan':                     { qty: 6,    unit: 'oz'    },  // common grated shaker
    'parmesan cheese':              { qty: 6,    unit: 'oz'    },
    'grated parmesan':              { qty: 6,    unit: 'oz'    },
    'feta':                         { qty: 6,    unit: 'oz'    },
    'feta cheese':                  { qty: 6,    unit: 'oz'    },
    'goat cheese':                  { qty: 4,    unit: 'oz'    },
    'cream':                        { qty: 16,   unit: 'fl oz' },
    'ice cream':                    { qty: 1,    unit: 'carton'},
    'ghee':                         { qty: 13,   unit: 'oz'    },  // common 13 oz jar

    // ── Meat ─────────────────────────────────────────────────
    'chicken breast':               { qty: 2,    unit: 'lb'    },
    'chicken breasts':              { qty: 2,    unit: 'lb'    },
    'chicken thighs':               { qty: 2,    unit: 'lb'    },
    'chicken tenders':              { qty: 1,    unit: 'lb'    },
    'chicken wings':                { qty: 2,    unit: 'lb'    },
    'chicken legs':                 { qty: 2,    unit: 'lb'    },
    'ground beef':                  { qty: 1,    unit: 'lb'    },
    'ground turkey':                { qty: 1,    unit: 'lb'    },
    'ground chicken':               { qty: 1,    unit: 'lb'    },
    'ground pork':                  { qty: 1,    unit: 'lb'    },
    'ground lamb':                  { qty: 1,    unit: 'lb'    },
    'bacon':                        { qty: 1,    unit: 'lb'    },
    'canadian bacon':               { qty: 0.5,  unit: 'lb'    },
    'pancetta':                     { qty: 4,    unit: 'oz'    },
    'prosciutto':                   { qty: 4,    unit: 'oz'    },
    'italian sausage':              { qty: 1,    unit: 'lb'    },
    'sausage':                      { qty: 1,    unit: 'lb'    },
    'chorizo':                      { qty: 1,    unit: 'lb'    },
    'hot dogs':                     { qty: 1,    unit: 'lb'    },
    'pepperoni':                    { qty: 6,    unit: 'oz'    },
    'salmon':                       { qty: 1,    unit: 'lb'    },
    'shrimp':                       { qty: 1,    unit: 'lb'    },
    'tuna':                         { qty: 1,    unit: 'lb'    },
    'cod':                          { qty: 1,    unit: 'lb'    },
    'tilapia':                      { qty: 1,    unit: 'lb'    },
    'steak':                        { qty: 1,    unit: 'lb'    },
    'sirloin':                      { qty: 1,    unit: 'lb'    },
    'ribeye':                       { qty: 1,    unit: 'lb'    },
    'flank steak':                  { qty: 1,    unit: 'lb'    },
    'pork chops':                   { qty: 1,    unit: 'lb'    },
    'pork tenderloin':              { qty: 1,    unit: 'lb'    },
    'pork loin':                    { qty: 2,    unit: 'lb'    },
    'turkey':                       { qty: 1,    unit: 'lb'    },
    'turkey breast':                { qty: 2,    unit: 'lb'    },
    'lamb':                         { qty: 1,    unit: 'lb'    },
    'ham':                          { qty: 1,    unit: 'lb'    },
    'beef':                         { qty: 1,    unit: 'lb'    },
    'chuck roast':                  { qty: 2,    unit: 'lb'    },
    'pork shoulder':                { qty: 3,    unit: 'lb'    },
    'scallops':                     { qty: 1,    unit: 'lb'    },
    'crab':                         { qty: 1,    unit: 'lb'    },
    'lobster':                      { qty: 1,    unit: 'lb'    },
    'canned tuna':                  { qty: 5,    unit: 'oz'    },  // standard 5 oz can
    'canned salmon':                { qty: 14.75,unit: 'oz'    },  // standard 14.75 oz can

    // ── Produce ──────────────────────────────────────────────
    'apple':                        { qty: 4,    unit: 'count' },
    'apples':                       { qty: 4,    unit: 'count' },
    'banana':                       { qty: 6,    unit: 'count' },
    'bananas':                      { qty: 6,    unit: 'count' },
    'tomato':                       { qty: 4,    unit: 'count' },
    'tomatoes':                     { qty: 4,    unit: 'count' },
    'cherry tomatoes':              { qty: 10,   unit: 'oz'    },  // standard 10 oz clamshell
    'cherry tomato':                { qty: 10,   unit: 'oz'    },
    'grape tomatoes':               { qty: 10,   unit: 'oz'    },
    'potato':                       { qty: 5,    unit: 'lb'    },
    'potatoes':                     { qty: 5,    unit: 'lb'    },
    'sweet potato':                 { qty: 3,    unit: 'count' },
    'sweet potatoes':               { qty: 3,    unit: 'count' },
    'onion':                        { qty: 3,    unit: 'lb'    },
    'onions':                       { qty: 3,    unit: 'lb'    },
    'red onion':                    { qty: 1,    unit: 'count' },
    'red onions':                   { qty: 2,    unit: 'count' },
    'yellow onion':                 { qty: 3,    unit: 'lb'    },
    'white onion':                  { qty: 3,    unit: 'lb'    },
    'green onion':                  { qty: 1,    unit: 'bunch' },
    'green onions':                 { qty: 1,    unit: 'bunch' },
    'scallion':                     { qty: 1,    unit: 'bunch' },
    'scallions':                    { qty: 1,    unit: 'bunch' },
    'shallot':                      { qty: 4,    unit: 'count' },
    'shallots':                     { qty: 4,    unit: 'count' },
    'garlic':                       { qty: 1,    unit: 'head'  },
    'garlic clove':                 { qty: 8,    unit: 'count' },
    'garlic cloves':                { qty: 8,    unit: 'count' },
    'lemon':                        { qty: 4,    unit: 'count' },
    'lemons':                       { qty: 4,    unit: 'count' },
    'lime':                         { qty: 4,    unit: 'count' },
    'limes':                        { qty: 4,    unit: 'count' },
    'orange':                       { qty: 4,    unit: 'count' },
    'oranges':                      { qty: 4,    unit: 'count' },
    'avocado':                      { qty: 2,    unit: 'count' },
    'avocados':                     { qty: 2,    unit: 'count' },
    'carrot':                       { qty: 4,    unit: 'count' },
    'carrots':                      { qty: 4,    unit: 'count' },
    'baby carrots':                 { qty: 16,   unit: 'oz'    },  // 16 oz bag
    'celery':                       { qty: 1,    unit: 'bunch' },
    'spinach':                      { qty: 5,    unit: 'oz'    },  // 5 oz clamshell
    'baby spinach':                 { qty: 5,    unit: 'oz'    },
    'lettuce':                      { qty: 1,    unit: 'head'  },
    'romaine':                      { qty: 1,    unit: 'head'  },
    'iceberg lettuce':              { qty: 1,    unit: 'head'  },
    'butter lettuce':               { qty: 1,    unit: 'head'  },
    'kale':                         { qty: 1,    unit: 'bunch' },
    'mixed greens':                 { qty: 5,    unit: 'oz'    },
    'bell pepper':                  { qty: 3,    unit: 'count' },
    'bell peppers':                 { qty: 3,    unit: 'count' },
    'red bell pepper':              { qty: 3,    unit: 'count' },
    'red bell peppers':             { qty: 3,    unit: 'count' },
    'yellow bell pepper':           { qty: 3,    unit: 'count' },
    'yellow bell peppers':          { qty: 3,    unit: 'count' },
    'orange bell pepper':           { qty: 3,    unit: 'count' },
    'orange bell peppers':          { qty: 3,    unit: 'count' },
    'red pepper':                   { qty: 3,    unit: 'count' },
    'yellow pepper':                { qty: 3,    unit: 'count' },
    'green pepper':                 { qty: 3,    unit: 'count' },
    'jalapeño':                     { qty: 4,    unit: 'count' },
    'jalapeno':                     { qty: 4,    unit: 'count' },
    'broccoli':                     { qty: 1,    unit: 'head'  },
    'cauliflower':                  { qty: 1,    unit: 'head'  },
    'cucumber':                     { qty: 2,    unit: 'count' },
    'cucumbers':                    { qty: 2,    unit: 'count' },
    'zucchini':                     { qty: 2,    unit: 'count' },
    'zucchinis':                    { qty: 2,    unit: 'count' },
    'mushroom':                     { qty: 8,    unit: 'oz'    },  // 8 oz container
    'mushrooms':                    { qty: 8,    unit: 'oz'    },
    'asparagus':                    { qty: 1,    unit: 'bunch' },
    'green beans':                  { qty: 12,   unit: 'oz'    },
    'peas':                         { qty: 10,   unit: 'oz'    },
    'corn':                         { qty: 4,    unit: 'count' },
    'strawberry':                   { qty: 1,    unit: 'lb'    },
    'strawberries':                 { qty: 1,    unit: 'lb'    },
    'blueberry':                    { qty: 6,    unit: 'oz'    },  // 6 oz clamshell
    'blueberries':                  { qty: 6,    unit: 'oz'    },
    'raspberry':                    { qty: 6,    unit: 'oz'    },
    'raspberries':                  { qty: 6,    unit: 'oz'    },
    'grapes':                       { qty: 1.5,  unit: 'lb'    },
    'grape':                        { qty: 1.5,  unit: 'lb'    },
    'mango':                        { qty: 2,    unit: 'count' },
    'mangoes':                      { qty: 2,    unit: 'count' },
    'pineapple':                    { qty: 1,    unit: 'count' },
    'watermelon':                   { qty: 1,    unit: 'count' },
    'ginger':                       { qty: 4,    unit: 'oz'    },  // ~4 oz piece
    'ginger root':                  { qty: 4,    unit: 'oz'    },
    'cilantro':                     { qty: 1,    unit: 'bunch' },
    'parsley':                      { qty: 1,    unit: 'bunch' },
    'basil':                        { qty: 1,    unit: 'bunch' },
    'mint':                         { qty: 1,    unit: 'bunch' },

    // ── Grains ───────────────────────────────────────────────
    'pasta':                        { qty: 16,   unit: 'oz'    },  // 1 lb box
    'spaghetti':                    { qty: 16,   unit: 'oz'    },
    'penne':                        { qty: 16,   unit: 'oz'    },
    'linguine':                     { qty: 16,   unit: 'oz'    },
    'fettuccine':                   { qty: 16,   unit: 'oz'    },
    'rigatoni':                     { qty: 16,   unit: 'oz'    },
    'rotini':                       { qty: 16,   unit: 'oz'    },
    'farfalle':                     { qty: 16,   unit: 'oz'    },
    'angel hair pasta':             { qty: 16,   unit: 'oz'    },
    'egg noodles':                  { qty: 16,   unit: 'oz'    },
    'lasagna noodles':              { qty: 16,   unit: 'oz'    },
    'rice noodles':                 { qty: 8,    unit: 'oz'    },
    'macaroni':                     { qty: 16,   unit: 'oz'    },
    'elbow macaroni':               { qty: 16,   unit: 'oz'    },
    'orzo':                         { qty: 16,   unit: 'oz'    },
    'rice':                         { qty: 2,    unit: 'lb'    },  // 2 lb bag
    'white rice':                   { qty: 2,    unit: 'lb'    },
    'brown rice':                   { qty: 2,    unit: 'lb'    },
    'jasmine rice':                 { qty: 2,    unit: 'lb'    },
    'basmati rice':                 { qty: 2,    unit: 'lb'    },
    'quinoa':                       { qty: 16,   unit: 'oz'    },
    'couscous':                     { qty: 10,   unit: 'oz'    },
    'farro':                        { qty: 16,   unit: 'oz'    },
    'barley':                       { qty: 16,   unit: 'oz'    },
    'oats':                         { qty: 42,   unit: 'oz'    },  // large Quaker canister
    'rolled oats':                  { qty: 42,   unit: 'oz'    },
    'steel cut oats':               { qty: 24,   unit: 'oz'    },
    'bread':                        { qty: 1,    unit: 'loaf'  },
    'white bread':                  { qty: 1,    unit: 'loaf'  },
    'whole wheat bread':            { qty: 1,    unit: 'loaf'  },
    'sourdough':                    { qty: 1,    unit: 'loaf'  },
    'sourdough bread':              { qty: 1,    unit: 'loaf'  },
    'rye bread':                    { qty: 1,    unit: 'loaf'  },
    'flour':                        { qty: 5,    unit: 'lb'    },  // 5 lb bag
    'all-purpose flour':            { qty: 5,    unit: 'lb'    },
    'whole wheat flour':            { qty: 5,    unit: 'lb'    },
    'bread flour':                  { qty: 5,    unit: 'lb'    },
    'tortillas':                    { qty: 10,   unit: 'count' },
    'flour tortillas':              { qty: 10,   unit: 'count' },
    'corn tortillas':               { qty: 12,   unit: 'count' },
    'crackers':                     { qty: 9,    unit: 'oz'    },  // standard sleeve
    'bread crumbs':                 { qty: 15,   unit: 'oz'    },  // standard canister
    'breadcrumbs':                  { qty: 15,   unit: 'oz'    },
    'panko':                        { qty: 8,    unit: 'oz'    },
    'panko breadcrumbs':            { qty: 8,    unit: 'oz'    },
    'hamburger buns':               { qty: 8,    unit: 'count' },
    'hot dog buns':                 { qty: 8,    unit: 'count' },
    'pita bread':                   { qty: 6,    unit: 'count' },
    'naan':                         { qty: 4,    unit: 'count' },
    'cornmeal':                     { qty: 24,   unit: 'oz'    },  // standard canister

    // ── Canned Goods ─────────────────────────────────────────
    'chicken broth':                { qty: 32,   unit: 'fl oz' },  // 32 fl oz carton
    'chicken stock':                { qty: 32,   unit: 'fl oz' },
    'chicken bouillon cubes':       { qty: 8,    unit: 'count' }, // standard box of 8
    'chicken bouillon cube':        { qty: 8,    unit: 'count' },
    'beef bouillon cubes':          { qty: 8,    unit: 'count' },
    'beef bouillon cube':           { qty: 8,    unit: 'count' },
    'vegetable bouillon cubes':     { qty: 8,    unit: 'count' },
    'bouillon cubes':               { qty: 8,    unit: 'count' },
    'beef broth':                   { qty: 32,   unit: 'fl oz' },
    'beef stock':                   { qty: 32,   unit: 'fl oz' },
    'vegetable broth':              { qty: 32,   unit: 'fl oz' },
    'vegetable stock':              { qty: 32,   unit: 'fl oz' },
    'bone broth':                   { qty: 32,   unit: 'fl oz' },
    'tomato sauce':                 { qty: 15,   unit: 'oz'    },  // standard 15 oz can
    'diced tomatoes':               { qty: 14.5, unit: 'oz'    },  // standard 14.5 oz can
    'crushed tomatoes':             { qty: 28,   unit: 'oz'    },  // common 28 oz can
    'whole tomatoes':               { qty: 28,   unit: 'oz'    },
    'canned tomatoes':              { qty: 14.5, unit: 'oz'    },
    'tomato paste':                 { qty: 6,    unit: 'oz'    },  // standard 6 oz can
    'tomato puree':                 { qty: 15,   unit: 'oz'    },
    'pasta sauce':                  { qty: 24,   unit: 'oz'    },  // standard 24 oz jar
    'marinara sauce':               { qty: 24,   unit: 'oz'    },
    'spaghetti sauce':              { qty: 24,   unit: 'oz'    },
    'black beans':                  { qty: 15,   unit: 'oz'    },
    'chickpeas':                    { qty: 15,   unit: 'oz'    },
    'garbanzo beans':               { qty: 15,   unit: 'oz'    },
    'kidney beans':                 { qty: 15,   unit: 'oz'    },
    'pinto beans':                  { qty: 15,   unit: 'oz'    },
    'cannellini beans':             { qty: 15,   unit: 'oz'    },
    'white beans':                  { qty: 15,   unit: 'oz'    },
    'navy beans':                   { qty: 15,   unit: 'oz'    },
    'lentils':                      { qty: 16,   unit: 'oz'    },  // 1 lb dry bag
    'refried beans':                { qty: 16,   unit: 'oz'    },  // 16 oz can
    'baked beans':                  { qty: 16,   unit: 'oz'    },
    'cream of mushroom soup':       { qty: 10.5, unit: 'oz'    },
    'cream of chicken soup':        { qty: 10.5, unit: 'oz'    },
    'coconut cream':                { qty: 13.5, unit: 'oz'    },
    'pumpkin puree':                { qty: 15,   unit: 'oz'    },
    'canned pumpkin':               { qty: 15,   unit: 'oz'    },
    'salsa':                        { qty: 16,   unit: 'oz'    },  // standard 16 oz jar
    'pico de gallo':                { qty: 16,   unit: 'oz'    },
    'enchilada sauce':              { qty: 10,   unit: 'oz'    },
    'applesauce':                   { qty: 23,   unit: 'oz'    },  // standard 23 oz jar
    'apple sauce':                  { qty: 23,   unit: 'oz'    },
    'olives':                       { qty: 6,    unit: 'oz'    },
    'black olives':                 { qty: 6,    unit: 'oz'    },
    'artichoke hearts':             { qty: 14,   unit: 'oz'    },
    'water chestnuts':              { qty: 8,    unit: 'oz'    },
    'canned corn':                  { qty: 15.25,unit: 'oz'    },
    'mandarin oranges':             { qty: 15,   unit: 'oz'    },

    // ── Condiments ───────────────────────────────────────────
    'olive oil':                    { qty: 16.9, unit: 'fl oz' },  // 500 ml bottle
    'extra virgin olive oil':       { qty: 16.9, unit: 'fl oz' },
    'vegetable oil':                { qty: 48,   unit: 'fl oz' },  // 48 fl oz jug
    'canola oil':                   { qty: 48,   unit: 'fl oz' },
    'avocado oil':                  { qty: 16.9, unit: 'fl oz' },
    'coconut oil':                  { qty: 14,   unit: 'oz'    },  // 14 oz jar (solid)
    'sesame oil':                   { qty: 6.7,  unit: 'fl oz' },  // 200 ml bottle
    'grapeseed oil':                { qty: 16.9, unit: 'fl oz' },
    'peanut oil':                   { qty: 16,   unit: 'fl oz' },
    'oil':                          { qty: 16.9, unit: 'fl oz' },
    'soy sauce':                    { qty: 10,   unit: 'fl oz' },  // standard bottle
    'tamari':                       { qty: 10,   unit: 'fl oz' },
    'coconut aminos':               { qty: 12,   unit: 'fl oz' },
    'fish sauce':                   { qty: 6.76, unit: 'fl oz' },  // 200 ml bottle
    'oyster sauce':                 { qty: 9,    unit: 'oz'    },
    'hoisin sauce':                 { qty: 12,   unit: 'oz'    },
    'teriyaki sauce':               { qty: 12,   unit: 'fl oz' },
    'worcestershire sauce':         { qty: 10,   unit: 'fl oz' },
    'hot sauce':                    { qty: 5,    unit: 'fl oz' },  // standard Tabasco size
    'sriracha':                     { qty: 17,   unit: 'fl oz' },  // Huy Fong standard
    'buffalo sauce':                { qty: 12,   unit: 'fl oz' },
    'bbq sauce':                    { qty: 18,   unit: 'oz'    },  // standard 18 oz bottle
    'ketchup':                      { qty: 20,   unit: 'oz'    },
    'mustard':                      { qty: 14,   unit: 'oz'    },  // standard 14 oz squeeze
    'dijon mustard':                { qty: 12,   unit: 'oz'    },
    'yellow mustard':               { qty: 14,   unit: 'oz'    },
    'whole grain mustard':          { qty: 8,    unit: 'oz'    },
    'mayonnaise':                   { qty: 30,   unit: 'oz'    },  // standard 30 oz jar
    'ranch dressing':               { qty: 16,   unit: 'fl oz' },
    'italian dressing':             { qty: 16,   unit: 'fl oz' },
    'caesar dressing':              { qty: 16,   unit: 'fl oz' },
    'balsamic vinegar':             { qty: 16,   unit: 'fl oz' },
    'balsamic vinaigrette':         { qty: 16,   unit: 'fl oz' },
    'red wine vinegar':             { qty: 16,   unit: 'fl oz' },
    'white wine vinegar':           { qty: 16,   unit: 'fl oz' },
    'apple cider vinegar':          { qty: 16,   unit: 'fl oz' },
    'rice vinegar':                 { qty: 10,   unit: 'fl oz' },
    'white vinegar':                { qty: 32,   unit: 'fl oz' },
    'vinegar':                      { qty: 16,   unit: 'fl oz' },
    'honey':                        { qty: 12,   unit: 'oz'    },  // standard 12 oz bear
    'maple syrup':                  { qty: 12,   unit: 'fl oz' },
    'peanut butter':                { qty: 16,   unit: 'oz'    },
    'almond butter':                { qty: 12,   unit: 'oz'    },
    'tahini':                       { qty: 11,   unit: 'oz'    },
    'miso':                         { qty: 17.6, unit: 'oz'    },
    'pickles':                      { qty: 16,   unit: 'fl oz' },
    'pesto':                        { qty: 6.5,  unit: 'oz'    },
    'basil pesto':                  { qty: 6.5,  unit: 'oz'    },
    'relish':                       { qty: 10,   unit: 'oz'    },
    'capers':                       { qty: 3.5,  unit: 'oz'    },
    'jam':                          { qty: 18,   unit: 'oz'    },
    'jelly':                        { qty: 18,   unit: 'oz'    },
    'gochujang':                    { qty: 7.5,  unit: 'oz'    },
    'harissa':                      { qty: 12,   unit: 'oz'    },
    'sun-dried tomatoes':           { qty: 8.5,  unit: 'oz'    },
    'guacamole':                    { qty: 8,    unit: 'oz'    },
    'cooking spray':                { qty: 1,    unit: 'count' },
    'lemon juice':                  { qty: 15,   unit: 'fl oz' },  // standard bottle
    'lime juice':                   { qty: 15,   unit: 'fl oz' },

    // ── Spices ───────────────────────────────────────────────
    // All default to 4 oz — the most common spice jar size
    'salt':                         { qty: 26,   unit: 'oz'    },  // 26 oz Morton canister
    'kosher salt':                  { qty: 48,   unit: 'oz'    },  // 3 lb Diamond Crystal box
    'sea salt':                     { qty: 4,    unit: 'oz'    },
    'black pepper':                 { qty: 4,    unit: 'oz'    },
    'white pepper':                 { qty: 4,    unit: 'oz'    },
    'garlic powder':                { qty: 4,    unit: 'oz'    },
    'onion powder':                 { qty: 4,    unit: 'oz'    },
    'paprika':                      { qty: 4,    unit: 'oz'    },
    'smoked paprika':               { qty: 4,    unit: 'oz'    },
    'cumin':                        { qty: 4,    unit: 'oz'    },
    'coriander':                    { qty: 4,    unit: 'oz'    },
    'cinnamon':                     { qty: 4,    unit: 'oz'    },
    'chili powder':                 { qty: 4,    unit: 'oz'    },
    'cayenne':                      { qty: 4,    unit: 'oz'    },
    'cayenne pepper':               { qty: 4,    unit: 'oz'    },
    'red pepper flakes':            { qty: 4,    unit: 'oz'    },
    'italian seasoning':            { qty: 4,    unit: 'oz'    },
    'dried oregano':                { qty: 4,    unit: 'oz'    },
    'oregano':                      { qty: 4,    unit: 'oz'    },
    'dried basil':                  { qty: 4,    unit: 'oz'    },
    'dried thyme':                  { qty: 4,    unit: 'oz'    },
    'thyme':                        { qty: 4,    unit: 'oz'    },
    'dried rosemary':               { qty: 4,    unit: 'oz'    },
    'rosemary':                     { qty: 4,    unit: 'oz'    },
    'dried parsley':                { qty: 4,    unit: 'oz'    },
    'bay leaves':                   { qty: 0.5,  unit: 'oz'    },  // small jar ~0.5 oz whole
    'turmeric':                     { qty: 4,    unit: 'oz'    },
    'garam masala':                 { qty: 4,    unit: 'oz'    },
    'curry powder':                 { qty: 4,    unit: 'oz'    },
    'taco seasoning':               { qty: 4,    unit: 'oz'    },
    'old bay':                      { qty: 6,    unit: 'oz'    },  // standard Old Bay tin
    'cajun seasoning':              { qty: 4,    unit: 'oz'    },
    'nutmeg':                       { qty: 2,    unit: 'oz'    },  // small jar
    'allspice':                     { qty: 4,    unit: 'oz'    },
    'cardamom':                     { qty: 4,    unit: 'oz'    },
    'cloves':                       { qty: 4,    unit: 'oz'    },
    'star anise':                   { qty: 1,    unit: 'oz'    },  // small bag/jar
    'fennel seeds':                 { qty: 4,    unit: 'oz'    },
    'mustard seeds':                { qty: 4,    unit: 'oz'    },
    'lemon pepper':                 { qty: 4,    unit: 'oz'    },
    'garlic salt':                  { qty: 4,    unit: 'oz'    },
    'everything bagel seasoning':   { qty: 4,    unit: 'oz'    },
    'ranch seasoning':              { qty: 4,    unit: 'oz'    },  // packet ≈ 1 oz; jar ≈ 4 oz
    'five spice':                   { qty: 4,    unit: 'oz'    },
    "za'atar":                      { qty: 4,    unit: 'oz'    },
    'sumac':                        { qty: 4,    unit: 'oz'    },
    'saffron':                      { qty: 0.06, unit: 'oz'    },  // 1.8 g (common small packet)
    'nutritional yeast':            { qty: 5,    unit: 'oz'    },

    // ── Baking ───────────────────────────────────────────────
    'sugar':                        { qty: 4,    unit: 'lb'    },  // 4 lb bag
    'white sugar':                  { qty: 4,    unit: 'lb'    },
    'brown sugar':                  { qty: 2,    unit: 'lb'    },
    'powdered sugar':               { qty: 2,    unit: 'lb'    },
    'confectioners sugar':          { qty: 2,    unit: 'lb'    },
    'baking powder':                { qty: 8.1,  unit: 'oz'    },  // Clabber Girl standard
    'baking soda':                  { qty: 16,   unit: 'oz'    },  // Arm & Hammer standard
    'vanilla extract':              { qty: 2,    unit: 'fl oz' },  // standard 2 fl oz bottle
    'almond extract':               { qty: 1,    unit: 'fl oz' },
    'chocolate chips':              { qty: 12,   unit: 'oz'    },  // standard 12 oz bag
    'cocoa powder':                 { qty: 8,    unit: 'oz'    },
    'cornstarch':                   { qty: 16,   unit: 'oz'    },
    'yeast':                        { qty: 0.75, unit: 'oz'    },  // 3-packet strip = 0.75 oz
    'active dry yeast':             { qty: 0.75, unit: 'oz'    },
    'instant yeast':                { qty: 0.75, unit: 'oz'    },
    'molasses':                     { qty: 12,   unit: 'fl oz' },
    'corn syrup':                   { qty: 16,   unit: 'fl oz' },
    'agave':                        { qty: 11.75,unit: 'fl oz' },
    'agave nectar':                 { qty: 11.75,unit: 'fl oz' },
    'shortening':                   { qty: 48,   unit: 'oz'    },  // standard Crisco can
    'almond flour':                 { qty: 16,   unit: 'oz'    },  // 1 lb bag
    'coconut flour':                { qty: 16,   unit: 'oz'    },
    'protein powder':               { qty: 2,    unit: 'lb'    },
    'cream of tartar':              { qty: 1.5,  unit: 'oz'    },
    'gelatin':                      { qty: 1,    unit: 'oz'    },  // 4-packet Knox box = 1 oz

    // ── Beverages ────────────────────────────────────────────
    'coffee':                       { qty: 12,   unit: 'oz'    },
    'instant coffee':               { qty: 8,    unit: 'oz'    },
    'tea':                          { qty: 1,    unit: 'box'   },
    'green tea':                    { qty: 1,    unit: 'box'   },
    'orange juice':                 { qty: 52,   unit: 'fl oz' },  // standard OJ carton
    'apple juice':                  { qty: 64,   unit: 'fl oz' },
    'cranberry juice':              { qty: 64,   unit: 'fl oz' },
    'grape juice':                  { qty: 64,   unit: 'fl oz' },
    'sparkling water':              { qty: 1,    unit: 'pkg'   },
    'soda':                         { qty: 1,    unit: 'bottle'},
    'beer':                         { qty: 1,    unit: 'pkg'   },
    'red wine':                     { qty: 25.4, unit: 'fl oz' },  // 750 ml bottle
    'white wine':                   { qty: 25.4, unit: 'fl oz' },
    'coconut water':                { qty: 16.9, unit: 'fl oz' },

    // ── Breakfast ────────────────────────────────────────────
    'cereal':                       { qty: 1,    unit: 'box'   },
    'oatmeal':                      { qty: 1,    unit: 'box'   },
    'instant oatmeal':              { qty: 1,    unit: 'box'   },
    'pancake mix':                  { qty: 32,   unit: 'oz'    },
    'waffle mix':                   { qty: 32,   unit: 'oz'    },
    'granola':                      { qty: 12,   unit: 'oz'    },
    'granola bars':                 { qty: 1,    unit: 'box'   },
    'bagels':                       { qty: 6,    unit: 'count' },
    'english muffins':              { qty: 6,    unit: 'count' },
    'pancake syrup':                { qty: 24,   unit: 'fl oz' },
    'breakfast sausage':            { qty: 1,    unit: 'lb'    },

    // ── Frozen ───────────────────────────────────────────────
    'frozen vegetables':            { qty: 1,    unit: 'bag'   },
    'frozen berries':               { qty: 12,   unit: 'oz'    },
    'frozen broccoli':              { qty: 12,   unit: 'oz'    },
    'frozen peas':                  { qty: 10,   unit: 'oz'    },
    'frozen corn':                  { qty: 12,   unit: 'oz'    },
    'frozen spinach':               { qty: 10,   unit: 'oz'    },
    'frozen chicken nuggets':       { qty: 1,    unit: 'bag'   },
    'frozen shrimp':                { qty: 1,    unit: 'lb'    },
    'frozen pizza':                 { qty: 1,    unit: 'count' },
    'ice cream sandwich':           { qty: 1,    unit: 'box'   },
    'popsicles':                    { qty: 1,    unit: 'box'   },
    'frozen waffles':               { qty: 1,    unit: 'box'   },
    'tater tots':                   { qty: 1,    unit: 'bag'   },
    'french fries':                 { qty: 1,    unit: 'bag'   },
    'frozen dumplings':             { qty: 1,    unit: 'bag'   },
    'hash browns':                  { qty: 1,    unit: 'bag'   },

    // ── Snacks ───────────────────────────────────────────────
    'almonds':                      { qty: 16,   unit: 'oz'    },
    'cashews':                      { qty: 10,   unit: 'oz'    },
    'peanuts':                      { qty: 16,   unit: 'oz'    },
    'walnuts':                      { qty: 8,    unit: 'oz'    },
    'pecans':                       { qty: 8,    unit: 'oz'    },
    'pistachios':                   { qty: 8,    unit: 'oz'    },
    'mixed nuts':                   { qty: 10,   unit: 'oz'    },
    'chips':                        { qty: 1,    unit: 'bag'   },
    'potato chips':                 { qty: 1,    unit: 'bag'   },
    'tortilla chips':               { qty: 1,    unit: 'bag'   },
    'popcorn':                      { qty: 1,    unit: 'bag'   },
    'pretzels':                     { qty: 1,    unit: 'bag'   },
    'trail mix':                    { qty: 10,   unit: 'oz'    },
    'raisins':                      { qty: 12,   unit: 'oz'    },
    'dried cranberries':            { qty: 12,   unit: 'oz'    },
    'date':                         { qty: 12,   unit: 'oz'    },  // standard 12 oz box
    'dates':                        { qty: 12,   unit: 'oz'    },
    'date fruit':                   { qty: 12,   unit: 'oz'    },
    'dried fruit':                  { qty: 1,    unit: 'bag'   },
    'protein bars':                 { qty: 1,    unit: 'box'   },
    'energy bars':                  { qty: 1,    unit: 'box'   },
    'rice cakes':                   { qty: 1,    unit: 'bag'   },
    'chia seeds':                   { qty: 12,   unit: 'oz'    },
    'flaxseeds':                    { qty: 16,   unit: 'oz'    },
    'sesame seeds':                 { qty: 4,    unit: 'oz'    },
    'sunflower seeds':              { qty: 8,    unit: 'oz'    },
    'pumpkin seeds':                { qty: 8,    unit: 'oz'    },
    'dark chocolate':               { qty: 3.5,  unit: 'oz'    },  // standard bar
    'chocolate bar':                { qty: 3.5,  unit: 'oz'    },
    'cookies':                      { qty: 1,    unit: 'pkg'   },
}

export function getIngredientDefault(name, category) {
    const key = name.trim().toLowerCase()
    if (ingredientDefaultsMap[key]) return { ...ingredientDefaultsMap[key] }
    return { ...(categoryDefaults[category] ?? { qty: 1, unit: 'count' }) }
}

const MEASURABLE_UNITS = new Set(['tsp','tbsp','cup','fl oz','pt','qt','gal','ml','L','oz','lb','g','kg'])
export function isMeasurableUnit(unit) {
    return MEASURABLE_UNITS.has(unit)
}

// Threshold mode: restock when qty drops below 25% of defaultQty, then add one container.
// Covers all weight/volume units, plus count items sold in large packages (eggs, buns, tortillas, etc.)
// where buying exactly the deficit makes no sense. Items with count + defaultQty < 6 use target/deficit mode.
export function isThresholdRestock(unit, defaultQty) {
    if (isMeasurableUnit(unit)) return true
    return unit === 'count' && defaultQty >= 6
}
