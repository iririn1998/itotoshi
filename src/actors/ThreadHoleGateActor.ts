import { Actor, CollisionType, Color, GraphicsGroup, Rectangle, vec } from "excalibur";
import { tuning } from "../game/tuning";

/** ワールド座標の軸平行矩形当たり */
export type WallHitBox = { left: number; top: number; right: number; bottom: number };

/**
 * 上下の矩形のあいだに隙間を空けたゲート。糸（軌跡）がその隙間を通る想定。
 */
export class ThreadHoleGateActor extends Actor {
  onInitialize = (): void => {
    const th = tuning.threadHoles;
    const vh = tuning.gameViewport.height;
    const gapHalf = th.gapHeightPx / 2;
    const gapTop = th.gapCenterWorldY - gapHalf;
    const gapBottom = th.gapCenterWorldY + gapHalf;

    const topHeight = Math.max(0, gapTop);
    const bottomY = gapBottom;
    const bottomHeight = Math.max(0, vh - gapBottom);

    const topRect = new Rectangle({
      width: th.wallThicknessX,
      height: topHeight,
      color: Color.White,
    });
    const bottomRect = new Rectangle({
      width: th.wallThicknessX,
      height: bottomHeight,
      color: Color.White,
    });

    const group = new GraphicsGroup({
      useAnchor: false,
      members: [
        { offset: vec(0, 0), graphic: topRect },
        { offset: vec(0, bottomY), graphic: bottomRect },
      ],
    });

    this.graphics.use(group);
    this.graphics.recalculateBounds();
    this.body.collisionType = CollisionType.PreventCollision;
  };

  /**
   * 描画と同じ上下壁の AABB（ワールド座標）。`inflation` で法線方向に膨らませて線の太さ分を近似する。
   */
  getWallHitBoxes(inflation: number): [WallHitBox, WallHitBox] {
    const hole = tuning.threadHoles;
    const vh = tuning.gameViewport.height;
    const gapHalf = hole.gapHeightPx / 2;
    const gapTop = hole.gapCenterWorldY - gapHalf;
    const gapBottom = hole.gapCenterWorldY + gapHalf;
    const topHeight = Math.max(0, gapTop);
    const bottomY = gapBottom;
    const bottomHeight = Math.max(0, vh - gapBottom);

    const x0 = this.pos.x;
    const x1 = x0 + hole.wallThicknessX;
    const pad = inflation;

    return [
      {
        left: x0 - pad,
        top: 0 - pad,
        right: x1 + pad,
        bottom: topHeight + pad,
      },
      {
        left: x0 - pad,
        top: bottomY - pad,
        right: x1 + pad,
        bottom: bottomY + bottomHeight + pad,
      },
    ];
  }
}
