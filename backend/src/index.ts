import { Hono } from "hono";

import { createApiErrorResponse } from "./rankings/contract";
import { rankingsRoute } from "./rankings/routes";

type AppEnv = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<AppEnv>();

const healthResponse = {
  ok: true,
  service: "itotoshi-backend",
} as const;

app.get("/", (c) => c.json(healthResponse));
app.get("/health", (c) => c.json(healthResponse));
app.route("/api/rankings", rankingsRoute);

app.notFound((c) => c.json(createApiErrorResponse("NOT_FOUND", "Not Found"), 404));

export default app;
