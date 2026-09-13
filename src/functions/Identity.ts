import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getUserId, json, readJson } from "../shared/http";

export async function getAuthConfig(): Promise<HttpResponseInit> {
  return json(200, {
    configured: false,
    protocol: "oauth2-oidc",
    plannedProvider: "Microsoft Entra External ID",
    methods: ["google", "passwordless_email"],
    message: "Identity provider registration is not configured yet.",
  });
}

export async function getSession(request: HttpRequest): Promise<HttpResponseInit> {
  const userId = getUserId(request);
  return json(200, userId ? { authenticated: true, user: { id: userId } } : { authenticated: false, user: null });
}

export async function startSignIn(request: HttpRequest): Promise<HttpResponseInit> {
  const body = await readJson<{ method?: string; returnTo?: string; ageGate?: { result?: string; methodVersion?: string; checkedAt?: string } }>(request);
  if (!body || !["google", "passwordless_email"].includes(body.method ?? "")) {
    return json(400, { error: { code: "invalid_sign_in_method", message: "method must be google or passwordless_email." } });
  }
  if (!body.ageGate || !["18_plus", "under_18"].includes(body.ageGate.result ?? "") || typeof body.ageGate.methodVersion !== "string" || Number.isNaN(Date.parse(body.ageGate.checkedAt ?? ""))) {
    return json(400, { error: { code: "invalid_age_gate", message: "A derived age-gate result, methodVersion, and checkedAt timestamp are required. Do not send birth month/year." } });
  }
  if (body.ageGate.result !== "18_plus") return json(403, { error: { code: "age_restricted", message: "Accounts are restricted to people aged 18 or older during the POC." } });
  return json(501, {
    error: { code: "identity_not_configured", message: "OAuth/OIDC sign-in is a placeholder until Entra External ID is configured." },
    attemptedAction: { method: body.method, returnTo: body.returnTo, ageGate: body.ageGate },
  });
}

app.http("GetAuthConfig", { methods: ["GET"], authLevel: "anonymous", route: "auth/config", handler: getAuthConfig });
app.http("GetSession", { methods: ["GET"], authLevel: "anonymous", route: "auth/session", handler: getSession });
app.http("StartSignIn", { methods: ["POST"], authLevel: "anonymous", route: "auth/start", handler: startSignIn });
