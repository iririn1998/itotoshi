---
name: implementation-policy
description: >-
  Defines itotoshi repository implementation policy (実装方針). Use when
  writing or refactoring TypeScript/JavaScript in this game project, including
  exports, helpers, and class members that are function-valued.
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
