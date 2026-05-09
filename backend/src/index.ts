import { Hono } from "hono";

import { apiCors } from "./cors";
import { createApiErrorResponse } from "./rankings/contract";
import { rankingsRoute } from "./rankings/routes";
import type { BackendEnv } from "./types";

const app = new Hono<BackendEnv>();

const healthResponse = {
  ok: true,
  service: "itotoshi-backend",
} as const;

app.get("/", (c) => c.json(healthResponse));
app.get("/health", (c) => c.json(healthResponse));
app.use("/api/*", apiCors);
app.route("/api/rankings", rankingsRoute);

app.notFound((c) => c.json(createApiErrorResponse("NOT_FOUND", "Not Found"), 404));

export default app;
