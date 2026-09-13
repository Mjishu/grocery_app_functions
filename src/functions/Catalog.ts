import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { collections, recipes } from "../data/catalog";
import { Allergen, majorAllergens, Recipe } from "../domain/models";
import { error, json } from "../shared/http";
import { isRecipeWithdrawn } from "./Engagement";

function summary(recipe: Recipe) {
  return {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    tagline: recipe.tagline,
    image: recipe.image,
    timeMinutes: recipe.timeMinutes,
    cost: recipe.cost,
    difficulty: recipe.difficulty,
    defaultServings: recipe.defaultServings,
    tags: recipe.tags,
    cuisines: recipe.cuisines,
    equipment: recipe.equipment,
    allergens: recipe.allergens,
    allergenReviewStatus: recipe.allergenReviewStatus,
    nutrition: recipe.nutrition,
  };
}

function csv(request: HttpRequest, name: string): string[] {
  return (request.query.get(name) ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

export async function listRecipes(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const q = (request.query.get("q") ?? "").trim().toLocaleLowerCase();
  const tags = csv(request, "tags").map((item) => item.toLocaleLowerCase());
  const cuisines = csv(request, "cuisines").map((item) => item.toLocaleLowerCase());
  const equipment = csv(request, "equipment").map((item) => item.toLocaleLowerCase());
  const excludedAllergens = csv(request, "excludeAllergens");
  const invalidAllergens = excludedAllergens.filter((item) => !majorAllergens.includes(item as Allergen));
  if (invalidAllergens.length) return error(400, "invalid_filter", "One or more allergens are not supported.", { invalidAllergens, supported: majorAllergens });

  const maxTimeRaw = request.query.get("maxTimeMinutes");
  const maxTime = maxTimeRaw === null ? undefined : Number(maxTimeRaw);
  if (maxTime !== undefined && (!Number.isInteger(maxTime) || maxTime < 1)) {
    return error(400, "invalid_filter", "maxTimeMinutes must be a positive integer.");
  }

  const requestedLimit = Number(request.query.get("limit") ?? "20");
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
  const requestedOffset = Number(request.query.get("offset") ?? "0");
  const offset = Number.isInteger(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

  const matches = recipes.filter((recipe) => {
    const searchable = [recipe.title, recipe.tagline, ...recipe.tags, ...recipe.cuisines, ...recipe.ingredients.map((item) => item.name)].join(" ").toLocaleLowerCase();
    return !isRecipeWithdrawn(recipe.id) && (!q || searchable.includes(q))
      && (maxTime === undefined || recipe.timeMinutes <= maxTime)
      && (!tags.length || tags.every((tag) => recipe.tags.some((value) => value.toLocaleLowerCase() === tag)))
      && (!cuisines.length || cuisines.some((cuisine) => recipe.cuisines.some((value) => value.toLocaleLowerCase() === cuisine)))
      && (!equipment.length || recipe.equipment.every((value) => equipment.includes(value.toLocaleLowerCase())))
      && !recipe.allergens.some((allergen) => excludedAllergens.includes(allergen));
  });

  return json(200, {
    items: matches.slice(offset, offset + limit).map(summary),
    page: { offset, limit, total: matches.length, hasMore: offset + limit < matches.length },
    appliedFilters: { q: q || undefined, maxTimeMinutes: maxTime, tags, cuisines, equipment, excludeAllergens: excludedAllergens },
    constraintsRelaxed: false,
  }, { "cache-control": "public, max-age=60, s-maxage=300" });
}

export async function getRecipe(request: HttpRequest): Promise<HttpResponseInit> {
  const recipe = recipes.find((item) => (item.id === request.params.recipeId || item.slug === request.params.recipeId) && !isRecipeWithdrawn(item.id));
  return recipe
    ? json(200, { recipe }, { "cache-control": "public, max-age=60, s-maxage=300", etag: `W/\"recipe-${recipe.id}-${recipe.revision}\"` })
    : error(404, "recipe_not_found", "The requested recipe does not exist or is not published.");
}

export async function listCollections(): Promise<HttpResponseInit> {
  return json(200, { items: collections.map(({ recipeIds, ...collection }) => ({ ...collection, recipeCount: recipeIds.length })) }, { "cache-control": "public, max-age=300" });
}

export async function getCollection(request: HttpRequest): Promise<HttpResponseInit> {
  const collection = collections.find((item) => item.slug === request.params.slug);
  if (!collection) return error(404, "collection_not_found", "The requested collection does not exist.");
  return json(200, { collection: { ...collection, recipes: collection.recipeIds.map((id) => recipes.find((recipe) => recipe.id === id && !isRecipeWithdrawn(recipe.id))).filter(Boolean).map((recipe) => summary(recipe!)) } }, { "cache-control": "public, max-age=300" });
}

app.http("ListRecipes", { methods: ["GET"], authLevel: "anonymous", route: "recipes", handler: listRecipes });
app.http("GetRecipe", { methods: ["GET"], authLevel: "anonymous", route: "recipes/{recipeId}", handler: getRecipe });
app.http("ListCollections", { methods: ["GET"], authLevel: "anonymous", route: "collections", handler: listCollections });
app.http("GetCollection", { methods: ["GET"], authLevel: "anonymous", route: "collections/{slug}", handler: getCollection });
