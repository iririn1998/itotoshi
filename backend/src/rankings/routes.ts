import { Hono } from "hono";

import {
  createApiErrorResponse,
  type CreateRankingRequest,
  type CreateRankingResponse,
  type GetRankingsResponse,
} from "./contract";
import { createRanking, listRankings } from "./repository";
import type { RankingsEnv } from "./types";
import { isJsonContentType, parseLimit, validateCreateRankingRequest } from "./validation";

/**
 * ランキング API の Hono ルート。
 *
 * GET /api/rankings でランキング一覧を返す。順位はスコア降順、登録日時昇順、
 * ID 昇順の安定した順序から算出する。
 */
export const rankingsRoute = new Hono<RankingsEnv>();

const limitSearchParamName = "limit";

rankingsRoute.get("/", async (c) => {
  const limit = parseLimit(c.req.query(limitSearchParamName) ?? null);

  if (limit === null) {
    return c.json(createApiErrorResponse("BAD_REQUEST", "limit must be a positive integer"), 400);
  }

  try {
    const response: GetRankingsResponse = {
      rankings: await listRankings(c.env.DB, limit),
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
    const response: CreateRankingResponse = {
      ranking: await createRanking(c.env.DB, rankingInput),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error("Failed to create ranking", error);
    return c.json(createApiErrorResponse("INTERNAL_ERROR", "Failed to create ranking"), 500);
  }
});
