import { describe, expect, it } from "vitest";
import { isJsonContentType } from "./validation";

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
