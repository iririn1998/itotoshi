import { Hono } from "hono";

import { createApiErrorResponse } from "./rankings/contract";

const app = new Hono();

const healthResponse = {
  ok: true,
  service: "itotoshi-backend",
} as const;

app.get("/", (c) => c.json(healthResponse));
app.get("/health", (c) => c.json(healthResponse));

app.notFound((c) => c.json(createApiErrorResponse("NOT_FOUND", "Not Found"), 404));

export default app;
