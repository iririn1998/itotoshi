/** Excalibur のシーン名（ルーティング用） */
export const GameScene = {
  title: "title",
  gameplay: "gameplay",
} as const;

/** `GameScene` の値に対応するシーン名の型 */
export type GameSceneName = (typeof GameScene)[keyof typeof GameScene];
