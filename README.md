# itotoshi

## 開発環境と CI

Node.js と pnpm は [mise](https://mise.jdx.dev/getting-started) で管理します。バージョンは `mise.toml` に固定しており、GitHub Actions も同じ設定を使用します。pnpm を更新するときは、`package.json` の `packageManager` も同じバージョンに更新してください。

mise をインストールし、利用するシェルで有効化した後、リポジトリルートで実行してください。以降は mise が管理する Node.js・pnpm を通常のコマンドで利用します。

```sh
mise trust
mise install
```

GitHub Actions は PR の作成・更新と `main` への push 時に、mise による環境構築と依存インストールを行い、`parallel` ステップで lint・フォーマットチェック・ビルドを並列実行します。すべての完了を待ち、いずれかが失敗すると CI も失敗します。ローカルでもリポジトリルートで同じ検証を実行できます。

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm build
```

`format:check` はルートの設定ファイルや CI ワークフローを含めて検査します。整形する場合は `pnpm format` を実行してください。生成物や依存パッケージは `.oxfmtrc.json` の設定で対象から除外しています。

`build` はゲームの型チェックと Vite ビルド、バックエンドの型チェックを実行します。

## Cloudflare Pages デプロイ

ゲームのフロントエンドは Vite の静的アプリとして `game/dist` から Cloudflare Pages にデプロイします。

公開 URL: https://itotoshi-game.pages.dev/

ランキング API:
https://itotoshi-backend.iririn199810710.workers.dev

```sh
pnpm install
pnpm cloudflare:login
pnpm deploy:game
```

Pages プロジェクト名は `itotoshi-game` です。設定はルートの `wrangler.toml` にあります。

Cloudflare Pages の Git 連携を使う場合は、プロジェクトルートをリポジトリルートにして、次の設定を使います。

- ビルドコマンド: `pnpm --filter @itotoshi/game build`
- ビルド出力ディレクトリ: `game/dist`
- 環境変数: `VITE_RANKING_API_BASE=https://itotoshi-backend.iririn199810710.workers.dev`

## バックエンド

Backend Worker と D1 の操作は `backend` ワークスペースの領域です。

公開 URL: https://itotoshi-backend.iririn199810710.workers.dev

```sh
pnpm --filter @itotoshi/backend db:migrate:remote
pnpm --filter @itotoshi/backend deploy
```
