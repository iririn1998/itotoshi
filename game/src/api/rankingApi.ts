export type RankingEntry = {
  id: number;
  rank: number;
  displayName: string;
  score: number;
  createdAt: number;
};

export type GetRankingsResponse = {
  rankings: RankingEntry[];
};

export type CreateRankingRequest = {
  displayName: string;
  score: number;
};

export type CreateRankingResponse = {
  ranking: RankingEntry;
};

export const DISPLAY_NAME_MAX_LENGTH = 24;

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class RankingApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, options: { status: number; code?: string | null }) {
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

const parseJson = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
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

  let body: ApiErrorResponse | null = null;

  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    throw new RankingApiError(`Ranking API request failed with status ${response.status}`, {
      status: response.status,
    });
  }

  throw new RankingApiError(
    body?.error?.message ?? `Ranking API request failed with status ${response.status}`,
    {
      status: response.status,
      code: body?.error?.code,
    },
  );
};

export const getRankings = async (options: { limit?: number } = {}): Promise<RankingEntry[]> => {
  const searchParams = new URLSearchParams();
  if (options.limit !== undefined) {
    searchParams.set("limit", String(options.limit));
  }

  const response = await fetch(rankingApiUrl("/api/rankings", searchParams));
  await throwIfApiError(response);

  const body = await parseJson<GetRankingsResponse>(response);
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

  const body = await parseJson<CreateRankingResponse>(response);
  return body.ranking;
};
