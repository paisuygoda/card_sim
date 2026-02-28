# 大規模リファクタリング提案

UI層の設計・構成を根本から見直す改善案をまとめる。  
いずれも複数ファイルに跨がり、テストの書き換えを伴う大きな変更となる。

---

## B-1. AnimationDisplay の責務分割（God Component の解消）

### 現状の問題

`AnimationDisplay.tsx` は **17種類のイベントすべてを1つのswitch文で処理** しており、
ヘルパー関数（`getStateAnimationProps`, `getPhaseDisplayName`, `getUnitName`）も同一ファイルに同居している。
テストファイルも1,748行に膨らんでおり、保守性が低い。

新しいイベントタイプが追加されるたびにこのファイルの肥大化が加速する構造になっている。

### 改善案

**Strategy パターンまたはコンポーネントマッピングでイベントごとの描画を分離する。**

```
src/ui/components/
├── AnimationDisplay.tsx           # ディスパッチャー（10行程度）
└── animations/
    ├── DamageAnimation.tsx        # UNIT_DAMAGE
    ├── HealAnimation.tsx          # UNIT_HEAL
    ├── SkillActivateAnimation.tsx # SKILL_ACTIVATE
    ├── DestroyAnimation.tsx       # UNIT_DESTROY
    ├── PowerChangeAnimation.tsx   # POWER_DAMAGE / POWER_HEAL
    ├── PhaseTransitAnimation.tsx  # PHASE_TRANSIT
    ├── StateChangeAnimation.tsx   # STATE_ADD / STATE_REMOVE
    ├── CommandAnimation.tsx       # COMMAND_EXECUTE
    └── index.ts                   # レジストリ（eventType → Component のMap）
```

`AnimationDisplay.tsx` はレジストリから適切なコンポーネントを取得して描画するだけの薄いラッパーになる。

```tsx
// AnimationDisplay.tsx（リファクタリング後イメージ）
const AnimRenderer = ANIMATION_REGISTRY[animation.eventType];
return AnimRenderer ? <AnimRenderer data={animation.data} /> : <GenericAnimation />;
```

### 影響範囲
- `AnimationDisplay.tsx` の全面書き換え
- `AnimationDisplay.test.tsx`（1,748行）の分割・書き換え
- `AnimationDisplay.simple.test.tsx` の統合または廃止
- `App.css` からアニメーション関連CSSを個別ファイルまたはCSS Modulesへ移動

---

## B-2. CSS の構造化（App.css 巨大ファイルの解体）

### 現状の問題

**全コンポーネントのスタイルが `App.css`（1,020行）に集約** されている。
一部のコンポーネント（`Graveyard.css`, `StateIcon.css`, `StateIconList.css`, `StateTooltip.css`）だけが個別CSSを持つが、
残りの大半のスタイル（ユニットカード、コマンドパネル、アニメーション演出、ステージ選択画面等）はすべてApp.cssに記述されている。

これはクラス名の衝突リスク、スタイルの見通しの悪さ、不要CSSの残存を招く。

### 改善案

**CSS Modules（`.module.css`）をコンポーネント単位で導入する。**

```
src/ui/components/
├── UnitCard.tsx
├── UnitCard.module.css          # UnitCard固有のスタイル
├── CommandPanel.tsx
├── CommandPanel.module.css
├── NationPanel.tsx
├── NationPanel.module.css
├── BattleArea.tsx
├── BattleArea.module.css
├── PhaseDisplay.tsx
├── PhaseDisplay.module.css
└── GameBoard.tsx
    GameBoard.module.css
```

`App.css` にはCSS変数定義・リセットスタイル・グローバルレイアウトのみを残す。

### メリット
- クラス名の名前空間が自動的にスコープされ衝突が発生しない
- 不要CSSの特定・削除が容易になる
- コンポーネント単位でのスタイル管理が可能になる
- Viteの標準機能で追加設定不要

### 影響範囲
- `App.css` の分解（1,020行 → 各コンポーネントに分散）
- 全コンポーネントの `className` を CSS Modules 形式に変更
- テストファイルの `className` 参照への影響（CSS Modulesではクラス名がハッシュ化されるため、`data-testid` 指向に統一するのが望ましい）

---

## B-3. テストインフラの整備（テストデータ・モック戦略の統一）

### 現状の問題

1. **テストデータの大量重複**: `State`, `Unit`, `Nation`, `Command` のモックオブジェクトが5〜7ファイルで重複定義
2. **モック戦略の不統一**: ストアのモック方法が `vi.mock` と `setState` の2パターンに分離
3. **`userEvent` と `fireEvent` の混在**: ユーザー操作シミュレーションの方針が統一されていない
4. **共有テストユーティリティが皆無**: ファクトリ関数もカスタムレンダラーも存在しない

### 改善案

#### 3-1. テストフィクスチャ / ファクトリの共通化

```
src/ui/__tests__/
├── fixtures/
│   ├── units.ts           # createMockUnit(overrides?)
│   ├── nations.ts         # createMockNation(overrides?)
│   ├── states.ts          # createMockState(overrides?)
│   ├── commands.ts        # createMockCommand(overrides?)
│   └── gameState.ts       # createMockGameState(overrides?)
├── helpers/
│   ├── renderWithStore.tsx # Zustand初期状態付きのカスタムrender
│   └── storeUtils.ts      # ストア操作のヘルパー
└── setup.ts               # 共通セットアップ
```

#### 3-2. モック戦略の統一指針

| 対象 | 方針 |
|---|---|
| Zustand ストア | 実ストアの `setState` を使用（モック不要） |
| MasterData | `vi.mock` でモジュール全体をモック |
| ユーザー操作 | `userEvent` に統一（`fireEvent` は非推奨化） |

#### 3-3. 巨大テストファイルの分割

| テストファイル | 行数 | 分割案 |
|---|---:|---|
| AnimationDisplay.test.tsx | 1,748 | イベント種別ごとに分割（B-1と連動） |
| NationPanel.test.tsx | 1,015 | 正常系/ゲージ/ステート表示で分割 |
| DomesticScreen.test.tsx | 1,004 | コマンド選択/ターゲット選択/ユニット選択で分割 |
| App.test.tsx | 937 | ルーティング/初期化/エラーで分割 |

### 影響範囲
- 全テストファイル（18ファイル）の書き換え
- テストユーティリティディレクトリの新設
- CI設定の確認（テストファイル増に伴う実行時間の確認）

---

## B-4. DomesticScreen の状態管理見直し（Feature Component の責務過多）

### 現状の問題

`DomesticScreen.tsx` は **5つの `useState`** を内部で持ち、
コマンド選択 → ターゲット選択（国家 or ユニット）→ 確定の多段階UIフローを1コンポーネントで管理している。

```tsx
const [isSelecting, setIsSelecting] = useState(false);
const [pendingCommand, setPendingCommand] = useState<Command | null>(null);
const [selectingUnitTarget, setSelectingUnitTarget] = useState<UnitSelectionMode>(null);
const [selectedEnemyNation, setSelectedEnemyNation] = useState<Nation | null>(null);
```

これらの状態遷移は暗黙的で、条件分岐が複雑化しバグの温床となる。

### 改善案

**useReducer またはステートマシン（XState等）を用いた明示的な状態遷移管理を導入する。**

```typescript
type DomesticState =
  | { mode: 'COMMAND_SELECT' }
  | { mode: 'TARGET_NATION_SELECT'; pendingCommand: Command }
  | { mode: 'TARGET_UNIT_SELECT'; pendingCommand: Command; targetNation: Nation }
  | { mode: 'SUBMITTING'; command: Command };

type DomesticAction =
  | { type: 'SELECT_COMMAND'; command: Command }
  | { type: 'SELECT_NATION'; nation: Nation }
  | { type: 'SELECT_UNIT'; unitIndex: number }
  | { type: 'CANCEL' }
  | { type: 'SUBMIT_COMPLETE' };
```

さらに、各モード（COMMAND_SELECT, TARGET_NATION_SELECT, TARGET_UNIT_SELECT）の表示を
サブコンポーネントに分割し、DomesticScreenはモードに応じたコンポーネントの切り替えのみを担当する。

```
src/ui/features/domestic/
├── DomesticScreen.tsx               # コンテナ（状態管理 + ルーティング）
├── CommandSelectView.tsx            # コマンド選択ビュー
├── TargetNationSelectView.tsx       # 敵国選択ビュー
├── TargetUnitSelectView.tsx         # ユニット選択ビュー
├── useDomesticReducer.ts            # useReducer定義
└── __tests__/
    ├── DomesticScreen.test.tsx
    ├── CommandSelectView.test.tsx
    ├── TargetNationSelectView.test.tsx
    ├── TargetUnitSelectView.test.tsx
    └── useDomesticReducer.test.ts
```

### 影響範囲
- `DomesticScreen.tsx` の全面書き換え
- `DomesticScreen.test.tsx`（1,004行）の分割・書き換え
- 新規サブコンポーネント・reducer の作成

---

## B-5. App.tsx のルーティングロジック整理

### 現状の問題

`App.tsx` が以下の3つの責務を同時に担っている:
1. **ゲーム初期化** (`useEffect` 内で `GameManager` を生成・起動)
2. **画面ルーティング** (`renderScreen` で `GamePhase` に応じた画面切り替え)
3. **グローバルレイアウト** (ヘッダー、サイドバー、ログパネル)

特に `renderScreen` 内の条件分岐が複雑で、フェーズの追加・変更時に壊れやすい。

### 改善案

**責務を3層に分離する。**

```
src/
├── App.tsx                    # レイアウトのみ（ヘッダー + メイン + サイドバー）
├── GameRouter.tsx             # フェーズ→画面の切り替え専任
├── GameInitializer.tsx        # ゲーム初期化ロジック（useEffect）
└── ui/
    └── components/
        └── LogPanel.tsx       # ログパネル（サイドバーから独立）
```

`GameRouter.tsx`:
```tsx
const PHASE_SCREEN_MAP: Record<string, React.FC> = {
  [GamePhase.DOMESTIC]: DomesticScreen,
  [GamePhase.BATTLE_START]: BattleScreen,
  [GamePhase.ACTION]: ActionScreen,
  [GamePhase.GAME_END]: GameEndScreen,
  // ...
};
```

### 影響範囲
- `App.tsx` の分割
- `App.test.tsx`（937行）の分割・書き換え
- テストの容易化（画面遷移テストとレイアウトテストの分離）
