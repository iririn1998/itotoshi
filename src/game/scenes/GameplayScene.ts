import { type Engine, Scene } from "excalibur";
import { LineActor } from "../../actors/LineActor";
import { ThreadHoleSpawnerActor } from "../../actors/ThreadHoleSpawnerActor";
import { ThreadWallCollisionActor } from "../../actors/ThreadWallCollisionActor";
import { FollowCameraActor } from "../FollowCameraActor";
import { GameplaySession } from "../GameplaySession";

/** ゲーム本編のメインシーン */
export class GameplayScene extends Scene {
  readonly session = new GameplaySession();

  private lineActor!: LineActor;
  private spawner!: ThreadHoleSpawnerActor;
  private onGameOverUi: (() => void) | null = null;

  /** DOM のゲームオーバー表示を登録（{@link bindShellUi} から1回だけ呼ぶ） */
  registerGameOverUi(handler: () => void): void {
    this.onGameOverUi = handler;
  }

  private readonly handleWallHit = (): void => {
    this.onGameOverUi?.();
  };

  /** プレイ状態を初期化（シーン入場・リトライ・タイトルへ戻る前の掃除） */
  resetRound(): void {
    this.session.reset();
    this.lineActor.resetToInitialState();
    this.spawner.resetState();
  }

  onInitialize = (_engine: Engine): void => {
    this.lineActor = new LineActor(this.session);
    this.spawner = new ThreadHoleSpawnerActor(this.session);
    this.add(this.lineActor);
    this.add(
      new ThreadWallCollisionActor(this.session, this.lineActor, this.spawner, this.handleWallHit),
    );
    this.add(new FollowCameraActor(this.lineActor, this.session));
    this.add(this.spawner);
  };

  onActivate = (): void => {
    this.resetRound();
  };

  onDeactivate = (): void => {
    this.resetRound();
  };
}
