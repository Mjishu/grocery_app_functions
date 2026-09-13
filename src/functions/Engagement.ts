import { randomUUID } from "node:crypto";
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { recipes } from "../data/catalog";
import { getUserData } from "../services/userStore";
import { error, isResponse, json, readJson, requireUser, volatileDataHeaders } from "../shared/http";

const seriousReportCategories = new Set(["safety", "allergen", "quantity", "instruction"]);
const withdrawnRecipeIds = new Set<string>();
const reports: unknown[] = [];
const supportRequests: unknown[] = [];

type SharedList = {
  token: string;
  ownerId: string;
  items: Array<{ id: string; name: string; amount: string; category: string; checked: boolean }>;
  expiresAt: string;
  revokedAt?: string;
  updatedAt: string;
};
const sharedLists = new Map<string, SharedList>();

export function isRecipeWithdrawn(recipeId: string): boolean {
  return withdrawnRecipeIds.has(recipeId);
}

export async function recommendations(request: HttpRequest): Promise<HttpResponseInit> {
  const allergens = (request.query.get("excludeAllergens") ?? "").split(",").filter(Boolean);
  const eligible = recipes.filter((recipe) => !withdrawnRecipeIds.has(recipe.id) && !recipe.allergens.some((allergen) => allergens.includes(allergen)));
  return json(200, {
    items: eligible.map((recipe, index) => ({ recipe, score: Math.max(0.5, 1 - index * 0.05), reason: index === 0 ? "Editorial beginner pick" : "Matches the current hard constraints", exploration: index > Math.floor(eligible.length * 0.8) })),
    engine: "deterministic-placeholder",
    constraintsRelaxed: false,
    aiExplanationAvailable: false,
  });
}

export async function recipeReport(request: HttpRequest): Promise<HttpResponseInit> {
  const recipeId = request.params.recipeId;
  if (!recipes.some((recipe) => recipe.id === recipeId)) return error(404, "recipe_not_found", "The requested recipe does not exist.");
  const body = await readJson<{ category?: string; details?: string; contactEmail?: string }>(request);
  const categories = ["factual", "safety", "allergen", "quantity", "instruction"];
  if (!body || !categories.includes(body.category ?? "") || typeof body.details !== "string" || body.details.trim().length < 10 || body.details.length > 4000) {
    return error(400, "invalid_report", "category must be supported and details must contain 10 to 4000 characters.", { categories });
  }
  const id = randomUUID();
  const withdrawn = seriousReportCategories.has(body.category!);
  if (withdrawn) withdrawnRecipeIds.add(recipeId);
  reports.push({ id, recipeId, category: body.category, details: body.details.trim(), contactEmail: body.contactEmail, createdAt: new Date().toISOString(), status: "open", withdrawn });
  return json(202, { reportId: id, status: "open", recipeWithdrawnPendingReview: withdrawn }, volatileDataHeaders);
}

export async function feedback(request: HttpRequest): Promise<HttpResponseInit> {
  const user = requireUser(request);
  if (isResponse(user)) return user;
  const recipeId = request.params.recipeId;
  if (!recipes.some((recipe) => recipe.id === recipeId)) return error(404, "recipe_not_found", "The requested recipe does not exist.");
  const body = await readJson<{ cooked?: boolean; rating?: number; comment?: string; notInterestedReason?: string }>(request);
  if (!body || typeof body.cooked !== "boolean" || (body.rating !== undefined && (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5))) {
    return error(400, "invalid_feedback", "cooked is required and rating, when present, must be an integer from 1 through 5.");
  }
  if (body.rating !== undefined && !body.cooked) return error(400, "rating_requires_cooked", "A recipe can only be rated after it is marked cooked.");
  const entry = { recipeId, cooked: body.cooked, rating: body.rating, comment: body.comment, createdAt: new Date().toISOString() };
  getUserData(user).feedback.push(entry);
  return json(201, { feedback: entry }, volatileDataHeaders);
}

export async function support(request: HttpRequest): Promise<HttpResponseInit> {
  const body = await readJson<{ category?: string; message?: string; email?: string }>(request);
  const categories = ["account", "recipe_error", "safety", "privacy_deletion", "external_support_payment", "general"];
  if (!body || !categories.includes(body.category ?? "") || typeof body.message !== "string" || body.message.trim().length < 10 || body.message.length > 4000) {
    return error(400, "invalid_support_request", "category must be supported and message must contain 10 to 4000 characters.", { categories });
  }
  const id = randomUUID();
  supportRequests.push({ id, ...body, message: body.message.trim(), createdAt: new Date().toISOString() });
  return json(202, { requestId: id, status: "received" }, volatileDataHeaders);
}

export async function createShare(request: HttpRequest): Promise<HttpResponseInit> {
  const user = requireUser(request);
  if (isResponse(user)) return user;
  const body = await readJson<{ items?: SharedList["items"] }>(request);
  if (!body || !Array.isArray(body.items) || body.items.length > 250 || body.items.some((item) => !item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.checked !== "boolean")) {
    return error(400, "invalid_shared_list", "items must be a valid grocery item array with at most 250 entries.");
  }
  const now = new Date();
  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const shared: SharedList = { token, ownerId: user, items: body.items, updatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() };
  sharedLists.set(token, shared);
  return json(201, { share: { token, path: `/api/shared-lists/${token}`, expiresAt: shared.expiresAt } }, volatileDataHeaders);
}

export async function sharedList(request: HttpRequest): Promise<HttpResponseInit> {
  const shared = sharedLists.get(request.params.token);
  if (!shared || shared.revokedAt || Date.parse(shared.expiresAt) <= Date.now()) return error(404, "shared_list_not_found", "This shared list is invalid, expired, or revoked.");
  if (request.method === "GET") return json(200, { sharedList: { items: shared.items, expiresAt: shared.expiresAt, updatedAt: shared.updatedAt, shopper: "Guest" } }, volatileDataHeaders);
  const body = await readJson<{ checked?: Record<string, boolean> }>(request);
  if (!body?.checked || typeof body.checked !== "object") return error(400, "invalid_check_state", "checked must map grocery item IDs to booleans.");
  shared.items = shared.items.map((item) => typeof body.checked![item.id] === "boolean" ? { ...item, checked: body.checked![item.id] } : item);
  shared.updatedAt = new Date().toISOString();
  return json(200, { sharedList: { items: shared.items, expiresAt: shared.expiresAt, updatedAt: shared.updatedAt, shopper: "Guest" } }, volatileDataHeaders);
}

export async function revokeShare(request: HttpRequest): Promise<HttpResponseInit> {
  const user = requireUser(request);
  if (isResponse(user)) return user;
  const shared = sharedLists.get(request.params.token);
  if (!shared || shared.ownerId !== user) return error(404, "shared_list_not_found", "The shared list does not exist for this account.");
  shared.revokedAt = new Date().toISOString();
  return { status: 204, headers: volatileDataHeaders };
}

app.http("Recommendations", { methods: ["GET"], authLevel: "anonymous", route: "recommendations", handler: recommendations });
app.http("RecipeReport", { methods: ["POST"], authLevel: "anonymous", route: "recipes/{recipeId}/reports", handler: recipeReport });
app.http("RecipeFeedback", { methods: ["POST"], authLevel: "anonymous", route: "recipes/{recipeId}/feedback", handler: feedback });
app.http("SupportRequest", { methods: ["POST"], authLevel: "anonymous", route: "support-requests", handler: support });
app.http("CreateSharedList", { methods: ["POST"], authLevel: "anonymous", route: "shared-lists", handler: createShare });
app.http("UseSharedList", { methods: ["GET", "PATCH"], authLevel: "anonymous", route: "shared-lists/{token}", handler: sharedList });
app.http("RevokeSharedList", { methods: ["DELETE"], authLevel: "anonymous", route: "shared-lists/{token}", handler: revokeShare });
