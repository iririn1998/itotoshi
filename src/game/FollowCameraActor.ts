import { Actor, Engine, Vector } from "excalibur";
import { tuning } from "./tuning";

const camTuning = tuning.camera;

/** カメラが追うワールド上の点（例: {@link LineActor} の先端） */
export type CameraFollowTarget = {
  headPos: Vector;
};

/**
 * シーンカメラの位置だけを更新するリグ。プレイヤー系 Actor からカメラ操作を切り離す。
 * 追従対象の移動後に実行されるよう、シーンへの追加順を追従対象より後にすること。
 */
export class FollowCameraActor extends Actor {
  private readonly followTarget: CameraFollowTarget;

  constructor(followTarget: CameraFollowTarget) {
    super();
    this.followTarget = followTarget;
  }

  onPreUpdate = (engine: Engine) => {
    engine.currentScene.camera.pos.setTo(
      this.followTarget.headPos.x + camTuning.lookaheadX,
      camTuning.fixedWorldY,
    );
  };
}
