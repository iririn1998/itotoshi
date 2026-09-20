import { Actor, vec, type Engine, type Vector } from "excalibur";
import { GameplaySession } from "../game/GameplaySession";
import { findFirstHit, findPassedGates } from "../game/collision/collision";
import type { CollisionGate } from "../game/collision/types";
import type { Segment } from "../game/geometry/types";
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

  onPreUpdate = (engine: Engine): void => {
    if (this.session.isGameOver) {
      return;
    }

    const pts = this.line.points;
    if (pts.length < 2) {
      return;
    }

    const segment: Segment = { start: pts[pts.length - 2]!, end: pts[pts.length - 1]! };
    const pad = this.line.lineWidth / 2 + th.hitInflationPx;
    const viewport = engine.currentScene.camera.viewport;
    const gates = this.spawner.getGates();
    const inputs: CollisionGate[] = gates.map((gate) => ({
      walls: gate.getWallHitBoxes(pad),
      exitX: gate.pos.x + th.wallThicknessX,
      gap: gate.getGapYRange(),
      passScored: gate.passScored,
    }));
    const hit = findFirstHit(
      segment,
      { top: viewport.top + pad, bottom: viewport.bottom - pad },
      inputs,
    );
    const passed = findPassedGates(segment, inputs, hit);

    if (hit !== null) {
      this.session.isGameOver = true;
      this.onHit(vec(hit.point.x, hit.point.y));
      return;
    }
    for (const index of passed) {
      gates[index]!.passScored = true;
      this.session.addScore(th.scorePerGapPass);
    }
  };
}
