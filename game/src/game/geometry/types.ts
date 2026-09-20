/** ワールド座標。Engine の Vector に依存しない判定用の値。 */
export type Point = Readonly<{ x: number; y: number }>;

export type Segment = Readonly<{ start: Point; end: Point }>;

/** 境界を含む軸平行矩形。 */
export type Aabb = { left: number; top: number; right: number; bottom: number };
