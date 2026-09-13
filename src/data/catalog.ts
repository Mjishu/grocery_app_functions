import { Recipe } from "../domain/models";

const publishedAt = "2026-09-11T00:00:00.000Z";
const attribution = "Estimated from reviewed ingredient mappings derived from USDA FoodData Central data.";

export const recipes: Recipe[] = [
  {
    id: "taco-bowls", slug: "taco-bowls", title: "Smoky taco bowls", tagline: "Big flavor, one pan, zero stress.",
    image: { url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80", alt: "A colorful grain bowl with vegetables" },
    timeMinutes: 25, cost: "$$", difficulty: "Easy", defaultServings: 4,
    tags: ["One pan", "High protein", "Dinner"], cuisines: ["Mexican-inspired"], equipment: ["Stovetop"],
    allergens: [], allergenReviewStatus: "reviewed",
    ingredients: [
      { id: "chicken", name: "Chicken breast", amount: "1 lb", metricAmount: "454 g", canonicalQuantity: { amount: 454, unit: "g" }, category: "Protein", calories: 748 },
      { id: "rice", name: "Long-grain rice", amount: "1 cup", metricAmount: "185 g", canonicalQuantity: { amount: 185, unit: "g" }, category: "Pantry", calories: 675 },
      { id: "beans", name: "Black beans", amount: "1 can", metricAmount: "425 g can", canonicalQuantity: { amount: 425, unit: "g" }, category: "Pantry", calories: 350 },
      { id: "avocado", name: "Avocado", amount: "1", metricAmount: "1", canonicalQuantity: { amount: 1, unit: "each" }, category: "Produce", calories: 240 },
      { id: "lime", name: "Limes", amount: "2", metricAmount: "2", canonicalQuantity: { amount: 2, unit: "each" }, category: "Produce", calories: 40 },
    ],
    steps: [
      { id: "1", instruction: "Rinse the rice and cook it with 2 cups of water." },
      { id: "2", instruction: "Dice and season the chicken with paprika, cumin, salt, and pepper." },
      { id: "3", instruction: "Cook the chicken in a hot oiled pan for 6–8 minutes.", timerSeconds: 360 },
      { id: "4", instruction: "Warm the beans and slice the avocado and limes." },
      { id: "5", instruction: "Build each bowl and finish with a squeeze of lime." },
    ],
    safety: ["Wash hands and surfaces after handling raw chicken.", "Cook chicken to 165°F in the thickest piece."],
    nutrition: { status: "complete", perServing: { calories: 513, proteinGrams: 46, carbohydrateGrams: 71, fatGrams: 18 }, attribution },
    provenance: { type: "original" }, revision: 1, publishedAt,
  },
  {
    id: "lemon-pasta", slug: "lemon-pasta", title: "Bright lemon pasta", tagline: "Silky, sunny, and ready in twenty.",
    image: { url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80", alt: "Pasta with lemon and greens" },
    timeMinutes: 20, cost: "$", difficulty: "Very easy", defaultServings: 4,
    tags: ["Vegetarian", "5 ingredients", "Dinner"], cuisines: ["Italian-inspired"], equipment: ["Stovetop"],
    allergens: ["Milk", "Wheat"], allergenReviewStatus: "reviewed",
    ingredients: [
      { id: "pasta", name: "Spaghetti", amount: "12 oz", metricAmount: "340 g", canonicalQuantity: { amount: 340, unit: "g" }, category: "Pantry", calories: 1260 },
      { id: "lemon", name: "Lemons", amount: "2", metricAmount: "2", canonicalQuantity: { amount: 2, unit: "each" }, category: "Produce", calories: 34 },
      { id: "parmesan", name: "Parmesan", amount: "3 oz", metricAmount: "85 g", canonicalQuantity: { amount: 85, unit: "g" }, category: "Dairy", calories: 330 },
      { id: "butter", name: "Butter", amount: "3 tbsp", metricAmount: "42 g", canonicalQuantity: { amount: 42, unit: "g" }, category: "Dairy", calories: 306 },
      { id: "spinach", name: "Baby spinach", amount: "5 oz", metricAmount: "142 g", canonicalQuantity: { amount: 142, unit: "g" }, category: "Produce", calories: 35 },
    ],
    steps: [
      { id: "1", instruction: "Boil salted water and cook the pasta until just tender." },
      { id: "2", instruction: "Zest and juice the lemons, then grate the Parmesan." },
      { id: "3", instruction: "Save 1 cup pasta water and drain." },
      { id: "4", instruction: "Toss pasta with butter, lemon, spinach, and a splash of pasta water." },
      { id: "5", instruction: "Stir in Parmesan off the heat and season to taste." },
    ],
    safety: [],
    nutrition: { status: "complete", perServing: { calories: 491, proteinGrams: 24, carbohydrateGrams: 91, fatGrams: 24 }, attribution },
    provenance: { type: "original" }, revision: 1, publishedAt,
  },
  {
    id: "overnight-oats", slug: "overnight-oats", title: "Berry overnight oats", tagline: "Tomorrow morning just got much easier.",
    image: { url: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1200&q=80", alt: "Oats topped with fresh berries" },
    timeMinutes: 10, cost: "$", difficulty: "Very easy", defaultServings: 4,
    tags: ["Breakfast", "No cook"], cuisines: ["American"], equipment: [],
    allergens: ["Milk"], allergenReviewStatus: "reviewed",
    ingredients: [
      { id: "oats", name: "Rolled oats", amount: "2 cups", metricAmount: "180 g", canonicalQuantity: { amount: 180, unit: "g" }, category: "Pantry", calories: 700 },
      { id: "milk", name: "Milk", amount: "2 cups", metricAmount: "475 ml", canonicalQuantity: { amount: 475, unit: "ml" }, category: "Dairy", calories: 244 },
      { id: "yogurt", name: "Greek yogurt", amount: "1 cup", metricAmount: "245 g", canonicalQuantity: { amount: 245, unit: "g" }, category: "Dairy", calories: 150 },
      { id: "berries", name: "Mixed berries", amount: "2 cups", metricAmount: "280 g", canonicalQuantity: { amount: 280, unit: "g" }, category: "Produce", calories: 140 },
    ],
    steps: [
      { id: "1", instruction: "Stir the oats, milk, and yogurt together in a covered container." },
      { id: "2", instruction: "Fold in half the berries and refrigerate overnight." },
      { id: "3", instruction: "Top with the remaining berries and serve cold." },
    ],
    safety: ["Refrigerate promptly and eat within three days."],
    nutrition: { status: "complete", perServing: { calories: 309, proteinGrams: 22, carbohydrateGrams: 68, fatGrams: 9 }, attribution },
    provenance: { type: "original" }, revision: 1, publishedAt,
  },
];

export const collections = [
  {
    slug: "beginner-dinners",
    title: "Beginner dinners under 30 minutes",
    description: "Low-pressure recipes for nights when you want real food without a project.",
    recipeIds: ["taco-bowls", "lemon-pasta"],
  },
];
