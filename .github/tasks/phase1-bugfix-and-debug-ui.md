# タスク: Phase1バグ修正＆デバッグUI追加

## 概要
ステージ選択後に操作不能になるバグを修正し、デバッグ用gameState表示欄を追加する。

## 根本原因（調査済み）

### 原因1（最重要）：AnimationDisplay.tsx のデッドロック
- `ReactUIBridge.waitUI()` が `hasAnimationInQueue()` をポーリングするが、キューが空にならない
- `AnimationDisplay.tsx` が `dequeueAnimation()` を呼ぶトリガーを持たないため、アニメーションが一度も再生されない
- キューにアイテムが溜まった状態のまま `waitUI()` が永久ループ

### 原因2：DomesticScreen.tsx のコマンド不足
- CommandPanel に `domesticCommands` のみ渡している
- BATTLE などの `actionCommands` がないと内政フェーズを終了できない
- **修正方針**: `input.commands`（GameManagerが既に準備済みの全コマンドリスト）を使う

---

## TODOリスト

| # | タスク名 | 状態 | 依存 | 内容 | 完了条件 |
|---|----------|------|------|------|----------|
| 1 | AnimationDisplay修正テスト | **完了** | なし | AnimationDisplay が dequeue→complete を自動処理することのテスト | テストが失敗する（Red） |
| 2 | DomesticScreen修正テスト | **完了** | なし | DomesticScreen が input.commands を使って全コマンドを表示するテスト | テストが失敗する（Red） |
| 3 | デバッグパネルテスト | **完了** | なし | App.tsx のサイドバーにgameState表示デバッグパネルが存在するテスト | テストが失敗する（Red） |
| 4 | テスト品質管理 | **完了** | 1,2,3 | quality-control によるテストコードレビュー | 品質チェック完了 |
| 5 | AnimationDisplay修正実装 | **完了** | 4 | useEffect で animationQueue を監視→dequeueAnimation、一定時間後にcompleteAnimation | テストが通る（Green） |
| 6 | DomesticScreen修正実装 | **完了** | 4 | input.context?.commands を CommandPanel に渡すよう修正（フォールバック付き） | テストが通る（Green） |
| 7 | デバッグパネル実装 | **完了** | 4 | App.tsx サイドバーに `<details>` タグ使用のデバッグパネルを追加 | テストが通る（Green） |
| 8 | 実装品質管理（logic-guard） | **完了** | 5,6,7 | ロジック整合性チェック | 品質チェック完了 |
| 9 | 実装品質管理（quality-control） | **完了** | 8 | コード品質チェック、vite-env.d.ts 作成 | 品質チェック完了 |
| 10 | 整合性チェック（cross-aligner） | **完了** | 9 | 全体整合性チェック、ReactUIBridge.ts の環境変数統一 | 品質チェック完了 |
