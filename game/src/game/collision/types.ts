import type { Aabb, Point } from "../geometry/types";

/** 線の太さ・判定余白を適用済みの画面内 Y 範囲。上下の境界への接触も衝突。 */
export type CollisionViewport = Readonly<{ top: number; bottom: number }>;

export type CollisionGate = Readonly<{
  walls: readonly Readonly<Aabb>[];
  exitX: number;
  gap: Readonly<{ minY: number; maxY: number }>;
  passScored: boolean;
}>;

export type CollisionCandidate = Readonly<{
  t: number;
  point: Point;
  obstacle:
    | { kind: "viewport"; edge: "top" | "bottom" }
    | { kind: "gate"; gateIndex: number; wallIndex: number };
}>;
