export const majorAllergens = [
  "Milk", "Egg", "Fish", "Shellfish", "Tree nuts", "Peanuts", "Wheat", "Soy", "Sesame",
] as const;

export type Allergen = (typeof majorAllergens)[number];
export type AllergenReviewStatus = "reviewed" | "unknown";
export type GroceryCategory = "Produce" | "Protein" | "Dairy" | "Pantry";

export type Ingredient = {
  id: string;
  name: string;
  amount: string;
  metricAmount: string;
  canonicalQuantity?: { amount: number; unit: "g" | "ml" | "each" };
  category: GroceryCategory;
  calories: number | null;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  image: { url: string; alt: string; position?: string };
  timeMinutes: number;
  cost: "$" | "$$" | "$$$";
  difficulty: "Very easy" | "Easy";
  defaultServings: number;
  tags: string[];
  cuisines: string[];
  equipment: string[];
  allergens: Allergen[];
  allergenReviewStatus: AllergenReviewStatus;
  ingredients: Ingredient[];
  steps: Array<{ id: string; instruction: string; timerSeconds?: number }>;
  safety: string[];
  nutrition: {
    status: "complete" | "unavailable";
    perServing?: { calories: number; proteinGrams: number; carbohydrateGrams: number; fatGrams: number };
    attribution: string;
  };
  provenance: { type: "original" | "licensed" | "adapted"; sourceUrl?: string };
  revision: number;
  publishedAt: string;
};

export type UserProfile = {
  displayName?: string;
  zipCode?: string;
  dietaryAcknowledged: boolean;
  allergens: Allergen[];
  servings: number;
  equipment: string[];
  maxTimeMinutes?: number;
  budget: "low" | "moderate" | "flexible";
  cuisines: string[];
  dislikedFoods: string[];
  inferredPreferences: string[];
};

export type CartItem = { recipeId: string; servings: number };

export type UserData = {
  profile: UserProfile;
  savedRecipeIds: string[];
  cart: { items: CartItem[]; checkedIngredientIds: string[]; updatedAt: string };
  cartArchives: Array<{ archivedAt: string; items: CartItem[]; checkedIngredientIds: string[] }>;
  pantryDefaults: Array<{ ingredientId: string; confirmedAt: string }>;
  feedback: Array<{ recipeId: string; cooked: boolean; rating?: number; comment?: string; createdAt: string }>;
  deletionRequest?: { requestedAt: string; recoveryUntil: string };
};
