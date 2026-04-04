/** ゲームプレイ中の共有状態（ゲームオーバーで更新ループを止めるなど） */
export class GameplaySession {
  isGameOver = false;

  reset(): void {
    this.isGameOver = false;
  }
}
