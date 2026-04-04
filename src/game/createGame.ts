import { createEngine } from "./engine";
import { GameScene } from "./sceneKeys";
import { GameplayScene } from "./scenes/GameplayScene";
import { TitleScene } from "./scenes/TitleScene";

/**
 * ゲームエンジンを初期化し、必要なシーンを登録して返します。
 */
export const createGame = () => {
  const game = createEngine();
  game.addScene(GameScene.title, new TitleScene());
  game.addScene(GameScene.gameplay, new GameplayScene());
  return game;
};
