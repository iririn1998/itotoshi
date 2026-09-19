import { segmentAabbClip, segmentAabbEntryT } from "../geometry/segmentAabb";
import type { Segment } from "../geometry/types";
import type { CollisionCandidate, CollisionGate, CollisionViewport } from "./types";

/**
 * 全障害物のうち始点から最初に接触するものを返す。
 * 同じ t の場合は画面上端、下端、ゲート配列・壁配列の順を優先する（接触位置は同じ）。
 */
export const findFirstHit = (
  segment: Segment,
  viewport: CollisionViewport,
  gates: readonly CollisionGate[],
): CollisionCandidate | null => {
  const { start, end } = segment;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let first: CollisionCandidate | null = null;
  const consider = (t: number | null, obstacle: CollisionCandidate["obstacle"]): void => {
    if (t !== null && (first === null || t < first.t)) {
      first = { t, point: { x: start.x + t * dx, y: start.y + t * dy }, obstacle };
    }
  };

  // 上下の閉じた半平面との直接交差。始点が既に画面外なら t=0。
  consider(
    start.y <= viewport.top ? 0 : end.y <= viewport.top ? (viewport.top - start.y) / dy : null,
    { kind: "viewport", edge: "top" },
  );
  consider(
    start.y >= viewport.bottom
      ? 0
      : end.y >= viewport.bottom
        ? (viewport.bottom - start.y) / dy
        : null,
    { kind: "viewport", edge: "bottom" },
  );

  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  gates.forEach((gate, gateIndex) => {
    // 膨張済みの壁を基準にし、境界で接するゲートは除外しない。
    if (!gate.walls.some((box) => box.left <= maxX && box.right >= minX)) {
      return;
    }
    gate.walls.forEach((box, wallIndex) => {
      consider(segmentAabbEntryT(segmentAabbClip(segment, box)), {
        kind: "gate",
        gateIndex,
        wallIndex,
      });
    });
  });
  return first;
};

/**
 * 未加点ゲートの右端を隙間内で左から右へ跨いだゲートの配列 index を返す。
 * 従来の規則を維持し、同一フレームで衝突があれば通過時刻によらず加点しない。
 * 入力は変更せず、加点済みフラグの更新は呼び出し側で行う。
 */
export const findPassedGates = (
  segment: Segment,
  gates: readonly CollisionGate[],
  firstHit: CollisionCandidate | null,
): number[] => {
  const { start, end } = segment;
  const dx = end.x - start.x;
  if (firstHit !== null || dx <= 0) {
    return [];
  }
  const passed: number[] = [];
  gates.forEach((gate, index) => {
    if (gate.passScored || start.x >= gate.exitX || end.x < gate.exitX) {
      return;
    }
    const t = (gate.exitX - start.x) / dx;
    const y = start.y + t * (end.y - start.y);
    if (y >= gate.gap.minY && y <= gate.gap.maxY) {
      passed.push(index);
    }
  });
  return passed;
};
