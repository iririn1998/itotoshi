import "./style.css";
import { Engine, DisplayMode, Color, Actor, Vector, vec, Keys } from "excalibur";

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

    // Update the actor's position so it doesn't get culled by the camera
    this.pos = this.headPos.clone();

    // Camera follow
    engine.currentScene.camera.pos = vec(this.headPos.x + 200, 300);
  }
}

const game = new Engine({
  canvasElementId: "game",
  width: 800,
  height: 600,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.DarkGray,
});

const lineActor = new LineActor();
game.add(lineActor);

game.start();
