import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRanking, listRankings } from "./repository";

describe("ranking repository with local D1", () => {
  let mf: Miniflare;
  let db: D1Database;

  beforeAll(async () => {
    mf = new Miniflare({
      modules: true,
      script: "export default { fetch() { return new Response('ok'); } }",
      compatibilityDate: "2026-05-07",
      d1Databases: ["DB"],
    });
    db = await mf.getD1Database("DB");
    const migration = await readFile(
      new URL("../../migrations/0001_create_rankings.sql", import.meta.url),
      "utf8",
    );
    // D1 exec expects each statement on a single line.
    await db.exec(migration.replace(/\n/g, " "));
  });
  beforeEach(async () => {
    await db.prepare("DELETE FROM rankings").run();
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await mf?.dispose();
  });

  it("returns an empty list for an empty database", async () => {
    expect(await listRankings(db, 50)).toEqual([]);
  });

  it("sorts by score descending, time ascending, then ID ascending before limiting", async () => {
    // Deliberately insert in a different order from the expected ranking.
    for (const [id, score, time] of [
      [40, 100, 2000],
      [30, 100, 1000],
      [20, 200, 3000],
      [10, 100, 1000],
      [50, 0, 0],
    ]) {
      await db
        .prepare("INSERT INTO rankings (id, display_name, score, created_at) VALUES (?, ?, ?, ?)")
        .bind(id, `player-${id}`, score, time)
        .run();
    }
    const expected = [
      { id: 20, rank: 1, displayName: "player-20", score: 200, createdAt: 3000 },
      { id: 10, rank: 2, displayName: "player-10", score: 100, createdAt: 1000 },
      { id: 30, rank: 3, displayName: "player-30", score: 100, createdAt: 1000 },
      { id: 40, rank: 4, displayName: "player-40", score: 100, createdAt: 2000 },
      { id: 50, rank: 5, displayName: "player-50", score: 0, createdAt: 0 },
    ];
    expect(await listRankings(db, 50)).toEqual(expected);
    expect(await listRankings(db, 3)).toEqual(expected.slice(0, 3));
    expect(await listRankings(db, 50)).toEqual(expected);
  });

  it("returns the same global rank on creation as listing, including exact ties", async () => {
    const now = vi.spyOn(Date, "now");
    const inputs = [
      { score: 100, time: 2000, rank: 1 },
      { score: 200, time: 3000, rank: 1 },
      { score: 100, time: 1000, rank: 2 },
      { score: 100, time: 1000, rank: 3 },
      { score: 100, time: 3000, rank: 5 },
      { score: 0, time: 0, rank: 6 },
    ];
    for (const { score, time, rank } of inputs) {
      now.mockReturnValue(time);
      const entry = await createRanking(db, { displayName: "日本語😀", score });
      expect(entry).toEqual({
        id: expect.any(Number),
        rank,
        displayName: "日本語😀",
        score,
        createdAt: time,
      });
      const listed = await listRankings(db, 100);
      expect(listed.find((row) => row.id === entry.id)).toEqual(entry);
    }
  });
});
