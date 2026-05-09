import { Hono } from "hono";

import {
  DEFAULT_RANKING_LIMIT,
  DISPLAY_NAME_MAX_LENGTH,
  MAX_RANKING_LIMIT,
  RANKING_SCORE_MAX,
  createApiErrorResponse,
  type CreateRankingRequest,
  type CreateRankingResponse,
  type GetRankingsResponse,
  type RankingEntry,
} from "./contract";

type RankingRow = {
  id: number;
  display_name: string;
  score: number;
  created_at: number;
};

type RankRow = {
  rank: number;
};

type ValidRankingInput = {
  displayName: string;
  score: number;
};

type RankingsEnv = {
  Bindings: {
    DB: D1Database;
  };
};

/**
 * ランキング API の Hono ルート。
 *
 * GET /api/rankings でランキング一覧を返す。順位はスコア降順、登録日時昇順、
 * ID 昇順の安定した順序から算出する。
 */
export const rankingsRoute = new Hono<RankingsEnv>();

const limitSearchParamName = "limit";

/**
 * limit クエリを API 内部で使う件数へ変換する。
 *
 * 省略時はデフォルト件数を使い、上限を超える値は最大件数へ丸める。
 * 正の整数として解釈できない値は null を返す。
 */
const parseLimit = (limitValue: string | null): number | null => {
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
 * D1 のランキング行を API レスポンス用の camelCase 形式へ変換する。
 *
 * rank は呼び出し元で計算済みの 1 始まり順位を使う。
 */
const toRankingEntry = (row: RankingRow, rank: number): RankingEntry => ({
  id: row.id,
  rank,
  displayName: row.display_name,
  score: row.score,
  createdAt: row.created_at,
});

/**
 * Content-Type が JSON として受け付けられるか判定する。
 *
 * charset 付きの application/json と、+json サフィックスを持つメディアタイプを許可する。
 */
const isJsonContentType = (contentType: string | undefined): boolean => {
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
const validateCreateRankingRequest = (
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

/**
 * 指定した行が現在のランキング全体で何位かを算出する。
 *
 * GET と同じ score DESC, created_at ASC, id ASC の順序で、対象行より前に来る件数から順位を求める。
 */
const calculateRank = async (db: D1Database, row: RankingRow): Promise<number> => {
  const rankRow = await db
    .prepare(
      `SELECT COUNT(*) + 1 AS rank
       FROM rankings
       WHERE score > ?
          OR (score = ? AND created_at < ?)
          OR (score = ? AND created_at = ? AND id < ?)`,
    )
    .bind(row.score, row.score, row.created_at, row.score, row.created_at, row.id)
    .first<RankRow>();

  if (rankRow === null) {
    throw new Error("Failed to calculate ranking position");
  }

  return rankRow.rank;
};

rankingsRoute.get("/", async (c) => {
  const limit = parseLimit(c.req.query(limitSearchParamName) ?? null);

  if (limit === null) {
    return c.json(createApiErrorResponse("BAD_REQUEST", "limit must be a positive integer"), 400);
  }

  try {
    const result = await c.env.DB.prepare(
      `SELECT id, display_name, score, created_at
       FROM rankings
       ORDER BY score DESC, created_at ASC, id ASC
       LIMIT ?`,
    )
      .bind(limit)
      .all<RankingRow>();

    const response: GetRankingsResponse = {
      rankings: result.results.map((row, index) => toRankingEntry(row, index + 1)),
    };

    return c.json(response);
  } catch (error) {
    console.error("Failed to fetch rankings", error);
    return c.json(createApiErrorResponse("INTERNAL_ERROR", "Failed to fetch rankings"), 500);
  }
});

rankingsRoute.post("/", async (c) => {
  if (!isJsonContentType(c.req.header("content-type"))) {
    return c.json(
      createApiErrorResponse("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json"),
      415,
    );
  }

  let body: Partial<CreateRankingRequest> | null;

  try {
    body = await c.req.json<Partial<CreateRankingRequest>>();
  } catch {
    return c.json(createApiErrorResponse("INVALID_JSON", "Request body must be valid JSON"), 400);
  }

  const rankingInput = validateCreateRankingRequest(body);

  if (typeof rankingInput === "string") {
    return c.json(createApiErrorResponse("BAD_REQUEST", rankingInput), 400);
  }

  try {
    const createdAt = Date.now();
    const createdRow = await c.env.DB.prepare(
      `INSERT INTO rankings (display_name, score, created_at)
       VALUES (?, ?, ?)
       RETURNING id, display_name, score, created_at`,
    )
      .bind(rankingInput.displayName, rankingInput.score, createdAt)
      .first<RankingRow>();

    if (createdRow === null) {
      throw new Error("Failed to create ranking row");
    }

    const rank = await calculateRank(c.env.DB, createdRow);
    const response: CreateRankingResponse = {
      ranking: toRankingEntry(createdRow, rank),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error("Failed to create ranking", error);
    return c.json(createApiErrorResponse("INTERNAL_ERROR", "Failed to create ranking"), 500);
  }
});
