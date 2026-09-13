# Grocery Planner API

Azure Functions v4 / TypeScript API framework derived from the Grocery Planner POC specification.

## Current boundary

- The catalog is an in-process seed behind the same contract a future SQL repository will implement.
- Account mutations are held in volatile process memory and are lost on restart or scale-out. Responses include `x-data-store: volatile-memory`.
- OAuth/OIDC is not faked. The API accepts Azure hosting identity headers when present. For local development only, set `ENABLE_PLACEHOLDER_AUTH=true` and send `x-grocery-user-id: <id>`.
- Identity, retailer discovery, and retailer handoff expose explicit `not configured` responses until their providers are selected and provisioned.
- Do not use the volatile implementations for production data.

All paths below are under the Azure Functions `/api` prefix.

## Implemented endpoints

| Access | Method and route | Purpose |
| --- | --- | --- |
| Public | `GET /health` | Service health and backing-store mode |
| Public | `GET /recipes` | Discovery/search/filter summaries |
| Public | `GET /recipes/{recipeId}` | Full ingredients, cooking, safety, nutrition, allergen, and provenance data |
| Public | `GET /collections` | Editorial collection summaries |
| Public | `GET /collections/{slug}` | Collection and recipe summaries |
| Public | `GET /recommendations` | Deterministic fallback recommendations |
| Public | `POST /recipes/{recipeId}/reports` | Anonymous reports; serious categories withdraw the recipe in this process |
| Signed in | `POST /recipes/{recipeId}/feedback` | Cooked/rating feedback |
| Public | `POST /support-requests` | Support intake |
| Public | `GET /auth/config` | Planned identity methods and configuration state |
| Public | `GET /auth/session` | Current hosting-auth session |
| Public | `POST /auth/start` | Stable sign-in request placeholder; currently returns `501` |
| Signed in | `GET, PATCH /me/profile` | Preferences, dietary acknowledgement, and profile |
| Signed in | `GET /me/saved-recipes` | Saved recipes |
| Signed in | `PUT, DELETE /me/saved-recipes/{recipeId}` | Save/unsave a recipe |
| Signed in | `GET, PUT /me/cart` | Persistent active cart/check state contract |
| Signed in | `POST /me/cart/archive` | Archive and clear the active cart |
| Signed in | `GET, PUT /me/pantry` | Pantry defaults and confirmation timestamps |
| Signed in | `GET /me/export` | Account data export |
| Signed in | `POST, DELETE /me/deletion-request` | Schedule/cancel the 14-day deletion window |
| Signed in | `POST /shared-lists` | Create a private 30-day shared grocery list |
| Link token | `GET, PATCH /shared-lists/{token}` | Read/synchronize guest check state |
| Signed in | `DELETE /shared-lists/{token}` | Revoke an owned link |
| Placeholder | `GET /retailers/nearby` | Provider-neutral nearby-store boundary (`501`) |
| Placeholder | `POST /retailer-handoffs` | Provider-neutral hosted handoff boundary (`501`) |

### Recipe filters

`GET /recipes` accepts `q`, `maxTimeMinutes`, comma-separated `tags`, `cuisines`, `equipment`, and `excludeAllergens`, plus `offset` and `limit` (maximum 50). Hard constraints are never relaxed; the response includes `constraintsRelaxed: false`.

## Run locally

```powershell
npm install
npm test
npm start
```

`POST /auth/start` also requires only the derived age result (`18_plus` or `under_18`), method version, and timestamp. Raw birth month/year must never be sent.

Example local authenticated request after setting `ENABLE_PLACEHOLDER_AUTH=true` in `local.settings.json`:

```text
GET http://localhost:7071/api/me/profile
x-grocery-user-id: local-user
```

## Production follow-ups

Replace the seed and volatile stores with repository interfaces backed by Azure SQL; configure Entra External ID and hosting authentication; add rate limiting, CSRF/cookie policy, telemetry allowlists, transactional email, the purge/retention worker, protected catalog import/audit/cache invalidation, and approved external provider adapters. Those items require infrastructure or provider decisions that the current repository does not contain.
