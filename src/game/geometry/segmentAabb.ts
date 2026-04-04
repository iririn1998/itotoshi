/**
 * 線分 AB と軸平行矩形（閉区間）の交差判定（Liang–Barsky）。
 */
export function segmentIntersectsAabb(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
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
        return false;
      }
      continue;
    }
    const t = qi / pi;
    if (pi < 0) {
      if (t > u2) {
        return false;
      }
      if (t > u1) {
        u1 = t;
      }
    } else {
      if (t < u1) {
        return false;
      }
      if (t < u2) {
        u2 = t;
      }
    }
  }
  return u1 <= u2;
}
