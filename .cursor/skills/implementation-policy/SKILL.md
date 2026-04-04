---
name: implementation-policy
description: >-
  Defines itotoshi repository implementation policy (実装方針). Use when
  writing or refactoring TypeScript/JavaScript in this game project, including
  exports, helpers, class members that are function-valued, JSDoc comments, and
  constants (avoiding magic numbers, tuning placement).
---

# 実装方針

## アロー関数

- **モジュール直下の関数**は `function` 宣言ではなく、`const name = (...) =>` または `export const name = (...) =>` とする。
- **クラス内**でコールバックやライフサイクル（例: Excalibur の `onInitialize` / `onPreUpdate`）は、メソッド短縮形ではなく **プロパティにアローを代入**する形に揃える（`onInitialize = () => { ... };`）。
- **private の補助ロジック**も同様に `private foo = (...) => { ... };` でよい（`this` の束縛が安定する）。

### 例外

- **`constructor`** は言語上アローにできないため従来どおり。
- フレームワークが **`function` 宣言を前提にした API**（例: デコレータや特定の登録形式）を要求する場合のみ、その API に合わせる。

### 例

```typescript
// モジュール
export const createFoo = () => { /* ... */ };
const helper = (x: number) => x * 2;

// クラス
class Example extends Scene {
  onInitialize = (_engine: Engine): void => {
    /* ... */
  };
}
```

## JSDoc

- **言語**は本文・コメントともに **日本語**で統一する（既存ファイルに合わせる）。
- **付ける場所**
  - **エクスポート**する定数・関数・型・クラス、およびモジュールの役割が一読で分かるもの。
  - **チューニング値・物理量**（単位が分かりにくいものは `px` / `px/s²` などを本文に書く）。
  - **座標系や慣習**（例: Excalibur で y 正が下向き）など、型だけでは伝わらない前提。
- **書かない／薄くする**
  - 型シグネチャや名前で自明な `@param` / `@returns` の列挙は不要。意味・単位・副作用・前提があるときだけ補う。
  - 「何をしているか」がコードと同名で言い換えだけになるコメントは避ける（ユーザールールの「自明な docstring を増やさない」に合わせる）。
- **参照**は同一リポジトリ内のシンボルにつなぐとき **`{@link SymbolName}`** や **`{@link tuning.path.to.field}`** を使う（`tuning.ts` や Actor 相互参照で既存どおり）。
- **形式**: 1 行で足りるものは `/** ... */`、複文や箇条が必要なときだけ複数行ブロックを使う。

## 定数

- **マジックナンバーは使わない**。意味のある数値・文字列リテラルは **名前付き定数** か **設定オブジェクトのプロパティ** に寄せる（「なぜこの値か」がコード上で追えるようにする）。
- **ゲームのバランス・解像度・物理・カメラ・Actor 既定値** など、チューニングしうる値は主に **`tuning.ts` の `export const tuning`** に集約する。複数箇所で同じ意味の数値を直書きしない。
- **モジュール／ファイル専用の上限・閾値**（そのファイルのロジックに閉じるもの）は、ファイル先頭付近の **`const UPPER_SNAKE_CASE`** にまとめる（例: 走査上限）。
- **クラスに閉じる不変値**（最小点数・スクラッチ用の共有バッファなど）は **`private static readonly`** で保持する。外部に不要ならエクスポートしない。
- **列挙的な文字列やキー**は `as const` 付きオブジェクトや `const` リテラルで型を狭め、`GameScene` のように **一箇所で定義**して import して使う。
- **例外的にリテラルでよいもの**: `0` / `1` をインデックスや初期化の慣用として使う程度、`array.length - 1` のような構造から導かれる式。それでも **「設計上の意図」** を表す数（重力、マージン、ID 上限など）は定数化する。
