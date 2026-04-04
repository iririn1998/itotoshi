/**
 * エントリーポイント。エンジンの初期化と UI のバインドを行い、ゲームを開始します。
 */
import { Flags } from "excalibur";
import { createGame } from "./game/createGame";
import { GameScene } from "./game/sceneKeys";
import { bindShellUi } from "./ui/bindShellUi";

// WebGL の drawLine はセグメントごとの矩形描画になり、細い線だと「点が並ぶ」ように見えやすい。
// Canvas 2D で一本のパスとして stroke すると連続した線に見える。
Flags.useCanvasGraphicsContext();

const game = createGame();
bindShellUi(game);

void game.start(GameScene.title);
