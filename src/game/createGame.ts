import { createEngine } from "./engine";
import { GameScene } from "./sceneKeys";
import { GameplayScene } from "./scenes/GameplayScene";
import { TitleScene } from "./scenes/TitleScene";

/**
 * ゲームエンジンを初期化し、必要なシーンを登録して返します。
 */
export const createGame = (): {
  game: ReturnType<typeof createEngine>;
  gameplayScene: GameplayScene;
} => {
  const game = createEngine();
  const gameplayScene = new GameplayScene();
  game.addScene(GameScene.title, new TitleScene());
  game.addScene(GameScene.gameplay, gameplayScene);
  return { game, gameplayScene };
};
