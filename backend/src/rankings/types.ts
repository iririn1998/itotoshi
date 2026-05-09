/**
 * D1 の rankings テーブルから取得する 1 行分のデータ。
 */
export type RankingRow = {
  id: number;
  display_name: string;
  score: number;
  created_at: number;
};

/**
 * 順位計算 SQL が返す 1 行分のデータ。
 */
export type RankRow = {
  rank: number;
};

/**
 * ランキング作成前に検証と正規化を終えた入力値。
 */
export type ValidRankingInput = {
  displayName: string;
  score: number;
};

/**
 * ランキング API が利用する Workers Binding。
 */
export type RankingsEnv = {
  Bindings: {
    DB: D1Database;
  };
};
