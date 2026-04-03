import "./style.css";
import { Flags } from "excalibur";
import { LineActor } from "./actors/LineActor";
import { createEngine } from "./game/engine";
import { FollowCameraActor } from "./game/FollowCameraActor";

// WebGL の drawLine はセグメントごとの矩形描画になり、細い線だと「点が並ぶ」ように見えやすい。
// Canvas 2D で一本のパスとして stroke すると連続した線に見える。
Flags.useCanvasGraphicsContext();

const game = createEngine();
const lineActor = new LineActor();
game.add(lineActor);
game.add(new FollowCameraActor(lineActor));

game.start();
