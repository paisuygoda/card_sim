# Task 1-2: ゲーム状態の可視化（PhaseDisplay / GameBoard 改善）

## 概要
`PhaseDisplay` に `roundLimit` と国家名表示を追加し、`GameBoard` にステージ情報を表示する。
フェーズ遷移時のアニメーションは既存の `AnimationDisplay` + `useUIStateStore` の仕組みを利用する。

---

## 1. 実装前に必要な型定義・データモデルの変更

**型定義の変更は不要。**

`GameState` には既に `roundLimit` フィールドが存在する（`src/core/domain/models/GameState.ts`）。
`Nation.name` も既存フィールド。

`GameBoard` はストアから `gameState` を直接取得しているため、
`PhaseDisplay` の Props を拡張するだけで対応できる。

---

## 2. 実装手順

### Step 1: テストを先に書く

#### `PhaseDisplay` のテスト
**ファイル**: `src/ui/components/__tests__/PhaseDisplay.test.tsx`（新規作成）

テストケース：
- `currentRound=3`, `roundLimit=15` のとき「3 / 15」形式で表示される
- `currentTurnPlayer=1` かつ `nations[1].name='日本'` のとき「日本」と表示される
- `currentPhase=GamePhase.DOMESTIC` のとき「内政フェーズ」と表示される（既存の `phaseNameMap` 検証）

#### `GameBoard` のテスト
**ファイル**: `src/ui/components/__tests__/GameBoard.test.tsx`（新規作成）

テストケース：
- `gameState=null` のとき「ゲームが開始されていません」が表示される
- `gameState.stageId=2` のとき `stageId` が画面上に表示される
- 国家が3件あるとき `NationPanel` が3件レンダリングされる
- `currentTurnPlayer=1` のとき 2番目の `NationPanel` に `isCurrentTurn=true` が渡される

### Step 2: `PhaseDisplay` の Props 拡張と実装
**ファイル**: `src/ui/components/PhaseDisplay.tsx`

Props に以下を追加：

```typescript
interface PhaseDisplayProps {
  currentPhase: GamePhase;
  currentRound: number;
  roundLimit: number;         // 追加
  currentTurnPlayer: number;
  currentNationName: string;  // 追加（"国家1" → 国家名表示）
}
```

表示内容：
- ラウンド: `{currentRound} / {roundLimit}` 形式
- 手番: `{currentNationName}` （国番号ではなく国家名）
- フェーズ: `{phaseNameMap[currentPhase]}`

### Step 3: `GameBoard` の改善
**ファイル**: `src/ui/components/GameBoard.tsx`

変更内容：
- `PhaseDisplay` に `roundLimit` と `currentNationName` を追加で渡す
  ```typescript
  const currentNation = gameState.nations[gameState.currentTurnPlayer];
  <PhaseDisplay
    currentPhase={gameState.currentPhase}
    currentRound={gameState.currentRound}
    roundLimit={gameState.roundLimit}
    currentTurnPlayer={gameState.currentTurnPlayer}
    currentNationName={currentNation?.name ?? `国家${gameState.currentTurnPlayer + 1}`}
  />
  ```
- ステージIDの表示追加: `ステージ {gameState.stageId}` 

### Step 4: `DomesticScreen` / `BattleScreen` での PhaseDisplay 使用箇所確認
**ファイル**: `src/ui/features/DomesticScreen.tsx`, `src/ui/features/BattleScreen.tsx`

`PhaseDisplay` を直接使用している箇所があれば Props 変更に合わせて修正する（現状は `GameBoard` 経由なので不要の可能性が高いが確認必須）。

### Step 5: フェーズ遷移アニメーション（Phase 1 スコープ内で可能な範囲）
既存の `AnimationDisplay` コンポーネントと `GameEvent` を確認し、
`PHASE_CHANGE` イベントが定義されている場合は `PhaseDisplay` に `className` を条件付きで付与して
CSS トランジション（フェードイン）を実装する。

**ファイル**: `src/ui/components/PhaseDisplay.tsx`  
フェーズが変わったことを `useEffect` で検知し、`isTransitioning` フラグで CSS クラスを切り替える。

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);
useEffect(() => {
  setIsTransitioning(true);
  const timer = setTimeout(() => setIsTransitioning(false), 300);
  return () => clearTimeout(timer);
}, [currentPhase]);
```

---

## 3. 実装時の注意点・制約

- `PhaseDisplay` の `currentNationName` Props はオプション（`?`）にしない。未定義時のフォールバックは **呼び出し側（GameBoard）** で解決する
- `GameBoard` はストアから直接 `gameState` を取得しているため、`GameBoard` のテストでは `useGameStateStore` をモック化または直接 set する必要がある
- `DomesticScreen` 内でも `GameBoard` と同様に `PhaseDisplay` を使う場合は Props の変更に注意する

---

## 4. テスト観点

| # | テスト内容 | 優先度 |
|---|-----------|--------|
| T1 | PhaseDisplay: `roundLimit=10` が `X / 10` 形式で表示される | 🔴必須 |
| T2 | PhaseDisplay: 国番号ではなく国家名が表示される | 🔴必須 |
| T3 | PhaseDisplay: 全フェーズで `phaseNameMap` が正しく表示される | 🟡推奨 |
| T4 | PhaseDisplay: フェーズ変化時に `isTransitioning` クラスが付与される | 🟢任意 |
| T5 | GameBoard: `roundLimit` が PhaseDisplay に渡される | 🔴必須 |
| T6 | GameBoard: `currentNationName` が正しく算出・渡される | 🔴必須 |
| T7 | GameBoard: `nations` の数だけ `NationPanel` が描画される | 🔴必須 |

---

## 5. 完了条件

- [ ] `PhaseDisplay` が `roundLimit` を受け取り `ラウンド X / Y` 形式で表示する
- [ ] `PhaseDisplay` が国家名を表示する（「国家1」のような番号表示ではない）
- [ ] `GameBoard` がステージIDを表示する
- [ ] TypeScript コンパイルエラーがない（特に `PhaseDisplay` Props の型一致）
- [ ] 全テストがパスしている
