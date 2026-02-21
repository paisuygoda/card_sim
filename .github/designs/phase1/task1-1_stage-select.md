# Task 1-1: ステージ選択画面の実装

## 概要
ゲーム起動時に表示されるステージ選択画面を実装し、`App.tsx` のハードコードされた `stageId=1` を廃止する。

---

## 1. 実装前に必要な型定義・データモデルの変更

### `Stage` 型への表示用フィールド追加
**ファイル**: `src/core/domain/models/Stage.ts`

```typescript
export interface Stage {
  stageId: number;
  roundLimit: number;
  powerWinThreshold: number | null;
  initialNations: Nation[];
  baseDomesticActions: number;
  
  // ↓ 追加（UI表示用オプションフィールド）
  title?: string;          // 例: "初級：小国の攻防"
  description?: string;    // 例: "2ラウンドで決着をつける入門ステージ"
}
```

**根拠**: `src/core/` 以下への変更はコアロジックに触れないUI表示用の型拡張であり、`copilot-instructions.md` の「UI表示のための型定義追加は可」に該当する。

### `StageMaster` へのメタデータ追記
**ファイル**: `src/core/domain/master/StageMaster.ts`

各ステージエントリに `title` / `description` を追加する。

| stageId | title | description |
|---------|-------|-------------|
| 1 | 初級：小国の攻防 | 決着2ラウンド・対1国。ゲームの基本を学ぼう |
| 2 | 中級：三国鼎立 | 決着15ラウンド・対2国。国力500で勝利 |
| 3 | 上級：覇権争い | 決着20ラウンド・対2国。ラウンド終了時の国力差で決着 |

---

## 2. 実装手順

### Step 1: 型定義の変更（TDD前準備）
1. `src/core/domain/models/Stage.ts` に `title?: string`, `description?: string` を追加
2. `src/core/domain/master/StageMaster.ts` の各ステージに値を追記

### Step 2: テストを先に書く
**ファイル**: `src/ui/features/__tests__/StageSelectScreen.test.tsx`（新規作成）

テストケース：
- ステージ一覧が全件表示される（stageId: 1, 2, 3）
- 各ステージの `title`, `roundLimit`, `powerWinThreshold`, 国家数が表示される
- ステージをクリックすると `onSelectStage(stageId)` が呼ばれる
- `title` が未定義の場合は `ステージ {stageId}` にフォールバック表示される

### Step 3: `StageSelectScreen` コンポーネントの実装
**ファイル**: `src/ui/features/StageSelectScreen.tsx`（新規作成）

```
Props:
  onSelectStage: (stageId: number) => void

内部ロジック:
  - Object.values(STAGE_MASTER) でステージ一覧を取得
  - 各ステージの情報（title, roundLimit, nationCount, powerWinThreshold）を表示
  - ボタンクリックで onSelectStage を呼び出す
```

**注意**: `STAGE_MASTER` を直接インポートする（`MasterData.getStage` はIDが既知の場合用。一覧取得には `STAGE_MASTER` を参照）。
`STAGE_MASTER` は `@core/domain/master/StageMaster` からインポート可。

### Step 4: `App.tsx` への組み込み
**ファイル**: `src/App.tsx`

アプリレベルのルーティング状態を `useState` で管理する（ストアではなく局所状態）。

```typescript
// App.tsx 内
const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

// ステージ未選択の場合は StageSelectScreen を表示
if (!selectedStageId) {
  return <StageSelectScreen onSelectStage={setSelectedStageId} />;
}
// 選択後に useEffect でゲーム初期化
useEffect(() => {
  if (!selectedStageId) return;
  // 既存の initializeGame() を selectedStageId で実行
}, [selectedStageId]);
```

**注意**: `isInitialized` の `useRef` フラグを `selectedStageId` ベースの依存に切り替える。

### Step 5: `features/index.ts` の更新
`StageSelectScreen` をエクスポートに追加する。

---

## 3. 実装時の注意点・制約

- `STAGE_MASTER` は `Record<number, Stage>` 型なので `Object.values()` で全件取得できる
- ゲーム初期化（`GameManager.startGame`）は **ステージ選択後に一度だけ** 実行する必要がある。`isInitialized.current` フラグの代わりに `selectedStageId` の変化を `useEffect` の依存配列で管理することで、多重実行を防ぐ
- `powerWinThreshold` が `null` の場合は「ラウンド終了時の国力差で決着」と表示する
- コアロジック（`GameManager`, `Stage` のゲームロジック部分）には一切変更しない

---

## 4. テスト観点

| # | テスト内容 | 優先度 |
|---|-----------|--------|
| T1 | ステージ一覧（3件）が全て表示される | 🔴必須 |
| T2 | ステージ1の `roundLimit=2` が表示される | 🔴必須 |
| T3 | ステージ2の `nationCount=3` が表示される | 🔴必須 |
| T4 | ステージ3の `powerWinThreshold=null` 時の代替テキスト表示 | 🔴必須 |
| T5 | ステージボタンクリックで `onSelectStage(1)` が呼ばれる | 🔴必須 |
| T6 | `title` 未定義時に `ステージ 1` と表示される（フォールバック） | 🟡推奨 |

---

## 5. 完了条件

- [ ] `Stage` 型に `title?`, `description?` が追加されている
- [ ] `StageMaster` の全ステージに `title` が記述されている
- [ ] `StageSelectScreen` コンポーネントが存在し、3ステージが表示される
- [ ] App 起動時にステージ選択画面が最初に表示される
- [ ] ステージを選択するとゲームが初期化される
- [ ] `stageId=1` のハードコードが `App.tsx` から消えている
- [ ] 全テストがパスしている（`npm test` でエラーなし）
