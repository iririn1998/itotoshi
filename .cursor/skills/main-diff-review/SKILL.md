---
name: main-diff-review
description: >-
  Compares the current branch to main, checks alignment with itotoshi
  implementation policy, evaluates best practices and potential bugs, and writes
  review.md at the repository root. Use when the user asks for a code review
  against main, PR review, branch diff review, or generating review.md.
---

# main 差分レビュー（review.md 出力）

## 目的

`main`（なければ `origin/main`）との差分を基に、(1) 実装方針の逸脱の有無、(2) ベストプラクティス、(3) バグ・リスクを整理し、**リポジトリ直下の `review.md`** にまとめる。

## 事前に読むもの

- 差分対象のソース・設定の変更箇所（必要なら周辺も読む）
- 本リポジトリの実装方針: [.cursor/skills/implementation-policy/SKILL.md](../implementation-policy/SKILL.md)

## 手順

1. **ベースの確定**
   - `git merge-base main HEAD` または `origin/main` が取れるなら `git diff main...HEAD`（3 点）で一覧する。`main` が無い場合は `origin/main` にフォールバック。
   - 変更ファイル一覧: `git diff main...HEAD --stat` と `git log main..HEAD --oneline` を参照する。

2. **実装方針の確認（最初に書くセクション）**
   - implementation-policy（アロー関数・JSDoc・定数/tuning 集約など）に反する変更がないか。
   - コミットメッセージや PR 説明・関連ドキュメントに「意図した方針」が書かれていれば、差分がその方針と一致しているかを短く対応づける。
   - **逸脱なし**ならその旨を明示。**あり**なら、どのファイルのどの点か、推奨の直し方を一行で添える。

3. **ベストプラクティス**
   - 型安全、エラーハンドリング、テスト有無、パフォーマンス・可読性、フレームワーク（Excalibur 等）の使い方が妥当か。
   - プロジェクト既存パターンと矛盾する新規パターンがあれば指摘する。

4. **バグ・リスク**
   - 境界条件、非同期・ライフサイクル、null/undefined、イベントリーク、状態の不整合など。
   - 推測で断定しない。根拠はファイル名・関数名・差分行為に紐づける。

5. **出力**
   - リポジトリルートに **`review.md`** を書く（ユーザーが別パスを指定した場合はそのパス）。
   - 日本語で、見出しは下記テンプレに従う。

## review.md テンプレート

```markdown
# レビュー（`main` との差分）

## 概要

- 比較基準: `main`（または `origin/main`）
- 変更の要約: （1〜3 文）

## 実装方針との整合

（逸脱の有無・該当箇所・推奨対応）

## ベストプラクティス

（良い点 / 改善提案。箇条書き）

## バグ・リスク

（なければ「特になし」と明記。あれば重要度付き）

## まとめ

（マージ前に必須の修正があるか、任意の改善か）
```

## 注意

- **実行は実環境で行う**: `git` の結果を自分で取得し、推測だけのレビューにしない。
- ユーザーが「agent」「レビュー」「main との差分」「review.md」と言ったときは本スキルに従う。
