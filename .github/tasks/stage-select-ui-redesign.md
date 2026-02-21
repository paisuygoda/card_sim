# タスク: ステージ選択画面UIリデザイン

## 概要
`npm run dev`で起動後のステージ選択画面が文字のみで殺風景なため、ゲームUIとしてふさわしいデザインに改善する。

## 現状
- `StageSelectScreen.tsx` はCSSクラス名を参照しているが、`App.css`に定義が一切ない
- 現クラス名：`stage-select-screen` / `stage-list` / `stage-card` / `stage-title` / `stage-description` / `stage-info`
- テストのdata-testid：`stage-card` / `stage-title` / `stage-round-limit` / `stage-nation-count`

## タスク一覧

### TASK-1: テスト確認（完了条件確認）
- **状態**: スキップ（既存テストが既に通っており、テスト追加は不要）
- **依存**: なし

### TASK-2: UIリデザイン実装
- **状態**: 未着手
- **依存**: TASK-1
- **担当**: front-professional.agent
- **内容**:
  1. `StageSelectScreen.tsx` のJSX構造を改善
  2. `App.css` にステージ選択画面のスタイルを追加
- **完了条件**:
  - テスト8件（StageSelectScreen × 6 + GameEndScreen × 2）が全てパスすること
  - 画面背景が暗色グラデーション（墨色〜深茶）になっている
  - タイトルが金色グロー付きで表示される
  - カードがフェードインアニメーションで表示される
  - カードホバー時に浮き上がり効果と金色ボーダー変化がある
  - 難易度★表示がある
  - 情報バッジ（⚔ラウンド / ⛩国家）が角丸ピル型で表示される
  - インラインスタイルを多用せず、App.cssに集中定義

### TASK-3: logic-guard確認
- **状態**: 未着手
- **依存**: TASK-2

### TASK-4: quality-control確認
- **状態**: 未着手
- **依存**: TASK-3

### TASK-5: cross-aligner確認
- **状態**: 未着手
- **依存**: TASK-4

## 設計仕様（front-planner.agentの計画より）

### カラーパレット（CSS変数）
```css
:root {
  --game-bg-dark:     #1a1209;
  --game-bg-card:     #2d1f0f;
  --game-gold:        #c9a84c;
  --game-gold-light:  #f0d080;
  --game-red:         #c0392b;
  --game-text-primary:#f5e6c8;
  --game-text-muted:  #a89060;
  --game-border:      #5a3a1a;
  --game-border-hover:#c9a84c;
}
```

### レイアウト
- `stage-select-screen`: 100vh, 暗色グラデーション背景, flex中央揃え
- `stage-list`: auto-fitグリッド, minmax(280px, 1fr), gap 1.5rem
- カードに番号バッジ・難易度★・説明文・情報バッジを追加

### アニメーション
- `cardSlideIn`: opacity 0→1 + translateY(20px→0)
- カードに0.1s刻みのstaggerでanimation-delay適用

### JSX変更点
- `<h1>` → `<header>` + h1 + サブタイトル `<p>`
- カードヘッダー（番号バッジ・難易度★）の追加
- 情報部分のアイコン付きバッジ化
- ※ data-testid属性は全て維持: `stage-card` / `stage-title` / `stage-round-limit` / `stage-nation-count`
