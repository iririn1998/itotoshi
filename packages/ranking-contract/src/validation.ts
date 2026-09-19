import {
  DEFAULT_RANKING_LIMIT,
  isApiErrorCode,
  type RankingEntry,
  type GetRankingsResponse,
  type CreateRankingResponse,
  type ApiErrorResponse,
  DISPLAY_NAME_MAX_LENGTH,
  MAX_RANKING_LIMIT,
  RANKING_SCORE_MAX,
  type CreateRankingRequest,
} from "./contract";

/**
 * limit クエリを API 内部で使う件数へ変換する。
 *
 * 省略時はデフォルト件数を使い、上限を超える値は最大件数へ丸める。
 * 正の整数として解釈できない値は null を返す。
 */
export const parseLimit = (limitValue: unknown): number | null => {
  if (limitValue === null || limitValue === "") {
    return DEFAULT_RANKING_LIMIT;
  }

  if (typeof limitValue !== "string") return null;

  const limit = Number(limitValue);

  if (!Number.isInteger(limit) || limit <= 0) {
    return null;
  }

  return Math.min(limit, MAX_RANKING_LIMIT);
};

/**
 * POST /api/rankings の入力を保存可能な値へ正規化する。
 *
 * displayName は trim 後に必須・文字数上限を検証し、score は非負整数と上限を検証する。
 */
export const validateCreateRankingRequest = (body: unknown): CreateRankingRequest | string => {
  if (!isRecord(body) || typeof body.displayName !== "string") {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIntegerAtLeast = (value: unknown, minimum: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;

/** Validate response values without normalizing malformed server data. */
export const isRankingEntry = (value: unknown): value is RankingEntry => {
  if (!isRecord(value)) return false;
  const input = validateCreateRankingRequest(value);
  return (
    typeof input !== "string" &&
    input.displayName === value.displayName &&
    isIntegerAtLeast(value.id, 1) &&
    isIntegerAtLeast(value.rank, 1) &&
    isIntegerAtLeast(value.createdAt, 0)
  );
};

export const parseGetRankingsResponse = (value: unknown): GetRankingsResponse | null => {
  if (
    !isRecord(value) ||
    !Array.isArray(value.rankings) ||
    value.rankings.length > MAX_RANKING_LIMIT ||
    !value.rankings.every(isRankingEntry)
  )
    return null;
  return { rankings: value.rankings };
};

export const parseCreateRankingResponse = (value: unknown): CreateRankingResponse | null => {
  if (!isRecord(value) || !isRankingEntry(value.ranking)) return null;
  return { ranking: value.ranking };
};

export const parseApiErrorResponse = (value: unknown): ApiErrorResponse | null => {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  const { code, message } = value.error;
  if (typeof code !== "string" || !isApiErrorCode(code) || typeof message !== "string") return null;
  return { error: { code, message } };
};
