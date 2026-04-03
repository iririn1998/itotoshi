import {
  Actor,
  BoundingBox,
  Color,
  ExcaliburGraphicsContext2DCanvas,
  Keys,
  Vector,
  vec,
  type Engine,
} from "excalibur";
import { tuning } from "../game/tuning";
import { isAnyPointerDown } from "../input/pointers";

const lineTuning = tuning.lineActor;

export class LineActor extends Actor {
  private static readonly _scratchHeadLocalBox = new BoundingBox(0, 0, 0, 0);

  /** 線分として描画・トリムするために必要な軌跡点の最小個数 */
  private static readonly MIN_TRAIL_POINTS = 2;

  points: Vector[] = [];
  headPos: Vector = vec(lineTuning.initialHeadX, lineTuning.baselineWorldY);
  velocity: Vector = vec(lineTuning.initialVelocityX, lineTuning.initialVelocityY);

  gravity: number = lineTuning.gravity;
  /** クリック／スペース中の上向き加速度（px/s²）。重力を打ち消して vy を負側へ滑らかに寄せる */
  liftAcceleration: number = lineTuning.liftAcceleration;
  /** 上方向への最大速度（px/s）。y 正は下なので、これ以上は上に速くならない */
  maxAscendVy: number = lineTuning.maxAscendVy;

  /** 軌跡線の太さ（px） */
  lineWidth: number = lineTuning.lineWidth;

  /**
   * 保持する軌跡点の上限。長時間プレイでもメモリと onPostDraw のループが線形に伸びないようにする。
   * 先頭から削除するため、古い点が切れる（画面左外に出た分は {@link trailViewportMargin} 側で主に落ちる）。
   */
  maxTrailPoints: number = lineTuning.maxTrailPoints;

  /**
   * ビューポート境界に足す余白（px）。カメラの viewport より外側に完全に出たセグメントだけ先頭から捨てる。
   */
  trailViewportMargin: number = lineTuning.trailViewportMargin;

  /**
   * 軌跡のローカル AABB（{@link pos}＝先端と同一）。トリム無しフレームは平行移動＋先端 combine で O(1) 更新する。
   */
  private trailLocalBounds: BoundingBox | null = null;

  private trimTrail(engine: Engine): boolean {
    const cam = engine.currentScene.camera;
    const v = cam.viewport;
    const m = this.trailViewportMargin + Math.ceil(this.lineWidth / 2);
    const left = v.left - m;

    let trimmed = false;
    let drop = 0;
    while (
      drop + LineActor.MIN_TRAIL_POINTS < this.points.length &&
      this.points[drop + 1].x < left
    ) {
      drop++;
    }
    if (drop > 0) {
      this.points.splice(0, drop);
      trimmed = true;
    }

    const over = this.points.length - this.maxTrailPoints;
    if (over > 0 && this.points.length > LineActor.MIN_TRAIL_POINTS) {
      const toRemove = Math.min(over, this.points.length - LineActor.MIN_TRAIL_POINTS);
      if (toRemove > 0) {
        this.points.splice(0, toRemove);
        trimmed = true;
      }
    }
    return trimmed;
  }

  private recomputeTrailLocalBounds(
    originX: number,
    originY: number,
    halfLine: number,
  ): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < this.points.length; i++) {
      const lx = this.points[i].x - originX;
      const ly = this.points[i].y - originY;
      if (lx < minX) minX = lx;
      if (lx > maxX) maxX = lx;
      if (ly < minY) minY = ly;
      if (ly > maxY) maxY = ly;
    }
    return new BoundingBox(minX - halfLine, minY - halfLine, maxX + halfLine, maxY + halfLine);
  }

  onInitialize = () => {
    this.points.push(this.headPos.clone());
    this.graphics.onPostDraw = (ctx) => {
      if (this.points.length < LineActor.MIN_TRAIL_POINTS) return;
      const origin = this.pos;
      if (ctx instanceof ExcaliburGraphicsContext2DCanvas) {
        const c = ctx.__ctx;
        c.save();
        c.strokeStyle = Color.White.toString();
        c.lineWidth = this.lineWidth;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        const p0 = this.points[0].sub(origin);
        c.moveTo(p0.x, p0.y);
        for (let i = 1; i < this.points.length; i++) {
          const p = this.points[i].sub(origin);
          c.lineTo(p.x, p.y);
        }
        c.stroke();
        c.restore();
        return;
      }
      for (let i = 0; i < this.points.length - 1; i++) {
        ctx.drawLine(
          this.points[i].sub(origin),
          this.points[i + 1].sub(origin),
          Color.White,
          this.lineWidth,
        );
      }
    };
  };

  onPreUpdate = (engine: Engine, delta: number) => {
    const dt = delta / tuning.msPerSecond;

    const prevHeadX = this.headPos.x;
    const prevHeadY = this.headPos.y;

    const ascend = isAnyPointerDown(engine) || engine.input.keyboard.isHeld(Keys.Space);

    let verticalAccel = this.gravity;
    if (ascend) {
      verticalAccel -= this.liftAcceleration;
    }
    this.velocity.y += verticalAccel * dt;
    if (ascend) {
      this.velocity.y = Math.max(this.velocity.y, this.maxAscendVy);
    }

    this.headPos.x += this.velocity.x * dt;
    this.headPos.y += this.velocity.y * dt;
    this.points.push(this.headPos.clone());
    const trailTrimmed = this.trimTrail(engine);

    this.pos = this.headPos.clone();

    // onPostDraw の線は既定の localBounds に含まれないため、先端だけが画面外だと全体がカリングされる。
    // 軌跡全体（ローカル座標）でバウンディングを更新する。先頭トリム時は外れ値が変わるため全点再計算。
    const halfLine = Math.ceil(this.lineWidth / 2);
    const px = this.pos.x;
    const py = this.pos.y;
    if (trailTrimmed || this.trailLocalBounds === null) {
      this.trailLocalBounds = this.recomputeTrailLocalBounds(px, py, halfLine);
    } else {
      const b = this.trailLocalBounds;
      const dx = prevHeadX - px;
      const dy = prevHeadY - py;
      b.left += dx;
      b.right += dx;
      b.top += dy;
      b.bottom += dy;
      const hb = LineActor._scratchHeadLocalBox;
      hb.left = -halfLine;
      hb.top = -halfLine;
      hb.right = halfLine;
      hb.bottom = halfLine;
      b.combine(hb, b);
    }
    this.graphics.localBounds = this.trailLocalBounds;
  };
}
