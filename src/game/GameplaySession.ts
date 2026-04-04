/** ゲームプレイ中の共有状態（ゲームオーバーで更新ループを止めるなど） */
export class GameplaySession {
  isGameOver = false;
  /** 現在のスコア */
  score = 0;

  private onScoreChange: ((score: number) => void) | null = null;

  /** スコアが変わったときに呼ぶコールバックを登録する（null で解除） */
  setScoreChangeHandler(handler: ((score: number) => void) | null): void {
    this.onScoreChange = handler;
  }

  /** スコアを delta だけ加算し、登録済みハンドラに通知する */
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
