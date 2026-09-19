import { afterEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, MAX_RANKING_LIMIT, RANKING_SCORE_MAX } from "@itotoshi/ranking-contract";
import { createRanking, getRankings, RankingApiError } from "./rankingApi";

const ranking = { id: 1, rank: 1, displayName: "Alice", score: 10, createdAt: 1234 };
const input = { displayName: "Alice", score: 10 };
const mockResponse = (body: unknown, status = 200) => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};
afterEach(() => vi.unstubAllGlobals());

describe("ranking client", () => {
  it("returns validated list and passes the requested limit", async () => {
    const fetch = mockResponse({ rankings: [ranking] });
    expect(await getRankings({ limit: 10 })).toEqual([ranking]);
    expect(fetch).toHaveBeenCalledWith("/api/rankings?limit=10");
  });
  it("accepts an empty list without a query", async () => {
    const fetch = mockResponse({ rankings: [] });
    expect(await getRankings()).toEqual([]);
    expect(fetch).toHaveBeenCalledWith("/api/rankings");
  });
  it("posts input and returns validated creation response", async () => {
    const fetch = mockResponse({ ranking }, 201);
    expect(await createRanking(input)).toEqual(ranking);
    expect(fetch).toHaveBeenCalledWith("/api/rankings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });
  it.each([
    null,
    true,
    [],
    {},
    { rankings: null },
    { rankings: [null] },
    { rankings: [{ ...ranking, score: "10" }] },
    { rankings: [{ ...ranking, displayName: " " }] },
    { rankings: Array(MAX_RANKING_LIMIT + 1).fill(ranking) },
  ])("rejects contract-invalid list JSON before returning: %j", async (body) => {
    mockResponse(body);
    await expect(getRankings()).rejects.toMatchObject({
      name: "RankingApiError",
      status: 200,
      code: null,
    });
  });
  it.each([
    null,
    [],
    {},
    { ranking: null },
    { ranking: { ...ranking, rank: 0 } },
    { ranking: { ...ranking, score: RANKING_SCORE_MAX + 1 } },
    { ranking: { ...ranking, createdAt: "1234" } },
  ])("rejects contract-invalid creation JSON: %j", async (body) => {
    mockResponse(body, 201);
    await expect(createRanking(input)).rejects.toMatchObject({
      name: "RankingApiError",
      status: 201,
      code: null,
    });
  });
  describe.each([
    ["GET", () => getRankings()],
    ["POST", () => createRanking(input)],
  ] as const)("%s error handling", (_method, request) => {
    it.each(API_ERROR_CODES)("preserves validated error %s", async (code) => {
      mockResponse({ error: { code, message: "Diagnostic" } }, 400);
      await expect(request()).rejects.toMatchObject({
        name: "RankingApiError",
        status: 400,
        code,
        message: "Diagnostic",
      });
    });
    it.each([
      null,
      [],
      {},
      { error: null },
      { error: { code: "FUTURE_CODE", message: "Untrusted" } },
      { error: { code: "BAD_REQUEST", message: 42 } },
      { error: { message: "Untrusted" } },
    ])("falls back for contract-invalid error JSON: %j", async (body) => {
      mockResponse(body, 500);
      await expect(request()).rejects.toMatchObject({
        status: 500,
        code: null,
        message: "Ranking API request failed with status 500",
      });
    });
    it.each([200, 502])("handles non-JSON response (status %s)", async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("<html>Oops</html>", { status })),
      );
      await expect(request()).rejects.toBeInstanceOf(RankingApiError);
    });
  });
});
