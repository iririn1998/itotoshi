import { Hono } from "hono";

const app = new Hono();

const healthResponse = {
  ok: true,
  service: "itotoshi-backend",
} as const;

app.get("/", (c) => c.json(healthResponse));
app.get("/health", (c) => c.json(healthResponse));

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
