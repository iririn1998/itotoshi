import { type Engine, Scene } from "excalibur";
import { LineActor } from "../../actors/LineActor";
import { FollowCameraActor } from "../FollowCameraActor";

/** ゲーム本編のメインシーン */
export class GameplayScene extends Scene {
  onInitialize = (_engine: Engine): void => {
    const lineActor = new LineActor();
    this.add(lineActor);
    this.add(new FollowCameraActor(lineActor));
  };
}
