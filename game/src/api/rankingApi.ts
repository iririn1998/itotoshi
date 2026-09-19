import {
  parseApiErrorResponse,
  parseCreateRankingResponse,
  parseGetRankingsResponse,
  type ApiErrorCode,
  type CreateRankingRequest,
  type CreateRankingResponse,
  type RankingEntry,
} from "@itotoshi/ranking-contract";

export class RankingApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | null;

  constructor(message: string, options: { status: number; code?: ApiErrorCode | null }) {
    super(message);
    this.name = "RankingApiError";
    this.status = options.status;
    this.code = options.code ?? null;
  }
}

const rankingApiBase = (import.meta.env.VITE_RANKING_API_BASE ?? "").trim().replace(/\/+$/, "");

const rankingApiPath = (path: string): string => `${rankingApiBase}${path}`;

const rankingApiUrl = (path: string, searchParams?: URLSearchParams): string => {
  const url = rankingApiPath(path);
  const query = searchParams?.toString();

  return query ? `${url}?${query}` : url;
};

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    throw new RankingApiError("API response was not valid JSON", {
      status: response.status,
    });
  }
};

const throwIfApiError = async (response: Response): Promise<void> => {
  if (response.ok) {
    return;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    // Non-JSON proxy/server errors use the same safe HTTP-status fallback.
  }

  const body = parseApiErrorResponse(json);
  throw new RankingApiError(
    body?.error.message ?? `Ranking API request failed with status ${response.status}`,
    { status: response.status, code: body?.error.code },
  );
};

const throwInvalidResponse = (response: Response): never => {
  throw new RankingApiError("API response did not match the ranking contract", {
    status: response.status,
  });
};

export const getRankings = async (options: { limit?: number } = {}): Promise<RankingEntry[]> => {
  const searchParams = new URLSearchParams();
  if (options.limit !== undefined) {
    searchParams.set("limit", String(options.limit));
  }

  const response = await fetch(rankingApiUrl("/api/rankings", searchParams));
  await throwIfApiError(response);

  const body = parseGetRankingsResponse(await parseJson(response));
  if (body === null) return throwInvalidResponse(response);
  return body.rankings;
};

export const createRanking = async (
  ranking: CreateRankingRequest,
): Promise<CreateRankingResponse["ranking"]> => {
  const response = await fetch(rankingApiPath("/api/rankings"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ranking),
  });
  await throwIfApiError(response);

  const body = parseCreateRankingResponse(await parseJson(response));
  if (body === null) return throwInvalidResponse(response);
  return body.ranking;
};
