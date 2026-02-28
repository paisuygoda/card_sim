# 中規模リファクタリング提案

一つのタスクとして完結し、数ファイル程度の変更で済む改善案をまとめる。

---

## M-1. useGameActions フックの実装または削除

### 現状

`useGameActions.ts` は **全メソッドがTODO（未実装）** のまま放置されている。
`initializeGameManager`, `startGame`, `executeCommand`, `getCurrentGameState` すべてが空関数。

実際のゲーム初期化は `App.tsx` の `useEffect` 内で直接 `GameManager` と `ReactUIBridge` を生成しており、
このフックは一切使用されていない。

### 改善案

**選択肢A: 削除する**
- 現在どこからも参照されていないため、デッドコードとして削除。
- `hooks/index.ts` の export からも除去。

**選択肢B: App.tsx の初期化ロジックをこのフックに移植して活用する**
- `App.tsx` の `useEffect` 内にある GameManager 生成・起動ロジックをこのフックに集約。
- `App.tsx` はフックの返り値のみを利用する薄い形になる。

### 影響ファイル
- `src/ui/hooks/useGameActions.ts`
- `src/ui/hooks/index.ts`
- （選択肢Bの場合）`src/App.tsx`

---

## M-2. PhaseDisplay と AnimationDisplay のフェーズ名マップ重複解消

### 現状

`GamePhase` の日本語名変換が **2箇所で独立して定義** されている:
- `PhaseDisplay.tsx` の `phaseNameMap`
- `AnimationDisplay.tsx` の `getPhaseDisplayName()`

内容はほぼ同一だが微妙に差異がある（AnimationDisplay側は `ALWAYS`, `SCOUT_CALCULATION`, `BATTLE_CALCULATION`, `EARLY_VICTORY` も含む）。

### 改善案

共通ユーティリティとして `src/ui/utils/phaseDisplay.ts` に統合する。

```typescript
// src/ui/utils/phaseDisplay.ts
export const PHASE_DISPLAY_NAMES: Record<string, string> = {
  [GamePhase.GAME_START]: 'ゲーム開始',
  // ... 全フェーズ網羅
  'EARLY_VICTORY': '早期勝利',
};

export function getPhaseDisplayName(phase: string): string {
  return PHASE_DISPLAY_NAMES[phase] ?? phase;
}
```

### 影響ファイル
- `src/ui/utils/phaseDisplay.ts`（新規）
- `src/ui/utils/index.ts`（export追加）
- `src/ui/components/PhaseDisplay.tsx`（インポート変更）
- `src/ui/components/AnimationDisplay.tsx`（ヘルパー関数削除、インポート変更）

---

## M-3. ReactUIBridge の waitUI ポーリング改善

### 現状

`ReactUIBridge.waitUI()` は **50msのsetTimeoutポーリング** でキューの空きを監視している。

```typescript
async waitUI(): Promise<void> {
  const store = useUIStateStore.getState();
  while (store.hasAnimationInQueue() || store.isAnimationPlaying()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
```

この実装には以下の問題がある:
1. **ストアのスナップショットが更新されない**: `getState()` をループ外で1度だけ呼んでいるため、`store.hasAnimationInQueue()` は常に初期値を返す可能性がある（Zustandのgetstate呼び出しは関数参照を返すので実際には動くが、意図が不明瞭）。
2. **不必要なCPU消費**: ビジーウェイトに近い。

### 改善案

Zustand の `subscribe` を使ったイベント駆動型待機に変更する。

```typescript
async waitUI(): Promise<void> {
  const store = useUIStateStore;
  
  // 既にキューが空で再生中でもなければ即座にreturn
  const state = store.getState();
  if (!state.hasAnimationInQueue() && !state.isAnimationPlaying()) {
    return;
  }

  return new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe((state) => {
      if (!state.hasAnimationInQueue() && !state.isAnimationPlaying()) {
        unsubscribe();
        resolve();
      }
    });
  });
}
```

### 影響ファイル
- `src/bridge/ReactUIBridge.ts`

---

## M-4. Graveyard コンポーネントの表示/非表示ロジック改善

### 現状

`GameBoard.tsx` で全国家の墓地を常にレンダリングしている。
墓地が空の場合も「墓地は空です」というメッセージが表示され続ける。

```tsx
<Graveyard graveyard={nation.graveyard} nationName={nation.name} />
```

一方、`BattleScreen.tsx` では墓地が一切表示されない。

### 改善案

1. 墓地が空の場合は表示をスキップする（または折りたたみにする）
2. BattleScreen にも墓地の表示を追加（戦闘中にユニットが倒れた場合の視認性）
3. 墓地ユニット数をバッジ表示にし、クリックで展開するアコーディオンUIにする

### 影響ファイル
- `src/ui/components/Graveyard.tsx`
- `src/ui/components/GameBoard.tsx`
- `src/ui/features/BattleScreen.tsx`
- `src/ui/components/Graveyard.css`

---

## M-5. BattleScreen と ActionScreen の共通レイアウト抽出

### 現状

`BattleScreen.tsx` と `ActionScreen.tsx` はどちらも以下のパターンを繰り返している:
1. `gameState` を取得
2. `MasterData.getStage()` でステージ情報を取得
3. `powerWinThreshold` を取得
4. `NationPanel` と `BattleArea` を国家ごとにレンダリング

コード構造がほぼ同一であり、DRY原則に反している。

### 改善案

共通の `NationLayoutGrid` コンポーネントを抽出する。

```tsx
// src/ui/components/NationLayoutGrid.tsx
interface NationLayoutGridProps {
  nations: { nation: Nation; label: string; isHighlighted?: boolean }[];
  powerWinThreshold: number | null;
  currentAttacker?: Unit;
}

export const NationLayoutGrid: React.FC<NationLayoutGridProps> = ({ nations, ... }) => (
  <div className="nation-layout-grid">
    {nations.map(({ nation, label, isHighlighted }) => (
      <div key={nation.nationId} className={isHighlighted ? 'highlighted' : ''}>
        <h3>{label}</h3>
        <NationPanel nation={nation} ... />
        <BattleArea nation={nation} ... />
      </div>
    ))}
  </div>
);
```

### 影響ファイル
- `src/ui/components/NationLayoutGrid.tsx`（新規）
- `src/ui/features/BattleScreen.tsx`（リファクタ）
- `src/ui/features/ActionScreen.tsx`（リファクタ）

---

## M-6. コマンド実行可否ロジックの分離（CommandPanel）

### 現状

`CommandPanel.tsx` 内でコマンドの実行可否判定ロジックがインラインで記述されている:

```tsx
const isDisabled =
  disabled ||
  nation.remainingActions < command.costAction ||
  nation.power < command.costPower ||
  nullCount < command.unitSpace;
```

この判定ロジックはUIの関心事ではなくビジネスロジックであり、
同じ判定がNPCの思考ロジック側でも必要になる可能性がある。

### 改善案

`src/core/domain/logic/` に判定関数を配置し、UI側はそれを呼び出すだけにする。

```typescript
// src/core/domain/logic/CommandLogic.ts
export function isCommandExecutable(command: Command, nation: Nation): boolean {
  const nullCount = nation.units.filter((u) => u === null).length;
  return (
    nation.remainingActions >= command.costAction &&
    nation.power >= command.costPower &&
    nullCount >= command.unitSpace
  );
}
```

### 影響ファイル
- `src/core/domain/logic/CommandLogic.ts`（新規）
- `src/ui/components/CommandPanel.tsx`（インラインロジック削除、関数呼び出しへ）
- テスト: 純粋関数のユニットテスト追加

---

## M-7. hooks のテスト追加

### 現状

`useAnimation.ts` と `useGameActions.ts` のどちらにもテストが存在しない。
特に `useAnimation` はアニメーション制御の中核であり、`AnimationDisplay` から多用されているにもかかわらずテストがない。

### 改善案

`@testing-library/react` の `renderHook` を使ったフックテストを追加する。

```
src/ui/hooks/__tests__/
├── useAnimation.test.ts
└── useGameActions.test.ts      # M-1で削除しない場合
```

テスト項目例:
- `useAnimation` がストアの `currentAnimation` を正しく返すか
- `onAnimationComplete` が `completeAnimation` を正しく呼び出すか
- `isAnimationType` がイベントタイプを正しく判定するか
- `useAnimationEffect` が指定タイミングで自動完了するか

### 影響ファイル
- `src/ui/hooks/__tests__/useAnimation.test.ts`（新規）
