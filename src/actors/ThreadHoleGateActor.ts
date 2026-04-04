import { Actor, CollisionType, Color, GraphicsGroup, Rectangle, vec } from "excalibur";
import { tuning } from "../game/tuning";

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
}
