import {
  DEFAULT_RANKING_LIMIT,
  DISPLAY_NAME_MAX_LENGTH,
  MAX_RANKING_LIMIT,
  RANKING_SCORE_MAX,
  type CreateRankingRequest,
} from "./contract";
import type { ValidRankingInput } from "./types";

/**
 * limit クエリを API 内部で使う件数へ変換する。
 *
 * 省略時はデフォルト件数を使い、上限を超える値は最大件数へ丸める。
 * 正の整数として解釈できない値は null を返す。
 */
export const parseLimit = (limitValue: string | null): number | null => {
  if (limitValue === null || limitValue === "") {
    return DEFAULT_RANKING_LIMIT;
  }

  const limit = Number(limitValue);

  if (!Number.isInteger(limit) || limit <= 0) {
    return null;
  }

  return Math.min(limit, MAX_RANKING_LIMIT);
};

/**
 * Content-Type が JSON として受け付けられるか判定する。
 *
 * charset 付きの application/json と、+json サフィックスを持つメディアタイプを許可する。
 */
export const isJsonContentType = (contentType: string | undefined): boolean => {
  if (contentType === undefined) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();

  return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
};

/**
 * POST /api/rankings の入力を保存可能な値へ正規化する。
 *
 * displayName は trim 後に必須・文字数上限を検証し、score は非負整数と上限を検証する。
 */
export const validateCreateRankingRequest = (
  body: Partial<CreateRankingRequest> | null,
): ValidRankingInput | string => {
  if (body === null || typeof body.displayName !== "string") {
    return "displayName is required";
  }

  const displayName = body.displayName.trim();

  if (displayName.length === 0) {
    return "displayName is required";
  }

  if (Array.from(displayName).length > DISPLAY_NAME_MAX_LENGTH) {
    return `displayName must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`;
  }

  if (typeof body.score !== "number" || !Number.isInteger(body.score)) {
    return "score must be an integer";
  }

  if (body.score < 0) {
    return "score must be non-negative";
  }

  if (body.score > RANKING_SCORE_MAX) {
    return `score must be ${RANKING_SCORE_MAX} or less`;
  }

  return {
    displayName,
    score: body.score,
  };
};
