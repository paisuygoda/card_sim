# Phase 1: UI表示強化 — 詳細実装計画 概要

> front-planner.agent 作成日: 2026-02-20

---

## タスク一覧と依存関係

```
1-1 ステージ選択画面
  └── 依存なし（独立）

1-2 ゲーム状態可視化
  └── 依存なし（独立）

1-3 UnitCard改善 ← 🔴 最優先バグ修正含む
  └── 依存なし（独立）

1-4 NationPanel改善
  └── 1-2 完了後に実施推奨（GameBoardからのProps渡し変更が重なるため）

1-5 CommandPanel改善
  └── 依存なし（独立）
```

**推奨実施順序**: 1-3（バグ修正）→ 1-5（UI完成度）→ 1-2 → 1-4（1-2と連動）→ 1-1

---

## 型定義の変更サマリー

| ファイル | 変更内容 | 種別 |
|---------|---------|------|
| `src/core/domain/models/Stage.ts` | `title?: string`, `description?: string` 追加 | UI表示用 |
| `src/core/domain/models/Command.ts` | `description?: string` 追加 | UI表示用 |
| `src/core/domain/master/StageMaster.ts` | 各ステージに `title`, `description` 追記 | マスターデータ |
| `src/core/domain/master/CommandMaster.ts` | 各コマンドに `description` 追記 | マスターデータ |
| `src/ui/components/PhaseDisplay.tsx` | Props拡張: `roundLimit`, `currentNationName` | UI Props |
| `src/ui/components/NationPanel.tsx` | Props拡張: `powerWinThreshold`, `playerNationId` | UI Props |
| `src/ui/components/CommandPanel.tsx` | Props拡張: `currentPower`, `remainingActions` | UI Props |

---

## 新規作成ファイルサマリー

| ファイル | 内容 |
|---------|------|
| `src/ui/features/StageSelectScreen.tsx` | ステージ選択画面コンポーネント |
| `src/ui/features/__tests__/StageSelectScreen.test.tsx` | 上記テスト |
| `src/ui/components/__tests__/PhaseDisplay.test.tsx` | PhaseDisplayテスト |
| `src/ui/components/__tests__/GameBoard.test.tsx` | GameBoardテスト |
| `src/ui/components/__tests__/UnitCard.test.tsx` | UnitCardテスト |
| `src/ui/components/__tests__/NationPanel.test.tsx` | NationPanelテスト |
| `src/ui/components/__tests__/CommandPanel.test.tsx` | CommandPanelテスト |

---

## Phase 1 全体の完了条件

- [ ] 全タスクのテストがパスする (`npm test` エラーゼロ)
- [ ] TypeScript コンパイルエラーがゼロ
- [ ] `unit.skill.name` のランタイムクラッシュが解消されている
- [ ] ゲーム起動時にステージ選択画面が表示される
- [ ] ラウンド数が「X / Y」形式で表示される
- [ ] HPバーが表示される
- [ ] 国力ゲージが表示される
- [ ] コマンドの実行可否が視覚的に判断できる
- [ ] `src/core/` から `src/ui/` へのインポートが存在しない

---

## 各タスクの詳細設計ドキュメント

- [task1-1_stage-select.md](./task1-1_stage-select.md)
- [task1-2_game-state-visualization.md](./task1-2_game-state-visualization.md)
- [task1-3_unit-card.md](./task1-3_unit-card.md)
- [task1-4_nation-panel.md](./task1-4_nation-panel.md)
- [task1-5_command-panel.md](./task1-5_command-panel.md)
