import "./style.css";
import {
  Engine,
  DisplayMode,
  Color,
  Actor,
  Vector,
  vec,
  type ExcaliburGraphicsContext,
} from "excalibur";

class LineActor extends Actor {
  points: Vector[] = [];
  headPos: Vector = vec(0, 300);
  velocity: Vector = vec(150, 0);

  onInitialize() {
    this.points.push(this.headPos.clone());
  }

  onPreUpdate(_engine: Engine, delta: number) {
    const dt = delta / 1000;

    this.headPos.x += this.velocity.x * dt;
    this.points.push(this.headPos.clone());
  }

  onPostDraw(ctx: ExcaliburGraphicsContext) {
    if (this.points.length < 2) return;
    for (let i = 0; i < this.points.length - 1; i++) {
      ctx.drawLine(this.points[i], this.points[i + 1], Color.White, 3);
    }
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
