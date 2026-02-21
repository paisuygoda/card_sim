# Task 1-4: 国家基本情報の表示（NationPanel 改善）

## 概要
`NationPanel` に国力ゲージ、残り内政回数、プレイヤー/NPC 区別、敵対関係の表示を追加する。

---

## 1. 実装前に必要な型定義・データモデルの変更

### `NationPanel` の Props 拡張
**型定義の変更は不要**だが、Props に以下を追加する必要がある：

```typescript
interface NationPanelProps {
  nation: Nation;
  isCurrentTurn: boolean;
  powerWinThreshold: number | null;  // 追加: 国力ゲージの上限表示用
  playerNationId: string;            // 追加: プレイヤー国家IDの判定用
}
```

**`powerWinThreshold` の扱いについて**:  
`Nation` 型に `maxPower` フィールドは存在しない。国力ゲージの上限には `Stage.powerWinThreshold`（= `GameState` にないが `stageId` から取得可能）を使用する。

ただし `GameBoard` は `gameState` を直接参照できるため、`gameState.stageId` → `MasterData.getStage(gameState.stageId).powerWinThreshold` で渡せる。

`powerWinThreshold=null` の場合（ステージ3）は数値ゲージを表示せず、数値テキストのみ表示する。

---

## 2. 実装手順

### Step 1: テストを先に書く
**ファイル**: `src/ui/components/__tests__/NationPanel.test.tsx`（新規作成）

テストケース：
- `isCurrentTurn=true` のとき `current-turn` クラスが付く
- `nation.isNPC=false` かつ `playerNationId=nation.nationId` のとき「プレイヤー」バッジが表示される
- `nation.isNPC=true` のとき「NPC」バッジが表示される
- `nation.power=300`, `powerWinThreshold=500` のとき国力テキスト `300 / 500` が表示される
- `powerWinThreshold=null` のとき数値のみ（`300`）が表示される（ゲージなし）
- 国力ゲージの幅が `(300/500)*100 = 60%` になる
- `nation.remainingActions=2` が表示される
- 敵対国家の表示: `nation.hostileNationIds=['npc1']` かつ他国名が渡された場合に敵対マークが表示される

### Step 2: Props 拡張と `NationPanel` 実装
**ファイル**: `src/ui/components/NationPanel.tsx`

**プレイヤー/NPC 判定**:
- `nation.isNPC === false` かつ `nation.nationId === playerNationId` → 「👑 プレイヤー」バッジ
- `nation.isNPC === true` → 「🤖 NPC」バッジ

**国力ゲージ**:
```tsx
{powerWinThreshold !== null ? (
  <>
    <p>国力: {nation.power} / {powerWinThreshold}</p>
    <div className="power-bar-container">
      <div
        className="power-bar"
        style={{ width: `${Math.min((nation.power / powerWinThreshold) * 100, 100)}%` }}
      />
    </div>
  </>
) : (
  <p>国力: {nation.power}</p>
)}
```

**残り内政回数**:
```tsx
<p>残り内政: {nation.remainingActions} 回</p>
```

**敵対関係の表示**:
Phase 1 スコープでは、`isCurrentTurn=true` の国家に `isHostile` フラグ（`nation.hostileNationIds.includes(currentPlayerNationId)` で算出）を渡し、パネル枠を赤くするだけの簡易実装で可。

### Step 3: `GameBoard` からの Props 渡し
**ファイル**: `src/ui/components/GameBoard.tsx`

```typescript
// GameBoardでstageからpowerWinThresholdを取得
const stage = MasterData.getStage(gameState.stageId);
const playerNation = gameState.nations.find(n => !n.isNPC);

{gameState.nations.map((nation, index) => (
  <NationPanel
    key={nation.nationId}
    nation={nation}
    isCurrentTurn={index === gameState.currentTurnPlayer}
    powerWinThreshold={stage.powerWinThreshold}
    playerNationId={playerNation?.nationId ?? ''}
  />
))}
```

### Step 4: `DomesticScreen` の `NationPanel` 使用箇所確認
`DomesticScreen` は `NationPanel` を直接使用していないが、`BattleArea` を経由して類似情報を表示している場合は確認する。

---

## 3. 実装時の注意点・制約

- `MasterData.getStage` は例外を投げるため、`GameBoard` 内で try-catch するか、`stageId=0` の初期状態に対応できるよう確認する
  - `GameState` の初期値 `stageId=0` の場合は `STAGE_MASTER[0]` が存在しない → `gameState` が `null` のときは `GameBoard` 全体が非表示になるので問題なし
- 国力が `powerWinThreshold` を超える可能性がある（勝利条件達成時）。ゲージ幅は `Math.min(..., 100)` でクランプする
- `hostileNationIds` は `Nation` 型の既存フィールドであり、変更不要

---

## 4. テスト観点

| # | テスト内容 | 優先度 |
|---|-----------|--------|
| T1 | `isCurrentTurn=true` でハイライトクラスが付く | 🔴必須 |
| T2 | プレイヤー国家に「プレイヤー」バッジ表示 | 🔴必須 |
| T3 | NPC 国家に「NPC」バッジ表示 | 🔴必須 |
| T4 | 国力数値が表示される | 🔴必須 |
| T5 | `powerWinThreshold!=null` で `power / threshold` 形式 | 🔴必須 |
| T6 | `powerWinThreshold=null` で数値のみ表示 | 🔴必須 |
| T7 | 国力ゲージの幅が正しい割合 | 🔴必須 |
| T8 | 国力が上限超過時にゲージが 100% でクランプされる | 🟡推奨 |
| T9 | 残り内政回数が表示される | 🔴必須 |
| T10 | 敵対国家の視覚的区別（赤枠等） | 🟢任意 |

---

## 5. 完了条件

- [ ] `NationPanel` に「プレイヤー」/「NPC」バッジが表示される
- [ ] 国力ゲージが `powerWinThreshold` を上限として表示される
- [ ] `powerWinThreshold=null` でゲージが非表示になる（数値のみ）
- [ ] 国力が上限超過時にゲージが 100% を超えない
- [ ] 残り内政回数が表示される
- [ ] `isCurrentTurn=true` 時にハイライトが機能する
- [ ] TypeScript コンパイルエラーがない
- [ ] 全テストがパスしている
