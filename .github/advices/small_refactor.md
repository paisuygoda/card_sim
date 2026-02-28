# 小規模リファクタリング・改善提案

ファイル単位、数行〜数十行程度の修正で完結する改善案をまとめる。

---

## S-1. テストレポート `.md` ファイルの整理

### 現状

`src/ui/__tests__/App.test.report.md` と `src/ui/features/__tests__/DomesticScreen.test.report.md` がテストディレクトリ内に混在している。

### 改善案

- `.github/advices/` や `docs/` 等の別ディレクトリに移動する
- または `.gitignore` に `*.test.report.md` を追加して管理対象外にする

---

## S-2. TDD赤フェーズのコメント残留の清掃

### 現状

`Graveyard.test.tsx` 等に `@ts-expect-error - TDD Red フェーズのため未実装` のコメントが残っている。
実装済みであればこれらの注釈は実態と乖離しており、混乱の原因となる。

### 改善案

全テストファイルで `TDD Red` や `@ts-expect-error` を `grep` し、不要なものを削除する。

---

## S-3. AnimationDisplay.simple.test.tsx の統合または廃止

### 現状

`AnimationDisplay.simple.test.tsx`（63行）と `AnimationDisplay.test.tsx`（1,748行）が同一ディレクトリに存在し、役割が不明瞭。

### 改善案

- `AnimationDisplay.test.tsx` に内容を統合し、`simple` ファイルを削除する
- または B-1 のアニメーション分割時に合わせて廃止する

---

## S-4. GameEndScreen の勝者判定ロジック移設

### 現状

`GameEndScreen.tsx` 内で勝者判定ロジックがインラインで実装されている:

```tsx
const winner = gameState.nations.reduce((prev, current) => {
  return current.power > prev.power ? current : prev;
});
```

これは設計書の「ゲーム終了フェーズ」の仕様（同一国力の場合の手番優先ルール）を正しく反映していない。
また、UIコンポーネント内にビジネスロジックが混入している。

### 改善案

`GameManager` 側で勝者を確定し `GameState` に `winnerId` を持たせ、UI側は単に表示するだけにする。
もしくは `GameState` の `finalRanking` フィールド（`GAME_END` イベントの `GameEndEventData` には既に定義済み）を活用する。

### 影響ファイル
- `src/ui/features/GameEndScreen.tsx`（ロジック削除、`gameState.finalRanking` 参照へ）

---

## S-5. UnitCard の MasterData 直接参照の除去

### 現状

`UnitCard.tsx` が `MasterData.getSkill()` を直接呼び出してスキル名を取得している:

```tsx
let skillName = '不明なスキル';
try {
  skillName = MasterData.getSkill(unit.skillId).name;
} catch {
  skillName = `スキル(${unit.skillId})`;
}
```

これはUIコンポーネントがマスターデータ層に直接依存しており、テスト時にモックが必要になる。

### 改善案

`Unit` モデルに `skillName` を含めるか、`BattleArea` などの親コンポーネントからpropsでスキル名を渡す。
短期的な対処としては、UIユーティリティ関数に切り出してテスト容易性を上げる。

### 影響ファイル
- `src/ui/components/UnitCard.tsx`

---

## S-6. BattleArea のインデックスベースユニット取得のハードコード

### 現状

`BattleArea.tsx` でユニットの取得が `nation.units[0]`, `[1]`, `[2]` とインデックスで直接アクセスしており、
ポジション定数（`FRONT = 0, MID = 1, BACK = 2`）が定義されていない。

```tsx
const frontUnit = nation.units[0] ?? null;
const midUnit = nation.units[1] ?? null;
const backUnit = nation.units[2] ?? null;
```

### 改善案

ポジション定数を定義して使用する。

```typescript
// src/core/domain/models/Unit.ts に追加
export const POSITION = {
  FRONT: 0,
  MID: 1,
  BACK: 2,
  BENCH_START: 3,
  BENCH_END: 7,
} as const;
```

```tsx
const frontUnit = nation.units[POSITION.FRONT] ?? null;
const midUnit = nation.units[POSITION.MID] ?? null;
const backUnit = nation.units[POSITION.BACK] ?? null;
const benchUnits = nation.units.slice(POSITION.BENCH_START, POSITION.BENCH_END + 1);
```

### 影響ファイル
- `src/core/domain/models/Unit.ts`（定数追加）
- `src/ui/components/BattleArea.tsx`（定数使用）

---

## S-7. NationPanel の `getPowerColor` 関数のテスト可能化

### 現状

`getPowerColor()` は `NationPanel.tsx` 内のモジュールスコープ関数として定義されている。
（exportされていないためテストファイルでは網羅テスト不可）

### 改善案

`src/ui/utils/` に切り出して export し、ユニットテストを追加する。

### 影響ファイル
- `src/ui/utils/nationUI.ts`（新規）
- `src/ui/components/NationPanel.tsx`（インポート変更）

---

## S-8. StateIconList の onHover コールバック未活用

### 現状

`StateIconList` は `StateIcon` の `onHover` に空のコールバックを渡している:

```tsx
<StateIcon
  state={state}
  onHover={(stateId) => {
    // StateIconからのホバーイベントは座標情報がないため、
    // ラッパーdivのイベントで処理
  }}
/>
```

`StateIcon` の `onHover` props自体が不要になっているが、`StateIcon` の API は
`onHover` を期待する設計になっている。

### 改善案

- `StateIcon` から `onHover` propsを削除し、親の `onMouseEnter/Leave` に一本化する
- または `StateIcon` の `onHover` にマウスイベントを含める設計に変更する

### 影響ファイル
- `src/ui/components/StateIcon.tsx`（props変更）
- `src/ui/components/StateIconList.tsx`（空コールバック削除）

---

## S-9. useAnimation フックの isAnimating 計算の冗長性

### 現状

```typescript
isAnimating: animation?.isPlaying ?? false,
```

`animation` が `null` の場合に `false` を返すが、`animation` が存在する場合は必ず `isPlaying === true` である
（`completeAnimation` で `currentAnimation` を `null` にセットしているため）。

### 改善案

`isAnimating: animation !== null` に簡素化するか、ストア側で `isPlaying` フラグを廃止して
`currentAnimation` の有無だけで判定する。

### 影響ファイル
- `src/ui/hooks/useAnimation.ts`
- `src/store/useUIStateStore.ts`

---

## S-10. DomesticScreen の console.log / console.warn の除去

### 現状

`DomesticScreen.tsx` に以下の開発用ログが残存している:

```tsx
console.log('Command selected:', command);
console.log('Command with target selected:', commandWithTarget);
console.log('Command with unit target selected:', commandWithTarget);
console.warn('Invalid state for unit selection');
console.warn('Selected unit does not exist');
console.error('No ENEMY_UNIT command found');
```

### 改善案

開発用ログはbridge経由の `log()` に統一するか、完全に削除する。
必要なエラーハンドリングは `bridge.log()` を使い、一般的な操作ログは削除。

### 影響ファイル
- `src/ui/features/DomesticScreen.tsx`

---

## S-11. getUnitName ヘルパーの重複

### 現状

`AnimationDisplay.tsx` の `getUnitName()` 関数は `gameState` からユニット名を検索する汎用ロジックであり、
将来的に他のコンポーネントでも同様のニーズが発生する可能性が高い。

### 改善案

`src/ui/utils/gameStateHelpers.ts` に移設してexportする。

```typescript
export function getUnitName(
  gameState: GameState | null,
  unitId: string,
  includeGraveyard = false
): string { ... }
```

### 影響ファイル
- `src/ui/utils/gameStateHelpers.ts`（新規）
- `src/ui/components/AnimationDisplay.tsx`（インポート変更）

---

## S-12. StageSelectScreen の getDifficulty マジックナンバー

### 現状

```tsx
const getDifficulty = (stageId: number): number => Math.min(stageId, 3);
```

難易度の上限 `3` がマジックナンバーであり、ステージIDと難易度の関係も仮実装的。

### 改善案

1. `Stage` モデルに `difficulty` フィールドを追加してマスターデータで管理する
2. 短期的には定数化する: `const MAX_DIFFICULTY = 3;`

### 影響ファイル
- `src/ui/features/StageSelectScreen.tsx`

---

## S-13. GameBoard の try/catch による MasterData 取得

### 現状

`GameBoard.tsx`, `BattleScreen.tsx`, `ActionScreen.tsx` で `MasterData.getStage()` を呼ぶたびに
同じ try/catch パターンが繰り返されている:

```tsx
let stage = null;
try {
  if (gameState) {
    stage = MasterData.getStage(gameState.stageId);
  }
} catch {
  stage = null;
}
```

### 改善案

カスタムフック `useStage(stageId)` を作成して共通化する。

```typescript
// src/ui/hooks/useStage.ts
export function useStage(stageId: number | undefined): Stage | null {
  try {
    return stageId !== undefined ? MasterData.getStage(stageId) : null;
  } catch {
    return null;
  }
}
```

### 影響ファイル
- `src/ui/hooks/useStage.ts`（新規）
- `src/ui/components/GameBoard.tsx`
- `src/ui/features/BattleScreen.tsx`
- `src/ui/features/ActionScreen.tsx`
