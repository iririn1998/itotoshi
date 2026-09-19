# itotoshi

## 開発環境

Node.js と pnpm は [mise](https://mise.jdx.dev/getting-started) で管理します。バージョンは `mise.toml` に固定しています。pnpm を更新するときは、`package.json` の `packageManager` も同じバージョンに更新してください。

mise をインストールし、利用するシェルで有効化した後、リポジトリルートで実行してください。以降は mise が管理する Node.js・pnpm を通常のコマンドで利用します。

```sh
mise trust
mise install
```

依存パッケージのインストールと検証は、リポジトリルートで実行してください。

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm build
pnpm test
```

`format:check` はルートの設定ファイルを含めて検査します。整形する場合は `pnpm format` を実行してください。生成物や依存パッケージは `.oxfmtrc.json` の設定で対象から除外しています。

`build` はゲームの型チェックと Vite ビルド、バックエンドと共有ランキング契約の型チェックを実行します。

`test` は game/backend と共有ランキング契約の境界値テストを実行します。実行範囲と導入前の検証結果は [テスト基準](docs/testing-baseline.md) を参照してください。

## ランキング API の共有契約

`packages/ranking-contract` (`@itotoshi/ranking-contract`) が request/response 型、エラーコード、表示名・スコア・取得件数の上限と runtime parser を定義します。backend/game はこの workspace に依存し、API の仕様変更はここから行います。TypeScript ソースを直接公開するため、個別の開発・ビルド前に共有パッケージの生成処理は不要です。

backend は JSON を `unknown` として読み、表示名の trim と入力検証を共有関数で行います。game は成功・エラーレスポンスを検証し、契約違反の成功レスポンスを `RankingApiError` として拒否します。不正なエラー形式や未知のエラーコードの場合は HTTP ステータスによる汎用メッセージを使います。追加フィールドは許可します。

表示名の契約上の長さは Unicode コードポイント単位です。HTML input の `maxLength` も共有定数から設定しますが、ブラウザの仕様では UTF-16 コード単位で数えるため、絵文字などの入力可能数は API の上限より少なくなる場合があります（従来の挙動を維持）。

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
