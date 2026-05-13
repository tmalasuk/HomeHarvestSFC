const VOLUME_TO_ML = {
    pinch: 0.308, dash: 0.616,
    tsp: 4.92892, tbsp: 14.7868, 'fl oz': 29.5735,
    cup: 236.588, pt: 473.176, qt: 946.353, gal: 3785.41,
    ml: 1, L: 1000,
}

const WEIGHT_TO_G = {
    oz: 28.3495, lb: 453.592, g: 1, kg: 1000,
}

// Average weight in lb for one individual item of produce sold by weight.
// Used to bridge count ↔ weight when a recipe counts items but pantry tracks by lb/oz.
const ITEM_WEIGHTS_LB = {
    'onion':          0.375,  // medium yellow onion ~6 oz
    'onions':         0.375,
    'yellow onion':   0.375,
    'white onion':    0.375,
    'red onion':      0.5,    // ~8 oz
    'red onions':     0.5,
    'apple':          0.375,  // medium apple ~6 oz
    'apples':         0.375,
    'banana':         0.25,   // peeled ~4 oz
    'bananas':        0.25,
    'potato':              0.33,   // medium russet ~5.3 oz
    'potatoes':            0.33,
    'russet potato':       0.33,
    'russet potatoes':     0.33,
    'red potato':          0.25,   // smaller ~4 oz
    'red potatoes':        0.25,
    'yukon gold potato':   0.33,
    'yukon gold potatoes': 0.33,
    'gold potato':         0.33,
    'gold potatoes':       0.33,
    'fingerling potato':   0.1,    // small ~1.6 oz each
    'fingerling potatoes': 0.1,
    'sweet potato':        0.375,  // medium ~6 oz
    'sweet potatoes':      0.375,
    'tomato':         0.25,   // medium round ~4 oz
    'tomatoes':       0.25,
    'lemon':          0.22,   // ~3.5 oz
    'lemons':         0.22,
    'lime':           0.16,   // ~2.5 oz
    'limes':          0.16,
    'orange':         0.31,   // ~5 oz
    'oranges':        0.31,
    'avocado':        0.31,   // medium Hass ~5 oz
    'avocados':       0.31,
    'mango':          0.56,   // ~9 oz
    'mangoes':        0.56,
    'carrot':         0.16,   // medium ~2.5 oz
    'carrots':        0.16,
    'cucumber':       0.5,    // medium ~8 oz
    'cucumbers':      0.5,
    'zucchini':       0.44,   // medium ~7 oz
    'zucchinis':      0.44,
    'bell pepper':          0.31,   // medium ~5 oz
    'bell peppers':         0.31,
    'red bell pepper':      0.31,
    'red bell peppers':     0.31,
    'yellow bell pepper':   0.31,
    'yellow bell peppers':  0.31,
    'orange bell pepper':   0.31,
    'orange bell peppers':  0.31,
    'red pepper':           0.31,
    'yellow pepper':        0.31,
    'green pepper':         0.31,
    'jalapeño':       0.03,   // ~0.5 oz
    'jalapeno':       0.03,
    'shallot':        0.13,   // ~2 oz
    'shallots':       0.13,
    'broccoli':       0.75,   // 1 head ~12 oz
    'cauliflower':    2.0,    // 1 head ~2 lb
    'pineapple':      2.0,    // whole ~2 lb trimmed
    'ginger':         0.25,   // ~4 oz knob
    'ginger root':    0.25,
    'beet':           0.31,
    'beets':          0.31,
    'turnip':         0.5,
    'eggplant':       0.875,  // medium ~14 oz

    // ── Poultry (per piece) ───────────────────────────────────
    'chicken breast':         0.44,   // boneless skinless half breast ~7 oz
    'chicken breasts':        0.44,
    'chicken breast half':    0.5,    // bone-in adds weight ~8 oz
    'chicken breast halves':  0.5,
    'chicken thigh':          0.31,   // bone-in thigh ~5 oz
    'chicken thighs':         0.31,
    'chicken drumstick':      0.25,   // ~4 oz
    'chicken drumsticks':     0.25,
    'chicken leg':            0.5,    // full leg (thigh + drum) ~8 oz
    'chicken legs':           0.5,
    'chicken wing':           0.19,   // ~3 oz
    'chicken wings':          0.19,
    'chicken tender':         0.125,  // ~2 oz each
    'chicken tenders':        0.125,

    // ── Pork (per piece) ─────────────────────────────────────
    'pork chop':              0.5,    // medium chop ~8 oz
    'pork chops':             0.5,

    // ── Fish (per fillet) ────────────────────────────────────
    'salmon':                 0.5,    // typical fillet ~8 oz
    'salmon fillet':          0.5,
    'tilapia':                0.375,  // thin fillet ~6 oz
    'tilapia fillet':         0.375,
    'cod fillet':             0.5,
    'shrimp':                 0.0625, // medium shrimp ~1 oz each

    // ── Pantry staples sold by weight but used by count ───────
    'bouillon cube':          0.009,  // standard cube ~4g
    'bouillon cubes':         0.009,
    'chicken bouillon cube':  0.009,
    'chicken bouillon cubes': 0.009,
    'beef bouillon cube':     0.009,
    'beef bouillon cubes':    0.009,
    'vegetable bouillon cube':0.009,
}

// Approximate cups of usable leaves/pieces yielded by one bunch.
// Used to bridge bunch ↔ volume for fresh herbs and leafy produce.
const BUNCH_CUPS = {
    'cilantro':      1.5,   // loosely packed leaves
    'parsley':       1.0,
    'basil':         1.5,
    'mint':          1.0,
    'dill':          1.0,
    'chives':        0.75,
    'thyme':         0.25,  // woody stems, much less usable leaf
    'rosemary':      0.25,
    'oregano':       0.5,
    'sage':          0.5,
    'tarragon':      0.5,
    'green onion':   1.0,   // chopped
    'green onions':  1.0,
    'scallion':      1.0,
    'scallions':     1.0,
    'kale':          4.0,   // chopped and packed
    'spinach':       4.0,   // loosely packed
    'mixed greens':  4.0,
    'arugula':       4.0,
    'asparagus':     2.0,   // chopped spears from 1 lb bunch
    'celery':        3.0,   // sliced from 1 bunch
}

// Approximate individual leaves per one grocery-store bunch.
// Used to bridge count (leaves) ↔ bunch when a recipe measures by leaf.
const LEAVES_PER_BUNCH = {
    'basil':    40,   // standard bunch ~1 oz, leaves average ~0.5 g each
    'sage':     20,   // large leaves, fewer per bunch
    'mint':     50,   // small leaves, many per bunch
    'cilantro': 80,   // tiny leaves; a bunch yields a lot
    'parsley':  60,
    'dill':     60,
    'tarragon': 50,
}

// How many individual pieces are in one "head" of a given ingredient.
const HEAD_COUNTS = {
    'garlic':       10,   // ~10–12 cloves per head; 10 is the standard culinary estimate
    'garlic clove': 10,
    'garlic cloves':10,
}

// Volume in ml of one clove when minced/pressed.
// Lets us bridge volume (tsp/tbsp) ↔ head by chaining through clove count.
const CLOVE_VOLUME_ML = {
    'garlic':        4.93,  // 1 clove minced ≈ 1 tsp
    'garlic clove':  4.93,
    'garlic cloves': 4.93,
}

// How many individual items are in one "pkg" for packaged countable goods.
// Used to bridge pkg ↔ count when a recipe calls by piece and pantry tracks by package.
const PACKAGE_COUNTS = {
    'tortillas':            10,   // standard flour tortilla pack (8" size)
    'flour tortillas':      10,
    'corn tortillas':       24,   // corn tortillas typically come in 24-count
    'hamburger buns':        8,
    'hot dog buns':          8,
    'english muffins':       6,
    'bagels':                6,
    'pita bread':            6,
    'naan':                  4,
    'hot dogs':              8,   // standard pack (Nathan's, Ball Park, etc.)
    'breakfast sausage':     8,   // links per pkg
    'bacon':                16,   // approximate strips per lb pkg
    'frozen waffles':        8,
    'frozen dumplings':     16,
    'egg':                  12,
    'eggs':                 12,

    // Bread — slices per loaf
    'bread':                20,
    'white bread':          20,
    'sandwich bread':       20,
    'wheat bread':          20,
    'whole wheat bread':    20,
    'multigrain bread':     20,
    'sourdough':            24,
    'sourdough bread':      24,
    'rye bread':            16,
    'pumpernickel':         16,
    'pumpernickel bread':   16,
    'brioche':              12,   // brioche loaves are thicker-sliced
}

// Canonical aliases — covers plural/abbreviated/written-out variants
const ALIASES = {
    lbs: 'lb', pound: 'lb', pounds: 'lb',
    ounce: 'oz', ounces: 'oz', ozs: 'oz',
    gram: 'g', grams: 'g',
    kilogram: 'kg', kilograms: 'kg',
    teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp',
    tablespoon: 'tbsp', tablespoons: 'tbsp', tbsps: 'tbsp',
    cups: 'cup',
    pint: 'pt', pints: 'pt',
    quart: 'qt', quarts: 'qt',
    gallon: 'gal', gallons: 'gal',
    liter: 'L', liters: 'L', litre: 'L', litres: 'L',
    milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
    'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
    whole: 'count', wholes: 'count',
    small: 'count', medium: 'count', large: 'count',
    piece: 'count', pieces: 'count',
    item: 'count', items: 'count',
    slice: 'count', slices: 'count',
    sprig: 'count', sprigs: 'count',
    stalk: 'count', stalks: 'count',
    leaf: 'count', leaves: 'count',
    cube: 'count', cubes: 'count',
    cloves: 'clove',   // normalize plural only — clove is NOT count
}

// Density in g/ml (from USDA data & culinary standards).
// Used to bridge volume ↔ weight conversions when units are cross-family.
// Values are intentional estimates — accuracy beats exactness here.
const DENSITY_G_PER_ML = {
    // ── Spices (ground/dried) ────────────────────────────────
    'salt':                     1.22,
    'kosher salt':              0.58,   // Diamond Crystal is much lighter than table salt
    'sea salt':                 1.15,
    'black pepper':             0.47,
    'white pepper':             0.50,
    'garlic powder':            0.51,
    'onion powder':             0.47,
    'paprika':                  0.48,
    'smoked paprika':           0.48,
    'cumin':                    0.44,
    'coriander':                0.38,
    'cinnamon':                 0.56,
    'chili powder':             0.44,
    'cayenne':                  0.35,
    'cayenne pepper':           0.35,
    'red pepper flakes':        0.30,   // whole flakes are light/airy
    'turmeric':                 0.50,
    'garam masala':             0.44,
    'curry powder':             0.44,
    'taco seasoning':           0.44,
    'cajun seasoning':          0.44,
    'italian seasoning':        0.25,   // dried herbs are very light
    'dried oregano':            0.25,
    'oregano':                  0.25,
    'dried basil':              0.20,
    'dried thyme':              0.33,
    'thyme':                    0.33,
    'dried rosemary':           0.25,
    'rosemary':                 0.25,
    'dried parsley':            0.20,
    'nutmeg':                   0.50,
    'allspice':                 0.42,
    'cardamom':                 0.40,
    'cloves':                   0.44,
    'fennel seeds':             0.44,
    'mustard seeds':            0.80,
    'five spice':               0.44,
    "za'atar":                  0.33,
    'sumac':                    0.44,
    'lemon pepper':             0.44,
    'garlic salt':              0.94,
    'old bay':                  0.44,
    'everything bagel seasoning': 0.60,
    'ranch seasoning':          0.50,
    'saffron':                  0.18,   // extremely light

    // ── Baking ───────────────────────────────────────────────
    'flour':                    0.53,   // 1 cup AP flour ≈ 125 g
    'all-purpose flour':        0.53,
    'whole wheat flour':        0.56,
    'bread flour':              0.53,
    'almond flour':             0.38,
    'coconut flour':            0.42,
    'cornmeal':                 0.63,
    'sugar':                    0.85,   // 1 cup granulated ≈ 200 g
    'white sugar':              0.85,
    'brown sugar':              0.88,   // packed
    'powdered sugar':           0.56,
    'confectioners sugar':      0.56,
    'baking powder':            0.92,
    'baking soda':              1.15,
    'cornstarch':               0.64,
    'cocoa powder':             0.40,
    'cream of tartar':          1.02,
    'yeast':                    0.75,
    'active dry yeast':         0.75,
    'instant yeast':            0.75,
    'gelatin':                  0.70,
    'protein powder':           0.45,
    'nutritional yeast':        0.35,
    'chocolate chips':          0.70,

    // ── Dairy ────────────────────────────────────────────────
    'butter':                   0.91,   // 1 tbsp butter ≈ 14 g
    'milk':                     1.03,
    'whole milk':               1.03,
    '2% milk':                  1.03,
    'skim milk':                1.03,
    'almond milk':              1.01,
    'oat milk':                 1.03,
    'soy milk':                 1.04,
    'coconut milk':             0.98,
    'heavy cream':              1.01,
    'heavy whipping cream':     1.01,
    'whipping cream':           1.01,
    'half and half':            1.02,
    'half-and-half':            1.02,
    'buttermilk':               1.03,
    'cream':                    1.01,
    'sour cream':               1.01,
    'yogurt':                   1.05,
    'greek yogurt':             1.08,
    'plain yogurt':             1.05,
    'cottage cheese':           0.97,
    'ricotta':                  1.04,
    'ricotta cheese':           1.04,
    'ghee':                     0.91,

    // ── Shredded / grated cheeses ─────────────────────────────
    // These are much lighter than soft cheeses — 1 cup grated parmesan ≈ 3.5 oz
    'parmesan':                 0.35,
    'parmesan cheese':          0.35,
    'grated parmesan':          0.35,
    'shredded parmesan':        0.36,
    'pecorino':                 0.35,
    'pecorino romano':          0.35,
    'romano':                   0.35,
    'cheddar':                  0.45,
    'cheddar cheese':           0.45,
    'shredded cheddar':         0.45,
    'mozzarella':               0.45,
    'mozzarella cheese':        0.45,
    'shredded mozzarella':      0.45,
    'gruyere':                  0.40,
    'swiss cheese':             0.43,
    'monterey jack':            0.45,
    'colby jack':               0.45,
    'mexican cheese blend':     0.45,
    'shredded cheese':          0.45,
    'feta':                     0.55,   // crumbled feta is denser
    'feta cheese':              0.55,
    'crumbled feta':            0.55,
    'goat cheese':              0.55,
    'blue cheese':              0.50,
    'crumbled blue cheese':     0.50,

    // ── Oils & liquid condiments ─────────────────────────────
    'olive oil':                0.91,
    'extra virgin olive oil':   0.91,
    'vegetable oil':            0.92,
    'canola oil':               0.92,
    'avocado oil':              0.91,
    'coconut oil':              0.92,
    'sesame oil':               0.92,
    'grapeseed oil':            0.92,
    'peanut oil':               0.92,
    'oil':                      0.92,
    'soy sauce':                1.12,
    'tamari':                   1.12,
    'coconut aminos':           1.10,
    'fish sauce':               1.07,
    'oyster sauce':             1.20,
    'hoisin sauce':             1.24,
    'teriyaki sauce':           1.14,
    'worcestershire sauce':     1.09,
    'hot sauce':                1.02,
    'sriracha':                 1.10,
    'buffalo sauce':            1.05,
    'ketchup':                  1.18,
    'honey':                    1.42,
    'maple syrup':              1.32,
    'molasses':                 1.46,
    'corn syrup':               1.38,
    'agave':                    1.34,
    'agave nectar':             1.34,
    'balsamic vinegar':         1.10,
    'balsamic vinaigrette':     1.05,
    'apple cider vinegar':      1.01,
    'red wine vinegar':         1.01,
    'white wine vinegar':       1.01,
    'rice vinegar':             1.01,
    'white vinegar':            1.01,
    'vinegar':                  1.01,
    'lemon juice':              1.05,
    'lime juice':               1.05,
    'ranch dressing':           1.02,
    'italian dressing':         1.01,
    'caesar dressing':          1.05,
    'bbq sauce':                1.15,
    'pesto':                    1.05,
    'basil pesto':              1.05,
    'tahini':                   1.00,
    'peanut butter':            1.06,
    'almond butter':            1.05,
    'miso':                     1.04,
    'tomato paste':             1.04,
    'salsa':                    1.02,
    'pico de gallo':            1.02,
    'mayonnaise':               0.91,   // oil-based emulsion, lighter than water
    'mayo':                     0.91,
    'mustard':                  1.07,
    'dijon mustard':            1.09,
    'yellow mustard':           1.07,
    'whole grain mustard':      1.07,
    'relish':                   1.10,
    'guacamole':                1.00,
    'gochujang':                1.30,
    'harissa':                  1.05,
    'jam':                      1.30,   // high sugar content
    'jelly':                    1.30,
    'marmalade':                1.30,
    'cream cheese':             1.02,
    'sour cream':               1.01,
    'capers':                   1.01,   // brined, close to water density
    'sun-dried tomatoes':       0.85,   // oil-packed, semi-dry
    'enchilada sauce':          1.05,
    'coconut cream':            0.96,
    'applesauce':               1.08,
    'apple sauce':              1.08,
    'pasta sauce':              1.05,
    'marinara sauce':           1.05,
    'spaghetti sauce':          1.05,
    'tomato sauce':             1.04,
    'tomato puree':             1.04,
    'crushed tomatoes':         1.04,
    'diced tomatoes':           1.04,

    // ── Chopped / diced produce ──────────────────────────────
    // Densities for common produce measured by volume in recipes but bought by weight.
    'onion':            0.64,   // 1 cup diced ≈ 160 g
    'onions':           0.64,
    'yellow onion':     0.64,
    'white onion':      0.64,
    'red onion':        0.64,
    'shallot':          0.65,
    'shallots':         0.65,
    'garlic':           0.60,   // minced
    'tomato':           0.65,   // chopped
    'tomatoes':         0.65,
    'cherry tomatoes':  0.65,
    'bell pepper':      0.70,   // diced
    'red bell pepper':  0.70,
    'green bell pepper':0.70,
    'yellow bell pepper':0.70,
    'jalapeño':         0.65,
    'jalapeno':         0.65,
    'carrot':           0.65,   // sliced/diced
    'carrots':          0.65,
    'celery':           0.50,   // chopped (airy)
    'mushroom':         0.45,   // sliced (very airy)
    'mushrooms':        0.45,
    'zucchini':         0.60,   // diced
    'cucumber':         0.65,
    'potato':           0.70,   // cubed
    'potatoes':         0.70,
    'broccoli':         0.35,   // florets (very airy)
    'cauliflower':      0.35,
    'spinach':          0.15,   // raw leaves are extremely airy (1 cup ≈ 30 g)
    'kale':             0.18,

    // ── Grains (dry) ─────────────────────────────────────────
    'rice':                     0.75,
    'white rice':               0.75,
    'brown rice':               0.78,
    'jasmine rice':             0.75,
    'basmati rice':             0.75,
    'oats':                     0.37,
    'rolled oats':              0.37,
    'steel cut oats':           0.82,
    'quinoa':                   0.68,
    'couscous':                 0.68,
    'farro':                    0.82,
    'barley':                   0.75,
    'lentils':                  0.80,
    'bread crumbs':             0.34,
    'breadcrumbs':              0.34,
    'panko':                    0.30,
    'panko breadcrumbs':        0.30,

    // ── Nuts & seeds ─────────────────────────────────────────
    'almonds':                  0.60,
    'cashews':                  0.65,
    'peanuts':                  0.62,
    'walnuts':                  0.53,
    'pecans':                   0.47,
    'pistachios':               0.55,
    'mixed nuts':               0.55,
    'chia seeds':               0.72,
    'flaxseeds':                0.75,
    'sesame seeds':             0.60,
    'sunflower seeds':          0.53,
    'pumpkin seeds':            0.55,
    'raisins':                  0.80,
    'dried cranberries':        0.75,

    // ── Liquids (general) ────────────────────────────────────
    'chicken broth':            1.01,
    'chicken stock':            1.01,
    'beef broth':               1.01,
    'beef stock':               1.01,
    'vegetable broth':          1.01,
    'vegetable stock':          1.01,
    'bone broth':               1.01,
    'red wine':                 0.99,
    'white wine':               0.99,
    'orange juice':             1.04,
    'apple juice':              1.05,
    'lemon juice':              1.05,
}

// Fallback densities by rough category when ingredient not in the table above
const DENSITY_FALLBACKS = [
    { test: /oil$/i,                          density: 0.92  },
    { test: /vinegar$/i,                      density: 1.01  },
    { test: /sauce$/i,                        density: 1.10  },
    { test: /syrup$/i,                        density: 1.30  },
    { test: /butter$/i,                       density: 0.90  },
    { test: /milk$/i,                         density: 1.03  },
    { test: /cream$/i,                        density: 1.01  },
    { test: /broth|stock$/i,                  density: 1.01  },
    { test: /juice$/i,                        density: 1.04  },
    { test: /flour$/i,                        density: 0.53  },
    { test: /sugar$/i,                        density: 0.85  },
    { test: /yeast/i,                          density: 0.75  },
    { test: /powder|ground|dried|seasoning/i, density: 0.50  },
    { test: /seed$/i,                         density: 0.65  },
    { test: /nut|nuts$/i,                       density: 0.55  },
    { test: /shredded|grated/i,                 density: 0.45  }, // shredded/grated solids
    { test: /cheese$/i,                         density: 0.45  }, // unknown cheese → shredded default
    { test: /mustard/i,                       density: 1.07  },
    { test: /dressing$/i,                     density: 1.02  },
    { test: /jam|jelly|preserve/i,            density: 1.30  },
    { test: /mayo|mayonnaise/i,               density: 0.91  },
    { test: /sauce$/i,                        density: 1.08  },
    { test: /paste$/i,                        density: 1.05  },
    { test: /puree$/i,                        density: 1.04  },
]

// Returns the density in g/ml for the given ingredient, or null if unknown
function getDensity(ingredientName) {
    if (!ingredientName) return null
    const key = ingredientName.trim().toLowerCase()
    if (DENSITY_G_PER_ML[key] != null) return DENSITY_G_PER_ML[key]
    for (const { test, density } of DENSITY_FALLBACKS) {
        if (test.test(key)) return density
    }
    return null
}

// Normalizes a unit string by expanding plural/abbreviated forms to canonical form
function normalize(unit) {
    const u = (unit || '').trim().toLowerCase()
    return ALIASES[u] ?? unit.trim()
}

/**
 * Convert qty from one unit to another.
 * Pass ingredientName to enable cross-family volume ↔ weight estimation via density.
 * Returns null if units are incompatible and no density estimate is available.
 * An empty/null fromUnit is treated as identical to toUnit (direct 1:1).
 */
export function convertUnit(qty, fromUnit, toUnit, ingredientName = '') {
    const from = normalize(fromUnit)
    const to   = normalize(toUnit)
    if (!from || from === to) return qty

    // Discrete: dozen ↔ count (always 12, no ingredient lookup needed)
    if (from === 'dozen' && to === 'count') return qty * 12
    if (from === 'count' && to === 'dozen') return qty / 12

    // Discrete: pkg/loaf ↔ count using ingredient-specific package sizes
    if (from === 'pkg' || to === 'pkg' || from === 'loaf' || to === 'loaf') {
        const key  = (ingredientName || '').trim().toLowerCase()
        const size = PACKAGE_COUNTS[key]
        if (size == null) return null
        const isPkg = (u) => u === 'pkg' || u === 'loaf'
        if (isPkg(from) && to === 'count') return qty * size
        if (from === 'count' && isPkg(to)) return qty / size
    }

    // Discrete: head ↔ clove/volume for garlic-like ingredients
    if (from === 'head' || to === 'head') {
        const key  = (ingredientName || '').trim().toLowerCase()
        const size = HEAD_COUNTS[key]
        if (size == null) return null
        if (from === 'head' && to === 'clove') return qty * size
        if (from === 'clove' && to === 'head') return qty / size
        // head ↔ volume: chain through per-clove volume (e.g. 1 garlic clove ≈ 1 tsp)
        const mlPerClove = CLOVE_VOLUME_ML[key]
        if (mlPerClove != null) {
            if (VOLUME_TO_ML[from] != null && to === 'head')
                return (qty * VOLUME_TO_ML[from]) / (size * mlPerClove)
            if (from === 'head' && VOLUME_TO_ML[to] != null)
                return (qty * size * mlPerClove) / VOLUME_TO_ML[to]
        }
    }

    // Same-family: volume ↔ volume
    if (VOLUME_TO_ML[from] != null && VOLUME_TO_ML[to] != null)
        return qty * VOLUME_TO_ML[from] / VOLUME_TO_ML[to]

    // Same-family: weight ↔ weight
    if (WEIGHT_TO_G[from] != null && WEIGHT_TO_G[to] != null)
        return qty * WEIGHT_TO_G[from] / WEIGHT_TO_G[to]

    // Discrete: bunch ↔ volume/count for fresh herbs
    if (from === 'bunch' || to === 'bunch') {
        const key = (ingredientName || '').trim().toLowerCase()
        // bunch ↔ count (leaves) via per-herb leaf count
        const leavesPerBunch = LEAVES_PER_BUNCH[key]
        if (leavesPerBunch != null) {
            if (from === 'bunch' && to === 'count') return qty * leavesPerBunch
            if (from === 'count' && to === 'bunch') return qty / leavesPerBunch
        }
        // bunch ↔ volume via cup yield
        const cups = BUNCH_CUPS[key]
        if (cups != null) {
            const mlPerBunch = cups * VOLUME_TO_ML['cup']
            if (from === 'bunch' && VOLUME_TO_ML[to] != null)
                return (qty * mlPerBunch) / VOLUME_TO_ML[to]
            if (VOLUME_TO_ML[from] != null && to === 'bunch')
                return (qty * VOLUME_TO_ML[from]) / mlPerBunch
        }
    }

    // Cross-family: count ↔ weight/volume using per-item weights or bunch yields
    if (from === 'count' || to === 'count') {
        const key      = (ingredientName || '').trim().toLowerCase()
        const weightLb = ITEM_WEIGHTS_LB[key]
        if (weightLb != null) {
            const weightG = weightLb * WEIGHT_TO_G['lb']
            if (from === 'count' && WEIGHT_TO_G[to] != null)
                return (qty * weightG) / WEIGHT_TO_G[to]
            if (WEIGHT_TO_G[from] != null && to === 'count')
                return (qty * WEIGHT_TO_G[from]) / weightG
        }
        // Herbs/greens stored as count (1 count = 1 bunch) — bridge to volume via BUNCH_CUPS
        const cups = BUNCH_CUPS[key]
        if (cups != null) {
            const mlPerCount = cups * VOLUME_TO_ML['cup']
            if (from === 'count' && VOLUME_TO_ML[to] != null)
                return (qty * mlPerCount) / VOLUME_TO_ML[to]
            if (VOLUME_TO_ML[from] != null && to === 'count')
                return (qty * VOLUME_TO_ML[from]) / mlPerCount
        }
    }

    // Cross-family: volume → weight  (e.g. tsp cumin → oz)
    if (VOLUME_TO_ML[from] != null && WEIGHT_TO_G[to] != null) {
        const density = getDensity(ingredientName)
        if (density == null) return null
        const grams = qty * VOLUME_TO_ML[from] * density
        return grams / WEIGHT_TO_G[to]
    }

    // Cross-family: weight → volume  (e.g. oz cumin → tsp)
    if (WEIGHT_TO_G[from] != null && VOLUME_TO_ML[to] != null) {
        const density = getDensity(ingredientName)
        if (density == null) return null
        const ml = qty * WEIGHT_TO_G[from] / density
        return ml / VOLUME_TO_ML[to]
    }

    return null
}

// Maps non-purchasable recipe ingredient forms to the product you actually buy.
// Used in both the make-recipe receipt and the "add to grocery list" flow.
export const INGREDIENT_SUBSTITUTES = {
    'egg yolk':   'eggs',
    'egg yolks':  'eggs',
    'egg white':  'eggs',
    'egg whites': 'eggs',
}

// Formats a quantity number for display, trimming trailing zeros, or '—' if invalid
export function fmtQty(n) {
    if (n == null || isNaN(n)) return '—'
    return parseFloat(n.toFixed(2)).toString()
}

// Round a stored pantry quantity to 2 decimal places to avoid floating-point noise.
export function roundQty(n) {
    if (n == null || isNaN(n)) return n
    return parseFloat(n.toFixed(2))
}

/**
 * Strip cooking descriptors from a recipe ingredient name so it can fuzzy-match
 * a pantry item. e.g. "skinless chicken breast halves with ribs" → "chicken breast"
 */
export function normalizeIngredientName(name) {
    return (name || '')
        .toLowerCase()
        .replace(/\s+with(out)?\b.*/i, '')       // drop "with ribs", "without skin", etc.
        .replace(/\bflat[- ]leaf\b\s*/gi, '')    // "flat-leaf parsley" → "parsley"
        .replace(/\bextra[- ]/gi, '')
        .replace(/\b(skinless|boneless|bone-in|bone in|skin-on|skin on|halved?|halves|quartered?|sliced|diced|chopped|minced|shredded|grated|crumbled|cooked|uncooked|raw|fresh|frozen|canned|dried|dehydrated|organic|natural|lean|thinly|finely|roughly|coarsely|lightly|heavily|large|medium|small|jumbo|mini|leaves?|leaf)\b\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
}
