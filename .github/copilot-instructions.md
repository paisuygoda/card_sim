# GitHub Copilot Instructions: 国家運営シミュレーションゲーム

あなたは本プロジェクトのリードエンジニアとして、以下の設計思想、アーキテクチャ、および実装ルールを厳守してコードを生成・修正してください。

## 1. コア・コンセプト：非同期連携アーキテクチャ
本ゲームではUI演出・ユーザー入力とゲームロジックを同期させるため、以下のアーキテクチャを採用します。

- **Logic Layer (Pure Functions):** 計算ロジックは副作用を持たず、状態を受け取り結果を返すだけの純粋関数にする。
- **Process Layer (Async/Await):** ゲームの進行（フェーズ遷移やターン処理）は `async/await` とループで管理し、各ステップで演出の完了を待機する。
- **Bridge Layer (Interface):** ロジックからUIへの通知は `IGameUIBridge` を経由し、UI側の演出が終わるまでロジックを一時停止（await）させる。

## 2. ディレクトリ構成ルール
プロジェクト構造は、React（UI）とゲームエンジン（Core）を厳格に分離します。

```text
src/
├── core/                 # ゲームエンジン（React非依存）
│   ├── domain/
│   │   ├── models/       # Entity型定義（Nation, Unit, State, Command, Effect, GameState, GamePhase, Skill, Stage, BattleContext, TargetPattern）
│   │   ├── logic/        # 計算関数群（BattleLogic, EffectExecutor, GameMath, NPCLogic, NationManager, PriorityManager, StateExecutor, UnitManager）
│   │   │   └── effects/  # 効果種別ごとの実装（powerEffects, unitHPEffects, unitAttackEffects, unitSummonEffects, stateEffects, commandEffects, actionEffects）
│   │   └── master/       # マスターデータ定義（StageMaster, UnitMaster, SkillMaster, StateMaster, CommandMaster, EffectMaster, NationMaster）
│   ├── application/      # 進行制御
│   │   └── GameManager.ts# ゲームループ（Async）
│   └── infrastructure/   # 外部接続インターフェース
│       └── IGameUIBridge.ts # GameEvent, InputRequest, 各イベントデータ型も定義
├── bridge/               # UI連携の実装（React State等との接続）
│   └── ReactUIBridge.ts  # 本番用（Zustand連携）
├── store/                # 状態管理（Zustand、CoreとUIの共有）
│   ├── useGameStateStore.ts  # ゲーム状態（GameState）
│   └── useUIStateStore.ts    # UI状態（アニメーションキュー、入力待ち、ログ）
└── ui/                   # Reactコンポーネント
    ├── components/       # 共通パーツ（GameBoard, BattleArea, UnitCard, NationPanel, CommandPanel, PhaseDisplay, AnimationDisplay, Graveyard, StateIcon, StateIconList, StateTooltip）
    ├── features/         # 画面単位（StageSelectScreen, DomesticScreen, BattleScreen, ActionScreen, GameEndScreen）
    ├── hooks/            # カスタムフック（useAnimation, useGameActions）
    └── utils/            # UIユーティリティ（stateUI）
```

## 3. 実装の鉄則（重要）
1. ゲーム中の出来事は必ずUIと連携: - 戦闘や内政のループ内で適宜 await bridge.notifyGameEvent(...) を呼び出し画面側の状態も更新すること。
  人間が進行を視認できるよう、必ず演出待機時間を確保すること。
2. 依存性の逆転: - src/core/ 以下のコードから src/ui/ や React の Hooks を直接インポートしてはならない。
3. TDDの徹底: - 具体的な機能を実装する際は機能要件が確実に守られるようテスト駆動で開発すること。

## 4. docsディレクトリ
`docs/` ディレクトリは企画段階のドキュメント保存用です。詳細設計書.md以外のファイルには古い仕様の記述が含まれるため極力参照しないこと

## 5. リポジトリ概要（エージェント探索ガイド）

### 技術スタック
- **ランタイム**: React 18 + TypeScript + Vite
- **状態管理**: Zustand（`src/store/`）
- **テスト**: Vitest + @testing-library/react + jsdom
- **CLIテスト**: `tsx src/cli-test.ts`（`npm run play`）

### アーキテクチャ概要
ゲームロジック（`core/`）は React に依存しない純粋なTypeScript。`GameManager`（async/await）がゲームループを駆動し、`IGameUIBridge` インターフェース経由でUI側に演出通知を行う。UI側では `ReactUIBridge` がZustandストアを更新し、Reactコンポーネントがストアを購読して描画する。

### データフロー
```
GameManager → IGameUIBridge.notifyGameEvent() → ReactUIBridge → useUIStateStore（animationQueue） → AnimationDisplay（演出描画・自動完了）
GameManager → IGameUIBridge.updateGameState() → ReactUIBridge → useGameStateStore（gameState） → 各コンポーネント（状態反映）
GameManager → IGameUIBridge.waitPlayerInput() → ReactUIBridge → useUIStateStore（input） → DomesticScreen（プレイヤー操作） → completeInput() → GameManagerに結果返却
```

### 主要ファイルの役割
| ファイル | 役割 |
|---|---|
| `src/App.tsx` | ルートコンポーネント。ステージ選択→ゲーム初期化→フェーズに応じた画面切り替え・ログパネル表示 |
| `src/core/application/GameManager.ts` | ゲーム進行制御。ラウンド・ターン・フェーズをasync/awaitで順次実行 |
| `src/core/infrastructure/IGameUIBridge.ts` | Bridge インターフェース定義。`GameEvent` enum、`InputRequest` enum、各イベントデータ型を含む |
| `src/bridge/ReactUIBridge.ts` | IGameUIBridge の本番実装。notifyGameEvent→キュー追加、waitUI→キュー空き待機、waitPlayerInput→Promise |
| `src/store/useGameStateStore.ts` | ゲーム状態（GameState）をZustandで管理 |
| `src/store/useUIStateStore.ts` | アニメーションキュー、入力待ち、ログをZustandで管理。animationQueue/currentAnimation/input/logs |
| `src/core/domain/master/*.ts` | ゲームのマスターデータ定義。`MasterData` オブジェクト（`src/core/domain/master/index.ts`）経由でアクセス |
| `src/core/domain/logic/effects/*.ts` | EffectType ごとの効果処理実装 |

### UIコンポーネント構成
- **画面遷移**: `App.tsx` が `GamePhase` と `input.isWaiting` に基づき画面を切り替え
  - ステージ未選択 → `StageSelectScreen`
  - DOMESTIC + 入力待ち → `DomesticScreen`
  - BATTLE_START / ATTACK_START / BATTLE_END → `BattleScreen`
  - ACTION → `ActionScreen`
  - GAME_END → `GameEndScreen`
  - その他 → `GameBoard`（デフォルト）
- **AnimationDisplay**: `useUIStateStore` の `currentAnimation` を購読し、イベント種別ごとに演出をレンダリング。各演出はタイマーで自動完了
- **DomesticScreen**: コマンド選択→ターゲット選択（国家/ユニット）の多段階UIをuseStateで管理

### テストの配置
- `src/ui/components/__tests__/` — UIコンポーネントのみ
- `src/ui/features/__tests__/` — 画面コンポーネント
- `src/ui/__tests__/` — App.tsx
- `src/ui/utils/__tests__/` — ユーティリティ
- `src/core/domain/logic/__tests__/` — ロジック
- `src/core/domain/master/__tests__/` — マスターデータ
- `src/core/application/__tests__/` — GameManager