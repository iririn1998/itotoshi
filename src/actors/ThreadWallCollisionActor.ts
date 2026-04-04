import { Actor, type Engine } from "excalibur";
import { GameplaySession } from "../game/GameplaySession";
import { segmentIntersectsAabb } from "../game/geometry/segmentAabb";
import { tuning } from "../game/tuning";
import { LineActor } from "./LineActor";
import { ThreadHoleSpawnerActor } from "./ThreadHoleSpawnerActor";

const th = tuning.threadHoles;

/**
 * 軌跡セグメントと壁当たりを検査し、接触時にセッションをゲームオーバーにする。
 * ゲート右端を隙間の Y 範囲内で左から右へ跨いだときにスコアを加算する。
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

    const p1 = pts[pts.length - 2]!;
    const p2 = pts[pts.length - 1]!;

    for (const gate of this.spawner.getGates()) {
      for (const box of gate.getWallHitBoxes(pad)) {
        if (
          segmentIntersectsAabb(p1.x, p1.y, p2.x, p2.y, box.left, box.top, box.right, box.bottom)
        ) {
          this.session.isGameOver = true;
          this.onHit();
          return;
        }
      }
    }

    for (const gate of this.spawner.getGates()) {
      if (gate.passScored) {
        continue;
      }
      const x0 = p1.x;
      const x1 = p2.x;
      const exitX = gate.pos.x + th.wallThicknessX;
      if (x0 >= exitX || x1 < exitX) {
        continue;
      }
      const dx = x1 - x0;
      if (dx <= 0) {
        continue;
      }
      const t = (exitX - x0) / dx;
      const yAt = p1.y + t * (p2.y - p1.y);
      const { minY, maxY } = gate.getGapYRange();
      if (yAt >= minY && yAt <= maxY) {
        gate.passScored = true;
        this.session.addScore(1);
      }
    }
  };
}
