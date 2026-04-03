import "./style.css";
import { Engine, DisplayMode, Color, Actor, Vector, vec, Keys, BoundingBox } from "excalibur";

/** マウス／タッチのいずれかが押されているか（正規化ポインター ID を走査） */
function isAnyPointerDown(engine: Engine): boolean {
  const { pointers } = engine.input;
  for (let i = 0; i < 8; i++) {
    if (pointers.isDown(i)) return true;
  }
  return false;
}

class LineActor extends Actor {
  points: Vector[] = [];
  headPos: Vector = vec(0, 300);
  velocity: Vector = vec(150, 0);

  gravity: number = 800;
  /** クリック／スペース中の上向き加速度（px/s²）。重力を打ち消して vy を負側へ滑らかに寄せる */
  liftAcceleration: number = 2600;
  /** 上方向への最大速度（px/s）。y 正は下なので、これ以上は上に速くならない */
  maxAscendVy: number = -480;

  onInitialize() {
    this.points.push(this.headPos.clone());
    this.graphics.onPostDraw = (ctx) => {
      if (this.points.length < 2) return;
      for (let i = 0; i < this.points.length - 1; i++) {
        ctx.drawLine(
          this.points[i].sub(this.pos),
          this.points[i + 1].sub(this.pos),
          Color.White,
          3,
        );
      }
    };
  }

  onPreUpdate(engine: Engine, delta: number) {
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
    const halfLine = 2;
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
  }
}

const game = new Engine({
  canvasElementId: "game",
  width: 800,
  height: 600,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.Black,
});

const lineActor = new LineActor();
game.add(lineActor);

game.start();
