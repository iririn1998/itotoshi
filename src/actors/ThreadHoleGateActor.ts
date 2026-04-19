import { Actor, Canvas, CollisionType, GraphicsGroup, vec, type Vector } from "excalibur";
import { tuning } from "../game/tuning";

/** ワールド座標の軸平行矩形当たり */
export type WallHitBox = { left: number; top: number; right: number; bottom: number };

/** カメラ viewport の上下端（ワールド Y）。{@link ThreadHoleGateActor} の柱・当たりはこの範囲に合わせる */
export type GateViewportWorldY = { top: number; bottom: number };

/** 隙間に面する短辺にハイライトを入れる（上段柱＝下辺、下段柱＝上辺） */
type GapFacingEdge = "bottom" | "top";

const createPillarGraphic = (width: number, height: number, gapFacing: GapFacingEdge): Canvas => {
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));

  return new Canvas({
    width: w,
    height: h,
    cache: true,
    draw: (c) => {
      c.clearRect(0, 0, w, h);

      const body = c.createLinearGradient(0, 0, w, 0);
      body.addColorStop(0, "rgba(255,255,255,0.2)");
      body.addColorStop(0.18, "rgba(255,255,255,1)");
      body.addColorStop(0.4, "rgba(255,255,255,0.9)");
      body.addColorStop(0.68, "rgba(255,255,255,0.45)");
      body.addColorStop(1, "rgba(255,255,255,0.12)");
      c.fillStyle = body;
      c.fillRect(0, 0, w, h);

      c.save();
      c.globalCompositeOperation = "lighter";
      const sheen = c.createLinearGradient(0, 0, 0, h);
      sheen.addColorStop(0, "rgba(255,255,255,0.32)");
      sheen.addColorStop(0.42, "rgba(255,255,255,0)");
      sheen.addColorStop(1, "rgba(255,255,255,0.12)");
      c.fillStyle = sheen;
      c.fillRect(0, 0, w, h);
      c.restore();

      c.fillStyle = "rgba(255,255,255,0.88)";
      c.fillRect(0, 0, 1, h);
      if (w >= 2) {
        c.fillStyle = "rgba(255,255,255,0.22)";
        c.fillRect(1, 0, 1, h);
      }

      if (w >= 5) {
        c.strokeStyle = "rgba(255,255,255,0.16)";
        c.lineWidth = 1;
        const xMid = Math.floor(w * 0.52) + 0.5;
        c.beginPath();
        c.moveTo(xMid, 0);
        c.lineTo(xMid, h);
        c.stroke();
      }

      c.strokeStyle = "rgba(255,255,255,0.42)";
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, w - 1, h - 1);

      c.strokeStyle = "rgba(255,255,255,0.58)";
      c.beginPath();
      if (gapFacing === "bottom") {
        c.moveTo(0, h - 0.5);
        c.lineTo(w, h - 0.5);
      } else {
        c.moveTo(0, 0.5);
        c.lineTo(w, 0.5);
      }
      c.stroke();
    },
  });
};

/**
 * 上下の矩形のあいだに隙間を空けたゲート。糸（軌跡）がその隙間を通る想定。
 */
export class ThreadHoleGateActor extends Actor {
  /** このゲートで隙間通過スコアを既に加算したか */
  passScored = false;

  private readonly gapCenterWorldY: number;
  private readonly viewportWorldTop: number;
  private readonly viewportWorldBottom: number;
  private wallThicknessX = 0;
  private readonly hitBoxTop: WallHitBox = { left: 0, top: 0, right: 0, bottom: 0 };
  private readonly hitBoxBottom: WallHitBox = { left: 0, top: 0, right: 0, bottom: 0 };

  constructor(
    gapCenterWorldY: number = tuning.threadHoles.gapCenterWorldY,
    viewportWorldOrHeight: GateViewportWorldY | number = {
      top: 0,
      bottom: tuning.gameViewport.height,
    },
  ) {
    super();
    this.gapCenterWorldY = gapCenterWorldY;
    if (typeof viewportWorldOrHeight === "number") {
      this.viewportWorldTop = 0;
      this.viewportWorldBottom = viewportWorldOrHeight;
    } else {
      this.viewportWorldTop = viewportWorldOrHeight.top;
      this.viewportWorldBottom = viewportWorldOrHeight.bottom;
    }
  }

  onInitialize = (): void => {
    const th = tuning.threadHoles;
    const gapHalf = th.gapHeightPx / 2;
    const gapTopWorld = this.gapCenterWorldY - gapHalf;
    const gapBottomWorld = this.gapCenterWorldY + gapHalf;
    const vTop = this.viewportWorldTop;
    const vBottom = this.viewportWorldBottom;

    this.wallThicknessX = th.wallThicknessX;

    const topPillarHeight = Math.max(0, gapTopWorld - vTop);
    const topPillarOffsetLocal = vTop - this.pos.y;
    const bottomPillarHeight = Math.max(0, vBottom - gapBottomWorld);
    const bottomPillarOffsetLocal = gapBottomWorld - this.pos.y;

    const members: { offset: Vector; graphic: Canvas }[] = [];
    if (topPillarHeight > 0) {
      members.push({
        offset: vec(0, topPillarOffsetLocal),
        graphic: createPillarGraphic(th.wallThicknessX, topPillarHeight, "bottom"),
      });
    }
    if (bottomPillarHeight > 0) {
      members.push({
        offset: vec(0, bottomPillarOffsetLocal),
        graphic: createPillarGraphic(th.wallThicknessX, bottomPillarHeight, "top"),
      });
    }

    const group = new GraphicsGroup({
      useAnchor: false,
      members,
    });

    this.graphics.use(group);
    this.graphics.recalculateBounds();
    this.body.collisionType = CollisionType.PreventCollision;
  };

  /**
   * 上下壁の AABB（ワールド座標）。柱の見た目より {@link tuning.threadHoles.hitVisualInsetPx} だけ内側を基準にし、
   * `inflation` でさらに膨らませて線の太さ分を近似する。
   */
  getWallHitBoxes = (inflation: number): [WallHitBox, WallHitBox] => {
    const th = tuning.threadHoles;
    const gapHalf = th.gapHeightPx / 2;
    const gapTopWorld = this.gapCenterWorldY - gapHalf;
    const gapBottomWorld = this.gapCenterWorldY + gapHalf;
    const vTop = this.viewportWorldTop;
    const vBottom = this.viewportWorldBottom;

    const x0 = this.pos.x;
    const x1 = x0 + this.wallThicknessX;
    const pad = inflation;
    const inX = th.hitVisualInsetPx;

    const top = this.hitBoxTop;
    top.left = x0 + inX - pad;
    top.top = vTop + inX - pad;
    top.right = x1 - inX + pad;
    top.bottom = gapTopWorld - inX + pad;

    const bottom = this.hitBoxBottom;
    bottom.left = x0 + inX - pad;
    bottom.top = gapBottomWorld + inX - pad;
    bottom.right = x1 - inX + pad;
    bottom.bottom = vBottom - inX + pad;

    return [top, bottom];
  };

  /**
   * 上下壁に挟まれた隙間の Y 範囲（ワールド座標、上端・下端。壁に接する境界を含む）。
   */
  getGapYRange = (): { minY: number; maxY: number } => {
    const half = tuning.threadHoles.gapHeightPx / 2;
    return { minY: this.gapCenterWorldY - half, maxY: this.gapCenterWorldY + half };
  };
}
