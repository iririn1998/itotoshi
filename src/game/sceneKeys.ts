/** Excalibur のシーン名（ルーティング用） */
export const GameScene = {
  title: "title",
  gameplay: "gameplay",
} as const;

export type GameSceneName = (typeof GameScene)[keyof typeof GameScene];
