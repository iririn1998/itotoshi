# itotoshi

## Cloudflare Pages デプロイ

ゲームのフロントエンドは Vite の静的アプリとして `game/dist` から Cloudflare Pages にデプロイします。

公開 URL: https://itotoshi-game.pages.dev/

ランキング API:
https://itotoshi-backend.iririn199810710.workers.dev

```sh
pnpm install
pnpm run cloudflare:login
pnpm run deploy:game
```

Pages プロジェクト名は `itotoshi-game` です。設定はルートの `wrangler.toml` にあります。

Cloudflare Pages の Git 連携を使う場合は、プロジェクトルートをリポジトリルートにして、次の設定を使います。

- ビルドコマンド: `pnpm --filter @itotoshi/game run build`
- ビルド出力ディレクトリ: `game/dist`
- 環境変数: `VITE_RANKING_API_BASE=https://itotoshi-backend.iririn199810710.workers.dev`

## バックエンド

Backend Worker と D1 の操作は `backend` ワークスペースの領域です。

公開 URL: https://itotoshi-backend.iririn199810710.workers.dev

```sh
pnpm --filter @itotoshi/backend run db:migrate:remote
pnpm --filter @itotoshi/backend run deploy
```
