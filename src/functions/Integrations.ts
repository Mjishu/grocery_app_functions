import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { error } from "../shared/http";

function unavailable(capability: string): HttpResponseInit {
  return error(501, "integration_not_configured", `${capability} is not configured. The endpoint is reserved behind a provider-neutral adapter.`);
}

export async function nearbyRetailers(_request: HttpRequest): Promise<HttpResponseInit> {
  return unavailable("Nearby retailer discovery and reverse geocoding");
}

export async function retailerHandoff(_request: HttpRequest): Promise<HttpResponseInit> {
  return unavailable("Retailer-hosted grocery-list handoff");
}

app.http("NearbyRetailers", { methods: ["GET"], authLevel: "anonymous", route: "retailers/nearby", handler: nearbyRetailers });
app.http("RetailerHandoff", { methods: ["POST"], authLevel: "anonymous", route: "retailer-handoffs", handler: retailerHandoff });
