import { describe, expect, it } from "vitest";
import { segmentAabbClip, segmentAabbEntryT, segmentIntersectsAabb } from "./segmentAabb";

describe("segment vs closed AABB [0, 10] × [0, 10]", () => {
  it.each([
    { name: "outside", line: [-5, -5, -1, -1], interval: null },
    { name: "finite segment stops before box", line: [-5, 5, -1, 5], interval: null },
    { name: "horizontal crossing", line: [-5, 5, 15, 5], interval: [0.25, 0.75] },
    { name: "vertical crossing", line: [5, -5, 5, 15], interval: [0.25, 0.75] },
    { name: "reverse crossing", line: [15, 5, -5, 5], interval: [0.25, 0.75] },
    { name: "bottom edge", line: [-5, 0, 15, 0], interval: [0.25, 0.75] },
    { name: "top edge", line: [-5, 10, 15, 10], interval: [0.25, 0.75] },
    { name: "left edge", line: [0, -5, 0, 15], interval: [0.25, 0.75] },
    { name: "right edge", line: [10, -5, 10, 15], interval: [0.25, 0.75] },
    { name: "corner tangency", line: [-5, 5, 5, -5], interval: [0.5, 0.5] },
    { name: "endpoint at corner", line: [-5, -5, 0, 0], interval: [1, 1] },
    { name: "start inside", line: [5, 5, 15, 5], interval: [0, 0.5] },
    { name: "entirely inside", line: [2, 2, 8, 8], interval: [0, 1] },
    { name: "start on boundary moving out", line: [0, 5, -5, 5], interval: [0, 0] },
    { name: "zero length inside", line: [5, 5, 5, 5], interval: [0, 1] },
    { name: "zero length on corner", line: [10, 10, 10, 10], interval: [0, 1] },
    { name: "zero length outside", line: [11, 5, 11, 5], interval: null },
    { name: "parallel outside horizontal", line: [-5, 11, 15, 11], interval: null },
    { name: "parallel outside vertical", line: [11, -5, 11, 15], interval: null },
  ])("$name", ({ line, interval }) => {
    const [ax, ay, bx, by] = line;
    const clip = segmentAabbClip(ax!, ay!, bx!, by!, 0, 0, 10, 10);
    expect(clip.intersects).toBe(interval !== null);
    expect(segmentIntersectsAabb(ax!, ay!, bx!, by!, 0, 0, 10, 10)).toBe(interval !== null);
    if (interval === null) {
      expect(segmentAabbEntryT(clip)).toBeNull();
    } else {
      expect(clip.u1).toBeCloseTo(interval[0]!);
      expect(clip.u2).toBeCloseTo(interval[1]!);
      expect(segmentAabbEntryT(clip)).toBeCloseTo(interval[0]!);
    }
  });
});
