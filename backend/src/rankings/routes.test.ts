import { describe, expect, it, vi, afterEach } from "vitest";
import app from "../index";
import { createRanking, listRankings } from "./repository";

vi.mock("./repository", () => ({ createRanking: vi.fn(), listRankings: vi.fn() }));
afterEach(() => vi.resetAllMocks());

const post = (body: unknown) =>
  app.request(
    "/api/rankings",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { DB: {} },
  );

describe("ranking HTTP boundary", () => {
  it.each([
    null,
    true,
    1,
    "name",
    [],
    {},
    { displayName: "A", score: "1" },
    { displayName: "A", score: -1 },
    { displayName: "a".repeat(25), score: 0 },
  ])("rejects valid JSON with invalid request shape: %j", async (body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
    expect(createRanking).not.toHaveBeenCalled();
  });
  it("normalizes valid input before saving", async () => {
    const ranking = { id: 1, rank: 1, displayName: "😀", score: 0, createdAt: 0 };
    vi.mocked(createRanking).mockResolvedValue(ranking);
    const response = await post({ displayName: " 😀 ", score: 0 });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ranking });
    expect(createRanking).toHaveBeenCalledWith({}, { displayName: "😀", score: 0 });
  });
  it("distinguishes malformed JSON", async () => {
    const response = await app.request(
      "/api/rankings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      },
      {},
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_JSON" } });
  });
  it.each([
    ["", 50],
    ["?limit=101", 100],
  ] as const)("uses shared limit rules for %s", async (query, limit) => {
    vi.mocked(listRankings).mockResolvedValue([]);
    const response = await app.request(`/api/rankings${query}`, {}, { DB: {} });
    expect(response.status).toBe(200);
    expect(listRankings).toHaveBeenCalledWith({}, limit);
  });
  it("rejects invalid limits before reading the database", async () => {
    const response = await app.request("/api/rankings?limit=-1", {}, {});
    expect(response.status).toBe(400);
    expect(listRankings).not.toHaveBeenCalled();
  });
});
