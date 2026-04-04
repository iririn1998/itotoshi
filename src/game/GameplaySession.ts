/** ゲームプレイ中の共有状態（ゲームオーバーで更新ループを止めるなど） */
export class GameplaySession {
  isGameOver = false;
  score = 0;

  private onScoreChange: ((score: number) => void) | null = null;

  setScoreChangeHandler(handler: ((score: number) => void) | null): void {
    this.onScoreChange = handler;
  }

  addScore(delta: number): void {
    this.score += delta;
    this.onScoreChange?.(this.score);
  }

  reset(): void {
    this.isGameOver = false;
    this.score = 0;
    this.onScoreChange?.(this.score);
  }
}
