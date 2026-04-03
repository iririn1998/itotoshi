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
import { isAnyPointerDown } from "../input/pointers.ts";

export class LineActor extends Actor {
  points: Vector[] = [];
  headPos: Vector = vec(0, 300);
  velocity: Vector = vec(150, 0);

  gravity: number = 800;
  /** クリック／スペース中の上向き加速度（px/s²）。重力を打ち消して vy を負側へ滑らかに寄せる */
  liftAcceleration: number = 2600;
  /** 上方向への最大速度（px/s）。y 正は下なので、これ以上は上に速くならない */
  maxAscendVy: number = -480;

  /** 軌跡線の太さ（px） */
  lineWidth: number = 1;

  onInitialize = () => {
    this.points.push(this.headPos.clone());
    this.graphics.onPostDraw = (ctx) => {
      if (this.points.length < 2) return;
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
    const dt = delta / 1000;

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

    this.pos = this.headPos.clone();

    // onPostDraw の線は既定の localBounds に含まれないため、先端だけが画面外だと全体がカリングされる。
    // 軌跡全体（ローカル座標）でバウンディングを更新する。
    const halfLine = Math.ceil(this.lineWidth / 2);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const px = this.pos.x;
    const py = this.pos.y;
    for (let i = 0; i < this.points.length; i++) {
      const lx = this.points[i].x - px;
      const ly = this.points[i].y - py;
      if (lx < minX) minX = lx;
      if (lx > maxX) maxX = lx;
      if (ly < minY) minY = ly;
      if (ly > maxY) maxY = ly;
    }
    this.graphics.localBounds = new BoundingBox(
      minX - halfLine,
      minY - halfLine,
      maxX + halfLine,
      maxY + halfLine,
    );

    // Camera follow
    engine.currentScene.camera.pos = vec(this.headPos.x + 200, 300);
  };
}
