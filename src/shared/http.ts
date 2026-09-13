import { HttpRequest, HttpResponseInit } from "@azure/functions";

export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } };

const baseHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(status: number, body: unknown, headers: Record<string, string> = {}): HttpResponseInit {
  return { status, jsonBody: body, headers: { ...baseHeaders, ...headers } };
}

export function error(status: number, code: string, message: string, details?: unknown): HttpResponseInit {
  return json(status, { error: { code, message, ...(details === undefined ? {} : { details }) } });
}

export async function readJson<T>(request: HttpRequest): Promise<T | undefined> {
  try {
    return await request.json() as T;
  } catch {
    return undefined;
  }
}

export function getUserId(request: HttpRequest): string | undefined {
  const principalId = request.headers.get("x-ms-client-principal-id");
  if (principalId) return principalId;

  const encodedPrincipal = request.headers.get("x-ms-client-principal");
  if (encodedPrincipal) {
    try {
      const principal = JSON.parse(Buffer.from(encodedPrincipal, "base64").toString("utf8"));
      if (typeof principal.userId === "string" && principal.userId) return principal.userId;
    } catch {
      return undefined;
    }
  }

  if (process.env.ENABLE_PLACEHOLDER_AUTH === "true") {
    return request.headers.get("x-grocery-user-id") ?? undefined;
  }
  return undefined;
}

export function requireUser(request: HttpRequest): string | HttpResponseInit {
  const userId = getUserId(request);
  return userId ?? error(401, "authentication_required", "Sign in is required for this resource.");
}

export function isResponse(value: string | HttpResponseInit): value is HttpResponseInit {
  return typeof value !== "string";
}

export const volatileDataHeaders = { "x-data-store": "volatile-memory" };
