/** ゲームプレイ中の共有状態（ゲームオーバーで更新ループを止めるなど） */
export class GameplaySession {
  isGameOver = false;
  /** 現在のスコア */
  score = 0;

  private readonly scoreChangeListeners = new Set<(score: number) => void>();

  /** スコア変更時に呼ばれるリスナーを登録する */
  addScoreChangeListener(listener: (score: number) => void): void {
    this.scoreChangeListeners.add(listener);
  }

  /** {@link addScoreChangeListener} で登録したリスナーを解除する */
  removeScoreChangeListener(listener: (score: number) => void): void {
    this.scoreChangeListeners.delete(listener);
  }

  private notifyScoreChange(): void {
    const { score } = this;
    for (const listener of this.scoreChangeListeners) {
      listener(score);
    }
  }

  /** スコアを delta だけ加算し、登録済みリスナーに通知する */
  addScore(delta: number): void {
    this.score += delta;
    this.notifyScoreChange();
  }

  reset(): void {
    this.isGameOver = false;
    this.score = 0;
    this.notifyScoreChange();
  }
}
