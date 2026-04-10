import { Actor, type Engine } from "excalibur";
import { GameplaySession } from "../game/GameplaySession";
import { ThreadHoleGateActor } from "./ThreadHoleGateActor";
import { tuning } from "../game/tuning";

const th = tuning.threadHoles;

/** カメラ viewport の縦範囲内で、隙間全体が収まるように隙間中心 Y を一様ランダムに選ぶ */
function randomGapCenterWorldYInViewport(viewport: { top: number; bottom: number }): number {
  const half = th.gapHeightPx / 2;
  const minC = viewport.top + half;
  const maxC = viewport.bottom - half;
  if (maxC <= minC) {
    return (minC + maxC) / 2;
  }
  return minC + Math.random() * (maxC - minC);
}

/**
 * 一定時間ごとに {@link ThreadHoleGateActor} を、カメラビューポートの右外に生成し、
 * ビューポート左外へ出たゲートを削除する。
 */
export class ThreadHoleSpawnerActor extends Actor {
  private readonly gates: ThreadHoleGateActor[] = [];
  private spawnAccumMs = 0;
  private readonly session: GameplaySession;

  constructor(session: GameplaySession) {
    super();
    this.session = session;
  }

  getGates(): readonly ThreadHoleGateActor[] {
    return this.gates;
  }

  resetState(): void {
    for (const g of this.gates) {
      g.kill();
    }
    this.gates.length = 0;
    this.spawnAccumMs = 0;
  }

  onPreUpdate = (engine: Engine, delta: number): void => {
    if (this.session.isGameOver) {
      return;
    }

    const scene = engine.currentScene;

    this.spawnAccumMs += delta;
    const baseSpawnX = scene.camera.viewport.right + th.spawnBeyondViewportRightPx;
    const spawnSpacingX =
      (tuning.lineActor.initialVelocityX * th.spawnIntervalMs) / tuning.msPerSecond;
    let spawnIndex = 0;
    while (this.spawnAccumMs >= th.spawnIntervalMs) {
      this.spawnAccumMs -= th.spawnIntervalMs;
      const spawnX = baseSpawnX + spawnIndex * spawnSpacingX;
      spawnIndex += 1;
      const vp = scene.camera.viewport;
      const vh = vp.height;
      const gate = new ThreadHoleGateActor(randomGapCenterWorldYInViewport(vp), vh);
      gate.pos.setTo(spawnX, 0);
      gate.anchor.setTo(0, 0);
      scene.add(gate);
      this.gates.push(gate);
    }

    const cullX = scene.camera.viewport.left - th.cullMarginWorldPx;
    let write = 0;
    for (let i = 0; i < this.gates.length; i++) {
      const gate = this.gates[i];
      const right = gate.pos.x + th.wallThicknessX;
      if (right < cullX) {
        gate.kill();
      } else {
        this.gates[write++] = gate;
      }
    }
    this.gates.length = write;
  };
}
