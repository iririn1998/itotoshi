import type { RankingEntry } from "./contract";
import type { RankingRow, RankRow, ValidRankingInput } from "./types";

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
 * 指定件数のランキングを安定した順位順で取得する。
 *
 * 並び順は score DESC, created_at ASC, id ASC とし、同じ順序から rank を付与する。
 */
export const listRankings = async (db: D1Database, limit: number): Promise<RankingEntry[]> => {
  const result = await db
    .prepare(
      `SELECT id, display_name, score, created_at
       FROM rankings
       ORDER BY score DESC, created_at ASC, id ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all<RankingRow>();

  return result.results.map((row, index) => toRankingEntry(row, index + 1));
};

/**
 * ランキングを 1 件保存し、保存直後の全体順位付きで返す。
 *
 * created_at は呼び出し時点のサーバー時刻を Unix ミリ秒として記録する。
 */
export const createRanking = async (
  db: D1Database,
  rankingInput: ValidRankingInput,
): Promise<RankingEntry> => {
  const createdAt = Date.now();
  const createdRow = await db
    .prepare(
      `INSERT INTO rankings (display_name, score, created_at)
       VALUES (?, ?, ?)
       RETURNING id, display_name, score, created_at`,
    )
    .bind(rankingInput.displayName, rankingInput.score, createdAt)
    .first<RankingRow>();

  if (createdRow === null) {
    throw new Error("Failed to create ranking row");
  }

  const rank = await calculateRank(db, createdRow);

  return toRankingEntry(createdRow, rank);
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
