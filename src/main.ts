import "./style.css";
import {
  Engine,
  DisplayMode,
  Color,
  Actor,
  Vector,
  vec,
  Keys,
  type ExcaliburGraphicsContext,
} from "excalibur";

class LineActor extends Actor {
  points: Vector[] = [];
  headPos: Vector = vec(0, 300);
  velocity: Vector = vec(150, 0);

  gravity: number = 800;
  lift: number = -300;

  onInitialize() {
    this.points.push(this.headPos.clone());
  }

  onPreUpdate(engine: Engine, delta: number) {
    const dt = delta / 1000;

    // Use Pointer ID 0 for primary touch/mouse, or Spacebar
    if (engine.input.pointers.isDown(0) || engine.input.keyboard.isHeld(Keys.Space)) {
      this.velocity.y = this.lift;
    } else {
      this.velocity.y += this.gravity * dt;
    }

    this.headPos.x += this.velocity.x * dt;
    this.headPos.y += this.velocity.y * dt;
    this.points.push(this.headPos.clone());

    // Update the actor's position so it doesn't get culled by the camera
    this.pos = this.headPos.clone();

    // Camera follow
    engine.currentScene.camera.pos = vec(this.headPos.x + 200, 300);
  }

  onPostDraw(ctx: ExcaliburGraphicsContext) {
    if (this.points.length < 2) return;
    for (let i = 0; i < this.points.length - 1; i++) {
      // Points are in global space, but ctx is in local space (relative to this.pos)
      ctx.drawLine(this.points[i].sub(this.pos), this.points[i + 1].sub(this.pos), Color.White, 3);
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
