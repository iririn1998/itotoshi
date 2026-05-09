import { cors } from "hono/cors";

const configuredOriginSeparator = ",";

const localDevelopmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
] as const;

const toOrigin = (originValue: string): string | null => {
  const trimmedOrigin = originValue.trim();

  if (trimmedOrigin.length === 0) {
    return null;
  }

  try {
    return new URL(trimmedOrigin).origin;
  } catch {
    return null;
  }
};

const isOrigin = (origin: string | null): origin is string => origin !== null;

const createAllowedOriginSet = (configuredOrigins: string | undefined): Set<string> =>
  new Set(
    [...localDevelopmentOrigins, ...(configuredOrigins ?? "").split(configuredOriginSeparator)]
      .map(toOrigin)
      .filter(isOrigin),
  );

const findAllowedOrigin = (
  requestOriginValue: string,
  configuredOrigins: string | undefined,
): string | undefined => {
  const requestOrigin = toOrigin(requestOriginValue);

  if (requestOrigin === null) {
    return undefined;
  }

  if (!createAllowedOriginSet(configuredOrigins).has(requestOrigin)) {
    return undefined;
  }

  return requestOrigin;
};

/**
 * 本番は game 側の VITE_RANKING_API_BASE から Worker を直接呼び、CORS で許可元を固定する。
 */
export const apiCors = cors({
  origin: (origin, c) => findAllowedOrigin(origin, c.env.RANKING_ALLOWED_ORIGINS),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 86_400,
});
