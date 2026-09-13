import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { recipes } from "../data/catalog";
import { Allergen, CartItem, majorAllergens, UserProfile } from "../domain/models";
import { exportUserData, getUserData } from "../services/userStore";
import { error, isResponse, json, readJson, requireUser, volatileDataHeaders } from "../shared/http";

function authenticated(request: HttpRequest): string | HttpResponseInit {
  return requireUser(request);
}

function validRecipeIds(ids: string[]): string[] {
  const known = new Set(recipes.map((recipe) => recipe.id));
  return ids.filter((id) => !known.has(id));
}

export async function profile(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  if (request.method === "GET") return json(200, { profile: data.profile }, volatileDataHeaders);

  const body = await readJson<Partial<UserProfile>>(request);
  if (!body || typeof body !== "object") return error(400, "invalid_body", "A JSON profile object is required.");
  if (body.allergens && (!Array.isArray(body.allergens) || body.allergens.some((item) => !majorAllergens.includes(item as Allergen)))) {
    return error(400, "invalid_allergens", "allergens must contain only the nine supported major allergens.", { supported: majorAllergens });
  }
  if (body.servings !== undefined && (!Number.isInteger(body.servings) || body.servings < 1 || body.servings > 20)) {
    return error(400, "invalid_servings", "servings must be an integer from 1 through 20.");
  }
  const allowed = ["displayName", "zipCode", "dietaryAcknowledged", "allergens", "servings", "equipment", "maxTimeMinutes", "budget", "cuisines", "dislikedFoods", "inferredPreferences"] as const;
  for (const key of allowed) if (body[key] !== undefined) (data.profile as unknown as Record<string, unknown>)[key] = body[key];
  return json(200, { profile: data.profile }, volatileDataHeaders);
}

export async function savedRecipes(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  if (request.method === "GET") {
    return json(200, { recipeIds: data.savedRecipeIds, recipes: recipes.filter((recipe) => data.savedRecipeIds.includes(recipe.id)) }, volatileDataHeaders);
  }
  const recipeId = request.params.recipeId;
  if (!recipes.some((recipe) => recipe.id === recipeId)) return error(404, "recipe_not_found", "The requested recipe does not exist.");
  if (request.method === "PUT" && !data.savedRecipeIds.includes(recipeId)) data.savedRecipeIds.push(recipeId);
  if (request.method === "DELETE") data.savedRecipeIds = data.savedRecipeIds.filter((id) => id !== recipeId);
  return { status: 204, headers: volatileDataHeaders };
}

export async function cart(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  if (request.method === "GET") return json(200, { cart: data.cart }, volatileDataHeaders);
  const body = await readJson<{ items?: CartItem[]; checkedIngredientIds?: string[] }>(request);
  if (!body || !Array.isArray(body.items) || !Array.isArray(body.checkedIngredientIds)) return error(400, "invalid_cart", "items and checkedIngredientIds arrays are required.");
  if (body.items.some((item) => typeof item.recipeId !== "string" || !Number.isInteger(item.servings) || item.servings < 1 || item.servings > 20)) {
    return error(400, "invalid_cart", "Every cart item needs a recipeId and servings from 1 through 20.");
  }
  const unknownRecipeIds = validRecipeIds(body.items.map((item) => item.recipeId));
  if (unknownRecipeIds.length) return error(400, "unknown_recipes", "The cart contains unknown recipe IDs.", { recipeIds: unknownRecipeIds });
  data.cart = { items: body.items, checkedIngredientIds: body.checkedIngredientIds.filter((id) => typeof id === "string"), updatedAt: new Date().toISOString() };
  return json(200, { cart: data.cart }, volatileDataHeaders);
}

export async function pantry(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  if (request.method === "GET") return json(200, { items: data.pantryDefaults }, volatileDataHeaders);
  const body = await readJson<{ ingredientIds?: string[] }>(request);
  if (!body || !Array.isArray(body.ingredientIds) || body.ingredientIds.some((id) => typeof id !== "string")) return error(400, "invalid_pantry", "ingredientIds must be an array of strings.");
  const confirmedAt = new Date().toISOString();
  data.pantryDefaults = [...new Set(body.ingredientIds)].map((ingredientId) => ({ ingredientId, confirmedAt }));
  return json(200, { items: data.pantryDefaults, reconfirmAfterDays: 30 }, volatileDataHeaders);
}

export async function archiveCart(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  const archivedAt = new Date().toISOString();
  data.cartArchives.push({ archivedAt, items: data.cart.items, checkedIngredientIds: data.cart.checkedIngredientIds });
  data.cart = { items: [], checkedIngredientIds: [], updatedAt: archivedAt };
  return json(201, { archivedAt, cart: data.cart }, volatileDataHeaders);
}

export async function accountExport(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  return json(200, { exportedAt: new Date().toISOString(), userId: user, data: exportUserData(user) }, { ...volatileDataHeaders, "content-disposition": "attachment; filename=grocery-planner-data.json" });
}

export async function deletionRequest(request: HttpRequest): Promise<HttpResponseInit> {
  const user = authenticated(request);
  if (isResponse(user)) return user;
  const data = getUserData(user);
  if (request.method === "DELETE") {
    delete data.deletionRequest;
    return { status: 204, headers: volatileDataHeaders };
  }
  const requestedAt = new Date();
  const recoveryUntil = new Date(requestedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  data.deletionRequest = { requestedAt: requestedAt.toISOString(), recoveryUntil: recoveryUntil.toISOString() };
  return json(202, { status: "scheduled", ...data.deletionRequest, note: "Persistence and the purge worker are not configured; this state is volatile." }, volatileDataHeaders);
}

app.http("Profile", { methods: ["GET", "PATCH"], authLevel: "anonymous", route: "me/profile", handler: profile });
app.http("SavedRecipes", { methods: ["GET"], authLevel: "anonymous", route: "me/saved-recipes", handler: savedRecipes });
app.http("SavedRecipe", { methods: ["PUT", "DELETE"], authLevel: "anonymous", route: "me/saved-recipes/{recipeId}", handler: savedRecipes });
app.http("Cart", { methods: ["GET", "PUT"], authLevel: "anonymous", route: "me/cart", handler: cart });
app.http("ArchiveCart", { methods: ["POST"], authLevel: "anonymous", route: "me/cart/archive", handler: archiveCart });
app.http("Pantry", { methods: ["GET", "PUT"], authLevel: "anonymous", route: "me/pantry", handler: pantry });
app.http("AccountExport", { methods: ["GET"], authLevel: "anonymous", route: "me/export", handler: accountExport });
app.http("DeletionRequest", { methods: ["POST", "DELETE"], authLevel: "anonymous", route: "me/deletion-request", handler: deletionRequest });
