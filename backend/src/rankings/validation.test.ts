import { describe, expect, it } from "vitest";
import { isJsonContentType, parseLimit, validateCreateRankingRequest } from "./validation";

describe("ranking input", () => {
  it.each([null, {}, { score: 0 }, { displayName: "" }, { displayName: " \t\n　" }])(
    "rejects a missing or blank name: %j",
    (body) => expect(validateCreateRankingRequest(body)).toBe("displayName is required"),
  );
  it.each(["Alice", "日本語", "😀", "a".repeat(24), "😀".repeat(24)])(
    "trims and accepts names by Unicode code point: %s",
    (name) => {
      expect(validateCreateRankingRequest({ displayName: `　 ${name}\n`, score: 0 })).toEqual({
        displayName: name,
        score: 0,
      });
    },
  );
  it.each(["a".repeat(25), "😀".repeat(25), "日".repeat(25)])("rejects 25 code points", (name) => {
    expect(validateCreateRankingRequest({ displayName: name, score: 0 })).toBe(
      "displayName must be 24 characters or fewer",
    );
  });
  it.each([0, 1, 999_999_998, 999_999_999])("accepts score %s", (score) => {
    expect(validateCreateRankingRequest({ displayName: "A", score })).toEqual({
      displayName: "A",
      score,
    });
  });
  it.each([
    [-1, "score must be non-negative"],
    [1_000_000_000, "score must be 999999999 or less"],
    [0.5, "score must be an integer"],
    [NaN, "score must be an integer"],
    [Infinity, "score must be an integer"],
    [-Infinity, "score must be an integer"],
    [undefined, "score must be an integer"],
  ] as const)("rejects score %s", (score, error) => {
    expect(validateCreateRankingRequest({ displayName: "A", score })).toBe(error);
  });
});

describe("limit", () => {
  it.each([
    [null, 50],
    ["", 50],
    ["1", 1],
    ["100", 100],
    ["101", 100],
    ["999999", 100],
    ["0", null],
    ["-1", null],
    ["1.5", null],
    ["abc", null],
    ["NaN", null],
    ["Infinity", null],
    [" ", null],
    [" 2 ", 2],
  ] as const)("parses %j as %s", (input, expected) => expect(parseLimit(input)).toBe(expected));
});

describe("Content-Type", () => {
  it.each([
    [undefined, false],
    ["", false],
    ["text/plain", false],
    ["application/jsonp", false],
    ["application/json", true],
    ["application/json; charset=utf-8", true],
    [" Application/JSON ; charset=UTF-8", true],
    ["application/problem+json", true],
    ["application/vnd.api+json; charset=utf-8", true],
  ] as const)("accepts %j: %s", (input, expected) =>
    expect(isJsonContentType(input)).toBe(expected),
  );
});
