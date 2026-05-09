/**
 * limit が省略されたときに返すランキング件数。
 */
export const DEFAULT_RANKING_LIMIT = 50;

/**
 * 1 回のリクエストで API が返すランキング件数の上限。
 */
export const MAX_RANKING_LIMIT = 100;

/**
 * ランキング API が受け付ける表示名の最大文字数。
 */
export const DISPLAY_NAME_MAX_LENGTH = 24;

/**
 * 送信スコアの上限。
 *
 * 明らかに不正な値をランキングから除外するための制限であり、
 * チート対策そのものではない。
 */
export const RANKING_SCORE_MAX = 999_999_999;

/**
 * API が返すランキング 1 件分のデータ。
 *
 * score 降順、createdAt 昇順、id 昇順の安定した並び順から rank を算出する。
 */
export type RankingEntry = {
  /** ランキング行の D1 主キー。 */
  id: number;
  /** 現在のレスポンス内での 1 始まりの順位。 */
  rank: number;
  /** サーバー側で trim と検証を行ったプレイヤー表示名。 */
  displayName: string;
  /** クライアントから送信された非負整数のスコア。 */
  score: number;
  /** サーバー側で記録した Unix ミリ秒タイムスタンプ。 */
  createdAt: number;
};

/**
 * GET /api/rankings の成功レスポンス。
 */
export type GetRankingsResponse = {
  rankings: RankingEntry[];
};

/**
 * POST /api/rankings の JSON リクエストボディ。
 */
export type CreateRankingRequest = {
  /** 必須の表示名。空白のみの値は拒否する。 */
  displayName: string;
  /** 必須の非負整数スコア。 */
  score: number;
};

/**
 * POST /api/rankings の成功レスポンス。
 */
export type CreateRankingResponse = {
  ranking: RankingEntry;
};

/**
 * バックエンド API が返す安定したエラーコード。
 */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INTERNAL_ERROR";

/**
 * バックエンド API の全エラーで使うレスポンス形式。
 */
export type ApiErrorResponse = {
  error: {
    /** 機械判定用の安定したエラーコード。 */
    code: ApiErrorCode;
    /** ログやフォールバック UI のための人間向け診断メッセージ。 */
    message: string;
  };
};

/**
 * 標準の API エラーレスポンスボディを生成する。
 */
export const createApiErrorResponse = (code: ApiErrorCode, message: string): ApiErrorResponse => ({
  error: {
    code,
    message,
  },
});
