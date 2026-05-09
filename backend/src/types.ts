/**
 * Cloudflare Workers から渡される環境バインディング。
 */
export type BackendEnv = {
  Bindings: {
    DB: D1Database;
    RANKING_ALLOWED_ORIGINS?: string;
  };
};
