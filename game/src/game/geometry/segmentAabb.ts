/**
 * 線分 P(u)=A+u(B-A), u∈[0,1] を軸平行矩形（閉区間）に対して Liang–Barsky でクリップした結果。
 * `u1`,`u2` は線分 AB の範囲 [0,1] にクリップ済みで、有限線分 AB との交差判定は `intersects` で表される。
 */
export type SegmentAabbClip = {
  intersects: boolean;
  u1: number;
  u2: number;
};

export const segmentAabbClip = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): SegmentAabbClip => {
  let u1 = 0;
  let u2 = 1;
  const dx = bx - ax;
  const dy = by - ay;

  const p = [-dx, dx, -dy, dy] as const;
  const q = [ax - minX, maxX - ax, ay - minY, maxY - ay] as const;

  for (let i = 0; i < 4; i++) {
    const pi = p[i];
    const qi = q[i];
    if (pi === 0) {
      if (qi < 0) {
        return { intersects: false, u1, u2 };
      }
      continue;
    }
    const t = qi / pi;
    if (pi < 0) {
      if (t > u2) {
        return { intersects: false, u1, u2 };
      }
      if (t > u1) {
        u1 = t;
      }
    } else {
      if (t < u1) {
        return { intersects: false, u1, u2 };
      }
      if (t < u2) {
        u2 = t;
      }
    }
  }
  return { intersects: u1 <= u2, u1, u2 };
};

/**
 * 線分 AB と軸平行矩形（閉区間）の交差判定（Liang–Barsky）。
 */
export const segmentIntersectsAabb = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean => segmentAabbClip(ax, ay, bx, by, minX, minY, maxX, maxY).intersects;

/**
 * 線分が箱と交わるとき、A から B へ進む際の「最初に箱内に入る」パラメータ t∈[0,1]（P=A+t(B-A)）。
 * {@link segmentAabbClip} は u1,u2 を線分 [0,1] にクリップした結果を返す。
 */
export const segmentAabbEntryT = (clip: SegmentAabbClip): number | null =>
  clip.intersects ? clip.u1 : null;
