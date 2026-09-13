import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function GetHealth(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    return { status: 200, jsonBody: { status: "ok", service: "grocery-app-api", persistence: "volatile-memory", timestamp: new Date().toISOString() } };
};

app.http('GetHealth', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GetHealth
});
