import { Hono } from "hono";

import {
  DEFAULT_RANKING_LIMIT,
  MAX_RANKING_LIMIT,
  createApiErrorResponse,
  type GetRankingsResponse,
  type RankingEntry,
} from "./contract";

type RankingRow = {
  id: number;
  display_name: string;
  score: number;
  created_at: number;
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
 * rank はクエリ結果の並び順をもとに、1 始まりの順位として付与する。
 */
const toRankingEntry = (row: RankingRow, index: number): RankingEntry => ({
  id: row.id,
  rank: index + 1,
  displayName: row.display_name,
  score: row.score,
  createdAt: row.created_at,
});

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
      rankings: result.results.map(toRankingEntry),
    };

    return c.json(response);
  } catch (error) {
    console.error("Failed to fetch rankings", error);
    return c.json(createApiErrorResponse("INTERNAL_ERROR", "Failed to fetch rankings"), 500);
  }
});
