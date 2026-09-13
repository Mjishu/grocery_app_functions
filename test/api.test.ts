import assert from "node:assert/strict";
import test from "node:test";
import { HttpRequest, InvocationContext } from "@azure/functions";
import { getRecipe, listRecipes } from "../src/functions/Catalog";
import { getSession, startSignIn } from "../src/functions/Identity";
import { cart, profile } from "../src/functions/UserData";

function request(url: string, init: { method?: string; params?: Record<string, string>; headers?: Record<string, string>; body?: unknown } = {}): HttpRequest {
  const parsed = new URL(url);
  return {
    method: init.method ?? "GET",
    url,
    query: parsed.searchParams,
    params: init.params ?? {},
    headers: new Headers(init.headers),
    json: async () => init.body,
  } as unknown as HttpRequest;
}

const context = {} as InvocationContext;

test("catalog filters never silently relax allergen constraints", async () => {
  const response = await listRecipes(request("http://localhost/api/recipes?excludeAllergens=Milk"), context);
  assert.equal(response.status, 200);
  const body = response.jsonBody as { items: Array<{ allergens: string[] }>; constraintsRelaxed: boolean };
  assert.equal(body.constraintsRelaxed, false);
  assert.ok(body.items.every((recipe) => !recipe.allergens.includes("Milk")));
});

test("recipe details include cooking, nutrition, allergen, and provenance data", async () => {
  const response = await getRecipe(request("http://localhost/api/recipes/taco-bowls", { params: { recipeId: "taco-bowls" } }));
  assert.equal(response.status, 200);
  const recipe = (response.jsonBody as { recipe: Record<string, unknown> }).recipe;
  for (const field of ["ingredients", "steps", "safety", "nutrition", "allergens", "provenance"]) assert.ok(field in recipe);
});

test("account endpoints reject anonymous callers", async () => {
  const response = await profile(request("http://localhost/api/me/profile"));
  assert.equal(response.status, 401);
});

test("placeholder auth is opt-in and supports volatile user data", async () => {
  process.env.ENABLE_PLACEHOLDER_AUTH = "true";
  const headers = { "x-grocery-user-id": "test-user" };
  const session = await getSession(request("http://localhost/api/auth/session", { headers }));
  assert.equal((session.jsonBody as { authenticated: boolean }).authenticated, true);
  const update = await cart(request("http://localhost/api/me/cart", { method: "PUT", headers, body: { items: [{ recipeId: "taco-bowls", servings: 2 }], checkedIngredientIds: [] } }));
  assert.equal(update.status, 200);
  assert.equal((update.headers as unknown as Record<string, string>)["x-data-store"], "volatile-memory");
  delete process.env.ENABLE_PLACEHOLDER_AUTH;
});

test("sign-in start exposes a stable placeholder contract", async () => {
  const response = await startSignIn(request("http://localhost/api/auth/start", { method: "POST", body: { method: "google", returnTo: "/groceries", ageGate: { result: "18_plus", methodVersion: "month-year-v1", checkedAt: "2026-09-12T12:00:00.000Z" } } }));
  assert.equal(response.status, 501);
  assert.equal((response.jsonBody as { error: { code: string } }).error.code, "identity_not_configured");
});
