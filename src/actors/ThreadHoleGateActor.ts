import { Actor, CollisionType, Color, GraphicsGroup, Rectangle, vec } from "excalibur";
import { tuning } from "../game/tuning";

/** ワールド座標の軸平行矩形当たり */
export type WallHitBox = { left: number; top: number; right: number; bottom: number };

/**
 * 上下の矩形のあいだに隙間を空けたゲート。糸（軌跡）がその隙間を通る想定。
 */
export class ThreadHoleGateActor extends Actor {
  /** このゲートで隙間通過スコアを既に加算したか */
  passScored = false;

  private readonly gapCenterWorldY: number;
  /** ワールド Y での画面の縦幅（0〜この値が画面に対応。通常はカメラ viewport の高さ） */
  private readonly viewportWorldHeight: number;
  private wallThicknessX = 0;
  private topHeight = 0;
  private bottomY = 0;
  private bottomHeight = 0;
  private readonly hitBoxTop: WallHitBox = { left: 0, top: 0, right: 0, bottom: 0 };
  private readonly hitBoxBottom: WallHitBox = { left: 0, top: 0, right: 0, bottom: 0 };

  constructor(
    gapCenterWorldY: number = tuning.threadHoles.gapCenterWorldY,
    viewportWorldHeight: number = tuning.gameViewport.height,
  ) {
    super();
    this.gapCenterWorldY = gapCenterWorldY;
    this.viewportWorldHeight = viewportWorldHeight;
  }

  onInitialize = (): void => {
    const th = tuning.threadHoles;
    const vh = this.viewportWorldHeight;
    const gapHalf = th.gapHeightPx / 2;
    const gapTop = this.gapCenterWorldY - gapHalf;
    const gapBottom = this.gapCenterWorldY + gapHalf;

    this.wallThicknessX = th.wallThicknessX;
    this.topHeight = Math.max(0, gapTop);
    this.bottomY = gapBottom;
    this.bottomHeight = Math.max(0, vh - gapBottom);

    const topHeight = this.topHeight;
    const bottomY = this.bottomY;
    const bottomHeight = this.bottomHeight;

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
  getWallHitBoxes = (inflation: number): [WallHitBox, WallHitBox] => {
    const x0 = this.pos.x;
    const x1 = x0 + this.wallThicknessX;
    const pad = inflation;

    const top = this.hitBoxTop;
    top.left = x0 - pad;
    top.top = 0 - pad;
    top.right = x1 + pad;
    top.bottom = this.topHeight + pad;

    const bottom = this.hitBoxBottom;
    bottom.left = x0 - pad;
    bottom.top = this.bottomY - pad;
    bottom.right = x1 + pad;
    bottom.bottom = this.bottomY + this.bottomHeight + pad;

    return [top, bottom];
  };

  /**
   * 上下壁に挟まれた隙間の Y 範囲（ワールド座標、上端・下端。壁に接する境界を含む）。
   */
  getGapYRange(): { minY: number; maxY: number } {
    return { minY: this.topHeight, maxY: this.bottomY };
  }
}
