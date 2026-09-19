import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  DISPLAY_NAME_MAX_LENGTH,
  MAX_RANKING_LIMIT,
  RANKING_SCORE_MAX,
  parseApiErrorResponse,
  parseCreateRankingResponse,
  parseGetRankingsResponse,
  validateCreateRankingRequest,
  parseLimit,
} from "./index";

const entry = { id: 1, rank: 1, displayName: "日本語😀", score: 0, createdAt: 0 };

describe("unknown input", () => {
  it.each([undefined, null, true, 42, "name", [], [entry]])("rejects non-object %j", (value) => {
    expect(typeof validateCreateRankingRequest(value)).toBe("string");
  });
  it.each([undefined, 1, true, [], {}])("rejects non-string limit %j", (value) => {
    expect(parseLimit(value)).toBeNull();
  });
});

describe("success response parsers", () => {
  it("accepts empty lists and valid boundary values", () => {
    const maximum = {
      ...entry,
      displayName: "😀".repeat(DISPLAY_NAME_MAX_LENGTH),
      score: RANKING_SCORE_MAX,
    };
    expect(parseGetRankingsResponse({ rankings: [] })).toEqual({ rankings: [] });
    expect(
      parseGetRankingsResponse({ rankings: Array(MAX_RANKING_LIMIT).fill(maximum) }),
    ).not.toBeNull();
    expect(parseCreateRankingResponse({ ranking: maximum })).toEqual({ ranking: maximum });
  });
  it.each([null, [], {}, "ok", { rankings: null }, { rankings: {} }, { ranking: [] }])(
    "rejects malformed envelopes: %j",
    (value) => {
      expect(parseGetRankingsResponse(value)).toBeNull();
      expect(parseCreateRankingResponse(value)).toBeNull();
    },
  );
  it.each([
    { id: 0 },
    { id: "1" },
    { id: Number.MAX_SAFE_INTEGER + 1 },
    { rank: -1 },
    { rank: 0.5 },
    { createdAt: -1 },
    { createdAt: Infinity },
    { displayName: "" },
    { displayName: " A " },
    { displayName: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1) },
    { score: -1 },
    { score: 1.5 },
    { score: RANKING_SCORE_MAX + 1 },
    { score: "0" },
    { score: NaN },
  ])("rejects invalid entry fields: %j", (patch) => {
    const ranking = { ...entry, ...patch };
    expect(parseCreateRankingResponse({ ranking })).toBeNull();
    expect(parseGetRankingsResponse({ rankings: [entry, ranking] })).toBeNull();
  });
  it.each(Object.keys(entry))("requires %s", (key) => {
    const ranking: Record<string, unknown> = { ...entry };
    delete ranking[key];
    expect(parseCreateRankingResponse({ ranking })).toBeNull();
  });
  it("rejects too many entries", () => {
    expect(
      parseGetRankingsResponse({ rankings: Array(MAX_RANKING_LIMIT + 1).fill(entry) }),
    ).toBeNull();
  });
  it("allows additional fields for forward compatibility", () => {
    expect(
      parseCreateRankingResponse({ ranking: { ...entry, extra: true }, extra: true }),
    ).not.toBeNull();
  });
});

describe("error response parser", () => {
  it.each(API_ERROR_CODES)("accepts %s", (code) => {
    const body = { error: { code, message: "diagnostic" } };
    expect(parseApiErrorResponse(body)).toEqual(body);
  });
  it.each([
    null,
    [],
    {},
    { error: null },
    { error: {} },
    { error: { code: "UNKNOWN", message: "text" } },
    { error: { code: "BAD_REQUEST", message: 42 } },
    { error: { code: "BAD_REQUEST" } },
  ])("rejects malformed errors: %j", (body) => {
    expect(parseApiErrorResponse(body)).toBeNull();
  });
});
