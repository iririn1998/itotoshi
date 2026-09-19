# Issue #10 テスト導入前の基準

対象コミット: `520a5f1`。2026-09-19、macOSで `mise.toml` の Node 24.18.1 / pnpm 10.24.0 を使用。
`mise exec -- pnpm install --frozen-lockfile` の成功後、ソース・設定変更前に実行した結果。

| コマンド（mise exec -- 経由） | 終了コード | 結果                                                    |
| ----------------------------- | ---------- | ------------------------------------------------------- |
| `pnpm build`                  | 0          | backend の型検査、game の型検査と Vite ビルドに成功     |
| `pnpm lint`                   | 0          | backend 8ファイル、game 20ファイル。警告・エラーともに0 |
| `pnpm format:check`           | 0          | 46ファイルの書式に問題なし                              |

既存の警告: game の圧縮後JSが500 kBを超える（507.70 kB、gzip 131.21 kB）。
依存インストール時に esbuild / lefthook / sharp / workerd の build script を無視した旨の警告あり。
上記の検査はすべて成功した。

## 追加したテストの実行

- `pnpm test`: game/backend の Vitest を単発実行。
- `pnpm --filter @itotoshi/game test`: 当たり判定の境界値。
- `pnpm --filter @itotoshi/backend test`: 入力検証、limit、Content-Type、CORS、順位規則。

順位テストは Miniflare の一時的なローカルD1で、本番と同じマイグレーションとリポジトリSQLを実行する。
CloudflareへのログインやリモートDBは不要。テストごとに行を削除し、終了時にランタイムを破棄する。

参照: [Vitest](https://vitest.dev/guide/)、[Miniflare D1](https://developers.cloudflare.com/workers/testing/miniflare/storage/d1/)。
