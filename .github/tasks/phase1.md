# Phase 1: 最小限の動作実装（MVP）タスク管理

**目標**: ゲームが最初から最後まで通してプレイできる状態にする

---

## タスク一覧

### 1-3. UnitCard改善（バグ修正含む）
- **着手状態**: 完了
- **依存関係**: Phase 0（完了済み）
- **タスク内容**:
  - 🔴 バグ修正: `unit.skill.name` → `MasterData.getSkill(skillId).name` に修正（try-catchでフォールバック必須）
  - HPバーの視覚化: `(currentHP / maxHP) * 100%` で幅制御、割合に応じて色変化（緑/黄/赤）
  - maxHPがゼロの場合の除算ゼロ対策
  - ポジション（前衛/中衛/後衛/ベンチ）のラベル表示
  - スキル名・スキル情報のホバー表示
  - 戦闘不能（currentHP === 0）の視覚的区別
- **完了条件**:
  - TypeScriptコンパイルエラーがない
  - HPバーが正しく表示される
  - スキル名が正しく表示される（SkillMasterからルックアップ）
  - ポジションが表示される
  - テストが全てパスする
- **優先度**: 🔴 最高（バグ修正が必要）
- **テスト観点**:
  - スキルIDからスキル名を正しく取得できる
  - HPバーの幅が正しい割合になる
  - maxHP=0の場合にクラッシュしない
  - currentHP=0の場合に戦闘不能表示になる

---

### 1-2. ゲーム状態の可視化
- **着手状態**: 完了
- **依存関係**: Phase 0（完了済み）
- **タスク内容**:
  - `PhaseDisplay` に `maxRound`, `currentNationName` props を追加
  - `GameBoard` から `round` と `maxRound` を `PhaseDisplay` に渡す
  - 手番プレイヤーを番号ではなく国家名で表示
  - `isCurrentTurn` ハイライト用CSSクラスの定義
  - フェーズ遷移アニメーション（useState + CSS クラスで実装）
- **完了条件**:
  - 「ラウンド x/y」形式で表示される
  - 手番プレイヤーが国家名で表示される
  - 手番プレイヤーが視覚的にハイライトされる
  - テストが全てパスする
- **優先度**: 🟡 中
- **テスト観点**:
  - maxRoundとroundが正しく表示される
  - currentNationNameが正しく表示される
  - ハイライトクラスが正しく付与される

---

### 1-4. 国家基本情報の表示
- **着手状態**: 完了
- **依存関係**: Phase 0（完了済み）
- **タスク内容**:
  - 国力ゲージの視覚化（`powerWinThreshold` を上限として使用）
  - `powerWinThreshold === null` の場合はゲージ非表示・数値のみ
  - `isPlayer` フィールドを使いプレイヤー/CPU バッジ表示
  - `isCurrentTurn` の際の枠線 / 背景色CSS定義
  - `NationPanel` に `stage` と `playerNationId` props を追加
  - `GameBoard` 内で `MasterData.getStage(gameState.stageId)` を呼び出してstageをpropsで渡す
- **完了条件**:
  - 国力ゲージが正しく表示される（powerWinThreshold基準）
  - powerWinThresholdがnullの場合はゲージなし
  - プレイヤー/CPU が視覚的に区別される
  - テストが全てパスする
- **優先度**: 🟡 中
- **テスト観点**:
  - 国力ゲージの幅が正しく計算される
  - powerWinThreshold=nullの場合にゲージが非表示
  - isPlayer=trueの場合にプレイヤーバッジが表示される

---

### 1-5. コマンド情報の詳細表示
- **着手状態**: 完了
- **依存関係**: 1-4（GameBoardからstageが渡る設計が必要）
- **タスク内容**:
  - `Command` 型に `description?: string` フィールドを追加
  - `CommandMaster` に説明文を追記
  - コスト表示（内政回数コスト・国力コスト）をボタン内に表示
  - 実行可否判定: `nation.remainingActions < command.costAction` または `nation.power < command.costPower` で `disabled`
  - ホバー時に詳細情報（description）を表示
  - `CommandPanel` に `nation`, `stage` を追加 props として渡す
- **完了条件**:
  - コスト（内政回数・国力）がボタン内に表示される
  - 実行不可能なコマンドが disabled 状態になる
  - ホバー時に効果説明が表示される
  - テストが全てパスする
- **優先度**: 🟡 中
- **テスト観点**:
  - costActionが0以上でremainingActionsが不足の場合にdisabled
  - costPowerが国力を超える場合にdisabled
  - コスト表示が正しく出る
  - descriptionが存在する場合にホバーで表示される

---

### 1-1. ステージ選択画面の実装
- **着手状態**: 完了
- **依存関係**: Phase 0（完了済み）
- **タスク内容**:
  - `Stage` 型に `title?: string`, `description?: string` を追加
  - `StageMaster` の各ステージにタイトル・説明文を追記
  - `StageSelectScreen` コンポーネントを `src/ui/features/` に作成
  - `App.tsx` に `selectedStage: Stage | null` のローカルstateを追加
  - `selectedStage === null` のとき `StageSelectScreen` を表示
  - 選択後に `gameManager.startGame(selectedStage)` を実行
  - `GameEndScreen` からステージ選択に戻るボタンを追加（stateリセット）
  - `hasStarted` refを廃止し `selectedStage` の有無でゲーム起動を制御
- **完了条件**:
  - 複数ステージから選択できる
  - ステージのタイトル・ラウンド数・参加国家数が表示される
  - ゲーム終了後にステージ選択に戻れる
  - テストが全てパスする
- **優先度**: 🟡 中
- **テスト観点**:
  - StageMasterの全ステージが一覧表示される
  - ステージ選択でゲームが開始される
  - ゲーム終了後の「ステージ選択に戻る」ボタンが機能する

---

## 進捗サマリー

| タスク | 状態 | 担当 |
|---|---|---|
| 1-3. UnitCard改善（バグ修正含む） | 完了 | front-professional |
| 1-2. ゲーム状態の可視化 | 完了 | front-professional |
| 1-4. 国家基本情報の表示 | 完了 | front-professional |
| 1-5. コマンド情報の詳細表示 | 完了 | front-professional |
| 1-1. ステージ選択画面の実装 | 完了 | front-professional |

**全体進捗**: 5/5タスク完了 (100%) ✅

---

**最終更新**: 2026年2月21日（Phase 1 全タスク完了）
