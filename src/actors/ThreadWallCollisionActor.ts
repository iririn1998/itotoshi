import { Actor, type Engine } from "excalibur";
import { GameplaySession } from "../game/GameplaySession";
import { segmentIntersectsAabb } from "../game/geometry/segmentAabb";
import { tuning } from "../game/tuning";
import { LineActor } from "./LineActor";
import { ThreadHoleSpawnerActor } from "./ThreadHoleSpawnerActor";

const th = tuning.threadHoles;

/**
 * 軌跡セグメントと壁当たりを検査し、接触時にセッションをゲームオーバーにする。
 */
export class ThreadWallCollisionActor extends Actor {
  private readonly session: GameplaySession;
  private readonly line: LineActor;
  private readonly spawner: ThreadHoleSpawnerActor;
  private readonly onHit: () => void;

  constructor(
    session: GameplaySession,
    line: LineActor,
    spawner: ThreadHoleSpawnerActor,
    onHit: () => void,
  ) {
    super();
    this.session = session;
    this.line = line;
    this.spawner = spawner;
    this.onHit = onHit;
  }

  onPreUpdate = (_engine: Engine): void => {
    if (this.session.isGameOver) {
      return;
    }

    const pad = this.line.lineWidth / 2 + th.hitInflationPx;
    const pts = this.line.points;
    if (pts.length < 2) {
      return;
    }

    for (const gate of this.spawner.getGates()) {
      for (const box of gate.getWallHitBoxes(pad)) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          if (segmentIntersectsAabb(a.x, a.y, b.x, b.y, box.left, box.top, box.right, box.bottom)) {
            this.session.isGameOver = true;
            this.onHit();
            return;
          }
        }
      }
    }
  };
}
