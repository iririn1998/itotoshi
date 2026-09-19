import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { apiCors } from "./cors";

const app = new Hono();
app.use("/api/*", apiCors);
app.get("/api/probe", (c) => c.text("ok"));
const env = {
  RANKING_ALLOWED_ORIGINS: " https://game.example, invalid, , https://other.example/path ",
};

describe("API CORS", () => {
  it.each([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://game.example",
    "https://other.example",
  ])("allows %s", async (origin) => {
    const response = await app.request("/api/probe", { headers: { Origin: origin } }, env);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Vary")).toContain("Origin");
  });
  it.each([
    "https://evil.example",
    "https://game.example.evil.example",
    "http://game.example",
    "https://game.example:8443",
    "http://localhost:3000",
    "null",
    "invalid",
    "",
  ])("does not allow %j", async (origin) => {
    const response = await app.request("/api/probe", { headers: { Origin: origin } }, env);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
  it("handles an absent Origin and absent configuration", async () => {
    const response = await app.request("/api/probe", {}, {});
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const local = await app.request(
      "/api/probe",
      { headers: { Origin: "http://localhost:5173" } },
      {},
    );
    expect(local.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
  it.each(["https://game.example", "https://evil.example"])("preflight for %s", async (origin) => {
    const response = await app.request(
      "/api/probe",
      {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      },
      env,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      origin === "https://game.example" ? origin : null,
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST,OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
  });
});
