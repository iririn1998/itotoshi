import { Actor, vec, type Engine, type Vector } from "excalibur";
import { GameplaySession } from "../game/GameplaySession";
import { segmentAabbClip, segmentAabbEntryT } from "../game/geometry/segmentAabb";
import { tuning } from "../game/tuning";
import { LineActor } from "./LineActor";
import { ThreadHoleSpawnerActor } from "./ThreadHoleSpawnerActor";

const th = tuning.threadHoles;
const vh = tuning.gameViewport.height;
/** 画面上下端の帯状 AABB を Liang–Barsky で切るときの十分大きな座標幅 */
const VIEWPORT_BORDER_EXTENT = 1e7;

/**
 * 軌跡セグメントと壁当たりを検査し、接触時にセッションをゲームオーバーにする。
 * ゲート右端を隙間の Y 範囲内で左から右へ跨いだときにスコアを加算する。
 */
export class ThreadWallCollisionActor extends Actor {
  private readonly session: GameplaySession;
  private readonly line: LineActor;
  private readonly spawner: ThreadHoleSpawnerActor;
  private readonly onHit: (hitWorldPos: Vector) => void;

  constructor(
    session: GameplaySession,
    line: LineActor,
    spawner: ThreadHoleSpawnerActor,
    onHit: (hitWorldPos: Vector) => void,
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

    const xMin = -VIEWPORT_BORDER_EXTENT;
    const xMax = VIEWPORT_BORDER_EXTENT;

    const topBorderClip = segmentAabbClip(
      p1.x,
      p1.y,
      p2.x,
      p2.y,
      xMin,
      -VIEWPORT_BORDER_EXTENT,
      xMax,
      pad,
    );
    const tTop = segmentAabbEntryT(topBorderClip);
    if (tTop !== null) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      this.session.isGameOver = true;
      this.onHit(vec(p1.x + tTop * dx, p1.y + tTop * dy));
      return;
    }

    const bottomBorderClip = segmentAabbClip(
      p1.x,
      p1.y,
      p2.x,
      p2.y,
      xMin,
      vh - pad,
      xMax,
      VIEWPORT_BORDER_EXTENT,
    );
    const tBottom = segmentAabbEntryT(bottomBorderClip);
    if (tBottom !== null) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      this.session.isGameOver = true;
      this.onHit(vec(p1.x + tBottom * dx, p1.y + tBottom * dy));
      return;
    }

    const gates = this.spawner.getGates();

    for (const gate of gates) {
      for (const box of gate.getWallHitBoxes(pad)) {
        const clip = segmentAabbClip(
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          box.left,
          box.top,
          box.right,
          box.bottom,
        );
        const tHit = segmentAabbEntryT(clip);
        if (tHit !== null) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          this.session.isGameOver = true;
          this.onHit(vec(p1.x + tHit * dx, p1.y + tHit * dy));
          return;
        }
      }
    }

    const x0 = p1.x;
    const x1 = p2.x;
    const dx = x1 - x0;
    if (dx > 0) {
      for (const gate of gates) {
        if (gate.passScored) {
          continue;
        }
        const exitX = gate.pos.x + th.wallThicknessX;
        if (x0 < exitX && x1 >= exitX) {
          const t = (exitX - x0) / dx;
          const yAt = p1.y + t * (p2.y - p1.y);
          const { minY, maxY } = gate.getGapYRange();
          if (yAt >= minY && yAt <= maxY) {
            gate.passScored = true;
            this.session.addScore(th.scorePerGapPass);
          }
        }
      }
    }
  };
}
