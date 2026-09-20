import { describe, expect, it } from "vitest";
import type { Segment } from "../geometry/types";
import { findFirstHit, findPassedGates } from "./collision";
import type { CollisionGate } from "./types";

const viewport = { top: 0, bottom: 100 };
const segment = (x0: number, y0: number, x1: number, y1: number): Segment => ({
  start: { x: x0, y: y0 },
  end: { x: x1, y: y1 },
});
const gate = (left: number, right: number): CollisionGate => ({
  walls: [
    { left, right, top: 0, bottom: 40 },
    { left, right, top: 60, bottom: 100 },
  ],
  exitX: right,
  gap: { minY: 40, maxY: 60 },
  passScored: false,
});

describe("findFirstHit", () => {
  it.each([false, true])(
    "selects the nearest gate regardless of array order (reverse=%s)",
    (reverse) => {
      const gates = [gate(70, 80), gate(20, 30), gate(40, 50)];
      if (reverse) gates.reverse();
      expect(findFirstHit(segment(0, 20, 100, 20), viewport, gates)).toMatchObject({
        t: 0.2,
        point: { x: 20, y: 20 },
        obstacle: { kind: "gate", gateIndex: gates.findIndex((g) => g.exitX === 30) },
      });
    },
  );

  it("selects the nearest wall for vertical and reverse movement", () => {
    expect(findFirstHit(segment(25, 50, 25, 150), viewport, [gate(20, 30)])).toMatchObject({
      t: 0.1,
      point: { x: 25, y: 60 },
      obstacle: { kind: "gate", wallIndex: 1 },
    });
    expect(
      findFirstHit(segment(100, 20, 0, 20), viewport, [gate(20, 30), gate(70, 80)]),
    ).toMatchObject({ t: 0.2, point: { x: 80, y: 20 } });
  });

  it.each([
    { name: "gate before top", path: segment(0, 50, 100, -50), left: 20, t: 0.2, kind: "gate" },
    { name: "gate before bottom", path: segment(0, 50, 100, 150), left: 20, t: 0.2, kind: "gate" },
    { name: "top before gate", path: segment(0, 50, 100, -50), left: 70, t: 0.5, kind: "viewport" },
    {
      name: "bottom before gate",
      path: segment(0, 50, 100, 150),
      left: 70,
      t: 0.5,
      kind: "viewport",
    },
  ])("compares gate and viewport candidates: $name", ({ path, left, t, kind }) => {
    const hit = findFirstHit(path, viewport, [gate(left, left + 10)]);
    expect(hit?.t).toBeCloseTo(t);
    expect(hit?.obstacle.kind).toBe(kind);
  });

  it.each([
    { name: "top endpoint", path: segment(0, 50, 10, 0), t: 1, edge: "top" },
    { name: "bottom endpoint", path: segment(0, 50, 10, 100), t: 1, edge: "bottom" },
    { name: "on top moving in", path: segment(0, 0, 10, 50), t: 0, edge: "top" },
    { name: "outside bottom moving in", path: segment(0, 110, 10, 50), t: 0, edge: "bottom" },
    { name: "outside both old extents", path: segment(2e7, -2e7, 2e7, 50), t: 0, edge: "top" },
    { name: "bottom before top", path: segment(0, 110, 0, -10), t: 0, edge: "bottom" },
    { name: "stationary on boundary", path: segment(0, 100, 0, 100), t: 0, edge: "bottom" },
    { name: "horizontal on boundary", path: segment(0, 0, 10, 0), t: 0, edge: "top" },
    { name: "large world X", path: segment(2e7, 50, 2e7 + 10, -50), t: 0.5, edge: "top" },
  ])("handles viewport directly: $name", ({ path, t, edge }) => {
    expect(findFirstHit(path, viewport, [])).toMatchObject({
      t,
      obstacle: { kind: "viewport", edge },
    });
  });

  it("uses the supplied padded viewport", () => {
    expect(findFirstHit(segment(0, 50, 0, 0), { top: 5, bottom: 95 }, [])?.t).toBe(0.9);
  });

  it.each([segment(0, 50, 100, 50), segment(0, 50, 0, 50), segment(0, 20, 10, 20)])(
    "returns null when no obstacle intersects: %j",
    (path) => {
      expect(findFirstHit(path, viewport, [gate(20, 30)])).toBeNull();
    },
  );

  it("rejects gates outside the segment X range before clipping their Y bounds", () => {
    const offscreen = gate(200, 210);
    const walls = offscreen.walls.map((box) => ({
      ...box,
      get top(): number {
        throw new Error("A gate outside the X range must not be clipped");
      },
    }));
    expect(findFirstHit(segment(100, 20, 0, 20), viewport, [{ ...offscreen, walls }])).toBeNull();
  });

  it("includes a gate touching the segment X endpoint", () => {
    expect(findFirstHit(segment(0, 20, 20, 20), viewport, [gate(20, 30)])?.t).toBe(1);
  });

  it("reports t=0 when starting inside a wall", () => {
    expect(findFirstHit(segment(25, 20, 25, 50), viewport, [gate(20, 30)])?.t).toBe(0);
  });

  it("resolves equal-time hits deterministically", () => {
    expect(findFirstHit(segment(0, 50, 100, -50), viewport, [gate(50, 60)])).toMatchObject({
      t: 0.5,
      obstacle: { kind: "viewport", edge: "top" },
    });
  });
});

describe("findPassedGates", () => {
  it("returns every unscored gate crossed in one frame without mutating inputs", () => {
    const gates = [gate(60, 70), { ...gate(40, 50), passScored: true }, gate(20, 30)];
    const before = structuredClone(gates);
    const path = segment(0, 50, 100, 50);
    const hit = findFirstHit(path, viewport, gates);
    expect(findPassedGates(path, gates, hit)).toEqual([0, 2]);
    expect(gates).toEqual(before);
    expect(findPassedGates(path, gates, hit)).toEqual([0, 2]);
  });

  it.each([
    { name: "exit at endpoint", path: segment(0, 50, 30, 50), passed: [0] },
    { name: "exit at start", path: segment(30, 50, 40, 50), passed: [] },
    { name: "before exit", path: segment(0, 50, 29, 50), passed: [] },
    { name: "reverse", path: segment(40, 50, 0, 50), passed: [] },
    { name: "vertical", path: segment(30, 45, 30, 55), passed: [] },
    { name: "stationary", path: segment(30, 50, 30, 50), passed: [] },
    { name: "above gap", path: segment(0, 39, 40, 39), passed: [] },
    { name: "below gap", path: segment(0, 61, 40, 61), passed: [] },
    { name: "gap top", path: segment(0, 40, 40, 40), passed: [0] },
    { name: "gap bottom", path: segment(0, 60, 40, 60), passed: [0] },
    { name: "interpolated Y inside", path: segment(0, 0, 60, 100), passed: [0] },
    { name: "interpolated Y outside", path: segment(0, 0, 100, 50), passed: [] },
  ])("checks the exit crossing: $name", ({ path, passed }) => {
    expect(findPassedGates(path, [gate(20, 30)], null)).toEqual(passed);
  });

  it.each([20, 40, 70])("suppresses a pass before, at or after a collision at x=%s", (x) => {
    const path = segment(0, 50, 100, 50);
    const blocker = {
      ...gate(x, x + 10),
      walls: [{ left: x, right: x + 10, top: 45, bottom: 55 }],
    };
    const gates = [gate(30, 40), blocker];
    expect(findPassedGates(path, gates, null)).toContain(0);
    const hit = findFirstHit(path, viewport, gates);
    expect(hit?.t).toBe(x / 100);
    expect(findPassedGates(path, gates, hit)).toEqual([]);
    expect(gates.every((g) => !g.passScored)).toBe(true);
  });

  it("suppresses a pass when a later viewport collision occurs in the same frame", () => {
    const path = segment(0, 50, 100, -10);
    const gates = [gate(5, 10)];
    const hit = findFirstHit(path, viewport, gates);
    expect(hit?.obstacle.kind).toBe("viewport");
    expect(findPassedGates(path, gates, null)).toEqual([0]);
    expect(findPassedGates(path, gates, hit)).toEqual([]);
  });
});
