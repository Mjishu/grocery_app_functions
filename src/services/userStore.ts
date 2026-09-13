import { UserData, UserProfile } from "../domain/models";

const users = new Map<string, UserData>();

const defaultProfile = (): UserProfile => ({
  dietaryAcknowledged: false,
  allergens: [],
  servings: 4,
  equipment: [],
  budget: "flexible",
  cuisines: [],
  dislikedFoods: [],
  inferredPreferences: [],
});

export function getUserData(userId: string): UserData {
  let data = users.get(userId);
  if (!data) {
    data = {
      profile: defaultProfile(),
      savedRecipeIds: [],
      cart: { items: [], checkedIngredientIds: [], updatedAt: new Date().toISOString() },
      cartArchives: [],
      pantryDefaults: [],
      feedback: [],
    };
    users.set(userId, data);
  }
  return data;
}

export function deleteUserData(userId: string): boolean {
  return users.delete(userId);
}

export function exportUserData(userId: string): UserData {
  return structuredClone(getUserData(userId));
}
